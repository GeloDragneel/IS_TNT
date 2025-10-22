import React from "react";

export const highlightMatch = (text: string = "", query: string): React.ReactNode => {
    const safeQuery = String(query || "").toLowerCase(); // Normalize query
    if (!safeQuery) return text || "";

    const escapeRegExp = (str: string) => String(str).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`(${escapeRegExp(safeQuery)})`, "gi");
    const parts = (text || "").split(regex);

    return parts.map((part, i) =>
        part.toLowerCase() === safeQuery ? (
            <span key={i} className="bg-yellow-300 text-black rounded-sm px-1">
                {part}
            </span>
        ) : (
            part
        )
    );
};
