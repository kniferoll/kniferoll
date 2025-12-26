import { Link } from "react-router-dom";
import { Button, FeatureCard } from "../components";

export function Landing() {
  return (
    <div className="relative min-h-screen bg-white flex flex-col items-center justify-start md:justify-center p-4 pt-12 md:pt-4 overflow-hidden">
      {/* Gradient background blobs */}
      <div className="absolute -top-44 -right-60 h-60 w-80 md:right-0 bg-linear-to-b from-[#fff1be] via-[#ee87cb] to-[#b060ff] rotate-[-10deg] rounded-full blur-3xl opacity-40 pointer-events-none" />
      <div className="absolute -bottom-32 -left-40 h-64 w-80 bg-linear-to-t from-[#b060ff] via-[#ee87cb] to-[#fff1be] rotate-10 rounded-full blur-3xl opacity-30 pointer-events-none" />

      <div className="relative max-w-2xl mx-auto text-center z-10">
        <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
          Kniferoll
        </h1>
        <p className="text-xl md:text-2xl text-gray-600 mb-12">
          Simple, fast kitchen prep management
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
          <Link to="/join">
            <Button variant="primary" fullWidth>
              Join Kitchen
            </Button>
          </Link>
          <Link to="/signup">
            <Button variant="secondary" fullWidth>
              Sign Up
            </Button>
          </Link>
          <Link to="/login">
            <Button variant="secondary" fullWidth>
              Chef Login
            </Button>
          </Link>
        </div>

        <div className="grid md:grid-cols-3 gap-8 text-left">
          <FeatureCard
            emoji="🗒️"
            title="Digital Prep Lists"
            description="Ditch the paper. Track prep in real-time."
          />
          <FeatureCard
            emoji="⚡"
            title="Lightning Fast"
            description="Join a kitchen in under 15 seconds."
          />
          <FeatureCard
            emoji="📱"
            title="Works Offline"
            description="No wifi? No problem. Syncs when you're back."
          />
        </div>
      </div>
    </div>
  );
}
