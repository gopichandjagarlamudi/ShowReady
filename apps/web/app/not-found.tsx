import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="grid min-h-dvh place-items-center px-5 py-10">
      <Card className="max-w-xl p-10 text-center">
        <p className="font-display text-5xl text-[color:var(--ink)]">Page not found</p>
        <p className="mt-4 text-[color:var(--muted-ink)]">
          The page you requested is not available in this workspace.
        </p>
        <Link href="/" className="mt-6 inline-block">
          <Button>Back home</Button>
        </Link>
      </Card>
    </main>
  );
}
