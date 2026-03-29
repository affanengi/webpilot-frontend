import React from "react";
import PublicNavbar from "../../components/PublicNavbar";
export default function LegalLayout({ children }) {
    return (
        <div className="min-h-screen bg-white font-sans text-gray-900 flex flex-col">
            <PublicNavbar />
            <main className="flex-grow pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto w-full">
                {children}
            </main>
        </div>
    );
}
