import { useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LiveTicker } from '../components/LiveTicker';

// ─── Feature card data ────────────────────────────────────────────────────────

const features = [
  {
    icon: "🎯",
    title: "Lead Management",
    description:
      "Capture leads from your website, phone calls, and referrals. Track every prospect through your pipeline from first contact to signed contract.",
  },
  {
    icon: "📅",
    title: "Job Scheduling",
    description:
      "Drag-and-drop calendar for your crew. Schedule estimates, prep work, and painting jobs — and send automatic appointment reminders to customers.",
  },
  {
    icon: "💳",
    title: "Invoicing & Payments",
    description:
      "Create professional invoices in seconds and collect payment online via Stripe. Get paid faster with one-click payment links sent by SMS or email.",
  },
  {
    icon: "📱",
    title: "SMS Automation",
    description:
      "Automated texts for new leads, appointment reminders, invoice delivery, and job completion follow-ups — all powered by Twilio.",
  },
  {
    icon: "⭐",
    title: "Google Reviews",
    description:
      "Automatically ask happy customers for a Google review the moment a job is marked complete. Build your reputation on autopilot.",
  },
  {
    icon: "📸",
    title: "Photo Gallery",
    description:
      "Attach before-and-after photos to every job. Impress customers with a polished customer portal and build a portfolio that wins more bids.",
  },
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function Landing() {
  const { isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();

  // Redirect authenticated users straight to the dashboard
  useEffect(() => {
    if (!loading && isAuthenticated) {
      navigate("/dashboard");
    }
  }, [isAuthenticated, loading, navigate]);

  // While checking auth, render nothing to avoid flash
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans">
      <LiveTicker />

      {/* ── Nav ──────────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🎨</span>
            <span className="font-bold text-xl text-gray-900 tracking-tight">
              PaintersMax
            </span>
          </div>
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-600">
            <a href="#features" className="hover:text-blue-600 transition-colors">Features</a>
            <a href="#pricing" className="hover:text-blue-600 transition-colors">Pricing</a>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm" className="text-gray-700">
                Log in
              </Button>
            </Link>
            <a href="mailto:agentflowfounder@gmail.com">
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
                Schedule a Free Demo →
              </Button>
            </a>
          </div>
        </div>
      </header>

      {/* ── Hero ─────────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-700 text-white">
        {/* Background texture */}
        <div className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-24 md:py-36 text-center">
          <Badge className="mb-6 bg-white/20 text-white border-white/30 hover:bg-white/20 text-sm px-4 py-1">
            🔥 We prioritize markets with limited members — Is your market open?
          </Badge>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold leading-tight mb-6 tracking-tight">
            Run Your Painting Business
            <br className="hidden sm:block" />
            <span className="text-yellow-300"> Like a Pro</span>
          </h1>
          <p className="text-lg sm:text-xl text-blue-100 max-w-2xl mx-auto mb-10 leading-relaxed">
            While your competitors are still juggling spreadsheets and missed calls, you could be running a fully automated painting business — one that captures leads, sends invoices, follows up automatically, and markets itself while you focus on the work. PaintersMax was built exclusively for painting contractors. We just launched. Your competitors haven't found us yet.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="mailto:agentflowfounder@gmail.com">
              <Button
                size="lg"
                className="bg-yellow-400 hover:bg-yellow-300 text-gray-900 font-bold text-base px-8 py-6 rounded-xl shadow-lg hover:shadow-xl transition-all"
              >
                Schedule a Free Demo →
              </Button>
            </a>
            <a href="#features">
              <Button
                size="lg"
                variant="outline"
                className="border-white/40 text-white bg-white/10 hover:bg-white/20 font-semibold text-base px-8 py-6 rounded-xl"
              >
                See All Features
              </Button>
            </a>
          </div>
          <p className="mt-6 text-sm text-blue-200">
            No credit card required · Cancel anytime · Setup in minutes
          </p>
        </div>

        {/* Wave divider */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
            <path d="M0 60L1440 60L1440 20C1200 60 960 0 720 20C480 40 240 0 0 20L0 60Z" fill="white" />
          </svg>
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────────────────────────── */}
      <section id="features" className="py-24 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-4">
              Everything you need to grow your painting business
            </h2>
            <p className="text-lg text-gray-500 max-w-2xl mx-auto">
              One platform replaces your CRM, scheduling app, invoicing software, and review tool.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="group bg-white border border-gray-100 rounded-2xl p-7 shadow-sm hover:shadow-md hover:border-blue-100 transition-all"
              >
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ──────────────────────────────────────────────────────────── */}
      <section id="pricing" className="py-24 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">

          <div className="text-center mb-6">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Simple, Honest Pricing
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Founding member rates — locked in permanently at signup. As we add powerful new features every month, the price rises for new members. Yours stays the same. Forever.
            </p>
          </div>

          <div className="flex items-center justify-center gap-4 mb-12">
            <span className="text-gray-600 font-medium">Monthly</span>
            <span className="text-gray-400 text-sm">|</span>
            <span className="text-gray-600 font-medium">
              Annual
              <span className="ml-2 bg-green-100 text-green-700 text-xs font-bold px-2 py-0.5 rounded-full">
                Save 10%
              </span>
            </span>
            <span className="text-gray-500 text-xs">(upgrade anytime)</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-start">

            {/* TIER 1 — Starter */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 flex flex-col">
              <div className="mb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                  🔒 Founding Rate
                </span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-1">Starter</h3>
              <p className="text-gray-500 text-sm mb-4">
                Perfect for painters getting started with a professional digital presence
              </p>
              <div className="mb-1">
                <span className="text-4xl font-black text-gray-900">$49</span>
                <span className="text-gray-500">/month</span>
              </div>
              <p className="text-xs text-green-600 font-medium mb-6">or $529/year — save 10%</p>
              <ul className="space-y-2 mb-8 flex-1 text-sm">
                {[
                  '5-page professional website',
                  'Subdomain hosting included',
                  'Logo design (1 revision)',
                  'Lead management (50/month)',
                  'Basic invoicing (10/month)',
                  'Job scheduling calendar',
                  'Customer contact database',
                  'PaintersMax community access',
                  'Mobile responsive & SSL included',
                ].map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <span className="text-blue-500 mt-0.5">✓</span>
                    <span className="text-gray-700">{f}</span>
                  </li>
                ))}
              </ul>
              <a href="mailto:agentflowfounder@gmail.com"
                className="w-full py-3 px-4 border-2 border-gray-300 text-gray-700 font-semibold rounded-xl text-center hover:border-blue-500 hover:text-blue-600 transition-colors block">
                Schedule a Free Demo →
              </a>
              <p className="text-xs text-center text-gray-400 mt-2">No credit card required</p>
              <p className="text-xs text-center text-gray-400 mt-1">Upgrade anytime</p>
            </div>

            {/* TIER 2 — Pro */}
            <div className="bg-white rounded-2xl border border-blue-200 p-6 flex flex-col">
              <div className="mb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                  🔒 Founding Rate
                </span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-1">Pro</h3>
              <p className="text-gray-500 text-sm mb-4">
                For growing painting companies ready to automate and scale operations
              </p>
              <div className="mb-1">
                <span className="text-4xl font-black text-gray-900">$97</span>
                <span className="text-gray-500">/month</span>
              </div>
              <p className="text-xs text-green-600 font-medium mb-6">or $1,049/year — save 10%</p>
              <ul className="space-y-2 mb-8 flex-1 text-sm">
                {[
                  'Everything in Starter',
                  '10-page website',
                  'Custom domain name included',
                  'Unlimited leads & invoicing',
                  'SMS notifications to customers',
                  'Email automation & follow-ups',
                  'Crew member management',
                  'Job photos & documentation',
                  'Review request automation',
                  'Revenue tracking dashboard',
                  'Business card design included',
                ].map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <span className="text-blue-500 mt-0.5">✓</span>
                    <span className="text-gray-700">{f}</span>
                  </li>
                ))}
              </ul>
              <a href="mailto:agentflowfounder@gmail.com"
                className="w-full py-3 px-4 bg-blue-600 text-white font-semibold rounded-xl text-center hover:bg-blue-700 transition-colors block">
                Schedule a Free Demo →
              </a>
              <p className="text-xs text-center text-gray-400 mt-2">No credit card required</p>
              <p className="text-xs text-center text-gray-400 mt-1">Upgrade anytime</p>
            </div>

            {/* TIER 3 — Max (highlighted) */}
            <div className="bg-gradient-to-b from-yellow-400 to-yellow-500 rounded-2xl p-6 flex flex-col relative shadow-xl shadow-yellow-200 lg:scale-105">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap">
                <span className="bg-gray-900 text-white text-xs font-black uppercase tracking-wider px-4 py-1.5 rounded-full shadow-lg">
                  ⭐ Most Popular
                </span>
              </div>
              <div className="mb-4 mt-3">
                <span className="text-xs font-bold uppercase tracking-wider text-yellow-800 bg-yellow-300 px-2 py-1 rounded-full">
                  🔒 Founding Rate
                </span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-1">Max</h3>
              <p className="text-gray-800 text-sm mb-4">
                The complete growth engine for serious painting contractors who want to dominate their market
              </p>
              <div className="mb-1">
                <span className="text-4xl font-black text-gray-900">$197</span>
                <span className="text-gray-800">/month</span>
              </div>
              <p className="text-xs text-gray-800 font-medium mb-6">or $2,128/year — save 10%</p>
              <ul className="space-y-2 mb-8 flex-1 text-sm">
                {[
                  'Everything in Pro',
                  'AI Color Studio (room visualizer)',
                  'Aria AI chatbot on your website',
                  'Blueprint Bid Estimator (AI)',
                  'Advanced SEO optimization',
                  'Full brand kit included',
                  'Customer job-tracking portal',
                  'Profit margin calculator per job',
                  'Monthly strategy call (30 min)',
                  'Priority support (4hr response)',
                  'Social media ad templates',
                ].map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <span className="text-gray-900 mt-0.5">✓</span>
                    <span className="text-gray-900 font-medium">{f}</span>
                  </li>
                ))}
              </ul>
              <a href="mailto:agentflowfounder@gmail.com"
                className="w-full py-3 px-4 bg-gray-900 text-white font-semibold rounded-xl text-center hover:bg-gray-800 transition-colors block">
                Schedule a Free Demo →
              </a>
              <p className="text-xs text-center text-gray-800 mt-2">No credit card required</p>
              <p className="text-xs text-center text-gray-800 mt-1">Upgrade anytime</p>
            </div>

            {/* TIER 4 — Enterprise */}
            <div className="bg-gray-900 rounded-2xl p-6 flex flex-col">
              <div className="mb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-400 bg-gray-800 px-2 py-1 rounded-full">
                  For Large Operations
                </span>
              </div>
              <h3 className="text-xl font-bold text-white mb-1">Enterprise</h3>
              <p className="text-gray-400 text-sm mb-4">
                Multi-location painting companies and franchises needing custom solutions
              </p>
              <div className="mb-1">
                <span className="text-4xl font-black text-white">Custom</span>
              </div>
              <p className="text-xs text-gray-500 font-medium mb-6">Pricing based on your operation size</p>
              <ul className="space-y-2 mb-8 flex-1 text-sm">
                {[
                  'Everything in Max',
                  'Multiple locations & branches',
                  'White-label (your own brand)',
                  'Custom integrations',
                  'Dedicated account manager',
                  'Stripe Connect payments',
                  'API access',
                  'Custom feature development',
                  'Team training & onboarding',
                  '99.9% uptime SLA guarantee',
                ].map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <span className="text-yellow-400 mt-0.5">✓</span>
                    <span className="text-gray-300">{f}</span>
                  </li>
                ))}
              </ul>
              <a href="mailto:agentflowfounder@gmail.com"
                className="w-full py-3 px-4 border-2 border-gray-600 text-white font-semibold rounded-xl text-center hover:border-yellow-400 hover:text-yellow-400 transition-colors block">
                Contact Us →
              </a>
              <p className="text-xs text-center text-gray-500 mt-2">Let's build something custom</p>
            </div>

          </div>

          {/* Founding member lock-in callout */}
          <div className="mt-14 bg-blue-50 border border-blue-200 rounded-2xl p-8 text-center max-w-3xl mx-auto">
            <h3 className="text-xl font-bold text-gray-900 mb-3">
              🔐 Lock In Your Rate — Forever.
            </h3>
            <p className="text-gray-600 leading-relaxed">
              This is founding member pricing. Not a promotion. Not a trial gimmick. A permanent lock. PaintersMax adds powerful new features every month — AI estimators, color visualizers, marketing tools, bookkeeping dashboards, and more. Every new feature rolls out to ALL active members automatically, including you. As the platform grows more powerful, the price rises for new members. But YOUR rate stays exactly where it is today.
              <strong> Forever.</strong>
            </p>
            <p className="text-blue-700 font-bold text-lg mt-4">
              Early members get more. Pay less. Win bigger. That's the founding member advantage.
            </p>
            <p className="text-gray-500 text-sm mt-3">
              Save an additional 10% by choosing annual billing. Never worry about renewals again. Switch from monthly to annual anytime.
            </p>
          </div>

        </div>
      </section>

      {/* ── CTA Banner ───────────────────────────────────────────────────────── */}
      <section className="py-24 bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-700 text-white text-center">
        <div className="max-w-3xl mx-auto px-4">

          <div className="inline-block bg-yellow-400 text-gray-900 text-sm font-black uppercase tracking-wider px-4 py-2 rounded-full mb-8">
            ⚡ Limited Spots Per Market
          </div>

          <h2 className="text-4xl font-black mb-6 leading-tight">
            We prioritize markets with limited members.<br />
            Your competitors haven't found us yet.
          </h2>

          <p className="text-xl text-blue-100 mb-4 leading-relaxed">
            PaintersMax gives you a fully automated painting business — one that captures leads while you sleep, sends professional invoices in seconds, follows up with every prospect automatically, and puts your brand in front of homeowners in your market 24/7.
          </p>

          <p className="text-blue-200 mb-4 leading-relaxed">
            Every painter in America will be using software like this within 3 years. The painters who join in the first 100 will look back and say this was the smartest business decision they ever made.
          </p>

          <p className="text-blue-100 font-semibold mb-10">
            Founding rates. Locked in. Forever. First 100 members only.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <a href="mailto:agentflowfounder@gmail.com"
              className="bg-yellow-400 text-gray-900 font-black text-lg px-10 py-4 rounded-xl hover:bg-yellow-300 transition-colors shadow-xl inline-block">
              Schedule a Free Demo →
            </a>
            <a href="#pricing"
              className="border-2 border-white text-white font-semibold text-lg px-10 py-4 rounded-xl hover:bg-white hover:text-blue-700 transition-colors inline-block">
              See Pricing
            </a>
          </div>

          <p className="text-blue-200 text-sm">
            🔒 Price locked in for life at signup
            &nbsp;·&nbsp;
            No credit card to get started
            &nbsp;·&nbsp;
            Cancel anytime
            &nbsp;·&nbsp;
            Upgrade anytime
          </p>

        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────────────── */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🎨</span>
              <div>
                <div className="font-bold text-white text-lg">PaintersMax</div>
                <div className="text-xs text-gray-500">Built for painters. Powered by Agent Flow LLC.</div>
              </div>
            </div>
            <div className="flex flex-wrap justify-center gap-x-8 gap-y-2 text-sm">
              <a href="#features" className="hover:text-white transition-colors">Features</a>
              <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
              <Link href="/login" className="hover:text-white transition-colors">Log In</Link>
              <Link href="/signup" className="hover:text-white transition-colors">Sign Up</Link>
            </div>
            <div className="text-sm text-center md:text-right">
              <div className="text-gray-500">Powered by</div>
              <div className="text-gray-300 font-medium">Agent Flow LLC</div>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-800 text-center text-xs text-gray-600">
            © 2026 Agent Flow LLC · paintersmax.app · All rights reserved
          </div>
        </div>
      </footer>
    </div>
  );
}
