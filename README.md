# <picture>
<div align="center">
  <img src = "https://avatars.githubusercontent.com/u/151918147?s=200&v=4" width = 125px></picture>
  <h3>A Business Process Compliance Management System</h3>
</div>

## 🗨 About

<img align="right" height="150" width="150" alt="GIF" src="https://cdn-icons-gif.flaticon.com/7211/7211818.gif">

Ensuring compliance with regulatory standards and internal policies is a complex challenge for organizations, especially in dynamic and unstructured business processes. Our mission is to develop and support tools that streamline Compliance Monitoring, Compliance Checking, and Compliance Management Systems to help organizations maintain adherence to standards like ISO, HIPAA, and GDPR.

## Key Features

- Compliance control catalog management
- Data visualization dashboards through Grafana integration
- AI assistants for compliance analysis and recommendations
- Automated control evaluation system
- Scope management for applying controls to different contexts
- Creation and customization of analytical dashboards

## Prerequisites

- Node.js (v22.11.0 or higher)
- npm (v10.9.0 or higher)
- Connection to the backend REST API (STATUS Backend)
- Access to Grafana for visualizations (optional)

## Installation

1. Clone the repository:

```bash
git clone https://github.com/statuscompliance/frontend.git
cd frontend
```

2. Install dependencies:

```bash
npm install
```

3. Configure environment variables:

Create a `.env` file in the root directory with the following content:

```
VITE_API_BASE_URL=http://localhost:3001/api/v1
VITE_NODE_RED_URL=http://localhost:1880
VITE_GRAFANA_URL=http://localhost:3100
```

## Running the Application

To start the development server:

```bash
npm run dev
```

To build for production:

```bash
npm run build
```

To preview the production build:

```bash
npm run preview
```

## Project Structure
Below is the rewritten markdown content with basic explanations for each folder:

### Root Level Directories
This project is organized into several directories that separate configuration files, source code, and public assets:
```bash
.
├── .devcontainer         # Configuration files for development container environments
├── .docker               # Docker configuration and scripts for containerization
├── .git                  # Git metadata and version control files
├── .github               # GitHub-specific configurations (workflows, issues, templates)
├── .husky                # Git hook scripts managed by Husky
├── node_modules          # Installed npm packages (dependencies)
├── public                # Public assets like HTML, images, and static files
└── src                   # Main source code containing the application logic
```
### Key Source Code Directories

Within the src directory, the structure is further broken down:

```bash
src
├── api         # Definitions for API calls and HTTP client configurations
├── assets      # Static assets such as images, fonts, and icons
├── components  # Reusable UI components used throughout the application
├── forms       # Form components for handling various user input (e.g., auth, catalog)
├── hooks       # Custom React hooks to encapsulate shared logic
├── layouts     # Layout components that structure the overall page design
├── lib         # Utility libraries and helper functions
├── pages       # Page-level components corresponding to different routes
├── services    # Business logic and API interaction services
├── styles      # Styling resources like CSS, SCSS files or Tailwind classes
└── utils       # Miscellaneous helper utilities and functions
```

### Component Structure

This folder groups various UI components for better modularity:

```bash
src/components
├── catalog     # UI components for managing catalogs and lists
├── dashboards  # Components related to visualization dashboards
├── forms       # Components specifically built for forms and inputs
├── layouts     # Components that define the structure of pages or sections
└── ui          # Basic, reusable UI elements (buttons, cards, etc.)
```

### Form Structure

Forms are organized by their context and use-case within the application:

```bash
src/forms
├── auth        # Forms handling user authentication and login
├── catalog     # Forms for catalog management and editing
├── control     # Forms for configuring controls and settings
├── dashboard   # Form components for setting up dashboards
├── folder      # Forms managing folder structures and file organization
├── scope       # Forms for defining scopes and contexts
└── scopeSet    # Forms handling groupings or sets of scopes
```

## Technologies Used

- **React**: User interface library
- **React Router**: Routing and navigation
- **Shadcn/UI**: Accessible and customizable UI components
- **Tailwind CSS**: Utility-first CSS framework
- **Vite**: Build tool and development server
- **Axios**: HTTP client for API communication
- **React Query**: Server state and caching management

## Authentication and API

The application uses JWT token-based authentication to communicate with the backend. The authentication flow includes:

1. **Login**: Users provide credentials validated by the backend.
2. **Access Token**: Stored in memory to authenticate requests.
3. **Refresh Token**: Used to obtain new access tokens.

For more details on available API endpoints, please refer to the API documentation in `/src/api/api.json`.

## Development

### Useful Commands

```bash
# Run tests
npm run test

# Lint the code
npm run lint

# Format code
npm run format
```

### Code Conventions

- Use functional components with hooks.
- Follow file naming conventions:
  - Components: PascalCase (e.g., `Button.jsx`)
  - Utilities/hooks: camelCase (e.g., `useAuth.js`)
- Write tests for key components and functionalities.

## Deployment

The application can be deployed on any server capable of serving static files. The production build generates optimized files in the `/dist` directory.

```bash
# Build for production
npm run build

# The resulting files are in /dist
```

## License

This project is licensed under the Apache 2.0 License. See the `LICENSE` file for details.
