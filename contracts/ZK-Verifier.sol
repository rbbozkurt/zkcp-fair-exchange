// Updated ZKVerifier.sol with RISC Zero integration

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./risc0/IRiscZeroVerifier.sol";

contract ZKVerifier {
    IRiscZeroVerifier public immutable verifier;
    bytes32 public immutable imageId; // RISC Zero program image ID
    
    // Events for verification tracking
    event ProofVerified(bytes32 indexed proofHash, address indexed verifier, bool success);
    event ProofVerificationFailed(bytes32 indexed proofHash, string reason);
    
    constructor(IRiscZeroVerifier _verifier, bytes32 _imageId) {
        verifier = _verifier;
        imageId = _imageId;
    }
    
    function verifyProof(bytes calldata seal, bytes calldata journal) 
        external 
        returns (bool success) 
    {
        require(seal.length > 0, "Empty proof seal");
        require(journal.length > 0, "Empty journal");
        
        try verifier.verify(seal, imageId, sha256(journal)) {
            // Proof verification successful
            bytes32 proofHash = keccak256(abi.encodePacked(seal, journal));
            emit ProofVerified(proofHash, msg.sender, true);
            return true;
        } catch Error(string memory reason) {
            // Verification failed with specific reason
            bytes32 proofHash = keccak256(abi.encodePacked(seal, journal));
            emit ProofVerificationFailed(proofHash, reason);
            return false;
        } catch {
            // Verification failed with unknown reason
            bytes32 proofHash = keccak256(abi.encodePacked(seal, journal));
            emit ProofVerificationFailed(proofHash, "Unknown verification error");
            return false;
        }
    }
    

    function verifyProofWithData(bytes calldata seal, bytes calldata journal) 
        external 
        returns (bool success, bytes32 dataHash, bytes32 buyerPubkeyHash) 
    {
        require(seal.length > 0, "Empty proof seal");
        require(journal.length >= 64, "Journal too short"); // At least 2 hashes
        
        try verifier.verify(seal, imageId, sha256(journal)) {
            // Extract public data from journal
            dataHash = bytes32(journal[0:32]);
            buyerPubkeyHash = bytes32(journal[32:64]);
            
            bytes32 proofHash = keccak256(abi.encodePacked(seal, journal));
            emit ProofVerified(proofHash, msg.sender, true);
            return (true, dataHash, buyerPubkeyHash);
        } catch Error(string memory reason) {
            bytes32 proofHash = keccak256(abi.encodePacked(seal, journal));
            emit ProofVerificationFailed(proofHash, reason);
            return (false, bytes32(0), bytes32(0));
        } catch {
            bytes32 proofHash = keccak256(abi.encodePacked(seal, journal));
            emit ProofVerificationFailed(proofHash, "Unknown verification error");
            return (false, bytes32(0), bytes32(0));
        }
    }
}