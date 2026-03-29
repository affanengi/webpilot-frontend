import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";


import CustomSelect from "../../../components/ui/CustomSelect";
import FileAttachment from "../../../components/ui/FileAttachment";
import Button from "../../../components/ui/Button";
import Input from "../../../components/ui/Input";
import Textarea from "../../../components/ui/Textarea";

export default function ContactSupport() {
    const navigate = useNavigate();
    const location = useLocation();
    const [category, setCategory] = useState("General Inquiry");

    const handleBack = () => navigate(location.state?.from || "/support");

    return (
        <>
            <div className="max-w-3xl mx-auto pb-20">
                <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-2xl p-6 shadow-sm">

                    <div className="mb-6 p-4 rounded-xl bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/20">
                        <div className="flex items-start gap-3">
                            <span className="material-symbols-rounded text-blue-600 dark:text-blue-400 mt-0.5">support_agent</span>
                            <div>
                                <h3 className="text-sm font-bold text-blue-900 dark:text-blue-200">We're here to help</h3>
                                <p className="text-sm text-blue-700 dark:text-blue-300 opacity-90">Our team typically responds within 24 hours.</p>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">

                        {/* Name & Email */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-text-primary-light dark:text-text-primary-dark mb-2">
                                    Full Name <span className="text-error">*</span>
                                </label>
                                <Input
                                    type="text"
                                    placeholder="Jane Doe"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-text-primary-light dark:text-text-primary-dark mb-2">
                                    Email Address <span className="text-error">*</span>
                                </label>
                                <Input
                                    type="email"
                                    placeholder="name@company.com"
                                />
                            </div>
                        </div>

                        {/* Issue Category */}
                        <div>
                            <label className="block text-sm font-medium text-text-primary-light dark:text-text-primary-dark mb-2">
                                Issue Category
                            </label>
                            <CustomSelect
                                value={category}
                                options={[
                                    "General Inquiry",
                                    "Account & Billing",
                                    "Technical Issue",
                                    "Integration Help",
                                    "Other"
                                ]}
                                onChange={setCategory}
                            />
                        </div>

                        {/* Message */}
                        <div>
                            <label className="block text-sm font-medium text-text-primary-light dark:text-text-primary-dark mb-2">
                                Message <span className="text-error">*</span>
                            </label>
                            <Textarea
                                rows={5}
                                placeholder="How can we help you today?"
                            />
                        </div>

                        {/* Attachment */}
                        <FileAttachment />

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
                            Send Message
                        </Button>
                    </div>
                </div>
            </div>
        </>
    );

}
