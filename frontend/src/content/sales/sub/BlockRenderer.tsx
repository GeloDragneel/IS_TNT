import React, { useState, useRef, useEffect } from "react";
import { EmailBlock } from "../types/email";
import { Play, Upload } from "lucide-react";

interface BlockRendererProps {
    block: EmailBlock;
    isSelected: boolean;
    updateBlock: (blockId: string, updates: Partial<EmailBlock>) => void;
    onImageClick: (blockId: string, path?: string) => void;
}

const BlockRenderer: React.FC<BlockRendererProps> = ({ block, isSelected, updateBlock, onImageClick }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editingColumn, setEditingColumn] = useState<number | null>(null);
    const [dragOver, setDragOver] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        if (isEditing && textareaRef.current) {
            textareaRef.current.focus();
            textareaRef.current.select();
        }
    }, [isEditing]);

    const handleContentChange = (newContent: any) => {
        updateBlock(block.id, { content: { ...block.content, ...newContent } });
    };

    const handleImageUpload = (file: File) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const result = e.target?.result as string;
            updateBlock(block.id, {
                content: { ...block.content, src: result },
            });
        };
        reader.readAsDataURL(file);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(false);

        const files = Array.from(e.dataTransfer.files);
        const imageFile = files.find((file) => file.type.startsWith("image/"));

        if (imageFile) {
            handleImageUpload(imageFile);
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(false);
    };

    const handleDoubleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (block.type === "text" || block.type === "boxed-text") {
            setIsEditing(true);
        }
    };

    const handleColumnDoubleClick = (e: React.MouseEvent, columnIndex: number) => {
        e.stopPropagation();
        setEditingColumn(columnIndex);
    };

    const handleTextSubmit = () => {
        setIsEditing(false);
    };

    const handleColumnSubmit = () => {
        setEditingColumn(null);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleTextSubmit();
        } else if (e.key === "Escape") {
            setIsEditing(false);
        }
    };

    const handleColumnKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleColumnSubmit();
        } else if (e.key === "Escape") {
            setEditingColumn(null);
        }
    };

    const getSocialIcon = (platform: string) => {
        const baseClass = "w-5 h-5"; // Tailwind classes for width/height
        const icons: Record<string, string> = {
            facebook: import.meta.env.VITE_BASE_URL + "/storage/products" + "/facebook.png",
            twitter: import.meta.env.VITE_BASE_URL + "/storage/products" + "/twitter.png",
            instagram: import.meta.env.VITE_BASE_URL + "/storage/products" + "/instagram.png",
            linkedin: import.meta.env.VITE_BASE_URL + "/storage/products" + "/linkedin.png",
            youtube: import.meta.env.VITE_BASE_URL + "/storage/products" + "/youtube.png",
            tiktok: import.meta.env.VITE_BASE_URL + "/storage/products" + "/tiktok.png",
        };

        const src = icons[platform.toLowerCase()];

        if (src) {
            return <img src={src} alt={`${platform} icon`} className={baseClass} />;
        }

        // fallback square gray block if icon not found
        return <div className={`${baseClass} bg-gray-400 rounded`} />;
    };

    const renderBlock = () => {
        switch (block.type) {
            case "text":
            case "boxed-text":
                return (
                    <div
                        style={{
                            padding: block.styles.padding,
                            fontSize: block.styles.fontSize,
                            color: block.styles.color,
                            textAlign: block.styles.textAlign as any,
                            lineHeight: block.styles.lineHeight,
                            margin: block.styles.margin,
                            backgroundColor: block.styles.backgroundColor,
                            border: block.styles.border,
                        }}
                        className="min-h-8 relative cursor-pointer"
                        onDoubleClick={handleDoubleClick}
                    >
                        {isEditing ? (
                            <textarea
                                ref={textareaRef}
                                value={block.content.text}
                                onChange={(e) => handleContentChange({ text: e.target.value })}
                                onBlur={handleTextSubmit}
                                onKeyDown={handleKeyDown}
                                className="w-full bg-transparent border-2 border-blue-400 rounded outline-none resize-none p-2"
                                style={{
                                    fontSize: block.styles.fontSize,
                                    color: block.styles.color,
                                    textAlign: block.styles.textAlign as any,
                                    lineHeight: block.styles.lineHeight,
                                    fontFamily: "inherit",
                                }}
                                rows={Math.max(3, block.content.text.split("\n").length)}
                            />
                        ) : (
                            <div
                                className={`transition-all duration-200 ${isSelected ? "" : ""}`}
                                style={{ minHeight: "1.5em", padding: "4px" }}
                                dangerouslySetInnerHTML={{ __html: block.content.text.replace(/\n/g, "<br>") }}
                            />
                        )}
                        {!isEditing && (
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-200 bg-black bg-opacity-10 rounded">
                                <span className="text-xs bg-gray-800 text-white px-2 py-1 rounded">Double-click to edit</span>
                            </div>
                        )}
                    </div>
                );

            case "image":
                return (
                    <div
                        style={{
                            padding: block.styles.padding,
                            textAlign: block.styles.textAlign as any,
                            margin: block.styles.margin,
                        }}
                        onDrop={handleDrop}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        className={`relative cursor-pointer ${dragOver ? "dark:bg-blue-900/20 border-2 border-dashed border-blue-400" : ""}`}
                        onClick={() => onImageClick(block.id)}
                    >
                        {dragOver && (
                            <div className="absolute inset-0 flex items-center justify-center bg-blue-100 dark:bg-blue-900 bg-opacity-95 z-10 border-2 border-dashed border-blue-400">
                                <div className="text-center">
                                    <Upload className="w-8 h-8 text-blue-600 dark:text-blue-400 mx-auto mb-2" />
                                    <p className="text-blue-700 dark:text-blue-300 font-semibold">Drop your image here</p>
                                    <p className="text-blue-600 dark:text-blue-400 text-sm">JPG, PNG, GIF supported</p>
                                </div>
                            </div>
                        )}

                        <div className="relative group">
                            <img
                                src={block.content.src}
                                alt={block.content.alt}
                                style={{
                                    width: block.content.width,
                                    height: "auto",
                                    maxWidth: "100%",
                                    display: "block",
                                    margin: "0 auto",
                                }}
                            />
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-black bg-opacity-40">
                                <div className="text-center">
                                    <span className="text-white font-semibold">Click to select image</span>
                                </div>
                            </div>
                        </div>
                    </div>
                );

            case "image-group":
                return (
                    <div
                        style={{
                            padding: block.styles.padding,
                            margin: block.styles.margin,
                        }}
                    >
                        <div className="grid grid-cols-2 gap-2">
                            {block.content.images.map((image: any, index: number) => (
                                <div key={index} className="relative cursor-pointer group" onClick={() => onImageClick(block.id, `images.${index}.src`)}>
                                    <img
                                        src={image.src}
                                        alt={image.alt}
                                        className="w-full h-auto shadow-sm hover:opacity-90 transition-opacity duration-200"
                                        onError={(e) => {
                                            const target = e.target as HTMLImageElement;
                                            target.src = "https://images.pexels.com/photos/3861969/pexels-photo-3861969.jpeg?auto=compress&cs=tinysrgb&w=300";
                                        }}
                                    />
                                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-black bg-opacity-40 rounded">
                                        <div className="text-center">
                                            <span className="text-xs text-white font-medium">Click to select</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                );

            case "image-card":
                return (
                    <div
                        style={{
                            padding: block.styles.padding,
                            margin: block.styles.margin,
                            textAlign: "center",
                        }}
                    >
                        <div className="bg-white overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200" style={{ maxWidth: block.styles.cardWidth || "100%", margin: "0 auto" }}>
                            <div className="relative cursor-pointer group" onClick={() => onImageClick(block.id, "image.src")}>
                                <img
                                    src={block.content.image.src}
                                    alt={block.content.image.alt}
                                    className="w-full object-cover block"
                                    style={{ width: "100%" }}
                                    onError={(e) => {
                                        const target = e.target as HTMLImageElement;
                                        target.src = "https://images.pexels.com/photos/3861969/pexels-photo-3861969.jpeg?auto=compress&cs=tinysrgb&w=600";
                                    }}
                                />
                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-black bg-opacity-40">
                                    <div className="text-center">
                                        <span className="text-xs text-white font-medium">Click to select</span>
                                    </div>
                                </div>
                            </div>
                            <div className="p-4 bg-gray-600">
                                <p className="text-white-400 text-sm">{block.content.description}</p>
                            </div>
                        </div>
                    </div>
                );

            case "image-text":
                return (
                    <div
                        style={{
                            padding: block.styles.padding,
                            margin: block.styles.margin,
                        }}
                    >
                        <div className="space-y-4">
                            <div className="relative cursor-pointer group" onClick={() => onImageClick(block.id, "image.src")}>
                                <img
                                    src={block.content.image.src}
                                    alt={block.content.image.alt}
                                    className="w-full h-auto shadow-sm mx-auto block"
                                    onError={(e) => {
                                        const target = e.target as HTMLImageElement;
                                        target.src = "https://images.pexels.com/photos/3861969/pexels-photo-3861969.jpeg?auto=compress&cs=tinysrgb&w=300";
                                    }}
                                />
                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-black bg-opacity-40 rounded">
                                    <div className="text-center">
                                        <span className="text-xs text-white font-medium">Click to select</span>
                                    </div>
                                </div>
                            </div>
                            <div className="w-full">
                                <div className="text-white-700 leading-relaxed text-left" dangerouslySetInnerHTML={{ __html: block.content.text.replace(/\n/g, "<br>") }} />
                            </div>
                        </div>
                    </div>
                );

            case "button":
                return (
                    <div
                        style={{
                            padding: block.styles.padding,
                            textAlign: "center",
                            margin: block.styles.margin,
                        }}
                    >
                        <a
                            href={block.content.href}
                            style={{
                                backgroundColor: block.content.backgroundColor,
                                color: block.content.color,
                                padding: "12px 24px",
                                textDecoration: "none",
                                borderRadius: "6px",
                                display: "inline-block",
                                fontWeight: "500",
                                fontSize: "16px",
                                fontFamily: "Arial, sans-serif",
                                border: "none",
                                cursor: "pointer",
                            }}
                            className="transition-all duration-200 hover:opacity-90 hover:shadow-lg transform hover:scale-105"
                            onClick={(e) => e.preventDefault()}
                        >
                            {block.content.text}
                        </a>
                    </div>
                );

            case "divider":
                return (
                    <div
                        style={{
                            padding: block.styles.padding,
                            margin: block.styles.margin,
                        }}
                    >
                        <hr
                            style={{
                                // border: "none",
                                // height: `${block.content.height}px`,
                                minWidth: "100%",
                                // backgroundColor: block.content.color,
                                borderTop: `${block.content.height}px dashed ${block.content.color}`,
                                // margin: "0",
                                // borderRadius: "2px",
                            }}
                        />
                    </div>
                );

            case "social":
                return (
                    <div
                        style={{
                            padding: block.styles.padding,
                            textAlign: "center",
                            margin: block.styles.margin,
                            // backgroundColor: block.styles.backgroundColor,
                        }}
                    >
                        <div className="flex justify-center items-center space-x-4">
                            {block.content.platforms.map((platform: any, index: number) => (
                                <a
                                    key={index}
                                    href={platform.url}
                                    className="text-gray-200 hover:text-blue-600 transition-all duration-200 transform hover:scale-110"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={(e) => e.preventDefault()}
                                    title={`Visit our ${platform.name}`}
                                >
                                    {getSocialIcon(platform.name)}
                                </a>
                            ))}
                        </div>
                    </div>
                );

            case "footer":
                return (
                    <div
                        style={{
                            padding: block.styles.padding,
                            margin: block.styles.margin,
                            color: "#ffffffbf",
                            // backgroundColor: block.styles.backgroundColor,
                            textAlign: "center",
                            borderTop: "1px solid #e5e7eb",
                        }}
                    >
                        <div className="text-gray-200 text-sm space-y-2">
                            <p className="font-semibold">{block.content.companyName}</p>
                            <p>{block.content.address}</p>
                            <p>
                                <a href="#" className="text-gray-300 hover:text-gray-500 underline">
                                    {block.content.unsubscribeText}
                                </a>
                            </p>
                        </div>
                    </div>
                );

            case "video":
                return (
                    <div
                        style={{
                            padding: block.styles.padding,
                            margin: block.styles.margin,
                            textAlign: "center",
                        }}
                    >
                        <div className="relative inline-block cursor-pointer group w-[100%]" onClick={() => onImageClick(block.id, "thumbnail")}>
                            <img
                                src={block.content.thumbnail}
                                alt={block.content.alt}
                                className="w-[100%] h-auto rounded shadow-sm group-hover:opacity-90 transition-opacity duration-200"
                                onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.src = "https://images.pexels.com/photos/3861969/pexels-photo-3861969.jpeg?auto=compress&cs=tinysrgb&w=600";
                                }}
                            />
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-16 h-16 bg-black bg-opacity-70 rounded-full flex items-center justify-center group-hover:bg-opacity-80 transition-all duration-200 pointer-events-none">
                                    <Play className="w-6 h-6 text-white ml-1" />
                                </div>
                            </div>
                            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-black bg-opacity-70 rounded px-2 py-1">
                                <span className="text-xs text-white">Click to select thumbnail</span>
                            </div>
                        </div>
                    </div>
                );

            case "columns":
                return (
                    <div
                        style={{
                            padding: block.styles.padding,
                            margin: block.styles.margin,
                        }}
                    >
                        <div className="grid grid-cols-2 gap-4">
                            {block.content.columns.map((column: any, index: number) => (
                                <div
                                    key={index}
                                    className="p-4 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors duration-200 cursor-pointer relative"
                                    onDoubleClick={(e) => handleColumnDoubleClick(e, index)}
                                >
                                    {editingColumn === index ? (
                                        <textarea
                                            value={column.content}
                                            onChange={(e) => {
                                                const newColumns = [...block.content.columns];
                                                newColumns[index] = { ...column, content: e.target.value };
                                                handleContentChange({ columns: newColumns });
                                            }}
                                            onBlur={handleColumnSubmit}
                                            onKeyDown={handleColumnKeyDown}
                                            className="w-full bg-transparent border-2 border-blue-400 rounded outline-none resize-none p-2 text-sm"
                                            rows={3}
                                            autoFocus
                                        />
                                    ) : (
                                        <div className="text-sm text-gray-700 leading-relaxed" dangerouslySetInnerHTML={{ __html: column.content.replace(/\n/g, "<br>") }} />
                                    )}
                                    {editingColumn !== index && (
                                        <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-200 bg-black bg-opacity-10 rounded">
                                            <span className="text-xs bg-gray-800 text-white px-2 py-1 rounded">Double-click to edit</span>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                );

            default:
                return (
                    <div className="p-4 text-gray-400 text-center border-2 border-dashed border-gray-300 rounded">
                        <p>Unknown block type: {block.type}</p>
                    </div>
                );
        }
    };

    return (
        <div
            className={`
      relative transition-all duration-200
      ${isSelected ? "ring-2 ring-blue-400 ring-opacity-50" : ""}
    `}
        >
            {renderBlock()}
        </div>
    );
};

export default BlockRenderer;
