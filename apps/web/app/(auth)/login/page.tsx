import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { buildAuthActionPath, buildAuthRedirectPath } from "@/lib/auth-url";

export default async function LoginPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const error = typeof params.error === "string" ? params.error : undefined;
  const message = typeof params.message === "string" ? params.message : undefined;
  const vercelShareToken =
    typeof params._vercel_share === "string" ? params._vercel_share : undefined
  const loginAction = buildAuthActionPath("/auth/login", vercelShareToken)
  const googleAction = buildAuthActionPath("/auth/google", vercelShareToken)
  const registerHref = buildAuthRedirectPath("/register", {
    vercelShareToken
  })

  return (
    <main className="grid min-h-dvh place-items-center px-5 py-10">
      <Card className="w-full max-w-lg p-7 sm:p-8">
        <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-[color:var(--muted-ink)]">
          Sign in
        </p>
        <h1 className="mt-3 font-display text-[2rem] leading-tight text-[color:var(--ink)] sm:text-4xl">
          Sign in to ShowReady
        </h1>
        <p className="mt-3 max-w-md text-sm leading-6 text-[color:var(--muted-ink)]">
          Use your email or Google to continue.
        </p>
        <p className="mt-2 text-sm leading-6 text-[color:var(--muted-ink)]">
          Demo access: <span className="font-mono text-[color:var(--ink)]">demo@showready.local</span>{" "}
          / <span className="font-mono text-[color:var(--ink)]">demo12345</span>
        </p>
        {error ? (
          <div className="mt-5 rounded-[22px] border border-[color:var(--hold)]/15 bg-[color:var(--hold-soft)]/70 px-4 py-3 text-sm leading-6 text-[color:var(--hold)]">
            {error}
          </div>
        ) : null}
        {message ? (
          <div className="mt-5 rounded-[22px] border border-[color:var(--ready)]/15 bg-[color:var(--ready-soft)]/70 px-4 py-3 text-sm leading-6 text-[color:var(--ready)]">
            {message}
          </div>
        ) : null}
        <form action={googleAction} method="post" className="mt-6">
          <Button type="submit" variant="secondary" className="w-full">
            Continue with Google
          </Button>
        </form>
        <div className="my-5 flex items-center gap-3 text-[11px] uppercase tracking-[0.22em] text-[color:var(--muted-ink)]">
          <div className="h-px flex-1 bg-[color:var(--border)]" />
          <span>Or continue with email</span>
          <div className="h-px flex-1 bg-[color:var(--border)]" />
        </div>
        <form action={loginAction} method="post" className="space-y-4">
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
        <p className="mt-5 text-sm text-[color:var(--muted-ink)]">
          Need a workspace?{" "}
          <Link href={registerHref} className="font-medium text-[color:var(--brand)]">
            Create one
          </Link>
        </p>
      </Card>
    </main>
  );
}
