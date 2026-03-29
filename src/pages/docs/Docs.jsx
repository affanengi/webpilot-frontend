import LegalModal from "../../components/LegalModal";
import PrivacyPolicy from "../../policies/PrivacyPolicy";
import TermsOfService from "../../policies/TermsOfService";
import { useState } from "react";
import {
  BookOpen,
  Zap,
  Link2,
  FileText,
  AlertTriangle,
  ShieldCheck,
  Lock,
  CheckCircle,
  XCircle,
  RotateCcw,
  Search,
  ExternalLink,
  Info,
  Menu,
  X,
  Settings,
} from "lucide-react";

export default function Docs() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (!el) return;

    const yOffset = -96;
    const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
    window.scrollTo({ top: y, behavior: "smooth" });
    setMobileNavOpen(false); // close sidebar on mobile click
  };

  const [openLegal, setOpenLegal] = useState(null);
  // null | "privacy" | "terms"


  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark text-text-light dark:text-text-dark transition-colors duration-200">

      {/* ================= HEADER ================= */}
      <header className="sticky top-0 z-50 border-b border-border-light dark:border-border-dark bg-white/80 dark:bg-card-dark/80 backdrop-blur-md">
        <div className="h-16 px-4 md:px-6 flex items-center justify-between">

          {/* Left */}
          <div className="flex items-center gap-3">
            {/* Hamburger (mobile only) */}
            <button
              className="md:hidden text-gray-600 dark:text-gray-300"
              onClick={() => setMobileNavOpen(true)}
            >
              <Menu size={24} />
            </button>

            <div className="bg-primary text-white w-10 h-10 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
              <span className="material-symbols-rounded text-2xl">
                rocket_launch
              </span>
            </div>
            <div>
              <h1 className="font-bold text-lg tracking-tight text-gray-900 dark:text-white">
                WebPilot
              </h1>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                Automation
              </p>
            </div>
          </div>

          {/* Search (desktop only) */}
          <div className="relative hidden md:block w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              placeholder="Search docs..."
              className="w-full pl-9 pr-3 py-2 text-sm rounded-md border border-gray-300 dark:border-border-dark bg-white dark:bg-background-dark text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          {/* Right */}
          <div className="flex items-center gap-4 text-sm">
            <a href="/support" className="hover:text-blue-600 dark:hover:text-blue-400 hidden sm:block text-gray-600 dark:text-gray-300 font-medium">
              Help
            </a>
            <a
              href="/dashboard"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 font-medium shadow-sm"
            >
              Dashboard
              <ExternalLink size={14} />
            </a>
          </div>
        </div>
      </header>

      {/* ================= MOBILE SIDEBAR OVERLAY ================= */}
      {mobileNavOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setMobileNavOpen(false)}
          />
          <aside className="relative w-72 bg-white dark:bg-card-dark h-full p-5 overflow-y-auto border-r border-border-light dark:border-border-dark">
            <div className="flex justify-between items-center mb-6 text-gray-900 dark:text-white">
              <span className="font-semibold text-lg">Navigation</span>
              <button onClick={() => setMobileNavOpen(false)} className="text-gray-500 hover:text-gray-900 dark:hover:text-white">
                <X size={22} />
              </button>
            </div>

            <ul className="space-y-5 text-sm font-medium text-gray-700 dark:text-gray-300">
              <li onClick={() => scrollTo("getting-started")} className="flex gap-4 cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                <BookOpen size={18} /> Getting Started
              </li>
              <li onClick={() => scrollTo("creating-automations")} className="flex gap-4 cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                <Zap size={18} /> Creating Automations
              </li>
              <li onClick={() => scrollTo("managing-automations")} className="flex gap-4 cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                <Settings size={18} /> Managing Automations
              </li>
              <li onClick={() => scrollTo("connecting-accounts")} className="flex gap-4 cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                <Link2 size={18} /> Connecting Accounts
              </li>
              <li onClick={() => scrollTo("execution-logs")} className="flex gap-4 cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                <FileText size={18} /> Execution Logs
              </li>
              <li onClick={() => scrollTo("common-issues")} className="flex gap-4 cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                <AlertTriangle size={18} /> Common Issues
              </li>
            </ul>
          </aside>
        </div>
      )}

      {/* ================= LAYOUT ================= */}
      <div className="max-w-[1400px] mx-auto px-4 md:px-6 py-10 grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-10">

        {/* ================= DESKTOP LEFT NAV ================= */}
        <aside className="hidden md:block md:col-span-3 lg:col-span-2 sticky top-24 h-fit text-sm">
          <p className="mb-3 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Navigation
          </p>
          <ul className="space-y-4 font-medium text-gray-600 dark:text-gray-300">
            <li onClick={() => scrollTo("getting-started")} className="flex items-center gap-3 cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              <BookOpen size={16} /> Getting Started
            </li>
            <li onClick={() => scrollTo("creating-automations")} className="flex items-center gap-3 cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              <Zap size={16} /> Creating Automations
            </li>
            <li onClick={() => scrollTo("managing-automations")} className="flex items-center gap-3 cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              <Settings size={16} /> Managing Automations
            </li>
            <li onClick={() => scrollTo("connecting-accounts")} className="flex items-center gap-3 cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              <Link2 size={16} /> Connecting Accounts
            </li>
            <li onClick={() => scrollTo("execution-logs")} className="flex items-center gap-3 cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              <FileText size={16} /> Execution Logs
            </li>
            <li onClick={() => scrollTo("common-issues")} className="flex items-center gap-3 cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              <AlertTriangle size={16} /> Common Issues
            </li>
          </ul>
        </aside>


        {/* ================= MAIN ================= */}
        <main className="col-span-12 md:col-span-7 space-y-12 md:space-y-20 text-[15px] leading-relaxed">

          {/* ================= Getting Started ================= */}
          <section id="getting-started">
            <h1 className="text-3xl md:text-5xl font-bold mb-4 text-gray-900 dark:text-white">
              Getting Started with WebPilot
            </h1>

            <p className="text-gray-600 dark:text-text-secondary-dark mb-6 text-lg">
              Learn how to automate your workflows efficiently. WebPilot helps you connect apps and trigger actions without writing code.
            </p>

            <p className="mb-8 text-lg text-gray-600 dark:text-text-secondary-dark">
              WebPilot Automation is a powerful tool designed to streamline your repetitive tasks. By connecting your favorite apps, you can trigger actions automatically. Whether you are syncing data between CRM systems or sending automated notifications to your team, WebPilot handles the heavy lifting in the background.
            </p>

            <div className="flex gap-4 p-5 rounded-xl border border-blue-200 dark:border-blue-900/50 bg-blue-50 dark:bg-blue-900/10 shadow-sm">
              <div className="h-9 w-9 flex items-center justify-center flex-shrink-0">
                <Info size={28} className="text-blue-600 dark:text-blue-500" />
              </div>
              <div className="space-y-1">
                <div className="font-bold text-blue-700 dark:text-blue-400 text-lg">
                  New to Automation?
                </div>
                <p className="text-blue-800 dark:text-blue-200">
                  Start with our pre-built templates in the dashboard before creating custom workflows from scratch.
                </p>
              </div>
            </div>
          </section>

          {/* ================= Creating Automations ================= */}
          <section id="creating-automations">
            <h2 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">
              Creating Automations
            </h2>

            <p className="text-gray-600 dark:text-text-secondary-dark mb-8 text-lg">
              Follow these steps to set up your first automation workflow:
            </p>

            <div className="space-y-6">
              {[
                [
                  "Select a Trigger",
                  "Choose the app and the specific event that will start the automation (e.g., 'New Email in Gmail').",
                ],
                [
                  "Define an Action",
                  "Select what should happen when the trigger fires (e.g., 'Create Card in Trello').",
                ],
                [
                  "Map Data Fields",
                  "Drag and drop data points from the trigger into the action fields to pass information dynamically.",
                ],
                [
                  "Test & Activate",
                  "Run a test execution to verify data flow, then toggle the switch to 'On'.",
                ],
              ].map(([title, desc], i) => (
                <div key={i} className="flex items-start gap-4">
                  {/* Number Circle */}
                  <div className="flex-shrink-0 h-9 w-9 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold mt-0.5">
                    {i + 1}
                  </div>

                  {/* Text Content */}
                  <div>
                    <div className="font-bold text-gray-900 dark:text-white mb-1 text-lg">
                      {title}
                    </div>
                    <p className="text-gray-600 dark:text-text-secondary-dark">
                      {desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* ================= Managing Automations ================= */}
          <section id="managing-automations">
            <h2 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">
              Managing Automations
            </h2>

            <p className="text-gray-600 dark:text-text-secondary-dark mb-8 text-lg">
              Once you've created an automation, you can manage it from the dashboard. WebPilot provides tools to edit, pause, or delete your workflows.
            </p>

            <div className="space-y-6">
              <div className="flex gap-4 p-5 rounded-xl border border-gray-200 dark:border-border-dark bg-white dark:bg-card-dark shadow-sm">
                <div className="h-10 w-10 flex-shrink-0 flex items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-900/20">
                  <span className="material-symbols-rounded text-blue-600 dark:text-blue-400">edit</span>
                </div>
                <div>
                  <strong className="text-gray-900 dark:text-white text-lg block mb-1">Editing Automations</strong>
                  <p className="text-gray-600 dark:text-text-secondary-dark">
                    Navigate to your <a href="/automations" className="text-blue-600 dark:text-blue-400 hover:underline">Automations</a> page, find your workflow, and click the Edit button. You can modify triggers, actions, and field mappings without losing your execution history.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 p-5 rounded-xl border border-gray-200 dark:border-border-dark bg-white dark:bg-card-dark shadow-sm">
                <div className="h-10 w-10 flex-shrink-0 flex items-center justify-center rounded-xl bg-amber-50 dark:bg-amber-900/20">
                  <span className="material-symbols-rounded text-amber-600 dark:text-amber-400">pause_circle</span>
                </div>
                <div>
                  <strong className="text-gray-900 dark:text-white text-lg block mb-1">Pausing Automations</strong>
                  <p className="text-gray-600 dark:text-text-secondary-dark">
                    Toggle the switch on your automation card to pause it. Paused workflows will not trigger until you re-enable them. Draft automations are paused by default.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 p-5 rounded-xl border border-gray-200 dark:border-border-dark bg-white dark:bg-card-dark shadow-sm">
                <div className="h-10 w-10 flex-shrink-0 flex items-center justify-center rounded-xl bg-red-50 dark:bg-red-900/20">
                  <span className="material-symbols-rounded text-red-600 dark:text-red-400">delete</span>
                </div>
                <div>
                  <strong className="text-gray-900 dark:text-white text-lg block mb-1">Deleting Automations</strong>
                  <p className="text-gray-600 dark:text-text-secondary-dark">
                    To permanently remove a workflow, click the Delete (trash) icon. <strong className="text-red-600 dark:text-red-400">Warning:</strong> Deleting an automation will also remove all its execution logs. This action cannot be undone.
                  </p>
                </div>
              </div>
            </div>
          </section>


          {/* ================= Connecting Accounts ================= */}
          <section id="connecting-accounts">
            <h2 className="text-3xl font-bold mb-4 text-gray-900 dark:text-white">
              Connecting Accounts
            </h2>

            <p className="text-gray-600 dark:text-text-secondary-dark mb-8 text-lg">
              WebPilot uses secure OAuth 2.0 authentication. We never store your passwords. When you connect an account (like Slack, Salesforce, or Google Sheets), you are redirected to the provider's secure login page.
            </p>

            <div className="grid sm:grid-cols-2 gap-6">
              <div className="flex gap-4 p-5 rounded-xl border border-gray-200 dark:border-border-dark bg-white dark:bg-card-dark shadow-sm">
                <div className="h-12 w-12 flex-shrink-0 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center">
                  <Lock size={24} className="text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <strong className="text-gray-900 dark:text-white text-lg">Encrypted Tokens</strong>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">AES-256 encryption</p>
                </div>
              </div>

              <div className="flex gap-4 p-5 rounded-xl border border-gray-200 dark:border-border-dark bg-white dark:bg-card-dark shadow-sm">
                <div className="h-12 w-12 flex-shrink-0 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center">
                  <ShieldCheck size={24} className="text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <strong className="text-gray-900 dark:text-white text-lg">Read-only Access</strong>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Where possible</p>
                </div>
              </div>
            </div>
          </section>

          {/* ================= Execution Logs ================= */}
          <section id="execution-logs">
            <h2 className="text-3xl font-bold mb-4 text-gray-900 dark:text-white">
              Execution Logs
            </h2>

            <p className="text-gray-600 dark:text-text-secondary-dark mb-8 text-lg">
              Each automation run is logged with a status indicator. Below are the possible statuses you may encounter:
            </p>

            <div className="rounded-xl border border-gray-200 dark:border-border-dark overflow-hidden bg-white dark:bg-card-dark shadow-sm">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-[#1e293b]/50 border-b border-gray-200 dark:border-border-dark">
                  <tr>
                    <th className="p-4 text-left font-bold text-gray-900 dark:text-white">
                      Status
                    </th>
                    <th className="p-4 text-left font-bold text-gray-900 dark:text-white">
                      Description
                    </th>
                    <th className="p-4 text-left font-bold text-gray-900 dark:text-white">
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100 dark:divide-border-dark">
                  <tr>
                    <td className="p-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 text-xs font-bold uppercase tracking-wide">
                        <CheckCircle size={14} /> Success
                      </span>
                    </td>
                    <td className="p-4 text-gray-600 dark:text-gray-300">
                      The automation completed successfully without errors.
                    </td>
                    <td className="p-4 font-semibold text-gray-900 dark:text-white">
                      None
                    </td>
                  </tr>

                  <tr>
                    <td className="p-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 text-xs font-bold uppercase tracking-wide">
                        <XCircle size={14} /> Failed
                      </span>
                    </td>
                    <td className="p-4 text-gray-600 dark:text-gray-300">
                      The automation encountered a critical error and stopped.
                    </td>
                    <td className="p-4 font-semibold text-gray-900 dark:text-white">
                      Check logs
                    </td>
                  </tr>

                  <tr>
                    <td className="p-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 text-xs font-bold uppercase tracking-wide">
                        <RotateCcw size={14} /> Retrying
                      </span>
                    </td>
                    <td className="p-4 text-gray-600 dark:text-gray-300">
                      A temporary error occurred; the system will attempt to run again.
                    </td>
                    <td className="p-4 font-semibold text-gray-900 dark:text-white">
                      Wait
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* ================= Common Issues ================= */}
          <section id="common-issues">
            <h2 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">
              Common Issues
            </h2>

            <div className="space-y-4">
              {[
                ["Why is my trigger delayed?", "Some triggers are 'polling' triggers, meaning we check for new data every 5 to 15 minutes depending on your plan. Instant triggers (webhooks) happen immediately."],
                ["Authentication Error 401", "This usually happens if you changed your password on the connected service. Go to the 'Connections' tab and click 'Reconnect' to refresh the token."],
              ].map(([title, desc], i) => (
                <div key={i} className="flex gap-4 p-5 rounded-xl border border-gray-200 dark:border-border-dark bg-white dark:bg-card-dark shadow-sm hover:shadow-md transition-shadow">
                  <div className="h-10 w-10 flex-shrink-0 flex items-center justify-center bg-orange-50 dark:bg-orange-900/20 rounded-xl">
                    <AlertTriangle size={24} className="text-orange-500 dark:text-orange-400" />
                  </div>
                  <div>
                    <strong className="text-gray-900 dark:text-white text-lg">{title}</strong>
                    <p className="text-gray-600 dark:text-text-secondary-dark mt-1">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </main>

        {/* ================= RIGHT NAV (DESKTOP ONLY) ================= */}
        <aside className="hidden lg:block col-span-3 sticky top-24 h-fit text-sm">
          <p className="mb-3 text-xs font-bold uppercase tracking-wider text-gray-400 border-b border-gray-100 dark:border-border-dark pb-2">
            On This Page
          </p>
          <ul className="space-y-3 font-medium text-gray-600 dark:text-gray-400">
            {[
              ["Getting Started", "getting-started"],
              ["Creating Automations", "creating-automations"],
              ["Managing Automations", "managing-automations"],
              ["Connecting Accounts", "connecting-accounts"],
              ["Execution Logs", "execution-logs"],
              ["Common Issues", "common-issues"],
            ].map(([label, id]) => (
              <li
                key={id}
                onClick={() => scrollTo(id)}
                className="cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                {label}
              </li>
            ))}
          </ul>
        </aside>
      </div>

      {/* ================= FOOTER ================= */}
      <footer className="border-t border-border-light dark:border-border-dark py-8 text-sm text-gray-500 dark:text-gray-400 bg-white dark:bg-background-dark mt-10">
        <div className="max-w-[1400px] mx-auto px-4 md:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="font-medium text-gray-600 dark:text-gray-300">© 2026 WebPilot. All rights reserved.</span>

          <div className="flex gap-6 font-medium">
            <span
              onClick={() => setOpenLegal("privacy")}
              className="cursor-pointer hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              Privacy Policy
            </span>

            <span
              onClick={() => setOpenLegal("terms")}
              className="cursor-pointer hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              Terms of Service
            </span>
          </div>
        </div>
      </footer>


      {openLegal === "privacy" && (
        <LegalModal onClose={() => setOpenLegal(null)} themeMode={document.documentElement.classList.contains('dark') ? 'dark' : 'light'}>
          <PrivacyPolicy />
        </LegalModal>
      )}

      {openLegal === "terms" && (
        <LegalModal onClose={() => setOpenLegal(null)} themeMode={document.documentElement.classList.contains('dark') ? 'dark' : 'light'}>
          <TermsOfService />
        </LegalModal>
      )}

    </div>
  );
}
