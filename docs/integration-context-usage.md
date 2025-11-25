# Integration Context Usage

## Overview

The `IntegrationContext` provides global access to the currently selected integration name across all components in the application.

## Setup

The context is already set up and wrapped around your application in `src/app/layout.tsx`.

## How to Use in Any Component

### 1. Import the hook

```tsx
import { useIntegration } from '@/context/integration-context';
```

### 2. Use the hook in your component

```tsx
export function YourComponent() {
  const { selectedIntegration, setSelectedIntegration } = useIntegration();

  // Read the current integration name
  console.log(selectedIntegration); // e.g., "my-integration-name" or null

  // Update the integration name (if needed)
  const handleChange = () => {
    setSelectedIntegration('new-integration-name');
  };

  return (
    <div>
      {selectedIntegration ? <p>Current integration: {selectedIntegration}</p> : <p>No integration selected</p>}
    </div>
  );
}
```

## Examples

### Example 1: Using in a component that needs to read the integration

```tsx
import { useIntegration } from '@/context/integration-context';

export function MyComponent() {
  const { selectedIntegration } = useIntegration();

  useEffect(() => {
    if (selectedIntegration) {
      // Fetch data for this integration
      fetchData(selectedIntegration);
    }
  }, [selectedIntegration]);

  return <div>Integration: {selectedIntegration}</div>;
}
```

### Example 2: Conditional rendering based on integration

```tsx
import { useIntegration } from '@/context/integration-context';

export function SettingsPanel() {
  const { selectedIntegration } = useIntegration();

  if (!selectedIntegration) {
    return <p>Please select an integration first</p>;
  }

  return (
    <div>
      <h2>Settings for {selectedIntegration}</h2>
      {/* Your settings UI */}
    </div>
  );
}
```

## Current Implementation

The context is currently used in:

- **Header Component** (`src/components/layout/header.tsx`): Sets the integration when user selects from dropdown
- **Configs Sidebar** (`src/components/workflow/configs-sidebar.tsx`): Reads the integration to fetch/save configs

## Benefits

- ✅ No prop drilling needed
- ✅ Single source of truth for selected integration
- ✅ Automatic updates across all components
- ✅ Type-safe with TypeScript
