/**
 * Generates initials from a full name.
 * 
 * Logic:
 * - Takes first letter of first name + first letter of second name.
 * - If only one name, takes first two letters of that name.
 * - Trims spaces, handles multiple spaces, ensures uppercase.
 * 
 * @param {string} name - The full name to parse
 * @returns {string} Two-character initials (APP)
 */
export const getInitials = (name) => {
    if (!name) return "??";

    // Clean the input: remove extra spaces
    const cleaned = name.trim();
    if (!cleaned) return "??";

    const parts = cleaned.split(/\s+/);

    if (parts.length > 1) {
        // Has at least two parts: "Mohammad Affan" -> "MA"
        return (parts[0][0] + parts[1][0]).toUpperCase();
    }

    // Only one part: "Mohammad" -> "MO"
    return parts[0].slice(0, 2).toUpperCase();
};
