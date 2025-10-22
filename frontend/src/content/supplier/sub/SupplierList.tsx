import React, { useState, useEffect, useMemo, useRef } from "react";
import { supplierService, ApiSupplier } from "@/services/supplierService";
import { useLanguage } from "@/context/LanguageContext";
import CustomCheckbox from "@/components/CustomCheckbox";
import { showConfirm } from "@/utils/alert";
import { showSuccessToast, showErrorToast } from "@/utils/toast";
import Pagination from "@/components/Pagination";
import ItemsPerPageSelector from "@/components/ItemsPerPageSelector";
import CopyToClipboard from "@/components/CopyToClipboard";
import { X } from "lucide-react";
import PusherEcho from "@/utils/echo";
import { ExportReportSelector } from "@/utils/ExportReportSelector";
import { fetchCourier, fetchShippingTerms, fetchPaymentTerms, fetchCountries, fetchStates, OptionType, fetchCurrencies } from "@/utils/fetchDropdownData";
import { DropdownData } from "@/utils/globalFunction";
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

const MemoizedPagination = React.memo(Pagination);
const MemoizedItemsPerPageSelector = React.memo(ItemsPerPageSelector);

interface SupplierListProps {
    tabId: string;
    onSupplierSelect: (supplierId: number, saveType?: string) => void;
    onChangeView: (view: "list" | "details") => void;
    onInitiateCopy: (sourceSupplierId: number, settings: any) => void;
    selectedSuppliers: number[];
    onSelectedSuppliersChange: (selected: number[]) => void;
    expandedRows: number[];
    onExpandedRowsChange: (expanded: number[]) => void;
}
// localStorage.clear();
const SupplierList: React.FC<SupplierListProps> = ({ tabId, onSupplierSelect, onInitiateCopy, selectedSuppliers, onSelectedSuppliersChange }) => {
    const { translations, lang } = useLanguage();
    const [suppliers, setSuppliers] = useState<ApiSupplier[]>([]);
    const [totalPages, setTotalPages] = useState(1);
    const [copiedId, setCopiedId] = useState<number[]>([]);
    const pageSizeOptions = useMemo(() => [15, 20, 50, -1], []);
    const [showCopySupplier, setShowCopySupplier] = useState(false);
    const [currencyData, setCurrencyData] = useState<DropdownData[]>([]);
    const [courierData, setCourierData] = useState<DropdownData[]>([]);
    const [shippingTermsData, setShippingTermsData] = useState<DropdownData[]>([]);
    const [paymentTermsData, setPaymentTermsData] = useState<DropdownData[]>([]);
    const [countriesData, setCountriesData] = useState<DropdownData[]>([]);
    const [statesData, setStatesData] = useState<DropdownData[]>([]);

    const [fields, setFields] = useState<Record<string, boolean>>({});
    const [selectAll, setSelectAll] = useState({
        supplierInfo: false,
    });

    const throttleTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

    const [loading, setLoading] = useState(() => {
        const savedLoading = localStorage.getItem(`${tabId}-loading-suppliers`);
        return savedLoading !== null ? JSON.parse(savedLoading) : true;
    });

    // Form state - Updated to handle single vs multi-select properly
    const [formData, setFormData] = useState({
        supplier_code: "",
        old_supplier_code: "",
        copy_supplier_code: "",
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
        pod: null as OptionType | null,
        rwarehouse: null as OptionType | null,
    });

    const [currentPage, setCurrentPage] = useState(() => {
        const metaKey = `${tabId}-cached-meta-supplier`;
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
        const metaKey = `${tabId}-cached-meta-supplier`;
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
        const cached = localStorage.getItem(`${tabId}-cached-meta-supplier`);
        if (!cached) return "";
        try {
            const meta = JSON.parse(cached);
            return meta.search || "";
        } catch {
            return "";
        }
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
    const currencyOption: OptionType[] = useMemo(
        () =>
            currencyData.map((list) => ({
                value: list.value.toString(),
                value2: list.value.toString(),
                label: lang === "en" ? list.en : list.cn,
                en: list.en,
                cn: list.cn,
            })),
        [currencyData, lang]
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

    // REALTIME
    useEffect(() => {
        const channel = PusherEcho.channel("supplier-channel");
        channel.listen(".supplier-event", () => {
            fetchSuppliers(currentPage, itemsPerPage, searchTerm);
        });
        return () => {
            PusherEcho.leave("supplier-channel");
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
                loadCurrency();
                loadCourier();
                loadShippingTerms();
                loadPaymentTerms();
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
        const SupplierKey = `${tabId}-cached-suppliers`;
        const metaKey = `${tabId}-cached-meta-supplier`;
        const mountKey = `${tabId}-mount-status-suppliers`;

        const isFirstMount = sessionStorage.getItem(mountKey) !== "mounted";

        if (isFirstMount) {
            sessionStorage.setItem(mountKey, "mounted");
            fetchSuppliers(currentPage, itemsPerPage, searchTerm);
            return;
        }

        const cachedSuppliersRaw = localStorage.getItem(SupplierKey);
        const cachedMetaRaw = localStorage.getItem(metaKey);

        if (!cachedSuppliersRaw || !cachedMetaRaw) {
            fetchSuppliers(currentPage, itemsPerPage, searchTerm);
            return;
        }

        try {
            const cachedMeta = JSON.parse(cachedMetaRaw);
            const cachedSuppliers = JSON.parse(cachedSuppliersRaw);

            const isCacheValid = cachedMeta.page === currentPage && cachedMeta.perPage === itemsPerPage && cachedMeta.search === searchTerm;

            if (isCacheValid) {
                setSuppliers(cachedSuppliers);
                setTotalPages(cachedMeta.totalPages);
                setLoading(false);
                localStorage.setItem(`${tabId}-loading-suppliers`, JSON.stringify(false));
                return;
            }
        } catch (err) {
            console.warn("Failed to parse cached meta:", err);
        }

        fetchSuppliers(currentPage, itemsPerPage, searchTerm);
    }, [currentPage, itemsPerPage, searchTerm, tabId]);

    const fetchSuppliers = async (page = currentPage, perPage = itemsPerPage, search = "") => {
        try {
            // setLoading(true);
            localStorage.setItem(`${tabId}-loading-suppliers`, JSON.stringify(true));

            const paginatedData = await supplierService.getAllSupplier(page, perPage, search);

            setSuppliers(paginatedData.data);
            setTotalPages(paginatedData.last_page);
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
            console.error("Error fetching suppliers:", err);
        } finally {
            setLoading(false);
            localStorage.setItem(`${tabId}-loading-suppliers`, JSON.stringify(false));
        }
    };

    // Filter suppliers based on search term
    const filteredSuppliers = suppliers.filter((supplier) => {
        const searchLower = searchTerm.toLowerCase();
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

    // Handle select all
    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            onSelectedSuppliersChange(suppliers.map((p) => p.id).filter(Boolean) as number[]);
        } else {
            onSelectedSuppliersChange([]);
        }
    };

    // Handle individual select
    const handleSelectSupplier = (supplierId: number, checked: boolean) => {
        if (checked) {
            onSelectedSuppliersChange([...selectedSuppliers, supplierId]);
        } else {
            onSelectedSuppliersChange(selectedSuppliers.filter((id) => id !== supplierId));
        }
    };
    const handleDeleteSelected = async () => {
        if (selectedSuppliers.length === 0) {
            showErrorToast(translations["Please click checkbox to select row"]);
            return;
        }

        const confirmed = await showConfirm(translations["System Message"], translations["Are you sure you want to delete selected items?"], translations["Delete"], translations["Cancel"]);

        if (!confirmed) return;
        try {
            await supplierService.deleteSuppliers(selectedSuppliers, "soft");
            setSuppliers((prev) => prev.filter((p) => !selectedSuppliers.includes(p.id!)));
            onSelectedSuppliersChange([]);
            fetchSuppliers(currentPage, itemsPerPage, searchTerm);
            showSuccessToast(translations["Record has been Deleted"]);
        } catch (err) {
            showErrorToast(translations["alert_message_18"]);
            console.error("Deletion failed:", err);
        }
    };

    const handleRowClick = (e: React.MouseEvent, supplierId: number) => {
        // Prevent navigation if clicking on checkboxes or toggle switches
        const target = e.target as HTMLElement;
        if (target.closest("input") || target.closest("label") || target.closest("[data-copy-button]")) {
            return;
        }
        onSupplierSelect(supplierId, supplierId == 0 ? "new" : "edit");
    };
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
    const handleCopy = () => {
        if (selectedSuppliers.length === 0) {
            showErrorToast(translations["Please click checkbox to select row"]);
            return;
        }
        if (selectedSuppliers.length > 1) {
            showErrorToast(translations["1 checkbox only"]);
            return;
        }
        setCopiedId(selectedSuppliers);
        setShowCopySupplier(true);
    };
    const loadCurrency = async () => {
        try {
            const list = await fetchCurrencies(); // fetches & returns
            setCurrencyData(list ?? []); // ✅ manually set state here
        } catch (err) {
            console.error("Failed to fetch loadCourier:", err);
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

    const handleCopySupplier = async () => {
        const newSupplierCode = formData["copy_supplier_code"]?.toString().trim() ?? "";
        const sourceId = Number(copiedId?.[0] || 0);

        if (!newSupplierCode) {
            showErrorToast(translations["Supplier Account Empty"]);
            return;
        }
        const countExist = await supplierService.getSupplierExists(newSupplierCode);
        if (countExist > 0) {
            showErrorToast(translations["This Supplier is already exists"]);
            return;
        }

        const SupplierListKey = `${tabId}-cached-suppliers`;
        const cachedSuppliersRaw = localStorage.getItem(SupplierListKey);
        let rawDataCached: ApiSupplier[] | null = null;

        if (cachedSuppliersRaw) {
            try {
                rawDataCached = JSON.parse(cachedSuppliersRaw);
            } catch (error) {
                console.error("Error parsing cached Supplier data", error);
            }
        }

        // Using optional chaining (?.) to avoid null errors
        const specificItem = rawDataCached?.find((item: ApiSupplier) => item.id === sourceId);

        if (specificItem) {
            console.log("Found Supplier:", specificItem);
        } else {
            showErrorToast("Error occur while processing the data...");
        }
        let currency = currencyOption.find((item) => item.value === (specificItem?.currency?.toString() ?? null));
        let payment_terms_id = paymentTermsOption.find((item) => item.value === (specificItem?.payment_terms_id?.toString() ?? null));
        let delivery_method_id = courierOption.find((item) => item.value === (specificItem?.delivery_method_id?.toString() ?? null));
        let shipping_terms_id = shippingTermsOption.find((item) => item.value === (specificItem?.shipping_terms_id?.toString() ?? null));
        let bank_name_en = specificItem?.bank_name_en?.toString() ?? null;
        let bank_name_cn = specificItem?.bank_name_cn?.toString() ?? null;
        let bank_account_name_en = specificItem?.bank_account_name_en?.toString() ?? null;
        let bank_account_name_cn = specificItem?.bank_account_name_cn?.toString() ?? null;
        let bank_account_no = specificItem?.bank_account_no?.toString() ?? null;
        let bank_address_en = specificItem?.bank_address_en?.toString() ?? null;
        let bank_address_cn = specificItem?.bank_address_cn?.toString() ?? null;

        let bank_country = countriesOption.find((item) => item.value === (specificItem?.bank_country?.toString() ?? null));
        let bank_country_state = statesOption.find((item) => item.value === (specificItem?.bank_country_state?.toString() ?? null));
        let bank_tel_no = specificItem?.bank_tel_no?.toString() ?? null;
        let bank_swift_code = specificItem?.bank_swift_code?.toString() ?? null;
        let bank_postal_code_2 = specificItem?.bank_postal_code_2?.toString() ?? null;
        const rawArray = {
            currency: currency,
            payment_terms_id: payment_terms_id,
            shipping_terms_id: shipping_terms_id,
            delivery_method_id: delivery_method_id,
            bank_name_en: bank_name_en,
            bank_name_cn: bank_name_cn,
            bank_account_name_en: bank_account_name_en,
            bank_account_name_cn: bank_account_name_cn,
            bank_account_no: bank_account_no,
            bank_address_en: bank_address_en,
            bank_address_cn: bank_address_cn,
            bank_country: bank_country === undefined ? null : bank_country,
            bank_country_state: bank_country_state === undefined ? null : bank_country_state,
            bank_tel_no: bank_tel_no,
            bank_swift_code: bank_swift_code,
            bank_postal_code_2: bank_postal_code_2,
        };
        const settings = {
            newSupplierCode,
            fields,
            selectAll,
            rawArray,
        };
        onInitiateCopy(sourceId, settings);
        setShowCopySupplier(false);
    };
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
                                    disabled={selectedSuppliers.length === 0}
                                    onClick={handleCopy}
                                    className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors flex items-center space-x-1 text-sm"
                                >
                                    <span>{translations["Copy"]}</span>
                                </button>
                                <button
                                    disabled={selectedSuppliers.length === 0}
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
                                    <th className="text-center py-1 px-2 text-gray-400 text-sm">
                                        <CustomCheckbox checked={selectedSuppliers.length === suppliers.length && suppliers.length > 0} onChange={(checked) => handleSelectAll(checked)} />
                                    </th>

                                    <th className=" text-left py-2 px-2 text-gray-400 text-sm">{translations["Supplier Code"]}</th>
                                    <th className=" text-left py-2 px-2 text-gray-400 text-sm">{translations["Supplier Name"]}</th>
                                    <th className=" text-left py-2 px-2 text-gray-400 text-sm">{translations["Contact Person"]}</th>
                                    <th className=" text-left py-2 px-2 text-gray-400 text-sm">{translations["Contact Number"]}</th>
                                    <th className=" text-left py-2 px-2 text-gray-400 text-sm">{translations["Email"]}</th>
                                </tr>
                            </thead>
                            {loading ? (
                                <LoadingSpinnerTbody rowsCount={itemsPerPage} />
                            ) : (
                                <tbody>
                                    {filteredSuppliers.map((supplier, index) => (
                                        <tr
                                            key={supplier.id || index}
                                            onClick={(e) => handleRowClick(e, supplier.id)}
                                            className={`clickable border-b hover:bg-gray-700 hover:bg-opacity-30 transition-colors cursor-pointer ${
                                                selectedSuppliers.includes(supplier.id as number) ? "bg-gray-700 bg-opacity-30" : ""
                                            }`}
                                            style={{ borderColor: "#40404042" }}
                                        >
                                            <td className="py-2 px-2 flex justify-center items-center" onClick={(e) => e.stopPropagation()}>
                                                <CustomCheckbox
                                                    checked={selectedSuppliers.includes(supplier.id as number)}
                                                    onChange={(checked) => handleSelectSupplier(supplier.id as number, checked)}
                                                />
                                            </td>
                                            <td className="py-2 px-2 text-gray-400 text-left text-custom-sm">
                                                <div className="flex items-center space-x-3">
                                                    <div className="group flex items-center">
                                                        <p className="text-gray-400 text-custom-sm">{supplier.supplier_code}</p>
                                                        <CopyToClipboard text={supplier.supplier_code || ""} />
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-2 px-2 text-gray-400 text-left text-custom-sm">
                                                <div className="flex items-center space-x-3">
                                                    <div className="group flex items-center">
                                                        <p className="text-gray-400 text-custom-sm">{lang == "en" ? supplier.suppliername_en : supplier.suppliername_cn}</p>
                                                        <CopyToClipboard text={lang == "en" ? supplier.suppliername_en || "" : supplier.suppliername_cn || ""} />
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-2 px-2 text-gray-400 text-left text-custom-sm">
                                                <div className="flex items-center space-x-3">
                                                    <div className="group flex items-center">
                                                        <p className="text-gray-400 text-custom-sm">{supplier.contact_person_en || translations["N.A."]}</p>
                                                        <CopyToClipboard text={supplier.contact_person_en || translations["N.A."]} />
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-2 px-2 text-gray-400 text-left text-custom-sm">
                                                <div className="flex items-center space-x-3">
                                                    <div className="group flex items-center">
                                                        <p className="text-gray-400 text-custom-sm">{supplier.contact_number || translations["N.A."]}</p>
                                                        <CopyToClipboard text={supplier.contact_number || translations["N.A."]} />
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-2 px-2 text-gray-400 text-left text-custom-sm">
                                                <div className="flex items-center space-x-3">
                                                    <div className="group flex items-center">
                                                        <p className="text-gray-400 text-custom-sm">{supplier.email || translations["N.A."]}</p>
                                                        <CopyToClipboard text={supplier.email || ""} />
                                                    </div>
                                                </div>
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
                            baseName="SupplierList"
                            ids={selectedSuppliers.length > 0 ? selectedSuppliers : filteredSuppliers.map((p) => p.id)}
                            language={lang}
                        />
                    </div>
                    <div className="flex items-center space-x-1">{/* Optional right side content */}</div>
                </div>

                {renderCopyPopup()}
            </div>
        </div>
    );
};

export default SupplierList;
