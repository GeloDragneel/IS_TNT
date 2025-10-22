import React from "react";
import { X, Type, Palette, LayoutGrid as Layout, Link, Image as ImageIcon, Minus, Share2, Columns2, Video, Building, FileText } from "lucide-react";
import { EmailBlock } from "../types/email";

interface PropertiesPanelProps {
    block: EmailBlock;
    updateBlock: (blockId: string, updates: Partial<EmailBlock>) => void;
    onClose: () => void;
}

const PropertiesPanel: React.FC<PropertiesPanelProps> = ({ block, updateBlock, onClose }) => {
    const updateContent = (updates: any) => {
        updateBlock(block.id, {
            content: { ...block.content, ...updates },
        });
    };

    const updateStyles = (updates: any) => {
        updateBlock(block.id, {
            styles: { ...block.styles, ...updates },
        });
    };

    const renderProperties = () => {
        switch (block.type) {
            case "boxed-text":
                return (
                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                                <FileText className="w-4 h-4 inline mr-2" />
                                Content
                            </label>
                            <textarea
                                value={block.content.text}
                                onChange={(e) => updateContent({ text: e.target.value })}
                                className="w-full px-3 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                                rows={5}
                                placeholder="Enter your boxed text content..."
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Font Size</label>
                                <select
                                    value={block.styles.fontSize}
                                    onChange={(e) => updateStyles({ fontSize: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                                >
                                    <option value="12px">12px - Small</option>
                                    <option value="14px">14px - Regular</option>
                                    <option value="16px">16px - Medium</option>
                                    <option value="18px">18px - Large</option>
                                    <option value="24px">24px - Heading</option>
                                    <option value="32px">32px - Title</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Text Color</label>
                                <div className="flex space-x-2">
                                    <input
                                        type="color"
                                        value={block.styles.color}
                                        onChange={(e) => updateStyles({ color: e.target.value })}
                                        className="w-12 h-10 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer"
                                    />
                                    <input
                                        type="text"
                                        value={block.styles.color}
                                        onChange={(e) => updateStyles({ color: e.target.value })}
                                        className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm font-mono"
                                    />
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Background Color</label>
                            <div className="flex space-x-2">
                                <input
                                    type="color"
                                    value={block.styles.backgroundColor}
                                    onChange={(e) => updateStyles({ backgroundColor: e.target.value })}
                                    className="w-12 h-10 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer"
                                />
                                <input
                                    type="text"
                                    value={block.styles.backgroundColor}
                                    onChange={(e) => updateStyles({ backgroundColor: e.target.value })}
                                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm font-mono"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Text Alignment</label>
                            <div className="grid grid-cols-4 gap-2">
                                {["left", "center", "right", "justify"].map((align) => (
                                    <button
                                        key={align}
                                        onClick={() => updateStyles({ textAlign: align })}
                                        className={`
                      px-3 py-2 text-sm rounded-lg border transition-all duration-200
                      ${
                          block.styles.textAlign === align
                              ? "bg-blue-100 dark:bg-blue-900 border-blue-300 dark:border-blue-600 text-blue-700 dark:text-blue-300"
                              : "bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600"
                      }
                    `}
                                    >
                                        {align.charAt(0).toUpperCase() + align.slice(1)}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Border Style</label>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Border Width</label>
                                    <select
                                        value={block.styles.border?.split(" ")[0] || "1px"}
                                        onChange={(e) => {
                                            const currentBorder = block.styles.border || "1px solid #e5e7eb";
                                            const parts = currentBorder.split(" ");
                                            parts[0] = e.target.value;
                                            updateStyles({ border: parts.join(" ") });
                                        }}
                                        className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded"
                                    >
                                        <option value="0px">None</option>
                                        <option value="1px">1px</option>
                                        <option value="2px">2px</option>
                                        <option value="3px">3px</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Border Radius</label>
                                    <select
                                        value={block.styles.borderRadius}
                                        onChange={(e) => updateStyles({ borderRadius: e.target.value })}
                                        className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded"
                                    >
                                        <option value="0px">None</option>
                                        <option value="4px">Small</option>
                                        <option value="8px">Medium</option>
                                        <option value="12px">Large</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>
                );

            case "image":
                return (
                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                                <ImageIcon className="w-4 h-4 inline mr-2" />
                                Image Settings
                            </label>
                            <input
                                type="url"
                                value={block.content.src}
                                onChange={(e) => updateContent({ src: e.target.value })}
                                className="w-full px-3 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="https://example.com/image.jpg"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Alt Text</label>
                            <input
                                type="text"
                                value={block.content.alt}
                                onChange={(e) => updateContent({ alt: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Describe the image..."
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Width</label>
                            <div className="grid grid-cols-5 gap-2">
                                {["25%", "50%", "75%", "100%", "auto"].map((width) => (
                                    <button
                                        key={width}
                                        onClick={() => updateContent({ width })}
                                        className={`
                      px-2 py-2 text-sm rounded-lg border transition-all duration-200
                      ${
                          block.content.width === width
                              ? "bg-blue-100 dark:bg-blue-900 border-blue-300 dark:border-blue-600 text-blue-700 dark:text-blue-300"
                              : "bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600"
                      }
                    `}
                                    >
                                        {width}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Alignment</label>
                            <div className="grid grid-cols-3 gap-2">
                                {["left", "center", "right"].map((align) => (
                                    <button
                                        key={align}
                                        onClick={() => updateStyles({ textAlign: align })}
                                        className={`
                      px-3 py-2 text-sm rounded-lg border transition-all duration-200
                      ${
                          block.styles.textAlign === align
                              ? "bg-blue-100 dark:bg-blue-900 border-blue-300 dark:border-blue-600 text-blue-700 dark:text-blue-300"
                              : "bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600"
                      }
                    `}
                                    >
                                        {align.charAt(0).toUpperCase() + align.slice(1)}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Link URL (Optional)</label>
                            <input
                                type="url"
                                value={block.content.link || ""}
                                onChange={(e) => updateContent({ link: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="https://example.com (optional)"
                            />
                        </div>
                    </div>
                );

            case "image-group":
                return (
                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                                <ImageIcon className="w-4 h-4 inline mr-2" />
                                Image Group Settings
                            </label>
                        </div>

                        {block.content.images.map((image: any, index: number) => (
                            <div key={index} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Image {index + 1}</span>
                                    {block.content.images.length > 1 && (
                                        <button
                                            onClick={() => {
                                                const newImages = block.content.images.filter((_: any, i: number) => i !== index);
                                                updateContent({ images: newImages });
                                            }}
                                            className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 text-sm"
                                        >
                                            Remove
                                        </button>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <input
                                        type="url"
                                        value={image.src}
                                        onChange={(e) => {
                                            const newImages = [...block.content.images];
                                            newImages[index] = { ...image, src: e.target.value };
                                            updateContent({ images: newImages });
                                        }}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-600 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                                        placeholder="Image URL"
                                    />
                                    <input
                                        type="text"
                                        value={image.alt}
                                        onChange={(e) => {
                                            const newImages = [...block.content.images];
                                            newImages[index] = { ...image, alt: e.target.value };
                                            updateContent({ images: newImages });
                                        }}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-600 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                                        placeholder="Alt text"
                                    />
                                </div>
                            </div>
                        ))}

                        <button
                            onClick={() => {
                                const newImage = {
                                    src: "https://images.pexels.com/photos/3861969/pexels-photo-3861969.jpeg?auto=compress&cs=tinysrgb&w=300",
                                    alt: `Image ${block.content.images.length + 1}`,
                                };
                                updateContent({ images: [...block.content.images, newImage] });
                            }}
                            className="w-full px-4 py-2 bg-blue-600 dark:bg-blue-700 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors duration-200"
                        >
                            Add Image
                        </button>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Layout</label>
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    onClick={() => updateStyles({ gridCols: 2 })}
                                    className={`
                    px-3 py-2 text-sm rounded-lg border transition-all duration-200
                    ${
                        (block.styles.gridCols || 2) === 2
                            ? "bg-blue-100 dark:bg-blue-900 border-blue-300 dark:border-blue-600 text-blue-700 dark:text-blue-300"
                            : "bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600"
                    }
                  `}
                                >
                                    2 Columns
                                </button>
                                <button
                                    onClick={() => updateStyles({ gridCols: 3 })}
                                    className={`
                    px-3 py-2 text-sm rounded-lg border transition-all duration-200
                    ${
                        (block.styles.gridCols || 2) === 3
                            ? "bg-blue-100 dark:bg-blue-900 border-blue-300 dark:border-blue-600 text-blue-700 dark:text-blue-300"
                            : "bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600"
                    }
                  `}
                                >
                                    3 Columns
                                </button>
                            </div>
                        </div>
                    </div>
                );

            case "image-card":
                return (
                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                                <ImageIcon className="w-4 h-4 inline mr-2" />
                                Image Card Settings
                            </label>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Card Title</label>
                            <input
                                type="text"
                                value={block.content.title}
                                onChange={(e) => updateContent({ title: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Enter card title..."
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Description</label>
                            <textarea
                                value={block.content.description}
                                onChange={(e) => updateContent({ description: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                                rows={3}
                                placeholder="Enter card description..."
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Image URL</label>
                            <input
                                type="url"
                                value={block.content.image.src}
                                onChange={(e) =>
                                    updateContent({
                                        image: { ...block.content.image, src: e.target.value },
                                    })
                                }
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="https://example.com/image.jpg"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Button Text (Optional)</label>
                            <input
                                type="text"
                                value={block.content.buttonText || ""}
                                onChange={(e) => updateContent({ buttonText: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Read More"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Button Link (Optional)</label>
                            <input
                                type="url"
                                value={block.content.buttonLink || ""}
                                onChange={(e) => updateContent({ buttonLink: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="https://example.com"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Card Width</label>
                            <div className="grid grid-cols-4 gap-2">
                                {["300px", "400px", "500px", "100%"].map((width) => (
                                    <button
                                        key={width}
                                        onClick={() => updateStyles({ cardWidth: width })}
                                        className={`
                      px-2 py-2 text-sm rounded-lg border transition-all duration-200
                      ${
                          (block.styles.cardWidth || "400px") === width
                              ? "bg-blue-100 dark:bg-blue-900 border-blue-300 dark:border-blue-600 text-blue-700 dark:text-blue-300"
                              : "bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600"
                      }
                    `}
                                    >
                                        {width}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                );

            case "image-text":
                return (
                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                                <ImageIcon className="w-4 h-4 inline mr-2" />
                                Image + Text Settings
                            </label>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Text Content</label>
                            <textarea
                                value={block.content.text}
                                onChange={(e) => updateContent({ text: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                                rows={4}
                                placeholder="Enter text content..."
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Image URL</label>
                            <input
                                type="url"
                                value={block.content.image.src}
                                onChange={(e) =>
                                    updateContent({
                                        image: { ...block.content.image, src: e.target.value },
                                    })
                                }
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="https://example.com/image.jpg"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Layout</label>
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    onClick={() => updateStyles({ imagePosition: "left" })}
                                    className={`
                    px-3 py-2 text-sm rounded-lg border transition-all duration-200
                    ${
                        (block.styles.imagePosition || "left") === "left"
                            ? "bg-blue-100 dark:bg-blue-900 border-blue-300 dark:border-blue-600 text-blue-700 dark:text-blue-300"
                            : "bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600"
                    }
                  `}
                                >
                                    Image Left
                                </button>
                                <button
                                    onClick={() => updateStyles({ imagePosition: "right" })}
                                    className={`
                    px-3 py-2 text-sm rounded-lg border transition-all duration-200
                    ${
                        (block.styles.imagePosition || "left") === "right"
                            ? "bg-blue-100 dark:bg-blue-900 border-blue-300 dark:border-blue-600 text-blue-700 dark:text-blue-300"
                            : "bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600"
                    }
                  `}
                                >
                                    Image Right
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Image Size</label>
                            <div className="grid grid-cols-3 gap-2">
                                {["30%", "40%", "50%"].map((size) => (
                                    <button
                                        key={size}
                                        onClick={() => updateStyles({ imageWidth: size })}
                                        className={`
                      px-3 py-2 text-sm rounded-lg border transition-all duration-200
                      ${
                          (block.styles.imageWidth || "50%") === size
                              ? "bg-blue-100 dark:bg-blue-900 border-blue-300 dark:border-blue-600 text-blue-700 dark:text-blue-300"
                              : "bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600"
                      }
                    `}
                                    >
                                        {size}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                );

            case "divider":
                return (
                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                                <Minus className="w-4 h-4 inline mr-2" />
                                Divider Settings
                            </label>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Color</label>
                            <div className="flex space-x-2">
                                <input
                                    type="color"
                                    value={block.content.color}
                                    onChange={(e) => updateContent({ color: e.target.value })}
                                    className="w-12 h-10 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer"
                                />
                                <input
                                    type="text"
                                    value={block.content.color}
                                    onChange={(e) => updateContent({ color: e.target.value })}
                                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm font-mono"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Height (px)</label>
                            <input type="range" min="1" max="10" value={block.content.height} onChange={(e) => updateContent({ height: parseInt(e.target.value) })} className="w-full" />
                            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                                <span>1px</span>
                                <span className="font-medium">{block.content.height}px</span>
                                <span>10px</span>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Style</label>
                            <div className="grid grid-cols-3 gap-2">
                                {["solid", "dashed", "dotted"].map((style) => (
                                    <button
                                        key={style}
                                        onClick={() => updateContent({ style: style })}
                                        className={`
                      px-3 py-2 text-sm rounded-lg border transition-all duration-200
                      ${
                          (block.content.style || "solid") === style
                              ? "bg-blue-100 dark:bg-blue-900 border-blue-300 dark:border-blue-600 text-blue-700 dark:text-blue-300"
                              : "bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600"
                      }
                    `}
                                    >
                                        {style.charAt(0).toUpperCase() + style.slice(1)}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Width</label>
                            <div className="grid grid-cols-4 gap-2">
                                {["25%", "50%", "75%", "100%"].map((width) => (
                                    <button
                                        key={width}
                                        onClick={() => updateContent({ width: width })}
                                        className={`
                      px-3 py-2 text-sm rounded-lg border transition-all duration-200
                      ${
                          (block.content.width || "100%") === width
                              ? "bg-blue-100 dark:bg-blue-900 border-blue-300 dark:border-blue-600 text-blue-700 dark:text-blue-300"
                              : "bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600"
                      }
                    `}
                                    >
                                        {width}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                );

            case "social":
                return (
                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                                <Share2 className="w-4 h-4 inline mr-2" />
                                Social Links
                            </label>
                        </div>

                        {block.content.platforms.map((platform: any, index: number) => (
                            <div key={index} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300 capitalize">{platform.name}</span>
                                    <button
                                        onClick={() => {
                                            const newPlatforms = block.content.platforms.filter((_: any, i: number) => i !== index);
                                            updateContent({ platforms: newPlatforms });
                                        }}
                                        className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 text-sm"
                                    >
                                        Remove
                                    </button>
                                </div>
                                <input
                                    type="url"
                                    value={platform.url}
                                    onChange={(e) => {
                                        const newPlatforms = [...block.content.platforms];
                                        newPlatforms[index] = { ...platform, url: e.target.value };
                                        updateContent({ platforms: newPlatforms });
                                    }}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-600 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                                    placeholder={`https://${platform.name}.com/yourprofile`}
                                />
                            </div>
                        ))}

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Add Platform</label>
                            <div className="grid grid-cols-2 gap-2">
                                {["facebook", "twitter", "instagram", "linkedin", "youtube", "tiktok"].map((platform) => (
                                    <button
                                        key={platform}
                                        onClick={() => {
                                            const exists = block.content.platforms.some((p: any) => p.name === platform);
                                            if (!exists) {
                                                const newPlatform = { name: platform, url: `https://${platform}.com` };
                                                updateContent({ platforms: [...block.content.platforms, newPlatform] });
                                            }
                                        }}
                                        disabled={block.content.platforms.some((p: any) => p.name === platform)}
                                        className={`
                      px-3 py-2 text-sm rounded-lg border transition-all duration-200 capitalize
                      ${
                          block.content.platforms.some((p: any) => p.name === platform)
                              ? "bg-gray-100 dark:bg-gray-600 border-gray-300 dark:border-gray-500 text-gray-400 dark:text-gray-500 cursor-not-allowed"
                              : "bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 dark:hover:bg-blue-900 hover:border-blue-300 dark:hover:border-blue-600"
                      }
                    `}
                                    >
                                        {platform}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Icon Size</label>
                            <div className="grid grid-cols-3 gap-2">
                                {["small", "medium", "large"].map((size) => (
                                    <button
                                        key={size}
                                        onClick={() => updateStyles({ iconSize: size })}
                                        className={`
                      px-3 py-2 text-sm rounded-lg border transition-all duration-200 capitalize
                      ${
                          (block.styles.iconSize || "medium") === size
                              ? "bg-blue-100 dark:bg-blue-900 border-blue-300 dark:border-blue-600 text-blue-700 dark:text-blue-300"
                              : "bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600"
                      }
                    `}
                                    >
                                        {size}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                );

            case "footer":
                return (
                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                                <Building className="w-4 h-4 inline mr-2" />
                                Footer Settings
                            </label>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Company Name</label>
                            <input
                                type="text"
                                value={block.content.companyName}
                                onChange={(e) => updateContent({ companyName: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Your Company Name"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Address</label>
                            <textarea
                                value={block.content.address}
                                onChange={(e) => updateContent({ address: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                                rows={2}
                                placeholder="123 Main St, City, State 12345"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Unsubscribe Text</label>
                            <input
                                type="text"
                                value={block.content.unsubscribeText}
                                onChange={(e) => updateContent({ unsubscribeText: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Unsubscribe from this list"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Contact Email (Optional)</label>
                            <input
                                type="email"
                                value={block.content.contactEmail || ""}
                                onChange={(e) => updateContent({ contactEmail: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="contact@company.com"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Phone (Optional)</label>
                            <input
                                type="tel"
                                value={block.content.phone || ""}
                                onChange={(e) => updateContent({ phone: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="+1 (555) 123-4567"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Footer Style</label>
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    onClick={() => updateStyles({ footerStyle: "simple" })}
                                    className={`
                    px-3 py-2 text-sm rounded-lg border transition-all duration-200
                    ${
                        (block.styles.footerStyle || "simple") === "simple"
                            ? "bg-blue-100 dark:bg-blue-900 border-blue-300 dark:border-blue-600 text-blue-700 dark:text-blue-300"
                            : "bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600"
                    }
                  `}
                                >
                                    Simple
                                </button>
                                <button
                                    onClick={() => updateStyles({ footerStyle: "detailed" })}
                                    className={`
                    px-3 py-2 text-sm rounded-lg border transition-all duration-200
                    ${
                        (block.styles.footerStyle || "simple") === "detailed"
                            ? "bg-blue-100 dark:bg-blue-900 border-blue-300 dark:border-blue-600 text-blue-700 dark:text-blue-300"
                            : "bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600"
                    }
                  `}
                                >
                                    Detailed
                                </button>
                            </div>
                        </div>
                    </div>
                );

            case "video":
                return (
                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                                <Video className="w-4 h-4 inline mr-2" />
                                Video Settings
                            </label>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Video URL</label>
                            <input
                                type="url"
                                value={block.content.videoUrl}
                                onChange={(e) => updateContent({ videoUrl: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="https://youtube.com/watch?v=..."
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Thumbnail URL</label>
                            <input
                                type="url"
                                value={block.content.thumbnail}
                                onChange={(e) => updateContent({ thumbnail: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="https://example.com/thumbnail.jpg"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Alt Text</label>
                            <input
                                type="text"
                                value={block.content.alt}
                                onChange={(e) => updateContent({ alt: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Video description"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Video Title (Optional)</label>
                            <input
                                type="text"
                                value={block.content.title || ""}
                                onChange={(e) => updateContent({ title: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Video title"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Video Description (Optional)</label>
                            <textarea
                                value={block.content.description || ""}
                                onChange={(e) => updateContent({ description: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                                rows={3}
                                placeholder="Video description"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Thumbnail Size</label>
                            <div className="grid grid-cols-3 gap-2">
                                {["small", "medium", "large"].map((size) => (
                                    <button
                                        key={size}
                                        onClick={() => updateStyles({ thumbnailSize: size })}
                                        className={`
                      px-3 py-2 text-sm rounded-lg border transition-all duration-200 capitalize
                      ${
                          (block.styles.thumbnailSize || "medium") === size
                              ? "bg-blue-100 dark:bg-blue-900 border-blue-300 dark:border-blue-600 text-blue-700 dark:text-blue-300"
                              : "bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600"
                      }
                    `}
                                    >
                                        {size}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Play Button Style</label>
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    onClick={() => updateStyles({ playButtonStyle: "circle" })}
                                    className={`
                    px-3 py-2 text-sm rounded-lg border transition-all duration-200
                    ${
                        (block.styles.playButtonStyle || "circle") === "circle"
                            ? "bg-blue-100 dark:bg-blue-900 border-blue-300 dark:border-blue-600 text-blue-700 dark:text-blue-300"
                            : "bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600"
                    }
                  `}
                                >
                                    Circle
                                </button>
                                <button
                                    onClick={() => updateStyles({ playButtonStyle: "square" })}
                                    className={`
                    px-3 py-2 text-sm rounded-lg border transition-all duration-200
                    ${
                        (block.styles.playButtonStyle || "circle") === "square"
                            ? "bg-blue-100 dark:bg-blue-900 border-blue-300 dark:border-blue-600 text-blue-700 dark:text-blue-300"
                            : "bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600"
                    }
                  `}
                                >
                                    Square
                                </button>
                            </div>
                        </div>
                    </div>
                );

            default:
                return (
                    <div className="text-center py-8">
                        <Palette className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                        <p className="text-gray-500 dark:text-gray-400">No properties available for this block type.</p>
                    </div>
                );
        }
    };

    const getBlockIcon = () => {
        switch (block.type) {
            case "boxed-text":
                return <FileText className="w-5 h-5" />;
            case "image":
                return <ImageIcon className="w-5 h-5" />;
            case "image-group":
                return <ImageIcon className="w-5 h-5" />;
            case "image-card":
                return <ImageIcon className="w-5 h-5" />;
            case "image-text":
                return <ImageIcon className="w-5 h-5" />;
            case "divider":
                return <Minus className="w-5 h-5" />;
            case "social":
                return <Share2 className="w-5 h-5" />;
            case "footer":
                return <Building className="w-5 h-5" />;
            case "video":
                return <Video className="w-5 h-5" />;
            default:
                return <Palette className="w-5 h-5" />;
        }
    };

    const getBlockDisplayName = () => {
        switch (block.type) {
            case "boxed-text":
                return "Boxed Text";
            case "image":
                return "Image";
            case "image-group":
                return "Image Group";
            case "image-card":
                return "Image Card";
            case "image-text":
                return "Image + Text";
            case "divider":
                return "Divider";
            case "social":
                return "Social Follow";
            case "footer":
                return "Footer";
            case "video":
                return "Video";
            default:
                return block.type.charAt(0).toUpperCase() + block.type.slice(1);
        }
    };

    return (
        <div className="w-80 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 flex flex-col shadow-lg">
            {/* Header */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">{getBlockIcon()}</div>
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{getBlockDisplayName()}</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Block Properties</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-all duration-200"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4">{renderProperties()}</div>

            {/* Spacing Controls */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center">
                    <Layout className="w-4 h-4 mr-2 text-gray-600 dark:text-gray-400" />
                    Spacing & Layout
                </h4>
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Padding</label>
                        <input
                            type="text"
                            value={block.styles.padding}
                            onChange={(e) => updateStyles({ padding: e.target.value })}
                            className="w-full px-2 py-2 text-sm border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="16px"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Margin</label>
                        <input
                            type="text"
                            value={block.styles.margin}
                            onChange={(e) => updateStyles({ margin: e.target.value })}
                            className="w-full px-2 py-2 text-sm border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="0px"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PropertiesPanel;
