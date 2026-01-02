import { Link } from 'react-router-dom';
import { Button } from '@/components/common';

export function NotFoundPage() {
  return (
    <div className="flex-1 flex items-center justify-center py-16">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-300 mb-4">404</h1>
        <p className="text-xl text-gray-600 mb-8">Page not found</p>
        <Link to="/">
          <Button>Go Home</Button>
        </Link>
      </div>
    </div>
  );
}
