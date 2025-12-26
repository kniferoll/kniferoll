import { Link } from "react-router-dom";
import { Button, FeatureCard } from "../components";

export function Landing() {
  return (
    <div className="min-h-screen bg-linear-to-b from-gray-50 to-gray-100 flex flex-col items-center justify-center p-4">
      <div className="max-w-2xl mx-auto text-center">
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
