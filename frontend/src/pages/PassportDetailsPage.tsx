import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAccount, useChainId } from 'wagmi';
import { Card, CardBody, LoadingOverlay } from '@/components/common';
import { PassportDetails } from '@/components/passport';
import { EventTimeline, RecordEventForm } from '@/components/events';
import { usePassport } from '@/hooks';

export function PassportDetailsPage() {
  const { tokenId } = useParams<{ tokenId: string }>();
  const { address } = useAccount();
  const chainId = useChainId();
  const navigate = useNavigate();

  const [showRecordEvent, setShowRecordEvent] = useState(false);
  const [eventKey, setEventKey] = useState(0);

  const tokenIdBigInt = tokenId ? BigInt(tokenId) : undefined;
  const { passport, isLoading, error } = usePassport(tokenIdBigInt, chainId);

  const isOwner = address && passport?.owner.toLowerCase() === address.toLowerCase();

  const handleTransferSuccess = () => {
    navigate(0);
  };

  const handleRecordEventSuccess = () => {
    setShowRecordEvent(false);
    // Increment key to refresh EventTimeline
    setEventKey((k) => k + 1);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
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
        {isLoading ? (
          <Card>
            <CardBody>
              <LoadingOverlay message="Loading passport..." />
            </CardBody>
          </Card>
        ) : error ? (
          <Card>
            <CardBody className="text-center py-12">
              <p className="text-red-600">
                Failed to load passport. It may not exist.
              </p>
            </CardBody>
          </Card>
        ) : passport ? (
          <div className="space-y-6">
            <PassportDetails
              passport={passport}
              onTransferSuccess={handleTransferSuccess}
            />

            {/* Event Timeline */}
            <EventTimeline
              key={eventKey}
              assetId={passport.tokenId}
              showRecordButton={isOwner && passport.isActive}
              onRecordClick={() => setShowRecordEvent(true)}
            />

            {/* Record Event Modal */}
            {tokenIdBigInt && (
              <RecordEventForm
                isOpen={showRecordEvent}
                onClose={() => setShowRecordEvent(false)}
                assetId={tokenIdBigInt}
                onSuccess={handleRecordEventSuccess}
              />
            )}
          </div>
        ) : (
          <Card>
            <CardBody className="text-center py-12">
              <p className="text-gray-500">Passport not found.</p>
            </CardBody>
          </Card>
        )}
      </div>
    </div>
  );
}
