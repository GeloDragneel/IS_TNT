import React, { useState, useEffect, useMemo, useRef } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { showConfirm } from "@/utils/alert";
import { formatDateToCustom } from "@/utils/flatpickrLocale";
import { showSuccessToast, showErrorToast } from "@/utils/toast";
import { highlightMatch } from "@/utils/highlightMatch";
import Select from "react-select";
import dayjs from "dayjs";
import CustomCheckbox from "@/components/CustomCheckbox";
import { ArrowLeft, X, Plus, Minus, Calendar } from "lucide-react";
import Pagination from "@/components/Pagination";
import ItemsPerPageSelector from "@/components/ItemsPerPageSelector";
import CopyToClipboard from "@/components/CopyToClipboard";
import PusherEcho from "@/utils/echo";
import { ApiSupplier, supplierService, DetailsExpanded, ApiSupplierFooter } from "@/services/supplierService";
import { ExportReportSelector } from "@/utils/ExportReportSelector";
import { fetchCourier, fetchTaxGroup, fetchShippingTerms, fetchPaymentTerms, fetchCountries, fetchStates, fetchCurrencies, convertToSingleOption, OptionType } from "@/utils/fetchDropdownData";
import { formatMoney, selectStyles, baseCurrency, formatDate, isValidOption, DropdownData } from "@/utils/globalFunction";
// localStorage.clear();

const MemoizedPagination = React.memo(Pagination);
const MemoizedItemsPerPageSelector = React.memo(ItemsPerPageSelector);

interface SupplierDetailsProps {
    supplierId: number;
    saveType: string; // or a more specific union type like 'new' | 'edit'
    onBack: () => void;
    onSave: () => void;
    onChangeSupplierId: (newId: number) => void;
    onChangeSaveType: (type: string) => void;
    tabId: string;
    copySettings?: any;
}

const defaultCustomer: ApiSupplier = {
    id: 0,
    customer_code: "",
    account_name_en: "",
    account_name_cn: "",
    company_en: "",
    company_cn: "",
    email_address: "",
    status: 0,
    is_subscribe: 0,
    sales_person_name: "",
    country_en: "",
    country_cn: "",
    language: "",
    groups: [],
};

const SupplierDetails: React.FC<SupplierDetailsProps> = ({ supplierId, saveType, onBack, onSave, onChangeSupplierId, onChangeSaveType, tabId, copySettings }) => {
    const { translations, lang } = useLanguage();
    const [customer, setCustomer] = useState<ApiSupplier | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState("information");
    const [showCopySupplier, setShowCopySupplier] = useState(false);
    const [isDirty, setIsDirty] = useState(false);
    const isDirtyRef = useRef(isDirty);
    const [showUnsavedChanges, setShowUnsavedChanges] = useState(false);
    const [isInitialized, setIsInitialized] = useState(false);
    const initialFormData = React.useRef<any>(null);
    const pageSizeOptions = useMemo(() => [10, 20, 50, -1], []);
    const [loadingSave, setLoadingSave] = useState(false);

    const [copiedsupplierId, setCopiedsupplierId] = useState<number | null>(null);

    // Raw data from API (language-independent)

    const [courierData, setCourierData] = useState<DropdownData[]>([]);
    const [currenciesData, setCurrenciesData] = useState<DropdownData[]>([]);
    const [taxGroupData, setTaxGroupData] = useState<DropdownData[]>([]);
    const [shippingTermsData, setShippingTermsData] = useState<DropdownData[]>([]);
    const [paymentTermsData, setPaymentTermsData] = useState<DropdownData[]>([]);
    const [countriesData, setCountriesData] = useState<DropdownData[]>([]);
    const [statesData, setStatesData] = useState<DropdownData[]>([]);

    // Add wholesale pricing state
    const [supplierInvoices, setSupplierInvoices] = useState<ApiSupplier[]>([]);
    const [supplierPrepaid, setSupplierPrepaid] = useState<ApiSupplier[]>([]);
    const [supplierProfitability, setSupplierProfitability] = useState<ApiSupplier[]>([]);
    const [supplierReceivedItems, setSupplierReceivedItems] = useState<ApiSupplier[]>([]);
    const [supplierItemsOnPO, setSupplierItemsOnPO] = useState<ApiSupplier[]>([]);
    const [supplierTransInfo, setSupplierTransInfo] = useState<ApiSupplier[]>([]);
    const [supplierAccountsPayable, setSupplierAccountsPayable] = useState<ApiSupplier[]>([]);
    const [supplierCredit, setSupplierCredit] = useState<ApiSupplier[]>([]);

    const [supplierProfitabilityFooter, setSupplierProfitabilityFooter] = useState<ApiSupplierFooter | null>(null);

    const [totalPages_Invoices, settotalPages_Invoices] = useState(1);
    const [totalPages_Prepaid, setTotalPages_Prepaid] = useState(1);
    const [totalPages_SalesOrder, settotalPages_ItemsOnPO] = useState(1);
    const [totalPages_Deposit, setTotalPages_ReceivedItems] = useState(1);
    const [totalPages_ItemsOnPO, setTotalPages_ItemsOnPO] = useState(1);
    const [totalPages_TransInfo, setTotalPages_TransInfo] = useState(1);
    const [totalPages_Credit, setTotalPages_Credit] = useState(1);
    const [totalPages_AccountsPayable, setTotalPages_AccountsPayable] = useState(1);

    const [selectedSupplierInvoices, setSelectedSupplierInvoices] = useState<number[]>([]);
    const [selectedSupplierPrepaid, setSelectedSupplierPrepaid] = useState<number[]>([]);
    const [selectedSupplierProfitability, setSelectedSupplierProfitability] = useState<number[]>([]);

    const supplierInfoKey = `${supplierId}-cached-supplier-info`;
    const supplierInvoicesKey = `${supplierId}-cached-supplier-invoices`;
    const supplierPrepaidKey = `${supplierId}-cached-supplier-prepaid`;
    const supplierProfitKey = `${supplierId}-cached-supplier-profit`;
    const supplierReceiveItemsKey = `${supplierId}-cached-supplier-receiveItems`;
    const supplierItemsOnPOKey = `${supplierId}-cached-supplier-itemsOnPO`;
    const supplierTransInfoKey = `${supplierId}-cached-supplier-transInfo`;
    const supplierAccountsPayableKey = `${supplierId}-cached-supplier-accountsPayable`;
    const supplierRefundKey = `${supplierId}-cached-supplier-refund`;
    const safeLang = lang === "cn" ? "cn" : "en";

    const [expanded_Invoices, setExpandedRows_Invoices] = useState<number[]>([]);
    const [expanded_Prepaid, setExpandedRows_Prepaid] = useState<number[]>([]);
    const [expanded_ItemsOnPO, setExpandedRows_ItemsOnPO] = useState<number[]>([]);
    const [expanded_Payable, setExpandedRows_Payable] = useState<number[]>([]);
    const [expanded_Credits, setExpandedRows_Credits] = useState<number[]>([]);

    const [invoicesDetailsMap, setInvoicesDetailsMap] = useState<Record<number, DetailsExpanded[] | null>>({});
    const [prepaidDetailsMap, setPrepaidDetailsMap] = useState<Record<number, DetailsExpanded[] | null>>({});
    const [receivedItemsDetailsMap, setItemsOnPODetailsMap] = useState<Record<number, DetailsExpanded[] | null>>({});
    const [payableDetailsMap, setPayableDetailsMap] = useState<Record<number, DetailsExpanded[] | null>>({});
    const [creditDetailsMap, setCreditDetailsMap] = useState<Record<number, DetailsExpanded[] | null>>({});

    const [currentPage_Invoices, setCurrentPage_Invoices] = useState(() => {
        const cachedMeta = localStorage.getItem(supplierInvoicesKey);
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
    const [currentPage_Prepaid, setCurrentPage_Prepaid] = useState(() => {
        const cachedMeta = localStorage.getItem(supplierPrepaidKey);
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
    const [currentPage_SalesOrder, setCurrentPage_Profitability] = useState(() => {
        const cachedMeta = localStorage.getItem(supplierProfitKey);
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
    const [currentPage_Deposit, setCurrentPage_ReceivedItems] = useState(() => {
        const cachedMeta = localStorage.getItem(supplierReceiveItemsKey);
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
    const [currentPage_ItemsOnPO, setCurrentPage_ItemsOnPO] = useState(() => {
        const cachedMeta = localStorage.getItem(supplierItemsOnPOKey);
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
    const [currentPage_TransInfo, setCurrentPage_TransInfo] = useState(() => {
        const cachedMeta = localStorage.getItem(supplierTransInfoKey);
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
    const [currentPage_Credit, setCurrentPage_Credit] = useState(() => {
        const cachedMeta = localStorage.getItem(supplierAccountsPayableKey);
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
    const [currentPage_Payable, setcurrentPage_Payable] = useState(() => {
        const cachedMeta = localStorage.getItem(supplierRefundKey);
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

    const [itemsPerPage_Invoices, setitemsPerPage_Invoices] = useState(() => {
        const cachedMeta = localStorage.getItem(supplierInvoicesKey);
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
    const [itemsPerPage_Prepaid, setitemsPerPage_Prepaid] = useState(() => {
        const cachedMeta = localStorage.getItem(supplierPrepaidKey);
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
    const [itemsPerPage_SalesOrder, setItemsPerPage_SalesOrder] = useState(() => {
        const cachedMeta = localStorage.getItem(supplierProfitKey);
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
    const [itemsPerPage_Deposit, setItemsPerPage_Deposit] = useState(() => {
        const cachedMeta = localStorage.getItem(supplierReceiveItemsKey);
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
    const [itemsPerPage_ItemsOnPO, setItemsPerPage_ItemsOnPO] = useState(() => {
        const cachedMeta = localStorage.getItem(supplierItemsOnPOKey);
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
    const [itemsPerPage_TransInfo, setitemsPerPage_TransInfo] = useState(() => {
        const cachedMeta = localStorage.getItem(supplierTransInfoKey);
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
    const [itemsPerPage_Credit, setItemsPerPage_Credit] = useState(() => {
        const cachedMeta = localStorage.getItem(supplierAccountsPayableKey);
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
    const [itemsPerPage_AccountsPayable, setItemsPerPage_AccountsPayable] = useState(() => {
        const cachedMeta = localStorage.getItem(supplierRefundKey);
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

    const [searchTerm_Invoices, setSearchTerm_Invoices] = useState(() => {
        const cached = localStorage.getItem(supplierInvoicesKey);
        if (!cached) return "";
        try {
            const meta = JSON.parse(cached);
            return meta.search || "";
        } catch {
            return "";
        }
    });
    const [searchTerm_Prepaid, setsearchTerm_Prepaid] = useState(() => {
        const cached = localStorage.getItem(supplierPrepaidKey);
        if (!cached) return "";
        try {
            const meta = JSON.parse(cached);
            return meta.search || "";
        } catch {
            return "";
        }
    });
    const [searchTerm_Profitability, setSearchTerm_Profitability] = useState(() => {
        const cached = localStorage.getItem(supplierProfitKey);
        if (!cached) return "";
        try {
            const meta = JSON.parse(cached);
            return meta.search || "";
        } catch {
            return "";
        }
    });
    const [searchTerm_ReceivedItems, setSearchTerm_ReceivedItems] = useState(() => {
        const cached = localStorage.getItem(supplierReceiveItemsKey);
        if (!cached) return "";
        try {
            const meta = JSON.parse(cached);
            return meta.search || "";
        } catch {
            return "";
        }
    });
    const [searchTerm_ItemsOnPO, setSearchTerm_ItemsOnPO] = useState(() => {
        const cached = localStorage.getItem(supplierItemsOnPOKey);
        if (!cached) return "";
        try {
            const meta = JSON.parse(cached);
            return meta.search || "";
        } catch {
            return "";
        }
    });
    const [searchTerm_TransInfo, setSearchTerm_TransInfo] = useState(() => {
        const cached = localStorage.getItem(supplierTransInfoKey);
        if (!cached) return "";
        try {
            const meta = JSON.parse(cached);
            return meta.search || "";
        } catch {
            return "";
        }
    });
    const [searchTerm_Payable, setSearchTerm_Payable] = useState(() => {
        const cached = localStorage.getItem(supplierAccountsPayableKey);
        if (!cached) return "";
        try {
            const meta = JSON.parse(cached);
            return meta.search || "";
        } catch {
            return "";
        }
    });
    const [searchTerm_Credit, setSearchTerm_Credit] = useState(() => {
        const cached = localStorage.getItem(supplierAccountsPayableKey);
        if (!cached) return "";
        try {
            const meta = JSON.parse(cached);
            return meta.search || "";
        } catch {
            return "";
        }
    });
    const [fields, setFields] = useState<Record<string, boolean>>({});
    const [selectAll, setSelectAll] = useState({
        supplierInfo: false,
    });

    const handleFieldToggle = (field: string) => () => {
        setFields((prev) => ({ ...prev, [field]: !prev[field] }));
    };
    const handleSelectAllGroup = (group: string) => () => {
        const groupFields: Record<string, string[]> = {
            supplierInfo: ["Currency", "Payment Terms", "Shipping Terms", "Delivery Method", "Bank Information"],
        };
        const allChecked = groupFields[group].every((f) => fields[f]);
        const updatedFields = { ...fields };

        groupFields[group].forEach((f) => {
            updatedFields[f] = !allChecked;
        });

        setFields(updatedFields);
        setSelectAll((prev) => ({ ...prev, [group]: !allChecked }));
    };

    const currencyOptions: OptionType[] = useMemo(
        () =>
            currenciesData.map((currency) => ({
                value: currency.value.toString(),
                value2: currency.value.toString(),
                label: lang === "en" ? currency.en : currency.cn,
                en: currency.en,
                cn: currency.cn,
            })),
        [currenciesData, lang]
    );
    const courierOption: OptionType[] = useMemo(
        () =>
            courierData.map((list) => ({
                value: list.value.toString(),
                value2: list.value.toString(),
                label: lang === "en" ? list.en : list.cn,
                en: list.en,
                cn: list.cn,
            })),
        [courierData, lang]
    );

    const taxGroupOption: OptionType[] = useMemo(
        () =>
            taxGroupData.map((list) => ({
                value: list.value.toString(),
                value2: list.value.toString(),
                label: lang === "en" ? list.en : list.cn,
                en: list.en,
                cn: list.cn,
            })),
        [taxGroupData, lang]
    );

    const shippingTermsOption: OptionType[] = useMemo(
        () =>
            shippingTermsData.map((list) => ({
                value: list.value.toString(),
                value2: list.value.toString(),
                label: lang === "en" ? list.en : list.cn,
                en: list.en,
                cn: list.cn,
            })),
        [shippingTermsData, lang]
    );

    const paymentTermsOption: OptionType[] = useMemo(
        () =>
            paymentTermsData.map((list) => ({
                value: list.value.toString(),
                value2: list.value.toString(),
                label: lang === "en" ? list.en : list.cn,
                en: list.en,
                cn: list.cn,
            })),
        [paymentTermsData, lang]
    );

    const countriesOption: OptionType[] = useMemo(
        () =>
            countriesData.map((list) => ({
                value: list.value.toString(),
                value2: list.value.toString(),
                label: lang === "en" ? list.en : list.cn,
                en: list.en,
                cn: list.cn,
            })),
        [countriesData, lang]
    );

    const statesOption: OptionType[] = useMemo(
        () =>
            statesData.map((list) => ({
                value: list.value.toString(),
                value2: list.value.toString(),
                label: lang === "en" ? list.en : list.cn,
                en: list.en,
                cn: list.cn,
            })),
        [statesData, lang]
    );

    // Form state - Updated to handle single vs multi-select properly
    const [formData, setFormData] = useState({
        supplier_code: "",
        old_supplier_code: "",
        copy_supplier_code: "",
        suppliername_en: "",
        suppliername_cn: "",
        contact_person_en: "",
        contact_person_cn: "",
        supplier_address_en: "",
        supplier_address_cn: "",
        contact_number: "",
        country: null as OptionType | null,
        country_state: null as OptionType | null,
        postal_code: "",
        fax: "",
        email: "",
        bank_name_en: "",
        bank_name_cn: "",
        bank_account_name_en: "",
        bank_account_name_cn: "",
        bank_account_no: "",
        bank_address_en: "",
        bank_address_cn: "",
        bank_country: null as OptionType | null,
        bank_country_state: null as OptionType | null,
        bank_tel_no: "",
        bank_swift_code: "",
        bank_postal_code_2: "",
        currency: null as OptionType | null,
        iban: "",
        tax: null as OptionType | null,
        payment_terms_id: null as OptionType | null,
        shipping_terms_id: null as OptionType | null,
        delivery_method_id: null as OptionType | null,
        is_copy_supplierInfo: false,
        is_new_supplier_id: 0,
        is_copy_data: false,
    });

    const handleSelectSuppInvoices = (id: number, checked: boolean) => {
        if (checked) {
            setSelectedSupplierInvoices((prev) => [...prev, id]);
        } else {
            setSelectedSupplierInvoices((prev) => prev.filter((pid) => pid !== id));
        }
    };
    const handleSelectSuppPrepaid = (id: number, checked: boolean) => {
        if (checked) {
            setSelectedSupplierPrepaid((prev) => [...prev, id]);
        } else {
            setSelectedSupplierPrepaid((prev) => prev.filter((pid) => pid !== id));
        }
    };
    const handleSelectSuppProfitability = (id: number, checked: boolean) => {
        if (checked) {
            setSelectedSupplierProfitability((prev) => [...prev, id]);
        } else {
            setSelectedSupplierProfitability((prev) => prev.filter((pid) => pid !== id));
        }
    };

    const handleSelectedAllSuppInvoices = (checked: boolean) => {
        if (checked) {
            const allIds = supplierInvoices.map((p) => p.id);
            setSelectedSupplierInvoices(allIds);
        } else {
            setSelectedSupplierInvoices([]);
        }
    };
    const handleSelectedAllSuppPrepaid = (checked: boolean) => {
        if (checked) {
            const allIds = supplierPrepaid.map((p) => p.id);
            setSelectedSupplierPrepaid(allIds);
        } else {
            setSelectedSupplierPrepaid([]);
        }
    };
    const handleSelectedAllSuppProfitability = (checked: boolean) => {
        if (checked) {
            const allIds = supplierProfitability.map((p) => p.id);
            setSelectedSupplierProfitability(allIds);
        } else {
            setSelectedSupplierProfitability([]);
        }
    };
    // REALTIME
    useEffect(() => {
        const channel = PusherEcho.channel("supplier-channel");
        const handleProductEvent = () => {
            // Remove cached orders when a product event occurs
        };

        // Listen for product events and trigger reload
        channel.listen(".supplier-event", handleProductEvent);

        // Cleanup on component unmount or dependency change
        return () => {
            PusherEcho.leave("supplier-channel");
            channel.stopListening(".supplier-event", handleProductEvent);
        };
    }, [supplierId, currentPage_Invoices, itemsPerPage_Invoices, searchTerm_Invoices, tabId]);

    // Keep ref updated
    useEffect(() => {
        isDirtyRef.current = isDirty;
    }, [isDirty]);

    useEffect(() => {
        const fetchAllCustomerData = () => {
            fetchSupplierDetails();
            fetchInvoices();
            fetchPrepaid();
            fetchProfitability();
            fetchReceiveItems();
            fetchItemsOnPO();
            fetchTransInfo();
            fetchSupplierCredit();
            fetchAccountsPayable();
        };

        const fetchDropdownData = () => {
            loadCurrency();
            loadCourier();
            loadTaxGroup();
            loadShippingTerms();
            loadPaymentTerms();
            loadCountries();
            loadState();
        };

        fetchDropdownData();

        if (saveType === "new") {
            setLoading(true);
            clearForms();
            setCustomer(defaultCustomer);
            setSupplierInvoices([]);
            setSupplierPrepaid([]);
            setSupplierProfitability([]);
            setSupplierReceivedItems([]);
            setSupplierItemsOnPO([]);
            setSupplierTransInfo([]);
            setSupplierCredit([]);
            setSupplierAccountsPayable([]);
            setIsDirty(false);
            isDirtyRef.current = false;
            setIsInitialized(false);
            setLoading(false);
        } else {
            fetchAllCustomerData();
        }
    }, [supplierId, saveType]);

    useEffect(() => {
        // This effect handles the copy operation when initiated from the CustomerList view.
        if (saveType === "copy" && copySettings && customer) {
            const { newSupplierCode, fields, selectAll, rawArray } = copySettings;
            processCopy(newSupplierCode, fields, selectAll, rawArray);
        }
    }, [copySettings, customer, saveType]);

    useEffect(() => {
        // Don't run if customer data isn't there yet.
        if (!customer) return;

        if (!isInitialized) {
            // A more robust check to see if the form is fully initialized
            const isFormReady =
                (customer.country ? !!formData.country : true) &&
                (customer.country_state ? !!formData.country_state : true) &&
                (customer.bank_country ? !!formData.bank_country : true) &&
                (customer.bank_country_state ? !!formData.bank_country_state : true) &&
                (customer.currency ? !!formData.currency : true) &&
                (customer.payment_terms_id ? !!formData.payment_terms_id : true) &&
                (customer.shipping_terms_id ? !!formData.shipping_terms_id : true) &&
                (customer.delivery_method_id ? !!formData.delivery_method_id : true);
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
                setIsDirty(true);
            } else {
                setIsDirty(false);
            }
        }
    }, [customer, formData, isInitialized]);

    useEffect(() => {
        if (customer && currencyOptions.length > 0) {
            const selectedCurrency = convertToSingleOption(customer.currency, currencyOptions);
            setFormData((prev) => ({ ...prev, currency: selectedCurrency }));
        }
    }, [customer, currencyOptions, lang]);

    useEffect(() => {
        if (customer && courierOption.length > 0) {
            const selectedOption = convertToSingleOption(customer.delivery_method_id, courierOption);
            setFormData((prev) => ({ ...prev, delivery_method_id: selectedOption }));
        }
    }, [customer, courierOption, lang]);

    useEffect(() => {
        if (customer && taxGroupOption.length > 0) {
            const selectedOption = convertToSingleOption(customer.tax, taxGroupOption);
            setFormData((prev) => ({ ...prev, tax: selectedOption }));
        }
    }, [customer, taxGroupOption, lang]);

    useEffect(() => {
        if (customer && shippingTermsOption.length > 0) {
            const selectedOption = convertToSingleOption(customer.shipping_terms_id, shippingTermsOption);
            setFormData((prev) => ({ ...prev, shipping_terms_id: selectedOption }));
        }
    }, [customer, shippingTermsOption, lang]);

    useEffect(() => {
        if (customer && paymentTermsOption.length > 0) {
            const selectedOption = convertToSingleOption(customer.payment_terms_id, paymentTermsOption);
            setFormData((prev) => ({ ...prev, payment_terms_id: selectedOption }));
        }
    }, [customer, paymentTermsOption, lang]);

    useEffect(() => {
        if (customer && countriesOption.length > 0) {
            const selectedOption = convertToSingleOption(customer.country, countriesOption);
            setFormData((prev) => ({ ...prev, country: selectedOption }));

            const selectedOption2 = convertToSingleOption(customer.bank_country, countriesOption);
            setFormData((prev) => ({ ...prev, bank_country: selectedOption2 }));
        }
    }, [customer, countriesOption, lang]);

    useEffect(() => {
        if (customer && statesOption.length > 0) {
            const selectedOption = convertToSingleOption(customer.country_state, statesOption);
            setFormData((prev) => ({ ...prev, country_state: selectedOption }));

            const selectedOption2 = convertToSingleOption(customer.bank_country_state, statesOption);
            setFormData((prev) => ({ ...prev, bank_country_state: selectedOption2 }));
        }
    }, [customer, statesOption, lang]);

    useEffect(() => {
        setFormData((prev) => ({
            ...prev,
            is_copy_supplierInfo: formData.is_copy_supplierInfo,
            is_copy_data: formData.is_copy_data,
            is_new_supplier_id: formData.is_new_supplier_id,
        }));
    }, [formData.is_copy_supplierInfo, formData.is_new_supplier_id, formData.is_copy_data]);

    useEffect(() => {
        const customerKey = `${supplierId}-cached-suppliers-invoices`;
        const metaKey = `${supplierId}-cached-meta-supplier-invoices`;

        const cachedSuppliersRaw = localStorage.getItem(customerKey);
        const cachedMetaRaw = localStorage.getItem(metaKey);

        if (!cachedSuppliersRaw || !cachedMetaRaw) {
            fetchInvoices(currentPage_Invoices, itemsPerPage_Invoices, searchTerm_Invoices);
            return;
        }

        try {
            const cachedMeta = JSON.parse(cachedMetaRaw);
            const cachedCustomers = JSON.parse(cachedSuppliersRaw);

            const isCacheValid = cachedMeta.page === currentPage_Invoices && cachedMeta.perPage === itemsPerPage_Invoices && cachedMeta.search === searchTerm_Invoices;

            if (isCacheValid) {
                setSupplierInvoices(cachedCustomers);
                settotalPages_Invoices(cachedMeta.totalPages);
                return;
            }
        } catch (err) {
            console.warn("Failed to parse cached meta:", err);
        }

        fetchInvoices(currentPage_Invoices, itemsPerPage_Invoices, searchTerm_Invoices);
    }, [currentPage_Invoices, itemsPerPage_Invoices, searchTerm_Invoices, supplierId]);

    useEffect(() => {
        const customerKey = `${supplierId}-cached-suppliers-prepaid`;
        const metaKey = `${supplierId}-cached-meta-supplier-prepaid`;

        const cachedSuppliersRaw = localStorage.getItem(customerKey);
        const cachedMetaRaw = localStorage.getItem(metaKey);

        if (!cachedSuppliersRaw || !cachedMetaRaw) {
            fetchPrepaid(currentPage_Prepaid, itemsPerPage_Prepaid, searchTerm_Prepaid);
            return;
        }

        try {
            const cachedMeta = JSON.parse(cachedMetaRaw);
            const cachedCustomers = JSON.parse(cachedSuppliersRaw);

            const isCacheValid = cachedMeta.page === currentPage_Prepaid && cachedMeta.perPage === itemsPerPage_Prepaid && cachedMeta.search === searchTerm_Prepaid;

            if (isCacheValid) {
                setSupplierPrepaid(cachedCustomers);
                setTotalPages_Prepaid(cachedMeta.totalPages);
                return;
            }
        } catch (err) {
            console.warn("Failed to parse cached meta:", err);
        }

        fetchPrepaid(currentPage_Prepaid, itemsPerPage_Prepaid, searchTerm_Prepaid);
    }, [currentPage_Prepaid, itemsPerPage_Prepaid, searchTerm_Prepaid, supplierId]);

    useEffect(() => {
        const customerKey = supplierProfitKey;
        const metaKey = `${supplierId}-cached-meta-customer-profitability`;

        const cachedSuppliersRaw = localStorage.getItem(customerKey);
        const cachedMetaRaw = localStorage.getItem(metaKey);

        if (!cachedSuppliersRaw || !cachedMetaRaw) {
            fetchProfitability(currentPage_SalesOrder, itemsPerPage_SalesOrder, searchTerm_Profitability);
            return;
        }

        try {
            const cachedMeta = JSON.parse(cachedMetaRaw);
            const cachedCustomers = JSON.parse(cachedSuppliersRaw);

            const isCacheValid = cachedMeta.page === currentPage_SalesOrder && cachedMeta.perPage === itemsPerPage_SalesOrder && cachedMeta.search === searchTerm_Profitability;

            if (isCacheValid) {
                setSupplierProfitability(cachedCustomers);
                settotalPages_ItemsOnPO(cachedMeta.totalPages);
                return;
            }
        } catch (err) {
            console.warn("Failed to parse cached meta:", err);
        }

        fetchProfitability(currentPage_SalesOrder, itemsPerPage_SalesOrder, searchTerm_Profitability);
    }, [currentPage_SalesOrder, itemsPerPage_SalesOrder, searchTerm_Profitability, supplierId]);

    useEffect(() => {
        const customerKey = `${supplierId}-cached-suppliers-receivedItems`;
        const metaKey = `${supplierId}-cached-meta-customer-receivedItems`;

        const cachedSuppliersRaw = localStorage.getItem(customerKey);
        const cachedMetaRaw = localStorage.getItem(metaKey);

        if (!cachedSuppliersRaw || !cachedMetaRaw) {
            fetchReceiveItems(currentPage_Deposit, itemsPerPage_Deposit, searchTerm_ReceivedItems);
            return;
        }

        try {
            const cachedMeta = JSON.parse(cachedMetaRaw);
            const cachedCustomers = JSON.parse(cachedSuppliersRaw);

            const isCacheValid = cachedMeta.page === currentPage_Deposit && cachedMeta.perPage === itemsPerPage_Deposit && cachedMeta.search === searchTerm_ReceivedItems;

            if (isCacheValid) {
                setSupplierReceivedItems(cachedCustomers);
                setTotalPages_ReceivedItems(cachedMeta.totalPages);
                return;
            }
        } catch (err) {
            console.warn("Failed to parse cached meta:", err);
        }
        fetchReceiveItems(currentPage_Deposit, itemsPerPage_Deposit, searchTerm_ReceivedItems);
    }, [currentPage_Deposit, itemsPerPage_Deposit, searchTerm_ReceivedItems, supplierId]);

    useEffect(() => {
        const customerKey = `${supplierId}-cached-suppliers-itemsOnPO`;
        const metaKey = `${supplierId}-cached-meta-customer-itemsOnPO`;

        const cachedSuppliersRaw = localStorage.getItem(customerKey);
        const cachedMetaRaw = localStorage.getItem(metaKey);

        if (!cachedSuppliersRaw || !cachedMetaRaw) {
            fetchItemsOnPO(currentPage_ItemsOnPO, itemsPerPage_ItemsOnPO, searchTerm_ItemsOnPO);
            return;
        }

        try {
            const cachedMeta = JSON.parse(cachedMetaRaw);
            const cachedCustomers = JSON.parse(cachedSuppliersRaw);

            const isCacheValid = cachedMeta.page === currentPage_ItemsOnPO && cachedMeta.perPage === itemsPerPage_ItemsOnPO && cachedMeta.search === searchTerm_ItemsOnPO;

            if (isCacheValid) {
                setSupplierItemsOnPO(cachedCustomers);
                setTotalPages_ItemsOnPO(cachedMeta.totalPages);
                return;
            }
        } catch (err) {
            console.warn("Failed to parse cached meta:", err);
        }

        fetchItemsOnPO(currentPage_ItemsOnPO, itemsPerPage_ItemsOnPO, searchTerm_ItemsOnPO);
    }, [currentPage_ItemsOnPO, itemsPerPage_ItemsOnPO, searchTerm_ItemsOnPO, supplierId]);

    useEffect(() => {
        const customerKey = `${supplierId}-cached-suppliers-transInfo`;
        const metaKey = `${supplierId}-cached-meta-customer-transInfo`;

        const cachedSuppliersRaw = localStorage.getItem(customerKey);
        const cachedMetaRaw = localStorage.getItem(metaKey);

        if (!cachedSuppliersRaw || !cachedMetaRaw) {
            fetchTransInfo(currentPage_TransInfo, itemsPerPage_TransInfo, searchTerm_TransInfo);
            return;
        }

        try {
            const cachedMeta = JSON.parse(cachedMetaRaw);
            const cachedCustomers = JSON.parse(cachedSuppliersRaw);

            const isCacheValid = cachedMeta.page === currentPage_TransInfo && cachedMeta.perPage === itemsPerPage_TransInfo && cachedMeta.search === searchTerm_TransInfo;

            if (isCacheValid) {
                setSupplierTransInfo(cachedCustomers);
                setTotalPages_TransInfo(cachedMeta.totalPages);
                return;
            }
        } catch (err) {
            console.warn("Failed to parse cached meta:", err);
        }

        fetchTransInfo(currentPage_TransInfo, itemsPerPage_TransInfo, searchTerm_TransInfo);
    }, [currentPage_TransInfo, itemsPerPage_TransInfo, searchTerm_TransInfo, supplierId]);

    useEffect(() => {
        const customerKey = `${supplierId}-cached-suppliers-credit`;
        const metaKey = `${supplierId}-cached-meta-suppliers-credit`;

        const cachedSuppliersRaw = localStorage.getItem(customerKey);
        const cachedMetaRaw = localStorage.getItem(metaKey);

        if (!cachedSuppliersRaw || !cachedMetaRaw) {
            fetchSupplierCredit(currentPage_Credit, itemsPerPage_Credit, searchTerm_Credit);
            return;
        }

        try {
            const cachedMeta = JSON.parse(cachedMetaRaw);
            const cachedCustomers = JSON.parse(cachedSuppliersRaw);

            const isCacheValid = cachedMeta.page === currentPage_Credit && cachedMeta.perPage === itemsPerPage_Credit && cachedMeta.search === searchTerm_Credit;

            if (isCacheValid) {
                setSupplierCredit(cachedCustomers);
                setTotalPages_Credit(cachedMeta.totalPages);
                return;
            }
        } catch (err) {
            console.warn("Failed to parse cached meta:", err);
        }

        fetchSupplierCredit(currentPage_Credit, itemsPerPage_Credit, searchTerm_Credit);
    }, [currentPage_Credit, itemsPerPage_Credit, searchTerm_Credit, supplierId]);

    const fetchSupplierDetails = async () => {
        try {
            const idToUse = supplierId !== 0 ? supplierId : copiedsupplierId;
            if (!idToUse) {
                setLoading(false);
                return;
            }
            isDirtyRef.current = true; // 🔐 prevent dirty tracking
            setLoading(true);
            setError(null);

            const supplierInfoKey = `${idToUse}-cached-supplier-info`;
            const cachedSuppliersRaw = localStorage.getItem(supplierInfoKey);
            let foundSupplier;

            if (cachedSuppliersRaw) {
                foundSupplier = JSON.parse(cachedSuppliersRaw); // ✅ Parse cached JSON
            } else {
                foundSupplier = await supplierService.getSupplierInfo(idToUse); // ✅ Fetch from API
            }
            if (foundSupplier) {
                setCustomer(foundSupplier);
                setFormData((prev) => ({
                    ...prev,
                    supplier_code: foundSupplier.supplier_code || "",
                    old_supplier_code: foundSupplier.old_supplier_code || "",
                    suppliername_en: foundSupplier.suppliername_en || "",
                    suppliername_cn: foundSupplier.suppliername_cn || "",
                    contact_person_en: foundSupplier.contact_person_en || "",
                    contact_person_cn: foundSupplier.contact_person_cn || "",
                    supplier_address_en: foundSupplier.supplier_address_en || "",
                    supplier_address_cn: foundSupplier.supplier_address_cn || "",
                    contact_number: foundSupplier.contact_number || "",
                    postal_code: foundSupplier.postal_code || "",
                    fax: foundSupplier.fax || "",
                    email: foundSupplier.email || "",
                    bank_name_en: foundSupplier.bank_name_en || "",
                    bank_name_cn: foundSupplier.bank_name_cn || "",
                    bank_account_name_en: foundSupplier.bank_account_name_en || "",
                    bank_account_name_cn: foundSupplier.bank_account_name_cn || "",
                    bank_account_no: foundSupplier.bank_account_no || "",
                    bank_address_en: foundSupplier.bank_address_en || "",
                    bank_address_cn: foundSupplier.bank_address_cn || "",
                    bank_tel_no: foundSupplier.bank_tel_no || "",
                    bank_swift_code: foundSupplier.bank_swift_code || "",
                    bank_postal_code_2: foundSupplier.bank_postal_code_2 || "",
                    iban: foundSupplier.iban || "",
                }));

                // ✅ Only cache if it's a fresh fetch
                if (!cachedSuppliersRaw) {
                    localStorage.setItem(supplierInfoKey, JSON.stringify(foundSupplier));
                }
            } else {
                setError("supplier not found");
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to fetch supplier details");
            console.error("Error fetching supplier details:", err);
        } finally {
            setLoading(false);
            isDirtyRef.current = false; // ✅ re-enable dirty tracking
        }
    };
    const fetchInvoices = async (page = currentPage_Invoices, perPage = itemsPerPage_Invoices, search = "") => {
        try {
            const idToUse = supplierId !== 0 ? supplierId : copiedsupplierId;
            if (!idToUse) return;

            const paginatedData = await supplierService.getSupplierInvoices(supplierId, page, perPage, search);
            setSupplierInvoices(paginatedData.data);
            settotalPages_Invoices(paginatedData.last_page);
            localStorage.setItem(`${supplierId}-cached-suppliers-invoices`, JSON.stringify(paginatedData.data));
            localStorage.setItem(
                `${supplierId}-cached-meta-supplier-invoices`,
                JSON.stringify({
                    page,
                    perPage,
                    search,
                    totalPages: paginatedData.last_page,
                    totalItems: paginatedData.total,
                })
            );
        } catch (error) {
            console.error("Failed to load customer by orders:", error);
        }
    };
    const fetchPrepaid = async (page = currentPage_Prepaid, perPage = itemsPerPage_Prepaid, search = "") => {
        try {
            const idToUse = supplierId !== 0 ? supplierId : copiedsupplierId;
            if (!idToUse) return;

            const paginatedData = await supplierService.getSupplierPrepaid(supplierId, page, perPage, search);
            setSupplierPrepaid(paginatedData.data);
            setTotalPages_Prepaid(paginatedData.last_page);
            localStorage.setItem(`${supplierId}-cached-suppliers-prepaid`, JSON.stringify(paginatedData.data));
            localStorage.setItem(
                `${supplierId}-cached-meta-supplier-prepaid`,
                JSON.stringify({
                    page,
                    perPage,
                    search,
                    totalPages: paginatedData.last_page,
                    totalItems: paginatedData.total,
                })
            );
        } catch (error) {
            console.error("Failed to load customer by orders:", error);
        }
    };
    const fetchProfitability = async (page = currentPage_SalesOrder, perPage = itemsPerPage_SalesOrder, search = "") => {
        try {
            const idToUse = supplierId !== 0 ? supplierId : copiedsupplierId;
            if (!idToUse) return;

            const paginatedData = await supplierService.getSupplierProfitability(supplierId, page, perPage, search);
            setSupplierProfitabilityFooter(paginatedData.footer);
            setSupplierProfitability(paginatedData.data);
            settotalPages_ItemsOnPO(paginatedData.last_page);

            localStorage.setItem(`${supplierId}-cached-suppliers-profitability`, JSON.stringify(paginatedData.data));
            localStorage.setItem(
                `${supplierId}-cached-meta-customer-profitability`,
                JSON.stringify({
                    page,
                    perPage,
                    search,
                    totalPages: paginatedData.last_page,
                    totalItems: paginatedData.total,
                })
            );
        } catch (error) {
            console.error("Failed to load customer by orders:", error);
        }
    };
    const fetchReceiveItems = async (page = currentPage_Deposit, perPage = itemsPerPage_Deposit, search = "") => {
        try {
            const idToUse = supplierId !== 0 ? supplierId : copiedsupplierId;
            if (!idToUse) return;

            const paginatedData = await supplierService.getSupplierReceiveItems(supplierId, page, perPage, search);

            setSupplierReceivedItems(paginatedData.data);
            setTotalPages_ReceivedItems(paginatedData.last_page);

            localStorage.setItem(`${supplierId}-cached-suppliers-receivedItems`, JSON.stringify(paginatedData.data));
            localStorage.setItem(
                `${supplierId}-cached-meta-customer-receivedItems`,
                JSON.stringify({
                    page,
                    perPage,
                    search,
                    totalPages: paginatedData.last_page,
                    totalItems: paginatedData.total,
                })
            );
        } catch (error) {
            console.error("Failed to load customer by orders:", error);
        }
    };
    const fetchItemsOnPO = async (page = currentPage_ItemsOnPO, perPage = itemsPerPage_ItemsOnPO, search = "") => {
        try {
            const idToUse = supplierId !== 0 ? supplierId : copiedsupplierId;
            if (!idToUse) return;

            const paginatedData = await supplierService.getSupplierItemsOnPO(supplierId, page, perPage, search);

            setSupplierItemsOnPO(paginatedData.data);
            setTotalPages_ItemsOnPO(paginatedData.last_page);

            localStorage.setItem(`${supplierId}-cached-suppliers-itemsOnPO`, JSON.stringify(paginatedData.data));
            localStorage.setItem(
                `${supplierId}-cached-meta-customer-itemsOnPO`,
                JSON.stringify({
                    page,
                    perPage,
                    search,
                    totalPages: paginatedData.last_page,
                    totalItems: paginatedData.total,
                })
            );
        } catch (error) {
            console.error("Failed to load customer by orders:", error);
        }
    };
    const fetchTransInfo = async (page = currentPage_TransInfo, perPage = itemsPerPage_TransInfo, search = "") => {
        try {
            const idToUse = supplierId !== 0 ? supplierId : copiedsupplierId;
            if (!idToUse) return;

            const paginatedData = await supplierService.getSupplierTransInfo(supplierId, page, perPage, search);

            setSupplierTransInfo(paginatedData.data);
            setTotalPages_TransInfo(paginatedData.last_page);

            localStorage.setItem(`${supplierId}-cached-suppliers-transInfo`, JSON.stringify(paginatedData.data));
            localStorage.setItem(
                `${supplierId}-cached-meta-customer-transInfo`,
                JSON.stringify({
                    page,
                    perPage,
                    search,
                    totalPages: paginatedData.last_page,
                    totalItems: paginatedData.total,
                })
            );
        } catch (error) {
            console.error("Failed to load transInfo:", error);
        }
    };
    const fetchAccountsPayable = async (page = currentPage_Payable, perPage = itemsPerPage_AccountsPayable, search = "") => {
        try {
            const idToUse = supplierId !== 0 ? supplierId : copiedsupplierId;
            if (!idToUse) return;

            const paginatedData = await supplierService.getSupplierAccountsPayable(supplierId, page, perPage, search);
            setSupplierAccountsPayable(paginatedData.data);
            setTotalPages_AccountsPayable(paginatedData.last_page);

            localStorage.setItem(`${supplierId}-cached-suppliers-accountsPayable`, JSON.stringify(paginatedData.data));
            localStorage.setItem(
                `${supplierId}-cached-meta-supplier-accountsPayable`,
                JSON.stringify({
                    page,
                    perPage,
                    search,
                    totalPages: paginatedData.last_page,
                    totalItems: paginatedData.total,
                })
            );
        } catch (error) {
            console.error("Failed to load customer by orders:", error);
        }
    };
    const fetchSupplierCredit = async (page = currentPage_Credit, perPage = itemsPerPage_Credit, search = "") => {
        try {
            const idToUse = supplierId !== 0 ? supplierId : copiedsupplierId;
            if (!idToUse) return;

            const paginatedData = await supplierService.getSupplierCredit(supplierId, page, perPage, search);
            setSupplierCredit(paginatedData.data);
            setTotalPages_Credit(paginatedData.last_page);

            localStorage.setItem(`${supplierId}-cached-suppliers-credit`, JSON.stringify(paginatedData.data));
            localStorage.setItem(
                `${supplierId}-cached-meta-suppliers-credit`,
                JSON.stringify({
                    page,
                    perPage,
                    search,
                    totalPages: paginatedData.last_page,
                    totalItems: paginatedData.total,
                })
            );
        } catch (error) {
            console.error("Failed to load customer by orders:", error);
        }
    };
    // Step 3: Group by 'YYYY MMMM' label
    const groupedSupplierCredit: Record<string, ApiSupplier[]> = supplierCredit.reduce((groups, item) => {
        const monthLabel = dayjs(item.transaction_date).format("YYYY MMMM");
        if (!groups[monthLabel]) {
            groups[monthLabel] = [];
        }
        groups[monthLabel].push(item);
        return groups;
    }, {} as Record<string, ApiSupplier[]>);

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

    const loadCourier = async () => {
        try {
            const list = await fetchCourier(); // fetches & returns
            setCourierData(list ?? []); // ✅ manually set state here
        } catch (err) {
            console.error("Failed to fetch loadCourier:", err);
        }
    };
    const loadCurrency = async () => {
        try {
            const list = await fetchCurrencies(); // fetches & returns
            setCurrenciesData(list ?? []); // ✅ manually set state here
        } catch (err) {
            console.error("Failed to fetch loadCurrency:", err);
        }
    };
    const loadTaxGroup = async () => {
        try {
            const list = await fetchTaxGroup(); // fetches & returns
            setTaxGroupData(list ?? []); // ✅ manually set state here
        } catch (err) {
            console.error("Failed to fetch loadCourier:", err);
        }
    };
    const loadShippingTerms = async () => {
        try {
            const list = await fetchShippingTerms(); // fetches & returns
            setShippingTermsData(list ?? []); // ✅ manually set state here
        } catch (err) {
            console.error("Failed to fetch loadShippingTerms:", err);
        }
    };
    const loadPaymentTerms = async () => {
        try {
            const list = await fetchPaymentTerms(); // fetches & returns
            setPaymentTermsData(list ?? []); // ✅ manually set state here
        } catch (err) {
            console.error("Failed to fetch loadPaymentTerms:", err);
        }
    };
    const loadCountries = async () => {
        try {
            const list = await fetchCountries(); // fetches & returns
            setCountriesData(list ?? []); // ✅ manually set state here
        } catch (err) {
            console.error("Failed to fetch loadCountries:", err);
        }
    };
    const loadState = async () => {
        try {
            const list = await fetchStates(); // fetches & returns
            setStatesData(list ?? []); // ✅ manually set state here
        } catch (err) {
            console.error("Failed to fetch loadCountries:", err);
        }
    };
    const updateCachedRaw = async (cachedType: string, custId: number) => {
        if (cachedType === "supplierInfo") {
            const newData = await supplierService.getSupplierInfo(custId);
            if (newData) {
                localStorage.setItem(supplierInfoKey, JSON.stringify(newData));
            }
        }
    };
    const handleSave = async () => {
        setLoadingSave(true);
        const data = new FormData();
        const supplierNameEn = formData["suppliername_en"]?.toString().trim() ?? "";
        const supplierNameCn = formData["suppliername_cn"]?.toString().trim() ?? "";
        const supplierCode = formData["supplier_code"]?.toString().trim() ?? "";
        const oldSupplierCode = formData["old_supplier_code"]?.toString().trim() ?? "";

        if (!supplierCode) {
            showErrorToast(translations["Supplier Code is Empty"]);
            setLoadingSave(false); // Enable button again
            return;
        }
        if (supplierNameEn === "" && lang === "en") {
            showErrorToast(translations["Supplier Name is Empty"]);
            setLoadingSave(false); // Enable button again
            return;
        }
        if (supplierNameCn === "" && lang === "cn") {
            showErrorToast(translations["Supplier Name is Empty"]);
            setLoadingSave(false); // Enable button again
            return;
        }

        const countExist = await supplierService.getSupplierExists(supplierCode);
        if (countExist > 0 && supplierId === 0) {
            showErrorToast(translations["This customer is already exists"]);
            return;
        }

        if (supplierCode != oldSupplierCode && supplierId != 0) {
            const confirmed = await showConfirm(translations["Account Code Update"], translations["Confirm Changing Supplier Code"], translations["Delete"], translations["Cancel"]);
            if (!confirmed) {
                setLoadingSave(false); // Enable button again
                return;
            }
            if (confirmed) {
                formData["old_supplier_code"] = supplierCode;
            }
        }
        // Fallback: if Chinese title is missing, use English
        if (!formData["suppliername_cn"] && safeLang === "en") {
            formData["suppliername_cn"] = supplierNameEn;
        }
        if (!formData["suppliername_en"] && safeLang === "cn") {
            formData["suppliername_en"] = supplierNameCn;
        }
        if (!formData["contact_person_cn"] && safeLang === "en") {
            formData["contact_person_cn"] = formData["contact_person_en"];
        }
        if (!formData["contact_person_en"] && safeLang === "cn") {
            formData["contact_person_en"] = formData["contact_person_cn"];
        }
        if (!formData["supplier_address_cn"] && safeLang === "en") {
            formData["supplier_address_cn"] = formData["supplier_address_en"];
        }
        if (!formData["supplier_address_en"] && safeLang === "cn") {
            formData["supplier_address_en"] = formData["supplier_address_cn"];
        }
        if (!formData["bank_account_name_cn"] && safeLang === "en") {
            formData["bank_account_name_cn"] = formData["bank_account_name_en"];
        }
        if (!formData["bank_account_name_en"] && safeLang === "cn") {
            formData["bank_account_name_en"] = formData["bank_account_name_cn"];
        }
        if (!formData["bank_address_cn"] && safeLang === "en") {
            formData["bank_address_cn"] = formData["bank_address_en"];
        }
        if (!formData["bank_address_en"] && safeLang === "cn") {
            formData["bank_address_en"] = formData["bank_address_cn"];
        }
        if (!formData["bank_name_cn"] && safeLang === "en") {
            formData["bank_name_cn"] = formData["bank_name_en"];
        }
        if (!formData["bank_name_en"] && safeLang === "cn") {
            formData["bank_name_en"] = formData["bank_name_cn"];
        }
        if (supplierId === 0) {
            formData["old_supplier_code"] = formData["supplier_code"];
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
            const result = await supplierService.updateSupplier(supplierId, data);
            const newId = result?.id;
            if ((saveType === "new" || saveType === "copy") && newId) {
                onChangeSupplierId(newId);
                onChangeSaveType("edit");
                setCopiedsupplierId(null);
            }
            // Reset state to allow re-initialization after refetch
            setIsDirty(false);
            setIsInitialized(false);
            // Set state (this is async)
            setFormData((prev) => ({
                ...prev,
                is_copy_group: false,
                is_copy_supplierInfo: false,
                is_new_supplier_id: 0,
                is_copy_media: false,
                is_copy_data: false,
            }));

            const updatedTabId = tabId.replace("info", "list");
            localStorage.removeItem(`${updatedTabId}-cached-suppliers`);
            await updateCachedRaw("supplierInfo", newId);
            showSuccessToast(translations["Supplier Successfully Saved"]);
            onSave(); // This will now trigger the cache clearing in the parent
        } catch (error) {
            showErrorToast(translations["Failed to save Supplier."] || "Failed to save Supplier.");
        } finally {
            setLoadingSave(false); // Enable button again after the operation is done
        }
    };
    const handleAddNew = async () => {
        onChangeSupplierId(0);
        onChangeSaveType("new");
        setIsDirty(false);
        isDirtyRef.current = false;
    };
    const clearForms = () => {
        const initialFormData = {
            supplier_code: "",
            old_supplier_code: "",
            copy_supplier_code: "",
            suppliername_en: "",
            suppliername_cn: "",
            contact_person_en: "",
            contact_person_cn: "",
            supplier_address_en: "",
            supplier_address_cn: "",
            contact_number: "",
            country: null as OptionType | null,
            country_state: null as OptionType | null,
            postal_code: "",
            fax: "",
            email: "",
            bank_name_en: "",
            bank_name_cn: "",
            bank_account_name_en: "",
            bank_account_name_cn: "",
            bank_account_no: "",
            bank_address_en: "",
            bank_address_cn: "",
            bank_country: null as OptionType | null,
            bank_country_state: null as OptionType | null,
            bank_tel_no: "",
            bank_swift_code: "",
            bank_postal_code_2: "",
            currency: null as OptionType | null,
            iban: "",
            tax: null as OptionType | null,
            payment_terms_id: null as OptionType | null,
            shipping_terms_id: null as OptionType | null,
            delivery_method_id: null as OptionType | null,
            is_copy_supplierInfo: false,
            is_new_supplier_id: 0,
            is_copy_data: false,
        };
        setFormData(initialFormData);
    };
    const handleCopy = () => {
        if (saveType == "new" || saveType == "copy") {
            showErrorToast(translations["Cannot copy, Invalid data"] || "Cannot copy, Unfinished data");
            return;
        }
        setShowCopySupplier(true);
    };
    const processCopy = (newSupplierCode: string, copyFields: Record<string, boolean>, copySelectAll: Record<string, boolean>, rawArray: Record<string, boolean>) => {
        const sourceFormData = formData;
        const keyCount = Object.keys(rawArray).length;

        onChangeSupplierId(0);
        onChangeSaveType("copy");

        setTimeout(() => {
            clearForms();
            let currency: OptionType | null = null;
            let payment_terms_id: OptionType | null = null;
            let shipping_terms_id: OptionType | null = null;
            let delivery_method_id: OptionType | null = null;
            let bank_name_en: string;
            let bank_name_cn: string;
            let bank_account_name_en: string;
            let bank_account_name_cn: string;
            let bank_account_no: string;
            let bank_address_en: string;
            let bank_address_cn: string;
            let bank_country: OptionType | null = null;
            let bank_country_state: OptionType | null = null;
            let bank_tel_no: string;
            let bank_swift_code: string;
            let bank_postal_code_2: string;

            if (keyCount === 0) {
                currency = sourceFormData.currency;
                payment_terms_id = sourceFormData.payment_terms_id;
                shipping_terms_id = sourceFormData.shipping_terms_id;
                delivery_method_id = sourceFormData.delivery_method_id;
                bank_name_en = sourceFormData.bank_name_en;
                bank_name_cn = sourceFormData.bank_name_cn;
                bank_account_name_en = sourceFormData.bank_account_name_en;
                bank_account_name_cn = sourceFormData.bank_account_name_cn;
                bank_account_no = sourceFormData.bank_account_no;
                bank_address_en = sourceFormData.bank_address_en;
                bank_address_cn = sourceFormData.bank_address_cn;
                bank_country = sourceFormData.bank_country;
                bank_country_state = sourceFormData.bank_country_state;
                bank_tel_no = sourceFormData.bank_tel_no;
                bank_swift_code = sourceFormData.bank_swift_code;
                bank_postal_code_2 = sourceFormData.bank_postal_code_2;
            } else {
                currency = isValidOption(rawArray["currency"]) ? rawArray["currency"] : null;
                payment_terms_id = isValidOption(rawArray["payment_terms_id"]) ? rawArray["payment_terms_id"] : null;
                shipping_terms_id = isValidOption(rawArray["shipping_terms_id"]) ? rawArray["shipping_terms_id"] : null;
                delivery_method_id = isValidOption(rawArray["delivery_method_id"]) ? rawArray["delivery_method_id"] : null;
                bank_name_en = typeof rawArray["bank_name_en"] === "string" ? rawArray["bank_name_en"] : "";
                bank_name_cn = typeof rawArray["bank_name_cn"] === "string" ? rawArray["bank_name_cn"] : "";
                bank_account_name_en = typeof rawArray["bank_account_name_en"] === "string" ? rawArray["bank_account_name_en"] : "";
                bank_account_name_cn = typeof rawArray["bank_account_name_cn"] === "string" ? rawArray["bank_account_name_cn"] : "";
                bank_account_no = typeof rawArray["bank_account_no"] === "string" ? rawArray["bank_account_no"] : "";
                bank_address_en = typeof rawArray["bank_address_en"] === "string" ? rawArray["bank_address_en"] : "";
                bank_address_cn = typeof rawArray["bank_address_cn"] === "string" ? rawArray["bank_address_cn"] : "";
                bank_country = isValidOption(rawArray["bank_country"]) ? rawArray["bank_country"] : null;
                bank_country_state = isValidOption(rawArray["bank_country_state"]) ? rawArray["bank_country_state"] : null;
                bank_tel_no = typeof rawArray["bank_tel_no"] === "string" ? rawArray["bank_tel_no"] : "";
                bank_swift_code = typeof rawArray["bank_swift_code"] === "string" ? rawArray["bank_swift_code"] : "";
                bank_postal_code_2 = typeof rawArray["bank_postal_code_2"] === "string" ? rawArray["bank_postal_code_2"] : "";
            }

            setFormData((prevState) => ({
                ...prevState,
                currency: copyFields["Currency"] ? currency : null,
                payment_terms_id: copyFields["Payment Terms"] ? payment_terms_id : null,
                shipping_terms_id: copyFields["Shipping Terms"] ? shipping_terms_id : null,
                delivery_method_id: copyFields["Delivery Method"] ? delivery_method_id : null,
                bank_name_en: copyFields["Bank Information"] ? bank_name_en : "",
                bank_name_cn: copyFields["Bank Information"] ? bank_name_cn : "",
                bank_account_name_en: copyFields["Bank Information"] ? bank_account_name_en : "",
                bank_account_name_cn: copyFields["Bank Information"] ? bank_account_name_cn : "",
                bank_account_no: copyFields["Bank Information"] ? bank_account_no : "",
                bank_address_en: copyFields["Bank Information"] ? bank_address_en : "",
                bank_address_cn: copyFields["Bank Information"] ? bank_address_cn : "",
                bank_country: copyFields["Bank Information"] ? bank_country : null,
                bank_country_state: copyFields["Bank Information"] ? bank_country_state : null,
                bank_tel_no: copyFields["Bank Information"] ? bank_tel_no : "",
                bank_swift_code: copyFields["Bank Information"] ? bank_swift_code : "",
                bank_postal_code_2: copyFields["Bank Bank"] ? bank_postal_code_2 : "",
                supplier_code: newSupplierCode,
                old_supplier_code: newSupplierCode,
                copy_supplier_code: newSupplierCode,
                is_copy_group: copyFields["Customer Group"],
                is_copy_supplierInfo: copySelectAll["supplierInfo"],
                is_copy_data: true,
                is_new_supplier_id: supplierId,
            }));
        }, 300);
        showSuccessToast(translations["Customer ready to be saved as a copy."] || "Customer ready to be saved as a copy.");
    };
    const handleCopySupplier = async () => {
        const newSupplierCode = formData.copy_supplier_code?.toString().trim() ?? "";
        if (!newSupplierCode) {
            showErrorToast(translations["Supplier Code Empty"]);
            return;
        }
        const countExist = await supplierService.getSupplierExists(newSupplierCode);
        if (countExist > 0) {
            showErrorToast(translations["This Supplier is already exists"]);
            return;
        }

        setShowCopySupplier(false);
        processCopy(newSupplierCode, fields, selectAll, {});
    };
    const handleDelete = async () => {
        const selectedSuppliers = [supplierId];
        if (selectedSuppliers.length === 0) return;

        const confirmed = await showConfirm(translations["System Message"], translations["Are you sure you want to delete selected items?"], translations["Delete"], translations["Cancel"]);

        if (!confirmed) return;
        try {
            await supplierService.deleteSuppliers(selectedSuppliers, "soft");
            showSuccessToast(translations["Record has been Deleted"]);

            onChangeSupplierId(0); // Notify parent about new customer ID
            onChangeSaveType("new");

            // Delay logic to allow re-render with supplierId = 0
            setTimeout(async () => {
                setIsDirty(false);
                setIsInitialized(false);

                const supplierInfoKey = `${supplierId}-cached-supplier-info`;
                const supplierInvoicesKey = `${supplierId}-cached-supplier-invoices`;
                const supplierPrepaidKey = `${supplierId}-cached-supplier-prepaid`;
                const supplierProfitKey = `${supplierId}-cached-supplier-profit`;
                const supplierReceiveItemsKey = `${supplierId}-cached-supplier-receiveItems`;
                const supplierItemsOnPOKey = `${supplierId}-cached-supplier-itemsOnPO`;
                const supplierTransInfoKey = `${supplierId}-cached-supplier-transInfo`;
                const supplierAccountsPayableKey = `${supplierId}-cached-supplier-accountsPayable`;
                const supplierRefundKey = `${supplierId}-cached-supplier-refund`;
                const updatedTabId = tabId.replace("details", "list");

                localStorage.removeItem(supplierInfoKey);
                localStorage.removeItem(supplierInvoicesKey);
                localStorage.removeItem(supplierPrepaidKey);
                localStorage.removeItem(supplierProfitKey);
                localStorage.removeItem(supplierReceiveItemsKey);
                localStorage.removeItem(supplierItemsOnPOKey);
                localStorage.removeItem(supplierTransInfoKey);
                localStorage.removeItem(supplierAccountsPayableKey);
                localStorage.removeItem(supplierRefundKey);
                localStorage.removeItem(`${updatedTabId}-cached-suppliers`);

                onSave();
            }, 200);
        } catch (err) {
            showErrorToast(translations["alert_message_18"]);
            console.error("Deletion failed:", err);
        }
    };
    const handleToggleRow_Invoices = async (tableId: number, apInvoiceNo: string) => {
        const isExpanded = expanded_Invoices.includes(tableId);
        const cachedKey = `cached-orders-details-${tableId}`;

        if (isExpanded) {
            // Collapse row
            setExpandedRows_Invoices(expanded_Invoices.filter((id) => id !== tableId));
        } else {
            // Expand row
            setExpandedRows_Invoices([...expanded_Invoices, tableId]);

            // Try to get from localStorage first
            const cachedData = localStorage.getItem(cachedKey);

            if (cachedData) {
                // If cache exists, parse and set it
                setInvoicesDetailsMap((prev) => ({ ...prev, [tableId]: JSON.parse(cachedData) }));
            } else {
                // If no cache, fetch from API
                try {
                    const data = await supplierService.getSupplierInvoicesDetails(apInvoiceNo);
                    // Save to state
                    setInvoicesDetailsMap((prev) => ({ ...prev, [tableId]: data }));
                    // Save to localStorage
                    localStorage.setItem(cachedKey, JSON.stringify(data));
                } catch (error) {
                    console.error(`Failed to load details for product ${tableId}`, error);
                    setInvoicesDetailsMap((prev) => ({ ...prev, [tableId]: null }));
                }
            }
        }
    };
    const handleToggleRow_Prepaid = async (tableId: number, refData: string) => {
        const isExpanded = expanded_Prepaid.includes(tableId);
        var cachedKey = `cached-invoices-details-${tableId}`;

        if (isExpanded) {
            // Collapse row
            setExpandedRows_Prepaid(expanded_Prepaid.filter((id) => id !== tableId));
        } else {
            // Expand row
            setExpandedRows_Prepaid([...expanded_Prepaid, tableId]);

            // Try to get from localStorage first
            const cachedData = localStorage.getItem(cachedKey);

            if (cachedData) {
                // If cache exists, parse and set it
                setPrepaidDetailsMap((prev) => ({ ...prev, [tableId]: JSON.parse(cachedData) }));
            } else {
                // If no cache, fetch from API
                try {
                    const data = await supplierService.getSupplierPrepaidDetails(refData);
                    // Save to state
                    setPrepaidDetailsMap((prev) => ({ ...prev, [tableId]: data }));
                    // Save to localStorage
                    localStorage.setItem(cachedKey, JSON.stringify(data));
                } catch (error) {
                    console.error(`Failed to load details for invoices ${tableId}`, error);
                    setPrepaidDetailsMap((prev) => ({ ...prev, [tableId]: null }));
                }
            }
        }
    };
    const handleToggleRow_ItemsOnPO = async (tableId: number, poNumber: string) => {
        const isExpanded = expanded_ItemsOnPO.includes(tableId);
        var cachedKey = `cached-itemsOnPO-details-${tableId}`;

        if (isExpanded) {
            // Collapse row
            setExpandedRows_ItemsOnPO(expanded_ItemsOnPO.filter((id) => id !== tableId));
        } else {
            // Expand row
            setExpandedRows_ItemsOnPO([...expanded_ItemsOnPO, tableId]);

            // Try to get from localStorage first
            const cachedData = localStorage.getItem(cachedKey);

            if (cachedData) {
                // If cache exists, parse and set it
                setItemsOnPODetailsMap((prev) => ({ ...prev, [tableId]: JSON.parse(cachedData) }));
            } else {
                // If no cache, fetch from API
                try {
                    const data = await supplierService.getSupplierItemsOnPODtails(poNumber);
                    // Save to state
                    setItemsOnPODetailsMap((prev) => ({ ...prev, [tableId]: data }));
                    // Save to localStorage
                    localStorage.setItem(cachedKey, JSON.stringify(data));
                } catch (error) {
                    console.error(`Failed to load details for items on PO ${tableId}`, error);
                    setItemsOnPODetailsMap((prev) => ({ ...prev, [tableId]: null }));
                }
            }
        }
    };
    const handleToggleRow_Payable = async (tableId: number, grnNo: string) => {
        const isExpanded = expanded_Payable.includes(tableId);
        var cachedKey = `cached-payable-details-${tableId}`;

        if (isExpanded) {
            // Collapse row
            setExpandedRows_Payable(expanded_Payable.filter((id) => id !== tableId));
        } else {
            // Expand row
            setExpandedRows_Payable([...expanded_Payable, tableId]);

            // Try to get from localStorage first
            const cachedData = localStorage.getItem(cachedKey);

            if (cachedData) {
                // If cache exists, parse and set it
                setPayableDetailsMap((prev) => ({ ...prev, [tableId]: JSON.parse(cachedData) }));
            } else {
                // If no cache, fetch from API
                try {
                    const data = await supplierService.getSupplierPayableDtails(grnNo);
                    // Save to state
                    setPayableDetailsMap((prev) => ({ ...prev, [tableId]: data }));
                    // Save to localStorage
                    localStorage.setItem(cachedKey, JSON.stringify(data));
                } catch (error) {
                    console.error(`Failed to load details for items on PO ${tableId}`, error);
                    setPayableDetailsMap((prev) => ({ ...prev, [tableId]: null }));
                }
            }
        }
    };
    const handleToggleRow_Credit = async (tableId: number, refNumber: string, type: string) => {
        const isExpanded = expanded_Credits.includes(tableId);
        var cachedKey = `cached-order-history-details-${tableId}`;
        if (isExpanded) {
            // Collapse row
            setExpandedRows_Credits(expanded_Credits.filter((id) => id !== tableId));
        } else {
            // Expand row
            setExpandedRows_Credits([...expanded_Credits, tableId]);

            // Try to get from localStorage first
            const cachedData = localStorage.getItem(cachedKey);

            if (cachedData) {
                // If cache exists, parse and set it
                setCreditDetailsMap((prev) => ({ ...prev, [tableId]: JSON.parse(cachedData) }));
            } else {
                // If no cache, fetch from API
                try {
                    const data = await supplierService.getCreditDetails(refNumber, type);
                    // Save to state
                    setCreditDetailsMap((prev) => ({ ...prev, [tableId]: data }));
                    // Save to localStorage
                    localStorage.setItem(cachedKey, JSON.stringify(data));
                } catch (error) {
                    console.error(`Failed to load details for credit ${tableId}`, error);
                    setCreditDetailsMap((prev) => ({ ...prev, [tableId]: null }));
                }
            }
        }
    };
    // Get all images for gallery with stable IDs
    const tabs = [
        { id: "information", label: translations["Information"] },
        { id: "orders", label: translations["Invoices"] },
        { id: "invoices", label: translations["Prepaid"] },
        { id: "sales-order", label: translations["Profitability"] },
        { id: "deposit", label: translations["Received Items"] },
        { id: "profitability", label: translations["Items on PO"] },
        { id: "order-history", label: translations["TransactionInfo"] },
        { id: "credit", label: translations["Accounts Payable"] },
        { id: "refund", label: translations["Credit"] },
    ];
    if (loading) {
        return (
            <div className="min-h-screen" style={{ backgroundColor: "#1a1a1a" }}>
                <div className="flex items-center justify-center h-64">
                    <div className="text-[#ffffffcc] text-custom-sm">{translations["Processing2"]}...</div>
                </div>
            </div>
        );
    }
    if ((error || !customer) && saveType !== "new") {
        return (
            <div className="min-h-screen" style={{ backgroundColor: "#1a1a1a" }}>
                <div className="p-6">
                    <button onClick={onBack} className="flex items-center space-x-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-[#ffffffcc] text-custom-sm rounded-lg transition-colors mb-4">
                        <ArrowLeft className="h-4 w-4" />
                        <span>{translations["Back"]}</span>
                    </button>
                    <div className="text-center py-12">
                        <div className="text-red-400 text-lg mb-2">{error || "customer not found"}</div>
                        <p className="text-gray-400">The customer you're looking for doesn't exist or couldn't be loaded.</p>
                    </div>
                </div>
            </div>
        );
    }
    const rendersupplierInformation = () => (
        <div className="p-1 bg-[#19191c] rounded-xl">
            <div className="h-[calc(100vh-150px)] overflow-y-auto pr-2">
                <div className="grid gap-4">
                    {/* customer Code Section */}
                    <div className="grid grid-cols-12 gap-4">
                        {/* Right side: 12 columns */}
                        <div className="col-span-12 p-1">
                            <fieldset className="grid grid-cols-12 gap-4 border-[1px] border-[#ffffff1a] rounded-lg p-4 mb-2">
                                <div className="col-span-12 md:col-span-4">
                                    <div className="flex items-center space-x-4 mb-2">
                                        <label className="w-[25%] text-gray-400 text-sm">{translations["Supplier Code"]}</label>
                                        <input
                                            type="text"
                                            value={formData.supplier_code}
                                            onChange={(e) => {
                                                const value = e.target.value;
                                                setFormData((prev) => ({ ...prev, supplier_code: value }));
                                                if (!isDirtyRef.current) setIsDirty(true);
                                            }}
                                            className="flex-1 px-3 py-2 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm"
                                        />
                                        <input type="hidden" value={formData.old_supplier_code} onChange={(e) => setFormData((prev) => ({ ...prev, old_supplier_code: e.target.value }))} />
                                    </div>
                                    <div className="flex items-center space-x-4 mb-2">
                                        <label className="w-[25%] text-gray-400 text-sm">{translations["Supplier Name"]}</label>
                                        <input
                                            type="text"
                                            hidden={lang === "cn"}
                                            value={formData.suppliername_en}
                                            onChange={(e) => {
                                                const value = e.target.value;
                                                setFormData((prev) => ({ ...prev, suppliername_en: value }));
                                                if (!isDirtyRef.current) setIsDirty(true);
                                            }}
                                            className="flex-1 px-3 py-2 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm"
                                        />
                                        <input
                                            type="text"
                                            hidden={lang === "en"}
                                            value={formData.suppliername_cn}
                                            onChange={(e) => {
                                                const value = e.target.value;
                                                setFormData((prev) => ({ ...prev, suppliername_cn: value }));
                                                if (!isDirtyRef.current) setIsDirty(true);
                                            }}
                                            className="flex-1 px-3 py-2 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm"
                                        />
                                    </div>
                                    <div className="flex items-center space-x-4 mb-2">
                                        <label className="w-[25%] text-gray-400 text-sm">{translations["Contact Person"]}</label>
                                        <input
                                            type="text"
                                            hidden={lang === "cn"}
                                            value={formData.contact_person_en}
                                            onChange={(e) => {
                                                const value = e.target.value;
                                                setFormData((prev) => ({ ...prev, contact_person_en: value }));
                                                if (!isDirtyRef.current) setIsDirty(true);
                                            }}
                                            className="flex-1 px-3 py-2 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm"
                                        />
                                        <input
                                            type="text"
                                            hidden={lang === "en"}
                                            value={formData.contact_person_cn}
                                            onChange={(e) => {
                                                const value = e.target.value;
                                                setFormData((prev) => ({ ...prev, contact_person_cn: value }));
                                                if (!isDirtyRef.current) setIsDirty(true);
                                            }}
                                            className="flex-1 px-3 py-2 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm"
                                        />
                                    </div>
                                    <div className="flex items-center space-x-4 mb-2">
                                        <label className="w-[25%] text-gray-400 text-sm">{translations["Contact No"]}</label>
                                        <input
                                            type="text"
                                            hidden={lang === "cn"}
                                            value={formData.contact_number}
                                            onChange={(e) => {
                                                const value = e.target.value;
                                                setFormData((prev) => ({ ...prev, contact_number: value }));
                                                if (!isDirtyRef.current) setIsDirty(true);
                                            }}
                                            className="flex-1 px-3 py-2 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm"
                                        />
                                    </div>
                                    <div className="flex items-center space-x-4 mb-2">
                                        <label className="w-[26%] text-gray-400 text-sm">{translations["Currency"]}</label>
                                        <Select
                                            classNamePrefix="react-select"
                                            value={formData.currency}
                                            onChange={async (selected) => {
                                                setFormData({ ...formData, currency: selected as OptionType | null });
                                                if (!isDirtyRef.current) {
                                                    setIsDirty(true); // ✅ only if user is editing
                                                }
                                            }}
                                            options={currencyOptions}
                                            styles={{
                                                ...selectStyles,
                                                menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                                            }}
                                            className="w-[75%]"
                                            isClearable
                                            placeholder={translations["Select"]}
                                            menuPlacement="auto"
                                            menuPosition="fixed"
                                            menuPortalTarget={typeof window !== "undefined" ? document.body : null}
                                        />
                                    </div>
                                </div>
                                <div className="col-span-12 md:col-span-4">
                                    <div className="flex items-center space-x-4 mb-2">
                                        <label className="w-[25%] text-gray-400 text-sm">{translations["Fax No"]}</label>
                                        <input
                                            type="text"
                                            value={formData.fax}
                                            onChange={(e) => {
                                                const value = e.target.value;
                                                setFormData((prev) => ({ ...prev, fax: value }));
                                                if (!isDirtyRef.current) setIsDirty(true);
                                            }}
                                            className="flex-1 px-3 py-2 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm"
                                        />
                                    </div>
                                    <div className="flex items-center space-x-4 mb-2">
                                        <label className="w-[25%] text-gray-400 text-sm">{translations["Email"]}</label>
                                        <input
                                            type="text"
                                            value={formData.email}
                                            onChange={(e) => {
                                                const value = e.target.value;
                                                setFormData((prev) => ({ ...prev, email: value }));
                                                if (!isDirtyRef.current) setIsDirty(true);
                                            }}
                                            className="flex-1 px-3 py-2 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm"
                                        />
                                    </div>
                                    <div className="flex items-center space-x-4 mb-2">
                                        <label className="w-[26%] text-gray-400 text-sm">{translations["Payment Terms"]}</label>
                                        <Select
                                            classNamePrefix="react-select"
                                            value={formData.payment_terms_id}
                                            onChange={(selected) => {
                                                setFormData({ ...formData, payment_terms_id: selected as OptionType | null });
                                                if (!isDirtyRef.current) {
                                                    setIsDirty(true); // ✅ only if user is editing
                                                }
                                            }}
                                            options={paymentTermsOption}
                                            styles={{
                                                ...selectStyles,
                                                menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                                            }}
                                            className="w-[75%]"
                                            isClearable
                                            placeholder={translations["Select"]}
                                            menuPlacement="auto"
                                            menuPosition="fixed"
                                            menuPortalTarget={typeof window !== "undefined" ? document.body : null}
                                        />
                                    </div>
                                    <div className="flex items-center space-x-4 mb-2">
                                        <label className="w-[26%] text-gray-400 text-sm">{translations["Shipping Terms"]}</label>
                                        <Select
                                            classNamePrefix="react-select"
                                            value={formData.shipping_terms_id}
                                            onChange={(selected) => {
                                                setFormData({ ...formData, shipping_terms_id: selected as OptionType | null });
                                                if (!isDirtyRef.current) {
                                                    setIsDirty(true); // ✅ only if user is editing
                                                }
                                            }}
                                            options={shippingTermsOption}
                                            styles={{
                                                ...selectStyles,
                                                menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                                            }}
                                            className="w-[75%]"
                                            isClearable
                                            placeholder={translations["Select"]}
                                            menuPlacement="auto"
                                            menuPosition="fixed"
                                            menuPortalTarget={typeof window !== "undefined" ? document.body : null}
                                        />
                                    </div>
                                    <div className="flex items-center space-x-4 mb-2">
                                        <label className="w-[26%] text-gray-400 text-sm">{translations["Delivery Method"]}</label>
                                        <Select
                                            classNamePrefix="react-select"
                                            value={formData.delivery_method_id}
                                            onChange={(selected) => {
                                                setFormData({ ...formData, delivery_method_id: selected as OptionType | null });
                                                if (!isDirtyRef.current) {
                                                    setIsDirty(true); // ✅ only if user is editing
                                                }
                                            }}
                                            options={courierOption}
                                            styles={{
                                                ...selectStyles,
                                                menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                                            }}
                                            className="w-[75%]"
                                            isClearable
                                            placeholder={translations["Select"]}
                                            menuPlacement="auto"
                                            menuPosition="fixed"
                                            menuPortalTarget={typeof window !== "undefined" ? document.body : null}
                                        />
                                    </div>
                                </div>
                                <div className="col-span-12 md:col-span-4">
                                    <div className="flex items-center space-x-4 mb-2">
                                        <label className="w-[25%] text-gray-400 text-sm">{translations["Address"]}</label>
                                        <textarea
                                            value={formData.supplier_address_en}
                                            hidden={lang === "cn"}
                                            rows={3}
                                            onChange={(e) => {
                                                const value = e.target.value;
                                                setFormData((prev) => ({ ...prev, supplier_address_en: value }));
                                                if (!isDirtyRef.current) setIsDirty(true);
                                            }}
                                            className={`flex-1 px-3 py-2 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm ${lang === "cn" ? "hidden" : ""}`}
                                        />
                                        <textarea
                                            value={formData.supplier_address_cn}
                                            hidden={lang === "en"}
                                            rows={3}
                                            onChange={(e) => {
                                                const value = e.target.value;
                                                setFormData((prev) => ({ ...prev, supplier_address_cn: value }));
                                                if (!isDirtyRef.current) setIsDirty(true);
                                            }}
                                            className={`flex-1 px-3 py-2 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm ${lang === "cn" ? "hidden" : ""}`}
                                        />
                                    </div>
                                    <div className="flex items-center space-x-4 mb-2">
                                        <label className="w-[26%] text-gray-400 text-sm">{translations["Country"]}</label>
                                        <Select
                                            classNamePrefix="react-select"
                                            value={formData.country}
                                            onChange={(selected) => {
                                                setFormData({ ...formData, country: selected as OptionType | null });
                                                if (!isDirtyRef.current) {
                                                    setIsDirty(true); // ✅ only if user is editing
                                                }
                                            }}
                                            options={countriesOption}
                                            styles={{
                                                ...selectStyles,
                                                menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                                            }}
                                            className="w-[75%]"
                                            isClearable
                                            placeholder={translations["Select"]}
                                            menuPlacement="auto"
                                            menuPosition="fixed"
                                            menuPortalTarget={typeof window !== "undefined" ? document.body : null}
                                        />
                                    </div>
                                    <div className="flex items-center space-x-4 mb-2">
                                        <label className="w-[26%] text-gray-400 text-sm">{translations["State"]}</label>
                                        <Select
                                            classNamePrefix="react-select"
                                            value={formData.country_state}
                                            onChange={(selected) => {
                                                setFormData({ ...formData, country_state: selected as OptionType | null });
                                                if (!isDirtyRef.current) {
                                                    setIsDirty(true); // ✅ only if user is editing
                                                }
                                            }}
                                            options={statesOption}
                                            styles={{
                                                ...selectStyles,
                                                menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                                            }}
                                            className="w-[75%]"
                                            isClearable
                                            placeholder={translations["Select"]}
                                            menuPlacement="auto"
                                            menuPosition="fixed"
                                            menuPortalTarget={typeof window !== "undefined" ? document.body : null}
                                        />
                                    </div>
                                    <div className="flex items-center space-x-4 mb-2">
                                        <label className="w-[25%] text-gray-400 text-sm">{translations["Postal Code"]}</label>
                                        <input
                                            value={formData.postal_code}
                                            onChange={(e) => {
                                                const value = e.target.value;
                                                setFormData((prev) => ({ ...prev, postal_code: value }));
                                                if (!isDirtyRef.current) setIsDirty(true);
                                            }}
                                            className="flex-1 px-3 py-2 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm"
                                        />
                                    </div>
                                </div>
                            </fieldset>
                            <fieldset className="grid grid-cols-12 gap-4 border-[1px] border-[#ffffff1a] rounded-lg p-4 mb-2">
                                <div className="col-span-12 md:col-span-4">
                                    <div className="flex items-center space-x-4 mb-2">
                                        <label className="w-[25%] text-gray-400 text-sm">{translations["Bank Name"]}</label>
                                        <input
                                            type="text"
                                            hidden={lang === "cn"}
                                            value={formData.bank_name_en}
                                            onChange={(e) => {
                                                const value = e.target.value;
                                                setFormData((prev) => ({ ...prev, bank_name_en: value }));
                                                if (!isDirtyRef.current) setIsDirty(true);
                                            }}
                                            className="flex-1 px-3 py-2 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm"
                                        />
                                        <input
                                            type="text"
                                            hidden={lang === "en"}
                                            value={formData.bank_name_cn}
                                            onChange={(e) => {
                                                const value = e.target.value;
                                                setFormData((prev) => ({ ...prev, bank_name_cn: value }));
                                                if (!isDirtyRef.current) setIsDirty(true);
                                            }}
                                            className="flex-1 px-3 py-2 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm"
                                        />
                                    </div>
                                    <div className="flex items-center space-x-4 mb-2">
                                        <label className="w-[25%] text-gray-400 text-sm">{translations["Account Name"]}</label>
                                        <input
                                            type="text"
                                            hidden={lang === "cn"}
                                            value={formData.bank_account_name_en}
                                            onChange={(e) => {
                                                const value = e.target.value;
                                                setFormData((prev) => ({ ...prev, bank_account_name_en: value }));
                                                if (!isDirtyRef.current) setIsDirty(true);
                                            }}
                                            className="flex-1 px-3 py-2 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm"
                                        />
                                        <input
                                            type="text"
                                            hidden={lang === "en"}
                                            value={formData.bank_account_name_cn}
                                            onChange={(e) => {
                                                const value = e.target.value;
                                                setFormData((prev) => ({ ...prev, bank_account_name_cn: value }));
                                                if (!isDirtyRef.current) setIsDirty(true);
                                            }}
                                            className="flex-1 px-3 py-2 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm"
                                        />
                                    </div>
                                    <div className="flex items-center space-x-4 mb-2">
                                        <label className="w-[25%] text-gray-400 text-sm">{translations["Account No"]}</label>
                                        <input
                                            type="text"
                                            value={formData.bank_account_no}
                                            onChange={(e) => {
                                                const value = e.target.value;
                                                setFormData((prev) => ({ ...prev, bank_account_no: value }));
                                                if (!isDirtyRef.current) setIsDirty(true);
                                            }}
                                            className="flex-1 px-3 py-2 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm"
                                        />
                                    </div>
                                    <div className="flex items-center space-x-4 mb-2">
                                        <label className="w-[25%] text-gray-400 text-sm">{translations["Swift Code"]}</label>
                                        <input
                                            type="text"
                                            value={formData.bank_swift_code}
                                            onChange={(e) => {
                                                const value = e.target.value;
                                                setFormData((prev) => ({ ...prev, bank_swift_code: value }));
                                                if (!isDirtyRef.current) setIsDirty(true);
                                            }}
                                            className="flex-1 px-3 py-2 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm"
                                        />
                                    </div>
                                    <div className="flex items-center space-x-4 mb-2">
                                        <label className="w-[25%] text-gray-400 text-sm">{translations["IBAN"]}</label>
                                        <input
                                            type="text"
                                            value={formData.iban}
                                            onChange={(e) => {
                                                const value = e.target.value;
                                                setFormData((prev) => ({ ...prev, iban: value }));
                                                if (!isDirtyRef.current) setIsDirty(true);
                                            }}
                                            className="flex-1 px-3 py-2 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm"
                                        />
                                    </div>
                                    <div className="flex items-center space-x-4 mb-2">
                                        <label className="w-[25%] text-gray-400 text-sm">{translations["Contact No"]}</label>
                                        <input
                                            type="text"
                                            value={formData.bank_tel_no}
                                            onChange={(e) => {
                                                const value = e.target.value;
                                                setFormData((prev) => ({ ...prev, bank_tel_no: value }));
                                                if (!isDirtyRef.current) setIsDirty(true);
                                            }}
                                            className="flex-1 px-3 py-2 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm"
                                        />
                                    </div>
                                    <div className="flex items-center space-x-4 mb-2">
                                        <label className="w-[26%] text-gray-400 text-sm">{translations["Tax Group"]}</label>
                                        <Select
                                            classNamePrefix="react-select"
                                            value={formData.tax}
                                            onChange={(selected) => {
                                                setFormData({ ...formData, tax: selected as OptionType | null });
                                                if (!isDirtyRef.current) {
                                                    setIsDirty(true); // ✅ only if user is editing
                                                }
                                            }}
                                            options={taxGroupOption}
                                            styles={{
                                                ...selectStyles,
                                                menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                                            }}
                                            className="w-[75%]"
                                            isClearable
                                            placeholder={translations["Select"]}
                                            menuPlacement="auto"
                                            menuPosition="fixed"
                                            menuPortalTarget={typeof window !== "undefined" ? document.body : null}
                                        />
                                    </div>
                                </div>
                                <div className="col-span-12 md:col-span-4">
                                    <div className="flex items-center space-x-4 mb-2">
                                        <label className="w-[25%] text-gray-400 text-sm">{translations["Bank Address"]}</label>
                                        <textarea
                                            value={formData.bank_address_en}
                                            hidden={lang === "cn"}
                                            rows={10}
                                            onChange={(e) => {
                                                const value = e.target.value;
                                                setFormData((prev) => ({ ...prev, bank_address_en: value }));
                                                if (!isDirtyRef.current) setIsDirty(true);
                                            }}
                                            className={`flex-1 px-3 py-2 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm ${lang === "cn" ? "hidden" : ""}`}
                                        />
                                        <textarea
                                            value={formData.bank_address_cn}
                                            hidden={lang === "en"}
                                            rows={10}
                                            onChange={(e) => {
                                                const value = e.target.value;
                                                setFormData((prev) => ({ ...prev, bank_address_cn: value }));
                                                if (!isDirtyRef.current) setIsDirty(true);
                                            }}
                                            className={`flex-1 px-3 py-2 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm ${lang === "cn" ? "hidden" : ""}`}
                                        />
                                    </div>
                                    <div className="flex items-center space-x-4 mb-2">
                                        <label className="w-[26%] text-gray-400 text-sm">{translations["Country"]}</label>
                                        <Select
                                            classNamePrefix="react-select"
                                            value={formData.bank_country}
                                            onChange={(selected) => {
                                                setFormData({ ...formData, bank_country: selected as OptionType | null });
                                                if (!isDirtyRef.current) {
                                                    setIsDirty(true); // ✅ only if user is editing
                                                }
                                            }}
                                            options={countriesOption}
                                            styles={{
                                                ...selectStyles,
                                                menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                                            }}
                                            className="w-[75%]"
                                            isClearable
                                            placeholder={translations["Select"]}
                                            menuPlacement="auto"
                                            menuPosition="fixed"
                                            menuPortalTarget={typeof window !== "undefined" ? document.body : null}
                                        />
                                    </div>
                                    <div className="flex items-center space-x-4 mb-2">
                                        <label className="w-[26%] text-gray-400 text-sm">{translations["State"]}</label>
                                        <Select
                                            classNamePrefix="react-select"
                                            value={formData.bank_country_state}
                                            onChange={(selected) => {
                                                setFormData({ ...formData, bank_country_state: selected as OptionType | null });
                                                if (!isDirtyRef.current) {
                                                    setIsDirty(true); // ✅ only if user is editing
                                                }
                                            }}
                                            options={statesOption}
                                            styles={{
                                                ...selectStyles,
                                                menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                                            }}
                                            className="w-[75%]"
                                            isClearable
                                            placeholder={translations["Select"]}
                                            menuPlacement="auto"
                                            menuPosition="fixed"
                                            menuPortalTarget={typeof window !== "undefined" ? document.body : null}
                                        />
                                    </div>
                                </div>
                            </fieldset>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
    const renderInvoices = () => (
        <div className="p-2">
            <div className="flex-shrink-0" style={{ borderColor: "#404040" }}>
                <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-4">
                        <div className="relative">
                            <input
                                type="search"
                                value={searchTerm_Invoices}
                                onChange={(e) => {
                                    setSearchTerm_Invoices(e.target.value);
                                    setCurrentPage_Invoices(1);
                                }}
                                placeholder={translations["Search"]}
                                className="pl-10 pr-4 py-2 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-sm"
                                style={{ backgroundColor: "#2d2d30", borderColor: "#555555" }}
                            />
                        </div>
                    </div>
                </div>
            </div>
            <div className="overflow-x-auto mt-5">
                <div className="h-[calc(100vh-270px)] overflow-x-auto">
                    <table className="w-full">
                        <thead className="sticky top-0 z-[1]" style={{ backgroundColor: "#1f2132" }}>
                            <tr className="border-b" style={{ borderColor: "#2d2d30" }}>
                                <th className="w-[3%] px-2 py-2 text-left text-gray-400 text-sm"></th>
                                <th className="w-[3%] px-2 py-2 text-center text-gray-400 text-sm">
                                    <div className="flex justify-center items-center">
                                        <CustomCheckbox
                                            checked={selectedSupplierInvoices.length === supplierInvoices.length && supplierInvoices.length > 0}
                                            onChange={(checked) => handleSelectedAllSuppInvoices(checked)}
                                        />
                                    </div>
                                </th>
                                <th className="w-[10%] px-2 py-2 text-left text-gray-400 text-sm">{translations["AP Date"]}</th>
                                <th className="w-[15%] px-2 py-2 text-left text-gray-400 text-sm">{translations["A/P Invoice No."]}</th>
                                <th className="w-[13%] px-2 py-2 text-left text-gray-400 text-sm">{translations["Supplier"]}</th>
                                <th className="w-[21%] px-2 py-2 text-left text-gray-400 text-sm">{translations["Supplier Name"]}</th>
                                <th className="w-[15%] px-2 py-2 text-left text-gray-400 text-sm">{translations["PV No"]}</th>
                                <th className="w-[10%] px-2 py-2 text-center text-gray-400 text-sm">{translations["Total"]}</th>
                                <th className="w-[19%] px-2 py-2 text-center text-gray-400 text-sm">{translations["Invoice Status"]}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {supplierInvoices.length === 0 && (
                                <tr className="border-b hover:bg-gray-700 hover:bg-opacity-30 transition-colors" style={{ borderColor: "#40404042" }}>
                                    <td colSpan={12} className="px-2 py-2 text-center text-gray-300 text-sm">
                                        {translations["No Record Found"]}
                                    </td>
                                </tr>
                            )}
                            {supplierInvoices.map((list, index) => (
                                <React.Fragment key={list.id || index}>
                                    <tr className="border-b hover:bg-gray-700 hover:bg-opacity-30 transition-colors" style={{ borderColor: "#40404042" }}>
                                        <td className="px-2 py-2 text-center text-gray-400 text-sm">
                                            <button
                                                onClick={() => handleToggleRow_Invoices(list.id, list.ap_number)}
                                                className={`px-1 py-1 ${
                                                    expanded_Invoices.includes(list.id) ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"
                                                } text-white rounded-lg transition-colors text-xs`}
                                            >
                                                {expanded_Invoices.includes(list.id) ? <Minus size={16} /> : <Plus size={16} />}
                                            </button>
                                        </td>
                                        <td className="px-2 py-2 text-center text-gray-400 text-sm">
                                            <div className="flex justify-center items-center">
                                                <CustomCheckbox
                                                    checked={selectedSupplierInvoices.includes(list.id as number)}
                                                    onChange={(checked) => handleSelectSuppInvoices(list.id as number, checked)}
                                                />
                                            </div>
                                        </td>

                                        <td className="px-2 py-2 text-left text-gray-400 text-sm">{formatDate(list.ap_date, lang)}</td>
                                        <td className="py-2 px-2">
                                            <div className="flex items-center space-x-3">
                                                <div>
                                                    <div className="group flex items-center">
                                                        <p className="text-gray-400 text-custom-sm select-text">{highlightMatch(list.ap_number, searchTerm_Invoices)}</p>
                                                        <CopyToClipboard text={list.ap_number || ""} />
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-2 px-2 text-gray-400 text-left text-custom-sm">{highlightMatch(list.supplier_code, searchTerm_Invoices)}</td>
                                        <td className="py-2 px-2 text-gray-400 text-left text-custom-sm">{lang === "en" ? list.suppliername_en : list.suppliername_cn}</td>
                                        <td className="py-2 px-2 text-gray-400 text-left text-custom-sm">
                                            <div className="flex items-center space-x-3">
                                                <div>
                                                    <div className="group flex items-center">
                                                        <p className="text-gray-400 text-custom-sm select-text">{list.pvoucher_no}</p>
                                                        <CopyToClipboard text={list.pvoucher_no || ""} />
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-2 px-2 text-gray-400 text-center text-custom-sm">
                                            {list.currency}
                                            <br />
                                            {formatMoney(list.total)}
                                        </td>
                                        <td className="py-2 px-2 text-gray-400 text-center text-custom-sm">{lang === "en" ? list.invoice_status_en : list.invoice_status_cn}</td>
                                    </tr>
                                    {expanded_Invoices.includes(list.id) && (
                                        <tr>
                                            <td colSpan={9} className="py-2 px-2">
                                                <table className="w-full" style={{ backgroundColor: "#060818" }}>
                                                    <thead className="sticky top-0 z-[1] py-1 px-4" style={{ backgroundColor: "#1f2132" }}>
                                                        <tr className="border-b" style={{ borderColor: "#2d2d30" }}>
                                                            <th className="w-[12%] text-left py-2 px-2 text-gray-400 text-sm w-12">{translations["Product Code"]}</th>
                                                            <th className="w-[27%] text-left py-2 px-2 text-gray-400 text-sm w-12">{translations["Product Name"]}</th>
                                                            <th className="w-[10%] text-left py-2 px-2 text-gray-400 text-sm w-12">{translations["PO Number"]}</th>
                                                            <th className="w-[10%] text-left py-2 px-2 text-gray-400 text-sm w-12">{translations["GRN No"]}</th>
                                                            <th className="w-[10%] text-center py-2 px-2 text-gray-400 text-sm w-12">{translations["Qty"]}</th>
                                                            <th className="w-[10%] text-center py-2 px-2 text-gray-400 text-sm w-12">{translations["Price"]}</th>
                                                            <th className="w-[10%] text-center py-2 px-2 text-gray-400 text-sm w-12">{translations["Total"]}</th>
                                                            <th className="w-[10%] text-left py-2 px-2 text-gray-400 text-sm w-12">{translations["Received Date"]}</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {invoicesDetailsMap[list.id] && invoicesDetailsMap[list.id]!.length > 0 ? (
                                                            invoicesDetailsMap[list.id]!.map((detail, i) => (
                                                                <tr key={detail.id || i}>
                                                                    <td className="py-2 px-2 text-gray-400 text-left text-custom-sm">
                                                                        <div className="group flex items-center">
                                                                            <p className="text-gray-400 text-custom-sm">{highlightMatch(detail.product_code, searchTerm_Invoices)}</p>
                                                                            <CopyToClipboard text={detail.product_code} />
                                                                        </div>
                                                                    </td>
                                                                    <td className="py-2 px-2 text-gray-400 text-left text-custom-sm">
                                                                        <div className="group flex items-center">
                                                                            <p className="text-gray-400 text-custom-sm">
                                                                                {highlightMatch(lang === "en" ? detail.product_title_en : detail.product_title_cn, searchTerm_Invoices)}
                                                                            </p>
                                                                            <CopyToClipboard text={lang === "en" ? detail.product_title_en : detail.product_title_cn} />
                                                                        </div>
                                                                    </td>
                                                                    <td className="py-2 px-2 text-gray-400 text-left text-custom-sm">
                                                                        <div className="group flex items-center">
                                                                            <p className="text-gray-400 text-custom-sm">{highlightMatch(detail.po_number, searchTerm_Invoices)}</p>
                                                                            <CopyToClipboard text={detail.po_number} />
                                                                        </div>
                                                                    </td>
                                                                    <td className="py-2 px-2 text-gray-400 text-left text-custom-sm">
                                                                        <div className="group flex items-center">
                                                                            <p className="text-gray-400 text-custom-sm">{highlightMatch(detail.product_code, searchTerm_Invoices)}</p>
                                                                            <CopyToClipboard text={detail.product_code} />
                                                                        </div>
                                                                    </td>
                                                                    <td className="py-2 px-2 text-gray-400 text-center text-custom-sm">{detail.qty}</td>
                                                                    <td className="py-2 px-2 text-gray-400 text-center text-custom-sm">
                                                                        {detail.currency} {formatMoney(detail.price)}
                                                                    </td>
                                                                    <td className="py-2 px-2 text-gray-400 text-center text-custom-sm">
                                                                        {detail.currency} {formatMoney(detail.total)}
                                                                    </td>
                                                                    <td className="py-2 px-2 text-gray-400 text-left text-custom-sm">{formatDate(detail.ap_date, lang)}</td>
                                                                </tr>
                                                            ))
                                                        ) : (
                                                            <tr>
                                                                <td colSpan={8} className="py-2 px-2 text-center text-gray-400 text-sm">
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
                    </table>
                </div>
                {/* Footer with Pagination */}
                <div className="p-4 border-t flex items-center justify-between" style={{ borderColor: "#404040" }}>
                    <div className="flex items-center space-x-1">
                        <MemoizedPagination currentPage={currentPage_Invoices} totalPages={totalPages_Invoices} onPageChange={(page) => setCurrentPage_Invoices(page)} />
                        <MemoizedItemsPerPageSelector
                            value={itemsPerPage_Invoices}
                            onChange={(val: number) => {
                                setitemsPerPage_Invoices(val);
                                setCurrentPage_Invoices(1);
                            }}
                            options={pageSizeOptions}
                        />
                        <ExportReportSelector
                            formats={["odt"]}
                            baseName="SupplierInvoices"
                            ids={selectedSupplierInvoices.length > 0 ? selectedSupplierInvoices : supplierInvoices.map((p) => p.id)}
                            language={lang}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
    const renderPrepaid = () => (
        <div className="p-2">
            <div className="flex-shrink-0" style={{ borderColor: "#404040" }}>
                <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-4">
                        <div className="relative">
                            <input
                                type="search"
                                value={searchTerm_Prepaid}
                                onChange={(e) => {
                                    setsearchTerm_Prepaid(e.target.value);
                                    setCurrentPage_Prepaid(1);
                                }}
                                placeholder={translations["Search"]}
                                className="pl-10 pr-4 py-2 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-sm"
                                style={{ backgroundColor: "#2d2d30", borderColor: "#555555" }}
                            />
                        </div>
                    </div>
                </div>
            </div>
            <div className="overflow-x-auto mt-5">
                <div className="h-[calc(100vh-270px)] overflow-y-auto">
                    <table className="w-full">
                        <thead className="sticky top-0 z-[1]" style={{ backgroundColor: "#1f2132" }}>
                            <tr className="border-b" style={{ borderColor: "#2d2d30" }}>
                                <th className="w-[3%] px-2 py-2 text-left text-gray-400 text-sm"></th>
                                <th className="w-[3%] px-2 py-2 text-center text-gray-400 text-sm">
                                    <div className="flex justify-center items-center">
                                        <CustomCheckbox
                                            checked={selectedSupplierPrepaid.length === supplierPrepaid.length && supplierPrepaid.length > 0}
                                            onChange={(checked) => handleSelectedAllSuppPrepaid(checked)}
                                        />
                                    </div>
                                </th>
                                <th className="w-[19%] px-2 py-2 text-left text-gray-400 text-sm">{translations["Date"]}</th>
                                <th className="w-[20%] px-2 py-2 text-left text-gray-400 text-sm">{translations["Purchase Order"]}</th>
                                <th className="w-[15%] px-2 py-2 text-left text-gray-400 text-sm">{translations["Payment Voucher"]}</th>
                                <th className="w-[20%] px-2 py-2 text-center text-gray-400 text-sm">{translations["Total PO Amount"]}</th>
                                <th className="w-[20%] px-2 py-2 text-center text-gray-400 text-sm">{translations["Total Prepaid Amount"]}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {supplierPrepaid.length === 0 && (
                                <tr className="border-b hover:bg-gray-700 hover:bg-opacity-30 transition-colors" style={{ borderColor: "#40404042" }}>
                                    <td colSpan={12} className="px-2 py-2 text-center text-gray-300 text-sm">
                                        {translations["No Record Found"]}
                                    </td>
                                </tr>
                            )}
                            {supplierPrepaid.map((list, index) => (
                                <React.Fragment key={list.id || index}>
                                    <tr className="border-b hover:bg-gray-700 hover:bg-opacity-30 transition-colors" style={{ borderColor: "#40404042" }}>
                                        <td className="px-2 py-2 text-left text-gray-300 text-sm">
                                            <button
                                                onClick={() => handleToggleRow_Prepaid(list.id, list.pvoucher_no)}
                                                className={`px-1 py-1 ${
                                                    expanded_Prepaid.includes(list.id) ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"
                                                } text-white rounded-lg transition-colors text-xs`}
                                            >
                                                {expanded_Prepaid.includes(list.id) ? <Minus size={16} /> : <Plus size={16} />}
                                            </button>
                                        </td>
                                        <td className="px-2 py-2 text-center text-gray-300 text-sm">
                                            <div className="flex justify-center items-center">
                                                <CustomCheckbox
                                                    checked={selectedSupplierPrepaid.includes(list.id as number)}
                                                    onChange={(checked) => handleSelectSuppPrepaid(list.id as number, checked)}
                                                />
                                            </div>
                                        </td>
                                        <td className="py-2 px-2 text-gray-400 text-left text-custom-sm">{formatDate(list.po_date, lang)}</td>
                                        <td className="py-2 px-2 text-gray-400 text-left text-custom-sm">
                                            <div>
                                                <div className="group flex items-center">
                                                    <p className="text-custom-sm select-text">{highlightMatch(list.po_number, searchTerm_Prepaid)}</p>
                                                    <CopyToClipboard text={list.po_number || ""} />
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-2 px-2 text-gray-400 text-center text-custom-sm">
                                            <div>
                                                <div className="group flex items-center">
                                                    <p className="text-custom-sm select-text">{list.pvoucher_no}</p>
                                                    <CopyToClipboard text={list.pvoucher_no || ""} />
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-2 px-2 text-gray-400 text-center text-custom-sm">
                                            {list.currency}
                                            <br></br>
                                            {formatMoney(list.po_amount)}
                                        </td>
                                        <td className="py-2 px-2 text-gray-400 text-center text-custom-sm">
                                            {list.currency}
                                            <br></br>
                                            {formatMoney(list.deposit)}
                                        </td>
                                    </tr>
                                    {expanded_Prepaid.includes(list.id) && (
                                        <tr>
                                            <td colSpan={12} className="py-2 px-2">
                                                <table className="w-full" style={{ backgroundColor: "#060818" }}>
                                                    <thead className="sticky top-0 z-[1] py-1 px-4" style={{ backgroundColor: "#1f2132" }}>
                                                        <tr className="border-b" style={{ borderColor: "#2d2d30" }}>
                                                            <th className="text-left py-2 px-2 text-gray-400 text-sm w-12">{translations["Payment Date"]}</th>
                                                            <th className="text-left py-2 px-2 text-gray-400 text-sm w-12">{translations["Product Code"]}</th>
                                                            <th className="text-left py-2 px-2 text-gray-400 text-sm w-12">{translations["Product Name"]}</th>
                                                            <th className="text-center py-2 px-2 text-gray-400 text-sm w-12">{translations["Qty"]}</th>
                                                            <th className="text-center py-2 px-2 text-gray-400 text-sm w-12">{translations["Deposit"]}</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {prepaidDetailsMap[list.id] && prepaidDetailsMap[list.id]!.length > 0 ? (
                                                            prepaidDetailsMap[list.id]!.map((detail, i) => (
                                                                <tr key={detail.id || i}>
                                                                    <td className="py-2 px-2 text-gray-400 text-center text-custom-sm">{formatDate(detail.pv_date, lang)}</td>
                                                                    <td className="py-2 px-2 text-gray-400 text-left text-custom-sm">
                                                                        <div className="group flex items-center">
                                                                            <p className="text-gray-400 text-custom-sm">{highlightMatch(detail.product_code, searchTerm_Prepaid)}</p>
                                                                            <CopyToClipboard text={detail.product_code} />
                                                                        </div>
                                                                    </td>
                                                                    <td className="py-2 px-2 text-gray-400 text-left text-custom-sm">
                                                                        <div className="group flex items-center">
                                                                            <p className="text-gray-400 text-custom-sm">
                                                                                {highlightMatch(lang === "en" ? detail.product_title_en : detail.product_title_cn, searchTerm_Prepaid)}
                                                                            </p>
                                                                            <CopyToClipboard text={lang === "en" ? detail.product_title_en : detail.product_title_cn} />
                                                                        </div>
                                                                    </td>
                                                                    <td className="py-2 px-2 text-gray-400 text-center text-custom-sm">{detail.qty}</td>
                                                                    <td className="py-2 px-2 text-gray-400 text-center text-custom-sm">
                                                                        {detail.currency} {formatMoney(detail.amount)}
                                                                    </td>
                                                                </tr>
                                                            ))
                                                        ) : (
                                                            <tr>
                                                                <td colSpan={5} className="py-2 px-2 text-center text-gray-400 text-sm">
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
                    </table>
                </div>
                {/* Footer with Pagination */}
                <div className="p-4 border-t flex items-center justify-between" style={{ borderColor: "#404040" }}>
                    <div className="flex items-center space-x-1">
                        <MemoizedPagination currentPage={currentPage_Prepaid} totalPages={totalPages_Prepaid} onPageChange={(page) => setCurrentPage_Prepaid(page)} />
                        <MemoizedItemsPerPageSelector
                            value={itemsPerPage_Prepaid}
                            onChange={(val: number) => {
                                setitemsPerPage_Prepaid(val);
                                setCurrentPage_Prepaid(1);
                            }}
                            options={pageSizeOptions}
                        />
                        <ExportReportSelector
                            formats={["odt"]}
                            baseName="SupplierPrepaid"
                            ids={selectedSupplierPrepaid.length > 0 ? selectedSupplierPrepaid : supplierPrepaid.map((p) => p.id)}
                            language={lang}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
    const renderProfitability = () => (
        <div className="p-2">
            <div className="flex-shrink-0" style={{ borderColor: "#404040" }}>
                <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-4">
                        <div className="relative">
                            <input
                                type="search"
                                value={searchTerm_Profitability}
                                onChange={(e) => {
                                    setSearchTerm_Profitability(e.target.value);
                                    setCurrentPage_Profitability(1);
                                }}
                                placeholder={translations["Search"]}
                                className="pl-10 pr-4 py-2 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-sm"
                                style={{ backgroundColor: "#2d2d30", borderColor: "#555555" }}
                            />
                        </div>
                    </div>
                </div>
            </div>
            <div className="overflow-x-auto mt-5">
                <div className="h-[calc(100vh-270px)] overflow-y-auto">
                    <table className="w-full">
                        <thead className="sticky top-0 z-[1]" style={{ backgroundColor: "#1f2132" }}>
                            <tr className="border-b" style={{ borderColor: "#2d2d30" }}>
                                <th className="w-[5%] px-2 py-2 text-center text-gray-400 text-sm">
                                    <div className="flex justify-center items-center">
                                        <CustomCheckbox
                                            checked={selectedSupplierProfitability.length === supplierProfitability.length && supplierProfitability.length > 0}
                                            onChange={(checked) => handleSelectedAllSuppProfitability(checked)}
                                        />
                                    </div>
                                </th>
                                <th className="w-[15%] px-2 py-2 text-left text-gray-400 text-sm">{translations["PO Number"]}</th>
                                <th className="w-[12%] px-2 py-2 text-left text-gray-400 text-sm">{translations["Product Code"]}</th>
                                <th className="w-[28%] px-2 py-2 text-left text-gray-400 text-sm">{translations["Product Name"]}</th>
                                <th className="w-[10%] px-2 py-2 text-center text-gray-400 text-sm">{translations["Total Sales"]}</th>
                                <th className="w-[10%] px-2 py-2 text-center text-gray-400 text-sm">{translations["Total Cost"]}</th>
                                <th className="w-[10%] px-2 py-2 text-center text-gray-400 text-sm">{translations["Total Profit"]}</th>
                                <th className="w-[10%] px-2 py-2 text-center text-gray-400 text-sm">{translations["Profit"]}%</th>
                            </tr>
                        </thead>
                        <tbody>
                            {supplierProfitability.length === 0 && (
                                <tr className="border-b hover:bg-gray-700 hover:bg-opacity-30 transition-colors" style={{ borderColor: "#40404042" }}>
                                    <td colSpan={8} className="px-2 py-2 text-center text-gray-300 text-sm">
                                        {translations["No Record Found"]}
                                    </td>
                                </tr>
                            )}
                            {supplierProfitability.map((list, index) => (
                                <React.Fragment key={list.id || index}>
                                    <tr className="border-b hover:bg-gray-700 hover:bg-opacity-30 transition-colors" style={{ borderColor: "#40404042" }}>
                                        <td className="px-2 py-2 text-center text-gray-300 text-sm">
                                            <div className="flex justify-center items-center">
                                                <CustomCheckbox
                                                    checked={selectedSupplierProfitability.includes(list.id as number)}
                                                    onChange={(checked) => handleSelectSuppProfitability(list.id as number, checked)}
                                                />
                                            </div>
                                        </td>
                                        <td className="py-2 px-2 text-gray-400 text-left text-custom-sm">{list.po_number}</td>
                                        <td className="py-2 px-2 text-gray-400 text-left text-custom-sm">
                                            <div>
                                                <div className="group flex items-center">
                                                    <p className="text-custom-sm select-text">{highlightMatch(list.product_code, searchTerm_Profitability)}</p>
                                                    <CopyToClipboard text={list.product_code || ""} />
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-2 px-2 text-gray-400 text-center text-custom-sm">
                                            <div>
                                                <div className="group flex items-center">
                                                    <p className="text-custom-sm select-text">
                                                        {highlightMatch(lang === "en" ? list.product_title_en : list.product_title_cn, searchTerm_Profitability)}
                                                    </p>
                                                    <CopyToClipboard text={lang === "en" ? list.product_title_en : list.product_title_cn} />
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-2 px-2 text-gray-400 text-center text-custom-sm">
                                            {baseCurrency()}
                                            <br></br>
                                            {formatMoney(list.total_sales)}
                                        </td>
                                        <td className="py-2 px-2 text-gray-400 text-center text-custom-sm">
                                            {baseCurrency()}
                                            <br></br>
                                            {formatMoney(list.total_cost)}
                                        </td>
                                        <td className="py-2 px-2 text-gray-400 text-center text-custom-sm">
                                            {baseCurrency()}
                                            <br></br>
                                            {formatMoney(list.total_profit)}
                                        </td>
                                        <td className="py-2 px-2 text-gray-400 text-center text-custom-sm">{list.profit_percentage}%</td>
                                    </tr>
                                </React.Fragment>
                            ))}
                        </tbody>
                        <tfoot>
                            {supplierProfitabilityFooter && (
                                <>
                                    <tr className="border-b hover:bg-gray-700 hover:bg-opacity-30 transition-colors" style={{ borderColor: "#40404042" }}>
                                        <td className="py-1 px-1 text-gray-400 text-center text-custom-sm"></td>
                                        <td className="py-1 px-1 text-gray-400 text-center text-custom-sm"></td>
                                        <td className="py-1 px-1 text-gray-400 text-right text-custom-sm"></td>
                                        <td className="py-1 px-1 text-gray-400 text-center text-custom-sm"></td>
                                        <td className="py-1 px-1 text-gray-400 text-center text-custom-sm">{formatMoney(supplierProfitabilityFooter.total_sales)}</td>
                                        <td className="py-1 px-1 text-gray-400 text-center text-custom-sm">{formatMoney(supplierProfitabilityFooter.total_cost)}</td>
                                        <td className="py-1 px-1 text-gray-400 text-center text-custom-sm">{formatMoney(supplierProfitabilityFooter.total_profit)}</td>
                                        <td className="py-1 px-1 text-gray-400 text-center text-custom-sm">{supplierProfitabilityFooter.total_profit_percentage}%</td>
                                    </tr>
                                </>
                            )}
                        </tfoot>
                    </table>
                </div>
                {/* Footer with Pagination */}
                <div className="p-4 border-t flex items-center justify-between" style={{ borderColor: "#404040" }}>
                    <div className="flex items-center space-x-1">
                        <MemoizedPagination currentPage={currentPage_SalesOrder} totalPages={totalPages_SalesOrder} onPageChange={(page) => setCurrentPage_Profitability(page)} />
                        <MemoizedItemsPerPageSelector
                            value={itemsPerPage_SalesOrder}
                            onChange={(val: number) => {
                                setItemsPerPage_SalesOrder(val);
                                setCurrentPage_Profitability(1);
                            }}
                            options={pageSizeOptions}
                        />
                        <ExportReportSelector
                            formats={["odt"]}
                            baseName="SupplierProfit"
                            ids={selectedSupplierProfitability.length > 0 ? selectedSupplierProfitability : supplierProfitability.map((p) => p.id)}
                            language={lang}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
    const renderReceiveItems = () => (
        <div className="p-2">
            <div className="flex-shrink-0" style={{ borderColor: "#404040" }}>
                <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-4">
                        <div className="relative">
                            <input
                                type="search"
                                value={searchTerm_ReceivedItems}
                                onChange={(e) => {
                                    setSearchTerm_ReceivedItems(e.target.value);
                                    setCurrentPage_ReceivedItems(1);
                                }}
                                placeholder={translations["Search"]}
                                className="pl-10 pr-4 py-2 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-sm"
                                style={{ backgroundColor: "#2d2d30", borderColor: "#555555" }}
                            />
                        </div>
                    </div>
                </div>
            </div>
            <div className="overflow-x-auto mt-5">
                <div className="h-[calc(100vh-270px)] overflow-y-auto">
                    <table className="w-full">
                        <thead className="sticky top-0 z-[1]" style={{ backgroundColor: "#1f2132" }}>
                            <tr className="border-b" style={{ borderColor: "#2d2d30" }}>
                                <th className="w-[3%] px-2 py-2 text-left text-gray-400 text-sm"></th>
                                <th className="w-[10%] px-2 py-2 text-left text-gray-400 text-sm">{translations["Date"]}</th>
                                <th className="w-[10%] px-2 py-2 text-left text-gray-400 text-sm">{translations["GRN No."]}</th>
                                <th className="w-[23%] px-2 py-2 text-left text-gray-400 text-sm">{translations["Product"]}</th>
                                <th className="w-[8%] px-2 py-2 text-center text-gray-400 text-sm">{translations["Total Amount"]}</th>
                                <th className="w-[8%] px-2 py-2 text-center text-gray-400 text-sm">{translations["Default Currency"]}</th>
                                <th className="w-[13%] px-2 py-2 text-left text-gray-400 text-sm">{translations["Invoice No"]}</th>
                                <th className="w-[12%] px-2 py-2 text-left text-gray-400 text-sm">{translations["PO No."]}</th>
                                <th className="w-[8%] px-2 py-2 text-center text-gray-400 text-sm">{translations["Received Qty"]}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {supplierReceivedItems.length === 0 && (
                                <tr className="border-b hover:bg-gray-700 hover:bg-opacity-30 transition-colors" style={{ borderColor: "#40404042" }}>
                                    <td colSpan={12} className="px-2 py-2 text-center text-gray-300 text-sm">
                                        {translations["No Record Found"]}
                                    </td>
                                </tr>
                            )}
                            {supplierReceivedItems.map((list, index) => (
                                <React.Fragment key={list.id || index}>
                                    <tr className="border-b hover:bg-gray-700 hover:bg-opacity-30 transition-colors" style={{ borderColor: "#40404042" }}>
                                        <td className="px-2 py-2 text-gray-300 text-sm flex justify-center items-center">
                                            <CustomCheckbox
                                                checked={selectedSupplierInvoices.includes(list.id as number)}
                                                onChange={(checked) => handleSelectSuppInvoices(list.id as number, checked)}
                                            />
                                        </td>
                                        <td className="py-2 px-2 text-gray-400 text-left text-custom-sm">{formatDate(list.grn_date, lang)}</td>
                                        <td className="py-2 px-2 text-gray-400 text-left text-custom-sm">
                                            <div>
                                                <div className="group flex items-center">
                                                    <p className="text-custom-sm select-text">{highlightMatch(list.grn_no, searchTerm_ReceivedItems)}</p>
                                                    <CopyToClipboard text={list.grn_no || ""} />
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-2 px-2 text-gray-400 text-left text-custom-sm">
                                            <div>
                                                <div className="group flex items-center">
                                                    <p className="text-gray-300 text-custom-sm select-text">{highlightMatch(list.product_code, searchTerm_ReceivedItems)}</p>
                                                    <CopyToClipboard text={list.product_code} />
                                                </div>
                                                <div className="group flex items-center">
                                                    <p className="text-gray-400 text-custom-sm">
                                                        {highlightMatch(lang == "en" ? list.product_title_en : list.product_title_cn, searchTerm_ReceivedItems)}
                                                    </p>
                                                    <CopyToClipboard text={lang == "en" ? list.product_title_en : list.product_title_cn} />
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-2 px-2 text-gray-400 text-center text-custom-sm">
                                            {list.currency}
                                            <br></br>
                                            {formatMoney(list.total)}
                                        </td>
                                        <td className="py-2 px-2 text-gray-400 text-center text-custom-sm">
                                            {baseCurrency()}
                                            <br></br>
                                            {formatMoney(list.base_total)}
                                        </td>
                                        <td className="py-2 px-2 text-gray-400 text-left text-custom-sm">
                                            <div className="group flex items-center">
                                                <p className="text-gray-400 text-custom-sm">{highlightMatch(list.ap_invoice_no, searchTerm_ReceivedItems)}</p>
                                                <CopyToClipboard text={list.ap_invoice_no} />
                                            </div>
                                        </td>
                                        <td className="py-2 px-2 text-gray-400 text-left text-custom-sm">
                                            <div className="group flex items-center">
                                                <p className="text-gray-400 text-custom-sm">{list.po_number}</p>
                                                <CopyToClipboard text={list.po_number} />
                                            </div>
                                        </td>
                                        <td className="py-2 px-2 text-gray-400 text-center text-custom-sm">{list.received_qty}</td>
                                    </tr>
                                </React.Fragment>
                            ))}
                        </tbody>
                    </table>
                </div>
                {/* Footer with Pagination */}
                <div className="p-4 border-t flex items-center justify-between" style={{ borderColor: "#404040" }}>
                    <div className="flex items-center space-x-1">
                        <MemoizedPagination currentPage={currentPage_Deposit} totalPages={totalPages_Deposit} onPageChange={(page) => setCurrentPage_ReceivedItems(page)} />
                        <MemoizedItemsPerPageSelector
                            value={itemsPerPage_Deposit}
                            onChange={(val: number) => {
                                setItemsPerPage_Deposit(val);
                                setCurrentPage_ReceivedItems(1);
                            }}
                            options={pageSizeOptions}
                        />
                        <ExportReportSelector
                            formats={["odt"]}
                            baseName="SupplierRecItems"
                            ids={selectedSupplierInvoices.length > 0 ? selectedSupplierInvoices : supplierReceivedItems.map((p) => p.id)}
                            language={lang}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
    const renderItemsOnPO = () => (
        <div className="p-2">
            <div className="flex-shrink-0" style={{ borderColor: "#404040" }}>
                <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-4">
                        <div className="relative">
                            <input
                                type="search"
                                value={searchTerm_ItemsOnPO}
                                onChange={(e) => {
                                    setSearchTerm_ItemsOnPO(e.target.value);
                                    setCurrentPage_ItemsOnPO(1);
                                }}
                                placeholder={translations["Search"]}
                                className="pl-10 pr-4 py-2 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-sm"
                                style={{ backgroundColor: "#2d2d30", borderColor: "#555555" }}
                            />
                        </div>
                    </div>
                </div>
            </div>
            <div className="overflow-x-auto mt-5">
                <div className="h-[calc(100vh-270px)] overflow-y-auto">
                    <table className="w-full">
                        <thead className="sticky top-0 z-[1]" style={{ backgroundColor: "#1f2132" }}>
                            <tr className="border-b" style={{ borderColor: "#2d2d30" }}>
                                <th className="w-[5%] px-2 py-2 text-left text-gray-400 text-sm"></th>
                                <th className="w-[20%] px-2 py-2 text-left text-gray-400 text-sm">{translations["Date"]}</th>
                                <th className="w-[20%] px-2 py-2 text-left text-gray-400 text-sm">{translations["PO Number"]}</th>
                                <th className="w-[15%] px-2 py-2 text-center text-gray-400 text-sm">{translations["Ex Rate"]}</th>
                                <th className="w-[15%] px-2 py-2 text-center text-gray-400 text-sm">{translations["Total Amount"]}</th>
                                <th className="w-[15%] px-2 py-2 text-center text-gray-400 text-sm">{translations["Default Currency"]}</th>
                                <th className="w-[10%] px-2 py-2 text-center text-gray-400 text-sm">{translations["Status"]}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {supplierItemsOnPO.length === 0 && (
                                <tr className="border-b hover:bg-gray-700 hover:bg-opacity-30 transition-colors" style={{ borderColor: "#40404042" }}>
                                    <td colSpan={12} className="px-2 py-2 text-center text-gray-300 text-sm">
                                        {translations["No Record Found"]}
                                    </td>
                                </tr>
                            )}
                            {supplierItemsOnPO.map((list, index) => (
                                <React.Fragment key={list.id || index}>
                                    <tr className="border-b hover:bg-gray-700 hover:bg-opacity-30 transition-colors" style={{ borderColor: "#40404042" }}>
                                        <td className="px-2 py-2 text-center text-gray-300 text-sm">
                                            <button
                                                onClick={() => handleToggleRow_ItemsOnPO(list.id, list.po_number)}
                                                className={`px-1 py-1 ${
                                                    expanded_ItemsOnPO.includes(list.id) ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"
                                                } text-white rounded-lg transition-colors text-xs`}
                                            >
                                                {expanded_ItemsOnPO.includes(list.id) ? <Minus size={16} /> : <Plus size={16} />}
                                            </button>
                                        </td>
                                        <td className="py-2 px-2 text-gray-400 text-left text-custom-sm">{formatDate(list.po_date, lang)}</td>
                                        <td className="py-2 px-2 text-gray-400 text-left text-custom-sm">
                                            <div>
                                                <div className="group flex items-center">
                                                    <p className="text-custom-sm select-text">{highlightMatch(list.po_number, searchTerm_ItemsOnPO)}</p>
                                                    <CopyToClipboard text={list.po_number || ""} />
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-2 px-2 text-gray-400 text-center text-custom-sm">{list.ex_rate}</td>
                                        <td className="py-2 px-2 text-gray-400 text-center text-custom-sm">
                                            {list.currency}
                                            <br></br>
                                            {formatMoney(list.po_amount)}
                                        </td>
                                        <td className="py-2 px-2 text-gray-400 text-center text-custom-sm">
                                            {baseCurrency()}
                                            <br></br>
                                            {formatMoney(list.base_currency)}
                                        </td>
                                        <td className="py-2 px-2 text-gray-400 text-center text-custom-sm">
                                            {highlightMatch(lang === "en" ? list.postatus_en : list.postatus_cn, searchTerm_ItemsOnPO)}
                                        </td>
                                    </tr>
                                    {expanded_ItemsOnPO.includes(list.id) && (
                                        <tr>
                                            <td colSpan={12} className="py-2 px-2">
                                                <table className="w-full" style={{ backgroundColor: "#060818" }}>
                                                    <thead className="sticky top-0 z-[1] py-1 px-4" style={{ backgroundColor: "#1f2132" }}>
                                                        <tr className="border-b" style={{ borderColor: "#2d2d30" }}>
                                                            <th className="text-left py-2 px-2 text-gray-400 text-sm w-12">{translations["Product Code"]}</th>
                                                            <th className="text-left py-2 px-2 text-gray-400 text-sm w-12">{translations["Product Name"]}</th>
                                                            <th className="text-center py-2 px-2 text-gray-400 text-sm w-12">{translations["Qty"]}</th>
                                                            <th className="text-center py-2 px-2 text-gray-400 text-sm w-12">{translations["Price"]}</th>
                                                            <th className="text-center py-2 px-2 text-gray-400 text-sm w-12">{translations["Total"]}</th>
                                                            <th className="text-center py-2 px-2 text-gray-400 text-sm w-12">{translations["Deposit"]}</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {receivedItemsDetailsMap[list.id] && receivedItemsDetailsMap[list.id]!.length > 0 ? (
                                                            receivedItemsDetailsMap[list.id]!.map((detail, i) => (
                                                                <tr key={detail.id || i}>
                                                                    <td className="py-2 px-2 text-gray-400 text-left text-custom-sm">
                                                                        <div className="group flex items-center">
                                                                            <p className="text-gray-400 text-custom-sm">{highlightMatch(detail.product_code, searchTerm_ItemsOnPO)}</p>
                                                                            <CopyToClipboard text={detail.product_code} />
                                                                        </div>
                                                                    </td>
                                                                    <td className="py-2 px-2 text-gray-400 text-left text-custom-sm">
                                                                        <div className="group flex items-center">
                                                                            <p className="text-gray-400 text-custom-sm">
                                                                                {highlightMatch(lang === "en" ? detail.product_title_en : detail.product_title_cn, searchTerm_ItemsOnPO)}
                                                                            </p>
                                                                            <CopyToClipboard text={lang === "en" ? detail.product_title_en : detail.product_title_cn} />
                                                                        </div>
                                                                    </td>
                                                                    <td className="py-2 px-2 text-gray-400 text-center text-custom-sm">{detail.qty}</td>
                                                                    <td className="py-2 px-2 text-gray-400 text-center text-custom-sm">
                                                                        {detail.currency} {formatMoney(detail.price)}
                                                                    </td>
                                                                    <td className="py-2 px-2 text-gray-400 text-center text-custom-sm">
                                                                        {detail.currency} {formatMoney(detail.total)}
                                                                    </td>
                                                                    <td className="py-2 px-2 text-gray-400 text-center text-custom-sm">
                                                                        {detail.currency} {formatMoney(detail.deposit)}
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
                    </table>
                </div>
                {/* Footer with Pagination */}
                <div className="p-4 border-t flex items-center justify-between" style={{ borderColor: "#404040" }}>
                    <div className="flex items-center space-x-1">
                        <MemoizedPagination currentPage={currentPage_ItemsOnPO} totalPages={totalPages_ItemsOnPO} onPageChange={(page) => setCurrentPage_ItemsOnPO(page)} />
                        <MemoizedItemsPerPageSelector
                            value={itemsPerPage_ItemsOnPO}
                            onChange={(val: number) => {
                                setItemsPerPage_ItemsOnPO(val);
                                setCurrentPage_ItemsOnPO(1);
                            }}
                            options={pageSizeOptions}
                        />
                        <ExportReportSelector formats={["odt"]} baseName="SupplierItemOnPO" ids={supplierItemsOnPO.map((p) => p.id)} language={lang} />
                    </div>
                </div>
            </div>
        </div>
    );
    const renderTransInfo = () => (
        <div className="p-2">
            <div className="flex-shrink-0" style={{ borderColor: "#404040" }}>
                <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-4">
                        <div className="relative">
                            <input
                                type="search"
                                placeholder={translations["Search"]}
                                value={searchTerm_TransInfo}
                                onChange={(e) => {
                                    setSearchTerm_TransInfo(e.target.value);
                                    setCurrentPage_TransInfo(1);
                                }}
                                className="pl-10 pr-4 py-2 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-sm"
                                style={{ backgroundColor: "#2d2d30", borderColor: "#555555" }}
                            />
                        </div>
                    </div>
                </div>
            </div>
            <div className="overflow-x-auto mt-5">
                <div className="h-[calc(100vh-270px)] overflow-y-auto">
                    <table className="w-full">
                        <thead className="sticky top-0 z-[1]" style={{ backgroundColor: "#1f2132" }}>
                            <tr className="border-b" style={{ borderColor: "#2d2d30" }}>
                                <th className="w-[10%] px-2 py-2 text-left text-gray-400 text-sm">{translations["Date"]}</th>
                                <th className="w-[15%] px-2 py-2 text-left text-gray-400 text-sm">{translations["TransactionInfo"]}</th>
                                <th className="w-[10%] px-2 py-2 text-center text-gray-400 text-sm">{translations["Invoice Amount"]}</th>
                                <th className="w-[13%] px-2 py-2 text-center text-gray-400 text-sm">{translations["Tax"]}</th>
                                <th className="w-[13%] px-2 py-2 text-center text-gray-400 text-sm">{translations["Deposits"]}</th>
                                <th className="w-[13%] px-2 py-2 text-center text-gray-400 text-sm">{translations["Balance To Pay2"]}</th>
                                <th className="w-[13%] px-2 py-2 text-center text-gray-400 text-sm">{translations["Ex Rate"]}</th>
                                <th className="w-[13%] px-2 py-2 text-center text-gray-400 text-sm">{translations["Default Currency"]}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {supplierTransInfo.length === 0 && (
                                <tr className="border-b hover:bg-gray-700 hover:bg-opacity-30 transition-colors" style={{ borderColor: "#40404042" }}>
                                    <td colSpan={12} className="px-2 py-2 text-center text-gray-300 text-sm">
                                        {translations["No Record Found"]}
                                    </td>
                                </tr>
                            )}
                            {supplierTransInfo.map((list, index) => (
                                <React.Fragment key={list.id || index}>
                                    <tr className="border-b hover:bg-gray-700 hover:bg-opacity-30 transition-colors" style={{ borderColor: "#40404042" }}>
                                        <td className="py-2 px-2 text-gray-400 text-left text-custom-sm">{formatDate(list.transaction_date, lang)}</td>
                                        <td className="py-2 px-2 text-gray-400 text-left text-custom-sm">
                                            <div>
                                                <div className="group flex items-center">
                                                    <p className="text-custom-sm select-text">{highlightMatch(list.trans_info, searchTerm_TransInfo)}</p>
                                                    <CopyToClipboard text={list.trans_info || ""} />
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-2 px-2 text-gray-400 text-center text-custom-sm">
                                            {list.currency}
                                            <br></br>
                                            {formatMoney(list.sub_total)}
                                        </td>
                                        <td className="py-2 px-2 text-gray-400 text-center text-custom-sm">
                                            {list.currency}
                                            <br></br>
                                            {formatMoney(list.tax_amount)}
                                        </td>
                                        <td className="py-2 px-2 text-gray-400 text-center text-custom-sm">
                                            {list.currency}
                                            <br></br>
                                            {formatMoney(list.deposit)}
                                        </td>
                                        <td className="py-2 px-2 text-gray-400 text-center text-custom-sm">
                                            {list.currency}
                                            <br></br>
                                            {formatMoney(list.amount)}
                                        </td>
                                        <td className="py-2 px-2 text-gray-400 text-center text-custom-sm">{list.ex_rate}</td>
                                        <td className="py-2 px-2 text-gray-400 text-center text-custom-sm">
                                            {baseCurrency()}
                                            <br></br>
                                            {formatMoney(list.base_amount)}
                                        </td>
                                    </tr>
                                </React.Fragment>
                            ))}
                        </tbody>
                    </table>
                </div>
                {/* Footer with Pagination */}
                <div className="p-4 border-t flex items-center justify-between" style={{ borderColor: "#404040" }}>
                    <div className="flex items-center space-x-1">
                        <MemoizedPagination currentPage={currentPage_TransInfo} totalPages={totalPages_TransInfo} onPageChange={(page) => setCurrentPage_TransInfo(page)} />
                        <MemoizedItemsPerPageSelector
                            value={itemsPerPage_TransInfo}
                            onChange={(val: number) => {
                                setitemsPerPage_TransInfo(val);
                                setCurrentPage_TransInfo(1);
                            }}
                            options={pageSizeOptions}
                        />
                        <ExportReportSelector formats={["odt"]} baseName="SuppCreditNote" ids={supplierTransInfo.map((p) => p.id)} language={lang} />
                    </div>
                </div>
            </div>
        </div>
    );
    const renderAccountsPayable = () => (
        <div className="p-2">
            <div className="flex-shrink-0" style={{ borderColor: "#404040" }}>
                <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-4">
                        <div className="relative">
                            <input
                                type="search"
                                placeholder={translations["Search"]}
                                value={searchTerm_Payable}
                                onChange={(e) => {
                                    setSearchTerm_Payable(e.target.value);
                                    setcurrentPage_Payable(1);
                                }}
                                className="pl-10 pr-4 py-2 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-sm"
                                style={{ backgroundColor: "#2d2d30", borderColor: "#555555" }}
                            />
                        </div>
                    </div>
                </div>
            </div>
            <div className="overflow-x-auto mt-5">
                <div className="h-[calc(100vh-270px)] overflow-y-auto">
                    <table className="w-full">
                        <thead className="sticky top-0 z-[1]" style={{ backgroundColor: "#1f2132" }}>
                            <tr className="border-b" style={{ borderColor: "#2d2d30" }}>
                                <th className="w-[5%] px-2 py-2 text-left text-gray-400 text-sm"></th>
                                <th className="w-[19%] px-2 py-2 text-left text-gray-400 text-sm">{translations["Date"]}</th>
                                <th className="w-[19%] px-2 py-2 text-left text-gray-400 text-sm">{translations["GRN No"]}</th>
                                <th className="w-[19%] px-2 py-2 text-center text-gray-400 text-sm">{translations["Total"]}</th>
                                <th className="w-[19%] px-2 py-2 text-center text-gray-400 text-sm">{translations["Deposit"]}</th>
                                <th className="w-[19%] px-2 py-2 text-center text-gray-400 text-sm">{translations["Balance"]}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {supplierAccountsPayable.length === 0 && (
                                <tr className="border-b hover:bg-gray-700 hover:bg-opacity-30 transition-colors" style={{ borderColor: "#40404042" }}>
                                    <td colSpan={6} className="px-2 py-2 text-center text-gray-300 text-sm">
                                        {translations["No Record Found"]}
                                    </td>
                                </tr>
                            )}
                            {supplierAccountsPayable.map((list, index) => (
                                <React.Fragment key={list.id || index}>
                                    <tr className="border-b hover:bg-gray-700 hover:bg-opacity-30 transition-colors" style={{ borderColor: "#40404042" }}>
                                        <td className="px-2 py-2 text-left text-gray-300 text-sm">
                                            <button
                                                onClick={() => handleToggleRow_Payable(list.id, list.grn_no)}
                                                className={`px-1 py-1 ${
                                                    expanded_Payable.includes(list.id) ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"
                                                } text-white rounded-lg transition-colors text-xs`}
                                            >
                                                {expanded_Payable.includes(list.id) ? <Minus size={16} /> : <Plus size={16} />}
                                            </button>
                                        </td>
                                        <td className="py-2 px-2 text-gray-400 text-left text-custom-sm">{formatDate(list.grn_date, lang)}</td>
                                        <td className="py-2 px-2 text-gray-400 text-left text-custom-sm">
                                            <div>
                                                <div className="group flex items-center">
                                                    <p className="text-custom-sm select-text">{highlightMatch(list.grn_no, searchTerm_Payable)}</p>
                                                    <CopyToClipboard text={list.grn_no || ""} />
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-2 px-2 text-gray-400 text-center text-custom-sm">
                                            {list.currency}
                                            <br></br>
                                            {formatMoney(list.total)}
                                        </td>
                                        <td className="py-2 px-2 text-gray-400 text-center text-custom-sm">
                                            {list.currency}
                                            <br></br>
                                            {formatMoney(list.deposit)}
                                        </td>
                                        <td className="py-2 px-2 text-gray-400 text-center text-custom-sm">
                                            {list.currency}
                                            <br></br>
                                            {formatMoney(list.total - list.deposit)}
                                        </td>
                                    </tr>
                                    {expanded_Payable.includes(list.id) && (
                                        <tr>
                                            <td colSpan={6} className="py-2 px-2">
                                                <table className="w-full" style={{ backgroundColor: "#060818" }}>
                                                    <thead className="sticky top-0 z-[1] py-1 px-4" style={{ backgroundColor: "#1f2132" }}>
                                                        <tr className="border-b" style={{ borderColor: "#2d2d30" }}>
                                                            <th className="text-left py-2 px-2 text-gray-400 text-sm w-12">{translations["Product Code"]}</th>
                                                            <th className="text-left py-2 px-2 text-gray-400 text-sm w-12">{translations["Product Name"]}</th>
                                                            <th className="text-center py-2 px-2 text-gray-400 text-sm w-12">{translations["Qty"]}</th>
                                                            <th className="text-center py-2 px-2 text-gray-400 text-sm w-12">{translations["Price"]}</th>
                                                            <th className="text-center py-2 px-2 text-gray-400 text-sm w-12">{translations["Total"]}</th>
                                                            <th className="text-center py-2 px-2 text-gray-400 text-sm w-12">{translations["Deposit"]}</th>
                                                            <th className="text-center py-2 px-2 text-gray-400 text-sm w-12">{translations["Balance"]}</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {payableDetailsMap[list.id] && payableDetailsMap[list.id]!.length > 0 ? (
                                                            payableDetailsMap[list.id]!.map((detail, i) => (
                                                                <tr key={detail.id || i}>
                                                                    <td className="py-2 px-2 text-gray-400 text-left text-custom-sm">
                                                                        <div className="group flex items-center">
                                                                            <p className="text-gray-400 text-custom-sm">
                                                                                {highlightMatch(detail.product_code || translations["No data"] || "No data", searchTerm_Payable)}
                                                                            </p>
                                                                            <CopyToClipboard text={detail.product_code} />
                                                                        </div>
                                                                    </td>
                                                                    <td className="py-2 px-2 text-gray-400 text-left text-custom-sm">
                                                                        <div className="group flex items-center">
                                                                            <p className="text-gray-400 text-custom-sm">
                                                                                {highlightMatch(
                                                                                    lang === "en"
                                                                                        ? detail.product_title_en || translations["No data"] || "No data"
                                                                                        : detail.product_title_cn || translations["No data"] || "No data",
                                                                                    searchTerm_ItemsOnPO
                                                                                )}
                                                                            </p>
                                                                            <CopyToClipboard text={lang === "en" ? detail.product_title_en : detail.product_title_cn} />
                                                                        </div>
                                                                    </td>
                                                                    <td className="py-2 px-2 text-gray-400 text-center text-custom-sm">{detail.qty}</td>
                                                                    <td className="py-2 px-2 text-gray-400 text-center text-custom-sm">
                                                                        {detail.currency} {formatMoney(detail.price)}
                                                                    </td>
                                                                    <td className="py-2 px-2 text-gray-400 text-center text-custom-sm">
                                                                        {detail.currency} {formatMoney(detail.total)}
                                                                    </td>
                                                                    <td className="py-2 px-2 text-gray-400 text-center text-custom-sm">
                                                                        {detail.currency} {formatMoney(detail.invoice_deposit)}
                                                                    </td>
                                                                    <td className="py-2 px-2 text-gray-400 text-center text-custom-sm">
                                                                        {detail.currency} {formatMoney(detail.total - detail.invoice_deposit)}
                                                                    </td>
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
                                    )}
                                </React.Fragment>
                            ))}
                        </tbody>
                    </table>
                </div>
                {/* Footer with Pagination */}
                <div className="p-4 border-t flex items-center justify-between" style={{ borderColor: "#404040" }}>
                    <div className="flex items-center space-x-1">
                        <MemoizedPagination currentPage={currentPage_Payable} totalPages={totalPages_AccountsPayable} onPageChange={(page) => setCurrentPage_Prepaid(page)} />
                        <MemoizedItemsPerPageSelector
                            value={itemsPerPage_AccountsPayable}
                            onChange={(val: number) => {
                                setItemsPerPage_AccountsPayable(val);
                                setcurrentPage_Payable(1);
                            }}
                            options={pageSizeOptions}
                        />
                        <ExportReportSelector formats={["odt"]} baseName="SupplierAP" ids={supplierAccountsPayable.map((p) => p.id)} language={lang} />
                    </div>
                </div>
            </div>
        </div>
    );
    const renderCredit = () => (
        <div className="p-2">
            <div className="flex-shrink-0" style={{ borderColor: "#404040" }}>
                <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-4">
                        <div className="relative">
                            <input
                                type="search"
                                value={searchTerm_Credit}
                                onChange={(e) => {
                                    setSearchTerm_Credit(e.target.value);
                                    setCurrentPage_Credit(1);
                                }}
                                placeholder={translations["Search"]}
                                className="pl-10 pr-4 py-2 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-sm"
                                style={{ backgroundColor: "#2d2d30", borderColor: "#555555" }}
                            />
                        </div>
                    </div>
                </div>
            </div>
            <div className="overflow-x-auto mt-5">
                <div className="h-[calc(100vh-270px)] overflow-y-auto">
                    <table className="w-full">
                        <thead className="sticky top-0 z-[1]" style={{ backgroundColor: "#1f2132" }}>
                            <tr className="border-b" style={{ borderColor: "#2d2d30" }}>
                                <th className="w-[5%] py-2 px-2 text-gray-400 text-left text-custom-sm"></th>
                                <th className="w-[19%] py-2 px-2 text-gray-400 text-left text-custom-sm">{translations["Transaction Date"]}</th>
                                <th className="w-[29%] py-2 px-2 text-gray-400 text-left text-custom-sm">{translations["Transaction Ref"]}</th>
                                <th className="w-[29%] py-2 px-2 text-gray-400 text-left text-custom-sm">{translations["Details"]}</th>
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
                                            <td colSpan={1} className="py-2 px-2 text-white-400 text-left text-custom-md">
                                                <Calendar size={25} />
                                            </td>
                                            <td colSpan={4} className="py-2 px-2 text-white-400 text-left text-custom-md">
                                                {month}
                                            </td>
                                        </tr>

                                        {records.map((list: any, index: number) => {
                                            const credit = parseFloat(list.credit ?? 0);
                                            const debit = parseFloat(list.debit ?? 0);
                                            const balance = list.running_balance ?? 0;
                                            const stringParticular = list.particulars.split("~");
                                            const particularEn = stringParticular[0];
                                            const particularCn = stringParticular[1] || stringParticular[0];

                                            return (
                                                <React.Fragment key={list.id ?? index}>
                                                    <tr className="border-b hover:bg-gray-700 hover:bg-opacity-30 transition-colors" style={{ borderColor: "#40404042" }}>
                                                        <td className="py-2 px-2 text-gray-400 text-left text-custom-sm">
                                                            <button
                                                                onClick={() => handleToggleRow_Credit(list.id, list.cr_number, list.account_type)}
                                                                className={`px-1 py-1 ${
                                                                    expanded_Credits.includes(list.id) ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"
                                                                }  text-white rounded-lg transition-colors text-xs`}
                                                            >
                                                                {expanded_Credits.includes(list.id) ? <Minus size={16} /> : <Plus size={16} />}
                                                            </button>
                                                        </td>
                                                        <td className="py-2 px-2 text-gray-400 text-left text-custom-sm">{list.transaction_date}</td>
                                                        <td className="py-2 px-2 text-gray-400 text-left text-custom-sm">
                                                            <div className="group flex items-center">
                                                                <p className="text-gray-400 text-custom-sm">{list.cr_number}</p>
                                                                <CopyToClipboard text={list.cr_number} />
                                                            </div>
                                                        </td>
                                                        <td className="py-2 px-2 text-gray-400 text-left text-custom-sm">{lang === "en" ? particularEn : particularCn}</td>
                                                        <td className="py-2 px-2 text-gray-400 text-right text-custom-sm">
                                                            {credit > 0 ? (
                                                                <span className="text-green-500">
                                                                    + {list.currency} {formatMoney(credit)}
                                                                </span>
                                                            ) : (
                                                                <span className="text-red-500">
                                                                    - {list.currency} {formatMoney(debit)}
                                                                </span>
                                                            )}
                                                            <br />
                                                            <span className="text-gray-400">
                                                                {translations["Balance"]}: {list.currency} {formatMoney(balance)}
                                                            </span>
                                                        </td>
                                                    </tr>

                                                    {expanded_Credits.includes(list.id) && (
                                                        <tr>
                                                            <td colSpan={12} className="py-2 px-2">
                                                                <table className="w-full" style={{ backgroundColor: "#060818" }}>
                                                                    <thead className="sticky top-0 z-[1] py-1 px-4" style={{ backgroundColor: "#1f2132" }}>
                                                                        <tr className="border-b" style={{ borderColor: "#2d2d30" }}>
                                                                            {list.account_type === "CR" ? (
                                                                                <>
                                                                                    <th className="text-left py-2 px-2 text-gray-400 text-sm w-12">{translations["Account Code"]}</th>
                                                                                    <th className="text-left py-2 px-2 text-gray-400 text-sm w-12">{translations["Description"]}</th>
                                                                                    <th className="text-left py-2 px-2 text-gray-400 text-sm w-12">{translations["Product Code"]}</th>
                                                                                    <th className="text-left py-2 px-2 text-gray-400 text-sm w-12">{translations["Product Name"]}</th>
                                                                                    <th className="text-center py-2 px-2 text-gray-400 text-sm w-12">{translations["Ex Rate"]}</th>
                                                                                    <th className="text-center py-2 px-2 text-gray-400 text-sm w-12">{translations["Default Currency"]}</th>
                                                                                </>
                                                                            ) : list.account_type === "PO" ? (
                                                                                <>
                                                                                    <th className="text-left py-2 px-2 text-gray-400 text-sm w-12">{translations["Product Code"]}</th>
                                                                                    <th className="text-left py-2 px-2 text-gray-400 text-sm w-12">{translations["Product Name"]}</th>
                                                                                    <th className="text-center py-2 px-2 text-gray-400 text-sm w-12">{translations["Deposit"]}</th>
                                                                                    <th className="text-center py-2 px-2 text-gray-400 text-sm w-12">{translations["Qty"]}</th>
                                                                                    <th className="text-center py-2 px-2 text-gray-400 text-sm w-12">{translations["Price"]}</th>
                                                                                    <th className="text-center py-2 px-2 text-gray-400 text-sm w-12">{translations["Total"]}</th>
                                                                                </>
                                                                            ) : list.account_type === "INV" ? (
                                                                                <>
                                                                                    <th className="text-left py-2 px-2 text-gray-400 text-sm w-12">{translations["Product Code"]}</th>
                                                                                    <th className="text-left py-2 px-2 text-gray-400 text-sm w-12">{translations["Product Name"]}</th>
                                                                                    <th className="text-center py-2 px-2 text-gray-400 text-sm w-12">{translations["Deposit"]}</th>
                                                                                    <th className="text-center py-2 px-2 text-gray-400 text-sm w-12">{translations["Qty"]}</th>
                                                                                    <th className="text-center py-2 px-2 text-gray-400 text-sm w-12">{translations["Price"]}</th>
                                                                                    <th className="text-center py-2 px-2 text-gray-400 text-sm w-12">{translations["Total"]}</th>
                                                                                    <th className="text-left py-2 px-2 text-gray-400 text-sm w-12">{translations["Received Date"]}</th>
                                                                                </>
                                                                            ) : (
                                                                                <th colSpan={6} className="text-center text-gray-400 text-sm py-2 px-2">
                                                                                    {translations["No Headers Available"]}
                                                                                </th>
                                                                            )}
                                                                        </tr>
                                                                    </thead>
                                                                    <tbody>
                                                                        {creditDetailsMap[list.id] && creditDetailsMap[list.id]!.length > 0 ? (
                                                                            creditDetailsMap[list.id]!.map((detail, i) => (
                                                                                <tr key={detail.id || i}>
                                                                                    {list.account_type === "CR" && (
                                                                                        <>
                                                                                            <td className="py-2 px-2 text-gray-400 text-left text-custom-sm">
                                                                                                <div className="flex items-center space-x-3">
                                                                                                    <div>
                                                                                                        <div className="group flex items-center">
                                                                                                            <p className="text-gray-400 text-custom-sm">{detail.account_code}</p>
                                                                                                            <CopyToClipboard text={detail.account_code} />
                                                                                                        </div>
                                                                                                    </div>
                                                                                                </div>
                                                                                            </td>
                                                                                            <td className="py-2 px-2 text-gray-400 text-left text-custom-sm">
                                                                                                <div className="flex items-center space-x-3">
                                                                                                    <div>
                                                                                                        <div className="group flex items-center">
                                                                                                            <p className="text-gray-400 text-custom-sm">
                                                                                                                {lang === "en" ? detail.description_en : detail.description_cn}
                                                                                                            </p>
                                                                                                            <CopyToClipboard text={lang === "en" ? detail.description_en : detail.description_cn} />
                                                                                                        </div>
                                                                                                    </div>
                                                                                                </div>
                                                                                            </td>
                                                                                            <td className="py-2 px-2 text-gray-400 text-left text-custom-sm">
                                                                                                <div className="flex items-center space-x-3">
                                                                                                    <div>
                                                                                                        <div className="group flex items-center">
                                                                                                            <p className="text-gray-400 text-custom-sm">{detail.product_code}</p>
                                                                                                            <CopyToClipboard text={detail.product_code} />
                                                                                                        </div>
                                                                                                    </div>
                                                                                                </div>
                                                                                            </td>
                                                                                            <td className="py-2 px-2 text-gray-400 text-left text-custom-sm">
                                                                                                <div className="flex items-center space-x-3">
                                                                                                    <div>
                                                                                                        <div className="group flex items-center">
                                                                                                            <p className="text-gray-400 text-custom-sm">
                                                                                                                {lang === "en" ? detail.product_title_en : detail.product_title_cn}
                                                                                                            </p>
                                                                                                            <CopyToClipboard text={lang === "en" ? detail.product_title_en : detail.product_title_cn} />
                                                                                                        </div>
                                                                                                    </div>
                                                                                                </div>
                                                                                            </td>
                                                                                            <td className="py-2 px-2 text-gray-400 text-center text-custom-sm">{detail.ex_rate}</td>
                                                                                            <td className="py-2 px-2 text-gray-400 text-center text-custom-sm">
                                                                                                {detail.currency} {formatMoney(detail.base_amount)}
                                                                                            </td>
                                                                                        </>
                                                                                    )}

                                                                                    {list.account_type === "PO" && (
                                                                                        <>
                                                                                            <td className="py-2 px-2 text-gray-400 text-left text-custom-sm">{detail.account_code}</td>
                                                                                            <td className="py-2 px-2 text-gray-400 text-left text-custom-sm">
                                                                                                {lang === "en" ? detail.description_en : detail.description_cn}
                                                                                            </td>
                                                                                            <td className="py-2 px-2 text-gray-400 text-left text-custom-sm">{detail.particulars}</td>
                                                                                            <td className="py-2 px-2 text-gray-400 text-left text-custom-sm">
                                                                                                {lang === "en" ? detail.product_title_en : detail.product_title_cn}
                                                                                            </td>
                                                                                            <td className="py-2 px-2 text-gray-400 text-left text-custom-sm">{detail.invoice_no}</td>
                                                                                            <td className="py-2 px-2 text-gray-400 text-center text-custom-sm">{detail.ex_rate}</td>
                                                                                            <td className="py-2 px-2 text-gray-400 text-center text-custom-sm">
                                                                                                {detail.currency} {formatMoney(detail.amount_paid)}
                                                                                            </td>
                                                                                        </>
                                                                                    )}

                                                                                    {list.account_type === "INV" && (
                                                                                        <>
                                                                                            <td className="py-2 px-2 text-gray-400 text-left text-custom-sm">
                                                                                                <div className="flex items-center space-x-3">
                                                                                                    <div>
                                                                                                        <div className="group flex items-center">
                                                                                                            <p className="text-gray-300 text-custom-sm select-text">{detail.product_code}</p>
                                                                                                            <CopyToClipboard text={detail.product_code || ""} />
                                                                                                        </div>
                                                                                                        <div className="group flex items-center">
                                                                                                            <p className="text-gray-400 text-custom-sm">
                                                                                                                {lang === "en" ? detail.product_title_en : detail.product_title_cn}
                                                                                                            </p>
                                                                                                            <CopyToClipboard text={lang === "en" ? detail.product_title_en : detail.product_title_cn} />
                                                                                                        </div>
                                                                                                    </div>
                                                                                                </div>
                                                                                            </td>
                                                                                            <td className="py-2 px-2 text-gray-400 text-center text-custom-sm">
                                                                                                {detail.currency} {formatMoney(detail.price)}
                                                                                            </td>
                                                                                            <td className="py-2 px-2 text-gray-400 text-center text-custom-sm">{detail.qty}</td>
                                                                                            <td className="py-2 px-2 text-gray-400 text-center text-custom-sm">
                                                                                                {detail.currency} {formatMoney(detail.total)}
                                                                                            </td>
                                                                                            <td className="py-2 px-2 text-gray-400 text-center text-custom-sm">
                                                                                                {detail.currency} {formatMoney(detail.item_deposit)}
                                                                                            </td>
                                                                                        </>
                                                                                    )}
                                                                                </tr>
                                                                            ))
                                                                        ) : (
                                                                            <tr>
                                                                                <td colSpan={8} className="py-2 px-2 text-center text-gray-400 text-sm">
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
                                            );
                                        })}
                                    </React.Fragment>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
                {/* Footer with Pagination */}
                <div className="p-4 border-t flex items-center justify-between" style={{ borderColor: "#404040" }}>
                    <div className="flex items-center space-x-1">
                        <MemoizedPagination currentPage={currentPage_Credit} totalPages={totalPages_Credit} onPageChange={(page) => setCurrentPage_Credit(page)} />
                        <MemoizedItemsPerPageSelector
                            value={itemsPerPage_Credit}
                            onChange={(val: number) => {
                                setItemsPerPage_Credit(val);
                                setCurrentPage_Credit(1);
                            }}
                            options={pageSizeOptions}
                        />
                        <ExportReportSelector formats={["odt"]} baseName="CustCreditNote" ids={[supplierId]} language={lang} />
                    </div>
                </div>
            </div>
        </div>
    );
    // Image Gallery Modal
    const renderCopyPopup = () => {
        if (!showCopySupplier) return null;
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-[#19191c] rounded-xl border border-[#ffffff1a] w-[40vw] h-auto flex flex-col">
                    {/* Header */}
                    <div className="flex items-center justify-between p-3 border-b border-[#ffffff1a]">
                        <div className="flex items-center space-x-4">
                            <h2 className="text-xl font-bold text-white">{translations["Copy Settings"]}</h2>
                        </div>
                        <div className="flex items-center space-x-4">
                            <button
                                onClick={() => {
                                    setShowCopySupplier(false);
                                }}
                                className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                            >
                                <X className="h-6 w-6 text-white" />
                            </button>
                        </div>
                    </div>
                    {/* Content */}
                    <div className="flex-1 overflow-auto p-3">
                        <fieldset className="border-[1px] border-[#ffffff1a] rounded-lg p-4 space-y-2 mb-2">
                            <legend className="text-white text-center px-3 py-1 border-[1px] border-[#ffffff1a] rounded-md bg-[#19191c]">{translations["Supplier Code"]}</legend>
                            {/* Supplier Code Input */}
                            <div className="col-span-6">
                                <input
                                    type="text"
                                    value={formData.copy_supplier_code}
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        setFormData((prev) => ({ ...prev, copy_supplier_code: value }));
                                    }}
                                    className="w-full p-2 rounded bg-[#1f1f23] text-white border border-[#ffffff1a] focus:outline-none focus:ring-2 focus:ring-cyan-600"
                                />
                            </div>
                        </fieldset>
                        <fieldset className="border-[1px] border-[#ffffff1a] rounded-lg p-4 space-y-4 w-full">
                            <div className="grid grid-cols-2 gap-6 w-full">
                                {/* Checkbox Group 1: Supplier Information */}
                                <div className="col-span-1">
                                    <div className="text-gray mb-2 flex items-center space-x-1">
                                        <CustomCheckbox checked={selectAll.supplierInfo} onChange={handleSelectAllGroup("supplierInfo")} />
                                        <span>{translations["Supplier Information"]}</span>
                                    </div>
                                    <div className="flex flex-col space-y-2 text-gray pl-6">
                                        {["Currency", "Payment Terms", "Shipping Terms", "Delivery Method", "Bank Information"].map((field) => (
                                            <label key={field} className="flex items-center space-x-1">
                                                <CustomCheckbox checked={fields[field]} onChange={handleFieldToggle(field)} />
                                                &nbsp;
                                                <span>{translations[field]}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </fieldset>
                    </div>
                    {/* Footer */}
                    <div className="p-3 border-t border-[#ffffff1a] flex justify-end space-x-4">
                        <button onClick={() => setShowCopySupplier(false)} className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-white transition">
                            {translations["Close"]}
                        </button>
                        <button onClick={() => handleCopySupplier()} className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 rounded text-white transition">
                            {translations["Save"]}
                        </button>
                    </div>
                </div>
            </div>
        );
    };
    if (!customer) {
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
                    <div className="flex items-center space-x-4">
                        {/* Tabs */}
                        <div className="flex space-x-1">
                            <button
                                onClick={() => {
                                    if (isDirtyRef.current) {
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
                            className={`px-4 py-2 text-custom-sm rounded-lg text-sm font-medium transition-colors 
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
                                <span>{supplierId === 0 ? translations["Save"] : translations['Update']}</span>
                            )}
                        </button>
                        <button onClick={handleAddNew} className="px-2 py-2 bg-cyan-600 hover:bg-cyan-700 text-[#ffffffcc] text-custom-sm rounded-lg text-sm font-medium transition-colors">
                            {translations["Add New"]}
                        </button>
                        <button onClick={handleCopy} className="px-2 py-2 bg-cyan-600 hover:bg-cyan-700 text-[#ffffffcc] text-custom-sm rounded-lg text-sm font-medium transition-colors">
                            {translations["Copy"]}
                        </button>
                        <button
                            disabled={supplierId === 0}
                            onClick={handleDelete}
                            className="px-2 py-2 bg-red-600 hover:bg-red-700 text-[#ffffffcc] text-custom-sm rounded-lg text-sm font-medium transition-colors"
                        >
                            {translations["Delete"]}
                        </button>
                    </div>
                </div>
            </div>
            {/* Main Content - Scrollable */}
            <div className="flex flex-1 p-2 mb-[10px]" style={{ backgroundColor: "#19191c" }}>
                {/* Main Content Area - Scrollable */}
                <div className="flex-1">
                    {activeTab === "information" && rendersupplierInformation()}
                    {activeTab === "orders" && renderInvoices()}
                    {activeTab === "invoices" && renderPrepaid()}
                    {activeTab === "sales-order" && renderProfitability()}
                    {activeTab === "deposit" && renderReceiveItems()}
                    {activeTab === "profitability" && renderItemsOnPO()}
                    {activeTab === "order-history" && renderTransInfo()}
                    {activeTab === "credit" && renderAccountsPayable()}
                    {activeTab === "refund" && renderCredit()}
                </div>
            </div>
            {/* Image Gallery Modal */}
            {renderCopyPopup()}
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

export default SupplierDetails;
