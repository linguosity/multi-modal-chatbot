'use client'

import { useMemo, useState } from 'react'
import { Sheet, SheetContent } from '@/components/ui/sheet'

// ─── Static tool catalog (hard-coded for now) ────────────────────────────────
// TODO: move to Supabase `assessment_tools` table once the migration lands.

interface Tool {
  id: string
  name: string
  acronym: string
  ed: string
  domains: string[]
  age: string
  norms: string
  verified: boolean
  summary: string
  useCase: string
  validity: string
  citation: string
  defaults: { V: number; R: number; Rl: number; biMod: number }
  tags: string[]
}

const TOOLS: Tool[] = [
  {
    id: 'celf-5', name: 'Clinical Evaluation of Language Fundamentals', acronym: 'CELF-5', ed: '5th ed.',
    domains: ['receptive language', 'expressive language', 'semantics', 'syntax'],
    age: '5;0 – 21;11', norms: 'US English-monolingual', verified: true,
    summary: 'A norm-referenced assessment of language abilities used to identify language disorders in children and adolescents.',
    useCase: 'Administered to evaluate receptive and expressive language across structured tasks including word classes, sentence comprehension, formulated sentences, and recalling sentences.',
    validity: 'Demonstrates strong reliability (α = .90–.95) and validity in the standardization population. Caution: norms based on US English-monolingual children; results for bilingual children should be interpreted alongside dynamic and ecological data.',
    citation: 'Wiig, E. H., Semel, E., & Secord, W. A. (2013). Clinical Evaluation of Language Fundamentals (5th ed.). Pearson.',
    defaults: { V: 2, R: 2, Rl: 3, biMod: -1 }, tags: ['language', 'school-age'],
  },
  {
    id: 'gfta-3', name: 'Goldman-Fristoe Test of Articulation', acronym: 'GFTA-3', ed: '3rd ed.',
    domains: ['articulation', 'phonology'], age: '2;0 – 21;11', norms: 'US English-monolingual', verified: true,
    summary: 'A standardized measure of articulation of consonant sounds in initial, medial, and final word positions.',
    useCase: 'Used to identify speech sound errors and inform articulation goals in therapy planning.',
    validity: 'High inter-rater reliability. Norms reflect US English speakers; bilingual phonology may show contrastive influences not captured in scoring.',
    citation: 'Goldman, R., & Fristoe, M. (2015). Goldman-Fristoe Test of Articulation (3rd ed.). Pearson.',
    defaults: { V: 3, R: 3, Rl: 3, biMod: 0 }, tags: ['speech', 'articulation', 'all-ages'],
  },
  {
    id: 'besa', name: 'Bilingual English-Spanish Assessment', acronym: 'BESA', ed: '1st ed.',
    domains: ['phonology', 'morphosyntax', 'semantics'], age: '4;0 – 6;11', norms: 'Bilingual ES/EN children', verified: true,
    summary: 'A bilingual assessment designed for Spanish-English speaking children. Distinguishes language difference from disorder.',
    useCase: 'Administered when a child has dual-language exposure; results across both languages are interpreted together.',
    validity: 'Specifically validated for bilingual populations. High sensitivity/specificity for primary language impairment in bilingual children.',
    citation: 'Peña, E. D., Gutiérrez-Clellen, V. F., Iglesias, A., Goldstein, B. A., & Bedore, L. M. (2018). Bilingual English-Spanish Assessment. Brookes Publishing.',
    defaults: { V: 3, R: 3, Rl: 3, biMod: 0 }, tags: ['language', 'bilingual', 'preschool'],
  },
  {
    id: 'pls-5', name: 'Preschool Language Scales', acronym: 'PLS-5', ed: '5th ed.',
    domains: ['receptive language', 'expressive language'], age: '0;0 – 7;11', norms: 'US English-monolingual', verified: true,
    summary: 'Norm-referenced developmental language assessment for infants through young children.',
    useCase: 'Common entry-point assessment for early intervention and preschool eligibility.',
    validity: 'Strong psychometrics for monolingual English children. Spanish edition (PLS-5 Spanish) available; English administration with bilingual children may underestimate ability.',
    citation: 'Zimmerman, I. L., Steiner, V. G., & Pond, R. E. (2011). Preschool Language Scales (5th ed.). Pearson.',
    defaults: { V: 2, R: 3, Rl: 3, biMod: -1 }, tags: ['language', 'preschool'],
  },
  {
    id: 'eowpvt-sbe', name: 'Expressive One-Word Picture Vocabulary Test, Spanish-Bilingual Edition', acronym: 'EOWPVT-SBE', ed: '4th ed.',
    domains: ['expressive vocabulary'], age: '2;0 – 70;0+', norms: 'Spanish-English bilingual speakers', verified: true,
    summary: 'Single-word expressive vocabulary assessment that credits responses in either Spanish or English.',
    useCase: 'Used to assess expressive vocabulary breadth in bilingual speakers without penalizing for language of response.',
    validity: 'Designed for bilingual populations; conceptual scoring reduces bias.',
    citation: 'Martin, N. A., & Brownell, R. (2012). Expressive One-Word Picture Vocabulary Test, Spanish-Bilingual Edition (4th ed.). Academic Therapy Publications.',
    defaults: { V: 3, R: 2, Rl: 3, biMod: 0 }, tags: ['vocabulary', 'bilingual', 'all-ages'],
  },
  {
    id: 'rowpvt-sbe', name: 'Receptive One-Word Picture Vocabulary Test, Spanish-Bilingual Edition', acronym: 'ROWPVT-SBE', ed: '4th ed.',
    domains: ['receptive vocabulary'], age: '2;0 – 70;0+', norms: 'Spanish-English bilingual speakers', verified: true,
    summary: 'Single-word receptive vocabulary measure honoring responses in Spanish or English.',
    useCase: 'Receptive companion to the EOWPVT-SBE for bilingual vocabulary assessment.',
    validity: 'Bilingual conceptual scoring; appropriate for bilingual learners.',
    citation: 'Martin, N. A., & Brownell, R. (2012). Receptive One-Word Picture Vocabulary Test, Spanish-Bilingual Edition (4th ed.). Academic Therapy Publications.',
    defaults: { V: 3, R: 2, Rl: 3, biMod: 0 }, tags: ['vocabulary', 'bilingual', 'all-ages'],
  },
  {
    id: 'kbit-2', name: 'Kaufman Brief Intelligence Test', acronym: 'KBIT-2', ed: '2nd ed.',
    domains: ['nonverbal IQ', 'verbal IQ'], age: '4;0 – 90;0+', norms: 'US English-monolingual', verified: true,
    summary: 'Brief screening of verbal and nonverbal intellectual ability.',
    useCase: 'Used by SLPs to rule out cognitive impairment as a primary explanation for language differences.',
    validity: 'Brief format limits depth. Use as a screener, not a diagnostic.',
    citation: 'Kaufman, A. S., & Kaufman, N. L. (2004). Kaufman Brief Intelligence Test (2nd ed.). Pearson.',
    defaults: { V: 2, R: 2, Rl: 2, biMod: -1 }, tags: ['cognitive', 'screener', 'all-ages'],
  },
  {
    id: 'casl-2', name: 'Comprehensive Assessment of Spoken Language', acronym: 'CASL-2', ed: '2nd ed.',
    domains: ['lexical/semantic', 'syntactic', 'pragmatic', 'supralinguistic'], age: '3;0 – 21;11', norms: 'US English-monolingual', verified: true,
    summary: 'In-depth oral language assessment across multiple linguistic categories.',
    useCase: 'Used when comprehensive language profile is needed beyond CELF-5 coverage.',
    validity: 'Strong psychometrics, longer administration. English-monolingual norms.',
    citation: 'Carrow-Woolfolk, E. (2017). Comprehensive Assessment of Spoken Language (2nd ed.). WPS.',
    defaults: { V: 2, R: 3, Rl: 3, biMod: -1 }, tags: ['language', 'school-age'],
  },
  {
    id: 'ppvt-5', name: 'Peabody Picture Vocabulary Test', acronym: 'PPVT-5', ed: '5th ed.',
    domains: ['receptive vocabulary'], age: '2;6 – 90;0+', norms: 'US English-monolingual', verified: true,
    summary: 'Standardized measure of single-word receptive vocabulary.',
    useCase: 'Quick receptive vocabulary screener; frequently paired with EVT-3 for receptive/expressive comparison.',
    validity: 'Robust for English speakers. Underestimates bilingual children.',
    citation: 'Dunn, D. M. (2018). Peabody Picture Vocabulary Test (5th ed.). Pearson.',
    defaults: { V: 2, R: 2, Rl: 3, biMod: -1 }, tags: ['vocabulary', 'all-ages'],
  },
  {
    id: 'evt-3', name: 'Expressive Vocabulary Test', acronym: 'EVT-3', ed: '3rd ed.',
    domains: ['expressive vocabulary'], age: '2;6 – 90;0+', norms: 'US English-monolingual', verified: true,
    summary: 'Standardized expressive vocabulary measure (labeling and synonym tasks).',
    useCase: 'Companion to PPVT-5 for receptive/expressive vocabulary discrepancy analysis.',
    validity: 'Robust English psychometrics. Bilingual considerations apply.',
    citation: 'Williams, K. T. (2018). Expressive Vocabulary Test (3rd ed.). Pearson.',
    defaults: { V: 2, R: 2, Rl: 3, biMod: -1 }, tags: ['vocabulary', 'all-ages'],
  },
  {
    id: 'wmls-r', name: 'Woodcock-Muñoz Language Survey, Revised', acronym: 'WMLS-R', ed: 'Revised',
    domains: ['oral language', 'literacy'], age: '2;0 – 90;0+', norms: 'US English; separate Spanish norms', verified: true,
    summary: 'Dual-language proficiency measure (Spanish and English forms).',
    useCase: 'Quantifies relative language proficiency to inform language(s) of intervention.',
    validity: 'Both forms normed independently; useful for language-of-instruction decisions.',
    citation: 'Woodcock, R. W., Muñoz-Sandoval, A. F., Ruef, M. L., & Alvarado, C. G. (2005). Woodcock-Muñoz Language Survey – Revised. Riverside Publishing.',
    defaults: { V: 2, R: 2, Rl: 2, biMod: 0 }, tags: ['language', 'bilingual', 'all-ages'],
  },
  {
    id: 'ctopp-2', name: 'Comprehensive Test of Phonological Processing', acronym: 'CTOPP-2', ed: '2nd ed.',
    domains: ['phonological awareness', 'phonological memory', 'rapid naming'], age: '4;0 – 24;11', norms: 'US English-monolingual', verified: true,
    summary: 'Assesses phonological processing skills foundational to literacy.',
    useCase: 'Used when reading/literacy concerns coexist with spoken language concerns.',
    validity: 'Strong reliability. Bilingual interpretation requires care.',
    citation: 'Wagner, R. K., Torgesen, J. K., Rashotte, C. A., & Pearson, N. A. (2013). Comprehensive Test of Phonological Processing (2nd ed.). PRO-ED.',
    defaults: { V: 2, R: 3, Rl: 3, biMod: -1 }, tags: ['phonology', 'literacy', 'school-age'],
  },
]

const ALL_TAGS = ['language', 'speech', 'vocabulary', 'phonology', 'bilingual', 'preschool', 'school-age', 'all-ages', 'literacy', 'cognitive']

export default function ToolLibraryPage() {
  const [query, setQuery] = useState('')
  const [activeTags, setActiveTags] = useState<string[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const toggleTag = (t: string) =>
    setActiveTags(prev => (prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]))

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return TOOLS.filter(t => {
      const matchQ = !q
        || t.name.toLowerCase().includes(q)
        || t.acronym.toLowerCase().includes(q)
        || t.domains.some(d => d.toLowerCase().includes(q))
      const matchTags = activeTags.length === 0 || activeTags.every(tag => t.tags.includes(tag))
      return matchQ && matchTags
    })
  }, [query, activeTags])

  const selected = selectedId ? TOOLS.find(t => t.id === selectedId) ?? null : null
  const bilingualCount = TOOLS.filter(t => t.tags.includes('bilingual')).length

  return (
    <div className="min-h-full bg-[var(--paper)] p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col gap-1 mb-6">
          <div className="wf-label">Settings · admin</div>
          <h1 className="wf-heading" style={{ fontSize: 30 }}>Assessment tool library.</h1>
          <p className="wf-sm">Curated catalog of standardized tools. When evidence matches a known tool, Linguosity attaches a summary, APA citation, validity statement, and rubric defaults.</p>
        </div>

        <div className="wf-lib-wrap">
          <div className="wf-lib-toolbar">
            <div className="wf-lib-search">
              <span className="wf-lib-search-icon">⌕</span>
              <input
                type="text"
                placeholder="Search tools, acronyms, domains…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                aria-label="Search tools"
              />
            </div>

            <div className="wf-lib-tags">
              {ALL_TAGS.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => toggleTag(t)}
                  className={`wf-lib-tag ${activeTags.includes(t) ? 'on' : ''}`}
                >
                  {t}
                </button>
              ))}
            </div>

            <button type="button" className="wf-btn sm primary">+ Add custom tool</button>
          </div>

          <div className="wf-lib-meta">
            <span><b>{filtered.length}</b> of {TOOLS.length} tools</span>
            <span>·</span>
            <span><b>{bilingualCount}</b> bilingual-validated</span>
            <span>·</span>
            <span><b>Last updated</b> 3 days ago</span>
          </div>

          <div className="wf-lib-grid">
            {filtered.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setSelectedId(t.id)}
                className="wf-lib-card"
              >
                <div className="wf-lib-card-head">
                  <span className="wf-lib-acronym">{t.acronym}</span>
                  {t.verified && <span className="wf-lib-verified">✓ verified</span>}
                </div>
                <div className="wf-lib-name">{t.name}</div>
                <div className="wf-lib-card-meta">
                  <div><span className="label">Ages</span><b>{t.age}</b></div>
                  <div><span className="label">Norms</span><b>{t.norms}</b></div>
                </div>
                <div className="wf-lib-domains">
                  {t.domains.slice(0, 3).map((d) => (
                    <span key={d} className="wf-lib-domain">{d}</span>
                  ))}
                  {t.domains.length > 3 && (
                    <span className="wf-lib-domain more">+{t.domains.length - 3}</span>
                  )}
                </div>
                <div className="wf-lib-tags-row">
                  {t.tags.map((tag) => (
                    <span key={tag} className="wf-lib-tagchip">{tag}</span>
                  ))}
                </div>
              </button>
            ))}

            {filtered.length === 0 && (
              <div className="wf-lib-empty">
                No tools match your filters.{' '}
                <button
                  type="button"
                  onClick={() => {
                    setQuery('')
                    setActiveTags([])
                  }}
                  className="wf-btn sm ghost ml-2"
                >
                  Reset
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <Sheet open={!!selected} onOpenChange={(open) => !open && setSelectedId(null)}>
        <SheetContent side="right" className="w-[560px] sm:max-w-[560px] bg-[var(--paper)] overflow-y-auto">
          {selected && <ToolDetail tool={selected} />}
        </SheetContent>
      </Sheet>
    </div>
  )
}

function ToolDetail({ tool }: { tool: Tool }) {
  return (
    <div className="flex flex-col gap-5 pt-2">
      <div className="flex items-start gap-3">
        <div className="wf-tool-acronym-lg">{tool.acronym}</div>
        <div className="flex flex-col gap-1 min-w-0 flex-1">
          <div className="wf-label">{tool.ed} · {tool.verified ? 'Verified' : 'Custom'}</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 19, lineHeight: 1.2 }}>{tool.name}</div>
        </div>
      </div>

      <div className="wf-tool-meta-row">
        <div>
          <span className="wf-label">Age range</span>
          <b>{tool.age}</b>
        </div>
        <div>
          <span className="wf-label">Norms</span>
          <b>{tool.norms}</b>
        </div>
      </div>

      <div className="wf-tool-domains-block">
        <div className="wf-label">Domains assessed</div>
        <div className="flex flex-wrap gap-1.5 mt-1.5">
          {tool.domains.map((d) => (
            <span key={d} className="wf-lib-domain">{d}</span>
          ))}
        </div>
      </div>

      <div>
        <div className="wf-label bold">Summary blurb</div>
        <p className="wf-tool-prose">{tool.summary}</p>
      </div>

      <div>
        <div className="wf-label bold">Use-case statement</div>
        <p className="wf-tool-prose">{tool.useCase}</p>
      </div>

      <div>
        <div className="wf-label bold">Validity statement</div>
        <p className="wf-tool-prose wf-tool-validity">{tool.validity}</p>
      </div>

      <div>
        <div className="wf-label bold">APA citation</div>
        <div className="wf-tool-citation">{tool.citation}</div>
      </div>

      <div className="wf-tool-defaults">
        <div className="wf-label bold mb-2">Rubric defaults</div>
        <div className="flex items-center gap-2">
          <span className="wf-mono-pill">V {tool.defaults.V}</span>
          <span className="wf-mono-pill">R {tool.defaults.R}</span>
          <span className="wf-mono-pill">Rel {tool.defaults.Rl}</span>
          {tool.defaults.biMod !== 0 && (
            <span className="wf-mono-pill warn">
              Bilingual {tool.defaults.biMod > 0 ? '+' : ''}{tool.defaults.biMod} V
            </span>
          )}
        </div>
        <div className="wf-sm mt-2" style={{ fontSize: 10.5 }}>
          Auto-applied when this tool is detected. SLP can override per-evidence in triage.
        </div>
      </div>

      <div className="flex gap-2 pt-2">
        <button type="button" className="wf-btn sm primary">Edit tool</button>
        <button
          type="button"
          className="wf-btn sm ghost"
          onClick={() => {
            if (typeof navigator !== 'undefined' && navigator.clipboard) {
              navigator.clipboard.writeText(tool.citation)
            }
          }}
        >
          Copy citation
        </button>
        <button type="button" className="wf-btn sm ghost">Mark deprecated</button>
      </div>
    </div>
  )
}
