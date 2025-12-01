import warnings
warnings.filterwarnings('ignore', category=FutureWarning)


import os
import re
import torch
import json
import warnings
from flask import Flask, request, jsonify
import torch
from transformers import AutoModelForSeq2SeqLM, AutoTokenizer, pipeline
from IndicTransToolkit.processor import IndicProcessor
from dotenv import load_dotenv

load_dotenv()

# --- 1. CONFIGURATION ---
PORT = int(os.getenv("PORT", 8080))
DEVICE = "cuda" if torch.cuda.is_available() else "cpu"
print(f"🚀 Initializing Analysis Engine on {DEVICE}...")

# Model IDs (from env or defaults)
ID_TRANS = os.getenv("MODEL_TRANSLATION") 
ID_SUMM = os.getenv("MODEL_SUMMARY")
ID_SENT = os.getenv("MODEL_SENTIMENT")

# --- 2. GLOBAL MODEL LOADING PORT---
MODELS = {}

def load_models():
    """Load heavy models into GPU memory once at startup"""
    print("⏳ Loading AI Models... (This may take a minute)")
    
    try:
        # 1. Translation (IndicTrans2 for Hindi -> English)
        # Note: trust_remote_code=True is required for ai4bharat models
        print(f"   - Loading Translator: {ID_TRANS}")
        MODELS['trans_tokenizer'] = AutoTokenizer.from_pretrained(ID_TRANS, trust_remote_code=True)
        
        # Determine attention implementation based on hardware
        # L4/A100 supports flash_attention_2, T4/CPU does not. 
        # We use 'eager' (standard) to be safe across all hardware.
        MODELS['trans_model'] = AutoModelForSeq2SeqLM.from_pretrained(
            ID_TRANS, 
            trust_remote_code=True, 
            torch_dtype=torch.float16 if DEVICE=="cuda" else torch.float32,
            attn_implementation="eager" 
        ).to(DEVICE)
        
        # Initialize the required Processor
        MODELS['trans_processor'] = IndicProcessor(inference=True)

        # 2. Summarization (Legal-Pegasus)
        print(f"   - Loading Legal Summarizer: {ID_SUMM}")
        MODELS['summ_pipeline'] = pipeline(
            "summarization", 
            model=ID_SUMM, 
            tokenizer=ID_SUMM, 
            device=0 if DEVICE=="cuda" else -1
        )

        # 3. Sentiment (FinBERT)
        print(f"   - Loading Financial Sentiment: {ID_SENT}")
        MODELS['sent_pipeline'] = pipeline(
            "text-classification", 
            model=ID_SENT, 
            tokenizer=ID_SENT, 
            device=0 if DEVICE=="cuda" else -1
        )
        
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
    """
    Revised Logic with Debugging for 'NoneType' Error.
    """
    if not text: return "", "English"

    # Regex for Devanagari (Hindi) characters
    if re.search(r'[\u0900-\u097F]', text):
        try:
            ip = MODELS['trans_processor']
            tokenizer = MODELS['trans_tokenizer']
            model = MODELS['trans_model']
            
            # --- DEBUG: 1. Preprocessing ---
            batch = ip.preprocess_batch(
                [text],
                src_lang="hin_Deva",
                tgt_lang="eng_Latn",
            )
            if not batch: raise ValueError("Preprocessing returned empty batch")

            # --- DEBUG: 2. Tokenization ---
            inputs = tokenizer(
                batch,
                truncation=True,
                padding="longest",
                return_tensors="pt",
                return_attention_mask=True,
            ).to(DEVICE)
            
            # --- FIX: Ensure attention_mask is present ---
            if 'attention_mask' not in inputs:
                print("⚠️ Warning: attention_mask missing, forcing creation")
                inputs['attention_mask'] = (inputs['input_ids'] != tokenizer.pad_token_id).long()

            # --- DEBUG: 3. Generation ---
            with torch.no_grad():
                generated_tokens = model.generate(
                    **inputs,
                    use_cache=True,
                    min_length=0,
                    max_length=512,
                    num_beams=5,
                    num_return_sequences=1,
                )
            
            if generated_tokens is None: raise ValueError("Model generated None")

            # --- DEBUG: 4. Decoding ---
            decoded_tokens = tokenizer.batch_decode(
                generated_tokens,
                skip_special_tokens=True,
                clean_up_tokenization_spaces=True,
            )
            
            # --- DEBUG: 5. Postprocessing ---
            translated_text = ip.postprocess_batch(decoded_tokens, lang="eng_Latn")[0]
            
            return translated_text, "Hindi"
            
        except Exception as e:
            print(f"Translation Error Step: {e}")
            # print(f"Traceback: {traceback.format_exc()}") # Uncomment if you import traceback
            return text, "Hindi (Translation Failed)"
            
    return text, "English"

# def get_legal_summary(text):
#     """Generate abstractive summary using Legal-Pegasus"""
#     try:
#         # Legal texts are long; Pegasus handles them well.
#         # We limit input to 1024 tokens to manage GPU memory.
#         summary = MODELS['summ_pipeline'](
#             text, 
#             max_length=120, 
#             min_length=30, 
#             do_sample=False,  # Deterministic summary
#             truncation=True
#         )
#         return summary[0]['summary_text']
#     except Exception as e:
#         print(f"Summarization Error: {e}")
#         return "Summary could not be generated."


def get_legal_summary(text, comment_type="Overall"):
    """
    Generate abstractive summary using Legal-Pegasus.
    Uses 'Grounding' (Context Injection) to prevent hallucinations.
    """
    try:
        # --- STEP 1: CLEAN THE INPUT ---
        # The input might be "Q1, Regulatory Changes" or just "Q1".
        # We split by comma and take the first part to get the ID.
        if comment_type:
            clean_id = comment_type.split(',')[0].strip()
        else:
            clean_id = "Overall"

        print(f"DEBUG: Raw Type: '{comment_type}' -> Clean ID: '{clean_id}'")

        # --- STEP 2: DETERMINE CONTEXT ---
        if clean_id in CLAUSE_MAP:
            # Found a specific clause match
            context_label = f"Specific Clause ({clean_id})"
            context_text = CLAUSE_MAP[clean_id]
            print(f"✅ Using Clause Context for {clean_id}")
        else:
            # Fallback to Overall
            print(f"ℹ️ Clause ID '{clean_id}' not found in map. Using General Context.")
            context_label = "Overall Policy Draft"
            context_text = DRAFT_TITLE

        # --- STEP 3: CONSTRUCT PROMPT ---
        prompt = (
            f"Document Context: {context_text}\n"
            f"User Comment on {context_label}: \"{text.strip()}\"\n"
            f"Task: Summarize the user's main argument regarding this specific context in one sentence."
        )

        # --- STEP 4: INFERENCE ---
        summary = MODELS['summ_pipeline'](
            prompt, 
            max_length=100,   
            min_length=20, 
            do_sample=False, 
            truncation=True
        )
        
        return summary[0]['summary_text']

    except Exception as e:
        print(f"Summarization Error: {e}")
        return "Summary unavailable."





def get_financial_sentiment(text):
    """Get sentiment using FinBERT"""
    try:
        # FinBERT labels: positive, negative, neutral
        result = MODELS['sent_pipeline'](text[:512], truncation=True)[0]
        label = result['label'] # 'positive', 'negative', 'neutral'
        score = result['score']
        
        # Capitalize for frontend consistency
        return label.capitalize(), round(score, 4)
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
        print(f"Received comment for type: {comment_type}")
        if not raw_comment:
            return jsonify({"success": False, "error": "Empty comment"}), 400

        # Step 1: Detect & Translate (Standardize to English)
        final_english_text, detected_lang = detect_and_translate(raw_comment)

        # Step 2: Analyze the English text
        sentiment, score = get_financial_sentiment(final_english_text)
        summary = get_legal_summary(final_english_text, comment_type)

        # Step 3: Response
        response = {
            "success": True,
            "original_text": raw_comment,
            "analyzed_text": final_english_text, # The text used for analysis
            "detected_language": detected_lang,
            "sentiment": sentiment,      # Positive/Negative/Neutral
            "sentiment_score": score,    # Confidence
            "ai_summary": summary        # Legal abstractive summary
        }
        return jsonify(response)

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route("/status", methods=["GET"])
def status():
    
    return {
        "status": "active",
        "model_translation": os.getenv("MODEL_TRANSLATION"),
        "mode_summary": os.getenv("MODEL_SUMMARY"),
        "mode_sentiment": os.getenv("MODEL_SENTIMENT"),
        "device": DEVICE,
        "gpu_available": torch.cuda.is_available(),
    }

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))  
    app.run(debug=True, host='0.0.0.0', port=port)