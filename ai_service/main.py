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
    if api_key:
        try:
            model = genai.GenerativeModel('gemini-1.5-flash')
            prompt = f"""
            You are an expert AI Career Mentor. Help the candidate with their career queries.
            Context about candidate: {json.dumps(context)}
            Candidate Message: {message}
            Provide a professional, encouraging, and actionable response.
            """
            response = model.generate_content(prompt)
            if response and response.text:
                return {"reply": response.text.strip()}
        except Exception as e:
            pass
            
    # Built-in intelligent AI mentor heuristics
    lower_msg = message.lower()
    if "job" in lower_msg or "better" in lower_msg or "find" in lower_msg:
        return {
            "reply": (
                "To land a higher-tier role and maximize your opportunities, I recommend three focused steps:\n\n"
                "1. **Tailor Your Resume for ATS**: Align keywords from target job descriptions directly in your experience summaries and skill tags.\n"
                "2. **Highlight Quantifiable Achievements**: Instead of listing duties, emphasize your impact (e.g., 'Boosted efficiency by 30%' or 'Delivered project 2 weeks ahead of deadline').\n"
                "3. **Leverage Autonomous AI Applications**: Enable the auto-apply agent in your JobHub profile with target keywords so our AI surfaces you to relevant employers the moment positions open."
            )
        }
    elif "interview" in lower_msg:
        return {
            "reply": (
                "For successful technical and behavioral interviews:\n\n"
                "• **Use the STAR Method**: Structure your answers around Situation, Task, Action, and Result.\n"
                "• **Research the Company Stack**: Familiarize yourself with their recent initiatives, tech stack, and company mission.\n"
                "• **Prepare High-Impact Questions**: Ask interviewers about their team's quarterly priorities and technical challenges."
            )
        }
    elif "salary" in lower_msg or "negotiate" in lower_msg:
        return {
            "reply": (
                "When discussing compensation:\n\n"
                "• Benchmark market rates for your role, experience level, and geography using our AI Salary Estimator.\n"
                "• Focus negotiations on the value and demonstrable ROI you deliver to the team.\n"
                "• Consider the full package: base salary, equity/bonuses, remote flexibility, and learning stipends."
            )
        }
    elif "skill" in lower_msg or "learn" in lower_msg:
        return {
            "reply": (
                "To remain ahead in today's market, prioritize high-demand capabilities: cloud infrastructure (AWS/GCP), AI/ML integration, modern frameworks, and strong cross-functional communication."
            )
        }
    else:
        return {
            "reply": (
                f"Thank you for sharing! As your AI Career Mentor, I'm here to support your journey. Regarding '{message}', "
                "my top recommendation is to keep your JobHub profile skills updated, utilize ATS-optimized resumes for specific applications, "
                "and maintain an active presence in our Professional Network. What specific goals are you targeting next?"
            )
        }

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
        jd_data = generate_job_description(req)
        if isinstance(jd_data, dict):
            # Include both root fields and a combined description field for backwards compatibility
            res = dict(jd_data)
            if "description" not in res:
                res["description"] = f"{res.get('title', '')}\n\n" + "\n".join(res.get("responsibilities", []))
            return res
        else:
            return {"description": jd_data, "title": req.get("title", "Open Position")}
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

