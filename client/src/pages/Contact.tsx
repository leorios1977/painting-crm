import { useState } from 'react';
import { Link } from 'wouter';

interface FormData {
  firstName: string;
  lastName: string;
  companyName: string;
  email: string;
  phone: string;
  city: string;
  state: string;
  currentChallenge: string;
  interestedTier: string;
  heardFrom: string;
}

const INITIAL_FORM: FormData = {
  firstName: '',
  lastName: '',
  companyName: '',
  email: '',
  phone: '',
  city: '',
  state: 'TX',
  currentChallenge: '',
  interestedTier: '',
  heardFrom: '',
};

type SubmitStatus = 'idle' | 'loading' | 'success' | 'error';

export default function Contact() {
  const [form, setForm] = useState<FormData>(INITIAL_FORM);
  const [status, setStatus] = useState<SubmitStatus>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    setForm(prev => ({ 
      ...prev, 
      [e.target.name]: e.target.value 
    }));
  };

  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();
    setStatus('loading');
    setErrorMsg('');

    try {
      const response = await fetch('/api/demo-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: form.firstName,
          lastName: form.lastName,
          companyName: form.companyName,
          email: form.email,
          phone: form.phone,
          city: form.city,
          state: form.state,
          currentChallenge: form.currentChallenge,
          interestedTier: form.interestedTier,
          heardFrom: form.heardFrom,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Submission failed');
      }

      setStatus('success');
      setForm(INITIAL_FORM);
    } catch (err) {
      setStatus('error');
      setErrorMsg(
        err instanceof Error 
          ? err.message 
          : 'Something went wrong. Please try again.'
      );
    }
  };

  if (status === 'success') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-10 text-center">
          <div className="text-6xl mb-4">🎉</div>
          <h1 className="text-2xl font-black text-gray-900 mb-3">
            You're on the list!
          </h1>
          <p className="text-gray-600 mb-2">
            We received your demo request and will reach out 
            within 24 hours to schedule your free walkthrough.
          </p>
          <p className="text-gray-500 text-sm mb-8">
            Check your email for a confirmation from 
            agentflowfounder@gmail.com
          </p>
          <div className="bg-blue-50 rounded-xl p-4 mb-8 text-left">
            <p className="text-blue-800 text-sm font-semibold mb-1">
              What happens next:
            </p>
            <ul className="text-blue-700 text-sm space-y-1">
              <li>✓ Personal call from Rogelio (Agent Flow LLC)</li>
              <li>✓ Live demo of your PaintersMax dashboard</li>
              <li>✓ Custom plan recommendation for your business</li>
              <li>✓ Founding member rate locked in at signup</li>
            </ul>
          </div>
          <Link href="/">
            <a className="text-blue-600 hover:text-blue-700 font-medium text-sm">
              ← Back to PaintersMax
            </a>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/">
            <a className="flex items-center gap-2">
              <span className="text-2xl">🎨</span>
              <span className="font-bold text-xl text-gray-900">
                PaintersMax
              </span>
            </a>
          </Link>
          <Link href="/#pricing">
            <a className="text-sm text-gray-600 hover:text-blue-600 transition-colors">
              View Pricing
            </a>
          </Link>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-16">
        
        {/* Page header */}
        <div className="text-center mb-10">
          <div className="inline-block bg-yellow-400 text-gray-900 text-xs font-black uppercase tracking-wider px-3 py-1.5 rounded-full mb-4">
            ⚡ Limited Spots Per Market
          </div>
          <h1 className="text-4xl font-black text-gray-900 mb-3">
            Schedule Your Free Demo
          </h1>
          <p className="text-lg text-gray-600">
            See exactly how PaintersMax will work for your 
            painting business. No pressure. No credit card. 
            Just a real conversation about growing your company.
          </p>
        </div>

        {/* Trust bar */}
        <div className="flex items-center justify-center gap-6 flex-wrap text-sm text-gray-500 mb-10">
          <span>✓ 30-minute call</span>
          <span>✓ Live demo</span>
          <span>✓ Custom plan recommendation</span>
          <span>✓ Founding rate locked at signup</span>
        </div>

        {/* Form */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          
          {status === 'error' && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 text-red-700 text-sm">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            
            {/* Name row */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  First Name *
                </label>
                <input
                  type="text"
                  name="firstName"
                  value={form.firstName}
                  onChange={handleChange}
                  required
                  placeholder="John"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Last Name *
                </label>
                <input
                  type="text"
                  name="lastName"
                  value={form.lastName}
                  onChange={handleChange}
                  required
                  placeholder="Smith"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>
            </div>

            {/* Company */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Company Name *
              </label>
              <input
                type="text"
                name="companyName"
                value={form.companyName}
                onChange={handleChange}
                required
                placeholder="ABC Painting Co."
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>

            {/* Email + Phone */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Email Address *
                </label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  required
                  placeholder="john@abcpainting.com"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  required
                  placeholder="(214) 555-0100"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>
            </div>

            {/* City + State */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  City *
                </label>
                <input
                  type="text"
                  name="city"
                  value={form.city}
                  onChange={handleChange}
                  required
                  placeholder="Dallas"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  State *
                </label>
                <select
                  name="state"
                  value={form.state}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white"
                >
                  {[
                    'TX','CA','FL','NY','GA','NC','OH',
                    'PA','IL','AZ','CO','WA','NV','TN',
                    'VA','MI','OR','MN','SC','IN','Other'
                  ].map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Interested tier */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Which plan interests you?
              </label>
              <select
                name="interestedTier"
                value={form.interestedTier}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white"
              >
                <option value="">Not sure yet</option>
                <option value="starter">
                  Starter — $49/month
                </option>
                <option value="pro">
                  Pro — $97/month
                </option>
                <option value="max">
                  Max — $197/month (Most Popular)
                </option>
                <option value="enterprise">
                  Enterprise — Custom pricing
                </option>
              </select>
            </div>

            {/* Current challenge */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                What's your biggest business challenge right now? *
              </label>
              <textarea
                name="currentChallenge"
                value={form.currentChallenge}
                onChange={handleChange}
                required
                rows={3}
                placeholder="e.g. I'm losing leads because I don't follow up fast enough, or I spend too much time on invoicing..."
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm resize-none"
              />
            </div>

            {/* Heard from */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                How did you hear about PaintersMax?
              </label>
              <select
                name="heardFrom"
                value={form.heardFrom}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white"
              >
                <option value="">Select one</option>
                <option value="google">Google Search</option>
                <option value="email">Email</option>
                <option value="referral">
                  Referral from another painter
                </option>
                <option value="facebook">Facebook</option>
                <option value="instagram">Instagram</option>
                <option value="cold-call">Phone call</option>
                <option value="other">Other</option>
              </select>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={status === 'loading'}
              className="w-full py-4 bg-yellow-400 text-gray-900 font-black text-lg rounded-xl hover:bg-yellow-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-yellow-200"
            >
              {status === 'loading' 
                ? 'Submitting...' 
                : 'Schedule My Free Demo →'}
            </button>

            <p className="text-xs text-center text-gray-400">
              🔒 No credit card required · 
              We'll reach out within 24 hours · 
              Founding member rates locked at signup
            </p>

          </form>
        </div>

        {/* Bottom reassurance */}
        <div className="mt-8 text-center">
          <p className="text-gray-500 text-sm">
            Questions? Email us directly at{' '}
            <a href="mailto:agentflowfounder@gmail.com"
              className="text-blue-600 hover:underline">
              agentflowfounder@gmail.com
            </a>
          </p>
        </div>

      </div>
    </div>
  );
}
