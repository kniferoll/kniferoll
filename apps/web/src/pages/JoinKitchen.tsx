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
  const { joinKitchen, claimStation, stations, loading } = useKitchenStore();
  const navigate = useNavigate();
  const codeInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (codeParam) {
      setCode(codeParam.toUpperCase());
      setStep("name");
    } else {
      codeInputRef.current?.focus();
    }
  }, [codeParam]);

  const handleCodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length === 6) {
      setStep("name");
    }
  };

  const handleNameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const result = await joinKitchen(code, name);
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
            <form onSubmit={handleCodeSubmit}>
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
                required
              />
              <button
                type="submit"
                disabled={code.length !== 6}
                className="w-full mt-6 bg-blue-600 text-white py-4 rounded-lg text-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </form>
          </div>
        )}

        {step === "name" && (
          <div className="bg-white rounded-lg shadow-md p-8">
            <form onSubmit={handleNameSubmit}>
              <label className="block text-lg font-medium text-gray-700 mb-4 text-center">
                What's your name?
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full text-center text-2xl px-4 py-4 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Your name"
                autoFocus
                required
              />
              <button
                type="submit"
                disabled={loading || !name.trim()}
                className="w-full mt-6 bg-blue-600 text-white py-4 rounded-lg text-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {loading ? "Joining..." : "Next"}
              </button>
            </form>
          </div>
        )}

        {step === "station" && (
          <div className="bg-white rounded-lg shadow-md p-8">
            <h2 className="text-lg font-medium text-gray-700 mb-6 text-center">
              Pick your station
            </h2>
            <div className="grid gap-4">
              {stations.map((station) => (
                <button
                  key={station.id}
                  onClick={() => handleStationSelect(station.id)}
                  className="w-full p-6 text-xl font-semibold bg-gray-50 hover:bg-blue-50 border-2 border-gray-200 hover:border-blue-500 rounded-lg transition-colors"
                  style={{ minHeight: "72px" }}
                >
                  {station.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
