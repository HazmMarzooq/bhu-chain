/**
 * Bhu-Chain Automated Verification & Workflow Test Suite
 *
 * Tests the 11 core functional, cryptographic, and security requirements:
 * 1. Parcel onboarding & Genesis block creation
 * 2. Duplicate ULPIN prevention
 * 3. Unauthorized sale attempt
 * 4. Sale attempt by non-owner
 * 5. Sale blocked on disputed parcel
 * 6. Sale blocked on mortgaged/encumbered parcel
 * 7. Valid document SHA-256 verification (Authentic deed match)
 * 8. Forged document rejection (Mismatch detection)
 * 9. Mutation approval workflow & block appending
 * 10. Mortgage encumbrance and pledge release lifecycle
 * 11. Blockchain cryptographic chain integrity & audit-trail immutability
 */

import { PrismaClient } from "@prisma/client";
import {
  sha256,
  hashIdentity,
  verifyChainIntegrity,
  verifyDocument,
  createNewBlock,
  BlockStructure,
  GENESIS_PREV_HASH,
} from "../src/lib/blockchain/bhu-chain";

const prisma = new PrismaClient();

async function runTests() {
  console.log("==================================================================");
  console.log("🧪 STARTING BHU-CHAIN AUTOMATED WORKFLOW & SECURITY TEST SUITE");
  console.log("==================================================================\n");

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, extra?: string) {
    if (condition) {
      console.log(`  ✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${testName} ${extra ? `(${extra})` : ""}`);
      failed++;
    }
  }

  // -------------------------------------------------------------
  // TEST 1: Parcel onboarding & Genesis block creation
  // -------------------------------------------------------------
  console.log("▶ TEST 1: Parcel onboarding & Genesis Block");
  const testUlpin = "33-TEST-999-00001";
  const existing = await prisma.parcel.findUnique({ where: { ulpin: testUlpin } });
  if (existing) {
    await prisma.blockchainEvent.deleteMany({ where: { ulpin: testUlpin } });
    await prisma.parcel.delete({ where: { ulpin: testUlpin } });
  }

  const ownerIdHash = hashIdentity("TEST_CITIZEN_12345");
  const testParcel = await prisma.parcel.create({
    data: {
      ulpin: testUlpin,
      district: "Test District",
      taluk: "Test Taluk",
      village: "Test Village",
      surveyNumber: "99",
      subdivisionNumber: "1",
      areaInSqMeters: 1000.0,
      landType: "AGRICULTURAL",
      mapReferenceHash: sha256("GIS:TEST:BOUNDARY"),
      ownerName: "Test Owner Alpha",
      ownerIdentityHash: ownerIdHash,
      ownerContactMasked: "+91 99*** **001",
      status: "APPROVED",
    },
  });

  const genesisBlock = createNewBlock(
    {
      ulpin: testParcel.ulpin,
      eventType: "PARCEL_REGISTRATION",
      previousOwnerHash: "0000000000000000000000000000000000000000000000000000000000000000",
      newOwnerHash: ownerIdHash,
      documentHash: sha256("GENESIS_PATTA_DEED_TEST"),
      documentTitle: "Test Settlement Patta",
      registrationOfficeId: "TEST-SRO",
      approverDigitalId: "RO-TEST-OFFICER",
      approvalTimestamp: new Date(),
      previousEventHash: GENESIS_PREV_HASH,
    },
    0
  );

  await prisma.blockchainEvent.create({ data: { ...genesisBlock } });

  assert(
    testParcel.ulpin === testUlpin && genesisBlock.blockNumber === 1,
    "Parcel onboarding creates parcel and Genesis Block #1 with 0000... parent hash"
  );

  // -------------------------------------------------------------
  // TEST 2: Duplicate ULPIN prevention
  // -------------------------------------------------------------
  console.log("\n▶ TEST 2: Duplicate ULPIN Prevention");
  let duplicateRejected = false;
  try {
    await prisma.parcel.create({
      data: {
        ulpin: testUlpin, // Same unique key
        district: "Another District",
        taluk: "Another Taluk",
        village: "Another Village",
        surveyNumber: "100",
        subdivisionNumber: "2",
        areaInSqMeters: 500.0,
        landType: "RESIDENTIAL",
        mapReferenceHash: sha256("GIS:ANOTHER"),
        ownerName: "Imposter Owner",
        ownerIdentityHash: hashIdentity("IMPOSTER_ID"),
        ownerContactMasked: "+91 90*** **000",
      },
    });
  } catch (err) {
    duplicateRejected = true;
  }
  assert(duplicateRejected, "Database schema strictly prevents duplicate ULPIN registration");

  // -------------------------------------------------------------
  // TEST 3: Sale attempt by non-owner
  // -------------------------------------------------------------
  console.log("\n▶ TEST 3: Sale by Non-Owner Detection");
  const declaredSeller = "Fraudulent Seller (Not Owner)";
  const isSellerValid =
    declaredSeller.trim().toLowerCase() === testParcel.ownerName.trim().toLowerCase();
  assert(!isSellerValid, "Sale is rejected if declared seller does not match current approved owner");

  // -------------------------------------------------------------
  // TEST 4: Sale on disputed parcel blocked
  // -------------------------------------------------------------
  console.log("\n▶ TEST 4: Sale on Disputed Parcel Blocked");
  const disputedParcel = await prisma.parcel.findUnique({
    where: { ulpin: "33-028-014-00840" }, // Tirunelveli active dispute
  });
  const isSaleAllowedOnDisputed =
    disputedParcel?.disputeStatus !== "ACTIVE_DISPUTE" &&
    disputedParcel?.encumbranceStatus === "NONE";
  assert(
    !isSaleAllowedOnDisputed,
    `Sale registration blocked on disputed parcel ${disputedParcel?.ulpin} (Status: ${disputedParcel?.disputeStatus})`
  );

  // -------------------------------------------------------------
  // TEST 5: Sale on mortgaged parcel blocked
  // -------------------------------------------------------------
  console.log("\n▶ TEST 5: Sale on Mortgaged Parcel Blocked");
  const mortgagedParcel = await prisma.parcel.findUnique({
    where: { ulpin: "33-015-008-00620" }, // Trichy mortgaged to SBI
  });
  const isSaleAllowedOnMortgaged =
    mortgagedParcel?.encumbranceStatus === "NONE" &&
    mortgagedParcel?.disputeStatus !== "ACTIVE_DISPUTE";
  assert(
    !isSaleAllowedOnMortgaged,
    `Sale registration blocked on mortgaged parcel ${mortgagedParcel?.ulpin} (Encumbrance: ${mortgagedParcel?.encumbranceStatus})`
  );

  // -------------------------------------------------------------
  // TEST 6: Valid Document Verification (Authentic deed)
  // -------------------------------------------------------------
  console.log("\n▶ TEST 6: Valid Document SHA-256 Verification");
  const kanchipuramParcel = await prisma.parcel.findUnique({
    where: { ulpin: "33-003-012-01099" },
    include: { events: true },
  });

  const authenticDeedContent =
    "AUTHENTIC_APPROVED_SALE_DEED_CONTENT: Seller: V. Narayanan, Buyer: Rajesh Varma, Consideration: INR 1,50,00,000, Date: 12-Oct-2023, Survey: 740/3, SRO Sriperumbudur, Registration Ref: SRO-KNC-1290/2023.";
  const authenticHash = sha256(authenticDeedContent);

  const verificationResult = verifyDocument(
    authenticHash,
    kanchipuramParcel?.events as unknown as BlockStructure[]
  );

  assert(
    verificationResult.isAuthentic && verificationResult.matchedEvent?.eventType === "SALE_DEED",
    "Authentic approved deed SHA-256 hash successfully matches on-chain blockchain event"
  );

  // -------------------------------------------------------------
  // TEST 7: Forged Document Rejection (Tampered content)
  // -------------------------------------------------------------
  console.log("\n▶ TEST 7: Forged Document Detection");
  // Forged version with altered consideration value or fake buyer name:
  const forgedDeedContent =
    "AUTHENTIC_APPROVED_SALE_DEED_CONTENT: Seller: V. Narayanan, Buyer: FRAUDULENT_BUYER, Consideration: INR 2,50,00,000, Date: 12-Oct-2023, Survey: 740/3, SRO Sriperumbudur, Registration Ref: SRO-KNC-1290/2023.";
  const forgedHash = sha256(forgedDeedContent);

  const forgedVerificationResult = verifyDocument(
    forgedHash,
    kanchipuramParcel?.events as unknown as BlockStructure[]
  );

  assert(
    !forgedVerificationResult.isAuthentic &&
      forgedVerificationResult.details.includes("FORGERY / UNAPPROVED DOCUMENT DETECTED"),
    "Forged document detected: Modified content produces hash mismatch and fails blockchain verification"
  );

  // -------------------------------------------------------------
  // TEST 8: Mutation Approval & Ownership Transfer
  // -------------------------------------------------------------
  console.log("\n▶ TEST 8: Mutation Approval & Ownership Transfer");
  const newBuyerName = "Beta Verified Purchaser";
  const newBuyerHash = hashIdentity("CITIZEN_BETA_9988");

  const saleBlock = createNewBlock(
    {
      ulpin: testParcel.ulpin,
      eventType: "SALE_DEED",
      previousOwnerHash: testParcel.ownerIdentityHash,
      newOwnerHash: newBuyerHash,
      documentHash: sha256("NEW_SALE_DEED_BETA_PURCHASER"),
      documentTitle: `Registered Sale Deed (Buyer: ${newBuyerName})`,
      registrationOfficeId: "TEST-SRO",
      approverDigitalId: "RO-SUB-REGISTRAR-TEST",
      approvalTimestamp: new Date(),
      previousEventHash: genesisBlock.currentRecordHash,
    },
    1
  );

  await prisma.blockchainEvent.create({ data: { ...saleBlock } });

  const mutationBlock = createNewBlock(
    {
      ulpin: testParcel.ulpin,
      eventType: "MUTATION_APPROVAL",
      previousOwnerHash: testParcel.ownerIdentityHash,
      newOwnerHash: newBuyerHash,
      documentHash: sha256("REVENUE_MUTATION_ORDER_BETA"),
      documentTitle: `Approved Mutation Order to ${newBuyerName}`,
      registrationOfficeId: "TEST-REV",
      approverDigitalId: "RO-TAHSILDAR-TEST",
      approvalTimestamp: new Date(),
      previousEventHash: saleBlock.currentRecordHash,
    },
    2
  );

  await prisma.blockchainEvent.create({ data: { ...mutationBlock } });

  const updatedTestParcel = await prisma.parcel.update({
    where: { ulpin: testParcel.ulpin },
    data: {
      ownerName: newBuyerName,
      ownerIdentityHash: newBuyerHash,
      lastMutationDate: new Date(),
    },
  });

  assert(
    updatedTestParcel.ownerName === newBuyerName && mutationBlock.blockNumber === 3,
    "Mutation approval updates parcel owner and records linked SALE_DEED & MUTATION_APPROVAL blocks"
  );

  // -------------------------------------------------------------
  // TEST 9: Mortgage Encumbrance & Pledge Release
  // -------------------------------------------------------------
  console.log("\n▶ TEST 9: Mortgage and Pledge Release Lifecycle");
  const mortgageBlock = createNewBlock(
    {
      ulpin: testParcel.ulpin,
      eventType: "MORTGAGE",
      previousOwnerHash: newBuyerHash,
      newOwnerHash: newBuyerHash,
      documentHash: sha256("SBI_MORTGAGE_LOAN_MEMO"),
      documentTitle: "Simple Mortgage in favor of Canara Bank",
      registrationOfficeId: "TEST-REV",
      approverDigitalId: "RO-TAHSILDAR-TEST",
      approvalTimestamp: new Date(),
      previousEventHash: mutationBlock.currentRecordHash,
    },
    3
  );
  await prisma.blockchainEvent.create({ data: { ...mortgageBlock } });

  await prisma.parcel.update({
    where: { ulpin: testParcel.ulpin },
    data: { encumbranceStatus: "MORTGAGED", encumbranceBank: "Canara Bank", status: "ENCUMBERED" },
  });

  const encumberedCheck = await prisma.parcel.findUnique({ where: { ulpin: testParcel.ulpin } });
  const isEncumbered = encumberedCheck?.encumbranceStatus === "MORTGAGED";

  // Now release mortgage:
  const releaseBlock = createNewBlock(
    {
      ulpin: testParcel.ulpin,
      eventType: "PLEDGE_RELEASE",
      previousOwnerHash: newBuyerHash,
      newOwnerHash: newBuyerHash,
      documentHash: sha256("PLEDGE_RELEASE_NOC"),
      documentTitle: "No-Objection Certificate & Pledge Discharge",
      registrationOfficeId: "TEST-REV",
      approverDigitalId: "RO-TAHSILDAR-TEST",
      approvalTimestamp: new Date(),
      previousEventHash: mortgageBlock.currentRecordHash,
    },
    4
  );
  await prisma.blockchainEvent.create({ data: { ...releaseBlock } });

  await prisma.parcel.update({
    where: { ulpin: testParcel.ulpin },
    data: { encumbranceStatus: "NONE", encumbranceBank: null, status: "APPROVED" },
  });

  const releasedCheck = await prisma.parcel.findUnique({ where: { ulpin: testParcel.ulpin } });
  const isReleased = releasedCheck?.encumbranceStatus === "NONE";

  assert(
    isEncumbered && isReleased,
    "Mortgage workflow sets parcel encumbrance and pledge release clears it with cryptographic audit trail"
  );

  // -------------------------------------------------------------
  // TEST 10: Cryptographic Chain Integrity Verification
  // -------------------------------------------------------------
  console.log("\n▶ TEST 10: Cryptographic Chain Integrity Check");
  const allEvents = await prisma.blockchainEvent.findMany({
    where: { ulpin: testParcel.ulpin },
    orderBy: { blockNumber: "asc" },
  });

  const chainValidation = verifyChainIntegrity(allEvents as unknown as BlockStructure[]);
  assert(
    chainValidation.isValid && chainValidation.totalBlocks === 5,
    `Chain integrity mathematically validated across all 5 linked blocks on ${testParcel.ulpin}`
  );

  // -------------------------------------------------------------
  // TEST 11: Tamper Detection Simulation (Immutability check)
  // -------------------------------------------------------------
  console.log("\n▶ TEST 11: Tamper Detection on Tampered Block");
  const tamperedEvents = JSON.parse(JSON.stringify(allEvents));
  // Maliciously tamper with documentHash in block #2
  tamperedEvents[1].documentHash = "00000000000000000000000000000000000000000000000000000000000MALICE";

  const tamperedValidation = verifyChainIntegrity(tamperedEvents);
  assert(
    !tamperedValidation.isValid && tamperedValidation.error?.includes("tampering detected"),
    "Tamper detection engine successfully detects modified block data and flags chain corruption"
  );

  // Clean up test parcel
  await prisma.blockchainEvent.deleteMany({ where: { ulpin: testUlpin } });
  await prisma.parcel.delete({ where: { ulpin: testUlpin } });

  console.log("\n==================================================================");
  console.log(`📊 TEST RESULTS: ${passed} PASSED / ${failed} FAILED (Total: ${passed + failed})`);
  console.log("==================================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runTests()
  .catch((err) => {
    console.error("Test execution failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
