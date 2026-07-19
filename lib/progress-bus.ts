import { clampProgress, type CinematicChapterId } from "./cinematic";

export type ProgressChannel = CinematicChapterId;
export type ProgressListener = (progress: number) => void;
export type SectionListener = (section: CinematicChapterId) => void;

const progressValues = new Map<ProgressChannel, number>();
const progressListeners = new Map<ProgressChannel, Set<ProgressListener>>();
const sectionListeners = new Set<SectionListener>();
let activeSection: CinematicChapterId = "home";

export const cinematicProgress = {
  read(channel: ProgressChannel) {
    return progressValues.get(channel) ?? 0;
  },

  publish(channel: ProgressChannel, value: number) {
    const next = clampProgress(value);
    if (progressValues.get(channel) === next) return;
    progressValues.set(channel, next);
    progressListeners.get(channel)?.forEach((listener) => listener(next));
  },

  subscribe(channel: ProgressChannel, listener: ProgressListener) {
    const listeners = progressListeners.get(channel) ?? new Set<ProgressListener>();
    listeners.add(listener);
    progressListeners.set(channel, listeners);
    listener(progressValues.get(channel) ?? 0);
    return () => {
      listeners.delete(listener);
      if (listeners.size === 0) progressListeners.delete(channel);
    };
  },

  readActiveSection() {
    return activeSection;
  },

  setActiveSection(section: CinematicChapterId) {
    if (activeSection === section) return;
    activeSection = section;
    sectionListeners.forEach((listener) => listener(section));
  },

  subscribeActiveSection(listener: SectionListener) {
    sectionListeners.add(listener);
    listener(activeSection);
    return () => {
      sectionListeners.delete(listener);
    };
  }
};
