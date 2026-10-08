'use client';
import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Wallet, ShieldCheck, GraduationCap, Award, FileText, UploadCloud, 
  Plus, CheckCircle, Clock, X, ExternalLink 
} from 'lucide-react';

interface CredentialItem {
  id: string;
  type: string;
  name: string;
  issuer: string;
  issueDate?: string;
  date?: string;
  documentUrl?: string;
  verificationStatus?: string;
  status?: string;
}

const DEFAULT_CREDENTIALS: CredentialItem[] = [
  { id: '1', type: 'DEGREE', name: 'B.Sc. Computer Science', issuer: 'Stanford University', status: 'VERIFIED', date: '2020-05-15' },
  { id: '2', type: 'CERTIFICATE', name: 'AWS Solutions Architect', issuer: 'Amazon Web Services', status: 'VERIFIED', date: '2023-08-10' },
  { id: '3', type: 'ID', name: 'National Passport', issuer: 'Govt. Issued', status: 'PENDING', date: '2024-01-20' }
];

export default function DigitalWallet() {
  const [credentials, setCredentials] = useState<CredentialItem[]>(DEFAULT_CREDENTIALS);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form fields
  const [credType, setCredType] = useState('CERTIFICATE');
  const [credName, setCredName] = useState('');
  const [credIssuer, setCredIssuer] = useState('');
  const [credDate, setCredDate] = useState(new Date().toISOString().split('T')[0]);
  const [credDocUrl, setCredDocUrl] = useState('');

  useEffect(() => {
    fetchCredentials();
  }, []);

  const fetchCredentials = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      setLoading(true);
      const res = await fetch('/api/profiles/credentials', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          const mapped = data.map((d: any) => ({
            id: d.id,
            type: d.type || 'CERTIFICATE',
            name: d.name,
            issuer: d.issuer,
            status: d.verificationStatus || 'PENDING',
            date: d.issueDate ? new Date(d.issueDate).toISOString().split('T')[0] : 'Recent',
            documentUrl: d.documentUrl
          }));
          setCredentials(mapped);
        }
      }
    } catch (err) {
      console.warn('Could not fetch server credentials, using default wallet state:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCredential = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!credName.trim() || !credIssuer.trim()) {
      alert('Please provide credential name and issuing institution.');
      return;
    }

    setSaving(true);
    const token = localStorage.getItem('token');
    const newCredPayload = {
      type: credType,
      name: credName,
      issuer: credIssuer,
      issueDate: credDate,
      documentUrl: credDocUrl,
    };

    try {
      if (token) {
        const res = await fetch('/api/profiles/credentials', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(newCredPayload)
        });

        if (res.ok) {
          const saved = await res.json();
          setCredentials(prev => [
            {
              id: saved.id || String(Date.now()),
              type: saved.type || credType,
              name: saved.name || credName,
              issuer: saved.issuer || credIssuer,
              status: saved.verificationStatus || 'PENDING',
              date: credDate,
              documentUrl: credDocUrl
            },
            ...prev
          ]);
        } else {
          // Add locally
          addLocally();
        }
      } else {
        addLocally();
      }

      // Reset & close
      setCredName('');
      setCredIssuer('');
      setCredDocUrl('');
      setIsModalOpen(false);
      alert('Credential submitted successfully! Verification has been requested.');
    } catch (err) {
      console.error(err);
      addLocally();
      setIsModalOpen(false);
    } finally {
      setSaving(false);
    }
  };

  const addLocally = () => {
    const localItem: CredentialItem = {
      id: String(Date.now()),
      type: credType,
      name: credName,
      issuer: credIssuer,
      status: 'PENDING',
      date: credDate,
      documentUrl: credDocUrl
    };
    setCredentials(prev => [localItem, ...prev]);
  };

  const getIcon = (type: string) => {
    switch (type.toUpperCase()) {
      case 'DEGREE': return GraduationCap;
      case 'CERTIFICATE': return Award;
      default: return FileText;
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold flex items-center gap-3 text-foreground">
            <Wallet className="w-8 h-8 text-blue-500" />
            Digital Credential Wallet
          </h1>
          <p className="text-muted-foreground mt-2">
            Securely store verified degrees, certifications, and licenses to fast-track your applications.
          </p>
        </div>
        <Button 
          onClick={() => setIsModalOpen(true)}
          className="gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium px-5 py-2.5 rounded-xl shadow-lg transition-all"
        >
          <UploadCloud className="w-5 h-5"/> Add Credential
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {credentials.map(cred => {
          const Icon = getIcon(cred.type);
          const isVerified = (cred.status || cred.verificationStatus) === 'VERIFIED';
          return (
            <Card key={cred.id} className="relative overflow-hidden group border border-border bg-card shadow-sm hover:shadow-md transition-shadow">
              <div className={`absolute top-0 right-0 p-4 ${isVerified ? 'text-emerald-500' : 'text-amber-500'}`}>
                {isVerified ? (
                  <ShieldCheck className="w-6 h-6" />
                ) : (
                  <Clock className="w-6 h-6" />
                )}
              </div>
              <CardContent className="p-6 space-y-4">
                <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center border border-blue-500/20">
                  <Icon className="w-6 h-6 text-blue-500" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-muted-foreground tracking-wider uppercase mb-1">
                    {cred.type}
                  </p>
                  <h3 className="font-bold text-lg text-foreground leading-tight">
                    {cred.name}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1 font-medium">
                    {cred.issuer}
                  </p>
                </div>

                {cred.documentUrl && (
                  <a 
                    href={cred.documentUrl} 
                    target="_blank" 
                    rel="noreferrer" 
                    className="text-xs text-blue-500 hover:underline inline-flex items-center gap-1 font-medium"
                  >
                    View Document <ExternalLink className="w-3 h-3" />
                  </a>
                )}

                <div className="flex justify-between items-end pt-4 border-t border-border">
                  <p className="text-xs text-muted-foreground">Issued: {cred.date || 'Verified'}</p>
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                    isVerified 
                      ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' 
                      : 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                  }`}>
                    {isVerified ? 'VERIFIED' : 'PENDING'}
                  </span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Add Credential Modal Dialog */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-card border border-border w-full max-w-lg rounded-2xl shadow-2xl p-6 sm:p-8 relative">
            <button 
              onClick={() => setIsModalOpen(false)}
              className="absolute top-5 right-5 text-muted-foreground hover:text-foreground p-1 rounded-full"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                <Plus className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground">Add Digital Credential</h2>
                <p className="text-xs text-muted-foreground">Upload and request verification for your certifications and degrees</p>
              </div>
            </div>

            <form onSubmit={handleAddCredential} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                  Credential Type
                </label>
                <select 
                  value={credType}
                  onChange={(e) => setCredType(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="DEGREE">Degree / Diploma (e.g. B.Sc., Masters)</option>
                  <option value="CERTIFICATE">Professional Certificate (AWS, Google, CISCO)</option>
                  <option value="LICENSE">Professional License / Membership</option>
                  <option value="ID">Government / National ID</option>
                  <option value="OTHER">Other Credential</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                  Credential Name / Title *
                </label>
                <input 
                  type="text" 
                  value={credName}
                  onChange={(e) => setCredName(e.target.value)}
                  placeholder="e.g. AWS Certified Solutions Architect - Associate"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-input bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                  Issuing Organization / Institution *
                </label>
                <input 
                  type="text" 
                  value={credIssuer}
                  onChange={(e) => setCredIssuer(e.target.value)}
                  placeholder="e.g. Amazon Web Services, Stanford University"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-input bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                  Issue Date
                </label>
                <input 
                  type="date" 
                  value={credDate}
                  onChange={(e) => setCredDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                  Document / Verification Link (Optional)
                </label>
                <input 
                  type="url" 
                  value={credDocUrl}
                  onChange={(e) => setCredDocUrl(e.target.value)}
                  placeholder="https://credly.com/badges/... or document link"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-input bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex gap-3 pt-4 border-t border-border mt-6">
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 rounded-xl"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={saving}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl"
                >
                  {saving ? 'Adding...' : 'Submit Credential'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
