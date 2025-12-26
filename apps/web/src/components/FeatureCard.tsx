interface FeatureCardProps {
  emoji: string;
  title: string;
  description: string;
}

export function FeatureCard({ emoji, title, description }: FeatureCardProps) {
  return (
    <div className="bg-white dark:bg-slate-900 dark:border dark:border-slate-800 p-6 rounded-lg shadow-sm dark:shadow-lg">
      <div className="text-3xl mb-3">{emoji}</div>
      <h3 className="font-semibold text-lg mb-2 text-gray-900 dark:text-slate-50">
        {title}
      </h3>
      <p className="text-gray-600 dark:text-slate-400">{description}</p>
    </div>
  );
}
