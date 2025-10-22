import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { showConfirm, showConfirm2 } from "@/utils/alert";
import { showSuccessToast, showErrorToast } from "@/utils/toast";
import Select from "react-select";
import { getFlatpickrLocale, formatDateToCustom } from "@/utils/flatpickrLocale";
import CustomCheckbox from "@/components/CustomCheckbox";
import { ArrowLeft, X, Plus, Search } from "lucide-react";
import CopyToClipboard from "@/components/CopyToClipboard";
import { highlightMatch } from "@/utils/highlightMatch";
import Flatpickr from "react-flatpickr";
import "flatpickr/dist/themes/dark.css";
import { supplierInvoiceService, ApiSupplierInvoice, DetailsRow } from "@/services/supplierInvoiceService";
import { supplierService, ApiSupplier } from "@/services/supplierService";
import Pagination from "@/components/Pagination";
import ItemsPerPageSelector from "@/components/ItemsPerPageSelector";
import { ExportReportSelector } from "@/utils/ExportReportSelector";
import { productService, ApiProduct } from "@/services/productService";
import { NumericFormat } from "react-number-format";
import {
    fetchCourier,
    fetchShippingTerms,
    fetchPaymentTerms,
    fetchTaxGroup,
    fetchWarehouses,
    fetchInvoiceStatus,
    fetchStoreLocation,
    fetchBank,
    convertToSingleOption,
    OptionType,
} from "@/utils/fetchDropdownData";
import { formatMoney, selectStyles, baseCurrency, formatDate, parseDate, DropdownData } from "@/utils/globalFunction";
// localStorage.clear();
const MemoizedPagination = React.memo(Pagination);
const MemoizedItemsPerPageSelector = React.memo(ItemsPerPageSelector);
interface SupplierInvoiceDetailsProps {
    supplierInvoiceId: number;
    saveType: string; // or a more specific union type like 'new' | 'edit'
    onBack: () => void;
    onSave: () => void;
    tabId: string;
    onChangeSupplierInvoiceId: (newId: number) => void;
    onChangeSaveType: (type: string) => void;
}
const defaultCustomer: ApiSupplierInvoice = {
    id: 0,
    index_id: 0,
    supplier_code: "",
    suppliername_en: "",
    suppliername_cn: "",
    supplier_address_en: "",
    supplier_address_cn: "",
    deposit_pv: "",
    invoice_pv: "",
    due_date: "",
    delivery_date: "",
    status: 0,
    is_subscribe: 0,
    sales_person_name: "",
    country_en: "",
    country_cn: "",
    language: "",
    bank: 0,
    product: [],
};
const SupplierInvoiceDetails: React.FC<SupplierInvoiceDetailsProps> = ({ supplierInvoiceId, tabId, saveType, onBack, onSave, onChangeSupplierInvoiceId, onChangeSaveType }) => {
    const { translations, lang } = useLanguage();
    const [masterList, setTransDetails] = useState<ApiSupplierInvoice | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState("information");
    const [suppliers, setSuppliers] = useState<ApiSupplier[]>([]);
    const [isDirty, setIsDirty] = useState(false);
    const isDirtyRef = useRef(isDirty);
    const [showUnsavedChanges, setShowUnsavedChanges] = useState(false);
    const [products, setProducts] = useState<ApiProduct[]>([]);
    const [isInitialized, setIsInitialized] = useState(false);
    const initialFormData = React.useRef<any>(null);
    const locale = getFlatpickrLocale(translations);
    const [loadingSave, setLoadingSave] = useState(false);
    const [courierData, setCourierData] = useState<DropdownData[]>([]);
    const [shippingTermsData, setShippingTermsData] = useState<DropdownData[]>([]);
    const [paymentTermsData, setPaymentTermsData] = useState<DropdownData[]>([]);
    const [warehousesData, setWarehousesData] = useState<DropdownData[]>([]);
    const [allPOStatus, setAllPOStatus] = useState<DropdownData[]>([]);
    const [storeLocationData, setStoreLocationData] = useState<DropdownData[]>([]);
    const [taxGroupData, setTaxGroupData] = useState<DropdownData[]>([]);
    const [banksData, setBanksData] = useState<DropdownData[]>([]);
    const [detailList, setDetailList] = useState<DetailsRow[]>([]);
    const [globalIndex, setGlobalIndex] = useState(0);
    const [ageType, setAgeType] = useState("new");
    const [showProducts, setShowProducts] = useState(false);
    const [showDeposit, setShowDeposit] = useState(false);
    const [totalPagesProducts, setTotalPages_Products] = useState(1);
    const pageSizeOptions = useMemo(() => [10, 20, 50, 100], []);
    const exportRef = useRef<{ triggerExport: () => void }>(null);
    const [showSuppliers, setShowSuppliers] = useState(false);
    const [totalPagesSupplier, setTotalPages_Supplier] = useState(1);
    // Add wholesale pricing state
    const [selectedDetails, selectedSupplierInvoice] = useState<number[]>([]);
    const [selectedProducts, setSelectedProducts] = useState<number[]>([]);
    const [showCreatePV, setShowCreatePV] = useState(false);
    const [creditSuppliers, setCreditSuppliers] = useState<ApiSupplierInvoice[]>([]);
    const [creditsPopup, setShowCreditsPopup] = useState(false);
    const [selectedData, setSelectedData] = useState<number[]>([]);

    const [searchTermProduct, setSearchTermProduct] = useState(() => {
        const cached = localStorage.getItem(`cached-supplier-invoice`);
        if (!cached) return "";
        try {
            const meta = JSON.parse(cached);
            return meta.search || "";
        } catch {
            return "";
        }
    });
    const [currentPageProduct, setCurrentPageProduct] = useState(() => {
        const metaKey = `cached-supplier-invoice`;
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
    const [itemsPerPageProduct, setItemsPerPageProduct] = useState(() => {
        const metaKey = `cached-supplier-invoice`;
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
    const [searchTermSupplier, setSearchTermSupplier] = useState(() => {
        const cached = localStorage.getItem(`${tabId}-cached-suppInvoice-supplier`);
        if (!cached) return "";
        try {
            const meta = JSON.parse(cached);
            return meta.search || "";
        } catch {
            return "";
        }
    });
    const [currentPageSupplier, setCurrentPageSupplier] = useState(() => {
        const metaKey = `${tabId}-cached-suppInvoice-supplier`;
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
    const [itemsPerPageSupplier, setItemsPerPageSupplier] = useState(() => {
        const metaKey = `${tabId}-cached-suppInvoice-supplier`;
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
    const taxGroupOptions: OptionType[] = useMemo(
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
    const warehouseOptions: OptionType[] = useMemo(
        () =>
            warehousesData.map((list) => ({
                value: list.value.toString(),
                value2: list.value.toString(),
                label: lang === "en" ? list.en : list.cn,
                en: list.en,
                cn: list.cn,
            })),
        [warehousesData, lang]
    );
    const allPOStatusOptions: OptionType[] = useMemo(
        () =>
            allPOStatus.map((list) => ({
                value: list.value.toString(),
                value2: list.value.toString(),
                label: lang === "en" ? list.en : list.cn,
                en: list.en,
                cn: list.cn,
            })),
        [allPOStatus, lang]
    );
    const storeLocationOptions: OptionType[] = useMemo(
        () =>
            storeLocationData.map((list) => ({
                value: list.value.toString(),
                value2: list.value.toString(),
                label: lang === "en" ? list.en : list.cn,
                en: list.en,
                cn: list.cn,
            })),
        [storeLocationData, lang]
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
    // Form state - Updated to handle single vs multi-select properly
    const [formData, setFormData] = useState({
        supplier_id: 0,
        supplier_code: "",
        suppliername_en: "",
        suppliername_cn: "",
        supplier_address_en: "",
        supplier_address_cn: "",
        procurement_by_id: null as OptionType | null,
        ship_to_id: null as OptionType | null,
        bill_to_id: null as OptionType | null,
        ap_number: "",
        ap_date: null as Date | null,
        ex_rate: 0,
        invoice_status_id: null as OptionType | null,
        currency: "",
        delivery_method_id: null as OptionType | null,
        payment_terms_id: null as OptionType | null,
        shipping_terms_id: null as OptionType | null,
        tax_group: null as OptionType | null,
        delivery_date: null as Date | null,
        due_date: null as Date | null,
        po_amount: 0,
        base_currency: 0,
        bank: null as OptionType | null,
        deposit: 0,
        sub_total: 0,
        base_deposit: 0,
        bank_charges: 0,
        base_bank_charges: 0,
        current_credit: 0,
        tax: 0,
        total_deduction: 0,
        total: 0,
        base_sub_total: 0,
        base_tax_amount: 0,
        base_total_deduction: 0,
        base_total: 0,
        credit_used: 0,
        remarks: "",
    });
    const [formDataPV, setFormDataPV] = useState({
        sort_by: "Code",
        supplier_id: 0,
        category_dates: "PurchaseDate",
        supplierCodes: [],
        supplierCodeOnPrint: null,
        poStatus: [],
        date_from: null as Date | null,
        date_to: null as Date | null,
        pv_date: new Date(), // Set current date as Date object, not string
        bank: null as OptionType | null,
        deposit_to_pay: 0,
        current_credit: 0,
        currency: "",
    });
    const clearForms = (poStatusOptions: OptionType[]) => {
        const selectedOption = convertToSingleOption(7, poStatusOptions);
        const initialFormData = {
            supplier_id: 0,
            supplier_code: "",
            suppliername_en: "",
            suppliername_cn: "",
            supplier_address_en: "",
            supplier_address_cn: "",
            procurement_by_id: null,
            ship_to_id: null,
            bill_to_id: null,
            ap_number: "",
            ap_date: new Date(),
            ex_rate: 0,
            invoice_status_id: selectedOption,
            currency: "",
            delivery_method_id: null,
            payment_terms_id: null,
            shipping_terms_id: null,
            tax_group: null,
            delivery_date: null,
            due_date: null,
            po_amount: 0,
            base_currency: 0,
            bank: null,
            deposit: 0,
            sub_total: 0,
            base_deposit: 0,
            bank_charges: 0,
            base_bank_charges: 0,
            current_credit: 0,
            tax: 0,
            total_deduction: 0,
            total: 0,
            base_sub_total: 0,
            base_tax_amount: 0,
            base_total_deduction: 0,
            base_total: 0,
            po_ex_rate: 0,
            grn_ex_rate: 0,
            po_adv_pay: 0,
            grn_base_total: 0,
            credit_used: 0,
            base_credit_used: 0,
            remarks: "",
        };
        setFormData(initialFormData);
    };

    useEffect(() => {
        const handleEsc = (event: any) => {
            if (event.key === "Escape") {
                if (showCreatePV && !creditsPopup) {
                    setShowCreatePV(false);
                }
                if (creditsPopup) {
                    setShowCreditsPopup(false);
                }
                if (showSuppliers) {
                    setShowSuppliers(false);
                }
                if (showProducts) {
                    setShowProducts(false);
                }
                if (showDeposit) {
                    setShowDeposit(false);
                }
            }
        };
        window.addEventListener("keydown", handleEsc);
        // Cleanup on unmount
        return () => {
            window.removeEventListener("keydown", handleEsc);
        };
    }, [creditsPopup, showSuppliers, showCreatePV, showProducts, showDeposit]);

    useEffect(() => {
        const calculateTotalsAndFetch = async () => {
            let baseSubTotal = 0;
            let deposit = 0;
            let baseDeposit = 0;

            let po_ex_rate = 0;
            let grn_ex_rate = 0;
            let po_adv_pay = 0;
            let grn_base_total = 0;
            let taxAmount = 0;
            let baseTaxAmount = 0;
            let baseTotalDeduction = 0;
            let baseCreditUsed = 0;
            let baseTotal = 0;
            let subTotal = 0;

            let count = 0;
            detailList.forEach((element) => {
                if (element.is_deleted === 0) {
                    subTotal += Number(element.total) || 0;
                    deposit += Number(element.deposit) || 0;
                    po_ex_rate += Number(element.po_ex_rate) || 0;
                    grn_ex_rate += Number(element.grn_ex_rate) || 0;
                    po_adv_pay += Number(element.po_adv_pay) || 0;
                    grn_base_total += Number(element.grn_base_total) || 0;
                    count++;
                }
            });

            const taxGroup = (formData.tax_group as OptionType)?.value ?? null;
            if (taxGroup) {
                if (taxGroup === "NA" || taxGroup === null) {
                    taxAmount = 0;
                } else if (taxGroup === "0%") {
                    taxAmount = 0;
                } else {
                    const taxValueStr = taxGroup.replace("%", "");
                    const taxValue = parseFloat(taxValueStr) / 100;
                    taxAmount = taxValue * subTotal;
                }
            }

            // Async call inside useEffect
            const conversionKey = formData.currency + baseCurrency();
            const operator = await productService.getOperator(conversionKey);
            const total_deduction = Number(deposit) + Number(formData.credit_used) || 0;
            const total = subTotal + taxAmount - total_deduction;

            if (baseCurrency() === formData.currency) {
                baseSubTotal = subTotal;
                baseDeposit = deposit;
                baseTaxAmount = taxAmount;
                baseTotalDeduction = total_deduction;
                baseCreditUsed = formData.credit_used;
                baseTotal = total;
            } else {
                if (operator === "Divide") {
                    baseSubTotal = subTotal / formData.ex_rate;
                    baseDeposit = deposit / formData.ex_rate;
                    baseTaxAmount = taxAmount / formData.ex_rate;
                    baseTotalDeduction = total_deduction / formData.ex_rate;
                    baseCreditUsed = formData.credit_used / formData.ex_rate;
                    baseTotal = total / formData.ex_rate;
                } else {
                    baseSubTotal = subTotal * formData.ex_rate;
                    baseDeposit = deposit * formData.ex_rate;
                    baseTaxAmount = taxAmount * formData.ex_rate;
                    baseTotalDeduction = total_deduction * formData.ex_rate;
                    baseCreditUsed = formData.credit_used * formData.ex_rate;
                    baseTotal = total * formData.ex_rate;
                }
            }

            const total_po_ex_rate = po_ex_rate / count;
            const total_grn_ex_rate = grn_ex_rate / count;

            setFormData((prev) => ({
                ...prev,
                sub_total: parseFloat(subTotal.toFixed(2)),
                base_sub_total: parseFloat(baseSubTotal.toFixed(2)),
                tax: parseFloat(taxAmount.toFixed(2)),
                base_tax_amount: parseFloat(baseTaxAmount.toFixed(2)),
                deposit: parseFloat(deposit.toFixed(2)),
                base_deposit: parseFloat(baseDeposit.toFixed(2)),
                total_deduction: parseFloat(total_deduction.toFixed(2)),
                base_total_deduction: parseFloat(baseTotalDeduction.toFixed(2)),
                total: parseFloat(total.toFixed(2)),
                base_total: parseFloat(baseTotal.toFixed(2)),
                po_ex_rate: parseFloat(total_po_ex_rate.toFixed(4)),
                grn_ex_rate: parseFloat(total_grn_ex_rate.toFixed(4)),
                po_adv_pay: parseFloat(po_adv_pay.toFixed(2)),
                grn_base_total: parseFloat(grn_base_total.toFixed(2)),
                base_credit_used: parseFloat(baseCreditUsed.toFixed(2)),
            }));
        };
        calculateTotalsAndFetch();
    }, [detailList, formData.tax_group]);

    useEffect(() => {
        fetchProducts(currentPageProduct, itemsPerPageProduct, searchTermProduct, selectedProducts);
    }, [currentPageProduct, itemsPerPageProduct, searchTermProduct, selectedProducts, formData.supplier_id]);

    // Keep ref updated
    useEffect(() => {
        isDirtyRef.current = isDirty;
    }, [isDirty]);

    useEffect(() => {
        const fetchAllMasterData = () => {
            fetchSupplierInvoiceInfo();
        };
        const fetchDropdownData = () => {
            loadCourier();
            loadWarehouse();
            loadShippingTerms();
            loadTaxGroup();
            loadPaymentTerms();
            loadAllPOStatus();
            loadStoreLocation();
            loadBanks();
        };
        fetchDropdownData();
        if (saveType === "new") {
            setLoading(true);
            clearForms(allPOStatusOptions);
            setTransDetails(defaultCustomer);
            setDetailList([]);
            setIsDirty(false);
            isDirtyRef.current = false;
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
    }, [supplierInvoiceId, saveType]);

    useEffect(() => {
        if (!masterList) return;

        if (!isInitialized) {
            // A more robust check to see if the form is fully initialized
            const isFormReady =
                (masterList.procurement_by_id ? !!formData.procurement_by_id : true) &&
                (masterList.ship_to_id ? !!formData.ship_to_id : true) &&
                (masterList.invoice_status_id ? !!formData.invoice_status_id : true) &&
                (masterList.payment_terms_id ? !!formData.payment_terms_id : true) &&
                (masterList.bank ? !!formData.bank : true) &&
                (masterList.bill_to_id ? !!formData.bill_to_id : true) &&
                (masterList.shipping_terms_id ? !!formData.shipping_terms_id : true) &&
                (masterList.tax_group ? !!formData.tax_group : true) &&
                (masterList.delivery_method_id ? !!formData.delivery_method_id : true);
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
    }, [masterList, formData, isInitialized]);

    useEffect(() => {
        if (masterList && courierOption.length > 0) {
            const selectedOption = convertToSingleOption(masterList.delivery_method_id, courierOption);
            setFormData((prev) => ({ ...prev, delivery_method_id: selectedOption }));
        }
    }, [masterList, courierOption, lang]);

    useEffect(() => {
        if (masterList && shippingTermsOption.length > 0) {
            const selectedOption = convertToSingleOption(masterList.shipping_terms_id, shippingTermsOption);
            setFormData((prev) => ({ ...prev, shipping_terms_id: selectedOption }));
        }
    }, [masterList, shippingTermsOption, lang]);

    useEffect(() => {
        if (masterList && taxGroupOptions.length > 0) {
            const selectedOption = convertToSingleOption(masterList.tax_group, taxGroupOptions);
            setFormData((prev) => ({ ...prev, tax_group: selectedOption }));
        }
    }, [masterList, taxGroupOptions, lang]);

    useEffect(() => {
        if (masterList && paymentTermsOption.length > 0) {
            const selectedOption = convertToSingleOption(masterList.payment_terms_id, paymentTermsOption);
            setFormData((prev) => ({ ...prev, payment_terms_id: selectedOption }));
        }
    }, [masterList, paymentTermsOption, lang]);

    useEffect(() => {
        if (masterList && allPOStatusOptions.length > 0) {
            const selectedOption = convertToSingleOption(masterList.invoice_status_id || 1, allPOStatusOptions);
            setFormData((prev) => ({ ...prev, invoice_status_id: selectedOption }));
        }
    }, [masterList, allPOStatusOptions, lang]);

    useEffect(() => {
        if (masterList && warehouseOptions.length > 0) {
            const selectedOption = convertToSingleOption(masterList.ship_to_id, warehouseOptions);
            setFormData((prev) => ({ ...prev, ship_to_id: selectedOption }));
        }
    }, [masterList, warehouseOptions, lang]);

    useEffect(() => {
        if (masterList && storeLocationOptions.length > 0) {
            const selectedOption = convertToSingleOption(masterList.bill_to_id, storeLocationOptions);
            setFormData((prev) => ({ ...prev, bill_to_id: selectedOption }));
        }
    }, [masterList, storeLocationOptions, lang]);

    useEffect(() => {
        if (masterList && banksOptions.length > 0) {
            const selectedOption = convertToSingleOption(masterList.bank, banksOptions);
            setFormData((prev) => ({ ...prev, bank: selectedOption }));
        }
    }, [masterList, banksOptions, lang]);

    useEffect(() => {
        const SupplierKey = `${tabId}-cached-suppliers`;
        const metaKey = `${tabId}-cached-meta-supplier`;
        const mountKey = `${tabId}-mount-status-suppliers`;
        const isFirstMount = sessionStorage.getItem(mountKey) !== "mounted";
        if (isFirstMount) {
            sessionStorage.setItem(mountKey, "mounted");
            fetchSuppliers(currentPageSupplier, itemsPerPageSupplier, searchTermSupplier);
            return;
        }
        const cachedSuppliersRaw = localStorage.getItem(SupplierKey);
        const cachedMetaRaw = localStorage.getItem(metaKey);

        if (!cachedSuppliersRaw || !cachedMetaRaw) {
            fetchSuppliers(currentPageSupplier, itemsPerPageSupplier, searchTermSupplier);
            return;
        }

        try {
            const cachedMeta = JSON.parse(cachedMetaRaw);
            const cachedSuppliers = JSON.parse(cachedSuppliersRaw);

            const isCacheValid = cachedMeta.page === currentPageSupplier && cachedMeta.perPage === itemsPerPageSupplier && cachedMeta.search === searchTermSupplier;

            if (isCacheValid) {
                setSuppliers(cachedSuppliers);
                setTotalPages_Supplier(cachedMeta.totalPages);
                setLoading(false);
                localStorage.setItem(`${tabId}-loading-suppliers`, JSON.stringify(false));
                return;
            }
        } catch (err) {
            console.warn("Failed to parse cached meta:", err);
        }
        fetchSuppliers(currentPageSupplier, itemsPerPageSupplier, searchTermSupplier);
    }, [currentPageSupplier, itemsPerPageSupplier, searchTermSupplier, tabId]);

    const fetchSupplierInvoiceInfo = async () => {
        try {
            const idToUse = supplierInvoiceId;
            if (!idToUse) {
                setLoading(false);
                return;
            }
            isDirtyRef.current = true; // 🔐 prevent dirty tracking
            setLoading(true);
            setError(null);

            const purchaseOrderInfoKey = `${idToUse}-cached-suppInvoice-info`;
            const cachedSuppliersRaw = localStorage.getItem(purchaseOrderInfoKey);
            let foundSupplier;

            if (cachedSuppliersRaw) {
                foundSupplier = JSON.parse(cachedSuppliersRaw); // ✅ Parse cached JSON
            } else {
                foundSupplier = await supplierInvoiceService.getSupplierInvoiceInfo(idToUse); // ✅ Fetch from API
            }
            if (foundSupplier) {
                setTransDetails(foundSupplier);
                setDetailList(foundSupplier.details);
                setFormData((prev) => ({
                    ...prev,
                    supplier_id: foundSupplier.supplier_id || 0,
                    supplier_code: foundSupplier.supplier_code || "",
                    ap_number: foundSupplier.ap_number || "",
                    suppliername_en: foundSupplier.suppliername_en || "",
                    suppliername_cn: foundSupplier.suppliername_cn || "",
                    supplier_address_en: foundSupplier.supplier_address_en || "",
                    supplier_address_cn: foundSupplier.supplier_address_cn || "",
                    remarks: foundSupplier.remarks || "",
                    currency: foundSupplier.currency || "",
                    ex_rate: foundSupplier.ex_rate || 0,
                    po_amount: foundSupplier.po_amount || 0,
                    base_currency: foundSupplier.base_currency || 0,
                    deposit: foundSupplier.deposit || 0,
                    base_deposit: foundSupplier.base_deposit || 0,
                    bank_charges: foundSupplier.bank_charges || 0,
                    base_bank_charges: foundSupplier.base_bank_charges || 0,
                    current_credit: foundSupplier.current_credit || 0,
                    total: foundSupplier.total || 0,
                    base_sub_total: foundSupplier.base_sub_total || 0,
                    base_tax_amount: foundSupplier.base_tax_amount || 0,
                    base_total_deduction: foundSupplier.base_total_deduction || 0,
                    base_total: foundSupplier.base_total || 0,
                    credit_used: foundSupplier.credit_used || 0,
                    ap_date: parseDate(foundSupplier.ap_date),
                    delivery_date: parseDate(foundSupplier.delivery_date),
                    due_date: parseDate(foundSupplier.due_date),
                }));

                // ✅ Only cache if it's a fresh fetch
                if (!cachedSuppliersRaw) {
                    localStorage.setItem(purchaseOrderInfoKey, JSON.stringify(foundSupplier));
                }
            } else {
                setError("supplier not found");
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to fetch suppInvoice details");
            console.error("Error fetching suppInvoice details:", err);
        } finally {
            setLoading(false);
            isDirtyRef.current = false; // ✅ re-enable dirty tracking
        }
    };
    const fetchProducts = async (page = currentPageProduct, perPage = itemsPerPageProduct, search = "", sortId = selectedProducts) => {
        try {
            setError(null);
            localStorage.setItem(`suppInvoice-loading-products`, JSON.stringify(true));
            const paginatedData = await supplierInvoiceService.getAllProductsBySuppInv(page, perPage, search, sortId, formData.supplier_id);
            setProducts(paginatedData.data);
            setTotalPages_Products(paginatedData.last_page);
            localStorage.setItem(`po-cached-products`, JSON.stringify(paginatedData.data));
            localStorage.setItem(
                `po-cached-meta-product`,
                JSON.stringify({
                    page,
                    perPage,
                    search,
                    totalPages: paginatedData.last_page,
                    totalItems: paginatedData.total,
                })
            );
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to fetch products");
            console.error("Error fetching products:", err);
        } finally {
            localStorage.setItem(`suppInvoice-loading-products`, JSON.stringify(false));
        }
    };
    const fetchSuppliers = async (page = currentPageSupplier, perPage = itemsPerPageSupplier, search = "") => {
        try {
            setError(null);
            localStorage.setItem(`${tabId}-loading-suppliers`, JSON.stringify(true));
            const paginatedData = await supplierService.getAllSupplier(page, perPage, search);
            setSuppliers(paginatedData.data);
            setTotalPages_Supplier(paginatedData.last_page);
            localStorage.setItem(`${tabId}-cached-suppliers`, JSON.stringify(paginatedData.data));
            localStorage.setItem(
                `${tabId}-cached-meta-supplier`,
                JSON.stringify({
                    page,
                    perPage,
                    search,
                    totalPages: paginatedData.last_page,
                    totalItems: paginatedData.total,
                })
            );
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to fetch suppliers");
            console.error("Error fetching suppliers:", err);
        } finally {
            localStorage.setItem(`${tabId}-loading-suppliers`, JSON.stringify(false));
        }
    };
    const updateCachedRaw = async (cachedType: string, masterId: number) => {
        if (cachedType === "info") {
            const newData = await supplierInvoiceService.getSupplierInvoiceInfo(masterId);
            if (newData) {
                localStorage.setItem(`${masterId}-cached-suppInvoice-info`, JSON.stringify(newData));
            }
        }
    };
    const loadCourier = async () => {
        try {
            const list = await fetchCourier(); // fetches & returns
            setCourierData(list ?? []); // ✅ manually set state here
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
    const loadTaxGroup = async () => {
        try {
            const list = await fetchTaxGroup(); // fetches & returns
            setTaxGroupData(list ?? []); // ✅ manually set state here
        } catch (err) {
            console.error("Failed to fetch loadTaxGroup:", err);
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
    const loadWarehouse = async () => {
        try {
            const list = await fetchWarehouses(); // fetches & returns
            setWarehousesData(list ?? []); // ✅ manually set state here
        } catch (err) {
            console.error("Failed to fetch loadWarehouse:", err);
        }
    };
    const loadAllPOStatus = async () => {
        try {
            const list = await fetchInvoiceStatus(); // fetches & returns
            setAllPOStatus(list ?? []); // ✅ manually set state here
        } catch (err) {
            console.error("Failed to fetch loadAllPOStatus:", err);
        }
    };
    const loadStoreLocation = async () => {
        try {
            const list = await fetchStoreLocation(); // fetches & returns
            setStoreLocationData(list ?? []); // ✅ manually set state here
        } catch (err) {
            console.error("Failed to fetch loadStoreLocation:", err);
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
    const handleSave = async () => {
        setLoadingSave(true); // Disable the button
        const data = new FormData();
        if (formData.supplier_id === 0) {
            showErrorToast(translations["Supplier Code is required"]);
            setLoadingSave(false); // Enable button again
            return;
        }
        if (detailList.length === 0) {
            showErrorToast(translations["Detail is required"]);
            setLoadingSave(false); // Enable button again
            return;
        }
        if (!formData.bank) {
            showErrorToast(translations["Bank is required"]);
            setLoadingSave(false); // Enable button again
            return;
        }
        if (!formData.ap_number || formData.ap_number === "") {
            showErrorToast(translations["Invoice Number is required"]);
            setLoadingSave(false); // Enable button again
            return;
        }
        if (!formData.ap_number || formData.ap_number.length < 3) {
            showErrorToast(translations["Invoice Number is required"]);
            setLoadingSave(false); // Enable button again
            return;
        }
        detailList.forEach((list) => {
            if (list) {
                if (list.product_code.length > 3) {
                    data.append(
                        "details[]",
                        JSON.stringify({
                            id: list.id,
                            product_id: list.product_id,
                            service_id: list.service_id,
                            received_date: list.received_date,
                            qty: list.qty,
                            price: list.price,
                            total: list.total,
                            deposit: list.deposit,
                            po_detail_id: list.po_detail_id,
                            po_number: list.po_number,
                            po_ex_rate: list.po_ex_rate,
                            grn_ex_rate: list.grn_ex_rate,
                            po_adv_pay: list.po_adv_pay,
                            grn_base_total: list.grn_base_total,
                            product_type: list.product_type,
                            is_deleted: list.is_deleted,
                        })
                    );
                }
            }
        });
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
            const result = await supplierInvoiceService.updateSupplierInvoice(supplierInvoiceId, data);
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
                onChangeSupplierInvoiceId(newId);
                onChangeSaveType("edit");
            }
            // Reset state to allow re-initialization after refetch
            setIsDirty(false);
            setIsInitialized(false);
            await updateCachedRaw("info", newId);
            fetchSupplierInvoiceInfo();
            showSuccessToast(translations[result.message]);
            onSave(); // This will now trigger the cache clearing in the parent
        } catch (error) {
            showErrorToast(translations["Failed to save transaction."] || "Failed to save transaction.");
        } finally {
            setLoadingSave(false); // Enable button again after the operation is done
        }
    };
    const handleAddNew = async () => {
        if (supplierInvoiceId === 0 && formData.supplier_id > 0 && detailList.length > 0) {
            const confirmed = await showConfirm2(
                translations["Supplier Invoice has not been saved"],
                translations["Supplier Invoice has not been saved"],
                translations["Yes"],
                translations["No"],
                translations["Cancel"]
            );
            if (confirmed === "Yes") {
                onChangeSupplierInvoiceId(0);
                onChangeSaveType("details");
                setIsDirty(false);
                setIsDirty(false);
                isDirtyRef.current = false;
            } else if (confirmed === "No") {
                onChangeSupplierInvoiceId(0);
                onChangeSaveType("new");
                clearForms(allPOStatusOptions);
                setIsDirty(false);
                setIsDirty(false);
                isDirtyRef.current = false;
            } else {
                console.log("User clicked 'Cancel'");
            }
        } else {
            onChangeSupplierInvoiceId(0);
            onChangeSaveType("new");
            clearForms(allPOStatusOptions);
            setIsDirty(false);
            isDirtyRef.current = false;
        }
    };
    const handleAddProduct = async () => {
        const selectProducts = products.filter((product) => selectedProducts.includes(product.id));
        setShowProducts(false);
        switch (ageType) {
            case "old":
                if (selectProducts.length > 0) {
                    handleEnterKey(globalIndex, selectProducts[0].product_code, "product_code", ageType);
                }
                break;
            case "new":
                // ✅ Remove placeholder row if id = 0
                setDetailList((prev) => prev.filter((item) => !(item.indexInt === globalIndex && item.id === 0)));
                let newIndex = Math.max(0, ...detailList.map((e) => e.indexInt)) + 1;
                console.log(selectProducts);
                for (const element of selectProducts) {
                    try {
                        const newData: DetailsRow = {
                            id: 0,
                            ap_number: formData.ap_number,
                            ap_date: "",
                            po_number: element.po_number,
                            product_id: element.product_id,
                            service_id: 0,
                            supplier_id: formData.supplier_id,
                            currency: formData.currency,
                            ex_rate: formData.ex_rate,
                            qty: Number(element.qty),
                            receive_qty: 0,
                            price: Number(element.price),
                            total: Number(element.total),
                            deposit: Number(element.deposit),
                            base_deposit: Number(element.base_deposit),
                            po_ex_rate: Number(element.po_ex_rate),
                            grn_ex_rate: Number(element.grn_ex_rate),
                            po_adv_pay: Number(element.po_adv_pay),
                            grn_base_total: Number(element.grn_base_total),
                            po_detail_id: Number(element.po_detail_id),
                            product_type: 0,
                            product_code: element.product_code,
                            product_title_en: element.product_title_en,
                            product_title_cn: element.product_title_cn,
                            received_date: element.received_date,
                            is_deleted: 0,
                            indexInt: newIndex,
                            age_type: "new",
                            deposit_pv: element.deposit_pv,
                        };
                        setDetailList((prev) => [...prev, newData]);
                        newIndex++; // increment for next product
                    } catch (err) {
                        setError(err instanceof Error ? err.message : "Failed to fetch product");
                        console.error("Error fetching product:", err);
                    }
                }
                break;
        }
    };
    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            const allIds = detailList?.map((p: any) => p.indexInt);
            selectedSupplierInvoice(allIds);
        } else {
            selectedSupplierInvoice([]);
        }
    };
    const handleSelectAllProducts = (checked: boolean) => {
        if (ageType === "new") {
            if (checked) {
                const allIds = products?.map((p: any) => p.id);
                setSelectedProducts(allIds);
            } else {
                setSelectedProducts([]);
            }
        }
    };
    const handleSelectSupplier = (id: number, checked: boolean) => {
        if (checked) {
            selectedSupplierInvoice((prev) => [...prev, id]);
        } else {
            selectedSupplierInvoice((prev) => prev.filter((pid) => pid !== id));
        }
    };
    const handlePODateChange = useCallback((dates: Date[]) => {
        setFormData((prev) => ({ ...prev, ap_date: dates[0] ?? null }));
        if (!isDirtyRef.current) {
            setIsDirty(true); // ✅ only if user is editing
        }
    }, []);
    const handleAddRow = () => {
        const newId = Math.floor(10000 + Math.random() * 90000);
        const newData: DetailsRow = {
            id: 0,
            ap_number: "",
            ap_date: "",
            po_number: "",
            product_id: 0,
            service_id: 0,
            supplier_id: 0,
            currency: "",
            ex_rate: 0,
            qty: 0,
            receive_qty: 0,
            price: 0,
            total: 0,
            deposit: 0,
            base_deposit: 0,
            po_ex_rate: 0,
            grn_ex_rate: 0,
            po_adv_pay: 0,
            grn_base_total: 0,
            po_detail_id: 0,
            product_type: 0,
            product_code: "",
            product_title_en: "",
            product_title_cn: "",
            release_date: "",
            po_dateline: "",
            received_date: "",
            is_deleted: 0,
            indexInt: newId,
            age_type: "new",
            deposit_pv: "",
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
    };
    const handleDetailChange = (indexInt: number, value: string, column: string) => {
        if (column === "product_code") {
            setDetailList((prev) => prev.map((item) => (item.indexInt === indexInt ? { ...item, product_code: value } : item)));
        }
        if (column === "qty") {
            setDetailList((prev) => prev.map((item) => (item.indexInt === indexInt ? { ...item, qty: Number(value) } : item)));
        }
        if (column === "price") {
            setDetailList((prev) => prev.map((item) => (item.indexInt === indexInt ? { ...item, price: Number(value) } : item)));
        }
        if (column === "total") {
            setDetailList((prev) => prev.map((item) => (item.indexInt === indexInt ? { ...item, total: Number(value) } : item)));
        }
        if (column === "deposit") {
            setDetailList((prev) => prev.map((item) => (item.indexInt === indexInt ? { ...item, deposit: Number(value) } : item)));
        }

        setDetailList((prev) =>
            prev.map((item) => {
                if (item.indexInt === indexInt) {
                    const updatedItem: any = { ...item };
                    // Convert value to number if it's a numeric field
                    if (column === "qty" || column === "price") {
                        updatedItem[column] = parseFloat(value) || 0;
                    } else {
                        updatedItem[column] = value;
                    }
                    // Auto-calculate total if qty or price changed
                    const qty = parseFloat(column === "qty" ? value : String(updatedItem.qty)) || 0;
                    const price = parseFloat(column === "price" ? value : String(updatedItem.price)) || 0;
                    updatedItem.total = parseFloat((qty * price).toFixed(2));
                    return updatedItem;
                }
                return item;
            })
        );
    };
    /*
    const handleDetailBlur = async (indexInt: number, receiveQty: number, qty: number, orig_qty: number, id: number) => {
        if (id > 0) {
            const countGRNExists = await supplierInvoiceService.getCountGRN(id);
            if (countGRNExists > 0 && qty < receiveQty) {
                setDetailList((prev) =>
                    prev.map((item) => {
                        if (item.indexInt === indexInt) {
                            const updatedItem: any = { ...item };
                            updatedItem["qty"] = orig_qty;
                            return updatedItem;
                        }
                        return item;
                    })
                );
                handleDetailChange(indexInt, String(orig_qty), "qty");
                showErrorToast(receiveQty + " " + translations["Qty Already Received"]);
                return;
            }
        }
    };
    */
    const handleEnterKey = async (indexInt: number, value: string, column: string, ageType: string) => {
        switch (column) {
            case "product_code":
                try {
                    setGlobalIndex(indexInt);
                    setAgeType(ageType);
                    const res = await supplierInvoiceService.getSuppInvProductInfo(value, formData.supplier_id);
                    if (res.list.length === 0) {
                        setSelectedProducts([]);
                        setShowProducts(true);
                        return;
                    }
                    if (res.token === "ProductNotExists") {
                        showErrorToast(translations[res.message]);
                        return;
                    }
                    if (res.token === "MultipleProducts") {
                        setSelectedProducts([]);
                        setShowProducts(true);
                        return;
                    }
                    if (res.token === "ActivePO") {
                        showErrorToast(res.message);
                        return;
                    }
                    setDetailList((prev) =>
                        prev.map((item) => {
                            if (item.indexInt === indexInt) {
                                const updatedItem: any = { ...item };
                                updatedItem["product_id"] = res.list.product_id;
                                updatedItem["service_id"] = res.list.service_id;
                                updatedItem["product_code"] = res.list.product_code;
                                updatedItem["product_title_en"] = res.list.product_title_en;
                                updatedItem["product_title_cn"] = res.list.product_title_cn;
                                updatedItem["po_number"] = res.list.po_number;
                                updatedItem["qty"] = res.list.qty;
                                updatedItem["price"] = res.list.price;
                                updatedItem["deposit_pv"] = res.list.deposit_pv;
                                updatedItem["total"] = res.list.total;
                                updatedItem["deposit"] = res.list.deposit;
                                updatedItem["base_deposit"] = res.list.base_deposit;
                                updatedItem["po_ex_rate"] = res.list.po_ex_rate;
                                updatedItem["grn_ex_rate"] = res.list.grn_ex_rate;
                                updatedItem["po_adv_pay"] = res.list.po_adv_pay;
                                updatedItem["grn_base_total"] = res.list.grn_base_total;
                                updatedItem["received_date"] = res.list.received_date;
                                updatedItem["product_type"] = res.list.product_type;
                                return updatedItem;
                            }
                            return item;
                        })
                    );
                } catch (err) {
                    setError(err instanceof Error ? err.message : "Failed to fetch product");
                    console.error("Error fetching product:", err);
                }
                break;
            case "supplier_code":
                const res = await supplierInvoiceService.getPOSupplierInfo(value);
                if (res.token === "SupplierNotExists") {
                    showErrorToast(translations[res.message]);
                    return;
                }
                if (res.token === "MultipleSupplier") {
                    setShowSuppliers(true);
                    return;
                }
                const payment_terms_id = convertToSingleOption(res.list.payment_terms_id, paymentTermsOption);
                const delivery_method_id = convertToSingleOption(res.list.delivery_method_id, courierOption);
                const shipping_terms_id = convertToSingleOption(res.list.shipping_terms_id, shippingTermsOption);
                const tax_group = convertToSingleOption(res.list.tax_group, taxGroupOptions);
                const res2 = await supplierInvoiceService.getProductsBySupplierId(res.list.supplier_id);
                setFormData((prev) => ({
                    ...prev,
                    supplier_id: res.list.supplier_id,
                    supplier_code: res.list.supplier_code,
                    suppliername_en: res.list.suppliername_en,
                    suppliername_cn: res.list.suppliername_cn,
                    supplier_address_en: res.list.supplier_address_en,
                    supplier_address_cn: res.list.supplier_address_cn,
                    currency: res.list.currency,
                    delivery_method_id: delivery_method_id,
                    shipping_terms_id: shipping_terms_id,
                    payment_terms_id: payment_terms_id,
                    ex_rate: res.list.ex_rate,
                    tax_group: tax_group,
                }));
                if (res2.product.length > 0) {
                    setShowProducts(true);
                }
                break;
        }
    };
    const handlPopupProducts = (indexInt: number, ageType: string) => {
        setGlobalIndex(indexInt);
        setAgeType(ageType);
        setShowProducts(true);
        setSelectedProducts([]);
    };
    const handleSelectProduct = (productId: number, checked: boolean) => {
        if (ageType === "old") {
            // ✅ Single select: only keep this one if checked, or none if unchecked
            setSelectedProducts(checked ? [productId] : []);
        } else {
            // ✅ Multi select (default)
            setSelectedProducts((prev) => {
                if (checked) {
                    return [...prev, productId];
                } else {
                    return prev.filter((id) => id !== productId);
                }
            });
        }
        setCurrentPageProduct(1);
    };
    const handleVoid = async () => {
        const confirmed = await showConfirm(translations["Void Record(s)"], translations["alert_message_38"], translations["Yes"], translations["Cancel"]);
        if (!confirmed) return;
        try {
            const res = await supplierInvoiceService.voidSupplierInvoice([supplierInvoiceId]);
            if (res.token === "Error") {
                showErrorToast(res.message);
                return;
            }
            await updateCachedRaw("info", supplierInvoiceId);
            fetchSupplierInvoiceInfo();
            showSuccessToast(translations["Record(s) Voided"]);
        } catch (err) {
            showErrorToast(translations["alert_message_18"]);
            console.error("Deletion failed:", err);
        }
    };
    const handleRowClick_Supplier = async (e: React.MouseEvent, tableId: number) => {
        // Prevent navigation if clicking on checkboxes or toggle switches
        const target = e.target as HTMLElement;
        if (target.closest("input") || target.closest("label") || target.closest("[data-copy-button]")) {
            return;
        }
        const supplierListKey = `${tabId}-cached-suppliers`;
        const cachedSuppliersRaw = localStorage.getItem(supplierListKey);
        let rawDataCached: ApiSupplier[] | null = null;
        if (cachedSuppliersRaw) {
            try {
                rawDataCached = JSON.parse(cachedSuppliersRaw);
            } catch (error) {
                console.error("Error parsing cached customer data", error);
            }
        }
        const specificItem = rawDataCached?.find((item: ApiSupplier) => item.id === tableId);
        const supplier_code = specificItem?.supplier_code?.toString();
        const res = await supplierInvoiceService.getPOSupplierInfo(String(supplier_code));
        if (res.token === "SupplierNotExists") {
            showErrorToast(translations[res.message]);
            return;
        }
        const payment_terms_id = convertToSingleOption(res.list.payment_terms_id, paymentTermsOption);
        const delivery_method_id = convertToSingleOption(res.list.delivery_method_id, courierOption);
        const shipping_terms_id = convertToSingleOption(res.list.shipping_terms_id, shippingTermsOption);
        const res2 = await supplierInvoiceService.getProductsBySupplierId(res.list.supplier_id);
        setFormData((prev) => ({
            ...prev,
            supplier_id: res.list.supplier_id,
            supplier_code: res.list.supplier_code,
            suppliername_en: res.list.suppliername_en,
            suppliername_cn: res.list.suppliername_cn,
            supplier_address_en: res.list.supplier_address_en,
            supplier_address_cn: res.list.supplier_address_cn,
            currency: res.list.currency,
            delivery_method_id: delivery_method_id,
            shipping_terms_id: shipping_terms_id,
            payment_terms_id: payment_terms_id,
            ex_rate: res.list.ex_rate,
        }));
        if (res2.product.length > 0) {
            setShowProducts(true);
        }
        setShowSuppliers(false);
    };
    const handleDeliveryDateChange = useCallback((dates: Date[]) => {
        setFormData((prev) => ({ ...prev, delivery_date: dates[0] ?? null }));
        setIsDirty(true); // ✅ only if user is editing
    }, []);
    const handleDueDateChange = useCallback((dates: Date[]) => {
        setFormData((prev) => ({ ...prev, due_date: dates[0] ?? null }));
        setIsDirty(true); // ✅ only if user is editing
    }, []);
    const handleDatePV = useCallback((dates: Date[]) => {
        setFormDataPV((prev) => ({ ...prev, pv_date: dates[0] ?? null }));
    }, []);
    const handlePopupCredits = async () => {
        try {
            const paginatedData = await supplierInvoiceService.getSupplierCredit(1);
            setCreditSuppliers(paginatedData);
            setShowCreditsPopup(true);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to fetch get-supplier-credit");
            console.error("Error fetching preorder:", err);
        }
    };
    const handlePopupCreatePV = () => {
        const selectedOption = convertToSingleOption(masterList?.bank, banksOptions);
        setFormDataPV((prev) => ({
            ...prev,
            currency: String(formData.currency),
            deposit_to_pay: Number(formData.deposit),
            current_credit: Number(formData.current_credit),
            credit_used: 0,
            supplier_id: Number(formData.supplier_id),
            bank: selectedOption,
        }));
    };
    const handleSubmitCredit = async () => {
        let totalCreditUsed = 0;
        selectedData.forEach((val) => {
            totalCreditUsed += val;
        });
        if (totalCreditUsed > formDataPV.deposit_to_pay) {
            showErrorToast(translations["Invalid Amount"]);
            return;
        }
        const newDepositToPay = formDataPV.deposit_to_pay - totalCreditUsed;
        setFormData((prev) => ({
            ...prev,
            deposit_to_pay: newDepositToPay,
            credit_used: totalCreditUsed,
        }));
        setShowCreditsPopup(false);
    };
    const handleCreatePV = () => {
        const depositToPay = formDataPV.deposit_to_pay;
        if (depositToPay > 0) {
            handleSavePVDeposit("PV");
        } else {
            handleSavePVDeposit("JV");
        }
    };
    const handleSavePVDeposit = async (type: string) => {
        const data = new FormData();
        Object.keys(formDataPV).forEach((key) => {
            let value = formDataPV[key as keyof typeof formDataPV];
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
        data.append(`ap_numbers[0]`, formData.ap_number);
        try {
            const result = await supplierInvoiceService.createPVInvoice(data, type);
            if (result.token === "Error") {
                showErrorToast(translations[result.message] + " " + result.message2);
                return;
            }
            setShowCreatePV(false);
            await updateCachedRaw("info", supplierInvoiceId);
            fetchSupplierInvoiceInfo();
            showSuccessToast(translations[result.message]);
        } catch (error) {
            showErrorToast(translations["Failed to save Create PV."] || "Failed to save Create PV.");
        } finally {
        }
    };
    const filteredSuppliers = suppliers.filter((supplier) => {
        const searchLower = searchTermSupplier.toLowerCase();
        return (
            supplier.id?.toString().includes(searchLower) ||
            supplier.supplier_code?.toLowerCase().includes(searchLower) ||
            supplier.suppliername_en?.toLowerCase().includes(searchLower) ||
            supplier.suppliername_cn?.toLowerCase().includes(searchLower) ||
            supplier.contact_person_en?.toLowerCase().includes(searchLower) ||
            supplier.contact_person_cn?.toLowerCase().includes(searchLower) ||
            supplier.contact_number?.toLowerCase().includes(searchLower) ||
            supplier.email?.toLowerCase().includes(searchLower)
        );
    });
    // Get all images for gallery with stable IDs
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
    const renderSupplierInvoiceInfo = () => (
        <div className="p-1 bg-[#19191c] rounded-xl">
            <div className="h-[calc(100vh-150px)] overflow-y-auto pr-2">
                <div className="grid gap-4">
                    <div className="grid grid-cols-12 gap-4">
                        {/* Right side: 12 columns */}
                        <div className="col-span-12 p-1">
                            <fieldset className="grid grid-cols-12 gap-4 border-[1px] border-[#ffffff1a] rounded-lg p-4 mb-2">
                                <div className="col-span-12 md:col-span-4">
                                    <div className="flex items-center space-x-4 mb-2">
                                        <label className="w-[26%] text-gray-400 text-sm text-right">{translations["Status"]}</label>
                                        <Select
                                            classNamePrefix="react-select"
                                            value={formData.invoice_status_id}
                                            onChange={(selected) => {
                                                setFormData({ ...formData, invoice_status_id: selected as OptionType | null });
                                                if (!isDirtyRef.current) {
                                                    setIsDirty(true); // ✅ only if user is editing
                                                }
                                            }}
                                            options={allPOStatusOptions}
                                            styles={{
                                                ...selectStyles,
                                                menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                                            }}
                                            className="w-[75%]"
                                            isDisabled
                                            isClearable
                                            placeholder={translations["Select"]}
                                            menuPlacement="auto"
                                            menuPosition="fixed"
                                            menuPortalTarget={typeof window !== "undefined" ? document.body : null}
                                        />
                                    </div>
                                    <div className="flex items-center gap-4 mb-2">
                                        <label className="w-[25%] text-gray-400 text-sm text-right">{translations["Supplier Code"]}</label>
                                        <div className="flex flex-1">
                                            <input
                                                type="text"
                                                value={formData.supplier_code}
                                                readOnly={masterList?.invoice_status_id === 5}
                                                onChange={(e) => {
                                                    const value = e.target.value;
                                                    setFormData((prev) => ({ ...prev, supplier_code: value }));
                                                    if (!isDirtyRef.current) setIsDirty(true);
                                                }}
                                                onKeyDown={(e) => {
                                                    if (e.key === "Enter") {
                                                        handleEnterKey(0, formData.supplier_code, "supplier_code", "");
                                                    }
                                                }}
                                                className="flex-1 px-3 py-2 border border-[#ffffff1a] border-r-0 bg-transparent text-[#ffffffcc] text-custom-sm rounded-tl-md rounded-bl-md !rounded-tr-none !rounded-br-none"
                                                placeholder={translations["Supplier Code"]}
                                            />
                                            <button
                                                type="button"
                                                disabled={masterList?.invoice_status_id === 5}
                                                onClick={() => {
                                                    setShowSuppliers(true);
                                                }}
                                                className="px-2 py-2 bg-cyan-600 text-white !rounded-tr-md !rounded-br-md !rounded-tl-none !rounded-bl-none hover:bg-cyan-700 flex items-center justify-center border border-[#ffffff1a] border-l-0"
                                            >
                                                <Search className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-4 mb-2">
                                        <label className="w-[25%] text-gray-400 text-sm text-right">{translations["Supplier Name"]}</label>
                                        <input
                                            type="text"
                                            hidden={lang === "cn"}
                                            readOnly
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
                                            readOnly
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
                                        <label className="w-[25%] text-gray-400 text-sm text-right">{translations["Address"]}</label>
                                        <textarea
                                            rows={5}
                                            hidden={lang === "cn"}
                                            readOnly
                                            value={formData.supplier_address_en}
                                            onChange={(e) => {
                                                const value = e.target.value;
                                                setFormData((prev) => ({ ...prev, supplier_address_en: value }));
                                                if (!isDirtyRef.current) setIsDirty(true);
                                            }}
                                            className="flex-1 px-3 py-2 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm"
                                        />
                                        <textarea
                                            rows={5}
                                            hidden={lang === "en"}
                                            readOnly
                                            value={formData.supplier_address_cn}
                                            onChange={(e) => {
                                                const value = e.target.value;
                                                setFormData((prev) => ({ ...prev, supplier_address_cn: value }));
                                                if (!isDirtyRef.current) setIsDirty(true);
                                            }}
                                            className="flex-1 px-3 py-2 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm"
                                        />
                                    </div>
                                </div>
                                <div className="col-span-12 md:col-span-4">
                                    <div className="flex items-center space-x-4 mb-2">
                                        <label className="w-[25%] text-gray-400 text-sm text-right">{translations["Currency"]}</label>
                                        <input
                                            type="text"
                                            hidden={lang === "cn"}
                                            readOnly
                                            value={formData.currency}
                                            onChange={(e) => {
                                                const value = e.target.value;
                                                setFormData((prev) => ({ ...prev, currency: value }));
                                                if (!isDirtyRef.current) setIsDirty(true);
                                            }}
                                            className="flex-1 px-3 py-2 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm"
                                        />
                                    </div>
                                    <div className="flex items-center space-x-4 mb-2">
                                        <label className="w-[25%] text-gray-400 text-sm text-right">{translations["Ex Rate"]}</label>
                                        <input
                                            value={formData.ex_rate}
                                            readOnly
                                            onChange={(e) => {
                                                const value = Number(e.target.value);
                                                setFormData((prev) => ({ ...prev, ex_rate: value }));
                                                if (!isDirtyRef.current) setIsDirty(true);
                                            }}
                                            className="flex-1 px-3 py-2 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm"
                                        />
                                    </div>
                                    <div className="flex items-center space-x-4 mb-2">
                                        <label className="w-[26%] text-gray-400 text-sm text-right">{translations["Tax"]}</label>
                                        <Select
                                            classNamePrefix="react-select"
                                            value={formData.tax_group ?? null}
                                            onChange={async (selected) => {
                                                setFormData({ ...formData, tax_group: selected as OptionType | null });
                                                setIsDirty(true); // ✅ only if user is editing
                                            }}
                                            options={taxGroupOptions}
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
                                    <div className="flex items-center space-x-4 mb-2">
                                        <label className="w-[26%] text-gray-400 text-sm text-right">{translations["Delivery Method"]}</label>
                                        <Select
                                            classNamePrefix="react-select"
                                            value={formData.delivery_method_id}
                                            isDisabled={masterList?.invoice_status_id === 5}
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
                                            placeholder={translations["Select"]}
                                            menuPlacement="auto"
                                            menuPosition="fixed"
                                            menuPortalTarget={typeof window !== "undefined" ? document.body : null}
                                        />
                                    </div>
                                    <div className="flex items-center space-x-4 mb-2">
                                        <label className="w-[26%] text-gray-400 text-sm text-right">{translations["Shipping Terms"]}</label>
                                        <Select
                                            classNamePrefix="react-select"
                                            value={formData.shipping_terms_id}
                                            isDisabled={masterList?.invoice_status_id === 5}
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
                                            placeholder={translations["Select"]}
                                            menuPlacement="auto"
                                            menuPosition="fixed"
                                            menuPortalTarget={typeof window !== "undefined" ? document.body : null}
                                        />
                                    </div>
                                    <div className="flex items-center space-x-4 mb-2">
                                        <label className="w-[26%] text-gray-400 text-sm text-right">{translations["Payment Terms"]}</label>
                                        <Select
                                            classNamePrefix="react-select"
                                            value={formData.payment_terms_id}
                                            isDisabled={masterList?.invoice_status_id === 5}
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
                                            placeholder={translations["Select"]}
                                            menuPlacement="auto"
                                            menuPosition="fixed"
                                            menuPortalTarget={typeof window !== "undefined" ? document.body : null}
                                        />
                                    </div>
                                </div>
                                <div className="col-span-12 md:col-span-4">
                                    <div className="flex items-center space-x-4 mb-2">
                                        <label className="w-[25%] text-gray-400 text-sm text-right">{translations["A/P Invoice No."]}</label>
                                        <input
                                            value={formData.ap_number}
                                            onChange={(e) => {
                                                const value = e.target.value;
                                                setFormData((prev) => ({ ...prev, ap_number: value }));
                                                if (!isDirtyRef.current) setIsDirty(true);
                                            }}
                                            className="flex-1 px-3 py-2 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm"
                                        />
                                    </div>
                                    <div className="flex items-center space-x-4 mb-2">
                                        <label className="w-[25%] text-gray-400 text-sm text-right">{translations["AP Date"]}</label>
                                        <Flatpickr
                                            onChange={handlePODateChange}
                                            options={{
                                                dateFormat: "M d Y",
                                                defaultDate: formData.ap_date || undefined,
                                                allowInput: true,
                                                locale: locale,
                                            }}
                                            className="flex-1 px-3 py-2 border-[1px] border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm"
                                        />
                                    </div>
                                    <div className="flex items-center space-x-4 mb-2">
                                        <label className="w-[26%] text-gray-400 text-sm text-right">{translations["Bill To"]}</label>
                                        <Select
                                            classNamePrefix="react-select"
                                            value={formData.bill_to_id}
                                            onChange={async (selected) => {
                                                setFormData({ ...formData, bill_to_id: selected as OptionType | null });
                                                if (!isDirtyRef.current) {
                                                    setIsDirty(true); // ✅ only if user is editing
                                                }
                                            }}
                                            options={storeLocationOptions}
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
                                    <div className="flex items-center space-x-4 mb-2">
                                        <label className="w-[26%] text-gray-400 text-sm text-right">{translations["Ship To"]}</label>
                                        <Select
                                            classNamePrefix="react-select"
                                            value={formData.ship_to_id}
                                            isDisabled={masterList?.invoice_status_id === 5}
                                            onChange={(selected) => {
                                                setFormData({ ...formData, ship_to_id: selected as OptionType | null });
                                                if (!isDirtyRef.current) {
                                                    setIsDirty(true); // ✅ only if user is editing
                                                }
                                            }}
                                            options={warehouseOptions}
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
                                    <div className="flex items-center space-x-4 mb-2">
                                        <label className="w-[25%] text-gray-400 text-sm text-right">{translations["Delivery Date"]}</label>
                                        <Flatpickr
                                            onChange={handleDeliveryDateChange}
                                            options={{
                                                dateFormat: "M d Y",
                                                defaultDate: formData.delivery_date || undefined,
                                                allowInput: true,
                                                locale: locale,
                                            }}
                                            className="flex-1 px-3 py-2 border-[1px] border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm"
                                        />
                                    </div>
                                    <div className="flex items-center space-x-4 mb-2">
                                        <label className="w-[25%] text-gray-400 text-sm text-right">{translations["Due Date"]}</label>
                                        <Flatpickr
                                            onChange={handleDueDateChange}
                                            options={{
                                                dateFormat: "M d Y",
                                                defaultDate: formData.due_date || undefined,
                                                allowInput: true,
                                                locale: locale,
                                            }}
                                            className="flex-1 px-3 py-2 border-[1px] border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm"
                                        />
                                    </div>
                                </div>
                            </fieldset>
                            <fieldset className="grid grid-cols-12 gap-4 border-[1px] border-[#ffffff1a] rounded-lg p-4 mb-2">
                                <div className="col-span-12 md:col-span-12 table-layout">
                                    <table className="w-full border border-gray-600 border-collapse text-sm text-left">
                                        <thead className="sticky top-0 z-[1]" style={{ backgroundColor: "#1f2132" }}>
                                            <tr className="border-b" style={{ borderColor: "#2d2d30" }}>
                                                <th className="w-[2%] text-left py-1 px-2 text-gray-400 text-sm border border-[#40404042]">
                                                    <div className="flex items-center h-full">
                                                        <CustomCheckbox
                                                            disabled={masterList?.invoice_status_id === 5}
                                                            checked={selectedDetails.length === detailList?.length && detailList?.length > 0}
                                                            onChange={(checked) => handleSelectAll(checked)}
                                                        />
                                                    </div>
                                                </th>
                                                <th className="w-[2%] text-left py-1 px-2 text-gray-400 text-sm border border-[#40404042]">
                                                    <div className="relative group inline-block">
                                                        <button
                                                            type="button"
                                                            onClick={handleAddRow}
                                                            disabled={masterList?.invoice_status_id === 5}
                                                            className="px-1 py-1 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-xs"
                                                        >
                                                            <Plus className="h-4 w-4" />
                                                        </button>
                                                        {/* Tooltip */}
                                                        {masterList?.invoice_status_id !== 4 && (
                                                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block z-10">
                                                                <div className="bg-gray-800 text-white text-xs rounded py-1 px-2 shadow-lg whitespace-nowrap uppercase">{translations["Add Row"]}</div>
                                                                <div className="w-2 h-2 bg-gray-800 rotate-45 absolute top-full left-1/2 transform -translate-x-1/2"></div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </th>
                                                <th className="w-[2%] text-left py-1 px-2 text-gray-400 text-sm border border-[#40404042]"></th>
                                                <th className="w-[10%] text-left py-2 px-2 text-gray-400 text-sm border border-[#40404042]">{translations["Product Code"]}</th>
                                                <th className="w-[25%] text-left py-2 px-2 text-gray-400 text-sm border border-[#40404042]">{translations["Product Name"]}</th>
                                                <th className="w-[10%] text-left py-2 px-2 text-gray-400 text-sm border border-[#40404042]">{translations["PO Number"]}</th>
                                                <th className="w-[7%] text-center py-2 px-2 text-gray-400 text-sm border border-[#40404042]">{translations["Qty"]}</th>
                                                <th className="w-[7%] text-center py-2 px-2 text-gray-400 text-sm border border-[#40404042]">{translations["Price"]}</th>
                                                <th className="w-[7%] text-center py-2 px-2 text-gray-400 text-sm border border-[#40404042]">{translations["Deposit"]}</th>
                                                <th className="w-[9%] text-center py-2 px-2 text-gray-400 text-sm border border-[#40404042]">{translations["Deposit PV"]}</th>
                                                <th className="w-[9%] text-center py-2 px-2 text-gray-400 text-sm border border-[#40404042]">{translations["Total"]}</th>
                                                <th className="w-[10%] text-center py-2 px-2 text-gray-400 text-sm border border-[#40404042]">{translations["CargoReceivedDate"]}</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {detailList.length === 0 ? (
                                                <tr className="clickable border-b hover:bg-gray-700 hover:bg-opacity-30 transition-colors cursor-pointer" style={{ borderColor: "#40404042" }}>
                                                    <td colSpan={12} className="py-2 px-2 text-gray-400 text-center text-custom-sm border border-[#40404042]">
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
                                                                <td className="py-2 px-2 text-gray-400 text-left text-custom-sm border border-[#40404042]">
                                                                    <CustomCheckbox
                                                                        checked={selectedDetails.includes(item.indexInt as number)}
                                                                        disabled={masterList?.invoice_status_id === 5}
                                                                        onChange={(checked) => handleSelectSupplier(item.indexInt as number, checked)}
                                                                    />
                                                                </td>
                                                                <td className="py-2 px-2 text-gray-400 text-left text-custom-sm border border-[#40404042]">
                                                                    <div className="relative group inline-block">
                                                                        <button
                                                                            type="button"
                                                                            disabled={masterList?.invoice_status_id === 5}
                                                                            onClick={() => handleRemoveRow()}
                                                                            className="px-1 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-xs"
                                                                        >
                                                                            <X className="h-4 w-4" />
                                                                        </button>
                                                                        {/* Tooltip */}
                                                                        {masterList?.invoice_status_id !== 4 && (
                                                                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block z-10">
                                                                                <div className="bg-gray-800 text-white text-xs rounded py-1 px-2 shadow-lg whitespace-nowrap uppercase">
                                                                                    {translations["Delete"]}
                                                                                </div>
                                                                                <div className="w-2 h-2 bg-gray-800 rotate-45 absolute top-full left-1/2 transform -translate-x-1/2"></div>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </td>
                                                                <td className="py-2 px-2 text-gray-400 text-left text-custom-sm border border-[#40404042]">
                                                                    <div className="relative group inline-block">
                                                                        <button
                                                                            type="button"
                                                                            disabled={masterList?.invoice_status_id === 5}
                                                                            onClick={() => handlPopupProducts(item.indexInt, item.age_type)}
                                                                            className="px-1 py-1 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors text-xs"
                                                                        >
                                                                            <Search className="h-4 w-4" />
                                                                        </button>
                                                                        {/* Tooltip */}
                                                                        {masterList?.invoice_status_id !== 4 && (
                                                                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block z-10">
                                                                                <div className="bg-gray-800 text-white text-xs rounded py-1 px-2 shadow-lg whitespace-nowrap uppercase">
                                                                                    {translations["Search"]}
                                                                                </div>
                                                                                <div className="w-2 h-2 bg-gray-800 rotate-45 absolute top-full left-1/2 transform -translate-x-1/2"></div>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </td>
                                                                <td className="py-0 px-0 text-gray-400 text-left text-custom-sm border border-[#40404042]">
                                                                    <input
                                                                        type="text"
                                                                        value={item.product_code}
                                                                        readOnly={masterList?.invoice_status_id === 5}
                                                                        onChange={(e) => handleDetailChange(item.indexInt, e.target.value, "product_code")}
                                                                        onKeyDown={(e) => {
                                                                            if (e.key === "Enter") {
                                                                                handleEnterKey(item.indexInt, item.product_code, "product_code", item.age_type);
                                                                            }
                                                                        }}
                                                                        className="w-full px-3 py-1.5 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-sm rounded"
                                                                    />
                                                                </td>
                                                                <td className="py-0 px-0 text-gray-400 text-left text-custom-sm border border-[#40404042]">
                                                                    <input
                                                                        type="text"
                                                                        readOnly
                                                                        value={lang === "en" ? item.product_title_en : item.product_title_cn}
                                                                        className="w-full px-3 py-1.5 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-sm rounded"
                                                                    />
                                                                </td>
                                                                <td className="py-0 px-0 text-gray-400 text-center text-custom-sm border border-[#40404042]">
                                                                    <input
                                                                        type="text"
                                                                        value={item.po_number}
                                                                        readOnly
                                                                        className="w-full px-3 py-1.5 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-sm rounded text-left"
                                                                    />
                                                                </td>
                                                                <td className="py-0 px-0 text-gray-400 text-center text-custom-sm border border-[#40404042]">
                                                                    <input
                                                                        type="number"
                                                                        value={item.qty}
                                                                        readOnly={masterList?.invoice_status_id === 5}
                                                                        onChange={(e) => {
                                                                            const value = e.target.value;
                                                                            if (/^\d*\.?\d*$/.test(value)) {
                                                                                handleDetailChange(item.indexInt, value, "qty");
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
                                                                        type="text"
                                                                        value={item.price}
                                                                        onChange={(e) => {
                                                                            const value = e.target.value;
                                                                            if (/^\d*\.?\d*$/.test(value)) {
                                                                                handleDetailChange(item.indexInt, value, "price");
                                                                            }
                                                                        }}
                                                                        className="w-full px-3 py-1.5 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-sm rounded text-center"
                                                                    />{" "}
                                                                </td>
                                                                <td className="py-0 px-0 text-gray-400 text-center text-custom-sm border border-[#40404042]">
                                                                    <input
                                                                        type="number"
                                                                        value={item.deposit}
                                                                        readOnly
                                                                        onChange={(e) => {
                                                                            const value = e.target.value;
                                                                            if (/^\d*\.?\d*$/.test(value)) {
                                                                                handleDetailChange(item.indexInt, value, "deposit");
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
                                                                        type="text"
                                                                        value={item.deposit_pv}
                                                                        readOnly
                                                                        onChange={(e) => {
                                                                            const value = e.target.value;
                                                                            if (/^\d*\.?\d*$/.test(value)) {
                                                                                handleDetailChange(item.indexInt, value, "deposit_pv");
                                                                            }
                                                                        }}
                                                                        className="w-full px-3 py-1.5 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-sm rounded text-center"
                                                                    />
                                                                </td>
                                                                <td className="py-0 px-0 text-gray-400 text-center text-custom-sm border border-[#40404042]">
                                                                    <input
                                                                        type="number"
                                                                        value={item.total}
                                                                        readOnly
                                                                        onChange={(e) => {
                                                                            const value = e.target.value;
                                                                            if (/^\d*\.?\d*$/.test(value)) {
                                                                                handleDetailChange(item.indexInt, value, "total");
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
                                                                        type="text"
                                                                        value={formatDate(item.received_date, lang)}
                                                                        readOnly
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
                                        <label className="w-[26%] text-gray-400 text-sm text-right">{translations["Bank"]}</label>
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
                                            isDisabled={masterList?.invoice_status_id === 5}
                                            className="w-[75%]"
                                            placeholder={translations["Select"]}
                                            menuPlacement="auto"
                                            menuPosition="fixed"
                                            menuPortalTarget={typeof window !== "undefined" ? document.body : null}
                                        />
                                    </div>

                                    <div className="flex items-center space-x-4 mb-2">
                                        <label className="w-[25%] text-gray-400 text-sm text-right">{translations["Current Credit"]}</label>
                                        <input
                                            type="number"
                                            value={formData.current_credit}
                                            readOnly
                                            onChange={(e) => {
                                                const input = e.target.value;
                                                // Validate string input using regex
                                                if (/^\d*\.?\d*$/.test(input)) {
                                                    const value = Number(input); // Safe to convert now
                                                    setFormData((prev) => ({ ...prev, current_credit: value }));
                                                    if (!isDirtyRef.current) setIsDirty(true);
                                                }
                                            }}
                                            onFocus={(e) => {
                                                if (Number(e.target.value) === 0) {
                                                    e.target.select();
                                                }
                                            }}
                                            className="flex-1 px-3 py-2 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm text-right"
                                        />
                                    </div>
                                    <div className="flex items-center space-x-4 mb-2">
                                        <label className="w-[25%] text-gray-400 text-sm text-right">{translations["Remarks"]}</label>
                                        <input
                                            type="text"
                                            value={formData.remarks}
                                            readOnly={masterList?.invoice_status_id === 5}
                                            onChange={(e) => {
                                                const value = e.target.value;
                                                setFormData((prev) => ({ ...prev, remarks: value }));
                                            }}
                                            className="flex-1 px-3 py-2 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm"
                                        />
                                    </div>
                                </div>
                                <div className="col-span-12 md:col-span-4"></div>
                                <div className="col-span-12 md:col-span-3">
                                    <div className="flex items-center space-x-4 mb-2">
                                        <label className="w-[35%] text-gray-400 text-sm text-right">{translations["Sub Total"]}</label>
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
                                            value={formData.sub_total}
                                            onChange={(e) => {
                                                const value = Number(e.target.value);
                                                setFormData((prev) => ({ ...prev, sub_total: value }));
                                                setIsDirty(true);
                                            }}
                                            className="w-[45%] px-3 py-2 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm text-right"
                                        />
                                    </div>
                                    <div className="flex items-center space-x-4 mb-2">
                                        <label className="w-[35%] text-gray-400 text-sm text-right">{translations["Tax Amount"]}</label>
                                        <input
                                            type="text"
                                            readOnly
                                            value={formData.currency}
                                            className="w-[20%] px-3 py-2 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm text-center"
                                        />
                                        <input
                                            type="text"
                                            readOnly
                                            value={formData.tax}
                                            onChange={(e) => {
                                                const value = Number(e.target.value);
                                                setFormData((prev) => ({ ...prev, tax: value }));
                                                setIsDirty(true);
                                            }}
                                            className="w-[45%] px-3 py-2 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm text-right"
                                        />
                                    </div>
                                    <div className="flex items-center space-x-4 mb-2">
                                        <label className="w-[35%] text-gray-400 text-sm text-right">{translations["Total Deduction"]}</label>
                                        <input
                                            type="text"
                                            readOnly
                                            value={formData.currency}
                                            className="w-[20%] px-3 py-2 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm text-center"
                                        />
                                        <input
                                            type="text"
                                            readOnly
                                            value={formData.total_deduction}
                                            onChange={(e) => {
                                                const value = Number(e.target.value);
                                                setFormData((prev) => ({ ...prev, total_deduction: value }));
                                                setIsDirty(true);
                                            }}
                                            className="w-[45%] px-3 py-2 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm text-right"
                                        />
                                    </div>
                                    <div className="flex items-center space-x-4 mb-2">
                                        <label className="w-[35%] text-gray-400 text-sm text-right">{translations["Total To Pay"]}</label>
                                        <input
                                            type="text"
                                            readOnly
                                            value={formData.currency}
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
                                            value={formData.base_sub_total}
                                            onChange={(e) => {
                                                const value = Number(e.target.value);
                                                setFormData((prev) => ({ ...prev, base_sub_total: value }));
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
                                            value={formData.base_tax_amount}
                                            onChange={(e) => {
                                                const value = Number(e.target.value);
                                                setFormData((prev) => ({ ...prev, base_tax_amount: value }));
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
                                            value={formData.base_total_deduction}
                                            onChange={(e) => {
                                                const value = Number(e.target.value);
                                                setFormData((prev) => ({ ...prev, base_total_deduction: value }));
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
                                            value={formData.base_total}
                                            onChange={(e) => {
                                                const value = Number(e.target.value);
                                                setFormData((prev) => ({ ...prev, base_total: value }));
                                                setIsDirty(true);
                                            }}
                                            className="w-[75%] px-3 py-2 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm text-right"
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
    const renderProductList = () => {
        if (!showProducts) return null;
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-[#19191c] rounded-xl border border-[#ffffff1a] w-[65vw] h-auto flex flex-col">
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-[#ffffff1a]">
                        <div className="flex items-center space-x-4">
                            <h2 className="text-xl font-bold text-white">{translations["Search Product List"]}</h2>
                        </div>
                        <div className="flex items-center space-x-4">
                            <button
                                onClick={() => {
                                    setShowProducts(false);
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
                                        value={searchTermProduct}
                                        onChange={(e) => {
                                            setSearchTermProduct(e.target.value);
                                            setCurrentPageProduct(1);
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
                                        <th className="text-left py-2 px-2 text-gray-400 text-sm">
                                            <CustomCheckbox checked={selectedProducts.length === products.length && products.length > 0} onChange={(checked) => handleSelectAllProducts(checked)} />
                                        </th>
                                        <th className="text-left py-2 px-2 text-gray-400 text-sm">{translations["Product Code"]}</th>
                                        <th className="text-left py-2 px-2 text-gray-400 text-sm">{translations["Product Name"]}</th>
                                        <th className="text-left py-2 px-2 text-gray-400 text-sm">{translations["PO Number"]}</th>
                                        <th className="text-center py-2 px-2 text-gray-400 text-sm">{translations["Qty"]}</th>
                                        <th className="text-center py-2 px-2 text-gray-400 text-sm">{translations["Price"]}</th>
                                        <th className="text-center py-2 px-2 text-gray-400 text-sm">{translations["Total"]}</th>
                                        <th className="text-left py-2 px-2 text-gray-400 text-sm">{translations["Received Date"]}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {products.map((product, index) => (
                                        <tr
                                            key={product.id || index}
                                            className={`border-b hover:bg-gray-700 hover:bg-opacity-30 transition-colors ${
                                                selectedProducts.includes(product.id as number) ? "bg-gray-700 bg-opacity-30" : ""
                                            }`}
                                            style={{ borderColor: "#40404042" }}
                                        >
                                            <td className="py-2 px-2" onClick={(e) => e.stopPropagation()}>
                                                <CustomCheckbox checked={selectedProducts.includes(product.id as number)} onChange={(checked) => handleSelectProduct(product.id as number, checked)} />
                                            </td>
                                            <td className="py-2 px-2 text-gray-400 text-left text-custom-sm">
                                                <div className="group flex items-center">
                                                    <p className="text-gray-400 text-custom-sm">{highlightMatch(product.product_code, searchTermProduct)}</p>
                                                    <CopyToClipboard text={product.product_code ?? ""} />
                                                </div>
                                            </td>
                                            <td className="py-2 px-2 text-gray-400 text-left text-custom-sm">
                                                <div className="group flex items-center">
                                                    <p className="text-gray-400 text-custom-sm">
                                                        {highlightMatch(lang === "en" ? product.product_title_en : product.product_title_cn, searchTermProduct)}
                                                    </p>
                                                    <CopyToClipboard text={lang === "en" ? product.product_title_en : product.product_title_cn ?? ""} />
                                                </div>
                                            </td>
                                            <td className="py-2 px-2 text-gray-400 text-left text-custom-sm">
                                                <div className="group flex items-center">
                                                    <p className="text-gray-400 text-custom-sm">{highlightMatch(product.po_number, searchTermProduct)}</p>
                                                    <CopyToClipboard text={product.po_number ?? ""} />
                                                </div>
                                            </td>
                                            <td className="py-2 px-2 text-gray-400 text-center text-custom-sm">{product.qty}</td>
                                            <td className="py-2 px-2 text-gray-400 text-center text-custom-sm">
                                                {product.currency}
                                                <br></br>
                                                {formatMoney(product.price)}
                                            </td>
                                            <td className="py-2 px-2 text-gray-400 text-center text-custom-sm">
                                                {product.currency}
                                                <br></br>
                                                {formatMoney(product.total)}
                                            </td>
                                            <td className="py-2 px-2 text-gray-400 text-left text-custom-sm">{formatDate(product.received_date, lang)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    {/* Footer with Pagination */}
                    <div className="p-4 border-t flex items-center justify-between" style={{ borderColor: "#404040" }}>
                        <div className="flex items-center space-x-1">
                            <MemoizedPagination currentPage={currentPageProduct} totalPages={totalPagesProducts} onPageChange={(page) => setCurrentPageProduct(page)} />
                            <MemoizedItemsPerPageSelector
                                value={itemsPerPageProduct}
                                onChange={(val: number) => {
                                    setItemsPerPageProduct(val);
                                    setCurrentPageProduct(1);
                                }}
                                options={pageSizeOptions}
                            />
                        </div>
                        <div className="flex items-center space-x-1">
                            <button onClick={() => setShowProducts(false)} className="px-2 py-2 bg-gray-700 hover:bg-gray-600 rounded text-white transition">
                                {translations["Close"]}
                            </button>
                            <button onClick={() => handleAddProduct()} className={`px-2 py-2 bg-cyan-600 hover:bg-cyan-500 rounded text-white transition`}>
                                {translations["Add"]}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const renderSupplierList = () => {
        if (!showSuppliers) return null;
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-[#19191c] rounded-xl border border-[#ffffff1a] w-[60vw] h-auto flex flex-col">
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-[#ffffff1a]">
                        <div className="flex items-center space-x-4">
                            <h2 className="text-xl font-bold text-white">{translations["Search Supplier List"]}</h2>
                        </div>
                        <div className="flex items-center space-x-4">
                            <button
                                onClick={() => {
                                    setShowSuppliers(false);
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
                                        value={searchTermSupplier}
                                        onChange={(e) => {
                                            setSearchTermSupplier(e.target.value);
                                            setCurrentPageSupplier(1);
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
                                        <th className=" text-left py-2 px-4 text-gray-400 text-sm">{translations["Supplier Code"]}</th>
                                        <th className=" text-left py-2 px-4 text-gray-400 text-sm">{translations["Supplier Name"]}</th>
                                        <th className=" text-left py-2 px-4 text-gray-400 text-sm">{translations["Contact Person"]}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredSuppliers.map((list, index) => (
                                        <tr
                                            key={list.id || index}
                                            onClick={(e) => handleRowClick_Supplier(e, list.id)}
                                            className={`clickable border-b hover:bg-gray-700 hover:bg-opacity-30 transition-colors cursor-pointer`}
                                            style={{ borderColor: "#40404042" }}
                                        >
                                            <td className="py-3 px-4 text-gray-400 text-left text-custom-sm">{list.supplier_code}</td>
                                            <td className="py-3 px-4 text-gray-400 text-left text-custom-sm">{lang === "en" ? list.suppliername_en : list.suppliername_cn}</td>
                                            <td className="py-3 px-4 text-gray-400 text-left text-custom-sm">{lang === "en" ? list.contact_person_en : list.contact_person_cn}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    {/* Footer with Pagination */}
                    <div className="p-4 border-t flex items-center justify-between" style={{ borderColor: "#404040" }}>
                        <div className="flex items-center space-x-1">
                            <MemoizedPagination currentPage={currentPageSupplier} totalPages={totalPagesSupplier} onPageChange={(page) => setCurrentPageSupplier(page)} />
                            <MemoizedItemsPerPageSelector
                                value={itemsPerPageSupplier}
                                onChange={(val: number) => {
                                    setItemsPerPageSupplier(val);
                                    setCurrentPageSupplier(1);
                                }}
                                options={pageSizeOptions}
                            />
                        </div>
                        <div className="flex items-center space-x-1">
                            <button onClick={() => setShowSuppliers(false)} className="px-2 py-2 bg-gray-700 hover:bg-gray-600 rounded text-white transition">
                                {translations["Close"]}
                            </button>
                        </div>
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
                                        defaultDate: formDataPV.pv_date || undefined,
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
                                    value={formDataPV.bank}
                                    onChange={(selected) => {
                                        setFormDataPV({ ...formDataPV, bank: selected as OptionType | null });
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
                                    value={formDataPV.deposit_to_pay}
                                    decimalSeparator="."
                                    decimalScale={2}
                                    fixedDecimalScale
                                    allowNegative={true}
                                    prefix={`${formDataPV.currency} `}
                                    placeholder="0.00"
                                    onValueChange={({ floatValue }) => {
                                        setFormDataPV((prev) => ({
                                            ...prev,
                                            deposit_to_pay: Number(floatValue) ?? "0.00",
                                        }));
                                    }}
                                    className="w-[70%] flex-1 px-3 py-2 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm rounded-md"
                                />
                            </div>
                            <div className={`flex items-center gap-4 mb-2 ${formDataPV.current_credit === 0 ? "hidden" : ""}`}>
                                <label className="w-[30%] text-gray-400 text-sm">{translations["Current Credit"]}</label>
                                <div className="w-[70%] flex flex-1">
                                    <NumericFormat
                                        value={formDataPV.current_credit}
                                        decimalSeparator="."
                                        decimalScale={2}
                                        readOnly
                                        fixedDecimalScale
                                        allowNegative={true}
                                        prefix={`${formDataPV.currency} `}
                                        placeholder={`${formDataPV.currency} 0.00`}
                                        onValueChange={({ floatValue }) => {
                                            setFormDataPV((prev) => ({
                                                ...prev,
                                                current_credit: floatValue ?? 0,
                                            }));
                                        }}
                                        className="flex-1 px-3 py-2 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm rounded-md !rounded-tr-none !rounded-br-none"
                                    />
                                    <button
                                        disabled={formDataPV.current_credit === 0}
                                        type="button"
                                        onClick={handlePopupCredits}
                                        className="px-2 py-2 bg-cyan-600 text-white !rounded-tr-md !rounded-br-md !rounded-tl-none !rounded-bl-none hover:bg-cyan-700 flex items-center justify-center border border-[#ffffff1a] border-l-0"
                                    >
                                        <Search className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                            <div className={`flex items-center gap-4 mb-2 ${formDataPV.current_credit === 0 ? "hidden" : ""}`}>
                                <label className="w-[30%] text-gray-400 text-sm">{translations["Credit Used"]}</label>
                                <NumericFormat
                                    // value={formDataPV.credit_used}
                                    decimalSeparator="."
                                    readOnly
                                    decimalScale={2}
                                    fixedDecimalScale
                                    allowNegative={true}
                                    prefix={`${formDataPV.currency} `}
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
                    <div className="p-2 border-t border-[#ffffff1a] flex justify-end space-x-1">
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
                                                <th className="w-[15%] text-left py-2 px-4 text-gray-400 text-sm">{translations["Account Code"]}</th>
                                                <th className="w-[25%] text-left py-2 px-4 text-gray-400 text-sm">{translations["Account Name"]}</th>
                                                <th className="w-[25%] text-center py-2 px-4 text-gray-400 text-sm">{translations["Currency"]}</th>
                                                <th className="w-[15%] text-center py-2 px-4 text-gray-400 text-sm">{translations["Amount"]}</th>
                                                <th className="w-[20%] text-center py-2 px-4 text-gray-400 text-sm"></th>
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
                                                        <td className="py-3 px-4 text-gray-400 text-left text-custom-sm">{item.account_code}</td>
                                                        <td className="py-3 px-4 text-gray-400 text-left text-custom-sm">{lang === "en" ? item.account_name_en : item.account_name_cn}</td>
                                                        <td className="py-3 px-4 text-gray-400 text-center text-custom-sm">{item.currency}</td>
                                                        <td className="py-3 px-4 text-gray-400 text-center text-custom-sm">{formatMoney(item.amount)}</td>
                                                        <td className="py-3 px-4 text-gray-400 text-center text-custom-sm">
                                                            <input
                                                                type="number"
                                                                value={selectedData[index] !== undefined ? selectedData[index] : index === 0 ? formDataPV.deposit_to_pay : ""}
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
                    <div className="p-2 border-t border-[#ffffff1a] flex justify-end space-x-1">
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
                            onClick={() => {
                                // setShowDeposit(true);
                            }}
                            disabled={masterList.invoice_status_id === 5}
                            className="px-2 py-2 bg-cyan-600 hover:bg-cyan-700 text-[#ffffffcc] text-custom-sm rounded-lg text-sm font-medium transition-colors"
                        >
                            {translations["Generate Order Report"]}
                        </button>
                        <button
                            onClick={handleSave}
                            className={`px-2 py-2 text-custom-sm rounded-lg text-sm font-medium transition-colors 
                                ${loadingSave ? "bg-gray-500 cursor-not-allowed opacity-50" : "bg-cyan-600 hover:bg-cyan-700"} 
                                text-[#ffffffcc] flex justify-center items-center`}
                            disabled={loadingSave || masterList.invoice_status_id === 5 || masterList.invoice_status_id === 3}
                        >
                            {loadingSave ? (
                                <>
                                    <div className="loader mr-2"></div>
                                    <span>{translations["Processing2"]}...</span>
                                </>
                            ) : (
                                <span>{translations["Save"]}</span>
                            )}
                        </button>
                        <button
                            onClick={() => {
                                exportRef.current?.triggerExport();
                            }}
                            disabled={supplierInvoiceId === 0 || masterList.invoice_status_id === 5}
                            className="px-2 py-2 bg-cyan-600 hover:bg-cyan-700 text-[#ffffffcc] text-custom-sm rounded-lg text-sm font-medium transition-colors"
                        >
                            {translations["Print"]}
                        </button>
                        <button onClick={handleAddNew} className="px-2 py-2 bg-cyan-600 hover:bg-cyan-700 text-[#ffffffcc] text-custom-sm rounded-lg text-sm font-medium transition-colors">
                            {translations["Add New"]}
                        </button>
                        <button
                            disabled={masterList.invoice_status_id === 5 || masterList.invoice_status_id === 1}
                            onClick={() => {
                                setShowCreatePV(true);
                                handlePopupCreatePV();
                            }}
                            className="px-2 py-2 bg-cyan-600 hover:bg-cyan-700 text-[#ffffffcc] text-custom-sm rounded-lg text-sm font-medium transition-colors"
                        >
                            {translations["Create Payment Voucher"]}
                        </button>
                        <button
                            disabled={masterList.invoice_status_id === 5 || supplierInvoiceId === 0}
                            onClick={handleVoid}
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
                <div className="flex-1">{renderSupplierInvoiceInfo()}</div>
            </div>
            <div className="hidden">
                <ExportReportSelector ref={exportRef} formats={["odt"]} baseName="DSSupplierSingleInvoices_Report" ids={[supplierInvoiceId]} language={lang} />
            </div>
            {renderProductList()}
            {renderSupplierList()}
            {renderCreatePV()}
            {renderCreditsPopup()}
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

export default SupplierInvoiceDetails;
