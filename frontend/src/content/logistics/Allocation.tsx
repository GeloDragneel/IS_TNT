import React, { useState, useEffect, useMemo } from "react";
import { allocationService, ApiAllocations, DetailsRow } from "@/services/allocationService";
import { useLanguage } from "@/context/LanguageContext";
import Pagination from "@/components/Pagination";
import { dashboardService } from "@/services/dashboardService";
import ItemsPerPageSelector from "@/components/ItemsPerPageSelector";
import PusherEcho from "@/utils/echo";
import CopyToClipboard from "@/components/CopyToClipboard";
import { highlightMatch } from "@/utils/highlightMatch";
import { X, Minus, Plus, PackageCheck, CheckCircle, DollarSign, AlertCircle, Clock, ArrowDownCircle } from "lucide-react";
import CustomCheckbox from "@/components/CustomCheckbox";
import { formatDate } from "@/utils/globalFunction";
import { showConfirm } from "@/utils/alert";
import { ExportReportSelector } from "@/utils/ExportReportSelector";
import { showErrorToast, showSuccessToast } from "@/utils/toast";
import { BarChart, Bar, LabelList, Tooltip, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid } from "recharts";
// Handle the Smooth skeleton loading
const MemoizedPagination = React.memo(Pagination);
const MemoizedItemsPerPageSelector = React.memo(ItemsPerPageSelector);

interface AllocationListProps {
    tabId: string;
}
interface DashboardFields {
    month: string;
    name: string;
    value: number;
    color: string;
}
// localStorage.clear();
const AllocationList: React.FC<AllocationListProps> = ({ tabId }) => {
    const { translations, lang } = useLanguage();
    const [allocationLists, setAllocation] = useState<ApiAllocations[]>([]);
    const [totalPages, setTotalPages] = useState(1);
    const pageSizeOptions = useMemo(() => [15, 20, 50, -1], []);
    const [expanded_Allocation, setExpandedRows] = useState<number[]>([]);
    const [allocationDetailMap, setAllocationDetailMap] = useState<Record<number, DetailsRow[] | null>>({});
    const [selectedDetails, selectedAllocation] = useState<number[]>([]);
    const [showEdit, setShowEdit] = useState(false);
    const [isDisable, setDisable] = useState(false);
    const [withdrawFromInventory, setTopWithdrawInventory] = useState<DashboardFields[]>([]);
    const [monthlyDelivery, setMonthlyDelivery] = useState<DashboardFields[]>([]);
    const [totalPaid, setTotalPaid] = useState("0");
    const [totalUnPaid, setTotalUnPaid] = useState("0");
    const [totalAllocated, setTotalAllocated] = useState("0");
    const [totalReceived, setTotalReceived] = useState("0");
    const [pendingAllocation, setPendingAllocation] = useState("0");
    const [withdrawInventory, setWithdrawInventory] = useState("0");
    const [currentPage, setCurrentPage] = useState(() => {
        const metaKey = `${tabId}-cached-meta-allocation`;
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
        const metaKey = `${tabId}-cached-meta-allocation`;
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
        const cached = localStorage.getItem(`${tabId}-cached-meta-allocation`);
        if (!cached) return "";
        try {
            const meta = JSON.parse(cached);
            return meta.search || "";
        } catch {
            return "";
        }
    });
    const now = new Date();
    const currentYearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const [formData, setFormData] = useState({
        qty: 0,
        allocation_id: 0,
        date_to2: currentYearMonth,
    });

    useEffect(() => {
        const channel = PusherEcho.channel("allocation-channel");
        channel.listen(".allocation-event", () => {
            setTimeout(() => {
                fetchAllocation(currentPage, itemsPerPage, searchTerm);
            }, 500);
        });
        return () => {
            PusherEcho.leave("allocation-channel");
        };
    }, [currentPage, itemsPerPage, searchTerm, tabId]);

    // ON LOAD LIST
    useEffect(() => {
        fetchAllocation(currentPage, itemsPerPage, searchTerm);
    }, [currentPage, itemsPerPage, searchTerm, tabId]);

    useEffect(() => {
        const fetchDashboard = async () => {
            const dateStr = formData.date_to2;
            const [year, month] = dateStr.split("-");
            const data = await dashboardService.getDashboardAllocation(Number(month), Number(year));
            const invWithdrawGrouped = data.invWithdrawGrouped;
            const allocatedMonth = data.allocatedMonth;
            const mapToWithdrawInventory: DashboardFields[] = invWithdrawGrouped.map((item: any) => ({
                position: lang === "en" ? item.account_name_en : item.account_name_cn,
                count: item.count,
            }));
            const monthlyDelivery: DashboardFields[] = allocatedMonth.map((item: any) => ({
                month: translations[item.month] || item.month,
                value: item.value,
            }));
            setTopWithdrawInventory(mapToWithdrawInventory);
            setMonthlyDelivery(monthlyDelivery);
            setTotalAllocated(data.totalAllocated);
            setTotalPaid(data.totalAllocatedPaid);
            setTotalUnPaid(data.totalAllocatedUnPaid);
            setTotalReceived(data.totalReceived);
            setPendingAllocation(data.totalUnAllocated);
            setWithdrawInventory(data.totalWithdraw);
        };
        fetchDashboard();
    }, [lang, formData.date_to2]);

    const fetchAllocation = async (page = currentPage, perPage = itemsPerPage, search = "") => {
        try {
            localStorage.setItem(`${tabId}-loading-allocation`, JSON.stringify(true));
            const paginatedData = await allocationService.getAllocation(page, perPage, search);
            setAllocation(paginatedData.data);
            setTotalPages(paginatedData.last_page);
        } catch (err) {
            console.error("Error fetching allocation:", err);
        } finally {
            localStorage.setItem(`${tabId}-loading-allocation`, JSON.stringify(false));
        }
    };
    const filteredAllocation = allocationLists.filter((supplier) => {
        const searchLower = searchTerm.toLowerCase();
        return (
            supplier.grn_no?.toLowerCase().includes(searchLower) ||
            supplier.warehouse?.toLowerCase().includes(searchLower) ||
            supplier.product_code?.toLowerCase().includes(searchLower) ||
            supplier.product_title_en?.toLowerCase().includes(searchLower) ||
            supplier.product_title_cn?.toLowerCase().includes(searchLower)
        );
    });
    const handleToggleRow = async (tableId: number) => {
        const isExpanded = expanded_Allocation.includes(tableId);
        const cachedKey = tabId + "_cachedGRNDetails_" + tableId;
        const expandedKey = tabId + "_expandedKey";

        if (isExpanded) {
            // Collapse row
            const updated = expanded_Allocation.filter((id) => id !== tableId);
            setExpandedRows(updated);
            localStorage.setItem(expandedKey, JSON.stringify(updated));
        } else {
            // Expand row
            const updated = [...expanded_Allocation, tableId];
            setExpandedRows(updated);
            localStorage.setItem(expandedKey, JSON.stringify(updated));
            try {
                const data = allocationLists.find((po) => po.id === tableId);
                if (!data?.details) {
                    console.error("No details found for this PO");
                    setAllocationDetailMap((prev) => ({ ...prev, [tableId]: null }));
                    return;
                }
                const details: DetailsRow[] = data.details;
                setAllocationDetailMap((prev) => ({ ...prev, [tableId]: details }));
                localStorage.setItem(cachedKey, JSON.stringify(details));
            } catch (error) {
                console.error(`Failed to load details for product ${tableId}`, error);
                setAllocationDetailMap((prev) => ({ ...prev, [tableId]: null }));
            }
        }
    };
    const handleSelectAllocation = (id: number, checked: boolean) => {
        if (checked) {
            selectedAllocation((prev) => [...prev, id]);
        } else {
            selectedAllocation((prev) => prev.filter((pid) => pid !== id));
        }
    };
    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            const allIds = allocationLists?.map((p: any) => p.id);
            selectedAllocation(allIds);
        } else {
            selectedAllocation([]);
        }
    };
    const handleDeleteAllocation = async (id: number) => {
        const confirmed = await showConfirm(translations["System Message"], translations["Are you sure you want to delete this record?"], translations["Delete"], translations["Cancel"]);
        if (!confirmed) return;
        setDisable(true);
        try {
            await allocationService.deleteAllocation([id]);
            setAllocationDetailMap((prev) => {
                const updated = { ...prev };
                for (const key in updated) {
                    if (updated[key]) {
                        updated[key] = updated[key]!.filter((detail) => detail.id !== id);
                    }
                }
                return updated;
            });
            setDisable(false);
            showSuccessToast(translations["Record has been Deleted"]);
            fetchAllocation(currentPage, itemsPerPage, searchTerm);
        } catch (err) {
            console.error("Deletion failed:", err);
        }
    };
    const handleChangeAllocation = async () => {
        if (formData.qty > 0) {
            const res = await allocationService.updateAllocation(formData.qty, formData.allocation_id);
            if (res.token === "Error") {
                showErrorToast(res.message);
                return;
            }
            setAllocationDetailMap((prev) => {
                const updatedMap = { ...prev };
                for (const key in updatedMap) {
                    if (updatedMap[key]) {
                        updatedMap[key] = updatedMap[key]!.map((detail) => (detail.id === formData.allocation_id ? { ...detail, qty: formData.qty } : detail));
                    }
                }
                return updatedMap;
            });
            setShowEdit(false);
            showSuccessToast(translations[res.message]);
            fetchAllocation(currentPage, itemsPerPage, searchTerm);
        }
    };
    const renderPopup = () => {
        if (!showEdit) return null;
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-[#19191c] rounded-xl border border-[#ffffff1a] w-[20vw] h-auto flex flex-col">
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-[#ffffff1a]">
                        <div className="flex items-center space-x-4">
                            <h2 className="text-xl font-bold text-white">{translations["Change Quantity allocation"]}</h2>
                        </div>
                        <div className="flex items-center space-x-4">
                            <button
                                onClick={() => {
                                    setShowEdit(false);
                                }}
                                className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                            >
                                <X className="h-6 w-6 text-white" />
                            </button>
                        </div>
                    </div>
                    {/* Content */}
                    <div className="grid grid-cols-12 gap-4 p-4">
                        <div className="col-span-12 flex flex-col">
                            <label className="text-gray-400 text-sm mb-1">{translations["Qty"]}</label>
                            <input
                                type="number"
                                value={formData.qty}
                                onChange={(e) => {
                                    const value = Number(e.target.value);
                                    setFormData((prev) => ({ ...prev, qty: value }));
                                }}
                                className="flex-1 px-3 py-2 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm"
                            />
                        </div>
                    </div>
                    {/* Footer */}
                    <div className="p-2 border-t border-[#ffffff1a] flex justify-end space-x-1">
                        <button onClick={() => setShowEdit(false)} className="px-2 py-2 bg-gray-700 hover:bg-gray-600 rounded text-white transition">
                            {translations["Close"]}
                        </button>
                        <button disabled={isDisable} onClick={() => handleChangeAllocation()} className={`px-2 py-2 bg-cyan-600 hover:bg-cyan-500 rounded text-white transition`}>
                            {translations["Change allocation"]}
                        </button>
                    </div>
                </div>
            </div>
        );
    };
    return (
        <div className="grid grid-cols-12 gap-1">
            <div className="col-span-3 h-[calc(100vh-70px)] overflow-y-auto pr-2">
                {/* Sticky Header */}
                <div className="sticky top-0 z-10 bg-[#19191c] border-b border-gray-700 p-4 rounded-lg shadow-md border">
                    <div className="flex gap-2 items-center">
                        <span className="text-[#ffffffcc]">{translations["Filter"]} : </span>
                        <input
                            type="month"
                            value={formData.date_to2}
                            onChange={(e) => {
                                const value = e.target.value;
                                setFormData((prev) => ({ ...prev, date_to2: value }));
                            }}
                            className="flex-1 px-3 py-2 border-[1px] border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm rounded"
                            placeholder="End Month"
                        />
                    </div>
                </div>
                {/* Cards Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-2 mt-2">
                    {[
                        { title: translations["Total Received"] || "Total Received", value: totalReceived, icon: PackageCheck, bg: "bg-green-900/50", iconColor: "text-green-400" },
                        { title: translations["Total Allocated"] || "Total Allocated", value: totalAllocated, icon: CheckCircle, bg: "bg-blue-900/50", iconColor: "text-blue-400" },
                        {
                            title: translations["Paid Allocation"] || "Paid Allocation",
                            value: totalPaid,
                            icon: DollarSign,
                            bg: "bg-purple-900/50",
                            iconColor: "text-purple-400",
                        },
                        {
                            title: translations["Unpaid Allocation"] || "Unpaid Allocation",
                            value: totalUnPaid,
                            icon: AlertCircle,
                            bg: "bg-orange-900/50",
                            iconColor: "text-orange-400",
                        },
                        {
                            title: translations["Pending Allocation"] || "Pending Allocation",
                            value: pendingAllocation,
                            icon: Clock,
                            bg: "bg-cyan-900/50",
                            iconColor: "text-cyan-400",
                        },
                        {
                            title: translations["Withdraw Inventory"] || "Withdraw Inventory",
                            value: withdrawInventory,
                            icon: ArrowDownCircle,
                            bg: "bg-red-900/50",
                            iconColor: "text-red-400",
                        },
                    ].map((card, idx) => (
                        <div key={idx} className="p-4 rounded-lg shadow-md border border-gray-700" style={{ backgroundColor: "#19191c", borderColor: "#404040" }}>
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-gray-400 text-sm">{card.title}</p>
                                    <p className="text-2xl font-bold text-white mt-1">{card.value}</p>
                                </div>
                                <div className={`${card.bg} p-3 rounded-lg`}>
                                    <card.icon className={card.iconColor} size={24} />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
                <div
                    className="p-4 rounded-lg shadow-md border mb-2"
                    style={{
                        backgroundColor: "#19191c",
                        borderColor: "#404040",
                    }}
                >
                    <h2 className="text-lg font-bold text-white mb-4">{translations["Allocation Over 6 Months"] || "Allocation Over 6 Months"}</h2>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={monthlyDelivery} margin={{ top: 20, right: 30, left: 10, bottom: 0 }}>
                            <CartesianGrid stroke="#303030" strokeDasharray="4 4" />
                            <XAxis dataKey="month" stroke="#aaa" tick={{ fontSize: 12, fontWeight: 500 }} axisLine={{ stroke: "#555" }} tickLine={false} />
                            <YAxis
                                stroke="#aaa"
                                tick={{ fontSize: 12, fontWeight: 500 }}
                                axisLine={{ stroke: "#555" }}
                                tickLine={false}
                                tickFormatter={(value) => {
                                    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
                                    if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
                                    return value;
                                }}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: "#22222b",
                                    border: "1px solid #0891B2",
                                    color: "#eee",
                                    fontSize: 14,
                                    borderRadius: 6,
                                    boxShadow: "0 0 10px #0891B2aa",
                                }}
                                itemStyle={{ color: "#0891B2", fontWeight: "bold" }}
                                formatter={(value) => `${value.toLocaleString()}`}
                            />
                            <Line
                                type="monotone"
                                dataKey="value"
                                stroke="#0891b2"
                                strokeWidth={3}
                                dot={{ r: 4, fill: "#0891b2", stroke: "white", strokeWidth: 1 }}
                                activeDot={{ r: 6, fill: "#0891b2", stroke: "white", strokeWidth: 2 }}
                                style={{ filter: "drop-shadow(0 0 5px #0891B2aa)" }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
                <div
                    className="p-6 rounded-lg shadow-md border mb-4"
                    style={{
                        backgroundColor: "#19191c",
                        borderColor: "#404040",
                        height: 360,
                        paddingBottom: 20, // extra padding for X-axis labels
                    }}
                >
                    <h2 className="text-lg font-bold text-white mb-4">{translations["Withdraw From Inventory"]}</h2>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            layout="vertical"
                            data={withdrawFromInventory}
                            margin={{ top: 5, right: 30, left: 5, bottom: 30 }} // increased bottom margin
                        >
                            <CartesianGrid strokeDasharray="3 3" stroke="#303030" />
                            <XAxis type="number" stroke="#aaa" tick={{ fontSize: 14, fontWeight: 600 }} axisLine={{ stroke: "#555" }} tickLine={false} allowDecimals={false} />
                            <YAxis dataKey="position" type="category" width={170} stroke="#aaa" tick={{ fontSize: 14, fontWeight: 600 }} axisLine={false} tickLine={false} />
                            <Tooltip
                                cursor={{ fill: "rgba(255, 255, 255, 0.1)" }}
                                contentStyle={{
                                    backgroundColor: "#22222b",
                                    border: "1px solid #0891B2",
                                    color: "#eee",
                                    fontSize: 14,
                                    borderRadius: 6,
                                    boxShadow: "0 0 10px #0891B2aa",
                                }}
                                itemStyle={{ color: "#0891B2", fontWeight: "bold" }}
                                formatter={(value) => `${value.toLocaleString()}`}
                            />
                            <Bar dataKey="count" fill="#22c55e" barSize={20} radius={[5, 5, 5, 5]}>
                                <LabelList dataKey="count" position="right" style={{ fill: "#fff", fontWeight: "bold", fontSize: 14 }} />
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
            <div className="col-span-9">
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
                            </div>
                        </div>
                        {/* Table */}
                        <div className="overflow-x-auto flex-grow">
                            <div className="h-[calc(100vh-180px)] overflow-y-auto">
                                <table className="w-full">
                                    <thead className="sticky top-0 z-[1]" style={{ backgroundColor: "#1f2132" }}>
                                        <tr className="border-b" style={{ borderColor: "#2d2d30" }}>
                                            <th className=" text-left py-2 px-2 text-gray-400 text-sm w-[4%]"></th>
                                            <th className=" text-left py-2 px-2 text-gray-400 text-sm w-[4%]">
                                                <div className="flex items-center h-full">
                                                    <CustomCheckbox
                                                        checked={selectedDetails.length === allocationLists?.length && allocationLists?.length > 0}
                                                        onChange={(checked) => handleSelectAll(checked)}
                                                    />
                                                </div>
                                            </th>
                                            <th className=" text-left py-2 px-2 text-gray-400 text-sm w-[15%]">{translations["GRN No"]}</th>
                                            <th className=" text-left py-2 px-2 text-gray-400 text-sm w-[10%]">{translations["GRN Date"]}</th>
                                            <th className=" text-left py-2 px-2 text-gray-400 text-sm w-[10%]">{translations["Ware House"]}</th>
                                            <th className=" text-left py-2 px-2 text-gray-400 text-sm w-[10%]">{translations["Product Code"]}</th>
                                            <th className=" text-left py-2 px-2 text-gray-400 text-sm w-[30%]">{translations["Product Name"]}</th>
                                            <th className=" text-center py-2 px-2 text-gray-400 text-sm w-[8%]">{translations["Received Qty"]}</th>
                                            <th className=" text-center py-2 px-2 text-gray-400 text-sm w-[9%]">{translations["Allocated Qty"]}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredAllocation.map((list, index) => (
                                            <React.Fragment key={list.id || index}>
                                                <tr
                                                    key={list.id || index}
                                                    className={`clickable border-b hover:bg-gray-700 hover:bg-opacity-30 transition-colors cursor-pointer`}
                                                    style={{ borderColor: "#40404042" }}
                                                >
                                                    <td className="py-2 px-2 text-gray-400 text-center text-custom-sm" onClick={(e) => e.stopPropagation()}>
                                                        <button
                                                            onClick={() => handleToggleRow(list.id)}
                                                            className={`px-1 py-1 ${
                                                                expanded_Allocation.includes(list.id) ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"
                                                            } text-white rounded-lg transition-colors text-xs`}
                                                        >
                                                            {expanded_Allocation.includes(list.id) ? <Minus size={16} /> : <Plus size={16} />}
                                                        </button>
                                                    </td>
                                                    <td className="py-2 px-2" onClick={(e) => e.stopPropagation()}>
                                                        <CustomCheckbox
                                                            checked={selectedDetails.includes(list.id as number)}
                                                            onChange={(checked) => handleSelectAllocation(list.id as number, checked)}
                                                        />
                                                    </td>
                                                    <td className="py-2 px-2 text-gray-400 text-left text-custom-sm">
                                                        <div className="group flex items-center">
                                                            <p className="text-gray-400 text-custom-sm">{highlightMatch(list.grn_no, searchTerm)}</p>
                                                            <CopyToClipboard text={list.grn_no ?? ""} />
                                                        </div>
                                                    </td>
                                                    <td className="py-2 px-2 text-gray-400 text-left text-custom-sm">{formatDate(list.grn_date, lang)}</td>
                                                    <td className="py-2 px-2 text-gray-400 text-left text-custom-sm">{list.warehouse}</td>
                                                    <td className="py-2 px-2 text-gray-400 text-left text-custom-sm">
                                                        <div className="group flex items-center">
                                                            <p className="text-gray-400 text-custom-sm">
                                                                {list.product_code ? highlightMatch(list.product_code, searchTerm) : translations["Deleted"] || "Deleted"}
                                                            </p>
                                                            <CopyToClipboard text={list.product_code ? list.product_code : ""} />
                                                        </div>
                                                    </td>
                                                    <td className="py-2 px-2 text-gray-400 text-left text-custom-sm">
                                                        {highlightMatch(
                                                            lang === "en"
                                                                ? list.product_title_en
                                                                    ? list.product_title_en
                                                                    : translations["Deleted"] || "Deleted"
                                                                : list && list.product_title_cn
                                                                ? list.product_title_cn
                                                                : translations["Deleted"] || "Deleted",
                                                            searchTerm
                                                        )}
                                                    </td>
                                                    <td className="py-2 px-2 text-gray-400 text-center text-custom-sm">{list.received_qty}</td>
                                                    <td className="py-2 px-2 text-gray-400 text-center text-custom-sm">{list.allocation}</td>
                                                </tr>
                                                {expanded_Allocation.includes(list.id) && (
                                                    <tr>
                                                        <td colSpan={12} className="py-2 px-2">
                                                            <table className="w-full" style={{ backgroundColor: "#060818" }}>
                                                                <thead className="sticky top-0 z-[1] py-1 px-4" style={{ backgroundColor: "#1f2132" }}>
                                                                    <tr className="border-b" style={{ borderColor: "#2d2d30" }}>
                                                                        <th className="w-auto text-left py-2 px-2 text-gray-400 text-sm w-12 border border-[#40404042]">
                                                                            {translations["Customer Code"]}
                                                                        </th>
                                                                        <th className="w-auto text-left py-2 px-2 text-gray-400 text-sm w-12 border border-[#40404042]">
                                                                            {translations["Customer Name"]}
                                                                        </th>
                                                                        <th className="w-auto text-center py-2 px-2 text-gray-400 text-sm w-12 border border-[#40404042]">{translations["Qty"]}</th>
                                                                        <th className="w-auto text-left py-2 px-2 text-gray-400 text-sm w-12 border border-[#40404042]">
                                                                            {translations["ShippingStatus2"]}
                                                                        </th>
                                                                        <th className="w-auto text-left py-2 px-2 text-gray-400 text-sm w-12 border border-[#40404042]">{translations["Warehouse"]}</th>
                                                                        <th className="w-auto text-left py-2 px-2 text-gray-400 text-sm w-12 border border-[#40404042]">{translations["SO No"]}</th>
                                                                        <th className="w-auto text-left py-2 px-2 text-gray-400 text-sm w-12 border border-[#40404042]">
                                                                            {translations["Invoice No"]}
                                                                        </th>
                                                                        <th className="w-auto text-center py-2 px-2 text-gray-400 text-sm w-12 border border-[#40404042]">{translations["Action"]}</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody>
                                                                    {allocationDetailMap[list.id] && allocationDetailMap[list.id]!.length > 0 ? (
                                                                        allocationDetailMap[list.id]!.map((detail, i) => (
                                                                            <tr key={detail.id || i}>
                                                                                <td className="py-2 px-2 text-gray-400 text-left text-custom-sm border border-[#40404042]">
                                                                                    <div className="group flex items-center">
                                                                                        <p className="text-gray-400 text-custom-sm">
                                                                                            {detail.customer_code
                                                                                                ? highlightMatch(detail.customer_code, searchTerm)
                                                                                                : translations["Deleted"] || "Deleted"}
                                                                                        </p>
                                                                                        <CopyToClipboard text={detail.customer_code ? detail.customer_code : ""} />
                                                                                    </div>
                                                                                </td>
                                                                                <td className="py-2 px-2 text-gray-400 text-left text-custom-sm border border-[#40404042]">
                                                                                    {highlightMatch(
                                                                                        lang === "en"
                                                                                            ? detail.account_name_en
                                                                                                ? detail.account_name_en
                                                                                                : translations["Deleted"] || "Deleted"
                                                                                            : detail.account_name_cn
                                                                                            ? detail.account_name_cn
                                                                                            : translations["Deleted"] || "Deleted",
                                                                                        searchTerm
                                                                                    )}
                                                                                </td>
                                                                                <td className="py-2 px-2 text-gray-400 text-center text-custom-sm border border-[#40404042]">{detail.qty}</td>
                                                                                <td className="py-2 px-2 text-gray-400 text-left text-custom-sm border border-[#40404042]">
                                                                                    {highlightMatch(
                                                                                        lang === "en"
                                                                                            ? detail.shipping_stat_en
                                                                                                ? detail.shipping_stat_en
                                                                                                : translations["N.A."] || "N.A."
                                                                                            : detail.shipping_stat_cn
                                                                                            ? detail.shipping_stat_cn
                                                                                            : translations["N.A."] || "N.A.",
                                                                                        searchTerm
                                                                                    )}
                                                                                </td>
                                                                                <td className="py-2 px-2 text-gray-400 text-left text-custom-sm border border-[#40404042]">{detail.warehouse}</td>
                                                                                <td className="py-2 px-2 text-gray-400 text-left text-custom-sm border border-[#40404042]">
                                                                                    <div className="group flex items-center">
                                                                                        <p className="text-gray-400 text-custom-sm">
                                                                                            {detail.so_number ? highlightMatch(detail.so_number, searchTerm) : translations["N.A."] || "N.A."}
                                                                                        </p>
                                                                                        <CopyToClipboard text={detail.so_number ? detail.so_number : ""} />
                                                                                    </div>
                                                                                </td>
                                                                                <td className="py-2 px-2 text-gray-400 text-left text-custom-sm border border-[#40404042]">
                                                                                    <div className="group flex items-center">
                                                                                        <p className="text-gray-400 text-custom-sm">
                                                                                            {detail.invoice_no ? highlightMatch(detail.invoice_no, searchTerm) : translations["N.A."] || "N.A."}
                                                                                        </p>
                                                                                        <CopyToClipboard text={detail.invoice_no ? detail.invoice_no : ""} />
                                                                                    </div>
                                                                                </td>
                                                                                <td className="py-2 px-2 text-gray-400 text-center text-custom-sm border border-[#40404042]">
                                                                                    {detail.is_account > 0 && (
                                                                                        <>
                                                                                            <button
                                                                                                type="button"
                                                                                                onClick={() => handleDeleteAllocation(detail.id)}
                                                                                                className="px-1 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm mr-2"
                                                                                            >
                                                                                                <span>{translations["Delete"]}</span>
                                                                                            </button>
                                                                                            <button
                                                                                                type="button"
                                                                                                onClick={() => {
                                                                                                    setShowEdit(true);
                                                                                                    setFormData((prev) => ({
                                                                                                        ...prev,
                                                                                                        allocation_id: detail.id,
                                                                                                        qty: detail.qty,
                                                                                                    }));
                                                                                                }}
                                                                                                className="px-1 py-1 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors text-sm"
                                                                                            >
                                                                                                <span>{translations["Edit"]}</span>
                                                                                            </button>
                                                                                        </>
                                                                                    )}
                                                                                </td>
                                                                            </tr>
                                                                        ))
                                                                    ) : (
                                                                        <tr>
                                                                            <td colSpan={8} className="py-2 px-2 text-center text-gray-400 text-sm border border-[#40404042]">
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
                                    baseName="AllocationList"
                                    ids={selectedDetails.length > 0 ? selectedDetails : allocationLists.map((p) => p.id)}
                                    language={lang}
                                />
                            </div>
                            <div className="flex items-center space-x-1">{/* Optional right side content */}</div>
                        </div>
                        {renderPopup()}
                    </div>
                </div>
            </div>
        </div>
    );
};
export default AllocationList;
