import { fetchWithCache } from '@/utils/fetchWithCache';
import { dropdownService } from '@/services/dropdownService';
import { globalService } from '@/services/globalService';

export interface OptionType {
    value: string;
    value2: string;
    label: string;
    en: string;
    cn: string;
    code?: string;
}

export const allDropdownKey = `cached-all-dropdown`;
export const productTypesKey = `cached-product-types`;
export const productManufacturerKey = `cached-product-manufacturer`;
export const productBrandKey = `cached-product-brand`;
export const productSeriesKey = `cached-product-series`;
export const productGenreKey = `cached-product-genre`;
export const productSupplierKey = `cached-supplier-list`;
export const productCustomerGroupKey = `cached-customer-group`;
export const productCurrencyKey = 'cached-currency';
export const productWarehouseKey = 'cached-warehouse';
export const productCountriesKey = 'cached-countries';
export const productStatesKey = 'cached-states';
export const productSourceKey = 'cached-source';
export const productSalesPersonKey = 'cached-sales-person';
export const productCourierKey = 'cached-courier';
export const productTaxGroupKey = 'cached-tax-group';
export const productShippingTermsKey = 'cached-shipping-terms';
export const productPaymentTermsKey = 'cached-payment-terms';
export const productCustomerTypeKey = 'cached-customer-type';
export const productBankList = 'cached-bank-list';
export const productAllKey = 'cached-product-all';
export const customerAllKey = 'cached-customer-all';
export const supplierAllKey = 'cached-supplier-all';
export const postatusKey = 'cached-poststatus-all';
export const grnstatusKey = 'cached-grnstatus-all';
export const storeLocationkey = 'cached-store-location';
export const expensesKey = 'cached-expenses-all';
export const invoiceTypeKey = 'cached-invoice-type';
export const shippingStatKey = 'cached-shipping-stat';
export const invoiceStatuskey = 'cached-invoice-status';
export const paymentTypeKey = 'cached-payment-type';

export const fetchProductTypes = async () => {
    return await fetchWithCache(productTypesKey, dropdownService.getAllProductTypes);
};

export const fetchProductManufaturer = async () => {
    return await fetchWithCache(productManufacturerKey, dropdownService.getAllManufacturers);
};

export const fetchProductBrand = async () => {
    return await fetchWithCache(productBrandKey, dropdownService.getAllBrands);
};

export const fetchProductSeries = async () => {
    return await fetchWithCache(productSeriesKey, dropdownService.getAllSeries);
};

export const fetchProductGenre = async () => {
    return await fetchWithCache(productGenreKey, dropdownService.getAllGenres);
};

export const fetchSuppliers = async () => {
    return await fetchWithCache(productSupplierKey, dropdownService.getAllSuppliers);
};

export const fetchCustomerGroups = async () => {
    return await fetchWithCache(productCustomerGroupKey, dropdownService.getAllCustomerGroup);
};

export const fetchCurrencies = async () => {
    return await fetchWithCache(productCurrencyKey, dropdownService.getAllCurrencies);
};

export const fetchWarehouses = async () => {
    return await fetchWithCache(productWarehouseKey, dropdownService.getAllWarehouse);
};

export const fetchCountries = async () => {
    return await fetchWithCache(productCountriesKey, dropdownService.getAllCountries);
};

export const fetchStates = async () => {
    return await fetchWithCache(productStatesKey, dropdownService.getAllStates);
};

export const fetchSource = async () => {
    return await fetchWithCache(productSourceKey, dropdownService.getAllSource);
};
export const fetchSalesPerson = async () => {
    return await fetchWithCache(productSalesPersonKey, dropdownService.getAllSalesPerson);
};

export const fetchCourier = async () => {
    return await fetchWithCache(productCourierKey, dropdownService.getAllCourier);
};

export const fetchTaxGroup = async () => {
    return await fetchWithCache(productTaxGroupKey, dropdownService.getAllTaxGroup);
};

export const fetchShippingTerms = async () => {
    return await fetchWithCache(productShippingTermsKey, dropdownService.getAllShippingTerms);
};

export const fetchPaymentTerms = async () => {
    return await fetchWithCache(productPaymentTermsKey, dropdownService.getAllPaymentTerms);
};

export const fetchCustomerType = async () => {
    return await fetchWithCache(productCustomerTypeKey, dropdownService.getAllCustomertype);
};

export const fetchBank = async () => {
    return await fetchWithCache(productBankList, dropdownService.getAllBanks);
};

export const fetchAllDropdowns = async () => {
    return await fetchWithCache(allDropdownKey, globalService.getAllDropdowns);
};

export const fetchAllCustomer = async () => {
    return await fetchWithCache(customerAllKey, dropdownService.getAllCustomer);
};

export const fetchAllProduct = async () => {
    return await fetchWithCache(productAllKey, dropdownService.getAllProduct);
};

export const fetchPOStatus = async () => {
    return await fetchWithCache(postatusKey, dropdownService.getAllPOStatus);
};
export const fetchGRNStatus = async () => {
    return await fetchWithCache(grnstatusKey, dropdownService.getAllGRNStatus);
};

export const fetchStoreLocation = async () => {
    return await fetchWithCache(storeLocationkey, dropdownService.getAllStoreLocation);
};

export const fetchAllExpenses = async () => {
    return await fetchWithCache(expensesKey, dropdownService.getAllExpenses);
};

export const fetchInvoiceType = async () => {
    return await fetchWithCache(invoiceTypeKey, dropdownService.getAllInvoiceType);
};

export const fetchShippingStat = async () => {
    return await fetchWithCache(shippingStatKey, dropdownService.getAllShippingStat);
};

export const fetchInvoiceStatus = async () => {
    return await fetchWithCache(invoiceStatuskey, dropdownService.getAllInvoiceStatus);
};
export const fetchPaymentType = async () => {
    return await fetchWithCache(paymentTypeKey, dropdownService.getAllPaymentType);
};

export const convertToSingleOption = (id: number | number[] | undefined, options: OptionType[]): OptionType | null => {
    if (!id) return null;
    const singleId = Array.isArray(id) ? id[0] : id;
    return options.find(opt => opt.value === singleId.toString()) || null;
};
export const convertToSingleOptionString = (id: string | string[] | undefined, options: OptionType[]): OptionType | null => {
    if (!id) return null;
    const singleId = Array.isArray(id) ? id[0] : id;
    return options.find(opt => opt.value === singleId.toString()) || null;
};