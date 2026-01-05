import { Link, useLocation } from 'react-router-dom';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAuth } from '@/providers';
import { Button } from '@/components/common';

const navLinks = [
  { path: '/', label: 'Home' },
  { path: '/passports', label: 'Passports' },
  { path: '/mint', label: 'Mint' },
];

export function Header() {
  const location = useLocation();
  const { isAuthenticated, signIn, signOut, isLoading } = useAuth();

  return (
    <header className="bg-[var(--color-bg-primary)] border-b border-[var(--color-border)]">
      <div className="max-w-6xl mx-auto px-[var(--spacing-4)]">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-[var(--spacing-2)]">
            <div className="w-8 h-8 bg-[var(--color-accent-blue)] rounded-[var(--radius-md)] flex items-center justify-center">
              <span className="text-white font-bold text-[var(--font-size-sm)]">VP</span>
            </div>
            <span className="font-semibold text-[var(--color-text-primary)]">VeriPass</span>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-[var(--spacing-6)]">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`
                  text-[var(--font-size-sm)] font-medium
                  transition-colors duration-[var(--transition-fast)]
                  px-[var(--spacing-2)] py-[var(--spacing-1)]
                  rounded-[var(--radius-md)]
                  ${
                    location.pathname === link.path
                      ? 'text-[var(--color-accent-blue)] bg-[rgba(35,131,226,0.05)]'
                      : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)]'
                  }
                `}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right side: Auth + Wallet */}
          <div className="flex items-center gap-[var(--spacing-3)]">
            {/* Backend Auth Status */}
            {isAuthenticated ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => signOut()}
              >
                Sign Out
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => signIn()}
                loading={isLoading}
              >
                Sign In
              </Button>
            )}

            {/* Wallet Connection */}
            <ConnectButton.Custom>
              {({
                account,
                chain,
                openAccountModal,
                openChainModal,
                openConnectModal,
                mounted,
              }) => {
                const ready = mounted;
                const connected = ready && account && chain;

                return (
                  <div
                    {...(!ready && {
                      'aria-hidden': true,
                      style: {
                        opacity: 0,
                        pointerEvents: 'none',
                        userSelect: 'none',
                      },
                    })}
                  >
                    {(() => {
                      if (!connected) {
                        return (
                          <Button onClick={openConnectModal} size="sm">
                            Connect Wallet
                          </Button>
                        );
                      }

                      if (chain.unsupported) {
                        return (
                          <Button
                            onClick={openChainModal}
                            variant="danger"
                            size="sm"
                          >
                            Wrong Network
                          </Button>
                        );
                      }

                      return (
                        <div className="flex items-center gap-[var(--spacing-2)]">
                          <button
                            onClick={openChainModal}
                            className="
                              flex items-center gap-1
                              px-[var(--spacing-2)] py-[var(--spacing-1)]
                              text-[var(--font-size-sm)]
                              text-[var(--color-text-secondary)]
                              hover:bg-[var(--color-bg-hover)]
                              rounded-[var(--radius-md)]
                              transition-colors duration-[var(--transition-fast)]
                            "
                          >
                            {chain.hasIcon && chain.iconUrl && (
                              <img
                                alt={chain.name ?? 'Chain icon'}
                                src={chain.iconUrl}
                                className="w-4 h-4"
                              />
                            )}
                          </button>

                          <button
                            onClick={openAccountModal}
                            className="
                              flex items-center gap-2
                              px-[var(--spacing-3)] py-[var(--spacing-1)]
                              bg-[var(--color-bg-secondary)]
                              hover:bg-[var(--color-bg-tertiary)]
                              text-[var(--font-size-sm)]
                              text-[var(--color-text-primary)]
                              rounded-[var(--radius-md)]
                              transition-colors duration-[var(--transition-fast)]
                            "
                          >
                            {account.displayBalance && (
                              <span className="text-[var(--color-text-secondary)]">
                                {account.displayBalance}
                              </span>
                            )}
                            <span className="font-medium">
                              {account.displayName}
                            </span>
                          </button>
                        </div>
                      );
                    })()}
                  </div>
                );
              }}
            </ConnectButton.Custom>
          </div>
        </div>
      </div>
    </header>
  );
}
