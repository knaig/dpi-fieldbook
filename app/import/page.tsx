'use client';

import { useState } from 'react';
import { useFieldbookStore } from '@/lib/useFieldbookStore';
import { Upload, CheckSquare, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { parseSummitInput } from '@/lib/parseSummitInput';

export default function ImportPage() {
  const [rawText, setRawText] = useState('');
  const [candidates, setCandidates] = useState<any[]>([]);
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());
  const { addActor } = useFieldbookStore();
  const router = useRouter();

  const handleParse = () => {
    try {
      const parsed = parseSummitInput(rawText);
      setCandidates(parsed);
      setSelectedIndices(new Set(Array.from({ length: parsed.length }, (_, i) => i)));
      toast.success(`Found ${parsed.length} potential actors`);
    } catch (error) {
      toast.error('Failed to parse input');
    }
  };

  const toggleSelection = (index: number) => {
    const newSet = new Set(selectedIndices);
    if (newSet.has(index)) {
      newSet.delete(index);
    } else {
      newSet.add(index);
    }
    setSelectedIndices(newSet);
  };

  const handleAddSelected = () => {
    try {
      let added = 0;
      selectedIndices.forEach(index => {
        const candidate = candidates[index];
        addActor({
          name: candidate.name,
          sector: candidate.sector,
          motive: candidate.summitContext || '',
          pitch: '',
          inclusionScore: 5,
          followupScore: candidate.summitContext ? 7 : 5,
          spokenTo: false,
          contactName: 'TBD',
          contactRole: 'TBD',
          notes: candidate.notes || '',
          nextAction: '',
          buckets: candidate.summitSourceTags || [],
          summitContext: candidate.summitContext,
          summitSourceTags: candidate.summitSourceTags,
        });
        added++;
      });
      toast.success(`Added ${added} actor${added > 1 ? 's' : ''}`);
      setRawText('');
      setCandidates([]);
      setSelectedIndices(new Set());
      router.push('/actors');
    } catch (error) {
      toast.error('Failed to add actors');
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Upload className="w-6 h-6 text-blue-500" />
        <h1 className="text-2xl font-bold text-slate-900">Import from DPI Summit</h1>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 mb-6">
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Paste HTML or text from the DPI Summit website
        </label>
        <textarea
          value={rawText}
          onChange={e => setRawText(e.target.value)}
          placeholder="Paste speakers, partners, panel members, or sponsors list here..."
          rows={12}
          className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
        />
        <button
          onClick={handleParse}
          disabled={!rawText.trim()}
          className="mt-4 flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors"
        >
          <CheckSquare className="w-4 h-4" />
          Parse & Preview
        </button>
      </div>

      {candidates.length > 0 && (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-slate-900">
              Found {candidates.length} Candidate{candidates.length > 1 ? 's' : ''}
            </h2>
            <button
              onClick={handleAddSelected}
              disabled={selectedIndices.size === 0}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Selected ({selectedIndices.size})
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-2 px-3">Select</th>
                  <th className="text-left py-2 px-3">Name</th>
                  <th className="text-left py-2 px-3">Sector</th>
                  <th className="text-left py-2 px-3">Context</th>
                  <th className="text-left py-2 px-3">Tags</th>
                </tr>
              </thead>
              <tbody>
                {candidates.map((candidate, i) => (
                  <tr
                    key={i}
                    className="border-b border-slate-100 hover:bg-slate-50"
                  >
                    <td className="py-3 px-3">
                      <input
                        type="checkbox"
                        checked={selectedIndices.has(i)}
                        onChange={() => toggleSelection(i)}
                        className="w-4 h-4"
                      />
                    </td>
                    <td className="py-3 px-3 font-medium">{candidate.name}</td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                        {candidate.sector}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-600">
                      {candidate.summitContext || '-'}
                    </td>
                    <td className="py-3 px-3">
                      {candidate.summitSourceTags?.join(', ') || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-6">
        <h3 className="font-semibold text-blue-900 mb-2">💡 Tip</h3>
        <p className="text-blue-800 text-sm">
          Copy the entire speakers page, partners list, or any text block from the DPI
          Summit website. The parser will extract organization names and try to infer
          sectors from context.
        </p>
      </div>
    </div>
  );
}

