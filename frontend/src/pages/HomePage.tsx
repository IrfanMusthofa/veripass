import { Link } from 'react-router-dom';
import { Button } from '@/components/common';

export function HomePage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-16">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          VeriPass
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Decentralized Asset Passport System
        </p>
        <p className="text-gray-500 mb-8 max-w-2xl mx-auto">
          Create tamper-proof digital passports for physical assets.
          Track ownership history and lifecycle events on an immutable blockchain ledger.
        </p>

        <div className="flex justify-center gap-4">
          <Link to="/passports">
            <Button size="lg">View Passports</Button>
          </Link>
          <Link to="/mint">
            <Button variant="secondary" size="lg">Mint Passport</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
