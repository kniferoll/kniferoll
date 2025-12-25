import { Link } from "react-router-dom";

export function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex flex-col items-center justify-center p-4">
      <div className="max-w-2xl mx-auto text-center">
        <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
          Kniferoll
        </h1>
        <p className="text-xl md:text-2xl text-gray-600 mb-12">
          Simple, fast kitchen prep management
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
          <Link
            to="/join"
            className="px-8 py-4 bg-blue-600 text-white text-lg font-semibold rounded-lg hover:bg-blue-700 transition-colors"
          >
            Join Kitchen
          </Link>
          <Link
            to="/login"
            className="px-8 py-4 bg-white text-blue-600 text-lg font-semibold rounded-lg border-2 border-blue-600 hover:bg-blue-50 transition-colors"
          >
            Chef Login
          </Link>
        </div>

        <div className="grid md:grid-cols-3 gap-8 text-left">
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="text-3xl mb-3">🗒️</div>
            <h3 className="font-semibold text-lg mb-2">Digital Prep Lists</h3>
            <p className="text-gray-600">
              Ditch the paper. Track prep in real-time.
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="text-3xl mb-3">⚡</div>
            <h3 className="font-semibold text-lg mb-2">Lightning Fast</h3>
            <p className="text-gray-600">Join a kitchen in under 15 seconds.</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="text-3xl mb-3">📱</div>
            <h3 className="font-semibold text-lg mb-2">Works Offline</h3>
            <p className="text-gray-600">
              No wifi? No problem. Syncs when you're back.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
