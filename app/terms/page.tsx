import Link from "next/link";

export const metadata = {
  title: "Terms & Conditions | SoniLearn",
  description: "Terms and conditions for using the SoniLearn educational test practice platform.",
};

const sections = [
  {
    title: "1. Student Accounts",
    content: [
      "You must provide accurate information when creating a SoniLearn account and keep your login credentials private. Each account is intended for the individual student who created it and must not be shared, sold, or transferred.",
      "You are responsible for activity carried out through your account and should contact us promptly if you believe it has been accessed without permission.",
    ],
  },
  {
    title: "2. Evaluation Access",
    content: [
      "SoniLearn may provide a 3-day evaluation period so you can review the platform before purchasing a subscription. Evaluation access may be limited, changed, or withdrawn where necessary to protect the service.",
    ],
  },
  {
    title: "3. Subscriptions and Payments",
    content: [
      "SoniLearn offers a Monthly Pass for ₹49 with 30 days of premium access and a Yearly Pass for ₹499 with 365 days of premium access. Referral discounts, when validly applied, may change the amount charged.",
      "Access begins after successful payment verification. Payment processing is handled through authorised payment partners, and subscription access is subject to the Cancellation & Refund Policy.",
    ],
  },
  {
    title: "4. Platform Conduct",
    content: [
      "You must use SoniLearn lawfully and fairly. Do not attempt to disrupt the service, bypass access controls, scrape or redistribute protected content, impersonate another user, manipulate scores or leaderboards, or submit abusive, misleading, or harmful material.",
      "We may suspend or terminate access for fraud, misuse, security concerns, or material violation of these terms. This does not limit any rights or remedies available under applicable law.",
    ],
  },
  {
    title: "5. Content and Availability",
    content: [
      "SoniLearn provides educational practice content for preparation and revision. We aim for accuracy but do not guarantee that every question, explanation, result, or service feature will always be error-free or continuously available.",
      "We may update, remove, or improve content and features without notice. SoniLearn content may not be copied, resold, or republished without permission.",
    ],
  },
  {
    title: "6. Changes and Contact",
    content: [
      "We may update these terms as the platform or applicable requirements change. Continued use after an update means you accept the revised terms. For questions, contact supportsonilearn@gmail.com.",
    ],
  },
];

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 text-slate-900 sm:px-6 sm:py-14">
      <article className="mx-auto max-w-4xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <header className="border-b border-slate-100 bg-slate-900 px-6 py-8 text-white sm:px-10 sm:py-10">
          <Link href="/" className="text-xs font-bold text-blue-300 transition hover:text-white">SoniLearn</Link>
          <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">Terms &amp; Conditions</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">Rules for using the SoniLearn educational test practice platform.</p>
          <p className="mt-5 text-xs font-semibold uppercase tracking-wider text-slate-400">Effective date: September 20, 2026</p>
        </header>
        <div className="space-y-8 px-6 py-8 sm:px-10 sm:py-10">
          <p className="text-sm leading-7 text-slate-600">By creating an account or using SoniLearn, you agree to these Terms &amp; Conditions and our <Link href="/privacy" className="font-bold text-blue-600 hover:text-blue-700">Privacy Policy</Link>.</p>
          {sections.map((section) => (
            <section key={section.title}>
              <h2 className="text-lg font-black tracking-tight text-slate-900">{section.title}</h2>
              <div className="mt-2 space-y-3 text-sm leading-7 text-slate-600">{section.content.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</div>
            </section>
          ))}
        </div>
      </article>
    </main>
  );
}
