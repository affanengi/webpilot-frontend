import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";


import CustomSelect from "../../../components/ui/CustomSelect";
import Button from "../../../components/ui/Button";
import Input from "../../../components/ui/Input";
import Textarea from "../../../components/ui/Textarea";

export default function FeatureRequest() {
    const navigate = useNavigate();
    const location = useLocation();
    const [priority, setPriority] = useState("Nice to have");

    const handleBack = () => navigate(location.state?.from || "/support");

    return (
        <div className="max-w-3xl mx-auto pb-20">
            <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-2xl p-6 shadow-sm">
                <div className="space-y-6">

                    {/* Feature Title */}
                    <div>
                        <label className="block text-sm font-medium text-text-primary-light dark:text-text-primary-dark mb-2">
                            Feature Title <span className="text-error">*</span>
                        </label>
                        <Input
                            type="text"
                            placeholder="e.g., Dark Mode for Email Reports"
                        />
                    </div>

                    {/* Priority */}
                    <div>
                        <label className="block text-sm font-medium text-text-primary-light dark:text-text-primary-dark mb-2">
                            Priority
                        </label>
                        <CustomSelect
                            value={priority}
                            options={["Nice to have", "Important", "Critical"]}
                            onChange={setPriority}
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium text-text-primary-light dark:text-text-primary-dark mb-2">
                            Description <span className="text-error">*</span>
                        </label>
                        <Textarea
                            rows={4}
                            placeholder="Describe the feature in detail..."
                        />
                    </div>

                    {/* Problem Solved */}
                    <div>
                        <label className="block text-sm font-medium text-text-primary-light dark:text-text-primary-dark mb-2">
                            What problem does this solve?
                        </label>
                        <Textarea
                            rows={3}
                            placeholder="Currently, I have to manually..."
                        />
                    </div>

                    {/* Expected Benefit */}
                    <div>
                        <label className="block text-sm font-medium text-text-primary-light dark:text-text-primary-dark mb-2">
                            Expected Benefit
                        </label>
                        <Input
                            type="text"
                            placeholder="e.g., Saves 5 hours per week"
                        />
                    </div>

                    {/* Reference Links */}
                    <div>
                        <label className="block text-sm font-medium text-text-primary-light dark:text-text-primary-dark mb-2">
                            Reference Links (Optional)
                        </label>
                        <Input
                            type="text"
                            placeholder="https://..."
                        />
                    </div>

                </div>

                {/* Footer Actions */}
                <div className="mt-8 flex items-center justify-end gap-3 pt-6 border-t border-border-light dark:border-border-dark">
                    <Button
                        onClick={handleBack}
                        variant="ghost"
                        className="text-text-secondary-light dark:text-text-secondary-dark hover:bg-gray-100 dark:hover:bg-white/5 h-11"
                    >
                        Cancel
                    </Button>
                    <Button variant="primary" className="h-11 px-6 shadow-sm">
                        Submit Request
                    </Button>
                </div>
            </div>
        </div>
    );

}
