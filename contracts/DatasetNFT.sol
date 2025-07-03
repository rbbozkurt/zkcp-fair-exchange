// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

// simple ERC721 contract for Dataset NFTs

contract DatasetNFT is ERC721 {
    constructor() ERC721("DatasetNFT", "DNFT") {}
}