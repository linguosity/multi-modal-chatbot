'use client'

import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function LandingPage() {
  return (
    <div className="bg-white text-gray-800">
      {/* Hero Section */}
      <section className="relative bg-secondary py-24 sm:py-32">
        <div className="absolute inset-0">
          <img
            className="w-full h-full object-cover opacity-30"
            src="/images/hero-image.jpg"
            alt="Abstract background with soft, playful shapes in pastel rust, beige, and black"
          />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              Generate professional speech & language reports in minutes.
            </h1>
            <p className="mt-6 text-xl text-muted-foreground max-w-3xl mx-auto">
              Spend less time on paperwork. Focus more on your students. AI-powered templates designed for busy clinicians.
            </p>
            <div className="mt-10 max-w-sm mx-auto sm:max-w-none sm:flex sm:justify-center">
              <div className="space-y-4 sm:space-y-0 sm:mx-auto sm:inline-grid sm:grid-cols-2 sm:gap-5">
                <Link href="/auth" passHref>
                  <Button size="lg" variant="primary">Start My Free Trial</Button>
                </Link>
                <Link href="#features" passHref>
                  <Button size="lg" variant="secondary">See How It Works</Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pain Points Section */}
      <section id="pain-points" className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-foreground">The challenges SLPs face every day</h2>
            <p className="mt-4 text-lg text-muted-foreground">We understand the pressures of being a clinician. You're not alone.</p>
          </div>
          <div className="mt-16 grid gap-10 lg:grid-cols-3">
            <div className="text-center">
              <img src="/images/pain-point-1.jpg" alt="Illustration of a stressed clinician with a large stack of paperwork" className="mx-auto h-48 w-auto rounded-lg shadow-md" />
              <h3 className="mt-6 text-xl font-bold text-foreground">Overwhelming Caseloads</h3>
              <p className="mt-2 text-base text-muted-foreground">Average caseloads exceed 40 students. Clinicians wish they could spend less time on documentation and more time with students.</p>
            </div>
            <div className="text-center">
              <img src="/images/paint-point-two.jpg" alt="Illustration of a clock with hands indicating time pressure" className="mx-auto h-48 w-auto rounded-lg shadow-md" />
              <h3 className="mt-6 text-xl font-bold text-foreground">Time-Consuming Evaluations</h3>
              <p className="mt-2 text-base text-muted-foreground">SLPs spend 4-16 hours per evaluation, including testing and writing. That's hours of administrative work for every student.</p>
            </div>
            <div className="text-center">
              <img src="/images/pain-point-three.jpg" alt="Illustration of a supportive team collaborating" className="mx-auto h-48 w-auto rounded-lg shadow-md" />
              <h3 className="mt-6 text-xl font-bold text-foreground">Limited Resources & Support</h3>
              <p className="mt-2 text-base text-muted-foreground">Therapists report not having enough time or resources and desire more time, staff and access to evidence-based materials.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Solution Overview */}
      <section id="features" className="bg-secondary py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:text-center">
            <h2 className="text-base text-primary font-semibold tracking-wide uppercase">Our Solution</h2>
            <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-foreground sm:text-4xl">
              The easiest way to write speech & language reports.
            </p>
            <p className="mt-4 max-w-2xl text-xl text-muted-foreground lg:mx-auto">
              Our AI uses smart templates to turn your unstructured notes into polished, professional reports, reducing hours of work to minutes. We are HIPAA/FERPA compliant and our eligibility criteria are always up-to-date.
            </p>
          </div>
          <div className="mt-12">
            <img src="/images/app-banner.jpg" alt="App screenshot of report writing interface" className="mx-auto rounded-lg shadow-xl" />
          </div>
        </div>
      </section>

      {/* Feature Highlights */}
      <section className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-foreground">Everything you need for efficient reporting</h2>
          </div>
          <div className="mt-16 grid gap-10 md:grid-cols-2 lg:grid-cols-4">
            <div className="text-center">
              <img src="/images/icon-one.jpg" alt="Smart Templates & AI Assistance icon" className="mx-auto h-12 w-12" />
              <h3 className="mt-5 text-lg leading-6 font-medium text-foreground">Smart Templates & AI Assistance</h3>
              <p className="mt-2 text-base text-muted-foreground">Generate sections for articulation, language, fluency and voice with one click.</p>
            </div>
            <div className="text-center">
              <img src="/images/icon-two-eligibility.jpg" alt="Eligibility Code Lookup icon" className="mx-auto h-12 w-12" />
              <h3 className="mt-5 text-lg leading-6 font-medium text-foreground">Eligibility Code Lookup</h3>
              <p className="mt-2 text-base text-muted-foreground">Always up to date with state and federal criteria.</p>
            </div>
            <div className="text-center">
              <img src="/images/icon-parent-friendly-chart.jpg" alt="Parent-Friendly Charts icon" className="mx-auto h-12 w-12" />
              <h3 className="mt-5 text-lg leading-6 font-medium text-foreground">Parent-Friendly Charts</h3>
              <p className="mt-2 text-base text-muted-foreground">Automatically create bell curves and histograms of test scores.</p>
            </div>
            <div className="text-center">
              <img src="/images/icon-file-upload.jpg" alt="File Uploads & Transcription icon" className="mx-auto h-12 w-12" />
              <h3 className="mt-5 text-lg leading-6 font-medium text-foreground">File Uploads & Transcription</h3>
              <p className="mt-2 text-base text-muted-foreground">Upload language samples and audio; let the AI transcribe and summarize.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="bg-secondary py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-foreground">Choose the plan that's right for you</h2>
            <p className="mt-4 text-lg text-muted-foreground">Simple, flexible pricing for every clinician.</p>
          </div>
          <div className="mt-16 space-y-12 lg:space-y-0 lg:grid lg:grid-cols-3 lg:gap-x-8">
            <div className="relative p-8 bg-white border border-gray-medium rounded-2xl shadow-sm flex flex-col">
              <h3 className="text-2xl font-semibold text-foreground">Free Trial</h3>
              <p className="mt-4 text-muted-foreground">Get started for free.</p>
              <div className="mt-6">
                <span className="text-4xl font-extrabold text-foreground">$0</span>
              </div>
              <ul className="mt-6 space-y-4">
                <li className="flex space-x-3"><span className="flex-shrink-0 h-6 w-6 text-primary">✓</span><span>Up to 5 reports</span></li>
                <li className="flex space-x-3"><span className="flex-shrink-0 h-6 w-6 text-primary">✓</span><span>Text-only input</span></li>
                <li className="flex space-x-3"><span className="flex-shrink-0 h-6 w-6 text-primary">✓</span><span>Access to basic templates</span></li>
              </ul>
              <Link href="/auth" passHref>
                <Button className="mt-8 w-full" variant="primary">Start Free Trial</Button>
              </Link>
            </div>
            <div className="relative p-8 bg-white border-2 border-primary rounded-2xl shadow-lg flex flex-col transform scale-105">
              <div className="absolute top-0 right-0 -mt-4 -mr-4 px-3 py-1 bg-primary text-primary-foreground text-xs font-semibold rounded-full uppercase">Recommended</div>
              <h3 className="text-2xl font-semibold text-foreground">Standard</h3>
              <p className="mt-4 text-muted-foreground">For the busy clinician.</p>
              <div className="mt-6">
                <span className="text-4xl font-extrabold text-foreground">$9.99</span>
                <span className="text-base font-medium text-muted-foreground">/ month</span>
              </div>
              <ul className="mt-6 space-y-4">
                <li className="flex space-x-3"><span className="flex-shrink-0 h-6 w-6 text-primary">✓</span><span>15 report credits/month</span></li>
                <li className="flex space-x-3"><span className="flex-shrink-0 h-6 w-6 text-primary">✓</span><span>File uploads</span></li>
                <li className="flex space-x-3"><span className="flex-shrink-0 h-6 w-6 text-primary">✓</span><span>AI transcription</span></li>
                <li className="flex space-x-3"><span className="flex-shrink-0 h-6 w-6 text-primary">✓</span><span>Up-to-date eligibility codes</span></li>
              </ul>
              <Link href="/auth" passHref>
                <Button className="mt-8 w-full" variant="primary">Choose Standard</Button>
              </Link>
            </div>
            <div className="relative p-8 bg-white border border-gray-medium rounded-2xl shadow-sm flex flex-col">
              <h3 className="text-2xl font-semibold text-foreground">Pro Bundles</h3>
              <p className="mt-4 text-muted-foreground">Pay as you go.</p>
              <div className="mt-6">
                <span className="text-4xl font-extrabold text-foreground">$6.99+</span>
              </div>
              <ul className="mt-6 space-y-4">
                <li className="flex space-x-3"><span className="flex-shrink-0 h-6 w-6 text-primary">✓</span><span>$6.99 for 5 credits</span></li>
                <li className="flex space-x-3"><span className="flex-shrink-0 h-6 w-6 text-primary">✓</span><span>$14.99 for 15 credits</span></li>
                <li className="flex space-x-3"><span className="flex-shrink-0 h-6 w-6 text-primary">✓</span><span>$24.99 for 30 credits</span></li>
                <li className="flex space-x-3"><span className="flex-shrink-0 h-6 w-6 text-primary">✓</span><span>Credits roll over for 90 days</span></li>
              </ul>
              <Link href="/auth" passHref>
                <Button className="mt-8 w-full" variant="primary">Buy Credits</Button>
              </Link>
            </div>
          </div>
          <p className="mt-12 text-center text-base text-muted-foreground">
            SLPs typically handle 5–20 reports per month. Choose the bundle that matches your caseload.
          </p>
        </div>
      </section>

      {/* Social Proof Section */}
      <section className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-3 lg:gap-8">
            <div className="text-center bg-white p-8 rounded-lg shadow-md border border-gray-medium">
              <img className="mx-auto h-24 w-24 rounded-full" src="/landing/testimonial-1.jpg" alt="" />
              <div className="mt-4">
                <p className="text-lg font-medium text-foreground">I cut my report-writing time from 8 hours to 1 hour.</p>
                <p className="mt-1 text-sm text-muted-foreground">- Sarah L., SLP</p>
              </div>
            </div>
            <div className="mt-10 lg:mt-0 text-center bg-white p-8 rounded-lg shadow-md border border-gray-medium">
              <img className="mx-auto h-24 w-24 rounded-full" src="/landing/testimonial-2.jpg" alt="" />
              <div className="mt-4">
                <p className="text-lg font-medium text-foreground">This tool has been a lifesaver. I feel so much less stressed.</p>
                <p className="mt-1 text-sm text-muted-foreground">- Michael B., CCC-SLP</p>
              </div>
            </div>
            <div className="mt-10 lg:mt-0 text-center bg-white p-8 rounded-lg shadow-md border border-gray-medium">
              <img className="mx-auto h-24 w-24 rounded-full" src="/landing/testimonial-3.jpg" alt="" />
              <div className="mt-4">
                <p className="text-lg font-medium text-foreground">The parent-friendly charts are a game-changer for conferences.</p>
                <p className="mt-1 text-sm text-muted-foreground">- Emily C., School-Based SLP</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="bg-secondary py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-center text-3xl font-extrabold text-foreground">Frequently Asked Questions</h2>
            <div className="mt-12 space-y-8">
              <div>
                <h3 className="text-lg font-medium text-foreground">How do credits work?</h3>
                <p className="mt-2 text-base text-muted-foreground">One credit is used for each report you generate. You can purchase more credits as needed, and they roll over for 90 days.</p>
              </div>
              <div>
                <h3 className="text-lg font-medium text-foreground">Is my data secure?</h3>
                <p className="mt-2 text-base text-muted-foreground">Yes, we take data security very seriously. Our platform is HIPAA and FERPA compliant, and we do not share your data for advertising purposes. All data is encrypted in transit and at rest.</p>
              </div>
              <div>
                <h3 className="text-lg font-medium text-foreground">Can I cancel at any time?</h3>
                <p className="mt-2 text-base text-muted-foreground">Yes, you can cancel your subscription at any time. You will still have access to your account until the end of your billing period.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="bg-primary">
        <div className="max-w-2xl mx-auto text-center py-16 px-4 sm:py-20 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-extrabold text-primary-foreground sm:text-4xl">
            <span className="block">Ready to dive in?</span>
            <span className="block">Start your free trial today.</span>
          </h2>
          <div className="mt-8 flex justify-center">
            <div className="inline-flex rounded-md shadow">
              <Link href="/auth" passHref>
                <Button size="lg" variant="secondary">Get started</Button>
              </Link>
            </div>
            <div className="ml-3 inline-flex">
              <Link href="#" passHref>
                <Button size="lg" variant="ghost" className="text-primary-foreground hover:bg-primary-foreground hover:text-primary">Contact us</Button>
              </Link>
            </div>
          </div>
          <p className="mt-4 text-sm text-primary-foreground">No credit card required. Cancel anytime.</p>
        </div>
      </section>
    </div>
  )
}
