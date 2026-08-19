import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { adminMe, AdminApiError } from '@/lib/admin-api';
import AdminShell from '@/components/admin/AdminShell';

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const cookieHeader = (await cookies()).toString();
  let me;
  try {
    me = await adminMe(cookieHeader);
  } catch (e) {
    if (e instanceof AdminApiError && e.status === 401) redirect('/admin/login');
    throw e;
  }
  return <AdminShell username={me.username}>{children}</AdminShell>;
}
