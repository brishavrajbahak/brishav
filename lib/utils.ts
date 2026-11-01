import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function scrollToSection(id: string, reducedMotion = false) {
  document.getElementById(id)?.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "start" });
}

export function scrollSequenceToProgress(selector: string, progress: number, reducedMotion = false) {
  const sequence = document.querySelector<HTMLElement>(selector);
  if (!sequence) return;
  const top = sequence.getBoundingClientRect().top + window.scrollY;
  const distance = Math.max(0, sequence.offsetHeight - window.innerHeight);
  window.scrollTo({
    top: top + Math.min(1, Math.max(0, progress)) * distance,
    behavior: reducedMotion ? "auto" : "smooth"
  });
}
