import { useDarkModeContext } from "@/context";

/**
 * Privacy Policy page
 *
 * Uses the default header from PublicLayout.
 * Just renders the content - no Page wrapper needed.
 */
export function PrivacyPolicy() {
  const { isDark } = useDarkModeContext();

  return (
    <div className="max-w-3xl mx-auto px-6 md:px-10 py-16">
      <h1 className="text-4xl md:text-5xl font-semibold tracking-tight mb-2 cursor-default">
        Privacy Policy
      </h1>
      <p className={`text-sm cursor-default ${isDark ? "text-gray-400" : "text-gray-600"}`}>
        Last updated: December 2025
      </p>

      <div
        className={`mt-12 space-y-8 cursor-default ${isDark ? "text-gray-300" : "text-gray-700"}`}
      >
        <section>
          <h2 className="text-2xl font-semibold mb-4 cursor-default">What We Collect</h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2 cursor-default">Account information:</h3>
              <p>
                When you sign up, we collect your email address and password (stored securely
                hashed, never in plain text).
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2 cursor-default">Kitchen and prep data:</h3>
              <p>
                Everything you create in the app—kitchens, stations, prep lists, tasks, team
                assignments. This is your data.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2 cursor-default">Usage data:</h3>
              <p>
                Basic analytics like when you log in and what features you use. This helps us
                improve the product.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2 cursor-default">Anonymous users:</h3>
              <p>
                Team members who join a kitchen with a code don't need accounts. We don't collect
                personal information from them beyond a display name they choose.
              </p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4 cursor-default">How We Use Your Data</h2>
          <ul className="list-disc list-inside space-y-2">
            <li>To provide and maintain the service</li>
            <li>To let your team collaborate on prep lists</li>
            <li>To improve the product based on how it's used</li>
            <li>To communicate with you about your account or important updates</li>
          </ul>
          <p className="mt-4">
            We do not sell your data to third parties. We do not use your data for advertising.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4 cursor-default">Where Your Data Lives</h2>
          <p>
            Your data is stored securely on servers provided by Supabase (hosted on AWS). Data is
            encrypted in transit and at rest.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4 cursor-default">Data Retention</h2>
          <p>
            We keep your data as long as your account is active. If you delete your account, we
            delete your data within 30 days.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4 cursor-default">Your Rights</h2>
          <p className="mb-4">You can:</p>
          <ul className="list-disc list-inside space-y-2">
            <li>Access your data (it's all visible in the app)</li>
            <li>Export your data (contact us)</li>
            <li>Delete your account and all associated data</li>
            <li>Ask us questions about any of this</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4 cursor-default">Cookies</h2>
          <p>
            We use essential cookies to keep you logged in. We don't use tracking cookies or
            third-party advertising cookies.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4 cursor-default">Changes</h2>
          <p>
            If we make significant changes to this policy, we'll notify you via email or in the app.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4 cursor-default">Contact</h2>
          <p>
            Questions? Email us at{" "}
            <a
              href="mailto:support@kniferoll.io"
              className="text-orange-500 hover:text-orange-600 font-medium cursor-pointer"
            >
              support@kniferoll.io
            </a>
          </p>
        </section>
      </div>
    </div>
  );
}
