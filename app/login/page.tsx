import { GoogleSignInButton } from "@/components/GoogleSignInButton";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  return (
    <main className="mx-auto mt-24 flex max-w-sm flex-col gap-3 rounded-lg border border-black p-6">
      <h1 className="text-xl font-semibold">Caption Admin</h1>
      <p className="text-sm">This area is for administrators only. Sign in with Google to continue.</p>
      {error && (
        <p role="alert" className="text-sm font-semibold">
          {error}
        </p>
      )}
      <GoogleSignInButton />
    </main>
  );
}
