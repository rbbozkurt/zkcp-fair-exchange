/*
Example of ListingNFTPreview interface usage:
{
    owner: '0xFA7E7a79AC32fe399E9C28cBEAE286981A8F8510',
    name: 'Mystic Forest',
    description: 'A beautiful digital painting of a mysterious forest at dawn.',
    image: 'ipfs://QmMysticForestImage',
    attributes: [
        { trait_type: 'price_in_usd', value: 25.0 },
        { trait_type: 'ipfs_address', value: 'ipfs://QmMysticForestNFT' }
    ],
}
*/

export interface ListingNFTAttribute {
  trait_type: string; // e.g., 'price_in_usd', 'ipfs_address'
  value: string | number;
}

export interface ListingNFTPreview {
  owner: string;
  name: string;
  description: string;
  image: string;
  attributes: ListingNFTAttribute[]; // Array of key-value attribute pairs
}

/*
const mockNFTs = [
    {
        name: 'NFT Title',
        description: 'Description of the NFT',
        image: 'ipfs://link_to_img_file',
        attributes: [
            { trait_type: 'file_enc', value: 'ipfs://link_to_enc_file' },
            { trait_type: 'file_type', value: '.pdf' },
            { trait_type: 'price_in_usd', value: 10.0 },
            { trait_type: 'category', value: 'Art' },
        ],
    },
];
*/

export interface ListingNFT {
  owner: string; // Owner's address
  name: string; // Name of the NFT
  description: string; // Description of the NFT
  image: string; // IPFS address of the NFT image
  attributes: ListingNFTAttribute[]; // Array of key-value attribute pairs
}

export interface PurchasedListingNFT {
  proposer: string; // Address of the proposer (buyer)
  nft: ListingNFT; // The NFT that was purchased
  purchaseState: PurchaseStateType; // Current state of the purchase
}

/*
const NFTType = {
    LISTING: 0,
    DATASET: 1
} as const;

const PurchaseState = {
  PAID: 0,
  ZK_PROOF_SUBMITTED: 1,
  VERIFIED: 2,
  DELIVERED: 3,
  COMPLETED: 4,
  DISPUTED: 5,
  REFUNDED: 6,
  CANCELLED: 7
} as const;
*/
// ...existing code...

export const PurchaseState = {
  INITIATED: 0,
  PAID: 1,
  WAITING_FOR_ZK_PROOF: 2,
  ZK_PROOF_SUBMITTED: 3,
  WAITING_FOR_VERIFICATION: 4,
  VERIFIED: 5,
  WAITING_FOR_MINT: 6,
  MINTED: 7,
  COMPLETED: 8,
  EXPIRED: 9,
  REFUNDED: 10,
  CANCELLED: 11,
  ZK_PROOF_SUBMISSION_EXPIRED: 12,
  ZK_VERIFICATION_EXPIRED: 13,
  GET_PAID: 14,
} as const;

export type Role = 'proposer' | 'owner';

export interface PurchaseAction {
  label: string;
  enabled: boolean;
  nextState?: number;
  description?: string;
}

type PurchaseActionsMap = {
  [state: number]: {
    proposer?: PurchaseAction;
    owner?: PurchaseAction;
  };
};

export const PurchaseActions: PurchaseActionsMap = {
  [PurchaseState.PAID]: {
    owner: {
      label: 'Submit ZK proof',
      enabled: true,
      nextState: PurchaseState.ZK_PROOF_SUBMITTED,
      description: 'Seller must submit a ZK proof for the NFT.',
    },
    proposer: {
      label: 'Waiting for ZK proof submission',
      enabled: false,
      description: 'Waiting for seller to submit ZK proof.',
    },
  },
  [PurchaseState.WAITING_FOR_ZK_PROOF]: {
    owner: {
      label: 'Submit ZK proof',
      enabled: true,
      nextState: PurchaseState.ZK_PROOF_SUBMITTED,
      description: 'Seller must submit a ZK proof for the NFT.',
    },
    proposer: {
      label: 'Waiting for ZK proof submission',
      enabled: false,
      description: 'Waiting for seller to submit ZK proof.',
    },
  },
  [PurchaseState.ZK_PROOF_SUBMITTED]: {
    owner: {
      label: 'Wait for verification',
      enabled: false,
      description: 'Waiting for buyer to verify ZK proof.',
    },
    proposer: {
      label: 'Verify ZK proof',
      enabled: true,
      nextState: PurchaseState.VERIFIED,
      description: 'Buyer must verify the ZK proof.',
    },
  },
  [PurchaseState.WAITING_FOR_VERIFICATION]: {
    owner: {
      label: 'Wait for verification',
      enabled: false,
      description: 'Waiting for buyer to verify ZK proof.',
    },
    proposer: {
      label: 'Verify ZK proof',
      enabled: true,
      nextState: PurchaseState.VERIFIED,
      description: 'Buyer must verify the ZK proof.',
    },
  },
  [PurchaseState.VERIFIED]: {
    owner: {
      label: 'Wait for delivery',
      enabled: false,
      description: 'Waiting for buyer to mint NFT.',
    },
    proposer: {
      label: 'Mint NFT',
      enabled: true,
      nextState: PurchaseState.MINTED,
      description: 'Buyer can mint the NFT.',
    },
  },
  [PurchaseState.WAITING_FOR_MINT]: {
    owner: {
      label: 'Wait for delivery',
      enabled: false,
      description: 'Waiting for buyer to mint NFT.',
    },
    proposer: {
      label: 'Mint NFT',
      enabled: true,
      nextState: PurchaseState.MINTED,
      description: 'Buyer can mint the NFT.',
    },
  },
  [PurchaseState.MINTED]: {
    owner: {
      label: 'Wait for completion',
      enabled: false,
      description: 'Waiting for transaction to complete.',
    },
    proposer: {
      label: 'Completed',
      enabled: false,
      description: 'NFT minted. Transaction will complete soon.',
    },
  },
  [PurchaseState.COMPLETED]: {
    owner: {
      label: 'Completed',
      enabled: false,
      description: 'Transaction completed.',
    },
    proposer: {
      label: 'Completed',
      enabled: false,
      description: 'Transaction completed.',
    },
  },
  [PurchaseState.ZK_PROOF_SUBMISSION_EXPIRED]: {
    owner: {
      label: 'Expired',
      enabled: false,
      description: 'Seller did not submit ZK proof in time.',
    },
    proposer: {
      label: 'Refund',
      enabled: true,
      nextState: PurchaseState.REFUNDED,
      description: 'Buyer can claim a refund.',
    },
  },
  [PurchaseState.ZK_VERIFICATION_EXPIRED]: {
    owner: {
      label: 'Expired',
      enabled: false,
      description: 'Buyer did not verify ZK proof in time.',
    },
    proposer: {
      label: 'Refund',
      enabled: true,
      nextState: PurchaseState.REFUNDED,
      description: 'Buyer can claim a refund.',
    },
  },
  [PurchaseState.REFUNDED]: {
    owner: {
      label: 'Refunded',
      enabled: false,
      description: 'Buyer refunded.',
    },
    proposer: {
      label: 'Refunded',
      enabled: false,
      description: 'You have been refunded.',
    },
  },
  [PurchaseState.CANCELLED]: {
    owner: {
      label: 'Cancelled',
      enabled: false,
      description: 'Transaction cancelled.',
    },
    proposer: {
      label: 'Cancelled',
      enabled: false,
      description: 'Transaction cancelled.',
    },
  },
  [PurchaseState.GET_PAID]: {
    owner: {
      label: 'Claim Payment',
      enabled: true,
      nextState: PurchaseState.COMPLETED,
      description: 'Seller can claim payment.',
    },
    proposer: {
      label: 'Waiting for seller to claim payment',
      enabled: false,
      description: 'Waiting for seller to claim payment.',
    },
  },
};
// ...existing code...

export type PurchaseStateType = (typeof PurchaseState)[keyof typeof PurchaseState];
// export type NFTTypeType = typeof NFTType[keyof typeof NFTType];
