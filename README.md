# ZIS Workflow Manager

A powerful visual workflow designer for Zendesk Integration Services (ZIS) that allows you to create, edit, and manage complex automation workflows through an intuitive drag-and-drop interface.




https://github.com/user-attachments/assets/72ad8865-7a15-4b5a-9338-1326cb230997




## 🚀 Features

- **Visual Workflow Designer**: Build workflows using a drag-and-drop canvas with React Flow
- **ZIS Integration**: Native support for Zendesk Integration Services with proper resource management
- **Node Types Support**: Action, Choice, Pass, Succeed, and Fail nodes
- **Real-time**: Instant feedback on workflow configuration
- **Import/Export**: Import existing workflows and export as ZIS-compatible JSON
- **Action Management**: Create and manage HTTP actions with connection configurations
- **Theme Support**: Light and dark mode with system preference detection

## 🛠️ Technology Stack

- **Framework**: Next.js 15 with TypeScript
- **UI Library**: React 18 with Radix UI components
- **Styling**: Tailwind CSS with custom animations
- **Workflow Engine**: React Flow for visual workflow management
- **State Management**: React hooks with local state
- **Form Handling**: React Hook Form with Zod validation
- **Icons**: Lucide React
- **Development**: ESLint, TypeScript, Turbopack

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (version 20 or higher)
- **npm** or **yarn**
- **Zendesk CLI (zcli)** for Zendesk app development

## 🔧 Installation

1. **Clone the repository**:

   ```bash
   git clone <repository-url>
   cd zis_workflow_manager
   ```

2. **Install dependencies**:

   ```bash
   npm install
   ```

## 🚀 Development

### For Zendesk App Development

Run the development server with Zendesk CLI integration:

```bash
npm run dev:zcli
```

This command will:

- Generate the manifest file
- Start the Next.js development server on port 9002
- Start the Zendesk CLI apps server
- In the browser add "zcli_apps=true" and the app will run as a Navbar App.

### For Standalone Development\*

Run just the Next.js development server:

```bash
npm run dev
```

> <b>Important</b>
> This is built keeping in mind to be used in zendesk apps interface (Navbar App).
> If you would like to use it as a standalone, please consider updating ZDClient.js files to use API with authentication.

Open [http://localhost:9002](http://localhost:9002) in your browser to see the application.

## 📁 Project Structure

```
src/
├── app/                    # Next.js app directory
│   ├── page.tsx           # Main application page
│   ├── layout.tsx         # Root layout component
│   └── globals.css        # Global styles
├── components/            # React components
│   ├── layout/           # Layout-related components
│   ├── ui/               # Reusable UI components (Radix-based)
│   └── workflow/         # Workflow-specific components
├── hooks/                # Custom React hooks
├── lib/                  # Utility functions and types
│   ├── types.ts         # TypeScript type definitions
│   ├── workflow-utils.ts # Workflow processing utilities
│   └── sample-workflow.ts # Sample workflow data
└── translations/         # Internationalization files
```

## 🔄 Workflow Components

### Node Types

- **Action Node**: Executes HTTP requests or other actions
- **Choice Node**: Conditional branching based on data evaluation
- **Pass Node**: Passes data through with optional transformations
- **Succeed Node**: Marks successful workflow completion
- **Fail Node**: Handles workflow failures with error details

### Key Features

- **Visual Canvas**: Drag-and-drop interface for building workflows
- **Property Panels**: Context-sensitive configuration panels
- **Action Library**: Manage reusable HTTP actions
- **Import/Export**: Full workflow serialization support
- **Validation**: Real-time workflow validation and error reporting

## 📝 Usage

### Creating a New Workflow

1. Click "New Workflow" in the header
2. Fill in the workflow details:
   - Name and description
   - JobSpec configuration
   - Event source and type
3. Start building your workflow on the canvas

### Adding Nodes

1. Click the "+" button on any edge to add a new node
2. Select the node type (Action, Choice, Pass, etc.)
3. Configure the node properties in the sidebar

### Managing Actions

1. Click "Manage Actions" in the header
2. Create new HTTP actions or edit existing ones
3. Configure connection details, headers, and parameters

### Exporting Workflows

1. Click "Export" in the header
2. Choose your export format
3. Save the generated ZIS-compatible JSON

## 🔨 Build Commands

- `npm run build:zcli` - Build and package as Zendesk app
  This will build the app and output the contents in `out` folder.
  A zip of the app is created in `out/tmp/` to upload in zendesk instance.

## 🌟 Zendesk Integration

This application is designed to work as a Zendesk app and integrates with:

- **Zendesk Integration Services (ZIS)**: Native workflow execution
- **Zendesk App Framework**: Embedded app experience
- **Zendesk CLI**: Development and deployment tools

## 🎨 Customization

### Themes

The app supports light and dark themes that automatically adapt to system preferences. You can customize themes by modifying the CSS variables in `globals.css`.

### Components

All UI components are built with Radix UI and can be customized through the `components/ui/` directory. The design system is based on shadcn/ui patterns.

## 🧪 Development Tips

- Use the provided sample workflow as a starting point
- Leverage TypeScript for type safety with ZIS resources
- Follow the established component patterns for consistency
- Test workflows thoroughly before deployment

## 📚 Additional Resources

- [Zendesk Integration Services Documentation](https://developer.zendesk.com/documentation/integration-services/)
- [React Flow Documentation](https://reactflow.dev/)
- [Next.js Documentation](https://nextjs.org/docs)
- [Radix UI Documentation](https://www.radix-ui.com/)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📧 Support

For questions or support, contact: ashwin.shenoy@zendesk.com or skip@zendesk.com
