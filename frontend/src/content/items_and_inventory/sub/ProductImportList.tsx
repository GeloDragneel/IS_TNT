import React, { useState, useEffect, useMemo } from "react";
import { productService, ApiProduct } from "@/services/productService";
import { useLanguage } from "@/context/LanguageContext";
import CustomCheckbox from "@/components/CustomCheckbox";
import { showConfirm } from "@/utils/alert";
import { showSuccessToast, showErrorToast } from "@/utils/toast";
import Pagination from "@/components/Pagination";
import ItemsPerPageSelector from "@/components/ItemsPerPageSelector";
import CopyToClipboard from "@/components/CopyToClipboard";
import PusherEcho from "@/utils/echo";
import { formatMoney } from "@/utils/globalFunction";
import ImageLightbox from "@/components/ImageLightbox"; // adjust the path
import { ExportReportSelector } from "@/utils/ExportReportSelector";

// Handle the Smooth skeleton loading
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
const getImageUrl = (image: string) => {
    if (!image) {
        return import.meta.env.VITE_BASE_URL + "/storage/products/no-image-min.jpg";
    } else {
        return import.meta.env.VITE_BASE_URL + `/storage/${image}`;
    }
};

const MemoizedPagination = React.memo(Pagination);
const MemoizedItemsPerPageSelector = React.memo(ItemsPerPageSelector);

interface ProductListProps {
    tabId: string;
    onProductSelect: (productId: number, saveType?: string) => void;
    onChangeView: (view: "list" | "details" | "archive" | "tagging") => void; // <- NEW
    onInitiateCopy: (sourceProductId: number, settings: any) => void;
    selectedProducts: number[];
    onSelectedProductsChange: (selected: number[]) => void;
    expandedRows: number[];
    onExpandedRowsChange: (expanded: number[]) => void;
}

const ProductList: React.FC<ProductListProps> = ({ tabId, onProductSelect, selectedProducts, onSelectedProductsChange }) => {
    const { translations, lang } = useLanguage();
    const [products, setProducts] = useState<ApiProduct[]>([]);
    const [totalPages, setTotalPages] = useState(1);
    const pageSizeOptions = useMemo(() => [15, 20, 50, -1], []);
    const [images, setImages] = useState([]);
    const [isLightboxOpen, setIsLightboxOpen] = useState(false);
    const [loading, setLoading] = useState(() => {
        const savedLoading = localStorage.getItem(`${tabId}-loading-product-imports`);
        return savedLoading !== null ? JSON.parse(savedLoading) : true;
    });
    const [currentPage, setCurrentPage] = useState(() => {
        const metaKey = `${tabId}-cached-meta-product-imports`;
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
        const metaKey = `${tabId}-cached-meta-product-imports`;
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
        const cached = localStorage.getItem(`${tabId}-cached-meta-product-imports`);
        if (!cached) return "";
        try {
            const meta = JSON.parse(cached);
            return meta.search || "";
        } catch {
            return "";
        }
    });

    // REALTIME

    useEffect(() => {
        const channel = PusherEcho.channel("products-channel");
        channel.listen(".product-event", () => {
            setTimeout(() => {
                fetchProducts(currentPage, itemsPerPage, searchTerm);
            }, 500);
        });
        return () => {
            PusherEcho.leave("products-channel");
        };
    }, [currentPage, itemsPerPage, searchTerm, tabId]);

    // ON LOAD LIST
    useEffect(() => {
        const productKey = `${tabId}-cached-products-imports`;
        const metaKey = `${tabId}-cached-meta-product-imports`;
        const mountKey = `${tabId}-mount-status-products`;

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
                localStorage.setItem(`${tabId}-loading-product-imports`, JSON.stringify(false));
                return;
            }
        } catch (err) {
            console.warn("Failed to parse cached meta:", err);
        }

        fetchProducts(currentPage, itemsPerPage, searchTerm);
    }, [currentPage, itemsPerPage, searchTerm, tabId]);

    const fetchProducts = async (page = currentPage, perPage = itemsPerPage, search = "") => {
        try {
            // setLoading(true);
            localStorage.setItem(`${tabId}-loading-product-imports`, JSON.stringify(true));

            const paginatedData = await productService.getAllProductsImport(page, perPage, search);

            setProducts(paginatedData.data);
            setTotalPages(paginatedData.last_page);

            localStorage.setItem(`${tabId}-cached-products-imports`, JSON.stringify(paginatedData.data));
            localStorage.setItem(
                `${tabId}-cached-meta-product-imports`,
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
            localStorage.setItem(`${tabId}-loading-product-imports`, JSON.stringify(false));
        }
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
    // Handle select all
    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            onSelectedProductsChange(products.map((p) => p.id).filter(Boolean) as number[]);
        } else {
            onSelectedProductsChange([]);
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
            await productService.deleteProducts(selectedProducts, "hard");
            setProducts((prev) => prev.filter((p) => !selectedProducts.includes(p.id!)));
            onSelectedProductsChange([]);
            fetchProducts(currentPage, itemsPerPage, searchTerm);
            showSuccessToast(translations["Record has been Deleted"]);
        } catch (err) {
            showErrorToast(translations["alert_message_18"]);
            console.error("Deletion failed:", err);
        }
    };

    const handlePublish = async () => {
        if (selectedProducts.length === 0) {
            showErrorToast(translations["Please click checkbox to select row"]);
            return;
        }
        const selectedItems = products.filter((product) => selectedProducts.includes(product.id));
        let count_inventory = 0;
        let count_retail = 0;
        let count_preorder = 0;
        let count_item_cost = 0;
        selectedItems.forEach((element) => {
            if (element.inventry_qty === 0) {
                count_inventory++;
            }
            if (element.retail_price === 0) {
                count_retail++;
            }
            if (element.preorder_price === 0) {
                count_preorder++;
            }
            if (element.item_cost === 0) {
                count_item_cost++;
            }
        });
        if (count_inventory > 0) {
            showErrorToast(translations["Inventory is zero"] || "Inventory is zero");
            return;
        }
        if (count_retail > 0) {
            showErrorToast(translations["Retail Price is required"] || "Retail Price is required");
            return;
        }
        if (count_preorder > 0) {
            showErrorToast(translations["Preorder Price is required"] || "Preorder Price is required");
            return;
        }
        if (count_item_cost > 0) {
            showErrorToast(translations["Item Cost is required"] || "Item Cost is required");
            return;
        }

        const confirmed = await showConfirm(
            translations["Publish Record"] || "Publish Record",
            translations["Are you sure you want to publish this record?"] || "Are you sure you want to publish this record?",
            translations["Publish"],
            translations["Cancel"]
        );

        if (!confirmed) return;

        try {
            const res = await productService.publishProductImports(selectedItems);
            if (res.token === "Error") {
                showErrorToast(res.message);
                return;
            }
            fetchProducts();
            onSelectedProductsChange([]);
            showSuccessToast(translations[res.message] || res.message);
        } catch (err) {
            showErrorToast(translations["alert_message_18"]);
            console.error("Deletion failed:", err);
        }

        console.log(selectedItems);
    };
    const handleRowClick = (e: React.MouseEvent, productId: number) => {
        // Prevent navigation if clicking on checkboxes or toggle switches
        const target = e.target as HTMLElement;
        if (target.closest("input") || target.closest("label") || target.closest("[data-copy-button]")) {
            return;
        }
        onProductSelect(productId, productId == 0 ? "new" : "edit");
    };
    const handleShowImages = async (productId: number) => {
        try {
            const cacheKey = `${productId}-cached-product-images`;
            const cachedImagesRaw = localStorage.getItem(cacheKey);
            let imageArray = [];
            if (cachedImagesRaw) {
                imageArray = JSON.parse(cachedImagesRaw);
            } else {
                imageArray = await productService.getProductImages(productId);
                localStorage.setItem(cacheKey, JSON.stringify(imageArray));
            }
            setImages(imageArray);
            setIsLightboxOpen(true);
        } catch (error) {
            console.error("Failed to load product images:", error);
        }
    };
    return (
        <div className="space-y-6">
            {/* Main Content Card */}
            <div className="rounded-lg border shadow-sm" style={{ backgroundColor: "#19191c", borderColor: "#404040" }}>
                {/* Toolbar */}
                <div className="p-4 border-b flex-shrink-0" style={{ borderColor: "#404040" }}>
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
                        </div>
                        <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-1">
                                <button
                                    disabled={selectedProducts.length === 0}
                                    onClick={handlePublish}
                                    className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors flex items-center space-x-1 text-sm"
                                >
                                    <span>{translations["Publish"]}</span>
                                </button>
                                <button
                                    onClick={(e) => handleRowClick(e, 0)}
                                    className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors flex items-center space-x-1 text-sm"
                                >
                                    <span>{translations["Add New"]}</span>
                                </button>
                                <button
                                    disabled={selectedProducts.length === 0}
                                    onClick={handleDeleteSelected}
                                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center space-x-1 text-sm"
                                >
                                    <span>{translations["Delete"]}</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto flex-grow">
                    <div className="h-[calc(100vh-215px)] overflow-y-auto">
                        <table className="w-full">
                            <thead className="sticky top-0 z-[1]" style={{ backgroundColor: "#1f2132" }}>
                                <tr className="border-b" style={{ borderColor: "#2d2d30" }}>
                                    <th className="w-[2%] text-left py-1 px-4 text-gray-400 text-sm w-12">
                                        <CustomCheckbox
                                            checked={selectedProducts.length === products.length && products.length > 0}
                                            onChange={(checked) => handleSelectAll(checked)}
                                            ariaLabel="Select all products"
                                        />
                                    </th>
                                    <th className="w-[28%] text-left py-2 px-4 text-gray-400 text-sm">{translations["Product"]}</th>
                                    <th className="w-[10%] text-left py-2 px-4 text-gray-400 text-sm text-center">{translations["Inventory Qty"]}</th>
                                    <th className="w-[10%] text-left py-2 px-4 text-gray-400 text-sm text-center">{translations["Retail Price"]}</th>
                                    <th className="w-[10%] text-left py-2 px-4 text-gray-400 text-sm text-center">{translations["Preorder Price"]}</th>
                                    <th className="w-[9%] text-left py-2 px-4 text-gray-400 text-sm text-center">{translations["Deposit"]}</th>
                                    <th className="w-[10%] text-left py-2 px-4 text-gray-400 text-sm text-center">{translations["Item Cost"]}</th>
                                </tr>
                            </thead>
                            {loading ? (
                                <LoadingSpinnerTbody rowsCount={itemsPerPage} />
                            ) : (
                                <tbody>
                                    {filteredProducts.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="py-4 px-4 text-center text-gray-400 text-sm border border-[#40404042]">
                                                {translations["No Record Found"] || "No Record Found"}
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredProducts.map((product, index) => (
                                            <tr
                                                key={product.id || index}
                                                onClick={(e) => handleRowClick(e, product.id)}
                                                className={`clickable border-b hover:bg-gray-700 hover:bg-opacity-30 transition-colors cursor-pointer ${
                                                    selectedProducts.includes(product.id as number) ? "bg-gray-700 bg-opacity-30" : ""
                                                }`}
                                                style={{ borderColor: "#40404042" }}
                                            >
                                                <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                                                    <CustomCheckbox
                                                        checked={selectedProducts.includes(product.id as number)}
                                                        onChange={(checked) => handleSelectProduct(product.id as number, checked)}
                                                        ariaLabel={`Select product ${product.product_code}`}
                                                    />
                                                </td>
                                                <td className="py-3 px-4">
                                                    <div className="flex items-center space-x-3">
                                                        <div
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleShowImages(product.id);
                                                            }}
                                                            className="w-8 h-8 bg-gray-600 rounded-lg flex items-center justify-center"
                                                        >
                                                            <img
                                                                src={getImageUrl(product.product_thumbnail)}
                                                                alt="Thumbnail"
                                                                className="w-full h-full object-cover"
                                                                onError={(e) => {
                                                                    (e.target as HTMLImageElement).src = `${import.meta.env.VITE_BASE_URL}/storage/products/no-image-min.jpg`;
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
                                                <td className="py-3 px-4 text-gray-400 text-center text-custom-sm">{product.inventry_qty}</td>
                                                <td className="py-3 px-4 text-gray-400 text-center text-custom-sm">
                                                    {product.price_currency}
                                                    <br />
                                                    {formatMoney(product.retail_price)}
                                                </td>
                                                <td className="py-3 px-4 text-gray-400 text-center text-custom-sm">
                                                    {product.price_currency}
                                                    <br />
                                                    {formatMoney(product.preorder_price)}
                                                </td>
                                                <td className="py-3 px-4 text-gray-400 text-center text-custom-sm">
                                                    {product.price_currency}
                                                    <br />
                                                    {formatMoney(product.deposit)}
                                                </td>
                                                <td className="py-3 px-4 text-gray-400 text-center text-custom-sm">
                                                    {product.item_cost_currency}
                                                    <br />
                                                    {formatMoney(product.item_cost)}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            )}
                        </table>
                    </div>
                </div>
                {/* Footer with Pagination */}
                <div className="p-4 border-t flex items-center justify-between" style={{ borderColor: "#404040" }}>
                    <div className="flex items-center space-x-2">
                        <MemoizedPagination currentPage={currentPage} totalPages={totalPages} onPageChange={(page) => setCurrentPage(page)} />
                        <MemoizedItemsPerPageSelector
                            value={itemsPerPage}
                            onChange={(val: number) => {
                                setItemsPerPage(val);
                                setCurrentPage(1);
                            }}
                            options={pageSizeOptions}
                        />
                        <ExportReportSelector formats={["odt", "ods", "xlsx"]} baseName="ProductList" ids={selectedProducts} language={lang} />
                    </div>
                    <div className="flex items-center space-x-1">{/* Optional right side content */}</div>
                </div>
                {isLightboxOpen && <ImageLightbox images={images} onClose={() => setIsLightboxOpen(false)} />}
            </div>
        </div>
    );
};

export default ProductList;
