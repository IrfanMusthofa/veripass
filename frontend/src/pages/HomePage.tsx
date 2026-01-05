import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button, Card, CardBody } from '@/components/common';
import { useIsBackendAvailable } from '@/hooks';
import { pageVariants, staggerContainer, staggerItem } from '@/lib/animations';

const features = [
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    title: 'Tamper-Proof',
    description: 'Asset metadata hashes are stored immutably on the blockchain, ensuring data integrity.',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    title: 'Lifecycle Tracking',
    description: 'Record and verify maintenance, certifications, and ownership changes over time.',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
      </svg>
    ),
    title: 'Oracle Verification',
    description: 'Trusted oracles verify service records and submit verified events to the blockchain.',
  },
];

export function HomePage() {
  const { isAvailable: isBackendAvailable } = useIsBackendAvailable();

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="max-w-5xl mx-auto px-[var(--spacing-4)] py-[var(--spacing-16)]"
    >
      {/* Hero Section */}
      <div className="text-center mb-[var(--spacing-16)]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h1 className="text-[var(--font-size-4xl)] font-bold text-[var(--color-text-primary)] mb-[var(--spacing-4)]">
            VeriPass
          </h1>
          <p className="text-[var(--font-size-xl)] text-[var(--color-text-secondary)] mb-[var(--spacing-2)]">
            Decentralized Asset Passport System
          </p>
          <p className="text-[var(--color-text-muted)] mb-[var(--spacing-8)] max-w-2xl mx-auto">
            Create tamper-proof digital passports for physical assets.
            Track ownership history and lifecycle events on an immutable blockchain ledger.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex justify-center gap-[var(--spacing-4)]"
        >
          <Link to="/passports">
            <Button size="lg">View Passports</Button>
          </Link>
          <Link to="/mint">
            <Button variant="secondary" size="lg">Mint Passport</Button>
          </Link>
        </motion.div>

        {/* Backend Status */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-[var(--spacing-6)]"
        >
          <span className={`
            inline-flex items-center gap-2
            text-[var(--font-size-sm)]
            px-[var(--spacing-3)] py-[var(--spacing-1)]
            rounded-full
            ${isBackendAvailable
              ? 'bg-[var(--color-accent-green-light)] text-[var(--color-accent-green)]'
              : 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-muted)]'
            }
          `}>
            <span className={`w-2 h-2 rounded-full ${isBackendAvailable ? 'bg-[var(--color-accent-green)]' : 'bg-[var(--color-text-muted)]'}`} />
            {isBackendAvailable ? 'Backend Connected' : 'Offline Mode'}
          </span>
        </motion.div>
      </div>

      {/* Features Section */}
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 md:grid-cols-3 gap-[var(--spacing-6)]"
      >
        {features.map((feature, index) => (
          <motion.div key={index} variants={staggerItem}>
            <Card className="h-full" hover>
              <CardBody className="text-center">
                <div className="w-12 h-12 mx-auto mb-[var(--spacing-4)] rounded-full bg-[rgba(35,131,226,0.1)] flex items-center justify-center text-[var(--color-accent-blue)]">
                  {feature.icon}
                </div>
                <h3 className="text-[var(--font-size-lg)] font-semibold text-[var(--color-text-primary)] mb-[var(--spacing-2)]">
                  {feature.title}
                </h3>
                <p className="text-[var(--font-size-sm)] text-[var(--color-text-secondary)]">
                  {feature.description}
                </p>
              </CardBody>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* How It Works Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="mt-[var(--spacing-16)]"
      >
        <h2 className="text-[var(--font-size-2xl)] font-semibold text-[var(--color-text-primary)] text-center mb-[var(--spacing-8)]">
          How It Works
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-[var(--spacing-8)]">
          {[
            { step: '1', title: 'Mint Passport', desc: 'Create a digital passport NFT for your physical asset with verified metadata.' },
            { step: '2', title: 'Track Events', desc: 'Record maintenance, certifications, and ownership changes on the blockchain.' },
            { step: '3', title: 'Verify Authenticity', desc: 'Compare on-chain and off-chain data to verify asset integrity.' },
          ].map((item, index) => (
            <div key={index} className="text-center">
              <div className="w-10 h-10 mx-auto mb-[var(--spacing-3)] rounded-full bg-[var(--color-accent-blue)] text-white font-bold flex items-center justify-center">
                {item.step}
              </div>
              <h3 className="text-[var(--font-size-base)] font-semibold text-[var(--color-text-primary)] mb-[var(--spacing-1)]">
                {item.title}
              </h3>
              <p className="text-[var(--font-size-sm)] text-[var(--color-text-muted)]">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}
