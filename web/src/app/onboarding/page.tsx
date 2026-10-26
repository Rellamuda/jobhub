'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { countriesList, countryStates, phoneCodes } from '../../lib/countriesData';
import { SearchableCountrySelect, SearchablePhoneCodeSelect } from '../../components/SearchableCountrySelect';
import { Briefcase, Wrench, Globe, Building2, Users } from 'lucide-react';

export const skilledTradesList = [
  "Electrician / Electrical Technician",
  "Plumber / Pipefitter",
  "Carpenter & Joiner",
  "Welder & Metal Fabricator",
  "HVAC & Refrigeration Technician",
  "Mason & Bricklayer",
  "Automotive Mechanic / Diagnostic Tech",
  "Chef, Cook & Commercial Baker",
  "Professional Driver & Logistics Operator",
  "Painter & Decorator",
  "Tailor & Fashion Designer",
  "Heavy Equipment & Crane Operator",
  "Solar, Wind & Renewable Energy Tech",
  "Roofer & Cladding Specialist",
  "Tiler & Flooring Installer",
  "Blacksmith & Ironworker",
  "Other Skilled Trade / Artisan"
];

export const agencyFocusOptions = [
  "Executive Search & C-Suite",
  "IT, Software & Artificial Intelligence",
  "Healthcare, Nursing & Medical",
  "Engineering & Construction",
  "Finance, Accounting & Banking",
  "Skilled Trades & Blue Collar Logistics",
  "General Staffing & Temporary Placement",
  "Hospitality, Retail & Tourism",
  "Legal, HR & Corporate Compliance",
  "Others"
];

export const clientIndustriesOptions = [
  "Technology, AI & Software Startups",
  "Banking, FinTech & Financial Services",
  "Healthcare, Pharmaceuticals & Biotech",
  "Civil Engineering, Construction & Real Estate",
  "Oil, Gas, Mining & Energy Infrastructure",
  "Automotive, Manufacturing & Supply Chain",
  "Retail, FMCG & E-Commerce",
  "Government, Public Sector & NGOs",
  "Others"
];

export const generalIndustryOptions = [
  "Technology, Software & AI",
  "Financial Services, Banking & Fintech",
  "Healthcare, Medicine & Pharmaceuticals",
  "E-Commerce, Retail & FMCG",
  "Construction, Civil Engineering & Real Estate",
  "Manufacturing, Production & Industrial",
  "Education, EdTech & Academic Research",
  "Transportation, Logistics & Supply Chain",
  "Oil, Gas, Mining & Renewable Energy",
  "Telecommunications & Networking",
  "Hospitality, Catering, Travel & Tourism",
  "Media, Entertainment, Advertising & Design",
  "Legal, HR & Corporate Professional Services",
  "Agriculture, Farming & Agribusiness",
  "Automotive & Aviation",
  "Government, Public Administration & Defense",
  "Non-Profit, NGO & International Development",
  "Others"
];

export const primaryIndustryOptions = [
  "Staffing & Employment Agencies",
  "Human Resources Consulting",
  "Executive Search & Placement Firm",
  "Information Technology & Managed Services",
  "Business Process Outsourcing (BPO)",
  "Others"
];

export const teamSizeOptions = [
  "1-10 employees",
  "11-50 employees",
  "51-200 employees",
  "201-500 employees",
  "500+ employees"
];

const foundedYearsList = Array.from({ length: 70 }, (_, i) => (new Date().getFullYear() - i).toString());

const currencyOptions = [
  { label: "$ USD - US Dollar", code: "$" },
  { label: "₦ NGN - Nigerian Naira", code: "₦" },
  { label: "£ GBP - British Pound", code: "£" },
  { label: "€ EUR - Euro", code: "€" },
  { label: "C$ CAD - Canadian Dollar", code: "C$" },
  { label: "R ZAR - South African Rand", code: "R" },
  { label: "KSh KES - Kenyan Shilling", code: "KSh" },
  { label: "GH₵ GHS - Ghanaian Cedi", code: "GH₵" },
  { label: "A$ AUD - Australian Dollar", code: "A$" },
  { label: "AED - UAE Dirham", code: "AED" },
  { label: "₹ INR - Indian Rupee", code: "₹" },
  { label: "CHF - Swiss Franc", code: "CHF" },
];

const getCurrencySymbol = (country: string) => {
  const currencyMapping: { [key: string]: string } = {
    "United States": "$",
    "Canada": "C$",
    "United Kingdom": "£",
    "Nigeria": "₦",
    "India": "₹",
    "Ghana": "GH₵",
    "Kenya": "KSh",
    "South Africa": "R",
    "Australia": "A$",
    "Germany": "€",
    "France": "€",
    "Italy": "€",
    "Spain": "€",
    "Netherlands": "€",
    "Belgium": "€",
    "Switzerland": "CHF",
    "China": "¥",
    "Japan": "¥",
    "Brazil": "R$",
    "Egypt": "EGP",
    "Saudi Arabia": "SR",
    "United Arab Emirates": "AED"
  };
  return currencyMapping[country] || "$";
};

export default function OnboardingPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Steps
  const [step, setStep] = useState(1);
  
  // Job Seeker Form State
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [otherNames, setOtherNames] = useState('');
  const [gender, setGender] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [phone, setPhone] = useState('');
  const [phoneCode, setPhoneCode] = useState('+1');
  const [hrPhoneCode, setHrPhoneCode] = useState('+1');
  const [nationality, setNationality] = useState('');
  const [maritalStatus, setMaritalStatus] = useState('');
  
  // High-level Job Seeker Category (Corporate Professional vs Skilled Trade/Artisan)
  const [seekerCategory, setSeekerCategory] = useState<'PROFESSIONAL' | 'SKILLED_TRADE'>('PROFESSIONAL');
  const [tradeSpecialization, setTradeSpecialization] = useState(skilledTradesList[0]);
  const [customTrade, setCustomTrade] = useState('');

  const [headline, setHeadline] = useState('');
  const [profession, setProfession] = useState('');
  const [isSkilledProfessional, setIsSkilledProfessional] = useState(false);
  const [skilledProfession, setSkilledProfession] = useState('');
  const [summary, setSummary] = useState('');
  
  const [residenceCountry, setResidenceCountry] = useState('');
  const [residenceState, setResidenceState] = useState('');
  const [residenceCity, setResidenceCity] = useState('');
  const [citizenshipCountry, setCitizenshipCountry] = useState('');
  const [willingToRelocate, setWillingToRelocate] = useState(false);
  const [isOpenToRemote, setIsOpenToRemote] = useState(true);
  
  const [desiredJobTitle, setDesiredJobTitle] = useState('');
  const [preferredIndustryOption, setPreferredIndustryOption] = useState(generalIndustryOptions[0]);
  const [preferredIndustryCustom, setPreferredIndustryCustom] = useState('');
  const [employmentType, setEmploymentType] = useState('Full-time');
  const [workArrangement, setWorkArrangement] = useState('Hybrid');
  const [expectedSalary, setExpectedSalary] = useState('');
  const [salaryAmount, setSalaryAmount] = useState('');
  const [salaryFrequency, setSalaryFrequency] = useState('Monthly'); // Hourly, Daily, Monthly, Annually
  const [salaryCurrency, setSalaryCurrency] = useState('$');
  const [availability, setAvailability] = useState('Immediately');
  const [preferredWorkCountry, setPreferredWorkCountry] = useState('');
  
  const [education, setEducation] = useState<any[]>([]);
  const [experience, setExperience] = useState<any[]>([]);
  const [certificates, setCertificates] = useState<any[]>([]);
  const [achievements, setAchievements] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [references, setReferences] = useState<any[]>([]);
  
  const [socialLinks, setSocialLinks] = useState({ linkedin: '', github: '', website: '' });
  
  // Employer Form State
  const [companyName, setCompanyName] = useState('');
  const [description, setDescription] = useState('');
  const [employerIndustryOption, setEmployerIndustryOption] = useState(generalIndustryOptions[0]);
  const [employerIndustryCustom, setEmployerIndustryCustom] = useState('');
  const [companySize, setCompanySize] = useState(teamSizeOptions[0]);
  const [foundedYear, setFoundedYear] = useState('2020');
  const [businessType, setBusinessType] = useState('DIRECT_EMPLOYER');
  
  // Agency specifics with "Others"
  const [agencyFocusOption, setAgencyFocusOption] = useState(agencyFocusOptions[0]);
  const [agencyFocusCustom, setAgencyFocusCustom] = useState('');
  const [clientIndustriesOption, setClientIndustriesOption] = useState(clientIndustriesOptions[0]);
  const [clientIndustriesCustom, setClientIndustriesCustom] = useState('');
  const [agencyPrimaryIndustryOption, setAgencyPrimaryIndustryOption] = useState(primaryIndustryOptions[0]);
  const [agencyPrimaryIndustryCustom, setAgencyPrimaryIndustryCustom] = useState('');
  
  const [employerWebsite, setEmployerWebsite] = useState('');
  const [employerRemoteFriendly, setEmployerRemoteFriendly] = useState(true);
  const [locationCountry, setLocationCountry] = useState('');
  const [locationState, setLocationState] = useState('');
  const [locationCity, setLocationCity] = useState('');
  
  const [hrContactName, setHrContactName] = useState('');
  const [hrEmail, setHrEmail] = useState('');
  const [hrPhone, setHrPhone] = useState('');
  
  // Shared
  const [profilePicUrl, setProfilePicUrl] = useState('');
  const [profilePicFile, setProfilePicFile] = useState<File | null>(null);
  const [validationError, setValidationError] = useState('');

  const validateCurrentStep = (currentStep: number): boolean => {
    setValidationError('');
    const isSeeker = user?.role === 'JOB_SEEKER';

    if (isSeeker) {
      switch (currentStep) {
        case 1:
          if (!firstName.trim()) {
            setValidationError('Please enter your First Name.');
            return false;
          }
          if (!lastName.trim()) {
            setValidationError('Please enter your Last Name.');
            return false;
          }
          if (!phone.trim() || phone.replace(/\D/g, '').length < 6) {
            setValidationError('Please enter a valid Phone Number (minimum 6 digits).');
            return false;
          }
          if (!dateOfBirth) {
            setValidationError('Please enter your Date of Birth.');
            return false;
          }
          const dobDate = new Date(dateOfBirth);
          if (isNaN(dobDate.getTime()) || dobDate > new Date()) {
            setValidationError('Please enter a valid past Date of Birth.');
            return false;
          }
          return true;
        case 2:
          if (!headline.trim()) {
            setValidationError('Please enter your Professional / Trade Headline.');
            return false;
          }
          if (seekerCategory === 'SKILLED_TRADE') {
            if (tradeSpecialization === 'Other Skilled Trade / Artisan' && !customTrade.trim()) {
              setValidationError('Please specify your Skilled Trade / Artisan profession.');
              return false;
            }
          } else {
            if (!profession.trim()) {
              setValidationError('Please enter your Primary Profession.');
              return false;
            }
          }
          return true;
        case 3:
          if (!residenceCountry) {
            setValidationError('Please select your Resident Country.');
            return false;
          }
          if (!citizenshipCountry) {
            setValidationError('Please select your Citizenship Country / Nationality.');
            return false;
          }
          if (!residenceState.trim()) {
            setValidationError('Please enter your Resident State / Province / Region.');
            return false;
          }
          if (!residenceCity.trim()) {
            setValidationError('Please enter your City / Town.');
            return false;
          }
          return true;
        case 4:
          if (!desiredJobTitle.trim()) {
            setValidationError('Please enter your Desired Job Title.');
            return false;
          }
          if (!preferredWorkCountry) {
            setValidationError('Please select your Preferred Work Country (or select Any Country).');
            return false;
          }
          if (!salaryAmount.trim() && !expectedSalary.trim()) {
            setValidationError('Please enter your Desired / Expected Compensation amount.');
            return false;
          }
          return true;
        default:
          return true;
      }
    } else {
      switch (currentStep) {
        case 1:
          if (!companyName.trim()) {
            setValidationError('Please enter your Company / Agency Name.');
            return false;
          }
          if (businessType === 'RECRUITING_AGENCY') {
            if (agencyFocusOption === 'Others' && !agencyFocusCustom.trim()) {
              setValidationError('Please specify your Agency Focus.');
              return false;
            }
            if (clientIndustriesOption === 'Others' && !clientIndustriesCustom.trim()) {
              setValidationError('Please specify the Client Companies / Industries Served.');
              return false;
            }
            if (agencyPrimaryIndustryOption === 'Others' && !agencyPrimaryIndustryCustom.trim()) {
              setValidationError('Please specify your Primary Industry / Sector.');
              return false;
            }
          } else {
            if (employerIndustryOption === 'Others' && !employerIndustryCustom.trim()) {
              setValidationError('Please specify your Industry / Sector.');
              return false;
            }
          }
          if (!description.trim()) {
            setValidationError('Please enter a brief Company Description.');
            return false;
          }
          if (!companySize.trim()) {
            setValidationError('Please select Team Size.');
            return false;
          }
          if (!foundedYear.trim()) {
            setValidationError('Please select Founded Year.');
            return false;
          }
          return true;
        case 2:
          if (!locationCountry) {
            setValidationError('Please select Location Country.');
            return false;
          }
          if (!locationState.trim()) {
            setValidationError('Please enter Location State / Province.');
            return false;
          }
          if (!locationCity.trim()) {
            setValidationError('Please enter Location City / Town.');
            return false;
          }
          if (!hrContactName.trim()) {
            setValidationError('Please enter HR Contact Name.');
            return false;
          }
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!hrEmail.trim() || !emailRegex.test(hrEmail.trim())) {
            setValidationError('Please enter a valid HR Contact Email address.');
            return false;
          }
          if (!hrPhone.trim() || hrPhone.replace(/\D/g, '').length < 6) {
            setValidationError('Please enter a valid HR Contact Phone Number.');
            return false;
          }
          return true;
        default:
          return true;
      }
    }
  };
  
  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }
      try {
        const res = await fetch('/api/auth/me', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const userData = await res.json();
          setUser(userData);
          // Prepopulate if profile exists
          const endpoint = userData.role === 'JOB_SEEKER' ? '/profiles/job-seeker' : '/profiles/employer';
          const profRes = await fetch(`/api${endpoint}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (profRes.ok) {
            const prof = await profRes.json();
            if (userData.role === 'JOB_SEEKER') {
              setFirstName(prof.firstName || '');
              setLastName(prof.lastName || '');
              setOtherNames(prof.otherNames || '');
              setGender(prof.gender || '');
              setDateOfBirth(prof.dateOfBirth ? prof.dateOfBirth.split('T')[0] : '');
              
              const rawPhone = prof.phone || '';
              const matchedCode = phoneCodes.find(pc => rawPhone.startsWith(pc.code));
              if (matchedCode) {
                setPhoneCode(matchedCode.code);
                setPhone(rawPhone.slice(matchedCode.code.length));
              } else {
                setPhoneCode('+1');
                setPhone(rawPhone);
              }

              setNationality(prof.nationality || '');
              setMaritalStatus(prof.maritalStatus || '');
              setHeadline(prof.headline || '');
              setProfession(prof.profession || '');
              
              if (prof.isSkilledProfessional) {
                setSeekerCategory('SKILLED_TRADE');
                setIsSkilledProfessional(true);
                const profSkill = prof.skilledProfession || prof.profession || '';
                if (skilledTradesList.includes(profSkill)) {
                  setTradeSpecialization(profSkill);
                } else if (profSkill) {
                  setTradeSpecialization('Other Skilled Trade / Artisan');
                  setCustomTrade(profSkill);
                }
              } else {
                setSeekerCategory('PROFESSIONAL');
                setIsSkilledProfessional(false);
              }

              setSummary(prof.summary || '');
              setResidenceCountry(prof.residenceCountry || '');
              setResidenceState(prof.residenceState || '');
              setResidenceCity(prof.residenceCity || '');
              setCitizenshipCountry(prof.citizenshipCountry || prof.nationality || '');
              setWillingToRelocate(prof.willingToRelocate || false);
              setIsOpenToRemote(prof.remotePreference === 'REMOTE_ONLY' || prof.workArrangement === 'Remote');
              setDesiredJobTitle(prof.desiredJobTitle || '');
              const prefInd = prof.preferredIndustry || '';
              if (generalIndustryOptions.includes(prefInd)) {
                setPreferredIndustryOption(prefInd);
              } else if (prefInd) {
                setPreferredIndustryOption('Others');
                setPreferredIndustryCustom(prefInd);
              }
              setEmploymentType(prof.employmentType || 'Full-time');
              setWorkArrangement(prof.workArrangement || 'Hybrid');
              
              // Parse existing expectedSalary
              const rawSalary = prof.expectedSalary || '';
              setExpectedSalary(rawSalary);
              if (rawSalary) {
                // e.g. "$ 75000 / monthly" or "₦ 200,000 / month"
                const parts = rawSalary.split(' ');
                if (parts.length >= 2) {
                  const currMatch = currencyOptions.find(c => c.code === parts[0]);
                  if (currMatch) setSalaryCurrency(currMatch.code);
                  setSalaryAmount(parts[1] || '');
                  if (rawSalary.toLowerCase().includes('/ hour') || rawSalary.toLowerCase().includes('/ hr')) {
                    setSalaryFrequency('Hourly');
                  } else if (rawSalary.toLowerCase().includes('/ day') || rawSalary.toLowerCase().includes('/ daily')) {
                    setSalaryFrequency('Daily');
                  } else if (rawSalary.toLowerCase().includes('/ year') || rawSalary.toLowerCase().includes('/ annual')) {
                    setSalaryFrequency('Annually');
                  } else {
                    setSalaryFrequency('Monthly');
                  }
                } else {
                  setSalaryAmount(rawSalary);
                }
              }

              setAvailability(prof.availability || 'Immediately');
              const prefWorkCountry = typeof prof.preferredLocations === 'string' ? prof.preferredLocations : (Array.isArray(prof.preferredLocations) && prof.preferredLocations.length > 0 ? prof.preferredLocations[0] : '');
              setPreferredWorkCountry(prefWorkCountry || '');
              if (prefWorkCountry) {
                setSalaryCurrency(getCurrencySymbol(prefWorkCountry));
              }
              setEducation(prof.education || []);
              setExperience(prof.experience || []);
              setCertificates(prof.certificates || []);
              setAchievements(prof.achievements || []);
              setProjects(prof.projects || []);
              setReferences(prof.references || []);
              setSocialLinks(prof.socialLinks || { linkedin: '', github: '', website: '' });
              setProfilePicUrl(prof.profilePicture || '');
            } else {
              setCompanyName(prof.companyName || '');
              setDescription(prof.description || '');
              const empInd = prof.industry || '';
              if (generalIndustryOptions.includes(empInd)) {
                setEmployerIndustryOption(empInd);
              } else if (empInd) {
                setEmployerIndustryOption('Others');
                setEmployerIndustryCustom(empInd);
              }
              setBusinessType(prof.businessType || 'DIRECT_EMPLOYER');
              setEmployerWebsite(prof.website || '');
              setCompanySize(prof.companySize || teamSizeOptions[0]);
              setFoundedYear(prof.foundedYear ? prof.foundedYear.toString() : '2020');
              setLocationCountry(prof.locationCountry || '');
              setLocationState(prof.locationState || '');
              setLocationCity(prof.locationCity || '');
              setHrContactName(prof.hrContactName || '');
              setHrEmail(prof.hrEmail || '');
              
              const rawHrPhone = prof.hrPhone || '';
              const matchedHrCode = phoneCodes.find(pc => rawHrPhone.startsWith(pc.code));
              if (matchedHrCode) {
                setHrPhoneCode(matchedHrCode.code);
                setHrPhone(rawHrPhone.slice(matchedHrCode.code.length));
              } else {
                setHrPhoneCode('+1');
                setHrPhone(rawHrPhone);
              }

              setProfilePicUrl(prof.profilePicture || '');
            }
          }
        } else {
          router.push('/login');
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [router]);

  const handleFileUpload = async () => {
    if (!profilePicFile) return profilePicUrl;
    const formData = new FormData();
    formData.append('file', profilePicFile);
    try {
      const res = await fetch('/api/uploads/profile-picture', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: formData
      });
      if (res.ok) {
        const data = await res.json();
        return data.url;
      }
    } catch (e) {
      console.error('File upload failed', e);
    }
    return profilePicUrl;
  };

  const handleSave = async () => {
    setSaving(true);
    const uploadedUrl = await handleFileUpload();
    const token = localStorage.getItem('token');
    
    let payload = {};
    let endpoint = '';
    
    if (user?.role === 'JOB_SEEKER') {
      endpoint = '/profiles/job-seeker';
      const isSkilled = seekerCategory === 'SKILLED_TRADE';
      const resolvedTrade = tradeSpecialization === 'Other Skilled Trade / Artisan' ? customTrade : tradeSpecialization;
      const finalProfession = isSkilled ? resolvedTrade : profession;
      const finalSalary = salaryAmount.trim() 
        ? `${salaryCurrency} ${salaryAmount.trim()} / ${salaryFrequency.toLowerCase()}` 
        : expectedSalary;

      const finalPreferredIndustry = preferredIndustryOption === 'Others' ? preferredIndustryCustom.trim() : preferredIndustryOption;

      payload = {
        firstName, 
        lastName, 
        otherNames, 
        gender, 
        phone: phoneCode + phone, 
        nationality: citizenshipCountry || nationality, 
        maritalStatus,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth).toISOString() : null,
        headline, 
        profession: finalProfession, 
        isSkilledProfessional: isSkilled, 
        skilledProfession: isSkilled ? resolvedTrade : null, 
        summary,
        residenceCountry, 
        residenceState, 
        residenceCity, 
        citizenshipCountry, 
        willingToRelocate,
        remotePreference: isOpenToRemote ? 'REMOTE_ONLY' : 'FLEXIBLE',
        desiredJobTitle, 
        preferredIndustry: finalPreferredIndustry, 
        employmentType, 
        workArrangement: isOpenToRemote ? 'Remote' : workArrangement, 
        expectedSalary: finalSalary, 
        availability,
        preferredLocations: preferredWorkCountry,
        education, 
        experience, 
        certificates, 
        achievements, 
        projects, 
        references,
        socialLinks, 
        profilePicture: uploadedUrl, 
        skills: []
      };
    } else {
      endpoint = '/profiles/employer';
      const finalAgencyFocus = agencyFocusOption === 'Others' ? agencyFocusCustom : agencyFocusOption;
      const finalClientIndustries = clientIndustriesOption === 'Others' ? clientIndustriesCustom : clientIndustriesOption;
      const finalEmployerIndustry = employerIndustryOption === 'Others' ? employerIndustryCustom.trim() : employerIndustryOption;
      const finalIndustry = businessType === 'RECRUITING_AGENCY' 
        ? (agencyPrimaryIndustryOption === 'Others' ? agencyPrimaryIndustryCustom : agencyPrimaryIndustryOption)
        : finalEmployerIndustry;

      const formattedDescription = businessType === 'RECRUITING_AGENCY'
        ? `[Recruiting Agency | Focus: ${finalAgencyFocus || 'Full-cycle'} | Clients: ${finalClientIndustries || 'Various'} | Remote Friendly: ${employerRemoteFriendly ? 'Yes' : 'No'}] ${description}`
        : `[Remote Friendly: ${employerRemoteFriendly ? 'Yes' : 'No'}] ${description}`;

      payload = {
        companyName, 
        description: formattedDescription, 
        industry: finalIndustry, 
        businessType,
        website: employerWebsite ? employerWebsite.trim() : undefined,
        companySize, 
        foundedYear: parseInt(foundedYear) || null,
        locationCountry, 
        locationState, 
        locationCity, 
        hrContactName, 
        hrEmail, 
        hrPhone: hrPhoneCode + hrPhone, 
        profilePicture: uploadedUrl
      };
    }
    
    try {
      const res = await fetch(`/api${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        if (user?.role === 'EMPLOYER') {
          window.location.href = '/applications';
        } else {
          window.location.href = '/seeker-dashboard';
        }
      } else {
        const errData = await res.json().catch(() => ({}));
        alert(errData.message || 'Failed to save profile.');
      }
    } catch (err) {
      console.error(err);
      alert('Network error. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', marginTop: '5rem', color: 'white' }}>Loading profile...</div>;

  const renderSeekerSteps = () => {
    switch (step) {
      case 1:
        return (
          <div className="fly-in">
            <h2>Personal Information</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.2rem' }}>
              Enter your basic contact and demographic details.
            </p>
            <input placeholder="First Name *" value={firstName} onChange={e => setFirstName(e.target.value)} className="input-field" />
            <input placeholder="Last Name *" value={lastName} onChange={e => setLastName(e.target.value)} className="input-field" />
            <input placeholder="Other Names (Optional)" value={otherNames} onChange={e => setOtherNames(e.target.value)} className="input-field" />
            
            <label style={{ color: 'white', display: 'block', marginBottom: '0.4rem', fontSize: '0.9rem', fontWeight: 500 }}>
              Phone Number <span style={{ color: '#00F0FF' }}>*</span>
            </label>
            <div style={{ display: 'flex', gap: '0.6rem', marginBottom: '1.2rem', alignItems: 'flex-start' }}>
              <SearchablePhoneCodeSelect value={phoneCode} onChange={setPhoneCode} />
              <input 
                placeholder="e.g. 803 123 4567" 
                value={phone} 
                onChange={e => setPhone(e.target.value)} 
                className="input-field" 
                style={{ flex: 1, marginBottom: 0 }} 
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem', marginBottom: '1.2rem' }}>
              <div>
                <label style={{ color: 'white', display: 'block', marginBottom: '0.4rem', fontSize: '0.9rem' }}>Gender</label>
                <select value={gender} onChange={e => setGender(e.target.value)} className="input-field" style={{ marginBottom: 0 }}>
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Prefer not to say">Prefer not to say</option>
                </select>
              </div>
              <div>
                <label style={{ color: 'white', display: 'block', marginBottom: '0.4rem', fontSize: '0.9rem' }}>Marital Status</label>
                <select value={maritalStatus} onChange={e => setMaritalStatus(e.target.value)} className="input-field" style={{ marginBottom: 0 }}>
                  <option value="">Select Status</option>
                  <option value="Single">Single</option>
                  <option value="Married">Married</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
            
            <label style={{ color: 'white', display: 'block', marginBottom: '0.4rem', fontSize: '0.9rem', fontWeight: 500 }}>
              Date of Birth <span style={{ color: '#00F0FF' }}>*</span>
            </label>
            <input 
              type="date" 
              value={dateOfBirth} 
              onChange={e => setDateOfBirth(e.target.value)} 
              className="input-field" 
              title="Date of Birth" 
            />
          </div>
        );
      case 2:
        return (
          <div className="fly-in">
            <h2>Career Track & Expertise</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.2rem' }}>
              Choose whether you are in corporate/professional work or specialized skilled crafts & trades.
            </p>

            {/* Career Category Selector */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem', marginBottom: '1.5rem' }}>
              <button
                type="button"
                onClick={() => {
                  setSeekerCategory('PROFESSIONAL');
                  setIsSkilledProfessional(false);
                }}
                style={{
                  padding: '14px 12px',
                  borderRadius: '12px',
                  border: seekerCategory === 'PROFESSIONAL' ? '2px solid #00F0FF' : '1px solid rgba(255,255,255,0.15)',
                  background: seekerCategory === 'PROFESSIONAL' ? 'rgba(0,240,255,0.12)' : 'rgba(255,255,255,0.04)',
                  color: 'white',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.2s',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold', color: seekerCategory === 'PROFESSIONAL' ? '#00F0FF' : 'white' }}>
                  <Briefcase size={18} /> Corporate & Professional
                </div>
                <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)', marginTop: '4px' }}>
                  Software, Finance, Medical, Management, Marketing & Office roles
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSeekerCategory('SKILLED_TRADE');
                  setIsSkilledProfessional(true);
                }}
                style={{
                  padding: '14px 12px',
                  borderRadius: '12px',
                  border: seekerCategory === 'SKILLED_TRADE' ? '2px solid #00F0FF' : '1px solid rgba(255,255,255,0.15)',
                  background: seekerCategory === 'SKILLED_TRADE' ? 'rgba(0,240,255,0.12)' : 'rgba(255,255,255,0.04)',
                  color: 'white',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.2s',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold', color: seekerCategory === 'SKILLED_TRADE' ? '#00F0FF' : 'white' }}>
                  <Wrench size={18} /> Skilled Trade & Artisan
                </div>
                <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)', marginTop: '4px' }}>
                  Electricians, Plumbers, Welders, Mechanics, Chefs, Drivers & Crafts
                </div>
              </button>
            </div>

            {seekerCategory === 'SKILLED_TRADE' ? (
              <div style={{ padding: '1rem', background: 'rgba(0,240,255,0.04)', borderRadius: '12px', border: '1px dashed rgba(0,240,255,0.3)', marginBottom: '1.2rem' }}>
                <label style={{ color: '#00F0FF', display: 'block', fontWeight: 600, marginBottom: '0.4rem', fontSize: '0.9rem' }}>
                  Select Your Trade / Craft Specialization <span style={{ color: '#00F0FF' }}>*</span>
                </label>
                <select 
                  value={tradeSpecialization} 
                  onChange={e => setTradeSpecialization(e.target.value)} 
                  className="input-field"
                  style={{ marginBottom: tradeSpecialization === 'Other Skilled Trade / Artisan' ? '0.8rem' : 0 }}
                >
                  {skilledTradesList.map(trade => (
                    <option key={trade} value={trade}>{trade}</option>
                  ))}
                </select>

                {tradeSpecialization === 'Other Skilled Trade / Artisan' && (
                  <input 
                    placeholder="Specify your trade (e.g. Master Goldsmith, Roofer, Locksmith) *" 
                    value={customTrade} 
                    onChange={e => setCustomTrade(e.target.value)} 
                    className="input-field" 
                    style={{ marginBottom: 0 }}
                  />
                )}
              </div>
            ) : null}

            <label style={{ color: 'white', display: 'block', marginBottom: '0.4rem', fontSize: '0.9rem', fontWeight: 500 }}>
              Professional / Trade Headline <span style={{ color: '#00F0FF' }}>*</span>
            </label>
            <input 
              placeholder={seekerCategory === 'SKILLED_TRADE' ? "e.g. Certified Industrial Electrician | 8+ Yrs Commercial Wiring" : "e.g. Senior Full-Stack Engineer | AI & Cloud Architecture"} 
              value={headline} 
              onChange={e => setHeadline(e.target.value)} 
              className="input-field" 
            />

            {seekerCategory === 'PROFESSIONAL' && (
              <div>
                <label style={{ color: 'white', display: 'block', marginBottom: '0.4rem', fontSize: '0.9rem', fontWeight: 500 }}>
                  Primary Profession <span style={{ color: '#00F0FF' }}>*</span>
                </label>
                <input 
                  placeholder="e.g. Financial Analyst, Software Engineer, Nurse" 
                  value={profession} 
                  onChange={e => setProfession(e.target.value)} 
                  className="input-field" 
                />
              </div>
            )}

            <label style={{ color: 'white', display: 'block', marginBottom: '0.4rem', fontSize: '0.9rem' }}>
              {seekerCategory === 'SKILLED_TRADE' ? "Trade Profile & Practical Expertise" : "Professional Summary (About Me)"}
            </label>
            <textarea 
              placeholder={seekerCategory === 'SKILLED_TRADE' 
                ? "Describe your hands-on experience, equipment/tools you operate, apprenticeships completed, and types of projects handled..." 
                : "Summarize your career highlights, core strengths, leadership experience, and key accomplishments..."} 
              value={summary} 
              onChange={e => setSummary(e.target.value)} 
              className="input-field" 
              rows={4} 
            />
          </div>
        );
      case 3:
        return (
          <div className="fly-in">
            <h2>Location & Residency</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.2rem' }}>
              Where do you currently reside and hold citizenship?
            </p>

            {/* Resident Country with Search */}
            <SearchableCountrySelect
              label="Resident Country"
              value={residenceCountry}
              required
              placeholder="Search or select country where you live..."
              onChange={(c) => {
                setResidenceCountry(c);
                setResidenceState('');
                // If preferredWorkCountry is not set yet, set default salary currency to this country
                if (!preferredWorkCountry) {
                  setSalaryCurrency(getCurrencySymbol(c));
                }
              }}
            />

            {/* Citizenship Country with Search */}
            <SearchableCountrySelect
              label="Citizenship Country / Nationality"
              value={citizenshipCountry}
              required
              placeholder="Search or select citizenship / passport country..."
              onChange={(c) => {
                setCitizenshipCountry(c);
                setNationality(c);
              }}
            />

            {/* State / Province Dropdown auto-populated from countryStates */}
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ color: 'white', display: 'block', marginBottom: '0.4rem', fontSize: '0.9rem', fontWeight: 500 }}>
                Resident State / Province / Region <span style={{ color: '#00F0FF' }}>*</span>
              </label>
              {residenceCountry && countryStates[residenceCountry] ? (
                <>
                  <select 
                    value={countryStates[residenceCountry].includes(residenceState) ? residenceState : (residenceState ? 'OTHER_STATE' : '')} 
                    onChange={e => {
                      if (e.target.value === 'OTHER_STATE') {
                        setResidenceState('');
                      } else {
                        setResidenceState(e.target.value);
                      }
                    }} 
                    className="input-field"
                    style={{ marginBottom: (!residenceState || !countryStates[residenceCountry].includes(residenceState)) ? '0.6rem' : 0 }}
                  >
                    <option value="">Select State / Province</option>
                    {countryStates[residenceCountry].map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                    <option value="OTHER_STATE">Other / Enter Manually</option>
                  </select>
                  {(!residenceState || !countryStates[residenceCountry].includes(residenceState)) && (
                    <input 
                      placeholder="Type state or region manually *" 
                      value={residenceState} 
                      onChange={e => setResidenceState(e.target.value)} 
                      className="input-field" 
                      style={{ marginBottom: 0 }}
                    />
                  )}
                </>
              ) : (
                <input 
                  placeholder={residenceCountry ? "Enter State / Province / Region *" : "Select Resident Country first"} 
                  value={residenceState} 
                  onChange={e => setResidenceState(e.target.value)} 
                  className="input-field" 
                  disabled={!residenceCountry}
                  style={{ marginBottom: 0 }}
                />
              )}
            </div>

            <label style={{ color: 'white', display: 'block', marginBottom: '0.4rem', fontSize: '0.9rem', fontWeight: 500 }}>
              City / Town <span style={{ color: '#00F0FF' }}>*</span>
            </label>
            <input 
              placeholder="e.g. Lagos, Toronto, London, Austin" 
              value={residenceCity} 
              onChange={e => setResidenceCity(e.target.value)} 
              className="input-field" 
            />

            {/* Relocation and Remote preferences */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', marginTop: '1.2rem', padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '12px' }}>
              <label style={{ color: 'white', display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer', fontSize: '0.95rem' }}>
                <input 
                  type="checkbox" 
                  checked={isOpenToRemote} 
                  onChange={e => setIsOpenToRemote(e.target.checked)} 
                  style={{ width: '18px', height: '18px', accentColor: '#00F0FF' }}
                />
                <span style={{ fontWeight: 600 }}>🌐 Open to Remote Work / Seeking Remote Opportunities</span>
              </label>

              <label style={{ color: 'white', display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer', fontSize: '0.95rem' }}>
                <input 
                  type="checkbox" 
                  checked={willingToRelocate} 
                  onChange={e => setWillingToRelocate(e.target.checked)} 
                  style={{ width: '18px', height: '18px', accentColor: '#00F0FF' }}
                />
                <span>✈️ Willing to Relocate for the right role</span>
              </label>
            </div>
          </div>
        );
      case 4:
        return (
          <div className="fly-in">
            <h2>Job Preferences & Compensation</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.2rem' }}>
              Specify your target role, work country, and desired pay structure.
            </p>

            <label style={{ color: 'white', display: 'block', marginBottom: '0.4rem', fontSize: '0.9rem', fontWeight: 500 }}>
              Desired Job Title <span style={{ color: '#00F0FF' }}>*</span>
            </label>
            <input 
              placeholder="e.g. Master Electrician, Lead AI Engineer, Maintenance Foreman" 
              value={desiredJobTitle} 
              onChange={e => setDesiredJobTitle(e.target.value)} 
              className="input-field" 
            />

            <label style={{ color: 'white', display: 'block', marginBottom: '0.4rem', fontSize: '0.9rem' }}>
              Preferred Industry / Domain
            </label>
            <select
              value={preferredIndustryOption}
              onChange={e => setPreferredIndustryOption(e.target.value)}
              className="input-field"
              style={{ marginBottom: preferredIndustryOption === 'Others' ? '0.5rem' : '1rem' }}
            >
              {generalIndustryOptions.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
            {preferredIndustryOption === 'Others' && (
              <input 
                placeholder="Specify your Preferred Industry / Domain" 
                value={preferredIndustryCustom} 
                onChange={e => setPreferredIndustryCustom(e.target.value)} 
                className="input-field" 
                style={{ marginBottom: '1rem' }}
              />
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem', marginBottom: '1rem' }}>
              <div>
                <label style={{ color: 'white', display: 'block', marginBottom: '0.4rem', fontSize: '0.9rem' }}>Employment Type</label>
                <select value={employmentType} onChange={e => setEmploymentType(e.target.value)} className="input-field" style={{ marginBottom: 0 }}>
                  <option value="Full-time">Full-time</option>
                  <option value="Part-time">Part-time</option>
                  <option value="Contract">Contract</option>
                  <option value="Temporary">Temporary / Daily Hire</option>
                </select>
              </div>
              <div>
                <label style={{ color: 'white', display: 'block', marginBottom: '0.4rem', fontSize: '0.9rem' }}>Work Arrangement</label>
                <select value={workArrangement} onChange={e => setWorkArrangement(e.target.value)} className="input-field" style={{ marginBottom: 0 }}>
                  <option value="Remote">Remote</option>
                  <option value="Hybrid">Hybrid</option>
                  <option value="On-site">On-site</option>
                </select>
              </div>
            </div>

            {/* Preferred Work Country with Search */}
            <SearchableCountrySelect
              label="Preferred Work Country"
              value={preferredWorkCountry}
              required
              placeholder="Select preferred country to work in (or Any Country for Global)..."
              onChange={(c) => {
                setPreferredWorkCountry(c);
                if (c === 'Any Country (Global)' || c === 'Any Country') {
                  setSalaryCurrency('$');
                } else {
                  setSalaryCurrency(getCurrencySymbol(c));
                }
              }}
            />

            {/* Flexible Compensation Calculation: Per Hour, Daily, Monthly, Annually */}
            <div style={{ marginTop: '0.8rem', padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)' }}>
              <label style={{ color: 'white', display: 'block', fontWeight: 600, marginBottom: '0.4rem', fontSize: '0.95rem' }}>
                Expected / Desired Compensation <span style={{ color: '#00F0FF' }}>*</span>
              </label>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', margin: '0 0 0.8rem 0' }}>
                Select how you prefer to be compensated (per hour, daily, monthly, or annually). Currency defaults to your preferred work country or USD for global/remote roles.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 2fr 1.5fr', gap: '0.6rem' }}>
                {/* Currency select */}
                <select 
                  value={salaryCurrency} 
                  onChange={e => setSalaryCurrency(e.target.value)} 
                  className="input-field"
                  style={{ marginBottom: 0 }}
                  title="Currency"
                >
                  {currencyOptions.map(c => (
                    <option key={c.label} value={c.code}>{c.label}</option>
                  ))}
                </select>

                {/* Amount input */}
                <input 
                  placeholder="e.g. 50, 400, or 6,000" 
                  value={salaryAmount} 
                  onChange={e => setSalaryAmount(e.target.value)} 
                  className="input-field" 
                  style={{ marginBottom: 0 }}
                />

                {/* Frequency select */}
                <select 
                  value={salaryFrequency} 
                  onChange={e => setSalaryFrequency(e.target.value)} 
                  className="input-field"
                  style={{ marginBottom: 0 }}
                  title="Compensation Frequency"
                >
                  <option value="Hourly">Per Hour</option>
                  <option value="Daily">Daily</option>
                  <option value="Monthly">Monthly</option>
                  <option value="Annually">Annually</option>
                </select>
              </div>
            </div>

            <div style={{ marginTop: '1rem' }}>
              <label style={{ color: 'white', display: 'block', marginBottom: '0.4rem', fontSize: '0.9rem' }}>Availability to Start</label>
              <select value={availability} onChange={e => setAvailability(e.target.value)} className="input-field">
                <option value="Immediately">Immediately</option>
                <option value="1 week">Within 1 week</option>
                <option value="2 weeks">Within 2 weeks</option>
                <option value="1 month">Within 1 month</option>
                <option value="3 months">Within 3 months</option>
              </select>
            </div>
          </div>
        );
      case 5:
        return (
          <div className="fly-in">
            <h2>Education</h2>
            <button className="btn-primary" onClick={() => setEducation([...education, { school: '', course: '', dates: '', yearGraduated: '' }])}>Add Education</button>
            {education.map((ed, idx) => (
              <div key={idx} style={{ padding: '1rem', background: 'rgba(255,255,255,0.05)', marginTop: '0.5rem', borderRadius: '8px' }}>
                <input placeholder="Institution / School / Trade Academy" value={ed.school} onChange={e => { const n = [...education]; n[idx].school = e.target.value; setEducation(n); }} className="input-field" />
                <input placeholder="Course of Study / Certification" value={ed.course} onChange={e => { const n = [...education]; n[idx].course = e.target.value; setEducation(n); }} className="input-field" />
                <input placeholder="Dates (e.g. 2018-2022)" value={ed.dates} onChange={e => { const n = [...education]; n[idx].dates = e.target.value; setEducation(n); }} className="input-field" />
              </div>
            ))}
          </div>
        );
      case 6:
        return (
          <div className="fly-in">
            <h2>Experience</h2>
            <button className="btn-primary" onClick={() => setExperience([...experience, { company: '', role: '', dates: '', responsibilities: '' }])}>Add Experience</button>
            {experience.map((ex, idx) => (
              <div key={idx} style={{ padding: '1rem', background: 'rgba(255,255,255,0.05)', marginTop: '0.5rem', borderRadius: '8px' }}>
                <input placeholder="Company / Contractor / Self-Employed" value={ex.company} onChange={e => { const n = [...experience]; n[idx].company = e.target.value; setExperience(n); }} className="input-field" />
                <input placeholder="Role / Job Title" value={ex.role} onChange={e => { const n = [...experience]; n[idx].role = e.target.value; setExperience(n); }} className="input-field" />
                <input placeholder="Dates (e.g. Jan 2020 - Present)" value={ex.dates} onChange={e => { const n = [...experience]; n[idx].dates = e.target.value; setExperience(n); }} className="input-field" />
                <textarea placeholder="Responsibilities, tools used & achievements" value={ex.responsibilities || ''} onChange={e => { const n = [...experience]; n[idx].responsibilities = e.target.value; setExperience(n); }} className="input-field" rows={3} />
              </div>
            ))}
          </div>
        );
      case 7:
        return (
          <div className="fly-in">
            <h2>Certifications & Projects</h2>
            <button className="btn-primary" onClick={() => setCertificates([...certificates, { name: '', date: '' }])}>Add Certification / License</button>
            {certificates.map((cert, idx) => (
              <div key={idx} style={{ padding: '1rem', background: 'rgba(255,255,255,0.05)', marginTop: '0.5rem', borderRadius: '8px' }}>
                <input placeholder="License / Certification Name" value={cert.name} onChange={e => { const n = [...certificates]; n[idx].name = e.target.value; setCertificates(n); }} className="input-field" />
                <input placeholder="Date Obtained or Issuing Body" value={cert.date} onChange={e => { const n = [...certificates]; n[idx].date = e.target.value; setCertificates(n); }} className="input-field" />
              </div>
            ))}
            <hr style={{ margin: '1rem 0', borderColor: 'rgba(255,255,255,0.1)' }} />
            <button className="btn-primary" onClick={() => setProjects([...projects, { title: '', description: '', liveLink: '' }])}>Add Project / Completed Work</button>
            {projects.map((proj, idx) => (
              <div key={idx} style={{ padding: '1rem', background: 'rgba(255,255,255,0.05)', marginTop: '0.5rem', borderRadius: '8px' }}>
                <input placeholder="Project / Contract Title" value={proj.title} onChange={e => { const n = [...projects]; n[idx].title = e.target.value; setProjects(n); }} className="input-field" />
                <input placeholder="Description & Outcomes" value={proj.description} onChange={e => { const n = [...projects]; n[idx].description = e.target.value; setProjects(n); }} className="input-field" />
                <input placeholder="Link or Evidence (Optional)" value={proj.liveLink} onChange={e => { const n = [...projects]; n[idx].liveLink = e.target.value; setProjects(n); }} className="input-field" />
              </div>
            ))}
          </div>
        );
      case 8:
        return (
          <div className="fly-in">
            <h2>Social Links & Profile Picture</h2>
            <input placeholder="LinkedIn URL" value={socialLinks.linkedin} onChange={e => setSocialLinks({...socialLinks, linkedin: e.target.value})} className="input-field" />
            <input placeholder="GitHub or Portfolio URL" value={socialLinks.github} onChange={e => setSocialLinks({...socialLinks, github: e.target.value})} className="input-field" />
            <input placeholder="Personal Website" value={socialLinks.website} onChange={e => setSocialLinks({...socialLinks, website: e.target.value})} className="input-field" />
            
            <h3 style={{ marginTop: '1rem' }}>Profile Picture</h3>
            {profilePicUrl && <img src={profilePicUrl} alt="Preview" style={{ width: 100, height: 100, borderRadius: '50%', objectFit: 'cover', marginBottom: '1rem' }} />}
            <input type="file" accept="image/*" onChange={e => {
              if (e.target.files && e.target.files[0]) {
                setProfilePicFile(e.target.files[0]);
                setProfilePicUrl(URL.createObjectURL(e.target.files[0]));
              }
            }} className="input-field" />
          </div>
        );
      default: return null;
    }
  };

  const renderEmployerSteps = () => {
    switch (step) {
      case 1:
        return (
          <div className="fly-in">
            <h2>Organization & Hiring Model</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.2rem' }}>
              Define your organizational model, recruiting scope, and remote hiring policy.
            </p>
            
            {/* Organization Type Switcher */}
            <div style={{ marginBottom: '1.2rem', padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
              <label style={{ color: 'white', display: 'block', fontWeight: 'bold', marginBottom: '0.6rem' }}>Select Organization Type:</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
                <button
                  type="button"
                  onClick={() => setBusinessType('DIRECT_EMPLOYER')}
                  style={{
                    padding: '12px',
                    borderRadius: '8px',
                    border: businessType === 'DIRECT_EMPLOYER' ? '2px solid #00f0ff' : '1px solid rgba(255,255,255,0.15)',
                    background: businessType === 'DIRECT_EMPLOYER' ? 'rgba(0,240,255,0.15)' : 'rgba(255,255,255,0.05)',
                    color: 'white',
                    cursor: 'pointer',
                    textAlign: 'left'
                  }}
                >
                  <div style={{ fontWeight: 'bold', color: businessType === 'DIRECT_EMPLOYER' ? '#00f0ff' : 'white' }}>🏢 Direct Company</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>Hiring directly for internal workforce</div>
                </button>
                <button
                  type="button"
                  onClick={() => setBusinessType('RECRUITING_AGENCY')}
                  style={{
                    padding: '12px',
                    borderRadius: '8px',
                    border: businessType === 'RECRUITING_AGENCY' ? '2px solid #00f0ff' : '1px solid rgba(255,255,255,0.15)',
                    background: businessType === 'RECRUITING_AGENCY' ? 'rgba(0,240,255,0.15)' : 'rgba(255,255,255,0.05)',
                    color: 'white',
                    cursor: 'pointer',
                    textAlign: 'left'
                  }}
                >
                  <div style={{ fontWeight: 'bold', color: businessType === 'RECRUITING_AGENCY' ? '#00f0ff' : 'white' }}>🤝 Recruiting Agency</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>Recruiting talent on behalf of client companies</div>
                </button>
              </div>
            </div>

            <label style={{ color: 'white', display: 'block', marginBottom: '0.4rem', fontSize: '0.9rem', fontWeight: 500 }}>
              {businessType === 'RECRUITING_AGENCY' ? "Agency Name *" : "Company Name *"}
            </label>
            <input 
              placeholder={businessType === 'RECRUITING_AGENCY' ? "e.g. Apex Talent Partners Ltd" : "e.g. Acme Corporation"} 
              value={companyName} 
              onChange={e => setCompanyName(e.target.value)} 
              className="input-field" 
            />

            {/* If Recruiting Agency: Specific Overhaul */}
            {businessType === 'RECRUITING_AGENCY' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', marginBottom: '1.2rem', padding: '1rem', background: 'rgba(0,240,255,0.04)', borderRadius: '12px', border: '1px dashed rgba(0,240,255,0.3)' }}>
                <h4 style={{ margin: 0, color: '#00f0ff', fontSize: '0.95rem' }}>Recruiting Agency Parameters</h4>

                {/* Agency Focus with "Others" */}
                <div>
                  <label style={{ color: 'white', display: 'block', marginBottom: '0.35rem', fontSize: '0.85rem' }}>
                    Agency Focus <span style={{ color: '#00F0FF' }}>*</span>
                  </label>
                  <select 
                    value={agencyFocusOption} 
                    onChange={e => setAgencyFocusOption(e.target.value)} 
                    className="input-field"
                    style={{ marginBottom: agencyFocusOption === 'Others' ? '0.5rem' : 0 }}
                  >
                    {agencyFocusOptions.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                  {agencyFocusOption === 'Others' && (
                    <input 
                      placeholder="Specify your agency focus *" 
                      value={agencyFocusCustom} 
                      onChange={e => setAgencyFocusCustom(e.target.value)} 
                      className="input-field" 
                      style={{ marginBottom: 0 }}
                    />
                  )}
                </div>

                {/* Client Industries Served with "Others" */}
                <div>
                  <label style={{ color: 'white', display: 'block', marginBottom: '0.35rem', fontSize: '0.85rem' }}>
                    Client Companies / Industries Served <span style={{ color: '#00F0FF' }}>*</span>
                  </label>
                  <select 
                    value={clientIndustriesOption} 
                    onChange={e => setClientIndustriesOption(e.target.value)} 
                    className="input-field"
                    style={{ marginBottom: clientIndustriesOption === 'Others' ? '0.5rem' : 0 }}
                  >
                    {clientIndustriesOptions.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                  {clientIndustriesOption === 'Others' && (
                    <input 
                      placeholder="Specify client industries served *" 
                      value={clientIndustriesCustom} 
                      onChange={e => setClientIndustriesCustom(e.target.value)} 
                      className="input-field" 
                      style={{ marginBottom: 0 }}
                    />
                  )}
                </div>

                {/* Primary Industry / Sector with "Others" */}
                <div>
                  <label style={{ color: 'white', display: 'block', marginBottom: '0.35rem', fontSize: '0.85rem' }}>
                    Primary Industry / Sector <span style={{ color: '#00F0FF' }}>*</span>
                  </label>
                  <select 
                    value={agencyPrimaryIndustryOption} 
                    onChange={e => setAgencyPrimaryIndustryOption(e.target.value)} 
                    className="input-field"
                    style={{ marginBottom: agencyPrimaryIndustryOption === 'Others' ? '0.5rem' : 0 }}
                  >
                    {primaryIndustryOptions.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                  {agencyPrimaryIndustryOption === 'Others' && (
                    <input 
                      placeholder="Specify primary sector *" 
                      value={agencyPrimaryIndustryCustom} 
                      onChange={e => setAgencyPrimaryIndustryCustom(e.target.value)} 
                      className="input-field" 
                      style={{ marginBottom: 0 }}
                    />
                  )}
                </div>
              </div>
            ) : (
              <div>
                <label style={{ color: 'white', display: 'block', marginBottom: '0.4rem', fontSize: '0.9rem', fontWeight: 500 }}>
                  Primary Industry / Sector <span style={{ color: '#00F0FF' }}>*</span>
                </label>
                <select 
                  value={employerIndustryOption} 
                  onChange={e => setEmployerIndustryOption(e.target.value)} 
                  className="input-field"
                  style={{ marginBottom: employerIndustryOption === 'Others' ? '0.5rem' : '1rem' }}
                >
                  {generalIndustryOptions.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
                {employerIndustryOption === 'Others' && (
                  <input 
                    placeholder="Specify your Primary Industry / Sector *" 
                    value={employerIndustryCustom} 
                    onChange={e => setEmployerIndustryCustom(e.target.value)} 
                    className="input-field" 
                    style={{ marginBottom: '1rem' }}
                  />
                )}
              </div>
            )}

            {/* Team Size and Founded Year Dropdowns */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem', marginBottom: '1rem' }}>
              <div>
                <label style={{ color: 'white', display: 'block', marginBottom: '0.4rem', fontSize: '0.9rem', fontWeight: 500 }}>
                  Team Size <span style={{ color: '#00F0FF' }}>*</span>
                </label>
                <select 
                  value={companySize} 
                  onChange={e => setCompanySize(e.target.value)} 
                  className="input-field"
                  style={{ marginBottom: 0 }}
                >
                  {teamSizeOptions.map(size => (
                    <option key={size} value={size}>{size}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ color: 'white', display: 'block', marginBottom: '0.4rem', fontSize: '0.9rem', fontWeight: 500 }}>
                  Founded Year <span style={{ color: '#00F0FF' }}>*</span>
                </label>
                <select 
                  value={foundedYear} 
                  onChange={e => setFoundedYear(e.target.value)} 
                  className="input-field"
                  style={{ marginBottom: 0 }}
                >
                  {foundedYearsList.map(yr => (
                    <option key={yr} value={yr}>{yr}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Website is Optional; Registration Number is removed */}
            <label style={{ color: 'white', display: 'block', marginBottom: '0.4rem', fontSize: '0.9rem' }}>
              Official Website URL <span style={{ color: 'rgba(255,255,255,0.4)' }}>(Optional)</span>
            </label>
            <input 
              placeholder="e.g. https://company.com" 
              value={employerWebsite} 
              onChange={e => setEmployerWebsite(e.target.value)} 
              className="input-field" 
            />

            <label style={{ color: 'white', display: 'block', marginBottom: '0.4rem', fontSize: '0.9rem', fontWeight: 500 }}>
              {businessType === 'RECRUITING_AGENCY' ? "Agency Description & Track Record *" : "Company Description *"}
            </label>
            <textarea 
              placeholder={businessType === 'RECRUITING_AGENCY' 
                ? "Describe your recruiting expertise, client placement record, and hiring specialties..." 
                : "Briefly describe your company culture, products/services, and mission..."} 
              value={description} 
              onChange={e => setDescription(e.target.value)} 
              className="input-field" 
              rows={3} 
            />

            {/* Remote Friendly Provision for Employers */}
            <div style={{ padding: '0.9rem', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)' }}>
              <label style={{ color: 'white', display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer', fontSize: '0.95rem' }}>
                <input 
                  type="checkbox" 
                  checked={employerRemoteFriendly} 
                  onChange={e => setEmployerRemoteFriendly(e.target.checked)} 
                  style={{ width: '18px', height: '18px', accentColor: '#00F0FF' }}
                />
                <span style={{ fontWeight: 600 }}>🌐 Remote Friendly: Our organization is hiring remote / distributed workers</span>
              </label>
            </div>
          </div>
        );
      case 2:
        return (
          <div className="fly-in">
            <h2>Location & Contact Details</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.2rem' }}>
              Provide your headquarters location and designated HR point of contact.
            </p>

            {/* Country with Searchable select */}
            <SearchableCountrySelect
              label="Country"
              value={locationCountry}
              required
              placeholder="Search or select country..."
              onChange={(c) => {
                setLocationCountry(c);
                setLocationState('');
              }}
            />

            {/* State auto populated from countryStates */}
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ color: 'white', display: 'block', marginBottom: '0.4rem', fontSize: '0.9rem', fontWeight: 500 }}>
                State / Province / Region <span style={{ color: '#00F0FF' }}>*</span>
              </label>
              {locationCountry && countryStates[locationCountry] ? (
                <>
                  <select 
                    value={countryStates[locationCountry].includes(locationState) ? locationState : (locationState ? 'OTHER_STATE' : '')} 
                    onChange={e => {
                      if (e.target.value === 'OTHER_STATE') {
                        setLocationState('');
                      } else {
                        setLocationState(e.target.value);
                      }
                    }} 
                    className="input-field"
                    style={{ marginBottom: (!locationState || !countryStates[locationCountry].includes(locationState)) ? '0.6rem' : 0 }}
                  >
                    <option value="">Select State</option>
                    {countryStates[locationCountry].map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                    <option value="OTHER_STATE">Other / Enter Manually</option>
                  </select>
                  {(!locationState || !countryStates[locationCountry].includes(locationState)) && (
                    <input 
                      placeholder="Enter State Manually *" 
                      value={locationState} 
                      onChange={e => setLocationState(e.target.value)} 
                      className="input-field" 
                      style={{ marginBottom: 0 }}
                    />
                  )}
                </>
              ) : (
                <input 
                  placeholder={locationCountry ? "State / Province / Region *" : "Select Country first"} 
                  value={locationState} 
                  onChange={e => setLocationState(e.target.value)} 
                  className="input-field" 
                  disabled={!locationCountry}
                  style={{ marginBottom: 0 }}
                />
              )}
            </div>

            <label style={{ color: 'white', display: 'block', marginBottom: '0.4rem', fontSize: '0.9rem', fontWeight: 500 }}>
              City / Town <span style={{ color: '#00F0FF' }}>*</span>
            </label>
            <input 
              placeholder="e.g. Austin, Toronto, Lagos, Nairobi" 
              value={locationCity} 
              onChange={e => setLocationCity(e.target.value)} 
              className="input-field" 
            />
            
            <hr style={{ margin: '1.5rem 0', borderColor: 'rgba(255,255,255,0.1)' }} />
            <h3 style={{ marginBottom: '1rem', color: '#00f0ff' }}>HR & Primary Contact Person</h3>

            <label style={{ color: 'white', display: 'block', marginBottom: '0.4rem', fontSize: '0.9rem', fontWeight: 500 }}>
              HR Contact Name <span style={{ color: '#00F0FF' }}>*</span>
            </label>
            <input 
              placeholder="e.g. Sarah Jenkins" 
              value={hrContactName} 
              onChange={e => setHrContactName(e.target.value)} 
              className="input-field" 
            />

            <label style={{ color: 'white', display: 'block', marginBottom: '0.4rem', fontSize: '0.9rem', fontWeight: 500 }}>
              HR Contact Email <span style={{ color: '#00F0FF' }}>*</span>
            </label>
            <input 
              type="email"
              placeholder="e.g. hr@company.com" 
              value={hrEmail} 
              onChange={e => setHrEmail(e.target.value)} 
              className="input-field" 
            />
            
            <label style={{ color: 'white', display: 'block', marginBottom: '0.4rem', fontSize: '0.9rem', fontWeight: 500 }}>
              HR Phone Number <span style={{ color: '#00F0FF' }}>*</span>
            </label>
            <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'flex-start' }}>
              <SearchablePhoneCodeSelect value={hrPhoneCode} onChange={setHrPhoneCode} />
              <input 
                placeholder="Phone Number" 
                value={hrPhone} 
                onChange={e => setHrPhone(e.target.value)} 
                className="input-field" 
                style={{ flex: 1, marginBottom: 0 }} 
              />
            </div>
          </div>
        );
      case 3:
        return (
          <div className="fly-in">
            <h2>Company / Agency Logo</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.2rem' }}>
              Upload your official logo to display on job postings and applications.
            </p>
            {profilePicUrl && <img src={profilePicUrl} alt="Preview" style={{ width: 120, height: 120, borderRadius: '16px', objectFit: 'cover', marginBottom: '1rem', border: '2px solid rgba(0,240,255,0.4)' }} />}
            <input type="file" accept="image/*" onChange={e => {
              if (e.target.files && e.target.files[0]) {
                setProfilePicFile(e.target.files[0]);
                setProfilePicUrl(URL.createObjectURL(e.target.files[0]));
              }
            }} className="input-field" />
          </div>
        );
      default: return null;
    }
  };

  const totalSteps = user?.role === 'JOB_SEEKER' ? 8 : 3;

  return (
    <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <style>{`
        .fly-in { animation: flyIn 0.5s ease-out forwards; }
        @keyframes flyIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .input-field { width: 100%; padding: 0.9rem 1rem; border-radius: 12px; border: 1px solid rgba(255,255,255,0.12); background-color: rgba(255,255,255,0.05); color: white; font-size: 0.95rem; outline: none; margin-bottom: 1rem; box-sizing: border-box; }
        .input-field:focus { border-color: #00F0FF; }
        select.input-field option { background-color: #120b1c; color: white; }
      `}</style>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '640px', padding: '2.5rem 2rem', overflow: 'visible' }}>
        <h1 className="text-gradient" style={{ textAlign: 'center', margin: 0, fontSize: '1.8rem' }}>Complete Your Profile</h1>
        <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
          Step {step} of {totalSteps}
        </p>
        
        {validationError && (
          <div style={{ padding: '0.8rem 1rem', background: 'rgba(239, 68, 68, 0.2)', border: '1px solid rgba(239, 68, 68, 0.5)', borderRadius: '10px', color: '#fca5a5', marginBottom: '1.5rem', fontSize: '0.9rem', textAlign: 'center' }}>
            ⚠️ {validationError}
          </div>
        )}

        <div style={{ margin: '1.5rem 0' }}>
          {user?.role === 'JOB_SEEKER' ? renderSeekerSteps() : renderEmployerSteps()}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2rem' }}>
          {step > 1 ? (
            <button className="btn-primary" style={{ background: 'transparent', border: '1px solid #00f0ff' }} onClick={() => { setValidationError(''); setStep(step - 1); }}>Back</button>
          ) : <div />}
          
          {step < totalSteps ? (
            <button 
              className="btn-primary" 
              onClick={() => {
                if (validateCurrentStep(step)) {
                  setStep(step + 1);
                }
              }}
            >
              Next
            </button>
          ) : (
            <button 
              className="btn-primary" 
              onClick={() => {
                if (validateCurrentStep(step)) {
                  handleSave();
                }
              }} 
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save Profile'}
            </button>
          )}
        </div>
      </div>
    </main>
  );
}
