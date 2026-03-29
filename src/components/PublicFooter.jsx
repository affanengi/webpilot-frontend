import React from "react";
import { Link } from "react-router-dom";
import { Twitter, Github, Linkedin } from "lucide-react";

export default function PublicFooter() {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="bg-gray-50 border-t border-gray-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    {/* Brand */}
                    <div className="col-span-1 md:col-span-1">
                        <Link to="/" className="flex items-center gap-3 mb-6">
                            <div className="bg-blue-600 text-white w-10 h-10 rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/20">
                                <span className="material-symbols-rounded text-2xl font-normal">
                                    rocket_launch
                                </span>
                            </div>
                            <div className="flex flex-col">
                                <span className="font-bold text-lg text-gray-900 tracking-tight leading-none">
                                    WebPilot
                                </span>
                                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider leading-none mt-0.5">
                                    Automation
                                </span>
                            </div>
                        </Link>
                        <p className="text-gray-500 text-sm mb-6">
                            Automate your workflows, save time, and scale your business with
                            WebPilot.
                        </p>
                        <div className="flex gap-4">
                            <a
                                href="#"
                                className="text-gray-400 hover:text-gray-600 transition-colors"
                                aria-label="Twitter"
                            >
                                <Twitter size={20} />
                            </a>
                            <a
                                href="#"
                                className="text-gray-400 hover:text-gray-600 transition-colors"
                                aria-label="GitHub"
                            >
                                <Github size={20} />
                            </a>
                            <a
                                href="#"
                                className="text-gray-400 hover:text-gray-600 transition-colors"
                                aria-label="LinkedIn"
                            >
                                <Linkedin size={20} />
                            </a>
                        </div>
                    </div>

                    {/* Product */}
                    <div>
                        <h3 className="font-semibold text-gray-900 mb-4">Product</h3>
                        <ul className="space-y-3 text-sm">
                            <li>
                                <a
                                    href="#features"
                                    className="text-gray-600 hover:text-blue-600 transition-colors"
                                >
                                    Features
                                </a>
                            </li>
                            <li>
                                <a
                                    href="#pricing"
                                    className="text-gray-600 hover:text-blue-600 transition-colors"
                                >
                                    Pricing
                                </a>
                            </li>
                            <li>
                                <Link
                                    to="/docs"
                                    className="text-gray-600 hover:text-blue-600 transition-colors"
                                >
                                    Documentation
                                </Link>
                            </li>
                            <li>
                                <Link
                                    to="/changelog"
                                    className="text-gray-600 hover:text-blue-600 transition-colors"
                                >
                                    Changelog
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Company */}
                    <div>
                        <h3 className="font-semibold text-gray-900 mb-4">Company</h3>
                        <ul className="space-y-3 text-sm">
                            {[
                                "About",
                                "Blog",
                                "Careers",
                                "Contact"
                            ].map((item) => (
                                <li key={item}>
                                    <span
                                        title="Coming soon"
                                        className="text-gray-400 cursor-default"
                                    >
                                        {item}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Legal */}
                    <div>
                        <h3 className="font-semibold text-gray-900 mb-4">Legal</h3>
                        <ul className="space-y-3 text-sm">
                            <li>
                                <a
                                    href="/legal/privacy"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-gray-600 hover:text-blue-600 transition-colors"
                                >
                                    Privacy Policy
                                </a>
                            </li>
                            <li>
                                <a
                                    href="/legal/terms"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-gray-600 hover:text-blue-600 transition-colors"
                                >
                                    Terms of Service
                                </a>
                            </li>
                            <li>
                                <span
                                    title="Coming soon"
                                    className="text-gray-400 cursor-default"
                                >
                                    Security
                                </span>
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="border-t border-gray-200 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-gray-500 text-sm">
                        © {currentYear} WebPilot Inc. All rights reserved.
                    </p>
                    <div className="flex gap-6 text-sm text-gray-500">
                        <a
                            href="/legal/privacy"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:text-gray-900"
                        >
                            Privacy
                        </a>
                        <a
                            href="/legal/terms"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:text-gray-900"
                        >
                            Terms
                        </a>
                    </div>
                </div>
            </div>
        </footer>
    );
}
