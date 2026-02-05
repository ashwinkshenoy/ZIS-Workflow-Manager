'use client';

import { createContext, useContext, useState, ReactNode } from 'react';
import type { Integration } from '@/lib/types';
import ZDClient from '@/lib/ZDClient';

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

  isActionsSidebarOpen: boolean;
  setActionsSidebarOpen: (isOpen: boolean) => void;

  isConfigsSidebarOpen: boolean;
  setConfigsSidebarOpen: (isOpen: boolean) => void;

  selectedActionForEdit: string | null;
  setSelectedActionForEdit: (actionKey: string | null) => void;

  isPlayground: boolean;
  setIsPlayground: (isPlayground: boolean) => void;

  integrationConfig: Record<string, any> | null;
  setIntegrationConfig: (config: Record<string, any> | null) => void;

  showWorkflowTour: boolean;
  setShowWorkflowTour: (show: boolean) => void;

  fetchConfigs: (selectedIntegrationObject?: Integration | null) => Promise<Record<string, any> | null>;
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
  const [isActionsSidebarOpen, setActionsSidebarOpen] = useState<boolean>(false);
  const [isConfigsSidebarOpen, setConfigsSidebarOpen] = useState<boolean>(false);
  const [selectedActionForEdit, setSelectedActionForEdit] = useState<string | null>(null);
  const [isPlayground, setIsPlayground] = useState<boolean>(false);
  const [integrationConfig, setIntegrationConfig] = useState<Record<string, any> | null>(null);
  const [showWorkflowTour, setShowWorkflowTour] = useState<boolean>(false);

  /**
   * Fetches the configurations from the ZIS API for the selected integration
   * @returns {Promise<Record<string, any> | null>} The configuration object or null if not found
   */
  const fetchConfigs = async (
    selectedIntegrationObject: Integration | null = null,
  ): Promise<Record<string, any> | null> => {
    const localSelectedIntegration = selectedIntegrationObject?.name || selectedIntegration;
    if (!localSelectedIntegration) {
      console.warn('No integration selected');
      return null;
    }
    try {
      const response = await ZDClient.getZisConfigApi(localSelectedIntegration);
      const configData = response?.configs?.[0]?.config;
      if (configData) {
        setIntegrationConfig(configData);
        return configData;
      }
      return null;
    } catch (err: any) {
      console.error('Failed to fetch configs:', err);
      throw err;
    }
  };

  return (
    <IntegrationContext.Provider
      value={{
        selectedIntegration,
        setSelectedIntegration,

        selectedIntegrationObject,
        setSelectedIntegrationObject,

        allIntegrations,
        setAllIntegrations,

        isActionsSidebarOpen,
        setActionsSidebarOpen,

        isConfigsSidebarOpen,
        setConfigsSidebarOpen,

        selectedActionForEdit,
        setSelectedActionForEdit,

        isPlayground,
        setIsPlayground,

        integrationConfig,
        setIntegrationConfig,

        showWorkflowTour,
        setShowWorkflowTour,

        fetchConfigs,
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
