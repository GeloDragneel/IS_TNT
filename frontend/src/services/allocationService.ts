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
export interface ApiAllocations {
    id: number;
    grn_no?: string;
    grn_date?: string;
    warehouse?: string;
    product_code?: string;
    product_title_en?: string;
    product_title_cn?: string;
    received_qty?: number;
    allocation?: number;
    qty?: number;
    [key: string]: any;
}
export interface DetailsRow {
    id: number;
    customer_code: string;
    account_name_en: string;
    account_name_cn: string;
    customer_name_en: string;
    customer_name_cn: string;
    shipping_stat_en: string;
    shipping_stat_cn: string;
    so_number: string;
    invoice_no: string;
    warehouse: string;
    qty: number;
    is_account: number;
}
export interface AllocationResponse {
    success: boolean;
    message: string;
    list: PaginatedResponse<ApiAllocations>;
}
// Product service to fetch from your Laravel API
export const allocationService = {
    getAllocation: async (page = 1, perPage = 10, search = ''): Promise<PaginatedResponse<ApiAllocations>> => {
        try {
            const response = await api.get<AllocationResponse>('/allocation-list', {
                params: { page, per_page: perPage, search }
            });
            if (response.data.success && response.data.list) {
                return response.data.list;
            } else {
                throw new Error(response.data.message || 'Failed to fetch allocation');
            }
        } catch (error) {
            console.error('Error fetching allocation:', error);
            throw new Error(error instanceof Error ? error.message : 'Failed to fetch allocation');
        }
    },
    deleteAllocation: async (ids: number[]): Promise<void> => {
        try {
            await api.put('/delete-allocation', { ids });
        } catch (error) {
            console.error('Error deleting allocation:', error);
            throw new Error('Failed to delete allocation');
        }
    },
    updateAllocation: async (qty: number, id: number): Promise<any> => {
        try {
            const response = await api.put(`/update-allocation/${qty}/${id}`);
            const data = response.data;
            if (data.success) {
                return data;
            } else {
                throw new Error(data.message || 'Failed to update allocation');
            }
        } catch (error) {
            console.error('Error updating allocation:', error);
            throw new Error(error instanceof Error ? error.message : 'Unknown error');
        }
    }
};
