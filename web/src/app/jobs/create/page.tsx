'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { UploadCloud, FileText, CheckCircle2, AlertCircle, Plus, Trash2, DollarSign, Clock, Calendar } from 'lucide-react';

const COUNTRY_CURRENCY_MAP: Record<string, { symbol: string; code: string }> = {
  "Nigeria": { symbol: "₦", code: "NGN" },
  "United States": { symbol: "$", code: "USD" },
  "United Kingdom": { symbol: "£", code: "GBP" },
  "Canada": { symbol: "C$", code: "CAD" },
  "Ghana": { symbol: "GH₵", code: "GHS" },
  "Kenya": { symbol: "KSh", code: "KES" },
  "South Africa": { symbol: "R", code: "ZAR" },
  "Australia": { symbol: "A$", code: "AUD" },
  "Germany": { symbol: "€", code: "EUR" },
  "France": { symbol: "€", code: "EUR" },
  "Italy": { symbol: "€", code: "EUR" },
  "Spain": { symbol: "€", code: "EUR" },
  "Netherlands": { symbol: "€", code: "EUR" },
  "Belgium": { symbol: "€", code: "EUR" },
  "Ireland": { symbol: "€", code: "EUR" },
  "Switzerland": { symbol: "CHF", code: "CHF" },
  "India": { symbol: "₹", code: "INR" },
  "United Arab Emirates": { symbol: "AED", code: "AED" },
  "Saudi Arabia": { symbol: "SR", code: "SAR" },
  "China": { symbol: "¥", code: "CNY" },
  "Japan": { symbol: "¥", code: "JPY" },
  "Brazil": { symbol: "R$", code: "BRL" },
  "Egypt": { symbol: "EGP", code: "EGP" },
};

const POPULAR_CURRENCIES = [
  { symbol: "₦", label: "₦ NGN - Nigerian Naira" },
  { symbol: "$", label: "$ USD - US Dollar" },
  { symbol: "£", label: "£ GBP - British Pound" },
  { symbol: "€", label: "€ EUR - Euro" },
  { symbol: "C$", label: "C$ CAD - Canadian Dollar" },
  { symbol: "GH₵", label: "GH₵ GHS - Ghanaian Cedi" },
  { symbol: "KSh", label: "KSh KES - Kenyan Shilling" },
  { symbol: "R", label: "R ZAR - South African Rand" },
  { symbol: "A$", label: "A$ AUD - Australian Dollar" },
  { symbol: "₹", label: "₹ INR - Indian Rupee" },
  { symbol: "AED", label: "AED - UAE Dirham" },
  { symbol: "SR", label: "SR - Saudi Riyal" },
  { symbol: "CHF", label: "CHF - Swiss Franc" },
  { symbol: "¥", label: "¥ JPY/CNY - Yen / Yuan" },
];

const PAYMENT_FREQUENCIES = [
  { id: 'hour', label: 'Per Hour', suffix: '/ hour' },
  { id: 'day', label: 'Daily', suffix: '/ day' },
  { id: 'month', label: 'Monthly', suffix: '/ month' },
  { id: 'year', label: 'Yearly', suffix: '/ year' },
] as const;

interface ParsedJob {
  title: string;
  description: string;
  location?: string;
  salary?: string;
  isRemote?: boolean;
}

export default function CreateJobPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'single' | 'bulk'>('single');

  // Single job state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [currencySymbol, setCurrencySymbol] = useState('$');
  const [salaryAmount, setSalaryAmount] = useState('');
  const [salaryFrequency, setSalaryFrequency] = useState<'hour' | 'day' | 'month' | 'year'>('month');
  const [employerCountry, setEmployerCountry] = useState('');
  const [isRemote, setIsRemote] = useState(false);
  const [workMode, setWorkMode] = useState<'REMOTE' | 'ONSITE' | 'HYBRID'>('ONSITE');
  const [requiresCoverLetter, setRequiresCoverLetter] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [generatingAi, setGeneratingAi] = useState(false);

  // Bulk import state
  const [bulkText, setBulkText] = useState('');
  const [parsedJobs, setParsedJobs] = useState<ParsedJob[]>([]);
  const [bulkLoading, setBulkLoading] = useState(false);

  // Load employer's registered country and currency
  useEffect(() => {
    const fetchEmployer = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;
      try {
        const res = await fetch('/api/profiles/employer', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const emp = await res.json();
          if (emp?.locationCountry) {
            setEmployerCountry(emp.locationCountry);
            const mapping = COUNTRY_CURRENCY_MAP[emp.locationCountry];
            if (mapping) {
              setCurrencySymbol(mapping.symbol);
            }
          }
        }
      } catch (e) {
        // Fallback silently to default
      }
    };
    fetchEmployer();
  }, []);

  const getFormattedSalary = () => {
    const trimmed = salaryAmount.trim();
    if (!trimmed) return '';
    const freq = PAYMENT_FREQUENCIES.find(f => f.id === salaryFrequency)?.suffix || '/ month';
    return `${currencySymbol} ${trimmed} ${freq}`;
  };

  const handleGenerateAiDescription = async () => {
    if (!title) {
      setError('Please enter a Job Title first to generate a description.');
      return;
    }
    setGeneratingAi(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/ai/job-description/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title,
          location,
          isRemote: workMode === 'REMOTE',
          salary: getFormattedSalary() || 'Competitive',
          country: employerCountry,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setDescription(data.description);
      } else {
        setError('Failed to generate description.');
      }
    } catch (err: any) {
      setError('Failed to generate description.');
    } finally {
      setGeneratingAi(false);
    }
  };

  const handleCreateJob = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('You must be logged in as an Employer to post a job.');
      }

      const finalSalary = getFormattedSalary() || 'Competitive';

      const res = await fetch('/api/jobs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title,
          description,
          location: location || (workMode === 'REMOTE' ? 'Remote' : 'Onsite'),
          salary: finalSalary,
          isRemote: workMode === 'REMOTE',
          workMode,
          requiresCoverLetter,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || 'Failed to create job');
      }

      setSuccess('Job vacancy posted successfully! Redirecting...');
      setTimeout(() => {
        router.push('/jobs');
      }, 1000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Parse CSV or JSON data
  const parseBulkInput = (content: string) => {
    const trimmed = content.trim();
    if (!trimmed) {
      setParsedJobs([]);
      return;
    }

    try {
      // Check if it's JSON
      if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
        const json = JSON.parse(trimmed);
        if (Array.isArray(json)) {
          const valid = json.map(item => ({
            title: item.title || item.Title || item.role || item.Role || '',
            description: item.description || item.Description || item.desc || 'Comprehensive role responsibilities and requirements.',
            location: item.location || item.Location || (item.isRemote ? 'Remote' : 'On-site'),
            salary: item.salary || item.Salary || 'Negotiable',
            isRemote: !!item.isRemote || (item.location && item.location.toLowerCase().includes('remote'))
          })).filter(j => j.title.trim().length > 0);
          setParsedJobs(valid);
          return;
        }
      }
    } catch (e) {
      // Not valid JSON, proceed to CSV parse
    }

    // CSV Parse
    const lines = trimmed.split('\n').map(l => l.trim()).filter(Boolean);
    const jobs: ParsedJob[] = [];

    // Check if first line is header
    let startIndex = 0;
    if (lines.length > 0 && (lines[0].toLowerCase().includes('title') || lines[0].toLowerCase().includes('role'))) {
      startIndex = 1;
    }

    for (let i = startIndex; i < lines.length; i++) {
      // Simple CSV split handling quotes
      const parts = lines[i].split(',').map(p => p.trim().replace(/^["']|["']$/g, ''));
      if (parts.length > 0 && parts[0]) {
        const titleVal = parts[0];
        const locationVal = parts[1] || 'Remote';
        const salaryVal = parts[2] || 'Competitive';
        const remoteVal = (parts[3] || '').toLowerCase().includes('true') || (parts[3] || '').toLowerCase().includes('yes') || locationVal.toLowerCase().includes('remote');
        const descVal = parts[4] || `${titleVal} vacancy. Responsible for delivering key business outcomes, team collaboration, and client success.`;

        jobs.push({
          title: titleVal,
          location: locationVal,
          salary: salaryVal,
          isRemote: remoteVal,
          description: descVal
        });
      }
    }

    setParsedJobs(jobs);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setBulkText(content);
      parseBulkInput(content);
    };
    reader.readAsText(file);
  };

  const loadSampleTemplate = () => {
    const sample = `Title,Location,Salary,Remote,Description
Senior Flutter Engineer,Remote,$120k - $150k,Yes,Lead development of cross-platform mobile apps using Flutter and Dart.
Full Stack AI Developer,San Francisco CA,$140k - $180k,Yes,Build generative AI workflows and modern Next.js/NestJS web applications.
Talent Acquisition Specialist,New York NY,$80k - $100k,No,Source and screen top engineering and marketing candidates for high-growth teams.`;
    setBulkText(sample);
    parseBulkInput(sample);
  };

  const handleBulkSubmit = async () => {
    if (parsedJobs.length === 0) {
      setError('Please provide at least one valid job role to import.');
      return;
    }

    setBulkLoading(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Please log in first.');

      const res = await fetch('/api/jobs/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          jobs: parsedJobs
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to bulk import jobs.');
      }

      setSuccess(`🎉 Successfully posted ${data.count} vacancy roles to the Job Board!`);
      setTimeout(() => {
        router.push('/jobs');
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Failed to bulk import jobs.');
    } finally {
      setBulkLoading(false);
    }
  };

  return (
    <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '780px', padding: '2.5rem 2rem' }}>
        <h1 style={{ fontSize: '2.2rem', fontWeight: 800, textAlign: 'center', marginBottom: '0.5rem' }}>
          Post Job <span className="text-gradient">Vacancies</span>
        </h1>
        <p style={{ color: 'var(--text-secondary)', textAlign: 'center', marginBottom: '1.5rem' }}>
          Publish new open roles individually or bulk import vacancy lists
        </p>

        {/* Tab Toggle */}
        <div style={{ display: 'flex', gap: '0.75rem', background: 'rgba(255,255,255,0.05)', padding: '6px', borderRadius: '12px', marginBottom: '2rem' }}>
          <button
            type="button"
            onClick={() => setActiveTab('single')}
            style={{
              flex: 1,
              padding: '10px 16px',
              borderRadius: '8px',
              border: 'none',
              background: activeTab === 'single' ? '#00f0ff' : 'transparent',
              color: activeTab === 'single' ? '#000' : '#fff',
              fontWeight: 'bold',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'all 0.2s'
            }}
          >
            <FileText className="w-4 h-4" /> Single Job Posting
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('bulk')}
            style={{
              flex: 1,
              padding: '10px 16px',
              borderRadius: '8px',
              border: 'none',
              background: activeTab === 'bulk' ? '#00f0ff' : 'transparent',
              color: activeTab === 'bulk' ? '#000' : '#fff',
              fontWeight: 'bold',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'all 0.2s'
            }}
          >
            <UploadCloud className="w-4 h-4" /> Import / Bulk Upload Vacancies
          </button>
        </div>

        {error && (
          <div style={{ backgroundColor: 'rgba(255, 0, 0, 0.15)', border: '1px solid rgba(255,0,0,0.4)', color: '#ff6b6b', padding: '1rem', borderRadius: '10px', marginBottom: '1.5rem', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.4)', color: '#34d399', padding: '1rem', borderRadius: '10px', marginBottom: '1.5rem', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {activeTab === 'single' ? (
          <form onSubmit={handleCreateJob} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Job Title</label>
              <input 
                type="text" 
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                style={{ width: '100%', padding: '0.9rem', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.1)', backgroundColor: 'rgba(255, 255, 255, 0.05)', color: 'white', fontSize: '1rem', outline: 'none' }}
                placeholder="e.g. Senior AI Engineer"
              />
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <label style={{ display: 'block', color: 'var(--text-secondary)' }}>Job Description</label>
                <button 
                  type="button" 
                  onClick={handleGenerateAiDescription} 
                  disabled={generatingAi}
                  style={{ background: 'transparent', border: '1px solid #00f0ff', color: '#00f0ff', padding: '4px 12px', borderRadius: '12px', cursor: 'pointer', fontSize: '0.85rem' }}
                >
                  {generatingAi ? 'Generating...' : '✨ Generate with AI'}
                </button>
              </div>
              <textarea 
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                rows={5}
                style={{ width: '100%', padding: '0.9rem', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.1)', backgroundColor: 'rgba(255, 255, 255, 0.05)', color: 'white', fontSize: '1rem', outline: 'none', resize: 'vertical' }}
                placeholder="Describe the responsibilities, requirements, and benefits..."
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Location</label>
              <input 
                type="text" 
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                style={{ width: '100%', padding: '0.9rem', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.1)', backgroundColor: 'rgba(255, 255, 255, 0.05)', color: 'white', fontSize: '1rem', outline: 'none' }}
                placeholder="e.g. Lagos, Nigeria or San Francisco, CA"
              />
            </div>

            {/* Salary Range & Compensation with Country Currency & Payment Frequency */}
            <div style={{ padding: '1.25rem', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '14px', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <label style={{ color: '#00f0ff', fontWeight: 600, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <DollarSign className="w-4 h-4" /> Salary Range & Compensation *
                </label>
                {employerCountry && (
                  <span style={{ fontSize: '0.8rem', padding: '3px 10px', borderRadius: '10px', background: 'rgba(0, 240, 255, 0.12)', color: '#00f0ff', border: '1px solid rgba(0, 240, 255, 0.3)' }}>
                    Registered in: <strong>{employerCountry}</strong> ({currencySymbol})
                  </span>
                )}
              </div>

              {/* Currency + Amount row */}
              <div style={{ display: 'grid', gridTemplateColumns: 'minmax(140px, 1.2fr) 2fr', gap: '0.75rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>Currency</label>
                  <select
                    value={currencySymbol}
                    onChange={(e) => setCurrencySymbol(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.85rem',
                      borderRadius: '10px',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      backgroundColor: '#16122e',
                      color: 'white',
                      fontSize: '0.95rem',
                      outline: 'none',
                    }}
                  >
                    {POPULAR_CURRENCIES.map(c => (
                      <option key={c.label} value={c.symbol} style={{ background: '#16122e', color: 'white' }}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>Amount or Range</label>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <span style={{ position: 'absolute', left: '12px', color: '#00f0ff', fontWeight: 'bold', fontSize: '1rem' }}>
                      {currencySymbol}
                    </span>
                    <input 
                      type="text" 
                      value={salaryAmount}
                      onChange={(e) => setSalaryAmount(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.85rem 0.85rem 0.85rem 2.2rem',
                        borderRadius: '10px',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                        color: 'white',
                        fontSize: '0.95rem',
                        outline: 'none',
                      }}
                      placeholder="e.g. 50,000 - 80,000 or 25"
                    />
                  </div>
                </div>
              </div>

              {/* Payment Frequency Selector: Per Hour, Daily, Monthly, Yearly */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.45rem' }}>
                  Payment Frequency
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem' }}>
                  {PAYMENT_FREQUENCIES.map(freq => {
                    const isSelected = salaryFrequency === freq.id;
                    return (
                      <button
                        key={freq.id}
                        type="button"
                        onClick={() => setSalaryFrequency(freq.id)}
                        style={{
                          padding: '8px 4px',
                          borderRadius: '8px',
                          border: isSelected ? '1.5px solid #00f0ff' : '1px solid rgba(255, 255, 255, 0.12)',
                          background: isSelected ? 'rgba(0, 240, 255, 0.16)' : 'rgba(255, 255, 255, 0.03)',
                          color: isSelected ? '#00f0ff' : 'white',
                          fontSize: '0.85rem',
                          fontWeight: isSelected ? 600 : 400,
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                          textAlign: 'center',
                        }}
                      >
                        {freq.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Live Formatted Compensation Preview */}
              {salaryAmount.trim() && (
                <div style={{ marginTop: '0.75rem', padding: '6px 12px', borderRadius: '8px', background: 'rgba(0, 240, 255, 0.08)', border: '1px dashed rgba(0, 240, 255, 0.3)', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: '#e0f7fa' }}>
                  <span>💰 Displayed Compensation:</span>
                  <strong style={{ color: '#00f0ff' }}>
                    {getFormattedSalary()}
                  </strong>
                </div>
              )}
            </div>

            {/* Work Mode Selector (Remote, Onsite, Hybrid) */}
            <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
              <label style={{ display: 'block', marginBottom: '0.6rem', color: '#00f0ff', fontWeight: 600, fontSize: '0.95rem' }}>
                Job Vacancy Work Mode (Remote, Onsite, or Hybrid) *
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.6rem' }}>
                {([
                  { id: 'REMOTE', label: '🌍 Remote Only' },
                  { id: 'ONSITE', label: '🏢 Onsite Only' },
                  { id: 'HYBRID', label: '🔄 Hybrid' },
                ] as const).map(opt => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => {
                      setWorkMode(opt.id);
                      setIsRemote(opt.id === 'REMOTE');
                    }}
                    style={{
                      padding: '10px',
                      borderRadius: '10px',
                      border: workMode === opt.id ? '2px solid #00f0ff' : '1px solid rgba(255,255,255,0.15)',
                      background: workMode === opt.id ? 'rgba(0, 240, 255, 0.16)' : 'rgba(255,255,255,0.04)',
                      color: workMode === opt.id ? '#00f0ff' : 'white',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Cover Letter Requirement Selector */}
            <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <div style={{ color: 'white', fontWeight: 600, fontSize: '0.95rem' }}>📄 Cover Letter Requirement</div>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.82rem' }}>Specify if applicants must submit a cover letter for this vacancy</div>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setRequiresCoverLetter(true)}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '8px',
                    border: requiresCoverLetter ? '2px solid #00f0ff' : '1px solid rgba(255,255,255,0.15)',
                    background: requiresCoverLetter ? 'rgba(0,240,255,0.16)' : 'rgba(255,255,255,0.04)',
                    color: requiresCoverLetter ? '#00f0ff' : 'white',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                  }}
                >
                  Required
                </button>
                <button
                  type="button"
                  onClick={() => setRequiresCoverLetter(false)}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '8px',
                    border: !requiresCoverLetter ? '2px solid #10b981' : '1px solid rgba(255,255,255,0.15)',
                    background: !requiresCoverLetter ? 'rgba(16,185,129,0.16)' : 'rgba(255,255,255,0.04)',
                    color: !requiresCoverLetter ? '#34d399' : 'white',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                  }}
                >
                  Not Required (Optional)
                </button>
              </div>
            </div>

            <button type="submit" className="btn-primary" disabled={loading} style={{ marginTop: '0.5rem', padding: '0.9rem' }}>
              {loading ? 'Posting Job...' : 'Post Job'}
            </button>
          </form>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* File Upload Zone */}
            <div style={{ border: '2px dashed rgba(0, 240, 255, 0.3)', borderRadius: '12px', padding: '1.5rem', textAlign: 'center', background: 'rgba(0, 240, 255, 0.03)' }}>
              <UploadCloud className="w-8 h-8 text-cyan-400 mx-auto mb-2" />
              <p style={{ color: 'white', fontWeight: 600, margin: '0 0 6px 0' }}>Upload Vacancy File (CSV or JSON)</p>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: '0 0 12px 0' }}>Support standard .csv, .json, or .txt file with job roles</p>
              
              <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                <label className="btn-primary" style={{ padding: '6px 16px', fontSize: '0.85rem', cursor: 'pointer' }}>
                  Choose File
                  <input type="file" accept=".csv,.json,.txt" onChange={handleFileUpload} style={{ display: 'none' }} />
                </label>
                <button
                  type="button"
                  onClick={loadSampleTemplate}
                  style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: 'white', padding: '6px 14px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem' }}
                >
                  Load Sample Template
                </button>
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <label style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Or Paste CSV / JSON Roles Directly:</label>
                <span style={{ fontSize: '0.8rem', color: '#00f0ff' }}>Format: Title, Location, Salary, Remote, Description</span>
              </div>
              <textarea
                value={bulkText}
                onChange={(e) => {
                  setBulkText(e.target.value);
                  parseBulkInput(e.target.value);
                }}
                rows={5}
                style={{ width: '100%', padding: '0.8rem', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.1)', backgroundColor: 'rgba(255, 255, 255, 0.05)', color: 'white', fontSize: '0.9rem', outline: 'none', fontFamily: 'monospace' }}
                placeholder={`Senior Flutter Developer, Remote, $120k, Yes, Lead app development\nBackend Engineer, San Francisco, $140k, No, Scale distributed APIs`}
              />
            </div>

            {/* Parsed Preview Table */}
            {parsedJobs.length > 0 && (
              <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: '12px', padding: '1rem', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <h4 style={{ margin: 0, color: '#00f0ff', fontSize: '1rem' }}>
                    Parsed Vacancies Preview ({parsedJobs.length} roles found)
                  </h4>
                  <button
                    type="button"
                    onClick={() => { setParsedJobs([]); setBulkText(''); }}
                    style={{ background: 'transparent', border: 'none', color: '#ef4444', fontSize: '0.8rem', cursor: 'pointer' }}
                  >
                    Clear All
                  </button>
                </div>

                <div style={{ maxHeight: '220px', overflowY: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', color: 'white' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-secondary)', textAlign: 'left' }}>
                        <th style={{ padding: '6px' }}>#</th>
                        <th style={{ padding: '6px' }}>Role Title</th>
                        <th style={{ padding: '6px' }}>Location</th>
                        <th style={{ padding: '6px' }}>Salary</th>
                        <th style={{ padding: '6px' }}>Remote</th>
                        <th style={{ padding: '6px', textAlign: 'center' }}>Remove</th>
                      </tr>
                    </thead>
                    <tbody>
                      {parsedJobs.map((pj, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                          <td style={{ padding: '6px', color: 'var(--text-secondary)' }}>{idx + 1}</td>
                          <td style={{ padding: '6px', fontWeight: 600 }}>{pj.title}</td>
                          <td style={{ padding: '6px', color: 'var(--text-secondary)' }}>{pj.location}</td>
                          <td style={{ padding: '6px', color: '#34d399' }}>{pj.salary}</td>
                          <td style={{ padding: '6px' }}>{pj.isRemote ? '🌐 Yes' : '🏢 No'}</td>
                          <td style={{ padding: '6px', textAlign: 'center' }}>
                            <button
                              type="button"
                              onClick={() => setParsedJobs(parsedJobs.filter((_, i) => i !== idx))}
                              style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer' }}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <button
                  type="button"
                  onClick={handleBulkSubmit}
                  disabled={bulkLoading}
                  className="btn-primary"
                  style={{ width: '100%', marginTop: '1rem', padding: '0.9rem' }}
                >
                  {bulkLoading ? 'Posting Vacancies in Bulk...' : `🚀 Post All ${parsedJobs.length} Vacancy Roles Now`}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
