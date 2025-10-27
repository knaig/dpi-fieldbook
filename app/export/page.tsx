'use client';

import { useFieldbookStore } from '@/lib/useFieldbookStore';
import { Download, Copy, FileJson, FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import { useState, useRef } from 'react';

export default function ExportPage() {
  const { actors, isHydrated } = useFieldbookStore();
  const [markdown, setMarkdown] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const generateMarkdown = () => {
    let md = '# DPI Summit Fieldbook Export\n\n';
    md += `**Generated:** ${new Date().toLocaleString()}\n\n`;
    md += `**Total Actors:** ${actors.length}\n\n`;
    md += `**Spoken To:** ${actors.filter(a => a.spokenTo).length}\n\n`;
    md += `---\n\n`;

    for (const actor of actors) {
      md += `## ${actor.name}\n\n`;

      md += `**Sector:** ${actor.sector}  \n`;
      md += `**Follow-up Score:** ${actor.followupScore}/10  \n`;
      md += `**Inclusion Score:** ${actor.inclusionScore}/10  \n`;
      md += `**Status:** ${actor.spokenTo ? '✓ Spoken' : 'Not yet spoken'}  \n\n`;

      if (actor.summitContext) {
        md += `### Summit Context\n\n${actor.summitContext}\n\n`;
      }

      if (actor.roleInEcosystem) {
        md += `### Role in Ecosystem\n\n${actor.roleInEcosystem}\n\n`;
      }

      if (actor.wantsNeeds) {
        md += `### Wants & Needs\n\n${actor.wantsNeeds}\n\n`;
      }

      if (actor.engagementStrategy) {
        md += `### How to Engage\n\n${actor.engagementStrategy}\n\n`;
      }

      if (actor.leverageForAI4Inclusion) {
        md += `### Leverage for AI4Inclusion/AI4X\n\n${actor.leverageForAI4Inclusion}\n\n`;
      }

      if (actor.nextAction) {
        md += `### Next Action\n\n${actor.nextAction}\n\n`;
      }

      if (actor.notes) {
        md += `### My Notes\n\n${actor.notes}\n\n`;
      }

      if (actor.interestTopics && actor.interestTopics.length > 0) {
        md += `**Interest Topics:** ${actor.interestTopics.join(', ')}\n\n`;
      }

      if (actor.publications && actor.publications.length > 0) {
        md += `**Publications:**\n\n`;
        for (const pub of actor.publications) {
          md += `- ${pub}\n`;
        }
        md += '\n';
      }

      md += `---\n\n`;
    }

    setMarkdown(md);
  };

  const handleDownloadJSON = () => {
    const data = {
      exportedAt: new Date().toISOString(),
      actors,
      stats: {
        total: actors.length,
        spokenTo: actors.filter(a => a.spokenTo).length,
        averageFollowupScore:
          actors.reduce((sum, a) => sum + a.followupScore, 0) / actors.length,
        averageInclusionScore:
          actors.reduce((sum, a) => sum + a.inclusionScore, 0) / actors.length,
      },
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dpi-fieldbook-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('JSON downloaded');
  };

  const handleCopyMarkdown = async () => {
    await navigator.clipboard.writeText(markdown);
    toast.success('Markdown copied to clipboard');
  };

  const handleDownloadMarkdown = () => {
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dpi-fieldbook-${new Date().toISOString().split('T')[0]}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Markdown downloaded');
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
      <div className="flex items-center gap-3 mb-6">
        <Download className="w-6 h-6 text-green-500" />
        <h1 className="text-2xl font-bold text-slate-900">Export</h1>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 mb-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Export Options</h2>

        <div className="space-y-4">
          <button
            onClick={generateMarkdown}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <FileText className="w-5 h-5" />
            Generate Markdown Summary
          </button>

          <button
            onClick={handleDownloadJSON}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <Download className="w-5 h-5" />
            Download JSON
          </button>
        </div>
      </div>

      {markdown && (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-slate-900">
              Markdown Summary
            </h2>
            <div className="flex gap-2">
              <button
                onClick={handleCopyMarkdown}
                className="flex items-center gap-2 px-3 py-1 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50"
              >
                <Copy className="w-4 h-4" />
                Copy
              </button>
              <button
                onClick={handleDownloadMarkdown}
                className="flex items-center gap-2 px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                <Download className="w-4 h-4" />
                Download
              </button>
            </div>
          </div>

          <textarea
            ref={textareaRef}
            value={markdown}
            readOnly
            rows={20}
            className="w-full px-4 py-3 border border-slate-300 rounded-lg font-mono text-sm"
          />
        </div>
      )}

      {actors.length === 0 && (
        <div className="bg-white rounded-xl p-12 shadow-sm border border-slate-200 text-center">
          <p className="text-slate-600 mb-4">No actors to export yet</p>
          <p className="text-sm text-slate-500">
            Start by importing actors or adding them manually.
          </p>
        </div>
      )}
    </div>
  );
}

