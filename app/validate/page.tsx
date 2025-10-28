'use client';

import { useState, useEffect } from 'react';
import { useFieldbookStore } from '@/lib/useFieldbookStore';
import { CheckCircle2, AlertCircle, XCircle, RefreshCw } from 'lucide-react';

interface ValidationIssue {
  actorName: string;
  actorId: string;
  issue: string;
  severity: 'error' | 'warning' | 'info';
  field?: string;
}

export default function ValidatePage() {
  const { actors, isHydrated } = useFieldbookStore();
  const [issues, setIssues] = useState<ValidationIssue[]>([]);
  const [summary, setSummary] = useState({ total: 0, errors: 0, warnings: 0, good: 0 });

  useEffect(() => {
    if (isHydrated && actors.length > 0) {
      validateActors();
    }
  }, [isHydrated, actors]);

  const validateActors = () => {
    const validationIssues: ValidationIssue[] = [];

    actors.forEach(actor => {
      // Required fields
      if (!actor.name || actor.name.trim() === '') {
        validationIssues.push({
          actorName: actor.name || 'Unknown',
          actorId: actor.id,
          issue: 'Missing name',
          severity: 'error',
          field: 'name'
        });
      }

      if (!actor.sector || actor.sector.trim() === '') {
        validationIssues.push({
          actorName: actor.name,
          actorId: actor.id,
          issue: 'Missing sector',
          severity: 'error',
          field: 'sector'
        });
      }

      if (!actor.contactName || actor.contactName.trim() === '') {
        validationIssues.push({
          actorName: actor.name,
          actorId: actor.id,
          issue: 'Missing contact name',
          severity: 'warning',
          field: 'contactName'
        });
      }

      if (!actor.contactRole || actor.contactRole.trim() === '') {
        validationIssues.push({
          actorName: actor.name,
          actorId: actor.id,
          issue: 'Missing contact role',
          severity: 'warning',
          field: 'contactRole'
        });
      }

      // Scores
      if (typeof actor.inclusionScore !== 'number' || actor.inclusionScore < 0 || actor.inclusionScore > 10) {
        validationIssues.push({
          actorName: actor.name,
          actorId: actor.id,
          issue: `Invalid inclusion score: ${actor.inclusionScore}`,
          severity: 'error',
          field: 'inclusionScore'
        });
      }

      if (typeof actor.followupScore !== 'number' || actor.followupScore < 0 || actor.followupScore > 10) {
        validationIssues.push({
          actorName: actor.name,
          actorId: actor.id,
          issue: `Invalid follow-up score: ${actor.followupScore}`,
          severity: 'error',
          field: 'followupScore'
        });
      }

      // Enrichment fields (warnings if missing)
      if (!actor.roleInEcosystem) {
        validationIssues.push({
          actorName: actor.name,
          actorId: actor.id,
          issue: 'Not enriched - missing role in ecosystem',
          severity: 'warning',
          field: 'roleInEcosystem'
        });
      }

      if (!actor.interestTopics || actor.interestTopics.length === 0) {
        validationIssues.push({
          actorName: actor.name,
          actorId: actor.id,
          issue: 'Not enriched - missing interest topics',
          severity: 'warning',
          field: 'interestTopics'
        });
      }

      if (!actor.profileImage) {
        validationIssues.push({
          actorName: actor.name,
          actorId: actor.id,
          issue: 'No profile image',
          severity: 'info',
          field: 'profileImage'
        });
      }

      if (!actor.linkedinUrl) {
        validationIssues.push({
          actorName: actor.name,
          actorId: actor.id,
          issue: 'No LinkedIn profile found',
          severity: 'info',
          field: 'linkedinUrl'
        });
      }

      if (!actor.xProfileUrl) {
        validationIssues.push({
          actorName: actor.name,
          actorId: actor.id,
          issue: 'No X/Twitter profile found',
          severity: 'info',
          field: 'xProfileUrl'
        });
      }

      // Publications check
      if (!actor.publications || actor.publications.length === 0) {
        validationIssues.push({
          actorName: actor.name,
          actorId: actor.id,
          issue: 'No publications found',
          severity: 'info',
          field: 'publications'
        });
      }
    });

    setIssues(validationIssues);

    // Calculate summary
    const errors = validationIssues.filter(i => i.severity === 'error').length;
    const warnings = validationIssues.filter(i => i.severity === 'warning').length;
    const good = actors.length - errors - warnings;
    
    setSummary({
      total: actors.length,
      errors,
      warnings,
      good
    });
  };

  if (!isHydrated) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <p className="text-slate-600">Loading...</p>
      </div>
    );
  }

  if (actors.length === 0) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8 text-center">
        <p className="text-slate-600">No actors to validate. Import actors first.</p>
      </div>
    );
  }

  const errors = issues.filter(i => i.severity === 'error');
  const warnings = issues.filter(i => i.severity === 'warning');
  const infos = issues.filter(i => i.severity === 'info');

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Data Validation</h1>
        <button
          onClick={validateActors}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <RefreshCw className="w-4 h-4" />
          Re-validate
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
          <div className="text-2xl font-bold text-slate-900">{summary.total}</div>
          <div className="text-sm text-slate-600">Total Actors</div>
        </div>
        <div className="bg-green-50 rounded-xl p-4 shadow-sm border border-green-200">
          <div className="text-2xl font-bold text-green-700">{summary.good}</div>
          <div className="text-sm text-green-600">No Issues</div>
        </div>
        <div className="bg-yellow-50 rounded-xl p-4 shadow-sm border border-yellow-200">
          <div className="text-2xl font-bold text-yellow-700">{warnings.length}</div>
          <div className="text-sm text-yellow-600">Warnings</div>
        </div>
        <div className="bg-red-50 rounded-xl p-4 shadow-sm border border-red-200">
          <div className="text-2xl font-bold text-red-700">{errors.length}</div>
          <div className="text-sm text-red-600">Errors</div>
        </div>
      </div>

      {/* Errors */}
      {errors.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <XCircle className="w-6 h-6 text-red-600" />
            Errors ({errors.length})
          </h2>
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 space-y-2">
            {errors.map((issue, i) => (
              <div key={i} className="bg-white rounded-lg p-3 border border-red-100">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="font-semibold text-slate-900">{issue.actorName}</span>
                    <span className="text-red-700 ml-2">{issue.issue}</span>
                  </div>
                  <a
                    href={`/actors/${issue.actorId}`}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    Fix →
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Warnings */}
      {warnings.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <AlertCircle className="w-6 h-6 text-yellow-600" />
            Warnings ({warnings.length})
          </h2>
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 space-y-2 max-h-96 overflow-y-auto">
            {warnings.map((issue, i) => (
              <div key={i} className="bg-white rounded-lg p-3 border border-yellow-100">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="font-semibold text-slate-900">{issue.actorName}</span>
                    <span className="text-yellow-700 ml-2">{issue.issue}</span>
                  </div>
                  <a
                    href={`/actors/${issue.actorId}`}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    Fix →
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Info */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <CheckCircle2 className="w-6 h-6 text-blue-600" />
          Missing Enrichment Data ({infos.length})
        </h2>
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <p className="text-blue-700 mb-4">
            These actors need enrichment. Visit <a href="/enrich-all" className="underline font-semibold">/enrich-all</a> to enrich all actors.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-64 overflow-y-auto">
            {infos.map((issue, i) => (
              <div key={i} className="bg-white rounded-lg p-2 border border-blue-100 text-sm">
                <span className="font-medium">{issue.actorName}</span>: {issue.issue}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

