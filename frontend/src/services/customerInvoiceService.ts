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
export interface ApiCustomerInvoice {
    id: number;
    so_number?: string;
    invoice_no: string;
    invoice_date?: string;
    customer_code?: string;
    account_name_en?: string;
    account_name_cn?: string;
    status_value_en?: string;
    status_value_cn?: string;
    source_en?: string;
    source_cn?: string;
    customer_type?: string;
    user_id?: string;
    currency?: string;
    invoice_status_id: number;
    total?: number;
    payment?: number;
    balance: number;
    total_deposit?: number;
    credit_used: number;
    total_to_pay?: number;
    current_credit: number;
    cnt_products: number;
    cnt_ship: number;
    balance_to_pay: number;
    new_balance: number;
    amount_paid: number;
    base_amount_paid: number;
    base_balance: number;
    [key: string]: any;
}
export interface DetailsRow {
    id: number;
    product_code: string;
    product_title_en: string;
    product_title_cn: string;
    currency: string;
    deposit: number;
    indexInt: number;
    is_deleted: number;
    service_id: number;
    product_id: number;
    item_cost: number;
    age_type: string;
    particular: string;
    qty: number;
    price: number;
    total: number;

    warehouse: string;
    alloc_type: string;
    grn_no: string;
    order_id: number;
    grn_detail_id: number;
    allocated_id: number;
    product_type: number;
    inventory_qty: number;
    delete_type: string;
    rv_date: string;
    rv_number: string;
    amount: number;
}
export interface SalesOrderResponse {
    success: boolean;
    message: string;
    list: PaginatedResponse<ApiCustomerInvoice>;
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
export const invoiceService = {
    getAllInvoices: async (
        page = 1,
        perPage = 10,
        filters: {
            search?: string;
            customer_codes?: string[];
            category_dates?: string;
            date_from?: Date | null;
            date_to?: Date | null;
        } = {}
    ): Promise<PaginatedResponse<ApiCustomerInvoice>> => {
        try {
            const response = await api.get<SalesOrderResponse>('/customer-invoice-list', {
                params: { page, per_page: perPage, ...filters, }
            });
            if (response.data.success && response.data.list) {
                return response.data.list;
            } else {
                throw new Error(response.data.message || 'Failed to fetch customer-invoice-list');
            }
        } catch (error) {
            console.error('Error fetching customer-invoice-list:', error);
            throw new Error(error instanceof Error ? error.message : 'Failed to fetch customer-invoice-list');
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
    voiceCustomerInvoice: async (data: FormData): Promise<any> => {
        try {
            const response = await api.post(`/void-customer-invoice`, data, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            return response.data;
        } catch (error) {
            console.error('Error updating void-customer-invoice:', error);
            throw new Error('Failed to update void-customer-invoice');
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
    getInvoiceInfo: async (id: number): Promise<any> => {
        try {
            const response = await api.get(`/customer-invoice-info/${id}`);
            if (response.data.success && response.data.list) {
                return response.data.list;
            } else {
                throw new Error(response.data.message || 'Failed to fetch customer-invoice-info');
            }
        } catch (error) {
            console.error('Error fetching customer-invoice-info:', error);
            throw new Error(error instanceof Error ? error.message : 'Failed to fetch customer-invoice-info');
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
    updateCustomerInvoice: async (id: number, data: FormData): Promise<any> => {
        try {
            const response = await api.post(`/update-customer-invoice/${id}`, data, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            return response.data;
        } catch (error) {
            console.error('Error updating customer-invoice:', error);
            throw new Error('Failed to update customer-invoice');
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

    doGetCreditDetail: async (data: FormData): Promise<any> => {
        try {
            const response = await api.post(`/get-credit-details`, data, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            return response.data;
        } catch (error) {
            console.error('Error updating get-credit-details:', error);
            throw new Error('Failed to update get-credit-details');
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
};
