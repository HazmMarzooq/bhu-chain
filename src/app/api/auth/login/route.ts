import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { comparePassword, signToken, Role } from "@/lib/auth";
import { recordAuditLog } from "@/lib/audit";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password, role } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    // Find user by email
    let user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Role check if provided
    if (role && user.role !== role) {
      return NextResponse.json(
        { error: `Account exists but does not have the role: ${role}` },
        { status: 403 }
      );
    }

    const isValidPassword = await comparePassword(password, user.password);
    if (!isValidPassword) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    const sessionUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role as Role,
      designation: user.designation,
      officeId: user.officeId,
    };

    const token = signToken(sessionUser);

    await recordAuditLog({
      action: "USER_LOGIN",
      performedBy: user.name,
      userRole: user.role,
      details: `User logged in with role ${user.role} from office ${user.officeId || "N/A"}`,
    });

    const response = NextResponse.json({
      success: true,
      user: sessionUser,
      token,
    });

    // Set secure HTTP-only cookie
    response.cookies.set({
      name: "bhu_token",
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

    return response;
  } catch (error: any) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Internal server error during authentication" },
      { status: 500 }
    );
  }
}
