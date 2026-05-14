import { useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

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

// ─── Pricing tier data ────────────────────────────────────────────────────────

const pricingTiers = [
  {
    name: "Starter",
    price: "$97",
    period: "/mo",
    description: "Perfect for solo painters just getting started.",
    highlight: false,
    features: [
      "1 user seat",
      "Unlimited leads & pipeline",
      "Professional invoicing",
      "Stripe payment collection",
      "Customer portal",
      "Email notifications",
    ],
  },
  {
    name: "Pro",
    price: "$197",
    period: "/mo",
    description: "The most popular plan for growing painting businesses.",
    highlight: true,
    badge: "Most Popular",
    features: [
      "Up to 5 user seats",
      "Everything in Starter",
      "SMS automation (Twilio)",
      "Job scheduling & crew",
      "Google review requests",
      "Photo gallery",
      "Blog & content tools",
    ],
  },
  {
    name: "Max",
    price: "$397",
    period: "/mo",
    description: "For established companies that want every advantage.",
    highlight: false,
    features: [
      "Unlimited user seats",
      "Everything in Pro",
      "White-label branding",
      "AI assistant",
      "Priority support",
      "Custom onboarding",
      "API access",
    ],
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
            <Link href="/login">
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
                Start Free Trial
              </Button>
            </Link>
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
            Built exclusively for painting contractors
          </Badge>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold leading-tight mb-6 tracking-tight">
            Run Your Painting Business
            <br className="hidden sm:block" />
            <span className="text-yellow-300"> Like a Pro</span>
          </h1>
          <p className="text-lg sm:text-xl text-blue-100 max-w-2xl mx-auto mb-10 leading-relaxed">
            CRM, invoicing, scheduling, SMS &amp; more — built for painters.
            Stop juggling spreadsheets and start closing more jobs.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup">
              <Button
                size="lg"
                className="bg-yellow-400 hover:bg-yellow-300 text-gray-900 font-bold text-base px-8 py-6 rounded-xl shadow-lg hover:shadow-xl transition-all"
              >
                Start Free Trial →
              </Button>
            </Link>
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

      {/* ── Social proof strip ────────────────────────────────────────────────── */}
      <section className="bg-gray-50 border-y border-gray-100 py-8">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="flex flex-wrap justify-center gap-x-12 gap-y-4 text-sm text-gray-500 font-medium">
            {["500+ painting companies", "50,000+ leads managed", "$8M+ invoiced", "4.9 ★ average rating"].map((stat) => (
              <span key={stat} className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 inline-block" />
                {stat}
              </span>
            ))}
          </div>
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
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-4">
              Simple, transparent pricing
            </h2>
            <p className="text-lg text-gray-500 max-w-xl mx-auto">
              Choose the plan that fits your business. Upgrade or cancel anytime.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
            {pricingTiers.map((tier) => (
              <div
                key={tier.name}
                className={`relative flex flex-col rounded-2xl p-8 transition-all ${
                  tier.highlight
                    ? "bg-blue-700 text-white shadow-2xl scale-105 border-2 border-blue-500"
                    : "bg-white border border-gray-200 shadow-sm hover:shadow-md"
                }`}
              >
                {tier.badge && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <Badge className="bg-yellow-400 text-gray-900 font-bold px-4 py-1 text-xs shadow">
                      {tier.badge}
                    </Badge>
                  </div>
                )}
                <div className="mb-6">
                  <h3
                    className={`text-xl font-bold mb-1 ${
                      tier.highlight ? "text-white" : "text-gray-900"
                    }`}
                  >
                    {tier.name}
                  </h3>
                  <p
                    className={`text-sm mb-4 ${
                      tier.highlight ? "text-blue-200" : "text-gray-500"
                    }`}
                  >
                    {tier.description}
                  </p>
                  <div className="flex items-end gap-1">
                    <span
                      className={`text-5xl font-extrabold ${
                        tier.highlight ? "text-white" : "text-gray-900"
                      }`}
                    >
                      {tier.price}
                    </span>
                    <span
                      className={`text-base mb-2 ${
                        tier.highlight ? "text-blue-200" : "text-gray-400"
                      }`}
                    >
                      {tier.period}
                    </span>
                  </div>
                </div>

                <ul className="flex-1 space-y-3 mb-8">
                  {tier.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <span
                        className={`mt-0.5 text-base ${
                          tier.highlight ? "text-yellow-300" : "text-blue-600"
                        }`}
                      >
                        ✓
                      </span>
                      <span className={tier.highlight ? "text-blue-100" : "text-gray-600"}>
                        {f}
                      </span>
                    </li>
                  ))}
                </ul>

                <Link href="/signup">
                  <Button
                    className={`w-full font-semibold py-5 rounded-xl text-base ${
                      tier.highlight
                        ? "bg-yellow-400 hover:bg-yellow-300 text-gray-900"
                        : "bg-blue-600 hover:bg-blue-700 text-white"
                    }`}
                  >
                    Get Started →
                  </Button>
                </Link>
              </div>
            ))}
          </div>
          <p className="text-center text-sm text-gray-400 mt-8">
            All plans include a 14-day free trial. No credit card required.
          </p>
        </div>
      </section>

      {/* ── CTA Banner ───────────────────────────────────────────────────────── */}
      <section className="bg-blue-700 py-20 text-white text-center">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <h2 className="text-3xl sm:text-4xl font-extrabold mb-4">
            Ready to grow your painting business?
          </h2>
          <p className="text-blue-200 text-lg mb-8">
            Join hundreds of painting contractors who use PaintersMax to win more jobs and get paid faster.
          </p>
          <Link href="/signup">
            <Button
              size="lg"
              className="bg-yellow-400 hover:bg-yellow-300 text-gray-900 font-bold text-base px-10 py-6 rounded-xl shadow-lg"
            >
              Start Your Free Trial Today →
            </Button>
          </Link>
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
                <div className="text-xs text-gray-500">paintersmax.app</div>
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
            © {new Date().getFullYear()} Agent Flow LLC · paintersmax.app · All rights reserved
          </div>
        </div>
      </footer>
    </div>
  );
}
