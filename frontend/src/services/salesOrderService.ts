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
export interface ApiSalesOrder {
    id: number;
    so_number?: string;
    so_date?: string;
    customer_code?: string;
    account_name_en?: string;
    account_name_cn?: string;
    status_value_en?: string;
    status_value_cn?: string;
    currency?: string;
    invoice_status_id: number;
    invoice_no: string;
    total?: number;
    total_deposit?: number;
    credit_used?: number;
    total_to_pay?: number;
    current_credit?: number;
    cnt_products: number;
    source_en?: string;
    source_cn?: string;
    customer_type?: string;
    user_id?: string;
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
}
export interface SalesOrderResponse {
    success: boolean;
    message: string;
    list: PaginatedResponse<ApiSalesOrder>;
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
export const salesOrderService = {
    getAllSalesOrder: async (
        page = 1,
        perPage = 10,
        filters: {
            search?: string;
            customer_codes?: string[];
            category_dates?: string;
            date_from?: Date | null;
            date_to?: Date | null;
        } = {}
    ): Promise<PaginatedResponse<ApiSalesOrder>> => {
        try {
            const response = await api.get<SalesOrderResponse>('/sales-order-list', {
                params: { page, per_page: perPage, ...filters, }
            });
            if (response.data.success && response.data.list) {
                return response.data.list;
            } else {
                throw new Error(response.data.message || 'Failed to fetch sales-order-list');
            }
        } catch (error) {
            console.error('Error fetching sales-order-list:', error);
            throw new Error(error instanceof Error ? error.message : 'Failed to fetch sales-order-list');
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
            const response = await api.post(`/get-deposit-paid`, data, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            return response.data;
        } catch (error) {
            console.error('Error updating get-deposit-paid:', error);
            throw new Error('Failed to update get-deposit-paid');
        }
    },
    voidSalesOrder: async (data: FormData): Promise<any> => {
        try {
            const response = await api.post(`/void-sales-order`, data, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            return response.data;
        } catch (error) {
            console.error('Error updating void-sales-order:', error);
            throw new Error('Failed to update void-sales-order');
        }
    },
    cancelDepositPaid: async (row_arrays: any[], type: string, token: string): Promise<any> => {
        try {
            const response = await api.put('/cancel-sales-order', { row_arrays, type, token });
            return response.data;
        } catch (error) {
            console.error('Error cancel cancel-sales-order:', error);
            throw new Error('Failed to cancel cancel-sales-order');
        }
    },
    getSOInfo: async (id: number): Promise<any> => {
        try {
            const response = await api.get(`/so-info/${id}`);
            if (response.data.success && response.data.list) {
                return response.data.list;
            } else {
                throw new Error(response.data.message || 'Failed to fetch so-info');
            }
        } catch (error) {
            console.error('Error fetching so-info:', error);
            throw new Error(error instanceof Error ? error.message : 'Failed to fetch so-info');
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
    updateSalesOrder: async (id: number, data: FormData): Promise<any> => {
        try {
            const response = await api.post(`/update-sales-order/${id}`, data, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            return response.data;
        } catch (error) {
            console.error('Error updating sales-order:', error);
            throw new Error('Failed to update sales-order');
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
};
