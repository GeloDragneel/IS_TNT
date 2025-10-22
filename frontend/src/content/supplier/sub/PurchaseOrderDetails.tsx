import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { showConfirm } from "@/utils/alert";
import { showSuccessToast, showErrorToast } from "@/utils/toast";
import Select from "react-select";
import { getFlatpickrLocale, formatDateToCustom } from "@/utils/flatpickrLocale";
import CustomCheckbox from "@/components/CustomCheckbox";
import { ArrowLeft, X, Plus, Search, Minus } from "lucide-react";
import Flatpickr from "react-flatpickr";
import "flatpickr/dist/themes/dark.css";
import { purchaseOrderService, ApiPurchaseOrder, DetailsRow, DetailsExpanded } from "@/services/purchaseOrderService";
import { supplierService, ApiSupplier } from "@/services/supplierService";
import Pagination from "@/components/Pagination";
import ItemsPerPageSelector from "@/components/ItemsPerPageSelector";
import { productService, ApiProduct } from "@/services/productService";
import { NumericFormat } from "react-number-format";
import { ExportReportSelector } from "@/utils/ExportReportSelector";
import { fetchCourier, fetchShippingTerms, fetchPaymentTerms, fetchWarehouses, fetchPOStatus, fetchStoreLocation, fetchBank, convertToSingleOption, OptionType } from "@/utils/fetchDropdownData";
import { formatMoney, selectStyles, baseCurrency, formatDate, parseDate, DropdownData } from "@/utils/globalFunction";
// localStorage.clear();
const MemoizedPagination = React.memo(Pagination);
const MemoizedItemsPerPageSelector = React.memo(ItemsPerPageSelector);
interface SupplierDetailsProps {
    purchaseOrderId: number;
    saveType: string; // or a more specific union type like 'new' | 'edit'
    onBack: () => void;
    onSave: () => void;
    tabId: string;
    onChangePurchaseOrderId: (newId: number) => void;
    onChangeSaveType: (type: string) => void;
}
const defaultCustomer: ApiPurchaseOrder = {
    id: 0,
    supplier_code: "",
    suppliername_en: "",
    suppliername_cn: "",
    supplier_address_en: "",
    supplier_address_cn: "",
    deposit_pv: "",
    invoice_pv: "",
    receive_date: "",
    status: 0,
    is_subscribe: 0,
    sales_person_name: "",
    country_en: "",
    country_cn: "",
    language: "",
    product: [],
};
const SupplierDetails: React.FC<SupplierDetailsProps> = ({ purchaseOrderId, tabId, saveType, onBack, onSave, onChangePurchaseOrderId, onChangeSaveType }) => {
    const { translations, lang } = useLanguage();
    const [masterList, setTransDetails] = useState<ApiPurchaseOrder | null>(null);
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
    const [banksData, setBanksData] = useState<DropdownData[]>([]);
    const [detailList, setDetailList] = useState<DetailsRow[]>([]);
    const [depositList, setDepositList] = useState<DetailsExpanded[]>([]);
    const [globalIndex, setGlobalIndex] = useState(0);
    const [ageType, setAgeType] = useState("");
    const [showProducts, setShowProducts] = useState(false);
    const [showDeposit, setShowDeposit] = useState(false);
    const [totalPagesProducts, setTotalPages_Products] = useState(1);
    const pageSizeOptions = useMemo(() => [10, 20, 50, 100], []);
    const [cancelOrder, setShowCancelOrder] = useState(false);
    const [loadCancelOrder_CTOSUPP, setLoadCancelOrder_CTOSUPP] = useState(false);
    const [loadCancelOrder_MSCLSS, setLoadCancelOrder_MSCLSS] = useState(false);
    const [loadCancelOrder_RPTOS, setLoadCancelOrder_RPTOS] = useState(false);
    const [showSuppliers, setShowSuppliers] = useState(false);
    const [totalPagesSupplier, setTotalPages_Supplier] = useState(1);
    const [expanded_Orders, setExpandedRows] = useState<number[]>([]);
    // Add wholesale pricing state
    const [selectedDetails, selectedPurchaseOrder] = useState<number[]>([]);
    const [selectedProducts, setSelectedProducts] = useState<number[]>([]);
    const [orderDetailsMap, setPODetailsMap] = useState<Record<number, DetailsExpanded[] | null>>({});
    const [showCreatePV, setShowCreatePV] = useState(false);
    const [creditSuppliers, setCreditSuppliers] = useState<ApiPurchaseOrder[]>([]);
    const [creditsPopup, setShowCreditsPopup] = useState(false);
    const [selectedData, setSelectedData] = useState<number[]>([]);
    const [cancelType, setCancelType] = useState("");
    const exportRef = useRef<{ triggerExport: () => void }>(null);
    const [searchTermProduct, setSearchTermProduct] = useState(() => {
        const cached = localStorage.getItem(`cached-preorder-product`);
        if (!cached) return "";
        try {
            const meta = JSON.parse(cached);
            return meta.search || "";
        } catch {
            return "";
        }
    });
    const [currentPageProduct, setCurrentPageProduct] = useState(() => {
        const metaKey = `cached-preorder-product`;
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
        const metaKey = `cached-preorder-product`;
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
        const cached = localStorage.getItem(`${tabId}-cached-po-supplier`);
        if (!cached) return "";
        try {
            const meta = JSON.parse(cached);
            return meta.search || "";
        } catch {
            return "";
        }
    });
    const [currentPageSupplier, setCurrentPageSupplier] = useState(() => {
        const metaKey = `${tabId}-cached-po-supplier`;
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
        const metaKey = `${tabId}-cached-po-supplier`;
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
    const findDuplicateProductIds = (items: any) => {
        const seen = new Set();
        const duplicates = new Set();

        items.forEach((item: any) => {
            if (seen.has(item.product_id)) {
                duplicates.add(item.product_id);
            } else {
                seen.add(item.product_id);
            }
        });
        return [...duplicates]; // array of duplicate product_ids
    };
    // Form state - Updated to handle single vs multi-select properly
    const [formData, setFormData] = useState({
        supplier_id: 0,
        supplier_code: "",
        old_supplier_code: "",
        suppliername_en: "",
        suppliername_cn: "",
        supplier_address_en: "",
        supplier_address_cn: "",
        procurement_by_id: null as OptionType | null,
        ship_to: null as OptionType | null,
        po_number: "",
        po_date: null as Date | null,
        ex_rate: 0,
        postatus_id: null as OptionType | null,
        currency: "",
        delivery_method_id: null as OptionType | null,
        payment_terms_id: null as OptionType | null,
        shipping_terms_id: null as OptionType | null,
        delivery_date: null as Date | null,
        due_date: null as Date | null,
        po_amount: 0,
        base_currency: 0,
        bank: null as OptionType | null,
        deposit: 0,
        PVJVDeposit: 0,
        base_deposit: 0,
        bank_charges: 0,
        base_bank_charges: 0,
        current_credit: 0,
        retail_price: 0,
        item_cost: 0,
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
        credit_used: 0,
        currency: "",
    });
    const clearForms = (poStatusOptions: OptionType[]) => {
        const selectedOption = convertToSingleOption(1, poStatusOptions);
        const initialFormData = {
            supplier_id: 0,
            supplier_code: "",
            old_supplier_code: "",
            suppliername_en: "",
            suppliername_cn: "",
            supplier_address_en: "",
            supplier_address_cn: "",
            procurement_by_id: null,
            ship_to: null,
            po_number: "",
            po_date: new Date(),
            ex_rate: 0,
            postatus_id: selectedOption,
            currency: "",
            delivery_method_id: null,
            payment_terms_id: null,
            shipping_terms_id: null,
            delivery_date: null,
            due_date: null,
            po_amount: 0,
            base_currency: 0,
            bank: null,
            deposit: 0,
            PVJVDeposit: 0,
            base_deposit: 0,
            bank_charges: 0,
            base_bank_charges: 0,
            current_credit: 0,
            retail_price: 0,
            item_cost: 0,
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
            let total = 0;
            let baseTotal = 0;
            let deposit = 0;
            let baseDeposit = 0;

            detailList.forEach((element) => {
                if (element.is_deleted === 0) {
                    total += Number(element.total) || 0;
                    deposit += Number(element.deposit) || 0;
                }
            });

            // Async call inside useEffect
            const conversionKey = formData.currency + baseCurrency();
            const operator = await productService.getOperator(conversionKey);

            if (baseCurrency() === formData.currency) {
                baseTotal = total;
                baseDeposit = deposit;
            } else {
                if (operator === "Divide") {
                    baseTotal = total / formData.ex_rate;
                    baseDeposit = deposit / formData.ex_rate;
                } else {
                    baseTotal = total * formData.ex_rate;
                    baseDeposit = deposit * formData.ex_rate;
                }
            }
            setFormData((prev) => ({
                ...prev,
                po_amount: parseFloat(total.toFixed(2)),
                deposit: parseFloat(deposit.toFixed(2)),
                base_currency: parseFloat(baseTotal.toFixed(2)),
                base_deposit: parseFloat(baseDeposit.toFixed(2)),
            }));
        };

        calculateTotalsAndFetch();
    }, [detailList]);

    useEffect(() => {
        fetchProducts(currentPageProduct, itemsPerPageProduct, searchTermProduct, selectedProducts);
    }, [currentPageProduct, itemsPerPageProduct, searchTermProduct, selectedProducts]);

    // Keep ref updated
    useEffect(() => {
        isDirtyRef.current = isDirty;
    }, [isDirty]);

    useEffect(() => {
        const fetchAllCustomerData = () => {
            fetchPurchaseOrderInfo();
        };
        const fetchDropdownData = () => {
            loadCourier();
            loadWarehouse();
            loadShippingTerms();
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
            setDepositList([]);
            setIsDirty(false);
            isDirtyRef.current = false;
            setIsInitialized(false);
            setLoading(false);
        } else {
            fetchAllCustomerData();
        }
    }, [purchaseOrderId, saveType]);

    useEffect(() => {
        if (!masterList) return;

        if (!isInitialized) {
            // A more robust check to see if the form is fully initialized
            const isFormReady =
                (masterList.procurement_by_id ? !!formData.procurement_by_id : true) &&
                (masterList.ship_to ? !!formData.ship_to : true) &&
                (masterList.postatus_id ? !!formData.postatus_id : true) &&
                (masterList.payment_terms_id ? !!formData.payment_terms_id : true) &&
                (masterList.shipping_terms_id ? !!formData.shipping_terms_id : true) &&
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
        if (masterList && paymentTermsOption.length > 0) {
            const selectedOption = convertToSingleOption(masterList.payment_terms_id, paymentTermsOption);
            setFormData((prev) => ({ ...prev, payment_terms_id: selectedOption }));
        }
    }, [masterList, paymentTermsOption, lang]);

    useEffect(() => {
        if (masterList && allPOStatusOptions.length > 0) {
            const selectedOption = convertToSingleOption(masterList.postatus_id || 1, allPOStatusOptions);
            setFormData((prev) => ({ ...prev, postatus_id: selectedOption }));
        }
    }, [masterList, allPOStatusOptions, lang]);

    useEffect(() => {
        if (masterList && warehouseOptions.length > 0) {
            const selectedOption = convertToSingleOption(masterList.ship_to, warehouseOptions);
            setFormData((prev) => ({ ...prev, ship_to: selectedOption }));
        }
    }, [masterList, warehouseOptions, lang]);

    useEffect(() => {
        if (masterList && storeLocationOptions.length > 0) {
            const selectedOption = convertToSingleOption(masterList.procurement_by_id, storeLocationOptions);
            setFormData((prev) => ({ ...prev, procurement_by_id: selectedOption }));
        }
    }, [masterList, storeLocationOptions, lang]);

    useEffect(() => {
        if (masterList && banksOptions.length > 0) {
            const selectedOption = convertToSingleOption(masterList.bank, banksOptions);
            setFormData((prev) => ({ ...prev, bank: selectedOption }));
        }
    }, [masterList, banksOptions, lang]);
    // ON LOAD LIST
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
    const fetchPurchaseOrderInfo = async () => {
        try {
            const idToUse = purchaseOrderId;
            if (!idToUse) {
                setLoading(false);
                return;
            }
            isDirtyRef.current = true; // 🔐 prevent dirty tracking
            setLoading(true);
            setError(null);

            const purchaseOrderInfoKey = `${idToUse}-cached-po-info`;
            const cachedSuppliersRaw = localStorage.getItem(purchaseOrderInfoKey);
            let foundSupplier;

            if (cachedSuppliersRaw) {
                foundSupplier = JSON.parse(cachedSuppliersRaw); // ✅ Parse cached JSON
            } else {
                foundSupplier = await purchaseOrderService.getPurchaseOrderInfo(idToUse); // ✅ Fetch from API
            }
            if (foundSupplier) {
                setTransDetails(foundSupplier);
                setDetailList(foundSupplier.details);
                setDepositList(foundSupplier.pvDetails);
                setFormData((prev) => ({
                    ...prev,
                    supplier_id: foundSupplier.supplier_id || 0,
                    supplier_code: foundSupplier.supplier_code || "",
                    po_number: foundSupplier.po_number || "",
                    suppliername_en: foundSupplier.suppliername_en || "",
                    suppliername_cn: foundSupplier.suppliername_cn || "",
                    supplier_address_en: foundSupplier.supplier_address_en || "",
                    supplier_address_cn: foundSupplier.supplier_address_cn || "",
                    currency: foundSupplier.currency || "",
                    ex_rate: foundSupplier.ex_rate || 0,
                    po_amount: foundSupplier.po_amount || 0,
                    base_currency: foundSupplier.base_currency || 0,
                    deposit: foundSupplier.deposit || 0,
                    PVJVDeposit: foundSupplier.PVJVDeposit || 0,
                    base_deposit: foundSupplier.base_deposit || 0,
                    bank_charges: foundSupplier.bank_charges || 0,
                    base_bank_charges: foundSupplier.base_bank_charges || 0,
                    current_credit: foundSupplier.current_credit || 0,
                    po_date: parseDate(foundSupplier.po_date),
                }));

                // ✅ Only cache if it's a fresh fetch
                if (!cachedSuppliersRaw) {
                    localStorage.setItem(purchaseOrderInfoKey, JSON.stringify(foundSupplier));
                }
            } else {
                setError("supplier not found");
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to fetch po details");
            console.error("Error fetching po details:", err);
        } finally {
            setLoading(false);
            isDirtyRef.current = false; // ✅ re-enable dirty tracking
        }
    };
    const fetchProducts = async (page = currentPageProduct, perPage = itemsPerPageProduct, search = "", sortId = selectedProducts) => {
        try {
            setError(null);
            localStorage.setItem(`po-loading-products`, JSON.stringify(true));
            const paginatedData = await productService.getAllProductsBySort(page, perPage, search, sortId);
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
            localStorage.setItem(`po-loading-products`, JSON.stringify(false));
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
            const newData = await purchaseOrderService.getPurchaseOrderInfo(masterId);
            if (newData) {
                localStorage.setItem(`${masterId}-cached-po-info`, JSON.stringify(newData));
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
            const list = await fetchPOStatus(); // fetches & returns
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
        const supplier_code = formData["supplier_code"]?.toString().trim() ?? "";
        const procurement_by_id = formData["procurement_by_id"]?.toString().trim() ?? null;
        const ship_to = formData["ship_to"]?.toString().trim() ?? null;
        const bank = formData["bank"]?.toString().trim() ?? null;
        const deposit = formData["deposit"]?.toString().trim() ?? 0;
        const duplicates = findDuplicateProductIds(detailList);
        if (!supplier_code || supplier_code === "") {
            showErrorToast(translations["Supplier Code Empty"]);
            setLoadingSave(false); // Enable button again
            return;
        }
        if (!procurement_by_id) {
            showErrorToast(translations["Procurement By is required"]);
            setLoadingSave(false); // Enable button again
            return;
        }
        if (!ship_to) {
            showErrorToast(translations["Ship To is required"]);
            setLoadingSave(false); // Enable button again
            return;
        }
        if (detailList.length === 0) {
            showErrorToast(translations["Detail(s) Required"]);
            setLoadingSave(false); // Enable button again
            return;
        }
        if (Number(deposit) > 0 && !bank) {
            showErrorToast(translations["Bank is required"]);
            setLoadingSave(false); // Enable button again
            return;
        }
        if (duplicates.length > 0) {
            showErrorToast(translations["No duplicate entry"]);
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
                            qty: list.qty,
                            price: list.price,
                            total: list.total,
                            retail_price: list.retail_price,
                            item_cost: list.item_cost,
                            deposit: list.deposit,
                            release_date: list.release_date,
                            po_dateline: list.po_dateline,
                            is_deleted: list.is_deleted,
                            delete_type: list.delete_type ?? "",
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
            const result = await purchaseOrderService.updatePurchaseOrder(purchaseOrderId, data);
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
                onChangePurchaseOrderId(newId);
                onChangeSaveType("edit");
            }
            // Reset state to allow re-initialization after refetch
            setIsDirty(false);
            setIsInitialized(false);
            await updateCachedRaw("info", newId);
            fetchPurchaseOrderInfo();
            showSuccessToast(translations[result.message]);
            onSave(); // This will now trigger the cache clearing in the parent
        } catch (error) {
            showErrorToast(translations["Failed to save PO."] || "Failed to save PO.");
        } finally {
            setLoadingSave(false); // Enable button again after the operation is done
        }
    };
    const handleAddNew = async () => {
        onChangePurchaseOrderId(0);
        onChangeSaveType("new");
        clearForms(allPOStatusOptions);
        setIsDirty(false);
        isDirtyRef.current = false;
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
                for (const element of selectProducts) {
                    try {
                        const res = await purchaseOrderService.getPOProductInfo(element.product_code);
                        const newData: DetailsRow = {
                            id: 0,
                            indexInt: newIndex,
                            product_code: res.list.product_code,
                            product_title_en: res.list.product_title_en,
                            product_title_cn: res.list.product_title_cn,
                            po_dateline: res.list.po_dateline,
                            release_date: res.list.release_date,
                            age_type: "old",
                            is_deleted: 0,
                            qty: res.list.qty,
                            orig_qty: res.list.qty,
                            price: res.list.price,
                            total: res.list.total,
                            deposit: 0,
                            receive_qty: 0,
                            retail_price: 0,
                            item_cost: 0,
                            ex_rate: 0,
                            total_amount: 0,
                            product_id: res.list.product_id,
                            pv_date: "",
                            pv_number: "",
                            po_number: "",
                            delete_type: "",
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
            selectedPurchaseOrder(allIds);
        } else {
            selectedPurchaseOrder([]);
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
            selectedPurchaseOrder((prev) => [...prev, id]);
        } else {
            selectedPurchaseOrder((prev) => prev.filter((pid) => pid !== id));
        }
    };
    const handlePODateChange = useCallback((dates: Date[]) => {
        setFormData((prev) => ({ ...prev, po_date: dates[0] ?? null }));
        if (!isDirtyRef.current) {
            setIsDirty(true); // ✅ only if user is editing
        }
    }, []);
    const handleAddRow = () => {
        const newId = Math.floor(10000 + Math.random() * 90000);
        const newData: DetailsRow = {
            id: 0,
            indexInt: newId,
            product_code: "",
            product_title_en: "",
            product_title_cn: "",
            po_dateline: "",
            release_date: "",
            age_type: "new",
            is_deleted: 0,
            qty: 0,
            orig_qty: 0,
            price: 0,
            total: 0,
            deposit: 0,
            product_id: 0,
            receive_qty: 0,
            retail_price: 0,
            item_cost: 0,
            ex_rate: 0,
            total_amount: 0,
            pv_date: "",
            pv_number: "",
            po_number: "",
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
        const selectedItems = detailList.filter((list) => selectedDetails.includes(list.indexInt));
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

        // Now handle the async part after state update
        let totalDeposit = 0;
        for (const item of selectedItems) {
            try {
                const deposit = await purchaseOrderService.getDepositPV(item.po_number, item.product_id);
                totalDeposit += deposit ?? 0;
            } catch (err) {
                console.error("Error fetching deposit:", err);
            }
        }
        if (totalDeposit > 0) {
            setCancelType("checkbox");
            setShowCancelOrder(true);
        }
    };
    const handleDetailDatesChange = (index: any, selectedDates: any, column: string) => {
        const selectedDate = selectedDates[0];
        if (column === "release_date") {
            setDetailList((prev) => prev.map((item) => (item.indexInt === index ? { ...item, release_date: selectedDate } : item)));
        }
        if (column === "po_dateline") {
            setDetailList((prev) => prev.map((item) => (item.indexInt === index ? { ...item, po_dateline: selectedDate } : item)));
        }
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
    const handleDetailBlur = async (indexInt: number, receiveQty: number, qty: number, orig_qty: number, id: number) => {
        if (id > 0) {
            const countGRNExists = await purchaseOrderService.getCountGRN(id);
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
    const handleEnterKey = async (indexInt: number, value: string, column: string, ageType: string) => {
        switch (column) {
            case "product_code":
                try {
                    setGlobalIndex(indexInt);
                    setAgeType(ageType);
                    const res = await purchaseOrderService.getPOProductInfo(value);
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
                                // Convert value to number if it's a numeric field
                                updatedItem["product_id"] = res.list.product_id;
                                updatedItem["product_code"] = res.list.product_code;
                                updatedItem["product_title_en"] = res.list.product_title_en;
                                updatedItem["product_title_cn"] = res.list.product_title_cn;
                                updatedItem["qty"] = res.list.qty;
                                updatedItem["price"] = res.list.price;
                                updatedItem["total"] = res.list.total;
                                updatedItem["item_cost"] = res.list.item_cost;
                                updatedItem["retail_price"] = res.list.retail_price;
                                updatedItem["release_date"] = res.list.release_date;
                                updatedItem["po_dateline"] = res.list.po_dateline;
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
                const res = await purchaseOrderService.getPOSupplierInfo(value);
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
    const handleSaveCancelPO = async (type: string) => {
        if (cancelType === "button") {
            if (type === "CTOSUPP") {
                setLoadCancelOrder_CTOSUPP(true);
            }
            if (type === "MSCLSS") {
                setLoadCancelOrder_MSCLSS(true);
            }
            if (type === "RPTOS") {
                setLoadCancelOrder_RPTOS(true);
            }
            try {
                const result = await purchaseOrderService.cancelPurchaseOrder(formData.po_number, type);
                if (result.token === "Error") {
                    setLoadCancelOrder_CTOSUPP(false);
                    setLoadCancelOrder_MSCLSS(false);
                    setLoadCancelOrder_RPTOS(false);
                    showErrorToast(result.message);
                    return;
                }
                setShowCancelOrder(false);
                setLoadCancelOrder_CTOSUPP(false);
                setLoadCancelOrder_MSCLSS(false);
                setLoadCancelOrder_RPTOS(false);
                await updateCachedRaw("info", purchaseOrderId);
                fetchPurchaseOrderInfo();
                selectedPurchaseOrder([]);
                showSuccessToast(translations[result.message]);
            } catch (err) {
                setLoadCancelOrder_CTOSUPP(false);
                setLoadCancelOrder_MSCLSS(false);
                setLoadCancelOrder_RPTOS(false);
                showErrorToast(translations["alert_message_18"]);
                console.error("Deletion failed:", err);
            }
        } else {
            selectedDetails.forEach((paraIndex) => {
                setDetailList((prev) => prev.map((item) => (item.indexInt === paraIndex ? { ...item, delete_type: type } : item)));
            });
            setShowCancelOrder(false);
            selectedPurchaseOrder([]);
        }
    };
    const handleVoid = async () => {
        let totalReceiveQty = 0;
        let totalPaidPV = formData.PVJVDeposit;
        detailList.forEach((element) => {
            totalReceiveQty += element.receive_qty;
        });
        if (totalReceiveQty > 0) {
            showErrorToast(translations["Receive Qty Detected"]);
            return;
        }
        if (totalPaidPV > 0) {
            setCancelType("button");
            setShowCancelOrder(true);
            return;
        }
        const confirmed = await showConfirm(translations["Void Record(s)"], translations["alert_message_38"], translations["Yes"], translations["Cancel"]);
        if (!confirmed) return;
        try {
            const res = await purchaseOrderService.voidPurchaseOrder(formData.po_number);
            if (res.token === "Error") {
                showErrorToast(res.message);
                return;
            }
            await updateCachedRaw("info", purchaseOrderId);
            fetchPurchaseOrderInfo();
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
        const res = await purchaseOrderService.getPOSupplierInfo(String(supplier_code));
        if (res.token === "SupplierNotExists") {
            showErrorToast(translations[res.message]);
            return;
        }
        const payment_terms_id = convertToSingleOption(res.list.payment_terms_id, paymentTermsOption);
        const delivery_method_id = convertToSingleOption(res.list.delivery_method_id, courierOption);
        const shipping_terms_id = convertToSingleOption(res.list.shipping_terms_id, shippingTermsOption);
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
        setShowSuppliers(false);
    };
    const handleToggleRow = async (tableId: number) => {
        const isExpanded = expanded_Orders.includes(tableId);
        const cachedKey = `cached-po-deposit-dtls-${tableId}`;
        console.log(depositList);
        if (isExpanded) {
            // Collapse row
            setExpandedRows(expanded_Orders.filter((id) => id !== tableId));
        } else {
            // Expand row
            setExpandedRows([...expanded_Orders, tableId]);
            try {
                const data = depositList.find((po) => po.id === tableId);
                // Save to state
                if (!data?.details) {
                    console.error("No details found for this PO");
                    setPODetailsMap((prev) => ({ ...prev, [tableId]: null }));
                    return;
                }
                const pvDetails: DetailsExpanded[] = Object.values(data.details);
                setPODetailsMap((prev) => ({ ...prev, [tableId]: pvDetails }));
                localStorage.setItem(cachedKey, JSON.stringify(pvDetails));
            } catch (error) {
                console.error(`Failed to load details for product ${tableId}`, error);
                setPODetailsMap((prev) => ({ ...prev, [tableId]: null }));
            }
        }
    };
    const handleDatePV = useCallback((dates: Date[]) => {
        setFormDataPV((prev) => ({ ...prev, pv_date: dates[0] ?? null }));
    }, []);
    const handlePopupCredits = async () => {
        try {
            const paginatedData = await purchaseOrderService.getSupplierCredit(1);
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
        data.append(`po_numbers[0]`, formData.po_number);
        try {
            const result = await purchaseOrderService.createPVDeposit(data, type);
            if (result.token === "Error") {
                showErrorToast(translations[result.message] + " " + result.message2);
                return;
            }
            setShowCreatePV(false);
            await updateCachedRaw("info", purchaseOrderId);
            fetchPurchaseOrderInfo();
            showSuccessToast(translations[result.message]);
        } catch (error) {
            showErrorToast(translations["Failed to save Create PV."] || "Failed to save Create PV.");
        } finally {
        }
    };
    // ✅ First filter out products that already exist in detailList
    // Filter suppliers based on search term
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
    const rendersupplierInformation = () => (
        <div className="p-1 bg-[#19191c] rounded-xl">
            <div className="h-[calc(100vh-200px)] overflow-y-auto pr-2">
                <div className="grid gap-4">
                    <div className="grid grid-cols-12 gap-4">
                        {/* Right side: 12 columns */}
                        <div className="col-span-12 p-1">
                            <fieldset className="grid grid-cols-12 gap-4 border-[1px] border-[#ffffff1a] rounded-lg p-4 mb-2">
                                <div className="col-span-12 md:col-span-4">
                                    <div className="flex items-center gap-4 mb-2">
                                        <label className="w-[25%] text-gray-400 text-sm text-right">{translations["Supplier Code"]}</label>
                                        <div className="flex flex-1">
                                            <input
                                                type="text"
                                                value={formData.supplier_code}
                                                readOnly={masterList?.postatus_id === 4}
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
                                                disabled={masterList?.postatus_id === 4}
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
                                            rows={3}
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
                                            rows={3}
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
                                    <div className="flex items-center space-x-4 mb-2">
                                        <label className="w-[26%] text-gray-400 text-sm text-right">{translations["Procurement By"]}</label>
                                        <Select
                                            classNamePrefix="react-select"
                                            value={formData.procurement_by_id}
                                            isDisabled={masterList?.postatus_id === 4}
                                            onChange={async (selected) => {
                                                setFormData({ ...formData, procurement_by_id: selected as OptionType | null });
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
                                        <label className="w-[26%] text-gray-400 text-sm text-right">{translations["Shipping Terms"]}</label>
                                        <Select
                                            classNamePrefix="react-select"
                                            value={formData.shipping_terms_id}
                                            isDisabled={masterList?.postatus_id === 4}
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
                                            isDisabled={masterList?.postatus_id === 4}
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
                                    <div className="flex items-center space-x-4 mb-2">
                                        <label className="w-[26%] text-gray-400 text-sm text-right">{translations["Ship To"]}</label>
                                        <Select
                                            classNamePrefix="react-select"
                                            value={formData.ship_to}
                                            isDisabled={masterList?.postatus_id === 4}
                                            onChange={(selected) => {
                                                setFormData({ ...formData, ship_to: selected as OptionType | null });
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
                                        <label className="w-[26%] text-gray-400 text-sm text-right">{translations["Delivery Method"]}</label>
                                        <Select
                                            classNamePrefix="react-select"
                                            value={formData.delivery_method_id}
                                            isDisabled={masterList?.postatus_id === 4}
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
                                </div>
                                <div className="col-span-12 md:col-span-4">
                                    <div className="flex items-center space-x-4 mb-2">
                                        <label className="w-[25%] text-gray-400 text-sm text-right">{translations["PO Number"]}</label>
                                        <input
                                            value={formData.po_number}
                                            readOnly
                                            onChange={(e) => {
                                                const value = e.target.value;
                                                setFormData((prev) => ({ ...prev, po_number: value }));
                                                if (!isDirtyRef.current) setIsDirty(true);
                                            }}
                                            className="flex-1 px-3 py-2 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm"
                                        />
                                    </div>
                                    <div className="flex items-center space-x-4 mb-2">
                                        <label className="w-[25%] text-gray-400 text-sm text-right">{translations["PO Date"]}</label>
                                        <Flatpickr
                                            onChange={handlePODateChange}
                                            options={{
                                                dateFormat: "M d Y",
                                                defaultDate: formData.po_date || undefined,
                                                allowInput: true,
                                                locale: locale,
                                            }}
                                            className="flex-1 px-3 py-2 border-[1px] border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm"
                                        />
                                    </div>
                                    <div className="flex items-center space-x-4 mb-2">
                                        <label className="w-[25%] text-gray-400 text-sm text-right">{translations["Exchange Rate"]}</label>
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
                                        <label className="w-[26%] text-gray-400 text-sm text-right">{translations["Status"]}</label>
                                        <Select
                                            classNamePrefix="react-select"
                                            value={formData.postatus_id}
                                            onChange={(selected) => {
                                                setFormData({ ...formData, postatus_id: selected as OptionType | null });
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
                                                            disabled={masterList?.postatus_id === 4}
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
                                                            disabled={masterList?.postatus_id === 4}
                                                            className="px-1 py-1 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-xs"
                                                        >
                                                            <Plus className="h-4 w-4" />
                                                        </button>
                                                        {/* Tooltip */}
                                                        {masterList?.postatus_id !== 4 && (
                                                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block z-10">
                                                                <div className="bg-gray-800 text-white text-xs rounded py-1 px-2 shadow-lg whitespace-nowrap uppercase">{translations["Add Row"]}</div>
                                                                <div className="w-2 h-2 bg-gray-800 rotate-45 absolute top-full left-1/2 transform -translate-x-1/2"></div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </th>
                                                <th className="w-[2%] text-left py-1 px-2 text-gray-400 text-sm border border-[#40404042]"></th>
                                                <th className="w-[10%] text-left py-2 px-2 text-gray-400 text-sm border border-[#40404042]">{translations["Product Code"]}</th>
                                                <th className="w-[22%] text-left py-2 px-2 text-gray-400 text-sm border border-[#40404042]">{translations["Product Name"]}</th>
                                                <th className="w-[9%] text-center py-2 px-2 text-gray-400 text-sm border border-[#40404042]">{translations["Qty"]}</th>
                                                <th className="w-[9%] text-center py-2 px-2 text-gray-400 text-sm border border-[#40404042]">{translations["Unit Price"]}</th>
                                                <th className="w-[9%] text-center py-2 px-2 text-gray-400 text-sm border border-[#40404042]">{translations["Total"]}</th>
                                                <th className="w-[9%] text-center py-2 px-2 text-gray-400 text-sm border border-[#40404042]">{translations["Deposit"]}</th>
                                                <th className="w-[13%] text-center py-2 px-2 text-gray-400 text-sm border border-[#40404042]">{translations["Delivery Date"]}</th>
                                                <th className="w-[13%] text-center py-2 px-2 text-gray-400 text-sm border border-[#40404042]">{translations["Due Date"]}</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {detailList.length === 0 ? (
                                                <tr className="clickable border-b hover:bg-gray-700 hover:bg-opacity-30 transition-colors cursor-pointer" style={{ borderColor: "#40404042" }}>
                                                    <td colSpan={11} className="py-2 px-2 text-gray-400 text-center text-custom-sm border border-[#40404042]">
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
                                                                        disabled={masterList?.postatus_id === 4}
                                                                        onChange={(checked) => handleSelectSupplier(item.indexInt as number, checked)}
                                                                    />
                                                                </td>
                                                                <td className="py-2 px-2 text-gray-400 text-left text-custom-sm border border-[#40404042]">
                                                                    <div className="relative group inline-block">
                                                                        <button
                                                                            type="button"
                                                                            disabled={masterList?.postatus_id === 4}
                                                                            onClick={() => handleRemoveRow()}
                                                                            className="px-1 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-xs"
                                                                        >
                                                                            <X className="h-4 w-4" />
                                                                        </button>
                                                                        {/* Tooltip */}
                                                                        {masterList?.postatus_id !== 4 && (
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
                                                                            disabled={masterList?.postatus_id === 4}
                                                                            onClick={() => handlPopupProducts(item.indexInt, item.age_type)}
                                                                            className="px-1 py-1 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors text-xs"
                                                                        >
                                                                            <Search className="h-4 w-4" />
                                                                        </button>
                                                                        {/* Tooltip */}
                                                                        {masterList?.postatus_id !== 4 && (
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
                                                                        readOnly={masterList?.postatus_id === 4}
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
                                                                        value={item.qty}
                                                                        readOnly={masterList?.postatus_id === 4}
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
                                                                        onBlur={(e) => {
                                                                            const value = Number(e.target.value);
                                                                            handleDetailBlur(item.indexInt, item.receive_qty, value, item.orig_qty, item.id);
                                                                        }}
                                                                        className="w-full px-3 py-1.5 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-sm rounded text-center"
                                                                    />
                                                                </td>
                                                                <td className="py-0 px-0 text-gray-400 text-center text-custom-sm border border-[#40404042]">
                                                                    <input
                                                                        type="number"
                                                                        value={item.price}
                                                                        readOnly={masterList?.postatus_id === 4}
                                                                        onChange={(e) => {
                                                                            const value = e.target.value;
                                                                            if (/^\d*\.?\d*$/.test(value)) {
                                                                                handleDetailChange(item.indexInt, value, "price");
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
                                                                        value={item.total}
                                                                        readOnly
                                                                        onChange={(e) => {
                                                                            const value = e.target.value;
                                                                            if (/^\d*\.?\d*$/.test(value)) {
                                                                                handleDetailChange(item.indexInt, value, "total");
                                                                            }
                                                                        }}
                                                                        className="w-full px-3 py-1.5 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-sm rounded text-center"
                                                                    />
                                                                </td>
                                                                <td className="py-0 px-0 text-gray-400 text-center text-custom-sm border border-[#40404042]">
                                                                    <input
                                                                        type="number"
                                                                        value={item.deposit}
                                                                        readOnly={masterList?.postatus_id === 4}
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
                                                                    <Flatpickr
                                                                        onChange={(selectedDates) => handleDetailDatesChange(item.indexInt, selectedDates, "release_date")}
                                                                        options={{
                                                                            dateFormat: "M d Y",
                                                                            defaultDate: item.release_date ? new Date(item.release_date) : undefined,
                                                                            allowInput: true,
                                                                            locale: locale,
                                                                        }}
                                                                        className="w-full px-3 py-2 border-[1px] border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm text-center"
                                                                    />
                                                                </td>
                                                                <td className="py-0 px-0 text-gray-400 text-center text-custom-sm border border-[#40404042]">
                                                                    <Flatpickr
                                                                        onChange={(selectedDates) => handleDetailDatesChange(item.indexInt, selectedDates, "po_dateline")}
                                                                        options={{
                                                                            dateFormat: "M d Y",
                                                                            defaultDate: item.po_dateline ? new Date(item.po_dateline) : undefined,
                                                                            allowInput: true,
                                                                            locale: locale,
                                                                        }}
                                                                        className="w-full px-3 py-2 border-[1px] border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm text-center"
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
                                            isDisabled={masterList?.postatus_id === 4}
                                            className="w-[75%]"
                                            placeholder={translations["Select"]}
                                            menuPlacement="auto"
                                            menuPosition="fixed"
                                            menuPortalTarget={typeof window !== "undefined" ? document.body : null}
                                        />
                                    </div>
                                    <div className="flex items-center space-x-4 mb-2">
                                        <label className="w-[25%] text-gray-400 text-sm text-right">{translations["Bank Charges"]}</label>
                                        <input
                                            type="number"
                                            value={formData.bank_charges}
                                            readOnly={masterList?.postatus_id === 4}
                                            onChange={(e) => {
                                                const input = e.target.value;
                                                // Validate string input using regex
                                                if (/^\d*\.?\d*$/.test(input)) {
                                                    const value = Number(input); // Safe to convert now
                                                    setFormData((prev) => ({ ...prev, bank_charges: value }));
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
                                        <input
                                            type="text"
                                            hidden
                                            readOnly
                                            value={formData.base_bank_charges}
                                            onChange={(e) => {
                                                const value = Number(e.target.value);
                                                setFormData((prev) => ({ ...prev, base_bank_charges: value }));
                                                if (!isDirtyRef.current) setIsDirty(true);
                                            }}
                                            className="flex-1 px-3 py-2 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm text-right"
                                        />
                                    </div>
                                </div>
                                <div className="col-span-12 md:col-span-3">
                                    <div className="flex items-center space-x-4 mb-2">
                                        <label className="w-[25%] text-gray-400 text-sm text-right">{translations["Deposit"]}</label>
                                        <input
                                            type="text"
                                            hidden={lang === "cn"}
                                            readOnly
                                            value={formData.deposit}
                                            onChange={(e) => {
                                                const value = Number(e.target.value);
                                                setFormData((prev) => ({ ...prev, deposit: value }));
                                                if (!isDirtyRef.current) setIsDirty(true);
                                            }}
                                            className="flex-1 px-3 py-2 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm text-right"
                                        />
                                        <input
                                            type="text"
                                            hidden
                                            readOnly
                                            value={formData.base_deposit}
                                            onChange={(e) => {
                                                const value = Number(e.target.value);
                                                setFormData((prev) => ({ ...prev, base_deposit: value }));
                                                if (!isDirtyRef.current) setIsDirty(true);
                                            }}
                                            className="flex-1 px-3 py-2 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm text-right"
                                        />
                                    </div>
                                    <div className="flex items-center space-x-4 mb-2">
                                        <label className="w-[25%] text-gray-400 text-sm text-right">{translations["Current Credit"]}</label>
                                        <input
                                            type="text"
                                            readOnly
                                            value={formData.current_credit}
                                            onChange={(e) => {
                                                const value = Number(e.target.value);
                                                setFormData((prev) => ({ ...prev, current_credit: value }));
                                                if (!isDirtyRef.current) setIsDirty(true);
                                            }}
                                            className="flex-1 px-3 py-2 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm text-right"
                                        />
                                    </div>
                                </div>
                                <div className="col-span-12 md:col-span-3"></div>
                                <div className="col-span-12 md:col-span-3">
                                    <div className="flex items-center space-x-4 mb-2">
                                        <label className="w-[35%] text-gray-400 text-sm text-right">{translations["PO Amount"]}</label>
                                        <input
                                            type="text"
                                            readOnly
                                            value={formData.currency}
                                            onChange={(e) => {
                                                const value = e.target.value;
                                                setFormData((prev) => ({ ...prev, currency: value }));
                                                if (!isDirtyRef.current) setIsDirty(true);
                                            }}
                                            className="w-[20%] px-3 py-2 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm text-center"
                                        />
                                        <input
                                            type="text"
                                            readOnly
                                            value={formData.po_amount}
                                            onChange={(e) => {
                                                const value = Number(e.target.value);
                                                setFormData((prev) => ({ ...prev, po_amount: value }));
                                                if (!isDirtyRef.current) setIsDirty(true);
                                            }}
                                            className="w-[45%] px-3 py-2 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm text-right"
                                        />
                                    </div>
                                    <div className="flex items-center space-x-4 mb-2">
                                        <label className="w-[35%] text-gray-400 text-sm text-right">{translations["Default Currency"]}</label>
                                        <input
                                            type="text"
                                            readOnly
                                            value={baseCurrency()}
                                            className="w-[20%] px-3 py-2 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm text-center"
                                        />
                                        <input
                                            type="text"
                                            readOnly
                                            value={formData.base_currency}
                                            onChange={(e) => {
                                                const value = Number(e.target.value);
                                                setFormData((prev) => ({ ...prev, base_currency: value }));
                                                if (!isDirtyRef.current) setIsDirty(true);
                                            }}
                                            className="w-[45%] px-3 py-2 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm text-right"
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
                <div className="bg-[#19191c] rounded-xl border border-[#ffffff1a] w-[60vw] h-auto flex flex-col">
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
                        <div className="h-[calc(100vh-435px)] overflow-y-auto">
                            <table className="w-full">
                                <thead className="sticky top-0 z-[1]" style={{ backgroundColor: "#1f2132" }}>
                                    <tr className="border-b" style={{ borderColor: "#2d2d30" }}>
                                        <th className="w-[3%] text-left py-2 px-2 text-gray-400 text-sm">
                                            <CustomCheckbox checked={selectedProducts.length === products.length && products.length > 0} onChange={(checked) => handleSelectAllProducts(checked)} />
                                        </th>
                                        <th className="w-[3%] text-left py-2 px-2 text-gray-400 text-sm">{translations["Profile"]}</th>
                                        <th className="w-[14%] text-left py-2 px-2 text-gray-400 text-sm">{translations["Product Code"]}</th>
                                        <th className="w-[34%] text-left py-2 px-2 text-gray-400 text-sm">{translations["Product Name"]}</th>
                                        <th className="w-[13%] text-left py-2 px-2 text-gray-400 text-sm">{translations["Date Created"]}</th>
                                        <th className="w-[17%] text-left py-2 px-2 text-gray-400 text-sm">{translations["PO Submission Dateline"]}</th>
                                        <th className="w-[13%] text-left py-2 px-2 text-gray-400 text-sm">{translations["Release Date"]}</th>
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
                                                <div className="w-8 h-8 bg-gray-600 rounded-lg flex items-center justify-center">
                                                    <img
                                                        src={`${import.meta.env.VITE_BASE_URL}/storage/${product.product_thumbnail ?? "products/no-image-min.jpg"}`}
                                                        alt="Thumbnail"
                                                        className="w-full h-full object-cover"
                                                        onError={(e) => {
                                                            (e.target as HTMLImageElement).src = `${import.meta.env.VITE_BASE_URL}/storage/products/no-image-min.jpg`;
                                                        }}
                                                    />
                                                </div>
                                            </td>
                                            <td className="py-2 px-2 text-gray-400 text-left text-custom-sm">{product.product_code}</td>
                                            <td className="py-2 px-2 text-gray-400 text-left text-custom-sm">{lang === "en" ? product.product_title_en : product.product_title_cn}</td>
                                            <td className="py-2 px-2 text-gray-400 text-left text-custom-sm">{formatDate(product.created_date, lang)}</td>
                                            <td className="py-2 px-2 text-gray-400 text-left text-custom-sm">{formatDate(product.po_dateline, lang)}</td>
                                            <td className="py-2 px-2 text-gray-400 text-left text-custom-sm">{formatDate(product.release_date, lang)}</td>
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
                                {translations["Search"]}
                            </button>
                        </div>
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
                                    onClick={() => handleSaveCancelPO("CTOSUPP")}
                                    className={`px-2 py-2 bg-cyan-600 hover:bg-cyan-500 rounded text-white transition w-full
                            ${loadCancelOrder_CTOSUPP ? "bg-gray-500 cursor-not-allowed opacity-50" : "bg-cyan-600 hover:bg-cyan-700"} 
                            text-[#ffffffcc] flex justify-center items-center`}
                                    disabled={loadCancelOrder_CTOSUPP || loadCancelOrder_MSCLSS || loadCancelOrder_RPTOS}
                                >
                                    {loadCancelOrder_CTOSUPP ? (
                                        <>
                                            <div className="loader mr-2"></div>
                                            <span>{translations["Processing2"]}...</span>
                                        </>
                                    ) : (
                                        <span>{translations["Credit from Supplier"]}</span>
                                    )}
                                </button>
                            </div>
                            <div className={`col-span-12 md:col-span-12`}>
                                <button
                                    onClick={() => handleSaveCancelPO("MSCLSS")}
                                    className={`px-2 py-2 bg-cyan-600 hover:bg-cyan-500 rounded text-white transition w-full
                            ${loadCancelOrder_MSCLSS ? "bg-gray-500 cursor-not-allowed opacity-50" : "bg-cyan-600 hover:bg-cyan-700"} 
                            text-[#ffffffcc] flex justify-center items-center`}
                                    disabled={loadCancelOrder_CTOSUPP || loadCancelOrder_MSCLSS || loadCancelOrder_RPTOS}
                                >
                                    {loadCancelOrder_MSCLSS ? (
                                        <>
                                            <div className="loader mr-2"></div>
                                            <span>{translations["Processing2"]}...</span>
                                        </>
                                    ) : (
                                        <span>{translations["Misc loss"]}</span>
                                    )}
                                </button>
                            </div>
                            <div className={`col-span-12 md:col-span-12`}>
                                <button
                                    onClick={() => handleSaveCancelPO("RPTOS")}
                                    className={`px-2 py-2 bg-cyan-600 hover:bg-cyan-500 rounded text-white transition w-full
                            ${loadCancelOrder_RPTOS ? "bg-gray-500 cursor-not-allowed opacity-50" : "bg-cyan-600 hover:bg-cyan-700"} 
                            text-[#ffffffcc] flex justify-center items-center`}
                                    disabled={loadCancelOrder_CTOSUPP || loadCancelOrder_MSCLSS || loadCancelOrder_RPTOS}
                                >
                                    {loadCancelOrder_RPTOS ? (
                                        <>
                                            <div className="loader mr-2"></div>
                                            <span>{translations["Processing2"]}...</span>
                                        </>
                                    ) : (
                                        <span>{translations["Refund payment from supplier"]}</span>
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
                        <div className="h-[calc(100vh-435px)] overflow-y-auto">
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
    const renderDepositList = () => {
        if (!showDeposit) return null;
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-[#19191c] rounded-xl border border-[#ffffff1a] w-[60vw] h-auto flex flex-col">
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-[#ffffff1a]">
                        <div className="flex items-center space-x-4">
                            <h2 className="text-xl font-bold text-white">{translations["Deposit"]}</h2>
                        </div>
                        <div className="flex items-center space-x-4">
                            <button
                                onClick={() => {
                                    setShowDeposit(false);
                                }}
                                className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                            >
                                <X className="h-6 w-6 text-white" />
                            </button>
                        </div>
                    </div>
                    <div className="p-2 flex-1 overflow-auto">
                        <div className="max-h-[calc(100vh-435px)] overflow-y-auto">
                            <table className="w-full">
                                <thead className="sticky top-0 z-[1]" style={{ backgroundColor: "#1f2132" }}>
                                    <tr className="border-b" style={{ borderColor: "#2d2d30" }}>
                                        <th className=" text-left py-2 px-4 text-gray-400 text-sm"></th>
                                        <th className=" text-left py-2 px-4 text-gray-400 text-sm">{translations["PV Date"]}</th>
                                        <th className=" text-left py-2 px-4 text-gray-400 text-sm">{translations["PV No"]}</th>
                                        <th className=" text-left py-2 px-4 text-gray-400 text-sm">{translations["Ex Rate"]}</th>
                                        <th className=" text-left py-2 px-4 text-gray-400 text-sm">{translations["Amount Paid"]}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {depositList.length === 0 ? (
                                        <tr className="border-b hover:bg-gray-700 hover:bg-opacity-30 transition-colors" style={{ borderColor: "#40404042" }}>
                                            <td colSpan={11} className="py-2 px-2 text-gray-400 text-center text-custom-sm">
                                                {translations["No data available on table"]}
                                            </td>
                                        </tr>
                                    ) : (
                                        depositList.map(
                                            (item) =>
                                                item.is_deleted !== 1 && (
                                                    <React.Fragment key={item.id}>
                                                        <tr
                                                            key={item.indexInt}
                                                            className={`border-b hover:bg-gray-700 hover:bg-opacity-30 transition-colors ${
                                                                selectedDetails.includes(item.indexInt as number) ? "bg-gray-700 bg-opacity-30" : ""
                                                            }`}
                                                            style={{ borderColor: "#40404042" }}
                                                        >
                                                            <td className="py-2 px-2 text-gray-400 text-left text-custom-sm">
                                                                <button
                                                                    onClick={() => handleToggleRow(item.id)}
                                                                    className={`px-1 py-1 ${
                                                                        expanded_Orders.includes(item.id) ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"
                                                                    } text-white rounded-lg transition-colors text-xs`}
                                                                >
                                                                    {expanded_Orders.includes(item.id) ? <Minus size={16} /> : <Plus size={16} />}
                                                                </button>
                                                            </td>
                                                            <td className="py-2 px-2 text-gray-400 text-left text-custom-sm">{formatDate(item.pv_date, lang)}</td>
                                                            <td className="py-2 px-2 text-gray-400 text-left text-custom-sm">{item.pv_number}</td>
                                                            <td className="py-2 px-2 text-gray-400 text-left text-custom-sm">{item.ex_rate}</td>
                                                            <td className="py-2 px-2 text-gray-400 text-left text-custom-sm">{item.total_amount}</td>
                                                        </tr>
                                                        {expanded_Orders.includes(item.id) && (
                                                            <tr>
                                                                <td colSpan={12} className="py-3 px-4">
                                                                    <table className="w-full" style={{ backgroundColor: "#060818" }}>
                                                                        <thead className="sticky top-0 z-[1] py-1 px-4" style={{ backgroundColor: "#1f2132" }}>
                                                                            <tr className="border-b" style={{ borderColor: "#2d2d30" }}>
                                                                                <th className="text-left py-2 px-4 text-gray-400 text-sm">{translations["Account Code"]}</th>
                                                                                <th className="text-left py-2 px-4 text-gray-400 text-sm">{translations["Account Description"]}</th>
                                                                                <th className="text-left py-2 px-4 text-gray-400 text-sm">{translations["Product"]}</th>
                                                                                <th className="text-center py-2 px-4 text-gray-400 text-sm">{translations["Ex Rate"]}</th>
                                                                                <th className="text-center py-2 px-4 text-gray-400 text-sm">{translations["Amount"]}</th>
                                                                                <th className="text-center py-2 px-4 text-gray-400 text-sm">{translations["Default Currency"]}</th>
                                                                            </tr>
                                                                        </thead>
                                                                        <tbody>
                                                                            {orderDetailsMap[item.id] && orderDetailsMap[item.id]!.length > 0 ? (
                                                                                orderDetailsMap[item.id]!.map((detail, i) => (
                                                                                    <tr key={detail.id || i}>
                                                                                        <td className="py-3 px-4 text-gray-400 text-left text-custom-sm">{detail.account_code}</td>
                                                                                        <td className="py-3 px-4 text-gray-400 text-left text-custom-sm">
                                                                                            {lang === "en" ? detail.account_name_en : detail.account_name_cn}
                                                                                        </td>
                                                                                        <td className="py-2 px-2">
                                                                                            <div className="flex items-center space-x-3">
                                                                                                <div>
                                                                                                    <div className="group flex items-center">
                                                                                                        <p className="text-gray-300 text-custom-sm select-text">{detail.product_code}</p>
                                                                                                    </div>
                                                                                                    <div className="group flex items-center">
                                                                                                        <p className="text-gray-400 text-custom-sm">
                                                                                                            {lang === "en" ? detail.product_title_en : detail.product_title_cn}
                                                                                                        </p>
                                                                                                    </div>
                                                                                                </div>
                                                                                            </div>
                                                                                        </td>
                                                                                        <td className="py-3 px-4 text-gray-400 text-center text-custom-sm">{detail.ex_rate}</td>
                                                                                        <td className="py-3 px-4 text-gray-400 text-center text-custom-sm">
                                                                                            {detail.currency}
                                                                                            <br></br>
                                                                                            {formatMoney(detail.amount)}
                                                                                        </td>
                                                                                        <td className="py-3 px-4 text-gray-400 text-center text-custom-sm">
                                                                                            {baseCurrency()}
                                                                                            <br></br>
                                                                                            {formatMoney(detail.base_amount)}
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
                                                        )}
                                                    </React.Fragment>
                                                )
                                        )
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    {/* Footer */}
                    <div className="p-2 border-t border-[#ffffff1a] flex justify-end space-x-1">
                        <button onClick={() => setShowDeposit(false)} className="px-2 py-2 bg-gray-700 hover:bg-gray-600 rounded text-white transition">
                            {translations["Close"]}
                        </button>
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
                                    value={formDataPV.credit_used}
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
                <div className="flex items-center justify-between px-6 py-3">
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
                                setShowDeposit(true);
                            }}
                            disabled={masterList.postatus_id === 4}
                            className="px-2 py-2 bg-cyan-600 hover:bg-cyan-700 text-[#ffffffcc] text-custom-sm rounded-lg text-sm font-medium transition-colors"
                        >
                            {translations["View Deposit"]}
                        </button>
                        <button
                            onClick={handleSave}
                            className={`px-4 py-2 text-custom-sm rounded-lg text-sm font-medium transition-colors 
                                ${loadingSave ? "bg-gray-500 cursor-not-allowed opacity-50" : "bg-cyan-600 hover:bg-cyan-700"} 
                                text-[#ffffffcc] flex justify-center items-center`}
                            disabled={loadingSave || masterList.postatus_id === 4 || masterList.postatus_id === 3}
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
                            disabled={purchaseOrderId === 0 || masterList.postatus_id === 4}
                            className="px-2 py-2 bg-cyan-600 hover:bg-cyan-700 text-[#ffffffcc] text-custom-sm rounded-lg text-sm font-medium transition-colors"
                        >
                            {translations["Print"]}
                        </button>
                        <button onClick={handleAddNew} className="px-2 py-2 bg-cyan-600 hover:bg-cyan-700 text-[#ffffffcc] text-custom-sm rounded-lg text-sm font-medium transition-colors">
                            {translations["Add New"]}
                        </button>
                        <button
                            disabled={Number(formData.PVJVDeposit) >= Number(formData.deposit) || masterList.postatus_id === 4}
                            onClick={() => {
                                setShowCreatePV(true);
                                handlePopupCreatePV();
                            }}
                            className="px-2 py-2 bg-cyan-600 hover:bg-cyan-700 text-[#ffffffcc] text-custom-sm rounded-lg text-sm font-medium transition-colors"
                        >
                            {translations["Add Deposit PV"]}
                        </button>
                        <button
                            onClick={handleVoid}
                            disabled={purchaseOrderId === 0 || masterList.postatus_id === 4 || masterList.postatus_id === 3}
                            className="px-2 py-2 bg-red-600 hover:bg-red-700 text-[#ffffffcc] text-custom-sm rounded-lg text-sm font-medium transition-colors"
                        >
                            {translations["Void"]}
                        </button>
                    </div>
                </div>
            </div>
            {/* Main Content - Scrollable */}
            <div className="flex flex-1 p-2 mb-[80px]" style={{ backgroundColor: "#19191c" }}>
                {/* Main Content Area - Scrollable */}
                <div className="flex-1">{rendersupplierInformation()}</div>
            </div>
            <div className="hidden">
                <ExportReportSelector ref={exportRef} formats={["odt"]} baseName="DownloadSelectedSinglePO" ids={[purchaseOrderId]} language={lang} />
            </div>
            {renderProductList()}
            {renderCancelOrder()}
            {renderSupplierList()}
            {renderDepositList()}
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

export default SupplierDetails;
