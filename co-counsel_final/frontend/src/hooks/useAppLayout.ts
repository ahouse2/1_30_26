import { useState } from 'react';
import { SectionId } from '@/components/layout/Sidebar';

export const useAppLayout = () => {
  const [activeSection, setActiveSection] = useState<SectionId>('timeline');

  return {
    activeSection,
    setActiveSection,
  };
};
