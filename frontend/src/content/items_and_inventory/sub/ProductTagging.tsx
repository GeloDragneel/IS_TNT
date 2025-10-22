import React, { useState, useEffect, useMemo } from "react";
import { productService, ApiProduct, ProductImage } from "@/services/productService";
import { useLanguage } from "@/context/LanguageContext";
import CustomCheckbox from "@/components/CustomCheckbox";
import { showAlert, showConfirm } from "@/utils/alert";
import Pagination from "@/components/Pagination";
import { useDropzone } from "react-dropzone";
import ItemsPerPageSelector from "@/components/ItemsPerPageSelector";
import CopyToClipboard from "@/components/CopyToClipboard";
import { Plus, Minus, Trash2, Edit, X, Upload, Move, GripVertical } from "lucide-react";
import { showErrorToast, showSuccessToast } from "@/utils/toast";
// Handle the Smooth skeleton loading
// localStorage.clear();
const LoadingSpinnerTbody: React.FC<{ rowsCount: number }> = ({ rowsCount }) => {
    return (
        <tbody>
            {Array.from({ length: rowsCount }).map((_, idx) => (
                <tr key={idx} className="bg-transparent-900 border-b border-gray-700">
                    <td className="text-center py-3 px-4">
                        <div className="h-6 bg-gray-700 rounded w-5 mx-auto"></div>
                    </td>
                    <td className="py-3 px-4 flex items-center space-x-3 min-w-[300px]">
                        <div className="w-10 h-10 rounded-lg bg-gray-700" />
                        <div className="flex flex-col space-y-2 py-1 flex-1">
                            <div className="h-4 bg-gray-700 rounded w-3/4"></div>
                            <div className="h-3 bg-gray-600 rounded w-1/2"></div>
                        </div>
                    </td>
                    <td className="text-center items-center py-3 px-4">
                        <div className="flex flex-col space-y-2 py-1 flex-1">
                            <div className="h-4 bg-gray-700 rounded w-16 mx-auto"></div>
                            <div className="h-4 bg-gray-700 rounded w-16 mx-auto"></div>
                        </div>
                    </td>
                    <td className="text-center py-3 px-4">
                        <div className="flex flex-col space-y-2 py-1 flex-1">
                            <div className="h-4 bg-gray-700 rounded w-16 mx-auto"></div>
                            <div className="h-4 bg-gray-700 rounded w-16 mx-auto"></div>
                        </div>
                    </td>
                    <td className="text-center py-3 px-4">
                        <div className="flex flex-col space-y-2 py-1 flex-1">
                            <div className="h-4 bg-gray-700 rounded w-16 mx-auto"></div>
                            <div className="h-4 bg-gray-700 rounded w-16 mx-auto"></div>
                        </div>
                    </td>
                    <td className="text-center py-3 px-4">
                        <div className="flex flex-col space-y-2 py-1 flex-1">
                            <div className="h-4 bg-gray-700 rounded w-16 mx-auto"></div>
                            <div className="h-4 bg-gray-700 rounded w-16 mx-auto"></div>
                        </div>
                    </td>
                    <td className="text-center py-3 px-4">
                        <div className="h-6 bg-gray-700 rounded w-20 mx-auto"></div>
                    </td>
                    <td className="text-center py-3 px-4">
                        <div className="h-4 bg-gray-700 rounded w-8 mx-auto"></div>
                    </td>
                    <td className="text-center py-3 px-4">
                        <div className="h-6 bg-gray-700 rounded w-10 mx-auto"></div>
                    </td>
                    <td className="text-center py-3 px-4">
                        <div className="h-6 bg-gray-700 rounded w-10 mx-auto"></div>
                    </td>
                </tr>
            ))}
        </tbody>
    );
};

// Helper function to get image URL - Fixed to use correct path
const getImageUrlThumbnail = (image: string) => {
    if (!image) {
        return "https://tnt2.simplify.cool/images/no-image-min.jpg";
    } else {
        return `http://localhost:8000/storage/${image}`;
    }
};

const MemoizedPagination = React.memo(Pagination);
const MemoizedItemsPerPageSelector = React.memo(ItemsPerPageSelector);

interface ProductTaggingProps {
    tabId: string;
    onProductSelect: (productId: number) => void;
    onChangeView: (view: "list" | "details" | "archive" | "tagging") => void; // <- NEW
    selectedProducts: number[];
    onSelectedProductsChange: (selected: number[]) => void;
    // onSelectedProductsChangePopup: (selected: number[]) => void;
    expandedRows: number[];
    onExpandedRowsChange: (expanded: number[]) => void;
}
interface Detail {
    id: number;
    product_id: number;
    product_code: string;
    product_title_en: string;
    product_title_cn: string;
    preorder_start_date: string;
    preorder_end_date: string;
    item_cost: number;
    retail_price: number;
    preorder_price: number;
    deposit: number;
    currency: string;
    thumbnail: string;
}

interface ImageItem {
    file?: File;
    type: "thumbnail" | "display" | "banner" | "slide";
    id: string;
    index?: number;
    isNew: boolean;
    isDeleted: boolean;
    apiId?: number;
    path?: string;
    rank: number;
}
interface ProductTag {
    id: number;
    old_product_code: string; // You can add more fields as necessary
    product_code: string; // You can add more fields as necessary
    product_title_en: string; // You can add more fields as necessary
    product_title_cn: string; // You can add more fields as necessary
    is_tnt: number; // You can add more fields as necessary
    is_activate_banner: number; // You can add more fields as necessary
    // Add other properties that are present in your cached products
}

const ProductTagging: React.FC<ProductTaggingProps> = ({ tabId, onChangeView, selectedProducts, onSelectedProductsChange, expandedRows, onExpandedRowsChange }) => {
    const { translations, lang } = useLanguage();
    const [products, setProducts] = useState<ApiProduct[]>([]);
    const [productsPopup, setProductsPopup] = useState<ApiProduct[]>([]);
    const [totalPages, setTotalPages] = useState(1);
    const [totalPagesPopup, setTotalPagesPopup] = useState(1);
    const [productTagId, setProdTagId] = useState(0);
    const safeLang = lang === "cn" ? "cn" : "en";
    const pageSizeOptions = useMemo(() => [15, 20, 50, -1], []);
    const pageSizeOptionsPopup = useMemo(() => [10, 20, 50, -1], []);
    const [taggingDetailsMap, setTaggingDetailsMap] = useState<Record<number, Detail[] | null>>({});
    const [loadingDetails, setLoadingDetails] = React.useState<Record<number, boolean>>({});
    const [showEditInfo, setShowEditInfo] = React.useState(false);
    const [showAddInfo, setShowAddInfo] = React.useState(false);
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
    const [thumbnailImage, setThumbnailImage] = useState<ImageItem | null>(null);
    const [displayImage, setDisplayImage] = useState<ImageItem | null>(null);
    const [bannerImage, setBannerImage] = useState<ImageItem | null>(null);
    const [slideImages, setSlideImages] = useState<ImageItem[]>([]);
    const [selectedProductsPopup, setSelectedProductsPopup] = useState<number[]>([]);
    const [loading, setLoading] = useState(() => {
        const savedLoading = localStorage.getItem(`${tabId}-loading-products-tagging`);
        return savedLoading !== null ? JSON.parse(savedLoading) : true;
    });
    // Form state - Updated to handle single vs multi-select properly
    const [formData, setFormData] = useState({
        product_code: "",
        old_product_code: "",
        copy_product_code: "",
        product_title_en: "",
        product_title_cn: "",
        is_tnt: 0,
        is_wholesale: 0,
        is_activate_banner: 0,
    });

    const [currentPage, setCurrentPage] = useState(() => {
        const metaKey = `${tabId}-cached-meta-tagging`;
        const cachedMeta = localStorage.getItem(metaKey);
        let page = 1;
        if (cachedMeta) {
            try {
                const meta = JSON.parse(cachedMeta);
                page = typeof meta.page === "number" ? meta.page : parseInt(meta.page) || 1;
            } catch (err) {
                console.warn("Invalid JSON in cached-meta:", err);
            }
        }
        return page;
    });

    const [itemsPerPage, setItemsPerPage] = useState(() => {
        const metaKey = `${tabId}-cached-meta-tagging`;
        const cachedMeta = localStorage.getItem(metaKey);
        let perPage = 15;
        if (cachedMeta) {
            try {
                const meta = JSON.parse(cachedMeta);
                perPage = typeof meta.perPage === "number" ? meta.perPage : parseInt(meta.perPage) || 10;
            } catch (err) {
                console.warn("Failed to parse cached-meta:", err);
            }
        }
        return perPage;
    });

    const [searchTerm, setSearchTerm] = useState(() => {
        const cached = localStorage.getItem(`${tabId}-cached-meta-tagging`);
        if (!cached) return "";
        try {
            const meta = JSON.parse(cached);
            return meta.search || "";
        } catch {
            return "";
        }
    });

    //

    const [currentPagePopup, setCurrentPagePopup] = useState(() => {
        const metaKey = `${tabId}-cached-meta-tagging-popup`;
        const cachedMeta = localStorage.getItem(metaKey);
        let page = 1;
        if (cachedMeta) {
            try {
                const meta = JSON.parse(cachedMeta);
                page = typeof meta.page === "number" ? meta.page : parseInt(meta.page) || 1;
            } catch (err) {
                console.warn("Invalid JSON in cached-meta:", err);
            }
        }
        return page;
    });

    const [itemsPerPagePopup, setItemsPerPagePopup] = useState(() => {
        const metaKey = `${tabId}-cached-meta-tagging-popup`;
        const cachedMeta = localStorage.getItem(metaKey);
        let perPage = 10;
        if (cachedMeta) {
            try {
                const meta = JSON.parse(cachedMeta);
                perPage = typeof meta.perPage === "number" ? meta.perPage : parseInt(meta.perPage) || 10;
            } catch (err) {
                console.warn("Failed to parse cached-meta:", err);
            }
        }
        return perPage;
    });

    const [searchTermPopup, setSearchTermPopup] = useState(() => {
        const cached = localStorage.getItem(`${tabId}-cached-meta-tagging-popup`);
        if (!cached) return "";
        try {
            const meta = JSON.parse(cached);
            return meta.search || "";
        } catch {
            return "";
        }
    });

    // Dropzone configurations
    const thumbnailDropzone = useDropzone({
        accept: { "image/*": [".jpeg", ".jpg", ".png", ".gif", ".webp"] },
        multiple: false,
        onDrop: (acceptedFiles) => {
            if (acceptedFiles.length > 0) {
                const newImage: ImageItem = {
                    file: acceptedFiles[0],
                    type: "thumbnail",
                    id: `new-thumbnail-${Date.now()}`,
                    isNew: true,
                    isDeleted: false,
                    rank: 1,
                };
                setThumbnailImage(newImage);
            }
        },
    });

    const displayDropzone = useDropzone({
        accept: { "image/*": [".jpeg", ".jpg", ".png", ".gif", ".webp"] },
        multiple: false,
        onDrop: (acceptedFiles) => {
            if (acceptedFiles.length > 0) {
                const newImage: ImageItem = {
                    file: acceptedFiles[0],
                    type: "display",
                    id: `new-display-${Date.now()}`,
                    isNew: true,
                    isDeleted: false,
                    rank: 1,
                };
                setDisplayImage(newImage);
            }
        },
    });

    const bannerDropzone = useDropzone({
        accept: { "image/*": [".jpeg", ".jpg", ".png", ".gif", ".webp"] },
        multiple: false,
        onDrop: (acceptedFiles) => {
            if (acceptedFiles.length > 0) {
                const newImage: ImageItem = {
                    file: acceptedFiles[0],
                    type: "banner",
                    id: `new-banner-${Date.now()}`,
                    isNew: true,
                    isDeleted: false,
                    rank: 1,
                };
                setBannerImage(newImage);
            }
        },
    });

    const slidesDropzone = useDropzone({
        accept: { "image/*": [".jpeg", ".jpg", ".png", ".gif", ".webp"] },
        multiple: true,
        onDrop: (acceptedFiles) => {
            const newSlides = acceptedFiles.map((file, index) => ({
                file,
                type: "slide" as const,
                id: `new-slide-${Date.now()}-${index}`,
                isNew: true,
                isDeleted: false,
                rank: 0, // Rank will be updated below
                index: 0,
            }));

            setSlideImages((prev) => {
                const visibleImages = prev.filter((img) => !img.isDeleted);
                const deletedImages = prev.filter((img) => img.isDeleted);
                const combined = [...visibleImages, ...newSlides].slice(0, 50);
                const updatedRank = combined.map((img, index) => ({
                    ...img,
                    rank: index + 1,
                    index,
                }));
                return [...updatedRank, ...deletedImages];
            });
        },
    });

    // Helper function to get image URL - Fixed to use correct path
    const getImageUrl = (image: ImageItem | null): string => {
        if (!image) {
            return "https://tnt2.simplify.cool/images/no-image-min.jpg";
        }

        if (image.isNew && image.file) {
            return URL.createObjectURL(image.file);
        } else if (image.path) {
            // The backend provides a relative URL like "/storage/products/..."
            // We need to prepend the backend's base URL.
            return `http://localhost:8000${image.path}`;
        }
        return "https://tnt2.simplify.cool/images/no-image-min.jpg";
    };

    useEffect(() => {
        const productKey = `${tabId}-cached-products-tagging`;
        const metaKey = `${tabId}-cached-meta-tagging`;
        const mountKey = `${tabId}-mount-status-tagging`;

        const isFirstMount = sessionStorage.getItem(mountKey) !== "mounted";

        if (isFirstMount) {
            sessionStorage.setItem(mountKey, "mounted");
            fetchProducts(currentPage, itemsPerPage, searchTerm);
            return;
        }

        const cachedProductsRaw = localStorage.getItem(productKey);
        const cachedMetaRaw = localStorage.getItem(metaKey);

        if (!cachedProductsRaw || !cachedMetaRaw) {
            fetchProducts(currentPage, itemsPerPage, searchTerm);
            return;
        }

        try {
            const cachedMeta = JSON.parse(cachedMetaRaw);
            const cachedProducts = JSON.parse(cachedProductsRaw);

            const isCacheValid = cachedMeta.page === currentPage && cachedMeta.perPage === itemsPerPage && cachedMeta.search === searchTerm;

            if (isCacheValid) {
                setProducts(cachedProducts);
                setTotalPages(cachedMeta.totalPages);
                setLoading(false);
                localStorage.setItem(`${tabId}-loading-products-tagging`, JSON.stringify(false));
                return;
            }
        } catch (err) {
            console.warn("Failed to parse cached meta:", err);
        }

        fetchProducts(currentPage, itemsPerPage, searchTerm);
    }, [currentPage, itemsPerPage, searchTerm, tabId]);

    useEffect(() => {
        const productKey = `${tabId}-cached-products-tagging-popup`;
        const metaKey = `${tabId}-cached-meta-tagging-popup`;
        const mountKey = `${tabId}-mount-status-tagging-popup`;

        const isFirstMount = sessionStorage.getItem(mountKey) !== "mounted";

        if (isFirstMount) {
            sessionStorage.setItem(mountKey, "mounted");
            fetchProductsPopup(currentPagePopup, itemsPerPagePopup, searchTermPopup);
            return;
        }

        const cachedProductsRaw = localStorage.getItem(productKey);
        const cachedMetaRaw = localStorage.getItem(metaKey);

        if (!cachedProductsRaw || !cachedMetaRaw) {
            fetchProductsPopup(currentPagePopup, itemsPerPagePopup, searchTermPopup);
            return;
        }

        try {
            const cachedMeta = JSON.parse(cachedMetaRaw);
            const cachedProducts = JSON.parse(cachedProductsRaw);

            const isCacheValid = cachedMeta.page === currentPagePopup && cachedMeta.perPage === itemsPerPagePopup && cachedMeta.search === searchTermPopup;

            if (isCacheValid) {
                setProductsPopup(cachedProducts);
                setTotalPagesPopup(cachedMeta.totalPages);
                setLoading(false);
                localStorage.setItem(`${tabId}-loading-products-tagging-popup`, JSON.stringify(false));
                return;
            }
        } catch (err) {
            console.warn("Failed to parse cached meta:", err);
        }

        fetchProductsPopup(currentPagePopup, itemsPerPagePopup, searchTermPopup);
    }, [currentPagePopup, itemsPerPagePopup, searchTermPopup, tabId]);

    useEffect(() => {
        // For example, load tagging details for all expanded rows automatically
        expandedRows.forEach(async (productId) => {
            // Check localStorage
            const cachedData = localStorage.getItem(`cached-tagging-details-${productId}`);

            if (cachedData) {
                setTaggingDetailsMap((prev) => ({
                    ...prev,
                    [productId]: JSON.parse(cachedData),
                }));
            } else {
                setLoadingDetails((prev) => ({ ...prev, [productId]: true }));

                productService
                    .getTaggingDetails(productId)
                    .then((data) => {
                        setTaggingDetailsMap((prev) => ({ ...prev, [productId]: data }));
                        localStorage.setItem(`cached-tagging-details-${productId}`, JSON.stringify(data));
                    })
                    .catch((err) => {
                        console.error(`Failed to load details for product ${productId}`, err);
                        setTaggingDetailsMap((prev) => ({ ...prev, [productId]: null }));
                    })
                    .finally(() => {
                        setLoadingDetails((prev) => ({ ...prev, [productId]: false }));
                    });
            }
        });
    }, [expandedRows]); // Runs when expandedRows changes

    const fetchProducts = async (page = currentPage, perPage = itemsPerPage, search = "") => {
        try {
            localStorage.setItem(`${tabId}-loading-products-tagging`, JSON.stringify(true));

            const paginatedData = await productService.getProductTagList(page, perPage, search);

            setProducts(paginatedData.data);
            setTotalPages(paginatedData.last_page);

            localStorage.setItem(`${tabId}-cached-products-tagging`, JSON.stringify(paginatedData.data));
            localStorage.setItem(
                `${tabId}-cached-meta-tagging`,
                JSON.stringify({
                    page,
                    perPage,
                    search,
                    totalPages: paginatedData.last_page,
                    totalItems: paginatedData.total,
                })
            );
        } catch (err) {
            console.error("Error fetching products:", err);
        } finally {
            setLoading(false);
            localStorage.setItem(`${tabId}-loading-products-tagging`, JSON.stringify(false));
        }
    };
    const fetchProductsPopup = async (page = currentPagePopup, perPage = itemsPerPagePopup, search = "") => {
        try {
            localStorage.setItem(`${tabId}-loading-products-tagging-popup`, JSON.stringify(true));

            const paginatedData = await productService.getProductTagPopup(page, perPage, search);

            setProductsPopup(paginatedData.data);
            setTotalPagesPopup(paginatedData.last_page);

            localStorage.setItem(`${tabId}-cached-products-tagging-popup`, JSON.stringify(paginatedData.data));
            localStorage.setItem(
                `${tabId}-cached-meta-tagging-popup`,
                JSON.stringify({
                    page,
                    perPage,
                    search,
                    totalPages: paginatedData.last_page,
                    totalItems: paginatedData.total,
                })
            );
        } catch (err) {
            console.error("Error fetching products:", err);
        } finally {
            localStorage.setItem(`${tabId}-loading-products-tagging-popup`, JSON.stringify(false));
        }
    };
    const fetchProductImages = async (productId: number) => {
        try {
            const idToUse = productId;
            if (!idToUse) return;

            setThumbnailImage(null);
            setDisplayImage(null);
            setBannerImage(null);
            setSlideImages([]);
            setProdTagId(idToUse);

            const productKey = `${tabId}-cached-products-tagging`;
            const cachedProductsRaw = localStorage.getItem(productKey);
            const cachedProducts: ProductTag[] = cachedProductsRaw ? JSON.parse(cachedProductsRaw) : []; // Explicitly define the type here
            const productTag = cachedProducts.find((item) => item.id === idToUse); // item now correctly recognized as ProductTag
            // Check if productTag is not undefined
            if (productTag) {
                setFormData((prevData) => ({
                    ...prevData,
                    old_product_code: productTag.old_product_code,
                    product_code: productTag.product_code,
                    product_title_en: productTag.product_title_en,
                    product_title_cn: productTag.product_title_cn,
                    is_tnt: productTag.is_tnt,
                    is_activate_banner: productTag.is_activate_banner,
                }));
            } else {
                console.error("Product tag not found");
            }
            let images = await productService.getProductImagesTag(idToUse);

            const sortedImages = images.sort((a, b) => parseInt(a.rank) - parseInt(b.rank));
            const thumbnail = sortedImages.find((img) => img.type === "thumbnail");
            const display = sortedImages.find((img) => img.type === "display");
            const banner = sortedImages.find((img) => img.type === "banner");
            const slides = sortedImages.filter((img) => img.type === "slide");

            if (thumbnail) setThumbnailImage(convertApiImageToImageItem(thumbnail));
            if (display) setDisplayImage(convertApiImageToImageItem(display));
            if (banner) setBannerImage(convertApiImageToImageItem(banner));
            if (slides.length > 0) {
                setSlideImages(slides.map(convertApiImageToImageItem));
            }
            setShowEditInfo(true);
        } catch (error) {
            console.error("Failed to load product images:", error);
        }
    };
    const fetchPreorderList = async (productId: number) => {
        setProdTagId(productId);
        setShowAddInfo(true);
    };
    // Filter products based on search term
    const filteredProducts = products.filter((product) => {
        const searchLower = searchTerm.toLowerCase();
        return (
            product.id?.toString().includes(searchLower) ||
            product.product_code?.toLowerCase().includes(searchLower) ||
            product.product_title_en?.toLowerCase().includes(searchLower) ||
            product.product_title_cn?.toLowerCase().includes(searchLower) ||
            product.product_status?.toLowerCase().includes(searchLower) ||
            product.rwarehouse?.toLowerCase().includes(searchLower)
        );
    });
    const filteredProductsPopup = productsPopup.filter((productsPopup) => {
        const searchLower = searchTermPopup.toLowerCase();
        return (
            productsPopup.id?.toString().includes(searchLower) ||
            productsPopup.product_code?.toLowerCase().includes(searchLower) ||
            productsPopup.product_title_en?.toLowerCase().includes(searchLower) ||
            productsPopup.product_title_cn?.toLowerCase().includes(searchLower) ||
            productsPopup.product_status?.toLowerCase().includes(searchLower) ||
            productsPopup.rwarehouse?.toLowerCase().includes(searchLower)
        );
    });

    const formatDate = (dateString: string | null | undefined) => {
        if (!dateString) return "";
        const date = new Date(dateString);
        if (lang === "cn") {
            const month = date.toLocaleString("en-US", { month: "short" });
            const day = date.getDate();
            const year = date.getFullYear();
            const monthMap: { [key: string]: string } = {
                Jan: "1月",
                Feb: "2月",
                Mar: "3月",
                Apr: "4月",
                May: "5月",
                Jun: "6月",
                Jul: "7月",
                Aug: "8月",
                Sep: "9月",
                Oct: "10月",
                Nov: "11月",
                Dec: "12月",
            };
            return `${monthMap[month]}${day}日${year}`;
        }
        return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    };

    // Format currency
    const formatCurrency = (amount: number | undefined) => {
        if (amount === undefined || amount === null) return "-";
        return `${Number(amount).toFixed(2)}`;
    };
    // Convert API images to ImageItem format
    const convertApiImageToImageItem = (apiImage: ProductImage): ImageItem => {
        return {
            type: apiImage.type,
            id: `api-${apiImage.id}`,
            isNew: false,
            isDeleted: false,
            apiId: apiImage.id,
            path: apiImage.path,
            rank: parseInt(apiImage.rank),
            index: apiImage.type === "slide" ? parseInt(apiImage.rank) - 1 : 0,
        };
    };
    // Handle select all
    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            onSelectedProductsChange(products.map((p) => p.id).filter(Boolean) as number[]);
        } else {
            onSelectedProductsChange([]);
        }
    };
    const handleSelectAllPopup = (checked: boolean) => {
        if (checked) {
            const allIds = productsPopup.map((p) => p.id);
            setSelectedProductsPopup(allIds);
        } else {
            setSelectedProductsPopup([]);
        }
    };
    const handleSelectProductPopup = (id: number, checked: boolean) => {
        if (checked) {
            setSelectedProductsPopup((prev) => [...prev, id]);
        } else {
            setSelectedProductsPopup((prev) => prev.filter((pid) => pid !== id));
        }
    };
    // Drag and drop functions for slide sorting
    const handleDragStart = (e: React.DragEvent, index: number) => {
        setDraggedIndex(index);
        e.dataTransfer.effectAllowed = "move";
    };
    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
    };
    const handleDrop = (e: React.DragEvent, dropIndex: number) => {
        e.preventDefault();

        if (draggedIndex === null || draggedIndex === dropIndex) {
            setDraggedIndex(null);
            return;
        }

        const visibleImages = slideImages.filter((img) => !img.isDeleted);
        const deletedImages = slideImages.filter((img) => img.isDeleted);

        if (draggedIndex >= visibleImages.length || dropIndex >= visibleImages.length) {
            setDraggedIndex(null);
            return;
        }

        const draggedImage = visibleImages[draggedIndex];
        visibleImages.splice(draggedIndex, 1);
        visibleImages.splice(dropIndex, 0, draggedImage);

        const rerankedVisible = visibleImages.map((img, index) => ({
            ...img,
            rank: index + 1,
            index: index,
        }));

        setSlideImages([...rerankedVisible, ...deletedImages]);

        setDraggedIndex(null);
    };
    const handleDragEnd = () => {
        setDraggedIndex(null);
    };
    const removeSlideImage = async (id: string) => {
        const confirmed = await showConfirm(
            translations["System Message"],
            translations["Are you sure you want to delete this image?"] || "Are you sure you want to delete this image?",
            translations["Delete"],
            translations["Cancel"]
        );
        if (confirmed) {
            setSlideImages((prev) => {
                const updated = prev.map((img) => (img.id === id ? { ...img, isDeleted: true } : img));

                const visibleImages = updated.filter((img) => !img.isDeleted);
                const rerankedVisible = visibleImages.map((img, newIndex) => ({
                    ...img,
                    rank: newIndex + 1,
                    index: newIndex,
                }));

                const rerankedMap = new Map(rerankedVisible.map((img) => [img.id, img]));

                return updated.map((img) => rerankedMap.get(img.id) || img);
            });
            showSuccessToast(translations["alert_message_43"]);
        }
    };
    // Handle individual select
    const handleSelectProduct = (productId: number, checked: boolean) => {
        if (checked) {
            onSelectedProductsChange([...selectedProducts, productId]);
        } else {
            onSelectedProductsChange(selectedProducts.filter((id) => id !== productId));
        }
    };
    const handleDeleteSelected = async () => {
        if (selectedProducts.length === 0) {
            showErrorToast(translations["Please click checkbox to select row"]);
            return;
        }
        const confirmed = await showConfirm(translations["System Message"], translations["Are you sure you want to delete selected items?"], translations["Delete"], translations["Cancel"]);

        if (!confirmed) return;
        try {
            await productService.deleteProductsTagMaster(selectedProducts, "hard");
            setProducts((prev) => prev.filter((p) => !selectedProducts.includes(p.id!)));
            onSelectedProductsChange([]);
            fetchProducts(currentPage, itemsPerPage, searchTerm);
            showAlert(translations["System Message"], translations["Record has been Deleted"], "success");
        } catch (err) {
            showAlert(translations["System Message"], translations["alert_message_18"], "error");
            console.error("Deletion failed:", err);
        }
    };

    const handleToggleRow = async (productId: number) => {
        const isExpanded = expandedRows.includes(productId);

        if (isExpanded) {
            // Collapse row
            onExpandedRowsChange(expandedRows.filter((id) => id !== productId));
        } else {
            // Expand row
            onExpandedRowsChange([...expandedRows, productId]);

            // Try to get from localStorage first
            const cachedData = localStorage.getItem(`cached-tagging-details-${productId}`);

            if (cachedData) {
                // If cache exists, parse and set it
                setTaggingDetailsMap((prev) => ({
                    ...prev,
                    [productId]: JSON.parse(cachedData),
                }));
            } else {
                // If no cache, fetch from API
                setLoadingDetails((prev) => ({ ...prev, [productId]: true }));

                try {
                    const data = await productService.getTaggingDetails(productId);

                    // Save to state
                    setTaggingDetailsMap((prev) => ({ ...prev, [productId]: data }));

                    // Save to localStorage
                    localStorage.setItem(`taggingDetails_${productId}`, JSON.stringify(data));
                } catch (error) {
                    console.error(`Failed to load details for product ${productId}`, error);
                    setTaggingDetailsMap((prev) => ({ ...prev, [productId]: null }));
                } finally {
                    setLoadingDetails((prev) => ({ ...prev, [productId]: false }));
                }
            }
        }
    };
    const handleDetailDelete = async (e: React.MouseEvent, id: number, masterId: number) => {
        e.preventDefault();

        const confirmed = await showConfirm(translations["System Message"], translations["Are you sure you want to delete selected items?"], translations["Delete"], translations["Cancel"]);
        if (!confirmed) return;
        try {
            await productService.deleteProductsTagDetail([id], "hard");
            await localStorage.removeItem(`cached-tagging-details-${masterId}`);
            const data = await productService.getTaggingDetails(masterId);
            setTaggingDetailsMap((prev) => ({ ...prev, [masterId]: data }));
            // Remove from localStorage
            showSuccessToast(translations["Record has been Deleted"]);
        } catch (err) {
            showErrorToast(translations["alert_message_18"]);
            console.error("Deletion failed:", err);
        }
    };

    const handleSave = async () => {
        const data = new FormData();

        // Ensure `product_title_en` exists
        const productTitleEn = formData["product_title_en"]?.toString().trim() ?? "";
        const productTitleCn = formData["product_title_cn"]?.toString().trim() ?? "";
        const productCode = formData["product_code"]?.toString().trim() ?? "";
        const productCodeOld = formData["old_product_code"]?.toString().trim() ?? "";
        // const localProductId = (formData.is_copy_data ? 0 : productId);

        if (!productCode) {
            showErrorToast(translations["Product Code Empty"]);
            return;
        }
        if (!productTitleEn && safeLang === "en") {
            showErrorToast(translations["Product Title Empty"]);
            return;
        }
        if (!productTitleCn && safeLang === "cn") {
            showErrorToast(translations["Product Title Empty"]);
            return;
        }
        if (productCode != productCodeOld && productTagId != 0) {
            const confirmed = await showConfirm(translations["Product Code Update"], translations["Are you sure you want to Change Item Code"], translations["Delete"], translations["Cancel"]);
            if (!confirmed) return;
            if (confirmed) {
                formData["old_product_code"] = productCode;
            }
        }

        // Fallback: if Chinese title is missing, use English
        if (!formData["product_title_cn"] && safeLang === "en") {
            formData["product_title_cn"] = productTitleEn;
        }
        if (!formData["product_title_en"] && safeLang === "cn") {
            formData["product_title_en"] = productTitleCn;
        }

        // Append all form data
        Object.keys(formData).forEach((key) => {
            let value = formData[key as keyof typeof formData];
            if (value !== null && value !== undefined) {
                if (Array.isArray(value)) {
                    value.forEach((item) => data.append(`${key}[]`, item.value));
                } else {
                    data.append(key, value.toString());
                }
            }
        });

        // Append images
        const allImages = [thumbnailImage, displayImage, bannerImage, ...slideImages];
        allImages.forEach((image) => {
            if (image) {
                if (image.isNew && image.file) {
                    data.append("images[]", image.file);
                }
                data.append(
                    "image_data[]",
                    JSON.stringify({
                        id: image.apiId,
                        type: image.type,
                        rank: image.rank,
                        isDeleted: image.isDeleted,
                        isNew: image.isNew,
                    })
                );
            }
        });
        try {
            await productService.updateProductTag(productTagId, data);
            onSelectedProductsChange([]);
            fetchProducts(currentPage, itemsPerPage, searchTerm);
            showSuccessToast(translations["Record Successfully Saved"]);
        } catch (error) {
            showErrorToast(translations["Failed to save product."] || "Failed to save product.");
        }
    };

    const handleAdd = async () => {
        if (selectedProductsPopup.length === 0) {
            showErrorToast(translations["Please click checkbox to select row"]);
            return;
        }
        try {
            const formData = new FormData();
            selectedProductsPopup.forEach((pid) => formData.append("product_ids[]", pid.toString()));
            const response = await productService.insertNewProductTag(productTagId, formData);
            if (!response.success) {
                showErrorToast(translations["Product Code Exist"]);
                return;
            }
            await localStorage.removeItem(`cached-tagging-details-${productTagId}`);
            const data = await productService.getTaggingDetails(productTagId);
            setTaggingDetailsMap((prev) => ({ ...prev, [productTagId]: data }));
            setSelectedProductsPopup([]);
            showSuccessToast("Record Successfully Saved");
        } catch (error) {
            showErrorToast("Failed to save product.");
        }
    };
    // Edit Information Modal
    const renderEditInformation = () => {
        if (!showEditInfo) return null;
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-70">
                <div className="bg-[#19191c] rounded-sm border border-[#ffffff1a] w-full h-full min-h-screen flex flex-col">
                    {/* Header */}
                    <div className="flex items-center justify-between p-3 border-b border-[#ffffff1a]">
                        <div className="flex items-center space-x-4">
                            <h2 className="text-xl font-bold text-white">{translations["Tagging"]}</h2>
                        </div>
                        <div className="flex items-center space-x-4">
                            <button onClick={() => setShowEditInfo(false)} className="p-2 hover:bg-gray-700 rounded-lg transition-colors">
                                <X className="h-6 w-6 text-white" />
                            </button>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-auto p-6">
                        <div className="p-6">
                            {/* Product Tag Product Code and Title */}
                            <fieldset className="border-[1px] border-[#ffffff1a] rounded-lg p-4 space-y-4 mb-2">
                                <div className="grid grid-cols-3 gap-6">
                                    <div className="flex items-center space-x-4">
                                        <label className="w-32 text-gray-400 text-sm">{translations["Product Code"]}</label>
                                        <input
                                            type="text"
                                            value={formData.product_code}
                                            onChange={(e) => {
                                                const value = e.target.value;
                                                setFormData((prev) => ({ ...prev, product_code: value }));
                                            }}
                                            className="flex-1 px-3 py-2 border-[1px] border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm"
                                        />
                                        <input
                                            type="hidden"
                                            value={formData.product_code}
                                            onChange={(e) => {
                                                const value = e.target.value;
                                                setFormData((prev) => ({ ...prev, product_code: value }));
                                            }}
                                            className="flex-1 px-3 py-2 border-[1px] border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm"
                                        />
                                    </div>
                                    <div className="flex items-center space-x-4">
                                        <label className="w-32 text-gray-400 text-sm">{translations["Product Name"]}</label>
                                        <input
                                            type="text"
                                            hidden={lang === "cn"}
                                            value={formData.product_title_en}
                                            onChange={(e) => {
                                                const value = e.target.value;
                                                setFormData((prev) => ({ ...prev, product_title_en: value }));
                                            }}
                                            className="flex-1 px-3 py-2 border-[1px] border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm"
                                        />
                                        <input
                                            type="text"
                                            hidden={lang === "en"}
                                            value={formData.product_title_cn}
                                            onChange={(e) => {
                                                const value = e.target.value;
                                                setFormData((prev) => ({ ...prev, product_title_cn: value }));
                                            }}
                                            className="flex-1 px-3 py-2 border-[1px] border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm"
                                        />
                                    </div>
                                    <div className="flex items-center space-x-4">
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={Number(formData.is_tnt) === 1}
                                                onChange={(e) => {
                                                    const isChecked = e.target.checked ? 1 : 0;
                                                    setFormData({ ...formData, is_tnt: isChecked });
                                                }}
                                                className="sr-only peer"
                                            />
                                            <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:bg-green-600 transition-colors duration-200"></div>
                                            <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform duration-200 transform peer-checked:translate-x-full"></div>
                                        </label>
                                        <div>
                                            <span className="text-[#ffffffcc] text-custom-sm font-medium">
                                                {translations["Publish"]} : {translations["ToyNToys"]}
                                            </span>
                                            <span className={`text-sm ml-2 ${Number(formData?.is_tnt) === 1 ? "text-green-400" : "text-red-400"}`}>
                                                {Number(formData?.is_tnt) === 1 ? translations["Active"] : translations["In-Active"]}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </fieldset>
                            {/* Product Thumbnail and Display */}
                            <fieldset className="border-[1px] border-[#ffffff1a] rounded-lg p-4 space-y-4 mb-2">
                                <div className="grid grid-cols-12 gap-6 mb-8 items-start">
                                    {/* Product Thumbnail Label */}
                                    <div className="col-span-2">
                                        <h3 className="text-[#ffffffcc] text-custom-sm text-lg mb-4">{translations["Product Thumbnail"]}</h3>
                                        <p className="text-gray-400 text-sm mb-2">480 x 480:</p>
                                    </div>

                                    {/* Product Thumbnail Image/Drop */}
                                    <div className="col-span-4 h-[472px]">
                                        {thumbnailImage && !thumbnailImage.isDeleted ? (
                                            <div className="relative h-[472px]">
                                                <img
                                                    src={getImageUrl(thumbnailImage)}
                                                    alt="Product Thumbnail"
                                                    className="w-full h-[472px] object-cover rounded-lg"
                                                    onError={(e) => {
                                                        const target = e.target as HTMLImageElement;
                                                        target.src = "https://tnt2.simplify.cool/images/no-image-min.jpg";
                                                    }}
                                                />
                                                <button
                                                    onClick={() => {
                                                        setThumbnailImage((prev) => (prev ? { ...prev, isDeleted: true } : null));
                                                    }}
                                                    className="absolute top-2 right-2 p-1 bg-red-600 text-[#ffffffcc] text-custom-sm rounded-full hover:bg-red-700"
                                                >
                                                    <X className="h-4 w-4" />
                                                </button>
                                            </div>
                                        ) : (
                                            <div
                                                {...thumbnailDropzone.getRootProps()}
                                                className={`border-2 h-[472px] border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors h-full flex flex-col items-center justify-center ${
                                                    thumbnailDropzone.isDragActive ? "border-cyan-500 bg-cyan-500/10" : "border-gray-600 hover:border-gray-500"
                                                }`}
                                            >
                                                <input {...thumbnailDropzone.getInputProps()} />
                                                <Upload className="h-12 w-12 text-gray-400 mb-4" />
                                                <p className="text-gray-400">{translations["Click to Upload or Drag n Drop"]}</p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Product Display Label */}
                                    <div className="col-span-2">
                                        <h3 className="text-[#ffffffcc] text-custom-sm text-lg mb-4">{translations["Product Display"]}</h3>
                                        <p className="text-gray-400 text-sm mb-2">720 x 540:</p>
                                    </div>

                                    {/* Product Display Image/Drop */}
                                    <div className="col-span-4 h-[350px]">
                                        {displayImage && !displayImage.isDeleted ? (
                                            <div className="relative h-[350px]">
                                                <img
                                                    src={getImageUrl(displayImage)}
                                                    alt="Product Display"
                                                    className="w-full h-[350px] object-cover rounded-lg"
                                                    onError={(e) => {
                                                        const target = e.target as HTMLImageElement;
                                                        target.src = "https://tnt2.simplify.cool/images/no-image-min.jpg";
                                                    }}
                                                />
                                                <button
                                                    onClick={() => {
                                                        setDisplayImage((prev) => (prev ? { ...prev, isDeleted: true } : null));
                                                    }}
                                                    className="absolute top-2 right-2 p-1 bg-red-600 text-[#ffffffcc] text-custom-sm rounded-full hover:bg-red-700"
                                                >
                                                    <X className="h-4 w-4" />
                                                </button>
                                            </div>
                                        ) : (
                                            <div
                                                {...displayDropzone.getRootProps()}
                                                className={`border-2 h-[350px] border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors h-full flex flex-col items-center justify-center ${
                                                    displayDropzone.isDragActive ? "border-cyan-500 bg-cyan-500/10" : "border-gray-600 hover:border-gray-500"
                                                }`}
                                            >
                                                <input {...displayDropzone.getInputProps()} />
                                                <Upload className="h-12 w-12 text-gray-400 mb-4" />
                                                <p className="text-gray-400">{translations["Click to Upload or Drag n Drop"]}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </fieldset>
                            {/* Product Slides */}
                            <fieldset className="border-[1px] border-[#ffffff1a] rounded-lg p-4 space-y-4 mb-2">
                                <div className="mb-8">
                                    <div className="grid grid-cols-12 gap-6 items-start">
                                        {/* Product Slides Label */}
                                        <div className="col-span-2">
                                            <h3 className="text-[#ffffffcc] text-custom-sm text-lg mb-2">{translations["Product Slides"]}</h3>
                                            <p className="text-gray-400 text-sm mb-2">({translations["Max 20 Images"]})</p>
                                            <p className="text-gray-400 text-sm">
                                                {translations["Current Images"]}: {slideImages.filter((img) => !img.isDeleted).length}
                                            </p>
                                        </div>

                                        {/* Upload Dropzone */}
                                        <div className="col-span-2">
                                            <div
                                                {...slidesDropzone.getRootProps()}
                                                className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors h-32 flex flex-col items-center justify-center ${
                                                    slidesDropzone.isDragActive ? "border-cyan-500 bg-cyan-500/10" : "border-gray-600 hover:border-gray-500"
                                                }`}
                                            >
                                                <input {...slidesDropzone.getInputProps()} />
                                                <Upload className="h-8 w-8 text-gray-400 mb-2" />
                                                <p className="text-gray-400 text-xs">{translations["Click to Upload or Drag n Drop"]}</p>
                                            </div>
                                        </div>

                                        {/* Horizontal Slider */}
                                        <div className="col-span-8">
                                            {slideImages.filter((img) => !img.isDeleted).length > 0 ? (
                                                <div className="relative">
                                                    <div className="flex space-x-3 overflow-x-auto pb-2">
                                                        {slideImages
                                                            .filter((img) => !img.isDeleted)
                                                            .map((image, index) => (
                                                                <div
                                                                    key={image.id}
                                                                    draggable
                                                                    onDragStart={(e) => handleDragStart(e, index)}
                                                                    onDragOver={handleDragOver}
                                                                    onDrop={(e) => handleDrop(e, index)}
                                                                    onDragEnd={handleDragEnd}
                                                                    className={`relative flex-shrink-0 w-32 h-32 rounded-lg overflow-hidden border-2 cursor-move transition-all ${
                                                                        draggedIndex === index ? "border-cyan-500 opacity-50" : "border-gray-600 hover:border-gray-500"
                                                                    }`}
                                                                >
                                                                    {/* Drag Handle */}
                                                                    <div className="absolute top-1 left-1 z-10 p-1 bg-black bg-opacity-50 rounded">
                                                                        <GripVertical className="h-3 w-3 text-white" />
                                                                    </div>

                                                                    {/* Image */}
                                                                    <img
                                                                        src={getImageUrl(image)}
                                                                        alt={`Slide ${index + 1}`}
                                                                        className="w-full h-full object-cover"
                                                                        onError={(e) => {
                                                                            const target = e.target as HTMLImageElement;
                                                                            target.src = "https://tnt2.simplify.cool/images/no-image-min.jpg";
                                                                        }}
                                                                    />

                                                                    {/* Remove Button */}
                                                                    <button
                                                                        onClick={() => removeSlideImage(image.id)}
                                                                        className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors"
                                                                    >
                                                                        <X className="h-3 w-3" />
                                                                    </button>

                                                                    {/* Index Number */}
                                                                    <div className="absolute bottom-1 left-1 px-1 py-0.5 bg-black bg-opacity-70 text-white text-xs rounded">{index + 1}</div>
                                                                </div>
                                                            ))}
                                                    </div>

                                                    {/* Drag Instructions */}
                                                    <p className="text-gray-400 text-xs mt-2 flex items-center">
                                                        <Move className="h-3 w-3 mr-1" />
                                                        Drag images to reorder
                                                    </p>
                                                </div>
                                            ) : (
                                                <div className="h-32 flex items-center justify-center border-2 border-dashed border-gray-600 rounded-lg">
                                                    <p className="text-gray-400 text-sm">{translations["Image"]}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </fieldset>
                            {/* Product Banner */}
                            <fieldset className="border-[1px] border-[#ffffff1a] rounded-lg p-4 space-y-4 mb-2">
                                <div className="grid grid-cols-12 gap-6 items-start">
                                    {/* Product Banner Label */}
                                    <div className="col-span-2">
                                        <h3 className="text-[#ffffffcc] text-custom-sm text-lg mb-4">{translations["Product Banner"]}</h3>
                                        <p className="text-gray-400 text-sm mb-2">1920 x 500:</p>
                                    </div>

                                    {/* Product Banner Image/Drop */}
                                    <div className="col-span-10 h-[330px]">
                                        {bannerImage && !bannerImage.isDeleted ? (
                                            <div className="relative h-[330px]">
                                                <img
                                                    src={getImageUrl(bannerImage)}
                                                    alt="Product Banner"
                                                    className="w-full h-[330px] object-cover rounded-lg "
                                                    onError={(e) => {
                                                        const target = e.target as HTMLImageElement;
                                                        target.src = "https://tnt2.simplify.cool/images/no-image-min.jpg";
                                                    }}
                                                />
                                                <button
                                                    onClick={() => {
                                                        setBannerImage((prev) => (prev ? { ...prev, isDeleted: true } : null));
                                                    }}
                                                    className="absolute top-2 right-2 p-1 bg-red-600 text-[#ffffffcc] text-custom-sm rounded-full hover:bg-red-700"
                                                >
                                                    <X className="h-4 w-4" />
                                                </button>
                                            </div>
                                        ) : (
                                            <div
                                                {...bannerDropzone.getRootProps()}
                                                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors h-[330px] flex flex-col items-center justify-center ${
                                                    bannerDropzone.isDragActive ? "border-cyan-500 bg-cyan-500/10" : "border-gray-600 hover:border-gray-500"
                                                }`}
                                            >
                                                <input {...bannerDropzone.getInputProps()} />
                                                <Upload className="h-8 w-8 text-gray-400 mb-2" />
                                                <p className="text-gray-400">{translations["Click to Upload or Drag n Drop"]}</p>
                                            </div>
                                        )}
                                    </div>
                                    <div className="col-span-2"></div>
                                    <div className="col-span-10">
                                        <div className="mt-1">
                                            <div className="flex items-center space-x-3 text-gray-400">
                                                <label className="relative inline-flex items-center cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={Number(formData.is_activate_banner) === 1}
                                                        onChange={(e) => {
                                                            const isChecked = e.target.checked ? 1 : 0;
                                                            setFormData({ ...formData, is_activate_banner: isChecked });
                                                        }}
                                                        className="sr-only peer"
                                                    />
                                                    <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:bg-green-600 transition-colors duration-200"></div>
                                                    <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform duration-200 transform peer-checked:translate-x-full"></div>
                                                </label>
                                                <div>
                                                    <span className="text-[#ffffffcc] text-custom-sm font-medium">{translations["Publish Image on Front Page"]}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </fieldset>
                        </div>
                    </div>
                    {/* Footer */}
                    <div className="p-2 border-t border-[#ffffff1a] flex justify-end space-x-2">
                        <button onClick={() => setShowEditInfo(false)} className="px-2 py-2 bg-gray-700 hover:bg-gray-600 rounded text-white transition">
                            {translations["Close"]}
                        </button>
                        <button onClick={() => handleSave()} className="px-2 py-2 bg-cyan-600 hover:bg-cyan-500 rounded text-white transition">
                            {translations["Save"]}
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    // Add Information Modal
    const renderAddInformation = () => {
        if (!showAddInfo) return null;
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-[#19191c] rounded-xl border border-[#ffffff1a] w-[60vw] flex flex-col">
                    {/* Header */}
                    <div className="flex items-center justify-between p-3 border-b border-[#ffffff1a]">
                        <div className="flex items-center space-x-4">
                            <h2 className="text-xl font-bold text-white">{translations["Tagging"]}</h2>
                        </div>
                        <div className="flex items-center space-x-4">
                            <button onClick={() => setShowAddInfo(false)} className="p-2 hover:bg-gray-700 rounded-lg transition-colors">
                                <X className="h-6 w-6 text-white" />
                            </button>
                        </div>
                    </div>
                    <div className="p-4 border-b flex-shrink-0" style={{ borderColor: "#404040" }}>
                        <div className="flex justify-between items-center">
                            <div className="flex items-center space-x-4">
                                <div className="relative">
                                    <input
                                        type="search"
                                        placeholder={translations["Search"]}
                                        value={searchTermPopup}
                                        onChange={(e) => {
                                            setSearchTermPopup(e.target.value);
                                            setCurrentPagePopup(1);
                                        }}
                                        className="pl-10 pr-4 py-2 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-sm"
                                        style={{ backgroundColor: "#2d2d30", borderColor: "#555555" }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                    {/* Content */}
                    <div className="p-2 flex-1 overflow-auto">
                        <div className="max-h-[calc(100vh-380px)] overflow-y-auto">
                            <table className="w-full">
                                <thead className="sticky top-0 z-[1]" style={{ backgroundColor: "#1f2132" }}>
                                    <tr className="border-b" style={{ borderColor: "#2d2d30" }}>
                                        <th className="w-[2%] text-left py-1 px-4 text-gray-400 text-sm w-12">
                                            <CustomCheckbox
                                                checked={selectedProductsPopup.length === productsPopup.length && productsPopup.length > 0}
                                                onChange={(checked) => handleSelectAllPopup(checked)}
                                                ariaLabel="Select all products"
                                            />
                                        </th>
                                        <th className="w-[20%] text-left py-2 px-4 text-gray-400 text-sm">{translations["Product Code"]}</th>
                                        <th className="w-[38%] text-left py-2 px-4 text-gray-400 text-sm">{translations["Product Name"]}</th>
                                        <th className="w-[20%] text-left py-2 px-4 text-gray-400 text-sm text-center">{translations["Preorder Start Date"]}</th>
                                        <th className="w-[20%] text-left py-2 px-4 text-gray-400 text-sm text-center">{translations["Preorder End Date"]}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredProductsPopup.map((productsPopup, index) => (
                                        <React.Fragment key={productsPopup.id || index}>
                                            <tr className={`border-b hover:bg-gray-700 hover:bg-opacity-30 transition-colors`} style={{ borderColor: "#40404042" }}>
                                                <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                                                    <div className="flex items-center">
                                                        <CustomCheckbox
                                                            checked={selectedProductsPopup.includes(productsPopup.id)}
                                                            onChange={(checked) => handleSelectProductPopup(productsPopup.id, checked)}
                                                            ariaLabel={`Select product ${productsPopup.product_code}`}
                                                        />
                                                    </div>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <div className="flex items-center space-x-3">
                                                        <div className="w-8 h-8 bg-gray-600 rounded-lg flex items-center justify-center">
                                                            <img
                                                                src={getImageUrlThumbnail(productsPopup.product_thumbnail)}
                                                                alt="Thumbnail"
                                                                className="w-full h-full object-cover"
                                                                onError={(e) => {
                                                                    (e.target as HTMLImageElement).src = "https://tnt2.simplify.cool/images/no-image-min.jpg";
                                                                }}
                                                            />
                                                        </div>
                                                        <div>
                                                            <div className="group flex items-center">
                                                                <p className="text-gray-300 text-custom-sm select-text">{productsPopup.product_code}</p>
                                                                <CopyToClipboard text={productsPopup.product_code} />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-3 px-4 text-gray-400 text-center text-custom-sm">
                                                    <div className="group flex items-center">
                                                        <p className="text-gray-400 text-custom-sm">{lang == "en" ? productsPopup.product_title_en : productsPopup.product_title_cn}</p>
                                                        <CopyToClipboard text={lang == "en" ? productsPopup.product_title_en : productsPopup.product_title_cn} />
                                                    </div>
                                                </td>
                                                <td className="py-3 px-4 text-gray-400 text-center text-custom-sm">{formatDate(productsPopup.preorder_end_date)}</td>
                                                <td className="py-3 px-4 text-gray-400 text-center text-custom-sm">{formatDate(productsPopup.preorder_start_date)}</td>
                                            </tr>
                                        </React.Fragment>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    {/* Footer with Pagination */}
                    <div className="p-2 border-t flex items-center justify-between" style={{ borderColor: "#404040" }}>
                        <div className="flex items-center space-x-1">
                            <MemoizedPagination currentPage={currentPagePopup} totalPages={totalPagesPopup} onPageChange={(page) => setCurrentPagePopup(page)} />
                            <MemoizedItemsPerPageSelector
                                value={itemsPerPagePopup}
                                onChange={(val: number) => {
                                    setItemsPerPagePopup(val);
                                    setCurrentPagePopup(1);
                                }}
                                options={pageSizeOptionsPopup}
                            />
                        </div>
                        <div className="p-2 border-[#ffffff1a] flex justify-end space-x-2">
                            <button onClick={() => setShowAddInfo(false)} className="px-2 py-2 bg-gray-700 hover:bg-gray-600 rounded text-white transition">
                                {translations["Close"]}
                            </button>
                            <button onClick={() => handleAdd()} className="px-2 py-2 bg-cyan-600 hover:bg-cyan-500 rounded text-white transition">
                                {translations["Add"]}
                            </button>
                        </div>
                    </div>
                    {/* Footer */}
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-0">
            {/* Main Content Card */}
            <div className="rounded-lg border shadow-sm" style={{ backgroundColor: "#19191c", borderColor: "#404040" }}>
                {/* Toolbar */}
                <div className="p-2 border-b flex-shrink-0" style={{ borderColor: "#404040" }}>
                    <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-4">
                            <div className="relative">
                                <input
                                    type="search"
                                    placeholder={translations["Search"]}
                                    value={searchTerm}
                                    onChange={(e) => {
                                        setSearchTerm(e.target.value);
                                        setCurrentPage(1);
                                    }}
                                    className="pl-10 pr-4 py-2 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-sm"
                                    style={{ backgroundColor: "#2d2d30", borderColor: "#555555" }}
                                />
                            </div>
                            <button
                                onClick={() => onChangeView("list")}
                                className="ml-2 px-3 py-2 border rounded-lg text-white transition-colors flex items-center space-x-px hover:bg-gray-600 text-sm"
                                style={{ backgroundColor: "#2d2d30", borderColor: "#2d2d30", marginLeft: "5px" }}
                            >
                                <span>{translations["Product List"]}</span>
                            </button>
                            <button
                                className="ml-2 px-3 py-2 border rounded-lg text-white transition-colors flex items-center space-x-px hover:bg-gray-600 text-sm"
                                style={{ backgroundColor: "#0891b2", borderColor: "#2d2d30", marginLeft: "5px" }}
                            >
                                <span>{translations["Tagging List"]}</span>
                            </button>
                            <button
                                onClick={() => onChangeView("archive")}
                                className="ml-2 px-3 py-2 border rounded-lg text-white transition-colors flex items-center space-x-px hover:bg-gray-600 text-sm"
                                style={{ backgroundColor: "#2d2d30", borderColor: "#2d2d30", marginLeft: "5px" }}
                            >
                                <span>{translations["Archive"]}</span>
                            </button>
                        </div>
                        <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-2">
                                <button onClick={handleDeleteSelected} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center space-x-2 text-sm">
                                    <span>{translations["Delete"]}</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                {/* Table */}
                <div className="overflow-x-auto flex-grow">
                    <div className="h-[calc(100vh-180px)] overflow-y-auto">
                        <table className="w-full">
                            <thead className="sticky top-0 z-[1]" style={{ backgroundColor: "#1f2132" }}>
                                <tr className="border-b" style={{ borderColor: "#2d2d30" }}>
                                    <th className="w-[3%] text-left py-1 px-4 text-gray-400 text-sm w-12"></th>
                                    <th className="w-[2%] text-left py-1 px-4 text-gray-400 text-sm w-12">
                                        <CustomCheckbox
                                            checked={selectedProducts.length === products.length && products.length > 0}
                                            onChange={(checked) => handleSelectAll(checked)}
                                            ariaLabel="Select all products"
                                        />
                                    </th>
                                    <th className="w-[25%] text-left py-2 px-4 text-gray-400 text-sm">{translations["Product"]}</th>
                                    <th className="w-[10%] text-left py-2 px-4 text-gray-400 text-sm text-center">{translations["Retail Price"]}</th>
                                    <th className="w-[10%] text-left py-2 px-4 text-gray-400 text-sm text-center">{translations["Preorder Price"]}</th>
                                    <th className="w-[10%] text-left py-2 px-4 text-gray-400 text-sm text-center">{translations["Deposit"]}</th>
                                    <th className="w-[10%] text-left py-2 px-4 text-gray-400 text-sm text-center">{translations["Preorder Start Date"]}</th>
                                    <th className="w-[10%] text-left py-2 px-4 text-gray-400 text-sm text-center">{translations["Preorder End Date"]}</th>
                                    <th className="w-[7%] text-left py-2 px-4 text-gray-400 text-sm text-center">{translations["Action"]}</th>
                                </tr>
                            </thead>
                            {loading ? (
                                <LoadingSpinnerTbody rowsCount={itemsPerPage} />
                            ) : (
                                <tbody>
                                    {filteredProducts.map((product, index) => (
                                        <React.Fragment key={product.id || index}>
                                            <tr
                                                className={`border-b hover:bg-gray-700 hover:bg-opacity-30 transition-colors ${
                                                    selectedProducts.includes(product.id as number) ? "bg-gray-700 bg-opacity-30" : ""
                                                }`}
                                                style={{ borderColor: "#40404042" }}
                                            >
                                                <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                                                    <button
                                                        onClick={() => handleToggleRow(product.id)}
                                                        className={`px-1 py-1 ${
                                                            expandedRows.includes(product.id) ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"
                                                        }  text-white rounded-lg transition-colors text-xs`}
                                                    >
                                                        {expandedRows.includes(product.id) ? <Minus size={16} /> : <Plus size={16} />}
                                                    </button>
                                                </td>
                                                <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                                                    <div className="flex items-center">
                                                        <CustomCheckbox
                                                            checked={selectedProducts.includes(product.id as number)}
                                                            onChange={(checked) => handleSelectProduct(product.id as number, checked)}
                                                            ariaLabel={`Select product ${product.product_code}`}
                                                        />
                                                    </div>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <div className="flex items-center space-x-3">
                                                        <div className="w-8 h-8 bg-gray-600 rounded-lg flex items-center justify-center">
                                                            <img
                                                                src={getImageUrlThumbnail(product.tagging_thumbnail)}
                                                                alt="Thumbnail"
                                                                className="w-full h-full object-cover"
                                                                onError={(e) => {
                                                                    (e.target as HTMLImageElement).src = "https://tnt2.simplify.cool/images/no-image-min.jpg";
                                                                }}
                                                            />
                                                        </div>
                                                        <div>
                                                            <div className="group flex items-center">
                                                                <p className="text-gray-300 text-custom-sm select-text">{product.product_code}</p>
                                                                <CopyToClipboard text={product.product_code} />
                                                            </div>
                                                            <div className="group flex items-center">
                                                                <p className="text-gray-400 text-custom-sm">{lang == "en" ? product.product_title_en : product.product_title_cn}</p>
                                                                <CopyToClipboard text={lang == "en" ? product.product_title_en : product.product_title_cn} />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-3 px-4 text-gray-400 text-center text-custom-sm">
                                                    {product.price_currency}
                                                    <br />
                                                    {formatCurrency(product.retail_price)}
                                                </td>
                                                <td className="py-3 px-4 text-gray-400 text-center text-custom-sm">
                                                    {product.price_currency}
                                                    <br />
                                                    {formatCurrency(product.retail_price)}
                                                </td>
                                                <td className="py-3 px-4 text-gray-400 text-center text-custom-sm">
                                                    {product.price_currency}
                                                    <br />
                                                    {formatCurrency(product.preorder_price)}
                                                </td>
                                                <td className="py-3 px-4 text-gray-400 text-center text-custom-sm">{formatDate(product.preorder_end_date)}</td>
                                                <td className="py-3 px-4 text-gray-400 text-center text-custom-sm">{formatDate(product.preorder_start_date)}</td>
                                                <td className="py-3 px-4 text-gray-400 text-center text-custom-sm">
                                                    <button
                                                        onClick={() => {
                                                            fetchProductImages(product.id);
                                                        }}
                                                        className="px-1 py-1 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors text-xs mr-2"
                                                    >
                                                        <Edit className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            fetchPreorderList(product.id);
                                                        }}
                                                        className="px-1 py-1 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors text-xs"
                                                    >
                                                        <Plus className="h-4 w-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                            {expandedRows.includes(product.id) && (
                                                <tr>
                                                    <td colSpan={10} className="py-3 px-4">
                                                        <table className="w-full" style={{ backgroundColor: "#060818" }}>
                                                            <thead className="sticky top-0 z-[1] py-1 px-4" style={{ backgroundColor: "#1f2132" }}>
                                                                <tr className="border-b" style={{ borderColor: "#2d2d30" }}>
                                                                    <th className="text-left py-2 px-4 text-gray-400 text-sm w-12">{translations["Products"]}</th>
                                                                    <th className="text-center py-2 px-4 text-gray-400 text-sm w-12">{translations["Retail Price"]}</th>
                                                                    <th className="text-center py-2 px-4 text-gray-400 text-sm w-12">{translations["Preorder Price"]}</th>
                                                                    <th className="text-center py-2 px-4 text-gray-400 text-sm w-12">{translations["Deposit"]}</th>
                                                                    <th className="text-center py-2 px-4 text-gray-400 text-sm w-12">{translations["Item Cost"]}</th>
                                                                    <th className="text-center py-2 px-4 text-gray-400 text-sm w-12">{translations["Action"]}</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {loadingDetails[product.id] ? (
                                                                    <tr>
                                                                        <td colSpan={6} className="py-3 px-4 text-center text-gray-400">
                                                                            {translations["Processing"]}...
                                                                        </td>
                                                                    </tr>
                                                                ) : (
                                                                    taggingDetailsMap[product.id]?.map((detail, i) => (
                                                                        <tr key={detail.id || i}>
                                                                            <td className="py-3 px-4">
                                                                                <div className="flex items-center space-x-3">
                                                                                    <div className="w-8 h-8 bg-gray-600 rounded-lg flex items-center justify-center">
                                                                                        <img
                                                                                            src={getImageUrlThumbnail(detail.thumbnail)}
                                                                                            alt="Thumbnail"
                                                                                            className="w-full h-full object-cover"
                                                                                            onError={(e) => {
                                                                                                (e.target as HTMLImageElement).src = "https://tnt2.simplify.cool/images/no-image-min.jpg";
                                                                                            }}
                                                                                        />
                                                                                    </div>
                                                                                    <div>
                                                                                        <div className="group flex items-center">
                                                                                            <p className="text-gray-300 text-custom-sm select-text">{detail.product_code || "-"}</p>
                                                                                            <CopyToClipboard text={detail.product_code} />
                                                                                        </div>
                                                                                        <div className="group flex items-center">
                                                                                            <p className="text-gray-400 text-custom-sm">
                                                                                                {lang === "en" ? detail.product_title_en : detail.product_title_cn || "-"}
                                                                                            </p>
                                                                                            <CopyToClipboard text={lang === "en" ? detail.product_title_en : detail.product_title_cn} />
                                                                                        </div>
                                                                                    </div>
                                                                                </div>
                                                                            </td>
                                                                            <td className="py-3 px-4 text-gray-400 text-center text-custom-sm">{formatCurrency(detail.retail_price)}</td>
                                                                            <td className="py-3 px-4 text-gray-400 text-center text-custom-sm">{formatCurrency(detail.preorder_price)}</td>
                                                                            <td className="py-3 px-4 text-gray-400 text-center text-custom-sm">{formatCurrency(detail.deposit)}</td>
                                                                            <td className="py-3 px-4 text-gray-400 text-center text-custom-sm">{formatCurrency(detail.item_cost)}</td>
                                                                            <td className="py-3 px-4 text-gray-400 text-center text-custom-sm">
                                                                                <button
                                                                                    onClick={(e) => handleDetailDelete(e, detail.id, product.id)}
                                                                                    key={detail.id}
                                                                                    className="px-1 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-xs"
                                                                                >
                                                                                    <Trash2 className="h-4 w-4" />
                                                                                </button>
                                                                            </td>
                                                                        </tr>
                                                                    ))
                                                                )}
                                                            </tbody>
                                                        </table>
                                                    </td>
                                                </tr>
                                            )}
                                        </React.Fragment>
                                    ))}
                                </tbody>
                            )}
                        </table>
                    </div>
                </div>

                {/* Footer with Pagination */}
                <div className="p-2 border-t flex items-center justify-between" style={{ borderColor: "#404040" }}>
                    <div className="flex items-center space-x-1">
                        <MemoizedPagination currentPage={currentPage} totalPages={totalPages} onPageChange={(page) => setCurrentPage(page)} />
                        <MemoizedItemsPerPageSelector
                            value={itemsPerPage}
                            onChange={(val: number) => {
                                setItemsPerPage(val);
                                setCurrentPage(1);
                            }}
                            options={pageSizeOptions}
                        />
                    </div>
                    <div className="flex items-center space-x-2">{/* Optional right side content */}</div>
                </div>
            </div>
            {renderEditInformation()}
            {renderAddInformation()}
        </div>
    );
};

export default ProductTagging;
