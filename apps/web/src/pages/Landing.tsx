import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useDarkModeContext } from "@/context";
import {
  Button,
  FeatureCard,
  SectionHeader,
  StepCard,
  ClockIcon,
  DeviceIcon,
  TeamIcon,
  UnitsIcon,
  ShieldIcon,
  CalendarIcon,
} from "@/components";
import { preloadLogin, preloadSignup } from "@/lib/preload";
// Data
const steps = [
  {
    step: "1",
    title: "Create your kitchen",
    description: "Set up your stations and prep lists in a few minutes.",
  },
  {
    step: "2",
    title: "Team joins with a code",
    description:
      "Your cooks scan a QR or enter a code. No app download, no account needed.",
  },
  {
    step: "3",
    title: "Track prep together",
    description:
      "See progress across every station in real-time. Updates sync instantly.",
  },
];

const features = [
  {
    icon: <ClockIcon />,
    title: "Real-time sync",
    description: "When someone checks off a task, everyone sees it instantly.",
  },
  {
    icon: <DeviceIcon />,
    title: "Works on any device",
    description: "Phone, tablet, laptop. Use whatever's handy.",
  },
  {
    icon: <TeamIcon />,
    title: "Station assignments",
    description:
      "Assign cooks to stations so they see what's relevant to them.",
  },
  {
    icon: <UnitsIcon />,
    title: "Custom units",
    description:
      "2 red cambros of chicken stock. 1 deli of caramelized onions. Use the units you know.",
  },
  {
    icon: <ShieldIcon />,
    title: "No account needed to join",
    description:
      "Your team enters a code and they're in. No email, no password.",
  },
  {
    icon: <CalendarIcon />,
    title: "Shift management",
    description:
      "Set up AM/PM or custom shifts. Prep lists adjust automatically.",
  },
];

/**
 * Landing page - marketing homepage
 */
export function Landing() {
  const { isDark } = useDarkModeContext();
  useEffect(() => {
    preloadLogin();
    preloadSignup();
  }, []);
  return (
    <>
      {/* Hero */}
      <section className="max-w-3xl mx-auto px-6 md:px-10 pt-24 pb-28 text-center">
        <h1 className="text-4xl md:text-5xl font-semibold tracking-tight mb-4 leading-[1.15]">
          Kniferoll
        </h1>

        <p
          className={`text-lg md:text-xl mb-3 ${
            isDark ? "text-gray-300" : "text-gray-700"
          }`}
        >
          A prep list app built by a chef.
        </p>

        <p
          className={`text-base max-w-xl mx-auto mb-10 leading-relaxed ${
            isDark ? "text-gray-400" : "text-gray-600"
          }`}
        >
          Real-time prep tracking for your team. Everyone sees what needs to be
          done, what's in progress, and what's finished—across every station.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6">
          <Link to="/signup" className="w-full sm:w-auto">
            <Button variant="primary" size="lg" fullWidth>
              Get Started
            </Button>
          </Link>
          <Link to="/join" className="w-full sm:w-auto">
            <Button variant="secondary" size="lg" fullWidth>
              Join a Kitchen
            </Button>
          </Link>
        </div>

        <p className={`text-sm ${isDark ? "text-gray-500" : "text-gray-500"}`}>
          Have a join code?{" "}
          <Link
            to="/join"
            className="text-orange-500 hover:text-orange-600 font-medium"
          >
            Enter it here →
          </Link>
        </p>
      </section>

      {/* How it works */}
      <section>
        <div className="max-w-3xl mx-auto px-6 md:px-10 py-12">
          <SectionHeader title="How it works" />

          <div className="grid md:grid-cols-3 gap-6 mt-14">
            {steps.map((step) => (
              <StepCard key={step.step} {...step} />
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section>
        <div className="max-w-3xl mx-auto px-6 md:px-10 py-12">
          <SectionHeader title="Features" />

          <div className="grid md:grid-cols-2 gap-x-12 gap-y-10 mt-14">
            {features.map((feature, i) => (
              <FeatureCard key={i} {...feature} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section>
        <div className="max-w-3xl mx-auto px-6 md:px-10 py-12 text-center">
          <SectionHeader
            title="Ready to try it?"
            subtitle="Free to get started. Set up your first kitchen in minutes."
          />

          <div className="mt-8">
            <Link to="/signup">
              <Button variant="primary" size="lg">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
