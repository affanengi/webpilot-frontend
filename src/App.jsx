import { Routes, Route, Navigate } from "react-router-dom";

// Auth Pages
import Login from "./pages/auth/Login";
import Signup from "./pages/auth/Signup";
import CheckEmail from "./pages/auth/CheckEmail";
import VerifyEmail from "./pages/auth/VerifyEmail";
import ForgotPassword from "./pages/auth/ForgotPassword";

// Public Pages
import LandingPage from "./pages/public/LandingPage";
import PrivacyPage from "./pages/public/PrivacyPage";
import TermsPage from "./pages/public/TermsPage";
import Docs from "./pages/docs/Docs";

// Dashboard Pages
import Dashboard from "./pages/dashboard/Dashboard";
import Automations from "./pages/dashboard/Automations";
import AutomationDetails from "./pages/dashboard/AutomationDetails";
import CreateAutomation from "./pages/dashboard/CreateAutomation";
import CanvasAutomation from "./pages/dashboard/CanvasAutomation";
import AiChatView from "./pages/dashboard/AiChatView";
import ConnectedAccounts from "./pages/dashboard/ConnectedAccounts";
import ExecutionLogs from "./pages/dashboard/ExecutionLogs";
import Settings from "./pages/dashboard/Settings";
import Help from "./pages/dashboard/Help";
import Pricing from "./pages/dashboard/Pricing";
import ReportBug from "./pages/dashboard/support/ReportBug";
import FeatureRequest from "./pages/dashboard/support/FeatureRequest";
import ContactSupport from "./pages/dashboard/support/ContactSupport";

// Components
import ProtectedLayout from "./components/ProtectedLayout";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <Routes>
      {/* PUBLIC ROUTES (No GuestGuard, accessed freely) */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/legal/privacy" element={<PrivacyPage />} />
      <Route path="/legal/terms" element={<TermsPage />} />
      <Route path="/docs" element={<Docs />} />

      {/* AUTH ROUTES (Explicit, no auto-redirects here) */}
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/check-email" element={<CheckEmail />} />
      <Route path="/verify-email" element={<VerifyEmail />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />

      {/* PROTECTED DASHBOARD ROUTES */}
      <Route element={<ProtectedLayout />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/automations" element={<Automations />} />
        <Route path="/automations/:id" element={<AutomationDetails />} />
        <Route path="/create-automation" element={<CreateAutomation />} />
        <Route path="/connected-accounts" element={<ConnectedAccounts />} />
        <Route path="/execution-logs" element={<ExecutionLogs />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/support" element={<Help />} />
        <Route path="/support/report-bug" element={<ReportBug />} />
        <Route path="/support/feature-request" element={<FeatureRequest />} />
        <Route path="/support/contact" element={<ContactSupport />} />
      </Route>

      {/* STANDALONE PROTECTED ROUTE */}
      <Route path="/pricing" element={
        <ProtectedRoute>
          <Pricing />
        </ProtectedRoute>
      } />

      <Route path="/ai-chat" element={
        <ProtectedRoute>
          <AiChatView />
        </ProtectedRoute>
      } />

      <Route path="/canvas-automation" element={
        <ProtectedRoute>
          <CanvasAutomation />
        </ProtectedRoute>
      } />

      {/* FALLBACK */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default App;