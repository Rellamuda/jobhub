'use client';
import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Trophy } from 'lucide-react';

export default function ReferralsPage() {
  const [leaderboard, setLeaderboard] = useState([]);

  useEffect(() => {
    fetch('/api/profiles/leaderboard')
      .then(res => res.json())
      .then(setLeaderboard)
      .catch(console.error);
  }, []);

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-4xl font-bold flex items-center gap-3">
          <Trophy className="w-8 h-8 text-yellow-500" />
          Referral Leaderboard
        </h1>
        <p className="text-gray-500 mt-2">Refer candidates to earn rewards and climb the ranks.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Top Referrers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {leaderboard.map((user: any, index) => (
              <div key={index} className="flex justify-between items-center p-4 border rounded-lg bg-gray-50 dark:bg-gray-900">
                <div className="flex items-center gap-4">
                  <span className="font-bold text-xl text-gray-400">#{index + 1}</span>
                  <span className="font-medium">{user.email}</span>
                </div>
                <div className="flex gap-6 text-sm">
                  <div><span className="text-gray-500">Referrals:</span> {user.totalReferrals}</div>
                  <div className="font-bold text-green-600"><span className="text-gray-500 font-normal">Rewards:</span> {user.totalRewards} pts</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
