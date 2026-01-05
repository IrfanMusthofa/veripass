import { PassportCard } from './PassportCard';
import { LoadingOverlay } from '@/components/common';
import type { Passport } from '@/types';

interface PassportListProps {
  passports: Passport[];
  isLoading?: boolean;
  emptyMessage?: string;
}

export function PassportList({
  passports,
  isLoading = false,
  emptyMessage = 'No passports found.',
}: PassportListProps) {
  if (isLoading) {
    return <LoadingOverlay message="Loading passports..." />;
  }

  if (passports.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <svg
          className="w-12 h-12 mx-auto mb-4 text-gray-300"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        <p>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {passports.map((passport) => (
        <PassportCard key={passport.tokenId.toString()} passport={passport} />
      ))}
    </div>
  );
}
