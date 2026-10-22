import Link from "next/link";
import { requireSuperadmin } from "@/lib/auth";
import { loadDataset, profileName } from "@/lib/admin/data";
import { userActivity } from "@/lib/admin/stats";
import { Avatar } from "@/components/Avatar";

export default async function UsersPage() {
  await requireSuperadmin();
  const data = await loadDataset();
  const activity = userActivity(data);

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-5 px-4 py-7 sm:px-8">
      <div>
        <span className="eyebrow">Users</span>
        <h1 className="title mt-1 text-[28px] leading-tight">{data.profiles.length} profiles</h1>
        <p className="mt-1 text-[12px] text-subtle">Read only. Superadmin is set in the database.</p>
      </div>
      <div className="card overflow-x-auto">
        <table className="w-full text-left text-[13px]">
          <thead className="text-[11px] uppercase tracking-[0.1em] text-muted">
            <tr className="border-b border-hairline">
              <th className="px-3 py-2">User</th>
              <th className="px-3 py-2">Email</th>
              <th className="px-3 py-2">Joined</th>
              <th className="px-3 py-2 text-right">Posts</th>
              <th className="px-3 py-2 text-right">Likes given</th>
              <th className="px-3 py-2 text-right">Likes received</th>
              <th className="px-3 py-2">Role</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-hairline">
            {data.profiles.map((p) => {
              const a = activity.get(p.id);
              return (
                <tr key={p.id}>
                  <td className="px-3 py-2">
                    <Link href={`/users/${p.id}`} className="flex items-center gap-2 font-bold text-ink hover:underline">
                      <Avatar url={p.avatar_url} name={profileName(p)} size={24} />
                      {profileName(p)}
                    </Link>
                  </td>
                  <td className="px-3 py-2 text-subtle">{p.email}</td>
                  <td className="px-3 py-2 text-subtle">{p.created_at.slice(0, 10)}</td>
                  <td className="px-3 py-2 text-right">{a?.posts ?? 0}</td>
                  <td className="px-3 py-2 text-right">{a?.likesGiven ?? 0}</td>
                  <td className="px-3 py-2 text-right">{a?.likesReceived ?? 0}</td>
                  <td className="px-3 py-2">
                    {p.is_superadmin ? (
                      <span className="rounded-full bg-ink px-2 py-0.5 text-[11px] font-bold text-cream">superadmin</span>
                    ) : (
                      <span className="text-subtle">member</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </main>
  );
}
