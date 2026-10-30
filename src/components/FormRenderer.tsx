"use client";

import { useId, useState, type FormEvent } from "react";
import { FORMS, validate, type Field, type FormKind } from "@/lib/forms";

type Status =
  | { state: "idle" }
  | { state: "sending" }
  | { state: "sent" }
  | { state: "unavailable"; mailto: string }
  | { state: "error"; message: string };

const FALLBACK_EMAIL = "amith@fintechsolllc.com"; // from the recovered contact details
const FALLBACK_PHONE = "+1(682-434-9964)";

function mailtoFor(kind: FormKind, data: Record<string, string>) {
  const lines = FORMS[kind].fields.filter((f) => data[f.name]).map((f) => `${f.label}: ${data[f.name]}`);
  const subject = `${FORMS[kind].title} – website enquiry`;
  return `mailto:${FALLBACK_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(lines.join("\n"))}`;
}

export default function FormRenderer({ kind }: { kind: FormKind }) {
  const { title, fields } = FORMS[kind];
  const uid = useId();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<Status>({ state: "idle" });

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    const data: Record<string, string> = {};
    for (const f of fields) data[f.name] = String(fd.get(f.name) ?? "");
    const found = validate(kind, data);
    setErrors(found);
    if (Object.keys(found).length) {
      form.querySelector<HTMLElement>(`[name="${Object.keys(found)[0]}"]`)?.focus();
      return;
    }
    setStatus({ state: "sending" });
    try {
      const res = await fetch("/api/forms/", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ kind, data, hp: String(fd.get("hp_company_site") ?? "") }),
      });
      const body = await res.json().catch(() => ({}));
      if (res.ok && body.ok) {
        setStatus({ state: "sent" });
        form.reset();
      } else if (res.status === 422 && body.errors) {
        setErrors(body.errors);
        setStatus({ state: "idle" });
      } else if (res.status === 503) {
        setStatus({ state: "unavailable", mailto: mailtoFor(kind, data) });
      } else {
        setStatus({ state: "error", message: "We could not deliver your message. Please try again or contact us directly." });
      }
    } catch {
      setStatus({ state: "error", message: "Network error – your message was not sent. Please try again." });
    }
  }

  if (status.state === "sent") {
    return (
      <div role="status" className="rounded-2xl border border-emerald-200 bg-emerald-50 p-8 text-emerald-900">
        <h3 className="text-xl font-semibold">Thank you – your request has been sent.</h3>
        <p className="mt-2 text-sm">Our team will get back to you shortly.</p>
      </div>
    );
  }

  return (
    <form noValidate onSubmit={onSubmit} className="rounded-2xl border border-line bg-white p-6 shadow-sm sm:p-8" aria-labelledby={`${uid}-title`}>
      <h3 id={`${uid}-title`} className="text-2xl font-bold text-navy">
        {title}
      </h3>
      <p className="mt-2 text-sm text-muted">
        Fields marked <span className="text-red-600">*</span> are required.
      </p>
      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        {fields.map((f) => (
          <FieldInput key={f.name} field={f} id={`${uid}-${f.name}`} error={errors[f.name]} />
        ))}
        {/* honeypot: hidden from people, filled in by bots */}
        <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
          <label>
            Company site <input type="text" name="hp_company_site" tabIndex={-1} autoComplete="off" />
          </label>
        </div>
      </div>
      <div className="mt-6 flex flex-wrap items-center gap-4">
        <button type="submit" className="btn-brand" disabled={status.state === "sending"}>
          {status.state === "sending" ? "Sending…" : "Submit"}
        </button>
      </div>
      <div aria-live="polite" className="mt-4">
        {status.state === "unavailable" && (
          <div className="rounded-lg border border-amber/60 bg-amber/10 p-4 text-sm text-ink">
            <p className="font-semibold">Online submission is not available yet – your message has not been sent.</p>
            <p className="mt-1">
              Please{" "}
              <a href={status.mailto} className="font-semibold text-brand-600 underline">
                send it by email
              </a>{" "}
              (your details are pre-filled) or call{" "}
              <a href="tel:+16824349964" className="font-semibold text-brand-600 underline">
                {FALLBACK_PHONE}
              </a>
              .
            </p>
          </div>
        )}
        {status.state === "error" && <p className="rounded-lg bg-red-50 p-4 text-sm text-red-800">{status.message}</p>}
      </div>
    </form>
  );
}

function FieldInput({ field: f, id, error }: { field: Field; id: string; error?: string }) {
  const errId = `${id}-error`;
  const base =
    "mt-1.5 block w-full rounded-lg border bg-white px-3.5 py-2.5 text-sm text-ink shadow-sm placeholder:text-muted/70 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30";
  const border = error ? "border-red-500" : "border-line";
  const common = {
    id,
    name: f.name,
    "aria-invalid": error ? true : undefined,
    "aria-describedby": error ? errId : undefined,
    "aria-required": f.required || undefined,
  };
  const label = (
    <>
      {f.label}
      {f.required && <span className="text-red-600"> *</span>}
    </>
  );
  const wide = f.type === "textarea" || f.type === "radio";
  return (
    <div className={wide ? "sm:col-span-2" : ""}>
      {f.type === "radio" ? (
        <fieldset aria-describedby={error ? errId : undefined}>
          <legend className="text-sm font-medium text-ink">{label}</legend>
          <div className="mt-2 flex gap-6">
            {f.options?.map((o) => (
              <label key={o} className="flex items-center gap-2 text-sm text-ink">
                <input type="radio" name={f.name} value={o} className="h-4 w-4 accent-[var(--color-brand-600)]" /> {o}
              </label>
            ))}
          </div>
        </fieldset>
      ) : (
        <label htmlFor={id} className="text-sm font-medium text-ink">
          {label}
        </label>
      )}
      {f.type === "textarea" ? (
        <textarea {...common} rows={5} placeholder={f.placeholder ?? f.label} className={`${base} ${border}`} />
      ) : f.type !== "radio" ? (
        <input
          {...common}
          type={f.type}
          min={f.min}
          placeholder={f.placeholder ?? f.label}
          autoComplete={f.autoComplete}
          inputMode={f.type === "number" ? "numeric" : undefined}
          className={`${base} ${border}`}
        />
      ) : null}
      {error && (
        <p id={errId} className="mt-1.5 text-xs font-medium text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
