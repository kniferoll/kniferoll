interface ErrorAlertProps {
  message: string;
}

export function ErrorAlert({ message }: ErrorAlertProps) {
  return (
    <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">
      {message}
    </div>
  );
}
