import { Link } from "react-router-dom";
import { useDarkModeContext } from "@/context";
import { Button, SectionHeader } from "@/components";

// Feature comparison data
const features = [
  { name: "Kitchens", free: "1", pro: "5" },
  { name: "Stations per kitchen", free: "1", pro: "Unlimited" },
  { name: "Prep items", free: "Unlimited", pro: "Unlimited" },
  { name: "Real-time sync", free: true, pro: true },
  { name: "Team members (join via invite)", free: false, pro: true },
  { name: "Invite links", free: false, pro: true },
  { name: "Custom units", free: true, pro: true },
  { name: "Works on any device", free: true, pro: true },
];

// FAQ data
const faqs = [
  {
    question: "How does the free plan work?",
    answer:
      "The free plan lets you create one kitchen with one station. It's perfect for individual cooks or trying out Kniferoll before upgrading.",
  },
  {
    question: "Can I invite team members on the free plan?",
    answer:
      "Team invites are only available on the Pro plan. Free users can manage their own prep lists but can't share with others.",
  },
  {
    question: "How do I upgrade to Pro?",
    answer:
      "Sign up for a free account first, then upgrade from your Settings page. Pro features are available immediately after upgrading.",
  },
  {
    question: "Can I downgrade later?",
    answer:
      "Yes, you can downgrade anytime. If you have more kitchens or stations than the free plan allows, you'll need to remove the extras first.",
  },
];

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M16.667 5L7.5 14.167L3.333 10"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M15 5L5 15M5 5L15 15"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

interface PricingCardProps {
  name: string;
  price: string;
  description: string;
  features: string[];
  cta: string;
  ctaLink: string;
  highlighted?: boolean;
}

function PricingCard({
  name,
  price,
  description,
  features,
  cta,
  ctaLink,
  highlighted = false,
}: PricingCardProps) {
  const { isDark } = useDarkModeContext();

  return (
    <div
      className={`relative flex flex-col rounded-2xl p-8 ${
        highlighted
          ? "ring-2 ring-orange-500 bg-gradient-to-b from-orange-50 to-white dark:from-orange-950/20 dark:to-slate-800/50"
          : isDark
            ? "bg-slate-800/50 ring-1 ring-slate-700/50"
            : "bg-white ring-1 ring-stone-200"
      }`}
    >
      {highlighted && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-orange-500 text-white text-xs font-medium rounded-full">
          Recommended
        </div>
      )}

      <h3 className={`text-xl font-semibold ${isDark ? "text-white" : "text-gray-900"}`}>{name}</h3>

      <div className="mt-4 flex items-baseline">
        <span
          className={`text-4xl font-bold tracking-tight ${isDark ? "text-white" : "text-gray-900"}`}
        >
          {price}
        </span>
        {price !== "Free" && (
          <span className={`ml-1 ${isDark ? "text-gray-400" : "text-gray-500"}`}>/month</span>
        )}
      </div>

      <p className={`mt-4 text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}>{description}</p>

      <ul className="mt-6 space-y-3 flex-1">
        {features.map((feature) => (
          <li
            key={feature}
            className={`flex items-start gap-2 text-sm ${isDark ? "text-gray-300" : "text-gray-700"}`}
          >
            <CheckIcon className="text-orange-500 shrink-0 mt-0.5" />
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      <div className="mt-8">
        <Link to={ctaLink}>
          <Button variant={highlighted ? "primary" : "secondary"} size="lg" fullWidth>
            {cta}
          </Button>
        </Link>
      </div>
    </div>
  );
}

/**
 * Pricing page - public pricing information
 */
export function Pricing() {
  const { isDark } = useDarkModeContext();

  return (
    <div data-testid="page-pricing">
      {/* Hero */}
      <section className="max-w-4xl mx-auto px-6 md:px-10 pt-24 pb-16 text-center">
        <h1 className="text-4xl md:text-5xl font-semibold tracking-tight mb-4 leading-[1.15]">
          Simple, transparent pricing
        </h1>
        <p
          className={`text-lg md:text-xl max-w-2xl mx-auto ${isDark ? "text-gray-300" : "text-gray-700"}`}
        >
          Start free and upgrade when you need more kitchens, stations, or team features.
        </p>
      </section>

      {/* Pricing Cards */}
      <section className="max-w-4xl mx-auto px-6 md:px-10 pb-20">
        <div className="grid md:grid-cols-2 gap-8">
          <PricingCard
            name="Free"
            price="Free"
            description="Perfect for individual cooks or trying out Kniferoll."
            features={[
              "1 kitchen",
              "1 station",
              "Unlimited prep items",
              "Real-time sync",
              "Custom units",
              "Works on any device",
            ]}
            cta="Get Started"
            ctaLink="/signup"
          />
          <PricingCard
            name="Pro"
            price="$29"
            description="For professional kitchens that need team collaboration."
            features={[
              "Up to 5 kitchens",
              "Unlimited stations per kitchen",
              "Invite team members",
              "Create invite links",
              "All free features included",
            ]}
            cta="Get Started"
            ctaLink="/signup"
            highlighted
          />
        </div>
      </section>

      {/* Feature Comparison Table */}
      <section className="max-w-4xl mx-auto px-6 md:px-10 py-16">
        <SectionHeader title="Compare plans" subtitle="See exactly what you get with each plan." />

        <div className="mt-12 overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className={`border-b ${isDark ? "border-slate-700" : "border-stone-200"}`}>
                <th
                  className={`text-left py-4 pr-4 font-medium ${isDark ? "text-gray-400" : "text-gray-500"}`}
                >
                  Feature
                </th>
                <th
                  className={`text-center py-4 px-4 font-medium ${isDark ? "text-gray-400" : "text-gray-500"}`}
                >
                  Free
                </th>
                <th className="text-center py-4 pl-4 font-medium text-orange-500">Pro</th>
              </tr>
            </thead>
            <tbody>
              {features.map((feature) => (
                <tr
                  key={feature.name}
                  className={`border-b ${isDark ? "border-slate-700/50" : "border-stone-100"}`}
                >
                  <td className={`py-4 pr-4 text-sm ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                    {feature.name}
                  </td>
                  <td className="py-4 px-4 text-center">
                    {typeof feature.free === "boolean" ? (
                      feature.free ? (
                        <CheckIcon
                          className={`inline ${isDark ? "text-gray-400" : "text-gray-500"}`}
                        />
                      ) : (
                        <XIcon className={`inline ${isDark ? "text-gray-600" : "text-gray-300"}`} />
                      )
                    ) : (
                      <span className={`text-sm ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                        {feature.free}
                      </span>
                    )}
                  </td>
                  <td className="py-4 pl-4 text-center">
                    {typeof feature.pro === "boolean" ? (
                      feature.pro ? (
                        <CheckIcon className="inline text-orange-500" />
                      ) : (
                        <XIcon className={`inline ${isDark ? "text-gray-600" : "text-gray-300"}`} />
                      )
                    ) : (
                      <span className="text-sm text-orange-500 font-medium">{feature.pro}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="max-w-3xl mx-auto px-6 md:px-10 py-16">
        <SectionHeader
          title="Frequently asked questions"
          subtitle="Got questions? We've got answers."
        />

        <div className="mt-12 space-y-8">
          {faqs.map((faq) => (
            <div key={faq.question}>
              <h3 className={`font-medium ${isDark ? "text-white" : "text-gray-900"}`}>
                {faq.question}
              </h3>
              <p
                className={`mt-2 text-sm leading-relaxed ${isDark ? "text-gray-400" : "text-gray-600"}`}
              >
                {faq.answer}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-3xl mx-auto px-6 md:px-10 py-16 text-center">
        <SectionHeader
          title="Ready to get started?"
          subtitle="Create your first kitchen in minutes."
        />

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link to="/signup">
            <Button variant="primary" size="lg">
              Get Started Free
            </Button>
          </Link>
          <Link to="/help">
            <Button variant="secondary" size="lg">
              Learn More
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
