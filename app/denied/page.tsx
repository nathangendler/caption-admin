import { getCurrentUser } from "@/lib/auth";

export default async function DeniedPage() {
  const user = await getCurrentUser();
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-4 px-4 py-10 text-center">
      <span className="eyebrow">Admin</span>
      <h1 className="title text-[28px] leading-tight">Not authorized</h1>
      <p className="text-[14px] text-subtle">
        {user?.email ? `${user.email} is signed in, but` : "This account"} isn&apos;t an
        administrator. Only profiles flagged as superadmin in the database can use this area.
      </p>
      <form action="/auth/signout" method="post">
        <button type="submit" className="btn-outline">
          Sign out
        </button>
      </form>
    </main>
  );
}
