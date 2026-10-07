'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

export default function CompanyPublicPage() {
  const { id } = useParams();
  const router = useRouter();
  const [company, setCompany] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchCompany = async () => {
      try {
        const token = localStorage.getItem('token'); // Optional, but usually provided if logged in
        const headers: any = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const res = await fetch(`/api/profiles/employer/${id}/public`, { headers });
        if (res.ok) {
          setCompany(await res.json());
        } else {
          setError('Company not found.');
        }
      } catch (err) {
        setError('Failed to load company details.');
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchCompany();
  }, [id]);

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', marginTop: '5rem' }}>Loading company...</div>;
  if (error || !company) return <div style={{ textAlign: 'center', marginTop: '5rem', color: 'red' }}>{error}</div>;

  return (
    <main style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto', display: 'flex', gap: '2rem' }}>
      
      {/* Main Content Area */}
      <div style={{ flex: '2', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        
        {/* Header */}
        <div className="glass-panel" style={{ padding: '2rem', position: 'relative' }}>
          {company.bannerImage && (
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '120px', background: `url(${company.bannerImage}) center/cover`, borderTopLeftRadius: '16px', borderTopRightRadius: '16px', opacity: 0.5 }}></div>
          )}
          <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: company.bannerImage ? '60px' : '0' }}>
            <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
              <div style={{ width: 140, height: 140, borderRadius: '50%', overflow: 'hidden', background: 'rgba(255,255,255,0.1)', border: '4px solid var(--background)' }}>
                {company.profilePicture ? (
                  <img src={company.profilePicture} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '4rem' }}>🏢</div>
                )}
              </div>
              <div>
                <h1 style={{ margin: 0, fontSize: '2.5rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {company.companyName}
                  {company.verificationStatus === 'VERIFIED' && <span title="Verified Employer" style={{ color: '#00f0ff', fontSize: '1.5rem' }}>✔</span>}
                </h1>
                <p style={{ fontSize: '1.2rem', margin: '0.5rem 0', color: 'var(--secondary-color)' }}>{company.industry || 'Employer'}</p>
                <p style={{ margin: 0, color: 'var(--text-secondary)' }}>{company.locationCity}{company.locationState && `, ${company.locationState}`} {company.locationCountry && `- ${company.locationCountry}`}</p>
                
                <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                  <a href={company.website || '#'} target="_blank" rel="noreferrer" style={{ color: 'var(--primary-color)', textDecoration: 'none' }}>Visit Website ↗</a>
                </div>
              </div>
            </div>
            <div>
              <button className="btn-primary" style={{ padding: '0.5rem 1rem' }}>Follow Company</button>
              <div style={{ textAlign: 'center', marginTop: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                {company.followers || 0} Followers
              </div>
            </div>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '2rem' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: 'var(--primary-color)' }}>About Us</h2>
          <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>{company.description || 'No description provided.'}</p>
        </div>

        {/* Active Jobs */}
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: 'var(--primary-color)' }}>Open Positions</h2>
          {company.jobs && company.jobs.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {company.jobs.map((job: any) => (
                <Link href={`/jobs/${job.id}`} key={job.id} style={{ textDecoration: 'none' }}>
                  <div style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', borderLeft: '4px solid var(--primary-color)', transition: 'background 0.2s', cursor: 'pointer' }} className="hover-highlight">
                    <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'white' }}>{job.title}</h3>
                    <p style={{ margin: '0.5rem 0', color: 'var(--text-secondary)', fontSize: '0.95rem' }}>{job.location || 'Remote'} • {job.employmentType || 'Full-time'}</p>
                    <p style={{ margin: 0, color: 'var(--primary-color)', fontWeight: 'bold' }}>{job.salary || 'Salary Negotiable'}</p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p style={{ color: 'var(--text-secondary)' }}>No open positions currently available.</p>
          )}
        </div>
      </div>

      {/* Right Sidebar */}
      <div style={{ flex: '1', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <h3 style={{ margin: '0 0 1rem 0', color: 'var(--primary-color)' }}>Company Details</h3>
          <p style={{ margin: '0.5rem 0', color: 'var(--text-secondary)' }}><strong>Industry:</strong> {company.industry || 'N/A'}</p>
          <p style={{ margin: '0.5rem 0', color: 'var(--text-secondary)' }}><strong>Size:</strong> {company.companySize || 'N/A'}</p>
          <p style={{ margin: '0.5rem 0', color: 'var(--text-secondary)' }}><strong>Founded:</strong> {company.foundedYear || 'N/A'}</p>
          <p style={{ margin: '0.5rem 0', color: 'var(--text-secondary)' }}><strong>Views:</strong> {company.profileViews || 0}</p>
          {company.responseTimeRating && (
            <p style={{ margin: '0.5rem 0', color: 'var(--text-secondary)' }}><strong>Avg Response Time:</strong> {company.responseTimeRating} hrs</p>
          )}
        </div>

        {company.coreValues && (
          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <h3 style={{ margin: '0 0 1rem 0', color: 'var(--primary-color)' }}>Core Values</h3>
            <ul style={{ paddingLeft: '1.2rem', margin: 0, color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {(company.coreValues as string[]).map((v, i) => (
                <li key={i}>{v}</li>
              ))}
            </ul>
          </div>
        )}

        {company.companyVideos && company.companyVideos.length > 0 && (
          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <h3 style={{ margin: '0 0 1rem 0', color: 'var(--primary-color)' }}>Office Tour</h3>
            <div style={{ position: 'relative', paddingTop: '56.25%', borderRadius: '8px', overflow: 'hidden' }}>
              <iframe 
                src={company.companyVideos[0]} 
                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 0 }} 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                allowFullScreen
              />
            </div>
          </div>
        )}

        {company.testimonials && company.testimonials.length > 0 && (
          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <h3 style={{ margin: '0 0 1rem 0', color: 'var(--primary-color)' }}>Employee Testimonials</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {(company.testimonials as any[]).map((t, i) => (
                <div key={i} style={{ background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '8px', fontStyle: 'italic' }}>
                  <p style={{ margin: '0 0 0.5rem 0', color: 'var(--text-secondary)' }}>"{t.content}"</p>
                  <p style={{ margin: 0, color: 'var(--primary-color)', fontSize: '0.9rem', fontWeight: 'bold' }}>- {t.author}, {t.role}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <style>{`
        .hover-highlight:hover { background: rgba(255,255,255,0.08) !important; }
      `}</style>
    </main>
  );
}
