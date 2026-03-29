import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { loginAction, signInWithGoogleAction } from "@/lib/actions";

export default async function LoginPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const error = typeof params.error === "string" ? params.error : undefined;
  const message = typeof params.message === "string" ? params.message : undefined;

  return (
    <main className="grid min-h-dvh place-items-center px-5 py-10">
      <Card className="w-full max-w-xl p-8">
        <p className="font-mono text-xs uppercase tracking-[0.28em] text-[color:var(--muted-ink)]">
          Sign in
        </p>
        <h1 className="mt-4 font-display text-4xl text-[color:var(--ink)]">
          Back to your lead desk
        </h1>
        <p className="mt-3 text-[color:var(--muted-ink)]">
          Use the demo account `demo@showready.local` / `demo12345` or create your own.
        </p>
        {error ? (
          <div className="mt-6 rounded-3xl border border-[color:var(--hold)]/20 bg-[color:var(--hold-soft)] px-4 py-3 text-sm text-[color:var(--hold)]">
            {error}
          </div>
        ) : null}
        {message ? (
          <div className="mt-6 rounded-3xl border border-[color:var(--ready)]/20 bg-[color:var(--ready-soft)] px-4 py-3 text-sm text-[color:var(--ready)]">
            {message}
          </div>
        ) : null}
        <form action={loginAction} className="mt-8 space-y-5">
          <div>
            <label htmlFor="email" className="mb-2 block text-sm font-medium">
              Email
            </label>
            <Input id="email" name="email" type="email" defaultValue="demo@showready.local" required />
          </div>
          <div>
            <label htmlFor="password" className="mb-2 block text-sm font-medium">
              Password
            </label>
            <Input id="password" name="password" type="password" defaultValue="demo12345" required />
          </div>
          <Button type="submit" className="w-full">
            Sign in
          </Button>
        </form>
        <form action={signInWithGoogleAction} className="mt-4">
          <Button type="submit" variant="secondary" className="w-full">
            Continue with Google
          </Button>
        </form>
        <p className="mt-6 text-sm text-[color:var(--muted-ink)]">
          Need a workspace?{" "}
          <Link href="/register" className="font-medium text-[color:var(--brand)]">
            Create one
          </Link>
        </p>
      </Card>
    </main>
  );
}
