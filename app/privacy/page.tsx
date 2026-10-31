export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[#09090f] text-gray-200 px-6 py-16">
      <div className="max-w-3xl mx-auto">
        <a href="/" className="text-purple-400 font-bold text-xl">
          TraceMind
        </a>

        <h1 className="text-4xl font-bold mt-12 mb-4">
          Privacy Policy
        </h1>

        <p className="text-gray-400 mb-10">
          Last updated: October 31, 2026
        </p>

        <div className="space-y-8 leading-7 text-gray-300">
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">
              1. Introduction
            </h2>
            <p>
              TraceMind is a personal memory management platform that helps
              users capture, organize, search and manage their digital
              information. This policy explains how we collect, use and
              protect your information.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">
              2. Information We Collect
            </h2>
            <p>We may collect the following information:</p>
            <ul className="list-disc pl-6 mt-3 space-y-2">
              <li>Email address and account information.</li>
              <li>Google authentication information.</li>
              <li>Saved text, links, screenshots and documents.</li>
              <li>Uploaded voice recordings and related transcripts.</li>
              <li>Profile information and uploaded profile pictures.</li>
              <li>Reminders, deadlines and notification preferences.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">
              3. How We Use Your Information
            </h2>
            <p>
              We use your information to provide account authentication,
              save and organize memories, perform AI-powered analysis,
              manage reminders, send requested notifications and improve
              the application's functionality.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">
              4. Third-Party Services
            </h2>
            <p>
              TraceMind uses third-party services, which may include
              Supabase for authentication, database and storage,
              Google for authentication, and Resend for email delivery.
              These providers process information as necessary to
              provide their services under their respective policies.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">
              5. Data Security
            </h2>
            <p>
              We use appropriate technical and organizational measures
              intended to protect user information against unauthorized
              access, alteration or disclosure. However, no online
              service can guarantee absolute security.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">
              6. Data Retention and Deletion
            </h2>
            <p>
              Your information is retained as necessary to provide
              TraceMind. You may request account and associated data
              deletion through the available account deletion
              functionality or by contacting our support team.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">
              7. Your Privacy Rights
            </h2>
            <p>
              Depending on applicable law, you may have rights to access,
              correct, export or request deletion of your personal
              information.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">
              8. Contact Us
            </h2>
            <p>
              For privacy-related questions, contact the TraceMind
              support team through our application.
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