'use client';
import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { GraduationCap } from 'lucide-react';

export default function InternshipsPage() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    fetch('/api/jobs/internships', {
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
  }, []);

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-4xl font-bold flex items-center gap-3">
          <GraduationCap className="w-8 h-8 text-blue-500" />
          Internship Portal
        </h1>
        <p className="text-gray-500 mt-2">Discover Internships, Graduate Roles, NYSC Opportunities, and Apprenticeships.</p>
      </div>

      {loading ? <p>Loading...</p> : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {jobs.map((job: any) => (
            <Card key={job.id}>
              <CardHeader>
                <div className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded w-fit mb-2">{job.employmentType}</div>
                <CardTitle>{job.title}</CardTitle>
                <p className="text-sm text-gray-500">{job.employer?.companyName}</p>
              </CardHeader>
              <CardContent>
                <p className="line-clamp-3 text-sm">{job.description}</p>
              </CardContent>
              <CardFooter>
                <Button className="w-full" variant="outline">Apply Now</Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
