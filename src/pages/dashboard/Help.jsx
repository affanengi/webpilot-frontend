import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import LegalModal from "../../components/LegalModal";
import PrivacyPolicy from "../../policies/PrivacyPolicy";
import TermsOfService from "../../policies/TermsOfService";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import Textarea from "../../components/ui/Textarea";
import CustomSelect from "../../components/ui/CustomSelect";

export default function Help() {
  const navigate = useNavigate();
  const [activeModal, setActiveModal] = useState(null); // 'privacy' | 'terms' | null
  const [issue, setIssue] = useState("Select an issue…");
  const [priority, setPriority] = useState("Low");

  /* ---------- DROPDOWN REFS NOT NEEDED WITH CUSTOM SELECT ---------- */
  /* CustomSelect handles its own outside click, so we can remove the refs */

  return (
    <>
      <div className="max-w-[1280px] mx-auto pb-20">
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">

          {/* LEFT COLUMN */}
          <div className="xl:col-span-8 space-y-8">

            {/* RAISE A SUPPORT TICKET */}
            <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-2xl shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-border-light dark:border-border-dark flex items-center bg-gray-50/50 dark:bg-white/5">
                <div className="p-2 rounded-lg bg-gray-100 dark:bg-white/10 text-text-secondary-light dark:text-text-secondary-dark mr-3">
                  <span className="material-symbols-rounded text-primary">
                    confirmation_number
                  </span>
                </div>
                <h2 className="text-lg font-bold text-text-primary-light dark:text-text-primary-dark">Raise a Support Ticket</h2>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div className="relative">
                    <label className="block text-sm font-medium text-text-primary-light dark:text-text-primary-dark mb-2">
                      Issue Type
                    </label>
                    <CustomSelect
                      value={issue === "Select an issue…" ? "" : issue}
                      placeholder="Select an issue..."
                      options={[
                        "Automation Failed",
                        "Account Issue",
                        "Billing Problem",
                        "Other",
                      ]}
                      onChange={setIssue}
                    />
                  </div>

                  <div className="relative">
                    <label className="block text-sm font-medium text-text-primary-light dark:text-text-primary-dark mb-2">
                      Priority
                    </label>
                    <CustomSelect
                      value={priority}
                      options={[
                        "Low",
                        "Medium – Feature not working",
                        "High – Blocking issue",
                      ]}
                      onChange={setPriority}
                    />
                  </div>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-text-primary-light dark:text-text-primary-dark mb-2">
                    Email Address
                  </label>
                  <Input
                    type="email"
                    placeholder="name@company.com"
                  />
                </div>

                <div className="mb-8">
                  <label className="block text-sm font-medium text-text-primary-light dark:text-text-primary-dark mb-2">
                    Message
                  </label>
                  <Textarea
                    rows={4}
                    placeholder="Describe your issue in detail. Include error codes or workflow IDs if available."
                  />
                </div>

                <div className="flex justify-end">
                  <Button variant="primary" className="h-11 px-8 shadow-sm">
                    Submit Ticket
                    <span className="material-symbols-rounded text-sm ml-2">
                      arrow_forward
                    </span>
                  </Button>
                </div>
              </div>
            </div>

            {/* QUICK HELP ACTIONS */}
            <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-2xl shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-border-light dark:border-border-dark flex items-center bg-gray-50/50 dark:bg-white/5">
                <div className="flex items-center">
                  <div className="p-2 rounded-lg bg-gray-100 dark:bg-white/10 text-text-secondary-light dark:text-text-secondary-dark mr-3">
                    <span className="material-symbols-rounded text-primary">bolt</span>
                  </div>
                  <h2 className="text-lg font-bold text-text-primary-light dark:text-text-primary-dark ml-2">
                    Quick Help Actions
                  </h2>
                </div>
              </div>

              <div className="divide-y divide-border-light dark:divide-border-dark">
                {[
                  ["menu_book", "Documentation", "Browse detailed guides and API references"],
                  ["support_agent", "Contact Support", "Talk to our customer success team"],
                  ["bug_report", "Report a Bug", "Found an issue? Let us know"],
                  ["lightbulb", "Feature Request", "Suggest improvements for WebPilot"],
                ].map(([icon, title, desc]) => (
                  <div
                    key={title}
                    onClick={() => {
                      if (title === "Documentation") {
                        window.open("/docs", "_blank", "noopener,noreferrer");
                      } else if (title === "Contact Support") {
                        navigate("/support/contact", { state: { from: "/support" } });
                      } else if (title === "Report a Bug") {
                        navigate("/support/report-bug", { state: { from: "/support" } });
                      } else if (title === "Feature Request") {
                        navigate("/support/feature-request", { state: { from: "/support" } });
                      }
                    }}
                    className="flex items-center gap-4 px-6 py-5 hover:bg-gray-50 dark:hover:bg-white/5 cursor-pointer group transition-colors"
                  >
                    <div className="p-3 rounded-xl bg-primary/10 text-primary group-hover:scale-110 transition-transform">
                      <span className="material-symbols-rounded">{icon}</span>
                    </div>

                    <div className="flex-1">
                      <p className="font-bold text-text-primary-light dark:text-text-primary-dark mb-0.5">{title}</p>
                      <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
                        {desc}
                      </p>
                    </div>

                    <span className="material-symbols-rounded text-gray-400 group-hover:text-primary transition-colors">
                      chevron_right
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* FAQ */}
            <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-2xl shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-border-light dark:border-border-dark flex items-center bg-gray-50/50 dark:bg-white/5">
                <div className="flex items-center">
                  <div className="p-2 rounded-lg bg-gray-100 dark:bg-white/10 text-text-secondary-light dark:text-text-secondary-dark mr-3">
                    <span className="material-symbols-rounded text-primary">help</span>
                  </div>
                  <h2 className="text-lg font-bold text-text-primary-light dark:text-text-primary-dark ml-2">
                    Frequently Asked Questions
                  </h2>
                </div>
              </div>

              <div className="divide-y divide-border-light dark:divide-border-dark">
                {[
                  [
                    "How do automations work?",
                    "WebPilot automations are workflows triggered by specific events. You configure a trigger, define a series of actions, and WebPilot executes them in the background. You can monitor all active workflows in the dashboard.",
                  ],
                  [
                    "How do I connect accounts?",
                    "Navigate to the 'Integrations' tab in your settings. Select the service you wish to connect (e.g., Slack, GitHub) and follow the OAuth authorization flow. Once connected, these accounts will be available in your automation builder.",
                  ],
                  [
                    "Why did my automation fail?",
                    "Automations typically fail due to API limits, invalid credentials, or timeout errors. Check the 'Logs' section for the specific error code. If the issue persists, try reconnecting the integration or contact support.",
                  ],
                  [
                    "How do I upgrade my plan?",
                    "Visit the 'Billing' section in your account settings. You can view plan comparisons and select 'Upgrade'. Changes take effect immediately, and billing is prorated for the remainder of the month.",
                  ],
                ].map(([q, a]) => (
                  <details
                    key={q}
                    className="group"
                  >
                    <summary className="flex items-center justify-between px-6 py-5 cursor-pointer hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                      <span className="font-semibold text-text-primary-light dark:text-text-primary-dark">{q}</span>
                      <span className="material-symbols-rounded text-gray-400 transition-transform duration-200 group-open:rotate-180">
                        expand_more
                      </span>
                    </summary>
                    <div className="px-6 pb-6 pt-0">
                      <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark leading-relaxed pl-4 border-l-2 border-primary/20">
                        {a}
                      </p>
                    </div>
                  </details>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div className="xl:col-span-4 space-y-6 sticky top-6 self-start">

            {/* SUPPORT AVAILABILITY */}
            <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-2xl shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-border-light dark:border-border-dark flex items-center bg-gray-50/50 dark:bg-white/5">
                <div className="flex items-center">
                  <div className="p-2 rounded-lg bg-gray-100 dark:bg-white/10 text-text-secondary-light dark:text-text-secondary-dark mr-3">
                    <span className="material-symbols-rounded text-primary">
                      schedule
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-text-primary-light dark:text-text-primary-dark">
                    Support Availability
                  </h3>
                </div>
              </div>

              <div className="p-6">
                <div className="space-y-4 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-text-secondary-light dark:text-text-secondary-dark font-medium">
                      Support Hours
                    </span>
                    <span className="font-bold text-text-primary-light dark:text-text-primary-dark bg-gray-100 dark:bg-white/10 px-2 py-1 rounded text-xs">24/7 Global</span>
                  </div>

                  <div className="border-t border-border-light dark:border-border-dark" />

                  <div className="flex justify-between items-center">
                    <span className="text-xs uppercase tracking-wider text-text-secondary-light dark:text-text-secondary-dark font-bold">
                      Avg Response:
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="material-symbols-rounded text-emerald-500 text-[18px]">bolt</span>
                      <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">Under 24h</p>
                    </div>
                  </div>
                </div>

                <Button variant="primary" className="mt-8 w-full h-11 shadow-lg shadow-primary/20">
                  Start Live Chat
                </Button>
              </div>
            </div>

            {/* USEFUL LINKS */}
            <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-2xl shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-border-light dark:border-border-dark flex items-center bg-gray-50/50 dark:bg-white/5">
                <div className="flex items-center">
                  <div className="p-2 rounded-lg bg-gray-100 dark:bg-white/10 text-text-secondary-light dark:text-text-secondary-dark mr-3">
                    <span className="material-symbols-rounded text-primary">
                      link
                    </span>
                  </div>
                  <h2 className="text-lg font-bold text-text-primary-light dark:text-text-primary-dark">
                    Useful Links
                  </h2>
                </div>
              </div>

              <div className="p-6">
                <ul className="space-y-2 text-sm">
                  {[
                    ["description", "Documentation"],
                    ["forum", "Community Forum"],
                    ["policy", "Privacy Policy"],
                    ["gavel", "Terms of Service"],
                  ].map(([icon, label]) => (
                    <li
                      key={label}
                      onClick={() => {
                        if (label === "Documentation") {
                          window.open("/docs", "_blank", "noopener,noreferrer");
                        } else if (label === "Privacy Policy") {
                          setActiveModal("privacy");
                        } else if (label === "Terms of Service") {
                          setActiveModal("terms");
                        }
                      }}
                      className="flex items-center gap-3 text-text-secondary-light dark:text-text-secondary-dark hover:text-primary dark:hover:text-primary hover:bg-gray-50 dark:hover:bg-white/5 px-3 py-2.5 rounded-xl transition cursor-pointer font-medium"
                    >
                      <span className="material-symbols-rounded text-gray-400">
                        {icon}
                      </span>
                      {label}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="text-center text-xs font-medium text-text-secondary-light dark:text-text-secondary-dark opacity-60">
              WebPilot v2.4.0
            </div>
          </div>
        </div>
      </div>


      {/* MODALS */}
      {
        activeModal === "privacy" && (
          <LegalModal onClose={() => setActiveModal(null)}>
            <PrivacyPolicy />
          </LegalModal>
        )
      }

      {
        activeModal === "terms" && (
          <LegalModal onClose={() => setActiveModal(null)}>
            <TermsOfService />
          </LegalModal>
        )
      }
    </>
  );
}
