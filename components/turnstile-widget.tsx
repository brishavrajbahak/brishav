"use client";

import Script from "next/script";
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";

type TurnstileApi = {
  render: (container: HTMLElement, options: Record<string, unknown>) => string;
  reset: (widgetId?: string) => void;
  remove: (widgetId: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

export type TurnstileHandle = { reset: () => void };

type TurnstileWidgetProps = {
  siteKey: string;
  onToken: (token: string) => void;
  onError: (message: string) => void;
};

export const TurnstileWidget = forwardRef<TurnstileHandle, TurnstileWidgetProps>(
  function TurnstileWidget({ siteKey, onToken, onError }, forwardedRef) {
    const containerRef = useRef<HTMLDivElement>(null);
    const widgetIdRef = useRef<string | null>(null);
    const [ready, setReady] = useState(false);

    useEffect(() => {
      if (window.turnstile) setReady(true);
    }, []);

    useEffect(() => {
      if (!ready || !siteKey || !containerRef.current || !window.turnstile || widgetIdRef.current) return;
      widgetIdRef.current = window.turnstile.render(containerRef.current, {
        sitekey: siteKey,
        theme: "light",
        size: "flexible",
        action: "portfolio_contact",
        callback: (token: string) => onToken(token),
        "expired-callback": () => {
          onToken("");
          onError("Verification expired. Please complete it again.");
        },
        "error-callback": () => {
          onToken("");
          onError("Verification could not be completed. Please retry.");
        }
      });

      return () => {
        if (widgetIdRef.current && window.turnstile) {
          window.turnstile.remove(widgetIdRef.current);
          widgetIdRef.current = null;
        }
      };
    }, [onError, onToken, ready, siteKey]);

    useImperativeHandle(forwardedRef, () => ({
      reset() {
        if (widgetIdRef.current && window.turnstile) window.turnstile.reset(widgetIdRef.current);
      }
    }));

    if (!siteKey) {
      return <p className="turnstile-unavailable" role="status">Contact verification is not configured for this build.</p>;
    }

    return (
      <div className="turnstile-shell">
        <Script
          id="cloudflare-turnstile"
          src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
          strategy="lazyOnload"
          onLoad={() => setReady(true)}
        />
        <div ref={containerRef} className="turnstile-widget" role="group" aria-label="Cloudflare human verification" />
        {!ready ? <span className="turnstile-loading">Loading secure verification…</span> : null}
      </div>
    );
  }
);
