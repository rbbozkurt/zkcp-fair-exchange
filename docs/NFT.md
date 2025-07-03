# How does zkDrop NFTs look like?

Each file uploaded by a user can morphed into a NFT, including title, description, image etc.

```json
{
  "name": "NFT Title",
  "description": "Description of the NFT",
  "image": "ipfs://link_to_img_file",
  "file_enc": "ipfs://link_to_enc_file",
  "file_type": ".pdf",
  "attributes": [
    { "trait_type": "Background", "value": "Blue" },
    { "trait_type": "Rarity", "value": "Legendary" }
  ]
}
```
