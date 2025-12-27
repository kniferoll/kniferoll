import { Button } from "./Button";

interface UpgradeModalProps {
  title: string;
  description: string;
  features: string[];
  onUpgrade: () => void;
  onCancel: () => void;
}

export function UpgradeModal({
  title,
  description,
  features,
  onUpgrade,
  onCancel,
}: UpgradeModalProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-900 rounded-lg shadow-lg max-w-md w-full">
        <div className="p-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {title}
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">{description}</p>

          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
              Pro features:
            </h3>
            <ul className="space-y-2">
              {features.map((feature, index) => (
                <li
                  key={index}
                  className="flex items-center gap-2 text-gray-700 dark:text-gray-300"
                >
                  <span className="text-blue-600">✓</span>
                  {feature}
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-3">
            <Button
              onClick={onUpgrade}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              Upgrade to Pro
            </Button>
            <Button onClick={onCancel} variant="outline" className="w-full">
              Not Now
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
