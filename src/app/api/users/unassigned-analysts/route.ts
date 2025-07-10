import { UserPrismaService } from "@/services/prisma/userPrismaService";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";

const userService = new UserPrismaService();

// GET handler - get analysts without users
export async function GET() {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "QA Leader") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const analysts = await userService.getUnassignedAnalysts();
    return NextResponse.json(analysts);
  } catch (error: any) {
    console.error("Error getting unassigned analysts:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
