import warnings
warnings.filterwarnings('ignore', category=FutureWarning)
warnings.filterwarnings('ignore', message='Some weights of the model checkpoint')
warnings.filterwarnings('ignore', message='Asking to truncate to max_length')

import re
import os
import json
import requests
import logging
from flask import Flask, request, jsonify
from transformers import pipeline
import argostranslate.package
import argostranslate.translate
from dotenv import load_dotenv

load_dotenv()
# Set transformers logging to error level only
logging.getLogger("transformers").setLevel(logging.ERROR)

# --- 1. CONFIGURATION ---
ID_SENT = "cardiffnlp/twitter-roberta-base-sentiment-latest"
OLLAMA_URL = os.getenv("OLLAMA_URL")
OLLAMA_MODEL = "mistral:7b-instruct"

# --- 2. GLOBAL MODEL LOADING PORT---
MODELS = {}

def load_models():
    try:
        print("🔧 Loading models...")
        
        # 1. Translation (ArgosTranslate for Hindi -> English)
        print("   - Setting up ArgosTranslate for Hindi -> English")
        
        # Check if Hindi-English package is installed
        installed_packages = argostranslate.package.get_installed_packages()
        hindi_to_english = any(pkg.from_code == "hi" and pkg.to_code == "en" for pkg in installed_packages)
        
        if not hindi_to_english:
            print("     - Installing Hindi-English translation package...")
            available_packages = argostranslate.package.get_available_packages()
            package_to_install = next(
                (pkg for pkg in available_packages if pkg.from_code == "hi" and pkg.to_code == "en"), None
            )
            if package_to_install:
                argostranslate.package.install_from_path(package_to_install.download())
                print("     - Hindi-English package installed")
            else:
                print("     - ⚠️ Hindi-English package not found")
        else:
            print("     - Hindi-English package already installed")

        # 2. Test Ollama connection
        print("   - Testing Ollama connection...")
        try:
            test_url = OLLAMA_URL.replace('/api/generate', '/api/tags')
            test_response = requests.get(test_url, timeout=5)
            if test_response.status_code == 200:
                print("   - ✅ Ollama connection successful")
                MODELS['ollama_available'] = True
            else:
                print("   - ⚠️ Ollama connection failed, will use fallback")
                MODELS['ollama_available'] = False
        except Exception as e:
            print(f"   - ⚠️ Ollama connection error: {e}")
            MODELS['ollama_available'] = False

        # 3. Sentiment (Twitter RoBERTa)
        print(f"   - Loading Sentiment: {ID_SENT}")
        MODELS['sent_pipeline'] = pipeline("text-classification", model=ID_SENT, device=-1, max_length=512, truncation=True)
        
        print("✅ All Models Loaded Successfully.")
        
    except Exception as e:
        print(f"❌ Critical Model Load Error: {e}")
        raise e

with open('post.json', 'r') as f:
    POST_DATA = json.load(f)[0] # Assuming single post for demo

# Create a quick lookup dictionary: "Q1" -> "Suggest specific changes..."
CLAUSE_MAP = {c['id']: c['text'] for c in POST_DATA['clauses']}
DRAFT_TITLE = POST_DATA['title']

# --- 3. CORE PROCESSING LOGIC ---

def detect_and_translate(text):
    """ArgosTranslate translation from Hindi to English"""
    if not text:
        return "", "English"

    if re.search(r'[\u0900-\u097F]', text):
        try:
            translated_text = argostranslate.translate.translate(text, "hi", "en")
            if translated_text and translated_text.strip() != text.strip():
                return translated_text, "Hindi"
        except Exception as e:
            print(f"Translation Error: {e}")
        return text, "Hindi (Translation Failed)"
            
    return text, "English"

def get_legal_summary(text, comment_type="Overall"):
    """Generate summary using Ollama Mistral API with context grounding"""
    try:
        clean_id = comment_type.split(',')[0].strip() if comment_type else "Overall"

        # Determine context
        if clean_id in CLAUSE_MAP:
            context_text = CLAUSE_MAP[clean_id]
            context_label = f"Specific Clause ({clean_id})"
        else:
            context_text = DRAFT_TITLE
            context_label = "Overall Policy Draft"

        # Construct prompt
        prompt = f"Document Context: {context_text}\nUser Comment on {context_label}: \"{text.strip()}\"\nTask: Summarize the user's main argument regarding this specific context in one sentence."

        # Ollama API call
        if MODELS.get('ollama_available'):
            payload = {
                "model": OLLAMA_MODEL,
                "prompt": prompt,
                "stream": False,
                "options": {"temperature": 0.3, "max_tokens": 100, "top_p": 0.9}
            }
            
            response = requests.post(OLLAMA_URL, json=payload, timeout=30)
            if response.status_code == 200:
                return response.json().get('response', 'Summary unavailable.').strip()
        
        # Fallback: extractive summary
        sentences = text.split('.')
        return (sentences[0].strip() + ".") if len(sentences) > 1 else (text[:100] + "..." if len(text) > 100 else text)

    except Exception as e:
        print(f"Summarization Error: {e}")
        return "Summary unavailable."

def get_twitter_sentiment(text):
    """Get sentiment using Twitter RoBERTa"""
    try:
        result = MODELS['sent_pipeline'](text[:512])[0]
        return result['label'].capitalize(), round(result['score'], 4)
    except Exception as e:
        print(f"Sentiment Error: {e}")
        return "Neutral", 0.0

# --- 4. FLASK APP ---

app = Flask(__name__)

# Load models on startup
with app.app_context():
    load_models()

@app.route("/analyze", methods=["POST"])
def analyze_comment():
    try:
        data = request.get_json()
        raw_comment = data.get("comment", "").strip()
        comment_type = data.get("commentType", "Overall")
        
        if not raw_comment:
            return jsonify({"success": False, "error": "Empty comment"}), 400

        # Process comment
        final_english_text, detected_lang = detect_and_translate(raw_comment)
        sentiment, score = get_twitter_sentiment(final_english_text)
        summary = get_legal_summary(final_english_text, comment_type)

        return jsonify({
            "success": True,
            "original_text": raw_comment,
            "analyzed_text": final_english_text,
            "detected_language": detected_lang,
            "sentiment": sentiment,
            "sentiment_score": score,
            "ai_summary": summary
        })

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route("/status", methods=["GET"])
def status():
    return {
        "status": "active",
        "model_translation": "argostranslate (hi->en)",
        "model_summary": f"ollama:{OLLAMA_MODEL}" if MODELS.get('ollama_available') else "fallback",
        "model_sentiment": ID_SENT,
        "ollama_available": MODELS.get('ollama_available', False)
    }

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8080))
    app.run(debug=True, host='0.0.0.0', port=port, use_reloader=False)