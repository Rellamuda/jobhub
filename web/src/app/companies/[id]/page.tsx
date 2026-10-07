'use client';
import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Building2, Award, Users, MapPin, PlayCircle } from 'lucide-react';

export default function CompanyProfilePage({ params }: { params: { id: string } }) {
  // Mock data for Employer Branding
  const [company] = useState({
    name: 'Tech Innovators Inc.',
    industry: 'Software Development',
    location: 'San Francisco, CA',
    banner: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&h=300',
    logo: 'https://ui-avatars.com/api/?name=TI&background=0D8ABC&color=fff',
    officeTourUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    benefits: ['100% Remote Options', 'Unlimited PTO', 'Health & Dental', '401k Match'],
    awards: ['Best Workplace 2025', 'Innovation in AI 2024'],
    teamStories: [
      { author: 'Sarah J.', role: 'Lead Engineer', story: 'Working here has accelerated my career. The culture of continuous learning is unparalleled.' },
      { author: 'Mike T.', role: 'Product Manager', story: 'I love that my ideas are heard from day one. We move fast and build things that matter.' }
    ]
  });

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      {/* Banner */}
      <div className="h-64 w-full bg-cover bg-center relative" style={{ backgroundImage: `url(${company.banner})` }}>
        <div className="absolute inset-0 bg-black/40"></div>
      </div>

      <div className="max-w-6xl mx-auto px-6 -mt-20 relative z-10 space-y-8">
        {/* Header Header */}
        <Card>
          <CardContent className="p-8 flex flex-col md:flex-row gap-6 items-center md:items-start">
            <img src={company.logo} alt="Logo" className="w-32 h-32 rounded-xl shadow-lg border-4 border-white" />
            <div className="flex-1 text-center md:text-left space-y-2">
              <h1 className="text-4xl font-bold text-gray-900">{company.name}</h1>
              <div className="flex flex-wrap justify-center md:justify-start gap-4 text-gray-600 font-medium">
                <span className="flex items-center gap-1"><Building2 className="w-4 h-4" /> {company.industry}</span>
                <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {company.location}</span>
              </div>
              <p className="mt-4 text-gray-700 max-w-3xl">
                We are on a mission to build scalable AI systems that empower businesses globally. Join our diverse and driven team.
              </p>
            </div>
            <Button className="w-full md:w-auto bg-blue-600">Follow Company</Button>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content Column */}
          <div className="lg:col-span-2 space-y-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><PlayCircle className="w-5 h-5 text-blue-600" /> Virtual Office Tour</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="aspect-video bg-gray-200 rounded-lg flex items-center justify-center text-gray-500 cursor-pointer hover:bg-gray-300 transition relative">
                  <PlayCircle className="w-16 h-16 opacity-50" />
                  <span className="absolute bottom-4 left-4 font-bold text-white shadow-sm">Watch Tour</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Users className="w-5 h-5 text-blue-600" /> Team Stories</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                {company.teamStories.map((story, i) => (
                  <div key={i} className="p-4 rounded-xl bg-blue-50/50 border border-blue-100 space-y-2">
                    <p className="italic text-gray-700">"{story.story}"</p>
                    <div>
                      <p className="font-bold text-gray-900">{story.author}</p>
                      <p className="text-xs text-blue-600">{story.role}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar Column */}
          <div className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>Benefits & Perks</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {company.benefits.map((b, i) => (
                    <li key={i} className="flex items-center gap-3 text-gray-700">
                      <div className="w-2 h-2 rounded-full bg-green-500"></div> {b}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Award className="w-5 h-5 text-yellow-500" /> Awards</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-4">
                  {company.awards.map((a, i) => (
                    <li key={i} className="flex items-start gap-3 bg-yellow-50/50 p-3 rounded-lg border border-yellow-100">
                      <Award className="w-5 h-5 text-yellow-600 shrink-0" />
                      <span className="font-medium text-gray-800">{a}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
