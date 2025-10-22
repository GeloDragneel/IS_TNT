import React from "react";
import { Monitor, Smartphone, Download, Eye, Settings, Undo2, Redo2, Save, FileText, Moon, Sun, Image as ImageIcon } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
interface ToolbarProps {
    previewMode: "desktop" | "mobile";
    setPreviewMode: (mode: "desktop" | "mobile") => void;
    onExport: () => void;
    onExportJSON?: (type: string) => void; // <-- Accepts string parameter now
    isOpen: () => void;
    showPropertiesPanel: boolean;
    setShowPropertiesPanel: (show: boolean) => void;
    blocksCount: number;
    onTemplateId: number;
    title: string;
    onPopupType: string;
    darkMode: boolean;
    setDarkMode: (dark: boolean) => void;
    showImageLibrary: boolean;
    setShowImageLibrary: (show: boolean) => void;
}

const Toolbar: React.FC<ToolbarProps> = ({
    previewMode,
    setPreviewMode,
    onTemplateId,
    onExport,
    isOpen,
    onExportJSON,
    onPopupType,
    showPropertiesPanel,
    setShowPropertiesPanel,
    blocksCount,
    title,
    darkMode,
    showImageLibrary,
    setShowImageLibrary,
}) => {
    const { translations, lang } = useLanguage();
    const handlePreview = () => {
        // In a real app, this would open a preview modal or new window
        alert("Preview functionality would open your email in a new window");
    };

    const handleSave = () => {
        // In a real app, this would save to a backend
        alert("Template saved successfully!");
    };

    return (
        <div className="bg-white border-b border-gray-200 px-6 py-4 shadow-sm" style={{ backgroundColor: darkMode ? "#1f1f23" : undefined, borderColor: darkMode ? "#35353b" : undefined }}>
            <div className="flex items-center justify-between">
                {/* Left Section */}
                <div className="flex items-center space-x-4">
                    {/* Preview Mode Toggle */}
                    <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                        <button
                            onClick={() => setPreviewMode("desktop")}
                            className={`
                flex items-center space-x-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200
                ${
                    previewMode === "desktop"
                        ? "bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm"
                        : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white dark:hover:bg-gray-600"
                }
              `}
                        >
                            <Monitor className="w-4 h-4" />
                            <span>Desktop</span>
                        </button>
                        <button
                            onClick={() => setPreviewMode("mobile")}
                            className={`
                flex items-center space-x-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200
                ${
                    previewMode === "mobile"
                        ? "bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm"
                        : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white dark:hover:bg-gray-600"
                }
              `}
                        >
                            <Smartphone className="w-4 h-4" />
                            <span>Mobile</span>
                        </button>
                    </div>
                </div>

                {/* Center Section */}
                <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-2">
                        <FileText className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                        <span className="text-sm text-gray-600 dark:text-gray-300">{title}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-400 dark:bg-green-500 rounded-full animate-pulse" title="Auto-saved" />
                        <span className="text-xs text-gray-500 dark:text-gray-400">{blocksCount} blocks</span>
                    </div>
                </div>

                {/* Right Section */}
                <div className="flex items-center space-x-2">
                    <button onClick={isOpen} className="px-2 py-2 bg-gray-700 hover:bg-gray-600 rounded text-white transition focus:outline-none focus:ring-2 focus:ring-cyan-500">
                        {translations["Close"]}
                    </button>
                    {(onPopupType === "New" || onPopupType === "Template") && (
                        <button
                            onClick={() => onExportJSON && onExportJSON("template")}
                            disabled={blocksCount === 0}
                            className="px-2 py-2 bg-cyan-600 hover:bg-cyan-500 rounded text-white transition focus:outline-none focus:ring-2 focus:ring-cyan-500"
                        >
                            {translations["Save as template"]}
                        </button>
                    )}
                    {onPopupType != "Template" && (
                        <button
                            onClick={() => onExportJSON && onExportJSON("continue")}
                            disabled={blocksCount === 0}
                            className="px-2 py-2 bg-cyan-600 hover:bg-cyan-500 rounded text-white transition focus:outline-none focus:ring-2 focus:ring-cyan-500"
                        >
                            {translations["Continue"]}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Toolbar;
