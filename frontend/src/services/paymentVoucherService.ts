import api from './api';

// Interface matching your Laravel API response
export interface OptionType {
    value: string | number;
    value2: string | number;
    en: string;
    cn: string;
}
export interface PaginatedResponse<T> {
    current_page: number;
    data: T[];
    last_page: number;
    per_page: number;
    total: number;
    [key: string]: any;
}
export interface ApiPaymentVoucher {
    id: number;
    pv_number: string;
    pv_date?: string;
    pay_to_en?: string;
    pay_to_cn?: string;
    particular_en?: string;
    particular_cn?: string;
    ex_rate: number;
    supplier_id?: number;
    bank?: string;
    total_amount: number;
    base_total_amount: number;
    credit_used: number;
    pv_status_id: number;
    payment_type_id: number;
    status_value_en?: string;
    status_value_cn?: string;
    payment_type_en?: string;
    payment_type_cn?: string;
    supplier_code?: string;
    customer_code?: string;
    suppliername_en?: string;
    suppliername_cn?: string;
    account_name_en?: string;
    account_name_cn?: string;
    [key: string]: any;
}
export interface DetailsRow {
    id: number;
    account_code: string;
    product_id: number;
    po_detail_id: number;
    ap_detail_id: number;
    qty: number;
    account_no: string;
    ap_invoice_no: string;
    ref_data: string;
    currency: string;
    ex_rate: number;
    amount: number;
    base_amount: number;
    ex_rate_diff: number;
    is_deleted: number;
    product_code: string;
    product_title_en: string;
    product_title_cn: string;
    account_name_en: string;
    account_name_cn: string;
    delete_type: string;
    age_type: string;
    indexInt: number;
}
export interface SalesOrderResponse {
    success: boolean;
    message: string;
    list: PaginatedResponse<ApiPaymentVoucher>;
}
export type FilterParams = {
    search?: string;
    date_from?: Date | null;
    date_to?: Date | null;
    category_dates?: string;
    supplier_codes?: string[];
};
export interface ApiProduct {
    id: number;
    warehouse?: string;
    product_code?: string;
    product_title_en?: string;
    product_title_cn?: string;
    warehouse_en?: string;
    warehouse_cn?: string;
    qty?: number;
    new_qty?: number;
    [key: string]: any; // Allow for additional fields from your API
}
export interface ProductListResponse {
    success: boolean;
    message: string;
    product: PaginatedResponse<ApiProduct>;
}
// Product service to fetch from your Laravel API
export const paymentVoucherService = {
    getAllPVList: async (
        page = 1,
        perPage = 10,
        filters: {
            search?: string;
            supplier_codes?: string[];
            category_dates?: string;
            date_from?: Date | null;
            date_to?: Date | null;
        } = {}
    ): Promise<PaginatedResponse<ApiPaymentVoucher>> => {
        try {
            const response = await api.get<SalesOrderResponse>('/payment-voucher-list', {
                params: { page, per_page: perPage, ...filters, }
            });
            if (response.data.success && response.data.list) {
                return response.data.list;
            } else {
                throw new Error(response.data.message || 'Failed to fetch payment-voucher-list');
            }
        } catch (error) {
            console.error('Error fetching payment-voucher-list:', error);
            throw new Error(error instanceof Error ? error.message : 'Failed to fetch payment-voucher-list');
        }
    },
    getAllOperatingExpense: async (
        page = 1,
        perPage = 10,
        filters: {
            search?: string;
            supplier_codes?: string[];
            category_dates?: string;
            date_from?: Date | null;
            date_to?: Date | null;
        } = {}
    ): Promise<PaginatedResponse<ApiPaymentVoucher>> => {
        try {
            const response = await api.get<SalesOrderResponse>('/operating-expense-list', {
                params: { page, per_page: perPage, ...filters, }
            });
            if (response.data.success && response.data.list) {
                return response.data.list;
            } else {
                throw new Error(response.data.message || 'Failed to fetch operating-expense-list');
            }
        } catch (error) {
            console.error('Error fetching operating-expense-list:', error);
            throw new Error(error instanceof Error ? error.message : 'Failed to fetch operating-expense-list');
        }
    },

    voidPaymentVoucher: async (data: FormData): Promise<any> => {
        try {
            const response = await api.post(`/void-payment-voucher`, data, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            return response.data;
        } catch (error) {
            console.error('Error updating void-payment-voucher:', error);
            throw new Error('Failed to update void-payment-voucher');
        }
    },
    getPVInfo: async (id: number): Promise<any> => {
        try {
            const response = await api.get(`/payment-voucher-info/${id}`);
            if (response.data.success && response.data.list) {
                return response.data.list;
            } else {
                throw new Error(response.data.message || 'Failed to fetch payment-voucher-info');
            }
        } catch (error) {
            console.error('Error fetching payment-voucher-info:', error);
            throw new Error(error instanceof Error ? error.message : 'Failed to fetch payment-voucher-info');
        }
    },
    getCustomerInfoByCode: async (customerCode: string, action: string): Promise<any> => {
        try {
            const response = await api.get(`/get-customer-bycode/${customerCode}/${action}`);
            if (response.data.success && response.data) {
                return response.data;
            } else {
                throw new Error(response.data.message || 'Failed to fetch customer info');
            }
        } catch (error) {
            console.error('Error fetching customer info:', error);
            throw new Error(error instanceof Error ? error.message : 'Failed to fetch customer info');
        }
    },
    updatePaymentVoucher: async (id: number, data: FormData): Promise<any> => {
        try {
            const response = await api.post(`/update-payment-voucher/${id}`, data, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            return response.data;
        } catch (error) {
            console.error('Error updating payment-voucher:', error);
            throw new Error('Failed to update payment-voucher');
        }
    },
    getPVChartsOfAccount: async (page = 1,perPage = 10,search = '', accountCode: string): Promise<any> => {
        try {
            const response = await api.get('/rv-charts-of-account', {
                params: { page, per_page: perPage, search, accountCode}
            });
            if (response.data.success && response.data.list) {
                return response.data.list;
            } else {
                throw new Error(response.data.message || 'Failed to fetch expense-charts-of-accounts');
            }
        } catch (error) {
            console.error('Error fetching expense-charts-of-accounts:', error);
            throw new Error(error instanceof Error ? error.message : 'Failed to fetch expense-charts-of-accounts');
        }
    },
    getExpenseChartsOfAccount: async (page = 1,perPage = 10,search = '', accountCode: string): Promise<any> => {
        try {
            const response = await api.get('/expense-charts-of-accounts', {
                params: { page, per_page: perPage, search, accountCode}
            });
            if (response.data.success && response.data.list) {
                return response.data.list;
            } else {
                throw new Error(response.data.message || 'Failed to fetch expense-charts-of-accounts');
            }
        } catch (error) {
            console.error('Error fetching expense-charts-of-accounts:', error);
            throw new Error(error instanceof Error ? error.message : 'Failed to fetch expense-charts-of-accounts');
        }
    },
    doGetSupplierInvoice: async (supplier_id: number): Promise<any> => {
        try {
            const response = await api.get(`/supplier-invoice-in-pv/${supplier_id}`);
            if (response.data.success && response.data.list) {
                return response.data.list;
            } else {
                throw new Error(response.data.message || 'Failed to fetch supplier-invoice-in-pv');
            }
        } catch (error) {
            console.error('Error fetching supplier-invoice-in-pv:', error);
            throw new Error(error instanceof Error ? error.message : 'Failed to fetch supplier-invoice-in-pv');
        }
    },
    doGetAPInvoiceDetail: async (ap_number: string,account_code: string): Promise<any> => {
        try {
            const response = await api.get(`/supplier-invoice-details/${ap_number}/${account_code}`);
            if (response.data.success && response.data.list) {
                return response.data.list;
            } else {
                throw new Error(response.data.message || 'Failed to fetch supplier-invoice-details');
            }
        } catch (error) {
            console.error('Error fetching supplier-invoice-details:', error);
            throw new Error(error instanceof Error ? error.message : 'Failed to fetch supplier-invoice-details');
        }
    },
    getPOSupplierInfo: async (supplierCode: string): Promise<any> => {
        try {
            const response = await api.get(`/get-po-supplier-info/${supplierCode}`);
            if (response.data.success && response.data) {
                return response.data;
            } else {
                throw new Error(response.data.message || 'Failed to fetch supplier info');
            }
        } catch (error) {
            console.error('Error fetching supplier info:', error);
            throw new Error(error instanceof Error ? error.message : 'Failed to fetch supplier info');
        }
    },
};
