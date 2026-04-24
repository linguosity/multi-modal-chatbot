'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

type ReportRow = {
  id: string;
  title: string;
  type: string;
  status: string;
  student_id: string | null;
  student_name: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
  finalized_date: string | null;
};

interface DashboardContentProps {
  reports: ReportRow[];
  sectionCounts: Record<string, number>;
}

const LS_REVEAL = 'linguo-dash-reveal';

/** Six stages, matching the wireframe flow (Upload → Done). */
const STAGES = ['upload', 'triage', 'skeleton', 'convergence', 'prose', 'done'] as const;
type Stage = (typeof STAGES)[number];
const STAGE_DOT_LABELS: Record<Stage, string> = {
  upload: 'Upload',
  triage: 'Triage',
  skeleton: 'Skeleton',
  convergence: 'Convergence',
  prose: 'Prose',
  done: 'Done',
};
const STAGE_DESCRIPTIONS: Record<Stage, string> = {
  upload: 'Uploading sources',
  triage: 'Triaging evidence',
  skeleton: 'Building skeleton',
  convergence: 'Evaluating convergence',
  prose: 'Drafting prose',
  done: 'Finalized',
};

function statusToStage(status: string): Stage {
  switch (status) {
    case 'completed':
    case 'finalized':
      return 'done';
    case 'in_progress':
      return 'prose';
    case 'draft':
      return 'skeleton';
    default:
      return 'upload';
  }
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return (
    parts
      .map(w => w[0] || '')
      .slice(0, 2)
      .join('')
      .toUpperCase() || 'SL'
  );
}

function timeAgo(date: string): string {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function sourceCount(r: ReportRow): number {
  const files = (r.metadata as any)?.uploadedFiles;
  if (Array.isArray(files)) return files.length;
  return 0;
}

function cloudId(r: ReportRow): string {
  const key = r.student_id || r.id;
  const suffix = String(key).replace(/[^a-z0-9]/gi, '').slice(0, 4).toUpperCase();
  return `${r.student_id ? 'STU' : 'RPT'}-${suffix}`;
}

/** Flag a report if it's been stalled in progress for more than 3 days. */
function computeFlag(r: ReportRow): null | { kind: 'urgent' | 'due-soon'; text: string } {
  if (r.status === 'completed' || r.status === 'finalized') return null;
  const staleMs = Date.now() - new Date(r.updated_at).getTime();
  if (r.status === 'in_progress' && staleMs > 3 * 86400000) {
    return { kind: 'urgent', text: '◆ Stalled more than 3 days — pick up where you left off' };
  }
  return null;
}

// ─── Stage track ──────────────────────────────────────────────────────────

function StageTrack({ stage }: { stage: Stage }) {
  const activeIdx = STAGES.indexOf(stage);
  return (
    <div className="wf-dash-track">
      {STAGES.map((s, i) => (
        <div key={s} className="flex items-center" style={{ flex: i < STAGES.length - 1 ? 1 : 'none' }}>
          <div
            className={
              'wf-dash-track-dot ' +
              (i < activeIdx ? 'done' : i === activeIdx ? 'active' : '')
            }
          >
            <span className="wf-dash-track-label">{STAGE_DOT_LABELS[s]}</span>
          </div>
          {i < STAGES.length - 1 && (
            <div className={'wf-dash-track-line ' + (i < activeIdx ? 'done' : '')} />
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Report card ─────────────────────────────────────────────────────────

function ReportCard({
  report,
  reveal,
}: {
  report: ReportRow;
  reveal: boolean;
}) {
  const stage = statusToStage(report.status);
  const name = report.student_name || report.title || 'Untitled';
  const id = cloudId(report);
  const flag = computeFlag(report);
  const sources = sourceCount(report);

  return (
    <Link href={`/dashboard/reports/${report.id}`} className="wf-dash-card">
      <div className="wf-dash-card-head">
        <div className="wf-dash-card-local" title="Stays on your device">
          <div className="wf-dash-avatar">{reveal ? initials(name) : '· ·'}</div>
          <div className="flex flex-col gap-0.5">
            <div className="wf-dash-local-name">
              {reveal ? name : <span className="wf-dash-redacted">████████ ██████</span>}
            </div>
            <div className="wf-dash-local-meta">
              <span className="wf-dash-lock" aria-hidden>⌂</span>
              <span>local only</span>
              <span className="wf-dash-meta-sep">·</span>
              <span>{report.type || 'Report'}</span>
            </div>
          </div>
        </div>
        <div className="wf-dash-card-id" title="Synthetic ID used for AI / cloud storage">
          <div className="wf-dash-id-label">cloud ID</div>
          <div className="wf-dash-id-value">{id}</div>
        </div>
      </div>

      <div className="wf-dash-card-rule" />

      <div className="wf-dash-card-track">
        <StageTrack stage={stage} />
      </div>

      <div className="wf-dash-card-meta">
        <div className="wf-dash-meta-cell">
          <div className="wf-dash-meta-k">Stage</div>
          <div className="wf-dash-meta-v">{STAGE_DESCRIPTIONS[stage]}</div>
        </div>
        <div className="wf-dash-meta-cell">
          <div className="wf-dash-meta-k">Sources</div>
          <div className="wf-dash-meta-v">{sources || '—'}</div>
        </div>
        <div className="wf-dash-meta-cell">
          <div className="wf-dash-meta-k">Last edit</div>
          <div className="wf-dash-meta-v">{timeAgo(report.updated_at)}</div>
        </div>
        <div className="wf-dash-meta-cell">
          <div className="wf-dash-meta-k">Created</div>
          <div className="wf-dash-meta-v">
            {new Date(report.created_at).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
            })}
          </div>
        </div>
      </div>

      {flag && <div className={`wf-dash-flag ${flag.kind}`}>{flag.text}</div>}
    </Link>
  );
}

// ─── New report card ─────────────────────────────────────────────────────

function NewReportCard({ nextIdHint }: { nextIdHint: string }) {
  return (
    <Link href="/dashboard/reports/new" className="wf-dash-card wf-dash-card-new">
      <div className="wf-dash-new-plus">
        <svg width="36" height="36" viewBox="0 0 36 36" aria-hidden="true">
          <circle cx="18" cy="18" r="16.5" fill="none" stroke="var(--line)" strokeWidth="1.5" strokeDasharray="3 3" />
          <path d="M18 10 V26 M10 18 H26" stroke="var(--terracotta-ink)" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </div>
      <div className="wf-dash-new-title">Start a new report</div>
      <div className="wf-dash-new-sub">
        Upload sources → Linguosity builds a draft.<br />
        Next ID will be <b>{nextIdHint}</b>.
      </div>
      <div className="wf-dash-new-cta">Begin intake →</div>
    </Link>
  );
}

// ─── Main component ─────────────────────────────────────────────────────

export function DashboardContent({ reports }: DashboardContentProps) {
  const [reveal, setReveal] = useState(true);
  const [filter, setFilter] = useState<'all' | 'due' | 'student' | 'stage'>('all');

  useEffect(() => {
    try {
      const saved = localStorage.getItem(LS_REVEAL);
      if (saved !== null) setReveal(saved !== 'false');
    } catch {
      // ignore storage access failures
    }
  }, []);

  const toggleReveal = () => {
    setReveal(prev => {
      const next = !prev;
      try {
        localStorage.setItem(LS_REVEAL, String(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  const active = reports.filter(r => r.status !== 'completed' && r.status !== 'finalized');
  const done = reports.filter(r => r.status === 'completed' || r.status === 'finalized');
  const flagged = reports.filter(r => computeFlag(r));

  const thisMonthFinalized = done.filter(r => {
    const d = new Date(r.finalized_date || r.updated_at);
    const now = new Date();
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  }).length;

  // Approximate "caseload students" by unique student_id or title
  const caseload = new Set(reports.map(r => r.student_id || r.student_name || r.id)).size;

  // Suggest next cloud ID roughly — count student-tagged reports + 1, three-digit padded
  const nextIdHint = `STU-${String((reports.filter(r => r.student_id).length + 1) * 1 + 421).padStart(4, '0')}`;

  return (
    <div className="flex flex-col gap-6">
      {/* Privacy banner */}
      <div className="wf-dash-priv">
        <svg width="28" height="28" viewBox="0 0 28 28" style={{ flexShrink: 0 }} aria-hidden="true">
          <path
            d="M14 3 L23 6 V14 C23 20 19 24 14 25 C9 24 5 20 5 14 V6 Z"
            stroke="var(--line)" strokeWidth="1.5" fill="#fff5ee"
          />
          <path
            d="M10 14 L13 17 L19 10"
            stroke="var(--terracotta-ink)" strokeWidth="2"
            strokeLinecap="round" strokeLinejoin="round" fill="none"
          />
        </svg>
        <div className="flex flex-col gap-1 flex-1">
          <div className="wf-dash-priv-title">Identifying info stays on this device</div>
          <div className="wf-dash-priv-body">
            Names, DOBs, addresses &amp; MRNs are held in your browser. Linguosity generates a
            stable <b>cloud ID</b> (like <code>STU-0421</code>) used for AI and server storage.
          </div>
        </div>
        <button
          type="button"
          onClick={toggleReveal}
          className="wf-dash-reveal-btn"
          aria-pressed={reveal}
        >
          {reveal ? '◉ Hide names' : '○ Reveal names'}
        </button>
      </div>

      {/* Stats strip */}
      <div className="wf-dash-strip">
        <div className="wf-dash-strip-cell">
          <div className="wf-dash-strip-num">{active.length}</div>
          <div className="wf-dash-strip-lbl">in progress</div>
        </div>
        <div className="wf-dash-strip-divider" />
        <div className="wf-dash-strip-cell">
          <div className={`wf-dash-strip-num ${flagged.length ? 'warn' : ''}`}>{flagged.length}</div>
          <div className="wf-dash-strip-lbl">need attention</div>
        </div>
        <div className="wf-dash-strip-divider" />
        <div className="wf-dash-strip-cell">
          <div className="wf-dash-strip-num">{thisMonthFinalized}</div>
          <div className="wf-dash-strip-lbl">finalized this month</div>
        </div>
        <div className="wf-dash-strip-divider" />
        <div className="wf-dash-strip-cell">
          <div className="wf-dash-strip-num">{caseload}</div>
          <div className="wf-dash-strip-lbl">caseload students</div>
        </div>
      </div>

      {/* Active reports */}
      <div className="wf-dash-section-head">
        <div className="wf-dash-section-title">Active reports</div>
        <div className="wf-dash-section-actions" role="tablist" aria-label="Filter reports">
          {(
            [
              ['all', 'All'],
              ['due', 'By due date'],
              ['student', 'By student'],
              ['stage', 'By stage'],
            ] as const
          ).map(([k, label]) => (
            <button
              key={k}
              type="button"
              role="tab"
              aria-selected={filter === k}
              className={`wf-dash-filter ${filter === k ? 'active' : ''}`}
              onClick={() => setFilter(k)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="wf-dash-grid">
        <NewReportCard nextIdHint={nextIdHint} />
        {active.map(r => (
          <ReportCard key={r.id} report={r} reveal={reveal} />
        ))}
      </div>

      {/* Recently finalized */}
      {done.length > 0 && (
        <>
          <div className="wf-dash-section-head" style={{ marginTop: 16 }}>
            <div className="wf-dash-section-title">Recently finalized</div>
          </div>
          <div className="wf-dash-grid">
            {done.map(r => (
              <ReportCard key={r.id} report={r} reveal={reveal} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
