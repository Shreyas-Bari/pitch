import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Compass,
  MessageSquare,
  FileCheck2,
  ShieldCheck,
  CheckCircle,
  Award,
  ArrowRight,
  Sparkles,
  Building2,
  GraduationCap,
  Layers,
  FileText,
  AlertTriangle,
  Upload,
} from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';

const WORKFLOW_STEPS = [
  {
    num: '01',
    title: 'Discover & Align',
    desc: 'Brands browse curated campus festivals filtered by target audience and city. Committees showcase expected footfall, tier packages, and sponsorship categories.',
    icon: Compass,
    companyAction: 'Filter events by audience demographic & contribution formats.',
    committeeAction: 'Publish event profile with sponsorship requirements & tiers.',
  },
  {
    num: '02',
    title: 'Connect & Inquire',
    desc: 'Companies submit tailored applications for specific packages. Committees can directly invite matched brands whose sponsorship preferences align with their fest.',
    icon: MessageSquare,
    companyAction: 'Apply to an event with initial brand pitch & proposed contribution.',
    committeeAction: 'Review incoming applications or send direct invitations to brands.',
  },
  {
    num: '03',
    title: 'Negotiate Deliverables',
    desc: 'Formal proposals and counter-proposals establish exact commitments across 11 formats: Cash, Product, Food, Beverage, Merchandise, Equipment, Service, and Venue.',
    icon: Layers,
    companyAction: 'Counter-propose deliverable terms without overwriting version history.',
    committeeAction: 'Accept agreeable terms to lock deal configuration into formal status.',
  },
  {
    num: '04',
    title: 'PITCH_MOU_V1 Closing',
    desc: 'Upon mutual agreement, PITCH automatically synthesizes a legal snapshot document with a SHA-256 cryptographic hash and demo academic digital signing flow.',
    icon: FileCheck2,
    companyAction: 'Review agreed clauses, PDF preview, and sign demo authorization.',
    committeeAction: 'Execute authorized signature to transition deal to Active Execution.',
  },
  {
    num: '05',
    title: 'Fulfillment & Evidence',
    desc: 'Student committees upload proof of work (stage banners, logo placements, social posts, footfall footage). Sponsors review delivered items and confirm fulfillment.',
    icon: Upload,
    companyAction: 'Track milestone progress and inspect submitted evidence files.',
    committeeAction: 'Upload deliverables proof and submit fulfillment milestones.',
  },
  {
    num: '06',
    title: 'Complete & Repute',
    desc: 'When all deliverables are accounted for, both parties confirm deal completion and leave reciprocal reviews. Verified reputation compounds over years.',
    icon: Award,
    companyAction: 'Rate committee professionalism and confirm completed partnership.',
    committeeAction: 'Build institutional track record to attract recurring brand partners.',
  },
];

export function HowItWorks() {
  const [activeTab, setActiveTab] = useState('company'); // 'company' | 'committee'

  return (
    <div className="space-y-20 pb-24">
      {/* Hero */}
      <section className="pt-16 pb-12 bg-gradient-to-b from-white via-slate-50/50 to-pitch-canvas border-b border-slate-200/80">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-pitch-blue text-xs font-semibold mb-6">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Platform Lifecycle Guide</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black font-display text-pitch-navy tracking-tight leading-tight">
            How PITCH Works
          </h1>

          <p className="mt-6 text-base sm:text-lg text-pitch-muted leading-relaxed">
            From initial discovery through proposal negotiation, SHA-256 sealed MoUs, fulfillment verification,
            and reciprocal reputation — here is how PITCH orchestrates collegiate sponsorship deals.
          </p>

          {/* Perspective Selector */}
          <div className="mt-8 inline-flex items-center p-1.5 rounded-2xl bg-slate-100 border border-slate-200">
            <button
              type="button"
              onClick={() => setActiveTab('company')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'company'
                  ? 'bg-white text-pitch-navy shadow-sm'
                  : 'text-pitch-muted hover:text-pitch-navy'
              }`}
            >
              <Building2 className="w-4 h-4 text-pitch-blue" />
              <span>For Brand Sponsors</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('committee')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'committee'
                  ? 'bg-white text-pitch-navy shadow-sm'
                  : 'text-pitch-muted hover:text-pitch-navy'
              }`}
            >
              <GraduationCap className="w-4 h-4 text-purple-600" />
              <span>For Student Committees</span>
            </button>
          </div>
        </div>
      </section>

      {/* 6 Step Visual Breakdown */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="space-y-6">
          {WORKFLOW_STEPS.map((step) => {
            const IconComponent = step.icon;
            const highlightedAction = activeTab === 'company' ? step.companyAction : step.committeeAction;
            const roleColor = activeTab === 'company' ? 'text-pitch-blue' : 'text-purple-600';
            const roleBg = activeTab === 'company' ? 'bg-blue-50 border-blue-100' : 'bg-purple-50 border-purple-100';

            return (
              <Card key={step.num} className="p-6 sm:p-8 border-slate-200 hover:border-slate-300 transition-all">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-pitch-navy text-white flex items-center justify-center font-display font-black text-sm flex-shrink-0">
                      {step.num}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold font-display text-pitch-navy">
                        {step.title}
                      </h3>
                      <p className="text-xs text-pitch-muted">
                        Phase {step.num} in platform deal lifecycle
                      </p>
                    </div>
                  </div>

                  <div className={`px-3 py-1.5 rounded-xl border text-xs font-medium flex items-center gap-1.5 ${roleBg} ${roleColor}`}>
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Your Action: {activeTab === 'company' ? 'Brand Sponsor' : 'Fest Committee'}</span>
                  </div>
                </div>

                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-4">
                  {step.desc}
                </p>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-700 flex items-center gap-2">
                  <span className="font-semibold text-pitch-navy">Step Focus:</span>
                  <span>{highlightedAction}</span>
                </div>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Critical Platform Rules Grid */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-8 rounded-3xl bg-white border border-slate-200/90 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200 mb-2">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Crucial Platform Rules & Understandings</span>
            </div>
            <h3 className="text-xl font-bold font-display text-pitch-navy">
              Financial and Legal Disclaimers
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-slate-600 leading-relaxed">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1.5">
              <h4 className="font-bold text-pitch-text text-sm">No Payment Gateway or Escrow</h4>
              <p>
                PITCH is purely a collaboration, negotiation, and verification platform. Financial transfers happen outside the platform
                directly into university or committee accounts. PITCH tracks payment milestones and receipts.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1.5">
              <h4 className="font-bold text-pitch-text text-sm">Academic Demo Digital Signing</h4>
              <p>
                Our digital signing records mutual party intention with SHA-256 document snapshot hashing for the academic project environment.
                It is not equivalent to a certified digital certificate or notarized deed.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1.5">
              <h4 className="font-bold text-pitch-text text-sm">Packages Are Initial Offers</h4>
              <p>
                Packages listed by committees are discovery baselines. They become binding only when negotiated into an agreed proposal
                and sealed into a PITCH_MOU_V1 agreement.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1.5">
              <h4 className="font-bold text-pitch-text text-sm">Self-Reported History Labeling</h4>
              <p>
                To maintain authentic trust, previous festivals conducted before joining PITCH are marked as <strong>SELF-REPORTED</strong>.
                Only completed PITCH deals with verified evidence count toward platform reputation scores.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Call to action */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h3 className="text-xl font-bold font-display text-pitch-navy mb-3">
          Start Exploring Active Campus Sponsorships
        </h3>
        <p className="text-xs sm:text-sm text-pitch-muted max-w-md mx-auto mb-6">
          Find college festivals matching your brand or register your campus committee today.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link to="/events">
            <Button variant="primary" size="md">
              Browse Events
            </Button>
          </Link>
          <Link to="/register">
            <Button variant="outline" size="md">
              Create Free Account
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}

export default HowItWorks;
