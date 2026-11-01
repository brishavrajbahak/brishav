"use client";

import { List, Moon, Sun, X } from "@phosphor-icons/react";
import { useEffect, useState } from "react";
import { navigation, siteConfig } from "@/lib/content";

const THEME_KEY = "brishav-theme-v1";

export function V5Header() {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [active, setActive] = useState("home");
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const current = document.documentElement.dataset.theme === "dark" ? "dark" : "light";
    const themeFrame = window.requestAnimationFrame(() => setTheme(current));
    const sections = navigation
      .map(({ id }) => document.getElementById(id))
      .filter((section): section is HTMLElement => Boolean(section));
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((left, right) => right.intersectionRatio - left.intersectionRatio)[0];
        if (visible?.target.id) setActive(visible.target.id);
      },
      { rootMargin: "-22% 0px -62% 0px", threshold: [0.05, 0.3, 0.65] }
    );
    sections.forEach((section) => observer.observe(section));
    return () => {
      window.cancelAnimationFrame(themeFrame);
      observer.disconnect();
    };
  }, []);

  function changeTheme() {
    const next = theme === "light" ? "dark" : "light";
    document.documentElement.dataset.theme = next;
    document.documentElement.style.colorScheme = next;
    localStorage.setItem(THEME_KEY, next);
    setTheme(next);
  }

  function goTo(id: string) {
    const element = document.getElementById(id);
    if (!element) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    element.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
    window.history.replaceState(null, "", `#${id}`);
    setMenuOpen(false);
  }

  return (
    <header className={active === "home" ? "v5-header" : "v5-header compact"}>
      <button className="v5-brand" type="button" onClick={() => goTo("home")}>
        <span>{siteConfig.initials}</span>
        <span><strong>{siteConfig.name}</strong><small>Data analyst in progress</small></span>
      </button>

      <nav className="v5-nav" aria-label="Primary navigation">
        {navigation.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            className={active === id ? "active" : ""}
            aria-current={active === id ? "location" : undefined}
            onClick={() => goTo(id)}
          >
            {label}
          </button>
        ))}
      </nav>

      <div className="v5-header-actions">
        <button className="v5-icon-button" type="button" onClick={changeTheme} aria-label={`Switch to ${theme === "light" ? "dark" : "light"} theme`}>
          {theme === "light" ? <Moon aria-hidden size={19} /> : <Sun aria-hidden size={19} />}
        </button>
        <button className="v5-menu-button" type="button" onClick={() => setMenuOpen((value) => !value)} aria-expanded={menuOpen} aria-controls="mobile-navigation" aria-label={menuOpen ? "Close navigation" : "Open navigation"}>
          {menuOpen ? <X aria-hidden size={21} /> : <List aria-hidden size={21} />}
        </button>
      </div>

      {menuOpen ? (
        <nav id="mobile-navigation" className="v5-mobile-nav" aria-label="Mobile navigation">
          {navigation.map(({ id, label }, index) => (
            <button key={id} type="button" onClick={() => goTo(id)}>
              <span>{String(index + 1).padStart(2, "0")}</span>{label}
            </button>
          ))}
        </nav>
      ) : null}
    </header>
  );
}
