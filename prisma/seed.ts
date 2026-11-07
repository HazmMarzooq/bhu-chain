import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import {
  sha256,
  hashIdentity,
  createNewBlock,
  GENESIS_PREV_HASH,
} from "../src/lib/blockchain/bhu-chain";
import { generateParcelQRCode } from "../src/lib/qr";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting Bhu-Chain database seeding...");

  // 1. Clear existing data
  await prisma.auditLog.deleteMany({});
  await prisma.blockchainEvent.deleteMany({});
  await prisma.workflowRequest.deleteMany({});
  await prisma.parcel.deleteMany({});
  await prisma.user.deleteMany({});

  console.log("🧹 Cleaned old records.");

  // 2. Create Users for all 6 Roles
  const defaultPasswordHash = await bcrypt.hash("demo@123", 10);

  const users = [
    {
      email: "citizen@bhuchain.gov.in",
      name: "Hazm Marzooq (Citizen)",
      password: defaultPasswordHash,
      role: "CITIZEN",
      designation: "Land Owner & Citizen",
      officeId: null,
    },
    {
      email: "registrar@bhuchain.gov.in",
      name: "K. Raghunathan (Sub-Registrar)",
      password: defaultPasswordHash,
      role: "SUB_REGISTRAR",
      designation: "Joint Sub-Registrar II",
      officeId: "TN-NGP-SRO-01",
    },
    {
      email: "revenue@bhuchain.gov.in",
      name: "Dr. S. Meenakshi (Tahsildar)",
      password: defaultPasswordHash,
      role: "REVENUE_OFFICER",
      designation: "Tahsildar & Executive Magistrate",
      officeId: "TN-REV-TALUK-04",
    },
    {
      email: "bank@sbi.co.in",
      name: "V. Anand (Chief Manager, SBI)",
      password: defaultPasswordHash,
      role: "BANK_OFFICER",
      designation: "Chief Manager (Credit & Mortgages)",
      officeId: "SBI-SARB-042",
    },
    {
      email: "auditor@cag.gov.in",
      name: "P. Sundaram (Auditor General)",
      password: defaultPasswordHash,
      role: "AUDITOR",
      designation: "Senior State Revenue Auditor",
      officeId: "CAG-TN-STATE-AUDIT",
    },
    {
      email: "admin@bhuchain.gov.in",
      name: "National Portal Administrator",
      password: defaultPasswordHash,
      role: "ADMIN",
      designation: "Principal Technical Director, NIC",
      officeId: "HQ-NEW-DELHI",
    },
  ];

  for (const u of users) {
    await prisma.user.create({ data: u });
  }
  console.log(`✅ Seeded ${users.length} role-based users (password: demo@123).`);

  // 3. Define 10 Realistic Tamil Nadu Land Parcels
  // 5 Clean, 2 Mortgaged, 2 Disputed, 1 Forged-Document Test Case
  const parcelsData = [
    // --- 5 CLEAN PARCELS ---
    {
      ulpin: "33-019-042-00101",
      state: "Tamil Nadu",
      district: "Nagapattinam",
      taluk: "Nagapattinam",
      village: "Thevur",
      surveyNumber: "142",
      subdivisionNumber: "2A",
      areaInSqMeters: 4047.0, // 1 Acre
      landType: "AGRICULTURAL",
      ownerName: "S. Hazm Marzooq",
      ownerIdRaw: "IND-TN-902562-HZ",
      contactMasked: "+91 90*** **452",
      latitude: 10.7656,
      longitude: 79.8424,
      status: "APPROVED",
      encumbranceStatus: "NONE",
      disputeStatus: "NONE",
      history: [
        {
          type: "PARCEL_REGISTRATION",
          title: "Government Settlement Title Record (G.O. 1994)",
          docText: "GOV_PATTA_ORIGINAL_SETTLEMENT_RECORD_142_2A_NAGAPATTINAM",
          officer: "RO-MEENAKSHI",
          office: "TN-NGP-REV",
          prevOwnerHash: "0000000000000000000000000000000000000000000000000000000000000000",
        },
      ],
    },
    {
      ulpin: "33-021-018-00204",
      state: "Tamil Nadu",
      district: "Thanjavur",
      taluk: "Kumbakonam",
      village: "Thirunageswaram",
      surveyNumber: "88",
      subdivisionNumber: "1B",
      areaInSqMeters: 2023.5, // 0.5 Acre
      landType: "AGRICULTURAL",
      ownerName: "R. Sundaramurthy",
      ownerIdRaw: "IND-TN-771249-SM",
      contactMasked: "+91 94*** **810",
      latitude: 10.9632,
      longitude: 79.4312,
      status: "APPROVED",
      encumbranceStatus: "NONE",
      disputeStatus: "NONE",
      history: [
        {
          type: "PARCEL_REGISTRATION",
          title: "Ancestral Patta Settlement Registration",
          docText: "PATTA_REG_88_1B_THIRUNAGESWARAM_THANJAVUR",
          officer: "RO-THANJAVUR",
          office: "TN-TNJ-REV",
          prevOwnerHash: "0000000000000000000000000000000000000000000000000000000000000000",
        },
      ],
    },
    {
      ulpin: "33-002-005-00315",
      state: "Tamil Nadu",
      district: "Chennai",
      taluk: "Guindy",
      village: "Alandur",
      surveyNumber: "304",
      subdivisionNumber: "4",
      areaInSqMeters: 650.0, // Commercial plot
      landType: "COMMERCIAL",
      ownerName: "Priya Krishnan",
      ownerIdRaw: "IND-TN-452109-PK",
      contactMasked: "+91 98*** **331",
      latitude: 13.0067,
      longitude: 80.2026,
      status: "APPROVED",
      encumbranceStatus: "NONE",
      disputeStatus: "NONE",
      history: [
        {
          type: "PARCEL_REGISTRATION",
          title: "Urban Land Ceiling Clearance and Baseline Registration",
          docText: "BASELINE_DEED_ALANDUR_GUINDY_CHENNAI_304_4",
          officer: "RO-CHENNAI-CENTRAL",
          office: "TN-CHN-REV",
          prevOwnerHash: "0000000000000000000000000000000000000000000000000000000000000000",
        },
        {
          type: "SALE_DEED",
          title: "Registered Absolute Sale Deed Doc No. 412/2022",
          docText: "APPROVED_SALE_DEED_CHENNAI_COMMERCIAL_PRIYA_KRISHNAN",
          officer: "SRO-GUINDY-02",
          office: "TN-CHN-SRO",
          prevOwnerHash: hashIdentity("PREV_OWNER_K_RAMANATHAN"),
        },
        {
          type: "MUTATION_APPROVAL",
          title: "Revenue Mutation Order No. CHN-REV-2022-8901",
          docText: "MUTATION_ORDER_PATTA_TRANSFER_PRIYA_KRISHNAN",
          officer: "RO-CHENNAI-CENTRAL",
          office: "TN-CHN-REV",
          prevOwnerHash: hashIdentity("PREV_OWNER_K_RAMANATHAN"),
        },
      ],
    },
    {
      ulpin: "33-012-009-00408",
      state: "Tamil Nadu",
      district: "Coimbatore",
      taluk: "Coimbatore North",
      village: "Saravanampatti",
      surveyNumber: "215",
      subdivisionNumber: "3C",
      areaInSqMeters: 450.0,
      landType: "RESIDENTIAL",
      ownerName: "K. Balaji",
      ownerIdRaw: "IND-TN-621804-KB",
      contactMasked: "+91 97*** **902",
      latitude: 11.0805,
      longitude: 76.9942,
      status: "APPROVED",
      encumbranceStatus: "NONE",
      disputeStatus: "NONE",
      history: [
        {
          type: "PARCEL_REGISTRATION",
          title: "DTCP Approved Residential Layout Baseline Record",
          docText: "DTCP_APPROVED_LAYOUT_SARAVANAMPATTI_215_3C",
          officer: "RO-CBE-NORTH",
          office: "TN-CBE-REV",
          prevOwnerHash: "0000000000000000000000000000000000000000000000000000000000000000",
        },
      ],
    },
    {
      ulpin: "33-024-015-00512",
      state: "Tamil Nadu",
      district: "Madurai",
      taluk: "Madurai South",
      village: "Thirunagar",
      surveyNumber: "419",
      subdivisionNumber: "2",
      areaInSqMeters: 557.4, // 6000 sq ft
      landType: "RESIDENTIAL",
      ownerName: "M. Selvakumar",
      ownerIdRaw: "IND-TN-981240-MS",
      contactMasked: "+91 99*** **118",
      latitude: 9.8794,
      longitude: 78.0706,
      status: "APPROVED",
      encumbranceStatus: "NONE",
      disputeStatus: "NONE",
      history: [
        {
          type: "PARCEL_REGISTRATION",
          title: "Approved Patta Record Madurai South",
          docText: "GOV_PATTA_THIRUNAGAR_419_2_MADURAI",
          officer: "RO-MDU-SOUTH",
          office: "TN-MDU-REV",
          prevOwnerHash: "0000000000000000000000000000000000000000000000000000000000000000",
        },
      ],
    },

    // --- 2 MORTGAGED (ENCUMBERED) PARCELS ---
    {
      ulpin: "33-015-008-00620",
      state: "Tamil Nadu",
      district: "Tiruchirappalli",
      taluk: "Srirangam",
      village: "Vellithirumutham",
      surveyNumber: "176",
      subdivisionNumber: "5A",
      areaInSqMeters: 800.0,
      landType: "RESIDENTIAL",
      ownerName: "N. Govindarajan",
      ownerIdRaw: "IND-TN-340912-NG",
      contactMasked: "+91 94*** **201",
      latitude: 10.8624,
      longitude: 78.6946,
      status: "ENCUMBERED",
      encumbranceStatus: "MORTGAGED",
      encumbranceBank: "State Bank of India (SBI Srirangam Branch)",
      disputeStatus: "NONE",
      history: [
        {
          type: "PARCEL_REGISTRATION",
          title: "Original Title Deed Srirangam Revenue Division",
          docText: "TITLE_DEED_SRIRANGAM_176_5A_TRICHY",
          officer: "RO-SRIRANGAM",
          office: "TN-TRI-REV",
          prevOwnerHash: "0000000000000000000000000000000000000000000000000000000000000000",
        },
        {
          type: "MORTGAGE",
          title: "Registered Simple Mortgage Deed in favor of SBI (Loan: ₹45,00,000)",
          docText: "SBI_REGISTERED_MORTGAGE_DEED_LOAN_4500000_GOVINDARAJAN",
          officer: "RO-SRIRANGAM",
          office: "TN-TRI-SRO",
          prevOwnerHash: hashIdentity("IND-TN-340912-NG"),
        },
      ],
    },
    {
      ulpin: "33-008-011-00735",
      state: "Tamil Nadu",
      district: "Salem",
      taluk: "Salem West",
      village: "Hasthampatti",
      surveyNumber: "512",
      subdivisionNumber: "1",
      areaInSqMeters: 1400.0,
      landType: "COMMERCIAL",
      ownerName: "T. Venkatachalam",
      ownerIdRaw: "IND-TN-892147-TV",
      contactMasked: "+91 96*** **445",
      latitude: 11.6643,
      longitude: 78.146,
      status: "ENCUMBERED",
      encumbranceStatus: "MORTGAGED",
      encumbranceBank: "Canara Bank (Salem Main Branch)",
      disputeStatus: "NONE",
      history: [
        {
          type: "PARCEL_REGISTRATION",
          title: "Commercial Plot Patta Baseline Record",
          docText: "BASELINE_HASTHAMPATTI_512_1_SALEM",
          officer: "RO-SALEM-WEST",
          office: "TN-SLM-REV",
          prevOwnerHash: "0000000000000000000000000000000000000000000000000000000000000000",
        },
        {
          type: "MORTGAGE",
          title: "Equitable Mortgage Deed Deposit of Title Deeds (Loan: ₹85,00,000)",
          docText: "CANARA_BANK_COMMERCIAL_MORTGAGE_SALEM_VENKATACHALAM",
          officer: "RO-SALEM-WEST",
          office: "TN-SLM-SRO",
          prevOwnerHash: hashIdentity("IND-TN-892147-TV"),
        },
      ],
    },

    // --- 2 DISPUTED PARCELS ---
    {
      ulpin: "33-028-014-00840",
      state: "Tamil Nadu",
      district: "Tirunelveli",
      taluk: "Palayamkottai",
      village: "Kulavanigarpuram",
      surveyNumber: "329",
      subdivisionNumber: "4B",
      areaInSqMeters: 3200.0,
      landType: "AGRICULTURAL",
      ownerName: "A. Muthukrishnan",
      ownerIdRaw: "IND-TN-112048-AM",
      contactMasked: "+91 91*** **874",
      latitude: 8.7139,
      longitude: 77.7567,
      status: "DISPUTED",
      encumbranceStatus: "NONE",
      disputeStatus: "ACTIVE_DISPUTE",
      disputeDetails: "Interim Injunction Order in Sub-Court O.S. No. 142/2024: Boundary and Title Partition Dispute between co-heirs.",
      history: [
        {
          type: "PARCEL_REGISTRATION",
          title: "Ancestral Agricultural Title Record",
          docText: "ORIGINAL_RECORD_KULAVANIGARPURAM_329_4B_TIRUNELVELI",
          officer: "RO-PALAYAMKOTTAI",
          office: "TN-TNV-REV",
          prevOwnerHash: "0000000000000000000000000000000000000000000000000000000000000000",
        },
        {
          type: "DISPUTE_FLAG",
          title: "Judicial Court Injunction Order in O.S. 142/2024",
          docText: "SUB_COURT_INJUNCTION_ORDER_OS_142_2024_PALAYAMKOTTAI",
          officer: "COURT-REGISTRAR-TIRUNELVELI",
          office: "COURT-SUB-TNV",
          prevOwnerHash: hashIdentity("IND-TN-112048-AM"),
        },
      ],
    },
    {
      ulpin: "33-010-007-00955",
      state: "Tamil Nadu",
      district: "Erode",
      taluk: "Perundurai",
      village: "Vijayapuri",
      surveyNumber: "602",
      subdivisionNumber: "1A",
      areaInSqMeters: 5000.0,
      landType: "INDUSTRIAL",
      ownerName: "C. Shanmugam",
      ownerIdRaw: "IND-TN-552091-CS",
      contactMasked: "+91 95*** **663",
      latitude: 11.2789,
      longitude: 77.5855,
      status: "DISPUTED",
      encumbranceStatus: "NONE",
      disputeStatus: "ACTIVE_DISPUTE",
      disputeDetails: "Pending Revenue Divisional Officer (RDO) Title Rectification & Encroachment Hearing (Case No. RDO/ERD/2024/771).",
      history: [
        {
          type: "PARCEL_REGISTRATION",
          title: "SIPCOT Adjacent Industrial Plot Baseline Record",
          docText: "INDUSTRIAL_PATTA_VIJAYAPURI_602_1A_ERODE",
          officer: "RO-PERUNDURAI",
          office: "TN-ERD-REV",
          prevOwnerHash: "0000000000000000000000000000000000000000000000000000000000000000",
        },
        {
          type: "DISPUTE_FLAG",
          title: "RDO Statutory Inquiry and Stay Order No. RDO/ERD/2024/771",
          docText: "RDO_STAY_ORDER_ENCROACHMENT_INQUIRY_ERODE_602",
          officer: "RDO-ERODE-DIVISION",
          office: "TN-ERD-RDO",
          prevOwnerHash: hashIdentity("IND-TN-552091-CS"),
        },
      ],
    },

    // --- 1 FORGED-DOCUMENT TEST CASE PARCEL ---
    {
      ulpin: "33-003-012-01099",
      state: "Tamil Nadu",
      district: "Kanchipuram",
      taluk: "Sriperumbudur",
      village: "Irungattukottai",
      surveyNumber: "740",
      subdivisionNumber: "3",
      areaInSqMeters: 2400.0,
      landType: "COMMERCIAL",
      ownerName: "Rajesh Varma",
      ownerIdRaw: "IND-TN-998811-RV",
      contactMasked: "+91 98*** **770",
      latitude: 12.9814,
      longitude: 79.9732,
      status: "APPROVED",
      encumbranceStatus: "NONE",
      disputeStatus: "NONE",
      history: [
        {
          type: "PARCEL_REGISTRATION",
          title: "Commercial Warehouse Zone Patta Registration",
          docText: "PATTA_RECORD_SRIPERUMBUDUR_740_3_KANCHIPURAM",
          officer: "RO-SRIPERUMBUDUR",
          office: "TN-KNC-REV",
          prevOwnerHash: "0000000000000000000000000000000000000000000000000000000000000000",
        },
        {
          type: "SALE_DEED",
          title: "Authentic Approved Sale Deed No. 1290/2023 (Verified On-Chain)",
          // The genuine approved document text:
          docText: "AUTHENTIC_APPROVED_SALE_DEED_CONTENT: Seller: V. Narayanan, Buyer: Rajesh Varma, Consideration: INR 1,50,00,000, Date: 12-Oct-2023, Survey: 740/3, SRO Sriperumbudur, Registration Ref: SRO-KNC-1290/2023.",
          officer: "SRO-SRIPERUMBUDUR-01",
          office: "TN-KNC-SRO",
          prevOwnerHash: hashIdentity("V_NARAYANAN_ORIGINAL_OWNER"),
        },
        {
          type: "MUTATION_APPROVAL",
          title: "Revenue Mutation Order No. KNC/REV/2023/1290",
          docText: "MUTATION_ORDER_PATTA_TRANSFER_TO_RAJESH_VARMA_740_3",
          officer: "RO-SRIPERUMBUDUR",
          office: "TN-KNC-REV",
          prevOwnerHash: hashIdentity("V_NARAYANAN_ORIGINAL_OWNER"),
        },
      ],
    },
  ];

  console.log("📍 Creating parcels and generating cryptographically linked blockchains...");

  for (const p of parcelsData) {
    const ownerIdentityHash = hashIdentity(p.ownerIdRaw);
    const mapReferenceHash = sha256(
      `GIS:${p.state}:${p.district}:${p.taluk}:${p.village}:${p.surveyNumber}:${p.subdivisionNumber}`
    );
    const qrCodeUrl = await generateParcelQRCode(p.ulpin);

    const parcel = await prisma.parcel.create({
      data: {
        ulpin: p.ulpin,
        state: p.state,
        district: p.district,
        taluk: p.taluk,
        village: p.village,
        surveyNumber: p.surveyNumber,
        subdivisionNumber: p.subdivisionNumber,
        areaInSqMeters: p.areaInSqMeters,
        landType: p.landType,
        mapReferenceHash,
        latitude: p.latitude,
        longitude: p.longitude,
        ownerName: p.ownerName,
        ownerIdentityHash,
        ownerContactMasked: p.contactMasked,
        status: p.status,
        encumbranceStatus: p.encumbranceStatus,
        encumbranceBank: (p as any).encumbranceBank || null,
        disputeStatus: p.disputeStatus,
        disputeDetails: (p as any).disputeDetails || null,
        qrCodeUrl,
      },
    });

    // Build the sequential, cryptographically linked blockchain events
    let prevHash = GENESIS_PREV_HASH;
    let blockHeight = 0;

    for (const h of p.history) {
      const docHash = sha256(h.docText);
      const eventTimestamp = new Date(Date.now() - (p.history.length - blockHeight) * 86400000 * 30);

      const block = createNewBlock(
        {
          ulpin: parcel.ulpin,
          eventType: h.type as any,
          previousOwnerHash: h.prevOwnerHash,
          newOwnerHash: ownerIdentityHash,
          documentHash: docHash,
          documentTitle: h.title,
          registrationOfficeId: h.office,
          approverDigitalId: h.officer,
          approvalTimestamp: eventTimestamp,
          previousEventHash: prevHash,
          metadata: {
            surveyNumber: p.surveyNumber,
            village: p.village,
            area: p.areaInSqMeters,
          },
        },
        blockHeight
      );

      await prisma.blockchainEvent.create({
        data: {
          eventId: block.eventId,
          blockNumber: block.blockNumber,
          ulpin: block.ulpin,
          eventType: block.eventType,
          previousOwnerHash: block.previousOwnerHash,
          newOwnerHash: block.newOwnerHash,
          documentHash: block.documentHash,
          documentTitle: block.documentTitle,
          registrationOfficeId: block.registrationOfficeId,
          approverDigitalId: block.approverDigitalId,
          approvalTimestamp: block.approvalTimestamp,
          previousEventHash: block.previousEventHash,
          currentRecordHash: block.currentRecordHash,
          digitalSignature: block.digitalSignature,
          metadataJson: block.metadataJson,
        },
      });

      prevHash = block.currentRecordHash;
      blockHeight++;
    }

    // Add sample workflow request for demonstration
    if (p.encumbranceStatus === "MORTGAGED") {
      await prisma.workflowRequest.create({
        data: {
          ulpin: p.ulpin,
          requestType: "MORTGAGE",
          status: "APPROVED",
          requestedByUserId: "bank-officer",
          requestedByName: "V. Anand (Chief Manager, SBI)",
          bankName: (p as any).encumbranceBank,
          loanAmount: 4500000,
          documentTitle: "Mortgage Sanction Memo & Deed Copy",
          documentHash: sha256("SBI_SANCTION_MEMO_4500000"),
          remarks: "Registered simple mortgage under SARFAESI & Registration Act.",
        },
      });
    }

    if (p.disputeStatus === "ACTIVE_DISPUTE") {
      await prisma.workflowRequest.create({
        data: {
          ulpin: p.ulpin,
          requestType: "DISPUTE",
          status: "APPROVED",
          requestedByUserId: "court-registrar",
          requestedByName: "Court of Subordinate Judge",
          disputeReason: (p as any).disputeDetails,
          documentTitle: "Court Injunction Order & Summons Notice",
          documentHash: sha256("COURT_ORDER_SUMMONS_142_2024"),
          remarks: "Statutory bar on transfers imposed by Judicial Order.",
        },
      });
    }

    console.log(`  ✓ Parcel ${p.ulpin} (${p.district}) seeded with ${p.history.length} blocks.`);
  }

  // 4. Initial Audit Logs
  await prisma.auditLog.create({
    data: {
      action: "GENESIS_SYSTEM_INITIALIZATION",
      performedBy: "National Portal Administrator",
      userRole: "ADMIN",
      details: "Bhu-Chain platform initialized. 10 pilot parcels and state genesis records created for Tamil Nadu.",
      ipAddress: "127.0.0.1",
    },
  });

  console.log("🎉 Seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
