import React from "react";
import LegalLayout from "./LegalLayout";
import TermsOfService from "../../policies/TermsOfService";

export default function TermsPage() {
    return (
        <LegalLayout>
            <div className="prose prose-blue max-w-none">
                <TermsOfService />
            </div>
        </LegalLayout>
    );
}
