import os, time, math, asyncio, numpy as np, pandas as pd, requests
import vertexai
from google.oauth2 import service_account
from flask import Flask, jsonify, request
from flask_cors import CORS
import nest_asyncio
from sklearn.cluster import KMeans, MiniBatchKMeans
from sklearn.metrics import silhouette_score
from sklearn.preprocessing import StandardScaler
from sklearn.neighbors import NearestNeighbors
from sklearn.metrics.pairwise import cosine_similarity
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_google_vertexai import ChatVertexAI, HarmBlockThreshold, HarmCategory
from vertexai.preview.language_models import TextEmbeddingModel
from dotenv import load_dotenv

app = Flask(__name__)
CORS(app)

load_dotenv()
nest_asyncio.apply()

API_URL = os.environ.get("API_URL")
if not API_URL:
    raise ValueError("API_URL not set in environment variables")
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
        model="gemini-2.5-flash-lite",
        temperature=0.2,
        max_output_tokens=4096,
        project=PROJECT_ID,
        safety_settings=safety_settings,
        max_retries=1
    )

except Exception as e:
    print(f"❌ Failed to initialize Vertex AI: {e}")
    llm = None

pipeline = llm | StrOutputParser()

embed_model = TextEmbeddingModel.from_pretrained("text-embedding-004")


cluster_prompt = PromptTemplate(
    input_variables=["cluster_id", "text"],
    template="""You are a legal analyst. Summarize the following public comments for cluster {cluster_id}.
{text}
Provide:
- Dominant themes (bulleted)
- Common concerns (bulleted)
- Representative quotes (short one-liners)
- Priority issues with suggested actions (bulleted)
"""
)

Policy_analysis_prompt = PromptTemplate(
    input_variables=["document_text", "comments_data", "sentiment_data"],
    template="""
You are a Legal & Policy Analyst.
Your goal is to generate a complete structured review of the document using the format below.
If comments_data or sentiment_data are not provided, infer insights only from the draft.
===========================================
 POLICY REVIEW OUTPUT FORMAT
===========================================
1. TITLE & IDENTIFICATION
- Name of Draft/Document:
- Issued By:
- Date of Issue:
- Purpose (1–2 lines):
- Who it Applies To:
- Major Sections/Themes (bullet format):
    • Definitions
    • Obligations
    • Compliance
    • Permissions/Restrictions
    • Penalty Clauses
    • Institutional Mechanisms
-
===========================================
2. KEY ISSUES / ANOMALIES IDENTIFIED
For each anomaly, cover:
Issue Title:
- Nature of Issue:
    (Ambiguity / Over-regulation / Missing safeguards / Legal conflict / Feasibility issues)
- Why It Matters:
- Evidence from Draft (quote/paraphrase):
- Stakeholders Raising It (if comments available):
- Severity Rating (1–5)
Common anomalies to check for:
✔ Lack of clarity or vague definitions
✔ Over-regulation or rigid compliance
✔ Conflicts with existing laws or rights
✔ Unintended consequences
✔ Implementation or feasibility issues
✔ Security/privacy risks
✔ Missing accountability mechanisms
✔ Divergence from global standards
===========================================
3. RECOMMENDATIONS (STRONG + ACTIONABLE)
For each issue above provide:
- Why It Is a Problem:
- Recommendation (exact fix or redrafted clause):
- Expected Benefit:
- Global Benchmark:
    (How EU/US/UK/Singapore handle the same matter)
- Alignment Check for India:
    (Aligned / Partially aligned / Needs reform)
===========================================
4. CONCLUSION
- Overall assessment of the draft (good / moderate revision needed / major overhaul required)
- Must-fix gaps to reduce risk
- Importance of implementing changes
- Expected positive outcomes post-revision
===========================================
Generate the report now based on:
DRAFT TEXT:
{document_text}
STAKEHOLDER COMMENTS (if any):
{comments_data}
SENTIMENT / CLUSTER STATS (if available):
{sentiment_data}
"""
)

final_synthesis_prompt = PromptTemplate(
    input_variables=["cluster_summaries", "sentiment_stats", "total_comments"],
    template="""You are a legal analyst. Create a comprehensive policy analysis report.
CLUSTER SUMMARIES:
{cluster_summaries}
SENTIMENT DISTRIBUTION:
{sentiment_stats}
TOTAL COMMENTS ANALYZED: {total_comments}
Produce:
1. EXECUTIVE SUMMARY
2. METHODOLOGY
3. PUBLIC RESPONSE ANALYSIS
4. CRITICAL ISSUES
5. SENTIMENT OVERVIEW
6. RECOMMENDATIONS
7. CONCLUSION
"""
)

# ============================================================
# OPTIMIZED ASYNC HELPERS
# ============================================================
async def get_embeddings_async(texts, batch_size=250, concurrency=15):
    """Optimized embedding generation with smaller batches and higher concurrency"""
    sem = asyncio.Semaphore(concurrency)
    embeddings = []
    
    async def embed_batch(batch):
        async with sem:
            try:
                await asyncio.sleep(0.1)  
                resp = embed_model.get_embeddings(batch)
                return [r.values for r in resp]
            except Exception as e:
                print(f"⚠️ Embedding batch failed: {e}")
                
                return [[0.0] * 768 for _ in batch]
    
    def batched(iterable, batch_size=batch_size):
        for i in range(0, len(iterable), batch_size):
            yield iterable[i:i+batch_size]
    
    batches = list(batched(texts, batch_size))
    print(f"   Processing {len(batches)} embedding batches...")
    
    results = await asyncio.gather(*[embed_batch(b) for b in batches], return_exceptions=True)
    
    for r in results:
        if isinstance(r, Exception):
            print(f"⚠️ Batch error: {r}")
            continue
        embeddings.extend(r)
    
    return embeddings

async def ainvoke_text(prompt_text, retries=3, backoff=1.0, timeout=120):
    """Enhanced LLM invocation using sync invoke in thread pool to avoid asyncio issues"""
    loop = asyncio.get_event_loop()
    
    for attempt in range(retries):
        try:
            # Use sync invoke in thread pool executor to avoid nested asyncio task issues
            result = await asyncio.wait_for(
                loop.run_in_executor(None, lambda: pipeline.invoke(prompt_text)),
                timeout=timeout
            )
            return result
        except asyncio.TimeoutError:
            if attempt == retries - 1:
                return "[ERROR] LLM timeout - cluster too large"
            print(f"⏱️ Timeout on attempt {attempt+1}, retrying...")
            await asyncio.sleep(backoff * (attempt + 1))
        except asyncio.CancelledError:
            print(f"⚠️ Task cancelled on attempt {attempt+1}")
            if attempt == retries - 1:
                return "[ERROR] Task cancelled - operation interrupted"
            await asyncio.sleep(backoff * (attempt + 1))
        except Exception as e:
            error_msg = str(e)
            print(f"⚠️ Error on attempt {attempt+1}: {error_msg[:200]}")
            
            if attempt == retries - 1:
                return f"[ERROR] LLM invocation failed: {error_msg[:100]}"
            await asyncio.sleep(backoff * (attempt + 1))

async def summarize_cluster(cid, text, sem):
    """Optimized cluster summarization with size limits"""
    async with sem:
        # Strict text size limit for LLM
        MAX_CLUSTER_SIZE = 50000  
        if len(text) > MAX_CLUSTER_SIZE:
            
            half = MAX_CLUSTER_SIZE // 2
            text = text[:half] + f"\n\n...[{len(text) - MAX_CLUSTER_SIZE} chars omitted]...\n\n" + text[-half:]
        
        prompt = cluster_prompt.format(cluster_id=cid, text=text)
        return cid, await ainvoke_text(prompt, timeout=90)

# ============================================================
# OPTIMIZED CLUSTERING FUNCTIONS
# ============================================================
def propose_candidate_k(n, min_per_cluster=80, max_per_cluster=250, max_candidates=6):
    """Optimized K selection for large datasets"""
    max_k = max(3, min(n // min_per_cluster, 50))  # Cap at 50 clusters
    min_k = 3
    
    if n < min_per_cluster:
        return [3]
    
    if max_k <= min_k:
        return [3]
    
    # Logarithmic spacing for better coverage
    candidates = []
    if max_k - min_k <= max_candidates:
        candidates = list(range(min_k, max_k + 1))
    else:
        step = max(1, (max_k - min_k) // max_candidates)
        candidates = list(range(min_k, max_k + 1, step))
        if candidates[-1] != max_k:
            candidates.append(max_k)
    
    return sorted(set([k for k in candidates if k <= n]))

def semantic_dedupe_fast(indices, embeddings_array, threshold=0.92):
    """Faster deduplication using approximate nearest neighbors"""
    if len(indices) <= 1:
        return indices
    
    vecs = embeddings_array[indices]
    m = vecs.shape[0]
    
    # For small clusters, use exact method
    if m <= 50:
        sim = cosine_similarity(vecs)
        parent = list(range(m))
        
        def find(x):
            if parent[x] != x:
                parent[x] = find(parent[x])
            return parent[x]
        
        def union(x, y):
            px, py = find(x), find(y)
            if px != py:
                parent[px] = py
        
        for i in range(m):
            for j in range(i+1, m):
                if sim[i, j] >= threshold:
                    union(i, j)
        
        groups = {}
        for i in range(m):
            root = find(i)
            if root not in groups:
                groups[root] = i
        
        return [indices[i] for i in sorted(groups.values())]
    
    # For large clusters, use approximate method
    kept = [0]  # Always keep first
    nn = NearestNeighbors(n_neighbors=min(10, m), metric='cosine', algorithm='brute')
    nn.fit(vecs)
    
    for i in range(1, m):
        distances, _ = nn.kneighbors([vecs[i]], n_neighbors=min(len(kept)+1, 10))
        min_dist = distances[0][0] if len(distances[0]) > 0 else 1.0
        similarity = 1 - min_dist
        
        if similarity < threshold:
            kept.append(i)
    
    return [indices[i] for i in kept]

# ============================================================
# OPTIMIZED MAIN ANALYSIS FUNCTION
# ============================================================
async def analyze_comments_async(comments, sentiments, draft_text):
    """Optimized main analysis pipeline for 1000+ comments"""
    
    n_samples = len(comments)
    print(f"\n📊 Comment count: {n_samples}")
    
    # ============================================================
    # ADAPTIVE DRAFT CHUNKING
    # ============================================================
    if len(draft_text) > 30000:
        print(f"📄 Draft too large ({len(draft_text)} chars). Chunking...")
        splitter = RecursiveCharacterTextSplitter(
            chunk_size=10000,
            chunk_overlap=500,
            separators=["\n\n", "\n", ".", " ", ""]
        )
        draft_chunks = splitter.split_text(draft_text)
        print(f"   Created {len(draft_chunks)} draft chunks")
        # Limit to first 5 chunks to avoid overwhelming the LLM
        if len(draft_chunks) > 5:
            draft_chunks = draft_chunks[:5]
            print(f"   ⚠️ Limiting to first 5 chunks")
        draft_text = "\n\n".join([f"### DRAFT CHUNK {i+1}\n{ch}" for i, ch in enumerate(draft_chunks)])
    else:
        print(f"📄 Draft length {len(draft_text)} chars → No chunking needed")
    
    if n_samples < 3:
        raise ValueError("Need at least 3 comments for clustering")
    
    # ============================================================
    # OPTIMIZED EMBEDDING
    # ============================================================
    print("\n🔢 Generating embeddings...")
    start = time.time()
    
    # Truncate very long comments to avoid API issues
    MAX_COMMENT_LENGTH = 5000
    truncated_comments = [c[:MAX_COMMENT_LENGTH] if len(c) > MAX_COMMENT_LENGTH else c for c in comments]
    
    embeddings = await get_embeddings_async(truncated_comments, batch_size=250, concurrency=15)
    print(f"   ✅ Embedded {len(comments)} comments in {time.time() - start:.2f}s")
    
    E = np.array(embeddings, dtype=np.float32)
    
    # Memory-efficient scaling
    scaler = StandardScaler(with_mean=False)
    X = scaler.fit_transform(E)
    
    # ============================================================
    # OPTIMIZED K SELECTION WITH MINI-BATCH KMEANS
    # ============================================================
    print("\n🎯 Finding optimal clusters...")
    candidate_ks = propose_candidate_k(n_samples)
    print(f"   Candidate k: {candidate_ks}")
    
    best_k, best_score, best_labels = None, -2, None
    
    # Sample size for silhouette scoring (max 1000 for speed)
    sample_size = min(1000, n_samples)
    sample_idx = np.random.choice(n_samples, size=sample_size, replace=False)
    
    for k in candidate_ks:
        try:
            # Use MiniBatchKMeans for large datasets (much faster)
            if n_samples > 500:
                km = MiniBatchKMeans(
                    n_clusters=k, 
                    batch_size=256,
                    n_init=3, 
                    random_state=42,
                    max_iter=100
                )
            else:
                from sklearn.cluster import KMeans
                km = KMeans(n_clusters=k, n_init=5, random_state=42)
            
            labels = km.fit_predict(X)
            
            if len(set(labels)) < 2:
                continue
            
            # Calculate silhouette score on sample only
            score = silhouette_score(X[sample_idx], labels[sample_idx], sample_size=min(500, sample_size))
            
            if score > best_score:
                best_k, best_score, best_labels = k, score, labels
                
        except Exception as e:
            print(f"   ⚠️ K={k} failed: {e}")
            continue
    
    if best_k is None:
        print("   ⚠️ Fallback: using heuristic k")
        best_k = min(max(3, n_samples // 150), 30)
        km = MiniBatchKMeans(n_clusters=best_k, batch_size=256, n_init=3, random_state=42)
        best_labels = km.fit_predict(X)
        best_score = -1.0
    
    print(f"   ✅ Selected k={best_k} (score={best_score:.3f})")
    
    # ============================================================
    # BUILD CLUSTERS
    # ============================================================
    print("\n🗂️ Building clusters...")
    clusters = {}
    cluster_indices = {}
    
    for i, lbl in enumerate(best_labels):
        clusters.setdefault(lbl, []).append(comments[i])
        cluster_indices.setdefault(lbl, []).append(i)
    
    print(f"   Created {len(clusters)} clusters")
    
    # ============================================================
    # OPTIMIZED SEMANTIC DEDUPLICATION
    # ============================================================
    print("\n🔍 Running semantic deduplication...")
    new_clusters = {}
    total_before = 0
    total_after = 0
    
    # Process clusters in parallel
    async def dedupe_cluster(cid, idxs):
        if len(idxs) <= 1:
            return cid, [comments[i] for i in idxs], len(idxs), len(idxs)
        
        keep_indices = semantic_dedupe_fast(idxs, E, threshold=0.92)
        return cid, [comments[i] for i in keep_indices], len(idxs), len(keep_indices)
    
    dedupe_tasks = [dedupe_cluster(cid, idxs) for cid, idxs in cluster_indices.items()]
    dedupe_results = await asyncio.gather(*dedupe_tasks)
    
    for cid, texts, before, after in dedupe_results:
        new_clusters[cid] = texts
        total_before += before
        total_after += after
    
    clusters = new_clusters
    reduction_pct = ((total_before - total_after) / total_before * 100) if total_before > 0 else 0
    
    print(f"    Deduplication complete!")
    print(f"      Before: {total_before} comments")
    print(f"      After:  {total_after} comments")
    print(f"      Removed: {total_before - total_after} duplicates ({reduction_pct:.1f}%)")
    
    # ============================================================
    # PREPARE CLUSTER TEXTS (WITH SIZE LIMITS)
    # ============================================================
    print("\n📝 Preparing cluster texts...")
    cluster_full_text = {}
    
    for cid, texts in clusters.items():
        # Limit comments per cluster to avoid huge texts
        MAX_COMMENTS_PER_CLUSTER = 100
        if len(texts) > MAX_COMMENTS_PER_CLUSTER:
            # Sample diverse comments
            indices = np.linspace(0, len(texts)-1, MAX_COMMENTS_PER_CLUSTER, dtype=int)
            texts = [texts[i] for i in indices]
        
        joined = "\n---\n".join(texts)
        
        # Hard limit on cluster text size
        MAX_SIZE = 60000
        if len(joined) > MAX_SIZE:
            half = MAX_SIZE // 2
            joined = joined[:half] + f"\n\n...[{len(joined) - MAX_SIZE} chars omitted]...\n\n" + joined[-half:]
        
        cluster_full_text[cid] = joined
    
    print(f"   Prepared {len(cluster_full_text)} clusters")
    
    # ============================================================
    # PARALLEL CLUSTER SUMMARIZATION
    # ============================================================
    print("\n🤖 Summarizing clusters...")
    concurrency = 8  # Balanced concurrency
    sem = asyncio.Semaphore(concurrency)
    
    cluster_tasks = [summarize_cluster(cid, text, sem) for cid, text in cluster_full_text.items()]
    
    try:
        cluster_results = await asyncio.gather(*cluster_tasks, return_exceptions=True)
    except Exception as e:
        print(f"   ⚠️ Error during cluster summarization: {str(e)}")
        # Handle partial results
        cluster_results = [(i, f"[ERROR] {str(e)[:100]}") for i in range(len(cluster_tasks))]
    
    # Filter out errors and build summaries
    cluster_summaries = {}
    for result in cluster_results:
        if isinstance(result, tuple) and len(result) == 2:
            cid, summary = result
            cluster_summaries[cid] = summary
        elif isinstance(result, Exception):
            print(f"   ⚠️ Cluster task exception: {str(result)[:100]}")
    
    print(f"   ✅ Cluster summaries complete ({len(cluster_summaries)} successful)")
    
    # ============================================================
    # SENTIMENT STATS
    # ============================================================
    df = pd.DataFrame({'sentiment': sentiments})
    neg = (df['sentiment'] == 'Negative').sum()
    pos = (df['sentiment'] == 'Positive').sum()
    neu = (df['sentiment'] == 'Neutral').sum()
    total = len(df)
    
    sentiment_stats = f"""
Negative: {neg} ({neg/total*100:.1f}%)
Positive: {pos} ({pos/total*100:.1f}%)
Neutral : {neu} ({neu/total*100:.1f}%)
Total   : {total}
"""
    
    # ============================================================
    # FINAL SYNTHESIS
    # ============================================================
    print("\n📊 Final synthesis...")
    cluster_summaries_text = "\n\n".join([
        f"=== CLUSTER {cid} ===\n{cluster_summaries[cid]}"
        for cid in sorted(cluster_summaries.keys())
    ])
    
    # Limit final summary size
    MAX_FINAL_SIZE = 100000
    if len(cluster_summaries_text) > MAX_FINAL_SIZE:
        cluster_summaries_text = cluster_summaries_text[:MAX_FINAL_SIZE] + "\n\n...[truncated]..."
    
    sentiment_and_cluster_data = f"""{sentiment_stats}
Total Clusters Identified: {len(cluster_summaries)}
Comments After Deduplication: {total_after}
"""
    
    final_prompt = final_synthesis_prompt.format(
        cluster_summaries=cluster_summaries_text,
        sentiment_stats=sentiment_and_cluster_data,
        total_comments=total_after
    )
    
    # Try final synthesis with extended timeout and fallback
    print("   Starting final synthesis (may take 3-5 minutes)...")
    try:
        overall_summary = await asyncio.wait_for(
            ainvoke_text(final_prompt, timeout=240, retries=2),
            timeout=300  # 5 minute hard limit
        )
    except (asyncio.TimeoutError, asyncio.CancelledError) as e:
        print(f"   ⚠️ Final synthesis timeout/cancelled: {str(e)}")
        # Fallback: Return cluster summaries directly
        overall_summary = f"""[ANALYSIS SUMMARY - Generated from {len(cluster_summaries)} clusters]

{sentiment_stats}

CLUSTER INSIGHTS:
{cluster_summaries_text[:50000]}

[Note: Full AI synthesis timed out - showing cluster summaries directly]"""
    
    print("   ✅ Synthesis complete")
    return overall_summary

@app.route('/api/analyze', methods=['POST'])
def analyze():
    """
    Main endpoint to analyze policy draft
    Accepts categoryId in request body to filter comments by category
    If categoryId is 'overall' or not provided, analyzes all comments
    Reads draft.txt from current directory
    Fetches comments from API
    Returns analysis summary
    """
    try:
        start_time = time.time()
        
        # Get categoryId from request body
        request_data = request.get_json() or {}
        category_id = request_data.get('categoryId', 'overall')
        
        print(f"📊 Category ID: {category_id}")
        
        # Read draft from file
        draft_path = os.path.join(os.getcwd(), 'draft.txt')
        if not os.path.exists(draft_path):
            return jsonify({
                'statusCode': 404,
                'error': 'draft.txt not found in current directory'
            }), 404
        
        with open(draft_path, 'r', encoding='utf-8') as f:
            draft_text = f.read()
        
        print(f"📄 Draft loaded: {len(draft_text)} characters")
        
        # Build API URL with categoryId parameter
        api_url = f"{API_URL}?categoryId={category_id}"
        
        # Fetch comments from API with reasonable timeout (5 minutes)
        print(f"🌐 Fetching comments from: {api_url}")
        response = requests.get(api_url, timeout=300)  # 5 minute timeout
        response.raise_for_status()
        
        api_data = response.json()

        # Handle different API response structures
        if isinstance(api_data, list):
            # Direct list response
            comments_data = api_data
        elif isinstance(api_data, dict):
            if api_data.get('statusCode') != 200:
                return jsonify({
                    'statusCode': 400,
                    'error': 'API returned non-200 status'
                }), 400
            
            # Check if data is directly a list or nested in comments
            data_field = api_data.get('data', {})
            if isinstance(data_field, list):
                comments_data = data_field
            elif isinstance(data_field, dict):
                comments_data = data_field.get('comments', [])
            else:
                comments_data = []
        else:
            comments_data = []

        if not comments_data:
            return jsonify({
                'statusCode': 400,
                'error': 'No comments found in API response'
            }), 400
        
        comments = [item.get('standardComment', '') for item in comments_data]
        sentiments = [item.get('sentiment', 'Neutral') for item in comments_data]
        
        # Filter out empty comments
        valid_indices = [i for i, c in enumerate(comments) if c and len(c.strip()) > 0]
        comments = [comments[i] for i in valid_indices]
        sentiments = [sentiments[i] for i in valid_indices]
        
        print(f"💬 Fetched {len(comments)} valid comments")
        
        # Run analysis
        summary = asyncio.run(analyze_comments_async(comments, sentiments, draft_text))
        
        elapsed = time.time() - start_time
        print(f"\n✅ Total time: {elapsed:.2f}s ({elapsed/60:.2f} min)")
        
        return jsonify({
            'statusCode': 200,
            'data': {
                'summary': summary,
                'metadata': {
                    'category_id': category_id,
                    'total_comments': len(comments),
                    'processing_time_seconds': round(elapsed, 2),
                    'draft_length': len(draft_text)
                }
            }
        })
        
    except requests.RequestException as e:
        print(f"❌ API Error: {e}")
        return jsonify({
            'statusCode': 500,
            'error': f'Failed to fetch comments from API: {str(e)}'
        }), 500
    except Exception as e:
        print(f"❌ Analysis Error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'statusCode': 500,
            'error': f'Analysis failed: {str(e)}'
        }), 500

@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({
        'statusCode': 200,
        'status': 'healthy',
        'service': 'Policy Analysis API',
        'max_comments': '1000+'
    })



if __name__ == '__main__':
    port = int(os.environ.get("PORT", 8000))
    app.run(debug=True, host='0.0.0.0', port=port, use_reloader=False)