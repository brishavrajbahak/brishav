"use client";

import { ArrowClockwise, CheckCircle, PaperPlaneTilt, ShieldCheck } from "@phosphor-icons/react";
import { FormEvent, useCallback, useRef, useState } from "react";
import { PortfolioApiError, submitContact, type ContactPayload } from "@/lib/api";
import { TurnstileWidget, type TurnstileHandle } from "./turnstile-widget";

type FormStatus = "idle" | "submitting" | "success" | "error";

const TURNSTILE_SITE_KEY =
  process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim() || "0x4AAAAAADfvO0DUYxnOpyJM";

export function ContactForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const turnstileRef = useRef<TurnstileHandle>(null);
  const [token, setToken] = useState("");
  const [status, setStatus] = useState<FormStatus>("idle");
  const [message, setMessage] = useState("");

  const handleToken = useCallback((nextToken: string) => {
    setToken(nextToken);
    if (nextToken) {
      setStatus((current) => (current === "error" ? "idle" : current));
      setMessage("");
    }
  }, []);

  const handleTurnstileError = useCallback((nextMessage: string) => {
    setStatus("error");
    setMessage(nextMessage);
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    if (!form.reportValidity()) return;
    if (!token) {
      setStatus("error");
      setMessage("Complete the secure verification before sending your message.");
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
    setMessage("Sending your signal securely…");
    try {
      const response = await submitContact(payload, token);
      setStatus("success");
      setMessage(response.message);
      form.reset();
      setToken("");
      turnstileRef.current?.reset();
    } catch (cause) {
      const error = cause instanceof PortfolioApiError ? cause : null;
      setStatus("error");
      setMessage(error?.message || "The message could not be sent. Please retry.");
      setToken("");
      turnstileRef.current?.reset();
    }
  }

  return (
    <div className="contact-form-shell">
      <div className="form-header">
        <div><span>Secure uplink</span><strong>Direct contact channel</strong></div>
        <ShieldCheck aria-hidden size={24} weight="duotone" />
      </div>
      <form ref={formRef} onSubmit={handleSubmit} noValidate>
        <div className="form-grid">
          <label>
            <span>Name</span>
            <input name="name" type="text" autoComplete="name" minLength={2} maxLength={120} required />
          </label>
          <label>
            <span>Email</span>
            <input name="email" type="email" inputMode="email" autoComplete="email" maxLength={254} required />
          </label>
        </div>
        <label>
          <span>Subject <small>Optional</small></span>
          <input name="subject" type="text" autoComplete="off" maxLength={160} />
        </label>
        <label>
          <span>Message</span>
          <textarea name="message" minLength={10} maxLength={4000} rows={6} required />
        </label>
        <label className="honeypot" aria-hidden="true">
          Website
          <input name="website" type="text" tabIndex={-1} autoComplete="off" />
        </label>
        <TurnstileWidget
          ref={turnstileRef}
          siteKey={TURNSTILE_SITE_KEY}
          onToken={handleToken}
          onError={handleTurnstileError}
        />
        <div className="form-submit-row">
          <button className="primary-button" type="submit" disabled={status === "submitting" || !TURNSTILE_SITE_KEY}>
            {status === "submitting" ? <ArrowClockwise className="spin" aria-hidden size={18} /> : <PaperPlaneTilt aria-hidden size={18} weight="fill" />}
            {status === "submitting" ? "Sending signal" : status === "error" ? "Retry message" : "Join the Dataverse"}
          </button>
          <p className={`form-status status-${status}`} role="status" aria-live="polite">
            {status === "success" ? <CheckCircle aria-hidden size={17} weight="fill" /> : null}
            {message || "Turnstile verification and rate limiting protect this channel."}
          </p>
        </div>
      </form>
    </div>
  );
}
