'use client';

import { useFieldbookStore } from '@/lib/useFieldbookStore';
import { Lightbulb, Target, Calendar } from 'lucide-react';
import { use, useState } from 'react';
import Link from 'next/link';

export default function ReflectPage() {
  const { actors, isHydrated } = useFieldbookStore();
  const [reflection, setReflection] = useState({
    whatMattered: '',
    flowState: '',
    tomorrowFocus: '',
  });

  const handleSave = () => {
    const data = {
      ...reflection,
      timestamp: new Date().toISOString(),
      actorsCount: actors.length,
    };
    localStorage.setItem('dpi-reflection', JSON.stringify(data));
    alert('Reflection saved!');
    setReflection({ whatMattered: '', flowState: '', tomorrowFocus: '' });
  };

  if (!isHydrated) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <p className="text-slate-600">Loading...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 mb-6">
        <div className="flex items-center gap-3 mb-6">
          <Lightbulb className="w-6 h-6 text-yellow-500" />
          <h1 className="text-2xl font-bold text-slate-900">Daily Reflection</h1>
        </div>

        <div className="space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Lightbulb className="w-5 h-5 text-purple-500" />
              <label className="text-lg font-semibold text-slate-900">
                What mattered today?
              </label>
            </div>
            <textarea
              value={reflection.whatMattered}
              onChange={e =>
                setReflection({ ...reflection, whatMattered: e.target.value })
              }
              placeholder="What conversations, insights, or connections stand out from today?"
              rows={6}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div>
            <div className="flex items-center gap-2 mb-3">
              <Target className="w-5 h-5 text-blue-500" />
              <label className="text-lg font-semibold text-slate-900">
                Where was I in flow?
              </label>
            </div>
            <textarea
              value={reflection.flowState}
              onChange={e =>
                setReflection({ ...reflection, flowState: e.target.value })
              }
              placeholder="When did you feel most engaged and energized?"
              rows={6}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="w-5 h-5 text-green-500" />
              <label className="text-lg font-semibold text-slate-900">
                Tomorrow's focus
              </label>
            </div>
            <textarea
              value={reflection.tomorrowFocus}
              onChange={e =>
                setReflection({ ...reflection, tomorrowFocus: e.target.value })
              }
              placeholder="What should be your top priorities for tomorrow?"
              rows={6}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
        </div>

        <div className="mt-8 flex justify-end">
          <button
            onClick={handleSave}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
          >
            Save Reflection
          </button>
        </div>
      </div>

      <div className="bg-slate-50 border border-slate-200 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Quick Stats</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-3xl font-bold text-slate-900">{actors.length}</p>
            <p className="text-sm text-slate-600">Total Actors</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-slate-900">
              {actors.filter(a => a.spokenTo).length}
            </p>
            <p className="text-sm text-slate-600">Conversations</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-slate-900">
              {actors.filter(a => !a.spokenTo && a.followupScore > 7).length}
            </p>
            <p className="text-sm text-slate-600">High Priority</p>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <Link
          href="/actors"
          className="block text-center px-6 py-3 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors"
        >
          View All Actors →
        </Link>
      </div>
    </div>
  );
}

