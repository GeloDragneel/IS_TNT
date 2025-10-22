import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { supplierInvoiceService, ApiSupplierInvoice, DetailsExpanded, FilterParams } from "@/services/supplierInvoiceService";
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
import { ExportReportSelector } from "@/utils/ExportReportSelector";
import { getFlatpickrLocale, formatDateToCustom } from "@/utils/flatpickrLocale";
import { NumericFormat } from "react-number-format";
import { fetchSuppliers, fetchBank, OptionType, convertToSingleOption } from "@/utils/fetchDropdownData";
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
interface SupplierInvoiceListProps {
    tabId: string;
    onSupplierInvoiceSelect: (supplierId: number, saveType?: string) => void;
    onChangeView: (view: "list" | "details" | "paidItemNotReceived" | "unpaidItemReceived") => void;
    selectedSupplierInvoice: number[];
    onSelectedSupplierInvoiceChange: (selected: number[]) => void;
    expandedRows: number[];
    onExpandedRowsChange: (expanded: number[]) => void;
}
type FormDataType = {
    sort_by: string;
    supplier_id: number;
    category_dates: string;
    date_from: Date | null; // Allow null here
    date_to: Date | null; // Allow null here
    supplierCodes: OptionType[];
    supplierCodeOnPrint: OptionType | null;
    poStatus: OptionType[];
    pv_date: Date | null;
    bank: OptionType | null;
    amount_to_pay: number;
    current_credit: number;
    credit_used: number;
    currency: string;
};
interface POFooter {
    currency: string;
    total: number;
}
// localStorage.clear();
const SupplierInvoiceList: React.FC<SupplierInvoiceListProps> = ({ tabId, onSupplierInvoiceSelect, onChangeView, selectedSupplierInvoice, onSelectedSupplierInvoiceChange }) => {
    const { translations, lang } = useLanguage();
    const [supplierInvoiceList, setSupplierInvoice] = useState<ApiSupplierInvoice[]>([]);
    const [creditSuppliers, setCreditSuppliers] = useState<ApiSupplierInvoice[]>([]);
    const [totalPages, setTotalPages] = useState(1);
    const locale = getFlatpickrLocale(translations);
    const pageSizeOptions = useMemo(() => [15, 20, 50, -1], []);
    const [expanded_PO, setExpandedRows] = useState<number[]>([]);
    const [orderDetailsMap, setPODetailsMap] = useState<Record<number, DetailsExpanded[] | null>>({});
    const [disabledCreatePV, setDisableCreatePV] = useState(true);
    const [activeAdvanceSearch, setActiveAdvanceSearch] = useState(false);
    const [saveCreatePV, setSaveCreatePV] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const [showDateRange, setShowDateRange] = useState(false);
    const [showAdvanceSearch, setShowAdvanceSearch] = useState(false);
    const [showPrintBySupplier, setShowPrintBySupplier] = useState(false);
    const [showCreatePV, setShowCreatePV] = useState(false);
    const [allSupplier, setAllSuppliers] = useState<DropdownData[]>([]);
    const [banksData, setBanksData] = useState<DropdownData[]>([]);
    const [creditsPopup, setShowCreditsPopup] = useState(false);
    const [selectedData, setSelectedData] = useState<number[]>([]);
    const throttleTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
    const [preorderFooter2, setPreorderFooter2] = useState<POFooter[]>([]); // Changed to array
    const inputRef = useRef<HTMLInputElement>(null);
    const exportRef = useRef<{ triggerExport: () => void }>(null);
    const [loading, setLoading] = useState(() => {
        const savedLoading = localStorage.getItem(`${tabId}-loading-purchase-order`);
        return savedLoading !== null ? JSON.parse(savedLoading) : true;
    });
    // Form state - Updated to handle single vs multi-select properly
    const [formData, setFormData] = useState<FormDataType>({
        sort_by: "Code",
        supplier_id: 0,
        category_dates: "Date",
        supplierCodes: [],
        supplierCodeOnPrint: null,
        poStatus: [],
        date_from: null as Date | null,
        date_to: null as Date | null,
        pv_date: new Date(),
        bank: null,
        amount_to_pay: 0,
        current_credit: 0,
        credit_used: 0,
        currency: "",
    });
    const [currentPage, setCurrentPage] = useState(() => {
        const metaKey = `${tabId}-cached-meta-purchase-order`;
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
        const metaKey = `${tabId}-cached-meta-purchase-order`;
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
        const cached = localStorage.getItem(`${tabId}-cached-meta-purchase-order`);
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
    const isSupplierIdUnique = (orders: any[]): boolean => {
        const supplierIds = orders.map((order) => order.supplier_id);
        const uniqueSupplierIds = new Set(supplierIds);
        return uniqueSupplierIds.size === 1;
    };
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
                const data = supplierInvoiceList.find((po) => po.id === tableId);
                // Save to state
                if (!data?.details) {
                    setPODetailsMap((prev) => ({ ...prev, [tableId]: null }));
                    return;
                }
                const details: DetailsExpanded[] = data.details;
                setPODetailsMap((prev) => ({ ...prev, [tableId]: details }));
            });
            setExpandedRows(checkedIds);
        }
    }, [tabId, supplierInvoiceList]);

    useEffect(() => {
        const channel = PusherEcho.channel("ap-channel");
        channel.listen(".ap-event", () => {
            const defaultFilters = {
                search: searchTerm,
                supplier_codes: formData.sort_by === "Code" ? formData.supplierCodes.map((c) => c.value) : [],
                postatus: formData.poStatus.map((p) => p.value),
                date_from: formData.date_from,
                date_to: formData.date_to,
                category_dates: formData.category_dates,
            };
            fetchSupplierInvoice(currentPage, itemsPerPage, defaultFilters);
        });
        return () => {
            PusherEcho.leave("ap-channel");
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
                loadBanks();
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
        const SupplierKey = `${tabId}-cached-purchase-order`;
        const metaKey = `${tabId}-cached-meta-purchase-order`;
        const mountKey = `${tabId}-mount-status-purchase-order`;
        const isFirstMount = sessionStorage.getItem(mountKey) !== "mounted";
        const defaultFilters = {
            search: searchTerm,
            supplier_codes: formData.sort_by === "Code" ? formData.supplierCodes.map((c) => c.value) : [],
            postatus: formData.poStatus.map((p) => p.value),
            date_from: formData.date_from,
            date_to: formData.date_to,
            category_dates: formData.category_dates,
        };
        if (isFirstMount) {
            sessionStorage.setItem(mountKey, "mounted");
            fetchSupplierInvoice(currentPage, itemsPerPage, defaultFilters);
            return;
        }
        const cachedSuppliersRaw = localStorage.getItem(SupplierKey);
        const cachedMetaRaw = localStorage.getItem(metaKey);

        if (!cachedSuppliersRaw || !cachedMetaRaw) {
            fetchSupplierInvoice(currentPage, itemsPerPage, defaultFilters);
            return;
        }

        try {
            const cachedMeta = JSON.parse(cachedMetaRaw);
            const cachedSuppliers = JSON.parse(cachedSuppliersRaw);

            const isCacheValid = cachedMeta.page === currentPage && cachedMeta.perPage === itemsPerPage && JSON.stringify(cachedMeta.search) === JSON.stringify(defaultFilters.search);

            if (isCacheValid) {
                setSupplierInvoice(cachedSuppliers);
                setTotalPages(cachedMeta.totalPages);
                setLoading(false);
                localStorage.setItem(`${tabId}-loading-purchase-order`, JSON.stringify(false));
                return;
            }
        } catch (err) {
            console.warn("Failed to parse cached meta:", err);
        }

        fetchSupplierInvoice(currentPage, itemsPerPage, defaultFilters);
    }, [currentPage, itemsPerPage, searchTerm, tabId]);

    useEffect(() => {
        if (selectedSupplierInvoice.length === 0) {
            setDisableCreatePV(true);
            return;
        }
        let isCountPaid = 0;
        const selectedRow = supplierInvoiceList.filter((product) => selectedSupplierInvoice.includes(product.id));
        const supplierIds = selectedRow.map((row) => row.supplier_id);
        selectedRow.forEach((element) => {
            if (element.invoice_status_id == 1) {
                isCountPaid++;
            }
        });
        if (isCountPaid > 0) {
            setDisableCreatePV(true);
        } else {
            const uniqueSuppliers = new Set(supplierIds);
            if (uniqueSuppliers.size > 1) {
                setDisableCreatePV(true);
            } else {
                setDisableCreatePV(false);
            }
        }
    }, [selectedSupplierInvoice]);

    useEffect(() => {
        const handleEsc = (event: any) => {
            if (event.key === "Escape") {
                if (showCreatePV && !creditsPopup) {
                    setShowCreatePV(false);
                }
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
    }, [creditsPopup, showAdvanceSearch, showCreatePV, showDateRange]);
    useEffect(() => {
        setSelectedData([formData.amount_to_pay]);
    }, [formData.amount_to_pay]);

    const fetchSupplierInvoice = async (page = currentPage, perPage = itemsPerPage, filters: FilterParams = { search: "" }) => {
        try {
            if (loading) {
                setLoading(true);
            }
            localStorage.setItem(`${tabId}-loading-purchase-order`, JSON.stringify(true));
            const paginatedData = await supplierInvoiceService.getAllSupplierInvoices(page, perPage, filters);
            setSupplierInvoice(paginatedData.data);
            setTotalPages(paginatedData.last_page);
            setPreorderFooter2(paginatedData.footer2);
            localStorage.setItem(`${tabId}-cached-purchase-order`, JSON.stringify(paginatedData.data));
            localStorage.setItem(
                `${tabId}-cached-meta-purchase-order`,
                JSON.stringify({
                    page,
                    perPage,
                    filters,
                    totalPages: paginatedData.last_page,
                    totalItems: paginatedData.total,
                })
            );
        } catch (err) {
            console.error("Error fetching preorder:", err);
        } finally {
            setLoading(false);
            localStorage.setItem(`${tabId}-loading-purchase-order`, JSON.stringify(false));
        }
    };
    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            onSelectedSupplierInvoiceChange(supplierInvoiceList.map((p) => p.id).filter(Boolean) as number[]);
        } else {
            onSelectedSupplierInvoiceChange([]);
        }
    };
    const handleDateFrom = useCallback((dates: Date[]) => {
        setFormData((prev) => ({ ...prev, date_from: dates[0] ?? null }));
    }, []);
    const handleDatePV = useCallback((dates: Date[]) => {
        setFormData((prev) => ({ ...prev, pv_date: dates[0] ?? null }));
    }, []);
    const handleDateTo = useCallback((dates: Date[]) => {
        setFormData((prev) => ({ ...prev, date_to: dates[0] ?? null }));
    }, []);
    const statusMap: Record<string, { color: string }> = {
        1: { color: "bg-emerald-600 bg-opacity-20 text-emerald-400 uppercase" },
        2: { color: "bg-cyan-600 bg-opacity-20 text-cyan-300 uppercase" },
        3: { color: "bg-yellow-500 bg-opacity-20 text-yellow-300 uppercase" },
        5: { color: "bg-red-600 bg-opacity-20 text-red-400 uppercase" },
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
            postatus: formData.poStatus.map((p) => p.value),
            date_from: formData.date_from,
            date_to: formData.date_to,
            category_dates: formData.category_dates,
        };
        fetchSupplierInvoice(1, itemsPerPage, filters);
    };
    const handleReset = () => {
        setFormData({
            ...formData,
            date_from: null,
            date_to: null,
            category_dates: "Date",
            sort_by: "Code",
            supplierCodes: [],
            poStatus: [],
        });
        setLoading(true);
        setActiveAdvanceSearch(false);
        setShowDropdown(false);
        setSearchTerm("");
        setCurrentPage(1);
        setItemsPerPage(15);
        fetchSupplierInvoice(1, 15, {
            search: "",
            supplier_codes: [],
            postatus: [],
            date_from: null,
            date_to: null,
            category_dates: "Date",
        });
    };
    const handleSelectSingle = (supplierId: number, checked: boolean) => {
        if (checked) {
            onSelectedSupplierInvoiceChange([...selectedSupplierInvoice, supplierId]);
        } else {
            onSelectedSupplierInvoiceChange(selectedSupplierInvoice.filter((id) => id !== supplierId));
        }
    };
    const handleVoidSelected = async () => {
        if (selectedSupplierInvoice.length === 0) {
            showErrorToast(translations["Please click checkbox to select row"]);
            return;
        }
        let apInvoiceIdArr: any = [];
        const selectedSupplierInvoices = supplierInvoiceList.filter((product) => selectedSupplierInvoice.includes(product.id));
        const confirmed = await showConfirm(translations["Void Record(s)"], translations["alert_message_38"], translations["Yes"], translations["Cancel"]);
        if (!confirmed) return;

        selectedSupplierInvoices.forEach((element) => {
            apInvoiceIdArr.push(element.id);
        });
        try {
            const res = await supplierInvoiceService.voidSupplierInvoice(apInvoiceIdArr);
            if (res.token === "Error") {
                showErrorToast(res.message);
                return;
            }
            onSelectedSupplierInvoiceChange([]);
            fetchSupplierInvoice(currentPage, itemsPerPage, searchTerm);
            showSuccessToast(translations["Record(s) Voided"]);
            // localStorage.removeItem(`${poId}-suppInvoice-po-info`);
        } catch (err) {
            showErrorToast(translations["alert_message_18"]);
            console.error("Deletion failed:", err);
        }
    };
    const handleAdvanceSearch = () => {
        let countCodes = 0;
        let countGroups = 0;
        if (formData.sort_by === "Code" && formData.supplierCodes.length > 0) {
            countCodes++;
        }
        let countStatus = formData.poStatus.length;
        // Stop if no filters selected
        if (countCodes === 0 && countGroups === 0 && countStatus === 0) {
            return;
        }
        setLoading(true);
        setActiveAdvanceSearch(true);
        setShowAdvanceSearch(false);
        // Build filter object
        const filters = {
            search: "",
            supplier_codes: formData.sort_by === "Code" ? formData.supplierCodes.map((c) => c.value) : [],
            postatus: formData.poStatus.map((p) => p.value),
            date_from: formData.date_from,
            date_to: formData.date_to,
            category_dates: formData.category_dates,
        };
        fetchSupplierInvoice(1, itemsPerPage, filters);
    };
    const handleRowClick = (e: React.MouseEvent, supplierId: number) => {
        // Prevent navigation if clicking on checkboxes or toggle switches
        const target = e.target as HTMLElement;
        if (target.closest("input") || target.closest("label") || target.closest("[data-copy-button]")) {
            return;
        }
        onSupplierInvoiceSelect(supplierId, supplierId == 0 ? "new" : "edit");
    };
    const hanleAddNewDepositPV = () => {
        if (selectedSupplierInvoice.length === 0) {
            showErrorToast(translations["Please click checkbox to select row"]);
            return;
        }
        const selectedSupplierInvoices = supplierInvoiceList.filter((product) => selectedSupplierInvoice.includes(product.id));
        const unique = isSupplierIdUnique(selectedSupplierInvoices); // e.g., your array
        if (!unique) {
            showErrorToast(translations["Please select one customer only"]);
            return;
        }
        let totalDeposit = 0;
        let totalCredit = 0;
        let currency = "";
        let bank = 0;
        let supplier_id = 0;
        selectedSupplierInvoices.forEach((element) => {
            const balance = element.balance || 0;
            const credit = element.credit || 0;
            totalDeposit += balance;
            totalCredit = credit;
            currency = element.currency || "";
            bank = element.bank || 0;
            supplier_id = element.supplier_id || 0;
        });
        const selectedOption = convertToSingleOption(Number(bank), banksOptions);
        setFormData((prev) => ({
            ...prev,
            currency: currency,
            amount_to_pay: totalDeposit,
            current_credit: totalCredit,
            credit_used: 0,
            supplier_id: supplier_id,
            bank: selectedOption,
        }));
        setShowCreatePV(true);
    };
    const handlePopupCredits = async () => {
        try {
            const paginatedData = await supplierInvoiceService.getSupplierCredit(1);
            setCreditSuppliers(paginatedData);
            setShowCreditsPopup(true);
        } catch (err) {
            console.error("Error fetching preorder:", err);
        }
    };
    const handleSubmitCredit = async () => {
        let totalCreditUsed = 0;
        selectedData.forEach((val) => {
            totalCreditUsed += val;
        });
        if (totalCreditUsed > formData.amount_to_pay) {
            showErrorToast(translations["Invalid Amount"]);
            return;
        }
        const newDepositToPay = formData.amount_to_pay - totalCreditUsed;
        setFormData((prev) => ({
            ...prev,
            amount_to_pay: newDepositToPay,
            credit_used: totalCreditUsed,
        }));
        setShowCreditsPopup(false);
    };
    const handleCreatePV = () => {
        const depositToPay = formData.amount_to_pay;
        if (depositToPay > 0) {
            handleSavePVAdvance("PV");
        } else {
            handleSavePVAdvance("JV");
        }
    };
    const handleSavePVAdvance = async (type: string) => {
        setSaveCreatePV(true);
        const data = new FormData();
        const selectedSupplierInvoices = supplierInvoiceList.filter((product) => selectedSupplierInvoice.includes(product.id));
        Object.keys(formData).forEach((key) => {
            let value = formData[key as keyof typeof formData];
            if (value !== null && value !== undefined) {
                data.append(key, value.toString());
            }
            if (value instanceof Date) {
                data.append(key, formatDateToCustom(value));
            }
            if (value !== null && typeof value === "object" && "value" in value) {
                data.append(key, (value as OptionType).value);
            }
        });
        selectedSupplierInvoices.forEach((list, index) => {
            if (list.ap_number) {
                data.append(`ap_numbers[${index}]`, list.ap_number);
            }
        });
        try {
            const result = await supplierInvoiceService.createPVInvoice(data, type);
            if (result.token === "Error") {
                setSaveCreatePV(false);
                showErrorToast(translations[result.message] + " " + result.message2);
                return;
            }
            onSelectedSupplierInvoiceChange([]);
            const defaultFilters = {
                search: searchTerm,
                supplier_codes: formData.sort_by === "Code" ? formData.supplierCodes.map((c) => c.value) : [],
                postatus: formData.poStatus.map((p) => p.value),
                date_from: formData.date_from,
                date_to: formData.date_to,
                category_dates: formData.category_dates,
            };
            setShowCreatePV(false);
            setSaveCreatePV(false);
            fetchSupplierInvoice(currentPage, itemsPerPage, defaultFilters);
            showSuccessToast(translations[result.message]);
        } catch (error) {
            setSaveCreatePV(false);
            showErrorToast(translations["Failed to save Create PV."] || "Failed to save Create PV.");
        } finally {
            setSaveCreatePV(false);
        }
    };
    const loadAllSupplier = async () => {
        try {
            const list = await fetchSuppliers(); // fetches & returns
            setAllSuppliers(list ?? []); // ✅ manually set state here
        } catch (err) {
            console.error("Failed to fetch loadAllSupplier:", err);
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
    const handleToggleRow = async (tableId: number) => {
        const isExpanded = expanded_PO.includes(tableId);
        const cachedKey = tabId + "_cachedPODetails_" + tableId;
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
                const data = supplierInvoiceList.find((po) => po.id === tableId);
                // Save to state
                if (!data?.details) {
                    console.error("No details found for this PO");
                    setPODetailsMap((prev) => ({ ...prev, [tableId]: null }));
                    return;
                }
                const details: DetailsExpanded[] = data.details;
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
                    <div className="p-2 border-t border-[#ffffff1a] flex justify-end space-x-4">
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
                    <div className="p-2 border-t border-[#ffffff1a] flex justify-end space-x-4">
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
    const renderPrintBySupplier = () => {
        if (!showPrintBySupplier) return null;
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-[#19191c] rounded-xl border border-[#ffffff1a] w-[25vw] h-auto flex flex-col">
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-[#ffffff1a]">
                        <h2 className="text-xl font-bold text-white">{translations["Print"]}</h2>
                        <button
                            onClick={() => setShowPrintBySupplier(false)}
                            className="p-2 hover:bg-gray-700 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500"
                            aria-label={translations["Close"]}
                        >
                            <X className="h-6 w-6 text-white" />
                        </button>
                    </div>
                    {/* Content */}
                    <div className="grid grid-cols-12 gap-4 p-4">
                        {/* First Row: Sort By, Customer Code */}
                        <div className="col-span-12">
                            <label className="text-gray-400 text-sm">{translations["Supplier Code"]}</label>
                            <Select
                                classNamePrefix="react-select"
                                value={formData.supplierCodeOnPrint}
                                onChange={(selected) => {
                                    setFormData({ ...formData, supplierCodeOnPrint: selected as OptionType });
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
                        </div>
                    </div>
                    {/* Footer */}
                    <div className="p-2 border-t border-[#ffffff1a] flex justify-end space-x-4">
                        <button
                            onClick={() => setShowPrintBySupplier(false)}
                            className="px-2 py-2 bg-gray-700 hover:bg-gray-600 rounded text-white transition focus:outline-none focus:ring-2 focus:ring-cyan-500"
                        >
                            {translations["Close"]}
                        </button>
                        <button className="px-2 py-2 bg-cyan-600 hover:bg-cyan-500 rounded text-white transition focus:outline-none focus:ring-2 focus:ring-cyan-500">{translations["Print"]}</button>
                    </div>
                </div>
            </div>
        );
    };
    const renderCreatePV = () => {
        if (!showCreatePV) return null;
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-[#19191c] rounded-xl border border-[#ffffff1a] w-[25vw] h-auto flex flex-col">
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-[#ffffff1a]">
                        <h2 className="text-xl font-bold text-white">{translations["Create Payment Voucher"]}</h2>
                        <button
                            onClick={() => setShowCreatePV(false)}
                            className="p-2 hover:bg-gray-700 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500"
                            aria-label={translations["Close"]}
                        >
                            <X className="h-6 w-6 text-white" />
                        </button>
                    </div>
                    {/* Content */}
                    <div className="p-4">
                        <div className="col-span-12 md:col-span-12">
                            <div className={`flex items-center gap-4 mb-2`}>
                                <label className="w-[30%] text-gray-400 text-sm">{translations["Date"]}</label>
                                <Flatpickr
                                    onChange={handleDatePV}
                                    options={{
                                        dateFormat: "M d Y",
                                        defaultDate: formData.pv_date || undefined,
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
                                <label className="w-[30%] text-gray-400 text-sm">{translations["Amount To Pay"]}</label>
                                <NumericFormat
                                    value={formData.amount_to_pay === 0 ? "" : formData.amount_to_pay}
                                    decimalSeparator="."
                                    decimalScale={2}
                                    fixedDecimalScale
                                    allowNegative={true}
                                    prefix={`${formData.currency} `}
                                    placeholder="0.00"
                                    onValueChange={({ floatValue }) => {
                                        setFormData((prev) => ({
                                            ...prev,
                                            amount_to_pay: Number(floatValue) ?? "0.00",
                                        }));
                                    }}
                                    className="w-[70%] flex-1 px-3 py-2 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm rounded-md"
                                />
                            </div>
                            <div className={`flex items-center gap-4 mb-2 ${formData.current_credit === 0 ? "hidden" : ""}`}>
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
                                        onClick={handlePopupCredits}
                                        className="px-2 py-2 bg-cyan-600 text-white !rounded-tr-md !rounded-br-md !rounded-tl-none !rounded-bl-none hover:bg-cyan-700 flex items-center justify-center border border-[#ffffff1a] border-l-0"
                                    >
                                        <Search className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                            <div className={`flex items-center gap-4 mb-2 ${formData.current_credit === 0 ? "hidden" : ""}`}>
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
                            onClick={() => setShowCreatePV(false)}
                            className="px-2 py-2 bg-gray-700 hover:bg-gray-600 rounded text-white transition focus:outline-none focus:ring-2 focus:ring-cyan-500"
                        >
                            {translations["Close"]}
                        </button>
                        <button
                            disabled={saveCreatePV}
                            onClick={handleCreatePV}
                            className="px-2 py-2 bg-cyan-600 hover:bg-cyan-500 rounded text-white transition focus:outline-none focus:ring-2 focus:ring-cyan-500"
                        >
                            {translations["Submit"]}
                        </button>
                    </div>
                </div>
            </div>
        );
    };
    const renderCreditsPopup = () => {
        if (!creditsPopup) return null;
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-[#19191c] rounded-xl border border-[#ffffff1a] w-[60vw] h-auto flex flex-col">
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-[#ffffff1a]">
                        <div className="flex items-center space-x-4">
                            <h2 className="text-xl font-bold text-white">{translations["Deposit / Credit Note"]}</h2>
                        </div>
                        <div className="flex items-center space-x-4">
                            <button
                                onClick={() => {
                                    setShowCreditsPopup(false);
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
                                <fieldset className="border border-[#ffffff1a] rounded-lg p-4 mb-2">
                                    <legend className="text-white text-left px-3 py-1 border border-[#ffffff1a] rounded-md bg-[#19191c]">
                                        {translations["Credit Note Information"] || "Credit Note Information"} :
                                    </legend>
                                    <table className="w-full border">
                                        <thead className="sticky top-0 z-[1]" style={{ backgroundColor: "#1f2132" }}>
                                            <tr className="border-b" style={{ borderColor: "#2d2d30" }}>
                                                <th className="w-[15%] text-left py-2 px-2 text-gray-400 text-sm">{translations["Account Code"]}</th>
                                                <th className="w-[25%] text-left py-2 px-2 text-gray-400 text-sm">{translations["Account Name"]}</th>
                                                <th className="w-[25%] text-center py-2 px-2 text-gray-400 text-sm">{translations["Currency"]}</th>
                                                <th className="w-[15%] text-center py-2 px-2 text-gray-400 text-sm">{translations["Amount"]}</th>
                                                <th className="w-[20%] text-center py-2 px-2 text-gray-400 text-sm"></th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {creditSuppliers.map((item, index) => (
                                                <React.Fragment key={item.id || index}>
                                                    <tr
                                                        key={item.id || index}
                                                        className={`clickable border-b hover:bg-gray-700 hover:bg-opacity-30 transition-colors cursor-pointer`}
                                                        style={{ borderColor: "#40404042" }}
                                                    >
                                                        <td className="py-2 px-2 text-gray-400 text-left text-custom-sm">{item.account_code}</td>
                                                        <td className="py-2 px-2 text-gray-400 text-left text-custom-sm">{lang === "en" ? item.account_name_en : item.account_name_cn}</td>
                                                        <td className="py-2 px-2 text-gray-400 text-center text-custom-sm">{item.currency}</td>
                                                        <td className="py-2 px-2 text-gray-400 text-center text-custom-sm">{formatMoney(item.amount)}</td>
                                                        <td className="py-2 px-2 text-gray-400 text-center text-custom-sm">
                                                            <input
                                                                type="number"
                                                                value={selectedData[index] !== undefined ? selectedData[index] : index === 0 ? formData.amount_to_pay : ""}
                                                                onChange={(e) => {
                                                                    const value = Number(e.target.value);
                                                                    setSelectedData((prev) => {
                                                                        const updated = [...prev];
                                                                        updated[index] = value;
                                                                        return updated;
                                                                    });
                                                                }}
                                                                className="flex-1 px-3 py-2 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm"
                                                            />
                                                        </td>
                                                    </tr>
                                                </React.Fragment>
                                            ))}
                                        </tbody>
                                    </table>
                                </fieldset>
                            </div>
                        </div>
                    </div>
                    {/* Footer */}
                    <div className="p-2 border-t border-[#ffffff1a] flex justify-end space-x-2">
                        <button onClick={() => setShowCreditsPopup(false)} className="px-2 py-2 bg-gray-700 hover:bg-gray-600 rounded text-white transition">
                            {translations["Create Later"]}
                        </button>
                        <button onClick={() => handleSubmitCredit()} className={`px-2 py-2 bg-cyan-600 hover:bg-cyan-500 rounded text-white transition`}>
                            {translations["Create Payment Voucher"]}
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
                            <button
                                className="ml-2 px-2 py-2 border rounded-lg text-white transition-colors flex items-center space-x-px hover:bg-cyan-600 text-sm"
                                style={{ backgroundColor: "#0891b2", borderColor: "#2d2d30", marginLeft: "5px" }}
                            >
                                <span>{translations["Accounts Payable Invoice"]}</span>
                            </button>
                            <button
                                onClick={() => onChangeView("paidItemNotReceived")}
                                className="ml-2 px-2 py-2 border rounded-lg text-white transition-colors flex items-center space-x-px hover:bg-gray-600 text-sm"
                                style={{ backgroundColor: "#2d2d30", borderColor: "#2d2d30", marginLeft: "5px" }}
                            >
                                <span>{translations["Paid Item Not Received"]}</span>
                            </button>
                            <button
                                onClick={() => onChangeView("unpaidItemReceived")}
                                className="ml-2 px-2 py-2 border rounded-lg text-white transition-colors flex items-center space-x-px hover:bg-gray-600 text-sm"
                                style={{ backgroundColor: "#2d2d30", borderColor: "#2d2d30", marginLeft: "5px" }}
                            >
                                <span>{translations["Unpaid Items Received"]}</span>
                            </button>
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
                                    onClick={hanleAddNewDepositPV}
                                    disabled={disabledCreatePV || selectedSupplierInvoice.length === 0}
                                    className="px-2 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors flex items-center space-x-1 text-sm"
                                >
                                    <span>{translations["Create Payment Voucher"]}</span>
                                </button>
                                <button
                                    onClick={(e) => handleRowClick(e, 0)}
                                    className="px-2 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors flex items-center space-x-1 text-sm"
                                >
                                    <span>{translations["Add New"]}</span>
                                </button>
                                <button
                                    onClick={() => {
                                        if (selectedSupplierInvoice.length === 0) {
                                            showErrorToast(translations["Please click checkbox to select row"]);
                                            return;
                                        }
                                        exportRef.current?.triggerExport();
                                    }}
                                    disabled={selectedSupplierInvoice.length === 0}
                                    className="px-2 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors flex items-center space-x-1 text-sm"
                                >
                                    <span>{translations["Print"]}</span>
                                </button>
                                <button
                                    disabled={selectedSupplierInvoice.length === 0}
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
                                    <th className="w-[3%] text-left py-1 px-2 text-gray-400 text-sm w-12"></th>
                                    <th className="w-[3%] text-left py-1 px-2 text-gray-400 text-sm w-12">
                                        <div className="flex items-center justify-center h-full">
                                            <CustomCheckbox
                                                checked={selectedSupplierInvoice.length === supplierInvoiceList.length && supplierInvoiceList.length > 0}
                                                onChange={(checked) => handleSelectAll(checked)}
                                            />
                                        </div>
                                    </th>
                                    <th className="w-[9%] text-left py-2 px-2 text-gray-400 text-sm">{translations["Creation Date"]}</th>
                                    <th className="w-[9%] text-left py-2 px-2 text-gray-400 text-sm">{translations["Payment Date"]}</th>
                                    <th className="w-[15%] text-left py-2 px-2 text-gray-400 text-sm">{translations["A/P Invoice No."]}</th>
                                    <th className="w-[12%] text-left py-2 px-2 text-gray-400 text-sm">{translations["PV No"]}</th>
                                    <th className="w-[10%] text-left py-2 px-2 text-gray-400 text-sm">{translations["Supplier"]}</th>
                                    <th className="w-[16%] text-left py-2 px-2 text-gray-400 text-sm">{translations["Supplier Name"]}</th>
                                    <th className="w-[13%] text-center py-2 px-2 text-gray-400 text-sm">{translations["Total"]}</th>
                                    <th className="w-[10%] text-center py-2 px-2 text-gray-400 text-sm">{translations["Invoice Status"]}</th>
                                </tr>
                            </thead>
                            {loading ? (
                                <LoadingSpinnerTbody rowsCount={itemsPerPage} />
                            ) : (
                                <tbody>
                                    {supplierInvoiceList.length === 0 ? (
                                        <tr>
                                            <td colSpan={10} className="py-2 px-2 text-center text-gray-400 text-sm border border-[#40404042]">
                                                {translations["No Record Found"]}.
                                            </td>
                                        </tr>
                                    ) : (
                                        supplierInvoiceList.map((list, index) => (
                                            <React.Fragment key={list.id || index}>
                                                <tr
                                                    key={list.id || index}
                                                    onClick={(e) => handleRowClick(e, list.id)}
                                                    className={`clickable border-b hover:bg-gray-700 hover:bg-opacity-30 transition-colors cursor-pointer ${
                                                        selectedSupplierInvoice.includes(list.id as number) ? "bg-gray-700 bg-opacity-30" : ""
                                                    }`}
                                                    style={{ borderColor: "#40404042" }}
                                                >
                                                    <td className="py-2 px-2 text-gray-400 text-center text-custom-sm" onClick={(e) => e.stopPropagation()}>
                                                        <button
                                                            onClick={() => handleToggleRow(list.id)}
                                                            className={`px-1 py-1 ${
                                                                expanded_PO.includes(list.id) ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"
                                                            } text-white rounded-lg transition-colors text-xs`}
                                                        >
                                                            {expanded_PO.includes(list.id) ? <Minus size={16} /> : <Plus size={16} />}
                                                        </button>
                                                    </td>
                                                    <td className="py-2 px-2" onClick={(e) => e.stopPropagation()}>
                                                        <div className="flex items-center justify-center h-full">
                                                            <CustomCheckbox
                                                                checked={selectedSupplierInvoice.includes(list.id as number)}
                                                                onChange={(checked) => handleSelectSingle(list.id as number, checked)}
                                                            />
                                                        </div>
                                                    </td>
                                                    <td className="py-2 px-2 text-gray-400 text-left text-custom-sm">{formatDate(list.ap_date, lang)}</td>
                                                    <td className="py-2 px-2 text-gray-400 text-left text-custom-sm">{formatDate(list.payment_date, lang) || translations["N.A."]}</td>
                                                    <td className="py-2 px-2 text-gray-400 text-left text-custom-sm">
                                                        <div className="group flex items-center">
                                                            <p className="text-gray-400 text-custom-sm">{highlightMatch(list.ap_number, searchTerm)}</p>
                                                            <CopyToClipboard text={list.ap_number ?? ""} />
                                                        </div>
                                                    </td>
                                                    <td className="py-2 px-2 text-gray-400 text-left text-custom-sm">
                                                        <div className="group flex items-center">
                                                            <p className="text-gray-400 text-custom-sm">{highlightMatch(list.pv_number, searchTerm) || translations["N.A."]}</p>
                                                            <CopyToClipboard text={list.pv_number ?? ""} />
                                                        </div>
                                                    </td>
                                                    <td className="py-2 px-2 text-gray-400 text-left text-custom-sm">
                                                        <div className="group flex items-center">
                                                            <p className="text-gray-400 text-custom-sm">{highlightMatch(list.supplier_code, searchTerm)}</p>
                                                            <CopyToClipboard text={list.supplier_code ?? ""} />
                                                        </div>
                                                    </td>
                                                    <td className="py-2 px-2 text-gray-400 text-left text-custom-sm">
                                                        <div className="group flex items-center">
                                                            <p className="text-gray-400 text-custom-sm">{highlightMatch(lang === "en" ? list.suppliername_en : list.suppliername_cn, searchTerm)}</p>
                                                            <CopyToClipboard text={lang === "en" ? list.suppliername_en ?? "" : list.suppliername_cn ?? ""} />
                                                        </div>
                                                    </td>
                                                    <td className="py-2 px-2 text-gray-400 text-center text-custom-sm">
                                                        {list.currency}
                                                        <br />
                                                        {formatMoney(list.total)}
                                                    </td>
                                                    <td className="py-2 px-2 text-gray-400 text-center text-custom-sm">
                                                        <span className={`px-2 py-1 rounded-full text-xs text-custom-sm ${getStatusColor(list.invoice_status_id)}`}>
                                                            {lang === "en" ? list.status_value_en : list.status_value_cn}
                                                        </span>
                                                    </td>
                                                </tr>

                                                {/* Expandable PO Details */}
                                                {expanded_PO.includes(list.id) && (
                                                    <tr>
                                                        <td colSpan={10} className="py-2 px-2">
                                                            <table className="w-full" style={{ backgroundColor: "#060818" }}>
                                                                <thead className="sticky top-0 z-[1] py-1 px-4" style={{ backgroundColor: "#1f2132" }}>
                                                                    <tr className="border-b" style={{ borderColor: "#2d2d30" }}>
                                                                        <th className="w-auto text-left py-2 px-2 text-gray-400 text-sm w-12">{translations["Product Code"]}</th>
                                                                        <th className="w-auto text-left py-2 px-2 text-gray-400 text-sm w-12">{translations["Product Name"]}</th>
                                                                        <th className="w-auto text-left py-2 px-2 text-gray-400 text-sm w-12">{translations["PO Number"]}</th>
                                                                        <th className="w-auto text-center py-2 px-2 text-gray-400 text-sm w-12">{translations["Qty"]}</th>
                                                                        <th className="w-auto text-center py-2 px-2 text-gray-400 text-sm w-12">{translations["Price"]}</th>
                                                                        <th className="w-auto text-center py-2 px-2 text-gray-400 text-sm w-12">{translations["Total"]}</th>
                                                                        <th className="w-auto text-center py-2 px-2 text-gray-400 text-sm w-12">{translations["Received Date"]}</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody>
                                                                    {orderDetailsMap[list.id] && orderDetailsMap[list.id]!.length > 0 ? (
                                                                        orderDetailsMap[list.id]!.map((detail, i) => (
                                                                            <tr key={detail.id || i}>
                                                                                <td className="py-2 px-2 text-gray-400 text-left text-custom-sm border border-[#40404042]">
                                                                                    <div className="group flex items-center">
                                                                                        <p className="text-gray-400 text-custom-sm">{highlightMatch(detail.product_code, searchTerm)}</p>
                                                                                        <CopyToClipboard text={detail.product_code} />
                                                                                    </div>
                                                                                </td>
                                                                                <td className="py-2 px-2 text-gray-400 text-left text-custom-sm border border-[#40404042]">
                                                                                    {highlightMatch(lang === "en" ? detail.product_title_en : detail.product_title_cn, searchTerm)}
                                                                                </td>
                                                                                <td className="py-2 px-2 text-gray-400 text-left text-custom-sm border border-[#40404042]">
                                                                                    <div className="group flex items-center">
                                                                                        <p className="text-gray-400 text-custom-sm">{highlightMatch(detail.po_number, searchTerm)}</p>
                                                                                        <CopyToClipboard text={detail.po_number} />
                                                                                    </div>
                                                                                </td>
                                                                                <td className="py-2 px-2 text-gray-400 text-center text-custom-sm border border-[#40404042]">{detail.qty}</td>
                                                                                <td className="py-2 px-2 text-gray-400 text-center text-custom-sm border border-[#40404042]">
                                                                                    {detail.currency} {formatMoney(detail.price)}
                                                                                </td>
                                                                                <td className="py-2 px-2 text-gray-400 text-center text-custom-sm border border-[#40404042]">
                                                                                    {detail.currency} {formatMoney(detail.total)}
                                                                                </td>
                                                                                <td className="py-2 px-2 text-gray-400 text-center text-custom-sm border border-[#40404042]">
                                                                                    {formatDate(detail.received_date, lang)}
                                                                                </td>
                                                                            </tr>
                                                                        ))
                                                                    ) : (
                                                                        <tr>
                                                                            <td colSpan={7} className="py-2 px-2 text-center text-gray-400 text-sm border border-[#40404042]">
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
                            baseName="SupplierInvoice"
                            ids={selectedSupplierInvoice.length > 0 ? selectedSupplierInvoice : supplierInvoiceList.map((p) => p.id)}
                            language={lang}
                        />
                        <div className="hidden">
                            <ExportReportSelector ref={exportRef} formats={["odt"]} baseName="DSSupplierSingleInvoices_Report" ids={selectedSupplierInvoice} language={lang} />
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
                {renderPrintBySupplier()}
                {renderCreatePV()}
                {renderCreditsPopup()}
            </div>
        </div>
    );
};

export default SupplierInvoiceList;
