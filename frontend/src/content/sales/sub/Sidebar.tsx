import React from "react";
import { Image, Minus, Share2, Mail, Palette, FileText, Grid3x3 as Grid3X3, CreditCard, Image as ImageIcon, Play, Building } from "lucide-react";
import { BlockType } from "../types/email";

const blocks = [
    { type: "boxed-text", label: "Boxed Text", icon: FileText, description: "Text with border" },
    { type: "divider", label: "Divider", icon: Minus, description: "Separator line" },
    { type: "image", label: "Image", icon: Image, description: "Add single image" },
    { type: "image-group", label: "Image Group", icon: Grid3X3, description: "Multiple images" },
    { type: "image-card", label: "Image Card", icon: CreditCard, description: "Image with text card" },
    { type: "image-text", label: "Image + Text", icon: ImageIcon, description: "Side by side layout" },
    { type: "social", label: "Social Follow", icon: Share2, description: "Social media links" },
    { type: "footer", label: "Footer", icon: Building, description: "Email footer" },
    { type: "video", label: "Video", icon: Play, description: "Video thumbnail" },
];

interface DraggableBlockProps {
    block: (typeof blocks)[0];
    onAdd: (type: BlockType) => void;
}

const DraggableBlock: React.FC<DraggableBlockProps> = ({ block, onAdd }) => {
    const handleClick = () => {
        onAdd(block.type as BlockType);
    };

    return (
        <div
            onClick={handleClick}
            className={`
        p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 cursor-pointer select-none
        transition-all duration-200 dark:hover:bg-blue-900/20 hover:border-blue-300 dark:hover:border-blue-500 hover:shadow-md
        active:scale-95 active:bg-blue-100 dark:active:bg-blue-900/30
      `}
            title={`Click to add ${block.label}`}
        >
            <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                    <block.icon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                </div>
                <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white">{block.label}</h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{block.description}</p>
                </div>
            </div>
        </div>
    );
};

interface SidebarProps {
    onAddBlock: (type: BlockType) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ onAddBlock }) => {
    return (
        <div className="w-80 bg-white border-r border-gray-200 dark:bg-gray-800 dark:border-gray-600 flex flex-col">
            <div className="p-4 border-b border-gray-600">
                <div className="flex items-center space-x-2">
                    <Mail className="w-6 h-6 text-blue-600" />
                    <h1 className="text-xl font-bold text-gray-900 dark:text-white">Email Builder</h1>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Click blocks to add to your email</p>
            </div>

            <div className="flex-1 overflow-y-auto">
                <div className="p-4 space-y-2">
                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center">
                        <Palette className="w-4 h-4 mr-2" />
                        Content Blocks
                    </h3>

                    {blocks.map((block) => (
                        <DraggableBlock key={block.type} block={block} onAdd={onAddBlock} />
                    ))}
                </div>
            </div>

            <div className="p-4 border-t border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700">
                <p className="text-xs text-gray-500 dark:text-gray-400 text-center">Built with React & Tailwind CSS</p>
            </div>
        </div>
    );
};

export default Sidebar;
