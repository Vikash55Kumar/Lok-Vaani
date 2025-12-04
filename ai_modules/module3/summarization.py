import os, time, math, asyncio, numpy as np, pandas as pd, requests
import vertexai
from google.oauth2 import service_account
from flask import Flask, jsonify, request
from flask_cors import CORS
 
from sklearn.cluster import KMeans
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
vertex_key_path = os.getenv("VERTEX_AI_KEY")
os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = vertex_key_path
PROJECT_ID = "master-scanner-479706-b3"
vertexai.init(project=PROJECT_ID, location="us-central1")

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
# ASYNC HELPERS (UNCHANGED)
# ============================================================
async def get_embeddings_async(texts, batch_size=1000, concurrency=10):
    sem = asyncio.Semaphore(concurrency)
    embeddings = []

    async def embed_batch(batch):
        async with sem:
            resp = embed_model.get_embeddings(batch)
            return [r.values for r in resp]

    def batched(iterable, batch_size=batch_size):
        for i in range(0, len(iterable), batch_size):
            yield iterable[i:i+batch_size]

    batches = list(batched(texts, batch_size))
    results = await asyncio.gather(*[embed_batch(b) for b in batches])
    for r in results:
        embeddings.extend(r)
    return embeddings

async def ainvoke_text(prompt_text, retries=2, backoff=0.5):
    for attempt in range(retries):
        try:
            return await pipeline.ainvoke(prompt_text)
        except Exception as e:
            if attempt == retries - 1:
                return f"[ERROR] {e}"
            await asyncio.sleep(backoff * (attempt + 1))

async def summarize_cluster(cid, text, sem):
    async with sem:
        prompt = cluster_prompt.format(cluster_id=cid, text=text)
        return cid, await ainvoke_text(prompt)

# ============================================================
# CLUSTERING FUNCTIONS (UNCHANGED)
# ============================================================
def propose_candidate_k(n, min_per_cluster=100, max_per_cluster=300, max_candidates=8):
    max_k = max(2, min(n // min_per_cluster, 2000))
    min_k = 2
    if n < min_per_cluster:
        max_k = 2
    if max_k <= min_k:
        return [2]
    step = max(1, (max_k - min_k) // max_candidates)
    candidates = list(range(min_k, max_k+1, step))
    if candidates[-1] != max_k:
        candidates.append(max_k)
    return sorted(set([k for k in candidates if k <= n]))

def semantic_dedupe(indices, embeddings_array, threshold=0.90):
    if len(indices) <= 1:
        return indices

    vecs = embeddings_array[indices]
    m = vecs.shape[0]

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

# ============================================================
# MAIN ANALYSIS FUNCTION
# ============================================================
async def analyze_comments_async(comments, sentiments, draft_text):
    """Main analysis pipeline"""
    
    n_samples = len(comments)
    print(f"\n Comment count: {n_samples}")
    
    # ============================================================
    # ADAPTIVE DRAFT CHUNKING
    # ============================================================
    if len(draft_text) > 25000:
        print(f" Draft too large ({len(draft_text)} chars). Chunking...")
        splitter = RecursiveCharacterTextSplitter(
            chunk_size=8000,
            chunk_overlap=500,
            separators=["\n\n", "\n", ".", " ", ""]
        )
        draft_chunks = splitter.split_text(draft_text)
        print(f" Created {len(draft_chunks)} draft chunks")
        draft_text = "\n\n".join([f"### DRAFT CHUNK {i+1}\n{ch}" for i, ch in enumerate(draft_chunks)])
        print(" Draft replaced with chunked version\n")
    else:
        print(f" Draft length {len(draft_text)} chars → No chunking needed\n")

    if n_samples < 2:
        raise ValueError("Need at least 2 comments for clustering")

    # ============================================================
    # EMBEDDING
    # ============================================================
    start = time.time()
    embeddings = await get_embeddings_async(comments, batch_size=1000, concurrency=10)
    print(f" Embedded {len(comments)} comments in {time.time() - start:.2f}s")

    E = np.array(embeddings, dtype=np.float32)
    X = StandardScaler(with_mean=False).fit_transform(E)

    # ============================================================
    # ADAPTIVE K SELECTION
    # ============================================================
    candidate_ks = propose_candidate_k(n_samples)
    print("🔍 Candidate k:", candidate_ks)

    best_k, best_score, best_labels = None, -2, None
    sample_idx = np.random.choice(n_samples, size=min(2000, n_samples), replace=False)

    for k in candidate_ks:
        try:
            km = KMeans(n_clusters=k, n_init=5, random_state=42)
            labels = km.fit_predict(X)
            if len(set(labels)) < 2:
                continue
            score = silhouette_score(X[sample_idx], labels[sample_idx])
            if score > best_score:
                best_k, best_score, best_labels = k, score, labels
        except Exception:
            continue

    if best_k is None:
        best_k = min(max(2, n_samples // 200), n_samples)
        km = KMeans(n_clusters=best_k, n_init=5, random_state=42)
        best_labels = km.fit_predict(X)
        best_score = -1.0

    print(f" Selected k={best_k} (score={best_score:.3f})")

    # ============================================================
    # BUILD CLUSTERS
    # ============================================================
    clusters = {}
    cluster_indices = {}
    for i, lbl in enumerate(best_labels):
        clusters.setdefault(lbl, []).append(comments[i])
        cluster_indices.setdefault(lbl, []).append(i)
    print(f" Built {len(clusters)} clusters")

    # ============================================================
    # SEMANTIC DEDUPLICATION
    # ============================================================
    print(" Running semantic deduplication within clusters...")
    new_clusters = {}
    total_before = 0
    total_after = 0

    for cid, idxs in cluster_indices.items():
        total_before += len(idxs)
        if len(idxs) <= 1:
            new_clusters[cid] = [comments[i] for i in idxs]
            total_after += len(idxs)
            continue

        keep_indices = semantic_dedupe(idxs, E, threshold=0.90)
        new_clusters[cid] = [comments[i] for i in keep_indices]
        total_after += len(keep_indices)

    clusters = new_clusters

    reduction_pct = ((total_before - total_after) / total_before * 100) if total_before > 0 else 0
    print(f" Deduplication complete!")
    print(f"   Before: {total_before} comments")
    print(f"   After:  {total_after} comments")
    print(f"   Removed: {total_before - total_after} duplicates ({reduction_pct:.1f}%)")

    # ============================================================
    # PREPARE CLUSTER TEXTS
    # ============================================================
    cluster_full_text = {}
    for cid, texts in clusters.items():
        joined = "\n---\n".join(texts)
        if len(joined) > 200_000:
            joined = joined[:180_000] + "\n\n...(truncated)...\n\n" + joined[-10_000:]
        cluster_full_text[cid] = joined

    print(f" Prepared {len(cluster_full_text)} clusters")

    # ============================================================
    # CLUSTER SUMMARIZATION
    # ============================================================
    concurrency = 6 if n_samples < 1000 else 10
    sem = asyncio.Semaphore(concurrency)

    print(" Summarizing clusters...")
    cluster_tasks = [summarize_cluster(cid, text, sem) for cid, text in cluster_full_text.items()]
    cluster_results = await asyncio.gather(*cluster_tasks)
    cluster_summaries = {cid: summary for cid, summary in cluster_results}
    print(" Cluster summaries complete")

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
    print("📝 Final synthesis...")

    cluster_summaries_text = "\n\n".join([
        f"=== CLUSTER {cid} ===\n{cluster_summaries[cid]}"
        for cid in sorted(cluster_summaries.keys())
    ])

    sentiment_and_cluster_data = f"""{sentiment_stats}
Total Clusters Identified: {len(cluster_summaries)}
Comments After Deduplication: {total_after}
"""

    final_prompt = final_synthesis_prompt.format(
        cluster_summaries=cluster_summaries_text,
        sentiment_stats=sentiment_and_cluster_data,
        total_comments=total_after
    )

    overall_summary = await ainvoke_text(final_prompt)
    
    return overall_summary


@app.route('/api/analyze', methods=['GET'])
def analyze():
    """
    Main endpoint to analyze policy draft
    Reads draft.txt from current directory
    Fetches comments from API
    Returns analysis summary
    """
    try:
        start_time = time.time()
        
        # Read draft from file
        draft_path = os.path.join(os.getcwd(), 'draft.txt')
        if not os.path.exists(draft_path):
            return jsonify({
                'statusCode': 404,
                'error': 'draft.txt not found in current directory'
            }), 404
        
        with open(draft_path, 'r', encoding='utf-8') as f:
            draft_text = f.read()
        
        print(f" Draft loaded: {len(draft_text)} characters")
        
        # Fetch comments from API
        api_url = "https://lok-vaani-1.onrender.com/api/v1/comments/tabular-comment"
        print(f"🌐 Fetching comments from: {api_url}")
        
        response = requests.get(api_url, timeout=None)
        response.raise_for_status()
        
        api_data = response.json()
        
        if api_data.get('statusCode') != 200:
            return jsonify({
                'statusCode': 400,
                'error': 'API returned non-200 status'
            }), 400
        
        comments_data = api_data.get('data', [])
        
        if not comments_data:
            return jsonify({
                'statusCode': 400,
                'error': 'No comments found in API response'
            }), 400
        
        
        comments = [item.get('rawComment', '') for item in comments_data]
        sentiments = [item.get('sentiment', 'Neutral') for item in comments_data]
        
        print(f" Fetched {len(comments)} comments")
        
       
        summary = asyncio.run(analyze_comments_async(comments, sentiments, draft_text))
        
        elapsed = time.time() - start_time
        print(f" Total time: {elapsed:.2f}s ({elapsed/60:.2f} min)")
        
        return jsonify({
            'statusCode': 200,
            'data': {
                'summary': summary,
                'metadata': {
                    'total_comments': len(comments),
                    'processing_time_seconds': round(elapsed, 2),
                    'draft_length': len(draft_text)
                }
            }
        })
        
    except requests.RequestException as e:
        return jsonify({
            'statusCode': 500,
            'error': f'Failed to fetch comments from API: {str(e)}'
        }), 500
    except Exception as e:
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
        'service': 'Policy Analysis API'
    })


if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)