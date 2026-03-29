import React from "react";
import { Link } from "react-router-dom";
import {
    ArrowRight,
    Zap,
    Activity,
    Layers,
    Link as LinkIcon,
    Shield,
    CheckCircle2,
} from "lucide-react";
import PublicNavbar from "../../components/PublicNavbar";
import PublicFooter from "../../components/PublicFooter";

export default function LandingPage() {
    return (
        <div className="min-h-screen bg-white font-sans text-gray-900">
            <PublicNavbar />

            {/* HERO SECTION */}
            <section className="pt-32 pb-16 md:pt-40 md:pb-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
                <div className="max-w-4xl mx-auto">
                    <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight text-gray-900 mb-6">
                        Automate your workflow, <br />
                        <span className="text-blue-600">scale your business.</span>
                    </h1>
                    <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed">
                        WebPilot is the all-in-one automation platform for creators and
                        founders. Connect your favorite tools, build AI-powered workflows,
                        and monitor everything in one place.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                        <Link
                            to="/signup"
                            className="w-full sm:w-auto px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-lg shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
                        >
                            Get Started Free <ArrowRight size={20} />
                        </Link>
                        <a
                            href="#features"
                            className="w-full sm:w-auto px-8 py-4 bg-gray-100 hover:bg-gray-200 text-gray-900 font-semibold rounded-xl text-lg transition-all"
                        >
                            View Features
                        </a>
                    </div>
                </div>

                {/* Mockup Image */}
                <div className="mt-16 md:mt-20 relative mx-auto max-w-5xl">
                    <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-gray-200 bg-gray-50 aspect-[16/9] flex items-center justify-center group">
                        <div className="absolute inset-0 bg-gradient-to-tr from-blue-50 to-white opacity-50"></div>
                        {/* Placeholder for actual product screenshot */}
                        <div className="z-10 text-center p-8">
                            <div className="w-24 h-24 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-blue-600">
                                <Activity size={48} />
                            </div>
                            <p className="text-gray-500 font-medium">
                                Dashboard Preview
                            </p>
                        </div>
                    </div>
                    {/* Decorative background blob */}
                    <div className="absolute -top-20 -right-20 w-72 h-72 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
                    <div className="absolute -bottom-20 -left-20 w-72 h-72 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
                </div>
            </section>

            {/* FEATURES SECTION */}
            <section
                id="features"
                className="py-20 bg-gray-50 border-t border-gray-100"
            >
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center max-w-3xl mx-auto mb-16">
                        <h2 className="text-base font-semibold text-blue-600 tracking-wide uppercase">
                            Features
                        </h2>
                        <p className="mt-2 text-3xl leading-8 font-extrabold text-gray-900 sm:text-4xl">
                            Everything you need to automate
                        </p>
                        <p className="mt-4 max-w-2xl text-xl text-gray-500 mx-auto">
                            Powerful tools designed to help you build, run, and scale your
                            automations without the headache.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        <FeatureCard
                            icon={<Layers className="text-blue-600" size={28} />}
                            title="Multi-platform Automations"
                            description="Connect multiple services and platforms in a single workflow. Seamlessly transfer data between your favorite apps."
                        />
                        <FeatureCard
                            icon={<Zap className="text-yellow-500" size={28} />}
                            title="AI-Powered Workflows"
                            description="Leverage cutting-edge AI to make decisions, process text, and handle complex logic within your automations."
                        />
                        <FeatureCard
                            icon={<Activity className="text-green-500" size={28} />}
                            title="Real-time Monitoring"
                            description="Watch your workflows run in real-time. comprehensive logs help you debug and optimize performance."
                        />
                        <FeatureCard
                            icon={<LinkIcon className="text-purple-500" size={28} />}
                            title="Connected Accounts"
                            description="Securely manage authentication for all your external services. OAuth2 support built right in."
                        />
                        <FeatureCard
                            icon={<Shield className="text-red-500" size={28} />}
                            title="Enterprise-Grade Security"
                            description="Your data is encrypted at rest and in transit. Granular permissions ensure complete control."
                        />
                        <FeatureCard
                            icon={<CheckCircle2 className="text-teal-500" size={28} />}
                            title="Reliable Execution"
                            description="Built solely for uptime. We guarantee your automations run when they are supposed to, every time."
                        />
                    </div>
                </div>
            </section>

            {/* HOW IT WORKS */}
            <section className="py-20 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
                            How it works
                        </h2>
                        <p className="mt-4 text-xl text-gray-500">
                            Start automating in three simple steps
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
                        {/* Connecting Line (Desktop) */}
                        <div className="hidden md:block absolute top-12 left-1/6 right-1/6 h-0.5 bg-gray-100 z-0"></div>

                        <StepCard
                            number="1"
                            title="Connect Accounts"
                            description="Link your favorite tools and services securely in seconds."
                        />
                        <StepCard
                            number="2"
                            title="Build Workflows"
                            description="Drag and drop actions to create powerful automation logic."
                        />
                        <StepCard
                            number="3"
                            title="Run & Monitor"
                            description="Let WebPilot handle the heavy lifting while you track results."
                        />
                    </div>
                </div>
            </section>



            {/* CALL TO ACTION */}
            <section className="py-24 bg-blue-600">
                <div className="max-w-4xl mx-auto px-4 text-center">
                    <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
                        Ready to start automating?
                    </h2>
                    <p className="text-blue-100 text-xl mb-10 max-w-2xl mx-auto">
                        Join thousands of creators who are saving time and building faster
                        with WebPilot.
                    </p>
                    <Link
                        to="/signup"
                        className="inline-block bg-white text-blue-600 px-10 py-4 rounded-xl font-bold text-lg shadow-xl hover:shadow-2xl hover:scale-105 transition-all"
                    >
                        Get Started Free
                    </Link>
                </div>
            </section>

            <PublicFooter />
        </div>
    );
}

function FeatureCard({ icon, title, description }) {
    return (
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="bg-gray-50 w-14 h-14 rounded-xl flex items-center justify-center mb-6">
                {icon}
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">{title}</h3>
            <p className="text-gray-500 leading-relaxed">{description}</p>
        </div>
    );
}

function StepCard({ number, title, description }) {
    return (
        <div className="relative z-10 flex flex-col items-center text-center">
            <div className="w-24 h-24 bg-white border-4 border-blue-50 rounded-full flex items-center justify-center text-3xl font-bold text-blue-600 shadow-sm mb-6">
                {number}
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
            <p className="text-gray-500 max-w-xs mx-auto">{description}</p>
        </div>
    );
}
