import { useState } from "react";
import { useDarkModeContext } from "@/context";
import { useAuthStore, useKitchenStore } from "@/stores";
import { supabase, captureError } from "@/lib";
import { Modal, Button, FormInput } from "@/components/ui";
import { XIcon, CheckIcon } from "@/components/icons";

type SupportCategory = "Bug" | "Feature Request" | "Billing" | "General";

interface SupportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SupportModal({ isOpen, onClose }: SupportModalProps) {
  const { isDark } = useDarkModeContext();
  const user = useAuthStore((state) => state.user);
  const currentKitchen = useKitchenStore((state) => state.currentKitchen);

  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState<SupportCategory>("General");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const categories: { value: SupportCategory; label: string }[] = [
    { value: "Bug", label: "Bug Report" },
    { value: "Feature Request", label: "Feature Request" },
    { value: "Billing", label: "Billing" },
    { value: "General", label: "General Question" },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!subject.trim() || !message.trim()) {
      setError("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const { error: funcError } = await supabase.functions.invoke(
        "create-support-ticket",
        {
          body: {
            subject: subject.trim(),
            category,
            message: message.trim(),
            metadata: {
              userName:
                user?.user_metadata?.name ||
                user?.user_metadata?.display_name ||
                user?.email?.split("@")[0],
              userEmail: user?.email,
              kitchenName: currentKitchen?.name,
              appVersion: "1.0.0",
            },
          },
        }
      );

      if (funcError) {
        throw new Error(funcError.message || "Failed to submit support request");
      }

      setIsSuccess(true);
    } catch (err) {
      captureError(err as Error, { context: "SupportModal.submit" });
      setError(
        err instanceof Error ? err.message : "Failed to submit support request"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setSubject("");
    setCategory("General");
    setMessage("");
    setError(null);
    setIsSuccess(false);
    onClose();
  };

  if (isSuccess) {
    return (
      <Modal isOpen={isOpen} onClose={handleClose} size="md">
        <div className="text-center">
          <div
            className={`w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center ${
              isDark ? "bg-green-500/20" : "bg-green-100"
            }`}
          >
            <CheckIcon
              className={`w-8 h-8 ${
                isDark ? "text-green-400" : "text-green-600"
              }`}
            />
          </div>
          <h2
            className={`text-2xl font-bold mb-2 ${
              isDark ? "text-white" : "text-gray-900"
            }`}
          >
            Request Submitted
          </h2>
          <p className={`mb-6 ${isDark ? "text-gray-400" : "text-gray-600"}`}>
            We&apos;ll get back to you at{" "}
            <span className="font-medium">{user?.email}</span>
          </p>
          <Button onClick={handleClose} fullWidth>
            Done
          </Button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="md">
      <div className="flex items-center justify-between mb-6">
        <h2
          className={`text-2xl font-bold ${
            isDark ? "text-white" : "text-gray-900"
          }`}
        >
          Contact Support
        </h2>
        <button
          onClick={handleClose}
          className={`p-2 rounded-lg transition-colors cursor-pointer ${
            isDark
              ? "hover:bg-slate-700 text-gray-400"
              : "hover:bg-stone-100 text-gray-500"
          }`}
        >
          <XIcon className="w-5 h-5" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <FormInput
          label="Subject"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Brief description of your issue"
          required
        />

        <div>
          <label
            className={`block text-sm font-medium mb-2 ${
              isDark ? "text-gray-300" : "text-gray-700"
            }`}
          >
            Category
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as SupportCategory)}
            className={`w-full px-4 py-3 rounded-xl border transition-all ${
              isDark
                ? "bg-slate-700/50 border-slate-600 text-white focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                : "bg-white border-stone-300 text-gray-900 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
            }`}
          >
            {categories.map((cat) => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            className={`block text-sm font-medium mb-2 ${
              isDark ? "text-gray-300" : "text-gray-700"
            }`}
          >
            Message
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Describe your issue or question in detail..."
            rows={5}
            required
            className={`w-full px-4 py-3 rounded-xl border transition-all resize-none ${
              isDark
                ? "bg-slate-700/50 border-slate-600 text-white placeholder-gray-500 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                : "bg-white border-stone-300 text-gray-900 placeholder-gray-400 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
            }`}
          />
        </div>

        {user?.email && (
          <p className={`text-sm ${isDark ? "text-gray-400" : "text-gray-500"}`}>
            We&apos;ll respond to{" "}
            <span className="font-medium">{user.email}</span>
          </p>
        )}

        {error && (
          <p className="text-sm text-red-500 bg-red-500/10 px-3 py-2 rounded-lg">
            {error}
          </p>
        )}

        <div className="flex gap-3 pt-2">
          <Button
            type="button"
            variant="secondary"
            onClick={handleClose}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting} className="flex-1">
            {isSubmitting ? "Submitting..." : "Submit"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
