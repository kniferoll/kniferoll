import { useDarkModeContext } from "@/context/DarkModeContext";

/**
 * Terms of Service page
 */
export function TermsOfService() {
  const { isDark } = useDarkModeContext();

  return (
    <div className="max-w-3xl mx-auto px-6 md:px-10 py-16">
      <h1 className="text-4xl md:text-5xl font-semibold tracking-tight mb-2 cursor-default">
        Terms of Service
      </h1>
      <p
        className={`text-sm cursor-default ${
          isDark ? "text-gray-400" : "text-gray-600"
        }`}
      >
        Last updated: December 2025
      </p>

      <div
        className={`mt-12 space-y-8 cursor-default ${
          isDark ? "text-gray-300" : "text-gray-700"
        }`}
      >
        <section>
          <h2 className="text-2xl font-semibold mb-4 cursor-default">
            The Service
          </h2>
          <p>
            Kniferoll is a prep list management tool for kitchens. We provide
            the software; you provide the content (your kitchens, prep lists,
            etc.).
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4 cursor-default">
            Your Account
          </h2>
          <ul className="list-disc list-inside space-y-2">
            <li>
              You're responsible for keeping your login credentials secure
            </li>
            <li>
              You're responsible for activity that happens under your account
            </li>
            <li>You must provide accurate information when signing up</li>
            <li>You must be at least 16 years old to create an account</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4 cursor-default">
            Your Content
          </h2>
          <p>
            You own the content you create (kitchens, prep lists, tasks, etc.).
            By using the service, you give us permission to store and display
            that content to you and your team members—that's how the app works.
          </p>
          <p className="mt-4">
            We don't claim ownership of your content. We won't use it for
            anything other than providing the service.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4 cursor-default">
            Acceptable Use
          </h2>
          <p className="mb-4">Don't use Kniferoll to:</p>
          <ul className="list-disc list-inside space-y-2">
            <li>Break any laws</li>
            <li>Harass or harm others</li>
            <li>Attempt to access other users' data without permission</li>
            <li>Interfere with or disrupt the service</li>
            <li>Reverse engineer or attempt to extract source code</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4 cursor-default">
            Payment and Subscriptions
          </h2>
          <p className="mb-4">
            Some features require a paid subscription. If you subscribe:
          </p>
          <ul className="list-disc list-inside space-y-2">
            <li>You'll be billed according to your chosen plan</li>
            <li>
              You can cancel anytime; access continues until the end of your
              billing period
            </li>
            <li>
              Refunds are handled on a case-by-case basis—contact us if you have
              an issue
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4 cursor-default">
            Service Availability
          </h2>
          <p>
            We do our best to keep Kniferoll running smoothly, but we can't
            guarantee 100% uptime. We may need to perform maintenance or updates
            that temporarily affect availability.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4 cursor-default">
            Changes to the Service
          </h2>
          <p>
            We may add, change, or remove features over time. If we make changes
            that significantly affect your use of the service, we'll give you
            reasonable notice.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4 cursor-default">
            Termination
          </h2>
          <p>
            You can delete your account at any time. We may suspend or terminate
            accounts that violate these terms.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4 cursor-default">
            Limitation of Liability
          </h2>
          <p>
            Kniferoll is provided "as is." We're not liable for any damages
            arising from your use of the service, including lost data, lost
            revenue, or any other losses. Use good judgment and keep your own
            backups of critical information.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4 cursor-default">
            Disputes
          </h2>
          <p>
            If we have a dispute, let's try to work it out. Email us at{" "}
            <a
              href="mailto:support@kniferoll.io"
              className="text-orange-500 hover:text-orange-600 font-medium cursor-pointer"
            >
              support@kniferoll.io
            </a>{" "}
            and we'll do our best to resolve it.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4 cursor-default">
            Changes to These Terms
          </h2>
          <p>
            We may update these terms. If we make significant changes, we'll
            notify you via email or in the app. Continued use after changes
            means you accept the new terms.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4 cursor-default">
            Contact
          </h2>
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
