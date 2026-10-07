from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import os
import json
from dotenv import load_dotenv
from services.resume_engine import generate_resume, parse_resume_text, optimize_ats_resume
from services.cover_letter_engine import generate_cover_letter
from services.matching_engine import generate_embedding, calculate_match_score
import google.generativeai as genai

load_dotenv()

app = FastAPI(title="Job Hub AI - FastAPI Layer")

# Pydantic Models for Request Bodies
class JobSeekerProfile(BaseModel):
    first_name: str
    last_name: str
    bio: str
    skills: List[str]

class JobDescription(BaseModel):
    title: str
    description: str
    company_name: str

class CoverLetterRequest(BaseModel):
    profile: JobSeekerProfile
    job: JobDescription

class MatchScoreRequest(BaseModel):
    profile_text: str
    job_description_text: str

class EmbeddingRequest(BaseModel):
    text: str

@app.get("/health")
def health_check():
    return {"status": "healthy", "service": "FastAPI AI Layer"}

@app.post("/ai/resume/generate")
def api_generate_resume(profile: JobSeekerProfile):
    try:
        resume_content = generate_resume(profile.dict())
        return {"resume": resume_content}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/ai/cover-letter/generate")
def api_generate_cover_letter(req: CoverLetterRequest):
    try:
        cover_letter = generate_cover_letter(req.profile.dict(), req.job.dict())
        return {"cover_letter": cover_letter}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/ai/match/score")
def api_match_score(req: MatchScoreRequest):
    try:
        score = calculate_match_score(req.profile_text, req.job_description_text)
        return {"match_score": score}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/ai/embeddings/generate")
def api_generate_embedding(req: EmbeddingRequest):
    try:
        embedding = generate_embedding(req.text)
        return {"embedding": embedding}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class ParseResumeRequest(BaseModel):
    text: str

class OptimizeAtsRequest(BaseModel):
    resume: dict
    jobDescription: str

@app.post("/ai/parse-resume")
def api_parse_resume(req: ParseResumeRequest):
    try:
        data = parse_resume_text(req.text)
        return data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/ai/optimize-ats")
def api_optimize_ats(req: OptimizeAtsRequest):
    try:
        data = optimize_ats_resume(req.resume, req.jobDescription)
        return data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/ai/mentor/chat")
def api_mentor_chat(req: dict):
    message = req.get("message", "")
    context = req.get("context", {})
    
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        return {"reply": "[MOCK MENTOR] - Please provide a GEMINI_API_KEY to speak with the AI mentor."}
        
    model = genai.GenerativeModel('gemini-1.5-flash')
    prompt = f"""
    You are an expert AI Career Mentor. Help the candidate with their career queries.
    Context about candidate: {json.dumps(context)}
    Candidate Message: {message}
    Provide a professional, encouraging, and actionable response.
    """
    try:
        response = model.generate_content(prompt)
        return {"reply": response.text}
    except Exception as e:
        return {"reply": f"Sorry, I encountered an error: {str(e)}"}

from services.advanced_engine import score_profile, skill_gap_analysis, estimate_salary, career_suggestions, generate_interview_questions, generate_job_description, detect_fraud

@app.post("/ai/profile/score")
def api_profile_score(req: dict):
    try:
        return score_profile(req)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/ai/skills/gap")
def api_skill_gap(req: dict):
    try:
        return skill_gap_analysis(req.get("profile", {}), req.get("job", {}))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/ai/salary/estimate")
def api_salary_estimate(req: dict):
    try:
        return estimate_salary(req.get("job_title", ""), req.get("location", ""), req.get("experience_years", 0))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/ai/career/suggestions")
def api_career_suggestions(req: dict):
    try:
        return {"suggestions": career_suggestions(req)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/ai/interview/questions")
def api_interview_questions(req: dict):
    try:
        return {"questions": generate_interview_questions(req.get("job", {}), req.get("profile", {}))}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/ai/job-description/generate")
def api_generate_job_description(req: dict):
    try:
        return {"description": generate_job_description(req)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class FraudRequest(BaseModel):
    content: str

@app.post("/ai/fraud/detect")
def api_fraud_detect(req: FraudRequest):
    try:
        return detect_fraud(req.content)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

