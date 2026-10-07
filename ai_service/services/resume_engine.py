import os
import json
import google.generativeai as genai

# We initialize the Gemini client here. Ensure GEMINI_API_KEY is in your .env
api_key = os.getenv("GEMINI_API_KEY")
if api_key:
    genai.configure(api_key=api_key)

def generate_resume(profile: dict) -> str:
    """
    Takes a job seeker profile dictionary and uses Google Gemini to generate a professional resume.
    """
    if not api_key:
        return "[MOCK RESUME] - Please provide a GEMINI_API_KEY in .env to enable real AI generation."

    model = genai.GenerativeModel('gemini-1.5-flash')
    
    prompt = f"""
    You are an expert career coach and resume writer. 
    Create a highly professional, formatted resume for the following individual.
    
    Name: {profile.get('first_name')} {profile.get('last_name')}
    Bio: {profile.get('bio')}
    Skills: {', '.join(profile.get('skills', []))}
    
    Output the resume in clean Markdown format. Include sections for Summary, Skills, and mock Professional Experience (leave placeholders for dates/companies if they are missing).
    """
    
    response = model.generate_content(prompt)
    return response.text

def parse_resume_text(text: str) -> dict:
    if not api_key:
        return {
            "personalInfo": {"firstName": "Parsed", "lastName": "User", "email": "parsed@example.com", "phone": "123-456-7890", "city": "Parsed City"},
            "summary": "Parsed professional summary...",
            "experience": [],
            "education": [],
            "skills": ["Python", "FastAPI"],
            "projects": [],
            "certifications": []
        }

    model = genai.GenerativeModel('gemini-1.5-flash')
    prompt = f"""
    You are an expert resume parsing AI. Extract structured resume information from the following raw resume text:
    
    ---
    {text}
    ---
    
    Return the output STRICTLY as a JSON object (no markdown, no ```json formatting, just raw JSON) with the following structure:
    {{
      "personalInfo": {{
        "firstName": "First name",
        "lastName": "Last name",
        "email": "Email address",
        "phone": "Phone number",
        "city": "City/Location"
      }},
      "summary": "Brief professional summary",
      "experience": [
        {{
          "title": "Job Title",
          "company": "Company Name",
          "startDate": "Start date",
          "endDate": "End date or Present",
          "description": "Job description or bullet points"
        }}
      ],
      "education": [
        {{
          "school": "School or University name",
          "degree": "Degree earned",
          "graduationDate": "Graduation date"
        }}
      ],
      "skills": ["Skill 1", "Skill 2"],
      "projects": [
        {{
          "name": "Project Name",
          "description": "Project description",
          "url": "Project URL (if any)"
        }}
      ],
      "certifications": ["Certification 1", "Certification 2"]
    }}
    """
    
    try:
        response = model.generate_content(prompt)
        text_resp = response.text.replace('```json', '').replace('```', '').strip()
        data = json.loads(text_resp)
        return data
    except Exception as e:
        print(f"Error parsing resume: {e}")
        return {
            "personalInfo": {"firstName": "", "lastName": "", "email": "", "phone": "", "city": ""},
            "summary": "",
            "experience": [],
            "education": [],
            "skills": [],
            "projects": [],
            "certifications": []
        }

def optimize_ats_resume(resume: dict, job_description: str) -> dict:
    if not api_key:
        return {
            "score": 80,
            "optimizedResume": resume
        }

    model = genai.GenerativeModel('gemini-1.5-flash')
    prompt = f"""
    You are an expert ATS optimization AI. 
    Analyze the candidate's resume and optimize it to better match the following job description.
    Make sure to highlight relevant keywords, align the summary and experience descriptions, and suggest improvements.
    
    Resume JSON:
    {json.dumps(resume)}
    
    Job Description:
    {job_description}
    
    Return the output STRICTLY as a JSON object (no markdown, no ```json formatting) with the following structure:
    {{
      "score": 85,
      "optimizedResume": {{
        // The updated/optimized version of the input resume JSON structure (personalInfo, summary, experience, education, skills, projects, certifications)
      }}
    }}
    """
    
    try:
        response = model.generate_content(prompt)
        text_resp = response.text.replace('```json', '').replace('```', '').strip()
        data = json.loads(text_resp)
        return data
    except Exception as e:
        print(f"Error optimizing ATS: {e}")
        return {
            "score": 75,
            "optimizedResume": resume
        }
