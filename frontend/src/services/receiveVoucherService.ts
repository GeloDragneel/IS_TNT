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
export interface ApiReceiveVoucher {
    id: number;
    rv_number?: string;
    rv_date?: string;
    customer_code?: string;
    customer_id:number,
    account_name_en?: string;
    account_name_cn?: string;
    status_value_en?: string;
    status_value_cn?: string;
    billing_address_en?: string;
    billing_address_cn?: string;
    bank_name_en?: string;
    bank_name_cn?: string;
    charts_en?: string;
    charts_cn?: string;
    currency?: string;
    rv_status_id: number;
    ex_rate?: number;
    total?: number;
    amount_paid?: number;
    base_amount_paid?: number;
    count: number;
    trans_detail_en?: string;
    trans_detail_cn?: string;
    base_total?: number;
    bank_charges?: number;
    base_bank_charges?: number;
    excess_amount?: number;
    base_excess_amount?: number;
    invoice_deposit?: number;
    credit_used?: number;
    total_unpaid?: number;
    base_total_unpaid?: number;
    operator:string;
    [key: string]: any;
}
export interface DetailsRow {
    id: number;
    product_id: number;
    product_code: string;
    product_title_en: string;
    product_title_cn: string;
    rv_number: string;
    qty: number;
    rv_date: string;
    amount: number;
    amount_paid: number;
    base_amount: number;
    currency: string;
    ex_rate: number;
    particulars: string;
    customer_id: number;
    invoice_no: string;
    account_code: string;
    ex_rate_diff: number;
    order_id: number;
    is_deleted: number;
    indexInt: number;
    age_type: string;
    account_name_en: string;
    account_name_cn: string;
    delete_type: string;
}
export interface SalesOrderResponse {
    success: boolean;
    message: string;
    list: PaginatedResponse<ApiReceiveVoucher>;
}
export type FilterParams = {
    search?: string;
    date_from?: Date | null;
    date_to?: Date | null;
    category_dates?: string;
    customer_codes?: string[];
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
export const receiveVoucherService = {
    getAllRVList: async (
        page = 1,
        perPage = 10,
        filters: {
            search?: string;
            customer_codes?: string[];
            category_dates?: string;
            date_from?: Date | null;
            date_to?: Date | null;
        } = {}
    ): Promise<PaginatedResponse<ApiReceiveVoucher>> => {
        try {
            const response = await api.get<SalesOrderResponse>('/receive-voucher-list', {
                params: { page, per_page: perPage, ...filters, }
            });
            if (response.data.success && response.data.list) {
                return response.data.list;
            } else {
                throw new Error(response.data.message || 'Failed to fetch receive-voucher-list');
            }
        } catch (error) {
            console.error('Error fetching receive-voucher-list:', error);
            throw new Error(error instanceof Error ? error.message : 'Failed to fetch receive-voucher-list');
        }
    },
    confirmSalesOrder: async (data: FormData): Promise<any> => {
        try {
            const response = await api.post(`/confirm-sales-order`, data, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            return response.data;
        } catch (error) {
            console.error('Error updating confirm-sales-order:', error);
            throw new Error('Failed to update confirm-sales-order');
        }
    },
    getDepositPaid: async (data: FormData): Promise<any> => {
        try {
            const response = await api.post(`/get-deposit-paid-invoice`, data, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            return response.data;
        } catch (error) {
            console.error('Error updating get-deposit-paid-invoice:', error);
            throw new Error('Failed to update get-deposit-paid-invoice');
        }
    },
    voidReceiveVoucher: async (data: FormData): Promise<any> => {
        try {
            const response = await api.post(`/void-receive-voucher`, data, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            return response.data;
        } catch (error) {
            console.error('Error updating void-receive-voucher:', error);
            throw new Error('Failed to update void-receive-voucher');
        }
    },
    cancelDepositPaid: async (row_arrays: any[], type: string, token: string): Promise<any> => {
        try {
            const response = await api.put('/cancel-customer-invoice', { row_arrays, type, token });
            return response.data;
        } catch (error) {
            console.error('Error cancel cancel-customer-invoice:', error);
            throw new Error('Failed to cancel cancel-customer-invoice');
        }
    },
    getRVInfo: async (id: number): Promise<any> => {
        try {
            const response = await api.get(`/receive-voucher-info/${id}`);
            if (response.data.success && response.data.list) {
                return response.data.list;
            } else {
                throw new Error(response.data.message || 'Failed to fetch receive-voucher-info');
            }
        } catch (error) {
            console.error('Error fetching receive-voucher-info:', error);
            throw new Error(error instanceof Error ? error.message : 'Failed to fetch receive-voucher-info');
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
    getAllSOProducts: async (page = 1, perPage = 10, search = '', sortId: number[] = [], prodType: string): Promise<PaginatedResponse<ApiProduct>> => {
        try {
            const response = await api.get<ProductListResponse>('/get-product-byinventory', {
                params: { page, per_page: perPage, search, sortId: sortId.length ? sortId.join(',') : [], prodType }
            });

            if (response.data.success && response.data.product) {
                return response.data.product;
            } else {
                throw new Error(response.data.message || 'Failed to fetch products');
            }
        } catch (error) {
            console.error('Error fetching products:', error);
            if (error instanceof Error) {
                throw new Error(`Failed to fetch products: ${error.message}`);
            }
            throw new Error('Failed to fetch products');
        }
    },
    getPriceOnProduct: async (customer_id: number, qty: number, product_id: number): Promise<any> => {
        try {
            const response = await api.get(`/get-price-on-product/${customer_id}/${qty}/${product_id}`);
            return response.data;
        } catch (error) {
            console.error('Error fetching get-price-on-product:', error);
            throw new Error(error instanceof Error ? error.message : 'Failed to fetch get-price-on-product');
        }
    },
    updateReceiveVoucher: async (id: number, data: FormData): Promise<any> => {
        try {
            const response = await api.post(`/update-receive-voucher/${id}`, data, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            return response.data;
        } catch (error) {
            console.error('Error updating receive-voucher:', error);
            throw new Error('Failed to update receive-voucher');
        }
    },
    getProductOnProductCode: async (product_code: string, customer_id: number): Promise<any> => {
        try {
            const response = await api.get(`/get-product-bycode/${product_code}/${customer_id}`);
            return response.data;
        } catch (error) {
            console.error('Error fetching product info:', error);
            throw new Error(error instanceof Error ? error.message : 'Failed to fetch product info');
        }
    },
    getCheckChangeDeposit: async (order_id: number, deposit: number, old_deposit: number, type: string): Promise<any> => {
        try {
            const response = await api.get(`/check-change-deposit/${order_id}/${deposit}/${old_deposit}/${type}`);
            return response.data;
        } catch (error) {
            console.error('Error fetching deposit info:', error);
            throw new Error(error instanceof Error ? error.message : 'Failed to fetch deposit info');
        }
    },
    convertToInvoice: async (soNumber: string): Promise<any> => {
        try {
            const response = await api.put('/convert-to-invoice', { soNumber });
            return response.data;
        } catch (error) {
            console.error('Error cancel cancel-sales-order:', error);
            throw new Error('Failed to cancel cancel-sales-order');
        }
    },
    getPaidAmounts: async (ids: number[]): Promise<any> => {
        try {
            const response = await api.post(`/get-amount-paid`, { ids });  // Use POST and send the IDs in the body
            if (response.data.success && response.data.list) {
                return response.data.list;
            } else {
                throw new Error(response.data.message || 'Failed to fetch get-amount-paid');
            }
        } catch (error) {
            console.error('Error fetching get-amount-paid:', error);
            throw new Error(error instanceof Error ? error.message : 'Failed to fetch get-amount-paid');
        }
    },
    createShipment: async (invoice_no: string): Promise<any> => {
        try {
            const response = await api.put('/create-invoice', { invoice_no });
            return response.data;
        } catch (error) {
            console.error('Error cancel create-invoice:', error);
            throw new Error('Failed to create-invoice');
        }
    },
    createReceiveVoucher: async (data: FormData): Promise<any> => {
        try {
            const response = await api.post(`/create-receive-voucher`, data, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            return response.data;
        } catch (error) {
            console.error('Error updating create-receive-voucher:', error);
            throw new Error('Failed to update create-receive-voucher');
        }
    },

    createJournalVoucher: async (data: FormData): Promise<any> => {
        try {
            const response = await api.post(`/create-journal-voucher`, data, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            return response.data;
        } catch (error) {
            console.error('Error updating create-journal-voucher:', error);
            throw new Error('Failed to update create-journal-voucher');
        }
    },

    paidInAdvance: async (data: FormData): Promise<any> => {
        try {
            const response = await api.post(`/paid-in-advance`, data, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            return response.data;
        } catch (error) {
            console.error('Error updating paid-in-advance:', error);
            throw new Error('Failed to update paid-in-advance');
        }
    },
    getRVChartsOfAccount: async (page = 1,perPage = 10,search = '', accountCode: string): Promise<any> => {
        try {
            const response = await api.get('/rv-charts-of-account', {
                params: { page, per_page: perPage, search, accountCode}
            });
            if (response.data.success && response.data.list) {
                return response.data.list;
            } else {
                throw new Error(response.data.message || 'Failed to fetch rv-charts-of-account');
            }
        } catch (error) {
            console.error('Error fetching rv-charts-of-account:', error);
            throw new Error(error instanceof Error ? error.message : 'Failed to fetch rv-charts-of-account');
        }
    },
    voidSingleInvoice: async (data: FormData): Promise<any> => {
        try {
            const response = await api.post(`/void-single-invoice`, data, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            return response.data;
        } catch (error) {
            console.error('Error updating void-single-invoice:', error);
            throw new Error('Failed to update void-single-invoice');
        }
    },
    getRVExists: async (customer_id: number): Promise<any> => {
        try {
            const response = await api.get(`/receive-voucher-exists/${customer_id}`);
            return response.data.list;
        } catch (error) {
            console.error('Error fetching receive-voucher-exists:', error);
            throw new Error(error instanceof Error ? error.message : 'Failed to fetch receive-voucher-exists');
        }
    },
    doGetButtonValue: async (customer_id: number): Promise<any> => {
        try {
            const response = await api.get(`/get-button-value/${customer_id}`);
            if (response.data.success && response.data.list) {
                return response.data.list;
            } else {
                throw new Error(response.data.message || 'Failed to fetch get-button-value');
            }
        } catch (error) {
            console.error('Error fetching get-button-value:', error);
            throw new Error(error instanceof Error ? error.message : 'Failed to fetch get-button-value');
        }
    },
};
