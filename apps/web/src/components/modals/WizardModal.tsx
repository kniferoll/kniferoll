import { type ReactNode } from "react";
import { useDarkModeContext } from "@/context";
import { CheckCircleIcon } from "@heroicons/react/20/solid";
import { XIcon, Alert } from "@/components";

interface WizardStep {
  id: string;
  name: string;
}

interface WizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  steps: WizardStep[];
  currentStepId: string;
  children: ReactNode;
  onBack?: () => void;
  onNext?: () => void;
  onSubmit?: () => void;
  isFirstStep?: boolean;
  isLastStep?: boolean;
  isLoading?: boolean;
  submitLabel?: string;
  error?: string;
  hideNavigation?: boolean;
}

export function WizardModal({
  isOpen,
  onClose,
  steps,
  currentStepId,
  children,
  onBack,
  onNext,
  onSubmit,
  isFirstStep = false,
  isLastStep = false,
  isLoading = false,
  submitLabel = "Create",
  error,
  hideNavigation = false,
}: WizardModalProps) {
  const { isDark } = useDarkModeContext();

  if (!isOpen) return null;

  const currentStepIndex = steps.findIndex((s) => s.id === currentStepId);
  const progress = ((currentStepIndex + 1) / steps.length) * 100;

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className={`relative w-full max-w-4xl rounded-2xl border shadow-2xl overflow-hidden ${
          isDark
            ? "bg-linear-to-br from-slate-800 to-slate-900 border-slate-700"
            : "bg-linear-to-br from-white to-stone-50 border-stone-200"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className={`absolute top-4 right-4 z-10 p-2 rounded-lg transition-colors cursor-pointer ${
            isDark
              ? "text-gray-400 hover:text-white hover:bg-slate-700"
              : "text-gray-400 hover:text-gray-600 hover:bg-stone-100"
          }`}
        >
          <XIcon size={20} />
        </button>

        <div className="flex">
          {/* Step Indicator Sidebar */}
          <nav
            aria-label="Progress"
            className={`hidden md:flex flex-col justify-center p-8 border-r ${
              isDark
                ? "border-slate-700 bg-slate-800/50"
                : "border-stone-200 bg-stone-50"
            }`}
          >
            <ol role="list" className="space-y-6">
              {steps.map((step, index) => {
                const isComplete = index < currentStepIndex;
                const isCurrent = index === currentStepIndex;

                return (
                  <li key={step.id}>
                    {isComplete ? (
                      <div className="group flex items-start">
                        <span className="relative flex size-5 shrink-0 items-center justify-center">
                          <CheckCircleIcon
                            aria-hidden="true"
                            className="size-full text-orange-500"
                          />
                        </span>
                        <span
                          className={`ml-3 text-sm font-medium ${
                            isDark ? "text-gray-300" : "text-gray-700"
                          }`}
                        >
                          {step.name}
                        </span>
                      </div>
                    ) : isCurrent ? (
                      <div className="flex items-start" aria-current="step">
                        <span
                          aria-hidden="true"
                          className="relative flex size-5 shrink-0 items-center justify-center"
                        >
                          <span
                            className={`absolute size-4 rounded-full ${
                              isDark ? "bg-orange-900" : "bg-orange-200"
                            }`}
                          />
                          <span className="relative block size-2 rounded-full bg-orange-500" />
                        </span>
                        <span className="ml-3 text-sm font-medium text-orange-500">
                          {step.name}
                        </span>
                      </div>
                    ) : (
                      <div className="group flex items-start">
                        <div
                          aria-hidden="true"
                          className="relative flex size-5 shrink-0 items-center justify-center"
                        >
                          <div
                            className={`size-2 rounded-full ${
                              isDark ? "bg-gray-600" : "bg-gray-300"
                            }`}
                          />
                        </div>
                        <p
                          className={`ml-3 text-sm font-medium ${
                            isDark ? "text-gray-500" : "text-gray-400"
                          }`}
                        >
                          {step.name}
                        </p>
                      </div>
                    )}
                  </li>
                );
              })}
            </ol>
          </nav>

          {/* Main Content */}
          <div className="flex-1">
            {/* Mobile Progress Bar */}
            <div className="p-4 md:hidden">
              <div
                className={`h-2 rounded-full overflow-hidden ${
                  isDark ? "bg-slate-700" : "bg-gray-200"
                }`}
              >
                <div
                  className="h-full bg-orange-500 transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            <div className="p-8 max-h-[80vh] overflow-y-auto">
              {/* Step Content */}
              {children}
              {/* Error Alert */}
              {error && (
                <Alert variant="error" className="my-4">
                  {error}
                </Alert>
              )}
              {/* Navigation Buttons */}
              {!hideNavigation && (
                <div className="flex gap-3 mt-8">
                  {!isFirstStep && (
                    <button
                      onClick={onBack}
                      className={`px-6 py-3 border-2 rounded-xl font-semibold transition-colors cursor-pointer ${
                        isDark
                          ? "border-slate-600 text-white hover:bg-slate-800"
                          : "border-stone-300 text-gray-900 hover:bg-stone-100"
                      }`}
                    >
                      Back
                    </button>
                  )}

                  {!isLastStep ? (
                    <button
                      onClick={onNext}
                      className="flex-1 py-3 rounded-xl font-semibold transition-all cursor-pointer bg-linear-to-r from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/30 hover:shadow-xl hover:shadow-orange-500/40"
                    >
                      Continue
                    </button>
                  ) : (
                    <button
                      onClick={onSubmit}
                      disabled={isLoading}
                      className="flex-1 py-3 rounded-xl font-semibold transition-all cursor-pointer bg-linear-to-r from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/30 hover:shadow-xl hover:shadow-orange-500/40 disabled:opacity-50"
                    >
                      {isLoading ? "Creating..." : submitLabel}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
