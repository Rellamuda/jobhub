'use client';
import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Users, Tag, MessageSquare, Star } from 'lucide-react';

export default function CRMDashboard() {
  const [pipelines] = useState([
    { id: '1', title: 'New Applied (AI Ranked)', candidates: [
      { id: 'c1', name: 'Jane Doe', rank: 98, role: 'Senior React Dev', tags: ['Top Tier', 'Willing to Relocate'] },
      { id: 'c2', name: 'John Smith', rank: 96, role: 'Frontend Engineer', tags: ['Needs Visa'] },
      { id: 'c3', name: 'Mary Johnson', rank: 93, role: 'Software Engineer', tags: ['Local'] }
    ]},
    { id: '2', title: 'Interviewing', candidates: [
      { id: 'c4', name: 'Alex Wong', rank: 91, role: 'Senior Developer', tags: ['Technical Passed'] }
    ]},
    { id: '3', title: 'Offered', candidates: [] }
  ]);

  return (
    <div className="p-8 max-w-7xl mx-auto h-[90vh] flex flex-col">
      <div className="mb-6">
        <h1 className="text-4xl font-bold flex items-center gap-3">
          <Users className="w-8 h-8 text-blue-500" />
          Recruiter CRM
        </h1>
        <p className="text-gray-500 mt-2">Manage talent pools, track pipelines, and view AI Candidate Rankings.</p>
      </div>

      <div className="flex-1 flex gap-6 overflow-x-auto pb-4">
        {pipelines.map(col => (
          <div key={col.id} className="min-w-[350px] bg-gray-100 dark:bg-gray-800/50 rounded-xl p-4 flex flex-col gap-4">
            <h3 className="font-bold text-lg text-gray-700 dark:text-gray-300 flex justify-between">
              {col.title} <span className="bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded text-sm">{col.candidates.length}</span>
            </h3>
            
            <div className="flex-1 overflow-y-auto space-y-3">
              {col.candidates.map(candidate => (
                <Card key={candidate.id} className="cursor-pointer hover:border-blue-400 transition-colors">
                  <CardHeader className="p-4 pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-base">{candidate.name}</CardTitle>
                      <div className="flex items-center gap-1 text-sm font-bold text-green-600 bg-green-100 px-2 py-1 rounded">
                        <Star className="w-3 h-3 fill-green-600" /> {candidate.rank}%
                      </div>
                    </div>
                    <p className="text-sm text-gray-500">{candidate.role}</p>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <div className="flex flex-wrap gap-2 mb-3">
                      {candidate.tags.map(tag => (
                        <span key={tag} className="flex items-center gap-1 text-xs bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-1 rounded-full">
                          <Tag className="w-3 h-3" /> {tag}
                        </span>
                      ))}
                    </div>
                    <div className="flex justify-between border-t pt-2 mt-2">
                      <button className="text-gray-500 hover:text-blue-500 flex items-center gap-1 text-xs font-medium">
                        <MessageSquare className="w-4 h-4" /> Add Note
                      </button>
                      <button className="text-gray-500 hover:text-blue-500 text-xs font-medium">
                        View History
                      </button>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {col.candidates.length === 0 && (
                <div className="text-center text-gray-400 py-8 border-2 border-dashed border-gray-300 rounded-lg">
                  No candidates
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
