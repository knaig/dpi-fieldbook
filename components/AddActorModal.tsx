'use client';

import { useState } from 'react';
import { useFieldbookStore } from '@/lib/useFieldbookStore';
import { X } from 'lucide-react';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

export default function AddActorModal({ onClose }: { onClose: () => void }) {
  const { addActor } = useFieldbookStore();
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    sector: 'Government',
    motive: '',
    pitch: '',
    inclusionScore: 5,
    followupScore: 5,
    spokenTo: false,
    contactName: '',
    contactRole: '',
    booth: '',
    notes: '',
    nextAction: '',
    buckets: [] as string[],
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const newActor = addActor({
        ...formData,
        contactName: formData.contactName || 'TBD',
        contactRole: formData.contactRole || 'TBD',
      });
      toast.success('Actor added successfully');
      onClose();
      router.push(`/actors/${newActor.id}`);
    } catch (error) {
      toast.error('Failed to add actor');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-slate-200 p-4 flex justify-between items-center">
          <h2 className="text-xl font-bold text-slate-900">Add New Actor</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Name *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Sector *
              </label>
              <select
                required
                value={formData.sector}
                onChange={e => setFormData({ ...formData, sector: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Government">Government</option>
                <option value="Multilateral">Multilateral</option>
                <option value="Funder">Funder</option>
                <option value="Research">Research</option>
                <option value="NGO">NGO</option>
                <option value="Corporate">Corporate</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Booth
              </label>
              <input
                type="text"
                value={formData.booth}
                onChange={e => setFormData({ ...formData, booth: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Inclusion Score
              </label>
              <input
                type="number"
                min="0"
                max="10"
                value={formData.inclusionScore}
                onChange={e =>
                  setFormData({ ...formData, inclusionScore: Number(e.target.value) })
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Follow-up Score
              </label>
              <input
                type="number"
                min="0"
                max="10"
                value={formData.followupScore}
                onChange={e =>
                  setFormData({ ...formData, followupScore: Number(e.target.value) })
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Contact Name
              </label>
              <input
                type="text"
                value={formData.contactName}
                onChange={e =>
                  setFormData({ ...formData, contactName: e.target.value })
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Contact Role
              </label>
              <input
                type="text"
                value={formData.contactRole}
                onChange={e =>
                  setFormData({ ...formData, contactRole: e.target.value })
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Motive
            </label>
            <textarea
              value={formData.motive}
              onChange={e => setFormData({ ...formData, motive: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Pitch
            </label>
            <textarea
              value={formData.pitch}
              onChange={e => setFormData({ ...formData, pitch: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={e => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Next Action
            </label>
            <input
              type="text"
              value={formData.nextAction}
              onChange={e =>
                setFormData({ ...formData, nextAction: e.target.value })
              }
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Add Actor
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

