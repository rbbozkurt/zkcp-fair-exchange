import React from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Wallet } from 'lucide-react';
import { ChevronDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const WalletConnectButton: React.FC = () => {
  const { t } = useTranslation();

  return (
    <ConnectButton.Custom>
      {({ account, chain, openConnectModal, openAccountModal, openChainModal, mounted }) => {
        const ready = mounted;
        const connected = ready && account && chain;

        return (
          <div
            className="backdrop-blur-lg bg-black/20 rounded-full px-2 py-1"
            {...(!ready && {
              'aria-hidden': true,
              style: { opacity: 0, pointerEvents: 'none', userSelect: 'none' },
            })}
          >
            {!connected ? (
              <button
                onClick={openConnectModal}
                className="h-16 flex items-center border border-white gap-2 px-6 rounded-full bg-black/30 text-white font-medium shadow-md hover:shadow-lg hover:scale-105 hover:text-pink-400 transition-all duration-200"
              >
                <Wallet className="w-5 h-5" />
                {t('topbar.connect_wallet')}
              </button>
            ) : chain.unsupported ? (
              <button
                onClick={openChainModal}
                className="h-10 px-4 bg-red-600 text-white rounded-lg"
              >
                {t('topbar.wrong_network')}
              </button>
            ) : (
              <div className="flex gap-2 items-center">
                {/* Chain */}
                <button
                  onClick={openChainModal}
                  className="flex items-center gap-2 px-4 py-2 bg-black/30 rounded-full text-white border border-white hover:scale-105 transition"
                >
                  {chain.hasIcon && chain.iconUrl && (
                    <img
                      alt={chain.name ?? 'Chain icon'}
                      src={chain.iconUrl}
                      className="w-5 h-5 rounded-full"
                    />
                  )}
                  <span>{chain.name}</span>
                  <ChevronDown className="w-4 h-4" />
                </button>

                {/* Account */}
                <button
                  onClick={openAccountModal}
                  className="flex items-center gap-2 px-4 py-2 bg-black/30 rounded-full text-white border border-white hover:scale-105 transition"
                >
                  {account.ensName ? (
                    <span>{account.ensName}</span>
                  ) : (
                    <span>{account.displayName}</span>
                  )}
                  {account.displayBalance && (
                    <span className="text-gray-400">({account.displayBalance})</span>
                  )}
                  <ChevronDown className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        );
      }}
    </ConnectButton.Custom>
  );
};

export default WalletConnectButton;
