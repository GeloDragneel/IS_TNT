import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { preorderService, ApiPreorder } from "@/services/preorderService";
import { customerService, ApiCustomer } from "@/services/customerService";
import { useLanguage } from "@/context/LanguageContext";
import CustomCheckbox from "@/components/CustomCheckbox";
import { showConfirm } from "@/utils/alert";
import Select from "react-select";
import { showSuccessToast, showErrorToast } from "@/utils/toast";
import { highlightMatch } from "@/utils/highlightMatch";
import Pagination from "@/components/Pagination";
import ItemsPerPageSelector from "@/components/ItemsPerPageSelector";
import CopyToClipboard from "@/components/CopyToClipboard";
import PusherEcho from "@/utils/echo";
import { X, Search, Minus, ChevronDown } from "lucide-react";
import { NumericFormat } from "react-number-format";
import Flatpickr from "react-flatpickr";
import { ExportReportSelector } from "@/utils/ExportReportSelector";
import { getFlatpickrLocale, formatDateToCustom } from "@/utils/flatpickrLocale";
import { DropdownData, formatDate, formatMoney, selectStyles, baseCurrency, fetchExchangeRate, fetchOperator, ImageItem } from "@/utils/globalFunction";
import { fetchBank, fetchAllCustomer, fetchAllProduct, fetchCustomerGroups, OptionType } from "@/utils/fetchDropdownData";
type FilterParams = {
    search?: string;
    date_from?: Date | null; // Allow null here
    date_to?: Date | null; // Allow null here
    category_dates?: string;
    customer_codes?: string[];
    customer_groups?: string[];
    product_codes?: string[];
};
// Handle the Smooth skeleton loading
// localStorage.clear();
interface LoadingSpinnerTbodyProps {
    rowsCount: number;
}
const MemoizedPagination = React.memo(Pagination);
const MemoizedItemsPerPageSelector = React.memo(ItemsPerPageSelector);
const LoadingSpinnerTbody: React.FC<LoadingSpinnerTbodyProps> = ({ rowsCount }) => {
    return (
        <tbody>
            {Array.from({ length: rowsCount }).map((_, idx) => (
                <tr key={idx} className="bg-transparent-900 border-b border-gray-800">
                    <td className="text-center py-1 px-4">
                        <div className="h-6 bg-gray-800 rounded w-5 mx-auto"></div>
                    </td>
                    <td className="py-1 px-4 text-gray-400 text-left text-custom-sm">
                        <div className="flex flex-col space-y-2 py-1 flex-1">
                            <div className="h-4 bg-gray-800 rounded w-16"></div>
                        </div>
                    </td>
                    <td className="text-left py-1 px-4">
                        <div className="flex flex-col space-y-2 py-1 flex-1">
                            <div className="h-4 bg-gray-800 rounded w-20"></div>
                            <div className="h-4 bg-gray-800 rounded w-16"></div>
                        </div>
                    </td>
                    <td className="text-center py-1 px-4">
                        <div className="flex flex-col space-y-2 py-1 flex-1">
                            <div className="h-4 bg-gray-800 rounded w-16"></div>
                        </div>
                    </td>
                    <td className="text-center py-1 px-4">
                        <div className="flex flex-col space-y-2 py-1 flex-1">
                            <div className="h-4 bg-gray-800 rounded w-16"></div>
                        </div>
                    </td>
                    <td className="py-1 px-4 flex items-center space-x-3 min-w-[300px]">
                        <div className="flex flex-col space-y-2 py-1 flex-1">
                            <div className="h-4 bg-gray-800 rounded w-3/4"></div>
                            <div className="h-3 bg-gray-700 rounded w-1/2"></div>
                        </div>
                    </td>
                    <td className="text-center py-1 px-4">
                        <div className="h-6 bg-gray-800 rounded w-20 mx-auto"></div>
                    </td>
                    <td className="text-center py-1 px-4">
                        <div className="h-4 bg-gray-800 rounded w-8 mx-auto"></div>
                    </td>
                    <td className="text-center py-1 px-4">
                        <div className="h-6 bg-gray-800 rounded w-10 mx-auto"></div>
                    </td>
                    <td className="text-center py-1 px-4">
                        <div className="h-6 bg-gray-800 rounded w-10 mx-auto"></div>
                    </td>
                    <td className="text-center py-1 px-4">
                        <div className="h-6 bg-gray-800 rounded w-10 mx-auto"></div>
                    </td>
                    <td className="text-center py-1 px-4">
                        <div className="h-6 bg-gray-800 rounded w-10 mx-auto"></div>
                    </td>
                    <td className="text-center py-1 px-4">
                        <div className="h-6 bg-gray-800 rounded w-10 mx-auto"></div>
                    </td>
                    <td className="text-center py-1 px-4">
                        <div className="h-6 bg-gray-800 rounded w-10 mx-auto"></div>
                    </td>
                </tr>
            ))}
        </tbody>
    );
};
// localStorage.clear();
interface PreorderListProps {
    tabId: string;
    onPreordertSelect: (preorderId: number, saveType?: string) => void;
    onChangeView: (view: "list" | "details" | "unsold" | "performance") => void; // <- NEW
    onInitiateCopy: (sourcePreorderId: number, settings: any) => void;
    selectedPreorder: number[];
    onselectedPreorderChange: (selected: number[]) => void;
    expandedRows: number[];
    onExpandedRowsChange: (expanded: number[]) => void;
}
interface ApiPreorderFooter {
    qty: number;
    total: number;
    orig_total: number;
    base_total: number;
    e_cost_total: number;
    e_profit: number;
    base_deposit: number;
}
interface preorderCustomer {
    count: number;
    currency: string;
}
type FormDataType = {
    currency: string;
    baseCurrency: string;
    order_date: string;
    current_credit: number;
    credit_note: string;
    ex_rate: string;
    base_credit_note: string;
    advance_payment: string;
    base_advance_payment: string;
    excess_payment: string;
    base_excess_payment: string;
    total_credit_used: string;
    bank_charges: string;
    base_bank_charges: string;
    balance_to_pay: string;
    total_deposit: string;
    sort_by: string;
    category_dates: string;
    date_from: Date | null; // Allow null here
    date_to: Date | null; // Allow null here
    orderId: number[];
    customerCodes: OptionType[];
    customerGroups: OptionType[];
    productCodes: OptionType[];
    customerId: number;
    banks: OptionType | null;
};
type FormDataType_Voucher = {
    voucher_id: number;
    customer_id: number;
    customer_code: string;
    customer_name: string;
    currency: string;
    value: number;
    voucher_no: string;
    voucher_date: string;
    expiry_date: Date | null;
};
type ApiClosingDate = {
    product_thumbnail: ImageItem | null;
    product_title_en: string;
    product_title_cn: string;
};

const PreorderList: React.FC<PreorderListProps> = ({ tabId, onPreordertSelect, onChangeView, selectedPreorder, onselectedPreorderChange }) => {
    const { translations, lang } = useLanguage();
    const [products, setProducts] = useState<ApiPreorder[]>([]);
    const [voucherList, setVoucherList] = useState<ApiPreorder[]>([]);
    const [closingStatusCust, setClosingStatusCust] = useState<ApiPreorder[]>([]);
    const [closingStatusProd, setClosingStatusProd] = useState<ApiClosingDate | null>(null);
    const locale = getFlatpickrLocale(translations);
    const [totalPages, setTotalPages] = useState(1);
    const [totalPagesVoucher, setTotalPagesVoucher] = useState(1);
    const [confirmButton, setConfirmButton] = useState(false);
    const [confirmPopup, setShowConfirmPopup] = useState(false);
    const [creditsPopup, setShowCreditsPopup] = useState(false);
    const [cancelOrder, setShowCancelOrder] = useState(false);
    const [currentCreditDisabled, setCurrentCreditDisabled] = useState(false);
    const [selectedData, setSelectedData] = useState<any>([]);
    const [banksData, setBanksData] = useState<DropdownData[]>([]);
    const [allCustomer, setAllCustomer] = useState<DropdownData[]>([]);
    const [allProduct, setAllProduct] = useState<DropdownData[]>([]);
    const [AllGroups, setAllCustomerGroups] = useState<DropdownData[]>([]);
    const [loadConfirmOrder, setLoadConfirmOrder] = useState(false);
    const [loadCancelOrder_CTOCUST, setLoadCancelOrder_CTOCUST] = useState(false);
    const [loadCancelOrder_NRTOMI, setLoadCancelOrder_NRTOMI] = useState(false);
    const [loadCancelOrder_RPTOC, setLoadCancelOrder_RPTOC] = useState(false);
    const [activeAdvanceSearch, setActiveAdvanceSearch] = useState(false);
    const [loadCreateSO, setLoadCreateSO] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const [showAdvanceSearch, setShowAdvanceSearch] = useState(false);
    const [showDateRange, setShowDateRange] = useState(false);
    const [showPreorderClosing, setShowPreorderClosing] = useState(false);
    const [showVoucherInfo, setShowVoucherInfo] = useState(true);
    const [showVoucher, setShowVoucher] = useState(false);
    const [searchClosingStatus, setSearchClosingStatus] = useState("");
    const [globalIsCancel, setGlobalisCancel] = useState("");
    const [selectedVoucher, setSelectedVoucher] = useState<number[]>([]);
    const [showCustomers, setShowCustomers] = useState(false);
    const [customers, setCustomers] = useState<ApiCustomer[]>([]);
    const [totalPagesCustomer, setTotalPages_Customer] = useState(1);
    const [loadingSaveVoucher, setLoadingSaveVoucher] = useState(false);
    const exportRef = useRef<{ triggerExport: () => void }>(null);
    const [altLang, setAltLanguage] = useState(lang);
    const [showInputs, setShowInputs] = useState({
        isCurrentCredit: false,
        isCreditNote: false,
        isAdvancePayment: false,
        isExcessPayment: false,
        isTotalCreditUsed: false,
        isBankCharges: false,
        isDepositToPay: false,
        isBank: false,
        isAll: false,
    });

    const [formData, setFormData] = useState<FormDataType>({
        currency: "",
        baseCurrency: baseCurrency(),
        order_date: new Date()
            .toLocaleDateString("en-US", {
                month: "short",
                day: "2-digit",
                year: "numeric",
            })
            .replace(/,/g, ""),
        current_credit: 0,
        credit_note: "0.00",
        ex_rate: "0.0000",
        base_credit_note: "0.00",
        advance_payment: "0.00",
        base_advance_payment: "0.00",
        excess_payment: "0.00",
        base_excess_payment: "0.00",
        total_credit_used: "0.00",
        bank_charges: "0.00",
        base_bank_charges: "0.00",
        balance_to_pay: "0.00",
        total_deposit: "0.00",
        customerId: 0,
        orderId: [],
        sort_by: "Code",
        category_dates: "OrderDate",
        customerCodes: [],
        customerGroups: [],
        productCodes: [],
        date_from: null as Date | null,
        date_to: null as Date | null,
        banks: null as OptionType | null,
    });

    const initialVoucherForm: FormDataType_Voucher = {
        voucher_id: 0,
        customer_id: 0,
        customer_code: "",
        customer_name: "",
        currency: "",
        value: 0,
        voucher_no: "",
        voucher_date: new Date()
            .toLocaleDateString("en-US", {
                month: "short",
                day: "2-digit",
                year: "numeric",
            })
            .replace(/,/g, ""),
        expiry_date: null,
    };

    const [formDataVoucher, setFormDataVoucher] = useState<FormDataType_Voucher>(initialVoucherForm);
    const safeLang = lang === "cn" ? "cn" : "en";
    const pageSizeOptions = useMemo(() => [15, 20, 50, -1], []);
    const [preorderFooter, setPreorderFooter] = useState<ApiPreorderFooter | null>(null);
    const [preorderFooter2, setPreorderFooter2] = useState<ApiPreorderFooter | null>(null);
    const throttleTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const [loading, setLoading] = useState(() => {
        const savedLoading = localStorage.getItem(`${tabId}-loading-preorder`);
        return savedLoading !== null ? JSON.parse(savedLoading) : true;
    });

    const [currentPage, setCurrentPage] = useState(() => {
        const metaKey = `${tabId}-cached-meta-preorder`;
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
    const [currentPageVoucher, setCurrentPageVoucher] = useState(() => {
        const metaKey = `${tabId}-cached-meta-voucher`;
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
        const metaKey = `${tabId}-cached-meta-preorder`;
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
    const [itemsPerPageVoucher, setItemsPerPageVoucher] = useState(() => {
        const metaKey = `${tabId}-cached-meta-voucher`;
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
        const cached = localStorage.getItem(`${tabId}-cached-meta-preorder`);
        if (!cached) return "";
        try {
            const meta = JSON.parse(cached);
            return meta.filters.search || "";
        } catch {
            return "";
        }
    });
    const [searchTermVoucher, setSearchTermVoucher] = useState(() => {
        const cached = localStorage.getItem(`${tabId}-cached-meta-voucher`);
        if (!cached) return "";
        try {
            const meta = JSON.parse(cached);
            return meta.search || "";
        } catch {
            return "";
        }
    });
    const [searchTermCustomer, setSearchTermCustomer] = useState(() => {
        const cached = localStorage.getItem(`${tabId}-cached-preorder-customer`);
        if (!cached) return "";
        try {
            const meta = JSON.parse(cached);
            return meta.search || "";
        } catch {
            return "";
        }
    });
    const [currentPageCustomer, setCurrentPageCustomer] = useState(() => {
        const metaKey = `${tabId}-cached-preorder-customer`;
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
    const [itemsPerPageCustomer, setItemsPerPageCustomer] = useState(() => {
        const metaKey = `${tabId}-cached-preorder-customer`;
        const cachedMeta = localStorage.getItem(metaKey);
        let perPage = 10;
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

    // REALTIME
    useEffect(() => {
        const channel = PusherEcho.channel("preorder-channel");
        channel.listen(".preorder-event", () => {
            const defaultFilters = {
                search: searchTerm,
                customer_codes: formData.sort_by === "Code" ? formData.customerCodes.map((c) => c.value) : [],
                customer_groups: formData.sort_by === "Group" ? formData.customerGroups.map((g) => g.value) : [],
                product_codes: formData.productCodes.map((p) => p.value),
                date_from: formData.date_from,
                date_to: formData.date_to,
                category_dates: formData.category_dates,
            };
            fetchPreorder(currentPage, itemsPerPage, defaultFilters);
        });
        return () => {
            PusherEcho.leave("preorder-channel");
        };
    }, [currentPage, itemsPerPage, searchTerm, tabId]);

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
        const handleEsc = (event: any) => {
            if (event.key === "Escape") {
                if (cancelOrder) {
                    setShowCancelOrder(false);
                }
                if (confirmPopup && !creditsPopup) {
                    setShowConfirmPopup(false);
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
                if (showVoucher) {
                    setShowVoucher(false);
                }
                if (showPreorderClosing) {
                    setShowPreorderClosing(false);
                }
            }
        };
        window.addEventListener("keydown", handleEsc);
        // Cleanup on unmount
        return () => {
            window.removeEventListener("keydown", handleEsc);
        };
    }, [creditsPopup, confirmPopup, cancelOrder, showAdvanceSearch, showDateRange, showVoucher, showPreorderClosing]);
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

    // ON LOAD LIST
    useEffect(() => {
        const productKey = `${tabId}-cached-preorder`;
        const metaKey = `${tabId}-cached-meta-preorder`;
        const mountKey = `${tabId}-mount-status-preorder`;
        const isFirstMount = sessionStorage.getItem(mountKey) !== "mounted";
        const defaultFilters = {
            search: searchTerm,
            customer_codes: formData.sort_by === "Code" ? formData.customerCodes.map((c) => c.value) : [],
            customer_groups: formData.sort_by === "Group" ? formData.customerGroups.map((g) => g.value) : [],
            product_codes: formData.productCodes.map((p) => p.value),
            date_from: formData.date_from,
            date_to: formData.date_to,
            category_dates: formData.category_dates,
        };
        if (isFirstMount) {
            sessionStorage.setItem(mountKey, "mounted");
            fetchPreorder(currentPage, itemsPerPage, defaultFilters);
            return;
        }
        const cachedProductsRaw = localStorage.getItem(productKey);
        const cachedMetaRaw = localStorage.getItem(metaKey);
        if (!cachedProductsRaw || !cachedMetaRaw) {
            fetchPreorder(currentPage, itemsPerPage, defaultFilters);
            return;
        }
        try {
            const cachedMeta = JSON.parse(cachedMetaRaw);
            const cachedProducts = JSON.parse(cachedProductsRaw);

            const isCacheValid = cachedMeta.page === currentPage && cachedMeta.perPage === itemsPerPage && JSON.stringify(cachedMeta.search) === JSON.stringify(defaultFilters.search);

            if (isCacheValid) {
                setProducts(cachedProducts);
                setTotalPages(cachedMeta.totalPages);
                setLoading(false);
                localStorage.setItem(`${tabId}-loading-preorder`, JSON.stringify(false));
                return;
            }
        } catch (err) {
            console.warn("Failed to parse cached meta:", err);
        }
        fetchPreorder(currentPage, itemsPerPage, defaultFilters);
    }, [currentPage, itemsPerPage, searchTerm, tabId]);

    // ON LOAD CUSTOMER LIST
    useEffect(() => {
        const customerKey = `${tabId}-cached-customers`;
        const metaKey = `${tabId}-cached-meta-customer`;
        const mountKey = `${tabId}-mount-status-customers`;

        const isFirstMount = sessionStorage.getItem(mountKey) !== "mounted";

        if (isFirstMount) {
            sessionStorage.setItem(mountKey, "mounted");
            fetchCustomers(currentPageCustomer, itemsPerPageCustomer, searchTermCustomer);
            return;
        }

        const cachedCustomersRaw = localStorage.getItem(customerKey);
        const cachedMetaRaw = localStorage.getItem(metaKey);

        if (!cachedCustomersRaw || !cachedMetaRaw) {
            fetchCustomers(currentPageCustomer, itemsPerPageCustomer, searchTermCustomer);
            return;
        }

        try {
            const cachedMeta = JSON.parse(cachedMetaRaw);
            const cachedCustomers = JSON.parse(cachedCustomersRaw);

            const isCacheValid = cachedMeta.page === currentPageCustomer && cachedMeta.perPage === itemsPerPageCustomer && cachedMeta.search === searchTermCustomer;

            if (isCacheValid) {
                setCustomers(cachedCustomers);
                setTotalPages_Customer(cachedMeta.totalPages);
                setLoading(false);
                localStorage.setItem(`${tabId}-loading-customers-preorder`, JSON.stringify(false));
                return;
            }
        } catch (err) {
            console.warn("Failed to parse cached meta:", err);
        }

        fetchCustomers(currentPageCustomer, itemsPerPageCustomer, searchTermCustomer);
    }, [currentPageCustomer, itemsPerPageCustomer, searchTermCustomer, tabId]);

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
                loadAllProduct();
                loadCustomerGroup();
            }, 1000); // 1000ms (1 second) throttle time
        }

        // Cleanup timeout when component unmounts or copiedId changes
        return () => {
            if (throttleTimeout.current) {
                clearTimeout(throttleTimeout.current);
            }
        };
    }, [tabId]);

    useEffect(() => {
        const selectedPreorders = products.filter((product) => selectedPreorder.includes(product.id));
        let countUnconfirmed = 0;
        let countConfirmed = 0;
        if (selectedPreorders.length === 0) {
            setConfirmButton(false);
        } else {
            selectedPreorders.forEach((list) => {
                if (list.order_status === 2) {
                    countUnconfirmed++;
                } else if (list.order_status === 3) {
                    countUnconfirmed++;
                } else {
                    countConfirmed++;
                }
            });
        }
        if (countUnconfirmed > 0 && countConfirmed > 0) {
            setConfirmButton(false);
        } else if (countUnconfirmed === 0 && countConfirmed > 0) {
            setConfirmButton(true);
        } else if (countUnconfirmed > 0 && countConfirmed === 0) {
            setConfirmButton(false);
        } else {
            setConfirmButton(false);
        }
    }, [selectedPreorder]);

    useEffect(() => {
        const TOTAL_LIMIT = Number(formData.balance_to_pay || 0);

        if (TOTAL_LIMIT > 0 && selectedData.crDetails && selectedData.crDetails.length > 0) {
            setSelectedData((prev: any) => {
                const updatedCrDetails = [...prev.crDetails];
                let remainingToDistribute = TOTAL_LIMIT;

                // Reset all fields first
                updatedCrDetails.forEach((detail: any, idx: number) => {
                    if (Number(detail.amount) > 0) {
                        updatedCrDetails[idx] = {
                            ...updatedCrDetails[idx],
                            default_amount: 0,
                        };
                    }
                });

                // Distribute the total amount
                for (let i = 0; i < updatedCrDetails.length; i++) {
                    if (Number(updatedCrDetails[i].amount) > 0 && remainingToDistribute > 0) {
                        const maxForThisRow = Number(updatedCrDetails[i].amount);
                        const amountToSet = Math.min(remainingToDistribute, maxForThisRow);

                        updatedCrDetails[i] = {
                            ...updatedCrDetails[i],
                            default_amount: amountToSet,
                        };

                        remainingToDistribute -= amountToSet;
                    }
                }

                return {
                    ...prev,
                    crDetails: updatedCrDetails,
                };
            });
        }
    }, [formData.balance_to_pay, creditsPopup]); // Triggers when balance_to_pay changes

    const fetchPreorder = async (page = currentPage, perPage = itemsPerPage, filters: FilterParams = { search: "" }) => {
        try {
            if (loading) {
                setLoading(true);
            }
            localStorage.setItem(`${tabId}-loading-preorder`, JSON.stringify(true));
            const paginatedData = await preorderService.getAllPreorder(page, perPage, filters);
            setProducts(paginatedData.data);
            setTotalPages(paginatedData.last_page);
            setPreorderFooter(paginatedData.footer);
            setPreorderFooter2(paginatedData.footer2);
            localStorage.setItem(`${tabId}-cached-preorder`, JSON.stringify(paginatedData.data));
            localStorage.setItem(
                `${tabId}-cached-meta-preorder`,
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
            localStorage.setItem(`${tabId}-loading-preorder`, JSON.stringify(false));
        }
    };
    const fetchVoucherList = async () => {
        try {
            localStorage.setItem(`${tabId}-loading-voucher`, JSON.stringify(true));
            const paginatedData = await preorderService.getAllVoucherList(currentPageVoucher, itemsPerPageVoucher, searchTermVoucher);
            setVoucherList(paginatedData.data);
            setTotalPagesVoucher(paginatedData.last_page);
            localStorage.setItem(`${tabId}-cached-voucher`, JSON.stringify(paginatedData.data));
            localStorage.setItem(
                `${tabId}-cached-meta-voucher`,
                JSON.stringify({
                    currentPage,
                    itemsPerPage,
                    totalPages: paginatedData.last_page,
                    totalItems: paginatedData.total,
                })
            );
        } catch (err) {
            console.error("Error fetching voucher:", err);
        } finally {
            setLoading(false);
            localStorage.setItem(`${tabId}-loading-voucher`, JSON.stringify(false));
        }
    };
    const fetchCustomers = async (page = currentPageCustomer, perPage = itemsPerPageCustomer, search = "") => {
        try {
            // setLoading(true);
            localStorage.setItem(`${tabId}-loading-customers-preorder`, JSON.stringify(true));

            const paginatedData = await customerService.getAllCustomer(page, perPage, search);

            setCustomers(paginatedData.data);
            setTotalPages_Customer(paginatedData.last_page);
            localStorage.setItem(`${tabId}-cached-customers`, JSON.stringify(paginatedData.data));
            localStorage.setItem(
                `${tabId}-cached-preorder-customer`,
                JSON.stringify({
                    page,
                    perPage,
                    search,
                    totalPages: paginatedData.last_page,
                    totalItems: paginatedData.total,
                })
            );
        } catch (err) {
            console.error("Error fetching customers:", err);
        } finally {
            setLoading(false);
            localStorage.setItem(`${tabId}-loading-customers-preorder`, JSON.stringify(false));
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
    const loadAllCustomer = async () => {
        try {
            const list = await fetchAllCustomer(); // fetches & returns
            setAllCustomer(list ?? []); // ✅ manually set state here
        } catch (err) {
            console.error("Failed to fetch loadAllCustomer:", err);
        }
    };
    const loadAllProduct = async () => {
        try {
            const list = await fetchAllProduct(); // fetches & returns
            setAllProduct(list ?? []); // ✅ manually set state here
        } catch (err) {
            console.error("Failed to fetch loadAllProduct:", err);
        }
    };
    const loadCustomerGroup = async () => {
        try {
            const list = await fetchCustomerGroups(); // fetches & returns
            setAllCustomerGroups(list ?? []); // ✅ manually set state here
        } catch (err) {
            console.error("Failed to fetch loadCustomerGroup:", err);
        }
    };

    const filteredVoucher = voucherList.filter((product) => {
        const searchLower = searchTermVoucher.toLowerCase();
        return product.voucher_no?.toLowerCase().includes(searchLower) || product.voucher_date?.toLowerCase().includes(searchLower);
    });
    const filteredCustomers = customers.filter((customer) => {
        const searchLower = searchTermCustomer.toLowerCase();
        return (
            customer.id?.toString().includes(searchLower) ||
            customer.customer_code?.toLowerCase().includes(searchLower) ||
            customer.account_name_en?.toLowerCase().includes(searchLower) ||
            customer.account_name_cn?.toLowerCase().includes(searchLower) ||
            customer.email_address?.toLowerCase().includes(searchLower) ||
            customer.tel_no?.toLowerCase().includes(searchLower)
        );
    });
    // Handle Status Specification
    const statusMap: Record<string, { en: string; cn: string; color: string }> = {
        1: { en: "Confirmed", cn: "确认", color: "bg-cyan-600 bg-opacity-20 text-cyan-400" },
        2: { en: "Unconfirmed", cn: "未确认", color: "bg-yellow-500 bg-opacity-20 text-yellow-300" },
        3: { en: "New Update", cn: "更新", color: "bg-green-500 bg-opacity-20 text-green-300" },
    };
    const preorderStatusLocalized = (status: number, lang: "en" | "cn" = "en") => {
        const key = status;
        return statusMap[key]?.[lang] || status || "-";
    };
    const sortByUnits: OptionType[] = [
        { value: "Code", label: translations["Customer Code"], en: translations["Customer Code"], cn: translations["Customer Code"], value2: "" },
        { value: "Group", label: translations["Customer Group"], en: translations["Customer Group"], cn: translations["Customer Group"], value2: "" },
    ];
    const categoryDates: OptionType[] = [
        { value: "OrderDate", label: translations["Order Date"], en: translations["Order Date"], cn: translations["Order Date"], value2: "" },
        { value: "ReleaseDate", label: translations["Release Date"], en: translations["Release Date"], cn: translations["Release Date"], value2: "" },
        { value: "ClosingDate", label: translations["Closing Date"], en: translations["Closing Date"], cn: translations["Closing Date"], value2: "" },
    ];
    const getStatusColor = (status?: number) => {
        return statusMap[status ?? -1]?.color || "bg-cyan-600 bg-opacity-20 text-cyan-400";
    };
    // Handle select all
    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            onselectedPreorderChange(products.map((p) => p.id).filter(Boolean) as number[]);
        } else {
            onselectedPreorderChange([]);
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
    const allProductOptions: OptionType[] = useMemo(
        () =>
            allProduct.map((list) => ({
                value: list.value.toString(),
                value2: list.value.toString(),
                label: lang === "en" ? list.en : list.cn,
                en: list.en,
                cn: list.cn,
            })),
        [allProduct, lang]
    );
    const allGroupOption: OptionType[] = useMemo(
        () =>
            AllGroups.map((list) => ({
                value: list.value.toString(),
                value2: list.value.toString(),
                label: lang === "en" ? list.en : list.cn,
                en: list.en,
                cn: list.cn,
            })),
        [AllGroups, lang]
    );
    const handleDateFrom = useCallback((dates: Date[]) => {
        setFormData((prev) => ({ ...prev, date_from: dates[0] ?? null }));
    }, []);
    const handleDateTo = useCallback((dates: Date[]) => {
        setFormData((prev) => ({ ...prev, date_to: dates[0] ?? null }));
    }, []);
    const handleDateExpiry = useCallback((dates: Date[]) => {
        setFormDataVoucher((prev) => ({ ...prev, expiry_date: dates[0] ?? null }));
    }, []);
    // Handle individual select
    const handleSelectPreorder = (preorderId: number, checked: boolean) => {
        if (checked) {
            onselectedPreorderChange([...selectedPreorder, preorderId]);
        } else {
            onselectedPreorderChange(selectedPreorder.filter((id) => id !== preorderId));
        }
    };
    const handleSelectVoucher = (voucherId: number, checked: boolean) => {
        if (checked) {
            setSelectedVoucher([...selectedVoucher, voucherId]);
        } else {
            setSelectedVoucher(selectedVoucher.filter((id) => id !== voucherId));
        }
    };
    const handleSaveConfirmOrder = async () => {
        setLoadConfirmOrder(true);
        const data = new FormData();
        // Append all form data
        Object.keys(formData).forEach((key) => {
            let value = formData[key as keyof typeof formData];
            if (value !== null && value !== undefined) {
                data.append(key, value.toString());
            }
            if (value !== null && typeof value === "object" && "value" in value) {
                data.append(key, (value as OptionType).value);
            }
        });
        try {
            const result = await preorderService.confirmOrder(data);
            if (result.token === "Error") {
                showErrorToast(translations[result.message] + " " + result.message2);
                return;
            }
            if (result.token === "CreditNote") {
                setGlobalisCancel("N");
                setShowCancelOrder(true);
                return;
            }
            setShowConfirmPopup(false);
            setLoadConfirmOrder(false);
            setConfirmButton(true);
            fetchPreorder(currentPage, itemsPerPage, searchTerm);
            showSuccessToast(translations[result.message]);
            onselectedPreorderChange([]);
        } catch (error) {
            showErrorToast(translations["Failed to save Preorder."] || "Failed to save Preorder.");
        } finally {
            setLoadConfirmOrder(false);
        }
    };
    const handleNoDepositNeeded = () => {
        if (!selectedData) return;
        setSelectedData((prev: any) => ({
            ...prev,
            total_item_deposit: 0,
            list: prev.list.map((item: any) => ({ ...item, item_deposit: 0 })),
        }));
        setFormData((prevState) => ({
            ...prevState,
            balance_to_pay: "0.00",
            total_deposit: "0.00",
        }));
    };
    const handleCancelOrder = async () => {
        if (selectedPreorder.length === 0) {
            showErrorToast(translations["Please click checkbox to select row"]);
            return;
        }
        let totalDeposit = 0;
        const selectedPreorders = products.filter((product) => selectedPreorder.includes(product.id));
        selectedPreorders.forEach((element) => {
            totalDeposit += element.deposit;
        });
        if (totalDeposit > 0) {
            setShowCancelOrder(true);
            setGlobalisCancel("Y");
            setLoadCancelOrder_CTOCUST(false);
            setLoadCancelOrder_NRTOMI(false);
            setLoadCancelOrder_RPTOC(false);
            return;
        }
        const confirmed = await showConfirm(translations["System Message"], translations["Are you sure you want to cancel this order"] + "?", translations["Delete"], translations["Cancel"]);
        if (!confirmed) return;
        try {
            await preorderService.deletePreorder(selectedPreorder);
            setProducts((prev) => prev.filter((p) => !selectedPreorder.includes(p.id!)));
            onselectedPreorderChange([]);
            fetchPreorder(currentPage, itemsPerPage, searchTerm);
            showSuccessToast(translations["Record has been Deleted"]);
        } catch (err) {
            showErrorToast(translations["alert_message_18"]);
            console.error("Deletion failed:", err);
        }
    };
    const handleDeleteVoucher = async (type: string) => {
        if (selectedVoucher.length === 0 && type === "list") {
            showErrorToast(translations["Please click checkbox to select row"]);
            return;
        }
        const confirmed = await showConfirm(translations["System Message"], translations["Are you sure you want to delete this record?"], translations["Delete"], translations["Cancel"]);
        if (!confirmed) return;
        try {
            var idToUsed = type === "list" ? selectedVoucher : [formDataVoucher.voucher_id];
            await preorderService.deleteVoucher(idToUsed);
            setVoucherList((prev) => prev.filter((p) => !idToUsed.includes(p.id!)));
            setSelectedVoucher([]);
            fetchVoucherList();
            setFormDataVoucher(initialVoucherForm);
            showSuccessToast(translations["Record has been Deleted"]);
        } catch (err) {
            showErrorToast(translations["alert_message_18"]);
            console.error("Deletion failed:", err);
        }
    };
    const handleGetVoucherInfo = (id: number) => {
        const voucherInfo = voucherList.find((v) => v.id === id);
        setFormDataVoucher((prev) => ({
            ...prev,
            voucher_id: Number(voucherInfo?.id),
            customer_id: Number(voucherInfo?.customer_id),
            voucher_no: voucherInfo?.voucher_no,
            customer_code: String(voucherInfo?.customer_code),
            customer_name: String(voucherInfo?.account_name_en),
            currency: String(voucherInfo?.currency),
            value: Number(voucherInfo?.value),
            voucher_date: voucherInfo?.voucher_date ?? null,
            expiry_date: voucherInfo?.expiry_date ? new Date(voucherInfo.expiry_date) : null,
        }));
        setShowVoucherInfo(false);
    };
    const handleClearVoucherInfo = () => {
        setFormDataVoucher(initialVoucherForm);
    };
    const handleSaveCancelOrder = async (type: string) => {
        if (type === "CTOCUST") {
            setLoadCancelOrder_CTOCUST(true);
        }
        if (type === "NRTOMI") {
            setLoadCancelOrder_NRTOMI(true);
        }
        if (type === "RPTOC") {
            setLoadCancelOrder_RPTOC(true);
        }
        try {
            const creditAmount = Number(formData.balance_to_pay);
            const result = await preorderService.cancelOrder(selectedPreorder, type, globalIsCancel, creditAmount);
            if (result.token === "Error") {
                setLoadCancelOrder_CTOCUST(false);
                setLoadCancelOrder_NRTOMI(false);
                setLoadCancelOrder_RPTOC(false);
                showErrorToast(result.message);
                return;
            }
            setShowConfirmPopup(false);
            setShowCancelOrder(false);
            setLoadCancelOrder_CTOCUST(false);
            setLoadCancelOrder_NRTOMI(false);
            setLoadCancelOrder_RPTOC(false);
            setConfirmButton(true);
            fetchPreorder(currentPage, itemsPerPage, searchTerm);
            showSuccessToast(translations[result.message]);
            onselectedPreorderChange([]);
        } catch (err) {
            setLoadCancelOrder_CTOCUST(false);
            setLoadCancelOrder_NRTOMI(false);
            setLoadCancelOrder_RPTOC(false);
            showErrorToast(translations["alert_message_18"]);
        }
    };
    const handleConfirmOrder = async () => {
        if (selectedPreorder.length === 0) {
            showErrorToast(translations["Please click checkbox to select row"]);
            return;
        }
        try {
            const selectedPreorders = products.filter((product) => selectedPreorder.includes(product.id));

            let orderIds: any[] = selectedPreorder;
            let countUnconfirmed = 0;
            let countConfirmed = 0;

            if (selectedPreorders.length === 0) {
                setConfirmButton(false);
            } else {
                selectedPreorders.forEach((list) => {
                    if (list.order_status === 2 || list.order_status === 3) {
                        countUnconfirmed++;
                    } else {
                        countConfirmed++;
                    }
                });
            }

            if (countUnconfirmed > 0 && countConfirmed > 0) {
                orderIds = selectedPreorders.filter((list) => list.order_status === 2 || list.order_status === 3).map((list) => list.id);
            }

            // Group by customer
            const customerGroups = selectedPreorders.reduce<Record<string, preorderCustomer>>((acc, preorder) => {
                const customerId = preorder.customer_id;
                if (!acc[customerId]) {
                    acc[customerId] = {
                        count: 0,
                        currency: preorder.currency,
                    };
                }
                acc[customerId].count += 1;
                return acc;
            }, {});

            // Ensure only one customer is selected
            const customerIds = Object.keys(customerGroups);
            let customerCurrency = "";
            let customerId = "";

            if (customerIds.length === 1) {
                const uniqueCustomerId = customerIds[0];
                customerCurrency = customerGroups[uniqueCustomerId].currency;
                customerId = uniqueCustomerId;
            } else {
                showErrorToast(translations["Please select one customer only"]);
                return;
            }
            try {
                const selectedData = await preorderService.getSelectedOrders(orderIds, lang);
                const currentCredit = selectedData.current_credit;

                setSelectedData(selectedData);
                setLoading(false);
                // Move all logic that depends on selectedData INSIDE this block
                const exRate = await fetchExchangeRate(customerCurrency, baseCurrency());
                const balance_to_pay = selectedData.total_item_deposit - selectedData.totalPaidDeposit;
                setFormData((prevState) => ({
                    ...prevState,
                    ex_rate: String(exRate ?? "0.0000"),
                    customerId: Number(customerId),
                    currency: customerCurrency,
                    current_credit: currentCredit,
                    bank_charges: "0.00",
                    total_credit_used: "0.00",
                    advance_payment: "0.00",
                    base_advance_payment: "0.00",
                    credit_note: "0.00",
                    base_credit_note: "0.00",
                    excess_payment: "0.00",
                    base_excess_payment: "0.00",
                    orderId: orderIds,
                    balance_to_pay: String(balance_to_pay ?? "0.00"),
                    total_deposit: String(selectedData.totalPaidDeposit ?? "0.00"),
                    banks: null,
                }));
                if (currentCredit > 0) {
                    setShowInputs((prevState) => ({ ...prevState, isCurrentCredit: false }));
                    setCurrentCreditDisabled(false);
                } else if (currentCredit < 0) {
                    setShowInputs((prevState) => ({ ...prevState, isCurrentCredit: false }));
                    setCurrentCreditDisabled(true);
                } else {
                    setShowInputs((prevState) => ({ ...prevState, isCurrentCredit: true }));
                    setCurrentCreditDisabled(true);
                }
            } catch (err) {
                setLoading(false);
                showErrorToast(translations["alert_message_18"]);
                return; // exit early if fetch failed
            }

            setShowInputs((prevState) => ({
                ...prevState,
                isCreditNote: true,
                isAdvancePayment: true,
                isExcessPayment: true,
                isTotalCreditUsed: true,
                isAll: confirmButton ? true : false,
            }));

            setShowConfirmPopup(true);
        } catch (err) {
            showErrorToast(translations["alert_message_18"]);
            console.error("Deletion failed:", err);
        }
    };
    const handlePrint = async () => {
        if (selectedPreorder.length === 0) {
            showErrorToast(translations["Please click checkbox to select row"]);
            return;
        }
        const selectedPreorders = products.filter((product) => selectedPreorder.includes(product.id));
        // Group by customer
        const customerGroups = selectedPreorders.reduce<Record<string, preorderCustomer>>((acc, preorder) => {
            const customerId = preorder.customer_id;
            if (!acc[customerId]) {
                acc[customerId] = {
                    count: 0,
                    currency: preorder.currency,
                };
            }
            acc[customerId].count += 1;
            return acc;
        }, {});
        // Ensure only one customer is selected
        const customerIds = Object.keys(customerGroups);
        if (customerIds.length > 1) {
            showErrorToast(translations["Please select one customer only"]);
            return;
        }
        exportRef.current?.triggerExport();
    };
    const handleCreateSalesOrder = async () => {
        if (selectedPreorder.length === 0) {
            showErrorToast(translations["Please click checkbox to select row"]);
            return;
        }
        const confirmed = await showConfirm(translations["System Message"], translations["alert_message_01"], translations["Yes"], translations["Cancel"]);
        if (!confirmed) return;
        try {
            setLoadCreateSO(true);
            const selectedPreorders = products.filter((product) => selectedPreorder.includes(product.id));
            let countWarehouse = 0;
            selectedPreorders.forEach((element) => {
                if (element.rwarehouse.length < 3) {
                    countWarehouse++;
                }
            });
            if (countWarehouse > 0) {
                setLoadCreateSO(false);
                showErrorToast(translations["Receiving Warehouse is required"]);
                return;
            }
            const result = await preorderService.createSalesOrder(selectedPreorder);
            if (result.token === "Error") {
                setLoadCreateSO(false);
                showErrorToast(translations[result.message]);
                return;
            } else {
                const len = result.resultArray.length;
                if (len === 0) {
                    setProducts((prev) => prev.filter((p) => !selectedPreorder.includes(p.id!)));
                    onselectedPreorderChange([]);
                    fetchPreorder(currentPage, itemsPerPage, searchTerm);
                    showSuccessToast(translations[result.message]);
                    setLoadCreateSO(false);
                    return;
                } else {
                    setLoadCreateSO(false);
                    showErrorToast("Please check the orderQty and grnQty");
                }
            }
        } catch (err) {
            showErrorToast(translations["alert_message_18"]);
            console.error("Deletion failed:", err);
        }
    };
    const handleRowClick = (e: React.MouseEvent, preorderId: number) => {
        // Prevent navigation if clicking on checkboxes or toggle switches
        const target = e.target as HTMLElement;
        if (target.closest("input") || target.closest("label") || target.closest("[data-copy-button]")) {
            return;
        }
        onPreordertSelect(preorderId, preorderId == 0 ? "new" : "edit");
    };
    const handlePopupCredits = () => {
        setShowCreditsPopup(true);
    };
    const handleSubmitCredit = async () => {
        let advancePayment = 0;
        let creditNote = 0;
        let excessPayment = 0;
        let totalCredit = 0;
        selectedData.crDetails.forEach((list: any) => {
            if (Number(list.default_amount) > 0) {
                if (Number(list.account_code) === 21312) {
                    advancePayment = list.default_amount;
                } else if (Number(list.account_code) === 21313 || Number(list.account_code) === 21602) {
                    creditNote += list.default_amount; // accumulate if multiple possible
                } else if (Number(list.account_code) === 21310) {
                    excessPayment = list.default_amount;
                }
                totalCredit += list.default_amount;
            }
        });

        if (totalCredit > Number(formData.balance_to_pay)) {
            showErrorToast(translations["Please input number lower than or equal to "] || "Please input number lower than or equal to" + formData.balance_to_pay);
            return;
        }
        const conversionKey = formData.currency + baseCurrency();
        const Operator = await fetchOperator(conversionKey);
        const exRate = Number(formData.ex_rate);
        let baseCreditNote = 0;
        let baseAdvancePayment = 0;
        let baseExcessPayment = 0;
        if (formData.currency == baseCurrency()) {
            baseCreditNote = creditNote;
            baseAdvancePayment = advancePayment;
            baseExcessPayment = excessPayment;
        } else {
            if (Operator == "Divide") {
                baseCreditNote = creditNote / exRate;
                baseAdvancePayment = advancePayment / exRate;
                baseExcessPayment = excessPayment / exRate;
            }
            if (Operator == "Multiply") {
                baseCreditNote = creditNote * exRate;
                baseAdvancePayment = advancePayment * exRate;
                baseExcessPayment = excessPayment * exRate;
            }
        }
        const creditUsed = creditNote + advancePayment + excessPayment;
        const balanceToPay = Number(formData.balance_to_pay) + Number(formData.bank_charges) - creditUsed;
        if (creditUsed > formData.current_credit) {
            showErrorToast(translations["Credit used is greater than current credit"]);
            return;
        }
        if (advancePayment > 0) {
            setShowInputs((prevState) => ({ ...prevState, isAdvancePayment: false }));
        } else {
            setShowInputs((prevState) => ({ ...prevState, isAdvancePayment: true }));
        }

        if (creditNote > 0) {
            setShowInputs((prevState) => ({ ...prevState, isCreditNote: false }));
        } else {
            setShowInputs((prevState) => ({ ...prevState, isCreditNote: true }));
        }

        if (excessPayment > 0) {
            setShowInputs((prevState) => ({ ...prevState, isExcessPayment: false }));
        } else {
            setShowInputs((prevState) => ({ ...prevState, isExcessPayment: true }));
        }

        if (creditUsed > 0) {
            setShowInputs((prevState) => ({ ...prevState, isTotalCreditUsed: false }));
        } else {
            setShowInputs((prevState) => ({ ...prevState, isTotalCreditUsed: true }));
        }

        setFormData((prevState) => ({
            ...prevState,
            credit_note: String(creditNote ?? "0.00"),
            base_credit_note: String(baseCreditNote ?? "0.00"),
            advance_payment: String(advancePayment ?? "0.00"),
            base_advance_payment: String(baseAdvancePayment ?? "0.00"),
            excess_payment: String(excessPayment ?? "0.00"),
            base_excess_payment: String(baseExcessPayment ?? "0.00"),
            total_credit_used: String(creditUsed ?? "0.00"),
            balance_to_pay: String(balanceToPay ?? "0.00"),
        }));
        setShowCreditsPopup(false);
    };
    const handleAdvanceSearch = () => {
        let countCodes = 0;
        let countGroups = 0;
        if (formData.sort_by === "Code" && formData.customerCodes.length > 0) {
            countCodes++;
        }
        if (formData.sort_by === "Group" && formData.customerGroups.length > 0) {
            countGroups++;
        }
        let countProducts = formData.productCodes.length;
        // Stop if no filters selected
        if (countCodes === 0 && countGroups === 0 && countProducts === 0) {
            return;
        }
        setLoading(true);
        setActiveAdvanceSearch(true);
        setShowAdvanceSearch(false);
        // Build filter object
        const filters = {
            search: "",
            customer_codes: formData.sort_by === "Code" ? formData.customerCodes.map((c) => c.value) : [],
            customer_groups: formData.sort_by === "Group" ? formData.customerGroups.map((g) => g.value) : [],
            product_codes: formData.productCodes.map((p) => p.value),
            date_from: formData.date_from,
            date_to: formData.date_to,
            category_dates: formData.category_dates,
        };
        fetchPreorder(1, itemsPerPage, filters);
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
            customer_groups: formData.sort_by === "Group" ? formData.customerGroups.map((g) => g.value) : [],
            product_codes: formData.productCodes.map((p) => p.value),
            date_from: formData.date_from,
            date_to: formData.date_to,
            category_dates: formData.category_dates,
        };
        fetchPreorder(1, itemsPerPage, filters);
    };
    const handleReset = () => {
        setFormData({
            ...formData,
            date_from: null,
            date_to: null,
            category_dates: "OrderDate",
            sort_by: "Code",
            customerCodes: [],
            customerGroups: [],
            productCodes: [],
        });
        setLoading(true);
        setActiveAdvanceSearch(false);
        setShowDropdown(false);
        fetchPreorder(1, 15, {
            search: "",
            customer_codes: [],
            customer_groups: [],
            product_codes: [],
            date_from: null,
            date_to: null,
            category_dates: "OrderDate",
        });
    };
    const handleKeyPress = (e: any) => {
        if (e.key === "Enter") {
            handleSearchClosing();
        }
    };
    const handleSearchClosing = async () => {
        try {
            localStorage.setItem(`${tabId}-loading-closing`, JSON.stringify(true));
            const paginatedData = await preorderService.getAllClosingStatus(currentPage, itemsPerPage, searchClosingStatus);
            setClosingStatusCust(paginatedData.data);
            setClosingStatusProd(paginatedData.data2);
            localStorage.setItem(`${tabId}-cached-closing`, JSON.stringify(paginatedData.data));
            localStorage.setItem(
                `${tabId}-cached-meta-closing`,
                JSON.stringify({
                    currentPage,
                    itemsPerPage,
                    totalPages: paginatedData.last_page,
                    totalItems: paginatedData.total,
                })
            );
        } catch (err) {
            console.error("Error fetching closing:", err);
        } finally {
            setLoading(false);
            localStorage.setItem(`${tabId}-loading-closing`, JSON.stringify(false));
        }
    };
    const handleRowClick_Customer = (e: React.MouseEvent, tableId: number) => {
        // Prevent navigation if clicking on checkboxes or toggle switches
        const target = e.target as HTMLElement;
        if (target.closest("input") || target.closest("label") || target.closest("[data-copy-button]")) {
            return;
        }
        const customerListKey = `${tabId}-cached-customers`;
        const cachedCustomersRaw = localStorage.getItem(customerListKey);
        let rawDataCached: ApiCustomer[] | null = null;

        if (cachedCustomersRaw) {
            try {
                rawDataCached = JSON.parse(cachedCustomersRaw);
            } catch (error) {
                console.error("Error parsing cached customer data", error);
            }
        }
        // Using optional chaining (?.) to avoid null errors
        const specificItem = rawDataCached?.find((item: ApiCustomer) => item.id === tableId);
        const customer_id = specificItem?.id;
        const customer_code = specificItem?.customer_code?.toString();
        const account_name_en = specificItem?.account_name_en?.toString();
        const currency = specificItem?.currency?.toString();
        setFormDataVoucher((prev) => ({
            ...prev,
            customer_id: Number(customer_id),
            customer_code: String(customer_code),
            customer_name: String(account_name_en),
            currency: String(currency),
        }));
        setShowCustomers(false);
    };
    const handleRowEnter_Customer = async (value: string) => {
        const paginatedData = await customerService.getAllCustomerByCode(1, 10, value);
        const data = paginatedData.data;
        const len = data.length;
        if (len === 1) {
            // Using optional chaining (?.) to avoid null errors
            const specificItem = data[0];
            const customer_id = specificItem?.id;
            const customer_code = specificItem?.customer_code?.toString();
            const account_name_en = specificItem?.account_name_en?.toString();
            const currency = specificItem?.currency?.toString();
            setFormDataVoucher((prev) => ({
                ...prev,
                customer_id: Number(customer_id),
                customer_code: String(customer_code),
                customer_name: String(account_name_en),
                currency: String(currency),
            }));
        } else if (len > 1) {
            setShowCustomers(true);
            setSearchTermCustomer(value);
        } else {
            setShowCustomers(true);
            setSearchTermCustomer("");
        }
    };
    const handleSaveVoucher = async () => {
        setLoadingSaveVoucher(true);
        const data = new FormData();
        const customer_code = formDataVoucher["customer_code"]?.toString().trim() ?? "";
        if (!customer_code || customer_code === "") {
            showErrorToast(translations["Customer Account Code is Required"]);
            setLoadingSaveVoucher(false);
            return;
        }
        // Append all form data
        Object.keys(formDataVoucher).forEach((key) => {
            let value = formDataVoucher[key as keyof typeof formDataVoucher];
            if (value !== null && value !== undefined) {
                data.append(key, value.toString());
            }
            if (value instanceof Date) {
                data.append(key, formatDateToCustom(value));
            }
        });

        try {
            const result = await preorderService.updateVoucher(formDataVoucher.voucher_id, data);
            const newId = result?.id;
            const newVoucherNo = result?.voucher_no;
            if (result.token === "Error") {
                showErrorToast(translations[result.message] + " " + result.message2);
                return;
            }
            fetchVoucherList();
            setFormDataVoucher((prev) => ({
                ...prev,
                voucher_id: Number(newId),
                voucher_no: String(newVoucherNo),
            }));
            showSuccessToast(translations[result.message]);
        } catch (error) {
            showErrorToast(translations["Failed to save Preorder."] || "Failed to save Preorder.");
        } finally {
            setLoadingSaveVoucher(false);
        }
    };
    const handleRemoveConfirmItems = async (id: number) => {
        if (selectedPreorder.length === 1) {
            showErrorToast(translations["Please remain atleast 1 item"] || "Please remain atleast 1 item");
            return;
        }

        const confirmed = await showConfirm(translations["System Message"], translations["Are you sure you want to delete this record?"], translations["Delete"], translations["Cancel"]);
        if (!confirmed) return;

        selectedPreorder = selectedPreorder.filter((item) => item !== id);
        onselectedPreorderChange(selectedPreorder);
        handleConfirmOrder();
    };
    const renderConfirmOrder = () => {
        if (!confirmPopup) return null;
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-[#19191c] rounded-xl border border-[#ffffff1a] w-[80vw] h-auto flex flex-col">
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-[#ffffff1a]">
                        <div className="flex items-center space-x-4">
                            <h2 className="text-xl font-bold text-white">{translations["New Orders"]}</h2>
                        </div>
                        <div className="flex items-center space-x-4">
                            <button
                                onClick={() => {
                                    setShowConfirmPopup(false);
                                }}
                                className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                            >
                                <X className="h-6 w-6 text-white" />
                            </button>
                        </div>
                    </div>
                    {/* Content */}
                    <div className="max-h-[calc(100vh-330px)] overflow-y-auto">
                        <div className="flex-1 overflow-auto p-2">
                            <div className="grid grid-cols-12 gap-2">
                                <div className="col-span-12 md:col-span-12">
                                    <fieldset className="border border-[#ffffff1a] rounded-lg p-4 mb-2">
                                        <legend className="text-white text-left px-3 py-1 border border-[#ffffff1a] rounded-md bg-[#19191c]">
                                            {translations["Order Information"] || "Order Information"} :
                                        </legend>
                                        <table className="w-full border">
                                            <thead className="sticky top-0 z-[1]" style={{ backgroundColor: "#1f2132" }}>
                                                <tr className="border-b" style={{ borderColor: "#2d2d30" }}>
                                                    <th className="text-left py-1 px-4 text-gray-400 text-sm w-12"></th>
                                                    <th className="text-left py-2 px-4 text-gray-400 text-sm">{translations["Customer Code"]}</th>
                                                    <th className="text-left py-2 px-4 text-gray-400 text-sm">{translations["Company"]}</th>
                                                    <th className="text-left py-2 px-4 text-gray-400 text-sm">{translations["Total Amount"]}</th>
                                                    <th className="text-left py-2 px-4 text-gray-400 text-sm">{translations["Total Deposit"]}</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                <tr className="border-b hover:bg-gray-700 hover:bg-opacity-30 transition-colors" style={{ borderColor: "#40404042" }}>
                                                    <td className="py-3 px-4 text-gray-400 text-left text-custom-sm">
                                                        <button className={`px-1 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-xs`}>
                                                            <Minus size={16} />
                                                        </button>
                                                    </td>
                                                    <td className="py-3 px-4 text-gray-400 text-left text-custom-sm">{selectedData.customer_code}</td>
                                                    <td className="py-3 px-4 text-gray-400 text-left text-custom-sm">
                                                        {selectedData.customer_type === "WC" ? selectedData.company : selectedData.account_name_en}
                                                    </td>
                                                    <td className="py-3 px-4 text-gray-400 text-left text-custom-sm">
                                                        {selectedData.currency} {formatMoney(selectedData.total)}
                                                    </td>
                                                    <td className="py-3 px-4 text-gray-400 text-left text-custom-sm">
                                                        {selectedData.currency} {formatMoney(selectedData.total_item_deposit)}
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td colSpan={5}>
                                                        <table className="w-full" style={{ backgroundColor: "#060818" }}>
                                                            <thead className="sticky top-0 z-[1] py-1 px-4" style={{ backgroundColor: "#1f2132" }}>
                                                                <tr className="border-b" style={{ borderColor: "#2d2d30" }}>
                                                                    <th className="text-left py-2 px-4 text-gray-400 text-sm">{translations["Product Code"]}</th>
                                                                    <th className="text-left py-2 px-4 text-gray-400 text-sm">{translations["Product Name"]}</th>
                                                                    <th className="text-left py-2 px-4 text-gray-400 text-sm">{translations["Price"]}</th>
                                                                    <th className="text-left py-2 px-4 text-gray-400 text-sm">{translations["Qty"]}</th>
                                                                    <th className="text-left py-2 px-4 text-gray-400 text-sm">{translations["Amount"]}</th>
                                                                    <th className="text-left py-2 px-4 text-gray-400 text-sm">{translations["Deposit"]}</th>
                                                                    <th className={`text-left py-2 px-4 text-gray-400 text-sm ${!showInputs.isAll ? "" : "hidden"}`}>{translations["Action"]}</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {selectedData.list.map((item: any, index: number) => (
                                                                    <tr key={index}>
                                                                        <td className="py-3 px-4 text-gray-400 text-left text-custom-sm">{item.product_code}</td>
                                                                        <td className="py-3 px-4 text-gray-400 text-left text-custom-sm">
                                                                            {lang === "en" ? item.product_title_en : item.product_title_cn}
                                                                        </td>
                                                                        <td className="py-3 px-4 text-gray-400 text-left text-custom-sm">
                                                                            {item.currency} {formatMoney(item.price)}
                                                                        </td>
                                                                        <td className="py-3 px-4 text-gray-400 text-left text-custom-sm">{item.qty}</td>
                                                                        <td className="py-3 px-4 text-gray-400 text-left text-custom-sm">
                                                                            {item.currency} {formatMoney(item.total)}
                                                                        </td>
                                                                        <td className="py-3 px-4 text-gray-400 text-left text-custom-sm">
                                                                            {item.currency} {formatMoney(item.item_deposit)}
                                                                        </td>
                                                                        <td className={`py-3 px-4 text-gray-400 text-left text-custom-sm ${!showInputs.isAll ? "" : "hidden"}`}>
                                                                            <button
                                                                                onClick={() => handleRemoveConfirmItems(item.id)}
                                                                                className={`px-1 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-xs`}
                                                                            >
                                                                                <X size={16} />
                                                                            </button>
                                                                        </td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </fieldset>
                                </div>
                                <div className={`col-span-12 md:col-span-4 ${!showInputs.isAll ? "" : "hidden"}`}>
                                    <div className="flex-1 overflow-auto p-4 border border-[#ffffff1a] rounded-lg mb-2">
                                        <div className="space-y-2">
                                            {/* Current Credit - Made responsive */}
                                            <div className={`flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 ${!showInputs.isCurrentCredit ? "" : "hidden"}`}>
                                                <label className="text-gray-400 text-sm sm:w-32 shrink-0">{translations["Current Credit"]}</label>
                                                <div className="flex flex-1 min-w-0">
                                                    <NumericFormat
                                                        value={formData.current_credit === 0 ? "" : formData.current_credit}
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
                                                        className="flex-1 min-w-0 px-3 py-2 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm rounded-md !rounded-tr-none !rounded-br-none"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={handlePopupCredits}
                                                        disabled={currentCreditDisabled}
                                                        className="px-2 py-2 bg-cyan-600 text-white !rounded-tr-md !rounded-br-md !rounded-tl-none !rounded-bl-none hover:bg-cyan-700 flex items-center justify-center border border-[#ffffff1a] border-l-0 shrink-0"
                                                    >
                                                        <Search className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Credit Note - Made responsive */}
                                            <div className={`flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 ${!showInputs.isCreditNote ? "" : "hidden"}`}>
                                                <label className="text-gray-400 text-sm sm:w-32 shrink-0">{translations["Credit Note"]}</label>
                                                <div className="flex-1 min-w-0">
                                                    <NumericFormat
                                                        value={formData.credit_note}
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
                                                        className="w-full px-3 py-2 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm rounded-md"
                                                    />
                                                </div>
                                            </div>

                                            {/* Advance Payment - Made responsive */}
                                            <div className={`flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 ${!showInputs.isAdvancePayment ? "" : "hidden"}`}>
                                                <label className="text-gray-400 text-sm sm:w-32 shrink-0">{translations["Advance Payment"]}</label>
                                                <div className="flex-1 min-w-0">
                                                    <NumericFormat
                                                        value={formData.advance_payment}
                                                        decimalSeparator="."
                                                        decimalScale={2}
                                                        readOnly
                                                        fixedDecimalScale
                                                        allowNegative={true}
                                                        prefix={`${formData.currency} `}
                                                        placeholder="0.00"
                                                        onValueChange={({ floatValue }) => {
                                                            setFormData((prev) => ({
                                                                ...prev,
                                                                advance_payment: String(floatValue) ?? "0.00",
                                                            }));
                                                        }}
                                                        className="w-full px-3 py-2 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm rounded-md"
                                                    />
                                                </div>
                                            </div>

                                            {/* Excess Payment - Made responsive */}
                                            <div className={`flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 ${!showInputs.isExcessPayment ? "" : "hidden"}`}>
                                                <label className="text-gray-400 text-sm sm:w-32 shrink-0">{translations["Excess Payment"]}</label>
                                                <div className="flex-1 min-w-0">
                                                    <NumericFormat
                                                        value={formData.excess_payment}
                                                        decimalSeparator="."
                                                        decimalScale={2}
                                                        readOnly
                                                        fixedDecimalScale
                                                        allowNegative={true}
                                                        prefix={`${formData.currency} `}
                                                        placeholder="0.00"
                                                        onValueChange={({ floatValue }) => {
                                                            setFormData((prev) => ({
                                                                ...prev,
                                                                excess_payment: String(floatValue) ?? "0.00",
                                                            }));
                                                        }}
                                                        className="w-full px-3 py-2 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm rounded-md"
                                                    />
                                                </div>
                                            </div>

                                            {/* Total Credit Used - Made responsive */}
                                            <div className={`flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 ${!showInputs.isTotalCreditUsed ? "" : "hidden"}`}>
                                                <label className="text-gray-400 text-sm sm:w-32 shrink-0">{translations["Total Credit Used"]}</label>
                                                <div className="flex-1 min-w-0">
                                                    <NumericFormat
                                                        value={formData.total_credit_used}
                                                        decimalSeparator="."
                                                        decimalScale={2}
                                                        readOnly
                                                        fixedDecimalScale
                                                        allowNegative={true}
                                                        prefix={`${formData.currency} `}
                                                        placeholder="0.00"
                                                        onValueChange={({ floatValue }) => {
                                                            setFormData((prev) => ({
                                                                ...prev,
                                                                total_credit_used: String(floatValue) ?? "0.00",
                                                            }));
                                                        }}
                                                        className="w-full px-3 py-2 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm rounded-md"
                                                    />
                                                </div>
                                            </div>

                                            {/* Bank Charges - Made responsive */}
                                            <div className={`flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 ${!showInputs.isBankCharges ? "" : "hidden"}`}>
                                                <label className="text-gray-400 text-sm sm:w-32 shrink-0">{translations["Bank Charges"]}</label>
                                                <div className="flex-1 min-w-0">
                                                    <NumericFormat
                                                        value={String(formData.bank_charges) === "0.00" ? "" : formData.bank_charges}
                                                        decimalSeparator="."
                                                        decimalScale={2}
                                                        fixedDecimalScale
                                                        allowNegative={true}
                                                        prefix={`${formData.currency} `}
                                                        placeholder={`${formData.currency} 0.00`}
                                                        onValueChange={({ floatValue }) => {
                                                            setFormData((prev) => ({
                                                                ...prev,
                                                                bank_charges: String(floatValue) ?? "0.00",
                                                            }));
                                                        }}
                                                        className="w-full px-3 py-2 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm rounded-md"
                                                    />
                                                </div>
                                            </div>

                                            {/* Deposit To Pay - Made responsive */}
                                            <div className={`flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 ${!showInputs.isDepositToPay ? "" : "hidden"}`}>
                                                <label className="text-gray-400 text-sm sm:w-32 shrink-0">{translations["Deposit To Pay"]}</label>
                                                <div className="flex-1 min-w-0">
                                                    <NumericFormat
                                                        value={String(formData.balance_to_pay) === "0.00" ? "" : formData.balance_to_pay}
                                                        decimalSeparator="."
                                                        decimalScale={2}
                                                        fixedDecimalScale
                                                        allowNegative={true}
                                                        prefix={`${formData.currency} `}
                                                        placeholder={`${formData.currency} 0.00`}
                                                        onValueChange={({ floatValue }) => {
                                                            setFormData((prev) => ({
                                                                ...prev,
                                                                balance_to_pay: String(floatValue) ?? "0.00",
                                                            }));
                                                        }}
                                                        className="w-full px-3 py-2 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm rounded-md"
                                                    />
                                                </div>
                                            </div>

                                            {/* Bank - Made responsive */}
                                            <div className={`flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 ${!showInputs.isBank ? "" : "hidden"}`}>
                                                <label className="text-gray-400 text-sm sm:w-32 shrink-0">{translations["Bank"]}</label>
                                                <div className="flex-1 min-w-0">
                                                    <Select
                                                        classNamePrefix="react-select"
                                                        value={formData.banks}
                                                        onChange={(selected) => {
                                                            setFormData({ ...formData, banks: selected as OptionType | null });
                                                        }}
                                                        options={banksOptions}
                                                        styles={{
                                                            ...selectStyles,
                                                            menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                                                        }}
                                                        className="w-full"
                                                        isClearable
                                                        placeholder={translations["Select"]}
                                                        menuPlacement="auto"
                                                        menuPosition="fixed"
                                                        menuPortalTarget={typeof window !== "undefined" ? document.body : null}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className={`col-span-12 ${!showInputs.isAll ? "md:col-span-8" : "md:col-span-12"}`}>
                                    <div className="flex-1 overflow-auto p-2 border border-[#ffffff1a] rounded-lg mb-2">
                                        <table className="w-full border">
                                            <thead className="sticky top-0 z-[1]" style={{ backgroundColor: "#1f2132" }}>
                                                <tr className="border-b" style={{ borderColor: "#2d2d30" }}>
                                                    <th className="text-left py-2 px-4 text-gray-400 text-sm">{translations["Date"]}</th>
                                                    <th className="text-left py-2 px-4 text-gray-400 text-sm">{translations["Transaction Ref"]}</th>
                                                    <th className="text-left py-2 px-4 text-gray-400 text-sm">{translations["Product Code"]}</th>
                                                    <th className="text-left py-2 px-4 text-gray-400 text-sm">{translations["Particulars"]}</th>
                                                    <th className="text-left py-2 px-4 text-gray-400 text-sm">{translations["Qty"]}</th>
                                                    <th className="text-left py-2 px-4 text-gray-400 text-sm">{translations["Amount"]}</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {selectedData.rvs.length === 0 ? (
                                                    <tr>
                                                        <td colSpan={6} className="py-3 px-4 text-gray-400 text-center text-custom-sm">
                                                            {translations["No Record Found"]}
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    selectedData.rvs.map((item: any, index: number) => (
                                                        <tr key={index}>
                                                            <td className="py-3 px-4 text-gray-400 text-left text-custom-sm">{formatDate(item.date, lang)}</td>
                                                            <td className="py-3 px-4 text-gray-400 text-left text-custom-sm">{item.no}</td>
                                                            <td className="py-3 px-4 text-gray-400 text-left text-custom-sm">{item.product_code}</td>
                                                            <td className="py-3 px-4 text-gray-400 text-left text-custom-sm">{item.particulars}</td>
                                                            <td className="py-3 px-4 text-gray-400 text-left text-custom-sm">{item.qty}</td>
                                                            <td className="py-3 px-4 text-gray-400 text-left text-custom-sm">
                                                                {item.currency} {formatMoney(item.amount)}
                                                            </td>
                                                        </tr>
                                                    ))
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    {/* Footer */}
                    <div className="p-2 border-t border-[#ffffff1a] flex justify-end space-x-1">
                        <button onClick={() => setShowConfirmPopup(false)} className="px-2 py-2 bg-gray-700 hover:bg-gray-600 rounded text-white transition">
                            {translations["Close"]}
                        </button>
                        <button onClick={() => handleNoDepositNeeded()} className={`px-2 py-2 bg-cyan-600 hover:bg-cyan-500 rounded text-white transition ${!showInputs.isAll ? "" : "hidden"}`}>
                            {translations["No Deposit Needed"]}
                        </button>
                        <button
                            onClick={() => handleSaveConfirmOrder()}
                            className={`px-2 py-2 bg-cyan-600 hover:bg-cyan-500 rounded text-white transition ${!showInputs.isAll ? "" : "hidden"}
                            ${loadConfirmOrder ? "bg-gray-500 cursor-not-allowed opacity-50" : "bg-cyan-600 hover:bg-cyan-700"} 
                            text-[#ffffffcc] flex justify-center items-center`}
                            disabled={loadConfirmOrder}
                        >
                            {loadConfirmOrder ? (
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
    const renderCreditsPopup = () => {
        if (!creditsPopup) return null;
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-[#19191c] rounded-xl border border-[#ffffff1a] w-[60vw] h-auto flex flex-col">
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-[#ffffff1a]">
                        <div className="flex items-center space-x-4">
                            <h2 className="text-xl font-bold text-white">{translations["Credits"]}</h2>
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
                                                <th className="w-[15%] text-left py-2 px-4 text-gray-400 text-sm">{translations["Account Code"]}</th>
                                                <th className="w-[25%] text-left py-2 px-4 text-gray-400 text-sm">{translations["Account Name"]}</th>
                                                <th className="w-[25%] text-left py-2 px-4 text-gray-400 text-sm">{translations["Transaction Ref"]}</th>
                                                <th className="w-[15%] text-left py-2 px-4 text-gray-400 text-sm">{translations["Amount"]}</th>
                                                <th className="w-[20%] text-left py-2 px-4 text-gray-400 text-sm"></th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {selectedData.crDetails.map((item: any, index: number) => {
                                                if (Number(item.amount) > 0) {
                                                    let inputValue = Number(item.default_amount) > Number(item.amount) ? 0 : item.default_amount ?? 0;
                                                    return (
                                                        <tr key={index}>
                                                            <td className="py-3 px-4 text-gray-400 text-left text-custom-sm">{item.account_code}</td>
                                                            <td className="py-3 px-4 text-gray-400 text-left text-custom-sm">{lang === "en" ? item.account_name_en : item.account_name_cn}</td>
                                                            <td className="py-3 px-4 text-gray-400 text-left text-custom-sm">{item.ref_data}</td>
                                                            <td className="py-3 px-4 text-gray-400 text-left text-custom-sm">
                                                                {item.currency} {formatMoney(item.amount)}
                                                            </td>
                                                            <td className="py-3 px-4 text-gray-400 text-left text-custom-sm">
                                                                <input
                                                                    value={inputValue === 0 ? "" : inputValue}
                                                                    onChange={(e) => {
                                                                        const inputVal = e.target.value === "" ? 0 : Number(e.target.value);
                                                                        const TOTAL_LIMIT = Number(formData.balance_to_pay || 0);

                                                                        setSelectedData((prev: any) => {
                                                                            const updatedCrDetails = [...prev.crDetails];
                                                                            const currentMaxAmount = Number(updatedCrDetails[index].amount);

                                                                            // Cap input to row's max amount
                                                                            const value = Math.min(inputVal, currentMaxAmount);

                                                                            // Update current row
                                                                            updatedCrDetails[index] = {
                                                                                ...updatedCrDetails[index],
                                                                                default_amount: value,
                                                                            };

                                                                            // Calculate remaining
                                                                            const remaining = TOTAL_LIMIT - value;

                                                                            // Clear all OTHER fields first
                                                                            updatedCrDetails.forEach((detail: any, idx: number) => {
                                                                                if (idx !== index && Number(detail.amount) > 0) {
                                                                                    updatedCrDetails[idx] = {
                                                                                        ...updatedCrDetails[idx],
                                                                                        default_amount: 0,
                                                                                    };
                                                                                }
                                                                            });

                                                                            // If there's remaining, fill the next field
                                                                            if (remaining > 0) {
                                                                                for (let i = 0; i < updatedCrDetails.length; i++) {
                                                                                    if (i !== index && Number(updatedCrDetails[i].amount) > 0) {
                                                                                        const maxForThisRow = Number(updatedCrDetails[i].amount);
                                                                                        const amountToSet = Math.min(remaining, maxForThisRow);

                                                                                        updatedCrDetails[i] = {
                                                                                            ...updatedCrDetails[i],
                                                                                            default_amount: amountToSet,
                                                                                        };
                                                                                        break;
                                                                                    }
                                                                                }
                                                                            }

                                                                            return {
                                                                                ...prev,
                                                                                crDetails: updatedCrDetails,
                                                                            };
                                                                        });
                                                                    }}
                                                                    type="number"
                                                                    placeholder="0"
                                                                    className="flex-1 px-3 py-2 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm w-full"
                                                                />
                                                            </td>
                                                        </tr>
                                                    );
                                                }
                                            })}
                                        </tbody>
                                    </table>
                                </fieldset>
                            </div>
                        </div>
                    </div>
                    {/* Footer */}
                    <div className="p-2 border-t border-[#ffffff1a] flex justify-end space-x-1">
                        <button onClick={() => setShowCreditsPopup(false)} className="px-2 py-2 bg-gray-700 hover:bg-gray-600 rounded text-white transition">
                            {translations["Close"]}
                        </button>
                        <button onClick={() => handleSubmitCredit()} className={`px-2 py-2 bg-cyan-600 hover:bg-cyan-500 rounded text-white transition`}>
                            {translations["Submit"]}
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
                        <div className="col-span-12 md:col-span-3">
                            <label className="text-gray-400 text-sm">{translations["Sort By"]}</label>
                            <Select
                                value={sortByUnits.find((o) => o.value === String(formData.sort_by))}
                                onChange={(selected) => {
                                    setFormData({ ...formData, sort_by: selected ? selected.value : "" });
                                }}
                                classNamePrefix="react-select"
                                options={sortByUnits}
                                styles={{
                                    ...selectStyles,
                                    menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                                }}
                                placeholder={translations["Select"]}
                                menuPlacement="auto"
                                menuPosition="fixed"
                                menuPortalTarget={typeof window !== "undefined" ? document.body : null}
                            />
                        </div>
                        <div className="col-span-12 md:col-span-9">
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
                            {formData.sort_by !== "Code" && (
                                <Select
                                    classNamePrefix="react-select"
                                    isMulti
                                    value={formData.customerGroups}
                                    onChange={(selected) => {
                                        setFormData({ ...formData, customerGroups: selected as OptionType[] });
                                    }}
                                    options={allGroupOption}
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
                        {/* Second Row: Product Code */}
                        <div className="col-span-12">
                            <label className="text-gray-400 text-sm">{translations["Product Code"]}</label>
                            <Select
                                classNamePrefix="react-select"
                                isMulti
                                value={formData.productCodes}
                                onChange={(selected) => {
                                    setFormData({ ...formData, productCodes: selected as OptionType[] });
                                }}
                                options={allProductOptions}
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
                        <div className="col-span-12">
                            <label className="text-gray-400 text-sm block mb-1">{translations["Category"]}</label>
                            <Select
                                value={categoryDates.find((o) => o.value === String(formData.category_dates))}
                                onChange={(selected) => {
                                    setFormData({ ...formData, category_dates: selected ? selected.value : "" });
                                }}
                                classNamePrefix="react-select"
                                options={categoryDates}
                                styles={{
                                    ...selectStyles,
                                    menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                                }}
                                placeholder={translations["Select"]}
                                menuPlacement="auto"
                                menuPosition="fixed"
                                menuPortalTarget={typeof window !== "undefined" ? document.body : null}
                            />
                        </div>

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
    const renderPreorderClosing = () => {
        if (!showPreorderClosing) return null;
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-[#19191c] rounded-xl border border-[#ffffff1a] w-[40vw] h-auto flex flex-col">
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-[#ffffff1a]">
                        <div className="flex items-center space-x-4">
                            <h2 className="text-xl font-bold text-white">{translations["PreorderCloseStatus"]}</h2>
                        </div>
                        <div className="flex items-center space-x-4">
                            <button
                                onClick={() => {
                                    setShowPreorderClosing(false);
                                }}
                                className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                            >
                                <X className="h-6 w-6 text-white" />
                            </button>
                        </div>
                    </div>
                    {/* Content */}
                    <div className="p-2">
                        <fieldset className="border border-[#ffffff1a] rounded-lg p-4 mb-2">
                            <legend className="text-white text-left px-3 py-1 border border-[#ffffff1a] rounded-md bg-[#19191c]">
                                {translations["Product Information"] || "Product Information"} :
                            </legend>
                            <div className="flex justify-between items-center mb-2">
                                <div className="flex items-center space-x-4">
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={searchClosingStatus}
                                            onKeyDown={handleKeyPress} // Trigger search on "Enter"
                                            placeholder={translations["Search"]}
                                            onChange={(e) => setSearchClosingStatus(e.target.value)}
                                            className="pl-10 pr-4 py-2 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-sm"
                                            style={{ backgroundColor: "#2d2d30", borderColor: "#555555" }}
                                        />
                                    </div>
                                    <button
                                        onClick={handleSearchClosing}
                                        className="ml-2 px-3 py-2 border rounded-lg text-white transition-colors flex items-center space-x-px hover:bg-cyan-600 text-sm"
                                        style={{ backgroundColor: "#0891b2", borderColor: "#2d2d30", marginLeft: "5px" }}
                                    >
                                        <span>{translations["Search"]}</span>
                                    </button>
                                </div>
                            </div>
                            <table className="w-full border">
                                <thead className="sticky top-0 z-[1]" style={{ backgroundColor: "#1f2132" }}>
                                    <tr className="border-b" style={{ borderColor: "#2d2d30" }}>
                                        <th className="text-left py-1 px-4 text-gray-400 text-sm w-12"></th>
                                        <th className="text-left py-2 px-4 text-gray-400 text-sm">{translations["Product Name"]}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {closingStatusProd ? (
                                        <tr className="border-b hover:bg-gray-700 hover:bg-opacity-30 transition-colors" style={{ borderColor: "#40404042" }}>
                                            <td className="py-1 px-1 text-gray-400 text-left text-custom-sm">
                                                <img
                                                    src={`${import.meta.env.VITE_BASE_URL}/storage/${closingStatusProd.product_thumbnail ?? "products/no-image-min.jpg"}`}
                                                    alt="Thumbnail"
                                                    className="w-full h-full object-cover"
                                                    onError={(e) => {
                                                        (e.target as HTMLImageElement).src = `${import.meta.env.VITE_BASE_URL}/storage/products/no-image-min.jpg`;
                                                    }}
                                                />
                                            </td>
                                            <td className="text-left py-2 px-4 text-gray-400 text-sm">{lang === "en" ? closingStatusProd.product_title_en : closingStatusProd.product_title_cn}</td>
                                        </tr>
                                    ) : (
                                        <tr>
                                            <td colSpan={2} className="text-center py-4 text-gray-400 text-sm italic">
                                                {translations["No Record Found"]}
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </fieldset>
                        <fieldset className="border border-[#ffffff1a] rounded-lg p-4 mb-2">
                            <legend className="text-white text-left px-3 py-1 border border-[#ffffff1a] rounded-md bg-[#19191c]">{translations["Order Information"] || "Order Information"} :</legend>
                            <div className="max-h-[calc(100vh-600px)] overflow-y-auto">
                                <table className="w-full">
                                    <thead className="sticky top-0 z-[1]" style={{ backgroundColor: "#1f2132" }}>
                                        <tr className="border-b" style={{ borderColor: "#2d2d30" }}>
                                            <th className="text-left py-2 px-4 text-gray-400 text-sm">{translations["Customer Code"]}</th>
                                            <th className="text-left py-2 px-4 text-gray-400 text-sm">{translations["Customer Name"]}</th>
                                            <th className="text-left py-2 px-4 text-gray-400 text-sm">{translations["Email Address"]}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {closingStatusCust.length > 0 ? (
                                            closingStatusCust.map((list, index) => (
                                                <tr key={index} className="border-b hover:bg-gray-700 hover:bg-opacity-30 transition-colors" style={{ borderColor: "#40404042" }}>
                                                    <td className="py-3 px-4 text-gray-400 text-left text-custom-sm">{list.customer_code}</td>
                                                    <td className="py-3 px-4 text-gray-400 text-left text-custom-sm">{list.account_name_en}</td>
                                                    <td className="py-3 px-4 text-gray-400 text-left text-custom-sm">{list.email_address}</td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={3} className="text-center py-4 text-gray-400 text-sm italic">
                                                    No record found
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </fieldset>
                    </div>
                    {/* Footer */}
                    <div className="p-2 border-t border-[#ffffff1a] flex justify-end space-x-1">
                        <button onClick={() => setShowPreorderClosing(false)} className="px-2 py-2 bg-gray-700 hover:bg-gray-600 rounded text-white transition">
                            {translations["Close"]}
                        </button>
                    </div>
                </div>
            </div>
        );
    };
    const renderVoucher = () => {
        if (!showVoucher) return null;
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-[#19191c] rounded-xl border border-[#ffffff1a] w-[60vw] h-auto flex flex-col">
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-[#ffffff1a]">
                        <div className="flex items-center space-x-4">
                            <h2 className="text-xl font-bold text-white">{translations["Voucher"]}</h2>
                        </div>
                        <div className="flex items-center space-x-4">
                            <button
                                onClick={() => {
                                    setShowVoucher(false);
                                }}
                                className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                            >
                                <X className="h-6 w-6 text-white" />
                            </button>
                        </div>
                    </div>
                    {/* Content */}
                    <div className="p-4">
                        {showVoucherInfo ? (
                            <>
                                <div className="flex justify-between items-center mb-2">
                                    <div className="flex items-center space-x-4">
                                        <div className="relative">
                                            <input
                                                type="search"
                                                value={searchTermVoucher}
                                                onChange={(e) => {
                                                    setSearchTermVoucher(e.target.value);
                                                    setCurrentPageVoucher(1);
                                                }}
                                                placeholder={translations["Search"]}
                                                className="pl-10 pr-4 py-2 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-sm"
                                                style={{ backgroundColor: "#2d2d30", borderColor: "#555555" }}
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="max-h-[calc(100vh-500px)] overflow-y-auto">
                                    <table className="w-full">
                                        <thead className="sticky top-0 z-[1]" style={{ backgroundColor: "#1f2132" }}>
                                            <tr className="border-b" style={{ borderColor: "#2d2d30" }}>
                                                <th className="text-left py-2 px-4 text-gray-400 text-sm"></th>
                                                <th className="text-left py-2 px-4 text-gray-400 text-sm">{translations["Voucher No"]}</th>
                                                <th className="text-left py-2 px-4 text-gray-400 text-sm">{translations["Voucher Date"]}</th>
                                                <th className="text-left py-2 px-4 text-gray-400 text-sm">{translations["Expiry Date"]}</th>
                                                <th className="text-left py-2 px-4 text-gray-400 text-sm">{translations["Customer"]}</th>
                                                <th className="text-center py-2 px-4 text-gray-400 text-sm">{translations["Value"]}</th>
                                                <th className="text-left py-2 px-4 text-gray-400 text-sm">{translations["Status"]}</th>
                                                <th className="text-left py-2 px-4 text-gray-400 text-sm">{translations["Order No"]}</th>
                                                <th className="text-center py-2 px-4 text-gray-400 text-sm">{translations["Action"]}</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredVoucher.map((product, index) => (
                                                <tr
                                                    key={product.id || index}
                                                    className={`clickable border-b hover:bg-gray-700 hover:bg-opacity-30 transition-colors cursor-pointer ${
                                                        selectedVoucher.includes(product.id as number) ? "bg-gray-700 bg-opacity-30" : ""
                                                    }`}
                                                    style={{ borderColor: "#40404042" }}
                                                >
                                                    <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                                                        <CustomCheckbox
                                                            checked={selectedVoucher.includes(product.id as number)}
                                                            onChange={(checked) => handleSelectVoucher(product.id as number, checked)}
                                                        />
                                                    </td>
                                                    <td className="py-3 px-4 text-gray-400 text-left text-custom-sm">{product.voucher_no}</td>
                                                    <td className="py-3 px-4 text-gray-400 text-left text-custom-sm">{formatDate(product.voucher_date, lang)}</td>
                                                    <td className="py-3 px-4 text-gray-400 text-left text-custom-sm">{formatDate(product.expiry_date, lang)}</td>
                                                    <td className="py-3 px-4">
                                                        <div className="flex items-center space-x-3">
                                                            <div>
                                                                <div className="group flex items-center">
                                                                    <p className="text-gray-300 text-custom-sm select-text">{highlightMatch(product.customer_code, searchTermVoucher)}</p>
                                                                    <CopyToClipboard text={product.customer_code} />
                                                                </div>
                                                                <div className="group flex items-center">
                                                                    <p className="text-gray-400 text-custom-sm">
                                                                        {highlightMatch(lang === "en" ? product.account_name_en : product.account_name_cn, searchTerm)}
                                                                    </p>
                                                                    <CopyToClipboard text={lang === "en" ? product.account_name_en : product.account_name_cn} />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="py-3 px-4 text-gray-400 text-center text-custom-sm">
                                                        {product.currency}
                                                        <br />
                                                        {formatMoney(product.value)}
                                                    </td>
                                                    <td className="py-3 px-4 text-gray-400 text-left text-custom-sm">{translations[product.status_name]}</td>
                                                    <td className="py-3 px-4 text-gray-400 text-left text-custom-sm">{product.order_id || translations["N.A."]}</td>
                                                    <td className="py-3 px-4 text-gray-400 text-center text-custom-sm">
                                                        <button
                                                            onClick={() => {
                                                                handleGetVoucherInfo(product.id);
                                                            }}
                                                            className="px-1 py-1 bg-cyan-600 hover:bg-cyan-500 rounded text-white transition"
                                                        >
                                                            {translations["Edit"]}
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                <div className="p-4 border-t flex items-center justify-between" style={{ borderColor: "#404040" }}>
                                    <div className="flex items-center space-x-4">
                                        <MemoizedPagination currentPage={currentPageVoucher} totalPages={totalPagesVoucher} onPageChange={(page) => setCurrentPageVoucher(page)} />
                                        <MemoizedItemsPerPageSelector
                                            value={itemsPerPageVoucher}
                                            onChange={(val: number) => {
                                                setItemsPerPageVoucher(val);
                                                setCurrentPageVoucher(1);
                                            }}
                                            options={pageSizeOptions}
                                        />
                                    </div>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="grid grid-cols-12 gap-4">
                                    {/* Left Column */}
                                    <div className="col-span-12 md:col-span-6">
                                        <div className="flex items-center gap-4 mb-2">
                                            <label className="w-32 text-gray-400 text-sm">{translations["Customer Code"]}</label>
                                            <div className="flex flex-1">
                                                <input
                                                    type="text"
                                                    value={formDataVoucher.customer_code}
                                                    onChange={(e) => {
                                                        const value = e.target.value;
                                                        setFormDataVoucher((prev) => ({ ...prev, customer_code: value }));
                                                    }}
                                                    onKeyDown={(e) => {
                                                        if (e.key === "Enter") {
                                                            handleRowEnter_Customer(formDataVoucher.customer_code);
                                                        }
                                                    }}
                                                    className="flex-1 px-3 py-2 border border-[#ffffff1a] border-r-0 bg-transparent text-[#ffffffcc] text-custom-sm rounded-tl-md rounded-bl-md !rounded-tr-none !rounded-br-none"
                                                    placeholder={translations["Customer Code"]}
                                                />
                                                <input
                                                    type="hidden"
                                                    value={formDataVoucher.voucher_id}
                                                    onChange={(e) => {
                                                        setFormDataVoucher((prev) => ({ ...prev, voucher_id: Number(e.target.value) }));
                                                    }}
                                                />
                                                <input
                                                    type="hidden"
                                                    value={formDataVoucher.customer_id}
                                                    onChange={(e) => {
                                                        setFormDataVoucher((prev) => ({ ...prev, customer_id: Number(e.target.value) }));
                                                    }}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setShowCustomers(true);
                                                    }}
                                                    className="px-2 py-2 bg-cyan-600 text-white !rounded-tr-md !rounded-br-md !rounded-tl-none !rounded-bl-none hover:bg-cyan-700 flex items-center justify-center border border-[#ffffff1a] border-l-0"
                                                >
                                                    <Search className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4 mb-2">
                                            <label className="w-32 text-gray-400 text-sm">{translations["Customer Name"]}</label>
                                            <div className="flex flex-1">
                                                <input
                                                    type="text"
                                                    value={formDataVoucher.customer_name}
                                                    onChange={(e) => {
                                                        const value = e.target.value;
                                                        setFormDataVoucher((prev) => ({ ...prev, customer_name: value }));
                                                    }}
                                                    readOnly
                                                    className="flex-1 px-3 py-2 border border-[#ffffff1a] border-r-0 bg-transparent text-[#ffffffcc] text-custom-sm rounded-tl-md rounded-bl-md"
                                                />
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4 mb-2">
                                            <label className="w-32 text-gray-400 text-sm">{translations["Value"]}</label>
                                            <div className="flex flex-1 gap-2">
                                                <input
                                                    type="text"
                                                    value={formDataVoucher.currency}
                                                    onChange={(e) => {
                                                        const value = e.target.value;
                                                        setFormDataVoucher((prev) => ({ ...prev, currency: value }));
                                                    }}
                                                    readOnly
                                                    className="w-20 px-3 py-2 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm"
                                                />
                                                <input
                                                    type="number"
                                                    value={formDataVoucher.value}
                                                    onChange={(e) => {
                                                        const value = Number(e.target.value);
                                                        setFormDataVoucher((prev) => ({ ...prev, value: value }));
                                                    }}
                                                    className="flex-1 px-3 py-2 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    {/* Right Column */}
                                    <div className="col-span-12 md:col-span-6">
                                        <div className="flex items-center gap-4 mb-2">
                                            <label className="w-32 text-gray-400 text-sm">{translations["Voucher No"]}</label>
                                            <input
                                                type="text"
                                                value={formDataVoucher.voucher_no}
                                                onChange={(e) => {
                                                    const value = e.target.value;
                                                    setFormDataVoucher((prev) => ({ ...prev, voucher_no: value }));
                                                }}
                                                readOnly
                                                className="flex-1 px-3 py-2 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm"
                                            />
                                        </div>
                                        <div className="flex items-center gap-4 mb-2">
                                            <label className="w-32 text-gray-400 text-sm">{translations["Voucher Date"]}</label>
                                            <input
                                                type="text"
                                                value={formatDate(formDataVoucher.voucher_date, lang)}
                                                onChange={(e) => {
                                                    const value = e.target.value;
                                                    setFormDataVoucher((prev) => ({ ...prev, voucher_date: value }));
                                                }}
                                                readOnly
                                                className="flex-1 px-3 py-2 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm"
                                            />
                                        </div>
                                        <div className="flex items-center gap-4 mb-2">
                                            <label className="w-32 text-gray-400 text-sm">{translations["Expiry Date"]}</label>
                                            <Flatpickr
                                                onChange={handleDateExpiry}
                                                options={{
                                                    dateFormat: "M d Y",
                                                    defaultDate: formDataVoucher.expiry_date || undefined,
                                                    allowInput: false,
                                                    locale: locale,
                                                }}
                                                className="flex-1 px-3 py-2 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                    {/* Footer */}
                    <div className="p-2 border-t border-[#ffffff1a] flex justify-end space-x-1">
                        <button onClick={() => setShowVoucher(false)} className="px-2 py-2 bg-gray-700 hover:bg-gray-600 rounded text-white transition">
                            {translations["Close"]}
                        </button>
                        {showVoucherInfo ? (
                            <>
                                <button onClick={() => handleDeleteVoucher("list")} className="px-2 py-2 bg-cyan-600 hover:bg-cyan-500 rounded text-white transition">
                                    {translations["Delete"]}
                                </button>
                                <button
                                    onClick={() => {
                                        setShowVoucherInfo(false);
                                        setFormDataVoucher(initialVoucherForm);
                                    }}
                                    className="px-2 py-2 bg-cyan-600 hover:bg-cyan-500 rounded text-white transition"
                                >
                                    {translations["Add New"]}
                                </button>
                            </>
                        ) : (
                            <>
                                <button
                                    disabled={formDataVoucher.voucher_id === 0}
                                    onClick={() => handleDeleteVoucher("info")}
                                    className="px-2 py-2 bg-cyan-600 hover:bg-cyan-500 rounded text-white transition"
                                >
                                    {translations["Delete"]}
                                </button>
                                <button onClick={handleClearVoucherInfo} className="px-2 py-2 bg-cyan-600 hover:bg-cyan-500 rounded text-white transition">
                                    {translations["Add New"]}
                                </button>
                                <button onClick={() => setShowVoucherInfo(true)} className="px-2 py-2 bg-cyan-600 hover:bg-cyan-500 rounded text-white transition">
                                    {translations["Back To List"]}
                                </button>
                                <button
                                    onClick={() => handleSaveVoucher()}
                                    disabled={loadingSaveVoucher}
                                    className={`px-2 py-2 bg-cyan-600 hover:bg-cyan-500 rounded text-white transition
                                    ${loadingSaveVoucher ? "bg-gray-500 cursor-not-allowed opacity-50" : "bg-cyan-600 hover:bg-cyan-700"}`}
                                >
                                    {loadingSaveVoucher ? (
                                        <>
                                            <div className="loader mr-2"></div>
                                        </>
                                    ) : (
                                        <span>{translations["Save"]}</span>
                                    )}
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        );
    };
    const renderCustomerList = () => {
        if (!showCustomers) return null;
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-[#19191c] rounded-xl border border-[#ffffff1a] w-[60vw] h-auto flex flex-col">
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-[#ffffff1a]">
                        <div className="flex items-center space-x-4">
                            <h2 className="text-xl font-bold text-white">{translations["Search Customer List"]}</h2>
                        </div>
                        <div className="flex items-center space-x-4">
                            <button
                                onClick={() => {
                                    setShowCustomers(false);
                                }}
                                className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                            >
                                <X className="h-6 w-6 text-white" />
                            </button>
                        </div>
                    </div>
                    {/* Content */}
                    <div className="p-2 border-b flex-shrink-0" style={{ borderColor: "#404040" }}>
                        <div className="flex justify-between items-center">
                            <div className="flex items-center space-x-4">
                                <div className="relative">
                                    <input
                                        type="search"
                                        placeholder={translations["Search"]}
                                        value={searchTermCustomer}
                                        onChange={(e) => {
                                            setSearchTermCustomer(e.target.value);
                                            setCurrentPageCustomer(1);
                                        }}
                                        className="pl-10 pr-4 py-2 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-sm"
                                        style={{ backgroundColor: "#2d2d30", borderColor: "#555555" }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="p-2 flex-1 overflow-auto">
                        <div className="h-[calc(100vh-435px)] overflow-y-auto">
                            <table className="w-full">
                                <thead className="sticky top-0 z-[1]" style={{ backgroundColor: "#1f2132" }}>
                                    <tr className="border-b" style={{ borderColor: "#2d2d30" }}>
                                        <th className=" text-left py-2 px-4 text-gray-400 text-sm">{translations["Customer Code"]}</th>
                                        <th className=" text-left py-2 px-4 text-gray-400 text-sm">{translations["Customer Name"]}</th>
                                        <th className=" text-left py-2 px-4 text-gray-400 text-sm">{translations["Company"]}</th>
                                        <th className=" text-left py-2 px-4 text-gray-400 text-sm">{translations["Email"]}</th>
                                    </tr>
                                </thead>
                                {loading ? (
                                    <LoadingSpinnerTbody rowsCount={itemsPerPageCustomer} />
                                ) : (
                                    <tbody>
                                        {filteredCustomers.map((customer, index) => (
                                            <tr
                                                key={customer.id || index}
                                                onClick={(e) => handleRowClick_Customer(e, customer.id)}
                                                className={`clickable border-b hover:bg-gray-700 hover:bg-opacity-30 transition-colors cursor-pointer`}
                                                style={{ borderColor: "#40404042" }}
                                            >
                                                <td className="py-3 px-4 text-gray-400 text-left text-custom-sm">{customer.customer_code}</td>
                                                <td className="py-3 px-4 text-gray-400 text-left text-custom-sm">{customer.account_name_en}</td>
                                                <td className="py-3 px-4 text-gray-400 text-left text-custom-sm">{customer.company_en || translations["N.A."]}</td>
                                                <td className="py-3 px-4 text-gray-400 text-left text-custom-sm">{customer.email_address || translations["N.A."]}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                )}
                            </table>
                        </div>
                    </div>
                    {/* Footer with Pagination */}
                    <div className="p-4 border-t flex items-center justify-between" style={{ borderColor: "#404040" }}>
                        <div className="flex items-center space-x-1">
                            <MemoizedPagination currentPage={currentPageCustomer} totalPages={totalPagesCustomer} onPageChange={(page) => setCurrentPageCustomer(page)} />
                            <MemoizedItemsPerPageSelector
                                value={itemsPerPageCustomer}
                                onChange={(val: number) => {
                                    setItemsPerPageCustomer(val);
                                    setCurrentPageCustomer(1);
                                }}
                                options={pageSizeOptions}
                            />
                        </div>
                        <div className="flex items-center space-x-1">
                            <button onClick={() => setShowCustomers(false)} className="px-2 py-2 bg-gray-700 hover:bg-gray-600 rounded text-white transition">
                                {translations["Close"]}
                            </button>
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
                            <button
                                className="ml-2 px-2 py-2 border rounded-lg text-white transition-colors flex items-center space-x-px hover:bg-cyan-600 text-sm"
                                style={{ backgroundColor: "#0891b2", borderColor: "#2d2d30", marginLeft: "5px" }}
                            >
                                <span>{translations["Orders"]}</span>
                            </button>
                            <button
                                onClick={() => onChangeView("unsold")}
                                className="ml-2 px-2 py-2 border rounded-lg text-white transition-colors flex items-center space-x-px hover:bg-gray-600 text-sm"
                                style={{ backgroundColor: "#2d2d30", borderColor: "#2d2d30", marginLeft: "5px" }}
                            >
                                <span>{translations["Unsold Orders"]}</span>
                            </button>
                            <button
                                onClick={() => onChangeView("performance")}
                                className="ml-2 px-2 py-2 border rounded-lg text-white transition-colors flex items-center space-x-px hover:bg-gray-600 text-sm"
                                style={{ backgroundColor: "#2d2d30", borderColor: "#2d2d30", marginLeft: "5px" }}
                            >
                                <span>{translations["SalesPerformance"]}</span>
                            </button>
                            <button
                                onClick={() => {
                                    setShowVoucher(true);
                                    setShowVoucherInfo(true);
                                    fetchVoucherList();
                                }}
                                className="ml-2 px-2 py-2 border rounded-lg text-white transition-colors flex items-center space-x-px hover:bg-gray-600 text-sm"
                                style={{ backgroundColor: "#2d2d30", borderColor: "#2d2d30", marginLeft: "5px" }}
                            >
                                <span>{translations["Voucher"]}</span>
                            </button>
                            <button
                                onClick={() => setShowPreorderClosing(true)}
                                className="ml-2 px-2 py-2 border rounded-lg text-white transition-colors flex items-center space-x-px text-sm"
                                style={{ backgroundColor: "#2d2d30", borderColor: "#2d2d30", marginLeft: "5px" }}
                            >
                                <span>{translations["PreorderCloseStatus"]}</span>
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
                                {/* Dropdown Menu */}
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
                                    onClick={() => handleCreateSalesOrder()}
                                    className={`px-2 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors flex items-center space-x-1 text-sm
                                    ${loadCancelOrder_NRTOMI ? "bg-gray-500 cursor-not-allowed opacity-50" : "bg-cyan-600 hover:bg-cyan-700"} 
                                    text-[#ffffffcc] flex justify-center items-center`}
                                    disabled={loadCreateSO || selectedPreorder.length === 0}
                                >
                                    {loadCreateSO ? (
                                        <>
                                            <div className="loader mr-2"></div>
                                            <span>{translations["Processing2"]}...</span>
                                        </>
                                    ) : (
                                        <span>{translations["SalesOrder2"]}</span>
                                    )}
                                </button>
                                <button
                                    disabled={selectedPreorder.length === 0}
                                    onClick={handleConfirmOrder}
                                    className="px-2 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors flex items-center space-x-1 text-sm"
                                >
                                    <span>{confirmButton ? translations["View"] : translations["Confirm Order"]}</span>
                                </button>
                                <button
                                    disabled={selectedPreorder.length === 0}
                                    onClick={handleCancelOrder}
                                    className="px-2 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors flex items-center space-x-1 text-sm"
                                >
                                    <span>{translations["Cancel Order"]}</span>
                                </button>
                                <button
                                    onClick={handlePrint}
                                    disabled={selectedPreorder.length === 0}
                                    className="px-2 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors flex items-center space-x-1 text-sm"
                                >
                                    <span>{translations["Print"]}</span>
                                </button>
                                <button
                                    onClick={(e) => handleRowClick(e, 0)}
                                    className="px-2 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors flex items-center space-x-1 text-sm"
                                >
                                    <span>{translations["Add New"]}</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                {/* Table */}
                <div className="overflow-x-auto flex-grow">
                    <div className="flex flex-col h-[calc(100vh-180px)]">
                        <table className="w-full">
                            <thead className="sticky top-0 z-[2]" style={{ backgroundColor: "#1f2132" }}>
                                <tr className="border-b" style={{ borderColor: "#2d2d30" }}>
                                    <th className="w-[2%] w-12 py-1 px-2 text-sm text-gray-400">
                                        <div className="flex items-center justify-center">
                                            <CustomCheckbox checked={selectedPreorder.length === products.length && products.length > 0} onChange={(checked) => handleSelectAll(checked)} />
                                        </div>
                                    </th>
                                    <th className="w-[6%] text-left py-2 px-2 text-gray-400 text-sm">{translations["Order Date"]}</th>
                                    <th className="w-[11%] text-left py-2 px-2 text-gray-400 text-sm">{translations["Customer"]}</th>
                                    <th className="w-[8%] text-left py-2 px-2 text-gray-400 text-sm">{translations["Source"]}</th>
                                    <th className="w-[7%] text-left py-2 px-2 text-gray-400 text-sm">{translations["Sales Person"]}</th>
                                    <th className="w-[15%] text-left py-2 px-2 text-gray-400 text-sm">{translations["Ordered Product"]}</th>
                                    <th className="w-[6%] text-center py-2 px-2 text-gray-400 text-sm">{translations["Price"]}</th>
                                    <th className="w-[4%] text-center py-2 px-2 text-gray-400 text-sm">{translations["Qty"]}</th>
                                    <th className="w-[7%] text-center py-2 px-2 text-gray-400 text-sm">{translations["Total"]}</th>
                                    <th className="w-[7%] text-center py-2 px-2 text-gray-400 text-sm">{translations["Base Total"]}</th>
                                    <th className="w-[7%] text-center py-2 px-2 text-gray-400 text-sm">{translations["Total Cost"]}</th>
                                    <th className="w-[7%] text-center py-2 px-2 text-gray-400 text-sm">{translations["Total Profit"]}</th>
                                    <th className="w-[7%] text-center py-2 px-2 text-gray-400 text-sm">{translations["Deposit"]}</th>
                                    <th className="w-[8%] text-center py-2 px-2 text-gray-400 text-sm">{translations["Status"]}</th>
                                </tr>
                            </thead>
                        </table>
                        <div className="flex-grow overflow-y-auto">
                            <table className="w-full">
                                {loading ? (
                                    <LoadingSpinnerTbody rowsCount={itemsPerPage} />
                                ) : (
                                    <tbody>
                                        {products.length === 0 ? (
                                            <tr>
                                                <td colSpan={14} className="py-4 px-4 text-center text-gray-400 text-sm border border-[#40404042]">
                                                    {translations["No Record Found"] || "No Record Found"}
                                                </td>
                                            </tr>
                                        ) : (
                                            products.map((product, index) => (
                                                <tr
                                                    key={product.id || index}
                                                    onClick={(e) => handleRowClick(e, product.id)}
                                                    className={`clickable border-b hover:bg-gray-700 hover:bg-opacity-30 transition-colors cursor-pointer ${
                                                        selectedPreorder.includes(product.id as number) ? "bg-gray-700 bg-opacity-30" : ""
                                                    }`}
                                                    style={{ borderColor: "#40404042" }}
                                                >
                                                    <td className="w-[2%] py-2 px-2" onClick={(e) => e.stopPropagation()}>
                                                        <div className="flex items-center justify-center">
                                                            <CustomCheckbox
                                                                checked={selectedPreorder.includes(product.id as number)}
                                                                onChange={(checked) => handleSelectPreorder(product.id as number, checked)}
                                                                ariaLabel={`Select ${product.order_id}`}
                                                            />
                                                        </div>
                                                    </td>
                                                    <td className="w-[6%] py-2 px-2 text-gray-400 text-left text-custom-sm">{formatDate(product.order_date, lang)}</td>
                                                    <td className="w-[11%] py-2 px-2">
                                                        <div className="flex items-center space-x-3">
                                                            <div>
                                                                <div className="group flex items-center">
                                                                    <p className="text-gray-300 text-custom-sm select-text">{highlightMatch(product.customer_code, searchTerm)}</p>
                                                                    <CopyToClipboard text={product.customer_code} />
                                                                </div>
                                                                <div className="group flex items-center">
                                                                    <p className="text-gray-400 text-custom-sm">
                                                                        {highlightMatch(lang === "en" ? product.account_name_en : product.account_name_cn, searchTerm)}
                                                                    </p>
                                                                    <CopyToClipboard text={lang === "en" ? product.account_name_en : product.account_name_cn} />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="w-[8%] py-2 px-2 text-gray-400 text-left text-custom-sm">
                                                        {product.customer_type === "RC" ? (lang === "en" ? product.source_en : product.source_cn) : translations["Wholesale"]}
                                                    </td>
                                                    <td className="w-[7%] py-2 px-2 text-gray-400 text-left text-custom-sm">{product.sales_person_name}</td>
                                                    <td className="w-[15%] py-2 px-2">
                                                        <div className="flex items-center space-x-3">
                                                            <div>
                                                                <div className="group flex items-center">
                                                                    <p className="text-gray-400 text-custom-sm">{highlightMatch(product.product_code, searchTerm)}</p>
                                                                    <CopyToClipboard text={product.product_code} />
                                                                </div>
                                                                <div className="group flex items-center">
                                                                    <p className="text-gray-400 text-custom-sm">
                                                                        {highlightMatch(lang === "en" ? product.product_title_en : product.product_title_cn, searchTerm)}
                                                                    </p>
                                                                    <CopyToClipboard text={lang === "en" ? product.product_title_en : product.product_title_cn} />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="w-[6%] py-2 px-2 text-gray-400 text-center text-custom-sm">
                                                        {product.currency}
                                                        <br />
                                                        {formatMoney(product.price)}
                                                    </td>
                                                    <td className="w-[4%] py-2 px-2 text-gray-400 text-center text-custom-sm">{product.qty}</td>
                                                    <td className="w-[7%] py-2 px-2 text-gray-400 text-center text-custom-sm">
                                                        {product.currency}
                                                        <br />
                                                        {formatMoney(product.total)}
                                                    </td>
                                                    <td className="w-[7%] py-2 px-2 text-gray-400 text-center text-custom-sm">
                                                        {product.e_total_sales_currency}
                                                        <br />
                                                        {formatMoney(product.e_total_sales)}
                                                    </td>
                                                    <td className="w-[7%] py-2 px-2 text-gray-400 text-center text-custom-sm">
                                                        {product.e_cost_total_currency}
                                                        <br />
                                                        {formatMoney(product.e_cost_total)}
                                                    </td>
                                                    <td className="w-[7%] py-2 px-2 text-gray-400 text-center text-custom-sm">
                                                        {product.e_profit_currency}
                                                        <br />
                                                        {formatMoney(product.e_profit)}
                                                    </td>
                                                    <td className="w-[7%] py-2 px-2 text-gray-400 text-center text-custom-sm">
                                                        {baseCurrency()}
                                                        <br />
                                                        {formatMoney(product.deposit)}
                                                    </td>
                                                    <td className="w-[8%] py-2 px-2 text-center">
                                                        <span className={`px-2 py-1 rounded-full text-xs text-custom-sm ${getStatusColor(product.order_status)}`}>
                                                            {preorderStatusLocalized(product.order_status, safeLang)}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                )}
                            </table>
                        </div>
                        <table className="w-full sticky bottom-0 z-[1]" style={{ backgroundColor: "#1f2132" }}>
                            <tfoot>
                                {preorderFooter && (
                                    <tr className="border-b hover:bg-gray-700 hover:bg-opacity-30 transition-colors" style={{ borderColor: "#40404042" }}>
                                        <td className="w-[2%] py-1 px-1 text-gray-400 text-right text-custom-sm"></td>
                                        <td className="w-[6%] py-1 px-1 text-gray-400 text-right text-custom-sm"></td>
                                        <td className="w-[11%] py-1 px-1 text-gray-400 text-center text-custom-sm"></td>
                                        <td className="w-[8%] py-1 px-1 text-gray-400 text-center text-custom-sm"></td>
                                        <td className="w-[7%] py-1 px-1 text-gray-400 text-center text-custom-sm"></td>
                                        <td className="w-[15%] py-1 px-1 text-gray-400 text-right text-custom-sm">{translations["Page Order Total"]}</td>
                                        <td className="w-[6%] py-1 px-1 text-gray-400 text-center text-custom-sm"> : </td>
                                        <td className="w-[4%] py-1 px-1 text-gray-400 text-center text-custom-sm">{preorderFooter.qty}</td>
                                        <td className="w-[7%] py-1 px-1 text-gray-400 text-center text-custom-sm">{formatMoney(preorderFooter.total)}</td>
                                        <td className="w-[7%] py-1 px-1 text-gray-400 text-center text-custom-sm">{formatMoney(preorderFooter.base_total)}</td>
                                        <td className="w-[7%] py-1 px-1 text-gray-400 text-center text-custom-sm">{formatMoney(preorderFooter.e_cost_total)}</td>
                                        <td className="w-[7%] py-1 px-1 text-gray-400 text-center text-custom-sm">{formatMoney(preorderFooter.e_profit)}</td>
                                        <td className="w-[7%] py-1 px-1 text-gray-400 text-center text-custom-sm">{formatMoney(preorderFooter.base_deposit)}</td>
                                        <td className="w-[8%] py-1 px-1 text-gray-400 text-center text-custom-sm"></td>
                                    </tr>
                                )}
                                {preorderFooter2 && (
                                    <tr className="border-b hover:bg-gray-700 hover:bg-opacity-30 transition-colors" style={{ borderColor: "#40404042" }}>
                                        <td className="w-[2%] py-1 px-1 text-gray-400 text-right text-custom-sm"></td>
                                        <td className="w-[6%] py-1 px-1 text-gray-400 text-right text-custom-sm"></td>
                                        <td className="w-[11%] py-1 px-1 text-gray-400 text-center text-custom-sm"></td>
                                        <td className="w-[8%] py-1 px-1 text-gray-400 text-center text-custom-sm"></td>
                                        <td className="w-[7%] py-1 px-1 text-gray-400 text-center text-custom-sm"></td>
                                        <td className="w-[15%] py-1 px-1 text-gray-400 text-right text-custom-sm">{translations["All Order Total"]}</td>
                                        <td className="w-[6%] py-1 px-1 text-gray-400 text-center text-custom-sm"> : </td>
                                        <td className="w-[4%] py-1 px-1 text-gray-400 text-center text-custom-sm">{preorderFooter2.qty}</td>
                                        <td className="w-[7%] py-1 px-1 text-gray-400 text-center text-custom-sm">{formatMoney(preorderFooter2.total)}</td>
                                        <td className="w-[7%] py-1 px-1 text-gray-400 text-center text-custom-sm">{formatMoney(preorderFooter2.base_total)}</td>
                                        <td className="w-[7%] py-1 px-1 text-gray-400 text-center text-custom-sm">{formatMoney(preorderFooter2.e_cost_total)}</td>
                                        <td className="w-[7%] py-1 px-1 text-gray-400 text-center text-custom-sm">{formatMoney(preorderFooter2.e_profit)}</td>
                                        <td className="w-[7%] py-1 px-1 text-gray-400 text-center text-custom-sm">{formatMoney(preorderFooter2.base_deposit)}</td>
                                        <td className="w-[8%] py-1 px-1 text-gray-400 text-center text-custom-sm"></td>
                                    </tr>
                                )}
                            </tfoot>
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
                            baseName="OrdersList_Report"
                            ids={selectedPreorder.length > 0 ? selectedPreorder : products.map((p) => p.id)}
                            language={altLang}
                        />
                        <div className="hidden">
                            <ExportReportSelector ref={exportRef} formats={["odt"]} baseName="DepositInvoice" ids={selectedPreorder} language={altLang} />
                        </div>
                    </div>
                    <div className="flex items-center space-x-1">{/* Optional right side content */}</div>
                </div>
                {renderConfirmOrder()}
                {renderCreditsPopup()}
                {renderCancelOrder()}
                {renderAdvanceSearch()}
                {renderDateRange()}
                {renderPreorderClosing()}
                {renderVoucher()}
                {renderCustomerList()}
            </div>
        </div>
    );
};

export default PreorderList;
