import Link from "next/link";

const sections = [
  {
    title: "1. Information We Collect",
    content: [
      "When you create or use a SoniLearn account, we may collect your name, email address, authentication details, selected exam preferences, and information you choose to provide in your profile.",
      "We also collect usage information such as tests attempted, answers, scores, accuracy, progress, leaderboard results, and related activity so that we can provide and improve your learning experience.",
    ],
  },
  {
    title: "2. How We Use Your Information",
    content: [
      "We use this information to operate your account, deliver practice tests and results, personalise learning features, maintain leaderboards, provide support, process subscriptions or payments, and protect the security of the platform.",
      "We may also use aggregated or de-identified information to understand platform usage and improve our content and services.",
    ],
  },
  {
    title: "3. Test Results and Public Features",
    content: [
      "Your test attempts, scores, accuracy, progress, and leaderboard position may be stored with your account. Where a leaderboard or competition is enabled, limited profile information such as your display name, score, or rank may be visible to other users.",
      "Please avoid entering sensitive personal information in feedback, profile fields, or any other free-text area.",
    ],
  },
  {
    title: "4. Service Providers and Payments",
    content: [
      "We may use trusted service providers for authentication, hosting, analytics, notifications, customer support, and payment processing. These providers receive only the information needed to perform their services and are expected to protect it.",
      "Payment details are processed by authorised payment partners. SoniLearn does not intend to store complete card, UPI, or banking credentials on its own servers.",
    ],
  },
  {
    title: "5. No Sale of Personal Data",
    content: [
      "SoniLearn does not sell, rent, or trade your personal information or test data to third parties for their own marketing purposes.",
      "We may disclose information when required by law, to protect users and the platform, or as part of a necessary business or service operation described in this policy.",
    ],
  },
  {
    title: "6. Cookies and Local Storage",
    content: [
      "SoniLearn may use cookies, browser storage, and similar technologies to keep you signed in, remember preferences, support the installable web app, and maintain essential platform functionality.",
    ],
  },
  {
    title: "7. Data Security and Retention",
    content: [
      "We use reasonable technical and organisational measures to protect account and learning data. No online service can guarantee complete security, so please keep your account credentials private.",
      "We retain information for as long as reasonably necessary to provide the service, meet legal or accounting requirements, resolve disputes, and maintain accurate learning records. You may contact us to request review or deletion of eligible personal data.",
    ],
  },
  {
    title: "8. Children and Minors",
    content: [
      "SoniLearn is intended for students preparing for examinations. If you are under the age required to provide consent under applicable Indian law, please use the service with the involvement of a parent or legal guardian.",
    ],
  },
  {
    title: "9. Your Choices",
    content: [
      "You may review or update available profile information from your account. You may also contact us about access, correction, or deletion requests, subject to applicable law and records that we are required to retain.",
    ],
  },
  {
    title: "10. Changes to This Policy",
    content: [
      "We may update this Privacy Policy when our services or legal requirements change. The revised version will be posted on this page with an updated effective date.",
    ],
  },
];

export const metadata = {
  title: "Privacy Policy | SoniLearn",
  description: "Privacy Policy for the SoniLearn educational test practice platform.",
};

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 text-slate-900 sm:px-6 sm:py-14">
      <article className="mx-auto max-w-4xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <header className="border-b border-slate-100 bg-slate-900 px-6 py-8 text-white sm:px-10 sm:py-10">
          <Link href="/" className="text-xs font-bold text-blue-300 transition hover:text-white">
            SoniLearn
          </Link>
          <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">Privacy Policy</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
            This policy explains how SoniLearn handles information when you use our SSC and Railway test practice platform.
          </p>
          <p className="mt-5 text-xs font-semibold uppercase tracking-wider text-slate-400">
            Effective date: September 18, 2026
          </p>
        </header>

        <div className="space-y-8 px-6 py-8 sm:px-10 sm:py-10">
          <p className="text-sm leading-7 text-slate-600">
            SoniLearn, operated from India, respects your privacy. By using SoniLearn, you agree to the practices described in this policy. This policy applies to the SoniLearn website, progressive web app, and related learning services.
          </p>

          {sections.map((section) => (
            <section key={section.title}>
              <h2 className="text-lg font-black tracking-tight text-slate-900">{section.title}</h2>
              <div className="mt-2 space-y-3 text-sm leading-7 text-slate-600">
                {section.content.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            </section>
          ))}

          <section className="border-t border-slate-100 pt-8">
            <h2 className="text-lg font-black tracking-tight text-slate-900">11. Contact Us</h2>
            <p className="mt-2 text-sm leading-7 text-slate-600">
              For privacy questions, account-data requests, or concerns, contact us at{" "}
              <a className="font-bold text-blue-600 hover:text-blue-700" href="mailto:supportsonilearn@gmail.com">
                supportsonilearn@gmail.com
              </a>
              .
            </p>
          </section>
        </div>
      </article>
    </main>
  );
}
