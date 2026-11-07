import { NextRequest, NextResponse } from "next/server";
import { getSessionUser, verifyToken } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    // Check Authorization header first (for API/Bearer token), then cookie
    let user = null;
    const authHeader = req.headers.get("authorization");
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.substring(7);
      user = verifyToken(token);
    }

    if (!user) {
      user = await getSessionUser();
    }

    if (!user) {
      return NextResponse.json({ authenticated: false, user: null });
    }

    return NextResponse.json({ authenticated: true, user });
  } catch (error) {
    return NextResponse.json({ authenticated: false, user: null });
  }
}
