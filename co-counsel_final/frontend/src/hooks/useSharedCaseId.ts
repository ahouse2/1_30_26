import { useActiveCase } from '@/context/ActiveCaseContext';

export function useSharedCaseId() {
  const { caseId, setCaseId } = useActiveCase();
  return { caseId, setCaseId };
}
