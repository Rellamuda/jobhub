'use client';
import { useState } from 'react';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Heart, MessageCircle, Share2, Send, Globe, Image, Sparkles } from 'lucide-react';

export default function NetworkPage() {
  const [newContent, setNewContent] = useState('');
  const [posts, setPosts] = useState([
    {
      id: '1',
      author: 'Jane Doe',
      role: 'Senior React Developer',
      time: '2 hours ago',
      content: "Just earned my AWS Solutions Architect certification! 🚀 Really excited to apply these cloud patterns to my next big project. #cloud #aws #development",
      likes: 124,
      isLiked: false,
      comments: 18
    },
    {
      id: '2',
      author: 'Tech Innovators Inc.',
      role: 'Company Update',
      time: '5 hours ago',
      content: "We're expanding our remote engineering team! If you're passionate about AI and scalable systems, check out our latest job postings. We offer flexible hours and a great culture.",
      likes: 342,
      isLiked: false,
      comments: 56
    },
    {
      id: '3',
      author: 'John Smith',
      role: 'Product Designer',
      time: '1 day ago',
      content: "Here's a sneak peek at a new design system I've been working on over the weekend. Focused on accessibility and high-contrast dark modes. Feedback welcome! 🎨✨",
      likes: 89,
      isLiked: false,
      comments: 12
    }
  ]);

  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContent.trim()) return;

    const newPost = {
      id: String(Date.now()),
      author: 'You (JobHub Member)',
      role: 'Software Engineer',
      time: 'Just now',
      content: newContent.trim(),
      likes: 0,
      isLiked: false,
      comments: 0
    };

    setPosts([newPost, ...posts]);
    setNewContent('');
  };

  const toggleLike = (id: string) => {
    setPosts(posts.map(p => {
      if (p.id === id) {
        return {
          ...p,
          isLiked: !p.isLiked,
          likes: p.isLiked ? p.likes - 1 : p.likes + 1
        };
      }
      return p;
    }));
  };

  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto space-y-6">
      <div className="mb-6">
        <h1 className="text-3xl md:text-4xl font-bold flex items-center gap-3 text-white">
          <Globe className="w-8 h-8 text-cyan-400" />
          Professional Network
        </h1>
        <p className="text-gray-400 mt-2">Connect, share projects, and celebrate achievements with your peers.</p>
      </div>

      {/* Create Post Card */}
      <Card className="mb-8 border border-white/10 bg-[#161026] shadow-xl rounded-2xl overflow-hidden">
        <CardContent className="p-5 flex gap-4 items-start">
          <div className="w-11 h-11 bg-gradient-to-tr from-cyan-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0 shadow-md">
            Y
          </div>
          <form onSubmit={handleCreatePost} className="flex-1 space-y-3">
            <textarea 
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              placeholder="Share an update, project, or achievement..." 
              rows={3}
              className="w-full p-3 rounded-xl bg-white/[0.06] border border-white/15 text-white placeholder:text-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400 transition"
            />
            <div className="flex justify-between items-center flex-wrap gap-2 pt-1">
              <div className="flex gap-2">
                <Button 
                  type="button"
                  variant="outline" 
                  size="sm" 
                  className="border-white/15 bg-white/[0.04] text-cyan-300 hover:bg-white/10 hover:text-cyan-200 text-xs rounded-lg gap-1.5"
                >
                  <Image className="w-3.5 h-3.5" /> Post Photo
                </Button>
                <Button 
                  type="button"
                  variant="outline" 
                  size="sm" 
                  className="border-white/15 bg-white/[0.04] text-purple-300 hover:bg-white/10 hover:text-purple-200 text-xs rounded-lg gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" /> Share Project
                </Button>
              </div>
              <Button 
                type="submit" 
                className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-bold px-5 py-2 rounded-xl shadow-lg transition"
              >
                <Send className="w-4 h-4 mr-1.5" /> Post
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Posts Feed */}
      <div className="space-y-6">
        {posts.map(post => (
          <Card key={post.id} className="overflow-hidden border border-white/10 bg-[#161026] shadow-lg rounded-2xl">
            <CardHeader className="p-5 pb-3 flex flex-row items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md flex-shrink-0">
                {post.author.charAt(0)}
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-white text-base leading-snug">{post.author}</h3>
                <p className="text-xs text-gray-400 mt-0.5">{post.role} • {post.time}</p>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10 font-semibold text-xs rounded-lg px-3"
              >
                + Follow
              </Button>
            </CardHeader>
            <CardContent className="px-5 py-3 text-gray-200 text-sm leading-relaxed">
              <p className="whitespace-pre-wrap">{post.content}</p>
            </CardContent>
            <CardFooter className="px-5 py-3 border-t border-white/10 bg-white/[0.03] flex justify-between text-gray-300">
              <button 
                onClick={() => toggleLike(post.id)}
                className={`flex-1 flex items-center justify-center gap-2 py-1.5 rounded-lg text-xs font-semibold transition ${
                  post.isLiked ? 'text-rose-400 bg-rose-500/10' : 'text-gray-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <Heart className={`w-4 h-4 ${post.isLiked ? 'fill-rose-400' : ''}`} /> 
                {post.likes}
              </button>
              <button 
                className="flex-1 flex items-center justify-center gap-2 py-1.5 rounded-lg text-xs font-semibold text-gray-300 hover:text-white hover:bg-white/5 transition"
              >
                <MessageCircle className="w-4 h-4 text-cyan-400" /> 
                {post.comments}
              </button>
              <button 
                onClick={() => alert('Link copied to clipboard!')}
                className="flex-1 flex items-center justify-center gap-2 py-1.5 rounded-lg text-xs font-semibold text-gray-300 hover:text-white hover:bg-white/5 transition"
              >
                <Share2 className="w-4 h-4 text-purple-400" /> 
                Share
              </button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
