"use client";

import { ArrowClockwise, CheckCircle, PaperPlaneTilt, ShieldCheck } from "@phosphor-icons/react";
import { FormEvent, useCallback, useRef, useState } from "react";
import { PortfolioApiError, submitContact, type ContactPayload } from "@/lib/api";
import { interfaceCopy } from "@/lib/content";
import { TurnstileWidget, type TurnstileHandle } from "./turnstile-widget";

type FormStatus = "idle" | "submitting" | "success" | "error";
type FieldName = "name" | "email" | "message";
type FieldErrors = Partial<Record<FieldName, string>>;

const TURNSTILE_SITE_KEY =
  process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim() || "0x4AAAAAADfvO0DUYxnOpyJM";

export function ContactForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const turnstileRef = useRef<TurnstileHandle>(null);
  const [token, setToken] = useState("");
  const [status, setStatus] = useState<FormStatus>("idle");
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});

  const handleToken = useCallback((nextToken: string) => {
    setToken(nextToken);
    if (nextToken) {
      setStatus((current) => (current === "error" ? "idle" : current));
      setMessage("");
    }
  }, []);

  const handleTurnstileError = useCallback((nextMessage: string) => {
    setStatus("error");
    setMessage(nextMessage || interfaceCopy.contact.verification);
  }, []);

  function validate(form: HTMLFormElement) {
    const data = new FormData(form);
    const name = String(data.get("name") || "").trim();
    const email = String(data.get("email") || "").trim();
    const body = String(data.get("message") || "").trim();
    const next: FieldErrors = {};
    if (name.length < 2) next.name = interfaceCopy.contact.missingName;
    if (!/^\S+@\S+\.\S+$/.test(email)) next.email = interfaceCopy.contact.invalidEmail;
    if (body.length < 10) next.message = interfaceCopy.contact.shortMessage;
    setErrors(next);
    const first = Object.keys(next)[0] as FieldName | undefined;
    const firstField = first ? form.elements.namedItem(first) : null;
    if (firstField instanceof HTMLElement) {
      firstField.focus();
      firstField.scrollIntoView({ block: "center" });
    }
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    if (!validate(form)) return;
    if (!token) {
      setStatus("error");
      setMessage(interfaceCopy.contact.verification);
      return;
    }

    const data = new FormData(form);
    const payload: ContactPayload = {
      name: String(data.get("name") || ""),
      email: String(data.get("email") || ""),
      subject: String(data.get("subject") || ""),
      message: String(data.get("message") || ""),
      website: String(data.get("website") || "")
    };

    setStatus("submitting");
    setMessage("Sending your message…");
    try {
      const response = await submitContact(payload, token);
      setStatus("success");
      setMessage(response.message || "Your message reached me. I'll reply as soon as I can.");
      setErrors({});
      form.reset();
      setToken("");
      turnstileRef.current?.reset();
    } catch (cause) {
      const error = cause instanceof PortfolioApiError ? cause : null;
      setStatus("error");
      setMessage(error?.code === "VALIDATION_ERROR" ? error.message : interfaceCopy.contact.failure);
      setToken("");
      turnstileRef.current?.reset();
    }
  }

  return (
    <div className="contact-form-shell">
      <div className="form-header">
        <div><span>Protected contact form</span><strong>Write to me directly</strong></div>
        <ShieldCheck aria-hidden size={24} weight="duotone" />
      </div>
      <form ref={formRef} onSubmit={handleSubmit} noValidate>
        <div className="form-grid">
          <label>
            <span>Name</span>
            <input name="name" type="text" autoComplete="name" maxLength={120} aria-invalid={Boolean(errors.name)} aria-describedby={errors.name ? "name-error" : undefined} onBlur={() => errors.name && setErrors((current) => ({ ...current, name: undefined }))} />
            {errors.name ? <small id="name-error" role="alert">{errors.name}</small> : null}
          </label>
          <label>
            <span>Email</span>
            <input name="email" type="email" inputMode="email" autoComplete="email" maxLength={254} aria-invalid={Boolean(errors.email)} aria-describedby={errors.email ? "email-error" : undefined} onBlur={() => errors.email && setErrors((current) => ({ ...current, email: undefined }))} />
            {errors.email ? <small id="email-error" role="alert">{errors.email}</small> : null}
          </label>
        </div>
        <label>
          <span>Subject <small>Optional</small></span>
          <input name="subject" type="text" autoComplete="off" maxLength={160} />
        </label>
        <label>
          <span>Message</span>
          <textarea name="message" maxLength={4000} rows={6} aria-invalid={Boolean(errors.message)} aria-describedby={errors.message ? "message-error" : undefined} onBlur={() => errors.message && setErrors((current) => ({ ...current, message: undefined }))} />
          {errors.message ? <small id="message-error" role="alert">{errors.message}</small> : null}
        </label>
        <label className="honeypot" aria-hidden="true">
          Website
          <input name="website" type="text" tabIndex={-1} autoComplete="off" />
        </label>
        <TurnstileWidget ref={turnstileRef} siteKey={TURNSTILE_SITE_KEY} onToken={handleToken} onError={handleTurnstileError} />
        <div className="form-submit-row">
          <button className="v5-button primary" type="submit" disabled={status === "submitting" || !TURNSTILE_SITE_KEY}>
            {status === "submitting" ? <ArrowClockwise className="spin" aria-hidden size={18} /> : <PaperPlaneTilt aria-hidden size={18} weight="fill" />}
            {status === "submitting" ? "Sending" : status === "error" ? "Try again" : "Send message"}
          </button>
          <p className={`form-status status-${status}`} role="status" aria-live="polite">
            {status === "success" ? <CheckCircle aria-hidden size={17} weight="fill" /> : null}
            {message || "Turnstile and rate limiting protect this form."}
          </p>
        </div>
      </form>
    </div>
  );
}
