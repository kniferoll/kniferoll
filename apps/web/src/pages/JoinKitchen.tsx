import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useKitchenStore } from "../stores/kitchenStore";

type Step = "code" | "name" | "station";

export function JoinKitchen() {
  const { code: codeParam } = useParams();
  const [step, setStep] = useState<Step>("code");
  const [code, setCode] = useState(codeParam?.toUpperCase() || "");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [validating, setValidating] = useState(false);
  const { joinKitchen, claimStation, stations, loading } = useKitchenStore();
  const navigate = useNavigate();
  const codeInputRef = useRef<HTMLInputElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  // Load saved name from session storage
  useEffect(() => {
    const savedName = sessionStorage.getItem("kniferoll_username");
    if (savedName) {
      setName(savedName);
    }
  }, []);

  useEffect(() => {
    if (codeParam) {
      setCode(codeParam.toUpperCase());
      setStep("name");
      setTimeout(() => nameInputRef.current?.focus(), 100);
    } else {
      codeInputRef.current?.focus();
    }
  }, [codeParam]);

  // Auto-validate code when 6 characters are entered
  useEffect(() => {
    if (code.length === 6 && step === "code" && !validating) {
      setValidating(true);
      setError("");
      // Small delay for better UX
      setTimeout(() => {
        setStep("name");
        setValidating(false);
        setTimeout(() => nameInputRef.current?.focus(), 100);
      }, 300);
    }
  }, [code, step, validating]);

  const handleNameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Store name in session for future use
    sessionStorage.setItem("kniferoll_username", name.trim());

    const result = await joinKitchen(code, name.trim());
    if (result.error) {
      setError(result.error);
    } else {
      setStep("station");
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
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Join Kitchen
          </h1>
          <p className="text-gray-600">Get to work in seconds</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6 text-center">
            {error}
          </div>
        )}

        {step === "code" && (
          <div className="bg-white rounded-lg shadow-md p-8">
            <div>
              <label className="block text-lg font-medium text-gray-700 mb-4 text-center">
                Enter Kitchen Code
              </label>
              <input
                ref={codeInputRef}
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                className="w-full text-center text-4xl font-bold px-4 py-6 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent uppercase tracking-widest"
                maxLength={6}
                placeholder="ABC123"
                autoComplete="off"
                inputMode="text"
              />
              {validating && (
                <div className="mt-4 text-center text-blue-600 font-medium">
                  Validating...
                </div>
              )}
              <p className="mt-4 text-center text-sm text-gray-500">
                Code will validate automatically
              </p>
            </div>
          </div>
        )}

        {step === "name" && (
          <div className="bg-white rounded-lg shadow-md p-8">
            <form onSubmit={handleNameSubmit}>
              <label className="block text-lg font-medium text-gray-700 mb-4 text-center">
                What should we call you?
              </label>
              <input
                ref={nameInputRef}
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full text-center text-3xl px-4 py-6 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Your name"
                autoComplete="name"
                required
              />
              <button
                type="submit"
                disabled={loading || !name.trim()}
                className="w-full mt-6 bg-blue-600 text-white py-4 rounded-lg text-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed active:bg-blue-800"
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg
                      className="animate-spin h-5 w-5 mr-2"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Joining...
                  </span>
                ) : (
                  "Join Kitchen"
                )}
              </button>
            </form>
          </div>
        )}

        {step === "station" && (
          <div className="bg-white rounded-lg shadow-md p-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-2 text-center">
              Pick your station
            </h2>
            <p className="text-gray-600 mb-6 text-center">
              Tap to claim and start working
            </p>
            <div className="grid gap-3">
              {stations.map((station) => (
                <button
                  key={station.id}
                  onClick={() => handleStationSelect(station.id)}
                  disabled={loading}
                  className="w-full p-6 text-2xl font-semibold bg-gray-50 hover:bg-blue-50 active:bg-blue-100 border-2 border-gray-300 hover:border-blue-500 rounded-xl transition-all shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ minHeight: "64px" }}
                >
                  <span className="flex items-center justify-center gap-3">
                    <span className="text-3xl">🔪</span>
                    <span>{station.name}</span>
                  </span>
                </button>
              ))}
            </div>
            {loading && (
              <p className="mt-4 text-center text-blue-600 font-medium">
                Claiming station...
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
