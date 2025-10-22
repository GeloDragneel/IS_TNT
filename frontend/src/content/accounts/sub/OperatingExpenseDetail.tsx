import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { showConfirm } from "@/utils/alert";
import { showSuccessToast, showErrorToast } from "@/utils/toast";
import Select from "react-select";
import { getFlatpickrLocale, formatDateToCustom } from "@/utils/flatpickrLocale";
import CustomCheckbox from "@/components/CustomCheckbox";
import { ArrowLeft, X, Plus, Search } from "lucide-react";
import Flatpickr from "react-flatpickr";
import "flatpickr/dist/themes/dark.css";
import { paymentVoucherService, ApiPaymentVoucher, DetailsRow } from "@/services/paymentVoucherService";
import Pagination from "@/components/Pagination";
import ItemsPerPageSelector from "@/components/ItemsPerPageSelector";
import { ApiProduct } from "@/services/productService";
import { ExportReportSelector } from "@/utils/ExportReportSelector";
import { fetchInvoiceStatus, fetchBank, fetchTaxGroup, fetchPaymentType, fetchCurrencies, convertToSingleOption, OptionType } from "@/utils/fetchDropdownData";
import { selectStyles, baseCurrency, parseDate, DropdownData, fetchExchangeRate } from "@/utils/globalFunction";
import { highlightMatch } from "@/utils/highlightMatch";
import CopyToClipboard from "@/components/CopyToClipboard";
// localStorage.clear();
const MemoizedPagination = React.memo(Pagination);
const MemoizedItemsPerPageSelector = React.memo(ItemsPerPageSelector);
interface OperatingExpenseDetailsProps {
    paymentVoucherId: number;
    saveType: string;
    onBack: () => void;
    onSave: () => void;
    onChangeOperatingExpenseId: (newId: number) => void;
    onChangeSaveType: (type: string) => void;
}
const defaultDetails: ApiPaymentVoucher = {
    id: 0,
    pv_number: "",
    pv_date: "",
    pay_to_en: "",
    pay_to_cn: "",
    particular_en: "",
    particular_cn: "",
    currency: "",
    ex_rate: 0,
    supplier_id: 0,
    bank: "",
    total_amount: 0,
    base_total_amount: 0,
    credit_used: 0,
    pv_status_id: 7,
    payment_type_id: 2,
    status_value_en: "",
    status_value_cn: "",
    payment_type_en: "",
    payment_type_cn: "",
    supplier_code: "",
    customer_code: "",
    suppliername_en: "",
    suppliername_cn: "",
    account_name_en: "",
    account_name_cn: "",
    details: [],
};
const OperatingExpenseDetails: React.FC<OperatingExpenseDetailsProps> = ({ paymentVoucherId, saveType, onBack, onSave, onChangeOperatingExpenseId, onChangeSaveType }) => {
    const { translations, lang } = useLanguage();
    const [masterList, setTransDetails] = useState<ApiPaymentVoucher | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState("information");
    const [isDirty, setIsDirty] = useState(false);
    const [showUnsavedChanges, setShowUnsavedChanges] = useState(false);
    const [chartsOfAccount, setChartsOfAccounts] = useState<ApiProduct[]>([]);
    const [isInitialized, setIsInitialized] = useState(false);
    const initialFormData = React.useRef<any>(null);
    const locale = getFlatpickrLocale(translations);
    const [loadingSave, setLoadingSave] = useState(false);
    const [invoiceStatusData, setInvoiceStatus] = useState<DropdownData[]>([]);
    const [banksData, setBanksData] = useState<DropdownData[]>([]);
    const [paymentTypeData, setPaymentType] = useState<DropdownData[]>([]);
    const [currencyData, setCurrencies] = useState<DropdownData[]>([]);
    const [taxGroupData, setTaxGroup] = useState<DropdownData[]>([]);
    const [detailList, setDetailList] = useState<DetailsRow[]>([]);
    const [globalIndex, setGlobalIndex] = useState(0);
    const [showAccounts, setShowAccounts] = useState(false);
    const [totalPagesAccounts, setTotalPages_Accounts] = useState(1);
    const pageSizeOptions = useMemo(() => [10, 20, 50, -1], []);
    const [showCustomers, setShowCustomers] = useState(false);
    const [selectedDetails, selectedOperatingExpense] = useState<number[]>([]);
    const exportRef = useRef<{ triggerExport: () => void }>(null);
    const [searchTermAccounts, setSearchTermAccounts] = useState(() => {
        const cached = localStorage.getItem(`cached-rv-accounts`);
        if (!cached) return "";
        try {
            const meta = JSON.parse(cached);
            return meta.search || "";
        } catch {
            return "";
        }
    });
    const [currentPageAccounts, setCurrentPageAccounts] = useState(() => {
        const metaKey = `cached-rv-accounts`;
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
        const metaKey = `cached-rv-accounts`;
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
        pv_number: "",
        pv_date: null as Date | null,
        customer_id: 0,
        supplier_id: 0,
        pay_to_en: "",
        pay_to_cn: "",
        particular_en: "",
        particular_cn: "",
        customer_code: "",
        supplier_code: "",
        address_en: "",
        address_cn: "",
        operator: "",
        ex_rate: 0,
        currency: null as OptionType | null,
        total_amount: 0,
        base_total_amount: 0,
        sub_total: 0,
        base_sub_total: 0,
        tax_amount: 0,
        base_tax_amount: 0,
        bank_charges: 0,
        base_bank_charges: 0,
        credit_used: 0,
        deposits: 0,
        total_deduction: 0,
        base_total_deduction: 0,
        amount_paid: 0,
        base_amount_paid: 0,
        pv_status_id: null as OptionType | null,
        bank: null as OptionType | null,
        tax_group: null as OptionType | null,
        payment_type_id: null as OptionType | null,
    });
    const clearForms = (Options: OptionType[]) => {
        const selectedOption = convertToSingleOption(7, Options);
        const selectedPaymentType = convertToSingleOption(2, paymentTypeOptions);
        const initialFormData = {
            pv_number: "",
            pv_date: new Date(),
            customer_id: 0,
            supplier_id: 0,
            pay_to_en: "",
            pay_to_cn: "",
            particular_en: "",
            particular_cn: "",
            customer_code: "",
            supplier_code: "",
            address_en: "",
            address_cn: "",
            operator: "",
            ex_rate: 0,
            currency: null,
            total_amount: 0,
            base_total_amount: 0,
            sub_total: 0,
            base_sub_total: 0,
            tax_amount: 0,
            base_tax_amount: 0,
            bank_charges: 0,
            base_bank_charges: 0,
            credit_used: 0,
            deposits: 0,
            pv_status_id: selectedOption,
            bank: null,
            tax_group: null,
            payment_type_id: selectedPaymentType,
            total_deduction: 0,
            base_total_deduction: 0,
            amount_paid: 0,
            base_amount_paid: 0,
        };
        setFormData(initialFormData);
    };
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
    const paymentTypeOptions: OptionType[] = useMemo(
        () =>
            paymentTypeData.map((list) => ({
                value: list.value.toString(),
                value2: list.value.toString(),
                label: lang === "en" ? list.en : list.cn,
                en: list.en,
                cn: list.cn,
            })),
        [paymentTypeData, lang]
    );
    const currencyOptions: OptionType[] = useMemo(
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
    useEffect(() => {
        const handleEsc = (event: any) => {
            if (event.key === "Escape") {
                if (showCustomers) {
                    setShowCustomers(false);
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
    }, [showCustomers, showAccounts]);

    useEffect(() => {
        fetchChartsOfAccounts(currentPageAccounts, itemsPerPageAccounts, searchTermAccounts);
    }, [currentPageAccounts, itemsPerPageAccounts, searchTermAccounts]);

    useEffect(() => {
        const calculateTotalsAndFetch = async () => {
            let baseTotalDeduction = 0;
            let base_tax_amount = 0;
            let baseBankCharges = 0;
            let taxAmount = 0;
            let subTotal = 0;
            let baseSubTotal = 0;
            let baseGrandTotal = 0;
            let baseAmountPaid = 0;

            const operator = formData.operator;

            detailList.forEach((element) => {
                if (element.is_deleted === 0) {
                    subTotal += Number(element.amount) || 0;
                    baseSubTotal += Number(element.base_amount) || 0;
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
            const amountPaid = subTotal + taxAmount;
            const totalDeduction = formData.credit_used + formData.deposits;
            const grandTotal = totalDeduction + subTotal;
            if (baseCurrency() === formData.currency?.value) {
                base_tax_amount = taxAmount;
                baseGrandTotal = grandTotal;
                baseAmountPaid = amountPaid;
                baseTotalDeduction = totalDeduction;
                baseBankCharges = formData.bank_charges;
            } else {
                if (operator === "Divide") {
                    base_tax_amount = taxAmount / formData.ex_rate;
                    baseGrandTotal = grandTotal / formData.ex_rate;
                    baseAmountPaid = amountPaid / formData.ex_rate;
                    baseTotalDeduction = totalDeduction / formData.ex_rate;
                    baseBankCharges = formData.bank_charges / formData.ex_rate;
                } else {
                    base_tax_amount = taxAmount * formData.ex_rate;
                    baseGrandTotal = grandTotal * formData.ex_rate;
                    baseAmountPaid = amountPaid * formData.ex_rate;
                    baseTotalDeduction = totalDeduction * formData.ex_rate;
                    baseBankCharges = formData.bank_charges * formData.ex_rate;
                }
            }
            setFormData((prev) => ({
                ...prev,
                total_amount: parseFloat(grandTotal.toFixed(2)),
                base_total_amount: parseFloat(baseGrandTotal.toFixed(2)),
                sub_total: parseFloat(subTotal.toFixed(2)),
                base_sub_total: parseFloat(baseSubTotal.toFixed(2)),
                tax_amount: parseFloat(taxAmount.toFixed(2)),
                base_tax_amount: parseFloat(base_tax_amount.toFixed(2)),
                amount_paid: parseFloat(amountPaid.toFixed(2)),
                base_amount_paid: parseFloat(baseAmountPaid.toFixed(2)),
                total_deduction: parseFloat(totalDeduction.toFixed(2)),
                base_total_deduction: parseFloat(baseTotalDeduction.toFixed(2)),
                base_bank_charges: parseFloat(baseBankCharges.toFixed(2)),
            }));
        };
        calculateTotalsAndFetch();
    }, [detailList, formData.bank_charges, formData.tax_group]);

    useEffect(() => {
        const fetchAllMasterData = () => {
            fetchPVInfo();
        };
        const fetchDropdownData = () => {
            loadInvoiceStatus();
            loadBanks();
            loadPaymentType();
            loadCurrencies();
            loadTaxGroup();
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
    }, [paymentVoucherId, saveType]);

    useEffect(() => {
        if (!masterList) return;

        if (!isInitialized) {
            // A more robust check to see if the form is fully initialized
            const isFormReady = masterList.pv_status_id ? !!formData.pv_status_id : true;
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
            const selectedOption = convertToSingleOption(masterList.pv_status_id, invoiceStatusOptions);
            setFormData((prev) => ({ ...prev, pv_status_id: selectedOption }));
        }
    }, [masterList, invoiceStatusOptions, lang]);

    useEffect(() => {
        if (masterList && banksOptions.length > 0) {
            const selectedOption = convertToSingleOption(Number(masterList.bank), banksOptions);
            setFormData((prev) => ({ ...prev, bank: selectedOption }));
        }
    }, [masterList, banksOptions, lang]);
    useEffect(() => {
        if (masterList && paymentTypeOptions.length > 0) {
            const selectedOption = convertToSingleOption(masterList.payment_type_id, paymentTypeOptions);
            setFormData((prev) => ({ ...prev, payment_type_id: selectedOption }));
        }
    }, [masterList, paymentTypeOptions, lang]);

    useEffect(() => {
        if (masterList && currencyOptions.length > 0) {
            const selectedOption = convertToSingleOption(masterList.currency, currencyOptions);
            setFormData((prev) => ({ ...prev, currency: selectedOption }));
        }
    }, [masterList, currencyOptions, lang]);

    useEffect(() => {
        if (masterList && taxGroupOptions.length > 0) {
            const selectedOption = convertToSingleOption(masterList.tax_group, taxGroupOptions);
            setFormData((prev) => ({ ...prev, tax_group: selectedOption }));
        }
    }, [masterList, taxGroupOptions, lang]);

    const fetchPVInfo = async () => {
        try {
            const idToUse = paymentVoucherId;
            if (!idToUse) {
                setLoading(false);
                return;
            }
            setLoading(true);
            setError(null);

            const purchaseOrderInfoKey = `${idToUse}-cached-pv-info`;
            const cachedSuppliersRaw = localStorage.getItem(purchaseOrderInfoKey);
            let foundSupplier;
            if (cachedSuppliersRaw) {
                foundSupplier = JSON.parse(cachedSuppliersRaw); // ✅ Parse cached JSON
            } else {
                foundSupplier = await paymentVoucherService.getPVInfo(idToUse); // ✅ Fetch from API
            }
            if (foundSupplier) {
                setTransDetails(foundSupplier);
                setDetailList(foundSupplier.details);
                setFormData((prev) => ({
                    ...prev,
                    customer_id: foundSupplier.customer_id || 0,
                    supplier_id: foundSupplier.supplier_id || 0,
                    pay_to_en: foundSupplier.pay_to_en || "",
                    pay_to_cn: foundSupplier.pay_to_cn || "",
                    particular_en: foundSupplier.particular_en || "",
                    particular_cn: foundSupplier.particular_cn || "",
                    customer_code: foundSupplier.customer_code || "",
                    supplier_code: foundSupplier.supplier_code || "",
                    address_en: foundSupplier.address_en || "",
                    address_cn: foundSupplier.address_cn || "",
                    operator: foundSupplier.operator || "",
                    ex_rate: foundSupplier.ex_rate || 0,
                    pv_number: foundSupplier.pv_number || "",
                    pv_date: parseDate(foundSupplier.pv_date),
                    total_amount: foundSupplier.total_amount || 0,
                    base_total_amount: foundSupplier.base_total_amount || 0,
                    sub_total: foundSupplier.sub_total || 0,
                    base_sub_total: foundSupplier.base_sub_total || 0,
                    tax_amount: foundSupplier.tax_amount || 0,
                    base_tax_amount: foundSupplier.base_tax_amount || 0,
                    bank_charges: foundSupplier.bank_charges || 0,
                    base_bank_charges: foundSupplier.base_bank_charges || 0,
                    credit_used: foundSupplier.credit_used || 0,
                    deposits: foundSupplier.deposits || 0,
                    chart_fix_code: foundSupplier.deposits || "",
                }));

                // ✅ Only cache if it's a fresh fetch
                if (!cachedSuppliersRaw) {
                    localStorage.setItem(purchaseOrderInfoKey, JSON.stringify(foundSupplier));
                }
            } else {
                setError("supplier not found");
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to fetch rv details");
            console.error("Error fetching rv details:", err);
        } finally {
            setLoading(false);
        }
    };
    const fetchChartsOfAccounts = async (page = currentPageAccounts, perPage = itemsPerPageAccounts, search = "") => {
        try {
            // Fetch the products and pass the sortId
            const paginatedData = await paymentVoucherService.getExpenseChartsOfAccount(page, perPage, search, "");
            setChartsOfAccounts(paginatedData.data);
            setTotalPages_Accounts(paginatedData.last_page);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to fetch chartsOfAccount");
            console.error("Error fetching chartsOfAccount:", err);
        }
    };
    const updateCachedRaw = async (cachedType: string, masterId: number) => {
        if (cachedType === "info") {
            const newData = await paymentVoucherService.getPVInfo(masterId);
            if (newData) {
                localStorage.setItem(`${masterId}-cached-pv-info`, JSON.stringify(newData));
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
        const bank = formData["bank"]?.toString().trim() ?? "";
        if (!formData.currency) {
            showErrorToast(translations["Currency is required"]);
            setLoadingSave(false); // Enable button again
            return;
        }
        if (formData.pay_to_en === "" && lang === "en") {
            showErrorToast(translations["Pay To is required"] || "Pay To is required");
            setLoadingSave(false); // Enable button again
            return;
        }
        if (formData.pay_to_cn === "" && lang === "cn") {
            showErrorToast(translations["Pay To is required"] || "Pay To is required");
            setLoadingSave(false); // Enable button again
            return;
        }

        if (detailList.length === 0) {
            showErrorToast(translations["Detail(s) Required"]);
            setLoadingSave(false); // Enable button again
            return;
        }
        if (formData.ex_rate === 0) {
            showErrorToast(translations["Exchange Rate is Required"]);
            setLoadingSave(false); // Enable button again
            return;
        }
        if (!bank || bank === "") {
            showErrorToast(translations["Bank is required"]);
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
                            qty: list.qty,
                            amount: list.amount,
                            base_amount: list.base_amount,
                            ap_detail_id: list.ap_detail_id,
                            ap_invoice_no: list.ap_invoice_no,
                            product_id: list.product_id,
                            ref_data: list.ref_data,
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
            const result = await paymentVoucherService.updatePaymentVoucher(paymentVoucherId, data);
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
                onChangeOperatingExpenseId(newId);
                onChangeSaveType("edit");
            }
            // Reset state to allow re-initialization after refetch
            setIsDirty(false);
            setIsInitialized(false);
            await updateCachedRaw("info", newId);
            fetchPVInfo();
            selectedOperatingExpense([]);
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
        onChangeOperatingExpenseId(0);
        onChangeSaveType("new");
        clearForms(invoiceStatusOptions);
        setIsDirty(false);
    };
    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            const allIds = detailList?.map((p: any) => p.indexInt);
            selectedOperatingExpense(allIds);
        } else {
            selectedOperatingExpense([]);
        }
    };
    const handleSelectCustomer = (id: number, checked: boolean) => {
        if (checked) {
            selectedOperatingExpense((prev) => [...prev, id]);
        } else {
            selectedOperatingExpense((prev) => prev.filter((pid) => pid !== id));
        }
    };
    const handlePVDateChange = useCallback((dates: Date[]) => {
        setFormData((prev) => ({ ...prev, pv_date: dates[0] ?? null }));
        setIsDirty(true); // ✅ only if user is editing
    }, []);
    const handleAddRow = () => {
        const newId = Math.floor(10000 + Math.random() * 90000);
        const newData: DetailsRow = {
            id: 0,
            indexInt: newId,
            account_code: "",
            product_id: 0,
            po_detail_id: 0,
            ap_detail_id: 0,
            qty: 0,
            account_no: "",
            ap_invoice_no: "",
            ref_data: "",
            currency: String(masterList?.currency),
            ex_rate: 0,
            amount: 0,
            base_amount: 0,
            ex_rate_diff: 0,
            is_deleted: 0,
            product_code: "",
            product_title_en: "",
            product_title_cn: "",
            account_name_en: "",
            account_name_cn: "",
            delete_type: "",
            age_type: "new",
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
                    let base_amount = 0;
                    if (baseCurrency() === formData.currency?.value) {
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
                    return updatedItem;
                }
                return item;
            })
        );
    };
    const handleEnterKey = async (indexInt: number, value: string, column: string, ageType: string) => {
        switch (column) {
            case "account_code":
                try {
                    setGlobalIndex(indexInt);
                    console.log(ageType);
                    const res = await paymentVoucherService.getExpenseChartsOfAccount(currentPageAccounts, itemsPerPageAccounts, "", value);
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
        }
    };
    const handlPopupProducts = (indexInt: number, ageType: string) => {
        setGlobalIndex(indexInt);
        setShowAccounts(true);
        console.log(ageType);
    };
    const handleVoid = async () => {
        const data = new FormData();
        data.append("details[]", JSON.stringify({ pv_number: formData.pv_number }));
        const confirmed = await showConfirm(translations["Void Record(s)"], translations["alert_message_38"], translations["Yes"], translations["Cancel"]);
        if (!confirmed) return;
        try {
            const result = await paymentVoucherService.voidPaymentVoucher(data);
            if (result.token === "Error") {
                showErrorToast(result.message);
                return;
            }
            // Reset state to allow re-initialization after refetch
            setIsDirty(false);
            setIsInitialized(false);
            await updateCachedRaw("info", paymentVoucherId);
            fetchPVInfo();
            selectedOperatingExpense([]);
            showSuccessToast(translations[result.message]);
            onSave(); // This will now trigger the cache clearing in the parent
        } catch (error) {}
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
    const loadBanks = async () => {
        try {
            const list = await fetchBank(); // fetches & returns
            setBanksData(list ?? []); // ✅ manually set state here
        } catch (err) {
            console.error("Failed to fetch loadBanks:", err);
        }
    };
    const loadPaymentType = async () => {
        try {
            const list = await fetchPaymentType(); // fetches & returns
            setPaymentType(list ?? []); // ✅ manually set state here
        } catch (err) {
            console.error("Failed to fetch loadPaymentType:", err);
        }
    };
    const loadCurrencies = async () => {
        try {
            const list = await fetchCurrencies(); // fetches & returns
            setCurrencies(list ?? []); // ✅ manually set state here
        } catch (err) {
            console.error("Failed to fetch loadCurrencies:", err);
        }
    };
    const loadTaxGroup = async () => {
        try {
            const list = await fetchTaxGroup(); // fetches & returns
            setTaxGroup(list ?? []); // ✅ manually set state here
        } catch (err) {
            console.error("Failed to fetch loadTaxGroup:", err);
        }
    };
    const handleSetExchangeRate = async (currency: string) => {
        const exRate = await fetchExchangeRate(currency, baseCurrency());
        if (exRate === 0) {
            showErrorToast(translations["Exchange Rate is Required"]);
            return;
        }
        setFormData((prev) => ({ ...prev, ex_rate: parseFloat(exRate.toFixed(4)) }));
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
            <div className="h-[calc(100vh-200px)] overflow-y-auto pr-2">
                <div className="grid gap-4">
                    <div className="grid grid-cols-12 gap-4">
                        {/* Right side: 12 columns */}
                        <div className="col-span-12 p-1">
                            <fieldset className="grid grid-cols-12 gap-4 border-[1px] border-[#ffffff1a] rounded-lg p-4 mb-2">
                                <div className="col-span-12 md:col-span-4">
                                    <div className="flex items-center space-x-4 mb-2">
                                        <label className="w-[26%] text-gray-400 text-sm text-right">{translations["Payment Type"]}</label>
                                        <Select
                                            classNamePrefix="react-select"
                                            value={formData.payment_type_id ?? null}
                                            onChange={async (selected) => {
                                                setFormData({ ...formData, payment_type_id: selected as OptionType | null });
                                                setIsDirty(true); // ✅ only if user is editing
                                            }}
                                            isDisabled
                                            options={paymentTypeOptions}
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
                                    <div className="flex items-center gap-4 mb-2">
                                        <label className="w-[25%] text-gray-400 text-sm text-right">{translations["Pay To"]}</label>
                                        <div className="flex flex-1">
                                            <input
                                                type="text"
                                                value={formData.pay_to_en}
                                                hidden={lang === "cn"}
                                                onChange={(e) => {
                                                    const value = e.target.value;
                                                    setFormData((prev) => ({ ...prev, pay_to_en: value }));
                                                    setIsDirty(true);
                                                }}
                                                className="flex-1 px-3 py-2 border border-[#ffffff1a] border-r-0 bg-transparent text-[#ffffffcc] text-custom-sm rounded-tl-md rounded-bl-md"
                                            />
                                            <input
                                                type="text"
                                                value={formData.pay_to_cn}
                                                hidden={lang === "en"}
                                                onChange={(e) => {
                                                    const value = e.target.value;
                                                    setFormData((prev) => ({ ...prev, pay_to_cn: value }));
                                                    setIsDirty(true);
                                                }}
                                                className="flex-1 px-3 py-2 border border-[#ffffff1a] border-r-0 bg-transparent text-[#ffffffcc] text-custom-sm rounded-tl-md rounded-bl-md"
                                            />
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-4 mb-2">
                                        <label className="w-[25%] text-gray-400 text-sm text-right">{translations["Address"]}</label>
                                        <textarea
                                            rows={3}
                                            hidden={lang === "cn"}
                                            readOnly
                                            value={formData.address_en}
                                            onChange={(e) => {
                                                const value = e.target.value;
                                                setFormData((prev) => ({ ...prev, address_en: value }));
                                                setIsDirty(true);
                                            }}
                                            className="flex-1 px-3 py-2 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm"
                                        />
                                        <textarea
                                            rows={3}
                                            hidden={lang === "en"}
                                            readOnly
                                            value={formData.address_cn}
                                            onChange={(e) => {
                                                const value = e.target.value;
                                                setFormData((prev) => ({ ...prev, address_cn: value }));
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
                                        <label className="w-[25%] text-gray-400 text-sm text-right">{translations["Detail"]}</label>
                                        <textarea
                                            rows={3}
                                            hidden={lang === "cn"}
                                            value={formData.particular_en}
                                            onChange={(e) => {
                                                const value = e.target.value;
                                                setFormData((prev) => ({ ...prev, particular_en: value }));
                                                setIsDirty(true);
                                            }}
                                            className="flex-1 px-3 py-2 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm"
                                        />
                                        <textarea
                                            rows={3}
                                            hidden={lang === "en"}
                                            value={formData.particular_cn}
                                            onChange={(e) => {
                                                const value = e.target.value;
                                                setFormData((prev) => ({ ...prev, particular_cn: value }));
                                                setIsDirty(true);
                                            }}
                                            className="flex-1 px-3 py-2 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm"
                                        />
                                    </div>
                                </div>
                                <div className="col-span-12 md:col-span-4">
                                    <div className="flex items-center space-x-4 mb-2">
                                        <label className="w-[25%] text-gray-400 text-sm text-right">{translations["PV No"]}</label>
                                        <input
                                            value={formData.pv_number}
                                            readOnly
                                            onChange={(e) => {
                                                const value = e.target.value;
                                                setFormData((prev) => ({ ...prev, pv_number: value }));
                                                setIsDirty(true);
                                            }}
                                            className="flex-1 px-3 py-2 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm"
                                        />
                                    </div>
                                    <div className="flex items-center space-x-4 mb-2">
                                        <label className="w-[25%] text-gray-400 text-sm text-right">{translations["PV Date"]}</label>
                                        <Flatpickr
                                            onChange={handlePVDateChange}
                                            options={{
                                                dateFormat: "M d Y",
                                                defaultDate: formData.pv_date || undefined,
                                                allowInput: true,
                                                locale: locale,
                                            }}
                                            className="flex-1 px-3 py-2 border-[1px] border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm"
                                        />
                                    </div>

                                    <div className="flex items-center space-x-4 mb-2">
                                        <label className="w-[26%] text-gray-400 text-sm text-right">{translations["PV Status"]}</label>
                                        <Select
                                            classNamePrefix="react-select"
                                            value={formData.pv_status_id ?? null}
                                            onChange={async (selected) => {
                                                setFormData({ ...formData, pv_status_id: selected as OptionType | null });
                                                setIsDirty(true); // ✅ only if user is editing
                                            }}
                                            options={invoiceStatusOptions}
                                            styles={{
                                                ...selectStyles,
                                                menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                                            }}
                                            isDisabled
                                            className="w-[75%]"
                                            placeholder={translations["Select"]}
                                            menuPlacement="auto"
                                            menuPosition="fixed"
                                            menuPortalTarget={typeof window !== "undefined" ? document.body : null}
                                        />
                                    </div>
                                    <div className="flex items-center space-x-4 mb-2">
                                        <label className="w-[26%] text-gray-400 text-sm text-right">{translations["Currency"]}</label>
                                        <Select
                                            classNamePrefix="react-select"
                                            value={formData.currency ?? null}
                                            onChange={async (selected) => {
                                                setFormData({ ...formData, currency: selected as OptionType | null });
                                                setIsDirty(true); // ✅ only if user is editing
                                                handleSetExchangeRate(String(selected?.value));
                                            }}
                                            options={currencyOptions}
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
                                                <th className="text-center py-1 px-2 text-gray-400 text-sm w-12 border border-[#40404042]">
                                                    <div className="relative group inline-block">
                                                        <CustomCheckbox
                                                            checked={selectedDetails.length === detailList?.length && detailList?.length > 0}
                                                            onChange={(checked) => handleSelectAll(checked)}
                                                        />
                                                    </div>
                                                </th>
                                                <th className="text-center py-1 px-2 text-gray-400 text-sm w-12 border border-[#40404042]">
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
                                                <th className="text-center py-1 px-2 text-gray-400 text-sm w-12 border border-[#40404042]"></th>
                                                <th className={`text-left py-1 px-2 text-gray-400 text-sm border border-[#40404042]`}>{translations["Account Code"]}</th>
                                                <th className={`text-left py-1 px-2 text-gray-400 text-sm border border-[#40404042]`}>{translations["Description"]}</th>
                                                <th className={`text-center py-1 px-2 text-gray-400 text-sm border border-[#40404042]`}>{translations["Currency"]}</th>
                                                <th className={`text-center py-1 px-2 text-gray-400 text-sm border border-[#40404042]`}>{translations["Ex Rate"]}</th>
                                                <th className={`text-center py-1 px-2 text-gray-400 text-sm border border-[#40404042]`}>{translations["Amount"]}</th>
                                                <th className={`text-center py-1 px-2 text-gray-400 text-sm border border-[#40404042]`}>{translations["Default Currency"]}</th>
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
                                                                        readOnly={masterList?.pv_status_id != 2}
                                                                        value={lang === "en" ? item.account_name_en : item.account_name_cn}
                                                                        className="w-full px-3 py-1.5 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-sm rounded"
                                                                    />
                                                                </td>
                                                                <td className="py-0 px-0 text-gray-400 text-center text-custom-sm border border-[#40404042]">
                                                                    <input
                                                                        type="text"
                                                                        value={formData.currency?.value}
                                                                        readOnly
                                                                        className="w-full px-3 py-1.5 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-sm rounded text-center"
                                                                    />
                                                                </td>
                                                                <td className="py-0 px-0 text-gray-400 text-center text-custom-sm border border-[#40404042]">
                                                                    <input
                                                                        type="text"
                                                                        value={formData.ex_rate}
                                                                        readOnly
                                                                        placeholder="0"
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
                                        <label className="w-[30%] text-gray-400 text-sm text-right">{translations["Bank"]}</label>
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
                                            className="w-[68%]"
                                            placeholder={translations["Select"]}
                                            menuPlacement="auto"
                                            menuPosition="fixed"
                                            menuPortalTarget={typeof window !== "undefined" ? document.body : null}
                                        />
                                    </div>
                                    <div className="flex items-center space-x-4 mb-2">
                                        <label className="w-[30%] text-gray-400 text-sm text-right">{translations["Bank Charges"]}</label>
                                        <input
                                            type="number"
                                            value={formData.bank_charges === 0 ? "" : formData.bank_charges}
                                            placeholder="0"
                                            onChange={(e) => {
                                                const value = Number(e.target.value);
                                                setFormData((prev) => ({ ...prev, bank_charges: value }));
                                                setIsDirty(true);
                                            }}
                                            className="text-right flex-1 px-3 py-2 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm"
                                        />
                                        <input
                                            type="text"
                                            hidden
                                            readOnly
                                            value={formData.base_bank_charges}
                                            onChange={(e) => {
                                                const value = Number(e.target.value);
                                                setFormData((prev) => ({ ...prev, base_bank_charges: value }));
                                                setIsDirty(true);
                                            }}
                                            className="text-right flex-1 px-3 py-2 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm"
                                        />
                                    </div>
                                    <div className="flex items-center space-x-4 mb-2">
                                        <label className="w-[30%] text-gray-400 text-sm text-right">{translations["Deposit"]}</label>
                                        <input
                                            type="text"
                                            readOnly
                                            value={formData.deposits}
                                            onChange={(e) => {
                                                const value = Number(e.target.value);
                                                setFormData((prev) => ({ ...prev, deposits: value }));
                                                setIsDirty(true);
                                            }}
                                            className="text-right flex-1 px-3 py-2 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm"
                                        />
                                    </div>
                                    <div className="flex items-center space-x-4 mb-2">
                                        <label className="w-[30%] text-gray-400 text-sm text-right">{translations["Credit Used"]}</label>
                                        <input
                                            type="text"
                                            readOnly
                                            value={formData.credit_used}
                                            onChange={(e) => {
                                                const value = Number(e.target.value);
                                                setFormData((prev) => ({ ...prev, credit_used: value }));
                                                setIsDirty(true);
                                            }}
                                            className="text-right flex-1 px-3 py-2 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm"
                                        />
                                    </div>
                                </div>
                                <div className="col-span-12 md:col-span-4"></div>
                                <div className="col-span-12 md:col-span-3">
                                    <div className="flex items-center space-x-4 mb-2">
                                        <label className="w-[35%] text-gray-400 text-sm text-right">{translations["Total"]}</label>
                                        <input
                                            type="text"
                                            readOnly
                                            value={formData.currency?.value}
                                            className="w-[20%] px-3 py-2 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm text-center"
                                        />
                                        <input
                                            type="text"
                                            readOnly
                                            value={formData.total_amount}
                                            onChange={(e) => {
                                                const value = Number(e.target.value);
                                                setFormData((prev) => ({ ...prev, total_amount: value }));
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
                                            value={formData.currency?.value}
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
                                        <label className="w-[35%] text-gray-400 text-sm text-right">{translations["Sub Total"]}</label>
                                        <input
                                            type="text"
                                            readOnly
                                            value={formData.currency?.value}
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
                                            value={formData.currency?.value}
                                            className="w-[20%] px-3 py-2 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm text-center"
                                        />
                                        <input
                                            type="text"
                                            readOnly
                                            value={formData.tax_amount}
                                            onChange={(e) => {
                                                const value = Number(e.target.value);
                                                setFormData((prev) => ({ ...prev, tax_amount: value }));
                                                setIsDirty(true);
                                            }}
                                            className="w-[45%] px-3 py-2 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm text-right"
                                        />
                                    </div>
                                    <div className="flex items-center space-x-4 mb-2">
                                        <label className="w-[35%] text-gray-400 text-sm text-right">{translations["Amount Paid"]}</label>
                                        <input
                                            type="text"
                                            readOnly
                                            value={formData.currency?.value}
                                            className="w-[20%] px-3 py-2 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm text-center"
                                        />
                                        <input
                                            type="text"
                                            readOnly
                                            value={formData.amount_paid}
                                            onChange={(e) => {
                                                const value = Number(e.target.value);
                                                setFormData((prev) => ({ ...prev, amount_paid: value }));
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
                                            value={formData.base_total_amount}
                                            onChange={(e) => {
                                                const value = Number(e.target.value);
                                                setFormData((prev) => ({ ...prev, base_total_amount: value }));
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
                                            value={formData.base_amount_paid}
                                            onChange={(e) => {
                                                const value = Number(e.target.value);
                                                setFormData((prev) => ({ ...prev, base_amount_paid: value }));
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
                            disabled={loadingSave || masterList?.pv_status_id === 5}
                        >
                            <span>{translations["Save"]}</span>
                        </button>
                        <button
                            onClick={() => {
                                exportRef.current?.triggerExport();
                            }}
                            disabled={paymentVoucherId === 0}
                            className="px-2 py-2 bg-cyan-600 hover:bg-cyan-700 text-[#ffffffcc] text-custom-sm rounded-lg text-sm font-medium transition-colors"
                        >
                            {translations["Print"]}
                        </button>
                        <button onClick={handleAddNew} className="px-2 py-2 bg-cyan-600 hover:bg-cyan-700 text-[#ffffffcc] text-custom-sm rounded-lg text-sm font-medium transition-colors">
                            {translations["Add New"]}
                        </button>

                        <button
                            onClick={handleVoid}
                            disabled={paymentVoucherId === 0 || masterList?.pv_status_id === 5}
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
                <div className="flex-1">{renderDetails()}</div>
            </div>
            <div className="hidden">
                <ExportReportSelector ref={exportRef} formats={["odt"]} baseName="DownloadSelectedSinglePV" ids={[paymentVoucherId]} language={lang} />
            </div>
            {renderChartsOfAccounts()}
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

export default OperatingExpenseDetails;
