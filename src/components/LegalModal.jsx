import { useEffect, cloneElement } from "react";

export default function LegalModal({ onClose, children, themeMode = "auto" }) {
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handleEsc);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = "auto";
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal container — NO CARD STYLES */}
      <div className="relative z-10 w-full max-w-5xl mx-4 max-h-[90vh]">

        {/* Close button floating above policy card */}

        {/* Content ONLY (policy card handles layout & scroll) */}
        {cloneElement(children, { themeMode })}
      </div>
    </div>
  );
}
