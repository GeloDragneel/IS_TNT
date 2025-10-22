import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { invoiceService, ApiCustomerInvoice, DetailsRow, FilterParams } from "@/services/customerInvoiceService";
import { useLanguage } from "@/context/LanguageContext";
import CustomCheckbox from "@/components/CustomCheckbox";
import { showConfirm } from "@/utils/alert";
import { showSuccessToast, showErrorToast } from "@/utils/toast";
import Pagination from "@/components/Pagination";
import ItemsPerPageSelector from "@/components/ItemsPerPageSelector";
import CopyToClipboard from "@/components/CopyToClipboard";
import { X, Minus, Plus, ChevronDown, Search } from "lucide-react";
import PusherEcho from "@/utils/echo";
import Select from "react-select";
import Flatpickr from "react-flatpickr";
import { getFlatpickrLocale, formatDateToCustom } from "@/utils/flatpickrLocale";
import { fetchAllCustomer, fetchBank, OptionType } from "@/utils/fetchDropdownData";
import { baseCurrency, DropdownData, formatMoney, selectStyles } from "@/utils/globalFunction";
import { highlightMatch } from "@/utils/highlightMatch";
import { NumericFormat } from "react-number-format";
import { ExportReportSelector } from "@/utils/ExportReportSelector";
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
    onCustomerInvoiceSelect: (supplierId: number, saveType?: string) => void;
    onChangeView: (view: "list" | "details") => void;
    selectedInv: number[];
    onSelectedInvChange: (selected: number[]) => void;
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
const SalesOrderList: React.FC<SalesOrderListProps> = ({ tabId, onCustomerInvoiceSelect, selectedInv, onSelectedInvChange }) => {
    const { translations, lang } = useLanguage();
    const [customerInvoiceList, setCustomerInvoices] = useState<ApiCustomerInvoice[]>([]);
    const [totalPages, setTotalPages] = useState(1);
    const locale = getFlatpickrLocale(translations);
    const pageSizeOptions = useMemo(() => [15, 20, 50, -1], []);
    const [expanded_Inv, setExpandedRows] = useState<number[]>([]);
    const [selectedForJV, setSelectedForJV] = useState<ApiCustomerInvoice[]>([]);
    const [selectedForJVFooter, setSelectedForJVFooter] = useState<ApiCustomerInvoice[]>([]);
    const [selectedItems, setSelectedItems] = useState<ApiCustomerInvoice[]>([]);
    const [selectedItemsFooter, setSelectedItemsFooter] = useState<ApiCustomerInvoice[]>([]);
    const [soDetailMap, setPODetailsMap] = useState<Record<number, DetailsRow[] | null>>({});
    const [soDetailMapRV, setPODetailsMapRV] = useState<Record<number, DetailsRow[] | null>>({});
    const [activeAdvanceSearch, setActiveAdvanceSearch] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const [showDateRange, setShowDateRange] = useState(false);
    const [showAdvanceSearch, setShowAdvanceSearch] = useState(false);
    const [allCustomer, setAllCustomer] = useState<DropdownData[]>([]);
    const [creditsPopup, setShowCreditsPopup] = useState(false);
    const [showCreateRV, setShowCreateRV] = useState(false);
    const [showCreateJV, setShowCreateJV] = useState(false);
    const throttleTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
    const [preorderFooter2, setPreorderFooter2] = useState<POFooter[]>([]); // Changed to array
    const [loadCancelOrder_CTOCUST, setLoadCancelOrder_CTOCUST] = useState(false);
    const [loadCancelOrder_NRTOMI, setLoadCancelOrder_NRTOMI] = useState(false);
    const [loadCancelOrder_RPTOC, setLoadCancelOrder_RPTOC] = useState(false);
    const [loadCancelOrder_PRTCNL, setLoadCancelOrder_PRTCNL] = useState(false);
    const [loadingSave, setLoadingSave] = useState(false);
    const [banksData, setBanksData] = useState<DropdownData[]>([]);
    const [cancelOrder, setShowCancelOrder] = useState(false);
    const [multipleRV, showMultipleRV] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const exportRef = useRef<{ triggerExport: () => void }>(null);
    const [loading, setLoading] = useState(() => {
        const savedLoading = localStorage.getItem(`${tabId}-loading-custinv-list`);
        return savedLoading !== null ? JSON.parse(savedLoading) : true;
    });
    const [formData, setFormData] = useState<FormDataType>({
        sort_by: "Code",
        customer_id: 0,
        customer_code: "",
        category_dates: "InvoiceDate",
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
        const metaKey = `${tabId}-cached-meta-custinv-list`;
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
        const metaKey = `${tabId}-cached-meta-custinv-list`;
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
        const cached = localStorage.getItem(`${tabId}-cached-meta-custinv-list`);
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
                const data = customerInvoiceList.find((po) => po.id === tableId);
                // Save to state
                if (!data?.details) {
                    setPODetailsMap((prev) => ({ ...prev, [tableId]: null }));
                    return;
                }
                if (!data?.detailsRV) {
                    setPODetailsMapRV((prev) => ({ ...prev, [tableId]: null }));
                    return;
                }
                const details: DetailsRow[] = data.details;
                const detailsRV: DetailsRow[] = data.detailsRV;
                setPODetailsMap((prev) => ({ ...prev, [tableId]: details }));
                setPODetailsMapRV((prev) => ({ ...prev, [tableId]: detailsRV }));
            });
            setExpandedRows(checkedIds);
        }
    }, [tabId, customerInvoiceList]);

    useEffect(() => {
        let newFooterArray: any = [];
        let total_balance_to_pay = 0;
        let total_new_balance = 0;
        let total_currency = "";
        selectedItems.forEach((element) => {
            total_balance_to_pay += element.balance_to_pay;
            total_new_balance += element.new_balance;
            total_currency = String(element.currency);
        });
        newFooterArray.push({
            balance_to_pay: total_balance_to_pay,
            new_balance: total_new_balance,
            currency: total_currency,
        });
        setSelectedItemsFooter(newFooterArray);
        setFormData((prev) => ({ ...prev, received_amount: total_new_balance }));
    }, [selectedItems]);

    useEffect(() => {
        let newFooterArray: any = [];
        let balance_to_pay = 0;
        selectedForJV.forEach((element) => {
            balance_to_pay += Number(element.balance_to_pay);
        });
        newFooterArray.push({
            balance_to_pay: balance_to_pay,
        });

        const grouped: any = {};

        selectedForJV.forEach((item) => {
            const invoiceId = item.invoice_id;
            const invoice_no = item.invoice_no;
            const orig_to_pay = item.orig_to_pay;
            if (!grouped[invoiceId]) {
                grouped[invoiceId] = {
                    invoice_id: invoiceId,
                    invoice_no: invoice_no,
                    orig_to_pay: orig_to_pay,
                    total_balance_to_pay: 0,
                };
            }
            grouped[invoiceId].total_balance_to_pay += Number(item.balance_to_pay) || 0;
        });

        // If you want the result as an array:
        const result = Object.values(grouped);

        result.forEach((item: any) => {
            if (item.total_balance_to_pay > item.orig_to_pay) {
                showErrorToast(translations["TotalIssueAmount"] + " in " + item.invoice_no + " is " + item.orig_to_pay);
                return;
            }
        });

        setSelectedForJVFooter(newFooterArray);
        setFormData((prev) => ({ ...prev, received_amount: balance_to_pay }));
        // console.log(selectedForJV);
    }, [selectedForJV]);

    useEffect(() => {
        const channel = PusherEcho.channel("cust-invoice-channel");
        channel.listen(".cust-invoice-event", () => {
            const defaultFilters = {
                search: searchTerm,
                customer_codes: formData.sort_by === "Code" ? formData.customerCodes.map((c) => c.value) : [],
                date_from: formData.date_from,
                date_to: formData.date_to,
                category_dates: formData.category_dates,
            };
            localStorage.removeItem(`${tabId}-cached-inv-list`);
            setTimeout(() => {
                fetchInvoices(currentPage, itemsPerPage, defaultFilters);
            }, 500);
        });
        return () => {
            PusherEcho.leave("cust-invoice-channel");
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
                loadBanks();
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
        const SupplierKey = `${tabId}-cached-inv-list`;
        const metaKey = `${tabId}-cached-meta-custinv-list`;
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
            fetchInvoices(currentPage, itemsPerPage, defaultFilters);
            return;
        }
        const cachedSuppliersRaw = localStorage.getItem(SupplierKey);
        const cachedMetaRaw = localStorage.getItem(metaKey);

        if (!cachedSuppliersRaw || !cachedMetaRaw) {
            fetchInvoices(currentPage, itemsPerPage, defaultFilters);
            return;
        }

        try {
            const cachedMeta = JSON.parse(cachedMetaRaw);
            const cachedSuppliers = JSON.parse(cachedSuppliersRaw);
            const isCacheValid = cachedMeta.page === currentPage && cachedMeta.perPage === itemsPerPage && JSON.stringify(cachedMeta.search) === JSON.stringify(defaultFilters.search);

            if (isCacheValid) {
                setCustomerInvoices(cachedSuppliers);
                setTotalPages(cachedMeta.totalPages);
                setLoading(false);
                localStorage.setItem(`${tabId}-loading-custinv-list`, JSON.stringify(false));
                return;
            }
        } catch (err) {
            console.warn("Failed to parse cached meta:", err);
        }

        fetchInvoices(currentPage, itemsPerPage, defaultFilters);
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

    const fetchInvoices = async (page = currentPage, perPage = itemsPerPage, filters: FilterParams = { search: "" }) => {
        try {
            if (loading) {
                setLoading(true);
            }
            localStorage.setItem(`${tabId}-loading-custinv-list`, JSON.stringify(true));
            const paginatedData = await invoiceService.getAllInvoices(page, perPage, filters);
            setCustomerInvoices(paginatedData.data);
            setTotalPages(paginatedData.last_page);
            setPreorderFooter2(paginatedData.footer2);
            localStorage.setItem(`${tabId}-cached-inv-list`, JSON.stringify(paginatedData.data));
            localStorage.setItem(
                `${tabId}-cached-meta-custinv-list`,
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
            localStorage.setItem(`${tabId}-loading-custinv-list`, JSON.stringify(false));
        }
    };
    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            onSelectedInvChange(customerInvoiceList.map((p) => p.id).filter(Boolean) as number[]);
        } else {
            onSelectedInvChange([]);
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
            customer_codes: formData.sort_by === "Code" ? formData.customerCodes.map((c) => c.value) : [],
            date_from: formData.date_from,
            date_to: formData.date_to,
            category_dates: formData.category_dates,
        };
        fetchInvoices(1, itemsPerPage, filters);
    };
    const handleReset = () => {
        setFormData({
            ...formData,
            date_from: null,
            date_to: null,
            category_dates: "InvoiceDate",
            sort_by: "Code",
            customerCodes: [],
        });
        setLoading(true);
        setActiveAdvanceSearch(false);
        setShowDropdown(false);
        setSearchTerm("");
        setCurrentPage(1);
        setItemsPerPage(15);
        fetchInvoices(1, 15, {
            search: "",
            customer_codes: [],
            date_from: null,
            date_to: null,
            category_dates: "InvoiceDate",
        });
    };
    const handleSelectInv = (id: number, checked: boolean) => {
        const updated = checked ? [...selectedInv, id] : selectedInv.filter((pid) => pid !== id);

        onSelectedInvChange(updated);
    };
    const handleVoidSelected = async () => {
        if (selectedInv.length === 0) {
            showErrorToast(translations["Please click checkbox to select row"]);
            return;
        }
        const selectedInvMaster = customerInvoiceList.filter((item) => selectedInv.includes(item.id));
        const data = new FormData();
        let total_deposit = 0;
        selectedInvMaster.forEach((list: any) => {
            if (list) {
                data.append("details[]", JSON.stringify({ invoice_no: list.invoice_no }));
                total_deposit += list.total_deposit;
            }
        });
        if (total_deposit > 0) {
            setShowCancelOrder(true);
            return;
        }
        const confirmed = await showConfirm(translations["Void Record(s)"], translations["alert_message_38"], translations["Yes"], translations["Cancel"]);
        if (!confirmed) return;
        try {
            const result = await invoiceService.voiceCustomerInvoice(data);
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
            showSuccessToast(translations[result.message]);
            fetchInvoices(currentPage, itemsPerPage, defaultFilters);
        } catch (error) {}
    };
    const handleSaveCancelOrder = async (type: string) => {
        if (selectedInv.length === 0) {
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
        if (type === "PRTCNL") {
            setLoadCancelOrder_PRTCNL(true);
        }

        const selectedInvMaster = customerInvoiceList.filter((item) => selectedInv.includes(item.id));
        let row_arrays: any = [];
        selectedInvMaster.forEach((list: any) => {
            if (list) {
                row_arrays.push({
                    total_deposit: list.total_deposit,
                    credit_used: list.credit_used,
                    customer_id: list.customer_id,
                    invoice_no: list.invoice_no,
                    currency: list.currency,
                });
            }
        });
        try {
            const result = await invoiceService.cancelDepositPaid(row_arrays, type, "full");
            if (result.token === "Error") {
                setLoadCancelOrder_CTOCUST(false);
                setLoadCancelOrder_NRTOMI(false);
                setLoadCancelOrder_RPTOC(false);
                setLoadCancelOrder_PRTCNL(false);
                showErrorToast(result.message);
                return;
            }
            setShowCancelOrder(false);
            setLoadCancelOrder_CTOCUST(false);
            setLoadCancelOrder_NRTOMI(false);
            setLoadCancelOrder_RPTOC(false);
            setLoadCancelOrder_PRTCNL(false);
            const defaultFilters = {
                search: searchTerm,
                customer_codes: formData.sort_by === "Code" ? formData.customerCodes.map((c) => c.value) : [],
                date_from: formData.date_from,
                date_to: formData.date_to,
                category_dates: formData.category_dates,
            };
            showSuccessToast(translations[result.message]);
            fetchInvoices(currentPage, itemsPerPage, defaultFilters);
        } catch (err) {
            setLoadCancelOrder_CTOCUST(false);
            setLoadCancelOrder_NRTOMI(false);
            setLoadCancelOrder_RPTOC(false);
            setLoadCancelOrder_PRTCNL(false);
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
        fetchInvoices(1, itemsPerPage, filters);
    };
    const handleRowClick = (e: React.MouseEvent, supplierId: number) => {
        // Prevent navigation if clicking on checkboxes or toggle switches
        const target = e.target as HTMLElement;
        if (target.closest("input") || target.closest("label") || target.closest("[data-copy-button]")) {
            return;
        }
        onCustomerInvoiceSelect(supplierId, supplierId == 0 ? "new" : "edit");
    };
    const loadAllCustomer = async () => {
        try {
            const list = await fetchAllCustomer(); // fetches & returns
            setAllCustomer(list ?? []); // ✅ manually set state here
        } catch (err) {
            console.error("Failed to fetch loadAllCustomer:", err);
        }
    };
    const loadBanks = async () => {
        try {
            const list = await fetchBank(); // fetches & returns
            setBanksData(list ?? []); // ✅ manually set state here
        } catch (err) {
            console.error("Failed to fetch loadBanks:", err);
        }
    };
    const banksOptions: OptionType[] = useMemo(
        () =>
            banksData.map((list) => ({
                value: list.value.toString(),
                value2: list.value.toString(),
                label: lang === "en" ? list.en : list.cn,
                en: list.en,
                cn: list.cn,
            })),
        [banksData, lang]
    );
    const handleDateRV = useCallback((dates: Date[]) => {
        setFormData((prev) => ({ ...prev, rv_date: dates[0] ?? null }));
    }, []);
    const handleToggleRow = async (tableId: number) => {
        const isExpanded = expanded_Inv.includes(tableId);
        const cachedKey = tabId + "_cachedSODetails_" + tableId;
        const expandedKey = tabId + "_expandedKey";

        if (isExpanded) {
            // Collapse row
            const updated = expanded_Inv.filter((id) => id !== tableId);
            setExpandedRows(updated);
            localStorage.setItem(expandedKey, JSON.stringify(updated));
        } else {
            // Expand row
            const updated = [...expanded_Inv, tableId];
            setExpandedRows(updated);
            localStorage.setItem(expandedKey, JSON.stringify(updated));
            try {
                const data = customerInvoiceList.find((po) => po.id === tableId);
                // Save to state
                if (!data?.details) {
                    setPODetailsMap((prev) => ({ ...prev, [tableId]: null }));
                    return;
                }
                if (!data?.detailsRV) {
                    setPODetailsMapRV((prev) => ({ ...prev, [tableId]: null }));
                    return;
                }
                const details: DetailsRow[] = data.details;
                const detailsRV: DetailsRow[] = data.detailsRV;
                setPODetailsMap((prev) => ({ ...prev, [tableId]: details }));
                setPODetailsMapRV((prev) => ({ ...prev, [tableId]: detailsRV }));
                localStorage.setItem(cachedKey, JSON.stringify(details));
            } catch (error) {
                console.error(`Failed to load details for product ${tableId}`, error);
                setPODetailsMap((prev) => ({ ...prev, [tableId]: null }));
                setPODetailsMapRV((prev) => ({ ...prev, [tableId]: null }));
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
    const handleCreateShipment = async (invoice_no: string) => {
        const confirmed = await showConfirm(translations["System Message"], translations["Shipout2"], translations["Yes"], translations["Cancel"]);
        if (!confirmed) return;
        try {
            const res = await invoiceService.createShipment(invoice_no);
            if (res.token === "Error") {
                showErrorToast(res.message);
                return;
            }
            if (res.token === "Warning") {
                showErrorToast(translations[res.message]);
                return;
            }
            const filters = {
                search: "",
                customer_codes: formData.sort_by === "Code" ? formData.customerCodes.map((c) => c.value) : [],
                date_from: formData.date_from,
                date_to: formData.date_to,
                category_dates: formData.category_dates,
            };
            fetchInvoices(1, itemsPerPage, filters);
            showSuccessToast(translations[res.message]);
        } catch (error) {
            console.error("Failed to load customer by credit:", error);
        }
    };
    const handleDetailChange = (id: number, value: string, column: string) => {
        setSelectedItems((prev) =>
            prev.map((item) => {
                if (item.id === id) {
                    const updatedItem: any = { ...item };
                    const balance_to_pay = parseFloat(column === "balance_to_pay" ? value : String(updatedItem.balance_to_pay)) || 0;
                    if (Number(value) > Number(balance_to_pay)) {
                        updatedItem[column] = balance_to_pay;
                        showErrorToast(translations["Remaining quantity is"] + " " + balance_to_pay);
                    } else {
                        updatedItem[column] = value;
                    }

                    return updatedItem;
                }
                return item;
            })
        );
    };
    const handleDetailChange2 = (id: number, value: string, count: number, column: string) => {
        setSelectedForJV((prev) =>
            prev.map((item) => {
                const updatedItem: any = { ...item };
                if (item.invoice_id === id && item.count_master === count) {
                    const amount = parseFloat(column === "amount" ? value : String(updatedItem.amount)) || 0;
                    if (Number(value) > Number(amount)) {
                        updatedItem[column] = amount;
                        showErrorToast(translations["Please input number lower than or equal to"] + " " + amount);
                    } else {
                        updatedItem[column] = value;
                    }
                    return updatedItem;
                }
                return item;
            })
        );
    };
    const handlePaidInAdvance = async (invoice_no: string, id: number) => {
        const data = new FormData();
        const confirmed = await showConfirm(translations["Confirm"] + " " + invoice_no, translations["was Paid in Advance"] + "?", translations["Save"], translations["Dont Save"]);
        if (!confirmed) return;
        const selectedRows = customerInvoiceList.filter((list) => list.id === id);
        selectedRows.forEach((element) => {
            data.append(
                "details[]",
                JSON.stringify({
                    invoice_no: element.invoice_no,
                    balance: element.balance,
                    customer_id: element.customer_id,
                    currency: element.currency,
                })
            );
        });
        try {
            const result = await invoiceService.paidInAdvance(data);
            if (result.token === "Error") {
                showErrorToast(result.message);
                return;
            }
            if (result.token === "Warning") {
                showErrorToast(translations[result.message]);
                return;
            }
            onSelectedInvChange([]);
            setShowCreateJV(false);
            const filters = {
                search: "",
                customer_codes: formData.sort_by === "Code" ? formData.customerCodes.map((c) => c.value) : [],
                date_from: formData.date_from,
                date_to: formData.date_to,
                category_dates: formData.category_dates,
            };
            fetchInvoices(1, itemsPerPage, filters);
            showSuccessToast(translations[result.message]);
        } catch (error) {
            setLoadingSave(false);
            showErrorToast(translations["Failed to save Transaction."] || "Failed to save Transaction.");
        } finally {
            setLoadingSave(false); // Enable button again after the operation is done
        }
        console.log(selectedRows);
    };
    const handleCreateJV = async (id: number) => {
        let isSingle = 0;
        let singleInvoice: any[] = [];

        if (selectedInv.length > 0) {
            const selectedRows = customerInvoiceList.filter((list) => selectedInv.includes(list.id));
            const unique = isCustomerIdUnique(selectedRows);

            if (!unique) {
                showErrorToast(translations["Please select one customer only"]);
                return;
            }

            if (selectedInv.length === 1) {
                isSingle++;
                singleInvoice = selectedRows;
            } else {
                singleInvoice = selectedRows;
            }
        } else {
            isSingle++;
            singleInvoice = customerInvoiceList.filter((list) => list.id === id);
        }

        const data = new FormData();
        data.append("customer_id", String(singleInvoice[0].customer_id));
        data.append("currency", String(singleInvoice[0]?.currency));
        const result = await invoiceService.doGetCreditDetail(data);

        let newArray: any[] = [];
        let totalBalanceToPay = 0;
        let count_master = 0;
        // ✅ Use for...of loop to support await inside
        for (const element of singleInvoice) {
            let count = 0;
            result.forEach((list: any) => {
                let balance_to_pay = count === 0 ? element.balance_to_pay : 0;
                newArray.push({
                    account_code: list.account_code,
                    account_name_en: list.account_name_en,
                    account_name_cn: list.account_name_cn,
                    amount: list.amount,
                    currency: list.currency,
                    invoice_no: element.invoice_no,
                    invoice_id: element.id,
                    balance_to_pay: balance_to_pay,
                    orig_to_pay: element.balance_to_pay,
                    count_master: count_master,
                });
                count++;
                count_master++;
            });
            totalBalanceToPay += element.balance_to_pay;
        }
        const newInvoiceNos = singleInvoice.map((row) => ({
            invoice_id: row.id,
            invoice_no: row.invoice_no,
            receive_amount: Number(row.new_balance || 0),
        }));

        // Update form state
        setFormData((prev) => ({
            ...prev,
            currency: String(singleInvoice[0]?.currency || ""),
            balance_to_pay: totalBalanceToPay,
            current_credit: 0,
            credit_used: 0,
            received_amount: totalBalanceToPay,
            customer_id: Number(singleInvoice[0]?.customer_id || 0),
            customer_code: String(singleInvoice[0]?.customer_code || ""),
            invoice_nos: newInvoiceNos,
        }));

        // Set state
        setSelectedForJV(newArray);
        setShowCreateJV(true);
    };
    const handlePrint = async () => {
        if (selectedInv.length === 0) {
            showErrorToast(translations["Please click checkbox to select row"]);
            return;
        }
        exportRef.current?.triggerExport();
    };
    const handleCreateRV = async (id: number) => {
        let isSingle = 0;
        let singleInvoice: any = [];
        if (selectedInv.length > 0) {
            const selectedRows = customerInvoiceList.filter((list) => selectedInv.includes(list.id));
            const unique = isCustomerIdUnique(selectedRows); // e.g., your array
            if (!unique) {
                showErrorToast(translations["Please select one customer only"]);
                return;
            }
            if (selectedInv.length === 1) {
                isSingle++;
                singleInvoice = selectedRows;
            }
        }
        if (selectedInv.length === 0) {
            isSingle++;
            singleInvoice = customerInvoiceList.filter((list) => list.id === id);
        }
        if (isSingle > 0) {
            setFormData((prev) => ({
                ...prev,
                currency: singleInvoice[0]["currency"],
                balance_to_pay: singleInvoice[0]["balance_to_pay"],
                current_credit: singleInvoice[0]["current_credit"],
                credit_used: 0,
                received_amount: 0,
                customer_id: singleInvoice[0]["customer_id"],
                customer_code: singleInvoice[0]["customer_code"],
                invoice_nos: [
                    {
                        invoice_id: singleInvoice[0]["id"],
                        invoice_no: singleInvoice[0]["invoice_no"],
                        receive_amount: 0,
                    },
                ],
            }));
            setShowCreateRV(true);
        } else {
            const selectedRows = customerInvoiceList.filter((list) => selectedInv.includes(list.id));
            const totalBalanceToPay = selectedRows.reduce((sum, row) => {
                return sum + (Number(row.balance_to_pay) || 0);
            }, 0);
            const newInvoiceNos = selectedRows.map((row) => ({
                invoice_id: row.id,
                invoice_no: row.invoice_no,
                receive_amount: Number(row.new_balance || 0), // or whatever field you need
            }));
            setFormData((prev) => ({
                ...prev,
                currency: String(selectedRows[0]["currency"]),
                balance_to_pay: totalBalanceToPay,
                current_credit: 0,
                credit_used: 0,
                received_amount: totalBalanceToPay,
                customer_id: Number(selectedRows[0]["customer_id"]),
                customer_code: String(selectedRows[0]["customer_code"]),
                invoice_nos: newInvoiceNos,
            }));
            showMultipleRV(true);
            setSelectedItems(selectedRows);
        }
    };
    const handleSubmitRV = async () => {
        setLoadingSave(true);
        const data = new FormData();
        const bank = formData["bank"]?.toString().trim() ?? "";
        const received_amount = formData["received_amount"]?.toString().trim() ?? 0;
        if (!bank) {
            showErrorToast(translations["Bank is required"]);
            setLoadingSave(false); // Enable button again
            return;
        }
        if (Number(received_amount) === 0) {
            showErrorToast(translations["alert_message_141"]);
            setLoadingSave(false); // Enable button again
            return;
        }
        data.append("customer_id", formData.customer_id.toString());
        data.append("balance_to_pay", formData.balance_to_pay.toString());
        data.append("received_amount", formData.received_amount.toString());
        data.append("currency", formData.currency.toString());
        data.append("bank", (formData.bank as OptionType).value);
        data.append("rv_date", formData.rv_date ? formatDateToCustom(formData.rv_date) : "");
        formData.invoice_nos.forEach((element) => {
            data.append(
                "invoice_nos[]",
                JSON.stringify({
                    invoice_no: element.invoice_no,
                    receive_amount: element.receive_amount,
                })
            );
        });
        try {
            const result = await invoiceService.createReceiveVoucher(data);
            if (result.token === "Error") {
                showErrorToast(result.message);
                return;
            }
            if (result.token === "Warning") {
                showErrorToast(translations[result.message]);
                return;
            }
            // Reset state to allow re-initialization after refetch
            onSelectedInvChange([]);
            setShowCreateRV(false);
            formData.invoice_nos.forEach((element) => {
                const purchaseOrderInfoKey = `${element.invoice_id}-cached-invoice-info`;
                if (localStorage.getItem(purchaseOrderInfoKey)) {
                    localStorage.removeItem(purchaseOrderInfoKey);
                }
            });
            const filters = {
                search: "",
                customer_codes: formData.sort_by === "Code" ? formData.customerCodes.map((c) => c.value) : [],
                date_from: formData.date_from,
                date_to: formData.date_to,
                category_dates: formData.category_dates,
            };
            fetchInvoices(1, itemsPerPage, filters);
            showSuccessToast(translations[result.message]);
        } catch (error) {
            setLoadingSave(false);
            showErrorToast(translations["Failed to save Transaction."] || "Failed to save Transaction.");
        } finally {
            setLoadingSave(false); // Enable button again after the operation is done
        }
    };
    const handleSubmitJV = async () => {
        setLoadingSave(true);
        const data = new FormData();
        data.append("customer_id", formData.customer_id.toString());
        data.append("currency", formData.currency.toString());
        selectedForJV.forEach((element) => {
            const balance_to_pay = Number(element.balance_to_pay) || 0;
            data.append(
                "details[]",
                JSON.stringify({
                    invoice_no: element.invoice_no,
                    receive_amount: element.receive_amount,
                    account_code: element.account_code,
                    balance_to_pay: balance_to_pay,
                })
            );
        });

        try {
            const result = await invoiceService.createJournalVoucher(data);
            if (result.token === "Error") {
                showErrorToast(result.message);
                return;
            }
            if (result.token === "Warning") {
                showErrorToast(translations[result.message]);
                return;
            }
            // Reset state to allow re-initialization after refetch
            onSelectedInvChange([]);
            setShowCreateJV(false);
            const filters = {
                search: "",
                customer_codes: formData.sort_by === "Code" ? formData.customerCodes.map((c) => c.value) : [],
                date_from: formData.date_from,
                date_to: formData.date_to,
                category_dates: formData.category_dates,
            };
            setLoadingSave(false);
            fetchInvoices(1, itemsPerPage, filters);
            showSuccessToast(translations[result.message]);
        } catch (error) {
            setLoadingSave(false);
            showErrorToast(translations["Failed to save Transaction."] || "Failed to save Transaction.");
        } finally {
            setLoadingSave(false); // Enable button again after the operation is done
        }
    };
    const isCustomerIdUnique = (lists: any[]): boolean => {
        const ids = lists.map((list) => list.customer_id);
        const uniqueSupplierIds = new Set(ids);
        return uniqueSupplierIds.size === 1;
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
                                    disabled={loadCancelOrder_CTOCUST || loadCancelOrder_NRTOMI || loadCancelOrder_RPTOC || loadCancelOrder_PRTCNL}
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
                                    disabled={loadCancelOrder_CTOCUST || loadCancelOrder_NRTOMI || loadCancelOrder_RPTOC || loadCancelOrder_PRTCNL}
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
                                    disabled={loadCancelOrder_CTOCUST || loadCancelOrder_NRTOMI || loadCancelOrder_RPTOC || loadCancelOrder_PRTCNL}
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
                                <button
                                    onClick={() => handleSaveCancelOrder("PRTCNL")}
                                    className={`px-2 py-2 bg-cyan-600 hover:bg-cyan-500 rounded text-white transition w-full
                                        ${loadCancelOrder_RPTOC ? "bg-gray-500 cursor-not-allowed opacity-50" : "bg-cyan-600 hover:bg-cyan-700"} 
                                        text-[#ffffffcc] flex justify-center items-center`}
                                    disabled={loadCancelOrder_CTOCUST || loadCancelOrder_NRTOMI || loadCancelOrder_RPTOC || loadCancelOrder_PRTCNL}
                                >
                                    {loadCancelOrder_PRTCNL ? (
                                        <>
                                            <div className="loader mr-2"></div>
                                            <span>{translations["Processing2"]}...</span>
                                        </>
                                    ) : (
                                        <span>{translations["Partially Paid and Canceled"]}</span>
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
    const renderMultipleRV = () => {
        if (!multipleRV) return null;
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 transition-opacity duration-300 ease-out">
                <div className="bg-[#19191c] rounded-xl border border-[#ffffff1a] w-[40vw] h-auto flex flex-col">
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-[#ffffff1a]">
                        <div className="flex items-center space-x-4">
                            <h2 className="text-xl font-bold text-white">{translations["Create Receive Voucher"]}</h2>
                        </div>
                        <div className="flex items-center space-x-4">{formData.customer_code}</div>
                    </div>
                    {/* Content */}
                    <div className="flex-1 overflow-auto p-4">
                        <div className="grid grid-cols-12 gap-2">
                            <div className="col-span-6 md:col-span-6">
                                <div className={`flex items-center gap-4 mb-2`}>
                                    <label className="w-[20%] text-gray-400 text-sm">{translations["RV Date"]} :</label>
                                    <Flatpickr
                                        onChange={handleDateRV}
                                        options={{
                                            dateFormat: "M d Y",
                                            defaultDate: formData.rv_date || undefined,
                                            allowInput: false,
                                            locale: locale,
                                        }}
                                        className="w-[80%] px-3 py-2 border-[1px] border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm"
                                    />
                                </div>
                            </div>
                            <div className="col-span-6 md:col-span-6">
                                <div className={`flex items-center gap-4 mb-2`}>
                                    <label className="w-[20%] text-gray-400 text-sm text-right">{translations["Bank"]} :</label>
                                    <Select
                                        classNamePrefix="react-select"
                                        value={formData.bank}
                                        onChange={(selected) => {
                                            setFormData({ ...formData, bank: selected as OptionType | null });
                                        }}
                                        options={banksOptions}
                                        styles={{
                                            ...selectStyles,
                                            menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                                        }}
                                        className="w-[80%]"
                                        placeholder={translations["Select"]}
                                        menuPlacement="auto"
                                        menuPosition="fixed"
                                        menuPortalTarget={typeof window !== "undefined" ? document.body : null}
                                    />
                                </div>
                            </div>
                            <div className="col-span-12 md:col-span-12">
                                <table className="w-full border border-gray-600 border-collapse text-sm text-left">
                                    <thead className="sticky top-0 z-[1] py-1 px-4" style={{ backgroundColor: "#1f2132" }}>
                                        <tr className="border-b" style={{ borderColor: "#2d2d30" }}>
                                            <th className="w-[34%] text-left py-2 px-2 text-gray-400 text-sm w-12 border border-[#40404042]">{translations["Invoice No"]}</th>
                                            <th className="w-[33%] text-center py-2 px-2 text-gray-400 text-sm w-12 border border-[#40404042]">{translations["Balance To Pay"]}</th>
                                            <th className="w-[33%] text-center py-2 px-2 text-gray-400 text-sm w-12 border border-[#40404042]">{translations["Received Amount"]}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {selectedItems.length === 0 ? (
                                            <tr className="border-b hover:bg-gray-700 hover:bg-opacity-30 transition-colors" style={{ borderColor: "#40404042" }}>
                                                <td colSpan={3} className="py-2 px-2 text-gray-400 text-center text-custom-sm border border-[#40404042]">
                                                    {translations["No data available on table"]}
                                                </td>
                                            </tr>
                                        ) : (
                                            selectedItems.map((item) => (
                                                <tr key={item.indexInt} className={`border-b hover:bg-gray-700 hover:bg-opacity-30 transition-colors`} style={{ borderColor: "#40404042" }}>
                                                    <td className="py-2 px-2 text-gray-400 text-left text-custom-sm border border-[#40404042]">{item.invoice_no}</td>
                                                    <td className="py-2 px-2 text-gray-400 text-center text-custom-sm border border-[#40404042]">
                                                        {item.currency} {formatMoney(item.balance_to_pay)}
                                                    </td>
                                                    <td className="py-0 px-0 text-gray-400 text-center text-custom-sm border border-[#40404042]">
                                                        <input
                                                            type="number"
                                                            value={item.new_balance}
                                                            onChange={(e) => handleDetailChange(item.id, e.target.value, "new_balance")}
                                                            className="w-full px-3 py-1.5 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-sm rounded text-center"
                                                        />
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                    <tfoot>
                                        {selectedItemsFooter.length === 0 ? (
                                            <tr className="clickable border-b hover:bg-gray-700 hover:bg-opacity-30 transition-colors cursor-pointer" style={{ borderColor: "#40404042" }}>
                                                <td colSpan={2} className="py-2 px-2 text-gray-400 text-center text-custom-sm border border-[#40404042]">
                                                    {translations["No data available on table"]}
                                                </td>
                                            </tr>
                                        ) : (
                                            selectedItemsFooter.map((item) => (
                                                <tr
                                                    key={item.indexInt}
                                                    className={`clickable border-b hover:bg-gray-700 hover:bg-opacity-30 transition-colors cursor-pointer`}
                                                    style={{ borderColor: "#40404042" }}
                                                >
                                                    <td className="py-2 px-2 text-gray-400 text-left text-custom-sm border border-[#40404042]">{translations["Total"]}</td>
                                                    <td className="py-2 px-2 text-gray-400 text-center text-custom-sm border border-[#40404042]">
                                                        {item.currency} {formatMoney(item.balance_to_pay)}
                                                    </td>
                                                    <td className="py-0 px-0 text-gray-400 text-center text-custom-sm border border-[#40404042]">
                                                        <input
                                                            type="number"
                                                            readOnly
                                                            value={item.new_balance}
                                                            onChange={(e) => handleDetailChange(item.id, e.target.value, "new_balance")}
                                                            className="w-full px-3 py-1.5 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-sm rounded text-center"
                                                        />
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tfoot>
                                </table>
                            </div>
                        </div>
                    </div>
                    <div className="p-2 border-t border-[#ffffff1a] flex justify-end space-x-1">
                        <button
                            onClick={() => showMultipleRV(false)}
                            className="px-2 py-2 bg-gray-700 hover:bg-gray-600 rounded text-white transition focus:outline-none focus:ring-2 focus:ring-cyan-500"
                        >
                            {translations["Close"]}
                        </button>
                        <button onClick={handleSubmitRV} className="px-2 py-2 bg-cyan-600 hover:bg-cyan-500 rounded text-white transition focus:outline-none focus:ring-2 focus:ring-cyan-500">
                            {translations["Submit"]}
                        </button>
                    </div>
                </div>
            </div>
        );
    };
    const renderCreateRV = () => {
        if (!showCreateRV) return null;
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-[#19191c] rounded-xl border border-[#ffffff1a] w-[25vw] h-auto flex flex-col">
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-[#ffffff1a]">
                        <h2 className="text-xl font-bold text-white">{translations["Create Receive Voucher"]}</h2>
                        {formData.customer_code}
                    </div>
                    {/* Content */}
                    <div className="p-4">
                        <div className="col-span-12 md:col-span-12">
                            <div className={`flex items-center gap-4 mb-2`}>
                                <label className="w-[30%] text-gray-400 text-sm">{translations["Date"]}</label>
                                <Flatpickr
                                    onChange={handleDateRV}
                                    options={{
                                        dateFormat: "M d Y",
                                        defaultDate: formData.rv_date || undefined,
                                        allowInput: false,
                                        locale: locale,
                                    }}
                                    className="w-[68%] px-3 py-2 border-[1px] border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm"
                                />
                            </div>
                            <div className={`flex items-center gap-4 mb-2`}>
                                <label className="w-[30%] text-gray-400 text-sm">{translations["Bank"]}</label>
                                <Select
                                    classNamePrefix="react-select"
                                    value={formData.bank}
                                    onChange={(selected) => {
                                        setFormData({ ...formData, bank: selected as OptionType | null });
                                    }}
                                    options={banksOptions}
                                    styles={{
                                        ...selectStyles,
                                        menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                                    }}
                                    className="w-[68%]"
                                    placeholder={translations["Select"]}
                                    menuPlacement="auto"
                                    menuPosition="fixed"
                                    menuPortalTarget={typeof window !== "undefined" ? document.body : null}
                                />
                            </div>
                            <div className={`flex items-center gap-4 mb-2`}>
                                <label className="w-[30%] text-gray-400 text-sm">{translations["Received Amount"]}</label>
                                <NumericFormat
                                    value={formData.received_amount === 0 ? "" : formData.received_amount}
                                    decimalSeparator="."
                                    decimalScale={2}
                                    fixedDecimalScale
                                    allowNegative={true}
                                    prefix={`${formData.currency} `}
                                    placeholder="0.00"
                                    onValueChange={({ floatValue }) => {
                                        setFormData((prev) => ({
                                            ...prev,
                                            received_amount: Number(floatValue) ?? "0.00",
                                        }));
                                    }}
                                    className="w-[70%] flex-1 px-3 py-2 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm rounded-md"
                                />
                            </div>
                            <div className={`flex items-center gap-4 mb-2`}>
                                <label className="w-[30%] text-gray-400 text-sm">{translations["Balance To Pay"]}</label>
                                <NumericFormat
                                    readOnly
                                    value={formData.balance_to_pay === 0 ? "" : formData.balance_to_pay}
                                    decimalSeparator="."
                                    decimalScale={2}
                                    fixedDecimalScale
                                    allowNegative={true}
                                    prefix={`${formData.currency} `}
                                    placeholder="0.00"
                                    onValueChange={({ floatValue }) => {
                                        setFormData((prev) => ({
                                            ...prev,
                                            balance_to_pay: Number(floatValue) ?? "0.00",
                                        }));
                                    }}
                                    className="w-[70%] flex-1 px-3 py-2 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm rounded-md"
                                />
                            </div>
                            <div className={`flex items-center gap-4 mb-2 ${formData.current_credit <= 0 ? "hidden" : ""}`}>
                                <label className="w-[30%] text-gray-400 text-sm">{translations["Current Credit"]}</label>
                                <div className="w-[70%] flex flex-1">
                                    <NumericFormat
                                        value={formData.current_credit}
                                        decimalSeparator="."
                                        decimalScale={2}
                                        readOnly
                                        fixedDecimalScale
                                        allowNegative={true}
                                        prefix={`${formData.currency} `}
                                        placeholder={`${formData.currency} 0.00`}
                                        onValueChange={({ floatValue }) => {
                                            setFormData((prev) => ({
                                                ...prev,
                                                current_credit: floatValue ?? 0,
                                            }));
                                        }}
                                        className="flex-1 px-3 py-2 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm rounded-md !rounded-tr-none !rounded-br-none"
                                    />
                                    <button
                                        disabled={formData.current_credit === 0}
                                        type="button"
                                        // onClick={handlePopupCredits}
                                        className="px-2 py-2 bg-cyan-600 text-white !rounded-tr-md !rounded-br-md !rounded-tl-none !rounded-bl-none hover:bg-cyan-700 flex items-center justify-center border border-[#ffffff1a] border-l-0"
                                    >
                                        <Search className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                            <div className={`flex items-center gap-4 mb-2 ${formData.current_credit <= 0 ? "hidden" : ""}`}>
                                <label className="w-[30%] text-gray-400 text-sm">{translations["Credit Used"]}</label>
                                <NumericFormat
                                    value={formData.credit_used}
                                    decimalSeparator="."
                                    readOnly
                                    decimalScale={2}
                                    fixedDecimalScale
                                    allowNegative={true}
                                    prefix={`${formData.currency} `}
                                    placeholder="0.00"
                                    onValueChange={({ floatValue }) => {
                                        setFormData((prev) => ({
                                            ...prev,
                                            credit_note: String(floatValue) ?? "0.00",
                                        }));
                                    }}
                                    className="w-[70%] flex-1 px-3 py-2 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm rounded-md"
                                />
                            </div>
                        </div>
                    </div>
                    {/* Footer */}
                    <div className="p-2 border-t border-[#ffffff1a] flex justify-end space-x-2">
                        <button
                            onClick={() => setShowCreateRV(false)}
                            className="px-2 py-2 bg-gray-700 hover:bg-gray-600 rounded text-white transition focus:outline-none focus:ring-2 focus:ring-cyan-500"
                        >
                            {translations["Close"]}
                        </button>
                        <button
                            onClick={handleSubmitRV}
                            className={`px-2 py-2 text-custom-sm rounded-lg text-sm font-medium transition-colors 
                            ${loadingSave ? "bg-gray-500 cursor-not-allowed opacity-50" : "bg-cyan-600 hover:bg-cyan-700"} 
                            text-[#ffffffcc] flex justify-center items-center`}
                            disabled={loadingSave}
                        >
                            {loadingSave ? (
                                <>
                                    <div className="loader mr-2"></div>
                                    <span>{translations["Processing2"]}...</span>
                                </>
                            ) : (
                                <span>{translations["Submit"]}</span>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        );
    };
    const renderCreateJV = () => {
        if (!showCreateJV) return null;
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-[#19191c] rounded-xl border border-[#ffffff1a] w-[60vw] h-auto flex flex-col">
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-[#ffffff1a]">
                        <h2 className="text-xl font-bold text-white">{translations["Credits"]}</h2>
                        {formData.customer_code}
                    </div>
                    {/* Content */}
                    <div className="p-4">
                        <div className="col-span-12 md:col-span-12">
                            <table className="w-full border border-gray-600 border-collapse text-sm text-left">
                                <thead className="sticky top-0 z-[1] py-1 px-4" style={{ backgroundColor: "#1f2132" }}>
                                    <tr className="border-b" style={{ borderColor: "#2d2d30" }}>
                                        <th className="text-left py-2 px-2 text-gray-400 text-sm w-12 border border-[#40404042]">{translations["Invoice No"]}</th>
                                        <th className="text-left py-2 px-2 text-gray-400 text-sm w-12 border border-[#40404042]">{translations["Account Code"]}</th>
                                        <th className="text-left py-2 px-2 text-gray-400 text-sm w-12 border border-[#40404042]">{translations["Account Name"]}</th>
                                        <th className="text-center py-2 px-2 text-gray-400 text-sm w-12 border border-[#40404042]">{translations["Credit Balance"]}</th>
                                        <th className="text-center py-2 px-2 text-gray-400 text-sm w-12 border border-[#40404042]">{translations["To Pay"]}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {selectedForJV.length === 0 ? (
                                        <tr className="border-b hover:bg-gray-700 hover:bg-opacity-30 transition-colors" style={{ borderColor: "#40404042" }}>
                                            <td colSpan={5} className="py-2 px-2 text-gray-400 text-center text-custom-sm border border-[#40404042]">
                                                {translations["No data available on table"]}
                                            </td>
                                        </tr>
                                    ) : (
                                        selectedForJV.map((item) => (
                                            <tr key={item.account_code} className={`border-b hover:bg-gray-700 hover:bg-opacity-30 transition-colors`} style={{ borderColor: "#40404042" }}>
                                                <td className="py-2 px-2 text-gray-400 text-left text-custom-sm border border-[#40404042]">{item.invoice_no}</td>
                                                <td className="py-2 px-2 text-gray-400 text-left text-custom-sm border border-[#40404042]">{item.account_code}</td>
                                                <td className="py-2 px-2 text-gray-400 text-left text-custom-sm border border-[#40404042]">
                                                    {lang === "en" ? item.account_name_en : item.account_name_cn}
                                                </td>
                                                <td className="py-2 px-2 text-gray-400 text-center text-custom-sm border border-[#40404042]">
                                                    {item.currency} {formatMoney(item.amount)}
                                                </td>
                                                <td className="py-0 px-0 text-gray-400 text-center text-custom-sm border border-[#40404042]">
                                                    <input
                                                        type="number"
                                                        value={item.balance_to_pay === 0 ? "" : item.balance_to_pay}
                                                        placeholder="0"
                                                        onChange={(e) => handleDetailChange2(item.invoice_id, e.target.value, item.count_master, "balance_to_pay")}
                                                        className="w-full px-3 py-1.5 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-sm rounded text-center"
                                                    />
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                                <tfoot>
                                    {selectedForJVFooter.length === 0 ? (
                                        <tr className="clickable border-b hover:bg-gray-700 hover:bg-opacity-30 transition-colors cursor-pointer" style={{ borderColor: "#40404042" }}>
                                            <td colSpan={5} className="py-2 px-2 text-gray-400 text-center text-custom-sm border border-[#40404042]">
                                                {translations["No data available on table"]}
                                            </td>
                                        </tr>
                                    ) : (
                                        selectedForJVFooter.map((item) => (
                                            <tr
                                                key={item.indexInt}
                                                className={`clickable border-b hover:bg-gray-700 hover:bg-opacity-30 transition-colors cursor-pointer`}
                                                style={{ borderColor: "#40404042" }}
                                            >
                                                <td className="py-2 px-2 text-gray-400 text-left text-custom-sm border border-[#40404042]"></td>
                                                <td className="py-2 px-2 text-gray-400 text-left text-custom-sm border border-[#40404042]"></td>
                                                <td className="py-2 px-2 text-gray-400 text-left text-custom-sm border border-[#40404042]"></td>
                                                <td className="py-2 px-2 text-gray-400 text-center text-custom-sm border border-[#40404042]">{translations["Total"]}</td>
                                                <td className="py-0 px-0 text-gray-400 text-center text-custom-sm border border-[#40404042]">
                                                    <input
                                                        type="number"
                                                        readOnly
                                                        value={item.balance_to_pay}
                                                        className="w-full px-3 py-1.5 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-sm rounded text-center"
                                                    />
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tfoot>
                            </table>
                        </div>
                    </div>
                    {/* Footer */}
                    <div className="p-2 border-t border-[#ffffff1a] flex justify-end space-x-2">
                        <button
                            onClick={() => setShowCreateJV(false)}
                            className="px-2 py-2 bg-gray-700 hover:bg-gray-600 rounded text-white transition focus:outline-none focus:ring-2 focus:ring-cyan-500"
                        >
                            {translations["Close"]}
                        </button>
                        <button
                            onClick={handleSubmitJV}
                            className={`px-2 py-2 text-custom-sm rounded-lg text-sm font-medium transition-colors 
                            ${loadingSave ? "bg-gray-500 cursor-not-allowed opacity-50" : "bg-cyan-600 hover:bg-cyan-700"} 
                            text-[#ffffffcc] flex justify-center items-center`}
                            disabled={loadingSave}
                        >
                            {loadingSave ? (
                                <>
                                    <div className="loader mr-2"></div>
                                    <span>{translations["Processing2"]}...</span>
                                </>
                            ) : (
                                <span>{translations["Submit"]}</span>
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
                                    disabled={selectedInv.length === 0}
                                    className="px-2 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors flex items-center space-x-1 text-sm"
                                >
                                    <span>{translations["Print"]}</span>
                                </button>
                                <button
                                    disabled={selectedInv.length === 0}
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
                                    <th className="w-[2%] text-left py-2 px-2 text-gray-400 text-sm w-12"></th>
                                    <th className="w-[2%] text-left py-2 px-2 text-gray-400 text-sm w-12">
                                        <div className="flex items-center h-full">
                                            <CustomCheckbox
                                                checked={selectedInv.length === customerInvoiceList.length && customerInvoiceList.length > 0}
                                                onChange={(checked) => handleSelectAll(checked)}
                                            />
                                        </div>
                                    </th>
                                    <th className="w-[12%] text-left py-2 px-2 text-gray-400 text-sm">{translations["Invoice No"]}</th>
                                    <th className="w-[14%] text-left py-2 px-2 text-gray-400 text-sm">{translations["Customer"]}</th>
                                    <th className="w-[9%] text-left py-2 px-2 text-gray-400 text-sm">{translations["Source"]}</th>
                                    <th className="w-[9%] text-center py-2 px-2 text-gray-400 text-sm">{translations["Total"]}</th>
                                    <th className="w-[8%] text-center py-2 px-2 text-gray-400 text-sm">{translations["Deposit"]}</th>
                                    <th className="w-[8%] text-center py-2 px-2 text-gray-400 text-sm">{translations["Credit Used"]}</th>
                                    <th className="w-[9%] text-center py-2 px-2 text-gray-400 text-sm">{translations["Balance"]}</th>
                                    <th className="w-[8%] text-center py-2 px-2 text-gray-400 text-sm">{translations["Payment"]}</th>
                                    <th className="w-[8%] text-center py-2 px-2 text-gray-400 text-sm">{translations["Status"]}</th>
                                    <th className="w-[4%] text-center py-2 px-2 text-gray-400 text-sm"></th>
                                    <th className="w-[13%] text-center py-2 px-2 text-gray-400 text-sm"></th>
                                </tr>
                            </thead>
                            {loading ? (
                                <LoadingSpinnerTbody rowsCount={itemsPerPage} />
                            ) : (
                                <tbody>
                                    {customerInvoiceList.length === 0 ? (
                                        <tr>
                                            <td colSpan={15} className="py-4 px-4 text-center text-gray-400 text-sm border border-[#40404042]">
                                                {translations["No Record Found"] || "No Record Found"}
                                            </td>
                                        </tr>
                                    ) : (
                                        customerInvoiceList.map((list, index) => (
                                            <React.Fragment key={list.id || index}>
                                                <tr
                                                    key={list.id || index}
                                                    onClick={(e) => handleRowClick(e, list.id)}
                                                    className={`clickable border-b hover:bg-gray-700 hover:bg-opacity-30 transition-colors cursor-pointer ${
                                                        selectedInv.includes(list.id as number) ? "bg-gray-700 bg-opacity-30" : ""
                                                    }`}
                                                    style={{ borderColor: "#40404042" }}
                                                >
                                                    <td className="py-2 px-2 text-gray-400 text-left text-custom-sm" onClick={(e) => e.stopPropagation()}>
                                                        <button
                                                            onClick={() => handleToggleRow(list.id)}
                                                            className={`px-1 py-1 ${
                                                                expanded_Inv.includes(list.id) ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"
                                                            } text-white rounded-lg transition-colors text-xs`}
                                                        >
                                                            {expanded_Inv.includes(list.id) ? <Minus size={16} /> : <Plus size={16} />}
                                                        </button>
                                                    </td>
                                                    <td className="py-2 px-2 text-gray-400 text-center text-custom-sm" onClick={(e) => e.stopPropagation()}>
                                                        <CustomCheckbox
                                                            disabled={list.invoice_status_id === 8 || list.invoice_status_id === 5}
                                                            checked={selectedInv.includes(list.id as number)}
                                                            onChange={(checked) => handleSelectInv(list.id as number, checked)}
                                                        />
                                                    </td>
                                                    <td className="py-2 px-2 text-gray-400 text-left text-custom-sm">
                                                        <div className="group flex items-center">
                                                            <p className="text-gray-400 text-custom-sm">{highlightMatch(list.invoice_no, searchTerm)}</p>
                                                            <CopyToClipboard text={list.invoice_no ?? ""} />
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
                                                        {formatMoney(list.balance)}
                                                    </td>
                                                    <td className="py-2 px-2 text-gray-400 text-center text-custom-sm">
                                                        {list.currency}
                                                        <br></br>
                                                        {list.invoice_status_id === 1 ? formatMoney(list.total) : formatMoney(list.payment)}
                                                    </td>
                                                    <td className="py-2 px-2 text-gray-400 text-center text-custom-sm">
                                                        <span className={`px-2 py-1 rounded-full text-xs text-custom-sm ${getStatusColor(list.invoice_status_id)}`}>
                                                            {lang === "en" ? list.status_value_en : list.status_value_cn}
                                                        </span>
                                                    </td>
                                                    <td className="py-2 px-2 text-gray-400 text-left text-custom-sm" onClick={(e) => e.stopPropagation()}>
                                                        {list.invoice_status_id !== 9 && list.cnt_ship === 0 && list.invoice_status_id !== 5 && (
                                                            <button
                                                                type="button"
                                                                onClick={() => handleCreateShipment(list.invoice_no)}
                                                                className="px-1 py-1 text-white rounded-lg transition-colors text-sm bg-cyan-600 hover:bg-cyan-700"
                                                            >
                                                                <span>{translations["Shipment"]}</span>
                                                            </button>
                                                        )}
                                                    </td>
                                                    <td className="py-2 px-2 text-gray-400 text-center text-custom-sm" onClick={(e) => e.stopPropagation()}>
                                                        {list.invoice_status_id === 1 && list.cnt_ship === 0 ? (
                                                            <button type="button" disabled className="px-1 py-1 text-white rounded-lg transition-colors text-sm bg-green-600 hover:bg-green-700">
                                                                <span>{translations["PAID"]}</span>
                                                            </button>
                                                        ) : list.invoice_status_id === 2 || list.invoice_status_id === 3 ? (
                                                            list.balance <= 0 ? (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handlePaidInAdvance(list.invoice_no, list.id)}
                                                                    className="px-1 py-1 text-white rounded-lg transition-colors text-sm bg-green-600 hover:bg-green-700"
                                                                >
                                                                    <span>{translations["Paid in Advance"]}</span>
                                                                </button>
                                                            ) : list.current_credit >= list.balance ? (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleCreateJV(list.id)}
                                                                    className="px-1 py-1 text-white rounded-lg transition-colors text-sm bg-cyan-600 hover:bg-cyan-700"
                                                                >
                                                                    <span>{translations["Create JV"]}</span>
                                                                </button>
                                                            ) : list.balance <= 0 && list.credit_used > 0 ? (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleCreateJV(list.id)}
                                                                    className="px-1 py-1 text-white rounded-lg transition-colors text-sm bg-cyan-600 hover:bg-cyan-700"
                                                                >
                                                                    <span>{translations["Create JV"]}</span>
                                                                </button>
                                                            ) : (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleCreateRV(list.id)}
                                                                    className="px-1 py-1 text-white rounded-lg transition-colors text-sm bg-cyan-600 hover:bg-cyan-700"
                                                                >
                                                                    <span>{translations["Create RV"]}</span>
                                                                </button>
                                                            )
                                                        ) : null}
                                                    </td>
                                                </tr>
                                                {expanded_Inv.includes(list.id) && (
                                                    <React.Fragment key={`${list.id}-rv`}>
                                                        <tr>
                                                            <td colSpan={15} className="py-0 px-4 pt-2">
                                                                <table className="w-full" style={{ backgroundColor: "#060818" }}>
                                                                    <thead className="sticky top-0 z-[1] py-1 px-4" style={{ backgroundColor: "#1f2132" }}>
                                                                        <tr className="border-b" style={{ borderColor: "#2d2d30" }}>
                                                                            <th className="w-auto text-left py-2 px-4 text-gray-400 text-sm w-12 border border-[#40404042]">
                                                                                {translations["Product Code"]}
                                                                            </th>
                                                                            <th className="w-auto text-left py-2 px-4 text-gray-400 text-sm w-12 border border-[#40404042]">
                                                                                {translations["Product Name"]}
                                                                            </th>
                                                                            <th className="w-auto text-center py-2 px-4 text-gray-400 text-sm w-12 border border-[#40404042]">
                                                                                {translations["Deposit"]}
                                                                            </th>
                                                                            <th className="w-auto text-center py-2 px-4 text-gray-400 text-sm w-12 border border-[#40404042]">{translations["Qty"]}</th>
                                                                            <th className="w-auto text-center py-2 px-4 text-gray-400 text-sm w-12 border border-[#40404042]">
                                                                                {translations["Price"]}
                                                                            </th>
                                                                            <th className="w-auto text-center py-2 px-4 text-gray-400 text-sm w-12 border border-[#40404042]">
                                                                                {translations["Total"]}
                                                                            </th>
                                                                        </tr>
                                                                    </thead>
                                                                    <tbody>
                                                                        {soDetailMap[list.id] && soDetailMap[list.id]!.length > 0 ? (
                                                                            soDetailMap[list.id]!.map((detail, i) => (
                                                                                <tr key={detail.id || i}>
                                                                                    <td className="py-3 px-4 text-gray-400 text-left text-custom-sm">
                                                                                        <div className="group flex items-center">
                                                                                            <p className="text-gray-400 text-custom-sm">
                                                                                                {detail.product_code
                                                                                                    ? highlightMatch(detail.product_code, searchTerm)
                                                                                                    : translations["Deleted"] || "Deleted"}
                                                                                            </p>
                                                                                            <CopyToClipboard text={detail.product_code ? detail.product_code : ""} />
                                                                                        </div>
                                                                                    </td>
                                                                                    <td className="py-3 px-4 text-gray-400 text-left text-custom-sm">
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
                                                                                    <td className="py-3 px-4 text-gray-400 text-center text-custom-sm">
                                                                                        {detail.currency} {formatMoney(detail.deposit)}
                                                                                    </td>
                                                                                    <td className="py-3 px-4 text-gray-400 text-center text-custom-sm">{detail.qty}</td>
                                                                                    <td className="py-3 px-4 text-gray-400 text-center text-custom-sm">
                                                                                        {detail.currency} {formatMoney(detail.price)}
                                                                                    </td>
                                                                                    <td className="py-3 px-4 text-gray-400 text-center text-custom-sm">
                                                                                        {detail.currency} {formatMoney(detail.total)}
                                                                                    </td>
                                                                                </tr>
                                                                            ))
                                                                        ) : (
                                                                            <tr>
                                                                                <td colSpan={6} className="py-3 px-4 text-center text-gray-400 text-sm">
                                                                                    {translations["No Record Found"]}.
                                                                                </td>
                                                                            </tr>
                                                                        )}
                                                                    </tbody>
                                                                </table>
                                                            </td>
                                                        </tr>
                                                        <tr>
                                                            <td colSpan={15} className="py-0 px-4">
                                                                <table className="w-full" style={{ backgroundColor: "#060818" }}>
                                                                    <thead className="sticky top-0 z-[1] py-1 px-4" style={{ backgroundColor: "#1f2132" }}>
                                                                        <tr className="border-b" style={{ borderColor: "#2d2d30" }}>
                                                                            <th className="w-auto text-left py-2 px-4 text-gray-400 text-sm w-12 border border-[#40404042]">
                                                                                {translations["Payment Date"]}
                                                                            </th>
                                                                            <th className="w-auto text-left py-2 px-4 text-gray-400 text-sm w-12 border border-[#40404042]">
                                                                                {translations["Receive Voucher No"]}
                                                                            </th>
                                                                            <th className="w-auto text-center py-2 px-4 text-gray-400 text-sm w-12 border border-[#40404042]">
                                                                                {translations["Amount Received"]}
                                                                            </th>
                                                                        </tr>
                                                                    </thead>
                                                                    <tbody>
                                                                        {soDetailMapRV[list.id] && soDetailMapRV[list.id]!.length > 0 ? (
                                                                            soDetailMapRV[list.id]!.map((detail2, i) => (
                                                                                <tr key={detail2.id || i}>
                                                                                    <td className="py-3 px-4 text-gray-400 text-left text-custom-sm">{detail2.rv_date}</td>
                                                                                    <td className="py-3 px-4 text-gray-400 text-left text-custom-sm">{detail2.rv_number}</td>
                                                                                    <td className="py-3 px-4 text-gray-400 text-center text-custom-sm">
                                                                                        {detail2.currency} {formatMoney(detail2.amount)}
                                                                                    </td>
                                                                                </tr>
                                                                            ))
                                                                        ) : (
                                                                            <tr>
                                                                                <td colSpan={3} className="py-3 px-4 text-center text-gray-400 text-sm">
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
                    <div className="p-4 flex items-center space-x-2">
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
                            baseName="CustomerInv"
                            ids={selectedInv.length > 0 ? selectedInv : customerInvoiceList.map((p) => p.id)}
                            language={lang}
                        />
                        <div className="hidden">
                            <ExportReportSelector ref={exportRef} formats={["odt"]} baseName="DownloadSelectedSingleInv" ids={selectedInv} language={lang} />
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
                {renderCreateRV()}
                {renderCreateJV()}
                {renderMultipleRV()}
            </div>
        </div>
    );
};

export default SalesOrderList;
