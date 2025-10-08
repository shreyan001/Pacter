

## 📦 0G WaveHack Wave 2 Updates

Test instance for escrow deployment enabling NFT-to-0G token conversion through AI-powered contract generation. Users request iNFT resolution which gives template information to be utilized via agent interface(0G Compute), receive auto-generated contracts deployed through frontend, complete dual-party signatures, and finalize asset deposits for secure escrow completion. 


### 📋 Project Information

| Component | Details |
|-----------|----------|
| **Indian Legal INFT Agent** | [`0x50AfCE3f4C6235bAbFbCD31C8Dd1693E99046705`](https://chainscan-galileo.0g.ai/address/0x50AfCE3f4C6235bAbFbCD31C8Dd1693E99046705) |
| **TEE Verifier Contract** | [`0x81bCd9AbdD3eCd4878AeB98b947f61ACa98b9288`](https://chainscan-galileo.0g.ai/address/0x81bCd9AbdD3eCd4878AeB98b947f61ACa98b9288) |
| **Minted Agent Token ID** | [Token #0](https://chainscan-galileo.0g.ai/tx/0x6b32607d05d29c4f74fa27d5666449a8e60bf93cc5366e7bbcf3708ee34ecb52) - Owner: `0x83CDBbA8359aAc6a25ACb70eb67dcF0E5eB2c607` |
| **Escrow Contract (PacterEscrowV2)** | `[To be filled - Testnet deployment pending]` |
| **Network** | 0G Newton Testnet (Chain ID: 16602) |
| **Demo Video** | `[Video Link - To be filled]` |
| **Live Demo** | `[Demo URL - To be filled]` |

---



# 🟦 Pacter – Programmable Trust Protocol

> **Autonomous agreements. Verifiable enforcement. No intermediaries.**
>
> Next.js/yarn · Powered by 0G Compute, Storage & Chain

---

## 🚀 Overview

**Pacter** enables anyone to create, manage, and enforce digital pacts using autonomous AI agents. These agents are deployed as Intelligent NFTs (INFTs) on the 0G blockchain, combining on-chain security, transparent AI-powered logic, and tamper-proof storage for digital agreements.

Whether for freelance work, domain trades, digital wagers, IP licensing, or rentals, Pacter gives everyone instant access to programmable trust—no more relying on centralized platforms or human middlemen.

---

## 📊 Architecture & Flow

![Pacter Flowchart](./public/basic-flow.png)

### **How it works at a glance:**
1. **User starts chat:** Contract terms, assets, milestones are gathered conversationally.
2. **Template selection:** The best-fit agent template is chosen: e.g., Freelance, Wager, Domain Swap, License, Rental.
3. **INFT instantiation:** ERC-7857 INFT created with dynamic, encrypted agent metadata.
4. **Agent provisioning:** TEE-secured credentials/tools, linked wallet.
5. **Evidence logging:** Every artifact to 0G Storage (with Merkle proofs for transparency).
6. **Enforcement:** AI agent validates evidence, enforces logic—all TEE-verifiable via 0G Compute.
7. **Settlement:** Funds/assets are auto-released; the INFT lifecycle continues, ready for re-use or transfer.

---

## 🛠️ **Quickstart (for Devs)**

### **1. Clone & Install**

```bash
git clone https://github.com/YOUR-ORG/pacter.git
cd pacter
yarn install
```

### **2. Environment Setup**

- Copy `.env.example` to `.env.local` and fill in required values:
  - `NEXTAUTH_SECRET=`
  - `NEXT_PUBLIC_0G_PROJECT_ID=`
  - `NEXT_PUBLIC_INF_PROVIDER_URL=`
  - `0G_CHAIN_RPC=`
  - ...see `.env.example` for details.

### **3. Start the Dev Server**

```bash
yarn dev
```

---

## 🌐 **What Pacter Enables**

- **Trustless escrow, payouts, and asset transfers.**
- **AI-enforced contract verification.**
- **Custom, templatized contract logic—deploy new agent logic without a full redeploy.**
- **Audit logs, evidence, and agent outputs are stored on-chain/off-chain with privacy and immutability.**

---

## 💡 **Hero Use Cases (Deep Dive)**

### 1. **Freelance Milestone Contracts**
- **Pain Point:** Freelancers/clients want milestone payouts without Upwork/Fiverr.
- **Pacter Solution:**  
  1. User defines milestones and evidence method (e.g., GitHub commits).
  2. Funds deposited up front in an INFT vault.
  3. AI agent checks milestones as work is submitted, releases partial payouts per milestone.
  4. All proofs/evidence are logged to 0G Storage, audit-ready.
- **Innovation:** Automated milestone validation, support for web/code/file proofs, no platform take rate.

---

### 2. **Domain/Asset Swaps**
- **Pain Point:** Safe, peer-to-peer domain transfers require costly brokers.
- **Pacter Solution:**
  1. Buyer deposits payment; seller transfers asset (domain, license, code).
  2. Agent (with oracle/plugins) verifies transfer and registry status.
  3. On success, swaps assets/funds.
- **Innovation:** Agent-controlled account (e.g., TEE-owned GitHub for code transfers), end-to-end on-chain finality.

---

### 3. **Peer-to-Peer Wagers**
- **Pain Point:** Trustless online betting usually involves custodians or opaque platforms.
- **Pacter Solution:**
  1. Any user creates a social wager (anything verifiable online).
  2. Counterparties deposit stakes into a pooled contract.
  3. Agent verifies outcome via oracle/screenshots/API and pays out winner.
  4. Wage template creators can be rewarded a protocol fee.
- **Innovation:** Extensible wager templates, open to the world, with shareable/tunable logic.

---

### 4. **Digital Licensing/Royalties**
- **Pain Point:** Managing digital rights, license expiry, and royalties is manual and often unenforced.
- **Pacter Solution:**
  1. Artists/owners mint license agents as INFTs.
  2. Agents handle access, verify usage/event triggers, and automatically split/stream royalties.
- **Innovation:** Programmable license logic, cross-market enforcement, all with audit trails.

---

### 5. **NFT/Asset Rentals**
- **Pain Point:** Borrowing/lending NFTs is risky—time-based or "return" enforcement is hard.
- **Pacter Solution:**
  1. Asset is custodied in the INFT vault for a fixed term.
  2. Renter pays; access is given/revoked via agent logic.
  3. Agent ensures timely return (or clawback)—all conditions enforced.
- **Innovation:** Time-based, automated access management, programmable for any digital property.

---

### **More Possible Verticals**
- API quota management, SaaS subscriptions, gaming rewards, hackathon bounties, group fundraising, digital event ticketing, data exchange deals, influencer marketing, online learning credentialing, etc.

---

## 🧑‍💻 **Core Technology Stack**

- **Next.js + Tailwind CSS:** Fast, modern frontend.
- **LangGraph:** Open-source agent orchestration for conversational intake and branching flows.
- **0G Compute SDK:** TEE-backed LLM/AI agent execution, inference, and audit.
- **0G Storage SDK:**  
  - **Log Layer:** Write-only event logs for full transparency.  
  - **KV Layer:** Efficient, updatable contract/session objects.
- **INFTs (ERC-7857 / thirdweb):** Tokenized, programmable agents powered by upgradable logic, workflow templates, and secure access controls.
- **EVM Contracts:** For custody, settlement, vaults, and pooled agreement types.
- **WalletConnect:** User wallet authentication and transactions.
- **IPFS:** Redundant, decentralized storage for logs/assets.

---

## 🔐 **How Does 0G Compute/Storage Enable Pacter?**

- **0G Compute:**  
  - Every mission-critical AI operation runs on encrypted TEE-nodes (enclaves).
  - Output is cryptographically attested: Users, auditors, or counterparties can always verify the output was real.
  - Supports public, fine-tuned, or custom models (OpenAI, Llama, Deepseek, etc).
  - Pay-as-you-go inference, batching, and upcoming subscription support.

- **0G Storage:**  
  - All contract metadata, agent state, user evidence, and logs live in append-only blobs or efficient key-value stores.
  - Merkle proofs and version hashes enable instant audit, historic replay, and deletion protection.
  - Sensitive files/private terms encrypted, public logs/proofs open (privacy by design).
  - Full SDKs in Go and TypeScript for dev extensibility.

---

## 🔍 **Process Flow (in Detail)**

```mermaid
flowchart TD
    A[User starts chat] --> B[Conversation Layer<br/>Collect terms, assets, milestones]
    B --> C[Template Selection<br/>Freelance, Domain Swap, Wager, License, Rental]
    C --> D[Instantiate INFT<br/>ERC-7857 with dynamic + encrypted metadata]
    D --> E[Provision Tools & Credentials<br/>TEE-secured access, wallet binding]
    E --> F[Evidence Logging<br/>Artifacts to 0G Storage w/ Merkle proofs]
    F --> G[Verification & Enforcement<br/>AI agent checks conditions<br/>TEE-verifiable inference]
    G --> H[Settlement<br/>Funds/assets released, agent/INFT lifecycle continues]
```

---

## 📈 **Development Roadmap & Achievements**

### **Wave 1: Foundation** ✅
- Robust chat onboarding with AI-powered contract generation
- Wallet connect integration (WalletConnect)
- Demo flows live (freelance contracts, escrow)
- Public, open-sourced codebase and detailed GitHub docs

### **Wave 2: Core Escrow System** ✅
- Basic escrow contract deployment on 0G testnet
- Simple milestone-based payment system
- Initial INFT agent integration
- Protocol fee structure implementation

### **Wave 3: Indian Legal Compliance & Advanced Verification** ✅

#### **Indian Freelance Legal INFT Agent**
We deployed a specialized INFT agent contract specifically designed for Indian jurisdiction freelance agreements, incorporating:

**Legal Framework Integration:**
- **Indian Contract Act, 1872** compliance
- **Information Technology Act, 2000** digital signature support
- **Arbitration & Conciliation Act, 1996** dispute resolution
- Multi-currency support: INR, Cryptocurrency (VDA), and lawful barter
- Tax compliance clauses (Section 28, Income Tax Act, 1961)
- Escrow and smart contract automation clauses
- AI-powered dispute resolution with legal fallback mechanisms

**INFT Contract Deployment (zgTestnet):**

| Contract | Address | Purpose |
|----------|---------|---------|
| **TEEVerifier** | [`0x81bCd9AbdD3eCd4878AeB98b947f61ACa98b9288`](https://chainscan-galileo.0g.ai/address/0x81bCd9AbdD3eCd4878AeB98b947f61ACa98b9288) | TEE-based proof verification for agent actions |
| **IndiaFreelanceLegalNFTImpl** | [`0x9c38E1045Cf3b499199075bbC4E438E4faF900aB`](https://chainscan-galileo.0g.ai/address/0x9c38E1045Cf3b499199075bbC4E438E4faF900aB) | Implementation contract for upgradeable INFT |
| **IndiaFreelanceLegalNFTBeacon** | [`0x2B31469af35BE50E233Df01F0944dA3203b7e456`](https://chainscan-galileo.0g.ai/address/0x2B31469af35BE50E233Df01F0944dA3203b7e456) | Beacon proxy for upgradeable pattern |
| **IndiaFreelanceLegalNFT** (Main) | [`0x50AfCE3f4C6235bAbFbCD31C8Dd1693E99046705`](https://chainscan-galileo.0g.ai/address/0x50AfCE3f4C6235bAbFbCD31C8Dd1693E99046705) | Main INFT contract for legal agent instances |

**Minted Agent Instance:**
- **Token ID:** 0
- **Owner:** `0x83CDBbA8359aAc6a25ACb70eb67dcF0E5eB2c607`
- **Transaction:** [`0x6b32607d05d29c4f74fa27d5666449a8e60bf93cc5366e7bbcf3708ee34ecb52`](https://chainscan-galileo.0g.ai/tx/0x6b32607d05d29c4f74fa27d5666449a8e60bf93cc5366e7bbcf3708ee34ecb52)
- **Status:** ✅ Active with TEE-verified proofs

**Legal Prompt Integration:**
The INFT agent uses a comprehensive legal prompt ([view source](./Pacter-NFT-main/scripts/mint/storageIntegration.ts)) that:
- Reviews and audits user-provided contracts
- Adds Indian law compliance clauses
- Incorporates payment, escrow, and dispute resolution terms
- Ensures jurisdiction-specific requirements are met
- Generates legally robust, structured agreements

**0G Compute Integration for Legal Processing:**
- **Model:** Llama-3.3-70B-Instruct (TEE-verified)
- **Provider Address:** `0xf07240Efa67755B5311bc75784a061eDB47165Dd`
- **Purpose:** Process initial contracts, add legal amendments, ensure compliance
- **Verification:** All AI inference runs in TEE (TeeML) for cryptographic attestation

### **Wave 4: Production-Grade Escrow with Full Verification** ✅

#### **Enhanced Escrow Smart Contract**
Upgraded from simple escrow to a comprehensive verification-based system:

**PacterEscrowV2 Contract:**
- **Address:** [`[To be filled]`](#)
- **GitHub:** [View Contract Source](./contracts/PacterEscrowV2.sol)
- **Features:**
  - Multi-milestone support
  - AI agent verification integration
  - Automated payment approval workflow
  - 0G Storage fee handling
  - Dispute resolution states
  - TEE-verified deliverable checking

**Contract States:**
```
PENDING → ACTIVE → VERIFIED → APPROVED → COMPLETED
                ↓
         VERIFICATION_FAILED / DISPUTED
```

#### **Complete Verification Workflow**

**1. Information Collection Stage**
- Multi-page UX for gathering project details
- AI-powered chat interface for natural contract creation
- Milestone definition with deliverable requirements
- Payment terms and escrow amount configuration

**2. Contract Generation & Signing**
- AI generates legally compliant contract using INFT agent
- Both parties review and digitally sign
- Signatures stored on-chain with timestamps
- Contract metadata uploaded to 0G Storage

**3. Escrow Deposit**
- Client deposits funds to smart contract
- Amount split: Escrow (90%) + Storage Fee (10%)
- Order hash generated for tracking
- Funds locked until verification complete

**4. Deliverable Submission & Verification**
The system implements a comprehensive verification pipeline:

**GitHub Verification Module:**
- Freelancer submits GitHub repository URL
- System verifies repository accessibility
- Checks commit history and authenticity
- Auto-detects deployment URLs from repository metadata
- Validates deployment connection to repository

**Code Download & Storage:**
- Repository cloned and packaged
- Metadata JSON created with verification details
- **Uploaded to 0G Storage** (real decentralized storage)
- Root hash and transaction hash returned
- All artifacts immutably stored

**AI Agent Verification:**
- Agent reviews code quality and completeness
- Checks against milestone requirements
- Verifies deployment matches repository
- **Signs verification on-chain** using TEE-secured wallet
- Verification details stored in smart contract

**5. Client Review & Approval**
- Client can test live deployment URL
- Reviews AI verification report
- Sees complete audit trail
- Approves payment release on-chain
- Approval triggers state change to APPROVED

**6. Freelancer Withdrawal**
- Freelancer withdraws funds from escrow
- Smart contract transfers approved amount
- Storage fees sent to 0G service wallet
- Contract state updated to COMPLETED
- All transactions recorded on-chain

#### **0G Integration Highlights**

**0G Storage Usage:**
1. **Contract Metadata Storage**
   - Legal contracts and terms
   - Party information and signatures
   - Milestone definitions

2. **Verification Artifacts**
   - GitHub repository snapshots
   - Deployment verification proofs
   - AI agent assessment reports
   - Merkle proofs for audit trail

3. **Evidence Logging**
   - All deliverable submissions
   - Client feedback and comments
   - Dispute resolution records
   - Complete transaction history

**0G Compute Usage:**
1. **Legal Contract Processing**
   - Initial contract review and enhancement
   - Indian law compliance checking
   - Clause insertion and formatting
   - Legal audit log generation

2. **Deliverable Verification**
   - Code quality assessment
   - Milestone completion checking
   - Deployment validation
   - Automated decision-making

3. **Dispute Resolution**
   - Evidence analysis
   - Automated mediation suggestions
   - Fair settlement recommendations

**INFT Agent Integration:**
- Each contract can be backed by an INFT agent
- Agent holds verification logic and legal templates
- TEE-secured credentials for GitHub/API access
- Upgradeable logic via beacon proxy pattern
- Transferable and composable agent instances

#### **Technical Architecture**

**Frontend (Next.js):**
- Multi-stage contract creation flow
- Real-time verification progress tracking
- Wallet integration (WalletConnect)
- Contract state visualization
- Chat interface for AI interaction

**Backend (API Routes):**
- `/api/contracts` - Contract CRUD operations
- `/api/verify/github` - GitHub verification
- `/api/verify/storage` - 0G Storage upload
- `/api/verify/agent-sign` - AI agent signing
- `/api/verify/finalize` - Backend state update
- `/api/storage/download` - 0G Storage download

**Smart Contracts:**
- PacterEscrowV2 - Main escrow logic
- IndiaFreelanceLegalNFT - INFT agent instances
- TEEVerifier - Proof verification

**Storage Layer:**
- Redis - Fast contract state management
- 0G Storage - Immutable artifact storage
- IPFS - Redundant backup storage

### **Wave 5: Future Enhancements** 🚀
- Multi-party agreements and group contracts
- Cross-chain asset support
- Autonomous agent self-upgrades
- Community-contributed templates
- Advanced analytics and reporting
- Mobile app development
- Integration with traditional legal systems

---

## 🤝 **Contribute / Build**

- Fork this repo, read our [dev docs](https://github.com/YOUR-ORG/pacter/tree/main/docs), and start customizing templates!
- Submit INFT agent templates for any repeatable agreement—they're composable, ownable, and rewardable.
- File PRs/issues or reach out for partnership opportunities.

---

## ⚡ **Summary**

Pacter is **not another dApp—it's the next trust primitive**:  
A protocol, toolkit, and ecosystem for AI-enforced, programmable agreements—autonomous, composable, audit-ready, and open to all.

For anything from a two-person wager to a global software license, **Pacter and 0G unlock the future of digital collaboration.**

***Build on trust, not on hope.***

---

**Explore more on our [GitHub](#) and dive into the future of programmable digital pacts!**