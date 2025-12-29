import { useDarkModeContext } from "@/context";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { IconBox } from "../ui/IconBox";

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description: string;
  features?: string[];
  onUpgrade: () => void;
}

/**
 * UpgradeModal - modal for prompting users to upgrade to Pro.
 */
export function UpgradeModal({
  isOpen,
  onClose,
  title,
  description,
  features = [],
  onUpgrade,
}: UpgradeModalProps) {
  const { isDark } = useDarkModeContext();

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      {/* Star Icon */}
      <IconBox
        size="lg"
        className="mb-6 bg-linear-to-br from-orange-500 to-orange-600 border-0 shadow-lg shadow-orange-500/30"
      >
        <svg
          width="28"
          height="28"
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

      <h2
        className={`text-2xl font-semibold mb-3 cursor-default ${
          isDark ? "text-white" : "text-gray-900"
        }`}
      >
        {title}
      </h2>

      <p
        className={`text-base leading-relaxed mb-6 cursor-default ${
          isDark ? "text-gray-400" : "text-gray-600"
        }`}
      >
        {description}
      </p>

      {features.length > 0 && (
        <ul
          className={`mb-8 space-y-2 ${
            isDark ? "text-gray-300" : "text-gray-700"
          }`}
        >
          {features.map((feature, i) => (
            <li
              key={i}
              className="flex items-center gap-2 text-sm cursor-default"
            >
              <span className="text-orange-500">✓</span>
              {feature}
            </li>
          ))}
        </ul>
      )}

      <div className="flex gap-3">
        <Button variant="secondary" onClick={onClose} className="flex-1">
          Maybe Later
        </Button>
        <Button variant="primary" onClick={onUpgrade} className="flex-1">
          Upgrade to Pro
        </Button>
      </div>
    </Modal>
  );
}
