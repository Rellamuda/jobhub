'use client';
import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Bot, Send } from 'lucide-react';

export default function AiMentorPage() {
  const [messages, setMessages] = useState([{ role: 'ai', content: 'Hi! I am your AI Mentor. How can I help you advance your career today?' }]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim()) return;
    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/ai/mentor/chat', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ message: userMsg })
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: 'ai', content: data.reply || data.message || 'No response.' }]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-3xl mx-auto h-[80vh] flex flex-col">
      <div className="mb-6">
        <h1 className="text-4xl font-bold flex items-center gap-3">
          <Bot className="w-8 h-8 text-indigo-500" />
          AI Career Mentor
        </h1>
        <p className="text-gray-500 mt-2">Get instant advice on interviews, CVs, and career paths.</p>
      </div>

      <Card className="flex-1 flex flex-col overflow-hidden">
        <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] rounded-2xl p-4 ${msg.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-gray-100 dark:bg-gray-800'}`}>
                {msg.content}
              </div>
            </div>
          ))}
          {loading && <div className="text-gray-400 animate-pulse">AI is typing...</div>}
        </CardContent>
        <CardFooter className="p-4 border-t">
          <form onSubmit={e => { e.preventDefault(); sendMessage(); }} className="flex w-full gap-2">
            <Input value={input} onChange={e => setInput(e.target.value)} placeholder="e.g. How do I become a project manager?" className="flex-1" />
            <Button type="submit" disabled={loading}><Send className="w-4 h-4" /></Button>
          </form>
        </CardFooter>
      </Card>
    </div>
  );
}
