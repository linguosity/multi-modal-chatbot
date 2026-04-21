'use client';

import Link from 'next/link';
import { useState } from 'react';

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

const STAGES = ['upload', 'triage', 'skeleton', 'drafting', 'review', 'completed'] as const;
const STAGE_LABELS = ['Upload', 'Triage', 'Skeleton', 'Drafting', 'Review', 'Done'];

function mapStatusToStage(status: string): string {
  const map: Record<string, string> = {
    draft: 'skeleton',
    in_progress: 'drafting',
    completed: 'completed',
    finalized: 'completed',
  };
  return map[status] || 'upload';
}

function initials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
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

function StageTrack({ stage }: { stage: string }) {
  const idx = STAGES.indexOf(stage as (typeof STAGES)[number]);
  const activeIdx = idx >= 0 ? idx : 0;

  return (
    <div className="flex items-center w-full py-1">
      {STAGE_LABELS.map((label, i) => (
        <div key={label} className="flex items-center" style={{ flex: i < STAGE_LABELS.length - 1 ? 1 : 'none' }}>
          <div className="relative flex flex-col items-center">
            <div
              className={`w-[9px] h-[9px] rounded-full shrink-0 ${
                i < activeIdx
                  ? 'bg-[#111111] border-[1.5px] border-[#111111]'
                  : i === activeIdx
                  ? 'bg-terracotta border-[1.5px] border-terracotta-ink shadow-[0_0_0_3px_#fff1eb]'
                  : 'bg-white border-[1.5px] border-[#d0d0d0]'
              }`}
            />
            <span
              className={`absolute top-[14px] whitespace-nowrap text-[9px] tracking-[0.06em] uppercase ${
                i === activeIdx
                  ? 'text-terracotta-ink font-semibold'
                  : i < activeIdx
                  ? 'text-[#6b6b6b]'
                  : 'text-[#9a9a9a]'
              }`}
            >
              {label}
            </span>
          </div>
          {i < STAGE_LABELS.length - 1 && (
            <div
              className={`flex-1 h-[1.5px] mx-[2px] ${
                i < activeIdx ? 'bg-[#111111]' : 'bg-[#d0d0d0]'
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}

function ReportCard({
  report,
  sectionCount,
  reveal,
}: {
  report: ReportRow;
  sectionCount: number;
  reveal: boolean;
}) {
  const stage = mapStatusToStage(report.status);
  const stageLabel = STAGE_LABELS[STAGES.indexOf(stage as (typeof STAGES)[number])] || 'Upload';
  const name = report.student_name || report.title || 'Untitled';
  const cloudId = `RPT-${report.id.slice(0, 4).toUpperCase()}`;

  return (
    <Link href={`/dashboard/reports/${report.id}`} className="block">
      <div className="bg-white border-[1.5px] border-[#1a1a1a] p-4 pb-3.5 flex flex-col gap-3 cursor-pointer transition-all hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[4px_4px_0_#ece4cf]">
        {/* Top row: avatar + name | cloud ID */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex gap-2.5 items-center">
            <div className="w-9 h-9 border-[1.5px] border-[#1a1a1a] bg-[#efece4] flex items-center justify-center font-serif text-sm tracking-tight">
              {reveal ? initials(name) : '..'}
            </div>
            <div className="flex flex-col gap-0.5">
              <div className="font-serif text-[15px] tracking-tight leading-tight">
                {reveal ? name : (
                  <span className="tracking-[-0.08em] text-[#6b6b6b] font-mono text-[13px]">
                    ████████ ██████
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5 text-[10.5px] text-[#6b6b6b] tracking-[0.04em] uppercase">
                <span className="text-terracotta-ink text-[11px]">&#x2302;</span>
                <span>local only</span>
                <span className="opacity-50">&middot;</span>
                <span>{report.type || 'Report'}</span>
              </div>
            </div>
          </div>
          <div className="text-right px-2 py-1 border border-dashed border-[#d0d0d0] bg-[#f7f5f0]">
            <div className="text-[9px] tracking-[0.12em] uppercase text-[#6b6b6b]">
              cloud ID
            </div>
            <div className="font-mono text-[12.5px] font-semibold tracking-[0.03em] text-terracotta-ink">
              {cloudId}
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-[#d0d0d0]" />

        {/* Stage track */}
        <div className="px-0.5 pt-1 pb-4">
          <StageTrack stage={stage} />
        </div>

        {/* Meta row */}
        <div className="grid grid-cols-4 gap-2 pt-1">
          <div className="flex flex-col gap-0.5">
            <div className="text-[9px] tracking-[0.1em] uppercase text-[#9a9a9a]">Stage</div>
            <div className="text-[12px] text-[#111111]">{stageLabel}</div>
          </div>
          <div className="flex flex-col gap-0.5">
            <div className="text-[9px] tracking-[0.1em] uppercase text-[#9a9a9a]">Sections</div>
            <div className="text-[12px] text-[#111111]">{sectionCount}</div>
          </div>
          <div className="flex flex-col gap-0.5">
            <div className="text-[9px] tracking-[0.1em] uppercase text-[#9a9a9a]">Last edit</div>
            <div className="text-[12px] text-[#111111]">{timeAgo(report.updated_at)}</div>
          </div>
          <div className="flex flex-col gap-0.5">
            <div className="text-[9px] tracking-[0.1em] uppercase text-[#9a9a9a]">Created</div>
            <div className="text-[12px] text-[#111111]">
              {new Date(report.created_at).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
              })}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

function NewReportCard() {
  return (
    <Link href="/dashboard/reports/new" className="block">
      <div
        className="border-[1.5px] border-dashed border-[#1a1a1a] flex flex-col items-center justify-center text-center min-h-[220px] p-5 cursor-pointer transition-all hover:bg-[#fff5ee] hover:border-solid"
        style={{
          background: 'repeating-linear-gradient(45deg, #f7f5f0 0 6px, #efece4 6px 12px)',
        }}
      >
        <div className="mb-1.5">
          <svg width="36" height="36" viewBox="0 0 36 36">
            <circle
              cx="18"
              cy="18"
              r="16.5"
              fill="none"
              stroke="#1a1a1a"
              strokeWidth="1.5"
              strokeDasharray="3 3"
            />
            <path
              d="M18 10 V26 M10 18 H26"
              stroke="#b85a3c"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </div>
        <div className="font-serif text-xl tracking-tight">Start a new report</div>
        <div className="text-[12px] text-[#3a3a3a] leading-[1.5] max-w-[28ch] mt-1">
          Upload sources &rarr; Linguosity builds a draft.
        </div>
        <div className="mt-1.5 px-3.5 py-[7px] border-[1.5px] border-[#1a1a1a] bg-white text-[11px] tracking-[0.08em] uppercase text-terracotta-ink font-semibold">
          Begin intake &rarr;
        </div>
      </div>
    </Link>
  );
}

export function DashboardContent({ reports, sectionCounts }: DashboardContentProps) {
  const [reveal, setReveal] = useState(true);

  const active = reports.filter((r) => r.status !== 'completed' && r.status !== 'finalized');
  const done = reports.filter((r) => r.status === 'completed' || r.status === 'finalized');
  const needAttention = reports.filter(
    (r) => r.status === 'in_progress' && new Date(r.updated_at) < new Date(Date.now() - 3 * 86400000)
  );

  return (
    <div className="flex flex-col gap-6">
      {/* Privacy banner */}
      <div className="flex items-center gap-4 px-5 py-4 bg-[#fff5ee] border-[1.5px] border-[#1a1a1a] shadow-[4px_4px_0_#ece4cf]">
        <svg width="28" height="28" viewBox="0 0 28 28" className="shrink-0">
          <path
            d="M14 3 L23 6 V14 C23 20 19 24 14 25 C9 24 5 20 5 14 V6 Z"
            stroke="#1a1a1a"
            strokeWidth="1.5"
            fill="#fff5ee"
          />
          <path
            d="M10 14 L13 17 L19 10"
            stroke="#b85a3c"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </svg>
        <div className="flex flex-col gap-1 flex-1">
          <div className="font-serif text-[17px] tracking-tight">
            Identifying info stays on this device
          </div>
          <div className="text-[12.5px] text-[#3a3a3a] leading-[1.5] max-w-[72ch]">
            Names, DOBs, addresses &amp; MRNs are held in your browser. Linguosity generates a
            stable <strong>cloud ID</strong> used for AI and server storage.
          </div>
        </div>
        <button
          onClick={() => setReveal(!reveal)}
          className="px-3.5 py-2 border-[1.5px] border-[#1a1a1a] bg-white font-mono text-[11px] tracking-[0.06em] uppercase whitespace-nowrap hover:bg-[#efece4] transition-colors"
        >
          {reveal ? '\u25C9 Hide names' : '\u25CB Reveal names'}
        </button>
      </div>

      {/* Stats strip */}
      <div className="flex bg-white border-[1.5px] border-[#1a1a1a]">
        <div className="flex-1 px-5 py-[18px] flex flex-col gap-1">
          <div className="font-serif text-[32px] leading-none tracking-tight">{active.length}</div>
          <div className="text-[10.5px] tracking-[0.1em] uppercase text-[#6b6b6b]">
            in progress
          </div>
        </div>
        <div className="w-[1.5px] bg-[#1a1a1a] opacity-30" />
        <div className="flex-1 px-5 py-[18px] flex flex-col gap-1">
          <div className="font-serif text-[32px] leading-none tracking-tight text-terracotta-ink">
            {needAttention.length}
          </div>
          <div className="text-[10.5px] tracking-[0.1em] uppercase text-[#6b6b6b]">
            need attention
          </div>
        </div>
        <div className="w-[1.5px] bg-[#1a1a1a] opacity-30" />
        <div className="flex-1 px-5 py-[18px] flex flex-col gap-1">
          <div className="font-serif text-[32px] leading-none tracking-tight">{done.length}</div>
          <div className="text-[10.5px] tracking-[0.1em] uppercase text-[#6b6b6b]">
            finalized
          </div>
        </div>
        <div className="w-[1.5px] bg-[#1a1a1a] opacity-30" />
        <div className="flex-1 px-5 py-[18px] flex flex-col gap-1">
          <div className="font-serif text-[32px] leading-none tracking-tight">
            {reports.length}
          </div>
          <div className="text-[10.5px] tracking-[0.1em] uppercase text-[#6b6b6b]">
            total reports
          </div>
        </div>
      </div>

      {/* Active reports section */}
      <div className="flex items-baseline justify-between border-b-[1.5px] border-[#1a1a1a] pb-2">
        <div className="font-serif text-xl tracking-tight">Active reports</div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[repeat(auto-fill,minmax(340px,1fr))] gap-4">
        <NewReportCard />
        {active.map((r) => (
          <ReportCard
            key={r.id}
            report={r}
            sectionCount={sectionCounts[r.id] || 0}
            reveal={reveal}
          />
        ))}
      </div>

      {/* Recently finalized */}
      {done.length > 0 && (
        <>
          <div className="flex items-baseline justify-between border-b-[1.5px] border-[#1a1a1a] pb-2 mt-4">
            <div className="font-serif text-xl tracking-tight">Recently finalized</div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-[repeat(auto-fill,minmax(340px,1fr))] gap-4">
            {done.map((r) => (
              <ReportCard
                key={r.id}
                report={r}
                sectionCount={sectionCounts[r.id] || 0}
                reveal={reveal}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
