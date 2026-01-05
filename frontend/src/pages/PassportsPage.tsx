import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAccount, useChainId } from 'wagmi';
import { Button, Card, CardBody } from '@/components/common';
import { PassportList } from '@/components/passport';
import { useNextTokenId, usePassport } from '@/hooks';
import type { Passport } from '@/types';

export function PassportsPage() {
  const { isConnected } = useAccount();
  const chainId = useChainId();

  // Get total supply to know how many passports exist
  const { data: nextTokenId, isLoading: isLoadingCount } = useNextTokenId(chainId);

  // For demo: fetch first 10 passports (in production, use indexer/subgraph)
  const tokenIds = useMemo(() => {
    const tokenIdValue = nextTokenId as bigint | undefined;
    if (!tokenIdValue || tokenIdValue <= 1n) return [];
    const count = Number(tokenIdValue) - 1;
    const maxDisplay = Math.min(count, 10);
    return Array.from({ length: maxDisplay }, (_, i) => BigInt(i + 1));
  }, [nextTokenId]);

  // Fetch passport data for each token
  const passport1 = usePassport(tokenIds[0], chainId);
  const passport2 = usePassport(tokenIds[1], chainId);
  const passport3 = usePassport(tokenIds[2], chainId);
  const passport4 = usePassport(tokenIds[3], chainId);
  const passport5 = usePassport(tokenIds[4], chainId);

  const passports = useMemo(() => {
    const results: Passport[] = [];
    [passport1, passport2, passport3, passport4, passport5].forEach((p) => {
      if (p.passport) results.push(p.passport);
    });
    return results;
  }, [passport1, passport2, passport3, passport4, passport5]);

  const isLoading = isLoadingCount ||
    passport1.isLoading ||
    passport2.isLoading ||
    passport3.isLoading ||
    passport4.isLoading ||
    passport5.isLoading;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Asset Passports</h1>
          {nextTokenId !== undefined && (nextTokenId as bigint) > 1n && (
            <p className="text-sm text-gray-500 mt-1">
              {String(Number(nextTokenId as bigint) - 1)} passports minted
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
