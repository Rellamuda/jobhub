import os
import json
import google.generativeai as genai

api_key = os.getenv("GEMINI_API_KEY")
if api_key:
    try:
        genai.configure(api_key=api_key)
    except Exception as e:
        print(f"Failed to configure Gemini: {e}")

def generate_cover_letter(profile: dict, job: dict) -> str:
    """
    Takes a job seeker profile and a job description, and generates a compelling,
    persuasive cover letter.
    """
    first_name = profile.get('first_name') or profile.get('firstName') or 'Valued'
    last_name = profile.get('last_name') or profile.get('lastName') or 'Candidate'
    name = f"{first_name} {last_name}".strip()
    
    job_title = job.get('title') or 'Target Position'
    company = job.get('company_name') or job.get('company') or job.get('employer', {}).get('companyName') or 'Hiring Team'
    raw_skills = profile.get('skills') or []
    if isinstance(raw_skills, list):
        skills_str = ', '.join([str(s) for s in raw_skills[:4]])
    else:
        skills_str = str(raw_skills)

    if api_key:
        try:
            model = genai.GenerativeModel('gemini-1.5-flash')
            prompt = f"""
            You are an elite career advisor. Write an engaging, highly persuasive cover letter for this candidate:
            Name: {name}
            Bio / Summary: {profile.get('bio') or profile.get('summary')}
            Skills: {skills_str}
            
            Applying for:
            Job Title: {job_title}
            Company: {company}
            Description: {job.get('description')}
            
            Format nicely with clear paragraphs, expressing genuine enthusiasm, aligning the candidate's core strengths to the company's goals, and ending with a professional call-to-action.
            """
            response = model.generate_content(prompt)
            if response and response.text:
                return response.text
        except Exception as e:
            print(f"Gemini cover letter generation error: {e}")

    # Fallback to intelligent, tailored cover letter
    return f"""Dear Hiring Team at {company},

I am writing to express my strong interest in the {job_title} position currently open at {company}. With a proven track record of driving impactful results and strong proficiency in {skills_str or 'modern industry practices'}, I am excited about the opportunity to contribute directly to your team's ongoing success.

Throughout my career, I have focused on solving complex challenges, optimizing core workflows, and collaborating cross-functionally to deliver measurable business value. What excites me most about {company} is your commitment to excellence and innovation, and I am eager to apply my background in technical execution and strategic problem-solving to help achieve your organizational goals.

My technical and leadership skills, combined with a continuous commitment to quality, enable me to ramp up quickly and make an immediate impact. I welcome the opportunity to discuss how my experience and skill set align with the needs of the {job_title} role.

Thank you for your time and consideration. I look forward to the possibility of speaking with you soon.

Sincerely,

{name}
Applicant via JobHub AI Ecosystem
"""
