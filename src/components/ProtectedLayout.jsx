import { useState, useEffect, useRef } from "react";
import { Outlet, useLocation, Navigate, useNavigate, matchPath } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import { automations } from "../data/automations";

const getPageMeta = (location) => {
    const pathname = location.pathname;
    const state = location.state;

    // 1. DYNAMIC ROUTES: Automation Details
    const automationMatch = matchPath("/automations/:id", pathname);
    if (automationMatch) {
        const id = automationMatch.params.id;
        const automation = automations.find(a => a.id === id);
        if (automation) {
            return {
                title: automation.title,
                subtitle: "Configure and run this workflow.",
                backPath: "/automations"
            };
        }
    }

    // 2. STATIC SUB-ROUTES (Support)
    // Determine back path from state (context-aware) or default to /support
    const backPath = state?.from || "/support";

    if (pathname === "/support/contact") return { title: "Contact Support", subtitle: "We're here to help", backPath };
    if (pathname === "/support/report-bug") return { title: "Report a Bug", subtitle: "Help us improve WebPilot", backPath };
    if (pathname === "/support/feature-request") return { title: "Feature Request", subtitle: "Share your ideas with us", backPath };
    if (pathname.startsWith("/create-automation")) return { title: "Create New Automation", subtitle: "Design your automated workflow by chaining predefined steps.", backPath: "/dashboard" };

    // 3. MAIN ROUTES
    if (pathname.startsWith("/support")) return { title: "Help & Support", subtitle: "Get help with your automations." };
    if (pathname.startsWith("/automations")) return { title: "Automations", subtitle: "Manage and configure your automated workflows." };
    if (pathname.startsWith("/settings")) return { title: "Settings", subtitle: "Manage your account and preferences." };
    if (pathname.startsWith("/execution-logs")) return { title: "Execution Logs", subtitle: "View history of all automation runs." };
    if (pathname.startsWith("/connected-accounts")) return { title: "Connected Accounts", subtitle: "Manage your third-party account integrations." };
    if (pathname.startsWith("/pricing")) return { title: "Plans & Billing", subtitle: "Manage your subscription plan." };

    // Default
    return { title: "Dashboard", subtitle: "Overview of your automation activity." };
};

export default function ProtectedLayout() {
    const { user, authInitialized } = useAuth();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();

    // Derived state for title/subtitle/backPath from Logic
    const defaultMeta = getPageMeta(location);

    // Dynamic Meta State (Allows children to override)
    const [customMeta, setCustomMeta] = useState(null);

    // Reset custom meta on navigation
    useEffect(() => {
        setCustomMeta(null);
    }, [location.pathname]);

    // Final calculations
    const finalTitle = customMeta?.title || defaultMeta.title;
    const finalSubtitle = customMeta?.subtitle || defaultMeta.subtitle;
    const finalBackPath = customMeta?.backPath || defaultMeta.backPath;

    // Scroll Reset Logic
    const mainContentRef = useRef(null);

    useEffect(() => {
        if (mainContentRef.current) {
            mainContentRef.current.scrollTop = 0;
        }
    }, [location.pathname]);

    if (!authInitialized) {
        return (
            <div className="flex h-screen items-center justify-center bg-white dark:bg-background-dark">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    // 🚨 STRICT VERIFICATION CHECK
    // If user is logged in but not verified, BLOCK access to dashboard/sidebar
    if (!user.emailVerified) {
        // Preserve query params (like oobCode) so VerifyEmail can handle them
        return <Navigate to={"/check-email" + location.search} replace />;
    }

    return (
        <div className="fixed inset-0 h-full w-full flex overflow-hidden text-gray-900 dark:text-gray-100">
            {/* SIDEBAR */}
            <div className="sticky top-0 h-full flex-shrink-0 z-40">
                <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
            </div>

            {/* MAIN AREA */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* NAVBAR */}
                <div className="sticky top-0 z-30">
                    <Navbar
                        title={finalTitle}
                        subtitle={finalSubtitle}
                        onMenuClick={() => setSidebarOpen(true)}
                        showBackButton={!!finalBackPath}
                        onBack={() => finalBackPath && navigate(finalBackPath)}
                    />
                </div>

                {/* PAGE CONTENT */}
                <main
                    ref={mainContentRef}
                    className="flex-1 overflow-y-auto dashboard-scroll px-6 pt-6 pb-10"
                >
                    <Outlet context={{ setPageMeta: setCustomMeta }} />
                </main>
            </div>
        </div>
    );
}
