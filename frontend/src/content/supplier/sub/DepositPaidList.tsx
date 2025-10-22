import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { purchaseOrderService, ApiPurchaseOrder, DetailsExpanded, FilterParams } from "@/services/purchaseOrderService";
import { useLanguage } from "@/context/LanguageContext";
import CustomCheckbox from "@/components/CustomCheckbox";
import { showSuccessToast, showErrorToast } from "@/utils/toast";
import Pagination from "@/components/Pagination";
import ItemsPerPageSelector from "@/components/ItemsPerPageSelector";
import CopyToClipboard from "@/components/CopyToClipboard";
import { X, Minus, Plus, ChevronDown, Search } from "lucide-react";
import PusherEcho from "@/utils/echo";
import Select from "react-select";
import Flatpickr from "react-flatpickr";
import { getFlatpickrLocale, formatDateToCustom } from "@/utils/flatpickrLocale";
import { NumericFormat } from "react-number-format";
import { fetchBank, OptionType, convertToSingleOption } from "@/utils/fetchDropdownData";
import { baseCurrency, DropdownData, formatDate, formatMoney, selectStyles } from "@/utils/globalFunction";
import { highlightMatch } from "@/utils/highlightMatch";
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
                </tr>
            ))}
        </tbody>
    );
};
const MemoizedPagination = React.memo(Pagination);
const MemoizedItemsPerPageSelector = React.memo(ItemsPerPageSelector);
interface DepositPaidListProps {
    tabId: string;
    onChangeView: (view: "list" | "details" | "depositPaid") => void;
    selectedPurchaseOrder: number[];
    onSelectedPurchaseOrderChange: (selected: number[]) => void;
    expandedRows: number[];
    onExpandedRowsChange: (expanded: number[]) => void;
}
type FormDataType = {
    supplier_id: number;
    sort_by: string;
    pv_date: Date | null;
    bank: OptionType | null;
    deposit_to_pay: number;
    current_credit: number;
    credit_used: number;
    currency: string;
};
interface POFooter {
    currency: string;
    po_amount: number;
}
// localStorage.clear();
const DepositPaidList: React.FC<DepositPaidListProps> = ({ tabId, onChangeView, selectedPurchaseOrder, onSelectedPurchaseOrderChange }) => {
    const { translations, lang } = useLanguage();
    const [depositPaidList, setDepositPaid] = useState<ApiPurchaseOrder[]>([]);
    const [creditSuppliers, setCreditSuppliers] = useState<ApiPurchaseOrder[]>([]);
    const [totalPages, setTotalPages] = useState(1);
    const locale = getFlatpickrLocale(translations);
    const pageSizeOptions = useMemo(() => [15, 20, 50, -1], []);
    const [expanded_DepositPaid, setExpandedRows] = useState<number[]>([]);
    const [orderDetailsMap, setPODetailsMap] = useState<Record<number, DetailsExpanded[] | null>>({});
    const [showDropdown, setShowDropdown] = useState(false);
    const [showDateRange, setShowDateRange] = useState(false);
    const [showAdvanceSearch, setShowAdvanceSearch] = useState(false);
    const [showCreatePV, setShowCreatePV] = useState(false);
    const [banksData, setBanksData] = useState<DropdownData[]>([]);
    const [creditsPopup, setShowCreditsPopup] = useState(false);
    const [selectedData, setSelectedData] = useState<number[]>([]);
    const throttleTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const [preorderFooter2, setPreorderFooter2] = useState<POFooter[]>([]); // Changed to array
    const [loading, setLoading] = useState(() => {
        const savedLoading = localStorage.getItem(`${tabId}-loading-deposit-paid`);
        return savedLoading !== null ? JSON.parse(savedLoading) : true;
    });
    // Form state - Updated to handle single vs multi-select properly
    const [formData, setFormData] = useState<FormDataType>({
        supplier_id: 0,
        sort_by: "Default",
        pv_date: new Date(), // Set current date as Date object, not string
        bank: null,
        deposit_to_pay: 0,
        current_credit: 0,
        credit_used: 0,
        currency: "",
    });
    const [currentPage, setCurrentPage] = useState(() => {
        const metaKey = `${tabId}-cached-meta-deposit-paid`;
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
        const metaKey = `${tabId}-cached-meta-deposit-paid`;
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
        const cached = localStorage.getItem(`${tabId}-cached-meta-deposit-paid`);
        if (!cached) return "";
        try {
            const meta = JSON.parse(cached);
            return meta.filters.search || "";
        } catch {
            return "";
        }
    });
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

    // REALTIME
    useEffect(() => {
        const channel = PusherEcho.channel("po-channel");
        channel.listen(".po-event", () => {
            const defaultFilters = {
                search: searchTerm,
                sort_by: formData.sort_by,
            };
            fetchDepositPaid(currentPage, itemsPerPage, defaultFilters);
        });
        return () => {
            PusherEcho.leave("po-channel");
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

                const data = depositPaidList.find((po) => po.id === tableId);

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
    }, [tabId, depositPaidList]);

    useEffect(() => {
        if (tabId) {
            // Clear the previous timeout if it's still pending
            if (throttleTimeout.current) {
                clearTimeout(throttleTimeout.current);
            }
            // Set a new timeout
            throttleTimeout.current = setTimeout(() => {
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
        const SupplierKey = `${tabId}-cached-deposit-paid`;
        const metaKey = `${tabId}-cached-meta-deposit-paid`;
        const mountKey = `${tabId}-mount-status-deposit-paid`;

        const isFirstMount = sessionStorage.getItem(mountKey) !== "mounted";
        const defaultFilters = {
            search: searchTerm,
            sort_by: formData.sort_by,
        };
        if (isFirstMount) {
            sessionStorage.setItem(mountKey, "mounted");
            fetchDepositPaid(currentPage, itemsPerPage, defaultFilters);
            return;
        }

        const cachedSuppliersRaw = localStorage.getItem(SupplierKey);
        const cachedMetaRaw = localStorage.getItem(metaKey);

        if (!cachedSuppliersRaw || !cachedMetaRaw) {
            fetchDepositPaid(currentPage, itemsPerPage, defaultFilters);
            return;
        }

        try {
            const cachedMeta = JSON.parse(cachedMetaRaw);
            const cachedSuppliers = JSON.parse(cachedSuppliersRaw);

            const isCacheValid = cachedMeta.page === currentPage && cachedMeta.perPage === itemsPerPage && JSON.stringify(cachedMeta.search) === JSON.stringify(defaultFilters.search);

            if (isCacheValid) {
                setDepositPaid(cachedSuppliers);
                setTotalPages(cachedMeta.totalPages);
                setLoading(false);
                localStorage.setItem(`${tabId}-loading-deposit-paid`, JSON.stringify(false));
                return;
            }
        } catch (err) {
            console.warn("Failed to parse cached meta:", err);
        }

        fetchDepositPaid(currentPage, itemsPerPage, defaultFilters);
    }, [currentPage, itemsPerPage, searchTerm, tabId]);

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
        setSelectedData([formData.deposit_to_pay]);
    }, [formData.deposit_to_pay]);

    useEffect(() => {
        const defaultFilters = {
            search: searchTerm,
            sort_by: formData.sort_by,
        };
        fetchDepositPaid(currentPage, itemsPerPage, defaultFilters);
        setShowDropdown(false);
    }, [formData.sort_by]);

    const fetchDepositPaid = async (page = currentPage, perPage = itemsPerPage, filters: FilterParams = { search: "" }) => {
        try {
            if (loading) {
                setLoading(true);
            }
            localStorage.setItem(`${tabId}-loading-deposit-paid`, JSON.stringify(true));
            const paginatedData = await purchaseOrderService.getAllDepositPaid(page, perPage, filters);
            setDepositPaid(paginatedData.data);
            setTotalPages(paginatedData.last_page);
            setPreorderFooter2(paginatedData.footer2);
            localStorage.setItem(`${tabId}-cached-deposit-paid`, JSON.stringify(paginatedData.data));
            localStorage.setItem(
                `${tabId}-cached-meta-deposit-paid`,
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
            localStorage.setItem(`${tabId}-loading-deposit-paid`, JSON.stringify(false));
        }
    };
    // Handle select all
    const handleDatePV = useCallback((dates: Date[]) => {
        setFormData((prev) => ({ ...prev, pv_date: dates[0] ?? null }));
    }, []);
    // Handle individual select
    const handleSelectSupplier = (supplierId: number, checked: boolean) => {
        if (checked) {
            onSelectedPurchaseOrderChange([...selectedPurchaseOrder, supplierId]);
        } else {
            onSelectedPurchaseOrderChange(selectedPurchaseOrder.filter((id) => id !== supplierId));
        }
    };
    const hanleAddNewDepositPV = () => {
        if (selectedPurchaseOrder.length === 0) {
            showErrorToast(translations["Please click checkbox to select row"]);
            return;
        }
        const selectedPurchaseOrders = depositPaidList.filter((product) => selectedPurchaseOrder.includes(product.id));
        const unique = isSupplierIdUnique(selectedPurchaseOrders); // e.g., your array
        if (!unique) {
            showErrorToast(translations["Please select one customer only"]);
            return;
        }
        let totalDeposit = 0;
        let totalCredit = 0;
        let currency = "";
        let bank = 0;
        let supplier_id = 0;
        selectedPurchaseOrders.forEach((element) => {
            const deposit = element.deposit || 0;
            const credit = element.credit || 0;
            totalDeposit += deposit;
            totalCredit = credit;
            currency = element.currency || "";
            bank = element.bank || 0;
            supplier_id = element.supplier_id || 0;
        });
        const selectedOption = convertToSingleOption(bank, banksOptions);
        setFormData((prev) => ({
            ...prev,
            currency: currency,
            deposit_to_pay: totalDeposit,
            current_credit: totalCredit,
            credit_used: 0,
            supplier_id: supplier_id,
            bank: selectedOption,
        }));
        setShowCreatePV(true);
    };
    const handlePopupCredits = async () => {
        try {
            const paginatedData = await purchaseOrderService.getSupplierCredit(1);
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
        if (totalCreditUsed > formData.deposit_to_pay) {
            showErrorToast(translations["Invalid Amount"]);
            return;
        }
        const newDepositToPay = formData.deposit_to_pay - totalCreditUsed;
        setFormData((prev) => ({
            ...prev,
            deposit_to_pay: newDepositToPay,
            credit_used: totalCreditUsed,
        }));
        setShowCreditsPopup(false);
    };
    const handleCreatePV = () => {
        const depositToPay = formData.deposit_to_pay;
        if (depositToPay > 0) {
            handleSavePVDeposit("PV");
        } else {
            handleSavePVDeposit("JV");
        }
    };
    const handleSavePVDeposit = async (type: string) => {
        const data = new FormData();
        const selectedPurchaseOrders = depositPaidList.filter((product) => selectedPurchaseOrder.includes(product.id));
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
        selectedPurchaseOrders.forEach((po, index) => {
            if (po.po_number) {
                data.append(`po_numbers[${index}]`, po.po_number);
            }
        });
        try {
            const result = await purchaseOrderService.createPVDeposit(data, type);
            if (result.token === "Error") {
                showErrorToast(translations[result.message] + " " + result.message2);
                return;
            }
            onSelectedPurchaseOrderChange([]);
            const defaultFilters = {
                search: searchTerm,
                sort_by: formData.sort_by,
            };
            setShowCreatePV(false);
            fetchDepositPaid(currentPage, itemsPerPage, defaultFilters);
            showSuccessToast(translations[result.message]);
        } catch (error) {
            showErrorToast(translations["Failed to save Create PV."] || "Failed to save Create PV.");
        } finally {
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
        const isExpanded = expanded_DepositPaid.includes(tableId);
        const cachedKey = `cached-po-details-${tableId}`;
        const expandedKey = tabId + "_expandedKey";
        if (isExpanded) {
            // Collapse row
            const updated = expanded_DepositPaid.filter((id) => id !== tableId);
            setExpandedRows(updated);
            localStorage.setItem(expandedKey, JSON.stringify(updated));
        } else {
            // Expand row
            const updated = [...expanded_DepositPaid, tableId];
            setExpandedRows(updated);
            localStorage.setItem(expandedKey, JSON.stringify(updated));
            try {
                const data = depositPaidList.find((po) => po.id === tableId);
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
                console.error(`Failed to load details for deposit paid ${tableId}`, error);
                setPODetailsMap((prev) => ({ ...prev, [tableId]: null }));
            }
        }
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
                                <label className="w-[30%] text-gray-400 text-sm">{translations["Deposit To Pay"]}</label>
                                <NumericFormat
                                    value={formData.deposit_to_pay}
                                    decimalSeparator="."
                                    decimalScale={2}
                                    fixedDecimalScale
                                    allowNegative={true}
                                    prefix={`${formData.currency} `}
                                    placeholder="0.00"
                                    onValueChange={({ floatValue }) => {
                                        setFormData((prev) => ({
                                            ...prev,
                                            deposit_to_pay: Number(floatValue) ?? "0.00",
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
                        <button onClick={handleCreatePV} className="px-2 py-2 bg-cyan-600 hover:bg-cyan-500 rounded text-white transition focus:outline-none focus:ring-2 focus:ring-cyan-500">
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
                                                                value={selectedData[index] !== undefined ? selectedData[index] : index === 0 ? formData.deposit_to_pay : ""}
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
                            <button
                                onClick={() => onChangeView("list")}
                                className="ml-2 px-2 py-2 border rounded-lg text-white transition-colors flex items-center space-x-px hover:bg-cyan-600 text-sm"
                                style={{ backgroundColor: "#2d2d30", borderColor: "#2d2d30", marginLeft: "5px" }}
                            >
                                <span>{translations["Purchase Order List"]}</span>
                            </button>
                            <button
                                className="ml-2 px-2 py-2 border rounded-lg text-white transition-colors flex items-center space-x-px hover:bg-gray-600 text-sm"
                                style={{ backgroundColor: "#0891b2", borderColor: "#0891b2", marginLeft: "5px" }}
                            >
                                <span>{translations["Deposit Paid"]}</span>
                            </button>
                            {/* Dropdown Button */}
                            <div className={`relative border-round-3 bg-[#2d2d30] border-[#2d2d30]`} style={{ borderColor: "#2d2d30", marginLeft: "5px" }}>
                                <button
                                    onClick={() => setShowDropdown(!showDropdown)}
                                    className={`ml-2 px-2 py-2 border rounded-lg text-white transition-colors flex items-center  text-sm bg-[#2d2d30] border-[#2d2d30]`}
                                >
                                    <span className="mr-1">{translations["Sort By"]}</span>
                                    <ChevronDown size={16} />
                                </button>
                                {showDropdown && (
                                    <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-10">
                                        <ul className="py-1 text-sm text-gray-700">
                                            <li>
                                                <button onClick={() => setFormData((prev) => ({ ...prev, sort_by: "Default" }))} className="w-full text-left px-4 py-2 hover:bg-gray-100">
                                                    {translations["Default"]}
                                                </button>
                                            </li>
                                            <li>
                                                <button onClick={() => setFormData((prev) => ({ ...prev, sort_by: "CodeAZ" }))} className="w-full text-left px-4 py-2 hover:bg-gray-100">
                                                    {translations["Supplier Code : A to Z"]}
                                                </button>
                                            </li>
                                            <li>
                                                <button onClick={() => setFormData((prev) => ({ ...prev, sort_by: "CodeZA" }))} className="w-full text-left px-4 py-2 hover:bg-gray-100">
                                                    {translations["Supplier Code : Z to A"]}
                                                </button>
                                            </li>
                                            <li>
                                                <button onClick={() => setFormData((prev) => ({ ...prev, sort_by: "NameAZ" }))} className="w-full text-left px-4 py-2 hover:bg-gray-100">
                                                    {translations["Supplier Name : A to Z"]}
                                                </button>
                                            </li>
                                            <li>
                                                <button onClick={() => setFormData((prev) => ({ ...prev, sort_by: "NameZA" }))} className="w-full text-left px-4 py-2 hover:bg-gray-100">
                                                    {translations["Supplier Name : Z to A"]}
                                                </button>
                                            </li>
                                        </ul>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-1">
                                <button onClick={hanleAddNewDepositPV} className="px-2 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors flex items-center space-x-1 text-sm">
                                    <span>{translations["Add Deposit PV"]}</span>
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
                                    <th className="w-[3%] text-left py-1 px-4 text-gray-400 text-sm w-12"></th>
                                    <th className="w-[3%] text-left py-1 px-4 text-gray-400 text-sm w-12"></th>
                                    <th className="w-[10%] text-left py-2 px-2 text-gray-400 text-sm">{translations["PV Date"]}</th>
                                    <th className="w-[15%] text-left py-2 px-2 text-gray-400 text-sm">{translations["PO Number"]}</th>
                                    <th className="w-[15%] text-left py-2 px-2 text-gray-400 text-sm">{translations["PV No"]}</th>
                                    <th className="w-[12%] text-left py-2 px-2 text-gray-400 text-sm">{translations["Supplier Code"]}</th>
                                    <th className="w-[12%] text-left py-2 px-2 text-gray-400 text-sm">{translations["Supplier Name"]}</th>
                                    <th className="w-[10%] text-center py-2 px-2 text-gray-400 text-sm">{translations["Ex Rate"]}</th>
                                    <th className="w-[10%] text-center py-2 px-2 text-gray-400 text-sm">{translations["Deposit"]}</th>
                                    <th className="w-[10%] text-center py-2 px-2 text-gray-400 text-sm">{translations["Base Currency"]}</th>
                                </tr>
                            </thead>
                            {loading ? (
                                <LoadingSpinnerTbody rowsCount={itemsPerPage} />
                            ) : (
                                <tbody>
                                    {depositPaidList.map((supplier, index) => (
                                        <React.Fragment key={supplier.id || index}>
                                            <tr
                                                key={supplier.id || index}
                                                className={`border-b hover:bg-gray-700 hover:bg-opacity-30 transition-colors ${
                                                    selectedPurchaseOrder.includes(supplier.id as number) ? "bg-gray-700 bg-opacity-30" : ""
                                                }`}
                                                style={{ borderColor: "#40404042" }}
                                            >
                                                <td className="py-2 px-2 text-gray-400 text-center text-custom-sm">
                                                    <button
                                                        onClick={() => handleToggleRow(supplier.id)}
                                                        className={`px-1 py-1 ${
                                                            expanded_DepositPaid.includes(supplier.id) ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"
                                                        } text-white rounded-lg transition-colors text-xs`}
                                                    >
                                                        {expanded_DepositPaid.includes(supplier.id) ? <Minus size={16} /> : <Plus size={16} />}
                                                    </button>
                                                </td>
                                                <td className="py-2 px-2" onClick={(e) => e.stopPropagation()}>
                                                    <CustomCheckbox
                                                        checked={selectedPurchaseOrder.includes(supplier.id as number)}
                                                        onChange={(checked) => handleSelectSupplier(supplier.id as number, checked)}
                                                        disabled={supplier.pv_count > 0}
                                                    />
                                                </td>
                                                <td className="py-2 px-2 text-gray-400 text-left text-custom-sm">
                                                    <div className="group flex items-center">
                                                        <p className="text-gray-400 text-custom-sm">{formatDate(supplier.pv_date, lang) || translations["N.A."]}</p>
                                                    </div>
                                                </td>
                                                <td className="py-2 px-2 text-gray-400 text-left text-custom-sm">
                                                    <div className="group flex items-center">
                                                        <p className="text-gray-400 text-custom-sm">{highlightMatch(supplier.po_number, searchTerm)}</p>
                                                        <CopyToClipboard text={supplier.po_number ?? ""} />
                                                    </div>
                                                </td>
                                                <td className="py-2 px-2 text-gray-400 text-left text-custom-sm">
                                                    <div className="group flex items-center">
                                                        <p className="text-gray-400 text-custom-sm">{highlightMatch(supplier.deposit_pv, searchTerm) || translations["N.A."]}</p>
                                                        <CopyToClipboard text={supplier.deposit_pv || translations["N.A."]} />
                                                    </div>
                                                </td>
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
                                                <td className="py-2 px-2 text-gray-400 text-center text-custom-sm">{supplier.ex_rate}</td>
                                                <td className="py-2 px-2 text-gray-400 text-center text-custom-sm">
                                                    {supplier.currency}
                                                    <br></br>
                                                    {formatMoney(supplier.deposit)}
                                                </td>
                                                <td className="py-2 px-2 text-gray-400 text-center text-custom-sm">
                                                    {baseCurrency()}
                                                    <br></br>
                                                    {formatMoney(supplier.base_deposit)}
                                                </td>
                                            </tr>
                                            {expanded_DepositPaid.includes(supplier.id) && (
                                                <tr>
                                                    <td colSpan={12} className="py-2 px-2">
                                                        <table className="w-full" style={{ backgroundColor: "#060818" }}>
                                                            <thead className="sticky top-0 z-[1] py-1 px-4" style={{ backgroundColor: "#1f2132" }}>
                                                                <tr className="border-b" style={{ borderColor: "#2d2d30" }}>
                                                                    <th className="w-auto text-left py-2 px-2 text-gray-400 text-sm border border-[#40404042]">{translations["Product Code"]}</th>
                                                                    <th className="w-auto text-left py-2 px-2 text-gray-400 text-sm border border-[#40404042]">{translations["Product Name"]}</th>
                                                                    <th className="w-auto text-center py-2 px-2 text-gray-400 text-sm border border-[#40404042]">{translations["Qty"]}</th>
                                                                    <th className="w-auto text-center py-2 px-2 text-gray-400 text-sm border border-[#40404042]">{translations["Price"]}</th>
                                                                    <th className="w-auto text-center py-2 px-2 text-gray-400 text-sm border border-[#40404042]">{translations["Deposit"]}</th>
                                                                    <th className="w-auto text-center py-2 px-2 text-gray-400 text-sm border border-[#40404042]">{translations["Base Currency"]}</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {orderDetailsMap[supplier.id] && orderDetailsMap[supplier.id]!.length > 0 ? (
                                                                    orderDetailsMap[supplier.id]!.map((detail, i) => (
                                                                        <tr key={detail.id || i}>
                                                                            <td className="py-2 px-2 text-gray-400 text-left text-custom-sm border border-[#40404042]">
                                                                                <div className="group flex items-center">
                                                                                    <p className="text-gray-400 text-custom-sm">{highlightMatch(detail.product_code, searchTerm)}</p>
                                                                                    <CopyToClipboard text={detail.product_code} />
                                                                                </div>
                                                                            </td>
                                                                            <td className="py-2 px-2 text-gray-400 text-left text-custom-sm border border-[#40404042]">
                                                                                <p className="text-gray-400 text-custom-sm">
                                                                                    {highlightMatch(lang === "en" ? detail.product_title_en : detail.product_title_cn, searchTerm)}
                                                                                </p>
                                                                            </td>
                                                                            <td className="py-2 px-2 text-gray-400 text-center text-custom-sm border border-[#40404042]">{detail.qty}</td>
                                                                            <td className="py-2 px-2 text-gray-400 text-center text-custom-sm border border-[#40404042]">
                                                                                {detail.currency} {formatMoney(detail.price)}
                                                                            </td>
                                                                            <td className="py-2 px-2 text-gray-400 text-center text-custom-sm border border-[#40404042]">
                                                                                {detail.currency} {formatMoney(detail.deposit)}
                                                                            </td>
                                                                            <td className="py-2 px-2 text-gray-400 text-center text-custom-sm border border-[#40404042]">
                                                                                {baseCurrency()} {formatMoney(detail.base_deposit)}
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
                        <ExportReportSelector
                            formats={["odt", "ods", "xlsx"]}
                            baseName="PODepositPaid"
                            ids={
                                selectedPurchaseOrder.length > 0
                                    ? depositPaidList
                                          .filter((p) => selectedPurchaseOrder.includes(p.id))
                                          .map((p) => p.po_number)
                                          .filter((po): po is string => po !== undefined)
                                    : depositPaidList.map((p) => p.po_number).filter((po): po is string => po !== undefined)
                            }
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
                                                            {formatMoney(item.po_amount)}
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
                {renderCreatePV()}
                {renderCreditsPopup()}
            </div>
        </div>
    );
};

export default DepositPaidList;
