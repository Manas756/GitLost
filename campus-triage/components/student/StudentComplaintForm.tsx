"use client";

import { useState, type FormEvent } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  Send,
  UploadCloud,
} from "lucide-react";

interface StudentComplaintFormProps {
  className?: string;
}

interface ComplaintFormState {
  rawText: string;
  imageUrl: string;
  locationZone: string;
}

interface TriageResult {
  category: string;
  priority: string;
}

interface SubmitComplaintResponse {
  success: boolean;
  error?: string;
  triage?: TriageResult;
}

const INITIAL_FORM_STATE: ComplaintFormState = {
  rawText: "",
  imageUrl: "",
  locationZone: "",
};

const DEMO_STUDENT_ID = "hardcoded-student-uuid-for-demo";

export default function StudentComplaintForm({
  className = "",
}: StudentComplaintFormProps) {
  const [formState, setFormState] =
    useState<ComplaintFormState>(INITIAL_FORM_STATE);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  function updateField<K extends keyof ComplaintFormState>(
    field: K,
    value: ComplaintFormState[K],
  ) {
    setFormState((current) => ({ ...current, [field]: value }));
    setSuccessMessage(null);
    setErrorMessage(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      const response = await fetch("/api/complaints/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: DEMO_STUDENT_ID,
          rawText: formState.rawText.trim(),
          imageUrl: formState.imageUrl.trim(),
          locationZone: formState.locationZone.trim(),
        }),
      });

      const result = (await response.json()) as SubmitComplaintResponse;

      if (!response.ok || !result.success || !result.triage) {
        throw new Error(result.error ?? "Unable to submit your complaint.");
      }

      setFormState(INITIAL_FORM_STATE);
      setSuccessMessage(
        `Complaint submitted. AI triage: ${result.triage.category} · ${result.triage.priority} urgency.`,
      );
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to submit your complaint. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section
      className={`rounded-xl border border-slate-800 bg-slate-900 p-6 text-white shadow-xl ${className}`}
      aria-labelledby="student-complaint-title"
    >
      <div className="mb-6">
        <p className="text-sm font-medium text-sky-400">Student support</p>
        <h2
          id="student-complaint-title"
          className="mt-1 text-2xl font-semibold tracking-tight"
        >
          Report a campus issue
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-400">
          Share the details below so the right campus team can respond quickly.
        </p>
      </div>

      {successMessage && (
        <div
          className="mb-5 flex gap-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-200"
          role="status"
          aria-live="polite"
        >
          <CheckCircle2
            className="mt-0.5 size-5 shrink-0 text-emerald-400"
            aria-hidden="true"
          />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div
          className="mb-5 flex gap-3 rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200"
          role="alert"
        >
          <AlertCircle
            className="mt-0.5 size-5 shrink-0 text-red-400"
            aria-hidden="true"
          />
          <span>{errorMessage}</span>
        </div>
      )}

      <form className="space-y-5" onSubmit={handleSubmit}>
        <div>
          <label
            htmlFor="complaint-description"
            className="mb-2 block text-sm font-medium text-slate-200"
          >
            Complaint description <span className="text-sky-400">*</span>
          </label>
          <textarea
            id="complaint-description"
            name="rawText"
            required
            rows={5}
            value={formState.rawText}
            onChange={(event) => updateField("rawText", event.target.value)}
            placeholder="Describe the issue in detail, e.g., Projector flickering in Lecture Hall 3..."
            className="w-full resize-y rounded-lg border border-slate-700 bg-slate-950 px-3 py-3 text-sm text-white placeholder:text-slate-500 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
          />
        </div>

        <div>
          <label
            htmlFor="complaint-location"
            className="mb-2 block text-sm font-medium text-slate-200"
          >
            Location zone / building <span className="text-sky-400">*</span>
          </label>
          <input
            id="complaint-location"
            name="locationZone"
            type="text"
            required
            value={formState.locationZone}
            onChange={(event) =>
              updateField("locationZone", event.target.value)
            }
            placeholder="e.g., Hostel Block B, Central Library"
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-3 text-sm text-white placeholder:text-slate-500 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
          />
        </div>

        <div>
          <label
            htmlFor="complaint-image"
            className="mb-2 block text-sm font-medium text-slate-200"
          >
            Image proof <span className="font-normal text-slate-500">(optional)</span>
          </label>
          <div className="relative">
            <UploadCloud
              className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-slate-500"
              aria-hidden="true"
            />
            <input
              id="complaint-image"
              name="imageUrl"
              type="url"
              value={formState.imageUrl}
              onChange={(event) => updateField("imageUrl", event.target.value)}
              placeholder="Paste an image URL for testing"
              className="w-full rounded-lg border border-slate-700 bg-slate-950 py-3 pl-10 pr-3 text-sm text-white placeholder:text-slate-500 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
            />
          </div>
          <p className="mt-2 text-xs text-slate-500">
            Use a publicly accessible image URL while uploads are being wired.
          </p>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-sky-500 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-sky-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              Submitting...
            </>
          ) : (
            <>
              <Send className="size-4" aria-hidden="true" />
              Submit complaint
            </>
          )}
        </button>
      </form>
    </section>
  );
}
