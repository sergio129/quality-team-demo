import { UserPrismaService } from "@/services/prisma/userPrismaService";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

const userService = new UserPrismaService();

// GET handler - get user by id
export async function GET(request: NextRequest) {
  try {
    // Extraer el ID directamente de la URL
    const id = request.url.split('/').pop() as string;
    
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "QA Leader") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const user = await userService.getUserById(id);
    if (!user) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error: any) {
    console.error("Error getting user:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT handler - update user
export async function PUT(request: NextRequest) {
  try {
    // Extraer el ID directamente de la URL
    const id = request.url.split('/').pop() as string;
    
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "QA Leader") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }
    
    const userData = await request.json();
    const updatedUser = await userService.updateUser(id, userData);

    if (!updatedUser) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    return NextResponse.json(updatedUser);
  } catch (error: any) {
    console.error("Error updating user:", error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

// DELETE handler - delete user
export async function DELETE(request: NextRequest) {
  try {
    // Extraer el ID directamente de la URL
    const id = request.url.split('/').pop() as string;
    
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "QA Leader") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const deleted = await userService.deleteUser(id);
    if (!deleted) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    return NextResponse.json({ message: "Usuario eliminado correctamente" });
  } catch (error: any) {
    console.error("Error deleting user:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
