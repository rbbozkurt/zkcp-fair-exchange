// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./DatasetNFT.sol"; // Importing the DatasetNFT contract to use its functionality
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol"; // security against reentrancy attacks
import "@openzeppelin/contracts/access/AccessControl.sol"; // extended access control mechanism

// The escrow contract is responsible for holding funds, and handling the transfer of funds between parties

contract Escrow is ReentrancyGuard, AccessControl {

    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");


    // the purchase structure holds the information about each purchase
    // it includes the buyer, seller, amount, and a boolean to indicate if the purchase is complete

    DatasetNFT public datasetNFTcontract; // Reference to the DatasetNFT contract
    address public owner;



    enum PurchaseState {
        PAID,          // 0 - Payment confirmed, as buyers directly pay, this actually is the pending state
        ZK_PROOF_SUBMITTED, // 1 - Seller submitted ZK proof
        VERIFIED,      // 2- ZK proof verified successfully
        DELIVERED,     // 3 - Dataset delivered to buyer
        COMPLETED,     // 4 - Transaction completed successfully
        DISPUTED,      // 5 - Dispute raised
        REFUNDED,      // 6 - Purchase refunded
        CANCELLED      // 7 - Purchase cancelled
    }



    struct Purchase {
        address buyer;
        address seller;
        uint256 amount;
        uint256 listingTokenId; // the tokenId of the listing NFT
        string datasetInfo; // for backward compatibility
        PurchaseState state; // current state of the purchase
        uint256 stateTimestamp; // timestamp of the last state change
        bytes32 zkProofHash; // hash of the ZK proof submitted by the seller
        uint256 createdAt; // timestamp of purchase creation
        uint256 timeoutDeadline; // deadline for the current state
        string buyerPublicKey; // public key of the buyer for encryption purposes
        string encryptedSecret;

    }

    mapping(uint256 => Purchase) public purchases;
    uint256 public nextPurchaseId;

    // State timeouts (in seconds)
    uint256 public constant PAYMENT_TIMEOUT = 1 hours;
    uint256 public constant DELIVERY_TIMEOUT = 24 hours;
    uint256 public constant VERIFICATION_TIMEOUT = 2 hours;

    event PurchaseSubmitted(uint256 purchaseId, address buyer, address seller, uint256 amount);
    event PaymentMade(uint256 purchaseId, address buyer);
    event DatasetDelivered(uint256 purchaseId, address seller);
    event PurchaseCompleted(uint256 purchaseId);
    event RefundIssued(uint256 purchaseId, address buyer);

    event StateTransition(uint256 indexed purchaseId, PurchaseState fromState, PurchaseState toState);
    event ZKProofSubmitted(uint256 purchaseId, bytes32 proofHash);
    event DisputeRaised(uint256 purchaseId, address raiser, string reason);
    event PurchaseTimedOut(uint256 purchaseId, PurchaseState state);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only the owner can call this function");
        _;
    }


    // state validation modifiers
     modifier onlyInState(uint256 purchaseId, PurchaseState expectedState) {
        require(purchases[purchaseId].state == expectedState, "Invalid purchase state");
        _;
    }

    modifier onlyBuyer(uint256 purchaseId) {
        require(purchases[purchaseId].buyer == msg.sender, "Only buyer can call this function");
        _;
    }

    modifier onlySeller(uint256 purchaseId) {
        require(purchases[purchaseId].seller == msg.sender, "Only seller can call this function");
        _;
    }

    constructor() {
        nextPurchaseId = 1; // start from 1
        owner = msg.sender;

        // Setup roles
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(OPERATOR_ROLE, msg.sender);
    }

    // Function to set the DatasetNFT contract address, only callable by the owner
    function setDatasetNFTContract(address _datasetNFTAddress) public onlyOwner {
        require(_datasetNFTAddress != address(0), "Invalid DatasetNFT contract address");
        datasetNFTcontract = DatasetNFT(_datasetNFTAddress);
    }



     // function for the buyer to initiate a purchase, specifying the seller and the dataset information they want to buy
     // isComplete flag is set to false initially, indicating that the purchase is not yet complete. The flags will be more detailed later

    function submitPurchase(address seller, uint listingTokenId, string memory datasetInfo, string memory buyerPublicKey) public payable nonReentrant returns (uint256) {
        require(msg.value > 0, "Amount must be greater than 0");
        require(seller != address(0), "Seller address cannot be zero");
        require(seller != msg.sender, "Buyer cannot be the seller");
        require(bytes(datasetInfo).length > 0, "Dataset information must be provided");
        require(address(datasetNFTcontract) != address(0), "DatasetNFT contract not set");

        require(datasetNFTcontract.isListingActive(listingTokenId), "Listing is not active");
        require(datasetNFTcontract.ownerOf(listingTokenId) == seller, "Seller does not own the listing NFT");


        DatasetNFT.ListingInfo memory listingInfo = datasetNFTcontract.getListingInfo(listingTokenId);
        require(msg.value >= listingInfo.price, "Insufficient payment amount");

        uint256 purchaseId = nextPurchaseId++;

        purchases[purchaseId] = Purchase({
            buyer: msg.sender,
            seller: seller,
            amount: msg.value,
            listingTokenId: listingTokenId, // this will be set later when the listing NFT is minted
            datasetInfo: datasetInfo,
            state: PurchaseState.PAID, // Start in PAID state
            stateTimestamp: block.timestamp,
            zkProofHash: bytes32(0),
            createdAt: block.timestamp,
            timeoutDeadline: block.timestamp + DELIVERY_TIMEOUT,
            buyerPublicKey: buyerPublicKey,
            encryptedSecret: ""
        });

        emit PurchaseSubmitted(purchaseId, msg.sender, seller, msg.value);
        emit PaymentMade(purchaseId, msg.sender);
        // state transition not needed here as it's already in PAID state
        return purchaseId;
    }

    // placeholder function for the seller to submit a ZK proof
     function verifyZKProof(uint256 purchaseId) public onlyInState(purchaseId, PurchaseState.ZK_PROOF_SUBMITTED) {
        require(hasRole(OPERATOR_ROLE, msg.sender) || msg.sender == owner, "Not authorized");
        
        _transitionState(purchaseId, PurchaseState.VERIFIED, DELIVERY_TIMEOUT);
    }

    function setEncryptedSecret(uint256 purchaseId, string memory encryptedSecret) public onlySeller(purchaseId) {
         purchases[purchaseId].encryptedSecret = encryptedSecret;
    }

    // updated function that mints the dataset NFT after the payment is made
     function deliverDataset(uint256 purchaseId, string memory datasetMetadataURI) public onlySeller(purchaseId) onlyInState(purchaseId, PurchaseState.VERIFIED) nonReentrant {
        Purchase storage purchase = purchases[purchaseId];
        require(address(datasetNFTcontract) != address(0), "DatasetNFT contract not set");

        require(datasetNFTcontract.isListingActive(purchase.listingTokenId), "Listing is no longer active");
        require(datasetNFTcontract.ownerOf(purchase.listingTokenId) == msg.sender, "Seller no longer owns listing NFT");

        datasetNFTcontract.mintDatasetNFT(
            purchase.buyer,
            purchase.listingTokenId,
            datasetMetadataURI
        );

        // NOTE: not necessary to deactivate! we want to sell licences
        datasetNFTcontract.deactivateListing(purchase.listingTokenId);

        _transitionState(purchaseId, PurchaseState.DELIVERED, 0); // No timeout for delivered state

        // Auto-complete and transfer funds
        _transitionState(purchaseId, PurchaseState.COMPLETED, 0);
        payable(purchase.seller).transfer(purchase.amount);

        emit DatasetDelivered(purchaseId, msg.sender);
        emit PurchaseCompleted(purchaseId);
    }

    function issueRefund(uint256 purchaseId) public onlyBuyer(purchaseId) nonReentrant {
        Purchase storage purchase = purchases[purchaseId];
        require(purchase.state != PurchaseState.COMPLETED && purchase.state != PurchaseState.REFUNDED, "Cannot refund completed purchase");

        _transitionState(purchaseId, PurchaseState.REFUNDED, 0);
        payable(purchase.buyer).transfer(purchase.amount);

        emit RefundIssued(purchaseId, msg.sender);
    }

    function _transitionState(uint256 purchaseId, PurchaseState newState, uint256 timeoutDuration) internal {
        Purchase storage purchase = purchases[purchaseId];
        PurchaseState oldState = purchase.state;
        
        purchase.state = newState;
        purchase.stateTimestamp = block.timestamp;
        purchase.timeoutDeadline = timeoutDuration > 0 ? block.timestamp + timeoutDuration : 0;
        
        emit StateTransition(purchaseId, oldState, newState);
    }

    // would be better if this is called automatically by the frontend, but we can also call it manually
    function handleTimeout(uint256 purchaseId) public {
        Purchase storage purchase = purchases[purchaseId];
        require(block.timestamp > purchase.timeoutDeadline && purchase.timeoutDeadline > 0, "Purchase not timed out");
        
        PurchaseState currentState = purchase.state;
        
        // Auto-refund for timed out purchases
        if (currentState == PurchaseState.PAID || currentState == PurchaseState.ZK_PROOF_SUBMITTED) {
            _transitionState(purchaseId, PurchaseState.REFUNDED, 0);
            payable(purchase.buyer).transfer(purchase.amount);
            emit RefundIssued(purchaseId, purchase.buyer);
        }
        
        emit PurchaseTimedOut(purchaseId, currentState);
    }

    
    // getter functions
    function getPurchase(uint256 purchaseId) public view returns (
        address buyer, 
        address seller, 
        uint256 amount, 
        uint256 listingTokenId, 
        bool isComplete, 
        string memory datasetInfo,
        string memory buyerPublicKey,
        string memory encryptedSecret
    ) {
        Purchase storage purchase = purchases[purchaseId];
        return (
            purchase.buyer, 
            purchase.seller, 
            purchase.amount, 
            purchase.listingTokenId, 
            purchase.state == PurchaseState.COMPLETED,
            purchase.datasetInfo,
            purchase.buyerPublicKey,
            purchase.encryptedSecret
        );
    }

    function getPurchaseState(uint256 purchaseId) public view returns (
        PurchaseState state,
        uint256 stateTimestamp,
        uint256 timeoutDeadline,
        bool isTimedOut
    ) {
        Purchase storage purchase = purchases[purchaseId];
        return (
            purchase.state,
            purchase.stateTimestamp,
            purchase.timeoutDeadline,
            purchase.timeoutDeadline > 0 && block.timestamp > purchase.timeoutDeadline
        );
    }

    function getNextPurchaseId() public view returns (uint256) {
        return nextPurchaseId;
    }

    function getBalance() public view returns (uint256) {
        return address(this).balance;
    }

    function isNFTPurchase(uint256 purchaseId) public view returns (bool) {
        return purchases[purchaseId].listingTokenId > 0;
    }

    // Check if the purchase is in a terminal state (completed, refunded, or cancelled)
    // This is useful to determine if the purchase can be considered final and no further actions are needed
    function isPurchaseTerminal(uint256 purchaseId) public view returns (bool) {
        PurchaseState state = purchases[purchaseId].state;
        return state == PurchaseState.COMPLETED || state == PurchaseState.REFUNDED || state == PurchaseState.CANCELLED;
    }
}