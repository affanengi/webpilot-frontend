
export default function Input({ icon, className = "", error, children, ...props }) {
    return (
        <div className="relative">
            {icon && (
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-[20px]">
                    {icon}
                </span>
            )}
            <input
                className={`
          w-full h-11 rounded-xl border bg-gray-50 dark:bg-black/20 text-text-primary-light dark:text-text-primary-dark 
          placeholder-gray-400 dark:placeholder-gray-500 text-sm font-medium transition-all duration-200
          focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary
          disabled:opacity-60 disabled:cursor-not-allowed
          ${icon ? "pl-10 pr-4" : "px-4"}
          ${error
                        ? "border-error focus:border-error focus:ring-error/20"
                        : "border-border-light dark:border-border-dark hover:border-gray-300 dark:hover:border-zinc-700"
                    }
          ${className}
        `}
                {...props}
            />
            {error && (
                <p className="mt-1 text-xs text-error">{error}</p>
            )}
            {children}
        </div>
    );
}
