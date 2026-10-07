'use client';
import { Card, CardContent } from '@/components/ui/card';
import { Briefcase, GraduationCap, Award, GitMerge, TrendingUp } from 'lucide-react';

export default function CareerTimeline() {
  const timeline = [
    { type: 'PROMOTION', title: 'Senior Software Engineer', org: 'Tech Innovators Inc.', date: 'Jan 2024 - Present', desc: 'Promoted to lead the frontend architecture team.', icon: TrendingUp, color: 'bg-green-500' },
    { type: 'PROJECT', title: 'Global Payment Gateway Integration', org: 'Open Source', date: 'Nov 2023', desc: 'Built and open-sourced a Stripe wrapper for Flutter.', icon: GitMerge, color: 'bg-purple-500' },
    { type: 'WORK', title: 'Software Engineer', org: 'Tech Innovators Inc.', date: 'Mar 2021 - Dec 2023', desc: 'Developed scalable web applications using React and Node.js.', icon: Briefcase, color: 'bg-blue-500' },
    { type: 'CERT', title: 'AWS Solutions Architect', org: 'Amazon Web Services', date: 'Aug 2023', desc: 'Earned professional cloud certification.', icon: Award, color: 'bg-yellow-500' },
    { type: 'EDUCATION', title: 'B.Sc. Computer Science', org: 'Stanford University', date: 'Sep 2016 - May 2020', desc: 'Graduated with Honors. Specialized in AI and Distributed Systems.', icon: GraduationCap, color: 'bg-red-500' }
  ];

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-4xl font-bold">Career Timeline</h1>
        <p className="text-gray-500 mt-2">A comprehensive, chronological view of your professional journey.</p>
      </div>

      <div className="relative pl-8 border-l-2 border-gray-200 dark:border-gray-800 space-y-8 mt-12">
        {timeline.map((event, i) => {
          const Icon = event.icon;
          return (
            <div key={i} className="relative">
              <div className={`absolute -left-[41px] top-1 w-10 h-10 rounded-full flex items-center justify-center text-white shadow-lg ${event.color}`}>
                <Icon className="w-5 h-5" />
              </div>
              <Card className="ml-4 hover:shadow-md transition border-none shadow-sm bg-gray-50 dark:bg-gray-900/50">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row justify-between md:items-center gap-2 mb-2">
                    <h3 className="font-bold text-xl text-gray-900 dark:text-white">{event.title}</h3>
                    <span className="text-sm font-medium text-gray-500 bg-gray-200 dark:bg-gray-800 px-3 py-1 rounded-full w-fit">
                      {event.date}
                    </span>
                  </div>
                  <h4 className="font-semibold text-blue-600 mb-3">{event.org}</h4>
                  <p className="text-gray-600 dark:text-gray-400">{event.desc}</p>
                </CardContent>
              </Card>
            </div>
          )
        })}
      </div>
    </div>
  );
}
