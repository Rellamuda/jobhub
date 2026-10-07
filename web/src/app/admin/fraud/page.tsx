'use client';
import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShieldAlert, Trash2, CheckCircle } from 'lucide-react';

export default function FraudDashboard() {
  // Mock data for AI flagged entities
  const [flags, setFlags] = useState([
    { id: '1', type: 'JOB', score: 90, reason: 'High probability of spam/scam terminology', content: 'Make $100k working from home clicking links!', entityId: 'job-123', status: 'PENDING' },
    { id: '2', type: 'COMPANY', score: 75, reason: 'Likely a test/fake entity', content: 'Test Company 123', entityId: 'emp-456', status: 'PENDING' },
    { id: '3', type: 'CV', score: 88, reason: 'Duplicate exact match found in database', content: 'Resume_JohnDoe.pdf', entityId: 'res-789', status: 'PENDING' }
  ]);

  const handleAction = (id: string, action: 'ban' | 'approve') => {
    setFlags(prev => prev.map(f => f.id === id ? { ...f, status: action === 'ban' ? 'BANNED' : 'APPROVED' } : f));
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-4xl font-bold flex items-center gap-3 text-red-600">
          <ShieldAlert className="w-8 h-8" />
          AI Fraud Detection Queue
        </h1>
        <p className="text-gray-500 mt-2">Review entities flagged by the automated AI detection system.</p>
      </div>

      <div className="grid gap-4">
        {flags.map(flag => (
          <Card key={flag.id} className={`border-l-4 ${flag.status === 'PENDING' ? 'border-l-red-500' : flag.status === 'BANNED' ? 'border-l-gray-400 opacity-50' : 'border-l-green-500'}`}>
            <CardContent className="p-6 flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-3">
                  <span className="px-2 py-1 bg-gray-800 text-white text-xs font-bold rounded">{flag.type}</span>
                  <span className="font-mono text-xs text-gray-500">ID: {flag.entityId}</span>
                  {flag.status !== 'PENDING' && <span className="font-bold text-sm ml-2">[{flag.status}]</span>}
                </div>
                <h3 className="font-bold text-lg text-gray-900">{flag.reason}</h3>
                <p className="text-sm text-gray-600 italic bg-gray-50 p-2 rounded">"{flag.content}"</p>
              </div>
              
              <div className="flex flex-col items-center gap-3">
                <div className="w-16 h-16 rounded-full border-4 border-red-100 flex items-center justify-center">
                  <span className="text-xl font-bold text-red-600">{flag.score}</span>
                </div>
                <span className="text-xs font-bold text-gray-500">AI SCORE</span>
              </div>

              {flag.status === 'PENDING' && (
                <div className="flex gap-2">
                  <Button onClick={() => handleAction(flag.id, 'ban')} variant="destructive" className="flex items-center gap-2"><Trash2 className="w-4 h-4"/> Ban / Delete</Button>
                  <Button onClick={() => handleAction(flag.id, 'approve')} variant="outline" className="text-green-600 border-green-200 hover:bg-green-50 flex items-center gap-2"><CheckCircle className="w-4 h-4"/> Approve (Safe)</Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
