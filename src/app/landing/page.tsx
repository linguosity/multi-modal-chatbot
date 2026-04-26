import Link from 'next/link'
import Image from 'next/image'

/** Public pre-auth splash — wireframe splash.jsx.
 * Editorial, restrained, no stock imagery. One clear CTA per state. */

const PRIVACY_FLOW_STEPS = [
  {
    num: '01',
    title: 'Evidence arrives',
    body:
      'Upload an assessment PDF, audio session, or handwritten notes — anything you would normally bring into your evaluation.',
    src: '/landing/step-1-evidence-arrives.png',
    alt: 'A raw evaluation PDF showing labels for student name, date of birth, and SSN — the kind of document a clinician would normally upload.',
  },
  {
    num: '02',
    title: 'Private details are removed first',
    body:
      'Names, dates of birth, SSNs, and other identifiers are detected and replaced with stable placeholders. The real values stay on our server, never in the prompt.',
    src: '/landing/step-2-private-details-removed.png',
    alt: 'The same evaluation document with student-identifying fields replaced by placeholders [STUDENT_1], [DOB], and [REMOVED].',
  },
  {
    num: '03',
    title: 'AI sees placeholders, not identities',
    body:
      'Our pipeline sends only the redacted prompt to the model. Real names, dates of birth, SSNs, and other identifiers never cross the wire.',
    src: '/landing/step-3-ai-sees-placeholders.png',
    alt: 'A diagram of the AI provider receiving only redacted placeholders, with a severed dashed line marked × showing what is blocked from leaving the server.',
  },
  {
    num: '04',
    title: 'Report is restored in your secure session',
    body:
      'Identifiers are decoded locally inside your authenticated session — visible to you, never to the AI provider.',
    src: '/landing/step-4-report-restored.png',
    alt: 'A laptop showing a restored evaluation report with student name visible and SSN masked, in a secure clinician session.',
  },
]

export default function LandingPage() {
  return (
    <div className="wf-splash-wrap">
      <header className="wf-splash-nav">
        <div className="wf-splash-brand">
          Linguosity<span className="wf-splash-brand-dot">.</span>
        </div>
        <nav className="wf-splash-nav-links">
          <a href="#features">How it works</a>
          <a href="#privacy">Privacy</a>
          <a href="#pricing">Pricing</a>
          <Link href="/auth">Sign in</Link>
          <Link href="/auth" className="wf-btn primary sm" style={{ textDecoration: 'none' }}>
            Start a trial
          </Link>
        </nav>
      </header>

      <section className="wf-splash-hero">
        <div className="wf-splash-tag">
          For speech-language pathologists · schools &amp; clinics
        </div>
        <h1 className="wf-splash-h1">
          Evaluations that write themselves<br />
          <span className="wf-splash-h1-accent">— but only where it&rsquo;s safe to.</span>
        </h1>
        <p className="wf-splash-lede">
          Linguosity reads your sources — standardized tests, language samples, parent intake,
          classroom observations — and drafts an evidence-linked report skeleton you finish in
          minutes, not hours. Identifying information never leaves your device.
        </p>
        <div className="wf-splash-cta-row">
          <Link href="/auth" className="wf-btn primary" style={{ textDecoration: 'none' }}>
            Start a 30-day trial
          </Link>
          <a href="#features" className="wf-btn ghost">
            Watch a 90-second demo →
          </a>
        </div>
        <div className="wf-splash-proof">
          <div><b>Evidence-linked</b> drafts</div>
          <span className="wf-splash-dot-sep">·</span>
          <div><b>FERPA</b>-aligned architecture</div>
          <span className="wf-splash-dot-sep">·</span>
          <div><b>BAA</b> available for clinical customers</div>
        </div>
      </section>

      <section id="features" className="wf-splash-feature-row">
        <div className="wf-splash-feature">
          <div className="wf-splash-feat-num">01</div>
          <div className="wf-splash-feat-title">Upload anything</div>
          <div className="wf-splash-feat-body">
            PDFs, audio, photos of test forms, typed notes. Mixed-language sources welcome.
          </div>
        </div>
        <div className="wf-splash-feature">
          <div className="wf-splash-feat-num">02</div>
          <div className="wf-splash-feat-title">Evidence-linked drafts</div>
          <div className="wf-splash-feat-body">
            Every sentence in the draft traces back to the source it came from. No hallucinated findings.
          </div>
        </div>
        <div className="wf-splash-feature">
          <div className="wf-splash-feat-num">03</div>
          <div className="wf-splash-feat-title">Your clinical judgement, preserved</div>
          <div className="wf-splash-feat-body">
            Linguosity suggests. You decide eligibility. Every AI suggestion is tagged, overridable, and auditable.
          </div>
        </div>
      </section>

      <section id="privacy" className="wf-splash-privacy">
        <svg width="54" height="54" viewBox="0 0 54 54" aria-hidden="true" style={{ flexShrink: 0 }}>
          <path
            d="M27 4 L46 11 V27 C46 38 38 46 27 49 C16 46 8 38 8 27 V11 Z"
            stroke="var(--line)" strokeWidth="1.5" fill="#fff5ee"
          />
          <path
            d="M18 28 L24 34 L37 20"
            stroke="var(--terracotta-ink)" strokeWidth="2.5"
            strokeLinecap="round" strokeLinejoin="round" fill="none"
          />
        </svg>
        <div className="flex flex-col gap-2 flex-1">
          <div className="wf-splash-privacy-kicker">Private by design</div>
          <div className="wf-splash-privacy-title">
            Student names. DOBs. Addresses. MRNs.<br />
            None of it reaches the model.
          </div>
          <div className="wf-splash-privacy-body">
            Identifying information is detected and replaced with safe placeholders
            before any analysis runs. The mapping between placeholder and real value
            stays on our server — only your authenticated session can decode it.
          </div>
          <a href="#privacy-flow" className="wf-splash-privacy-link">See how it works ↓</a>
        </div>
      </section>

      <section id="privacy-flow" className="wf-splash-flow">
        <div className="wf-splash-flow-header">
          <div className="wf-splash-flow-kicker">How identification works</div>
          <h3 className="wf-splash-flow-headline">
            Four checkpoints between intake and inference.
          </h3>
        </div>

        {PRIVACY_FLOW_STEPS.map((step) => (
          <div key={step.num} className="wf-splash-flow-step">
            <div className="wf-splash-flow-img">
              <Image
                src={step.src}
                alt={step.alt}
                fill
                sizes="(max-width: 768px) 100vw, 360px"
                className="wf-splash-flow-img-el"
              />
            </div>
            <div className="wf-splash-flow-copy">
              <div className="wf-splash-flow-num">Step {step.num}</div>
              <h4 className="wf-splash-flow-title">{step.title}</h4>
              <p className="wf-splash-flow-body">{step.body}</p>
            </div>
          </div>
        ))}

        <div className="wf-splash-flow-footer">
          <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="M12 2 L20 5 V12 C20 17 16 20 12 21 C8 20 4 17 4 12 V5 Z"
              stroke="var(--terracotta-ink)" strokeWidth="1.5" fill="#fff5ee"
            />
            <path
              d="M12 9 v3 m0 3 v0.01"
              stroke="var(--terracotta-ink)" strokeWidth="2"
              strokeLinecap="round" fill="none"
            />
          </svg>
          <span>
            Student-identifying information is removed before AI processing.
            The model never sees the student&rsquo;s real name, date of birth, or SSN.
          </span>
        </div>
      </section>

      <section id="pricing" className="wf-splash-tier-grid">
        <div className="wf-splash-tier">
          <div className="wf-splash-tier-name">Solo</div>
          <div className="wf-splash-tier-price">$29<span>/mo</span></div>
          <ul>
            <li>Up to 30 reports / school year</li>
            <li>Full upload &amp; drafting</li>
            <li>Preloaded tool library</li>
            <li>Email support</li>
          </ul>
          <Link href="/auth" className="wf-btn sm" style={{ textDecoration: 'none' }}>Start with Solo</Link>
        </div>
        <div className="wf-splash-tier featured">
          <div className="wf-splash-tier-badge">Most popular</div>
          <div className="wf-splash-tier-name">Practice</div>
          <div className="wf-splash-tier-price">$79<span>/mo per SLP</span></div>
          <ul>
            <li>Unlimited reports</li>
            <li>Custom templates &amp; custom tools</li>
            <li>Convergence beeswarm + rubric</li>
            <li>Educational standards picker</li>
            <li>Priority support</li>
          </ul>
          <Link href="/auth" className="wf-btn sm primary" style={{ textDecoration: 'none' }}>Start with Practice</Link>
        </div>
        <div className="wf-splash-tier">
          <div className="wf-splash-tier-name">District</div>
          <div className="wf-splash-tier-price">Contact<span>sales</span></div>
          <ul>
            <li>SSO, admin controls, audit log</li>
            <li>BAA &amp; district-level DPA</li>
            <li>On-prem de-identification option</li>
            <li>Staff training &amp; onboarding</li>
          </ul>
          <a href="mailto:hello@linguosity.ai" className="wf-btn sm" style={{ textDecoration: 'none' }}>
            Contact sales
          </a>
        </div>
      </section>

      <footer className="wf-splash-foot">
        <div>© 2026 Linguosity</div>
        <div className="flex gap-6">
          <a href="#">Privacy policy</a>
          <a href="#">Terms</a>
          <a href="#">Accessibility</a>
          <a href="mailto:hello@linguosity.ai">Contact</a>
        </div>
      </footer>
    </div>
  )
}
