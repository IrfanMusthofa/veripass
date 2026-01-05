import { useNavigate } from 'react-router-dom';
import { Card, CardBody, Badge } from '@/components/common';
import { truncateAddress, truncateHash, formatRelativeTime } from '@/lib';
import type { Passport } from '@/types';

interface PassportCardProps {
  passport: Passport;
}

export function PassportCard({ passport }: PassportCardProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/passports/${passport.tokenId.toString()}`);
  };

  return (
    <Card hover onClick={handleClick}>
      <CardBody>
        <div className="flex items-start justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-900">
            Passport #{passport.tokenId.toString()}
          </h3>
          <Badge variant={passport.isActive ? 'success' : 'error'}>
            {passport.isActive ? 'Active' : 'Inactive'}
          </Badge>
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Owner</span>
            <span className="font-mono text-gray-700">
              {truncateAddress(passport.owner)}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-gray-500">Metadata Hash</span>
            <span className="font-mono text-gray-700">
              {truncateHash(passport.metadataHash)}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-gray-500">Minted</span>
            <span className="text-gray-700">
              {formatRelativeTime(Number(passport.mintTimestamp))}
            </span>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
