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
import { receiveGoodService, ApiReceiveGoods, DetailsRow, DetailGetOrders, ApiAllocations } from "@/services/receiveGoodService";
import { purchaseOrderService } from "@/services/purchaseOrderService";
import { supplierService, ApiSupplier } from "@/services/supplierService";
import Pagination from "@/components/Pagination";
import ItemsPerPageSelector from "@/components/ItemsPerPageSelector";
import { ExportReportSelector } from "@/utils/ExportReportSelector";
import { productService, ApiProduct } from "@/services/productService";
import { fetchCourier, fetchGRNStatus, fetchWarehouses, fetchStoreLocation, convertToSingleOption, OptionType } from "@/utils/fetchDropdownData";
import { formatMoney, selectStyles, baseCurrency, parseDate, DropdownData } from "@/utils/globalFunction";
import { highlightMatch } from "@/utils/highlightMatch";
import CopyToClipboard from "@/components/CopyToClipboard";
// localStorage.clear();
const MemoizedPagination = React.memo(Pagination);
const MemoizedItemsPerPageSelector = React.memo(ItemsPerPageSelector);
interface ReceiveGoodsDetailsProps {
    receiveGoodsId: number;
    saveType: string; // or a more specific union type like 'new' | 'edit'
    onBack: () => void;
    onSave: () => void;
    tabId: string;
    onChangeReceiveGoodsId: (newId: number) => void;
    onChangeSaveType: (type: string) => void;
}
type OrderRowMap = Record<number, DetailGetOrders[]>;
const defaultDetails: ApiReceiveGoods = {
    id: 0,
    grn_no: "",
    grn_date: "", // You might use an empty string, null, or Date object depending on your requirements
    supplier_code: "",
    suppliername_en: "",
    suppliername_cn: "",
    grn_status_en: "",
    grn_status_cn: "",
    supplier_id: 0,
    currency: "",
    warehouse: "", // Empty string as default
    ex_rate: 0,
    total: 0,
    base_total: 0,
    company_id: 0,
    grn_status_id: 0,
    shipper_id: 0,
    countOrders: 0,
    details: [],
};
const ReceiveGoodsDetails: React.FC<ReceiveGoodsDetailsProps> = ({ receiveGoodsId, tabId, saveType, onBack, onSave, onChangeReceiveGoodsId, onChangeSaveType }) => {
    const { translations, lang } = useLanguage();
    const [masterList, setTransDetails] = useState<ApiReceiveGoods | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState("information");
    const [suppliers, setSuppliers] = useState<ApiSupplier[]>([]);
    const [allocationList, setAllocations] = useState<ApiAllocations[]>([]);
    const [isDirty, setIsDirty] = useState(false);
    const [showUnsavedChanges, setShowUnsavedChanges] = useState(false);
    const [products, setProducts] = useState<ApiProduct[]>([]);
    const [isInitialized, setIsInitialized] = useState(false);
    const initialFormData = React.useRef<any>(null);
    const locale = getFlatpickrLocale(translations);
    const [loadingSave, setLoadingSave] = useState(false);
    const [loadingSaveGRN, setLoadingSaveGRN] = useState(false);
    const [courierData, setCourierData] = useState<DropdownData[]>([]);
    const [warehousesData, setWarehousesData] = useState<DropdownData[]>([]);
    const [allGRNStatus, setAllGRNStatus] = useState<DropdownData[]>([]);
    const [storeLocationData, setStoreLocationData] = useState<DropdownData[]>([]);
    const [detailList, setDetailList] = useState<DetailsRow[]>([]);
    const [getOrderList, setGetOrderList] = useState<DetailGetOrders[]>([]);
    const [getOrderListRow, setGetOrderListRow] = useState<OrderRowMap>({});
    const [globalIndex, setGlobalIndex] = useState(0);
    const [ageType, setAgeType] = useState("");
    const [showProducts, setShowProducts] = useState(false);
    const [showAllocation, setShowAllocation] = useState(false);
    const [showGetOrders, setShowGetOrders] = useState(false);
    const [totalPagesProducts, setTotalPages_Products] = useState(1);
    const pageSizeOptions = useMemo(() => [10, 20, 50, -1], []);
    const pageSizeOptionsAlloc = useMemo(() => [5, 10, 20, -1], []);
    const [showSuppliers, setShowSuppliers] = useState(false);
    const [totalPagesSupplier, setTotalPages_Supplier] = useState(1);
    const [totalPagesAllocation, setTotalPages_Allocation] = useState(1);
    // Add wholesale pricing state
    const [selectedDetails, selectedPurchaseOrder] = useState<number[]>([]);
    const [selectedChkProducts, setSelectedProducts] = useState<number[]>([]);
    const [showCreatePV, setShowCreatePV] = useState(false);
    const [creditsPopup, setShowCreditsPopup] = useState(false);
    const exportRef = useRef<{ triggerExport: () => void }>(null);
    const [searchTermProduct, setSearchTermProduct] = useState(() => {
        const cached = localStorage.getItem(`cached-grn-product`);
        if (!cached) return "";
        try {
            const meta = JSON.parse(cached);
            return meta.search || "";
        } catch {
            return "";
        }
    });
    const [currentPageProduct, setCurrentPageProduct] = useState(() => {
        const metaKey = `cached-grn-product`;
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
        const metaKey = `cached-grn-product`;
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
    const [searchTermAllocation, setSearchTermAllocation] = useState("");
    const [currentPageAllocation, setCurrentPageAllocation] = useState(1);
    const [itemsPerPageAllocation, setItemsPerPageAllocation] = useState(5);
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
    const allGRNStatusOptions: OptionType[] = useMemo(
        () =>
            allGRNStatus.map((list) => ({
                value: list.value.toString(),
                value2: list.value.toString(),
                label: lang === "en" ? list.en : list.cn,
                en: list.en,
                cn: list.cn,
            })),
        [allGRNStatus, lang]
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
    // Form state - Updated to handle single vs multi-select properly
    const [formData, setFormData] = useState({
        grn_no: "",
        grn_date: null as Date | null,
        supplier_code: "",
        suppliername_en: "",
        suppliername_cn: "",
        supplier_address_en: "",
        supplier_address_cn: "",
        supplier_id: 0,
        currency: "",
        warehouse: null as OptionType | null,
        ex_rate: 0,
        total: 0,
        base_total: 0,
        company_id: null as OptionType | null,
        grn_status_id: null as OptionType | null,
        shipper_id: null as OptionType | null,
    });
    const clearForms = (poStatusOptions: OptionType[]) => {
        const selectedOption = convertToSingleOption(1, poStatusOptions);
        const initialFormData = {
            grn_no: "",
            grn_date: new Date(),
            supplier_code: "",
            suppliername_en: "",
            suppliername_cn: "",
            supplier_address_en: "",
            supplier_address_cn: "",
            grn_status_en: "",
            grn_status_cn: "",
            supplier_id: 0,
            currency: "",
            warehouse: null,
            ex_rate: 0,
            total: 0,
            base_total: 0,
            company_id: null,
            grn_status_id: selectedOption,
            shipper_id: null,
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
                if (showAllocation) {
                    setShowAllocation(false);
                }
            }
        };
        window.addEventListener("keydown", handleEsc);
        // Cleanup on unmount
        return () => {
            window.removeEventListener("keydown", handleEsc);
        };
    }, [creditsPopup, showSuppliers, showCreatePV, showProducts, showAllocation]);

    useEffect(() => {
        if (formData.grn_no) {
            fetchAllocation(currentPageAllocation, itemsPerPageAllocation, searchTermAllocation);
        }
    }, [currentPageAllocation, itemsPerPageAllocation, searchTermAllocation, formData.grn_no]);

    useEffect(() => {
        fetchProducts(currentPageProduct, itemsPerPageProduct, searchTermProduct, selectedChkProducts);
    }, [currentPageProduct, itemsPerPageProduct, searchTermProduct, selectedChkProducts]);

    useEffect(() => {
        const calculateTotalsAndFetch = async () => {
            let total = 0;
            let baseTotal = 0;

            detailList.forEach((element) => {
                if (element.is_deleted === 0) {
                    total += Number(element.total) || 0;
                }
            });

            // Async call inside useEffect
            const conversionKey = formData.currency + baseCurrency();
            const operator = await productService.getOperator(conversionKey);

            if (baseCurrency() === formData.currency) {
                baseTotal = total;
            } else {
                if (operator === "Divide") {
                    baseTotal = total / formData.ex_rate;
                } else {
                    baseTotal = total * formData.ex_rate;
                }
            }
            setFormData((prev) => ({
                ...prev,
                total: parseFloat(total.toFixed(2)),
                base_total: parseFloat(baseTotal.toFixed(2)),
            }));
        };
        calculateTotalsAndFetch();
    }, [detailList]);

    // Keep ref updated

    useEffect(() => {
        const fetchAllCustomerData = () => {
            fetchGRNInfo();
        };
        const fetchDropdownData = () => {
            loadCourier();
            loadWarehouse();
            loadAllGRNStatus();
            loadStoreLocation();
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
        } else {
            fetchAllCustomerData();
        }
    }, [receiveGoodsId, saveType]);

    useEffect(() => {
        if (!masterList) return;

        if (!isInitialized) {
            // A more robust check to see if the form is fully initialized
            const isFormReady =
                (masterList.warehouse ? !!formData.warehouse : true) &&
                (masterList.grn_status_id ? !!formData.grn_status_id : true) &&
                (masterList.shipper_id ? !!formData.shipper_id : true) &&
                (masterList.company_id ? !!formData.company_id : true);
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
        if (masterList && courierOption.length > 0) {
            const selectedOption = convertToSingleOption(masterList.shipper_id, courierOption);
            setFormData((prev) => ({ ...prev, shipper_id: selectedOption }));
        }
    }, [masterList, courierOption, lang]);

    useEffect(() => {
        if (masterList && allGRNStatusOptions.length > 0) {
            const selectedOption = convertToSingleOption(masterList.grn_status_id || 1, allGRNStatusOptions);
            setFormData((prev) => ({ ...prev, grn_status_id: selectedOption }));
        }
    }, [masterList, allGRNStatusOptions, lang]);

    useEffect(() => {
        if (masterList && warehouseOptions.length > 0) {
            const selectedOption = convertToSingleOption(masterList.warehouse, warehouseOptions);
            setFormData((prev) => ({ ...prev, warehouse: selectedOption }));
        }
    }, [masterList, warehouseOptions, lang]);

    useEffect(() => {
        if (masterList && storeLocationOptions.length > 0) {
            const selectedOption = convertToSingleOption(masterList.company_id, storeLocationOptions);
            setFormData((prev) => ({ ...prev, company_id: selectedOption }));
        }
    }, [masterList, storeLocationOptions, lang]);

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

    const fetchGRNInfo = async () => {
        try {
            const idToUse = receiveGoodsId;
            if (!idToUse) {
                setLoading(false);
                return;
            }
            setLoading(true);
            setError(null);

            const purchaseOrderInfoKey = `${idToUse}-cached-grn-info`;
            const cachedSuppliersRaw = localStorage.getItem(purchaseOrderInfoKey);
            let foundSupplier;

            if (cachedSuppliersRaw) {
                foundSupplier = JSON.parse(cachedSuppliersRaw); // ✅ Parse cached JSON
            } else {
                foundSupplier = await receiveGoodService.getGRNInfo(idToUse); // ✅ Fetch from API
            }
            if (foundSupplier) {
                setTransDetails(foundSupplier);
                setDetailList(foundSupplier.details);
                setFormData((prev) => ({
                    ...prev,
                    supplier_id: foundSupplier.supplier_id || 0,
                    supplier_code: foundSupplier.supplier_code || "",
                    grn_no: foundSupplier.grn_no || "",
                    suppliername_en: foundSupplier.suppliername_en || "",
                    suppliername_cn: foundSupplier.suppliername_cn || "",
                    supplier_address_en: foundSupplier.supplier_address_en || "",
                    supplier_address_cn: foundSupplier.supplier_address_cn || "",
                    currency: foundSupplier.currency || "",
                    ex_rate: foundSupplier.ex_rate || 0,
                    total: foundSupplier.total || 0,
                    base_total: foundSupplier.base_total || 0,
                    grn_date: parseDate(foundSupplier.grn_date),
                }));

                // ✅ Only cache if it's a fresh fetch
                if (!cachedSuppliersRaw) {
                    localStorage.setItem(purchaseOrderInfoKey, JSON.stringify(foundSupplier));
                }
            } else {
                setError("supplier not found");
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to fetch grn details");
            console.error("Error fetching grn details:", err);
        } finally {
            setLoading(false);
        }
    };
    const fetchProducts = async (page = currentPageProduct, perPage = itemsPerPageProduct, search = "", sortId = selectedChkProducts) => {
        try {
            setError(null);
            localStorage.setItem(`grn-loading-products`, JSON.stringify(true));

            // Fetch the products and pass the sortId
            const paginatedData = await receiveGoodService.getAllGRNProducts(page, perPage, search, sortId);

            setProducts(paginatedData.data);
            setTotalPages_Products(paginatedData.last_page);

            // Cache the data in localStorage
            localStorage.setItem(`grn-cached-products`, JSON.stringify(paginatedData.data));
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
            localStorage.setItem(`grn-loading-products`, JSON.stringify(false));
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
    const fetchAllocation = async (page = currentPageAllocation, perPage = itemsPerPageAllocation, search = "") => {
        try {
            const paginatedData = await receiveGoodService.getGRNAllocations(page, perPage, search, formData.grn_no);
            setAllocations(paginatedData.data);
            setTotalPages_Allocation(paginatedData.last_page);
        } catch (err) {
            console.error("Error fetching allocation:", err);
        } finally {
            localStorage.setItem(`grn-loading-allocation`, JSON.stringify(false));
        }
    };
    const updateCachedRaw = async (cachedType: string, masterId: number) => {
        if (cachedType === "info") {
            const newData = await receiveGoodService.getGRNInfo(masterId);
            if (newData) {
                localStorage.setItem(`${masterId}-cached-grn-info`, JSON.stringify(newData));
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
    const loadWarehouse = async () => {
        try {
            const list = await fetchWarehouses(); // fetches & returns
            setWarehousesData(list ?? []); // ✅ manually set state here
        } catch (err) {
            console.error("Failed to fetch loadWarehouse:", err);
        }
    };
    const loadAllGRNStatus = async () => {
        try {
            const list = await fetchGRNStatus(); // fetches & returns
            setAllGRNStatus(list ?? []); // ✅ manually set state here
        } catch (err) {
            console.error("Failed to fetch loadAllGRNStatus:", err);
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
    const handleSave = async () => {
        setLoadingSave(true);
        const data = new FormData();
        const supplier_code = formData["supplier_code"]?.toString().trim() ?? "";
        const warehouse = formData["warehouse"]?.toString().trim() ?? null;
        const grn_status_id = formData["grn_status_id"]?.toString().trim() ?? null;
        const shipper_id = formData["shipper_id"]?.toString().trim() ?? null;
        const company_id = formData["company_id"]?.toString().trim() ?? 0;
        const duplicates = findDuplicateProductIds(detailList);
        if (detailList.length === 0) {
            showErrorToast(translations["Detail(s) Required"]);
            setLoadingSave(false); // Enable button again
            return;
        }
        if (!supplier_code || supplier_code === "") {
            showErrorToast(translations["Supplier Code Empty"]);
            setLoadingSave(false); // Enable button again
            return;
        }
        if (!warehouse) {
            showErrorToast(translations["Select a WareHouse"]);
            setLoadingSave(false); // Enable button again
            return;
        }
        if (!grn_status_id) {
            showErrorToast(translations["Select a Status"]);
            setLoadingSave(false); // Enable button again
            return;
        }
        if (!shipper_id) {
            showErrorToast(translations["Select a Shipper"]);
            setLoadingSave(false); // Enable button again
            return;
        }
        if (!company_id) {
            showErrorToast(translations["Select a Company"]);
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
                            item_cost: list.item_cost,
                            item_weight: list.item_weight,
                            cnt_weight: list.cnt_weight,
                            cartons: list.cartons,
                            pcs_per_carton: list.pcs_per_carton,
                            lcm: list.lcm,
                            bcm: list.bcm,
                            hcm: list.hcm,
                            cbm: list.cbm,
                            vweight: list.vweight,
                            advance_payment: list.advance_payment,
                            base_advance_payment: list.base_advance_payment,
                            nw: list.nw,
                            po_id: list.po_id,
                            po_number: list.po_number,
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
            const result = await receiveGoodService.updateReceiveGoods(receiveGoodsId, data);
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
                onChangeReceiveGoodsId(newId);
                onChangeSaveType("edit");
            }
            // Reset state to allow re-initialization after refetch
            setIsDirty(false);
            setIsInitialized(false);
            await updateCachedRaw("info", newId);
            fetchGRNInfo();
            showSuccessToast(translations[result.message]);
            onSave(); // This will now trigger the cache clearing in the parent
        } catch (error) {
            showErrorToast(translations["Failed to save Transaction."] || "Failed to save Transaction.");
        } finally {
            setLoadingSave(false); // Enable button again after the operation is done
        }
    };
    const handleAddNew = async () => {
        onChangeReceiveGoodsId(0);
        onChangeSaveType("new");
        clearForms(allGRNStatusOptions);
        setIsDirty(false);
    };
    const handleAddProduct = async () => {
        setShowProducts(false);
        switch (ageType) {
            case "old":
                for (const element of selectedChkProducts) {
                    setDetailList((prev) =>
                        prev.map((item) => {
                            const list = products.find((product) => product.id === element);
                            const total = Number(list?.["new_qty"]) * Number(list?.["price"]);
                            const updatedItem: any = { ...item };
                            // Convert value to number if it's a numeric field
                            updatedItem["product_id"] = list?.["product_id"];
                            updatedItem["product_code"] = list?.["product_code"];
                            updatedItem["product_title_en"] = list?.["product_title_en"];
                            updatedItem["product_title_cn"] = list?.["product_title_cn"];
                            updatedItem["qty"] = Number(list?.["new_qty"]);
                            updatedItem["price"] = Number(list?.["price"]);
                            updatedItem["total"] = Number(total.toFixed(2));
                            updatedItem["item_cost"] = Number(list?.["item_cost"]);
                            updatedItem["po_number"] = list?.["po_number"];
                            updatedItem["po_id"] = list?.["id"];
                            updatedItem["item_weight"] = Number(list?.["item_weight"]);
                            updatedItem["pcs_per_carton"] = Number(list?.["pcs_per_carton"]);
                            updatedItem["advance_payment"] = Number(list?.["deposit"]);
                            updatedItem["base_advance_payment"] = Number(list?.["base_deposit"]);
                            updatedItem["cartons"] = Number(list?.["cartons"]);
                            return updatedItem;
                        })
                    );
                }
                break;
            case "new":
                // ✅ Remove placeholder row if id = 0
                setDetailList((prev) => prev.filter((item) => !(item.indexInt === globalIndex && item.id === 0)));
                let newIndex = Math.max(0, ...detailList.map((e) => e.indexInt)) + 1;
                // console.log(products);
                for (const element of selectedChkProducts) {
                    try {
                        const list = products.find((product) => product.id === element);
                        const total = Number(list?.["new_qty"]) * Number(list?.["price"]);
                        const newData: DetailsRow = {
                            id: 0,
                            grn_no: formData.grn_no,
                            po_number: list?.["po_number"],
                            po_id: Number(list?.["id"]),
                            product_id: list?.["product_id"],
                            supplier_id: formData.supplier_id,
                            qty: Number(list?.["new_qty"]),
                            orig_qty: Number(list?.["new_qty"]),
                            price: Number(list?.["price"]),
                            total: Number(total.toFixed(2)),
                            base_total: 0,
                            currency: formData.currency,
                            ex_rate: formData.ex_rate,
                            item_cost: Number(list?.["item_cost"]),
                            cartons: Number(list?.["cartons"]),
                            lcm: 0,
                            bcm: 0,
                            vweight: 0,
                            cbm: 0,
                            nw: 0,
                            cnt_weight: 0,
                            net_weight: 0,
                            hcm: 0,
                            received_qty: 0,
                            item_weight: Number(list?.["item_weight"]),
                            pcs_per_carton: Number(list?.["pcs_per_carton"]),
                            invoice_deposit: 0,
                            allocation: 0,
                            imported: 0,
                            warehouse: "",
                            ap_invoice_no: "",
                            advance_payment: Number(list?.["deposit"]),
                            base_advance_payment: Number(list?.["base_deposit"]),
                            product_code: list?.["product_code"],
                            product_title_en: list?.["product_title_en"],
                            product_title_cn: list?.["product_title_cn"],
                            is_deleted: 0,
                            indexInt: newIndex,
                            age_type: "new",
                            product: {
                                product_code: list?.["product_code"],
                                product_title_en: list?.["product_title_en"],
                                product_title_cn: list?.["product_title_cn"],
                            },
                        };
                        setDetailList((prev) => [...prev, newData]);
                        newIndex++;
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
    const handleGRNDateChange = useCallback((dates: Date[]) => {
        setFormData((prev) => ({ ...prev, grn_date: dates[0] ?? null }));
        setIsDirty(true); // ✅ only if user is editing
    }, []);
    const handleAddRow = () => {
        const newId = Math.floor(10000 + Math.random() * 90000);
        const newData: DetailsRow = {
            id: 0,
            grn_no: formData.grn_no,
            po_number: "",
            po_id: 0,
            product_id: 0,
            supplier_id: formData.supplier_id,
            qty: 0,
            orig_qty: 0,
            price: 0,
            total: 0,
            base_total: 0,
            currency: formData.currency,
            ex_rate: formData.ex_rate,
            item_cost: 0,
            cartons: 0,
            lcm: 0,
            bcm: 0,
            vweight: 0,
            cbm: 0,
            nw: 0,
            cnt_weight: 0,
            net_weight: 0,
            hcm: 0,
            received_qty: 0,
            item_weight: 0,
            pcs_per_carton: 0,
            invoice_deposit: 0,
            allocation: 0,
            imported: 0,
            warehouse: "",
            ap_invoice_no: "",
            advance_payment: 0,
            base_advance_payment: 0,
            product_code: "",
            product_title_en: "",
            product_title_cn: "",
            is_deleted: 0,
            indexInt: newId,
            age_type: "new",
            product: {
                product_code: "",
                product_title_en: "",
                product_title_cn: "",
            },
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
                    const cnt_weight = parseFloat(column === "cnt_weight" ? value : String(updatedItem.cnt_weight)) || 0;
                    const lcm = parseFloat(column === "lcm" ? value : String(updatedItem.lcm)) || 0;
                    const bcm = parseFloat(column === "bcm" ? value : String(updatedItem.bcm)) || 0;
                    const hcm = parseFloat(column === "hcm" ? value : String(updatedItem.hcm)) || 0;
                    const cartons = parseFloat(column === "cartons" ? value : String(updatedItem.cartons)) || 0;
                    const cbm = (lcm / 100) * (bcm / 100) * (hcm / 100) * cartons;
                    const vweight = (lcm * bcm * hcm) / 5000;
                    let item_weight = cnt_weight / cartons;
                    if (cnt_weight === 0 && cartons === 0) {
                        item_weight = 0;
                    }
                    updatedItem.item_weight = parseFloat(item_weight.toFixed(2));
                    updatedItem.cbm = parseFloat(cbm.toFixed(2));
                    updatedItem.vweight = parseFloat(vweight.toFixed(2));
                    updatedItem.total = parseFloat((qty * price).toFixed(2));
                    return updatedItem;
                }
                return item;
            })
        );
    };
    const handleDetailChange2 = (id: number, value: string, column: string) => {
        setProducts((prev) =>
            prev.map((item) => {
                if (item.id === id) {
                    const updatedItem: any = { ...item };
                    updatedItem[column] = value;
                    const qty = parseFloat(column === "qty" ? value : String(updatedItem.qty)) || 0;
                    const newQty = parseFloat(value);
                    if (qty < newQty) {
                        showErrorToast(translations["Remaining quantity is"] + " " + qty);
                        updatedItem[column] = 0;
                    }
                    return updatedItem;
                }
                return item;
            })
        );
    };
    const handleDetailChange3 = (masterId: number, id: number, value: string, column: string) => {
        setGetOrderListRow((prev) => {
            const prevList = prev[masterId] ?? [];

            // 1. Clone current list
            const updatedList = prevList.map((item: any) => {
                if (item.id !== id) return item;

                const updatedItem = { ...item };

                if (column === "new_qty") {
                    const newQty = parseFloat(value) || 0;
                    const remainingQty = parseFloat(item.remaining_qty?.toString() || "0");

                    if (newQty > remainingQty) {
                        showErrorToast(translations["Remaining quantity is"] + " " + remainingQty);
                        updatedItem[column] = 0;
                    } else {
                        updatedItem[column] = newQty;
                    }
                } else {
                    updatedItem[column] = value;
                }

                return updatedItem;
            });

            // 2. Calculate total new_qty after simulated update
            const totalNewQty = updatedList.reduce((sum, item) => sum + (parseFloat(item.new_qty ?? 0) || 0), 0);

            // 3. Get grnQty
            const grnQtyRow = getOrderList.find((row) => row.id === masterId);
            const grnQty = grnQtyRow?.grnQty ?? 0;

            // 4. If total exceeds GRN, show error and return original state (no update)
            if (totalNewQty > grnQty) {
                showErrorToast(translations["Allocated Qty is greater that GRN Qty"]);
                return prev; // prevent update
            }

            // ✅ Update successful
            // Now update getOrderList too
            setGetOrderList((prevOrderList) =>
                prevOrderList.map((item) => {
                    if (item.id === masterId) {
                        return {
                            ...item,
                            allocated_qty: totalNewQty,
                        };
                    }
                    return item;
                })
            );

            // 5. All good, update state
            return {
                ...prev,
                [masterId]: updatedList,
            };
        });
    };
    const handleEnterKey = async (indexInt: number, value: string, column: string, ageType: string) => {
        switch (column) {
            case "product_code":
                try {
                    setGlobalIndex(indexInt);
                    setAgeType(ageType);
                    const res = await receiveGoodService.getGRNProductInfo(value);
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
                                updatedItem["advance_payment"] = res.list.deposit;
                                updatedItem["base_advance_payment"] = res.list.base_deposit;
                                updatedItem["po_number"] = res.list.po_number;
                                updatedItem["po_id"] = res.list.po_id;
                                updatedItem["item_weight"] = res.list.item_weight;
                                updatedItem["pcs_per_carton"] = res.list.pcs_per_carton;
                                updatedItem["cartons"] = res.list.cartons;
                                updatedItem["retail_price"] = res.list.retail_price;
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
                setFormData((prev) => ({
                    ...prev,
                    supplier_id: res.list.supplier_id,
                    supplier_code: res.list.supplier_code,
                    suppliername_en: res.list.suppliername_en,
                    suppliername_cn: res.list.suppliername_cn,
                    supplier_address_en: res.list.supplier_address_en,
                    supplier_address_cn: res.list.supplier_address_cn,
                    currency: res.list.currency,
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
    const handleDelete = async () => {
        const confirmed = await showConfirm(translations["Delete Record"], translations["Are you sure you want to delete this record?"], translations["Yes"], translations["Cancel"]);
        if (!confirmed) return;
        try {
            const res = await receiveGoodService.deleteGRN([receiveGoodsId]);
            if (res.token === "Error") {
                showErrorToast(res.message);
                return;
            }
            handleAddNew();
            showSuccessToast(translations["Record has been Deleted"]);
        } catch (err) {
            showErrorToast(translations["alert_message_18"]);
            console.error("No Record(s) Has Been Deleted : ", err);
        }
    };
    const handleAllocateSO = async () => {
        let totalAllocatedQty = 0;
        getOrderList.forEach((element) => {
            totalAllocatedQty += element.allocated_qty;
        });
        if (totalAllocatedQty === 0) {
            showErrorToast(translations["Quantity is Required"]);
            return;
        }

        const data = new FormData();

        data.append("grn_no", formData.grn_no);
        data.append("warehouse", masterList?.warehouse);

        Object.values(getOrderListRow).forEach((list: any) => {
            if (list) {
                list.forEach((item: any) => {
                    // assuming `list` is an array
                    if (item.new_qty > 0) {
                        data.append(
                            "details[]",
                            JSON.stringify({
                                id: item.id,
                                new_qty: item.new_qty,
                                grn_id: item.grn_id,
                                grn_no: item.grn_no,
                                po_id: item.po_id,
                                warehouse: item.warehouse,
                            })
                        );
                    }
                });
            }
        });
        try {
            const result = await receiveGoodService.allocatedOrders(data);
            if (result.token === "Error") {
                showErrorToast(result.message);
                return;
            }
            await updateCachedRaw("info", receiveGoodsId);
            fetchGRNInfo();
            setShowGetOrders(false);
            showSuccessToast(translations[result.message]);
            setIsDirty(false);
        } catch (error) {}
    };
    const handleGetOrder = async () => {
        const confirmed = await showConfirm(
            translations["System Messaage"],
            translations["Selected Records will be allocated base on customers order. Proceed?"],
            translations["Yes"],
            translations["Cancel"]
        );
        if (!confirmed) return;

        let selectedArr = [];

        // If no records are selected, use the entire detailList
        if (selectedDetails.length === 0) {
            selectedArr = detailList;
        } else {
            // Loop through selectedDetails and find the matching products
            for (const element of selectedDetails) {
                const list = detailList.find((product) => product.indexInt === element);
                if (list) {
                    selectedArr.push(list); // Correct way to push items to the array
                }
            }
        }
        setLoadingSaveGRN(true);
        const data = new FormData();

        data.append("grn_no", formData.grn_no);
        data.append("warehouse", masterList?.warehouse);

        selectedArr.forEach((list) => {
            if (list) {
                data.append(
                    "details[]",
                    JSON.stringify({
                        id: list.id,
                        warehouse: masterList?.warehouse,
                        currency: formData.currency,
                        grn_no: formData.grn_no,
                        grn_date: formData.grn_date,
                        po_id: list.po_id,
                        product_id: list.product_id,
                        product_code: list.product_code,
                        product_title_en: list.product_title_en,
                        product_title_cn: list.product_title_cn,
                    })
                );
            }
        });
        try {
            const result = await receiveGoodService.getOrders(data);
            const len = result.array.length;
            if (len === 0) {
                await updateCachedRaw("info", receiveGoodsId);
                await fetchGRNInfo();
                setShowAllocation(true);
                setIsDirty(false);
            } else {
                await updateCachedRaw("info", receiveGoodsId);
                await fetchGRNInfo();
                setShowGetOrders(true);
                setGetOrderList(result.array);
                // Convert to Record<number, DetailGetOrders[]>
                const orderMap: Record<number, DetailGetOrders[]> = {};
                result.array.forEach((item: any) => {
                    if (item.ordersArr && Array.isArray(item.ordersArr)) {
                        orderMap[item.id] = item.ordersArr;
                    }
                });
                setGetOrderListRow(orderMap);
                setIsDirty(false);
                setLoadingSaveGRN(false);
            }
        } catch (error) {
        } finally {
            setLoadingSaveGRN(false);
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
        setFormData((prev) => ({
            ...prev,
            supplier_id: res.list.supplier_id,
            supplier_code: res.list.supplier_code,
            suppliername_en: res.list.suppliername_en,
            suppliername_cn: res.list.suppliername_cn,
            supplier_address_en: res.list.supplier_address_en,
            supplier_address_cn: res.list.supplier_address_cn,
            currency: res.list.currency,
            ex_rate: res.list.ex_rate,
        }));
        setShowSuppliers(false);
    };
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
    // ✅ First filter out products that already exist in detailList
    const filteredProducts = products.filter((product) => !detailList.some((d) => d.product_code === product.product_code));
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
                                                onChange={(e) => {
                                                    const value = e.target.value;
                                                    setFormData((prev) => ({ ...prev, supplier_code: value }));
                                                    setIsDirty(true);
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
                                                setIsDirty(true);
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
                                                setIsDirty(true);
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
                                                setIsDirty(true);
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
                                                setIsDirty(true);
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
                                            readOnly
                                            value={formData.currency}
                                            onChange={(e) => {
                                                const value = e.target.value;
                                                setFormData((prev) => ({ ...prev, currency: value }));
                                                setIsDirty(true);
                                            }}
                                            className="flex-1 px-3 py-2 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm"
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
                                                setIsDirty(true);
                                            }}
                                            className="flex-1 px-3 py-2 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm"
                                        />
                                    </div>
                                    <div className="flex items-center space-x-4 mb-2">
                                        <label className="w-[26%] text-gray-400 text-sm text-right">{translations["Status"]}</label>
                                        <Select
                                            classNamePrefix="react-select"
                                            value={formData.grn_status_id}
                                            onChange={(selected) => {
                                                setFormData({ ...formData, grn_status_id: selected as OptionType | null });
                                                setIsDirty(true); // ✅ only if user is editing
                                            }}
                                            options={allGRNStatusOptions}
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
                                        <label className="w-[26%] text-gray-400 text-sm text-right">{translations["Shipper"]}</label>
                                        <Select
                                            classNamePrefix="react-select"
                                            value={formData.shipper_id}
                                            onChange={(selected) => {
                                                setFormData({ ...formData, shipper_id: selected as OptionType | null });
                                                setIsDirty(true); // ✅ only if user is editing
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
                                        <label className="w-[25%] text-gray-400 text-sm text-right">{translations["GRN No"]}</label>
                                        <input
                                            value={formData.grn_no}
                                            readOnly
                                            onChange={(e) => {
                                                const value = e.target.value;
                                                setFormData((prev) => ({ ...prev, grn_no: value }));
                                                setIsDirty(true);
                                            }}
                                            className="flex-1 px-3 py-2 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm"
                                        />
                                    </div>
                                    <div className="flex items-center space-x-4 mb-2">
                                        <label className="w-[25%] text-gray-400 text-sm text-right">{translations["GRN Date"]}</label>
                                        <Flatpickr
                                            onChange={handleGRNDateChange}
                                            options={{
                                                dateFormat: "M d Y",
                                                defaultDate: formData.grn_date || undefined,
                                                allowInput: true,
                                                locale: locale,
                                            }}
                                            className="flex-1 px-3 py-2 border-[1px] border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm"
                                        />
                                    </div>
                                    <div className="flex items-center space-x-4 mb-2">
                                        <label className="w-[26%] text-gray-400 text-sm text-right">{translations["Company"]}</label>
                                        <Select
                                            classNamePrefix="react-select"
                                            value={formData.company_id}
                                            onChange={async (selected) => {
                                                setFormData({ ...formData, company_id: selected as OptionType | null });
                                                setIsDirty(true); // ✅ only if user is editing
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
                                        <label className="w-[26%] text-gray-400 text-sm text-right">{translations["Warehouse"]}</label>
                                        <Select
                                            classNamePrefix="react-select"
                                            value={formData.warehouse}
                                            onChange={(selected) => {
                                                setFormData({ ...formData, warehouse: selected as OptionType | null });
                                                setIsDirty(true); // ✅ only if user is editing
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
                                </div>
                            </fieldset>
                            <fieldset className="grid grid-cols-12 gap-4 border-[1px] border-[#ffffff1a] rounded-lg p-4 mb-2">
                                <div className="col-span-12 md:col-span-12 table-layout">
                                    <table className="w-full border border-gray-600 border-collapse text-sm text-left">
                                        <thead className="sticky top-0 z-[1] py-1 px-4" style={{ backgroundColor: "#1f2132" }}>
                                            <tr className="border-b" style={{ borderColor: "#2d2d30" }}>
                                                <th className="w-[2%] text-left py-1 px-2 text-gray-400 text-sm w-12 border border-[#40404042]" rowSpan={2}>
                                                    <div className="flex items-center h-full">
                                                        <CustomCheckbox
                                                            disabled={masterList?.postatus_id === 4}
                                                            checked={selectedDetails.length === detailList?.length && detailList?.length > 0}
                                                            onChange={(checked) => handleSelectAll(checked)}
                                                        />
                                                    </div>
                                                </th>
                                                <th className="w-[2%] text-left py-1 px-2 text-gray-400 text-sm w-12 border border-[#40404042]" rowSpan={2}>
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
                                                <th className="w-[2%] text-left py-1 px-2 text-gray-400 text-sm w-12 border border-[#40404042]" rowSpan={2}></th>
                                                <th className="w-[8%] text-left py-1 px-2 text-gray-400 text-sm w-12 border border-[#40404042]" rowSpan={2}>
                                                    {translations["Product Code"]}
                                                </th>
                                                <th className="w-[18%] text-left py-1 px-2 text-gray-400 text-sm w- border border-[#40404042]" rowSpan={2}>
                                                    {translations["Product Name"]}
                                                </th>
                                                <th className="w-[5%] text-center py-1 px-2 text-gray-400 text-sm w-12 border border-[#40404042]" rowSpan={2}>
                                                    {translations["Item"]} {translations["wgt"]}
                                                    <br></br>(KG)
                                                </th>
                                                <th className="w-[5%] text-center py-1 px-2 text-gray-400 text-sm w-12 border border-[#40404042]" rowSpan={2}>
                                                    {translations["Cnt"]} {translations["wgt"]}
                                                    <br></br>(KG)
                                                </th>
                                                <th className="w-[5%] text-center py-1 px-2 text-gray-400 text-sm w-12 border border-[#40404042]" rowSpan={2}>
                                                    {translations["Crtns"]}
                                                </th>
                                                <th className="w-[5%] text-center py-1 px-2 text-gray-400 text-sm w-12 border border-[#40404042]" rowSpan={2}>
                                                    {translations["Pcs"]}/{translations["Crtns"]}
                                                </th>
                                                <th className="w-[5%] text-center py-1 px-2 text-gray-400 text-sm w-12 border border-[#40404042]" colSpan={3}>
                                                    {translations["Carton Dimension"]}
                                                </th>
                                                <th className="w-[5%] text-center py-1 px-2 text-gray-400 text-sm w-12 border border-[#40404042]" rowSpan={2}>
                                                    {translations["CBM"]}
                                                </th>
                                                <th className="w-[5%] text-center py-1 px-2 text-gray-400 text-sm w-12 border border-[#40404042]" rowSpan={2}>
                                                    {translations["Vol."]} {translations["wgt"]}
                                                </th>
                                                <th className="w-[5%] text-center py-1 px-2 text-gray-400 text-sm w-12 border border-[#40404042]" rowSpan={2}>
                                                    {translations["Net"]} {translations["wgt"]}
                                                    <br></br>(KG)
                                                </th>
                                                <th className="w-[5%] text-center py-1 px-2 text-gray-400 text-sm w-12 border border-[#40404042]" rowSpan={2}>
                                                    {translations["Qty"]}
                                                </th>
                                                <th className="w-[6%] text-center py-1 px-2 text-gray-400 text-sm w-12 border border-[#40404042]" rowSpan={2}>
                                                    {translations["Price"]}
                                                </th>
                                                <th className="w-[6%] text-center py-1 px-2 text-gray-400 text-sm w-12 border border-[#40404042]" rowSpan={2}>
                                                    {translations["Total"]}
                                                </th>
                                            </tr>
                                            <tr className="border-b" style={{ borderColor: "#2d2d30" }}>
                                                <th className="w-[5%] text-center py-1 px-2 text-gray-400 text-sm w-12 border border-[#40404042]">{translations["LCM"]}</th>
                                                <th className="w-[5%] text-center py-1 px-2 text-gray-400 text-sm w-12 border border-[#40404042]">{translations["BCM2"]}</th>
                                                <th className="w-[5%] text-center py-1 px-2 text-gray-400 text-sm w-12 border border-[#40404042]">{translations["HCM2"]}</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {detailList.length === 0 ? (
                                                <tr className="clickable border-b hover:bg-gray-700 hover:bg-opacity-30 transition-colors cursor-pointer" style={{ borderColor: "#40404042" }}>
                                                    <td colSpan={18} className="py-2 px-2 text-gray-400 text-center text-custom-sm border border-[#40404042]">
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
                                                                        disabled={masterList?.grn_status_id === 4}
                                                                        onChange={(checked) => handleSelectSupplier(item.indexInt as number, checked)}
                                                                    />
                                                                </td>
                                                                <td className="py-2 px-2 text-gray-400 text-left text-custom-sm border border-[#40404042]">
                                                                    <div className="relative group inline-block">
                                                                        <button
                                                                            type="button"
                                                                            disabled={masterList?.grn_status_id === 4}
                                                                            onClick={() => handleRemoveRow()}
                                                                            className="px-1 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-xs"
                                                                        >
                                                                            <X className="h-4 w-4" />
                                                                        </button>
                                                                        {/* Tooltip */}
                                                                        {masterList?.grn_status_id !== 4 && (
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
                                                                            disabled={masterList?.grn_status_id === 4}
                                                                            onClick={() => handlPopupProducts(item.indexInt, item.age_type)}
                                                                            className="px-1 py-1 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors text-xs"
                                                                        >
                                                                            <Search className="h-4 w-4" />
                                                                        </button>
                                                                        {/* Tooltip */}
                                                                        {masterList?.grn_status_id !== 4 && (
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
                                                                        readOnly={masterList?.grn_status_id === 4}
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
                                                                        value={item.item_weight}
                                                                        readOnly={masterList?.grn_status_id === 4}
                                                                        onChange={(e) => {
                                                                            const value = e.target.value;
                                                                            if (/^\d*\.?\d*$/.test(value)) {
                                                                                handleDetailChange(item.indexInt, value, "item_weight");
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
                                                                        value={item.cnt_weight}
                                                                        readOnly={masterList?.grn_status_id === 4}
                                                                        onChange={(e) => {
                                                                            const value = e.target.value;
                                                                            if (/^\d*\.?\d*$/.test(value)) {
                                                                                handleDetailChange(item.indexInt, value, "cnt_weight");
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
                                                                        value={item.cartons}
                                                                        readOnly
                                                                        onChange={(e) => {
                                                                            const value = e.target.value;
                                                                            if (/^\d*\.?\d*$/.test(value)) {
                                                                                handleDetailChange(item.indexInt, value, "cartons");
                                                                            }
                                                                        }}
                                                                        className="w-full px-3 py-1.5 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-sm rounded text-center"
                                                                    />
                                                                </td>
                                                                <td className="py-0 px-0 text-gray-400 text-center text-custom-sm border border-[#40404042]">
                                                                    <input
                                                                        type="number"
                                                                        value={item.pcs_per_carton}
                                                                        readOnly={masterList?.grn_status_id === 4}
                                                                        onChange={(e) => {
                                                                            const value = e.target.value;
                                                                            if (/^\d*\.?\d*$/.test(value)) {
                                                                                handleDetailChange(item.indexInt, value, "pcs_per_carton");
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
                                                                        value={item.lcm}
                                                                        readOnly={masterList?.grn_status_id === 4}
                                                                        onChange={(e) => {
                                                                            const value = e.target.value;
                                                                            if (/^\d*\.?\d*$/.test(value)) {
                                                                                handleDetailChange(item.indexInt, value, "lcm");
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
                                                                        value={item.bcm}
                                                                        readOnly={masterList?.grn_status_id === 4}
                                                                        onChange={(e) => {
                                                                            const value = e.target.value;
                                                                            if (/^\d*\.?\d*$/.test(value)) {
                                                                                handleDetailChange(item.indexInt, value, "bcm");
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
                                                                        value={item.hcm}
                                                                        readOnly={masterList?.grn_status_id === 4}
                                                                        onChange={(e) => {
                                                                            const value = e.target.value;
                                                                            if (/^\d*\.?\d*$/.test(value)) {
                                                                                handleDetailChange(item.indexInt, value, "hcm");
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
                                                                        value={item.cbm}
                                                                        readOnly
                                                                        onChange={(e) => {
                                                                            const value = e.target.value;
                                                                            if (/^\d*\.?\d*$/.test(value)) {
                                                                                handleDetailChange(item.indexInt, value, "cbm");
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
                                                                        value={item.vweight}
                                                                        readOnly
                                                                        onChange={(e) => {
                                                                            const value = e.target.value;
                                                                            if (/^\d*\.?\d*$/.test(value)) {
                                                                                handleDetailChange(item.indexInt, value, "vweight");
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
                                                                        value={item.net_weight}
                                                                        readOnly
                                                                        onChange={(e) => {
                                                                            const value = e.target.value;
                                                                            if (/^\d*\.?\d*$/.test(value)) {
                                                                                handleDetailChange(item.indexInt, value, "net_weight");
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
                                                                        value={item.qty}
                                                                        readOnly={masterList?.grn_status_id === 4}
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
                                                                        type="number"
                                                                        value={item.price}
                                                                        readOnly
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
                                                            </tr>
                                                        )
                                                )
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </fieldset>
                            <fieldset className="grid grid-cols-12 gap-4 border-[1px] border-[#ffffff1a] rounded-lg p-4 mb-2">
                                <div className="col-span-12 md:col-span-9"></div>
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
                                            value={formData.base_total}
                                            onChange={(e) => {
                                                const value = Number(e.target.value);
                                                setFormData((prev) => ({ ...prev, base_total: value }));
                                                setIsDirty(true);
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
                                            <CustomCheckbox checked={selectedChkProducts.length === products.length && products.length > 0} onChange={(checked) => handleSelectAllProducts(checked)} />
                                        </th>
                                        <th className="w-[15%] text-left py-2 px-2 text-gray-400 text-sm">{translations["PO Number"]}</th>
                                        <th className="w-[10%] text-left py-2 px-2 text-gray-400 text-sm">{translations["Product Code"]}</th>
                                        <th className="w-[37%] text-left py-2 px-2 text-gray-400 text-sm">{translations["Product Name"]}</th>
                                        <th className="w-[10%] text-center py-2 px-2 text-gray-400 text-sm">{translations["Qty"]}</th>
                                        <th className="w-[10%] text-center py-2 px-2 text-gray-400 text-sm">{translations["Received Qty"]}</th>
                                        <th className="w-[15%] text-center py-2 px-2 text-gray-400 text-sm">{translations["New Received Qty"]}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredProducts.map((product, index) => (
                                        <tr
                                            key={product.id || index}
                                            className={`border-b hover:bg-gray-700 hover:bg-opacity-30 transition-colors ${
                                                selectedChkProducts.includes(product.id as number) ? "bg-gray-700 bg-opacity-30" : ""
                                            }`}
                                            style={{ borderColor: "#40404042" }}
                                        >
                                            <td className="py-2 px-2" onClick={(e) => e.stopPropagation()}>
                                                <CustomCheckbox
                                                    checked={selectedChkProducts.includes(product.id as number)}
                                                    onChange={(checked) => handleSelectProduct(product.id as number, checked)}
                                                />
                                            </td>
                                            <td className="py-2 px-2 text-gray-400 text-left text-custom-sm">
                                                <div className="group flex items-center">
                                                    <p className="text-gray-400 text-custom-sm">{highlightMatch(product.po_number, searchTermProduct)}</p>
                                                    <CopyToClipboard text={product.po_number} />
                                                </div>
                                            </td>
                                            <td className="py-2 px-2 text-gray-400 text-left text-custom-sm">
                                                <div className="group flex items-center">
                                                    <p className="text-gray-400 text-custom-sm">{highlightMatch(product.product_code, searchTermProduct)}</p>
                                                    <CopyToClipboard text={product.product_code} />
                                                </div>
                                            </td>
                                            <td className="py-2 px-2 text-gray-400 text-left text-custom-sm">
                                                <div className="group flex items-center">
                                                    <p className="text-gray-400 text-custom-sm">
                                                        {highlightMatch(lang === "en" ? product.product_title_en : product.product_title_cn, searchTermProduct)}
                                                    </p>
                                                    <CopyToClipboard text={lang === "en" ? product.product_title_en : product.product_title_cn} />
                                                </div>
                                            </td>
                                            <td className="py-2 px-2 text-gray-400 text-center text-custom-sm">{product.qty}</td>
                                            <td className="py-2 px-2 text-gray-400 text-center text-custom-sm">{product.receive_qty}</td>
                                            <td className="py-2 px-2 text-gray-400 text-center text-custom-sm">
                                                <input
                                                    type="number"
                                                    value={product.new_qty}
                                                    readOnly={!selectedChkProducts.includes(product.id as number)}
                                                    onChange={(e) => handleDetailChange2(product.id, e.target.value, "new_qty")}
                                                    onFocus={(e) => e.target.select()} // Select the input value on focus
                                                    className="w-full px-3 py-1.5 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-sm rounded text-center"
                                                />
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
    const renderAllocations = () => {
        if (!showAllocation) return null;
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-[#19191c] rounded-xl border border-[#ffffff1a] w-[60vw] h-auto flex flex-col">
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-[#ffffff1a]">
                        <div className="flex items-center space-x-4">
                            <h2 className="text-xl font-bold text-white">{translations["Get Orders"]}</h2>
                        </div>
                        <div className="flex items-center space-x-4">
                            <button
                                onClick={() => {
                                    setShowAllocation(false);
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
                                        value={searchTermAllocation}
                                        onChange={(e) => {
                                            setSearchTermAllocation(e.target.value);
                                            setCurrentPageAllocation(1);
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
                                        <th className=" text-left py-2 px-2 text-gray-400 text-sm">{translations["Customer"]}</th>
                                        <th className=" text-left py-2 px-2 text-gray-400 text-sm">{translations["Products"]}</th>
                                        <th className=" text-left py-2 px-2 text-gray-400 text-sm">{translations["Shipping Status"]}</th>
                                        <th className=" text-center py-2 px-2 text-gray-400 text-sm">{translations["Price"]}</th>
                                        <th className=" text-center py-2 px-2 text-gray-400 text-sm">{translations["Qty"]}</th>
                                        <th className=" text-center py-2 px-2 text-gray-400 text-sm">{translations["Total"]}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {allocationList.map((list, index) => (
                                        <tr
                                            key={list.id || index}
                                            className={`clickable border-b hover:bg-gray-700 hover:bg-opacity-30 transition-colors cursor-pointer`}
                                            style={{ borderColor: "#40404042" }}
                                        >
                                            <td className="py-2 px-2">
                                                <div className="flex items-center space-x-3">
                                                    <div>
                                                        <div className="group flex items-center">
                                                            <p className="text-gray-300 text-custom-sm select-text">{highlightMatch(list.customer_code, searchTermAllocation)}</p>
                                                            <CopyToClipboard text={list.customer_code || searchTermAllocation} />
                                                        </div>
                                                        <div className="group flex items-center">
                                                            <p className="text-gray-400 text-custom-sm">
                                                                {highlightMatch(lang === "en" ? list.account_name_en : list.account_name_cn, searchTermAllocation)}
                                                            </p>
                                                            <CopyToClipboard text={lang === "en" ? list.account_name_en || "" : list.account_name_cn || ""} />
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-2 px-2">
                                                <div className="flex items-center space-x-3">
                                                    <div>
                                                        <div className="group flex items-center">
                                                            <p className="text-gray-300 text-custom-sm select-text">{highlightMatch(list.product_code, searchTermAllocation)}</p>
                                                            <CopyToClipboard text={list.product_code || ""} />
                                                        </div>
                                                        <div className="group flex items-center">
                                                            <p className="text-gray-400 text-custom-sm">
                                                                {highlightMatch(lang === "en" ? list.product_title_en : list.product_title_cn, searchTermAllocation)}
                                                            </p>
                                                            <CopyToClipboard text={lang === "en" ? list.product_title_en || "" : list.product_title_cn || ""} />
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-3 px-4 text-gray-400 text-left text-custom-sm">
                                                <div className="group flex items-center">
                                                    <p className="text-gray-400 text-custom-sm">
                                                        {highlightMatch(
                                                            lang === "en" ? list.shipping_stat_en || translations["N.A."] : list.shipping_stat_cn || translations["N.A."],
                                                            searchTermAllocation
                                                        )}
                                                    </p>
                                                    <CopyToClipboard text={lang === "en" ? list.shipping_stat_en || "" : list.shipping_stat_cn || ""} />
                                                </div>
                                            </td>
                                            <td className="py-3 px-4 text-gray-400 text-center text-custom-sm">
                                                {list.currency}
                                                <br></br>
                                                {formatMoney(list.price)}
                                            </td>
                                            <td className="py-3 px-4 text-gray-400 text-center text-custom-sm">{list.qty}</td>
                                            <td className="py-3 px-4 text-gray-400 text-center text-custom-sm">
                                                {list.currency}
                                                <br></br>
                                                {formatMoney(list.total)}
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
                            <MemoizedPagination currentPage={currentPageAllocation} totalPages={totalPagesAllocation} onPageChange={(page) => setCurrentPageAllocation(page)} />
                            <MemoizedItemsPerPageSelector
                                value={itemsPerPageAllocation}
                                onChange={(val: number) => {
                                    setItemsPerPageAllocation(val);
                                    setCurrentPageAllocation(1);
                                }}
                                options={pageSizeOptionsAlloc}
                            />
                            <div className="hidden">
                                <ExportReportSelector formats={["odt", "ods", "xlsx"]} baseName="GRNAllocation_Report" ids={allocationList.map((p) => p.id)} language={lang} />
                            </div>
                        </div>
                        <div className="flex items-center space-x-1">
                            <button onClick={() => setShowAllocation(false)} className="px-2 py-2 bg-gray-700 hover:bg-gray-600 rounded text-white transition">
                                {translations["Close"]}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    };
    const renderGetOrders = () => {
        if (!showGetOrders) return null;
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-[#19191c] rounded-xl border border-[#ffffff1a] w-[60vw] h-auto flex flex-col">
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-[#ffffff1a]">
                        <div className="flex items-center space-x-4">
                            <h2 className="text-xl font-bold text-white">{translations["Incoming Quantity insufficient, Manual Allocate"]}</h2>
                        </div>
                        <div className="flex items-center space-x-4">
                            <button
                                onClick={() => {
                                    setShowGetOrders(false);
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
                                        <th className="w-[5%] text-left py-2 px-2 text-gray-400 text-sm"></th>
                                        <th className="w-[15%] text-left py-2 px-2 text-gray-400 text-sm">{translations["Product Code"]}</th>
                                        <th className="w-[41%] text-left py-2 px-2 text-gray-400 text-sm">{translations["Product Name"]}</th>
                                        <th className="w-[13%] text-center py-2 px-2 text-gray-400 text-sm">{translations["Qty"]}</th>
                                        <th className="w-[13%] text-center py-2 px-2 text-gray-400 text-sm">{translations["GRN Qty"]}</th>
                                        <th className="w-[13%] text-center py-2 px-2 text-gray-400 text-sm">{translations["Allocated Qty"]}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {getOrderList.map((list, index) => (
                                        <React.Fragment key={list.id || index}>
                                            <tr
                                                key={list.id || index}
                                                className={`clickable border-b hover:bg-gray-700 hover:bg-opacity-30 transition-colors cursor-pointer`}
                                                style={{ borderColor: "#40404042" }}
                                            >
                                                <td className="py-3 px-4 text-gray-400 text-center text-custom-sm">
                                                    <button className={`px-1 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-xs`}>
                                                        <Minus size={16} />
                                                    </button>
                                                </td>
                                                <td className="py-2 px-2">
                                                    <div className="flex items-center space-x-3">
                                                        <div className="group flex items-center">
                                                            <p className="text-gray-300 text-custom-sm select-text">{list.product_code}</p>
                                                            <CopyToClipboard text={list.product_code || searchTermAllocation} />
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-2 px-2">
                                                    <div className="flex items-center space-x-3">
                                                        <div className="group flex items-center">
                                                            <p className="text-gray-400 text-custom-sm">{lang === "en" ? list.product_title_en : list.product_title_cn}</p>
                                                            <CopyToClipboard text={lang === "en" ? list.product_title_en || "" : list.product_title_cn || ""} />
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-3 px-4 text-gray-400 text-center text-custom-sm">{list.orderQty}</td>
                                                <td className="py-3 px-4 text-gray-400 text-center text-custom-sm">{list.grnQty}</td>
                                                <td className="py-3 px-4 text-gray-400 text-center text-custom-sm">{list.allocated_qty}</td>
                                            </tr>
                                            {list.id in getOrderListRow && (
                                                <tr>
                                                    <td colSpan={6} className="py-3 px-4">
                                                        <table className="w-full" style={{ backgroundColor: "#060818" }}>
                                                            <thead className="sticky top-0 z-[1] py-1 px-4" style={{ backgroundColor: "#1f2132" }}>
                                                                <tr className="border-b" style={{ borderColor: "#2d2d30" }}>
                                                                    <th className="w-[5%] text-center py-2 px-2 text-gray-400 text-sm w-12 border border-[#40404042]">#</th>
                                                                    <th className="w-[20%] text-left py-2 px-2 text-gray-400 text-sm w-12 border border-[#40404042]">
                                                                        {translations["Customer Code"]}
                                                                    </th>
                                                                    <th className="w-[50%] text-left py-2 px-4 text-gray-400 text-sm w- border border-[#40404042]">{translations["Customer Name"]}</th>
                                                                    <th className="w-[10%] text-center py-2 px-2 text-gray-400 text-sm w-12 border border-[#40404042]">{translations["Qty"]}</th>
                                                                    <th className="w-[15%] text-center py-2 px-2 text-gray-400 text-sm w-12 border border-[#40404042]">{translations["Allocation"]}</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {getOrderListRow[list.id] && getOrderListRow[list.id]!.length > 0 ? (
                                                                    getOrderListRow[list.id]!.map((detail, i) => (
                                                                        <tr key={detail.id || i}>
                                                                            <td className="py-2 px-2 text-gray-400 text-center text-custom-sm">{i + 1}</td>
                                                                            <td className="py-2 px-2 text-gray-400 text-left text-custom-sm">{detail.customer_code}</td>
                                                                            <td className="py-2 px-2 text-gray-400 text-left text-custom-sm">
                                                                                {lang === "en" ? detail.account_name_en : detail.account_name_cn}
                                                                            </td>
                                                                            <td className="py-2 px-2 text-gray-400 text-center text-custom-sm">{detail.remaining_qty}</td>
                                                                            <input
                                                                                type="text"
                                                                                value={detail.new_qty}
                                                                                onChange={(e) => {
                                                                                    const value = e.target.value;
                                                                                    if (/^\d*\.?\d*$/.test(value)) {
                                                                                        handleDetailChange3(list.grn_id, detail.id, value, "new_qty");
                                                                                    }
                                                                                }}
                                                                                onFocus={(e) => {
                                                                                    if (e.target.value === "0") {
                                                                                        e.target.select();
                                                                                    }
                                                                                }}
                                                                                className="w-full px-3 py-1.5 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-sm rounded text-center"
                                                                            />
                                                                        </tr>
                                                                    ))
                                                                ) : (
                                                                    <tr>
                                                                        <td colSpan={5} className="py-3 px-4 text-center text-gray-400 text-sm">
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
                    </div>
                    {/* Footer */}
                    <div className="p-2 border-t border-[#ffffff1a] flex justify-end space-x-1">
                        <button onClick={() => setShowGetOrders(false)} className="px-2 py-2 bg-gray-700 hover:bg-gray-600 rounded text-white transition">
                            {translations["Close"]}
                        </button>
                        <button onClick={() => handleAllocateSO()} className={`px-2 py-2 bg-cyan-600 hover:bg-cyan-500 rounded text-white transition`}>
                            {translations["Allocate and Create SO"]}
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
                            onClick={() => {
                                handleGetOrder();
                            }}
                            disabled={receiveGoodsId === 0 || masterList.countOrders === 0 || loadingSaveGRN}
                            className="px-2 py-2 bg-cyan-600 hover:bg-cyan-700 text-[#ffffffcc] text-custom-sm rounded-lg text-sm font-medium transition-colors"
                        >
                            {loadingSaveGRN ? <span>{translations["Processing2"]}...</span> : <span>{translations["Get Orders"]}</span>}
                        </button>
                        <button
                            onClick={() => {
                                setShowAllocation(true);
                                fetchAllocation();
                            }}
                            className="px-2 py-2 bg-cyan-600 hover:bg-cyan-700 text-[#ffffffcc] text-custom-sm rounded-lg text-sm font-medium transition-colors"
                        >
                            {translations["Allocation"]}
                        </button>
                        <button
                            onClick={handleSave}
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
                                <span>{translations["Save"]}</span>
                            )}
                        </button>
                        <button
                            onClick={() => {
                                exportRef.current?.triggerExport();
                            }}
                            disabled={receiveGoodsId === 0}
                            className="px-2 py-2 bg-cyan-600 hover:bg-cyan-700 text-[#ffffffcc] text-custom-sm rounded-lg text-sm font-medium transition-colors"
                        >
                            {translations["Print"]}
                        </button>
                        <button onClick={handleAddNew} className="px-2 py-2 bg-cyan-600 hover:bg-cyan-700 text-[#ffffffcc] text-custom-sm rounded-lg text-sm font-medium transition-colors">
                            {translations["Add New"]}
                        </button>
                        <button
                            onClick={handleDelete}
                            disabled={receiveGoodsId === 0 || masterList.countOrders === 0}
                            className="px-2 py-2 bg-red-600 hover:bg-red-700 text-[#ffffffcc] text-custom-sm rounded-lg text-sm font-medium transition-colors"
                        >
                            {translations["Delete"]}
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
                <ExportReportSelector ref={exportRef} formats={["odt"]} baseName="GRN_Report" ids={[receiveGoodsId]} language={lang} />
            </div>
            {renderProductList()}
            {renderSupplierList()}
            {renderAllocations()}
            {renderGetOrders()}
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

export default ReceiveGoodsDetails;
