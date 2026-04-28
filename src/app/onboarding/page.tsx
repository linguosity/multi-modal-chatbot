'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { DomainTreePicker } from '@/components/domain-picker/DomainTreePicker'
import { ASHA_PRESETS, ASHA_DEFAULT_PRESET_ID } from '@/lib/asha-scope'

/** Post-signup onboarding wizard. Step 2 (Domains) drives every downstream
 * scope decision: which sections appear, which tools surface, which findings
 * the AI is asked to extract. The domain picker is the highest-leverage
 * onboarding gesture, so it sits early in the flow and persists on advance. */

const STEPS = [
  { num: '01', title: 'Your role',        sub: 'Sets defaults for templates + rubric' },
  { num: '02', title: 'Your caseload',    sub: 'Ages, languages, settings' },
  { num: '03', title: 'Your domains',     sub: 'Which areas do you typically assess?' },
  { num: '04', title: 'Your templates',   sub: 'Pick a base template to start' },
  { num: '05', title: 'Privacy settings', sub: 'How identifying info is handled' },
  { num: '06', title: 'First report',     sub: 'Optional — jump straight in' },
] as const

const ROLE_OPTIONS = [
  { v: 'school-slp',       t: 'School-based SLP',      d: 'IEP-oriented. Eligibility under IDEA. School-age + preschool templates.' },
  { v: 'clinical-slp',     t: 'Clinical / outpatient', d: 'Medical model. ICD coding. Insurance-ready prose.' },
  { v: 'bilingual-slp',    t: 'Bilingual specialist',  d: 'Dual-language rubric defaults. BESA & WMLS-R prioritized.' },
  { v: 'private-practice', t: 'Private practice',      d: 'Mixed caseload. Flexible templates. Family-facing prose.' },
] as const

const TEMPLATE_OPTIONS = [
  { v: 'comprehensive-eval', t: 'Comprehensive evaluation', sections: 9,  sub: 'Full reason for referral → eligibility → recommendations.' },
  { v: 'triennial-reeval',   t: 'Triennial re-evaluation',  sections: 7,  sub: 'Focuses on progress + continued eligibility.' },
  { v: 'bilingual-eval',     t: 'Bilingual evaluation',     sections: 10, sub: 'Dual-language profile + bilingual rubric.' },
  { v: 'clinical-soap',      t: 'Clinical SOAP',            sections: 4,  sub: 'SOAP-structured, insurance-aligned prose.' },
  { v: 'screening-summary',  t: 'Screening summary',        sections: 3,  sub: 'Short-form, for screening outcomes only.' },
  { v: 'blank',              t: 'Blank template',           sections: 0,  sub: 'Start from nothing. Add sections as you go.' },
] as const

export default function OnboardingPage() {
  const router = useRouter()

  const [step, setStep] = useState(0)
  const [role, setRole] = useState<string>('school-slp')
  const [ages, setAges] = useState<Record<string, boolean>>({ preschool: true, 'k-5': true })
  const [langs, setLangs] = useState<Record<string, boolean>>({ english: true, spanish: true })
  const [settings, setSettings] = useState<Record<string, boolean>>({ school: true })
  // Domains — pre-checked from the school-based-pediatric preset since it's
  // the most common SLP role. The user can clear via the "Custom" preset and
  // pick from scratch, or apply a different preset. Persisted on advance.
  const [domains, setDomains] = useState<string[]>([
    ...ASHA_PRESETS[ASHA_DEFAULT_PRESET_ID].leaves,
  ])
  const [domainsSaving, setDomainsSaving] = useState(false)
  const [template, setTemplate] = useState<string>('comprehensive-eval')
  const [pii, setPii] = useState({ onDevice: true, hideDefault: true, audit: true })

  // Hydrate from server on mount so a returning user sees their previous
  // selection rather than the preset default.
  useEffect(() => {
    let cancelled = false
    fetch('/api/user/settings')
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return
        const persisted = d?.settings?.default_domains
        if (Array.isArray(persisted) && persisted.length > 0) {
          setDomains(persisted.filter((x: unknown): x is string => typeof x === 'string'))
        }
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])

  const persistDomains = async () => {
    setDomainsSaving(true)
    try {
      await fetch('/api/user/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ default_domains: domains }),
      })
    } catch (e) {
      console.warn('Failed to persist default_domains:', e)
    } finally {
      setDomainsSaving(false)
    }
  }

  const last = STEPS.length - 1
  const next = async () => {
    // Persist domains when leaving the Domains step. Best-effort; errors
    // don't block forward navigation since the user can always edit later.
    if (step === 2) await persistDomains()
    setStep((s) => Math.min(last, s + 1))
  }
  const back = () => setStep((s) => Math.max(0, s - 1))

  const finish = async () => {
    // Persist any pending state before leaving. Domains again, defensively.
    await persistDomains()
    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen bg-[var(--paper)]">
      {/* Top bar — brand only */}
      <div className="flex items-center justify-between px-7 py-[18px] border-b-[1.5px] border-[var(--line)] bg-[var(--paper)]">
        <div style={{ fontFamily: 'var(--font-display)' }} className="text-[22px] leading-none tracking-tight">
          Linguosity<span className="text-terracotta">.</span>
        </div>
        <div className="wf-label">Step {step + 1} of {STEPS.length}</div>
        <Link href="/dashboard" className="wf-sm" style={{ textDecoration: 'none' }}>
          Skip &amp; go to dashboard →
        </Link>
      </div>

      <div className="wf-onb-wrap">
        {/* Left rail — step nav */}
        <aside className="wf-onb-rail">
          {STEPS.map((s, i) => (
            <button
              key={s.num}
              type="button"
              className={`wf-onb-rail-step ${i === step ? 'active' : ''} ${i < step ? 'done' : ''}`}
              onClick={() => setStep(i)}
              aria-current={i === step ? 'step' : undefined}
            >
              <div className="wf-onb-rail-num">{i < step ? '✓' : s.num}</div>
              <div className="flex flex-col gap-0.5 min-w-0">
                <div className="wf-onb-rail-title">{s.title}</div>
                <div className="wf-onb-rail-sub">{s.sub}</div>
              </div>
            </button>
          ))}
        </aside>

        {/* Main content */}
        <main className="wf-onb-main">
          {step === 0 && (
            <div className="wf-onb-body">
              <h2 className="wf-onb-h2">What&rsquo;s your primary setting?</h2>
              <p className="wf-onb-lede">
                This tunes default templates, rubric weights, and vocabulary. You can change it any time.
              </p>
              <div className="wf-onb-grid-choices">
                {ROLE_OPTIONS.map(o => (
                  <button
                    key={o.v}
                    type="button"
                    className={`wf-onb-choice ${role === o.v ? 'on' : ''}`}
                    onClick={() => setRole(o.v)}
                    aria-pressed={role === o.v}
                  >
                    <div className="wf-onb-choice-title">{o.t}</div>
                    <div className="wf-onb-choice-desc">{o.d}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="wf-onb-body">
              <h2 className="wf-onb-h2">Who do you work with?</h2>
              <p className="wf-onb-lede">
                Age ranges and languages you encounter. Determines which tools surface first in the library.
              </p>

              <div className="wf-onb-field">
                <div className="wf-label bold">Age ranges</div>
                <div className="wf-onb-chip-row">
                  {([
                    ['preschool', 'Preschool (3–5)'],
                    ['k-5', 'K–5'],
                    ['6-12', '6–12'],
                    ['adult', 'Adult'],
                  ] as const).map(([k, l]) => (
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
              </div>

              <div className="wf-onb-field">
                <div className="wf-label bold">Languages on caseload</div>
                <div className="wf-onb-chip-row">
                  {([
                    ['english', 'English'],
                    ['spanish', 'Spanish'],
                    ['other', 'Other (add later)'],
                  ] as const).map(([k, l]) => (
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
              </div>

              <div className="wf-onb-field">
                <div className="wf-label bold">Settings</div>
                <div className="wf-onb-chip-row">
                  {([
                    ['school', 'School'],
                    ['clinic', 'Clinic'],
                    ['tele', 'Teletherapy'],
                  ] as const).map(([k, l]) => (
                    <button
                      key={k}
                      type="button"
                      className={`wf-onb-chip ${settings[k] ? 'on' : ''}`}
                      onClick={() => setSettings(p => ({ ...p, [k]: !p[k] }))}
                      aria-pressed={!!settings[k]}
                    >
                      {l}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="wf-onb-body">
              <h2 className="wf-onb-h2">Which areas do you typically assess?</h2>
              <p className="wf-onb-lede">
                These are the ASHA-scope domains your reports will default to. Pick a preset
                that matches your role, or expand the categories and check exactly the leaves
                you cover. You can change this any time, and adjust per-report when you create
                a new evaluation.
              </p>
              <p className="wf-sm" style={{ marginTop: -4, color: 'var(--ink-3)' }}>
                Just starting out? Pick a few that interest you, or skip — your defaults will
                fill themselves as you write reports.
              </p>
              <DomainTreePicker
                value={domains}
                onChange={setDomains}
                showPresets
                showSearch
              />
              {domainsSaving && (
                <div className="wf-sm" style={{ color: 'var(--ink-4)', marginTop: 4 }}>
                  Saving…
                </div>
              )}
            </div>
          )}

          {step === 3 && (
            <div className="wf-onb-body">
              <h2 className="wf-onb-h2">Pick a starting template</h2>
              <p className="wf-onb-lede">
                You can edit any template and save custom ones later. This is just your default.
              </p>
              <div className="wf-onb-template-grid">
                {TEMPLATE_OPTIONS.map(o => (
                  <button
                    key={o.v}
                    type="button"
                    className={`wf-onb-template ${template === o.v ? 'on' : ''}`}
                    onClick={() => setTemplate(o.v)}
                    aria-pressed={template === o.v}
                  >
                    <div className="wf-onb-template-head">
                      <div className="wf-onb-template-title">{o.t}</div>
                      <div className="wf-onb-template-count">{o.sections} sections</div>
                    </div>
                    <div className="wf-onb-template-sub">{o.sub}</div>
                    <div className="wf-onb-template-preview">
                      {o.sections === 0 ? (
                        <div className="wf-onb-template-empty">— blank —</div>
                      ) : (
                        Array.from({ length: Math.min(o.sections, 6) }).map((_, i) => (
                          <div
                            key={i}
                            className="wf-onb-template-bar"
                            style={{ width: `${40 + ((i * 13) % 50)}%` }}
                          />
                        ))
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="wf-onb-body">
              <h2 className="wf-onb-h2">Privacy defaults</h2>
              <p className="wf-onb-lede">
                How identifying information is handled. Every setting is overridable per-report;
                these are your defaults.
              </p>

              <ToggleRow
                title="On-device PII detection"
                desc="Names, DOBs, addresses, and MRNs are detected and swapped for synthetic IDs in your browser before anything leaves."
                value={pii.onDevice}
                onChange={v => setPii(p => ({ ...p, onDevice: v }))}
              />
              <ToggleRow
                title="Hide real names by default on dashboard"
                desc="Cards show synthetic IDs (STU-0421) until you reveal. Useful in shared-screen settings."
                value={pii.hideDefault}
                onChange={v => setPii(p => ({ ...p, hideDefault: v }))}
              />
              <ToggleRow
                title="Audit log of every AI request"
                desc="Tokenized prompt + response logged for defensibility. Never includes the de-identification mapping."
                value={pii.audit}
                onChange={v => setPii(p => ({ ...p, audit: v }))}
              />

              <div className="wf-onb-note">
                <b>For districts:</b> your admin may have locked some of these. Locked settings
                show a small ⌂ glyph and can&rsquo;t be changed here.
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="wf-onb-body center">
              <svg width="72" height="72" viewBox="0 0 72 72" aria-hidden="true">
                <circle cx="36" cy="36" r="34" stroke="var(--line)" strokeWidth="1.5" fill="#fff5ee" />
                <path
                  d="M22 37 L32 47 L52 25"
                  stroke="var(--terracotta-ink)" strokeWidth="3"
                  strokeLinecap="round" strokeLinejoin="round" fill="none"
                />
              </svg>
              <h2 className="wf-onb-h2" style={{ textAlign: 'center' }}>
                You&rsquo;re set up.
              </h2>
              <p
                className="wf-onb-lede"
                style={{ textAlign: 'center', maxWidth: '52ch', marginInline: 'auto' }}
              >
                Jump into your first report now, or head to the dashboard and take your time.
                Everything you just configured lives in <b>Settings → Profile</b>.
              </p>
              <div className="flex gap-3 justify-center mt-4">
                <button type="button" className="wf-btn primary" onClick={() => router.push('/dashboard/reports/new')}>
                  Start my first report →
                </button>
                <button type="button" className="wf-btn ghost" onClick={finish}>
                  Go to dashboard
                </button>
              </div>
            </div>
          )}

          {/* Footer — prev / dots / next */}
          <div className="wf-onb-footer">
            <button
              type="button"
              className="wf-btn ghost"
              onClick={back}
              disabled={step === 0}
            >
              ← Back
            </button>
            <div className="wf-onb-dots" aria-hidden="true">
              {STEPS.map((_, i) => (
                <span
                  key={i}
                  className={`wf-onb-dot ${i === step ? 'on' : i < step ? 'done' : ''}`}
                />
              ))}
            </div>
            {step < last ? (
              <button type="button" className="wf-btn primary" onClick={next}>
                Continue →
              </button>
            ) : (
              <button type="button" className="wf-btn ghost" onClick={finish}>
                Skip to dashboard
              </button>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}

function ToggleRow({
  title,
  desc,
  value,
  onChange,
}: {
  title: string
  desc: string
  value: boolean
  onChange: (next: boolean) => void
}) {
  return (
    <div className="wf-onb-toggle-row">
      <div className="flex flex-col gap-1">
        <div className="wf-onb-toggle-title">{title}</div>
        <div className="wf-onb-toggle-sub">{desc}</div>
      </div>
      <button
        type="button"
        className={`wf-onb-toggle ${value ? 'on' : ''}`}
        onClick={() => onChange(!value)}
        aria-pressed={value}
        aria-label={title}
      >
        <div className="wf-onb-toggle-knob" />
      </button>
    </div>
  )
}
