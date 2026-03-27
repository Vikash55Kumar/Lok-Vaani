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
from transformers import pipeline as hf_pipeline
from dotenv import load_dotenv
import requests
import vertexai
from langchain_google_vertexai import ChatVertexAI, HarmBlockThreshold, HarmCategory

# Load environment variables
load_dotenv()

# --- CONFIGURATION ---
LLM_MODE = os.getenv("LLM_MODE")
MODEL_NAME = os.getenv("LOCAL_MODEL_NAME",)
MAX_TOKENS = int(os.getenv("MAX_TOKENS", "150"))
TEMPERATURE = float(os.getenv("TEMPERATURE", "0.7"))

print(f"🚀 Initializing LokVaani AI Generator")
print(f"   - Mode: {LLM_MODE}")
print(f"   - Model: {MODEL_NAME}")
print(f"   - Device: CPU")

try:
    PROJECT_ID = os.getenv("GOOGLE_CLOUD_PROJECT")
    LOCATION = os.getenv("GOOGLE_CLOUD_LOCATION")

    VERTEX_AI_CREDENTIALS = os.getenv("VERTEX_AI_CREDENTIALS")
    if VERTEX_AI_CREDENTIALS:
        os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = VERTEX_AI_CREDENTIALS

    vertexai.init(project=PROJECT_ID, location=LOCATION)

    safety_settings = {
        HarmCategory.HARM_CATEGORY_UNSPECIFIED: HarmBlockThreshold.BLOCK_NONE,
        HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT: HarmBlockThreshold.BLOCK_NONE,
        HarmCategory.HARM_CATEGORY_HARASSMENT: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE,
        HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        HarmCategory.HARM_CATEGORY_HATE_SPEECH: HarmBlockThreshold.BLOCK_ONLY_HIGH,
    }

    llm = ChatVertexAI(
        model="gemini-2.0-flash",
        temperature=0.2,
        max_output_tokens=512,
        project=PROJECT_ID,
        safety_settings=safety_settings
    )

except Exception as e:
    print(f"❌ Failed to initialize Vertex AI: {e}")
    llm = None


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

        # Add this in __init__ after self.category_descriptions
        self.persona_map = {
            "Corporate Debtor": {
                "role_title": "authorized representative of the company",
                "tone": "formal, businesslike",
                "example_prefix": "On behalf of {company_name}, we note that"
            },
            "Creditor to a Corporate Debtor": {
                "role_title": "creditor / financial institution representative",
                "tone": "formal, technical",
                "example_prefix": "From a creditor's perspective,"
            },
            "Insolvency Professional": {
                "role_title": "insolvency professional",
                "tone": "technical, professional",
                "example_prefix": "As an insolvency professional,"
            },
            "Personal Guarantor to a Corporate Debtor": {
                "role_title": "personal guarantor",
                "tone": "concise, factual",
                "example_prefix": "As a personal guarantor,"
            },
            "Academics": {
                "role_title": "researcher / academic",
                "tone": "analytical, evidence-based",
                "example_prefix": "From an academic perspective,"
            },
            "Partnership firms": {
                "role_title": "partner / firm representative",
                "tone": "businesslike",
                "example_prefix": "As representatives of our partnership firm,"
            },
            "Proprietorship firms": {
                "role_title": "proprietor",
                "tone": "concise, practical",
                "example_prefix": "As a small business proprietor,"
            },
            "User": {
                "role_title": "concerned citizen",
                "tone": "plain language, civic",
                "example_prefix": "As a concerned citizen,"
            },
            "Others": {
                "role_title": "stakeholder",
                "tone": "neutral",
                "example_prefix": "We note that"
            },
            "General": {
                "role_title": "stakeholder",
                "tone": "neutral",
                "example_prefix": "We note that"
            }
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
        """Load LLM pipeline for CPU-only deployment"""
        try:
            print(f"⏳ Loading LLM pipeline for CPU...")
            
            # Force CPU-only configuration
            self.llm_pipeline = hf_pipeline(
                "text-generation",
                model=MODEL_NAME,
                device=-1,  # CPU only
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
    
    def _choose_language_by_category(self, company: dict) -> str:
        """Choose language based on company category and user request"""

        # Get company category ID
        category_id = company.get('businessCategoryId')
        
        # User category (citizens) - 80% Hindi, 20% English
        if category_id == "801e4fc0-9ea9-4980-811a-bb799c6da05e":
            return "Hindi" if random.random() < 0.8 else "English"
        
        # Other categories - 30% Hindi, 70% English  
        else:
            return "Hindi" if random.random() < 0.2 else "English"
    
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

    def _postprocess_comment(self, text, category_name, company):
        notes = []
        synthetic = True

        # 1. Remove impersonation phrases
        forbidden = [
            "we appreciate your input", "thank you for your understanding", "sincerely,", "yours faithfully",
            "on behalf of the ministry", "policy analyst"
        ]
        for f in forbidden:
            if f in text.lower():
                text = re.sub(re.escape(f), '', text, flags=re.I)
                notes.append("impersonation_removed")

        # Remove reply-like phrases
        reply_phrases = [
            "thank you for your comment", "thank you for your feedback",
            "thank you for taking the time to review", "we appreciate your feedback"
        ]
        for rp in reply_phrases:
            if rp in text.lower():
                text = re.sub(re.escape(rp), '', text, flags=re.I)
                notes.append("reply_phrase_removed")

        # Remove category/context headers at start
        if text.strip().split('\n')[0].lower() in [category_name.lower(), self.persona_map.get(category_name, {}).get("role_title", "").lower()]:
            text = '\n'.join(text.strip().split('\n')[1:])
            notes.append("category_header_removed")
        
        # 2. Remove placeholders
        if re.search(r'\[your name|\[your title|\[your contact', text.lower()):
            text = re.sub(r'\[your name.*?\]', '', text, flags=re.I)
            text = re.sub(r'\[your title.*?\]', '', text, flags=re.I)
            text = re.sub(r'\[your company.*?\]', '', text, flags=re.I)
            text = re.sub(r'\[your contact.*?\]', '', text, flags=re.I)
            notes.append("placeholder_removed")

        # 3. Remove unfinished list markers
        if re.search(r'\n\s*\d+\.\s*$', text) or text.strip().endswith(("1.", "2.", "3.")):
            text = re.sub(r'\n\s*\d+\.\s*$', '', text)
            for n in ["1.", "2.", "3."]:
                if text.strip().endswith(n):
                    text = text.strip()[:-2]
            notes.append("truncation_fixed")

        # 4. Remove internal scaffold blocks
        text = re.sub(r'^---(.|\n)*?---\s*', '', text)
        if "---" in text:
            notes.append("scaffold_removed")

        # 5. Enforce perspective opener
        openers = {
            "Creditor to a Corporate Debtor": "From a creditor perspective,",
            "Corporate Debtor": "As a company,",
            "User": "As a concerned citizen,"
        }
        opener = openers.get(category_name)
        if opener and not text.strip().lower().startswith(opener.lower()):
            text = opener + " " + text
            notes.append("opener_added")

        return text.strip(), synthetic, notes
    
    # --- CORE LLM LOGIC ---

    def _build_messages(self, post: dict, company: dict, category_name: str, sentiment: str, language: str = "English"):
        company_name = company.get("companyName", "Stakeholder")
        state = company.get("state", "India")
        desc = self.category_descriptions.get(category_name, "stakeholder")

        persona_info = self.persona_map.get(category_name, self.persona_map["General"])
        role_title = persona_info["role_title"]
        tone = persona_info["tone"]
        example_prefix = persona_info["example_prefix"].format(company_name=company_name)

        # Language instruction
        if language == "Hindi":
            lang_instruction = "Write in formal Hindi (Devanagari script). Use technical terms in English brackets if needed. Only Hindi."
        else:
            lang_instruction = "Write in professional English appropriate for the stakeholder."

        # Clause selection logic
        target_clause = None
        if "clauses" in post and post["clauses"] and random.random() < 0.5:
            target_clause = random.choice(post["clauses"])

        if target_clause:
            target_context = f"Clause/Section: {target_clause['id']} - {target_clause['name']}\nText Excerpt: \"{target_clause['text']}\""
            task_instruction = f"Write a focused comment addressing {target_clause['name']} ({target_clause['id']}). Explain impact on {category_name}."
            comment_type = f"{target_clause.get('id')}, {target_clause.get('name')}" or "clause_specific"
        else:
            draft_summary = post.get('draft_text', "")[:800]
            target_context = f"Draft Title: {post.get('title')}\nDraft Excerpt: {draft_summary}..."
            task_instruction = "Write an overall comment on the draft's likely impact, benefits, or concerns for the stakeholder."
            comment_type = "overall"

        # System Prompt: Use stakeholder persona, not analyst
        system_prompt = f"""You are an assistant that drafts formal public comments for policy consultations.
    Adopt the voice of the stakeholder described below. Do NOT impersonate Ministry staff or government analysts.
    Stakeholder: {company_name} — {role_title} ({category_name}), located in {state}.
    Context description: {desc}

    Tone: {tone}
    Task: {task_instruction}
    Sentiment: {sentiment}
    Language rules: {lang_instruction}

    GUIDELINES:
    1. Use first-person voice appropriate to the stakeholder (e.g., 'We', 'I') but do not write 'I am a Policy Analyst' or claim to be a government employee.
    2. Keep the comment concise and focused (target 100-200 words).
    3. If addressing a specific clause, reference it explicitly (e.g., 'Regarding Clause 4(i)...').
    4. Do not include greetings or signatures.
    5. Ensure the content reflects the stakeholder perspective (e.g., commercial concerns for companies, legal concerns for creditors, civic concerns for users).
    """

        user_prompt = f"""Here is the text to base the comment on:
    ---
    {target_context}
    ---

    Please produce the formal comment now. Start with a short clause-like opener (max 10 words) that identifies the perspective (e.g., '{example_prefix}')."""

        return [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ], comment_type

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

    def _call_gemini_for_hindi(self, messages: List[dict]) -> str:
        """Use Gemini API for Hindi comment generation ONLY"""
        global llm
        if not llm:
            print("⚠️ Gemini not available for Hindi - will use fallback")
            return ""
            
        try:
            # Convert messages to a single prompt for Gemini
            system_content = messages[0]['content']
            user_content = messages[1]['content']
            
            # Create a comprehensive prompt for Gemini with STRONGER Hindi enforcement
            gemini_prompt = f"""आप एक नीति विश्लेषक हैं जो कॉर्पोरेट मामलों के मंत्रालय के लिए औपचारिक प्रस्तुति तैयार कर रहे हैं।

                {system_content.replace('You are a professional Policy Analyst', 'आप एक पेशेवर नीति विश्लेषक हैं')}

                {user_content}

                अत्यंत महत्वपूर्ण निर्देश: 
                - पूरी टिप्पणी केवल हिंदी में (देवनागरी लिपि में) लिखें
                - एक भी अंग्रेजी वाक्य का प्रयोग न करें  
                - केवल तकनीकी शब्दों के लिए कोष्ठक में अंग्रेजी शब्द दे सकते हैं
                - उदाहरण: "यह नीति (policy) व्यापार में सुधार लाएगी"

                अब केवल हिंदी में औपचारिक टिप्पणी लिखें - कोई अंग्रेजी नहीं:"""
            
            print("🔄 Calling Gemini for Hindi comment generation...")
            response = llm.invoke(gemini_prompt)
            
            if hasattr(response, 'content'):
                result = response.content.strip()
                # Validate that response is actually in Hindi (contains Devanagari characters)
                if result and len(result) > 10:
                    # Check if response contains Devanagari characters (Hindi script)
                    has_hindi = any('\u0900' <= char <= '\u097F' for char in result)
                    hindi_chars = [char for char in result if '\u0900' <= char <= '\u097F']
                    
                    if has_hindi and len(hindi_chars) > 5:  # Stricter validation
                        print("✅ Gemini generated Hindi comment successfully")
                        return result
                    else:
                        print(f"⚠️ Gemini returned mostly English (only {len(hindi_chars)} Hindi chars) - rejecting")
                        return ""
            elif isinstance(response, str):
                result = response.strip()
                print(f"🔍 Gemini string response: {result[:100]}...")  # Debug output
                if result and len(result) > 10:
                    # Check if response contains Devanagari characters (Hindi script)
                    has_hindi = any('\u0900' <= char <= '\u097F' for char in result)
                    hindi_chars = [char for char in result if '\u0900' <= char <= '\u097F']
                    print(f"🔍 Hindi characters found: {len(hindi_chars)} out of {len(result)}")
                    
                    if has_hindi and len(hindi_chars) > 5:  # Stricter validation
                        print("✅ Gemini generated Hindi comment successfully")
                        return result
                    else:
                        print(f"⚠️ Gemini returned mostly English (only {len(hindi_chars)} Hindi chars) - rejecting")
                        return ""
                    
            print("⚠️ Gemini returned empty/short response for Hindi")
            return ""
            
        except Exception as e:
            print(f"⚠️ Gemini Generation Error for Hindi: {e}")
            # Check if it's an auth error specifically
            if "credentials" in str(e).lower() or "authentication" in str(e).lower():
                print("   -> Authentication issue - check GOOGLE_APPLICATION_CREDENTIALS")
            elif "quota" in str(e).lower() or "limit" in str(e).lower():
                print("   -> API quota/rate limit issue")
            return ""

    def _clean_text(self, text: str) -> str:
        """Post-processing to remove any AI artifacts - Hindi-aware"""
        if not text: return ""
        
        # Check if text is primarily Hindi (has Devanagari characters)
        has_hindi = any('\u0900' <= char <= '\u097F' for char in text)
        
        if has_hindi:
            # For Hindi text, only do minimal cleaning to preserve script
            # Remove quotes around the output
            text = re.sub(r"[\"']", "", text)
            return text.strip()
        else:
            # For English text, apply full cleaning
            # Common AI refusals or meta-text
            text = re.sub(r"^(Here is|Sure,|Certainly,).+?\n", "", text, flags=re.I)
            
            # Remove greetings if the model ignored the system prompt
            text = re.sub(r"^(Dear|To)\s+.*?,", "", text, flags=re.I)
            text = re.sub(r"^Subject:.*", "", text, flags=re.M)
            
            # Remove sign-offs
            text = re.sub(r"\n(Sincerely|Regards|Yours).*", "", text, flags=re.I|re.S)
            
            # Remove polite openings/thanks (e.g., "Thank you for the opportunity...")
            text = re.sub(r"^(Thank you for|We thank you for).*?(\.|\n)", "", text, flags=re.I)
            
            # Remove quotes around the output
            text = re.sub(r"[\"']", "", text)

            return text.strip().strip('"')

    def _adjust_word_count(self, comment, min_words=80, max_words=250):
        """Ensure comment is within length limits naturally - Hindi-aware"""
        if not comment: return ""
        
        # Check if text is primarily Hindi
        has_hindi = any('\u0900' <= char <= '\u097F' for char in comment)
        
        if has_hindi:
            # For Hindi text, use different sentence splitting and minimal processing
            # Hindi uses । (devanagari danda) and . for sentence endings
            sentences = re.split(r'[।\.]', comment)
            final = ""
            count = 0
            
            for s in sentences:
                if not s.strip(): continue
                s_len = len(s.split())
                if count + s_len > max_words: break
                final += s.strip() + "। "
                count += s_len
                
            final = final.strip()
            
            # For Hindi, if too short, just return as-is (don't add English fillers)
            return final if final else comment
        else:
            # For English text, apply original logic
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
        
        # Determine final language based on category (unless explicitly requested)
        final_language = self._choose_language_by_category(company)
        
        # 2. Try LLM Generation
        comment_text = None
        source = "unknown"
        comment_type = "overall"  # default
        sentiment = self._choose_sentiment()
        messages, comment_type = self._build_messages(post, company, category_name, sentiment, final_language)
        
        # Use Gemini for Hindi, local LLM for English
        if final_language == "Hindi":
            raw_output = self._call_gemini_for_hindi(messages)
            if raw_output and len(raw_output.split()) >= 10:
                comment_text = self._clean_text(raw_output)
                source = "gemini_generation"
        elif self.llm_pipeline and LLM_MODE in ['llm', 'hybrid']:
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
            if final_language == "Hindi":
                # Hindi template fallbacks
                hindi_templates = [
                    f"हम {post.get('title', 'इस नीति')} पर परामर्श की सराहना करते हैं और मानते हैं कि यह {category_name} हितधारकों की महत्वपूर्ण चिंताओं को संबोधित करती है।",
                    f"प्रस्तावित नीति {category_name} के लिए उपयोगी है लेकिन कार्यान्वयन में स्पष्टता की आवश्यकता है।",
                    f"यह मसौदा {category_name} क्षेत्र में व्यापार सुगमता को प्रभावित करेगा। मंत्रालय से स्पष्टीकरण की आवश्यकता है।"
                ]
                comment_text = random.choice(hindi_templates)
            else:
                comment_text = f"We appreciate this consultation on {post.get('title', 'the policy')} and believe it addresses important concerns for {category_name} stakeholders."
            source = "template_fallback"

        # 5. Final Polish
        final_comment = self._adjust_word_count(comment_text, min_words=50, max_words=120)

        final_comment, synthetic, notes = self._postprocess_comment(final_comment, category_name, company)
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
            "mode": LLM_MODE or 'hybrid',
            "commentType": comment_type,
            "categoryName": category_name,
            "synthetic": synthetic,
            "generated_as_role": self.persona_map.get(category_name, {}).get("role_title", "stakeholder"),
            "generation_notes": notes,
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
    language: Optional[str] = "English"

@app.get("/active")
async def root():
    return {"message": "Lok Vaani AI is active!", "total_requests": generator.total_requests}

@app.get("/status")
def status():
    return {
        "status": "active", 
        "model": MODEL_NAME, 
        "mode": LLM_MODE,
        "device": "cpu",
        "gemini_available": bool(llm),
        "gemini_project": PROJECT_ID if llm else None
    }

@app.get("/generate")
def generate_get():
    return generator.generate_comment()

@app.post("/generate")
def generate_post(req: GenRequest):
    return generator.generate_comment(req.post_id, req.company_id)

@app.get("/companies")
async def get_companies():
    return {"companies": generator.companies}

@app.get("/config")
async def get_config():
    return {
        "llm_mode": LLM_MODE or 'hybrid',
        "local_model": MODEL_NAME,
        "llm_loaded": bool(generator.llm_pipeline),
        "gemini_loaded": bool(llm),
        "device": "cpu",
        "categories_loaded": len(generator.categories),
        "posts_loaded": len(generator.posts),
        "companies_loaded": len(generator.companies),
        "hindi_support": bool(llm),
        "english_support": bool(generator.llm_pipeline) or LLM_MODE in ['dataset', 'hybrid']
    }

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8080))
    # app.run(host="0.0.0.0", port=port, debug=True)
    uvicorn.run("app:app", host="0.0.0.0", port=port, reload=True)