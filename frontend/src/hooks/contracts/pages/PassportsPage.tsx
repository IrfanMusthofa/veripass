import { Link } from 'react-router-dom';
import { useAccount, useChainId } from 'wagmi';
import { Button, Card, CardBody } from '@/components/common';
import { PassportList } from '@/components/passport';
import { useAllPassports } from '@/hooks';

export function PassportsPage() {
  const { isConnected } = useAccount();
  const chainId = useChainId();

  const { passports, nextTokenId, isLoading } = useAllPassports(chainId);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Asset Passports</h1>
          {nextTokenId !== undefined && nextTokenId > 1n && (
            <p className="text-sm text-gray-500 mt-1">
              {String(Number(nextTokenId) - 1)} passports minted
            </p>
          )}
        </div>
        <Link to="/mint">
          <Button>Mint New</Button>
        </Link>
      </div>

      {!isConnected ? (
        <Card>
          <CardBody className="text-center py-12">
            <p className="text-gray-500">
              Connect your wallet to view passports.
            </p>
          </CardBody>
        </Card>
      ) : (
        <PassportList
          passports={passports}
          isLoading={isLoading}
          emptyMessage="No passports have been minted yet."
        />
      )}
    </div>
  );
}
