import Link from "next/link";

export const metadata = {
  title: "Cancellation & Refund Policy | SoniLearn",
  description: "Cancellation and refund policy for SoniLearn digital test passes.",
};

export default function RefundPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 text-slate-900 sm:px-6 sm:py-14">
      <article className="mx-auto max-w-4xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <header className="border-b border-slate-100 bg-slate-900 px-6 py-8 text-white sm:px-10 sm:py-10">
          <Link href="/" className="text-xs font-bold text-blue-300 transition hover:text-white">SoniLearn</Link>
          <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">Cancellation &amp; Refund Policy</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">Clear payment support for SoniLearn digital test passes.</p>
          <p className="mt-5 text-xs font-semibold uppercase tracking-wider text-slate-400">Effective date: September 20, 2026</p>
        </header>
        <div className="space-y-8 px-6 py-8 sm:px-10 sm:py-10">
          <section>
            <h2 className="text-lg font-black tracking-tight text-slate-900">1. Digital Service</h2>
            <p className="mt-2 text-sm leading-7 text-slate-600">SoniLearn subscriptions are digital test passes that provide access to online practice tests, results, analysis, and related premium features. Because access is delivered digitally, a pass cannot be returned like a physical product.</p>
          </section>
          <section>
            <h2 className="text-lg font-black tracking-tight text-slate-900">2. Review Before Purchase</h2>
            <p className="mt-2 text-sm leading-7 text-slate-600">A 3-day free evaluation is provided before purchase where available, so students can review the platform and decide whether premium access is suitable. Please confirm your selected plan and amount before completing payment.</p>
          </section>
          <section>
            <h2 className="text-lg font-black tracking-tight text-slate-900">3. Cancellation and Support</h2>
            <p className="mt-2 text-sm leading-7 text-slate-600">Once a digital pass has been successfully activated, cancellation or refunds are generally not available for change of mind or unused access. If you experience a failed activation, an incorrect charge, or an accidental duplicate transaction, contact supportsonilearn@gmail.com within 48 hours with your payment details. We will investigate and, where appropriate, process a correction or refund through the original payment method.</p>
          </section>
          <section>
            <h2 className="text-lg font-black tracking-tight text-slate-900">4. Payment Issues</h2>
            <p className="mt-2 text-sm leading-7 text-slate-600">Refund timelines may depend on the payment provider and banking network. This policy does not limit any rights available under applicable consumer protection or payment regulations.</p>
          </section>
        </div>
      </article>
    </main>
  );
}
