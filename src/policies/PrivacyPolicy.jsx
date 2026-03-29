export default function PrivacyPolicy({ themeMode = "auto" }) {
  const isLight = themeMode === "light";
  const darkClass = (cls) => isLight ? "" : cls;

  return (
    <div className="w-full flex flex-col items-center justify-start px-0 sm:px-6 lg:px-8">
      {/* Document Container */}
      <div className={`relative w-full max-w-none sm:max-w-4xl max-h-[85vh]
        bg-white ${darkClass("dark:bg-gray-800")}
        rounded-none sm:rounded-xl overflow-hidden
        shadow-none sm:shadow-xl
        border-0 sm:border border-gray-200 ${darkClass("dark:border-gray-700")}
        flex flex-col`}
      >
        {/* Scrollable Content Area */}
        <div className="max-h-[75vh] overflow-y-auto">
          <div className={`px-1 py-1 sm:px-8 sm:py-8 md:px-12 md:py-12 space-y-0 bg-white ${darkClass("dark:bg-gray-800")} overflow-y-auto`}>

            {/* Header */}
            <div className={`px-4 py-6 sm:px-8 sm:py-10 md:px-12 md:py-12 border-b border-gray-100 ${darkClass("dark:border-gray-700")} bg-white ${darkClass("dark:bg-gray-800")}`}>
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="material-symbols-rounded text-primary text-3xl">
                    policy
                  </span>
                  <span className="text-sm font-semibold uppercase tracking-wider text-primary">
                    Legal Document
                  </span>
                </div>

                <h1 className={`text-3xl md:text-4xl font-black tracking-tight text-gray-900 ${darkClass("dark:text-white")}`}>
                  Privacy Policy
                </h1>

                <p className={`text-base text-gray-500 ${darkClass("dark:text-gray-400")} font-medium`}>
                  Last Updated: October 24, 2023
                </p>
              </div>
            </div>

            {/* Content */}
            <div className={`px-8 py-8 md:px-12 md:py-12 space-y-12 bg-white ${darkClass("dark:bg-gray-800")}`}>

              {/* 01 Introduction */}
              <section>
                <h2 className={`text-xl font-bold text-gray-900 ${darkClass("dark:text-white")} mb-4 flex items-center gap-2`}>
                  <span className="text-primary/40 text-sm font-black tracking-widest uppercase">
                    01.
                  </span>
                  Introduction
                </h2>
                <p className={`text-gray-600 ${darkClass("dark:text-gray-300")} leading-relaxed`}>
                  WebPilot Automation ("we", "our", or "us") is committed to protecting
                  your privacy. This Privacy Policy explains how we collect, use,
                  disclose, and safeguard your information when you use our
                  automation platform, website, and related services. By accessing
                  or using our Service, you signify that you have read, understood,
                  and agree to our collection, storage, use, and disclosure of your
                  personal information as described in this Privacy Policy.
                </p>
              </section>

              {/* 02 Information We Collect */}
              <section>
                <h2 className={`text-xl font-bold text-gray-900 ${darkClass("dark:text-white")} mb-4 flex items-center gap-2`}>
                  <span className="text-primary/40 text-sm font-black tracking-widest uppercase">
                    02.
                  </span>
                  Information We Collect
                </h2>

                <p className={`text-gray-600 ${darkClass("dark:text-gray-300")} leading-relaxed mb-6`}>
                  We collect information that you provide directly to us when you
                  register for an account, create or modify your profile, set up
                  automation workflows, or contact customer support. This may
                  include:
                </p>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className={`bg-background-light ${darkClass("dark:bg-gray-700/50")} p-5 rounded-lg border border-gray-100 ${darkClass("dark:border-gray-700")}`}>
                    <div className="flex items-start gap-3">
                      <span className="material-symbols-rounded text-primary mt-1">
                        badge
                      </span>
                      <div>
                        <h3 className={`font-semibold text-gray-900 ${darkClass("dark:text-white")}`}>
                          Account Information
                        </h3>
                        <p className={`text-sm text-gray-500 ${darkClass("dark:text-gray-400")} mt-1`}>
                          Your name, email address, password, and organization
                          details provided during sign-up.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className={`bg-background-light ${darkClass("dark:bg-gray-700/50")} p-5 rounded-lg border border-gray-100 ${darkClass("dark:border-gray-700")}`}>
                    <div className="flex items-start gap-3">
                      <span className="material-symbols-rounded text-primary mt-1">
                        analytics
                      </span>
                      <div>
                        <h3 className={`font-semibold text-gray-900 ${darkClass("dark:text-white")}`}>
                          Usage Data
                        </h3>
                        <p className={`text-sm text-gray-500 ${darkClass("dark:text-gray-400")} mt-1`}>
                          Log files, device information, and interaction metrics
                          regarding how you use our platform.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className={`bg-background-light ${darkClass("dark:bg-gray-700/50")} p-5 rounded-lg border border-gray-100 ${darkClass("dark:border-gray-700")} md:col-span-2`}>
                    <div className="flex items-start gap-3">
                      <span className="material-symbols-rounded text-primary mt-1">
                        hub
                      </span>
                      <div>
                        <h3 className={`font-semibold text-gray-900 ${darkClass("dark:text-white")}`}>
                          Connected Services Metadata
                        </h3>
                        <p className={`text-sm text-gray-500 ${darkClass("dark:text-gray-400")} mt-1`}>
                          When you integrate third-party tools (e.g., Slack,
                          Notion), we collect authentication tokens and metadata
                          necessary to execute your automation workflows. We do not
                          store the content of your connected services unless
                          explicitly required for a specific workflow action.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* 03 How We Use Information */}
              <section>
                <h2 className={`text-xl font-bold text-gray-900 ${darkClass("dark:text-white")} mb-4 flex items-center gap-2`}>
                  <span className="text-primary/40 text-sm font-black tracking-widest uppercase">
                    03.
                  </span>
                  How We Use Information
                </h2>

                <ul className="space-y-3">
                  {[
                    "Provide, operate, and maintain our automation services.",
                    "Improve, personalize, and expand our platform functionality.",
                    "Understand and analyze how you use our platform to develop new products, services, features, and functionality.",
                    "Process your transactions and manage your orders.",
                    "Find and prevent fraud to ensure platform security.",
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <span className="material-symbols-rounded text-primary text-xl shrink-0">
                        check_circle
                      </span>
                      <span className={`text-gray-600 ${darkClass("dark:text-gray-300")}`}>
                        {item}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>

              <div className={`h-px w-full bg-gray-100 ${darkClass("dark:bg-gray-700")} my-8`} />

              {/* 04 & 05 */}
              <div className="grid md:grid-cols-2 gap-12">
                <section>
                  <h2 className={`text-xl font-bold text-gray-900 ${darkClass("dark:text-white")} mb-4 flex items-center gap-2`}>
                    <span className="text-primary/40 text-sm font-black tracking-widest uppercase">
                      04.
                    </span>
                    Data Sharing
                  </h2>
                  <p className={`text-gray-600 ${darkClass("dark:text-gray-300")} leading-relaxed`}>
                    We do not sell your personal data. We may share information with third-party vendors, service providers, contractors, or agents who perform services for us or on our behalf and require access to such information to do that work. We may also disclose your information where required to do so by law or subpoena.
                  </p>
                </section>

                <section>
                  <h2 className={`text-xl font-bold text-gray-900 ${darkClass("dark:text-white")} mb-4 flex items-center gap-2`}>
                    <span className="text-primary/40 text-sm font-black tracking-widest uppercase">
                      05.
                    </span>
                    Data Security
                  </h2>
                  <p className={`text-gray-600 ${darkClass("dark:text-gray-300")} leading-relaxed`}>
                    We use administrative, technical, and physical security measures to help protect your personal information. This includes TLS/SSL encryption for data in transit and <span class={`text-gray-900 ${darkClass("dark:text-white")} font-semibold`}>AES-256 encryption</span> for data at rest. While we have taken reasonable steps to secure the personal information you provide to us, please be aware that no security measures are perfect or impenetrable.
                  </p>
                </section>
              </div>

              {/* 06 User Rights */}
              <section>
                <h2 className={`text-xl font-bold text-gray-900 ${darkClass("dark:text-white")} mb-4 flex items-center gap-2`}>
                  <span className="text-primary/40 text-sm font-black tracking-widest uppercase">
                    06.
                  </span>
                  User Rights
                </h2>
                <p className={`text-gray-600 ${darkClass("dark:text-gray-300")} leading-relaxed mb-4`}>
                  Depending on your location, you may have the following rights regarding your personal data:
                </p>

                <div className="flex flex-wrap gap-3">
                  {[
                    "Access",
                    "Correction",
                    "Deletion",
                    "Portability",
                    "Restriction of Processing",
                  ].map((right, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary ring-1 ring-inset ring-primary/20"
                    >
                      {right}
                    </span>
                  ))}
                  <p className={`text-gray-600 ${darkClass("dark:text-gray-300")} leading-relaxed mb-4`}>To exercise these rights, please contact us using the information provided below. We will respond to your request within a reasonable timeframe.</p>
                </div>
              </section>

              {/* 07 Updates */}
              <section>
                <h2 className={`text-xl font-bold text-gray-900 ${darkClass("dark:text-white")} mb-4 flex items-center gap-2`}>
                  <span className="text-primary/40 text-sm font-black tracking-widest uppercase">
                    07.
                  </span>
                  Updates to This Policy
                </h2>
                <p className={`text-gray-600 ${darkClass("dark:text-gray-300")} leading-relaxed`}>
                  We may update this privacy policy from time to time in order to reflect, for example, changes to our practices or for other operational, legal, or regulatory reasons. We will notify you of any material changes by posting the new Privacy Policy on this page and updating the "Last Updated" date.
                </p>
              </section>

              {/* Contact */}
              <div className={`bg-gray-50 ${darkClass("dark:bg-gray-900/50")} border border-gray-200 ${darkClass("dark:border-gray-700")} rounded-xl p-8 mt-8`}>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div>
                    <h3 className={`text-lg font-bold text-gray-900 ${darkClass("dark:text-white")} mb-2`}>
                      Have questions about your privacy?
                    </h3>
                    <p className={`text-gray-600 ${darkClass("dark:text-gray-400")} text-sm`}>
                      Our Data Protection Officer is available to assist you.
                    </p>
                  </div>

                  <a
                    href="mailto:privacy@webpilot.ai"
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-white hover:bg-primary/90 transition"
                  >
                    <span className="material-symbols-rounded text-[20px]">
                      mail
                    </span>
                    Contact Privacy Team
                  </a>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className={`px-8 py-6 bg-gray-50 ${darkClass("dark:bg-gray-900/30")} border-t border-gray-100 ${darkClass("dark:border-gray-700")}`}>
              <p className={`text-xs text-gray-400 ${darkClass("dark:text-gray-500")} text-center`}>
                © 2025 WebPilot Automation Inc. All rights reserved. This document is
                for informational purposes only.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}