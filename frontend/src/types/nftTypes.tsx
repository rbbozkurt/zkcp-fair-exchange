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
