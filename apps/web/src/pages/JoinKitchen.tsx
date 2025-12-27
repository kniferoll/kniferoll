import { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { useKitchenStore } from "../stores/kitchenStore";
import { supabase } from "../lib/supabase";
import {
  CodeInput,
  NameInput,
  StationSelector,
  ErrorAlert,
  InviteCodeInput,
} from "../components";

type Step = "code" | "name" | "station" | "invite" | "method";

export function JoinKitchen() {
  const { code: codeParam } = useParams();
  const [step, setStep] = useState<Step>(codeParam ? "code" : "method");
  const [code, setCode] = useState(codeParam?.toUpperCase() || "");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [validating, setValidating] = useState(false);
  const [joinMethod, setJoinMethod] = useState<
    "kitchen-code" | "invite-code" | null
  >(null);
  const [inviteKitchenId, setInviteKitchenId] = useState<string | null>(null);
  const {
    joinKitchen,
    claimStation,
    stations,
    loading,
    currentKitchen,
    sessionUser,
    loadKitchen,
  } = useKitchenStore();
  const navigate = useNavigate();

  // Load saved name from session storage
  useEffect(() => {
    const savedName = sessionStorage.getItem("kniferoll_username");
    if (savedName) {
      setName(savedName);
    }
  }, []);

  useEffect(() => {
    if (codeParam) {
      const normalized = codeParam.toUpperCase();
      setCode(normalized);
      setJoinMethod("kitchen-code");
      // If the user has already joined this kitchen, show station selection
      if (
        currentKitchen?.join_code?.toUpperCase() === normalized &&
        !!sessionUser
      ) {
        setStep("station");
      } else {
        setStep("name");
      }
    }
  }, [codeParam, currentKitchen?.join_code, sessionUser]);

  // Auto-validate code when 6 characters are entered
  useEffect(() => {
    if (code.length === 6 && step === "code" && !validating) {
      setValidating(true);
      setError("");
      // Small delay for better UX
      setTimeout(() => {
        // Put the join code in the URL so back goes to /join/:code
        const upper = code.toUpperCase();
        if (!codeParam || codeParam.toUpperCase() !== upper) {
          navigate(`/join/${upper}`, { replace: true });
        }
        setStep("name");
        setValidating(false);
      }, 300);
    }
  }, [code, step, validating]);

  // If user already joined a kitchen and lands on /join without a code,
  // redirect them to /join/:code so back from station goes to station selection
  useEffect(() => {
    if (!codeParam && currentKitchen?.join_code && sessionUser) {
      navigate(`/join/${currentKitchen.join_code}`, { replace: true });
    }
  }, [codeParam, currentKitchen?.join_code, sessionUser, navigate]);

  const handleNameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Store name in session for future use
    sessionStorage.setItem("kniferoll_username", name.trim());

    if (joinMethod === "invite-code" && inviteKitchenId) {
      // For invite codes, we already have the kitchen_id
      // Create a session user directly
      try {
        const deviceToken =
          sessionStorage.getItem("device_token") || `device_${Date.now()}`;
        sessionStorage.setItem("device_token", deviceToken);

        const { data: sessionUser, error: sessionError } = await supabase
          .from("session_users")
          .upsert({
            kitchen_id: inviteKitchenId,
            name: name.trim(),
            device_token: deviceToken,
          })
          .select()
          .single();

        if (sessionError || !sessionUser) {
          setError(sessionError?.message || "Failed to create session");
          return;
        }

        // Load the kitchen using the store
        await loadKitchen(inviteKitchenId);

        navigate(`/join/${inviteKitchenId}/stations`, { replace: true });
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      }
    } else {
      // For regular join codes
      const upper = code.toUpperCase();
      const result = await joinKitchen(upper, name.trim());
      if (result.error) {
        setError(result.error);
      } else {
        navigate(`/join/${upper}/stations`, { replace: true });
      }
    }
  };

  const handleStationSelect = async (stationId: string) => {
    const result = await claimStation(stationId);
    if (result.error) {
      setError(result.error);
    } else {
      navigate(`/station/${stationId}`);
    }
  };

  return (
    <div className="relative min-h-screen bg-white dark:bg-slate-950 flex flex-col items-center justify-center p-4 overflow-hidden">
      {/* Gradient background blobs */}
      <div className="absolute -top-44 -right-60 h-60 w-80 md:right-0 bg-linear-to-b from-[#fff1be] via-[#ee87cb] to-[#b060ff] rotate-[-10deg] rounded-full blur-3xl opacity-40 dark:opacity-20 pointer-events-none" />
      <div className="absolute -bottom-32 -left-40 h-64 w-80 bg-linear-to-t from-[#b060ff] via-[#ee87cb] to-[#fff1be] rotate-10 rounded-full blur-3xl opacity-30 dark:opacity-10 pointer-events-none" />

      <div className="relative w-full max-w-lg z-10">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-slate-50 mb-2">
            Join Kitchen
          </h1>
          <p className="text-gray-600 dark:text-slate-400">
            Get to work in seconds
          </p>
        </div>

        {error && <ErrorAlert message={error} />}

        {step === "method" && (
          <div className="space-y-4">
            <button
              onClick={() => setStep("code")}
              className="w-full p-4 border-2 border-gray-300 dark:border-slate-700 rounded-lg hover:border-blue-500 dark:hover:border-blue-400 transition text-left"
            >
              <div className="font-semibold text-gray-900 dark:text-white">
                Join with Kitchen Code
              </div>
              <div className="text-sm text-gray-600 dark:text-slate-400">
                Use the permanent code
              </div>
            </button>

            <button
              onClick={() => setStep("invite")}
              className="w-full p-4 border-2 border-gray-300 dark:border-slate-700 rounded-lg hover:border-green-500 dark:hover:border-green-400 transition text-left"
            >
              <div className="font-semibold text-gray-900 dark:text-white">
                Join with Invite Code
              </div>
              <div className="text-sm text-gray-600 dark:text-slate-400">
                Use a temporary code from someone
              </div>
            </button>
          </div>
        )}

        {step === "code" && (
          <CodeInput value={code} onChange={setCode} validating={validating} />
        )}

        {step === "invite" && (
          <InviteCodeInput
            kitchenId={currentKitchen?.id}
            onSuccess={(foundKitchenId) => {
              if (foundKitchenId) {
                setJoinMethod("invite-code");
                setInviteKitchenId(foundKitchenId);
                setStep("name");
              }
            }}
            onCancel={() => setStep("method")}
          />
        )}

        {step === "name" && (
          <NameInput
            value={name}
            onChange={setName}
            onSubmit={handleNameSubmit}
            loading={loading}
          />
        )}

        {step === "station" && (
          <StationSelector
            stations={stations}
            onSelect={handleStationSelect}
            loading={loading}
          />
        )}

        <div className="mt-6 text-center">
          <Link
            to="/"
            className="text-sm text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-200"
          >
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
