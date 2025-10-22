import React, { useState, useEffect, useMemo, useRef } from "react";
import { supplierInvoiceService, ApiSupplierInvoice, DetailsExpanded } from "@/services/supplierInvoiceService";
import { ApiPreorder } from "@/services/preorderService";
import { useLanguage } from "@/context/LanguageContext";
import CustomCheckbox from "@/components/CustomCheckbox";
import Pagination from "@/components/Pagination";
import ItemsPerPageSelector from "@/components/ItemsPerPageSelector";
import CopyToClipboard from "@/components/CopyToClipboard";
import { Minus, Plus, X } from "lucide-react";
import PusherEcho from "@/utils/echo";
import { ExportReportSelector } from "@/utils/ExportReportSelector";
import { baseCurrency, formatDate, formatMoney } from "@/utils/globalFunction";
import { highlightMatch } from "@/utils/highlightMatch";
import { showErrorToast } from "@/utils/toast";
// Handle the Smooth skeleton loading
const LoadingSpinnerTbody: React.FC<{ rowsCount: number }> = ({ rowsCount }) => {
    return (
        <tbody>
            {Array.from({ length: rowsCount }).map((_, idx) => (
                <tr key={idx} className="bg-transparent-900 border-b border-gray-700">
                    <td className="text-center py-2 px-2">
                        <div className="h-6 bg-gray-700 rounded w-5 mx-auto"></div>
                    </td>
                    <td className="text-center py-2 px-2">
                        <div className="h-6 bg-gray-700 rounded w-5 mx-auto"></div>
                    </td>
                    <td className="text-center items-center py-2 px-2">
                        <div className="flex flex-col space-y-2 py-1 flex-1">
                            <div className="h-4 bg-gray-700 rounded w-full"></div>
                        </div>
                    </td>
                    <td className="text-center items-center py-2 px-2">
                        <div className="flex flex-col space-y-2 py-1 flex-1">
                            <div className="h-4 bg-gray-700 rounded w-full"></div>
                        </div>
                    </td>
                    <td className="text-center items-center py-2 px-2">
                        <div className="flex flex-col space-y-2 py-1 flex-1">
                            <div className="h-4 bg-gray-700 rounded w-full"></div>
                        </div>
                    </td>
                    <td className="text-center items-center py-2 px-2">
                        <div className="flex flex-col space-y-2 py-1 flex-1">
                            <div className="h-4 bg-gray-700 rounded w-full"></div>
                        </div>
                    </td>
                    <td className="text-center py-2 px-2">
                        <div className="h-6 bg-gray-700 rounded w-20 mx-auto"></div>
                    </td>
                    <td className="text-center py-2 px-2">
                        <div className="h-6 bg-gray-700 rounded w-20 mx-auto"></div>
                    </td>
                    <td className="text-center py-2 px-2">
                        <div className="h-6 bg-gray-700 rounded w-20 mx-auto"></div>
                    </td>
                </tr>
            ))}
        </tbody>
    );
};
const MemoizedPagination = React.memo(Pagination);
const MemoizedItemsPerPageSelector = React.memo(ItemsPerPageSelector);
interface PaidItemNotReceivedProps {
    tabId: string;
    onChangeView: (view: "list" | "details" | "paidItemNotReceived" | "unpaidItemReceived") => void;
}
interface MasterFooter {
    currency: string;
    total: number;
}
type FilterParams = {
    search?: string;
    productIds?: number[];
};
// localStorage.clear();
const PaidItemNotReceived: React.FC<PaidItemNotReceivedProps> = ({ tabId, onChangeView }) => {
    const { translations, lang } = useLanguage();
    const safeLang = lang === "cn" ? "cn" : "en";
    const [paidItemNotReceivedList, setPaidItemNotReceived] = useState<ApiSupplierInvoice[]>([]);
    const [preorderList, setPreorderList] = useState<ApiPreorder[]>([]);
    const [totalPages, setTotalPages] = useState(1);
    const [totalPages_Preorder, setTotalPages_Preorder] = useState(1);
    const pageSizeOptions = useMemo(() => [15, 20, 50, -1], []);
    const pageSizeOptions2 = useMemo(() => [10, 20, 50, -1], []);
    const [expanded_PaidItem, setExpandedRows] = useState<number[]>([]);
    const [preorderProductIds, setPreorderProductIds] = useState<number[]>([]);
    const [paidItemDetailsMap, setPODetailsMap] = useState<Record<number, DetailsExpanded[] | null>>({});
    const [showViewOrders, setShowViewOrders] = useState(false);
    const [selectedDetails, selectedPaidItem] = useState<number[]>([]);
    const inputRef = useRef<HTMLInputElement>(null);
    const [masterFooter, setMasterFooter] = useState<MasterFooter[]>([]); // Changed to array
    const [loading, setLoading] = useState(() => {
        const savedLoading = localStorage.getItem(`${tabId}-loading-paid-item`);
        return savedLoading !== null ? JSON.parse(savedLoading) : true;
    });

    const [currentPage, setCurrentPage] = useState(() => {
        const metaKey = `${tabId}-cached-meta-deposit-paid`;
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
        const metaKey = `${tabId}-cached-meta-deposit-paid`;
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
        const cached = localStorage.getItem(`${tabId}-cached-meta-deposit-paid`);
        if (!cached) return "";
        try {
            const meta = JSON.parse(cached);
            return meta.filters.search || "";
        } catch {
            return "";
        }
    });

    const [currentPage_Preorder, setCurrentPage_Preorder] = useState(() => {
        const metaKey = `${tabId}-cached-meta-preorder`;
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
    const [itemsPerPage_Preorder, setItemsPerPage_Preorder] = useState(() => {
        const metaKey = `${tabId}-cached-meta-preorder`;
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
    const [searchTerm_Preorder, setSearchTerm_Preorder] = useState(() => {
        const cached = localStorage.getItem(`${tabId}-cached-meta-preorder`);
        if (!cached) return "";
        try {
            const meta = JSON.parse(cached);
            return meta.filters.search || "";
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

    useEffect(() => {
        const channel_PO = PusherEcho.channel("po-channel");
        const channel_AP = PusherEcho.channel("ap-channel");
        const channel_GRN = PusherEcho.channel("grn-channel");

        channel_PO.listen(".po-event", () => {
            fetchPaidItemNotReceived(currentPage, itemsPerPage, searchTerm);
        });
        channel_AP.listen(".ap-event", () => {
            fetchPaidItemNotReceived(currentPage, itemsPerPage, searchTerm);
        });
        channel_GRN.listen(".grn-event", () => {
            fetchPaidItemNotReceived(currentPage, itemsPerPage, searchTerm);
        });

        return () => {
            PusherEcho.leave("po-channel");
            PusherEcho.leave("ap-channel");
            PusherEcho.leave("grn-channel");
        };
    }, [currentPage, itemsPerPage, searchTerm, tabId]);

    useEffect(() => {
        const expandedKey = tabId + "_expandedKey";
        const cachedExpandedKey = localStorage.getItem(expandedKey);

        if (cachedExpandedKey) {
            const parseExpanded: number[] = JSON.parse(cachedExpandedKey);
            let checkedIds: any = [];
            parseExpanded.forEach((tableId: number) => {
                checkedIds.push(tableId);
                const data = paidItemNotReceivedList.find((po) => po.id === tableId);
                // Save to state
                if (!data?.details) {
                    setPODetailsMap((prev) => ({ ...prev, [tableId]: null }));
                    return;
                }
                const details: DetailsExpanded[] = data.details;
                setPODetailsMap((prev) => ({ ...prev, [tableId]: details }));
            });
            setExpandedRows(checkedIds);
        }
    }, [tabId, paidItemNotReceivedList]);

    // ON LOAD LIST
    useEffect(() => {
        const SupplierKey = `${tabId}-cached-paid-item`;
        const metaKey = `${tabId}-cached-meta-deposit-paid`;
        const mountKey = `${tabId}-mount-status-deposit-paid`;

        const isFirstMount = sessionStorage.getItem(mountKey) !== "mounted";

        if (isFirstMount) {
            sessionStorage.setItem(mountKey, "mounted");
            fetchPaidItemNotReceived(currentPage, itemsPerPage, searchTerm);
            return;
        }

        const cachedSuppliersRaw = localStorage.getItem(SupplierKey);
        const cachedMetaRaw = localStorage.getItem(metaKey);

        if (!cachedSuppliersRaw || !cachedMetaRaw) {
            fetchPaidItemNotReceived(currentPage, itemsPerPage, searchTerm);
            return;
        }

        try {
            const cachedMeta = JSON.parse(cachedMetaRaw);
            const cachedSuppliers = JSON.parse(cachedSuppliersRaw);

            const isCacheValid = cachedMeta.page === currentPage && cachedMeta.perPage === itemsPerPage && JSON.stringify(cachedMeta.search) === JSON.stringify(searchTerm);

            if (isCacheValid) {
                setPaidItemNotReceived(cachedSuppliers);
                setTotalPages(cachedMeta.totalPages);
                setLoading(false);
                localStorage.setItem(`${tabId}-loading-paid-item`, JSON.stringify(false));
                return;
            }
        } catch (err) {
            console.warn("Failed to parse cached meta:", err);
        }

        fetchPaidItemNotReceived(currentPage, itemsPerPage, searchTerm);
    }, [currentPage, itemsPerPage, searchTerm, tabId]);

    useEffect(() => {
        const handleEsc = (event: any) => {
            if (event.key === "Escape") {
                if (showViewOrders) {
                    setShowViewOrders(false);
                }
            }
        };
        window.addEventListener("keydown", handleEsc);
        // Cleanup on unmount
        return () => {
            window.removeEventListener("keydown", handleEsc);
        };
    }, [showViewOrders]);

    useEffect(() => {
        const defaultFilters = {
            search: searchTerm_Preorder,
            productIds: preorderProductIds,
        };
        fetchPreorder(currentPage_Preorder, itemsPerPage_Preorder, defaultFilters);
    }, [currentPage_Preorder, itemsPerPage_Preorder, searchTerm_Preorder, preorderProductIds]);

    const fetchPaidItemNotReceived = async (page = currentPage, perPage = itemsPerPage, search = "") => {
        try {
            if (loading) {
                setLoading(true);
            }
            localStorage.setItem(`${tabId}-loading-paid-item`, JSON.stringify(true));
            const paginatedData = await supplierInvoiceService.getPaidItemNotReceived(page, perPage, search);
            setPaidItemNotReceived(paginatedData.data);
            setTotalPages(paginatedData.last_page);
            setMasterFooter(paginatedData.footer2);
            localStorage.setItem(`${tabId}-cached-paid-item`, JSON.stringify(paginatedData.data));
            localStorage.setItem(
                `${tabId}-cached-meta-deposit-paid`,
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
            localStorage.setItem(`${tabId}-loading-paid-item`, JSON.stringify(false));
        }
    };
    const fetchPreorder = async (page = currentPage_Preorder, perPage = itemsPerPage_Preorder, filters: FilterParams = { search: "" }) => {
        try {
            const paginatedData = await supplierInvoiceService.getAllPreorder(page, perPage, filters);
            setPreorderList(paginatedData.data);
            setTotalPages_Preorder(paginatedData.last_page);
            localStorage.setItem(`${tabId}-cached-preorder`, JSON.stringify(paginatedData.data));
            localStorage.setItem(
                `${tabId}-cached-meta-deposit-paid`,
                JSON.stringify({
                    page,
                    perPage,
                    filters,
                    totalPages: paginatedData.last_page,
                    totalItems: paginatedData.total,
                })
            );
        } catch (err) {
            console.error("Error fetching preorder:", err);
        } finally {
            localStorage.setItem(`${tabId}-loading-preorder`, JSON.stringify(false));
        }
    };
    const getStatusColor = (status?: number) => {
        return statusMap[status ?? -1]?.color || "bg-cyan-600 bg-opacity-20 text-cyan-400";
    };
    const statusMap: Record<string, { en: string; cn: string; color: string }> = {
        1: { en: "Confirmed", cn: "确认", color: "bg-cyan-600 bg-opacity-20 text-cyan-400" },
        2: { en: "Unconfirmed", cn: "未确认", color: "bg-yellow-500 bg-opacity-20 text-yellow-300" },
        3: { en: "New Update", cn: "更新", color: "bg-green-500 bg-opacity-20 text-green-300" },
    };
    const preorderStatusLocalized = (status: number, lang: "en" | "cn" = "en") => {
        const key = status;
        return statusMap[key]?.[lang] || status || "-";
    };
    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            const allIds = paidItemNotReceivedList?.map((p: any) => p.id);
            selectedPaidItem(allIds);
        } else {
            selectedPaidItem([]);
        }
    };
    const handleSelectSingle = (id: number, checked: boolean) => {
        if (checked) {
            selectedPaidItem((prev) => [...prev, id]);
        } else {
            selectedPaidItem((prev) => prev.filter((pid) => pid !== id));
        }
    };
    const handleToggleRow = async (tableId: number) => {
        const isExpanded = expanded_PaidItem.includes(tableId);
        const cachedKey = `cached-paidItem-details-${tableId}`;
        const expandedKey = tabId + "_expandedKey";
        if (isExpanded) {
            // Collapse row
            const updated = expanded_PaidItem.filter((id) => id !== tableId);
            setExpandedRows(updated);
            localStorage.setItem(expandedKey, JSON.stringify(updated));
        } else {
            // Expand row
            const updated = [...expanded_PaidItem, tableId];
            setExpandedRows(updated);
            localStorage.setItem(expandedKey, JSON.stringify(updated));
            try {
                const data = paidItemNotReceivedList.find((po) => po.id === tableId);
                console.log(data);
                if (!data?.details) {
                    console.error("No details found for this PO");
                    setPODetailsMap((prev) => ({ ...prev, [tableId]: null }));
                    return;
                }
                const details: DetailsExpanded[] = data.details;
                setPODetailsMap((prev) => ({ ...prev, [tableId]: details }));
                localStorage.setItem(cachedKey, JSON.stringify(details));
            } catch (error) {
                setPODetailsMap((prev) => ({ ...prev, [tableId]: null }));
            }
        }
    };
    const handleViewOrders = async () => {
        if (selectedDetails.length === 0) {
            showErrorToast(translations["Please click checkbox to select row"]);
            return;
        }
        const productIds: any = [];
        const selectedData = paidItemNotReceivedList.filter((product) => selectedDetails.includes(product.id));
        selectedData.forEach((element) => {
            const details: any = element.details;
            details.forEach((list: any) => {
                productIds.push(list.product_id);
            });
        });
        setPreorderProductIds(productIds);
        setShowViewOrders(true);
    };
    const renderViewOrders = () => {
        if (!showViewOrders) return null;
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-[#19191c] rounded-xl border border-[#ffffff1a] w-[90vw] h-auto flex flex-col">
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-[#ffffff1a]">
                        <div className="flex items-center space-x-4">
                            <h2 className="text-xl font-bold text-white">{translations["Orders List"]}</h2>
                        </div>
                        <div className="flex items-center space-x-4">
                            <button
                                onClick={() => {
                                    setShowViewOrders(false);
                                }}
                                className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                            >
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
                                        value={searchTerm_Preorder}
                                        onChange={(e) => {
                                            setSearchTerm_Preorder(e.target.value);
                                            setCurrentPage_Preorder(1);
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
                        <div className="max-h-[calc(100vh-435px)] overflow-y-auto">
                            <table className="w-full">
                                <thead className="sticky top-0 z-[1]" style={{ backgroundColor: "#1f2132" }}>
                                    <tr className="border-b" style={{ borderColor: "#2d2d30" }}>
                                        <th className="w-[6%] text-left py-2 px-2 text-gray-400 text-sm">{translations["Order Date"]}</th>
                                        <th className="w-[11%] text-left py-2 px-2 text-gray-400 text-sm">{translations["Customer"]}</th>
                                        <th className="w-[8%] text-left py-2 px-2 text-gray-400 text-sm">{translations["Source"]}</th>
                                        <th className="w-[7%] text-left py-2 px-2 text-gray-400 text-sm">{translations["Sales Person"]}</th>
                                        <th className="w-[17%] text-left py-2 px-2 text-gray-400 text-sm">{translations["Ordered Product"]}</th>
                                        <th className="w-[6%] text-center py-2 px-2 text-gray-400 text-sm">{translations["Price"]}</th>
                                        <th className="w-[4%] text-center py-2 px-2 text-gray-400 text-sm">{translations["Qty"]}</th>
                                        <th className="w-[7%] text-center py-2 px-2 text-gray-400 text-sm">{translations["Total"]}</th>
                                        <th className="w-[7%] text-center py-2 px-2 text-gray-400 text-sm">{translations["Base Total"]}</th>
                                        <th className="w-[7%] text-center py-2 px-2 text-gray-400 text-sm">{translations["Total Cost"]}</th>
                                        <th className="w-[7%] text-center py-2 px-2 text-gray-400 text-sm">{translations["Total Profit"]}</th>
                                        <th className="w-[7%] text-center py-2 px-2 text-gray-400 text-sm">{translations["Deposit"]}</th>
                                        <th className="w-[8%] text-center py-2 px-2 text-gray-400 text-sm">{translations["Status"]}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {preorderList.length === 0 ? (
                                        <tr>
                                            <td colSpan={14} className="py-4 px-4 text-center text-gray-400 text-sm border border-[#40404042]">
                                                {translations["No Record Found"] || "No Record Found"}
                                            </td>
                                        </tr>
                                    ) : (
                                        preorderList.map((product, index) => (
                                            <tr
                                                key={product.id || index}
                                                className={`clickable border-b hover:bg-gray-700 hover:bg-opacity-30 transition-colors cursor-pointer`}
                                                style={{ borderColor: "#40404042" }}
                                            >
                                                <td className="py-2 px-2 text-gray-400 text-left text-custom-sm">{formatDate(product.order_date, lang)}</td>
                                                <td className="py-2 px-2">
                                                    <div className="flex items-center space-x-3">
                                                        <div>
                                                            <div className="group flex items-center">
                                                                <p className="text-gray-300 text-custom-sm select-text">{highlightMatch(product.customer_code, searchTerm)}</p>
                                                                <CopyToClipboard text={product.customer_code} />
                                                            </div>
                                                            <div className="group flex items-center">
                                                                <p className="text-gray-400 text-custom-sm">
                                                                    {highlightMatch(lang === "en" ? product.account_name_en : product.account_name_cn, searchTerm)}
                                                                </p>
                                                                <CopyToClipboard text={lang === "en" ? product.account_name_en : product.account_name_cn} />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-2 px-2 text-gray-400 text-left text-custom-sm">
                                                    {product.customer_type === "RC" ? (lang === "en" ? product.source_en : product.source_cn) : translations["Wholesale"]}
                                                </td>
                                                <td className="py-2 px-2 text-gray-400 text-left text-custom-sm">{product.sales_person_name}</td>
                                                <td className="py-2 px-2">
                                                    <div className="flex items-center space-x-3">
                                                        <div>
                                                            <div className="group flex items-center">
                                                                <p className="text-gray-400 text-custom-sm">{highlightMatch(product.product_code, searchTerm)}</p>
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
                                                <td className="py-2 px-2 text-gray-400 text-center text-custom-sm">
                                                    {product.currency}
                                                    <br />
                                                    {formatMoney(product.price)}
                                                </td>
                                                <td className="py-2 px-2 text-gray-400 text-center text-custom-sm">{product.qty}</td>
                                                <td className="py-2 px-2 text-gray-400 text-center text-custom-sm">
                                                    {product.currency}
                                                    <br />
                                                    {formatMoney(product.total)}
                                                </td>
                                                <td className="py-2 px-2 text-gray-400 text-center text-custom-sm">
                                                    {product.e_total_sales_currency}
                                                    <br />
                                                    {formatMoney(product.e_total_sales)}
                                                </td>
                                                <td className="py-2 px-2 text-gray-400 text-center text-custom-sm">
                                                    {product.e_cost_total_currency}
                                                    <br />
                                                    {formatMoney(product.e_cost_total)}
                                                </td>
                                                <td className="py-2 px-2 text-gray-400 text-center text-custom-sm">
                                                    {product.e_profit_currency}
                                                    <br />
                                                    {formatMoney(product.e_profit)}
                                                </td>
                                                <td className="py-2 px-2 text-gray-400 text-center text-custom-sm">
                                                    {baseCurrency()}
                                                    <br />
                                                    {formatMoney(product.deposit)}
                                                </td>
                                                <td className="py-2 px-2 text-center">
                                                    <span className={`px-2 py-1 rounded-full text-xs text-custom-sm ${getStatusColor(product.order_status)}`}>
                                                        {preorderStatusLocalized(product.order_status, safeLang)}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    <div className="p-4 border-t flex items-center justify-between" style={{ borderColor: "#404040" }}>
                        <div className="flex items-center space-x-2">
                            <MemoizedPagination currentPage={currentPage_Preorder} totalPages={totalPages_Preorder} onPageChange={(page) => setCurrentPage_Preorder(page)} />
                            <MemoizedItemsPerPageSelector
                                value={itemsPerPage_Preorder}
                                onChange={(val: number) => {
                                    setItemsPerPage_Preorder(val);
                                    setCurrentPage_Preorder(1);
                                }}
                                options={pageSizeOptions2}
                            />
                            <select
                                className="px-1 py-1 border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-sm my-important-dropdown"
                                style={{ backgroundColor: "#2d2d30", borderColor: "#2d2d30" }}
                            >
                                <option value="PreorderList.odt">{translations["OpenOffice Writer Document (.odt)"]}</option>
                                <option value="PreorderList.ods">{translations["OpenOffice Calc Spreadsheet (.ods)"]}</option>
                                <option value="PreorderList.xlsx">{translations["Ms Excel SpreadSheet (.xlsx)"]}</option>
                            </select>
                            <button className="px-2 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors flex items-center space-x-1 text-sm">
                                <span>{translations["MCGenerate"]}</span>
                            </button>
                            <button className="px-2 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors flex items-center space-x-1 text-sm">
                                <span>{translations["buttontextcustomize"]}</span>
                            </button>
                        </div>
                        <div className="flex items-center space-x-1">
                            <button onClick={() => setShowViewOrders(false)} className="px-2 py-2 bg-gray-700 hover:bg-gray-600 rounded text-white transition">
                                {translations["Close"]}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
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
                            <button
                                onClick={() => onChangeView("list")}
                                className="ml-2 px-2 py-2 border rounded-lg text-white transition-colors flex items-center space-x-px hover:bg-cyan-600 text-sm"
                                style={{ backgroundColor: "#2d2d30", borderColor: "#2d2d30", marginLeft: "5px" }}
                            >
                                <span>{translations["Accounts Payable Invoice"]}</span>
                            </button>
                            <button
                                className="ml-2 px-2 py-2 border rounded-lg text-white transition-colors flex items-center space-x-px hover:bg-gray-600 text-sm"
                                style={{ backgroundColor: "#0891b2", borderColor: "#0891b2", marginLeft: "5px" }}
                            >
                                <span>{translations["Paid Item Not Received"]}</span>
                            </button>

                            <button
                                onClick={() => onChangeView("unpaidItemReceived")}
                                className="ml-2 px-2 py-2 border rounded-lg text-white transition-colors flex items-center space-x-px hover:bg-gray-600 text-sm"
                                style={{ backgroundColor: "#2d2d30", borderColor: "#2d2d30", marginLeft: "5px" }}
                            >
                                <span>{translations["Unpaid Items Received"]}</span>
                            </button>
                        </div>
                        <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-1">
                                <button
                                    disabled={selectedDetails.length === 0}
                                    onClick={handleViewOrders}
                                    className="px-2 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors flex items-center space-x-1 text-sm"
                                >
                                    <span>{translations["View Orders"]}</span>
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
                                    <th className="w-[3%] text-center py-1 px-4 text-gray-400 text-sm w-12"></th>
                                    <th className="w-[3%] text-left py-2 px-2 text-gray-400 text-sm">
                                        <CustomCheckbox
                                            checked={selectedDetails.length === paidItemNotReceivedList.length && paidItemNotReceivedList.length > 0}
                                            onChange={(checked) => handleSelectAll(checked)}
                                        />
                                    </th>
                                    <th className="w-[10%] text-left py-2 px-2 text-gray-400 text-sm">{translations["PV Date"]}</th>
                                    <th className="w-[12%] text-left py-2 px-2 text-gray-400 text-sm">{translations["A/P Invoice No."]}</th>
                                    <th className="w-[13%] text-left py-2 px-2 text-gray-400 text-sm">{translations["PV No"]}</th>
                                    <th className="w-[19%] text-left py-2 px-2 text-gray-400 text-sm">{translations["Supplier"]}</th>
                                    <th className="w-[10%] text-left py-2 px-2 text-gray-400 text-sm">{translations["PO Number"]}</th>
                                    <th className="w-[10%] text-center py-2 px-2 text-gray-400 text-sm">{translations["Total"]}</th>
                                    <th className="w-[10%] text-center py-2 px-2 text-gray-400 text-sm">{translations["Default Currency"]}</th>
                                </tr>
                            </thead>
                            {loading ? (
                                <LoadingSpinnerTbody rowsCount={itemsPerPage} />
                            ) : (
                                <tbody>
                                    {paidItemNotReceivedList.map((supplier, index) => (
                                        <React.Fragment key={supplier.id || index}>
                                            <tr
                                                key={supplier.id || index}
                                                className={`border-b hover:bg-gray-700 hover:bg-opacity-30 transition-colors ${
                                                    selectedDetails.includes(supplier.id as number) ? "bg-gray-700 bg-opacity-30" : ""
                                                }`}
                                                style={{ borderColor: "#40404042" }}
                                            >
                                                <td className="py-2 px-2 text-gray-400 text-center text-custom-sm">
                                                    <button
                                                        onClick={() => handleToggleRow(supplier.id)}
                                                        className={`px-1 py-1 ${
                                                            expanded_PaidItem.includes(supplier.id) ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"
                                                        } text-white rounded-lg transition-colors text-xs`}
                                                    >
                                                        {expanded_PaidItem.includes(supplier.id) ? <Minus size={16} /> : <Plus size={16} />}
                                                    </button>
                                                </td>
                                                <td className="py-2 px-2" onClick={(e) => e.stopPropagation()}>
                                                    <CustomCheckbox
                                                        checked={selectedDetails.includes(supplier.id as number)}
                                                        onChange={(checked) => handleSelectSingle(supplier.id as number, checked)}
                                                    />
                                                </td>
                                                <td className="py-2 px-2 text-gray-400 text-left text-custom-sm">
                                                    <div className="group flex items-center">
                                                        <p className="text-gray-400 text-custom-sm">{formatDate(supplier.pv_date, lang) || translations["N.A."]}</p>
                                                    </div>
                                                </td>
                                                <td className="py-2 px-2 text-gray-400 text-left text-custom-sm">
                                                    <div className="group flex items-center">
                                                        <p className="text-gray-400 text-custom-sm">{supplier.ap_number}</p>
                                                        <CopyToClipboard text={supplier.ap_number ?? ""} />
                                                    </div>
                                                </td>
                                                <td className="py-2 px-2 text-gray-400 text-left text-custom-sm">
                                                    <div className="group flex items-center">
                                                        <p className="text-gray-400 text-custom-sm">{supplier.pv_number}</p>
                                                        <CopyToClipboard text={supplier.pv_number || translations["N.A."]} />
                                                    </div>
                                                </td>
                                                <td className="py-2 px-2 text-gray-400 text-left text-custom-sm">
                                                    <div className="group flex items-center">
                                                        <p className="text-gray-400 text-custom-sm">{supplier.supplier_code}</p>
                                                        <CopyToClipboard text={supplier.supplier_code ?? ""} />
                                                    </div>
                                                    <div className="group flex items-center">
                                                        <p className="text-gray-400 text-custom-sm">{lang === "en" ? supplier.suppliername_en : supplier.suppliername_cn}</p>
                                                        <CopyToClipboard text={lang === "en" ? supplier.suppliername_en || "" : supplier.suppliername_cn || ""} />
                                                    </div>
                                                </td>
                                                <td className="py-2 px-2 text-gray-400 text-left text-custom-sm">
                                                    <div className="group flex items-center">
                                                        <p className="text-gray-400 text-custom-sm">{supplier.po_number}</p>
                                                        <CopyToClipboard text={supplier.po_number || translations["N.A."]} />
                                                    </div>
                                                </td>
                                                <td className="py-2 px-2 text-gray-400 text-center text-custom-sm">
                                                    {supplier.currency} <br></br> {formatMoney(supplier.total)}
                                                </td>
                                                <td className="py-2 px-2 text-gray-400 text-center text-custom-sm">
                                                    {baseCurrency()}
                                                    <br></br>
                                                    {formatMoney(supplier.base_total)}
                                                </td>
                                            </tr>
                                            {expanded_PaidItem.includes(supplier.id) && (
                                                <tr>
                                                    <td colSpan={9} className="py-2 px-2">
                                                        <table className="w-full" style={{ backgroundColor: "#060818" }}>
                                                            <thead className="sticky top-0 z-[1] py-1 px-4" style={{ backgroundColor: "#1f2132" }}>
                                                                <tr className="border-b" style={{ borderColor: "#2d2d30" }}>
                                                                    <th className="w-auto text-left py-2 px-2 text-gray-400 text-sm w-12">{translations["Product Code"]}</th>
                                                                    <th className="w-auto text-left py-2 px-2 text-gray-400 text-sm w-12">{translations["Product Name"]}</th>
                                                                    <th className="w-auto text-center py-2 px-2 text-gray-400 text-sm w-12">{translations["Qty"]}</th>
                                                                    <th className="w-auto text-center py-2 px-2 text-gray-400 text-sm w-12">{translations["Price"]}</th>
                                                                    <th className="w-auto text-center py-2 px-2 text-gray-400 text-sm w-12">{translations["Total"]}</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {paidItemDetailsMap[supplier.id] && paidItemDetailsMap[supplier.id]!.length > 0 ? (
                                                                    paidItemDetailsMap[supplier.id]!.map((detail, i) => (
                                                                        <tr key={detail.id || i}>
                                                                            <td className="py-2 px-2 text-gray-400 text-left text-custom-sm">
                                                                                <div className="group flex items-center">
                                                                                    <p className="text-gray-400 text-custom-sm">{highlightMatch(detail.product_code, searchTerm)}</p>
                                                                                    <CopyToClipboard text={detail.product_code} />
                                                                                </div>
                                                                            </td>
                                                                            <td className="py-2 px-2 text-gray-400 text-left text-custom-sm">
                                                                                <p className="text-gray-400 text-custom-sm">
                                                                                    {highlightMatch(lang === "en" ? detail.product_title_en : detail.product_title_cn, searchTerm)}
                                                                                </p>
                                                                            </td>
                                                                            <td className="py-2 px-2 text-gray-400 text-center text-custom-sm">{detail.qty}</td>
                                                                            <td className="py-2 px-2 text-gray-400 text-center text-custom-sm">
                                                                                {detail.currency} {formatMoney(detail.price)}
                                                                            </td>
                                                                            <td className="py-2 px-2 text-gray-400 text-center text-custom-sm">
                                                                                {detail.currency} {formatMoney(detail.total)}
                                                                            </td>
                                                                        </tr>
                                                                    ))
                                                                ) : (
                                                                    <tr>
                                                                        <td colSpan={5} className="py-2 px-2 text-center text-gray-400 text-sm">
                                                                            {translations["No Record Found"]}.
                                                                        </td>
                                                                    </tr>
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
                <div className="border-t flex items-center justify-between" style={{ borderColor: "#404040" }}>
                    <div className="p-4 flex items-center space-x-1">
                        <MemoizedPagination currentPage={currentPage} totalPages={totalPages} onPageChange={(page) => setCurrentPage(page)} />
                        <MemoizedItemsPerPageSelector
                            value={itemsPerPage}
                            onChange={(val: number) => {
                                setItemsPerPage(val);
                                setCurrentPage(1);
                            }}
                            options={pageSizeOptions}
                        />
                        <ExportReportSelector
                            formats={["odt", "ods", "xlsx"]}
                            baseName="PaidItemNotReceived"
                            ids={selectedDetails.length > 0 ? selectedDetails : paidItemNotReceivedList.map((p) => p.id)}
                            language={lang}
                        />
                    </div>
                    <div className="p-1 flex items-center space-x-1">
                        <div className="flex items-center space-x-4">
                            <table className="w-full">
                                <tbody>
                                    {masterFooter
                                        .reduce((rows: any[], item, index) => {
                                            if (index % 2 === 0) rows.push([]);
                                            rows[rows.length - 1].push(item);
                                            return rows;
                                        }, [])
                                        .map((row, rowIndex) => (
                                            <tr key={rowIndex}>
                                                {row.map((item: any, cellIndex: any) => (
                                                    <React.Fragment key={cellIndex}>
                                                        <td className="py-0 px-0 text-white-400 text-right text-custom-sm">
                                                            {item.currency === "BASE_RMB" ? `${translations["Total Default Currency"]} (${baseCurrency()}) :` : `(${item.currency}) :`}{" "}
                                                            {formatMoney(item.total)}
                                                        </td>
                                                        <td className="py-0 px-2">&nbsp;&nbsp;</td>
                                                    </React.Fragment>
                                                ))}
                                            </tr>
                                        ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
                {renderViewOrders()}
            </div>
        </div>
    );
};

export default PaidItemNotReceived;
