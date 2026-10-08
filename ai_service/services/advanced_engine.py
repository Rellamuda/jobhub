import os
import google.generativeai as genai
import json

api_key = os.getenv("GEMINI_API_KEY")
if api_key:
    genai.configure(api_key=api_key)
    
model = genai.GenerativeModel('gemini-1.5-flash')

def score_profile(profile_data: dict) -> dict:
    """Evaluates a job seeker profile and returns a score and improvement suggestions."""
    if not api_key:
        return {"score": 85, "suggestions": ["Add more projects", "Include a portfolio link"]}
        
    prompt = f"""
    You are an expert technical recruiter. Review the following job seeker profile data and provide a score out of 100 based on completeness, quality of experience, and presentation. Also provide a list of 2-3 specific suggestions to improve it.
    
    Profile Data:
    {json.dumps(profile_data, indent=2)}
    
    Output strictly valid JSON in this format:
    {{
        "score": integer,
        "suggestions": ["suggestion 1", "suggestion 2"]
    }}
    """
    
    response = model.generate_content(prompt)
    try:
        text = response.text.strip().removeprefix('```json').removesuffix('```').strip()
        return json.loads(text)
    except:
        return {"score": 70, "suggestions": ["Consider adding more detail to your experience."]}

def skill_gap_analysis(profile_data: dict, job_description: dict) -> dict:
    """Identifies missing skills required for a job."""
    if not api_key:
        return {"missing_skills": ["Cloud Architecture"], "recommendations": ["Take an AWS certification course"]}
        
    prompt = f"""
    Compare this job seeker profile with this job description. Identify what key skills the candidate is missing or weak in.
    
    Profile: {json.dumps(profile_data, indent=2)}
    Job Description: {json.dumps(job_description, indent=2)}
    
    Output strictly valid JSON in this format:
    {{
        "missing_skills": ["skill 1", "skill 2"],
        "recommendations": ["recommendation 1"]
    }}
    """
    response = model.generate_content(prompt)
    try:
        text = response.text.strip().removeprefix('```json').removesuffix('```').strip()
        return json.loads(text)
    except:
        return {"missing_skills": [], "recommendations": ["Review the job requirements carefully."]}

def estimate_salary(job_title: str, location: str, experience_years: int) -> dict:
    """Provides a salary estimate."""
    if not api_key:
        return {"min": 50000, "max": 80000, "currency": "USD", "reasoning": "Based on standard market rates."}
        
    prompt = f"""
    Provide a realistic market salary estimate for a {job_title} in {location} with {experience_years} years of experience.
    
    Output strictly valid JSON in this format:
    {{
        "min": integer,
        "max": integer,
        "currency": "USD" (or appropriate local currency),
        "reasoning": "brief explanation"
    }}
    """
    response = model.generate_content(prompt)
    try:
        text = response.text.strip().removeprefix('```json').removesuffix('```').strip()
        return json.loads(text)
    except:
        return {"min": 0, "max": 0, "currency": "USD", "reasoning": "Data unavailable."}

def career_suggestions(profile_data: dict) -> list[str]:
    """Provides career path recommendations based on current profile."""
    if not api_key:
        return ["Senior Developer", "Engineering Manager"]
        
    prompt = f"""
    Based on this profile, suggest 2-3 logical next career roles or paths.
    Profile: {json.dumps(profile_data, indent=2)}
    
    Output strictly a JSON array of strings: ["role 1", "role 2"]
    """
    response = model.generate_content(prompt)
    try:
        text = response.text.strip().removeprefix('```json').removesuffix('```').strip()
        return json.loads(text)
    except:
        return []

def generate_interview_questions(job_data: dict, profile_data: dict = None) -> list[str]:
    """Generates tailored interview questions."""
    if not api_key:
        return ["Tell me about yourself.", "What is your biggest weakness?"]
        
    prompt = f"""
    Generate 3-5 technical and behavioral interview questions for this job.
    Job: {json.dumps(job_data, indent=2)}
    
    Output strictly a JSON array of strings.
    """
    response = model.generate_content(prompt)
    try:
        text = response.text.strip().removeprefix('```json').removesuffix('```').strip()
        return json.loads(text)
    except:
        return ["Describe a challenging project."]

def generate_job_description(basic_info: dict) -> dict:
    """Generates a full job description from basic inputs."""
    prompt_text = basic_info.get("prompt") or basic_info.get("title") or "Software Engineer"
    
    if api_key:
        prompt = f"""
        Write a professional and engaging job description based on these details:
        {json.dumps(basic_info, indent=2)}
        
        Respond with strictly valid JSON matching this schema:
        {{
            "title": "Exact standard job title derived from input",
            "description": "Comprehensive job description paragraph",
            "responsibilities": ["Responsibility 1", "Responsibility 2", "Responsibility 3"],
            "requiredSkills": ["Skill 1", "Skill 2", "Skill 3"],
            "qualifications": ["Qualification 1", "Qualification 2"]
        }}
        """
        try:
            response = model.generate_content(prompt)
            clean_text = response.text.strip().removeprefix('```json').removesuffix('```').strip()
            parsed = json.loads(clean_text)
            return parsed
        except Exception:
            pass

    # High quality fallback generation when Gemini API key is absent or offline
    title = basic_info.get("title") or "Senior Software Engineer"
    if "flutter" in prompt_text.lower():
        title = "Senior Flutter Developer"
        desc = "We are seeking a talented Flutter Developer to spearhead our cross-platform mobile initiatives across iOS and Android. You will collaborate with product and backend engineers to craft responsive, fluid applications with seamless user experiences."
        responsibilities = [
            "Architect and maintain cross-platform Flutter and Dart applications",
            "Integrate RESTful APIs and real-time backend microservices",
            "Optimize app performance, state management, and memory footprint",
            "Collaborate closely with design teams to bring UI/UX mockups to life"
        ]
        skills = ["Flutter", "Dart", "Firebase", "State Management (Provider/Bloc)", "REST APIs"]
        quals = ["3+ years professional mobile development experience", "Proven track record publishing apps to App Store & Google Play"]
    elif "ai" in prompt_text.lower() or "machine" in prompt_text.lower():
        title = "AI / Machine Learning Engineer"
        desc = "Join our cutting-edge AI team to develop autonomous agents, natural language processing pipelines, and predictive algorithms driving the future of employment matching."
        responsibilities = [
            "Design and deploy production-grade LLM agents and embeddings pipelines",
            "Fine-tune generative models and optimize inference latency",
            "Partner with data engineers to scale training and retrieval datasets"
        ]
        skills = ["Python", "FastAPI", "PyTorch / TensorFlow", "LangChain", "Vector Databases"]
        quals = ["B.S. or M.S. in Computer Science or related quantitative field", "Experience deploying models in production cloud environments"]
    else:
        title = prompt_text if len(prompt_text) < 40 else "Senior Full-Stack Engineer"
        desc = f"We are actively seeking an experienced professional to join our team for the role of {title}. In this position, you will own critical deliverables, drive technical excellence, and build solutions that delight our global users."
        responsibilities = [
            "Deliver scalable, reliable, and test-driven features end-to-end",
            "Contribute to architectural designs, code reviews, and technical documentation",
            "Troubleshoot production issues and proactively improve system resilience"
        ]
        skills = ["Problem Solving", "Modern Frameworks", "Git", "Cloud Infrastructure"]
        quals = ["Strong analytical problem-solving skills", "Demonstrated team collaboration and communication abilities"]

    return {
        "title": title,
        "description": desc,
        "responsibilities": responsibilities,
        "requiredSkills": skills,
        "qualifications": quals
    }

def detect_fraud(content: str) -> dict:
    """Evaluates text for spam/fraud indicators."""
    if not api_key:
        return {"risk_score": 10, "flags": [], "is_suspicious": False}
        
    prompt = f"""
    Analyze the following job description or user profile text for potential fraud, spam, or scams.
    Return a risk score from 0 to 100, a list of specific red flags (if any), and a boolean indicating if it is highly suspicious.
    
    Text: {content}
    
    Output strictly valid JSON in this format:
    {{
        "risk_score": integer,
        "flags": ["flag 1", "flag 2"],
        "is_suspicious": boolean
    }}
    """
    response = model.generate_content(prompt)
    try:
        text = response.text.strip().removeprefix('```json').removesuffix('```').strip()
        return json.loads(text)
    except:
        return {"risk_score": 0, "flags": [], "is_suspicious": False}
