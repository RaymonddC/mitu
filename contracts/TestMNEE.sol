// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title TestMNEE
 * @dev Test MNEE Token for Hackathon Development
 * Simulates the official MNEE USD-backed stablecoin on Sepolia testnet
 * 
 * Features:
 * - Mintable by owner (for testing)
 * - Standard ERC-20 interface
 * - 18 decimals (like official MNEE)
 * 
 * Deploy this on Sepolia testnet for hackathon testing
 */
contract TestMNEE is ERC20, Ownable {
    
    constructor() ERC20("Test MNEE USD Stablecoin", "MNEE") Ownable(msg.sender) {
        // Mint initial supply to deployer (for testing)
        // 1000 MNEE = 1000 USD equivalent (testnet only!)
        _mint(msg.sender, 1000 * 10**decimals());
    }
    
    /**
     * @dev Mint new tokens (only owner)
     * For testing purposes - simulates getting MNEE from faucet
     */
    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }
    
    /**
     * @dev Mint MNEE to yourself (convenient for testing)
     */
    function mintToSelf(uint256 amount) public onlyOwner {
        _mint(msg.sender, amount);
    }
    
    /**
     * @dev Burn tokens (for testing edge cases)
     */
    function burn(uint256 amount) public {
        _burn(msg.sender, amount);
    }
    
    /**
     * @dev Get token info
     */
    function getInfo() public view returns (
        string memory tokenName,
        string memory tokenSymbol,
        uint8 tokenDecimals,
        uint256 totalTokenSupply
    ) {
        return (
            name(),
            symbol(),
            decimals(),
            totalSupply()
        );
    }
}
