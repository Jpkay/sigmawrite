import { PageHeader } from "@/components/page";
import { UserManagementConsole } from "@/components/user-management-console";
import { getUserManagementData } from "@/lib/db/users";
import { resolveInitialUserManagementSelection, type UserManagementSearchParams } from "@/lib/user-management-boundaries";

export default async function AdminUsersPage({ searchParams }: { searchParams: Promise<UserManagementSearchParams> }) {
  const data = await getUserManagementData();
  const initialSelection = resolveInitialUserManagementSelection(data, await searchParams);
  return <>
    <PageHeader title="Utilisateurs et accès" description="Créez des identifiants temporaires, attribuez les élèves et gérez les superviseurs." />
    <UserManagementConsole data={data} {...initialSelection} />
  </>;
}
