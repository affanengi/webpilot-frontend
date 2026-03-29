import { Search, ExternalLink } from "lucide-react";
import { useLocation, useNavigate, NavLink } from "react-router-dom";

export default function Sidebar({ isOpen, onClose }) {
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path) => location.pathname === path;

  // IMPROVED CONTRAST FOR LINKS
  const baseLink =
    "flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-colors duration-200 font-medium select-none";

  const activeLink =
    "bg-primary text-white shadow-md shadow-primary/20"; // Brand Active State

  const inactiveLink =
    "text-text-secondary-light dark:text-text-secondary-dark hover:bg-gray-100 dark:hover:bg-white/5 hover:text-text-primary-light dark:hover:text-text-primary-dark";

  return (
    <>
      {/* BACKDROP FOR MOBILE + TABLET */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
        />
      )}

      <aside
        className={`
          fixed lg:static
          inset-y-0 left-0
          z-50 lg:z-auto
          h-screen
          w-72
          bg-surface-light dark:bg-surface-dark
          flex flex-col justify-between
          border-r border-border-light dark:border-border-dark
          transition-transform duration-300
          overflow-y-auto
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0
        `}
      >
        <div>
          {/* LOGO — NOW CLICKABLE */}
          <div
            onClick={() => {
              navigate("/dashboard");
              onClose?.();
            }}
            className="h-20 flex items-center px-6 gap-3 mb-2 cursor-pointer"
          >
            <div className="bg-primary text-white w-10 h-10 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
              <span className="material-symbols-rounded text-2xl">
                rocket_launch
              </span>
            </div>
            <div>
              <h1 className="font-bold text-lg tracking-tight text-text-primary-light dark:text-text-primary-dark">
                WebPilot
              </h1>
              <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark font-medium">
                Automation
              </p>
            </div>
          </div>

          {/* 🔍 MOBILE SEARCH (ONLY MOBILE) - IMPROVED VISIBILITY */}
          <div className="md:hidden p-4 pt-0">
            <div className="relative">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                placeholder="Search..."
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-border-light dark:border-border-dark bg-gray-50 dark:bg-black/20 text-text-primary-light dark:text-text-primary-dark text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              />
            </div>
          </div>

          {/* NAV */}
          <nav className="px-4 space-y-1">
            {[
              ["/dashboard", "dashboard", "Dashboard"],
              ["/ai-chat", "auto_awesome", "WebPilot AI"],
              ["/automations", "smart_toy", "Automations"],
              ["/connected-accounts", "link", "Connected Accounts"],
              ["/execution-logs", "receipt_long", "Execution Logs"],
            ].map(([path, icon, label]) => (
              <NavLink
                key={path}
                to={path}
                onClick={onClose}
                className={`${baseLink} ${isActive(path) ? activeLink : inactiveLink
                  }`}
              >
                <span className="material-symbols-rounded text-[22px]">
                  {icon}
                </span>
                <span className="text-sm">{label}</span>
              </NavLink>
            ))}
          </nav>
        </div>

        {/* FOOTER */}
        <div className="px-4 pb-6 space-y-1">
          {[
            ["/settings", "settings", "Settings"],
            ["/support", "help", "Help / Support"],
          ].map(([path, icon, label]) => (
            <NavLink
              key={path}
              to={path}
              onClick={onClose}
              className={`${baseLink} ${isActive(path) ? activeLink : inactiveLink
                }`}
            >
              <span className="material-symbols-rounded text-[22px]">
                {icon}
              </span>
              <span className="text-sm">{label}</span>
            </NavLink>
          ))}
          <div className="md:hidden p-4 border-t border-border-light dark:border-border-dark mt-2">
            <a
              href="/docs"
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full text-center px-3 py-2.5 rounded-lg bg-primary text-white hover:opacity-90 text-sm font-bold transition-opacity"
            >
              Docs
              <ExternalLink size={14} className="inline-block ml-1" />
            </a>
          </div>
        </div>
      </aside>
    </>
  );
}