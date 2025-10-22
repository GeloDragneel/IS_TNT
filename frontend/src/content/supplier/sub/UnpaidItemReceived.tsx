import React, { useState, useEffect, useMemo, useRef } from "react";
import { supplierInvoiceService, ApiSupplierInvoice, DetailsExpanded } from "@/services/supplierInvoiceService";
import { useLanguage } from "@/context/LanguageContext";
import Pagination from "@/components/Pagination";
import ItemsPerPageSelector from "@/components/ItemsPerPageSelector";
import CopyToClipboard from "@/components/CopyToClipboard";
import { Minus, Plus } from "lucide-react";
import PusherEcho from "@/utils/echo";
import { ExportReportSelector } from "@/utils/ExportReportSelector";
import { baseCurrency, formatDate, formatMoney } from "@/utils/globalFunction";
import { highlightMatch } from "@/utils/highlightMatch";
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
interface UnpaidItemReceivedProps {
    tabId: string;
    onChangeView: (view: "list" | "details" | "paidItemNotReceived" | "unpaidItemReceived") => void;
}
interface MasterFooter {
    currency: string;
    total: number;
}
// localStorage.clear();
const UnpaidItemReceived: React.FC<UnpaidItemReceivedProps> = ({ tabId, onChangeView }) => {
    const { translations, lang } = useLanguage();
    const [unpaidItemReceivedList, setUnpaidItemReceived] = useState<ApiSupplierInvoice[]>([]);
    const [totalPages, setTotalPages] = useState(1);
    const pageSizeOptions = useMemo(() => [15, 20, 50, -1], []);
    const [expanded_PaidItem, setExpandedRows] = useState<number[]>([]);
    const [paidItemDetailsMap, setPODetailsMap] = useState<Record<number, DetailsExpanded[] | null>>({});
    const [showViewOrders, setShowViewOrders] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const [masterFooter, setMasterFooter] = useState<MasterFooter[]>([]); // Changed to array
    const [loading, setLoading] = useState(() => {
        const savedLoading = localStorage.getItem(`${tabId}-loading-unpaid-item`);
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
        const channel_PO = PusherEcho.channel("po-channel");
        const channel_AP = PusherEcho.channel("ap-channel");
        const channel_GRN = PusherEcho.channel("grn-channel");

        channel_PO.listen(".po-event", () => {
            fetchUnpaidItemReceived(currentPage, itemsPerPage, searchTerm);
        });
        channel_AP.listen(".ap-event", () => {
            fetchUnpaidItemReceived(currentPage, itemsPerPage, searchTerm);
        });
        channel_GRN.listen(".grn-event", () => {
            fetchUnpaidItemReceived(currentPage, itemsPerPage, searchTerm);
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
                const data = unpaidItemReceivedList.find((po) => po.index_id === tableId);
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
    }, [tabId, unpaidItemReceivedList]);

    // ON LOAD LIST
    useEffect(() => {
        const SupplierKey = `${tabId}-cached-unpaid-item`;
        const metaKey = `${tabId}-cached-meta-deposit-paid`;
        const mountKey = `${tabId}-mount-status-unpaid`;

        const isFirstMount = sessionStorage.getItem(mountKey) !== "mounted";

        if (isFirstMount) {
            sessionStorage.setItem(mountKey, "mounted");
            fetchUnpaidItemReceived(currentPage, itemsPerPage, searchTerm);
            return;
        }

        const cachedSuppliersRaw = localStorage.getItem(SupplierKey);
        const cachedMetaRaw = localStorage.getItem(metaKey);

        if (!cachedSuppliersRaw || !cachedMetaRaw) {
            fetchUnpaidItemReceived(currentPage, itemsPerPage, searchTerm);
            return;
        }

        try {
            const cachedMeta = JSON.parse(cachedMetaRaw);
            const cachedSuppliers = JSON.parse(cachedSuppliersRaw);

            const isCacheValid = cachedMeta.page === currentPage && cachedMeta.perPage === itemsPerPage && JSON.stringify(cachedMeta.search) === JSON.stringify(searchTerm);

            if (isCacheValid) {
                setUnpaidItemReceived(cachedSuppliers);
                setTotalPages(cachedMeta.totalPages);
                setLoading(false);
                localStorage.setItem(`${tabId}-loading-unpaid-item`, JSON.stringify(false));
                return;
            }
        } catch (err) {
            console.warn("Failed to parse cached meta:", err);
        }

        fetchUnpaidItemReceived(currentPage, itemsPerPage, searchTerm);
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

    const fetchUnpaidItemReceived = async (page = currentPage, perPage = itemsPerPage, search = "") => {
        try {
            if (loading) {
                setLoading(true);
            }
            localStorage.setItem(`${tabId}-loading-unpaid-item`, JSON.stringify(true));
            const paginatedData = await supplierInvoiceService.getUnpaidItemReceived(page, perPage, search);
            setUnpaidItemReceived(paginatedData.data);
            setTotalPages(paginatedData.last_page);
            setMasterFooter(paginatedData.footer2);
            localStorage.setItem(`${tabId}-cached-unpaid-item`, JSON.stringify(paginatedData.data));
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
            console.error("Error fetching list:", err);
        } finally {
            setLoading(false);
            localStorage.setItem(`${tabId}-loading-unpaid-item`, JSON.stringify(false));
        }
    };
    const handleToggleRow = async (tableId: number) => {
        const isExpanded = expanded_PaidItem.includes(tableId);
        const cachedKey = `cached-unpaidItem-details-${tableId}`;
        const expandedKey = tabId + "_expandedKey";
        if (isExpanded) {
            // Collapse row
            const updated = expanded_PaidItem.filter((index_id) => index_id !== tableId);
            setExpandedRows(updated);
            localStorage.setItem(expandedKey, JSON.stringify(updated));
        } else {
            // Expand row
            const updated = [...expanded_PaidItem, tableId];
            setExpandedRows(updated);
            localStorage.setItem(expandedKey, JSON.stringify(updated));
            try {
                const data = unpaidItemReceivedList.find((po) => po.index_id === tableId);
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
                                className="ml-2 px-2 py-2 border rounded-lg text-white transition-colors flex items-center space-x-px hover:bg-cyan-600 text-sm"
                                style={{ backgroundColor: "#2d2d30", borderColor: "#2d2d30", marginLeft: "5px" }}
                            >
                                <span>{translations["Accounts Payable Invoice"]}</span>
                            </button>
                            <button
                                onClick={() => onChangeView("paidItemNotReceived")}
                                className="ml-2 px-2 py-2 border rounded-lg text-white transition-colors flex items-center space-x-px hover:bg-gray-600 text-sm"
                                style={{ backgroundColor: "#2d2d30", borderColor: "#2d2d30", marginLeft: "5px" }}
                            >
                                <span>{translations["Paid Item Not Received"]}</span>
                            </button>

                            <button
                                className="ml-2 px-2 py-2 border rounded-lg text-white transition-colors flex items-center space-x-px hover:bg-gray-600 text-sm"
                                style={{ backgroundColor: "#0891b2", borderColor: "#0891b2", marginLeft: "5px" }}
                            >
                                <span>{translations["Unpaid Items Received"]}</span>
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
                                    <th className="w-[5%] text-center py-1 px-4 text-gray-400 text-sm w-12"></th>
                                    <th className="w-[10%] text-left py-2 px-2 text-gray-400 text-sm">{translations["Receive Date"]}</th>
                                    <th className="w-[30%] text-left py-2 px-2 text-gray-400 text-sm">{translations["Supplier"]}</th>
                                    <th className="w-[15%] text-left py-2 px-2 text-gray-400 text-sm">{translations["GRNNo3"]}</th>
                                    <th className="w-[10%] text-center py-2 px-2 text-gray-400 text-sm">{translations["Total"]}</th>
                                    <th className="w-[10%] text-center py-2 px-2 text-gray-400 text-sm">{translations["Deposit"]}</th>
                                    <th className="w-[10%] text-center py-2 px-2 text-gray-400 text-sm">{translations["Balance"]}</th>
                                    <th className="w-[10%] text-center py-2 px-2 text-gray-400 text-sm">{translations["Default Currency"]}</th>
                                </tr>
                            </thead>
                            {loading ? (
                                <LoadingSpinnerTbody rowsCount={itemsPerPage} />
                            ) : (
                                <tbody>
                                    {unpaidItemReceivedList.map((list, index) => (
                                        <React.Fragment key={list.index_id || index}>
                                            <tr key={list.index_id || index} className={`border-b hover:bg-gray-700 hover:bg-opacity-30 transition-colors`} style={{ borderColor: "#40404042" }}>
                                                <td className="py-2 px-2 text-gray-400 text-center text-custom-sm">
                                                    <button
                                                        onClick={() => handleToggleRow(list.index_id)}
                                                        className={`px-1 py-1 ${
                                                            expanded_PaidItem.includes(list.index_id) ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"
                                                        } text-white rounded-lg transition-colors text-xs`}
                                                    >
                                                        {expanded_PaidItem.includes(list.index_id) ? <Minus size={16} /> : <Plus size={16} />}
                                                    </button>
                                                </td>
                                                <td className="py-2 px-2 text-gray-400 text-left text-custom-sm">
                                                    <div className="group flex items-center">
                                                        <p className="text-gray-400 text-custom-sm">{formatDate(list.grn_date, lang) || translations["N.A."]}</p>
                                                    </div>
                                                </td>
                                                <td className="py-2 px-2 text-gray-400 text-left text-custom-sm">
                                                    <div className="group flex items-center">
                                                        <p className="text-gray-400 text-custom-sm">{list.supplier_code}</p>
                                                        <CopyToClipboard text={list.supplier_code ?? ""} />
                                                    </div>
                                                    <div className="group flex items-center">
                                                        <p className="text-gray-400 text-custom-sm">{lang === "en" ? list.suppliername_en : list.suppliername_cn}</p>
                                                        <CopyToClipboard text={lang === "en" ? list.suppliername_en || "" : list.suppliername_cn || ""} />
                                                    </div>
                                                </td>
                                                <td className="py-2 px-2 text-gray-400 text-left text-custom-sm">
                                                    <div className="group flex items-center">
                                                        <p className="text-gray-400 text-custom-sm">{list.grn_no}</p>
                                                        <CopyToClipboard text={list.grn_no ?? ""} />
                                                    </div>
                                                </td>
                                                <td className="py-2 px-2 text-gray-400 text-center text-custom-sm">
                                                    {list.currency} <br></br> {formatMoney(list.total)}
                                                </td>
                                                <td className="py-2 px-2 text-gray-400 text-center text-custom-sm">
                                                    {list.currency} <br></br> {formatMoney(list.deposit)}
                                                </td>
                                                <td className="py-2 px-2 text-gray-400 text-center text-custom-sm">
                                                    {list.currency} <br /> {formatMoney((list.total ?? 0) - (list.deposit ?? 0))}
                                                </td>

                                                <td className="py-2 px-2 text-gray-400 text-center text-custom-sm">
                                                    {baseCurrency()}
                                                    <br></br>
                                                    {formatMoney(list.base_total)}
                                                </td>
                                            </tr>
                                            {expanded_PaidItem.includes(list.index_id) && (
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
                                                                    <th className="w-auto text-center py-2 px-2 text-gray-400 text-sm w-12">{translations["Deposit"]}</th>
                                                                    <th className="w-auto text-center py-2 px-2 text-gray-400 text-sm w-12">{translations["Balance"]}</th>
                                                                    <th className="w-auto text-center py-2 px-2 text-gray-400 text-sm w-12">{translations["Base Currency"]}</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {paidItemDetailsMap[list.index_id] && paidItemDetailsMap[list.index_id]!.length > 0 ? (
                                                                    paidItemDetailsMap[list.index_id]!.map((detail, i) => (
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
                                                                                {detail.currency} <br />
                                                                                {formatMoney(detail.price)}
                                                                            </td>
                                                                            <td className="py-2 px-2 text-gray-400 text-center text-custom-sm">
                                                                                {detail.currency} <br />
                                                                                {formatMoney(detail.total)}
                                                                            </td>
                                                                            <td className="py-2 px-2 text-gray-400 text-center text-custom-sm">
                                                                                {detail.currency} <br />
                                                                                {formatMoney(detail.deposit)}
                                                                            </td>
                                                                            <td className="py-2 px-2 text-gray-400 text-center text-custom-sm">
                                                                                {detail.currency} <br /> {formatMoney((detail.total ?? 0) - (detail.deposit ?? 0))}
                                                                            </td>
                                                                            <td className="py-2 px-2 text-gray-400 text-center text-custom-sm">
                                                                                {baseCurrency()}
                                                                                <br></br>
                                                                                {formatMoney(detail.base_total)}
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
                    <div className="p-2 flex items-center space-x-1">
                        <MemoizedPagination currentPage={currentPage} totalPages={totalPages} onPageChange={(page) => setCurrentPage(page)} />
                        <MemoizedItemsPerPageSelector
                            value={itemsPerPage}
                            onChange={(val: number) => {
                                setItemsPerPage(val);
                                setCurrentPage(1);
                            }}
                            options={pageSizeOptions}
                        />
                        <ExportReportSelector formats={["odt", "ods", "xlsx"]} baseName="UnpaidItemReceive" ids={unpaidItemReceivedList.map((p) => p.grn_no)} language={lang} />
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
            </div>
        </div>
    );
};

export default UnpaidItemReceived;
