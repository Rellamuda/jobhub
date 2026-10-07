'use client';
import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Wallet, ShieldCheck, GraduationCap, Award, FileText, UploadCloud } from 'lucide-react';

export default function DigitalWallet() {
  const [credentials] = useState([
    { id: '1', type: 'DEGREE', name: 'B.Sc. Computer Science', issuer: 'Stanford University', status: 'VERIFIED', date: '2020-05-15', icon: GraduationCap },
    { id: '2', type: 'CERTIFICATE', name: 'AWS Solutions Architect', issuer: 'Amazon Web Services', status: 'VERIFIED', date: '2023-08-10', icon: Award },
    { id: '3', type: 'ID', name: 'National Passport', issuer: 'Govt. Issued', status: 'PENDING', date: '2024-01-20', icon: FileText }
  ]);

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold flex items-center gap-3">
            <Wallet className="w-8 h-8 text-blue-600" />
            Digital Credential Wallet
          </h1>
          <p className="text-gray-500 mt-2">Securely store your degrees, certificates, and IDs. Verified credentials boost your application.</p>
        </div>
        <Button className="gap-2"><UploadCloud className="w-4 h-4"/> Add Credential</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {credentials.map(cred => {
          const Icon = cred.icon;
          return (
            <Card key={cred.id} className="relative overflow-hidden group">
              <div className={`absolute top-0 right-0 p-4 ${cred.status === 'VERIFIED' ? 'text-green-500' : 'text-yellow-500'}`}>
                {cred.status === 'VERIFIED' && <ShieldCheck className="w-6 h-6" />}
              </div>
              <CardContent className="p-6 space-y-4">
                <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                  <Icon className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-500 tracking-wider mb-1">{cred.type}</p>
                  <h3 className="font-bold text-lg text-gray-900 leading-tight">{cred.name}</h3>
                  <p className="text-sm text-gray-600 mt-1">{cred.issuer}</p>
                </div>
                <div className="flex justify-between items-end pt-4 border-t border-gray-100">
                  <p className="text-xs text-gray-400">Issued: {cred.date}</p>
                  <span className={`text-xs font-bold px-2 py-1 rounded ${cred.status === 'VERIFIED' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                    {cred.status}
                  </span>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  );
}
