import { getCurrentUser } from "@/lib/auth";
import { AdminNav } from "@/components/AdminHeader";

export async function AdminHeader() {
  const user = await getCurrentUser();
  return <AdminNav email={user?.email ?? null} isSuperadmin={user?.isSuperadmin === true} />;
}
