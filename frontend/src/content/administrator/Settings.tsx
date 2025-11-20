import React, { useState, useEffect, useMemo } from "react";
import { settingService, ApiSettings } from "@/services/settingService";
import { useLanguage } from "@/context/LanguageContext";
import Pagination from "@/components/Pagination";
import ItemsPerPageSelector from "@/components/ItemsPerPageSelector";
import { formatDateToCustom } from "@/utils/flatpickrLocale";
import CustomCheckbox from "@/components/CustomCheckbox";
import { showSuccessToast, showErrorToast } from "@/utils/toast";
import { showConfirm } from "@/utils/alert";
import Select from "react-select";
import { fetchWarehouses, fetchCountries, convertToSingleOption, convertToSingleOptionString, OptionType } from "@/utils/fetchDropdownData";
import { ChevronDown, ChevronRight, Globe, Settings, Truck, DollarSign, Users, UserCircle, X } from "lucide-react";
import { DropdownData, selectStyles } from "@/utils/globalFunction";
// Handle the Smooth skeleton loading
const MemoizedPagination = React.memo(Pagination);
const MemoizedItemsPerPageSelector = React.memo(ItemsPerPageSelector);

interface LogListsProps {
    tabId: string;
}
// localStorage.clear();
const LogLists: React.FC<LogListsProps> = ({ tabId }) => {
    const { translations, lang } = useLanguage();
    const [languageLists, setLanguages] = useState<ApiSettings[]>([]);
    const [courierLists, setCourier] = useState<ApiSettings[]>([]);
    const [shippingStatLists, setShippingStat] = useState<ApiSettings[]>([]);
    const [warehouseList, setWarehouse] = useState<ApiSettings[]>([]);
    const [shippingTermsList, setShippingTerms] = useState<ApiSettings[]>([]);
    const [taxGroupList, setTaxGroup] = useState<ApiSettings[]>([]);
    const [paymentTermsList, setPaymentTerms] = useState<ApiSettings[]>([]);
    const [sourceList, setSource] = useState<ApiSettings[]>([]);
    const [storeLocationList, setStoreLocation] = useState<ApiSettings[]>([]);
    const [currencyList, setCurrency] = useState<ApiSettings[]>([]);
    const [isSettingsList, setISSettings] = useState<ApiSettings[]>([]);
    const [empDepartmentList, setEmpDepartment] = useState<ApiSettings[]>([]);
    const [totalPages_Language, setTotalPages_Language] = useState(1);
    const [totalPages_Courier, setTotalPages_Courier] = useState(1);
    const [totalPages_ShippingStat, setTotalPages_ShippingStat] = useState(1);
    const [totalPages_Warehouse, setTotalPages_Warehouse] = useState(1);
    const [totalPages_ShippingTerm, setTotalPages_ShippingTerm] = useState(1);
    const [totalPages_TaxGroup, setTotalPages_TaxGroup] = useState(1);
    const [totalPages_PaymentTerms, setTotalPages_PaymentTerms] = useState(1);
    const [totalPages_Source, setTotalPages_Source] = useState(1);
    const [totalPages_StoreLocation, setTotalPages_StoreLocation] = useState(1);
    const [totalPages_Currency, setTotalPages_Currency] = useState(1);
    const [totalPages_ISSettings, setTotalPages_ISSettings] = useState(1);
    const [totalPages_EmpDepartment, setTotalPages_EmpDepartment] = useState(1);
    const pageSizeOptions = useMemo(() => [15, 20, 50, -1], []);
    const [activeMenu, setActiveMenu] = useState("language");
    const [module, setModule] = useState("language");
    const [moduleTitle, setModuleTitle] = useState("");
    const [expandedMenus, setExpandedMenus] = useState(["general"]);
    const [selectedMstrLanguages, setSelectedLanguages] = useState<number[]>([]);
    const [selectedMstrCourier, setSelectedCourier] = useState<number[]>([]);
    const [selectedMstrShippingStat, setSelectedShippingStat] = useState<number[]>([]);
    const [selectedMstrWarehouse, setSelectedWarehouse] = useState<number[]>([]);
    const [selectedMstrShippingTerm, setSelectedShippingTerm] = useState<number[]>([]);
    const [selectedMstrTaxGroup, setSelectedTaxGroup] = useState<number[]>([]);
    const [selectedMstrPaymentTerms, setSelectedPaymentTerms] = useState<number[]>([]);
    const [selectedMstrSource, setSelectedSource] = useState<number[]>([]);
    const [selectedMstrStoreLocation, setSelectedStoreLocation] = useState<number[]>([]);
    const [selectedMstrCurrency, setSelectedCurrency] = useState<number[]>([]);
    const [selectedMstrISSettings, setSelectedISSettings] = useState<number[]>([]);
    const [selectedMstrEmpDepartment, setSelectedEmpDepartment] = useState<number[]>([]);
    const [showPopup, setShowPopup] = useState(false);
    const [warehousesData, setWarehousesData] = useState<DropdownData[]>([]);
    const [countriesData, setCountriesData] = useState<DropdownData[]>([]);
    const [currentPage_language, setCurrentPage_Language] = useState(() => {
        const metaKey = `${tabId}-cached-meta-languages`;
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
    const [itemsPerPage_Language, setItemsPerPage_Language] = useState(() => {
        const metaKey = `${tabId}-cached-meta-languages`;
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
    const [searchTerm_Language, setSearchTerm_Language] = useState(() => {
        const cached = localStorage.getItem(`${tabId}-cached-meta-languages`);
        if (!cached) return "";
        try {
            const meta = JSON.parse(cached);
            return meta.search || "";
        } catch {
            return "";
        }
    });
    const [currentPage_Courier, setCurrentPage_Courier] = useState(() => {
        const metaKey = `${tabId}-cached-meta-courier`;
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
    const [itemsPerPage_Courier, setItemsPerPage_Courier] = useState(() => {
        const metaKey = `${tabId}-cached-meta-courier`;
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
    const [searchTerm_Courier, setSearchTerm_Courier] = useState(() => {
        const cached = localStorage.getItem(`${tabId}-cached-meta-courier`);
        if (!cached) return "";
        try {
            const meta = JSON.parse(cached);
            return meta.search || "";
        } catch {
            return "";
        }
    });
    const [currentPage_ShippingStat, setCurrentPage_ShippingStat] = useState(() => {
        const metaKey = `${tabId}-cached-meta-shipping-stat`;
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
    const [itemsPerPage_ShippingStat, setItemsPerPage_ShippingStat] = useState(() => {
        const metaKey = `${tabId}-cached-meta-shipping-stat`;
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
    const [searchTerm_ShippingStat, setSearchTerm_ShippingStat] = useState(() => {
        const cached = localStorage.getItem(`${tabId}-cached-meta-shipping-stat`);
        if (!cached) return "";
        try {
            const meta = JSON.parse(cached);
            return meta.search || "";
        } catch {
            return "";
        }
    });
    const [currentPage_Warehouse, setCurrentPage_Warehouse] = useState(() => {
        const metaKey = `${tabId}-cached-meta-warehouse`;
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
    const [itemsPerPage_Warehouse, setItemsPerPage_Warehouse] = useState(() => {
        const metaKey = `${tabId}-cached-meta-warehouse`;
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
    const [searchTerm_Warehouse, setSearchTerm_Warehouse] = useState(() => {
        const cached = localStorage.getItem(`${tabId}-cached-meta-warehouse`);
        if (!cached) return "";
        try {
            const meta = JSON.parse(cached);
            return meta.search || "";
        } catch {
            return "";
        }
    });
    const [currentPage_ShippingTerm, setCurrentPage_ShippingTerm] = useState(() => {
        const metaKey = `${tabId}-cached-meta-shipping-terms`;
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
    const [itemsPerPage_ShippingTerm, setItemsPerPage_ShippingTerm] = useState(() => {
        const metaKey = `${tabId}-cached-meta-shipping-terms`;
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
    const [searchTerm_ShippingTerm, setSearchTerm_ShippingTerm] = useState(() => {
        const cached = localStorage.getItem(`${tabId}-cached-meta-shipping-terms`);
        if (!cached) return "";
        try {
            const meta = JSON.parse(cached);
            return meta.search || "";
        } catch {
            return "";
        }
    });
    const [currentPage_TaxGroup, setCurrentPage_TaxGroup] = useState(() => {
        const metaKey = `${tabId}-cached-meta-tax-group`;
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
    const [itemsPerPage_TaxGroup, setItemsPerPage_TaxGroup] = useState(() => {
        const metaKey = `${tabId}-cached-meta-tax-group`;
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
    const [searchTerm_TaxGroup, setSearchTerm_TaxGroup] = useState(() => {
        const cached = localStorage.getItem(`${tabId}-cached-meta-tax-group`);
        if (!cached) return "";
        try {
            const meta = JSON.parse(cached);
            return meta.search || "";
        } catch {
            return "";
        }
    });
    const [currentPage_PaymentTerms, setCurrentPage_PaymentTerms] = useState(() => {
        const metaKey = `${tabId}-cached-meta-payment-terms`;
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
    const [itemsPerPage_PaymentTerms, setItemsPerPage_PaymentTerms] = useState(() => {
        const metaKey = `${tabId}-cached-meta-payment-terms`;
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
    const [searchTerm_PaymentTerms, setSearchTerm_PaymentTerms] = useState(() => {
        const cached = localStorage.getItem(`${tabId}-cached-meta-payment-terms`);
        if (!cached) return "";
        try {
            const meta = JSON.parse(cached);
            return meta.search || "";
        } catch {
            return "";
        }
    });
    const [currentPage_Source, setCurrentPage_Source] = useState(() => {
        const metaKey = `${tabId}-cached-meta-source`;
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
    const [itemsPerPage_Source, setItemsPerPage_Source] = useState(() => {
        const metaKey = `${tabId}-cached-meta-source`;
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
    const [searchTerm_Source, setSearchTerm_Source] = useState(() => {
        const cached = localStorage.getItem(`${tabId}-cached-meta-source`);
        if (!cached) return "";
        try {
            const meta = JSON.parse(cached);
            return meta.search || "";
        } catch {
            return "";
        }
    });
    const [currentPage_StoreLocation, setCurrentPage_StoreLocation] = useState(() => {
        const metaKey = `${tabId}-cached-meta-store-location`;
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
    const [itemsPerPage_StoreLocation, setItemsPerPage_StoreLocation] = useState(() => {
        const metaKey = `${tabId}-cached-meta-store-location`;
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
    const [searchTerm_StoreLocation, setSearchTerm_StoreLocation] = useState(() => {
        const cached = localStorage.getItem(`${tabId}-cached-meta-store-location`);
        if (!cached) return "";
        try {
            const meta = JSON.parse(cached);
            return meta.search || "";
        } catch {
            return "";
        }
    });
    const [currentPage_Currency, setCurrentPage_Currency] = useState(() => {
        const metaKey = `${tabId}-cached-meta-currency`;
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
    const [itemsPerPage_Currency, setItemsPerPage_Currency] = useState(() => {
        const metaKey = `${tabId}-cached-meta-currency`;
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
    const [searchTerm_Currency, setSearchTerm_Currency] = useState(() => {
        const cached = localStorage.getItem(`${tabId}-cached-meta-currency`);
        if (!cached) return "";
        try {
            const meta = JSON.parse(cached);
            return meta.search || "";
        } catch {
            return "";
        }
    });
    const [currentPage_ISSettings, setCurrentPage_ISSettings] = useState(() => {
        const metaKey = `${tabId}-cached-meta-issettings`;
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
    const [itemsPerPage_ISSettings, setItemsPerPage_ISSettings] = useState(() => {
        const metaKey = `${tabId}-cached-meta-issettings`;
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
    const [searchTerm_ISSettings, setSearchTerm_ISSettings] = useState(() => {
        const cached = localStorage.getItem(`${tabId}-cached-meta-issettings`);
        if (!cached) return "";
        try {
            const meta = JSON.parse(cached);
            return meta.search || "";
        } catch {
            return "";
        }
    });
    const [currentPage_EmpDepartment, setCurrentPage_EmpDepartment] = useState(() => {
        const metaKey = `${tabId}-cached-meta-empdepartment`;
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
    const [itemsPerPage_EmpDepartment, setItemsPerPage_EmpDepartment] = useState(() => {
        const metaKey = `${tabId}-cached-meta-empdepartment`;
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
    const [searchTerm_EmpDepartment, setSearchTerm_EmpDepartment] = useState(() => {
        const cached = localStorage.getItem(`${tabId}-cached-meta-empdepartment`);
        if (!cached) return "";
        try {
            const meta = JSON.parse(cached);
            return meta.search || "";
        } catch {
            return "";
        }
    });
    const [formData, setFormData] = useState({
        id: 0,
        loc_tag: "",
        en: "",
        cn: "",
        courier_en: "",
        courier_cn: "",
        alias: "",
        shipping_stat_en: "",
        shipping_stat_cn: "",
        warehouse_en: "",
        warehouse_cn: "",
        warehouse_code: "",
        shipping_terms_en: "",
        shipping_terms_cn: "",
        tax_value: "",
        tax: "",
        payment_terms_en: "",
        payment_terms_cn: "",
        terms: "",
        description_en: "",
        description_cn: "",
        store_name_en: "",
        store_name_cn: "",
        address_en: "",
        address_cn: "",
        code: "",
        tag: "",
        currency_title: "",
        set_as_default: 0,
        country_code: null as OptionType | null,
        warehouse: null as OptionType | null,
        is_deleted: 0,
    });
    // Menu structure
    const menuItems = [
        {
            id: "language",
            label: translations["Language"],
            icon: Globe,
            submenus: [],
        },
        {
            id: "general",
            label: translations["General Settings"],
            icon: Settings,
            submenus: [
                { id: "general-department", label: translations["Department"] },
                { id: "general-store-location", label: translations["StoreLocation"] },
                { id: "general-currency", label: translations["Currency"] },
                { id: "general-settings", label: translations["Settings"] },
            ],
        },
        {
            id: "logistic",
            label: translations["Logistics Settings"],
            icon: Truck,
            submenus: [
                { id: "logistic-courier", label: translations["Courier"] },
                { id: "logistic-shipping-status", label: translations["Shipping Status"] },
                { id: "logistic-warehouse", label: translations["Warehouse"] },
                { id: "logistic-shipping-terms", label: translations["Shipping Terms"] },
            ],
        },
        {
            id: "account",
            label: translations["Accounts Settings"],
            icon: DollarSign,
            submenus: [
                { id: "account-tax", label: translations["Tax"] },
                { id: "account-payment-terms", label: translations["Payment Terms"] },
            ],
        },
        {
            id: "admin",
            label: translations["Admin and HR"] + " " + translations["Settings"],
            icon: Users,
            submenus: [
                { id: "admin-designation", label: translations["Designation"] },
                { id: "admin-marital-status", label: translations["Marital Status"] },
                { id: "admin-gender", label: translations["Gender"] },
                { id: "admin-religion", label: translations["Religion"] },
                { id: "admin-qualification", label: translations["Highest Qualification"] },
                { id: "admin-relationship", label: translations["Relationship"] },
                { id: "admin-service-type", label: translations["Service Type"] },
                { id: "admin-rank", label: translations["Highest Rank Attained"] },
            ],
        },
        {
            id: "customer",
            label: translations["Customer"] + " " + translations["Settings"],
            icon: UserCircle,
            submenus: [{ id: "customer-source", label: translations["Source"] }],
        },
    ];
    const toggleMenu = (menuId: string) => {
        setExpandedMenus((prev) => (prev.includes(menuId) ? prev.filter((id) => id !== menuId) : [...prev, menuId]));
    };
    const handleSelectAll_Language = (checked: boolean) => {
        if (checked) {
            const allIds = languageLists?.map((p: any) => p.id);
            setSelectedLanguages(allIds);
        } else {
            setSelectedLanguages([]);
        }
    };
    const handleSelectAll_Courier = (checked: boolean) => {
        if (checked) {
            const allIds = courierLists?.map((p: any) => p.id);
            setSelectedCourier(allIds);
        } else {
            setSelectedCourier([]);
        }
    };
    const handleSelectAll_ShippingStat = (checked: boolean) => {
        if (checked) {
            const allIds = shippingStatLists?.map((p: any) => p.id);
            setSelectedShippingStat(allIds);
        } else {
            setSelectedShippingStat([]);
        }
    };
    const handleSelectAll_Warehouse = (checked: boolean) => {
        if (checked) {
            const allIds = warehouseList?.map((p: any) => p.id);
            setSelectedWarehouse(allIds);
        } else {
            setSelectedWarehouse([]);
        }
    };
    const handleSelectAll_ShippingTerm = (checked: boolean) => {
        if (checked) {
            const allIds = shippingTermsList?.map((p: any) => p.id);
            setSelectedShippingTerm(allIds);
        } else {
            setSelectedShippingTerm([]);
        }
    };
    const handleSelectAll_TaxGroup = (checked: boolean) => {
        if (checked) {
            const allIds = taxGroupList?.map((p: any) => p.id);
            setSelectedTaxGroup(allIds);
        } else {
            setSelectedTaxGroup([]);
        }
    };
    const handleSelectAll_PaymentTerms = (checked: boolean) => {
        if (checked) {
            const allIds = paymentTermsList?.map((p: any) => p.id);
            setSelectedPaymentTerms(allIds);
        } else {
            setSelectedPaymentTerms([]);
        }
    };
    const handleSelectAll_Source = (checked: boolean) => {
        if (checked) {
            const allIds = sourceList?.map((p: any) => p.id);
            setSelectedSource(allIds);
        } else {
            setSelectedSource([]);
        }
    };
    const handleSelectAll_StoreLocation = (checked: boolean) => {
        if (checked) {
            const allIds = storeLocationList?.map((p: any) => p.id);
            setSelectedStoreLocation(allIds);
        } else {
            setSelectedStoreLocation([]);
        }
    };
    const handleSelectAll_Currency = (checked: boolean) => {
        if (checked) {
            const allIds = currencyList?.map((p: any) => p.id);
            setSelectedCurrency(allIds);
        } else {
            setSelectedCurrency([]);
        }
    };
    const handleSelectAll_ISSettings = (checked: boolean) => {
        if (checked) {
            const allIds = isSettingsList?.map((p: any) => p.id);
            setSelectedISSettings(allIds);
        } else {
            setSelectedISSettings([]);
        }
    };
    const handleSelectAll_EmpDepartment = (checked: boolean) => {
        if (checked) {
            const allIds = empDepartmentList?.map((p: any) => p.id);
            setSelectedEmpDepartment(allIds);
        } else {
            setSelectedEmpDepartment([]);
        }
    };
    const handleSelectLanguage = (id: number, checked: boolean) => {
        if (checked) {
            setSelectedLanguages((prev) => [...prev, id]);
        } else {
            setSelectedLanguages((prev) => prev.filter((pid) => pid !== id));
        }
    };
    const handleSelectCourier = (id: number, checked: boolean) => {
        if (checked) {
            setSelectedCourier((prev) => [...prev, id]);
        } else {
            setSelectedCourier((prev) => prev.filter((pid) => pid !== id));
        }
    };
    const handleSelectShippingStat = (id: number, checked: boolean) => {
        if (checked) {
            setSelectedShippingStat((prev) => [...prev, id]);
        } else {
            setSelectedShippingStat((prev) => prev.filter((pid) => pid !== id));
        }
    };
    const handleSelectWarehouse = (id: number, checked: boolean) => {
        if (checked) {
            setSelectedWarehouse((prev) => [...prev, id]);
        } else {
            setSelectedWarehouse((prev) => prev.filter((pid) => pid !== id));
        }
    };
    const handleSelectShippingTerm = (id: number, checked: boolean) => {
        if (checked) {
            setSelectedShippingTerm((prev) => [...prev, id]);
        } else {
            setSelectedShippingTerm((prev) => prev.filter((pid) => pid !== id));
        }
    };
    const handleSelectTaxGroup = (id: number, checked: boolean) => {
        if (checked) {
            setSelectedTaxGroup((prev) => [...prev, id]);
        } else {
            setSelectedTaxGroup((prev) => prev.filter((pid) => pid !== id));
        }
    };
    const handleSelectPaymentTerms = (id: number, checked: boolean) => {
        if (checked) {
            setSelectedPaymentTerms((prev) => [...prev, id]);
        } else {
            setSelectedPaymentTerms((prev) => prev.filter((pid) => pid !== id));
        }
    };
    const handleSelectSource = (id: number, checked: boolean) => {
        if (checked) {
            setSelectedSource((prev) => [...prev, id]);
        } else {
            setSelectedSource((prev) => prev.filter((pid) => pid !== id));
        }
    };
    const handleSelectStoreLocation = (id: number, checked: boolean) => {
        if (checked) {
            setSelectedStoreLocation((prev) => [...prev, id]);
        } else {
            setSelectedStoreLocation((prev) => prev.filter((pid) => pid !== id));
        }
    };
    const handleSelectCurrency = (id: number, checked: boolean) => {
        if (checked) {
            setSelectedCurrency((prev) => [...prev, id]);
        } else {
            setSelectedCurrency((prev) => prev.filter((pid) => pid !== id));
        }
    };
    const handleSelectISSettings = (id: number, checked: boolean) => {
        if (checked) {
            setSelectedISSettings((prev) => [...prev, id]);
        } else {
            setSelectedISSettings((prev) => prev.filter((pid) => pid !== id));
        }
    };
    const handleSelectEmpDepartment = (id: number, checked: boolean) => {
        if (checked) {
            setSelectedEmpDepartment((prev) => [...prev, id]);
        } else {
            setSelectedEmpDepartment((prev) => prev.filter((pid) => pid !== id));
        }
    };
    const handleSetAsDefault = async (tableId: number, module: string) => {
        const confirmed = await showConfirm(translations["System Message"], `${translations["Are you sure you want to continue"]}?`, translations["Continue"], translations["Cancel"]);
        if (!confirmed) return;
        try {
            await settingService.setAsDefaultSettings(tableId, module);
            reloadFetch();
            showSuccessToast(translations["Record Successfully Updated"]);
        } catch (error) {
            console.error(error);
            showErrorToast(translations["Failed to save transaction."] || "Failed to save transaction.");
        }
    };
    useEffect(() => {
        const handleEsc = (event: any) => {
            if (event.key === "Escape") {
                if (showPopup) {
                    setShowPopup(false);
                }
            }
        };
        window.addEventListener("keydown", handleEsc);
        // Cleanup on unmount
        return () => {
            window.removeEventListener("keydown", handleEsc);
        };
    }, [showPopup]);

    useEffect(() => {
        fetchLanguages(currentPage_language, itemsPerPage_Language, searchTerm_Language);
    }, [currentPage_language, itemsPerPage_Language, searchTerm_Language, tabId]);

    useEffect(() => {
        switch (activeMenu) {
            case "logistic-courier":
                fetchCourier(currentPage_Courier, itemsPerPage_Courier, searchTerm_Courier);
                break;

            case "logistic-shipping-status":
                loadWarehouse();
                loadCountries();
                fetchShippingStatus(currentPage_ShippingStat, itemsPerPage_ShippingStat, searchTerm_ShippingStat);
                break;

            case "logistic-warehouse":
                fetchWarehouse(currentPage_Warehouse, itemsPerPage_Warehouse, searchTerm_Warehouse);
                break;

            case "logistic-shipping-terms":
                fetchShippingTerms(currentPage_ShippingTerm, itemsPerPage_ShippingTerm, searchTerm_ShippingTerm);
                break;

            case "account-tax":
                fetchTaxGroup(currentPage_TaxGroup, itemsPerPage_TaxGroup, searchTerm_TaxGroup);
                break;

            case "account-payment-terms":
                fetchPaymentTerms(currentPage_PaymentTerms, itemsPerPage_PaymentTerms, searchTerm_PaymentTerms);
                break;

            case "customer-source":
                fetchSource(currentPage_Source, itemsPerPage_Source, searchTerm_Source);
                break;

            case "general-store-location":
                fetchStoreLocation(currentPage_StoreLocation, itemsPerPage_StoreLocation, searchTerm_StoreLocation);
                break;

            case "general-currency":
                fetchCurrency(currentPage_Currency, itemsPerPage_Currency, searchTerm_Currency);
                break;

            case "general-settings":
                fetchISSettings(currentPage_ISSettings, itemsPerPage_ISSettings, searchTerm_ISSettings);
                break;

            case "general-department":
                fetchEmpDepartment(currentPage_EmpDepartment, itemsPerPage_EmpDepartment, searchTerm_EmpDepartment);
                break;
        }
    }, [activeMenu, currentPage_Courier, itemsPerPage_Courier, searchTerm_Courier]);

    const fetchLanguages = async (page = currentPage_language, perPage = itemsPerPage_Language, search = "") => {
        try {
            localStorage.setItem(`${tabId}-loading-languages`, JSON.stringify(true));
            const paginatedData = await settingService.getAllLanguages(page, perPage, search);
            setLanguages(paginatedData.data);
            setTotalPages_Language(paginatedData.last_page);
        } catch (err) {
            console.error("Error fetching languages:", err);
        } finally {
            localStorage.setItem(`${tabId}-loading-languages`, JSON.stringify(false));
        }
    };
    const fetchCourier = async (page = currentPage_Courier, perPage = itemsPerPage_Courier, search = "") => {
        try {
            localStorage.setItem(`${tabId}-loading-courier`, JSON.stringify(true));
            const paginatedData = await settingService.getAllCourier(page, perPage, search);
            setCourier(paginatedData.data);
            setTotalPages_Courier(paginatedData.last_page);
        } catch (err) {
            console.error("Error fetching courier:", err);
        } finally {
            localStorage.setItem(`${tabId}-loading-courier`, JSON.stringify(false));
        }
    };
    const fetchShippingStatus = async (page = currentPage_ShippingStat, perPage = itemsPerPage_ShippingStat, search = "") => {
        try {
            localStorage.setItem(`${tabId}-loading-shipping-stat`, JSON.stringify(true));
            const paginatedData = await settingService.getAllShippingStatus(page, perPage, search);
            setShippingStat(paginatedData.data);
            setTotalPages_ShippingStat(paginatedData.last_page);
        } catch (err) {
            console.error("Error fetching shipping-stat:", err);
        } finally {
            localStorage.setItem(`${tabId}-loading-shipping-stat`, JSON.stringify(false));
        }
    };
    const fetchWarehouse = async (page = currentPage_Warehouse, perPage = itemsPerPage_Warehouse, search = "") => {
        try {
            localStorage.setItem(`${tabId}-loading-warehouse`, JSON.stringify(true));
            const paginatedData = await settingService.getWarehouseList(page, perPage, search);
            setWarehouse(paginatedData.data);
            setTotalPages_Warehouse(paginatedData.last_page);
        } catch (err) {
            console.error("Error fetching warehouse:", err);
        } finally {
            localStorage.setItem(`${tabId}-loading-warehouse`, JSON.stringify(false));
        }
    };
    const fetchShippingTerms = async (page = currentPage_ShippingTerm, perPage = itemsPerPage_ShippingTerm, search = "") => {
        try {
            localStorage.setItem(`${tabId}-loading-shipping-terms`, JSON.stringify(true));
            const paginatedData = await settingService.getShippingTermList(page, perPage, search);
            setShippingTerms(paginatedData.data);
            setTotalPages_ShippingTerm(paginatedData.last_page);
        } catch (err) {
            console.error("Error fetching payment-terms:", err);
        } finally {
            localStorage.setItem(`${tabId}-loading-shipping-terms`, JSON.stringify(false));
        }
    };
    const fetchTaxGroup = async (page = currentPage_TaxGroup, perPage = itemsPerPage_TaxGroup, search = "") => {
        try {
            localStorage.setItem(`${tabId}-loading-tax-group`, JSON.stringify(true));
            const paginatedData = await settingService.getTaxGroupList(page, perPage, search);
            setTaxGroup(paginatedData.data);
            setTotalPages_TaxGroup(paginatedData.last_page);
        } catch (err) {
            console.error("Error fetching tax-group:", err);
        } finally {
            localStorage.setItem(`${tabId}-loading-tax-group`, JSON.stringify(false));
        }
    };
    const fetchPaymentTerms = async (page = currentPage_PaymentTerms, perPage = itemsPerPage_PaymentTerms, search = "") => {
        try {
            localStorage.setItem(`${tabId}-loading-payment-terms`, JSON.stringify(true));
            const paginatedData = await settingService.getPaymentTerms(page, perPage, search);
            setPaymentTerms(paginatedData.data);
            setTotalPages_PaymentTerms(paginatedData.last_page);
        } catch (err) {
            console.error("Error fetching payment-terms:", err);
        } finally {
            localStorage.setItem(`${tabId}-loading-payment-terms`, JSON.stringify(false));
        }
    };
    const fetchSource = async (page = currentPage_Source, perPage = itemsPerPage_Source, search = "") => {
        try {
            localStorage.setItem(`${tabId}-loading-source`, JSON.stringify(true));
            const paginatedData = await settingService.getSourceList(page, perPage, search);
            setSource(paginatedData.data);
            setTotalPages_Source(paginatedData.last_page);
        } catch (err) {
            console.error("Error fetching source:", err);
        } finally {
            localStorage.setItem(`${tabId}-loading-source`, JSON.stringify(false));
        }
    };
    const fetchStoreLocation = async (page = currentPage_StoreLocation, perPage = itemsPerPage_StoreLocation, search = "") => {
        try {
            localStorage.setItem(`${tabId}-loading-store-location`, JSON.stringify(true));
            const paginatedData = await settingService.getStoreLocationList(page, perPage, search);
            setStoreLocation(paginatedData.data);
            setTotalPages_StoreLocation(paginatedData.last_page);
        } catch (err) {
            console.error("Error fetching store-location:", err);
        } finally {
            localStorage.setItem(`${tabId}-loading-store-location`, JSON.stringify(false));
        }
    };
    const fetchCurrency = async (page = currentPage_Currency, perPage = itemsPerPage_Currency, search = "") => {
        try {
            localStorage.setItem(`${tabId}-loading-currency`, JSON.stringify(true));
            const paginatedData = await settingService.getCurrencyList(page, perPage, search);
            setCurrency(paginatedData.data);
            setTotalPages_Currency(paginatedData.last_page);
        } catch (err) {
            console.error("Error fetching currency:", err);
        } finally {
            localStorage.setItem(`${tabId}-loading-currency`, JSON.stringify(false));
        }
    };
    const fetchISSettings = async (page = currentPage_ISSettings, perPage = itemsPerPage_ISSettings, search = "") => {
        try {
            localStorage.setItem(`${tabId}-loading-issettings`, JSON.stringify(true));
            const paginatedData = await settingService.getISSettings(page, perPage, search);
            setISSettings(paginatedData.data);
            setTotalPages_ISSettings(paginatedData.last_page);
        } catch (err) {
            console.error("Error fetching issettings:", err);
        } finally {
            localStorage.setItem(`${tabId}-loading-issettings`, JSON.stringify(false));
        }
    };
    const fetchEmpDepartment = async (page = currentPage_EmpDepartment, perPage = itemsPerPage_EmpDepartment, search = "") => {
        try {
            localStorage.setItem(`${tabId}-loading-empdapartment`, JSON.stringify(true));
            const paginatedData = await settingService.getEMPDepartment(page, perPage, search);
            setEmpDepartment(paginatedData.data);
            setTotalPages_EmpDepartment(paginatedData.last_page);
        } catch (err) {
            console.error("Error fetching empdapartment:", err);
        } finally {
            localStorage.setItem(`${tabId}-loading-empdapartment`, JSON.stringify(false));
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
    const loadCountries = async () => {
        try {
            const list = await fetchCountries(); // fetches & returns
            setCountriesData(list ?? []); // ✅ manually set state here
        } catch (err) {
            console.error("Failed to fetch loadCountries:", err);
        }
    };
    const handleAddNew = (module: string) => {
        switch (module) {
            case "language":
                setFormData((prev) => ({
                    ...prev,
                    id: 0,
                    loc_tag: "",
                    en: "",
                    cn: "",
                }));
                setModuleTitle(translations["Add Language"]);
                break;
            case "courier":
                setFormData((prev) => ({
                    ...prev,
                    id: 0,
                    courier_en: "",
                    courier_cn: "",
                    alias: "",
                }));
                setModuleTitle(translations["Add Courier"]);
                break;
            case "shipping-stat":
                setFormData((prev) => ({
                    ...prev,
                    id: 0,
                    shipping_stat_en: "",
                    shipping_stat_cn: "",
                    country_code: null,
                    warehouse: null,
                }));
                setModuleTitle(translations["Add Shipping Status"]);
                break;
            case "warehouse":
                setFormData((prev) => ({
                    ...prev,
                    id: 0,
                    warehouse_en: "",
                    warehouse_cn: "",
                    country_code: null,
                    warehouse_code: "",
                }));
                setModuleTitle(translations["Add Warehouse & Location"]);
                break;
            case "shipping-terms":
                setFormData((prev) => ({
                    ...prev,
                    id: 0,
                    shipping_terms_en: "",
                    shipping_terms_cn: "",
                }));
                setModuleTitle(translations["Add Shipping Terms"]);
                break;
            case "tax-group":
                setFormData((prev) => ({
                    ...prev,
                    id: 0,
                    tax_value: "",
                    tax: "",
                }));
                setModuleTitle(translations["AddTaxGroup"]);
                break;
            case "payment-terms":
                setFormData((prev) => ({
                    ...prev,
                    id: 0,
                    payment_terms_en: "",
                    payment_terms_cn: "",
                    terms: "",
                    alias: "",
                }));
                setModuleTitle(translations["AddPaymentTerms"]);
                break;
            case "source":
                setFormData((prev) => ({
                    ...prev,
                    id: 0,
                    description_en: "",
                    description_cn: "",
                }));
                setModuleTitle(translations["Add Source"]);
                break;
            case "store-location":
                setFormData((prev) => ({
                    ...prev,
                    id: 0,
                    store_name_en: "",
                    store_name_cn: "",
                    address_en: "",
                    address_cn: "",
                    set_as_default: 0,
                }));
                setModuleTitle(translations["Add Store Location"]);
                break;
            case "currency":
                setFormData((prev) => ({
                    ...prev,
                    id: 0,
                    code: "",
                    currency_title: "",
                    set_as_default: 0,
                }));
                setModuleTitle(translations["Add Currency"]);
                break;
            case "issettings":
                setFormData((prev) => ({
                    ...prev,
                    id: 0,
                    tag: "",
                    en: "",
                    cn: "",
                }));
                setModuleTitle(translations["Settings"]);
                break;
            case "department":
                setFormData((prev) => ({
                    ...prev,
                    id: 0,
                    alias: "",
                    description_en: "",
                    description_cn: "",
                }));
                setModuleTitle(translations["Department"]);
                break;
        }
        setShowPopup(true);
        setModule(module);
    };
    const handleDelete = async (module: string) => {
        let ids: any = [];
        switch (module) {
            case "language":
                if (selectedMstrLanguages.length === 0) {
                    showErrorToast(translations["Please click checkbox to select row"]);
                    return;
                }
                ids = selectedMstrLanguages;
                break;
            case "courier":
                if (selectedMstrCourier.length === 0) {
                    showErrorToast(translations["Please click checkbox to select row"]);
                    return;
                }
                ids = selectedMstrCourier;
                break;
            case "shipping-stat":
                if (selectedMstrShippingStat.length === 0) {
                    showErrorToast(translations["Please click checkbox to select row"]);
                    return;
                }
                ids = selectedMstrShippingStat;
                break;
            case "warehouse":
                if (selectedMstrWarehouse.length === 0) {
                    showErrorToast(translations["Please click checkbox to select row"]);
                    return;
                }
                ids = selectedMstrWarehouse;
                break;
            case "shipping-terms":
                if (selectedMstrShippingTerm.length === 0) {
                    showErrorToast(translations["Please click checkbox to select row"]);
                    return;
                }
                ids = selectedMstrShippingTerm;
                break;
            case "tax-group":
                if (selectedMstrTaxGroup.length === 0) {
                    showErrorToast(translations["Please click checkbox to select row"]);
                    return;
                }
                ids = selectedMstrTaxGroup;
                break;
            case "payment-terms":
                if (selectedMstrPaymentTerms.length === 0) {
                    showErrorToast(translations["Please click checkbox to select row"]);
                    return;
                }
                ids = selectedMstrPaymentTerms;
                break;
            case "source":
                if (selectedMstrSource.length === 0) {
                    showErrorToast(translations["Please click checkbox to select row"]);
                    return;
                }
                ids = selectedMstrSource;
                break;
            case "store-location":
                if (selectedMstrStoreLocation.length === 0) {
                    showErrorToast(translations["Please click checkbox to select row"]);
                    return;
                }
                ids = selectedMstrStoreLocation;
                break;
            case "currency":
                if (selectedMstrCurrency.length === 0) {
                    showErrorToast(translations["Please click checkbox to select row"]);
                    return;
                }
                ids = selectedMstrCurrency;
                break;
            case "issettings":
                if (selectedMstrISSettings.length === 0) {
                    showErrorToast(translations["Please click checkbox to select row"]);
                    return;
                }
                ids = selectedMstrISSettings;
                break;
            case "department":
                if (selectedMstrEmpDepartment.length === 0) {
                    showErrorToast(translations["Please click checkbox to select row"]);
                    return;
                }
                ids = selectedMstrEmpDepartment;
                break;
        }
        const confirmed = await showConfirm(translations["Delete Record"], translations["Are you sure you want to delete this record?"], translations["Yes"], translations["Cancel"]);
        if (!confirmed) return;
        try {
            const res = await settingService.deleteSettings(ids, module);
            if (res.token === "Error") {
                showErrorToast(res.message);
                return;
            }
            reloadFetch();
            showSuccessToast(translations["Record has been Deleted"]);
        } catch (err) {
            showErrorToast(translations["alert_message_18"]);
        }
    };
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
    // Render content based on active menu
    const renderContent = () => {
        if (activeMenu === "language") {
            return (
                <>
                    {/* Toolbar */}
                    <div className="p-4 border-b flex-shrink-0" style={{ borderColor: "#404040" }}>
                        <div className="flex justify-between items-center">
                            <div className="flex items-center space-x-4">
                                <div className="relative">
                                    <input
                                        type="search"
                                        placeholder={translations["Search"]}
                                        value={searchTerm_Language}
                                        onChange={(e) => {
                                            setSearchTerm_Language(e.target.value);
                                            setCurrentPage_Language(1);
                                        }}
                                        className="pl-10 pr-4 py-2 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-sm"
                                        style={{ backgroundColor: "#2d2d30", borderColor: "#555555" }}
                                    />
                                </div>
                            </div>
                            <div className="flex items-center space-x-1">
                                <button
                                    onClick={() => handleAddNew("language")}
                                    className="px-2 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors flex items-center space-x-1 text-sm"
                                >
                                    <span>{translations["Add New"]}</span>
                                </button>
                                <button
                                    onClick={() => handleDelete("language")}
                                    className="px-2 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center space-x-1 text-sm"
                                >
                                    <span>{translations["Delete"]}</span>
                                </button>
                            </div>
                        </div>
                    </div>
                    {/* Table */}
                    <div className="overflow-x-auto">
                        <div className="h-[calc(100vh-220px)] overflow-y-auto">
                            <table className="w-full">
                                <thead className="sticky top-0 z-[1]" style={{ backgroundColor: "#1f2132" }}>
                                    <tr className="border-b" style={{ borderColor: "#2d2d30" }}>
                                        <th className="w-[3%] py-2 px-2 text-gray-400 text-sm">
                                            <div className="flex items-center justify-center h-full">
                                                <CustomCheckbox
                                                    checked={selectedMstrLanguages.length === languageLists?.length && languageLists?.length > 0}
                                                    onChange={(checked) => handleSelectAll_Language(checked)}
                                                />
                                            </div>
                                        </th>
                                        <th className="w-[33%] text-left py-2 px-4 text-gray-400 text-sm ">{translations["Tag"]}</th>
                                        <th className="w-[32%] text-left py-2 px-4 text-gray-400 text-sm">{translations["English"]}</th>
                                        <th className="w-[32%] text-left py-2 px-4 text-gray-400 text-sm">{translations["Chinese"]}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {languageLists.map((list, index) => (
                                        <tr
                                            key={list.id || index}
                                            onClick={() => {
                                                const data = languageLists.find((item) => item.id === list.id);
                                                setFormData((prev) => ({
                                                    ...prev,
                                                    id: Number(data?.id),
                                                    loc_tag: String(data?.loc_tag),
                                                    en: String(data?.en),
                                                    cn: String(data?.cn),
                                                }));
                                                setShowPopup(true);
                                                setModule("language");
                                                setModuleTitle(translations["Edit Language"]);
                                            }}
                                            className={`clickable border-b hover:bg-gray-700 hover:bg-opacity-30 transition-colors cursor-pointer`}
                                            style={{ borderColor: "#40404042" }}
                                        >
                                            <td className="py-2 px-2 text-gray-400 text-left text-custom-sm" onClick={(e) => e.stopPropagation()}>
                                                <div className="flex items-center justify-center h-full">
                                                    <CustomCheckbox
                                                        checked={selectedMstrLanguages.includes(list.id as number)}
                                                        onChange={(checked) => handleSelectLanguage(list.id as number, checked)}
                                                    />
                                                </div>
                                            </td>
                                            <td className="py-3 px-4 text-gray-400 text-left text-custom-sm">{list.loc_tag}</td>
                                            <td className="py-3 px-4 text-gray-400 text-left text-custom-sm">{list.en}</td>
                                            <td className="py-3 px-4 text-gray-400 text-left text-custom-sm">{list.cn}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    {/* Footer with Pagination */}
                    <div className="p-4 border-t flex items-center justify-between" style={{ borderColor: "#404040" }}>
                        <div className="flex items-center space-x-4">
                            <MemoizedPagination currentPage={currentPage_language} totalPages={totalPages_Language} onPageChange={(page) => setCurrentPage_Language(page)} />
                            <MemoizedItemsPerPageSelector
                                value={itemsPerPage_Language}
                                onChange={(val: number) => {
                                    setItemsPerPage_Language(val);
                                    setCurrentPage_Language(1);
                                }}
                                options={pageSizeOptions}
                            />
                        </div>
                        <div className="flex items-center space-x-1">{/* Optional right side content */}</div>
                    </div>
                </>
            );
        }
        if (activeMenu === "logistic-courier") {
            return (
                <>
                    {/* Toolbar */}
                    <div className="p-4 border-b flex-shrink-0" style={{ borderColor: "#404040" }}>
                        <div className="flex justify-between items-center">
                            <div className="flex items-center space-x-4">
                                <div className="relative">
                                    <input
                                        type="search"
                                        placeholder={translations["Search"]}
                                        value={searchTerm_Courier}
                                        onChange={(e) => {
                                            setSearchTerm_Courier(e.target.value);
                                            setCurrentPage_Courier(1);
                                        }}
                                        className="pl-10 pr-4 py-2 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-sm"
                                        style={{ backgroundColor: "#2d2d30", borderColor: "#555555" }}
                                    />
                                </div>
                            </div>
                            <div className="flex items-center space-x-1">
                                <button
                                    onClick={() => handleAddNew("courier")}
                                    className="px-2 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors flex items-center space-x-1 text-sm"
                                >
                                    <span>{translations["Add New"]}</span>
                                </button>
                                <button
                                    onClick={() => handleDelete("courier")}
                                    className="px-2 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center space-x-1 text-sm"
                                >
                                    <span>{translations["Delete"]}</span>
                                </button>
                            </div>
                        </div>
                    </div>
                    {/* Table */}
                    <div className="overflow-x-auto">
                        <div className="h-[calc(100vh-220px)] overflow-y-auto">
                            <table className="w-full">
                                <thead className="sticky top-0 z-[1]" style={{ backgroundColor: "#1f2132" }}>
                                    <tr className="border-b" style={{ borderColor: "#2d2d30" }}>
                                        <th className="w-[3%] py-2 px-2 text-gray-400 text-sm">
                                            <div className="flex items-center justify-center h-full">
                                                <CustomCheckbox
                                                    checked={selectedMstrCourier.length === courierLists?.length && courierLists?.length > 0}
                                                    onChange={(checked) => handleSelectAll_Courier(checked)}
                                                />
                                            </div>
                                        </th>
                                        <th className="w-[30%] text-left py-2 px-4 text-gray-400 text-sm ">{translations["Courier Name"]}</th>
                                        <th className="w-[27%] text-left py-2 px-4 text-gray-400 text-sm">{translations["Alias"]}</th>
                                        <th className="w-[20%] text-left py-2 px-4 text-gray-400 text-sm">{translations["Date Created"]}</th>
                                        <th className="w-[20%] text-left py-2 px-4 text-gray-400 text-sm">{translations["Date Updated"]}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {courierLists.map((list, index) => (
                                        <tr
                                            key={list.id || index}
                                            onClick={() => {
                                                const data = courierLists.find((item) => item.id === list.id);
                                                setFormData((prev) => ({
                                                    ...prev,
                                                    id: Number(data?.id),
                                                    courier_en: String(data?.courier_en),
                                                    courier_cn: String(data?.courier_cn),
                                                    alias: String(data?.alias),
                                                }));
                                                setShowPopup(true);
                                                setModule("courier");
                                                setModuleTitle(translations["Edit Courier"]);
                                            }}
                                            className={`clickable border-b hover:bg-gray-700 hover:bg-opacity-30 transition-colors cursor-pointer`}
                                            style={{ borderColor: "#40404042" }}
                                        >
                                            <td className="py-2 px-2 text-gray-400 text-left text-custom-sm" onClick={(e) => e.stopPropagation()}>
                                                <div className="flex items-center justify-center h-full">
                                                    <CustomCheckbox checked={selectedMstrCourier.includes(list.id as number)} onChange={(checked) => handleSelectCourier(list.id as number, checked)} />
                                                </div>
                                            </td>
                                            <td className="py-3 px-4 text-gray-400 text-left text-custom-sm">{lang === "en" ? list.courier_en : list.courier_cn}</td>
                                            <td className="py-3 px-4 text-gray-400 text-left text-custom-sm">{list.alias}</td>
                                            <td className="py-3 px-4 text-gray-400 text-left text-custom-sm">{list.created_at}</td>
                                            <td className="py-3 px-4 text-gray-400 text-left text-custom-sm">{list.updated_at}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    {/* Footer with Pagination */}
                    <div className="p-4 border-t flex items-center justify-between" style={{ borderColor: "#404040" }}>
                        <div className="flex items-center space-x-4">
                            <MemoizedPagination currentPage={currentPage_Courier} totalPages={totalPages_Courier} onPageChange={(page) => setCurrentPage_Courier(page)} />
                            <MemoizedItemsPerPageSelector
                                value={itemsPerPage_Courier}
                                onChange={(val: number) => {
                                    setItemsPerPage_Courier(val);
                                    setCurrentPage_Courier(1);
                                }}
                                options={pageSizeOptions}
                            />
                        </div>
                        <div className="flex items-center space-x-1">{/* Optional right side content */}</div>
                    </div>
                </>
            );
        }
        if (activeMenu === "logistic-shipping-status") {
            return (
                <>
                    {/* Toolbar */}
                    <div className="p-4 border-b flex-shrink-0" style={{ borderColor: "#404040" }}>
                        <div className="flex justify-between items-center">
                            <div className="flex items-center space-x-4">
                                <div className="relative">
                                    <input
                                        type="search"
                                        placeholder={translations["Search"]}
                                        value={searchTerm_ShippingStat}
                                        onChange={(e) => {
                                            setSearchTerm_ShippingStat(e.target.value);
                                            setCurrentPage_ShippingStat(1);
                                        }}
                                        className="pl-10 pr-4 py-2 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-sm"
                                        style={{ backgroundColor: "#2d2d30", borderColor: "#555555" }}
                                    />
                                </div>
                            </div>
                            <div className="flex items-center space-x-1">
                                <button
                                    onClick={() => handleAddNew("shipping-stat")}
                                    className="px-2 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors flex items-center space-x-1 text-sm"
                                >
                                    <span>{translations["Add New"]}</span>
                                </button>
                                <button
                                    onClick={() => handleDelete("shipping-stat")}
                                    className="px-2 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center space-x-1 text-sm"
                                >
                                    <span>{translations["Delete"]}</span>
                                </button>
                            </div>
                        </div>
                    </div>
                    {/* Table */}
                    <div className="overflow-x-auto">
                        <div className="h-[calc(100vh-220px)] overflow-y-auto">
                            <table className="w-full">
                                <thead className="sticky top-0 z-[1]" style={{ backgroundColor: "#1f2132" }}>
                                    <tr className="border-b" style={{ borderColor: "#2d2d30" }}>
                                        <th className="w-[3%] py-2 px-2 text-gray-400 text-sm">
                                            <div className="flex items-center justify-center h-full">
                                                <CustomCheckbox
                                                    checked={selectedMstrShippingStat.length === shippingStatLists?.length && shippingStatLists?.length > 0}
                                                    onChange={(checked) => handleSelectAll_ShippingStat(checked)}
                                                />
                                            </div>
                                        </th>
                                        <th className="w-[30%] text-left py-2 px-4 text-gray-400 text-sm ">{translations["Shipping Status"]}</th>
                                        <th className="w-[16%] text-left py-2 px-4 text-gray-400 text-sm">{translations["Country"]}</th>
                                        <th className="w-[17%] text-left py-2 px-4 text-gray-400 text-sm">{translations["Warehouse"]}</th>
                                        <th className="w-[17%] text-left py-2 px-4 text-gray-400 text-sm">{translations["Date Created"]}</th>
                                        <th className="w-[17%] text-left py-2 px-4 text-gray-400 text-sm">{translations["Date Updated"]}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {shippingStatLists.map((list, index) => (
                                        <tr
                                            key={list.id || index}
                                            onClick={() => {
                                                const data = shippingStatLists.find((item) => item.id === list.id);
                                                const countryCode = Number(data?.country_code);
                                                const warehouseCode = String(data?.warehouse_code);
                                                const selectedCountry = convertToSingleOption(countryCode, countriesOption);
                                                const selectedWarehouse = convertToSingleOptionString(warehouseCode, warehouseOptions);
                                                setFormData((prev) => ({
                                                    ...prev,
                                                    id: Number(data?.id),
                                                    shipping_stat_en: String(data?.shipping_stat_en),
                                                    shipping_stat_cn: String(data?.shipping_stat_cn),
                                                    country_code: selectedCountry,
                                                    warehouse: selectedWarehouse,
                                                }));
                                                setShowPopup(true);
                                                setModule("shipping-stat");
                                                setModuleTitle(translations["Edit Shipping Status"]);
                                            }}
                                            className={`clickable border-b hover:bg-gray-700 hover:bg-opacity-30 transition-colors cursor-pointer`}
                                            style={{ borderColor: "#40404042" }}
                                        >
                                            <td className="py-2 px-2 text-gray-400 text-left text-custom-sm" onClick={(e) => e.stopPropagation()}>
                                                <div className="flex items-center justify-center h-full">
                                                    <CustomCheckbox
                                                        checked={selectedMstrShippingStat.includes(list.id as number)}
                                                        onChange={(checked) => handleSelectShippingStat(list.id as number, checked)}
                                                    />
                                                </div>
                                            </td>
                                            <td className="py-3 px-4 text-gray-400 text-left text-custom-sm">{lang === "en" ? list.shipping_stat_en : list.shipping_stat_cn}</td>
                                            <td className="py-3 px-4 text-gray-400 text-left text-custom-sm">{lang === "en" ? list.country_en : list.country_cn}</td>
                                            <td className="py-3 px-4 text-gray-400 text-left text-custom-sm">{lang === "en" ? list.warehouse_en : list.warehouse_cn}</td>
                                            <td className="py-3 px-4 text-gray-400 text-left text-custom-sm">{list.created_at}</td>
                                            <td className="py-3 px-4 text-gray-400 text-left text-custom-sm">{list.updated_at}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    {/* Footer with Pagination */}
                    <div className="p-4 border-t flex items-center justify-between" style={{ borderColor: "#404040" }}>
                        <div className="flex items-center space-x-4">
                            <MemoizedPagination currentPage={currentPage_ShippingStat} totalPages={totalPages_ShippingStat} onPageChange={(page) => setCurrentPage_ShippingStat(page)} />
                            <MemoizedItemsPerPageSelector
                                value={itemsPerPage_ShippingStat}
                                onChange={(val: number) => {
                                    setItemsPerPage_ShippingStat(val);
                                    setCurrentPage_ShippingStat(1);
                                }}
                                options={pageSizeOptions}
                            />
                        </div>
                        <div className="flex items-center space-x-1">{/* Optional right side content */}</div>
                    </div>
                </>
            );
        }
        if (activeMenu === "logistic-warehouse") {
            return (
                <>
                    {/* Toolbar */}
                    <div className="p-4 border-b flex-shrink-0" style={{ borderColor: "#404040" }}>
                        <div className="flex justify-between items-center">
                            <div className="flex items-center space-x-4">
                                <div className="relative">
                                    <input
                                        type="search"
                                        placeholder={translations["Search"]}
                                        value={searchTerm_Warehouse}
                                        onChange={(e) => {
                                            setSearchTerm_Warehouse(e.target.value);
                                            setCurrentPage_Warehouse(1);
                                        }}
                                        className="pl-10 pr-4 py-2 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-sm"
                                        style={{ backgroundColor: "#2d2d30", borderColor: "#555555" }}
                                    />
                                </div>
                            </div>
                            <div className="flex items-center space-x-1">
                                <button
                                    onClick={() => handleAddNew("warehouse")}
                                    className="px-2 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors flex items-center space-x-1 text-sm"
                                >
                                    <span>{translations["Add New"]}</span>
                                </button>
                                <button
                                    onClick={() => handleDelete("warehouse")}
                                    className="px-2 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center space-x-1 text-sm"
                                >
                                    <span>{translations["Delete"]}</span>
                                </button>
                            </div>
                        </div>
                    </div>
                    {/* Table */}
                    <div className="overflow-x-auto">
                        <div className="h-[calc(100vh-220px)] overflow-y-auto">
                            <table className="w-full">
                                <thead className="sticky top-0 z-[1]" style={{ backgroundColor: "#1f2132" }}>
                                    <tr className="border-b" style={{ borderColor: "#2d2d30" }}>
                                        <th className="w-[3%] py-2 px-2 text-gray-400 text-sm">
                                            <div className="flex items-center justify-center h-full">
                                                <CustomCheckbox
                                                    checked={selectedMstrWarehouse.length === warehouseList?.length && warehouseList?.length > 0}
                                                    onChange={(checked) => handleSelectAll_Warehouse(checked)}
                                                />
                                            </div>
                                        </th>
                                        <th className="w-[30%] text-left py-2 px-4 text-gray-400 text-sm ">{translations["Warehouse Name"]}</th>
                                        <th className="w-[16%] text-left py-2 px-4 text-gray-400 text-sm">{translations["Warehouse Code"]}</th>
                                        <th className="w-[17%] text-left py-2 px-4 text-gray-400 text-sm">{translations["Location"]}</th>
                                        <th className="w-[17%] text-left py-2 px-4 text-gray-400 text-sm">{translations["Date Created"]}</th>
                                        <th className="w-[17%] text-left py-2 px-4 text-gray-400 text-sm">{translations["Date Updated"]}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {warehouseList.map((list, index) => (
                                        <tr
                                            key={list.id || index}
                                            onClick={() => {
                                                const data = warehouseList.find((item) => item.id === list.id);
                                                const countryCode = Number(data?.country_code);
                                                const warehouseCode = String(data?.warehouse_code);
                                                const selectedCountry = convertToSingleOption(countryCode, countriesOption);
                                                setFormData((prev) => ({
                                                    ...prev,
                                                    id: Number(data?.id),
                                                    warehouse_en: String(data?.warehouse_en),
                                                    warehouse_cn: String(data?.warehouse_cn),
                                                    country_code: selectedCountry,
                                                    warehouse_code: warehouseCode,
                                                }));
                                                setShowPopup(true);
                                                setModule("warehouse");
                                                setModuleTitle(translations["Edit Warehouse & Location"]);
                                            }}
                                            className={`clickable border-b hover:bg-gray-700 hover:bg-opacity-30 transition-colors cursor-pointer`}
                                            style={{ borderColor: "#40404042" }}
                                        >
                                            <td className="py-2 px-2 text-gray-400 text-left text-custom-sm" onClick={(e) => e.stopPropagation()}>
                                                <div className="flex items-center justify-center h-full">
                                                    <CustomCheckbox
                                                        checked={selectedMstrWarehouse.includes(list.id as number)}
                                                        onChange={(checked) => handleSelectWarehouse(list.id as number, checked)}
                                                    />
                                                </div>
                                            </td>
                                            <td className="py-3 px-4 text-gray-400 text-left text-custom-sm">{lang === "en" ? list.warehouse_en : list.warehouse_cn}</td>
                                            <td className="py-3 px-4 text-gray-400 text-left text-custom-sm">{list.warehouse_code}</td>
                                            <td className="py-3 px-4 text-gray-400 text-left text-custom-sm">{lang === "en" ? list.country_en : list.country_cn}</td>
                                            <td className="py-3 px-4 text-gray-400 text-left text-custom-sm">{list.created_at}</td>
                                            <td className="py-3 px-4 text-gray-400 text-left text-custom-sm">{list.updated_at}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    {/* Footer with Pagination */}
                    <div className="p-4 border-t flex items-center justify-between" style={{ borderColor: "#404040" }}>
                        <div className="flex items-center space-x-4">
                            <MemoizedPagination currentPage={currentPage_Warehouse} totalPages={totalPages_Warehouse} onPageChange={(page) => setCurrentPage_Warehouse(page)} />
                            <MemoizedItemsPerPageSelector
                                value={itemsPerPage_Warehouse}
                                onChange={(val: number) => {
                                    setItemsPerPage_Warehouse(val);
                                    setCurrentPage_Warehouse(1);
                                }}
                                options={pageSizeOptions}
                            />
                        </div>
                        <div className="flex items-center space-x-1">{/* Optional right side content */}</div>
                    </div>
                </>
            );
        }
        if (activeMenu === "logistic-shipping-terms") {
            return (
                <>
                    {/* Toolbar */}
                    <div className="p-4 border-b flex-shrink-0" style={{ borderColor: "#404040" }}>
                        <div className="flex justify-between items-center">
                            <div className="flex items-center space-x-4">
                                <div className="relative">
                                    <input
                                        type="search"
                                        placeholder={translations["Search"]}
                                        value={searchTerm_ShippingTerm}
                                        onChange={(e) => {
                                            setSearchTerm_ShippingTerm(e.target.value);
                                            setCurrentPage_ShippingTerm(1);
                                        }}
                                        className="pl-10 pr-4 py-2 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-sm"
                                        style={{ backgroundColor: "#2d2d30", borderColor: "#555555" }}
                                    />
                                </div>
                            </div>
                            <div className="flex items-center space-x-1">
                                <button
                                    onClick={() => handleAddNew("shipping-terms")}
                                    className="px-2 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors flex items-center space-x-1 text-sm"
                                >
                                    <span>{translations["Add New"]}</span>
                                </button>
                                <button
                                    onClick={() => handleDelete("shipping-terms")}
                                    className="px-2 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center space-x-1 text-sm"
                                >
                                    <span>{translations["Delete"]}</span>
                                </button>
                            </div>
                        </div>
                    </div>
                    {/* Table */}
                    <div className="overflow-x-auto">
                        <div className="h-[calc(100vh-220px)] overflow-y-auto">
                            <table className="w-full">
                                <thead className="sticky top-0 z-[1]" style={{ backgroundColor: "#1f2132" }}>
                                    <tr className="border-b" style={{ borderColor: "#2d2d30" }}>
                                        <th className="w-[3%] py-2 px-2 text-gray-400 text-sm">
                                            <div className="flex items-center justify-center h-full">
                                                <CustomCheckbox
                                                    checked={selectedMstrShippingTerm.length === shippingTermsList?.length && shippingTermsList?.length > 0}
                                                    onChange={(checked) => handleSelectAll_ShippingTerm(checked)}
                                                />
                                            </div>
                                        </th>
                                        <th className="w-[47%] text-left py-2 px-4 text-gray-400 text-sm ">{translations["Description"]}</th>
                                        <th className="w-[25%] text-left py-2 px-4 text-gray-400 text-sm">{translations["Date Created"]}</th>
                                        <th className="w-[25%] text-left py-2 px-4 text-gray-400 text-sm">{translations["Date Updated"]}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {shippingTermsList.map((list, index) => (
                                        <tr
                                            key={list.id || index}
                                            onClick={() => {
                                                const data = shippingTermsList.find((item) => item.id === list.id);
                                                setFormData((prev) => ({
                                                    ...prev,
                                                    id: Number(data?.id),
                                                    shipping_terms_en: String(data?.shipping_terms_en),
                                                    shipping_terms_cn: String(data?.shipping_terms_cn),
                                                }));
                                                setShowPopup(true);
                                                setModule("shipping-terms");
                                                setModuleTitle(translations["Edit Shipping Terms"]);
                                            }}
                                            className={`clickable border-b hover:bg-gray-700 hover:bg-opacity-30 transition-colors cursor-pointer`}
                                            style={{ borderColor: "#40404042" }}
                                        >
                                            <td className="py-2 px-2 text-gray-400 text-left text-custom-sm" onClick={(e) => e.stopPropagation()}>
                                                <div className="flex items-center justify-center h-full">
                                                    <CustomCheckbox
                                                        checked={selectedMstrShippingTerm.includes(list.id as number)}
                                                        onChange={(checked) => handleSelectShippingTerm(list.id as number, checked)}
                                                    />
                                                </div>
                                            </td>
                                            <td className="py-3 px-4 text-gray-400 text-left text-custom-sm">{lang === "en" ? list.shipping_terms_en : list.shipping_terms_cn}</td>
                                            <td className="py-3 px-4 text-gray-400 text-left text-custom-sm">{list.created_at}</td>
                                            <td className="py-3 px-4 text-gray-400 text-left text-custom-sm">{list.updated_at}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    {/* Footer with Pagination */}
                    <div className="p-4 border-t flex items-center justify-between" style={{ borderColor: "#404040" }}>
                        <div className="flex items-center space-x-4">
                            <MemoizedPagination currentPage={currentPage_ShippingTerm} totalPages={totalPages_ShippingTerm} onPageChange={(page) => setCurrentPage_ShippingTerm(page)} />
                            <MemoizedItemsPerPageSelector
                                value={itemsPerPage_ShippingTerm}
                                onChange={(val: number) => {
                                    setItemsPerPage_ShippingTerm(val);
                                    setCurrentPage_ShippingTerm(1);
                                }}
                                options={pageSizeOptions}
                            />
                        </div>
                        <div className="flex items-center space-x-1">{/* Optional right side content */}</div>
                    </div>
                </>
            );
        }
        if (activeMenu === "account-tax") {
            return (
                <>
                    {/* Toolbar */}
                    <div className="p-4 border-b flex-shrink-0" style={{ borderColor: "#404040" }}>
                        <div className="flex justify-between items-center">
                            <div className="flex items-center space-x-4">
                                <div className="relative">
                                    <input
                                        type="search"
                                        placeholder={translations["Search"]}
                                        value={searchTerm_TaxGroup}
                                        onChange={(e) => {
                                            setSearchTerm_TaxGroup(e.target.value);
                                            setCurrentPage_TaxGroup(1);
                                        }}
                                        className="pl-10 pr-4 py-2 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-sm"
                                        style={{ backgroundColor: "#2d2d30", borderColor: "#555555" }}
                                    />
                                </div>
                            </div>
                            <div className="flex items-center space-x-1">
                                <button
                                    onClick={() => handleAddNew("tax-group")}
                                    className="px-2 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors flex items-center space-x-1 text-sm"
                                >
                                    <span>{translations["Add New"]}</span>
                                </button>
                                <button
                                    onClick={() => handleDelete("tax-group")}
                                    className="px-2 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center space-x-1 text-sm"
                                >
                                    <span>{translations["Delete"]}</span>
                                </button>
                            </div>
                        </div>
                    </div>
                    {/* Table */}
                    <div className="overflow-x-auto">
                        <div className="h-[calc(100vh-220px)] overflow-y-auto">
                            <table className="w-full">
                                <thead className="sticky top-0 z-[1]" style={{ backgroundColor: "#1f2132" }}>
                                    <tr className="border-b" style={{ borderColor: "#2d2d30" }}>
                                        <th className="w-[3%] py-2 px-2 text-gray-400 text-sm">
                                            <div className="flex items-center justify-center h-full">
                                                <CustomCheckbox
                                                    checked={selectedMstrTaxGroup.length === taxGroupList?.length && taxGroupList?.length > 0}
                                                    onChange={(checked) => handleSelectAll_TaxGroup(checked)}
                                                />
                                            </div>
                                        </th>
                                        <th className="w-[24%] text-left py-2 px-4 text-gray-400 text-sm ">{translations["Value"]}</th>
                                        <th className="w-[23%] text-left py-2 px-4 text-gray-400 text-sm ">{translations["Description"]}</th>
                                        <th className="w-[25%] text-left py-2 px-4 text-gray-400 text-sm">{translations["Date Created"]}</th>
                                        <th className="w-[25%] text-left py-2 px-4 text-gray-400 text-sm">{translations["Date Updated"]}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {taxGroupList.map((list, index) => (
                                        <tr
                                            key={list.id || index}
                                            onClick={() => {
                                                const data = taxGroupList.find((item) => item.id === list.id);
                                                setFormData((prev) => ({
                                                    ...prev,
                                                    id: Number(data?.id),
                                                    tax_value: String(data?.tax_value),
                                                    tax: String(data?.tax),
                                                }));
                                                setShowPopup(true);
                                                setModule("tax-group");
                                                setModuleTitle(translations["EditTaxGroup"]);
                                            }}
                                            className={`clickable border-b hover:bg-gray-700 hover:bg-opacity-30 transition-colors cursor-pointer`}
                                            style={{ borderColor: "#40404042" }}
                                        >
                                            <td className="py-2 px-2 text-gray-400 text-left text-custom-sm" onClick={(e) => e.stopPropagation()}>
                                                <div className="flex items-center justify-center h-full">
                                                    <CustomCheckbox
                                                        checked={selectedMstrTaxGroup.includes(list.id as number)}
                                                        onChange={(checked) => handleSelectTaxGroup(list.id as number, checked)}
                                                    />
                                                </div>
                                            </td>
                                            <td className="py-3 px-4 text-gray-400 text-left text-custom-sm">{list.tax_value}</td>
                                            <td className="py-3 px-4 text-gray-400 text-left text-custom-sm">{list.tax}</td>
                                            <td className="py-3 px-4 text-gray-400 text-left text-custom-sm">{list.created_at}</td>
                                            <td className="py-3 px-4 text-gray-400 text-left text-custom-sm">{list.updated_at}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    {/* Footer with Pagination */}
                    <div className="p-4 border-t flex items-center justify-between" style={{ borderColor: "#404040" }}>
                        <div className="flex items-center space-x-4">
                            <MemoizedPagination currentPage={currentPage_TaxGroup} totalPages={totalPages_TaxGroup} onPageChange={(page) => setCurrentPage_TaxGroup(page)} />
                            <MemoizedItemsPerPageSelector
                                value={itemsPerPage_TaxGroup}
                                onChange={(val: number) => {
                                    setItemsPerPage_TaxGroup(val);
                                    setCurrentPage_TaxGroup(1);
                                }}
                                options={pageSizeOptions}
                            />
                        </div>
                        <div className="flex items-center space-x-1">{/* Optional right side content */}</div>
                    </div>
                </>
            );
        }
        if (activeMenu === "account-payment-terms") {
            return (
                <>
                    {/* Toolbar */}
                    <div className="p-4 border-b flex-shrink-0" style={{ borderColor: "#404040" }}>
                        <div className="flex justify-between items-center">
                            <div className="flex items-center space-x-4">
                                <div className="relative">
                                    <input
                                        type="search"
                                        placeholder={translations["Search"]}
                                        value={searchTerm_PaymentTerms}
                                        onChange={(e) => {
                                            setSearchTerm_PaymentTerms(e.target.value);
                                            setCurrentPage_PaymentTerms(1);
                                        }}
                                        className="pl-10 pr-4 py-2 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-sm"
                                        style={{ backgroundColor: "#2d2d30", borderColor: "#555555" }}
                                    />
                                </div>
                            </div>
                            <div className="flex items-center space-x-1">
                                <button
                                    onClick={() => handleAddNew("payment-terms")}
                                    className="px-2 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors flex items-center space-x-1 text-sm"
                                >
                                    <span>{translations["Add New"]}</span>
                                </button>
                                <button
                                    onClick={() => handleDelete("payment-terms")}
                                    className="px-2 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center space-x-1 text-sm"
                                >
                                    <span>{translations["Delete"]}</span>
                                </button>
                            </div>
                        </div>
                    </div>
                    {/* Table */}
                    <div className="overflow-x-auto">
                        <div className="h-[calc(100vh-220px)] overflow-y-auto">
                            <table className="w-full">
                                <thead className="sticky top-0 z-[1]" style={{ backgroundColor: "#1f2132" }}>
                                    <tr className="border-b" style={{ borderColor: "#2d2d30" }}>
                                        <th className="w-[3%] py-2 px-2 text-gray-400 text-sm">
                                            <div className="flex items-center justify-center h-full">
                                                <CustomCheckbox
                                                    checked={selectedMstrPaymentTerms.length === paymentTermsList?.length && paymentTermsList?.length > 0}
                                                    onChange={(checked) => handleSelectAll_PaymentTerms(checked)}
                                                />
                                            </div>
                                        </th>
                                        <th className="w-[17%] text-left py-2 px-4 text-gray-400 text-sm ">{translations["Alias"]}</th>
                                        <th className="w-[20%] text-left py-2 px-4 text-gray-400 text-sm ">{translations["Description"]}</th>
                                        <th className="w-[20%] text-left py-2 px-4 text-gray-400 text-sm ">{translations["Terms"]}</th>
                                        <th className="w-[20%] text-left py-2 px-4 text-gray-400 text-sm">{translations["Date Created"]}</th>
                                        <th className="w-[20%] text-left py-2 px-4 text-gray-400 text-sm">{translations["Date Updated"]}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paymentTermsList.map((list, index) => (
                                        <tr
                                            key={list.id || index}
                                            onClick={() => {
                                                const data = paymentTermsList.find((item) => item.id === list.id);
                                                setFormData((prev) => ({
                                                    ...prev,
                                                    id: Number(data?.id),
                                                    payment_terms_en: String(data?.payment_terms_en),
                                                    payment_terms_cn: String(data?.payment_terms_cn),
                                                    terms: String(data?.terms),
                                                    alias: String(data?.alias),
                                                }));
                                                setShowPopup(true);
                                                setModule("payment-terms");
                                                setModuleTitle(translations["Edit Payment Terms"]);
                                            }}
                                            className={`clickable border-b hover:bg-gray-700 hover:bg-opacity-30 transition-colors cursor-pointer`}
                                            style={{ borderColor: "#40404042" }}
                                        >
                                            <td className="py-2 px-2 text-gray-400 text-left text-custom-sm" onClick={(e) => e.stopPropagation()}>
                                                <div className="flex items-center justify-center h-full">
                                                    <CustomCheckbox
                                                        checked={selectedMstrPaymentTerms.includes(list.id as number)}
                                                        onChange={(checked) => handleSelectPaymentTerms(list.id as number, checked)}
                                                    />
                                                </div>
                                            </td>
                                            <td className="py-3 px-4 text-gray-400 text-left text-custom-sm">{list.alias}</td>
                                            <td className="py-3 px-4 text-gray-400 text-left text-custom-sm">{lang === "en" ? list.payment_terms_en : list.payment_terms_cn}</td>
                                            <td className="py-3 px-4 text-gray-400 text-left text-custom-sm">{list.terms}</td>
                                            <td className="py-3 px-4 text-gray-400 text-left text-custom-sm">{list.created_at}</td>
                                            <td className="py-3 px-4 text-gray-400 text-left text-custom-sm">{list.updated_at}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    {/* Footer with Pagination */}
                    <div className="p-4 border-t flex items-center justify-between" style={{ borderColor: "#404040" }}>
                        <div className="flex items-center space-x-4">
                            <MemoizedPagination currentPage={currentPage_PaymentTerms} totalPages={totalPages_PaymentTerms} onPageChange={(page) => setCurrentPage_PaymentTerms(page)} />
                            <MemoizedItemsPerPageSelector
                                value={itemsPerPage_PaymentTerms}
                                onChange={(val: number) => {
                                    setItemsPerPage_PaymentTerms(val);
                                    setCurrentPage_PaymentTerms(1);
                                }}
                                options={pageSizeOptions}
                            />
                        </div>
                        <div className="flex items-center space-x-1">{/* Optional right side content */}</div>
                    </div>
                </>
            );
        }
        if (activeMenu === "customer-source") {
            return (
                <>
                    {/* Toolbar */}
                    <div className="p-4 border-b flex-shrink-0" style={{ borderColor: "#404040" }}>
                        <div className="flex justify-between items-center">
                            <div className="flex items-center space-x-4">
                                <div className="relative">
                                    <input
                                        type="search"
                                        placeholder={translations["Search"]}
                                        value={searchTerm_Source}
                                        onChange={(e) => {
                                            setSearchTerm_Source(e.target.value);
                                            setCurrentPage_Source(1);
                                        }}
                                        className="pl-10 pr-4 py-2 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-sm"
                                        style={{ backgroundColor: "#2d2d30", borderColor: "#555555" }}
                                    />
                                </div>
                            </div>
                            <div className="flex items-center space-x-1">
                                <button
                                    onClick={() => handleAddNew("source")}
                                    className="px-2 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors flex items-center space-x-1 text-sm"
                                >
                                    <span>{translations["Add New"]}</span>
                                </button>
                                <button
                                    onClick={() => handleDelete("source")}
                                    className="px-2 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center space-x-1 text-sm"
                                >
                                    <span>{translations["Delete"]}</span>
                                </button>
                            </div>
                        </div>
                    </div>
                    {/* Table */}
                    <div className="overflow-x-auto">
                        <div className="h-[calc(100vh-220px)] overflow-y-auto">
                            <table className="w-full">
                                <thead className="sticky top-0 z-[1]" style={{ backgroundColor: "#1f2132" }}>
                                    <tr className="border-b" style={{ borderColor: "#2d2d30" }}>
                                        <th className="w-[3%] py-2 px-2 text-gray-400 text-sm">
                                            <div className="flex items-center justify-center h-full">
                                                <CustomCheckbox
                                                    checked={selectedMstrSource.length === sourceList?.length && sourceList?.length > 0}
                                                    onChange={(checked) => handleSelectAll_Source(checked)}
                                                />
                                            </div>
                                        </th>
                                        <th className="w-[31%] text-left py-2 px-4 text-gray-400 text-sm ">{translations["Description"]}</th>
                                        <th className="w-[33%] text-left py-2 px-4 text-gray-400 text-sm">{translations["Date Created"]}</th>
                                        <th className="w-[33%] text-left py-2 px-4 text-gray-400 text-sm">{translations["Date Updated"]}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {sourceList.map((list, index) => (
                                        <tr
                                            key={list.id || index}
                                            onClick={() => {
                                                const data = sourceList.find((item) => item.id === list.id);
                                                setFormData((prev) => ({
                                                    ...prev,
                                                    id: Number(data?.id),
                                                    description_en: String(data?.description_en),
                                                    description_cn: String(data?.description_cn),
                                                }));
                                                setShowPopup(true);
                                                setModule("source");
                                                setModuleTitle(translations["Edit Source"]);
                                            }}
                                            className={`clickable border-b hover:bg-gray-700 hover:bg-opacity-30 transition-colors cursor-pointer`}
                                            style={{ borderColor: "#40404042" }}
                                        >
                                            <td className="py-2 px-2 text-gray-400 text-left text-custom-sm" onClick={(e) => e.stopPropagation()}>
                                                <div className="flex items-center justify-center h-full">
                                                    <CustomCheckbox checked={selectedMstrSource.includes(list.id as number)} onChange={(checked) => handleSelectSource(list.id as number, checked)} />
                                                </div>
                                            </td>
                                            <td className="py-3 px-4 text-gray-400 text-left text-custom-sm">{lang === "en" ? list.description_en : list.description_cn}</td>
                                            <td className="py-3 px-4 text-gray-400 text-left text-custom-sm">{list.created_at}</td>
                                            <td className="py-3 px-4 text-gray-400 text-left text-custom-sm">{list.updated_at}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    {/* Footer with Pagination */}
                    <div className="p-4 border-t flex items-center justify-between" style={{ borderColor: "#404040" }}>
                        <div className="flex items-center space-x-4">
                            <MemoizedPagination currentPage={currentPage_Source} totalPages={totalPages_Source} onPageChange={(page) => setCurrentPage_Source(page)} />
                            <MemoizedItemsPerPageSelector
                                value={itemsPerPage_Source}
                                onChange={(val: number) => {
                                    setItemsPerPage_Source(val);
                                    setCurrentPage_Source(1);
                                }}
                                options={pageSizeOptions}
                            />
                        </div>
                        <div className="flex items-center space-x-1">{/* Optional right side content */}</div>
                    </div>
                </>
            );
        }
        if (activeMenu === "general-store-location") {
            return (
                <>
                    {/* Toolbar */}
                    <div className="p-4 border-b flex-shrink-0" style={{ borderColor: "#404040" }}>
                        <div className="flex justify-between items-center">
                            <div className="flex items-center space-x-4">
                                <div className="relative">
                                    <input
                                        type="search"
                                        placeholder={translations["Search"]}
                                        value={searchTerm_StoreLocation}
                                        onChange={(e) => {
                                            setSearchTerm_StoreLocation(e.target.value);
                                            setCurrentPage_StoreLocation(1);
                                        }}
                                        className="pl-10 pr-4 py-2 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-sm"
                                        style={{ backgroundColor: "#2d2d30", borderColor: "#555555" }}
                                    />
                                </div>
                            </div>
                            <div className="flex items-center space-x-1">
                                <button
                                    onClick={() => handleAddNew("store-location")}
                                    className="px-2 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors flex items-center space-x-1 text-sm"
                                >
                                    <span>{translations["Add New"]}</span>
                                </button>
                                <button
                                    onClick={() => handleDelete("store-location")}
                                    className="px-2 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center space-x-1 text-sm"
                                >
                                    <span>{translations["Delete"]}</span>
                                </button>
                            </div>
                        </div>
                    </div>
                    {/* Table */}
                    <div className="overflow-x-auto">
                        <div className="h-[calc(100vh-220px)] overflow-y-auto">
                            <table className="w-full">
                                <thead className="sticky top-0 z-[1]" style={{ backgroundColor: "#1f2132" }}>
                                    <tr className="border-b" style={{ borderColor: "#2d2d30" }}>
                                        <th className="w-[3%] py-2 px-2 text-gray-400 text-sm">
                                            <div className="flex items-center justify-center h-full">
                                                <CustomCheckbox
                                                    checked={selectedMstrStoreLocation.length === storeLocationList?.length && storeLocationList?.length > 0}
                                                    onChange={(checked) => handleSelectAll_StoreLocation(checked)}
                                                />
                                            </div>
                                        </th>
                                        <th className="w-[30%] text-left py-2 px-4 text-gray-400 text-sm ">{translations["Store Name"]}</th>
                                        <th className="w-[60%] text-left py-2 px-4 text-gray-400 text-sm ">{translations["Address"]}</th>
                                        <th className="w-[7%] text-center py-2 px-4 text-gray-400 text-sm ">{translations["Default"]}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {storeLocationList.map((list, index) => (
                                        <tr
                                            key={list.id || index}
                                            onClick={() => {
                                                const data = storeLocationList.find((item) => item.id === list.id);
                                                setFormData((prev) => ({
                                                    ...prev,
                                                    id: Number(data?.id),
                                                    store_name_en: String(data?.store_name_en),
                                                    store_name_cn: String(data?.store_name_cn),
                                                    address_en: String(data?.address_en),
                                                    address_cn: String(data?.address_cn),
                                                    set_as_default: Number(data?.set_as_default),
                                                }));
                                                setShowPopup(true);
                                                setModule("store-location");
                                                setModuleTitle(translations["Edit Store Location"]);
                                            }}
                                            className={`clickable border-b hover:bg-gray-700 hover:bg-opacity-30 transition-colors cursor-pointer`}
                                            style={{ borderColor: "#40404042" }}
                                        >
                                            <td className="py-2 px-2 text-gray-400 text-left text-custom-sm" onClick={(e) => e.stopPropagation()}>
                                                <div className="flex items-center justify-center h-full">
                                                    <CustomCheckbox
                                                        checked={selectedMstrStoreLocation.includes(list.id as number)}
                                                        onChange={(checked) => handleSelectStoreLocation(list.id as number, checked)}
                                                    />
                                                </div>
                                            </td>
                                            <td className="py-3 px-4 text-gray-400 text-left text-custom-sm">{lang === "en" ? list.store_name_en : list.store_name_cn}</td>
                                            <td className="py-3 px-4 text-gray-400 text-left text-custom-sm">{lang === "en" ? list.address_en : list.address_cn}</td>
                                            {/* <td className="py-3 px-4 text-gray-400 text-center text-custom-sm">{list.set_as_default}</td> */}
                                            <td className="py-3 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                                                <label className="relative inline-flex items-center cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={Number(list.set_as_default) === 1}
                                                        disabled={Number(list.set_as_default) === 1}
                                                        onChange={() => handleSetAsDefault(list.id, "store-location")}
                                                        className="sr-only peer"
                                                    />
                                                    <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-cyan-500 rounded-full peer peer-checked:bg-emerald-600 transition-colors duration-200"></div>
                                                    <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform duration-200 transform peer-checked:translate-x-full"></div>
                                                </label>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    {/* Footer with Pagination */}
                    <div className="p-4 border-t flex items-center justify-between" style={{ borderColor: "#404040" }}>
                        <div className="flex items-center space-x-4">
                            <MemoizedPagination currentPage={currentPage_StoreLocation} totalPages={totalPages_StoreLocation} onPageChange={(page) => setCurrentPage_StoreLocation(page)} />
                            <MemoizedItemsPerPageSelector
                                value={itemsPerPage_StoreLocation}
                                onChange={(val: number) => {
                                    setItemsPerPage_StoreLocation(val);
                                    setCurrentPage_StoreLocation(1);
                                }}
                                options={pageSizeOptions}
                            />
                        </div>
                        <div className="flex items-center space-x-1">{/* Optional right side content */}</div>
                    </div>
                </>
            );
        }
        if (activeMenu === "general-currency") {
            return (
                <>
                    {/* Toolbar */}
                    <div className="p-4 border-b flex-shrink-0" style={{ borderColor: "#404040" }}>
                        <div className="flex justify-between items-center">
                            <div className="flex items-center space-x-4">
                                <div className="relative">
                                    <input
                                        type="search"
                                        placeholder={translations["Search"]}
                                        value={searchTerm_Currency}
                                        onChange={(e) => {
                                            setSearchTerm_Currency(e.target.value);
                                            setCurrentPage_Currency(1);
                                        }}
                                        className="pl-10 pr-4 py-2 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-sm"
                                        style={{ backgroundColor: "#2d2d30", borderColor: "#555555" }}
                                    />
                                </div>
                            </div>
                            <div className="flex items-center space-x-1">
                                <button
                                    onClick={() => handleAddNew("currency")}
                                    className="px-2 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors flex items-center space-x-1 text-sm"
                                >
                                    <span>{translations["Add New"]}</span>
                                </button>
                                <button
                                    onClick={() => handleDelete("currency")}
                                    className="px-2 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center space-x-1 text-sm"
                                >
                                    <span>{translations["Delete"]}</span>
                                </button>
                            </div>
                        </div>
                    </div>
                    {/* Table */}
                    <div className="overflow-x-auto">
                        <div className="h-[calc(100vh-220px)] overflow-y-auto">
                            <table className="w-full">
                                <thead className="sticky top-0 z-[1]" style={{ backgroundColor: "#1f2132" }}>
                                    <tr className="border-b" style={{ borderColor: "#2d2d30" }}>
                                        <th className="w-[3%] py-2 px-2 text-gray-400 text-sm">
                                            <div className="flex items-center justify-center h-full">
                                                <CustomCheckbox
                                                    checked={selectedMstrCurrency.length === currencyList?.length && currencyList?.length > 0}
                                                    onChange={(checked) => handleSelectAll_Currency(checked)}
                                                />
                                            </div>
                                        </th>
                                        <th className="w-[60%] text-left py-2 px-4 text-gray-400 text-sm ">{translations["Currency Title"]}</th>
                                        <th className="w-[30%] text-left py-2 px-4 text-gray-400 text-sm ">{translations["Code"]}</th>
                                        <th className="w-[7%] text-center py-2 px-4 text-gray-400 text-sm ">{translations["Default"]}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {currencyList.map((list, index) => (
                                        <tr
                                            key={list.id || index}
                                            onClick={() => {
                                                const data = currencyList.find((item) => item.id === list.id);
                                                setFormData((prev) => ({
                                                    ...prev,
                                                    id: Number(data?.id),
                                                    code: String(data?.code),
                                                    currency_title: String(data?.currency_title),
                                                    set_as_default: Number(data?.set_as_default),
                                                }));
                                                setShowPopup(true);
                                                setModule("currency");
                                                setModuleTitle(translations["Edit Currency"]);
                                            }}
                                            className={`clickable border-b hover:bg-gray-700 hover:bg-opacity-30 transition-colors cursor-pointer`}
                                            style={{ borderColor: "#40404042" }}
                                        >
                                            <td className="py-2 px-2 text-gray-400 text-left text-custom-sm" onClick={(e) => e.stopPropagation()}>
                                                <div className="flex items-center justify-center h-full">
                                                    <CustomCheckbox
                                                        checked={selectedMstrCurrency.includes(list.id as number)}
                                                        onChange={(checked) => handleSelectCurrency(list.id as number, checked)}
                                                    />
                                                </div>
                                            </td>
                                            <td className="py-3 px-4 text-gray-400 text-left text-custom-sm">{list.currency_title}</td>
                                            <td className="py-3 px-4 text-gray-400 text-left text-custom-sm">{list.code}</td>
                                            <td className="py-3 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                                                <label className="relative inline-flex items-center cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={Number(list.set_as_default) === 1}
                                                        disabled={Number(list.set_as_default) === 1}
                                                        onChange={() => handleSetAsDefault(list.id, "currency")}
                                                        className="sr-only peer"
                                                    />
                                                    <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-cyan-500 rounded-full peer peer-checked:bg-emerald-600 transition-colors duration-200"></div>
                                                    <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform duration-200 transform peer-checked:translate-x-full"></div>
                                                </label>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    {/* Footer with Pagination */}
                    <div className="p-4 border-t flex items-center justify-between" style={{ borderColor: "#404040" }}>
                        <div className="flex items-center space-x-4">
                            <MemoizedPagination currentPage={currentPage_Currency} totalPages={totalPages_Currency} onPageChange={(page) => setCurrentPage_Currency(page)} />
                            <MemoizedItemsPerPageSelector
                                value={itemsPerPage_Currency}
                                onChange={(val: number) => {
                                    setItemsPerPage_Currency(val);
                                    setCurrentPage_Currency(1);
                                }}
                                options={pageSizeOptions}
                            />
                        </div>
                        <div className="flex items-center space-x-1">{/* Optional right side content */}</div>
                    </div>
                </>
            );
        }
        if (activeMenu === "general-settings") {
            return (
                <>
                    {/* Toolbar */}
                    <div className="p-4 border-b flex-shrink-0" style={{ borderColor: "#404040" }}>
                        <div className="flex justify-between items-center">
                            <div className="flex items-center space-x-4">
                                <div className="relative">
                                    <input
                                        type="search"
                                        placeholder={translations["Search"]}
                                        value={searchTerm_ISSettings}
                                        onChange={(e) => {
                                            setSearchTerm_ISSettings(e.target.value);
                                            setCurrentPage_ISSettings(1);
                                        }}
                                        className="pl-10 pr-4 py-2 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-sm"
                                        style={{ backgroundColor: "#2d2d30", borderColor: "#555555" }}
                                    />
                                </div>
                            </div>
                            <div className="flex items-center space-x-1">
                                <button
                                    onClick={() => handleAddNew("issettings")}
                                    className="px-2 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors flex items-center space-x-1 text-sm"
                                >
                                    <span>{translations["Add New"]}</span>
                                </button>
                                <button
                                    onClick={() => handleDelete("issettings")}
                                    className="px-2 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center space-x-1 text-sm"
                                >
                                    <span>{translations["Delete"]}</span>
                                </button>
                            </div>
                        </div>
                    </div>
                    {/* Table */}
                    <div className="overflow-x-auto">
                        <div className="h-[calc(100vh-220px)] overflow-y-auto">
                            <table className="w-full">
                                <thead className="sticky top-0 z-[1]" style={{ backgroundColor: "#1f2132" }}>
                                    <tr className="border-b" style={{ borderColor: "#2d2d30" }}>
                                        <th className="w-[3%] py-2 px-2 text-gray-400 text-sm">
                                            <div className="flex items-center justify-center h-full">
                                                <CustomCheckbox
                                                    checked={selectedMstrISSettings.length === isSettingsList?.length && isSettingsList?.length > 0}
                                                    onChange={(checked) => handleSelectAll_ISSettings(checked)}
                                                />
                                            </div>
                                        </th>
                                        <th className="w-[31%] text-left py-2 px-4 text-gray-400 text-sm ">{translations["Settings Tag"]}</th>
                                        <th className="w-[33%] text-left py-2 px-4 text-gray-400 text-sm ">EN</th>
                                        <th className="w-[33%] text-left py-2 px-4 text-gray-400 text-sm ">CN</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {isSettingsList.map((list, index) => (
                                        <tr
                                            key={list.id || index}
                                            onClick={() => {
                                                const data = isSettingsList.find((item) => item.id === list.id);
                                                setFormData((prev) => ({
                                                    ...prev,
                                                    id: Number(data?.id),
                                                    tag: String(data?.tag),
                                                    en: String(data?.en),
                                                    cn: String(data?.cn),
                                                }));
                                                setShowPopup(true);
                                                setModule("issettings");
                                                setModuleTitle(translations["Settings"]);
                                            }}
                                            className={`clickable border-b hover:bg-gray-700 hover:bg-opacity-30 transition-colors cursor-pointer`}
                                            style={{ borderColor: "#40404042" }}
                                        >
                                            <td className="py-2 px-2 text-gray-400 text-left text-custom-sm" onClick={(e) => e.stopPropagation()}>
                                                <div className="flex items-center justify-center h-full">
                                                    <CustomCheckbox
                                                        checked={selectedMstrISSettings.includes(list.id as number)}
                                                        onChange={(checked) => handleSelectISSettings(list.id as number, checked)}
                                                    />
                                                </div>
                                            </td>
                                            <td className="py-3 px-4 text-gray-400 text-left text-custom-sm">{list.tag}</td>
                                            <td className="py-3 px-4 text-gray-400 text-left text-custom-sm">{list.en}</td>
                                            <td className="py-3 px-4 text-gray-400 text-left text-custom-sm">{list.cn}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    {/* Footer with Pagination */}
                    <div className="p-4 border-t flex items-center justify-between" style={{ borderColor: "#404040" }}>
                        <div className="flex items-center space-x-4">
                            <MemoizedPagination currentPage={currentPage_ISSettings} totalPages={totalPages_ISSettings} onPageChange={(page) => setCurrentPage_ISSettings(page)} />
                            <MemoizedItemsPerPageSelector
                                value={itemsPerPage_ISSettings}
                                onChange={(val: number) => {
                                    setItemsPerPage_ISSettings(val);
                                    setCurrentPage_ISSettings(1);
                                }}
                                options={pageSizeOptions}
                            />
                        </div>
                        <div className="flex items-center space-x-1">{/* Optional right side content */}</div>
                    </div>
                </>
            );
        }
        if (activeMenu === "general-department") {
            return (
                <>
                    {/* Toolbar */}
                    <div className="p-4 border-b flex-shrink-0" style={{ borderColor: "#404040" }}>
                        <div className="flex justify-between items-center">
                            <div className="flex items-center space-x-4">
                                <div className="relative">
                                    <input
                                        type="search"
                                        placeholder={translations["Search"]}
                                        value={searchTerm_EmpDepartment}
                                        onChange={(e) => {
                                            setSearchTerm_EmpDepartment(e.target.value);
                                            setCurrentPage_EmpDepartment(1);
                                        }}
                                        className="pl-10 pr-4 py-2 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-sm"
                                        style={{ backgroundColor: "#2d2d30", borderColor: "#555555" }}
                                    />
                                </div>
                            </div>
                            <div className="flex items-center space-x-1">
                                <button
                                    onClick={() => handleAddNew("department")}
                                    className="px-2 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors flex items-center space-x-1 text-sm"
                                >
                                    <span>{translations["Add New"]}</span>
                                </button>
                                <button
                                    onClick={() => handleDelete("department")}
                                    className="px-2 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center space-x-1 text-sm"
                                >
                                    <span>{translations["Delete"]}</span>
                                </button>
                            </div>
                        </div>
                    </div>
                    {/* Table */}
                    <div className="overflow-x-auto">
                        <div className="h-[calc(100vh-220px)] overflow-y-auto">
                            <table className="w-full">
                                <thead className="sticky top-0 z-[1]" style={{ backgroundColor: "#1f2132" }}>
                                    <tr className="border-b" style={{ borderColor: "#2d2d30" }}>
                                        <th className="w-[3%] py-2 px-2 text-gray-400 text-sm">
                                            <div className="flex items-center justify-center h-full">
                                                <CustomCheckbox
                                                    checked={selectedMstrEmpDepartment.length === empDepartmentList?.length && empDepartmentList?.length > 0}
                                                    onChange={(checked) => handleSelectAll_EmpDepartment(checked)}
                                                />
                                            </div>
                                        </th>
                                        <th className="w-[30%] text-left py-2 px-4 text-gray-400 text-sm ">{translations["Code"]}</th>
                                        <th className="w-[67%] text-left py-2 px-4 text-gray-400 text-sm ">{translations["Description"]}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {empDepartmentList.map((list, index) => (
                                        <tr
                                            key={list.id || index}
                                            onClick={() => {
                                                const data = empDepartmentList.find((item) => item.id === list.id);
                                                setFormData((prev) => ({
                                                    ...prev,
                                                    id: Number(data?.id),
                                                    alias: String(data?.alias),
                                                    description_en: String(data?.description_en),
                                                    description_cn: String(data?.description_cn),
                                                }));
                                                setShowPopup(true);
                                                setModule("department");
                                                setModuleTitle(translations["Department"]);
                                            }}
                                            className={`clickable border-b hover:bg-gray-700 hover:bg-opacity-30 transition-colors cursor-pointer`}
                                            style={{ borderColor: "#40404042" }}
                                        >
                                            <td className="py-2 px-2 text-gray-400 text-left text-custom-sm" onClick={(e) => e.stopPropagation()}>
                                                <div className="flex items-center justify-center h-full">
                                                    <CustomCheckbox
                                                        checked={selectedMstrEmpDepartment.includes(list.id as number)}
                                                        onChange={(checked) => handleSelectEmpDepartment(list.id as number, checked)}
                                                    />
                                                </div>
                                            </td>
                                            <td className="py-3 px-4 text-gray-400 text-left text-custom-sm">{list.alias}</td>
                                            <td className="py-3 px-4 text-gray-400 text-left text-custom-sm">{lang === "en" ? list.description_en : list.description_cn}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    {/* Footer with Pagination */}
                    <div className="p-4 border-t flex items-center justify-between" style={{ borderColor: "#404040" }}>
                        <div className="flex items-center space-x-4">
                            <MemoizedPagination currentPage={currentPage_EmpDepartment} totalPages={totalPages_EmpDepartment} onPageChange={(page) => setCurrentPage_EmpDepartment(page)} />
                            <MemoizedItemsPerPageSelector
                                value={itemsPerPage_EmpDepartment}
                                onChange={(val: number) => {
                                    setItemsPerPage_EmpDepartment(val);
                                    setCurrentPage_EmpDepartment(1);
                                }}
                                options={pageSizeOptions}
                            />
                        </div>
                        <div className="flex items-center space-x-1">{/* Optional right side content */}</div>
                    </div>
                </>
            );
        }
    };
    const handleSave = async () => {
        const data = new FormData();
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
            const result = await settingService.updateSettings(data, module);
            if (result.token === "Error") {
                showErrorToast(result.message);
                return;
            }
            if (result.token === "Warning") {
                showErrorToast(translations[result.message]);
                return;
            }
            reloadFetch();
            setShowPopup(false);
            showSuccessToast(translations[result.message]);
        } catch (error) {
            showErrorToast(translations["Failed to save Transaction."] || "Failed to save Transaction.");
        }
    };
    const reloadFetch = () => {
        switch (activeMenu) {
            case "language":
                setSelectedLanguages([]); // Assuming this is a React state setter
                fetchLanguages(currentPage_language, itemsPerPage_Language, searchTerm_Language);
                break;

            case "logistic-courier":
                setSelectedCourier([]); // Assuming this is a React state setter
                localStorage.removeItem("cached-courier");
                fetchCourier(currentPage_Courier, itemsPerPage_Courier, searchTerm_Courier);
                break;

            case "logistic-shipping-status":
                setSelectedShippingStat([]); // Assuming this is a React state setter
                localStorage.removeItem("cached-shipping-stat");
                fetchShippingStatus(currentPage_ShippingStat, itemsPerPage_ShippingStat, searchTerm_ShippingStat);
                break;

            case "logistic-warehouse":
                setSelectedWarehouse([]); // Assuming this is a React state setter
                localStorage.removeItem("cached-warehouse");
                fetchWarehouse(currentPage_Warehouse, itemsPerPage_Warehouse, searchTerm_Warehouse);
                break;

            case "logistic-shipping-terms":
                setSelectedShippingTerm([]); // Assuming this is a React state setter
                localStorage.removeItem("cached-shipping-terms");
                fetchShippingTerms(currentPage_ShippingTerm, itemsPerPage_ShippingTerm, searchTerm_ShippingTerm);
                break;

            case "account-tax":
                setSelectedTaxGroup([]); // Assuming this is a React state setter
                localStorage.removeItem("cached-tax-group");
                fetchTaxGroup(currentPage_TaxGroup, itemsPerPage_TaxGroup, searchTerm_TaxGroup);
                break;

            case "account-payment-terms":
                setSelectedPaymentTerms([]); // Assuming this is a React state setter
                localStorage.removeItem("cached-payment-terms");
                fetchPaymentTerms(currentPage_PaymentTerms, itemsPerPage_PaymentTerms, searchTerm_PaymentTerms);
                break;

            case "customer-source":
                setSelectedSource([]); // Assuming this is a React state setter
                localStorage.removeItem("cached-source");
                fetchSource(currentPage_Source, itemsPerPage_Source, searchTerm_Source);
                break;

            case "general-store-location":
                setSelectedStoreLocation([]); // Assuming this is a React state setter
                localStorage.removeItem("cached-store-location");
                fetchStoreLocation(currentPage_StoreLocation, itemsPerPage_StoreLocation, searchTerm_StoreLocation);
                break;

            case "general-currency":
                setSelectedCurrency([]); // Assuming this is a React state setter
                localStorage.removeItem("cached-currency");
                fetchCurrency(currentPage_Currency, itemsPerPage_Currency, searchTerm_Currency);
                break;

            case "general-settings":
                setSelectedISSettings([]); // Assuming this is a React state setter
                fetchISSettings(currentPage_ISSettings, itemsPerPage_ISSettings, searchTerm_ISSettings);
                break;

            case "general-department":
                setSelectedEmpDepartment([]); // Assuming this is a React state setter
                fetchEmpDepartment(currentPage_EmpDepartment, itemsPerPage_EmpDepartment, searchTerm_EmpDepartment);
                break;

            default:
                console.warn(`Unknown module: ${module}`);
                break;
        }
    };
    const renderPopup = () => {
        if (!showPopup) return null;
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-[#19191c] rounded-xl border border-[#ffffff1a] w-[30vw] h-auto flex flex-col">
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-[#ffffff1a]">
                        <div className="flex items-center space-x-4">
                            <h2 className="text-xl font-bold text-white">{moduleTitle}</h2>
                        </div>
                        <div className="flex items-center space-x-4">
                            <button
                                onClick={() => {
                                    setShowPopup(false);
                                }}
                                className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                            >
                                <X className="h-6 w-6 text-white" />
                            </button>
                        </div>
                    </div>
                    {/* Content */}
                    <div className="grid grid-cols-12 gap-4 p-4">
                        {activeMenu === "language" && (
                            <>
                                <div className="col-span-12 flex items-center gap-4">
                                    <label className="text-gray-400 text-sm w-14 text-right">{translations["Tag"]}</label>
                                    <input
                                        type="text"
                                        value={formData.loc_tag}
                                        onChange={(e) => {
                                            const value = e.target.value;
                                            setFormData((prev) => ({ ...prev, loc_tag: value }));
                                        }}
                                        className="flex-1 px-3 py-2 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm"
                                    />
                                </div>
                                <div className="col-span-12 flex items-center gap-4">
                                    <label className="text-gray-400 text-sm w-14 text-right">EN</label>
                                    <input
                                        type="text"
                                        value={formData.en}
                                        onChange={(e) => {
                                            const value = e.target.value;
                                            setFormData((prev) => ({ ...prev, en: value }));
                                        }}
                                        className="flex-1 px-3 py-2 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm"
                                    />
                                </div>
                                <div className="col-span-12 flex items-center gap-4">
                                    <label className="text-gray-400 text-sm w-14 text-right">CN</label>
                                    <input
                                        type="text"
                                        value={formData.cn}
                                        onChange={(e) => {
                                            const value = e.target.value;
                                            setFormData((prev) => ({ ...prev, cn: value }));
                                        }}
                                        className="flex-1 px-3 py-2 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm"
                                    />
                                </div>
                            </>
                        )}
                        {activeMenu === "logistic-courier" && (
                            <>
                                <div className="col-span-12 flex items-center gap-4">
                                    <label className="text-gray-400 text-sm w-24 text-right">{translations["Courier Name"]}</label>
                                    <input
                                        type="text"
                                        hidden={lang === "cn"}
                                        value={formData.courier_en}
                                        onChange={(e) => {
                                            const value = e.target.value;
                                            setFormData((prev) => ({ ...prev, courier_en: value }));
                                        }}
                                        className="flex-1 px-3 py-2 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm"
                                    />
                                    <input
                                        type="text"
                                        hidden={lang === "en"}
                                        value={formData.courier_cn}
                                        onChange={(e) => {
                                            const value = e.target.value;
                                            setFormData((prev) => ({ ...prev, courier_cn: value }));
                                        }}
                                        className="flex-1 px-3 py-2 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm"
                                    />
                                </div>
                                <div className="col-span-12 flex items-center gap-4">
                                    <label className="text-gray-400 text-sm w-24 text-right">{translations["Alias"]}</label>
                                    <input
                                        type="text"
                                        value={formData.alias}
                                        onChange={(e) => {
                                            const value = e.target.value;
                                            setFormData((prev) => ({ ...prev, alias: value }));
                                        }}
                                        className="flex-1 px-3 py-2 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm"
                                    />
                                </div>
                            </>
                        )}
                        {activeMenu === "logistic-shipping-status" && (
                            <>
                                <div className="col-span-12 flex items-center gap-4">
                                    <label className="text-gray-400 text-sm w-[20%] text-right">{translations["Shipping Status"]}</label>
                                    <input
                                        type="text"
                                        hidden={lang === "cn"}
                                        value={formData.shipping_stat_en}
                                        onChange={(e) => {
                                            const value = e.target.value;
                                            setFormData((prev) => ({ ...prev, shipping_stat_en: value }));
                                        }}
                                        className="flex-1 px-3 py-2 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm"
                                    />
                                    <input
                                        type="text"
                                        hidden={lang === "en"}
                                        value={formData.shipping_stat_cn}
                                        onChange={(e) => {
                                            const value = e.target.value;
                                            setFormData((prev) => ({ ...prev, shipping_stat_cn: value }));
                                        }}
                                        className="flex-1 px-3 py-2 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm"
                                    />
                                </div>
                                <div className="col-span-12 flex items-center gap-4">
                                    <label className="text-gray-400 text-sm w-[21%] text-right">{translations["Country"]}</label>
                                    <Select
                                        classNamePrefix="react-select"
                                        value={formData.country_code}
                                        onChange={(selected) => {
                                            setFormData({ ...formData, country_code: selected as OptionType | null });
                                        }}
                                        options={countriesOption}
                                        styles={{
                                            ...selectStyles,
                                            menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                                        }}
                                        className="w-[80%]"
                                        isClearable
                                        placeholder={translations["Select"]}
                                        menuPlacement="auto"
                                        menuPosition="fixed"
                                        menuPortalTarget={typeof window !== "undefined" ? document.body : null}
                                    />
                                </div>
                                <div className="col-span-12 flex items-center gap-4">
                                    <label className="text-gray-400 text-sm w-[21%] text-right">{translations["Warehouse"]}</label>
                                    <Select
                                        classNamePrefix="react-select"
                                        value={formData.warehouse}
                                        onChange={(selected) => {
                                            setFormData({ ...formData, warehouse: selected as OptionType | null });
                                        }}
                                        options={warehouseOptions}
                                        styles={{
                                            ...selectStyles,
                                            menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                                        }}
                                        className="w-[80%]"
                                        isClearable
                                        placeholder={translations["Select"]}
                                        menuPlacement="auto"
                                        menuPosition="fixed"
                                        menuPortalTarget={typeof window !== "undefined" ? document.body : null}
                                    />
                                </div>
                            </>
                        )}
                        {activeMenu === "logistic-warehouse" && (
                            <>
                                <div className="col-span-12 flex items-center gap-4">
                                    <label className="text-gray-400 text-sm w-[25%] text-right">{translations["Warehouse Name"]}</label>
                                    <input
                                        type="text"
                                        hidden={lang === "cn"}
                                        value={formData.warehouse_en}
                                        onChange={(e) => {
                                            const value = e.target.value;
                                            setFormData((prev) => ({ ...prev, warehouse_en: value }));
                                        }}
                                        className="flex-1 px-3 py-2 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm"
                                    />
                                    <input
                                        type="text"
                                        hidden={lang === "en"}
                                        value={formData.warehouse_cn}
                                        onChange={(e) => {
                                            const value = e.target.value;
                                            setFormData((prev) => ({ ...prev, warehouse_cn: value }));
                                        }}
                                        className="flex-1 px-3 py-2 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm"
                                    />
                                </div>
                                <div className="col-span-12 flex items-center gap-4">
                                    <label className="text-gray-400 text-sm w-[25%] text-right">{translations["Warehouse Code"]}</label>
                                    <input
                                        type="text"
                                        value={formData.warehouse_code}
                                        onChange={(e) => {
                                            const value = e.target.value;
                                            setFormData((prev) => ({ ...prev, warehouse_code: value }));
                                        }}
                                        className="flex-1 px-3 py-2 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm"
                                    />
                                </div>
                                <div className="col-span-12 flex items-center gap-4">
                                    <label className="text-gray-400 text-sm w-[26%] text-right">{translations["Country"]}</label>
                                    <Select
                                        classNamePrefix="react-select"
                                        value={formData.country_code}
                                        onChange={(selected) => {
                                            setFormData({ ...formData, country_code: selected as OptionType | null });
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
                            </>
                        )}
                        {activeMenu === "logistic-shipping-terms" && (
                            <>
                                <div className="col-span-12 flex items-center gap-4">
                                    <label className="text-gray-400 text-sm w-[25%] text-right">{translations["Shipping Terms"]}</label>
                                    <input
                                        type="text"
                                        hidden={lang === "cn"}
                                        value={formData.shipping_terms_en}
                                        onChange={(e) => {
                                            const value = e.target.value;
                                            setFormData((prev) => ({ ...prev, shipping_terms_en: value }));
                                        }}
                                        className="flex-1 px-3 py-2 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm"
                                    />
                                    <input
                                        type="text"
                                        hidden={lang === "en"}
                                        value={formData.shipping_terms_cn}
                                        onChange={(e) => {
                                            const value = e.target.value;
                                            setFormData((prev) => ({ ...prev, shipping_terms_cn: value }));
                                        }}
                                        className="flex-1 px-3 py-2 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm"
                                    />
                                </div>
                            </>
                        )}
                        {activeMenu === "account-tax" && (
                            <>
                                <div className="col-span-12 flex items-center gap-4">
                                    <label className="text-gray-400 text-sm w-[25%] text-right">{translations["Value"]}</label>
                                    <input
                                        type="text"
                                        value={formData.tax_value}
                                        onChange={(e) => {
                                            const value = e.target.value;
                                            setFormData((prev) => ({ ...prev, tax_value: value }));
                                        }}
                                        className="flex-1 px-3 py-2 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm"
                                    />
                                </div>
                                <div className="col-span-12 flex items-center gap-4">
                                    <label className="text-gray-400 text-sm w-[25%] text-right">{translations["Description"]}</label>
                                    <input
                                        type="text"
                                        value={formData.tax}
                                        onChange={(e) => {
                                            const value = e.target.value;
                                            setFormData((prev) => ({ ...prev, tax: value }));
                                        }}
                                        className="flex-1 px-3 py-2 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm"
                                    />
                                </div>
                            </>
                        )}
                        {activeMenu === "account-payment-terms" && (
                            <>
                                <div className="col-span-12 flex items-center gap-4">
                                    <label className="text-gray-400 text-sm w-[25%] text-right">{translations["Alias"]}</label>
                                    <input
                                        type="text"
                                        value={formData.alias}
                                        onChange={(e) => {
                                            const value = e.target.value;
                                            setFormData((prev) => ({ ...prev, alias: value }));
                                        }}
                                        className="flex-1 px-3 py-2 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm"
                                    />
                                </div>
                                <div className="col-span-12 flex items-center gap-4">
                                    <label className="text-gray-400 text-sm w-[25%] text-right">{translations["Description"]}</label>
                                    <input
                                        type="text"
                                        value={formData.payment_terms_en}
                                        hidden={lang === "cn"}
                                        onChange={(e) => {
                                            const value = e.target.value;
                                            setFormData((prev) => ({ ...prev, payment_terms_en: value }));
                                        }}
                                        className="flex-1 px-3 py-2 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm"
                                    />
                                    <input
                                        type="text"
                                        hidden={lang === "en"}
                                        value={formData.payment_terms_cn}
                                        onChange={(e) => {
                                            const value = e.target.value;
                                            setFormData((prev) => ({ ...prev, payment_terms_cn: value }));
                                        }}
                                        className="flex-1 px-3 py-2 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm"
                                    />
                                </div>
                                <div className="col-span-12 flex items-center gap-4">
                                    <label className="text-gray-400 text-sm w-[25%] text-right">{translations["Terms"]}</label>
                                    <input
                                        type="text"
                                        value={formData.terms}
                                        onChange={(e) => {
                                            const value = e.target.value;
                                            setFormData((prev) => ({ ...prev, terms: value }));
                                        }}
                                        className="flex-1 px-3 py-2 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm"
                                    />
                                </div>
                            </>
                        )}
                        {activeMenu === "customer-source" && (
                            <>
                                <div className="col-span-12 flex items-center gap-4">
                                    <label className="text-gray-400 text-sm w-[25%] text-right">{translations["Description"]}</label>
                                    <input
                                        type="text"
                                        value={formData.description_en}
                                        hidden={lang === "cn"}
                                        onChange={(e) => {
                                            const value = e.target.value;
                                            setFormData((prev) => ({ ...prev, description_en: value }));
                                        }}
                                        className="flex-1 px-3 py-2 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm"
                                    />
                                    <input
                                        type="text"
                                        hidden={lang === "en"}
                                        value={formData.description_cn}
                                        onChange={(e) => {
                                            const value = e.target.value;
                                            setFormData((prev) => ({ ...prev, description_cn: value }));
                                        }}
                                        className="flex-1 px-3 py-2 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm"
                                    />
                                </div>
                            </>
                        )}
                        {activeMenu === "general-store-location" && (
                            <>
                                <div className="col-span-12 flex items-center gap-4">
                                    <label className="text-gray-400 text-sm w-[25%] text-right">{translations["Store Name"]}</label>
                                    <input
                                        type="text"
                                        value={formData.store_name_en}
                                        hidden={lang === "cn"}
                                        onChange={(e) => {
                                            const value = e.target.value;
                                            setFormData((prev) => ({ ...prev, store_name_en: value }));
                                        }}
                                        className="flex-1 px-3 py-2 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm"
                                    />
                                    <input
                                        type="text"
                                        hidden={lang === "en"}
                                        value={formData.store_name_cn}
                                        onChange={(e) => {
                                            const value = e.target.value;
                                            setFormData((prev) => ({ ...prev, store_name_cn: value }));
                                        }}
                                        className="flex-1 px-3 py-2 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm"
                                    />
                                </div>
                                <div className="col-span-12 flex items-center gap-4">
                                    <label className="text-gray-400 text-sm w-[25%] text-right">{translations["Address"]}</label>
                                    <textarea
                                        value={formData.address_en}
                                        rows={5}
                                        hidden={lang === "cn"}
                                        onChange={(e) => {
                                            const value = e.target.value;
                                            setFormData((prev) => ({ ...prev, address_en: value }));
                                        }}
                                        className="flex-1 px-3 py-2 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm"
                                    />
                                    <textarea
                                        hidden={lang === "en"}
                                        rows={5}
                                        value={formData.address_cn}
                                        onChange={(e) => {
                                            const value = e.target.value;
                                            setFormData((prev) => ({ ...prev, address_cn: value }));
                                        }}
                                        className="flex-1 px-3 py-2 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm"
                                    />
                                </div>
                            </>
                        )}
                        {activeMenu === "general-currency" && (
                            <>
                                <div className="col-span-12 flex items-center gap-4">
                                    <label className="text-gray-400 text-sm w-[25%] text-right">{translations["Code"]}</label>
                                    <input
                                        type="text"
                                        value={formData.code}
                                        onChange={(e) => {
                                            const value = e.target.value;
                                            setFormData((prev) => ({ ...prev, code: value }));
                                        }}
                                        className="flex-1 px-3 py-2 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm"
                                    />
                                </div>
                                <div className="col-span-12 flex items-center gap-4">
                                    <label className="text-gray-400 text-sm w-[25%] text-right">{translations["Title"]}</label>
                                    <input
                                        type="text"
                                        value={formData.currency_title}
                                        onChange={(e) => {
                                            const value = e.target.value;
                                            setFormData((prev) => ({ ...prev, currency_title: value }));
                                        }}
                                        className="flex-1 px-3 py-2 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm"
                                    />
                                </div>
                            </>
                        )}
                        {activeMenu === "general-settings" && (
                            <>
                                <div className="col-span-12 flex items-center gap-4">
                                    <label className="text-gray-400 text-sm w-[25%] text-right">{translations["Tag"]}</label>
                                    <input
                                        type="text"
                                        value={formData.tag}
                                        onChange={(e) => {
                                            const value = e.target.value;
                                            setFormData((prev) => ({ ...prev, tag: value }));
                                        }}
                                        className="flex-1 px-3 py-2 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm"
                                    />
                                </div>
                                <div className="col-span-12 flex items-center gap-4">
                                    <label className="text-gray-400 text-sm w-[25%] text-right">EN</label>
                                    <input
                                        type="text"
                                        value={formData.en}
                                        onChange={(e) => {
                                            const value = e.target.value;
                                            setFormData((prev) => ({ ...prev, en: value }));
                                        }}
                                        className="flex-1 px-3 py-2 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm"
                                    />
                                </div>
                                <div className="col-span-12 flex items-center gap-4">
                                    <label className="text-gray-400 text-sm w-[25%] text-right">CN</label>
                                    <input
                                        type="text"
                                        value={formData.cn}
                                        onChange={(e) => {
                                            const value = e.target.value;
                                            setFormData((prev) => ({ ...prev, cn: value }));
                                        }}
                                        className="flex-1 px-3 py-2 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm"
                                    />
                                </div>
                            </>
                        )}
                        {activeMenu === "general-department" && (
                            <>
                                <div className="col-span-12 flex items-center gap-4">
                                    <label className="text-gray-400 text-sm w-[25%] text-right">{translations["Code"]}</label>
                                    <input
                                        type="text"
                                        value={formData.alias}
                                        onChange={(e) => {
                                            const value = e.target.value;
                                            setFormData((prev) => ({ ...prev, alias: value }));
                                        }}
                                        className="flex-1 px-3 py-2 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm"
                                    />
                                </div>
                                <div className="col-span-12 flex items-center gap-4">
                                    <label className="text-gray-400 text-sm w-[25%] text-right">{translations["Description"]}</label>
                                    <input
                                        type="text"
                                        hidden={lang === "cn"}
                                        value={formData.description_en}
                                        onChange={(e) => {
                                            const value = e.target.value;
                                            setFormData((prev) => ({ ...prev, description_en: value }));
                                        }}
                                        className="flex-1 px-3 py-2 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm"
                                    />
                                    <input
                                        type="text"
                                        hidden={lang === "en"}
                                        value={formData.description_cn}
                                        onChange={(e) => {
                                            const value = e.target.value;
                                            setFormData((prev) => ({ ...prev, description_cn: value }));
                                        }}
                                        className="flex-1 px-3 py-2 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm"
                                    />
                                </div>
                            </>
                        )}
                    </div>
                    {/* Footer */}
                    <div className="p-2 border-t border-[#ffffff1a] flex justify-end space-x-1">
                        <button onClick={() => setShowPopup(false)} className="px-2 py-2 bg-gray-700 hover:bg-gray-600 rounded text-white transition">
                            {translations["Close"]}
                        </button>
                        <button onClick={() => handleSave()} className={`px-2 py-2 bg-cyan-600 hover:bg-cyan-500 rounded text-white transition`}>
                            {formData.id === 0 ? translations["Save"] : translations['Update']}
                        </button>
                    </div>
                </div>
            </div>
        );
    };
    return (
        <div className="flex h-screen">
            {/* Side Menu */}
            <div className="w-64 border-r flex-shrink-0" style={{ backgroundColor: "#19191c", borderColor: "#404040" }}>
                <div className="p-4 border-b" style={{ borderColor: "#404040" }}>
                    <h2 className="text-lg font-semibold text-white">{translations["Settings"]}</h2>
                </div>
                <nav className="p-2">
                    {menuItems.map((menu) => {
                        const Icon = menu.icon;
                        const isExpanded = expandedMenus.includes(menu.id);

                        return (
                            <div key={menu.id} className="mb-2">
                                <button
                                    onClick={() => {
                                        if (menu.submenus.length > 0) {
                                            toggleMenu(menu.id);
                                        } else {
                                            setActiveMenu(menu.id);
                                        }
                                    }}
                                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors ${
                                        menu.submenus.length === 0 && activeMenu === menu.id ? "bg-cyan-600 bg-opacity-20 text-cyan-400" : "text-gray-300 hover:bg-gray-700 hover:bg-opacity-30"
                                    }`}
                                >
                                    <div className="flex items-center space-x-3">
                                        <Icon size={18} />
                                        <span className="text-sm">{menu.label}</span>
                                    </div>
                                    {menu.submenus.length > 0 && (isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />)}
                                </button>

                                {/* Submenus */}
                                {isExpanded && menu.submenus && menu.submenus.length > 0 && (
                                    <div className="ml-6 mt-1 space-y-1">
                                        {menu.submenus.map((submenu) => (
                                            <button
                                                key={submenu.id}
                                                onClick={() => setActiveMenu(submenu.id)}
                                                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                                                    activeMenu === submenu.id ? "bg-cyan-600 bg-opacity-20 text-cyan-400" : "text-gray-400 hover:bg-gray-700 hover:bg-opacity-30"
                                                }`}
                                            >
                                                {submenu.label}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </nav>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-hidden p-1">
                <div className="space-y-6">
                    {/* Main Content Card */}
                    <div className="rounded-lg border shadow-sm h-full flex flex-col" style={{ backgroundColor: "#19191c", borderColor: "#404040" }}>
                        {renderContent()}
                    </div>
                </div>
            </div>
            {renderPopup()}
        </div>
    );
};
export default LogLists;
