# Deploy Your Own Test MNEE Token on Sepolia

**Time Required:** 10 minutes  
**Cost:** FREE (uses testnet)  
**Difficulty:** Easy

---

## 🎯 Why Deploy Your Own Token?

If you can't get test MNEE tokens from the official team, you can deploy your own test version! This is a **perfectly valid hackathon approach**.

**Benefits:**
- ✅ Full control over token supply
- ✅ Can mint tokens anytime you need
- ✅ Same ERC-20 interface as official MNEE
- ✅ Demonstrates smart contract deployment skills
- ✅ No waiting for official team response

---

## 📋 Requirements

### 1. Sepolia Testnet ETH (FREE)
Get 0.1 Sepolia ETH from any faucet:
- **Alchemy:** https://www.alchemy.com/faucets/ethereum-sepolia
- **Chainlink:** https://faucets.chain.link/sepolia
- **QuickNode:** https://faucet.quicknode.com/ethereum/sepolia

Send to your platform wallet: `0xDc1Df96F96d9EEbf912871DDfd5F86461435b641`

### 2. MetaMask
- Switch to Sepolia Testnet network
- Import your platform wallet private key (from `scripts/generate-eth-wallets.ts`)

### 3. Remix IDE
- No installation needed
- Works in browser: https://remix.ethereum.org/

---

## 🚀 Deployment Steps

### Step 1: Open Remix IDE

1. Go to https://remix.ethereum.org/
2. Click "New File" in the file explorer
3. Name it: `TestMNEE.sol`

### Step 2: Paste Contract Code

Copy the contract code from: `contracts/SimpleTestMNEE.sol`

Or use this simplified version:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

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
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }
    
    constructor() {
        owner = msg.sender;
        // Mint 10,000 MNEE to deployer
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
    
    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }
    
    function _mint(address to, uint256 amount) internal {
        totalSupply += amount;
        balanceOf[to] += amount;
        emit Transfer(address(0), to, amount);
    }
}
```

### Step 3: Compile Contract

1. Click "Solidity Compiler" tab (left sidebar)
2. Select compiler version: `0.8.20` or higher
3. Click "Compile TestMNEE.sol"
4. Wait for green checkmark ✅

### Step 4: Deploy to Sepolia

1. Click "Deploy & Run Transactions" tab (left sidebar)
2. **Environment:** Select "Injected Provider - MetaMask"
3. MetaMask will popup → Connect and select Sepolia network
4. **Account:** Should show your platform wallet address
5. **Contract:** Select "SimpleTestMNEE"
6. Click **"Deploy"** button (orange)
7. MetaMask will popup → **Confirm transaction**
8. Wait 10-30 seconds for deployment

### Step 5: Copy Contract Address

Once deployed, you'll see the contract in "Deployed Contracts" section:
1. Copy the contract address (starts with 0x...)
2. **Save this address!** You'll need it for your backend

Example: `0x1234567890123456789012345678901234567890`

---

## 🔧 Update Your Backend Configuration

### 1. Update `.env` File

```bash
# backend/.env

# Replace with YOUR deployed token address
MNEE_TOKEN_ADDRESS="0xYOUR_DEPLOYED_CONTRACT_ADDRESS_HERE"

# Keep Sepolia testnet
ETHEREUM_CHAIN_ID=11155111
ETHEREUM_RPC_URL="https://sepolia.infura.io/v3/YOUR_INFURA_KEY"

# Your platform wallet (already configured)
PLATFORM_WALLET_ADDRESS="0xDc1Df96F96d9EEbf912871DDfd5F86461435b641"
PLATFORM_PRIVATE_KEY="YOUR_PRIVATE_KEY_HERE"

# Set to false for real blockchain testing
MOCK_MODE=false
```

### 2. Restart Backend

```bash
cd backend
npm run dev
```

---

## 💰 Mint More Tokens (When Needed)

You deployed with 10,000 MNEE, but you can mint more anytime!

### Method 1: Via Remix IDE

1. In Remix, find your deployed contract
2. Expand the contract functions
3. Find `mint` function
4. Enter:
   - `to`: `0xDc1Df96F96d9EEbf912871DDfd5F86461435b641`
   - `amount`: `1000000000000000000` (= 1 MNEE with 18 decimals)
5. Click "transact"
6. Confirm in MetaMask

### Method 2: Via Etherscan

1. Go to Sepolia Etherscan: https://sepolia.etherscan.io/
2. Search for your contract address
3. Click "Contract" tab → "Write Contract"
4. Click "Connect to Web3" → Connect MetaMask
5. Find `mint` function
6. Fill in address and amount
7. Click "Write" → Confirm in MetaMask

### Amount Calculator

MNEE uses 18 decimals, so:
- 1 MNEE = `1000000000000000000` (1 with 18 zeros)
- 10 MNEE = `10000000000000000000`
- 100 MNEE = `100000000000000000000`

**Or use JavaScript:**
```javascript
// In browser console or Node.js
const ethers = require('ethers');
ethers.parseUnits("1", 18).toString()  // Returns "1000000000000000000"
ethers.parseUnits("10", 18).toString() // Returns "10000000000000000000"
```

---

## ✅ Verify Deployment

### Check on Etherscan

1. Go to https://sepolia.etherscan.io/
2. Search for your contract address
3. You should see:
   - Contract creation transaction
   - Your token name: "Test MNEE USD Stablecoin"
   - Your balance: 10,000 MNEE

### Check in Your App

1. Start your backend: `npm run dev`
2. Your `ethereumService` will automatically use the new token address
3. Test balance check:
   ```bash
   # Should show 10,000 MNEE
   curl http://localhost:3001/api/balance/0xDc1Df96F96d9EEbf912871DDfd5F86461435b641
   ```

---

## 🎬 Testing Payroll with Your Token

Now you can test real blockchain payroll!

### 1. Fund Employee Wallets (Optional)

You can mint tokens directly to employee addresses for testing:
```
Alice: 0x402fe369CE8E21362EeC92BaB49B5B634710336e
Bob: 0x640B46B16a456Ee60fc3816A43973533155b1cb1
Carol: 0xF2207433F5B108A86fE3FA8eCC8485E0B8Ade837
```

### 2. Run Test Payroll

```bash
# Start backend
cd backend && npm run dev

# In another terminal, test payroll API
curl -X POST http://localhost:3001/api/payroll/run \
  -H "Content-Type: application/json" \
  -d '{
    "employerId": "YOUR_EMPLOYER_ID",
    "testMode": false
  }'
```

### 3. Verify on Etherscan

Check the transaction on Sepolia Etherscan:
- Go to https://sepolia.etherscan.io/
- Search for employee wallet address
- You'll see incoming MNEE transfer!

---

## 📊 Token Contract Features

Your deployed token has these functions:

### Read Functions (No gas cost)
- `name()` - Returns "Test MNEE USD Stablecoin"
- `symbol()` - Returns "MNEE"
- `decimals()` - Returns 18
- `totalSupply()` - Returns total tokens minted
- `balanceOf(address)` - Check any address balance
- `allowance(owner, spender)` - Check spending approval

### Write Functions (Costs gas)
- `transfer(to, amount)` - Send MNEE to someone
- `approve(spender, amount)` - Allow spender to use your tokens
- `transferFrom(from, to, amount)` - Transfer on behalf of someone
- `mint(to, amount)` - Create new tokens (owner only)

---

## 🎓 Hackathon Considerations

### Should You Deploy Your Own Token?

**✅ YES, if:**
- Official MNEE team hasn't responded in 24-48 hours
- You want to demonstrate smart contract deployment skills
- You need tokens NOW to finish your project
- You want full control over testing

**⚠️ MAYBE NOT, if:**
- Official team already provided tokens
- You prefer using "official" testnet contract
- Deadline is far away (wait for official response)

### Mentioning in Your Submission

If you deploy your own token, be transparent:

**In README:**
```markdown
## Testnet Deployment

Due to test token availability, I deployed my own ERC-20 test token simulating 
MNEE for development purposes.

- Test Token Contract: 0xYOUR_ADDRESS
- Network: Sepolia Testnet
- Verification: https://sepolia.etherscan.io/address/0xYOUR_ADDRESS

The implementation is fully compatible with the official MNEE ERC-20 interface 
and can be swapped to the official contract address by changing one environment 
variable.
```

**In Demo Video:**
"For testing, I deployed a test ERC-20 token simulating MNEE on Sepolia testnet. 
The system is designed to work with the official MNEE token by simply updating 
the contract address."

**Judges will appreciate:**
- ✅ Problem-solving initiative
- ✅ Smart contract deployment skills
- ✅ Proper documentation
- ✅ Clean architecture (easy to swap contracts)

---

## 🔄 Switching to Official Token Later

If you get official MNEE tokens later, switching is easy:

### Option 1: Just Update .env
```bash
# backend/.env
MNEE_TOKEN_ADDRESS="0x8ccedbAe4916b79da7F3F612EfB2EB93A2bFD6cF"  # Official address
```

Restart backend - done! ✅

### Option 2: Support Both (Advanced)
You could support both tokens in your system for maximum flexibility.

---

## 💡 Pro Tips

### 1. Deploy Early
Deploy your token NOW even if still waiting for official response. You can always switch later.

### 2. Generous Initial Supply
Deploy with 10,000+ MNEE so you don't need to mint frequently.

### 3. Document Everything
- Save contract address
- Save deployment transaction hash
- Screenshot Etherscan verification
- Include in your README

### 4. Test Thoroughly
Once deployed, test everything:
- Balance checks
- Transfers
- Approvals
- Payroll execution
- Transaction history

### 5. Gas Optimization
Sepolia ETH is free but still limited:
- Use reasonable gas limits
- Don't spam transactions
- Get more Sepolia ETH if running low

---

## 🆘 Troubleshooting

### "Insufficient funds for gas"
**Solution:** Get more Sepolia ETH from faucets

### "Transaction failed"
**Causes:**
- Wrong network (make sure you're on Sepolia)
- Insufficient gas
- Contract error

**Solution:** Check MetaMask network, increase gas limit

### "Contract not verified on Etherscan"
**Not a problem!** Your contract works fine.  
**Optional:** Verify on Etherscan for transparency (advanced)

### "Can't see token in MetaMask"
**Solution:** Add custom token:
1. MetaMask → Assets tab
2. "Import tokens"
3. Enter your contract address
4. Token should appear with balance

---

## 📞 Need Help?

- **Remix Documentation:** https://remix-ide.readthedocs.io/
- **Solidity Docs:** https://docs.soliditylang.org/
- **Etherscan Sepolia:** https://sepolia.etherscan.io/
- **OpenZeppelin (ERC-20):** https://docs.openzeppelin.com/contracts/4.x/erc20

---

## ✅ Deployment Checklist

- [ ] Got Sepolia ETH from faucet
- [ ] MetaMask connected to Sepolia network
- [ ] Opened Remix IDE
- [ ] Pasted contract code
- [ ] Compiled successfully
- [ ] Deployed contract
- [ ] Copied contract address
- [ ] Updated backend/.env with new address
- [ ] Verified on Etherscan
- [ ] Tested balance check
- [ ] Tested token transfer
- [ ] Tested payroll execution
- [ ] Documented in README
- [ ] Ready for demo! 🎉

---

**You're now in full control of your testing environment! 🚀**
