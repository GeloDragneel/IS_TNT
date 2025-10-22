import React, { useState, useEffect, useMemo, useRef } from "react";
import { preorderService, ApiPreorder } from "@/services/preorderService";
import { useLanguage } from "@/context/LanguageContext";
import { showSuccessToast, showErrorToast } from "@/utils/toast";
import { highlightMatch } from "@/utils/highlightMatch";
import Pagination from "@/components/Pagination";
import ItemsPerPageSelector from "@/components/ItemsPerPageSelector";
import CopyToClipboard from "@/components/CopyToClipboard";
import PusherEcho from "@/utils/echo";
import { ExportReportSelector } from "@/utils/ExportReportSelector";
import { baseCurrency, formatDate, formatMoney } from "@/utils/globalFunction";
// Handle the Smooth skeleton loading
// localStorage.clear();
interface LoadingSpinnerTbodyProps {
    rowsCount: number;
}
const MemoizedPagination = React.memo(Pagination);
const MemoizedItemsPerPageSelector = React.memo(ItemsPerPageSelector);
const LoadingSpinnerTbody: React.FC<LoadingSpinnerTbodyProps> = ({ rowsCount }) => {
    return (
        <tbody>
            {Array.from({ length: rowsCount }).map((_, idx) => (
                <tr key={idx} className="bg-transparent-900 border-b border-gray-800">
                    <td className="text-center py-1 px-4">
                        <div className="h-6 bg-gray-800 rounded w-5 mx-auto"></div>
                    </td>
                    <td className="py-1 px-4 text-gray-400 text-left text-custom-sm">
                        <div className="flex flex-col space-y-2 py-1 flex-1">
                            <div className="h-4 bg-gray-800 rounded w-16"></div>
                            <div className="h-4 bg-gray-800 rounded w-32"></div>
                        </div>
                    </td>
                    <td className="text-left py-1 px-4">
                        <div className="flex flex-col space-y-2 py-1 flex-1">
                            <div className="h-4 bg-gray-800 rounded w-16"></div>
                        </div>
                    </td>
                    <td className="text-center py-1 px-4">
                        <div className="flex flex-col space-y-2 py-1 flex-1">
                            <div className="h-4 bg-gray-800 rounded w-16"></div>
                        </div>
                    </td>
                    <td className="text-center py-1 px-4">
                        <div className="flex flex-col space-y-2 py-1 flex-1">
                            <div className="h-4 bg-gray-800 rounded w-16 mx-auto"></div>
                        </div>
                    </td>
                    <td className="text-center py-1 px-4">
                        <div className="flex flex-col space-y-2 py-1 flex-1">
                            <div className="h-4 bg-gray-800 rounded w-16 mx-auto"></div>
                        </div>
                    </td>
                    <td className="text-center py-1 px-4">
                        <div className="flex flex-col space-y-2 py-1 flex-1">
                            <div className="h-4 bg-gray-800 rounded w-16 mx-auto"></div>
                        </div>
                    </td>
                    <td className="text-center py-1 px-4">
                        <div className="flex flex-col space-y-2 py-1 flex-1">
                            <div className="h-4 bg-gray-800 rounded w-16 mx-auto"></div>
                        </div>
                    </td>
                    <td className="text-center py-1 px-4">
                        <div className="flex flex-col space-y-2 py-1 flex-1">
                            <div className="h-4 bg-gray-800 rounded w-16 mx-auto"></div>
                        </div>
                    </td>
                    <td className="text-center py-1 px-4">
                        <div className="flex flex-col space-y-2 py-1 flex-1">
                            <div className="h-4 bg-gray-800 rounded w-16 mx-auto"></div>
                        </div>
                    </td>
                    <td className="text-center py-1 px-4">
                        <div className="flex flex-col space-y-2 py-1 flex-1">
                            <div className="h-4 bg-gray-800 rounded w-16 mx-auto"></div>
                        </div>
                    </td>
                    <td className="text-center py-1 px-4">
                        <div className="flex flex-col space-y-2 py-1 flex-1">
                            <div className="h-4 bg-gray-800 rounded w-16 mx-auto"></div>
                        </div>
                    </td>
                </tr>
            ))}
        </tbody>
    );
};
// localStorage.clear();
interface UnsoldOrderProps {
    tabId: string;
    onPreordertSelect: (preorderId: number, saveType?: string) => void;
    onChangeView: (view: "list" | "details" | "unsold" | "performance") => void; // <- NEW
    onInitiateCopy: (sourcePreorderId: number, settings: any) => void;
    selectedPreorder: number[];
    onselectedPreorderChange: (selected: number[]) => void;
    expandedRows: number[];
    onExpandedRowsChange: (expanded: number[]) => void;
}
interface ApiUnsoldOrderFooter {
    base_total_cost: number;
}
const UnsoldOrder: React.FC<UnsoldOrderProps> = ({ tabId, onChangeView }) => {
    const { translations, lang } = useLanguage();
    const [products, setUnsoldOrder] = useState<ApiPreorder[]>([]);
    const [totalPages, setTotalPages] = useState(1);
    const pageSizeOptions = useMemo(() => [15, 20, 50, -1], []);
    const [unsoldOrderFooter2, setUnsoldOrderFooter2] = useState<ApiUnsoldOrderFooter | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const [loading, setLoading] = useState(() => {
        const savedLoading = localStorage.getItem(`${tabId}-loading-unsoldOrder`);
        return savedLoading !== null ? JSON.parse(savedLoading) : true;
    });
    const [altLang, setAltLanguage] = useState(lang);
    const [currentPage, setCurrentPage] = useState(() => {
        const metaKey = `${tabId}-cached-meta-unsoldOrder`;
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
        const metaKey = `${tabId}-cached-meta-unsoldOrder`;
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
        const cached = localStorage.getItem(`${tabId}-cached-meta-unsoldOrder`);
        if (!cached) return "";
        try {
            const meta = JSON.parse(cached);
            return meta.search || "";
        } catch {
            return "";
        }
    });
    useEffect(() => {
        const handleEscKey = (e: KeyboardEvent) => {
            if (e.key === "Escape" && document.activeElement === inputRef.current) {
                setSearchTerm("");
            }
        };
        window.addEventListener("keydown", handleEscKey);
        return () => {
            window.removeEventListener("keydown", handleEscKey);
        };
    }, []);
    // REALTIME
    useEffect(() => {
        const channel = PusherEcho.channel("products-channel");
        channel.listen(".product-event", () => {
            fetchUnsoldOrder(currentPage, itemsPerPage, searchTerm);
        });
        return () => {
            PusherEcho.leave("products-channel");
        };
    }, [currentPage, itemsPerPage, searchTerm, tabId]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Alt") {
                e.preventDefault(); // Prevent browser alt behavior (optional)
                setAltLanguage("cn");
            }
        };

        const handleKeyUp = (e: KeyboardEvent) => {
            if (e.key === "Alt") {
                e.preventDefault(); // Prevent browser alt behavior (optional)
                setAltLanguage("en");
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        window.addEventListener("keyup", handleKeyUp);

        return () => {
            window.removeEventListener("keydown", handleKeyDown);
            window.removeEventListener("keyup", handleKeyUp);
        };
    }, []);

    // ON LOAD LIST
    useEffect(() => {
        const productKey = `${tabId}-cached-usoldOrder`;
        const metaKey = `${tabId}-cached-meta-unsoldOrder`;
        const mountKey = `${tabId}-mount-status-unsoldOrder`;

        const isFirstMount = sessionStorage.getItem(mountKey) !== "mounted";

        if (isFirstMount) {
            sessionStorage.setItem(mountKey, "mounted");
            fetchUnsoldOrder(currentPage, itemsPerPage, searchTerm);
            return;
        }

        const cachedProductsRaw = localStorage.getItem(productKey);
        const cachedMetaRaw = localStorage.getItem(metaKey);

        if (!cachedProductsRaw || !cachedMetaRaw) {
            fetchUnsoldOrder(currentPage, itemsPerPage, searchTerm);
            return;
        }

        try {
            const cachedMeta = JSON.parse(cachedMetaRaw);
            const cachedProducts = JSON.parse(cachedProductsRaw);

            const isCacheValid = cachedMeta.page === currentPage && cachedMeta.perPage === itemsPerPage && JSON.stringify(cachedMeta.search) === JSON.stringify(searchTerm.search);

            if (isCacheValid) {
                setUnsoldOrder(cachedProducts);
                setTotalPages(cachedMeta.totalPages);
                setLoading(false);
                localStorage.setItem(`${tabId}-loading-unsoldOrder`, JSON.stringify(false));
                return;
            }
        } catch (err) {
            console.warn("Failed to parse cached meta:", err);
        }
        fetchUnsoldOrder(currentPage, itemsPerPage, searchTerm);
    }, [currentPage, itemsPerPage, tabId]);

    const fetchUnsoldOrder = async (page = currentPage, perPage = itemsPerPage, search: "") => {
        try {
            if (loading) {
                setLoading(true);
            }
            localStorage.setItem(`${tabId}-loading-unsoldOrder`, JSON.stringify(true));

            const paginatedData = await preorderService.getAllUnsoldOrder(page, perPage, search);
            setUnsoldOrder(paginatedData.data);
            setTotalPages(paginatedData.last_page);
            setUnsoldOrderFooter2(paginatedData.footer2);

            localStorage.setItem(`${tabId}-cached-usoldOrder`, JSON.stringify(paginatedData.data));
            localStorage.setItem(
                `${tabId}-cached-meta-unsoldOrder`,
                JSON.stringify({
                    page,
                    perPage,
                    search,
                    totalPages: paginatedData.last_page,
                    totalItems: paginatedData.total,
                })
            );
        } catch (err) {
            console.error("Error fetching preorder:", err);
        } finally {
            setLoading(false);
            localStorage.setItem(`${tabId}-loading-unsoldOrder`, JSON.stringify(false));
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
            product.po_number?.toLowerCase().includes(searchLower)
        );
    });
    // Handle individual select
    const handleHoldOnHold = async (type: string, index: number) => {
        const thirdItem = filteredProducts[index];
        var hold_qty = type === "Unhold" ? 0 : thirdItem["hold_qty"];
        await preorderService.holdOnHold(thirdItem["product_id"], hold_qty);
        setUnsoldOrder((prev) => {
            const updatedProducts = [...prev];
            updatedProducts[index] = {
                ...updatedProducts[index],
                hold_qty: hold_qty,
                hold_qty_orig: hold_qty,
            };
            return updatedProducts;
        });
        showSuccessToast(translations["Record Successfully Updated"]);
    };
    const handleHoldQtyChange = (index: number, value: number) => {
        setUnsoldOrder((prev) => {
            const updatedProducts = [...prev];
            updatedProducts[index] = {
                ...updatedProducts[index],
                hold_qty: value,
            };
            return updatedProducts;
        });
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
                                <span>{translations["Orders"]}</span>
                            </button>
                            <button
                                className="ml-2 px-2 py-2 border rounded-lg text-white transition-colors flex items-center space-x-px hover:bg-cyan-600 text-sm"
                                style={{ backgroundColor: "#0891b2", borderColor: "#0891b2", marginLeft: "5px" }}
                            >
                                <span>{translations["Unsold Orders"]}</span>
                            </button>
                            <button
                                onClick={() => onChangeView("performance")}
                                className="ml-2 px-2 py-2 border rounded-lg text-white transition-colors flex items-center space-x-px hover:bg-gray-600 text-sm"
                                style={{ backgroundColor: "#2d2d30", borderColor: "#2d2d30", marginLeft: "5px" }}
                            >
                                <span>{translations["SalesPerformance"]}</span>
                            </button>
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
                                    <th className="w-[19%] text-left py-2 px-2 text-gray-400 text-sm">{translations["Product2"]}</th>
                                    <th className="w-[8%] text-left py-2 px-2 text-gray-400 text-sm">{translations["PODate2"]}</th>
                                    <th className="w-[9%] text-left py-2 px-2 text-gray-400 text-sm">{translations["PONo2"]}</th>
                                    <th className="w-[8%] text-center py-2 px-2 text-gray-400 text-sm">{translations["POQty2"]}</th>
                                    <th className="w-[8%] text-center py-2 px-2 text-gray-400 text-sm">{translations["POSoldQty2"]}</th>
                                    <th className="w-[8%] text-center py-2 px-2 text-gray-400 text-sm">{translations["UnsoldQty2"]}</th>
                                    <th className="w-[8%] text-center py-2 px-2 text-gray-400 text-sm">{translations["HoldQty"]}</th>
                                    <th className="w-[8%] text-center py-2 px-2 text-gray-400 text-sm">{translations["Cost2"]}</th>
                                    <th className="w-[8%] text-center py-2 px-2 text-gray-400 text-sm">{translations["TotalCost2"]}</th>
                                    <th className="w-[8%] text-center py-2 px-2 text-gray-400 text-sm">{translations["Base Total"]}</th>
                                    <th className="w-[5%] text-left py-2 px-2 text-gray-400 text-sm">{translations["Action"]}</th>
                                </tr>
                            </thead>
                            {loading ? (
                                <LoadingSpinnerTbody rowsCount={itemsPerPage} />
                            ) : (
                                <tbody>
                                    {filteredProducts.map((product, index) => (
                                        <tr
                                            key={product.id || index}
                                            className={`border-b hover:bg-gray-700 hover:bg-opacity-30 transition-colors cursor-pointer`}
                                            style={{ borderColor: "#40404042" }}
                                        >
                                            <td className="py-2 px-2" onClick={(e) => e.stopPropagation()}>
                                                <img
                                                    src={`${import.meta.env.VITE_BASE_URL}/storage/${product.product_thumbnail ?? "products/no-image-min.jpg"}`}
                                                    alt="Thumbnail"
                                                    className="w-full h-full object-cover"
                                                    onError={(e) => {
                                                        (e.target as HTMLImageElement).src = `${import.meta.env.VITE_BASE_URL}/storage/products/no-image-min.jpg`;
                                                    }}
                                                />
                                            </td>
                                            <td className="py-2 px-2">
                                                <div className="flex items-center space-x-3">
                                                    <div>
                                                        <div className="group flex items-center">
                                                            <p className="text-gray-300 text-custom-sm select-text">{highlightMatch(product.product_code, searchTerm)}</p>
                                                            <CopyToClipboard text={product.product_code} />
                                                        </div>
                                                        <div className="group flex items-center">
                                                            <p className="text-gray-400 text-custom-sm">
                                                                {highlightMatch(lang === "en" ? product.product_title_en : product.product_title_cn, searchTerm)}
                                                            </p>
                                                            <CopyToClipboard text={lang === "en" ? product.product_title_en : product.product_title_cn} />
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-2 px-2 text-gray-400 text-left text-custom-sm">{formatDate(product.po_date, lang)}</td>
                                            <td className="py-2 px-2 text-gray-400 text-left text-custom-sm">
                                                <div className="group flex items-center">
                                                    <p className="text-gray-400 text-custom-sm select-text">{highlightMatch(product.po_number, searchTerm)}</p>
                                                    <CopyToClipboard text={product.po_number} />
                                                </div>
                                            </td>
                                            <td className="py-2 px-2 text-gray-400 text-center text-custom-sm">{product.po_qty}</td>
                                            <td className="py-2 px-2 text-gray-400 text-center text-custom-sm">{product.order_qty}</td>
                                            <td className="py-2 px-2 text-gray-400 text-center text-custom-sm">{product.unsold_qty}</td>
                                            <td className="py-2 px-2 text-gray-400 text-center text-custom-sm">
                                                <input
                                                    type="text"
                                                    value={product.hold_qty}
                                                    readOnly={product.hold_qty_orig > 0}
                                                    onChange={(e) => {
                                                        const raw = e.target.value.replace(/\D/g, ""); // Keep numbers only
                                                        const num = raw ? Number(raw) : 0;
                                                        const unsold_qty = product.unsold_qty;
                                                        if (num > unsold_qty) {
                                                            showErrorToast(translations["Please input number lower than or equal to"] + " " + unsold_qty);
                                                            return;
                                                        }
                                                        handleHoldQtyChange(index, num);
                                                    }}
                                                    placeholder="0"
                                                    className="w-20 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm text-center"
                                                />
                                            </td>
                                            <td className="py-2 px-2 text-gray-400 text-center text-custom-sm">
                                                {product.currency}
                                                <br />
                                                {formatMoney(Number(product.price))}
                                            </td>
                                            <td className="py-2 px-2 text-gray-400 text-center text-custom-sm">
                                                {product.currency}
                                                <br />
                                                {formatMoney(Number(product.total_cost))}
                                            </td>
                                            <td className="py-2 px-2 text-gray-400 text-center text-custom-sm">
                                                {baseCurrency()}
                                                <br />
                                                {formatMoney(Number(product.base_total_cost))}
                                            </td>
                                            <td className="py-2 px-2 text-left">
                                                <button
                                                    onClick={() => handleHoldOnHold(product.hold_qty_orig > 0 ? "Unhold" : "Hold", index)}
                                                    disabled={product.hold_qty === 0}
                                                    className="px-2 py-2 border rounded-lg text-white transition-colors flex items-center space-x-px hover:bg-gray-600 text-sm"
                                                    style={{ backgroundColor: "#0891b2", borderColor: "#0891b2" }}
                                                >
                                                    <span>{product.hold_qty_orig > 0 ? translations["Unhold"] : translations["Hold"]}</span>
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            )}
                            <tfoot>
                                {unsoldOrderFooter2 && (
                                    <tr className="border-b hover:bg-gray-700 hover:bg-opacity-30 transition-colors" style={{ borderColor: "#40404042" }}>
                                        <td className="py-1 px-1 text-gray-400 text-right text-custom-sm"></td>
                                        <td className="py-1 px-1 text-gray-400 text-right text-custom-sm"></td>
                                        <td className="py-1 px-1 text-gray-400 text-center text-custom-sm"></td>
                                        <td className="py-1 px-1 text-gray-400 text-center text-custom-sm"></td>
                                        <td className="py-1 px-1 text-gray-400 text-center text-custom-sm"></td>
                                        <td className="py-1 px-1 text-gray-400 text-center text-custom-sm"></td>
                                        <td className="py-1 px-1 text-gray-400 text-center text-custom-sm"></td>
                                        <td className="py-1 px-1 text-gray-400 text-center text-custom-sm"></td>
                                        <td className="py-1 px-1 text-gray-400 text-center text-custom-sm"></td>
                                        <td className="py-1 px-1 text-gray-400 text-center text-custom-sm"></td>
                                        <td className="py-1 px-1 text-gray-400 text-center text-custom-sm">
                                            {baseCurrency()}
                                            <br></br>
                                            {formatMoney(unsoldOrderFooter2.base_total_cost)}
                                        </td>
                                        <td className="py-1 px-1 text-gray-400 text-center text-custom-sm"></td>
                                    </tr>
                                )}
                            </tfoot>
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
                        <ExportReportSelector formats={["odt", "ods", "xlsx"]} baseName="UnsoldOrderList" ids={filteredProducts.map((p) => p.id)} language={altLang} />
                    </div>
                    <div className="flex items-center space-x-1">{/* Optional right side content */}</div>
                </div>
            </div>
        </div>
    );
};

export default UnsoldOrder;
