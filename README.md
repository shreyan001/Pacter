
# ⚡ Final Wave Update (Production Readiness & Mainnet)

## Overview

Wave 5 is a major production-oriented release for **Pacter** — focused on making programmable trust practical, auditable, and productive on the 0G mainnet. This wave moves Pacter from a verification-first research prototype into a production-grade coordination layer by delivering (1) inference-driven on-chain arbitration, (2) time-based/usage-based escrow flows for live services, (3) productive escrow via an insured DeFi vault, and (4) a hardened information-collection pipeline that powers reliable on-chain contract generation.

This section summarizes what changed, why it matters, and the exact mainnet contract addresses we will submit for the WaveHack final entry. The previous documentation and mainnet artifacts remain in the repo — this is an additive update describing the Wave 5 production upgrades.

---

## What’s new in Wave 5 — High level

Wave 5 rethinks escrow, verification, and dispute flows to be **autonomous, auditable, and capital-efficient**. Rather than simply holding funds, escrow contracts now:

- **Route disputes** to an on-chain arbitration layer with a complete verifiable evidence package (signed terms, TEE-attested inference logs, 0G Storage hashes, timestamps).
- **Support time-locked, monitored payments** for compute and API rentals. Payments stream or unlock as uptime / SLA checks pass; they pause/resume automatically when the agent detects service outages.
- **Opt-in productive escrow** routes idle funds into an insured DeFi vault to accumulate low-risk yield during a contract lifecycle; principal + yield are withdrawn on completion and split by contract logic.
- **Make every inference auditable**: every verification, arbitration trigger, and vault operation emits cryptographic proofs recorded to 0G Storage and referenced on-chain.
- **Production hardening**: backend route optimizations, stricter schema validation loops, stage-based progress tracking, and a modular state graph to reliably collect and validate user inputs before contract generation.

These capabilities enable real-world verticals — freelance milestones with GitHub verification, compute/API rentals billed by uptime, royalty splits for creative work, and reproducibility-gated research grants.

---

## Mainnet Contracts (Final — include in submission)

Below are the **production mainnet contract addresses** for Wave 5. These are the contracts to include in your final submission form and to verify on Chainscan.

| Component | Purpose | 0G Mainnet Address |
|---|---:|---|
| Pacter DeFi Vault (1% productive-escrow) | Optional yield routing for idle escrow balances (principal + yield handling). | `0xA34a78E25f7b6B484c96771c11836b168ab7062D` |
| PacterEscrowV2 | Core escrow logic for simple and templated escrows (foundation contract used by flows). | `0x1E7e5264B2a08B06aBF60c1A1A513e8c943ed592` |
| MilestoneEscrow | Multi-milestone escrow with milestone-specific verification hooks & arbitration routing. | `0xAB889C9c7289E8a353Bd5fa5A49e88369301EC52` |
| TimeboxInferenceEscrowV2 | Time-locked / usage-verified escrow for API/compute rentals with live monitoring. | `0x274daeB38923A7600dB8B90ED847961f2551893D` |

> **Note:** Add these verified addresses (with transaction hashes) into the submission form and top-level README links. Also include Chainscan links to the verified source code where available.

---

## Upgrades & Optimizations — Deep Dive

### Inference-Driven Arbitration
Previously, disputes required manual evidence bundling or off-chain workflows. Wave 5 removes that friction by giving contracts the ability to auto-package every relevant artifact when a dispute is raised.

When both parties mark a dispute (or when timeout triggers), the agent collates:
- the signed terms and agreement snapshot,
- verification logs (tool outputs, test results),
- 0G Storage content hashes (full Merkle proof),
- TEE attestation metadata (model ID, enclave signature, timestamp),
and forwards the payload to the configured arbitration contract. The arbitration contract can be a specialized on-chain court (pluggable) and is designed to accept structured evidence packages and act deterministically.

This yields:
- faster, auditable rulings,
- less human overhead for low-value disputes,
- the ability to fall back to juror systems or human review for high-value or complex cases.

### Time-Locked & Usage-Based Escrows
TimeboxInferenceEscrowV2 is built to support real services: compute, model inference, hosting, or any time-bound resource. Key behavior includes:

- Client deposits for a defined time window (e.g., 5 days).
- A monitoring agent periodically executes active checks (ping/test inference) to verify availability and SLA compliance.
- Payments are released incrementally; downtimes reduce payouts automatically.
- The same contract can **pause** payment flows when SLA fails and **resume** when service returns — no redeploy required.

This enables honest, low-friction pay-per-use commerce for compute providers and researchers.

### Productive Escrow — Yield on Locked Capital
Idle capital in escrow is an economic deadweight. Wave 5 introduces an opt-in flow where escrow balances are deposited into a low-risk, insured DeFi vault managed by `PacterDeFiVault1Pct`. While funds are in the vault:

- Yield accrues to the escrow pool.
- At contract completion, the vault returns principal + yield.
- Profit split is automatic (configurable baseline: 90% client / 10% executor).
- Vault operations are transparent and auditable on-chain.

We will gradually integrate audited vault providers (Aave-style) and clearly document the insurance/underwriting model in `docs.md`.

### Verification & Transaction Transparency
All agent-driven decisions (verify, approve, pause, route to arbitration, withdraw vault) emit a signed, machine-readable proof referenced to 0G Storage. Each proof contains:
- the exact command run,
- the agent instance (INFT) and version,
- TEE attestation metadata linking the inference to its secure execution,
- the storage hash of the result blob (human-readable verification report).

This makes the contract a deterministic, auditable state machine where human observers can reconstruct each decision.

---

## Information Collection & State Graph — Production Improvements

A large portion of Wave 5 effort went into making the onboarding → contract generation pipeline **reliable** and **defensible**. The previous prototype's ad-hoc collection flow has been replaced with a production-grade information collection engine that features:

- **Zod-validated schemas** for each escrow type (base, milestone, time-locked). The zod schemas guarantee typed, validated fields before proceeding to contract generation.
- **StateGraph-driven flow control** (LangGraph/StateGraph) for stage-based routing, progress tracking, and deterministic conversation flows. The graph enforces “one-question-at-a-time” collection and prevents hallucination-driven state corruption.
- **Explicit progress & stage indices** to keep frontend and backend in sync (progress 0–100, `stageIndex`, `currentFlowStage`), improving UX and reducing stale or partial contract submissions.
- **Defensive extraction logic** that avoids blind AI-to-JSON extraction. Where structured extraction is risky, the flow falls back to human-confirmable steps or explicit prompts to the user.
- **Category baseline & mix-and-match verification toolkit**: each escrow type has recommended verification methods (GitHub clones + CI, HEADLESS browser checks, Figma asset diffing, file hash verification, model output checks). The architecture allows composing multiple verification modules per milestone for higher assurance.

A representative excerpt of the updated collection schemas and state graph orchestration is included in `docs.md` (see *Information Collection — Technical Appendix*). This work significantly reduces invalid contract generation and ensures prepare-for-inference consistency.

---

## Developer Notes (what changed in the codebase)

- **Backend route optimization**: information collection route refactored for idempotency, lower latency, and deterministic validation before contract creation.
- **Schema-driven validation**: `zod` schemas for `BaseInfo`, `MilestoneEscrow`, and `TimeLockedEscrow` now power both server-side validation and LangGraph prompts.
- **StateGraph orchestration**: nodegraph now exposes explicit nodes for `initial_node`, `collect_initiator_info`, and `request_missing_info` with conditional routing based on `stage` and `operation`.
- **Agent governance**: agent instances are versioned and their prompts are signable; agent upgrades are tracked in the INFT beacon pattern.
- **Monitoring & replay**: all collection sessions are snapshot-capable and replayable for debugging and audit.

If you are a contributor, see `docs.md` → *Developer Appendix* for code samples and flow diagrams.

---

## UX & Product Improvements

We focused on the user experience to increase trust and reduce friction:

- **Chat-first onboarding** with explicit next-missing-field prompts (no silent assumptions).
- **Progress indicators** for every contract creation flow, letting users see how close they are to "contract-ready".
- **Verification transparency** — every verification step shows the raw artifacts (hashes + human summary) plus the TEE attestation metadata.
- **Vault opt-in flow** surfaced early during escrow creation, with clear explanation of yield, risk, and split rules.
- **Arbitration selection** — users can choose default automated mediation, a juror-based module, or a pre-specified arbitration contract address.

---

## How this meets the WaveHack mainnet requirements

WaveHack judges evaluate production readiness, documentation, and USP/UX. Wave 5 meets these expectations as follows:

**Mainnet Deployment & Production Readiness (40%)**
- All primary contracts above are deployed to 0G mainnet (addresses listed). Include verified contracts and tx hashes in submission.
- 0G Storage integration used for immutable evidence and 0G Compute for TEE attestations. (Compute may still use mainnet enclaves for expensive model runs if required, but the evidence & settlement live on mainnet.)
- Production-level UX and deterministic contract generation backed by validated schemas and StateGraph orchestration.
- Security patterns: OpenZeppelin contracts, upgradeable beacons, multisig timelocks, and audit-ready hooks.

**Documentation & Social Posting (30%)**
- This README update + `docs.md` contains a user guide, developer appendix, deployment instructions, and security notes. Include direct links to `docs.md` in the repo root and in your final WaveHack submission.
- We will publish a concise X thread calling out mainnet addresses, the 5-minute demo steps, and links to the repo and docs.

**USP & UX (30%)**
- Unique combination of **TEE-attested inference**, **productive escrow**, and **pluggable on-chain arbitration**.
- Polished chat-first UX with deterministic data collection reduces disputes and user errors.
- Real-world applicability for freelance work, compute rentals, creative royalties, DAO grants, and agent-to-agent commerce.

---

## Links & Next Actions

- Full user & developer docs (detailed): `docs.md` (root of repository) — **please include this link in the final submission form**.
- Verify and publish the contract source codes on 0G Chainscan (include verification tx links).
- Add the following entries to the WaveHack submission:
  - Mainnet contract addresses (copy the table above).
  - Live demo URL (public), quickstart steps, and `docs.md` link.
  - GitHub repo link and main branch commit hash for reproducibility.

---
# ⚡ Pacter — Wave 5 Update

## Inference-Driven Arbitration, Productive Escrow Funds, and Time-Based Automation

*(Built on 0G Chain with iNFT Agents and Secure On-Chain Inference)*

This wave introduces a major step toward self-governing digital agreements — enabling Pacter contracts to arbitrate disputes autonomously, utilize idle escrow assets through insured DeFi vaults, and support continuous, inference-verified service payments.

### 🧱 Core Upgrades

#### 1️⃣ Arbitration-Enabled Escrow
Dispute handling is no longer an afterthought. Every escrow contract — whether milestone-based or time-locked — can now route unresolved cases to an arbitration contract address. When both parties signal disagreement, the inference agent compiles all context: signed terms, verification logs, storage hashes, and timestamps, then forwards them on-chain to the arbitration layer. This arbitration layer can connect with on-chain courts such as Kleros-style juror systems or specialized resolution contracts designed for 0G. Each case carries a full data payload, letting external protocols evaluate and release funds according to verified rulings. If no dispute arises within the set period, the contract auto-releases funds — a built-in "timeout" safeguard ensuring no value remains locked indefinitely.

*Example:*
A freelancer completes Milestone 2 for a web app project. The AI verification agent detects missing deployment files and flags a mismatch. The client disagrees and raises a dispute. Pacter's contract packages the repo hash, verification proof, and signatures, then sends them to the arbitration address. The arbiter (e.g., a 0G-based dispute contract) reviews the evidence and automatically resolves payment, updating the main escrow state.

#### 2️⃣ Time-Locked Inference Escrow
To support API rentals and compute-as-a-service, we deployed a time-based escrow mechanism. Clients pre-fund a contract for a defined duration — for example, five days of AI inference API access. The funds unlock gradually as time progresses, verified continuously by the agent testing the API endpoint's responsiveness. If the service fails or latency exceeds the SLA, the agent pauses payment in real-time. When uptime is restored, the same contract resumes without redeployment.

*Example:*
A startup offers GPU inference endpoints through Pacter. A user books 5 days of compute, depositing funds into the time-locked escrow. The AI agent periodically calls the endpoint — if 12 hours of downtime occur, the system auto-deducts the inactive duration from total payout. The client's remaining balance continues earning yield in the vault until the session resumes.

#### 3️⃣ Productive Escrow Funds via Insured DeFi Vaults
Previously, escrow deposits were idle, serving only as locked capital. Now, clients can opt-in to route escrow balances into stable, insured DeFi vaults through the integrated Pacter DeFi Vault (1%). This converts dormant deposits into yield-earning assets — generating low-risk returns during the contract lifecycle. When the escrow concludes, the contract withdraws both principal + yield, splitting profits:
- 90% to the client (fund originator)
- 10% to the freelancer (as opportunity reward)
Future iterations will integrate audited, insured vaults (Aave-style) to minimize risk while maintaining transparency.

#### 4️⃣ Inference Agents with Transaction Transparency
All milestone approvals, arbitration triggers, and vault interactions now run through inference-based on-chain commands. Each action emits a verifiable log showing which command executed the transaction — a cryptographically attested audit trail on 0G Storage. This brings deterministic explainability to every financial operation, turning the contract into a transparent, interpretable state machine.

### 🧩 Real-World Impact

| Scenario | Description |
|---|---|
| Freelance Development | Client deploys milestone escrow; agent verifies GitHub commits, manages disputes via arbitration, and auto-invests idle funds. |
| AI API Rental / Compute Access | Time-locked escrow streams payments for live services; inference monitors uptime, pauses payouts if conditions fail. |
| DeFi Yield Utilization | Escrow deposits earn passive yield via trusted vaults, enhancing capital efficiency without sacrificing safety. |
| Autonomous Arbitration | Disputes route to on-chain courts for verifiable, bias-free outcomes. |

---

### 🔗 Deployed on 0G Newton mainnet (Chain ID 16602)

| Component | Address |
|---|---|
| 🏦 Pacter DeFi Vault (1%) | [`0xa570E01A19A4bE995f5A27498b22eC6CbC2F1283`](https://chainscan-galileo.0g.ai/address/0xa570E01A19A4bE995f5A27498b22eC6CbC2F1283) |
| ⏱ Time-Locked Escrow Contract | [`0xAf80C53e4A85E5f14aB304A26aDCfEf723f610a4`](https://chainscan-galileo.0g.ai/address/0xAf80C53e4A85E5f14aB304A26aDCfEf723f610a4) |
| 💼 Milestone Escrow Contract | [`0x5845B17df53b0E3b5a9be04908294cDa8c4FA3e0`](https://chainscan-galileo.0g.ai/address/0x5845B17df53b0E3b5a9be04908294cDa8c4FA3e0) |
| 🌐 Live Demo | [pacter.vercel.app](https://pacter.vercel.app) |
| 🎥 Demo Video | [YouTube Demo](https://www.youtube.com/watch?v=zkIWkmrfOIc) |

### 🧭 Summary

Wave 5 upgrades make Pacter a fully autonomous coordination system — where:
- Every agreement can resolve disputes via verifiable arbitration.
- Idle escrow capital works productively in insured DeFi vaults.
- Continuous-service providers get paid in real time.
- Every on-chain decision is inference-verified and audit-logged.

This establishes Pacter as a trustless, yield-aware, arbitration-ready contract layer for real-world digital collaborations on the 0G Chain.




## 📦 0G WaveHack Wave 3 & 4 Updates

### Wave 3 & 4: Enhanced Web Development Verification Escrow with Jurisdictional Legal NFTs

We've significantly evolved Pacter from a simple escrow system to a comprehensive web development verification platform with jurisdictional legal backing. The platform now features a sophisticated multi-stage workflow with proper UX, leveraging 0G's powerful infrastructure for secure, transparent, and verifiable digital agreements.

#### 🚀 Transformative Evolution Process

Our journey from Wave 2 to Waves 3 & 4 represents a fundamental shift in how digital agreements are created, verified, and enforced:

**From Simple Escrow to Comprehensive Verification Platform:**
We've transformed the basic escrow functionality into a full-fledged verification system that handles the entire web development workflow. This evolution addresses the critical trust gap in freelance web development by providing automated verification of deliverables, secure milestone payments, and legally binding agreements.

**Jurisdictional Legal Framework Integration:**
We've pioneered the integration of jurisdiction-specific legal frameworks through our Indian Legal Contract NFT (INFT). This groundbreaking approach ensures that digital agreements have proper legal standing within specific jurisdictions, bridging the gap between blockchain technology and traditional legal systems.

**Multi-Stage Verification Workflow:**
Our enhanced system now features a sophisticated multi-stage verification process:
1. **Information Collection** - Gathering project requirements, milestones, and payment terms
2. **Contract Creation** - Generating legally binding agreements through our INFT framework
3. **GitHub Integration** - Connecting to repositories for automated code verification
4. **Code Extraction & Analysis** - Pulling and analyzing code changes for milestone verification
5. **Client Review & Approval** - Enabling clients to review deliverables and approve payments
6. **Secure Payment Release** - Automated milestone payments upon verification and approval

**0G Infrastructure Utilization:**
We've deeply integrated 0G's powerful infrastructure throughout our platform:
- **0G Storage** - All contract data, code artifacts, and verification proofs are securely stored with immutable hashing
- **0G Compute** - AI-powered contract analysis and verification through secure TEE-verified computation
- **0G Chain** - Smart contract deployment for escrow management and payment processing

#### 🌟 Major Advancements

1. **Deployed Indian Legal Contract NFT (INFT)** - A legally binding digital contract framework specifically designed for the Indian jurisdiction, enabling enforceable freelance agreements with proper legal standing. The contract includes all necessary legal clauses, jurisdiction-specific provisions, and is minted as an NFT with immutable proof of existence.

2. **Enhanced Verification Workflow** - A multi-stage process that collects, verifies, and validates web development deliverables through GitHub integration, with automated code extraction and analysis. The system pulls code from repositories, analyzes changes, and generates verification proofs that are stored on 0G Storage.

3. **0G Storage Integration** - All code and verification artifacts are securely stored on 0G Storage with immutable proofs, ensuring transparency and auditability. Each verification step generates cryptographic proofs that are stored alongside the original data, creating an unalterable record of the entire process.

4. **0G Compute Inference** - AI-powered contract analysis and amendment generation through secure TEE-verified computation. Our system uses advanced language models to analyze contracts, suggest amendments, and verify deliverables, all running in secure enclaves with cryptographic attestation.

5. **Deal Maker Smart Contract** - A sophisticated escrow system acting as an autonomous middleman agent for secure deposits and AI-agent-approved milestone payments. The contract holds funds, releases payments based on verification results, and maintains a complete audit trail of all transactions.

6. **Multi-Page UX Flow** - Redesigned user experience with clear stage indicators, proper information collection, and streamlined verification processes. The interface guides users through each step of the process, from contract creation to final payment, with intuitive navigation and real-time status updates.

### 📋 Project Information

| Component | Details |
|-----------|----------|
| **Indian Legal INFT Agent** | [`0x50AfCE3f4C6235bAbFbCD31C8Dd1693E99046705`](https://chainscan-galileo.0g.ai/address/0x50AfCE3f4C6235bAbFbCD31C8Dd1693E99046705) |
| **TEE Verifier Contract** | [`0x81bCd9AbdD3eCd4878AeB98b947f61ACa98b9288`](https://chainscan-galileo.0g.ai/address/0x81bCd9AbdD3eCd4878AeB98b947f61ACa98b9288) |
| **IndiaFreelanceLegalNFTImpl** | [`0x9c38E1045Cf3b499199075bbC4E438E4faF900aB`](https://chainscan-galileo.0g.ai/address/0x9c38E1045Cf3b499199075bbC4E438E4faF900aB) |
| **IndiaFreelanceLegalNFTBeacon** | [`0x2B31469af35BE50E233Df01F0944dA3203b7e456`](https://chainscan-galileo.0g.ai/address/0x2B31469af35BE50E233Df01F0944dA3203b7e456) |
| **Minted Agent Token ID** | [Token #0](https://chainscan-galileo.0g.ai/tx/0x6b32607d05d29c4f74fa27d5666449a8e60bf93cc5366e7bbcf3708ee34ecb52) - Owner: `0x83CDBbA8359aAc6a25ACb70eb67dcF0E5eB2c607` |
| **Escrow Contract (PacterEscrowV2)** | [`0x259829717EbCe11350c37CB9B5d8f38Cb42E0988`](https://chainscan-galileo.0g.ai/address/0x259829717EbCe11350c37CB9B5d8f38Cb42E0988) |
| **Network** | 0G Newton mainnet (Chain ID: 16602) |
| **Demo Video** | [https://www.youtube.com/watch?v=ckIWzmrfOIc](https://www.youtube.com/watch?v=ckIWzmrfOIc) |
| **Live Demo** | [https://pacter.vercel.app/](https://pacter.vercel.app/) |

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
- Basic escrow contract deployment on 0G mainnet
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

**INFT Contract Deployment (zgmainnet):**

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
