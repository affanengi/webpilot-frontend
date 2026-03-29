import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";


import CustomSelect from "../../../components/ui/CustomSelect";
import FileAttachment from "../../../components/ui/FileAttachment";
import Button from "../../../components/ui/Button";
import Input from "../../../components/ui/Input";
import Textarea from "../../../components/ui/Textarea";

export default function ReportBug() {
    const navigate = useNavigate();
    const location = useLocation();
    const [severity, setSeverity] = useState("Low");

    const handleBack = () => navigate(location.state?.from || "/support");

    return (
        <div className="max-w-3xl mx-auto pb-20">
            <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-2xl p-6 shadow-sm">
                <div className="space-y-6">

                    {/* Bug Title */}
                    <div>
                        <label className="block text-sm font-medium text-text-primary-light dark:text-text-primary-dark mb-2">
                            Bug Title <span className="text-error">*</span>
                        </label>
                        <Input
                            type="text"
                            placeholder="e.g., Workflow fails when connecting to Slack"
                        />
                    </div>

                    {/* Severity */}
                    <div>
                        <label className="block text-sm font-medium text-text-primary-light dark:text-text-primary-dark mb-2">
                            Severity
                        </label>
                        <CustomSelect
                            value={severity}
                            options={["Low", "Medium", "High", "Critical"]}
                            onChange={setSeverity}
                        />
                    </div>

                    {/* Detailed Description */}
                    <div>
                        <label className="block text-sm font-medium text-text-primary-light dark:text-text-primary-dark mb-2">
                            Description <span className="text-error">*</span>
                        </label>
                        <Textarea
                            rows={4}
                            placeholder="Describe what happened..."
                        />
                    </div>

                    {/* Steps to Reproduce */}
                    <div>
                        <label className="block text-sm font-medium text-text-primary-light dark:text-text-primary-dark mb-2">
                            Steps to Reproduce
                        </label>
                        <Textarea
                            rows={4}
                            placeholder="1. Go to...&#10;2. Click on...&#10;3. See error..."
                        />
                    </div>

                    {/* Expected vs Actual */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-text-primary-light dark:text-text-primary-dark mb-2">
                                Expected Behavior
                            </label>
                            <Input
                                type="text"
                                placeholder="It should have saved..."
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-text-primary-light dark:text-text-primary-dark mb-2">
                                Actual Behavior
                            </label>
                            <Input
                                type="text"
                                placeholder="It showed a 500 error..."
                            />
                        </div>
                    </div>

                    {/* Screenshot Upload (Visual Only) */}
                    <FileAttachment label="Screenshot (Optional)" />

                    {/* Additional Notes */}
                    <div>
                        <label className="block text-sm font-medium text-text-primary-light dark:text-text-primary-dark mb-2">
                            Additional Notes
                        </label>
                        <Input
                            type="text"
                            placeholder="Browser version, OS, etc."
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
                        Submit Report
                    </Button>
                </div>
            </div>
        </div>
    );

}
