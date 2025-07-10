// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol"; // basic ERC721 standard
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Burnable.sol"; // ability to burn (destroy) NFTs, not sure if this will be needed, maybe when seller removes the NFT from the marketplace
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol"; // extends ERC721 and adds functionality for storing and managing metadata URIs associated with NFTs
//import "@openzeppelin/contracts/access/Ownable.sol"; // access control; allows specifying an owner who has special privilages within the contract
import "@openzeppelin/contracts/access/AccessControl.sol"; // better access control
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol"; // reentrancy protection

// simple ERC721 contract for Listing NFTs AND Dataset NFTs 

// REMOVED "onlyOwner" MODIFIERS FOR TESTING PURPOSES, A BETTER ACCESS CONTROL MECHANISM WILL BE IMPLEMENTED LATER

contract DatasetNFT is ERC721, ERC721Burnable, ERC721URIStorage, AccessControl, ReentrancyGuard {

    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");
   
    enum NFTType
    {
        LISTING, // NFT representing a listing on the marketplace, addressed to seller
        DATASET // NFT representing a dataset, addressed to buyer when the purchase is complete
    }


    // WILL BE UPDATED
    struct NFTInfo {
        NFTType nftType;
        address creator;
        uint256 createdAt;
        bool isActive;
        uint256 linkedTokenId; // For linking listing NFT to dataset NFT
    }

    struct ListingInfo {
        string category;
        uint256 price;
        uint256 listedAt;
    }

    mapping(uint256 => NFTInfo) public nftInfo;
    mapping(uint256 => ListingInfo) public listingInfo; // Store listing-specific data
    mapping(uint256 => uint256) public listingToDataset; // listing tokenId -> dataset tokenId
    mapping(uint256 => uint256) public datasetToListing; // dataset tokenId -> listing tokenId

    // counters for different types of NFTs
    uint private _listingTokenCounter;
    uint private _datasetTokenCounter;


    event ListingNFTMinted(uint256 indexed tokenId, address indexed seller, string metadataURI);
    event DatasetNFTMinted(uint256 indexed tokenId, address indexed buyer, uint256 indexed linkedListingId);
    event ListingDeactivated(uint256 indexed tokenId);

    constructor(address initialOwner) 
    ERC721("DatasetNFT", "DNFT")
    {
        _listingTokenCounter = 1000000; // start from million to avoid conflict with dataset tokenIds
        _datasetTokenCounter = 1; // start from 1 to avoid zero tokenId

        _grantRole(DEFAULT_ADMIN_ROLE, initialOwner);
        _grantRole(OPERATOR_ROLE, initialOwner);
    }



    // Function to mint an NFT with a metadata URI
    // This function is used internally to mint both listing and dataset NFTs
    function _mintWithURI(address to, uint256 tokenId, string memory uri) internal {
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);
    }

    // Function to mint a listing NFT (called when dataset is listed on marketplace) "onlyOwner" modifier is removed for testing purposes
    function mintListingNFT(
        address seller,
        string memory metadataURI,
        string memory category,
        uint256 price
    ) public nonReentrant returns (uint256) {
        //require(hasRole(OPERATOR_ROLE, msg.sender) || hasRole(DEFAULT_ADMIN_ROLE, msg.sender), "Not authorized");
        require(bytes(category).length > 0, "Category cannot be empty");
        require(price >= 0, "Price cannot be negative");
        require(bytes(metadataURI).length > 0, "Metadata URI cannot be empty"); // NEW: Basic validation

        
        uint256 tokenId = _listingTokenCounter++;
        
        // Store NFT information
        nftInfo[tokenId] = NFTInfo({
            nftType: NFTType.LISTING,
            creator: seller,
            createdAt: block.timestamp,
            isActive: true,
            linkedTokenId: 0 // Will be set when dataset NFT is minted
        });
        
        // Store listing-specific information
        listingInfo[tokenId] = ListingInfo({
            category: category,
            price: price,
            listedAt: block.timestamp
        });
        
        // Mint the NFT with metadata URI
        _mintWithURI(seller, tokenId, metadataURI);
        
        emit ListingNFTMinted(tokenId, seller, metadataURI);
        return tokenId;
    }
    
    // Function to mint a dataset NFT (called after successful purchase and ZK proof verification) "onlyOwner" modifier is removed for testing purposes
    function mintDatasetNFT(
        address buyer,
        uint256 listingTokenId,
        string memory datasetMetadataURI
    ) public nonReentrant returns (uint256) {
        //require(hasRole(OPERATOR_ROLE, msg.sender) || hasRole(DEFAULT_ADMIN_ROLE, msg.sender), "Not authorized");

        require(nftInfo[listingTokenId].nftType == NFTType.LISTING, "Invalid listing token ID");
        require(nftInfo[listingTokenId].isActive, "Listing is not active");
        require(bytes(datasetMetadataURI).length > 0, "Dataset metadata URI cannot be empty"); // NEW: Basic validation

        
        uint256 tokenId = _datasetTokenCounter++;
        
        // Store NFT information
        nftInfo[tokenId] = NFTInfo({
            nftType: NFTType.DATASET,
            creator: buyer,
            createdAt: block.timestamp,
            isActive: true,
            linkedTokenId: listingTokenId
        });
        
        // Create the linkage between listing and dataset NFTs
        listingToDataset[listingTokenId] = tokenId;
        datasetToListing[tokenId] = listingTokenId;
        
        // Update the listing NFT's linked token ID
        nftInfo[listingTokenId].linkedTokenId = tokenId;
        
        // Mint the dataset NFT to the buyer with metadata URI
        _mintWithURI(buyer, tokenId, datasetMetadataURI);
        
        emit DatasetNFTMinted(tokenId, buyer, listingTokenId);
        return tokenId;
    }
    
    // Function to deactivate a listing NFT (when removed from marketplace) "onlyOwner" modifier is removed for testing purposes
    function deactivateListing(uint256 listingTokenId) public {
        require(nftInfo[listingTokenId].nftType == NFTType.LISTING, "Not a listing NFT");
        require(nftInfo[listingTokenId].isActive, "Listing already inactive");
        
        // NEW: Allow NFT owner, operators, or admins to deactivate
        require(
            ownerOf(listingTokenId) == msg.sender || 
            hasRole(OPERATOR_ROLE, msg.sender) || 
            hasRole(DEFAULT_ADMIN_ROLE, msg.sender),
            "Not authorized to deactivate"
        );
        
        nftInfo[listingTokenId].isActive = false;
        emit ListingDeactivated(listingTokenId);
    }
    
    // Getter functions
    function getNFTInfo(uint256 tokenId) public view returns (NFTInfo memory) {
        return nftInfo[tokenId];
    }
    
    function getListingInfo(uint256 listingTokenId) public view returns (ListingInfo memory) {
        require(nftInfo[listingTokenId].nftType == NFTType.LISTING, "Not a listing NFT");
        return listingInfo[listingTokenId];
    }
    
    function isListingActive(uint256 listingTokenId) public view returns (bool) {
        return nftInfo[listingTokenId].isActive && nftInfo[listingTokenId].nftType == NFTType.LISTING;
    }
    
    function getLinkedDatasetNFT(uint256 listingTokenId) public view returns (uint256) {
        return listingToDataset[listingTokenId];
    }
    
    function getLinkedListingNFT(uint256 datasetTokenId) public view returns (uint256) {
        return datasetToListing[datasetTokenId];
    }

    // Override functions (required by Solidity) for inheritence and compatibility with OpenZeppelin contracts
    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721URIStorage, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}