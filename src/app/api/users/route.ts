import { UserPrismaService } from "@/services/prisma/userPrismaService";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

const userService = new UserPrismaService();

// GET handler - get all users
export async function GET() {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "QA Leader") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const users = await userService.getAllUsers();
    return NextResponse.json(users);
  } catch (error: any) {
    console.error("Error getting users:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST handler - create a user
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "QA Leader") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }
    
    const userData = await request.json();
    const newUser = await userService.createUser(userData);
    return NextResponse.json(newUser, { status: 201 });
  } catch (error: any) {
    console.error("Error creating user:", error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
