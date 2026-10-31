export default function TermsPage() {
  return (
    <main className="min-h-screen bg-[#09090f] text-gray-200 px-6 py-16">
      <div className="max-w-3xl mx-auto">
        <a href="/" className="text-purple-400 font-bold text-xl">
          TraceMind
        </a>

        <h1 className="text-4xl font-bold mt-12 mb-4">
          Terms of Service
        </h1>

        <p className="text-gray-400 mb-10">
          Last updated: October 31, 2026
        </p>

        <div className="space-y-8 leading-7 text-gray-300">
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">
              1. Acceptance of Terms
            </h2>
            <p>
              By accessing or using TraceMind, you agree to these
              Terms of Service. If you do not agree, please do not
              use the application.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">
              2. About TraceMind
            </h2>
            <p>
              TraceMind is a personal information and memory
              management platform that allows users to capture,
              organize, search and manage digital information.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">
              3. User Accounts
            </h2>
            <p>
              You are responsible for maintaining the security
              of your account and ensuring that the information
              you provide is accurate. You must not misuse
              authentication or access another user's account.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">
              4. Acceptable Use
            </h2>
            <p>You agree not to:</p>
            <ul className="list-disc pl-6 mt-3 space-y-2">
              <li>Use TraceMind for unlawful activities.</li>
              <li>Attempt unauthorized access to the platform.</li>
              <li>Upload malicious files or harmful content.</li>
              <li>Disrupt or interfere with application services.</li>
              <li>Violate the rights of other individuals.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">
              5. User Content
            </h2>
            <p>
              You retain your rights to the content you upload
              to TraceMind. You are responsible for ensuring
              that you have permission to store and process
              that content using the application.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">
              6. AI Features
            </h2>
            <p>
              TraceMind may use AI services to analyze, summarize
              and organize submitted information. AI-generated
              results may contain inaccuracies and should be
              independently verified when accuracy is important.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">
              7. Service Availability
            </h2>
            <p>
              We aim to maintain reliable service but cannot
              guarantee uninterrupted availability. Features
              may be updated, modified or temporarily unavailable.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">
              8. Account Termination
            </h2>
            <p>
              You may request deletion of your account.
              We may restrict or terminate access when these
              terms are violated or when required by law.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">
              9. Changes to These Terms
            </h2>
            <p>
              We may update these terms as TraceMind evolves.
              Updated terms will be published on this page.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">
              10. Contact
            </h2>
            <p>
              For questions regarding these terms, contact
              the TraceMind support team through the application.
            </p>
          </section>
        </div>

        <div className="border-t border-gray-800 mt-16 pt-6 text-sm text-gray-500">
          © 2026 TraceMind. All rights reserved.
        </div>
      </div>
    </main>
  );
}