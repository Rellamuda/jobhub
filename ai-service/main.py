from fastapi import FastAPI
from pydantic import BaseModel
import google.generativeai as genai
import os
from dotenv import load_dotenv
import json

load_dotenv()
genai.configure(api_key=os.environ.get("GEMINI_API_KEY"))
model = genai.GenerativeModel('gemini-1.5-flash')

app = FastAPI(title="Job Hub AI Service", version="1.0.0")

class ResumeRequest(BaseModel):
    user_profile: dict

class CoverLetterRequest(BaseModel):
    user_profile: dict
    job_details: dict

class MatchScoreRequest(BaseModel):
    user_profile: dict
    job_description: dict

class ParseResumeRequest(BaseModel):
    text: str

class OptimizeAtsRequest(BaseModel):
    resume: dict
    jobDescription: str

class MentorChatRequest(BaseModel):
    userId: str
    message: str
    context: dict = {}

class FraudDetectRequest(BaseModel):
    entityType: str # "JOB", "COMPANY", "CV", "USER"
    data: dict

class GenerateJDRequest(BaseModel):
    prompt: str

@app.get("/health")
def health_check():
    return {"status": "ok"}

@app.post("/ai/resume")
def generate_resume(request: ResumeRequest):
    # TODO: Implement AI generation
    return {"resume_text": "ATS-optimized resume content..."}

@app.post("/ai/cover-letter")
def generate_cover_letter(request: CoverLetterRequest):
    # TODO: Implement AI generation
    return {"cover_letter": "Customized cover letter content..."}

@app.post("/ai/match-score")
def generate_match_score(request: MatchScoreRequest):
    # TODO: Implement AI generation
    return {"score": 85, "reasoning_summary": "Strong match based on skills."}

@app.post("/ai/parse-resume")
def parse_resume(request: ParseResumeRequest):
    # TODO: Implement actual LLM parsing logic to extract structured JSON from raw text
    return {
        "personalInfo": {"firstName": "Parsed", "lastName": "User"},
        "summary": "Experienced professional...",
        "experience": [],
        "education": [],
        "skills": ["Python", "FastAPI"],
        "projects": [],
        "certifications": []
    }

@app.post("/ai/optimize-ats")
def optimize_ats(request: OptimizeAtsRequest):
    # TODO: Implement LLM logic to optimize the provided resume dict against the job description
    return {
        "score": 90,
        "optimizedResume": request.resume
    }

@app.post("/ai/mentor/chat")
def mentor_chat(request: MentorChatRequest):
    # TODO: Call actual LLM with conversation history and context
    user_msg = request.message.lower()
    
    if "project manager" in user_msg:
        reply = "To become a Project Manager, you should focus on developing leadership skills, getting familiar with Agile/Scrum methodologies, and perhaps pursuing a certification like PMP or CSM. How can I help you tailor your resume for a PM role?"
    elif "interview" in user_msg:
        reply = "For interview prep, use the STAR method (Situation, Task, Action, Result) to structure your answers. Make sure to research the company culture beforehand. Would you like to do a mock interview now?"
    elif "cv" in user_msg or "resume" in user_msg:
        reply = "I can help improve your CV! I see you have Python skills. Make sure to highlight specific projects where you used Python to solve real-world problems or improve efficiency by a certain percentage."
    else:
        reply = "I'm your AI Career Mentor. I can help you prepare for interviews, improve your CV, or guide your career path. What would you like to focus on today?"

    return {
        "reply": reply
    }

@app.post("/ai/fraud/detect-entity")
def fraud_detect_entity(request: FraudDetectRequest):
    data_str = str(request.data).lower()
    score = 10.0
    reason = None
    is_flagged = False
    
    if "make money fast" in data_str or "work from home scam" in data_str:
        score = 85.0
        reason = "Spam terminology detected"
        is_flagged = True
    elif "test" in data_str and "company" in data_str:
        score = 75.0
        reason = "Likely a test/fake entity"
        is_flagged = True

    return {
        "score": score,
        "is_flagged": is_flagged,
        "reason": reason
    }

@app.post("/ai/job-description/generate")
def generate_job_description(request: GenerateJDRequest):
    prompt = request.prompt
    try:
        response = model.generate_content(
            f"Generate a professional job description for the following prompt: '{prompt}'. "
            "Return the output STRICTLY as a JSON object with the following keys: "
            "'title' (string), 'description' (string), 'responsibilities' (array of strings), "
            "'qualifications' (array of strings), 'requiredSkills' (array of strings). Do not include markdown formatting."
        )
        # Parse the JSON response
        result_text = response.text.replace('```json', '').replace('```', '').strip()
        data = json.loads(result_text)
        return data
    except Exception as e:
        print(f"Gemini generation error: {e}")
        return {
            "title": "Software Engineer",
            "description": "Fallback job description generation failed.",
            "responsibilities": ["Develop software"],
            "qualifications": ["Computer Science Degree"],
            "requiredSkills": ["Programming"]
        }

class CareerHealthRequest(BaseModel):
    user_id: str

@app.post("/ai/career-health")
def get_career_health(request: CareerHealthRequest):
    return {
        "score": 89,
        "stars": 5,
        "strengths": [
            "Strong Experience",
            "Excellent Resume",
            "Verified Skills"
        ],
        "needs_improvement": [
            "Leadership Certification",
            "Cloud Computing",
            "Portfolio"
        ]
    }


