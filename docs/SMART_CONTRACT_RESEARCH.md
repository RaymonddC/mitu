# Smart Contract Spending Limits on MNEE/BSV - Research Report

**Date:** January 2025
**Question:** Can we implement smart contract-based spending limits for automated payroll on MNEE/BSV?
**Answer:** **YES, but with caveats** - Technically feasible but requires custom development.

---

## 📋 Executive Summary

After researching BSV blockchain capabilities, sCrypt smart contract framework, and MNEE's 1Sat Ordinals infrastructure, here's what we found:

| Capability | Status | Notes |
|------------|--------|-------|
| **Smart Contracts on BSV** | ✅ Fully Supported | Via sCrypt TypeScript DSL |
| **Stateful Contracts** | ✅ Supported | Can maintain state across transactions |
| **1Sat Ordinals + Smart Contracts** | ✅ Compatible | Ordinals can be locked in any script |
| **Time Locks** | ✅ Supported | OP_CLTV (absolute), OP_CSV (relative) |
| **Spending Policies** | ✅ Possible | Multisig + threshold examples exist |
| **Ready-Made Spending Limit Contract** | ❌ Not Found | Would need custom development |
| **Monthly Budget with Auto-Reset** | ⚠️ Complex | Possible but non-trivial |

**Verdict:** Smart contract spending limits ARE technically possible on MNEE/BSV, but there's no out-of-the-box solution. Would require 2-4 weeks of custom sCrypt development.

---

## 🔍 Research Findings

### 1. BSV Smart Contract Infrastructure

#### sCrypt Language
```typescript
// sCrypt is a TypeScript-based DSL for Bitcoin smart contracts
class PayrollVault extends SmartContract {
  @prop()
  owner: PubKey;

  @prop(true)  // Stateful property
  monthlyLimit: bigint;

  @prop(true)
  spentThisMonth: bigint;

  @method()
  public executePayroll(amount: bigint, sig: Sig) {
    // Custom logic here
  }
}
```

**Key Facts:**
- ✅ TypeScript-based (familiar syntax)
- ✅ Compiles to Bitcoin Script
- ✅ Official language endorsed by Bitcoin Association
- ✅ 80+ example contracts in boilerplate
- ✅ Fully functional on BSV

**Source:** https://docs.scrypt.io/bsv-docs/overview/

---

### 2. Stateful Contract Capabilities

BSV smart contracts CAN maintain state across transactions:

**Example: Stateful Multisig Contract**
```typescript
class MultiSig extends SmartContract {
  @prop(true)
  signaturesCollected: FixedArray<boolean, 3>;  // State persists!

  @method()
  public addSignature(sig: Sig, index: number) {
    // Validate signature
    assert(this.checkSig(sig, this.pubKeys[index]));

    // Update state
    this.signaturesCollected[index] = true;

    // Update output with new state
    let outputs = this.buildStateOutput(this.ctx.utxo.value);
    assert(this.ctx.hashOutputs == hash256(outputs));
  }
}
```

**How State Works:**
1. Contract deployed with initial state (e.g., `spentThisMonth = 0`)
2. When called, contract reads current state
3. Contract validates conditions
4. If valid, updates state and creates new UTXO with updated state
5. Old UTXO consumed, new UTXO created

**This is like Ethereum state but using UTXO model!**

**Source:** https://scryptplatform.medium.com/stateful-multisig-on-bitcoin-f3bb40a7f065

---

### 3. Time Lock Support

BSV supports time-based constraints:

```typescript
// Absolute time lock (OP_CLTV)
@method()
public unlock(sig: Sig) {
  // Can only be unlocked after specific date
  assert(this.ctx.locktime >= 1704067200n); // Jan 1, 2024
  assert(this.checkSig(sig, this.owner));
}

// Relative time lock (OP_CSV)
@method()
public unlockAfter30Days() {
  // Can only unlock 30 days after UTXO creation
  assert(this.ctx.sequence >= 30n * 144n); // ~30 days in blocks
}
```

**Implication:** We could implement monthly resets using time locks!

**Source:** BSV blockchain documentation

---

### 4. 1Sat Ordinals + Smart Contracts

**MNEE runs on 1Sat Ordinals protocol on BSV**

Key finding:
> "An Ordinal token can be locked into any script, meaning the token can be controlled by any smart contract"

**This means MNEE tokens CAN be controlled by spending limit contracts!**

**Examples of 1Sat Ordinals + Contracts:**
- Permissioned ordinals (transfers require issuer approval)
- Atomic swaps (trustless token sales)
- Escrow contracts
- Auction mechanisms

**Source:** https://coingeek.com/integrate-ordinals-with-smart-contracts-on-bitcoin-part-1/

---

### 5. Available Contract Examples

From sCrypt boilerplate (80+ contracts):

| Contract Type | Relevance | Notes |
|---------------|-----------|-------|
| **Multisig** | ⭐⭐⭐⭐⭐ | Shows stateful threshold logic |
| **ERC20 Token** | ⭐⭐⭐⭐ | Shows token transfer controls |
| **Ordinal Lock** | ⭐⭐⭐⭐ | Shows how to lock ordinals in contracts |
| **Advanced Counter** | ⭐⭐⭐ | Shows state management |
| **Recurring Payments** | ⭐⭐⭐⭐⭐ | Mentioned in blog, could be similar |

**What's Missing:**
- ❌ No explicit "monthly spending limit" contract
- ❌ No "budget with auto-reset" example
- ❌ No "allowance" pattern for payroll

**Source:** https://github.com/sCrypt-Inc/boilerplate

---

### 6. BSV Covenant Capabilities

BSV has restored opcodes that enable "covenants" - contracts that restrict future spending:

**Key Capabilities:**
- **OP_CAT**: Enable complex covenant logic
- **OP_PUSH_TX**: Transaction introspection
- **Turing Completeness**: Can build finite state machines

**This means:**
```
Contract can enforce:
1. "Next transaction must send to these addresses"
2. "Amount must be less than X"
3. "Must wait Y blocks before spending"
4. "State must increment correctly"
```

**Source:** https://bitcoinops.org/en/topics/covenants/

---

## 💡 Feasibility Assessment

### Option 1: Custom sCrypt Contract (Recommended)

**What we'd build:**
```typescript
class PayrollVault extends SmartContract {
  @prop()
  owner: PubKey;

  @prop()
  employeeAddresses: FixedArray<Addr, 100>;

  @prop(true)  // Stateful
  monthlyLimit: bigint;

  @prop(true)
  spentThisMonth: bigint;

  @prop(true)
  lastResetTimestamp: bigint;

  @method()
  public executePayroll(
    recipients: FixedArray<PayrollRecipient, 50>,
    totalAmount: bigint,
    currentTime: bigint
  ) {
    // 1. Check if new month - reset if so
    if (currentTime - this.lastResetTimestamp > 30 * 24 * 60 * 60) {
      this.spentThisMonth = 0n;
      this.lastResetTimestamp = currentTime;
    }

    // 2. Check spending limit
    assert(
      this.spentThisMonth + totalAmount <= this.monthlyLimit,
      'Exceeds monthly limit'
    );

    // 3. Validate recipients are in allowed list
    for (let i = 0; i < recipients.length; i++) {
      let found = false;
      for (let j = 0; j < this.employeeAddresses.length; j++) {
        if (recipients[i].address == this.employeeAddresses[j]) {
          found = true;
        }
      }
      assert(found, 'Recipient not in employee list');
    }

    // 4. Update state
    this.spentThisMonth += totalAmount;

    // 5. Create outputs for payroll
    let outputs = this.buildPayrollOutputs(recipients);
    outputs += this.buildStateOutput(this.ctx.utxo.value - totalAmount);

    // 6. Validate outputs
    assert(this.ctx.hashOutputs == hash256(outputs));
  }

  @method()
  public withdraw(amount: bigint, sig: Sig) {
    // Owner can always withdraw full balance
    assert(this.checkSig(sig, this.owner));
  }
}
```

**Complexity:** ⭐⭐⭐ Medium
**Development Time:** 2-3 weeks
**Testing:** 1 week
**Total:** 3-4 weeks

**Pros:**
- ✅ Fully autonomous within limits
- ✅ Employer keeps full control
- ✅ No platform access to funds
- ✅ Cryptographically enforced limits

**Cons:**
- ⚠️ Requires sCrypt expertise
- ⚠️ Contract deployment & testing complexity
- ⚠️ Gas fees for state updates (though minimal on BSV)
- ⚠️ Edge cases (what if month changes mid-transaction?)

---

### Option 2: Simplified Escrow Contract

**Simpler alternative:**
```typescript
class SimplePayrollEscrow extends SmartContract {
  @prop()
  owner: PubKey;

  @prop()
  platformAddress: Addr;

  @prop()
  maxAmountPerTx: bigint;

  @method()
  public executePayroll(
    recipients: FixedArray<PayrollRecipient, 50>,
    totalAmount: bigint,
    ownerSig: Sig  // Still requires signature!
  ) {
    // Validate amount
    assert(totalAmount <= this.maxAmountPerTx, 'Exceeds per-transaction limit');

    // Validate owner signature
    assert(this.checkSig(ownerSig, this.owner));

    // Execute payroll
    let outputs = this.buildPayrollOutputs(recipients);
    assert(this.ctx.hashOutputs == hash256(outputs));
  }
}
```

**Complexity:** ⭐⭐ Simple
**Development Time:** 1 week
**Total:** 1-2 weeks

**Pros:**
- ✅ Much simpler
- ✅ Still provides limits
- ✅ Employer has control

**Cons:**
- ⚠️ Requires signature each time (not fully autonomous)
- ⚠️ No monthly tracking
- ⚠️ Just a per-transaction limit

---

### Option 3: Off-Chain Tracking + Manual Approval

**Hybrid approach (What we recommended before):**
```typescript
// Database stores budget
budget.monthlyLimit = 50000;

// When payroll due:
if (totalPayroll <= budget.monthlyLimit) {
  // Create unsigned transaction
  // Send to employer's wallet
  // Wallet auto-approves based on rules
  // Platform broadcasts
}
```

**Complexity:** ⭐ Very Simple
**Development Time:** Already in Week 2 roadmap

**Pros:**
- ✅ No smart contract development
- ✅ Works with existing MNEE SDK
- ✅ Flexible rules in wallet

**Cons:**
- ⚠️ Requires wallet extension support for auto-approve
- ⚠️ Not as cryptographically enforced

---

## 📊 Comparison Matrix

| Approach | Autonomy | Security | Complexity | Dev Time | Cost |
|----------|----------|----------|------------|----------|------|
| **Custom sCrypt Contract** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | 3-4 weeks | $$$ |
| **Simple Escrow Contract** | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐ | 1-2 weeks | $$ |
| **Off-Chain + Wallet Rules** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐ | 1 week | $ |
| **Custodial (Week 1 Plan)** | ⭐⭐⭐⭐⭐ | ⭐⭐ | ⭐ | Done | $ |

---

## 🎯 Recommendations for Your Hackathon

### For Hackathon Demo (Next 2 Weeks)

**DO:**
1. ✅ Implement Week 1 custodial platform (virtual balances)
2. ✅ Show off-chain budget tracking (Week 2 plan)
3. ✅ **Document smart contract as "Future Phase"** in pitch

**DON'T:**
4. ❌ Try to build custom sCrypt contract in 2 weeks
5. ❌ Overcomplicate the demo

### Pitch to Judges

**Script:**
```
"For our MVP, we use a custodial model with virtual balances
for ease of use and demonstration.

Our production roadmap includes THREE security tiers:

TIER 1 (Months 1-2): Wallet signing with off-chain budgets
- Employers use wallet extension
- Pre-approved monthly limits
- 95% autonomous, 100% secure

TIER 2 (Months 3-6): Smart contract spending limits
- Deploy sCrypt contract on BSV
- Cryptographically enforced budgets
- Fully autonomous AND secure
- Unique to BSV - not possible on Ethereum due to gas costs

TIER 3 (Months 6+): DAO governance
- Multi-sig treasury contracts
- Decentralized payroll approvals
- Enterprise-ready compliance

We're showing BOTH current working demo AND production vision
because we understand crypto security is paramount."
```

**Judges will be impressed that:**
- ✅ You have working demo NOW
- ✅ You understand production requirements
- ✅ You researched BSV smart contract capabilities
- ✅ You have realistic timeline for each phase
- ✅ You're not overpromising

---

### Post-Hackathon Implementation

**If you want to actually build the smart contract:**

**Phase 1: Learning (1 week)**
- Study sCrypt documentation
- Run boilerplate examples locally
- Deploy simple contracts to testnet
- Understand state management patterns

**Phase 2: Development (2 weeks)**
- Design PayrollVault contract spec
- Implement core logic
- Write comprehensive tests
- Deploy to BSV testnet

**Phase 3: Integration (1 week)**
- Integrate contract deployment into backend
- Update frontend for contract interaction
- Build transaction builder for contract calls
- Test end-to-end flow

**Phase 4: Audit & Launch (2 weeks)**
- Security audit (essential for mainnet!)
- Stress testing
- Mainnet deployment
- User documentation

**Total: 6 weeks** for production-ready smart contract implementation

---

## 🔬 Technical Limitations

### Challenges with Monthly Reset

**Problem:** How does contract know when a new month starts?

**Solution Options:**

1. **Block Height Approximation**
```typescript
// ~30 days = ~4320 blocks (144 blocks/day)
if (currentBlockHeight - lastResetBlock > 4320) {
  // Reset spending
}
```
**Issue:** Not exactly 30 days, could drift

2. **Timestamp Validation**
```typescript
// Check if month changed
if (getMonthFromTimestamp(currentTime) != getMonthFromTimestamp(lastResetTime)) {
  // Reset
}
```
**Issue:** Requires timestamp in transaction, can be slightly manipulated

3. **External Oracle**
```typescript
// Oracle provides month tick
assert(oracle.currentMonth() > lastResetMonth, 'Not new month yet');
```
**Issue:** Adds centralization, oracle dependency

**Best Practice:** Use timestamp with some tolerance, accept minor edge cases

---

### Gas/Fee Considerations

**Good news:** BSV has extremely low fees!

- Average transaction: < $0.001 (1/10th of a penny)
- State update: Still < $0.01
- Compared to Ethereum: 1000x cheaper

**This makes stateful contracts practical on BSV!**

---

### State Size Limits

sCrypt contracts have state size limits:

```typescript
// OK:
@prop(true)
spentThisMonth: bigint;  // 8 bytes

// OK:
@prop(true)
employees: FixedArray<Addr, 100>;  // ~2KB

// Problematic:
@prop(true)
transactionHistory: FixedArray<Transaction, 10000>;  // Too large!
```

**Solution:** Keep state minimal, store full history off-chain

---

## 📚 Resources for Implementation

If you decide to build the smart contract:

**Documentation:**
- sCrypt Docs: https://docs.scrypt.io/
- BSV Blockchain: https://bsvblockchain.org/
- 1Sat Ordinals: https://docs.1satordinals.com/

**Tools:**
- sCrypt Boilerplate: https://github.com/sCrypt-Inc/boilerplate
- sCrypt IDE: https://scrypt.io/
- BSV Testnet Faucet: https://faucet.bsvblockchain.org/

**Community:**
- sCrypt Discord: Official support
- BSV Developers Slack
- Stack Overflow (bsv tag)

**Example Contracts to Study:**
1. Stateful Multisig
2. ERC20 Token
3. Ordinal Lock
4. Advanced Counter

---

## ✅ Final Verdict

### Question: Can we build smart contract spending limits on MNEE/BSV?

**Answer: YES, absolutely possible!**

**But should you do it for hackathon?**
- **NO** - too complex for 2-week timeline
- Focus on working demo with clear roadmap
- Document smart contract as Phase 2/3

**Should you do it for production?**
- **YES** - BSV is perfect for this use case
- Low fees make stateful contracts practical
- sCrypt provides good developer experience
- Unique selling point vs Ethereum solutions

**Timeline:**
- Hackathon: Show vision, not implementation
- Post-hackathon: 6-week project for production

---

## 📝 Update to Roadmap

I recommend we update the `DEVELOPMENT_ROADMAP.md` to clarify:

**Week 2 Plan:**
- Focus on wallet signing prototype (as planned)
- Document smart contract as "Phase 3" roadmap
- Show judges you've researched it thoroughly

**Pitch Deck Should Include:**
```
Phase 1 (NOW): Custodial MVP - ✅ Done
Phase 2 (Months 1-2): Wallet signing - 🏗️ In Progress
Phase 3 (Months 3-6): Smart contract limits - 📋 Researched
Phase 4 (Months 6+): DAO governance - 🔮 Vision
```

This shows technical depth without overcommitting!

---

## 🎤 Answering Judge Questions

**Judge: "Can users maintain custody of funds while getting automation?"**

**You:** "Yes! We have three approaches, each with different trade-offs:

1. SHORT TERM: Wallet auto-approve rules - works today, 95% autonomous

2. MEDIUM TERM: BSV smart contracts - fully autonomous AND secure
   - We've researched sCrypt framework
   - Stateful contracts can enforce monthly limits
   - BSV's low fees make this practical (unlike Ethereum)
   - 6-week implementation timeline

3. LONG TERM: DAO-style multi-sig contracts for enterprises

We're showing the vision AND realistic implementation path."

**Judge: "Why not use Ethereum?"**

**You:** "Ethereum gas fees make stateful contracts prohibitively expensive:
- Ethereum: $5-50 per payroll execution
- BSV: $0.001 per payroll execution
- For monthly payroll, BSV is 5000x cheaper

Plus, MNEE's instant settlement (< 1 second) beats Ethereum's
12-second block time. We chose BSV specifically for payroll use case."

---

## 🚀 Conclusion

Smart contract spending limits on MNEE/BSV are:
- ✅ Technically feasible
- ✅ Practically viable (low fees)
- ✅ Well-documented (sCrypt)
- ⚠️ Requires custom development (2-4 weeks)
- ⚠️ Too complex for hackathon deadline

**Recommendation:** Document thoroughly, implement post-hackathon.

---

**Research Completed:** January 2025
**Researcher:** Development Team
**Status:** Smart contracts are viable for production Phase 3
**Next Steps:** Focus on Week 1-2 roadmap, pitch smart contracts as future enhancement
