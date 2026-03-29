"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import type {
  CustomQuestion,
  IntakeAnswers,
  MoveReason,
  QuestionDefinition
} from "@showready/types";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

type IntakeFormProps = {
  token: string;
  buyerName: string;
  agentName: string;
  brandName: string;
  brandColor: string;
  accentColor: string;
  introHeadline: string;
  introBody: string;
  initialAnswers: Partial<IntakeAnswers>;
  initialCustomAnswers: ClientCustomAnswers;
  questions: QuestionDefinition[];
  customQuestions: CustomQuestion[];
};

type ClientCustomAnswers = Record<string, string | string[]>;

export function IntakeForm({
  token,
  buyerName,
  agentName,
  brandName,
  brandColor,
  accentColor,
  introHeadline,
  introBody,
  initialAnswers,
  initialCustomAnswers,
  questions,
  customQuestions
}: IntakeFormProps) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Partial<IntakeAnswers>>({
    notes: "",
    ...initialAnswers
  });
  const [customAnswers, setCustomAnswers] = useState<ClientCustomAnswers>(
    initialCustomAnswers
  );
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const steps = useMemo(
    () => [
      ...questions.map((question) => ({ kind: "core" as const, question })),
      ...customQuestions.map((question) => ({ kind: "custom" as const, question }))
    ],
    [customQuestions, questions]
  );

  const activeStep = steps[step];
  const progress = ((step + 1) / steps.length) * 100;

  async function persistAnswer(questionKey: string, value: string | string[] | number) {
    await fetch(`/api/intake/${token}/autosave`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        questionKey,
        value
      })
    });
  }

  function next() {
    setStep((current) => Math.min(current + 1, steps.length - 1));
  }

  function previous() {
    setStep((current) => Math.max(current - 1, 0));
  }

  async function handleCoreSingle(value: string) {
    if (activeStep.kind !== "core") {
      return;
    }

    const key = activeStep.question.key;
    const nextAnswers = {
      ...answers,
      [key]: value
    };
    setAnswers(nextAnswers);
    await persistAnswer(key, value);
    if (step < steps.length - 1) {
      next();
    }
  }

  async function toggleMulti(value: string) {
    if (activeStep.kind !== "core") {
      return;
    }

    const key = activeStep.question.key as "moveReasons";
    const current = Array.isArray(answers[key]) ? (answers[key] as string[]) : [];
    const nextValues = current.includes(value)
      ? current.filter((entry) => entry !== value)
      : [...current, value];
    const nextAnswers = {
      ...answers,
      [key]: nextValues as MoveReason[]
    };
    setAnswers(nextAnswers);
    await persistAnswer(key, nextValues);
  }

  async function saveTextarea(value: string, customKey?: string) {
    if (customKey) {
      const nextValues = {
        ...customAnswers,
        [customKey]: value
      };
      setCustomAnswers(nextValues);
      await persistAnswer(customKey, value);
      return;
    }

    const nextAnswers = {
      ...answers,
      notes: value
    };
    setAnswers(nextAnswers);
    await persistAnswer("notes", value);
  }

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);

    const response = await fetch(`/api/intake/${token}/submit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        answers: {
          ...answers,
          notes: answers.notes ?? ""
        },
        customAnswers
      })
    });

    if (!response.ok) {
      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      setError(payload.error ?? "Unable to submit your intake.");
      setSubmitting(false);
      return;
    }

    router.push(`/intake/${token}/complete`);
  }

  return (
    <div className="mx-auto max-w-3xl px-5 py-6">
      <Card className="overflow-hidden">
        <div className="p-6 text-white" style={{ backgroundColor: brandColor }}>
          <p className="font-mono text-xs uppercase tracking-[0.28em] text-white/70">
            {brandName}
          </p>
          <h1 className="mt-4 font-display text-4xl">{introHeadline}</h1>
          <p className="mt-3 max-w-2xl text-white/85">{introBody}</p>
          <p className="mt-4 text-sm text-white/75">Prepared for {buyerName} with {agentName}</p>
        </div>
        <div className="px-6 py-5">
          <div className="mb-6 h-2 overflow-hidden rounded-full bg-[color:var(--muted)]">
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{ width: `${progress}%`, backgroundColor: accentColor }}
            />
          </div>
          <AnimatePresence mode="wait">
            <motion.div
              key={
                activeStep.kind === "core"
                  ? `core-${activeStep.question.key}`
                  : `custom-${activeStep.question.id}`
              }
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
            >
              <p className="font-mono text-xs uppercase tracking-[0.24em] text-[color:var(--muted-ink)]">
                Step {step + 1} of {steps.length}
              </p>
              <h2 className="mt-4 font-display text-4xl text-[color:var(--ink)]">
                {activeStep.question.label}
              </h2>
              {"helperText" in activeStep.question && activeStep.question.helperText ? (
                <p className="mt-3 text-base leading-7 text-[color:var(--muted-ink)]">
                  {activeStep.question.helperText}
                </p>
              ) : null}
              <div className="mt-8 space-y-4">
                {activeStep.question.type === "single_select"
                  ? activeStep.question.options?.map((option) => {
                      const selected =
                        activeStep.kind === "core"
                          ? answers[activeStep.question.key as keyof IntakeAnswers] === option.value
                          : customAnswers[activeStep.question.id] === option.value;

                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={async () => {
                            if (activeStep.kind === "core") {
                              await handleCoreSingle(option.value);
                            } else {
                              const nextValues = {
                                ...customAnswers,
                                [activeStep.question.id]: option.value
                              };
                              setCustomAnswers(nextValues);
                              await persistAnswer(activeStep.question.id, option.value);
                              if (step < steps.length - 1) {
                                next();
                              }
                            }
                          }}
                          className={`flex min-h-14 w-full items-center justify-between rounded-[24px] border px-5 py-4 text-left text-base transition ${
                            selected
                              ? "border-transparent bg-[color:var(--brand)] text-white"
                              : "border-[color:var(--border)] bg-white text-[color:var(--ink)]"
                          }`}
                        >
                          <span>{option.label}</span>
                        </button>
                      );
                    })
                  : null}
                {activeStep.question.type === "multi_select"
                  ? activeStep.question.options?.map((option) => {
                      const selectedValues =
                        activeStep.kind === "core"
                          ? ((answers[activeStep.question.key as keyof IntakeAnswers] as string[]) ?? [])
                          : ((customAnswers[activeStep.question.id] as string[]) ?? []);
                      const selected = selectedValues.includes(option.value);

                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={async () => {
                            if (activeStep.kind === "core") {
                              await toggleMulti(option.value);
                            } else {
                              const current = (customAnswers[activeStep.question.id] as string[]) ?? [];
                              const nextValues = current.includes(option.value)
                                ? current.filter((entry) => entry !== option.value)
                                : [...current, option.value];
                              setCustomAnswers({
                                ...customAnswers,
                                [activeStep.question.id]: nextValues
                              });
                              await persistAnswer(activeStep.question.id, nextValues);
                            }
                          }}
                          className={`flex min-h-14 w-full items-center justify-between rounded-[24px] border px-5 py-4 text-left text-base transition ${
                            selected
                              ? "border-transparent bg-[color:var(--brand)] text-white"
                              : "border-[color:var(--border)] bg-white text-[color:var(--ink)]"
                          }`}
                        >
                          <span>{option.label}</span>
                        </button>
                      );
                    })
                  : null}
                {activeStep.question.type === "slider" ? (
                  <div className="rounded-[28px] border border-[color:var(--border)] bg-[color:var(--surface-strong)] p-5">
                    <input
                      type="range"
                      min={activeStep.question.min}
                      max={activeStep.question.max}
                      step={activeStep.question.step}
                      value={(answers.offerReadiness as number) ?? 3}
                      onChange={async (event) => {
                        const value = Number(event.target.value);
                        setAnswers({
                          ...answers,
                          offerReadiness: value as IntakeAnswers["offerReadiness"]
                        });
                        await persistAnswer("offerReadiness", value);
                      }}
                      className="w-full"
                    />
                    <div className="mt-3 flex items-center justify-between text-sm text-[color:var(--muted-ink)]">
                      <span>Just researching</span>
                      <span className="font-semibold text-[color:var(--ink)]">
                        {(answers.offerReadiness as number) ?? 3}
                      </span>
                      <span>Ready today</span>
                    </div>
                  </div>
                ) : null}
                {activeStep.question.type === "textarea" ? (
                  <div className="space-y-4">
                    <Textarea
                      defaultValue={(answers.notes as string) ?? ""}
                      onBlur={async (event) => {
                        await saveTextarea(event.target.value);
                      }}
                    />
                    <Button type="button" onClick={step === steps.length - 1 ? handleSubmit : next}>
                      {step === steps.length - 1 ? (submitting ? "Submitting..." : "Submit") : "Continue"}
                    </Button>
                  </div>
                ) : null}
                {activeStep.kind === "custom" && activeStep.question.type === "text" ? (
                  <div className="space-y-4">
                    <Textarea
                      defaultValue={String(customAnswers[activeStep.question.id] ?? "")}
                      onBlur={async (event) => {
                        await saveTextarea(event.target.value, activeStep.question.id);
                      }}
                    />
                    <Button type="button" onClick={step === steps.length - 1 ? handleSubmit : next}>
                      {step === steps.length - 1 ? (submitting ? "Submitting..." : "Submit") : "Continue"}
                    </Button>
                  </div>
                ) : null}
                {activeStep.question.type === "multi_select" || activeStep.question.type === "slider" ? (
                  <div className="flex items-center justify-between gap-3">
                    <Button type="button" variant="secondary" onClick={previous} disabled={step === 0}>
                      Back
                    </Button>
                    <Button
                      type="button"
                      onClick={step === steps.length - 1 ? handleSubmit : next}
                      disabled={
                        activeStep.kind === "core" &&
                        activeStep.question.type !== "slider" &&
                        !answers[activeStep.question.key as keyof IntakeAnswers]
                      }
                    >
                      {step === steps.length - 1 ? (submitting ? "Submitting..." : "Submit") : "Continue"}
                    </Button>
                  </div>
                ) : null}
              </div>
            </motion.div>
          </AnimatePresence>
          {error ? (
            <div className="mt-6 rounded-[24px] border border-[color:var(--hold)]/20 bg-[color:var(--hold-soft)] px-4 py-3 text-sm text-[color:var(--hold)]">
              {error}
            </div>
          ) : null}
        </div>
      </Card>
    </div>
  );
}
