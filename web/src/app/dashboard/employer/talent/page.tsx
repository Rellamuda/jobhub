'use client';
import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, UserCheck, Star } from 'lucide-react';

export default function TalentMarketplace() {
  const [candidates, setCandidates] = useState([]);
  const [skillSearch, setSkillSearch] = useState('');

  const fetchTalent = async (skill = '') => {
    try {
      const res = await fetch(`/api/profiles/talent?skill=${skill}`);
      const data = await res.json();
      setCandidates(data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchTalent();
  }, []);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-4xl font-bold flex items-center gap-3">
          <UserCheck className="w-8 h-8 text-indigo-600" />
          Talent Marketplace
        </h1>
        <p className="text-gray-500 mt-2">Source exceptional candidates proactively without posting a job.</p>
      </div>

      <Card>
        <CardContent className="p-4 flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <Input 
              placeholder="Search by skills (e.g. React, Python)..." 
              className="pl-10"
              value={skillSearch}
              onChange={e => setSkillSearch(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && fetchTalent(skillSearch)}
            />
          </div>
          <Button onClick={() => fetchTalent(skillSearch)} className="bg-indigo-600">Search</Button>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {candidates.map((c: any) => (
          <Card key={c.id} className="hover:border-indigo-400 transition-colors">
            <CardHeader className="p-4 pb-2 flex flex-row items-start justify-between">
              <div>
                <CardTitle className="text-lg">{c.firstName} {c.lastName}</CardTitle>
                <p className="text-sm font-medium text-indigo-600">{c.profession}</p>
              </div>
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 font-bold">
                {c.firstName.charAt(0)}{c.lastName.charAt(0)}
              </div>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <p className="text-sm text-gray-600 line-clamp-2">{c.summary || 'No summary provided.'}</p>
              <div className="flex flex-wrap gap-2">
                {(c.skills || []).slice(0, 4).map((s: string) => (
                  <span key={s} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-md font-medium">{s}</span>
                ))}
              </div>
              <div className="pt-4 flex gap-2 border-t">
                <Button className="flex-1" variant="outline"><Star className="w-4 h-4 mr-2" /> Save to Pool</Button>
                <Button className="flex-1 bg-indigo-600 text-white">Message</Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {candidates.length === 0 && (
          <div className="col-span-full py-12 text-center text-gray-500">
            No candidates match your search.
          </div>
        )}
      </div>
    </div>
  );
}
