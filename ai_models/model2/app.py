import os
import json
import torch
import re
from flask import Flask, request, jsonify
from transformers import pipeline as hf_pipeline
from deep_translator import GoogleTranslator
from langdetect import detect
from google.cloud import translate_v2 as translate

# --- 1. CONFIGURATION & SETUP ---

# Set Google Cloud credentials directly as requested
try:
    SERVICE_ACCOUNT = os.getenv("SERVICE_ACCOUNT")
    if SERVICE_ACCOUNT:
        os.environ["SERVICE_ACCOUNT"] = SERVICE_ACCOUNT

    # os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = "google_key.json"
    translate_client = translate.Client()
    print("✅ Google Cloud Translate client loaded successfully.")
except Exception as e:
    print(f"❌ WARNING: Could not initialize Google Cloud Translate client: {e}")
    translate_client = None

MODEL_CACHE_DIR = "./model_cache"
DEVICE = "cuda" if torch.cuda.is_available() else "cpu"


# --- 2. MODEL & DATA LOADING ---

def load_models():
    """Loads all AI models and returns them in a dictionary."""
    print("--- Loading AI Models ---")
    models = {
        "summarizer": None,
        "sentiment_model": None,
        "label_mapping": {}
    }
    
    # Load Summarizer (FLAN-T5)
    try:
        print(f"Loading Summarizer on device: {DEVICE}")
        models["summarizer"] = hf_pipeline(
            "text2text-generation",
            model="google/flan-t5-base",
            device=0 if DEVICE == "cuda" else -1,
            model_kwargs={"cache_dir": MODEL_CACHE_DIR}
        )
        print("✅ Summarizer loaded successfully.")
    except Exception as e:
        print(f"❌ ERROR: Could not load summarizer: {e}")

    # Load Sentiment Analyzer (RoBERTa)
    try:
        print("Loading Sentiment Analyzer...")
        models["sentiment_model"] = hf_pipeline(
            "sentiment-analysis", 
            model="cardiffnlp/twitter-roberta-base-sentiment"
        )
        models["label_mapping"] = {"LABEL_0": "Negative", "LABEL_1": "Neutral", "LABEL_2": "Positive"}
        print("✅ Sentiment Analyzer loaded successfully.")
    except Exception as e:
        print(f"❌ ERROR: Could not load sentiment model: {e}")
        
    print("--- Model loading complete ---")
    return models

def load_draft_context():
    """Loads draft context from JSON."""
    try:
        with open('draft_context.json', 'r', encoding='utf-8') as f:
            return json.load(f)
    except FileNotFoundError:
        return {"subject": "Indian Multi-Disciplinary Partnership (MDP) firms"}


# --- 3. AI SERVICES ---

def translate_text(text: str) -> tuple[str, str]:
    """
    Optimized language detection and translation logic:
    - English: No translation needed
    - Hindi: Use deep_translator (free model)
    - Hinglish: Use Google Cloud API (paid)
    """
    if not text or not text.strip():
        return ("", "Empty")

    try:
        lang = detect(text)
    except Exception:
        lang = "en"  # Default to English if detection fails

    # Enhanced Hindi/Hinglish word detection with comprehensive word list
    hindi_words = [
        # Common Hindi words
        'hai', 'hain', 'ke', 'ki', 'ka', 'ko', 'se', 'mein', 'par', 'aur', 
        'yeh', 'woh', 'kya', 'kaise', 'jo', 'bhi', 'liye', 'kuch', 'sab', 
        'log', 'kaam', 'achha', 'bura', 'theek', 'nahi', 'haan', 'mai', 
        'tum', 'hum', 'aise', 'waise', 'kab', 'kaha', 'kyun', 'matlab',
        # Hinglish specific words and phrases
        'yaar', 'bhai', 'dude', 'bilkul', 'sabse', 'zyada', 'kam', 'bahut', 
        'thoda', 'bohat', 'actually', 'seriously', 'basically', 'obviously',
        # Common Hinglish patterns
        'kar', 'karna', 'karte', 'kiya', 'kiye', 'dekh', 'dekha', 'dekhe',
        'bol', 'bola', 'bole', 'sun', 'suna', 'sune', 'lagta', 'laga', 'lage',
        # Mixed expressions
        'itna', 'utna', 'jitna', 'kitna', 'abhi', 'phir', 'fir', 'tab',
        'jab', 'agar', 'lekin', 'magar', 'isliye', 'isiliye', 'waisa', 'jaisa'
    ]
    
    text_lower = text.lower()
    hindi_word_count = sum(1 for word in hindi_words if re.search(r'\b' + re.escape(word) + r'\b', text_lower))
    
    # Check for Devanagari script (pure Hindi)
    has_devanagari = bool(re.search(r'[\u0900-\u097F]', text))
    
    # Check for English words to detect mixing
    english_pattern = r'\b[a-zA-Z]{3,}\b'
    english_words = len(re.findall(english_pattern, text))
    total_words = len(text.split())
    
    # Improved language classification logic
    if lang == "en" and hindi_word_count == 0 and not has_devanagari:
        language_type = "English"
        print(f"Detected: Pure English")
        return (text, language_type)
    
    elif has_devanagari and hindi_word_count >= 1 and english_words <= total_words * 0.3:
        language_type = "Hindi"
        print(f"Detected: Pure Hindi (Devanagari: {has_devanagari}, Hindi words: {hindi_word_count})")
    
    elif (hindi_word_count >= 2 and english_words >= 1) or (lang == "en" and hindi_word_count >= 2):
        language_type = "Hinglish"
        print(f"Detected: Hinglish (Hindi words: {hindi_word_count}, English words: {english_words})")
    
    elif lang == "hi" or hindi_word_count >= 3:
        language_type = "Hindi"
        print(f"Detected: Hindi (langdetect: {lang}, Hindi words: {hindi_word_count})")
    
    else:
        language_type = lang.upper()
        print(f"Detected: Other language ({lang})")

    # Translation logic based on language type
    print(f"Language Type: {language_type}. Starting translation...")
    
    # Pure Hindi: Use free deep_translator model
    if language_type == "Hindi":
        try:
            print("[FREE MODEL] Using deep_translator for pure Hindi.")
            translated = GoogleTranslator(source="hi", target="en").translate(text)
            return (translated or text, language_type)
        except Exception as e:
            print(f"Hindi translation failed: {e}. Returning original text.")
            return (text, language_type)
    
    # Hinglish: Use Google Cloud API (paid) for better mixed-language handling
    elif language_type == "Hinglish" and translate_client:
        try:
            print("[PAID API] Using Google Cloud API for Hinglish translation.")
            result = translate_client.translate(text, target_language='en')
            translated_text = result['translatedText']
            return (translated_text, language_type)
        except Exception as e:
            print(f"Google Cloud translation failed: {e}. Falling back to free translator.")
    
    # Fallback to free translator for all other cases
    try:
        print(f"[FREE] Using deep_translator for {language_type}.")
        translated = GoogleTranslator(source="auto", target="en").translate(text)
        return (translated or text, language_type)
    except Exception as e:
        print(f"Free translation failed: {e}. Returning original text.")
        return (text, language_type)


def generate_summary(text: str):
    """Generate an analytical summary with settings optimized for variety."""
    if MODELS["summarizer"] is None:
        return "Summary unavailable - model not loaded"
    
    try:
        comment_length = len(text.strip().split())
        max_tokens = 40 if comment_length <= 50 else 80 if comment_length <= 150 else 120
        
        context_subject = DRAFT_CONTEXT.get("subject", "Indian Multi-Disciplinary Partnership (MDP) firms")
        
        prompt = (
            f"You are an expert policy analyst. Your task is to concisely summarize the core argument of the following user comment, keeping the length proportional to the comment's detail.\n\n"
            f"### Context of the Draft ###\n"
            f"Subject: {context_subject}\n\n"
            f"### User Comment ###\n"
            f"\"{text.strip()}\"\n\n"
            f"### Concise Summary ###"
        )
        
        # --- Use Generation Settings Optimized for DIVERSE Summaries ---
        summary_list = MODELS["summarizer"](
            prompt, 
            max_length=max_tokens,
            min_length=15,
            # --- NEW SETTINGS ---
            do_sample=True,
            top_k=50,
            temperature=0.7,
            # --- Keep these ---
            no_repeat_ngram_size=2,
            early_stopping=True
        )
        
        return summary_list[0]['generated_text'].strip()
    
    except Exception as e:
        print(f"Summary generation error: {e}")
        return "Summary generation failed."
    
def analyze_sentiment(text: str):
    """Analyzes sentiment of a given text."""
    if MODELS["sentiment_model"] is None:
        return ("Unknown", 0.0)

    try:
        result = MODELS["sentiment_model"](text[:512])[0]
        sentiment = MODELS["label_mapping"].get(result['label'], "Unknown")
        score = result['score']
        return (sentiment, score)
    except Exception as e:
        print(f"Sentiment analysis error: {e}")
        return ("Unknown", 0.0)


# --- 4. FLASK APPLICATION ---
app = Flask(__name__)
MODELS = load_models()
DRAFT_CONTEXT = load_draft_context()

@app.route("/analyze", methods=["POST"])
def analyze():
    try:
        data = request.get_json()
        if not data or "comment" not in data:
            return jsonify({"success": False, "error": "Invalid JSON payload"}), 400

        comment = data.get("comment", "")
        if not comment or not comment.strip():
            return jsonify({"success": False, "error": "Comment text is required"}), 400
        
        translated_comment, language_type = translate_text(comment)
        sentiment, sentiment_score = analyze_sentiment(translated_comment)
        summary = generate_summary(translated_comment)

        return jsonify({
            "success": True,
            "original": comment,
            "translated": translated_comment,
            "language_type": language_type,
            "sentiment": sentiment,
            "sentimentScore": round(sentiment_score, 4),
            "summary": summary
        })
    
    except Exception as e:
        print(f"CRITICAL Error in /analyze endpoint: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({"success": False, "error": "An unhandled internal server error occurred."}), 500

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8080))  
    app.run(debug=True, host='0.0.0.0', port=port)