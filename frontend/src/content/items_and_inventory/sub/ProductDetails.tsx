import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { productService, ApiProduct, ProductImage, ProductPricing, Profitability } from "@/services/productService";
import {
    fetchProductTypes,
    fetchProductManufaturer,
    fetchProductBrand,
    fetchProductSeries,
    fetchProductGenre,
    fetchSuppliers,
    fetchCustomerGroups,
    fetchCurrencies,
    fetchWarehouses,
    productTypesKey,
    productManufacturerKey,
    productBrandKey,
    productSeriesKey,
    productGenreKey,
} from "@/utils/fetchDropdownData";
import { useLanguage } from "@/context/LanguageContext";
import { showConfirm } from "@/utils/alert";
import { getFlatpickrLocale, formatDateToCustom } from "@/utils/flatpickrLocale";
import { showSuccessToast, showErrorToast } from "@/utils/toast";
import Select from "react-select";
import Flatpickr from "react-flatpickr";
import RichTextEditor from "@/components/RichTextEditor";
import { useDropzone } from "react-dropzone";
import "flatpickr/dist/themes/dark.css";
import CustomCheckbox from "@/components/CustomCheckbox";
import { ArrowLeft, X, Upload, Trash2, Images, GripVertical, Move, Plus } from "lucide-react";
import Pagination from "@/components/Pagination";
import CopyToClipboard from "@/components/CopyToClipboard";
import { productStatusLocalized, getStatusColor } from "@/utils/statusUtils";
import {
    OptionType,
    ImageItem,
    DropdownData,
    CustomOptionProps,
    FormDataDropdown,
    getImageUrl,
    getProfitColor,
    convertToSingleOption,
    convertToMultipleOptions,
    parseDate,
    formatDate,
    selectStyles,
    isValidOption,
    isValidOptionMult,
    baseCurrency,
} from "@/utils/globalFunction";

const MemoizedPagination = React.memo(Pagination);

interface ProductDetailsProps {
    productId: number;
    saveType: string; // or a more specific union type like 'new' | 'edit'
    onBack: () => void;
    onSave: () => void;
    onChangeProductId: (newId: number) => void;
    onChangeSaveType: (type: string) => void;
    tabId: string;
    copySettings?: any;
}

const defaultProduct: ApiProduct = {
    id: 0,
    product_code: "",
    old_product_code: "",
    product_title_en: "",
    product_title_cn: "",
    product_description_en: "",
    product_description_cn: "",
    product_specs_en: "",
    product_specs_cn: "",
    product_status: "no order",
    is_tnt: 0,
    is_wholesale: 0,
    is_active_banner: 0,
    images: [],
    supplier: { supplier_code: "" },
    genres: [],
};

const ProductDetails: React.FC<ProductDetailsProps> = ({ productId, saveType, onBack, onSave, onChangeProductId, onChangeSaveType, tabId, copySettings }) => {
    const { translations, lang } = useLanguage();
    const locale = getFlatpickrLocale(translations);
    const [product, setProduct] = useState<ApiProduct | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState("information");
    const [activeDescriptionTab, setActiveDescriptionTab] = useState("description");
    const [activePricingTab, setActivePricingTab] = useState("wholesale");
    const [popupDropdownTitle, setPopupDropdownTitle] = useState("");
    const [showImageGallery, setShowImageGallery] = useState(false);
    const [showCopyProduct, setShowCopyProduct] = useState(false);
    const [showPopupDropdown, setShowPopupDropdown] = useState(false);
    const [selectedImages, setSelectedImages] = useState<string[]>([]);
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
    const [isDirty, setIsDirty] = useState(false);
    const isDirtyRef = useRef(isDirty);
    const [showUnsavedChanges, setShowUnsavedChanges] = useState(false);
    const [isInitialized, setIsInitialized] = useState(false);
    const initialFormData = React.useRef<any>(null);
    const initialImages = React.useRef<any>(null);
    const [loadingSave, setLoadingSave] = useState(false);

    // Raw data from API (language-independent)
    const [productTypesData, setProductTypesData] = useState<DropdownData[]>([]);
    const [manufacturersData, setManufacturersData] = useState<DropdownData[]>([]);
    const [seriesData, setSeriesData] = useState<DropdownData[]>([]);
    const [genresData, setGenresData] = useState<DropdownData[]>([]);
    const [brandsData, setBrandsData] = useState<DropdownData[]>([]);
    const [suppliersData, setSuppliersData] = useState<DropdownData[]>([]);
    const [customerGroupsData, setCustomerGroupsData] = useState<DropdownData[]>([]);
    const [currenciesData, setCurrenciesData] = useState<DropdownData[]>([]);
    const [warehousesData, setWarehousesData] = useState<DropdownData[]>([]);

    // Add wholesale pricing state
    const [profitabilityOrder, setProfitabilityByOrder] = useState<Profitability[]>([]);
    const [profitabilityInvoice, setProfitabilityByInvoice] = useState<Profitability[]>([]);
    const [wholesalePricing, setWholesalePricing] = useState<ProductPricing[]>([]);
    const [retailPricing, setRetailPricing] = useState<ProductPricing[]>([]);
    const [copiedProductId, setCopiedProductId] = useState<number | null>(null);

    const [selectedDropdownId, setSelectedDropdownId] = useState<number | string | null>(null);
    const [selectedDropdownManuId, setSelectDropdownManuId] = useState<number | string | null>(null);

    const [paginationInvoice, setPaginationInvoice] = useState({
        current_page: 1,
        per_page: 10,
        total: 0,
        last_page: 1,
        list: "invoice",
    });

    const [paginationOrder, setPaginationOrder] = useState({
        current_page: 1,
        per_page: 10,
        total: 0,
        last_page: 1,
        list: "orders",
    });

    const [fields, setFields] = useState<Record<string, boolean>>({});
    const [selectAll, setSelectAll] = useState({
        productInfo: false,
        media: false,
        price: false,
    });

    const [currentPage_Invoice, setCurrentPage_Invoice] = useState(() => {
        const metaKey = `${tabId}-${productId}-cached-invoice`;
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
    const [currentPage_Order, setCurrentPage_Order] = useState(() => {
        const metaKey = `${tabId}-${productId}-cached-order`;
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
    const handleOfferedCostBlur = async () => {
        const supplierCost = formData.offered_cost || 0;
        const supCurrency = formData.supplier_currency?.value || null;
        let itemCost = 0;
        const conversionKey = supCurrency + baseCurrency();

        if (!supCurrency) {
            showErrorToast(translations["Supplier Currency is required"]);
            return;
        }

        if (supCurrency === baseCurrency()) {
            itemCost = supplierCost;
        } else {
            const exRate = await productService.getCurrentDateExRate(supCurrency, baseCurrency());
            if (parseFloat(exRate.toString()) === 0) {
                showErrorToast(translations["Exchange Rate is Required"]);
                return;
            }
            const operator = await productService.getOperator(conversionKey);
            itemCost = operator === "Divide" ? parseFloat((supplierCost / exRate).toFixed(2)) : parseFloat((supplierCost * exRate).toFixed(2));
        }
        setFormData((prev) => ({
            ...prev,
            item_cost: itemCost,
        }));
    };

    // Computed options based on current language
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

    const genreOptions: OptionType[] = useMemo(
        () =>
            genresData.map((genre) => ({
                value: genre.value.toString(),
                value2: genre.value.toString(),
                label: lang === "en" ? genre.en : genre.cn,
                en: genre.en,
                cn: genre.cn,
            })),
        [genresData, lang]
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

    const customerGroupOptions: OptionType[] = useMemo(
        () =>
            customerGroupsData.map((group) => ({
                value: group.value.toString(),
                value2: group.value.toString(),
                label: lang === "en" ? group.en : group.cn,
                en: group.en,
                cn: group.cn,
            })),
        [customerGroupsData, lang]
    );
    const Wholesale_customerGroupOptions: OptionType[] = useMemo(
        () =>
            customerGroupsData.map((group) => ({
                value: group.value.toString(),
                value2: group.value.toString(),
                label: lang === "en" ? group.en : group.cn,
                en: group.en,
                cn: group.cn,
            })),
        [customerGroupsData, lang]
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
    const Shipping_currencyOptions: OptionType[] = useMemo(
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

    // Static options for Pcs/Carton
    const unitOptions: OptionType[] = [
        { value: "1", label: "Pcs", en: "Pcs", cn: "Pcs", value2: "" },
        { value: "2", label: "Carton", en: "Carton", cn: "Carton", value2: "" },
    ];
    const safeLang = lang === "cn" ? "cn" : "en";

    // Image states - Updated to use ImageItem interface
    const [thumbnailImage, setThumbnailImage] = useState<ImageItem | null>(null);
    const [displayImage, setDisplayImage] = useState<ImageItem | null>(null);
    const [bannerImage, setBannerImage] = useState<ImageItem | null>(null);
    const [slideImages, setSlideImages] = useState<ImageItem[]>([]);

    // Form state - Updated to handle single vs multi-select properly
    const [formData, setFormData] = useState({
        product_code: "",
        old_product_code: "",
        copy_product_code: "",
        product_title_en: "",
        product_title_cn: "",
        product_description_en: "",
        product_description_cn: "",
        product_specs_en: "",
        product_specs_cn: "",
        supplier_currency: null as OptionType | null,
        item_cost_currency: null as OptionType | null,
        shipping_currency: null as OptionType | null,
        shipping_cost: 0,
        offered_cost: 0,
        item_cost: 0,
        pcs_or_crtn: 0,
        is_tnt: 0,
        is_wholesale: 0,
        is_active_banner: 0,
        is_copy_productInfo: false,
        is_new_product_id: 0,
        is_copy_price_rc: false,
        is_copy_price_wc: false,
        is_copy_price: false,
        is_copy_media: false,
        is_copy_data: false,
        rwarehouse: null as OptionType | null,
        supplier_code: "",
        barcode: "",
        pcs_per_carton: 0,
        item_weight: "",
        inventry_qty: 0,
        last_sold_date: "",
        last_received_date: "",
        cost_update_date: "",
        // Single select fields (OptionType | null)
        product_type_id: null as OptionType | null,
        manufacturer_id: null as OptionType | null,
        series_id: null as OptionType | null,
        brand_id: null as OptionType | null,
        supplier_id: null as OptionType | null,
        customer_group_id: null as OptionType | null,
        currency_id: null as OptionType | null,
        warehouse_id: null as OptionType | null,
        // Multi-select field (OptionType[])
        genres: [] as OptionType[],
        // Fixed date initialization to prevent Flatpickr issues
        preorder_start_date: null as Date | null,
        preorder_end_date: null as Date | null,
        po_dateline: null as Date | null,
        preorder_dateline: null as Date | null,
        release_date: null as Date | null,
        created_date: null as Date | null,
        deposit: 0,
        price_a: 0,
        unit_a: "",
        price_b: 0,
        unit_b: "",
        price_c: 0,
        unit_c: "",

        // Fields for pricing form
        currency: "",
        profit_prcnt_a: 0,
        profit_prcnt_b: 0,
        profit_prcnt_c: 0,
        price_a_pcs_crtn: 0,
        price_b_pcs_crtn: 0,
        price_c_pcs_crtn: 0,
        price_b_to_pcs_crtn: 0,
        price_c_to_pcs_crtn: 0,
        retail_customer_group_id: null as OptionType | null,
        retail_currency: "",
        retail_price: 0,
        retail_preorder_price: 0,
        retail_deposit: 0,
        retail_profit_prcnt_a: 0,
        is_import: 0,
    });

    // Form state - Updated to handle single vs multi-select properly
    const [formData_Dropdown, setFormData_Dropdown] = useState<FormDataDropdown>({
        value: null,
        value2: null,
        type: "",
        en: "",
        cn: "",
    });

    const productInfoKey = `${productId}-cached-product-info`;
    const productImagesKey = `${productId}-cached-product-images`;
    const productWholesaleKey = `${productId}-cached-product-whprices`;
    const productRetailKey = `${productId}-cached-product-rprices`;

    // Convert API images to ImageItem format
    const convertApiImageToImageItem = (apiImage: ProductImage): ImageItem => {
        return {
            type: apiImage.type,
            id: `api-${apiImage.id}`,
            isNew: false,
            isDeleted: false,
            apiId: apiImage.id,
            path: apiImage.path,
            rank: parseInt(apiImage.rank),
            index: apiImage.type === "slide" ? parseInt(apiImage.rank) - 1 : 0,
        };
    };

    // Dropzone configurations
    const thumbnailDropzone = useDropzone({
        accept: { "image/*": [".jpeg", ".jpg", ".png", ".gif", ".webp"] },
        multiple: false,
        onDrop: (acceptedFiles) => {
            if (acceptedFiles.length > 0) {
                const newImage: ImageItem = {
                    file: acceptedFiles[0],
                    type: "thumbnail",
                    id: `new-thumbnail-${Date.now()}`,
                    isNew: true,
                    isDeleted: false,
                    rank: 1,
                };
                setThumbnailImage(newImage);
                setIsDirty(true);
            }
        },
    });

    const displayDropzone = useDropzone({
        accept: { "image/*": [".jpeg", ".jpg", ".png", ".gif", ".webp"] },
        multiple: false,
        onDrop: (acceptedFiles) => {
            if (acceptedFiles.length > 0) {
                const newImage: ImageItem = {
                    file: acceptedFiles[0],
                    type: "display",
                    id: `new-display-${Date.now()}`,
                    isNew: true,
                    isDeleted: false,
                    rank: 1,
                };
                setDisplayImage(newImage);
                setIsDirty(true);
            }
        },
    });

    const bannerDropzone = useDropzone({
        accept: { "image/*": [".jpeg", ".jpg", ".png", ".gif", ".webp"] },
        multiple: false,
        onDrop: (acceptedFiles) => {
            if (acceptedFiles.length > 0) {
                const newImage: ImageItem = {
                    file: acceptedFiles[0],
                    type: "banner",
                    id: `new-banner-${Date.now()}`,
                    isNew: true,
                    isDeleted: false,
                    rank: 1,
                };
                setBannerImage(newImage);
                setIsDirty(true);
            }
        },
    });

    const slidesDropzone = useDropzone({
        accept: { "image/*": [".jpeg", ".jpg", ".png", ".gif", ".webp"] },
        multiple: true,
        onDrop: (acceptedFiles) => {
            const newSlides = acceptedFiles.map((file, index) => ({
                file,
                type: "slide" as const,
                id: `new-slide-${Date.now()}-${index}`,
                isNew: true,
                isDeleted: false,
                rank: 0, // Rank will be updated below
                index: 0,
            }));

            setSlideImages((prev) => {
                const visibleImages = prev.filter((img) => !img.isDeleted);
                const deletedImages = prev.filter((img) => img.isDeleted);
                const combined = [...visibleImages, ...newSlides].slice(0, 50);
                const updatedRank = combined.map((img, index) => ({
                    ...img,
                    rank: index + 1,
                    index,
                }));
                return [...updatedRank, ...deletedImages];
            });
            setIsDirty(true);
        },
    });

    // Keep ref updated
    useEffect(() => {
        isDirtyRef.current = isDirty;
    }, [isDirty]);

    useEffect(() => {
        handlePcsPerCartonSettings("PriceA", formData.price_a_pcs_crtn);
    }, [formData.pcs_or_crtn]);

    useEffect(() => {
        const fetchAllProductData = () => {
            fetchProductDetails();
            fetchProductImages();
            fetchWholesalePricing();
            fetchRetailPricing();
        };

        const fetchDropdownData = async () => {
            loadProductTypes();
            loadManufacturer();
            loadSeries();
            loadGenre();
            loadBrand();
            loadSupplier();
            loadCustomerGroup();
            loadCurrencies();
            loadWarehouse();
        };

        fetchDropdownData();

        if (saveType === "new") {
            setLoading(true);
            clearForms();
            setProduct(defaultProduct);
            setThumbnailImage(null);
            setDisplayImage(null);
            setBannerImage(null);
            setSlideImages([]);
            setWholesalePricing([]);
            setRetailPricing([]);
            setProfitabilityByOrder([]);
            setProfitabilityByInvoice([]);
            setIsDirty(false);
            isDirtyRef.current = false;
            setIsInitialized(false);
            setLoading(false);
        } else {
            // 'edit' or 'copy'
            fetchAllProductData();
        }
    }, [productId, saveType, copiedProductId, currentPage_Invoice, currentPage_Order]);

    useEffect(() => {
        // This effect handles the copy operation when initiated from the ProductList view.
        if (saveType === "copy" && copySettings && product) {
            const { newProductCode, fields, selectAll, rawArray } = copySettings;
            processCopy(newProductCode, fields, selectAll, rawArray);
        }
    }, [copySettings, product, saveType]);

    useEffect(() => {
        if (saveType !== "new") {
            fetchProfitabilityOrder(currentPage_Order);
        }
    }, [currentPage_Order, saveType]);

    useEffect(() => {
        if (saveType !== "new") {
            fetchProfitabilityInvoice(currentPage_Invoice);
        }
    }, [currentPage_Invoice, saveType]);

    useEffect(() => {
        // Don't run if product data isn't there yet.
        if (!product) return;

        if (!isInitialized) {
            // A more robust check to see if the form is fully initialized
            const isFormReady =
                (product.product_type_id ? !!formData.product_type_id : true) &&
                (product.manufacturer_id ? !!formData.manufacturer_id : true) &&
                (product.series_id ? !!formData.series_id : true) &&
                (product.brand_id ? !!formData.brand_id : true) &&
                (product.genres && product.genres.length > 0 ? formData.genres.length > 0 : true) &&
                (product.supplier_id ? !!formData.supplier_id : true) &&
                (product.supplier_currency ? !!formData.supplier_currency : true) &&
                (product.item_cost_currency ? !!formData.item_cost_currency : true) &&
                (product.shipping_currency ? !!formData.shipping_currency : true) &&
                (product.rwarehouse ? !!formData.rwarehouse : true) &&
                (product.customer_group_id ? !!formData.customer_group_id : true);

            const areImagesReady = product.images.some((i: ProductImage) => i.type === "thumbnail") ? !!thumbnailImage : true;

            if (isFormReady && areImagesReady) {
                const timer = setTimeout(() => {
                    // Deep copy to avoid reference issues
                    const currentForm = JSON.parse(JSON.stringify(formData));
                    const currentImages = JSON.parse(
                        JSON.stringify({
                            thumbnailImage,
                            displayImage,
                            bannerImage,
                            slideImages,
                        })
                    );

                    initialFormData.current = currentForm;
                    initialImages.current = currentImages;

                    setIsInitialized(true);
                    setIsDirty(false); // Explicitly set to false after initialization
                }, 200); // Increased timeout slightly for safety

                return () => clearTimeout(timer);
            }
        } else {
            // We are initialized, so let's check for changes.
            const formChanged = JSON.stringify(formData) !== JSON.stringify(initialFormData.current);

            const currentImages = { thumbnailImage, displayImage, bannerImage, slideImages };
            const imagesChanged = JSON.stringify(currentImages) !== JSON.stringify(initialImages.current);

            if (formChanged || imagesChanged) {
                setIsDirty(true);
            } else {
                setIsDirty(false);
            }
        }
    }, [product, formData, thumbnailImage, displayImage, bannerImage, slideImages, isInitialized]);

    useEffect(() => {
        if (product && productTypeOptions.length > 0) {
            const selectedProductType = convertToSingleOption(product.product_type_id, productTypeOptions);
            setFormData((prev) => ({ ...prev, product_type_id: selectedProductType }));
        }
    }, [product, productTypeOptions, lang]);

    useEffect(() => {
        if (product && manufacturerOptions.length > 0) {
            const selectedManufacturer = convertToSingleOption(product.manufacturer_id, manufacturerOptions);
            setFormData((prev) => ({ ...prev, manufacturer_id: selectedManufacturer }));
        }
    }, [product, manufacturerOptions, lang]);

    useEffect(() => {
        if (product && seriesOptions.length > 0) {
            const selectedSeries = convertToSingleOption(product.series_id, seriesOptions);
            setFormData((prev) => ({ ...prev, series_id: selectedSeries }));
        }
    }, [product, seriesOptions, lang]);

    useEffect(() => {
        if (product && brandOptions.length > 0) {
            const selectedBrand = convertToSingleOption(product.brand_id, brandOptions);
            setFormData((prev) => ({ ...prev, brand_id: selectedBrand }));
        }
    }, [product, brandOptions, lang]);

    useEffect(() => {
        if (product && genreOptions.length > 0) {
            const selectedGenres = convertToMultipleOptions(product.genres, genreOptions);
            setFormData((prev) => ({ ...prev, genres: selectedGenres }));
        }
    }, [product, genreOptions, lang]);

    useEffect(() => {
        if (product && supplierOptions.length > 0) {
            const selectedSupplierId = convertToSingleOption(product.supplier_id, supplierOptions);
            setFormData((prev) => ({ ...prev, supplier_id: selectedSupplierId }));
        }
    }, [product, supplierOptions, lang]);

    useEffect(() => {
        if (product && Supplier_currencyOptions.length > 0) {
            const selectedSupplierCurrency = convertToSingleOption(product.supplier_currency, Supplier_currencyOptions);
            setFormData((prev) => ({ ...prev, supplier_currency: selectedSupplierCurrency }));
        }
    }, [product, Supplier_currencyOptions, lang]);

    useEffect(() => {
        if (product && ItemCost_currencyOptions.length > 0) {
            const selectedItemCostCurrency = convertToSingleOption(product.item_cost_currency, ItemCost_currencyOptions);
            setFormData((prev) => ({ ...prev, item_cost_currency: selectedItemCostCurrency }));
        }
    }, [product, ItemCost_currencyOptions, lang]);

    useEffect(() => {
        if (product && warehouseOptions.length > 0) {
            const selectedwarehouseOptions = convertToSingleOption(product.rwarehouse, warehouseOptions);
            setFormData((prev) => ({ ...prev, rwarehouse: selectedwarehouseOptions }));
        }
    }, [product, warehouseOptions, lang]);

    useEffect(() => {
        if (product && Shipping_currencyOptions.length > 0) {
            const selectedShipping_currencyOptions = convertToSingleOption(product.shipping_currency, Shipping_currencyOptions);
            setFormData((prev) => ({ ...prev, shipping_currency: selectedShipping_currencyOptions }));
        }
    }, [product, Shipping_currencyOptions, lang]);

    useEffect(() => {
        if (product && Wholesale_customerGroupOptions.length > 0) {
            const selectedOption = convertToSingleOption(product.customer_group_id, Wholesale_customerGroupOptions);
            setFormData((prev) => ({ ...prev, customer_group_id: selectedOption }));
        }
    }, [product, Wholesale_customerGroupOptions, lang]);

    useEffect(() => {
        setFormData((prev) => ({
            ...prev,
            is_copy_price: formData.is_copy_price,
            is_copy_productInfo: formData.is_copy_productInfo,
            is_copy_media: formData.is_copy_media,
            is_copy_data: formData.is_copy_data,
            is_new_product_id: formData.is_new_product_id,
        }));
    }, [formData.is_copy_price, formData.is_copy_productInfo, formData.is_copy_media, formData.is_new_product_id, formData.is_copy_data]);

    const fetchProductDetails = async () => {
        try {
            const idToUse = productId !== 0 ? productId : copiedProductId;
            if (!idToUse) {
                setLoading(false);
                return;
            }

            isDirtyRef.current = true; // 🔐 prevent dirty tracking
            setLoading(true);
            setError(null);

            const productInfoKey = `${idToUse}-cached-product-info`;
            const cachedProductsRaw = localStorage.getItem(productInfoKey);
            let foundProduct;

            if (cachedProductsRaw) {
                foundProduct = JSON.parse(cachedProductsRaw); // ✅ Parse cached JSON
            } else {
                foundProduct = await productService.getProductInfo(idToUse); // ✅ Fetch from API
            }
            if (foundProduct) {
                setProduct(foundProduct);
                setFormData((prev) => ({
                    ...prev,
                    product_code: foundProduct.product_code || "",
                    old_product_code: foundProduct.old_product_code || "",
                    product_title_en: foundProduct.product_title_en || "",
                    product_description_en: foundProduct.product_description_en || "",
                    product_description_cn: foundProduct.product_description_cn || "",
                    product_specs_en: foundProduct.product_specs_en || "",
                    product_specs_cn: foundProduct.product_specs_cn || "",
                    product_title_cn: foundProduct.product_title_cn || "",
                    last_sold_date: foundProduct.last_sold_date || "",
                    last_received_date: foundProduct.last_received_date || "",
                    is_tnt: foundProduct.is_tnt || 0,
                    is_wholesale: foundProduct.is_wholesale || 0,
                    pcs_per_carton: foundProduct.pcs_per_carton || 0,
                    is_active_banner: foundProduct.is_active_banner || 0,
                    cost_update_date: foundProduct.cost_update_date || "",
                    offered_cost: foundProduct.offered_cost || 0,
                    shipping_cost: foundProduct.shipping_cost || 0,
                    item_cost: foundProduct.item_cost || 0,
                    supplier_code: foundProduct.supplier?.supplier_code || "",
                    inventry_qty: foundProduct.inventry_qty || 0,
                    barcode: foundProduct.barcode || "",
                    item_weight: foundProduct.item_weight?.toString() || "",
                    // Parse dates safely
                    preorder_start_date: parseDate(foundProduct.preorder_start_date),
                    preorder_end_date: parseDate(foundProduct.preorder_end_date),
                    po_dateline: parseDate(foundProduct.po_dateline),
                    preorder_dateline: parseDate(foundProduct.preorder_dateline),
                    release_date: parseDate(foundProduct.release_date),
                    created_date: parseDate(foundProduct.created_date),
                }));

                // ✅ Only cache if it's a fresh fetch
                if (!cachedProductsRaw) {
                    localStorage.setItem(productInfoKey, JSON.stringify(foundProduct));
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
    const fetchProductImages = async () => {
        try {
            const idToUse = productId !== 0 ? productId : copiedProductId;
            if (!idToUse) return;

            const cacheKey = `${idToUse}-cached-product-images`;
            const cachedImagesRaw = localStorage.getItem(cacheKey);
            let images: ProductImage[];

            if (cachedImagesRaw) {
                images = JSON.parse(cachedImagesRaw);
            } else {
                images = await productService.getProductImages(idToUse);
                if (images && Array.isArray(images)) {
                    localStorage.setItem(productImagesKey, JSON.stringify(images));
                }
            }

            const sortedImages = images.sort((a, b) => parseInt(a.rank) - parseInt(b.rank));
            const thumbnail = sortedImages.find((img) => img.type === "thumbnail");
            const display = sortedImages.find((img) => img.type === "display");
            const banner = sortedImages.find((img) => img.type === "banner");
            const slides = sortedImages.filter((img) => img.type === "slide");

            if (thumbnail) setThumbnailImage(convertApiImageToImageItem(thumbnail));
            if (display) setDisplayImage(convertApiImageToImageItem(display));
            if (banner) setBannerImage(convertApiImageToImageItem(banner));
            if (slides.length > 0) {
                setSlideImages(slides.map(convertApiImageToImageItem));
            }
        } catch (error) {
            console.error("Failed to load product images:", error);
        }
    };
    const fetchWholesalePricing = async () => {
        try {
            const idToUse = productId !== 0 ? productId : copiedProductId;
            if (!idToUse) return;

            const cacheKey = `${idToUse}-cached-product-whprices`;
            const cachedProductWholesaleRaw = localStorage.getItem(cacheKey);

            let foundWHPricing;

            if (cachedProductWholesaleRaw) {
                foundWHPricing = JSON.parse(cachedProductWholesaleRaw);
            } else {
                foundWHPricing = await productService.getWholesalePricing(idToUse);
                if (foundWHPricing && Array.isArray(foundWHPricing)) {
                    localStorage.setItem(cacheKey, JSON.stringify(foundWHPricing));
                }
            }

            if (foundWHPricing) {
                setWholesalePricing(foundWHPricing);
            }
        } catch (error) {
            console.error("Failed to load wholesale pricing:", error);
        }
    };
    const fetchRetailPricing = async () => {
        try {
            const idToUse = productId !== 0 ? productId : copiedProductId;
            if (!idToUse) return;

            const cacheKey = `${idToUse}-cached-product-rprices`;
            const cachedProductRetailRaw = localStorage.getItem(cacheKey);

            let foundRPricing;

            if (cachedProductRetailRaw) {
                foundRPricing = JSON.parse(cachedProductRetailRaw);
            } else {
                foundRPricing = await productService.getRetailPricing(idToUse);
                if (foundRPricing && Array.isArray(foundRPricing)) {
                    localStorage.setItem(cacheKey, JSON.stringify(foundRPricing));
                }
            }

            if (foundRPricing) {
                setRetailPricing(foundRPricing);
            }
        } catch (error) {
            console.error("Failed to load retail pricing:", error);
        }
    };
    const fetchProfitabilityOrder = async (page = currentPage_Order) => {
        try {
            const idToUse = productId !== 0 ? productId : copiedProductId;
            if (!idToUse) return;

            const foundProfitOrder = await productService.getProfitabilityByOrders(idToUse, page);

            if (foundProfitOrder) {
                setProfitabilityByOrder(foundProfitOrder.data);
                setPaginationOrder((prev) => ({ ...prev, ...foundProfitOrder.pagination }));
            }
        } catch (error) {
            console.error("Failed to load profitability by orders:", error);
        }
    };
    const fetchProfitabilityInvoice = async (page = currentPage_Invoice) => {
        try {
            const idToUse = productId !== 0 ? productId : copiedProductId;
            if (!idToUse) return;

            const foundProfitInvoice = await productService.getProfitabilityByInvoice(idToUse, page);

            if (foundProfitInvoice) {
                setProfitabilityByInvoice(foundProfitInvoice.data);
                setPaginationInvoice((prev) => ({ ...prev, ...foundProfitInvoice.pagination }));
            }
        } catch (error) {
            console.error("Failed to load profitability by invoice:", error);
        }
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
    const loadGenre = async () => {
        try {
            const list = await fetchProductGenre(); // fetches & returns
            setGenresData(list ?? []); // ✅ manually set state here
        } catch (err) {
            console.error("Failed to fetch loadGenre:", err);
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
    const loadCustomerGroup = async () => {
        try {
            const list = await fetchCustomerGroups(); // fetches & returns
            setCustomerGroupsData(list ?? []); // ✅ manually set state here
        } catch (err) {
            console.error("Failed to fetch loadCustomerGroup:", err);
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
    const updateCachedRaw = async (cachedType: string) => {
        if (cachedType === "productInfo") {
            const newData = await productService.getProductInfo(productId);
            if (newData) {
                localStorage.setItem(productInfoKey, JSON.stringify(newData));
            }
        }
        if (cachedType === "productWholesale") {
            const newData = await productService.getWholesalePricing(productId);
            if (newData && Array.isArray(newData)) {
                localStorage.setItem(productWholesaleKey, JSON.stringify(newData));
            }
        }
        if (cachedType === "productRetail") {
            const newData = await productService.getRetailPricing(productId);
            if (newData && Array.isArray(newData)) {
                localStorage.setItem(productRetailKey, JSON.stringify(newData));
            }
        }
        if (cachedType === "productImages") {
            const newData = await productService.getProductImages(productId);
            if (newData && Array.isArray(newData)) {
                localStorage.setItem(productImagesKey, JSON.stringify(newData));
            }
        }
    };
    const handleSave = async () => {
        setLoadingSave(true); // Disable the button
        const data = new FormData();
        // Ensure `product_title_en` exists
        const productTitleEn = formData["product_title_en"]?.toString().trim() ?? "";
        const productTitleCn = formData["product_title_cn"]?.toString().trim() ?? "";
        const productCode = formData["product_code"]?.toString().trim() ?? "";
        const productCodeOld = formData["old_product_code"]?.toString().trim() ?? "";
        const rwarehouse = formData["rwarehouse"]?.toString().trim() ?? "";
        // const localProductId = (formData.is_copy_data ? 0 : productId);

        if (!productCode) {
            showErrorToast(translations["Product Code Empty"]);
            setLoadingSave(false); // Enable button again
            return;
        }
        if (!productTitleEn && safeLang === "en") {
            showErrorToast(translations["Product Title Empty"]);
            setLoadingSave(false); // Enable button again
            return;
        }
        if (!productTitleCn && safeLang === "cn") {
            showErrorToast(translations["Product Title Empty"]);
            setLoadingSave(false); // Enable button again
            return;
        }
        if (!rwarehouse) {
            showErrorToast(translations["Receiving Warehouse is required"]);
            setLoadingSave(false); // Enable button again
            return;
        }
        if (productCode != productCodeOld && productId != 0) {
            const confirmed = await showConfirm(translations["Product Code Update"], translations["Are you sure you want to Change Item Code"], translations["Delete"], translations["Cancel"]);
            if (!confirmed) {
                setLoadingSave(false); // Enable button again
                return;
            }
            if (confirmed) {
                formData["old_product_code"] = productCode;
            }
        }

        // Fallback: if Chinese title is missing, use English
        if (!formData["product_title_cn"] && safeLang === "en") {
            formData["product_title_cn"] = productTitleEn;
        }
        if (!formData["product_title_en"] && safeLang === "cn") {
            formData["product_title_en"] = productTitleCn;
        }
        if (productId === 0) {
            formData["old_product_code"] = formData["product_code"];
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

        // Append images
        const allImages = [thumbnailImage, displayImage, bannerImage, ...slideImages];
        allImages.forEach((image) => {
            if (image) {
                if (image.isNew && image.file) {
                    data.append("images[]", image.file);
                }
                data.append(
                    "image_data[]",
                    JSON.stringify({
                        id: image.apiId,
                        type: image.type,
                        rank: image.rank,
                        isDeleted: image.isDeleted,
                        isNew: image.isNew,
                    })
                );
            }
        });

        try {
            const result = await productService.updateProduct(productId, data);
            const newId = result?.id;
            if ((saveType === "new" || saveType === "copy") && newId) {
                onChangeProductId(newId);
                onChangeSaveType("edit");
                setCopiedProductId(null);
            }
            // Reset state to allow re-initialization after refetch
            setIsDirty(false);
            setIsInitialized(false);
            // Set state (this is async)
            setFormData((prev) => ({
                ...prev,
                is_copy_price: false,
                is_copy_productInfo: false,
                is_new_product_id: 0,
                is_copy_media: false,
                is_copy_data: false,
            }));

            const updatedTabId = tabId.replace("info", "list");
            localStorage.removeItem(`${updatedTabId}-cached-products`);

            await updateCachedRaw("productInfo");
            await updateCachedRaw("productImages");
            await updateCachedRaw("productWholesale");
            await updateCachedRaw("productRetail");
            showSuccessToast(translations["Product Successfully Saved"]);
            onSave(); // This will now trigger the cache clearing in the parent
        } catch (error) {
            showErrorToast(translations["Failed to save product."] || "Failed to save product.");
        } finally {
            setLoadingSave(false); // Enable button again after the operation is done
        }
    };
    const handleSaveDropdown = async () => {
        const data = new FormData();

        // Ensure dropdownValue is always a string (fallback to empty string if null)
        const dropdownValue = formData_Dropdown.value ? formData_Dropdown.value.toString().trim() : null;
        const dropdownEn = formData_Dropdown["en"]?.toString().trim() ?? "";
        const dropdownCn = formData_Dropdown["cn"]?.toString().trim() ?? "";
        const dropdownType = formData_Dropdown["type"]?.toString().trim() ?? "";
        const dropdownValue2 = formData_Dropdown["value2"]?.toString().trim() ?? null;

        if (!dropdownValue2 && dropdownType === "Series") {
            showErrorToast(translations["Please select manufacturer"]);
            return; // Stop the submission if product code is missing
        }

        // Validation based on language
        if (!dropdownEn && safeLang === "en") {
            showErrorToast(translations["Description is required"]);
            return; // Stop the submission if product code is missing
        }

        if (!dropdownCn && safeLang === "cn") {
            showErrorToast(translations["Description is required"]);
            return; // Stop the submission if product code is missing
        }

        // Append all form data
        Object.keys(formData_Dropdown).forEach((key) => {
            let value = formData_Dropdown[key as keyof typeof formData_Dropdown];
            if (value !== null && value !== undefined) {
                data.append(key, value.toString()); // Ensure the correct values are appended
            }
        });

        try {
            // Pass dropdownValue (now safely a string, not null)
            const dropdownId = await productService.updateDropdown(dropdownValue, data);
            switch (dropdownType) {
                case "ProductType":
                    localStorage.removeItem(productTypesKey);
                    await loadProductTypes();
                    handleSelectChange(dropdownId.id, "ProductType");
                    break;
                case "Brand":
                    localStorage.removeItem(productBrandKey);
                    await loadBrand();
                    break;
                case "Manufacturer":
                    localStorage.removeItem(productManufacturerKey);
                    await loadManufacturer();
                    break;
                case "Series":
                    localStorage.removeItem(productSeriesKey);
                    await loadSeries();
                    break;
                case "Genre":
                    localStorage.removeItem(productGenreKey);
                    await loadGenre();
                    break;
                default:
                    throw new Error("Unknown type for deletion");
            }
            setTimeout(() => {
                setShowUnsavedChanges(false);
            }, 3000);
            showSuccessToast(translations["Record Successfully Saved"]);
        } catch (error) {
            showErrorToast("Failed to save product.");
        }
    };

    const handlePcsPerCartonSettings = (priceType: "PriceA" | "PriceB", pcsCtnVal: number) => {
        const pcsPerCarton = formData.pcs_per_carton;
        const pcsOrCrtn = formData.pcs_or_crtn;
        let updatedData = { ...formData };
        if (priceType === "PriceA") {
            if (pcsCtnVal > 0) {
                if (pcsOrCrtn === 1) {
                    const remainder = pcsCtnVal % pcsPerCarton;
                    if (remainder === 0) {
                        if (pcsCtnVal === pcsPerCarton) {
                            updatedData = {
                                ...updatedData,
                                price_b_pcs_crtn: 0,
                                price_b_to_pcs_crtn: 0,
                                price_b: 0,
                                profit_prcnt_b: 0,
                                price_c_pcs_crtn: 0,
                                price_c_to_pcs_crtn: 0,
                                price_c: 0,
                                profit_prcnt_c: 0,
                            };
                        } else {
                            const priceBToPcsCtn = pcsOrCrtn === 1 ? pcsCtnVal - pcsPerCarton : pcsCtnVal - 1;

                            updatedData = {
                                ...updatedData,
                                price_b_pcs_crtn: pcsPerCarton,
                                price_b_to_pcs_crtn: pcsCtnVal === 0 ? 0 : priceBToPcsCtn,
                                price_c: 0,
                                profit_prcnt_c: 0,
                                price_c_pcs_crtn: 0,
                                price_c_to_pcs_crtn: 0,
                            };
                        }
                    } else {
                        showErrorToast(translations["Invalid Value, Per Carton is"] + " " + pcsPerCarton);
                        updatedData = {
                            ...updatedData,
                            price_a_pcs_crtn: 0,
                            price_b_to_pcs_crtn: 0,
                            price_b_pcs_crtn: 0,
                            price_c_to_pcs_crtn: 0,
                            price_c_pcs_crtn: 0,
                        };
                    }
                } else {
                    updatedData = {
                        ...updatedData,
                        price_b_pcs_crtn: 1,
                        price_b_to_pcs_crtn: pcsCtnVal - 1,
                        price_c_pcs_crtn: 0,
                    };
                }
            } else {
                updatedData = {
                    ...updatedData,
                    price_a_pcs_crtn: 0,
                    price_b_to_pcs_crtn: 0,
                    price_b_pcs_crtn: 0,
                    price_c_to_pcs_crtn: 0,
                    price_c_pcs_crtn: 0,
                };
            }
        }

        if (priceType === "PriceB") {
            const remainder = pcsCtnVal % pcsPerCarton;
            const isDivisible = remainder === 0;

            if (pcsCtnVal > 0) {
                if (pcsOrCrtn === 1) {
                    if (isDivisible) {
                        const priceCToPcsCtn = pcsOrCrtn === 1 ? pcsCtnVal - pcsPerCarton : pcsCtnVal - 1;

                        updatedData.price_c_to_pcs_crtn = pcsCtnVal === 0 ? 0 : priceCToPcsCtn;

                        if (pcsCtnVal > pcsPerCarton) {
                            updatedData.price_c_pcs_crtn = pcsOrCrtn === 1 ? pcsPerCarton : 1;
                        } else {
                            if (formData.price_a_pcs_crtn === pcsPerCarton) {
                                const priceBToPcs = pcsPerCarton - formData.price_b_pcs_crtn;
                                updatedData.price_b_to_pcs_crtn = priceBToPcs;

                                if (formData.price_b_pcs_crtn % 2 === 0) {
                                    const half = formData.price_b_pcs_crtn / 2;
                                    updatedData.price_c_pcs_crtn = half;
                                    updatedData.price_c_to_pcs_crtn = half;
                                } else {
                                    const third = formData.price_b_pcs_crtn / 3;
                                    updatedData.price_c_pcs_crtn = third;
                                    updatedData.price_c_to_pcs_crtn = third;
                                }
                            } else {
                                updatedData.price_c_pcs_crtn = 0;
                                updatedData.price_c_to_pcs_crtn = 0;
                            }
                        }
                    } else {
                        showErrorToast(translations["Invalid Value, Per Carton is"] + " " + pcsPerCarton);
                        updatedData = {
                            ...updatedData,
                            price_c_to_pcs_crtn: 0,
                            price_b_pcs_crtn: 0,
                            price_b_to_pcs_crtn: 0,
                        };
                    }
                } else {
                    if (formData.price_b_pcs_crtn > 1) {
                        updatedData.price_c_pcs_crtn = 1;
                    } else {
                        updatedData.price_c_pcs_crtn = 0;
                    }
                    updatedData.price_c_to_pcs_crtn = pcsCtnVal - 1;
                }
            } else {
                updatedData = {
                    ...updatedData,
                    price_b_to_pcs_crtn: 0,
                    price_b_pcs_crtn: 0,
                    price_c_to_pcs_crtn: 0,
                    price_c_pcs_crtn: 0,
                };
            }
        }

        setFormData(updatedData);
    };

    const handleSavePricing = async () => {
        const type = activePricingTab;
        let data;

        if (!productId) {
            showErrorToast(translations["Save product Information before Setting Group Pricing"]);
            return;
        }

        if (type === "wholesale") {
            const wh_CustomerGroup = formData["customer_group_id"]?.toString().trim() ?? null;
            if (!wh_CustomerGroup) {
                showErrorToast(translations["Select Customer Group"]);
                return; // Stop the submission if product code is missing
            }
            data = {
                product_id: productId,
                customer_group_id: formData.customer_group_id?.value,
                type: "wholesale",
                currency: formData.currency,
                pcs_or_crtn: formData.pcs_or_crtn,
                deposit: formData.deposit,
                price_a: formData.price_a,
                price_b: formData.price_b,
                price_c: formData.price_c,
                profit_prcnt_a: formData.profit_prcnt_a,
                profit_prcnt_b: formData.profit_prcnt_b,
                profit_prcnt_c: formData.profit_prcnt_c,
                price_a_pcs_crtn: formData.price_a_pcs_crtn,
                price_b_pcs_crtn: formData.price_b_pcs_crtn,
                price_c_pcs_crtn: formData.price_c_pcs_crtn,
                price_b_to_pcs_crtn: formData.price_b_to_pcs_crtn,
                price_c_to_pcs_crtn: formData.price_c_to_pcs_crtn,
            };
        } else {
            const rc_CustomerGroup = formData["retail_customer_group_id"]?.toString().trim() ?? "";
            if (!rc_CustomerGroup) {
                showErrorToast(translations["Select Customer Group"]);
                return; // Stop the submission if product code is missing
            }
            data = {
                product_id: productId,
                customer_group_id: formData.retail_customer_group_id?.value,
                type: "retail",
                pcs_or_crtn: 1,
                currency: formData.retail_currency,
                retail_price: formData.retail_price,
                preorder_price: formData.retail_preorder_price,
                deposit: formData.retail_deposit,
                profit_prcnt_a: formData.retail_profit_prcnt_a,
            };
        }

        try {
            await productService.upsertPricing(data);
            showSuccessToast(translations["Price Successfully Saved"]);
            if (type === "wholesale") {
                await updateCachedRaw("productWholesale");
                fetchWholesalePricing();
            } else {
                await updateCachedRaw("productRetail");
                fetchRetailPricing();
            }
        } catch (error) {
            showErrorToast(translations["Failed to save pricing"] || "Failed to save pricing");
        }
    };
    const handleAddNew = async () => {
        onChangeProductId(0);
        onChangeSaveType("new");
        clearForms();
        setIsDirty(false);
        isDirtyRef.current = false;
    };
    const clearForms = () => {
        const initialFormData = {
            product_code: "",
            old_product_code: "",
            copy_product_code: "",
            product_title_en: "",
            product_title_cn: "",
            product_description_en: "",
            product_description_cn: "",
            product_specs_en: "",
            product_specs_cn: "",
            supplier_currency: null,
            item_cost_currency: null,
            shipping_currency: null,
            shipping_cost: 0,
            offered_cost: 0,
            item_cost: 0,
            pcs_or_crtn: 0,
            is_tnt: 0,
            is_wholesale: 0,
            is_active_banner: 0,
            rwarehouse: null,
            supplier_code: "",
            is_copy_price: false,
            is_copy_price_rc: false,
            is_copy_price_wc: false,
            is_copy_productInfo: false,
            is_copy_media: false,
            is_copy_data: false,
            is_new_product_id: 0,
            barcode: "",
            upc: "",
            pcs_per_carton: 0,
            item_weight: "",
            inventry_qty: 0,
            last_sold_date: "",
            last_received_date: "",
            cost_update_date: "",
            product_type_id: null,
            manufacturer_id: null,
            series_id: null,
            brand_id: null,
            supplier_id: null,
            customer_group_id: null,
            currency_id: null,
            warehouse_id: null,
            genres: [],
            preorder_start_date: null as Date | null,
            preorder_end_date: null as Date | null,
            po_dateline: null as Date | null,
            preorder_dateline: null as Date | null,
            release_date: null as Date | null,
            created_date: null as Date | null,
            deposit: 0,
            price_a: 0,
            unit_a: "",
            price_b: 0,
            unit_b: "",
            price_c: 0,
            unit_c: "",
            currency: "",
            profit_prcnt_a: 0,
            profit_prcnt_b: 0,
            profit_prcnt_c: 0,
            price_a_pcs_crtn: 0,
            price_b_pcs_crtn: 0,
            price_c_pcs_crtn: 0,
            price_b_to_pcs_crtn: 0,
            price_c_to_pcs_crtn: 0,
            retail_customer_group_id: null,
            retail_currency: "",
            retail_price: 0,
            retail_preorder_price: 0,
            retail_deposit: 0,
            retail_profit_prcnt_a: 0,
            is_import: 0,
        };
        setFormData(initialFormData);
    };
    const handleCopy = () => {
        if (saveType == "new" || saveType == "copy") {
            showErrorToast(translations["Cannot copy, Invalid data"] || "Cannot copy, Unfinished data");
            return;
        }
        setShowCopyProduct(true);
    };
    const handleSelectChange = async (id: number | string | null, type: string) => {
        // Now you have the ID or null
        setSelectedDropdownId(id);
        if (id) {
            let selectedOption: OptionType | undefined;
            switch (type) {
                case "ProductType":
                    selectedOption = productTypeOptions.find((option) => option.value === id);
                    break;
                case "Manufacturer":
                    selectedOption = manufacturerOptions.find((option) => option.value === id);
                    break;
                case "Series":
                    selectedOption = seriesOptions.find((option) => option.value === id);
                    break;
                case "Brand":
                    selectedOption = brandOptions.find((option) => option.value === id);
                    break;
                case "Genre":
                    selectedOption = genreOptions.find((option) => option.value === id);
                    break;
            }
            setSelectDropdownManuId(selectedOption?.value2 ?? null);
            if (selectedOption) {
                setFormData_Dropdown((prev) => ({
                    ...prev,
                    value: id,
                    value2: selectedOption?.value2 || null,
                    en: selectedOption?.en || "",
                    cn: selectedOption?.cn || "",
                    type: type,
                }));
            }
        } else {
            setFormData_Dropdown((prev) => ({
                ...prev,
                value: null,
                value2: null,
                en: "",
                cn: "",
                type: "",
            }));
        }
    };
    const processCopy = (newProductCode: string, copyFields: Record<string, boolean>, copySelectAll: Record<string, boolean>, rawArray: Record<string, boolean>) => {
        const sourceProduct = product;
        const sourceFormData = formData;
        const keyCount = Object.keys(rawArray).length;

        setProfitabilityByOrder([]);
        setProfitabilityByInvoice([]);
        onChangeProductId(0);
        onChangeSaveType("copy");

        setTimeout(() => {
            clearForms();
            let product_type_id: OptionType | null = null;
            let manufacturer_id: OptionType | null = null;
            let series_id: OptionType | null = null;
            let brand_id: OptionType | null = null;
            let genres: OptionType[] | null = null;
            let supplier_id: OptionType | null = null;
            let supplier_currency: OptionType | null = null;
            let rwarehouse: OptionType | null = null;
            let item_cost_currency: OptionType | null = null;
            let product_title_en: string;
            let product_title_cn: string;
            let item_weight: string;
            let pcs_per_carton: number;
            let is_tnt: number;
            let is_wholesale: number;
            let product_description_en: string;
            let product_description_cn: string;
            let product_specs_en: string;
            let product_specs_cn: string;
            let release_date: Date | null = null;
            let preorder_start_date: Date | null = null;
            let preorder_end_date: Date | null = null;
            let po_dateline: Date | null = null;
            let supplier_code: string;
            let offered_cost: number;
            let item_cost: number;

            if (keyCount === 0) {
                product_title_en = sourceFormData.product_title_en;
                product_title_cn = sourceFormData.product_title_cn;
                product_type_id = sourceFormData.product_type_id;
                manufacturer_id = sourceFormData.manufacturer_id;
                series_id = sourceFormData.series_id;
                brand_id = sourceFormData.brand_id;
                genres = sourceFormData.genres;
                item_weight = sourceFormData.item_weight;
                pcs_per_carton = sourceFormData.pcs_per_carton;
                is_tnt = sourceFormData.is_tnt;
                is_wholesale = sourceFormData.is_wholesale;
                product_description_en = sourceFormData.product_description_en;
                product_description_cn = sourceFormData.product_description_cn;
                product_specs_en = sourceFormData.product_specs_en;
                product_specs_cn = sourceFormData.product_specs_cn;
                release_date = sourceFormData.release_date;
                preorder_start_date = sourceFormData.preorder_start_date;
                preorder_end_date = sourceFormData.preorder_end_date;
                supplier_id = sourceFormData.supplier_id;
                supplier_code = sourceProduct?.supplier?.supplier_code;
                supplier_currency = sourceFormData.supplier_currency;
                offered_cost = sourceFormData.offered_cost;
                po_dateline = sourceFormData.po_dateline;
                rwarehouse = sourceFormData.rwarehouse;
                item_cost = sourceFormData.item_cost;
                item_cost_currency = sourceFormData.item_cost_currency;
            } else {
                product_title_en = sourceFormData.product_title_en;
                product_title_cn = sourceFormData.product_title_cn;
                product_type_id = isValidOption(rawArray["product_type_id"]) ? rawArray["product_type_id"] : null;
                manufacturer_id = isValidOption(rawArray["manufacturer_id"]) ? rawArray["manufacturer_id"] : null;
                series_id = isValidOption(rawArray["series_id"]) ? rawArray["series_id"] : null;
                brand_id = isValidOption(rawArray["brand_id"]) ? rawArray["brand_id"] : null;
                if (Array.isArray(rawArray["genres"])) {
                    genres = rawArray["genres"].every(isValidOptionMult) ? rawArray["genres"] : [];
                }
                item_weight = sourceFormData.item_weight;
                pcs_per_carton = sourceFormData.pcs_per_carton;
                is_tnt = sourceFormData.is_tnt;
                is_wholesale = sourceFormData.is_wholesale;
                product_description_en = sourceFormData.product_description_en;
                product_description_cn = sourceFormData.product_description_cn;
                product_specs_en = sourceFormData.product_specs_en;
                product_specs_cn = sourceFormData.product_specs_cn;
                release_date = sourceFormData.release_date;
                preorder_start_date = sourceFormData.preorder_start_date;
                preorder_end_date = sourceFormData.preorder_end_date;
                supplier_id = isValidOption(rawArray["supplier_id"]) ? rawArray["supplier_id"] : null;
                supplier_code = sourceFormData.supplier_code;
                supplier_currency = isValidOption(rawArray["supplier_currency"]) ? rawArray["supplier_currency"] : null;
                offered_cost = sourceFormData.offered_cost;
                po_dateline = sourceFormData.po_dateline;
                rwarehouse = isValidOption(rawArray["rwarehouse"]) ? rawArray["rwarehouse"] : null;
                item_cost = sourceFormData.item_cost;
                item_cost_currency = isValidOption(rawArray["item_cost_currency"]) ? rawArray["item_cost_currency"] : null;
            }
            setFormData((prevState) => ({
                ...prevState,
                product_title_en: copyFields["Product Name"] ? product_title_en : "",
                product_title_cn: copyFields["Product Name"] ? product_title_cn : "",
                product_type_id: copyFields["Product Type"] ? product_type_id : null,
                manufacturer_id: copyFields["Manufacturer"] ? manufacturer_id : null,
                series_id: copyFields["Series"] ? series_id : null,
                brand_id: copyFields["Brand"] ? brand_id : null,
                genres: copyFields["Genre"] ? (genres && Array.isArray(genres) ? genres : []) : [],
                item_weight: copyFields["Item Weight"] ? item_weight : "",
                pcs_per_carton: copyFields["Pcs Per Carton"] ? pcs_per_carton : 0,
                is_tnt: copyFields["Publish in Ecommerce site"] ? is_tnt : 0,
                is_wholesale: copyFields["Publish in Wholesale site"] ? is_wholesale : 0,
                product_description_en: copyFields["Description"] ? product_description_en : "",
                product_description_cn: copyFields["Description"] ? product_description_cn : "",
                product_specs_en: copyFields["Specs"] ? product_specs_en : "",
                product_specs_cn: copyFields["Specs"] ? product_specs_cn : "",
                release_date: copyFields["Release Date"] ? parseDate(release_date) : null,
                preorder_start_date: copyFields["Preorder Start Date"] ? parseDate(preorder_start_date) : null,
                preorder_end_date: copyFields["Preorder End Date"] ? parseDate(preorder_end_date) : null,
                supplier_id: copyFields["Supplier"] ? supplier_id : null,
                supplier_code: copyFields["Supplier"] ? supplier_code : "",
                supplier_currency: copyFields["Supplier Currency"] ? supplier_currency : null,
                offered_cost: copyFields["Offered Cost"] ? offered_cost : 0,
                po_dateline: copyFields["PO Dateline"] ? parseDate(po_dateline) : null,
                rwarehouse: copyFields["Receiving Warehouse"] ? rwarehouse : null,
                item_cost: copyFields["Item Cost"] ? item_cost : 0,
                item_cost_currency: copyFields["Item Cost"] ? item_cost_currency : null,
                is_copy_price_wc: copyFields["Product Price Setup"],
                is_copy_price_rc: copyFields["Customer Retail Price Setup"],
                product_code: newProductCode,
                old_product_code: newProductCode,
                copy_product_code: newProductCode,
                is_copy_price: copySelectAll["price"],
                is_copy_productInfo: copySelectAll["productInfo"],
                is_copy_media: copySelectAll["media"],
                is_copy_data: true,
                is_new_product_id: productId,
            }));
            if (!copySelectAll["media"]) {
                setThumbnailImage(null);
                setDisplayImage(null);
                setBannerImage(null);
                setSlideImages([]);
            }
            if (!copySelectAll["price"] || !copyFields["Product Price Setup"]) {
                setWholesalePricing([]);
            }
            if (!copySelectAll["price"] || !copyFields["Customer Retail Price Setup"]) {
                setRetailPricing([]);
            }
        }, 500);

        showSuccessToast(translations["Product ready to be saved as a copy."] || "Product ready to be saved as a copy.");
    };
    const handleCopyProduct = async () => {
        const newProductCode = formData.copy_product_code?.toString().trim() ?? "";
        if (!newProductCode) {
            showErrorToast(translations["Product Code Empty"]);
            return;
        }
        const countExist = await productService.getProductExist(newProductCode);
        if (countExist > 0) {
            showErrorToast(translations["Product Code Exist"]);
            return;
        }

        setShowCopyProduct(false);
        processCopy(newProductCode, fields, selectAll, {});
    };
    const handlePopupDropdown = (title: string) => {
        const titleWithoutSpaces = title.replace(/\s+/g, ""); // Removes all spaces
        setSelectedDropdownId(0);
        setSelectDropdownManuId(0);
        setFormData_Dropdown((prev) => ({
            ...prev,
            value: null,
            value2: null,
            en: "",
            cn: "",
            type: titleWithoutSpaces,
        }));
        setShowPopupDropdown(true);
        setPopupDropdownTitle(title);
    };
    const CustomOption = ({ data, innerRef, innerProps, type }: CustomOptionProps) => {
        const id = data.value;
        const text = data.label;

        const handleDeleteDropdown = async (e: React.MouseEvent) => {
            e.stopPropagation();

            const confirmed = await showConfirm(translations["System Message"], translations["Are you sure you want to delete this record?"], translations["Delete"], translations["Cancel"]);

            if (!confirmed) return;

            try {
                // Call the appropriate API based on type
                await productService.deleteDropdown(id, type);
                switch (type) {
                    case "ProductType":
                        setProductTypesData((prev) => prev.filter((item) => item.value !== id));
                        localStorage.removeItem(productTypesKey);
                        await loadProductTypes();
                        break;
                    case "Brand":
                        setBrandsData((prev) => prev.filter((item) => item.value !== id));
                        localStorage.removeItem(productBrandKey);
                        await loadBrand();
                        break;
                    case "Manufacturer":
                        setManufacturersData((prev) => prev.filter((item) => item.value !== id));
                        localStorage.removeItem(productManufacturerKey);
                        await loadManufacturer();
                        break;
                    case "Series":
                        setSeriesData((prev) => prev.filter((item) => item.value !== id));
                        localStorage.removeItem(productSeriesKey);
                        await loadSeries();
                        break;
                    case "Genre":
                        setGenresData((prev) => prev.filter((item) => item.value !== id));
                        localStorage.removeItem(productGenreKey);
                        await loadGenre();
                        break;
                    default:
                        throw new Error("Unknown type for deletion");
                }
                showSuccessToast(translations["Record has been Deleted"]);
            } catch (error) {
                showErrorToast(translations["alert_message_18"]);
                console.error("Failed to delete:", error);
            }
        };

        return (
            <div ref={innerRef} {...innerProps} className="flex justify-between items-center px-3 py-2 hover:bg-gray-800 text-white cursor-pointer">
                <span>{text}</span>
                <button onClick={handleDeleteDropdown} className="ml-2 text-red-500 hover:text-red-700" title="Delete this option" type="button">
                    <X size={14} />
                </button>
            </div>
        );
    };
    const handleDelete = async () => {
        const selectedProducts = [productId];
        if (selectedProducts.length === 0) return;

        const confirmed = await showConfirm(translations["System Message"], translations["Are you sure you want to delete selected items?"], translations["Delete"], translations["Cancel"]);

        if (!confirmed) return;
        try {
            await productService.deleteProducts(selectedProducts, "soft");
            showSuccessToast(translations["Record has been Deleted"]);

            onChangeProductId(0); // Notify parent about new product ID
            onChangeSaveType("new");

            // Delay logic to allow re-render with productId = 0
            setTimeout(async () => {
                setIsDirty(false);
                setIsInitialized(false);

                // Refetch data to get the new "initial" state
                await updateCachedRaw("productInfo");
                fetchProductDetails();

                await updateCachedRaw("productImages");
                fetchProductImages();

                await updateCachedRaw("productWholesale");
                fetchWholesalePricing();

                await updateCachedRaw("productRetail");
                fetchRetailPricing();

                onSave();
            }, 200);
        } catch (err) {
            showErrorToast(translations["alert_message_18"]);
            console.error("Deletion failed:", err);
        }
    };
    // Get all images for gallery with stable IDs
    const getAllImages = (): ImageItem[] => {
        const images: ImageItem[] = [];

        if (thumbnailImage && !thumbnailImage.isDeleted) {
            images.push(thumbnailImage);
        }

        if (displayImage && !displayImage.isDeleted) {
            images.push(displayImage);
        }

        if (bannerImage && !bannerImage.isDeleted) {
            images.push(bannerImage);
        }

        slideImages.forEach((image) => {
            if (!image.isDeleted) {
                images.push(image);
            }
        });

        return images;
    };
    const getTypeBadgeColor = (type: string) => {
        switch (type) {
            case "thumbnail":
                return "bg-blue-600";
            case "display":
                return "bg-green-600";
            case "banner":
                return "bg-purple-600";
            case "slide":
                return "bg-orange-600";
            default:
                return "bg-gray-600";
        }
    };
    const handleSelectAllImages = (checked: boolean) => {
        if (checked) {
            const allImageIds = getAllImages().map((img) => img.id);
            setSelectedImages(allImageIds);
        } else {
            setSelectedImages([]);
        }
    };
    const handleImageSelect = (imageId: string, checked: boolean) => {
        setSelectedImages((prev) => {
            if (checked) {
                return [...prev, imageId];
            } else {
                return prev.filter((id) => id !== imageId);
            }
        });
    };
    const handleDeleteSelectedImages = async () => {
        if (selectedImages.length === 0) return;

        const confirmed = await showConfirm(
            translations["System Message"],
            `Are you sure you want to delete ${selectedImages.length} selected image(s)?`,
            translations["Delete"],
            translations["Cancel"]
        );
        if (!confirmed) return;

        try {
            // Mark images as deleted instead of removing them immediately
            selectedImages.forEach((imageId) => {
                if (thumbnailImage?.id === imageId) {
                    setThumbnailImage((prev) => (prev ? { ...prev, isDeleted: true } : null));
                }
                if (displayImage?.id === imageId) {
                    setDisplayImage((prev) => (prev ? { ...prev, isDeleted: true } : null));
                }
                if (bannerImage?.id === imageId) {
                    setBannerImage((prev) => (prev ? { ...prev, isDeleted: true } : null));
                }

                setSlideImages((prev) => prev.map((img) => (img.id === imageId ? { ...img, isDeleted: true } : img)));
            });

            // Clear selection
            setSelectedImages([]);
            setIsDirty(true);
            showSuccessToast(selectedImages.length + " " + translations["alert_message_43"]);
        } catch (error) {
            showErrorToast(translations["alert_message_43"]);
            console.error("Error deleting images:", error);
        }
    };
    const handleRowClick = async (e: React.MouseEvent, id: number, type: string) => {
        e.preventDefault();
        try {
            const pricingResult = await productService.getPrductPricingById(id);
            const pricing = Array.isArray(pricingResult) ? pricingResult[0] : pricingResult;

            if (pricing) {
                if (type === "wholesale") {
                    setFormData((prev) => ({
                        ...prev,
                        customer_group_id: convertToSingleOption(pricing.customer_group_id, Wholesale_customerGroupOptions),
                        currency: pricing.currency ?? "",
                        pcs_or_crtn: pricing.pcs_or_crtn ?? 0,
                        deposit: pricing.deposit ?? 0,
                        price_a: pricing.price_a ?? 0,
                        price_b: pricing.price_b ?? 0,
                        price_c: pricing.price_c ?? 0,
                        profit_prcnt_a: pricing.profit_prcnt_a ?? 0,
                        profit_prcnt_b: pricing.profit_prcnt_b ?? 0,
                        profit_prcnt_c: pricing.profit_prcnt_c ?? 0,
                        price_a_pcs_crtn: pricing.price_a_pcs_crtn ?? 0,
                        price_b_pcs_crtn: pricing.price_b_pcs_crtn ?? 0,
                        price_c_pcs_crtn: pricing.price_c_pcs_crtn ?? 0,
                        price_b_to_pcs_crtn: pricing.price_b_to_pcs_crtn ?? 0,
                        price_c_to_pcs_crtn: pricing.price_c_to_pcs_crtn ?? 0,
                    }));
                }
                if (type === "retail") {
                    setFormData((prev) => ({
                        ...prev,
                        retail_customer_group_id: convertToSingleOption(pricing.customer_group_id, customerGroupOptions),
                        retail_currency: pricing.currency ?? "",
                        retail_price: pricing.retail_price ?? 0,
                        retail_preorder_price: pricing.preorder_price ?? 0,
                        retail_deposit: pricing.deposit ?? 0,
                        retail_profit_prcnt_a: pricing.profit_prcnt_a ?? 0,
                    }));
                }
            }
        } catch (error) {
            console.error("Failed to load pricing details:", error);
        }
    };
    const handleDelPrice = async (e: React.MouseEvent, id: number, type: string) => {
        e.stopPropagation(); // ⛔ Prevents triggering row click when clicking delete
        const confirmed = await showConfirm(translations["Delete Record"], translations["Are you sure you want to delete this record?"], translations["Delete"], translations["Cancel"]);
        if (!confirmed) return;
        try {
            await productService.deletePricing(id);
            if (type === "wholesale") {
                localStorage.removeItem(productWholesaleKey);
                fetchWholesalePricing();
            } else {
                localStorage.removeItem(productRetailKey);
                fetchRetailPricing();
            }
            showSuccessToast(translations["Record has been Deleted"]);
        } catch (error) {
            console.error("Failed to load pricing details:", error);
        }
    };
    const handleCustomerGroupChange = async (id: number, type: string) => {
        try {
            const pricingResult = await productService.getPrductPricingByGroupId(id);
            const pricing = Array.isArray(pricingResult) ? pricingResult[0] : pricingResult;

            if (pricing) {
                if (type === "wholesale") {
                    setFormData((prev) => ({
                        ...prev,
                        currency: pricing.currency ?? "",
                    }));
                }
                if (type === "retail") {
                    setFormData((prev) => ({
                        ...prev,
                        retail_currency: pricing.currency ?? "",
                    }));
                }
            }
        } catch (error) {
            console.error("Failed to load pricing by group:", error);
        }
    };
    // Drag and drop functions for slide sorting
    const handleDragStart = (e: React.DragEvent, index: number) => {
        setDraggedIndex(index);
        e.dataTransfer.effectAllowed = "move";
    };
    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
    };
    const handleDrop = (e: React.DragEvent, dropIndex: number) => {
        e.preventDefault();

        if (draggedIndex === null || draggedIndex === dropIndex) {
            setDraggedIndex(null);
            return;
        }

        const visibleImages = slideImages.filter((img) => !img.isDeleted);
        const deletedImages = slideImages.filter((img) => img.isDeleted);

        if (draggedIndex >= visibleImages.length || dropIndex >= visibleImages.length) {
            setDraggedIndex(null);
            return;
        }

        const draggedImage = visibleImages[draggedIndex];
        visibleImages.splice(draggedIndex, 1);
        visibleImages.splice(dropIndex, 0, draggedImage);

        const rerankedVisible = visibleImages.map((img, index) => ({
            ...img,
            rank: index + 1,
            index: index,
        }));

        setSlideImages([...rerankedVisible, ...deletedImages]);

        setDraggedIndex(null);
        setIsDirty(true);
    };
    const handleDragEnd = () => {
        setDraggedIndex(null);
    };
    const removeSlideImage = async (id: string) => {
        const confirmed = await showConfirm(
            translations["System Message"],
            translations["Are you sure you want to delete this image?"] || "Are you sure you want to delete this image?",
            translations["Delete"],
            translations["Cancel"]
        );
        if (confirmed) {
            setSlideImages((prev) => {
                const updated = prev.map((img) => (img.id === id ? { ...img, isDeleted: true } : img));

                const visibleImages = updated.filter((img) => !img.isDeleted);
                const rerankedVisible = visibleImages.map((img, newIndex) => ({
                    ...img,
                    rank: newIndex + 1,
                    index: newIndex,
                }));

                const rerankedMap = new Map(rerankedVisible.map((img) => [img.id, img]));

                return updated.map((img) => rerankedMap.get(img.id) || img);
            });
            setIsDirty(true);
            showSuccessToast(translations["alert_message_43"]);
        }
    };
    // Memoized date change handlers to prevent Flatpickr from re-rendering unnecessarily
    const handlePreorderStartDateChange = useCallback((dates: Date[]) => {
        setFormData((prev) => ({ ...prev, preorder_start_date: dates[0] ?? null }));
        if (!isDirtyRef.current) {
            setIsDirty(true); // ✅ only if user is editing
        }
    }, []);
    const handlePreorderEndDateChange = useCallback((dates: Date[]) => {
        setFormData((prev) => ({ ...prev, preorder_end_date: dates[0] ?? null }));
        if (!isDirtyRef.current) {
            setIsDirty(true); // ✅ only if user is editing
        }
    }, []);
    const handleReleaseDateChange = useCallback((dates: Date[]) => {
        setFormData((prev) => ({ ...prev, release_date: dates[0] ?? null }));
        if (!isDirtyRef.current) {
            setIsDirty(true); // ✅ only if user is editing
        }
    }, []);
    const handleCreatedDateChange = useCallback((dates: Date[]) => {
        setFormData((prev) => ({ ...prev, created_date: dates[0] ?? null }));
        if (!isDirtyRef.current) {
            setIsDirty(true); // ✅ only if user is editing
        }
    }, []);
    const handlePoDatelineChange = useCallback((dates: Date[]) => {
        setFormData((prev) => ({ ...prev, po_dateline: dates[0] ?? null }));
        if (!isDirtyRef.current) {
            setIsDirty(true); // ✅ only if user is editing
        }
    }, []);
    const handlePreorderDatelineChange = useCallback((dates: Date[]) => {
        setFormData((prev) => ({ ...prev, preorder_dateline: dates[0] ?? null }));
        if (!isDirtyRef.current) {
            setIsDirty(true); // ✅ only if user is editing
        }
    }, []);
    const calculatePercentage = async (priceField: "price_a" | "price_b" | "price_c") => {
        const price = formData[priceField];
        const itemCost = formData.item_cost;

        if (price > 0 && itemCost > 0 && formData.currency && formData.po_dateline) {
            try {
                const date = new Date(formData.po_dateline).toLocaleDateString("en-CA"); // YYYY-MM-DD
                const exchangeRate = await productService.getExchangeRate(formData.currency, baseCurrency(), date);
                const totalProfit = price * exchangeRate - itemCost;
                const returnPrcnt = Math.round((totalProfit / itemCost) * 100);

                const profitField = `profit_prcnt_${priceField.split("_")[1]}` as "profit_prcnt_a" | "profit_prcnt_b" | "profit_prcnt_c";
                setFormData((prev) => ({ ...prev, [profitField]: returnPrcnt }));
            } catch (error) {
                console.error("Failed to calculate percentage:", error);
            }
        } else {
            const profitField = `profit_prcnt_${priceField.split("_")[1]}` as "profit_prcnt_a" | "profit_prcnt_b" | "profit_prcnt_c";
            setFormData((prev) => ({ ...prev, [profitField]: 0 }));
        }
    };
    const calculateRetailPercentage = async () => {
        const price = formData.retail_price;
        const itemCost = formData.item_cost;

        if (price > 0 && itemCost > 0 && formData.retail_currency && formData.po_dateline) {
            try {
                const date = new Date(formData.po_dateline).toLocaleDateString("en-CA"); // YYYY-MM-DD
                const exchangeRate = await productService.getExchangeRate(formData.retail_currency, baseCurrency(), date);
                const totalProfit = price * exchangeRate - itemCost;
                const returnPrcnt = Math.round((totalProfit / itemCost) * 100);

                setFormData((prev) => ({ ...prev, retail_profit_prcnt_a: returnPrcnt }));
            } catch (error) {
                console.error("Failed to calculate percentage:", error);
            }
        } else {
            setFormData((prev) => ({ ...prev, retail_profit_prcnt_a: 0 }));
        }
    };
    const tabs = [
        { id: "information", label: translations["Product Information"] },
        { id: "media", label: translations["Product Media"] },
        { id: "price", label: translations["Product Price"] },
        { id: "profitability", label: translations["Profitability"] },
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
    if ((error || !product) && saveType !== "new") {
        return (
            <div className="min-h-screen" style={{ backgroundColor: "#1a1a1a" }}>
                <div className="p-6">
                    <button onClick={onBack} className="flex items-center space-x-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-[#ffffffcc] text-custom-sm rounded-lg transition-colors mb-4">
                        <ArrowLeft className="h-4 w-4" />
                        <span>{translations["Back"]}</span>
                    </button>
                    <div className="text-center py-12">
                        <div className="text-red-400 text-lg mb-2">{error || "Product not found"}</div>
                        <p className="text-gray-400">The product you're looking for doesn't exist or couldn't be loaded.</p>
                    </div>
                </div>
            </div>
        );
    }
    const renderProductInformation = () => (
        <div className="p-6 bg-[#19191c] rounded-xl">
            <div className="h-[calc(100vh-170px)] overflow-y-auto pr-2">
                <div className="grid gap-4">
                    {/* Product Code Section */}
                    <fieldset className="border-[1px] border-[#ffffff1a] rounded-lg p-4 space-y-4">
                        <div className="grid grid-cols-2 gap-6">
                            <div className="flex items-center space-x-4">
                                <label className="w-32 text-gray-400 text-sm">{translations["Product Code"]}</label>
                                <input
                                    type="text"
                                    value={formData.product_code}
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        setFormData((prev) => ({ ...prev, product_code: value }));
                                        if (!isDirtyRef.current) {
                                            setIsDirty(true); // ✅ only if user is editing
                                        }
                                    }}
                                    className="flex-1 px-3 py-2 border-[1px] border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm"
                                />
                                <input
                                    type="hidden"
                                    value={productId === 0 ? formData.old_product_code : formData.old_product_code}
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        setFormData((prev) => ({ ...prev, old_product_code: value }));
                                        if (!isDirtyRef.current) {
                                            setIsDirty(true); // ✅ only if user is editing
                                        }
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
                                        if (!isDirtyRef.current) {
                                            setIsDirty(true); // ✅ only if user is editing
                                        }
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
                                        if (!isDirtyRef.current) {
                                            setIsDirty(true); // ✅ only if user is editing
                                        }
                                    }}
                                    className="flex-1 px-3 py-2 border-[1px] border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm"
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-6">
                            <div className="flex items-center space-x-4">
                                <label className="w-32 text-gray-400 text-sm">{translations["Barcode No"]}</label>
                                <input
                                    type="text"
                                    value={formData.barcode}
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        setFormData((prev) => ({ ...prev, barcode: value }));
                                        if (!isDirtyRef.current) {
                                            setIsDirty(true); // ✅ only if user is editing
                                        }
                                    }}
                                    className="flex-1 px-3 py-2 border-[1px] border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm"
                                />
                            </div>
                            <div className="flex items-center space-x-4">
                                <label className="w-32 text-gray-400 text-sm">{translations["Pcs/Carton"]}</label>
                                <input
                                    type="number"
                                    value={formData.pcs_per_carton}
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        const numericValue = value === "" ? 0 : Number(value);
                                        setFormData((prev) => ({ ...prev, pcs_per_carton: numericValue }));
                                        if (!isDirtyRef.current) {
                                            setIsDirty(true); // ✅ only if user is editing
                                        }
                                    }}
                                    className="flex-1 px-3 py-2 border-[1px] border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm"
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-6">
                            <div className="flex items-center space-x-4">
                                <label className="w-32 text-gray-400 text-sm">{translations["Item Weight"]}</label>
                                <input
                                    type="text"
                                    value={formData.item_weight}
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        setFormData((prev) => ({ ...prev, item_weight: value }));
                                        if (!isDirtyRef.current) {
                                            setIsDirty(true); // ✅ only if user is editing
                                        }
                                    }}
                                    className="flex-1 px-3 py-2 border-[1px] border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm"
                                />
                            </div>
                            <div className="flex items-center space-x-4">
                                <label className="w-32 text-gray-400 text-sm">{translations["Inventory Qty"]}</label>
                                <input
                                    type="number"
                                    disabled
                                    value={formData.inventry_qty}
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        const numericValue = value === "" ? 0 : Number(value);
                                        setFormData((prev) => ({ ...prev, inventry_qty: numericValue }));
                                        if (!isDirtyRef.current) {
                                            setIsDirty(true); // ✅ only if user is editing
                                        }
                                    }}
                                    className="flex-1 px-3 py-2 border-[1px] border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm"
                                />
                            </div>
                        </div>
                    </fieldset>

                    {/* Product Type Section */}
                    <fieldset className="border-[1px] border-[#ffffff1a] rounded-lg p-4 space-y-4">
                        <div className="grid gap-4">
                            <div className="grid grid-cols-2 gap-6">
                                <div className="flex items-center space-x-4">
                                    <label className="w-32 text-gray-400 text-sm flex">
                                        {translations["Product Type"]}
                                        <div className="bg-blue-500 rounded-full p-0 hover:bg-blue-400 cursor-pointer focus:outline-none inline-flex items-center justify-center ml-2">
                                            <Plus onClick={() => handlePopupDropdown("Product Type")} className="h-5 w-5 text-white" />
                                        </div>
                                    </label>
                                    <Select
                                        classNamePrefix="react-select"
                                        value={formData.product_type_id}
                                        onChange={(selected) => {
                                            setFormData({ ...formData, product_type_id: selected });
                                            if (!isDirtyRef.current) {
                                                setIsDirty(true); // ✅ only if user is editing
                                            }
                                        }}
                                        options={productTypeOptions}
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
                                <div className="flex items-center space-x-4">
                                    <label className="w-32 text-gray-400 text-sm flex">
                                        {translations["Manufacturer"]}
                                        <div className="bg-blue-500 rounded-full p-0 hover:bg-blue-400 cursor-pointer focus:outline-none inline-flex items-center justify-center ml-2">
                                            <Plus onClick={() => handlePopupDropdown("Manufacturer")} className="h-5 w-5 text-white" />
                                        </div>
                                    </label>
                                    <Select
                                        classNamePrefix="react-select"
                                        value={formData.manufacturer_id}
                                        onChange={(selected) => {
                                            setFormData({ ...formData, manufacturer_id: selected });
                                            if (!isDirtyRef.current) {
                                                setIsDirty(true); // ✅ only if user is editing
                                            }
                                        }}
                                        options={manufacturerOptions}
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
                            <div className="grid grid-cols-2 gap-6">
                                <div className="flex items-center space-x-4">
                                    <label className="w-32 text-gray-400 text-sm flex">
                                        {translations["Series"]}
                                        <div className="bg-blue-500 rounded-full p-0 hover:bg-blue-400 cursor-pointer focus:outline-none inline-flex items-center justify-center ml-2">
                                            <Plus onClick={() => handlePopupDropdown("Series")} className="h-5 w-5 text-white" />
                                        </div>
                                    </label>
                                    <Select
                                        classNamePrefix="react-select"
                                        value={formData.series_id}
                                        onChange={(selected) => {
                                            setFormData({ ...formData, series_id: selected });
                                            if (!isDirtyRef.current) {
                                                setIsDirty(true); // ✅ only if user is editing
                                            }
                                        }}
                                        options={seriesOptions}
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
                                <div className="flex items-center space-x-4">
                                    <label className="w-32 text-gray-400 text-sm flex">
                                        {translations["Brand"]}
                                        <div className="bg-blue-500 rounded-full p-0 hover:bg-blue-400 cursor-pointer focus:outline-none inline-flex items-center justify-center ml-2">
                                            <Plus onClick={() => handlePopupDropdown("Brand")} className="h-5 w-5 text-white" />
                                        </div>
                                    </label>
                                    <Select
                                        classNamePrefix="react-select"
                                        value={formData.brand_id}
                                        onChange={(selected) => {
                                            setFormData({ ...formData, brand_id: selected });
                                            if (!isDirtyRef.current) {
                                                setIsDirty(true); // ✅ only if user is editing
                                            }
                                        }}
                                        options={brandOptions}
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
                            <div className="grid grid-cols-1 gap-6">
                                <div className="flex items-center space-x-4">
                                    <label className="w-32 text-gray-400 text-sm flex">
                                        {translations["Genre"]}
                                        <div className="bg-blue-500 rounded-full p-0 hover:bg-blue-400 cursor-pointer focus:outline-none inline-flex items-center justify-center ml-2">
                                            <Plus onClick={() => handlePopupDropdown("Genre")} className="h-5 w-5 text-white" />
                                        </div>
                                    </label>
                                    <Select
                                        classNamePrefix="react-select"
                                        isMulti
                                        value={formData.genres}
                                        onChange={(selected) => {
                                            setFormData({ ...formData, genres: selected as OptionType[] });
                                            if (!isDirtyRef.current) {
                                                setIsDirty(true); // ✅ only if user is editing
                                            }
                                        }}
                                        options={genreOptions}
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
                        </div>
                    </fieldset>

                    {/* Product Order Section */}
                    <fieldset className="border-[1px] border-[#ffffff1a] rounded-lg p-4 space-y-4">
                        <div className="grid gap-4">
                            <div className="grid grid-cols-2 gap-6">
                                <div className="flex items-center space-x-4">
                                    <label className="w-32 text-gray-400 text-sm">{translations["Preorder Start Date"]}</label>
                                    <Flatpickr
                                        onChange={handlePreorderStartDateChange}
                                        options={{
                                            dateFormat: "M d Y",
                                            defaultDate: formData.preorder_start_date || undefined,
                                            allowInput: true,
                                            locale: locale,
                                        }}
                                        className="flex-1 px-3 py-2 border-[1px] border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm"
                                    />
                                </div>
                                <div className="flex items-center space-x-4">
                                    <label className="w-32 text-gray-400 text-sm">{translations["Preorder End Date"]}</label>
                                    <Flatpickr
                                        onChange={handlePreorderEndDateChange}
                                        options={{
                                            dateFormat: "M d Y",
                                            defaultDate: formData.preorder_end_date || undefined,
                                            allowInput: true,
                                            locale: locale,
                                        }}
                                        className="flex-1 px-3 py-2 border-[1px] border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-6">
                                <div className="flex items-center space-x-4">
                                    <label className="w-32 text-gray-400 text-sm">{translations["Release Date"]}</label>
                                    <Flatpickr
                                        onChange={handleReleaseDateChange}
                                        options={{
                                            dateFormat: "M d Y",
                                            defaultDate: formData.release_date || undefined,
                                            allowInput: true,
                                            locale: locale,
                                        }}
                                        className="flex-1 px-3 py-2 border-[1px] border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm"
                                    />
                                </div>
                                <div className="flex items-center space-x-4">
                                    <label className="w-32 text-gray-400 text-sm">{translations["Date Created"]}</label>
                                    <Flatpickr
                                        onChange={handleCreatedDateChange}
                                        disabled
                                        options={{
                                            dateFormat: "M d Y",
                                            defaultDate: formData.created_date || undefined,
                                            allowInput: true,
                                            locale: locale,
                                        }}
                                        className="flex-1 px-3 py-2 border-[1px] border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm"
                                    />
                                </div>
                            </div>
                        </div>
                    </fieldset>

                    {/* Description Editor Section */}
                    <fieldset className="border-[1px] border-[#ffffff1a] rounded-lg p-4 space-y-4">
                        <div className="grid gap-4">
                            <div className="flex space-x-1 mb-4">
                                {["description", "specs"].map((tab) => (
                                    <button
                                        key={tab}
                                        onClick={() => setActiveDescriptionTab(tab)}
                                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors border ${
                                            activeDescriptionTab === tab ? "bg-blue-600 text-[#ffffffcc] text-custom-sm border-blue-600" : "text-gray-400 hover:bg-gray-700 border-gray-600"
                                        }`}
                                        style={activeDescriptionTab !== tab ? { backgroundColor: "#0003", borderColor: "#ffffff1a" } : {}}
                                    >
                                        {translations[tab.charAt(0).toUpperCase() + tab.slice(1)]}
                                    </button>
                                ))}
                            </div>
                            <div>
                                {activeDescriptionTab === "description" && (
                                    <>
                                        <RichTextEditor
                                            value={formData.product_description_en}
                                            onChange={(content) => {
                                                setFormData({ ...formData, product_description_en: content });
                                                if (!isDirtyRef.current) {
                                                    setIsDirty(true); // ✅ only if user is editing
                                                }
                                            }}
                                            className={lang === "cn" ? "hidden" : ""}
                                        />
                                        <RichTextEditor
                                            value={formData.product_description_cn}
                                            onChange={(content) => {
                                                setFormData({ ...formData, product_description_cn: content });
                                                if (!isDirtyRef.current) {
                                                    setIsDirty(true); // ✅ only if user is editing
                                                }
                                            }}
                                            className={lang === "en" ? "hidden" : ""}
                                        />
                                    </>
                                )}
                                {activeDescriptionTab === "specs" && (
                                    <>
                                        <RichTextEditor
                                            value={formData.product_specs_en}
                                            onChange={(content) => {
                                                setFormData({ ...formData, product_specs_en: content });
                                                if (!isDirtyRef.current) {
                                                    setIsDirty(true); // ✅ only if user is editing
                                                }
                                            }}
                                            className={lang === "cn" ? "hidden" : ""}
                                        />
                                        <RichTextEditor
                                            value={formData.product_specs_cn}
                                            onChange={(content) => {
                                                setFormData({ ...formData, product_specs_cn: content });
                                                if (!isDirtyRef.current) {
                                                    setIsDirty(true); // ✅ only if user is editing
                                                }
                                            }}
                                            className={lang === "en" ? "hidden" : ""}
                                        />
                                    </>
                                )}
                            </div>
                        </div>
                    </fieldset>
                </div>
            </div>
        </div>
    );
    const renderProductMedia = () => (
        <div className="p-6">
            <div className="h-[calc(100vh-170px)] overflow-y-auto pr-2">
                {/* Product Thumbnail and Display */}
                <fieldset className="border-[1px] border-[#ffffff1a] rounded-lg p-4 space-y-4 mb-2">
                    <div className="grid grid-cols-12 gap-6 mb-8 items-start">
                        {/* Product Thumbnail Label */}
                        <div className="col-span-2">
                            <h3 className="text-[#ffffffcc] text-custom-sm text-lg mb-4">{translations["Product Thumbnail"]}</h3>
                            <p className="text-gray-400 text-sm mb-2">480 x 480:</p>
                        </div>

                        {/* Product Thumbnail Image/Drop */}
                        <div className="col-span-4 h-[472px]">
                            {thumbnailImage && !thumbnailImage.isDeleted ? (
                                <div className="relative h-[472px]">
                                    <img
                                        src={getImageUrl(thumbnailImage)}
                                        alt="Product Thumbnail"
                                        className="w-full h-[472px] object-cover rounded-lg"
                                        onError={(e) => {
                                            const target = e.target as HTMLImageElement;
                                            target.src = "https://tnt2.simplify.cool/images/no-image-min.jpg";
                                        }}
                                    />
                                    <button
                                        onClick={() => {
                                            setThumbnailImage((prev) => (prev ? { ...prev, isDeleted: true } : null));
                                            setIsDirty(true);
                                        }}
                                        className="absolute top-2 right-2 p-1 bg-red-600 text-[#ffffffcc] text-custom-sm rounded-full hover:bg-red-700"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                </div>
                            ) : (
                                <div
                                    {...thumbnailDropzone.getRootProps()}
                                    className={`border-2 h-[472px] border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors h-full flex flex-col items-center justify-center ${
                                        thumbnailDropzone.isDragActive ? "border-cyan-500 bg-cyan-500/10" : "border-gray-600 hover:border-gray-500"
                                    }`}
                                >
                                    <input {...thumbnailDropzone.getInputProps()} />
                                    <Upload className="h-12 w-12 text-gray-400 mb-4" />
                                    <p className="text-gray-400">{translations["Click to Upload or Drag n Drop"]}</p>
                                </div>
                            )}
                        </div>

                        {/* Product Display Label */}
                        <div className="col-span-2">
                            <h3 className="text-[#ffffffcc] text-custom-sm text-lg mb-4">{translations["Product Display"]}</h3>
                            <p className="text-gray-400 text-sm mb-2">720 x 540:</p>
                        </div>

                        {/* Product Display Image/Drop */}
                        <div className="col-span-4 h-[350px]">
                            {displayImage && !displayImage.isDeleted ? (
                                <div className="relative h-[350px]">
                                    <img
                                        src={getImageUrl(displayImage)}
                                        alt="Product Display"
                                        className="w-full h-[350px] object-cover rounded-lg"
                                        onError={(e) => {
                                            const target = e.target as HTMLImageElement;
                                            target.src = "https://tnt2.simplify.cool/images/no-image-min.jpg";
                                        }}
                                    />
                                    <button
                                        onClick={() => {
                                            setDisplayImage((prev) => (prev ? { ...prev, isDeleted: true } : null));
                                            setIsDirty(true);
                                        }}
                                        className="absolute top-2 right-2 p-1 bg-red-600 text-[#ffffffcc] text-custom-sm rounded-full hover:bg-red-700"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                </div>
                            ) : (
                                <div
                                    {...displayDropzone.getRootProps()}
                                    className={`border-2 h-[350px] border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors h-full flex flex-col items-center justify-center ${
                                        displayDropzone.isDragActive ? "border-cyan-500 bg-cyan-500/10" : "border-gray-600 hover:border-gray-500"
                                    }`}
                                >
                                    <input {...displayDropzone.getInputProps()} />
                                    <Upload className="h-12 w-12 text-gray-400 mb-4" />
                                    <p className="text-gray-400">{translations["Click to Upload or Drag n Drop"]}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </fieldset>
                {/* Product Slides */}
                <fieldset className="border-[1px] border-[#ffffff1a] rounded-lg p-4 space-y-4 mb-2">
                    <div className="mb-8">
                        <div className="grid grid-cols-12 gap-6 items-start">
                            {/* Product Slides Label */}
                            <div className="col-span-2">
                                <h3 className="text-[#ffffffcc] text-custom-sm text-lg mb-2">{translations["Product Slides"]}</h3>
                                <p className="text-gray-400 text-sm mb-2">({translations["Max 20 Images"]})</p>
                                <p className="text-gray-400 text-sm">
                                    {translations["Current Images"]}: {slideImages.filter((img) => !img.isDeleted).length}
                                </p>
                            </div>

                            {/* Upload Dropzone */}
                            <div className="col-span-2">
                                <div
                                    {...slidesDropzone.getRootProps()}
                                    className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors h-32 flex flex-col items-center justify-center ${
                                        slidesDropzone.isDragActive ? "border-cyan-500 bg-cyan-500/10" : "border-gray-600 hover:border-gray-500"
                                    }`}
                                >
                                    <input {...slidesDropzone.getInputProps()} />
                                    <Upload className="h-8 w-8 text-gray-400 mb-2" />
                                    <p className="text-gray-400 text-xs">{translations["Click to Upload or Drag n Drop"]}</p>
                                </div>
                            </div>

                            {/* Horizontal Slider */}
                            <div className="col-span-8">
                                {slideImages.filter((img) => !img.isDeleted).length > 0 ? (
                                    <div className="relative">
                                        <div className="flex space-x-3 overflow-x-auto pb-2">
                                            {slideImages
                                                .filter((img) => !img.isDeleted)
                                                .map((image, index) => (
                                                    <div
                                                        key={image.id}
                                                        draggable
                                                        onDragStart={(e) => handleDragStart(e, index)}
                                                        onDragOver={handleDragOver}
                                                        onDrop={(e) => handleDrop(e, index)}
                                                        onDragEnd={handleDragEnd}
                                                        className={`relative flex-shrink-0 w-32 h-32 rounded-lg overflow-hidden border-2 cursor-move transition-all ${
                                                            draggedIndex === index ? "border-cyan-500 opacity-50" : "border-gray-600 hover:border-gray-500"
                                                        }`}
                                                    >
                                                        {/* Drag Handle */}
                                                        <div className="absolute top-1 left-1 z-10 p-1 bg-black bg-opacity-50 rounded">
                                                            <GripVertical className="h-3 w-3 text-white" />
                                                        </div>

                                                        {/* Image */}
                                                        <img
                                                            src={getImageUrl(image)}
                                                            alt={`Slide ${index + 1}`}
                                                            className="w-full h-full object-cover"
                                                            onError={(e) => {
                                                                const target = e.target as HTMLImageElement;
                                                                target.src = "https://tnt2.simplify.cool/images/no-image-min.jpg";
                                                            }}
                                                        />

                                                        {/* Remove Button */}
                                                        <button
                                                            onClick={() => removeSlideImage(image.id)}
                                                            className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors"
                                                        >
                                                            <X className="h-3 w-3" />
                                                        </button>

                                                        {/* Index Number */}
                                                        <div className="absolute bottom-1 left-1 px-1 py-0.5 bg-black bg-opacity-70 text-white text-xs rounded">{index + 1}</div>
                                                    </div>
                                                ))}
                                        </div>

                                        {/* Drag Instructions */}
                                        <p className="text-gray-400 text-xs mt-2 flex items-center">
                                            <Move className="h-3 w-3 mr-1" />
                                            Drag images to reorder
                                        </p>
                                    </div>
                                ) : (
                                    <div className="h-32 flex items-center justify-center border-2 border-dashed border-gray-600 rounded-lg">
                                        <p className="text-gray-400 text-sm">{translations["Image"]}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </fieldset>
                {/* Product Banner */}
                <fieldset className="border-[1px] border-[#ffffff1a] rounded-lg p-4 space-y-4 mb-2">
                    <div className="grid grid-cols-12 gap-6 items-start">
                        {/* Product Banner Label */}
                        <div className="col-span-2">
                            <h3 className="text-[#ffffffcc] text-custom-sm text-lg mb-4">{translations["Product Banner"]}</h3>
                            <p className="text-gray-400 text-sm mb-2">1920 x 500:</p>
                        </div>

                        {/* Product Banner Image/Drop */}
                        <div className="col-span-10 h-[330px]">
                            {bannerImage && !bannerImage.isDeleted ? (
                                <div className="relative h-[330px]">
                                    <img
                                        src={getImageUrl(bannerImage)}
                                        alt="Product Banner"
                                        className="w-full h-[330px] object-cover rounded-lg "
                                        onError={(e) => {
                                            const target = e.target as HTMLImageElement;
                                            target.src = "https://tnt2.simplify.cool/images/no-image-min.jpg";
                                        }}
                                    />
                                    <button
                                        onClick={() => {
                                            setBannerImage((prev) => (prev ? { ...prev, isDeleted: true } : null));
                                            setIsDirty(true);
                                        }}
                                        className="absolute top-2 right-2 p-1 bg-red-600 text-[#ffffffcc] text-custom-sm rounded-full hover:bg-red-700"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                </div>
                            ) : (
                                <div
                                    {...bannerDropzone.getRootProps()}
                                    className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors h-[330px] flex flex-col items-center justify-center ${
                                        bannerDropzone.isDragActive ? "border-cyan-500 bg-cyan-500/10" : "border-gray-600 hover:border-gray-500"
                                    }`}
                                >
                                    <input {...bannerDropzone.getInputProps()} />
                                    <Upload className="h-8 w-8 text-gray-400 mb-2" />
                                    <p className="text-gray-400">{translations["Click to Upload or Drag n Drop"]}</p>
                                </div>
                            )}
                        </div>
                        <div className="col-span-2"></div>
                        <div className="col-span-10">
                            <div className="mt-1">
                                <div className="flex items-center space-x-3 text-gray-400">
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={Number(product?.is_active_banner) === 1}
                                            onChange={(e) => {
                                                const isChecked = e.target.checked ? 1 : 0;
                                                // Update both product and formData
                                                setProduct((prev) => (prev ? { ...prev, is_active_banner: isChecked } : null));
                                                setFormData((prev) => ({ ...prev, is_active_banner: isChecked }));
                                                if (!isDirtyRef.current) {
                                                    setIsDirty(true); // ✅ only if user is editing
                                                }
                                            }}
                                            className="sr-only peer"
                                        />
                                        <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:bg-green-600 transition-colors duration-200"></div>
                                        <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform duration-200 transform peer-checked:translate-x-full"></div>
                                    </label>
                                    <div>
                                        <span className="text-[#ffffffcc] text-custom-sm font-medium">{translations["Publish Image on Front Page"]}</span>
                                        <span className={`text-sm ml-2 ${Number(product?.is_active_banner) === 1 ? "text-green-400" : "text-red-400"}`}>
                                            {Number(product?.is_active_banner) === 1 ? translations["Active"] : translations["In-Active"]}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </fieldset>
            </div>
        </div>
    );
    const renderProductPrice = () => (
        <div className="p-6">
            <div className="h-[calc(100vh-170px)] overflow-y-auto pr-2">
                <fieldset className="border-[1px] border-[#ffffff1a] rounded-lg p-4 space-y-4">
                    <div className="grid gap-4">
                        <div className="grid grid-cols-2 gap-6">
                            <div className="flex items-center space-x-4">
                                <label className="w-1/3 text-sm text-gray-400">{translations["Supplier Name"]}</label>
                                <Select
                                    classNamePrefix="react-select"
                                    value={formData.supplier_id}
                                    onChange={(selected) => {
                                        const supplierCode = selected ? supplierOptions.find((opt) => opt.value === selected.value)?.code || "" : "";
                                        setFormData({
                                            ...formData,
                                            supplier_id: selected,
                                            supplier_code: supplierCode,
                                        });
                                        if (!isDirtyRef.current) {
                                            setIsDirty(true); // ✅ only if user is editing
                                        }
                                    }}
                                    options={supplierOptions}
                                    styles={{
                                        ...selectStyles,
                                        menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                                    }}
                                    className="w-2/3"
                                    isClearable
                                    placeholder={translations["Select"]}
                                    menuPlacement="auto"
                                    menuPosition="fixed"
                                    menuPortalTarget={typeof window !== "undefined" ? document.body : null}
                                />
                            </div>
                            <div className="flex items-center space-x-4">
                                <label className="w-1/3 text-sm text-gray-400">{translations["Supplier Code"]}</label>
                                <input
                                    type="text"
                                    value={formData.supplier_code}
                                    onChange={(e) => {
                                        setFormData({ ...formData, supplier_code: e.target.value });
                                        if (!isDirtyRef.current) {
                                            setIsDirty(true); // ✅ only if user is editing
                                        }
                                    }}
                                    disabled
                                    className="w-2/3 px-3 py-2 border-[1px] border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm rounded-lg focus:outline-none focus:border-cyan-500"
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-6">
                            <div className="flex items-center space-x-4">
                                <label className="w-1/3 text-sm text-gray-400">{translations["Offered Cost"]}</label>
                                <div className="w-2/3 flex space-x-2">
                                    <Select
                                        classNamePrefix="react-select"
                                        value={formData.supplier_currency}
                                        onChange={async (selected) => {
                                            setFormData({ ...formData, supplier_currency: selected as OptionType | null });
                                            if (!isDirtyRef.current) {
                                                setIsDirty(true); // ✅ only if user is editing
                                            }
                                            handleOfferedCostBlur();
                                        }}
                                        options={Supplier_currencyOptions}
                                        styles={{
                                            ...selectStyles,
                                            menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                                        }}
                                        className="w-1/3"
                                        isClearable
                                        placeholder={translations["Select"]}
                                        menuPlacement="auto"
                                        menuPosition="fixed"
                                        menuPortalTarget={typeof window !== "undefined" ? document.body : null}
                                    />
                                    <input
                                        type="number"
                                        value={formData.offered_cost}
                                        onChange={(e) => {
                                            setFormData((prev) => ({ ...prev, offered_cost: parseFloat(e.target.value) || 0 }));
                                            if (!isDirtyRef.current) {
                                                setIsDirty(true); // ✅ only if user is editing
                                            }
                                        }}
                                        onBlur={handleOfferedCostBlur}
                                        className="flex-1 px-3 py-2 border-[1px] border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm rounded-lg focus:outline-none focus:border-cyan-500"
                                    />
                                </div>
                            </div>
                            <div className="flex items-center space-x-4">
                                <label className="w-1/3 text-sm text-gray-400">{translations["Item Cost"]}</label>
                                <div className="w-2/3 flex space-x-2">
                                    <Select
                                        classNamePrefix="react-select"
                                        value={formData.item_cost_currency}
                                        onChange={(selected) => {
                                            setFormData({ ...formData, item_cost_currency: selected as OptionType | null });
                                            if (!isDirtyRef.current) {
                                                setIsDirty(true); // ✅ only if user is editing
                                            }
                                        }}
                                        options={ItemCost_currencyOptions}
                                        styles={{
                                            ...selectStyles,
                                            menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                                        }}
                                        className="w-1/3"
                                        isClearable
                                        placeholder={translations["Select"]}
                                        menuPlacement="auto"
                                        menuPosition="fixed"
                                        menuPortalTarget={typeof window !== "undefined" ? document.body : null}
                                    />
                                    <input
                                        type="number"
                                        value={formData.item_cost}
                                        onChange={(e) => {
                                            setFormData((prev) => ({ ...prev, item_cost: parseFloat(e.target.value) || 0 }));
                                            if (!isDirtyRef.current) {
                                                setIsDirty(true); // ✅ only if user is editing
                                            }
                                        }}
                                        className="flex-1 px-3 py-2 border-[1px] border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm rounded-lg focus:outline-none focus:border-cyan-500"
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-6">
                            <div className="flex items-center space-x-4">
                                <label className="w-1/3 text-sm text-gray-400">{translations["PO Submission Dateline"]}</label>
                                <Flatpickr
                                    onChange={handlePoDatelineChange}
                                    options={{
                                        dateFormat: "M d Y",
                                        defaultDate: formData.po_dateline || undefined,
                                        allowInput: true,
                                        locale: locale,
                                    }}
                                    className="w-2/3 px-3 py-2 border-[1px] border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm rounded-lg focus:outline-none focus:border-cyan-500"
                                />
                            </div>
                            <div className="flex items-center space-x-4">
                                <label className="w-1/3 text-sm text-gray-400">{translations["Pre-Order Dateline"]}</label>
                                <Flatpickr
                                    onChange={handlePreorderDatelineChange}
                                    options={{
                                        dateFormat: "M d Y",
                                        defaultDate: formData.preorder_dateline || undefined,
                                        allowInput: true,
                                        locale: locale,
                                    }}
                                    className="w-2/3 px-3 py-2 border-[1px] border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm rounded-lg focus:outline-none focus:border-cyan-500"
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-6">
                            <div className="flex items-center space-x-4">
                                <label className="w-1/3 text-sm text-gray-400">{translations["ShippingCost"]}</label>
                                <div className="w-2/3 flex space-x-2">
                                    <Select
                                        classNamePrefix="react-select"
                                        value={formData.shipping_currency}
                                        onChange={(selected) => {
                                            setFormData({ ...formData, shipping_currency: selected as OptionType | null });
                                            if (!isDirtyRef.current) {
                                                setIsDirty(true); // ✅ only if user is editing
                                            }
                                        }}
                                        options={Shipping_currencyOptions}
                                        styles={{
                                            ...selectStyles,
                                            menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                                        }}
                                        className="w-1/3"
                                        isClearable
                                        placeholder={translations["Select"]}
                                        menuPlacement="auto"
                                        menuPosition="fixed"
                                        menuPortalTarget={typeof window !== "undefined" ? document.body : null}
                                    />
                                    <input
                                        type="number"
                                        value={formData.shipping_cost}
                                        onChange={(e) => {
                                            setFormData((prev) => ({ ...prev, shipping_cost: parseFloat(e.target.value) || 0 }));
                                            if (!isDirtyRef.current) {
                                                setIsDirty(true); // ✅ only if user is editing
                                            }
                                        }}
                                        className="flex-1 px-3 py-2 border-[1px] border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm rounded-lg focus:outline-none focus:border-cyan-500"
                                    />
                                </div>
                            </div>
                            <div className="flex items-center space-x-4">
                                <label className="w-1/3 text-sm text-gray-400">{translations["Receiving Warehouse"]}</label>
                                <Select
                                    classNamePrefix="react-select"
                                    value={formData.rwarehouse}
                                    onChange={(selected) => {
                                        setFormData({ ...formData, rwarehouse: selected as OptionType | null });
                                        if (!isDirtyRef.current) {
                                            setIsDirty(true); // ✅ only if user is editing
                                        }
                                    }}
                                    options={warehouseOptions}
                                    styles={{
                                        ...selectStyles,
                                        menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                                    }}
                                    className="w-2/3"
                                    isClearable
                                    placeholder={translations["Select"]}
                                    menuPlacement="auto"
                                    menuPosition="fixed"
                                    menuPortalTarget={typeof window !== "undefined" ? document.body : null}
                                />
                            </div>
                        </div>
                    </div>
                </fieldset>
                {/* Pricing Tabs */}
                <div className="bg-transparent border border-[#ffffff1a] rounded-xl shadow-md overflow-hidden mt-5">
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700">
                        {/* Left Buttons */}
                        <div className="flex space-x-2">
                            <button
                                onClick={() => setActivePricingTab("wholesale")}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors border ${
                                    activePricingTab === "wholesale" ? "bg-blue-600 text-[#ffffffcc] text-custom-sm border-blue-600" : "text-gray-400 hover:bg-gray-700 border-gray-600"
                                }`}
                                style={activePricingTab !== "wholesale" ? { backgroundColor: "#2b2e31" } : {}}
                            >
                                {translations["Wholesale Pricing"]}
                            </button>
                            <button
                                onClick={() => setActivePricingTab("retail")}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors border ${
                                    activePricingTab === "retail" ? "bg-blue-600 text-[#ffffffcc] text-custom-sm border-blue-600" : "text-gray-400 hover:bg-gray-700 border-gray-600"
                                }`}
                                style={activePricingTab !== "retail" ? { backgroundColor: "#2b2e31" } : {}}
                            >
                                {translations["Retail Pricing"]}
                            </button>
                        </div>
                        {/* Right Button */}
                        <div className="flex space-x-2">
                            <button onClick={handleSavePricing} className="px-3 py-1.5 text-sm bg-cyan-600 hover:bg-cyan-700 text-[#ffffffcc] text-custom-sm rounded-md">
                                {translations["Save Pricing Setting"]}
                            </button>
                        </div>
                    </div>

                    {/* Body */}
                    <div className="px-6 py-5 text-gray-200">
                        {activePricingTab === "wholesale" && (
                            <div>
                                {/* Pricing Form - Exact Layout from Image */}
                                <div className="grid gap-4">
                                    {/* Row 1: Customer Group + Deposit */}
                                    <div className="grid grid-cols-3 gap-6">
                                        <div className="flex items-center space-x-4">
                                            <label className="w-1/3 text-sm text-gray-400">{translations["Customer Group"]}</label>
                                            <Select
                                                classNamePrefix="react-select"
                                                value={formData.customer_group_id}
                                                onChange={(selected) => {
                                                    if (selected) {
                                                        setFormData({ ...formData, customer_group_id: selected });
                                                        handleCustomerGroupChange(parseInt(selected.value), "wholesale");
                                                        if (!isDirtyRef.current) {
                                                            setIsDirty(true); // ✅ only if user is editing
                                                        }
                                                    }
                                                }}
                                                options={Wholesale_customerGroupOptions}
                                                styles={{
                                                    ...selectStyles,
                                                    menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                                                }}
                                                className="w-2/3"
                                                isClearable
                                                placeholder={translations["Select"]}
                                                menuPlacement="auto"
                                                menuPosition="fixed"
                                                menuPortalTarget={typeof window !== "undefined" ? document.body : null}
                                            />
                                        </div>
                                        <div className="flex items-center space-x-4">
                                            <label className="w-[20%] text-sm text-gray-400">{translations["Deposit"]}</label>
                                            <div className="flex w-[80%]">
                                                <input
                                                    type="text"
                                                    readOnly
                                                    value={formData.currency}
                                                    onChange={(e) => {
                                                        setFormData({ ...formData, currency: e.target.value });
                                                        if (!isDirtyRef.current) {
                                                            setIsDirty(true); // ✅ only if user is editing
                                                        }
                                                    }}
                                                    className="w-[20%] flex-1 px-3 py-2 border-[1px] border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm rounded-r-lg text-[#ffffffcc]"
                                                />
                                                <input
                                                    type="text"
                                                    value={formData.deposit}
                                                    onChange={(e) => {
                                                        setFormData((prev) => ({ ...prev, deposit: parseFloat(e.target.value) || 0 }));
                                                        if (!isDirtyRef.current) {
                                                            setIsDirty(true); // ✅ only if user is editing
                                                        }
                                                    }}
                                                    className="w-[80%] flex-2 px-3 py-2 border-[1px] border-[#ffffff1a] rounded-r-lg text-[#ffffffcc] text-custom-sm focus:outline-none focus:border-cyan-500"
                                                />
                                            </div>
                                        </div>
                                        <div />
                                    </div>
                                    {/* Row 2: Price A Two dropdowns side-by-side */}
                                    <div className="grid grid-cols-3 gap-6">
                                        <div className="flex items-center space-x-4">
                                            <label className="w-1/3 text-sm text-gray-400">{translations["Price A"]}</label>
                                            <div className="w-2/3 flex space-x-2">
                                                <input
                                                    value={formData.price_a_pcs_crtn === 0 ? "" : formData.price_a_pcs_crtn}
                                                    onChange={(e) => {
                                                        const value = Number(e.target.value);
                                                        setFormData((prev) => ({ ...prev, price_a_pcs_crtn: value }));
                                                        if (!isDirtyRef.current) {
                                                            setIsDirty(true); // ✅ only if user is editing
                                                        }
                                                    }}
                                                    onBlur={() => {
                                                        handlePcsPerCartonSettings("PriceA", formData.price_a_pcs_crtn);
                                                    }}
                                                    placeholder="0"
                                                    type="number"
                                                    className="w-1/2 px-3 py-2 border-[1px] border-[#ffffff1a] rounded-lg text-[#ffffffcc] text-custom-sm focus:outline-none focus:border-cyan-500"
                                                />
                                                <Select
                                                    value={unitOptions.find((o) => o.value === String(formData.pcs_or_crtn))}
                                                    onChange={(selected) => {
                                                        const value = selected ? parseInt(selected.value, 10) : 0;
                                                        setFormData({ ...formData, pcs_or_crtn: value });
                                                        if (!isDirtyRef.current) {
                                                            setIsDirty(true); // ✅ only if user is editing
                                                        }
                                                    }}
                                                    classNamePrefix="react-select"
                                                    options={unitOptions}
                                                    styles={{
                                                        ...selectStyles,
                                                        menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                                                    }}
                                                    className="w-1/2"
                                                    placeholder={translations["Select"]}
                                                    menuPlacement="auto"
                                                    menuPosition="fixed"
                                                    menuPortalTarget={typeof window !== "undefined" ? document.body : null}
                                                />
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-4">
                                            <label className="w-[20%] text-sm text-gray-400">{translations["&"]}</label>
                                            <div className="flex w-[80%]">
                                                <input
                                                    type="text"
                                                    value={translations["Above"]}
                                                    readOnly
                                                    className="w-full px-3 py-2 border-[1px] border-[#ffffff1a] rounded-lg text-[#ffffffcc] text-custom-sm focus:outline-none focus:border-cyan-500"
                                                />
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-4">
                                            <label className="w-[20%] text-sm text-gray-400">{translations["Price"]}</label>
                                            <div className="flex w-[80%]">
                                                <input
                                                    type="text"
                                                    readOnly
                                                    value={formData.currency}
                                                    onChange={(e) => {
                                                        setFormData({ ...formData, currency: e.target.value });
                                                        if (!isDirtyRef.current) {
                                                            setIsDirty(true); // ✅ only if user is editing
                                                        }
                                                    }}
                                                    className="w-[20%] px-3 py-2 border-[1px] border-[#ffffff1a] rounded-lg text-[#ffffffcc] text-custom-sm focus:outline-none focus:border-cyan-500"
                                                />
                                                <input
                                                    type="number"
                                                    value={formData.price_a}
                                                    onChange={(e) => {
                                                        setFormData((prev) => ({ ...prev, price_a: parseFloat(e.target.value) || 0 }));
                                                        if (!isDirtyRef.current) {
                                                            setIsDirty(true); // ✅ only if user is editing
                                                        }
                                                    }}
                                                    onBlur={() => calculatePercentage("price_a")}
                                                    className="w-[40%] flex-1 px-3 py-2 border-[1px] border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm rounded-r-lg text-[#ffffffcc] text-custom-sm focus:outline-none focus:border-cyan-500"
                                                />
                                                <input
                                                    type="text"
                                                    value={`${formData.profit_prcnt_a}%`}
                                                    readOnly
                                                    style={{ color: getProfitColor(formData.profit_prcnt_a) }}
                                                    className="w-[40%] flex-2 px-3 py-2 border-[1px] border-[#ffffff1a] rounded-r-lg text-[#ffffffcc] text-custom-sm focus:outline-none focus:border-cyan-500"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    {/* Row 3: Price B Two dropdowns side-by-side */}
                                    <div className="grid grid-cols-3 gap-6">
                                        <div className="flex items-center space-x-4">
                                            <label className="w-1/3 text-sm text-gray-400">{translations["Price B"]}</label>
                                            <div className="w-2/3 flex space-x-2">
                                                <input
                                                    type="number"
                                                    value={formData.price_b_pcs_crtn}
                                                    onChange={(e) => {
                                                        setFormData((prev) => ({ ...prev, price_b_pcs_crtn: parseFloat(e.target.value) || 0 }));
                                                        if (!isDirtyRef.current) {
                                                            setIsDirty(true); // ✅ only if user is editing
                                                        }
                                                    }}
                                                    onBlur={() => {
                                                        handlePcsPerCartonSettings("PriceB", formData.price_b_pcs_crtn);
                                                    }}
                                                    className="w-1/2 px-3 py-2 border-[1px] border-[#ffffff1a] rounded-lg text-[#ffffffcc] text-custom-sm focus:outline-none focus:border-cyan-500"
                                                    style={{ backgroundColor: "#2b2e31" }}
                                                />
                                                <Select
                                                    value={unitOptions.find((o) => o.value === String(formData.pcs_or_crtn))}
                                                    onChange={(selected) => {
                                                        setFormData({ ...formData, pcs_or_crtn: selected ? parseInt(selected.value, 10) : 0 });
                                                        if (!isDirtyRef.current) {
                                                            setIsDirty(true); // ✅ only if user is editing
                                                        }
                                                    }}
                                                    classNamePrefix="react-select"
                                                    options={unitOptions}
                                                    styles={{
                                                        ...selectStyles,
                                                        menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                                                    }}
                                                    className="w-1/2"
                                                    placeholder={translations["Select"]}
                                                    menuPlacement="auto"
                                                    menuPosition="fixed"
                                                    menuPortalTarget={typeof window !== "undefined" ? document.body : null}
                                                />
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-4">
                                            <label className="w-[20%] text-sm text-gray-400">{translations["To"]}</label>
                                            <div className="w-[80%] flex space-x-2">
                                                <input
                                                    type="number"
                                                    value={formData.price_b_to_pcs_crtn}
                                                    onChange={(e) => {
                                                        setFormData({ ...formData, price_b_to_pcs_crtn: parseFloat(e.target.value) || 0 });
                                                        if (!isDirtyRef.current) {
                                                            setIsDirty(true); // ✅ only if user is editing
                                                        }
                                                    }}
                                                    className="w-1/2 px-3 py-2 border-[1px] border-[#ffffff1a] rounded-lg text-[#ffffffcc] text-custom-sm focus:outline-none focus:border-cyan-500"
                                                    style={{ backgroundColor: "#2b2e31" }}
                                                />
                                                <Select
                                                    value={unitOptions.find((o) => o.value === String(formData.pcs_or_crtn))}
                                                    onChange={(selected) => {
                                                        setFormData({ ...formData, pcs_or_crtn: selected ? parseInt(selected.value, 10) : 0 });
                                                        if (!isDirtyRef.current) {
                                                            setIsDirty(true); // ✅ only if user is editing
                                                        }
                                                    }}
                                                    classNamePrefix="react-select"
                                                    options={unitOptions}
                                                    styles={{
                                                        ...selectStyles,
                                                        menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                                                    }}
                                                    className="w-1/2"
                                                    isClearable
                                                    placeholder={translations["Select"]}
                                                    menuPlacement="auto"
                                                    menuPosition="fixed"
                                                    menuPortalTarget={typeof window !== "undefined" ? document.body : null}
                                                />
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-4">
                                            <label className="w-[20%] text-sm text-gray-400">{translations["Price"]}</label>
                                            <div className="flex w-[80%]">
                                                <input
                                                    type="text"
                                                    readOnly
                                                    value={formData.currency}
                                                    onChange={(e) => {
                                                        setFormData({ ...formData, currency: e.target.value });
                                                        if (!isDirtyRef.current) {
                                                            setIsDirty(true); // ✅ only if user is editing
                                                        }
                                                    }}
                                                    className="w-[20%] px-3 py-2 border-[1px] border-[#ffffff1a] rounded-lg text-[#ffffffcc] text-custom-sm focus:outline-none focus:border-cyan-500"
                                                />
                                                <input
                                                    type="number"
                                                    value={formData.price_b}
                                                    onChange={(e) => {
                                                        setFormData({ ...formData, price_b: parseFloat(e.target.value) || 0 });
                                                        if (!isDirtyRef.current) {
                                                            setIsDirty(true); // ✅ only if user is editing
                                                        }
                                                    }}
                                                    onBlur={() => calculatePercentage("price_b")}
                                                    className="w-[40%] flex-1 px-3 py-2 border-[1px] border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm rounded-r-lg text-[#ffffffcc] text-custom-sm focus:outline-none focus:border-cyan-500"
                                                />
                                                <input
                                                    type="text"
                                                    value={`${formData.profit_prcnt_b}%`}
                                                    readOnly
                                                    style={{ color: getProfitColor(formData.profit_prcnt_b) }}
                                                    className="w-[40%] flex-2 px-3 py-2 border-[1px] border-[#ffffff1a] rounded-r-lg text-[#ffffffcc] text-custom-sm focus:outline-none focus:border-cyan-500"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    {/* Row 4: Price C Two dropdowns side-by-side */}
                                    <div className="grid grid-cols-3 gap-6">
                                        <div className="flex items-center space-x-4">
                                            <label className="w-1/3 text-sm text-gray-400">{translations["Price C"]}</label>
                                            <div className="w-2/3 flex space-x-2">
                                                <input
                                                    type="number"
                                                    value={formData.price_c_pcs_crtn}
                                                    onChange={(e) => {
                                                        setFormData({ ...formData, price_c_pcs_crtn: parseFloat(e.target.value) || 0 });
                                                        if (!isDirtyRef.current) {
                                                            setIsDirty(true); // ✅ only if user is editing
                                                        }
                                                    }}
                                                    className="w-1/2 px-3 py-2 border-[1px] border-[#ffffff1a] rounded-lg text-[#ffffffcc] text-custom-sm focus:outline-none focus:border-cyan-500"
                                                />
                                                <Select
                                                    value={unitOptions.find((o) => o.value === String(formData.pcs_or_crtn))}
                                                    onChange={(selected) => {
                                                        setFormData({ ...formData, pcs_or_crtn: selected ? parseInt(selected.value, 10) : 0 });
                                                        if (!isDirtyRef.current) {
                                                            setIsDirty(true); // ✅ only if user is editing
                                                        }
                                                    }}
                                                    classNamePrefix="react-select"
                                                    options={unitOptions}
                                                    styles={{
                                                        ...selectStyles,
                                                        menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                                                    }}
                                                    className="w-1/2"
                                                    isClearable
                                                    placeholder={translations["Select"]}
                                                    menuPlacement="auto"
                                                    menuPosition="fixed"
                                                    menuPortalTarget={typeof window !== "undefined" ? document.body : null}
                                                />
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-4">
                                            <label className="w-[20%] text-sm text-gray-400">{translations["To"]}</label>
                                            <div className="w-[80%] flex space-x-2">
                                                <input
                                                    type="number"
                                                    value={formData.price_c_to_pcs_crtn}
                                                    onChange={(e) => {
                                                        setFormData({ ...formData, price_c_to_pcs_crtn: parseFloat(e.target.value) || 0 });
                                                        if (!isDirtyRef.current) {
                                                            setIsDirty(true); // ✅ only if user is editing
                                                        }
                                                    }}
                                                    className="w-1/2 px-3 py-2 border-[1px] border-[#ffffff1a] rounded-lg text-[#ffffffcc] text-custom-sm focus:outline-none focus:border-cyan-500"
                                                />
                                                <Select
                                                    value={unitOptions.find((o) => o.value === String(formData.pcs_or_crtn))}
                                                    onChange={(selected) => {
                                                        setFormData({ ...formData, pcs_or_crtn: selected ? parseInt(selected.value, 10) : 0 });
                                                        if (!isDirtyRef.current) {
                                                            setIsDirty(true); // ✅ only if user is editing
                                                        }
                                                    }}
                                                    classNamePrefix="react-select"
                                                    options={unitOptions}
                                                    styles={{
                                                        ...selectStyles,
                                                        menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                                                    }}
                                                    className="w-1/2"
                                                    isClearable
                                                    placeholder={translations["Select"]}
                                                    menuPlacement="auto"
                                                    menuPosition="fixed"
                                                    menuPortalTarget={typeof window !== "undefined" ? document.body : null}
                                                />
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-4">
                                            <label className="w-[20%] text-sm text-gray-400">{translations["Price"]}</label>
                                            <div className="flex w-[80%]">
                                                <input
                                                    type="text"
                                                    readOnly
                                                    value={formData.currency}
                                                    onChange={(e) => {
                                                        setFormData({ ...formData, currency: e.target.value });
                                                        if (!isDirtyRef.current) {
                                                            setIsDirty(true); // ✅ only if user is editing
                                                        }
                                                    }}
                                                    className="w-[20%] px-3 py-2 border-[1px] border-[#ffffff1a] rounded-lg text-[#ffffffcc] text-custom-sm focus:outline-none focus:border-cyan-500"
                                                />
                                                <input
                                                    type="number"
                                                    value={formData.price_c}
                                                    onChange={(e) => {
                                                        setFormData({ ...formData, price_c: parseFloat(e.target.value) || 0 });
                                                        if (!isDirtyRef.current) {
                                                            setIsDirty(true); // ✅ only if user is editing
                                                        }
                                                    }}
                                                    onBlur={() => calculatePercentage("price_c")}
                                                    className="w-[40%] flex-1 px-3 py-2 border-[1px] border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm rounded-r-lg text-[#ffffffcc] text-custom-sm focus:outline-none focus:border-cyan-500"
                                                />
                                                <input
                                                    type="text"
                                                    value={`${formData.profit_prcnt_c}%`}
                                                    readOnly
                                                    style={{ color: getProfitColor(formData.profit_prcnt_c) }}
                                                    className="w-[40%] flex-2 px-3 py-2 border-[1px] border-[#ffffff1a] rounded-r-lg text-[#ffffffcc] text-custom-sm focus:outline-none focus:border-cyan-500"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Wholesale Pricing Table */}
                                {wholesalePricing.length > 0 && (
                                    <div className="overflow-x-auto mt-5">
                                        <table className="w-full border-[1px] border-[#ffffff1a] rounded-lg" style={{ backgroundColor: "#060818" }}>
                                            <thead style={{ backgroundColor: "#2b2e31" }}>
                                                <tr>
                                                    <th className="px-4 py-3 text-left text-gray-400 text-sm">{translations["Customer Group"]}</th>
                                                    <th className="px-4 py-3 text-center text-gray-400 text-sm">{translations["Currency"]}</th>
                                                    <th className="px-4 py-3 text-center text-gray-400 text-sm">{translations["Price A"]}</th>
                                                    <th className="px-4 py-3 text-center text-gray-400 text-sm">{translations["Profit % A"]}</th>
                                                    <th className="px-4 py-3 text-center text-gray-400 text-sm">{translations["Price B"]}</th>
                                                    <th className="px-4 py-3 text-center text-gray-400 text-sm">{translations["Profit % B"]}</th>
                                                    <th className="px-4 py-3 text-center text-gray-400 text-sm">{translations["Price C"]}</th>
                                                    <th className="px-4 py-3 text-center text-gray-400 text-sm">{translations["Profit % C"]}</th>
                                                    <th className="px-4 py-3 text-center text-gray-400 text-sm">{translations["Deposit"]}</th>
                                                    <th className="px-4 py-3 text-center text-gray-400 text-sm">{translations["Action"]}</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {wholesalePricing.map((pricing) => (
                                                    <tr onClick={(e) => handleRowClick(e, pricing.id, "wholesale")} key={pricing.id} className="clickable border-t" style={{ borderTopColor: "#222" }}>
                                                        <td className="px-4 py-3 text-gray-300 text-sm">
                                                            {safeLang === "en" ? pricing.customer_group.customer_group_en : pricing.customer_group.customer_group_cn}
                                                        </td>
                                                        <td className="px-4 py-3 text-center text-gray-300 text-sm">{pricing.currency}</td>
                                                        <td className="px-4 py-3 text-center text-gray-300 text-sm">{pricing.price_a}</td>
                                                        <td className="px-4 py-3 text-center text-gray-300 text-sm">{pricing.profit_prcnt_a}%</td>
                                                        <td className="px-4 py-3 text-center text-gray-300 text-sm">{pricing.price_b}</td>
                                                        <td className="px-4 py-3 text-center text-gray-300 text-sm">{pricing.profit_prcnt_b}%</td>
                                                        <td className="px-4 py-3 text-center text-gray-300 text-sm">{pricing.price_c}</td>
                                                        <td className="px-4 py-3 text-center text-gray-300 text-sm">{pricing.profit_prcnt_c}%</td>
                                                        <td className="px-4 py-3 text-center text-gray-300 text-sm">{pricing.deposit}</td>
                                                        <td className="px-4 py-3 text-center">
                                                            <button
                                                                onClick={(e) => handleDelPrice(e, pricing.id, "wholesale")}
                                                                key={pricing.id}
                                                                className="px-1 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-xs"
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        )}
                        {activePricingTab === "retail" && (
                            <div>
                                {/* Pricing Form - Exact Layout from Image */}
                                <div className="grid gap-4">
                                    {/* Row 1: Customer Group + Deposit */}
                                    <div className="grid grid-cols-3 gap-6">
                                        <div className="flex items-center space-x-4">
                                            <label className="w-[30%] text-sm text-gray-400">{translations["Customer Group"]}</label>
                                            <Select
                                                classNamePrefix="react-select"
                                                value={formData.retail_customer_group_id}
                                                onChange={(selected) => {
                                                    if (selected) {
                                                        setFormData({ ...formData, retail_customer_group_id: selected });
                                                        handleCustomerGroupChange(parseInt(selected.value), "retail");
                                                        if (!isDirtyRef.current) {
                                                            setIsDirty(true); // ✅ only if user is editing
                                                        }
                                                    }
                                                }}
                                                options={customerGroupOptions}
                                                styles={{
                                                    ...selectStyles,
                                                    menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                                                }}
                                                className="w-[70%]"
                                                isClearable
                                                placeholder={translations["Select"]}
                                                menuPlacement="auto"
                                                menuPosition="fixed"
                                                menuPortalTarget={typeof window !== "undefined" ? document.body : null}
                                            />
                                        </div>
                                        <div className="flex items-center space-x-4">
                                            <label className="w-[30%] text-sm text-gray-400">{translations["Deposit"]}</label>
                                            <div className="flex w-[70%]">
                                                <input
                                                    type="text"
                                                    disabled
                                                    value={formData.retail_currency}
                                                    onChange={(e) => {
                                                        setFormData({ ...formData, retail_currency: e.target.value });
                                                        if (!isDirtyRef.current) {
                                                            setIsDirty(true); // ✅ only if user is editing
                                                        }
                                                    }}
                                                    className="w-[20%] flex-1 px-3 py-2 border-[1px] border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm rounded-r-lg text-[#ffffffcc]"
                                                />
                                                <input
                                                    type="number"
                                                    value={formData.retail_deposit}
                                                    onChange={(e) => {
                                                        setFormData((prev) => ({ ...prev, retail_deposit: parseFloat(e.target.value) || 0 }));
                                                        if (!isDirtyRef.current) {
                                                            setIsDirty(true); // ✅ only if user is editing
                                                        }
                                                    }}
                                                    className="w-[80%] flex-2 px-3 py-2 border-[1px] border-[#ffffff1a] rounded-r-lg text-[#ffffffcc] text-custom-sm focus:outline-none focus:border-cyan-500"
                                                />
                                            </div>
                                        </div>
                                        <div />
                                    </div>
                                    {/* Row 2: Price A Two dropdowns side-by-side */}
                                    <div className="grid grid-cols-3 gap-6">
                                        <div className="flex items-center space-x-4">
                                            <label className="w-[30%] text-sm text-gray-400">{translations["Retail Price"]}</label>
                                            <div className="flex w-[70%]">
                                                <input
                                                    disabled
                                                    type="text"
                                                    value={formData.retail_currency}
                                                    onChange={(e) => {
                                                        setFormData((prev) => ({ ...prev, retail_currency: e.target.value }));
                                                        if (!isDirtyRef.current) {
                                                            setIsDirty(true); // ✅ only if user is editing
                                                        }
                                                    }}
                                                    className="w-[20%] flex-1 px-3 py-2 border-[1px] border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm rounded-r-lg text-[#ffffffcc]"
                                                />
                                                <input
                                                    type="number"
                                                    value={formData.retail_price}
                                                    onChange={(e) => {
                                                        setFormData((prev) => ({ ...prev, retail_price: parseFloat(e.target.value) || 0 }));
                                                        if (!isDirtyRef.current) {
                                                            setIsDirty(true); // ✅ only if user is editing
                                                        }
                                                    }}
                                                    onBlur={() => calculateRetailPercentage()}
                                                    className="w-[80%] flex-2 px-3 py-2 border-[1px] border-[#ffffff1a] rounded-r-lg text-[#ffffffcc] text-custom-sm focus:outline-none focus:border-cyan-500"
                                                />
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-4">
                                            <label className="w-[30%] text-sm text-gray-400">{translations["Preorder Price"]}</label>
                                            <div className="flex w-[70%]">
                                                <input
                                                    type="text"
                                                    disabled
                                                    value={formData.retail_currency}
                                                    onChange={(e) => {
                                                        setFormData((prev) => ({ ...prev, retail_currency: e.target.value }));
                                                        if (!isDirtyRef.current) {
                                                            setIsDirty(true); // ✅ only if user is editing
                                                        }
                                                    }}
                                                    className="w-[20%] flex-1 px-3 py-2 border-[1px] border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm rounded-r-lg text-[#ffffffcc]"
                                                />
                                                <input
                                                    type="number"
                                                    value={formData.retail_preorder_price}
                                                    onChange={(e) => {
                                                        setFormData({ ...formData, retail_preorder_price: parseFloat(e.target.value) || 0 });
                                                        if (!isDirtyRef.current) {
                                                            setIsDirty(true); // ✅ only if user is editing
                                                        }
                                                    }}
                                                    onBlur={calculateRetailPercentage}
                                                    className="w-[80%] flex-2 px-3 py-2 border-[1px] border-[#ffffff1a] rounded-r-lg text-[#ffffffcc] text-custom-sm focus:outline-none focus:border-cyan-500"
                                                />
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-4">
                                            <label className="w-[20%] text-sm text-gray-400">{translations["Profit"]} %</label>
                                            <input
                                                type="text"
                                                disabled
                                                value={`${formData.retail_profit_prcnt_a}%`}
                                                readOnly
                                                style={{ color: getProfitColor(formData.retail_profit_prcnt_a) }}
                                                className="w-[80%] px-3 py-2 border-[1px] border-[#ffffff1a] rounded-lg text-[#ffffffcc] text-custom-sm focus:outline-none focus:border-cyan-500"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Wholesale Pricing Table */}
                                {retailPricing.length > 0 && (
                                    <div className="overflow-x-auto mt-5">
                                        <table className="w-full border-[1px] border-[#ffffff1a] rounded-lg" style={{ backgroundColor: "#060818" }}>
                                            <thead style={{ backgroundColor: "#2b2e31" }}>
                                                <tr>
                                                    <th className="px-4 py-3 text-left text-gray-200 text-sm">{translations["Customer Group"]}</th>
                                                    <th className="px-4 py-3 text-center text-gray-400 text-sm">{translations["Currency"]}</th>
                                                    <th className="px-4 py-3 text-center text-gray-400 text-sm">{translations["Retail Price"]}</th>
                                                    <th className="px-4 py-3 text-center text-gray-400 text-sm">{translations["Preorder Price"]}</th>
                                                    <th className="px-4 py-3 text-center text-gray-400 text-sm">{translations["Profit"]}%</th>
                                                    <th className="px-4 py-3 text-center text-gray-400 text-sm">{translations["Deposit"]}</th>
                                                    <th className="px-4 py-3 text-center text-gray-400 text-sm">{translations["Action"]}</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {retailPricing.map((pricing) => (
                                                    <tr key={pricing.id} onClick={(e) => handleRowClick(e, pricing.id, "retail")} className="clickable border-t" style={{ borderTopColor: "#222" }}>
                                                        <td className="px-4 py-3 text-gray-300 text-sm">
                                                            {safeLang === "en" ? pricing.customer_group.customer_group_en : pricing.customer_group.customer_group_cn}
                                                        </td>
                                                        <td className="px-4 py-3 text-center text-gray-300 text-sm">{pricing.currency}</td>
                                                        <td className="px-4 py-3 text-center text-gray-300 text-sm">{pricing.retail_price}</td>
                                                        <td className="px-4 py-3 text-center text-gray-300 text-sm">{pricing.preorder_price}</td>
                                                        <td className="px-4 py-3 text-center text-gray-300 text-sm">{pricing.profit_prcnt_a}%</td>
                                                        <td className="px-4 py-3 text-center text-gray-300 text-sm">{pricing.deposit}</td>
                                                        <td className="px-4 py-3 text-center">
                                                            <button
                                                                onClick={(e) => handleDelPrice(e, pricing.id, "retail")}
                                                                key={pricing.id}
                                                                className="px-1 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-xs"
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
    const renderProfitability = () => (
        <div className="p-6">
            <div className="h-[calc(100vh-170px)] overflow-y-auto pr-2">
                <fieldset className="border-[1px] border-[#ffffff1a] rounded-lg p-4 space-y-4 mb-2">
                    <div className="overflow-x-auto mt-5">
                        <table className="w-full border-[1px] border-[#ffffff1a] rounded-lg">
                            <thead style={{ backgroundColor: "#2b2e31" }}>
                                <tr>
                                    <th className="px-4 py-3 text-left text-gray-400 text-sm">{translations["Customer Code"]}</th>
                                    <th className="px-4 py-3 text-left text-gray-400 text-sm">{translations["Customer Name"]}</th>
                                    <th className="px-4 py-3 text-left text-gray-400 text-sm">{translations["Invoice No"]}</th>
                                    <th className="px-4 py-3 text-center text-gray-400 text-sm">{translations["Currency"]}</th>
                                    <th className="px-4 py-3 text-center text-gray-400 text-sm">{translations["Qty"]}</th>
                                    <th className="px-4 py-3 text-center text-gray-400 text-sm">{translations["PriceEach"]}</th>
                                    <th className="px-4 py-3 text-center text-gray-400 text-sm">{translations["Total Price"]}</th>
                                    <th className="px-4 py-3 text-center text-gray-400 text-sm">{translations["Cost Each"]}</th>
                                    <th className="px-4 py-3 text-center text-gray-400 text-sm">{translations["Total Cost"]}</th>
                                    <th className="px-4 py-3 text-center text-gray-400 text-sm">{translations["Profit"]}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {profitabilityOrder.length === 0 && (
                                    <tr className="border-t border-gray-600 clickable">
                                        <td colSpan={10} className="px-4 py-3 text-center text-gray-300 text-sm">
                                            {translations["No Record Found"]}
                                        </td>
                                    </tr>
                                )}
                                {profitabilityOrder.length > 0 &&
                                    profitabilityOrder.map((profitOrder) => (
                                        <tr className="border-t border-gray-600 clickable">
                                            <td className="px-4 py-3 text-left text-gray-300 text-sm">
                                                <div className="group flex items-center">
                                                    <p className="text-gray-400 text-custom-sm">{profitOrder.customer_code}</p>
                                                    <CopyToClipboard text={profitOrder.customer_code} />
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-left text-gray-300 text-sm">{profitOrder.customer_name}</td>
                                            <td className="px-4 py-3 text-left text-gray-300 text-sm">
                                                <div className="group flex items-center">
                                                    <p className="text-gray-400 text-custom-sm">{profitOrder.invoice_no}</p>
                                                    <CopyToClipboard text={profitOrder.invoice_no} />
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-center text-gray-300 text-sm">{profitOrder.currency}</td>
                                            <td className="px-4 py-3 text-center text-gray-300 text-sm">{profitOrder.qty}</td>
                                            <td className="px-4 py-3 text-center text-gray-300 text-sm">{profitOrder.price}</td>
                                            <td className="px-4 py-3 text-center text-gray-300 text-sm">{profitOrder.total_price}</td>
                                            <td className="px-4 py-3 text-center text-gray-300 text-sm">{profitOrder.item_cost}</td>
                                            <td className="px-4 py-3 text-center text-gray-300 text-sm">{profitOrder.total_cost}</td>
                                            <td className="px-4 py-3 text-center text-gray-300 text-sm">{profitOrder.profit}</td>
                                        </tr>
                                    ))}
                            </tbody>
                        </table>
                        <div className="flex justify-center mt-4">
                            <div className="flex justify-center mt-4">
                                <MemoizedPagination currentPage={currentPage_Order} totalPages={paginationOrder.last_page} onPageChange={(page) => setCurrentPage_Order(page)} />
                            </div>
                        </div>
                    </div>
                </fieldset>
                <fieldset className="border-[1px] border-[#ffffff1a] rounded-lg p-4 space-y-4 mb-2">
                    <div className="overflow-x-auto mt-5">
                        <table className="w-full border-[1px] border-[#ffffff1a] rounded-lg">
                            <thead style={{ backgroundColor: "#2b2e31" }}>
                                <tr>
                                    <th className="px-4 py-3 text-left text-gray-400 text-sm">{translations["Customer Code"]}</th>
                                    <th className="px-4 py-3 text-left text-gray-400 text-sm">{translations["Customer Name"]}</th>
                                    <th className="px-4 py-3 text-left text-gray-400 text-sm">{translations["Invoice No"]}</th>
                                    <th className="px-4 py-3 text-center text-gray-400 text-sm">{translations["Currency"]}</th>
                                    <th className="px-4 py-3 text-center text-gray-400 text-sm">{translations["Qty"]}</th>
                                    <th className="px-4 py-3 text-center text-gray-400 text-sm">{translations["PriceEach"]}</th>
                                    <th className="px-4 py-3 text-center text-gray-400 text-sm">{translations["Total Price"]}</th>
                                    <th className="px-4 py-3 text-center text-gray-400 text-sm">{translations["Cost Each"]}</th>
                                    <th className="px-4 py-3 text-center text-gray-400 text-sm">{translations["Total Cost"]}</th>
                                    <th className="px-4 py-3 text-center text-gray-400 text-sm">{translations["Profit"]}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {profitabilityInvoice.length === 0 && (
                                    <tr className="border-t border-gray-600 clickable">
                                        <td colSpan={10} className="px-4 py-3 text-center text-gray-300 text-sm">
                                            {translations["No Record Found"]}
                                        </td>
                                    </tr>
                                )}
                                {profitabilityInvoice.length > 0 &&
                                    profitabilityInvoice.map((profitInvoice) => (
                                        <tr className="border-t border-gray-600 clickable">
                                            <td className="px-4 py-3 text-left text-gray-300 text-sm">
                                                <div className="group flex items-center">
                                                    <p className="text-gray-400 text-custom-sm">{profitInvoice.customer_code}</p>
                                                    <CopyToClipboard text={profitInvoice.customer_code} />
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-left text-gray-300 text-sm">{profitInvoice.customer_name}</td>
                                            <td className="px-4 py-3 text-left text-gray-300 text-sm">
                                                <div className="group flex items-center">
                                                    <p className="text-gray-400 text-custom-sm">{profitInvoice.invoice_no}</p>
                                                    <CopyToClipboard text={profitInvoice.invoice_no} />
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-center text-gray-300 text-sm">{profitInvoice.currency}</td>
                                            <td className="px-4 py-3 text-center text-gray-300 text-sm">{profitInvoice.qty}</td>
                                            <td className="px-4 py-3 text-center text-gray-300 text-sm">{profitInvoice.price}</td>
                                            <td className="px-4 py-3 text-center text-gray-300 text-sm">{profitInvoice.total_price}</td>
                                            <td className="px-4 py-3 text-center text-gray-300 text-sm">{profitInvoice.item_cost}</td>
                                            <td className="px-4 py-3 text-center text-gray-300 text-sm">{profitInvoice.total_cost}</td>
                                            <td className="px-4 py-3 text-center text-gray-300 text-sm">{profitInvoice.profit}</td>
                                        </tr>
                                    ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="flex justify-center mt-4">
                        <div className="flex justify-center mt-4">
                            <MemoizedPagination currentPage={currentPage_Invoice} totalPages={paginationInvoice.last_page} onPageChange={(page) => setCurrentPage_Invoice(page)} />
                        </div>
                    </div>
                </fieldset>
            </div>
        </div>
    );
    // Image Gallery Modal
    const renderImageGallery = () => {
        if (!showImageGallery) return null;

        const allImages = getAllImages();
        const isAllSelected = allImages.length > 0 && selectedImages.length === allImages.length;

        return (
            <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
                <div className="bg-[#19191c] rounded-xl border border-[#ffffff1a] w-[90vw] h-auto flex flex-col">
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-[#ffffff1a]">
                        <div className="flex items-center space-x-4">
                            <h2 className="text-xl font-bold text-white">{translations["Image Gallery"] || "Image Gallery"}</h2>
                            <span className="text-gray-400">({allImages.length} images)</span>
                        </div>
                        <div className="flex items-center space-x-4">
                            {allImages.length > 0 && (
                                <>
                                    <label className="flex items-center space-x-1 text-gray-400 cursor-pointer" onClick={(e) => e.stopPropagation()}>
                                        <input
                                            type="checkbox"
                                            checked={isAllSelected}
                                            onChange={(e) => {
                                                e.stopPropagation();
                                                handleSelectAllImages(e.target.checked);
                                            }}
                                            className="w-4 h-4 text-cyan-600 bg-gray-700 border-gray-600 rounded focus:ring-cyan-500"
                                        />
                                        <span>Select All</span>
                                    </label>
                                    {selectedImages.length > 0 && (
                                        <button
                                            onClick={handleDeleteSelectedImages}
                                            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center space-x-1"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                            <span>Delete ({selectedImages.length})</span>
                                        </button>
                                    )}
                                </>
                            )}
                            <button
                                onClick={() => {
                                    setShowImageGallery(false);
                                    setSelectedImages([]);
                                }}
                                className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                            >
                                <X className="h-6 w-6 text-white" />
                            </button>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="p-2 flex-1 overflow-auto">
                        <div className="max-h-[calc(100vh-435px)] overflow-y-auto">
                            {allImages.length === 0 ? (
                                <div className="flex items-center justify-center h-full">
                                    <div className="text-center">
                                        <Images className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                                        <p className="text-gray-400 text-lg">No images uploaded</p>
                                        <p className="text-gray-500">Upload some images to see them here</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="grid grid-cols-6 gap-4">
                                    {allImages.map((image) => {
                                        const isSelected = selectedImages.includes(image.id);
                                        return (
                                            <div
                                                key={image.id}
                                                className={`relative group border-2 rounded-lg overflow-hidden transition-all cursor-pointer ${
                                                    isSelected ? "border-cyan-500 ring-2 ring-cyan-500 ring-opacity-50" : "border-gray-600 hover:border-gray-500"
                                                }`}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleImageSelect(image.id, !isSelected);
                                                }}
                                            >
                                                {/* Checkbox */}
                                                <div className="absolute top-2 left-2 z-10" onClick={(e) => e.stopPropagation()}>
                                                    <input
                                                        type="checkbox"
                                                        checked={isSelected}
                                                        onChange={(e) => {
                                                            e.stopPropagation();
                                                            handleImageSelect(image.id, e.target.checked);
                                                        }}
                                                        className="w-4 h-4 text-cyan-600 bg-gray-700 border-gray-600 rounded focus:ring-cyan-500"
                                                    />
                                                </div>

                                                {/* Type Badge */}
                                                <div className="absolute top-2 right-2 z-10">
                                                    <span className={`px-2 py-1 text-xs font-medium text-white rounded ${getTypeBadgeColor(image.type)}`}>
                                                        {image.type === "slide" && image.index !== undefined ? `Slide ${image.index + 1}` : image.type.charAt(0).toUpperCase() + image.type.slice(1)}
                                                    </span>
                                                </div>

                                                {/* Image */}
                                                <img
                                                    src={getImageUrl(image)}
                                                    alt={`${image.type} image`}
                                                    className="w-full h-40 object-cover"
                                                    onError={(e) => {
                                                        const target = e.target as HTMLImageElement;
                                                        target.src = "https://tnt2.simplify.cool/images/no-image-min.jpg";
                                                    }}
                                                />

                                                {/* Overlay on hover */}
                                                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200" />
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    };
    // Image Gallery Modal
    const renderCopyPopup = () => {
        if (!showCopyProduct) return null;
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-[#19191c] rounded-xl border border-[#ffffff1a] w-[50vw] h-auto flex flex-col">
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-[#ffffff1a]">
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
                    <div className="flex-1 overflow-auto p-6">
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
                                        if (!isDirtyRef.current) {
                                            setIsDirty(true); // ✅ only if user is editing
                                        }
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
                    <div className="p-2 border-t border-[#ffffff1a] flex justify-end space-x-1">
                        <button onClick={() => setShowCopyProduct(false)} className="px-2 py-2 bg-gray-700 hover:bg-gray-600 rounded text-white transition">
                            {translations["Close"]}
                        </button>
                        <button onClick={handleCopyProduct} className="px-2 py-2 bg-cyan-600 hover:bg-cyan-500 rounded text-white transition">
                            {translations["Save"]}
                        </button>
                    </div>
                </div>
            </div>
        );
    };
    // Image Gallery Modal
    const renderPopupDropdowns = () => {
        if (!showPopupDropdown) return null;
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-[#19191c] rounded-xl border border-[#ffffff1a] w-[30vw] h-auto flex flex-col">
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-[#ffffff1a]">
                        <div className="flex items-center space-x-4">
                            <h2 className="text-xl font-bold text-white">{translations[popupDropdownTitle]}</h2>
                        </div>
                        <div className="flex items-center space-x-4">
                            <button
                                onClick={() => {
                                    setShowPopupDropdown(false);
                                }}
                                className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                            >
                                <X className="h-6 w-6 text-white" />
                            </button>
                        </div>
                    </div>
                    {/* Content */}
                    <div className="flex-1 p-6">
                        {popupDropdownTitle === "Product Type" ? (
                            <div className="grid grid-cols-1 gap-2">
                                <div className="flex items-center space-x-4">
                                    <label className="w-32 text-gray-400 text-sm">
                                        {translations["Description"]} <sup>EN</sup>
                                    </label>
                                    <input
                                        type="text"
                                        value={formData_Dropdown.en}
                                        onChange={(e) => {
                                            const value = e.target.value;
                                            setFormData_Dropdown((prev) => ({ ...prev, en: value }));
                                        }}
                                        className="flex-1 px-3 py-2 border-[1px] border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm"
                                    />
                                </div>
                                <div className="flex items-center space-x-4">
                                    <label className="w-32 text-gray-400 text-sm">
                                        {translations["Description"]} <sup>CN</sup>
                                    </label>
                                    <input
                                        type="text"
                                        value={formData_Dropdown.cn}
                                        onChange={(e) => {
                                            const value = e.target.value;
                                            setFormData_Dropdown((prev) => ({ ...prev, cn: value }));
                                        }}
                                        className="flex-1 px-3 py-2 border-[1px] border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm"
                                    />
                                </div>
                                <div className="flex items-center space-x-4">
                                    <label className="w-32 text-gray-400 text-sm">{translations["Product Type"]}</label>
                                    <Select
                                        classNamePrefix="react-select"
                                        options={productTypeOptions}
                                        styles={{
                                            ...selectStyles,
                                            menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                                        }}
                                        className="flex-1"
                                        isClearable
                                        placeholder={translations["Select"]}
                                        value={productTypeOptions.find((option) => option.value === selectedDropdownId) || null}
                                        onChange={(selected) => {
                                            const selectedId = selected ? selected.value : null;
                                            handleSelectChange(selectedId, "ProductType");
                                            setFormData_Dropdown((prev) => ({ ...prev, value: selectedId }));
                                        }}
                                        components={{
                                            Option: (props) => <CustomOption {...props} type="ProductType" />,
                                        }}
                                        menuPlacement="auto"
                                        menuPosition="fixed"
                                        menuPortalTarget={typeof window !== "undefined" ? document.body : null}
                                    />
                                </div>
                            </div>
                        ) : popupDropdownTitle === "Manufacturer" ? (
                            <div className="grid grid-cols-1 gap-2">
                                <div className="flex items-center space-x-4">
                                    <label className="w-32 text-gray-400 text-sm">
                                        {translations["Description"]} <sup>EN</sup>
                                    </label>
                                    <input
                                        type="text"
                                        value={formData_Dropdown.en}
                                        onChange={(e) => {
                                            const value = e.target.value;
                                            setFormData_Dropdown((prev) => ({ ...prev, en: value }));
                                        }}
                                        className="flex-1 px-3 py-2 border-[1px] border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm"
                                    />
                                </div>
                                <div className="flex items-center space-x-4">
                                    <label className="w-32 text-gray-400 text-sm">
                                        {translations["Description"]} <sup>CN</sup>
                                    </label>
                                    <input
                                        type="text"
                                        value={formData_Dropdown.cn}
                                        onChange={(e) => {
                                            const value = e.target.value;
                                            setFormData_Dropdown((prev) => ({ ...prev, cn: value }));
                                        }}
                                        className="flex-1 px-3 py-2 border-[1px] border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm"
                                    />
                                </div>
                                <div className="flex items-center space-x-4">
                                    <label className="w-32 text-gray-400 text-sm">{translations["Manufacturer"]}</label>
                                    <Select
                                        classNamePrefix="react-select"
                                        options={manufacturerOptions}
                                        styles={{
                                            ...selectStyles,
                                            menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                                        }}
                                        className="flex-1"
                                        isClearable
                                        placeholder={translations["Select"]}
                                        value={manufacturerOptions.find((option) => option.value === selectedDropdownId) || null}
                                        onChange={(selected) => {
                                            const selectedId = selected ? selected.value : null;
                                            handleSelectChange(selectedId, "Manufacturer");
                                            setFormData_Dropdown((prev) => ({ ...prev, value: selectedId }));
                                        }}
                                        components={{
                                            Option: (props) => <CustomOption {...props} type="Manufacturer" />,
                                        }}
                                        menuPlacement="auto"
                                        menuPosition="fixed"
                                        menuPortalTarget={typeof window !== "undefined" ? document.body : null}
                                    />
                                </div>
                            </div>
                        ) : popupDropdownTitle === "Series" ? (
                            <div className="grid grid-cols-1 gap-2">
                                <div className="flex items-center space-x-4">
                                    <label className="w-32 text-gray-400 text-sm">{translations["Manufacturer"]}</label>
                                    <Select
                                        classNamePrefix="react-select"
                                        options={manufacturerOptions}
                                        styles={{
                                            ...selectStyles,
                                            menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                                        }}
                                        className="flex-1"
                                        isClearable
                                        placeholder={translations["Select"]}
                                        value={manufacturerOptions.find((option) => option.value === selectedDropdownManuId)}
                                        onChange={(selected) => {
                                            const selectedId = selected ? selected.value : null;
                                            setFormData_Dropdown((prev) => ({ ...prev, value2: selectedId }));
                                        }}
                                        menuPlacement="auto"
                                        menuPosition="fixed"
                                        menuPortalTarget={typeof window !== "undefined" ? document.body : null}
                                    />
                                </div>
                                <div className="flex items-center space-x-4">
                                    <label className="w-32 text-gray-400 text-sm">
                                        {translations["Description"]} <sup>EN</sup>
                                    </label>
                                    <input
                                        type="text"
                                        value={formData_Dropdown.en}
                                        onChange={(e) => {
                                            const value = e.target.value;
                                            setFormData_Dropdown((prev) => ({ ...prev, en: value }));
                                        }}
                                        className="flex-1 px-3 py-2 border-[1px] border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm"
                                    />
                                </div>
                                <div className="flex items-center space-x-4">
                                    <label className="w-32 text-gray-400 text-sm">
                                        {translations["Description"]} <sup>CN</sup>
                                    </label>
                                    <input
                                        type="text"
                                        value={formData_Dropdown.cn}
                                        onChange={(e) => {
                                            const value = e.target.value;
                                            setFormData_Dropdown((prev) => ({ ...prev, cn: value }));
                                        }}
                                        className="flex-1 px-3 py-2 border-[1px] border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm"
                                    />
                                </div>
                                <div className="flex items-center space-x-4">
                                    <label className="w-32 text-gray-400 text-sm">{translations["Series"]}</label>
                                    <Select
                                        classNamePrefix="react-select"
                                        options={seriesOptions}
                                        styles={{
                                            ...selectStyles,
                                            menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                                        }}
                                        className="flex-1"
                                        isClearable
                                        placeholder={translations["Select"]}
                                        value={seriesOptions.find((option) => option.value === selectedDropdownId) || null}
                                        onChange={(selected) => {
                                            const selectedId = selected ? selected.value : null;
                                            handleSelectChange(selectedId, "Series");
                                            setFormData_Dropdown((prev) => ({ ...prev, value: selectedId }));
                                        }}
                                        components={{
                                            Option: (props) => <CustomOption {...props} type="Series" />,
                                        }}
                                        menuPlacement="auto"
                                        menuPosition="fixed"
                                        menuPortalTarget={typeof window !== "undefined" ? document.body : null}
                                    />
                                </div>
                            </div>
                        ) : popupDropdownTitle === "Brand" ? (
                            <div className="grid grid-cols-1 gap-2">
                                <div className="flex items-center space-x-4">
                                    <label className="w-32 text-gray-400 text-sm">
                                        {translations["Description"]} <sup>EN</sup>
                                    </label>
                                    <input
                                        type="text"
                                        value={formData_Dropdown.en}
                                        onChange={(e) => {
                                            const value = e.target.value;
                                            setFormData_Dropdown((prev) => ({ ...prev, en: value }));
                                        }}
                                        className="flex-1 px-3 py-2 border-[1px] border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm"
                                    />
                                </div>
                                <div className="flex items-center space-x-4">
                                    <label className="w-32 text-gray-400 text-sm">
                                        {translations["Description"]} <sup>CN</sup>
                                    </label>
                                    <input
                                        type="text"
                                        value={formData_Dropdown.cn}
                                        onChange={(e) => {
                                            const value = e.target.value;
                                            setFormData_Dropdown((prev) => ({ ...prev, cn: value }));
                                        }}
                                        className="flex-1 px-3 py-2 border-[1px] border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm"
                                    />
                                </div>
                                <div className="flex items-center space-x-4">
                                    <label className="w-32 text-gray-400 text-sm">{translations["Brand"]}</label>
                                    <Select
                                        classNamePrefix="react-select"
                                        options={brandOptions}
                                        styles={{
                                            ...selectStyles,
                                            menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                                        }}
                                        className="flex-1"
                                        isClearable
                                        placeholder={translations["Select"]}
                                        value={brandOptions.find((option) => option.value === selectedDropdownId) || null}
                                        onChange={(selected) => {
                                            const selectedId = selected ? selected.value : null;
                                            handleSelectChange(selectedId, "Brand");
                                            setFormData_Dropdown((prev) => ({ ...prev, value: selectedId }));
                                        }}
                                        components={{
                                            Option: (props) => <CustomOption {...props} type="Brand" />,
                                        }}
                                        menuPlacement="auto"
                                        menuPosition="fixed"
                                        menuPortalTarget={typeof window !== "undefined" ? document.body : null}
                                    />
                                </div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-2">
                                <div className="flex items-center space-x-4">
                                    <label className="w-32 text-gray-400 text-sm">
                                        {translations["Description"]} <sup>EN</sup>
                                    </label>
                                    <input
                                        type="text"
                                        value={formData_Dropdown.en}
                                        onChange={(e) => {
                                            const value = e.target.value;
                                            setFormData_Dropdown((prev) => ({ ...prev, en: value }));
                                        }}
                                        className="flex-1 px-3 py-2 border-[1px] border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm"
                                    />
                                </div>
                                <div className="flex items-center space-x-4">
                                    <label className="w-32 text-gray-400 text-sm">
                                        {translations["Description"]} <sup>CN</sup>
                                    </label>
                                    <input
                                        type="text"
                                        value={formData_Dropdown.cn}
                                        onChange={(e) => {
                                            const value = e.target.value;
                                            setFormData_Dropdown((prev) => ({ ...prev, cn: value }));
                                        }}
                                        className="flex-1 px-3 py-2 border-[1px] border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm"
                                    />
                                </div>
                                <div className="flex items-center space-x-4">
                                    <label className="w-32 text-gray-400 text-sm">{translations["Genre"]}</label>
                                    <Select
                                        classNamePrefix="react-select"
                                        options={genreOptions}
                                        styles={{
                                            ...selectStyles,
                                            menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                                        }}
                                        className="flex-1"
                                        isClearable
                                        placeholder={translations["Select"]}
                                        value={genreOptions.find((option) => option.value === selectedDropdownId) || null}
                                        onChange={(selected) => {
                                            const selectedId = selected ? selected.value : null;
                                            handleSelectChange(selectedId, "Genre");
                                            setFormData_Dropdown((prev) => ({ ...prev, value: selectedId }));
                                        }}
                                        components={{
                                            Option: (props) => <CustomOption {...props} type="Genre" />,
                                        }}
                                        menuPlacement="auto"
                                        menuPosition="fixed"
                                        menuPortalTarget={typeof window !== "undefined" ? document.body : null}
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                    {/* Footer */}
                    <div className="p-2 border-t border-[#ffffff1a] flex justify-end space-x-1">
                        <button onClick={() => setShowPopupDropdown(false)} className="px-2 py-2 bg-gray-700 hover:bg-gray-600 rounded text-white transition">
                            {translations["Close"]}
                        </button>
                        <button
                            onClick={() => {
                                setSelectedDropdownId(0);
                                setSelectDropdownManuId(0);
                                setFormData_Dropdown((prev) => ({ ...prev, value: null }));
                                setFormData_Dropdown((prev) => ({ ...prev, en: "" }));
                                setFormData_Dropdown((prev) => ({ ...prev, cn: "" }));
                                setShowPopupDropdown(true);
                            }}
                            className="px-2 py-2 bg-cyan-600 hover:bg-cyan-500 rounded text-white transition"
                        >
                            {translations["New"]}
                        </button>
                        <button
                            onClick={() => {
                                handleSaveDropdown();
                            }}
                            className="px-2 py-2 bg-cyan-600 hover:bg-cyan-500 rounded text-white transition"
                        >
                            {translations["Save"]}
                        </button>
                    </div>
                </div>
            </div>
        );
    };
    if (!product) {
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
                        <button onClick={handleAddNew} className="px-2 py-2 bg-cyan-600 hover:bg-cyan-700 text-[#ffffffcc] text-custom-sm rounded-lg text-sm font-medium transition-colors">
                            {translations["Add New"]}
                        </button>
                        <button onClick={handleCopy} className="px-2 py-2 bg-cyan-600 hover:bg-cyan-700 text-[#ffffffcc] text-custom-sm rounded-lg text-sm font-medium transition-colors">
                            {translations["Copy"]}
                        </button>
                        <button
                            onClick={() => setShowImageGallery(true)}
                            className="px-2 py-2 bg-purple-600 hover:bg-purple-700 text-[#ffffffcc] text-custom-sm rounded-lg text-sm font-medium transition-colors flex items-center space-x-1"
                        >
                            <Images className="h-4 w-4" />
                            <span>
                                {translations["Library"]} ({getAllImages().length})
                            </span>
                        </button>
                        <button onClick={handleDelete} className="px-2 py-2 bg-red-600 hover:bg-red-700 text-[#ffffffcc] text-custom-sm rounded-lg text-sm font-medium transition-colors">
                            {translations["Delete"]}
                        </button>
                    </div>
                </div>
            </div>
            {/* Main Content - Scrollable */}
            <div className="flex flex-1 p-2 mb-[10px]" style={{ backgroundColor: "#19191c" }}>
                {/* Left Sidebar */}
                <fieldset className="border-[1px] border-[#ffffff1a] rounded-lg p-4 space-y-4">
                    <div className="w-80 border-r flex-shrink-0" style={{ borderColor: "transparent" }}>
                        <div className="p-6">
                            {/* Product Image */}
                            <div className="mb-6">
                                <div className="aspect-square bg-gray-800 rounded-lg flex items-center justify-center mb-4">
                                    {thumbnailImage && !thumbnailImage.isDeleted ? (
                                        <img
                                            src={getImageUrl(thumbnailImage)}
                                            alt="Product Thumbnail"
                                            className="w-full h-full object-cover rounded-lg"
                                            onError={(e) => {
                                                const target = e.target as HTMLImageElement;
                                                target.src = "https://tnt2.simplify.cool/images/no-image-min.jpg";
                                            }}
                                        />
                                    ) : (
                                        <div className="text-center">
                                            <p className="text-gray-400 text-sm">{translations["No image"] || "No image"}</p>
                                        </div>
                                    )}
                                </div>
                                <div className="flex items-center justify-center">
                                    <span className={`px-2 py-1 rounded-full text-xs text-custom-sm ${getStatusColor(product.product_status)}`}>
                                        {productStatusLocalized(product.product_status, safeLang)}
                                    </span>
                                </div>
                            </div>
                            {/* Product Code and Title */}
                            <div className="text-center mb-6">
                                <h2 className="text-xl font-bold text-[#ffffffcc] text-custom-sm mb-2">{formData.product_code}</h2>
                                <p className="text-gray-300">{safeLang == "en" ? formData.product_title_en : formData.product_title_cn}</p>
                            </div>
                            {/* Toggles */}
                            <div className="space-y-4 mb-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <span className="text-[#ffffffcc] text-custom-sm font-medium">{translations["ToyNToys"]}</span>
                                        <span className={`text-sm ml-2 ${Number(formData.is_tnt) === 1 ? "text-green-400" : "text-red-400"}`}>
                                            {Number(formData.is_tnt) === 1 ? translations["Active"] : translations["In-Active"]}
                                        </span>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={Number(formData.is_tnt) === 1}
                                            onChange={(e) => {
                                                const isChecked = e.target.checked ? 1 : 0;
                                                setFormData({ ...formData, is_tnt: isChecked });
                                                if (!isDirtyRef.current) {
                                                    setIsDirty(true);
                                                }
                                            }}
                                            className="sr-only peer"
                                        />
                                        <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:bg-green-600 transition-colors duration-200"></div>
                                        <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform duration-200 transform peer-checked:translate-x-full"></div>
                                    </label>
                                </div>

                                <div className="flex items-center justify-between">
                                    <div>
                                        <span className="text-[#ffffffcc] text-custom-sm font-medium">{translations["Wholesale"]}</span>
                                        <span className={`text-sm ml-2 ${Number(product.is_wholesale) === 1 ? "text-green-400" : "text-red-400"}`}>
                                            {Number(product.is_wholesale) === 1 ? translations["Active"] : translations["In-Active"]}
                                        </span>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={Number(formData.is_wholesale) === 1}
                                            onChange={(e) => {
                                                const isChecked = e.target.checked ? 1 : 0;
                                                setFormData({ ...formData, is_wholesale: isChecked });
                                                if (!isDirtyRef.current) {
                                                    setIsDirty(true);
                                                }
                                            }}
                                            className="sr-only peer"
                                        />
                                        <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:bg-green-600 transition-colors duration-200"></div>
                                        <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform duration-200 transform peer-checked:translate-x-full"></div>
                                    </label>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-[#ffffffcc] text-custom-sm font-medium">{translations["Last Sold Date"]}</span>
                                    <span className="text-gray-400 text-sm ml-2 text-right">{formatDate(formData.last_sold_date, lang)}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-[#ffffffcc] text-custom-sm font-medium">{translations["Last Received"]}</span>
                                    <span className="text-gray-400 text-sm ml-2 text-right">{formatDate(formData.last_received_date, lang)}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-[#ffffffcc] text-custom-sm font-medium">{translations["Cost Update"]}</span>
                                    <span className="text-gray-400 text-sm ml-2 text-right">{formatDate(formData.cost_update_date, lang)}</span>
                                </div>
                            </div>
                            {/* Basic Info */}
                        </div>
                    </div>
                </fieldset>

                {/* Main Content Area - Scrollable */}
                <div className="flex-1 overflow-auto mb-[80px]">
                    {activeTab === "information" && renderProductInformation()}
                    {activeTab === "media" && renderProductMedia()}
                    {activeTab === "price" && renderProductPrice()}
                    {activeTab === "profitability" && renderProfitability()}
                </div>
            </div>

            {/* Image Gallery Modal */}
            {renderImageGallery()}
            {renderCopyPopup()}
            {renderPopupDropdowns()}

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

export default ProductDetails;
