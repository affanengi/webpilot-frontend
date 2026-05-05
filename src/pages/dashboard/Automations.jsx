import { useNavigate, useSearchParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { collection, onSnapshot } from "firebase/firestore";
import { db, auth } from "../../firebase";
import { useAuth } from "../../context/AuthContext";

import Button from "../../components/ui/Button";
import { automations as templateAutomations } from "../../data/automations";

function AutomationCard({ item, isTemplate, onDelete, currentTab }) {
  const navigate = useNavigate();
  const returnParam = currentTab && currentTab !== 'my-automations' ? `?returnTab=${currentTab}` : '';
  const isAdvanced = currentTab === 'advanced';

  return (
    <div
      className="group bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-2xl shadow-sm hover:shadow-lg hover:border-primary/20 transition-all duration-300 p-6 flex flex-col cursor-default"
    >
      <div className="mb-6 flex items-start justify-between">
        <div className="p-3.5 rounded-2xl bg-primary/10 text-primary group-hover:scale-110 transition-transform duration-300">
          <span className="material-symbols-rounded text-3xl">
            {item.icon}
          </span>
        </div>
        {!isTemplate && onDelete && (
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(item.id); }}
            className="p-2 text-text-secondary-light dark:text-text-secondary-dark hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
            title="Delete Automation"
          >
            <span className="material-symbols-rounded text-xl">delete</span>
          </button>
        )}
      </div>

      <h3 className="text-xl font-bold mb-2 text-text-primary-light dark:text-text-primary-dark">
        {item.title || item.name}
      </h3>

      <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark mb-8 flex-grow leading-relaxed">
        {item.description}
      </p>

      {isAdvanced && (
        <div className="mb-4">
          <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/40">
            <span className="material-symbols-rounded text-[12px]">bolt</span>
            Advanced
          </span>
        </div>
      )}

      <div className="flex items-center gap-3 mt-auto">
        {!isTemplate && (
          <Button
            onClick={() => navigate(`/automations/${item.id}`)}
            className="flex-1 h-11 text-sm font-semibold shadow-md active:scale-95"
            variant="primary"
          >
            Run
          </Button>
        )}

        <Button
          onClick={() => navigate(`/automations/${item.id}${returnParam}`)}
          className={`flex-1 h-11 text-sm font-medium bg-transparent border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-white/5 ${isTemplate ? 'w-full' : ''}`}
          variant="outline"
        >
          Details
        </Button>
      </div>
    </div>
  );
}

export default function Automations() {
  const { user } = useAuth();
  const [savedAutomations, setSavedAutomations] = useState([]);
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "my-automations");
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [automationToDelete, setAutomationToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const openDeleteModal = (id) => {
    setAutomationToDelete(id);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!automationToDelete) return;
    setIsDeleting(true);
    try {
      const idToken = await auth.currentUser.getIdToken();
      const res = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/automations/${automationToDelete}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${idToken}` }
      });
      if (!res.ok) throw new Error("Failed to delete automation");
      setDeleteModalOpen(false);
      setAutomationToDelete(null);
    } catch (err) {
      alert(err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  useEffect(() => {
    if (!user?.uid) return;

    const unsubscribe = onSnapshot(
      collection(db, "users", user.uid, "automations"),
      (snapshot) => {
        const automations = [];
        snapshot.forEach((doc) => {
          automations.push({ id: doc.id, ...doc.data() });
        });
        setSavedAutomations(automations);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching automations:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  if (loading) {
    return <div className="p-6 text-center text-text-secondary-light dark:text-text-secondary-dark">Loading...</div>;
  }

  const hasSaved = savedAutomations.length > 0;

  // Advanced automation template IDs
  const ADVANCED_IDS = new Set(['github-manager', 'data-results-analyzer', 'google-forms-master']);

  // Custom = explicitly tagged OR has multiple steps (chained workflow) - isCustom true is the primary signal
  const customAutomations = savedAutomations.filter(a => a.isCustom === true || (a.steps && a.steps.length > 1));
  const customIds = new Set(customAutomations.map(a => a.id));

  // Advanced = saved automations whose originalTemplateId is in ADVANCED_IDS
  const advancedAutomations = savedAutomations.filter(a => ADVANCED_IDS.has(a.originalTemplateId || a.id) && !customIds.has(a.id));
  const advancedIds = new Set(advancedAutomations.map(a => a.id));

  // Standard = saved, not custom, not advanced
  const templateSavedAutomations = savedAutomations.filter(a => !customIds.has(a.id) && !advancedIds.has(a.id));
  return (
    <div className="space-y-8 pb-10">

      {/* TABS HEADER */}
      <div className="flex border-b border-border-light dark:border-border-dark mb-8 overflow-x-auto">
        <button
          onClick={() => setActiveTab('my-automations')}
          className={`pb-4 px-6 font-semibold text-sm transition-colors border-b-2 whitespace-nowrap ${activeTab === 'my-automations' ? 'border-primary text-primary' : 'border-transparent text-text-secondary-light dark:text-text-secondary-dark hover:text-text-primary-light dark:hover:text-text-primary-dark'}`}
        >
          My Automations
        </button>
        <button
          onClick={() => setActiveTab('advanced')}
          className={`pb-4 px-6 font-semibold text-sm transition-colors border-b-2 flex items-center gap-2 whitespace-nowrap ${activeTab === 'advanced' ? 'border-primary text-primary' : 'border-transparent text-text-secondary-light dark:text-text-secondary-dark hover:text-text-primary-light dark:hover:text-text-primary-dark'}`}
        >
          <span className="material-symbols-rounded text-[16px]">bolt</span>
          Advanced Automations
          {advancedAutomations.length > 0 && <span className="inline-flex items-center justify-center w-5 h-5 text-[10px] font-bold rounded-full bg-amber-500 text-white">{advancedAutomations.length}</span>}
        </button>
        <button
          onClick={() => setActiveTab('custom')}
          className={`pb-4 px-6 font-semibold text-sm transition-colors border-b-2 flex items-center gap-2 whitespace-nowrap ${activeTab === 'custom' ? 'border-primary text-primary' : 'border-transparent text-text-secondary-light dark:text-text-secondary-dark hover:text-text-primary-light dark:hover:text-text-primary-dark'}`}
        >
          Custom Automations
          {customAutomations.length > 0 && <span className="inline-flex items-center justify-center w-5 h-5 text-[10px] font-bold rounded-full bg-primary text-white">{customAutomations.length}</span>}
        </button>
        <button
          onClick={() => setActiveTab('templates')}
          className={`pb-4 px-6 font-semibold text-sm transition-colors border-b-2 whitespace-nowrap ${activeTab === 'templates' ? 'border-primary text-primary' : 'border-transparent text-text-secondary-light dark:text-text-secondary-dark hover:text-text-primary-light dark:hover:text-text-primary-dark'}`}
        >
          Explore Templates
        </button>
      </div>

      {activeTab === 'my-automations' && (
        <div className="space-y-6">
          {templateSavedAutomations.length === 0 ? (
            <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-xl border border-blue-100 dark:border-blue-900/20 text-blue-600 dark:text-blue-400 text-sm font-medium flex items-center gap-2">
              <span className="material-symbols-rounded">info</span>
              You haven't saved any templates yet. Click "Explore Templates" to get started.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {templateSavedAutomations.map((item) => (
                <AutomationCard key={item.id} item={item} isTemplate={false} onDelete={openDeleteModal} currentTab="my-automations" />
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'advanced' && (
        <div className="space-y-6">
          {/* Header banner */}
          <div className="flex items-start gap-4 p-5 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/10 dark:to-orange-900/10 border border-amber-200 dark:border-amber-800/30">
            <div className="p-2.5 rounded-xl bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 shrink-0">
              <span className="material-symbols-rounded text-2xl">bolt</span>
            </div>
            <div>
              <p className="font-bold text-sm text-amber-800 dark:text-amber-300">Advanced Automations</p>
              <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5 leading-relaxed">These AI-powered automations include a <strong>Prompt Book</strong> — ready-made prompts you can copy, personalize, and send directly via AI Chat to trigger them instantly.</p>
            </div>
          </div>

          {advancedAutomations.length === 0 ? (
            <div className="bg-amber-50 dark:bg-amber-900/10 p-4 rounded-xl border border-amber-100 dark:border-amber-800/20 text-amber-700 dark:text-amber-400 text-sm font-medium flex items-center gap-2">
              <span className="material-symbols-rounded">bolt</span>
              No advanced automations saved yet. Save GitHub Manager, Data Results Analyzer, or Google Forms Manager from "Explore Templates".
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {advancedAutomations.map((item) => (
                <AutomationCard key={item.id} item={item} isTemplate={false} onDelete={openDeleteModal} currentTab="advanced" />
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'custom' && (
        <div className="space-y-6">
          {customAutomations.length === 0 ? (
            <div className="bg-violet-50 dark:bg-violet-900/10 p-4 rounded-xl border border-violet-100 dark:border-violet-900/20 text-violet-600 dark:text-violet-400 text-sm font-medium flex items-center gap-2">
              <span className="material-symbols-rounded">auto_fix_high</span>
              You haven't created any custom automations yet. Click "Create New Automation" to build your own multi-step workflow.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {customAutomations.map((item) => (
                <AutomationCard key={item.id} item={item} isTemplate={false} onDelete={openDeleteModal} currentTab="custom" />
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'templates' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {templateAutomations
              .filter(t => !t.nodeType || t.nodeType === "automationNode") // Filter out logic nodes
              .filter(t => !savedAutomations.some(s => s.originalTemplateId === t.id))
              .map((item) => (
                <AutomationCard key={item.id} item={item} isTemplate={true} currentTab="templates" />
              ))}
          </div>
        </div>
      )}

      {/* -------- Delete Confirmation Modal -------- */}
      {deleteModalOpen && createPortal(
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          style={{ backdropFilter: "blur(6px)", backgroundColor: "rgba(0,0,0,0.45)" }}
          onClick={() => !isDeleting && setDeleteModalOpen(false)}
        >
          <div
            className="relative w-full max-w-md bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-zinc-700 p-6 flex flex-col gap-5"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close */}
            <button
              onClick={() => !isDeleting && setDeleteModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
              disabled={isDeleting}
            >
              <span className="material-symbols-rounded text-[22px]">close</span>
            </button>

            {/* Warning icon + title */}
            <div className="flex flex-col items-center gap-3 text-center">
              <div className="w-14 h-14 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
                <span className="material-symbols-rounded text-red-500 text-[30px]">delete_forever</span>
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                  Delete Automation?
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 max-w-xs mx-auto">
                  Are you sure you want to delete this automation?
                </p>
              </div>
            </div>

            {/* Warning banner */}
            <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/30">
              <span className="material-symbols-rounded text-amber-500 text-[20px] shrink-0 mt-0.5">warning</span>
              <p className="text-xs text-amber-700 dark:text-amber-400">
                This action is permanent and cannot be undone. Any execution history or configurations for this workflow will be lost immediately.
              </p>
            </div>

            {/* Action buttons */}
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setDeleteModalOpen(false)}
                disabled={isDeleting}
                className="flex-1 h-11 text-sm font-semibold"
              >
                Cancel
              </Button>
              <Button
                onClick={confirmDelete}
                disabled={isDeleting}
                className="flex-1 h-11 text-sm font-semibold bg-red-600 hover:bg-red-700 text-white border-0 flex items-center justify-center gap-2"
              >
                {isDeleting ? (
                  <>
                    <span className="material-symbols-rounded animate-spin text-[18px]">refresh</span>
                    Deleting...
                  </>
                ) : (
                  "Yes, Delete"
                )}
              </Button>
            </div>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
}
