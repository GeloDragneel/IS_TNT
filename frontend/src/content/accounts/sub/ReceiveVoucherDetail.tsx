import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { showConfirm, showConfirm2 } from "@/utils/alert";
import { showSuccessToast, showErrorToast } from "@/utils/toast";
import Select from "react-select";
import { getFlatpickrLocale, formatDateToCustom } from "@/utils/flatpickrLocale";
import CustomCheckbox from "@/components/CustomCheckbox";
import { ArrowLeft, X, Plus, Search } from "lucide-react";
import Flatpickr from "react-flatpickr";
import "flatpickr/dist/themes/dark.css";
import { receiveVoucherService, ApiReceiveVoucher, DetailsRow } from "@/services/receiveVoucherService";
import { invoiceService } from "@/services/customerInvoiceService";
import { customerService, ApiCustomer } from "@/services/customerService";
import Pagination from "@/components/Pagination";
import ItemsPerPageSelector from "@/components/ItemsPerPageSelector";
import { ApiProduct } from "@/services/productService";
import { ExportReportSelector } from "@/utils/ExportReportSelector";
import { fetchInvoiceStatus, fetchBank, convertToSingleOption, OptionType } from "@/utils/fetchDropdownData";
import { selectStyles, baseCurrency, parseDate, DropdownData } from "@/utils/globalFunction";
import { highlightMatch } from "@/utils/highlightMatch";
import CopyToClipboard from "@/components/CopyToClipboard";
// localStorage.clear();
const MemoizedPagination = React.memo(Pagination);
const MemoizedItemsPerPageSelector = React.memo(ItemsPerPageSelector);
interface ReceiveVoucherDetailsProps {
    receiveVoucherId: number;
    saveType: string;
    onBack: () => void;
    onSave: () => void;
    tabId: string;
    onChangeReceiveVoucherId: (newId: number) => void;
    onChangeSaveType: (type: string) => void;
}
const defaultDetails: ApiReceiveVoucher = {
    id: 0,
    rv_number: "",
    rv_date: "",
    customer_code: "",
    customer_id: 0,
    account_name_en: "",
    account_name_cn: "",
    status_value_en: "",
    status_value_cn: "",
    billing_address_en: "",
    billing_address_cn: "",
    bank_name_en: "",
    bank_name_cn: "",
    charts_en: "",
    charts_cn: "",
    currency: "",
    rv_status_id: 1,
    ex_rate: 0,
    total: 0,
    amount_paid: 0,
    base_amount_paid: 0,
    base_total: 0,
    bank_charges: 0,
    base_bank_charges: 0,
    excess_amount: 0,
    base_excess_amount: 0,
    invoice_deposit: 0,
    credit_used: 0,
    total_unpaid: 0,
    base_total_unpaid: 0,
    count: 0,
    trans_detail_en: "",
    trans_detail_cn: "",
    operator: "",
    details: [],
};
const ReceiveVoucherDetails: React.FC<ReceiveVoucherDetailsProps> = ({ receiveVoucherId, tabId, saveType, onBack, onSave, onChangeReceiveVoucherId, onChangeSaveType }) => {
    const { translations, lang } = useLanguage();
    const [masterList, setTransDetails] = useState<ApiReceiveVoucher | null>(null);
    const [selectedForCredits, setSelectedCredits] = useState<ApiReceiveVoucher[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState("information");
    const [customers, setCustomers] = useState<ApiCustomer[]>([]);
    const [isDirty, setIsDirty] = useState(false);
    const [showUnsavedChanges, setShowUnsavedChanges] = useState(false);
    const [chartsOfAccount, setChartsOfAccounts] = useState<ApiProduct[]>([]);
    const [isInitialized, setIsInitialized] = useState(false);
    const initialFormData = React.useRef<any>(null);
    const locale = getFlatpickrLocale(translations);
    const [loadingSave, setLoadingSave] = useState(false);
    const [invoiceStatusData, setInvoiceStatus] = useState<DropdownData[]>([]);
    const [banksData, setBanksData] = useState<DropdownData[]>([]);
    const [detailList, setDetailList] = useState<DetailsRow[]>([]);
    const [globalIndex, setGlobalIndex] = useState(0);
    const [showAccounts, setShowAccounts] = useState(false);
    const [totalPagesAccounts, setTotalPages_Accounts] = useState(1);
    const pageSizeOptions = useMemo(() => [10, 20, 50, -1], []);
    const [showCustomers, setShowCustomers] = useState(false);
    const [totalPagesCustomer, setTotalPages_Customer] = useState(1);
    const [selectedDetails, selectedPurchaseOrder] = useState<number[]>([]);
    const [colInvoiceNo, setColInvoiceNo] = useState(false);
    const [colParticulars, setColParticulars] = useState(false);
    const [colProductName, setColProductName] = useState(false);
    const [globCode, setGlobCode] = useState("");
    const [globButtonType, setGlobButtonType] = useState("RV");
    const [creditsPopup, setShowCreditsPopup] = useState(false);
    const exportRef = useRef<{ triggerExport: () => void }>(null);
    const [searchTermAccounts, setSearchTermAccounts] = useState(() => {
        const cached = localStorage.getItem(`cached-rv-accounts`);
        if (!cached) return "";
        try {
            const meta = JSON.parse(cached);
            return meta.search || "";
        } catch {
            return "";
        }
    });
    const [currentPageAccounts, setCurrentPageAccounts] = useState(() => {
        const metaKey = `cached-rv-accounts`;
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
    const [itemsPerPageAccounts, setItemsPerPageAccounts] = useState(() => {
        const metaKey = `cached-rv-accounts`;
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
    const [searchTermCustomer, setSearchTermCustomer] = useState(() => {
        const cached = localStorage.getItem(`${tabId}-cached-rv-customer`);
        if (!cached) return "";
        try {
            const meta = JSON.parse(cached);
            return meta.search || "";
        } catch {
            return "";
        }
    });
    const [currentPageCustomer, setCurrentPageCustomer] = useState(() => {
        const metaKey = `${tabId}-cached-rv-customer`;
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
    const [itemsPerPageSupplier, setItemsPerPageCustomer] = useState(() => {
        const metaKey = `${tabId}-cached-rv-customer`;
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
    const invoiceStatusOptions: OptionType[] = useMemo(
        () =>
            invoiceStatusData.map((list) => ({
                value: list.value.toString(),
                value2: list.value.toString(),
                label: lang === "en" ? list.en : list.cn,
                en: list.en,
                cn: list.cn,
            })),
        [invoiceStatusData, lang]
    );
    // Form state - Updated to handle single vs multi-select properly
    const [formData, setFormData] = useState({
        rv_number: "",
        rv_date: null as Date | null,
        customer_code: "",
        customer_id: 0,
        account_name_en: "",
        account_name_cn: "",
        billing_address_en: "",
        billing_address_cn: "",
        status_value_en: "",
        status_value_cn: "",
        trans_detail_en: "",
        trans_detail_cn: "",
        bank_name_en: "",
        bank_name_cn: "",
        charts_en: "",
        charts_cn: "",
        currency: "",
        rv_status_id: null as OptionType | null,
        bank: null as OptionType | null,
        ex_rate: 0,
        total: 0,
        amount_paid: 0,
        base_amount_paid: 0,
        base_total: 0,
        bank_charges: 0,
        base_bank_charges: 0,
        excess_amount: 0,
        base_excess_amount: 0,
        invoice_deposit: 0,
        credit_used: 0,
        total_unpaid: 0,
        base_total_unpaid: 0,
        count: 0,
        operator: "",
    });
    const clearForms = (Options: OptionType[]) => {
        const selectedOption = convertToSingleOption(1, Options);
        const initialFormData = {
            rv_number: "",
            rv_date: null as Date | null,
            customer_code: "",
            customer_id: 0,
            account_name_en: "",
            account_name_cn: "",
            status_value_en: "",
            status_value_cn: "",
            billing_address_en: "",
            billing_address_cn: "",
            trans_detail_en: "",
            trans_detail_cn: "",
            bank_name_en: "",
            bank_name_cn: "",
            charts_en: "",
            charts_cn: "",
            currency: "",
            rv_status_id: selectedOption,
            bank: null,
            ex_rate: 0,
            total: 0,
            amount_paid: 0,
            base_amount_paid: 0,
            base_total: 0,
            bank_charges: 0,
            base_bank_charges: 0,
            excess_amount: 0,
            base_excess_amount: 0,
            invoice_deposit: 0,
            credit_used: 0,
            total_unpaid: 0,
            base_total_unpaid: 0,
            count: 0,
            operator: "",
        };
        setFormData(initialFormData);
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
    useEffect(() => {
        const handleEsc = (event: any) => {
            if (event.key === "Escape") {
                if (showCustomers) {
                    setShowCustomers(false);
                }
                if (showAccounts) {
                    setShowAccounts(false);
                }
            }
        };
        window.addEventListener("keydown", handleEsc);
        // Cleanup on unmount
        return () => {
            window.removeEventListener("keydown", handleEsc);
        };
    }, [showCustomers, showAccounts]);

    useEffect(() => {
        fetchChartsOfAccounts(currentPageAccounts, itemsPerPageAccounts, searchTermAccounts);
    }, [currentPageAccounts, itemsPerPageAccounts, searchTermAccounts]);

    useEffect(() => {
        const calculateTotalsAndFetch = async () => {
            let total = 0;
            let amount_paid = 0;
            let base_total = 0;
            let base_amount_paid = 0;
            let base_excess_amount = 0;
            let base_bank_charges = 0;
            let base_total_unpaid = 0;

            const operator = formData.operator;

            detailList.forEach((element) => {
                if (element.is_deleted === 0) {
                    total += Number(element.amount) || 0;
                    amount_paid += Number(element.amount_paid) || 0;
                    base_total += Number(element.base_amount) || 0;
                }
            });
            let excess_amount = 0;
            let total_unpaid = total - amount_paid;
            if (amount_paid > total) {
                excess_amount = amount_paid - total;
            }

            if (baseCurrency() === formData.currency) {
                base_amount_paid = amount_paid;
                base_excess_amount = excess_amount;
                base_bank_charges = formData.excess_amount;
                base_total_unpaid = total_unpaid;
            } else {
                if (operator === "Divide") {
                    base_amount_paid = amount_paid / formData.ex_rate;
                    base_excess_amount = excess_amount / formData.ex_rate;
                    base_bank_charges = formData.excess_amount / formData.ex_rate;
                    base_total_unpaid = total_unpaid / formData.ex_rate;
                } else {
                    base_amount_paid = amount_paid * formData.ex_rate;
                    base_excess_amount = excess_amount * formData.ex_rate;
                    base_bank_charges = formData.excess_amount * formData.ex_rate;
                    base_total_unpaid = total_unpaid * formData.ex_rate;
                }
            }
            setFormData((prev) => ({
                ...prev,
                total: parseFloat(total.toFixed(2)),
                base_total: parseFloat(base_total.toFixed(2)),
                amount_paid: parseFloat(amount_paid.toFixed(2)),
                base_amount_paid: parseFloat(base_amount_paid.toFixed(2)),
                total_unpaid: parseFloat(total_unpaid.toFixed(2)),
                base_total_unpaid: parseFloat(base_total_unpaid.toFixed(2)),
                excess_amount: parseFloat(excess_amount.toFixed(2)),
                base_excess_amount: parseFloat(base_excess_amount.toFixed(2)),
                base_bank_charges: parseFloat(base_bank_charges.toFixed(2)),
            }));
        };
        calculateTotalsAndFetch();
    }, [detailList, formData.bank_charges]);

    useEffect(() => {
        const fetchAllMasterData = () => {
            fetchRVInfo();
        };
        const fetchDropdownData = () => {
            loadInvoiceStatus();
            loadBanks();
        };
        fetchDropdownData();
        if (saveType === "new") {
            setLoading(true);
            clearForms([]);
            setTransDetails(defaultDetails);
            setDetailList([]);
            setIsDirty(false);
            setIsInitialized(false);
            setLoading(false);
        } else if (saveType === "details") {
            setLoading(true);
            setDetailList([]);
            setIsDirty(false);
            setIsInitialized(false);
            setLoading(false);
        } else {
            fetchAllMasterData();
        }
    }, [receiveVoucherId, saveType]);

    useEffect(() => {
        if (!masterList) return;

        if (!isInitialized) {
            // A more robust check to see if the form is fully initialized
            const isFormReady = masterList.rv_status_id ? !!formData.rv_status_id : true;
            if (isFormReady) {
                const timer = setTimeout(() => {
                    // Deep copy to avoid reference issues
                    const currentForm = JSON.parse(JSON.stringify(formData));
                    initialFormData.current = currentForm;
                    setIsInitialized(true);
                    setIsDirty(false); // Explicitly set to false after initialization
                }, 200); // Increased timeout slightly for safety

                return () => clearTimeout(timer);
            }
        } else {
            // We are initialized, so let's check for changes.
            const formChanged = JSON.stringify(formData) !== JSON.stringify(initialFormData.current);
            if (formChanged) {
                // setIsDirty(true);
            } else {
                setIsDirty(false);
            }
        }
    }, [masterList, formData, isInitialized]);

    useEffect(() => {
        if (masterList && invoiceStatusOptions.length > 0) {
            const selectedOption = convertToSingleOption(masterList.rv_status_id, invoiceStatusOptions);
            setFormData((prev) => ({ ...prev, rv_status_id: selectedOption }));
        }
    }, [masterList, invoiceStatusOptions, lang]);

    useEffect(() => {
        if (masterList && banksOptions.length > 0) {
            const selectedOption = convertToSingleOption(masterList.bank, banksOptions);
            setFormData((prev) => ({ ...prev, bank: selectedOption }));
        }
    }, [masterList, banksOptions, lang]);

    // ON LOAD LIST
    useEffect(() => {
        const SupplierKey = `${tabId}-cached-customers`;
        const metaKey = `${tabId}-cached-meta-customers`;
        const mountKey = `${tabId}-mount-status-customers`;
        const isFirstMount = sessionStorage.getItem(mountKey) !== "mounted";
        if (isFirstMount) {
            sessionStorage.setItem(mountKey, "mounted");
            fetchCustomers(currentPageCustomer, itemsPerPageSupplier, searchTermCustomer);
            return;
        }
        const cachedSuppliersRaw = localStorage.getItem(SupplierKey);
        const cachedMetaRaw = localStorage.getItem(metaKey);

        if (!cachedSuppliersRaw || !cachedMetaRaw) {
            fetchCustomers(currentPageCustomer, itemsPerPageSupplier, searchTermCustomer);
            return;
        }

        try {
            const cachedMeta = JSON.parse(cachedMetaRaw);
            const cachedSuppliers = JSON.parse(cachedSuppliersRaw);

            const isCacheValid = cachedMeta.page === currentPageCustomer && cachedMeta.perPage === itemsPerPageSupplier && cachedMeta.search === searchTermCustomer;

            if (isCacheValid) {
                setCustomers(cachedSuppliers);
                setTotalPages_Customer(cachedMeta.totalPages);
                setLoading(false);
                localStorage.setItem(`${tabId}-loading-customers`, JSON.stringify(false));
                return;
            }
        } catch (err) {
            console.warn("Failed to parse cached meta:", err);
        }
        fetchCustomers(currentPageCustomer, itemsPerPageSupplier, searchTermCustomer);
    }, [currentPageCustomer, itemsPerPageSupplier, searchTermCustomer, tabId]);

    const fetchRVInfo = async () => {
        try {
            const idToUse = receiveVoucherId;
            if (!idToUse) {
                setLoading(false);
                return;
            }
            setLoading(true);
            setError(null);

            const purchaseOrderInfoKey = `${idToUse}-cached-rv-info`;
            const cachedSuppliersRaw = localStorage.getItem(purchaseOrderInfoKey);
            let foundSupplier;
            if (cachedSuppliersRaw) {
                foundSupplier = JSON.parse(cachedSuppliersRaw); // ✅ Parse cached JSON
            } else {
                foundSupplier = await receiveVoucherService.getRVInfo(idToUse); // ✅ Fetch from API
            }
            if (foundSupplier) {
                setTransDetails(foundSupplier);
                setDetailList(foundSupplier.details);
                setGlobCode(foundSupplier.account_code);
                switch (foundSupplier.account_code) {
                    case "12200":
                        setColInvoiceNo(true);
                        setColParticulars(false);
                        setColProductName(false);
                        break;
                    case "21301":
                        setColInvoiceNo(false);
                        setColParticulars(true);
                        setColProductName(true);
                        break;
                    default:
                        setColInvoiceNo(false);
                        setColParticulars(false);
                        setColProductName(false);
                        break;
                }
                setFormData((prev) => ({
                    ...prev,
                    rv_number: foundSupplier.rv_number || "",
                    rv_date: parseDate(foundSupplier.rv_date),
                    customer_code: foundSupplier.customer_code || "",
                    customer_id: foundSupplier.customer_id || 0,
                    account_name_en: foundSupplier.account_name_en || "",
                    account_name_cn: foundSupplier.account_name_cn || "",
                    status_value_en: foundSupplier.status_value_en || "",
                    status_value_cn: foundSupplier.status_value_cn || "",
                    product_title_en: foundSupplier.product_title_en || "",
                    product_title_cn: foundSupplier.product_title_cn || "",
                    billing_address_en: foundSupplier.billing_address_en || "",
                    billing_address_cn: foundSupplier.billing_address_cn || "",
                    bank_name_en: foundSupplier.bank_name_en || "",
                    bank_name_cn: foundSupplier.bank_name_cn || "",
                    charts_en: foundSupplier.charts_en || "",
                    charts_cn: foundSupplier.charts_cn || "",
                    currency: foundSupplier.currency || "",
                    ex_rate: foundSupplier.ex_rate || 0,
                    total: foundSupplier.total || 0,
                    amount_paid: foundSupplier.amount_paid || 0,
                    base_amount_paid: foundSupplier.base_amount_paid || 0,
                    count: foundSupplier.count || 0,
                    base_total: foundSupplier.base_total || 0,
                    bank_charges: foundSupplier.bank_charges || 0,
                    base_bank_charges: foundSupplier.base_bank_charges || 0,
                    excess_amount: foundSupplier.excess_amount || 0,
                    base_excess_amount: foundSupplier.base_excess_amount || 0,
                    invoice_deposit: foundSupplier.invoice_deposit || 0,
                    credit_used: foundSupplier.credit_used || 0,
                    trans_detail_en: foundSupplier.trans_detail_en || "",
                    trans_detail_cn: foundSupplier.trans_detail_cn || "",
                    operator: foundSupplier.operator || "",
                }));

                // ✅ Only cache if it's a fresh fetch
                if (!cachedSuppliersRaw) {
                    localStorage.setItem(purchaseOrderInfoKey, JSON.stringify(foundSupplier));
                }
            } else {
                setError("supplier not found");
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to fetch rv details");
            console.error("Error fetching rv details:", err);
        } finally {
            setLoading(false);
        }
    };
    const fetchChartsOfAccounts = async (page = currentPageAccounts, perPage = itemsPerPageAccounts, search = "") => {
        try {
            // Fetch the products and pass the sortId
            const paginatedData = await receiveVoucherService.getRVChartsOfAccount(page, perPage, search, "");
            setChartsOfAccounts(paginatedData.data);
            setTotalPages_Accounts(paginatedData.last_page);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to fetch chartsOfAccount");
            console.error("Error fetching chartsOfAccount:", err);
        }
    };
    const fetchCustomers = async (page = currentPageCustomer, perPage = itemsPerPageSupplier, search = "") => {
        try {
            setError(null);
            localStorage.setItem(`${tabId}-loading-customers`, JSON.stringify(true));
            const paginatedData = await customerService.getAllCustomer(page, perPage, search);
            setCustomers(paginatedData.data);
            setTotalPages_Customer(paginatedData.last_page);
            localStorage.setItem(`${tabId}-cached-customers`, JSON.stringify(paginatedData.data));
            localStorage.setItem(
                `${tabId}-cached-meta-customers`,
                JSON.stringify({
                    page,
                    perPage,
                    search,
                    totalPages: paginatedData.last_page,
                    totalItems: paginatedData.total,
                })
            );
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to fetch customers");
            console.error("Error fetching customers:", err);
        } finally {
            localStorage.setItem(`${tabId}-loading-customers`, JSON.stringify(false));
        }
    };
    const updateCachedRaw = async (cachedType: string, masterId: number) => {
        if (cachedType === "info") {
            const newData = await receiveVoucherService.getRVInfo(masterId);
            if (newData) {
                localStorage.setItem(`${masterId}-cached-rv-info`, JSON.stringify(newData));
            }
        }
    };
    const loadInvoiceStatus = async () => {
        try {
            const list = await fetchInvoiceStatus(); // fetches & returns
            setInvoiceStatus(list ?? []); // ✅ manually set state here
        } catch (err) {
            console.error("Failed to fetch loadInvoiceStatus:", err);
        }
    };
    const handleSave = async () => {
        if (globButtonType === "RV") {
            setLoadingSave(true);
            const data = new FormData();
            const customer_code = formData["customer_code"]?.toString().trim() ?? "";
            const bank = formData["bank"]?.toString().trim() ?? "";
            if (detailList.length === 0) {
                showErrorToast(translations["Detail(s) Required"]);
                setLoadingSave(false); // Enable button again
                return;
            }
            if (!customer_code || customer_code === "") {
                showErrorToast(translations["Customer Account Code is Required"]);
                setLoadingSave(false); // Enable button again
                return;
            }
            if (!bank || bank === "") {
                showErrorToast(translations["Bank is required"]);
                setLoadingSave(false); // Enable button again
                return;
            }
            let is_qty_zero = 0;
            let is_amound_paid_zero = 0;
            detailList.forEach((list) => {
                if (list) {
                    if (list.account_code.length > 3) {
                        data.append(
                            "details[]",
                            JSON.stringify({
                                id: list.id,
                                order_id: list.order_id,
                                account_code: list.account_code,
                                qty: list.qty,
                                amount: list.amount,
                                base_amount: list.base_amount,
                                amount_paid: list.amount_paid,
                                ex_rate_diff: list.ex_rate_diff,
                                particulars: list.particulars,
                                invoice_no: list.invoice_no,
                                product_id: list.product_id,
                                is_deleted: list.is_deleted,
                            })
                        );
                        if (list.qty === 0) {
                            is_qty_zero++;
                        }
                        if (list.amount_paid === 0) {
                            is_amound_paid_zero++;
                        }
                    }
                }
            });
            if (is_amound_paid_zero > 0) {
                showErrorToast(translations["Please input amount paid"]);
                setLoadingSave(false); // Enable button again
                return;
            }
            // Append all form data
            Object.keys(formData).forEach((key) => {
                let value = formData[key as keyof typeof formData];
                if (value !== null && value !== undefined) {
                    if (value instanceof Date) {
                        data.append(key, formatDateToCustom(value));
                    } else if (typeof value === "object" && "value" in value) {
                        data.append(key, (value as OptionType).value);
                    } else if (Array.isArray(value)) {
                        value.forEach((item) => data.append(`${key}[]`, item.value));
                    } else {
                        data.append(key, value.toString());
                    }
                }
            });
            try {
                const result = await receiveVoucherService.updateReceiveVoucher(receiveVoucherId, data);
                const newId = result?.id;
                if (result.token === "Error") {
                    showErrorToast(result.message);
                    return;
                }
                if (result.token === "Warning") {
                    showErrorToast(translations[result.message]);
                    return;
                }
                if ((saveType === "new" || saveType === "copy") && newId) {
                    onChangeReceiveVoucherId(newId);
                    onChangeSaveType("edit");
                }
                // Reset state to allow re-initialization after refetch
                setIsDirty(false);
                setIsInitialized(false);
                await updateCachedRaw("info", newId);
                fetchRVInfo();
                selectedPurchaseOrder([]);
                showSuccessToast(translations[result.message]);
                onSave(); // This will now trigger the cache clearing in the parent
            } catch (error) {
                console.log(error);
                showErrorToast(translations["Failed to save Transaction."] || "Failed to save Transaction.");
            } finally {
                setLoadingSave(false); // Enable button again after the operation is done
            }
        } else {
            const data = new FormData();
            data.append("customer_id", String(formData.customer_id));
            data.append("currency", String(formData.currency));
            const result = await invoiceService.doGetCreditDetail(data);
            const newArray: any = [];
            let count = 0;

            detailList.forEach((list) => {
                result.forEach((element: any) => {
                    const new_amount = count === 0 ? formData.total_unpaid : 0;
                    newArray.push({
                        invoice_no: list.invoice_no,
                        account_code: element.account_code,
                        account_name_en: element.account_name_en,
                        account_name_cn: element.account_name_cn,
                        ref_data: element.ref_data,
                        new_amount: new_amount,
                    });
                    count++;
                });
            });
            setSelectedCredits(newArray);
            setShowCreditsPopup(true);
        }
    };
    const handleSubmitCredit = async () => {
        setLoadingSave(true);
        const data = new FormData();
        data.append("customer_id", formData.customer_id.toString());
        data.append("currency", formData.currency.toString());
        selectedForCredits.forEach((element) => {
            data.append(
                "details[]",
                JSON.stringify({
                    invoice_no: element.invoice_no,
                    receive_amount: element.new_amount,
                    account_code: element.account_code,
                    balance_to_pay: element.new_amount,
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
            setGlobButtonType("RV");
            setLoadingSave(false);
            setShowCreditsPopup(false);
            clearForms(invoiceStatusOptions);
            showSuccessToast(translations[result.message]);
        } catch (error) {
            setLoadingSave(false);
            showErrorToast(translations["Failed to save Transaction."] || "Failed to save Transaction.");
        } finally {
            setLoadingSave(false); // Enable button again after the operation is done
        }
    };
    const handleAddNew = async () => {
        const confirmed = await showConfirm2(
            translations["Issue New RV for this customer"],
            translations["Issue New RV for this customer"],
            translations["Yes"],
            translations["No"],
            translations["Cancel"]
        );
        if (confirmed === "Yes") {
            onChangeReceiveVoucherId(0);
            onChangeSaveType("details");
            setIsDirty(false);
        } else if (confirmed === "No") {
            onChangeReceiveVoucherId(0);
            onChangeSaveType("new");
            clearForms(invoiceStatusOptions);
            setIsDirty(false);
        } else {
            console.log("User clicked 'Cancel'");
        }
    };
    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            const allIds = detailList?.map((p: any) => p.indexInt);
            selectedPurchaseOrder(allIds);
        } else {
            selectedPurchaseOrder([]);
        }
    };
    const handleSelectCustomer = (id: number, checked: boolean) => {
        if (checked) {
            selectedPurchaseOrder((prev) => [...prev, id]);
        } else {
            selectedPurchaseOrder((prev) => prev.filter((pid) => pid !== id));
        }
    };
    const handleRVDateChange = useCallback((dates: Date[]) => {
        setFormData((prev) => ({ ...prev, rv_date: dates[0] ?? null }));
        setIsDirty(true); // ✅ only if user is editing
    }, []);
    const handleAddRow = () => {
        const newId = Math.floor(10000 + Math.random() * 90000);
        const newData: DetailsRow = {
            id: 0,
            product_id: 0,
            product_code: "",
            product_title_en: "",
            product_title_cn: "",
            rv_number: "",
            qty: 0,
            rv_date: "",
            amount: 0,
            amount_paid: 0,
            base_amount: 0,
            currency: "",
            ex_rate: 0,
            particulars: "",
            customer_id: 0,
            invoice_no: "",
            ex_rate_diff: 0,
            account_code: "",
            order_id: 0,
            is_deleted: 0,
            indexInt: newId,
            age_type: "new",
            account_name_en: "",
            account_name_cn: "",
            delete_type: "",
        };
        setDetailList((prev) => [...prev, newData]);
    };
    const handleRemoveRow = async () => {
        if (selectedDetails.length === 0) {
            showErrorToast(translations["Please click checkbox to select row"]);
            return;
        }
        const confirmed = await showConfirm(translations["System Message"], translations["Are you sure you want to delete this record?"], translations["Delete"], translations["Cancel"]);
        if (!confirmed) return;
        // Update the detail list once, not in a loop
        const selectedItems = detailList.filter((list) => selectedDetails.includes(list.indexInt));
        setDetailList((prev) => {
            return prev.flatMap((item) => {
                if (selectedDetails.includes(item.indexInt)) {
                    if (item.id === 0) {
                        return [];
                    } else {
                        return [{ ...item, is_deleted: 1 }];
                    }
                }
                return [item];
            });
        });
        // Now handle the async part after state update
        let order_ids: any = [];
        let selected_items: any = [];
        selectedItems.forEach((element) => {
            order_ids.push(element.order_id);
            selected_items.push({
                product_code: element.product_code,
                product_title_en: element.product_title_en,
                product_title_cn: element.product_title_cn,
            });
        });
        let totalDeposit = 0;
        try {
            const deposit = await receiveVoucherService.getPaidAmounts(order_ids);
            totalDeposit += deposit ?? 0;
        } catch (err) {
            console.error("Error fetching deposit:", err);
        }
    };
    const handleDetailChange = async (indexInt: number, value: string, column: string) => {
        const operator = formData.operator;
        setDetailList((prev) =>
            prev.map((item) => {
                if (item.indexInt === indexInt) {
                    const updatedItem: any = { ...item };
                    let base_amount = 0;
                    if (baseCurrency() === formData.currency) {
                        base_amount = Number(value);
                    } else {
                        if (operator === "Divide") {
                            base_amount = Number(value) / formData.ex_rate;
                        } else {
                            base_amount = Number(value) * formData.ex_rate;
                        }
                    }
                    updatedItem["base_amount"] = base_amount.toFixed(2);
                    updatedItem[column] = value;
                    return updatedItem;
                }
                return item;
            })
        );
    };
    const handleEnterKey = async (indexInt: number, value: string, column: string, ageType: string) => {
        console.log(ageType);
        switch (column) {
            case "account_code":
                try {
                    setGlobalIndex(indexInt);
                    const res = await receiveVoucherService.getRVChartsOfAccount(currentPageAccounts, itemsPerPageAccounts, "", value);
                    const list = res.data[0];
                    const len = res.total;
                    if (len === 0) {
                        setShowAccounts(true);
                        return;
                    }
                    if (len > 1) {
                        setShowAccounts(true);
                        return;
                    }
                    setDetailList((prev) =>
                        prev.map((item) => {
                            if (item.indexInt === indexInt) {
                                const updatedItem: any = { ...item };
                                updatedItem["account_code"] = list.account_code;
                                updatedItem["account_name_en"] = list.account_name_en;
                                updatedItem["account_name_cn"] = list.account_name_cn;
                                return updatedItem;
                            }
                            return item;
                        })
                    );
                    setGlobCode(list.account_code);
                    switch (list.account_code) {
                        case "12200":
                            setColInvoiceNo(true);
                            setColParticulars(false);
                            setColProductName(false);
                            break;
                        case "21301":
                            setColInvoiceNo(false);
                            setColParticulars(true);
                            setColProductName(true);
                            break;
                        default:
                            setColInvoiceNo(false);
                            setColParticulars(false);
                            setColProductName(false);
                            break;
                    }
                } catch (err) {
                    setError(err instanceof Error ? err.message : "Failed to fetch product");
                    console.error("Error fetching product:", err);
                }
                break;
            case "customer_code":
                const res = await receiveVoucherService.getCustomerInfoByCode(value, "enter");
                if (res.token === "CustomerNotExists") {
                    setShowCustomers(true);
                    return;
                }
                if (res.token === "MultipleCustomer") {
                    setShowCustomers(true);
                    return;
                }
                if (res.list.existsSOID > 0) {
                    onChangeReceiveVoucherId(res.list.existsSOID);
                    onChangeSaveType("edit");
                    setShowCustomers(false);
                    return;
                }
                setFormData((prev) => ({
                    ...prev,
                    customer_id: res.list.customer_id,
                    customer_code: res.list.customer_code,
                    account_name_en: res.list.account_name_en,
                    account_name_cn: res.list.account_name_cn,
                    billing_address_en: res.list.billing_address_en,
                    billing_address_cn: res.list.billing_address_cn,
                    delivery_address_en: res.list.delivery_address_en,
                    delivery_address_cn: res.list.delivery_address_cn,
                    rv_date: new Date(),
                    currency: res.list.currency,
                    ex_rate: res.list.ex_rate,
                }));
                const list = await receiveVoucherService.getRVExists(res.list.customer_id);
                setDetailList([]);
                list.forEach((element: any) => {
                    const newId = Math.floor(10000 + Math.random() * 90000);
                    const ex_rate = res.list.ex_rate;
                    const base_amount = ex_rate * element.balance;
                    const newData: DetailsRow = {
                        id: 0,
                        product_id: 0,
                        product_code: "",
                        product_title_en: "",
                        product_title_cn: "",
                        rv_number: "",
                        qty: 0,
                        rv_date: "",
                        amount: element.balance,
                        amount_paid: 0,
                        base_amount: base_amount,
                        currency: formData.currency,
                        ex_rate: formData.ex_rate,
                        particulars: "",
                        customer_id: res.list.customer_id,
                        invoice_no: element.invoice_no,
                        ex_rate_diff: 0,
                        account_code: element.account_code,
                        order_id: 0,
                        is_deleted: 0,
                        indexInt: newId,
                        age_type: "new",
                        account_name_en: element.account_name_en,
                        account_name_cn: element.account_name_cn,
                        delete_type: "",
                    };
                    switch (element.account_code) {
                        case "12200":
                            setColInvoiceNo(true);
                            setColParticulars(false);
                            setColProductName(false);
                            break;
                        case "21301":
                            setColInvoiceNo(false);
                            setColParticulars(true);
                            setColProductName(true);
                            break;
                        default:
                            setColInvoiceNo(false);
                            setColParticulars(false);
                            setColProductName(false);
                            break;
                    }
                    fetchButtonValue(element.customer_id);
                    setGlobCode(element.account_code);
                    setDetailList((prev) => [...prev, newData]);
                });
                break;
        }
    };
    const handlPopupProducts = (indexInt: number, ageType: string) => {
        setGlobalIndex(indexInt);
        setShowAccounts(true);
        console.log(ageType);
    };
    const handleVoid = async () => {
        const data = new FormData();
        data.append("details[]", JSON.stringify({ rv_number: formData.rv_number }));
        const confirmed = await showConfirm(translations["Void Record(s)"], translations["alert_message_38"], translations["Yes"], translations["Cancel"]);
        if (!confirmed) return;
        try {
            const result = await receiveVoucherService.voidReceiveVoucher(data);
            if (result.token === "Error") {
                showErrorToast(result.message);
                return;
            }
            // Reset state to allow re-initialization after refetch
            setIsDirty(false);
            setIsInitialized(false);
            await updateCachedRaw("info", receiveVoucherId);
            fetchRVInfo();
            selectedPurchaseOrder([]);
            showSuccessToast(translations[result.message]);
            onSave(); // This will now trigger the cache clearing in the parent
        } catch (error) {}
    };
    const handleRowClick_Customer = async (e: React.MouseEvent, tableId: number) => {
        // Prevent navigation if clicking on checkboxes or toggle switches
        const target = e.target as HTMLElement;
        if (target.closest("input") || target.closest("label") || target.closest("[data-copy-button]")) {
            return;
        }
        const supplierListKey = `${tabId}-cached-customers`;
        const cachedSuppliersRaw = localStorage.getItem(supplierListKey);
        let rawDataCached: ApiCustomer[] | null = null;
        if (cachedSuppliersRaw) {
            try {
                rawDataCached = JSON.parse(cachedSuppliersRaw);
            } catch (error) {
                console.error("Error parsing cached customer data", error);
            }
        }
        const specificItem = rawDataCached?.find((item: ApiCustomer) => item.id === tableId);
        const customer_code = specificItem?.customer_code?.toString();
        const res = await receiveVoucherService.getCustomerInfoByCode(String(customer_code), "click");
        if (res.token === "CustomerNotExists") {
            showErrorToast(translations[res.message]);
            return;
        }
        if (res.list.existsSOID > 0) {
            onChangeReceiveVoucherId(res.list.existsSOID);
            onChangeSaveType("edit");
            fetchRVInfo();
            setShowCustomers(false);
            return;
        }
        setFormData((prev) => ({
            ...prev,
            customer_id: res.list.customer_id,
            customer_code: res.list.customer_code,
            account_name_en: res.list.account_name_en,
            account_name_cn: res.list.account_name_cn,
            billing_address_en: res.list.billing_address_en,
            billing_address_cn: res.list.billing_address_cn,
            delivery_address_en: res.list.delivery_address_en,
            delivery_address_cn: res.list.delivery_address_cn,
            currency: res.list.currency,
            rv_date: new Date(),
            ex_rate: res.list.ex_rate,
        }));
        const list = await receiveVoucherService.getRVExists(res.list.customer_id);
        setDetailList([]);
        setShowCustomers(false);
        list.forEach((element: any) => {
            const newId = Math.floor(10000 + Math.random() * 90000);
            const ex_rate = res.list.ex_rate;
            const base_amount = ex_rate * element.balance;
            const newData: DetailsRow = {
                id: 0,
                product_id: 0,
                product_code: "",
                product_title_en: "",
                product_title_cn: "",
                rv_number: "",
                qty: 0,
                rv_date: "",
                amount: element.balance,
                amount_paid: 0,
                base_amount: base_amount,
                currency: formData.currency,
                ex_rate: formData.ex_rate,
                particulars: "",
                customer_id: res.list.customer_id,
                invoice_no: element.invoice_no,
                ex_rate_diff: 0,
                account_code: element.account_code,
                order_id: 0,
                is_deleted: 0,
                indexInt: newId,
                age_type: "new",
                account_name_en: element.account_name_en,
                account_name_cn: element.account_name_cn,
                delete_type: "",
            };
            switch (element.account_code) {
                case "12200":
                    setColInvoiceNo(true);
                    setColParticulars(false);
                    setColProductName(false);
                    break;
                case "21301":
                    setColInvoiceNo(false);
                    setColParticulars(true);
                    setColProductName(true);
                    break;
                default:
                    setColInvoiceNo(false);
                    setColParticulars(false);
                    setColProductName(false);
                    break;
            }
            fetchButtonValue(res.list.customer_id);
            setGlobCode(element.account_code);
            setDetailList((prev) => [...prev, newData]);
        });
    };
    const handleRowClick_Accounts = async (e: React.MouseEvent, tableId: number) => {
        // Prevent navigation if clicking on checkboxes or toggle switches
        const target = e.target as HTMLElement;
        if (target.closest("input") || target.closest("label") || target.closest("[data-copy-button]")) {
            return;
        }
        const specificItem = chartsOfAccount.filter((item) => item.id === tableId);
        setDetailList((prev) =>
            prev.map((item) => {
                if (item.indexInt === globalIndex) {
                    const updatedItem: any = { ...item };
                    updatedItem["account_code"] = specificItem[0].account_code;
                    updatedItem["account_name_en"] = specificItem[0].account_name_en;
                    updatedItem["account_name_cn"] = specificItem[0].account_name_cn;
                    return updatedItem;
                }
                return item;
            })
        );
        setShowAccounts(false);
        setGlobCode(specificItem[0].account_code);
        switch (specificItem[0].account_code) {
            case "12200":
                setColInvoiceNo(true);
                setColParticulars(false);
                setColProductName(false);
                break;
            case "21301":
                setColInvoiceNo(false);
                setColParticulars(true);
                setColProductName(true);
                break;
            default:
                setColInvoiceNo(false);
                setColParticulars(false);
                setColProductName(false);
                break;
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
    const fetchButtonValue = async (customer_id: number) => {
        try {
            const list = await receiveVoucherService.doGetButtonValue(customer_id);
            const current_credit = list.current_credit;
            const total = list.total;
            const credit_used = list.credit_used;
            const total_payment = list.total_payment;
            const balance = total - total_payment;
            if (current_credit > balance) {
                setGlobButtonType("JV");
            } else {
                if (balance <= 0) {
                    if (credit_used > 0) {
                        setGlobButtonType("JV");
                    } else {
                        setGlobButtonType("RV");
                    }
                } else {
                    setGlobButtonType("RV");
                }
            }
            // Do something with `list` if needed (e.g., set state)
        } catch (error) {
            console.error("Error fetching RV data:", error);
        }
    };
    const tabs = [{ id: "information", label: translations["Information"] }];
    if (loading) {
        return (
            <div className="min-h-screen" style={{ backgroundColor: "#1a1a1a" }}>
                <div className="flex items-center justify-center h-64">
                    <div className="text-[#ffffffcc] text-custom-sm">{translations["Processing2"]}...</div>
                </div>
            </div>
        );
    }
    if ((error || !masterList) && saveType !== "new") {
        return (
            <div className="min-h-screen" style={{ backgroundColor: "#1a1a1a" }}>
                <div className="p-6">
                    <button onClick={onBack} className="flex items-center space-x-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-[#ffffffcc] text-custom-sm rounded-lg transition-colors mb-4">
                        <ArrowLeft className="h-4 w-4" />
                        <span>{translations["Back"]}</span>
                    </button>
                    <div className="text-center py-12">
                        <div className="text-[#ffffffcc] text-custom-sm">{translations["Processing2"]}...</div>
                    </div>
                </div>
            </div>
        );
    }
    const renderDetails = () => (
        <div className="p-1 bg-[#19191c] rounded-xl">
            <div className="h-[calc(100vh-150px)] overflow-y-auto pr-2">
                <div className="grid gap-4">
                    <div className="grid grid-cols-12 gap-4">
                        {/* Right side: 12 columns */}
                        <div className="col-span-12 p-1">
                            <fieldset className="grid grid-cols-12 gap-4 border-[1px] border-[#ffffff1a] rounded-lg p-4 mb-2">
                                <div className="col-span-12 md:col-span-4">
                                    <div className="flex items-center gap-4 mb-2">
                                        <label className="w-[25%] text-gray-400 text-sm text-right">{translations["Customer Code"]}</label>
                                        <div className="flex flex-1">
                                            <input
                                                type="text"
                                                value={formData.customer_code}
                                                onChange={(e) => {
                                                    const value = e.target.value;
                                                    setFormData((prev) => ({ ...prev, customer_code: value }));
                                                    setIsDirty(true);
                                                }}
                                                onKeyDown={(e) => {
                                                    if (e.key === "Enter") {
                                                        handleEnterKey(0, formData.customer_code, "customer_code", "");
                                                    }
                                                }}
                                                className="flex-1 px-3 py-2 border border-[#ffffff1a] border-r-0 bg-transparent text-[#ffffffcc] text-custom-sm rounded-tl-md rounded-bl-md !rounded-tr-none !rounded-br-none"
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
                                    <div className="flex items-center space-x-4 mb-2">
                                        <label className="w-[25%] text-gray-400 text-sm text-right">{translations["Currency"]}</label>
                                        <input
                                            value={formData.currency}
                                            readOnly
                                            onChange={(e) => {
                                                const value = e.target.value;
                                                setFormData((prev) => ({ ...prev, currency: value }));
                                                setIsDirty(true);
                                            }}
                                            className="flex-1 px-3 py-2 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm"
                                        />
                                    </div>
                                    <div className="flex items-center space-x-4 mb-2">
                                        <label className="w-[25%] text-gray-400 text-sm text-right">{translations["Ex Rate"]}</label>
                                        <input
                                            type="text"
                                            hidden={lang === "cn"}
                                            readOnly
                                            value={formData.ex_rate.toFixed(4)}
                                            onChange={(e) => {
                                                const value = Number(e.target.value);
                                                setFormData((prev) => ({ ...prev, ex_rate: value }));
                                                setIsDirty(true);
                                            }}
                                            className="flex-1 px-3 py-2 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm"
                                        />
                                    </div>
                                </div>
                                <div className="col-span-12 md:col-span-4">
                                    <div className="flex items-center space-x-4 mb-2">
                                        <label className="w-[25%] text-gray-400 text-sm text-right">{translations["Customer Name"]}</label>
                                        <input
                                            type="text"
                                            hidden={lang === "cn"}
                                            readOnly
                                            value={formData.account_name_en}
                                            onChange={(e) => {
                                                const value = e.target.value;
                                                setFormData((prev) => ({ ...prev, account_name_en: value }));
                                                setIsDirty(true);
                                            }}
                                            className="flex-1 px-3 py-2 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm"
                                        />
                                        <input
                                            type="text"
                                            hidden={lang === "en"}
                                            readOnly
                                            value={formData.account_name_cn}
                                            onChange={(e) => {
                                                const value = e.target.value;
                                                setFormData((prev) => ({ ...prev, account_name_cn: value }));
                                                setIsDirty(true);
                                            }}
                                            className="flex-1 px-3 py-2 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm"
                                        />
                                    </div>
                                    <div className="flex items-center space-x-4 mb-2">
                                        <label className="w-[25%] text-gray-400 text-sm text-right">{translations["Delivery Address"]}</label>
                                        <textarea
                                            rows={3}
                                            hidden={lang === "cn"}
                                            readOnly
                                            value={formData.billing_address_en}
                                            onChange={(e) => {
                                                const value = e.target.value;
                                                setFormData((prev) => ({ ...prev, billing_address_en: value }));
                                                setIsDirty(true);
                                            }}
                                            className="flex-1 px-3 py-2 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm"
                                        />
                                        <textarea
                                            rows={3}
                                            hidden={lang === "en"}
                                            readOnly
                                            value={formData.billing_address_cn}
                                            onChange={(e) => {
                                                const value = e.target.value;
                                                setFormData((prev) => ({ ...prev, billing_address_cn: value }));
                                                setIsDirty(true);
                                            }}
                                            className="flex-1 px-3 py-2 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm"
                                        />
                                    </div>
                                </div>
                                <div className="col-span-12 md:col-span-4">
                                    <div className="flex items-center space-x-4 mb-2">
                                        <label className="w-[25%] text-gray-400 text-sm text-right">{translations["RV No"]}</label>
                                        <input
                                            value={formData.rv_number}
                                            readOnly
                                            onChange={(e) => {
                                                const value = e.target.value;
                                                setFormData((prev) => ({ ...prev, rv_number: value }));
                                                setIsDirty(true);
                                            }}
                                            className="flex-1 px-3 py-2 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm"
                                        />
                                    </div>
                                    <div className="flex items-center space-x-4 mb-2">
                                        <label className="w-[25%] text-gray-400 text-sm text-right">{translations["RV Date"]}</label>
                                        <Flatpickr
                                            onChange={handleRVDateChange}
                                            options={{
                                                dateFormat: "M d Y",
                                                defaultDate: formData.rv_date || undefined,
                                                allowInput: true,
                                                locale: locale,
                                            }}
                                            className="flex-1 px-3 py-2 border-[1px] border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm"
                                        />
                                    </div>
                                    <div className="flex items-center space-x-4 mb-2">
                                        <label className="w-[26%] text-gray-400 text-sm text-right">{translations["RV Status"]}</label>
                                        <Select
                                            classNamePrefix="react-select"
                                            value={formData.rv_status_id ?? null}
                                            onChange={async (selected) => {
                                                setFormData({ ...formData, rv_status_id: selected as OptionType | null });
                                                setIsDirty(true); // ✅ only if user is editing
                                            }}
                                            options={invoiceStatusOptions}
                                            styles={{
                                                ...selectStyles,
                                                menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                                            }}
                                            className="w-[75%]"
                                            placeholder={translations["Select"]}
                                            menuPlacement="auto"
                                            menuPosition="fixed"
                                            menuPortalTarget={typeof window !== "undefined" ? document.body : null}
                                        />
                                    </div>
                                </div>
                            </fieldset>
                            <fieldset className="grid grid-cols-12 gap-4 border-[1px] border-[#ffffff1a] rounded-lg p-4 mb-2">
                                <div className="col-span-12 md:col-span-12 table-layout">
                                    <table className="w-full border border-gray-600 border-collapse text-sm text-left">
                                        <thead className="sticky top-0 z-[1] py-1 px-4" style={{ backgroundColor: "#1f2132" }}>
                                            <tr className="border-b" style={{ borderColor: "#2d2d30" }}>
                                                <th className="w-[3%] text-center py-1 px-2 text-gray-400 text-sm w-12 border border-[#40404042]">
                                                    <div className="relative group inline-block">
                                                        <CustomCheckbox
                                                            checked={selectedDetails.length === detailList?.length && detailList?.length > 0}
                                                            onChange={(checked) => handleSelectAll(checked)}
                                                        />
                                                    </div>
                                                </th>
                                                <th className="w-[3%] text-center py-1 px-2 text-gray-400 text-sm w-12 border border-[#40404042]">
                                                    <div className="relative group inline-block">
                                                        <button
                                                            type="button"
                                                            onClick={handleAddRow}
                                                            className="px-1 py-1 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-xs"
                                                        >
                                                            <Plus className="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                </th>
                                                <th className="w-[3%] text-center py-1 px-2 text-gray-400 text-sm w-12 border border-[#40404042]"></th>
                                                <th
                                                    className={`text-left py-1 px-2 text-gray-400 text-sm border border-[#40404042] ${
                                                        globCode === "12200" ? "w-[12%]" : globCode === "21301" ? "w-[10%]" : "w-[12%]"
                                                    }`}
                                                >
                                                    {translations["Account Code"]}
                                                </th>
                                                <th
                                                    className={`text-left py-1 px-2 text-gray-400 text-sm border border-[#40404042] ${
                                                        globCode === "12200" ? "w-[19%]" : globCode === "21301" ? "w-[10%]" : "w-[19%]"
                                                    }`}
                                                >
                                                    {translations["Description"]}
                                                </th>
                                                {colParticulars && (
                                                    <th
                                                        className={`text-left py-1 px-2 text-gray-400 text-sm border border-[#40404042] ${
                                                            globCode === "12200" ? "w-[0%]" : globCode === "21301" ? "w-[15%]" : "w-[0%]"
                                                        }`}
                                                    >
                                                        {translations["Details"]}
                                                    </th>
                                                )}
                                                {colProductName && (
                                                    <th
                                                        className={`text-left py-1 px-2 text-gray-400 text-sm border border-[#40404042] ${
                                                            globCode === "12200" ? "w-[0%]" : globCode === "21301" ? "w-[22%]" : "w-[0%]"
                                                        }`}
                                                    >
                                                        {translations["Product Name"]}
                                                    </th>
                                                )}
                                                {colInvoiceNo && (
                                                    <th
                                                        className={`text-left py-1 px-2 text-gray-400 text-sm border border-[#40404042] ${
                                                            globCode === "12200" ? "w-[15%]" : globCode === "21301" ? "w-[0%]" : "w-[0%]"
                                                        }`}
                                                    >
                                                        {translations["Invoice No"]}
                                                    </th>
                                                )}
                                                <th
                                                    className={`text-center py-1 px-2 text-gray-400 text-sm border border-[#40404042] ${
                                                        globCode === "12200" ? "w-[10%]" : globCode === "21301" ? "w-[9%]" : "w-[15%]"
                                                    }`}
                                                >
                                                    {translations["Amount"]}
                                                </th>

                                                <th
                                                    className={`text-center py-1 px-2 text-gray-400 text-sm border border-[#40404042] ${
                                                        globCode === "12200" ? "w-[10%]" : globCode === "21301" ? "w-[9%]" : "w-[15%]"
                                                    }`}
                                                >
                                                    {translations["Ex Rate"]}
                                                </th>
                                                <th
                                                    className={`text-center py-1 px-2 text-gray-400 text-sm border border-[#40404042] ${
                                                        globCode === "12200" ? "w-[10%]" : globCode === "21301" ? "w-[9%]" : "w-[15%]"
                                                    }`}
                                                >
                                                    {translations["Default Currency"]}
                                                </th>
                                                <th
                                                    className={`text-center py-1 px-2 text-gray-400 text-sm border border-[#40404042] ${
                                                        globCode === "12200" ? "w-[15%]" : globCode === "21301" ? "w-[10%]" : "w-[15%]"
                                                    }`}
                                                >
                                                    {translations["AmountPaid2"]}
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {detailList.length === 0 ? (
                                                <tr className="clickable border-b hover:bg-gray-700 hover:bg-opacity-30 transition-colors cursor-pointer" style={{ borderColor: "#40404042" }}>
                                                    <td colSpan={10} className="py-2 px-2 text-gray-400 text-center text-custom-sm border border-[#40404042]">
                                                        {translations["No data available on table"]}
                                                    </td>
                                                </tr>
                                            ) : (
                                                detailList.map(
                                                    (item) =>
                                                        item.is_deleted !== 1 && (
                                                            <tr
                                                                key={item.indexInt}
                                                                className={`clickable border-b hover:bg-gray-700 hover:bg-opacity-30 transition-colors cursor-pointer ${
                                                                    selectedDetails.includes(item.indexInt as number) ? "bg-gray-700 bg-opacity-30" : ""
                                                                }`}
                                                                style={{ borderColor: "#40404042" }}
                                                            >
                                                                <td className="py-2 px-2 text-gray-400 text-center text-custom-sm border border-[#40404042]">
                                                                    <CustomCheckbox
                                                                        checked={selectedDetails.includes(item.indexInt as number)}
                                                                        onChange={(checked) => handleSelectCustomer(item.indexInt as number, checked)}
                                                                    />
                                                                </td>
                                                                <td className="py-2 px-2 text-gray-400 text-center text-custom-sm border border-[#40404042]">
                                                                    <div className="relative group inline-block">
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => handleRemoveRow()}
                                                                            className="px-1 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-xs"
                                                                        >
                                                                            <X className="h-4 w-4" />
                                                                        </button>
                                                                    </div>
                                                                </td>
                                                                <td className="py-2 px-2 text-gray-400 text-center text-custom-sm border border-[#40404042]">
                                                                    <div className="relative group inline-block">
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => handlPopupProducts(item.indexInt, item.age_type)}
                                                                            className="px-1 py-1 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors text-xs"
                                                                        >
                                                                            <Search className="h-4 w-4" />
                                                                        </button>
                                                                    </div>
                                                                </td>
                                                                <td className="py-0 px-0 text-gray-400 text-left text-custom-sm border border-[#40404042]">
                                                                    <input
                                                                        type="text"
                                                                        value={item.account_code}
                                                                        onChange={(e) => handleDetailChange(item.indexInt, e.target.value, "account_code")}
                                                                        onKeyDown={(e) => {
                                                                            if (e.key === "Enter") {
                                                                                handleEnterKey(item.indexInt, item.account_code, "account_code", item.age_type);
                                                                            }
                                                                        }}
                                                                        className="w-full px-3 py-1.5 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-sm rounded"
                                                                    />
                                                                </td>
                                                                <td className="py-0 px-0 text-gray-400 text-left text-custom-sm border border-[#40404042]">
                                                                    <input
                                                                        type="text"
                                                                        readOnly={masterList?.rv_status_id != 2}
                                                                        value={lang === "en" ? item.account_name_en : item.account_name_cn}
                                                                        className="w-full px-3 py-1.5 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-sm rounded"
                                                                    />
                                                                </td>
                                                                {colParticulars && (
                                                                    <td className="py-0 px-0 text-gray-400 text-left text-custom-sm border border-[#40404042]">
                                                                        <input
                                                                            type="text"
                                                                            value={item.particulars}
                                                                            readOnly={masterList?.rv_status_id != 2}
                                                                            onChange={(e) => {
                                                                                const value = e.target.value;
                                                                                if (/^\d*\.?\d*$/.test(value)) {
                                                                                    // handleDetailChange(item.indexInt, value, "particulars");
                                                                                }
                                                                            }}
                                                                            onFocus={(e) => {
                                                                                if (e.target.value === "0") {
                                                                                    e.target.select();
                                                                                }
                                                                            }}
                                                                            className="w-full px-3 py-1.5 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-sm rounded text-left"
                                                                        />
                                                                    </td>
                                                                )}
                                                                {colProductName && (
                                                                    <td className="py-0 px-0 text-gray-400 text-left text-custom-sm border border-[#40404042]">
                                                                        <input
                                                                            type="text"
                                                                            value={lang === "en" ? item.product_title_en : item.product_title_cn}
                                                                            readOnly={masterList?.rv_status_id != 2}
                                                                            onChange={(e) => {
                                                                                const value = e.target.value;
                                                                                if (/^\d*\.?\d*$/.test(value)) {
                                                                                    // handleDetailChange(item.indexInt, value, "qty");
                                                                                }
                                                                            }}
                                                                            className="w-full px-3 py-1.5 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-sm rounded text-left"
                                                                        />
                                                                    </td>
                                                                )}
                                                                {colInvoiceNo && (
                                                                    <td className="py-0 px-0 text-gray-400 text-left text-custom-sm border border-[#40404042]">
                                                                        <input
                                                                            type="text"
                                                                            value={item.invoice_no}
                                                                            readOnly={masterList?.rv_status_id != 2}
                                                                            onChange={(e) => {
                                                                                const value = e.target.value;
                                                                                if (/^\d*\.?\d*$/.test(value)) {
                                                                                    handleDetailChange(item.indexInt, value, "invoice_no");
                                                                                }
                                                                            }}
                                                                            className="w-full px-3 py-1.5 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-sm rounded text-left"
                                                                        />
                                                                    </td>
                                                                )}
                                                                <td className="py-0 px-0 text-gray-400 text-center text-custom-sm border border-[#40404042]">
                                                                    <input
                                                                        type="text"
                                                                        value={item.amount === 0 ? "" : item.amount}
                                                                        placeholder="0"
                                                                        onChange={(e) => {
                                                                            const value = e.target.value;
                                                                            if (/^\d*\.?\d*$/.test(value)) {
                                                                                handleDetailChange(item.indexInt, value, "amount");
                                                                            }
                                                                        }}
                                                                        className="w-full px-3 py-1.5 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-sm rounded text-center"
                                                                    />
                                                                </td>
                                                                <td className="py-0 px-0 text-gray-400 text-center text-custom-sm border border-[#40404042]">
                                                                    <input
                                                                        type="number"
                                                                        value={formData.ex_rate}
                                                                        readOnly
                                                                        onChange={(e) => {
                                                                            const value = e.target.value;
                                                                            if (/^\d*\.?\d*$/.test(value)) {
                                                                                handleDetailChange(item.indexInt, value, "ex_rate");
                                                                            }
                                                                        }}
                                                                        onFocus={(e) => {
                                                                            if (e.target.value === "0") {
                                                                                e.target.select();
                                                                            }
                                                                        }}
                                                                        className="w-full px-3 py-1.5 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-sm rounded text-center"
                                                                    />
                                                                </td>
                                                                <td className="py-0 px-0 text-gray-400 text-center text-custom-sm border border-[#40404042]">
                                                                    <input
                                                                        type="number"
                                                                        value={item.base_amount}
                                                                        readOnly
                                                                        onChange={(e) => {
                                                                            const value = e.target.value;
                                                                            if (/^\d*\.?\d*$/.test(value)) {
                                                                                handleDetailChange(item.indexInt, value, "base_amount");
                                                                            }
                                                                        }}
                                                                        onFocus={(e) => {
                                                                            if (e.target.value === "0") {
                                                                                e.target.select();
                                                                            }
                                                                        }}
                                                                        className="w-full px-3 py-1.5 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-sm rounded text-center"
                                                                    />
                                                                </td>
                                                                <td className="py-0 px-0 text-gray-400 text-center text-custom-sm border border-[#40404042]">
                                                                    <input
                                                                        type="number"
                                                                        value={item.amount_paid === 0 ? "" : item.amount_paid}
                                                                        placeholder="0"
                                                                        onChange={(e) => {
                                                                            const value = e.target.value;
                                                                            if (/^\d*\.?\d*$/.test(value)) {
                                                                                handleDetailChange(item.indexInt, value, "amount_paid");
                                                                            }
                                                                        }}
                                                                        onFocus={(e) => {
                                                                            if (e.target.value === "0") {
                                                                                e.target.select();
                                                                            }
                                                                        }}
                                                                        className="w-full px-3 py-1.5 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-sm rounded text-center"
                                                                    />
                                                                </td>
                                                            </tr>
                                                        )
                                                )
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </fieldset>
                            <fieldset className="grid grid-cols-12 gap-4 border-[1px] border-[#ffffff1a] rounded-lg p-4 mb-2">
                                <div className="col-span-12 md:col-span-3">
                                    <div className="flex items-center space-x-4 mb-2">
                                        <label className="w-[30%] text-gray-400 text-sm text-right">{translations["Bank"]}</label>
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
                                    <div className="flex items-center space-x-4 mb-2">
                                        <label className="w-[30%] text-gray-400 text-sm text-right">{translations["Bank Charges"]}</label>
                                        <input
                                            type="number"
                                            value={formData.bank_charges === 0 ? "" : formData.bank_charges}
                                            placeholder="0"
                                            onChange={(e) => {
                                                const value = Number(e.target.value);
                                                setFormData((prev) => ({ ...prev, bank_charges: value }));
                                                setIsDirty(true);
                                            }}
                                            className="text-right flex-1 px-3 py-2 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm"
                                        />
                                        <input
                                            type="text"
                                            hidden
                                            readOnly
                                            value={formData.base_bank_charges}
                                            onChange={(e) => {
                                                const value = Number(e.target.value);
                                                setFormData((prev) => ({ ...prev, base_bank_charges: value }));
                                                setIsDirty(true);
                                            }}
                                            className="text-right flex-1 px-3 py-2 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm"
                                        />
                                    </div>
                                    <div className="flex items-center space-x-4 mb-2">
                                        <label className="w-[30%] text-gray-400 text-sm text-right">{translations["Invoice Deposit"]}</label>
                                        <input
                                            type="text"
                                            readOnly
                                            value={formData.invoice_deposit}
                                            onChange={(e) => {
                                                const value = Number(e.target.value);
                                                setFormData((prev) => ({ ...prev, invoice_deposit: value }));
                                                setIsDirty(true);
                                            }}
                                            className="text-right flex-1 px-3 py-2 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm"
                                        />
                                    </div>
                                    <div className="flex items-center space-x-4 mb-2">
                                        <label className="w-[30%] text-gray-400 text-sm text-right">{translations["Credit Used"]}</label>
                                        <input
                                            type="text"
                                            readOnly
                                            value={formData.credit_used}
                                            onChange={(e) => {
                                                const value = Number(e.target.value);
                                                setFormData((prev) => ({ ...prev, credit_used: value }));
                                                setIsDirty(true);
                                            }}
                                            className="text-right flex-1 px-3 py-2 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm"
                                        />
                                    </div>
                                </div>
                                <div className="col-span-12 md:col-span-4"></div>
                                <div className="col-span-12 md:col-span-3">
                                    <div className="flex items-center space-x-4 mb-2">
                                        <label className="w-[35%] text-gray-400 text-sm text-right">{translations["Total"]}</label>
                                        <input
                                            type="text"
                                            readOnly
                                            value={formData.currency}
                                            onChange={(e) => {
                                                const value = e.target.value;
                                                setFormData((prev) => ({ ...prev, currency: value }));
                                                setIsDirty(true);
                                            }}
                                            className="w-[20%] px-3 py-2 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm text-center"
                                        />
                                        <input
                                            type="text"
                                            readOnly
                                            value={formData.total}
                                            onChange={(e) => {
                                                const value = Number(e.target.value);
                                                setFormData((prev) => ({ ...prev, total: value }));
                                                setIsDirty(true);
                                            }}
                                            className="w-[45%] px-3 py-2 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm text-right"
                                        />
                                    </div>
                                    <div className="flex items-center space-x-4 mb-2">
                                        <label className="w-[35%] text-gray-400 text-sm text-right">{translations["Amount Paid"]}</label>
                                        <input
                                            type="text"
                                            readOnly
                                            value={formData.currency}
                                            className="w-[20%] px-3 py-2 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm text-center"
                                        />
                                        <input
                                            type="text"
                                            readOnly
                                            value={formData.amount_paid}
                                            onChange={(e) => {
                                                const value = Number(e.target.value);
                                                setFormData((prev) => ({ ...prev, amount_paid: value }));
                                                setIsDirty(true);
                                            }}
                                            className="w-[45%] px-3 py-2 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm text-right"
                                        />
                                    </div>
                                    <div className="flex items-center space-x-4 mb-2">
                                        <label className="w-[35%] text-gray-400 text-sm text-right">{translations["Excess Payment"]}</label>
                                        <input
                                            type="text"
                                            readOnly
                                            value={formData.currency}
                                            onChange={(e) => {
                                                const value = e.target.value;
                                                setFormData((prev) => ({ ...prev, currency: value }));
                                                setIsDirty(true);
                                            }}
                                            className="w-[20%] px-3 py-2 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm text-center"
                                        />
                                        <input
                                            type="text"
                                            readOnly
                                            value={formData.excess_amount}
                                            onChange={(e) => {
                                                const value = Number(e.target.value);
                                                setFormData((prev) => ({ ...prev, excess_amount: value }));
                                                setIsDirty(true);
                                            }}
                                            className="w-[45%] px-3 py-2 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm text-right"
                                        />
                                    </div>
                                    {formData.total_unpaid > 0 && (
                                        <div className="flex items-center space-x-4 mb-2">
                                            <label className="w-[35%] text-gray-400 text-sm text-right">{translations["Total Unpaid"]}</label>
                                            <input
                                                type="text"
                                                readOnly
                                                value={formData.currency}
                                                onChange={(e) => {
                                                    const value = e.target.value;
                                                    setFormData((prev) => ({ ...prev, currency: value }));
                                                    setIsDirty(true);
                                                }}
                                                className="w-[20%] px-3 py-2 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm text-center"
                                            />
                                            <input
                                                type="text"
                                                readOnly
                                                value={formData.total_unpaid}
                                                onChange={(e) => {
                                                    const value = Number(e.target.value);
                                                    setFormData((prev) => ({ ...prev, total_unpaid: value }));
                                                    setIsDirty(true);
                                                }}
                                                className="w-[45%] px-3 py-2 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm text-right"
                                            />
                                        </div>
                                    )}
                                    <div className="flex items-center space-x-4 mb-2">
                                        <label className="w-[35%] text-gray-400 text-sm text-right">{translations["Ex Rate Diff"]}</label>
                                        <input
                                            type="text"
                                            readOnly
                                            value={formData.currency}
                                            className="w-[20%] px-3 py-2 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm text-center"
                                        />
                                        <input
                                            type="text"
                                            readOnly
                                            value={formData.excess_amount}
                                            onChange={(e) => {
                                                const value = Number(e.target.value);
                                                setFormData((prev) => ({ ...prev, excess_amount: value }));
                                                setIsDirty(true);
                                            }}
                                            className="w-[45%] px-3 py-2 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm text-right"
                                        />
                                    </div>
                                </div>
                                <div className="col-span-12 md:col-span-2">
                                    <div className="flex items-center space-x-4 mb-2">
                                        <input
                                            type="text"
                                            readOnly
                                            value={baseCurrency()}
                                            className="w-[25%] px-3 py-2 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm text-center"
                                        />
                                        <input
                                            type="text"
                                            readOnly
                                            value={formData.base_total}
                                            onChange={(e) => {
                                                const value = Number(e.target.value);
                                                setFormData((prev) => ({ ...prev, base_total: value }));
                                                setIsDirty(true);
                                            }}
                                            className="w-[75%] px-3 py-2 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm text-right"
                                        />
                                    </div>
                                    <div className="flex items-center space-x-4 mb-2">
                                        <input
                                            type="text"
                                            readOnly
                                            value={baseCurrency()}
                                            className="w-[25%] px-3 py-2 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm text-center"
                                        />
                                        <input
                                            type="text"
                                            readOnly
                                            value={formData.base_amount_paid}
                                            onChange={(e) => {
                                                const value = Number(e.target.value);
                                                setFormData((prev) => ({ ...prev, base_amount_paid: value }));
                                                setIsDirty(true);
                                            }}
                                            className="w-[75%] px-3 py-2 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm text-right"
                                        />
                                    </div>
                                    <div className="flex items-center space-x-4 mb-2">
                                        <input
                                            type="text"
                                            readOnly
                                            value={baseCurrency()}
                                            className="w-[25%] px-3 py-2 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm text-center"
                                        />
                                        <input
                                            type="text"
                                            readOnly
                                            value={formData.base_excess_amount}
                                            onChange={(e) => {
                                                const value = Number(e.target.value);
                                                setFormData((prev) => ({ ...prev, base_excess_amount: value }));
                                                setIsDirty(true);
                                            }}
                                            className="w-[75%] px-3 py-2 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm text-right"
                                        />
                                    </div>
                                    {formData.total_unpaid > 0 && (
                                        <div className="flex items-center space-x-4 mb-2">
                                            <input
                                                type="text"
                                                readOnly
                                                value={baseCurrency()}
                                                className="w-[25%] px-3 py-2 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm text-center"
                                            />
                                            <input
                                                type="text"
                                                readOnly
                                                value={formData.base_total_unpaid}
                                                onChange={(e) => {
                                                    const value = Number(e.target.value);
                                                    setFormData((prev) => ({ ...prev, base_total_unpaid: value }));
                                                    setIsDirty(true);
                                                }}
                                                className="w-[75%] px-3 py-2 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm text-right"
                                            />
                                        </div>
                                    )}
                                </div>
                            </fieldset>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
    const renderChartsOfAccounts = () => {
        if (!showAccounts) return null;
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-[#19191c] rounded-xl border border-[#ffffff1a] w-[30vw] h-auto flex flex-col">
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-[#ffffff1a]">
                        <div className="flex items-center space-x-4">
                            <h2 className="text-xl font-bold text-white">{translations["Charts of Account List"]}</h2>
                        </div>
                        <div className="flex items-center space-x-4">
                            <button
                                onClick={() => {
                                    setShowAccounts(false);
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
                                        value={searchTermAccounts}
                                        onChange={(e) => {
                                            setSearchTermAccounts(e.target.value);
                                            setCurrentPageAccounts(1);
                                        }}
                                        className="pl-10 pr-4 py-2 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-sm"
                                        style={{ backgroundColor: "#2d2d30", borderColor: "#555555" }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="p-2 flex-1 overflow-auto">
                        <div className="max-h-[calc(100vh-435px)] overflow-y-auto">
                            <table className="w-full">
                                <thead className="sticky top-0 z-[1]" style={{ backgroundColor: "#1f2132" }}>
                                    <tr className="border-b" style={{ borderColor: "#2d2d30" }}>
                                        <th className="w-[30%] text-left py-2 px-2 text-gray-400 text-sm">{translations["Account Code"]}</th>
                                        <th className="w-[70%] text-left py-2 px-2 text-gray-400 text-sm">{translations["Description"]}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {chartsOfAccount.map((list, index) => (
                                        <tr
                                            key={list.id || index}
                                            onClick={(e) => handleRowClick_Accounts(e, list.id)}
                                            className={`clickable border-b hover:bg-gray-700 hover:bg-opacity-30 transition-colors`}
                                            style={{ borderColor: "#40404042" }}
                                        >
                                            <td className="py-2 px-2 text-gray-400 text-left text-custom-sm">
                                                <div className="group flex items-center">
                                                    <p className="text-gray-400 text-custom-sm">{highlightMatch(list.account_code, searchTermAccounts)}</p>
                                                    <CopyToClipboard text={list.account_code} />
                                                </div>
                                            </td>
                                            <td className="py-2 px-2 text-gray-400 text-left text-custom-sm">
                                                <div className="group flex items-center">
                                                    <p className="text-gray-400 text-custom-sm">{highlightMatch(lang === "en" ? list.account_name_en : list.account_name_cn, searchTermAccounts)}</p>
                                                    <CopyToClipboard text={lang === "en" ? list.account_name_en : list.account_name_cn} />
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    {/* Footer with Pagination */}
                    <div className="p-4 border-t flex items-center justify-between" style={{ borderColor: "#404040" }}>
                        <div className="flex items-center space-x-1">
                            <MemoizedPagination currentPage={currentPageAccounts} totalPages={totalPagesAccounts} onPageChange={(page) => setCurrentPageAccounts(page)} />
                            <MemoizedItemsPerPageSelector
                                value={itemsPerPageAccounts}
                                onChange={(val: number) => {
                                    setItemsPerPageAccounts(val);
                                    setCurrentPageAccounts(1);
                                }}
                                options={pageSizeOptions}
                            />
                        </div>
                        <div className="flex items-center space-x-1">
                            <button onClick={() => setShowAccounts(false)} className="px-2 py-2 bg-gray-700 hover:bg-gray-600 rounded text-white transition">
                                {translations["Close"]}
                            </button>
                        </div>
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
                            <h2 className="text-xl font-bold text-white">{translations["Search Customer"]}</h2>
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
                        <div className="max-h-[calc(100vh-435px)] overflow-y-auto">
                            <table className="w-full">
                                <thead className="sticky top-0 z-[1]" style={{ backgroundColor: "#1f2132" }}>
                                    <tr className="border-b" style={{ borderColor: "#2d2d30" }}>
                                        <th className=" text-left py-2 px-4 text-gray-400 text-sm">{translations["Customer Code"]}</th>
                                        <th className=" text-left py-2 px-4 text-gray-400 text-sm">{translations["Company"]}</th>
                                        <th className=" text-left py-2 px-4 text-gray-400 text-sm">{translations["Customer Name"]}</th>
                                        <th className=" text-left py-2 px-4 text-gray-400 text-sm">{translations["Email"]}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {customers.map((list, index) => (
                                        <tr
                                            key={list.id || index}
                                            onClick={(e) => handleRowClick_Customer(e, list.id)}
                                            className={`clickable border-b hover:bg-gray-700 hover:bg-opacity-30 transition-colors cursor-pointer`}
                                            style={{ borderColor: "#40404042" }}
                                        >
                                            <td className="py-3 px-4 text-gray-400 text-left text-custom-sm">{list.customer_code}</td>
                                            <td className="py-3 px-4 text-gray-400 text-left text-custom-sm">
                                                {lang === "en" ? list.company_en || translations["N.A."] : list.company_en || translations["N.A."]}
                                            </td>
                                            <td className="py-3 px-4 text-gray-400 text-left text-custom-sm">{lang === "en" ? list.account_name_en : list.account_name_cn}</td>
                                            <td className="py-3 px-4 text-gray-400 text-left text-custom-sm">{list.email_address || translations["N.A."]}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    {/* Footer with Pagination */}
                    <div className="p-4 border-t flex items-center justify-between" style={{ borderColor: "#404040" }}>
                        <div className="flex items-center space-x-1">
                            <MemoizedPagination currentPage={currentPageCustomer} totalPages={totalPagesCustomer} onPageChange={(page) => setCurrentPageCustomer(page)} />
                            <MemoizedItemsPerPageSelector
                                value={itemsPerPageSupplier}
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
    const renderCreditDetails = () => {
        if (!creditsPopup) return null;
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-[#19191c] rounded-xl border border-[#ffffff1a] w-[60vw] h-auto flex flex-col">
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-[#ffffff1a]">
                        <h2 className="text-xl font-bold text-white">{translations["Credits"]}</h2>
                    </div>
                    {/* Content */}
                    <div className="p-4">
                        <div className="col-span-12 md:col-span-12">
                            <table className="w-full border border-gray-600 border-collapse text-sm text-left">
                                <thead className="sticky top-0 z-[1] py-1 px-4" style={{ backgroundColor: "#1f2132" }}>
                                    <tr className="border-b" style={{ borderColor: "#2d2d30" }}>
                                        <th className="w-[15%] text-left py-2 px-2 text-gray-400 text-sm w-12 border border-[#40404042]">{translations["Invoice No"]}</th>
                                        <th className="w-[20%] text-left py-2 px-2 text-gray-400 text-sm w-12 border border-[#40404042]">{translations["Account Code"]}</th>
                                        <th className="w-[25%] text-left py-2 px-2 text-gray-400 text-sm w-12 border border-[#40404042]">{translations["Account Name"]}</th>
                                        <th className="w-[25%] text-left py-2 px-2 text-gray-400 text-sm w-12 border border-[#40404042]">{translations["Transaction Ref"]}</th>
                                        <th className="w-[15%] text-center py-2 px-2 text-gray-400 text-sm w-12 border border-[#40404042]">{translations["Balance To Pay"]}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {selectedForCredits.length === 0 ? (
                                        <tr className="border-b hover:bg-gray-700 hover:bg-opacity-30 transition-colors" style={{ borderColor: "#40404042" }}>
                                            <td colSpan={5} className="py-2 px-2 text-gray-400 text-center text-custom-sm border border-[#40404042]">
                                                {translations["No data available on table"]}
                                            </td>
                                        </tr>
                                    ) : (
                                        selectedForCredits.map((item) => (
                                            <tr key={item.account_code} className={`border-b hover:bg-gray-700 hover:bg-opacity-30 transition-colors`} style={{ borderColor: "#40404042" }}>
                                                <td className="py-2 px-2 text-gray-400 text-left text-custom-sm border border-[#40404042]">{item.invoice_no}</td>
                                                <td className="py-2 px-2 text-gray-400 text-left text-custom-sm border border-[#40404042]">{item.account_code}</td>
                                                <td className="py-2 px-2 text-gray-400 text-left text-custom-sm border border-[#40404042]">
                                                    {lang === "en" ? item.account_name_en : item.account_name_cn}
                                                </td>
                                                <td className="py-2 px-2 text-gray-400 text-left text-custom-sm border border-[#40404042]">{item.ref_data}</td>
                                                <td className="py-0 px-0 text-gray-400 text-center text-custom-sm border border-[#40404042]">
                                                    <input
                                                        type="number"
                                                        value={item.new_amount}
                                                        placeholder="0"
                                                        onChange={(e) => {
                                                            const value = e.target.value;
                                                            setSelectedCredits((prev) =>
                                                                prev.map((list) => {
                                                                    if (list.account_code === item.account_code) {
                                                                        return {
                                                                            ...list,
                                                                            new_amount: value,
                                                                        };
                                                                    }
                                                                    return list; // <-- This was missing
                                                                })
                                                            );
                                                        }}
                                                        className="w-full px-3 py-1.5 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-sm rounded text-center"
                                                    />
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    {/* Footer */}
                    <div className="p-2 border-t border-[#ffffff1a] flex justify-end space-x-2">
                        <button
                            onClick={() => setShowCreditsPopup(false)}
                            className="px-2 py-2 bg-gray-700 hover:bg-gray-600 rounded text-white transition focus:outline-none focus:ring-2 focus:ring-cyan-500"
                        >
                            {translations["Close"]}
                        </button>
                        <button
                            onClick={handleSubmitCredit}
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
    if (!masterList) {
        return (
            <div className="min-h-screen" style={{ backgroundColor: "#1a1a1a" }}>
                <div className="flex items-center justify-center h-64">
                    <div className="text-[#ffffffcc] text-custom-sm">{translations["Processing2"]}...</div>
                </div>
            </div>
        );
    }
    return (
        <div className="h-screen flex flex-col" style={{ backgroundColor: "#1a1a1a" }}>
            {/* Fixed Header */}
            <div className="border-b flex-shrink-0" style={{ backgroundColor: "#19191c", borderColor: "#ffffff1a" }}>
                <div className="flex items-center justify-between px-2 py-3">
                    <div className="flex items-center space-x-1">
                        {/* Tabs */}
                        <div className="flex space-x-1">
                            <button
                                onClick={() => {
                                    if (isDirty) {
                                        setShowUnsavedChanges(true);
                                    } else {
                                        onBack();
                                    }
                                }}
                                style={{ backgroundColor: "#2b2e31" }}
                                className="px-2 py-2 rounded-lg text-sm font-medium transition-colors text-gray-300 hover:bg-gray-700"
                            >
                                <ArrowLeft className="h-5 w-5 text-[#ffffffcc] text-custom-sm" />
                            </button>
                            {tabs.map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`px-2 py-2 rounded-lg text-sm font-medium transition-colors ${
                                        activeTab === tab.id ? "bg-cyan-600 text-[#ffffffcc] text-custom-sm" : "text-gray-300 hover:bg-gray-700"
                                    }`}
                                    style={activeTab !== tab.id ? { backgroundColor: "#2b2e31" } : {}}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    </div>
                    {/* Action Buttons */}
                    <div className="flex items-center space-x-1">
                        <button
                            onClick={handleSave}
                            className={`px-2 py-2 text-custom-sm rounded-lg text-sm font-medium transition-colors 
                            ${loadingSave ? "bg-gray-500 cursor-not-allowed opacity-50" : "bg-cyan-600 hover:bg-cyan-700"} 
                            text-[#ffffffcc] flex justify-center items-center`}
                            disabled={loadingSave || masterList?.rv_status_id === 5}
                        >
                            <span>{receiveVoucherId === 0 ? translations["Save"] : translations['Update']}</span>
                        </button>
                        <button
                            onClick={() => {
                                exportRef.current?.triggerExport();
                            }}
                            disabled={receiveVoucherId === 0}
                            className="px-2 py-2 bg-cyan-600 hover:bg-cyan-700 text-[#ffffffcc] text-custom-sm rounded-lg text-sm font-medium transition-colors"
                        >
                            {translations["Print"]}
                        </button>
                        <button onClick={handleAddNew} className="px-2 py-2 bg-cyan-600 hover:bg-cyan-700 text-[#ffffffcc] text-custom-sm rounded-lg text-sm font-medium transition-colors">
                            {translations["Add New"]}
                        </button>

                        <button
                            onClick={handleVoid}
                            disabled={receiveVoucherId === 0 || masterList?.rv_status_id === 5}
                            className="px-2 py-2 bg-red-600 hover:bg-red-700 text-[#ffffffcc] text-custom-sm rounded-lg text-sm font-medium transition-colors"
                        >
                            {translations["Void"]}
                        </button>
                    </div>
                </div>
            </div>
            {/* Main Content - Scrollable */}
            <div className="flex flex-1 p-2 mb-[10px]" style={{ backgroundColor: "#19191c" }}>
                {/* Main Content Area - Scrollable */}
                <div className="flex-1">{renderDetails()}</div>
            </div>
            <div className="hidden">
                <ExportReportSelector ref={exportRef} formats={["odt"]} baseName="RVoucher_Report" ids={[receiveVoucherId]} language={lang} />
            </div>
            {renderChartsOfAccounts()}
            {renderCustomerList()}
            {renderCreditDetails()}
            {/* Unsaved Changes Modal */}
            {showUnsavedChanges && (
                <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
                    <div className="bg-[#19191c] rounded-xl border border-[#ffffff1a] p-6">
                        <h2 className="text-xl font-bold text-white mb-4">{translations["Unsaved Changes"] || "Unsaved Changes"}</h2>
                        <p className="text-gray-400 mb-6">{translations["You have unsaved changes. What would you like to do?"] || "You have unsaved changes. What would you like to do?"}</p>
                        <div className="flex justify-end space-x-4">
                            <button onClick={() => setShowUnsavedChanges(false)} className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg">
                                {translations["Cancel"]}
                            </button>
                            <button
                                onClick={() => {
                                    setShowUnsavedChanges(false);
                                    onBack();
                                }}
                                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg"
                            >
                                {translations["Dont Save"]}
                            </button>
                            <button
                                onClick={() => {
                                    handleSave();
                                    setShowUnsavedChanges(false);
                                    onBack();
                                }}
                                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg"
                            >
                                {translations["Save"]}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ReceiveVoucherDetails;
