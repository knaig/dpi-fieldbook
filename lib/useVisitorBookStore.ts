'use client';

import { useEffect, useState, useCallback } from 'react';
import type { VisitorMessage } from '@/types/visitorBook';

const STORAGE_KEY = 'dpi-visitor-book';

export function useVisitorBookStore() {
  const [messages, setMessages] = useState<VisitorMessage[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setMessages(parsed);
        } catch (e) {
          console.error('Failed to parse visitor messages from localStorage', e);
        }
      }
      setIsHydrated(true);
    }
  }, []);

  // Save to localStorage whenever messages change
  useEffect(() => {
    if (isHydrated && typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    }
  }, [messages, isHydrated]);

  const addMessage = useCallback((message: Omit<VisitorMessage, 'id' | 'timestamp'>) => {
    const newMessage: VisitorMessage = {
      ...message,
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
    };
    
    setMessages(prev => [newMessage, ...prev]); // Add new messages to the top
    return newMessage;
  }, []);

  const deleteMessage = useCallback((id: string) => {
    setMessages(prev => prev.filter(msg => msg.id !== id));
  }, []);

  const clearAllMessages = useCallback(() => {
    setMessages([]);
  }, []);

  return {
    messages,
    isHydrated,
    addMessage,
    deleteMessage,
    clearAllMessages,
  };
}
