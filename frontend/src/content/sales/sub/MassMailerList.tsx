import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { massMailerService, ApiMassMailer, DetailsRow } from "@/services/massMailerService";
import { useLanguage } from "@/context/LanguageContext";
import CustomCheckbox from "@/components/CustomCheckbox";
import { showConfirm } from "@/utils/alert";
import { showSuccessToast, showErrorToast } from "@/utils/toast";
import { highlightMatch } from "@/utils/highlightMatch";
import Pagination from "@/components/Pagination";
import ItemsPerPageSelector from "@/components/ItemsPerPageSelector";
import CopyToClipboard from "@/components/CopyToClipboard";
import PusherEcho from "@/utils/echo";
import { Minus, Plus } from "lucide-react";
import { formatDate } from "@/utils/globalFunction";
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
                    <td className="text-center py-1 px-4">
                        <div className="h-6 bg-gray-800 rounded w-5 mx-auto"></div>
                    </td>
                    <td className="py-1 px-4 text-gray-400 text-left text-custom-sm">
                        <div className="flex flex-col space-y-2 py-1 flex-1">
                            <div className="h-4 bg-gray-800 rounded w-full"></div>
                        </div>
                    </td>
                    <td className="text-left py-1 px-4">
                        <div className="flex flex-col space-y-2 py-1 flex-1">
                            <div className="h-4 bg-gray-800 rounded w-full"></div>
                            <div className="h-4 bg-gray-800 rounded w-full"></div>
                        </div>
                    </td>
                    <td className="text-center py-1 px-4">
                        <div className="flex flex-col space-y-2 py-1 flex-1">
                            <div className="h-4 bg-gray-800 rounded w-full"></div>
                        </div>
                    </td>
                    <td className="text-center py-1 px-4">
                        <div className="flex flex-col space-y-2 py-1 flex-1">
                            <div className="h-4 bg-gray-800 rounded w-full"></div>
                        </div>
                    </td>
                </tr>
            ))}
        </tbody>
    );
};
// localStorage.clear();
interface PreorderListProps {
    tabId: string;
    onPreordertSelect: (preorderId: number, saveType?: string) => void;
    onChangeView: (view: "list" | "details" | "settings" | "tags" | "template", from: string) => void;
    selectedPreorder: number[];
    onSelectedMassMailerChange: (selected: number[]) => void;
}
const PreorderList: React.FC<PreorderListProps> = ({ tabId, onPreordertSelect, onChangeView, selectedPreorder, onSelectedMassMailerChange }) => {
    const { translations, lang } = useLanguage();
    const [products, setProducts] = useState<ApiMassMailer[]>([]);
    const [soDetailMap, setMasterDetailMap] = useState<Record<number, DetailsRow[] | null>>({});
    const [totalPages, setTotalPages] = useState(1);
    const [expanded_MassMailer, setExpandedRows] = useState<number[]>([]);
    const pageSizeOptions = useMemo(() => [15, 20, 50, -1], []);
    const inputRef = useRef<HTMLInputElement>(null);
    const [loading, setLoading] = useState(() => {
        const savedLoading = localStorage.getItem(`${tabId}-loading-mass-mailer`);
        return savedLoading !== null ? JSON.parse(savedLoading) : true;
    });

    const [currentPage, setCurrentPage] = useState(() => {
        const metaKey = `${tabId}-cached-meta-mass-mailer`;
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
        const metaKey = `${tabId}-cached-meta-mass-mailer`;
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
        const cached = localStorage.getItem(`${tabId}-cached-meta-mass-mailer`);
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

    // ON LOAD LIST
    useEffect(() => {
        const productKey = `${tabId}-cached-mass-mailer`;
        const metaKey = `${tabId}-cached-meta-mass-mailer`;
        const mountKey = `${tabId}-mount-status-mass-mailer`;
        const isFirstMount = sessionStorage.getItem(mountKey) !== "mounted";
        if (isFirstMount) {
            sessionStorage.setItem(mountKey, "mounted");
            fetchMassMailer(currentPage, itemsPerPage, searchTerm);
            return;
        }
        const cachedProductsRaw = localStorage.getItem(productKey);
        const cachedMetaRaw = localStorage.getItem(metaKey);
        if (!cachedProductsRaw || !cachedMetaRaw) {
            fetchMassMailer(currentPage, itemsPerPage, searchTerm);
            return;
        }
        try {
            const cachedMeta = JSON.parse(cachedMetaRaw);
            const cachedProducts = JSON.parse(cachedProductsRaw);

            const isCacheValid = cachedMeta.page === currentPage && cachedMeta.perPage === itemsPerPage && JSON.stringify(cachedMeta.search) === JSON.stringify(searchTerm);

            if (isCacheValid) {
                setProducts(cachedProducts);
                setTotalPages(cachedMeta.totalPages);
                setLoading(false);
                localStorage.setItem(`${tabId}-loading-mass-mailer`, JSON.stringify(false));
                return;
            }
        } catch (err) {
            console.warn("Failed to parse cached meta:", err);
        }
        fetchMassMailer(currentPage, itemsPerPage, searchTerm);
    }, [currentPage, itemsPerPage, searchTerm, tabId]);

    useEffect(() => {
        const channel = PusherEcho.channel("mass-mailer-channel");
        channel.listen(".mass-mailer-event", () => {
            fetchMassMailer();
        });
        return () => {
            PusherEcho.leave("mass-mailer-channel");
        };
    }, [currentPage, itemsPerPage, searchTerm, tabId]);

    const fetchMassMailer = async (page = currentPage, perPage = itemsPerPage, search = "") => {
        try {
            if (loading) {
                setLoading(true);
            }
            localStorage.setItem(`${tabId}-loading-mass-mailer`, JSON.stringify(true));
            const paginatedData = await massMailerService.getMassMailer(page, perPage, search);
            setProducts(paginatedData.data);
            setTotalPages(paginatedData.last_page);
            localStorage.setItem(`${tabId}-cached-mass-mailer`, JSON.stringify(paginatedData.data));
            localStorage.setItem(
                `${tabId}-cached-meta-mass-mailer`,
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
            localStorage.setItem(`${tabId}-loading-mass-mailer`, JSON.stringify(false));
        }
    };
    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            onSelectedMassMailerChange(products.map((p) => p.id).filter(Boolean) as number[]);
        } else {
            onSelectedMassMailerChange([]);
        }
    };
    const handleSelectSingle = (rowId: number, checked: boolean) => {
        if (checked) {
            onSelectedMassMailerChange([...selectedPreorder, rowId]);
        } else {
            onSelectedMassMailerChange(selectedPreorder.filter((id) => id !== rowId));
        }
    };
    const handleRowClick = (e: React.MouseEvent, rowId: number) => {
        // Prevent navigation if clicking on checkboxes or toggle switches
        const target = e.target as HTMLElement;
        if (target.closest("input") || target.closest("label") || target.closest("[data-copy-button]")) {
            return;
        }
        onPreordertSelect(rowId, rowId == 0 ? "new" : "edit");
    };
    const handleToggleRow = async (tableId: number) => {
        const isExpanded = expanded_MassMailer.includes(tableId);
        const expandedKey = tabId + "_expandedKey";

        if (isExpanded) {
            // Collapse row
            const updated = expanded_MassMailer.filter((id) => id !== tableId);
            setExpandedRows(updated);
            localStorage.setItem(expandedKey, JSON.stringify(updated));
        } else {
            // Expand row
            const updated = [...expanded_MassMailer, tableId];
            setExpandedRows(updated);
            localStorage.setItem(expandedKey, JSON.stringify(updated));
            try {
                const data = products.find((po) => po.id === tableId);
                // Save to state
                if (!data?.details) {
                    setMasterDetailMap((prev) => ({ ...prev, [tableId]: null }));
                    return;
                }
                const details: DetailsRow[] = data.details;
                setMasterDetailMap((prev) => ({ ...prev, [tableId]: details }));
            } catch (error) {
                setMasterDetailMap((prev) => ({ ...prev, [tableId]: null }));
            }
        }
    };
    const handleDeleteSelected = async () => {
        if (selectedPreorder.length === 0) {
            showErrorToast(translations["Please click checkbox to select row"]);
            return;
        }
        const confirmed = await showConfirm(translations["Delete Record"], translations["Are you sure you want to delete this record?"], translations["Yes"], translations["Cancel"]);
        if (!confirmed) return;
        try {
            const res = await massMailerService.deleteMassMailer(selectedPreorder);
            if (res.token === "Error") {
                showErrorToast(res.message);
                return;
            }
            fetchMassMailer();
            showSuccessToast(translations["Record has been Deleted"]);
        } catch (err) {
            showErrorToast(translations["alert_message_18"]);
            console.error("No Record(s) Has Been Deleted : ", err);
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
                                    onClick={(e) => handleRowClick(e, 0)}
                                    className="px-2 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors flex items-center space-x-1 text-sm"
                                >
                                    <span>{translations["Create Campaign"]}</span>
                                </button>
                                <button
                                    disabled={selectedPreorder.length === 0}
                                    onClick={handleDeleteSelected}
                                    className="px-2 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center space-x-1 text-sm"
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
                                    <th className="w-[3%] text-left py-2 px-2 text-gray-400 text-sm"></th>
                                    <th className="w-[3%] text-left py-1 px-2 text-gray-400 text-sm w-12">
                                        <CustomCheckbox
                                            checked={selectedPreorder.length === products.length && products.length > 0}
                                            onChange={(checked) => handleSelectAll(checked)}
                                            ariaLabel="Select all products"
                                        />
                                    </th>
                                    <th className="w-[12%] text-left py-2 px-2 text-gray-400 text-sm">{translations["Date"]}</th>
                                    <th className="w-[62%] text-left py-2 px-2 text-gray-400 text-sm">{translations["Campaign"]}</th>
                                    <th className="w-[10%] text-center py-2 px-2 text-gray-400 text-sm">{translations["No Of Recipient"]}</th>
                                    <th className="w-[10%] text-center py-2 px-2 text-gray-400 text-sm">{translations["Action"]}</th>
                                </tr>
                            </thead>
                            {loading ? (
                                <LoadingSpinnerTbody rowsCount={itemsPerPage} />
                            ) : (
                                <tbody>
                                    {products.length === 0 ? (
                                        <tr>
                                            <td colSpan={14} className="py-4 px-4 text-center text-gray-400 text-sm border border-[#40404042]">
                                                {translations["No Record Found"] || "No Record Found"}
                                            </td>
                                        </tr>
                                    ) : (
                                        products.map((list, index) => (
                                            <React.Fragment key={list.id || index}>
                                                <tr
                                                    key={list.id || index}
                                                    className={`clickable border-b hover:bg-gray-700 hover:bg-opacity-30 transition-colors cursor-pointer ${
                                                        selectedPreorder.includes(list.id as number) ? "bg-gray-700 bg-opacity-30" : ""
                                                    }`}
                                                    style={{ borderColor: "#40404042" }}
                                                >
                                                    <td className="py-2 px-2 text-gray-400 text-left text-custom-sm" onClick={(e) => e.stopPropagation()}>
                                                        <button
                                                            onClick={() => handleToggleRow(list.id)}
                                                            className={`px-1 py-1 ${
                                                                expanded_MassMailer.includes(list.id) ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"
                                                            } text-white rounded-lg transition-colors text-xs`}
                                                        >
                                                            {expanded_MassMailer.includes(list.id) ? <Minus size={16} /> : <Plus size={16} />}
                                                        </button>
                                                    </td>
                                                    <td className="py-2 px-2" onClick={(e) => e.stopPropagation()}>
                                                        <CustomCheckbox checked={selectedPreorder.includes(list.id as number)} onChange={(checked) => handleSelectSingle(list.id as number, checked)} />
                                                    </td>
                                                    <td className="py-2 px-2 text-gray-400 text-left text-custom-sm">{formatDate(list.date, lang)}</td>
                                                    <td className="py-2 px-2 text-gray-400 text-left text-custom-sm">{list.campaign_name}</td>
                                                    <td className="py-2 px-2 text-gray-400 text-center text-custom-sm">{list.email_count}</td>
                                                    <td
                                                        className="py-2 px-2 text-gray-400 text-center text-custom-sm"
                                                        onClick={(e) => e.stopPropagation()} // Prevents td click from bubbling up
                                                    >
                                                        <button
                                                            type="button"
                                                            onClick={(e) => handleRowClick(e, list.template_id)} // Correctly passes the event
                                                            className="px-1 py-1 text-white rounded-lg transition-colors text-sm bg-cyan-600 hover:bg-cyan-700"
                                                        >
                                                            <span>{translations["Resend"]}</span>
                                                        </button>
                                                    </td>
                                                </tr>
                                                {expanded_MassMailer.includes(list.id) && (
                                                    <tr>
                                                        <td colSpan={6} className="py-0 px-4 pt-2">
                                                            <table className="w-full" style={{ backgroundColor: "#060818" }}>
                                                                <thead className="sticky top-0 z-[1] py-1 px-2" style={{ backgroundColor: "#1f2132" }}>
                                                                    <tr className="border-b" style={{ borderColor: "#2d2d30" }}>
                                                                        <th className="w-auto text-left py-2 px-2 text-gray-400 text-sm w-12 border border-[#40404042]"></th>
                                                                        <th className="w-auto text-left py-2 px-2 text-gray-400 text-sm w-12 border border-[#40404042]">
                                                                            {translations["Customer Code"]}
                                                                        </th>
                                                                        <th className="w-auto text-left py-2 px-2 text-gray-400 text-sm w-12 border border-[#40404042]">
                                                                            {translations["Customer Name"]}
                                                                        </th>
                                                                        <th className="w-auto text-left py-2 px-2 text-gray-400 text-sm w-12 border border-[#40404042]">
                                                                            {translations["Customer Group"]}
                                                                        </th>
                                                                        <th className="w-auto text-left py-2 px-2 text-gray-400 text-sm w-12 border border-[#40404042]">{translations["Email"]}</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody>
                                                                    {soDetailMap[list.id] && soDetailMap[list.id]!.length > 0 ? (
                                                                        soDetailMap[list.id]!.map((detail, i) => (
                                                                            <tr>
                                                                                <td className="py-2 px-2 text-gray-400 text-left text-custom-sm border border-[#40404042]">{i + 1}</td>
                                                                                <td className="py-2 px-2 text-gray-400 text-left text-custom-sm border border-[#40404042]">{detail.customer_code}</td>
                                                                                <td className="py-2 px-2 text-gray-400 text-left text-custom-sm border border-[#40404042]">
                                                                                    {highlightMatch(lang === "en" ? detail.account_name_en : detail.account_name_cn, searchTerm)}
                                                                                </td>
                                                                                <td className="py-2 px-2 text-gray-400 text-left text-custom-sm border border-[#40404042]">{detail.customer_groups}</td>
                                                                                <td className="py-2 px-2 text-gray-400 text-left text-custom-sm border border-[#40404042]">{detail.email_address}</td>
                                                                            </tr>
                                                                        ))
                                                                    ) : (
                                                                        <tr>
                                                                            <td colSpan={5} className="py-2 px-2 text-center text-gray-400 text-sm border border-[#40404042]">
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
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PreorderList;
