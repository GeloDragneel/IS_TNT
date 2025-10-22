import React from "react";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { EmailBlock } from "../types/email";
import SortableBlock from "./SortableBlock";
import { useLanguage } from "@/context/LanguageContext";
interface CanvasProps {
    blocks: EmailBlock[];
    selectedBlock: EmailBlock | null;
    setSelectedBlock: (block: EmailBlock | null) => void;
    updateBlock: (blockId: string, updates: Partial<EmailBlock>) => void;
    deleteBlock: (blockId: string) => void;
    duplicateBlock: (blockId: string) => void;
    previewMode: "desktop" | "mobile";
    onBlockSelect: (block: EmailBlock) => void;
    onImageClick: (blockId: string, path?: string) => void;
    darkMode?: boolean;
}

const Canvas: React.FC<CanvasProps> = ({ blocks, selectedBlock, setSelectedBlock, updateBlock, deleteBlock, duplicateBlock, previewMode, onBlockSelect, onImageClick, darkMode = false }) => {
    const canvasWidth = previewMode === "desktop" ? "600px" : "375px";
    const { translations, lang } = useLanguage();
    const { setNodeRef, isOver } = useDroppable({
        id: "canvas",
    });

    const handleCanvasClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        setSelectedBlock(null);
    };

    return (
        <div className="flex-1 bg-gray-100 p-4 overflow-y-auto" style={{ backgroundColor: darkMode ? "#2a2a2f" : undefined }} onClick={handleCanvasClick}>
            <div className="flex justify-center">
                <div
                    ref={setNodeRef}
                    className={`
            bg-white shadow-lg rounded-lg transition-all duration-300 border mx-auto mb-8
            ${isOver ? "border-blue-400 border-dashed " : "border-gray-200"}
          `}
                    style={{
                        backgroundColor: darkMode ? "#19191c" : undefined,
                        borderColor: darkMode ? (isOver ? "#3b82f6" : "#35353b") : undefined,
                        width: canvasWidth,
                        minHeight: "600px",
                        maxWidth: "100%",
                    }}
                >
                    {blocks.length === 0 ? (
                        <div className="flex items-center justify-center h-96 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg m-8">
                            <div className="text-center">
                                <div className="text-6xl mb-4">📧</div>
                                <h3 className="text-xl font-semibold text-gray-100 mb-2">{translations["Start Building Your Email"] || "Start Building Your Email"}</h3>
                                <p className="text-gray-500 mb-4" style={{ color: darkMode ? "#9ca3af" : undefined }}>
                                    {translations["Click content blocks from the sidebar to get started"] || "Click content blocks from the sidebar to get started"}
                                </p>
                                <div className="mt-4 text-sm text-gray-400 dark:text-gray-500">
                                    <p>• {translations["Click blocks to add them"] || "Click blocks to add them"}</p>
                                    <p>• {translations["Drag blocks to reorder them"] || "Drag blocks to reorder them"}</p>
                                    <p>• {translations["Customize styles and content"] || "Customize styles and content"}</p>
                                    <p>• {translations["Export as HTML when ready"] || "Export as HTML when ready"}</p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <SortableContext items={blocks.map((b) => b.id)} strategy={verticalListSortingStrategy}>
                            <div className="pb-8">
                                {blocks.map((block) => (
                                    <SortableBlock
                                        key={block.id}
                                        block={block}
                                        isSelected={selectedBlock?.id === block.id}
                                        onSelect={() => {
                                            setSelectedBlock(block);
                                            onBlockSelect(block);
                                        }}
                                        onUpdate={updateBlock}
                                        onDelete={deleteBlock}
                                        onDuplicate={duplicateBlock}
                                        onImageClick={onImageClick}
                                    />
                                ))}
                            </div>
                        </SortableContext>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Canvas;
