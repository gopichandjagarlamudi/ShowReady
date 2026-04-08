import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { buildAuthActionPath, buildAuthRedirectPath } from "@/lib/auth-url";

function formatRegisterError(error?: string) {
  if (!error) {
    return undefined
  }

  const normalizedError = error.toLowerCase()

  if (normalizedError.includes("email rate limit exceeded")) {
    return "Email signups are temporarily rate-limited. Continue with Google or try again in a few minutes."
  }

  if (
    normalizedError.includes("email address") &&
    normalizedError.includes("is invalid")
  ) {
    return "Use a real inbox address. Reserved example domains are rejected by Supabase Auth."
  }

  return error
}

export default async function RegisterPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const vercelShareToken =
    typeof params._vercel_share === "string" ? params._vercel_share : undefined
  const error = formatRegisterError(
    typeof params.error === "string" ? params.error : undefined
  )
  const message = typeof params.message === "string" ? params.message : undefined;
  const registerAction = buildAuthActionPath("/auth/register", vercelShareToken)
  const googleAction = buildAuthActionPath("/auth/google", vercelShareToken)
  const loginHref = buildAuthRedirectPath("/login", {
    vercelShareToken
  })

  return (
    <main className="grid min-h-dvh place-items-center px-5 py-10">
      <Card className="w-full max-w-lg p-7 sm:p-8">
        <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-[color:var(--muted-ink)]">
          Create account
        </p>
        <h1 className="mt-3 font-display text-[2rem] leading-tight text-[color:var(--ink)] sm:text-4xl">
          Create your ShowReady account
        </h1>
        <p className="mt-3 max-w-md text-sm leading-6 text-[color:var(--muted-ink)]">
          Use your email or Google to get started.
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
        <form action={registerAction} method="post" className="space-y-4">
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
        <p className="mt-5 text-sm text-[color:var(--muted-ink)]">
          Already have an account?{" "}
          <Link href={loginHref} className="font-medium text-[color:var(--brand)]">
            Sign in
          </Link>
        </p>
      </Card>
    </main>
  );
}
