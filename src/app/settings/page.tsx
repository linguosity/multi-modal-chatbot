'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { useUserSettings } from '@/lib/context/UserSettingsContext'
import { getAvailableStates } from '@/lib/structured-schemas'
import { signOut } from '@/app/auth/actions'

/** Settings — 9-section hub. Profile is wired to UserSettingsContext;
 * other sections are UI-faithful placeholders until their backends exist. */

const SECTIONS = [
  { id: 'profile',   num: '01', title: 'Profile',              sub: 'Name, role, license' },
  { id: 'caseload',  num: '02', title: 'Caseload',             sub: 'Ages, languages, settings' },
  { id: 'templates', num: '03', title: 'Templates',            sub: 'Default + custom' },
  { id: 'library',   num: '04', title: 'Tool library',         sub: 'Curated + custom tools' },
  { id: 'standards', num: '05', title: 'Educational standards', sub: 'CCSS, WIDA, state' },
  { id: 'privacy',   num: '06', title: 'Privacy & PII',        sub: 'On-device · cloud rules' },
  { id: 'export',    num: '07', title: 'Export defaults',      sub: 'Formats, naming, destinations' },
  { id: 'billing',   num: '08', title: 'Billing & plan',       sub: 'Tier, invoices, seats' },
  { id: 'audit',     num: '09', title: 'Audit log',            sub: 'Every AI request, downloadable' },
] as const
type SectionId = (typeof SECTIONS)[number]['id']

export default function SettingsPage() {
  const [section, setSection] = useState<SectionId>('profile')
  const { settings, updateSettings, schoolSites, addSchoolSite, setDefaultSite } = useUserSettings()

  const avatarInitials = useMemo(() => {
    const name = settings.evaluatorName || 'S L'
    return name.split(' ').map(w => w[0] || '').slice(0, 2).join('').toUpperCase() || 'SL'
  }, [settings.evaluatorName])

  const railDisplayName = settings.evaluatorName
    ? `${settings.evaluatorName}${settings.evaluatorCredentials ? ', ' + settings.evaluatorCredentials : ''}`
    : 'Speech-Language Pathologist'

  const defaultSite = schoolSites.find(s => s.is_default) || schoolSites[0]
  const railMeta = defaultSite ? defaultSite.name : settings.preferredState || 'No site set'

  return (
    <div className="min-h-screen bg-[var(--paper)]">
      {/* Top bar — minimal chrome, brand + back link */}
      <div className="flex items-center gap-6 px-7 py-[18px] bg-[var(--paper)] border-b-[1.5px] border-[var(--line)]">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 font-mono text-[12px] uppercase tracking-[0.06em] text-[var(--ink-2)] hover:text-[var(--ink)] transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to dashboard
        </Link>
        <div className="flex items-baseline gap-2.5 ml-auto">
          <span style={{ fontFamily: 'var(--font-display)' }} className="text-[22px] leading-none tracking-tight">
            Linguosity<span className="text-terracotta">.</span>
          </span>
          <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--ink-3)]">
            Settings
          </span>
        </div>
      </div>

      <div className="wf-set-wrap">
        {/* Left rail */}
        <aside className="wf-set-rail">
          <div className="wf-set-profile-mini">
            <div className="wf-set-avatar">{avatarInitials}</div>
            <div className="flex flex-col gap-0.5 min-w-0">
              <div className="wf-set-prof-name truncate">{railDisplayName}</div>
              <div className="wf-set-prof-meta truncate">{railMeta}</div>
            </div>
          </div>
          <div className="wf-set-rail-divider" />
          {SECTIONS.map(s => (
            <button
              key={s.id}
              type="button"
              className={`wf-set-rail-item ${section === s.id ? 'active' : ''}`}
              onClick={() => setSection(s.id)}
              aria-current={section === s.id ? 'true' : undefined}
            >
              <div className="wf-set-rail-num">{s.num}</div>
              <div className="flex flex-col gap-0.5 min-w-0">
                <div className="wf-set-rail-title">{s.title}</div>
                <div className="wf-set-rail-sub">{s.sub}</div>
              </div>
            </button>
          ))}
          <div className="wf-set-rail-foot">
            <form action={signOut}>
              <button type="submit" className="wf-btn ghost sm">Sign out</button>
            </form>
          </div>
        </aside>

        {/* Main panel */}
        <main className="wf-set-main">
          {section === 'profile'   && <ProfileSection settings={settings} updateSettings={updateSettings} schoolSites={schoolSites} addSchoolSite={addSchoolSite} setDefaultSite={setDefaultSite} />}
          {section === 'caseload'  && <CaseloadSection settings={settings} updateSettings={updateSettings} />}
          {section === 'templates' && <TemplatesSection />}
          {section === 'library'   && <LibrarySection />}
          {section === 'standards' && <StandardsSection />}
          {section === 'privacy'   && <PrivacySection />}
          {section === 'export'    && <ExportSection />}
          {section === 'billing'   && <BillingSection />}
          {section === 'audit'     && <AuditSection />}
        </main>
      </div>
    </div>
  )
}

// ─── Shared fragments ──────────────────────────────────────────────────────

function SectionHead({ title, lede }: { title: string; lede?: string }) {
  return (
    <div className="wf-set-section-head">
      <h2 className="wf-set-h2">{title}</h2>
      {lede && <p className="wf-set-lede">{lede}</p>}
    </div>
  )
}

function SetField({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="wf-set-field">
      <div className="wf-set-field-label">{label}</div>
      <div className="wf-set-field-ctrl">{children}</div>
      {hint && <div className="wf-set-field-hint">{hint}</div>}
    </div>
  )
}

function Toggle({ on, onChange, locked }: { on: boolean; onChange: (next: boolean) => void; locked?: boolean }) {
  return (
    <button
      type="button"
      className={`wf-onb-toggle ${on ? 'on' : ''} ${locked ? 'locked' : ''}`}
      onClick={() => !locked && onChange(!on)}
      aria-pressed={on}
      aria-label={locked ? 'Locked by admin' : undefined}
      disabled={locked}
    >
      <div className="wf-onb-toggle-knob" />
      {locked && <span className="wf-set-lock">⌂</span>}
    </button>
  )
}

// ─── 01 Profile (wired) ───────────────────────────────────────────────────

type ProfileProps = Pick<
  ReturnType<typeof useUserSettings>,
  'settings' | 'updateSettings' | 'schoolSites' | 'addSchoolSite' | 'setDefaultSite'
>
function ProfileSection({ settings, updateSettings, schoolSites, addSchoolSite, setDefaultSite }: ProfileProps) {
  const [name, setName] = useState(settings.evaluatorName)
  const [creds, setCreds] = useState(settings.evaluatorCredentials)
  const [license, setLicense] = useState('')
  const [newSiteName, setNewSiteName] = useState('')
  const selectedSiteId = schoolSites.find(s => s.is_default)?.id || schoolSites[0]?.id || ''

  const dirty = name !== settings.evaluatorName || creds !== settings.evaluatorCredentials

  const handleSave = async () => {
    if (!dirty) return
    await updateSettings({ evaluatorName: name, evaluatorCredentials: creds })
  }

  return (
    <>
      <SectionHead title="Profile" lede="How you're identified in the app and on exported reports." />

      <SetField label="Full name">
        <input
          className="wf-set-input"
          value={name}
          onChange={e => setName(e.target.value)}
          onBlur={handleSave}
          placeholder="Your full name"
        />
      </SetField>

      <SetField label="Credentials">
        <input
          className="wf-set-input"
          value={creds}
          onChange={e => setCreds(e.target.value)}
          onBlur={handleSave}
          placeholder="M.S., CCC-SLP"
        />
      </SetField>

      <SetField label="License #" hint="Appears on exported reports.">
        <input
          className="wf-set-input"
          value={license}
          onChange={e => setLicense(e.target.value)}
          placeholder="SP-0000-XX"
        />
      </SetField>

      <SetField label="Organization / school sites" hint="Select your default site; add new ones as you pick up caseloads.">
        <select
          className="wf-set-input"
          value={selectedSiteId}
          onChange={e => e.target.value && setDefaultSite(e.target.value)}
        >
          {schoolSites.length === 0 && <option value="">(no sites added yet)</option>}
          {schoolSites.map(s => (
            <option key={s.id} value={s.id}>
              {s.name}{s.is_default ? ' • default' : ''}
            </option>
          ))}
        </select>
        <input
          className="wf-set-input"
          value={newSiteName}
          onChange={e => setNewSiteName(e.target.value)}
          placeholder="Add new site"
          style={{ minWidth: 220 }}
        />
        <button
          type="button"
          className="wf-btn sm"
          onClick={async () => {
            const n = newSiteName.trim()
            if (!n) return
            await addSchoolSite(n, schoolSites.length === 0)
            setNewSiteName('')
          }}
        >
          Add
        </button>
      </SetField>

      <SetField label="Signature" hint="Used on export. Your hand-written signature, rendered in Caveat.">
        <div className="wf-set-sig-box">{name || 'Your name'}</div>
      </SetField>
    </>
  )
}

// ─── 02 Caseload (local state + preferred-state wired) ────────────────────

const AGE_OPTIONS = [
  ['preschool', 'Preschool (3–5)'],
  ['k-5',       'K–5'],
  ['6-12',      '6–12'],
  ['adult',     'Adult'],
] as const
const LANG_OPTIONS = [
  ['english', 'English'],
  ['spanish', 'Spanish'],
  ['other',   'Other'],
] as const
const SETTING_OPTIONS = [
  ['school',       'School'],
  ['clinic',       'Clinic'],
  ['teletherapy',  'Teletherapy'],
  ['private',      'Private practice'],
] as const

type CaseloadProps = Pick<ReturnType<typeof useUserSettings>, 'settings' | 'updateSettings'>
function CaseloadSection({ settings, updateSettings }: CaseloadProps) {
  const [ages, setAges] = useState<Record<string, boolean>>({ 'k-5': true })
  const [langs, setLangs] = useState<Record<string, boolean>>({ english: true })
  const [setting, setSetting] = useState<string>('school')
  const availableStates = getAvailableStates()

  return (
    <>
      <SectionHead
        title="Caseload"
        lede="Tunes what surfaces first in the tool library and which rubric defaults apply."
      />

      <SetField label="Age ranges">
        <div className="wf-onb-chip-row">
          {AGE_OPTIONS.map(([k, l]) => (
            <button
              key={k}
              type="button"
              className={`wf-onb-chip ${ages[k] ? 'on' : ''}`}
              onClick={() => setAges(p => ({ ...p, [k]: !p[k] }))}
              aria-pressed={!!ages[k]}
            >
              {l}
            </button>
          ))}
        </div>
      </SetField>

      <SetField label="Languages">
        <div className="wf-onb-chip-row">
          {LANG_OPTIONS.map(([k, l]) => (
            <button
              key={k}
              type="button"
              className={`wf-onb-chip ${langs[k] ? 'on' : ''}`}
              onClick={() => setLangs(p => ({ ...p, [k]: !p[k] }))}
              aria-pressed={!!langs[k]}
            >
              {l}
            </button>
          ))}
        </div>
      </SetField>

      <SetField label="Primary setting">
        <div className="wf-onb-chip-row">
          {SETTING_OPTIONS.map(([k, l]) => (
            <button
              key={k}
              type="button"
              className={`wf-onb-chip ${setting === k ? 'on' : ''}`}
              onClick={() => setSetting(k)}
              aria-pressed={setting === k}
            >
              {l}
            </button>
          ))}
        </div>
      </SetField>

      <SetField label="Preferred state" hint="Determines which state's eligibility criteria are applied in drafts.">
        <select
          className="wf-set-input"
          value={settings.preferredState}
          onChange={e => updateSettings({ preferredState: e.target.value })}
        >
          {availableStates.map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </SetField>
    </>
  )
}

// ─── 03 Templates ─────────────────────────────────────────────────────────

function TemplatesSection() {
  return (
    <>
      <SectionHead
        title="Templates"
        lede="The default skeleton used when you start a new report. Manage, duplicate, or create new templates."
      />
      <div className="wf-set-link-card">
        <div className="flex flex-col gap-1.5">
          <div className="wf-set-item-title">Open template library</div>
          <div className="wf-set-item-sub">Edit the default skeleton, duplicate starters, create custom templates.</div>
        </div>
        <Link href="/dashboard/templates" className="wf-btn primary sm">Open →</Link>
      </div>
    </>
  )
}

// ─── 04 Tool library ──────────────────────────────────────────────────────

function LibrarySection() {
  return (
    <>
      <SectionHead
        title="Tool library"
        lede="Curated assessment tools with auto-generated blurbs, citations, and validity statements."
      />
      <div className="wf-set-link-card">
        <div className="flex flex-col gap-1.5">
          <div className="wf-set-item-title">Open tool library</div>
          <div className="wf-set-item-sub">CELF-5, GFTA-3, BESA, EOWPVT-SBE, PLS-5, and more.</div>
        </div>
        <Link href="/dashboard/tools" className="wf-btn primary sm">Open →</Link>
      </div>
      <SetField
        label="Auto-detect tools from uploads"
        hint="Recognizes known assessments (CELF-5, GFTA-3, …) from filenames or content and attaches the tool blurb + citation automatically."
      >
        <Toggle on onChange={() => { /* TODO persist */ }} />
      </SetField>
    </>
  )
}

// ─── 05 Educational standards ────────────────────────────────────────────

function StandardsSection() {
  const [ccss, setCcss] = useState(true)
  const [wida, setWida] = useState(true)
  const [caccss, setCaccss] = useState(true)
  const [idea, setIdea] = useState(true)
  return (
    <>
      <SectionHead
        title="Educational standards"
        lede="Surfaced in impact statements. Linguosity suggests standards relevant to confirmed findings."
      />
      <SetField label="Common Core (CCSS)" hint="ELA: Speaking & Listening, Language. Covers ~41 states.">
        <Toggle on={ccss} onChange={setCcss} />
      </SetField>
      <SetField label="WIDA English Language Development" hint="For EL students — critical for bilingual evaluations.">
        <Toggle on={wida} onChange={setWida} />
      </SetField>
      <SetField label="California CA-CCSS additions" hint="State-specific additions layered over CCSS.">
        <Toggle on={caccss} onChange={setCaccss} />
      </SetField>
      <SetField label="IDEA functional skills" hint="For IEP-facing impact statements.">
        <Toggle on={idea} onChange={setIdea} />
      </SetField>
    </>
  )
}

// ─── 06 Privacy & PII ────────────────────────────────────────────────────

function PrivacySection() {
  const [hideNames, setHideNames] = useState(true)
  const [autoApproveLow, setAutoApproveLow] = useState(false)
  const [autoDelete, setAutoDelete] = useState(true)
  return (
    <>
      <SectionHead
        title="Privacy & PII"
        lede="These defaults apply to every new report. Per-report overrides available at the PII confirmation step."
      />

      <div className="wf-set-privacy-banner">
        <svg width="22" height="22" viewBox="0 0 22 22" style={{ flexShrink: 0, marginTop: 1 }} aria-hidden="true">
          <path d="M11 2 L18 4 V10 C18 15 15 18 11 19 C7 18 4 15 4 10 V4 Z" stroke="var(--line)" strokeWidth="1.2" fill="#fff5ee" />
          <path d="M7 11 L10 14 L15 8" stroke="var(--terracotta-ink)" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <div>
          Your PII pipeline is active. Detected entities are replaced with tokens before anything leaves your server.
          Some controls below are managed by your admin.
        </div>
      </div>

      <SetField
        label="On-device PII detection"
        hint="Names, DOBs, addresses, and MRNs are detected and replaced before any data reaches the AI."
      >
        <Toggle on locked onChange={() => {}} />
      </SetField>
      <SetField
        label="Hide real names on dashboard"
        hint="Cards show the cloud ID (e.g. STU-0421) until you explicitly reveal them."
      >
        <Toggle on={hideNames} onChange={setHideNames} />
      </SetField>
      <SetField
        label="Auto-approve low-confidence detections"
        hint="If off, you'll confirm any entity below 90% confidence on the PII step."
      >
        <Toggle on={autoApproveLow} onChange={setAutoApproveLow} />
      </SetField>
      <SetField
        label="Audit log for every AI request"
        hint="Tokenized prompt + response. Never includes the real-name mapping."
      >
        <Toggle on locked onChange={() => {}} />
      </SetField>
      <SetField
        label="Auto-delete source documents after finalization"
        hint="Source PDFs / audio are purged 30 days after the report is marked final."
      >
        <Toggle on={autoDelete} onChange={setAutoDelete} />
      </SetField>

      <div className="wf-set-danger">
        <div className="flex flex-col gap-1.5">
          <div className="wf-set-item-title">Export &amp; erase all local identifiers</div>
          <div className="wf-set-item-sub">
            Download the name ↔ ID mapping, then wipe it from this device. Reports still open on this
            machine will lose their re-identified view.
          </div>
        </div>
        <button
          type="button"
          className="wf-btn sm"
          style={{ color: 'var(--terracotta-ink)', borderColor: 'var(--terracotta-ink)' }}
        >
          Export &amp; erase
        </button>
      </div>
    </>
  )
}

// ─── 07 Export defaults ─────────────────────────────────────────────────

function ExportSection() {
  const [fmt, setFmt] = useState('.docx')
  const [pattern, setPattern] = useState('{student_id}_{template}_{date}.docx')
  const [footnotes, setFootnotes] = useState(true)
  const [citations, setCitations] = useState(true)
  const [auditSummary, setAuditSummary] = useState(false)

  return (
    <>
      <SectionHead
        title="Export defaults"
        lede="Every report can override these, but new reports start here."
      />
      <SetField label="Default format">
        <select className="wf-set-input" value={fmt} onChange={e => setFmt(e.target.value)}>
          <option>.docx (Word)</option>
          <option>PDF</option>
          <option>Markdown</option>
          <option>JSON</option>
        </select>
      </SetField>
      <SetField
        label="File naming pattern"
        hint="Tokens: {student_id}, {date}, {grade}, {template}."
      >
        <input className="wf-set-input" value={pattern} onChange={e => setPattern(e.target.value)} />
      </SetField>
      <SetField label="Evidence provenance footnotes">
        <Toggle on={footnotes} onChange={setFootnotes} />
      </SetField>
      <SetField label="APA citations for all tools used">
        <Toggle on={citations} onChange={setCitations} />
      </SetField>
      <SetField label="Attach audit-log summary">
        <Toggle on={auditSummary} onChange={setAuditSummary} />
      </SetField>
    </>
  )
}

// ─── 08 Billing ─────────────────────────────────────────────────────────

function BillingSection() {
  return (
    <>
      <SectionHead title="Billing & plan" />
      <div className="wf-set-plan-card">
        <div className="flex flex-col gap-1.5">
          <div className="wf-set-plan-name">Practice · individual</div>
          <div className="wf-set-plan-body">
            Direct-billed · no BAA on file yet · renews monthly
          </div>
        </div>
        <div className="wf-set-plan-tag">Active</div>
      </div>
      <SetField label="Reports this year" hint="Tracked from first finalized report.">
        <div className="wf-set-stat-row">
          <span className="wf-set-stat-big">—</span>
          <span className="wf-set-stat-sub">drafted</span>
          <span className="wf-set-stat-big">—</span>
          <span className="wf-set-stat-sub">finalized</span>
        </div>
      </SetField>
      <SetField label="Invoices">
        <button type="button" className="wf-btn ghost sm">View invoice history →</button>
      </SetField>
    </>
  )
}

// ─── 09 Audit log ───────────────────────────────────────────────────────

function AuditSection() {
  return (
    <>
      <SectionHead
        title="Audit log"
        lede="Every AI request made on your account, tokenized. Download before any compliance review."
      />
      <div className="wf-set-audit-strip">
        <div className="wf-set-audit-cell">
          <div className="wf-set-audit-num">—</div>
          <div className="wf-set-audit-lbl">requests this year</div>
        </div>
        <div className="wf-set-audit-cell">
          <div className="wf-set-audit-num">0</div>
          <div className="wf-set-audit-lbl">PII leaks</div>
        </div>
        <div className="wf-set-audit-cell">
          <div className="wf-set-audit-num">—</div>
          <div className="wf-set-audit-lbl">reports covered</div>
        </div>
      </div>
      <div className="wf-set-audit-table">
        <div className="wf-set-audit-row head">
          <div>Timestamp</div>
          <div>Report</div>
          <div>Operation</div>
          <div>Model</div>
          <div>Tokens</div>
        </div>
        <div className="wf-set-audit-row">
          <div className="mono" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '22px 0', color: 'var(--ink-3)' }}>
            Audit log will populate once AI requests are recorded for your account.
          </div>
        </div>
      </div>
      <button type="button" className="wf-btn ghost sm" style={{ alignSelf: 'flex-start' }} disabled>
        Download full log (.csv)
      </button>
    </>
  )
}
