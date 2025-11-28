import warnings
warnings.filterwarnings('ignore', category=FutureWarning)

import json
import os
import random
import re
from pathlib import Path
from typing import Optional, List, Union

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn
import torch
from transformers import pipeline as hf_pipeline
from dotenv import load_dotenv
import requests

# Load environment variables
load_dotenv()

# --- CONFIGURATION ---
LLM_MODE = os.getenv("LLM_MODE")
MODEL_NAME = os.getenv("LOCAL_MODEL_NAME",)
DEVICE = os.getenv("DEVICE",)  # Force CPU for cloud deployment
MAX_TOKENS = int(os.getenv("MAX_TOKENS", "150"))
TEMPERATURE = float(os.getenv("TEMPERATURE", "0.7"))

print(f"🚀 Initializing LokVaani AI Generator")
print(f"   - Mode: {LLM_MODE}")
print(f"   - Model: {MODEL_NAME}")
print(f"   - Device: {DEVICE}")

class SimpleCommentGenerator:
    def __init__(self):
        script_dir = Path(__file__).parent
        self.data_dir = script_dir / "data"
        
        # Load Data
        self.posts = self._load_json("post.json")
        self.companies = self._load_json("company.json") 
        self.comments = self._load_all_comments()
        self.categories = self._load_json("business_categories.json")
        
        # Category Mapper
        self.category_by_id = {
            c["id"]: c.get("name", "General") for c in self.categories if "id" in c
        }
        
        # Descriptions for Context Injection
        self.category_descriptions = {
            "Corporate Debtor": "companies facing insolvency and compliance burdens",
            "Creditor to a Corporate Debtor": "banks and financial institutions recovering debts", 
            "Insolvency Professional": "licensed experts managing legal insolvency processes",
            "Personal Guarantor to a Corporate Debtor": "individuals with personal asset liability",
            "Academics": "researchers analyzing legal and economic impact",
            "Partnership firms": "mid-sized businesses concerned with regulatory complexity",
            "Proprietorship firms": "small business owners with limited compliance resources",
            "User": "citizens and civil society concerned with transparency",
            "Others": "general industry stakeholders"
        }
        
        # Load LLM Pipeline
        self.llm_pipeline = None
        if LLM_MODE in ['llm', 'hybrid']:
            self._load_llm()
            
        # Single Post Setup (For Demo)
        self.current_post = self.posts[0] if self.posts else None
        self.current_post_comments = self.comments.get(self.current_post['post'], []) if self.current_post else []
        
        # Rotation System
        self.comment_variations = []
        self._prepare_comment_variations()
        self.used_comment_indices = set()
        self.total_requests = 0

    def _load_llm(self):
        """Robust Model Loading with GPU/CPU logic"""
        try:
            print(f"⏳ Loading LLM pipeline...")
            
            # Use simple device configuration like in previous version
            device_id = 0 if DEVICE == "cuda" else -1
            
            self.llm_pipeline = hf_pipeline(
                "text-generation",
                model=MODEL_NAME,
                device=device_id,
                model_kwargs={"cache_dir": "./model_cache"}
            )
            print("✅ LLM loaded successfully.")
        except Exception as e:
            print(f"❌ LLM Load Failed: {e}")
            print("   -> Switching to dataset-only mode.")
            self.llm_pipeline = None

    def _load_json(self, filename):
        file_path = self.data_dir / filename
        if file_path.exists():
            with open(file_path, 'r', encoding='utf-8') as f:
                return json.load(f)
        return []
    
    def _load_all_comments(self):
        comments = {}
        comments_dir = self.data_dir / "comments"
        if comments_dir.exists():
            for file_path in comments_dir.glob("*.json"):
                key = file_path.stem.replace('_comments', '')
                comments[key] = self._load_json(f"comments/{file_path.name}")
        return comments

    def _prepare_comment_variations(self):
        """Pre-load existing comments for fallback"""
        self.comment_variations = []
        for comment in self.current_post_comments:
            text = comment.get('commentText', '')
            if len(text.split()) >= 10:
                self.comment_variations.append(text)
        random.shuffle(self.comment_variations)

    def _choose_sentiment(self):
        r = random.random()
        if r < 0.45: return "supportive but with specific suggestions"
        elif r < 0.75: return "critical of compliance burden"
        else: return "neutral, seeking clarification"
    
    def _verify_company_has_comment(self, company_id):
        """Check if a company already has a comment for the current post"""
        try:
            # Get the backend URL from environment or use default
            backend_url = os.getenv('BACKEND_URL')
            
            if not self.current_post:
                return False
                
            post_id = self.current_post.get('postId')
            if not post_id or not company_id:
                return False
            
            # Make API call to check if company has existing comment
            response = requests.get(
                f"{backend_url}/api/v1/comments/verify-company",
                params={
                    'postId': post_id,
                    'companyId': company_id
                },
                timeout=5  # 5 second timeout
            )
            
            if response.status_code == 200:
                data = response.json()
                return data.get('hasComment', False)
            return False
                
        except Exception:
            return False
    
    def _get_validated_company_selection(self):
        """Select a random company that doesn't already have a comment"""
        if not self.companies:
            return {'companyName': 'Anonymous Company', 'category': 'General', 'companyId': 0}
        
        # Create a list of available companies (shuffle for randomness)
        available_companies = self.companies.copy()
        random.shuffle(available_companies)
        
        # Try to find a company without existing comment
        max_attempts = min(50, len(available_companies))  # Limit attempts to avoid infinite loop
        
        for attempt in range(max_attempts):
            selected_company = available_companies[attempt % len(available_companies)]
            company_id = selected_company.get('companyId')
            
            # Check if this company already has a comment
            if not self._verify_company_has_comment(company_id):
                return selected_company
        
        # Fallback to first company if all have comments
        return available_companies[0]

    # --- CORE LLM LOGIC ---

    def _build_messages(self, post: dict, company: dict, category_name: str, sentiment: str) -> List[dict]:
        """Constructs the Chat Template messages for Qwen/Llama"""
        post_title = post.get("title", "the policy")
        post_content = post.get("draft_text", "")[:1500] 
        company_name = company.get("companyName", "Stakeholder")
        state = company.get("state", "India")
        desc = self.category_descriptions.get(category_name, "stakeholder")

        # System Prompt: Defines the Persona and Rules
        system_prompt = f"""You are a professional Policy Analyst drafting a formal submission for the Ministry of Corporate Affairs.
You are representing: {company_name}, a {category_name} located in {state}, India.
Context: {desc}.

Your Task: Write a realistic public comment on the draft "{post_title}".
Sentiment: {sentiment}.

STRICT RULES:
1. Write DIRECTLY as the stakeholder. Do NOT use greetings (e.g., "Dear Sir", "To the Ministry").
2. Start immediately with your main argument or observation.
3. Do NOT introduce yourself ("I am writing to...", "As a...").
4. Include 1-2 specific technical, legal, or operational details relevant to {category_name}.
5. Do NOT sign off (e.g., "Sincerely").
6. Length: 100 to 200 words."""

        # User Prompt: Provides the Context
        user_prompt = f"""Here is the text of the draft policy:
---
{post_content}
---

Based on this text, write the formal comment now."""

        return [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ]

    def _call_llm(self, messages: List[dict]) -> str:
        """Executes the generation using the Chat Template"""
        if not self.llm_pipeline: 
            return "LLM pipeline not available"

        try:
            # Convert messages to simple prompt format for TinyLlama
            prompt = f"{messages[0]['content']}\n\n{messages[1]['content']}\n\nResponse:"
            
            outputs = self.llm_pipeline(
                prompt,
                max_new_tokens=MAX_TOKENS,
                temperature=TEMPERATURE,
                top_p=0.9,
                do_sample=True,
                return_full_text=False
            )
            
            # Extract generated text
            if isinstance(outputs, list) and len(outputs) > 0:
                generated_text = outputs[0].get("generated_text", "")
                return generated_text.strip()
            return ""
            
        except Exception as e:
            print(f"⚠️ Generation Error: {e}")
            return f"LLM generation failed: {str(e)}"

    def _clean_text(self, text: str) -> str:
        """Post-processing to remove any AI artifacts"""
        if not text: return ""
        
        # Common AI refusals or meta-text
        text = re.sub(r"^(Here is|Sure,|Certainly,).+?\n", "", text, flags=re.I)
        
        # Remove greetings if the model ignored the system prompt
        text = re.sub(r"^(Dear|To)\s+.*?,", "", text, flags=re.I)
        text = re.sub(r"^Subject:.*", "", text, flags=re.M)
        
        # Remove sign-offs
        text = re.sub(r"\n(Sincerely|Regards|Yours).*", "", text, flags=re.I|re.S)
        
        return text.strip().strip('"')

    def _adjust_word_count(self, comment, min_words=80, max_words=250):
        """Ensure comment is within length limits naturally"""
        sentences = comment.split('.')
        final = ""
        count = 0
        
        for s in sentences:
            if not s.strip(): continue
            s_len = len(s.split())
            if count + s_len > max_words: break
            final += s.strip() + ". "
            count += s_len
            
        final = final.strip()
        
        # Expand if too short (Dataset fallback usually needs this)
        if count < min_words:
            fillers = [
                "We urge the Ministry to issue a clarification on these points to ensure smooth implementation.",
                "This will significantly impact the ease of doing business for stakeholders in our sector.",
                "Proper transition periods are essential to allow entities to upgrade their systems.",
                "We hope these suggestions are considered favorably in the final notification."
            ]
            while len(final.split()) < min_words and fillers:
                f = random.choice(fillers)
                final += " " + f
                fillers.remove(f)
                
        return final

    # --- MAIN GENERATION METHOD ---

    def generate_comment(self, post_id=None, company_id=None):
        self.total_requests += 1
        
        # 1. Select Post & Company
        post = self.current_post
        if not post: return {"error": "No posts loaded"}
        
        if company_id:
            company = next((c for c in self.companies if c.get('companyId') == company_id), None)
        else:
            # Use validated company selection to avoid duplicates
            company = self._get_validated_company_selection()
            
        if not company: return {"error": "No companies loaded"}

        category_name = self.category_by_id.get(company.get("businessCategoryId"), "General")
        
        # 2. Try LLM Generation
        comment_text = None
        source = "unknown"
        
        if self.llm_pipeline and LLM_MODE in ['llm', 'hybrid']:
            sentiment = self._choose_sentiment()
            messages = self._build_messages(post, company, category_name, sentiment)
            raw_output = self._call_llm(messages)
            
            if raw_output and len(raw_output.split()) >= 20:
                comment_text = self._clean_text(raw_output)
                source = "llm_generation"

        # 3. Fallback to Dataset
        if not comment_text and LLM_MODE in ['dataset', 'hybrid']:
            # Get from pre-loaded list
            if self.comment_variations:
                if len(self.used_comment_indices) >= len(self.comment_variations):
                    self.used_comment_indices = set()  # Reset rotation
                    random.shuffle(self.comment_variations)
                
                for i, comment in enumerate(self.comment_variations):
                    if i not in self.used_comment_indices:
                        self.used_comment_indices.add(i)
                        comment_text = comment
                        break
                
                if comment_text:
                    # Add category-specific context for short comments
                    if len(comment_text.split()) < 40:
                        category_context = {
                            'Corporate Debtor': 'As a corporate entity, ',
                            'Creditor to a Corporate Debtor': 'From a creditor perspective, ',
                            'Insolvency Professional': 'As insolvency professionals, ',
                            'Academics': 'From an academic standpoint, ',
                            'Partnership firms': 'As a partnership firm, ',
                            'Proprietorship firms': 'As a small business, ',
                            'User': 'As concerned citizens, '
                        }
                        prefix = category_context.get(category_name, 'We believe ')
                        if not comment_text.lower().startswith(prefix.lower().split()[0]):
                            comment_text = prefix + comment_text.lower()
                    source = "dataset_enhanced"

        # 4. Final fallback
        if not comment_text:
            comment_text = f"We appreciate this consultation on {post.get('title', 'the policy')} and believe it addresses important concerns for {category_name} stakeholders."
            source = "template_fallback"

        # 5. Final Polish
        final_comment = self._adjust_word_count(comment_text, min_words=50, max_words=120)

        return {
            "success": True,
            "postId": post['postId'],
            "companyId": company.get('companyId', 0),
            "companyName": company['companyName'],
            "businessCategoryId": company.get('businessCategoryId', None),
            "comment": final_comment,
            "wordCount": len(final_comment.split()),
            "postTitle": post['title'],
            "state": company.get('state', 'Unknown'),
            "source": source,
            "mode": LLM_MODE or 'hybrid'
        }

# --- FASTAPI APP ---

generator = SimpleCommentGenerator()
app = FastAPI(title="Lok Vaani AI Agent")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class GenerateRequest(BaseModel):
    post_id: Optional[str] = None
    company_id: Optional[str] = None

class GenRequest(BaseModel):
    post_id: Optional[str] = None
    company_id: Optional[str] = None

@app.get("/active")
async def root():
    return {"message": "Lok Vaani AI is active!", "total_requests": generator.total_requests}

@app.get("/status")
def status():
    return {
        "status": "active", 
        "model": MODEL_NAME, 
        "mode": LLM_MODE,
        "device": DEVICE,
        "gpu_available": torch.cuda.is_available()
    }

@app.get("/generate")
def generate_get():
    return generator.generate_comment()

@app.post("/generate")
def generate_post(req: GenRequest):
    return generator.generate_comment(req.post_id, req.company_id)

@app.get("/posts")
async def get_posts():
    return {"posts": generator.posts}

@app.get("/companies")
async def get_companies():
    return {"companies": generator.companies}

@app.get("/config")
async def get_config():
    return {
        "llm_mode": LLM_MODE or 'hybrid',
        "local_model": MODEL_NAME,
        "llm_loaded": bool(generator.llm_pipeline),
        "device": DEVICE,
        "categories_loaded": len(generator.categories),
        "posts_loaded": len(generator.posts),
        "companies_loaded": len(generator.companies)
    }

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8080))
    # app.run(host="0.0.0.0", port=port, debug=True)
    uvicorn.run("app:app", host="0.0.0.0", port=port, reload=True)