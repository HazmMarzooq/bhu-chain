# Bhu-Chain: Blockchain-Based Land Ownership Verification for India

> **A cryptographic land-record verification and anti-forgery layer aligning with the Digital India Land Records Modernization Programme (DILRMP) and 14-digit Unique Land Parcel Identification Numbers (ULPIN / Bhu-Aadhaar).**

---

## 1. Project Overview & Statutory Scope

In India, land disputes and forged property documents account for approximately 66% of all civil litigation. Common vulnerabilities include:
- Selling the same land parcel multiple times to unsuspecting buyers using outdated paper deeds.
- Forging seller signatures or altering survey boundaries on paper sale agreements.
- Concealing active bank mortgages or court injunctions (*Lis Pendens* under Section 52 of the Transfer of Property Act).

**Bhu-Chain** provides an immutable, append-only cryptographic verification layer that operates alongside state revenue records and the Registration Act of 1908.

### Key Constraints & Privacy Safeguards:
1. **Verification Layer, Not Title Replacement:** Bhu-Chain does not replace state land revenue authorities (such as Patta, Chitta, or Record of Rights) or judicial courts; it serves as a mathematical proof system for approved transactions.
2. **Zero-Knowledge PII Protection:** No raw Aadhaar numbers, personal phone numbers, or unencrypted scanned identity files are ever placed on the ledger. All identity records are anonymized using HMAC-SHA256 with government salt keys.
3. **Cryptographic Proofs:** All deeds, georeferenced cadastral map shapefiles, and approval events are stored as immutable SHA-256 hashes chained with parent block pointers.

---

## 2. System Architecture

The following diagram illustrates the interaction between citizens, government authorities, banks, and the cryptographic ledger:

```mermaid
flowchart TD
    subgraph Citizens_And_Banks["Stakeholders"]
        C["Citizen / Buyer"]
        B["Bank Officer"]
    end

    subgraph Administrative_Offices["Government Authorities"]
        SR["Sub-Registrar Office<br/>(Registration Act 1908)"]
        RO["Revenue Officer / Tehsildar<br/>(Mutation Authority)"]
        AD["C&AG / State Auditor"]
        ADM["System Admin"]
    end

    subgraph Platform_Layer["Bhu-Chain Verification Engine"]
        API["Next.js 14 API Gateway<br/>(JWT RBAC & Rule Engine)"]
        QR["QR Generator<br/>(14-digit ULPIN Token)"]
        VD["Zero-Knowledge Deed<br/>Hash Validator (SHA-256)"]
    end

    subgraph Blockchain_Module["Cryptographic Ledger Simulation"]
        GEN["Genesis Block #1<br/>(Parent: 00000000)"]
        BLK1["Block #2: MORTGAGE<br/>(Parent: Prev Hash)"]
        BLK2["Block #3: SALE_DEED<br/>(Signed by Sub-Registrar)"]
        BLK3["Block #4: MUTATION_APPROVAL<br/>(Approved by Tehsildar)"]
    end

    subgraph Database_Layer["State Registry Database"]
        DB[("PostgreSQL / SQLite<br/>Prisma ORM")]
    end

    C -->|Search ULPIN / Scan QR| API
    C -->|Draft Sale Request| API
    B -->|Collateral Check / Record Mortgage| API
    B -->|Issue Pledge Release| API
    SR -->|Verify Encumbrance & Register Deed| API
    RO -->|Sanction Mutation / Flag Dispute| API
    AD -->|Audit Feed & Validate Chain| API
    ADM -->|Onboard Parcel| API

    API --> QR
    API --> VD
    API --> DB
    API --> Blockchain_Module

    GEN --> BLK1
    BLK1 --> BLK2
    BLK2 --> BLK3
```

---

## 3. Entity-Relationship (ER) Diagram

```mermaid
erDiagram
    USER ||--o{ WORKFLOW_REQUEST : initiates
    USER ||--o{ AUDIT_LOG : generates
    PARCEL ||--|{ BLOCKCHAIN_EVENT : contains_blocks
    PARCEL ||--o{ WORKFLOW_REQUEST : associated_with
    PARCEL ||--o{ AUDIT_LOG : references

    USER {
        string id PK
        string email UK
        string passwordHash
        string fullName
        enum role "CITIZEN, SUB_REGISTRAR, REVENUE_OFFICER, BANK_OFFICER, AUDITOR, ADMIN"
        string department
        string digitalId UK
        datetime createdAt
    }

    PARCEL {
        string id PK
        string ulpin UK "14-digit Bhu-Aadhaar"
        string state
        string district
        string taluk
        string village
        string surveyNumber
        string subdivisionNumber
        string currentOwnerName
        string currentOwnerHash "HMAC-SHA256"
        enum encumbranceStatus "UNENCUMBERED, MORTGAGED"
        enum disputeStatus "NO_DISPUTE, ACTIVE_DISPUTE"
        string disputeRemarks
        string mapReferenceHash "SHA-256 of Cadastral GIS"
        string qrCodeUrl
        datetime lastMutationDate
        datetime createdAt
    }

    BLOCKCHAIN_EVENT {
        string id PK
        int blockNumber
        string ulpin FK
        enum eventType "PARCEL_REGISTRATION, SALE_DEED, MUTATION_APPROVAL, MORTGAGE, PLEDGE_RELEASE, DISPUTE_FLAG, RECORD_CORRECTION"
        string previousOwnerHash
        string newOwnerHash
        string documentHash "SHA-256"
        string registrationOfficeId
        string approverDigitalId
        datetime approvalTimestamp
        string previousHash "SHA-256 Parent Link"
        string currentHash "SHA-256 Block Fingerprint"
        string digitalSignature "Placeholder Signature"
    }

    WORKFLOW_REQUEST {
        string id PK
        string ulpin FK
        enum workflowType "SALE, MORTGAGE, PLEDGE_RELEASE, DISPUTE, CORRECTION"
        enum status "PENDING_REGISTRAR, PENDING_REVENUE, APPROVED, REJECTED"
        string initiatorName
        string initiatorEmail
        string payload "JSON metadata"
        string remarks
        datetime createdAt
        datetime updatedAt
    }

    AUDIT_LOG {
        string id PK
        string action
        string userEmail
        string userRole
        string ulpin
        string status "SUCCESS, FAILED, WARNING"
        string ipAddress
        string details
        datetime createdAt
    }
```

---

## 4. Preloaded Tamil Nadu Pilot Dataset (10 Parcels)

The seed database initializes 10 realistic parcels across key Tamil Nadu revenue divisions:

| # | ULPIN | District / Taluk | Survey / Subdiv | Approved Owner | Status | Scenario Description |
|---|---|---|---|---|---|---|
| 1 | `33-002-001-00101` | Chennai • Mylapore | 104 / 2A | K. R. Sundaram | **Clean Freehold** | Clear title; ready for sale or mortgage. |
| 2 | `33-002-001-00102` | Chennai • T. Nagar | 215 / 1B | S. Meenakshi | **Clean Freehold** | Urban commercial parcel with unencumbered title. |
| 3 | `33-004-002-00305` | Coimbatore • Pollachi | 78 / 3 | R. Vijayakumar | **Clean Freehold** | Agricultural tract with certified Patta. |
| 4 | `33-010-003-00410` | Trichy • Srirangam | 312 / 4C | M. Sangeetha | **Clean Freehold** | Residential property with approved mutation. |
| 5 | `33-026-009-00770` | Tirunelveli • Ambasamudram | 55 / 1A | C. Arumugam | **Clean Freehold** | Heritage property with single owner lineage. |
| 6 | `33-015-008-00620` | Madurai • Melur | 89 / 5 | P. Muthukumar | **MORTGAGED** | Active lien by State Bank of India (INR 35,00,000). Sale blocked until release. |
| 7 | `33-021-006-00550` | Erode • Perundurai | 142 / 2 | K. Selvaraj | **MORTGAGED** | Industrial mortgage by Canara Bank. |
| 8 | `33-028-014-00840` | Salem • Attur | 401 / 7 | D. Venkataraman | **DISPUTED** | OS 112/2024 Salem Sub-Court injunction active. All transfers frozen. |
| 9 | `33-019-011-00910` | Thanjavur • Kumbakonam | 67 / 3B | T. Sridhar | **DISPUTED** | Revenue title dispute pending before District Revenue Officer. |
| 10 | `33-003-004-00190` | Kanchipuram • Sriperumbudur | 45 / 1B | M. Balaji | **FORGERY DEMO** | Includes pre-loaded authentic deed vs forged deed to demonstrate real-time SHA-256 detection. |

---

## 5. Quick Start Guide (Local Setup)

### Prerequisites
- Node.js 18+ or 20+
- Linux, macOS, or Windows WSL

### 1. Clone & Install Dependencies
```bash
# Navigate to the project root directory
cd bhu-chain

# Install required packages
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Default SQLite environment variables:
```env
DATABASE_URL="file:./dev.db"
JWT_SECRET="bhu-chain-national-land-verification-secret-key-2024"
IDENTITY_SALT="dilrmp-tamildnadu-salt-8849"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 3. Initialize Database & Seed
```bash
# Push Prisma schema to SQLite
npx prisma db push

# Seed initial users, parcels, and blockchain genesis blocks
npm run db:seed
```

### 4. Run the Automated Test Suite (11 Test Cases)
```bash
npm run test:workflow
```
*Expected output: All 11 test cases pass, validating Genesis block generation, duplicate ULPIN prevention, unauthorized seller blocking, dispute locks, mortgage encumbrance locks, authentic vs forged deed SHA-256 detection, mutation approvals, and tamper detection.*

### 5. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 6. Preconfigured Role Credentials

All demo accounts share the password: `demo@123`

| Role | Name | Email | Default Dashboard |
|---|---|---|---|
| **Citizen** | K. R. Sundaram | `citizen@bhu-chain.gov.in` | `/citizen` |
| **Sub-Registrar** | T. Annamalai | `registrar@bhu-chain.gov.in` | `/registrar` |
| **Revenue Officer** | S. K. Radhakrishnan | `revenue@bhu-chain.gov.in` | `/revenue` |
| **Bank Officer** | V. Meenakshi (SBI) | `bank@bhu-chain.gov.in` | `/bank` |
| **Auditor** | G. Shankaran (C&AG) | `auditor@bhu-chain.gov.in` | `/auditor` |
| **Admin** | State Super Admin | `admin@bhu-chain.gov.in` | `/admin` |

*A 1-click credential selector is available on the `/login` page.*

---

## 7. Production Deployment (Vercel & PostgreSQL)

Bhu-Chain is built using Next.js 14 App Router and is fully deployable to **Vercel** with a serverless PostgreSQL database (Vercel Postgres, Neon, or Supabase).

### Step 1: Set Up Cloud PostgreSQL
1. Create a free PostgreSQL instance on **Neon.tech**, **Supabase**, or **Vercel Postgres**.
2. Copy the connection string: `postgresql://user:password@host:5432/bhuchain?sslmode=require`.

### Step 2: Switch Prisma Provider
In `prisma/schema.prisma`, update the datasource:
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

### Step 3: Configure Vercel Project
1. Import the project repository into the Vercel Dashboard.
2. In **Project Settings ➔ Environment Variables**, set:
   - `DATABASE_URL`: Your cloud PostgreSQL connection string.
   - `JWT_SECRET`: A secure 32+ character random string.
   - `IDENTITY_SALT`: A random salt string for PII hashing.
   - `NEXT_PUBLIC_APP_URL`: Your assigned Vercel domain (e.g. `https://bhu-chain.vercel.app`).
3. Set the build command to:
   ```bash
   prisma generate && prisma db push && tsx prisma/seed.ts && next build
   ```
4. Deploy.

---

## 8. Cryptographic Core Verification API Summary

- `GET /api/parcels` — List and filter parcels by district, encumbrance, or dispute status.
- `GET /api/parcels/:ulpin` — Retrieve full parcel metadata, cadastral map hash, QR token, and chained blocks.
- `POST /api/parcels/:ulpin/verify-document` — Compares submitted document text against on-chain SHA-256 fingerprints to flag forgeries.
- `GET /api/parcels/:ulpin/chain-status` — Validates sequential block hashes and parent pointers.
- `POST /api/workflows` — Submit multi-party workflow requests (Sale, Mortgage, Dispute).
- `POST /api/workflows/:id/action` — Approve or reject requests and append new signed blockchain blocks.
- `GET /api/blockchain/events` — Global public block ledger feed.
- `GET /api/audit-logs` — Immutable audit log feed for auditors and vigilance authorities.

---

## 9. Security & Compliance Highlights

- **Lis Pendens Lock:** Automated blocking of sale deeds when court injunctions or revenue disputes are active.
- **Double-Mortgage Prevention:** Real-time query prevents a landowner from using the same title deed as collateral at multiple commercial banks simultaneously.
- **1-Bit Alteration Detection:** Modifying even a single comma, survey boundary digit, or seller name in a legal deed alters the SHA-256 hash completely, failing verification.
- **Non-Repudiation:** Every action is attributed to a unique officer digital ID and timestamped within an append-only block.
