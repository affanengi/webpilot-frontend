import { useState, useRef } from "react";

export default function FileAttachment({
    label = "Attachment (Optional)",
    maxFiles = 5,
    maxSizeMB = 10,
    accept = "*"
}) {
    const [files, setFiles] = useState([]);
    const [error, setError] = useState(null);
    const fileInputRef = useRef(null);

    const handleFileChange = (e) => {
        setError(null);
        const selectedFiles = Array.from(e.target.files || []);

        // Validate Max Files
        if (files.length + selectedFiles.length > maxFiles) {
            setError(`You can only upload a maximum of ${maxFiles} files.`);
            return;
        }

        const validFiles = [];
        for (const file of selectedFiles) {
            // Validate Size
            if (file.size > maxSizeMB * 1024 * 1024) {
                setError(`File "${file.name}" exceeds the ${maxSizeMB}MB limit.`);
                return;
            }
            validFiles.push(file);
        }

        setFiles((prev) => [...prev, ...validFiles]);

        // Reset input so same file can be selected again if needed
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const removeFile = (indexToRemove) => {
        setFiles((prev) => prev.filter((_, index) => index !== indexToRemove));
        setError(null);
    };

    return (
        <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {label}
            </label>

            <div className="flex items-center gap-3">
                <input
                    type="file"
                    multiple
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                    accept={accept}
                />

                <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2.5 rounded-lg bg-primary/10 text-primary text-sm font-semibold hover:bg-primary/20 transition-colors cursor-pointer shrink-0"
                >
                    Choose Files
                </button>

                <div className="flex-grow min-w-0">
                    {files.length === 0 ? (
                        <span className="text-sm text-gray-500 cursor-default select-none block truncate">
                            No file selected
                        </span>
                    ) : (
                        <div className="text-sm text-gray-900 dark:text-gray-100 flex flex-wrap gap-2">
                            {files.length} file{files.length !== 1 && 's'} selected
                        </div>
                    )}
                </div>
            </div>

            {/* Error Message */}
            {error && (
                <p className="mt-2 text-xs text-red-500 font-medium">
                    {error}
                </p>
            )}

            {/* File List */}
            {files.length > 0 && (
                <div className="mt-3 space-y-2">
                    {files.map((file, index) => (
                        <div
                            key={`${file.name}-${index}`}
                            className="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800"
                        >
                            <span className="text-sm text-gray-700 dark:text-gray-300 truncate max-w-[200px] sm:max-w-xs cursor-default">
                                {file.name} <span className="text-gray-400 text-xs">({(file.size / 1024).toFixed(0)}KB)</span>
                            </span>
                            <button
                                type="button"
                                onClick={() => removeFile(index)}
                                className="text-gray-400 hover:text-red-500 transition-colors p-1"
                                aria-label="Remove file"
                            >
                                <span className="material-symbols-rounded text-lg leading-none">close</span>
                            </button>
                        </div>
                    ))}
                </div>
            )}

            <p className="mt-2 text-xs text-gray-400 dark:text-gray-500">
                Max {maxFiles} files, {maxSizeMB}MB each.
            </p>
        </div>
    );
}
