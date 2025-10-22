import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Trash2, Copy, Settings, GripVertical } from "lucide-react";
import { EmailBlock } from "../types/email";
import BlockRenderer from "./BlockRenderer";

interface SortableBlockProps {
    block: EmailBlock;
    isSelected: boolean;
    onSelect: () => void;
    onUpdate: (blockId: string, updates: Partial<EmailBlock>) => void;
    onDelete: (blockId: string) => void;
    onDuplicate: (blockId: string) => void;
    onImageClick: (blockId: string, path?: string) => void;
}

const SortableBlock: React.FC<SortableBlockProps> = ({ block, isSelected, onSelect, onUpdate, onDelete, onDuplicate, onImageClick }) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: block.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    const handleBlockClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        onSelect();
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`
        relative group transition-all duration-200 border-2 border-transparent
        ${isDragging ? "opacity-50 z-50" : ""}
        ${isSelected ? "border-blue-400" : "hover:border-gray-300"}
      `}
            onClick={handleBlockClick}
        >
            {/* Block Controls */}
            <div
                className={`
        absolute top-2 right-2 z-20 flex space-x-1 transition-opacity duration-200
        ${isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100"}
      `}
            >
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onSelect();
                    }}
                    className="p-1.5 bg-blue-600 text-white rounded-md shadow-lg hover:bg-blue-700 transition-colors"
                    title="Edit properties"
                >
                    <Settings className="w-3 h-3" />
                </button>
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onDuplicate(block.id);
                    }}
                    className="p-1.5 bg-green-600 text-white rounded-md shadow-lg hover:bg-green-700 transition-colors"
                    title="Duplicate block"
                >
                    <Copy className="w-3 h-3" />
                </button>
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onDelete(block.id);
                    }}
                    className="p-1.5 bg-red-600 text-white rounded-md shadow-lg hover:bg-red-700 transition-colors"
                    title="Delete block"
                >
                    <Trash2 className="w-3 h-3" />
                </button>
            </div>

            {/* Drag Handle */}
            <div
                {...attributes}
                {...listeners}
                className={`
          absolute left-0 top-0 bottom-0 w-6 flex items-center justify-center transition-all duration-200 cursor-grab active:cursor-grabbing
          ${isSelected ? "bg-blue-400" : "bg-transparent group-hover:bg-blue-300"}
        `}
                title="Drag to reorder"
            >
                <GripVertical className="w-4 h-4 text-white opacity-70" />
            </div>

            {/* Selection Indicator */}
            {isSelected && (
                <div className="absolute top-0 left-6 bg-blue-600 text-white text-xs px-2 py-1 rounded-br-md font-medium z-10">{block.type.charAt(0).toUpperCase() + block.type.slice(1)} Block</div>
            )}

            {/* Block Content */}
            <div className="relative ml-6">
                <BlockRenderer block={block} isSelected={isSelected} updateBlock={onUpdate} onImageClick={onImageClick} />
            </div>
        </div>
    );
};

export default SortableBlock;
