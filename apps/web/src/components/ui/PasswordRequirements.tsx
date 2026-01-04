import { useMemo } from "react";
import { useDarkModeContext } from "@/context";
import { getPasswordRequirements } from "@/lib";

interface PasswordRequirementsProps {
  password: string;
}

export function PasswordRequirements({ password }: PasswordRequirementsProps) {
  const { isDark } = useDarkModeContext();

  const requirements = useMemo(
    () => getPasswordRequirements(password),
    [password]
  );

  const items = [
    { key: "minLength", label: "At least 8 characters", met: requirements.minLength },
    { key: "hasLowercase", label: "Lowercase letter", met: requirements.hasLowercase },
    { key: "hasUppercase", label: "Uppercase letter", met: requirements.hasUppercase },
    { key: "hasDigit", label: "Number", met: requirements.hasDigit },
  ];

  return (
    <div className="space-y-1.5">
      {items.map((item) => (
        <div
          key={item.key}
          className={`flex items-center gap-2 text-xs transition-colors ${
            item.met
              ? "text-green-500"
              : isDark
                ? "text-gray-500"
                : "text-gray-400"
          }`}
        >
          <span className="w-4 h-4 flex items-center justify-center">
            {item.met ? (
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            ) : (
              <span className="w-1.5 h-1.5 rounded-full bg-current" />
            )}
          </span>
          <span>{item.label}</span>
        </div>
      ))}
    </div>
  );
}
