import os
import math
import re
import google.generativeai as genai

api_key = os.getenv("GEMINI_API_KEY")
if api_key:
    genai.configure(api_key=api_key)

STOP_WORDS = {
    'a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and', 'any', 'are', 'aren',
    'as', 'at', 'be', 'because', 'been', 'before', 'being', 'below', 'between', 'both', 'but', 'by',
    'can', 'could', 'did', 'do', 'does', 'doing', 'down', 'during', 'each', 'few', 'for', 'from',
    'further', 'had', 'has', 'have', 'having', 'he', 'her', 'here', 'hers', 'herself', 'him', 'himself',
    'his', 'how', 'i', 'if', 'in', 'into', 'is', 'isn', 'it', 'its', 'itself', 'just', 'me', 'more',
    'most', 'my', 'myself', 'no', 'nor', 'not', 'of', 'off', 'on', 'once', 'only', 'or', 'other',
    'our', 'ours', 'ourselves', 'out', 'over', 'own', 'same', 'she', 'should', 'so', 'some', 'such',
    'than', 'that', 'the', 'their', 'theirs', 'them', 'themselves', 'then', 'there', 'these', 'they',
    'this', 'those', 'through', 'to', 'too', 'under', 'until', 'up', 'very', 'was', 'wasn', 'we',
    'were', 'what', 'when', 'where', 'which', 'while', 'who', 'whom', 'why', 'with', 'would', 'you',
    'your', 'yours', 'yourself', 'yourselves', 'work', 'working', 'team', 'company', 'role', 'year',
    'years', 'experience', 'candidate', 'looking', 'join', 'help', 'able', 'good', 'strong', 'well',
    'opportunity', 'responsibilities', 'qualifications', 'requirements'
}

def extract_tokens(text: str) -> set[str]:
    tokens = re.findall(r'[a-zA-Z0-9+#.-]+', (text or '').lower())
    return {t for t in tokens if len(t) > 2 and t not in STOP_WORDS}

def algorithmic_match_score(profile_text: str, job_text: str) -> float:
    profile_tokens = extract_tokens(profile_text)
    job_tokens = extract_tokens(job_text)
    
    if not profile_tokens or not job_tokens:
        return 32.0
    
    common = profile_tokens.intersection(job_tokens)
    if not common:
        return 18.0
    
    # Overlap relative to job requirements & total tokens
    overlap_ratio = len(common) / max(len(job_tokens), 1)
    jaccard = len(common) / len(profile_tokens.union(job_tokens))
    
    # Keyword weight bonus
    bonus = 0.0
    for token in common:
        if len(token) >= 5:
            bonus += 4.0
        else:
            bonus += 2.0
            
    base_score = 35.0 + (overlap_ratio * 40.0) + (jaccard * 45.0) + min(20.0, bonus)
    return round(min(98.0, max(20.0, base_score)), 1)

def generate_embedding(text: str) -> list[float]:
    """
    Uses Gemini's embedding model to generate a vector array for a given text.
    """
    if not api_key:
        return [0.0] * 768

    result = genai.embed_content(
        model="models/text-embedding-004",
        content=text,
        task_type="retrieval_document"
    )
    return result['embedding']

def cosine_similarity(vec1: list[float], vec2: list[float]) -> float:
    """Calculates cosine similarity between two vectors."""
    dot_product = sum(a * b for a, b in zip(vec1, vec2))
    norm_a = math.sqrt(sum(a * a for a in vec1))
    norm_b = math.sqrt(sum(b * b for b in vec2))
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return float(dot_product / (norm_a * norm_b))

def calculate_match_score(profile_text: str, job_description_text: str) -> float:
    """
    Calculates dynamic percentage match score between candidate profile and job description.
    Uses semantic Gemini embeddings when key is available, combined with keyword token analysis.
    """
    if api_key:
        try:
            profile_vector = generate_embedding(profile_text)
            job_vector = generate_embedding(job_description_text)
            sim = cosine_similarity(profile_vector, job_vector)
            if sim > 0:
                score = sim * 100
                return round(min(98.5, max(15.0, score)), 1)
        except Exception:
            pass

    return algorithmic_match_score(profile_text, job_description_text)
