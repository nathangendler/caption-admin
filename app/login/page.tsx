import { GoogleSignInButton } from "@/components/GoogleSignInButton";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-5 px-4 py-10 text-center">
      <span className="eyebrow">Admin</span>
      <h1 className="title text-[28px] leading-tight">Sign in</h1>
      <p className="text-[14px] text-subtle">
        This area is for administrators only. Sign in with Google to continue.
      </p>
      {error && (
        <p role="alert" className="card w-full border-danger px-4 py-2 text-[13px] text-danger">
          {error}
        </p>
      )}
      <GoogleSignInButton />
    </main>
  );
}
