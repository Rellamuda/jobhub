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
  const [seekerType, setSeekerType] = useState<'INDIVIDUAL' | 'COMPANY_CONTRACTOR'>('INDIVIDUAL');
  const [contractorCompanyName, setContractorCompanyName] = useState('');
  const [businessRegNumber, setBusinessRegNumber] = useState('');
  const [crewSize, setCrewSize] = useState('1');

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
  
  // High-level Job Seeker Category (Corporate Professional vs Skilled Trade/Artisan vs Both)
  const [seekerCategory, setSeekerCategory] = useState<'PROFESSIONAL' | 'SKILLED_TRADE' | 'BOTH'>('PROFESSIONAL');
  const [tradeSpecialization, setTradeSpecialization] = useState(skilledTradesList[0]);
  const [customTrade, setCustomTrade] = useState('');
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState('');

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
  const [isSalaryNegotiable, setIsSalaryNegotiable] = useState(false);
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
  const [employerMission, setEmployerMission] = useState('');
  const [employerVision, setEmployerVision] = useState('');
  const [employerCulture, setEmployerCulture] = useState('');
  const [generatingAiCompany, setGeneratingAiCompany] = useState(false);
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
          if (seekerType === 'COMPANY_CONTRACTOR' && (!contractorCompanyName.trim() || contractorCompanyName.trim().length < 2)) {
            setValidationError('Please enter your Company / Contractor Business Name (minimum 2 characters).');
            return false;
          }
          if (!firstName.trim() || firstName.trim().length < 2) {
            setValidationError('Please enter your First Name (minimum 2 characters).');
            return false;
          }
          if (!lastName.trim() || lastName.trim().length < 2) {
            setValidationError('Please enter your Last Name (minimum 2 characters).');
            return false;
          }
          const cleanPhone = phone.replace(/\D/g, '');
          if (!phone.trim() || cleanPhone.length < 6) {
            setValidationError('Please enter a valid Phone Number (minimum 6 digits).');
            return false;
          }
          if (!gender || gender.trim() === '') {
            setValidationError('Please select your Gender.');
            return false;
          }
          if (!maritalStatus || maritalStatus.trim() === '') {
            setValidationError('Please select your Marital Status.');
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
          const minAgeDate = new Date();
          minAgeDate.setFullYear(minAgeDate.getFullYear() - 15);
          if (dobDate > minAgeDate) {
            setValidationError('You must be at least 15 years old to register.');
            return false;
          }
          return true;

        case 2:
          if (!headline.trim() || headline.trim().length < 3) {
            setValidationError('Please enter your Professional / Trade Headline (minimum 3 characters).');
            return false;
          }
          if (seekerCategory === 'SKILLED_TRADE' || seekerCategory === 'BOTH') {
            if (!tradeSpecialization) {
              setValidationError('Please select your Trade / Craft specialization.');
              return false;
            }
            if (tradeSpecialization === 'Other Skilled Trade / Artisan' && !customTrade.trim()) {
              setValidationError('Please specify your Skilled Trade / Artisan profession.');
              return false;
            }
          }
          if (seekerCategory === 'PROFESSIONAL' || seekerCategory === 'BOTH') {
            if (!profession.trim() || profession.trim().length < 2) {
              setValidationError('Please enter your Corporate / Academic Profession.');
              return false;
            }
          }
          if (!skills || skills.length === 0) {
            setValidationError('Please select or add at least one Skill or Trade before proceeding.');
            return false;
          }
          return true;

        case 3:
          if (!residenceCountry) {
            setValidationError(seekerType === 'COMPANY_CONTRACTOR' ? 'Please select Country of operation.' : 'Please select your Resident Country.');
            return false;
          }
          if (seekerType !== 'COMPANY_CONTRACTOR' && !citizenshipCountry) {
            setValidationError('Please select your Citizenship Country / Nationality.');
            return false;
          }
          if (!residenceState.trim()) {
            setValidationError(seekerType === 'COMPANY_CONTRACTOR' ? 'Please enter your Operating State / Province / Region.' : 'Please enter your Resident State / Province / Region.');
            return false;
          }
          if (!residenceCity.trim()) {
            setValidationError(seekerType === 'COMPANY_CONTRACTOR' ? 'Please enter your Town / City of Operation.' : 'Please enter your City / Town.');
            return false;
          }
          return true;

        case 4:
          if (!desiredJobTitle.trim() || desiredJobTitle.trim().length < 2) {
            setValidationError('Please enter your Desired Job Title.');
            return false;
          }
          if (preferredIndustryOption === 'Others' && !preferredIndustryCustom.trim()) {
            setValidationError('Please specify your Preferred Industry / Domain.');
            return false;
          }
          if (!preferredWorkCountry) {
            setValidationError('Please select your Preferred Work Country (or select Any Country).');
            return false;
          }
          if (!isSalaryNegotiable) {
            const numericSalary = parseFloat(salaryAmount.replace(/,/g, '').trim());
            if (!salaryAmount.trim() || isNaN(numericSalary) || numericSalary <= 0) {
              setValidationError('Please enter a valid positive numeric compensation amount (or mark as Negotiable).');
              return false;
            }
          }
          if (!availability) {
            setValidationError('Please select your Availability to Start.');
            return false;
          }
          return true;

        case 5:
          if (seekerType === 'COMPANY_CONTRACTOR') {
            return true;
          }
          for (let i = 0; i < education.length; i++) {
            const ed = education[i];
            if (!ed.school.trim() || !ed.course.trim() || !ed.dates.trim()) {
              setValidationError(`Please complete all fields (Institution, Course, Dates) for Education entry #${i + 1}.`);
              return false;
            }
          }
          return true;

        case 6:
          for (let i = 0; i < experience.length; i++) {
            const ex = experience[i];
            if (!ex.company.trim() || !ex.role.trim() || !ex.dates.trim()) {
              setValidationError(`Please complete Company, Role, and Dates for Experience entry #${i + 1}.`);
              return false;
            }
          }
          return true;

        case 7:
          for (let i = 0; i < certificates.length; i++) {
            const cert = certificates[i];
            if (!cert.name.trim() || !cert.date.trim()) {
              setValidationError(`Please complete Name and Date for Certification #${i + 1}.`);
              return false;
            }
          }
          for (let i = 0; i < projects.length; i++) {
            const pr = projects[i];
            if (!pr.title.trim() || !pr.description.trim()) {
              setValidationError(`Please complete Title and Description for Project #${i + 1}.`);
              return false;
            }
          }
          return true;

        default:
          return true;
      }
    } else {
      switch (currentStep) {
        case 1:
          if (!companyName.trim() || companyName.trim().length < 2) {
            setValidationError('Please enter your Company / Agency Name (minimum 2 characters).');
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
          if (!description.trim() || description.trim().length < 15) {
            setValidationError('Please enter a more detailed Company Description (minimum 15 characters).');
            return false;
          }
          if (employerWebsite.trim()) {
            const urlRegex = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/i;
            if (!urlRegex.test(employerWebsite.trim())) {
              setValidationError('Please enter a valid website URL (e.g. https://company.com).');
              return false;
            }
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
            setValidationError('Please select Country of operation.');
            return false;
          }
          if (!locationState.trim()) {
            setValidationError('Please enter Operating State / Province / Region.');
            return false;
          }
          if (!locationCity.trim()) {
            setValidationError('Please enter Town / City of Operation.');
            return false;
          }
          if (!hrContactName.trim() || hrContactName.trim().length < 2) {
            setValidationError('Please enter HR Contact Name (minimum 2 characters).');
            return false;
          }
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!hrEmail.trim() || !emailRegex.test(hrEmail.trim())) {
            setValidationError('Please enter a valid HR Contact Email address (e.g. hr@company.com).');
            return false;
          }
          const cleanHrPhone = hrPhone.replace(/\D/g, '');
          if (!hrPhone.trim() || cleanHrPhone.length < 6) {
            setValidationError('Please enter a valid HR Contact Phone Number (minimum 6 digits).');
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
              if (prof.seekerType === 'COMPANY_CONTRACTOR' || prof.isDualCapacity) {
                setSeekerType('COMPANY_CONTRACTOR');
                setContractorCompanyName(prof.companyName || '');
                setBusinessRegNumber(prof.businessRegNumber || '');
                setCrewSize(prof.crewSize?.toString() || '1');
              }
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
              if (Array.isArray(prof.skills)) {
                setSkills(prof.skills);
              }
              
              if (prof.isSkilledProfessional && prof.profession && prof.skilledProfession && prof.profession !== prof.skilledProfession) {
                setSeekerCategory('BOTH');
                setIsSkilledProfessional(true);
                const profSkill = prof.skilledProfession;
                if (skilledTradesList.includes(profSkill)) {
                  setTradeSpecialization(profSkill);
                } else if (profSkill) {
                  setTradeSpecialization('Other Skilled Trade / Artisan');
                  setCustomTrade(profSkill);
                }
              } else if (prof.isSkilledProfessional) {
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
              if (rawSalary.toLowerCase() === 'negotiable') {
                setIsSalaryNegotiable(true);
              } else if (rawSalary) {
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
      const isSkilled = seekerCategory === 'SKILLED_TRADE' || seekerCategory === 'BOTH';
      const resolvedTrade = tradeSpecialization === 'Other Skilled Trade / Artisan' ? customTrade : tradeSpecialization;
      const finalProfession = seekerCategory === 'SKILLED_TRADE'
        ? resolvedTrade
        : seekerCategory === 'BOTH'
        ? `${profession.trim()} & ${resolvedTrade}`
        : profession.trim();
      const finalSalary = isSalaryNegotiable
        ? 'Negotiable'
        : (salaryAmount.trim() 
            ? `${salaryCurrency} ${salaryAmount.trim()} / ${salaryFrequency.toLowerCase()}` 
            : expectedSalary);

      const finalPreferredIndustry = preferredIndustryOption === 'Others' ? preferredIndustryCustom.trim() : preferredIndustryOption;

      // Combine all entered skills, trades, and professions without duplicates
      const combinedSkillsSet = new Set<string>(skills.map(s => s.trim()).filter(Boolean));
      if (profession.trim()) combinedSkillsSet.add(profession.trim());
      if (isSkilled && resolvedTrade.trim()) combinedSkillsSet.add(resolvedTrade.trim());
      if (skillInput.trim()) combinedSkillsSet.add(skillInput.trim());

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
        remotePreference: workArrangement === 'Remote' ? 'REMOTE_ONLY' : 'FLEXIBLE',
        desiredJobTitle, 
        preferredIndustry: finalPreferredIndustry, 
        employmentType, 
        workArrangement, 
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
        skills: Array.from(combinedSkillsSet),
        seekerType,
        companyName: seekerType === 'COMPANY_CONTRACTOR' ? contractorCompanyName.trim() : null,
        businessRegNumber: seekerType === 'COMPANY_CONTRACTOR' ? businessRegNumber.trim() : null,
        crewSize: seekerType === 'COMPANY_CONTRACTOR' ? (parseInt(crewSize) || 1) : 1,
        isDualCapacity: seekerType === 'COMPANY_CONTRACTOR'
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
            <h2>Account & Identity Type</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.2rem' }}>
              Are you registering as an individual specialist or a registered company / contractor crew?
            </p>

            {/* Entity Type Selector (Individual vs Registered Company/Contractor) */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem', marginBottom: '1.5rem' }}>
              <div
                onClick={() => setSeekerType('INDIVIDUAL')}
                style={{
                  padding: '14px',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  border: seekerType === 'INDIVIDUAL' ? '2px solid #00F0FF' : '1px solid rgba(255,255,255,0.1)',
                  background: seekerType === 'INDIVIDUAL' ? 'rgba(0,240,255,0.12)' : 'rgba(255,255,255,0.03)',
                  transition: 'all 0.2s',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <Users className="w-4 h-4 text-cyan-400" />
                  <span style={{ fontWeight: 700, color: seekerType === 'INDIVIDUAL' ? '#00F0FF' : 'white', fontSize: '0.95rem' }}>
                    Individual Seeker
                  </span>
                </div>
                <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)', margin: 0 }}>
                  Solo professional, artisan, or graduate seeking employment
                </p>
              </div>

              <div
                onClick={() => setSeekerType('COMPANY_CONTRACTOR')}
                style={{
                  padding: '14px',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  border: seekerType === 'COMPANY_CONTRACTOR' ? '2px solid #C084FC' : '1px solid rgba(255,255,255,0.1)',
                  background: seekerType === 'COMPANY_CONTRACTOR' ? 'rgba(192,132,252,0.15)' : 'rgba(255,255,255,0.03)',
                  transition: 'all 0.2s',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <Building2 className="w-4 h-4 text-purple-400" />
                  <span style={{ fontWeight: 700, color: seekerType === 'COMPANY_CONTRACTOR' ? '#C084FC' : 'white', fontSize: '0.95rem' }}>
                    Company / Contractor
                  </span>
                </div>
                <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)', margin: 0 }}>
                  Cleaning, Delivery, Repairs, Artisan Crew seeking contracts & hiring
                </p>
              </div>
            </div>

            {/* Contractor-Specific Fields */}
            {seekerType === 'COMPANY_CONTRACTOR' && (
              <div
                style={{
                  padding: '16px',
                  borderRadius: '12px',
                  background: 'rgba(168, 85, 247, 0.08)',
                  border: '1px solid rgba(168, 85, 247, 0.3)',
                  marginBottom: '1.5rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <span style={{ color: '#C084FC', fontWeight: 700, fontSize: '0.95rem' }}>
                    🏢 Contractor & Dual-Capacity Company Details
                  </span>
                </div>
                <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)', marginBottom: '1rem' }}>
                  As a registered contractor company, your account is enabled with dual capacity to bid on commercial jobs and hire technicians.
                </p>

                <label style={{ color: 'white', display: 'block', marginBottom: '0.3rem', fontSize: '0.85rem' }}>
                  Company / Contractor Business Name <span style={{ color: '#00F0FF' }}>*</span>
                </label>
                <input
                  placeholder="e.g. Apex Cleaning & Facility Services Ltd"
                  value={contractorCompanyName}
                  onChange={e => setContractorCompanyName(e.target.value)}
                  className="input-field"
                  style={{ marginBottom: '0.8rem' }}
                />

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
                  <div>
                    <label style={{ color: 'white', display: 'block', marginBottom: '0.3rem', fontSize: '0.85rem' }}>
                      Registration / RC No (Optional)
                    </label>
                    <input
                      placeholder="e.g. RC-102948"
                      value={businessRegNumber}
                      onChange={e => setBusinessRegNumber(e.target.value)}
                      className="input-field"
                      style={{ marginBottom: 0 }}
                    />
                  </div>
                  <div>
                    <label style={{ color: 'white', display: 'block', marginBottom: '0.3rem', fontSize: '0.85rem' }}>
                      Crew / Fleet / Team Size
                    </label>
                    <input
                      type="number"
                      min="1"
                      placeholder="e.g. 5"
                      value={crewSize}
                      onChange={e => setCrewSize(e.target.value)}
                      className="input-field"
                      style={{ marginBottom: 0 }}
                    />
                  </div>
                </div>
              </div>
            )}

            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'white', marginTop: '1rem', marginBottom: '0.3rem' }}>
              {seekerType === 'COMPANY_CONTRACTOR' ? 'Principal Representative / Contact Details' : 'Personal Details'}
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.2rem' }}>
              {seekerType === 'COMPANY_CONTRACTOR' 
                ? 'Enter contact details for your authorized company lead specialist or director.'
                : 'Enter your basic contact and demographic details.'}
            </p>

            <input 
              placeholder={seekerType === 'COMPANY_CONTRACTOR' ? "Representative First Name *" : "First Name *"} 
              value={firstName} 
              onChange={e => setFirstName(e.target.value)} 
              className="input-field" 
            />
            <input 
              placeholder={seekerType === 'COMPANY_CONTRACTOR' ? "Representative Last Name *" : "Last Name *"} 
              value={lastName} 
              onChange={e => setLastName(e.target.value)} 
              className="input-field" 
            />
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
                <label style={{ color: 'white', display: 'block', marginBottom: '0.4rem', fontSize: '0.9rem' }}>Gender <span style={{ color: '#00F0FF' }}>*</span></label>
                <select value={gender} onChange={e => setGender(e.target.value)} className="input-field" style={{ marginBottom: 0 }}>
                  <option value="">Select Gender *</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Prefer not to say">Prefer not to say</option>
                </select>
              </div>
              <div>
                <label style={{ color: 'white', display: 'block', marginBottom: '0.4rem', fontSize: '0.9rem' }}>Marital Status <span style={{ color: '#00F0FF' }}>*</span></label>
                <select value={maritalStatus} onChange={e => setMaritalStatus(e.target.value)} className="input-field" style={{ marginBottom: 0 }}>
                  <option value="">Select Status *</option>
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
            <h2>Career Track, Professions & Multiple Skills</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.2rem' }}>
              Select your career track and add as many skills, professions, or trades as you have (e.g., a Business Administration graduate who is also a Plumber and Home Decorator).
            </p>

            {/* Career Category Selector */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.6rem', marginBottom: '1.5rem' }}>
              <button
                type="button"
                onClick={() => {
                  setSeekerCategory('PROFESSIONAL');
                  setIsSkilledProfessional(false);
                }}
                style={{
                  padding: '12px 10px',
                  borderRadius: '12px',
                  border: seekerCategory === 'PROFESSIONAL' ? '2px solid #00F0FF' : '1px solid rgba(255,255,255,0.15)',
                  background: seekerCategory === 'PROFESSIONAL' ? 'rgba(0,240,255,0.12)' : 'rgba(255,255,255,0.04)',
                  color: 'white',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.2s',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 'bold', fontSize: '0.88rem', color: seekerCategory === 'PROFESSIONAL' ? '#00F0FF' : 'white' }}>
                  <Briefcase size={16} /> Corporate / Office
                </div>
                <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)', marginTop: '4px' }}>
                  Business, Tech, Finance, Medical & Admin
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSeekerCategory('SKILLED_TRADE');
                  setIsSkilledProfessional(true);
                }}
                style={{
                  padding: '12px 10px',
                  borderRadius: '12px',
                  border: seekerCategory === 'SKILLED_TRADE' ? '2px solid #00F0FF' : '1px solid rgba(255,255,255,0.15)',
                  background: seekerCategory === 'SKILLED_TRADE' ? 'rgba(0,240,255,0.12)' : 'rgba(255,255,255,0.04)',
                  color: 'white',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.2s',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 'bold', fontSize: '0.88rem', color: seekerCategory === 'SKILLED_TRADE' ? '#00F0FF' : 'white' }}>
                  <Wrench size={16} /> Skilled Trade
                </div>
                <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)', marginTop: '4px' }}>
                  Plumber, Electrician, Decorator, Chef, etc.
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSeekerCategory('BOTH');
                  setIsSkilledProfessional(true);
                }}
                style={{
                  padding: '12px 10px',
                  borderRadius: '12px',
                  border: seekerCategory === 'BOTH' ? '2px solid #00F0FF' : '1px solid rgba(255,255,255,0.15)',
                  background: seekerCategory === 'BOTH' ? 'rgba(0,240,255,0.12)' : 'rgba(255,255,255,0.04)',
                  color: 'white',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.2s',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 'bold', fontSize: '0.88rem', color: seekerCategory === 'BOTH' ? '#00F0FF' : 'white' }}>
                  Both (Hybrid)
                </div>
                <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)', marginTop: '4px' }}>
                  Graduate / Professional + Skilled Trade(s)
                </div>
              </button>
            </div>

            {(seekerCategory === 'PROFESSIONAL' || seekerCategory === 'BOTH') && (
              <div>
                <label style={{ color: 'white', display: 'block', marginBottom: '0.4rem', fontSize: '0.9rem', fontWeight: 500 }}>
                  Corporate / Academic Profession <span style={{ color: '#00F0FF' }}>*</span>
                </label>
                <input 
                  placeholder="e.g. Business Administration, Financial Analyst, Software Engineer, Nurse" 
                  value={profession} 
                  onChange={e => setProfession(e.target.value)} 
                  className="input-field" 
                />
              </div>
            )}

            {(seekerCategory === 'SKILLED_TRADE' || seekerCategory === 'BOTH') ? (
              <div style={{ padding: '1rem', background: 'rgba(0,240,255,0.04)', borderRadius: '12px', border: '1px dashed rgba(0,240,255,0.3)', marginBottom: '1.2rem' }}>
                <label style={{ color: '#00F0FF', display: 'block', fontWeight: 600, marginBottom: '0.4rem', fontSize: '0.9rem' }}>
                  Primary Trade / Craft Specialization <span style={{ color: '#00F0FF' }}>*</span>
                </label>
                <select 
                  value={tradeSpecialization} 
                  onChange={e => {
                    const val = e.target.value;
                    setTradeSpecialization(val);
                    if (val !== 'Other Skilled Trade / Artisan' && !skills.includes(val)) {
                      setSkills([...skills, val]);
                    }
                  }} 
                  className="input-field"
                  style={{ marginBottom: tradeSpecialization === 'Other Skilled Trade / Artisan' ? '0.8rem' : 0 }}
                >
                  {skilledTradesList.map(trade => (
                    <option key={trade} value={trade}>{trade}</option>
                  ))}
                </select>

                {tradeSpecialization === 'Other Skilled Trade / Artisan' && (
                  <input 
                    placeholder="Specify your trade (e.g. Home Decorator, Master Goldsmith, Locksmith) *" 
                    value={customTrade} 
                    onChange={e => setCustomTrade(e.target.value)} 
                    className="input-field" 
                    style={{ marginBottom: 0 }}
                  />
                )}
              </div>
            ) : null}

            {/* Multi-Skill & Additional Professions Builder */}
            <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid rgba(0,240,255,0.25)', marginBottom: '1.2rem' }}>
              <label style={{ color: '#00F0FF', display: 'block', marginBottom: '0.35rem', fontSize: '0.92rem', fontWeight: 600 }}>
                 Multiple Skills, Trades & Additional Professions
              </label>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', margin: '0 0 0.75rem 0' }}>
                Add all your skills and vocations! For example: <strong>Plumber</strong>, <strong>Home Decorator</strong>, <strong>Business Administration</strong>, <strong>Electrician</strong>, etc.
              </p>

              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <input
                  placeholder="Type a skill or trade (e.g. Plumber, Home Decorator, Accounting)..."
                  value={skillInput}
                  onChange={e => setSkillInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && skillInput.trim()) {
                      e.preventDefault();
                      if (!skills.includes(skillInput.trim())) {
                        setSkills([...skills, skillInput.trim()]);
                      }
                      setSkillInput('');
                    }
                  }}
                  className="input-field"
                  style={{ marginBottom: 0, flex: 1 }}
                />
                <button
                  type="button"
                  onClick={() => {
                    if (skillInput.trim() && !skills.includes(skillInput.trim())) {
                      setSkills([...skills, skillInput.trim()]);
                      setSkillInput('');
                    }
                  }}
                  className="btn-primary"
                  style={{ whiteSpace: 'nowrap', padding: '0 1.2rem' }}
                >
                  + Add Skill
                </button>
              </div>

              {/* Quick-add popular multi-skills / trades */}
              <div style={{ marginBottom: skills.length > 0 ? '0.8rem' : 0 }}>
                <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: '0.4rem' }}>
                  Quick Add Skills & Trades (click to add):
                </span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {[
                    'Plumber',
                    'Home Decorator',
                    'Business Administration',
                    'Electrician',
                    'Painter & Decorator',
                    'Carpenter',
                    'Project Management',
                    'Customer Service',
                    'Sales & Marketing',
                    'Software Development',
                    'Data Analysis',
                    'HVAC Technician',
                    'Welder',
                    'Professional Driver',
                    'Chef & Catering'
                  ].map(preset => {
                    const isSelected = skills.includes(preset);
                    return (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            setSkills(skills.filter(s => s !== preset));
                          } else {
                            setSkills([...skills, preset]);
                          }
                        }}
                        style={{
                          padding: '4px 10px',
                          borderRadius: '999px',
                          fontSize: '0.76rem',
                          cursor: 'pointer',
                          border: isSelected ? '1px solid #00F0FF' : '1px solid rgba(255,255,255,0.15)',
                          background: isSelected ? 'rgba(0,240,255,0.2)' : 'rgba(255,255,255,0.05)',
                          color: isSelected ? '#00F0FF' : 'rgba(255,255,255,0.8)',
                        }}
                      >
                        {isSelected ? `✓ ${preset}` : `+ ${preset}`}
                      </button>
                    );
                  })}
                </div>
              </div>

              {skills.length > 0 && (
                <div>
                  <span style={{ fontSize: '0.78rem', color: '#00F0FF', fontWeight: 600, display: 'block', marginBottom: '0.4rem' }}>
                    Your Selected Skills & Professions ({skills.length}):
                  </span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {skills.map((sk, i) => (
                      <span
                        key={i}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '5px 12px',
                          borderRadius: '999px',
                          background: 'rgba(0,240,255,0.16)',
                          border: '1px solid #00F0FF',
                          color: 'white',
                          fontSize: '0.82rem',
                          fontWeight: 500,
                        }}
                      >
                        {sk}
                        <button
                          type="button"
                          onClick={() => setSkills(skills.filter((_, idx) => idx !== i))}
                          style={{ background: 'none', border: 'none', color: '#fca5a5', cursor: 'pointer', padding: 0, fontWeight: 'bold', fontSize: '0.9rem' }}
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <label style={{ color: 'white', display: 'block', marginBottom: '0.4rem', fontSize: '0.9rem', fontWeight: 500 }}>
              Professional / Trade Headline <span style={{ color: '#00F0FF' }}>*</span>
            </label>
            <input 
              placeholder={seekerCategory === 'SKILLED_TRADE' ? "e.g. Certified Plumber & Home Decorator | 8+ Yrs Experience" : "e.g. Business Administrator & Certified Plumber | Multi-Skilled Specialist"} 
              value={headline} 
              onChange={e => setHeadline(e.target.value)} 
              className="input-field" 
            />

            <label style={{ color: 'white', display: 'block', marginBottom: '0.4rem', fontSize: '0.9rem' }}>
              {seekerCategory === 'SKILLED_TRADE' ? "Trade Profile & Practical Expertise" : "Professional & Multi-Skill Summary (About Me)"}
            </label>
            <textarea 
              placeholder={seekerCategory === 'SKILLED_TRADE' 
                ? "Describe your hands-on experience, equipment/tools you operate, apprenticeships completed, and types of projects handled..." 
                : "Summarize your career highlights, academic background, practical trades, and key accomplishments..."} 
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
            <h2>{seekerType === 'COMPANY_CONTRACTOR' ? 'Location & Operating Base' : 'Location & Residency'}</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.2rem' }}>
              {seekerType === 'COMPANY_CONTRACTOR'
                ? 'Where is your company located and where does it operate?'
                : 'Where do you currently reside and hold citizenship?'}
            </p>

            {/* Country of operation or Resident Country */}
            <SearchableCountrySelect
              label={seekerType === 'COMPANY_CONTRACTOR' ? 'Country of operation' : 'Resident Country'}
              value={residenceCountry}
              required
              placeholder={seekerType === 'COMPANY_CONTRACTOR' ? 'Search or select country of operation...' : 'Search or select country where you live...'}
              onChange={(c) => {
                setResidenceCountry(c);
                setResidenceState('');
                // If preferredWorkCountry is not set yet, set default salary currency to this country
                if (!preferredWorkCountry) {
                  setSalaryCurrency(getCurrencySymbol(c));
                }
              }}
            />

            {/* Citizenship Country with Search (only for individual seekers) */}
            {seekerType !== 'COMPANY_CONTRACTOR' && (
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
            )}

            {/* State / Province Dropdown auto-populated from countryStates */}
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ color: 'white', display: 'block', marginBottom: '0.4rem', fontSize: '0.9rem', fontWeight: 500 }}>
                {seekerType === 'COMPANY_CONTRACTOR' ? 'Operating State / Province / Region' : 'Resident State / Province / Region'} <span style={{ color: '#00F0FF' }}>*</span>
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
                      placeholder={seekerType === 'COMPANY_CONTRACTOR' ? "Type operating state or region manually *" : "Type state or region manually *"} 
                      value={residenceState} 
                      onChange={e => setResidenceState(e.target.value)} 
                      className="input-field" 
                      style={{ marginBottom: 0 }}
                    />
                  )}
                </>
              ) : (
                <input 
                  placeholder={residenceCountry ? (seekerType === 'COMPANY_CONTRACTOR' ? "Enter Operating State / Province / Region *" : "Enter State / Province / Region *") : (seekerType === 'COMPANY_CONTRACTOR' ? "Select Country of operation first" : "Select Resident Country first")} 
                  value={residenceState} 
                  onChange={e => setResidenceState(e.target.value)} 
                  className="input-field" 
                  disabled={!residenceCountry}
                  style={{ marginBottom: 0 }}
                />
              )}
            </div>

            <label style={{ color: 'white', display: 'block', marginBottom: '0.25rem', fontSize: '0.9rem', fontWeight: 600 }}>
              {seekerType === 'COMPANY_CONTRACTOR' ? 'Town / City of Corporate Operation' : 'Residential City / Town (Where you currently live)'} <span style={{ color: '#00F0FF' }}>*</span>
            </label>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', margin: '0 0 0.5rem 0' }}>
              {seekerType === 'COMPANY_CONTRACTOR' 
                ? 'Enter the official city, town, or municipality where your contracting business or company operates.'
                : 'Enter the specific city, town, or municipality where you currently live and reside.'}
            </p>
            <input 
              placeholder={seekerType === 'COMPANY_CONTRACTOR' ? "e.g. Dallas, Ikeja, Manchester, Calgary" : "e.g. Manchester, Houston, Nairobi, Toronto, Lagos"} 
              value={residenceCity} 
              onChange={e => setResidenceCity(e.target.value)} 
              className="input-field" 
            />

            {/* Preferred Work Mode (Remote, Onsite, Hybrid) & Relocation */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', marginTop: '1.2rem', padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid rgba(0,240,255,0.2)' }}>
              <label style={{ color: '#00F0FF', fontWeight: 600, fontSize: '0.92rem' }}>
                 Preferred Work Mode (Remote, Onsite, or Hybrid)
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.6rem' }}>
                {(['Remote', 'Onsite', 'Hybrid'] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => {
                      setWorkArrangement(mode);
                      setIsOpenToRemote(mode === 'Remote' || mode === 'Hybrid');
                    }}
                    style={{
                      padding: '10px',
                      borderRadius: '10px',
                      border: workArrangement === mode ? '2px solid #00F0FF' : '1px solid rgba(255,255,255,0.15)',
                      background: workArrangement === mode ? 'rgba(0,240,255,0.16)' : 'rgba(255,255,255,0.04)',
                      color: workArrangement === mode ? '#00F0FF' : 'white',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                    }}
                  >
                    {mode === 'Remote' ? ' Remote' : mode === 'Onsite' ? ' Onsite' : 'Hybrid'}
                  </button>
                ))}
              </div>

              <label style={{ color: 'white', display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer', fontSize: '0.95rem', marginTop: '0.4rem' }}>
                <input 
                  type="checkbox" 
                  checked={willingToRelocate} 
                  onChange={e => setWillingToRelocate(e.target.checked)} 
                  style={{ width: '18px', height: '18px', accentColor: '#00F0FF' }}
                />
                <span> Willing to Relocate for the right role</span>
              </label>
            </div>
          </div>
        );
      case 4:
        return (
          <div className="fly-in">
            <h2>Job Preferences & Compensation</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.2rem' }}>
              Specify your target role, work arrangement (Remote, Onsite, or Hybrid), and desired pay structure.
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
                <label style={{ color: 'white', display: 'block', marginBottom: '0.4rem', fontSize: '0.9rem', fontWeight: 600 }}>Work Arrangement (Remote / Onsite / Hybrid)</label>
                <select
                  value={workArrangement}
                  onChange={e => {
                    setWorkArrangement(e.target.value);
                    setIsOpenToRemote(e.target.value === 'Remote' || e.target.value === 'Hybrid');
                  }}
                  className="input-field"
                  style={{ marginBottom: 0 }}
                >
                  <option value="Remote">Remote</option>
                  <option value="Onsite">Onsite</option>
                  <option value="Hybrid">Hybrid</option>
                </select>
              </div>
            </div>

            {/* Preferred Work Country with Search */}
            <SearchableCountrySelect
              label="Preferred Work Country"
              value={preferredWorkCountry}
              required
              includeGlobal={true}
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

            {/* Flexible Compensation Calculation: Per Hour, Daily, Monthly, Annually or Negotiable */}
            <div style={{ marginTop: '0.8rem', padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <label style={{ color: 'white', fontWeight: 600, fontSize: '0.95rem', margin: 0 }}>
                  Expected / Desired Compensation <span style={{ color: '#00F0FF' }}>*</span>
                </label>
                <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', color: isSalaryNegotiable ? '#00F0FF' : 'var(--text-secondary)', cursor: 'pointer', userSelect: 'none' }}>
                  <input
                    type="checkbox"
                    checked={isSalaryNegotiable}
                    onChange={e => setIsSalaryNegotiable(e.target.checked)}
                    style={{ cursor: 'pointer', accentColor: '#00F0FF' }}
                  />
                  Mark as Negotiable
                </label>
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', margin: '0 0 0.8rem 0' }}>
                {isSalaryNegotiable
                  ? 'Your compensation expectation will be displayed as "Negotiable" (open to quote/discussion) to employers and clients.'
                  : 'Select how you prefer to be compensated (per hour, daily, monthly, or annually). Currency defaults to your preferred work country or USD for global/remote roles.'}
              </p>

              {isSalaryNegotiable ? (
                <div style={{
                  padding: '0.9rem 1.2rem',
                  borderRadius: '10px',
                  background: 'rgba(0, 240, 255, 0.08)',
                  border: '1px dashed rgba(0, 240, 255, 0.35)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  color: '#00F0FF',
                  fontSize: '0.9rem',
                  fontWeight: 500
                }}>
                  <span style={{ fontSize: '1.2rem' }}>🤝</span>
                  <span>Compensation marked as <strong>Negotiable</strong> (Open to discussion / contract quote upon offer)</span>
                </div>
              ) : (
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
              )}
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
                  <div style={{ fontWeight: 'bold', color: businessType === 'DIRECT_EMPLOYER' ? '#00f0ff' : 'white' }}> Direct Company</div>
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
                  <div style={{ fontWeight: 'bold', color: businessType === 'RECRUITING_AGENCY' ? '#00f0ff' : 'white' }}> Recruiting Agency</div>
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

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <label style={{ color: 'white', fontSize: '0.9rem', fontWeight: 500 }}>
                {businessType === 'RECRUITING_AGENCY' ? "Agency Description & Track Record *" : "Company Description *"}
              </label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  type="button"
                  disabled={generatingAiCompany}
                  onClick={async () => {
                    if (!companyName.trim()) {
                      alert('Please enter your Company / Agency Name first.');
                      return;
                    }
                    setGeneratingAiCompany(true);
                    try {
                      const token = localStorage.getItem('token');
                      const ind = businessType === 'RECRUITING_AGENCY'
                        ? (agencyPrimaryIndustryOption === 'Others' ? agencyPrimaryIndustryCustom : agencyPrimaryIndustryOption)
                        : (employerIndustryOption === 'Others' ? employerIndustryCustom : employerIndustryOption);
                      const res = await fetch('/api/ai/company-profile/generate', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                        body: JSON.stringify({
                          companyName,
                          industry: ind,
                          businessType,
                          companySize,
                          foundedYear,
                          locationCountry,
                          locationCity,
                          website: employerWebsite,
                          description,
                        }),
                      });
                      if (res.ok) {
                        const data = await res.json();
                        if (data.description) setDescription(data.description);
                        if (data.mission) setEmployerMission(data.mission);
                        if (data.vision) setEmployerVision(data.vision);
                        if (data.culture) setEmployerCulture(data.culture);
                      } else {
                        alert('Could not generate AI profile right now.');
                      }
                    } catch (e) {
                      console.error(e);
                    } finally {
                      setGeneratingAiCompany(false);
                    }
                  }}
                  style={{
                    padding: '5px 12px',
                    borderRadius: '8px',
                    border: '1px solid #00F0FF',
                    background: 'rgba(0,240,255,0.14)',
                    color: '#00F0FF',
                    fontSize: '0.78rem',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                  }}
                >
                  {generatingAiCompany ? ' Generating...' : 'AI Build Profile'}
                </button>
                {description.trim() && (
                  <button
                    type="button"
                    onClick={() => {
                      const ind = businessType === 'RECRUITING_AGENCY'
                        ? (agencyPrimaryIndustryOption === 'Others' ? agencyPrimaryIndustryCustom : agencyPrimaryIndustryOption)
                        : (employerIndustryOption === 'Others' ? employerIndustryCustom : employerIndustryOption);
                      const content = [
                        `======================================================`,
                        `   OFFICIAL AI-BUILT ${businessType === 'RECRUITING_AGENCY' ? 'AGENCY' : 'COMPANY'} PROFILE`,
                        `======================================================`,
                        `Organization: ${companyName || 'Organization'}`,
                        `Type: ${businessType === 'RECRUITING_AGENCY' ? 'Recruiting Agency' : 'Direct Employer'}`,
                        `Industry: ${ind || 'General'}`,
                        `Team Size: ${companySize} | Founded: ${foundedYear}`,
                        `Website: ${employerWebsite || 'N/A'}`,
                        `Remote Friendly: ${employerRemoteFriendly ? 'Yes' : 'No'}`,
                        ``,
                        `EXECUTIVE OVERVIEW:`,
                        description,
                        employerMission ? `\nMISSION:\n${employerMission}` : '',
                        employerVision ? `\nVISION:\n${employerVision}` : '',
                        employerCulture ? `\nWORKPLACE CULTURE:\n${employerCulture}` : '',
                        ``,
                        `Generated via JobHub Global Talent Platform`
                      ].filter(Boolean).join('\n');
                      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `${(companyName || 'Company').replace(/\s+/g, '_')}_AI_Profile.txt`;
                      a.click();
                      URL.revokeObjectURL(url);
                    }}
                    style={{
                      padding: '5px 12px',
                      borderRadius: '8px',
                      border: '1px solid #10b981',
                      background: 'rgba(16,185,129,0.15)',
                      color: '#34d399',
                      fontSize: '0.78rem',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                    }}
                  >
                    Download AI Profile
                  </button>
                )}
              </div>
            </div>
            <textarea 
              placeholder={businessType === 'RECRUITING_AGENCY' 
                ? "Describe your recruiting expertise, client placement record, and hiring specialties..." 
                : "Briefly describe your company culture, products/services, and mission..."} 
              value={description} 
              onChange={e => setDescription(e.target.value)} 
              className="input-field" 
              rows={4} 
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
                <span style={{ fontWeight: 600 }}> Remote Friendly: Our organization is hiring remote / distributed workers</span>
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
              label="Country of operation"
              value={locationCountry}
              required
              placeholder="Search or select country of operation..."
              onChange={(c) => {
                setLocationCountry(c);
                setLocationState('');
              }}
            />

            {/* State auto populated from countryStates */}
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ color: 'white', display: 'block', marginBottom: '0.4rem', fontSize: '0.9rem', fontWeight: 500 }}>
                Operating State / Province / Region <span style={{ color: '#00F0FF' }}>*</span>
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
                    <option value="">Select Operating State</option>
                    {countryStates[locationCountry].map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                    <option value="OTHER_STATE">Other / Enter Manually</option>
                  </select>
                  {(!locationState || !countryStates[locationCountry].includes(locationState)) && (
                    <input 
                      placeholder="Enter Operating State Manually *" 
                      value={locationState} 
                      onChange={e => setLocationState(e.target.value)} 
                      className="input-field" 
                      style={{ marginBottom: 0 }}
                    />
                  )}
                </>
              ) : (
                <input 
                  placeholder={locationCountry ? "Operating State / Province / Region *" : "Select Country of operation first"} 
                  value={locationState} 
                  onChange={e => setLocationState(e.target.value)} 
                  className="input-field" 
                  disabled={!locationCountry}
                  style={{ marginBottom: 0 }}
                />
              )}
            </div>

            <label style={{ color: 'white', display: 'block', marginBottom: '0.4rem', fontSize: '0.9rem', fontWeight: 500 }}>
              Town / City of Operation <span style={{ color: '#00F0FF' }}>*</span>
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

  const isCompanyContractor = user?.role === 'JOB_SEEKER' && seekerType === 'COMPANY_CONTRACTOR';
  const totalSteps = user?.role === 'JOB_SEEKER' ? (isCompanyContractor ? 7 : 8) : 3;
  const displayStep = isCompanyContractor && step > 5 ? step - 1 : step;
  const isLastStep = user?.role === 'JOB_SEEKER' ? step === 8 : step === 3;

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
          Step {displayStep} of {totalSteps}
        </p>
        
        {validationError && (
          <div style={{ padding: '0.8rem 1rem', background: 'rgba(239, 68, 68, 0.2)', border: '1px solid rgba(239, 68, 68, 0.5)', borderRadius: '10px', color: '#fca5a5', marginBottom: '1.5rem', fontSize: '0.9rem', textAlign: 'center' }}>
              {validationError}
          </div>
        )}

        <div style={{ margin: '1.5rem 0' }}>
          {user?.role === 'JOB_SEEKER' ? renderSeekerSteps() : renderEmployerSteps()}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2rem' }}>
          {step > 1 ? (
            <button 
              className="btn-primary" 
              style={{ background: 'transparent', border: '1px solid #00f0ff' }} 
              onClick={() => { 
                setValidationError(''); 
                if (isCompanyContractor && step === 6) {
                  setStep(4);
                } else {
                  setStep(step - 1);
                }
              }}
            >
              Back
            </button>
          ) : <div />}
          
          {!isLastStep ? (
            <button 
              className="btn-primary" 
              onClick={() => {
                if (validateCurrentStep(step)) {
                  if (isCompanyContractor && step === 4) {
                    setStep(6);
                  } else {
                    setStep(step + 1);
                  }
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
