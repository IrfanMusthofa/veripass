import { Link, useNavigate } from 'react-router-dom';
import { MintPassportForm } from '@/components/passport';

export function MintPage() {
  const navigate = useNavigate();

  const handleSuccess = () => {
    // Navigate to passports page after successful mint
    setTimeout(() => {
      navigate('/passports');
    }, 2000);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <Link
        to="/passports"
        className="text-blue-600 hover:underline mb-4 inline-flex items-center gap-1"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Passports
      </Link>

      <div className="mt-4">
        <MintPassportForm onSuccess={handleSuccess} />
      </div>
    </div>
  );
}
