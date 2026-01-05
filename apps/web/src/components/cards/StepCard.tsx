import { useDarkModeContext } from "@/context";
import { Card } from "@/components/ui/Card";

interface StepCardProps {
  step: string | number;
  title: string;
  description: string;
}

/**
 * StepCard - numbered step card for "How it works" style sections.
 */
export function StepCard({ step, title, description }: StepCardProps) {
  const { isDark } = useDarkModeContext();

  return (
    <Card variant="default" padding="md" className="hover:border-slate-600">
      {/* Step number badge */}
      <div
        className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold mb-4 ${
          isDark
            ? "bg-orange-500/10 text-orange-400 border border-orange-500/20"
            : "bg-orange-100 text-orange-600"
        }`}
      >
        {step}
      </div>

      <h3 className="text-lg font-semibold mb-2">{title}</h3>

      <p className={`text-sm leading-relaxed ${isDark ? "text-gray-400" : "text-gray-600"}`}>
        {description}
      </p>
    </Card>
  );
}
