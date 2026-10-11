import os
import json
import google.generativeai as genai

api_key = os.getenv("GEMINI_API_KEY")
if api_key:
    try:
        genai.configure(api_key=api_key)
    except Exception as e:
        print(f"Failed to configure Gemini for company profiles: {e}")

def _synthesize_company_profile(data: dict) -> dict:
    name = (data.get('companyName') or data.get('company_name') or 'Innovative Enterprise').strip()
    industry = (data.get('industry') or 'Technology & Business Services').strip()
    biz_type = (data.get('businessType') or data.get('business_type') or 'Company').strip()
    location_city = (data.get('locationCity') or data.get('city') or 'Global Hub').strip()
    location_country = (data.get('locationCountry') or data.get('country') or 'International').strip()
    size = (data.get('companySize') or data.get('size') or '50-250 employees').strip()
    website = (data.get('website') or '').strip()
    additional = (data.get('additionalInfo') or data.get('notes') or '').strip()

    is_agency = 'agency' in biz_type.lower() or 'recruitment' in industry.lower() or 'staffing' in industry.lower() or 'agency' in name.lower()

    if is_agency:
        description = (
            f"{name} is a premier {biz_type} and talent solutions consultancy specializing in {industry}. "
            f"Headquartered in {location_city}, {location_country}, we bridge exceptional global professionals with forward-thinking employers. "
            f"Our seasoned recruiters and AI-powered vetting systems identify, evaluate, and place top-tier candidates across competitive industries, "
            f"delivering rapid turnaround, high retention rates, and tailored workforce advisory services."
        )
        mission = (
            f"To empower organizations and professionals by providing seamless, transparent, and merit-based talent matching, "
            f"transforming traditional hiring into a competitive advantage for every partner we represent."
        )
        vision = (
            f"To become the world's most trusted recruitment partner and career catalyst, known for precision matching, ethics, and industry leadership."
        )
        core_values = [
            {"title": "Candidate Advocacy", "description": "We treat every candidate's career with the highest diligence, offering honest feedback and high-growth opportunities."},
            {"title": "Precision & Speed", "description": "Leveraging deep industry expertise and modern AI technology to place qualified talent without friction."},
            {"title": "Integrity & Confidentiality", "description": "Ensuring strict ethical standards, mutual trust, and data privacy in all client and candidate relationships."},
            {"title": "Partnership Mindset", "description": "We act as an extension of our clients' teams, immersing ourselves in their organizational culture and strategic objectives."}
        ]
        culture = (
            f"At {name}, our culture is defined by proactive collaboration, high-velocity problem solving, and a passion for human potential. "
            f"We foster an energetic, data-informed environment where curiosity, accountability, and empathy are celebrated daily."
        )
        why_work_with_us = (
            f"Whether partnering with client enterprises or growing our internal team, {name} provides unmatched access to market insights, "
            f"merit-driven advancement, transparent communication, and continuous professional development."
        )
        benefits = [
            "Competitive Base Salary & Uncapped Commission Structures",
            "Comprehensive Health, Dental, and Vision Coverage",
            "Flexible Hybrid & Remote Work Options",
            "Continuous Learning Stipend & Recruitment Certification Support",
            "Generous Paid Time Off and Company Holidays",
            "Modern AI Tools and High-Yield Candidate Sourcing Software"
        ]
    else:
        description = (
            f"{name} is an innovative organization operating at the forefront of {industry}. "
            f"Based in {location_city}, {location_country}, we build transformative solutions and deliver exceptional experiences for customers worldwide. "
            f"With a dedicated workforce of {size}, our cross-functional teams solve complex operational challenges, create sustainable business value, and push industry standards forward."
        )
        mission = (
            f"To deliver outstanding value, innovative products, and exceptional service in {industry}, solving critical customer needs through collaborative excellence."
        )
        vision = (
            f"To be recognized globally as an industry benchmark in {industry}, celebrated for groundbreaking innovation, sustainable practices, and talent cultivation."
        )
        core_values = [
            {"title": "Customer Obsession", "description": "Putting customer success at the center of every architectural, product, and business decision."},
            {"title": "Continuous Innovation", "description": "Embracing curiosity, calculated experimentation, and state-of-the-art tools to lead our market."},
            {"title": "Radical Accountability", "description": "Taking ownership of outcomes, acting with transparent integrity, and delivering on promises."},
            {"title": "Inclusive Collaboration", "description": "Building diverse, empathetic teams where every voice contributes to collective breakthroughs."}
        ]
        culture = (
            f"We believe that remarkable achievements happen when skilled individuals feel empowered to innovate without fear of failure. "
            f"Our workplace combines intellectual rigor with mutual respect, open feedback channels, and flexible work life harmony."
        )
        why_work_with_us = (
            f"Joining {name} means contributing directly to mission-critical products that impact thousands of lives. "
            f"You will work alongside inspiring peers, receive meaningful autonomy, and enjoy clear career progression pathways in a thriving ecosystem."
        )
        benefits = [
            "Top-Tier Competitive Salary & Performance Bonuses",
            "Premium Health, Wellness, and Mental Health Subsidies",
            "Remote & Flexible Schedule Accommodations",
            "Annual Learning & Professional Growth Budget ($1,500+)",
            "Generous Annual Paid Leave & Parental Leave Programs",
            "State-of-the-art Hardware & Home Office Setup Assistance"
        ]

    if additional:
        description += f"\n\nStrategic Focus & Highlights: {additional}"

    return {
        "companyName": name,
        "industry": industry,
        "businessType": "Agency / Recruitment Agency" if is_agency else biz_type,
        "locationCity": location_city,
        "locationCountry": location_country,
        "companySize": size,
        "website": website,
        "description": description,
        "mission": mission,
        "vision": vision,
        "coreValues": core_values,
        "culture": culture,
        "whyWorkWithUs": why_work_with_us,
        "benefits": benefits
    }

def generate_company_profile(data: dict) -> dict:
    if api_key:
        try:
            model = genai.GenerativeModel('gemini-1.5-flash')
            prompt = f"""
            You are an elite corporate brand strategist and employer branding specialist.
            Build an executive AI Profile for the following Company or Agency:
            
            Input Details:
            - Company Name: {data.get('companyName') or data.get('company_name', 'Enterprise')}
            - Business Type: {data.get('businessType', 'Company')} (Company or Recruitment/Staffing Agency)
            - Industry: {data.get('industry', 'Technology & Services')}
            - Location: {data.get('locationCity', 'City')}, {data.get('locationCountry', 'Country')}
            - Company Size: {data.get('companySize', '50-200')}
            - Website: {data.get('website', '')}
            - Additional Notes / Core Strengths: {data.get('additionalInfo', '')}

            Return a strict JSON object with these keys:
            {{
              "companyName": string,
              "industry": string,
              "businessType": string,
              "description": "Comprehensive 2-paragraph executive company/agency summary",
              "mission": "Compelling mission statement",
              "vision": "Inspiring vision statement",
              "coreValues": [
                {{"title": "Value Name", "description": "Concise definition"}}
              ],
              "culture": "Workplace culture and team dynamics overview",
              "whyWorkWithUs": "Persuasive employer value proposition for attracting top applicants",
              "benefits": ["Benefit 1", "Benefit 2", "Benefit 3", "Benefit 4", "Benefit 5", "Benefit 6"]
            }}
            Return ONLY the valid JSON block without markdown code fences.
            """
            response = model.generate_content(prompt)
            text = response.text.strip()
            if text.startswith("```json"):
                text = text[7:]
            if text.startswith("```"):
                text = text[3:]
            if text.endswith("```"):
                text = text[:-3]
            parsed = json.loads(text.strip())
            return parsed
        except Exception as e:
            print(f"Gemini company profile generation failed: {e}. Using deterministic synthesis.")

    return _synthesize_company_profile(data)
