import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { paymentVoucherService, ApiPaymentVoucher, DetailsRow, FilterParams } from "@/services/paymentVoucherService";
import { useLanguage } from "@/context/LanguageContext";
import CustomCheckbox from "@/components/CustomCheckbox";
import { showConfirm } from "@/utils/alert";
import { showSuccessToast, showErrorToast } from "@/utils/toast";
import Pagination from "@/components/Pagination";
import ItemsPerPageSelector from "@/components/ItemsPerPageSelector";
import CopyToClipboard from "@/components/CopyToClipboard";
import { X, Minus, Plus, ChevronDown } from "lucide-react";
import PusherEcho from "@/utils/echo";
import Select from "react-select";
import Flatpickr from "react-flatpickr";
import { ExportReportSelector } from "@/utils/ExportReportSelector";
import { getFlatpickrLocale } from "@/utils/flatpickrLocale";
import { fetchSuppliers, OptionType } from "@/utils/fetchDropdownData";
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
interface OperatingExpenseListProps {
    tabId: string;
    onOperatingExpenseSelect: (paymentVoucherId: number, saveType?: string) => void;
    onChangeView: (view: "list" | "details") => void;
    selectedOE: number[];
    onSelectedOEChange: (selected: number[]) => void;
    expandedRows: number[];
    onExpandedRowsChange: (expanded: number[]) => void;
}
type InvoiceItem = {
    invoice_no: string;
    receive_amount: number;
    invoice_id: number;
};
type FormDataType = {
    sort_by: string;
    customer_id: number;
    customer_code: string;
    category_dates: string;
    date_from: Date | null; // Allow null here
    date_to: Date | null; // Allow null here
    supplierCodes: OptionType[];
    rv_date: Date | null;
    bank: OptionType | null;
    balance_to_pay: number;
    received_amount: number;
    current_credit: number;
    credit_used: number;
    currency: string;
    invoice_nos: InvoiceItem[];
};
interface POFooter {
    currency: string;
    total: number;
}
// localStorage.clear();
const OperatingExpenseList: React.FC<OperatingExpenseListProps> = ({ tabId, onOperatingExpenseSelect, selectedOE, onSelectedOEChange }) => {
    const { translations, lang } = useLanguage();
    const [operatingExpenseList, setOperatingExpense] = useState<ApiPaymentVoucher[]>([]);
    const [totalPages, setTotalPages] = useState(1);
    const locale = getFlatpickrLocale(translations);
    const pageSizeOptions = useMemo(() => [15, 20, 50, -1], []);
    const [expanded_PV, setExpandedRows] = useState<number[]>([]);
    const [pvDetailMap, setPVDetailsMap] = useState<Record<number, DetailsRow[] | null>>({});
    const [activeAdvanceSearch, setActiveAdvanceSearch] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const [showDateRange, setShowDateRange] = useState(false);
    const [showAdvanceSearch, setShowAdvanceSearch] = useState(false);
    const [allCustomer, setAllCustomer] = useState<DropdownData[]>([]);
    const throttleTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
    const [rvFooter2, setPVFooter2] = useState<POFooter[]>([]); // Changed to array
    const inputRef = useRef<HTMLInputElement>(null);
    const [loading, setLoading] = useState(() => {
        const savedLoading = localStorage.getItem(`${tabId}-loading-oe-list`);
        return savedLoading !== null ? JSON.parse(savedLoading) : true;
    });
    const exportRef = useRef<{ triggerExport: () => void }>(null);
    const [formData, setFormData] = useState<FormDataType>({
        sort_by: "Code",
        customer_id: 0,
        customer_code: "",
        category_dates: "InvoiceDate",
        supplierCodes: [],
        date_from: null as Date | null,
        date_to: null as Date | null,
        rv_date: new Date(), // Set current date as Date object, not string
        bank: null,
        balance_to_pay: 0,
        received_amount: 0,
        current_credit: 0,
        credit_used: 0,
        currency: "",
        invoice_nos: [],
    });
    const [currentPage, setCurrentPage] = useState(() => {
        const metaKey = `${tabId}-cached-meta-oe-list`;
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
        const metaKey = `${tabId}-cached-meta-oe-list`;
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
        const cached = localStorage.getItem(`${tabId}-cached-meta-oe-list`);
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
                const data = operatingExpenseList.find((po) => po.id === tableId);
                // Save to state
                if (!data?.details) {
                    setPVDetailsMap((prev) => ({ ...prev, [tableId]: null }));
                    return;
                }
                const details: DetailsRow[] = data.details;
                setPVDetailsMap((prev) => ({ ...prev, [tableId]: details }));
            });
            setExpandedRows(checkedIds);
        }
    }, [tabId, operatingExpenseList]);

    useEffect(() => {
        const channel = PusherEcho.channel("pv-channel");
        channel.listen(".pv-event", () => {
            const defaultFilters = {
                search: searchTerm,
                supplier_codes: formData.sort_by === "Code" ? formData.supplierCodes.map((c) => c.value) : [],
                date_from: formData.date_from,
                date_to: formData.date_to,
                category_dates: formData.category_dates,
            };
            localStorage.removeItem(`${tabId}-cached-oe-list`);
            setTimeout(() => {
                fetchOperatingExpense(currentPage, itemsPerPage, defaultFilters);
            }, 500);
        });
        return () => {
            PusherEcho.leave("pv-channel");
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
        const MasterKey = `${tabId}-cached-oe-list`;
        const metaKey = `${tabId}-cached-meta-oe-list`;
        const mountKey = `${tabId}-mount-status-receive-voucher`;
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
            fetchOperatingExpense(currentPage, itemsPerPage, defaultFilters);
            return;
        }
        const cachedSuppliersRaw = localStorage.getItem(MasterKey);
        const cachedMetaRaw = localStorage.getItem(metaKey);

        if (!cachedSuppliersRaw || !cachedMetaRaw) {
            fetchOperatingExpense(currentPage, itemsPerPage, defaultFilters);
            return;
        }

        try {
            const cachedMeta = JSON.parse(cachedMetaRaw);
            const cachedSuppliers = JSON.parse(cachedSuppliersRaw);
            const isCacheValid = cachedMeta.page === currentPage && cachedMeta.perPage === itemsPerPage && JSON.stringify(cachedMeta.search) === JSON.stringify(defaultFilters.search);

            if (isCacheValid) {
                setOperatingExpense(cachedSuppliers);
                setTotalPages(cachedMeta.totalPages);
                setLoading(false);
                localStorage.setItem(`${tabId}-loading-oe-list`, JSON.stringify(false));
                return;
            }
        } catch (err) {
            console.warn("Failed to parse cached meta:", err);
        }

        fetchOperatingExpense(currentPage, itemsPerPage, defaultFilters);
    }, [currentPage, itemsPerPage, searchTerm, tabId]);

    useEffect(() => {
        const handleEsc = (event: any) => {
            if (event.key === "Escape") {
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
    }, [showAdvanceSearch, showDateRange]);

    const fetchOperatingExpense = async (page = currentPage, perPage = itemsPerPage, filters: FilterParams = { search: "" }) => {
        try {
            if (loading) {
                setLoading(true);
            }
            localStorage.setItem(`${tabId}-loading-oe-list`, JSON.stringify(true));
            const paginatedData = await paymentVoucherService.getAllOperatingExpense(page, perPage, filters);
            setOperatingExpense(paginatedData.data);
            setTotalPages(paginatedData.last_page);
            setPVFooter2(paginatedData.footer2);
            localStorage.setItem(`${tabId}-cached-oe-list`, JSON.stringify(paginatedData.data));
            localStorage.setItem(
                `${tabId}-cached-meta-oe-list`,
                JSON.stringify({
                    page,
                    perPage,
                    filters,
                    totalPages: paginatedData.last_page,
                    totalItems: paginatedData.total,
                })
            );
        } catch (err) {
            console.error("Error fetching oe:", err);
        } finally {
            setLoading(false);
            localStorage.setItem(`${tabId}-loading-oe-list`, JSON.stringify(false));
        }
    };
    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            onSelectedOEChange(operatingExpenseList.map((p) => p.id).filter(Boolean) as number[]);
        } else {
            onSelectedOEChange([]);
        }
    };
    const handleDateFrom = useCallback((dates: Date[]) => {
        setFormData((prev) => ({ ...prev, date_from: dates[0] ?? null }));
    }, []);
    const handleDateTo = useCallback((dates: Date[]) => {
        setFormData((prev) => ({ ...prev, date_to: dates[0] ?? null }));
    }, []);
    const statusMap: Record<string, { color: string }> = {
        1: { color: "bg-green-600 bg-opacity-20 text-green-400 uppercase" },
        2: { color: "bg-cyan-600 bg-opacity-20 text-cyan-300 uppercase" },
        3: { color: "bg-yellow-600 bg-opacity-20 text-yellow-300 uppercase" },
        5: { color: "bg-red-500 bg-opacity-20 text-red-300 uppercase" },
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
        fetchOperatingExpense(1, itemsPerPage, filters);
    };
    const handleReset = () => {
        setFormData({
            ...formData,
            date_from: null,
            date_to: null,
            category_dates: "InvoiceDate",
            sort_by: "Code",
            supplierCodes: [],
        });
        setLoading(true);
        setActiveAdvanceSearch(false);
        setShowDropdown(false);
        setSearchTerm("");
        setCurrentPage(1);
        setItemsPerPage(15);
        fetchOperatingExpense(1, 15, {
            search: "",
            supplier_codes: [],
            date_from: null,
            date_to: null,
            category_dates: "InvoiceDate",
        });
    };
    const handleSelectInv = (id: number, checked: boolean) => {
        const updated = checked ? [...selectedOE, id] : selectedOE.filter((pid) => pid !== id);

        onSelectedOEChange(updated);
    };
    const handleVoidSelected = async () => {
        if (selectedOE.length === 0) {
            showErrorToast(translations["Please click checkbox to select row"]);
            return;
        }
        const selectedOEMaster = operatingExpenseList.filter((item) => selectedOE.includes(item.id));
        const data = new FormData();
        selectedOEMaster.forEach((list: any) => {
            if (list) {
                data.append("details[]", JSON.stringify({ pv_number: list.pv_number }));
            }
        });
        const confirmed = await showConfirm(translations["Void Record(s)"], translations["alert_message_38"], translations["Yes"], translations["Cancel"]);
        if (!confirmed) return;
        try {
            const result = await paymentVoucherService.voidPaymentVoucher(data);
            if (result.token === "Error") {
                showErrorToast(result.message);
                return;
            }
            const defaultFilters = {
                search: searchTerm,
                supplier_codes: formData.sort_by === "Code" ? formData.supplierCodes.map((c) => c.value) : [],
                date_from: formData.date_from,
                date_to: formData.date_to,
                category_dates: formData.category_dates,
            };
            onSelectedOEChange([]);
            showSuccessToast(translations[result.message]);
            fetchOperatingExpense(currentPage, itemsPerPage, defaultFilters);
        } catch (error) {}
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
        fetchOperatingExpense(1, itemsPerPage, filters);
    };
    const handleRowClick = (e: React.MouseEvent, paymentVoucherId: number) => {
        // Prevent navigation if clicking on checkboxes or toggle switches
        const target = e.target as HTMLElement;
        if (target.closest("input") || target.closest("label") || target.closest("[data-copy-button]")) {
            return;
        }
        onOperatingExpenseSelect(paymentVoucherId, paymentVoucherId == 0 ? "new" : "edit");
    };
    const loadAllSupplier = async () => {
        try {
            const list = await fetchSuppliers(); // fetches & returns
            setAllCustomer(list ?? []); // ✅ manually set state here
        } catch (err) {
            console.error("Failed to fetch loadAllSupplier:", err);
        }
    };
    const handlePrint = async () => {
        if (selectedOE.length === 0) {
            showErrorToast(translations["Please click checkbox to select row"]);
            return;
        }
        exportRef.current?.triggerExport();
    };
    const handleToggleRow = async (tableId: number) => {
        const isExpanded = expanded_PV.includes(tableId);
        const expandedKey = tabId + "_expandedKey";

        if (isExpanded) {
            // Collapse row
            const updated = expanded_PV.filter((id) => id !== tableId);
            setExpandedRows(updated);
            localStorage.setItem(expandedKey, JSON.stringify(updated));
        } else {
            // Expand row
            const updated = [...expanded_PV, tableId];
            setExpandedRows(updated);
            localStorage.setItem(expandedKey, JSON.stringify(updated));
            try {
                const data = operatingExpenseList.find((po) => po.id === tableId);
                // Save to state
                if (!data?.details) {
                    setPVDetailsMap((prev) => ({ ...prev, [tableId]: null }));
                    return;
                }
                const details: DetailsRow[] = data.details;
                setPVDetailsMap((prev) => ({ ...prev, [tableId]: details }));
            } catch (error) {
                setPVDetailsMap((prev) => ({ ...prev, [tableId]: null }));
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
                        {/* First Row: Sort By, Supplier Code */}
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
                                    disabled={selectedOE.length === 0}
                                    className="px-2 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors flex items-center space-x-1 text-sm"
                                >
                                    <span>{translations["Print"]}</span>
                                </button>
                                <button
                                    disabled={selectedOE.length === 0}
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
                    <div className="h-[calc(100vh-215px)] overflow-y-auto">
                        <table className="w-full">
                            <thead className="sticky top-0 z-[1]" style={{ backgroundColor: "#1f2132" }}>
                                <tr className="border-b" style={{ borderColor: "#2d2d30" }}>
                                    <th className="w-[3%] text-center py-2 px-2 text-gray-400 text-sm"></th>
                                    <th className="w-[3%] text-center py-2 px-2 text-gray-400 text-sm">
                                        <div className="flex justify-center items-center">
                                            <CustomCheckbox
                                                checked={selectedOE.length === operatingExpenseList.length && operatingExpenseList.length > 0}
                                                onChange={(checked) => handleSelectAll(checked)}
                                            />
                                        </div>
                                    </th>
                                    <th className="w-[9%] text-left py-2 px-2 text-gray-400 text-sm">{translations["PV Date"]}</th>
                                    <th className="w-[17%] text-left py-2 px-2 text-gray-400 text-sm">{translations["Payment to"]}</th>
                                    <th className="w-[10%] text-left py-2 px-2 text-gray-400 text-sm">{translations["PV No"]}</th>
                                    <th className="w-[9%] text-center py-2 px-2 text-gray-400 text-sm">{translations["Ex Rate"]}</th>
                                    <th className="w-[9%] text-center py-2 px-2 text-gray-400 text-sm">{translations["Credit Used"]}</th>
                                    <th className="w-[10%] text-center py-2 px-2 text-gray-400 text-sm">{translations["Amount Paid"]}</th>
                                    <th className="w-[10%] text-center py-2 px-2 text-gray-400 text-sm">{translations["Total"]}</th>
                                    <th className="w-[10%] text-left py-2 px-2 text-gray-400 text-sm">{translations["PV Status"]}</th>
                                    <th className="w-[10%] text-left py-2 px-2 text-gray-400 text-sm">{translations["Payment Type"]}</th>
                                </tr>
                            </thead>
                            {loading ? (
                                <LoadingSpinnerTbody rowsCount={itemsPerPage} />
                            ) : (
                                <tbody>
                                    {operatingExpenseList.length === 0 ? (
                                        <tr>
                                            <td colSpan={15} className="py-4 px-4 text-center text-gray-400 text-sm border border-[#40404042]">
                                                {translations["No Record Found"] || "No Record Found"}
                                            </td>
                                        </tr>
                                    ) : (
                                        operatingExpenseList.map((list, index) => (
                                            <React.Fragment key={list.id || index}>
                                                <tr
                                                    key={list.id || index}
                                                    onClick={(e) => handleRowClick(e, list.id)}
                                                    className={`clickable border-b hover:bg-gray-700 hover:bg-opacity-30 transition-colors cursor-pointer ${
                                                        selectedOE.includes(list.id as number) ? "bg-gray-700 bg-opacity-30" : ""
                                                    }`}
                                                    style={{ borderColor: "#40404042" }}
                                                >
                                                    <td className="py-2 px-2 text-gray-400 text-center text-custom-sm" onClick={(e) => e.stopPropagation()}>
                                                        <button
                                                            onClick={() => handleToggleRow(list.id)}
                                                            className={`px-1 py-1 ${
                                                                expanded_PV.includes(list.id) ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"
                                                            } text-white rounded-lg transition-colors text-xs`}
                                                        >
                                                            {expanded_PV.includes(list.id) ? <Minus size={16} /> : <Plus size={16} />}
                                                        </button>
                                                    </td>
                                                    <td className="py-2 px-2 text-gray-400 text-center text-custom-sm" onClick={(e) => e.stopPropagation()}>
                                                        <CustomCheckbox
                                                            disabled={list.invoice_status_id === 8 || list.invoice_status_id === 5}
                                                            checked={selectedOE.includes(list.id as number)}
                                                            onChange={(checked) => handleSelectInv(list.id as number, checked)}
                                                        />
                                                    </td>
                                                    <td className="py-2 px-2 text-gray-400 text-left text-custom-sm">{formatDate(list.pv_date, lang)}</td>
                                                    <td className="py-2 px-2">
                                                        <div className="flex items-center space-x-3">
                                                            {list.payment_type_id === 1 || list.payment_type_id === 5 ? (
                                                                <div>
                                                                    <div className="group flex items-center">
                                                                        <p className="text-gray-400 text-custom-sm">{highlightMatch(list.supplier_code, searchTerm)}</p>
                                                                        <CopyToClipboard text={list.supplier_code || ""} />
                                                                    </div>
                                                                    <div className="group flex items-center">
                                                                        <p className="text-gray-400 text-custom-sm">
                                                                            {highlightMatch(lang === "en" ? list.suppliername_en : list.suppliername_cn, searchTerm)}
                                                                        </p>
                                                                        <CopyToClipboard text={lang === "en" ? list.suppliername_en || "" : list.suppliername_cn || ""} />
                                                                    </div>
                                                                </div>
                                                            ) : null}

                                                            {list.payment_type_id === 2 ? (
                                                                <div>
                                                                    <div className="group flex items-center">
                                                                        <p className="text-gray-400 text-custom-sm">{highlightMatch(lang === "en" ? list.pay_to_en : list.pay_to_cn, searchTerm)}</p>
                                                                        <CopyToClipboard text={lang === "en" ? list.pay_to_en || "" : list.pay_to_cn || ""} />
                                                                    </div>
                                                                </div>
                                                            ) : null}

                                                            {list.payment_type_id === 3 ? (
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
                                                            ) : null}

                                                            {list.payment_type_id === 4 ? (
                                                                <div>
                                                                    <div className="group flex items-center">
                                                                        <p className="text-gray-400 text-custom-sm">{highlightMatch(list.pv_number, searchTerm)}</p>
                                                                        <CopyToClipboard text={list.pv_number || ""} />
                                                                    </div>
                                                                    <div className="group flex items-center">
                                                                        <p className="text-gray-400 text-custom-sm">
                                                                            {highlightMatch(lang === "en" ? list.suppliername_en : list.suppliername_cn, searchTerm)}
                                                                        </p>
                                                                        <CopyToClipboard text={lang === "en" ? list.suppliername_en || "" : list.suppliername_cn || ""} />
                                                                    </div>
                                                                </div>
                                                            ) : null}
                                                        </div>
                                                    </td>

                                                    <td className="py-2 px-2 text-gray-400 text-left text-custom-sm">
                                                        <div className="group flex items-center">
                                                            <p className="text-gray-400 text-custom-sm">{highlightMatch(list.pv_number, searchTerm)}</p>
                                                            <CopyToClipboard text={list.pv_number} />
                                                        </div>
                                                    </td>
                                                    <td className="py-2 px-2 text-gray-400 text-center text-custom-sm">{list.ex_rate?.toFixed(4)}</td>
                                                    <td className="py-2 px-2 text-gray-400 text-center text-custom-sm">
                                                        {list.currency}
                                                        <br></br>
                                                        {formatMoney(list.credit_used)}
                                                    </td>
                                                    <td className="py-2 px-2 text-gray-400 text-center text-custom-sm">
                                                        {list.currency}
                                                        <br></br>
                                                        {formatMoney(list.total_amount)}
                                                    </td>
                                                    <td className="py-2 px-2 text-gray-400 text-center text-custom-sm">
                                                        {list.currency}
                                                        <br></br>
                                                        {formatMoney(list.credit_used + list.total_amount)}
                                                    </td>
                                                    <td className="py-2 px-2 text-gray-400 text-left text-custom-sm">
                                                        <span className={`px-2 py-1 rounded-full text-xs text-custom-sm ${getStatusColor(list.pv_status_id)}`}>
                                                            {lang === "en" ? list.status_value_en : list.status_value_cn}
                                                        </span>
                                                    </td>
                                                    <td className="py-2 px-2 text-gray-400 text-left text-custom-sm">{lang === "en" ? list.payment_type_en : list.payment_type_cn}</td>
                                                </tr>
                                                {expanded_PV.includes(list.id) && (
                                                    <React.Fragment key={`${list.id}-rv`}>
                                                        <tr>
                                                            <td colSpan={11} className="py-0 px-4 pt-2">
                                                                <table className="w-full" style={{ backgroundColor: "#060818" }}>
                                                                    <thead className="sticky top-0 z-[1] py-1 px-4" style={{ backgroundColor: "#1f2132" }}>
                                                                        <tr className="border-b" style={{ borderColor: "#2d2d30" }}>
                                                                            <th className="w-auto text-left py-2 px-2 text-gray-400 text-sm w-12 border border-[#40404042]">
                                                                                {translations["Account Code"]}
                                                                            </th>
                                                                            <th className="w-auto text-left py-2 px-2 text-gray-400 text-sm w-12 border border-[#40404042]">
                                                                                {translations["Account Description"]}
                                                                            </th>
                                                                            <th className="w-auto text-left py-2 px-2 text-gray-400 text-sm w-12 border border-[#40404042]">
                                                                                {translations["Product"]}
                                                                            </th>
                                                                            <th className="w-auto text-center py-2 px-2 text-gray-400 text-sm w-12 border border-[#40404042]">
                                                                                {translations["Ex Rate"]}
                                                                            </th>
                                                                            <th className="w-auto text-center py-2 px-2 text-gray-400 text-sm w-12 border border-[#40404042]">
                                                                                {translations["Amount"]}
                                                                            </th>
                                                                            <th className="w-auto text-center py-2 px-2 text-gray-400 text-sm w-12 border border-[#40404042]">
                                                                                {translations["Default Currency"]}
                                                                            </th>
                                                                            <th className="w-auto text-center py-2 px-2 text-gray-400 text-sm w-12 border border-[#40404042]">
                                                                                {translations["Reference2"]}
                                                                            </th>
                                                                        </tr>
                                                                    </thead>
                                                                    <tbody>
                                                                        {pvDetailMap[list.id] && pvDetailMap[list.id]!.length > 0 ? (
                                                                            pvDetailMap[list.id]!.map((detail, i) => (
                                                                                <tr key={detail.id || i}>
                                                                                    <td className="py-2 px-2 text-gray-400 text-left text-custom-sm">
                                                                                        <div className="group flex items-center">
                                                                                            <p className="text-gray-400 text-custom-sm">
                                                                                                {detail.account_code
                                                                                                    ? highlightMatch(detail.account_code, searchTerm)
                                                                                                    : translations["Deleted"] || "Deleted"}
                                                                                            </p>
                                                                                            <CopyToClipboard text={detail.account_code ? detail.account_code : ""} />
                                                                                        </div>
                                                                                    </td>
                                                                                    <td className="py-2 px-2 text-gray-400 text-left text-custom-sm">
                                                                                        {highlightMatch(lang === "en" ? detail.account_name_en : detail.account_name_cn, searchTerm)}
                                                                                    </td>
                                                                                    <td className="py-2 px-2 text-gray-400 text-left text-custom-sm">
                                                                                        <div>
                                                                                            <div className="group flex items-center">
                                                                                                <p className="text-gray-400 text-custom-sm">{highlightMatch(detail.product_code, searchTerm)}</p>
                                                                                                <CopyToClipboard text={detail.product_code || translations["N.A."]} />
                                                                                            </div>
                                                                                            <div className="group flex items-center">
                                                                                                <p className="text-gray-400 text-custom-sm">
                                                                                                    {highlightMatch(lang === "en" ? detail.product_title_en : detail.product_title_cn, searchTerm)}
                                                                                                </p>
                                                                                                <CopyToClipboard
                                                                                                    text={
                                                                                                        lang === "en"
                                                                                                            ? detail.product_title_en || translations["N.A."]
                                                                                                            : detail.product_title_cn || translations["N.A."]
                                                                                                    }
                                                                                                />
                                                                                            </div>
                                                                                        </div>
                                                                                    </td>
                                                                                    <td className="py-2 px-2 text-gray-400 text-center text-custom-sm">{detail.ex_rate.toFixed(4)}</td>
                                                                                    <td className="py-2 px-2 text-gray-400 text-center text-custom-sm">
                                                                                        {list.currency}
                                                                                        <br></br>
                                                                                        {detail.amount.toFixed(2)}
                                                                                    </td>
                                                                                    <td className="py-2 px-2 text-gray-400 text-center text-custom-sm">
                                                                                        {baseCurrency()}
                                                                                        <br></br>
                                                                                        {detail.base_amount.toFixed(2)}
                                                                                    </td>
                                                                                    <td className="py-2 px-2 text-gray-400 text-center text-custom-sm">{detail.ref_data || translations["N.A."]}</td>
                                                                                </tr>
                                                                            ))
                                                                        ) : (
                                                                            <tr>
                                                                                <td colSpan={7} className="py-2 px-2 text-center text-gray-400 text-sm">
                                                                                    {translations["No Record Found"]}.
                                                                                </td>
                                                                            </tr>
                                                                        )}
                                                                    </tbody>
                                                                </table>
                                                            </td>
                                                        </tr>
                                                    </React.Fragment>
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
                            baseName="PaymentVoucher"
                            ids={selectedOE.length > 0 ? selectedOE : operatingExpenseList.map((p) => p.id)}
                            language={lang}
                        />
                        <div className="hidden">
                            <ExportReportSelector ref={exportRef} formats={["odt"]} baseName="DownloadSelectedSinglePV" ids={selectedOE} language={lang} />
                        </div>
                    </div>
                    <div className="p-1 flex items-center space-x-1">
                        <div className="flex items-center space-x-4">
                            <table className="w-full">
                                <tbody>
                                    {rvFooter2
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
    );
};

export default OperatingExpenseList;
