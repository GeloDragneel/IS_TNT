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
    supplier_id?: number;
    currency?: string;
    ex_rate?: number;
    amount?: number;
    base_amount?: number;
    cr_status_id: number;
    status_value_en?: string;
    status_value_cn?: string;
    supplier_code?: string;
    suppliername_en?: string;
    suppliername_cn?: string;
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
export const supplierCreditNoteService = {
    getAllSupplierCreditNote: async (
        page = 1,
        perPage = 15,
        filters: {
            search?: string;
            supplier_codes?: string[];
            category_dates?: string;
            date_from?: Date | null;
            date_to?: Date | null;
        } = {}
    ): Promise<PaginatedResponse<ApiCreditNote>> => {
        try {
            const response = await api.get<SalesOrderResponse>('/supplier-credit-note-list', {
                params: { page, per_page: perPage, ...filters, }
            });
            if (response.data.success && response.data.list) {
                return response.data.list;
            } else {
                throw new Error(response.data.message || 'Failed to fetch supplier-credit-note-list');
            }
        } catch (error) {
            console.error('Error fetching supplier-credit-note-list:', error);
            throw new Error(error instanceof Error ? error.message : 'Failed to fetch supplier-credit-note-list');
        }
    },
    voidSupplierCreditNote: async (data: FormData): Promise<any> => {
        try {
            const response = await api.post(`/void-supplier-credit-note`, data, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            return response.data;
        } catch (error) {
            console.error('Error updating void-supplier-credit-note:', error);
            throw new Error('Failed to update void-supplier-credit-note');
        }
    },
    getCRInfo: async (id: number): Promise<any> => {
        try {
            const response = await api.get(`/supplier-credit-info/${id}`);
            if (response.data.success && response.data.list) {
                return response.data.list;
            } else {
                throw new Error(response.data.message || 'Failed to fetch supplier-credit-info');
            }
        } catch (error) {
            console.error('Error fetching supplier-credit-info:', error);
            throw new Error(error instanceof Error ? error.message : 'Failed to fetch supplier-credit-info');
        }
    },
    getSupplierInfoByCode: async (customerCode: string): Promise<any> => {
        try {
            const response = await api.get(`/get-po-supplier-info/${customerCode}`);
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
    updateCreditNote: async (id: number, data: FormData): Promise<any> => {
        try {
            const response = await api.post(`/update-supp-credit-note/${id}`, data, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            return response.data;
        } catch (error) {
            console.error('Error update-supp-credit-note:', error);
            throw new Error('Failed to update-supp-credit-note');
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
                throw new Error(response.data.message || 'Failed to fetch charts-of-account');
            }
        } catch (error) {
            console.error('Error fetching charts-of-account:', error);
            throw new Error(error instanceof Error ? error.message : 'Failed to fetch charts-of-account');
        }
    },
};
