export function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200 py-6">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-gray-500">
            VeriPass - Decentralized Asset Passport System
          </p>
          <div className="flex items-center gap-4">
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              GitHub
            </a>
            <a
              href="https://docs.example.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Docs
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
