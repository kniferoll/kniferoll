import { useDarkModeContext } from "@/context";
import { Button } from "../ui/Button";
import { IconBox } from "../ui/IconBox";

interface StepUpgradeProps {
  feature: "stations" | "kitchens";
  onUpgrade: () => Promise<void>;
  onSkip: () => void;
  isLoading?: boolean;
}

export function StepUpgrade({
  feature,
  onUpgrade,
  onSkip,
  isLoading,
}: StepUpgradeProps) {
  const { isDark } = useDarkModeContext();

  const content = {
    stations: {
      title: "Unlock Unlimited Stations",
      description:
        "Your free plan includes 1 station per kitchen. Upgrade to Pro to add as many stations as your kitchen needs.",
      benefits: [
        "Unlimited stations per kitchen",
        "Unlimited team members",
        "Priority support",
      ],
    },
    kitchens: {
      title: "Manage Multiple Kitchens",
      description:
        "Your free plan includes 1 kitchen. Upgrade to Pro to manage all your locations from one account.",
      benefits: [
        "Unlimited kitchens",
        "Unlimited stations per kitchen",
        "Unlimited team members",
      ],
    },
  }[feature];

  return (
    <div className="text-center">
      {/* Icon */}
      <div className="flex justify-center mb-6">
        <IconBox
          size="xl"
          className="bg-linear-to-br from-orange-500 to-orange-600 border-0 shadow-lg shadow-orange-500/30"
        >
          <svg
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
          </svg>
        </IconBox>
      </div>

      <h2
        className={`text-2xl font-bold mb-3 cursor-default ${
          isDark ? "text-white" : "text-gray-900"
        }`}
      >
        {content.title}
      </h2>

      <p
        className={`mb-8 max-w-md mx-auto cursor-default ${
          isDark ? "text-gray-400" : "text-gray-600"
        }`}
      >
        {content.description}
      </p>

      {/* Benefits */}
      <ul className="mb-8 space-y-3 max-w-xs mx-auto">
        {content.benefits.map((benefit) => (
          <li
            key={benefit}
            className={`flex items-center gap-3 text-left ${
              isDark ? "text-gray-300" : "text-gray-700"
            }`}
          >
            <span className="text-orange-500 font-bold">✓</span>
            {benefit}
          </li>
        ))}
      </ul>

      {/* Actions */}
      <div className="space-y-3">
        <Button
          variant="primary"
          size="lg"
          fullWidth
          onClick={onUpgrade}
          disabled={isLoading}
        >
          {isLoading ? "Loading..." : "Upgrade to Pro"}
        </Button>
        <button
          onClick={onSkip}
          className={`text-sm font-medium cursor-pointer ${
            isDark
              ? "text-gray-400 hover:text-gray-300"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Continue with free plan
        </button>
      </div>
    </div>
  );
}
