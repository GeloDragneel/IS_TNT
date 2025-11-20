import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { showConfirm } from "@/utils/alert";
import { showSuccessToast, showErrorToast } from "@/utils/toast";
import Select from "react-select";
import { getFlatpickrLocale, formatDateToCustom } from "@/utils/flatpickrLocale";
import CustomCheckbox from "@/components/CustomCheckbox";
import { ArrowLeft, X, Plus, Search } from "lucide-react";
import Flatpickr from "react-flatpickr";
import "flatpickr/dist/themes/dark.css";
import { supplierCreditNoteService, ApiCreditNote, DetailsRow } from "@/services/supplierCreditNoteService";
import { supplierService, ApiSupplier } from "@/services/supplierService";
import Pagination from "@/components/Pagination";
import ItemsPerPageSelector from "@/components/ItemsPerPageSelector";
import { ApiProduct } from "@/services/productService";
import { fetchInvoiceStatus, convertToSingleOption, OptionType } from "@/utils/fetchDropdownData";
import { selectStyles, baseCurrency, parseDate, DropdownData, fetchExchangeRate } from "@/utils/globalFunction";
import { highlightMatch } from "@/utils/highlightMatch";
import CopyToClipboard from "@/components/CopyToClipboard";
// localStorage.clear();
const MemoizedPagination = React.memo(Pagination);
const MemoizedItemsPerPageSelector = React.memo(ItemsPerPageSelector);
interface ReceiveVoucherDetailsProps {
    creditNoteId: number;
    saveType: string;
    onBack: () => void;
    onSave: () => void;
    tabId: string;
    onChangeSupplierCreditNoteId: (newId: number) => void;
    onChangeSaveType: (type: string) => void;
}
const defaultDetails: ApiCreditNote = {
    id: 0,
    cr_number: "",
    cr_date: "",
    supplier_id: 0,
    currency: "",
    ex_rate: 0,
    amount: 0,
    base_amount: 0,
    cr_status_id: 7,
    status_value_en: "",
    status_value_cn: "",
    supplier_code: "",
    account_name_en: "",
    account_name_cn: "",
    details: [],
};
const ReceiveVoucherDetails: React.FC<ReceiveVoucherDetailsProps> = ({ creditNoteId, tabId, saveType, onBack, onSave, onChangeSupplierCreditNoteId, onChangeSaveType }) => {
    const { translations, lang } = useLanguage();
    const [masterList, setTransDetails] = useState<ApiCreditNote | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState("information");
    const [suppliers, setSuppliers] = useState<ApiSupplier[]>([]);
    const [isDirty, setIsDirty] = useState(false);
    const [showUnsavedChanges, setShowUnsavedChanges] = useState(false);
    const [chartsOfAccount, setChartsOfAccounts] = useState<ApiProduct[]>([]);
    const [isInitialized, setIsInitialized] = useState(false);
    const initialFormData = React.useRef<any>(null);
    const locale = getFlatpickrLocale(translations);
    const [loadingSave, setLoadingSave] = useState(false);
    const [invoiceStatusData, setInvoiceStatus] = useState<DropdownData[]>([]);
    const [detailList, setDetailList] = useState<DetailsRow[]>([]);
    const [globalIndex, setGlobalIndex] = useState(0);
    const [showAccounts, setShowAccounts] = useState(false);
    const [totalPagesAccounts, setTotalPages_Accounts] = useState(1);
    const pageSizeOptions = useMemo(() => [10, 20, 50, -1], []);
    const [showSuppliers, setShowSuppliers] = useState(false);
    const [totalPagesSupplier, setTotalPages_Supplier] = useState(1);
    const [selectedDetails, selectedCreditNote] = useState<number[]>([]);

    const [searchTermAccounts, setSearchTermAccounts] = useState(() => {
        const cached = localStorage.getItem(`cached-cr-accounts`);
        if (!cached) return "";
        try {
            const meta = JSON.parse(cached);
            return meta.search || "";
        } catch {
            return "";
        }
    });
    const [currentPageAccounts, setCurrentPageAccounts] = useState(() => {
        const metaKey = `cached-cr-accounts`;
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
    const [itemsPerPageAccounts, setItemsPerPageAccounts] = useState(() => {
        const metaKey = `cached-cr-accounts`;
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
        const cached = localStorage.getItem(`${tabId}-cached-cr-customer`);
        if (!cached) return "";
        try {
            const meta = JSON.parse(cached);
            return meta.search || "";
        } catch {
            return "";
        }
    });
    const [currentPageSupplier, setCurrentPageSupplier] = useState(() => {
        const metaKey = `${tabId}-cached-cr-customer`;
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
        const metaKey = `${tabId}-cached-cr-customer`;
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
    const invoiceStatusOptions: OptionType[] = useMemo(
        () =>
            invoiceStatusData.map((list) => ({
                value: list.value.toString(),
                value2: list.value.toString(),
                label: lang === "en" ? list.en : list.cn,
                en: list.en,
                cn: list.cn,
            })),
        [invoiceStatusData, lang]
    );
    // Form state - Updated to handle single vs multi-select properly
    const [formData, setFormData] = useState({
        supplier_id: 0,
        supplier_code: "",
        account_code: "",
        suppliername_en: "",
        suppliername_cn: "",
        supplier_address_en: "",
        supplier_address_cn: "",
        operator: "",
        cr_number: "",
        currency: "",
        particulars_en: "",
        particulars_cn: "",
        ex_rate: 0,
        amount: 0,
        base_amount: 0,
        cr_date: null as Date | null,
        cr_status_id: null as OptionType | null,
    });
    const clearForms = (Options: OptionType[]) => {
        const selectedOption = convertToSingleOption(7, Options);
        const initialFormData = {
            supplier_id: 0,
            supplier_code: "",
            account_code: "",
            suppliername_en: "",
            suppliername_cn: "",
            supplier_address_en: "",
            supplier_address_cn: "",
            operator: "",
            cr_number: "",
            currency: "",
            particulars_en: "",
            particulars_cn: "",
            ex_rate: 0,
            amount: 0,
            base_amount: 0,
            cr_date: new Date(),
            cr_status_id: selectedOption,
        };
        setFormData(initialFormData);
    };

    useEffect(() => {
        const handleEsc = (event: any) => {
            if (event.key === "Escape") {
                if (showSuppliers) {
                    setShowSuppliers(false);
                }
                if (showAccounts) {
                    setShowAccounts(false);
                }
            }
        };
        window.addEventListener("keydown", handleEsc);
        // Cleanup on unmount
        return () => {
            window.removeEventListener("keydown", handleEsc);
        };
    }, [showSuppliers, showAccounts]);

    useEffect(() => {
        fetchChartsOfAccounts(currentPageAccounts, itemsPerPageAccounts, searchTermAccounts);
    }, [currentPageAccounts, itemsPerPageAccounts, searchTermAccounts]);

    useEffect(() => {
        const calculateTotalsAndFetch = async () => {
            let total = 0;
            let base_total = 0;

            const operator = formData.operator;

            detailList.forEach((element) => {
                if (element.is_deleted === 0) {
                    total += Number(element.amount) || 0;
                    base_total += Number(element.base_amount) || 0;
                }
            });

            if (baseCurrency() === formData.currency) {
                base_total = total;
            } else {
                if (operator === "Divide") {
                    base_total = total / formData.ex_rate;
                } else {
                    base_total = total * formData.ex_rate;
                }
            }
            setFormData((prev) => ({
                ...prev,
                amount: parseFloat(total.toFixed(2)),
                base_amount: parseFloat(base_total.toFixed(2)),
            }));
        };
        calculateTotalsAndFetch();
    }, [detailList]);

    useEffect(() => {
        const fetchAllMasterData = () => {
            fetchCreditNote();
        };
        const fetchDropdownData = () => {
            loadInvoiceStatus();
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
        } else if (saveType === "details") {
            setLoading(true);
            setDetailList([]);
            setIsDirty(false);
            setIsInitialized(false);
            setLoading(false);
        } else {
            fetchAllMasterData();
        }
    }, [creditNoteId, saveType]);

    useEffect(() => {
        if (!masterList) return;

        if (!isInitialized) {
            // A more robust check to see if the form is fully initialized
            const isFormReady = masterList.cr_status_id ? !!formData.cr_status_id : true;
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
        if (masterList && invoiceStatusOptions.length > 0) {
            const selectedOption = convertToSingleOption(masterList.cr_status_id, invoiceStatusOptions);
            setFormData((prev) => ({ ...prev, cr_status_id: selectedOption }));
        }
    }, [masterList, invoiceStatusOptions, lang]);

    // ON LOAD LIST
    useEffect(() => {
        const SupplierKey = `${tabId}-cached-suppliers`;
        const metaKey = `${tabId}-cached-meta-suppliers`;
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

    const fetchCreditNote = async () => {
        try {
            const idToUse = creditNoteId;
            if (!idToUse) {
                setLoading(false);
                return;
            }
            setLoading(true);
            setError(null);

            const purchaseOrderInfoKey = `${idToUse}-cached-scr-info`;
            const cachedSuppliersRaw = localStorage.getItem(purchaseOrderInfoKey);
            let foundSupplier;
            if (cachedSuppliersRaw) {
                foundSupplier = JSON.parse(cachedSuppliersRaw); // ✅ Parse cached JSON
            } else {
                foundSupplier = await supplierCreditNoteService.getCRInfo(idToUse); // ✅ Fetch from API
            }
            if (foundSupplier) {
                setTransDetails(foundSupplier);
                setDetailList(foundSupplier.details);
                setFormData((prev) => ({
                    ...prev,
                    cr_number: foundSupplier.cr_number || "",
                    cr_date: parseDate(foundSupplier.cr_date),
                    supplier_code: foundSupplier.supplier_code || "",
                    supplier_id: foundSupplier.supplier_id || 0,
                    suppliername_en: foundSupplier.suppliername_en || "",
                    suppliername_cn: foundSupplier.suppliername_cn || "",
                    particulars_en: foundSupplier.particulars_en || "",
                    particulars_cn: foundSupplier.particulars_cn || "",
                    supplier_address_en: foundSupplier.supplier_address_en || "",
                    supplier_address_cn: foundSupplier.supplier_address_cn || "",
                    currency: foundSupplier.currency || "",
                    ex_rate: foundSupplier.ex_rate || 0,
                    total: foundSupplier.total || 0,
                    amount: foundSupplier.amount || 0,
                    base_amount: foundSupplier.base_amount || 0,
                    operator: foundSupplier.operator || "",
                }));

                // ✅ Only cache if it's a fresh fetch
                if (!cachedSuppliersRaw) {
                    localStorage.setItem(purchaseOrderInfoKey, JSON.stringify(foundSupplier));
                }
            } else {
                setError("supplier not found");
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to fetch details");
            console.error("Error fetching details:", err);
        } finally {
            setLoading(false);
        }
    };
    const fetchChartsOfAccounts = async (page = currentPageAccounts, perPage = itemsPerPageAccounts, search = "") => {
        try {
            // Fetch the products and pass the sortId
            const paginatedData = await supplierCreditNoteService.getChartsOfAccount(page, perPage, search, "");
            setChartsOfAccounts(paginatedData.data);
            setTotalPages_Accounts(paginatedData.last_page);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to fetch chartsOfAccount");
            console.error("Error fetching chartsOfAccount:", err);
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
                `${tabId}-cached-meta-suppliers`,
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
        } finally {
            localStorage.setItem(`${tabId}-loading-suppliers`, JSON.stringify(false));
        }
    };
    const updateCachedRaw = async (cachedType: string, masterId: number) => {
        if (cachedType === "info") {
            const newData = await supplierCreditNoteService.getCRInfo(masterId);
            if (newData) {
                localStorage.setItem(`${masterId}-cached-scr-info`, JSON.stringify(newData));
            }
        }
    };
    const loadInvoiceStatus = async () => {
        try {
            const list = await fetchInvoiceStatus(); // fetches & returns
            setInvoiceStatus(list ?? []); // ✅ manually set state here
        } catch (err) {
            console.error("Failed to fetch loadInvoiceStatus:", err);
        }
    };
    const handleSave = async () => {
        setLoadingSave(true);
        const data = new FormData();
        const supplier_code = formData["supplier_code"]?.toString().trim() ?? "";
        if (detailList.length === 0) {
            showErrorToast(translations["Detail(s) Required"]);
            setLoadingSave(false); // Enable button again
            return;
        }
        if (!supplier_code || supplier_code === "") {
            showErrorToast(translations["Supplier Code is required"]);
            setLoadingSave(false); // Enable button again
            return;
        }
        let is_amount_zero = 0;
        detailList.forEach((list) => {
            if (list) {
                if (list.account_code.length > 3) {
                    data.append(
                        "details[]",
                        JSON.stringify({
                            id: list.id,
                            account_code: list.account_code,
                            amount: list.amount,
                            base_amount: list.base_amount,
                            particulars: list.particulars,
                            product_id: list.product_id,
                            is_deleted: list.is_deleted,
                        })
                    );
                    if (list.amount === 0) {
                        is_amount_zero++;
                    }
                }
            }
        });
        if (is_amount_zero > 0) {
            showErrorToast(translations["alert_message_141"]);
            setLoadingSave(false); // Enable button again
            return;
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
            const result = await supplierCreditNoteService.updateCreditNote(creditNoteId, data);
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
                onChangeSupplierCreditNoteId(newId);
                onChangeSaveType("edit");
            }
            // Reset state to allow re-initialization after refetch
            setIsDirty(false);
            setIsInitialized(false);
            await updateCachedRaw("info", newId);
            fetchCreditNote();
            selectedCreditNote([]);
            showSuccessToast(translations[result.message]);
            onSave(); // This will now trigger the cache clearing in the parent
        } catch (error) {
            console.log(error);
            showErrorToast(translations["Failed to save Transaction."] || "Failed to save Transaction.");
        } finally {
            setLoadingSave(false); // Enable button again after the operation is done
        }
    };
    const handleAddNew = async () => {
        onChangeSupplierCreditNoteId(0);
        onChangeSaveType("new");
        clearForms(invoiceStatusOptions);
        setIsDirty(false);
    };
    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            const allIds = detailList?.map((p: any) => p.indexInt);
            selectedCreditNote(allIds);
        } else {
            selectedCreditNote([]);
        }
    };
    const handleSelectCustomer = (id: number, checked: boolean) => {
        if (checked) {
            selectedCreditNote((prev) => [...prev, id]);
        } else {
            selectedCreditNote((prev) => prev.filter((pid) => pid !== id));
        }
    };
    const handleRVDateChange = useCallback((dates: Date[]) => {
        setFormData((prev) => ({ ...prev, cr_date: dates[0] ?? null }));
        setIsDirty(true); // ✅ only if user is editing
    }, []);
    const handleAddRow = () => {
        const newId = Math.floor(10000 + Math.random() * 90000);
        const newData: DetailsRow = {
            id: 0,
            account_code: "",
            account_name_en: "",
            account_name_cn: "",
            particulars: "",
            amount: 0,
            base_amount: 0,
            currency: "",
            product_id: 0,
            ex_rate: 0,
            product_code: "",
            product_title_en: "",
            product_title_cn: "",
            is_deleted: 0,
            indexInt: newId,
            age_type: "new",
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
    const handleDetailChange = async (indexInt: number, value: string, column: string) => {
        const operator = formData.operator;
        setDetailList((prev) =>
            prev.map((item) => {
                if (item.indexInt === indexInt) {
                    const updatedItem: any = { ...item };
                    if (column != "account_code") {
                        let base_amount = 0;
                        if (baseCurrency() === formData.currency) {
                            base_amount = Number(value);
                        } else {
                            if (operator === "Divide") {
                                base_amount = Number(value) / formData.ex_rate;
                            } else {
                                base_amount = Number(value) * formData.ex_rate;
                            }
                        }
                        updatedItem["base_amount"] = base_amount.toFixed(2);
                        updatedItem[column] = value;
                    } else {
                        updatedItem[column] = value;
                    }
                    return updatedItem;
                }
                return item;
            })
        );
    };
    const handleEnterKey = async (indexInt: number, value: string, column: string, ageType: string) => {
        console.log(ageType);
        switch (column) {
            case "account_code":
                try {
                    setGlobalIndex(indexInt);
                    const res = await supplierCreditNoteService.getChartsOfAccount(currentPageAccounts, itemsPerPageAccounts, "", value);
                    const list = res.data[0];
                    const len = res.total;
                    if (len === 0) {
                        setShowAccounts(true);
                        return;
                    }
                    if (len > 1) {
                        setShowAccounts(true);
                        return;
                    }
                    setDetailList((prev) =>
                        prev.map((item) => {
                            if (item.indexInt === indexInt) {
                                const updatedItem: any = { ...item };
                                updatedItem["account_code"] = list.account_code;
                                updatedItem["account_name_en"] = list.account_name_en;
                                updatedItem["account_name_cn"] = list.account_name_cn;
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
                const res = await supplierCreditNoteService.getSupplierInfoByCode(value);
                console.log(res);
                if (res.token === "SupplierNotExists") {
                    setShowSuppliers(true);
                    return;
                }
                if (res.token === "MultipleCustomer") {
                    setShowSuppliers(true);
                    return;
                }
                const exRate = await fetchExchangeRate(res.list.currency, baseCurrency());
                setFormData((prev) => ({
                    ...prev,
                    supplier_id: res.list.supplier_id,
                    supplier_code: res.list.supplier_code,
                    suppliername_en: res.list.suppliername_en,
                    suppliername_cn: res.list.suppliername_cn,
                    supplier_address_en: res.list.supplier_address_en,
                    supplier_address_cn: res.list.supplier_address_cn,
                    cr_date: new Date(),
                    currency: res.list.currency,
                    ex_rate: exRate,
                }));
                break;
        }
    };
    const handlPopupProducts = (indexInt: number, ageType: string) => {
        setGlobalIndex(indexInt);
        setShowAccounts(true);
        console.log(ageType);
    };
    const handleVoid = async () => {
        const data = new FormData();
        data.append("details[]", JSON.stringify({ cr_number: formData.cr_number }));
        const confirmed = await showConfirm(translations["Void Record(s)"], translations["alert_message_38"], translations["Yes"], translations["Cancel"]);
        if (!confirmed) return;
        try {
            const result = await supplierCreditNoteService.voidSupplierCreditNote(data);
            if (result.token === "Error") {
                showErrorToast(result.message);
                return;
            }
            setIsDirty(false);
            setIsInitialized(false);
            await updateCachedRaw("info", creditNoteId);
            fetchCreditNote();
            selectedCreditNote([]);
            showSuccessToast(translations[result.message]);
            onSave(); // This will now trigger the cache clearing in the parent
        } catch (error) {}
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
        const exRate = await fetchExchangeRate(String(specificItem?.currency), baseCurrency());
        setFormData((prev) => ({
            ...prev,
            supplier_id: Number(specificItem?.supplier_id),
            supplier_code: String(specificItem?.supplier_code),
            suppliername_en: String(specificItem?.suppliername_en),
            suppliername_cn: String(specificItem?.suppliername_cn),
            billing_address_en: String(specificItem?.supplier_address_en),
            billing_address_cn: String(specificItem?.supplier_address_cn),
            currency: String(specificItem?.currency),
            cr_date: new Date(),
            ex_rate: Number(exRate),
        }));
        setShowSuppliers(false);
    };
    const handleRowClick_Accounts = async (e: React.MouseEvent, tableId: number) => {
        // Prevent navigation if clicking on checkboxes or toggle switches
        const target = e.target as HTMLElement;
        if (target.closest("input") || target.closest("label") || target.closest("[data-copy-button]")) {
            return;
        }
        const specificItem = chartsOfAccount.filter((item) => item.id === tableId);
        setDetailList((prev) =>
            prev.map((item) => {
                if (item.indexInt === globalIndex) {
                    const updatedItem: any = { ...item };
                    updatedItem["account_code"] = specificItem[0].account_code;
                    updatedItem["account_name_en"] = specificItem[0].account_name_en;
                    updatedItem["account_name_cn"] = specificItem[0].account_name_cn;
                    return updatedItem;
                }
                return item;
            })
        );
        setShowAccounts(false);
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
    const renderDetails = () => (
        <div className="p-1 bg-[#19191c] rounded-xl">
            <div className="h-[calc(100vh-150px)] overflow-y-auto pr-2">
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
                                        <label className="w-[25%] text-gray-400 text-sm text-right">{translations["Customer Name"]}</label>
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
                                        <label className="w-[25%] text-gray-400 text-sm text-right">{translations["Currency"]}</label>
                                        <input
                                            value={formData.currency}
                                            readOnly
                                            onChange={(e) => {
                                                const value = e.target.value;
                                                setFormData((prev) => ({ ...prev, currency: value }));
                                                setIsDirty(true);
                                            }}
                                            className="flex-1 px-3 py-2 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm"
                                        />
                                    </div>
                                </div>
                                <div className="col-span-12 md:col-span-4">
                                    <div className="flex items-center space-x-4 mb-2">
                                        <label className="w-[25%] text-gray-400 text-sm text-right">{translations["Ex Rate"]}</label>
                                        <input
                                            type="text"
                                            hidden={lang === "cn"}
                                            readOnly
                                            value={formData.ex_rate.toFixed(4)}
                                            onChange={(e) => {
                                                const value = Number(e.target.value);
                                                setFormData((prev) => ({ ...prev, ex_rate: value }));
                                                setIsDirty(true);
                                            }}
                                            className="flex-1 px-3 py-2 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm"
                                        />
                                    </div>
                                    <div className="flex items-center space-x-4 mb-2">
                                        <label className="w-[25%] text-gray-400 text-sm text-right">{translations["Delivery Address"]}</label>
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
                                        <label className="w-[25%] text-gray-400 text-sm text-right">{translations["CR No"]}</label>
                                        <input
                                            value={formData.cr_number}
                                            readOnly
                                            onChange={(e) => {
                                                const value = e.target.value;
                                                setFormData((prev) => ({ ...prev, cr_number: value }));
                                                setIsDirty(true);
                                            }}
                                            className="flex-1 px-3 py-2 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm"
                                        />
                                    </div>
                                    <div className="flex items-center space-x-4 mb-2">
                                        <label className="w-[25%] text-gray-400 text-sm text-right">{translations["CR Date"]}</label>
                                        <Flatpickr
                                            onChange={handleRVDateChange}
                                            options={{
                                                dateFormat: "M d Y",
                                                defaultDate: formData.cr_date || undefined,
                                                allowInput: true,
                                                locale: locale,
                                            }}
                                            className="flex-1 px-3 py-2 border-[1px] border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm"
                                        />
                                    </div>
                                    <div className="flex items-center space-x-4 mb-2">
                                        <label className="w-[26%] text-gray-400 text-sm text-right">{translations["CR Status"]}</label>
                                        <Select
                                            classNamePrefix="react-select"
                                            value={formData.cr_status_id ?? null}
                                            onChange={async (selected) => {
                                                setFormData({ ...formData, cr_status_id: selected as OptionType | null });
                                                setIsDirty(true); // ✅ only if user is editing
                                            }}
                                            options={invoiceStatusOptions}
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
                                                <th className="w-[3%] text-center py-1 px-2 text-gray-400 text-sm w-12 border border-[#40404042]">
                                                    <div className="relative group inline-block">
                                                        <CustomCheckbox
                                                            checked={selectedDetails.length === detailList?.length && detailList?.length > 0}
                                                            onChange={(checked) => handleSelectAll(checked)}
                                                        />
                                                    </div>
                                                </th>
                                                <th className="w-[3%] text-center py-1 px-2 text-gray-400 text-sm w-12 border border-[#40404042]">
                                                    <div className="relative group inline-block">
                                                        <button
                                                            type="button"
                                                            onClick={handleAddRow}
                                                            className="px-1 py-1 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-xs"
                                                        >
                                                            <Plus className="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                </th>
                                                <th className="w-[3%] text-center py-1 px-2 text-gray-400 text-sm w-12 border border-[#40404042]"></th>
                                                <th className={`text-left py-1 px-2 text-gray-400 text-sm border border-[#40404042]`}>{translations["Account Code"]}</th>
                                                <th className={`text-left py-1 px-2 text-gray-400 text-sm border border-[#40404042]`}>{translations["Description"]}</th>
                                                <th className={`text-left py-1 px-2 text-gray-400 text-sm border border-[#40404042]`}>{translations["Particulars"]}</th>
                                                <th className={`text-center py-1 px-2 text-gray-400 text-sm border border-[#40404042]`}>{translations["Currency"]}</th>
                                                <th className={`text-center py-1 px-2 text-gray-400 text-sm border border-[#40404042]`}>{translations["Ex Rate"]}</th>
                                                <th className={`text-center py-1 px-2 text-gray-400 text-sm border border-[#40404042]`}>{translations["Amount"]}</th>
                                                <th className={`text-center py-1 px-2 text-gray-400 text-sm border border-[#40404042]`}>{translations["Default Currency"]}</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {detailList.length === 0 ? (
                                                <tr className="clickable border-b hover:bg-gray-700 hover:bg-opacity-30 transition-colors cursor-pointer" style={{ borderColor: "#40404042" }}>
                                                    <td colSpan={10} className="py-2 px-2 text-gray-400 text-center text-custom-sm border border-[#40404042]">
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
                                                                <td className="py-2 px-2 text-gray-400 text-center text-custom-sm border border-[#40404042]">
                                                                    <CustomCheckbox
                                                                        checked={selectedDetails.includes(item.indexInt as number)}
                                                                        onChange={(checked) => handleSelectCustomer(item.indexInt as number, checked)}
                                                                    />
                                                                </td>
                                                                <td className="py-2 px-2 text-gray-400 text-center text-custom-sm border border-[#40404042]">
                                                                    <div className="relative group inline-block">
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => handleRemoveRow()}
                                                                            className="px-1 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-xs"
                                                                        >
                                                                            <X className="h-4 w-4" />
                                                                        </button>
                                                                    </div>
                                                                </td>
                                                                <td className="py-2 px-2 text-gray-400 text-center text-custom-sm border border-[#40404042]">
                                                                    <div className="relative group inline-block">
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => handlPopupProducts(item.indexInt, item.age_type)}
                                                                            className="px-1 py-1 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors text-xs"
                                                                        >
                                                                            <Search className="h-4 w-4" />
                                                                        </button>
                                                                    </div>
                                                                </td>
                                                                <td className="py-0 px-0 text-gray-400 text-left text-custom-sm border border-[#40404042]">
                                                                    <input
                                                                        type="text"
                                                                        value={item.account_code}
                                                                        onChange={(e) => handleDetailChange(item.indexInt, e.target.value, "account_code")}
                                                                        onKeyDown={(e) => {
                                                                            if (e.key === "Enter") {
                                                                                handleEnterKey(item.indexInt, item.account_code, "account_code", item.age_type);
                                                                            }
                                                                        }}
                                                                        className="w-full px-3 py-1.5 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-sm rounded"
                                                                    />
                                                                </td>
                                                                <td className="py-0 px-0 text-gray-400 text-left text-custom-sm border border-[#40404042]">
                                                                    <input
                                                                        type="text"
                                                                        readOnly
                                                                        value={lang === "en" ? item.account_name_en : item.account_name_cn}
                                                                        className="w-full px-3 py-1.5 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-sm rounded"
                                                                    />
                                                                </td>
                                                                <td className="py-0 px-0 text-gray-400 text-left text-custom-sm border border-[#40404042]">
                                                                    <input
                                                                        type="text"
                                                                        value={item.product_code}
                                                                        readOnly
                                                                        className="w-full px-3 py-1.5 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-sm rounded text-left"
                                                                    />
                                                                </td>
                                                                <td className="py-0 px-0 text-gray-400 text-left text-custom-sm border border-[#40404042]">
                                                                    <input
                                                                        type="text"
                                                                        value={formData.currency}
                                                                        readOnly
                                                                        className="w-full px-3 py-1.5 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-sm rounded text-center"
                                                                    />
                                                                </td>
                                                                <td className="py-0 px-0 text-gray-400 text-center text-custom-sm border border-[#40404042]">
                                                                    <input
                                                                        type="number"
                                                                        value={formData.ex_rate.toFixed(4)}
                                                                        readOnly
                                                                        className="w-full px-3 py-1.5 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-sm rounded text-center"
                                                                    />
                                                                </td>
                                                                <td className="py-0 px-0 text-gray-400 text-center text-custom-sm border border-[#40404042]">
                                                                    <input
                                                                        type="number"
                                                                        value={item.amount}
                                                                        onChange={(e) => {
                                                                            const value = e.target.value;
                                                                            if (/^\d*\.?\d*$/.test(value)) {
                                                                                handleDetailChange(item.indexInt, value, "amount");
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
                                                                        value={item.base_amount}
                                                                        placeholder="0"
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
                                <div className="col-span-12 md:col-span-5">
                                    <div className="flex items-center space-x-4 mb-2">
                                        <label className="w-[10%] text-gray-400 text-sm text-right">{translations["Remarks"]}</label>
                                        <input
                                            type="text"
                                            hidden={lang === "cn"}
                                            value={formData.particulars_en}
                                            onChange={(e) => {
                                                const value = e.target.value;
                                                setFormData((prev) => ({ ...prev, particulars_en: value }));
                                                setIsDirty(true);
                                            }}
                                            className="flex-1 px-3 py-2 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm"
                                        />
                                        <input
                                            type="text"
                                            hidden={lang === "en"}
                                            value={formData.particulars_cn}
                                            onChange={(e) => {
                                                const value = e.target.value;
                                                setFormData((prev) => ({ ...prev, particulars_cn: value }));
                                                setIsDirty(true);
                                            }}
                                            className="flex-1 px-3 py-2 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm"
                                        />
                                    </div>
                                </div>
                                <div className="col-span-12 md:col-span-2"></div>
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
                                            value={formData.amount.toFixed(2)}
                                            onChange={(e) => {
                                                const value = Number(e.target.value);
                                                setFormData((prev) => ({ ...prev, amount: value }));
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
                                            value={formData.base_amount.toFixed(2)}
                                            onChange={(e) => {
                                                const value = Number(e.target.value);
                                                setFormData((prev) => ({ ...prev, base_amount: value }));
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
    const renderChartsOfAccounts = () => {
        if (!showAccounts) return null;
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-[#19191c] rounded-xl border border-[#ffffff1a] w-[30vw] h-auto flex flex-col">
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-[#ffffff1a]">
                        <div className="flex items-center space-x-4">
                            <h2 className="text-xl font-bold text-white">{translations["Charts of Account List"]}</h2>
                        </div>
                        <div className="flex items-center space-x-4">
                            <button
                                onClick={() => {
                                    setShowAccounts(false);
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
                                        value={searchTermAccounts}
                                        onChange={(e) => {
                                            setSearchTermAccounts(e.target.value);
                                            setCurrentPageAccounts(1);
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
                                        <th className="w-[30%] text-left py-2 px-2 text-gray-400 text-sm">{translations["Account Code"]}</th>
                                        <th className="w-[70%] text-left py-2 px-2 text-gray-400 text-sm">{translations["Description"]}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {chartsOfAccount.map((list, index) => (
                                        <tr
                                            key={list.id || index}
                                            onClick={(e) => handleRowClick_Accounts(e, list.id)}
                                            className={`clickable border-b hover:bg-gray-700 hover:bg-opacity-30 transition-colors`}
                                            style={{ borderColor: "#40404042" }}
                                        >
                                            <td className="py-2 px-2 text-gray-400 text-left text-custom-sm">
                                                <div className="group flex items-center">
                                                    <p className="text-gray-400 text-custom-sm">{highlightMatch(list.account_code, searchTermAccounts)}</p>
                                                    <CopyToClipboard text={list.account_code} />
                                                </div>
                                            </td>
                                            <td className="py-2 px-2 text-gray-400 text-left text-custom-sm">
                                                <div className="group flex items-center">
                                                    <p className="text-gray-400 text-custom-sm">{highlightMatch(lang === "en" ? list.account_name_en : list.account_name_cn, searchTermAccounts)}</p>
                                                    <CopyToClipboard text={lang === "en" ? list.account_name_en : list.account_name_cn} />
                                                </div>
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
                            <MemoizedPagination currentPage={currentPageAccounts} totalPages={totalPagesAccounts} onPageChange={(page) => setCurrentPageAccounts(page)} />
                            <MemoizedItemsPerPageSelector
                                value={itemsPerPageAccounts}
                                onChange={(val: number) => {
                                    setItemsPerPageAccounts(val);
                                    setCurrentPageAccounts(1);
                                }}
                                options={pageSizeOptions}
                            />
                        </div>
                        <div className="flex items-center space-x-1">
                            <button onClick={() => setShowAccounts(false)} className="px-2 py-2 bg-gray-700 hover:bg-gray-600 rounded text-white transition">
                                {translations["Close"]}
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
                            <h2 className="text-xl font-bold text-white">{translations["Search Suppliers"]}</h2>
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
                                    {suppliers.map((list, index) => (
                                        <tr
                                            key={list.id || index}
                                            onClick={(e) => handleRowClick_Supplier(e, list.id)}
                                            className={`clickable border-b hover:bg-gray-700 hover:bg-opacity-30 transition-colors cursor-pointer`}
                                            style={{ borderColor: "#40404042" }}
                                        >
                                            <td className="py-3 px-4 text-gray-400 text-left text-custom-sm">{list.supplier_code}</td>
                                            <td className="py-3 px-4 text-gray-400 text-left text-custom-sm">
                                                {lang === "en" ? list.suppliername_en || translations["N.A."] : list.suppliername_cn || translations["N.A."]}
                                            </td>
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
                    <div className="flex items-center space-x-1">
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
                            onClick={handleSave}
                            className={`px-2 py-2 text-custom-sm rounded-lg text-sm font-medium transition-colors 
                            ${loadingSave ? "bg-gray-500 cursor-not-allowed opacity-50" : "bg-cyan-600 hover:bg-cyan-700"} 
                            text-[#ffffffcc] flex justify-center items-center`}
                            disabled={loadingSave || masterList?.cr_status_id === 5}
                        >
                            <span>{creditNoteId === 0 ? translations["Save"] : translations['Update']}</span>
                        </button>
                        <button disabled={creditNoteId === 0} className="px-2 py-2 bg-cyan-600 hover:bg-cyan-700 text-[#ffffffcc] text-custom-sm rounded-lg text-sm font-medium transition-colors">
                            {translations["Print"]}
                        </button>
                        <button onClick={handleAddNew} className="px-2 py-2 bg-cyan-600 hover:bg-cyan-700 text-[#ffffffcc] text-custom-sm rounded-lg text-sm font-medium transition-colors">
                            {translations["Add New"]}
                        </button>

                        <button
                            onClick={handleVoid}
                            disabled={creditNoteId === 0 || masterList?.cr_status_id === 5}
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
                <div className="flex-1">{renderDetails()}</div>
            </div>
            {renderChartsOfAccounts()}
            {renderSupplierList()}
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

export default ReceiveVoucherDetails;
