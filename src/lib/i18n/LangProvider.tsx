"use client";

import { createContext, useCallback, useContext, useMemo, useSyncExternalStore } from "react";
import { STR, type Lang, type Strings } from "./strings";

const STORAGE_KEY = "wostep-lang";
const listeners = new Set<() => void>();

function subscribe(callback: () => void) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

function getSnapshot(): Lang {
  const stored = window.localStorage.getItem(STORAGE_KEY);
  return stored === "EN" || stored === "FR" ? stored : "EN";
}

function getServerSnapshot(): Lang {
  return "EN";
}

function writeLang(next: Lang) {
  window.localStorage.setItem(STORAGE_KEY, next);
  listeners.forEach((callback) => callback());
}

type LangContextValue = {
  lang: Lang;
  t: Strings;
  toggleLang: () => void;
  setLang: (lang: Lang) => void;
};

const LangContext = createContext<LangContextValue | null>(null);

export function LangProvider({ children }: { children: React.ReactNode }) {
  const lang = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const setLang = useCallback((next: Lang) => writeLang(next), []);
  const toggleLang = useCallback(() => writeLang(lang === "EN" ? "FR" : "EN"), [lang]);

  const value = useMemo<LangContextValue>(
    () => ({ lang, t: STR[lang], toggleLang, setLang }),
    [lang, toggleLang, setLang]
  );

  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}

export function useLang() {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error("useLang must be used within LangProvider");
  return ctx;
}
