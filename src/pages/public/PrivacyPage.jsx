import React from "react";
import LegalLayout from "./LegalLayout";
import PrivacyPolicy from "../../policies/PrivacyPolicy";

export default function PrivacyPage() {
    return (
        <LegalLayout>
            <div className="prose prose-blue max-w-none">
                <PrivacyPolicy />
            </div>
        </LegalLayout>
    );
}
