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
export interface ApiCreditNote {
    id: number;
    cr_number?: string;
    cr_date?: string;
    customer_id?: number;
    currency?: string;
    ex_rate?: number;
    amount?: number;
    base_amount?: number;
    cr_status_id: number;
    status_value_en?: string;
    status_value_cn?: string;
    customer_code?: string;
    account_name_en?: string;
    account_name_cn?: string;
    [key: string]: any;
}
export interface DetailsRow {
    id: number;
    account_code: string;
    account_name_en: string;
    account_name_cn: string;
    particulars: string;
    amount: number;
    base_amount: number;
    currency: string;
    product_id: number;
    ex_rate: number;
    product_code: string;
    product_title_en: string;
    product_title_cn: string;
    age_type: string;
    delete_type: string;
    is_deleted : number,
    indexInt : number
}
export interface SalesOrderResponse {
    success: boolean;
    message: string;
    list: PaginatedResponse<ApiCreditNote>;
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
export const customerCreditNoteService = {
    getAllCustomerCreditNote: async (
        page = 1,
        perPage = 15,
        filters: {
            search?: string;
            customer_codes?: string[];
            category_dates?: string;
            date_from?: Date | null;
            date_to?: Date | null;
        } = {}
    ): Promise<PaginatedResponse<ApiCreditNote>> => {
        try {
            const response = await api.get<SalesOrderResponse>('/customer-credit-note-list', {
                params: { page, per_page: perPage, ...filters, }
            });
            if (response.data.success && response.data.list) {
                return response.data.list;
            } else {
                throw new Error(response.data.message || 'Failed to fetch customer-credit-note-list');
            }
        } catch (error) {
            console.error('Error fetching customer-credit-note-list:', error);
            throw new Error(error instanceof Error ? error.message : 'Failed to fetch customer-credit-note-list');
        }
    },
    voidCustomerCreditNote: async (data: FormData): Promise<any> => {
        try {
            const response = await api.post(`/void-customer-credit-note`, data, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            return response.data;
        } catch (error) {
            console.error('Error updating void-customer-credit-note:', error);
            throw new Error('Failed to update void-customer-credit-note');
        }
    },
    getCRInfo: async (id: number): Promise<any> => {
        try {
            const response = await api.get(`/customer-credit-info/${id}`);
            if (response.data.success && response.data.list) {
                return response.data.list;
            } else {
                throw new Error(response.data.message || 'Failed to fetch customer-credit-info');
            }
        } catch (error) {
            console.error('Error fetching customer-credit-info:', error);
            throw new Error(error instanceof Error ? error.message : 'Failed to fetch customer-credit-info');
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
    updateCreditNote: async (id: number, data: FormData): Promise<any> => {
        try {
            const response = await api.post(`/update-cust-credit-note/${id}`, data, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            return response.data;
        } catch (error) {
            console.error('Error update-cust-credit-note:', error);
            throw new Error('Failed to update-cust-credit-note');
        }
    },
    getChartsOfAccount: async (page = 1,perPage = 10,search = '', accountCode: string): Promise<any> => {
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
};
