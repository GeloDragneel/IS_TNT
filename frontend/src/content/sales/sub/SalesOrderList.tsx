import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { customerService, ApiCustomerCredit } from "@/services/customerService";
import { salesOrderService, ApiSalesOrder, DetailsRow, FilterParams } from "@/services/salesOrderService";
import { useLanguage } from "@/context/LanguageContext";
import CustomCheckbox from "@/components/CustomCheckbox";
import { showConfirm } from "@/utils/alert";
import { showSuccessToast, showErrorToast } from "@/utils/toast";
import Pagination from "@/components/Pagination";
import ItemsPerPageSelector from "@/components/ItemsPerPageSelector";
import CopyToClipboard from "@/components/CopyToClipboard";
import { X, Minus, Plus, ChevronDown, Calendar } from "lucide-react";
import { ExportReportSelector } from "@/utils/ExportReportSelector";
import PusherEcho from "@/utils/echo";
import Select from "react-select";
import dayjs from "dayjs";
import Flatpickr from "react-flatpickr";
import { getFlatpickrLocale } from "@/utils/flatpickrLocale";
import { fetchAllCustomer, OptionType } from "@/utils/fetchDropdownData";
import { baseCurrency, DropdownData, formatDate, formatMoney, selectStyles } from "@/utils/globalFunction";
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
                            <div className="h-4 bg-gray-700 rounded w-full"></div>
                        </div>
                    </td>
                    <td className="text-center items-center py-2 px-2">
                        <div className="flex flex-col space-y-2 py-1 flex-1">
                            <div className="h-4 bg-gray-700 rounded w-full"></div>
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
                    <td className="text-center items-center py-2 px-2">
                        <div className="flex flex-col space-y-2 py-1 flex-1">
                            <div className="h-4 bg-gray-700 rounded w-full"></div>
                        </div>
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
interface SalesOrderListProps {
    tabId: string;
    onSalesOrderSelect: (supplierId: number, saveType?: string) => void;
    onChangeView: (view: "list" | "details") => void;
    selectedSO: number[];
    onSelectedSOChange: (selected: number[]) => void;
    expandedRows: number[];
    onExpandedRowsChange: (expanded: number[]) => void;
}
type FormDataType = {
    sort_by: string;
    supplier_id: number;
    category_dates: string;
    date_from: Date | null; // Allow null here
    date_to: Date | null; // Allow null here
    customerCodes: OptionType[];
};
interface POFooter {
    currency: string;
    total: number;
}
interface ApiCustomerFooter {
    total_qty: number;
    total_deposit: number;
    total: number;
    total_to_pay: number;
    base_total: number;
    base_total_to_pay: number;
    total_subtotal: number;
    total_base_total: number;
    total_e_cost_total: number;
    total_e_profit: number;
    total_item_deposit: number;
    amount_paid: number;
    base_amount_paid: number;
    balance: number;
    currency: string;
}
// localStorage.clear();
const SalesOrderList: React.FC<SalesOrderListProps> = ({ tabId, onSalesOrderSelect, selectedSO, onSelectedSOChange }) => {
    const { translations, lang } = useLanguage();
    const [altLang, setAltLanguage] = useState(lang);
    const [salesOrderList, setSalesOrder] = useState<ApiSalesOrder[]>([]);
    const [SOOrderIds, setSOOrderIds] = useState<ApiSalesOrder[]>([]);
    const [totalPages, setTotalPages] = useState(1);
    const locale = getFlatpickrLocale(translations);
    const pageSizeOptions = useMemo(() => [15, 20, 50, -1], []);
    const [expanded_SO, setExpandedRows] = useState<number[]>([]);
    const [selectedInvoices, selectInvoices] = useState<number[]>([]);
    const [selectedShipment, selectShipment] = useState<number[]>([]);
    const [soDetailMap, setPODetailsMap] = useState<Record<number, DetailsRow[] | null>>({});
    const [activeAdvanceSearch, setActiveAdvanceSearch] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const [showDateRange, setShowDateRange] = useState(false);
    const [showAdvanceSearch, setShowAdvanceSearch] = useState(false);
    const [allCustomer, setAllCustomer] = useState<DropdownData[]>([]);
    const [creditsPopup, setShowCreditsPopup] = useState(false);
    const throttleTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
    const [preorderFooter2, setPreorderFooter2] = useState<POFooter[]>([]); // Changed to array
    const [customerCredit, setCustomerCredit] = useState<ApiCustomerCredit[]>([]);
    const [CustomerCreditFooter, setCustomerCreditFooter] = useState<ApiCustomerFooter[]>([]);
    const [loadCancelOrder_CTOCUST, setLoadCancelOrder_CTOCUST] = useState(false);
    const [loadCancelOrder_NRTOMI, setLoadCancelOrder_NRTOMI] = useState(false);
    const [loadCancelOrder_RPTOC, setLoadCancelOrder_RPTOC] = useState(false);
    const [loadingConfirm, setLoadConfirm] = useState(false);
    const [cancelOrder, setShowCancelOrder] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const exportRef = useRef<{ triggerExport: () => void }>(null);
    const [loading, setLoading] = useState(() => {
        const savedLoading = localStorage.getItem(`${tabId}-loading-so-list`);
        return savedLoading !== null ? JSON.parse(savedLoading) : true;
    });
    const [isOpen, setIsOpen] = useState(false);
    const closeMenu = () => setIsOpen(false);
    const [formData, setFormData] = useState<FormDataType>({
        sort_by: "Code",
        supplier_id: 0,
        category_dates: "SODate",
        customerCodes: [],
        date_from: null as Date | null,
        date_to: null as Date | null,
    });
    const [currentPage, setCurrentPage] = useState(() => {
        const metaKey = `${tabId}-cached-meta-so-list`;
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
        const metaKey = `${tabId}-cached-meta-so-list`;
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
        const cached = localStorage.getItem(`${tabId}-cached-meta-so-list`);
        if (!cached) return "";
        try {
            const meta = JSON.parse(cached);
            return meta.filters.search || "";
        } catch {
            return "";
        }
    });
    const allCustomerOptions: OptionType[] = useMemo(
        () =>
            allCustomer.map((list) => ({
                value: list.value.toString(),
                value2: list.value.toString(),
                label: lang === "en" ? list.en : list.cn,
                en: list.en,
                cn: list.cn,
            })),
        [allCustomer, lang]
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
                const data = salesOrderList.find((po) => po.id === tableId);
                // Save to state
                if (!data?.details) {
                    setPODetailsMap((prev) => ({ ...prev, [tableId]: null }));
                    return;
                }
                const details: DetailsRow[] = data.details;
                setPODetailsMap((prev) => ({ ...prev, [tableId]: details }));
            });
            setExpandedRows(checkedIds);
        }
    }, [tabId, salesOrderList]);
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
    useEffect(() => {
        const channel = PusherEcho.channel("so-channel");
        channel.listen(".so-event", () => {
            const defaultFilters = {
                search: searchTerm,
                customer_codes: formData.sort_by === "Code" ? formData.customerCodes.map((c) => c.value) : [],
                date_from: formData.date_from,
                date_to: formData.date_to,
                category_dates: formData.category_dates,
            };
            localStorage.removeItem(`${tabId}-cached-so-list`);
            setTimeout(() => {
                fetchSalesOrder(currentPage, itemsPerPage, defaultFilters);
            }, 500);
        });
        return () => {
            PusherEcho.leave("so-channel");
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
                loadAllCustomer();
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
        const SupplierKey = `${tabId}-cached-so-list`;
        const metaKey = `${tabId}-cached-meta-so-list`;
        const mountKey = `${tabId}-mount-status-purchase-order`;
        const isFirstMount = sessionStorage.getItem(mountKey) !== "mounted";
        const defaultFilters = {
            search: searchTerm,
            customer_codes: formData.sort_by === "Code" ? formData.customerCodes.map((c) => c.value) : [],
            date_from: formData.date_from,
            date_to: formData.date_to,
            category_dates: formData.category_dates,
        };
        if (isFirstMount) {
            sessionStorage.setItem(mountKey, "mounted");
            fetchSalesOrder(currentPage, itemsPerPage, defaultFilters);
            return;
        }
        const cachedSuppliersRaw = localStorage.getItem(SupplierKey);
        const cachedMetaRaw = localStorage.getItem(metaKey);

        if (!cachedSuppliersRaw || !cachedMetaRaw) {
            fetchSalesOrder(currentPage, itemsPerPage, defaultFilters);
            return;
        }

        try {
            const cachedMeta = JSON.parse(cachedMetaRaw);
            const cachedSuppliers = JSON.parse(cachedSuppliersRaw);
            const isCacheValid = cachedMeta.page === currentPage && cachedMeta.perPage === itemsPerPage && JSON.stringify(cachedMeta.search) === JSON.stringify(defaultFilters.search);

            if (isCacheValid) {
                setSalesOrder(cachedSuppliers);
                setTotalPages(cachedMeta.totalPages);
                setLoading(false);
                localStorage.setItem(`${tabId}-loading-so-list`, JSON.stringify(false));
                return;
            }
        } catch (err) {
            console.warn("Failed to parse cached meta:", err);
        }

        fetchSalesOrder(currentPage, itemsPerPage, defaultFilters);
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

    const fetchSalesOrder = async (page = currentPage, perPage = itemsPerPage, filters: FilterParams = { search: "" }) => {
        try {
            if (loading) {
                setLoading(true);
            }
            localStorage.setItem(`${tabId}-loading-so-list`, JSON.stringify(true));
            const paginatedData = await salesOrderService.getAllSalesOrder(page, perPage, filters);
            setSalesOrder(paginatedData.data);
            setTotalPages(paginatedData.last_page);
            setPreorderFooter2(paginatedData.footer2);
            localStorage.setItem(`${tabId}-cached-so-list`, JSON.stringify(paginatedData.data));
            localStorage.setItem(
                `${tabId}-cached-meta-so-list`,
                JSON.stringify({
                    page,
                    perPage,
                    filters,
                    totalPages: paginatedData.last_page,
                    totalItems: paginatedData.total,
                })
            );
        } catch (err) {
            console.error("Error fetching sales order:", err);
        } finally {
            setLoading(false);
            localStorage.setItem(`${tabId}-loading-so-list`, JSON.stringify(false));
        }
    };
    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            onSelectedSOChange(salesOrderList.map((p) => p.id).filter(Boolean) as number[]);
        } else {
            onSelectedSOChange([]);
        }
    };
    const handleDateFrom = useCallback((dates: Date[]) => {
        setFormData((prev) => ({ ...prev, date_from: dates[0] ?? null }));
    }, []);
    const handleDateTo = useCallback((dates: Date[]) => {
        setFormData((prev) => ({ ...prev, date_to: dates[0] ?? null }));
    }, []);
    const statusMap: Record<string, { color: string }> = {
        8: { color: "bg-yellow-600 bg-opacity-20 text-yellow-400 uppercase" },
        5: { color: "bg-red-500 bg-opacity-20 text-red-300 uppercase" },
        2: { color: "bg-cyan-600 bg-opacity-20 text-cyan-300 uppercase" },
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
            customer_codes: formData.sort_by === "Code" ? formData.customerCodes.map((c) => c.value) : [],
            date_from: formData.date_from,
            date_to: formData.date_to,
            category_dates: formData.category_dates,
        };
        fetchSalesOrder(1, itemsPerPage, filters);
    };
    const handleReset = () => {
        setFormData({
            ...formData,
            date_from: null,
            date_to: null,
            category_dates: "SODate",
            sort_by: "Code",
            customerCodes: [],
        });
        setLoading(true);
        setActiveAdvanceSearch(false);
        setShowDropdown(false);
        setSearchTerm("");
        setCurrentPage(1);
        setItemsPerPage(15);
        fetchSalesOrder(1, 15, {
            search: "",
            customer_codes: [],
            date_from: null,
            date_to: null,
            category_dates: "SODate",
        });
    };
    const handleSelectSO = (id: number, checked: boolean) => {
        const updated = checked ? [...selectedSO, id] : selectedSO.filter((pid) => pid !== id);

        onSelectedSOChange(updated);
    };
    const handleSelectInvoices = (id: number, checked: boolean) => {
        if (checked) {
            selectInvoices([...selectedInvoices, id]);
        } else {
            selectInvoices(selectedInvoices.filter((item) => item !== id));
            selectShipment(selectedShipment.filter((item) => item !== id));
        }
    };
    const handleSelectShipment = (id: number, checked: boolean) => {
        if (checked) {
            selectInvoices([...new Set([...selectedInvoices, id])]); // Optional: avoid duplicates
            selectShipment([...new Set([...selectedShipment, id])]);
        } else {
            selectShipment(selectedShipment.filter((item) => item !== id));
        }
    };
    const handleVoidSelected = async () => {
        if (selectedSO.length === 0) {
            showErrorToast(translations["Please click checkbox to select row"]);
            return;
        }
        const selectedSOMaster = salesOrderList.filter((item) => selectedSO.includes(item.id));
        const data = new FormData();
        selectedSOMaster.forEach((list: any) => {
            if (list) {
                data.append("details[]", JSON.stringify({ so_number: list.so_number }));
            }
        });
        const result = await salesOrderService.getDepositPaid(data);
        if (result.deposit > 0) {
            setSOOrderIds(result.idsArr);
            setShowCancelOrder(true);
            return;
        }
        const confirmed = await showConfirm(translations["Void Record(s)"], translations["alert_message_38"], translations["Yes"], translations["Cancel"]);
        if (!confirmed) return;
        try {
            const result = await salesOrderService.voidSalesOrder(data);
            if (result.token === "Error") {
                showErrorToast(result.message);
                return;
            }
            const defaultFilters = {
                search: searchTerm,
                customer_codes: formData.sort_by === "Code" ? formData.customerCodes.map((c) => c.value) : [],
                date_from: formData.date_from,
                date_to: formData.date_to,
                category_dates: formData.category_dates,
            };
            selectInvoices([]);
            selectShipment([]);
            setSOOrderIds([]);
            showSuccessToast(translations[result.message]);
            fetchSalesOrder(currentPage, itemsPerPage, defaultFilters);
        } catch (error) {}
    };
    const handleSaveCancelOrder = async (type: string) => {
        if (selectedSO.length === 0) {
            return;
        }
        if (type === "CTOCUST") {
            setLoadCancelOrder_CTOCUST(true);
        }
        if (type === "NRTOMI") {
            setLoadCancelOrder_NRTOMI(true);
        }
        if (type === "RPTOC") {
            setLoadCancelOrder_RPTOC(true);
        }

        let row_arrays: any = [];
        SOOrderIds.forEach((list: any) => {
            if (list) {
                row_arrays.push(list);
            }
        });
        try {
            const result = await salesOrderService.cancelDepositPaid(row_arrays, type, "full");
            if (result.token === "Error") {
                setLoadCancelOrder_CTOCUST(false);
                setLoadCancelOrder_NRTOMI(false);
                setLoadCancelOrder_RPTOC(false);
                showErrorToast(result.message);
                return;
            }
            setShowCancelOrder(false);
            setLoadCancelOrder_CTOCUST(false);
            setLoadCancelOrder_NRTOMI(false);
            setLoadCancelOrder_RPTOC(false);
            const defaultFilters = {
                search: searchTerm,
                customer_codes: formData.sort_by === "Code" ? formData.customerCodes.map((c) => c.value) : [],
                date_from: formData.date_from,
                date_to: formData.date_to,
                category_dates: formData.category_dates,
            };
            selectInvoices([]);
            selectShipment([]);
            showSuccessToast(translations[result.message]);
            fetchSalesOrder(currentPage, itemsPerPage, defaultFilters);
        } catch (err) {
            setLoadCancelOrder_CTOCUST(false);
            setLoadCancelOrder_NRTOMI(false);
            setLoadCancelOrder_RPTOC(false);
            showErrorToast(translations["alert_message_18"]);
            console.error("Deletion failed:", err);
        }
    };
    const handleAdvanceSearch = () => {
        let countCodes = 0;
        if (formData.sort_by === "Code" && formData.customerCodes.length > 0) {
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
            customer_codes: formData.sort_by === "Code" ? formData.customerCodes.map((c) => c.value) : [],
            date_from: formData.date_from,
            date_to: formData.date_to,
            category_dates: formData.category_dates,
        };
        fetchSalesOrder(1, itemsPerPage, filters);
    };
    const handleRowClick = (e: React.MouseEvent, supplierId: number) => {
        // Prevent navigation if clicking on checkboxes or toggle switches
        const target = e.target as HTMLElement;
        if (target.closest("input") || target.closest("label") || target.closest("[data-copy-button]")) {
            return;
        }
        onSalesOrderSelect(supplierId, supplierId == 0 ? "new" : "edit");
    };
    const loadAllCustomer = async () => {
        try {
            const list = await fetchAllCustomer(); // fetches & returns
            setAllCustomer(list ?? []); // ✅ manually set state here
        } catch (err) {
            console.error("Failed to fetch loadAllCustomer:", err);
        }
    };
    const handleToggleRow = async (tableId: number) => {
        const isExpanded = expanded_SO.includes(tableId);
        const cachedKey = tabId + "_cachedSODetails_" + tableId;
        const expandedKey = tabId + "_expandedKey";

        if (isExpanded) {
            // Collapse row
            const updated = expanded_SO.filter((id) => id !== tableId);
            setExpandedRows(updated);
            localStorage.setItem(expandedKey, JSON.stringify(updated));
        } else {
            // Expand row
            const updated = [...expanded_SO, tableId];
            setExpandedRows(updated);
            localStorage.setItem(expandedKey, JSON.stringify(updated));
            try {
                const data = salesOrderList.find((po) => po.id === tableId);
                // Save to state
                if (!data?.details) {
                    setPODetailsMap((prev) => ({ ...prev, [tableId]: null }));
                    return;
                }
                const details: DetailsRow[] = data.details;
                setPODetailsMap((prev) => ({ ...prev, [tableId]: details }));
                localStorage.setItem(cachedKey, JSON.stringify(details));
            } catch (error) {
                console.error(`Failed to load details for product ${tableId}`, error);
                setPODetailsMap((prev) => ({ ...prev, [tableId]: null }));
            }
        }
    };
    const handlePrint = async () => {
        if (selectedSO.length === 0) {
            showErrorToast(translations["Please click checkbox to select row"]);
            return;
        }
        exportRef.current?.triggerExport();
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
    const handleConfirm = async () => {
        setLoadConfirm(true);
        const idInvoices = selectedInvoices.filter((item, index) => selectedInvoices.indexOf(item) === index);
        const idShipments = selectedShipment.filter((item, index) => selectedShipment.indexOf(item) === index);
        const selectedConfirmed = salesOrderList.filter((so) => idInvoices.includes(so.id));
        let newArray: any = [];
        selectedConfirmed.forEach((element) => {
            const is_shipment = idShipments.find((id) => id === element.id) ? 1 : 0;
            newArray.push({
                customer_id: element.customer_id,
                customer_code: element.customer_code,
                so_number: element.so_number,
                is_shipment: is_shipment,
            });
        });
        const data = new FormData();
        newArray.forEach((list: any) => {
            if (list) {
                data.append(
                    "details[]",
                    JSON.stringify({
                        customer_id: list.customer_id,
                        customer_code: list.customer_code,
                        so_number: list.so_number,
                        is_shipment: list.is_shipment,
                        currency: baseCurrency(),
                    })
                );
            }
        });
        try {
            const result = await salesOrderService.confirmSalesOrder(data);
            if (result.token === "Error") {
                setLoadConfirm(false);
                showErrorToast(result.message);
                return;
            }
            const invArr = result.invArr;
            const defaultFilters = {
                search: searchTerm,
                customer_codes: formData.sort_by === "Code" ? formData.customerCodes.map((c) => c.value) : [],
                date_from: formData.date_from,
                date_to: formData.date_to,
                category_dates: formData.category_dates,
            };
            let invMsg = "";
            invArr.forEach((element: any) => {
                invMsg += element["invoice_no"] + ",";
            });
            invMsg = invMsg.slice(0, -1);
            selectInvoices([]);
            selectShipment([]);
            setLoadConfirm(false);
            showSuccessToast(invMsg + " " + translations[result.message]);
            fetchSalesOrder(currentPage, itemsPerPage, defaultFilters);
        } catch (error) {
            setLoadConfirm(false);
            showErrorToast(translations["Failed to save Transaction."] || "Failed to save Transaction.");
        } finally {
            setLoadConfirm(false);
        }
    };
    const handleShowCustomerCredit = async (customerId: number) => {
        try {
            const paginatedData = await customerService.getCustomerCredit(customerId, 1, 999, "");
            setCustomerCredit(paginatedData.data);
            setCustomerCreditFooter(paginatedData.creditBalance);
        } catch (error) {
            console.error("Failed to load customer by credit:", error);
        }
        setIsOpen(true);
    };
    const groupedSupplierCredit: Record<string, ApiCustomerCredit[]> = customerCredit.reduce((groups, item) => {
        const monthLabel = dayjs(item.transaction_date).format("YYYY MMMM");
        if (!groups[monthLabel]) {
            groups[monthLabel] = [];
        }
        groups[monthLabel].push(item);
        return groups;
    }, {} as Record<string, ApiCustomerCredit[]>);
    // Step 4: Sort records inside each month group DESCENDING
    Object.keys(groupedSupplierCredit).forEach((month) => {
        groupedSupplierCredit[month].sort((a, b) => dayjs(b.transaction_date).valueOf() - dayjs(a.transaction_date).valueOf());
    });
    // Step 5: Sort grouped months DESCENDING by max transaction_date inside each group
    const groupedEntries = Object.entries(groupedSupplierCredit).sort((a, b) => {
        const maxDateA = Math.max(...a[1].map((r) => dayjs(r.transaction_date).valueOf()));
        const maxDateB = Math.max(...b[1].map((r) => dayjs(r.transaction_date).valueOf()));
        return maxDateB - maxDateA;
    });
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
                            <label className="text-gray-400 text-sm">{translations["Customer Code"]}</label>
                            {formData.sort_by !== "Group" && (
                                <Select
                                    classNamePrefix="react-select"
                                    isMulti
                                    value={formData.customerCodes}
                                    onChange={(selected) => {
                                        setFormData({ ...formData, customerCodes: selected as OptionType[] });
                                    }}
                                    options={allCustomerOptions}
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
    const renderCancelOrder = () => {
        if (!cancelOrder) return null;
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 transition-opacity duration-300 ease-out">
                <div className="bg-[#19191c] rounded-xl border border-[#ffffff1a] w-[20vw] h-auto flex flex-col">
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-[#ffffff1a]">
                        <div className="flex items-center space-x-4">
                            <h2 className="text-xl font-bold text-white">{translations["Action"]}</h2>
                        </div>
                        <div className="flex items-center space-x-4">
                            <button
                                onClick={() => {
                                    setShowCancelOrder(false);
                                }}
                                className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                            >
                                <X className="h-6 w-6 text-white" />
                            </button>
                        </div>
                    </div>
                    {/* Content */}
                    <div className="flex-1 overflow-auto p-4">
                        <div className="grid grid-cols-12 gap-2">
                            <div className={`col-span-12 md:col-span-12`}>
                                <button
                                    onClick={() => handleSaveCancelOrder("CTOCUST")}
                                    className={`px-2 py-2 bg-cyan-600 hover:bg-cyan-500 rounded text-white transition w-full
                                        ${loadCancelOrder_CTOCUST ? "bg-gray-500 cursor-not-allowed opacity-50" : "bg-cyan-600 hover:bg-cyan-700"} 
                                        text-[#ffffffcc] flex justify-center items-center`}
                                    disabled={loadCancelOrder_CTOCUST || loadCancelOrder_NRTOMI || loadCancelOrder_RPTOC}
                                >
                                    {loadCancelOrder_CTOCUST ? (
                                        <>
                                            <div className="loader mr-2"></div>
                                            <span>{translations["Processing2"]}...</span>
                                        </>
                                    ) : (
                                        <span>{translations["Credit to Customer"]}</span>
                                    )}
                                </button>
                            </div>
                            <div className={`col-span-12 md:col-span-12`}>
                                <button
                                    onClick={() => handleSaveCancelOrder("NRTOMI")}
                                    className={`px-2 py-2 bg-cyan-600 hover:bg-cyan-500 rounded text-white transition w-full
                                        ${loadCancelOrder_NRTOMI ? "bg-gray-500 cursor-not-allowed opacity-50" : "bg-cyan-600 hover:bg-cyan-700"} 
                                        text-[#ffffffcc] flex justify-center items-center`}
                                    disabled={loadCancelOrder_CTOCUST || loadCancelOrder_NRTOMI || loadCancelOrder_RPTOC}
                                >
                                    {loadCancelOrder_NRTOMI ? (
                                        <>
                                            <div className="loader mr-2"></div>
                                            <span>{translations["Processing2"]}...</span>
                                        </>
                                    ) : (
                                        <span>{translations["Non Refundable to Misc Income"]}</span>
                                    )}
                                </button>
                            </div>
                            <div className={`col-span-12 md:col-span-12`}>
                                <button
                                    onClick={() => handleSaveCancelOrder("RPTOC")}
                                    className={`px-2 py-2 bg-cyan-600 hover:bg-cyan-500 rounded text-white transition w-full
                                        ${loadCancelOrder_RPTOC ? "bg-gray-500 cursor-not-allowed opacity-50" : "bg-cyan-600 hover:bg-cyan-700"} 
                                        text-[#ffffffcc] flex justify-center items-center`}
                                    disabled={loadCancelOrder_CTOCUST || loadCancelOrder_NRTOMI || loadCancelOrder_RPTOC}
                                >
                                    {loadCancelOrder_RPTOC ? (
                                        <>
                                            <div className="loader mr-2"></div>
                                            <span>{translations["Processing2"]}...</span>
                                        </>
                                    ) : (
                                        <span>{translations["Refund payment to customer"]}</span>
                                    )}
                                </button>
                            </div>
                            <div className={`col-span-12 md:col-span-12`}>
                                <button onClick={() => setShowCancelOrder(false)} className="px-2 py-2 bg-red-700 hover:bg-gray-600 rounded text-white transition w-full">
                                    {translations["Cancel"]}
                                </button>
                            </div>
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
                                    onClick={handlePrint}
                                    disabled={selectedSO.length === 0}
                                    className="px-2 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors flex items-center space-x-1 text-sm"
                                >
                                    <span>{translations["Print"]}</span>
                                </button>
                                <button
                                    disabled={selectedSO.length === 0}
                                    onClick={handleVoidSelected}
                                    className="px-2 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center space-x-1 text-sm"
                                >
                                    <span>{translations["Void"]}</span>
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
                                    <th className="w-[2%] text-left py-2 px-2 text-gray-400 text-sm w-12"></th>
                                    <th className="w-[2%] text-left py-2 px-2 text-gray-400 text-sm w-12">
                                        <div className="flex items-center h-full">
                                            <CustomCheckbox checked={selectedSO.length === salesOrderList.length && salesOrderList.length > 0} onChange={(checked) => handleSelectAll(checked)} />
                                        </div>
                                    </th>
                                    <th className="w-[3%] text-center py-2 px-2 text-gray-400 text-sm w-12">{translations["Invoice"]}</th>
                                    <th className="w-[2%] text-center py-2 px-2 text-gray-400 text-sm w-12">{translations["Shipment"]}</th>
                                    <th className="w-[5%] text-center py-2 px-2 text-gray-400 text-sm">{translations["Action"]}</th>
                                    <th className="w-[11%] text-left py-2 px-2 text-gray-400 text-sm">{translations["SO Number"]}</th>
                                    <th className="w-[13%] text-left py-2 px-2 text-gray-400 text-sm">{translations["Customer"]}</th>
                                    <th className="w-[10%] text-left py-2 px-2 text-gray-400 text-sm">{translations["Source"]}</th>
                                    <th className="w-[8%] text-center py-2 px-2 text-gray-400 text-sm">{translations["Total"]}</th>
                                    <th className="w-[8%] text-center py-2 px-2 text-gray-400 text-sm">{translations["Deposit"]}</th>
                                    <th className="w-[7%] text-center py-2 px-2 text-gray-400 text-sm">{translations["Credit Used"]}</th>
                                    <th className="w-[8%] text-center py-2 px-2 text-gray-400 text-sm">{translations["Balance"]}</th>
                                    <th className="w-[7%] text-center py-2 px-2 text-gray-400 text-sm">{translations["Status"]}</th>
                                    <th className="w-[10%] text-left py-2 px-2 text-gray-400 text-sm">{translations["Invoice No"]}</th>
                                    <th className="w-[4%] text-center py-2 px-2 text-gray-400 text-sm">{translations["Credits"]}</th>
                                </tr>
                            </thead>
                            {loading ? (
                                <LoadingSpinnerTbody rowsCount={itemsPerPage} />
                            ) : (
                                <tbody>
                                    {salesOrderList.length === 0 ? (
                                        <tr>
                                            <td colSpan={15} className="py-4 px-4 text-center text-gray-400 text-sm border border-[#40404042]">
                                                {translations["No Record Found"] || "No Record Found"}
                                            </td>
                                        </tr>
                                    ) : (
                                        salesOrderList.map((list, index) => (
                                            <React.Fragment key={list.id || index}>
                                                <tr
                                                    key={list.id || index}
                                                    onClick={(e) => handleRowClick(e, list.id)}
                                                    className={`clickable border-b hover:bg-gray-700 hover:bg-opacity-30 transition-colors cursor-pointer ${
                                                        selectedSO.includes(list.id as number) ? "bg-gray-700 bg-opacity-30" : ""
                                                    }`}
                                                    style={{ borderColor: "#40404042" }}
                                                >
                                                    <td className="py-2 px-2 text-gray-400 text-custom-sm text-center align-middle" onClick={(e) => e.stopPropagation()}>
                                                        <button
                                                            onClick={() => handleToggleRow(list.id)}
                                                            className={`px-1 py-1 ${
                                                                expanded_SO.includes(list.id) ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"
                                                            } text-white rounded-lg transition-colors text-xs`}
                                                        >
                                                            {expanded_SO.includes(list.id) ? <Minus size={16} /> : <Plus size={16} />}
                                                        </button>
                                                    </td>

                                                    <td className="py-2 px-2 text-gray-400 text-center text-custom-sm" onClick={(e) => e.stopPropagation()}>
                                                        <CustomCheckbox
                                                            disabled={list.invoice_status_id === 8 || list.invoice_status_id === 5}
                                                            checked={selectedSO.includes(list.id as number) && list.invoice_status_id === 2}
                                                            onChange={(checked) => handleSelectSO(list.id as number, checked)}
                                                        />
                                                    </td>
                                                    <td className="py-2 px-2 text-gray-400 text-center text-custom-sm" onClick={(e) => e.stopPropagation()}>
                                                        <CustomCheckbox
                                                            disabled={list.invoice_status_id === 8 || list.invoice_status_id === 5}
                                                            checked={selectedInvoices.includes(list.id as number)}
                                                            onChange={(checked) => handleSelectInvoices(list.id as number, checked)}
                                                        />
                                                    </td>
                                                    <td className="py-2 px-2 text-gray-400 text-center text-custom-sm" onClick={(e) => e.stopPropagation()}>
                                                        {list.cnt_products > 0 && (
                                                            <CustomCheckbox
                                                                disabled={list.invoice_status_id === 8 || list.invoice_status_id === 5}
                                                                checked={selectedShipment.includes(list.id as number)}
                                                                onChange={(checked) => handleSelectShipment(list.id as number, checked)}
                                                            />
                                                        )}
                                                    </td>
                                                    <td className="py-2 px-2 text-gray-400 text-center text-custom-sm" onClick={(e) => e.stopPropagation()}>
                                                        <button
                                                            type="button"
                                                            onClick={handleConfirm}
                                                            disabled={loadingConfirm || !selectedInvoices.includes(list.id as number)}
                                                            className={`px-1 py-1 rounded-lg transition-colors text-sm text-white ${
                                                                loadingConfirm ? "bg-gray-400 cursor-not-allowed" : "bg-cyan-600 hover:bg-cyan-700"
                                                            }`}
                                                        >
                                                            {loadingConfirm ? (
                                                                <span className="flex items-center justify-center gap-1">
                                                                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                                                                    </svg>
                                                                </span>
                                                            ) : (
                                                                <span>{translations["Confirm"]}</span>
                                                            )}
                                                        </button>
                                                    </td>

                                                    <td className="py-2 px-2 text-gray-400 text-left text-custom-sm">
                                                        <div className="group flex items-center">
                                                            <p className="text-gray-400 text-custom-sm">{highlightMatch(list.so_number, searchTerm)}</p>
                                                            <CopyToClipboard text={list.so_number ?? ""} />
                                                        </div>
                                                    </td>
                                                    <td className="py-2 px-2">
                                                        <div className="flex items-center space-x-3">
                                                            <div>
                                                                <div className="group flex items-center">
                                                                    <p className="text-gray-400 text-custom-sm">{highlightMatch(list.customer_code, searchTerm)}</p>
                                                                    <CopyToClipboard text={list.customer_code || ""} />
                                                                </div>
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
                                                        {list.customer_type === "WC" ? (
                                                            <p>{translations["Wholesale"]}</p>
                                                        ) : (
                                                            <div className="flex flex-col space-y-1">
                                                                <div className="group flex items-center">
                                                                    <p className="text-gray-400 text-custom-sm">{lang === "en" ? list.source_en : list.source_cn}</p>
                                                                    {/* Optionally add CopyToClipboard here if needed */}
                                                                    <CopyToClipboard text={lang === "en" ? list.source_en || "" : list.source_cn || ""} />
                                                                </div>
                                                                <div className="group flex items-center">
                                                                    <p className="text-gray-400 text-custom-sm">{list.user_id}</p>
                                                                    {/* Optionally add CopyToClipboard here too */}
                                                                    <CopyToClipboard text={list.user_id || ""} />
                                                                </div>
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="py-2 px-2 text-gray-400 text-center text-custom-sm">
                                                        {list.currency}
                                                        <br></br>
                                                        {formatMoney(list.total)}
                                                    </td>
                                                    <td className="py-2 px-2 text-gray-400 text-center text-custom-sm">
                                                        {list.currency}
                                                        <br></br>
                                                        {formatMoney(list.total_deposit)}
                                                    </td>
                                                    <td className="py-2 px-2 text-gray-400 text-center text-custom-sm">
                                                        {list.currency}
                                                        <br></br>
                                                        {formatMoney(list.credit_used)}
                                                    </td>
                                                    <td className="py-2 px-2 text-gray-400 text-center text-custom-sm">
                                                        {list.currency}
                                                        <br></br>
                                                        {formatMoney(list.total_to_pay)}
                                                    </td>
                                                    <td className="py-2 px-2 text-gray-400 text-center text-custom-sm">
                                                        <span className={`px-2 py-1 rounded-full text-xs text-custom-sm ${getStatusColor(list.invoice_status_id)}`}>
                                                            {lang === "en" ? list.status_value_en : list.status_value_cn}
                                                        </span>
                                                    </td>
                                                    <td className="py-2 px-2 text-gray-400 text-left text-custom-sm">
                                                        <div className="group flex items-center">
                                                            <p className="text-gray-400 text-custom-sm">{highlightMatch(list.invoice_no || translations["N.A."], searchTerm)}</p>
                                                            <CopyToClipboard text={list.invoice_no ?? translations["N.A."]} />
                                                        </div>
                                                    </td>
                                                    <td className="py-2 px-2 text-gray-400 text-left text-custom-sm" onClick={(e) => e.stopPropagation()}>
                                                        <button
                                                            type="button"
                                                            hidden={list.current_credit === 0}
                                                            onClick={() => handleShowCustomerCredit(list.customer_id)}
                                                            className={`px-1 py-1 text-white rounded-lg transition-colors text-sm ${
                                                                (list.total_to_pay ?? 0) > (list.current_credit ?? 0) ? "bg-red-600 hover:bg-red-700" : "bg-cyan-600 hover:bg-cyan-700"
                                                            }`}
                                                        >
                                                            <span>{translations["View"]}</span>
                                                        </button>
                                                    </td>
                                                </tr>
                                                {expanded_SO.includes(list.id) && (
                                                    <tr>
                                                        <td colSpan={15} className="py-2 px-2">
                                                            <table className="w-full" style={{ backgroundColor: "#060818" }}>
                                                                <thead className="sticky top-0 z-[1] py-1 px-4" style={{ backgroundColor: "#1f2132" }}>
                                                                    <tr className="border-b" style={{ borderColor: "#2d2d30" }}>
                                                                        <th className="w-auto text-left py-2 px-2 text-gray-400 text-sm w-12 border border-[#40404042]">
                                                                            {translations["Product Code"]}
                                                                        </th>
                                                                        <th className="w-auto text-left py-2 px-2 text-gray-400 text-sm w-12 border border-[#40404042]">
                                                                            {translations["Product Name"]}
                                                                        </th>
                                                                        <th className="w-auto text-center py-2 px-2 text-gray-400 text-sm w-12 border border-[#40404042]">{translations["Deposit"]}</th>
                                                                        <th className="w-auto text-center py-2 px-2 text-gray-400 text-sm w-12 border border-[#40404042]">{translations["Qty"]}</th>
                                                                        <th className="w-auto text-center py-2 px-2 text-gray-400 text-sm w-12 border border-[#40404042]">{translations["Price"]}</th>
                                                                        <th className="w-auto text-center py-2 px-2 text-gray-400 text-sm w-12 border border-[#40404042]">{translations["Total"]}</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody>
                                                                    {soDetailMap[list.id] && soDetailMap[list.id]!.length > 0 ? (
                                                                        soDetailMap[list.id]!.map((detail, i) => (
                                                                            <tr key={detail.id || i}>
                                                                                <td className="py-2 px-2 text-gray-400 text-left text-custom-sm">
                                                                                    <div className="group flex items-center">
                                                                                        <p className="text-gray-400 text-custom-sm">
                                                                                            {detail.product_code
                                                                                                ? highlightMatch(detail.product_code, searchTerm)
                                                                                                : translations["Deleted"] || "Deleted"}
                                                                                        </p>
                                                                                        <CopyToClipboard text={detail.product_code ? detail.product_code : ""} />
                                                                                    </div>
                                                                                </td>
                                                                                <td className="py-2 px-2 text-gray-400 text-left text-custom-sm">
                                                                                    {highlightMatch(
                                                                                        lang === "en"
                                                                                            ? detail.product_title_en
                                                                                                ? detail.product_title_en
                                                                                                : translations["Deleted"] || "Deleted"
                                                                                            : detail.product_title_cn
                                                                                            ? detail.product_title_cn
                                                                                            : translations["Deleted"] || "Deleted",
                                                                                        searchTerm
                                                                                    )}
                                                                                </td>
                                                                                <td className="py-2 px-2 text-gray-400 text-center text-custom-sm">
                                                                                    {detail.currency} {formatMoney(detail.deposit)}
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
                        <ExportReportSelector formats={["odt", "ods", "xlsx"]} baseName="CustomerSO" ids={selectedSO.length > 0 ? selectedSO : salesOrderList.map((p) => p.id)} language={altLang} />
                        <div className="hidden">
                            <ExportReportSelector ref={exportRef} formats={["odt"]} baseName="DownloadSelectedSingleSO" ids={selectedSO} language={altLang} />
                        </div>
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
                {renderCancelOrder()}
                {/* Toggle Button */}
                {/* Overlay */}
                {isOpen && <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={closeMenu} />}

                {/* Off-Canvas Panel - Right Side */}
                <div
                    className={`fixed top-0 right-0 pt-20 w-80 h-full bg-white shadow-lg z-50 transform transition-transform duration-300 ${isOpen ? "translate-x-0" : "translate-x-full"}`}
                    style={{ backgroundColor: "#19191c", borderColor: "#404040" }}
                >
                    <div className="flex items-center justify-between p-2 border-b border-[#ffffff1a]">
                        <div className="flex items-center space-x-4">
                            <h2 className="text-xl font-bold text-white">{translations["Credits"]}</h2>
                        </div>
                        <div className="flex items-center space-x-4">
                            <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-gray-700 rounded-lg transition-colors">
                                <X className="h-6 w-6 text-white" />
                            </button>
                        </div>
                    </div>
                    <div className="overflow-x-auto flex-grow">
                        <div className="h-[calc(100vh-170px)] overflow-y-auto">
                            <table className="w-full">
                                <thead className="sticky top-0 z-[1]" style={{ backgroundColor: "#1f2132" }}>
                                    <tr className="border-b" style={{ borderColor: "#2d2d30" }}>
                                        <th className="w-[19%] py-2 px-2 text-gray-400 text-left text-custom-sm">{translations["Details"]}</th>
                                        <th className="w-[18%] py-2 px-2 text-gray-400 text-right text-custom-sm">{translations["Amount"]}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {groupedEntries.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="py-2 px-2 text-center text-gray-400 text-sm">
                                                No records found.
                                            </td>
                                        </tr>
                                    ) : (
                                        groupedEntries.map(([month, records]) => (
                                            <React.Fragment key={month}>
                                                <tr className="border-b hover:bg-gray-700 hover:bg-opacity-30 transition-colors" style={{ borderColor: "#40404042" }}>
                                                    <td colSpan={2} className="py-2 px-2 text-white-400 text-left text-custom-md flex items-center gap-2">
                                                        <Calendar className="h-6 w-6" size={25} />
                                                        <span>{month}</span>
                                                    </td>
                                                </tr>

                                                {records.map((list: any, index: number) => {
                                                    const credit = parseFloat(list.credit ?? 0);
                                                    const debit = parseFloat(list.debit ?? 0);
                                                    const stringParticular = list.particulars.split("~");
                                                    const particularEn = stringParticular[0];
                                                    const particularCn = stringParticular[1] || stringParticular[0];
                                                    return (
                                                        <React.Fragment key={list.id ?? index}>
                                                            <tr className="border-b hover:bg-gray-700 hover:bg-opacity-30 transition-colors" style={{ borderColor: "#40404042" }}>
                                                                <td className="py-2 px-2 text-gray-400 text-left text-custom-sm">
                                                                    <p className="text-gray-400">{formatDate(list.transaction_date, lang)}</p>
                                                                    <p className="text-gray-400">{list.ref_data}</p>
                                                                    <p className="text-gray-400">{lang === "en" ? particularEn : particularCn}</p>
                                                                </td>
                                                                <td className="py-2 px-2 text-gray-400 text-right text-custom-sm">
                                                                    {credit > 0 ? (
                                                                        <p className="text-green-500">
                                                                            + {list.currency} {formatMoney(credit)}
                                                                        </p>
                                                                    ) : (
                                                                        <p className="text-red-500">
                                                                            - {list.currency} {formatMoney(debit)}
                                                                        </p>
                                                                    )}
                                                                    <p className="text-gray-400">{translations["Balance"]}</p>
                                                                    <p className="text-gray-400">
                                                                        {list.currency} {formatMoney(list.running_balance)}
                                                                    </p>
                                                                </td>
                                                            </tr>
                                                        </React.Fragment>
                                                    );
                                                })}
                                            </React.Fragment>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    <div className="p-2 border-t border-[#ffffff1a] flex justify-end space-x-4">
                        {CustomerCreditFooter?.map((footer, index) => (
                            <p key={index} className="text-custom-sm text-yellow-400">
                                {footer.currency} {formatMoney(footer.balance)}
                            </p>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SalesOrderList;
