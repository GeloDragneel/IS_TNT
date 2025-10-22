import React, { useState, useEffect, useMemo, useRef } from "react";
import { productService, ApiProduct } from "@/services/productService";
import { useLanguage } from "@/context/LanguageContext";
import CustomCheckbox from "@/components/CustomCheckbox";
import { showConfirm } from "@/utils/alert";
import { showSuccessToast, showErrorToast } from "@/utils/toast";
import Pagination from "@/components/Pagination";
import ItemsPerPageSelector from "@/components/ItemsPerPageSelector";
import CopyToClipboard from "@/components/CopyToClipboard";
import { X } from "lucide-react";
import PusherEcho from "@/utils/echo";
import { DropdownData, formatMoney, OptionType } from "@/utils/globalFunction";
import ImageLightbox from "@/components/ImageLightbox"; // adjust the path
import { ExportReportSelector } from "@/utils/ExportReportSelector";
import { fetchWarehouses, fetchProductTypes, fetchProductManufaturer, fetchProductSeries, fetchProductBrand, fetchSuppliers, fetchCurrencies } from "@/utils/fetchDropdownData";

// Handle the Smooth skeleton loading
const LoadingSpinnerTbody: React.FC<{ rowsCount: number }> = ({ rowsCount }) => {
    return (
        <tbody>
            {Array.from({ length: rowsCount }).map((_, idx) => (
                <tr key={idx} className="bg-transparent-900 border-b border-gray-700">
                    <td className="text-center py-2 px-2">
                        <div className="h-6 bg-gray-700 rounded w-5 mx-auto"></div>
                    </td>
                    <td className="py-2 px-2 flex items-center space-x-3 min-w-[300px]">
                        <div className="w-10 h-10 rounded-lg bg-gray-700" />
                        <div className="flex flex-col space-y-2 py-1 flex-1">
                            <div className="h-4 bg-gray-700 rounded w-3/4"></div>
                            <div className="h-3 bg-gray-600 rounded w-1/2"></div>
                        </div>
                    </td>
                    <td className="text-center items-center py-2 px-2">
                        <div className="flex flex-col space-y-2 py-1 flex-1">
                            <div className="h-4 bg-gray-700 rounded w-16 mx-auto"></div>
                            <div className="h-4 bg-gray-700 rounded w-16 mx-auto"></div>
                        </div>
                    </td>
                    <td className="text-center py-2 px-2">
                        <div className="flex flex-col space-y-2 py-1 flex-1">
                            <div className="h-4 bg-gray-700 rounded w-16 mx-auto"></div>
                            <div className="h-4 bg-gray-700 rounded w-16 mx-auto"></div>
                        </div>
                    </td>
                    <td className="text-center py-2 px-2">
                        <div className="flex flex-col space-y-2 py-1 flex-1">
                            <div className="h-4 bg-gray-700 rounded w-16 mx-auto"></div>
                            <div className="h-4 bg-gray-700 rounded w-16 mx-auto"></div>
                        </div>
                    </td>
                    <td className="text-center py-2 px-2">
                        <div className="flex flex-col space-y-2 py-1 flex-1">
                            <div className="h-4 bg-gray-700 rounded w-16 mx-auto"></div>
                            <div className="h-4 bg-gray-700 rounded w-16 mx-auto"></div>
                        </div>
                    </td>
                    <td className="text-center py-2 px-2">
                        <div className="h-6 bg-gray-700 rounded w-20 mx-auto"></div>
                    </td>
                    <td className="text-center py-2 px-2">
                        <div className="h-4 bg-gray-700 rounded w-8 mx-auto"></div>
                    </td>
                    <td className="text-center py-2 px-2">
                        <div className="h-6 bg-gray-700 rounded w-10 mx-auto"></div>
                    </td>
                    <td className="text-center py-2 px-2">
                        <div className="h-6 bg-gray-700 rounded w-10 mx-auto"></div>
                    </td>
                </tr>
            ))}
        </tbody>
    );
};

// Helper function to get image URL - Fixed to use correct path
const getImageUrl = (image: string) => {
    if (!image) {
        return import.meta.env.VITE_BASE_URL + "/storage/products/no-image-min.jpg";
    } else {
        return import.meta.env.VITE_BASE_URL + `/storage/${image}`;
    }
};

const MemoizedPagination = React.memo(Pagination);
const MemoizedItemsPerPageSelector = React.memo(ItemsPerPageSelector);

interface ProductListProps {
    tabId: string;
    onProductSelect: (productId: number, saveType?: string) => void;
    onChangeView: (view: "list" | "details" | "archive" | "tagging") => void; // <- NEW
    onInitiateCopy: (sourceProductId: number, settings: any) => void;
    selectedProducts: number[];
    onSelectedProductsChange: (selected: number[]) => void;
    expandedRows: number[];
    onExpandedRowsChange: (expanded: number[]) => void;
}

const ProductList: React.FC<ProductListProps> = ({ tabId, onProductSelect, onChangeView, onInitiateCopy, selectedProducts, onSelectedProductsChange }) => {
    const { translations, lang } = useLanguage();
    const [products, setProducts] = useState<ApiProduct[]>([]);
    const [totalPages, setTotalPages] = useState(1);
    const [copiedId, setCopiedId] = useState<number[]>([]);
    const safeLang = lang === "cn" ? "cn" : "en";
    const pageSizeOptions = useMemo(() => [15, 20, 50, -1], []);
    const [showCopyProduct, setShowCopyProduct] = useState(false);
    const [showTagging, setShowTagging] = useState(false);
    const throttleTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
    const [images, setImages] = useState([]);
    const [isLightboxOpen, setIsLightboxOpen] = useState(false);

    // Raw data from API (language-independent)
    const [productTypesData, setProductTypesData] = useState<DropdownData[]>([]);
    const [manufacturersData, setManufacturersData] = useState<DropdownData[]>([]);
    const [seriesData, setSeriesData] = useState<DropdownData[]>([]);
    const [brandsData, setBrandsData] = useState<DropdownData[]>([]);
    const [suppliersData, setSuppliersData] = useState<DropdownData[]>([]);
    const [currenciesData, setCurrenciesData] = useState<DropdownData[]>([]);
    const [warehousesData, setWarehousesData] = useState<DropdownData[]>([]);

    const [fields, setFields] = useState<Record<string, boolean>>({});
    const [selectAll, setSelectAll] = useState({
        productInfo: false,
        media: false,
        price: false,
    });

    const [loading, setLoading] = useState(() => {
        const savedLoading = localStorage.getItem(`${tabId}-loading-products`);
        return savedLoading !== null ? JSON.parse(savedLoading) : true;
    });

    // Form state - Updated to handle single vs multi-select properly
    const [formData, setFormData] = useState({
        product_code: "",
        old_product_code: "",
        copy_product_code: "",
        product_title_en: "",
        product_title_cn: "",
        product_description_en: "",
        product_description_cn: "",
        is_tnt: 0,
        is_wholesale: 0,
    });

    const [currentPage, setCurrentPage] = useState(() => {
        const metaKey = `${tabId}-cached-meta-product`;
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
        const metaKey = `${tabId}-cached-meta-product`;
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
        const cached = localStorage.getItem(`${tabId}-cached-meta-product`);
        if (!cached) return "";
        try {
            const meta = JSON.parse(cached);
            return meta.search || "";
        } catch {
            return "";
        }
    });

    // REALTIME

    useEffect(() => {
        const channel = PusherEcho.channel("products-channel");
        channel.listen(".product-event", () => {
            setTimeout(() => {
                fetchProducts(currentPage, itemsPerPage, searchTerm);
            }, 500);
        });
        return () => {
            PusherEcho.leave("products-channel");
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
                loadWarehouse();
                loadProductTypes();
                loadManufacturer();
                loadSeries();
                loadBrand();
                loadSupplier();
                loadCurrencies();
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
        const productKey = `${tabId}-cached-products`;
        const metaKey = `${tabId}-cached-meta-product`;
        const mountKey = `${tabId}-mount-status-products`;

        const isFirstMount = sessionStorage.getItem(mountKey) !== "mounted";

        if (isFirstMount) {
            sessionStorage.setItem(mountKey, "mounted");
            fetchProducts(currentPage, itemsPerPage, searchTerm);
            return;
        }

        const cachedProductsRaw = localStorage.getItem(productKey);
        const cachedMetaRaw = localStorage.getItem(metaKey);

        if (!cachedProductsRaw || !cachedMetaRaw) {
            fetchProducts(currentPage, itemsPerPage, searchTerm);
            return;
        }

        try {
            const cachedMeta = JSON.parse(cachedMetaRaw);
            const cachedProducts = JSON.parse(cachedProductsRaw);

            const isCacheValid = cachedMeta.page === currentPage && cachedMeta.perPage === itemsPerPage && cachedMeta.search === searchTerm;

            if (isCacheValid) {
                setProducts(cachedProducts);
                setTotalPages(cachedMeta.totalPages);
                setLoading(false);
                localStorage.setItem(`${tabId}-loading-products`, JSON.stringify(false));
                return;
            }
        } catch (err) {
            console.warn("Failed to parse cached meta:", err);
        }

        fetchProducts(currentPage, itemsPerPage, searchTerm);
    }, [currentPage, itemsPerPage, searchTerm, tabId]);

    const fetchProducts = async (page = currentPage, perPage = itemsPerPage, search = "") => {
        try {
            // setLoading(true);
            localStorage.setItem(`${tabId}-loading-products`, JSON.stringify(true));

            const paginatedData = await productService.getAllProducts(page, perPage, search);

            setProducts(paginatedData.data);
            setTotalPages(paginatedData.last_page);

            localStorage.setItem(`${tabId}-cached-products`, JSON.stringify(paginatedData.data));
            localStorage.setItem(
                `${tabId}-cached-meta-product`,
                JSON.stringify({
                    page,
                    perPage,
                    search,
                    totalPages: paginatedData.last_page,
                    totalItems: paginatedData.total,
                })
            );
        } catch (err) {
            console.error("Error fetching products:", err);
        } finally {
            setLoading(false);
            localStorage.setItem(`${tabId}-loading-products`, JSON.stringify(false));
        }
    };

    // Filter products based on search term
    const filteredProducts = products.filter((product) => {
        const searchLower = searchTerm.toLowerCase();
        return (
            product.id?.toString().includes(searchLower) ||
            product.product_code?.toLowerCase().includes(searchLower) ||
            product.product_title_en?.toLowerCase().includes(searchLower) ||
            product.product_title_cn?.toLowerCase().includes(searchLower) ||
            product.product_status?.toLowerCase().includes(searchLower) ||
            product.rwarehouse?.toLowerCase().includes(searchLower)
        );
    });

    // Handle Status Specification
    const statusMap: Record<string, { en: string; cn: string; color: string }> = {
        "pre-order": { en: "Pre-order", cn: "预订", color: "bg-amber-600 bg-opacity-20 text-amber-400" },
        "coming soon": { en: "Coming Soon", cn: "未出货", color: "bg-yellow-500 bg-opacity-20 text-yellow-300" },
        "partial received": { en: "Partial Received", cn: "部份已到", color: "bg-yellow-500 bg-opacity-20 text-yellow-300" },
        "in-stock": { en: "In-Stock", cn: "有货", color: "bg-emerald-600 bg-opacity-20 text-emerald-400" },
        "sold out": { en: "Sold Out", cn: "已售完", color: "bg-red-600 bg-opacity-20 text-red-400" },
        "on hold": { en: "On Hold", cn: "已售完", color: "bg-gray-500 bg-opacity-20 text-gray-300" },
        "no order": { en: "No Order", cn: "无订单", color: "bg-cyan-600 bg-opacity-20 text-cyan-300" },
        scheduled: { en: "Scheduled", cn: "准备中", color: "bg-cyan-600 bg-opacity-20 text-cyan-300" },
    };
    const onClear = () => {
        setSearchTerm("");
    };

    const productStatusLocalized = (status?: string, lang: "en" | "cn" = "en") => {
        const key = status?.toLowerCase() ?? "";
        return statusMap[key]?.[lang] || status || "-";
    };

    const getStatusColor = (status?: string) => {
        const key = status?.toLowerCase() ?? "";
        return statusMap[key]?.color || "bg-cyan-600 bg-opacity-20 text-cyan-400";
    };

    const loadProductTypes = async () => {
        try {
            const list = await fetchProductTypes(); // fetches & returns
            setProductTypesData(list ?? []); // ✅ manually set state here
        } catch (err) {
            console.error("Failed to fetch loadProductTypes:", err);
        }
    };
    const loadManufacturer = async () => {
        try {
            const list = await fetchProductManufaturer(); // fetches & returns
            setManufacturersData(list ?? []); // ✅ manually set state here
        } catch (err) {
            console.error("Failed to fetch loadManufacturer:", err);
        }
    };
    const loadSeries = async () => {
        try {
            const list = await fetchProductSeries(); // fetches & returns
            setSeriesData(list ?? []); // ✅ manually set state here
        } catch (err) {
            console.error("Failed to fetch loadSeries:", err);
        }
    };
    const loadBrand = async () => {
        try {
            const list = await fetchProductBrand(); // fetches & returns
            setBrandsData(list ?? []); // ✅ manually set state here
        } catch (err) {
            console.error("Failed to fetch loadBrand:", err);
        }
    };
    const loadSupplier = async () => {
        try {
            const list = await fetchSuppliers(); // fetches & returns
            setSuppliersData(list ?? []); // ✅ manually set state here
        } catch (err) {
            console.error("Failed to fetch loadSupplier:", err);
        }
    };
    const loadCurrencies = async () => {
        try {
            const list = await fetchCurrencies(); // fetches & returns
            setCurrenciesData(list ?? []); // ✅ manually set state here
        } catch (err) {
            console.error("Failed to fetch loadCurrencies:", err);
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

    const productTypeOptions: OptionType[] = useMemo(
        () =>
            productTypesData.map((type) => ({
                value: type.value.toString(),
                value2: type.value.toString(),
                label: lang === "en" ? type.en : type.cn,
                en: type.en,
                cn: type.cn,
            })),
        [productTypesData, lang]
    );
    const manufacturerOptions: OptionType[] = useMemo(
        () =>
            manufacturersData.map((manufacturer) => ({
                value: manufacturer.value.toString(),
                value2: manufacturer.value.toString(),
                label: lang === "en" ? manufacturer.en : manufacturer.cn,
                en: manufacturer.en,
                cn: manufacturer.cn,
            })),
        [manufacturersData, lang]
    );
    const seriesOptions: OptionType[] = useMemo(
        () =>
            seriesData.map((series) => ({
                value: series.value.toString(),
                value2: series.value2.toString(),
                label: lang === "en" ? series.en : series.cn,
                en: series.en,
                cn: series.cn,
            })),
        [seriesData, lang]
    );
    const brandOptions: OptionType[] = useMemo(
        () =>
            brandsData.map((brand) => ({
                value: brand.value.toString(),
                value2: brand.value.toString(),
                label: lang === "en" ? brand.en : brand.cn,
                en: brand.en,
                cn: brand.cn,
            })),
        [brandsData, lang]
    );
    const supplierOptions: OptionType[] = useMemo(
        () =>
            suppliersData.map((supplier) => ({
                value: supplier.value.toString(),
                value2: supplier.value.toString(),
                label: lang === "en" ? supplier.en : supplier.cn,
                code: supplier.code,
                en: supplier.en,
                cn: supplier.cn,
            })),
        [suppliersData, lang]
    );
    const Supplier_currencyOptions: OptionType[] = useMemo(
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
    const ItemCost_currencyOptions: OptionType[] = useMemo(
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
    const warehouseOptions: OptionType[] = useMemo(
        () =>
            warehousesData.map((warehouse) => ({
                value: warehouse.value.toString(),
                value2: warehouse.value.toString(),
                label: lang === "en" ? warehouse.en : warehouse.cn,
                en: warehouse.en,
                cn: warehouse.cn,
            })),
        [warehousesData, lang]
    );

    // Handle select all
    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            onSelectedProductsChange(products.map((p) => p.id).filter(Boolean) as number[]);
        } else {
            onSelectedProductsChange([]);
        }
    };

    // Handle individual select
    const handleSelectProduct = (productId: number, checked: boolean) => {
        if (checked) {
            onSelectedProductsChange([...selectedProducts, productId]);
        } else {
            onSelectedProductsChange(selectedProducts.filter((id) => id !== productId));
        }
    };

    // Handle switching isToyntoys
    // Toggle "is_tnt" status for a product
    const handleToggleToyNToys = async (productId: number, currentValue: number) => {
        const newValue = currentValue === 1 ? 0 : 1;
        const confirmed = await showConfirm(translations["System Message"], `${translations["Are you sure you want to continue"]}?`, translations["Continue"], translations["Cancel"]);
        if (!confirmed) return;
        try {
            await productService.updateTntWholesale(productId, newValue, "is_tnt");
            // ✅ Update local UI state
            setProducts((prev) => prev.map((p) => (p.id === productId ? { ...p, is_tnt: newValue } : p)));
            fetchProducts(currentPage, itemsPerPage, searchTerm);
            localStorage.removeItem(`${productId}-cached-product-info`);
            showSuccessToast(translations["Record Successfully Updated"]);
        } catch (error) {
            console.error(error);
            showErrorToast(translations["Failed to save product."] || "Failed to save product.");
        }
    };

    // Handle switching isWholesale
    const handleToggleWholesale = async (productId: number, currentValue: number) => {
        const newValue = currentValue === 1 ? 0 : 1;
        const confirmed = await showConfirm(translations["System Message"], `${translations["Are you sure you want to continue"]}?`, translations["Continue"], translations["Cancel"]);
        if (!confirmed) return;
        try {
            await productService.updateTntWholesale(productId, newValue, "is_wholesale");

            // ✅ Update local UI state
            setProducts((prev) => prev.map((p) => (p.id === productId ? { ...p, is_wholesale: newValue } : p)));
            fetchProducts(currentPage, itemsPerPage, searchTerm);
            localStorage.removeItem(`${productId}-cached-product-info`);
            showSuccessToast(translations["Record Successfully Updated"]);
        } catch (error) {
            console.error(error);
            showErrorToast(translations["Failed to save product."] || "Failed to save product.");
        }
    };

    const handleDeleteSelected = async () => {
        if (selectedProducts.length === 0) {
            showErrorToast(translations["Please click checkbox to select row"]);
            return;
        }

        const confirmed = await showConfirm(translations["System Message"], translations["Are you sure you want to delete selected items?"], translations["Delete"], translations["Cancel"]);

        if (!confirmed) return;
        try {
            await productService.deleteProducts(selectedProducts, "soft");
            setProducts((prev) => prev.filter((p) => !selectedProducts.includes(p.id!)));
            onSelectedProductsChange([]);
            fetchProducts(currentPage, itemsPerPage, searchTerm);
            showSuccessToast(translations["Record has been Deleted"]);
        } catch (err) {
            showErrorToast(translations["alert_message_18"]);
            console.error("Deletion failed:", err);
        }
    };

    const handleTagging = async () => {
        if (selectedProducts.length === 0) {
            showErrorToast(translations["Please click checkbox to select row"]);
            return;
        }
        if (selectedProducts.length === 1) {
            showErrorToast(translations["Check more row"]);
            return;
        }
        setFormData({
            product_code: "",
            old_product_code: "",
            copy_product_code: "",
            product_title_en: "",
            product_title_cn: "",
            product_description_en: "",
            product_description_cn: "",
            is_tnt: 0,
            is_wholesale: 0,
        });
        setShowTagging(true);
    };

    const handleSaveTagging = async () => {
        const data = new FormData();
        // Ensure `product_title_en` exists
        const productTitleEn = formData["product_title_en"]?.toString().trim() ?? "";
        const productTitleCn = formData["product_title_cn"]?.toString().trim() ?? "";
        const productCode = formData["product_code"]?.toString().trim() ?? "";

        if (!productCode) {
            showErrorToast(translations["Product Code Empty"]);
            return;
        }
        if (!productTitleEn && safeLang === "en") {
            showErrorToast(translations["Product Title Empty"]);
            return;
        }
        if (!productTitleCn && safeLang === "cn") {
            showErrorToast(translations["Product Title Empty"]);
            return;
        }

        const countExist1 = await productService.getProductExist(productCode);
        const countExist2 = await productService.getProductExistTag(productCode);
        if (countExist1 > 0) {
            showErrorToast(translations["Product Code Exist"]);
            return;
        }
        if (countExist2 > 0) {
            showErrorToast(translations["Product Code Exist"]);
            return;
        }
        formData["old_product_code"] = productCode;
        // Fallback: if Chinese title is missing, use English
        if (!formData["product_title_cn"] && safeLang === "en") {
            formData["product_title_cn"] = productTitleEn;
        }
        if (!formData["product_title_en"] && safeLang === "cn") {
            formData["product_title_en"] = productTitleCn;
        }
        // Append all form data
        Object.keys(formData).forEach((key) => {
            let value = formData[key as keyof typeof formData];
            if (value !== null && value !== undefined) {
                if (Array.isArray(value)) {
                    value.forEach((item) => data.append(`${key}[]`, item.value));
                } else {
                    data.append(key, value.toString());
                }
            }
        });
        try {
            await productService.insertProductTag(selectedProducts, data);
            const updatedTabId = tabId.replace("product-list", "product-tagging");
            localStorage.removeItem(`${updatedTabId}-cached-products-tagging`);
            localStorage.removeItem(`${updatedTabId}-cached-meta-product-tagging`);
            showSuccessToast(translations["Record Successfully Saved"]);
            setShowTagging(false);
        } catch (error) {
            showErrorToast(translations["Failed to save product."] || "Failed to save product.");
        }
    };
    const handleRowClick = (e: React.MouseEvent, productId: number) => {
        // Prevent navigation if clicking on checkboxes or toggle switches
        const target = e.target as HTMLElement;
        if (target.closest("input") || target.closest("label") || target.closest("[data-copy-button]")) {
            return;
        }
        onProductSelect(productId, productId == 0 ? "new" : "edit");
    };

    const handleCopyProduct = async () => {
        const newProductCode = formData["copy_product_code"]?.toString().trim() ?? "";
        const sourceId = Number(copiedId?.[0] || 0);

        if (!newProductCode) {
            showErrorToast(translations["Product Code Empty"]);
            return;
        }
        if (sourceId === 0) {
            showErrorToast(translations["Invalid source product"]);
            return;
        }
        const countExist = await productService.getProductExist(newProductCode);
        if (countExist > 0) {
            showErrorToast(translations["Product Code Exist"]);
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

        const specificItem = rawDataCached?.find((item: ApiProduct) => item.id === sourceId);

        const getGenres = () => {
            return specificItem?.genres || [];
        };
        let product_type_id = productTypeOptions.find((item) => item.value === (specificItem?.product_type_id?.toString() ?? null));
        let manufacturer_id = manufacturerOptions.find((item) => item.value === (specificItem?.manufacturer_id?.toString() ?? null));
        let series_id = seriesOptions.find((item) => item.value === (specificItem?.series_id?.toString() ?? null));
        let brand_id = brandOptions.find((item) => item.value === (specificItem?.brand_id?.toString() ?? null));
        let genres_final = getGenres();
        let supplier_id = supplierOptions.find((item) => item.value === (specificItem?.supplier_id?.toString() ?? null));
        let supplier_currency = Supplier_currencyOptions.find((item) => item.value === (specificItem?.supplier_currency?.toString() ?? null));
        let rwarehouse = warehouseOptions.find((item) => item.value === (specificItem?.rwarehouse?.toString() ?? null));
        let item_cost_currency = ItemCost_currencyOptions.find((item) => item.value === (specificItem?.item_cost_currency?.toString() ?? null));
        let product_title_en = specificItem?.product_title_en?.toString();
        let product_title_cn = specificItem?.product_title_cn?.toString();
        let item_weight = specificItem?.item_weight?.toString();
        let pcs_per_carton = specificItem?.pcs_per_carton?.toString();
        let is_tnt = specificItem?.is_tnt?.toString();
        let is_wholesale = specificItem?.is_wholesale?.toString();
        let product_description_en = specificItem?.product_description_en?.toString();
        let product_description_cn = specificItem?.product_description_cn?.toString();
        let product_specs_en = specificItem?.product_specs_en?.toString();
        let product_specs_cn = specificItem?.product_specs_cn?.toString();
        let release_date = specificItem?.release_date?.toString();
        let preorder_start_date = specificItem?.preorder_start_date?.toString();
        let preorder_end_date = specificItem?.preorder_end_date?.toString();
        let offered_cost = specificItem?.offered_cost?.toString();
        let po_dateline = specificItem?.po_dateline?.toString();
        let item_cost = specificItem?.item_cost?.toString();
        let supplier_code = specificItem?.supplier_code?.toString();

        const transformedGenres =
            genres_final.map((genre) => ({
                value: (genre as any).id.toString(), // Treat genre as 'any' to avoid errors
                value2: (genre as any).id.toString(),
                label: lang === "en" ? (genre as any).genre_en : (genre as any).genre_cn,
                en: (genre as any).genre_en,
                cn: (genre as any).genre_cn,
            })) || [];

        const rawArray = {
            product_title_en: product_title_en,
            product_title_cn: product_title_cn,
            product_type_id: product_type_id,
            manufacturer_id: manufacturer_id,
            series_id: series_id,
            brand_id: brand_id,
            genres: transformedGenres,
            item_weight: item_weight,
            pcs_per_carton: pcs_per_carton,
            is_tnt: is_tnt,
            is_wholesale: is_wholesale,
            product_description_en: product_description_en,
            product_description_cn: product_description_cn,
            product_specs_en: product_specs_en,
            product_specs_cn: product_specs_cn,
            preorder_start_date: preorder_start_date,
            preorder_end_date: preorder_end_date,
            release_date: release_date,
            supplier_id: supplier_id,
            supplier_currency: supplier_currency,
            offered_cost: offered_cost,
            po_dateline: po_dateline,
            rwarehouse: rwarehouse,
            item_cost: item_cost,
            item_cost_currency: item_cost_currency,
            supplier_code: supplier_code,
        };

        const settings = {
            newProductCode,
            fields,
            selectAll,
            rawArray,
        };
        onInitiateCopy(sourceId, settings);
        setShowCopyProduct(false);
    };

    const handleFieldToggle = (field: string) => () => {
        setFields((prev) => ({ ...prev, [field]: !prev[field] }));
    };
    const handleSelectAllGroup = (group: string) => () => {
        const groupFields: Record<string, string[]> = {
            productInfo: [
                "Product Name",
                "Product Type",
                "Manufacturer",
                "Series",
                "Brand",
                "Genre",
                "Item Weight",
                "Pcs Per Carton",
                "Publish in Ecommerce site",
                "Publish in Wholesale site",
                "Description",
                "Specs",
                "Release Date",
                "Preorder Start Date",
                "Preorder End Date",
            ],
            price: ["Supplier", "Supplier Currency", "Offered Cost", "PO Dateline", "Receiving Warehouse", "Item Cost", "Product Price Setup", "Customer Retail Price Setup"],
            media: ["Product Media"],
        };

        const allChecked = groupFields[group].every((f) => fields[f]);
        const updatedFields = { ...fields };

        groupFields[group].forEach((f) => {
            updatedFields[f] = !allChecked;
        });

        setFields(updatedFields);
        setSelectAll((prev) => ({ ...prev, [group]: !allChecked }));
    };
    const handleCopy = () => {
        if (selectedProducts.length === 0) {
            showErrorToast(translations["Please click checkbox to select row"]);
            return;
        }
        if (selectedProducts.length > 1) {
            showErrorToast(translations["1 checkbox only"]);
            return;
        }
        setCopiedId(selectedProducts);
        setShowCopyProduct(true);
    };
    const handleShowImages = async (productId: number) => {
        try {
            const cacheKey = `${productId}-cached-product-images`;
            const cachedImagesRaw = localStorage.getItem(cacheKey);
            let imageArray = [];
            if (cachedImagesRaw) {
                imageArray = JSON.parse(cachedImagesRaw);
            } else {
                imageArray = await productService.getProductImages(productId);
                localStorage.setItem(cacheKey, JSON.stringify(imageArray));
            }
            setImages(imageArray);
            setIsLightboxOpen(true);
        } catch (error) {
            console.error("Failed to load product images:", error);
        }
    };
    // Image Gallery Modal
    const renderCopyPopup = () => {
        if (!showCopyProduct) return null;
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-[#19191c] rounded-xl border border-[#ffffff1a] w-[50vw] h-auto flex flex-col">
                    {/* Header */}
                    <div className="flex items-center justify-between p-3 border-b border-[#ffffff1a]">
                        <div className="flex items-center space-x-4">
                            <h2 className="text-xl font-bold text-white">{translations["Copy Settings"]}</h2>
                        </div>
                        <div className="flex items-center space-x-4">
                            <button
                                onClick={() => {
                                    setShowCopyProduct(false);
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
                            <legend className="text-white text-center px-3 py-1 border-[1px] border-[#ffffff1a] rounded-md bg-[#19191c]">{translations["Product Code"]}</legend>
                            {/* Product Code Input */}
                            <div className="col-span-6">
                                <input
                                    type="text"
                                    value={formData.copy_product_code}
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        setFormData((prev) => ({ ...prev, copy_product_code: value }));
                                    }}
                                    className="w-full p-2 rounded bg-[#1f1f23] text-white border border-[#ffffff1a] focus:outline-none focus:ring-2 focus:ring-cyan-600"
                                />
                            </div>
                        </fieldset>
                        <fieldset className="border-[1px] border-[#ffffff1a] rounded-lg p-4 space-y-4 w-full">
                            <div className="grid grid-cols-3 gap-6 w-full">
                                {/* Checkbox Group 1: Product Information */}
                                <div className="col-span-1">
                                    <div className="text-gray mb-2 flex items-center space-x-1">
                                        <CustomCheckbox checked={selectAll.productInfo} onChange={handleSelectAllGroup("productInfo")} ariaLabel="Select all products" />
                                        <span>{translations["Product Information"]}</span>
                                    </div>
                                    <div className="flex flex-col space-y-2 text-gray pl-6">
                                        {[
                                            "Product Name",
                                            "Product Type",
                                            "Manufacturer",
                                            "Series",
                                            "Brand",
                                            "Genre",
                                            "Item Weight",
                                            "Pcs Per Carton",
                                            "Publish in Ecommerce site",
                                            "Publish in Wholesale site",
                                        ].map((field) => (
                                            <label key={field} className="flex items-center space-x-1">
                                                <CustomCheckbox checked={fields[field]} onChange={handleFieldToggle(field)} />
                                                <span>{translations[field]}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                {/* Checkbox Group 2: Description & Dates */}
                                <div className="col-span-1">
                                    <div className="flex flex-col space-y-2 text-gray pl-6">
                                        {["Description", "Specs", "Release Date", "Preorder Start Date", "Preorder End Date"].map((field) => (
                                            <label key={field} className="flex items-center space-x-1">
                                                <CustomCheckbox checked={fields[field]} onChange={handleFieldToggle(field)} />
                                                <span>{translations[field]}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                {/* Checkbox Group 3: Media & Pricing */}
                                <div className="col-span-1">
                                    <div className="text-gray mb-2 flex items-center space-x-1">
                                        <CustomCheckbox checked={selectAll.media} onChange={handleSelectAllGroup("media")} />
                                        <span>{translations["Product Media"]}</span>
                                    </div>
                                    <div className="text-gray mb-2 flex items-center space-x-1">
                                        <CustomCheckbox checked={selectAll.price} onChange={handleSelectAllGroup("price")} />
                                        <span>{translations["Product Price"]}</span>
                                    </div>
                                    <div className="flex flex-col space-y-2 text-gray pl-6">
                                        {["Supplier", "Supplier Currency", "Offered Cost", "PO Dateline", "Receiving Warehouse", "Item Cost", "Product Price Setup", "Customer Retail Price Setup"].map(
                                            (field) => (
                                                <label key={field} className="flex items-center space-x-1">
                                                    <CustomCheckbox checked={fields[field]} onChange={handleFieldToggle(field)} />
                                                    <span>{translations[field]}</span>
                                                </label>
                                            )
                                        )}
                                    </div>
                                </div>
                            </div>
                        </fieldset>
                    </div>
                    {/* Footer */}
                    <div className="p-3 border-t border-[#ffffff1a] flex justify-end space-x-1">
                        <button onClick={() => setShowCopyProduct(false)} className="px-2 py-2 bg-gray-700 hover:bg-gray-600 rounded text-white transition">
                            {translations["Close"]}
                        </button>
                        <button onClick={() => handleCopyProduct()} className="px-2 py-2 bg-cyan-600 hover:bg-cyan-500 rounded text-white transition">
                            {translations["Save"]}
                        </button>
                    </div>
                </div>
            </div>
        );
    };
    // Image Gallery Modal
    const renderTagging = () => {
        if (!showTagging) return null;
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-[#19191c] rounded-xl border border-[#ffffff1a] w-[30vw] h-auto flex flex-col">
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-[#ffffff1a]">
                        <div className="flex items-center space-x-4">
                            <h2 className="text-xl font-bold text-white">{translations["Tagging"]}</h2>
                        </div>
                        <div className="flex items-center space-x-4">
                            <button
                                onClick={() => {
                                    setShowTagging(false);
                                }}
                                className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                            >
                                <X className="h-6 w-6 text-white" />
                            </button>
                        </div>
                    </div>
                    {/* Content */}
                    <div className="flex-1 overflow-auto p-6">
                        <fieldset className="border-[1px] border-[#ffffff1a] rounded-lg p-4 space-y-4 mb-2">
                            <div className="grid grid-cols-1 gap-6">
                                <div className="flex items-center space-x-4">
                                    <label className="w-32 text-gray-400 text-sm">{translations["Product Code"]}</label>
                                    <input
                                        type="text"
                                        value={formData.product_code}
                                        onChange={(e) => {
                                            const value = e.target.value;
                                            setFormData((prev) => ({ ...prev, product_code: value }));
                                        }}
                                        className="flex-1 px-3 py-2 border-[1px] border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm"
                                    />
                                    <input
                                        type="hidden"
                                        value={formData.product_code}
                                        onChange={(e) => {
                                            const value = e.target.value;
                                            setFormData((prev) => ({ ...prev, product_code: value }));
                                        }}
                                        className="flex-1 px-3 py-2 border-[1px] border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm"
                                    />
                                </div>
                                <div className="flex items-center space-x-4">
                                    <label className="w-32 text-gray-400 text-sm">{translations["Product Name"]}</label>
                                    <input
                                        type="text"
                                        hidden={lang === "cn"}
                                        value={formData.product_title_en}
                                        onChange={(e) => {
                                            const value = e.target.value;
                                            setFormData((prev) => ({ ...prev, product_title_en: value }));
                                        }}
                                        className="flex-1 px-3 py-2 border-[1px] border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm"
                                    />
                                    <input
                                        type="text"
                                        hidden={lang === "en"}
                                        value={formData.product_title_cn}
                                        onChange={(e) => {
                                            const value = e.target.value;
                                            setFormData((prev) => ({ ...prev, product_title_cn: value }));
                                        }}
                                        className="flex-1 px-3 py-2 border-[1px] border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm"
                                    />
                                </div>
                                <div className="flex items-center space-x-4">
                                    <label className="w-32 text-gray-400 text-sm">
                                        <span className="text-[#ffffffcc] text-custom-sm font-medium">{translations["Publish"]} </span>
                                        <span className={`text-sm ml-2 ${Number(formData?.is_tnt) === 1 ? "text-green-400" : "text-red-400"}`}>
                                            {Number(formData?.is_tnt) === 1 ? translations["Active"] : translations["In-Active"]}
                                        </span>
                                    </label>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={Number(formData.is_tnt) === 1}
                                            onChange={(e) => {
                                                const isChecked = e.target.checked ? 1 : 0;
                                                setFormData({ ...formData, is_tnt: isChecked });
                                            }}
                                            className="sr-only peer"
                                        />
                                        <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:bg-green-600 transition-colors duration-200"></div>
                                        <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform duration-200 transform peer-checked:translate-x-full"></div>
                                    </label>
                                </div>
                            </div>
                        </fieldset>
                    </div>
                    {/* Footer */}
                    <div className="p-2 border-t border-[#ffffff1a] flex justify-end space-x-1">
                        <button onClick={() => setShowTagging(false)} className="px-2 py-2 bg-gray-700 hover:bg-gray-600 rounded text-white transition">
                            {translations["Close"]}
                        </button>
                        <button onClick={() => handleSaveTagging()} className="px-2 py-2 bg-cyan-600 hover:bg-cyan-500 rounded text-white transition">
                            {translations["Save"]}
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
                                className="ml-2 px-3 py-2 border rounded-lg text-white transition-colors flex items-center space-x-px hover:bg-cyan-600 text-sm"
                                style={{ backgroundColor: "#0891b2", borderColor: "#2d2d30", marginLeft: "5px" }}
                            >
                                <span>{translations["Product List"]}</span>
                            </button>
                            <button
                                onClick={() => onChangeView("tagging")}
                                className="ml-2 px-3 py-2 border rounded-lg text-white transition-colors flex items-center space-x-px hover:bg-gray-600 text-sm"
                                style={{ backgroundColor: "#2d2d30", borderColor: "#2d2d30", marginLeft: "5px" }}
                            >
                                <span>{translations["Tagging List"]}</span>
                            </button>
                            <button
                                onClick={() => onChangeView("archive")}
                                className="ml-2 px-3 py-2 border rounded-lg text-white transition-colors flex items-center space-x-px hover:bg-gray-600 text-sm"
                                style={{ backgroundColor: "#2d2d30", borderColor: "#2d2d30", marginLeft: "5px" }}
                            >
                                <span>{translations["Archive"]}</span>
                            </button>
                            <button
                                onClick={() => onClear()}
                                className="ml-2 px-3 py-2 border rounded-lg text-white transition-colors flex items-center space-x-px hover:bg-gray-600 text-sm"
                                style={{ backgroundColor: "#2d2d30", borderColor: "#2d2d30", marginLeft: "5px" }}
                            >
                                <span>{translations["Reset"]}</span>
                            </button>
                            <button
                                className="hidden ml-2 px-3 py-2 border rounded-lg text-white transition-colors flex items-center space-x-px hover:bg-gray-600 text-sm"
                                style={{ backgroundColor: "#2d2d30", borderColor: "#2d2d30", marginLeft: "5px" }}
                            >
                                <span>{translations["Advance Search"]}</span>
                            </button>
                        </div>
                        <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-1">
                                <button
                                    disabled={selectedProducts.length === 0}
                                    onClick={handleTagging}
                                    className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors flex items-center space-x-1 text-sm"
                                >
                                    <span>{translations["Tagging"]}</span>
                                </button>
                                <button
                                    onClick={(e) => handleRowClick(e, 0)}
                                    className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors flex items-center space-x-1 text-sm"
                                >
                                    <span>{translations["Add New"]}</span>
                                </button>
                                <button
                                    disabled={selectedProducts.length === 0}
                                    onClick={handleCopy}
                                    className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors flex items-center space-x-1 text-sm"
                                >
                                    <span>{translations["Copy"]}</span>
                                </button>
                                <button
                                    disabled={selectedProducts.length === 0}
                                    onClick={handleDeleteSelected}
                                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center space-x-1 text-sm"
                                >
                                    <span>{translations["Delete"]}</span>
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
                                    <th className="w-[2%] text-left py-1 px-4 text-gray-400 text-sm w-12">
                                        <CustomCheckbox
                                            checked={selectedProducts.length === products.length && products.length > 0}
                                            onChange={(checked) => handleSelectAll(checked)}
                                            ariaLabel="Select all products"
                                        />
                                    </th>
                                    <th className="w-[28%] text-left py-2 px-4 text-gray-400 text-sm">{translations["Product"]}</th>
                                    <th className="w-[10%] text-left py-2 px-4 text-gray-400 text-sm text-center">{translations["Retail Price"]}</th>
                                    <th className="w-[10%] text-left py-2 px-4 text-gray-400 text-sm text-center">{translations["Preorder Price"]}</th>
                                    <th className="w-[10%] text-left py-2 px-4 text-gray-400 text-sm text-center">{translations["Deposit"]}</th>
                                    <th className="w-[10%] text-left py-2 px-4 text-gray-400 text-sm text-center">{translations["Item Cost"]}</th>
                                    <th className="w-[9%] text-left py-2 px-4 text-gray-400 text-sm text-center">{translations["Status"]}</th>
                                    <th className="w-[7%] text-left py-2 px-4 text-gray-400 text-sm text-center">{translations["Qty"]}</th>
                                    <th className="w-[7%] text-left py-2 px-4 text-gray-400 text-sm text-center">{translations["ToyNToys"]}</th>
                                    <th className="w-[7%] text-left py-2 px-4 text-gray-400 text-sm text-center">{translations["Wholesale"]}</th>
                                </tr>
                            </thead>
                            {loading ? (
                                <LoadingSpinnerTbody rowsCount={itemsPerPage} />
                            ) : (
                                <tbody>
                                    {filteredProducts.map((product, index) => (
                                        <tr
                                            key={product.id || index}
                                            onClick={(e) => handleRowClick(e, product.id)}
                                            className={`clickable border-b hover:bg-gray-700 hover:bg-opacity-30 transition-colors cursor-pointer ${
                                                selectedProducts.includes(product.id as number) ? "bg-gray-700 bg-opacity-30" : ""
                                            }`}
                                            style={{ borderColor: "#40404042" }}
                                        >
                                            <td className="py-2 px-2 text-center" onClick={(e) => e.stopPropagation()}>
                                                <div className="flex justify-center items-center">
                                                    <CustomCheckbox
                                                        checked={selectedProducts.includes(product.id as number)}
                                                        onChange={(checked) => handleSelectProduct(product.id as number, checked)}
                                                        ariaLabel={`Select product ${product.product_code}`}
                                                    />
                                                </div>
                                            </td>
                                            <td className="py-2 px-2">
                                                <div className="flex items-center space-x-3">
                                                    <div
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleShowImages(product.id);
                                                        }}
                                                        className="w-10 h-10 bg-gray-600 rounded-lg flex items-center justify-center"
                                                    >
                                                        <img
                                                            src={getImageUrl(product.product_thumbnail)}
                                                            alt="Thumbnail"
                                                            className="w-full h-full object-cover"
                                                            onError={(e) => {
                                                                (e.target as HTMLImageElement).src = `${import.meta.env.VITE_BASE_URL}/storage/products/no-image-min.jpg`;
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
                                            <td className="py-2 px-2 text-gray-400 text-center text-custom-sm">
                                                {product.price_currency}
                                                <br />
                                                {formatMoney(product.retail_price)}
                                            </td>
                                            <td className="py-2 px-2 text-gray-400 text-center text-custom-sm">
                                                {product.price_currency}
                                                <br />
                                                {formatMoney(product.retail_price)}
                                            </td>
                                            <td className="py-2 px-2 text-gray-400 text-center text-custom-sm">
                                                {product.price_currency}
                                                <br />
                                                {formatMoney(product.preorder_price)}
                                            </td>
                                            <td className="py-2 px-2 text-gray-400 text-center text-custom-sm">
                                                {product.item_cost_currency}
                                                <br />
                                                {formatMoney(product.item_cost)}
                                            </td>
                                            <td className="py-2 px-2 text-center">
                                                <span className={`px-2 py-1 rounded-full text-xs text-custom-sm ${getStatusColor(product.product_status)}`}>
                                                    {productStatusLocalized(product.product_status, safeLang)}
                                                </span>
                                            </td>
                                            <td className="py-2 px-2 text-gray-400 text-center text-custom-sm">
                                                {(() => {
                                                    const qty = product.available_qty ?? 0;
                                                    const isPOQty = parseInt(product.is_po_qty);
                                                    const status = product.product_status;
                                                    if (status === "Coming Soon" && isPOQty === 1) {
                                                        return `[${qty}]`;
                                                    }
                                                    return qty;
                                                })()}
                                            </td>
                                            <td className="py-2 px-2 text-center" onClick={(e) => e.stopPropagation()}>
                                                <label className="relative inline-flex items-center cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={Number(product.is_tnt) === 1}
                                                        onChange={() => handleToggleToyNToys(product.id, product.is_tnt)}
                                                        className="sr-only peer"
                                                    />
                                                    <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-cyan-500 rounded-full peer peer-checked:bg-emerald-600 transition-colors duration-200"></div>
                                                    <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform duration-200 transform peer-checked:translate-x-full"></div>
                                                </label>
                                            </td>
                                            <td className="py-2 px-2 text-center" onClick={(e) => e.stopPropagation()}>
                                                <label className="relative inline-flex items-center cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={Number(product.is_wholesale) === 1}
                                                        onChange={() => handleToggleWholesale(product.id, product.is_wholesale)}
                                                        className="sr-only peer"
                                                    />
                                                    <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-cyan-500 rounded-full peer peer-checked:bg-emerald-600 transition-colors duration-200"></div>
                                                    <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform duration-200 transform peer-checked:translate-x-full"></div>
                                                </label>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            )}
                        </table>
                    </div>
                </div>
                {/* Footer with Pagination */}
                <div className="p-2 border-t flex items-center justify-between" style={{ borderColor: "#404040" }}>
                    <div className="flex items-center space-x-2">
                        <MemoizedPagination currentPage={currentPage} totalPages={totalPages} onPageChange={(page) => setCurrentPage(page)} />
                        <MemoizedItemsPerPageSelector
                            value={itemsPerPage}
                            onChange={(val: number) => {
                                setItemsPerPage(val);
                                setCurrentPage(1);
                            }}
                            options={pageSizeOptions}
                        />
                        <ExportReportSelector formats={["odt", "ods", "xlsx"]} baseName="ProductList" ids={selectedProducts} language={lang} />
                    </div>
                    <div className="flex items-center space-x-1">{/* Optional right side content */}</div>
                </div>
                {renderCopyPopup()}
                {renderTagging()}
                {isLightboxOpen && <ImageLightbox images={images} onClose={() => setIsLightboxOpen(false)} />}
            </div>
        </div>
    );
};

export default ProductList;
