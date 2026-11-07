import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { hashIdentity, sha256 } from "@/lib/blockchain/bhu-chain";
import { generateParcelQRCode } from "@/lib/qr";
import { recordAuditLog } from "@/lib/audit";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.trim();
    const district = searchParams.get("district")?.trim();
    const status = searchParams.get("status")?.trim();
    const encumbrance = searchParams.get("encumbrance")?.trim();
    const dispute = searchParams.get("dispute")?.trim();

    const where: any = {};

    if (search) {
      where.OR = [
        { ulpin: { contains: search } },
        { surveyNumber: { contains: search } },
        { village: { contains: search } },
        { ownerName: { contains: search } },
      ];
    }

    if (district && district !== "ALL") {
      where.district = district;
    }

    if (status && status !== "ALL") {
      where.status = status;
    }

    if (encumbrance && encumbrance !== "ALL") {
      where.encumbranceStatus = encumbrance;
    }

    if (dispute && dispute !== "ALL") {
      where.disputeStatus = dispute;
    }

    const parcels = await prisma.parcel.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: { events: true },
        },
      },
    });

    return NextResponse.json({
      success: true,
      count: parcels.length,
      parcels,
    });
  } catch (error: any) {
    console.error("GET /api/parcels error:", error);
    return NextResponse.json(
      { error: "Failed to fetch parcels" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || (user.role !== "ADMIN" && user.role !== "REVENUE_OFFICER")) {
      return NextResponse.json(
        { error: "Unauthorized. Admin or Revenue Officer role required." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const {
      ulpin,
      state = "Tamil Nadu",
      district,
      taluk,
      village,
      surveyNumber,
      subdivisionNumber,
      areaInSqMeters,
      landType,
      ownerName,
      ownerIdentityNumber, // raw id received once, immediately hashed, NEVER stored
      ownerContactMasked,
      latitude,
      longitude,
    } = body;

    if (!ulpin || !district || !taluk || !village || !surveyNumber || !ownerName) {
      return NextResponse.json(
        { error: "Missing required parcel fields" },
        { status: 400 }
      );
    }

    // Check for duplicate ULPIN
    const existing = await prisma.parcel.findUnique({
      where: { ulpin: ulpin.trim().toUpperCase() },
    });

    if (existing) {
      return NextResponse.json(
        { error: `Parcel with ULPIN ${ulpin} already exists on the registry.` },
        { status: 409 }
      );
    }

    // Hash owner identity (No raw Aadhaar stored on-chain or in DB)
    const ownerIdentityHash = hashIdentity(ownerIdentityNumber || `${ownerName}_ID`);
    const mapReferenceHash = sha256(`GIS:${state}:${district}:${taluk}:${village}:${surveyNumber}:${subdivisionNumber}`);
    const qrCodeUrl = await generateParcelQRCode(ulpin);

    // Create the parcel record
    const parcel = await prisma.parcel.create({
      data: {
        ulpin: ulpin.trim().toUpperCase(),
        state,
        district,
        taluk,
        village,
        surveyNumber,
        subdivisionNumber: subdivisionNumber || "1",
        areaInSqMeters: parseFloat(areaInSqMeters) || 1200.0,
        landType: landType || "AGRICULTURAL",
        mapReferenceHash,
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
        ownerName,
        ownerIdentityHash,
        ownerContactMasked: ownerContactMasked || "+91 98*** **000",
        status: "APPROVED",
        encumbranceStatus: "NONE",
        disputeStatus: "NONE",
        qrCodeUrl,
      },
    });

    // Create genesis blockchain block for this parcel
    const blockNumber = 1;
    const documentHash = sha256(`GOV_PATTA_TITLE_DEED_${parcel.ulpin}_${ownerName}`);
    const approvalTimestamp = new Date();

    const { createNewBlock, GENESIS_PREV_HASH } = await import("@/lib/blockchain/bhu-chain");

    const block = createNewBlock(
      {
        ulpin: parcel.ulpin,
        eventType: "PARCEL_REGISTRATION",
        previousOwnerHash: "0000000000000000000000000000000000000000000000000000000000000000",
        newOwnerHash: ownerIdentityHash,
        documentHash,
        documentTitle: `Government Land Title Deed Registration (${parcel.district})`,
        registrationOfficeId: user.officeId || "TN-SRO-HQ",
        approverDigitalId: `OFFICER-${user.name.toUpperCase().replace(/\s+/g, "_")}`,
        approvalTimestamp,
        previousEventHash: GENESIS_PREV_HASH,
        metadata: {
          surveyNumber,
          subdivisionNumber,
          area: parcel.areaInSqMeters,
          landType: parcel.landType,
        },
      },
      0
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

    await recordAuditLog({
      action: "PARCEL_ONBOARDED",
      performedBy: user.name,
      userRole: user.role,
      ulpin: parcel.ulpin,
      details: `Onboarded new land parcel ${parcel.ulpin} in ${village}, ${taluk}, ${district}. Genesis block appended.`,
    });

    return NextResponse.json({
      success: true,
      message: "Parcel onboarded and Genesis block created on blockchain ledger.",
      parcel,
    });
  } catch (error: any) {
    console.error("POST /api/parcels error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to onboard parcel" },
      { status: 500 }
    );
  }
}
