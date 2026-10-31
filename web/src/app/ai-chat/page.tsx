'use client';
import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Bot, Send, Trash2, Copy, Check, Sparkles, User, Briefcase, FileText, ArrowRight } from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
}

export default function AiChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'ai',
      text: "Hello! I am your JobHub AI Career & Recruitment Assistant. I can help you prepare for job interviews, critique your resume, benchmark market salaries, strategize B2B contractor bidding, or answer any recruitment questions. What topic would you like to explore today?",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const quickPrompts = [
    { label: 'Mock Interview Prep', prompt: 'Give me 3 realistic interview questions for my role and how to answer them with the STAR method.' },
    { label: 'Optimize Resume for ATS', prompt: 'How do I tailor my resume bullet points with quantifiable impact metrics for top ATS scores?' },
    { label: 'Salary Negotiation', prompt: 'What is the best script and strategy to negotiate a higher salary after receiving a job offer?' },
    { label: 'B2B Contractor Bidding', prompt: 'How should my company craft a competitive commercial project bid proposal to win clients?' },
    { label: 'Career Transition Roadmap', prompt: 'I want to transition into a higher-paying tech/management role. What 6-month roadmap should I follow?' },
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = async (messageText?: string) => {
    const textToSend = (messageText || input).trim();
    if (!textToSend || loading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userMsg]);
    if (!messageText) setInput('');
    setLoading(true);

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/ai/mentor/chat', {
        method: 'POST',
        headers,
        body: JSON.stringify({ message: textToSend }),
      });

      if (res.ok) {
        const data = await res.json();
        const replyText = data.reply || data.response || data.message || "I'm here to help you succeed. Let me know if you want to explore specific interview questions, resumes, or salary negotiation tactics.";
        const aiMsg: ChatMessage = {
          id: (Date.now() + 1).toString(),
          sender: 'ai',
          text: replyText,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages(prev => [...prev, aiMsg]);
      } else {
        const errorText = await res.text().catch(() => '');
        const aiMsg: ChatMessage = {
          id: (Date.now() + 1).toString(),
          sender: 'ai',
          text: "I'm temporarily experiencing high traffic, but here is a quick tip: Focus on highlighting quantifiable results on your profile and applications. Feel free to re-submit your question or try one of the quick suggestions below.",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages(prev => [...prev, aiMsg]);
      }
    } catch {
      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: "Could not reach the AI service right now. Please check your network connection and try again.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages(prev => [...prev, aiMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleClearChat = () => {
    if (confirm('Clear entire conversation?')) {
      setMessages([
        {
          id: 'welcome-cleared',
          sender: 'ai',
          text: "Chat cleared! What new topic or question would you like to explore today?",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    }
  };

  return (
    <main style={{ minHeight: 'calc(100vh - 70px)', backgroundColor: '#0A0A0A', color: 'white', display: 'flex', flexDirection: 'column' }}>
      {/* Top Header / Info Bar */}
      <div style={{
        backgroundColor: '#120B1C',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        padding: '1rem 2rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div style={{
            width: 44,
            height: 44,
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #00F0FF 0%, #6366F1 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 15px rgba(0, 240, 255, 0.3)',
          }}>
            <Bot style={{ width: 24, height: 24, color: '#000' }} />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              JobHub AI Chat <span style={{ fontSize: '0.75rem', background: 'rgba(0, 240, 255, 0.15)', color: '#00F0FF', padding: '2px 8px', borderRadius: '12px', border: '1px solid rgba(0, 240, 255, 0.3)' }}>Online</span>
            </h1>
            <p style={{ margin: 0, fontSize: '0.82rem', color: 'rgba(255, 255, 255, 0.6)' }}>
              Autonomous Career Mentor, ATS Resume Advisor &amp; Recruitment Assistant
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            onClick={handleClearChat}
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: 'rgba(255, 255, 255, 0.75)',
              padding: '0.5rem 1rem',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '0.85rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
            }}
          >
            <Trash2 style={{ width: 14, height: 14 }} /> Clear Chat
          </button>
          <Link
            href="/jobs"
            style={{
              background: 'rgba(0, 240, 255, 0.1)',
              border: '1px solid rgba(0, 240, 255, 0.3)',
              color: '#00F0FF',
              padding: '0.5rem 1rem',
              borderRadius: '8px',
              textDecoration: 'none',
              fontSize: '0.85rem',
              fontWeight: 600,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
            }}
          >
            <Briefcase style={{ width: 14, height: 14 }} /> Browse Jobs
          </Link>
        </div>
      </div>

      {/* Chat Messages Container */}
      <div style={{
        flex: 1,
        maxWidth: '1000px',
        width: '100%',
        margin: '0 auto',
        padding: '1.5rem 1.5rem 0.5rem',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.25rem',
      }}>
        {messages.map(msg => (
          <div
            key={msg.id}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: msg.sender === 'user' ? 'flex-end' : 'flex-start',
            }}
          >
            <div style={{
              display: 'flex',
              gap: '0.75rem',
              maxWidth: '85%',
              alignItems: 'flex-start',
              flexDirection: msg.sender === 'user' ? 'row-reverse' : 'row',
            }}>
              {/* Avatar Icon */}
              <div style={{
                width: 34,
                height: 34,
                borderRadius: '50%',
                background: msg.sender === 'user' ? 'rgba(99, 102, 241, 0.3)' : 'rgba(0, 240, 255, 0.2)',
                border: msg.sender === 'user' ? '1px solid rgba(99, 102, 241, 0.6)' : '1px solid rgba(0, 240, 255, 0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}>
                {msg.sender === 'user' ? (
                  <User style={{ width: 18, height: 18, color: '#A5B4FC' }} />
                ) : (
                  <Sparkles style={{ width: 18, height: 18, color: '#00F0FF' }} />
                )}
              </div>

              {/* Message Bubble */}
              <div style={{
                backgroundColor: msg.sender === 'user' ? '#1E1B4B' : '#120B1C',
                border: msg.sender === 'user' ? '1px solid rgba(99, 102, 241, 0.4)' : '1px solid rgba(0, 240, 255, 0.2)',
                padding: '1rem 1.25rem',
                borderRadius: msg.sender === 'user' ? '18px 4px 18px 18px' : '4px 18px 18px 18px',
                color: 'white',
                lineHeight: 1.65,
                fontSize: '0.96rem',
                whiteSpace: 'pre-wrap',
                boxShadow: '0 4px 15px rgba(0, 0, 0, 0.3)',
                position: 'relative',
              }}>
                {msg.text}

                {/* Actions & Timestamp */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginTop: '0.6rem',
                  paddingTop: '0.4rem',
                  borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                  fontSize: '0.75rem',
                  color: 'rgba(255, 255, 255, 0.4)',
                  gap: '1rem',
                }}>
                  <span>{msg.timestamp}</span>
                  {msg.sender === 'ai' && (
                    <button
                      onClick={() => handleCopy(msg.id, msg.text)}
                      title="Copy response"
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: copiedId === msg.id ? '#10B981' : 'rgba(255, 255, 255, 0.5)',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.3rem',
                        fontSize: '0.75rem',
                      }}
                    >
                      {copiedId === msg.id ? (
                        <>
                          <Check style={{ width: 12, height: 12 }} /> Copied
                        </>
                      ) : (
                        <>
                          <Copy style={{ width: 12, height: 12 }} /> Copy
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}

        {loading && (
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <div style={{
              width: 34,
              height: 34,
              borderRadius: '50%',
              background: 'rgba(0, 240, 255, 0.2)',
              border: '1px solid rgba(0, 240, 255, 0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Bot style={{ width: 18, height: 18, color: '#00F0FF' }} />
            </div>
            <div style={{
              backgroundColor: '#120B1C',
              border: '1px solid rgba(0, 240, 255, 0.2)',
              padding: '0.8rem 1.25rem',
              borderRadius: '4px 18px 18px 18px',
              color: '#00F0FF',
              fontSize: '0.9rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}>
              <span>Thinking &amp; composing advice...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Topics Prompt Chips */}
      <div style={{
        maxWidth: '1000px',
        width: '100%',
        margin: '0 auto',
        padding: '0.75rem 1.5rem',
        display: 'flex',
        gap: '0.5rem',
        overflowX: 'auto',
        scrollbarWidth: 'none',
      }}>
        {quickPrompts.map((qp, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(qp.prompt)}
            disabled={loading}
            style={{
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              color: 'rgba(255, 255, 255, 0.85)',
              padding: '0.45rem 0.9rem',
              borderRadius: '20px',
              fontSize: '0.82rem',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = '#00F0FF';
              e.currentTarget.style.color = '#00F0FF';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.12)';
              e.currentTarget.style.color = 'rgba(255, 255, 255, 0.85)';
            }}
          >
            ⚡ {qp.label}
          </button>
        ))}
      </div>

      {/* Bottom Message Input Box */}
      <div style={{
        borderTop: '1px solid rgba(255, 255, 255, 0.1)',
        backgroundColor: '#120B1C',
        padding: '1rem 1.5rem 1.5rem',
      }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <form
            onSubmit={e => {
              e.preventDefault();
              handleSend();
            }}
            style={{
              display: 'flex',
              gap: '0.75rem',
              alignItems: 'center',
            }}
          >
            <input
              type="text"
              placeholder="Ask anything about interviews, resumes, salaries, or hiring..."
              value={input}
              onChange={e => setInput(e.target.value)}
              disabled={loading}
              className="input-field"
              style={{
                flex: 1,
                padding: '0.9rem 1.25rem',
                borderRadius: '12px',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: 'white',
                fontSize: '1rem',
              }}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              style={{
                background: input.trim() && !loading ? '#00F0FF' : 'rgba(255, 255, 255, 0.1)',
                color: input.trim() && !loading ? '#000' : 'rgba(255, 255, 255, 0.4)',
                border: 'none',
                width: 48,
                height: 48,
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: input.trim() && !loading ? 'pointer' : 'not-allowed',
                boxShadow: input.trim() && !loading ? '0 4px 15px rgba(0, 240, 255, 0.35)' : 'none',
                flexShrink: 0,
              }}
            >
              <Send style={{ width: 20, height: 20 }} />
            </button>
          </form>
          <p style={{ margin: '0.6rem 0 0 0', textAlign: 'center', fontSize: '0.78rem', color: 'rgba(255, 255, 255, 0.45)' }}>
            JobHub AI provides automated career and interview assistance. Verify critical employment decisions independently.
          </p>
        </div>
      </div>
    </main>
  );
}
