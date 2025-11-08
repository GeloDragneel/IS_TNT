import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { receiveGoodService, ApiReceiveGoods, DetailsRow, FilterParams } from "@/services/receiveGoodService";
import { useLanguage } from "@/context/LanguageContext";
import CustomCheckbox from "@/components/CustomCheckbox";
import { showConfirm } from "@/utils/alert";
import { dashboardService } from "@/services/dashboardService";
import { showSuccessToast, showErrorToast } from "@/utils/toast";
import Pagination from "@/components/Pagination";
import ItemsPerPageSelector from "@/components/ItemsPerPageSelector";
import CopyToClipboard from "@/components/CopyToClipboard";
import { X, Minus, Plus, ChevronDown, PackageCheck, AlertCircle } from "lucide-react";
import PusherEcho from "@/utils/echo";
import Select from "react-select";
import Flatpickr from "react-flatpickr";
import { ExportReportSelector } from "@/utils/ExportReportSelector";
import { getFlatpickrLocale } from "@/utils/flatpickrLocale";
import { fetchSuppliers, OptionType } from "@/utils/fetchDropdownData";
import { baseCurrency, DropdownData, formatDate, formatMoney, selectStyles } from "@/utils/globalFunction";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, LegendPayload, PieLabelRenderProps, LineChart, Line, XAxis, YAxis, CartesianGrid } from "recharts";
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
interface ReceiveGoodsListProps {
    tabId: string;
    onReceiveGoodsSelect: (supplierId: number, saveType?: string) => void;
    onChangeView: (view: "list" | "details") => void;
    selectedReceiveGoods: number[];
    onSelectedGRNChange: (selected: number[]) => void;
    expandedRows: number[];
    onExpandedRowsChange: (expanded: number[]) => void;
}
type FormDataType = {
    sort_by: string;
    supplier_id: number;
    category_dates: string;
    date_from: Date | null; // Allow null here
    date_to: Date | null; // Allow null here
    date_to2: string;
    supplierCodes: OptionType[];
};
interface POFooter {
    currency: string;
    total: number;
}
interface DashboardFields {
    month: string;
    name: string;
    value: number;
    color: string;
}
// localStorage.clear();
const ReceiveGoodsList: React.FC<ReceiveGoodsListProps> = ({ tabId, onReceiveGoodsSelect, selectedReceiveGoods, onSelectedGRNChange }) => {
    const { translations, lang } = useLanguage();
    const [grnList, setReceiveGoods] = useState<ApiReceiveGoods[]>([]);
    const [totalPages, setTotalPages] = useState(1);
    const locale = getFlatpickrLocale(translations);
    const pageSizeOptions = useMemo(() => [15, 20, 50, -1], []);
    const [expanded_PO, setExpandedRows] = useState<number[]>([]);
    const [orderDetailsMap, setPODetailsMap] = useState<Record<number, DetailsRow[] | null>>({});
    const [activeAdvanceSearch, setActiveAdvanceSearch] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const [showDateRange, setShowDateRange] = useState(false);
    const [showAdvanceSearch, setShowAdvanceSearch] = useState(false);
    const [allSupplier, setAllSuppliers] = useState<DropdownData[]>([]);
    const [creditsPopup, setShowCreditsPopup] = useState(false);
    const throttleTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
    const [preorderFooter2, setPreorderFooter2] = useState<POFooter[]>([]); // Changed to array
    const inputRef = useRef<HTMLInputElement>(null);
    const [loading, setLoading] = useState(() => {
        const savedLoading = localStorage.getItem(`${tabId}-loading-grn-list`);
        return savedLoading !== null ? JSON.parse(savedLoading) : true;
    });
    const [topSuppliers, setTopSuppliers] = useState<DashboardFields[]>([]);
    const [monthlyDelivery, setMonthlyDelivery] = useState<DashboardFields[]>([]);
    const [totalComingSoon, setTotalComingSoon] = useState(0);
    const [totalReceived, setTotalReceived] = useState("");

    const now = new Date();
    const currentYearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

    const [formData, setFormData] = useState<FormDataType>({
        sort_by: "Code",
        supplier_id: 0,
        category_dates: "PurchaseDate",
        supplierCodes: [],
        date_from: null as Date | null,
        date_to: null as Date | null,
        date_to2: currentYearMonth,
    });
    const [currentPage, setCurrentPage] = useState(() => {
        const metaKey = `${tabId}-cached-meta-grn-list`;
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
        const metaKey = `${tabId}-cached-meta-grn-list`;
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
        const cached = localStorage.getItem(`${tabId}-cached-meta-grn-list`);
        if (!cached) return "";
        try {
            const meta = JSON.parse(cached);
            return meta.filters.search || "";
        } catch {
            return "";
        }
    });
    const allSupplierOptions: OptionType[] = useMemo(
        () =>
            allSupplier.map((list) => ({
                value: list.value.toString(),
                value2: list.value.toString(),
                label: lang === "en" ? list.en : list.cn,
                en: list.en,
                cn: list.cn,
            })),
        [allSupplier, lang]
    );
    // REALTIME
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
        const expandedKey = tabId + "_expandedKey";
        const cachedExpandedKey = localStorage.getItem(expandedKey);

        if (cachedExpandedKey) {
            const parseExpanded: number[] = JSON.parse(cachedExpandedKey);
            let checkedIds: any = [];
            parseExpanded.forEach((tableId: number) => {
                checkedIds.push(tableId);

                const data = grnList.find((po) => po.id === tableId);

                // Save to state
                if (!data?.grn_details) {
                    setPODetailsMap((prev) => ({ ...prev, [tableId]: null }));
                    return;
                }

                const details: DetailsRow[] = data.grn_details;
                setPODetailsMap((prev) => ({ ...prev, [tableId]: details }));
            });
            setExpandedRows(checkedIds);
        }
    }, [tabId, grnList]);

    useEffect(() => {
        const channel = PusherEcho.channel("grn-channel");
        channel.listen(".grn-event", () => {
            const defaultFilters = {
                search: searchTerm,
                supplier_codes: formData.sort_by === "Code" ? formData.supplierCodes.map((c) => c.value) : [],
                date_from: formData.date_from,
                date_to: formData.date_to,
                category_dates: formData.category_dates,
            };
            fetchReceiveGoods(currentPage, itemsPerPage, defaultFilters);
        });
        return () => {
            PusherEcho.leave("grn-channel");
        };
    }, [currentPage, itemsPerPage, searchTerm, tabId]);

    useEffect(() => {
        if (tabId) {
            // Clear the previous timeout if it's still pending
            if (throttleTimeout.current) {
                clearTimeout(throttleTimeout.current);
            }
            // Set a new timeout
            throttleTimeout.current = setTimeout(() => {
                loadAllSupplier();
            }, 1000); // 1000ms (1 second) throttle time
        }

        // Cleanup timeout when component unmounts or copiedId changes
        return () => {
            if (throttleTimeout.current) {
                clearTimeout(throttleTimeout.current);
            }
        };
    }, [tabId]); // Dependency array to trigger the effect when copiedId changes

    // ON LOAD LIST
    useEffect(() => {
        const SupplierKey = `${tabId}-cached-grn-list`;
        const metaKey = `${tabId}-cached-meta-grn-list`;
        const mountKey = `${tabId}-mount-status-purchase-order`;
        const isFirstMount = sessionStorage.getItem(mountKey) !== "mounted";
        const defaultFilters = {
            search: searchTerm,
            supplier_codes: formData.sort_by === "Code" ? formData.supplierCodes.map((c) => c.value) : [],
            date_from: formData.date_from,
            date_to: formData.date_to,
            category_dates: formData.category_dates,
        };
        if (isFirstMount) {
            sessionStorage.setItem(mountKey, "mounted");
            fetchReceiveGoods(currentPage, itemsPerPage, defaultFilters);
            return;
        }
        const cachedSuppliersRaw = localStorage.getItem(SupplierKey);
        const cachedMetaRaw = localStorage.getItem(metaKey);

        if (!cachedSuppliersRaw || !cachedMetaRaw) {
            fetchReceiveGoods(currentPage, itemsPerPage, defaultFilters);
            return;
        }

        try {
            const cachedMeta = JSON.parse(cachedMetaRaw);
            const cachedSuppliers = JSON.parse(cachedSuppliersRaw);
            const isCacheValid = cachedMeta.page === currentPage && cachedMeta.perPage === itemsPerPage && JSON.stringify(cachedMeta.search) === JSON.stringify(defaultFilters.search);

            if (isCacheValid) {
                setReceiveGoods(cachedSuppliers);
                setTotalPages(cachedMeta.totalPages);
                setLoading(false);
                localStorage.setItem(`${tabId}-loading-grn-list`, JSON.stringify(false));
                return;
            }
        } catch (err) {
            console.warn("Failed to parse cached meta:", err);
        }

        fetchReceiveGoods(currentPage, itemsPerPage, defaultFilters);
    }, [currentPage, itemsPerPage, searchTerm, tabId]);

    useEffect(() => {
        const handleEsc = (event: any) => {
            if (event.key === "Escape") {
                if (creditsPopup) {
                    setShowCreditsPopup(false);
                }
                if (showAdvanceSearch) {
                    setShowAdvanceSearch(false);
                }
                if (showDateRange) {
                    setShowDateRange(false);
                }
            }
        };
        window.addEventListener("keydown", handleEsc);
        // Cleanup on unmount
        return () => {
            window.removeEventListener("keydown", handleEsc);
        };
    }, [creditsPopup, showAdvanceSearch, showDateRange]);

    useEffect(() => {
        const fetchDashboard = async () => {
            const dateStr = formData.date_to2;
            const [year, month] = dateStr.split("-");
            const data = await dashboardService.getDashboardLogistics(Number(month), Number(year));
            const topSuppliers = data.topSuppliers;
            const delivery = data.delivery;
            const mappedTopSupplier: DashboardFields[] = topSuppliers.map((item: any) => ({
                name: lang === "en" ? item.supplier_name : item.supplier_name,
                value: item.sumAmount,
                color: item.color || "bg-gray-500", // fallback color
            }));
            const monthlyDelivery: DashboardFields[] = delivery.map((item: any) => ({
                month: translations[item.month] || item.month,
                value: item.value,
            }));
            setTopSuppliers(mappedTopSupplier);
            setMonthlyDelivery(monthlyDelivery);
            setTotalComingSoon(data.totalComingSoon);
            // setTotalDepositPaid(data.totalDeposit);
            // setTotalDepositOffset(data.totalDepositOffset);
            setTotalReceived(data.totalReceived);
        };
        fetchDashboard();
    }, [lang, formData.date_to2]);

    const fetchReceiveGoods = async (page = currentPage, perPage = itemsPerPage, filters: FilterParams = { search: "" }) => {
        try {
            if (loading) {
                setLoading(true);
            }
            localStorage.setItem(`${tabId}-loading-grn-list`, JSON.stringify(true));
            const paginatedData = await receiveGoodService.getAllGRNList(page, perPage, filters);
            setReceiveGoods(paginatedData.data);
            setTotalPages(paginatedData.last_page);
            setPreorderFooter2(paginatedData.footer2);
            localStorage.setItem(`${tabId}-cached-grn-list`, JSON.stringify(paginatedData.data));
            localStorage.setItem(
                `${tabId}-cached-meta-grn-list`,
                JSON.stringify({
                    page,
                    perPage,
                    filters,
                    totalPages: paginatedData.last_page,
                    totalItems: paginatedData.total,
                })
            );
        } catch (err) {
            console.error("Error fetching grn:", err);
        } finally {
            setLoading(false);
            localStorage.setItem(`${tabId}-loading-grn-list`, JSON.stringify(false));
        }
    };
    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            onSelectedGRNChange(grnList.map((p) => p.id).filter(Boolean) as number[]);
        } else {
            onSelectedGRNChange([]);
        }
    };
    const handleDateFrom = useCallback((dates: Date[]) => {
        setFormData((prev) => ({ ...prev, date_from: dates[0] ?? null }));
    }, []);
    const handleDateTo = useCallback((dates: Date[]) => {
        setFormData((prev) => ({ ...prev, date_to: dates[0] ?? null }));
    }, []);
    const statusMap: Record<string, { color: string }> = {
        1: { color: "bg-cyan-600 bg-opacity-20 text-cyan-400 uppercase" },
        2: { color: "bg-emerald-600 bg-opacity-20 text-emerald-300 uppercase" },
        3: { color: "bg-red-500 bg-opacity-20 text-red-300 uppercase" },
    };
    const getStatusColor = (status: number) => {
        return statusMap[status]?.color || "bg-cyan-600 bg-opacity-20 text-cyan-400";
    };
    const handleDateRange = () => {
        if (!formData.date_from || !formData.date_to) {
            return;
        }
        setLoading(true);
        setShowDateRange(false);
        setActiveAdvanceSearch(true);

        const filters = {
            search: "",
            supplier_codes: formData.sort_by === "Code" ? formData.supplierCodes.map((c) => c.value) : [],
            date_from: formData.date_from,
            date_to: formData.date_to,
            category_dates: formData.category_dates,
        };
        fetchReceiveGoods(1, itemsPerPage, filters);
    };
    const handleReset = () => {
        setFormData({
            ...formData,
            date_from: null,
            date_to: null,
            category_dates: "PurchaseDate",
            sort_by: "Code",
            supplierCodes: [],
        });
        setLoading(true);
        setActiveAdvanceSearch(false);
        setShowDropdown(false);
        setSearchTerm("");
        setCurrentPage(1);
        setItemsPerPage(15);
        fetchReceiveGoods(1, 15, {
            search: "",
            supplier_codes: [],
            date_from: null,
            date_to: null,
            category_dates: "PurchaseDate",
        });
    };
    // Handle individual select
    const handleSelectSupplier = (supplierId: number, checked: boolean) => {
        if (checked) {
            onSelectedGRNChange([...selectedReceiveGoods, supplierId]);
        } else {
            onSelectedGRNChange(selectedReceiveGoods.filter((id) => id !== supplierId));
        }
    };
    const handleDeleteSelected = async () => {
        if (selectedReceiveGoods.length === 0) {
            showErrorToast(translations["Please click checkbox to select row"]);
            return;
        }
        if (selectedReceiveGoods.length > 1) {
            showErrorToast(translations["1 checkbox only"]);
            return;
        }
        const confirmed = await showConfirm(translations["Delete Record"], translations["Are you sure you want to delete this record?"], translations["Yes"], translations["Cancel"]);
        if (!confirmed) return;
        try {
            const res = await receiveGoodService.deleteGRN(selectedReceiveGoods);
            if (res.token === "Error") {
                showErrorToast(res.message);
                return;
            }
            onSelectedGRNChange([]);
            fetchReceiveGoods(currentPage, itemsPerPage, searchTerm);
            showSuccessToast(translations["Record has been Deleted"]);
        } catch (err) {
            showErrorToast(translations["alert_message_18"]);
            console.error("No Record(s) Has Been Deleted : ", err);
        }
    };
    const handleAdvanceSearch = () => {
        let countCodes = 0;
        if (formData.sort_by === "Code" && formData.supplierCodes.length > 0) {
            countCodes++;
        }
        // Stop if no filters selected
        if (countCodes === 0) {
            return;
        }
        setLoading(true);
        setActiveAdvanceSearch(true);
        setShowAdvanceSearch(false);
        // Build filter object
        const filters = {
            search: "",
            supplier_codes: formData.sort_by === "Code" ? formData.supplierCodes.map((c) => c.value) : [],
            date_from: formData.date_from,
            date_to: formData.date_to,
            category_dates: formData.category_dates,
        };
        fetchReceiveGoods(1, itemsPerPage, filters);
    };
    const handleRowClick = (e: React.MouseEvent, supplierId: number) => {
        // Prevent navigation if clicking on checkboxes or toggle switches
        const target = e.target as HTMLElement;
        if (target.closest("input") || target.closest("label") || target.closest("[data-copy-button]")) {
            return;
        }
        onReceiveGoodsSelect(supplierId, supplierId == 0 ? "new" : "edit");
    };
    const loadAllSupplier = async () => {
        try {
            const list = await fetchSuppliers(); // fetches & returns
            setAllSuppliers(list ?? []); // ✅ manually set state here
        } catch (err) {
            console.error("Failed to fetch loadAllSupplier:", err);
        }
    };
    const handleToggleRow = async (tableId: number) => {
        const isExpanded = expanded_PO.includes(tableId);
        const cachedKey = tabId + "_cachedGRNDetails_" + tableId;
        const expandedKey = tabId + "_expandedKey";

        if (isExpanded) {
            // Collapse row
            const updated = expanded_PO.filter((id) => id !== tableId);
            setExpandedRows(updated);
            localStorage.setItem(expandedKey, JSON.stringify(updated));
        } else {
            // Expand row
            const updated = [...expanded_PO, tableId];
            setExpandedRows(updated);
            localStorage.setItem(expandedKey, JSON.stringify(updated));
            try {
                const data = grnList.find((po) => po.id === tableId);
                // Save to state
                if (!data?.grn_details) {
                    console.error("No details found for this PO");
                    setPODetailsMap((prev) => ({ ...prev, [tableId]: null }));
                    return;
                }
                const details: DetailsRow[] = data.grn_details;
                setPODetailsMap((prev) => ({ ...prev, [tableId]: details }));
                localStorage.setItem(cachedKey, JSON.stringify(details));
            } catch (error) {
                console.error(`Failed to load details for product ${tableId}`, error);
                setPODetailsMap((prev) => ({ ...prev, [tableId]: null }));
            }
        }
    };
    const renderDateRange = () => {
        if (!showDateRange) return null;
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-[#19191c] rounded-xl border border-[#ffffff1a] w-[20vw] h-auto flex flex-col">
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-[#ffffff1a]">
                        <div className="flex items-center space-x-4">
                            <h2 className="text-xl font-bold text-white">{translations["Date Range"]}</h2>
                        </div>
                        <div className="flex items-center space-x-4">
                            <button
                                onClick={() => {
                                    setShowDateRange(false);
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
                            <label className="text-gray-400 text-sm mb-1">{translations["DateFrom"]}</label>
                            <Flatpickr
                                onChange={handleDateFrom}
                                options={{
                                    dateFormat: "M d Y",
                                    defaultDate: formData.date_from || undefined,
                                    allowInput: false,
                                    locale: locale,
                                }}
                                className="px-3 py-2 border-[1px] border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm"
                            />
                        </div>
                        <div className="col-span-12 flex flex-col">
                            <label className="text-gray-400 text-sm mb-1">{translations["DateTo"]}</label>
                            <Flatpickr
                                onChange={handleDateTo}
                                options={{
                                    dateFormat: "M d Y",
                                    defaultDate: formData.date_to || undefined,
                                    allowInput: false,
                                    locale: locale,
                                }}
                                className="px-3 py-2 border-[1px] border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm"
                            />
                        </div>
                    </div>
                    {/* Footer */}
                    <div className="p-2 border-t border-[#ffffff1a] flex justify-end space-x-1">
                        <button onClick={() => setShowDateRange(false)} className="px-2 py-2 bg-gray-700 hover:bg-gray-600 rounded text-white transition">
                            {translations["Close"]}
                        </button>
                        <button onClick={() => handleDateRange()} className={`px-2 py-2 bg-cyan-600 hover:bg-cyan-500 rounded text-white transition`}>
                            {translations["Search"]}
                        </button>
                    </div>
                </div>
            </div>
        );
    };
    const renderAdvanceSearch = () => {
        if (!showAdvanceSearch) return null;
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-[#19191c] rounded-xl border border-[#ffffff1a] w-[60vw] max-h-[80vh] h-auto flex flex-col">
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-[#ffffff1a]">
                        <h2 className="text-xl font-bold text-white">{translations["Advance Search"]}</h2>
                        <button
                            onClick={() => setShowAdvanceSearch(false)}
                            className="p-2 hover:bg-gray-700 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500"
                            aria-label={translations["Close"]}
                        >
                            <X className="h-6 w-6 text-white" />
                        </button>
                    </div>
                    {/* Content */}
                    <div className="grid grid-cols-12 gap-4 p-4">
                        {/* First Row: Sort By, Customer Code */}
                        <div className="col-span-12 md:col-span-12">
                            <label className="text-gray-400 text-sm">{translations["Supplier Code"]}</label>
                            {formData.sort_by !== "Group" && (
                                <Select
                                    classNamePrefix="react-select"
                                    isMulti
                                    value={formData.supplierCodes}
                                    onChange={(selected) => {
                                        setFormData({ ...formData, supplierCodes: selected as OptionType[] });
                                    }}
                                    options={allSupplierOptions}
                                    styles={{
                                        ...selectStyles,
                                        menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                                    }}
                                    className="flex-1"
                                    isClearable
                                    placeholder={translations["Select"]}
                                    menuPlacement="auto"
                                    menuPosition="fixed"
                                    menuPortalTarget={typeof window !== "undefined" ? document.body : null}
                                />
                            )}
                        </div>
                    </div>
                    {/* Footer */}
                    <div className="p-2 border-t border-[#ffffff1a] flex justify-end space-x-1">
                        <button
                            onClick={() => setShowAdvanceSearch(false)}
                            className="px-2 py-2 bg-gray-700 hover:bg-gray-600 rounded text-white transition focus:outline-none focus:ring-2 focus:ring-cyan-500"
                        >
                            {translations["Close"]}
                        </button>
                        <button
                            onClick={() => handleAdvanceSearch()}
                            className="px-2 py-2 bg-cyan-600 hover:bg-cyan-500 rounded text-white transition focus:outline-none focus:ring-2 focus:ring-cyan-500"
                        >
                            {translations["Search"]}
                        </button>
                    </div>
                </div>
            </div>
        );
    };
    const tailwindToHex: Record<string, string> = {
        "red-500": "#ef4444",
        "blue-500": "#3b82f6",
        "green-500": "#22c55e",
        "yellow-500": "#eab308",
        "purple-500": "#a855f7",
        "pink-500": "#ec4899",
        "gray-500": "#6b7280",
    };
    const pieData = topSuppliers.map((cat) => {
        const colorKey = cat.color.replace("bg-", "").replace("/50", "");
        return {
            name: cat.name,
            value: cat.value,
            color: tailwindToHex[colorKey] || "#8884d8",
        };
    });
    const CustomTooltip = (props: any) => {
        const { active, payload } = props;
        const totalSumAmount = topSuppliers.reduce((total, item) => total + item.value, 0);
        if (active && payload && payload.length) {
            const total = totalSumAmount;
            const percentage = ((payload[0].value / total) * 100).toFixed(1);
            return (
                <div className="bg-gray-900 border border-gray-700 rounded-lg shadow-xl p-3">
                    <p className="text-white font-semibold text-sm">{payload[0].name}</p>
                    <p className="text-gray-300 text-sm">{formatMoney(payload[0].value)}</p>
                    <p className="text-gray-400 text-xs">{percentage}%</p>
                </div>
            );
        }

        return null;
    };
    const renderCustomLabel = (props: PieLabelRenderProps) => {
        // cast numeric fields explicitly
        const cx = props.cx as number;
        const cy = props.cy as number;
        const midAngle = props.midAngle as number;
        const innerRadius = props.innerRadius as number;
        const outerRadius = props.outerRadius as number;
        const percent = props.percent as number | undefined;

        const RADIAN = Math.PI / 180;
        const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
        const x = cx + radius * Math.cos(-midAngle * RADIAN);
        const y = cy + radius * Math.sin(-midAngle * RADIAN);

        if (percent && percent < 0.05) return null;

        return (
            <text x={x} y={y} fill="white" textAnchor={x > cx ? "start" : "end"} dominantBaseline="central" className="text-xs font-semibold" style={{ textShadow: "1px 1px 2px rgba(0,0,0,0.8)" }}>
                {`${(percent! * 100).toFixed(0)}%`}
            </text>
        );
    };
    interface CustomLegendProps {
        payload?: LegendPayload[];
    }
    const CustomLegend: React.FC<CustomLegendProps> = ({ payload }) => {
        if (!payload) return null;
        return (
            <div className="flex flex-wrap justify-center gap-2 mt-2 px-2">
                {payload.map((entry, index) => (
                    <div key={`legend-${index}`} className="flex items-center gap-1.5 bg-gray-800/50 px-2.5 py-1.5 rounded hover:bg-gray-800 transition-colors">
                        <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: entry.color }} />
                        <span className="text-gray-300 text-xs font-medium whitespace-nowrap">{entry.value}</span>
                    </div>
                ))}
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
                        { title: translations["Received"] || "Received", value: totalReceived, change: "12.5%", icon: PackageCheck, bg: "bg-green-900/50", iconColor: "text-green-400" },
                        { title: translations["Coming Soon"] || "Coming Soon", value: totalComingSoon, change: "8.2%", icon: AlertCircle, bg: "bg-blue-900/50", iconColor: "text-blue-400" },
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
                {/* Pie Chart Section */}
                <div className="p-4 rounded-lg shadow-md border border-gray-700 mb-2" style={{ backgroundColor: "#19191c", borderColor: "#404040", height: "400px" }}>
                    <h2 className="text-lg font-bold text-white mb-4">{translations["Top Delivery by Supplier"] || "Top Delivery by Supplier"}</h2>
                    <div style={{ height: "calc(100% - 130px)" }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <defs>
                                    {pieData.map((entry, index) => (
                                        <linearGradient key={`gradient-${index}`} id={`gradient-${index}`} x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor={entry.color} stopOpacity={1} />
                                            <stop offset="100%" stopColor={entry.color} stopOpacity={0.7} />
                                        </linearGradient>
                                    ))}
                                </defs>
                                <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} innerRadius={60} paddingAngle={2} label={renderCustomLabel}>
                                    {pieData.map((entry, index) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={`url(#gradient-${index})`}
                                            stroke="#1f2937"
                                            strokeWidth={2}
                                            className={`hover:opacity-80 transition-opacity cursor-pointer ${entry.name}`}
                                        />
                                    ))}
                                </Pie>
                                <Tooltip content={<CustomTooltip />} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <CustomLegend payload={pieData.map((d) => ({ value: d.name, color: d.color }))} />
                </div>
                {/* Progress Bars Section */}
                <div
                    className="p-4 rounded-lg shadow-md border mb-2"
                    style={{
                        backgroundColor: "#19191c",
                        borderColor: "#404040",
                    }}
                >
                    <h2 className="text-lg font-bold text-white mb-4">{translations["Delivery Over 6 Months"] || "Delivery Over 6 Months"}</h2>
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
                                    {/* Dropdown Button */}
                                    <div
                                        className={`relative border-round-3 ${activeAdvanceSearch ? "bg-green-600 border-green-600" : "bg-[#2d2d30] border-[#2d2d30]"}`}
                                        style={{ borderColor: "#2d2d30", marginLeft: "5px" }}
                                    >
                                        <button
                                            onClick={() => setShowDropdown(!showDropdown)}
                                            className={`
                                        ml-2 px-2 py-2 border rounded-lg text-white transition-colors flex items-center  text-sm
                                        ${activeAdvanceSearch ? "bg-green-600 border-green-600 hover:bg-green-600" : "bg-[#2d2d30] border-[#2d2d30]"}
                                    `}
                                        >
                                            {activeAdvanceSearch ? (
                                                <>
                                                    <span className="mr-1">{translations["Active"]}</span>
                                                    <ChevronDown size={16} />
                                                </>
                                            ) : (
                                                <>
                                                    <span className="mr-1">{translations["Smart Search"]}</span>
                                                    <ChevronDown size={16} />
                                                </>
                                            )}
                                        </button>
                                        {showDropdown && (
                                            <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-10">
                                                <ul className="py-1 text-sm text-gray-700">
                                                    <li>
                                                        <button
                                                            className="w-full text-left px-4 py-2 hover:bg-gray-100"
                                                            onClick={() => {
                                                                setShowDropdown(false);
                                                                setShowAdvanceSearch(true);
                                                            }}
                                                        >
                                                            {translations["Advance Search"]}
                                                        </button>
                                                    </li>
                                                    <li>
                                                        <button
                                                            className="w-full text-left px-4 py-2 hover:bg-gray-100"
                                                            onClick={() => {
                                                                setShowDropdown(false);
                                                                setShowDateRange(true);
                                                            }}
                                                        >
                                                            {translations["Date Range"]}
                                                        </button>
                                                    </li>
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                    <button
                                        onClick={() => handleReset()}
                                        className="ml-2 px-2 py-2 border rounded-lg text-white transition-colors flex items-center space-x-px hover:bg-gray-600 text-sm"
                                        style={{ backgroundColor: "#2d2d30", borderColor: "#2d2d30", marginLeft: "5px" }}
                                    >
                                        <span>{translations["Reset"]}</span>
                                    </button>
                                </div>
                                <div className="flex items-center space-x-4">
                                    <div className="flex items-center space-x-1">
                                        <button
                                            onClick={(e) => handleRowClick(e, 0)}
                                            className="px-2 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors flex items-center space-x-1 text-sm"
                                        >
                                            <span>{translations["Add New"]}</span>
                                        </button>
                                        <button
                                            disabled={selectedReceiveGoods.length === 0}
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
                            <div className="h-[calc(100vh-180px)] overflow-y-auto">
                                <table className="w-full">
                                    <thead className="sticky top-0 z-[1]" style={{ backgroundColor: "#1f2132" }}>
                                        <tr className="border-b" style={{ borderColor: "#2d2d30" }}>
                                            <th className="w-[3%] text-left py-1 px-2 text-gray-400 text-sm w-12"></th>
                                            <th className="w-[3%] text-left py-1 px-2 text-gray-400 text-sm w-12">
                                                <div className="flex items-center h-full">
                                                    <CustomCheckbox checked={selectedReceiveGoods.length === grnList.length && grnList.length > 0} onChange={(checked) => handleSelectAll(checked)} />
                                                </div>
                                            </th>
                                            <th className="w-[15%] text-left py-2 px-2 text-gray-400 text-sm">{translations["GRN Number"]}</th>
                                            <th className="w-[12%] text-left py-2 px-2 text-gray-400 text-sm">{translations["GRN Date"]}</th>
                                            <th className="w-[15%] text-left py-2 px-2 text-gray-400 text-sm">{translations["Supplier Code"]}</th>
                                            <th className="w-[18%] text-left py-2 px-2 text-gray-400 text-sm">{translations["Supplier Name"]}</th>
                                            <th className="w-[12%] text-center py-2 px-2 text-gray-400 text-sm">{translations["Total"]}</th>
                                            <th className="w-[11%] text-left py-2 px-2 text-gray-400 text-sm">{translations["Warehouse"]}</th>
                                            <th className="w-[11%] text-left py-2 px-2 text-gray-400 text-sm">{translations["Status"]}</th>
                                        </tr>
                                    </thead>
                                    {loading ? (
                                        <LoadingSpinnerTbody rowsCount={itemsPerPage} />
                                    ) : (
                                        <tbody>
                                            {grnList.length === 0 ? (
                                                <tr>
                                                    <td colSpan={9} className="py-4 px-4 text-center text-gray-400 text-sm border border-[#40404042]">
                                                        {translations["No Record Found"] || "No Record Found"}
                                                    </td>
                                                </tr>
                                            ) : (
                                                grnList.map((supplier, index) => (
                                                    <React.Fragment key={supplier.id || index}>
                                                        <tr
                                                            key={supplier.id || index}
                                                            onClick={(e) => handleRowClick(e, supplier.id)}
                                                            className={`clickable border-b hover:bg-gray-700 hover:bg-opacity-30 transition-colors cursor-pointer ${
                                                                selectedReceiveGoods.includes(supplier.id as number) ? "bg-gray-700 bg-opacity-30" : ""
                                                            }`}
                                                            style={{ borderColor: "#40404042" }}
                                                        >
                                                            <td className="py-2 px-2 text-gray-400 text-center text-custom-sm" onClick={(e) => e.stopPropagation()}>
                                                                <button
                                                                    onClick={() => handleToggleRow(supplier.id)}
                                                                    className={`px-1 py-1 ${
                                                                        expanded_PO.includes(supplier.id) ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"
                                                                    } text-white rounded-lg transition-colors text-xs`}
                                                                >
                                                                    {expanded_PO.includes(supplier.id) ? <Minus size={16} /> : <Plus size={16} />}
                                                                </button>
                                                            </td>
                                                            <td className="py-2 px-2" onClick={(e) => e.stopPropagation()}>
                                                                <CustomCheckbox
                                                                    checked={selectedReceiveGoods.includes(supplier.id as number)}
                                                                    onChange={(checked) => handleSelectSupplier(supplier.id as number, checked)}
                                                                    ariaLabel={`Select supplier ${supplier.supplier_code}`}
                                                                />
                                                            </td>
                                                            <td className="py-2 px-2 text-gray-400 text-left text-custom-sm">
                                                                <div className="group flex items-center">
                                                                    <p className="text-gray-400 text-custom-sm">{highlightMatch(supplier.grn_no, searchTerm)}</p>
                                                                    <CopyToClipboard text={supplier.grn_no ?? ""} />
                                                                </div>
                                                            </td>
                                                            <td className="py-2 px-2 text-gray-400 text-left text-custom-sm">{formatDate(supplier.grn_date, lang)}</td>
                                                            <td className="py-2 px-2 text-gray-400 text-left text-custom-sm">
                                                                <div className="group flex items-center">
                                                                    <p className="text-gray-400 text-custom-sm">{highlightMatch(supplier.supplier_code, searchTerm)}</p>
                                                                    <CopyToClipboard text={supplier.supplier_code ?? ""} />
                                                                </div>
                                                            </td>
                                                            <td className="py-2 px-2 text-gray-400 text-left text-custom-sm">
                                                                <div className="group flex items-center">
                                                                    <p className="text-gray-400 text-custom-sm">
                                                                        {highlightMatch(lang === "en" ? supplier.suppliername_en : supplier.suppliername_cn, searchTerm)}
                                                                    </p>
                                                                    <CopyToClipboard text={lang === "en" ? supplier.suppliername_en ?? "" : supplier.suppliername_cn ?? ""} />
                                                                </div>
                                                            </td>
                                                            <td className="py-2 px-2 text-gray-400 text-center text-custom-sm">
                                                                {supplier.currency}
                                                                <br></br>
                                                                {formatMoney(supplier.total)}
                                                            </td>
                                                            <td className="py-2 px-2 text-gray-400 text-left text-custom-sm">{supplier.warehouse}</td>
                                                            <td className="py-2 px-2 text-gray-400 text-left text-custom-sm">
                                                                <span className={`px-2 py-1 rounded-full text-xs text-custom-sm ${getStatusColor(supplier.grn_status_id)}`}>
                                                                    {lang === "en" ? supplier.grn_status_en : supplier.grn_status_cn}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                        {expanded_PO.includes(supplier.id) && (
                                                            <tr>
                                                                <td colSpan={12} className="py-2 px-2">
                                                                    <table className="w-full" style={{ backgroundColor: "#060818" }}>
                                                                        <thead className="sticky top-0 z-[1] py-1 px-4" style={{ backgroundColor: "#1f2132" }}>
                                                                            <tr className="border-b" style={{ borderColor: "#2d2d30" }}>
                                                                                <th className="w-auto text-left py-2 px-2 text-gray-400 text-sm w-12 border border-[#40404042]" rowSpan={2}>
                                                                                    {translations["Product Code"]}
                                                                                </th>
                                                                                <th className="w-auto text-left py-2 px-2 text-gray-400 text-sm w- border border-[#40404042]" rowSpan={2}>
                                                                                    {translations["Product Name"]}
                                                                                </th>
                                                                                <th className="w-auto text-center py-2 px-2 text-gray-400 text-sm w-12 border border-[#40404042]" rowSpan={2}>
                                                                                    {translations["Item"]} {translations["wgt"]} (KG)
                                                                                </th>
                                                                                <th className="w-auto text-center py-2 px-2 text-gray-400 text-sm w-12 border border-[#40404042]" rowSpan={2}>
                                                                                    {translations["Cnt"]} {translations["wgt"]} (KG)
                                                                                </th>
                                                                                <th className="w-auto text-center py-2 px-2 text-gray-400 text-sm w-12 border border-[#40404042]" rowSpan={2}>
                                                                                    {translations["Crtns"]}
                                                                                </th>
                                                                                <th className="w-auto text-center py-2 px-2 text-gray-400 text-sm w-12 border border-[#40404042]" rowSpan={2}>
                                                                                    {translations["Pcs"]}/{translations["Crtns"]}
                                                                                </th>
                                                                                <th className="w-auto text-center py-2 px-2 text-gray-400 text-sm w-12 border border-[#40404042]" colSpan={3}>
                                                                                    {translations["Carton Dimension"]}
                                                                                </th>
                                                                                <th className="w-auto text-center py-2 px-2 text-gray-400 text-sm w-12 border border-[#40404042]" rowSpan={2}>
                                                                                    {translations["CBM"]}
                                                                                </th>
                                                                                <th className="w-auto text-center py-2 px-2 text-gray-400 text-sm w-12 border border-[#40404042]" rowSpan={2}>
                                                                                    {translations["Vol."]} {translations["wgt"]}
                                                                                </th>
                                                                                <th className="w-auto text-center py-2 px-2 text-gray-400 text-sm w-12 border border-[#40404042]" rowSpan={2}>
                                                                                    {translations["Net"]} {translations["wgt"]} (KG)
                                                                                </th>
                                                                                <th className="w-auto text-center py-2 px-2 text-gray-400 text-sm w-12 border border-[#40404042]" rowSpan={2}>
                                                                                    {translations["Qty"]}
                                                                                </th>
                                                                                <th className="w-auto text-center py-2 px-2 text-gray-400 text-sm w-12 border border-[#40404042]" rowSpan={2}>
                                                                                    {translations["Price"]}
                                                                                </th>
                                                                                <th className="w-auto text-center py-2 px-2 text-gray-400 text-sm w-12 border border-[#40404042]" rowSpan={2}>
                                                                                    {translations["Total"]}
                                                                                </th>
                                                                            </tr>
                                                                            <tr className="border-b" style={{ borderColor: "#2d2d30" }}>
                                                                                <th className="w-auto text-center py-2 px-2 text-gray-400 text-sm w-12 border border-[#40404042]">
                                                                                    {translations["LCM"]}
                                                                                </th>
                                                                                <th className="w-auto text-center py-2 px-2 text-gray-400 text-sm w-12 border border-[#40404042]">
                                                                                    {translations["BCM2"]}
                                                                                </th>
                                                                                <th className="w-auto text-center py-2 px-2 text-gray-400 text-sm w-12 border border-[#40404042]">
                                                                                    {translations["HCM2"]}
                                                                                </th>
                                                                            </tr>
                                                                        </thead>
                                                                        <tbody>
                                                                            {orderDetailsMap[supplier.id] && orderDetailsMap[supplier.id]!.length > 0 ? (
                                                                                orderDetailsMap[supplier.id]!.map((detail, i) => (
                                                                                    <tr key={detail.id || i}>
                                                                                        <td className="py-2 px-2 text-gray-400 text-left text-custom-sm">
                                                                                            <div className="group flex items-center">
                                                                                                <p className="text-gray-400 text-custom-sm">
                                                                                                    {detail.product && detail.product.product_code
                                                                                                        ? highlightMatch(detail.product.product_code, searchTerm)
                                                                                                        : translations["Deleted"] || "Deleted"}
                                                                                                </p>
                                                                                                <CopyToClipboard
                                                                                                    text={detail.product && detail.product.product_code ? detail.product.product_code : ""}
                                                                                                />
                                                                                            </div>
                                                                                        </td>
                                                                                        <td className="py-2 px-2 text-gray-400 text-left text-custom-sm">
                                                                                            {highlightMatch(
                                                                                                lang === "en"
                                                                                                    ? detail.product && detail.product.product_title_en
                                                                                                        ? detail.product.product_title_en
                                                                                                        : translations["Deleted"] || "Deleted"
                                                                                                    : detail.product && detail.product.product_title_cn
                                                                                                    ? detail.product.product_title_cn
                                                                                                    : translations["Deleted"] || "Deleted",
                                                                                                searchTerm
                                                                                            )}
                                                                                        </td>
                                                                                        <td className="py-2 px-2 text-gray-400 text-center text-custom-sm">
                                                                                            {detail.product && detail.product.item_weight ? detail.product.item_weight : 0}
                                                                                        </td>
                                                                                        <td className="py-2 px-2 text-gray-400 text-center text-custom-sm">{formatMoney(detail.cnt_weight)}</td>
                                                                                        <td className="py-2 px-2 text-gray-400 text-center text-custom-sm">{detail.cartons}</td>
                                                                                        <td className="py-2 px-2 text-gray-400 text-center text-custom-sm">
                                                                                            {detail.product && detail.product.pcs_per_carton
                                                                                                ? detail.product.pcs_per_carton
                                                                                                : translations["Deleted"] || "Deleted"}
                                                                                        </td>
                                                                                        <td className="py-2 px-2 text-gray-400 text-center text-custom-sm">{detail.lcm}</td>
                                                                                        <td className="py-2 px-2 text-gray-400 text-center text-custom-sm">{detail.bcm}</td>
                                                                                        <td className="py-2 px-2 text-gray-400 text-center text-custom-sm">{detail.hcm}</td>
                                                                                        <td className="py-2 px-2 text-gray-400 text-center text-custom-sm">{detail.cbm}</td>
                                                                                        <td className="py-2 px-2 text-gray-400 text-center text-custom-sm">{detail.vweight}</td>
                                                                                        <td className="py-2 px-2 text-gray-400 text-center text-custom-sm">
                                                                                            {formatMoney(detail.cnt_weight * detail.cartons)}
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
                                                                                    <td colSpan={13} className="py-2 px-2 text-center text-gray-400 text-sm">
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
                                <ExportReportSelector
                                    formats={["odt", "ods", "xlsx"]}
                                    baseName="ReceiveGoods"
                                    ids={selectedReceiveGoods.length > 0 ? selectedReceiveGoods : grnList.map((p) => p.id)}
                                    language={lang}
                                />
                            </div>
                            <div className="p-1 flex items-center space-x-1">
                                <div className="flex items-center space-x-4">
                                    <table className="w-full">
                                        <tbody>
                                            {preorderFooter2
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
                        {renderDateRange()}
                        {renderAdvanceSearch()}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReceiveGoodsList;
