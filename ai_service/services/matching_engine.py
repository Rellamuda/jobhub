import os
import math
import google.generativeai as genai

api_key = os.getenv("GEMINI_API_KEY")
if api_key:
    genai.configure(api_key=api_key)

def generate_embedding(text: str) -> list[float]:
    """
    Uses Gemini's embedding model to generate a vector array for a given text.
    This vector can be stored in pgvector via NestJS.
    """
    if not api_key:
        # Return a mock 768-dimensional embedding if no key is present
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
    Generates embeddings for both the candidate profile and the job description,
    then calculates a percentage match score based on semantic cosine similarity.
    """
    if not api_key:
        return 85.5 # Mock score

    profile_vector = generate_embedding(profile_text)
    job_vector = generate_embedding(job_description_text)
    
    # Cosine similarity returns a value between -1 and 1
    sim = cosine_similarity(profile_vector, job_vector)
    
    # Convert to a friendly percentage (0 to 100)
    # We can clip negative similarities to 0
    score = max(0.0, sim) * 100
    
    # Optional: We could apply a slight curve to make scores look more realistic
    return round(score, 2)
