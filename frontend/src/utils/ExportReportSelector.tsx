// src/utils/ExportReportSelector.tsx

import { useState, useImperativeHandle, forwardRef, ForwardRefRenderFunction } from "react";
import { submitForm } from "./submitForm";
import { useLanguage } from "@/context/LanguageContext";

type ExportReportSelectorProps = {
    formats: string[];
    baseName: string;
    ids: (number | string)[];
    language: string;
};

export type ExportReportSelectorRef = {
    triggerExport: () => void;
};

const formatLabels: Record<string, string> = {
    odt: "OpenOffice Writer Document (.odt)",
    ods: "OpenOffice Calc Spreadsheet (.ods)",
    xlsx: "Ms Excel Spreadsheet (.xlsx)",
};

const ExportReportSelectorComponent: ForwardRefRenderFunction<ExportReportSelectorRef, ExportReportSelectorProps> = ({ formats, baseName, ids, language }, ref) => {
    const [selectedFormat, setSelectedFormat] = useState<string>(formats[0]);
    const { translations } = useLanguage();

    const handleSubmit = () => {
        submitForm(`${import.meta.env.VITE_API_BASE_URL}/export-report`, {
            format: selectedFormat,
            name: baseName,
            ids: ids.join(","),
            language,
        });
    };

    // Expose `triggerExport` method to parent
    useImperativeHandle(ref, () => ({
        triggerExport: () => handleSubmit(),
    }));

    return (
        <>
            <select
                name="format"
                value={selectedFormat}
                onChange={(e) => setSelectedFormat(e.target.value)}
                className="px-3 py-2 border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-sm my-important-dropdown"
                style={{ backgroundColor: "#2d2d30", borderColor: "#2d2d30" }}
            >
                {formats.map((fmt) => (
                    <option key={fmt} value={fmt}>
                        {translations[formatLabels[fmt]] || formatLabels[fmt]}
                    </option>
                ))}
            </select>

            <button onClick={handleSubmit} className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors flex items-center space-x-1 text-sm">
                <span>{translations["MCGenerate"]}</span>
            </button>
        </>
    );
};

// Export the component wrapped in `forwardRef`
export const ExportReportSelector = forwardRef(ExportReportSelectorComponent);
