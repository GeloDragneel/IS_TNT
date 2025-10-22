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
export interface ApiShipoutItem {
    id: number;
    index_id: number;
    courier_id?: number;
    tracking?: string;
    table_ids?: string;
    shipped_packages?: number;
    status?: string;
    invoice_no?: string;
    is_email_sent?: number;
    customer_id?: number;
    customer_code?: string;
    account_name_en?: string;
    account_name_cn?: string;
    email_address?: string;
    courier_en?: string;
    courier_cn?: string;
    shipping_stat_en?: string;
    shipping_stat_cn?: string;
    is_display_mail?: string;
    [key: string]: any;
}
export interface DetailsRow {
    id: number;
    index_id: number;
    customer_id: number;
    product_id: number;
    product_code: string;
    product_title_en: string;
    product_title_cn: string;
    remarks: string;
    invoice_no: string;
    qty: number;
    on_ship_out_qty: number;
    shipped_qty: number;
    is_checked: number;
    on_ship_qty_new: number;
    remaining_qty: number;
    ready_qty: number;
    ready: number;
    item_code: string;
}
export type FilterParams = {
    search?: string;
    date_from?: Date | null;
    date_to?: Date | null;
    category_dates?: string;
};
export interface AllocationResponse {
    success: boolean;
    message: string;
    list: PaginatedResponse<ApiShipoutItem>;
}
// Product service to fetch from your Laravel API
export const shipoutItemService = {
    getShipoutItem: async (page = 1, perPage = 10, filters: { search?: string; category_dates?: string; date_from?: Date | null; date_to?: Date | null; } = {}): Promise<PaginatedResponse<ApiShipoutItem>> => {
        try {
            const response = await api.get<AllocationResponse>('/shipout-item-list', {
                params: { page, per_page: perPage, ...filters, }
            });
            if (response.data.success && response.data.list) {
                return response.data.list;
            } else {
                throw new Error(response.data.message || 'Failed to fetch shipout');
            }
        } catch (error) {
            console.error('Error fetching shipout:', error);
            throw new Error(error instanceof Error ? error.message : 'Failed to fetch shipout');
        }
    },
    getPreparedShipment: async (page = 1, perPage = 10, search = ""): Promise<PaginatedResponse<ApiShipoutItem>> => {
        try {
            const response = await api.get<AllocationResponse>('/prepared-shipment-list', {
                params: { page, per_page: perPage, search, }
            });
            if (response.data.success && response.data.list) {
                return response.data.list;
            } else {
                throw new Error(response.data.message || 'Failed to fetch shipout');
            }
        } catch (error) {
            console.error('Error fetching shipout:', error);
            throw new Error(error instanceof Error ? error.message : 'Failed to fetch shipout');
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
    },
    deleteShipOut: async (data: FormData): Promise<any> => {
        try {
            const response = await api.post(`/delete-shipout-items`, data, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            return response.data;
        } catch (error) {
            console.error('Error updating purchase-order:', error);
            throw new Error('Failed to update purchase-order');
        }
    },
    updateShipoutItems: async (selectedShipout: any): Promise<any> => {
        try {
            const response = await api.post(`/update-shipout-items`, selectedShipout); // or your actual route

            if (response.data) {
                return response.data;
            } else {
                throw new Error(response.data.message || "Failed to save shipout");
            }

        } catch (error) {
            console.error("Error saving mass mailer shipout:", error);
            throw new Error(error instanceof Error ? error.message : "Server error while saving shipout");
        }
    },
    sendEmailOnShipOut: async (selectedShipout: any): Promise<any> => {
        try {
            const response = await api.post(`/sendmail-shipout-items`, selectedShipout); // or your actual route

            if (response.data) {
                return response.data;
            } else {
                throw new Error(response.data.message || "Failed to sendmail shipout");
            }

        } catch (error) {
            console.error("Error saving mass mailer shipout:", error);
            throw new Error(error instanceof Error ? error.message : "Server error while sendmail shipout");
        }
    },
    confirmShipment: async (processShipment: any): Promise<any> => {
        try {
            const response = await api.post(`/confirm-shipment`, processShipment); // or your actual route

            if (response.data) {
                return response.data;
            } else {
                throw new Error(response.data.message || "Failed to save shipout");
            }

        } catch (error) {
            console.error("Error saving mass mailer shipout:", error);
            throw new Error(error instanceof Error ? error.message : "Server error while saving shipout");
        }
    },
};
