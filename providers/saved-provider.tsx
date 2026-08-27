"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { ReactNode } from "react";

import { STORAGE_KEY_SAVED } from "@/lib/config";
import type { SavedStory, Story } from "@/lib/types";

interface SavedContextValue {
  saved: SavedStory[];
  savedIds: Set<string>;
  ready: boolean;
  persistent: boolean;
  toggle: (story: Story, provider: string) => boolean;
  clear: () => void;
}

const SavedContext = createContext<SavedContextValue | null>(null);

function readStored(): { items: SavedStory[]; persistent: boolean } {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY_SAVED);
    return { items: raw ? (JSON.parse(raw) as SavedStory[]) : [], persistent: true };
  } catch {
    return { items: [], persistent: false };
  }
}

export function SavedProvider({ children }: { children: ReactNode }) {
  const [saved, setSaved] = useState<SavedStory[]>([]);
  const [ready, setReady] = useState(false);
  const [persistent, setPersistent] = useState(true);

  useEffect(() => {
    const stored = readStored();
    setSaved(Array.isArray(stored.items) ? stored.items : []);
    setPersistent(stored.persistent);
    setReady(true);
  }, []);

  const persist = useCallback((items: SavedStory[]) => {
    try {
      window.localStorage.setItem(STORAGE_KEY_SAVED, JSON.stringify(items));
    } catch {
      setPersistent(false);
    }
  }, []);

  const toggle = useCallback(
    (story: Story, provider = "unknown") => {
      let added = false;
      setSaved((current) => {
        const exists = current.some((item) => item.id === story.id);
        added = !exists;
        const next = exists
          ? current.filter((item) => item.id !== story.id)
          : [{ ...story, provider, savedAt: new Date().toISOString() }, ...current];
        persist(next);
        return next;
      });
      return added;
    },
    [persist],
  );

  const clear = useCallback(() => {
    setSaved([]);
    persist([]);
  }, [persist]);

  const value = useMemo<SavedContextValue>(
    () => ({
      saved,
      savedIds: new Set(saved.map((item) => item.id)),
      ready,
      persistent,
      toggle,
      clear,
    }),
    [saved, ready, persistent, toggle, clear],
  );

  return <SavedContext.Provider value={value}>{children}</SavedContext.Provider>;
}

export function useSaved(): SavedContextValue {
  const context = useContext(SavedContext);
  if (!context) throw new Error("useSaved must be used inside <SavedProvider>");
  return context;
}
