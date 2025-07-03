import React from 'react';
import type { PurchasedListingNFT, Role } from '../types/nftTypes';
import { PurchaseActions } from '../types/nftTypes';

// --- Stateless Action Button ---
interface PurchaseActionButtonProps {
  label: string;
  enabled: boolean;
  description?: string;
  onClick?: () => void;
}

const PurchaseActionButton: React.FC<PurchaseActionButtonProps> = ({
  label,
  enabled,
  description,
  onClick,
}) => (
  <div className="mt-4">
    {enabled ? (
      <button
        className={`
          h-14 px-8 ml-4 bg-black text-white border border-white rounded-full font-bold shadow transition-all text-md
          hover:bg-white hover:text-black hover:border-black
        `}
        onClick={onClick}
      >
        {label}
      </button>
    ) : (
      <div className="text-gray-400">{label}</div>
    )}
    {description && <div className="text-xs text-gray-400 mt-1">{description}</div>}
  </div>
);

// --- Card View ---
interface PortfolioNFTPurchasedCardViewProps {
  purchasedNFT: PurchasedListingNFT;
  role: Role;
  onClick?: () => void;
}

const NFTTitle: React.FC<{ name: string }> = ({ name }) => (
  <h2 className="text-lg font-extrabold text-white tracking-wide drop-shadow-pink-500/40 text-center z-10">
    {name}
  </h2>
);

const NFTDescription: React.FC<{ description: string }> = ({ description }) => (
  <p className="text-gray-200 text-xs text-left px-1 line-clamp-2 z-10">{description}</p>
);

const NFTPrice: React.FC<{ price_in_usd: number }> = ({ price_in_usd }) => (
  <div className="flex items-center justify-center mt-1 z-10">
    <span className="inline-block backdrop-blur-lg bg-black/10 px-3 py-1 rounded-full text-white font-bold text-base shadow border border-white/40">
      ${price_in_usd} USD
    </span>
  </div>
);

const NFTIpfsAddress: React.FC<{ ipfs_address: string }> = ({ ipfs_address }) => (
  <div className="text-[10px] text-gray-100 break-all bg-black/30 backdrop-blur-sm px-1 py-0.5 rounded mt-1 font-mono z-10">
    {ipfs_address}
  </div>
);

const PortfolioNFTPurchasedCardView: React.FC<PortfolioNFTPurchasedCardViewProps> = ({
  purchasedNFT,
  role,
  onClick,
}) => {
  const action = PurchaseActions[purchasedNFT.purchaseState]?.[role];

  const handleAction = () => {
    if (action?.enabled && action.nextState !== undefined && onClick) {
      onClick();
    }
    // You can also trigger your backend/contract logic here if needed
  };

  const bgImage = purchasedNFT.nft.image.startsWith('ipfs://')
    ? purchasedNFT.nft.image.replace('ipfs://', 'https://ipfs.io/ipfs/')
    : purchasedNFT.nft.image;

  return (
    <div
      className={`
        relative
        bg-transparent
        backdrop-blur-lg
        bg-black/10
        border-2
        border-white
        rounded-2xl
        shadow-xl
        max-w-xs
        mx-auto
        p-4
        flex
        flex-col
        items-center
        space-y-2
        cursor-pointer
        transition-all
        duration-150
        group
        hover:border-pink-500
        hover:shadow-pink-500/40
        min-h-[260px]
        h-[260px]
        justify-center
        overflow-hidden
      `}
      onClick={onClick}
      style={{
        boxShadow: '0 4px 32px 0 rgba(255,255,255,0.08)',
        backgroundImage: `url('${bgImage}')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      {/* Overlay for blur and darken */}
      <div className="absolute inset-0  align-bottom backdrop-blur-lg bg-black/10 rounded-2xl z-0"></div>
      {/* Content */}
      <div className="relative z-10 w-full flex flex-col align-bottom items-start space-y-1">
        <NFTTitle name={purchasedNFT.nft.name} />
        <NFTDescription description={purchasedNFT.nft.description} />
        <NFTIpfsAddress
          ipfs_address={
            purchasedNFT.nft.attributes.find((attr) => attr.trait_type === 'ipfs_address')
              ?.value as string
          }
        />
      </div>
      <div className="relative z-10 w-full flex flex-col items-end space-y-1">
        <NFTPrice
          price_in_usd={
            purchasedNFT.nft.attributes.find((attr) => attr.trait_type === 'price_in_usd')
              ?.value as number
          }
        />
      </div>
      {/* Purchase Action Button */}
      {action && (
        <div className="relative z-10 w-full flex flex-col items-center">
          <PurchaseActionButton
            label={action.label}
            enabled={action.enabled}
            description={action.description}
            onClick={handleAction}
          />
        </div>
      )}
    </div>
  );
};

export default PortfolioNFTPurchasedCardView;
