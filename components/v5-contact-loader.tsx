"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";

const ContactForm = dynamic(() => import("./contact-form").then((module) => module.ContactForm), { ssr: false });

export function V5ContactLoader() {
  const rootRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      setReady(true);
      observer.disconnect();
    }, { rootMargin: "500px 0px" });
    observer.observe(root);
    return () => observer.disconnect();
  }, []);
  return <div ref={rootRef} className="v5-contact-form-slot">{ready ? <ContactForm /> : <p>The protected form loads as you approach it.</p>}</div>;
}
