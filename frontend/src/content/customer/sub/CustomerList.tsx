import React, { useState, useEffect, useMemo, useRef } from "react";
import { customerService, ApiCustomer } from "@/services/customerService";
import { useLanguage } from "@/context/LanguageContext";
import CustomCheckbox from "@/components/CustomCheckbox";
import { showConfirm } from "@/utils/alert";
import { dashboardService } from "@/services/dashboardService";
import { showSuccessToast, showErrorToast } from "@/utils/toast";
import Pagination from "@/components/Pagination";
import ItemsPerPageSelector from "@/components/ItemsPerPageSelector";
import CopyToClipboard from "@/components/CopyToClipboard";
import { LoadingSpinnerTbody } from "@/utils/LoadingSpinnerTbody";
import { X, Users, CheckCircle, XCircle } from "lucide-react";
import PusherEcho from "@/utils/echo";
import { ExportReportSelector } from "@/utils/ExportReportSelector";
import { productStatusLocalized, getStatusColor, DropdownData, formatMoney } from "@/utils/globalFunction";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, LegendPayload, PieLabelRenderProps } from "recharts";
import { fetchWarehouses, fetchSalesPerson, fetchCourier, fetchTaxGroup, fetchShippingTerms, fetchCountries, fetchStates, fetchCustomerType, OptionType } from "@/utils/fetchDropdownData";
import { VectorMap } from "@react-jvectormap/core";
import { worldMill } from "@react-jvectormap/world";
import { colors } from "@/utils/colors";
import "tippy.js/dist/tippy.css";
const MemoizedPagination = React.memo(Pagination);
const MemoizedItemsPerPageSelector = React.memo(ItemsPerPageSelector);
interface CustomerListProps {
    tabId: string;
    onCustomerSelect: (customerId: number, saveType?: string) => void;
    onChangeView: (view: "list" | "details") => void;
    onInitiateCopy: (sourceCustomerId: number, settings: any) => void;
    selectedCustomers: number[];
    onSelectedCustomersChange: (selected: number[]) => void;
    expandedRows: number[];
    onExpandedRowsChange: (expanded: number[]) => void;
}
interface DashboardFields {
    month: string;
    name: string;
    value: number;
    color: string;
}
interface Country {
    country_code: string;
    country_en: string;
    country_cn: string;
    cnt: number;
}

const CustomerList: React.FC<CustomerListProps> = ({ tabId, onCustomerSelect, onInitiateCopy, selectedCustomers, onSelectedCustomersChange }) => {
    const { translations, lang } = useLanguage();
    const [customers, setCustomers] = useState<ApiCustomer[]>([]);
    const [totalPages, setTotalPages] = useState(1);
    const [copiedId, setCopiedId] = useState<number[]>([]);
    const safeLang = lang === "cn" ? "cn" : "en";
    const pageSizeOptions = useMemo(() => [15, 20, 50, -1], []);
    const [showCopyCustomer, setShowCopyCustomer] = useState(false);
    const [warehousesData, setWarehousesData] = useState<DropdownData[]>([]);
    const [customerTypeData, setCustomerTypeData] = useState<DropdownData[]>([]);
    const [salesPersonData, setSalesPersonData] = useState<DropdownData[]>([]);
    const [courierData, setCourierData] = useState<DropdownData[]>([]);
    const [taxGroupData, setTaxGroupData] = useState<DropdownData[]>([]);
    const [shippingTermsData, setShippingTermsData] = useState<DropdownData[]>([]);
    const [countriesData, setCountriesData] = useState<DropdownData[]>([]);
    const [statesData, setStatesData] = useState<DropdownData[]>([]);
    const [fields, setFields] = useState<Record<string, boolean>>({});
    const [selectAll, setSelectAll] = useState({
        customerInfo: false,
    });
    const [countryRanking, setCountryRanking] = useState<Country[]>([]);
    const [mapData, setMapData] = useState<Record<string, number>>({});
    const [countryInfo, setCountryInfo] = useState<Record<string, Country>>({});
    const [topCustomers, setTopCustomers] = useState<DashboardFields[]>([]);
    const [totalWholesale, setTotalWholesale] = useState(0);
    const [totalRetail, setTotalRetail] = useState("");
    const [totalActive, setTotalActive] = useState("");
    const [totalInActive, setTotalInActive] = useState(0);
    const throttleTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
    const [loading, setLoading] = useState(() => {
        const savedLoading = localStorage.getItem(`${tabId}-loading-customers`);
        return savedLoading !== null ? JSON.parse(savedLoading) : true;
    });
    const now = new Date();
    const currentYearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const langRef = useRef(lang);
    // Form state - Updated to handle single vs multi-select properly
    const [formData, setFormData] = useState({
        customer_code: "",
        old_customer_code: "",
        copy_customer_code: "",
        account_name_en: "",
        account_name_cn: "",
        company_en: "",
        company_cn: "",
        status: 0,
        is_subscribe: 0,
        billing_country: null as OptionType | null,
        billing_state_id: null as OptionType | null,
        sales_person_id: null as OptionType | null,
        payment_terms_id: null as OptionType | null,
        preferred_shipping_id: null as OptionType | null,
        shipping_terms_id: null as OptionType | null,
        source_id: null as OptionType | null,
        tax_group: null as OptionType | null,
        customer_type: null as OptionType | null,
        pod: null as OptionType | null,
        rwarehouse: null as OptionType | null,
        date_to: currentYearMonth,
    });

    const [currentPage, setCurrentPage] = useState(() => {
        const metaKey = `${tabId}-cached-meta-customer`;
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
        const metaKey = `${tabId}-cached-meta-customer`;
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
        const cached = localStorage.getItem(`${tabId}-cached-meta-customer`);
        if (!cached) return "";
        try {
            const meta = JSON.parse(cached);
            return meta.search || "";
        } catch {
            return "";
        }
    });

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

    const customerTypeOptions: OptionType[] = useMemo(
        () =>
            customerTypeData.map((list) => ({
                value: list.value.toString(),
                value2: list.value.toString(),
                label: lang === "en" ? list.en : list.cn,
                en: list.en,
                cn: list.cn,
            })),
        [customerTypeData, lang]
    );

    const salesPersonOption: OptionType[] = useMemo(
        () =>
            salesPersonData.map((list) => ({
                value: list.value.toString(),
                value2: list.value.toString(),
                label: lang === "en" ? list.en : list.cn,
                en: list.en,
                cn: list.cn,
            })),
        [salesPersonData, lang]
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
    // REALTIME
    useEffect(() => {
        const channel = PusherEcho.channel("customer-channel");
        channel.listen(".customer-event", () => {
            fetchCustomers(currentPage, itemsPerPage, searchTerm);
        });
        return () => {
            PusherEcho.leave("customer-channel");
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
                loadCustomerType();
                loadSalesPerson();
                loadCourier();
                loadTaxGroup();
                loadShippingTerms();
                loadCountries();
                loadState();
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
        const customerKey = `${tabId}-cached-customers`;
        const metaKey = `${tabId}-cached-meta-customer`;
        const mountKey = `${tabId}-mount-status-customers`;

        const isFirstMount = sessionStorage.getItem(mountKey) !== "mounted";

        if (isFirstMount) {
            sessionStorage.setItem(mountKey, "mounted");
            fetchCustomers(currentPage, itemsPerPage, searchTerm);
            return;
        }

        const cachedCustomersRaw = localStorage.getItem(customerKey);
        const cachedMetaRaw = localStorage.getItem(metaKey);

        if (!cachedCustomersRaw || !cachedMetaRaw) {
            fetchCustomers(currentPage, itemsPerPage, searchTerm);
            return;
        }

        try {
            const cachedMeta = JSON.parse(cachedMetaRaw);
            const cachedCustomers = JSON.parse(cachedCustomersRaw);

            const isCacheValid = cachedMeta.page === currentPage && cachedMeta.perPage === itemsPerPage && cachedMeta.search === searchTerm;

            if (isCacheValid) {
                setCustomers(cachedCustomers);
                setTotalPages(cachedMeta.totalPages);
                setLoading(false);
                localStorage.setItem(`${tabId}-loading-customers`, JSON.stringify(false));
                return;
            }
        } catch (err) {
            console.warn("Failed to parse cached meta:", err);
        }

        fetchCustomers(currentPage, itemsPerPage, searchTerm);
    }, [currentPage, itemsPerPage, searchTerm, tabId]);

    useEffect(() => {
        const fetchDashboard = async () => {
            const dateStr = formData.date_to;
            const [year, month] = dateStr.split("-");
            const data = await dashboardService.getDashboardCustomer(Number(month), Number(year));
            const topCustomer = data.topCustomer;
            const countryArr = data.countryRanking;
            const mappedTopCustomer: DashboardFields[] = topCustomer.map((item: any) => ({
                name: item.customer_code,
                value: item.base_total,
                color: item.color || "bg-gray-500", // fallback color
            }));
            const countryRankList: Country[] = countryArr.map((item: any) => ({
                country_code: item.country_code,
                country_en: item.country_en,
                country_cn: item.country_cn,
                cnt: item.cnt,
            }));
            setTopCustomers(mappedTopCustomer);
            setCountryRanking(countryRankList);
            setTotalWholesale(data.totalWholesale);
            setTotalRetail(data.totalRetail);
            setTotalInActive(data.totalInActive);
            setTotalActive(data.totalActive);
        };
        fetchDashboard();
    }, [lang, tabId, formData.date_to]);

    useEffect(() => {
        const newMapData: Record<string, number> = {};
        const newCountryInfo: Record<string, any> = {};

        countryRanking.forEach((item) => {
            newMapData[item.country_code] = item.cnt;
            newCountryInfo[item.country_code] = item;
        });

        setMapData(newMapData);
        setCountryInfo(newCountryInfo);
    }, [countryRanking, lang]);

    useEffect(() => {
        langRef.current = lang;
    }, [lang]);

    const fetchCustomers = async (page = currentPage, perPage = itemsPerPage, search = "") => {
        try {
            localStorage.setItem(`${tabId}-loading-customers`, JSON.stringify(true));

            const paginatedData = await customerService.getAllCustomer(page, perPage, search);

            setCustomers(paginatedData.data);
            setTotalPages(paginatedData.last_page);
            localStorage.setItem(`${tabId}-cached-customers`, JSON.stringify(paginatedData.data));
            localStorage.setItem(
                `${tabId}-cached-meta-customer`,
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
            localStorage.setItem(`${tabId}-loading-customers`, JSON.stringify(false));
        }
    };
    // Filter customers based on search term
    const filteredCustomers = customers.filter((customer) => {
        const searchLower = searchTerm.toLowerCase();
        return (
            customer.id?.toString().includes(searchLower) ||
            customer.customer_code?.toLowerCase().includes(searchLower) ||
            customer.account_name_en?.toLowerCase().includes(searchLower) ||
            customer.account_name_cn?.toLowerCase().includes(searchLower) ||
            customer.email_address?.toLowerCase().includes(searchLower) ||
            customer.tel_no?.toLowerCase().includes(searchLower)
        );
    });

    // Handle select all
    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            onSelectedCustomersChange(customers.map((p) => p.id).filter(Boolean) as number[]);
        } else {
            onSelectedCustomersChange([]);
        }
    };

    // Handle individual select
    const handleSelectCustomer = (customerId: number, checked: boolean) => {
        if (checked) {
            onSelectedCustomersChange([...selectedCustomers, customerId]);
        } else {
            onSelectedCustomersChange(selectedCustomers.filter((id) => id !== customerId));
        }
    };
    const handleDeleteSelected = async () => {
        if (selectedCustomers.length === 0) {
            showErrorToast(translations["Please click checkbox to select row"]);
            return;
        }

        const confirmed = await showConfirm(translations["System Message"], translations["Are you sure you want to delete selected items?"], translations["Delete"], translations["Cancel"]);

        if (!confirmed) return;
        try {
            await customerService.deleteCustomers(selectedCustomers, "soft");
            setCustomers((prev) => prev.filter((p) => !selectedCustomers.includes(p.id!)));
            onSelectedCustomersChange([]);
            fetchCustomers(currentPage, itemsPerPage, searchTerm);
            showSuccessToast(translations["Record has been Deleted"]);
        } catch (err) {
            showErrorToast(translations["alert_message_18"]);
            console.error("Deletion failed:", err);
        }
    };

    const handleRowClick = (e: React.MouseEvent, customerId: number) => {
        // Prevent navigation if clicking on checkboxes or toggle switches
        const target = e.target as HTMLElement;
        if (target.closest("input") || target.closest("label") || target.closest("[data-copy-button]")) {
            return;
        }
        onCustomerSelect(customerId, customerId == 0 ? "new" : "edit");
    };
    const handleFieldToggle = (field: string) => () => {
        setFields((prev) => ({ ...prev, [field]: !prev[field] }));
    };
    const handleSelectAllGroup = (group: string) => () => {
        const groupFields: Record<string, string[]> = {
            customerInfo: [
                "Preferred Shipping",
                "Shipping Terms",
                "Point of Delivery",
                "Country",
                "State",
                "Receiving Warehouse",
                "Sales Person",
                "Customer Type",
                "Customer Group",
                "Tax Group",
                "User Language",
            ],
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
        if (selectedCustomers.length === 0) {
            showErrorToast(translations["Please click checkbox to select row"]);
            return;
        }
        if (selectedCustomers.length > 1) {
            showErrorToast(translations["1 checkbox only"]);
            return;
        }
        setCopiedId(selectedCustomers);
        setShowCopyCustomer(true);
    };

    const loadWarehouse = async () => {
        try {
            const list = await fetchWarehouses(); // fetches & returns
            setWarehousesData(list ?? []); // ✅ manually set state here
        } catch (err) {
            console.error("Failed to fetch loadWarehouse:", err);
        }
    };
    const loadCustomerType = async () => {
        try {
            const list = await fetchCustomerType(); // fetches & returns
            setCustomerTypeData(list ?? []); // ✅ manually set state here
        } catch (err) {
            console.error("Failed to fetch loadWarehouse:", err);
        }
    };

    const loadSalesPerson = async () => {
        try {
            const list = await fetchSalesPerson(); // fetches & returns
            setSalesPersonData(list ?? []); // ✅ manually set state here
        } catch (err) {
            console.error("Failed to fetch loadSalesPerson:", err);
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

    const handleCopyCustomer = async () => {
        const newCustomerCode = formData["copy_customer_code"]?.toString().trim() ?? "";
        const sourceId = Number(copiedId?.[0] || 0);

        if (!newCustomerCode) {
            showErrorToast(translations["Customer Account Empty"]);
            return;
        }
        const countExist = await customerService.getCustomerExists(newCustomerCode);
        if (countExist > 0) {
            showErrorToast(translations["This customer is already exists"]);
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
        const specificItem = rawDataCached?.find((item: ApiCustomer) => item.id === sourceId);

        if (specificItem) {
            console.log("Found customer:", specificItem);
        } else {
            showErrorToast("Error occur while processing the data...");
        }

        let preferred_shipping_id = courierOption.find((item) => item.value === (specificItem?.preferred_shipping_id?.toString() ?? null));
        let shipping_terms_id = shippingTermsOption.find((item) => item.value === (specificItem?.shipping_terms_id?.toString() ?? null));
        let pod = warehouseOptions.find((item) => item.value === (specificItem?.pod?.toString() ?? null));
        let billing_country = countriesOption.find((item) => item.value === (specificItem?.billing_country?.toString() ?? null));
        let delivery_country = countriesOption.find((item) => item.value === (specificItem?.delivery_country?.toString() ?? null));
        let billing_state_id = statesOption.find((item) => item.value === (specificItem?.billing_state_id?.toString() ?? null));
        let delivery_state_id = statesOption.find((item) => item.value === (specificItem?.delivery_state_id?.toString() ?? null));
        let rwarehouse = warehouseOptions.find((item) => item.value === (specificItem?.rwarehouse?.toString() ?? null));
        let sales_person_id = salesPersonOption.find((item) => item.value === (specificItem?.sales_person_id?.toString() ?? null));
        let customer_type = customerTypeOptions.find((item) => item.value === (specificItem?.customer_type?.toString() ?? null));
        let tax_group = taxGroupOption.find((item) => item.value === (specificItem?.tax_group?.toString() ?? null));
        const rawArray = {
            preferred_shipping_id: preferred_shipping_id,
            shipping_terms_id: shipping_terms_id,
            pod: pod,
            billing_country: billing_country,
            delivery_country: delivery_country,
            billing_state_id: billing_state_id,
            delivery_state_id: delivery_state_id,
            rwarehouse: rwarehouse,
            sales_person_id: sales_person_id,
            customer_type: customer_type,
            tax_group: tax_group,
            language: specificItem?.language?.toString() ?? null,
        };
        const settings = {
            newCustomerCode,
            fields,
            selectAll,
            rawArray,
        };
        onInitiateCopy(sourceId, settings);
        setShowCopyCustomer(false);
    };

    // Image Gallery Modal
    const renderCopyPopup = () => {
        if (!showCopyCustomer) return null;
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
                                    setShowCopyCustomer(false);
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
                            <legend className="text-white text-center px-3 py-1 border-[1px] border-[#ffffff1a] rounded-md bg-[#19191c]">{translations["New Customer Code"]}</legend>
                            {/* Customer Code Input */}
                            <div className="col-span-6">
                                <input
                                    type="text"
                                    value={formData.copy_customer_code}
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        setFormData((prev) => ({ ...prev, copy_customer_code: value }));
                                    }}
                                    className="w-full p-2 rounded bg-[#1f1f23] text-white border border-[#ffffff1a] focus:outline-none focus:ring-2 focus:ring-cyan-600"
                                />
                            </div>
                        </fieldset>
                        <fieldset className="border-[1px] border-[#ffffff1a] rounded-lg p-4 space-y-4 w-full">
                            <div className="grid grid-cols-2 gap-6 w-full">
                                {/* Checkbox Group 1: Customer Information */}
                                <div className="col-span-1">
                                    <div className="text-gray mb-2 flex items-center space-x-1">
                                        <CustomCheckbox checked={selectAll.customerInfo} onChange={handleSelectAllGroup("customerInfo")} />
                                        <span>{translations["Customer Information"]}</span>
                                    </div>
                                    <div className="flex flex-col space-y-2 text-gray pl-6">
                                        {["Preferred Shipping", "Shipping Terms", "Point of Delivery", "Country", "State", "Receiving Warehouse"].map((field) => (
                                            <label key={field} className="flex items-center space-x-1">
                                                <CustomCheckbox checked={fields[field]} onChange={handleFieldToggle(field)} />
                                                &nbsp;
                                                <span>{translations[field]}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                                {/* Checkbox Group 3: Media & Pricing */}
                                <div className="col-span-1">
                                    <div className="flex flex-col space-y-2 text-gray pl-6">
                                        {["Sales Person", "Customer Type", "Customer Group", "Tax Group", "User Language"].map((field) => (
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
                        <button onClick={() => setShowCopyCustomer(false)} className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-white transition">
                            {translations["Close"]}
                        </button>
                        <button onClick={() => handleCopyCustomer()} className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 rounded text-white transition">
                            {translations["Save"]}
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    const countryNumbers: Record<string, number> = {};
    // const colors = generateColors(50);
    countryRanking.forEach((item, index) => {
        if (item.cnt > 0) countryNumbers[item.country_code] = index + 1;
    });

    const tailwindToHex: Record<string, string> = {
        "red-500": "#ef4444",
        "blue-500": "#3b82f6",
        "green-500": "#22c55e",
        "yellow-500": "#eab308",
        "purple-500": "#a855f7",
        "pink-500": "#ec4899",
        "gray-500": "#6b7280",
    };
    const pieData = topCustomers.map((cat) => {
        const colorKey = cat.color.replace("bg-", "").replace("/50", "");
        return {
            name: cat.name,
            value: cat.value,
            color: tailwindToHex[colorKey] || "#8884d8",
        };
    });
    const CustomTooltip = (props: any) => {
        const { active, payload } = props;
        const totalSumAmount = topCustomers.reduce((total, item) => total + item.value, 0);
        if (active && payload && payload.length) {
            const total = totalSumAmount;
            const percentage = ((payload[0].value / total) * 100).toFixed(1);
            return (
                <div className="bg-gray-900 border border-gray-700 rounded-lg shadow-xl p-3">
                    <p className="text-white font-semibold text-sm">{payload[0].name}</p>
                    <p className="text-gray-300 text-sm">{formatMoney(payload[0].value)}</p>
                    <p className="text-gray-400 text-xs">{percentage}%</p>
                </div>
            );
        }

        return null;
    };
    const renderCustomLabel = (props: PieLabelRenderProps) => {
        // cast numeric fields explicitly
        const cx = props.cx as number;
        const cy = props.cy as number;
        const midAngle = props.midAngle as number;
        const innerRadius = props.innerRadius as number;
        const outerRadius = props.outerRadius as number;
        const percent = props.percent as number | undefined;

        const RADIAN = Math.PI / 180;
        const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
        const x = cx + radius * Math.cos(-midAngle * RADIAN);
        const y = cy + radius * Math.sin(-midAngle * RADIAN);

        if (percent && percent < 0.05) return null;

        return (
            <text x={x} y={y} fill="white" textAnchor={x > cx ? "start" : "end"} dominantBaseline="central" className="text-xs font-semibold" style={{ textShadow: "1px 1px 2px rgba(0,0,0,0.8)" }}>
                {`${(percent! * 100).toFixed(0)}%`}
            </text>
        );
    };
    interface CustomLegendProps {
        payload?: LegendPayload[];
    }
    const CustomLegend: React.FC<CustomLegendProps> = ({ payload }) => {
        if (!payload) return null;
        return (
            <div className="flex flex-wrap justify-center gap-2 mt-2 px-2">
                {payload.map((entry, index) => (
                    <div key={`legend-${index}`} className="flex items-center gap-1.5 bg-gray-800/50 px-2.5 py-1.5 rounded hover:bg-gray-800 transition-colors">
                        <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: entry.color }} />
                        <span className="text-gray-300 text-xs font-medium whitespace-nowrap">{entry.value}</span>
                    </div>
                ))}
            </div>
        );
    };
    if (Object.keys(mapData).length === 0) return null;
    return (
        <div className="grid grid-cols-12 gap-1">
            <div className="col-span-3 h-[calc(100vh-70px)] overflow-y-auto pr-2">
                {/* Cards Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-2 mt-2">
                    {[
                        { title: translations["Active Customer"] || "Active Customer", value: totalActive, change: "12.5%", icon: CheckCircle, bg: "bg-blue-900/50", iconColor: "text-blue-400" },
                        { title: translations["Total Wholesale"] || "Total Wholesale", value: totalWholesale, change: "8.2%", icon: Users, bg: "bg-green-900/50", iconColor: "text-green-400" },
                        {
                            title: translations["In-Active Customer"] || "In-Active Customer",
                            value: totalInActive,
                            change: "15.3%",
                            icon: XCircle,
                            bg: "bg-purple-900/50",
                            iconColor: "text-purple-400",
                        },
                        { title: translations["Total Retail"] || "Total Retail", value: totalRetail, change: "6.1%", icon: Users, bg: "bg-orange-900/50", iconColor: "text-orange-400" },
                    ].map((card, idx) => (
                        <div key={idx} className="p-4 rounded-lg shadow-md border border-gray-700" style={{ backgroundColor: "#19191c", borderColor: "#404040" }}>
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-gray-400 text-sm">{card.title}</p>
                                    <p className="text-2xl font-bold text-white mt-1">{card.value}</p>
                                </div>
                                <div className={`${card.bg} p-3 rounded-lg`}>
                                    <card.icon className={card.iconColor} size={24} />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
                {/* Progress Bars Section */}
                <div className="w-full h-[300px] md:h-[400px] relative rounded-lg overflow-hidden border border-gray-700 shadow-inner mb-2" id="vector-map">
                    {/* The map */}
                    {lang && ( // force re-render on lang change
                        <VectorMap
                            key={lang} // ← this forces React to recreate the map when lang changes
                            map={worldMill}
                            style={{ width: "100%", height: "100%" }}
                            backgroundColor="#19191c"
                            series={{
                                regions: [
                                    {
                                        attribute: "fill",
                                        values: countryNumbers, // numbers, not colors
                                        scale: colors, // colors applied via scale
                                        normalizeFunction: "polynomial",
                                    },
                                ],
                            }}
                            onRegionTipShow={(_, el, code) => {
                                const info = countryInfo[code];
                                const $el = el as any;
                                if (info) {
                                    $el.html(`<strong>${lang === "en" ? info.country_en : info.country_cn}</strong><br>${translations["Customer"]}: ${info.cnt ?? 0}`);
                                }
                            }}
                        />
                    )}

                    {/* Small summary table at bottom-right */}
                    <div className="absolute bottom-2 right-2 w-48 max-h-[40%] bg-gray-900 bg-opacity-90 text-white text-xs rounded-lg shadow-lg p-2 overflow-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-gray-600">
                                    <th className="py-0.5 px-1">{translations["Country"]}</th>
                                    <th className="py-0.5 px-1 text-right">{translations["Count"]}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {countryRanking
                                    .filter((c) => c.cnt > 0)
                                    .sort((a, b) => b.cnt - a.cnt)
                                    .map((c) => (
                                        <tr key={c.country_code} className="border-b border-gray-700 hover:bg-gray-800">
                                            <td className="py-0.5 px-1">{lang === "en" ? c.country_en : c.country_cn}</td>
                                            <td className="py-0.5 px-1 text-right font-bold">{c.cnt}</td>
                                        </tr>
                                    ))}
                            </tbody>
                        </table>
                    </div>
                </div>
                <div className="p-4 rounded-lg shadow-md border border-gray-700 mb-2" style={{ backgroundColor: "#19191c", borderColor: "#404040", height: "400px" }}>
                    <h2 className="text-lg font-bold text-white mb-4">{translations["Top 5 Customers"] || "Top 5 Customers"}</h2>
                    <div style={{ height: "calc(100% - 130px)" }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <defs>
                                    {pieData.map((entry, index) => (
                                        <linearGradient key={`gradient-${index}`} id={`gradient-${index}`} x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor={entry.color} stopOpacity={1} />
                                            <stop offset="100%" stopColor={entry.color} stopOpacity={0.7} />
                                        </linearGradient>
                                    ))}
                                </defs>
                                <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} innerRadius={60} paddingAngle={2} label={renderCustomLabel}>
                                    {pieData.map((entry, index) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={`url(#gradient-${index})`}
                                            stroke="#1f2937"
                                            strokeWidth={2}
                                            className={`hover:opacity-80 transition-opacity cursor-pointer ${entry.name}`}
                                        />
                                    ))}
                                </Pie>
                                <Tooltip content={<CustomTooltip />} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <CustomLegend payload={pieData.map((d) => ({ value: d.name, color: d.color }))} />
                </div>
            </div>
            <div className="col-span-9">
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
                                </div>
                                <div className="flex items-center space-x-4">
                                    <div className="flex items-center space-x-1">
                                        <button
                                            onClick={(e) => handleRowClick(e, 0)}
                                            className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors flex items-center space-x-1 text-sm"
                                        >
                                            <span>{translations["Add New"]}</span>
                                        </button>
                                        <button
                                            disabled={selectedCustomers.length === 0}
                                            onClick={handleCopy}
                                            className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors flex items-center space-x-1 text-sm"
                                        >
                                            <span>{translations["Copy"]}</span>
                                        </button>
                                        <button
                                            disabled={selectedCustomers.length === 0}
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
                                            <th className="py-1 px-2 text-gray-400 text-sm flex items-center justify-center">
                                                <CustomCheckbox checked={selectedCustomers.length === customers.length && customers.length > 0} onChange={(checked) => handleSelectAll(checked)} />
                                            </th>
                                            <th className=" text-left py-2 px-2 text-gray-400 text-sm">{translations["Customer Code"]}</th>
                                            <th className=" text-left py-2 px-2 text-gray-400 text-sm">{translations["Customer Name"]}</th>
                                            <th className=" text-left py-2 px-2 text-gray-400 text-sm">{translations["Customer Type"]}</th>
                                            <th className=" text-left py-2 px-2 text-gray-400 text-sm">{translations["Email"]}</th>
                                            <th className=" text-left py-2 px-2 text-gray-400 text-sm">{translations["Sales Person"]}</th>
                                            <th className=" text-left py-2 px-2 text-gray-400 text-sm">{translations["Country"]}</th>
                                            <th className=" text-left py-2 px-2 text-gray-400 text-sm">{translations["Tel No"]}</th>
                                            <th className=" text-left py-2 px-2 text-gray-400 text-sm">{translations["subscribe"]}</th>
                                            <th className=" text-left py-2 px-2 text-gray-400 text-sm">{translations["Status"]}</th>
                                        </tr>
                                    </thead>
                                    {loading ? (
                                        <LoadingSpinnerTbody rowsCount={itemsPerPage} />
                                    ) : (
                                        <tbody>
                                            {filteredCustomers.map((customer, index) => (
                                                <tr
                                                    key={customer.id || index}
                                                    onClick={(e) => handleRowClick(e, customer.id)}
                                                    className={`clickable border-b hover:bg-gray-700 hover:bg-opacity-30 transition-colors cursor-pointer ${
                                                        selectedCustomers.includes(customer.id as number) ? "bg-gray-700 bg-opacity-30" : ""
                                                    }`}
                                                    style={{ borderColor: "#40404042" }}
                                                >
                                                    <td className="py-2 px-2 flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
                                                        <CustomCheckbox
                                                            checked={selectedCustomers.includes(customer.id as number)}
                                                            onChange={(checked) => handleSelectCustomer(customer.id as number, checked)}
                                                        />
                                                    </td>
                                                    <td className="py-2 px-2 text-gray-400 text-left text-custom-sm">
                                                        <div className="flex items-center space-x-3">
                                                            <div className="group flex items-center">
                                                                <p className="text-gray-400 text-custom-sm">{customer.customer_code}</p>
                                                                <CopyToClipboard text={customer.customer_code || ""} />
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="py-2 px-2 text-gray-400 text-left text-custom-sm">
                                                        <div className="flex items-center space-x-3">
                                                            <div className="group flex items-center">
                                                                <p className="text-gray-400 text-custom-sm">{customer.account_name_en}</p>
                                                                <CopyToClipboard text={customer.account_name_en || ""} />
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="py-2 px-2 text-gray-400 text-left text-custom-sm">
                                                        {customer.customer_type == "RC" ? translations["Retail Customer"] : translations["Wholesale Customer"]}
                                                    </td>
                                                    <td className="py-2 px-2 text-gray-400 text-left text-custom-sm">
                                                        <div className="flex items-center space-x-3">
                                                            <div className="group flex items-center">
                                                                <p className="text-gray-400 text-custom-sm">{customer.email_address || translations["N.A."]}</p>
                                                                <CopyToClipboard text={customer.email_address || ""} />
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="py-2 px-2 text-gray-400 text-left text-custom-sm">{customer.sales_person_name}</td>
                                                    <td className="py-2 px-2 text-gray-400 text-left text-custom-sm">{lang == "en" ? customer.country_en : customer.country_cn}</td>
                                                    <td className="py-2 px-2 text-gray-400 text-left text-custom-sm">
                                                        <div className="flex items-center space-x-3">
                                                            <div className="group flex items-center">
                                                                <p className="text-gray-400 text-custom-sm">{customer.tel_no}</p>
                                                                <CopyToClipboard text={customer.tel_no || ""} />
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="py-2 px-2 text-gray-400 text-left text-custom-sm">
                                                        <span className={`px-2 py-1 rounded-full text-xs text-custom-sm ${getStatusColor(Number(customer.status))}`}>
                                                            {productStatusLocalized(Number(customer.status), safeLang)}
                                                        </span>
                                                    </td>
                                                    <td className="py-2 px-2 text-gray-400 text-left text-custom-sm">
                                                        <span className={`px-2 py-1 rounded-full text-xs text-custom-sm ${getStatusColor(Number(customer.is_subscribe))}`}>
                                                            {productStatusLocalized(Number(customer.is_subscribe), safeLang)}
                                                        </span>
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
                                    baseName="CustomerInformation"
                                    ids={selectedCustomers.length > 0 ? selectedCustomers : customers.map((p) => p.id)}
                                    language={lang}
                                />
                            </div>
                            <div className="flex items-center space-x-1">{/* Optional right side content */}</div>
                        </div>

                        {renderCopyPopup()}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CustomerList;
