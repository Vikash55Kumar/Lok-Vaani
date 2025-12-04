import os
import json
import torch
from flask import Flask, request, jsonify
from transformers import AutoTokenizer, AutoModelForCausalLM, pipeline

# Suppress TensorFlow warnings for cleaner output
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'
os.environ['TRANSFORMERS_VERBOSITY'] = 'error'

# Initialize Flask app
app = Flask(__name__)

# Load draft context from JSON file
def load_draft_context():
    """Load the compact draft context for efficient processing"""
    try:
        with open('draft_context.json', 'r', encoding='utf-8') as f:
            return json.load(f)
    except FileNotFoundError:
        # Fallback minimal context if file not found
        return {
            "subject": "Indian Multi-Disciplinary Partnership (MDP) firms",
            "ministry": "Ministry of Corporate Affairs",
            "key_focus": ["regulatory changes", "global competitiveness", "professional services"]
        }

# Load context at startup
DRAFT_CONTEXT = load_draft_context()

# Set device - use GPU if available
device = "cuda" if torch.cuda.is_available() else "cpu"
print(f"Using device: {device}")

# Load model with optimizations
print("Loading TinyLlama model...")
tokenizer = AutoTokenizer.from_pretrained(
    "TinyLlama/TinyLlama-1.1B-Chat-v1.0", 
    cache_dir="./model_cache"  # Cache locally to avoid re-downloading
)

model = AutoModelForCausalLM.from_pretrained(
    "TinyLlama/TinyLlama-1.1B-Chat-v1.0", 
    device_map="auto",  # Let accelerate handle device mapping
    dtype=torch.float16 if device == "cuda" else torch.float32,
    cache_dir="./model_cache",
    low_cpu_mem_usage=True  # Reduce memory usage during loading
)

# Create optimized pipeline - don't specify device when using accelerate
summarizer = pipeline(
    "text-generation",
    model=model,
    tokenizer=tokenizer
    # Removed device parameter - accelerate handles this automatically
)

print("Model loaded successfully!")

def generate_summary(text):
    """Optimized summary generation function for MCA eConsultation platform with adaptive length"""
    
    # Calculate adaptive summary length based on comment length
    comment_length = len(text.strip().split())
    if comment_length <= 50:
        max_tokens = 30  # Short summary for short comments
    elif comment_length <= 150:
        max_tokens = 60  # Medium summary for medium comments
    elif comment_length <= 300:
        max_tokens = 100  # Longer summary for longer comments
    else:
        max_tokens = 150  # Maximum summary for very long comments
    
    # Use compact context for efficient processing
    context_summary = {
        "topic": DRAFT_CONTEXT.get("consultation_details", {}).get("subject", "MDP firms establishment"),
        "focus": DRAFT_CONTEXT.get("focus_areas", ["auditing", "consulting", "legal"]),
        "key_issues": DRAFT_CONTEXT.get("key_asymmetries", {}).get("indian_firm_limitations", [])[:3]  # Top 3 for brevity
    }
    
    # Optimized prompt for faster processing
    prompt = f"""MCA eConsultation Analysis - Topic: {context_summary['topic']}

Key Issues: {', '.join(context_summary['key_issues'])}
Focus Areas: {', '.join(context_summary['focus'])}

Stakeholder Comment: {text.strip()}

Analyze this comment and provide a concise summary focusing on:
- Main concerns raised
- Specific suggestions or recommendations  
- Regulatory changes mentioned
- Overall sentiment (supportive/critical/neutral)

Summary:"""
    
    # Generate with optimized parameters (fixed temperature=0.7, adaptive length)
    summary = summarizer(
        prompt, 
        max_new_tokens=max_tokens,
        temperature=0.7,  # Fixed temperature for consistent results
        return_full_text=False,
        do_sample=True,
        pad_token_id=tokenizer.eos_token_id if tokenizer.pad_token_id is None else tokenizer.pad_token_id,
        num_return_sequences=1,
        clean_up_tokenization_spaces=True  # Clean up output
    )
    
    return summary[0]['generated_text'].strip()

@app.route('/summarize', methods=['POST'])
def summarize_text():
    """
    POST endpoint for MCA eConsultation stakeholder comment summarization
    Expected JSON payload: 
    {
        "text": "Stakeholder comment on draft legislation/amendments"
    }
    Note: Summary length is automatically adjusted based on comment length
    Temperature is fixed at 0.7 for consistent results
    """
    try:
        # Get JSON data from request
        data = request.get_json()
        
        # Validate input
        if not data:
            return jsonify({"error": "No JSON data provided"}), 400
        
        if 'text' not in data:
            return jsonify({"error": "Missing 'text' field in request"}), 400
        
        text = data['text']
        if not text or not text.strip():
            return jsonify({"error": "Text field cannot be empty"}), 400
        
        # Generate summary with adaptive length
        comment_word_count = len(text.strip().split())
        print(f"Processing text ({comment_word_count} words): {text[:50]}...")
        summary = generate_summary(text)
        
        # Return response with adaptive summary information
        return jsonify({
            "success": True,
            "summary": summary,
            "adaptive_settings": {
                "comment_word_count": comment_word_count,
                "summary_length": "adaptive (30-150 tokens based on input length)",
                "temperature": "fixed at 0.7"
            },
            "model": "TinyLlama/TinyLlama-1.1B-Chat-v1.0",
            "context": {
                "platform": "MCA eConsultation Platform - Indian Corporate Affairs",
                "draft_topic": DRAFT_CONTEXT.get("consultation_details", {}).get("subject", "MDP consultation"),
                "analysis_focus": ["concerns", "suggestions", "regulatory_changes", "sentiment"]
            }
        }), 200
        
    except Exception as e:
        print(f"Error processing request: {str(e)}")
        return jsonify({
            "success": False,
            "error": f"Internal server error: {str(e)}"
        }), 500

# Start Flask server directly
if __name__ == '__main__':
    print("="*60)
    print("🇮🇳 MCA eConsultation AI Summary Service")
    
    # Start Flask server
    app.run(host='0.0.0.0', port=5000, debug=True)