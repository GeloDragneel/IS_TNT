import React, { useState, useEffect, useMemo, useRef } from "react";
import { reportsService, ApiReports, DetailsExpanded } from "@/services/reportsService";
import { useLanguage } from "@/context/LanguageContext";
import Pagination from "@/components/Pagination";
import ItemsPerPageSelector from "@/components/ItemsPerPageSelector";
import CopyToClipboard from "@/components/CopyToClipboard";
import { Minus, Plus } from "lucide-react";
import PusherEcho from "@/utils/echo";

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
                </tr>
            ))}
        </tbody>
    );
};
const MemoizedPagination = React.memo(Pagination);
const MemoizedItemsPerPageSelector = React.memo(ItemsPerPageSelector);
interface UnpaidItemReceivedProps {
    tabId: string;
}
interface MasterFooter {
    currency: string;
    total: number;
}
// localStorage.clear();
const UnpaidItemReceived: React.FC<UnpaidItemReceivedProps> = ({ tabId }) => {
    const { translations, lang } = useLanguage();
    const [transactionList, setTransactionList] = useState<ApiReports[]>([]);
    const [totalPages, setTotalPages] = useState(1);
    const pageSizeOptions = useMemo(() => [15, 20, 50, -1], []);
    const [expanded_Transaction, setExpandedRows] = useState<number[]>([]);
    const [transactionDetailsMap, setTransactionDetailsMap] = useState<Record<number, DetailsExpanded[] | null>>({});
    const inputRef = useRef<HTMLInputElement>(null);
    const [masterFooter, setMasterFooter] = useState<MasterFooter[]>([]); // Changed to array
    const [loading, setLoading] = useState(() => {
        const savedLoading = localStorage.getItem(`${tabId}-loading-transaction`);
        return savedLoading !== null ? JSON.parse(savedLoading) : true;
    });

    const [currentPage, setCurrentPage] = useState(() => {
        const metaKey = `${tabId}-cached-meta-transaction`;
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
        const metaKey = `${tabId}-cached-meta-transaction`;
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
        const cached = localStorage.getItem(`${tabId}-cached-meta-transaction`);
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
            fetchTransaction(currentPage, itemsPerPage, searchTerm);
        });
        channel_AP.listen(".ap-event", () => {
            fetchTransaction(currentPage, itemsPerPage, searchTerm);
        });
        channel_GRN.listen(".grn-event", () => {
            fetchTransaction(currentPage, itemsPerPage, searchTerm);
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
                const data = transactionList.find((po) => po.id === tableId);
                // Save to state
                if (!data?.details) {
                    setTransactionDetailsMap((prev) => ({ ...prev, [tableId]: null }));
                    return;
                }
                const details: DetailsExpanded[] = data.details;
                setTransactionDetailsMap((prev) => ({ ...prev, [tableId]: details }));
            });
            setExpandedRows(checkedIds);
        }
    }, [tabId, transactionList]);

    // ON LOAD LIST
    useEffect(() => {
        const SupplierKey = `${tabId}-cached-transaction`;
        const metaKey = `${tabId}-cached-meta-transaction`;
        const mountKey = `${tabId}-mount-status-unpaid`;

        const isFirstMount = sessionStorage.getItem(mountKey) !== "mounted";

        if (isFirstMount) {
            sessionStorage.setItem(mountKey, "mounted");
            fetchTransaction(currentPage, itemsPerPage, searchTerm);
            return;
        }

        const cachedSuppliersRaw = localStorage.getItem(SupplierKey);
        const cachedMetaRaw = localStorage.getItem(metaKey);

        if (!cachedSuppliersRaw || !cachedMetaRaw) {
            fetchTransaction(currentPage, itemsPerPage, searchTerm);
            return;
        }

        try {
            const cachedMeta = JSON.parse(cachedMetaRaw);
            const cachedSuppliers = JSON.parse(cachedSuppliersRaw);

            const isCacheValid = cachedMeta.page === currentPage && cachedMeta.perPage === itemsPerPage && JSON.stringify(cachedMeta.search) === JSON.stringify(searchTerm);

            if (isCacheValid) {
                setTransactionList(cachedSuppliers);
                setTotalPages(cachedMeta.totalPages);
                setLoading(false);
                localStorage.setItem(`${tabId}-loading-transaction`, JSON.stringify(false));
                return;
            }
        } catch (err) {
            console.warn("Failed to parse cached meta:", err);
        }

        fetchTransaction(currentPage, itemsPerPage, searchTerm);
    }, [currentPage, itemsPerPage, searchTerm, tabId]);

    const fetchTransaction = async (page = currentPage, perPage = itemsPerPage, search = "") => {
        try {
            if (loading) {
                setLoading(true);
            }
            localStorage.setItem(`${tabId}-loading-transaction`, JSON.stringify(true));
            const paginatedData = await reportsService.getCustomerDepositList(page, perPage, search);
            setTransactionList(paginatedData.data);
            setTotalPages(paginatedData.last_page);
            setMasterFooter(paginatedData.footer2);
            localStorage.setItem(`${tabId}-cached-transaction`, JSON.stringify(paginatedData.data));
            localStorage.setItem(
                `${tabId}-cached-meta-transaction`,
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
            localStorage.setItem(`${tabId}-loading-transaction`, JSON.stringify(false));
        }
    };
    const handleToggleRow = async (tableId: number, customerId: number) => {
        const isExpanded = expanded_Transaction.includes(tableId);
        const cachedKey = `cached-deposit-details-${tableId}`;
        const expandedKey = tabId + "_expandedKey";
        if (isExpanded) {
            // Collapse row
            const updated = expanded_Transaction.filter((id) => id !== tableId);
            setExpandedRows(updated);
            localStorage.setItem(expandedKey, JSON.stringify(updated));
        } else {
            // Expand row
            const updated = [...expanded_Transaction, tableId];
            setExpandedRows(updated);
            localStorage.setItem(expandedKey, JSON.stringify(updated));
            try {
                const detailsRes = await reportsService.getCustomerDepositDetails(customerId);
                if (!detailsRes || !detailsRes || !Array.isArray(detailsRes)) {
                    setTransactionDetailsMap((prev) => ({ ...prev, [tableId]: [] }));
                    return;
                }
                const details: DetailsExpanded[] = detailsRes;
                setTransactionDetailsMap((prev) => ({ ...prev, [tableId]: details }));
                localStorage.setItem(cachedKey, JSON.stringify(details));
            } catch (error) {
                setTransactionDetailsMap((prev) => ({ ...prev, [tableId]: null }));
            }
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
                    </div>
                </div>
                {/* Table */}
                <div className="overflow-x-auto flex-grow">
                    <div className="h-[calc(100vh-215px)] overflow-y-auto">
                        <table className="w-full">
                            <thead className="sticky top-0 z-[1]" style={{ backgroundColor: "#1f2132" }}>
                                <tr className="border-b" style={{ borderColor: "#2d2d30" }}>
                                    <th className="w-[5%] text-center py-1 px-4 text-gray-400 text-sm w-12"></th>
                                    <th className="w-[35%] text-left py-2 px-2 text-gray-400 text-sm">{translations["Customer Code"]}</th>
                                    <th className="w-[20%] text-left py-2 px-2 text-gray-400 text-sm">{translations["Customer Name"]}</th>
                                    <th className="w-[20%] text-center py-2 px-2 text-gray-400 text-sm">{translations["Item Deposit"]}</th>
                                    <th className="w-[20%] text-center py-2 px-2 text-gray-400 text-sm">{translations["Base Currency"]}</th>
                                </tr>
                            </thead>
                            {loading ? (
                                <LoadingSpinnerTbody rowsCount={itemsPerPage} />
                            ) : (
                                <tbody>
                                    {transactionList.map((list, index) => (
                                        <React.Fragment key={`customer-${list.id}-${index}`}>
                                            <tr className={`border-b hover:bg-gray-700 hover:bg-opacity-30 transition-colors`} style={{ borderColor: "#40404042" }}>
                                                <td className="py-2 px-2 text-gray-400 text-center text-custom-sm">
                                                    <button
                                                        onClick={() => handleToggleRow(list.id, list.customer_id)}
                                                        className={`px-1 py-1 ${
                                                            expanded_Transaction.includes(list.id) ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"
                                                        } text-white rounded-lg transition-colors text-xs`}
                                                    >
                                                        {expanded_Transaction.includes(list.id) ? <Minus size={16} /> : <Plus size={16} />}
                                                    </button>
                                                </td>
                                                <td className="py-2 px-2 text-gray-400 text-left text-custom-sm">
                                                    <div className="group flex items-center">
                                                        <p className="text-gray-400 text-custom-sm">{highlightMatch(list.customer_code, searchTerm)}</p>
                                                        <CopyToClipboard text={list.customer_code} />
                                                    </div>
                                                </td>
                                                <td className="py-2 px-2 text-gray-400 text-left text-custom-sm">{list.account_name_en}</td>
                                                <td className="py-2 px-2 text-gray-400 text-center text-custom-sm">
                                                    {list.currency} <br></br> {formatMoney(list.amount)}
                                                </td>
                                                <td className="py-2 px-2 text-gray-400 text-center text-custom-sm">
                                                    {baseCurrency()} <br></br> {formatMoney(list.base_amount)}
                                                </td>
                                            </tr>
                                            {expanded_Transaction.includes(list.id) && (
                                                <tr key={`customer-${list.id}-details`}>
                                                    <td colSpan={7} className="py-2 px-2">
                                                        <table className="w-full" style={{ backgroundColor: "#060818" }}>
                                                            <thead className="sticky top-0 z-[1] py-1 px-4" style={{ backgroundColor: "#1f2132" }}>
                                                                <tr className="border-b" style={{ borderColor: "#2d2d30" }}>
                                                                    <th className="w-auto text-left py-2 px-2 text-gray-400 text-sm w-12">{translations["Transaction Date"]}</th>
                                                                    <th className="w-auto text-left py-2 px-2 text-gray-400 text-sm w-12">{translations["Reference"]}</th>
                                                                    <th className="w-auto text-left py-2 px-2 text-gray-400 text-sm w-12">{translations["Product Code"]}</th>
                                                                    <th className="w-auto text-left py-2 px-2 text-gray-400 text-sm w-12">{translations["Product Name"]}</th>
                                                                    <th className="w-auto text-center py-2 px-2 text-gray-400 text-sm w-12">{translations["Deposit"]}</th>
                                                                    <th className="w-auto text-center py-2 px-2 text-gray-400 text-sm w-12">{translations["Base Currency"]}</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {transactionDetailsMap[list.id] && transactionDetailsMap[list.id]!.length > 0 ? (
                                                                    transactionDetailsMap[list.id]!.map((detail, i) => (
                                                                        <tr key={`detail-${list.id}-${detail.id}-${i}`}>
                                                                            <td className="py-2 px-2 text-gray-400 text-left text-custom-sm">{formatDate(detail.transaction_date, lang)}</td>
                                                                            <td className="py-2 px-2 text-gray-400 text-left text-custom-sm">
                                                                                <div className="group flex items-center">
                                                                                    <p className="text-gray-400 text-custom-sm">{highlightMatch(detail.reference, searchTerm)}</p>
                                                                                    <CopyToClipboard text={detail.reference} />
                                                                                </div>
                                                                            </td>
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
                                                                            <td className="py-2 px-2 text-gray-400 text-center text-custom-sm">
                                                                                {detail.currency} {formatMoney(detail.amount)}
                                                                            </td>
                                                                            <td className="py-2 px-2 text-gray-400 text-center text-custom-sm">
                                                                                {baseCurrency()} {formatMoney(detail.base_amount)}
                                                                            </td>
                                                                        </tr>
                                                                    ))
                                                                ) : (
                                                                    <tr key={`no-record-${list.id}`}>
                                                                        <td colSpan={6} className="py-2 px-2 text-center text-gray-400 text-sm">
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
                    <div className="p-4 flex items-center space-x-4">
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
                    <div className="p-1 flex items-center space-x-1">
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
    );
};

export default UnpaidItemReceived;
