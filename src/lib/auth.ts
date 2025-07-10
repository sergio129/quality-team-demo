import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

/**
 * Returns the current session
 */
export async function getSession() {
  return await getServerSession(authOptions);
}

/**
 * Returns the current authenticated user or null
 */
export async function getCurrentUser() {
  const session = await getSession();
  return session?.user;
}

/**
 * Use this in server components or Server Actions to check for authentication
 * Redirects to login if not authenticated
 */
export async function requireAuth() {
  const user = await getCurrentUser();
  
  if (!user) {
    redirect("/login");
  }
  
  return user;
}

/**
 * Use this in server components or Server Actions to check for admin role
 * Redirects to homepage if not admin
 */
export async function requireAdmin() {
  const user = await requireAuth();
  
  if (user.role !== "QA Leader") {
    redirect("/");
  }
  
  return user;
}

/**
 * Checks if a user has access to a specific project
 */
export async function hasProjectAccess(projectId: string) {
  const user = await getCurrentUser();
  
  if (!user) return false;
  
  // Admin has access to all projects
  if (user.role === "QA Leader") return true;
  
  // For non-admin users, we need to check if they're assigned to the project
  if (user.analystId) {
    // This would need to be implemented using the project service to check
    // if the analyst is assigned to this specific project
    // For now, return false as we need to implement this logic
    return false;
  }
  
  return false;
}
