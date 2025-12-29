import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "../stores/authStore";
import { useDarkModeContext } from "../context/DarkModeContext";

export function Landing() {
  const { user } = useAuthStore();
  const { isDark } = useDarkModeContext();
  const navigate = useNavigate();

  const userInitials = user?.email?.substring(0, 2).toUpperCase() || "SC";

  return (
    <div
      className={`min-h-screen transition-colors ${
        isDark ? "bg-slate-900 text-white" : "bg-stone-50 text-gray-900"
      }`}
      style={{
        fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      {/* Gradient overlay */}
      <div
        className={`fixed inset-0 pointer-events-none ${
          isDark
            ? "bg-linear-to-br from-slate-900 via-slate-800 to-slate-900"
            : "bg-linear-to-br from-amber-50/80 via-orange-50/40 to-stone-100/80"
        }`}
      />

      {/* Header */}
      <header
        className={`relative z-10 flex justify-between items-center px-6 md:px-10 py-5 border-b ${
          isDark ? "border-slate-700/50" : "border-stone-200/60"
        }`}
      >
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-linear-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center shadow-lg shadow-orange-500/25">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
              <line x1="3" y1="6" x2="21" y2="6" />
            </svg>
          </div>
          <span className="text-xl font-semibold tracking-tight">
            Kniferoll
          </span>
        </div>

        {/* Nav */}
        <div className="flex items-center gap-3">
          {user ? (
            <>
              <button
                onClick={() => navigate("/dashboard")}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  isDark
                    ? "text-gray-300 hover:text-white hover:bg-slate-700"
                    : "text-gray-600 hover:text-gray-900 hover:bg-stone-200/50"
                }`}
              >
                Dashboard
              </button>
              <button
                onClick={() => navigate("/dashboard")}
                className={`w-9 h-9 rounded-full flex items-center justify-center font-semibold text-sm ${
                  isDark
                    ? "bg-linear-to-br from-gray-600 to-gray-700 text-gray-200"
                    : "bg-linear-to-br from-orange-200 to-orange-300 text-orange-900"
                }`}
              >
                {userInitials}
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => navigate("/login")}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  isDark
                    ? "text-gray-300 hover:text-white hover:bg-slate-700"
                    : "text-gray-600 hover:text-gray-900 hover:bg-stone-200/50"
                }`}
              >
                Log In
              </button>
              <button
                onClick={() => navigate("/signup")}
                className="px-4 py-2 text-sm font-semibold rounded-lg bg-linear-to-r from-orange-500 to-orange-600 text-white shadow-md shadow-orange-500/25 hover:shadow-lg hover:shadow-orange-500/30 transition-all"
              >
                Sign Up
              </button>
            </>
          )}
        </div>
      </header>

      {/* Hero */}
      <main className="relative z-1">
        <section className="max-w-3xl mx-auto px-6 md:px-10 pt-24 pb-28 text-center">
          <h1 className="text-4xl md:text-5xl font-semibold tracking-tight mb-4 leading-[1.15]">
            Kniferoll
          </h1>

          <p
            className={`text-lg md:text-xl mb-3 ${
              isDark ? "text-gray-300" : "text-gray-700"
            }`}
          >
            A prep list app built by a chef.
          </p>

          <p
            className={`text-base max-w-xl mx-auto mb-10 leading-relaxed ${
              isDark ? "text-gray-400" : "text-gray-600"
            }`}
          >
            Real-time prep tracking for your team. Everyone sees what needs to
            be done, what's in progress, and what's finished—across every
            station.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6">
            <Link to="/signup" className="w-full sm:w-auto">
              <button className="w-full px-8 py-3.5 text-base font-semibold rounded-xl bg-linear-to-r from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/30 hover:shadow-xl hover:shadow-orange-500/40 hover:-translate-y-0.5 transition-all">
                Get Started
              </button>
            </Link>
            <Link to="/join" className="w-full sm:w-auto">
              <button
                className={`w-full px-8 py-3.5 text-base font-semibold rounded-xl border-2 transition-all ${
                  isDark
                    ? "border-slate-600 text-white hover:bg-slate-800 hover:border-slate-500"
                    : "border-stone-300 text-gray-900 hover:bg-white hover:border-stone-400"
                }`}
              >
                Join a Kitchen
              </button>
            </Link>
          </div>

          <p
            className={`text-sm ${isDark ? "text-gray-500" : "text-gray-500"}`}
          >
            Have a join code?{" "}
            <button
              onClick={() => navigate("/join")}
              className="text-orange-500 hover:text-orange-600 font-medium"
            >
              Enter it here →
            </button>
          </p>
        </section>

        {/* How it works */}
        <section>
          <div className="max-w-3xl mx-auto px-6 md:px-10 py-12">
            <h2 className="text-2xl md:text-3xl font-semibold tracking-tight text-center mb-14">
              How it works
            </h2>

            <div className="grid md:grid-cols-3 gap-6">
              {[
                {
                  step: "1",
                  title: "Create your kitchen",
                  desc: "Set up your stations and prep lists in a few minutes.",
                },
                {
                  step: "2",
                  title: "Team joins with a code",
                  desc: "Your cooks scan a QR or enter a code. No app download, no account needed.",
                },
                {
                  step: "3",
                  title: "Track prep together",
                  desc: "See progress across every station in real-time. Updates sync instantly.",
                },
              ].map((item) => (
                <div
                  key={item.step}
                  className={`relative p-6 rounded-2xl border transition-all ${
                    isDark
                      ? "bg-slate-800/50 border-slate-700 hover:border-slate-600"
                      : "bg-white border-stone-200 hover:border-stone-300 hover:shadow-lg hover:shadow-stone-900/5"
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold mb-4 ${
                      isDark
                        ? "bg-orange-500/10 text-orange-400 border border-orange-500/20"
                        : "bg-orange-100 text-orange-600"
                    }`}
                  >
                    {item.step}
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                  <p
                    className={`text-sm leading-relaxed ${
                      isDark ? "text-gray-400" : "text-gray-600"
                    }`}
                  >
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features */}
        <section>
          <div className="max-w-3xl mx-auto px-6 md:px-10 py-12">
            <h2 className="text-2xl md:text-3xl font-semibold tracking-tight text-center mb-14">
              Features
            </h2>

            <div className="grid md:grid-cols-2 gap-x-12 gap-y-10">
              {[
                {
                  icon: (
                    <svg
                      width="22"
                      height="22"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </svg>
                  ),
                  title: "Real-time sync",
                  desc: "When someone checks off a task, everyone sees it instantly.",
                },
                {
                  icon: (
                    <svg
                      width="22"
                      height="22"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
                      <line x1="12" y1="18" x2="12.01" y2="18" />
                    </svg>
                  ),
                  title: "Works on any device",
                  desc: "Phone, tablet, laptop. Use whatever's handy.",
                },
                {
                  icon: (
                    <svg
                      width="22"
                      height="22"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <path d="M23 21v-2a4 4 0 00-3-3.87" />
                      <path d="M16 3.13a4 4 0 010 7.75" />
                    </svg>
                  ),
                  title: "Station assignments",
                  desc: "Assign cooks to stations so they see what's relevant to them.",
                },
                {
                  icon: (
                    <svg
                      width="22"
                      height="22"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <line x1="4" y1="9" x2="20" y2="9" />
                      <line x1="4" y1="15" x2="20" y2="15" />
                      <line x1="10" y1="3" x2="8" y2="21" />
                      <line x1="16" y1="3" x2="14" y2="21" />
                    </svg>
                  ),
                  title: "Custom units",
                  desc: "2 red cambros of chicken stock. 1 deli of caramelized onions. Use the units you know.",
                },
                {
                  icon: (
                    <svg
                      width="22"
                      height="22"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    </svg>
                  ),
                  title: "No account needed to join",
                  desc: "Your team enters a code and they're in. No email, no password.",
                },
                {
                  icon: (
                    <svg
                      width="22"
                      height="22"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                      <line x1="3" y1="9" x2="21" y2="9" />
                      <line x1="9" y1="21" x2="9" y2="9" />
                    </svg>
                  ),
                  title: "Shift management",
                  desc: "Set up AM/PM or custom shifts. Prep lists adjust automatically.",
                },
              ].map((feature, i) => (
                <div key={i} className="flex gap-4">
                  <div
                    className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${
                      isDark
                        ? "bg-slate-800 text-orange-400 border border-slate-700"
                        : "bg-orange-50 text-orange-500 border border-orange-100"
                    }`}
                  >
                    {feature.icon}
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">{feature.title}</h3>
                    <p
                      className={`text-sm leading-relaxed ${
                        isDark ? "text-gray-400" : "text-gray-600"
                      }`}
                    >
                      {feature.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section>
          <div className="max-w-3xl mx-auto px-6 md:px-10 py-12 text-center">
            <h2 className="text-2xl md:text-3xl font-semibold tracking-tight mb-4">
              Ready to try it?
            </h2>
            <p className={`mb-8 ${isDark ? "text-gray-400" : "text-gray-600"}`}>
              Free to get started. Set up your first kitchen in minutes.
            </p>
            <Link to="/signup">
              <button className="px-8 py-3.5 text-base font-semibold rounded-xl bg-linear-to-r from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/30 hover:shadow-xl hover:shadow-orange-500/40 hover:-translate-y-0.5 transition-all">
                Get Started
              </button>
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer
        className={`relative z-10 border-t ${
          isDark ? "border-slate-700/50" : "border-stone-200/60"
        } mt-8`}
      >
        <div className="max-w-3xl mx-auto px-6 md:px-10 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-linear-to-br from-orange-500 to-orange-600 rounded-md flex items-center justify-center">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
                <line x1="3" y1="6" x2="21" y2="6" />
              </svg>
            </div>
            <span className="text-sm font-medium">Kniferoll</span>
          </div>
          <div
            className={`flex items-center gap-6 text-sm ${
              isDark ? "text-gray-400" : "text-gray-500"
            }`}
          >
            <a href="#" className="hover:text-orange-500 transition-colors">
              Support
            </a>
            <a href="#" className="hover:text-orange-500 transition-colors">
              Privacy
            </a>
            <a href="#" className="hover:text-orange-500 transition-colors">
              Terms
            </a>
          </div>
        </div>
      </footer>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');
      `}</style>
    </div>
  );
}
