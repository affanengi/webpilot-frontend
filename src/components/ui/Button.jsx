import React from "react";
import { Link } from "react-router-dom";

export default function Button({
    children,
    onClick,
    to,
    variant = "primary", // primary, secondary, outline, ghost
    className = "",
    type = "button",
    ...props
}) {
    const baseStyles =
        "inline-flex items-center justify-center gap-2 px-6 py-3 font-semibold rounded-xl transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:pointer-events-none select-none";

    const variants = {
        primary:
            "bg-primary text-white hover:bg-primary-hover shadow-lg shadow-primary/30 hover:shadow-xl hover:scale-[1.02]",
        secondary:
            "bg-white text-text-primary-light border border-border-light hover:bg-gray-50 shadow-sm hover:shadow-md dark:bg-surface-dark dark:border-border-dark dark:text-text-primary-dark dark:hover:bg-white/5",
        outline:
            "bg-transparent border border-border-light text-text-secondary-light hover:border-gray-400 hover:bg-gray-50 dark:border-border-dark dark:text-text-secondary-dark dark:hover:bg-white/5 dark:hover:text-text-primary-dark",
        ghost:
            "bg-transparent text-text-secondary-light hover:bg-gray-100 dark:text-text-secondary-dark dark:hover:bg-white/5 dark:hover:text-text-primary-dark",
        danger:
            "bg-red-50 text-error hover:bg-red-100 border border-red-100 dark:bg-red-900/10 dark:text-red-400 dark:border-red-900/20"
    };

    const combinedClasses = `${baseStyles} ${variants[variant] || variants.primary
        } ${className}`;

    if (to) {
        return (
            <Link to={to} className={combinedClasses} {...props}>
                {children}
            </Link>
        );
    }

    return (
        <button type={type} className={combinedClasses} onClick={onClick} {...props}>
            {children}
        </button>
    );
}
