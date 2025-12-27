import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../stores/authStore";

export function Landing() {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  useEffect(() => {
    if (user) {
      navigate("/dashboard");
    }
  }, [user, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-slate-900 dark:to-slate-950">
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-4">
            Kniferoll
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            Kitchen prep management for professional chefs
          </p>
        </div>

        <div className="flex flex-col gap-4 max-w-sm mx-auto mb-16">
          <button
            onClick={() => navigate("/signup")}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            Sign Up
          </button>
          <button
            onClick={() => navigate("/login")}
            className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-lg font-semibold hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
          >
            Sign In
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="text-4xl mb-4">📋</div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Manage Prep Lists
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Real-time collaboration on station prep across your kitchen
            </p>
          </div>

          <div className="text-center">
            <div className="text-4xl mb-4">👥</div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Invite Your Team
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Share secure invite links with your kitchen staff
            </p>
          </div>

          <div className="text-center">
            <div className="text-4xl mb-4">⚡</div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Real-time Sync
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              See updates instantly as your team works
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
