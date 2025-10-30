'use client';

import { useState } from 'react';
import { useVisitorBookStore } from '@/lib/useVisitorBookStore';
import { BookOpen, Send, Trash2, Mail, User } from 'lucide-react';
import toast from 'react-hot-toast';

export default function VisitorBookPage() {
  const { messages, isHydrated, addMessage, deleteMessage } = useVisitorBookStore();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim() || !message.trim()) {
      toast.error('Name and message are required');
      return;
    }

    setIsSubmitting(true);
    try {
      addMessage({
        name: name.trim(),
        email: email.trim() || undefined,
        message: message.trim(),
      });
      
      // Reset form
      setName('');
      setEmail('');
      setMessage('');
      toast.success('Thank you for signing our visitor book! 📝');
    } catch (error) {
      console.error('Failed to add message:', error);
      toast.error('Failed to add message');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  if (!isHydrated) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <p className="text-slate-600">Loading...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 pb-24">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <BookOpen className="w-8 h-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-slate-900">Visitor Book</h1>
        </div>
        <p className="text-slate-600">
          Leave your mark! Sign our visitor book and share your thoughts with us.
        </p>
      </div>

      {/* Sign the Book Form */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 mb-8">
        <h2 className="text-xl font-semibold text-slate-900 mb-4">Sign the Book</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-2">
              Name <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                required
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">
              Email <span className="text-slate-400">(optional)</span>
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your.email@example.com"
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label htmlFor="message" className="block text-sm font-medium text-slate-700 mb-2">
              Message <span className="text-red-500">*</span>
            </label>
            <textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Share your thoughts, feedback, or just say hello..."
              required
              rows={4}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors font-medium"
          >
            <Send className="w-5 h-5" />
            {isSubmitting ? 'Signing...' : 'Sign the Book'}
          </button>
        </form>
      </div>

      {/* Messages List */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-slate-900">
            Messages ({messages.length})
          </h2>
        </div>

        {messages.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500">No messages yet. Be the first to sign!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className="p-4 bg-slate-50 rounded-lg border border-slate-200 hover:border-slate-300 transition-colors"
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-semibold text-slate-900">{msg.name}</h3>
                    {msg.email && (
                      <p className="text-sm text-slate-600">{msg.email}</p>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      if (confirm('Delete this message?')) {
                        deleteMessage(msg.id);
                        toast.success('Message deleted');
                      }
                    }}
                    className="text-slate-400 hover:text-red-600 transition-colors"
                    title="Delete message"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-slate-700 whitespace-pre-wrap mb-2">{msg.message}</p>
                <p className="text-xs text-slate-500">{formatDate(msg.timestamp)}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
