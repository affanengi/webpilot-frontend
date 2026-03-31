# WebPilot Frontend Platform

![WebPilot Logo](https://via.placeholder.com/800x200?text=WebPilot+Automation+Platform)

**WebPilot** is an intelligent, AI-driven automation platform built to streamline the orchestration of complex workflows and integrations. This repository houses the frontend architecture of WebPilot, providing the ultimate user interface for creating, managing, debugging, and executing intricate logic chains and N8N-backed automations without writing any code.

This document serves as the central directory and architectural overview for developers working on the WebPilot frontend. 

---

## 🚀 Key Features

- **Intuitive Visual Canvas:** A drag-and-drop workflow builder using React Flow, empowering users to connect disparate applications (like Notion, Gmail, YouTube) through visual nodes.
- **AI-Powered Automation Creation:** An integrated AI Chat Assistant that translates natural language prompts into fully functional, deployable automation sequences.
- **Secure Authentication & Management:** Complete user lifecycle management utilizing Firebase Authentication, featuring protected route guarding and onboarding flows.
- **Real-time Execution & Logging:** A detailed dashboard that allows users to monitor their automations, view real-time log streams, inspect webhook payloads, and diagnose issues with robust observability.

---

## 🛠 Tech Stack

Our frontend is constructed utilizing modern, high-performance web technologies:

- **Library:** [React 19](https://react.dev) (Latest specifications)
- **Tooling/Bundler:** [Vite 7](https://vitejs.dev)
- **Styling:** [Tailwind CSS 4](https://tailwindcss.com) & custom design system tokens
- **Routing:** [React Router DOM](https://reactrouter.com/)
- **Visual Nodes:** [React Flow](https://reactflow.dev) for interactive canvas manipulation
- **Authentication & Database:** [Firebase](https://firebase.google.com) (Auth & Firestore interaction)
- **Analytics/Charts:** [Recharts](https://recharts.org)

---

## 🏗 Architecture & Folder Structure

The project follows a modular, feature-based directory structure found within the `src/` folder to promote scalability:

```text
src/
├── api/          # Contains functions and services for communicating with the Node.js backend.
├── assets/       # Static files, brand logos, SVGs, and global styles.
├── components/   # Reusable, stateless UI components (e.g., Modals, Buttons, Inputs, ProtectedLayout).
├── context/      # React Context providers (e.g., AuthContext, ThemeContext) for global state.
├── data/         # Static configuration arrays, lookup tables, and mock data for UI planning.
├── pages/        # Route-level components grouped by their domain (auth, public, dashboard).
├── policies/     # Privacy policies and Terms of Service documents.
├── utils/        # Helper functions, formatters, and shared utility logic.
├── App.jsx       # The root router configuration defining all access levels.
└── main.jsx      # The React entry point.
```

---

## 🔄 Page Connection & Communication Flow

### Routing Design (`App.jsx`)

The routing layer is designed with strict boundaries, organizing navigation into three distinct zones based on user authentication contexts:

1. **Public Routes (`/`, `/docs`, `/legal/*`):** 
   These pages are freely accessible. Users arriving at the `LandingPage` can read about the product, access documentation, or navigate to authentication checkpoints.

2. **Authentication Routes (`/login`, `/signup`, `/forgot-password`, etc.):**
   Handled by pages residing in `src/pages/auth/`. Once Firebase Authentication verifies a user, the application context registers a session and forcefully redirects the user into the protected zone.

3. **Protected Dashboard Routes (`/dashboard`, `/automations`, `/ai-chat`, etc.):**
   These routes are strictly guarded using the `ProtectedLayout` and `ProtectedRoute` higher-order components. If an unauthenticated user attempts to visit these paths, they are immediately redirected to `/login`.

### Internal Data Flow

Data flows through the WebPilot application using a unidirectional model combined with Context API for cross-cutting concerns:

- **State Management:** The `AuthContext` holds the current user's session token and user profile data. `Layout` components wrap child pages, injecting user contexts where necessary.
- **Component Communication:** The application is highly composition-based. Pages act as "smart" containers. For example, `CanvasAutomation.jsx` handles the state of nodes and edges, passing these down to the React Flow instance and sub-components as "dumb" props. 
- **Backend Communication:** When a user modifies an automation or requests a new AI workflow, the page components trigger service layers found in the `src/api` directory. These API functions send `fetch` requests with HTTP Bearer tokens to our Node.js platform, which then orchestrates the logic in the N8N instance and stores metadata in Firestore.
- **AI Chat Flow:** On the `AiChatView` page, interactions are maintained in local state. When sending a prompt, the UI components invoke backend AI chat endpoints, receiving automation schemas which are then visualized directly in the chat UI or pushed to the `CanvasAutomation` interface for user modification.

---

## ⚙️ Development & Setup

### Prerequisites
- Node.js (v18+)
- npm or yarn
- Environment configuration connecting to WebPilot Backend & Firebase

### Installation

1. Clone the repository and navigate to the project root.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up the Environment Variables:
   Create a `.env.local` file at the root tracking the Firebase keys and backend URLs:
   ```env
   VITE_FIREBASE_API_KEY="your-api-key"
   VITE_FIREBASE_AUTH_DOMAIN="your-domain"
   VITE_FIREBASE_PROJECT_ID="your-project"
   VITE_WEB_PILOT_BACKEND_URL="http://localhost:3000"
   ```
4. Start the development server using Vite:
   ```bash
   npm run dev
   ```

### Building for Production
To bundle the frontend application with code-splitting and optimization, execute:
```bash
npm run build
```
This generates the minimized, deployment-ready static files into the `dist/` tracking folder.

---
*WebPilot - Democratizing AI Automation*
