import React, { useState, useEffect, useMemo } from "react";
import { shipoutItemService, ApiShipoutItem, DetailsRow } from "@/services/shipoutItemService";
import { useLanguage } from "@/context/LanguageContext";
import Pagination from "@/components/Pagination";
import ItemsPerPageSelector from "@/components/ItemsPerPageSelector";
import PusherEcho from "@/utils/echo";
import CopyToClipboard from "@/components/CopyToClipboard";
import { highlightMatch } from "@/utils/highlightMatch";
import { Minus, Plus, X } from "lucide-react";
import CustomCheckbox from "@/components/CustomCheckbox";
import { showErrorToast, showSuccessToast } from "@/utils/toast";
import "flatpickr/dist/themes/dark.css";
// Handle the Smooth skeleton loading
import { ExportReportSelector } from "@/utils/ExportReportSelector";
const MemoizedPagination = React.memo(Pagination);
const MemoizedItemsPerPageSelector = React.memo(ItemsPerPageSelector);
interface PreparedShipmentProps {
    tabId: string;
}
// localStorage.clear();
const PreparedShipment: React.FC<PreparedShipmentProps> = ({ tabId }) => {
    const { translations, lang } = useLanguage();
    const [shipoutItemList, setPreparedShipment] = useState<ApiShipoutItem[]>([]);
    const [processShipment, setProcessShipment] = useState<ApiShipoutItem[]>([]);
    const [totalPages, setTotalPages] = useState(1);
    const pageSizeOptions = useMemo(() => [15, 20, 50, -1], []);
    const [expanded_ShipoutItem, setExpandedRows] = useState<number[]>([]);
    const [shipoutItemDetailMap, setPreparedShipmentDetailMap] = useState<Record<number, DetailsRow[] | null>>({});
    const [showPopup, setShowPopup] = useState(false);
    const [loading, setLoading] = useState(false);
    const [selectedParents, setSelectedParents] = useState<number[]>([]);
    const [selectedChildren, setSelectedChildren] = useState<{ [parentId: number]: number[] }>({});
    const [currentPage, setCurrentPage] = useState(() => {
        const metaKey = `${tabId}-cached-meta-shipout`;
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
        const metaKey = `${tabId}-cached-meta-shipout`;
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
        const cached = localStorage.getItem(`${tabId}-cached-meta-shipout`);
        if (!cached) return "";
        try {
            const meta = JSON.parse(cached);
            return meta.search || "";
        } catch {
            return "";
        }
    });
    useEffect(() => {
        const channel = PusherEcho.channel("shipment-channel");
        channel.listen(".shipment-event", () => {
            setTimeout(() => {
                fetchPreparedShipment(currentPage, itemsPerPage, searchTerm);
            }, 500);
        });
        return () => {
            PusherEcho.leave("shipment-channel");
        };
    }, [currentPage, itemsPerPage, searchTerm, tabId]);

    useEffect(() => {
        const SupplierKey = `${tabId}-cached-shipment-list`;
        const metaKey = `${tabId}-cached-meta-shipment-list`;
        const mountKey = `${tabId}-mount-status-shipout`;
        const isFirstMount = sessionStorage.getItem(mountKey) !== "mounted";
        if (isFirstMount) {
            sessionStorage.setItem(mountKey, "mounted");
            fetchPreparedShipment(currentPage, itemsPerPage, searchTerm);
            return;
        }
        const cachedSuppliersRaw = localStorage.getItem(SupplierKey);
        const cachedMetaRaw = localStorage.getItem(metaKey);

        if (!cachedSuppliersRaw || !cachedMetaRaw) {
            fetchPreparedShipment(currentPage, itemsPerPage, searchTerm);
            return;
        }

        try {
            const cachedMeta = JSON.parse(cachedMetaRaw);
            const cachedSuppliers = JSON.parse(cachedSuppliersRaw);
            const isCacheValid = cachedMeta.page === currentPage && cachedMeta.perPage === itemsPerPage && cachedMeta.search === searchTerm;
            if (isCacheValid) {
                setPreparedShipment(cachedSuppliers);
                setTotalPages(cachedMeta.totalPages);
                localStorage.setItem(`${tabId}-loading-shipment-list`, JSON.stringify(false));
                return;
            }
        } catch (err) {
            console.warn("Failed to parse cached meta:", err);
        }

        fetchPreparedShipment(currentPage, itemsPerPage, searchTerm);
    }, [currentPage, itemsPerPage, searchTerm, tabId]);

    const fetchPreparedShipment = async (page = currentPage, perPage = itemsPerPage, search = "") => {
        try {
            localStorage.setItem(`${tabId}-loading-shipment-list`, JSON.stringify(true));
            const paginatedData = await shipoutItemService.getPreparedShipment(page, perPage, search);
            setPreparedShipment(paginatedData.data);
            setTotalPages(paginatedData.last_page);
            localStorage.setItem(`${tabId}-cached-shipment-list`, JSON.stringify(paginatedData.data));
            localStorage.setItem(
                `${tabId}-cached-meta-shipment-list`,
                JSON.stringify({
                    page,
                    perPage,
                    search,
                    totalPages: paginatedData.last_page,
                    totalItems: paginatedData.total,
                })
            );
        } catch (err) {
            console.error("Error fetching shipment:", err);
        } finally {
            localStorage.setItem(`${tabId}-loading-shipment-list`, JSON.stringify(false));
        }
    };
    const handleToggleRow = async (tableId: number) => {
        const isExpanded = expanded_ShipoutItem.includes(tableId);
        const cachedKey = tabId + "_cachedShipoutDetails_" + tableId;
        const expandedKey = tabId + "_expandedKey";

        if (isExpanded) {
            // Collapse row
            const updated = expanded_ShipoutItem.filter((index_id) => index_id !== tableId);
            setExpandedRows(updated);
            localStorage.setItem(expandedKey, JSON.stringify(updated));
        } else {
            // Expand row
            const updated = [...expanded_ShipoutItem, tableId];
            setExpandedRows(updated);
            localStorage.setItem(expandedKey, JSON.stringify(updated));
            try {
                const data = shipoutItemList.find((po) => po.index_id === tableId);
                // Save to state
                if (!data?.details) {
                    setPreparedShipmentDetailMap((prev) => ({ ...prev, [tableId]: null }));
                    return;
                }
                const details: DetailsRow[] = data.details;
                setPreparedShipmentDetailMap((prev) => ({ ...prev, [tableId]: details }));
                localStorage.setItem(cachedKey, JSON.stringify(details));
            } catch (error) {
                console.error(`Failed to load details for product ${tableId}`, error);
                setPreparedShipmentDetailMap((prev) => ({ ...prev, [tableId]: null }));
            }
        }
    };
    const handleSelectAllParents = (checked: boolean) => {
        setSelectedParents(checked ? shipoutItemList.map((item) => item.index_id) : []);
    };
    const handleSelectParent = (index_id: number, checked: boolean) => {
        setSelectedParents((prev) => (checked ? [...prev, index_id] : prev.filter((id) => id !== index_id)));

        const children = shipoutItemDetailMap[index_id] || [];
        setSelectedChildren((prev) => ({
            ...prev,
            [index_id]: checked ? children.map((c) => c.id) : [],
        }));
    };
    const handleSelectChild = (parentId: number, childId: number, checked: boolean) => {
        setSelectedChildren((prev) => {
            const current = prev[parentId] || [];
            const updated = checked ? [...current, childId] : current.filter((id) => id !== childId);

            // Sync with parent
            const totalChildren = shipoutItemDetailMap[parentId]?.length || 0;
            if (checked && updated.length === totalChildren) {
                setSelectedParents((prevParents) => (prevParents.includes(parentId) ? prevParents : [...prevParents, parentId]));
            } else {
                setSelectedParents((prevParents) => prevParents.filter((id) => id !== parentId));
            }

            return { ...prev, [parentId]: updated };
        });
    };
    const handleSelectAllChildren = (parentId: number, checked: boolean) => {
        const details = shipoutItemDetailMap[parentId] || [];
        setSelectedChildren((prev) => ({
            ...prev,
            [parentId]: checked ? details.map((d) => d.id) : [],
        }));
    };
    const handleShipoutSelected = async () => {
        const totalSelectedChildren = Object.values(selectedChildren).reduce((sum, childArray) => sum + childArray.length, 0);
        if (totalSelectedChildren === 0) {
            showErrorToast(translations["Please click checkbox to select row"]);
            return;
        }
        const selectedDetails = Object.entries(selectedChildren).flatMap(([parentId, childIds]) => {
            const parentKey = Number(parentId); // convert string to number
            const details = shipoutItemDetailMap[parentKey] || [];
            return details.filter((detail) => childIds.includes(detail.id));
        });
        setShowPopup(true);
        setProcessShipment(selectedDetails);
    };
    const handleConfirmShipment = async () => {
        setLoading(true);
        try {
            const res = await shipoutItemService.confirmShipment(processShipment);
            if (res.token === "Error") {
                showErrorToast(res.message);
                return;
            }
            setShowPopup(false);
            fetchPreparedShipment();
            setLoading(false);
            setProcessShipment([]);
            setSelectedParents([]);
            setSelectedChildren([]);
            showSuccessToast(translations[res.message]);
        } catch (err) {
            setLoading(false);
            showErrorToast(translations["alert_message_18"]);
        } finally {
            setLoading(false);
        }
    };
    const renderPopup = () => {
        if (!showPopup) return null;
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-[#19191c] rounded-xl border border-[#ffffff1a] w-[75vw] h-auto flex flex-col">
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-[#ffffff1a]">
                        <div className="flex items-center space-x-4">
                            <h2 className="text-xl font-bold text-white">{translations["Process Shipment"]}</h2>
                        </div>
                        <div className="flex items-center space-x-4">
                            <button
                                onClick={() => {
                                    setShowPopup(false);
                                }}
                                className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                            >
                                <X className="h-6 w-6 text-white" />
                            </button>
                        </div>
                    </div>
                    {/* Content */}
                    <div className="p-2 flex-1 overflow-auto">
                        <div className="max-h-[calc(100vh-215px)] overflow-y-auto">
                            <table className="w-full" style={{ backgroundColor: "#060818" }}>
                                <thead className="sticky top-0 z-[1] py-1 px-2" style={{ backgroundColor: "#1f2132" }}>
                                    <tr className="border-b" style={{ borderColor: "#2d2d30" }}>
                                        <th className="w-[12%] text-left py-2 px-2 text-gray-400 text-sm w-12 border border-[#40404042]">{translations["AR Invoice No"]}</th>
                                        <th className="w-[10%] text-left py-2 px-2 text-gray-400 text-sm w-12 border border-[#40404042]">{translations["Product Code"]}</th>
                                        <th className="w-[19%] text-left py-2 px-2 text-gray-400 text-sm w-12 border border-[#40404042]">{translations["Product Name"]}</th>
                                        <th className="w-[5%] text-center py-2 px-2 text-gray-400 text-sm w-12 border border-[#40404042]">{translations["Qty"]}</th>
                                        <th className="w-[9%] text-center py-2 px-2 text-gray-400 text-sm w-12 border border-[#40404042]">{translations["Ready To Ship"]}</th>
                                        <th className="w-[7%] text-center py-2 px-2 text-gray-400 text-sm w-12 border border-[#40404042]">{translations["Shipped"]}</th>
                                        <th className="w-[7%] text-center py-2 px-2 text-gray-400 text-sm w-12 border border-[#40404042]">{translations["Ready"]}</th>
                                        <th className="w-[7%] text-center py-2 px-2 text-gray-400 text-sm w-12 border border-[#40404042]">{translations["Rem Qty"]}</th>
                                        <th className="w-[25%] text-left py-2 px-2 text-gray-400 text-sm w-12 border border-[#40404042]">{translations["Remarks"]}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {processShipment.map((list, i) => (
                                        <React.Fragment key={list.index_id || i}>
                                            <tr key={list.id || i}>
                                                <td className="py-2 px-2 text-gray-400 text-left text-custom-sm border border-[#40404042]">
                                                    <div className="group flex items-center">
                                                        <p className="text-gray-400 text-custom-sm">{highlightMatch(lang === "en" ? list.invoice_no : list.invoice_no, searchTerm)}</p>
                                                        <CopyToClipboard text={lang === "en" ? list.invoice_no || "" : list.invoice_no || ""} />
                                                    </div>
                                                </td>
                                                <td className="py-2 px-2 text-gray-400 text-left text-custom-sm border border-[#40404042]">
                                                    <div className="group flex items-center">
                                                        <p className="text-gray-400 text-custom-sm">{highlightMatch(lang === "en" ? list.product_code : list.product_code, searchTerm)}</p>
                                                        <CopyToClipboard text={lang === "en" ? list.product_code || "" : list.product_code || ""} />
                                                    </div>
                                                </td>
                                                <td className="py-2 px-2 text-gray-400 text-left text-custom-sm border border-[#40404042]">
                                                    <div className="group flex items-center">
                                                        <p className="text-gray-400 text-custom-sm">{highlightMatch(lang === "en" ? list.product_title_en : list.product_title_cn, searchTerm)}</p>
                                                        <CopyToClipboard text={lang === "en" ? list.product_title_en || "" : list.product_title_cn || ""} />
                                                    </div>
                                                </td>
                                                <td className="py-2 px-2 text-gray-400 text-center text-custom-sm border border-[#40404042]">{list.qty}</td>
                                                <td className="py-2 px-2 text-gray-400 text-center text-custom-sm border border-[#40404042]">{list.on_ship_qty_new}</td>
                                                <td className="py-2 px-2 text-gray-400 text-center text-custom-sm border border-[#40404042]">{list.shipped_qty}</td>
                                                <td className="py-2 px-2 text-gray-400 text-center text-custom-sm border border-[#40404042]">{list.ready}</td>
                                                <td className="py-2 px-2 text-gray-400 text-center text-custom-sm border border-[#40404042]">{list.remaining_qty}</td>
                                                <td className="py-2 px-2 text-gray-400 text-left text-custom-sm border border-[#40404042]">{list.remarks}</td>
                                            </tr>
                                        </React.Fragment>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    {/* Footer */}
                    <div className="p-2 border-t border-[#ffffff1a] flex justify-end space-x-1">
                        <button onClick={() => setShowPopup(false)} className="px-2 py-2 bg-gray-700 hover:bg-gray-600 rounded text-white transition">
                            {translations["Close"]}
                        </button>
                        <button
                            onClick={handleConfirmShipment}
                            className={`px-2 py-2 bg-cyan-700 hover:bg-cyan-600 rounded text-white transition
                            ${loading ? "bg-gray-500 cursor-not-allowed opacity-50" : "bg-cyan-600 hover:bg-cyan-700"} 
                            text-[#ffffffcc] flex justify-center items-center`}
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <div className="loader mr-2"></div>
                                    <span>{translations["Processing2"]}...</span>
                                </>
                            ) : (
                                <span>{translations["Confirm"]}</span>
                            )}
                        </button>
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
                        </div>
                        <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-1">
                                <button className="px-2 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors flex items-center space-x-1 text-sm">
                                    <span>{translations["Packing List"]}</span>
                                </button>
                                <button onClick={handleShipoutSelected} className="px-2 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors flex items-center space-x-1 text-sm">
                                    <span>{translations["Process Shipment"]}</span>
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
                                    <th className="text-center py-2 px-2 text-gray-400 text-sm w-[3%]"></th>
                                    <th className="text-left py-2 px-2 text-gray-400 text-sm w-[3%]">
                                        <div className="flex items-center justify-center h-full">
                                            <CustomCheckbox checked={selectedParents.length === shipoutItemList.length && shipoutItemList.length > 0} onChange={handleSelectAllParents} />
                                        </div>
                                    </th>
                                    <th className="text-left py-2 px-2 text-gray-400 text-sm w-[20%]">{translations["Invoice No"]}</th>
                                    <th className="text-left py-2 px-2 text-gray-400 text-sm w-[22%]">{translations["Customer Code"]}</th>
                                    <th className="text-left py-2 px-2 text-gray-400 text-sm w-[22%]">{translations["Customer Name"]}</th>
                                    <th className="text-left py-2 px-2 text-gray-400 text-sm w-[15%]">{translations["Shipping Status"]}</th>
                                    <th className="text-left py-2 px-2 text-gray-400 text-sm w-[15%]">{translations["Total Qty"]}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {shipoutItemList.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="py-2 px-2 text-center text-gray-400 text-sm border border-[#40404042]">
                                            {translations["No Record Found"]}.
                                        </td>
                                    </tr>
                                ) : (
                                    shipoutItemList.map((list, index) => (
                                        <React.Fragment key={list.index_id || index}>
                                            <tr key={list.index_id || index} className={`border-b hover:bg-gray-700 hover:bg-opacity-30 transition-colors`} style={{ borderColor: "#40404042" }}>
                                                <td className="py-2 px-2 text-gray-400 text-center text-custom-sm" onClick={(e) => e.stopPropagation()}>
                                                    <button
                                                        onClick={() => handleToggleRow(list.index_id)}
                                                        className={`px-1 py-1 ${
                                                            expanded_ShipoutItem.includes(list.index_id) ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"
                                                        } text-white rounded-lg transition-colors text-xs`}
                                                    >
                                                        {expanded_ShipoutItem.includes(list.index_id) ? <Minus size={16} /> : <Plus size={16} />}
                                                    </button>
                                                </td>
                                                <td className="py-2 px-2" onClick={(e) => e.stopPropagation()}>
                                                    <div className="flex items-center justify-center h-full">
                                                        <CustomCheckbox checked={selectedParents.includes(list.index_id)} onChange={(checked) => handleSelectParent(list.index_id, checked)} />
                                                    </div>
                                                </td>
                                                <td className="py-2 px-2 text-gray-400 text-left text-custom-sm">
                                                    <div className="flex items-center space-x-3">
                                                        <div>
                                                            <div className="group flex items-center">
                                                                <p className="text-gray-400 text-custom-sm">{highlightMatch(list.invoice_no, searchTerm)}</p>
                                                                <CopyToClipboard text={list.invoice_no || ""} />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-2 px-2 text-gray-400 text-left text-custom-sm">
                                                    <div className="flex items-center space-x-3">
                                                        <div>
                                                            <div className="group flex items-center">
                                                                <p className="text-gray-400 text-custom-sm">{highlightMatch(list.customer_code, searchTerm)}</p>
                                                                <CopyToClipboard text={list.customer_code || ""} />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-2 px-2 text-gray-400 text-left text-custom-sm">
                                                    <div className="flex items-center space-x-3">
                                                        <div>
                                                            <div className="group flex items-center">
                                                                <p className="text-gray-400 text-custom-sm">
                                                                    {highlightMatch(lang === "en" ? list.account_name_en : list.account_name_cn, searchTerm)}
                                                                </p>
                                                                <CopyToClipboard text={lang === "en" ? list.account_name_en || "" : list.account_name_cn || ""} />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-2 px-2 text-gray-400 text-left text-custom-sm">
                                                    <div className="flex items-center space-x-3">
                                                        <div>
                                                            <div className="group flex items-center">
                                                                <p className="text-gray-400 text-custom-sm">
                                                                    {highlightMatch(lang === "en" ? list.shipping_stat_en : list.shipping_stat_cn, searchTerm)}
                                                                </p>
                                                                <CopyToClipboard text={lang === "en" ? list.shipping_stat_en || "" : list.shipping_stat_cn || ""} />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-2 px-2 text-gray-400 text-left text-custom-sm">{list.qty}</td>
                                            </tr>
                                            {expanded_ShipoutItem.includes(list.index_id) && (
                                                <tr>
                                                    <td colSpan={7} className="py-2 px-2">
                                                        <table className="w-full" style={{ backgroundColor: "#060818" }}>
                                                            <thead className="sticky top-0 z-[1] py-1 px-2" style={{ backgroundColor: "#1f2132" }}>
                                                                <tr className="border-b" style={{ borderColor: "#2d2d30" }}>
                                                                    <th className="w-[3%] text-left py-2 px-2 text-gray-400 text-sm border border-[#40404042]">
                                                                        <div className="flex items-center justify-center h-full">
                                                                            <CustomCheckbox
                                                                                checked={selectedChildren[list.index_id]?.length === shipoutItemDetailMap[list.index_id]?.length}
                                                                                onChange={(checked) => handleSelectAllChildren(list.index_id, checked)}
                                                                            />
                                                                        </div>
                                                                    </th>

                                                                    <th className="w-[12%] text-left py-2 px-2 text-gray-400 text-sm w-12 border border-[#40404042]">
                                                                        {translations["AR Invoice No"]}
                                                                    </th>
                                                                    <th className="w-[10%] text-left py-2 px-2 text-gray-400 text-sm w-12 border border-[#40404042]">{translations["Product Code"]}</th>
                                                                    <th className="w-[19%] text-left py-2 px-2 text-gray-400 text-sm w-12 border border-[#40404042]">{translations["Product Name"]}</th>
                                                                    <th className="w-[5%] text-center py-2 px-2 text-gray-400 text-sm w-12 border border-[#40404042]">{translations["Qty"]}</th>
                                                                    <th className="w-[9%] text-center py-2 px-2 text-gray-400 text-sm w-12 border border-[#40404042]">
                                                                        {translations["Ready To Ship"]}
                                                                    </th>
                                                                    <th className="w-[7%] text-center py-2 px-2 text-gray-400 text-sm w-12 border border-[#40404042]">{translations["Shipped"]}</th>
                                                                    <th className="w-[7%] text-center py-2 px-2 text-gray-400 text-sm w-12 border border-[#40404042]">{translations["Ready"]}</th>
                                                                    <th className="w-[7%] text-center py-2 px-2 text-gray-400 text-sm w-12 border border-[#40404042]">{translations["Rem Qty"]}</th>
                                                                    <th className="w-[25%] text-left py-2 px-2 text-gray-400 text-sm w-12 border border-[#40404042]">{translations["Remarks"]}</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {shipoutItemDetailMap[list.index_id] && shipoutItemDetailMap[list.index_id]!.length > 0 ? (
                                                                    shipoutItemDetailMap[list.index_id]!.map((detail, i) => (
                                                                        <tr key={detail.id || i}>
                                                                            <td
                                                                                className="py-2 px-2 text-gray-400 text-left text-custom-sm border border-[#40404042]"
                                                                                onClick={(e) => e.stopPropagation()}
                                                                            >
                                                                                <div className="flex items-center justify-center h-full">
                                                                                    <CustomCheckbox
                                                                                        checked={selectedChildren[list.index_id]?.includes(detail.id)}
                                                                                        onChange={(checked) => handleSelectChild(list.index_id, detail.id, checked)}
                                                                                    />
                                                                                </div>
                                                                            </td>
                                                                            <td className="py-2 px-2 text-gray-400 text-left text-custom-sm border border-[#40404042]">
                                                                                <div className="group flex items-center">
                                                                                    <p className="text-gray-400 text-custom-sm">
                                                                                        {highlightMatch(lang === "en" ? detail.invoice_no : detail.invoice_no, searchTerm)}
                                                                                    </p>
                                                                                    <CopyToClipboard text={lang === "en" ? detail.invoice_no || "" : detail.invoice_no || ""} />
                                                                                </div>
                                                                            </td>
                                                                            <td className="py-2 px-2 text-gray-400 text-left text-custom-sm border border-[#40404042]">
                                                                                <div className="group flex items-center">
                                                                                    <p className="text-gray-400 text-custom-sm">
                                                                                        {highlightMatch(lang === "en" ? detail.product_code : detail.product_code, searchTerm)}
                                                                                    </p>
                                                                                    <CopyToClipboard text={lang === "en" ? detail.product_code || "" : detail.product_code || ""} />
                                                                                </div>
                                                                            </td>
                                                                            <td className="py-2 px-2 text-gray-400 text-left text-custom-sm border border-[#40404042]">
                                                                                <div className="group flex items-center">
                                                                                    <p className="text-gray-400 text-custom-sm">
                                                                                        {highlightMatch(lang === "en" ? detail.product_title_en : detail.product_title_cn, searchTerm)}
                                                                                    </p>
                                                                                    <CopyToClipboard text={lang === "en" ? detail.product_title_en || "" : detail.product_title_cn || ""} />
                                                                                </div>
                                                                            </td>
                                                                            <td className="py-2 px-2 text-gray-400 text-center text-custom-sm border border-[#40404042]">{detail.qty}</td>
                                                                            <td className="py-2 px-2 text-gray-400 text-center text-custom-sm border border-[#40404042]">{detail.on_ship_qty_new}</td>
                                                                            <td className="py-2 px-2 text-gray-400 text-center text-custom-sm border border-[#40404042]">{detail.shipped_qty}</td>
                                                                            <td className="py-2 px-2 text-gray-400 text-center text-custom-sm border border-[#40404042]">
                                                                                <input
                                                                                    type="number"
                                                                                    value={detail.ready}
                                                                                    onChange={(e) => {
                                                                                        const value = e.target.value === "" ? "" : Number(e.target.value);
                                                                                        if (typeof value === "number" && value > detail.remaining_qty) {
                                                                                            showErrorToast(translations["Remaining quantity is"] + " " + detail.remaining_qty);
                                                                                            return;
                                                                                        }
                                                                                        setPreparedShipmentDetailMap((prev: any) => {
                                                                                            const parentId = list.index_id;
                                                                                            const details = prev[parentId] || [];
                                                                                            const updatedDetails = details.map((item: any) =>
                                                                                                item.id === detail.id ? { ...item, ready: value } : item
                                                                                            );
                                                                                            return {
                                                                                                ...prev,
                                                                                                [parentId]: updatedDetails,
                                                                                            };
                                                                                        });
                                                                                    }}
                                                                                    onFocus={(e) => {
                                                                                        if (e.target.value === "0") {
                                                                                            e.target.select();
                                                                                        }
                                                                                    }}
                                                                                    className="w-full px-3 py-1.5 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-sm rounded text-center"
                                                                                />
                                                                            </td>
                                                                            <td className="py-2 px-2 text-gray-400 text-center text-custom-sm border border-[#40404042]">{detail.remaining_qty}</td>
                                                                            <td className="py-2 px-2 text-gray-400 text-center text-custom-sm border border-[#40404042]">
                                                                                <input
                                                                                    type="text"
                                                                                    value={detail.remarks}
                                                                                    onChange={(e) => {
                                                                                        const value = e.target.value;
                                                                                        setPreparedShipmentDetailMap((prev: any) => {
                                                                                            const parentId = list.index_id;
                                                                                            const details = prev[parentId] || [];
                                                                                            const updatedDetails = details.map((item: any) =>
                                                                                                item.id === detail.id ? { ...item, remarks: value } : item
                                                                                            );
                                                                                            return {
                                                                                                ...prev,
                                                                                                [parentId]: updatedDetails,
                                                                                            };
                                                                                        });
                                                                                    }}
                                                                                    onFocus={(e) => {
                                                                                        if (e.target.value === "0") {
                                                                                            e.target.select();
                                                                                        }
                                                                                    }}
                                                                                    className="w-full px-3 py-1.5 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-sm rounded"
                                                                                />
                                                                            </td>
                                                                        </tr>
                                                                    ))
                                                                ) : (
                                                                    <tr>
                                                                        <td colSpan={10} className="py-2 px-2 text-center text-gray-400 text-sm border border-[#40404042]">
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
                        <ExportReportSelector
                            formats={["odt", "ods", "xlsx"]}
                            baseName="PrepareShipment"
                            ids={selectedParents.length > 0 ? selectedParents : shipoutItemList.map((p) => p.id)}
                            language={lang}
                        />
                    </div>
                    <div className="flex items-center space-x-1">{/* Optional right side content */}</div>
                </div>
                {renderPopup()}
            </div>
        </div>
    );
};
export default PreparedShipment;
