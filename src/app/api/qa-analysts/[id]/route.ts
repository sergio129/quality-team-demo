import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

// GET handler - get QA Analyst by id
export async function GET(request: NextRequest) {
  try {
    // Extraer el ID directamente de la URL
    const id = request.url.split('/').pop() as string;

    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    // Only QA Leader can access all analysts
    // QA Analyst and QA Senior can only access their own analyst data
    if (session.user.role !== "QA Leader" && session.user.analystId !== id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const analyst = await prisma.qAAnalyst.findUnique({
      where: { id: id },
    });

    if (!analyst) {
      return NextResponse.json({ error: "Analista no encontrado" }, { status: 404 });
    }

    return NextResponse.json(analyst);
  } catch (error: any) {
    console.error("Error getting QA Analyst:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
