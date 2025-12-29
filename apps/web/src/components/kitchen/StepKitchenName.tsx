import { useDarkModeContext } from "@/context";
import { FormInput } from "@/components";

interface StepKitchenNameProps {
  value: string;
  onChange: (value: string) => void;
  onEnter: () => void;
}

export function StepKitchenName({
  value,
  onChange,
  onEnter,
}: StepKitchenNameProps) {
  const { isDark } = useDarkModeContext();

  return (
    <div>
      <h2
        className={`text-2xl font-bold mb-2 cursor-default ${
          isDark ? "text-white" : "text-gray-900"
        }`}
      >
        Name your kitchen
      </h2>
      <p
        className={`mb-6 cursor-default ${
          isDark ? "text-gray-400" : "text-gray-600"
        }`}
      >
        What should we call this kitchen?
      </p>
      <FormInput
        label=""
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && onEnter()}
        placeholder="e.g., Blue Duck Tavern"
        autoFocus
      />
    </div>
  );
}
