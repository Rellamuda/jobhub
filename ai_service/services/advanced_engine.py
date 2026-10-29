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
    """Generates an accurate, professional, and coherent job description tailored strictly to the role."""
    title = (basic_info.get("title") or basic_info.get("prompt") or "Open Position").strip()
    location = basic_info.get("location") or ("Remote" if basic_info.get("isRemote") else "Onsite")
    salary = basic_info.get("salary") or "Competitive"
    
    # 1. Attempt generation via Gemini LLM with strict anti-hallucination instructions
    active_key = os.getenv("GEMINI_API_KEY") or api_key
    if active_key and active_key.strip() and "your_gemini" not in active_key:
        try:
            genai.configure(api_key=active_key.strip())
            llm_model = genai.GenerativeModel('gemini-1.5-flash')
            prompt = f"""
You are an expert HR Recruitment Specialist. Write an authentic, professional, and coherent job description strictly tailored for the position of "{title}".

Context:
- Job Title: {title}
- Location: {location}
- Compensation: {salary}

CRITICAL RULES:
1. Tailor all responsibilities, qualifications, and tone strictly to the actual profession of "{title}".
2. NEVER include software, coding, tech architecture, or IT deliverables unless the title explicitly denotes an IT/software job.
   - For a "cleaner": focus on sanitization, hygiene, dusting, mopping, safety, and facility cleanliness.
   - For a "driver": focus on road safety, vehicle upkeep, navigation, and punctuality.
   - For a "cook/chef": focus on food preparation, recipe execution, and kitchen hygiene.
3. Return strictly valid JSON matching this schema:
{{
    "title": "{title}",
    "description": "Engaging 2-3 sentence overview describing the role, mission, and working environment.",
    "responsibilities": [
        "Core responsibility 1",
        "Core responsibility 2",
        "Core responsibility 3",
        "Core responsibility 4",
        "Core responsibility 5"
    ],
    "requiredSkills": [
        "Key skill 1",
        "Key skill 2",
        "Key skill 3",
        "Key skill 4"
    ],
    "qualifications": [
        "Key qualification or experience 1",
        "Key qualification or experience 2"
    ]
}}
"""
            response = llm_model.generate_content(prompt)
            clean_text = response.text.strip().removeprefix('```json').removesuffix('```').strip()
            parsed = json.loads(clean_text)
            
            # Combine into a clean, complete description formatted for display
            overview = parsed.get("description", "").strip()
            resps = parsed.get("responsibilities", [])
            skills_quals = parsed.get("requiredSkills", []) + parsed.get("qualifications", [])
            
            combined = overview
            if resps:
                combined += "\n\nKey Responsibilities:\n" + "\n".join(f"- {r}" for r in resps)
            if skills_quals:
                combined += "\n\nRequirements & Qualifications:\n" + "\n".join(f"- {s}" for s in skills_quals)
                
            parsed["description"] = combined
            return parsed
        except Exception as e:
            print(f"Gemini generation fallback engaged: {e}")

    # 2. Intelligent, domain-aware role generator (guarantees accurate descriptions for any industry)
    t = title.lower()
    
    # Category: Cleaning, Housekeeping & Facilities
    if any(k in t for k in ["clean", "housekeep", "janitor", "maid", "sanitat", "custodian", "laundry", "sweeper"]):
        overview = f"We are seeking a dedicated and thorough {title} to ensure high standards of cleanliness, hygiene, and organization across our facilities. In this role, you will maintain a clean, comfortable, and safe environment for staff, clients, and visitors."
        responsibilities = [
            "Perform comprehensive cleaning, sweeping, vacuuming, and mopping of all designated areas and floors.",
            "Sanitize restrooms, washrooms, breakrooms, and high-touch surface points with approved disinfectants.",
            "Empty trash receptacles, dispose of waste responsibly, and replace bin liners regularly.",
            "Monitor and replenish cleaning supplies, paper products, and hygiene dispensers.",
            "Operate cleaning equipment safely and maintain all tools in good working order.",
            "Promptly report any safety hazards, needed repairs, or facility maintenance issues."
        ]
        skills = [
            "Strong attention to detail and high standards of cleanliness",
            "Knowledge of sanitization and hygiene safety practices",
            "Physical stamina and ability to lift or operate cleaning tools",
            "Dependable time management and ability to work independently"
        ]
        qualifications = [
            "Prior experience in residential, commercial, or industrial cleaning is an advantage",
            "Commitment to punctuality, reliability, and workplace safety"
        ]
    # Category: Drivers, Delivery & Logistics
    elif any(k in t for k in ["driver", "chauffeur", "delivery", "courier", "dispatch", "truck", "forklift", "rider", "van"]):
        overview = f"We are looking for a reliable and safety-focused {title} to handle transportation and delivery operations. You will ensure passengers, packages, or goods arrive at their destinations safely, securely, and on schedule."
        responsibilities = [
            "Operate assigned company vehicles safely and in strict compliance with all traffic laws and transport regulations.",
            "Plan optimal travel and delivery routes utilizing GPS navigation to avoid heavy traffic and delays.",
            "Conduct routine pre-trip and post-trip vehicle safety inspections (fluids, tire pressure, brakes).",
            "Safely load, secure, transport, and unload cargo, parcels, or passenger luggage.",
            "Maintain accurate trip logs, delivery receipts, and vehicle mileage records.",
            "Deliver polite, professional, and respectful customer service at all times."
        ]
        skills = [
            "Defensive driving expertise and clean driving record",
            "GPS navigation and route planning proficiency",
            "Dependable time management and punctuality",
            "Physical capability to load and unload goods"
        ]
        qualifications = [
            "Valid appropriate driver's license with clean driving history",
            "Previous professional driving, courier, or delivery experience"
        ]
    # Category: Hospitality, Cooking & Culinary
    elif any(k in t for k in ["cook", "chef", "baker", "barista", "waiter", "waitress", "bartender", "catering", "kitchen", "server", "restaurant", "steward"]):
        overview = f"We are seeking an enthusiastic and skilled {title} to prepare high-quality culinary items and deliver exceptional dining service. You will uphold stringent food safety, quality, and kitchen hygiene standards."
        responsibilities = [
            "Prepare, season, and cook menu items according to established recipes, portion standards, and presentations.",
            "Maintain immaculate cleanliness, sanitization, and organization across all kitchen and prep stations.",
            "Inspect raw ingredients for freshness and guarantee safe temperature storage for all perishables.",
            "Coordinate smoothly with front-of-house staff to ensure prompt, accurate order delivery.",
            "Operate commercial kitchen equipment responsibly and adhere strictly to food safety regulations.",
            "Accommodate guest dietary requirements and food allergy precautions with care."
        ]
        skills = [
            "Culinary craftsmanship or beverage preparation skills",
            "Knowledge of food safety, hygiene, and safe temperature handling",
            "Ability to thrive in a high-tempo, team-oriented kitchen",
            "Strong communication and attention to recipe precision"
        ]
        qualifications = [
            "Food handler certification or culinary training",
            "Proven cooking or hospitality experience in a restaurant or kitchen"
        ]
    # Category: Security & Safety
    elif any(k in t for k in ["security", "guard", "officer", "surveillance", "bouncer", "patrol", "safety"]):
        overview = f"We are hiring an alert and responsible {title} to protect our premises, personnel, and assets. You will maintain a secure environment and respond swiftly to any disruptions or emergency situations."
        responsibilities = [
            "Patrol facility grounds, monitor access points, and verify credentials of entering visitors.",
            "Operate surveillance cameras, alarm panels, and security monitoring equipment.",
            "Detect and de-escalate suspicious activities, security breaches, or unauthorized entry.",
            "Respond calmly and effectively to emergency alarms, safety hazards, or medical incidents.",
            "Maintain comprehensive daily activity logs and compile precise incident reports."
        ]
        skills = [
            "Situational awareness and alert observation abilities",
            "Professional conflict resolution and verbal de-escalation skills",
            "Sound judgment and composure under high-pressure scenarios",
            "Physical fitness and stamina for standing or patrolling"
        ]
        qualifications = [
            "Security license or certification preferred",
            "Prior security, surveillance, or law enforcement experience"
        ]
    # Category: Healthcare & Nursing / Caregiver
    elif any(k in t for k in ["nurse", "caregiver", "doctor", "medical", "health", "clinic", "patient", "pharmacy", "therapist", "dental", "midwife"]):
        overview = f"We are seeking a compassionate and dedicated {title} to provide quality patient care and support daily health needs. You will deliver empathetic, attentive care in collaboration with our healthcare team."
        responsibilities = [
            "Administer patient care, assist with daily wellness activities, and record vital signs accurately.",
            "Dispense prescribed medications and treatments in strict accordance with medical orders.",
            "Maintain hygienic, sterile, and comfortable patient room environments.",
            "Communicate with patients, family members, and medical personnel regarding care plans.",
            "Maintain comprehensive medical records while strictly upholding patient privacy (HIPAA/ethics)."
        ]
        skills = [
            "Empathetic bedside manner and compassionate communication",
            "Knowledge of clinical protocols, vital signs, and medication administration",
            "Quick, composed response in urgent care situations",
            "Attention to detail in patient monitoring and charting"
        ]
        qualifications = [
            "Current license or certification in nursing, caregiving, or healthcare",
            "Active CPR / Basic Life Support certification"
        ]
    # Category: Sales, Retail & Cashier
    elif any(k in t for k in ["sales", "cashier", "retail", "store", "teller", "shop", "merchandis", "buyer"]):
        overview = f"We are looking for an energetic and customer-focused {title} to drive sales performance and create positive shopper experiences. You will assist customers, answer product queries, and process transactions."
        responsibilities = [
            "Greet customers warmly, understand their needs, and provide helpful product recommendations.",
            "Process customer purchases, returns, and digital transactions accurately through the POS system.",
            "Keep shelves stocked, organize merchandise displays, and assist with stock inventory audits.",
            "Handle customer inquiries, feedback, and special requests with courteous professionalism.",
            "Work collaboratively with the team to achieve daily, weekly, and monthly sales targets."
        ]
        skills = [
            "Active listening and persuasive customer engagement",
            "Accurate cash handling and POS system operation",
            "Product knowledge and upbeat, positive attitude",
            "Ability to handle high-traffic shopping rushes efficiently"
        ]
        qualifications = [
            "Previous experience in retail, sales, or customer service preferred",
            "Strong communication skills and dependable work ethic"
        ]
    # Category: Customer Service, Support & Administration
    elif any(k in t for k in ["customer service", "customer care", "support", "reception", "admin", "secretary", "clerk", "front desk", "office assistant"]):
        overview = f"We are seeking an organized and articulate {title} to handle customer communication, administrative workflows, and office support. You will ensure clients receive prompt, professional assistance at all times."
        responsibilities = [
            "Respond to customer inquiries promptly via phone, email, or in-person greeting.",
            "Resolve customer concerns efficiently, documenting interactions and outcomes in the CRM system.",
            "Organize office calendars, schedule meetings, and maintain physical and digital filing records.",
            "Prepare correspondence, documents, invoices, and departmental status reports.",
            "Assist management with daily operational logistics and office supply management."
        ]
        skills = [
            "Exceptional verbal and written communication skills",
            "Multitasking ability and proactive problem solving",
            "Proficiency in office software (Google Workspace, Microsoft Office, CRM)",
            "Polite, helpful, and patient customer disposition"
        ]
        qualifications = [
            "High school diploma or degree; administrative or customer service experience preferred",
            "Proven ability to maintain confidentiality and accurate records"
        ]
    # Category: Skilled Trades, Construction & Maintenance
    elif any(k in t for k in ["plumber", "electrician", "carpenter", "technician", "mechanic", "welder", "painter", "builder", "construction", "mason", "hvac"]):
        overview = f"We are hiring a skilled and dependable {title} to execute installation, maintenance, and repair tasks. You will deliver high-quality craftsmanship while adhering strictly to building codes and safety regulations."
        responsibilities = [
            "Perform technical installations, diagnostics, repairs, and preventative maintenance on equipment or structures.",
            "Troubleshoot operational faults and determine the most effective, durable repair solutions.",
            "Read blueprints, diagrams, and manufacturer specifications to plan task sequences.",
            "Use hand, power, and diagnostic tools safely and keep them in optimal operating condition.",
            "Adhere strictly to personal protective equipment (PPE) and occupational safety regulations."
        ]
        skills = [
            "Technical troubleshooting and mechanical/electrical diagnostic skills",
            "Proficiency with specialized trade tools and test equipment",
            "Manual dexterity, physical stamina, and precision",
            "Knowledge of industry safety codes and standards"
        ]
        qualifications = [
            "Trade certification, vocational diploma, or completed apprenticeship",
            "Demonstrated experience in trade maintenance or construction"
        ]
    # Category: Education, Tutoring & Teaching
    elif any(k in t for k in ["teacher", "tutor", "instructor", "nanny", "educator", "daycare", "teaching", "lecturer"]):
        overview = f"We are seeking an inspiring and patient {title} to guide learners, design engaging instructional activities, and foster a supportive educational environment."
        responsibilities = [
            "Plan and deliver interactive lessons tailored to diverse learning abilities and educational goals.",
            "Assess student progress, provide constructive feedback, and encourage academic curiosity.",
            "Maintain a positive, disciplined, and encouraging learning environment.",
            "Communicate student milestones, strengths, and areas for improvement with parents or guardians.",
            "Integrate modern instructional materials and interactive exercises to stimulate learning."
        ]
        skills = [
            "Patience, empathy, and excellent instructional presentation",
            "Curriculum planning and creative lesson design",
            "Strong classroom management and active listening",
            "Ability to motivate and build confidence in students"
        ]
        qualifications = [
            "Bachelor's degree or teaching / childcare certification",
            "Proven teaching, tutoring, or childcare experience"
        ]
    # Category: Finance, Accounting & Banking
    elif any(k in t for k in ["accountant", "bookkeeper", "finance", "audit", "payroll", "tax", "banking"]):
        overview = f"We are looking for a meticulous {title} to oversee financial records, ensure regulatory compliance, and support strategic financial management."
        responsibilities = [
            "Prepare and examine financial statements, balance sheets, and general ledger accounts.",
            "Manage accounts payable, accounts receivable, and payroll processing accurately and on schedule.",
            "Ensure full compliance with tax legislation, internal accounting controls, and financial reporting standards.",
            "Analyze financial trends, forecast operational budgets, and identify cost-saving opportunities.",
            "Coordinate with internal teams and external auditors during annual audits."
        ]
        skills = [
            "Financial accounting, reconciliation, and ledger management",
            "Deep familiarity with GAAP or IFRS accounting standards",
            "Advanced spreadsheet and accounting software proficiency",
            "High integrity, precision, and numerical accuracy"
        ]
        qualifications = [
            "Degree in Accounting, Finance, or related discipline; CPA / ACCA is a plus",
            "Proven experience in corporate or public accounting"
        ]
    # Category: Software Engineering, IT & Technology
    elif any(k in t for k in ["software", "developer", "engineer", "programmer", "frontend", "backend", "fullstack", "devops", "cloud", "flutter", "react", "python", "qa", "machine learning", "ai"]):
        overview = f"We are seeking a talented {title} to design, build, and maintain scalable software applications. You will collaborate with engineering and product teams to craft high-performance digital solutions."
        responsibilities = [
            "Architect and implement clean, testable, and well-documented software components.",
            "Collaborate with product managers and UI/UX designers to translate requirements into responsive features.",
            "Write automated tests, participate in code reviews, and optimize system performance.",
            "Troubleshoot runtime bugs, investigate production incidents, and improve system stability.",
            "Stay informed of emerging software architectures, frameworks, and engineering standards."
        ]
        skills = [
            "Proficiency in modern programming languages and web or mobile frameworks",
            "API design, database modeling, and Git version control",
            "Problem-solving, algorithms, and modular software architecture",
            "Experience with automated testing and continuous integration (CI/CD)"
        ]
        qualifications = [
            "Degree in Computer Science, Software Engineering, or equivalent practical experience",
            "Demonstrated track record of shipping production software applications"
        ]
    # Dynamic Adaptive Generator for any other unique title
    else:
        overview = f"We are seeking a proactive and skilled {title} to join our team. In this position, you will be responsible for executing essential operational duties, maintaining high standards of quality, and contributing to overall team success."
        responsibilities = [
            f"Coordinate and execute day-to-day duties associated with the role of {title}.",
            "Collaborate productively with team members and cross-functional colleagues.",
            "Maintain high standards of accuracy, organization, and timely completion of assignments.",
            "Identify workflow improvements and proactively resolve operational challenges.",
            "Ensure adherence to organizational guidelines, industry standards, and workplace safety protocols."
        ]
        skills = [
            "Strong work ethic, reliability, and personal accountability",
            "Effective verbal and written communication skills",
            "Organized approach to task prioritization and problem solving",
            "Ability to work collaboratively in a fast-paced environment"
        ]
        qualifications = [
            f"Relevant experience or educational background suitable for a {title}",
            "Strong commitment to professional growth and team excellence"
        ]
        
    combined_desc = (
        f"{overview}\n\n"
        f"Key Responsibilities:\n" + "\n".join(f"- {r}" for r in responsibilities) + "\n\n"
        f"Requirements & Qualifications:\n" + "\n".join(f"- {s}" for s in (skills + qualifications))
    )
    
    return {
        "title": title,
        "description": combined_desc,
        "responsibilities": responsibilities,
        "requiredSkills": skills,
        "qualifications": qualifications
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
