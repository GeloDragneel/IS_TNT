import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { supplierCreditNoteService, ApiCreditNote, DetailsRow, FilterParams } from "@/services/supplierCreditNoteService";
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
                    <td className="text-center items-center py-2 px-2">
                        <div className="flex flex-col space-y-2 py-1 flex-1">
                            <div className="h-4 bg-gray-700 rounded w-full"></div>
                        </div>
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
interface ReceiveVoucherListProps {
    tabId: string;
    onSupplierCreditNoteSelect: (creditNoteId: number, saveType?: string) => void;
    onChangeView: (view: "list" | "details") => void;
    selectedCR: number[];
    onSelectedCRChange: (selected: number[]) => void;
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
    supplier_id: number;
    supplier_code: string;
    category_dates: string;
    date_from: Date | null; // Allow null here
    date_to: Date | null; // Allow null here
    customerCodes: OptionType[];
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
const ReceiveVoucherList: React.FC<ReceiveVoucherListProps> = ({ tabId, onSupplierCreditNoteSelect, selectedCR, onSelectedCRChange }) => {
    const { translations, lang } = useLanguage();
    const [creditNoteList, setCreditNote] = useState<ApiCreditNote[]>([]);
    const [totalPages, setTotalPages] = useState(1);
    const locale = getFlatpickrLocale(translations);
    const pageSizeOptions = useMemo(() => [15, 20, 50, -1], []);
    const [expanded_CR, setExpandedRows] = useState<number[]>([]);
    const [crDetailMap, setCRDetailsMap] = useState<Record<number, DetailsRow[] | null>>({});
    const [activeAdvanceSearch, setActiveAdvanceSearch] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const [showDateRange, setShowDateRange] = useState(false);
    const [showAdvanceSearch, setShowAdvanceSearch] = useState(false);
    const [allCustomer, setAllCustomer] = useState<DropdownData[]>([]);
    const throttleTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
    const [rvFooter2, setCRFooter2] = useState<POFooter[]>([]); // Changed to array
    const inputRef = useRef<HTMLInputElement>(null);
    const [loading, setLoading] = useState(() => {
        const savedLoading = localStorage.getItem(`${tabId}-loading-cr-list`);
        return savedLoading !== null ? JSON.parse(savedLoading) : true;
    });
    const [formData, setFormData] = useState<FormDataType>({
        sort_by: "Code",
        supplier_id: 0,
        supplier_code: "",
        category_dates: "Date",
        customerCodes: [],
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
        const metaKey = `${tabId}-cached-meta-cr-list`;
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
        const metaKey = `${tabId}-cached-meta-cr-list`;
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
        const cached = localStorage.getItem(`${tabId}-cached-meta-cr-list`);
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
                const data = creditNoteList.find((po) => po.id === tableId);
                // Save to state
                if (!data?.details) {
                    setCRDetailsMap((prev) => ({ ...prev, [tableId]: null }));
                    return;
                }
                const details: DetailsRow[] = data.details;
                setCRDetailsMap((prev) => ({ ...prev, [tableId]: details }));
            });
            setExpandedRows(checkedIds);
        }
    }, [tabId, creditNoteList]);

    useEffect(() => {
        const channel = PusherEcho.channel("rv-channel");
        channel.listen(".rv-event", () => {
            const defaultFilters = {
                search: searchTerm,
                supplier_codes: formData.sort_by === "Code" ? formData.customerCodes.map((c) => c.value) : [],
                date_from: formData.date_from,
                date_to: formData.date_to,
                category_dates: formData.category_dates,
            };
            localStorage.removeItem(`${tabId}-cached-cr-list`);
            setTimeout(() => {
                fetchCreditNote(currentPage, itemsPerPage, defaultFilters);
            }, 500);
        });
        return () => {
            PusherEcho.leave("rv-channel");
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
        const MasterKey = `${tabId}-cached-cr-list`;
        const metaKey = `${tabId}-cached-meta-cr-list`;
        const mountKey = `${tabId}-mount-status-receive-voucher`;
        const isFirstMount = sessionStorage.getItem(mountKey) !== "mounted";
        const defaultFilters = {
            search: searchTerm,
            supplier_codes: formData.sort_by === "Code" ? formData.customerCodes.map((c) => c.value) : [],
            date_from: formData.date_from,
            date_to: formData.date_to,
            category_dates: formData.category_dates,
        };
        if (isFirstMount) {
            sessionStorage.setItem(mountKey, "mounted");
            fetchCreditNote(currentPage, itemsPerPage, defaultFilters);
            return;
        }
        const cachedSuppliersRaw = localStorage.getItem(MasterKey);
        const cachedMetaRaw = localStorage.getItem(metaKey);

        if (!cachedSuppliersRaw || !cachedMetaRaw) {
            fetchCreditNote(currentPage, itemsPerPage, defaultFilters);
            return;
        }

        try {
            const cachedMeta = JSON.parse(cachedMetaRaw);
            const cachedSuppliers = JSON.parse(cachedSuppliersRaw);
            const isCacheValid = cachedMeta.page === currentPage && cachedMeta.perPage === itemsPerPage && JSON.stringify(cachedMeta.search) === JSON.stringify(defaultFilters.search);

            if (isCacheValid) {
                setCreditNote(cachedSuppliers);
                setTotalPages(cachedMeta.totalPages);
                setLoading(false);
                localStorage.setItem(`${tabId}-loading-cr-list`, JSON.stringify(false));
                return;
            }
        } catch (err) {
            console.warn("Failed to parse cached meta:", err);
        }

        fetchCreditNote(currentPage, itemsPerPage, defaultFilters);
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

    const fetchCreditNote = async (page = currentPage, perPage = itemsPerPage, filters: FilterParams = { search: "" }) => {
        try {
            if (loading) {
                setLoading(true);
            }
            localStorage.setItem(`${tabId}-loading-cr-list`, JSON.stringify(true));
            const paginatedData = await supplierCreditNoteService.getAllSupplierCreditNote(page, perPage, filters);
            setCreditNote(paginatedData.data);
            setTotalPages(paginatedData.last_page);
            setCRFooter2(paginatedData.footer2);
            localStorage.setItem(`${tabId}-cached-cr-list`, JSON.stringify(paginatedData.data));
            localStorage.setItem(
                `${tabId}-cached-meta-cr-list`,
                JSON.stringify({
                    page,
                    perPage,
                    filters,
                    totalPages: paginatedData.last_page,
                    totalItems: paginatedData.total,
                })
            );
        } catch (err) {
            console.error("Error fetching invoice:", err);
        } finally {
            setLoading(false);
            localStorage.setItem(`${tabId}-loading-cr-list`, JSON.stringify(false));
        }
    };
    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            onSelectedCRChange(creditNoteList.map((p) => p.id).filter(Boolean) as number[]);
        } else {
            onSelectedCRChange([]);
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
            supplier_codes: formData.sort_by === "Code" ? formData.customerCodes.map((c) => c.value) : [],
            date_from: formData.date_from,
            date_to: formData.date_to,
            category_dates: formData.category_dates,
        };
        fetchCreditNote(1, itemsPerPage, filters);
    };
    const handleReset = () => {
        setFormData({
            ...formData,
            date_from: null,
            date_to: null,
            category_dates: "Date",
            sort_by: "Code",
            customerCodes: [],
        });
        setLoading(true);
        setActiveAdvanceSearch(false);
        setShowDropdown(false);
        setSearchTerm("");
        setCurrentPage(1);
        setItemsPerPage(15);
        fetchCreditNote(1, 15, {
            search: "",
            supplier_codes: [],
            date_from: null,
            date_to: null,
            category_dates: "Date",
        });
    };
    const handleSelectInv = (id: number, checked: boolean) => {
        const updated = checked ? [...selectedCR, id] : selectedCR.filter((pid) => pid !== id);

        onSelectedCRChange(updated);
    };
    const handleVoidSelected = async () => {
        if (selectedCR.length === 0) {
            showErrorToast(translations["Please click checkbox to select row"]);
            return;
        }
        const selectedRVMaster = creditNoteList.filter((item) => selectedCR.includes(item.id));
        const data = new FormData();
        selectedRVMaster.forEach((list: any) => {
            if (list) {
                data.append("details[]", JSON.stringify({ cr_number: list.cr_number }));
            }
        });
        const confirmed = await showConfirm(translations["Void Record(s)"], translations["alert_message_38"], translations["Yes"], translations["Cancel"]);
        if (!confirmed) return;
        try {
            const result = await supplierCreditNoteService.voidSupplierCreditNote(data);
            if (result.token === "Error") {
                showErrorToast(result.message);
                return;
            }
            const defaultFilters = {
                search: searchTerm,
                supplier_codes: formData.sort_by === "Code" ? formData.customerCodes.map((c) => c.value) : [],
                date_from: formData.date_from,
                date_to: formData.date_to,
                category_dates: formData.category_dates,
            };
            onSelectedCRChange([]);
            showSuccessToast(translations[result.message]);
            fetchCreditNote(currentPage, itemsPerPage, defaultFilters);
        } catch (error) {}
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
            supplier_codes: formData.sort_by === "Code" ? formData.customerCodes.map((c) => c.value) : [],
            date_from: formData.date_from,
            date_to: formData.date_to,
            category_dates: formData.category_dates,
        };
        fetchCreditNote(1, itemsPerPage, filters);
    };
    const handleRowClick = (e: React.MouseEvent, creditNoteId: number) => {
        // Prevent navigation if clicking on checkboxes or toggle switches
        const target = e.target as HTMLElement;
        if (target.closest("input") || target.closest("label") || target.closest("[data-copy-button]")) {
            return;
        }
        onSupplierCreditNoteSelect(creditNoteId, creditNoteId == 0 ? "new" : "edit");
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
        const isExpanded = expanded_CR.includes(tableId);
        const expandedKey = tabId + "_expandedKey";

        if (isExpanded) {
            // Collapse row
            const updated = expanded_CR.filter((id) => id !== tableId);
            setExpandedRows(updated);
            localStorage.setItem(expandedKey, JSON.stringify(updated));
        } else {
            // Expand row
            const updated = [...expanded_CR, tableId];
            setExpandedRows(updated);
            localStorage.setItem(expandedKey, JSON.stringify(updated));
            try {
                const data = creditNoteList.find((po) => po.id === tableId);
                // Save to state
                if (!data?.details) {
                    setCRDetailsMap((prev) => ({ ...prev, [tableId]: null }));
                    return;
                }
                const details: DetailsRow[] = data.details;
                setCRDetailsMap((prev) => ({ ...prev, [tableId]: details }));
            } catch (error) {
                setCRDetailsMap((prev) => ({ ...prev, [tableId]: null }));
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
                                    disabled={selectedCR.length === 0}
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
                                    <th className="w-[3%] text-center py-2 px-2 text-gray-400 text-sm"></th>
                                    <th className="w-[3%] text-center py-2 px-2 text-gray-400 text-sm">
                                        <div className="flex justify-center items-center">
                                            <CustomCheckbox checked={selectedCR.length === creditNoteList.length && creditNoteList.length > 0} onChange={(checked) => handleSelectAll(checked)} />
                                        </div>
                                    </th>
                                    <th className="w-[25%] text-left py-2 px-2 text-gray-400 text-sm">{translations["Supplier"]}</th>
                                    <th className="w-[15%] text-left py-2 px-2 text-gray-400 text-sm">{translations["CR No"]}</th>
                                    <th className="w-[12%] text-left py-2 px-2 text-gray-400 text-sm">{translations["CR Date"]}</th>
                                    <th className="w-[10%] text-center py-2 px-2 text-gray-400 text-sm">{translations["Ex Rate"]}</th>
                                    <th className="w-[10%] text-center py-2 px-2 text-gray-400 text-sm">{translations["Amount"]}</th>
                                    <th className="w-[10%] text-center py-2 px-2 text-gray-400 text-sm">{translations["Default Currency"]}</th>
                                    <th className="w-[12%] text-center py-2 px-2 text-gray-400 text-sm">{translations["Status"]}</th>
                                </tr>
                            </thead>
                            {loading ? (
                                <LoadingSpinnerTbody rowsCount={itemsPerPage} />
                            ) : (
                                <tbody>
                                    {creditNoteList.length === 0 ? (
                                        <tr>
                                            <td colSpan={15} className="py-4 px-4 text-center text-gray-400 text-sm border border-[#40404042]">
                                                {translations["No Record Found"] || "No Record Found"}
                                            </td>
                                        </tr>
                                    ) : (
                                        creditNoteList.map((list, index) => (
                                            <React.Fragment key={list.id || index}>
                                                <tr
                                                    key={list.id || index}
                                                    onClick={(e) => handleRowClick(e, list.id)}
                                                    className={`clickable border-b hover:bg-gray-700 hover:bg-opacity-30 transition-colors cursor-pointer ${
                                                        selectedCR.includes(list.id as number) ? "bg-gray-700 bg-opacity-30" : ""
                                                    }`}
                                                    style={{ borderColor: "#40404042" }}
                                                >
                                                    <td className="py-2 px-2 text-gray-400 text-center text-custom-sm" onClick={(e) => e.stopPropagation()}>
                                                        <button
                                                            onClick={() => handleToggleRow(list.id)}
                                                            className={`px-1 py-1 ${
                                                                expanded_CR.includes(list.id) ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"
                                                            } text-white rounded-lg transition-colors text-xs`}
                                                        >
                                                            {expanded_CR.includes(list.id) ? <Minus size={16} /> : <Plus size={16} />}
                                                        </button>
                                                    </td>
                                                    <td className="py-2 px-2 text-gray-400 text-center text-custom-sm" onClick={(e) => e.stopPropagation()}>
                                                        <CustomCheckbox
                                                            disabled={list.invoice_status_id === 8 || list.invoice_status_id === 5}
                                                            checked={selectedCR.includes(list.id as number)}
                                                            onChange={(checked) => handleSelectInv(list.id as number, checked)}
                                                        />
                                                    </td>
                                                    <td className="py-2 px-2">
                                                        <div className="flex items-center space-x-3">
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
                                                        </div>
                                                    </td>
                                                    <td className="py-2 px-2 text-gray-400 text-left text-custom-sm">
                                                        <div className="group flex items-center">
                                                            <p className="text-gray-400 text-custom-sm">{highlightMatch(list.cr_number, searchTerm)}</p>
                                                            <CopyToClipboard text={list.cr_number ?? ""} />
                                                        </div>
                                                    </td>
                                                    <td className="py-2 px-2 text-gray-400 text-left text-custom-sm">{formatDate(list.cr_date, lang)}</td>

                                                    <td className="py-2 px-2 text-gray-400 text-center text-custom-sm">{list.ex_rate?.toFixed(4)}</td>
                                                    <td className="py-2 px-2 text-gray-400 text-center text-custom-sm">
                                                        {list.currency}
                                                        <br></br>
                                                        {formatMoney(list.amount)}
                                                    </td>
                                                    <td className="py-2 px-2 text-gray-400 text-center text-custom-sm">
                                                        {baseCurrency()}
                                                        <br></br>
                                                        {formatMoney(list.base_amount)}
                                                    </td>
                                                    <td className="py-2 px-2 text-gray-400 text-center text-custom-sm">
                                                        <span className={`px-2 py-1 rounded-full text-xs text-custom-sm ${getStatusColor(list.cr_status_id)}`}>
                                                            {lang === "en" ? list.status_value_en : list.status_value_cn}
                                                        </span>
                                                    </td>
                                                </tr>
                                                {expanded_CR.includes(list.id) && (
                                                    <React.Fragment key={`${list.id}-pv`}>
                                                        <tr>
                                                            <td colSpan={15} className="py-0 px-4 pt-2">
                                                                <table className="w-full" style={{ backgroundColor: "#060818" }}>
                                                                    <thead className="sticky top-0 z-[1] py-1 px-4" style={{ backgroundColor: "#1f2132" }}>
                                                                        <tr className="border-b" style={{ borderColor: "#2d2d30" }}>
                                                                            <th className="w-auto text-left py-2 px-4 text-gray-400 text-sm w-12 border border-[#40404042]">
                                                                                {translations["Account Code"]}
                                                                            </th>
                                                                            <th className="w-auto text-left py-2 px-4 text-gray-400 text-sm w-12 border border-[#40404042]">
                                                                                {translations["Description"]}
                                                                            </th>
                                                                            <th className="w-auto text-left py-2 px-4 text-gray-400 text-sm w-12 border border-[#40404042]">
                                                                                {translations["Particulars"]}
                                                                            </th>
                                                                            <th className="w-auto text-center py-2 px-4 text-gray-400 text-sm w-12 border border-[#40404042]">
                                                                                {translations["Ex Rate"]}
                                                                            </th>
                                                                            <th className="w-auto text-center py-2 px-4 text-gray-400 text-sm w-12 border border-[#40404042]">
                                                                                {translations["Amount"]}
                                                                            </th>
                                                                            <th className="w-auto text-center py-2 px-4 text-gray-400 text-sm w-12 border border-[#40404042]">
                                                                                {translations["Default Currency"]}
                                                                            </th>
                                                                        </tr>
                                                                    </thead>
                                                                    <tbody>
                                                                        {crDetailMap[list.id] && crDetailMap[list.id]!.length > 0 ? (
                                                                            crDetailMap[list.id]!.map((detail, i) => (
                                                                                <tr key={detail.id || i}>
                                                                                    <td className="py-3 px-4 text-gray-400 text-left text-custom-sm">
                                                                                        <div className="group flex items-center">
                                                                                            <p className="text-gray-400 text-custom-sm">
                                                                                                {detail.account_code
                                                                                                    ? highlightMatch(detail.account_code, searchTerm)
                                                                                                    : translations["Deleted"] || "Deleted"}
                                                                                            </p>
                                                                                            <CopyToClipboard text={detail.account_code ? detail.account_code : ""} />
                                                                                        </div>
                                                                                    </td>
                                                                                    <td className="py-3 px-4 text-gray-400 text-left text-custom-sm">
                                                                                        {highlightMatch(lang === "en" ? detail.account_name_en : detail.account_name_cn, searchTerm)}
                                                                                    </td>
                                                                                    <td className="py-3 px-4 text-gray-400 text-left text-custom-sm">
                                                                                        {list.product_title_en === "" ? (
                                                                                            highlightMatch(detail.particulars, searchTerm)
                                                                                        ) : (
                                                                                            <>
                                                                                                {highlightMatch(detail.product_code, searchTerm)}{" "}
                                                                                                {highlightMatch(lang === "en" ? detail.product_title_en : detail.product_title_cn, searchTerm)}
                                                                                            </>
                                                                                        )}
                                                                                    </td>

                                                                                    <td className="py-3 px-4 text-gray-400 text-center text-custom-sm">{detail.ex_rate.toFixed(4)}</td>
                                                                                    <td className="py-3 px-4 text-gray-400 text-center text-custom-sm">
                                                                                        {detail.currency} {formatMoney(detail.amount)}
                                                                                    </td>
                                                                                    <td className="py-3 px-4 text-gray-400 text-center text-custom-sm">
                                                                                        {baseCurrency()} {formatMoney(detail.base_amount)}
                                                                                    </td>
                                                                                </tr>
                                                                            ))
                                                                        ) : (
                                                                            <tr>
                                                                                <td colSpan={9} className="py-3 px-4 text-center text-gray-400 text-sm">
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

export default ReceiveVoucherList;
