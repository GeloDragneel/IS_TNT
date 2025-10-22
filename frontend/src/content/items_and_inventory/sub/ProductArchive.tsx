import React, { useState, useEffect, useMemo } from "react";
import { productService, ApiProduct } from "@/services/productService";
import { useLanguage } from "@/context/LanguageContext";
import CustomCheckbox from "@/components/CustomCheckbox";
import { showAlert, showConfirm } from "@/utils/alert";
import Pagination from "@/components/Pagination";
import ItemsPerPageSelector from "@/components/ItemsPerPageSelector";
import CopyToClipboard from "@/components/CopyToClipboard";
import { showErrorToast } from "@/utils/toast";
import PusherEcho from "@/utils/echo";
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
        return "https://tnt2.simplify.cool/images/no-image-min.jpg";
    } else {
        return `http://localhost:8000/storage/${image}`;
    }
};

const MemoizedPagination = React.memo(Pagination);
const MemoizedItemsPerPageSelector = React.memo(ItemsPerPageSelector);

interface ProductArchiveProps {
    tabId: string;
    onProductSelect: (productId: number) => void;
    onChangeView: (view: "list" | "details" | "archive" | "tagging") => void; // <- NEW
    selectedProducts: number[];
    onSelectedProductsChange: (selected: number[]) => void;
    expandedRows: number[];
    onExpandedRowsChange: (expanded: number[]) => void;
}

const ProductArchive: React.FC<ProductArchiveProps> = ({ tabId, onProductSelect, onChangeView, selectedProducts, onSelectedProductsChange }) => {
    const { translations, lang } = useLanguage();
    const [products, setProducts] = useState<ApiProduct[]>([]);
    const [totalPages, setTotalPages] = useState(1);
    const safeLang = lang === "cn" ? "cn" : "en";
    const pageSizeOptions = useMemo(() => [15, 20, 50, -1], []);

    const [loading, setLoading] = useState(() => {
        const savedLoading = localStorage.getItem(`${tabId}-loading-archive`);
        return savedLoading !== null ? JSON.parse(savedLoading) : true;
    });

    const [currentPage, setCurrentPage] = useState(() => {
        const metaKey = `${tabId}-cached-meta`;
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
        const metaKey = `${tabId}-cached-meta`;
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
        const cached = localStorage.getItem(`${tabId}-cached-meta`);
        if (!cached) return "";
        try {
            const meta = JSON.parse(cached);
            return meta.search || "";
        } catch {
            return "";
        }
    });

    useEffect(() => {
        const channel = PusherEcho.channel("products-channel");

        channel.listen(".product-event", () => {
            fetchProducts(currentPage, itemsPerPage, searchTerm);
        });

        return () => {
            PusherEcho.leave("products-channel");
        };
    }, [currentPage, itemsPerPage, searchTerm, tabId]);

    useEffect(() => {
        fetchProducts(currentPage, itemsPerPage, searchTerm);
    }, [currentPage, itemsPerPage, searchTerm, tabId]);

    const fetchProducts = async (page = currentPage, perPage = itemsPerPage, search = "") => {
        try {
            // setLoading(true);
            const paginatedData = await productService.getArchiveProducts(page, perPage, search);
            setProducts(paginatedData.data);
            setTotalPages(paginatedData.last_page);
        } catch (err) {
            console.error("Error fetching products:", err);
        } finally {
            setLoading(false);
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

    // Handle Status Specification
    const statusMap: Record<string, { en: string; cn: string; color: string }> = {
        "pre-order": { en: "Pre-order", cn: "预订", color: "bg-amber-600 bg-opacity-20 text-amber-400" },
        "coming soon": { en: "Coming Soon", cn: "未出货", color: "bg-yellow-500 bg-opacity-20 text-yellow-300" },
        "partial received": { en: "Partial Received", cn: "部份已到", color: "bg-yellow-500 bg-opacity-20 text-yellow-300" },
        "in-stock": { en: "In-Stock", cn: "有货", color: "bg-emerald-600 bg-opacity-20 text-emerald-400" },
        "sold out": { en: "Sold Out", cn: "已售完", color: "bg-red-600 bg-opacity-20 text-red-400" },
        "on hold": { en: "On Hold", cn: "已售完", color: "bg-gray-500 bg-opacity-20 text-gray-300" },
        "no order": { en: "No Order", cn: "无订单", color: "bg-cyan-600 bg-opacity-20 text-cyan-300" },
        scheduled: { en: "Scheduled", cn: "准备中", color: "bg-cyan-600 bg-opacity-20 text-cyan-300" },
    };

    const productStatusLocalized = (status?: string, lang: "en" | "cn" = "en") => {
        const key = status?.toLowerCase() ?? "";
        return statusMap[key]?.[lang] || status || "-";
    };

    const getStatusColor = (status?: string) => {
        const key = status?.toLowerCase() ?? "";
        return statusMap[key]?.color || "bg-cyan-600 bg-opacity-20 text-cyan-400";
    };

    // Format currency
    const formatCurrency = (amount: number | undefined, currency = "SGD") => {
        if (amount === undefined || amount === null) return "-";
        return `${currency} ${Number(amount).toFixed(2)}`;
    };

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
            showAlert(translations["System Message"], translations["Record has been Deleted"], "success");
        } catch (err) {
            showAlert(translations["System Message"], translations["alert_message_18"], "error");
            console.error("Deletion failed:", err);
        }
    };
    const handleRestore = async () => {
        if (selectedProducts.length === 0) {
            showErrorToast(translations["Please click checkbox to select row"]);
            return;
        }
        const confirmed = await showConfirm(translations["System Message"], translations["Are you sure you want to delete selected items?"], translations["Delete"], translations["Cancel"]);

        if (!confirmed) return;
        try {
            await productService.deleteProducts(selectedProducts, "restore");
            setProducts((prev) => prev.filter((p) => !selectedProducts.includes(p.id!)));
            onSelectedProductsChange([]);
            fetchProducts(currentPage, itemsPerPage, searchTerm);
            const tabProductList = tabId.split("-").slice(0, 2).join("-");
            if (tabProductList) {
                localStorage.removeItem(tabProductList + "-product-list");
            }
            showAlert(translations["System Message"], translations["Record has been restored"] || "Record has been restored", "success");
        } catch (err) {
            showAlert(translations["System Message"], translations["alert_message_18"], "error");
        }
    };
    const handleRowClick = (e: React.MouseEvent, productId: number) => {
        // Prevent navigation if clicking on checkboxes or toggle switches
        const target = e.target as HTMLElement;
        if (target.closest("input") || target.closest("label") || target.closest("[data-copy-button]")) {
            return;
        }
        onProductSelect(productId);
    };
    return (
        <div className="space-y-6">
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
                                onClick={() => onChangeView("tagging")}
                                className="ml-2 px-3 py-2 border rounded-lg text-white transition-colors flex items-center space-x-px hover:bg-gray-600 text-sm"
                                style={{ backgroundColor: "#2d2d30", borderColor: "#2d2d30", marginLeft: "5px" }}
                            >
                                <span>{translations["Tagging List"]}</span>
                            </button>
                            <button
                                className="ml-2 px-3 py-2 border rounded-lg text-white transition-colors flex items-center space-x-px hover:bg-gray-600 text-sm"
                                style={{ backgroundColor: "#0891b2", borderColor: "#2d2d30", marginLeft: "5px" }}
                            >
                                <span>{translations["Archive"]}</span>
                            </button>
                        </div>
                        <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-2">
                                <button
                                    disabled={selectedProducts.length === 0}
                                    onClick={handleRestore}
                                    className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors flex items-center space-x-1 text-sm"
                                >
                                    <span>{translations["Restore"]}</span>
                                </button>
                                <button
                                    disabled={selectedProducts.length === 0}
                                    onClick={handleDeleteSelected}
                                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center space-x-2 text-sm"
                                >
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
                                    <th className="w-[2%] text-left py-1 px-4 text-gray-400 text-sm w-12">
                                        <CustomCheckbox
                                            checked={selectedProducts.length === products.length && products.length > 0}
                                            onChange={(checked) => handleSelectAll(checked)}
                                            ariaLabel="Select all products"
                                        />
                                    </th>
                                    <th className="w-[28%] text-left py-2 px-4 text-gray-400 text-sm">{translations["Product"]}</th>
                                    <th className="w-[10%] text-left py-2 px-4 text-gray-400 text-sm text-center">{translations["Retail Price"]}</th>
                                    <th className="w-[10%] text-left py-2 px-4 text-gray-400 text-sm text-center">{translations["Preorder Price"]}</th>
                                    <th className="w-[10%] text-left py-2 px-4 text-gray-400 text-sm text-center">{translations["Deposit"]}</th>
                                    <th className="w-[10%] text-left py-2 px-4 text-gray-400 text-sm text-center">{translations["Item Cost"]}</th>
                                    <th className="w-[9%] text-left py-2 px-4 text-gray-400 text-sm text-center">{translations["Status"]}</th>
                                    <th className="w-[7%] text-left py-2 px-4 text-gray-400 text-sm text-center">{translations["Qty"]}</th>
                                    <th className="w-[7%] text-left py-2 px-4 text-gray-400 text-sm text-center">{translations["ToyNToys"]}</th>
                                    <th className="w-[7%] text-left py-2 px-4 text-gray-400 text-sm text-center">{translations["Wholesale"]}</th>
                                </tr>
                            </thead>
                            {loading ? (
                                <LoadingSpinnerTbody rowsCount={itemsPerPage} />
                            ) : (
                                <tbody>
                                    {filteredProducts.length === 0 ? (
                                        <tr>
                                            <td colSpan={11} className="py-3 px-4 text-center text-gray-500">
                                                {translations["No Record Found"]}
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredProducts.map((product, index) => (
                                            <React.Fragment key={product.id || index}>
                                                <tr
                                                    onClick={(e) => handleRowClick(e, product.id)}
                                                    className={`clickable border-b hover:bg-gray-700 hover:bg-opacity-30 transition-colors cursor-pointer ${
                                                        selectedProducts.includes(product.id as number) ? "bg-gray-700 bg-opacity-30" : ""
                                                    }`}
                                                    style={{ borderColor: "#40404042" }}
                                                >
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
                                                                    src={getImageUrl(product.product_thumbnail)}
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
                                                    <td className="py-3 px-4 text-gray-400 text-center text-custom-sm">
                                                        {product.item_cost_currency}
                                                        <br />
                                                        {formatCurrency(product.item_cost)}
                                                    </td>
                                                    <td className="py-3 px-4 text-center">
                                                        <span className={`px-2 py-1 rounded-full text-xs text-custom-sm ${getStatusColor(product.product_status)}`}>
                                                            {productStatusLocalized(product.product_status, safeLang)}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 px-4 text-gray-400 text-center text-custom-sm">{product.inventry_qty || 0}</td>
                                                    <td className="py-3 px-4 text-gray-400 text-center text-custom-sm">{Number(product.is_tnt) === 1 ? "YES" : "NO"}</td>
                                                    <td className="py-3 px-4 text-gray-400 text-center text-custom-sm">{Number(product.is_wholesale) === 1 ? "YES" : "NO"}</td>
                                                </tr>
                                            </React.Fragment>
                                        ))
                                    )}
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
        </div>
    );
};

export default ProductArchive;
