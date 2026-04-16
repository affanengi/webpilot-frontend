import { useState, useRef, useEffect } from "react";
import { useParams, useNavigate, useSearchParams, useOutletContext } from "react-router-dom";
import { doc, getDoc, onSnapshot, addDoc, setDoc, collection, serverTimestamp } from "firebase/firestore";

import { db, auth } from "../../firebase";
import { useAuth } from "../../context/AuthContext";
import { automations as templateAutomations } from "../../data/automations";
import CustomDateTimePicker from "../../components/ui/CustomDateTimePicker";
import CustomSelect from "../../components/ui/CustomSelect";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import Textarea from "../../components/ui/Textarea";

const API_BASE = import.meta.env.VITE_API_BASE || 'https://backend.affanmohd.online';

export default function AutomationDetails({ isReadOnly = false, previewData = null }) {
    const params = useParams();
    const id = params.id || previewData?.id;
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { user } = useAuth();
    const { setPageMeta } = useOutletContext() || {};
    const returnTab = searchParams.get('returnTab');
    const backPath = returnTab ? `/automations?tab=${returnTab}` : '/automations';

    const [automation, setAutomation] = useState(null);
    const [stepConfigs, setStepConfigs] = useState({});
    const [isSavedAutomation, setIsSavedAutomation] = useState(false);
    const [connectedAccountStatuses, setConnectedAccountStatuses] = useState({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [runningStatus, setRunningStatus] = useState(null); // 'loading', 'success', 'error'
    const [isEnabled, setIsEnabled] = useState(false);

    // 1. Initialize / Fetch Automation Data
    useEffect(() => {
        if (!user?.uid) return;

        const loadData = async () => {
            setLoading(true);

            if (isReadOnly && previewData) {
                setAutomation(previewData);
                setIsSavedAutomation(true);
                let configs = {};
                if (previewData.steps && previewData.steps.length > 0) {
                    previewData.steps.forEach((step, idx) => {
                        configs[idx] = step.inputs || {};
                    });
                } else {
                    configs = { 0: previewData.inputs || {} };
                }
                setStepConfigs(configs);
                setIsEnabled(previewData.status === 'enabled' || previewData.status === 'active');
                setLoading(false);
                return;
            }

            // Check if it's a template first
            const template = templateAutomations.find((a) => a.id === id);

            if (template) {
                setAutomation(template);
                setIsSavedAutomation(false);

                // Initialize default values for step 0
                const initial = {};
                template.inputs?.forEach(input => {
                    initial[input.id] = input.defaultValue || (input.type === "toggle" ? false : "");
                });
                setStepConfigs({ 0: initial });

                // Set back button to return to the correct tab
                if (setPageMeta) {
                    setPageMeta({
                        title: template.title || "Automation Details",
                        subtitle: "Configure and run this workflow.",
                        backPath
                    });
                }
                setLoading(false);
            } else {
                // Must be a saved automation, fetch from Firestore
                try {
                    const docRef = doc(db, "users", user.uid, "automations", id);
                    const docSnap = await getDoc(docRef);

                    if (docSnap.exists()) {
                        const data = docSnap.data();

                        // Find the original template to get the correct inputs schema (Array)
                        let templateIdToFind = data.originalTemplateId;
                        if (!templateIdToFind && data.steps && data.steps.length > 0) {
                            const matchedTemp = templateAutomations.find(a => a.title === data.steps[0].title);
                            if (matchedTemp) templateIdToFind = matchedTemp.id;
                        }
                        const template = templateAutomations.find(a => a.id === templateIdToFind);

                        if (template) {
                            // Merge: Use Template's schema (inputs array) + Saved Data's values & metadata
                            setAutomation({
                                ...template, // Base structure (provides inputs Array)
                                ...data,     // Overwrites (title, description, etc)
                                inputs: template.inputs, // EXPLICITLY force inputs to be the Schema Array
                                n8nWebhookId: template.n8nWebhookId, // 🚨 CRITICAL: Force the correct webhook ID
                                id: docSnap.id
                            });
                        } else {
                            // Fallback if template id missing (should not happen with new logic)
                            setAutomation({ id: docSnap.id, ...data });
                        }

                        setIsSavedAutomation(true);
                        
                        let configs = {};
                        if (data.steps && data.steps.length > 0) {
                            data.steps.forEach((step, idx) => {
                                configs[idx] = step.inputs || {};
                            });
                        } else {
                            configs = { 0: data.inputs || {} };
                        }
                        setStepConfigs(configs);
                        setIsEnabled(data.status === 'enabled' || data.status === 'active');

                        // Update Navbar Title to show this specific automation
                        if (setPageMeta) {
                            setPageMeta({
                                title: data.title || data.name || "Automation Details",
                                subtitle: "Configure and run this workflow.",
                                backPath
                            });
                        }

                    } else {
                        // Not found locally or remotely
                        setAutomation(null);
                    }
                } catch (error) {
                    console.error("Error fetching automation details:", error);
                    setAutomation(null);
                } finally {
                    setLoading(false);
                }
            }
        };

        loadData();
    }, [id, user]);

    const buildCompiledSteps = () => {
        if (!automation) return [];
        if (automation.steps && automation.steps.length > 0) {
            return automation.steps.map((step, idx) => ({
                ...step,
                inputs: stepConfigs[idx] || {}
            }));
        } else {
            return [{
                n8nWebhookId: automation.n8nWebhookId || automation.webhookId,
                connected_account_type: automation.connected_account_type,
                connected_accounts: automation.connected_accounts || [],
                inputs: stepConfigs[0] || {},
                title: automation.title || automation.name,
                icon: automation.icon,
                templateId: automation.originalTemplateId || automation.id
            }];
        }
    };

    const getRequiredAccounts = () => {
        if (!automation) return [];
        let accs = new Set();
        
        const processTemplate = (template, inputs, fallbackAccounts, fallbackType) => {
            if (template?.connected_accounts) {
                template.connected_accounts.forEach(a => accs.add(a));
            } else if (template?.connected_account_type) {
                accs.add(template.connected_account_type);
            } else if (fallbackAccounts) {
                fallbackAccounts.forEach(a => { if (a !== 'google_sheets') accs.add(a) });
            } else if (fallbackType) {
                accs.add(fallbackType);
            }
            
            if (template?.id === "youtube-upload-automation" && inputs["metadata_source"] === "Google Sheet / CSV") {
                accs.add("google_sheets");
            }
            if (template?.id === "linkedin-post-automation" && inputs["content_source"] === "Google Sheets") {
                accs.add("google_sheets");
            }
        };

        const steps = buildCompiledSteps();
        steps.forEach((step, index) => {
            const template = templateAutomations.find(a => 
                (step.templateId && a.id === step.templateId) || 
                (step.title && a.title === step.title) || 
                (step.n8nWebhookId && a.n8nWebhookId === step.n8nWebhookId) ||
                (step.type && a.nodeType === step.type)
            );
            const inputs = step.inputs || {};
            processTemplate(template, inputs, step.connected_accounts, step.connected_account_type);
        });

        return Array.from(accs);
    };

    // 2. Check Connected Account Status
    useEffect(() => {
        if (!user?.uid || !automation) return;

        const reqAccounts = getRequiredAccounts();
        if (reqAccounts.length === 0) return;

        const unsubscribes = reqAccounts.map(acc => {
            return onSnapshot(
                doc(db, "users", user.uid, "connected_accounts", acc),
                (docSnap) => {
                    setConnectedAccountStatuses(prev => ({
                        ...prev,
                        [acc]: { connected: docSnap.exists(), ...docSnap.data() }
                    }));
                }
            );
        });

        return () => unsubscribes.forEach(unsub => unsub());
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user, automation, JSON.stringify(stepConfigs)]);


    const handleInputChange = (stepIndex, id, value) => {
        setStepConfigs((prev) => ({
            ...prev,
            [stepIndex]: {
                ...(prev[stepIndex] || {}),
                [id]: value
            }
        }));
    };

    const isFieldVisible = (input, currentValues, templateInputs) => {
        if (!input.dependency) return true;
        
        const depValue = currentValues[input.dependency.field] !== undefined 
            ? currentValues[input.dependency.field] 
            : templateInputs?.find(i => i.id === input.dependency.field)?.defaultValue;

        if (Array.isArray(input.dependency.value)) {
            return input.dependency.value.includes(depValue);
        }
        return depValue === input.dependency.value;
    };

    const handleConnect = async (providerId) => {
        if (!user || !automation) return;
        try {
            const idToken = await auth.currentUser.getIdToken();
            const returnUrl = encodeURIComponent(window.location.href);
            const url = `${API_BASE}/auth/${providerId}/login?token=${idToken}&returnUrl=${returnUrl}`;
            window.location.href = url;
        } catch (error) {
            console.error("Error redirecting to auth:", error);
        }
    };

    const handleSave = async () => {
        if (!user || !automation) return;
        setSaving(true);
        try {
            const reqAcks = getRequiredAccounts();
            const compiled = buildCompiledSteps();

            // Recursively remove undefined values — Firestore's addDoc() rejects them hard.
            const sanitizeForFirestore = (obj) => {
                if (Array.isArray(obj)) return obj.map(sanitizeForFirestore);
                if (obj !== null && typeof obj === 'object') {
                    return Object.fromEntries(
                        Object.entries(obj)
                            .filter(([, v]) => v !== undefined)
                            .map(([k, v]) => [k, sanitizeForFirestore(v)])
                    );
                }
                return obj;
            };

            const dataToSave = sanitizeForFirestore({
                title: automation.title || automation.name || "Untitled",
                icon: automation.icon || null,
                description: automation.description || null,
                connected_account_type: automation.connected_account_type || null,
                connected_accounts: reqAcks,
                n8nWebhookId: automation.n8nWebhookId || automation.webhookId || null,
                about: automation.about || null,
                inputs: stepConfigs[0] || {},
                steps: compiled,
                status: isEnabled ? 'enabled' : 'disabled',
                isCustom: automation.isCustom ?? false,
                updatedAt: serverTimestamp(),
            });

            if (isSavedAutomation) {
                // Update existing
                await setDoc(doc(db, "users", user.uid, "automations", id), dataToSave, { merge: true });
            } else {
                // Create new — addDoc is strict: no undefined values allowed
                await addDoc(collection(db, "users", user.uid, "automations"), sanitizeForFirestore({
                    ...dataToSave,
                    originalTemplateId: id,
                    createdAt: serverTimestamp(),
                    status: 'enabled'
                }));
            }
            const returnTab = searchParams.get('returnTab');
            navigate(returnTab ? `/automations?tab=${returnTab}` : "/automations");
        } catch (error) {
            console.error("Error saving automation:", error);
            alert("Failed to save automation. Please try again.");
        } finally {
            setSaving(false);
        }
    };


    const handleRunNow = async () => {
        if (!user || !automation) return;
        setRunningStatus('loading');
        try {
            const idToken = await auth.currentUser.getIdToken();
            const compiled = buildCompiledSteps();
            const response = await fetch(`${API_BASE}/automations/${id}/trigger`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${idToken}`
                },
                body: JSON.stringify({ steps: compiled })
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || 'Failed to trigger automation');
            }

            setRunningStatus('success');
            setTimeout(() => {
                setRunningStatus(null);
                navigate(`/execution-logs?workflow=${encodeURIComponent(automation?.title || automation?.name || "All")}`);
            }, 2000);
        } catch (error) {
            console.error("Error running automation:", error);
            setRunningStatus('error');
            alert(error.message);
            setTimeout(() => setRunningStatus(null), 3000);
        }
    };

    // Helper to keep stored ID clean if moving from template ID to doc ID
    const classificationId = (currentId) => {
        return currentId;
    };


    if (loading) {
        return <div className="p-8 flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;
    }

    if (!automation) {
        return (
            <div className="p-8">
                <div className="flex flex-col items-center justify-center h-96">
                    <h2 className="text-2xl font-bold mb-4 text-text-primary-light dark:text-text-primary-dark">Automation Not Found</h2>
                    <button onClick={() => navigate("/automations")} className="text-primary hover:underline">
                        Back to Automations
                    </button>
                </div>
            </div>
        );
    }

    const compiledSteps = buildCompiledSteps();
    const requiredAccounts = getRequiredAccounts();
    // Custom canvas automations have logic/trigger nodes with no external accounts — always allow save.
    const isConnected = automation?.isCustom
        ? true
        : (requiredAccounts.length > 0 && requiredAccounts.every(acc => connectedAccountStatuses[acc]?.connected));

    return (
        <div className={isReadOnly ? "pointer-events-none opacity-95" : ""}>

            <div className={`grid grid-cols-1 lg:grid-cols-3 gap-8 pb-20 ${isReadOnly ? 'pb-0' : ''}`}>

                {/* LEFT COLUMN: ABOUT & CONNECTED ACCOUNT */}
                <div className="space-y-6 lg:sticky lg:top-6 z-10 h-fit">
                    {/* 2. ABOUT THIS AUTOMATION */}
                    <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-2xl shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-border-light dark:border-border-dark flex items-center bg-gray-50/50 dark:bg-white/5">
                            <div className="p-2 rounded-lg bg-gray-100 dark:bg-white/10 text-text-secondary-light dark:text-text-secondary-dark mr-3">
                                <span className="material-symbols-rounded text-primary">info</span>
                            </div>
                            <h3 className="text-lg font-bold text-text-primary-light dark:text-text-primary-dark">About this Automation</h3>
                        </div>

                        <div className="p-6">
                            {(compiledSteps && compiledSteps.length > 1) ? (
                                <>
                                    <div className="mb-4 bg-primary/5 p-4 rounded-xl border border-primary/10">
                                        <p className="text-sm font-semibold text-primary mb-3">
                                            Chained Workflow Execution:
                                        </p>
                                        <div className="space-y-3">
                                            {compiledSteps.map((step, i) => (
                                                <div key={i} className="flex gap-3 items-center text-sm font-medium text-text-primary-light dark:text-text-primary-dark">
                                                    <div className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-xs shrink-0 shadow-sm">
                                                        {i + 1}
                                                    </div>
                                                    <span>{step.title}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark mb-4 leading-relaxed">
                                        {automation.about?.description}
                                    </p>
                                    <div className="space-y-3">
                                        {automation.about?.howItWorks?.map((item, i) => (
                                            <div key={i} className="flex gap-3 text-sm text-text-secondary-light dark:text-text-secondary-dark">
                                                <span className="w-5 h-5 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-[10px] font-bold shrink-0 text-text-secondary-light dark:text-text-secondary-dark">
                                                    {i + 1}
                                                </span>
                                                <span>{item}</span>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            )}
                            
                            <div className="mt-6 pt-4 border-t border-border-light dark:border-border-dark grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-wider mb-1">Runtime</p>
                                    <p className="text-sm font-medium text-text-primary-light dark:text-text-primary-dark">{automation.about?.runtime || "Varies"}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-wider mb-1">Type</p>
                                    <p className="text-sm font-medium text-text-primary-light dark:text-text-primary-dark">{automation.about?.executionType || "Sequential"}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 3. REQUIREMENTS (DYNAMIC) */}
                    <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-2xl shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-border-light dark:border-border-dark flex items-center bg-gray-50/50 dark:bg-white/5">
                            <div className="p-2 rounded-lg bg-gray-100 dark:bg-white/10 text-text-secondary-light dark:text-text-secondary-dark mr-3">
                                <span className="material-symbols-rounded text-primary">link</span>
                            </div>
                            <h3 className="text-lg font-bold text-text-primary-light dark:text-text-primary-dark">
                                Requirements
                            </h3>
                        </div>

                        <div className="p-6">
                            <div className="space-y-3">
                                {requiredAccounts.map((acc) => {
                                    const isAccConnected = !!connectedAccountStatuses[acc]?.connected;
                                    return (
                                        <div key={acc} className={`flex flex-wrap xl:flex-nowrap items-center justify-between p-3 rounded-xl border gap-3 ${isAccConnected
                                            ? "border-emerald-200 bg-emerald-50 dark:bg-emerald-900/10 dark:border-emerald-800/30"
                                            : "border-orange-200 bg-orange-50 dark:bg-orange-900/10 dark:border-orange-800/30"
                                            }`}>
                                            <div className="flex items-center gap-3 min-w-0 w-full xl:w-auto">
                                                <div className="w-8 h-8 rounded-full bg-white dark:bg-black/20 flex items-center justify-center shadow-sm shrink-0">
                                                    {acc === 'linkedin' ? (
                                                        <span className="font-bold text-[#0077B5]">in</span>
                                                    ) : acc === 'youtube' ? (
                                                        <span className="material-symbols-rounded text-[#FF0000]">play_arrow</span>
                                                    ) : acc === 'instagram' ? (
                                                        <span className="material-symbols-rounded text-pink-600">photo_camera</span>
                                                    ) : acc === 'google_drive' ? (
                                                        <img src="https://upload.wikimedia.org/wikipedia/commons/1/12/Google_Drive_icon_%282020%29.svg" alt="Drive" className="w-5 h-5 object-contain" />
                                                    ) : acc === 'google_sheets' ? (
                                                        <img src="https://upload.wikimedia.org/wikipedia/commons/3/30/Google_Sheets_logo_%282014-2020%29.svg" alt="Sheets" className="w-5 h-5 object-contain" />
                                                    ) : acc === 'gmail' ? (
                                                        <img src="https://upload.wikimedia.org/wikipedia/commons/7/7e/Gmail_icon_%282020%29.svg" alt="Gmail" className="w-5 h-5 object-contain" />
                                                    ) : acc === 'github' ? (
                                                        <img src="https://upload.wikimedia.org/wikipedia/commons/9/91/Octicons-mark-github.svg" alt="GitHub" className="w-5 h-5 object-contain dark:invert" />
                                                    ) : acc === 'google_forms' ? (
                                                        <img src="https://upload.wikimedia.org/wikipedia/commons/5/5b/Google_Forms_2020_Logo.svg" alt="Google Forms" className="w-5 h-5 object-contain" />
                                                    ) : (
                                                        <span className="font-bold text-text-primary-light dark:text-text-primary-dark">{acc.charAt(0).toUpperCase()}</span>
                                                    )}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-sm font-medium text-text-primary-light dark:text-text-primary-dark capitalize truncate">
                                                        {acc.replace('_', ' ')} Account
                                                    </p>
                                                    <p className={`text-xs flex items-center gap-1 font-medium ${isAccConnected ? "text-emerald-700 dark:text-emerald-400" : "text-orange-700 dark:text-orange-400"}`}>
                                                        <span className={`block w-1.5 h-1.5 rounded-full ${isAccConnected ? "bg-emerald-500" : "bg-orange-500"}`}></span>
                                                        {isAccConnected ? "Connected" : "Not Connected"}
                                                    </p>
                                                </div>
                                            </div>
                                            {!isAccConnected && (
                                                <Button onClick={() => handleConnect(acc)} variant="primary" className="text-xs h-8 px-3 ml-auto sm:ml-0 whitespace-nowrap">
                                                    Connect Now
                                                </Button>
                                            )}
                                            {isAccConnected && (
                                                <button className="text-xs font-semibold text-text-secondary-light dark:text-text-secondary-dark hover:text-text-primary-light dark:hover:text-text-primary-dark ml-auto sm:ml-0 whitespace-nowrap cursor-default">
                                                    Ready
                                                </button>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>

                {/* RIGHT (or CENTER) COLUMN: CONFIGURATION - Takes up 2 cols on lg */}
                <div className="lg:col-span-2 space-y-6">

                    {/* 4. CONFIGURATION */}
                    <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-2xl shadow-sm">
                        <div className="px-6 py-4 border-b border-border-light dark:border-border-dark flex items-center justify-between bg-gray-50/50 dark:bg-white/5 rounded-t-2xl">
                            <div className="flex items-center">
                                <div className="p-2 rounded-lg bg-gray-100 dark:bg-white/10 text-text-secondary-light dark:text-text-secondary-dark mr-3">
                                    <span className="material-symbols-rounded text-[20px]">
                                        tune
                                    </span>
                                </div>
                                <h3 className="text-lg font-bold text-text-primary-light dark:text-text-primary-dark">
                                    Configuration
                                </h3>
                            </div>
                            {automation.isCustom && (
                                <Button 
                                    onClick={() => navigate('/canvas-automation', { state: { editAutomationId: id, automationData: automation, stepConfigs } })} 
                                    variant="primary" 
                                    className="h-9 px-4 text-xs font-semibold flex items-center gap-2 shadow-sm"
                                >
                                    <span className="material-symbols-rounded text-[16px]">edit</span>
                                    Edit in Canvas
                                </Button>
                            )}
                        </div>

                        <div className="p-6 space-y-8">
                            {compiledSteps.map((step, stepIndex) => {
                                const template = templateAutomations.find(a => 
                                    (step.templateId && a.id === step.templateId) || 
                                    (step.title && a.title === step.title) || 
                                    (step.n8nWebhookId && a.n8nWebhookId === step.n8nWebhookId) ||
                                    (step.type && a.nodeType === step.type)
                                );
                                if (!template || !template.inputs || template.inputs.length === 0) return null;
                                
                                const currentValues = stepConfigs[stepIndex] || {};

                                return (
                                    <div key={stepIndex} className={compiledSteps.length > 1 ? "bg-gray-50/50 dark:bg-black/10 rounded-2xl p-6 border border-border-light dark:border-border-dark shadow-sm" : ""}>
                                        {compiledSteps.length > 1 && (
                                            <div className="flex items-center gap-3 border-b border-border-light dark:border-border-dark pb-4 mb-6">
                                                <div className="w-8 h-8 rounded-xl bg-primary text-white shadow-sm flex items-center justify-center font-bold text-sm">
                                                    {stepIndex + 1}
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-lg text-text-primary-light dark:text-text-primary-dark">{step.title || template.title}</h4>
                                                    <p className="text-xs text-text-secondary-light font-medium mt-0.5 uppercase tracking-wide">Configure inputs for this step</p>
                                                </div>
                                            </div>
                                        )}
                                        <div className="space-y-6">
                                            {template.inputs.map((input) => {
                                                if (!isFieldVisible(input, currentValues, template.inputs)) return null;

                                                return (
                                                    <div key={input.id}>
                                                        <label className="block text-sm font-medium text-text-primary-light dark:text-text-primary-dark mb-2">
                                                            {input.label}
                                                            {input.required && <span className="text-error ml-1">*</span>}
                                                        </label>

                                                        {/* INPUT RENDERER */}
                                                        {input.type === "select" ? (
                                                            <CustomSelect
                                                                options={input.options}
                                                                value={currentValues[input.id] !== undefined ? currentValues[input.id] : (input.defaultValue || input.options[0])}
                                                                onChange={(val) => handleInputChange(stepIndex, input.id, val)}
                                                            />
                                                        ) : input.type === "textarea" ? (
                                                            <Textarea
                                                                placeholder={input.placeholder}
                                                                rows={4}
                                                                value={currentValues[input.id] !== undefined ? currentValues[input.id] : ""}
                                                                onChange={(e) => handleInputChange(stepIndex, input.id, e.target.value)}
                                                            />
                                                        ) : input.type === "radio" ? (
                                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                                {input.options.map(opt => {
                                                                    const isSelected = (currentValues[input.id] !== undefined ? currentValues[input.id] : input.defaultValue) === opt;
                                                                    return (
                                                                        <div
                                                                            key={opt}
                                                                            onClick={() => handleInputChange(stepIndex, input.id, opt)}
                                                                            className={`cursor-pointer px-4 py-3 rounded-xl border text-sm font-medium transition-all flex items-center gap-2
                                                                                ${isSelected
                                                                                    ? "border-primary bg-primary/5 text-primary"
                                                                                    : "border-border-light dark:border-border-dark hover:bg-gray-50 dark:hover:bg-white/5 text-text-secondary-light dark:text-text-secondary-dark"
                                                                                }
                                                                            `}
                                                                        >
                                                                            <div className="w-4 h-4 rounded-full border flex items-center justify-center" style={{ borderColor: isSelected ? 'var(--color-primary)' : 'currentColor' }}>
                                                                                {isSelected && <div className="w-2 h-2 rounded-full bg-primary"></div>}
                                                                            </div>
                                                                            {opt}
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        ) : input.type === "toggle" ? (
                                                            <label className="inline-flex items-center cursor-pointer relative">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={currentValues[input.id] !== undefined ? !!currentValues[input.id] : !!input.defaultValue}
                                                                    onChange={(e) => handleInputChange(stepIndex, input.id, e.target.checked)}
                                                                    className="sr-only peer"
                                                                />
                                                                <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
                                                                <span className="ms-3 text-sm font-medium text-text-primary-light dark:text-text-primary-dark">{input.label}</span>
                                                            </label>
                                                        ) : input.type === "file" ? (
                                                            <div className="border-2 border-dashed border-border-light dark:border-border-dark rounded-2xl p-8 text-center hover:bg-gray-50 dark:hover:bg-white/5 transition cursor-pointer group">
                                                                <span className="material-symbols-rounded text-3xl text-text-secondary-light dark:text-text-secondary-dark mb-2 group-hover:text-primary transition-colors">cloud_upload</span>
                                                                <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">Click to upload or drag and drop</p>
                                                                <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark mt-1 opacity-70">SVG, PNG, JPG or GIF (max. 800x400px)</p>
                                                            </div>
                                                        ) : input.type === "datetime-local" ? (
                                                            <CustomDateTimePicker
                                                                value={currentValues[input.id]}
                                                                placeholder={input.placeholder || "Select date and time"}
                                                                onChange={(val) => handleInputChange(stepIndex, input.id, val)}
                                                            />
                                                        ) : (
                                                            <Input
                                                                type={input.type || "text"}
                                                                placeholder={input.placeholder}
                                                                value={currentValues[input.id] !== undefined ? currentValues[input.id] : (input.defaultValue || "")}
                                                                onChange={(e) => handleInputChange(stepIndex, input.id, e.target.value)}
                                                            />
                                                        )}

                                                        {input.helperText && (
                                                            <p className="mt-1.5 text-xs text-text-secondary-light dark:text-text-secondary-dark flex items-center gap-1">
                                                                <span className="material-symbols-rounded text-[14px]">info</span>
                                                                {input.helperText}
                                                            </p>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* 5. EXECUTION & CONTROL (Only visible if Saved) */}
                    {isSavedAutomation && (
                        <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-2xl shadow-sm overflow-hidden">
                            <div className="px-6 py-4 border-b border-border-light dark:border-border-dark flex items-center justify-between bg-gray-50/50 dark:bg-white/5">
                                <div className="flex items-center">
                                    <div className="p-2 rounded-lg bg-gray-100 dark:bg-white/10 text-text-secondary-light dark:text-text-secondary-dark mr-3">
                                        <span className="material-symbols-rounded text-primary">play_circle</span>
                                    </div>
                                    <h3 className="text-lg font-bold text-text-primary-light dark:text-text-primary-dark">
                                        Enable Automation
                                    </h3>
                                </div>
                                <label className="inline-flex items-center cursor-pointer relative" onClick={() => setIsEnabled(v => !v)}>
                                    <input type="checkbox" checked={isEnabled} onChange={() => setIsEnabled(v => !v)} className="sr-only peer" />
                                    <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                                </label>
                            </div>

                            <div className="p-6">
                                <div className="flex items-center justify-between mb-6">
                                    <div>
                                        <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">Pause or resume this workflow anytime. When enabled, your settings will apply to future runs.</p>
                                    </div>
                                </div>

                                <div className="flex gap-3">
                                    <Button 
                                        onClick={handleRunNow} 
                                        disabled={runningStatus === 'loading'}
                                        className="flex-1 flex items-center justify-center gap-2 h-11"
                                    >
                                        {runningStatus === 'loading' ? (
                                            <span className="material-symbols-rounded animate-spin">refresh</span>
                                        ) : runningStatus === 'success' ? (
                                            <span className="material-symbols-rounded">check</span>
                                        ) : (
                                            <span className="material-symbols-rounded">play_arrow</span>
                                        )}
                                        {runningStatus === 'loading' ? 'Starting...' : runningStatus === 'success' ? 'Started!' : 'Run Now'}
                                    </Button>
                                    <Button onClick={() => navigate(`/execution-logs?workflow=${encodeURIComponent(automation?.title || automation?.name || "All")}`)} variant="outline" className="px-6 h-11">
                                        View Logs
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}

                </div>
            </div>

            {!isReadOnly && (
                // 6. FOOTER ACTIONS
                <div className="fixed bottom-0 left-0 right-0 md:left-72 bg-white dark:bg-[#0B0D12] border-t border-border-light dark:border-border-dark p-4 z-40 transition-all duration-300 shadow-[0_-10px_30px_-15px_rgba(0,0,0,0.15)]">
                    <div className="max-w-7xl mx-auto flex items-center justify-end gap-3 px-4">
                        <Button
                            onClick={() => navigate("/automations")}
                            variant="ghost"
                            className="px-6 py-2.5 text-sm h-11"
                        >
                            Cancel
                        </Button>
                        <div className="relative group/save">
                            <Button
                                onClick={handleSave}
                                disabled={!isConnected || saving}
                                className={`px-6 py-2.5 text-sm h-11 ${(!isConnected || saving) ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                {saving ? 'Saving...' : 'Save Automation'}
                            </Button>
                            {!isConnected && (
                                <div className="absolute bottom-full mb-2 right-0 w-64 p-2 bg-gray-900 text-white text-xs rounded shadow-lg opacity-0 group-hover/save:opacity-100 transition-opacity pointer-events-none">
                                    Connect all required accounts to save this automation.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

        </div>
    );

}
