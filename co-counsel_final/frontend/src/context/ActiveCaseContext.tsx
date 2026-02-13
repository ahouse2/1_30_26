import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const ACTIVE_CASE_STORAGE_KEY = 'co_counsel_active_case_id_v1';
const ACTIVE_CASE_EVENT_NAME = 'co-counsel:active-case-changed';

type ActiveCaseContextValue = {
  caseId: string;
  setCaseId: (nextCaseId: string) => void;
};

const ActiveCaseContext = createContext<ActiveCaseContextValue | undefined>(undefined);

const readInitialCaseId = (): string => {
  if (typeof window === 'undefined') {
    return 'default';
  }
  const saved = window.localStorage.getItem(ACTIVE_CASE_STORAGE_KEY)?.trim();
  return saved && saved.length > 0 ? saved : 'default';
};

export function ActiveCaseProvider({ children }: { children: React.ReactNode }) {
  const [caseId, setCaseIdState] = useState<string>(readInitialCaseId);

  const setCaseId = (nextCaseId: string) => {
    const normalized = nextCaseId.trim() || 'default';
    setCaseIdState(normalized);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(ACTIVE_CASE_STORAGE_KEY, normalized);
      window.dispatchEvent(new CustomEvent(ACTIVE_CASE_EVENT_NAME, { detail: normalized }));
    }
  };

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    const onStorage = (event: StorageEvent) => {
      if (event.key !== ACTIVE_CASE_STORAGE_KEY) return;
      const next = event.newValue?.trim() || 'default';
      setCaseIdState(next);
    };
    const onCaseChanged = (event: Event) => {
      const customEvent = event as CustomEvent<string>;
      const next = customEvent.detail?.trim() || 'default';
      setCaseIdState(next);
    };
    window.addEventListener('storage', onStorage);
    window.addEventListener(ACTIVE_CASE_EVENT_NAME, onCaseChanged as EventListener);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener(ACTIVE_CASE_EVENT_NAME, onCaseChanged as EventListener);
    };
  }, []);

  const value = useMemo(() => ({ caseId, setCaseId }), [caseId]);
  return <ActiveCaseContext.Provider value={value}>{children}</ActiveCaseContext.Provider>;
}

export function useActiveCase() {
  const context = useContext(ActiveCaseContext);
  if (!context) {
    throw new Error('useActiveCase must be used within ActiveCaseProvider');
  }
  return context;
}
