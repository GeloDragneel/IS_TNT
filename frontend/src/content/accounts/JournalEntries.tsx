import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { reportsService, ApiReports, DetailsExpanded, FilterParams } from "@/services/reportsService";
import { useLanguage } from "@/context/LanguageContext";
import Pagination from "@/components/Pagination";
import ItemsPerPageSelector from "@/components/ItemsPerPageSelector";
import CopyToClipboard from "@/components/CopyToClipboard";
import { Minus, Plus, X, ChevronDown } from "lucide-react";
import PusherEcho from "@/utils/echo";
import Flatpickr from "react-flatpickr";
import { getFlatpickrLocale } from "@/utils/flatpickrLocale";
import Select from "react-select";
import { fetchAllCustomer, OptionType } from "@/utils/fetchDropdownData";
import { baseCurrency, formatDate, formatMoney, DropdownData, selectStyles } from "@/utils/globalFunction";
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
}
interface MasterFooter {
    currency: string;
    total: number;
}
type FormDataType = {
    sort_by: string;
    customer_id: number;
    customer_code: string;
    category_dates: string;
    date_from: Date | null; // Allow null here
    date_to: Date | null; // Allow null here
    customerCodes: OptionType[];
};
// localStorage.clear();
const UnpaidItemReceived: React.FC<UnpaidItemReceivedProps> = ({ tabId }) => {
    const { translations, lang } = useLanguage();
    const [journalEntriesList, setJournalEntriesList] = useState<ApiReports[]>([]);
    const [totalPages, setTotalPages] = useState(1);
    const locale = getFlatpickrLocale(translations);
    const pageSizeOptions = useMemo(() => [15, 20, 50, -1], []);
    const [expanded_Transaction, setExpandedRows] = useState<number[]>([]);
    const [allCustomer, setAllCustomer] = useState<DropdownData[]>([]);
    const [journalEntriesDetailsMap, setJournalEntriesDetailsMap] = useState<Record<number, DetailsExpanded[] | null>>({});
    const inputRef = useRef<HTMLInputElement>(null);
    const [showDropdown, setShowDropdown] = useState(false);
    const [showDateRange, setShowDateRange] = useState(false);
    const [activeAdvanceSearch, setActiveAdvanceSearch] = useState(false);
    const throttleTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
    const [showAdvanceSearch, setShowAdvanceSearch] = useState(false);
    const [masterFooter, setMasterFooter] = useState<MasterFooter[]>([]); // Changed to array
    const [loading, setLoading] = useState(() => {
        const savedLoading = localStorage.getItem(`${tabId}-loading-journalEntries`);
        return savedLoading !== null ? JSON.parse(savedLoading) : true;
    });
    const [currentPage, setCurrentPage] = useState(() => {
        const metaKey = `${tabId}-cached-meta-journalEntries`;
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
        const metaKey = `${tabId}-cached-meta-journalEntries`;
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
        const cached = localStorage.getItem(`${tabId}-cached-meta-journalEntries`);
        if (!cached) return "";
        try {
            const meta = JSON.parse(cached);
            return meta.filters.search || "";
        } catch {
            return "";
        }
    });
    const [formData, setFormData] = useState<FormDataType>({
        sort_by: "Code",
        customer_id: 0,
        customer_code: "",
        category_dates: "Date",
        customerCodes: [],
        date_from: null as Date | null,
        date_to: null as Date | null,
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
    // REALTIME
    useEffect(() => {
        const channel_PO = PusherEcho.channel("po-channel");
        const channel_AP = PusherEcho.channel("ap-channel");
        const channel_GRN = PusherEcho.channel("grn-channel");

        const defaultFilters = {
            search: searchTerm,
            customer_codes: formData.sort_by === "Code" ? formData.customerCodes.map((c) => c.value) : [],
            date_from: formData.date_from,
            date_to: formData.date_to,
            category_dates: formData.category_dates,
        };

        channel_PO.listen(".po-event", () => {
            fetchJournalEntries(currentPage, itemsPerPage, defaultFilters);
        });
        channel_AP.listen(".ap-event", () => {
            fetchJournalEntries(currentPage, itemsPerPage, defaultFilters);
        });
        channel_GRN.listen(".grn-event", () => {
            fetchJournalEntries(currentPage, itemsPerPage, defaultFilters);
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
                const data = journalEntriesList.find((po) => po.id === tableId);
                // Save to state
                if (!data?.details) {
                    setJournalEntriesDetailsMap((prev) => ({ ...prev, [tableId]: null }));
                    return;
                }
                const details: DetailsExpanded[] = data.details;
                setJournalEntriesDetailsMap((prev) => ({ ...prev, [tableId]: details }));
            });
            setExpandedRows(checkedIds);
        }
    }, [tabId, journalEntriesList]);
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
    // ON LOAD LIST
    useEffect(() => {
        const SupplierKey = `${tabId}-cached-journalEntries`;
        const metaKey = `${tabId}-cached-meta-journalEntries`;
        const mountKey = `${tabId}-mount-status-unpaid`;

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
            fetchJournalEntries(currentPage, itemsPerPage, defaultFilters);
            return;
        }

        const cachedSuppliersRaw = localStorage.getItem(SupplierKey);
        const cachedMetaRaw = localStorage.getItem(metaKey);

        if (!cachedSuppliersRaw || !cachedMetaRaw) {
            fetchJournalEntries(currentPage, itemsPerPage, defaultFilters);
            return;
        }

        try {
            const cachedMeta = JSON.parse(cachedMetaRaw);
            const cachedSuppliers = JSON.parse(cachedSuppliersRaw);

            const isCacheValid = cachedMeta.page === currentPage && cachedMeta.perPage === itemsPerPage && JSON.stringify(cachedMeta.search) === JSON.stringify(defaultFilters.search);

            if (isCacheValid) {
                setJournalEntriesList(cachedSuppliers);
                setTotalPages(cachedMeta.totalPages);
                setLoading(false);
                localStorage.setItem(`${tabId}-loading-journalEntries`, JSON.stringify(false));
                return;
            }
        } catch (err) {
            console.warn("Failed to parse cached meta:", err);
        }

        fetchJournalEntries(currentPage, itemsPerPage, defaultFilters);
    }, [currentPage, itemsPerPage, searchTerm, tabId]);
    const fetchJournalEntries = async (page = currentPage, perPage = itemsPerPage, filters: FilterParams = { search: "" }) => {
        try {
            if (loading) {
                setLoading(true);
            }
            localStorage.setItem(`${tabId}-loading-journalEntries`, JSON.stringify(true));
            const paginatedData = await reportsService.getJournalEntries(page, perPage, filters);
            setJournalEntriesList(paginatedData.data);
            setTotalPages(paginatedData.last_page);
            setMasterFooter(paginatedData.footer2);
            localStorage.setItem(`${tabId}-cached-journalEntries`, JSON.stringify(paginatedData.data));
            localStorage.setItem(
                `${tabId}-cached-meta-journalEntries`,
                JSON.stringify({
                    page,
                    perPage,
                    filters,
                    totalPages: paginatedData.last_page,
                    totalItems: paginatedData.total,
                })
            );
        } catch (err) {
            console.error("Error fetching list:", err);
        } finally {
            setLoading(false);
            localStorage.setItem(`${tabId}-loading-journalEntries`, JSON.stringify(false));
        }
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
        const isExpanded = expanded_Transaction.includes(tableId);
        const cachedKey = `cached-journalEntries-details-${tableId}`;
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
                const data = journalEntriesList.find((po) => po.id === tableId);
                if (!data?.details) {
                    setJournalEntriesDetailsMap((prev) => ({ ...prev, [tableId]: null }));
                    return;
                }
                const details: DetailsExpanded[] = data.details;
                setJournalEntriesDetailsMap((prev) => ({ ...prev, [tableId]: details }));
                localStorage.setItem(cachedKey, JSON.stringify(details));
            } catch (error) {
                setJournalEntriesDetailsMap((prev) => ({ ...prev, [tableId]: null }));
            }
        }
    };
    const handleDateFrom = useCallback((dates: Date[]) => {
        setFormData((prev) => ({ ...prev, date_from: dates[0] ?? null }));
    }, []);
    const handleDateTo = useCallback((dates: Date[]) => {
        setFormData((prev) => ({ ...prev, date_to: dates[0] ?? null }));
    }, []);
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
        fetchJournalEntries(1, itemsPerPage, filters);
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
        fetchJournalEntries(1, itemsPerPage, filters);
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
        fetchJournalEntries(1, 15, {
            search: "",
            customer_codes: [],
            date_from: null,
            date_to: null,
            category_dates: "Date",
        });
    };
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
                    </div>
                </div>
                {/* Table */}
                <div className="overflow-x-auto flex-grow">
                    <div className="h-[calc(100vh-215px)] overflow-y-auto">
                        <table className="w-full">
                            <thead className="sticky top-0 z-[1]" style={{ backgroundColor: "#1f2132" }}>
                                <tr className="border-b" style={{ borderColor: "#2d2d30" }}>
                                    <th className="w-[5%] text-center py-1 px-4 text-gray-400 text-sm w-12"></th>
                                    <th className="w-[12%] text-left py-2 px-2 text-gray-400 text-sm">{translations["Transaction Date"]}</th>
                                    <th className="w-[16%] text-left py-2 px-2 text-gray-400 text-sm">{translations["Customer Code"]}</th>
                                    <th className="w-[14%] text-left py-2 px-2 text-gray-400 text-sm">{translations["Customer Name"]}</th>
                                    <th className="w-[12%] text-left py-2 px-2 text-gray-400 text-sm">{translations["JVNo"]}</th>
                                    <th className="w-[11%] text-center py-2 px-2 text-gray-400 text-sm">{translations["Ex Rate"]}</th>
                                    <th className="w-[15%] text-center py-2 px-2 text-gray-400 text-sm">{translations["Amount"]}</th>
                                    <th className="w-[14%] text-center py-2 px-2 text-gray-400 text-sm">{translations["Base Currency"]}</th>
                                </tr>
                            </thead>
                            {loading ? (
                                <LoadingSpinnerTbody rowsCount={itemsPerPage} />
                            ) : (
                                <tbody>
                                    {journalEntriesList.map((list, index) => (
                                        <React.Fragment key={list.id || index}>
                                            <tr key={list.id || index} className={`border-b hover:bg-gray-700 hover:bg-opacity-30 transition-colors`} style={{ borderColor: "#40404042" }}>
                                                <td className="py-2 px-2 text-gray-400 text-center text-custom-sm">
                                                    <button
                                                        onClick={() => handleToggleRow(list.id)}
                                                        className={`px-1 py-1 ${
                                                            expanded_Transaction.includes(list.id) ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"
                                                        } text-white rounded-lg transition-colors text-xs`}
                                                    >
                                                        {expanded_Transaction.includes(list.id) ? <Minus size={16} /> : <Plus size={16} />}
                                                    </button>
                                                </td>
                                                <td className="py-2 px-2 text-gray-400 text-left text-custom-sm">
                                                    <div className="group flex items-center">
                                                        <p className="text-gray-400 text-custom-sm">{formatDate(list.transaction_date, lang) || translations["N.A."]}</p>
                                                    </div>
                                                </td>
                                                <td className="py-2 px-2 text-gray-400 text-left text-custom-sm">
                                                    <div className="group flex items-center">
                                                        <p className="text-gray-400 text-custom-sm">{highlightMatch(list.customer_code, searchTerm)}</p>
                                                        <CopyToClipboard text={list.customer_code} />
                                                    </div>
                                                </td>
                                                <td className="py-2 px-2 text-gray-400 text-left text-custom-sm">{lang === "en" ? list.account_name_en : list.account_name_cn}</td>
                                                <td className="py-2 px-2 text-gray-400 text-left text-custom-sm">
                                                    <div className="group flex items-center">
                                                        <p className="text-gray-400 text-custom-sm">{list.jv_no}</p>
                                                        <CopyToClipboard text={list.jv_no ?? ""} />
                                                    </div>
                                                </td>
                                                <td className="py-2 px-2 text-gray-400 text-center text-custom-sm">{list.ex_rate}</td>
                                                <td className="py-2 px-2 text-gray-400 text-center text-custom-sm">
                                                    {list.currency} <br></br> {formatMoney(list.amount)}
                                                </td>
                                                <td className="py-2 px-2 text-gray-400 text-center text-custom-sm">
                                                    {baseCurrency()} <br></br> {formatMoney(list.base_amount)}
                                                </td>
                                            </tr>
                                            {expanded_Transaction.includes(list.id) && (
                                                <tr>
                                                    <td colSpan={8} className="py-2 px-2">
                                                        <table className="w-full" style={{ backgroundColor: "#060818" }}>
                                                            <thead className="sticky top-0 z-[1] py-1 px-4" style={{ backgroundColor: "#1f2132" }}>
                                                                <tr className="border-b" style={{ borderColor: "#2d2d30" }}>
                                                                    <th className="w-auto text-left py-2 px-2 text-gray-400 text-sm w-12">{translations["Account Code"]}</th>
                                                                    <th className="w-auto text-left py-2 px-2 text-gray-400 text-sm w-12">{translations["Account Name"]}</th>
                                                                    <th className="w-auto text-center py-2 px-2 text-gray-400 text-sm w-12">{translations["Ex Rate"]}</th>
                                                                    <th className="w-auto text-center py-2 px-2 text-gray-400 text-sm w-12">{translations["Amount"]}</th>
                                                                    <th className="w-auto text-center py-2 px-2 text-gray-400 text-sm w-12">{translations["Debit"]}</th>
                                                                    <th className="w-auto text-center py-2 px-2 text-gray-400 text-sm w-12">{translations["Credit"]}</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {journalEntriesDetailsMap[list.id] && journalEntriesDetailsMap[list.id]!.length > 0 ? (
                                                                    journalEntriesDetailsMap[list.id]!.map((detail, i) => (
                                                                        <tr key={detail.id || i}>
                                                                            <td className="py-2 px-2 text-gray-400 text-left text-custom-sm">
                                                                                <div className="group flex items-center">
                                                                                    <p className="text-gray-400 text-custom-sm">{highlightMatch(detail.account_code, searchTerm)}</p>
                                                                                    <CopyToClipboard text={detail.account_code} />
                                                                                </div>
                                                                            </td>
                                                                            <td className="py-2 px-2 text-gray-400 text-left text-custom-sm">
                                                                                <p className="text-gray-400 text-custom-sm">
                                                                                    {highlightMatch(lang === "en" ? detail.account_name_en : detail.account_name_cn, searchTerm)}
                                                                                </p>
                                                                            </td>
                                                                            <td className="py-2 px-2 text-gray-400 text-center text-custom-sm">{detail.ex_rate}</td>
                                                                            <td className="py-2 px-2 text-gray-400 text-center text-custom-sm">
                                                                                {detail.currency} {formatMoney(detail.amount)}
                                                                            </td>
                                                                            <td className="py-2 px-2 text-gray-400 text-center text-custom-sm">
                                                                                {baseCurrency()} {formatMoney(detail.debit)}
                                                                            </td>
                                                                            <td className="py-2 px-2 text-gray-400 text-center text-custom-sm">
                                                                                {baseCurrency()} {formatMoney(detail.credit)}
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
            {renderDateRange()}
            {renderAdvanceSearch()}
        </div>
    );
};

export default UnpaidItemReceived;
