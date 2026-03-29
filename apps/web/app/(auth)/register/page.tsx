import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { registerAction, signInWithGoogleAction } from "@/lib/actions";

export default async function RegisterPage({
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
          Create your workspace
        </p>
        <h1 className="mt-4 font-display text-4xl text-[color:var(--ink)]">
          Start qualifying buyers with more confidence
        </h1>
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
        <form action={registerAction} className="mt-8 space-y-5">
          <div>
            <label htmlFor="fullName" className="mb-2 block text-sm font-medium">
              Full name
            </label>
            <Input id="fullName" name="fullName" required />
          </div>
          <div>
            <label htmlFor="email" className="mb-2 block text-sm font-medium">
              Work email
            </label>
            <Input id="email" name="email" type="email" required />
          </div>
          <div>
            <label htmlFor="password" className="mb-2 block text-sm font-medium">
              Password
            </label>
            <Input id="password" name="password" type="password" minLength={8} required />
          </div>
          <Button type="submit" className="w-full">
            Create account
          </Button>
        </form>
        <form action={signInWithGoogleAction} className="mt-4">
          <Button type="submit" variant="secondary" className="w-full">
            Continue with Google
          </Button>
        </form>
        <p className="mt-6 text-sm text-[color:var(--muted-ink)]">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-[color:var(--brand)]">
            Sign in
          </Link>
        </p>
      </Card>
    </main>
  );
}
