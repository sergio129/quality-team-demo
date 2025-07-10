import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

// GET handler - get all QA Analysts
export async function GET() {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "QA Leader") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const analysts = await prisma.qAAnalyst.findMany({
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            isActive: true
          }
        }
      }
    });

    return NextResponse.json(analysts);
  } catch (error: any) {
    console.error("Error getting QA Analysts:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
