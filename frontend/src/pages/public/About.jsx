import React from 'react';
import { Link } from 'react-router-dom';
import {
  Compass,
  Building2,
  GraduationCap,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  FileText,
  Target,
  Users,
  CheckCircle2,
  Workflow,
  Lock,
} from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { APP_NAME, APP_TAGLINE } from '../../utils/constants';

export function About() {
  return (
    <div className="space-y-16 pb-20">
      {/* Hero */}
      <section className="pt-16 pb-12 bg-gradient-to-b from-white via-slate-50/50 to-pitch-canvas border-b border-slate-200/80">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-pitch-blue text-xs font-semibold mb-6">
            <Sparkles className="w-3.5 h-3.5" />
            <span>About PITCH Platform</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black font-display text-pitch-navy tracking-tight leading-tight">
            Transforming College Sponsorships into a Transparent, Accountable Marketplace
          </h1>

          <p className="mt-6 text-base sm:text-lg text-pitch-muted leading-relaxed">
            PITCH is a dedicated two-sided platform bridging corporate brand sponsors and collegiate student committees.
            By replacing chaotic messaging channels and unverified decks with structured negotiations, cryptographic MoUs,
            and fulfillment tracking, PITCH brings institutional professional standards to campus sponsorships.
          </p>
        </div>
      </section>

      {/* Core Challenges Addressed */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <h2 className="text-2xl font-bold font-display text-pitch-navy">
            The Problems PITCH Solves
          </h2>
          <p className="text-xs sm:text-sm text-pitch-muted mt-1.5">
            Why traditional campus marketing outreach fails sponsors and student organizers alike.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="p-6 border-slate-200">
            <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center mb-4">
              <Users className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-pitch-navy font-display mb-2">
              Fragmented Discovery & Cold Outreach
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Student committees spend hundreds of hours sending unverified cold emails or spamming LinkedIn inboxes with generic PDF decks.
              Brands receive uncurated sponsorship proposals with no objective footfall verification or college context.
            </p>
          </Card>

          <Card className="p-6 border-slate-200">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4">
              <Workflow className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-pitch-navy font-display mb-2">
              Unstructured In-Kind Negotiations
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Campus sponsorships rarely involve cash alone. Merchandise, beverages, technical software licenses, event venues,
              and speaker travel are routinely promised across informal chat threads, causing confusion over actual deliverable commitments.
            </p>
          </Card>

          <Card className="p-6 border-slate-200">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4">
              <FileText className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-pitch-navy font-display mb-2">
              Lack of Contractual Certainty
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Agreements finalized on messaging apps have no version governance. PITCH automatically synthesizes accepted proposal terms into
              an immutable <strong>PITCH_MOU_V1</strong> document snapshot with a SHA-256 tamper-evident hash for mutual transparency.
            </p>
          </Card>

          <Card className="p-6 border-slate-200">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-pitch-navy font-display mb-2">
              Vanishing Institutional Memory
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Every year, student leadership graduates and fest relationships restart from scratch. PITCH preserves verified completion history,
              evidence photos, and reciprocal ratings so college bodies build compound reputation over multiple academic cycles.
            </p>
          </Card>
        </div>
      </section>

      {/* Architecture & Safety Boundaries */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-8 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="text-lg font-bold font-display text-pitch-navy">
              Architectural & Governance Boundaries
            </h3>
            <p className="text-xs text-pitch-muted mt-1">
              Grounded in the authoritative project specifications.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-xs text-slate-600 leading-relaxed">
            <div>
              <h4 className="font-bold text-pitch-text mb-1">Direct Settlement Only</h4>
              <p>
                PITCH is an agreement orchestration workspace, not a payment gateway. We do not hold sponsor funds or operate an escrow wallet.
                Monetary disbursements occur directly between the corporate sponsor and the educational institution.
              </p>
            </div>

            <div>
              <h4 className="font-bold text-pitch-text mb-1">Demo Digital Signing</h4>
              <p>
                Our signing interface establishes mutual agreement within an academic demo setting. It does not replace statutory court-certified
                e-signatures (such as Aadhaar eSign or DigiLocker notary credentials).
              </p>
            </div>

            <div>
              <h4 className="font-bold text-pitch-text mb-1">Verified vs Self-Reported</h4>
              <p>
                Only deals completed through the PITCH proposal, MoU, and fulfillment pipeline contribute to platform reputation. External offline events
                are strictly labeled as <strong>SELF-REPORTED</strong>.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center pt-6">
        <h3 className="text-xl font-bold font-display text-pitch-navy mb-3">
          Ready to Connect with Top Campus Festivals?
        </h3>
        <p className="text-xs sm:text-sm text-pitch-muted max-w-xl mx-auto mb-6">
          Discover verified events or list your committee's upcoming fest in minutes.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link to="/events">
            <Button variant="primary" size="md">
              Explore Events
            </Button>
          </Link>
          <Link to="/register">
            <Button variant="outline" size="md">
              Register Account
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}

export default About;
