import { requireAdmin } from "@/lib/auth";
import UsersPage from "./page-client";

export default async function UserAdminPage() {
  // Check admin permissions
  await requireAdmin();
  
  return <UsersPage />;
}
