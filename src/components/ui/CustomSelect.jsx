import { useState, useRef, useEffect } from "react";

export default function CustomSelect({ options, value, onChange, placeholder = "Select option" }) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div className="relative" ref={containerRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="
                  w-full h-11 px-4 rounded-lg border 
                  bg-gray-50 dark:bg-gray-900 
                  border-gray-200 dark:border-gray-700
                  text-gray-900 dark:text-white 
                  flex items-center justify-between 
                  transition-all
                  focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary
                "
                type="button"
            >
                <span className={`text-sm font-medium ${!value ? 'text-gray-400' : ''}`}>
                    {value || placeholder}
                </span>
                <span className="material-symbols-rounded text-gray-500 text-[20px]">
                    expand_more
                </span>
            </button>

            {isOpen && (
                <div className="absolute z-50 w-full mt-1 bg-white dark:bg-[#1e293b] border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                    <div className="p-1">
                        {options.map((opt) => (
                            <button
                                key={opt}
                                onClick={() => {
                                    onChange(opt);
                                    setIsOpen(false);
                                }}
                                className="w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 transition-colors"
                                type="button"
                            >
                                {opt}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
