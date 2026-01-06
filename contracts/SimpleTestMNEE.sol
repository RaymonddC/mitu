// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title SimpleTestMNEE
 * @dev Simplified Test MNEE Token for Hackathon (No OpenZeppelin dependency)
 * 
 * Use this for quick deployment on Sepolia testnet via Remix
 * Simulates MNEE USD-backed stablecoin for testing
 */
contract SimpleTestMNEE {
    string public name = "Test MNEE USD Stablecoin";
    string public symbol = "MNEE";
    uint8 public decimals = 18;
    uint256 public totalSupply;
    
    address public owner;
    
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;
    
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
    event Mint(address indexed to, uint256 amount);
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }
    
    constructor() {
        owner = msg.sender;
        // Mint 10,000 MNEE to deployer for testing
        _mint(msg.sender, 10000 * 10**decimals);
    }
    
    function transfer(address to, uint256 amount) public returns (bool) {
        require(balanceOf[msg.sender] >= amount, "Insufficient balance");
        balanceOf[msg.sender] -= amount;
        balanceOf[to] += amount;
        emit Transfer(msg.sender, to, amount);
        return true;
    }
    
    function approve(address spender, uint256 amount) public returns (bool) {
        allowance[msg.sender][spender] = amount;
        emit Approval(msg.sender, spender, amount);
        return true;
    }
    
    function transferFrom(address from, address to, uint256 amount) public returns (bool) {
        require(balanceOf[from] >= amount, "Insufficient balance");
        require(allowance[from][msg.sender] >= amount, "Insufficient allowance");
        
        balanceOf[from] -= amount;
        balanceOf[to] += amount;
        allowance[from][msg.sender] -= amount;
        
        emit Transfer(from, to, amount);
        return true;
    }
    
    // Mint function for testing (owner only)
    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }
    
    // Internal mint function
    function _mint(address to, uint256 amount) internal {
        totalSupply += amount;
        balanceOf[to] += amount;
        emit Transfer(address(0), to, amount);
        emit Mint(to, amount);
    }
    
    // Helper: Mint to yourself
    function mintToSelf(uint256 amount) public onlyOwner {
        _mint(msg.sender, amount);
    }
    
    // Helper: Get balance in human-readable format (with decimals)
    function balanceOfReadable(address account) public view returns (uint256) {
        return balanceOf[account] / 10**decimals;
    }
}
