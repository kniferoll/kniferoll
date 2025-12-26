interface JoinCodeModalProps {
  joinCode: string;
  qrCodeUrl: string;
  onClose: () => void;
}

export function JoinCodeModal({
  joinCode,
  qrCodeUrl,
  onClose,
}: JoinCodeModalProps) {
  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg p-8 shadow-xl max-w-md w-full relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Close"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">
            Team Join Code
          </h3>

          {/* QR Code */}
          {qrCodeUrl && (
            <div className="bg-white p-6 rounded-lg inline-block mb-6">
              <img
                src={qrCodeUrl}
                alt="Kitchen QR Code"
                className="w-75 h-75"
              />
            </div>
          )}

          {/* Code */}
          <p className="text-sm text-gray-600 mb-4">Or enter code manually:</p>
          <div className="bg-gray-100 rounded-lg p-6 mb-6 select-all">
            <p className="text-5xl font-mono font-bold text-blue-600 tracking-wider letter-spacing">
              {joinCode}
            </p>
          </div>

          <p className="text-sm text-gray-500">
            Scan QR code or visit kniferoll.io/join
          </p>
        </div>
      </div>
    </div>
  );
}
