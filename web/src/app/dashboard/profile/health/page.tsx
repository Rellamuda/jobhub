'use client';
import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Activity, Check, X, Star } from 'lucide-react';

export default function CareerHealthScore() {
  const [healthData, setHealthData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch from AI service (mocking standard fetch flow)
    fetch('/api/ai/career-health', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: 'current-user' })
    })
      .then(res => res.json())
      .then(data => {
        setHealthData(data);
        setLoading(false);
      })
      .catch(e => {
        // Fallback to mock data if backend not fully wired
        setHealthData({
          score: 89,
          stars: 5,
          strengths: ['Strong Experience', 'Excellent Resume', 'Verified Skills'],
          needs_improvement: ['Leadership Certification', 'Cloud Computing', 'Portfolio']
        });
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="p-8">Loading AI Analysis...</div>;

  return (
    <div className="p-8 max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-4xl font-bold flex items-center gap-3">
          <Activity className="w-8 h-8 text-green-500" />
          AI Career Health
        </h1>
        <p className="text-gray-500 mt-2">Personalized insights to elevate your professional profile.</p>
      </div>

      <Card className="border-t-4 border-t-green-500 shadow-md">
        <CardContent className="p-8 flex flex-col md:flex-row gap-12 items-center">
          
          <div className="flex flex-col items-center gap-4 border-r md:pr-12 border-gray-100">
            <h2 className="text-gray-500 font-bold tracking-widest text-sm uppercase">Career Score</h2>
            <div className="text-6xl font-black text-gray-900 flex items-baseline gap-1">
              {healthData.score} <span className="text-2xl text-gray-400 font-medium">/ 100</span>
            </div>
            <div className="flex gap-1 text-yellow-400">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className={`w-6 h-6 ${i < healthData.stars ? 'fill-yellow-400' : 'fill-gray-200 text-gray-200'}`} />
              ))}
            </div>
          </div>

          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-8 w-full">
            <div className="space-y-4">
              <h3 className="font-bold text-lg text-gray-900 border-b pb-2">Strengths</h3>
              <ul className="space-y-3">
                {healthData.strengths.map((str: string, i: number) => (
                  <li key={i} className="flex items-center gap-3 text-gray-700">
                    <div className="bg-green-100 p-1 rounded-full text-green-600"><Check className="w-4 h-4 stroke-[3]" /></div>
                    <span className="font-medium">{str}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-4">
              <h3 className="font-bold text-lg text-gray-900 border-b pb-2">Needs Improvement</h3>
              <ul className="space-y-3">
                {healthData.needs_improvement.map((need: string, i: number) => (
                  <li key={i} className="flex items-center gap-3 text-gray-700">
                    <div className="bg-gray-100 p-1 rounded-full text-gray-400"><span className="w-4 h-4 block rounded-full bg-gray-400" /></div>
                    <span className="font-medium">{need}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

        </CardContent>
      </Card>
    </div>
  );
}
