# 🚫 Blocked Wallet Addresses

Complete list of wallet addresses that are **automatically blocked** by your risk screening system.

---

## Summary

- **Total Blocked Addresses**: 26
- **OFAC Sanctioned**: 14 addresses
- **Tornado Cash**: 10 addresses
- **Known Scam Addresses**: 2 addresses

---

## 1. OFAC Sanctioned Addresses (14)

These addresses are sanctioned by the U.S. Office of Foreign Assets Control (OFAC).

### Lazarus Group (North Korea) - 6 addresses
```
0x8576acc5c05d6ce88f4e49bf65bdf0c62f91353c
0x722122df12d4e14e13ac3b6895a86e84145b6967
0xdd4c48c0b24039969fc16d1cdf626eab821d3384
0xd90e2f925da726b50c4ed8d0fb90ad053324f31b
0xd96f2b1c14db8458374d9aca76e26319445881fb
0x4736dcf1b7a3d580672cce6e7c65cd5cc9cfba9d
```

### Tornado Cash (OFAC Sanctioned) - 5 addresses
```
0x9f4cda013e354b8fc285bf4b9a60460cee7f7ea9
0x23773e65ed146a459791799d01336db287f25334
0xd47438c816c9e7f2e2888e060936a499af9582b3
0x330bdfade01ee9bf63c209ee33102dd334618e0a
0x1e34a77868e19a6647b1f2f47b51ed72dede95dd
```

### Ronin Bridge Exploiter - 2 addresses
```
0x242654336ca2205714071898f67e254eb49acdce
0x098b716b8aaf21512996dc57eb0615e2383e2f96
```

### North Korea (Blender.io) - 1 address
```
0xa0e1c89ef1a489c9c7de96311ed5ce5d32c20e4b
```

**Source**: [OFAC Recent Actions - Nov 8, 2022](https://home.treasury.gov/policy-issues/financial-sanctions/recent-actions/20221108)

---

## 2. Tornado Cash Protocol Addresses (10)

These are smart contract addresses for the Tornado Cash mixing protocol.

```
0x12d66f87a04a9e220743712ce6d9bb1b5616b8fc
0x47ce0c6ed5b0ce3d3a51fdb1c52dc66a7c3c2936
0x910cbd523d972eb0a6f4cae4618ad62622b39dbf
0xa160cdab225685da1d56aa342ad8841c3b53f291
0xf60dd140cff0706bae9cd734ac3ae76ad9ebc32a
0x22aaa7720ddd5388a3c0a3333430953c68f1849b
0xba214c1c1928a32bffe790263e38b4af9bfcd659
0xb1c8094b234dce6e03f10a5b673c1d8c69739a00
0x527653ea119f3e6a1f5bd18fbf4714081d7b31ce
0x58e8dcc13be9780fc42e8723d8ead4cf46943df2
```

**Note**: Your system also checks for **interactions** with these addresses, not just direct ownership.

---

## 3. Known Scam Addresses (2)

Common addresses used in scam operations.

```
0x0000000000000000000000000000000000000000  # Null address (common in scams)
0x000000000000000000000000000000000000dead  # Burn address
```

---

## 📋 Complete List (All 26 Addresses)

### For Easy Copy-Paste Testing:

```json
[
  "0x8576acc5c05d6ce88f4e49bf65bdf0c62f91353c",
  "0x722122df12d4e14e13ac3b6895a86e84145b6967",
  "0xdd4c48c0b24039969fc16d1cdf626eab821d3384",
  "0xd90e2f925da726b50c4ed8d0fb90ad053324f31b",
  "0xd96f2b1c14db8458374d9aca76e26319445881fb",
  "0x4736dcf1b7a3d580672cce6e7c65cd5cc9cfba9d",
  "0x9f4cda013e354b8fc285bf4b9a60460cee7f7ea9",
  "0x23773e65ed146a459791799d01336db287f25334",
  "0xd47438c816c9e7f2e2888e060936a499af9582b3",
  "0x330bdfade01ee9bf63c209ee33102dd334618e0a",
  "0x1e34a77868e19a6647b1f2f47b51ed72dede95dd",
  "0x242654336ca2205714071898f67e254eb49acdce",
  "0x098b716b8aaf21512996dc57eb0615e2383e2f96",
  "0xa0e1c89ef1a489c9c7de96311ed5ce5d32c20e4b",
  "0x12d66f87a04a9e220743712ce6d9bb1b5616b8fc",
  "0x47ce0c6ed5b0ce3d3a51fdb1c52dc66a7c3c2936",
  "0x910cbd523d972eb0a6f4cae4618ad62622b39dbf",
  "0xa160cdab225685da1d56aa342ad8841c3b53f291",
  "0xf60dd140cff0706bae9cd734ac3ae76ad9ebc32a",
  "0x22aaa7720ddd5388a3c0a3333430953c68f1849b",
  "0xba214c1c1928a32bffe790263e38b4af9bfcd659",
  "0xb1c8094b234dce6e03f10a5b673c1d8c69739a00",
  "0x527653ea119f3e6a1f5bd18fbf4714081d7b31ce",
  "0x58e8dcc13be9780fc42e8723d8ead4cf46943df2",
  "0x0000000000000000000000000000000000000000",
  "0x000000000000000000000000000000000000dead"
]
```

---

## 🧪 Testing These Addresses

### Test in Your Application:

1. Go to http://localhost:3000
2. Navigate to **Employees** page
3. Click **"Add Employee"**
4. Try entering any of these addresses in the wallet field
5. You should see:
   - 🔴 **Red border** on the input
   - 🚫 **"Cannot Add Employee"** message
   - **Risk Badge** showing "Critical Risk" or "High Risk"
   - **Submit button disabled**

### Test via API:

```bash
# Test OFAC Sanctioned (Lazarus Group)
curl -X POST http://localhost:3001/api/risk/screen \
  -H "Content-Type: application/json" \
  -d '{"address":"0x098b716b8aaf21512996dc57eb0615e2383e2f96"}'

# Expected Result:
# {
#   "success": true,
#   "data": {
#     "riskLevel": "critical",
#     "action": "block",
#     "finalScore": 100,
#     "breakdown": {
#       "sanctions": {
#         "isSanctioned": true,
#         "riskScore": 100,
#         "reason": "OFAC Sanctioned Address"
#       }
#     }
#   }
# }
```

---

## 🛡️ How the Blocking Works

### Detection Methods:

1. **Direct Match**: Wallet address exactly matches a sanctioned address
   - Result: **100 risk score** → **BLOCK**

2. **Tornado Cash Interaction**: Wallet has sent/received from Tornado Cash
   - Result: **High risk score** → **BLOCK** or **WARN**

3. **Pattern Matching**: Wallet shows scam-like behavior
   - Result: Variable risk score based on patterns

### Risk Scoring:

```
Risk Score   | Risk Level | Action  | Can Add Employee?
-------------|------------|---------|------------------
0-30         | Low        | Proceed | ✅ Yes
31-60        | Medium     | Warn    | ⚠️ Yes (with warning)
61-80        | High       | Warn    | ⚠️ Yes (with warning)
81-100       | Critical   | Block   | 🚫 NO
Sanctioned   | Critical   | Block   | 🚫 NO
```

---

## 📍 Where These Lists Are Defined

### Backend Code Locations:

**OFAC Sanctioned Addresses:**
- File: `backend/src/services/sanctionsChecker.ts`
- Lines: 48-63
- Method: `loadOFACList()`

**Tornado Cash Addresses:**
- File: `backend/src/types/risk.types.ts`
- Lines: 124-135
- Constant: `TORNADO_CASH_ADDRESSES`

**Scam Addresses:**
- File: `backend/src/services/sanctionsChecker.ts`
- Lines: 77-80
- Method: `loadScamList()`

---

## ⚠️ Important Notes

### Case Insensitive:
All addresses are normalized to **lowercase** before checking, so these will also be blocked:
```
0x098B716B8Aaf21512996dC57EB0615e2383E2f96  ← Mixed case
0X098B716B8AAF21512996DC57EB0615E2383E2F96  ← Uppercase
```

### Cached Results:
- Sanctions checks are **cached for 24 hours**
- Once a wallet is checked, the result is stored
- Cache key format: `sanctions_{address}`

### Production Considerations:
The code comments indicate that in production, you should:
1. Fetch OFAC list from official API
2. Integrate with CryptoScamDB or Chainabuse
3. Update lists regularly (daily recommended)

---

## 🔍 Additional Detection

Your system also detects:

### Scam Contract Patterns:
- Functions: `SecurityUpdate()`, `ClaimReward()`, `Verify()`
- Contract names: `SecurityUpdate`, `ClaimAirdrop`, `VerifyWallet`

### Suspicious Transaction Patterns:
- Burst activity (many txs in short time)
- Interactions with unverified contracts
- Large balance with minimal activity
- Very new wallets (<7 days old)

---

## 📊 Real-World Examples

### Example 1: Ronin Bridge Exploiter
```
Address: 0x098b716b8aaf21512996dc57eb0615e2383e2f96
Amount Stolen: $625 million (March 2022)
Status: OFAC Sanctioned
Your System: ✅ BLOCKED
```

### Example 2: Lazarus Group
```
Address: 0x722122df12d4e14e13ac3b6895a86e84145b6967
Entity: North Korean state-sponsored hackers
Status: OFAC Sanctioned
Your System: ✅ BLOCKED
```

### Example 3: Tornado Cash
```
Addresses: 10 smart contracts
Purpose: Cryptocurrency mixing/tumbling
Status: OFAC Sanctioned (Aug 2022)
Your System: ✅ BLOCKED
```

---

## 🎯 Quick Reference

### To Test Blocking:
**Use this address** (Ronin Bridge Exploiter):
```
0x098b716b8aaf21512996dc57eb0615e2383e2f96
```

### To Test Safe Wallet:
**Use this address** (vitalik.eth):
```
0xd8da6bf26964af9d7eed9e03e53415d37aa96045
```

### To Clear Cache:
```bash
curl -X POST http://localhost:3001/api/risk/cache/clear
```

---

## 📚 Resources

- [OFAC Sanctions Programs](https://home.treasury.gov/policy-issues/financial-sanctions/sanctions-programs-and-country-information)
- [Tornado Cash Sanctions](https://home.treasury.gov/news/press-releases/jy0916)
- [Ronin Bridge Hack Details](https://www.chainalysis.com/blog/ronin-bridge-hack-crypto-theft/)

---

**Last Updated**: 2026-01-06
**Total Blocked Addresses**: 26
**System Status**: ✅ Active & Protecting
