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
    <main className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold">Users ({data.profiles.length})</h1>
        <p className="mt-1 text-[12px] text-subtle">Read only. Superadmin is set in the database.</p>
      </div>
      <div className="card overflow-x-auto">
        <table className="w-full text-left text-[13px]">
          <thead>
            <tr className="border-b border-black">
              <th className="th">User</th>
              <th className="th">Email</th>
              <th className="th">Joined</th>
              <th className="th text-right">Posts</th>
              <th className="th text-right">Likes given</th>
              <th className="th text-right">Likes received</th>
              <th className="th">Role</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black">
            {data.profiles.map((p) => {
              const a = activity.get(p.id);
              return (
                <tr key={p.id}>
                  <td className="px-3 py-2">
                    <Link href={`/users/${p.id}`} className="flex items-center gap-2 font-semibold hover:underline">
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
                      <span className="rounded border border-black bg-white px-2 py-0.5 text-xs text-black">superadmin</span>
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
