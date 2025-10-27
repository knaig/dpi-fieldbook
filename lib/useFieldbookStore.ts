'use client';

import { useEffect, useState, useCallback } from 'react';
import type { Actor } from '@/types/actor';

const STORAGE_KEY = 'dpi-fieldbook-actors';

export function useFieldbookStore() {
  const [actors, setActors] = useState<Actor[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        try {
          setActors(JSON.parse(stored));
        } catch (e) {
          console.error('Failed to parse actors from localStorage', e);
        }
      }
      setIsHydrated(true);
    }
  }, []);

  // Save to localStorage whenever actors change
  useEffect(() => {
    if (isHydrated && typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(actors));
    }
  }, [actors, isHydrated]);

  const addActor = useCallback((actor: Omit<Actor, 'id'>) => {
    const newActor: Actor = {
      ...actor,
      id: Date.now().toString(),
    };
    setActors(prev => [...prev, newActor]);
    return newActor;
  }, []);

  const updateActor = useCallback((id: string, updates: Partial<Actor>) => {
    setActors(prev =>
      prev.map(actor => (actor.id === id ? { ...actor, ...updates } : actor))
    );
  }, []);

  const deleteActor = useCallback((id: string) => {
    setActors(prev => prev.filter(actor => actor.id !== id));
  }, []);

  const mergeActorIntelligence = useCallback(
    (id: string, intelligence: Partial<Actor>) => {
      setActors(prev =>
        prev.map(actor => (actor.id === id ? { ...actor, ...intelligence } : actor))
      );
    },
    []
  );

  const getActor = useCallback((id: string) => {
    return actors.find(actor => actor.id === id);
  }, [actors]);

  return {
    actors,
    isHydrated,
    addActor,
    updateActor,
    deleteActor,
    mergeActorIntelligence,
    getActor,
  };
}

