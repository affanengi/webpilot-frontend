export default function TermsOfService({ themeMode = "auto" }) {
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
                  Terms of Service
                </h1>

                <p className={`text-base text-gray-500 ${darkClass("dark:text-gray-400")} font-medium`}>
                  Last Updated: October 24, 2023
                </p>
              </div>
            </div>

            {/* Content */}
            <div className={`px-8 py-8 md:px-12 md:py-12 space-y-10 bg-white ${darkClass("dark:bg-gray-800")}`}>

              {/* 01 */}
              <section>
                <h2 className={`text-xl font-bold text-gray-900 ${darkClass("dark:text-white")} mb-4 flex items-center gap-2`}>
                  <span className="text-primary/40 text-sm font-black tracking-widest uppercase">
                    01.
                  </span>
                  Acceptance of Terms
                </h2>
                <p className={`text-gray-600 ${darkClass("dark:text-gray-300")} leading-relaxed`}>
                  By accessing or using the WebPilot Automation platform, website, and related services (collectively, the "Service"), you agree to be bound by these Terms of Service. If you are entering into this agreement on behalf of a company or other legal entity, you represent that you have the authority to bind such entity to these terms. If you do not agree to these terms, you must not use the Service.
                </p>
              </section>

              {/* 02 */}
              <section>
                <h2 className={`text-xl font-bold text-gray-900 ${darkClass("dark:text-white")} mb-4 flex items-center gap-2`}>
                  <span className="text-primary/40 text-sm font-black tracking-widest uppercase">
                    02.
                  </span>
                  Description of Service
                </h2>
                <p className={`text-gray-600 ${darkClass("dark:text-gray-300")} leading-relaxed`}>
                  WebPilot Automation provides a cloud-based platform for creating, managing, and executing automation workflows. We reserve the right to modify, suspend, or discontinue the Service at any time, with or without notice. We may also impose limits on certain features or restrict your access to parts or all of the Service without notice or liability.
                </p>
              </section>

              {/* 03 */}
              <section>
                <h2 className={`text-xl font-bold text-gray-900 ${darkClass("dark:text-white")} mb-4 flex items-center gap-2`}>
                  <span className="text-primary/40 text-sm font-black tracking-widest uppercase">
                    03.
                  </span>
                  User Responsibilities
                </h2>
                <p className={`text-gray-600 ${darkClass("dark:text-gray-300")} leading-relaxed`}>
                  You are solely responsible for your use of the Service and for any data, content, or workflows you create or process using the platform. You agree to use the Service in compliance with all applicable laws and regulations. You shall not use the Service to transmit any material that is defamatory, offensive, or otherwise objectionable.
                </p>
              </section>

              {/* 04 */}
              <section>
                <h2 className={`text-xl font-bold text-gray-900 ${darkClass("dark:text-white")} mb-4 flex items-center gap-2`}>
                  <span className="text-primary/40 text-sm font-black tracking-widest uppercase">
                    04.
                  </span>
                  Account Security
                </h2>
                <p className={`text-gray-600 ${darkClass("dark:text-gray-300")} leading-relaxed`}>
                  You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You agree to notify us immediately of any unauthorized use of your account or any other breach of security. WebPilot Automation will not be liable for any loss or damage arising from your failure to comply with this section.
                </p>
              </section>

              {/* 05 */}
              <section>
                <h2 className={`text-xl font-bold text-gray-900 ${darkClass("dark:text-white")} mb-4 flex items-center gap-2`}>
                  <span className="text-primary/40 text-sm font-black tracking-widest uppercase">
                    05.
                  </span>
                  Prohibited Use
                </h2>

                <p className={`text-gray-600 ${darkClass("dark:text-gray-300")} leading-relaxed mb-4`}>
                  You agree not to use the Service for any unlawful or prohibited activities, including but not limited to:
                </p>

                <ul className={`list-disc pl-5 space-y-2 text-gray-600 ${darkClass("dark:text-gray-300")} marker:text-gray-400`}>
                  <li>Reverse engineering, decompiling, or disassembling the Service.</li>
                  <li>Using the Service to send unsolicited communications or spam.</li>
                  <li>Interfering with or disrupting the integrity or performance of the Service.</li>
                  <li>Attempting to gain unauthorized access to the Service or related systems.</li>
                </ul>
              </section>

              {/* 06 */}
              <section>
                <h2 className={`text-xl font-bold text-gray-900 ${darkClass("dark:text-white")} mb-4 flex items-center gap-2`}>
                  <span className="text-primary/40 text-sm font-black tracking-widest uppercase">
                    06.
                  </span>
                  Service Availability
                </h2>
                <p className={`text-gray-600 ${darkClass("dark:text-gray-300")} leading-relaxed`}>
                  While we strive to provide reliable service, we do not guarantee that the Service will be available at all times. Downtime may occur due to maintenance, updates, or technical issues. We are not liable for any delays, delivery failures, or other damages resulting from such unavailability.
                </p>
              </section>

              {/* 07 */}
              <section>
                <h2 className={`text-xl font-bold text-gray-900 ${darkClass("dark:text-white")} mb-4 flex items-center gap-2`}>
                  <span className="text-primary/40 text-sm font-black tracking-widest uppercase">
                    07.
                  </span>
                  Limitation of Liability
                </h2>
                <p className={`text-gray-600 ${darkClass("dark:text-gray-300")} leading-relaxed`}>
                  To the maximum extent permitted by law, WebPilot Automation shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits or revenues, whether incurred directly or indirectly, or any loss of data, use, goodwill, or other intangible losses, resulting from your access to or use of or inability to access or use the Service.
                </p>
              </section>

              {/* 08 */}
              <section>
                <h2 className={`text-xl font-bold text-gray-900 ${darkClass("dark:text-white")} mb-4 flex items-center gap-2`}>
                  <span className="text-primary/40 text-sm font-black tracking-widest uppercase">
                    08.
                  </span>
                  Termination
                </h2>
                <p className={`text-gray-600 ${darkClass("dark:text-gray-300")} leading-relaxed`}>
                  We may terminate or suspend your account and access to the Service immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms. Upon termination, your right to use the Service will immediately cease.
                </p>
              </section>

              {/* 09 */}
              <section>
                <h2 className={`text-xl font-bold text-gray-900 ${darkClass("dark:text-white")} mb-4 flex items-center gap-2`}>
                  <span className="text-primary/40 text-sm font-black tracking-widest uppercase">
                    09.
                  </span>
                  Governing Law
                </h2>
                <p className={`text-gray-600 ${darkClass("dark:text-gray-300")} leading-relaxed`}>
                  These Terms shall be governed and construed in accordance with the laws of the jurisdiction in which WebPilot Automation is established, without regard to its conflict of law provisions. Our failure to enforce any right or provision of these Terms will not be considered a waiver of those rights.
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