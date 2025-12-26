interface ErrorAlertProps {
  message: string;
}

export function ErrorAlert({ message }: ErrorAlertProps) {
  return (
    <div className="bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400 p-3 rounded-md text-sm">
      {message}
    </div>
  );
}
