import Link from "next/link";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { getCurrentAgentContext } from "@/lib/session";
import { saveSettingsAction } from "@/lib/actions";
import { formatIntakeTypeLabel, resolveTemplateForIntakeType } from "@/lib/intake-config";

export default async function SettingsPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const onboardingMode = params.onboarding === "1";
  const activeIntakeType = params.intakeType === "rental" ? "rental" : "sale";
  const context = await getCurrentAgentContext();

  if (!context) {
    redirect("/login");
  }

  const template = resolveTemplateForIntakeType(activeIntakeType, context.templates);
  const customQuestions = template.customQuestions;

  return (
    <AppShell
      currentPath="/settings"
      eyebrow={onboardingMode ? "Onboarding" : "Settings"}
      heading={onboardingMode ? "Finish your setup" : "Brand, intake, and preferences"}
    >
      <form action={saveSettingsAction} className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          <Card className="p-6">
            <p className="font-display text-3xl text-[color:var(--ink)]">Profile</p>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <div>
                <label htmlFor="fullName" className="mb-2 block text-sm font-medium">
                  Full name
                </label>
                <Input id="fullName" name="fullName" defaultValue={context.agent.fullName} required />
              </div>
              <div>
                <label htmlFor="brokerage" className="mb-2 block text-sm font-medium">
                  Brokerage
                </label>
                <Input id="brokerage" name="brokerage" defaultValue={context.agent.brokerage} />
              </div>
              <div>
                <label htmlFor="licenseNumber" className="mb-2 block text-sm font-medium">
                  License number
                </label>
                <Input id="licenseNumber" name="licenseNumber" defaultValue={context.agent.licenseNumber} />
              </div>
              <div>
                <label htmlFor="notificationPreference" className="mb-2 block text-sm font-medium">
                  Notification preference
                </label>
                <select
                  id="notificationPreference"
                  name="notificationPreference"
                  defaultValue={context.settings.notificationPreference}
                  className="min-h-11 w-full rounded-2xl border border-[color:var(--border)] bg-white px-4 py-3 text-sm"
                >
                  <option value="email">Email only</option>
                  <option value="email_and_push">Email + push-ready</option>
                </select>
              </div>
            </div>
          </Card>
          <Card className="p-6">
            <p className="font-display text-3xl text-[color:var(--ink)]">Brand</p>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <div>
                <label htmlFor="brandName" className="mb-2 block text-sm font-medium">
                  Brand name
                </label>
                <Input id="brandName" name="brandName" defaultValue={context.settings.brandName} required />
              </div>
              <div>
                <label htmlFor="showThreshold" className="mb-2 block text-sm font-medium">
                  Show threshold
                </label>
                <Input
                  id="showThreshold"
                  name="showThreshold"
                  type="number"
                  min="5"
                  max="10"
                  step="0.1"
                  defaultValue={context.settings.showThreshold}
                  required
                />
              </div>
              <div>
                <label htmlFor="brandColor" className="mb-2 block text-sm font-medium">
                  Brand color
                </label>
                <Input id="brandColor" name="brandColor" type="color" defaultValue={context.settings.brandColor} />
              </div>
              <div>
                <label htmlFor="accentColor" className="mb-2 block text-sm font-medium">
                  Accent color
                </label>
                <Input id="accentColor" name="accentColor" type="color" defaultValue={context.settings.accentColor} />
              </div>
            </div>
          </Card>
          <Card className="p-6">
            <p className="font-display text-3xl text-[color:var(--ink)]">Intake experience</p>
            <div className="mt-5 flex flex-wrap gap-3">
              {(["sale", "rental"] as const).map((intakeType) => {
                const isActive = intakeType === activeIntakeType;

                return (
                  <Link
                    key={intakeType}
                    href={
                      onboardingMode
                        ? `/settings?onboarding=1&intakeType=${intakeType}`
                        : `/settings?intakeType=${intakeType}`
                    }
                    className={`rounded-full border px-4 py-2 text-sm transition ${
                      isActive
                        ? "border-transparent bg-[color:var(--brand)] text-white"
                        : "border-[color:var(--border)] bg-white text-[color:var(--ink)]"
                    }`}
                  >
                    {formatIntakeTypeLabel(intakeType)} template
                  </Link>
                );
              })}
            </div>
            <div className="mt-5 space-y-4">
              <input type="hidden" name="intakeType" value={activeIntakeType} />
              <div>
                <label htmlFor="introHeadline" className="mb-2 block text-sm font-medium">
                  Intro headline
                </label>
                <Input id="introHeadline" name="introHeadline" defaultValue={template.introHeadline} required />
              </div>
              <div>
                <label htmlFor="introBody" className="mb-2 block text-sm font-medium">
                  Intro body
                </label>
                <Textarea id="introBody" name="introBody" defaultValue={template.introBody} required />
              </div>
            </div>
          </Card>
          <Card className="p-6">
            <p className="font-display text-3xl text-[color:var(--ink)]">Context questions</p>
            <p className="mt-3 text-sm leading-7 text-[color:var(--muted-ink)]">
              Add up to two non-scoring questions for extra context. Keep them focused and practical.
            </p>
            <div className="mt-5 grid gap-6">
              {[0, 1].map((index) => (
                <div key={index} className="rounded-[24px] border border-[color:var(--border)] bg-[color:var(--surface-strong)] p-4">
                  <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-[color:var(--muted-ink)]">
                    Question {index + 1}
                  </p>
                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <div className="md:col-span-2">
                      <label htmlFor={`customQuestionLabel${index}`} className="mb-2 block text-sm font-medium">
                        Prompt
                      </label>
                      <Input
                        id={`customQuestionLabel${index}`}
                        name={`customQuestionLabel${index}`}
                        defaultValue={customQuestions[index]?.label}
                      />
                    </div>
                    <div>
                      <label htmlFor={`customQuestionType${index}`} className="mb-2 block text-sm font-medium">
                        Type
                      </label>
                      <select
                        id={`customQuestionType${index}`}
                        name={`customQuestionType${index}`}
                        defaultValue={customQuestions[index]?.type ?? "text"}
                        className="min-h-11 w-full rounded-2xl border border-[color:var(--border)] bg-white px-4 py-3 text-sm"
                      >
                        <option value="text">Text</option>
                        <option value="single_select">Single select</option>
                        <option value="multi_select">Multi select</option>
                      </select>
                    </div>
                    <div>
                      <label htmlFor={`customQuestionOptions${index}`} className="mb-2 block text-sm font-medium">
                        Options (comma-separated)
                      </label>
                      <Input
                        id={`customQuestionOptions${index}`}
                        name={`customQuestionOptions${index}`}
                        defaultValue={customQuestions[index]?.options?.map((item) => item.label).join(", ")}
                      />
                    </div>
                    <label className="flex items-center gap-2 text-sm text-[color:var(--ink)]">
                      <input
                        type="checkbox"
                        name={`customQuestionRequired${index}`}
                        defaultChecked={customQuestions[index]?.required}
                      />
                      Required
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
        <div className="space-y-6">
          <Card className="p-6 xl:sticky xl:top-28">
            <p className="font-display text-3xl text-[color:var(--ink)]">Preview</p>
            <div
              className="mt-5 rounded-[28px] p-6 text-white"
              style={{ backgroundColor: context.settings.brandColor }}
            >
              <p className="font-mono text-xs uppercase tracking-[0.28em] text-white/70">
                {context.settings.brandName}
              </p>
              <p className="mt-4 font-display text-4xl">{template.introHeadline}</p>
              <p className="mt-4 text-white/80">{template.introBody}</p>
            </div>
            <p className="mt-6 text-sm leading-7 text-[color:var(--muted-ink)]">
              The {activeIntakeType} intake is always one question per screen, fully mobile-first,
              and keeps the scoring questions locked.
            </p>
            <Button type="submit" className="mt-6 w-full">
              {onboardingMode ? "Complete setup" : "Save changes"}
            </Button>
          </Card>
        </div>
      </form>
    </AppShell>
  );
}
