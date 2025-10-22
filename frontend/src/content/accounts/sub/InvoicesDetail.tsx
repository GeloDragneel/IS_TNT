import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { showConfirm } from "@/utils/alert";
import { showSuccessToast, showErrorToast } from "@/utils/toast";
import Select from "react-select";
import { getFlatpickrLocale, formatDateToCustom } from "@/utils/flatpickrLocale";
import CustomCheckbox from "@/components/CustomCheckbox";
import { ArrowLeft, X, Plus, Search, ChevronDown } from "lucide-react";
import Flatpickr from "react-flatpickr";
import "flatpickr/dist/themes/dark.css";
import { invoiceService, ApiCustomerInvoice, DetailsRow } from "@/services/customerInvoiceService";
import { customerService, ApiCustomer } from "@/services/customerService";
import Pagination from "@/components/Pagination";
import ItemsPerPageSelector from "@/components/ItemsPerPageSelector";
import { productService, ApiProduct } from "@/services/productService";
import { NumericFormat } from "react-number-format";
import { ExportReportSelector } from "@/utils/ExportReportSelector";
import {
    fetchPaymentTerms,
    fetchShippingTerms,
    fetchShippingStat,
    fetchInvoiceType,
    fetchTaxGroup,
    fetchCourier,
    fetchInvoiceStatus,
    fetchBank,
    convertToSingleOption,
    OptionType,
} from "@/utils/fetchDropdownData";
import { selectStyles, baseCurrency, parseDate, DropdownData, formatMoney } from "@/utils/globalFunction";
import { highlightMatch } from "@/utils/highlightMatch";
import CopyToClipboard from "@/components/CopyToClipboard";
// localStorage.clear();
const MemoizedPagination = React.memo(Pagination);
const MemoizedItemsPerPageSelector = React.memo(ItemsPerPageSelector);
interface CustomerInvoiceDetailsProps {
    customerInvoiceId: number;
    saveType: string;
    onBack: () => void;
    onSave: () => void;
    tabId: string;
    onChangeCustomerInvoiceId: (newId: number) => void;
    onChangeSaveType: (type: string) => void;
}
const defaultDetails: ApiCustomerInvoice = {
    id: 0,
    so_number: "",
    invoice_no: "",
    invoice_date: "",
    customer_code: "",
    account_name_en: "",
    account_name_cn: "",
    cnt_products: 0,
    customer_id: 0,
    billing_address_en: "",
    billing_address_cn: "",
    delivery_address_en: "",
    delivery_address_cn: "",
    ex_rate: 0,
    rv_date: "",
    invoice_status_id: 2,
    delivery_method_id: null,
    shipping_stat_id: null,
    shipping_terms_id: null,
    sales_person_name: "",
    sales_person_id: null,
    payment_terms_id: null,
    invoice_type: 1,
    due_date: "",
    delivery_date: "",
    tax: "",
    currency: "",
    total: 0,
    base_total: 0,
    current_credit: 0,
    base_current_credit: 0,
    cr_amount: 0,
    base_cr_amount: 0,
    adv_amount: 0,
    base_adv_amount: 0,
    credit_used: 0,
    base_credit_used: 0,
    total_deposit: 0,
    base_total_deposit: 0,
    voucher_amount: 0,
    base_voucher_amount: 0,
    sub_total: 0,
    base_sub_total: 0,
    tax_amount: 0,
    base_tax_amount: 0,
    total_deduction: 0,
    base_total_deduction: 0,
    total_to_pay: 0,
    base_total_to_pay: 0,
    excess_amount: 0,
    base_excess_amount: 0,
    amount_paid: 0,
    base_amount_paid: 0,
    balance: 0,
    base_balance: 0,
    details: [],
    cnt_ship: 0, // Default value for cnt_ship
    balance_to_pay: 0, // Default value for balance_to_pay
    new_balance: 0, // Default value for new_balance
};

type InvoiceItem = {
    invoice_no: string;
    receive_amount: number;
    invoice_id: number;
};
type FormDataType = {
    customer_id: number;
    customer_code: string;
    rv_date: Date | null;
    bank: OptionType | null;
    balance_to_pay: number;
    received_amount: number;
    current_credit: number;
    credit_used: number;
    currency: string;
    invoice_nos: InvoiceItem[];
};
const CustomerInvoiceDetails: React.FC<CustomerInvoiceDetailsProps> = ({ customerInvoiceId, tabId, saveType, onBack, onSave, onChangeCustomerInvoiceId, onChangeSaveType }) => {
    const { translations, lang } = useLanguage();
    const [masterList, setTransDetails] = useState<ApiCustomerInvoice | null>(null);
    const [SOOrderIds, setSOOrderIds] = useState<ApiCustomerInvoice[]>([]);
    const [selectedForCredits, setSelectedCredits] = useState<ApiCustomerInvoice[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState("information");
    const [customers, setCustomers] = useState<ApiCustomer[]>([]);
    const [isDirty, setIsDirty] = useState(false);
    const [showUnsavedChanges, setShowUnsavedChanges] = useState(false);
    const [products, setProducts] = useState<ApiProduct[]>([]);
    const [isInitialized, setIsInitialized] = useState(false);
    const initialFormData = React.useRef<any>(null);
    const locale = getFlatpickrLocale(translations);
    const [loadingSave, setLoadingSave] = useState(false);
    const [shippingTermsData, setShippingTermsData] = useState<DropdownData[]>([]);
    const [taxGroupData, setTaxGroupData] = useState<DropdownData[]>([]);
    const [courierData, setCourier] = useState<DropdownData[]>([]);
    const [invoiceStatusData, setInvoiceStatus] = useState<DropdownData[]>([]);
    const [shippingStatusData, setAllShippingStat] = useState<DropdownData[]>([]);
    const [invoiceTypeData, setInvoiceTypeData] = useState<DropdownData[]>([]);
    const [paymentTermsData, setPaymentTermsData] = useState<DropdownData[]>([]);
    const [banksData, setBanksData] = useState<DropdownData[]>([]);
    const [detailList, setDetailList] = useState<DetailsRow[]>([]);
    const [globalIndex, setGlobalIndex] = useState(0);
    const [ageType, setAgeType] = useState("");
    const [showProducts, setShowProducts] = useState(false);
    const [showAllocation, setShowAllocation] = useState(false);
    const [totalPagesProducts, setTotalPages_Products] = useState(1);
    const pageSizeOptions = useMemo(() => [10, 20, 50, -1], []);
    const [showCustomers, setShowCustomers] = useState(false);
    const [showCreateRV, setShowCreateRV] = useState(false);
    const [totalPagesCustomer, setTotalPages_Customer] = useState(1);
    const [selectedDetails, selectedPurchaseOrder] = useState<number[]>([]);
    const [selectedChkProducts, setSelectedProducts] = useState<number[]>([]);
    const [showCreatePV, setShowCreatePV] = useState(false);
    const [creditsPopup, setShowCreditsPopup] = useState(false);
    const [activeDropdownProd, setActiveDropdownProd] = useState("Products");
    const [showDropdown, setShowDropdown] = useState(false);
    const [cancelOrder, setShowCancelOrder] = useState(false);
    const [loadCancelOrder_CTOCUST, setLoadCancelOrder_CTOCUST] = useState(false);
    const [loadCancelOrder_NRTOMI, setLoadCancelOrder_NRTOMI] = useState(false);
    const [loadCancelOrder_RPTOC, setLoadCancelOrder_RPTOC] = useState(false);
    const [loadCancelOrder_PRTCNL, setLoadCancelOrder_PRTCNL] = useState(false);
    const [globOperator, setOperator] = useState("");
    const [cancelType, setCancelType] = useState("");
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
    const [searchTermCustomer, setSearchTermCustomer] = useState(() => {
        const cached = localStorage.getItem(`${tabId}-cached-po-supplier`);
        if (!cached) return "";
        try {
            const meta = JSON.parse(cached);
            return meta.search || "";
        } catch {
            return "";
        }
    });
    const [currentPageCustomer, setCurrentPageCustomer] = useState(() => {
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
    const [itemsPerPageSupplier, setItemsPerPageCustomer] = useState(() => {
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
    const shippingTermsOptions: OptionType[] = useMemo(
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
    const shippingStatOptions: OptionType[] = useMemo(
        () =>
            shippingStatusData.map((list) => ({
                value: list.value.toString(),
                value2: list.value.toString(),
                label: lang === "en" ? list.en : list.cn,
                en: list.en,
                cn: list.cn,
            })),
        [shippingStatusData, lang]
    );
    const invoiceTypeOptions: OptionType[] = useMemo(
        () =>
            invoiceTypeData.map((list) => ({
                value: list.value.toString(),
                value2: list.value.toString(),
                label: lang === "en" ? list.en : list.cn,
                en: list.en,
                cn: list.cn,
            })),
        [invoiceTypeData, lang]
    );
    const paymentTermsOptions: OptionType[] = useMemo(
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
    const courierOptions: OptionType[] = useMemo(
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
        customer_id: 0,
        customer_code: "",
        account_name_en: "",
        account_name_cn: "",
        billing_address_en: "",
        billing_address_cn: "",
        delivery_address_en: "",
        delivery_address_cn: "",
        ex_rate: 0,
        so_number: "",
        invoice_no: "",
        invoice_date: null as Date | null,
        rv_date: null as Date | null,
        invoice_status_id: null as OptionType | null,
        delivery_method_id: null as OptionType | null,
        shipping_stat_id: null as OptionType | null,
        sales_person_name: "",
        sales_person_id: null as OptionType | null,
        payment_terms_id: null as OptionType | null,
        shipping_terms_id: null as OptionType | null,
        invoice_type: null as OptionType | null,
        due_date: null as Date | null,
        delivery_date: null as Date | null,
        tax: null as OptionType | null,
        currency: "",
        total: 0,
        base_total: 0,
        current_credit: 0,
        base_current_credit: 0,
        cr_amount: 0,
        base_cr_amount: 0,
        adv_amount: 0,
        base_adv_amount: 0,
        credit_used: 0,
        base_credit_used: 0,
        total_deposit: 0,
        base_total_deposit: 0,
        voucher_amount: 0,
        base_voucher_amount: 0,
        sub_total: 0,
        base_sub_total: 0,
        tax_amount: 0,
        base_tax_amount: 0,
        total_deduction: 0,
        base_total_deduction: 0,
        total_to_pay: 0,
        base_total_to_pay: 0,
        excess_amount: 0,
        base_excess_amount: 0,
        amount_paid: 0,
        base_amount_paid: 0,
        balance: 0,
        base_balance: 0,
    });
    const [formDataRV, setFormDataRV] = useState<FormDataType>({
        customer_id: 0,
        customer_code: "",
        rv_date: new Date(),
        bank: null,
        balance_to_pay: 0,
        received_amount: 0,
        current_credit: 0,
        credit_used: 0,
        currency: "",
        invoice_nos: [],
    });
    const clearForms = (Options: OptionType[]) => {
        const selectedOption = convertToSingleOption(1, Options);
        const initialFormData = {
            customer_id: 0,
            customer_code: "",
            account_name_en: "",
            account_name_cn: "",
            billing_address_en: "",
            billing_address_cn: "",
            delivery_address_en: "",
            delivery_address_cn: "",
            ex_rate: 0,
            so_number: "",
            invoice_no: "",
            invoice_date: new Date(),
            rv_date: new Date(),
            invoice_status_id: selectedOption,
            delivery_method_id: null,
            shipping_stat_id: null,
            sales_person_name: "",
            sales_person_id: null,
            payment_terms_id: null,
            shipping_terms_id: null,
            invoice_type: null,
            due_date: null,
            delivery_date: null,
            tax: null,
            currency: "",
            total: 0,
            base_total: 0,
            current_credit: 0,
            base_current_credit: 0,
            cr_amount: 0,
            base_cr_amount: 0,
            adv_amount: 0,
            base_adv_amount: 0,
            credit_used: 0,
            base_credit_used: 0,
            total_deposit: 0,
            base_total_deposit: 0,
            voucher_amount: 0,
            base_voucher_amount: 0,
            sub_total: 0,
            base_sub_total: 0,
            tax_amount: 0,
            base_tax_amount: 0,
            total_deduction: 0,
            base_total_deduction: 0,
            total_to_pay: 0,
            base_total_to_pay: 0,
            excess_amount: 0,
            base_excess_amount: 0,
            amount_paid: 0,
            base_amount_paid: 0,
            balance: 0,
            base_balance: 0,
        };
        setFormData(initialFormData);
    };
    const round = (num: number) => parseFloat(num.toFixed(2));

    useEffect(() => {
        const handleEsc = (event: any) => {
            if (event.key === "Escape") {
                if (showCreatePV && !creditsPopup) {
                    setShowCreatePV(false);
                }
                if (creditsPopup) {
                    setShowCreditsPopup(false);
                }
                if (showCustomers) {
                    setShowCustomers(false);
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
    }, [creditsPopup, showCustomers, showCreatePV, showProducts, showAllocation]);

    useEffect(() => {
        fetchProducts(currentPageProduct, itemsPerPageProduct, searchTermProduct, selectedChkProducts, activeDropdownProd);
    }, [currentPageProduct, itemsPerPageProduct, searchTermProduct, selectedChkProducts, activeDropdownProd]);

    useEffect(() => {
        const fetchOperator = async () => {
            const conversionKey = formData.currency + baseCurrency();
            const operator = await productService.getOperator(conversionKey);
            setOperator(operator);
        };
        fetchOperator();
    }, [formData.currency]);

    useEffect(() => {
        const calculateTotalsAndFetch = async () => {
            let totalDeposit = 0;
            let totalDeduction = 0;
            let totalVoucherAmount = 0;
            let totalCreditUsed = 0;
            let totalCost = 0;
            let total = 0;
            let subTotal = 0;
            let taxAmount = 0;
            let totalToPay = 0;
            let totalCRAmount = 0;
            let totalAdvAmount = 0;
            let totalExcessAmount = 0;
            let amountPaid = 0;
            let balance = 0;

            let baseSubTotal = 0;
            let baseTotalDeposit = 0;
            let baseTaxAmount = 0;
            let baseTotal = 0;
            let baseTotalDeduction = 0;
            let baseTotalToPay = 0;
            let baseCreditUsed = 0;
            let baseCRAmount = 0;
            let baseAdvAmount = 0;
            let baseExcessAmount = 0;
            let baseAmountPaid = 0;
            let baseBalance = 0;

            detailList.forEach((element) => {
                if (element.is_deleted === 0) {
                    subTotal += Number(element.total) || 0;
                    totalDeposit += Number(element.deposit) || 0;
                    totalCost += Number(element.item_cost) * Number(element.qty) || 0;
                    totalVoucherAmount += 0;
                }
            });
            const taxGroup = (formData.tax as OptionType)?.value ?? null;
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
            totalCRAmount = round(formData.cr_amount);
            totalAdvAmount = round(formData.adv_amount);
            totalExcessAmount = round(formData.excess_amount);
            amountPaid = round(formData.amount_paid);
            total = round(subTotal) + round(taxAmount);
            totalCreditUsed = round(totalCRAmount) + round(totalAdvAmount) + round(totalExcessAmount);
            totalDeduction = round(totalDeposit) + round(totalCreditUsed) + round(totalVoucherAmount);
            totalToPay = round(total) - round(totalDeduction);
            balance = round(totalToPay) - round(amountPaid);
            balance = round(totalToPay) === 0 ? 0 : round(balance);

            const operator = globOperator;

            if (baseCurrency() === formData.currency) {
                baseSubTotal = subTotal;
                baseTotalDeposit = totalDeposit;
                baseTotal = total;
                baseTaxAmount = taxAmount;
                baseTotalDeduction = totalDeduction;
                baseTotalToPay = totalToPay;
                baseCreditUsed = totalCreditUsed;
                baseCRAmount = totalCRAmount;
                baseAdvAmount = totalAdvAmount;
                baseExcessAmount = totalExcessAmount;
                baseAmountPaid = amountPaid;
                baseBalance = balance;
            } else {
                if (operator === "Divide") {
                    baseSubTotal = subTotal / formData.ex_rate;
                    baseTotalDeposit = totalDeposit / formData.ex_rate;
                    baseTotal = total / formData.ex_rate;
                    baseTaxAmount = taxAmount / formData.ex_rate;
                    baseTotalDeduction = totalDeduction / formData.ex_rate;
                    baseTotalToPay = totalToPay / formData.ex_rate;
                    baseCreditUsed = totalCreditUsed / formData.ex_rate;
                    baseCRAmount = totalCRAmount / formData.ex_rate;
                    baseAdvAmount = totalAdvAmount / formData.ex_rate;
                    baseExcessAmount = totalExcessAmount / formData.ex_rate;
                    baseAmountPaid = amountPaid / formData.ex_rate;
                    baseBalance = balance / formData.ex_rate;
                } else {
                    baseSubTotal = subTotal * formData.ex_rate;
                    baseTotalDeposit = totalDeposit * formData.ex_rate;
                    baseTotal = total * formData.ex_rate;
                    baseTaxAmount = taxAmount * formData.ex_rate;
                    baseTotalDeduction = totalDeduction * formData.ex_rate;
                    baseTotalToPay = totalToPay * formData.ex_rate;
                    baseCreditUsed = totalCreditUsed * formData.ex_rate;
                    baseCRAmount = totalCRAmount * formData.ex_rate;
                    baseAdvAmount = totalAdvAmount * formData.ex_rate;
                    baseExcessAmount = totalExcessAmount * formData.ex_rate;
                    baseAmountPaid = amountPaid * formData.ex_rate;
                    baseBalance = balance * formData.ex_rate;
                }
            }
            setFormData((prev) => ({
                ...prev,
                total: parseFloat(total.toFixed(2)),
                base_total: parseFloat(baseTotal.toFixed(2)),
                sub_total: parseFloat(subTotal.toFixed(2)),
                base_sub_total: parseFloat(baseSubTotal.toFixed(2)),
                total_deposit: parseFloat(totalDeposit.toFixed(2)),
                base_total_deposit: parseFloat(baseTotalDeposit.toFixed(2)),
                tax_amount: parseFloat(taxAmount.toFixed(2)),
                base_tax_amount: parseFloat(baseTaxAmount.toFixed(2)),
                sub_total_on_cost: parseFloat(totalCost.toFixed(2)),
                total_deduction: parseFloat(totalDeduction.toFixed(2)),
                base_total_deduction: parseFloat(baseTotalDeduction.toFixed(2)),
                total_to_pay: parseFloat(totalToPay.toFixed(2)),
                base_total_to_pay: parseFloat(baseTotalToPay.toFixed(2)),
                credit_used: parseFloat(totalCreditUsed.toFixed(2)),
                base_credit_used: parseFloat(baseCreditUsed.toFixed(2)),
                cr_amount: parseFloat(totalCRAmount.toFixed(2)),
                base_cr_amount: parseFloat(baseCRAmount.toFixed(2)),
                adv_amount: parseFloat(totalAdvAmount.toFixed(2)),
                base_adv_amount: parseFloat(baseAdvAmount.toFixed(2)),
                excess_amount: parseFloat(totalExcessAmount.toFixed(2)),
                base_excess_amount: parseFloat(baseExcessAmount.toFixed(2)),
                amount_paid: parseFloat(amountPaid.toFixed(2)),
                base_amount_paid: parseFloat(baseAmountPaid.toFixed(2)),
                balance: parseFloat(balance.toFixed(2)),
                base_balance: parseFloat(baseBalance.toFixed(2)),
            }));
        };
        calculateTotalsAndFetch();
    }, [detailList, formData.tax, formData.cr_amount, formData.adv_amount, formData.excess_amount]);

    useEffect(() => {
        const fetchAllMasterData = () => {
            fetchInvoiceInfo();
        };
        const fetchDropdownData = () => {
            loadShippingTerms();
            loadTaxGroup();
            loadCourier();
            loadInvoiceStatus();
            loadShippingStat();
            loadInvoiceType();
            loadPaymentTerms();
            loadBanks();
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
    }, [customerInvoiceId, saveType]);

    useEffect(() => {
        if (!masterList) return;

        if (!isInitialized) {
            // A more robust check to see if the form is fully initialized
            const isFormReady =
                (masterList.invoice_status_id ? !!formData.invoice_status_id : true) &&
                (masterList.shipping_stat_id ? !!formData.shipping_stat_id : true) &&
                (masterList.shipping_terms_id ? !!formData.shipping_terms_id : true) &&
                (masterList.payment_terms_id ? !!formData.payment_terms_id : true);
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
        if (masterList && shippingTermsOptions.length > 0) {
            const selectedOption = convertToSingleOption(masterList.shipping_terms_id, shippingTermsOptions);
            setFormData((prev) => ({ ...prev, shipping_terms_id: selectedOption }));
        }
    }, [masterList, shippingTermsOptions, lang]);

    useEffect(() => {
        if (masterList && shippingStatOptions.length > 0) {
            const selectedOption = convertToSingleOption(masterList.shipping_stat_id, shippingStatOptions);
            setFormData((prev) => ({ ...prev, shipping_stat_id: selectedOption }));
        }
    }, [masterList, shippingStatOptions, lang]);

    useEffect(() => {
        if (masterList && taxGroupOptions.length > 0) {
            const selectedOption = convertToSingleOption(masterList.tax, taxGroupOptions);
            setFormData((prev) => ({ ...prev, tax: selectedOption }));
        }
    }, [masterList, taxGroupOptions, lang]);

    useEffect(() => {
        if (masterList && invoiceTypeOptions.length > 0) {
            const selectedOption = convertToSingleOption(masterList.invoice_type, invoiceTypeOptions);
            setFormData((prev) => ({ ...prev, invoice_type: selectedOption }));
        }
    }, [masterList, invoiceTypeOptions, lang]);

    useEffect(() => {
        if (masterList && paymentTermsOptions.length > 0) {
            const selectedOption = convertToSingleOption(masterList.payment_terms_id, paymentTermsOptions);
            setFormData((prev) => ({ ...prev, payment_terms_id: selectedOption }));
        }
    }, [masterList, paymentTermsOptions, lang]);

    useEffect(() => {
        if (masterList && courierOptions.length > 0) {
            const selectedOption = convertToSingleOption(masterList.delivery_method_id, courierOptions);
            setFormData((prev) => ({ ...prev, delivery_method_id: selectedOption }));
        }
    }, [masterList, courierOptions, lang]);

    useEffect(() => {
        if (masterList && invoiceStatusOptions.length > 0) {
            const selectedOption = convertToSingleOption(masterList.invoice_status_id, invoiceStatusOptions);
            setFormData((prev) => ({ ...prev, invoice_status_id: selectedOption }));
        }
    }, [masterList, invoiceStatusOptions, lang]);

    // ON LOAD LIST
    useEffect(() => {
        const SupplierKey = `${tabId}-cached-customers`;
        const metaKey = `${tabId}-cached-meta-customers`;
        const mountKey = `${tabId}-mount-status-customers`;
        const isFirstMount = sessionStorage.getItem(mountKey) !== "mounted";
        if (isFirstMount) {
            sessionStorage.setItem(mountKey, "mounted");
            fetchCustomers(currentPageCustomer, itemsPerPageSupplier, searchTermCustomer);
            return;
        }
        const cachedSuppliersRaw = localStorage.getItem(SupplierKey);
        const cachedMetaRaw = localStorage.getItem(metaKey);

        if (!cachedSuppliersRaw || !cachedMetaRaw) {
            fetchCustomers(currentPageCustomer, itemsPerPageSupplier, searchTermCustomer);
            return;
        }

        try {
            const cachedMeta = JSON.parse(cachedMetaRaw);
            const cachedSuppliers = JSON.parse(cachedSuppliersRaw);

            const isCacheValid = cachedMeta.page === currentPageCustomer && cachedMeta.perPage === itemsPerPageSupplier && cachedMeta.search === searchTermCustomer;

            if (isCacheValid) {
                setCustomers(cachedSuppliers);
                setTotalPages_Customer(cachedMeta.totalPages);
                setLoading(false);
                localStorage.setItem(`${tabId}-loading-customers`, JSON.stringify(false));
                return;
            }
        } catch (err) {
            console.warn("Failed to parse cached meta:", err);
        }
        fetchCustomers(currentPageCustomer, itemsPerPageSupplier, searchTermCustomer);
    }, [currentPageCustomer, itemsPerPageSupplier, searchTermCustomer, tabId]);

    const fetchInvoiceInfo = async () => {
        try {
            const idToUse = customerInvoiceId;
            if (!idToUse) {
                setLoading(false);
                return;
            }
            setLoading(true);
            setError(null);

            const purchaseOrderInfoKey = `${idToUse}-cached-invoice-info`;
            const cachedSuppliersRaw = localStorage.getItem(purchaseOrderInfoKey);
            let foundSupplier;
            if (cachedSuppliersRaw) {
                foundSupplier = JSON.parse(cachedSuppliersRaw); // ✅ Parse cached JSON
            } else {
                foundSupplier = await invoiceService.getInvoiceInfo(idToUse); // ✅ Fetch from API
            }
            if (foundSupplier) {
                setTransDetails(foundSupplier);
                setDetailList(foundSupplier.details);
                setFormData((prev) => ({
                    ...prev,
                    customer_id: foundSupplier.customer_id || 0,
                    sales_person_id: foundSupplier.sales_person_id || 0,
                    customer_code: foundSupplier.customer_code || "",
                    so_number: foundSupplier.so_number || "",
                    invoice_no: foundSupplier.invoice_no || "",
                    account_name_en: foundSupplier.account_name_en || "",
                    account_name_cn: foundSupplier.account_name_cn || "",
                    supplier_address_en: foundSupplier.supplier_address_en || "",
                    supplier_address_cn: foundSupplier.supplier_address_cn || "",
                    billing_address_en: foundSupplier.billing_address_en || "",
                    billing_address_cn: foundSupplier.billing_address_cn || "",
                    delivery_address_en: foundSupplier.delivery_address_en || "",
                    delivery_address_cn: foundSupplier.delivery_address_cn || "",
                    sales_person_name: foundSupplier.sales_person_name || "",
                    shipping_terms_en: foundSupplier.shipping_terms_en || "",
                    shipping_terms_cn: foundSupplier.shipping_terms_cn || "",
                    shipping_stat_en: foundSupplier.shipping_stat_en || "",
                    shipping_stat_cn: foundSupplier.shipping_stat_cn || "",
                    payment_terms_en: foundSupplier.payment_terms_en || "",
                    payment_terms_cn: foundSupplier.payment_terms_cn || "",
                    currency: foundSupplier.currency || "",
                    tax: foundSupplier.tax || "",
                    ex_rate: foundSupplier.ex_rate || 0,
                    total: foundSupplier.total || 0,
                    base_total: foundSupplier.base_total || 0,
                    current_credit: foundSupplier.current_credit || 0,
                    base_current_credit: foundSupplier.base_current_credit || 0,
                    cr_amount: foundSupplier.cr_amount || 0,
                    base_cr_amount: foundSupplier.base_cr_amount || 0,
                    adv_amount: foundSupplier.adv_amount || 0,
                    base_adv_amount: foundSupplier.base_adv_amount || 0,
                    excess_amount: foundSupplier.excess_amount || 0,
                    base_excess_amount: foundSupplier.base_excess_amount || 0,
                    credit_used: foundSupplier.credit_used || 0,
                    base_credit_used: foundSupplier.base_credit_used || 0,
                    total_deposit: foundSupplier.total_deposit || 0,
                    base_total_deposit: foundSupplier.base_total_deposit || 0,
                    voucher_amount: foundSupplier.voucher_amount || 0,
                    base_voucher_amount: foundSupplier.base_voucher_amount || 0,
                    sub_total: foundSupplier.sub_total || 0,
                    base_sub_total: foundSupplier.base_sub_total || 0,
                    tax_amount: foundSupplier.tax_amount || 0,
                    base_tax_amount: foundSupplier.base_tax_amount || 0,
                    total_deduction: foundSupplier.total_deduction || 0,
                    base_total_deduction: foundSupplier.base_total_deduction || 0,
                    total_to_pay: foundSupplier.total_to_pay || 0,
                    base_total_to_pay: foundSupplier.base_total_to_pay || 0,
                    amount_paid: foundSupplier.amount_paid || 0,
                    base_amount_paid: foundSupplier.base_amount_paid || 0,
                    balance: foundSupplier.balance || 0,
                    base_balance: foundSupplier.base_balance || 0,
                    invoice_date: parseDate(foundSupplier.invoice_date),
                    delivery_date: parseDate(foundSupplier.delivery_date),
                    due_date: parseDate(foundSupplier.due_date),
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
    const fetchProducts = async (page = currentPageProduct, perPage = itemsPerPageProduct, search = "", sortId = selectedChkProducts, prodType = activeDropdownProd) => {
        try {
            // Fetch the products and pass the sortId
            const paginatedData = await invoiceService.getAllSOProducts(page, perPage, search, sortId, prodType);
            setProducts(paginatedData.data);
            setTotalPages_Products(paginatedData.last_page);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to fetch products");
            console.error("Error fetching products:", err);
        }
    };
    const fetchCustomers = async (page = currentPageCustomer, perPage = itemsPerPageSupplier, search = "") => {
        try {
            setError(null);
            localStorage.setItem(`${tabId}-loading-customers`, JSON.stringify(true));
            const paginatedData = await customerService.getAllCustomer(page, perPage, search);
            setCustomers(paginatedData.data);
            setTotalPages_Customer(paginatedData.last_page);
            localStorage.setItem(`${tabId}-cached-customers`, JSON.stringify(paginatedData.data));
            localStorage.setItem(
                `${tabId}-cached-meta-customers`,
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
            localStorage.setItem(`${tabId}-loading-customers`, JSON.stringify(false));
        }
    };
    const updateCachedRaw = async (cachedType: string, masterId: number) => {
        if (cachedType === "info") {
            const newData = await invoiceService.getInvoiceInfo(masterId);
            if (newData) {
                localStorage.setItem(`${masterId}-cached-invoice-info`, JSON.stringify(newData));
            }
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
    const loadTaxGroup = async () => {
        try {
            const list = await fetchTaxGroup(); // fetches & returns
            setTaxGroupData(list ?? []); // ✅ manually set state here
        } catch (err) {
            console.error("Failed to fetch loadTaxGroup:", err);
        }
    };
    const loadCourier = async () => {
        try {
            const list = await fetchCourier(); // fetches & returns
            setCourier(list ?? []); // ✅ manually set state here
        } catch (err) {
            console.error("Failed to fetch loadCourier:", err);
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
    const loadShippingStat = async () => {
        try {
            const list = await fetchShippingStat(); // fetches & returns
            setAllShippingStat(list ?? []); // ✅ manually set state here
        } catch (err) {
            console.error("Failed to fetch loadShippingStat:", err);
        }
    };
    const loadInvoiceType = async () => {
        try {
            const list = await fetchInvoiceType(); // fetches & returns
            setInvoiceTypeData(list ?? []); // ✅ manually set state here
        } catch (err) {
            console.error("Failed to fetch loadInvoiceType:", err);
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
    const handleSave = async () => {
        setLoadingSave(true);
        const data = new FormData();
        const customer_code = formData["customer_code"]?.toString().trim() ?? "";
        if (detailList.length === 0) {
            showErrorToast(translations["Detail(s) Required"]);
            setLoadingSave(false); // Enable button again
            return;
        }
        if (!customer_code || customer_code === "") {
            showErrorToast(translations["Customer Account Code is Required"]);
            setLoadingSave(false); // Enable button again
            return;
        }
        let cnt_products = 0;
        let is_price_zero = 0;
        let is_qty_zero = 0;
        let product_ids: any = [];
        detailList.forEach((list) => {
            if (list) {
                if (list.product_code.length > 3) {
                    data.append(
                        "details[]",
                        JSON.stringify({
                            id: list.id,
                            qty: list.qty,
                            price: list.price,
                            total: list.total,
                            currency: list.currency,
                            deposit: list.deposit,
                            is_deleted: list.is_deleted,
                            service_id: list.service_id,
                            product_id: list.product_id,
                            item_cost: list.item_cost,
                            particular: list.particular,
                            warehouse: list.warehouse,
                            alloc_type: list.alloc_type,
                            order_id: list.order_id,
                            grn_detail_id: list.grn_detail_id,
                            grn_no: list.grn_no,
                            allocated_id: list.allocated_id,
                            product_type: list.product_type,
                            delete_type: list.delete_type,
                        })
                    );
                    if (list.is_deleted === 0 && list.product_type === 0) {
                        cnt_products = 1;
                    }
                    if (list.is_deleted === 0 && list.product_type === 0 && list.id === 0) {
                        product_ids.push(list.product_id);
                    }
                    if (list.price === 0) {
                        is_price_zero++;
                    }
                    if (list.qty === 0) {
                        is_qty_zero++;
                    }
                }
            }
        });
        if (is_price_zero > 0) {
            showErrorToast(translations["Price is Required"]);
            return;
        }
        if (is_qty_zero > 0) {
            showErrorToast(translations["Quantity is Required"]);
            return;
        }
        data.append("cnt_products", cnt_products.toString());
        data.append("product_ids", JSON.stringify(product_ids));
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
            const result = await invoiceService.updateCustomerInvoice(customerInvoiceId, data);
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
                onChangeCustomerInvoiceId(newId);
                onChangeSaveType("edit");
            }
            // Reset state to allow re-initialization after refetch
            setIsDirty(false);
            setIsInitialized(false);
            await updateCachedRaw("info", newId);
            fetchInvoiceInfo();
            selectedPurchaseOrder([]);
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
        onChangeCustomerInvoiceId(0);
        onChangeSaveType("new");
        clearForms(invoiceTypeOptions);
        setIsDirty(false);
    };
    const handleCreateRV = async () => {
        setFormDataRV((prev) => ({
            ...prev,
            currency: String(formData.currency),
            balance_to_pay: Number(formData.balance),
            current_credit: Number(formData.current_credit),
            credit_used: 0,
            received_amount: 0,
            customer_id: Number(formData.customer_id),
            customer_code: String(formData.customer_code),
            invoice_nos: [
                {
                    invoice_no: String(formData.invoice_no),
                    receive_amount: 0,
                    invoice_id: customerInvoiceId,
                },
            ],
        }));
        setShowCreateRV(true);
    };
    const handleSubmitRV = async () => {
        setLoadingSave(true);
        const data = new FormData();
        const bank = formDataRV["bank"]?.toString().trim() ?? "";
        const received_amount = formDataRV["received_amount"]?.toString().trim() ?? 0;
        if (!bank) {
            showErrorToast(translations["Bank is required"]);
            setLoadingSave(false); // Enable button again
            return;
        }
        if (Number(received_amount) === 0) {
            showErrorToast(translations["alert_message_141"]);
            setLoadingSave(false); // Enable button again
            return;
        }
        data.append("customer_id", formDataRV.customer_id.toString());
        data.append("balance_to_pay", formDataRV.balance_to_pay.toString());
        data.append("received_amount", formDataRV.received_amount.toString());
        data.append("currency", formDataRV.currency.toString());
        data.append("bank", (formDataRV.bank as OptionType).value);
        data.append("rv_date", formDataRV.rv_date ? formatDateToCustom(formDataRV.rv_date) : "");
        formDataRV.invoice_nos.forEach((element) => {
            data.append(
                "invoice_nos[]",
                JSON.stringify({
                    invoice_no: element.invoice_no,
                    receive_amount: element.receive_amount,
                })
            );
        });
        try {
            const result = await invoiceService.createReceiveVoucher(data);
            if (result.token === "Error") {
                showErrorToast(result.message);
                return;
            }
            if (result.token === "Warning") {
                showErrorToast(translations[result.message]);
                return;
            }
            setIsDirty(false);
            setIsInitialized(false);
            await updateCachedRaw("info", customerInvoiceId);
            fetchInvoiceInfo();
            selectedPurchaseOrder([]);
            setShowCreateRV(false);
            showSuccessToast(translations[result.message]);
        } catch (error) {
            setLoadingSave(false);
            showErrorToast(translations["Failed to save Transaction."] || "Failed to save Transaction.");
        } finally {
            setLoadingSave(false); // Enable button again after the operation is done
        }
    };
    const handleAddProduct = async () => {
        setShowProducts(false);
        switch (ageType) {
            case "new":
                // ✅ Remove placeholder row if id = 0
                setDetailList((prev) => prev.filter((item) => !(item.indexInt === globalIndex && item.id === 0)));
                let newIndex = Math.max(0, ...detailList.map((e) => e.indexInt)) + 1;
                for (const element of selectedChkProducts) {
                    try {
                        const list = products.find((product) => product.id === element);
                        const description_en = list?.product_title_en;
                        const description_cn = list?.product_title_cn;
                        const onProduct = await invoiceService.getPriceOnProduct(formData.customer_id, Number(list?.new_qty), list?.product_id);
                        const order_qty = onProduct.order_qty;
                        const order_id = onProduct.order_id;
                        const grn_detail_id = onProduct.grn_detail_id;
                        const grn_no = onProduct.grn_no;
                        let new_order_id = 0;
                        let new_alloc_type = "";
                        if (order_qty > 0) {
                            if (order_qty != list?.new_qty) {
                                new_alloc_type = "";
                                new_order_id = 0;
                            } else {
                                new_alloc_type = "";
                                new_order_id = order_id;
                            }
                        } else {
                            new_alloc_type = "Manual";
                            new_order_id = 0;
                        }
                        const total = Number(list?.["new_qty"]) * Number(onProduct.price);
                        const newData: DetailsRow = {
                            id: 0,
                            product_code: list?.product_code,
                            product_title_en: description_en,
                            product_title_cn: description_cn,
                            currency: formData.currency,
                            deposit: 0,
                            indexInt: newIndex,
                            is_deleted: 0,
                            service_id: 0,
                            product_id: list?.product_id || 0,
                            item_cost: list?.item_cost || 0,
                            age_type: "new",
                            particular: "",
                            qty: list?.new_qty || 0,
                            price: onProduct.price,
                            total: total,
                            warehouse: list?.warehouse,
                            alloc_type: new_alloc_type,
                            order_id: new_order_id,
                            grn_detail_id: grn_detail_id,
                            grn_no: grn_no,
                            allocated_id: 0,
                            product_type: 0,
                            inventory_qty: list?.qty || 0,
                            delete_type: "",
                            rv_date: "",
                            rv_number: "",
                            amount: 0,
                        };
                        setShowProducts(false);
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
    const handleSelectCustomer = (id: number, checked: boolean) => {
        if (checked) {
            selectedPurchaseOrder((prev) => [...prev, id]);
        } else {
            selectedPurchaseOrder((prev) => prev.filter((pid) => pid !== id));
        }
    };
    const handleSODateChange = useCallback((dates: Date[]) => {
        setFormData((prev) => ({ ...prev, invoice_date: dates[0] ?? null }));
        setIsDirty(true); // ✅ only if user is editing
    }, []);
    const handleDeliveryDateChange = useCallback((dates: Date[]) => {
        setFormData((prev) => ({ ...prev, delivery_date: dates[0] ?? null }));
        setIsDirty(true); // ✅ only if user is editing
    }, []);
    const handleDueDateChange = useCallback((dates: Date[]) => {
        setFormData((prev) => ({ ...prev, due_date: dates[0] ?? null }));
        setIsDirty(true); // ✅ only if user is editing
    }, []);
    const handleAddRow = () => {
        const newId = Math.floor(10000 + Math.random() * 90000);
        const newData: DetailsRow = {
            id: 0,
            product_code: "",
            product_title_en: "",
            product_title_cn: "",
            currency: "",
            deposit: 0,
            indexInt: newId,
            is_deleted: 0,
            service_id: 0,
            product_id: 0,
            item_cost: 0,
            age_type: "new",
            particular: "",
            qty: 0,
            price: 0,
            total: 0,
            warehouse: "",
            alloc_type: "",
            order_id: 0,
            grn_detail_id: 0,
            grn_no: "",
            allocated_id: 0,
            product_type: 0,
            inventory_qty: 0,
            delete_type: "",
            rv_date: "",
            rv_number: "",
            amount: 0,
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
        const selectedItems = detailList.filter((list) => selectedDetails.includes(list.indexInt));
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
        let order_ids: any = [];
        let selected_items: any = [];
        selectedItems.forEach((element) => {
            if (element.product_type === 0) {
                order_ids.push(element.order_id);
                selected_items.push({
                    product_code: element.product_code,
                    product_title_en: element.product_title_en,
                    product_title_cn: element.product_title_cn,
                });
            }
        });
        let totalDeposit = 0;
        try {
            const deposit = await invoiceService.getPaidAmounts(order_ids);
            totalDeposit += deposit ?? 0;
        } catch (err) {
            console.error("Error fetching deposit:", err);
        }
        if (totalDeposit > 0) {
            setCancelType("checkbox");
            setShowCancelOrder(true);
        }
    };
    const handleDetailChange = (indexInt: number, value: string, column: string) => {
        setDetailList((prev) =>
            prev.map((item) => {
                if (item.indexInt === indexInt) {
                    const updatedItem: any = { ...item };
                    // Convert value to number if it's a numeric field
                    const qty = parseFloat(column === "qty" ? value : String(updatedItem.qty)) || 0;
                    const price = parseFloat(column === "price" ? value : String(updatedItem.price)) || 0;
                    const inventory_qty = parseFloat(column === "inventory_qty" ? value : String(updatedItem.inventory_qty)) || 0;
                    const product_type = parseFloat(column === "product_type" ? value : String(updatedItem.product_type)) || 0;
                    if (column === "qty" || column === "price" || column === "deposit") {
                        updatedItem[column] = parseFloat(value) || 0;
                    } else {
                        updatedItem[column] = value;
                    }
                    if (column === "qty") {
                        if (Number(value) > Number(inventory_qty) && Number(product_type) === 0) {
                            updatedItem[column] = inventory_qty;
                            showErrorToast(translations["Remaining quantity is"] + " " + inventory_qty);
                        }
                    }
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
    const handleEnterKey = async (indexInt: number, value: string, column: string, ageType: string) => {
        switch (column) {
            case "product_code":
                try {
                    setGlobalIndex(indexInt);
                    setAgeType(ageType);
                    const res = await invoiceService.getProductOnProductCode(value, formData.customer_id);
                    if (res.token === "ProductNotExists") {
                        setSelectedProducts([]);
                        setShowProducts(true);
                        return;
                    }
                    if (res.token === "MultipleProducts") {
                        setSelectedProducts([]);
                        setShowProducts(true);
                        return;
                    }
                    setDetailList((prev) =>
                        prev.map((item) => {
                            if (item.indexInt === indexInt) {
                                const updatedItem: any = { ...item };
                                updatedItem["product_id"] = res.list.product_id;
                                updatedItem["product_code"] = res.list.product_code;
                                updatedItem["product_title_en"] = res.list.product_title_en;
                                updatedItem["product_title_cn"] = res.list.product_title_cn;
                                updatedItem["price"] = res.list.price;
                                updatedItem["qty"] = res.list.qty;
                                updatedItem["total"] = res.list.qty * res.list.price;
                                updatedItem["grn_detail_id"] = res.list.grn_detail_id;
                                updatedItem["grn_no"] = res.list.grn_no;
                                updatedItem["deposit"] = res.list.item_deposit;
                                updatedItem["alloc_type"] = res.list.alloc_type;
                                updatedItem["order_id"] = res.list.order_id;
                                updatedItem["item_cost"] = res.list.item_cost;
                                updatedItem["inventory_qty"] = res.list.inventory_qty;
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
            case "customer_code":
                const res = await invoiceService.getCustomerInfoByCode(value, "enter");
                console.log(res);
                if (res.token === "CustomerNotExists") {
                    setShowCustomers(true);
                    return;
                }
                if (res.token === "MultipleCustomer") {
                    setShowCustomers(true);
                    return;
                }
                if (res.list.existsSOID > 0) {
                    onChangeCustomerInvoiceId(res.list.existsSOID);
                    onChangeSaveType("edit");
                    setShowCustomers(false);
                    return;
                }
                const selectedShippingTerms = convertToSingleOption(1, shippingTermsOptions);
                const selectedPaymentTerms = convertToSingleOption(1, paymentTermsOptions);
                const selectedShippingStat = convertToSingleOption(1, shippingStatOptions);
                const selectedTax = convertToSingleOption(res.list.tax_group, taxGroupOptions);
                const selectedDeliveryMethod = convertToSingleOption(res.list.preferred_shipping_id, courierOptions);
                setFormData((prev) => ({
                    ...prev,
                    customer_id: res.list.customer_id,
                    customer_code: res.list.customer_code,
                    account_name_en: res.list.account_name_en,
                    account_name_cn: res.list.account_name_cn,
                    billing_address_en: res.list.billing_address_en,
                    billing_address_cn: res.list.billing_address_cn,
                    delivery_address_en: res.list.delivery_address_en,
                    delivery_address_cn: res.list.delivery_address_cn,
                    currency: res.list.currency,
                    ex_rate: res.list.ex_rate,
                    sales_person_id: res.list.sales_person_id,
                    sales_person_name: res.list.sales_person_name,
                    shipping_terms_id: selectedShippingTerms,
                    shipping_stat_id: selectedShippingStat,
                    payment_terms_id: selectedPaymentTerms,
                    delivery_method_id: selectedDeliveryMethod,
                    tax: selectedTax,
                }));
                setDetailList([]);
                break;
        }
    };
    const handlPopupProducts = (indexInt: number, ageType: string, productId: number) => {
        setGlobalIndex(indexInt);
        setAgeType(ageType);
        setShowProducts(true);
        setSelectedProducts([]);
        setActiveDropdownProd(!productId && productId != 0 ? "Services" : "Products");
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
    const handleVoid = async () => {
        const data = new FormData();
        data.append("details[]", JSON.stringify({ invoice_no: formData.invoice_no }));
        const result = await invoiceService.getDepositPaid(data);
        if (result.deposit > 0) {
            setSOOrderIds(result.idsArr);
            setShowCancelOrder(true);
            setCancelType("button");
            return;
        }
        const confirmed = await showConfirm(translations["Void Record(s)"], translations["alert_message_38"], translations["Yes"], translations["Cancel"]);
        if (!confirmed) return;
        try {
            const result = await invoiceService.voidSingleInvoice(data);
            if (result.token === "Error") {
                showErrorToast(result.message);
                return;
            }
            setSOOrderIds([]);
            showSuccessToast(translations[result.message]);
        } catch (error) {}
    };
    const handleSaveCancelOrder = async (type: string) => {
        if (cancelType === "button") {
            if (type === "CTOCUST") {
                setLoadCancelOrder_CTOCUST(true);
            }
            if (type === "NRTOMI") {
                setLoadCancelOrder_NRTOMI(true);
            }
            if (type === "RPTOC") {
                setLoadCancelOrder_RPTOC(true);
            }
            if (type === "PRTCNL") {
                setLoadCancelOrder_PRTCNL(true);
            }
            let row_arrays: any = [];
            SOOrderIds.forEach((list: any) => {
                if (list) {
                    row_arrays.push(list);
                }
            });
            try {
                const result = await invoiceService.cancelDepositPaid(row_arrays, type, "full");
                if (result.token === "Error") {
                    setLoadCancelOrder_CTOCUST(false);
                    setLoadCancelOrder_NRTOMI(false);
                    setLoadCancelOrder_RPTOC(false);
                    setLoadCancelOrder_PRTCNL(false);
                    showErrorToast(result.message);
                    return;
                }
                setShowCancelOrder(false);
                setLoadCancelOrder_CTOCUST(false);
                setLoadCancelOrder_NRTOMI(false);
                setLoadCancelOrder_RPTOC(false);
                setLoadCancelOrder_PRTCNL(false);
                showSuccessToast(translations[result.message]);
            } catch (err) {
                setLoadCancelOrder_CTOCUST(false);
                setLoadCancelOrder_NRTOMI(false);
                setLoadCancelOrder_RPTOC(false);
                setLoadCancelOrder_PRTCNL(false);
                showErrorToast(translations["alert_message_18"]);
            }
        } else {
            selectedDetails.forEach((paraIndex) => {
                setDetailList((prev) =>
                    prev.map((item) =>
                        item.indexInt === paraIndex
                            ? {
                                  ...item,
                                  delete_type: type,
                              }
                            : item
                    )
                );
            });
            setShowCancelOrder(false);
            selectedPurchaseOrder([]);
        }
    };
    const handleRowClick_Customer = async (e: React.MouseEvent, tableId: number) => {
        // Prevent navigation if clicking on checkboxes or toggle switches
        const target = e.target as HTMLElement;
        if (target.closest("input") || target.closest("label") || target.closest("[data-copy-button]")) {
            return;
        }
        const supplierListKey = `${tabId}-cached-customers`;
        const cachedSuppliersRaw = localStorage.getItem(supplierListKey);
        let rawDataCached: ApiCustomer[] | null = null;
        if (cachedSuppliersRaw) {
            try {
                rawDataCached = JSON.parse(cachedSuppliersRaw);
            } catch (error) {
                console.error("Error parsing cached customer data", error);
            }
        }
        const specificItem = rawDataCached?.find((item: ApiCustomer) => item.id === tableId);
        const customer_code = specificItem?.customer_code?.toString();
        const res = await invoiceService.getCustomerInfoByCode(String(customer_code), "click");
        if (res.token === "CustomerNotExists") {
            showErrorToast(translations[res.message]);
            return;
        }
        const selectedShippingTerms = convertToSingleOption(1, shippingTermsOptions);
        const selectedPaymentTerms = convertToSingleOption(1, paymentTermsOptions);
        const selectedTax = convertToSingleOption(1, taxGroupOptions);
        if (res.list.existsSOID > 0) {
            onChangeCustomerInvoiceId(res.list.existsSOID);
            onChangeSaveType("edit");
            fetchInvoiceInfo();
            setShowCustomers(false);
            return;
        }
        const selectedShippingStat = convertToSingleOption(1, shippingStatOptions);
        setFormData((prev) => ({
            ...prev,
            customer_id: res.list.customer_id,
            customer_code: res.list.customer_code,
            account_name_en: res.list.account_name_en,
            account_name_cn: res.list.account_name_cn,
            billing_address_en: res.list.billing_address_en,
            billing_address_cn: res.list.billing_address_cn,
            delivery_address_en: res.list.delivery_address_en,
            delivery_address_cn: res.list.delivery_address_cn,
            currency: res.list.currency,
            ex_rate: res.list.ex_rate,
            sales_person_id: res.list.sales_person_id,
            sales_person_name: res.list.sales_person_name,
            shipping_terms_id: selectedShippingTerms,
            shipping_stat_id: selectedShippingStat,
            payment_terms_id: selectedPaymentTerms,
            tax: selectedTax,
        }));
        setDetailList([]);
        setShowCustomers(false);
    };
    const handleRowClick_Service = (e: React.MouseEvent, serviceId: number) => {
        // Prevent navigation if clicking on checkboxes or toggle switches
        const target = e.target as HTMLElement;
        if (target.closest("input") || target.closest("label") || target.closest("[data-copy-button]")) {
            return;
        }
        if (activeDropdownProd === "Services") {
            const list = products.find((product) => product.id === serviceId);
            setDetailList((prev) => prev.filter((item) => !(item.indexInt === globalIndex && item.id === 0)));
            let newIndex = Math.max(0, ...detailList.map((e) => e.indexInt)) + 1;
            const description_en = list?.product_title_en;
            const description_cn = list?.product_title_cn;
            const particular = lang === "en" ? description_en : description_cn;
            const newData: DetailsRow = {
                id: 0,
                product_code: list?.product_code,
                product_title_en: description_en,
                product_title_cn: description_cn,
                currency: formData.currency,
                deposit: 0,
                indexInt: newIndex,
                is_deleted: 0,
                service_id: list?.id || 0,
                product_id: 0,
                item_cost: 0,
                age_type: "new",
                particular: particular,
                qty: 1,
                price: 0,
                total: 0,
                warehouse: "",
                alloc_type: "",
                order_id: 0,
                grn_detail_id: 0,
                grn_no: "",
                allocated_id: 0,
                inventory_qty: 0,
                product_type: 1,
                delete_type: "",
                rv_date: "",
                rv_number: "",
                amount: 0,
            };
            setShowProducts(false);
            setDetailList((prev) => [...prev, newData]);
        }
    };
    const handleCreditDetails = async () => {
        const data = new FormData();
        data.append("customer_id", String(formData.customer_id));
        data.append("currency", String(formData.currency));
        const result = await invoiceService.doGetCreditDetail(data);
        setSelectedCredits(result);
    };
    const handleSubmitCredit = () => {
        let adv_amount = 0;
        let cr_amount = 0;
        let excess_amount = 0;
        selectedForCredits.forEach((element) => {
            const new_amount = Number(element.new_amount) || 0;
            if (new_amount > 0) {
                if (element.account_code === "21312") {
                    adv_amount = new_amount;
                }
                if (element.account_code === "21313") {
                    cr_amount = new_amount;
                }
                if (element.account_code === "21602") {
                    cr_amount = new_amount;
                }
                if (element.account_code === "21310") {
                    excess_amount = new_amount;
                }
            }
        });

        setFormData((prev) => ({
            ...prev,
            cr_amount: parseFloat(cr_amount.toFixed(2)),
            adv_amount: parseFloat(adv_amount.toFixed(2)),
            excess_amount: parseFloat(excess_amount.toFixed(2)),
        }));
        setShowCreditsPopup(false);
    };
    const handleDateRV = useCallback((dates: Date[]) => {
        setFormDataRV((prev) => ({ ...prev, rv_date: dates[0] ?? null }));
    }, []);
    const loadBanks = async () => {
        try {
            const list = await fetchBank(); // fetches & returns
            setBanksData(list ?? []); // ✅ manually set state here
        } catch (err) {
            console.error("Failed to fetch loadBanks:", err);
        }
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
                                    <div className="flex items-center gap-4 mb-2">
                                        <label className="w-[25%] text-gray-400 text-sm text-right">{translations["Customer Code"]}</label>
                                        <div className="flex flex-1">
                                            <input
                                                type="text"
                                                value={formData.customer_code}
                                                onChange={(e) => {
                                                    const value = e.target.value;
                                                    setFormData((prev) => ({ ...prev, customer_code: value }));
                                                    setIsDirty(true);
                                                }}
                                                onKeyDown={(e) => {
                                                    if (e.key === "Enter") {
                                                        handleEnterKey(0, formData.customer_code, "customer_code", "");
                                                    }
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
                                    <div className="flex items-center space-x-4 mb-2">
                                        <label className="w-[25%] text-gray-400 text-sm text-right">{translations["Customer Name"]}</label>
                                        <input
                                            type="text"
                                            hidden={lang === "cn"}
                                            readOnly
                                            value={formData.account_name_en}
                                            onChange={(e) => {
                                                const value = e.target.value;
                                                setFormData((prev) => ({ ...prev, account_name_en: value }));
                                                setIsDirty(true);
                                            }}
                                            className="flex-1 px-3 py-2 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm"
                                        />
                                        <input
                                            type="text"
                                            hidden={lang === "en"}
                                            readOnly
                                            value={formData.account_name_cn}
                                            onChange={(e) => {
                                                const value = e.target.value;
                                                setFormData((prev) => ({ ...prev, account_name_cn: value }));
                                                setIsDirty(true);
                                            }}
                                            className="flex-1 px-3 py-2 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm"
                                        />
                                    </div>
                                    <div className="flex items-center space-x-4 mb-2">
                                        <label className="w-[26%] text-gray-400 text-sm text-right">{translations["Delivery Method"]}</label>
                                        <Select
                                            classNamePrefix="react-select"
                                            value={formData.delivery_method_id ?? null}
                                            onChange={async (selected) => {
                                                setFormData({ ...formData, delivery_method_id: selected as OptionType | null });
                                                setIsDirty(true); // ✅ only if user is editing
                                            }}
                                            options={courierOptions}
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
                                            value={formData.billing_address_en}
                                            onChange={(e) => {
                                                const value = e.target.value;
                                                setFormData((prev) => ({ ...prev, billing_address_en: value }));
                                                setIsDirty(true);
                                            }}
                                            className="flex-1 px-3 py-2 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm"
                                        />
                                        <textarea
                                            rows={3}
                                            hidden={lang === "en"}
                                            readOnly
                                            value={formData.billing_address_cn}
                                            onChange={(e) => {
                                                const value = e.target.value;
                                                setFormData((prev) => ({ ...prev, billing_address_cn: value }));
                                                setIsDirty(true);
                                            }}
                                            className="flex-1 px-3 py-2 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm"
                                        />
                                    </div>
                                </div>
                                <div className="col-span-12 md:col-span-4">
                                    <div className="flex items-center space-x-4 mb-2">
                                        <label className="w-[26%] text-gray-400 text-sm text-right">{translations["Tax"]}</label>
                                        <Select
                                            classNamePrefix="react-select"
                                            value={formData.tax ?? null}
                                            onChange={async (selected) => {
                                                setFormData({ ...formData, tax: selected as OptionType | null });
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
                                    <div className="flex items-center space-x-4 mb-2">
                                        <label className="w-[25%] text-gray-400 text-sm text-right">{translations["Sales Person"]}</label>
                                        <input
                                            type="text"
                                            hidden={lang === "cn"}
                                            readOnly
                                            value={formData.sales_person_name}
                                            onChange={(e) => {
                                                const value = e.target.value;
                                                setFormData((prev) => ({ ...prev, sales_person_name: value }));
                                                setIsDirty(true);
                                            }}
                                            className="flex-1 px-3 py-2 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm"
                                        />
                                    </div>
                                    <div className="flex items-center space-x-4 mb-2">
                                        <label className="w-[26%] text-gray-400 text-sm text-right">{translations["Shipping Status"]}</label>
                                        <Select
                                            classNamePrefix="react-select"
                                            value={formData.shipping_stat_id ?? null}
                                            onChange={async (selected) => {
                                                setFormData({ ...formData, shipping_stat_id: selected as OptionType | null });
                                                setIsDirty(true); // ✅ only if user is editing
                                            }}
                                            options={shippingStatOptions}
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
                                            value={formData.payment_terms_id ?? null}
                                            onChange={async (selected) => {
                                                setFormData({ ...formData, payment_terms_id: selected as OptionType | null });
                                                setIsDirty(true); // ✅ only if user is editing
                                            }}
                                            options={paymentTermsOptions}
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
                                        <label className="w-[26%] text-gray-400 text-sm text-right">{translations["Shipping Terms"]}</label>
                                        <Select
                                            classNamePrefix="react-select"
                                            value={formData.shipping_terms_id ?? null}
                                            onChange={async (selected) => {
                                                setFormData({ ...formData, shipping_terms_id: selected as OptionType | null });
                                                setIsDirty(true); // ✅ only if user is editing
                                            }}
                                            options={shippingTermsOptions}
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
                                        <label className="w-[25%] text-gray-400 text-sm text-right">{translations["Invoice No"]}</label>
                                        <input
                                            value={formData.invoice_no}
                                            readOnly
                                            onChange={(e) => {
                                                const value = e.target.value;
                                                setFormData((prev) => ({ ...prev, invoice_no: value }));
                                                setIsDirty(true);
                                            }}
                                            className="flex-1 px-3 py-2 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm"
                                        />
                                    </div>
                                    <div className="flex items-center space-x-4 mb-2">
                                        <label className="w-[25%] text-gray-400 text-sm text-right">{translations["SO Number"]}</label>
                                        <input
                                            value={formData.so_number}
                                            readOnly
                                            onChange={(e) => {
                                                const value = e.target.value;
                                                setFormData((prev) => ({ ...prev, so_number: value }));
                                                setIsDirty(true);
                                            }}
                                            className="flex-1 px-3 py-2 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm"
                                        />
                                    </div>
                                    <div className="flex items-center space-x-4 mb-2">
                                        <label className="w-[25%] text-gray-400 text-sm text-right">{translations["AR Date"]}</label>
                                        <Flatpickr
                                            onChange={handleSODateChange}
                                            options={{
                                                dateFormat: "M d Y",
                                                defaultDate: formData.invoice_date || undefined,
                                                allowInput: true,
                                                locale: locale,
                                            }}
                                            className="flex-1 px-3 py-2 border-[1px] border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm"
                                        />
                                    </div>
                                    <div className="flex items-center space-x-4 mb-2">
                                        <label className="w-[26%] text-gray-400 text-sm text-right">{translations["Invoice Status"]}</label>
                                        <Select
                                            classNamePrefix="react-select"
                                            value={formData.invoice_status_id ?? null}
                                            onChange={async (selected) => {
                                                setFormData({ ...formData, invoice_status_id: selected as OptionType | null });
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
                                    <div className="flex items-center space-x-4 mb-2">
                                        <label className="w-[26%] text-gray-400 text-sm text-right">{translations["Invoice Type"]}</label>
                                        <Select
                                            classNamePrefix="react-select"
                                            value={formData.invoice_type ?? null}
                                            onChange={async (selected) => {
                                                setFormData({ ...formData, invoice_type: selected as OptionType | null });
                                                setIsDirty(true); // ✅ only if user is editing
                                            }}
                                            options={invoiceTypeOptions}
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
                                        <label className="w-[25%] text-gray-400 text-sm text-right">{translations["Delivery Date"]}</label>
                                        <Flatpickr
                                            onChange={handleDeliveryDateChange}
                                            options={{
                                                dateFormat: "M d Y",
                                                defaultDate: formData.delivery_date || undefined,
                                                allowInput: true,
                                                locale: locale,
                                            }}
                                            className="flex-1 px-3 py-2 border-[1px] border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm"
                                        />
                                    </div>
                                    <div className="flex items-center space-x-4 mb-2">
                                        <label className="w-[25%] text-gray-400 text-sm text-right">{translations["Due Date"]}</label>
                                        <Flatpickr
                                            onChange={handleDueDateChange}
                                            options={{
                                                dateFormat: "M d Y",
                                                defaultDate: formData.due_date || undefined,
                                                allowInput: true,
                                                locale: locale,
                                            }}
                                            className="flex-1 px-3 py-2 border-[1px] border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm"
                                        />
                                    </div>
                                </div>
                            </fieldset>
                            <fieldset className="grid grid-cols-12 gap-4 border-[1px] border-[#ffffff1a] rounded-lg p-4 mb-2">
                                <div className="col-span-12 md:col-span-12 table-layout">
                                    <table className="w-full border border-gray-600 border-collapse text-sm text-left">
                                        <thead className="sticky top-0 z-[1] py-1 px-4" style={{ backgroundColor: "#1f2132" }}>
                                            <tr className="border-b" style={{ borderColor: "#2d2d30" }}>
                                                <th className="w-[2%] text-left py-1 px-2 text-gray-400 text-sm w-12 border border-[#40404042]">
                                                    <div className="flex items-center h-full">
                                                        <CustomCheckbox
                                                            disabled={masterList?.invoice_status_id != 2}
                                                            checked={selectedDetails.length === detailList?.length && detailList?.length > 0}
                                                            onChange={(checked) => handleSelectAll(checked)}
                                                        />
                                                    </div>
                                                </th>
                                                <th className="w-[2%] text-left py-1 px-2 text-gray-400 text-sm w-12 border border-[#40404042]">
                                                    <div className="relative group inline-block">
                                                        <button
                                                            type="button"
                                                            onClick={handleAddRow}
                                                            disabled={masterList?.invoice_status_id != 2}
                                                            className="px-1 py-1 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-xs"
                                                        >
                                                            <Plus className="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                </th>
                                                <th className="w-[2%] text-left py-1 px-2 text-gray-400 text-sm w-12 border border-[#40404042]"></th>
                                                <th className="w-[14%] text-left py-1 px-2 text-gray-400 text-sm w-12 border border-[#40404042]">{translations["Product Code"]}</th>
                                                <th className="w-[30%] text-left py-1 px-2 text-gray-400 text-sm w-12 border border-[#40404042]">{translations["Product Name"]}</th>
                                                <th className="w-[10%] text-center py-1 px-2 text-gray-400 text-sm w-12 border border-[#40404042]">{translations["Deposit"]}</th>
                                                <th className="w-[10%] text-center py-1 px-2 text-gray-400 text-sm w-12 border border-[#40404042]">{translations["Qty"]}</th>
                                                <th className="w-[10%] text-center py-1 px-2 text-gray-400 text-sm w-12 border border-[#40404042]">{translations["Price"]}</th>
                                                <th className="w-[10%] text-center py-1 px-2 text-gray-400 text-sm w-12 border border-[#40404042]">{translations["Currency"]}</th>
                                                <th className="w-[10%] text-center py-1 px-2 text-gray-400 text-sm w-12 border border-[#40404042]">{translations["Total"]}</th>
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
                                                                <td className="py-2 px-2 text-gray-400 text-left text-custom-sm border border-[#40404042]">
                                                                    <CustomCheckbox
                                                                        checked={selectedDetails.includes(item.indexInt as number)}
                                                                        disabled={masterList?.invoice_status_id != 2}
                                                                        onChange={(checked) => handleSelectCustomer(item.indexInt as number, checked)}
                                                                    />
                                                                </td>
                                                                <td className="py-2 px-2 text-gray-400 text-left text-custom-sm border border-[#40404042]">
                                                                    <div className="relative group inline-block">
                                                                        <button
                                                                            type="button"
                                                                            disabled={masterList?.invoice_status_id != 2}
                                                                            onClick={() => handleRemoveRow()}
                                                                            className="px-1 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-xs"
                                                                        >
                                                                            <X className="h-4 w-4" />
                                                                        </button>
                                                                    </div>
                                                                </td>
                                                                <td className="py-2 px-2 text-gray-400 text-left text-custom-sm border border-[#40404042]">
                                                                    <div className="relative group inline-block">
                                                                        <button
                                                                            type="button"
                                                                            disabled={masterList?.invoice_status_id != 2 || item.age_type === "old"}
                                                                            onClick={() => handlPopupProducts(item.indexInt, item.age_type, item.product_id)}
                                                                            className="px-1 py-1 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors text-xs"
                                                                        >
                                                                            <Search className="h-4 w-4" />
                                                                        </button>
                                                                    </div>
                                                                </td>
                                                                <td className="py-0 px-0 text-gray-400 text-left text-custom-sm border border-[#40404042]">
                                                                    <input
                                                                        type="text"
                                                                        value={item.product_code}
                                                                        readOnly={masterList?.invoice_status_id != 2}
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
                                                                        readOnly={item.service_id === 0 || masterList?.invoice_status_id != 2}
                                                                        onChange={(e) => {
                                                                            const value = e.target.value;
                                                                            if (item.service_id > 0) {
                                                                                handleDetailChange(item.indexInt, value, "particular");
                                                                            }
                                                                        }}
                                                                        value={item.service_id > 0 ? item.particular : lang === "en" ? item.product_title_en : item.product_title_cn}
                                                                        className="w-full px-3 py-1.5 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-sm rounded"
                                                                    />
                                                                </td>
                                                                <td className="py-0 px-0 text-gray-400 text-center text-custom-sm border border-[#40404042]">
                                                                    <input
                                                                        type="text"
                                                                        value={item.deposit}
                                                                        readOnly={masterList?.invoice_status_id != 2 || item.service_id > 0}
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
                                                                    <input
                                                                        type="number"
                                                                        value={item.qty}
                                                                        readOnly={masterList?.invoice_status_id != 2}
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
                                                                        type="text"
                                                                        value={item.price}
                                                                        readOnly={masterList?.invoice_status_id != 2}
                                                                        onChange={(e) => {
                                                                            const value = e.target.value;
                                                                            if (/^\d*\.?\d*$/.test(value)) {
                                                                                handleDetailChange(item.indexInt, value, "price");
                                                                            }
                                                                        }}
                                                                        className="w-full px-3 py-1.5 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-sm rounded text-center"
                                                                    />
                                                                </td>
                                                                <td className="py-0 px-0 text-gray-400 text-center text-custom-sm border border-[#40404042]">
                                                                    <input
                                                                        type="text"
                                                                        value={masterList?.currency}
                                                                        readOnly
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
                                <div className="col-span-12 md:col-span-3">
                                    <div className="flex items-center gap-4 mb-2">
                                        <label className="w-[30%] text-gray-400 text-sm text-right">{translations["Current Credit"]}</label>
                                        <div className="flex flex-1">
                                            <input
                                                type="text"
                                                readOnly
                                                value={formData.current_credit}
                                                onChange={(e) => {
                                                    const value = Number(e.target.value);
                                                    setFormData((prev) => ({ ...prev, current_credit: value }));
                                                    setIsDirty(true);
                                                }}
                                                className="text-right flex-1 px-3 py-2 border border-[#ffffff1a] border-r-0 bg-transparent text-[#ffffffcc] text-custom-sm rounded-tl-md rounded-bl-md !rounded-tr-none !rounded-br-none"
                                            />
                                            <input
                                                type="text"
                                                hidden
                                                readOnly
                                                value={formData.base_current_credit}
                                                onChange={(e) => {
                                                    const value = Number(e.target.value);
                                                    setFormData((prev) => ({ ...prev, base_current_credit: value }));
                                                    setIsDirty(true);
                                                }}
                                                className="text-right flex-1 px-3 py-2 border border-[#ffffff1a] border-r-0 bg-transparent text-[#ffffffcc] text-custom-sm rounded-tl-md rounded-bl-md !rounded-tr-none !rounded-br-none"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setShowCreditsPopup(true);
                                                    handleCreditDetails();
                                                }}
                                                className="px-2 py-2 bg-cyan-600 text-white !rounded-tr-md !rounded-br-md !rounded-tl-none !rounded-bl-none hover:bg-cyan-700 flex items-center justify-center border border-[#ffffff1a] border-l-0"
                                            >
                                                <Search className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-4 mb-2">
                                        <label className="w-[30%] text-gray-400 text-sm text-right">{translations["Credit Note"]}</label>
                                        <input
                                            type="text"
                                            readOnly
                                            value={formData.cr_amount}
                                            onChange={(e) => {
                                                const value = Number(e.target.value);
                                                setFormData((prev) => ({ ...prev, cr_amount: value }));
                                                setIsDirty(true);
                                            }}
                                            className="text-right flex-1 px-3 py-2 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm"
                                        />
                                        <input
                                            type="text"
                                            hidden
                                            readOnly
                                            value={formData.base_cr_amount}
                                            onChange={(e) => {
                                                const value = Number(e.target.value);
                                                setFormData((prev) => ({ ...prev, base_cr_amount: value }));
                                                setIsDirty(true);
                                            }}
                                            className="text-right flex-1 px-3 py-2 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm"
                                        />
                                    </div>
                                    <div className="flex items-center space-x-4 mb-2">
                                        <label className="w-[30%] text-gray-400 text-sm text-right">{translations["Advance Payment"]}</label>
                                        <input
                                            type="text"
                                            readOnly
                                            value={formData.adv_amount}
                                            onChange={(e) => {
                                                const value = Number(e.target.value);
                                                setFormData((prev) => ({ ...prev, adv_amount: value }));
                                                setIsDirty(true);
                                            }}
                                            className="text-right flex-1 px-3 py-2 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm"
                                        />
                                        <input
                                            type="text"
                                            hidden
                                            readOnly
                                            value={formData.base_adv_amount}
                                            onChange={(e) => {
                                                const value = Number(e.target.value);
                                                setFormData((prev) => ({ ...prev, base_adv_amount: value }));
                                                setIsDirty(true);
                                            }}
                                            className="text-right flex-1 px-3 py-2 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm"
                                        />
                                    </div>
                                    <div className="flex items-center space-x-4 mb-2">
                                        <label className="w-[30%] text-gray-400 text-sm text-right">{translations["Excess Payment"]}</label>
                                        <input
                                            type="text"
                                            readOnly
                                            value={formData.excess_amount}
                                            onChange={(e) => {
                                                const value = Number(e.target.value);
                                                setFormData((prev) => ({ ...prev, excess_amount: value }));
                                                setIsDirty(true);
                                            }}
                                            className="text-right flex-1 px-3 py-2 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm"
                                        />
                                        <input
                                            type="text"
                                            hidden
                                            readOnly
                                            value={formData.base_excess_amount}
                                            onChange={(e) => {
                                                const value = Number(e.target.value);
                                                setFormData((prev) => ({ ...prev, base_excess_amount: value }));
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
                                        <input
                                            type="text"
                                            hidden
                                            readOnly
                                            value={formData.base_credit_used}
                                            onChange={(e) => {
                                                const value = Number(e.target.value);
                                                setFormData((prev) => ({ ...prev, base_credit_used: value }));
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
                                            value={formData.total_deposit}
                                            onChange={(e) => {
                                                const value = Number(e.target.value);
                                                setFormData((prev) => ({ ...prev, total_deposit: value }));
                                                setIsDirty(true);
                                            }}
                                            className="text-right flex-1 px-3 py-2 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm"
                                        />
                                        <input
                                            type="text"
                                            hidden
                                            readOnly
                                            value={formData.base_total_deposit}
                                            onChange={(e) => {
                                                const value = Number(e.target.value);
                                                setFormData((prev) => ({ ...prev, base_total_deposit: value }));
                                                setIsDirty(true);
                                            }}
                                            className="text-right flex-1 px-3 py-2 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm"
                                        />
                                    </div>
                                    <div className="flex items-center space-x-4 mb-2">
                                        <label className="w-[30%] text-gray-400 text-sm text-right">{translations["Voucher"]}</label>
                                        <input
                                            type="text"
                                            readOnly
                                            value={formData.voucher_amount}
                                            onChange={(e) => {
                                                const value = Number(e.target.value);
                                                setFormData((prev) => ({ ...prev, voucher_amount: value }));
                                                setIsDirty(true);
                                            }}
                                            className="text-right flex-1 px-3 py-2 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm"
                                        />
                                        <input
                                            type="text"
                                            hidden
                                            readOnly
                                            value={formData.base_voucher_amount}
                                            onChange={(e) => {
                                                const value = Number(e.target.value);
                                                setFormData((prev) => ({ ...prev, base_voucher_amount: value }));
                                                setIsDirty(true);
                                            }}
                                            className="text-right flex-1 px-3 py-2 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm"
                                        />
                                    </div>
                                </div>
                                <div className="col-span-12 md:col-span-4"></div>
                                <div className="col-span-12 md:col-span-3">
                                    <div className="flex items-center space-x-4 mb-2">
                                        <label className="w-[35%] text-gray-400 text-sm text-right">{translations["Sub Total"]}</label>
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
                                            value={formData.currency}
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
                                        <label className="w-[35%] text-gray-400 text-sm text-right">{translations["Total Deduction"]}</label>
                                        <input
                                            type="text"
                                            readOnly
                                            value={formData.currency}
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
                                        <label className="w-[35%] text-gray-400 text-sm text-right">{translations["Total To Pay"]}</label>
                                        <input
                                            type="text"
                                            readOnly
                                            value={formData.currency}
                                            className="w-[20%] px-3 py-2 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm text-center"
                                        />
                                        <input
                                            type="text"
                                            readOnly
                                            value={formData.total_to_pay}
                                            onChange={(e) => {
                                                const value = Number(e.target.value);
                                                setFormData((prev) => ({ ...prev, total_to_pay: value }));
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
                                            value={formData.currency}
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
                                    <div className="flex items-center space-x-4 mb-2">
                                        <label className="w-[35%] text-gray-400 text-sm text-right">{translations["Balance To Pay"]}</label>
                                        <input
                                            type="text"
                                            readOnly
                                            value={formData.currency}
                                            className="w-[20%] px-3 py-2 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm text-center"
                                        />
                                        <input
                                            type="text"
                                            readOnly
                                            value={formData.balance}
                                            onChange={(e) => {
                                                const value = Number(e.target.value);
                                                setFormData((prev) => ({ ...prev, balance: value }));
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
                                            value={formData.base_total}
                                            onChange={(e) => {
                                                const value = Number(e.target.value);
                                                setFormData((prev) => ({ ...prev, base_total: value }));
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
                                            value={formData.base_total_to_pay}
                                            onChange={(e) => {
                                                const value = Number(e.target.value);
                                                setFormData((prev) => ({ ...prev, base_total_to_pay: value }));
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
                                            value={formData.base_balance}
                                            onChange={(e) => {
                                                const value = Number(e.target.value);
                                                setFormData((prev) => ({ ...prev, base_balance: value }));
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
                                <div className={`relative border-round-3 bg-[#2d2d30] border-[#2d2d30]`} style={{ borderColor: "#2d2d30", marginLeft: "5px" }}>
                                    <button
                                        onClick={() => setShowDropdown(!showDropdown)}
                                        className={`
                                        ml-2 px-2 py-2 border rounded-lg text-white transition-colors flex items-center  text-sm
                                        bg-[#2d2d30] border-[#2d2d30]`}
                                    >
                                        {activeDropdownProd === "Products" ? (
                                            <>
                                                <span className="mr-1">{translations["Products"]}</span>
                                                <ChevronDown size={16} />
                                            </>
                                        ) : (
                                            <>
                                                <span className="mr-1">{translations["Services"]}</span>
                                                <ChevronDown size={16} />
                                            </>
                                        )}
                                    </button>
                                    {/* Dropdown Menu */}
                                    {showDropdown && (
                                        <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-10">
                                            <ul className="py-1 text-sm text-gray-700">
                                                <li>
                                                    <button
                                                        className="w-full text-left px-4 py-2 hover:bg-gray-100"
                                                        onClick={() => {
                                                            setShowDropdown(false);
                                                            setActiveDropdownProd("Products");
                                                        }}
                                                    >
                                                        {translations["Products"]}
                                                    </button>
                                                </li>
                                                <li>
                                                    <button
                                                        className="w-full text-left px-4 py-2 hover:bg-gray-100"
                                                        onClick={() => {
                                                            setShowDropdown(false);
                                                            setActiveDropdownProd("Services");
                                                        }}
                                                    >
                                                        {translations["Services"]}
                                                    </button>
                                                </li>
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="p-2 flex-1 overflow-auto">
                        <div className="max-h-[calc(100vh-435px)] overflow-y-auto">
                            <table className="w-full">
                                <thead className="sticky top-0 z-[1]" style={{ backgroundColor: "#1f2132" }}>
                                    <tr className="border-b" style={{ borderColor: "#2d2d30" }}>
                                        {activeDropdownProd === "Products" ? (
                                            <>
                                                <th className="w-[3%] text-left py-2 px-2 text-gray-400 text-sm"></th>
                                                <th className="w-[5%] text-left py-2 px-2 text-gray-400 text-sm"></th>
                                            </>
                                        ) : null}
                                        <th className="w-[10%] text-left py-2 px-2 text-gray-400 text-sm">{translations["Product Code"]}</th>
                                        <th className="w-[40%] text-left py-2 px-2 text-gray-400 text-sm">{translations["Product Name"]}</th>
                                        {activeDropdownProd === "Products" ? (
                                            <>
                                                <th className="w-[10%] text-center py-2 px-2 text-gray-400 text-sm">{translations["Qty"]}</th>
                                                <th className="w-[12%] text-center py-2 px-2 text-gray-400 text-sm">{translations["Allocation"]}</th>
                                                <th className="w-[20%] text-left py-2 px-2 text-gray-400 text-sm">{translations["Warehouse"]}</th>
                                            </>
                                        ) : null}
                                    </tr>
                                </thead>
                                <tbody>
                                    {products.map((product, index) => (
                                        <tr
                                            key={product.id || index}
                                            onClick={(e) => handleRowClick_Service(e, product.id)}
                                            className={`${activeDropdownProd === "Services" ? "clickable" : ""} border-b hover:bg-gray-700 hover:bg-opacity-30 transition-colors ${
                                                selectedChkProducts.includes(product.id as number) ? "bg-gray-700 bg-opacity-30" : ""
                                            }`}
                                            style={{ borderColor: "#40404042" }}
                                        >
                                            {activeDropdownProd === "Products" ? (
                                                <>
                                                    <td className="py-2 px-2" onClick={(e) => e.stopPropagation()}>
                                                        <CustomCheckbox
                                                            checked={selectedChkProducts.includes(product.id as number)}
                                                            onChange={(checked) => handleSelectProduct(product.id as number, checked)}
                                                        />
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
                                                </>
                                            ) : null}
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
                                            {activeDropdownProd === "Products" ? (
                                                <>
                                                    <td className="py-2 px-2 text-gray-400 text-center text-custom-sm">{product.qty}</td>
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
                                                    <td className="py-2 px-2 text-gray-400 text-left text-custom-sm">{lang === "en" ? product.warehouse_en : product.warehouse_cn}</td>
                                                </>
                                            ) : null}
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
                            <button
                                onClick={() => handleAddProduct()}
                                className={`px-2 py-2 bg-cyan-600 hover:bg-cyan-500 rounded text-white transition ${activeDropdownProd === "Services" ? "hidden" : ""}`}
                            >
                                {translations["Add"]}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    };
    const renderCustomerList = () => {
        if (!showCustomers) return null;
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-[#19191c] rounded-xl border border-[#ffffff1a] w-[60vw] h-auto flex flex-col">
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-[#ffffff1a]">
                        <div className="flex items-center space-x-4">
                            <h2 className="text-xl font-bold text-white">{translations["Search Customer"]}</h2>
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
                                        <th className=" text-left py-2 px-4 text-gray-400 text-sm">{translations["Company"]}</th>
                                        <th className=" text-left py-2 px-4 text-gray-400 text-sm">{translations["Customer Name"]}</th>
                                        <th className=" text-left py-2 px-4 text-gray-400 text-sm">{translations["Email"]}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {customers.map((list, index) => (
                                        <tr
                                            key={list.id || index}
                                            onClick={(e) => handleRowClick_Customer(e, list.id)}
                                            className={`clickable border-b hover:bg-gray-700 hover:bg-opacity-30 transition-colors cursor-pointer`}
                                            style={{ borderColor: "#40404042" }}
                                        >
                                            <td className="py-3 px-4 text-gray-400 text-left text-custom-sm">{list.customer_code}</td>
                                            <td className="py-3 px-4 text-gray-400 text-left text-custom-sm">
                                                {lang === "en" ? list.company_en || translations["N.A."] : list.company_en || translations["N.A."]}
                                            </td>
                                            <td className="py-3 px-4 text-gray-400 text-left text-custom-sm">{lang === "en" ? list.account_name_en : list.account_name_cn}</td>
                                            <td className="py-3 px-4 text-gray-400 text-left text-custom-sm">{list.email_address || translations["N.A."]}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    {/* Footer with Pagination */}
                    <div className="p-4 border-t flex items-center justify-between" style={{ borderColor: "#404040" }}>
                        <div className="flex items-center space-x-1">
                            <MemoizedPagination currentPage={currentPageCustomer} totalPages={totalPagesCustomer} onPageChange={(page) => setCurrentPageCustomer(page)} />
                            <MemoizedItemsPerPageSelector
                                value={itemsPerPageSupplier}
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
    const renderCancelOrder = () => {
        if (!cancelOrder) return null;
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 transition-opacity duration-300 ease-out">
                <div className="bg-[#19191c] rounded-xl border border-[#ffffff1a] w-[25vw] h-auto flex flex-col">
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
                                    onClick={() => handleSaveCancelOrder("CTOCUST")}
                                    className={`px-2 py-2 bg-cyan-600 hover:bg-cyan-500 rounded text-white transition w-full
                                        ${loadCancelOrder_CTOCUST ? "bg-gray-500 cursor-not-allowed opacity-50" : "bg-cyan-600 hover:bg-cyan-700"} 
                                        text-[#ffffffcc] flex justify-center items-center`}
                                    disabled={loadCancelOrder_CTOCUST || loadCancelOrder_NRTOMI || loadCancelOrder_RPTOC || loadCancelOrder_PRTCNL}
                                >
                                    {loadCancelOrder_CTOCUST ? (
                                        <>
                                            <div className="loader mr-2"></div>
                                            <span>{translations["Processing2"]}...</span>
                                        </>
                                    ) : (
                                        <span>{translations["Credit to Customer"]}</span>
                                    )}
                                </button>
                            </div>
                            <div className={`col-span-12 md:col-span-12`}>
                                <button
                                    onClick={() => handleSaveCancelOrder("NRTOMI")}
                                    className={`px-2 py-2 bg-cyan-600 hover:bg-cyan-500 rounded text-white transition w-full
                                        ${loadCancelOrder_NRTOMI ? "bg-gray-500 cursor-not-allowed opacity-50" : "bg-cyan-600 hover:bg-cyan-700"} 
                                        text-[#ffffffcc] flex justify-center items-center`}
                                    disabled={loadCancelOrder_CTOCUST || loadCancelOrder_NRTOMI || loadCancelOrder_RPTOC || loadCancelOrder_PRTCNL}
                                >
                                    {loadCancelOrder_NRTOMI ? (
                                        <>
                                            <div className="loader mr-2"></div>
                                            <span>{translations["Processing2"]}...</span>
                                        </>
                                    ) : (
                                        <span>{translations["Non Refundable to Misc Income"]}</span>
                                    )}
                                </button>
                            </div>
                            <div className={`col-span-12 md:col-span-12`}>
                                <button
                                    onClick={() => handleSaveCancelOrder("RPTOC")}
                                    className={`px-2 py-2 bg-cyan-600 hover:bg-cyan-500 rounded text-white transition w-full
                                        ${loadCancelOrder_RPTOC ? "bg-gray-500 cursor-not-allowed opacity-50" : "bg-cyan-600 hover:bg-cyan-700"} 
                                        text-[#ffffffcc] flex justify-center items-center`}
                                    disabled={loadCancelOrder_CTOCUST || loadCancelOrder_NRTOMI || loadCancelOrder_RPTOC || loadCancelOrder_PRTCNL}
                                >
                                    {loadCancelOrder_RPTOC ? (
                                        <>
                                            <div className="loader mr-2"></div>
                                            <span>{translations["Processing2"]}...</span>
                                        </>
                                    ) : (
                                        <span>{translations["Refund payment to customer"]}</span>
                                    )}
                                </button>
                            </div>
                            <div className={`col-span-12 md:col-span-12`}>
                                <button
                                    onClick={() => handleSaveCancelOrder("PRTCNL")}
                                    className={`px-2 py-2 bg-cyan-600 hover:bg-cyan-500 rounded text-white transition w-full
                                        ${loadCancelOrder_RPTOC ? "bg-gray-500 cursor-not-allowed opacity-50" : "bg-cyan-600 hover:bg-cyan-700"} 
                                        text-[#ffffffcc] flex justify-center items-center`}
                                    disabled={loadCancelOrder_CTOCUST || loadCancelOrder_NRTOMI || loadCancelOrder_RPTOC || loadCancelOrder_PRTCNL}
                                >
                                    {loadCancelOrder_PRTCNL ? (
                                        <>
                                            <div className="loader mr-2"></div>
                                            <span>{translations["Processing2"]}...</span>
                                        </>
                                    ) : (
                                        <span>{translations["Partially Paid and Canceled"]}</span>
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
    const renderCreateRV = () => {
        if (!showCreateRV) return null;
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-[#19191c] rounded-xl border border-[#ffffff1a] w-[25vw] h-auto flex flex-col">
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-[#ffffff1a]">
                        <h2 className="text-xl font-bold text-white">{translations["Create Receive Voucher"]}</h2>
                    </div>
                    {/* Content */}
                    <div className="p-4">
                        <div className="col-span-12 md:col-span-12">
                            <div className={`flex items-center gap-4 mb-2`}>
                                <label className="w-[30%] text-gray-400 text-sm">{translations["Date"]}</label>
                                <Flatpickr
                                    onChange={handleDateRV}
                                    options={{
                                        dateFormat: "M d Y",
                                        defaultDate: formDataRV.rv_date || undefined,
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
                                    value={formDataRV.bank}
                                    onChange={(selected) => {
                                        setFormDataRV({ ...formDataRV, bank: selected as OptionType | null });
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
                                <label className="w-[30%] text-gray-400 text-sm">{translations["Received Amount"]}</label>
                                <NumericFormat
                                    value={formDataRV.received_amount === 0 ? "" : formDataRV.received_amount}
                                    decimalSeparator="."
                                    decimalScale={2}
                                    fixedDecimalScale
                                    allowNegative={true}
                                    prefix={`${formDataRV.currency} `}
                                    placeholder="0.00"
                                    onValueChange={({ floatValue }) => {
                                        setFormDataRV((prev) => ({
                                            ...prev,
                                            received_amount: Number(floatValue) ?? "0.00",
                                        }));
                                    }}
                                    className="w-[70%] flex-1 px-3 py-2 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm rounded-md"
                                />
                            </div>
                            <div className={`flex items-center gap-4 mb-2`}>
                                <label className="w-[30%] text-gray-400 text-sm">{translations["Balance To Pay"]}</label>
                                <NumericFormat
                                    readOnly
                                    value={formDataRV.balance_to_pay === 0 ? "" : formDataRV.balance_to_pay}
                                    decimalSeparator="."
                                    decimalScale={2}
                                    fixedDecimalScale
                                    allowNegative={true}
                                    prefix={`${formDataRV.currency} `}
                                    placeholder="0.00"
                                    onValueChange={({ floatValue }) => {
                                        setFormData((prev) => ({
                                            ...prev,
                                            balance_to_pay: Number(floatValue) ?? "0.00",
                                        }));
                                    }}
                                    className="w-[70%] flex-1 px-3 py-2 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm rounded-md"
                                />
                            </div>
                            <div className={`flex items-center gap-4 mb-2 ${formDataRV.current_credit <= 0 ? "hidden" : ""}`}>
                                <label className="w-[30%] text-gray-400 text-sm">{translations["Current Credit"]}</label>
                                <div className="w-[70%] flex flex-1">
                                    <NumericFormat
                                        value={formDataRV.current_credit}
                                        decimalSeparator="."
                                        decimalScale={2}
                                        readOnly
                                        fixedDecimalScale
                                        allowNegative={true}
                                        prefix={`${formDataRV.currency} `}
                                        placeholder={`${formDataRV.currency} 0.00`}
                                        onValueChange={({ floatValue }) => {
                                            setFormData((prev) => ({
                                                ...prev,
                                                current_credit: floatValue ?? 0,
                                            }));
                                        }}
                                        className="flex-1 px-3 py-2 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm rounded-md !rounded-tr-none !rounded-br-none"
                                    />
                                    <button
                                        disabled={formData.current_credit === 0}
                                        type="button"
                                        // onClick={handlePopupCredits}
                                        className="px-2 py-2 bg-cyan-600 text-white !rounded-tr-md !rounded-br-md !rounded-tl-none !rounded-bl-none hover:bg-cyan-700 flex items-center justify-center border border-[#ffffff1a] border-l-0"
                                    >
                                        <Search className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                            <div className={`flex items-center gap-4 mb-2 ${formDataRV.current_credit <= 0 ? "hidden" : ""}`}>
                                <label className="w-[30%] text-gray-400 text-sm">{translations["Credit Used"]}</label>
                                <NumericFormat
                                    value={formDataRV.credit_used}
                                    decimalSeparator="."
                                    readOnly
                                    decimalScale={2}
                                    fixedDecimalScale
                                    allowNegative={true}
                                    prefix={`${formDataRV.currency} `}
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
                    <div className="p-2 border-t border-[#ffffff1a] flex justify-end space-x-2">
                        <button
                            onClick={() => setShowCreateRV(false)}
                            className="px-2 py-2 bg-gray-700 hover:bg-gray-600 rounded text-white transition focus:outline-none focus:ring-2 focus:ring-cyan-500"
                        >
                            {translations["Close"]}
                        </button>
                        <button
                            onClick={handleSubmitRV}
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
                                <span>{translations["Submit"]}</span>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        );
    };
    const renderCreditDetails = () => {
        if (!creditsPopup) return null;
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-[#19191c] rounded-xl border border-[#ffffff1a] w-[60vw] h-auto flex flex-col">
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-[#ffffff1a]">
                        <h2 className="text-xl font-bold text-white">{translations["Credits"]}</h2>
                    </div>
                    {/* Content */}
                    <div className="p-4">
                        <div className="col-span-12 md:col-span-12">
                            <table className="w-full border border-gray-600 border-collapse text-sm text-left">
                                <thead className="sticky top-0 z-[1] py-1 px-4" style={{ backgroundColor: "#1f2132" }}>
                                    <tr className="border-b" style={{ borderColor: "#2d2d30" }}>
                                        <th className="w-[20%] text-left py-2 px-2 text-gray-400 text-sm w-12 border border-[#40404042]">{translations["Account Code"]}</th>
                                        <th className="w-[25%] text-left py-2 px-2 text-gray-400 text-sm w-12 border border-[#40404042]">{translations["Account Name"]}</th>
                                        <th className="w-[25%] text-left py-2 px-2 text-gray-400 text-sm w-12 border border-[#40404042]">{translations["Transaction Ref"]}</th>
                                        <th className="w-[15%] text-center py-2 px-2 text-gray-400 text-sm w-12 border border-[#40404042]">{translations["Amount"]}</th>
                                        <th className="w-[15%] text-center py-2 px-2 text-gray-400 text-sm w-12 border border-[#40404042]"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {selectedForCredits.length === 0 ? (
                                        <tr className="border-b hover:bg-gray-700 hover:bg-opacity-30 transition-colors" style={{ borderColor: "#40404042" }}>
                                            <td colSpan={5} className="py-2 px-2 text-gray-400 text-center text-custom-sm border border-[#40404042]">
                                                {translations["No data available on table"]}
                                            </td>
                                        </tr>
                                    ) : (
                                        selectedForCredits.map((item) => (
                                            <tr key={item.account_code} className={`border-b hover:bg-gray-700 hover:bg-opacity-30 transition-colors`} style={{ borderColor: "#40404042" }}>
                                                <td className="py-2 px-2 text-gray-400 text-left text-custom-sm border border-[#40404042]">{item.account_code}</td>
                                                <td className="py-2 px-2 text-gray-400 text-left text-custom-sm border border-[#40404042]">
                                                    {lang === "en" ? item.account_name_en : item.account_name_cn}
                                                </td>
                                                <td className="py-2 px-2 text-gray-400 text-left text-custom-sm border border-[#40404042]">{item.ref_data}</td>
                                                <td className="py-2 px-2 text-gray-400 text-center text-custom-sm border border-[#40404042]">
                                                    {item.currency} {formatMoney(item.amount)}
                                                </td>
                                                <td className="py-0 px-0 text-gray-400 text-center text-custom-sm border border-[#40404042]">
                                                    <input
                                                        type="number"
                                                        value={item.new_amount === 0 ? "" : item.new_amount}
                                                        placeholder="0"
                                                        onChange={(e) => {
                                                            const value = e.target.value;
                                                            setSelectedCredits((prev) =>
                                                                prev.map((list) => {
                                                                    if (list.account_code === item.account_code) {
                                                                        return {
                                                                            ...list,
                                                                            new_amount: value,
                                                                        };
                                                                    }
                                                                    return list; // <-- This was missing
                                                                })
                                                            );
                                                        }}
                                                        className="w-full px-3 py-1.5 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-sm rounded text-center"
                                                    />
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    {/* Footer */}
                    <div className="p-2 border-t border-[#ffffff1a] flex justify-end space-x-2">
                        <button
                            onClick={() => setShowCreditsPopup(false)}
                            className="px-2 py-2 bg-gray-700 hover:bg-gray-600 rounded text-white transition focus:outline-none focus:ring-2 focus:ring-cyan-500"
                        >
                            {translations["Close"]}
                        </button>
                        <button
                            onClick={handleSubmitCredit}
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
                                <span>{translations["Submit"]}</span>
                            )}
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
                            disabled={loadingSave || masterList?.invoice_status_id === 1}
                        >
                            {loadingSave ? (
                                <>
                                    <div className="loader mr-2"></div>
                                    <span>{translations["Processing2"]}...</span>
                                </>
                            ) : formData.total_to_pay === 0 ? (
                                formData.credit_used > 0 ? (
                                    <span>{translations["Save and Create JV"]}</span>
                                ) : (
                                    <span>{translations["Save and Paid"]}</span>
                                )
                            ) : (
                                <span>{translations["Save"]}</span>
                            )}
                        </button>
                        <button
                            onClick={() => {
                                exportRef.current?.triggerExport();
                            }}
                            disabled={customerInvoiceId === 0}
                            className="px-2 py-2 bg-cyan-600 hover:bg-cyan-700 text-[#ffffffcc] text-custom-sm rounded-lg text-sm font-medium transition-colors"
                        >
                            {translations["Print"]}
                        </button>
                        <button onClick={handleAddNew} className="px-2 py-2 bg-cyan-600 hover:bg-cyan-700 text-[#ffffffcc] text-custom-sm rounded-lg text-sm font-medium transition-colors">
                            {translations["Add New"]}
                        </button>
                        <button
                            onClick={handleCreateRV}
                            hidden={formData.total_to_pay === 0}
                            className={`px-2 py-2 text-custom-sm rounded-lg text-sm font-medium transition-colors bg-cyan-600 hover:bg-cyan-700
                            text-[#ffffffcc] flex justify-center items-center`}
                            disabled={customerInvoiceId === 0 || masterList?.invoice_status_id === 1}
                        >
                            <span>{translations["Create Receive Voucher"]}</span>
                        </button>
                        <button
                            onClick={handleVoid}
                            disabled={customerInvoiceId === 0 || masterList?.invoice_status_id === 1}
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
                <ExportReportSelector ref={exportRef} formats={["odt"]} baseName="DownloadSelectedSingleInv" ids={[customerInvoiceId]} language={lang} />
            </div>
            {renderProductList()}
            {renderCustomerList()}
            {renderCancelOrder()}
            {renderCreditDetails()}
            {renderCreateRV()}
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

export default CustomerInvoiceDetails;
