import React, { useState, useRef } from "react";
import { Upload, X, Image as ImageIcon, Trash2, Search } from "lucide-react";
import { massMailerService } from "@/services/massMailerService";
import { useLanguage } from "@/context/LanguageContext";
interface ImageLibraryProps {
    onImageSelect: (imageSrc: string) => void;
    onClose: () => void;
}

const ImageLibrary: React.FC<ImageLibraryProps> = ({ onImageSelect, onClose }) => {
    const [images, setImages] = useState<string[]>([]);
    const [dragOver, setDragOver] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [searchProduct, setSearchProduct] = useState("");
    const { translations } = useLanguage();
    const handleImageUpload = (files: FileList) => {
        Array.from(files).forEach((file) => {
            if (file.type.startsWith("image/")) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const result = e.target?.result as string;
                    setImages((prev) => [result, ...prev]);
                };
                reader.readAsDataURL(file);
            }
        });
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(false);
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleImageUpload(files);
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

    const removeImage = (index: number) => {
        setImages((prev) => prev.filter((_, i) => i !== index));
    };

    const fetchImages = async (search: string) => {
        if (search.length > 3) {
            try {
                const imagesArr = await massMailerService.getGetAllImages(search);
                let newImage: any = [];
                imagesArr["data"].forEach((element: any) => {
                    newImage.push(import.meta.env.VITE_BASE_URL + "" + element.url);
                });
                setImages(newImage);
            } catch (error) {
                console.error("Failed to fetch customer images", error);
            }
        }
    };

    return (
        <div className="w-80 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 flex flex-col shadow-lg">
            {/* Header */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                            <ImageIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{translations["Image Library"]}</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Click to use in your email</p>
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

            {/* Upload Area */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <div
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onClick={() => fileInputRef.current?.click()}
                    className={`
            border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all duration-200
            ${dragOver ? "border-blue-400 dark:bg-blue-900/20" : "border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:bg-gray-700"}
          `}
                >
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={(e) => {
                            if (e.target.files) {
                                handleImageUpload(e.target.files);
                            }
                            e.target.value = "";
                        }}
                        className="hidden"
                    />
                    <Upload className="w-8 h-8 text-gray-400 dark:text-gray-500 mx-auto mb-2" />
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Upload Images</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Click or drag & drop</p>
                </div>
            </div>
            <div className="p-4">
                <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center justify-between border-b border-gray-800 col-span-2">
                        {/* Left side - Search input */}
                        <div className="flex gap-4 flex-1">
                            <div className="w-full">
                                <input
                                    type="text"
                                    value={searchProduct}
                                    onChange={(e) => setSearchProduct(e.target.value)}
                                    className="bg-gray-800 text-teal-400 text-sm px-3 py-2 rounded-md w-full focus:outline-none"
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                            fetchImages(searchProduct); // use state instead of e.target.value
                                        }
                                    }}
                                    placeholder={translations["Enter Product"] || "Enter Product"}
                                />
                            </div>
                        </div>

                        {/* Right side - Button */}
                        <div className="ml-4">
                            <button
                                onClick={() => {
                                    fetchImages(searchProduct);
                                }}
                                className="px-4 py-2 text-sm bg-cyan-600 hover:bg-cyan-700 text-white rounded-md"
                            >
                                <Search className="w-5 h-5 text-white-600 dark:text-white-400" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Image Grid */}
            <div className="flex-1 overflow-y-auto p-4">
                <div className="grid grid-cols-2 gap-3">
                    {images.map((image, index) => (
                        <div key={index} className="relative group">
                            <img
                                src={image}
                                alt={`Library image ${index + 1}`}
                                className="w-full h-24 object-cover rounded-lg cursor-pointer hover:opacity-80 transition-opacity duration-200 border border-gray-200 dark:border-gray-600"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onImageSelect(image);
                                }}
                                onError={(e) => {
                                    (e.target as HTMLImageElement).src = `${import.meta.env.VITE_BASE_URL}/storage/products/no-image-min.jpg`;
                                }}
                            />
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    removeImage(index);
                                }}
                                className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-red-700"
                                title="Remove image"
                            >
                                <Trash2 className="w-3 h-3" />
                            </button>
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-black bg-opacity-40 rounded-lg pointer-events-none">
                                <span className="text-xs text-white font-medium">Click to use</span>
                            </div>
                        </div>
                    ))}
                </div>

                {images.length === 0 && (
                    <div className="text-center py-8">
                        <ImageIcon className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                        <p className="text-gray-500 dark:text-gray-400">No images uploaded yet</p>
                        <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Upload some images to get started</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ImageLibrary;
