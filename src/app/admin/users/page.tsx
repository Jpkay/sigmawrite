import { PageHeader } from "@/components/page";
import { UserManagementConsole } from "@/components/user-management-console";
import { getUserManagementData } from "@/lib/db/users";

export default async function AdminUsersPage() {
  const data = await getUserManagementData();
  return <>
    <PageHeader title="Utilisateurs et accès" description="Créez des identifiants temporaires, attribuez les élèves et gérez les superviseurs." />
    <UserManagementConsole data={data} />
  </>;
}
