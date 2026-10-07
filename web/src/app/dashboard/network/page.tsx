'use client';
import { useState } from 'react';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Heart, MessageCircle, Share2, Send, Globe } from 'lucide-react';

export default function NetworkPage() {
  const [posts] = useState([
    {
      id: '1',
      author: 'Jane Doe',
      role: 'Senior React Developer',
      time: '2 hours ago',
      content: "Just earned my AWS Solutions Architect certification! 🚀 Really excited to apply these cloud patterns to my next big project. #cloud #aws #development",
      likes: 124,
      comments: 18
    },
    {
      id: '2',
      author: 'Tech Innovators Inc.',
      role: 'Company Update',
      time: '5 hours ago',
      content: "We're expanding our remote engineering team! If you're passionate about AI and scalable systems, check out our latest job postings. We offer flexible hours and a great culture.",
      likes: 342,
      comments: 56
    },
    {
      id: '3',
      author: 'John Smith',
      role: 'Product Designer',
      time: '1 day ago',
      content: "Here's a sneak peek at a new design system I've been working on over the weekend. Focused on accessibility and high-contrast dark modes. Feedback welcome! 🎨✨",
      likes: 89,
      comments: 12
    }
  ]);

  return (
    <div className="p-8 max-w-3xl mx-auto space-y-6">
      <div className="mb-6">
        <h1 className="text-4xl font-bold flex items-center gap-3">
          <Globe className="w-8 h-8 text-blue-600" />
          Professional Network
        </h1>
        <p className="text-gray-500 mt-2">Connect, share projects, and celebrate achievements with your peers.</p>
      </div>

      <Card className="mb-8">
        <CardContent className="p-4 flex gap-4">
          <div className="w-12 h-12 bg-gray-200 rounded-full flex-shrink-0"></div>
          <div className="flex-1 space-y-3">
            <Input placeholder="Share an update, project, or achievement..." className="w-full bg-gray-50" />
            <div className="flex justify-between items-center">
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="text-blue-600">Post Photo</Button>
                <Button variant="outline" size="sm" className="text-purple-600">Share Project</Button>
              </div>
              <Button className="bg-blue-600 text-white"><Send className="w-4 h-4 mr-2" /> Post</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-6">
        {posts.map(post => (
          <Card key={post.id} className="overflow-hidden">
            <CardHeader className="p-4 pb-2 flex flex-row items-center gap-4">
              <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-bold">
                {post.author.charAt(0)}
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-gray-900 dark:text-white">{post.author}</h3>
                <p className="text-xs text-gray-500">{post.role} • {post.time}</p>
              </div>
              <Button variant="ghost" size="sm" className="text-blue-600 font-semibold">+ Follow</Button>
            </CardHeader>
            <CardContent className="p-4 pt-2 text-gray-800 dark:text-gray-200">
              <p className="whitespace-pre-wrap">{post.content}</p>
            </CardContent>
            <CardFooter className="p-4 border-t bg-gray-50/50 flex justify-between text-gray-500">
              <Button variant="ghost" className="flex-1 hover:text-blue-600 gap-2"><Heart className="w-4 h-4" /> {post.likes}</Button>
              <Button variant="ghost" className="flex-1 hover:text-blue-600 gap-2"><MessageCircle className="w-4 h-4" /> {post.comments}</Button>
              <Button variant="ghost" className="flex-1 hover:text-blue-600 gap-2"><Share2 className="w-4 h-4" /> Share</Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
