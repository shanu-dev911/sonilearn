import Link from "next/link";
import { Mail, Clock } from "lucide-react";

export const metadata = {
  title: "Contact Us | SoniLearn",
  description: "Contact SoniLearn support for account, payment, and platform assistance.",
};

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 text-slate-900 sm:px-6 sm:py-14">
      <article className="mx-auto max-w-3xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <header className="border-b border-slate-100 bg-slate-900 px-6 py-8 text-white sm:px-10 sm:py-10">
          <Link href="/" className="text-xs font-bold text-blue-300 transition hover:text-white">SoniLearn</Link>
          <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">Contact Us</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">We are here to help with account, payment, and learning-platform questions.</p>
        </header>
        <div className="space-y-5 px-6 py-8 sm:px-10 sm:py-10">
          <a href="mailto:supportsonilearn@gmail.com" className="flex items-start gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-5 transition hover:border-blue-200 hover:bg-blue-50">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-700"><Mail size={19} /></span>
            <span><span className="block text-xs font-black uppercase tracking-wider text-slate-500">Support email</span><span className="mt-1 block text-sm font-bold text-blue-700">supportsonilearn@gmail.com</span></span>
          </a>
          <div className="flex items-start gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700"><Clock size={19} /></span>
            <span><span className="block text-xs font-black uppercase tracking-wider text-slate-500">Response time</span><span className="mt-1 block text-sm font-bold text-slate-800">Within 24-48 business hours</span></span>
          </div>
          <p className="pt-3 text-sm leading-7 text-slate-600">When contacting support about a payment, include the email used for your SoniLearn account and the relevant order or payment reference. Please do not send passwords or full card details.</p>
        </div>
      </article>
    </main>
  );
}
