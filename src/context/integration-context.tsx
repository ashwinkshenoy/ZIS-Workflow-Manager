'use client';

import { createContext, useContext, useState, ReactNode } from 'react';
import type { Integration } from '@/lib/types';

/**
 * Type definition for the Integration context value
 * @property {string | null} selectedIntegration - The name of the currently selected integration, or null if none selected
 * @property {function} setSelectedIntegration - Function to update the selected integration name
 */
type IntegrationContextType = {
  selectedIntegration: string | null;
  setSelectedIntegration: (integrationName: string | null) => void;
  selectedIntegrationObject: Integration | null;
  setSelectedIntegrationObject: (integrationObject: Integration | null) => void;
  allIntegrations: Integration[];
  setAllIntegrations: (integrations: Integration[]) => void;
};

/**
 * Context for managing the currently selected integration key across the application
 * Provides global access to the integration name without prop drilling
 */
const IntegrationContext = createContext<IntegrationContextType | undefined>(undefined);

/**
 * Provider component that wraps the application to provide integration context
 * Should be placed high in the component tree (e.g., in layout.tsx)
 * @param {ReactNode} children - Child components that will have access to the integration context
 * @returns {JSX.Element} Provider component with integration state
 *
 * @example
 * <IntegrationProvider>
 *   <App />
 * </IntegrationProvider>
 */
export function IntegrationProvider({ children }: { children: ReactNode }) {
  const [selectedIntegration, setSelectedIntegration] = useState<string | null>(null);
  const [selectedIntegrationObject, setSelectedIntegrationObject] = useState<Integration | null>(null);
  const [allIntegrations, setAllIntegrations] = useState<Integration[]>([]);

  return (
    <IntegrationContext.Provider
      value={{
        selectedIntegration,
        setSelectedIntegration,
        selectedIntegrationObject,
        setSelectedIntegrationObject,
        allIntegrations,
        setAllIntegrations,
      }}>
      {children}
    </IntegrationContext.Provider>
  );
}

/**
 * Custom hook to access the integration context
 * Must be used within a component that is a descendant of IntegrationProvider
 * @returns {IntegrationContextType} Object containing selectedIntegration and setSelectedIntegration
 * @throws {Error} If used outside of IntegrationProvider
 *
 * @example
 * function MyComponent() {
 *   const { selectedIntegration, setSelectedIntegration } = useIntegration();
 *
 *   return <div>{selectedIntegration}</div>;
 * }
 */
export function useIntegration() {
  const context = useContext(IntegrationContext);
  if (context === undefined) {
    throw new Error('useIntegration must be used within an IntegrationProvider');
  }
  return context;
}
