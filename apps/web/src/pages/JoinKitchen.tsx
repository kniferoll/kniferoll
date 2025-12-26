import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useKitchenStore } from "../stores/kitchenStore";
import {
  CodeInput,
  NameInput,
  StationSelector,
  ErrorAlert,
} from "../components";

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

        {error && <ErrorAlert message={error} />}

        {step === "code" && (
          <CodeInput value={code} onChange={setCode} validating={validating} />
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
      </div>
    </div>
  );
}
