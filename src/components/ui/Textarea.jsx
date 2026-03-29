
export default function Textarea({ className = "", error, ...props }) {
    return (
        <div className="relative">
            <textarea
                className={`
          w-full rounded-lg border bg-gray-50 dark:bg-black/20 text-gray-900 dark:text-white 
          placeholder-gray-400 dark:placeholder-gray-500 text-sm font-medium transition-all
          focus:outline-none focus:ring-2 focus:ring-primary/20 p-4 resize-none
          disabled:opacity-60 disabled:cursor-not-allowed
          ${error
                        ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                        : "border-border-light dark:border-border-dark hover:border-gray-300 dark:hover:border-zinc-700 focus:border-primary"
                    }
          ${className}
        `}
                {...props}
            />
            {error && (
                <p className="mt-1 text-xs text-red-500">{error}</p>
            )}
        </div>
    );
}
