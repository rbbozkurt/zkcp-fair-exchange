// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

// The escrow contract is responsible for holding funds, and handling the transfer of funds between parties

contract Escrow {

    struct Purchase {
        address buyer;
        address seller;
        uint256 amount;
    bool isComplete; // will get more detailed using states
    }

    mapping(uint256 => Purchase) public purchases;
    uint256 public nextPurchaseId;

    event PurchaseCreated(uint256 purchaseId, address buyer, address seller, uint256 amount);
    event PaymentMade(uint256 purchaseId, address buyer);
    event DatasetDelivered(uint256 purchaseId, address seller);
    event PurchaseCompleted(uint256 purchaseId);
    event RefundIssued(uint256 purchaseId, address buyer);


    constructor() {
        nextPurchaseId = 1; // start from 1
    }

    function createPurchase(address seller, string memory datasetInfo) public payable returns (uint256) {
        require(msg.value > 0, "Amount must be greater than 0");
        require(seller != address(0), "Seller address cannot be zero");
        require(seller != msg.sender, "Buyer cannot be the seller");
        require(bytes(datasetInfo).length > 0, "Dataset information must be provided");

        uint256 purchaseId = nextPurchaseId++;

        purchases[purchaseId] = Purchase({
            buyer: msg.sender,
            seller: seller,
            amount: msg.value,
            isComplete: false
        });

        emit PurchaseCreated(purchaseId, msg.sender, seller, msg.value);
        return purchaseId;
    }

    function makePayment(uint256 purchaseId) public payable {
        Purchase storage purchase = purchases[purchaseId];
        require(purchase.buyer == msg.sender, "Only the buyer can make a payment");
        require(!purchase.isComplete, "Purchase is already complete");
        require(msg.value == purchase.amount, "Incorrect payment amount");

        emit PaymentMade(purchaseId, msg.sender);
    }

    function deliverDataset(uint256 purchaseId) public {

        // this is a placeholder function, no actual dataset is being delivered right now.
        // the logic for this part will be extended to be kocaman

        Purchase storage purchase = purchases[purchaseId];
        require(purchase.seller == msg.sender, "Only the seller can deliver the dataset");
        require(!purchase.isComplete, "Purchase is already complete");

        purchase.isComplete = true;

        payable(purchase.seller).transfer(purchase.amount);

        emit DatasetDelivered(purchaseId, msg.sender);
        emit PurchaseCompleted(purchaseId);
    }

    function issueRefund(uint256 purchaseId) public {

        // for the moment this function works just like the deliverDataset(), the only diff is that the funds are sent to the buyer instead of the seller
        // this should also be extended to happen in certain conditions, like dataset not delivered (in time), zk proof not verified, etc.

        Purchase storage purchase = purchases[purchaseId];
        require(purchase.buyer == msg.sender, "Only the buyer can request a refund");
        require(!purchase.isComplete, "Purchase is already complete");

        purchase.isComplete = true;

        payable(purchase.buyer).transfer(purchase.amount);

        emit RefundIssued(purchaseId, msg.sender);
    }

    // getter functions
    
    function getPurchase(uint256 purchaseId) public view returns (address buyer, address seller, uint256 amount, bool isComplete) {
        Purchase storage purchase = purchases[purchaseId];
        return (purchase.buyer, purchase.seller, purchase.amount, purchase.isComplete);
    }
    function getNextPurchaseId() public view returns (uint256) {
        return nextPurchaseId;
    }
    function getBalance() public view returns (uint256) {
        return address(this).balance;
    }

}