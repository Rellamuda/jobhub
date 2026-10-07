'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Briefcase, MapPin, DollarSign, Zap } from 'lucide-react';

export default function MarketplacePage() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [resumes, setResumes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const token = localStorage.getItem('token');
    fetch('/api/jobs/marketplace', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setJobs(data);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });

    fetch('/api/resumes', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setResumes(data);
        }
      })
      .catch(console.error);
  }, []);

  const handleOneTapApply = async (jobId: string) => {
    if (resumes.length === 0) {
      alert('Please create a resume in the Resumes tab first before using One-Tap Apply.');
      return;
    }
    const resumeId = resumes[0].id; 
    try {
      const res = await fetch(`/api/applications/${jobId}/one-tap`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ resumeId })
      });
      if (res.ok) {
        alert('Applied successfully with One-Tap! (Included: CV, Cover Letter, Portfolio, Certificates)');
      } else {
        alert('Failed to apply. You might have already applied.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <div className="flex justify-between items-center border-b pb-6">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white flex items-center gap-3">
            <Zap className="w-8 h-8 text-yellow-500" /> Gig Marketplace
          </h1>
          <p className="text-gray-500 mt-2">Find freelance, contract, remote gigs, and hourly jobs tailored for you.</p>
        </div>
      </div>
      
      {loading ? (
        <div className="text-center py-20 text-gray-500">Loading gigs...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {jobs.length === 0 ? (
            <div className="col-span-full text-center py-20 border border-dashed rounded-xl border-gray-300">
              <Briefcase className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium">No gigs available</h3>
              <p className="text-gray-500">Check back later for new freelance opportunities.</p>
            </div>
          ) : (
            jobs.map((job: any) => (
              <Card key={job.id} className="hover:shadow-md transition-all border-t-4 border-t-blue-500 flex flex-col">
                <CardHeader>
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs font-bold px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
                      {job.employmentType || 'FREELANCE'}
                    </span>
                  </div>
                  <CardTitle className="text-xl">{job.title}</CardTitle>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {job.employer?.companyName || 'Independent Client'}
                  </p>
                </CardHeader>
                <CardContent className="flex-1 space-y-4">
                  <p className="text-sm text-gray-500 line-clamp-3">{job.description}</p>
                  
                  <div className="flex flex-col gap-2 mt-4 text-sm text-gray-600">
                    <div className="flex items-center gap-2"><MapPin className="w-4 h-4"/> {job.location || 'Remote'}</div>
                    {job.salary && <div className="flex items-center gap-2"><DollarSign className="w-4 h-4"/> {job.salary}</div>}
                  </div>
                </CardContent>
                <CardFooter className="pt-4 border-t">
                  <Button 
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold gap-2"
                    onClick={() => handleOneTapApply(job.id)}
                  >
                    <Zap className="w-4 h-4 fill-white" /> One-Tap Apply
                  </Button>
                </CardFooter>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
}
