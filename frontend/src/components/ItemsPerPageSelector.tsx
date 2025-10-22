// src/components/ItemsPerPageSelector.tsx

import React from "react";

interface Props {
    value: number;
    onChange: (value: number) => void; // ← this must be typed correctly
    options?: number[];
}

const ItemsPerPageSelector: React.FC<Props> = ({ value, onChange, options = [15, 50, 999] }) => {
    return (
        <select
            value={value}
            onChange={(e) => onChange(Number(e.target.value))}
            className="px-2 py-2 border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-sm my-important-dropdown"
            style={{ backgroundColor: "#2d2d30", borderColor: "#2d2d30" }}
        >
            {options.map((opt) => (
                <option key={opt} value={opt}>
                    {opt === -1 ? "All" : opt}
                </option>
            ))}
        </select>
    );
};

export default ItemsPerPageSelector;
