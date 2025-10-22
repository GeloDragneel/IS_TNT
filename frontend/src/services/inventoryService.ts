import api from './api';

export interface PaginatedResponse<T> {
    current_page: number;
    data: T[];
    last_page: number;
    per_page: number;
    total: number;
    [key: string]: any;
}
export interface ApiInventory {
    product_id: number;
    product_code?: string;
    product_title_en?: string;
    product_title_cn?: string;
    product_thumbnail?: string;
    retail_price?: number;
    retail_currency?: string;
    warehouse_code?: string;
    warehouse_en?: string;
    warehouse_cn?: string;
    item_cost?: number;
    hold_qty: number;
    new_hold_qty: number;
    allocated_qty?: number;
    last_sold_date?: string;
    qty?: number;
    rem_qty: number;
    new_qty?: number;
    total_cost?: number;
    age_day?: number;
    is_hold?: number;
    [key: string]: any;
}
export interface DetailsRow {
    id: number;
    product_id: number;
    warehouse_en: string;
    warehouse_cn: string;
    qty: number;
    allocated_qty: number;
    rem_qty: number;
    item_cost: number;
    total_cost: number;
    retail_price: number;
    retail_currency: string;
    age_day: number;
}
export interface InventoryResponse {
    success: boolean;
    message: string;
    list: PaginatedResponse<ApiInventory>;
}
// Product service to fetch from your Laravel API
export const inventoryService = {
    getInventory: async (page = 1, perPage = 10, search = ''): Promise<PaginatedResponse<ApiInventory>> => {
        try {
            const response = await api.get<InventoryResponse>('/inventory-list', {
                params: { page, per_page: perPage, search }
            });
            if (response.data.success && response.data.list) {
                return response.data.list;
            } else {
                throw new Error(response.data.message || 'Failed to fetch inventory');
            }
        } catch (error) {
            console.error('Error fetching inventory:', error);
            throw new Error(error instanceof Error ? error.message : 'Failed to fetch inventory');
        }
    },
    getWithdrawList: async (page = 1, perPage = 10, search = '', sortId: number[] = []): Promise<PaginatedResponse<ApiInventory>> => {
        try {
            const response = await api.get<InventoryResponse>('/withdraw-list', {
                params: { page, per_page: perPage, search, sortId: sortId.length ? sortId.join(',') : [] }
            });
            if (response.data.success && response.data.list) {
                return response.data.list;
            } else {
                throw new Error(response.data.message || 'Failed to fetch withdraw');
            }
        } catch (error) {
            console.error('Error fetching withdraw:', error);
            throw new Error(error instanceof Error ? error.message : 'Failed to fetch withdraw');
        }
    },
    updateWithdrawInventory: async (data: FormData): Promise<any> => {
        try {
            const response = await api.post(`/update-withdraw-inventory`, data, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            return response.data;
        } catch (error) {
            console.error('Error updating withdraw-inventory:', error);
            throw new Error('Failed to update withdraw-inventory');
        }
    },

};
