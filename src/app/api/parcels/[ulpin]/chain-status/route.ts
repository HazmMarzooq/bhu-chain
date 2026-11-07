import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyChainIntegrity, BlockStructure } from "@/lib/blockchain/bhu-chain";

export async function GET(
  req: NextRequest,
  { params }: { params: { ulpin: string } }
) {
  try {
    const ulpin = params.ulpin.trim().toUpperCase();

    const events = await prisma.blockchainEvent.findMany({
      where: { ulpin },
      orderBy: { blockNumber: "asc" },
    });

    if (events.length === 0) {
      return NextResponse.json({
        success: true,
        ulpin,
        isValid: true,
        totalBlocks: 0,
        message: "No blocks recorded yet.",
      });
    }

    const verification = verifyChainIntegrity(events as unknown as BlockStructure[]);

    return NextResponse.json({
      success: true,
      ulpin,
      ...verification,
    });
  } catch (error: any) {
    console.error("chain-status error:", error);
    return NextResponse.json(
      { error: "Error checking blockchain status" },
      { status: 500 }
    );
  }
}
