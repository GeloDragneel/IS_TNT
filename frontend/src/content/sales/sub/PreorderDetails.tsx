import React, { useState, useEffect, useRef, useMemo } from "react";
import { productService, ApiProduct } from "@/services/productService";
import { customerService, ApiCustomer } from "@/services/customerService";
import { useLanguage } from "@/context/LanguageContext";
import { showConfirm } from "@/utils/alert";
import { showSuccessToast, showErrorToast } from "@/utils/toast";
import Pagination from "@/components/Pagination";
import ItemsPerPageSelector from "@/components/ItemsPerPageSelector";
import { ArrowLeft, Search, X } from "lucide-react";
import { formatDate, formatMoney, getImageUrl, baseCurrency, fetchExchangeRate, fetchOperator } from "@/utils/globalFunction";
import { preorderService } from "@/services/preorderService";
import CopyToClipboard from "@/components/CopyToClipboard";
import { LoadingSpinnerTbody } from "@/utils/LoadingSpinnerTbody";

interface PreorderDetailsProps {
    preorderId: number;
    saveType: string;
    onBack: () => void;
    onSave: () => void;
    onChangePreorderId: (newId: number) => void;
    onChangeSaveType: (type: string) => void;
    tabId: string;
    copySettings?: any;
}
const MemoizedPagination = React.memo(Pagination);
const MemoizedItemsPerPageSelector = React.memo(ItemsPerPageSelector);
// localStorage.clear();
const PreorderDetails: React.FC<PreorderDetailsProps> = ({ preorderId, saveType, onBack, onSave, onChangePreorderId, onChangeSaveType, tabId }) => {
    const { translations, lang } = useLanguage();
    const [selectedGroup, setSelectedGroup] = useState<
        {
            id: number;
            customer_group_en: string;
            customer_group_cn: string;
            currency: string;
            brevo_list_id: number;
        }[]
    >([]);
    const [preorder, setPreorder] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState("information");
    const [isDirty, setIsDirty] = useState(false);
    const [showCustomers, setShowCustomers] = useState(false);
    const [showProducts, setShowProducts] = useState(false);
    const [showGroups, setShowGroups] = useState(false);
    const isDirtyRef = useRef(isDirty);
    const [showUnsavedChanges, setShowUnsavedChanges] = useState(false);
    const [showVoucher, setShowVoucher] = useState(false);
    const [loadingSave, setLoadingSave] = useState(false);

    const [customers, setCustomers] = useState<ApiCustomer[]>([]);
    const [products, setProducts] = useState<ApiProduct[]>([]);
    const [voucherList, setVoucher] = useState<ApiProduct[]>([]);
    const [totalPagesCustomer, setTotalPages_Customer] = useState(1);
    const [totalPagesProducts, setTotalPages_Products] = useState(1);
    const [totalPagesVoucher, setTotalPages_Voucher] = useState(1);
    const pageSizeOptions = useMemo(() => [10, 20, 50, -1], []);

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
    const [currentPageProduct, setCurrentPageProduct] = useState(() => {
        const metaKey = `${tabId}-cached-preorder-product`;
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
        const metaKey = `${tabId}-cached-preorder-product`;
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
    const [searchTermProduct, setSearchTermProduct] = useState(() => {
        const cached = localStorage.getItem(`${tabId}-cached-preorder-product`);
        if (!cached) return "";
        try {
            const meta = JSON.parse(cached);
            return meta.search || "";
        } catch {
            return "";
        }
    });
    const [currentPageVoucher, setCurrentPageVoucher] = useState(() => {
        const metaKey = `${tabId}-cached-preorder-voucher`;
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
    const [itemsPerPageVoucher, setItemsPerPageVoucher] = useState(() => {
        const metaKey = `${tabId}-cached-preorder-voucher`;
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
    const [searchTermVoucher, setSearchTermVoucher] = useState(() => {
        const cached = localStorage.getItem(`${tabId}-cached-preorder-voucher`);
        if (!cached) return "";
        try {
            const meta = JSON.parse(cached);
            return meta.search || "";
        } catch {
            return "";
        }
    });
    // Form state - Updated to handle single vs multi-select properly
    const [formData, setFormData] = useState({
        product_id: 0,
        customer_id: 0,
        customer_code: "",
        product_code: "",
        product_title_en: "",
        product_title_cn: "",
        account_name_en: "",
        order_date: new Date()
            .toLocaleDateString("en-US", {
                month: "short",
                day: "2-digit",
                year: "numeric",
            })
            .replace(/,/g, ""),
        qty: 0,
        price: 0,
        item_deposit: 0,
        base_item_deposit: 0,
        voucher_value: 0,
        ex_rate: 0,
        currency: "",
        sales_person_name: "",
        pod_en: "",
        pod_cn: "",
        rwarehouse_en: "",
        rwarehouse_cn: "",
        customer_group_en: "",
        customer_group_cn: "",
        voucher_code: "",
        series_en: "",
        series_cn: "",
        release_date: "",
        closing_date: "",
        customer_type: "",
        price_setup_deposit_currency: "",
        item_cost_currency: "",
        supplier_code: "",
        price_setup_deposit: 0,
        item_cost: 0,
        deposit_currency: "",
        po_dateline: "",
        offered_cost_currency: "",
        e_total_sales_currency: "",
        e_profit_currency: "",
        e_cost_total_currency: "",
        pod: "",
        rwarehouse: "",
        pcs_per_carton: 0,
        preorder_price: 0,
        retail_price: 0,
        deposit: 0,
        price_a: 0,
        price_b: 0,
        price_c: 0,
        offered_cost: 0,
        e_total_sales: 0,
        e_cost_total: 0,
        e_profit: 0,
        price_deposit: 0,
        customer_group_id: 0,
        sales_person_id: 0,
        base_total: 0,
    });

    const preorderInfoKey = `${preorderId}-cached-preorder-info`;

    // Keep ref updated
    useEffect(() => {
        isDirtyRef.current = isDirty;
    }, [isDirty]);

    useEffect(() => {
        if (saveType === "new") {
            setLoading(true);
            clearForms();
            setPreorder([]);
            setIsDirty(false);
            isDirtyRef.current = false;
            setLoading(false);
        } else if (saveType === "addItem") {
            setLoading(true);
            newForms();
            setPreorder([]);
            setIsDirty(false);
            isDirtyRef.current = false;
            setLoading(false);
        } else {
            fetchPreorderDetails();
        }
    }, [preorderId, saveType]);

    useEffect(() => {
        const handleEsc = (event: any) => {
            if (event.key === "Escape") {
                setShowCustomers(false);
                setShowProducts(false);
            }
        };
        window.addEventListener("keydown", handleEsc);
        // Cleanup on unmount
        return () => {
            window.removeEventListener("keydown", handleEsc);
        };
    }, []);

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

    // ON LOAD PRODUCT LIST
    useEffect(() => {
        const productKey = `${tabId}-cached-products`;
        const metaKey = `${tabId}-cached-meta-product`;
        const mountKey = `${tabId}-mount-status-products`;

        const isFirstMount = sessionStorage.getItem(mountKey) !== "mounted";

        if (isFirstMount) {
            sessionStorage.setItem(mountKey, "mounted");
            fetchProducts(currentPageProduct, itemsPerPageProduct, searchTermProduct);
            return;
        }

        const cachedProductsRaw = localStorage.getItem(productKey);
        const cachedMetaRaw = localStorage.getItem(metaKey);

        if (!cachedProductsRaw || !cachedMetaRaw) {
            fetchProducts(currentPageProduct, itemsPerPageProduct, searchTermProduct);
            return;
        }

        try {
            const cachedMeta = JSON.parse(cachedMetaRaw);
            const cachedProducts = JSON.parse(cachedProductsRaw);

            const isCacheValid = cachedMeta.page === currentPageProduct && cachedMeta.perPage === itemsPerPageProduct && cachedMeta.search === searchTermProduct;

            if (isCacheValid) {
                setProducts(cachedProducts);
                setTotalPages_Products(cachedMeta.totalPages);
                setLoading(false);
                localStorage.setItem(`${tabId}-loading-products-preorder`, JSON.stringify(false));
                return;
            }
        } catch (err) {
            console.warn("Failed to parse cached meta:", err);
        }

        fetchProducts(currentPageProduct, itemsPerPageProduct, searchTermProduct);
    }, [currentPageProduct, itemsPerPageProduct, searchTermProduct, tabId]);

    // ON LOAD VOUCHER LIST
    useEffect(() => {
        const productKey = `${tabId}-cached-voucher`;
        const metaKey = `${tabId}-cached-meta-voucher`;
        const mountKey = `${tabId}-mount-status-voucher`;

        const isFirstMount = sessionStorage.getItem(mountKey) !== "mounted";

        if (isFirstMount) {
            sessionStorage.setItem(mountKey, "mounted");
            fetchVoucher(currentPageVoucher, itemsPerPageVoucher, searchTermVoucher);
            return;
        }

        const cachedProductsRaw = localStorage.getItem(productKey);
        const cachedMetaRaw = localStorage.getItem(metaKey);

        if (!cachedProductsRaw || !cachedMetaRaw) {
            fetchVoucher(currentPageVoucher, itemsPerPageVoucher, searchTermVoucher);
            return;
        }

        try {
            const cachedMeta = JSON.parse(cachedMetaRaw);
            const cachedProducts = JSON.parse(cachedProductsRaw);

            const isCacheValid = cachedMeta.page === currentPageVoucher && cachedMeta.perPage === itemsPerPageVoucher && cachedMeta.search === searchTermVoucher;

            if (isCacheValid) {
                setProducts(cachedProducts);
                setTotalPages_Products(cachedMeta.totalPages);
                setLoading(false);
                localStorage.setItem(`${tabId}-loading-voucher-preorder`, JSON.stringify(false));
                return;
            }
        } catch (err) {
            console.warn("Failed to parse cached meta:", err);
        }

        fetchVoucher(currentPageProduct, itemsPerPageVoucher, searchTermVoucher);
    }, [currentPageVoucher, itemsPerPageVoucher, searchTermVoucher, tabId]);

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
    // Filter products based on search term
    const filteredProducts = products.filter((product) => {
        const searchLower = searchTermProduct.toLowerCase();
        return (
            product.id?.toString().includes(searchLower) ||
            product.product_code?.toLowerCase().includes(searchLower) ||
            product.product_title_en?.toLowerCase().includes(searchLower) ||
            product.product_title_cn?.toLowerCase().includes(searchLower) ||
            product.product_status?.toLowerCase().includes(searchLower) ||
            product.rwarehouse?.toLowerCase().includes(searchLower)
        );
    });
    const fetchPreorderDetails = async () => {
        try {
            isDirtyRef.current = true; // 🔐 prevent dirty tracking
            setLoading(true);
            setError(null);

            const preorderInfoKey = `${preorderId}-cached-preorder-info`;
            const cachedProductsRaw = localStorage.getItem(preorderInfoKey);
            let foundProduct;

            if (cachedProductsRaw) {
                foundProduct = JSON.parse(cachedProductsRaw);
            } else {
                foundProduct = await preorderService.getPreorderInfo(preorderId);
            }
            if (foundProduct) {
                setPreorder(foundProduct);
                setFormData((prev) => ({
                    ...prev,
                    customer_code: foundProduct.customer_code || "",
                    product_code: foundProduct.product_code || "",
                    product_title_en: foundProduct.product_title_en || "",
                    product_title_cn: foundProduct.product_title_cn || "",
                    order_date: foundProduct.order_date || "",
                    qty: foundProduct.qty || 0,
                    product_id: foundProduct.product_id || 0,
                    customer_id: foundProduct.customer_id || 0,
                    price: foundProduct.price || 0,
                    item_deposit: foundProduct.item_deposit || 0,
                    base_item_deposit: foundProduct.base_item_deposit || 0,
                    voucher_value: foundProduct.voucher_value || 0,
                    ex_rate: foundProduct.ex_rate || 0,
                    currency: foundProduct.currency || "",
                    pod_en: foundProduct.pod_en || "",
                    pod_cn: foundProduct.pod_cn || "",
                    series_en: foundProduct.series_en || "",
                    series_cn: foundProduct.series_cn || "",
                    rwarehouse_en: foundProduct.rwarehouse_en || "",
                    rwarehouse_cn: foundProduct.rwarehouse_cn || "",
                    sales_person_name: foundProduct.sales_person_name || "",
                    account_name_en: foundProduct.account_name_en || "",
                    customer_group_en: foundProduct.customer_group_en || "",
                    customer_group_cn: foundProduct.customer_group_cn || "",
                    customer_type: foundProduct.customer_type || "",
                    release_date: foundProduct.release_date || "",
                    closing_date: foundProduct.closing_date || "",
                    deposit_currency: foundProduct.deposit_currency || "",
                    item_cost_currency: foundProduct.item_cost_currency || "",
                    po_dateline: foundProduct.po_dateline || "",
                    offered_cost_currency: foundProduct.offered_cost_currency || "",
                    supplier_code: foundProduct.supplier_code || "",
                    e_total_sales_currency: foundProduct.e_total_sales_currency || "",
                    e_profit_currency: foundProduct.e_profit_currency || "",
                    e_cost_total_currency: foundProduct.e_cost_total_currency || "",
                    price_setup_deposit_currency: foundProduct.price_setup_deposit_currency || "",

                    pod: foundProduct.pod || "",
                    rwarehouse: foundProduct.rwarehouse || "",
                    voucher_code: foundProduct.voucher_code || 0,
                    pcs_per_carton: foundProduct.pcs_per_carton || 0,
                    price_setup_deposit: foundProduct.price_setup_deposit || 0,
                    preorder_price: foundProduct.preorder_price || 0,
                    retail_price: foundProduct.retail_price || 0,
                    deposit: foundProduct.deposit || 0,
                    item_cost: foundProduct.item_cost || 0,
                    price_a: foundProduct.price_a || 0,
                    price_b: foundProduct.price_b || 0,
                    price_c: foundProduct.price_c || 0,
                    offered_cost: foundProduct.offered_cost || 0,
                    e_total_sales: foundProduct.e_total_sales || 0,
                    e_profit: foundProduct.e_profit || 0,
                    e_cost_total: foundProduct.e_cost_total || 0,
                    price_deposit: foundProduct.price_deposit || 0,
                    customer_group_id: foundProduct.customer_group_id || 0,
                    sales_person_id: foundProduct.sales_person_id || 0,
                    base_total: foundProduct.base_total || 0,
                }));
                // ✅ Only cache if it's a fresh fetch
                if (!cachedProductsRaw) {
                    localStorage.setItem(preorderInfoKey, JSON.stringify(foundProduct));
                }
            } else {
                setError("Product not found");
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to fetch product details");
            console.error("Error fetching product details:", err);
        } finally {
            setLoading(false);
            isDirtyRef.current = false; // ✅ re-enable dirty tracking
        }
    };
    const fetchCustomers = async (page = currentPageCustomer, perPage = itemsPerPageCustomer, search = "") => {
        try {
            // setLoading(true);
            setError(null);
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
            setError(err instanceof Error ? err.message : "Failed to fetch customers");
            console.error("Error fetching customers:", err);
        } finally {
            setLoading(false);
            localStorage.setItem(`${tabId}-loading-customers-preorder`, JSON.stringify(false));
        }
    };
    const fetchProducts = async (page = currentPageProduct, perPage = itemsPerPageProduct, search = "") => {
        try {
            // setLoading(true);
            setError(null);
            localStorage.setItem(`${tabId}-loading-products-preorder`, JSON.stringify(true));

            const paginatedData = await productService.getAllProducts(page, perPage, search);

            setProducts(paginatedData.data);
            setTotalPages_Products(paginatedData.last_page);

            localStorage.setItem(`${tabId}-cached-products`, JSON.stringify(paginatedData.data));
            localStorage.setItem(
                `${tabId}-cached-preorder-product`,
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
            setLoading(false);
            localStorage.setItem(`${tabId}-loading-products-preorder`, JSON.stringify(false));
        }
    };
    const fetchVoucher = async (page = currentPageVoucher, perPage = itemsPerPageVoucher, search = "") => {
        try {
            // setLoading(true);
            setError(null);
            localStorage.setItem(`${tabId}-loading-voucher-preorder`, JSON.stringify(true));

            const customerCode = formData.customer_code;
            const paginatedData = await preorderService.getAllVoucherByCode(page, perPage, search, customerCode);

            setVoucher(paginatedData.data);
            setTotalPages_Voucher(paginatedData.last_page);

            localStorage.setItem(`${tabId}-cached-voucher`, JSON.stringify(paginatedData.data));
            localStorage.setItem(
                `${tabId}-cached-preorder-voucher`,
                JSON.stringify({
                    page,
                    perPage,
                    search,
                    totalPages: paginatedData.last_page,
                    totalItems: paginatedData.total,
                })
            );
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to fetch voucher");
            console.error("Error fetching voucher:", err);
        } finally {
            setLoading(false);
            localStorage.setItem(`${tabId}-loading-voucher-preorder`, JSON.stringify(false));
        }
    };
    const updateCachedRaw = async (cachedType: string, masterId: number) => {
        if (cachedType === "preorderInfo") {
            const preorderInfoKey = `${masterId}-cached-preorder-info`;
            const newData = await preorderService.getPreorderInfo(masterId);
            if (newData) {
                localStorage.setItem(preorderInfoKey, JSON.stringify(newData));
            }
        }
    };
    const handleSave = async () => {
        setLoadingSave(true); // Disable the button
        const data = new FormData();
        const customer_code = formData["customer_code"]?.toString().trim() ?? "";
        const product_code = formData["product_code"]?.toString().trim() ?? "";
        if (!customer_code || customer_code === "") {
            showErrorToast(translations["Customer Account Code is Required"]);
            setLoadingSave(false); // Enable button again
            return;
        }
        if (!product_code || product_code === "") {
            showErrorToast(translations["Product Code is Required"]);
            setLoadingSave(false); // Enable button again
            return;
        }
        if (!formData.qty || formData.qty === 0) {
            showErrorToast(translations["Quantity is Required"]);
            setLoadingSave(false); // Enable button again
            return;
        }
        if (!formData.price || formData.price === 0) {
            showErrorToast(translations["Price is Required"]);
            setLoadingSave(false); // Enable button again
            return;
        }
        if (!formData.item_cost || formData.item_cost === 0) {
            showErrorToast(translations["Item Cost is Required"]);
            setLoadingSave(false); // Enable button again
            return;
        }
        if (!formData.rwarehouse || formData.rwarehouse === "") {
            showErrorToast(translations["Receiving Warehouse is required"]);
            setLoadingSave(false); // Enable button again
            return;
        }

        // Append all form data
        Object.keys(formData).forEach((key) => {
            let value = formData[key as keyof typeof formData];
            if (value !== null && value !== undefined) {
                data.append(key, value.toString());
            }
        });

        try {
            const result = await preorderService.updatePreorder(preorderId, data);
            const newId = result?.id;
            if (result.token === "Error") {
                showErrorToast(translations[result.message] + " " + result.message2);
                return;
            }
            if ((saveType === "new" || saveType === "copy") && newId) {
                onChangePreorderId(newId);
                onChangeSaveType("edit");
            }
            // Reset state to allow re-initialization after refetch
            setIsDirty(false);
            await updateCachedRaw("preorderInfo", newId);
            showSuccessToast(translations[result.message]);
            onSave(); // This will now trigger the cache clearing in the parent
        } catch (error) {
            showErrorToast(translations["Failed to save Preorder."] || "Failed to save Preorder.");
        } finally {
            setLoadingSave(false); // Enable button again after the operation is done
        }
    };
    const handleAddNew = async () => {
        onChangePreorderId(0);
        onChangeSaveType("new");
        clearForms();
        setIsDirty(false);
        isDirtyRef.current = false;
    };
    const handleAddItem = async () => {
        onChangePreorderId(0);
        onChangeSaveType("addItem");
        newForms();
        setIsDirty(false);
        isDirtyRef.current = false;
    };
    const clearForms = () => {
        const initialFormData = {
            customer_code: "",
            product_code: "",
            product_title_en: "",
            product_title_cn: "",
            account_name_en: "",
            order_date: new Date()
                .toLocaleDateString("en-US", {
                    month: "short",
                    day: "2-digit",
                    year: "numeric",
                })
                .replace(/,/g, ""),
            qty: 0,
            price: 0,
            item_deposit: 0,
            base_item_deposit: 0,
            voucher_value: 0,
            ex_rate: 0,
            currency: "",
            sales_person_name: "",
            pod_en: "",
            pod_cn: "",
            rwarehouse_en: "",
            rwarehouse_cn: "",
            customer_group_en: "",
            customer_group_cn: "",
            voucher_code: "",
            series_en: "",
            series_cn: "",
            release_date: "",
            closing_date: "",
            customer_type: "",
            price_setup_deposit_currency: "",
            item_cost_currency: "",
            supplier_code: "",
            price_setup_deposit: 0,
            item_cost: 0,
            deposit_currency: "",
            po_dateline: "",
            offered_cost_currency: "",
            e_total_sales_currency: "",
            e_profit_currency: "",
            e_cost_total_currency: "",
            pod: "",
            rwarehouse: "",
            pcs_per_carton: 0,
            preorder_price: 0,
            retail_price: 0,
            deposit: 0,
            price_a: 0,
            price_b: 0,
            price_c: 0,
            offered_cost: 0,
            e_total_sales: 0,
            e_cost_total: 0,
            e_profit: 0,
            price_deposit: 0,
            customer_group_id: 0,
            sales_person_id: 0,
            product_id: 0,
            customer_id: 0,
            base_total: 0,
        };
        setFormData(initialFormData);
    };
    const newForms = () => {
        setFormData((prevState) => ({
            ...prevState,
            pcs_per_carton: 0,
            price_a: 0,
            price_b: 0,
            price_c: 0,
            preorder_price: 0,
            retail_price: 0,
            deposit_currency: "",
            price_deposit: 0,
            price_setup_deposit: 0,
            price_setup_deposit_currency: "",
            item_cost_currency: "",
            item_cost: 0,
            price: 0,
            qty: 0,
            item_deposit: 0,
            base_item_deposit: 0,
            product_code: "",
            product_id: 0,
            product_title_en: "",
            product_title_cn: "",
            series_en: "",
            series_cn: "",
            release_date: "",
            closing_date: "",
            po_dateline: "",
            supplier_code: "",
            offered_cost: 0,
            offered_cost_currency: "",
            ex_rate: 0,
            e_total_sales: 0,
            e_cost_total: 0,
            e_profit: 0,
            e_total_sales_currency: "",
            e_cost_total_currency: "",
            e_profit_currency: "",
        }));
    };
    const handleDelete = async () => {
        const selectedPreorder = [preorderId];
        if (selectedPreorder.length === 0) return;

        const confirmed = await showConfirm(translations["System Message"], translations["Are you sure you want to delete this record?"], translations["Delete"], translations["Cancel"]);

        if (!confirmed) return;
        try {
            await preorderService.deletePreorder(selectedPreorder);
            showSuccessToast(translations["Record has been Deleted"]);
            onChangePreorderId(0); // Notify parent about new product ID
            onChangeSaveType("new");
            // Delay logic to allow re-render with preorderId = 0
            setIsDirty(false);
            // Refetch data to get the new "initial" state
            localStorage.removeItem(preorderInfoKey);
            onSave();
        } catch (err) {
            showErrorToast(translations["alert_message_18"]);
            console.error("Deletion failed:", err);
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
        const sales_person_id = specificItem?.sales_person_id?.toString();
        const sales_person_name = specificItem?.sales_person_name?.toString();
        const pod = specificItem?.pod.toString();
        const pod_en = specificItem?.pod_list?.warehouse_en?.toString();
        const pod_cn = specificItem?.pod_list?.warehouse_cn?.toString();
        const rwarehouse = specificItem?.rwarehouse.toString();
        const rwarehouse_en = specificItem?.warehouse_list?.warehouse_en?.toString();
        const rwarehouse_cn = specificItem?.warehouse_list?.warehouse_cn?.toString();
        const customer_type = specificItem?.customer_type?.toString() === "WC" ? translations["Wholesale Customer"] : translations["Retail Customer"];
        const countGroup = specificItem?.customer_group.length;
        const customer_group_id = countGroup == 1 ? specificItem?.customer_group[0].id : "";
        const customer_group_en = countGroup == 1 ? specificItem?.customer_group[0].customer_group_en : "";
        const customer_group_cn = countGroup == 1 ? specificItem?.customer_group[0].customer_group_cn : "";

        setFormData((prevState) => ({
            ...prevState,
            customer_id: Number(customer_id),
            customer_code: customer_code ? customer_code : "",
            account_name_en: account_name_en ? account_name_en : "",
            currency: currency ? currency : "",
            sales_person_name: sales_person_name ? sales_person_name : "",
            sales_person_id: sales_person_id ? sales_person_id : "",
            pod: pod_en ? pod : "",
            pod_en: pod_en ? pod_en : "",
            pod_cn: pod_en ? pod_cn : "",
            rwarehouse: rwarehouse_en ? rwarehouse : "",
            rwarehouse_en: rwarehouse_en ? rwarehouse_en : "",
            rwarehouse_cn: rwarehouse_cn ? rwarehouse_cn : "",
            customer_type: customer_type ? customer_type : "",
            customer_group_id: Number(customer_group_id),
            customer_group_en: customer_group_en ? customer_group_en : "",
            customer_group_cn: customer_group_cn ? customer_group_cn : "",
        }));
        if (countGroup > 1) {
            setShowGroups(true);
            setSelectedGroup(specificItem?.customer_group);
        }
        setShowCustomers(false);
    };
    const handleRowClick_Product = async (e: React.MouseEvent, tableId: number) => {
        // Prevent navigation if clicking on checkboxes or toggle switches
        const target = e.target as HTMLElement;
        if (target.closest("input") || target.closest("label") || target.closest("[data-copy-button]")) {
            return;
        }
        const productListKey = `${tabId}-cached-products`;
        const cachedProductRaw = localStorage.getItem(productListKey);
        let rawDataCached: ApiProduct[] | null = null;

        if (cachedProductRaw) {
            try {
                rawDataCached = JSON.parse(cachedProductRaw);
            } catch (error) {
                console.error("Error parsing cached product data", error);
            }
        }
        const specificItem = rawDataCached?.find((item: ApiProduct) => item.id === tableId);
        const currency = formData.currency;
        const exRate = await fetchExchangeRate(currency, baseCurrency());
        const customer_type = formData.customer_type;
        const customer_group_id = formData.customer_group_id;
        const item_cost = specificItem?.item_cost?.toString();
        const product_id = specificItem?.id?.toString();
        const product_code = specificItem?.product_code?.toString();
        const product_title_en = specificItem?.product_title_en?.toString();
        const product_title_cn = specificItem?.product_title_cn?.toString();
        const release_date = specificItem?.release_date?.toString();
        const closing_date = specificItem?.preorder_dateline?.toString();
        const po_dateline = specificItem?.po_dateline?.toString();
        const offered_cost = specificItem?.offered_cost?.toString();
        const offered_cost_currency = specificItem?.supplier_currency?.toString();
        const supplier_code = specificItem?.supplier?.supplier_code?.toString();
        const matchedWHPrice = specificItem?.price_list?.find((item: any) => item.customer_group_id === customer_group_id);
        const matchedRCPrice = specificItem?.price_list?.find((item: any) => item.product_id === specificItem.id && item.type === "retail" && item.currency === currency);
        const countPrice = specificItem?.price_setup.length;
        if (countPrice === 0 && customer_type === "WC") {
            showErrorToast(translations["No Pricing for this group"]);
            return;
        }

        switch (customer_type) {
            case "Wholesale Customer":
                if (matchedWHPrice === undefined) {
                    showErrorToast(translations["No Pricing for this group"]);
                    return;
                }
                setFormData((prevState) => ({
                    ...prevState,
                    pcs_per_carton: specificItem?.pcs_per_carton?.toString() ? specificItem?.pcs_per_carton?.toString() : "",
                    price_a: matchedWHPrice?.price_a?.toString() ? matchedWHPrice?.price_a?.toString() : "0.00",
                    price_b: matchedWHPrice?.price_b?.toString() ? matchedWHPrice?.price_b?.toString() : "0.00",
                    price_c: matchedWHPrice?.price_c?.toString() ? matchedWHPrice?.price_c?.toString() : "0.00",
                    preorder_price: matchedRCPrice?.preorder_price?.toString() ? matchedRCPrice?.preorder_price?.toString() : "0.00",
                    retail_price: matchedRCPrice?.retail_price?.toString() ? matchedRCPrice?.retail_price?.toString() : "0.00",
                    deposit_currency: matchedRCPrice?.currency?.toString() ? matchedRCPrice?.currency?.toString() : "",
                    price_deposit: matchedRCPrice?.deposit?.toString() ? matchedRCPrice?.deposit?.toString() : "0.00",
                    price_setup_deposit: matchedWHPrice?.deposit?.toString() ? matchedWHPrice?.deposit?.toString() : "0.00",
                    price_setup_deposit_currency: matchedWHPrice?.currency?.toString() ? matchedWHPrice?.currency?.toString() : "0.00",
                    item_cost_currency: baseCurrency(),
                    item_cost: Number(item_cost),
                    product_code: product_code,
                    product_id: Number(product_id),
                    product_title_en: product_title_en,
                    product_title_cn: product_title_cn,
                    series_en: specificItem?.series?.series_en,
                    series_cn: specificItem?.series?.series_cn,
                    release_date: release_date,
                    closing_date: closing_date,
                    po_dateline: po_dateline,
                    supplier_code: supplier_code,
                    offered_cost: offered_cost,
                    offered_cost_currency: offered_cost_currency,
                    ex_rate: exRate,
                }));
                break;
            case "Retail Customer":
                if (matchedWHPrice === undefined) {
                    showErrorToast(translations["No Pricing for this group"]);
                    return;
                }
                setFormData((prevState) => ({
                    ...prevState,
                    pcs_per_carton: specificItem?.pcs_per_carton?.toString() ? specificItem?.pcs_per_carton?.toString() : "",
                    price_a: Number("0.00"),
                    price_b: Number("0.00"),
                    price_c: Number("0.00"),
                    preorder_price: matchedWHPrice?.preorder_price?.toString() ? matchedWHPrice?.preorder_price?.toString() : "0.00",
                    retail_price: matchedWHPrice?.retail_price?.toString() ? matchedWHPrice?.retail_price?.toString() : "0.00",
                    deposit_currency: matchedWHPrice?.currency?.toString() ? matchedWHPrice?.currency?.toString() : "",
                    price_deposit: matchedRCPrice?.deposit?.toString() ? matchedRCPrice?.deposit?.toString() : "0.00",
                    price_setup_deposit: Number("0.00"),
                    item_cost_currency: baseCurrency(),
                    item_cost: Number(item_cost),
                    product_id: Number(product_id),
                    product_code: product_code,
                    product_title_en: product_title_en,
                    product_title_cn: product_title_cn,
                    series_en: specificItem?.series?.series_en,
                    series_cn: specificItem?.series?.series_cn,
                    release_date: release_date,
                    closing_date: closing_date,
                    po_dateline: po_dateline,
                    supplier_code: supplier_code,
                    offered_cost: offered_cost,
                    offered_cost_currency: offered_cost_currency,
                    ex_rate: exRate,
                }));
                break;
        }
        setShowProducts(false);
    };
    const handleRowClick_Voucher = async (e: React.MouseEvent, tableId: number) => {
        // Prevent navigation if clicking on checkboxes or toggle switches
        const target = e.target as HTMLElement;
        if (target.closest("input") || target.closest("label") || target.closest("[data-copy-button]")) {
            return;
        }
        const productListKey = `${tabId}-cached-voucher`;
        const cachedProductRaw = localStorage.getItem(productListKey);
        let rawDataCached: ApiProduct[] | null = null;

        if (cachedProductRaw) {
            try {
                rawDataCached = JSON.parse(cachedProductRaw);
            } catch (error) {
                console.error("Error parsing cached product data", error);
            }
        }
        const specificItem = rawDataCached?.find((item: ApiProduct) => item.id === tableId);
        const value = specificItem?.value?.toString();
        const voucher_no = specificItem?.voucher_no?.toString();
        setFormData((prev) => ({
            ...prev,
            voucher_value: Number(value),
            voucher_code: String(voucher_no),
        }));
        setShowVoucher(false);
        handleRowCalculate_QtyPrice(formData.qty, formData.price, "qty");
    };
    const handleRowClick_Group = (e: React.MouseEvent, tableId: number) => {
        // Prevent navigation if clicking on checkboxes or toggle switches
        const target = e.target as HTMLElement;
        if (target.closest("input") || target.closest("label") || target.closest("[data-copy-button]")) {
            return;
        }
        // Using optional chaining (?.) to avoid null errors
        const specificItem = selectedGroup?.find((item: ApiCustomer) => item.id === tableId);
        const customer_group_id = specificItem?.id?.toString();
        const customer_group_en = specificItem?.customer_group_en?.toString();
        const customer_group_cn = specificItem?.customer_group_cn?.toString();
        const currency = specificItem?.currency?.toString();
        setFormData((prevState) => ({
            ...prevState,
            customer_group_id: Number(customer_group_id),
            customer_group_en: customer_group_en ? customer_group_en : "",
            customer_group_cn: customer_group_cn ? customer_group_cn : "",
            currency: currency ? currency : "",
        }));
        setShowGroups(false);
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
            const sales_person_id = specificItem?.sales_person_id?.toString();
            const sales_person_name = specificItem?.sales_person_name?.toString();
            const pod = specificItem?.pod.toString();
            const pod_en = specificItem?.pod_list?.warehouse_en?.toString();
            const pod_cn = specificItem?.pod_list?.warehouse_cn?.toString();
            const rwarehouse = specificItem?.rwarehouse.toString();
            const rwarehouse_en = specificItem?.warehouse_list?.warehouse_en?.toString();
            const rwarehouse_cn = specificItem?.warehouse_list?.warehouse_cn?.toString();
            const customer_type = specificItem?.customer_type?.toString() === "WC" ? translations["Wholesale Customer"] : translations["Retail Customer"];
            const countGroup = specificItem?.customer_group.length;
            const customer_group_id = countGroup == 1 ? specificItem?.customer_group[0].id : "";
            const customer_group_en = countGroup == 1 ? specificItem?.customer_group[0].customer_group_en : "";
            const customer_group_cn = countGroup == 1 ? specificItem?.customer_group[0].customer_group_cn : "";
            setFormData((prevState) => ({
                ...prevState,
                customer_id: Number(customer_id),
                customer_code: customer_code ? customer_code : "",
                account_name_en: account_name_en ? account_name_en : "",
                currency: currency ? currency : "",
                sales_person_name: sales_person_name ? sales_person_name : "",
                sales_person_id: sales_person_id ? sales_person_id : "",
                pod: pod_en ? pod : "",
                pod_en: pod_en ? pod_en : "",
                pod_cn: pod_en ? pod_cn : "",
                rwarehouse: rwarehouse_en ? rwarehouse : "",
                rwarehouse_en: rwarehouse_en ? rwarehouse_en : "",
                rwarehouse_cn: rwarehouse_cn ? rwarehouse_cn : "",
                customer_type: customer_type ? customer_type : "",
                customer_group_id: Number(customer_group_id),
                customer_group_en: customer_group_en ? customer_group_en : "",
                customer_group_cn: customer_group_cn ? customer_group_cn : "",
            }));
            if (countGroup > 1) {
                setShowGroups(true);
                setSelectedGroup(specificItem?.customer_group);
            }
        } else if (len > 1) {
            setShowCustomers(true);
            setSearchTermCustomer(value);
        } else {
            setShowCustomers(true);
            setSearchTermCustomer("");
        }
    };
    const handleRowEnter_Products = async (value: string) => {
        const paginatedData = await productService.getAllProductsByCode(1, 10, value);
        const data = paginatedData.data;
        const len = data.length;

        if (len === 1) {
            // Using optional chaining (?.) to avoid null errors
            const specificItem = data[0];
            const currency = formData.currency;
            const exRate = await fetchExchangeRate(currency, baseCurrency());
            const customer_type = formData.customer_type;
            const customer_group_id = formData.customer_group_id;
            const product_id = specificItem?.id?.toString();
            const item_cost = specificItem?.item_cost?.toString();
            const product_code = specificItem?.product_code?.toString();
            const product_title_en = specificItem?.product_title_en?.toString();
            const product_title_cn = specificItem?.product_title_cn?.toString();
            const release_date = specificItem?.release_date?.toString();
            const closing_date = specificItem?.preorder_dateline?.toString();
            const po_dateline = specificItem?.po_dateline?.toString();
            const offered_cost = specificItem?.offered_cost?.toString();
            const offered_cost_currency = specificItem?.supplier_currency?.toString();
            const supplier_code = specificItem?.supplier?.supplier_code?.toString();
            const matchedWHPrice = specificItem?.price_list?.find((item: any) => item.customer_group_id === customer_group_id);
            const matchedRCPrice = specificItem?.price_list?.find((item: any) => item.product_id === specificItem.id && item.type === "retail" && item.currency === currency);
            const countPrice = specificItem?.price_setup.length;
            if (countPrice === 0 && customer_type === "WC") {
                showErrorToast(translations["No Pricing for this group"]);
                return;
            }

            switch (customer_type) {
                case "Wholesale Customer":
                    if (matchedWHPrice === undefined) {
                        showErrorToast(translations["No Pricing for this group"]);
                        return;
                    }
                    setFormData((prevState) => ({
                        ...prevState,
                        pcs_per_carton: specificItem?.pcs_per_carton?.toString() ? specificItem?.pcs_per_carton?.toString() : "",
                        price_a: matchedWHPrice?.price_a?.toString() ? matchedWHPrice?.price_a?.toString() : "0.00",
                        price_b: matchedWHPrice?.price_b?.toString() ? matchedWHPrice?.price_b?.toString() : "0.00",
                        price_c: matchedWHPrice?.price_c?.toString() ? matchedWHPrice?.price_c?.toString() : "0.00",
                        preorder_price: matchedRCPrice?.preorder_price?.toString() ? matchedRCPrice?.preorder_price?.toString() : "0.00",
                        retail_price: matchedRCPrice?.retail_price?.toString() ? matchedRCPrice?.retail_price?.toString() : "0.00",
                        deposit_currency: matchedRCPrice?.currency?.toString() ? matchedRCPrice?.currency?.toString() : "",
                        price_deposit: matchedRCPrice?.deposit?.toString() ? matchedRCPrice?.deposit?.toString() : "0.00",
                        price_setup_deposit: matchedWHPrice?.deposit?.toString() ? matchedWHPrice?.deposit?.toString() : "0.00",
                        price_setup_deposit_currency: matchedWHPrice?.currency?.toString() ? matchedWHPrice?.currency?.toString() : "0.00",
                        item_cost_currency: baseCurrency(),
                        item_cost: Number(item_cost),
                        product_id: Number(product_id),
                        product_code: product_code,
                        product_title_en: product_title_en,
                        product_title_cn: product_title_cn,
                        series_en: specificItem?.series?.series_en,
                        series_cn: specificItem?.series?.series_cn,
                        release_date: release_date,
                        closing_date: closing_date,
                        po_dateline: po_dateline,
                        supplier_code: supplier_code,
                        offered_cost: offered_cost,
                        offered_cost_currency: offered_cost_currency,
                        ex_rate: exRate,
                    }));
                    break;
                case "Retail Customer":
                    if (matchedWHPrice === undefined) {
                        showErrorToast(translations["No Pricing for this group"]);
                        return;
                    }
                    setFormData((prevState) => ({
                        ...prevState,
                        pcs_per_carton: specificItem?.pcs_per_carton?.toString() ? specificItem?.pcs_per_carton?.toString() : "",
                        price_a: Number("0.00"),
                        price_b: Number("0.00"),
                        price_c: Number("0.00"),
                        preorder_price: matchedWHPrice?.preorder_price?.toString() ? matchedWHPrice?.preorder_price?.toString() : "0.00",
                        retail_price: matchedWHPrice?.retail_price?.toString() ? matchedWHPrice?.retail_price?.toString() : "0.00",
                        deposit_currency: matchedWHPrice?.currency?.toString() ? matchedWHPrice?.currency?.toString() : "",
                        price_deposit: matchedRCPrice?.deposit?.toString() ? matchedRCPrice?.deposit?.toString() : "0.00",
                        price_setup_deposit: Number("0.00"),
                        item_cost_currency: baseCurrency(),
                        item_cost: Number(item_cost),
                        product_id: Number(product_id),
                        product_code: product_code,
                        product_title_en: product_title_en,
                        product_title_cn: product_title_cn,
                        series_en: specificItem?.series?.series_en,
                        series_cn: specificItem?.series?.series_cn,
                        release_date: release_date,
                        closing_date: closing_date,
                        po_dateline: po_dateline,
                        supplier_code: supplier_code,
                        offered_cost: offered_cost,
                        offered_cost_currency: offered_cost_currency,
                        ex_rate: exRate,
                    }));
                    break;
            }
        } else if (len > 1) {
            setShowProducts(true);
            setSearchTermProduct(value);
        } else {
            setShowProducts(true);
            setSearchTermProduct("");
        }
    };
    const handleRowCalculate_QtyPrice = async (qty: number, price: number, type: string) => {
        const customer_group_id = formData.customer_group_id;
        const per_per_carton = formData.pcs_per_carton;
        const customer_type = formData.customer_type;
        const ex_rate = formData.ex_rate;
        const currency = formData.currency;
        const product_id = formData.product_id;
        const conversionKey = currency + baseCurrency();
        const Operator = await fetchOperator(conversionKey);
        let newPrice = 0;
        let newItemDeposit = 0;
        let newBaseTotal = 0;
        let newBaseSales = 0;
        let newBaseItemDeposit = 0;
        let newBaseProfit = 0;
        let price_setup_deposit = 0;
        switch (customer_type) {
            case "Wholesale Customer":
                newPrice = await preorderService.getWholesalePricingByProduct(product_id, customer_group_id, currency, qty);
                price_setup_deposit = formData.price_setup_deposit;
                newItemDeposit = (price_setup_deposit / per_per_carton) * qty;
                break;
            case "Retail Customer":
                newPrice = await preorderService.getRetailPricingByProduct(product_id, currency);
                price_setup_deposit = formData.price_deposit;
                newItemDeposit = price_setup_deposit * qty;
                const newExRate = await fetchExchangeRate(currency, baseCurrency());
                if (Operator == "Divide") {
                    newPrice = newPrice / newExRate;
                    newItemDeposit = newItemDeposit / newExRate;
                }
                if (Operator == "Multiply") {
                    newPrice = newPrice * newExRate;
                    newItemDeposit = newItemDeposit * newExRate;
                }
                break;
        }
        const finalPrice = type === "qty" ? newPrice : price;
        const total = finalPrice * qty;
        const voucher_amount = Number(formData.voucher_value);
        const total_cost = qty * formData.item_cost;

        if (ex_rate === 1) {
            newBaseTotal = total;
            newBaseSales = qty * finalPrice;
            newBaseItemDeposit = newItemDeposit;
        } else {
            if (ex_rate == 0) {
                showErrorToast(translations["Exchange Rate is Required"]);
                return;
            }
            if (Operator == "Divide") {
                newBaseTotal = total / ex_rate;
                newBaseSales = (qty * finalPrice) / ex_rate;
                newBaseItemDeposit = newItemDeposit / ex_rate;
            }
            if (Operator == "Multiply") {
                newBaseTotal = total * ex_rate;
                newBaseSales = qty * finalPrice * ex_rate;
                newBaseItemDeposit = newItemDeposit * ex_rate;
            }
        }
        newBaseSales = newBaseSales - voucher_amount;
        newBaseProfit = newBaseSales - total_cost;
        setFormData((prevState) => ({
            ...prevState,
            base_total: parseFloat(newBaseTotal.toFixed(2)),
            item_deposit: parseFloat(newItemDeposit.toFixed(2)),
            base_item_deposit: parseFloat(newBaseItemDeposit.toFixed(2)),
            price: parseFloat(finalPrice.toFixed(2)),
            e_total_sales: parseFloat(newBaseSales.toFixed(2)),
            e_total_sales_currency: baseCurrency(),
            e_cost_total: parseFloat(total_cost.toFixed(2)),
            e_cost_total_currency: baseCurrency(),
            e_profit: parseFloat(newBaseProfit.toFixed(2)),
            e_profit_currency: baseCurrency(),
        }));
    };
    const handleRowCalculate_Deposit = async (value: number) => {
        const ex_rate = formData.ex_rate;
        const currency = formData.currency;
        const conversionKey = currency + baseCurrency();
        const Operator = await fetchOperator(conversionKey);
        let newBaseItemDeposit = 0;
        if (ex_rate === 1) {
            newBaseItemDeposit = value;
        } else {
            if (ex_rate == 0) {
                showErrorToast(translations["Exchange Rate is Required"]);
                return;
            }
            if (Operator == "Divide") {
                newBaseItemDeposit = value / ex_rate;
            }
            if (Operator == "Multiply") {
                newBaseItemDeposit = value * ex_rate;
            }
        }
        setFormData((prevState) => ({
            ...prevState,
            base_item_deposit: parseFloat(newBaseItemDeposit.toFixed(2)),
        }));
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
    if ((error || !preorder) && saveType !== "new") {
        return (
            <div className="min-h-screen" style={{ backgroundColor: "#1a1a1a" }}>
                <div className="p-6">
                    <button onClick={onBack} className="flex items-center space-x-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-[#ffffffcc] text-custom-sm rounded-lg transition-colors mb-4">
                        <ArrowLeft className="h-4 w-4" />
                        <span>{translations["Back"]}</span>
                    </button>
                    <div className="text-center py-12">
                        <div className="text-red-400 text-lg mb-2">{error || "preorder not found"}</div>
                        <p className="text-gray-400">The preorder you're looking for doesn't exist or couldn't be loaded.</p>
                    </div>
                </div>
            </div>
        );
    }
    const renderPreorderInfo = () => (
        <div className="p-2 bg-[#19191c] rounded-xl">
            <div className="h-[calc(100vh-150px)] overflow-y-auto pr-2">
                <div className="grid gap-4">
                    {/* Product Code Section */}
                    <div className="grid grid-cols-12 gap-4">
                        <div className="col-span-12 md:col-span-6">
                            <fieldset className="border border-[#ffffff1a] rounded-lg p-4 mb-2">
                                <legend className="text-white text-left px-3 py-1 border border-[#ffffff1a] rounded-md bg-[#19191c]">{translations["Customer Order"]} :</legend>

                                <div className="grid grid-cols-12 gap-4">
                                    {/* Left Column */}
                                    <div className="col-span-12 md:col-span-6">
                                        <div className="flex items-center gap-4 mb-2">
                                            <label className="w-32 text-gray-400 text-sm">{translations["Customer Code"]}</label>
                                            <div className="flex flex-1">
                                                <input
                                                    type="text"
                                                    value={formData.customer_code}
                                                    onChange={(e) => {
                                                        const value = e.target.value;
                                                        setFormData((prev) => ({ ...prev, customer_code: value }));
                                                        if (!isDirtyRef.current) setIsDirty(true);
                                                    }}
                                                    onKeyDown={(e) => {
                                                        if (e.key === "Enter") {
                                                            handleRowEnter_Customer(formData.customer_code);
                                                        }
                                                    }}
                                                    className="flex-1 px-3 py-2 border border-[#ffffff1a] border-r-0 bg-transparent text-[#ffffffcc] text-custom-sm rounded-tl-md rounded-bl-md !rounded-tr-none !rounded-br-none"
                                                    placeholder={translations["Customer Code"]}
                                                />
                                                <input
                                                    type="hidden"
                                                    value={formData.customer_id}
                                                    onChange={(e) => {
                                                        const value = Number(e.target.value);
                                                        setFormData((prev) => ({ ...prev, customer_id: value }));
                                                        if (!isDirtyRef.current) setIsDirty(true);
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
                                        <div className="flex items-center gap-4 mb-2">
                                            <label className="w-32 text-gray-400 text-sm">{translations["Product Code"]}</label>
                                            <div className="flex flex-1">
                                                <input
                                                    type="text"
                                                    value={formData.product_code}
                                                    onChange={(e) => {
                                                        const value = e.target.value;
                                                        setFormData((prev) => ({ ...prev, product_code: value }));
                                                        if (!isDirtyRef.current) setIsDirty(true);
                                                    }}
                                                    onKeyDown={(e) => {
                                                        if (e.key === "Enter") {
                                                            handleRowEnter_Products(formData.product_code);
                                                        }
                                                    }}
                                                    className="flex-1 px-3 py-2 border border-[#ffffff1a] border-r-0 bg-transparent text-[#ffffffcc] text-custom-sm rounded-tl-md rounded-bl-md !rounded-tr-none !rounded-br-none"
                                                    placeholder={translations["Product Code"]}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        if (formData.customer_code === "") {
                                                            showErrorToast(translations["Please Key-In Customer Account"]);
                                                            return;
                                                        }
                                                        setShowProducts(true);
                                                    }}
                                                    className="px-2 py-2 bg-cyan-600 text-white !rounded-tr-md !rounded-br-md !rounded-tl-none !rounded-bl-none hover:bg-cyan-700 flex items-center justify-center border border-[#ffffff1a] border-l-0"
                                                >
                                                    <Search className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                    {/* Right Column */}
                                    <div className="col-span-12 md:col-span-6">
                                        <div className="flex items-center gap-4 mb-2">
                                            <label className="w-32 text-gray-400 text-sm">{translations["Order Date"]}</label>
                                            <input
                                                type="text"
                                                readOnly
                                                value={formatDate(formData.order_date, lang)}
                                                onChange={(e) => {
                                                    const value = e.target.value;
                                                    setFormData((prev) => ({ ...prev, order_date: value }));
                                                    if (!isDirtyRef.current) setIsDirty(true);
                                                }}
                                                className="flex-1 px-3 py-2 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm"
                                            />
                                        </div>
                                        <div className="flex items-center gap-4 mb-2">
                                            <label className="w-32 text-gray-400 text-sm">{translations["Contact Name"]}</label>
                                            <input
                                                type="text"
                                                readOnly
                                                value={formData.account_name_en}
                                                onChange={(e) => {
                                                    const value = e.target.value;
                                                    setFormData((prev) => ({ ...prev, account_name_en: value }));
                                                    if (!isDirtyRef.current) setIsDirty(true);
                                                }}
                                                className="flex-1 px-3 py-2 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm"
                                            />
                                        </div>
                                    </div>
                                    {/* Full Width Row */}
                                    <div className="col-span-12 md:col-span-12">
                                        <div className="flex items-center gap-4 mb-2">
                                            <label className="w-32 text-gray-400 text-sm">{translations["Product Name"]}</label>
                                            <input
                                                type="text"
                                                readOnly
                                                hidden={lang == "cn"}
                                                value={formData.product_title_en}
                                                onChange={(e) => {
                                                    const value = e.target.value;
                                                    setFormData((prev) => ({ ...prev, product_title_en: value }));
                                                    if (!isDirtyRef.current) setIsDirty(true);
                                                }}
                                                className="flex-1 px-3 py-2 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm"
                                            />
                                            <input
                                                type="text"
                                                readOnly
                                                hidden={lang == "en"}
                                                value={formData.product_title_cn}
                                                onChange={(e) => {
                                                    const value = e.target.value;
                                                    setFormData((prev) => ({ ...prev, product_title_cn: value }));
                                                    if (!isDirtyRef.current) setIsDirty(true);
                                                }}
                                                className="flex-1 px-3 py-2 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm"
                                            />
                                        </div>
                                    </div>
                                    {/* Left Column */}
                                    <div className="col-span-12 md:col-span-6">
                                        <div className="flex items-center gap-4 mb-2">
                                            <label className="w-32 text-gray-400 text-sm">{translations["Qty"]}</label>
                                            <input
                                                type="number"
                                                value={formData.qty === 0 ? "" : formData.qty}
                                                onChange={(e) => {
                                                    const value = Number(e.target.value);
                                                    setFormData((prev) => ({ ...prev, qty: value }));
                                                    if (!isDirtyRef.current) setIsDirty(true);
                                                    handleRowCalculate_QtyPrice(value, formData.price, "qty");
                                                }}
                                                onBlur={(e) => {
                                                    const value = Number(e.target.value);
                                                    handleRowCalculate_QtyPrice(value, formData.price, "qty");
                                                }}
                                                placeholder="0"
                                                className="flex-1 px-3 py-2 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm"
                                            />
                                        </div>
                                        <div className="flex items-center gap-4 mb-2">
                                            <label className="w-32 text-gray-400 text-sm">{translations["Price"]}</label>
                                            <input
                                                type="number"
                                                value={formData.price}
                                                onChange={(e) => {
                                                    const value = Number(e.target.value);
                                                    setFormData((prev) => ({ ...prev, price: value }));
                                                    if (!isDirtyRef.current) setIsDirty(true);
                                                }}
                                                onBlur={(e) => {
                                                    const value = Number(e.target.value);
                                                    handleRowCalculate_QtyPrice(formData.qty, value, "price");
                                                }}
                                                placeholder="0.00"
                                                className="flex-1 px-3 py-2 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm"
                                            />
                                        </div>
                                        <div className="flex items-center gap-4 mb-2">
                                            <label className="w-32 text-gray-400 text-sm">{translations["Deposit"]}</label>
                                            <input
                                                type="number"
                                                value={formData.item_deposit}
                                                onChange={(e) => {
                                                    const value = Number(e.target.value);
                                                    setFormData((prev) => ({ ...prev, item_deposit: value }));
                                                    if (!isDirtyRef.current) setIsDirty(true);
                                                }}
                                                onBlur={(e) => {
                                                    const value = Number(e.target.value);
                                                    handleRowCalculate_Deposit(value);
                                                }}
                                                placeholder="0.00"
                                                className="flex-1 px-3 py-2 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm"
                                            />
                                            <input
                                                type="hidden"
                                                value={formData.base_item_deposit}
                                                onChange={(e) => {
                                                    const value = Number(e.target.value);
                                                    setFormData((prev) => ({ ...prev, base_item_deposit: value }));
                                                    if (!isDirtyRef.current) setIsDirty(true);
                                                }}
                                                className="flex-1 px-3 py-2 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm"
                                            />
                                            <input
                                                type="hidden"
                                                value={formData.base_total}
                                                onChange={(e) => {
                                                    const value = Number(e.target.value);
                                                    setFormData((prev) => ({ ...prev, base_total: value }));
                                                    if (!isDirtyRef.current) setIsDirty(true);
                                                }}
                                                className="flex-1 px-3 py-2 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm"
                                            />
                                        </div>
                                        <div className="flex items-center gap-4 mb-2">
                                            <label className="w-32 text-gray-400 text-sm">{translations["Customer Group"]}</label>
                                            <input
                                                type="text"
                                                value={formData.customer_group_en}
                                                readOnly
                                                onChange={(e) => {
                                                    const value = e.target.value;
                                                    setFormData((prev) => ({ ...prev, customer_group_en: value }));
                                                    if (!isDirtyRef.current) setIsDirty(true);
                                                }}
                                                className="flex-1 px-3 py-2 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm"
                                            />
                                            <input
                                                type="hidden"
                                                value={formData.customer_group_id}
                                                readOnly
                                                onChange={(e) => {
                                                    const value = Number(e.target.value);
                                                    setFormData((prev) => ({ ...prev, customer_group_id: value }));
                                                    if (!isDirtyRef.current) setIsDirty(true);
                                                }}
                                                className="flex-1 px-3 py-2 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm"
                                            />
                                        </div>
                                        <div className="flex items-center gap-4 mb-2">
                                            <label className="w-32 text-gray-400 text-sm">{translations["View Payment"]}</label>
                                            <input
                                                type="text"
                                                placeholder={translations["Click to view"]}
                                                readOnly
                                                onClick={() => {}}
                                                className="cursor-pointer flex-1 px-3 py-2 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm"
                                            />
                                        </div>
                                        <div className="flex items-center gap-4 mb-2">
                                            <label className="w-32 text-gray-400 text-sm">{translations["Voucher"]}</label>
                                            <div className="flex flex-1">
                                                <input
                                                    type="text"
                                                    readOnly
                                                    value={formData.voucher_value}
                                                    onChange={(e) => {
                                                        const value = Number(e.target.value);
                                                        setFormData((prev) => ({ ...prev, voucher_value: value }));
                                                        if (!isDirtyRef.current) setIsDirty(true);
                                                    }}
                                                    className="flex-1 px-3 py-2 border border-[#ffffff1a] border-r-0 bg-transparent text-[#ffffffcc] text-custom-sm rounded-tl-md rounded-bl-md !rounded-tr-none !rounded-br-none"
                                                />
                                                <input
                                                    type="hidden"
                                                    readOnly
                                                    value={formData.voucher_code}
                                                    onChange={(e) => {
                                                        const value = e.target.value;
                                                        setFormData((prev) => ({ ...prev, voucher_code: value }));
                                                        if (!isDirtyRef.current) setIsDirty(true);
                                                    }}
                                                    className="flex-1 px-3 py-2 border border-[#ffffff1a] border-r-0 bg-transparent text-[#ffffffcc] text-custom-sm rounded-tl-md rounded-bl-md !rounded-tr-none !rounded-br-none"
                                                />

                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setShowVoucher(true);
                                                        fetchVoucher();
                                                    }}
                                                    className="px-2 py-2 bg-cyan-600 text-white !rounded-tr-md !rounded-br-md !rounded-tl-none !rounded-bl-none hover:bg-cyan-700 flex items-center justify-center border border-[#ffffff1a] border-l-0"
                                                >
                                                    <Search className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                    {/* Right Column */}
                                    <div className="col-span-12 md:col-span-6">
                                        <div className="flex items-center gap-4 mb-2">
                                            <label className="w-32 text-gray-400 text-sm">{translations["Ex Rate"]}</label>
                                            <input
                                                type="text"
                                                readOnly
                                                value={formData.ex_rate}
                                                onChange={(e) => {
                                                    const value = Number(e.target.value);
                                                    setFormData((prev) => ({ ...prev, ex_rate: value }));
                                                    if (!isDirtyRef.current) setIsDirty(true);
                                                }}
                                                className="flex-1 px-3 py-2 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm"
                                            />
                                        </div>
                                        <div className="flex items-center gap-4 mb-2">
                                            <label className="w-32 text-gray-400 text-sm">{translations["Currency"]}</label>
                                            <input
                                                type="text"
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
                                        <div className="flex items-center gap-4 mb-2">
                                            <label className="w-32 text-gray-400 text-sm">{translations["POD"]}</label>
                                            <input
                                                type="text"
                                                hidden={lang === "cn"}
                                                readOnly
                                                value={formData.pod_en}
                                                onChange={(e) => {
                                                    const value = e.target.value;
                                                    setFormData((prev) => ({ ...prev, pod_en: value }));
                                                    if (!isDirtyRef.current) setIsDirty(true);
                                                }}
                                                className="flex-1 px-3 py-2 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm"
                                            />
                                            <input
                                                type="text"
                                                hidden={lang === "en"}
                                                readOnly
                                                value={formData.pod_cn}
                                                onChange={(e) => {
                                                    const value = e.target.value;
                                                    setFormData((prev) => ({ ...prev, pod_cn: value }));
                                                    if (!isDirtyRef.current) setIsDirty(true);
                                                }}
                                                className="flex-1 px-3 py-2 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm"
                                            />
                                            <input
                                                type="hidden"
                                                readOnly
                                                value={formData.pod}
                                                onChange={(e) => {
                                                    const value = e.target.value;
                                                    setFormData((prev) => ({ ...prev, pod: value }));
                                                    if (!isDirtyRef.current) setIsDirty(true);
                                                }}
                                                className="flex-1 px-3 py-2 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm"
                                            />
                                        </div>
                                        <div className="flex items-center gap-4 mb-2">
                                            <label className="w-32 text-gray-400 text-sm">{translations["Sales Person"]}</label>
                                            <input
                                                type="text"
                                                readOnly
                                                value={formData.sales_person_name}
                                                onChange={(e) => {
                                                    const value = e.target.value;
                                                    setFormData((prev) => ({ ...prev, sales_person_name: value }));
                                                    if (!isDirtyRef.current) setIsDirty(true);
                                                }}
                                                className="flex-1 px-3 py-2 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm"
                                            />
                                            <input
                                                type="hidden"
                                                readOnly
                                                value={formData.sales_person_id}
                                                onChange={(e) => {
                                                    const value = Number(e.target.value);
                                                    setFormData((prev) => ({ ...prev, sales_person_id: value }));
                                                    if (!isDirtyRef.current) setIsDirty(true);
                                                }}
                                                className="flex-1 px-3 py-2 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm"
                                            />
                                        </div>
                                        <div className="flex items-center gap-4 mb-2">
                                            <label className="w-32 text-gray-400 text-sm">{translations["Series"]}</label>
                                            <input
                                                type="text"
                                                hidden={lang === "cn"}
                                                readOnly
                                                value={formData.series_en}
                                                onChange={(e) => {
                                                    const value = e.target.value;
                                                    setFormData((prev) => ({ ...prev, series_en: value }));
                                                    if (!isDirtyRef.current) setIsDirty(true);
                                                }}
                                                className="flex-1 px-3 py-2 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm"
                                            />
                                            <input
                                                type="text"
                                                hidden={lang === "en"}
                                                readOnly
                                                value={formData.series_cn}
                                                onChange={(e) => {
                                                    const value = e.target.value;
                                                    setFormData((prev) => ({ ...prev, series_cn: value }));
                                                    if (!isDirtyRef.current) setIsDirty(true);
                                                }}
                                                className="flex-1 px-3 py-2 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm"
                                            />
                                        </div>
                                        <div className="flex items-center gap-4 mb-2">
                                            <label className="w-32 text-gray-400 text-sm">{translations["Warehouse"]}</label>
                                            <input
                                                type="text"
                                                hidden={lang === "cn"}
                                                readOnly
                                                value={formData.rwarehouse_en}
                                                onChange={(e) => {
                                                    const value = e.target.value;
                                                    setFormData((prev) => ({ ...prev, rwarehouse_en: value }));
                                                    if (!isDirtyRef.current) setIsDirty(true);
                                                }}
                                                className="flex-1 px-3 py-2 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm"
                                            />
                                            <input
                                                type="text"
                                                hidden={lang === "en"}
                                                readOnly
                                                value={formData.rwarehouse_cn}
                                                onChange={(e) => {
                                                    const value = e.target.value;
                                                    setFormData((prev) => ({ ...prev, rwarehouse_cn: value }));
                                                    if (!isDirtyRef.current) setIsDirty(true);
                                                }}
                                                className="flex-1 px-3 py-2 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm"
                                            />
                                            <input
                                                type="hidden"
                                                readOnly
                                                value={formData.rwarehouse}
                                                onChange={(e) => {
                                                    const value = e.target.value;
                                                    setFormData((prev) => ({ ...prev, rwarehouse: value }));
                                                    if (!isDirtyRef.current) setIsDirty(true);
                                                }}
                                                className="flex-1 px-3 py-2 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </fieldset>
                        </div>
                        <div className="col-span-12 md:col-span-6">
                            <fieldset className="border-[1px] border-[#ffffff1a] rounded-lg p-4 mb-2">
                                <legend className="text-white text-left px-3 py-1 border-[1px] border-[#ffffff1a] rounded-md bg-[#19191c]">{translations["Item Information"]} :</legend>
                                <div className="grid grid-cols-12 gap-4">
                                    {/* Left Column */}
                                    <div className="col-span-12 md:col-span-6">
                                        <div className="flex items-center gap-4 mb-2">
                                            <label className="w-32 text-gray-400 text-sm">{translations["Release Date"]}</label>
                                            <input
                                                type="text"
                                                value={formatDate(formData.release_date, lang)}
                                                readOnly
                                                onChange={(e) => {
                                                    const value = e.target.value;
                                                    setFormData((prev) => ({ ...prev, release_date: value }));
                                                    if (!isDirtyRef.current) setIsDirty(true);
                                                }}
                                                className="flex-1 px-3 py-2 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm"
                                            />
                                        </div>

                                        <div className="flex items-center gap-4 mb-2">
                                            <label className="w-32 text-gray-400 text-sm">{translations["Pcs Per Carton"]}</label>
                                            <input
                                                type="text"
                                                value={formData.pcs_per_carton}
                                                readOnly
                                                onChange={(e) => {
                                                    const value = Number(e.target.value);
                                                    setFormData((prev) => ({ ...prev, pcs_per_carton: value }));
                                                    if (!isDirtyRef.current) setIsDirty(true);
                                                }}
                                                className="flex-1 px-3 py-2 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm"
                                            />
                                        </div>
                                    </div>
                                    {/* Right Column */}
                                    <div className="col-span-12 md:col-span-6">
                                        <div className="flex items-center gap-4 mb-2">
                                            <label className="w-32 text-gray-400 text-sm">{translations["Closing Date"]}</label>
                                            <input
                                                type="text"
                                                value={formatDate(formData.closing_date, lang)}
                                                readOnly
                                                onChange={(e) => {
                                                    const value = e.target.value;
                                                    setFormData((prev) => ({ ...prev, closing_date: value }));
                                                    if (!isDirtyRef.current) setIsDirty(true);
                                                }}
                                                className="flex-1 px-3 py-2 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm"
                                            />
                                        </div>

                                        <div className="flex items-center gap-4 mb-2">
                                            <label className="w-32 text-gray-400 text-sm">{translations["Customer Type"]}</label>
                                            <input
                                                type="text"
                                                readOnly
                                                value={translations[formData.customer_type]}
                                                onChange={(e) => {
                                                    const value = e.target.value;
                                                    setFormData((prev) => ({ ...prev, customer_type: value }));
                                                    if (!isDirtyRef.current) setIsDirty(true);
                                                }}
                                                className="flex-1 px-3 py-2 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </fieldset>
                            <fieldset className="border-[1px] border-[#ffffff1a] rounded-lg p-4 mb-2">
                                <legend className="text-white text-left px-3 py-1 border-[1px] border-[#ffffff1a] rounded-md bg-[#19191c]">{translations["Pricing Information"]} :</legend>
                                <div className="grid grid-cols-12 gap-4">
                                    {/* Left Column */}
                                    <div className="col-span-12 md:col-span-6">
                                        <div className="flex items-center gap-4 mb-2">
                                            <label className="w-32 text-gray-400 text-sm">{translations["Deposit"]}</label>
                                            <div className="flex flex-1 gap-2">
                                                <input
                                                    type="text"
                                                    value={formData.price_setup_deposit_currency}
                                                    readOnly
                                                    onChange={(e) => {
                                                        const value = e.target.value;
                                                        setFormData((prev) => ({ ...prev, price_setup_deposit_currency: value }));
                                                        if (!isDirtyRef.current) setIsDirty(true);
                                                    }}
                                                    className="w-20 px-3 py-2 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm"
                                                />
                                                <input
                                                    type="text"
                                                    readOnly
                                                    value={formData.price_setup_deposit}
                                                    onChange={(e) => {
                                                        const value = Number(e.target.value);
                                                        setFormData((prev) => ({ ...prev, price_setup_deposit: value }));
                                                        if (!isDirtyRef.current) setIsDirty(true);
                                                    }}
                                                    className="flex-1 px-3 py-2 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm"
                                                />
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4 mb-2">
                                            <label className="w-32 text-gray-400 text-sm">{translations["Price A"]}</label>
                                            <div className="flex flex-1 gap-2">
                                                <input
                                                    type="text"
                                                    value={formData.currency}
                                                    readOnly
                                                    onChange={(e) => {
                                                        const value = e.target.value;
                                                        setFormData((prev) => ({ ...prev, currency: value }));
                                                        if (!isDirtyRef.current) setIsDirty(true);
                                                    }}
                                                    className="w-20 px-3 py-2 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm"
                                                />
                                                <input
                                                    type="text"
                                                    readOnly
                                                    value={formData.price_a}
                                                    onChange={(e) => {
                                                        const value = Number(e.target.value);
                                                        setFormData((prev) => ({ ...prev, price_a: value }));
                                                        if (!isDirtyRef.current) setIsDirty(true);
                                                    }}
                                                    className="flex-1 px-3 py-2 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm"
                                                />
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4 mb-2">
                                            <label className="w-32 text-gray-400 text-sm">{translations["Price B"]}</label>
                                            <div className="flex flex-1 gap-2">
                                                <input
                                                    type="text"
                                                    value={formData.currency}
                                                    readOnly
                                                    onChange={(e) => {
                                                        const value = e.target.value;
                                                        setFormData((prev) => ({ ...prev, currency: value }));
                                                        if (!isDirtyRef.current) setIsDirty(true);
                                                    }}
                                                    className="w-20 px-3 py-2 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm"
                                                />
                                                <input
                                                    type="text"
                                                    readOnly
                                                    value={formData.price_b}
                                                    onChange={(e) => {
                                                        const value = Number(e.target.value);
                                                        setFormData((prev) => ({ ...prev, price_b: value }));
                                                        if (!isDirtyRef.current) setIsDirty(true);
                                                    }}
                                                    className="flex-1 px-3 py-2 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm"
                                                />
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4 mb-2">
                                            <label className="w-32 text-gray-400 text-sm">{translations["Price C"]}</label>
                                            <div className="flex flex-1 gap-2">
                                                <input
                                                    type="text"
                                                    value={formData.currency}
                                                    readOnly
                                                    onChange={(e) => {
                                                        const value = e.target.value;
                                                        setFormData((prev) => ({ ...prev, currency: value }));
                                                        if (!isDirtyRef.current) setIsDirty(true);
                                                    }}
                                                    className="w-20 px-3 py-2 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm"
                                                />
                                                <input
                                                    type="text"
                                                    readOnly
                                                    value={formData.price_c}
                                                    onChange={(e) => {
                                                        const value = Number(e.target.value);
                                                        setFormData((prev) => ({ ...prev, price_c: value }));
                                                        if (!isDirtyRef.current) setIsDirty(true);
                                                    }}
                                                    className="flex-1 px-3 py-2 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    {/* Right Column */}
                                    <div className="col-span-12 md:col-span-6">
                                        <div className="flex items-center gap-4 mb-2">
                                            <label className="w-32 text-gray-400 text-sm">{translations["Retail Price"]}</label>
                                            <div className="flex flex-1 gap-2">
                                                <input
                                                    type="text"
                                                    value={formData.deposit_currency}
                                                    readOnly
                                                    onChange={(e) => {
                                                        const value = e.target.value;
                                                        setFormData((prev) => ({ ...prev, deposit_currency: value }));
                                                        if (!isDirtyRef.current) setIsDirty(true);
                                                    }}
                                                    className="w-20 px-3 py-2 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm"
                                                />
                                                <input
                                                    type="text"
                                                    readOnly
                                                    value={formData.retail_price}
                                                    onChange={(e) => {
                                                        const value = Number(e.target.value);
                                                        setFormData((prev) => ({ ...prev, retail_price: value }));
                                                        if (!isDirtyRef.current) setIsDirty(true);
                                                    }}
                                                    className="flex-1 px-3 py-2 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm"
                                                />
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4 mb-2">
                                            <label className="w-32 text-gray-400 text-sm">{translations["Preorder Price"]}</label>
                                            <div className="flex flex-1 gap-2">
                                                <input
                                                    type="text"
                                                    value={formData.deposit_currency}
                                                    readOnly
                                                    onChange={(e) => {
                                                        const value = e.target.value;
                                                        setFormData((prev) => ({ ...prev, deposit_currency: value }));
                                                        if (!isDirtyRef.current) setIsDirty(true);
                                                    }}
                                                    className="w-20 px-3 py-2 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm"
                                                />
                                                <input
                                                    type="text"
                                                    readOnly
                                                    value={formData.preorder_price}
                                                    onChange={(e) => {
                                                        const value = Number(e.target.value);
                                                        setFormData((prev) => ({ ...prev, preorder_price: value }));
                                                        if (!isDirtyRef.current) setIsDirty(true);
                                                    }}
                                                    className="flex-1 px-3 py-2 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm"
                                                />
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4 mb-2">
                                            <label className="w-32 text-gray-400 text-sm">{translations["Retail Deposit"]}</label>
                                            <div className="flex flex-1 gap-2">
                                                <input
                                                    type="text"
                                                    value={formData.deposit_currency}
                                                    readOnly
                                                    onChange={(e) => {
                                                        const value = e.target.value;
                                                        setFormData((prev) => ({ ...prev, deposit_currency: value }));
                                                        if (!isDirtyRef.current) setIsDirty(true);
                                                    }}
                                                    className="w-20 px-3 py-2 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm"
                                                />
                                                <input
                                                    type="text"
                                                    readOnly
                                                    value={formData.price_deposit}
                                                    onChange={(e) => {
                                                        const value = Number(e.target.value);
                                                        setFormData((prev) => ({ ...prev, price_deposit: value }));
                                                        if (!isDirtyRef.current) setIsDirty(true);
                                                    }}
                                                    className="flex-1 px-3 py-2 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm"
                                                />
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4 mb-2">
                                            <label className="w-32 text-gray-400 text-sm">{translations["Item Cost"]}</label>
                                            <div className="flex flex-1 gap-2">
                                                <input
                                                    type="text"
                                                    value={formData.item_cost_currency}
                                                    readOnly
                                                    onChange={(e) => {
                                                        const value = e.target.value;
                                                        setFormData((prev) => ({ ...prev, item_cost_currency: value }));
                                                        if (!isDirtyRef.current) setIsDirty(true);
                                                    }}
                                                    className="w-20 px-3 py-2 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm"
                                                />
                                                <input
                                                    type="text"
                                                    readOnly
                                                    value={formData.item_cost}
                                                    onChange={(e) => {
                                                        const value = Number(e.target.value);
                                                        setFormData((prev) => ({ ...prev, item_cost: value }));
                                                        if (!isDirtyRef.current) setIsDirty(true);
                                                    }}
                                                    className="flex-1 px-3 py-2 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </fieldset>
                            <fieldset className="border-[1px] border-[#ffffff1a] rounded-lg p-4 mb-2">
                                <legend className="text-white text-left px-3 py-1 border-[1px] border-[#ffffff1a] rounded-md bg-[#19191c]">{translations["Supplier"]} :</legend>
                                <div className="grid grid-cols-12 gap-4">
                                    {/* Left Column */}
                                    <div className="col-span-12 md:col-span-6">
                                        <div className="flex items-center gap-4 mb-2">
                                            <label className="w-32 text-gray-400 text-sm">{translations["Supplier"]}</label>
                                            <input
                                                type="text"
                                                value={formData.supplier_code}
                                                readOnly
                                                onChange={(e) => {
                                                    const value = e.target.value;
                                                    setFormData((prev) => ({ ...prev, supplier_code: value }));
                                                    if (!isDirtyRef.current) setIsDirty(true);
                                                }}
                                                className="flex-1 px-3 py-2 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm"
                                            />
                                        </div>
                                        <div className="flex items-center gap-4 mb-2">
                                            <label className="w-32 text-gray-400 text-sm">{translations["Closing Date"]}</label>
                                            <input
                                                type="text"
                                                value={formatDate(formData.po_dateline, lang)}
                                                readOnly
                                                onChange={(e) => {
                                                    const value = e.target.value;
                                                    setFormData((prev) => ({ ...prev, po_dateline: value }));
                                                    if (!isDirtyRef.current) setIsDirty(true);
                                                }}
                                                className="flex-1 px-3 py-2 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm"
                                            />
                                        </div>
                                        <div className="flex items-center gap-4 mb-2">
                                            <label className="w-32 text-gray-400 text-sm">{translations["Offered Cost"]}</label>
                                            <div className="flex flex-1 gap-2">
                                                <input
                                                    type="text"
                                                    value={formData.offered_cost_currency}
                                                    readOnly
                                                    onChange={(e) => {
                                                        const value = e.target.value;
                                                        setFormData((prev) => ({ ...prev, offered_cost_currency: value }));
                                                        if (!isDirtyRef.current) setIsDirty(true);
                                                    }}
                                                    className="w-20 px-3 py-2 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm"
                                                />
                                                <input
                                                    type="text"
                                                    readOnly
                                                    value={formData.offered_cost}
                                                    onChange={(e) => {
                                                        const value = Number(e.target.value);
                                                        setFormData((prev) => ({ ...prev, offered_cost: value }));
                                                        if (!isDirtyRef.current) setIsDirty(true);
                                                    }}
                                                    className="flex-1 px-3 py-2 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    {/* Right Column */}
                                    <div className="col-span-12 md:col-span-6">
                                        <div className="flex items-center gap-4 mb-2">
                                            <label className="w-32 text-gray-400 text-sm">{translations["Total Sales"]}</label>
                                            <div className="flex flex-1 gap-2">
                                                <input
                                                    type="text"
                                                    value={formData.e_total_sales_currency}
                                                    readOnly
                                                    onChange={(e) => {
                                                        const value = e.target.value;
                                                        setFormData((prev) => ({ ...prev, e_total_sales_currency: value }));
                                                        if (!isDirtyRef.current) setIsDirty(true);
                                                    }}
                                                    className="w-20 px-3 py-2 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm"
                                                />
                                                <input
                                                    type="text"
                                                    readOnly
                                                    value={formData.e_total_sales.toFixed(2)}
                                                    onChange={(e) => {
                                                        const value = Number(e.target.value);
                                                        setFormData((prev) => ({ ...prev, e_total_sales: value }));
                                                        if (!isDirtyRef.current) setIsDirty(true);
                                                    }}
                                                    className="flex-1 px-3 py-2 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm"
                                                />
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4 mb-2">
                                            <label className="w-32 text-gray-400 text-sm">{translations["Total Cost"]}</label>
                                            <div className="flex flex-1 gap-2">
                                                <input
                                                    type="text"
                                                    value={formData.e_cost_total_currency}
                                                    readOnly
                                                    onChange={(e) => {
                                                        const value = e.target.value;
                                                        setFormData((prev) => ({ ...prev, e_cost_total_currency: value }));
                                                        if (!isDirtyRef.current) setIsDirty(true);
                                                    }}
                                                    className="w-20 px-3 py-2 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm"
                                                />
                                                <input
                                                    type="text"
                                                    readOnly
                                                    value={formData.e_cost_total.toFixed(2)}
                                                    onChange={(e) => {
                                                        const value = Number(e.target.value);
                                                        setFormData((prev) => ({ ...prev, e_cost_total: value }));
                                                        if (!isDirtyRef.current) setIsDirty(true);
                                                    }}
                                                    className="flex-1 px-3 py-2 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm"
                                                />
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4 mb-2">
                                            <label className="w-32 text-gray-400 text-sm">{translations["Total Profit"]}</label>
                                            <div className="flex flex-1 gap-2">
                                                <input
                                                    type="text"
                                                    value={formData.e_profit_currency}
                                                    readOnly
                                                    onChange={(e) => {
                                                        const value = e.target.value;
                                                        setFormData((prev) => ({ ...prev, e_profit_currency: value }));
                                                        if (!isDirtyRef.current) setIsDirty(true);
                                                    }}
                                                    className="w-20 px-3 py-2 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm"
                                                />
                                                <input
                                                    type="text"
                                                    readOnly
                                                    value={formData.e_profit.toFixed(2)}
                                                    onChange={(e) => {
                                                        const value = Number(e.target.value);
                                                        setFormData((prev) => ({ ...prev, e_profit: value }));
                                                        if (!isDirtyRef.current) setIsDirty(true);
                                                    }}
                                                    className="flex-1 px-3 py-2 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </fieldset>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
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
                        <div className="max-h-[calc(100vh-435px)] overflow-y-auto">
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
    const renderProductList = () => {
        if (!showProducts) return null;
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-[#19191c] rounded-xl border border-[#ffffff1a] w-[60vw] h-auto flex flex-col">
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-[#ffffff1a]">
                        <div className="flex items-center space-x-4">
                            <h2 className="text-xl font-bold text-white">{translations["Search Item List"]}</h2>
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
                                        <th className="w-[55%] text-left py-2 px-4 text-gray-400 text-sm">{translations["Product"]}</th>
                                        <th className="w-[15%] text-left py-2 px-4 text-gray-400 text-sm">{translations["Date Created"]}</th>
                                        <th className="w-[15%] text-left py-2 px-4 text-gray-400 text-sm">{translations["Preorder Start Date"]}</th>
                                        <th className="w-[15%] text-left py-2 px-4 text-gray-400 text-sm">{translations["Preorder End Date"]}</th>
                                    </tr>
                                </thead>
                                {loading ? (
                                    <LoadingSpinnerTbody rowsCount={itemsPerPageProduct} />
                                ) : (
                                    <tbody>
                                        {filteredProducts.map((product, index) => (
                                            <tr
                                                key={product.id || index}
                                                onClick={(e) => handleRowClick_Product(e, product.id)}
                                                className={`clickable border-b hover:bg-gray-700 hover:bg-opacity-30 transition-colors cursor-pointer`}
                                                style={{ borderColor: "#40404042" }}
                                            >
                                                <td className="py-3 px-4">
                                                    <div className="flex items-center space-x-3">
                                                        <div className="w-8 h-8 bg-gray-600 rounded-lg flex items-center justify-center">
                                                            <img
                                                                src={getImageUrl(product.product_thumbnail)}
                                                                alt="Thumbnail"
                                                                className="w-full h-full object-cover"
                                                                onError={(e) => {
                                                                    (e.target as HTMLImageElement).src = "http://localhost:8000/storage/products/no-image-min.jpg";
                                                                }}
                                                            />
                                                        </div>
                                                        <div>
                                                            <div className="group flex items-center">
                                                                <p className="text-gray-300 text-custom-sm select-text">{product.product_code}</p>
                                                                <CopyToClipboard text={product.product_code} />
                                                            </div>
                                                            <div className="group flex items-center">
                                                                <p className="text-gray-400 text-custom-sm">{lang == "en" ? product.product_title_en : product.product_title_cn}</p>
                                                                <CopyToClipboard text={lang == "en" ? product.product_title_en : product.product_title_cn} />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-3 px-4 text-gray-400 text-left text-custom-sm">{formatDate(product.created_date, lang)}</td>
                                                <td className="py-3 px-4 text-gray-400 text-left text-custom-sm">{formatDate(product.preorder_start_date, lang)}</td>
                                                <td className="py-3 px-4 text-gray-400 text-left text-custom-sm">{formatDate(product.preorder_end_date, lang)}</td>
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
                        </div>
                    </div>
                </div>
            </div>
        );
    };
    const renderGroupList = () => {
        if (!showGroups) return null;
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-[#19191c] rounded-xl border border-[#ffffff1a] w-[30vw] h-auto flex flex-col">
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-[#ffffff1a]">
                        <div className="flex items-center space-x-4">
                            <h2 className="text-xl font-bold text-white">{translations["Customer Group"]}</h2>
                        </div>
                        <div className="flex items-center space-x-4">
                            <button
                                onClick={() => {
                                    setShowGroups(false);
                                }}
                                className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                            >
                                <X className="h-6 w-6 text-white" />
                            </button>
                        </div>
                    </div>
                    {/* Content */}
                    <div className="p-2 flex-1 overflow-auto">
                        <table className="w-full">
                            <thead className="sticky top-0 z-[1]" style={{ backgroundColor: "#1f2132" }}>
                                <tr className="border-b" style={{ borderColor: "#2d2d30" }}>
                                    <th className="w-[100%] text-left py-2 px-4 text-gray-400 text-sm">{translations["Product"]}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {selectedGroup.map((group, index) => (
                                    <tr
                                        key={group.id || index}
                                        onClick={(e) => handleRowClick_Group(e, group.id)}
                                        className="clickable border-b hover:bg-gray-700 hover:bg-opacity-30 transition-colors cursor-pointer"
                                        style={{ borderColor: "#40404042" }}
                                    >
                                        <td className="py-3 px-4 text-gray-400 text-left text-custom-sm">{lang === "en" ? group.customer_group_en : group.customer_group_cn}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {/* Footer */}
                    <div className="p-2 border-t border-[#ffffff1a] flex justify-end space-x-4">
                        <button onClick={() => setShowGroups(false)} className="px-2 py-2 bg-gray-700 hover:bg-gray-600 rounded text-white transition">
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
                <div className="bg-[#19191c] rounded-xl border border-[#ffffff1a] w-[50vw] h-auto flex flex-col">
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
                    <div className="p-2 border-b flex-shrink-0" style={{ borderColor: "#404040" }}>
                        <div className="flex justify-between items-center">
                            <div className="flex items-center space-x-4">
                                <div className="relative">
                                    <input
                                        type="search"
                                        placeholder={translations["Search"]}
                                        value={searchTermVoucher}
                                        onChange={(e) => {
                                            setSearchTermVoucher(e.target.value);
                                            setCurrentPageVoucher(1);
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
                                        <th className="w-[25%] text-left py-2 px-4 text-gray-400 text-sm">{translations["Voucher No"]}</th>
                                        <th className="w-[25%] text-left py-2 px-4 text-gray-400 text-sm">{translations["Voucher Date"]}</th>
                                        <th className="w-[25%] text-left py-2 px-4 text-gray-400 text-sm">{translations["Value"]}</th>
                                        <th className="w-[25%] text-left py-2 px-4 text-gray-400 text-sm">{translations["Status"]}</th>
                                    </tr>
                                </thead>
                                {loading ? (
                                    <LoadingSpinnerTbody rowsCount={itemsPerPageVoucher} />
                                ) : (
                                    <tbody>
                                        {voucherList.map((product, index) => (
                                            <tr
                                                key={product.id || index}
                                                onClick={(e) => handleRowClick_Voucher(e, product.id)}
                                                className={`clickable border-b hover:bg-gray-700 hover:bg-opacity-30 transition-colors cursor-pointer`}
                                                style={{ borderColor: "#40404042" }}
                                            >
                                                <td className="py-3 px-4 text-gray-400 text-left text-custom-sm">{product.voucher_no}</td>
                                                <td className="py-3 px-4 text-gray-400 text-left text-custom-sm">{formatDate(product.voucher_date, lang)}</td>
                                                <td className="py-3 px-4 text-gray-400 text-left text-custom-sm">
                                                    {product.currency} {formatMoney(product.value)}
                                                </td>
                                                <td className="py-3 px-4 text-gray-400 text-left text-custom-sm">{product.status_name}</td>
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
                        <div className="flex items-center space-x-1">
                            <button onClick={() => setShowVoucher(false)} className="px-2 py-2 bg-gray-700 hover:bg-gray-600 rounded text-white transition">
                                {translations["Close"]}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    };
    if (!preorder) {
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
                                <span>{translations["Save"]}</span>
                            )}
                        </button>
                        <button onClick={handleAddItem} className="px-2 py-2 bg-cyan-600 hover:bg-cyan-700 text-[#ffffffcc] text-custom-sm rounded-lg text-sm font-medium transition-colors">
                            {translations["Add Item"]}
                        </button>
                        <button onClick={handleAddNew} className="px-2 py-2 bg-cyan-600 hover:bg-cyan-700 text-[#ffffffcc] text-custom-sm rounded-lg text-sm font-medium transition-colors">
                            {translations["Add New"]}
                        </button>
                        <button onClick={handleDelete} className="px-2 py-2 bg-red-600 hover:bg-red-700 text-[#ffffffcc] text-custom-sm rounded-lg text-sm font-medium transition-colors">
                            {translations["Delete"]}
                        </button>
                    </div>
                </div>
            </div>
            {/* Main Content - Scrollable */}
            <div className="flex flex-1 p-2 mb-[10px]" style={{ backgroundColor: "#19191c" }}>
                {/* Main Content Area - Scrollable */}
                <div className="flex-1 overflow-auto mb-[10px]">{activeTab === "information" && renderPreorderInfo()}</div>
            </div>
            {/* Image Gallery Modal */}
            {renderCustomerList()}
            {renderProductList()}
            {renderGroupList()}
            {renderVoucher()}
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

export default PreorderDetails;
