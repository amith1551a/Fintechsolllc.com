import { FORMS, validate, type FormKind } from "@/lib/forms";

/**
 * Receives contact / quote / partner form submissions.
 *
 * Delivery is only reported as successful when it really happened: submissions are forwarded as JSON to
 * FORMS_WEBHOOK_URL (e.g. a CRM, Zapier/Make hook, or an email-sending function). Without that variable the
 * endpoint answers 503 and the form tells the visitor to email or call instead.
 */
export async function POST(request: Request) {
  let body: { kind?: string; data?: Record<string, unknown>; hp?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }
  const kind = body.kind as FormKind;
  if (!kind || !(kind in FORMS) || typeof body.data !== "object" || body.data === null) {
    return Response.json({ ok: false, error: "invalid_request" }, { status: 400 });
  }
  if (body.hp) {
    return Response.json({ ok: false, error: "rejected" }, { status: 400 });
  }
  const errors = validate(kind, body.data);
  if (Object.keys(errors).length) {
    return Response.json({ ok: false, errors }, { status: 422 });
  }
  const data = Object.fromEntries(FORMS[kind].fields.map((f) => [f.name, String(body.data?.[f.name] ?? "").trim()]));

  const url = process.env.FORMS_WEBHOOK_URL;
  if (!url) {
    return Response.json({ ok: false, error: "not_configured" }, { status: 503 });
  }
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...(process.env.FORMS_WEBHOOK_TOKEN ? { authorization: `Bearer ${process.env.FORMS_WEBHOOK_TOKEN}` } : {}),
      },
      body: JSON.stringify({ form: kind, title: FORMS[kind].title, submittedAt: new Date().toISOString(), data }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) {
      return Response.json({ ok: false, error: "delivery_failed" }, { status: 502 });
    }
  } catch {
    return Response.json({ ok: false, error: "delivery_failed" }, { status: 502 });
  }
  return Response.json({ ok: true });
}
