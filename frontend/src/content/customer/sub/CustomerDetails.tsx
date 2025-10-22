import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { showConfirm } from "@/utils/alert";
import { getFlatpickrLocale, formatDateToCustom } from "@/utils/flatpickrLocale";
import { showSuccessToast, showErrorToast } from "@/utils/toast";
import Select from "react-select";
import Flatpickr from "react-flatpickr";
import "flatpickr/dist/themes/dark.css";
import dayjs from "dayjs";
import CustomCheckbox from "@/components/CustomCheckbox";
import { ArrowLeft, X, ThumbsUp, ThumbsDown, Plus, Minus, Calendar } from "lucide-react";
import Pagination from "@/components/Pagination";
import ItemsPerPageSelector from "@/components/ItemsPerPageSelector";
import CopyToClipboard from "@/components/CopyToClipboard";
import { ExportReportSelector } from "@/utils/ExportReportSelector";
import PusherEcho from "@/utils/echo";
import {
    customerService,
    CustomerEmail,
    CustomerGroup,
    ApiCustomer,
    ApiCustomerOrder,
    ApiCustomerInvoices,
    ApiCustomerSalesOrder,
    ApiCustomerDeposit,
    ApiCustomerProfitability,
    ApiCustomerCredit,
    ApiCustomerRefund,
} from "@/services/customerService";
import {
    fetchWarehouses,
    fetchSource,
    fetchSalesPerson,
    fetchCourier,
    fetchTaxGroup,
    fetchShippingTerms,
    fetchPaymentTerms,
    fetchCountries,
    fetchStates,
    fetchCustomerGroups,
    fetchCustomerType,
    convertToSingleOption,
    OptionType,
} from "@/utils/fetchDropdownData";
import { formatMoney, formatExrate, selectStyles, parseDate, baseCurrency, formatDateTime, formatDate, isValidOption, DropdownData } from "@/utils/globalFunction";

const MemoizedPagination = React.memo(Pagination);
const MemoizedItemsPerPageSelector = React.memo(ItemsPerPageSelector);

interface CustomerDetailsProps {
    customerId: number;
    saveType: string; // or a more specific union type like 'new' | 'edit'
    onBack: () => void;
    onSave: () => void;
    onChangeCustomerId: (newId: number) => void;
    onChangeSaveType: (type: string) => void;
    tabId: string;
    copySettings?: any;
}
const defaultCustomer: ApiCustomer = {
    id: 0,
    customer_code: "",
    account_name_en: "",
    account_name_cn: "",
    company_en: "",
    company_cn: "",
    email_address: "",
    status: 0,
    is_subscribe: 0,
    sales_person_name: "",
    country_en: "",
    country_cn: "",
    language: "",
    groups: [],
};
interface DetailsExpanded {
    id: number;
    orders_id: number;
    table_id: number;
    deposit: number;
    qty: number;
    price: number;
    total: number;
    item_deposit: number;
    base_item_deposit: number;
    amount: number;
    ex_rate: number;
    ref_data: string;
    currency: string;
    product_code: string;
    account_code: string;
    particulars: string;
    product_title_en: string;
    product_title_cn: string;
    transaction_date: string;
    description_en: string;
    description_cn: string;
    invoice_no: string;
    payment_order: number;
    profitability: number;
    amount_paid: number;
}
interface ApiCustomerFooter {
    total_qty: number;
    total_deposit: number;
    total: number;
    total_to_pay: number;
    base_total: number;
    base_total_to_pay: number;
    total_subtotal: number;
    total_base_total: number;
    total_e_cost_total: number;
    total_e_profit: number;
    total_item_deposit: number;
    amount_paid: number;
    base_amount_paid: number;
    balance: number;
    currency: string;
}
const CustomerDetails: React.FC<CustomerDetailsProps> = ({ customerId, saveType, onBack, onSave, onChangeCustomerId, onChangeSaveType, tabId, copySettings }) => {
    const { translations, lang } = useLanguage();
    const locale = getFlatpickrLocale(translations);
    const [customer, setCustomer] = useState<ApiCustomer | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState("information");
    const [showCopyCustomer, setShowCopyCustomer] = useState(false);
    const [isDirty, setIsDirty] = useState(false);
    const isDirtyRef = useRef(isDirty);
    const [showUnsavedChanges, setShowUnsavedChanges] = useState(false);
    const [isInitialized, setIsInitialized] = useState(false);
    const initialFormData = React.useRef<any>(null);
    const pageSizeOptions = useMemo(() => [15, 25, 50, -1], []);
    const [loadingSave, setLoadingSave] = useState(false);
    const [copiedCustomerId, setCopiedCustomerId] = useState<number | null>(null);
    const [warehousesData, setWarehousesData] = useState<DropdownData[]>([]);
    const [customerTypeData, setCustomerTypeData] = useState<DropdownData[]>([]);
    const [sourceData, setSourceData] = useState<DropdownData[]>([]);
    const [salesPersonData, setSalesPersonData] = useState<DropdownData[]>([]);
    const [courierData, setCourierData] = useState<DropdownData[]>([]);
    const [taxGroupData, setTaxGroupData] = useState<DropdownData[]>([]);
    const [shippingTermsData, setShippingTermsData] = useState<DropdownData[]>([]);
    const [paymentTermsData, setPaymentTermsData] = useState<DropdownData[]>([]);
    const [countriesData, setCountriesData] = useState<DropdownData[]>([]);
    const [statesData, setStatesData] = useState<DropdownData[]>([]);
    const [customerGroupData, setCustomerGroupData] = useState<DropdownData[]>([]);
    const [customerOrder, setCustomerOrder] = useState<ApiCustomerOrder[]>([]);
    const [customerInvoices, setCustomerInvoices] = useState<ApiCustomerInvoices[]>([]);
    const [customerSalesOrder, setCustomerSalesOrder] = useState<ApiCustomerSalesOrder[]>([]);
    const [customerDeposit, setCustomerDeposit] = useState<ApiCustomerDeposit[]>([]);
    const [customerProfitability, setCustomerProfitability] = useState<ApiCustomerProfitability[]>([]);
    const [customerOrderHistory, setCustomerOrderHistory] = useState<ApiCustomerInvoices[]>([]);
    const [customerCredit, setCustomerCredit] = useState<ApiCustomerCredit[]>([]);
    const [customerRefund, setCustomerRefund] = useState<ApiCustomerRefund[]>([]);
    // const [customerInvoicesFooter, setCustomerInvoicesFooter] = useState<ApiCustomerFooter | null>(null);
    const [CustomerOrderFooter, setCustomerOrderFooter] = useState<ApiCustomerFooter | null>(null);
    const [CustomerOrderFooter2, setCustomerOrderFooter2] = useState<ApiCustomerFooter | null>(null);
    // const [CustomerSalesOrderFooter, setCustomerSalesOrderFooter] = useState<ApiCustomerFooter | null>(null);
    const [CustomerCreditFooter, setCustomerCreditFooter] = useState<ApiCustomerFooter[]>([]);
    const [emailList, setEmailList] = useState<CustomerEmail[]>([]);
    const [groupList, setGroupList] = useState<CustomerGroup[]>([]);
    const [totalPages_Order, setTotalPages_Order] = useState(1);
    const [totalPages_Invoices, setTotalPages_Invoices] = useState(1);
    const [totalPages_SalesOrder, setTotalPages_SalesOrder] = useState(1);
    const [totalPages_Deposit, setTotalPages_Deposit] = useState(1);
    const [totalPages_Profitability, setTotalPages_Profitability] = useState(1);
    const [totalPages_OrderHistory, setTotalPages_OrderHistory] = useState(1);
    const [totalPages_Credit, setTotalPages_Credit] = useState(1);
    const [totalPages_Refund, setTotalPages_Refund] = useState(1);
    const [selectedCustomerOrders, setSelectedCustomerOrders] = useState<number[]>([]);
    const customerInfoKey = `${customerId}-cached-customer-info`;
    const customerOrderKey = `${customerId}-cached-customer-order`;
    const customerInvoicesKey = `${customerId}-cached-customer-invoices`;
    const customerSalesOrderKey = `${customerId}-cached-customer-salesOrder`;
    const customerDepositKey = `${customerId}-cached-customer-deposit`;
    const customerProfitabilityKey = `${customerId}-cached-customer-profitability`;
    const customerOrderHistoryKey = `${customerId}-cached-customer-orderHistory`;
    const customerCreditKey = `${customerId}-cached-customer-credit`;
    const customerRefundKey = `${customerId}-cached-customer-refund`;
    const safeLang = lang === "cn" ? "cn" : "en";
    const [expanded_Orders, setExpandedRows_Orders] = useState<number[]>([]);
    const [expanded_Invoices, setExpandedRows_Invoices] = useState<number[]>([]);
    const [expanded_SalesOrder, setExpandedRows_SalesOrder] = useState<number[]>([]);
    const [expanded_Deposit, setExpandedRows_Deposit] = useState<number[]>([]);
    const [expanded_Profitability, setExpandedRows_Profitability] = useState<number[]>([]);
    const [expanded_OrderHistory, setExpandedRows_OrderHistory] = useState<number[]>([]);
    const [expanded_Credits, setExpandedRows_Credits] = useState<number[]>([]);
    const [orderDetailsMap, setOrderDetailsMap] = useState<Record<number, DetailsExpanded[] | null>>({});
    const [invoicesDetailsMap, setInvoicesDetailsMap] = useState<Record<number, DetailsExpanded[] | null>>({});
    const [salesOrderDetailsMap, setSalesOrderDetailsMap] = useState<Record<number, DetailsExpanded[] | null>>({});
    const [depositDetailsMap, setDepositDetailsMap] = useState<Record<number, DetailsExpanded[] | null>>({});
    const [profitabilityDetailsMap, setProfitabilityDetailsMap] = useState<Record<number, DetailsExpanded[] | null>>({});
    const [orderHistoryDetailsMap, setOrderHistoryDetailsMap] = useState<Record<number, DetailsExpanded[] | null>>({});
    const [creditDetailsMap, setCreditDetailsMap] = useState<Record<number, DetailsExpanded[] | null>>({});
    const [currentPage_Order, setCurrentPage_Order] = useState(() => {
        const cachedMeta = localStorage.getItem(customerOrderKey);
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
    const [currentPage_Invoices, setCurrentPage_Invoices] = useState(() => {
        const cachedMeta = localStorage.getItem(customerInvoicesKey);
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
    const [currentPage_SalesOrder, setCurrentPage_SalesOrder] = useState(() => {
        const cachedMeta = localStorage.getItem(customerSalesOrderKey);
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
    const [currentPage_Deposit, setCurrentPage_Deposit] = useState(() => {
        const cachedMeta = localStorage.getItem(customerDepositKey);
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
    const [currentPage_Profitability, setCurrentPage_Profitability] = useState(() => {
        const cachedMeta = localStorage.getItem(customerProfitabilityKey);
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
    const [currentPage_OrderHistory, setCurrentPage_OrderHistory] = useState(() => {
        const cachedMeta = localStorage.getItem(customerOrderHistoryKey);
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
    const [currentPage_Credit, setCurrentPage_Credit] = useState(() => {
        const cachedMeta = localStorage.getItem(customerCreditKey);
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
    const [currentPage_Refund, setCurrentPage_Refund] = useState(() => {
        const cachedMeta = localStorage.getItem(customerRefundKey);
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
    const [itemsPerPage_Order, setItemsPerPage_Order] = useState(() => {
        const cachedMeta = localStorage.getItem(customerOrderKey);
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
    const [itemsPerPage_Invoices, setItemsPerPage_Invoices] = useState(() => {
        const cachedMeta = localStorage.getItem(customerInvoicesKey);
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
    const [itemsPerPage_SalesOrder, setItemsPerPage_SalesOrder] = useState(() => {
        const cachedMeta = localStorage.getItem(customerSalesOrderKey);
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
    const [itemsPerPage_Deposit, setItemsPerPage_Deposit] = useState(() => {
        const cachedMeta = localStorage.getItem(customerDepositKey);
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
    const [itemsPerPage_Profitability, setItemsPerPage_Profitability] = useState(() => {
        const cachedMeta = localStorage.getItem(customerProfitabilityKey);
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
    const [itemsPerPage_OrderHistory, setItemsPerPage_OrderHistory] = useState(() => {
        const cachedMeta = localStorage.getItem(customerOrderHistoryKey);
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
    const [itemsPerPage_Credit, setItemsPerPage_Credit] = useState(() => {
        const cachedMeta = localStorage.getItem(customerCreditKey);
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
    const [itemsPerPage_Refund, setItemsPerPage_Refund] = useState(() => {
        const cachedMeta = localStorage.getItem(customerRefundKey);
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
    const [searchTerm_Order, setSearchTerm_Order] = useState(() => {
        const cached = localStorage.getItem(customerOrderKey);
        if (!cached) return "";
        try {
            const meta = JSON.parse(cached);
            return meta.search || "";
        } catch {
            return "";
        }
    });
    const [searchTerm_Invoices, setSearchTerm_Invoices] = useState(() => {
        const cached = localStorage.getItem(customerInvoicesKey);
        if (!cached) return "";
        try {
            const meta = JSON.parse(cached);
            return meta.search || "";
        } catch {
            return "";
        }
    });
    const [searchTerm_SalesOrder, setSearchTerm_SalesOrder] = useState(() => {
        const cached = localStorage.getItem(customerSalesOrderKey);
        if (!cached) return "";
        try {
            const meta = JSON.parse(cached);
            return meta.search || "";
        } catch {
            return "";
        }
    });
    const [searchTerm_Deposit, setSearchTerm_Deposit] = useState(() => {
        const cached = localStorage.getItem(customerDepositKey);
        if (!cached) return "";
        try {
            const meta = JSON.parse(cached);
            return meta.search || "";
        } catch {
            return "";
        }
    });
    const [searchTerm_Profitability, setSearchTerm_Profitability] = useState(() => {
        const cached = localStorage.getItem(customerProfitabilityKey);
        if (!cached) return "";
        try {
            const meta = JSON.parse(cached);
            return meta.search || "";
        } catch {
            return "";
        }
    });
    const [searchTerm_OrderHistory, setSearchTerm_OrderHistory] = useState(() => {
        const cached = localStorage.getItem(customerOrderHistoryKey);
        if (!cached) return "";
        try {
            const meta = JSON.parse(cached);
            return meta.search || "";
        } catch {
            return "";
        }
    });
    const [searchTerm_Credit, setSearchTerm_Credit] = useState(() => {
        const cached = localStorage.getItem(customerCreditKey);
        if (!cached) return "";
        try {
            const meta = JSON.parse(cached);
            return meta.search || "";
        } catch {
            return "";
        }
    });
    const [searchTerm_Refund, setSearchTerm_Refund] = useState(() => {
        const cached = localStorage.getItem(customerRefundKey);
        if (!cached) return "";
        try {
            const meta = JSON.parse(cached);
            return meta.search || "";
        } catch {
            return "";
        }
    });
    const handleSetDefault = async (indexInt: number) => {
        setEmailList((prev) =>
            prev.map((item) => ({
                ...item,
                set_as_default: item.indexInt === indexInt,
            }))
        );
        showSuccessToast(translations["Record Successfully Set as Default"]);
    };
    const handleSetDefault_group = async (indexInt: number) => {
        setGroupList((prev) =>
            prev.map((item) => ({
                ...item,
                set_as_default: item.indexInt === indexInt,
            }))
        );
        showSuccessToast(translations["Record Successfully Set as Default"]);
    };
    const handleRemoveEmail = async (idToRemove: number) => {
        const confirmed = await showConfirm(translations["System Message"], translations["Are you sure you want to delete this record?"], translations["Delete"], translations["Cancel"]);

        if (!confirmed) return;

        setEmailList((prev) => {
            let updated = prev.flatMap((item) => {
                if (item.indexInt === idToRemove) {
                    if (item.id === 0) {
                        // New/unsaved: remove it entirely
                        return [];
                    } else {
                        // Already saved: soft-delete by setting is_deleted
                        return [{ ...item, is_deleted: 1 }];
                    }
                }
                return [item];
            });
            // Ensure there's still a default email among visible items
            const visibleItems = updated.filter((item) => item.is_deleted !== 1);
            if (!visibleItems.some((e) => e.set_as_default) && visibleItems.length > 0) {
                visibleItems[0].set_as_default = true;
            }
            return updated;
        });
    };
    const handleRemoveEmail_group = async (idToRemove: number) => {
        const confirmed = await showConfirm(translations["System Message"], translations["Are you sure you want to delete this record?"], translations["Delete"], translations["Cancel"]);

        if (!confirmed) return;

        setGroupList((prev) => {
            let updated = prev.flatMap((item) => {
                if (item.indexInt === idToRemove) {
                    if (item.id === 0) {
                        // New/unsaved: remove it entirely
                        return [];
                    } else {
                        // Already saved: soft-delete by setting is_deleted
                        return [{ ...item, is_deleted: 1 }];
                    }
                }
                return [item];
            });
            // Ensure there's still a default email among visible items
            const visibleItems = updated.filter((item) => item.is_deleted !== 1);
            if (!visibleItems.some((e) => e.set_as_default) && visibleItems.length > 0) {
                visibleItems[0].set_as_default = true;
            }
            return updated;
        });
    };
    const handleEmailChange = (indexInt: number, value: string) => {
        setEmailList((prev) => prev.map((item) => (item.indexInt === indexInt ? { ...item, email_address: value } : item)));
    };
    const handleAddEmail = () => {
        const newId = Math.max(0, ...emailList.map((e) => e.indexInt)) + 1;
        const newEmail: CustomerEmail = {
            id: 0,
            indexInt: newId,
            customer_id: customerId, // you must define this in your scope
            email_address: "",
            is_deleted: 0,
            set_as_default: false,
        };
        setEmailList((prev) => [...prev, newEmail]);
    };
    const handleAddEmail_group = () => {
        const minId = Math.min(0, ...groupList.map((e) => e.indexInt));
        const newId = minId - 1; // Always gives -1, -2, -3...
        const newGroup: CustomerGroup = {
            id: 0,
            indexInt: newId,
            customer_id: customerId, // you must define this in your scope
            customer_group_id: null,
            is_deleted: 0,
            set_as_default: false,
        };
        setGroupList((prev) => [...prev, newGroup]);
    };
    const [fields, setFields] = useState<Record<string, boolean>>({});
    const [selectAll, setSelectAll] = useState({
        customerInfo: false,
    });
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
    const sourceOption: OptionType[] = useMemo(
        () =>
            sourceData.map((list) => ({
                value: list.value.toString(),
                value2: list.value.toString(),
                label: lang === "en" ? list.en : list.cn,
                en: list.en,
                cn: list.cn,
            })),
        [sourceData, lang]
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
    const customerGroupOption: OptionType[] = useMemo(
        () =>
            customerGroupData.map((list) => ({
                value: list.value.toString(),
                value2: list.value.toString(),
                label: lang === "en" ? list.en : list.cn,
                en: list.en,
                cn: list.cn,
            })),
        [customerGroupData, lang]
    );
    const [formData, setFormData] = useState({
        customer_code: "",
        old_customer_code: "",
        copy_customer_code: "",
        account_name_en: "",
        account_name_cn: "",

        billing_address_en: "",
        billing_address_cn: "",
        billing_name_en: "",
        billing_name_cn: "",
        billing_postal_code: "",
        billing_country: null as OptionType | null,
        billing_state_id: null as OptionType | null,
        billing_tel_no: "",
        billing_fax_no: "",

        delivery_address_en: "",
        delivery_address_cn: "",
        delivery_name_en: "",
        delivery_name_cn: "",
        delivery_postal_code: "",
        delivery_country: null as OptionType | null,
        delivery_state_id: null as OptionType | null,
        delivery_tel_no: "",
        delivery_fax_no: "",

        company_en: "",
        company_cn: "",
        email_address: "",
        webpage_address: "",
        status: 0,
        customer_since: null as Date | null,
        currency: null as OptionType | null,
        memo: "",
        shipping_address: "",
        credit_limit: "",
        price_level: "",
        sales_person_id: null as OptionType | null,
        payment_terms_id: null as OptionType | null,
        preferred_shipping_id: null as OptionType | null,
        shipping_terms_id: null as OptionType | null,
        source_id: null as OptionType | null,
        tax_group: null as OptionType | null,
        user_id: "",
        tax_ref_no: "",
        mobile: "",
        password: "",
        tel_no: "",
        customer_type: null as OptionType | null,
        pod: null as OptionType | null,
        rwarehouse: null as OptionType | null,
        language: "",
        updated_at: "",
        is_view_new_order: 0,
        is_subscribe: 0,
        is_new_inventory: 0,
        is_copy_billing: 0,
        groups: [] as OptionType[],
        is_copy_customerInfo: false,
        is_new_customer_id: 0,
        is_copy_data: false,
    });
    // Helper function to get image URL - Fixed to use correct path
    const handleGroupChange = (groupId: number, indexInt: number, selected: OptionType | null) => {
        setGroupList((prev) => prev.map((item) => (item.id === groupId && item.indexInt === indexInt ? { ...item, customer_group_id: selected ? parseInt(selected.value) : 0 } : item)));
    };
    // Static options for Pcs/Carton
    const languageOptions: OptionType[] = [
        { value: "EN", label: "English", en: "English", cn: "英文", value2: "" },
        { value: "CN", label: "Chinese", en: "Chinese", cn: "中文", value2: "" },
    ];
    const handleCustomerSinceChange = useCallback((dates: Date[]) => {
        setFormData((prev) => ({ ...prev, customer_since: dates[0] ?? null }));
        if (!isDirtyRef.current) {
            setIsDirty(true); // ✅ only if user is editing
        }
    }, []);
    const handleSelectCustOrders = (id: number, checked: boolean) => {
        if (checked) {
            setSelectedCustomerOrders((prev) => [...prev, id]);
        } else {
            setSelectedCustomerOrders((prev) => prev.filter((pid) => pid !== id));
        }
    };
    const handleSelectedAllCustOrder = (checked: boolean) => {
        if (checked) {
            const allIds = customerOrder.map((p) => p.id);
            setSelectedCustomerOrders(allIds);
        } else {
            setSelectedCustomerOrders([]);
        }
    };
    // REALTIME
    useEffect(() => {
        const channel = PusherEcho.channel("customer-channel");
        const handleProductEvent = () => {
            localStorage.removeItem(`${customerId}-cached-customers-orders`);
            setTimeout(() => {
                fetchCustomerOrder(currentPage_Order, itemsPerPage_Order, searchTerm_Order);
                fetchCustomerInvoices(currentPage_Invoices, itemsPerPage_Invoices, searchTerm_Invoices);
                fetchCustomerSalesOrder(currentPage_SalesOrder, itemsPerPage_SalesOrder, searchTerm_SalesOrder);
                fetchCustomerDeposit(currentPage_Deposit, itemsPerPage_Deposit, searchTerm_Deposit);
                fetchCustomerProfitability(currentPage_Profitability, itemsPerPage_Profitability, searchTerm_Profitability);
                fetchCustomerOrderHistory(currentPage_OrderHistory, itemsPerPage_OrderHistory, searchTerm_OrderHistory);
                fetchCustomerCredit(currentPage_Credit, itemsPerPage_Credit, searchTerm_Credit);
                fetchCustomerRefund(currentPage_Refund, itemsPerPage_Refund, searchTerm_Refund);
            }, 500);
        };

        // Listen for product events and trigger reload
        channel.listen(".customer-event", handleProductEvent);

        // Cleanup on component unmount or dependency change
        return () => {
            PusherEcho.leave("customer-channel");
            channel.stopListening(".customer-event", handleProductEvent);
        };
    }, [customerId, currentPage_Order, itemsPerPage_Order, searchTerm_Order, tabId]);
    // Keep ref updated
    useEffect(() => {
        isDirtyRef.current = isDirty;
    }, [isDirty]);

    useEffect(() => {
        const fetchAllCustomerData = () => {
            fetchCustomerDetails();
            fetchCustomerEmails();
            fetchCustomerGroupsList();
            fetchCustomerOrder();
            fetchCustomerInvoices();
            fetchCustomerSalesOrder();
            fetchCustomerDeposit();
            fetchCustomerProfitability();
            fetchCustomerOrderHistory();
            fetchCustomerCredit();
            fetchCustomerRefund();
        };

        const fetchDropdownData = () => {
            loadCustomerType();
            loadWarehouse();
            loadSource();
            loadSalesPerson();
            loadCourier();
            loadTaxGroup();
            loadShippingTerms();
            loadPaymentTerms();
            loadCountries();
            loadState();
            loadCustomerGroup();
        };

        fetchDropdownData();

        if (saveType === "new") {
            setLoading(true);
            clearForms();
            setCustomer(defaultCustomer);
            setCustomerGroupData([]);
            setEmailList([]);
            setGroupList([]);
            setIsDirty(false);
            isDirtyRef.current = false;
            setIsInitialized(false);
            setLoading(false);
        } else {
            fetchAllCustomerData();
        }
    }, [customerId, saveType]);

    useEffect(() => {
        // This effect handles the copy operation when initiated from the CustomerList view.
        if (saveType === "copy" && copySettings && customer) {
            const { newCustomerCode, fields, selectAll, rawArray } = copySettings;
            processCopy(newCustomerCode, fields, selectAll, rawArray);
        }
    }, [copySettings, customer, saveType]);

    useEffect(() => {
        // Don't run if customer data isn't there yet.
        if (!customer) return;

        if (!isInitialized) {
            // A more robust check to see if the form is fully initialized
            const isFormReady =
                (customer.billing_country ? !!formData.billing_country : true) &&
                (customer.billing_state_id ? !!formData.billing_state_id : true) &&
                (customer.delivery_country ? !!formData.delivery_country : true) &&
                (customer.delivery_state_id ? !!formData.delivery_state_id : true) &&
                (customer.groups && customer.groups.length > 0 ? formData.groups.length > 0 : true) &&
                (customer.sales_person_id ? !!formData.sales_person_id : true) &&
                (customer.payment_terms_id ? !!formData.payment_terms_id : true) &&
                (customer.preferred_shipping_id ? !!formData.preferred_shipping_id : true) &&
                (customer.shipping_terms_id ? !!formData.shipping_terms_id : true) &&
                (customer.pod ? !!formData.pod : true) &&
                (customer.rwarehouse ? !!formData.rwarehouse : true) &&
                (customer.customer_type ? !!formData.customer_type : true) &&
                (customer.tax_group ? !!formData.tax_group : true) &&
                (customer.source_id ? !!formData.source_id : true);

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
                setIsDirty(true);
            } else {
                setIsDirty(false);
            }
        }
    }, [customer, formData, isInitialized]);

    useEffect(() => {
        if (customer && customerTypeOptions.length > 0) {
            const selectedOption = convertToSingleOption(customer.customer_type, customerTypeOptions);
            setFormData((prev) => ({ ...prev, customer_type: selectedOption }));
        }
    }, [customer, customerTypeOptions]);

    useEffect(() => {
        if (customer && warehouseOptions.length > 0) {
            const selectedOption = convertToSingleOption(customer.rwarehouse, warehouseOptions);
            setFormData((prev) => ({ ...prev, rwarehouse: selectedOption }));

            const selectedOption2 = convertToSingleOption(customer.pod, warehouseOptions);
            setFormData((prev) => ({ ...prev, pod: selectedOption2 }));
        }
    }, [customer, warehouseOptions, lang]);

    useEffect(() => {
        if (customer && sourceOption.length > 0) {
            const selectedOption = convertToSingleOption(customer.source_id, sourceOption);
            setFormData((prev) => ({ ...prev, source_id: selectedOption }));
        }
    }, [customer, sourceOption, lang]);

    useEffect(() => {
        if (customer && salesPersonOption.length > 0) {
            const selectedOption = convertToSingleOption(customer.sales_person_id, salesPersonOption);
            setFormData((prev) => ({ ...prev, sales_person_id: selectedOption }));
        }
    }, [customer, salesPersonOption, lang]);

    useEffect(() => {
        if (customer && courierOption.length > 0) {
            const selectedOption = convertToSingleOption(customer.preferred_shipping_id, courierOption);
            setFormData((prev) => ({ ...prev, preferred_shipping_id: selectedOption }));
        }
    }, [customer, courierOption, lang]);

    useEffect(() => {
        if (customer && taxGroupOption.length > 0) {
            const selectedOption = convertToSingleOption(customer.tax_group, taxGroupOption);
            setFormData((prev) => ({ ...prev, tax_group: selectedOption }));
        }
    }, [customer, taxGroupOption, lang]);

    useEffect(() => {
        if (customer && shippingTermsOption.length > 0) {
            const selectedOption = convertToSingleOption(customer.shipping_terms_id, shippingTermsOption);
            setFormData((prev) => ({ ...prev, shipping_terms_id: selectedOption }));
        }
    }, [customer, shippingTermsOption, lang]);

    useEffect(() => {
        if (customer && paymentTermsOption.length > 0) {
            const selectedOption = convertToSingleOption(customer.payment_terms_id, paymentTermsOption);
            setFormData((prev) => ({ ...prev, payment_terms_id: selectedOption }));
        }
    }, [customer, paymentTermsOption, lang]);

    useEffect(() => {
        if (customer && countriesOption.length > 0) {
            const selectedOption = convertToSingleOption(customer.billing_country, countriesOption);
            setFormData((prev) => ({ ...prev, billing_country: selectedOption }));

            const selectedOption2 = convertToSingleOption(customer.delivery_country, countriesOption);
            setFormData((prev) => ({ ...prev, delivery_country: selectedOption2 }));
        }
    }, [customer, countriesOption, lang]);

    useEffect(() => {
        if (customer && statesOption.length > 0) {
            const selectedOption = convertToSingleOption(customer.billing_state_id, statesOption);
            setFormData((prev) => ({ ...prev, billing_state_id: selectedOption }));

            const selectedOption2 = convertToSingleOption(customer.delivery_state_id, statesOption);
            setFormData((prev) => ({ ...prev, delivery_state_id: selectedOption2 }));
        }
    }, [customer, statesOption, lang]);

    useEffect(() => {
        setFormData((prev) => ({
            ...prev,
            is_copy_customerInfo: formData.is_copy_customerInfo,
            is_copy_data: formData.is_copy_data,
            is_new_customer_id: formData.is_new_customer_id,
        }));
    }, [formData.is_copy_customerInfo, formData.is_new_customer_id, formData.is_copy_data]);

    useEffect(() => {
        const customerKey = `${customerId}-cached-customers-orders`;
        const metaKey = `${customerId}-cached-meta-customer-orders`;

        const cachedCustomersRaw = localStorage.getItem(customerKey);
        const cachedMetaRaw = localStorage.getItem(metaKey);

        if (!cachedCustomersRaw || !cachedMetaRaw) {
            fetchCustomerOrder(currentPage_Order, itemsPerPage_Order, searchTerm_Order);
            return;
        }

        try {
            const cachedMeta = JSON.parse(cachedMetaRaw);
            const cachedCustomers = JSON.parse(cachedCustomersRaw);

            const isCacheValid = cachedMeta.page === currentPage_Order && cachedMeta.perPage === itemsPerPage_Order && cachedMeta.search === searchTerm_Order;

            if (isCacheValid) {
                setCustomerOrder(cachedCustomers);
                setTotalPages_Order(cachedMeta.totalPages);
                return;
            }
        } catch (err) {
            console.warn("Failed to parse cached meta:", err);
        }

        fetchCustomerOrder(currentPage_Order, itemsPerPage_Order, searchTerm_Order);
    }, [currentPage_Order, itemsPerPage_Order, searchTerm_Order, customerId]);

    useEffect(() => {
        const customerKey = `${customerId}-cached-customers-invoices`;
        const metaKey = `${customerId}-cached-meta-customer-invoices`;

        const cachedCustomersRaw = localStorage.getItem(customerKey);
        const cachedMetaRaw = localStorage.getItem(metaKey);

        if (!cachedCustomersRaw || !cachedMetaRaw) {
            fetchCustomerInvoices(currentPage_Invoices, itemsPerPage_Invoices, searchTerm_Invoices);
            return;
        }

        try {
            const cachedMeta = JSON.parse(cachedMetaRaw);
            const cachedCustomers = JSON.parse(cachedCustomersRaw);

            const isCacheValid = cachedMeta.page === currentPage_Invoices && cachedMeta.perPage === itemsPerPage_Invoices && cachedMeta.search === searchTerm_Invoices;

            if (isCacheValid) {
                setCustomerInvoices(cachedCustomers);
                setTotalPages_Invoices(cachedMeta.totalPages);
                return;
            }
        } catch (err) {
            console.warn("Failed to parse cached meta:", err);
        }

        fetchCustomerInvoices(currentPage_Invoices, itemsPerPage_Invoices, searchTerm_Invoices);
    }, [currentPage_Invoices, itemsPerPage_Invoices, searchTerm_Invoices, customerId]);

    useEffect(() => {
        const customerKey = customerSalesOrderKey;
        const metaKey = `${customerId}-cached-meta-customer-salesOrder`;

        const cachedCustomersRaw = localStorage.getItem(customerKey);
        const cachedMetaRaw = localStorage.getItem(metaKey);

        if (!cachedCustomersRaw || !cachedMetaRaw) {
            fetchCustomerSalesOrder(currentPage_SalesOrder, itemsPerPage_SalesOrder, searchTerm_SalesOrder);
            return;
        }

        try {
            const cachedMeta = JSON.parse(cachedMetaRaw);
            const cachedCustomers = JSON.parse(cachedCustomersRaw);

            const isCacheValid = cachedMeta.page === currentPage_SalesOrder && cachedMeta.perPage === itemsPerPage_SalesOrder && cachedMeta.search === searchTerm_SalesOrder;

            if (isCacheValid) {
                setCustomerSalesOrder(cachedCustomers);
                setTotalPages_SalesOrder(cachedMeta.totalPages);
                return;
            }
        } catch (err) {
            console.warn("Failed to parse cached meta:", err);
        }

        fetchCustomerSalesOrder(currentPage_SalesOrder, itemsPerPage_SalesOrder, searchTerm_SalesOrder);
    }, [currentPage_SalesOrder, itemsPerPage_SalesOrder, searchTerm_SalesOrder, customerId]);

    useEffect(() => {
        const customerKey = `${customerId}-cached-customers-deposit`;
        const metaKey = `${customerId}-cached-meta-customer-deposit`;

        const cachedCustomersRaw = localStorage.getItem(customerKey);
        const cachedMetaRaw = localStorage.getItem(metaKey);

        if (!cachedCustomersRaw || !cachedMetaRaw) {
            fetchCustomerDeposit(currentPage_Deposit, itemsPerPage_Deposit, searchTerm_Deposit);
            return;
        }

        try {
            const cachedMeta = JSON.parse(cachedMetaRaw);
            const cachedCustomers = JSON.parse(cachedCustomersRaw);

            const isCacheValid = cachedMeta.page === currentPage_Deposit && cachedMeta.perPage === itemsPerPage_Deposit && cachedMeta.search === searchTerm_Deposit;

            if (isCacheValid) {
                setCustomerDeposit(cachedCustomers);
                setTotalPages_Deposit(cachedMeta.totalPages);
                return;
            }
        } catch (err) {
            console.warn("Failed to parse cached meta:", err);
        }
        fetchCustomerDeposit(currentPage_Deposit, itemsPerPage_Deposit, searchTerm_Deposit);
    }, [currentPage_Deposit, itemsPerPage_Deposit, searchTerm_Deposit, customerId]);

    useEffect(() => {
        const customerKey = `${customerId}-cached-customers-profitability`;
        const metaKey = `${customerId}-cached-meta-customer-profitability`;

        const cachedCustomersRaw = localStorage.getItem(customerKey);
        const cachedMetaRaw = localStorage.getItem(metaKey);

        if (!cachedCustomersRaw || !cachedMetaRaw) {
            fetchCustomerProfitability(currentPage_Profitability, itemsPerPage_Profitability, searchTerm_Profitability);
            return;
        }

        try {
            const cachedMeta = JSON.parse(cachedMetaRaw);
            const cachedCustomers = JSON.parse(cachedCustomersRaw);

            const isCacheValid = cachedMeta.page === currentPage_Profitability && cachedMeta.perPage === itemsPerPage_Profitability && cachedMeta.search === searchTerm_Profitability;

            if (isCacheValid) {
                setCustomerProfitability(cachedCustomers);
                setTotalPages_Profitability(cachedMeta.totalPages);
                return;
            }
        } catch (err) {
            console.warn("Failed to parse cached meta:", err);
        }

        fetchCustomerProfitability(currentPage_Profitability, itemsPerPage_Profitability, searchTerm_Profitability);
    }, [currentPage_Profitability, itemsPerPage_Profitability, searchTerm_Profitability, customerId]);

    useEffect(() => {
        const customerKey = `${customerId}-cached-customers-orderHistory`;
        const metaKey = `${customerId}-cached-meta-customer-orderHistory`;

        const cachedCustomersRaw = localStorage.getItem(customerKey);
        const cachedMetaRaw = localStorage.getItem(metaKey);

        if (!cachedCustomersRaw || !cachedMetaRaw) {
            fetchCustomerOrderHistory(currentPage_OrderHistory, itemsPerPage_OrderHistory, searchTerm_OrderHistory);
            return;
        }

        try {
            const cachedMeta = JSON.parse(cachedMetaRaw);
            const cachedCustomers = JSON.parse(cachedCustomersRaw);

            const isCacheValid = cachedMeta.page === currentPage_OrderHistory && cachedMeta.perPage === itemsPerPage_OrderHistory && cachedMeta.search === searchTerm_OrderHistory;

            if (isCacheValid) {
                setCustomerOrderHistory(cachedCustomers);
                setTotalPages_OrderHistory(cachedMeta.totalPages);
                return;
            }
        } catch (err) {
            console.warn("Failed to parse cached meta:", err);
        }

        fetchCustomerOrderHistory(currentPage_OrderHistory, itemsPerPage_OrderHistory, searchTerm_OrderHistory);
    }, [currentPage_OrderHistory, itemsPerPage_OrderHistory, searchTerm_OrderHistory, customerId]);

    useEffect(() => {
        const customerKey = `${customerId}-cached-customers-credit`;
        const metaKey = `${customerId}-cached-meta-customer-credit`;

        const cachedCustomersRaw = localStorage.getItem(customerKey);
        const cachedMetaRaw = localStorage.getItem(metaKey);

        if (!cachedCustomersRaw || !cachedMetaRaw) {
            fetchCustomerCredit(currentPage_Credit, itemsPerPage_Credit, searchTerm_Credit);
            return;
        }

        try {
            const cachedMeta = JSON.parse(cachedMetaRaw);
            const cachedCustomers = JSON.parse(cachedCustomersRaw);

            const isCacheValid = cachedMeta.page === currentPage_Credit && cachedMeta.perPage === itemsPerPage_Credit && cachedMeta.search === searchTerm_Credit;

            if (isCacheValid) {
                setCustomerCredit(cachedCustomers);
                setTotalPages_Credit(cachedMeta.totalPages);
                return;
            }
        } catch (err) {
            console.warn("Failed to parse cached meta:", err);
        }

        fetchCustomerCredit(currentPage_Credit, itemsPerPage_Credit, searchTerm_Credit);
    }, [currentPage_Credit, itemsPerPage_Credit, searchTerm_Credit, customerId]);

    useEffect(() => {
        const customerKey = `${customerId}-cached-customers-refund`;
        const metaKey = `${customerId}-cached-meta-customer-refund`;

        const cachedCustomersRaw = localStorage.getItem(customerKey);
        const cachedMetaRaw = localStorage.getItem(metaKey);

        if (!cachedCustomersRaw || !cachedMetaRaw) {
            fetchCustomerRefund(currentPage_Refund, itemsPerPage_Refund, searchTerm_Refund);
            return;
        }

        try {
            const cachedMeta = JSON.parse(cachedMetaRaw);
            const cachedCustomers = JSON.parse(cachedCustomersRaw);

            const isCacheValid = cachedMeta.page === currentPage_Refund && cachedMeta.perPage === itemsPerPage_Refund && cachedMeta.search === searchTerm_Refund;

            if (isCacheValid) {
                setCustomerRefund(cachedCustomers);
                setTotalPages_Refund(cachedMeta.totalPages);
                return;
            }
        } catch (err) {
            console.warn("Failed to parse cached meta:", err);
        }

        fetchCustomerRefund(currentPage_Refund, itemsPerPage_Refund, searchTerm_Refund);
    }, [currentPage_Refund, itemsPerPage_Refund, searchTerm_Refund, customerId]);

    const fetchCustomerDetails = async () => {
        try {
            const idToUse = customerId !== 0 ? customerId : copiedCustomerId;
            if (!idToUse) {
                setLoading(false);
                return;
            }
            isDirtyRef.current = true; // 🔐 prevent dirty tracking
            setLoading(true);
            setError(null);

            const customerInfoKey = `${idToUse}-cached-customer-info`;
            const cachedCustomersRaw = localStorage.getItem(customerInfoKey);
            let foundCustomer;

            if (cachedCustomersRaw) {
                foundCustomer = JSON.parse(cachedCustomersRaw); // ✅ Parse cached JSON
            } else {
                foundCustomer = await customerService.getCustomerInfo(idToUse); // ✅ Fetch from API
            }
            if (foundCustomer) {
                setCustomer(foundCustomer);
                setFormData((prev) => ({
                    ...prev,
                    customer_code: foundCustomer.customer_code || "",
                    old_customer_code: foundCustomer.old_customer_code || "",
                    account_name_en: foundCustomer.account_name_en || "",
                    account_name_cn: foundCustomer.account_name_cn || "",
                    tel_no: foundCustomer.tel_no || "",
                    company_en: foundCustomer.company_en || "",
                    company_cn: foundCustomer.company_cn || "",
                    user_id: foundCustomer.user_id || "",
                    mobile: foundCustomer.mobile || "",
                    password: foundCustomer.password || "",
                    memo: foundCustomer.memo || "",
                    tax_ref_no: foundCustomer.tax_ref_no || "",
                    updated_at: foundCustomer.updated_at || "",
                    webpage_address: foundCustomer.webpage_address || "",
                    language: foundCustomer.language || "",

                    status: foundCustomer.status || 0,
                    is_view_new_order: foundCustomer.is_view_new_order || 0,
                    is_subscribe: foundCustomer.is_subscribe || 0,
                    is_new_inventory: foundCustomer.is_new_inventory || 0,

                    billing_address_en: foundCustomer.billing_address_en || "",
                    billing_address_cn: foundCustomer.billing_address_cn || "",
                    billing_name_en: foundCustomer.billing_name_en || "",
                    billing_name_cn: foundCustomer.billing_name_cn || "",
                    billing_postal_code: foundCustomer.billing_postal_code || "",
                    billing_country: foundCustomer.billing_country || null,
                    billing_state_id: foundCustomer.billing_state_id || null,
                    billing_tel_no: foundCustomer.billing_tel_no || "",
                    billing_fax_no: foundCustomer.billing_fax_no || "",

                    delivery_address_en: foundCustomer.delivery_address_en || "",
                    delivery_address_cn: foundCustomer.delivery_address_cn || "",
                    delivery_name_en: foundCustomer.delivery_name_en || "",
                    delivery_name_cn: foundCustomer.delivery_name_cn || "",
                    delivery_postal_code: foundCustomer.delivery_postal_code || "",
                    delivery_country: foundCustomer.delivery_country || null,
                    delivery_state_id: foundCustomer.delivery_state_id || null,
                    delivery_tel_no: foundCustomer.delivery_tel_no || "",
                    delivery_fax_no: foundCustomer.delivery_fax_no || "",
                    // Parse dates safely
                    customer_since: parseDate(foundCustomer.customer_since),
                }));

                // ✅ Only cache if it's a fresh fetch
                if (!cachedCustomersRaw) {
                    localStorage.setItem(customerInfoKey, JSON.stringify(foundCustomer));
                }
            } else {
                setError("Customer not found");
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to fetch Customer details");
            console.error("Error fetching Customer details:", err);
        } finally {
            setLoading(false);
            isDirtyRef.current = false; // ✅ re-enable dirty tracking
        }
    };
    const fetchCustomerEmails = async () => {
        try {
            const idToUse = customerId !== 0 ? customerId : copiedCustomerId;
            if (!idToUse) return;

            const cacheKey = `${idToUse}-cached-customer-emails`;
            const cachedCustomerEmailRaw = localStorage.getItem(cacheKey);

            let foundCustomerEmail;

            if (cachedCustomerEmailRaw) {
                foundCustomerEmail = JSON.parse(cachedCustomerEmailRaw);
            } else {
                foundCustomerEmail = await customerService.getCustomerEmails(idToUse);
                if (foundCustomerEmail && Array.isArray(foundCustomerEmail)) {
                    localStorage.setItem(cacheKey, JSON.stringify(foundCustomerEmail));
                }
            }

            if (foundCustomerEmail) {
                setEmailList(foundCustomerEmail);
            }
        } catch (error) {
            console.error("Failed to load wholesale pricing:", error);
        }
    };
    const fetchCustomerGroupsList = async () => {
        try {
            const idToUse = customerId !== 0 ? customerId : copiedCustomerId;
            if (!idToUse) return;

            const cacheKey = `${idToUse}-cached-customer-groups`;
            const cachedCustomerGroupRaw = localStorage.getItem(cacheKey);

            let foundCustomerGroup;
            if (cachedCustomerGroupRaw) {
                foundCustomerGroup = JSON.parse(cachedCustomerGroupRaw);
            } else {
                foundCustomerGroup = await customerService.getCustomerGroup(idToUse);
                if (foundCustomerGroup && Array.isArray(foundCustomerGroup)) {
                    localStorage.setItem(cacheKey, JSON.stringify(foundCustomerGroup));
                }
            }
            if (foundCustomerGroup) {
                setGroupList(foundCustomerGroup);
            }
        } catch (error) {
            console.error("Failed to load retail pricing:", error);
        }
    };
    const fetchCustomerOrder = async (page = currentPage_Order, perPage = itemsPerPage_Order, search = "") => {
        try {
            const idToUse = customerId !== 0 ? customerId : copiedCustomerId;
            if (!idToUse) return;

            const paginatedData = await customerService.getCustomerOrder(customerId, page, perPage, search);
            setCustomerOrderFooter(paginatedData.footer);
            setCustomerOrderFooter2(paginatedData.footer2);
            setCustomerOrder(paginatedData.data);
            setTotalPages_Order(paginatedData.last_page);
            localStorage.setItem(`${customerId}-cached-customers-orders`, JSON.stringify(paginatedData.data));
            localStorage.setItem(
                `${customerId}-cached-meta-customer-orders`,
                JSON.stringify({
                    page,
                    perPage,
                    search,
                    totalPages: paginatedData.last_page,
                    totalItems: paginatedData.total,
                })
            );
        } catch (error) {
            console.error("Failed to load customer by orders:", error);
        }
    };
    const fetchCustomerInvoices = async (page = currentPage_Invoices, perPage = itemsPerPage_Invoices, search = "") => {
        try {
            const idToUse = customerId !== 0 ? customerId : copiedCustomerId;
            if (!idToUse) return;

            const paginatedData = await customerService.getCustomerInvoices(customerId, page, perPage, search);
            // setCustomerInvoicesFooter(paginatedData.footer);
            setCustomerInvoices(paginatedData.data);
            setTotalPages_Invoices(paginatedData.last_page);
            localStorage.setItem(`${customerId}-cached-customers-invoices`, JSON.stringify(paginatedData.data));
            localStorage.setItem(
                `${customerId}-cached-meta-customer-invoices`,
                JSON.stringify({
                    page,
                    perPage,
                    search,
                    totalPages: paginatedData.last_page,
                    totalItems: paginatedData.total,
                })
            );
        } catch (error) {
            console.error("Failed to load customer by orders:", error);
        }
    };
    const fetchCustomerSalesOrder = async (page = currentPage_SalesOrder, perPage = itemsPerPage_SalesOrder, search = "") => {
        try {
            const idToUse = customerId !== 0 ? customerId : copiedCustomerId;
            if (!idToUse) return;

            const paginatedData = await customerService.getCustomerSalesOrder(customerId, page, perPage, search);
            // setCustomerSalesOrderFooter(paginatedData.footer);
            setCustomerSalesOrder(paginatedData.data);
            setTotalPages_SalesOrder(paginatedData.last_page);
            localStorage.setItem(`${customerId}-cached-customers-salesOrder`, JSON.stringify(paginatedData.data));
            localStorage.setItem(
                `${customerId}-cached-meta-customer-salesOrder`,
                JSON.stringify({
                    page,
                    perPage,
                    search,
                    totalPages: paginatedData.last_page,
                    totalItems: paginatedData.total,
                })
            );
        } catch (error) {
            console.error("Failed to load customer by orders:", error);
        }
    };
    const fetchCustomerDeposit = async (page = currentPage_Deposit, perPage = itemsPerPage_Deposit, search = "") => {
        try {
            const idToUse = customerId !== 0 ? customerId : copiedCustomerId;
            if (!idToUse) return;

            const paginatedData = await customerService.getCustomerDeposit(customerId, page, perPage, search);

            setCustomerDeposit(paginatedData.data);
            setTotalPages_Deposit(paginatedData.last_page);

            localStorage.setItem(`${customerId}-cached-customers-deposit`, JSON.stringify(paginatedData.data));
            localStorage.setItem(
                `${customerId}-cached-meta-customer-deposit`,
                JSON.stringify({
                    page,
                    perPage,
                    search,
                    totalPages: paginatedData.last_page,
                    totalItems: paginatedData.total,
                })
            );
        } catch (error) {
            console.error("Failed to load customer by orders:", error);
        }
    };
    const fetchCustomerProfitability = async (page = currentPage_Profitability, perPage = itemsPerPage_Profitability, search = "") => {
        try {
            const idToUse = customerId !== 0 ? customerId : copiedCustomerId;
            if (!idToUse) return;

            const paginatedData = await customerService.getCustomerProfitability(customerId, page, perPage, search);

            setCustomerProfitability(paginatedData.data);
            setTotalPages_Profitability(paginatedData.last_page);

            localStorage.setItem(`${customerId}-cached-customers-profitability`, JSON.stringify(paginatedData.data));
            localStorage.setItem(
                `${customerId}-cached-meta-customer-profitability`,
                JSON.stringify({
                    page,
                    perPage,
                    search,
                    totalPages: paginatedData.last_page,
                    totalItems: paginatedData.total,
                })
            );
        } catch (error) {
            console.error("Failed to load customer by orders:", error);
        }
    };
    const fetchCustomerOrderHistory = async (page = currentPage_OrderHistory, perPage = itemsPerPage_OrderHistory, search = "") => {
        try {
            const idToUse = customerId !== 0 ? customerId : copiedCustomerId;
            if (!idToUse) return;

            const paginatedData = await customerService.getCustomerOrderHistory(customerId, page, perPage, search);

            setCustomerOrderHistory(paginatedData.data);
            setTotalPages_OrderHistory(paginatedData.last_page);

            localStorage.setItem(`${customerId}-cached-customers-orderHistory`, JSON.stringify(paginatedData.data));
            localStorage.setItem(
                `${customerId}-cached-meta-customer-orderHistory`,
                JSON.stringify({
                    page,
                    perPage,
                    search,
                    totalPages: paginatedData.last_page,
                    totalItems: paginatedData.total,
                })
            );
        } catch (error) {
            console.error("Failed to load customer by orders:", error);
        }
    };
    const fetchCustomerCredit = async (page = currentPage_Credit, perPage = itemsPerPage_Credit, search = "") => {
        try {
            const idToUse = customerId !== 0 ? customerId : copiedCustomerId;
            if (!idToUse) return;

            const paginatedData = await customerService.getCustomerCredit(customerId, page, perPage, search);
            setCustomerCreditFooter(paginatedData.creditBalance);
            setCustomerCredit(paginatedData.data);
            setTotalPages_Credit(paginatedData.last_page);

            localStorage.setItem(`${customerId}-cached-customers-credit`, JSON.stringify(paginatedData.data));
            localStorage.setItem(
                `${customerId}-cached-meta-customer-credit`,
                JSON.stringify({
                    page,
                    perPage,
                    search,
                    totalPages: paginatedData.last_page,
                    totalItems: paginatedData.total,
                })
            );
        } catch (error) {
            console.error("Failed to load customer by orders:", error);
        }
    };
    const fetchCustomerRefund = async (page = currentPage_Refund, perPage = itemsPerPage_Refund, search = "") => {
        try {
            const idToUse = customerId !== 0 ? customerId : copiedCustomerId;
            if (!idToUse) return;

            const paginatedData = await customerService.getCustomerRefund(customerId, page, perPage, search);
            setCustomerRefund(paginatedData.data);
            setTotalPages_Refund(paginatedData.last_page);

            localStorage.setItem(`${customerId}-cached-customers-refund`, JSON.stringify(paginatedData.data));
            localStorage.setItem(
                `${customerId}-cached-meta-customer-refund`,
                JSON.stringify({
                    page,
                    perPage,
                    search,
                    totalPages: paginatedData.last_page,
                    totalItems: paginatedData.total,
                })
            );
        } catch (error) {
            console.error("Failed to load customer by orders:", error);
        }
    };

    const groupedSupplierCredit: Record<string, ApiCustomerCredit[]> = customerCredit.reduce((groups, item) => {
        const monthLabel = dayjs(item.transaction_date).format("YYYY MMMM");
        if (!groups[monthLabel]) {
            groups[monthLabel] = [];
        }
        groups[monthLabel].push(item);
        return groups;
    }, {} as Record<string, ApiCustomerCredit[]>);

    // Step 4: Sort records inside each month group DESCENDING
    Object.keys(groupedSupplierCredit).forEach((month) => {
        groupedSupplierCredit[month].sort((a, b) => dayjs(b.transaction_date).valueOf() - dayjs(a.transaction_date).valueOf());
    });

    // Step 5: Sort grouped months DESCENDING by max transaction_date inside each group
    const groupedEntries = Object.entries(groupedSupplierCredit).sort((a, b) => {
        const maxDateA = Math.max(...a[1].map((r) => dayjs(r.transaction_date).valueOf()));
        const maxDateB = Math.max(...b[1].map((r) => dayjs(r.transaction_date).valueOf()));
        return maxDateB - maxDateA;
    });

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
    const loadSource = async () => {
        try {
            const list = await fetchSource(); // fetches & returns
            setSourceData(list ?? []); // ✅ manually set state here
        } catch (err) {
            console.error("Failed to fetch loadSource:", err);
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
    const loadCustomerGroup = async () => {
        try {
            const list = await fetchCustomerGroups(); // fetches & returns
            setCustomerGroupData(list ?? []); // ✅ manually set state here
        } catch (err) {
            console.error("Failed to fetch loadCustomerGroup:", err);
        }
    };
    const updateCachedRaw = async (cachedType: string, custId: number) => {
        if (cachedType === "customerInfo") {
            const newData = await customerService.getCustomerInfo(custId);
            if (newData) {
                localStorage.setItem(customerInfoKey, JSON.stringify(newData));
            }
        }
        if (cachedType === "customerEmails") {
            const customerInfoKey = `${custId}-cached-customer-emails`;
            const newData = await customerService.getCustomerEmails(custId);
            if (newData) {
                localStorage.setItem(customerInfoKey, JSON.stringify(newData));
            }
        }
        if (cachedType === "customerGroups") {
            const customerGroupKey = `${custId}-cached-customer-groups`;
            const newData = await customerService.getCustomerGroup(custId);
            if (newData) {
                localStorage.setItem(customerGroupKey, JSON.stringify(newData));
            }
        }
    };
    const handleSave = async () => {
        setLoadingSave(true); // Disable the button
        const data = new FormData();
        const customerNameEn = formData["account_name_en"]?.toString().trim() ?? "";
        const customerNameCn = formData["account_name_cn"]?.toString().trim() ?? "";
        const companyEn = formData["company_en"]?.toString().trim() ?? "";
        const companyCn = formData["company_cn"]?.toString().trim() ?? "";
        const customerCode = formData["customer_code"]?.toString().trim() ?? "";
        const CustomerCodeOld = formData["old_customer_code"]?.toString().trim() ?? "";
        const userLanguage = formData["language"]?.toString().trim() ?? "";
        const customerType = formData["customer_type"]?.toString().trim() ?? "";
        const rwarehouse = formData["rwarehouse"]?.toString().trim() ?? "";
        const telNo = formData["tel_no"]?.toString().trim() ?? "";
        const accountNameEn = formData["account_name_en"]?.toString().trim() ?? "";
        const accountNameCn = formData["account_name_cn"]?.toString().trim() ?? "";

        if (!customerType) {
            showErrorToast(translations["Customer Type is required"] || "Customer Type is required");
            setLoadingSave(false); // Enable button again
            return;
        }
        if (!customerCode) {
            showErrorToast(translations["Customer Account Code is Required"]);
            setLoadingSave(false); // Enable button again
            return;
        }
        if (accountNameEn === "" && lang === "en") {
            showErrorToast(translations["Account Name is required"]);
            setLoadingSave(false); // Enable button again
            return;
        }
        if (accountNameCn === "" && lang === "cn") {
            showErrorToast(translations["Account Name is required"]);
            setLoadingSave(false); // Enable button again
            return;
        }
        if (!userLanguage) {
            showErrorToast(translations["User Language is required"]);
            setLoadingSave(false); // Enable button again
            return;
        }
        if (!rwarehouse) {
            showErrorToast(translations["Receiving Warehouse is required"]);
            setLoadingSave(false); // Enable button again
            return;
        }
        if (!telNo) {
            showErrorToast(translations["Contact No is required"]);
            setLoadingSave(false); // Enable button again
            return;
        }
        if (customerId === 0) {
            const countExist = await customerService.getCustomerExists(customerCode);
            if (countExist > 0 && customerId === 0) {
                showErrorToast(translations["This customer is already exists"]);
                setLoadingSave(false); // Enable button again
                return;
            }
        }
        if (customerCode != CustomerCodeOld && customerId != 0) {
            const confirmed = await showConfirm(translations["Account Code Update"], translations["Confirm Changing Customer Account Code"], translations["Delete"], translations["Cancel"]);
            if (!confirmed) {
                setLoadingSave(false); // Enable button again
                return;
            }
            if (confirmed) {
                formData["old_customer_code"] = customerCode;
            }
        }

        // Fallback: if Chinese title is missing, use English
        if (!formData["account_name_cn"] && safeLang === "en") {
            formData["account_name_cn"] = customerNameEn;
        }
        if (!formData["account_name_en"] && safeLang === "cn") {
            formData["account_name_en"] = customerNameCn;
        }

        if (!formData["company_cn"] && safeLang === "en") {
            formData["company_en"] = companyEn;
        }
        if (!formData["company_en"] && safeLang === "cn") {
            formData["company_en"] = companyCn;
        }

        if (customerId === 0) {
            formData["old_customer_code"] = formData["customer_code"];
        }

        const allEmails = emailList;
        allEmails.forEach((list) => {
            if (list) {
                if (list.email_address.length > 5) {
                    // Count character
                    data.append(
                        "emails[]",
                        JSON.stringify({
                            id: list.id,
                            customer_id: list.customer_id,
                            is_deleted: list.is_deleted,
                            email_address: list.email_address,
                            set_as_default: list.set_as_default ? 1 : 0,
                        })
                    );
                }
            }
        });

        let countGroupDefault = 0;
        const allGroups = groupList;
        allGroups.forEach((list) => {
            if (list) {
                data.append(
                    "groups[]",
                    JSON.stringify({
                        id: list.id,
                        customer_id: list.customer_id,
                        is_deleted: list.is_deleted,
                        customer_group_id: list.customer_group_id,
                        set_as_default: list.set_as_default ? 1 : 0,
                    })
                );
                if (list.set_as_default) {
                    countGroupDefault++;
                }
            }
        });
        if (allGroups.length === 0) {
            showErrorToast(translations["Customer Group is required"]);
            setLoadingSave(false); // Enable button again
            return;
        }
        if (countGroupDefault === 0) {
            showErrorToast(translations["Please set at least 1 default group"] || "Please set at least 1 default group");
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
            const result = await customerService.updateCustomer(customerId, data);
            const newId = result?.id;
            if ((saveType === "new" || saveType === "copy") && newId) {
                onChangeCustomerId(newId);
                onChangeSaveType("edit");
                setCopiedCustomerId(null);
            }
            // Reset state to allow re-initialization after refetch
            setIsDirty(false);
            setIsInitialized(false);
            // Set state (this is async)
            setFormData((prev) => ({
                ...prev,
                is_copy_group: false,
                is_copy_customerInfo: false,
                is_new_customer_id: 0,
                is_copy_media: false,
                is_copy_data: false,
            }));

            const updatedTabId = tabId.replace("info", "list");
            localStorage.removeItem(`${updatedTabId}-cached-customers`);

            await updateCachedRaw("customerInfo", newId);
            await updateCachedRaw("customerGroups", newId);
            await updateCachedRaw("customerEmails", newId);
            showSuccessToast(translations["Customer Successfully Saved"]);
            onSave(); // This will now trigger the cache clearing in the parent
        } catch (error) {
            showErrorToast(translations["Failed to save Customer."] || "Failed to save Customer.");
        } finally {
            setLoadingSave(false); // Enable button again after the operation is done
        }
    };
    const handleAddNew = async () => {
        onChangeCustomerId(0);
        onChangeSaveType("new");
        setIsDirty(false);
        isDirtyRef.current = false;
    };
    const clearForms = () => {
        const initialFormData = {
            customer_code: "",
            old_customer_code: "",
            copy_customer_code: "",
            account_name_en: "",
            account_name_cn: "",

            billing_address_en: "",
            billing_address_cn: "",
            billing_name_en: "",
            billing_name_cn: "",
            billing_postal_code: "",
            billing_country: null as OptionType | null,
            billing_state_id: null as OptionType | null,
            billing_tel_no: "",
            billing_fax_no: "",

            delivery_address_en: "",
            delivery_address_cn: "",
            delivery_name_en: "",
            delivery_name_cn: "",
            delivery_postal_code: "",
            delivery_country: null as OptionType | null,
            delivery_state_id: null as OptionType | null,
            delivery_tel_no: "",
            delivery_fax_no: "",

            company_en: "",
            company_cn: "",
            email_address: "",
            webpage_address: "",
            status: 0,
            customer_since: null as Date | null,
            currency: null as OptionType | null,
            memo: "",
            shipping_address: "",
            credit_limit: "",
            price_level: "",
            sales_person_id: null as OptionType | null,
            payment_terms_id: null as OptionType | null,
            preferred_shipping_id: null as OptionType | null,
            shipping_terms_id: null as OptionType | null,
            source_id: null as OptionType | null,
            tax_group: null as OptionType | null,
            customer_type: null as OptionType | null,
            pod: null as OptionType | null,
            rwarehouse: null as OptionType | null,
            user_id: "",
            tax_ref_no: "",
            updated_at: "",
            mobile: "",
            password: "",
            tel_no: "",
            language: "",
            is_view_new_order: 0,
            is_subscribe: 0,
            is_new_inventory: 0,
            is_copy_billing: 0,
            groups: [] as OptionType[],
            is_copy_customerInfo: false,
            is_new_customer_id: 0,
            is_copy_data: false,
        };
        setFormData(initialFormData);
    };
    const handleCopy = () => {
        if (saveType == "new" || saveType == "copy") {
            showErrorToast(translations["Cannot copy, Invalid data"] || "Cannot copy, Unfinished data");
            return;
        }
        setShowCopyCustomer(true);
    };
    const processCopy = (newCustomerCode: string, copyFields: Record<string, boolean>, copySelectAll: Record<string, boolean>, rawArray: Record<string, boolean>) => {
        const sourceFormData = formData;
        const keyCount = Object.keys(rawArray).length;

        if (copyFields["Customer Group"] === false) {
            setGroupList([]);
        }
        setEmailList([]);
        onChangeCustomerId(0);
        onChangeSaveType("copy");

        setTimeout(() => {
            clearForms();
            let preferred_shipping_id: OptionType | null = null;
            let shipping_terms_id: OptionType | null = null;
            let pod: OptionType | null = null;
            let billing_country: OptionType | null = null;
            let delivery_country: OptionType | null = null;
            let billing_state_id: OptionType | null = null;
            let delivery_state_id: OptionType | null = null;
            let rwarehouse: OptionType | null = null;
            let sales_person_id: OptionType | null = null;
            let customer_type: OptionType | null = null;
            let tax_group: OptionType | null = null;
            let language: string;

            if (keyCount === 0) {
                preferred_shipping_id = sourceFormData.preferred_shipping_id;
                shipping_terms_id = sourceFormData.shipping_terms_id;
                pod = sourceFormData.pod;
                billing_country = sourceFormData.billing_country;
                delivery_country = sourceFormData.delivery_country;
                billing_state_id = sourceFormData.billing_state_id;
                delivery_state_id = sourceFormData.delivery_state_id;
                rwarehouse = sourceFormData.rwarehouse;
                sales_person_id = sourceFormData.sales_person_id;
                customer_type = sourceFormData.customer_type;
                tax_group = sourceFormData.tax_group;
                language = sourceFormData.language;
            } else {
                preferred_shipping_id = isValidOption(rawArray["preferred_shipping_id"]) ? rawArray["preferred_shipping_id"] : null;
                shipping_terms_id = isValidOption(rawArray["shipping_terms_id"]) ? rawArray["shipping_terms_id"] : null;
                pod = isValidOption(rawArray["pod"]) ? rawArray["pod"] : null;
                billing_country = isValidOption(rawArray["billing_country"]) ? rawArray["billing_country"] : null;
                delivery_country = isValidOption(rawArray["delivery_country"]) ? rawArray["delivery_country"] : null;
                billing_state_id = isValidOption(rawArray["billing_state_id"]) ? rawArray["billing_state_id"] : null;
                delivery_state_id = isValidOption(rawArray["delivery_state_id"]) ? rawArray["delivery_state_id"] : null;
                rwarehouse = isValidOption(rawArray["rwarehouse"]) ? rawArray["rwarehouse"] : null;
                sales_person_id = isValidOption(rawArray["sales_person_id"]) ? rawArray["sales_person_id"] : null;
                customer_type = isValidOption(rawArray["customer_type"]) ? rawArray["customer_type"] : null;
                tax_group = isValidOption(rawArray["tax_group"]) ? rawArray["tax_group"] : null;
                // Ensure 'language' is a string or null, not a boolean
                if (typeof rawArray["language"] === "string") {
                    language = rawArray["language"];
                } else {
                    language = ""; // Handle if it's not a string, you could also use a default string here if needed
                }
            }

            setFormData((prevState) => ({
                ...prevState,
                preferred_shipping_id: copyFields["Preferred Shipping"] ? preferred_shipping_id : null,
                shipping_terms_id: copyFields["Shipping Terms"] ? shipping_terms_id : null,
                pod: copyFields["Point of Delivery"] ? pod : null,
                billing_country: copyFields["Country"] ? billing_country : null,
                delivery_country: copyFields["Country"] ? delivery_country : null,
                billing_state_id: copyFields["State"] ? billing_state_id : null,
                delivery_state_id: copyFields["State"] ? delivery_state_id : null,
                rwarehouse: copyFields["Receiving Warehouse"] ? rwarehouse : null,
                sales_person_id: copyFields["Sales Person"] ? sales_person_id : null,
                customer_type: copyFields["Customer Type"] ? customer_type : null,
                tax_group: copyFields["Tax Group"] ? tax_group : null,
                language: copyFields["User Language"] ? language : "",
                customer_code: newCustomerCode,
                old_customer_code: newCustomerCode,
                copy_customer_code: newCustomerCode,
                is_copy_group: copyFields["Customer Group"],
                is_copy_customerInfo: copySelectAll["customerInfo"],
                is_copy_data: true,
                is_new_customer_id: customerId,
            }));
        }, 300);
        showSuccessToast(translations["Customer ready to be saved as a copy."] || "Customer ready to be saved as a copy.");
    };
    const handleCopyCustomer = async () => {
        const newCustomerCode = formData.copy_customer_code?.toString().trim() ?? "";
        if (!newCustomerCode) {
            showErrorToast(translations["Customer Account Empty"]);
            return;
        }
        const countExist = await customerService.getCustomerExists(newCustomerCode);
        if (countExist > 0) {
            showErrorToast(translations["This customer is already exists"]);
            return;
        }

        setShowCopyCustomer(false);
        processCopy(newCustomerCode, fields, selectAll, {});
    };
    const handleDelete = async () => {
        const selectedCustomers = [customerId];
        if (selectedCustomers.length === 0) return;

        const confirmed = await showConfirm(translations["System Message"], translations["Are you sure you want to delete selected items?"], translations["Delete"], translations["Cancel"]);

        if (!confirmed) return;
        try {
            await customerService.deleteCustomers(selectedCustomers, "soft");
            showSuccessToast(translations["Record has been Deleted"]);

            onChangeCustomerId(0); // Notify parent about new customer ID
            onChangeSaveType("new");

            // Delay logic to allow re-render with customerId = 0
            setTimeout(async () => {
                setIsDirty(false);
                setIsInitialized(false);

                const customerInfoKey = `${customerId}-cached-customer-info`;
                const customerOrderKey = `${customerId}-cached-customer-order`;
                const customerInvoicesKey = `${customerId}-cached-customer-invoices`;
                const customerSalesOrderKey = `${customerId}-cached-customer-salesOrder`;
                const customerDepositKey = `${customerId}-cached-customer-deposit`;
                const customerProfitabilityKey = `${customerId}-cached-customer-profitability`;
                const customerOrderHistoryKey = `${customerId}-cached-customer-orderHistory`;
                const customerCreditKey = `${customerId}-cached-customer-credit`;
                const customerRefundKey = `${customerId}-cached-customer-refund`;
                const updatedTabId = tabId.replace("details", "list");

                localStorage.removeItem(customerInfoKey);
                localStorage.removeItem(customerOrderKey);
                localStorage.removeItem(customerInvoicesKey);
                localStorage.removeItem(customerSalesOrderKey);
                localStorage.removeItem(customerDepositKey);
                localStorage.removeItem(customerProfitabilityKey);
                localStorage.removeItem(customerOrderHistoryKey);
                localStorage.removeItem(customerCreditKey);
                localStorage.removeItem(customerRefundKey);
                localStorage.removeItem(`${updatedTabId}-cached-customers`);

                onSave();
            }, 200);
        } catch (err) {
            showErrorToast(translations["alert_message_18"]);
            console.error("Deletion failed:", err);
        }
    };
    const handleToggleRow_Orders = async (tableId: number) => {
        const isExpanded = expanded_Orders.includes(tableId);
        const cachedKey = `cached-orders-details-${tableId}`;

        if (isExpanded) {
            // Collapse row
            setExpandedRows_Orders(expanded_Orders.filter((id) => id !== tableId));
        } else {
            // Expand row
            setExpandedRows_Orders([...expanded_Orders, tableId]);

            // Try to get from localStorage first
            const cachedData = localStorage.getItem(cachedKey);

            if (cachedData) {
                // If cache exists, parse and set it
                setOrderDetailsMap((prev) => ({ ...prev, [tableId]: JSON.parse(cachedData) }));
            } else {
                // If no cache, fetch from API
                try {
                    const data = await customerService.getCustomerOrderDetails(tableId);
                    // Save to state
                    setOrderDetailsMap((prev) => ({ ...prev, [tableId]: data }));
                    // Save to localStorage
                    localStorage.setItem(cachedKey, JSON.stringify(data));
                } catch (error) {
                    console.error(`Failed to load details for product ${tableId}`, error);
                    setOrderDetailsMap((prev) => ({ ...prev, [tableId]: null }));
                }
            }
        }
    };
    const handleToggleRow_Invoices = async (tableId: number, invoiceNo: string) => {
        const isExpanded = expanded_Invoices.includes(tableId);
        var cachedKey = `cached-invoices-details-${tableId}`;

        if (isExpanded) {
            // Collapse row
            setExpandedRows_Invoices(expanded_Invoices.filter((id) => id !== tableId));
        } else {
            // Expand row
            setExpandedRows_Invoices([...expanded_Invoices, tableId]);

            // Try to get from localStorage first
            const cachedData = localStorage.getItem(cachedKey);

            if (cachedData) {
                // If cache exists, parse and set it
                setInvoicesDetailsMap((prev) => ({ ...prev, [tableId]: JSON.parse(cachedData) }));
            } else {
                // If no cache, fetch from API
                try {
                    const data = await customerService.getCustomerInvoiceDetails(invoiceNo);
                    // Save to state
                    setInvoicesDetailsMap((prev) => ({ ...prev, [tableId]: data }));
                    // Save to localStorage
                    localStorage.setItem(cachedKey, JSON.stringify(data));
                } catch (error) {
                    console.error(`Failed to load details for invoices ${tableId}`, error);
                    setInvoicesDetailsMap((prev) => ({ ...prev, [tableId]: null }));
                }
            }
        }
    };
    const handleToggleRow_SalesOrder = async (tableId: number, soNumber: string) => {
        const isExpanded = expanded_SalesOrder.includes(tableId);
        var cachedKey = `cached-so-details-${tableId}`;

        if (isExpanded) {
            // Collapse row
            setExpandedRows_SalesOrder(expanded_SalesOrder.filter((id) => id !== tableId));
        } else {
            // Expand row
            setExpandedRows_SalesOrder([...expanded_SalesOrder, tableId]);

            // Try to get from localStorage first
            const cachedData = localStorage.getItem(cachedKey);

            if (cachedData) {
                // If cache exists, parse and set it
                setSalesOrderDetailsMap((prev) => ({ ...prev, [tableId]: JSON.parse(cachedData) }));
            } else {
                // If no cache, fetch from API
                try {
                    const data = await customerService.getCustomerSODetails(soNumber);
                    // Save to state
                    setSalesOrderDetailsMap((prev) => ({ ...prev, [tableId]: data }));
                    // Save to localStorage
                    localStorage.setItem(cachedKey, JSON.stringify(data));
                } catch (error) {
                    console.error(`Failed to load details for sales order ${tableId}`, error);
                    setSalesOrderDetailsMap((prev) => ({ ...prev, [tableId]: null }));
                }
            }
        }
    };
    const handleToggleRow_Deposit = async (tableId: number, rvNo: string, type: string) => {
        const isExpanded = expanded_Deposit.includes(tableId);
        var cachedKey = `cached-deposit-details-${tableId}`;

        if (isExpanded) {
            // Collapse row
            setExpandedRows_Deposit(expanded_Deposit.filter((id) => id !== tableId));
        } else {
            // Expand row
            setExpandedRows_Deposit([...expanded_Deposit, tableId]);

            // Try to get from localStorage first
            const cachedData = localStorage.getItem(cachedKey);

            if (cachedData) {
                // If cache exists, parse and set it
                setDepositDetailsMap((prev) => ({ ...prev, [tableId]: JSON.parse(cachedData) }));
            } else {
                // If no cache, fetch from API
                try {
                    const data = await customerService.getDepositDetails(rvNo, type);
                    // Save to state
                    setDepositDetailsMap((prev) => ({ ...prev, [tableId]: data }));
                    // Save to localStorage
                    localStorage.setItem(cachedKey, JSON.stringify(data));
                } catch (error) {
                    console.error(`Failed to load details for deposit ${tableId}`, error);
                    setDepositDetailsMap((prev) => ({ ...prev, [tableId]: null }));
                }
            }
        }
    };
    const handleToggleRow_Profitability = async (tableId: number, invoiceNo: string) => {
        const isExpanded = expanded_Profitability.includes(tableId);
        var cachedKey = `cached-profitability-details-${tableId}`;

        if (isExpanded) {
            // Collapse row
            setExpandedRows_Profitability(expanded_Profitability.filter((id) => id !== tableId));
        } else {
            // Expand row
            setExpandedRows_Profitability([...expanded_Profitability, tableId]);

            // Try to get from localStorage first
            const cachedData = localStorage.getItem(cachedKey);

            if (cachedData) {
                // If cache exists, parse and set it
                setProfitabilityDetailsMap((prev) => ({ ...prev, [tableId]: JSON.parse(cachedData) }));
            } else {
                // If no cache, fetch from API
                try {
                    const data = await customerService.getCustomerInvoiceDetails(invoiceNo);
                    // Save to state
                    setProfitabilityDetailsMap((prev) => ({ ...prev, [tableId]: data }));
                    // Save to localStorage
                    localStorage.setItem(cachedKey, JSON.stringify(data));
                } catch (error) {
                    console.error(`Failed to load details for invoices ${tableId}`, error);
                    setProfitabilityDetailsMap((prev) => ({ ...prev, [tableId]: null }));
                }
            }
        }
    };
    const handleToggleRow_OrderHistory = async (tableId: number, invoiceNo: string) => {
        const isExpanded = expanded_OrderHistory.includes(tableId);
        var cachedKey = `cached-order-history-details-${tableId}`;

        if (isExpanded) {
            // Collapse row
            setExpandedRows_OrderHistory(expanded_OrderHistory.filter((id) => id !== tableId));
        } else {
            // Expand row
            setExpandedRows_OrderHistory([...expanded_OrderHistory, tableId]);

            // Try to get from localStorage first
            const cachedData = localStorage.getItem(cachedKey);

            if (cachedData) {
                // If cache exists, parse and set it
                setOrderHistoryDetailsMap((prev) => ({ ...prev, [tableId]: JSON.parse(cachedData) }));
            } else {
                // If no cache, fetch from API
                try {
                    const data = await customerService.getCustomerInvoiceDetails(invoiceNo);
                    // Save to state
                    setOrderHistoryDetailsMap((prev) => ({ ...prev, [tableId]: data }));
                    // Save to localStorage
                    localStorage.setItem(cachedKey, JSON.stringify(data));
                } catch (error) {
                    console.error(`Failed to load details for order history ${tableId}`, error);
                    setOrderHistoryDetailsMap((prev) => ({ ...prev, [tableId]: null }));
                }
            }
        }
    };
    const handleToggleRow_Credit = async (tableId: number, refNumber: string, type: string) => {
        const isExpanded = expanded_Credits.includes(tableId);
        var cachedKey = `cached-order-history-details-${tableId}`;
        if (isExpanded) {
            // Collapse row
            setExpandedRows_Credits(expanded_Credits.filter((id) => id !== tableId));
        } else {
            // Expand row
            setExpandedRows_Credits([...expanded_Credits, tableId]);

            // Try to get from localStorage first
            const cachedData = localStorage.getItem(cachedKey);

            if (cachedData) {
                // If cache exists, parse and set it
                setCreditDetailsMap((prev) => ({ ...prev, [tableId]: JSON.parse(cachedData) }));
            } else {
                // If no cache, fetch from API
                try {
                    const data = await customerService.getCreditDetails(refNumber, type);
                    // Save to state
                    setCreditDetailsMap((prev) => ({ ...prev, [tableId]: data }));
                    // Save to localStorage
                    localStorage.setItem(cachedKey, JSON.stringify(data));
                } catch (error) {
                    console.error(`Failed to load details for credit ${tableId}`, error);
                    setCreditDetailsMap((prev) => ({ ...prev, [tableId]: null }));
                }
            }
        }
    };
    // Get all images for gallery with stable IDs
    const tabs = [
        { id: "information", label: translations["Customer Information"] },
        { id: "orders", label: translations["Orders"] },
        { id: "invoices", label: translations["Invoices"] },
        { id: "sales-order", label: translations["Sales Order"] },
        { id: "deposit", label: translations["Deposit"] },
        { id: "profitability", label: translations["Profitability"] },
        { id: "order-history", label: translations["Order History"] },
        { id: "credit", label: translations["Credits2"] },
        { id: "refund", label: translations["Refund"] },
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
    if ((error || !customer) && saveType !== "new") {
        return (
            <div className="min-h-screen" style={{ backgroundColor: "#1a1a1a" }}>
                <div className="p-6">
                    <button onClick={onBack} className="flex items-center space-x-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-[#ffffffcc] text-custom-sm rounded-lg transition-colors mb-4">
                        <ArrowLeft className="h-4 w-4" />
                        <span>{translations["Back"]}</span>
                    </button>
                    <div className="text-center py-12">
                        <div className="text-red-400 text-lg mb-2">{error || "customer not found"}</div>
                        <p className="text-gray-400">The customer you're looking for doesn't exist or couldn't be loaded.</p>
                    </div>
                </div>
            </div>
        );
    }
    const renderCustomerInformation = () => (
        <div className="p-1 bg-[#19191c] rounded-xl">
            <div className="h-[calc(100vh-150px)] overflow-y-auto pr-2">
                <div className="grid gap-4">
                    {/* customer Code Section */}
                    <div className="grid grid-cols-12 gap-4">
                        <div className="col-span-3 p-1">
                            <fieldset className="border-[1px] border-[#ffffff1a] rounded-lg p-4 space-y-4">
                                {/* Toggles */}
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <span className="text-[#ffffffcc] text-custom-sm font-medium">{translations["Status"]}</span>
                                            <span className={`text-sm ml-2 ${Number(formData.status) === 1 ? "text-green-400" : "text-red-400"}`}>
                                                {Number(formData.status) === 1 ? translations["Active"] : translations["In-Active"]}
                                            </span>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={Number(formData.status) === 1}
                                                onChange={(e) => {
                                                    const isChecked = e.target.checked ? 1 : 0;
                                                    setFormData({ ...formData, status: isChecked });
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
                                            <span className="text-[#ffffffcc] text-custom-sm font-medium">{translations["subscribe"]}</span>
                                            <span className={`text-sm ml-2 ${Number(formData.is_subscribe) === 1 ? "text-green-400" : "text-red-400"}`}>
                                                {Number(formData.is_subscribe) === 1 ? translations["Active"] : translations["In-Active"]}
                                            </span>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={Number(formData.status) === 1 ? Number(formData.is_subscribe) === 1 : false}
                                                onChange={(e) => {
                                                    const isChecked = e.target.checked ? 1 : 0;

                                                    // Update is_subscribe only when status is 1
                                                    if (Number(formData.status) === 1) {
                                                        setFormData({ ...formData, is_subscribe: isChecked });
                                                    } else {
                                                        // Set is_subscribe to 0 if status is 0
                                                        setFormData({ ...formData, is_subscribe: 0 });
                                                    }

                                                    // Track if the form is dirty
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
                                            <span className="text-[#ffffffcc] text-custom-sm font-medium">{translations["View New Orders"]}</span>
                                            <span className={`text-sm ml-2 ${Number(formData.is_view_new_order) === 1 ? "text-green-400" : "text-red-400"}`}>
                                                {Number(formData.is_view_new_order) === 1 ? translations["Active"] : translations["In-Active"]}
                                            </span>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={Number(formData.is_view_new_order) === 1}
                                                onChange={(e) => {
                                                    const isChecked = e.target.checked ? 1 : 0;
                                                    setFormData({ ...formData, is_view_new_order: isChecked });
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
                                            <span className="text-[#ffffffcc] text-custom-sm font-medium">{translations["View Inventory"]}</span>
                                            <span className={`text-sm ml-2 ${Number(formData.is_new_inventory) === 1 ? "text-green-400" : "text-red-400"}`}>
                                                {Number(formData.is_new_inventory) === 1 ? translations["Active"] : translations["In-Active"]}
                                            </span>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={Number(formData.is_new_inventory) === 1}
                                                onChange={(e) => {
                                                    const isChecked = e.target.checked ? 1 : 0;
                                                    setFormData({ ...formData, is_new_inventory: isChecked });
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
                                </div>
                            </fieldset>
                            {/* Body with list */}
                            <div className="text-gray-200 space-y-2">
                                <div className="bg-transparent border border-[#ffffff1a] rounded-xl shadow-md overflow-hidden mt-5">
                                    {/* Header */}
                                    <div className="flex items-center justify-between px-4 py-4 border-b border-gray-700">
                                        <div className="text-gray-200 font-medium text-sm">{translations["Email Address"] ?? "Email Address"}</div>
                                        <button
                                            disabled={formData.customer_type?.value === "RC" && emailList.length === 1}
                                            className="px-3 py-1.5 text-sm bg-cyan-600 hover:bg-cyan-700 text-[#ffffffcc] text-custom-sm rounded-md"
                                            onClick={handleAddEmail}
                                        >
                                            {translations["Add"] ?? "Add"}
                                        </button>
                                    </div>

                                    {/* Body */}
                                    <div className="px-2 py-2 text-gray-200 space-y-1">
                                        {emailList.length === 0 ? (
                                            <p className="text-gray-400 italic text-sm">{translations["No emails added yet"] ?? "No emails added yet"}</p>
                                        ) : (
                                            emailList.map(
                                                (item) =>
                                                    item.is_deleted !== 1 && (
                                                        <div key={item.indexInt} className="flex items-center justify-between gap-3 px-2 rounded-md">
                                                            <div className="flex-1">
                                                                <input
                                                                    type="email"
                                                                    value={item.email_address}
                                                                    onChange={(e) => handleEmailChange(item.indexInt, e.target.value)}
                                                                    className="w-full px-3 py-1.5 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-sm rounded"
                                                                />
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                {item.set_as_default ? (
                                                                    <button className="px-1 py-1 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-xs">
                                                                        <ThumbsUp className="h-4 w-4" />
                                                                    </button>
                                                                ) : (
                                                                    <button
                                                                        onClick={() => handleSetDefault(item.indexInt)}
                                                                        className="px-1 py-1 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors text-xs"
                                                                    >
                                                                        <ThumbsDown className="h-4 w-4" />
                                                                    </button>
                                                                )}
                                                                <button
                                                                    onClick={() => handleRemoveEmail(item.indexInt)}
                                                                    className="px-1 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-xs"
                                                                >
                                                                    <X className="h-4 w-4" />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    )
                                            )
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="text-gray-200 space-y-2">
                                <div className="bg-transparent border border-[#ffffff1a] rounded-xl shadow-md overflow-visible mt-5">
                                    {/* Header */}
                                    <div className="flex items-center justify-between px-4 py-4 border-b border-gray-700">
                                        <div className="text-gray-200 font-medium text-sm">{translations["Customer group"] ?? "Customer group"}</div>
                                        <button className="px-3 py-1.5 text-sm bg-cyan-600 hover:bg-cyan-700 text-[#ffffffcc] text-custom-sm rounded-md" onClick={handleAddEmail_group}>
                                            {translations["Add"] ?? "Add"}
                                        </button>
                                    </div>

                                    {/* Body */}
                                    <div className="px-2 py-2 text-gray-200 space-y-1">
                                        {groupList.length === 0 ? (
                                            <p className="text-gray-400 italic text-sm">{translations["No groups added yet"] ?? "No groups added yet"}</p>
                                        ) : (
                                            groupList.map(
                                                (item) =>
                                                    item.is_deleted !== 1 && (
                                                        <div key={item.indexInt} className="flex items-center justify-between gap-3 px-2 rounded-md">
                                                            <div className="flex-1">
                                                                <Select
                                                                    classNamePrefix="react-select"
                                                                    value={customerGroupOption.find((option) => option.value === item.customer_group_id?.toString()) ?? null}
                                                                    onChange={(selected) => handleGroupChange(item.id, item.indexInt, selected)}
                                                                    options={customerGroupOption}
                                                                    styles={{
                                                                        ...selectStyles,
                                                                        menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                                                                    }}
                                                                    className="w-full"
                                                                    isClearable
                                                                    placeholder={translations["Select"]}
                                                                    menuPlacement="auto"
                                                                    menuPosition="fixed"
                                                                    menuPortalTarget={typeof window !== "undefined" ? document.body : null}
                                                                />
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                {item.set_as_default ? (
                                                                    <button className="px-1 py-1 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-xs">
                                                                        <ThumbsUp className="h-4 w-4" />
                                                                    </button>
                                                                ) : (
                                                                    <button
                                                                        onClick={() => handleSetDefault_group(item.indexInt)}
                                                                        className="px-1 py-1 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors text-xs"
                                                                    >
                                                                        <ThumbsDown className="h-4 w-4" />
                                                                    </button>
                                                                )}
                                                                <button
                                                                    onClick={() => handleRemoveEmail_group(item.indexInt)}
                                                                    className="px-1 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-xs"
                                                                >
                                                                    <X className="h-4 w-4" />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    )
                                            )
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                        {/* Right side: 8 columns */}
                        <div className="col-span-9 p-1">
                            <fieldset className="grid grid-cols-12 gap-4 border-[1px] border-[#ffffff1a] rounded-lg p-4 mb-2">
                                <div className="col-span-12 md:col-span-6">
                                    <div className="flex items-center space-x-4 mb-2">
                                        <label className="w-[26%] text-gray-400 text-sm">{translations["Customer Type"]}</label>
                                        <Select
                                            classNamePrefix="react-select"
                                            value={formData.customer_type}
                                            onChange={(selected) => {
                                                setFormData({ ...formData, customer_type: selected as OptionType | null });
                                                if (!isDirtyRef.current) {
                                                    setIsDirty(true); // ✅ only if user is editing
                                                }
                                            }}
                                            options={customerTypeOptions}
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
                                        <label className="w-[25%] text-gray-400 text-sm">{translations["Customer Code"]}</label>
                                        <input
                                            type="text"
                                            value={formData.customer_code}
                                            onChange={(e) => {
                                                const value = e.target.value;
                                                setFormData((prev) => ({ ...prev, customer_code: value }));
                                                if (!isDirtyRef.current) setIsDirty(true);
                                            }}
                                            className="flex-1 px-3 py-2 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm"
                                        />
                                        <input type="hidden" value={formData.old_customer_code} onChange={(e) => setFormData((prev) => ({ ...prev, old_customer_code: e.target.value }))} />
                                    </div>
                                    <div className="flex items-center space-x-4 mb-2">
                                        <label className="w-[25%] text-gray-400 text-sm">{translations["Contact No"]}</label>
                                        <input
                                            type="text"
                                            value={formData.tel_no}
                                            onChange={(e) => {
                                                const value = e.target.value;
                                                setFormData((prev) => ({ ...prev, tel_no: value }));
                                                if (!isDirtyRef.current) setIsDirty(true);
                                            }}
                                            className="flex-1 px-3 py-2 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm"
                                        />
                                    </div>
                                    <div className="flex items-center space-x-4 mb-2">
                                        <label className="w-[26%] text-gray-400 text-sm">{translations["User Language"]}</label>
                                        <Select
                                            value={languageOptions.find((o) => o.value === String(formData.language))}
                                            onChange={(selected) => {
                                                setFormData({ ...formData, language: selected ? String(selected.value) : "0" });
                                                if (!isDirtyRef.current) {
                                                    setIsDirty(true); // ✅ only if user is editing
                                                }
                                            }}
                                            classNamePrefix="react-select"
                                            options={languageOptions}
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
                                        <label className="w-[26%] text-gray-400 text-sm">{translations["Source"]}</label>
                                        <Select
                                            classNamePrefix="react-select"
                                            value={formData.source_id}
                                            onChange={(selected) => {
                                                setFormData({ ...formData, source_id: selected as OptionType | null });
                                                if (!isDirtyRef.current) {
                                                    setIsDirty(true); // ✅ only if user is editing
                                                }
                                            }}
                                            isDisabled={formData.customer_type?.value === "WC"}
                                            options={sourceOption}
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
                                </div>
                                <div className="col-span-12 md:col-span-6">
                                    <div className="flex items-center space-x-4 mb-2">
                                        <label className="w-[25%] text-gray-400 text-sm">{translations["Last Update"]}</label>
                                        <input
                                            type="text"
                                            readOnly
                                            value={formData.updated_at ? formatDateTime(formData.updated_at) : ""}
                                            onChange={(e) => {
                                                const value = e.target.value;
                                                setFormData((prev) => ({ ...prev, updated_at: value }));
                                                if (!isDirtyRef.current) setIsDirty(true);
                                            }}
                                            className="flex-1 px-3 py-2 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm"
                                        />
                                    </div>
                                    <div className="flex items-center space-x-4 mb-2">
                                        <label className="w-[25%] text-gray-400 text-sm">{translations["Contact Person"]}</label>
                                        <input
                                            type="text"
                                            value={formData.account_name_en}
                                            hidden={lang === "cn"}
                                            onChange={(e) => {
                                                const value = e.target.value;
                                                setFormData((prev) => ({ ...prev, account_name_en: value }));
                                                if (!isDirtyRef.current) setIsDirty(true);
                                            }}
                                            className="flex-1 px-3 py-2 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm"
                                        />
                                        <input
                                            type="text"
                                            value={formData.account_name_cn}
                                            hidden={lang === "en"}
                                            onChange={(e) => {
                                                const value = e.target.value;
                                                setFormData((prev) => ({ ...prev, account_name_cn: value }));
                                                if (!isDirtyRef.current) setIsDirty(true);
                                            }}
                                            className="flex-1 px-3 py-2 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm"
                                        />
                                    </div>
                                    <div className="flex items-center space-x-4 mb-2">
                                        <label className="w-[25%] text-gray-400 text-sm">{translations["Company"]}</label>
                                        <input
                                            type="text"
                                            disabled={formData.customer_type?.value === "RC"}
                                            value={formData.company_en}
                                            hidden={lang === "cn"}
                                            onChange={(e) => {
                                                const value = e.target.value;
                                                setFormData((prev) => ({ ...prev, company_en: value }));
                                                if (!isDirtyRef.current) setIsDirty(true);
                                            }}
                                            className="flex-1 px-3 py-2 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm"
                                        />

                                        <input
                                            type="text"
                                            disabled={formData.customer_type?.value === "RC"}
                                            value={formData.company_cn}
                                            hidden={lang === "en"}
                                            onChange={(e) => {
                                                const value = e.target.value;
                                                setFormData((prev) => ({ ...prev, company_cn: value }));
                                                if (!isDirtyRef.current) setIsDirty(true);
                                            }}
                                            className="flex-1 px-3 py-2 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm"
                                        />
                                    </div>
                                    <div className="flex items-center space-x-4 mb-2">
                                        <label className="w-[25%] text-gray-400 text-sm">{translations["Customer Since"]}</label>
                                        <Flatpickr
                                            onChange={handleCustomerSinceChange}
                                            options={{
                                                dateFormat: "M d Y",
                                                defaultDate: formData.customer_since || undefined,
                                                allowInput: true,
                                                locale: locale,
                                            }}
                                            className="flex-1 px-3 py-2 border-[1px] border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm"
                                        />
                                    </div>
                                    <div className="flex items-center space-x-4 mb-2">
                                        <label className="w-[25%] text-gray-400 text-sm">{translations["User ID"]}</label>
                                        <input
                                            type="text"
                                            disabled={formData.customer_type?.value === "WC"}
                                            value={formData.user_id}
                                            onChange={(e) => {
                                                const value = e.target.value;
                                                setFormData((prev) => ({ ...prev, user_id: value }));
                                                if (!isDirtyRef.current) setIsDirty(true);
                                            }}
                                            className="flex-1 px-3 py-2 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm"
                                        />
                                    </div>
                                </div>
                            </fieldset>
                            <fieldset className="grid grid-cols-12 gap-4 border-[1px] border-[#ffffff1a] rounded-lg p-4 mb-2">
                                <div className="col-span-12 md:col-span-6">
                                    <div className="flex items-center space-x-4 mb-2">
                                        <label className="w-[25%] text-gray-400 text-sm">{translations["Portal ID"]}</label>
                                        <input
                                            type="text"
                                            value={formData.mobile}
                                            onChange={(e) => {
                                                const value = e.target.value;
                                                setFormData((prev) => ({ ...prev, mobile: value }));
                                                if (!isDirtyRef.current) setIsDirty(true);
                                            }}
                                            className="flex-1 px-3 py-2 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm"
                                        />
                                    </div>
                                    <div className="flex items-center space-x-4 mb-2">
                                        <label className="w-[25%] text-gray-400 text-sm">{translations["Password"]}</label>
                                        <input
                                            type="text"
                                            value={formData.password}
                                            onChange={(e) => {
                                                const value = e.target.value;
                                                setFormData((prev) => ({ ...prev, password: value }));
                                                if (!isDirtyRef.current) setIsDirty(true);
                                            }}
                                            className="flex-1 px-3 py-2 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm"
                                        />
                                    </div>
                                </div>
                                <div className="col-span-12 md:col-span-6">
                                    <div className="flex items-center space-x-4 mb-2">
                                        <label className="w-[26%] text-gray-400 text-sm">{translations["POD"]}</label>
                                        <Select
                                            classNamePrefix="react-select"
                                            value={formData.pod}
                                            onChange={(selected) => {
                                                setFormData({ ...formData, pod: selected as OptionType | null });
                                                if (!isDirtyRef.current) {
                                                    setIsDirty(true); // ✅ only if user is editing
                                                }
                                            }}
                                            options={warehouseOptions}
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
                                        <label className="w-[26%] text-gray-400 text-sm">{translations["Warehouse"]}</label>
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
                                            className="w-[75%]"
                                            isClearable
                                            placeholder={translations["Select"]}
                                            menuPlacement="auto"
                                            menuPosition="fixed"
                                            menuPortalTarget={typeof window !== "undefined" ? document.body : null}
                                        />
                                    </div>
                                </div>
                            </fieldset>
                            <fieldset className="grid grid-cols-12 gap-4 border-[1px] border-[#ffffff1a] rounded-lg p-4 mb-2">
                                <div className="col-span-12 md:col-span-6">
                                    <div className="flex items-center space-x-4 mb-2">
                                        <label className="w-[26%] text-gray-400 text-sm">{translations["Sales Person"]}</label>
                                        <Select
                                            classNamePrefix="react-select"
                                            value={formData.sales_person_id}
                                            onChange={(selected) => {
                                                setFormData({ ...formData, sales_person_id: selected as OptionType | null });
                                                if (!isDirtyRef.current) {
                                                    setIsDirty(true); // ✅ only if user is editing
                                                }
                                            }}
                                            options={salesPersonOption}
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
                                        <label className="w-[26%] text-gray-400 text-sm">{translations["Preferred Shipping"]}</label>
                                        <Select
                                            classNamePrefix="react-select"
                                            value={formData.preferred_shipping_id}
                                            onChange={(selected) => {
                                                setFormData({ ...formData, preferred_shipping_id: selected as OptionType | null });
                                                if (!isDirtyRef.current) {
                                                    setIsDirty(true); // ✅ only if user is editing
                                                }
                                            }}
                                            options={courierOption}
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
                                        <label className="w-[26%] text-gray-400 text-sm">{translations["Tax Group"]}</label>
                                        <Select
                                            classNamePrefix="react-select"
                                            value={formData.tax_group}
                                            onChange={(selected) => {
                                                setFormData({ ...formData, tax_group: selected as OptionType | null });
                                                if (!isDirtyRef.current) {
                                                    setIsDirty(true); // ✅ only if user is editing
                                                }
                                            }}
                                            options={taxGroupOption}
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
                                        <label className="w-[26%] text-gray-400 text-sm">{translations["Shipping Terms"]}</label>
                                        <Select
                                            classNamePrefix="react-select"
                                            value={formData.shipping_terms_id}
                                            onChange={(selected) => {
                                                setFormData({ ...formData, shipping_terms_id: selected as OptionType | null });
                                                if (!isDirtyRef.current) {
                                                    setIsDirty(true); // ✅ only if user is editing
                                                }
                                            }}
                                            options={shippingTermsOption}
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
                                </div>
                                <div className="col-span-12 md:col-span-6">
                                    <div className="flex items-center space-x-4 mb-2">
                                        <label className="w-[25%] text-gray-400 text-sm">{translations["Memo"]}</label>
                                        <input
                                            type="text"
                                            value={formData.memo}
                                            onChange={(e) => {
                                                const value = e.target.value;
                                                setFormData((prev) => ({ ...prev, memo: value }));
                                                if (!isDirtyRef.current) setIsDirty(true);
                                            }}
                                            className="flex-1 px-3 py-2 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm"
                                        />
                                    </div>
                                    <div className="flex items-center space-x-4 mb-2">
                                        <label className="w-[25%] text-gray-400 text-sm">{translations["Tax Ref. No."]}</label>
                                        <input
                                            type="text"
                                            value={formData.tax_ref_no}
                                            onChange={(e) => {
                                                const value = e.target.value;
                                                setFormData((prev) => ({ ...prev, tax_ref_no: value }));
                                                if (!isDirtyRef.current) setIsDirty(true);
                                            }}
                                            className="flex-1 px-3 py-2 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm"
                                        />
                                    </div>
                                    <div className="flex items-center space-x-4 mb-2">
                                        <label className="w-[26%] text-gray-400 text-sm">{translations["Payment Terms"]}</label>
                                        <Select
                                            classNamePrefix="react-select"
                                            value={formData.payment_terms_id}
                                            onChange={(selected) => {
                                                setFormData({ ...formData, payment_terms_id: selected as OptionType | null });
                                                if (!isDirtyRef.current) {
                                                    setIsDirty(true); // ✅ only if user is editing
                                                }
                                            }}
                                            options={paymentTermsOption}
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
                                        <label className="w-[25%] text-gray-400 text-sm">{translations["Web URL"]}</label>
                                        <input
                                            type="text"
                                            value={formData.webpage_address}
                                            onChange={(e) => {
                                                const value = e.target.value;
                                                setFormData((prev) => ({ ...prev, webpage_address: value }));
                                                if (!isDirtyRef.current) setIsDirty(true);
                                            }}
                                            className="flex-1 px-3 py-2 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm"
                                        />
                                    </div>
                                </div>
                            </fieldset>
                            <fieldset className="grid grid-cols-12 gap-4 border-[1px] border-[#ffffff1a] rounded-lg p-4 mb-2">
                                <div className="col-span-12 md:col-span-6">
                                    <div className="flex items-center space-x-4 mb-2">
                                        <label className="w-[25%] text-gray-400 text-sm font-bold">{translations["Billing Address"]}</label>
                                    </div>
                                    <div className="flex items-center space-x-4 mb-2">
                                        <label className="w-[25%] text-gray-400 text-sm">{translations["Contact Person"]}</label>
                                        <input
                                            type={lang === "cn" ? "hidden" : "text"}
                                            value={formData.billing_name_en}
                                            onChange={(e) => {
                                                const value = e.target.value;
                                                setFormData((prev) => ({ ...prev, billing_name_en: value }));
                                                if (!isDirtyRef.current) setIsDirty(true);
                                            }}
                                            className="flex-1 px-3 py-2 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm"
                                        />
                                        <input
                                            type={lang === "en" ? "hidden" : "text"}
                                            value={formData.billing_name_cn}
                                            onChange={(e) => {
                                                const value = e.target.value;
                                                setFormData((prev) => ({ ...prev, billing_name_cn: value }));
                                                if (!isDirtyRef.current) setIsDirty(true);
                                            }}
                                            className="flex-1 px-3 py-2 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm"
                                        />
                                    </div>
                                    <div className="flex items-center space-x-4 mb-2">
                                        <label className="w-[25%] text-gray-400 text-sm">{translations["Billing Address"]}</label>
                                        <textarea
                                            value={formData.billing_address_en}
                                            rows={4}
                                            onChange={(e) => {
                                                const value = e.target.value;
                                                setFormData((prev) => ({ ...prev, billing_address_en: value }));
                                                if (!isDirtyRef.current) setIsDirty(true);
                                            }}
                                            className={`flex-1 px-3 py-2 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm ${lang === "cn" ? "hidden" : ""}`}
                                        />
                                        <textarea
                                            value={formData.billing_address_cn}
                                            rows={4}
                                            onChange={(e) => {
                                                const value = e.target.value;
                                                setFormData((prev) => ({ ...prev, billing_address_cn: value }));
                                                if (!isDirtyRef.current) setIsDirty(true);
                                            }}
                                            className={`flex-1 px-3 py-2 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm ${lang === "en" ? "hidden" : ""}`}
                                        />
                                    </div>
                                    <div className="flex items-center space-x-4 mb-2">
                                        <label className="w-[26%] text-gray-400 text-sm">{translations["Country"]}</label>
                                        <Select
                                            classNamePrefix="react-select"
                                            value={formData.billing_country}
                                            onChange={(selected) => {
                                                setFormData({ ...formData, billing_country: selected as OptionType | null });
                                                if (!isDirtyRef.current) {
                                                    setIsDirty(true); // ✅ only if user is editing
                                                }
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
                                    <div className="flex items-center space-x-4 mb-2">
                                        <label className="w-[26%] text-gray-400 text-sm">{translations["State"]}</label>
                                        <Select
                                            classNamePrefix="react-select"
                                            value={formData.billing_state_id}
                                            onChange={(selected) => {
                                                setFormData({ ...formData, billing_state_id: selected as OptionType | null });
                                                if (!isDirtyRef.current) {
                                                    setIsDirty(true); // ✅ only if user is editing
                                                }
                                            }}
                                            options={statesOption}
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
                                        <label className="w-[25%] text-gray-400 text-sm">{translations["Postal Code"]}</label>
                                        <input
                                            type="text"
                                            value={formData.billing_postal_code}
                                            onChange={(e) => {
                                                const value = e.target.value;
                                                setFormData((prev) => ({ ...prev, billing_postal_code: value }));
                                                if (!isDirtyRef.current) setIsDirty(true);
                                            }}
                                            className="flex-1 px-3 py-2 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm"
                                        />
                                    </div>
                                    <div className="flex items-center space-x-4 mb-2">
                                        <label className="w-[25%] text-gray-400 text-sm">{translations["Contact No."]}</label>
                                        <input
                                            type="text"
                                            value={formData.billing_tel_no}
                                            onChange={(e) => {
                                                const value = e.target.value;
                                                setFormData((prev) => ({ ...prev, billing_tel_no: value }));
                                                if (!isDirtyRef.current) setIsDirty(true);
                                            }}
                                            className="flex-1 px-3 py-2 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm"
                                        />
                                    </div>
                                </div>
                                <div className="col-span-12 md:col-span-6">
                                    <div className="flex items-center space-x-4 mb-2">
                                        <label className="w-[25%] text-gray-400 text-sm font-bold">{translations["Delivery Address"]}</label>
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <span className="text-[#ffffffcc] text-custom-sm font-medium mr-2">{translations["Check if the same"]}</span>
                                            </div>
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    disabled={formData.customer_type?.value === "RC"}
                                                    checked={Number(formData.is_copy_billing) === 1}
                                                    onChange={(e) => {
                                                        const isChecked = e.target.checked ? 1 : 0;
                                                        setFormData({ ...formData, is_copy_billing: isChecked });
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
                                    </div>
                                    <div className="flex items-center space-x-4 mb-2">
                                        <label className="w-[25%] text-gray-400 text-sm">{translations["Contact Person"]}</label>
                                        <input
                                            type={lang === "cn" ? "hidden" : "text"}
                                            disabled={formData.customer_type?.value === "RC"}
                                            value={Number(formData.is_copy_billing) === 1 ? formData.billing_name_en : formData.delivery_name_en}
                                            onChange={(e) => {
                                                const value = e.target.value;
                                                setFormData((prev) => ({ ...prev, delivery_name_en: value }));
                                                if (!isDirtyRef.current) setIsDirty(true);
                                            }}
                                            className="flex-1 px-3 py-2 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm"
                                        />
                                        <input
                                            type={lang === "en" ? "hidden" : "text"}
                                            disabled={formData.customer_type?.value === "RC"}
                                            value={Number(formData.is_copy_billing) === 1 ? formData.billing_name_cn : formData.delivery_name_cn}
                                            onChange={(e) => {
                                                const value = e.target.value;
                                                setFormData((prev) => ({ ...prev, delivery_name_cn: value }));
                                                if (!isDirtyRef.current) setIsDirty(true);
                                            }}
                                            className="flex-1 px-3 py-2 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm"
                                        />
                                    </div>
                                    <div className="flex items-center space-x-4 mb-2">
                                        <label className="w-[25%] text-gray-400 text-sm">{translations["Delivery Address"]}</label>
                                        <textarea
                                            value={Number(formData.is_copy_billing) === 1 ? formData.billing_address_en : formData.delivery_address_en}
                                            rows={4}
                                            disabled={formData.customer_type?.value === "RC"}
                                            onChange={(e) => {
                                                const value = e.target.value;
                                                setFormData((prev) => ({ ...prev, delivery_address_en: value }));
                                                if (!isDirtyRef.current) setIsDirty(true);
                                            }}
                                            className={`flex-1 px-3 py-2 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm ${lang === "cn" ? "hidden" : ""}`}
                                        />
                                        <textarea
                                            value={Number(formData.is_copy_billing) === 1 ? formData.billing_address_cn : formData.delivery_address_cn}
                                            rows={4}
                                            disabled={formData.customer_type?.value === "RC"}
                                            onChange={(e) => {
                                                const value = e.target.value;
                                                setFormData((prev) => ({ ...prev, delivery_address_cn: value }));
                                                if (!isDirtyRef.current) setIsDirty(true);
                                            }}
                                            className={`flex-1 px-3 py-2 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm ${lang === "en" ? "hidden" : ""}`}
                                        />
                                    </div>
                                    <div className="flex items-center space-x-4 mb-2">
                                        <label className="w-[26%] text-gray-400 text-sm">{translations["Country"]}</label>
                                        <Select
                                            classNamePrefix="react-select"
                                            value={Number(formData.is_copy_billing) === 1 ? formData.billing_country : formData.delivery_country}
                                            onChange={(selected) => {
                                                setFormData({ ...formData, delivery_country: selected as OptionType | null });
                                                if (!isDirtyRef.current) {
                                                    setIsDirty(true); // ✅ only if user is editing
                                                }
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
                                            isDisabled={formData.customer_type?.value === "RC"}
                                        />
                                    </div>
                                    <div className="flex items-center space-x-4 mb-2">
                                        <label className="w-[26%] text-gray-400 text-sm">{translations["State"]}</label>
                                        <Select
                                            classNamePrefix="react-select"
                                            value={Number(formData.is_copy_billing) === 1 ? formData.billing_state_id : formData.delivery_state_id}
                                            onChange={(selected) => {
                                                setFormData({ ...formData, delivery_state_id: selected as OptionType | null });
                                                if (!isDirtyRef.current) {
                                                    setIsDirty(true); // ✅ only if user is editing
                                                }
                                            }}
                                            options={statesOption}
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
                                            isDisabled={formData.customer_type?.value === "RC"}
                                        />
                                    </div>
                                    <div className="flex items-center space-x-4 mb-2">
                                        <label className="w-[25%] text-gray-400 text-sm">{translations["Postal Code"]}</label>
                                        <input
                                            type="text"
                                            disabled={formData.customer_type?.value === "RC"}
                                            value={Number(formData.is_copy_billing) === 1 ? formData.billing_postal_code : formData.delivery_postal_code}
                                            onChange={(e) => {
                                                const value = e.target.value;
                                                setFormData((prev) => ({ ...prev, delivery_postal_code: value }));
                                                if (!isDirtyRef.current) setIsDirty(true);
                                            }}
                                            className="flex-1 px-3 py-2 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm"
                                        />
                                    </div>
                                    <div className="flex items-center space-x-4 mb-2">
                                        <label className="w-[25%] text-gray-400 text-sm">{translations["Contact No."]}</label>
                                        <input
                                            type="text"
                                            disabled={formData.customer_type?.value === "RC"}
                                            value={Number(formData.is_copy_billing) === 1 ? formData.billing_tel_no : formData.delivery_tel_no}
                                            onChange={(e) => {
                                                const value = e.target.value;
                                                setFormData((prev) => ({ ...prev, delivery_tel_no: value }));
                                                if (!isDirtyRef.current) setIsDirty(true);
                                            }}
                                            className="flex-1 px-3 py-2 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm"
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
    const renderOrders = () => (
        <div className="p-2">
            <div className="overflow-x-auto mt-1">
                <div className="flex flex-col h-[calc(100vh-215px)]">
                    <table className="w-full">
                        <thead className="sticky top-0 z-[2]" style={{ backgroundColor: "#1f2132" }}>
                            <tr className="border-b" style={{ borderColor: "#2d2d30" }}>
                                <th className="w-[3%] px-2 py-2 text-left text-gray-400 text-sm"></th>
                                <th className="w-[3%] px-2 py-2 text-left text-gray-400 text-sm">
                                    <CustomCheckbox
                                        checked={selectedCustomerOrders.length === customerOrder.length && customerOrder.length > 0}
                                        onChange={(checked) => handleSelectedAllCustOrder(checked)}
                                    />
                                </th>
                                <th className="w-[7%] px-2 py-2 text-left text-gray-400 text-sm">{translations["Order Date"]}</th>
                                <th className="w-[21%] px-2 py-2 text-left text-gray-400 text-sm">{translations["Products"]}</th>
                                <th className="w-[8%] px-2 py-2 text-center text-gray-400 text-sm">{translations["Price"]}</th>
                                <th className="w-[7%] px-2 py-2 text-center text-gray-400 text-sm">{translations["Qty"]}</th>
                                <th className="w-[7%] px-2 py-2 text-center text-gray-400 text-sm">{translations["Sub Total"]}</th>
                                <th className="w-[8%] px-2 py-2 text-center text-gray-400 text-sm">{translations["Grand Total"]}</th>
                                <th className="w-[7%] px-2 py-2 text-center text-gray-400 text-sm">{translations["Total Cost"]}</th>
                                <th className="w-[7%] px-2 py-2 text-center text-gray-400 text-sm">{translations["Total Profit"]}</th>
                                <th className="w-[7%] px-2 py-2 text-center text-gray-400 text-sm">{translations["Deposit"]}</th>
                                <th className="w-[7%] px-2 py-2 text-center text-gray-400 text-sm">{translations["Sales Person"]}</th>
                            </tr>
                        </thead>
                    </table>
                    <div className="flex-grow overflow-y-auto overflow-x-auto">
                        <table className="w-full">
                            <tbody>
                                {customerOrder.length === 0 && (
                                    <tr className="border-b hover:bg-gray-700 hover:bg-opacity-30 transition-colors" style={{ borderColor: "#40404042" }}>
                                        <td colSpan={12} className="px-2 py-2 text-center text-gray-300 text-sm">
                                            {translations["No Record Found"]}
                                        </td>
                                    </tr>
                                )}
                                {customerOrder.map((profitOrder, index) => (
                                    <React.Fragment key={profitOrder.id || index}>
                                        <tr className="border-b hover:bg-gray-700 hover:bg-opacity-30 transition-colors" style={{ borderColor: "#40404042" }}>
                                            <td className="w-[3%] px-2 py-2 text-center text-gray-300 text-sm">
                                                <button
                                                    onClick={() => handleToggleRow_Orders(profitOrder.id)}
                                                    className={`px-1 py-1 ${
                                                        expanded_Orders.includes(profitOrder.id) ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"
                                                    } text-white rounded-lg transition-colors text-xs`}
                                                >
                                                    {expanded_Orders.includes(profitOrder.id) ? <Minus size={16} /> : <Plus size={16} />}
                                                </button>
                                            </td>
                                            <td className="w-[3%] px-2 py-2 text-left text-gray-300 text-sm">
                                                <CustomCheckbox
                                                    checked={selectedCustomerOrders.includes(profitOrder.id as number)}
                                                    onChange={(checked) => handleSelectCustOrders(profitOrder.id as number, checked)}
                                                />
                                            </td>
                                            <td className="w-[7%] px-2 py-2 text-left text-gray-300 text-sm">{formatDate(profitOrder.order_date, lang)}</td>
                                            <td className="w-[21%] py-2 px-2">
                                                <div className="flex items-center space-x-3">
                                                    <div>
                                                        <div className="group flex items-center">
                                                            <p className="text-gray-300 text-custom-sm select-text">{profitOrder.product_code}</p>
                                                            <CopyToClipboard text={profitOrder.product_code || ""} />
                                                        </div>
                                                        <div className="group flex items-center">
                                                            <p className="text-gray-400 text-custom-sm">{lang == "en" ? profitOrder.product_title_en : profitOrder.product_title_cn}</p>
                                                            <CopyToClipboard text={lang == "en" ? profitOrder.product_title_en || "" : profitOrder.product_title_cn || ""} />
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="w-[8%] py-2 px-2 text-gray-400 text-center text-custom-sm">
                                                {profitOrder.currency}
                                                <br></br>
                                                {formatMoney(profitOrder.price)}
                                            </td>
                                            <td className="w-[7%] py-2 px-2 text-gray-400 text-center text-custom-sm">{profitOrder.qty}</td>
                                            <td className="w-[7%] py-2 px-2 text-gray-400 text-center text-custom-sm">
                                                {profitOrder.currency}
                                                <br />
                                                {formatMoney(profitOrder.price * profitOrder.qty)}
                                            </td>
                                            <td className="w-[8%] py-2 px-2 text-gray-400 text-center text-custom-sm">
                                                {baseCurrency()}
                                                <br />
                                                {formatMoney(profitOrder.base_total)}
                                            </td>
                                            <td className="w-[7%] py-2 px-2 text-gray-400 text-center text-custom-sm">
                                                {profitOrder.e_cost_total_currency}
                                                <br />
                                                {formatMoney(profitOrder.e_cost_total)}
                                            </td>
                                            <td className="w-[7%] py-2 px-2 text-gray-400 text-center text-custom-sm">
                                                {profitOrder.e_profit_currency}
                                                <br />
                                                {formatMoney(profitOrder.e_profit)}
                                            </td>
                                            <td className="w-[7%] py-2 px-2 text-gray-400 text-center text-custom-sm">
                                                {profitOrder.currency}
                                                <br />
                                                {formatMoney(profitOrder.item_deposit)}
                                            </td>
                                            <td className="w-[7%] py-2 px-2 text-gray-400 text-center text-custom-sm">{profitOrder.sales_person_name}</td>
                                        </tr>
                                        {expanded_Orders.includes(profitOrder.id) && (
                                            <tr>
                                                <td colSpan={12} className="py-2 px-2">
                                                    <table className="w-full" style={{ backgroundColor: "#060818" }}>
                                                        <thead className="sticky top-0 z-[1] py-1 px-4" style={{ backgroundColor: "#1f2132" }}>
                                                            <tr className="border-b" style={{ borderColor: "#2d2d30" }}>
                                                                <th className="text-left px-2 py-2 text-gray-400 text-sm w-12">
                                                                    {translations["JVNo"]} / {translations["RV No."]}
                                                                </th>
                                                                <th className="text-left px-2 py-2 text-gray-400 text-sm w-12">{translations["Transaction Date"]}</th>
                                                                <th className="text-center px-2 py-2 text-gray-400 text-sm w-12">{translations["Amount"]}</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {orderDetailsMap[profitOrder.id] && orderDetailsMap[profitOrder.id]!.length > 0 ? (
                                                                orderDetailsMap[profitOrder.id]!.map((detail, i) => (
                                                                    <tr key={detail.orders_id || i}>
                                                                        <td className="py-2 px-2 text-gray-400 text-left text-custom-sm">
                                                                            <div className="group flex items-center">
                                                                                <p className="text-gray-400 text-custom-sm">{detail.ref_data}</p>
                                                                                <CopyToClipboard text={detail.ref_data} />
                                                                            </div>
                                                                        </td>
                                                                        <td className="py-2 px-2 text-gray-400 text-left text-custom-sm">{formatDate(detail.transaction_date, lang)}</td>
                                                                        <td className="py-2 px-2 text-gray-400 text-center text-custom-sm">
                                                                            {baseCurrency()} {formatMoney(detail.payment_order)}
                                                                        </td>
                                                                    </tr>
                                                                ))
                                                            ) : (
                                                                <tr>
                                                                    <td colSpan={3} className="py-2 px-2 text-center text-gray-400 text-sm">
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
                    <table className="w-full sticky bottom-0 z-[1]" style={{ backgroundColor: "#1f2132" }}>
                        <tfoot>
                            {CustomerOrderFooter && (
                                <>
                                    <tr className="border-t hover:bg-gray-700 hover:bg-opacity-30 transition-colors" style={{ borderColor: "#40404042" }}>
                                        <td className="w-[3%] px-1 py-1 text-left text-gray-300 text-sm"></td>
                                        <td className="w-[3%] px-1 py-1 text-left text-gray-300 text-sm"></td>
                                        <td className="w-[7%] px-1 py-1 text-left text-gray-300 text-sm"></td>
                                        <td className="w-[21%] py-1 px-1 text-gray-400 text-right text-custom-sm">{translations["Selected Order Total"]}</td>
                                        <td className="w-[8%] py-1 px-1 text-gray-400 text-center text-custom-sm"></td>
                                        <td className="w-[7%] py-1 px-1 text-gray-400 text-center text-custom-sm">{CustomerOrderFooter.total_qty}</td>
                                        <td className="w-[7%] py-1 px-1 text-gray-400 text-center text-custom-sm">{formatMoney(CustomerOrderFooter.total_subtotal)}</td>
                                        <td className="w-[8%] py-1 px-1 text-gray-400 text-center text-custom-sm">{formatMoney(CustomerOrderFooter.total_base_total)}</td>
                                        <td className="w-[7%] py-1 px-1 text-gray-400 text-center text-custom-sm">{formatMoney(CustomerOrderFooter.total_e_cost_total)}</td>
                                        <td className="w-[7%] py-1 px-1 text-gray-400 text-center text-custom-sm">{formatMoney(CustomerOrderFooter.total_e_profit)}</td>
                                        <td className="w-[7%] py-1 px-1 text-gray-400 text-center text-custom-sm">{formatMoney(CustomerOrderFooter.total_item_deposit)}</td>
                                        <td className="w-[7%] py-1 px-1 text-gray-400 text-center text-custom-sm"></td>
                                    </tr>
                                </>
                            )}
                            {CustomerOrderFooter2 && (
                                <>
                                    <tr className="border-t hover:bg-gray-700 hover:bg-opacity-30 transition-colors" style={{ borderColor: "#40404042" }}>
                                        <td className="w-[3%] px-1 py-1 text-left text-gray-300 text-sm"></td>
                                        <td className="w-[3%] px-1 py-1 text-left text-gray-300 text-sm"></td>
                                        <td className="w-[7%] px-1 py-1 text-left text-gray-300 text-sm"></td>
                                        <td className="w-[21%] py-1 px-1 text-gray-400 text-right text-custom-sm">{translations["All Order Total"]}</td>
                                        <td className="w-[8%] py-1 px-1 text-gray-400 text-center text-custom-sm"></td>
                                        <td className="w-[7%] py-1 px-1 text-gray-400 text-center text-custom-sm">{CustomerOrderFooter2.total_qty}</td>
                                        <td className="w-[7%] py-1 px-1 text-gray-400 text-center text-custom-sm">{formatMoney(CustomerOrderFooter2.total_subtotal)}</td>
                                        <td className="w-[8%] py-1 px-1 text-gray-400 text-center text-custom-sm">{formatMoney(CustomerOrderFooter2.total_base_total)}</td>
                                        <td className="w-[7%] py-1 px-1 text-gray-400 text-center text-custom-sm">{formatMoney(CustomerOrderFooter2.total_e_cost_total)}</td>
                                        <td className="w-[7%] py-1 px-1 text-gray-400 text-center text-custom-sm">{formatMoney(CustomerOrderFooter2.total_e_profit)}</td>
                                        <td className="w-[7%] py-1 px-1 text-gray-400 text-center text-custom-sm">{formatMoney(CustomerOrderFooter2.total_item_deposit)}</td>
                                        <td className="w-[7%] py-1 px-1 text-gray-400 text-center text-custom-sm"></td>
                                    </tr>
                                </>
                            )}
                        </tfoot>
                    </table>
                </div>
                {/* Footer with Pagination */}
                <div className="p-4 border-t flex items-center justify-between" style={{ borderColor: "#404040" }}>
                    <div className="flex items-center space-x-1">
                        <MemoizedPagination currentPage={currentPage_Order} totalPages={totalPages_Order} onPageChange={(page) => setCurrentPage_Order(page)} />
                        <MemoizedItemsPerPageSelector
                            value={itemsPerPage_Order}
                            onChange={(val: number) => {
                                setItemsPerPage_Order(val);
                                setCurrentPage_Order(1);
                            }}
                            options={pageSizeOptions}
                        />
                        <ExportReportSelector
                            formats={["odt"]}
                            baseName="CustomerOrders"
                            ids={selectedCustomerOrders.length > 0 ? selectedCustomerOrders : customerOrder.map((p) => p.id)}
                            language={lang}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
    const renderInvoices = () => (
        <div className="p-2">
            <div className="overflow-x-auto mt-1">
                <div className="h-[calc(100vh-215px)] overflow-y-auto">
                    <table className="w-full">
                        <thead className="sticky top-0 z-[1]" style={{ backgroundColor: "#1f2132" }}>
                            <tr className="border-b" style={{ borderColor: "#2d2d30" }}>
                                <th className="w-[5%] px-2 py-2 text-left text-gray-400 text-sm"></th>
                                <th className="w-[11%] px-2 py-2 text-left text-gray-400 text-sm">{translations["Invoice Date"]}</th>
                                <th className="w-[11%] px-2 py-2 text-left text-gray-400 text-sm">{translations["Invoice No"]}</th>
                                <th className="w-[11%] px-2 py-2 text-center text-gray-400 text-sm">{translations["Deposit"]}</th>
                                <th className="w-[11%] px-2 py-2 text-center text-gray-400 text-sm">{translations["Invoice Amount"]}</th>
                                <th className="w-[11%] px-2 py-2 text-center text-gray-400 text-sm">{translations["Balance"]}</th>
                                <th className="w-[10%] px-2 py-2 text-center text-gray-400 text-sm">{translations["Ex Rate"]}</th>
                                <th className="w-[10%] px-2 py-2 text-center text-gray-400 text-sm">{translations["Invoice Amount"]}</th>
                                <th className="w-[10%] px-2 py-2 text-center text-gray-400 text-sm">{translations["Balance"]}</th>
                                <th className="w-[10%] px-2 py-2 text-center text-gray-400 text-sm">{translations["Status"]}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {customerInvoices.length === 0 && (
                                <tr className="border-b hover:bg-gray-700 hover:bg-opacity-30 transition-colors" style={{ borderColor: "#40404042" }}>
                                    <td colSpan={12} className="px-2 py-2 text-center text-gray-300 text-sm">
                                        {translations["No Record Found"]}
                                    </td>
                                </tr>
                            )}
                            {customerInvoices.map((list, index) => (
                                <React.Fragment key={list.id || index}>
                                    <tr className="border-b hover:bg-gray-700 hover:bg-opacity-30 transition-colors" style={{ borderColor: "#40404042" }}>
                                        <td className="px-2 py-2 text-center text-gray-300 text-sm">
                                            <button
                                                onClick={() => handleToggleRow_Invoices(list.id, list.invoice_no)}
                                                className={`px-1 py-1 ${
                                                    expanded_Invoices.includes(list.id) ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"
                                                } text-white rounded-lg transition-colors text-xs`}
                                            >
                                                {expanded_Invoices.includes(list.id) ? <Minus size={16} /> : <Plus size={16} />}
                                            </button>
                                        </td>
                                        <td className="py-2 px-2 text-gray-400 text-left text-custom-sm">{formatDate(list.invoice_date, lang)}</td>
                                        <td className="py-2 px-2 text-gray-400 text-left text-custom-sm">
                                            <div>
                                                <div className="group flex items-center">
                                                    <p className="text-custom-sm select-text">{list.invoice_no}</p>
                                                    <CopyToClipboard text={list.invoice_no || ""} />
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-2 px-2 text-gray-400 text-center text-custom-sm">
                                            {list.currency}
                                            <br></br>
                                            {formatMoney(list.total_deposit)}
                                        </td>
                                        <td className="py-2 px-2 text-gray-400 text-center text-custom-sm">
                                            {list.currency}
                                            <br></br>
                                            {formatMoney(list.total)}
                                        </td>
                                        <td className="py-2 px-2 text-gray-400 text-center text-custom-sm">
                                            {list.currency}
                                            <br></br>
                                            {formatMoney(list.total_to_pay)}
                                        </td>
                                        <td className="py-2 px-2 text-gray-400 text-center text-custom-sm">{formatExrate(list.ex_rate)}</td>
                                        <td className="py-2 px-2 text-gray-400 text-center text-custom-sm">
                                            {baseCurrency()}
                                            <br></br>
                                            {formatMoney(list.base_total)}
                                        </td>
                                        <td className="py-2 px-2 text-gray-400 text-center text-custom-sm">
                                            {baseCurrency()}
                                            <br></br>
                                            {formatMoney(list.base_total_to_pay)}
                                        </td>
                                        <td className="py-2 px-2 text-gray-400 text-center text-custom-sm">{lang === "en" ? list.invoice_status_en : list.invoice_status_cn}</td>
                                    </tr>
                                    {expanded_Invoices.includes(list.id) && (
                                        <tr>
                                            <td colSpan={12} className="py-2 px-2">
                                                <table className="w-full" style={{ backgroundColor: "#060818" }}>
                                                    <thead className="sticky top-0 z-[1] py-1 px-4" style={{ backgroundColor: "#1f2132" }}>
                                                        <tr className="border-b" style={{ borderColor: "#2d2d30" }}>
                                                            <th className="text-left px-2 py-2 text-gray-400 text-sm w-12">{translations["Product Code"]}</th>
                                                            <th className="text-left px-2 py-2 text-gray-400 text-sm w-12">{translations["Product Name"]}</th>
                                                            <th className="text-center px-2 py-2 text-gray-400 text-sm w-12">{translations["Deposit"]}</th>
                                                            <th className="text-center px-2 py-2 text-gray-400 text-sm w-12">{translations["Qty"]}</th>
                                                            <th className="text-center px-2 py-2 text-gray-400 text-sm w-12">{translations["Price"]}</th>
                                                            <th className="text-center px-2 py-2 text-gray-400 text-sm w-12">{translations["Total"]}</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {invoicesDetailsMap[list.id] && invoicesDetailsMap[list.id]!.length > 0 ? (
                                                            invoicesDetailsMap[list.id]!.map((detail, i) => (
                                                                <tr key={detail.id || i}>
                                                                    <td className="py-2 px-2 text-gray-400 text-left text-custom-sm">
                                                                        <div className="group flex items-center">
                                                                            <p className="text-gray-400 text-custom-sm">{detail.product_code}</p>
                                                                            <CopyToClipboard text={detail.product_code} />
                                                                        </div>
                                                                    </td>
                                                                    <td className="py-2 px-2 text-gray-400 text-left text-custom-sm">
                                                                        <div className="group flex items-center">
                                                                            <p className="text-gray-400 text-custom-sm">{lang === "en" ? detail.product_title_en : detail.product_title_cn}</p>
                                                                            <CopyToClipboard text={lang === "en" ? detail.product_title_en : detail.product_title_cn} />
                                                                        </div>
                                                                    </td>
                                                                    <td className="py-2 px-2 text-gray-400 text-center text-custom-sm">
                                                                        {detail.currency} {formatMoney(detail.deposit)}
                                                                    </td>
                                                                    <td className="py-2 px-2 text-gray-400 text-center text-custom-sm">{detail.qty}</td>
                                                                    <td className="py-2 px-2 text-gray-400 text-center text-custom-sm">
                                                                        {detail.currency} {formatMoney(detail.price)}
                                                                    </td>
                                                                    <td className="py-2 px-2 text-gray-400 text-center text-custom-sm">
                                                                        {detail.currency} {formatMoney(detail.total)}
                                                                    </td>
                                                                </tr>
                                                            ))
                                                        ) : (
                                                            <tr>
                                                                <td colSpan={6} className="py-2 px-2 text-center text-gray-400 text-sm">
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
                {/* Footer with Pagination */}
                <div className="p-4 border-t flex items-center justify-between" style={{ borderColor: "#404040" }}>
                    <div className="flex items-center space-x-1">
                        <MemoizedPagination currentPage={currentPage_Invoices} totalPages={totalPages_Invoices} onPageChange={(page) => setCurrentPage_Invoices(page)} />
                        <MemoizedItemsPerPageSelector
                            value={itemsPerPage_Invoices}
                            onChange={(val: number) => {
                                setItemsPerPage_Invoices(val);
                                setCurrentPage_Invoices(1);
                            }}
                            options={pageSizeOptions}
                        />
                        <ExportReportSelector formats={["odt"]} baseName="CustomerInv" ids={customerInvoices.map((p) => p.id)} language={lang} />
                    </div>
                </div>
            </div>
        </div>
    );
    const renderSalesOrder = () => (
        <div className="p-2">
            <div className="overflow-x-auto mt-1">
                <div className="h-[calc(100vh-215px)] overflow-y-auto">
                    <table className="w-full">
                        <thead className="sticky top-0 z-[1]" style={{ backgroundColor: "#1f2132" }}>
                            <tr className="border-b" style={{ borderColor: "#2d2d30" }}>
                                <th className="w-[5%] px-2 py-2 text-left text-gray-400 text-sm"></th>
                                <th className="w-[11%] px-2 py-2 text-left text-gray-400 text-sm">{translations["Invoice Date"]}</th>
                                <th className="w-[11%] px-2 py-2 text-left text-gray-400 text-sm">{translations["SO No"]}</th>
                                <th className="w-[11%] px-2 py-2 text-center text-gray-400 text-sm">{translations["Deposit"]}</th>
                                <th className="w-[11%] px-2 py-2 text-center text-gray-400 text-sm">{translations["Amount"]}</th>
                                <th className="w-[11%] px-2 py-2 text-center text-gray-400 text-sm">{translations["Balance"]}</th>
                                <th className="w-[10%] px-2 py-2 text-center text-gray-400 text-sm">{translations["Ex Rate"]}</th>
                                <th className="w-[10%] px-2 py-2 text-center text-gray-400 text-sm">{translations["Invoice Amount"]}</th>
                                <th className="w-[10%] px-2 py-2 text-center text-gray-400 text-sm">{translations["Balance"]}</th>
                                <th className="w-[10%] px-2 py-2 text-center text-gray-400 text-sm">{translations["Status"]}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {customerSalesOrder.length === 0 && (
                                <tr className="border-b hover:bg-gray-700 hover:bg-opacity-30 transition-colors" style={{ borderColor: "#40404042" }}>
                                    <td colSpan={12} className="px-2 py-2 text-center text-gray-300 text-sm">
                                        {translations["No Record Found"]}
                                    </td>
                                </tr>
                            )}
                            {customerSalesOrder.map((list, index) => (
                                <React.Fragment key={list.id || index}>
                                    <tr className="border-b hover:bg-gray-700 hover:bg-opacity-30 transition-colors" style={{ borderColor: "#40404042" }}>
                                        <td className="px-2 py-2 text-center text-gray-300 text-sm">
                                            <button
                                                onClick={() => handleToggleRow_SalesOrder(list.id, list.so_number)}
                                                className={`px-1 py-1 ${
                                                    expanded_SalesOrder.includes(list.id) ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"
                                                } text-white rounded-lg transition-colors text-xs`}
                                            >
                                                {expanded_SalesOrder.includes(list.id) ? <Minus size={16} /> : <Plus size={16} />}
                                            </button>
                                        </td>
                                        <td className="py-2 px-2 text-gray-400 text-left text-custom-sm">{list.so_date}</td>
                                        <td className="py-2 px-2 text-gray-400 text-left text-custom-sm">
                                            <div>
                                                <div className="group flex items-center">
                                                    <p className="text-custom-sm select-text">{list.so_number}</p>
                                                    <CopyToClipboard text={list.so_number || ""} />
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-2 px-2 text-gray-400 text-center text-custom-sm">
                                            {list.currency}
                                            <br></br>
                                            {formatMoney(list.total_deposit)}
                                        </td>
                                        <td className="py-2 px-2 text-gray-400 text-center text-custom-sm">
                                            {list.currency}
                                            <br></br>
                                            {formatMoney(list.total)}
                                        </td>
                                        <td className="py-2 px-2 text-gray-400 text-center text-custom-sm">
                                            {list.currency}
                                            <br></br>
                                            {formatMoney(list.total_to_pay)}
                                        </td>
                                        <td className="py-2 px-2 text-gray-400 text-center text-custom-sm">{formatExrate(list.ex_rate)}</td>
                                        <td className="py-2 px-2 text-gray-400 text-center text-custom-sm">
                                            {baseCurrency()}
                                            <br></br>
                                            {formatMoney(list.base_total)}
                                        </td>
                                        <td className="py-2 px-2 text-gray-400 text-center text-custom-sm">
                                            {baseCurrency()}
                                            <br></br>
                                            {formatMoney(list.base_total_to_pay)}
                                        </td>
                                        <td className="py-2 px-2 text-gray-400 text-center text-custom-sm">{lang === "en" ? list.invoice_status_en : list.invoice_status_cn}</td>
                                    </tr>
                                    {expanded_SalesOrder.includes(list.id) && (
                                        <tr>
                                            <td colSpan={12} className="py-2 px-2">
                                                <table className="w-full" style={{ backgroundColor: "#060818" }}>
                                                    <thead className="sticky top-0 z-[1] py-1 px-4" style={{ backgroundColor: "#1f2132" }}>
                                                        <tr className="border-b" style={{ borderColor: "#2d2d30" }}>
                                                            <th className="text-left px-2 py-2 text-gray-400 text-sm w-12">{translations["Product Code"]}</th>
                                                            <th className="text-left px-2 py-2 text-gray-400 text-sm w-12">{translations["Product Name"]}</th>
                                                            <th className="text-center px-2 py-2 text-gray-400 text-sm w-12">{translations["Deposit"]}</th>
                                                            <th className="text-center px-2 py-2 text-gray-400 text-sm w-12">{translations["Qty"]}</th>
                                                            <th className="text-center px-2 py-2 text-gray-400 text-sm w-12">{translations["Price"]}</th>
                                                            <th className="text-center px-2 py-2 text-gray-400 text-sm w-12">{translations["Total"]}</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {salesOrderDetailsMap[list.id] && salesOrderDetailsMap[list.id]!.length > 0 ? (
                                                            salesOrderDetailsMap[list.id]!.map((detail, i) => (
                                                                <tr key={detail.id || i}>
                                                                    <td className="py-2 px-2 text-gray-400 text-left text-custom-sm">
                                                                        <div className="group flex items-center">
                                                                            <p className="text-gray-400 text-custom-sm">{detail.product_code}</p>
                                                                            <CopyToClipboard text={detail.product_code} />
                                                                        </div>
                                                                    </td>
                                                                    <td className="py-2 px-2 text-gray-400 text-left text-custom-sm">
                                                                        <div className="group flex items-center">
                                                                            <p className="text-gray-400 text-custom-sm">{lang === "en" ? detail.product_title_en : detail.product_title_cn}</p>
                                                                            <CopyToClipboard text={lang === "en" ? detail.product_title_en : detail.product_title_cn} />
                                                                        </div>
                                                                    </td>
                                                                    <td className="py-2 px-2 text-gray-400 text-center text-custom-sm">
                                                                        {detail.currency} {formatMoney(detail.deposit)}
                                                                    </td>
                                                                    <td className="py-2 px-2 text-gray-400 text-center text-custom-sm">{detail.qty}</td>
                                                                    <td className="py-2 px-2 text-gray-400 text-center text-custom-sm">
                                                                        {detail.currency} {formatMoney(detail.price)}
                                                                    </td>
                                                                    <td className="py-2 px-2 text-gray-400 text-center text-custom-sm">
                                                                        {detail.currency} {formatMoney(detail.total)}
                                                                    </td>
                                                                </tr>
                                                            ))
                                                        ) : (
                                                            <tr>
                                                                <td colSpan={6} className="py-2 px-2 text-center text-gray-400 text-sm">
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
                {/* Footer with Pagination */}
                <div className="p-4 border-t flex items-center justify-between" style={{ borderColor: "#404040" }}>
                    <div className="flex items-center space-x-1">
                        <MemoizedPagination currentPage={currentPage_SalesOrder} totalPages={totalPages_SalesOrder} onPageChange={(page) => setCurrentPage_SalesOrder(page)} />
                        <MemoizedItemsPerPageSelector
                            value={itemsPerPage_SalesOrder}
                            onChange={(val: number) => {
                                setItemsPerPage_SalesOrder(val);
                                setCurrentPage_SalesOrder(1);
                            }}
                            options={pageSizeOptions}
                        />
                        <ExportReportSelector formats={["odt"]} baseName="CustomerSO" ids={customerSalesOrder.map((p) => p.id)} language={lang} />
                    </div>
                </div>
            </div>
        </div>
    );
    const renderDeposit = () => (
        <div className="p-2">
            <div className="overflow-x-auto mt-1">
                <div className="h-[calc(100vh-215px)] overflow-y-auto">
                    <table className="w-full">
                        <thead className="sticky top-0 z-[1]" style={{ backgroundColor: "#1f2132" }}>
                            <tr className="border-b" style={{ borderColor: "#2d2d30" }}>
                                <th className="w-[5%] px-2 py-2 text-left text-gray-400 text-sm"></th>
                                <th className="w-[10%] px-2 py-2 text-left text-gray-400 text-sm">{translations["Date"]}</th>
                                <th className="w-[15%] px-2 py-2 text-left text-gray-400 text-sm">{translations["Receive Voucher No"]}</th>
                                <th className="w-[15%] px-2 py-2 text-left text-gray-400 text-sm">{translations["Bank"]}</th>
                                <th className="w-[15%] px-2 py-2 text-center text-gray-400 text-sm">{translations["Deposit Amount"]}</th>
                                <th className="w-[15%] px-2 py-2 text-center text-gray-400 text-sm">{translations["Ex Rate"]}</th>
                                <th className="w-[15%] px-2 py-2 text-center text-gray-400 text-sm">{translations["Default Currency"]}</th>
                                <th className="w-[10%] px-2 py-2 text-center text-gray-400 text-sm">{translations["Status"]}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {customerDeposit.length === 0 && (
                                <tr className="border-b hover:bg-gray-700 hover:bg-opacity-30 transition-colors" style={{ borderColor: "#40404042" }}>
                                    <td colSpan={12} className="px-2 py-2 text-center text-gray-300 text-sm">
                                        {translations["No Record Found"]}
                                    </td>
                                </tr>
                            )}
                            {customerDeposit.map((list, index) => (
                                <React.Fragment key={list.id || index}>
                                    <tr className="border-b hover:bg-gray-700 hover:bg-opacity-30 transition-colors" style={{ borderColor: "#40404042" }}>
                                        <td className="px-2 py-2 text-center text-gray-300 text-sm">
                                            <button
                                                onClick={() => handleToggleRow_Deposit(list.id, list.rv_number, list.type)}
                                                className={`px-1 py-1 ${
                                                    expanded_Deposit.includes(list.id) ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"
                                                }  text-white rounded-lg transition-colors text-xs`}
                                            >
                                                {expanded_Deposit.includes(list.id) ? <Minus size={16} /> : <Plus size={16} />}
                                            </button>
                                        </td>
                                        <td className="py-2 px-2 text-gray-400 text-left text-custom-sm">{list.rv_date}</td>
                                        <td className="py-2 px-2 text-gray-400 text-left text-custom-sm">
                                            <div>
                                                <div className="group flex items-center">
                                                    <p className="text-custom-sm select-text">{list.rv_number}</p>
                                                    <CopyToClipboard text={list.rv_number || ""} />
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-2 px-2 text-gray-400 text-left text-custom-sm">
                                            {lang === "en" ? list.bank_name_en || translations["N.A."] : list.bank_name_cn || translations["N.A."]}
                                        </td>
                                        <td className="py-2 px-2 text-gray-400 text-center text-custom-sm">
                                            {list.currency}
                                            <br></br>
                                            {formatMoney(list.amount_paid)}
                                        </td>
                                        <td className="py-2 px-2 text-gray-400 text-center text-custom-sm">{formatExrate(list.ex_rate)}</td>
                                        <td className="py-2 px-2 text-gray-400 text-center text-custom-sm">
                                            {baseCurrency()}
                                            <br></br>
                                            {formatMoney(list.base_amount_paid)}
                                        </td>
                                        <td className="py-2 px-2 text-gray-400 text-center text-custom-sm">{lang === "en" ? list.status_en : list.status_cn}</td>
                                    </tr>
                                    {expanded_Deposit.includes(list.id) && (
                                        <tr>
                                            <td colSpan={12} className="py-2 px-2">
                                                <table className="w-full" style={{ backgroundColor: "#060818" }}>
                                                    <thead className="sticky top-0 z-[1] py-1 px-4" style={{ backgroundColor: "#1f2132" }}>
                                                        <tr className="border-b" style={{ borderColor: "#2d2d30" }}>
                                                            <th className="text-left px-2 py-2 text-gray-400 text-sm w-12">{translations["Product Code"]}</th>
                                                            <th className="text-left px-2 py-2 text-gray-400 text-sm w-12">{translations["Product Name"]}</th>
                                                            <th className="text-center px-2 py-2 text-gray-400 text-sm w-12">{translations["Qty"]}</th>
                                                            <th className="text-center px-2 py-2 text-gray-400 text-sm w-12">{translations["Deposit"]}</th>
                                                            <th className="text-center px-2 py-2 text-gray-400 text-sm w-12">{translations["Default Currency"]}</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {depositDetailsMap[list.id] && depositDetailsMap[list.id]!.length > 0 ? (
                                                            depositDetailsMap[list.id]!.map((detail, i) => (
                                                                <tr key={detail.id || i}>
                                                                    <td className="py-2 px-2 text-gray-400 text-left text-custom-sm">
                                                                        <div className="group flex items-center">
                                                                            <p className="text-gray-400 text-custom-sm">{detail.product_code}</p>
                                                                            <CopyToClipboard text={detail.product_code} />
                                                                        </div>
                                                                    </td>
                                                                    <td className="py-2 px-2 text-gray-400 text-left text-custom-sm">
                                                                        <div className="group flex items-center">
                                                                            <p className="text-gray-400 text-custom-sm">{lang === "en" ? detail.product_title_en : detail.product_title_cn}</p>
                                                                            <CopyToClipboard text={lang === "en" ? detail.product_title_en : detail.product_title_cn} />
                                                                        </div>
                                                                    </td>
                                                                    <td className="py-2 px-2 text-gray-400 text-center text-custom-sm">{detail.qty}</td>
                                                                    <td className="py-2 px-2 text-gray-400 text-center text-custom-sm">
                                                                        {detail.currency} {formatMoney(detail.item_deposit)}
                                                                    </td>
                                                                    <td className="py-2 px-2 text-gray-400 text-center text-custom-sm">
                                                                        {baseCurrency()} {formatMoney(detail.base_item_deposit)}
                                                                    </td>
                                                                </tr>
                                                            ))
                                                        ) : (
                                                            <tr>
                                                                <td colSpan={6} className="py-2 px-2 text-center text-gray-400 text-sm">
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
                {/* Footer with Pagination */}
                <div className="p-4 border-t flex items-center justify-between" style={{ borderColor: "#404040" }}>
                    <div className="flex items-center space-x-1">
                        <MemoizedPagination currentPage={currentPage_Deposit} totalPages={totalPages_Deposit} onPageChange={(page) => setCurrentPage_Deposit(page)} />
                        <MemoizedItemsPerPageSelector
                            value={itemsPerPage_Deposit}
                            onChange={(val: number) => {
                                setItemsPerPage_Deposit(val);
                                setCurrentPage_Deposit(1);
                            }}
                            options={pageSizeOptions}
                        />
                        <ExportReportSelector formats={["odt"]} baseName="CustomerDep" ids={[customerId]} language={lang} />
                    </div>
                </div>
            </div>
        </div>
    );
    const renderProfitability = () => (
        <div className="p-2">
            <div className="overflow-x-auto mt-1">
                <div className="h-[calc(100vh-215px)] overflow-y-auto">
                    <table className="w-full">
                        <thead className="sticky top-0 z-[1]" style={{ backgroundColor: "#1f2132" }}>
                            <tr className="border-b" style={{ borderColor: "#2d2d30" }}>
                                <th className="w-[5%] px-2 py-2 text-left text-gray-400 text-sm"></th>
                                <th className="w-[15%] px-2 py-2 text-left text-gray-400 text-sm">{translations["Invoice Date"]}</th>
                                <th className="w-[15%] px-2 py-2 text-left text-gray-400 text-sm">{translations["Invoice No"]}</th>
                                <th className="w-[13%] px-2 py-2 text-center text-gray-400 text-sm">{translations["Total Amount"]}</th>
                                <th className="w-[13%] px-2 py-2 text-center text-gray-400 text-sm">{translations["Ex Rate"]}</th>
                                <th className="w-[13%] px-2 py-2 text-center text-gray-400 text-sm">{translations["Default Currency"]}</th>
                                <th className="w-[13%] px-2 py-2 text-center text-gray-400 text-sm">{translations["Profitability"]}</th>
                                <th className="w-[13%] px-2 py-2 text-center text-gray-400 text-sm">{translations["Status"]}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {customerProfitability.length === 0 && (
                                <tr className="border-b hover:bg-gray-700 hover:bg-opacity-30 transition-colors" style={{ borderColor: "#40404042" }}>
                                    <td colSpan={12} className="px-2 py-2 text-center text-gray-300 text-sm">
                                        {translations["No Record Found"]}
                                    </td>
                                </tr>
                            )}
                            {customerProfitability.map((list, index) => (
                                <React.Fragment key={list.id || index}>
                                    <tr className="border-b hover:bg-gray-700 hover:bg-opacity-30 transition-colors" style={{ borderColor: "#40404042" }}>
                                        <td className="px-2 py-2 text-center text-gray-300 text-sm">
                                            <button
                                                onClick={() => handleToggleRow_Profitability(list.id, list.invoice_no)}
                                                className={`px-1 py-1 ${
                                                    expanded_Profitability.includes(list.id) ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"
                                                }  text-white rounded-lg transition-colors text-xs`}
                                            >
                                                {expanded_Profitability.includes(list.id) ? <Minus size={16} /> : <Plus size={16} />}
                                            </button>
                                        </td>
                                        <td className="py-2 px-2 text-gray-400 text-left text-custom-sm">{list.invoice_date}</td>
                                        <td className="py-2 px-2 text-gray-400 text-left text-custom-sm">
                                            <div>
                                                <div className="group flex items-center">
                                                    <p className="text-custom-sm select-text">{list.invoice_no}</p>
                                                    <CopyToClipboard text={list.invoice_no || ""} />
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-2 px-2 text-gray-400 text-center text-custom-sm">
                                            {list.currency}
                                            <br></br>
                                            {formatMoney(list.sub_total)}
                                        </td>
                                        <td className="py-2 px-2 text-gray-400 text-center text-custom-sm">
                                            {baseCurrency()}
                                            <br></br>
                                            {formatMoney(list.base_total)}
                                        </td>
                                        <td className="py-2 px-2 text-gray-400 text-center text-custom-sm">
                                            {list.currency}
                                            <br></br>
                                            {formatMoney(list.total_to_pay)}
                                        </td>
                                        <td className="py-2 px-2 text-gray-400 text-center text-custom-sm">
                                            {baseCurrency()}
                                            <br></br>
                                            {formatMoney(list.base_total - list.sub_total_on_cost)}
                                        </td>
                                        <td className="py-2 px-2 text-gray-400 text-center text-custom-sm">{lang === "en" ? list.invoice_status_en : list.invoice_status_cn}</td>
                                    </tr>
                                    {expanded_Profitability.includes(list.id) && (
                                        <tr>
                                            <td colSpan={12} className="py-2 px-2">
                                                <table className="w-full" style={{ backgroundColor: "#060818" }}>
                                                    <thead className="sticky top-0 z-[1] py-1 px-4" style={{ backgroundColor: "#1f2132" }}>
                                                        <tr className="border-b" style={{ borderColor: "#2d2d30" }}>
                                                            <th className="w-[15%] text-left px-2 py-2 text-gray-400 text-sm w-12">{translations["Product Code"]}</th>
                                                            <th className="w-[25%] text-left px-2 py-2 text-gray-400 text-sm w-12">{translations["Product Name"]}</th>
                                                            <th className="w-[12%] text-center px-2 py-2 text-gray-400 text-sm w-12">{translations["Deposit"]}</th>
                                                            <th className="w-[12%] text-center px-2 py-2 text-gray-400 text-sm w-12">{translations["Qty"]}</th>
                                                            <th className="w-[12%] text-center px-2 py-2 text-gray-400 text-sm w-12">{translations["Price"]}</th>
                                                            <th className="w-[12%] text-center px-2 py-2 text-gray-400 text-sm w-12">{translations["Total"]}</th>
                                                            <th className="w-[12%] text-center px-2 py-2 text-gray-400 text-sm w-12">{translations["Profitability"]}</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {profitabilityDetailsMap[list.id] && profitabilityDetailsMap[list.id]!.length > 0 ? (
                                                            profitabilityDetailsMap[list.id]!.map((detail, i) => (
                                                                <tr key={detail.id || i}>
                                                                    <td className="py-2 px-2 text-gray-400 text-left text-custom-sm">
                                                                        <div className="group flex items-center">
                                                                            <p className="text-gray-400 text-custom-sm">{detail.product_code}</p>
                                                                            <CopyToClipboard text={detail.product_code} />
                                                                        </div>
                                                                    </td>
                                                                    <td className="py-2 px-2 text-gray-400 text-left text-custom-sm">
                                                                        <div className="group flex items-center">
                                                                            <p className="text-gray-400 text-custom-sm">{lang === "en" ? detail.product_title_en : detail.product_title_cn}</p>
                                                                            <CopyToClipboard text={lang === "en" ? detail.product_title_en : detail.product_title_cn} />
                                                                        </div>
                                                                    </td>
                                                                    <td className="py-2 px-2 text-gray-400 text-center text-custom-sm">
                                                                        {detail.currency} {formatMoney(detail.deposit)}
                                                                    </td>
                                                                    <td className="py-2 px-2 text-gray-400 text-center text-custom-sm">{detail.qty}</td>
                                                                    <td className="py-2 px-2 text-gray-400 text-center text-custom-sm">
                                                                        {detail.currency} {formatMoney(detail.price)}
                                                                    </td>
                                                                    <td className="py-2 px-2 text-gray-400 text-center text-custom-sm">
                                                                        {detail.currency} {formatMoney(detail.total)}
                                                                    </td>
                                                                    <td className="py-2 px-2 text-gray-400 text-center text-custom-sm">
                                                                        {detail.currency} {formatMoney(detail.profitability)}
                                                                    </td>
                                                                </tr>
                                                            ))
                                                        ) : (
                                                            <tr>
                                                                <td colSpan={7} className="py-2 px-2 text-center text-gray-400 text-sm">
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
                {/* Footer with Pagination */}
                <div className="p-4 border-t flex items-center justify-between" style={{ borderColor: "#404040" }}>
                    <div className="flex items-center space-x-1">
                        <MemoizedPagination currentPage={currentPage_Profitability} totalPages={totalPages_Profitability} onPageChange={(page) => setCurrentPage_Profitability(page)} />
                        <MemoizedItemsPerPageSelector
                            value={itemsPerPage_Profitability}
                            onChange={(val: number) => {
                                setItemsPerPage_Profitability(val);
                                setCurrentPage_Profitability(1);
                            }}
                            options={pageSizeOptions}
                        />
                        <ExportReportSelector formats={["odt"]} baseName="CustomerProfitability" ids={[customerId]} language={lang} />
                    </div>
                </div>
            </div>
        </div>
    );
    const renderOrderHistory = () => (
        <div className="p-2">
            <div className="overflow-x-auto mt-1">
                <div className="h-[calc(100vh-215px)] overflow-y-auto">
                    <table className="w-full">
                        <thead className="sticky top-0 z-[1]" style={{ backgroundColor: "#1f2132" }}>
                            <tr className="border-b" style={{ borderColor: "#2d2d30" }}>
                                <th className="w-[5%] px-2 py-2 text-left text-gray-400 text-sm"></th>
                                <th className="w-[19%] px-2 py-2 text-left text-gray-400 text-sm">{translations["Invoice Date"]}</th>
                                <th className="w-[19%] px-2 py-2 text-left text-gray-400 text-sm">{translations["Invoice No"]}</th>
                                <th className="w-[19%] px-2 py-2 text-center text-gray-400 text-sm">{translations["Ex Rate"]}</th>
                                <th className="w-[19%] px-2 py-2 text-center text-gray-400 text-sm">{translations["Default Currency"]}</th>
                                <th className="w-[19%] px-2 py-2 text-center text-gray-400 text-sm">{translations["Status"]}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {customerOrderHistory.length === 0 && (
                                <tr className="border-b hover:bg-gray-700 hover:bg-opacity-30 transition-colors" style={{ borderColor: "#40404042" }}>
                                    <td colSpan={12} className="px-2 py-2 text-center text-gray-300 text-sm">
                                        {translations["No Record Found"]}
                                    </td>
                                </tr>
                            )}
                            {customerOrderHistory.map((list, index) => (
                                <React.Fragment key={list.id || index}>
                                    <tr className="border-b hover:bg-gray-700 hover:bg-opacity-30 transition-colors" style={{ borderColor: "#40404042" }}>
                                        <td className="px-2 py-2 text-center text-gray-300 text-sm">
                                            <button
                                                onClick={() => handleToggleRow_OrderHistory(list.id, list.invoice_no)}
                                                className={`px-1 py-1 ${
                                                    expanded_OrderHistory.includes(list.id) ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"
                                                }  text-white rounded-lg transition-colors text-xs`}
                                            >
                                                {expanded_OrderHistory.includes(list.id) ? <Minus size={16} /> : <Plus size={16} />}
                                            </button>
                                        </td>
                                        <td className="py-2 px-2 text-gray-400 text-left text-custom-sm">{list.invoice_date}</td>
                                        <td className="py-2 px-2 text-gray-400 text-left text-custom-sm">
                                            <div>
                                                <div className="group flex items-center">
                                                    <p className="text-custom-sm select-text">{list.invoice_no}</p>
                                                    <CopyToClipboard text={list.invoice_no || ""} />
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-2 px-2 text-gray-400 text-center text-custom-sm">{formatExrate(list.ex_rate)}</td>
                                        <td className="py-2 px-2 text-gray-400 text-center text-custom-sm">
                                            {baseCurrency()}
                                            <br></br>
                                            {formatMoney(list.base_total_to_pay)}
                                        </td>
                                        <td className="py-2 px-2 text-gray-400 text-center text-custom-sm">{lang === "en" ? list.invoice_status_en : list.invoice_status_cn}</td>
                                    </tr>
                                    {expanded_OrderHistory.includes(list.id) && (
                                        <tr>
                                            <td colSpan={12} className="py-2 px-2">
                                                <table className="w-full" style={{ backgroundColor: "#060818" }}>
                                                    <thead className="sticky top-0 z-[1] py-1 px-4" style={{ backgroundColor: "#1f2132" }}>
                                                        <tr className="border-b" style={{ borderColor: "#2d2d30" }}>
                                                            <th className="text-left px-2 py-2 text-gray-400 text-sm w-12">{translations["Product Code"]}</th>
                                                            <th className="text-left px-2 py-2 text-gray-400 text-sm w-12">{translations["Product Name"]}</th>
                                                            <th className="text-center px-2 py-2 text-gray-400 text-sm w-12">{translations["Deposit"]}</th>
                                                            <th className="text-center px-2 py-2 text-gray-400 text-sm w-12">{translations["Qty"]}</th>
                                                            <th className="text-center px-2 py-2 text-gray-400 text-sm w-12">{translations["Price"]}</th>
                                                            <th className="text-center px-2 py-2 text-gray-400 text-sm w-12">{translations["Total"]}</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {orderHistoryDetailsMap[list.id] && orderHistoryDetailsMap[list.id]!.length > 0 ? (
                                                            orderHistoryDetailsMap[list.id]!.map((detail, i) => (
                                                                <tr key={detail.id || i}>
                                                                    <td className="py-2 px-2 text-gray-400 text-left text-custom-sm">
                                                                        <div className="group flex items-center">
                                                                            <p className="text-gray-400 text-custom-sm">{detail.product_code}</p>
                                                                            <CopyToClipboard text={detail.product_code} />
                                                                        </div>
                                                                    </td>
                                                                    <td className="py-2 px-2 text-gray-400 text-left text-custom-sm">
                                                                        <div className="group flex items-center">
                                                                            <p className="text-gray-400 text-custom-sm">{lang === "en" ? detail.product_title_en : detail.product_title_cn}</p>
                                                                            <CopyToClipboard text={lang === "en" ? detail.product_title_en : detail.product_title_cn} />
                                                                        </div>
                                                                    </td>
                                                                    <td className="py-2 px-2 text-gray-400 text-center text-custom-sm">
                                                                        {detail.currency} {formatMoney(detail.deposit)}
                                                                    </td>
                                                                    <td className="py-2 px-2 text-gray-400 text-center text-custom-sm">{detail.qty}</td>
                                                                    <td className="py-2 px-2 text-gray-400 text-center text-custom-sm">
                                                                        {detail.currency} {formatMoney(detail.price)}
                                                                    </td>
                                                                    <td className="py-2 px-2 text-gray-400 text-center text-custom-sm">
                                                                        {detail.currency} {formatMoney(detail.total)}
                                                                    </td>
                                                                </tr>
                                                            ))
                                                        ) : (
                                                            <tr>
                                                                <td colSpan={6} className="py-2 px-2 text-center text-gray-400 text-sm">
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
                {/* Footer with Pagination */}
                <div className="p-4 border-t flex items-center justify-between" style={{ borderColor: "#404040" }}>
                    <div className="flex items-center space-x-1">
                        <MemoizedPagination currentPage={currentPage_OrderHistory} totalPages={totalPages_OrderHistory} onPageChange={(page) => setCurrentPage_OrderHistory(page)} />
                        <MemoizedItemsPerPageSelector
                            value={itemsPerPage_OrderHistory}
                            onChange={(val: number) => {
                                setItemsPerPage_OrderHistory(val);
                                setCurrentPage_OrderHistory(1);
                            }}
                            options={pageSizeOptions}
                        />
                        <ExportReportSelector formats={["odt"]} baseName="CustomerOrderHistory" ids={[customerId]} language={lang} />
                    </div>
                </div>
            </div>
        </div>
    );
    const renderCredit = () => (
        <div className="p-2">
            <div className="overflow-x-auto mt-1">
                <div className="h-[calc(100vh-215px)] overflow-y-auto">
                    <div className="flex flex-col h-[calc(100vh-215px)]">
                        <table className="w-full">
                            <thead className="sticky top-0 z-[2]" style={{ backgroundColor: "#1f2132" }}>
                                <tr className="border-b" style={{ borderColor: "#2d2d30" }}>
                                    <th className="w-[5%] py-2 px-2 text-gray-400 text-left text-custom-sm"></th>
                                    <th className="w-[19%] py-2 px-2 text-gray-400 text-left text-custom-sm">{translations["Transaction Date"]}</th>
                                    <th className="w-[29%] py-2 px-2 text-gray-400 text-left text-custom-sm">{translations["Transaction Ref"]}</th>
                                    <th className="w-[29%] py-2 px-2 text-gray-400 text-left text-custom-sm">{translations["Details"]}</th>
                                    <th className="w-[18%] py-2 px-2 text-gray-400 text-right text-custom-sm">{translations["Amount"]}</th>
                                </tr>
                            </thead>
                        </table>
                        <div className="flex-grow overflow-y-auto">
                            <table className="w-full">
                                <tbody>
                                    {groupedEntries.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="py-2 px-2 text-center text-gray-400 text-sm">
                                                No records found.
                                            </td>
                                        </tr>
                                    ) : (
                                        groupedEntries.map(([month, records]) => (
                                            <React.Fragment key={month}>
                                                <tr className="border-b hover:bg-gray-700 hover:bg-opacity-30 transition-colors" style={{ borderColor: "#40404042" }}>
                                                    <td colSpan={1} className="w-[5%] py-2 px-2 text-white-400 text-left text-custom-md">
                                                        <Calendar size={25} />
                                                    </td>
                                                    <td colSpan={4} className="py-2 px-2 text-white-400 text-left text-custom-md">
                                                        {month}
                                                    </td>
                                                </tr>

                                                {records.map((list: any, index: number) => {
                                                    const credit = parseFloat(list.credit ?? 0);
                                                    const debit = parseFloat(list.debit ?? 0);
                                                    const stringParticular = list.particulars.split("~");
                                                    const particularEn = stringParticular[0];
                                                    const particularCn = stringParticular[1] || stringParticular[0];

                                                    return (
                                                        <React.Fragment key={list.id ?? index}>
                                                            <tr className="border-b hover:bg-gray-700 hover:bg-opacity-30 transition-colors" style={{ borderColor: "#40404042" }}>
                                                                <td className="w-[5%] py-2 px-2 text-gray-400 text-left text-custom-sm">
                                                                    <button
                                                                        onClick={() => handleToggleRow_Credit(list.id, list.table_id, list.type)}
                                                                        className={`px-1 py-1 ${
                                                                            expanded_Credits.includes(list.id) ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"
                                                                        }  text-white rounded-lg transition-colors text-xs`}
                                                                    >
                                                                        {expanded_Credits.includes(list.id) ? <Minus size={16} /> : <Plus size={16} />}
                                                                    </button>
                                                                </td>
                                                                <td className="w-[19%] py-2 px-2 text-gray-400 text-left text-custom-sm">{formatDate(list.transaction_date, lang)}</td>
                                                                <td className="w-[29%] py-2 px-2 text-gray-400 text-left text-custom-sm">
                                                                    <div className="group flex items-center">
                                                                        <p className="text-gray-400 text-custom-sm">{list.ref_data}</p>
                                                                        <CopyToClipboard text={list.ref_data} />
                                                                    </div>
                                                                </td>
                                                                <td className="w-[29%] py-2 px-2 text-gray-400 text-left text-custom-sm">{lang === "en" ? particularEn : particularCn}</td>
                                                                <td className="w-[18%] py-2 px-2 text-gray-400 text-right text-custom-sm">
                                                                    {credit > 0 ? (
                                                                        <span className="text-green-500">
                                                                            + {list.currency} {formatMoney(credit)}
                                                                        </span>
                                                                    ) : (
                                                                        <span className="text-red-500">
                                                                            - {list.currency} {formatMoney(debit)}
                                                                        </span>
                                                                    )}
                                                                    <br />
                                                                    <span className="text-gray-400">
                                                                        {translations["Balance"]}: {list.currency} {formatMoney(list.running_balance)}
                                                                    </span>
                                                                </td>
                                                            </tr>

                                                            {expanded_Credits.includes(list.id) && (
                                                                <tr>
                                                                    <td colSpan={12} className="py-2 px-2">
                                                                        <table className="w-full" style={{ backgroundColor: "#060818" }}>
                                                                            <thead className="sticky top-0 z-[1] py-1 px-4" style={{ backgroundColor: "#1f2132" }}>
                                                                                <tr className="border-b" style={{ borderColor: "#2d2d30" }}>
                                                                                    {list.type === "CR" ? (
                                                                                        <>
                                                                                            <th className="text-left px-2 py-2 text-gray-400 text-sm w-12">{translations["Account Code"]}</th>
                                                                                            <th className="text-left px-2 py-2 text-gray-400 text-sm w-12">{translations["Description"]}</th>
                                                                                            <th className="text-left px-2 py-2 text-gray-400 text-sm w-12">{translations["Particulars"]}</th>
                                                                                            <th className="text-left px-2 py-2 text-gray-400 text-sm w-12">{translations["Product Name"]}</th>
                                                                                            <th className="text-center px-2 py-2 text-gray-400 text-sm w-12">{translations["Ex Rate"]}</th>
                                                                                            <th className="text-center px-2 py-2 text-gray-400 text-sm w-12">{translations["Amount"]}</th>
                                                                                        </>
                                                                                    ) : list.type === "RV" ? (
                                                                                        <>
                                                                                            <th className="text-left px-2 py-2 text-gray-400 text-sm w-12">{translations["Account Code"]}</th>
                                                                                            <th className="text-left px-2 py-2 text-gray-400 text-sm w-12">{translations["Description"]}</th>
                                                                                            <th className="text-left px-2 py-2 text-gray-400 text-sm w-12">{translations["Particulars"]}</th>
                                                                                            <th className="text-left px-2 py-2 text-gray-400 text-sm w-12">{translations["Product Name"]}</th>
                                                                                            <th className="text-left px-2 py-2 text-gray-400 text-sm w-12">{translations["Invoice No"]}</th>
                                                                                            <th className="text-center px-2 py-2 text-gray-400 text-sm w-12">{translations["Ex Rate"]}</th>
                                                                                            <th className="text-center px-2 py-2 text-gray-400 text-sm w-12">{translations["Amount"]}</th>
                                                                                        </>
                                                                                    ) : list.type === "INV" ? (
                                                                                        <>
                                                                                            <th className="text-left px-2 py-2 text-gray-400 text-sm w-12">{translations["Invoice No"]}</th>
                                                                                            <th className="text-left px-2 py-2 text-gray-400 text-sm w-12">{translations["Product Code"]}</th>
                                                                                            <th className="text-left px-2 py-2 text-gray-400 text-sm w-12">{translations["Product Name"]}</th>
                                                                                            <th className="text-center px-2 py-2 text-gray-400 text-sm w-12">{translations["Deposit"]}</th>
                                                                                            <th className="text-center px-2 py-2 text-gray-400 text-sm w-12">{translations["Qty"]}</th>
                                                                                            <th className="text-center px-2 py-2 text-gray-400 text-sm w-12">{translations["Price"]}</th>
                                                                                            <th className="text-center px-2 py-2 text-gray-400 text-sm w-12">{translations["Total"]}</th>
                                                                                        </>
                                                                                    ) : list.type === "AR" ? (
                                                                                        <>
                                                                                            <th className="text-left px-2 py-2 text-gray-400 text-sm w-12">{translations["Invoice No"]}</th>
                                                                                            <th className="text-left px-2 py-2 text-gray-400 text-sm w-12">{translations["Product Code"]}</th>
                                                                                            <th className="text-left px-2 py-2 text-gray-400 text-sm w-12">{translations["Product Name"]}</th>
                                                                                            <th className="text-center px-2 py-2 text-gray-400 text-sm w-12">{translations["Deposit"]}</th>
                                                                                            <th className="text-center px-2 py-2 text-gray-400 text-sm w-12">{translations["Qty"]}</th>
                                                                                            <th className="text-center px-2 py-2 text-gray-400 text-sm w-12">{translations["Price"]}</th>
                                                                                            <th className="text-center px-2 py-2 text-gray-400 text-sm w-12">{translations["Total"]}</th>
                                                                                        </>
                                                                                    ) : list.type === "ORDER" ? (
                                                                                        <>
                                                                                            <th className="text-left px-2 py-2 text-gray-400 text-sm w-12">{translations["Ordered Product"]}</th>
                                                                                            <th className="text-center px-2 py-2 text-gray-400 text-sm w-12">{translations["Price"]}</th>
                                                                                            <th className="text-center px-2 py-2 text-gray-400 text-sm w-12">{translations["Qty"]}</th>
                                                                                            <th className="text-center px-2 py-2 text-gray-400 text-sm w-12">{translations["Total"]}</th>
                                                                                            <th className="text-center px-2 py-2 text-gray-400 text-sm w-12">{translations["Deposit"]}</th>
                                                                                        </>
                                                                                    ) : (
                                                                                        <th colSpan={6} className="text-center text-gray-400 text-sm px-2 py-2">
                                                                                            {translations["No Headers Available"]}
                                                                                        </th>
                                                                                    )}
                                                                                </tr>
                                                                            </thead>
                                                                            <tbody>
                                                                                {creditDetailsMap[list.id] && creditDetailsMap[list.id]!.length > 0 ? (
                                                                                    creditDetailsMap[list.id]!.map((detail, i) => (
                                                                                        <tr key={detail.id || i}>
                                                                                            {list.type === "CR" && (
                                                                                                <>
                                                                                                    <td className="py-2 px-2 text-gray-400 text-left text-custom-sm">
                                                                                                        <div className="flex items-center space-x-3">
                                                                                                            <div>
                                                                                                                <div className="group flex items-center">
                                                                                                                    <p className="text-gray-400 text-custom-sm">{detail.account_code}</p>
                                                                                                                    <CopyToClipboard text={detail.account_code} />
                                                                                                                </div>
                                                                                                            </div>
                                                                                                        </div>
                                                                                                    </td>
                                                                                                    <td className="py-2 px-2 text-gray-400 text-left text-custom-sm">
                                                                                                        <div className="flex items-center space-x-3">
                                                                                                            <div>
                                                                                                                <div className="group flex items-center">
                                                                                                                    <p className="text-gray-400 text-custom-sm">
                                                                                                                        {lang === "en" ? detail.description_en : detail.description_cn}
                                                                                                                    </p>
                                                                                                                    <CopyToClipboard
                                                                                                                        text={lang === "en" ? detail.description_en : detail.description_cn}
                                                                                                                    />
                                                                                                                </div>
                                                                                                            </div>
                                                                                                        </div>
                                                                                                    </td>
                                                                                                    <td className="py-2 px-2 text-gray-400 text-left text-custom-sm">
                                                                                                        <div className="flex items-center space-x-3">
                                                                                                            <div>
                                                                                                                <div className="group flex items-center">
                                                                                                                    <p className="text-gray-400 text-custom-sm">{detail.particulars}</p>
                                                                                                                    <CopyToClipboard text={detail.particulars} />
                                                                                                                </div>
                                                                                                            </div>
                                                                                                        </div>
                                                                                                    </td>
                                                                                                    <td className="py-2 px-2 text-gray-400 text-left text-custom-sm">
                                                                                                        <div className="flex items-center space-x-3">
                                                                                                            <div>
                                                                                                                <div className="group flex items-center">
                                                                                                                    <p className="text-gray-400 text-custom-sm">
                                                                                                                        {lang === "en" ? detail.product_title_en : detail.product_title_cn}
                                                                                                                    </p>
                                                                                                                    <CopyToClipboard
                                                                                                                        text={lang === "en" ? detail.product_title_en : detail.product_title_cn}
                                                                                                                    />
                                                                                                                </div>
                                                                                                            </div>
                                                                                                        </div>
                                                                                                    </td>
                                                                                                    <td className="py-2 px-2 text-gray-400 text-center text-custom-sm">{detail.ex_rate}</td>
                                                                                                    <td className="py-2 px-2 text-gray-400 text-center text-custom-sm">
                                                                                                        {detail.currency} {formatMoney(detail.amount)}
                                                                                                    </td>
                                                                                                </>
                                                                                            )}

                                                                                            {list.type === "RV" && (
                                                                                                <>
                                                                                                    <td className="py-2 px-2 text-gray-400 text-left text-custom-sm">{detail.account_code}</td>
                                                                                                    <td className="py-2 px-2 text-gray-400 text-left text-custom-sm">
                                                                                                        {lang === "en" ? detail.description_en : detail.description_cn}
                                                                                                    </td>
                                                                                                    <td className="py-2 px-2 text-gray-400 text-left text-custom-sm">{detail.particulars}</td>
                                                                                                    <td className="py-2 px-2 text-gray-400 text-left text-custom-sm">
                                                                                                        {lang === "en" ? detail.product_title_en : detail.product_title_cn}
                                                                                                    </td>
                                                                                                    <td className="py-2 px-2 text-gray-400 text-left text-custom-sm">{detail.invoice_no}</td>
                                                                                                    <td className="py-2 px-2 text-gray-400 text-center text-custom-sm">{detail.ex_rate}</td>
                                                                                                    <td className="py-2 px-2 text-gray-400 text-center text-custom-sm">
                                                                                                        {detail.currency} {formatMoney(detail.amount_paid)}
                                                                                                    </td>
                                                                                                </>
                                                                                            )}

                                                                                            {list.type === "INV" && (
                                                                                                <>
                                                                                                    <td className="py-2 px-2 text-gray-400 text-left text-custom-sm">
                                                                                                        <div className="flex items-center space-x-3">
                                                                                                            <div>
                                                                                                                <div className="group flex items-center">
                                                                                                                    <p className="text-gray-400 text-custom-sm">{detail.invoice_no}</p>
                                                                                                                    <CopyToClipboard text={detail.invoice_no} />
                                                                                                                </div>
                                                                                                            </div>
                                                                                                        </div>
                                                                                                    </td>
                                                                                                    <td className="py-2 px-2 text-gray-400 text-left text-custom-sm">
                                                                                                        <div className="flex items-center space-x-3">
                                                                                                            <div>
                                                                                                                <div className="group flex items-center">
                                                                                                                    <p className="text-gray-400 text-custom-sm">{detail.product_code}</p>
                                                                                                                    <CopyToClipboard text={detail.product_code} />
                                                                                                                </div>
                                                                                                            </div>
                                                                                                        </div>
                                                                                                    </td>
                                                                                                    <td className="py-2 px-2 text-gray-400 text-left text-custom-sm">
                                                                                                        <div className="flex items-center space-x-3">
                                                                                                            <div>
                                                                                                                <div className="group flex items-center">
                                                                                                                    <p className="text-gray-400 text-custom-sm">
                                                                                                                        {lang === "en" ? detail.product_title_en : detail.product_title_cn}
                                                                                                                    </p>
                                                                                                                    <CopyToClipboard
                                                                                                                        text={lang === "en" ? detail.product_title_en : detail.product_title_cn}
                                                                                                                    />
                                                                                                                </div>
                                                                                                            </div>
                                                                                                        </div>
                                                                                                    </td>

                                                                                                    <td className="py-2 px-2 text-gray-400 text-center text-custom-sm">
                                                                                                        {detail.currency} {formatMoney(detail.deposit)}
                                                                                                    </td>
                                                                                                    <td className="py-2 px-2 text-gray-400 text-center text-custom-sm">{detail.qty}</td>
                                                                                                    <td className="py-2 px-2 text-gray-400 text-center text-custom-sm">
                                                                                                        {detail.currency} {formatMoney(detail.price)}
                                                                                                    </td>
                                                                                                    <td className="py-2 px-2 text-gray-400 text-center text-custom-sm">
                                                                                                        {detail.currency} {formatMoney(detail.total)}
                                                                                                    </td>
                                                                                                </>
                                                                                            )}

                                                                                            {list.type === "AR" && (
                                                                                                <>
                                                                                                    <td className="py-2 px-2 text-gray-400 text-left text-custom-sm">
                                                                                                        <div className="flex items-center space-x-3">
                                                                                                            <div>
                                                                                                                <div className="group flex items-center">
                                                                                                                    <p className="text-gray-400 text-custom-sm">{detail.invoice_no}</p>
                                                                                                                    <CopyToClipboard text={detail.invoice_no} />
                                                                                                                </div>
                                                                                                            </div>
                                                                                                        </div>
                                                                                                    </td>
                                                                                                    <td className="py-2 px-2 text-gray-400 text-left text-custom-sm">
                                                                                                        <div className="flex items-center space-x-3">
                                                                                                            <div>
                                                                                                                <div className="group flex items-center">
                                                                                                                    <p className="text-gray-400 text-custom-sm">{detail.product_code}</p>
                                                                                                                    <CopyToClipboard text={detail.product_code} />
                                                                                                                </div>
                                                                                                            </div>
                                                                                                        </div>
                                                                                                    </td>
                                                                                                    <td className="py-2 px-2 text-gray-400 text-left text-custom-sm">
                                                                                                        <div className="flex items-center space-x-3">
                                                                                                            <div>
                                                                                                                <div className="group flex items-center">
                                                                                                                    <p className="text-gray-400 text-custom-sm">
                                                                                                                        {lang === "en" ? detail.product_title_en : detail.product_title_cn}
                                                                                                                    </p>
                                                                                                                    <CopyToClipboard
                                                                                                                        text={lang === "en" ? detail.product_title_en : detail.product_title_cn}
                                                                                                                    />
                                                                                                                </div>
                                                                                                            </div>
                                                                                                        </div>
                                                                                                    </td>
                                                                                                    <td className="py-2 px-2 text-gray-400 text-center text-custom-sm">
                                                                                                        {detail.currency} {formatMoney(detail.deposit)}
                                                                                                    </td>
                                                                                                    <td className="py-2 px-2 text-gray-400 text-center text-custom-sm">{detail.qty}</td>
                                                                                                    <td className="py-2 px-2 text-gray-400 text-center text-custom-sm">
                                                                                                        {detail.currency} {formatMoney(detail.price)}
                                                                                                    </td>
                                                                                                    <td className="py-2 px-2 text-gray-400 text-center text-custom-sm">
                                                                                                        {detail.currency} {formatMoney(detail.total)}
                                                                                                    </td>
                                                                                                </>
                                                                                            )}

                                                                                            {list.type === "ORDER" && (
                                                                                                <>
                                                                                                    <td className="py-2 px-2 text-gray-400 text-left text-custom-sm">
                                                                                                        <div className="flex items-center space-x-3">
                                                                                                            <div>
                                                                                                                <div className="group flex items-center">
                                                                                                                    <p className="text-gray-300 text-custom-sm select-text">{detail.product_code}</p>
                                                                                                                    <CopyToClipboard text={detail.product_code || ""} />
                                                                                                                </div>
                                                                                                                <div className="group flex items-center">
                                                                                                                    <p className="text-gray-400 text-custom-sm">
                                                                                                                        {lang === "en" ? detail.product_title_en : detail.product_title_cn}
                                                                                                                    </p>
                                                                                                                    <CopyToClipboard
                                                                                                                        text={lang === "en" ? detail.product_title_en : detail.product_title_cn}
                                                                                                                    />
                                                                                                                </div>
                                                                                                            </div>
                                                                                                        </div>
                                                                                                    </td>
                                                                                                    <td className="py-2 px-2 text-gray-400 text-center text-custom-sm">
                                                                                                        {detail.currency} {formatMoney(detail.price)}
                                                                                                    </td>
                                                                                                    <td className="py-2 px-2 text-gray-400 text-center text-custom-sm">{detail.qty}</td>
                                                                                                    <td className="py-2 px-2 text-gray-400 text-center text-custom-sm">
                                                                                                        {detail.currency} {formatMoney(detail.total)}
                                                                                                    </td>
                                                                                                    <td className="py-2 px-2 text-gray-400 text-center text-custom-sm">
                                                                                                        {detail.currency} {formatMoney(detail.item_deposit)}
                                                                                                    </td>
                                                                                                </>
                                                                                            )}
                                                                                        </tr>
                                                                                    ))
                                                                                ) : (
                                                                                    <tr>
                                                                                        <td colSpan={8} className="py-2 px-2 text-center text-gray-400 text-sm">
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
                                                    );
                                                })}
                                            </React.Fragment>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                        <table className="w-full sticky bottom-0 z-[1]" style={{ backgroundColor: "#1f2132" }}>
                            <tfoot>
                                {CustomerCreditFooter?.map((footer, index) => (
                                    <tr key={index} className="border-b hover:bg-gray-700 hover:bg-opacity-30 transition-colors" style={{ borderColor: "#40404042" }}>
                                        <td className="w-[5%] px-2 py-2 text-left text-gray-300 text-sm"></td>
                                        <td className="w-[19%] px-2 py-2 text-left text-gray-300 text-sm"></td>
                                        <td className="w-[29%] px-2 py-2 text-left text-gray-300 text-sm"></td>
                                        <td className="w-[29%] px-2 py-2 text-right text-gray-300 text-sm"></td>
                                        <td className="w-[18%] py-2 px-2 text-right text-custom-sm">
                                            <span>{translations["Closing Balance"]} : </span>
                                            <span className="text-yellow-400">
                                                {footer.currency} {formatMoney(footer.balance)}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tfoot>
                        </table>
                    </div>
                </div>
                {/* Footer with Pagination */}
                <div className="p-4 border-t flex items-center justify-between" style={{ borderColor: "#404040" }}>
                    <div className="flex items-center space-x-1">
                        <MemoizedPagination currentPage={currentPage_Credit} totalPages={totalPages_Credit} onPageChange={(page) => setCurrentPage_Credit(page)} />
                        <MemoizedItemsPerPageSelector
                            value={itemsPerPage_Credit}
                            onChange={(val: number) => {
                                setItemsPerPage_Credit(val);
                                setCurrentPage_Credit(1);
                            }}
                            options={pageSizeOptions}
                        />
                        <ExportReportSelector formats={["odt"]} baseName="CustCreditNote" ids={customerOrderHistory.map((p) => p.id)} language={lang} />
                    </div>
                </div>
            </div>
        </div>
    );
    const renderRefund = () => (
        <div className="p-2">
            <div className="overflow-x-auto mt-1">
                <div className="h-[calc(100vh-215px)] overflow-y-auto">
                    <table className="w-full">
                        <thead className="sticky top-0 z-[1]" style={{ backgroundColor: "#1f2132" }}>
                            <tr className="border-b" style={{ borderColor: "#2d2d30" }}>
                                <th className="w-[5%] px-2 py-2 text-left text-gray-400 text-sm"></th>
                                <th className="w-[25%] px-2 py-2 text-left text-gray-400 text-sm">{translations["Transaction Date"]}</th>
                                <th className="w-[25%] px-2 py-2 text-left text-gray-400 text-sm">{translations["Transaction Ref"]}</th>
                                <th className="w-[25%] px-2 py-2 text-center text-gray-400 text-sm">{translations["Bank"]}</th>
                                <th className="w-[15%] px-2 py-2 text-center text-gray-400 text-sm">{translations["Amount"]}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {customerRefund.length === 0 && (
                                <tr className="border-b hover:bg-gray-700 hover:bg-opacity-30 transition-colors" style={{ borderColor: "#40404042" }}>
                                    <td colSpan={12} className="px-2 py-2 text-center text-gray-300 text-sm">
                                        {translations["No Record Found"]}
                                    </td>
                                </tr>
                            )}
                            {customerRefund.length > 0 &&
                                customerRefund.map((list) => (
                                    <tr className="border-b hover:bg-gray-700 hover:bg-opacity-30 transition-colors" style={{ borderColor: "#40404042" }}>
                                        <td className="px-2 py-2 text-left text-gray-300 text-sm">
                                            <button className={`px-1 py-1 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-xs`}>
                                                <Plus size={16} />
                                            </button>
                                        </td>
                                        <td className="py-2 px-2 text-gray-400 text-left text-custom-sm">{list.pv_date}</td>
                                        <td className="py-2 px-2 text-gray-400 text-left text-custom-sm">
                                            <div>
                                                <div className="group flex items-center">
                                                    <p className="text-custom-sm select-text">{list.ref_data}</p>
                                                    <CopyToClipboard text={list.ref_data || ""} />
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-2 px-2 text-gray-400 text-center text-custom-sm">{lang === "en" ? list.bank_name_en : list.bank_name_cn}</td>
                                        <td className="py-2 px-2 text-gray-400 text-center text-custom-sm">
                                            {list.currency}
                                            <br></br>
                                            {list.total_amount}
                                        </td>
                                    </tr>
                                ))}
                        </tbody>
                    </table>
                </div>
                {/* Footer with Pagination */}
                <div className="p-4 border-t flex items-center justify-between" style={{ borderColor: "#404040" }}>
                    <div className="flex items-center space-x-4">
                        <MemoizedPagination currentPage={currentPage_Refund} totalPages={totalPages_Refund} onPageChange={(page) => setCurrentPage_Invoices(page)} />
                        <MemoizedItemsPerPageSelector
                            value={itemsPerPage_Refund}
                            onChange={(val: number) => {
                                setItemsPerPage_Refund(val);
                                setCurrentPage_Refund(1);
                            }}
                            options={pageSizeOptions}
                        />
                        <select className="px-3 py-2 border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-sm my-important-dropdown">
                            <option value="CustomerList.odt">{translations["OpenOffice Writer Document (.odt)"]}</option>
                            <option value="CustomerList.ods">{translations["OpenOffice Calc Spreadsheet (.ods)"]}</option>
                            <option value="CustomerList.xlsx">{translations["Ms Excel SpreadSheet (.xlsx)"]}</option>
                        </select>
                        <button className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors flex items-center space-x-1 text-sm">
                            <span>{translations["MCGenerate"]}</span>
                        </button>
                        <button className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors flex items-center space-x-1 text-sm">
                            <span>{translations["buttontextcustomize"]}</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
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
                        <button onClick={handleCopyCustomer} className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 rounded text-white transition">
                            {translations["Save"]}
                        </button>
                    </div>
                </div>
            </div>
        );
    };
    if (!customer) {
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
                            {activeTab != "information" && (
                                <div className="flex items-center space-x-4">
                                    <div className="relative">
                                        {activeTab === "orders" && (
                                            <input
                                                type="search"
                                                value={searchTerm_Order}
                                                onChange={(e) => {
                                                    setSearchTerm_Order(e.target.value);
                                                    setCurrentPage_Order(1);
                                                }}
                                                placeholder={translations["Search"]}
                                                className="pl-10 pr-4 py-2 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-sm"
                                                style={{ backgroundColor: "#2d2d30", borderColor: "#555555" }}
                                            />
                                        )}
                                        {activeTab === "invoices" && (
                                            <input
                                                type="search"
                                                value={searchTerm_Invoices}
                                                onChange={(e) => {
                                                    setSearchTerm_Invoices(e.target.value);
                                                    setCurrentPage_Invoices(1);
                                                }}
                                                placeholder={translations["Search"]}
                                                className="pl-10 pr-4 py-2 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-sm"
                                                style={{ backgroundColor: "#2d2d30", borderColor: "#555555" }}
                                            />
                                        )}
                                        {activeTab === "sales-order" && (
                                            <input
                                                type="search"
                                                value={searchTerm_SalesOrder}
                                                onChange={(e) => {
                                                    setSearchTerm_SalesOrder(e.target.value);
                                                    setCurrentPage_SalesOrder(1);
                                                }}
                                                placeholder={translations["Search"]}
                                                className="pl-10 pr-4 py-2 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-sm"
                                                style={{ backgroundColor: "#2d2d30", borderColor: "#555555" }}
                                            />
                                        )}
                                        {activeTab === "deposit" && (
                                            <input
                                                type="search"
                                                value={searchTerm_Deposit}
                                                onChange={(e) => {
                                                    setSearchTerm_Deposit(e.target.value);
                                                    setCurrentPage_Deposit(1);
                                                }}
                                                placeholder={translations["Search"]}
                                                className="pl-10 pr-4 py-2 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-sm"
                                                style={{ backgroundColor: "#2d2d30", borderColor: "#555555" }}
                                            />
                                        )}
                                        {activeTab === "profitability" && (
                                            <input
                                                type="search"
                                                value={searchTerm_Profitability}
                                                onChange={(e) => {
                                                    setSearchTerm_Profitability(e.target.value);
                                                    setCurrentPage_Profitability(1);
                                                }}
                                                placeholder={translations["Search"]}
                                                className="pl-10 pr-4 py-2 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-sm"
                                                style={{ backgroundColor: "#2d2d30", borderColor: "#555555" }}
                                            />
                                        )}
                                        {activeTab === "order-history" && (
                                            <input
                                                type="search"
                                                placeholder={translations["Search"]}
                                                value={searchTerm_OrderHistory}
                                                onChange={(e) => {
                                                    setSearchTerm_OrderHistory(e.target.value);
                                                    setCurrentPage_OrderHistory(1);
                                                }}
                                                className="pl-10 pr-4 py-2 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-sm"
                                                style={{ backgroundColor: "#2d2d30", borderColor: "#555555" }}
                                            />
                                        )}
                                        {activeTab === "credit" && (
                                            <input
                                                type="search"
                                                value={searchTerm_Credit}
                                                onChange={(e) => {
                                                    setSearchTerm_Credit(e.target.value);
                                                    setCurrentPage_Credit(1);
                                                }}
                                                placeholder={translations["Search"]}
                                                className="pl-10 pr-4 py-2 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-sm"
                                                style={{ backgroundColor: "#2d2d30", borderColor: "#555555" }}
                                            />
                                        )}
                                        {activeTab === "refund" && (
                                            <input
                                                type="search"
                                                value={searchTerm_Refund}
                                                onChange={(e) => {
                                                    setSearchTerm_Refund(e.target.value);
                                                    setCurrentPage_Refund(1);
                                                }}
                                                placeholder={translations["Search"]}
                                                className="pl-10 pr-4 py-2 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-sm"
                                                style={{ backgroundColor: "#2d2d30", borderColor: "#555555" }}
                                            />
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                    {activeTab === "information" && (
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
                                disabled={customerId === 0}
                                onClick={handleDelete}
                                className="px-2 py-2 bg-red-600 hover:bg-red-700 text-[#ffffffcc] text-custom-sm rounded-lg text-sm font-medium transition-colors"
                            >
                                {translations["Delete"]}
                            </button>
                        </div>
                    )}
                </div>
            </div>
            {/* Main Content - Scrollable */}
            <div className="flex flex-1 p-2 mb-[10px]" style={{ backgroundColor: "#19191c" }}>
                {/* Main Content Area - Scrollable */}
                <div className="flex-1">
                    {activeTab === "information" && renderCustomerInformation()}
                    {activeTab === "orders" && renderOrders()}
                    {activeTab === "invoices" && renderInvoices()}
                    {activeTab === "sales-order" && renderSalesOrder()}
                    {activeTab === "deposit" && renderDeposit()}
                    {activeTab === "profitability" && renderProfitability()}
                    {activeTab === "order-history" && renderOrderHistory()}
                    {activeTab === "credit" && renderCredit()}
                    {activeTab === "refund" && renderRefund()}
                </div>
            </div>
            {/* Image Gallery Modal */}
            {renderCopyPopup()}
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
export default CustomerDetails;
