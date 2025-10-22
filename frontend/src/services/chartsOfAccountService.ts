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
export interface ApiChartsOfAccount {
    id: number;
    root_name?: string;
    account_code?: string;
    account_name_en?: string;
    account_name_cn?: string;
    description_en?: string;
    description_cn?: string;
    account_type_en?: string;
    account_type_cn?: string;
    children_count:number;
    [key: string]: any;
}
export interface DetailsRow {
    id: number;
    root_name?: string;
    account_code?: string;
    account_name_en?: string;
    account_name_cn?: string;
    description_en?: string;
    description_cn?: string;
    account_type_en?: string;
    account_type_cn?: string;
    children_count:number;
    is_account: number;
    details?: DetailsRow[];
}
export interface AllocationResponse {
    success: boolean;
    message: string;
    list: PaginatedResponse<ApiChartsOfAccount>;
}
// Product service to fetch from your Laravel API
export const chartsOfAccountService = {
    getAllChartsOfAccount: async (page = 1, perPage = 10, search = ''): Promise<PaginatedResponse<ApiChartsOfAccount>> => {
        try {
            const response = await api.get<AllocationResponse>('/charts-of-account-list', {
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
    updateChartsOfAccount: async (data: FormData): Promise<any> => {
        try {
            const response = await api.post(`/update-charts-of-account`, data, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            return response.data;
        } catch (error) {
            console.error('Error update-charts-of-account:', error);
            throw new Error('Failed to update-charts-of-account');
        }
    },
    deleteChartsOfAccount: async (ids: number[]): Promise<any> => {
        try {
            const response = await api.put('/delete-charts-of-account', { ids });
            return response.data;
        } catch (error) {
            console.error('Error delete-charts-of-account:', error);
            throw new Error('Failed to delete-charts-of-account');
        }
    },
};
