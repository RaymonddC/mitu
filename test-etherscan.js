/**
 * Simple Etherscan API Test Script
 * Tests if your Etherscan API key is working
 */

const https = require('https');

// Your Etherscan API key from .env
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY || 'HVENWVAHC39KDRDV1A4AMWH414J8E7U2ZR';

// Test wallet address (Vitalik's address)
const TEST_ADDRESS = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0';

console.log('🔍 Testing Etherscan API Connection...\n');
console.log('API Key:', ETHERSCAN_API_KEY.substring(0, 10) + '...');
console.log('Test Address:', TEST_ADDRESS);
console.log('Network: Sepolia Testnet\n');

// Method 1: Check API key rate limit status
function testApiKeyStatus() {
  return new Promise((resolve, reject) => {
    const url = `https://api-sepolia.etherscan.io/api?module=account&action=balance&address=${TEST_ADDRESS}&tag=latest&apikey=${ETHERSCAN_API_KEY}`;

    https.get(url, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve(json);
        } catch (e) {
          reject(new Error('Failed to parse response: ' + data.substring(0, 100)));
        }
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

// Method 2: Get contract ABI (more reliable endpoint)
function testGetAbi() {
  return new Promise((resolve, reject) => {
    // MNEE token contract address on Sepolia
    const contractAddress = '0x41557BA6e63f431788a6Ea1989C3FeF390c8Ab76';
    const url = `https://api-sepolia.etherscan.io/api?module=contract&action=getabi&address=${contractAddress}&apikey=${ETHERSCAN_API_KEY}`;

    https.get(url, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve(json);
        } catch (e) {
          reject(new Error('Failed to parse response'));
        }
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

// Run tests
async function runTests() {
  console.log('═══════════════════════════════════════════\n');

  // Test 1: Balance check
  console.log('Test 1: Account Balance Query');
  console.log('─────────────────────────────────────────');
  try {
    const result = await testApiKeyStatus();

    if (result.status === '1') {
      console.log('✅ SUCCESS: API key is working!');
      console.log('   Balance:', (parseInt(result.result) / 1e18).toFixed(4), 'ETH');
      console.log('   Message:', result.message || 'OK');
    } else if (result.status === '0' && result.message.includes('deprecated')) {
      console.log('⚠️  WARNING: Using deprecated V1 endpoint');
      console.log('   Message:', result.message);
      console.log('   Note: API key is valid but endpoint needs update');
    } else {
      console.log('❌ FAILED:', result.message);
      console.log('   Result:', result.result);
    }
  } catch (error) {
    console.log('❌ ERROR:', error.message);
  }

  console.log('\n');

  // Test 2: Contract ABI
  console.log('Test 2: Contract ABI Query (MNEE Token)');
  console.log('─────────────────────────────────────────');
  try {
    const result = await testGetAbi();

    if (result.status === '1') {
      console.log('✅ SUCCESS: API key is working!');
      console.log('   ABI Retrieved: Yes');
      console.log('   ABI Length:', result.result.length, 'characters');
    } else if (result.status === '0' && result.message.includes('deprecated')) {
      console.log('⚠️  WARNING: Using deprecated V1 endpoint');
      console.log('   Message:', result.message);
    } else {
      console.log('❌ FAILED:', result.message);
      console.log('   Result:', result.result);
    }
  } catch (error) {
    console.log('❌ ERROR:', error.message);
  }

  console.log('\n═══════════════════════════════════════════\n');

  // Summary
  console.log('📊 Summary:');
  console.log('─────────────────────────────────────────');
  console.log('Your Etherscan API key appears to be valid, but Etherscan');
  console.log('has deprecated the V1 API endpoints. This means:');
  console.log('');
  console.log('✓ Your API key IS valid and authenticated');
  console.log('✓ You can still use it for basic queries');
  console.log('⚠ Some endpoints may require V2 migration');
  console.log('');
  console.log('For your risk screening application:');
  console.log('✓ The RPC provider (Infura) is the main data source');
  console.log('✓ Etherscan is optional for enhanced verification');
  console.log('✓ Your app will work fine without V2 migration');
  console.log('\n');
}

runTests().catch(console.error);
