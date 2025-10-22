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
export interface ApiCustomerGroup {
    id: number;
    customer_group_en?: string;
    customer_group_cn?: string;
    brevo_list_id?: number;
    updated_at?: string;
    created_at?: string;
    customer_count?: number;
    [key: string]: any;
}
export interface DetailsRow {
    id: number;
    customer_code: string;
    account_name_en: string;
    account_name_cn: string;
    email_address: string;
    status: string;
    status_id: number;
    updated_at: string;
    created_at: string;
    sales_person: string;
}
export interface CustomerGroupResponse {
    success: boolean;
    message: string;
    list: PaginatedResponse<ApiCustomerGroup>;
}
// Product service to fetch from your Laravel API
export const customerGroupService = {
    getCustomerGroupList: async (page = 1, perPage = 10, search = ''): Promise<PaginatedResponse<ApiCustomerGroup>> => {
        try {
            const response = await api.get<CustomerGroupResponse>('/customer-group-list', {
                params: { page, per_page: perPage, search }
            });
            if (response.data.success && response.data.list) {
                return response.data.list;
            } else {
                throw new Error(response.data.message || 'Failed to fetch group list');
            }
        } catch (error) {
            console.error('Error fetching group list:', error);
            throw new Error(error instanceof Error ? error.message : 'Failed to fetch group list');
        }
    },
    deleteCustomerGroup: async (ids: number[]): Promise<any> => {
        try {
            const response = await api.put('/delete-customer-group', { ids });
            return response.data;
        } catch (error) {
            console.error('Error deleting customer-group:', error);
            throw new Error('Failed to delete customer-group');
        }
    },
    updateCustomerGroup: async (data: FormData): Promise<any> => {
        try {
            const response = await api.post(`/update-customer-group`, data, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            return response.data;
        } catch (error) {
            console.error('Error updating customer-group:', error);
            throw new Error('Failed to update customer-group');
        }
    },
};
