import { UserPrismaService } from "@/services/prisma/userPrismaService";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

const userService = new UserPrismaService();

// GET handler - get analysts without users
export async function GET() {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Debe iniciar sesión para acceder a esta función" }, { status: 403 });
    }
    
    if (session.user.role !== "QA Leader") {
      return NextResponse.json({ error: "Solo administradores pueden acceder a esta función" }, { status: 403 });
    }

    const analysts = await userService.getUnassignedAnalysts();
    return NextResponse.json(analysts);
  } catch (error: any) {
    console.error("Error getting unassigned analysts:", error);
    // Proporcionar más información sobre el error
    const errorMessage = error.message || "Error interno del servidor";
    const errorDetails = error.stack ? { stack: error.stack } : {};
    
    return NextResponse.json({ 
      error: errorMessage,
      details: errorDetails,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
