import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Button from "../../components/ui/Button";

export default function Pricing() {
    const navigate = useNavigate();
    const location = useLocation();
    const [billingCycle, setBillingCycle] = useState("monthly"); // "monthly" | "yearly"

    const isYearly = billingCycle === "yearly";

    const handleLogoClick = () => {
        if (location.state?.fromPublic) {
            navigate("/");
        } else {
            navigate("/dashboard");
        }
    };

    const plans = [
        {
            name: "Free",
            price: "$0",
            description: "Perfect for hobbyists and side projects.",
            features: [
                "100 Automations / mo",
                "Basic execution limits",
                "Community access",
                "7-day log retention",
            ],
            current: true,
            buttonText: "Current Plan",
        },
        {
            name: "Plus",
            price: isYearly ? "$24" : "$29",
            period: "/month",
            billingNote: isYearly ? "billed $290 yearly" : null,
            description: "For creators and freelancers scaling up.",
            features: [
                "1,000 Automations / mo",
                "Higher execution limits",
                "Priority execution",
                "30-day log retention",
                "Email support",
            ],
            current: false,
            buttonText: "Upgrade to Plus",
            popular: true,
        },
        {
            name: "Pro",
            price: isYearly ? "$39" : "$49",
            period: "/month",
            billingNote: isYearly ? "billed $470 yearly" : null,
            description: "For teams and businesses needing power.",
            features: [
                "Unlimited Automations",
                "Fastest execution speeds",
                "Priority Support (24/7)",
                "90-day log retention",
                "5 Team Members",
            ],
            current: false,
            buttonText: "Upgrade to Pro",
        },
    ];

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-[#020617] text-gray-900 dark:text-white flex flex-col">
            {/* HEADER */}
            <header className="h-20 border-b border-gray-200 dark:border-[#1e293b] bg-white dark:bg-[#0b1220]">
                <div className="max-w-7xl mx-auto px-6 h-full flex items-center justify-between">
                    {/* Logo */}
                    <div
                        onClick={handleLogoClick}
                        className="flex items-center gap-3 cursor-pointer group"
                    >
                        <div className="bg-primary text-white w-10 h-10 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30 group-hover:scale-105 transition-transform">
                            <span className="material-symbols-rounded text-2xl">
                                rocket_launch
                            </span>
                        </div>
                        <div>
                            <h1 className="font-bold text-lg tracking-tight text-gray-900 dark:text-white">
                                WebPilot
                            </h1>
                            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                                Automation
                            </p>
                        </div>
                    </div>
                </div>
            </header>

            {/* CONTENT */}
            <main className="flex-1 max-w-7xl mx-auto px-6 py-12 w-full">
                <div className="text-center max-w-2xl mx-auto mb-10">
                    <h1 className="text-4xl font-bold mb-4 tracking-tight">
                        Simple, Transparent Pricing
                    </h1>
                    <p className="text-lg text-gray-600 dark:text-gray-400">
                        Choose the plan that best fits your automation needs. No hidden fees.
                    </p>
                </div>

                {/* BILLING TOGGLE */}
                <div className="flex justify-center mb-16">
                    <div className="bg-gray-100 dark:bg-[#1e293b] p-1 rounded-xl flex items-center relative">
                        <Button
                            onClick={() => setBillingCycle("monthly")}
                            variant={!isYearly ? "secondary" : "ghost"}
                            className={`
                px-6 py-2 text-sm font-semibold relative z-10 h-auto
                ${!isYearly ? "bg-white dark:bg-[#0b1220] shadow-sm text-gray-900 dark:text-white" : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white bg-transparent shadow-none"}
              `}
                        >
                            Monthly
                        </Button>
                        <Button
                            onClick={() => setBillingCycle("yearly")}
                            variant={isYearly ? "secondary" : "ghost"}
                            className={`
                px-6 py-2 text-sm font-semibold relative z-10 gap-2 h-auto
                ${isYearly ? "bg-white dark:bg-card-dark shadow-sm text-gray-900 dark:text-white" : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white bg-transparent shadow-none"}
              `}
                        >
                            Yearly
                            <span className="bg-green-100 text-green-700 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wide">
                                -20%
                            </span>
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                    {plans.map((plan) => (
                        <div
                            key={plan.name}
                            className={`
                relative rounded-2xl p-8 flex flex-col h-full border
                ${plan.popular
                                    ? "border-primary shadow-2xl shadow-primary/10 bg-white dark:bg-card-dark"
                                    : "border-gray-200 dark:border-border-dark bg-white/50 dark:bg-card-dark/50"
                                }
              `}
                        >
                            {plan.popular && (
                                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-lg">
                                    Most Popular
                                </div>
                            )}

                            <div className="mb-6">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                                    {plan.name}
                                </h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400 min-h-[40px]">
                                    {plan.description}
                                </p>
                            </div>

                            <div className="mb-8">
                                <div className="flex items-baseline gap-1">
                                    <span className="text-4xl font-bold text-gray-900 dark:text-white">
                                        {plan.price}
                                    </span>
                                    {plan.period && (
                                        <span className="text-gray-500 dark:text-gray-400">
                                            {plan.period}
                                        </span>
                                    )}
                                </div>
                                {plan.billingNote && (
                                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                                        {plan.billingNote}
                                    </p>
                                )}
                            </div>

                            <ul className="space-y-4 mb-8 flex-1">
                                {plan.features.map((feature) => (
                                    <li key={feature} className="flex items-start gap-3 text-sm">
                                        <span className={`material-symbols-rounded text-[20px] ${plan.current ? 'text-gray-400' : 'text-primary'}`}>
                                            check_circle
                                        </span>
                                        <span className="text-gray-700 dark:text-gray-300">
                                            {feature}
                                        </span>
                                    </li>
                                ))}
                            </ul>

                            <Button
                                disabled={plan.current}
                                variant={plan.current ? "secondary" : "primary"}
                                className={`
                  w-full py-3 font-bold text-sm h-auto
                  ${plan.current
                                        ? "bg-gray-100 dark:bg-border-dark text-gray-400 dark:text-gray-500 cursor-default shadow-none hover:bg-gray-100"
                                        : ""
                                    }
                `}
                            >
                                {plan.buttonText}
                            </Button>
                        </div>
                    ))}
                </div>
            </main>
        </div>
    );
}
