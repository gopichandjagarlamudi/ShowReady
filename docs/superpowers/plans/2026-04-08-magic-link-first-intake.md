# Magic-Link-First Intake Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace lead-first intake creation with invite-first magic links, a branched buyer/rental public intake, and redesigned scoring.

**Architecture:** Add a dedicated invite persistence layer, keep leads as submitted prospects only, and move intake state through invite draft storage until a lead is created. Replace the old shared readiness schema with explicit contact, intent, buyer, and rental answers while preserving the existing agent template intro/custom-question surface.

**Tech Stack:** Next.js App Router, Supabase Postgres, TypeScript strict mode, Vitest, Playwright, Tailwind, Framer Motion

---

- [ ] Add shared intake/invite contracts and failing unit tests first.
- [ ] Replace scoring tests and scoring implementation to target the new buyer/rental answer model.
- [ ] Add invite schema and migration support, then update Supabase data helpers and route handlers.
- [ ] Replace dashboard launcher and public intake UI with the new invite-first flow.
- [ ] Update seed data, lead surfaces, and browser coverage.
- [ ] Run targeted tests first, then widen to typecheck/build/e2e, then update repo memory docs.
