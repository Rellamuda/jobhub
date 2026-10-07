import os
import google.generativeai as genai

api_key = os.getenv("GEMINI_API_KEY")
if api_key:
    genai.configure(api_key=api_key)

def generate_cover_letter(profile: dict, job: dict) -> str:
    """
    Takes a job seeker profile and a job description, and uses Google Gemini 
    to generate a highly customized cover letter.
    """
    if not api_key:
        return "[MOCK COVER LETTER] - Please provide a GEMINI_API_KEY in .env to enable real AI generation."

    model = genai.GenerativeModel('gemini-1.5-flash')
    
    prompt = f"""
    You are an expert career advisor. Write a compelling, tailored cover letter for the following candidate applying to the following job.
    
    Candidate Name: {profile.get('first_name')} {profile.get('last_name')}
    Candidate Bio: {profile.get('bio')}
    Candidate Skills: {', '.join(profile.get('skills', []))}
    
    Job Title: {job.get('title')}
    Company: {job.get('company_name')}
    Job Description: {job.get('description')}
    
    The cover letter should be professional, persuasive, and directly map the candidate's skills to the job description. Output in Markdown format.
    """
    
    response = model.generate_content(prompt)
    return response.text
