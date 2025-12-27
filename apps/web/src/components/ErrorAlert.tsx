interface ErrorAlertProps {
  title?: string;
  message: string;
}

export function ErrorAlert({ title, message }: ErrorAlertProps) {
  return (
    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-red-700 dark:text-red-300 p-4 mb-4">
      {title && <p className="font-semibold mb-1">{title}</p>}
      <p className="text-sm">{message}</p>
    </div>
  );
}
