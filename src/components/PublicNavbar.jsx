import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Menu, X } from "lucide-react";

export default function PublicNavbar() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    {/* Logo */}
                    <div className="flex-shrink-0 flex items-center">
                        <Link to="/" className="flex items-center gap-3">
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
                    </div>

                    {/* Desktop Menu */}
                    <div className="hidden md:flex items-center gap-8">
                        <a
                            href="#features"
                            className="text-gray-600 hover:text-blue-600 font-medium transition-colors"
                        >
                            Features
                        </a>
                        <Link
                            to="/pricing"
                            state={{ fromPublic: true }}
                            className="text-gray-600 hover:text-blue-600 font-medium transition-colors"
                        >
                            Pricing
                        </Link>
                        <Link
                            to="/login"
                            className="text-gray-600 hover:text-blue-600 font-medium transition-colors"
                        >
                            Login
                        </Link>
                        <Link
                            to="/signup"
                            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg font-semibold transition-all shadow-sm hover:shadow-md"
                        >
                            Get Started
                        </Link>
                    </div>

                    {/* Mobile Menu Button */}
                    <div className="md:hidden flex items-center">
                        <button
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                        >
                            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
            {mobileMenuOpen && (
                <div className="md:hidden bg-white border-b border-gray-100">
                    <div className="px-4 pt-2 pb-6 space-y-2">
                        <a
                            href="#features"
                            onClick={() => setMobileMenuOpen(false)}
                            className="block px-3 py-3 rounded-md text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50"
                        >
                            Features
                        </a>
                        <Link
                            to="/pricing"
                            state={{ fromPublic: true }}
                            onClick={() => setMobileMenuOpen(false)}
                            className="block px-3 py-3 rounded-md text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50"
                        >
                            Pricing
                        </Link>
                        <Link
                            to="/login"
                            onClick={() => setMobileMenuOpen(false)}
                            className="block px-3 py-3 rounded-md text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50"
                        >
                            Login
                        </Link>
                        <div className="pt-2">
                            <Link
                                to="/signup"
                                onClick={() => setMobileMenuOpen(false)}
                                className="block w-full text-center bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-lg font-semibold transition-all shadow-sm"
                            >
                                Get Started
                            </Link>
                        </div>
                    </div>
                </div>
            )}
        </nav>
    );
}
