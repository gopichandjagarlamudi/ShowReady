"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

type GeneratedLinkPanelProps = {
  inviteUrl?: string
  invitePath?: string
  status?: string
}

export function GeneratedLinkPanel({
  inviteUrl,
  invitePath,
  status
}: GeneratedLinkPanelProps) {
  const [copied, setCopied] = useState(false)

  async function copyToClipboard() {
    if (!inviteUrl) {
      return
    }

    await navigator.clipboard.writeText(inviteUrl)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="mt-6 rounded-[24px] border border-[color:var(--border)] bg-[color:var(--surface-strong)] p-4">
      <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[color:var(--muted-ink)]">
        Generated link
      </p>
      {inviteUrl ? (
        <>
          <div className="mt-3 flex flex-col gap-3 sm:flex-row">
            <Input value={inviteUrl} readOnly className="flex-1" />
            <Button type="button" variant="secondary" onClick={copyToClipboard}>
              {copied ? "Copied" : "Copy link"}
            </Button>
          </div>
          <p className="mt-3 text-sm text-[color:var(--muted-ink)]">
            Status: <span className="capitalize text-[color:var(--ink)]">{status}</span>
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            {invitePath ? (
              <Link href={invitePath} target="_blank">
                <Button variant="secondary">Open invite</Button>
              </Link>
            ) : null}
          </div>
        </>
      ) : (
        <p className="mt-3 text-sm leading-6 text-[color:var(--muted-ink)]">
          Generate an invite link and it will appear here, ready to copy.
        </p>
      )}
    </div>
  )
}
