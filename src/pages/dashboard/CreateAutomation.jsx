import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import CustomSelect from "../../components/ui/CustomSelect";
import Button from "../../components/ui/Button";
import { automations } from "../../data/automations";
import { useAuth } from "../../context/AuthContext";
import { auth, db } from "../../firebase";
import { collection, getDocs } from "firebase/firestore";

export default function CreateAutomation() {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Real data for dropdowns
  const availableAutomations = useMemo(() => ["None", ...automations.map(a => a.title)], []);

  // Lifted state
  const [selectedTrigger, setSelectedTrigger] = useState("None");
  const [steps, setSteps] = useState([{ id: 2, selected: "None" }]);
  const [isSaving, setIsSaving] = useState(false);
  const [isRunning, setIsRunning] = useState(false);


  const addStep = () => {
    setSteps((prev) => [...prev, { id: prev.length + 2, selected: "None" }]);
  };

  const removeStep = (id) => {
    setSteps((prev) => prev.filter((s) => s.id !== id));
  };

  const updateStepSelection = (id, newSelection) => {
    setSteps(prev => prev.map(s => s.id === id ? { ...s, selected: newSelection } : s));
  };

  // Extract all the selected automations in order
  const allSelectedAutomations = useMemo(() => {
    const allSelectedTitles = [selectedTrigger, ...steps.map(s => s.selected)].filter(s => s !== "None" && s !== "Manual Trigger");
    return allSelectedTitles.map(title => automations.find(a => a.title === title)).filter(Boolean);
  }, [selectedTrigger, steps]);

  const primaryAutomation = allSelectedAutomations.length > 0 ? allSelectedAutomations[0] : null;

  // Configuration Modal State
  const [configModalOpen, setConfigModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("run"); // "run" or "save"
  const [draftName, setDraftName] = useState("");
  const [stepConfigs, setStepConfigs] = useState({}); // { 0: { inputId: value }, 1: { ... } }

  const handleOpenConfigModal = (mode) => {
    if (allSelectedAutomations.length === 0) {
      alert("Please select at least one valid automation action to proceed.");
      return;
    }
    setModalMode(mode);
    if (mode === "save") {
       if (allSelectedAutomations.length > 1) {
           setDraftName(allSelectedAutomations.map(a => a.title.replace(' Automation', '').trim()).join(" + ") + " Workflow");
       } else {
           setDraftName(primaryAutomation?.title || "");
       }
    }
    setConfigModalOpen(true);
  };

  const handleInputChange = (stepIndex, inputId, value) => {
    setStepConfigs(prev => ({
      ...prev,
      [stepIndex]: {
        ...(prev[stepIndex] || {}),
        [inputId]: value
      }
    }));
  };

  const checkDependencies = (inputs, currentValues, dependency) => {
    if (!dependency) return true;
    const val = currentValues[dependency.field];
    if (Array.isArray(dependency.value)) return dependency.value.includes(val);
    return val === dependency.value;
  };

  const buildPayloads = () => {
    return allSelectedAutomations.map((auto, index) => {
      const currentValues = stepConfigs[index] || {};
      const inputs = {};
      
      if (auto.inputs) {
         auto.inputs.forEach(inp => {
            if (checkDependencies(auto.inputs, currentValues, inp.dependency)) {
                inputs[inp.id] = currentValues[inp.id] !== undefined ? currentValues[inp.id] : (inp.defaultValue || "");
            }
         });
      }
      
      return {
        n8nWebhookId: auto.n8nWebhookId,
        connected_account_type: auto.connected_account_type,
        connected_accounts: auto.connected_accounts || [],
        inputs: inputs,
        title: auto.title,
        icon: auto.icon
      };
    });
  };

  const executeAction = async () => {
    const compiledSteps = buildPayloads();
    
    // Using deployed backend domain
    const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

    if (modalMode === "run") {
        setIsRunning(true);
        try {
          const idToken = await auth.currentUser.getIdToken();
          const res = await fetch(`${API_BASE}/automations/run-draft`, {
            method: "POST",
            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${idToken}` },
            body: JSON.stringify({ steps: compiledSteps })
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || "Failed to run workflow");
          alert(data.message || "Workflow started!");
          navigate(`/execution-logs?workflow=${encodeURIComponent(primaryAutomation.title)}`);
        } catch (err) {
          alert(err.message);
        } finally {
          setIsRunning(false);
          setConfigModalOpen(false);
        }
    } else {
        if (!draftName.trim()) { alert("Please enter a name for the automation."); return; }
        setIsSaving(true);
        try {
          const idToken = await auth.currentUser.getIdToken();

          // --- Duplicate Prevention ---
          // Check if a custom automation with the same step sequence already exists
          const currentStepIds = allSelectedAutomations.map(a => a.id).join('-');
          const existingSnap = await getDocs(collection(db, "users", user.uid, "automations"));
          const isDuplicate = existingSnap.docs.some(docSnap => {
            const data = docSnap.data();
            const isCustomDoc = data.isCustom === true || (data.steps && data.steps.length > 1);
            if (!isCustomDoc) return false;
            const stepWebhookIds = (data.steps || []).map(s => s.n8nWebhookId).join('-');
            const currentWebhookIds = allSelectedAutomations.map(a => a.n8nWebhookId).join('-');
            return stepWebhookIds === currentWebhookIds;
          });

          if (isDuplicate) {
            alert(`A custom automation with this exact workflow sequence (${allSelectedAutomations.map(a => a.title).join(' ➔ ')}) already exists in your Custom Automations. Please delete the existing one before creating a duplicate.`);
            setIsSaving(false);
            return;
          }
          const payload = {
            name: draftName.trim(),
            title: draftName.trim(),
            description: allSelectedAutomations.length > 1 
              ? `Custom workflow sequence: ${allSelectedAutomations.map(a => a.title).join(" ➔ ")}`
              : primaryAutomation.description || "",
            steps: compiledSteps, // Save the compiled chain map
            icon: primaryAutomation.icon || "bolt",
            status: "draft",
            isCustom: true, // Mark as user-built custom automation
            originalTemplateId: primaryAutomation?.id || null
          };
          const res = await fetch(`${API_BASE}/automations`, {
            method: "POST",
            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${idToken}` },
            body: JSON.stringify(payload)
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || "Failed to save draft");
          setConfigModalOpen(false);
          navigate("/automations");
        } catch (err) {
          alert(err.message);
        } finally {
          setIsSaving(false);
        }
    }
  };

  const validActionCount = steps.filter(s => s.selected !== "None").length;

  return (
    <>
      <div className="max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6 ">
        {/* LEFT COLUMN */}
        <div className="lg:col-span-2 flex flex-col relative space-y-2">
          
          <div className="mb-2"></div>

          {/* TRIGGER STEP */}
          <div className="bg-surface-light dark:bg-surface-dark rounded-2xl border border-border-light dark:border-border-dark p-6 relative shadow-sm z-50">
            <div className="flex gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center font-bold text-primary text-lg shadow-sm">
                1
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-lg text-text-primary-light dark:text-text-primary-dark mb-1">Select Trigger Automation</h3>
                <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark mb-4">
                  This automation starts the workflow when specific conditions are met. (You can leave this as None to run manually).
                </p>
                <CustomSelect
                  options={["None", "Manual Trigger", ...availableAutomations.filter(a => a !== "None")]}
                  value={selectedTrigger}
                  onChange={setSelectedTrigger}
                />
              </div>
            </div>
          </div>

          <StepConnector />

          {/* ACTION STEPS */}
          {steps.map((step, index) => (
            <div key={step.id}>
              {index > 0 && <StepConnector />}
              <div className="bg-surface-light dark:bg-surface-dark rounded-2xl border border-border-light dark:border-border-dark p-6 relative shadow-sm" style={{ zIndex: 40 - index }}>
                {index > 0 && (
                  <button
                    onClick={() => removeStep(step.id)}
                    className="absolute top-4 right-4 text-text-secondary-light dark:text-text-secondary-dark hover:text-error transition"
                  >
                    <span className="material-symbols-rounded">close</span>
                  </button>
                )}
                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center font-bold text-text-secondary-light dark:text-text-secondary-dark text-lg shadow-sm">
                    {step.id}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-1">
                      <h3 className="font-bold text-lg text-text-primary-light dark:text-text-primary-dark">Select Follow-up Automation</h3>
                      <span className="text-xs px-2.5 py-1 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 font-semibold uppercase tracking-wider">
                        Action
                      </span>
                    </div>
                    <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark mb-4">
                      Runs immediately after the trigger completes successfully.
                    </p>
                    <div className="mb-4">
                      <CustomSelect
                        options={availableAutomations}
                        value={step.selected}
                        onChange={(val) => updateStepSelection(step.id, val)}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}

          <StepConnector />

          {/* ADD STEP */}
          <div className="pl-[72px]">
            <Button
              onClick={addStep}
              variant="ghost"
              className="
                w-full py-4 rounded-2xl border-2 border-dashed
                border-border-light dark:border-border-dark flex items-center justify-center gap-2
                text-text-secondary-light dark:text-text-secondary-dark
                hover:border-primary hover:text-primary hover:bg-primary/5 transition h-auto group
              "
            >
              <div className="p-1 rounded-full bg-gray-200 dark:bg-gray-800 group-hover:bg-primary group-hover:text-white transition-colors">
                <span className="material-symbols-outlined text-[18px]">add</span>
              </div>
              <span className="font-medium">Add another step</span>
            </Button>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="space-y-6 lg:sticky lg:top-6 self-start">
          <div className="bg-surface-light dark:bg-surface-dark rounded-2xl border border-border-light dark:border-border-dark shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-border-light dark:border-border-dark flex items-center bg-gray-50/50 dark:bg-white/5">
              <div className="p-2 rounded-lg bg-gray-100 dark:bg-white/10 text-text-secondary-light dark:text-text-secondary-dark mr-3">
                <span className="material-symbols-rounded text-primary">summarize</span>
              </div>
              <h3 className="font-bold text-lg text-text-primary-light dark:text-text-primary-dark">
                Workflow Summary
              </h3>
            </div>
            <div className="p-6">
              <SummaryRow label="Trigger" value={selectedTrigger === "None" ? "Manual" : selectedTrigger} />
              <SummaryRow label="Actions" value={`${validActionCount} Action(s)`} />
              <SummaryRow
                label="Primary Automation"
                value={primaryAutomation?.title || "None selected"}
              />
              <div className="mt-4 pt-4 border-t border-border-light dark:border-border-dark">
                <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark mb-4">
                  Note: Running a draft costs 5 credits. Saving a new draft costs 15 credits.
                </p>
                <div className="space-y-3">
                  <Button 
                    onClick={() => handleOpenConfigModal("run")}
                    disabled={allSelectedAutomations.length === 0 || isRunning}
                    className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700"
                  >
                    <span className="material-symbols-rounded">{isRunning ? 'refresh' : 'play_arrow'}</span>
                    {isRunning ? "Running..." : "Run Workflow (5 Credits)"}
                  </Button>
                  <Button
                    onClick={() => handleOpenConfigModal("save")}
                    disabled={allSelectedAutomations.length === 0 || isSaving}
                    variant="outline"
                    className="w-full flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-rounded">save</span>
                    Save as Draft (15 Credits)
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CONFIGURATION MODAL */}
      {configModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
          <div className="bg-white dark:bg-surface-dark w-full max-w-2xl rounded-2xl shadow-xl border border-border-light dark:border-border-dark my-8 max-h-[90vh] flex flex-col overflow-hidden">
            <div className="px-6 py-5 border-b border-border-light dark:border-border-dark flex justify-between items-center bg-surface-light dark:bg-surface-dark shrink-0">
              <h3 className="text-xl font-bold text-text-primary-light dark:text-text-primary-dark">
                {modalMode === "run" ? "Configure & Run" : "Configure & Save"}
              </h3>
              <button onClick={() => setConfigModalOpen(false)} className="text-text-secondary-light hover:text-text-primary-light p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 transition">
                <span className="material-symbols-rounded">close</span>
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 space-y-8">
              {modalMode === "save" && (
                <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 rounded-xl border border-blue-100 dark:border-blue-800/30">
                  <label className="block text-sm font-semibold mb-2">Automation Name</label>
                  <input
                    type="text"
                    value={draftName}
                    onChange={(e) => setDraftName(e.target.value)}
                    placeholder="e.g. Daily Marketing Sequence"
                    className="w-full px-4 py-3 rounded-xl bg-white dark:bg-black/20 border border-blue-200 dark:border-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    autoFocus
                  />
                </div>
              )}
              
              <div className="text-sm text-text-secondary-light dark:text-text-secondary-dark mb-4 bg-gray-50 dark:bg-white/5 p-4 rounded-xl">
                Configure inputs for your workflow steps. Use <code>{`{{STEP_1_RESULT}}`}</code> or <code>{`{{PREVIOUS_RESULT}}`}</code> to pass outputs between steps!
              </div>

              {allSelectedAutomations.map((auto, index) => {
                 const stepNumber = index + 1;
                 return (
                   <div key={`${auto.id}-${index}`} className="bg-white dark:bg-surface-dark rounded-2xl border border-border-light dark:border-border-dark p-6 relative shadow-sm">
                     <div className="flex items-center gap-4 mb-6 border-b border-border-light dark:border-border-dark pb-4">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-base shadow-sm shrink-0">
                           {stepNumber}
                        </div>
                        <h3 className="font-bold text-lg text-text-primary-light dark:text-text-primary-dark">{auto.title}</h3>
                     </div>
                     <div className="space-y-5">
                        {(!auto.inputs || auto.inputs.length === 0) ? (
                           <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark font-medium italic">No configuration needed.</p>
                        ) : (
                           auto.inputs.map(input => {
                              const currentValues = stepConfigs[index] || {};
                              if (!checkDependencies(auto.inputs, currentValues, input.dependency)) return null;
                              
                              return (
                                 <div key={input.id}>
                                    <label className="block text-sm font-semibold mb-1.5 text-text-primary-light dark:text-text-primary-dark">
                                      {input.label}
                                    </label>
                                    {input.type === "textarea" ? (
                                        <textarea
                                            value={currentValues[input.id] !== undefined ? currentValues[input.id] : (input.defaultValue || "")}
                                            onChange={(e) => handleInputChange(index, input.id, e.target.value)}
                                            placeholder={input.placeholder}
                                            rows={3}
                                            className="w-full px-4 py-3 rounded-xl border border-border-light dark:border-border-dark bg-gray-50 dark:bg-black/20 text-text-primary-light dark:text-text-primary-dark outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition"
                                        />
                                    ) : input.type === "select" ? (
                                        <select
                                            value={currentValues[input.id] !== undefined ? currentValues[input.id] : (input.defaultValue || "")}
                                            onChange={(e) => handleInputChange(index, input.id, e.target.value)}
                                            className="w-full px-4 py-3 rounded-xl border border-border-light dark:border-border-dark bg-gray-50 dark:bg-black/20 text-text-primary-light dark:text-text-primary-dark outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition"
                                        >
                                            <option value="">Select option...</option>
                                            {input.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                        </select>
                                    ) : input.type === "radio" ? (
                                        <div className="flex gap-4">
                                            {input.options.map(opt => (
                                                <label key={opt} className="flex items-center gap-2 cursor-pointer text-sm">
                                                    <input 
                                                        type="radio" 
                                                        name={`step-${index}-${input.id}`}
                                                        value={opt}
                                                        checked={(currentValues[input.id] !== undefined ? currentValues[input.id] : input.defaultValue) === opt}
                                                        onChange={(e) => handleInputChange(index, input.id, e.target.value)}
                                                        className="w-4 h-4 text-primary focus:ring-primary"
                                                    />
                                                    <span className="text-text-primary-light dark:text-text-primary-dark font-medium">{opt}</span>
                                                </label>
                                            ))}
                                        </div>
                                    ) : input.type === "toggle" ? (
                                        <label className="flex items-center gap-3 cursor-pointer">
                                            <div className="relative">
                                                <input 
                                                    type="checkbox" 
                                                    className="sr-only" 
                                                    checked={currentValues[input.id] !== undefined ? currentValues[input.id] : (input.defaultValue || false)}
                                                    onChange={(e) => handleInputChange(index, input.id, e.target.checked)}
                                                />
                                                <div className={`block w-10 h-6 rounded-full transition-colors ${currentValues[input.id] !== undefined ? (currentValues[input.id] ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-600') : (input.defaultValue ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-600')}`}></div>
                                                <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${currentValues[input.id] !== undefined ? (currentValues[input.id] ? 'translate-x-4' : '') : (input.defaultValue ? 'translate-x-4' : '')}`}></div>
                                            </div>
                                        </label>
                                    ) : (
                                        <input
                                            type={input.type || "text"}
                                            value={currentValues[input.id] !== undefined ? currentValues[input.id] : (input.defaultValue || "")}
                                            onChange={(e) => handleInputChange(index, input.id, e.target.value)}
                                            placeholder={input.placeholder}
                                            className="w-full px-4 py-3 rounded-xl border border-border-light dark:border-border-dark bg-gray-50 dark:bg-black/20 text-text-primary-light dark:text-text-primary-dark outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition"
                                        />
                                    )}
                                    {input.helperText && <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark mt-1.5">{input.helperText}</p>}
                                 </div>
                              );
                           })
                        )}
                     </div>
                   </div>
                 );
              })}
            </div>
            
            <div className="px-6 py-4 bg-surface-light dark:bg-surface-dark flex justify-between items-center border-t border-border-light dark:border-border-dark shrink-0">
               <div className="text-sm text-text-secondary-light font-medium bg-white dark:bg-black px-3 py-1.5 rounded-lg shadow-sm border border-border-light dark:border-border-dark">
                  Cost: {modalMode === "run" ? <strong className="text-blue-600">5 Credits</strong> : <strong className="text-primary">15 Credits</strong>}
               </div>
               <div className="flex gap-3">
                  <Button variant="ghost" onClick={() => setConfigModalOpen(false)}>Cancel</Button>
                  <Button onClick={executeAction} disabled={isRunning || isSaving}>
                    {(isRunning || isSaving) ? "Processing..." : (modalMode === "run" ? "Execute Now" : "Save Definition")}
                  </Button>
               </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/* ---------------- SUB COMPONENTS ---------------- */

function SummaryRow({ label, value, highlight }) {
  return (
    <div className="flex justify-between text-sm mb-3">
      <span className="text-text-secondary-light dark:text-text-secondary-dark font-medium">{label}</span>
      <span className={highlight ? "text-primary font-bold" : "font-semibold text-text-primary-light dark:text-text-primary-dark"}>
        {value}
      </span>
    </div>
  );
}

function StepConnector() {
  return (
    <div className="h-8 relative -mt-2">
      <div className="hidden lg:block absolute left-12 top-0 bottom-0 w-0.5 bg-gray-300 dark:bg-gray-700 -translate-x-1/2" />
    </div>
  );
}