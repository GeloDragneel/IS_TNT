import api from './api';

export interface PaginatedResponse<T> {
    current_page: number;
    data: T[];
    last_page: number;
    per_page: number;
    total: number;
    [key: string]: any;
}
export interface ApiServices {
    id: number;
    service_code?: string;
    old_service_code?: string;
    description_en?: string;
    description_cn?: string;
    is_deleted?: number;
    [key: string]: any;
}
export interface ServicesResponse {
    success: boolean;
    message: string;
    list: PaginatedResponse<ApiServices>;
}
// Product service to fetch from your Laravel API
export const servicesService = {
    getServiceList: async (page = 1, perPage = 10, search = ''): Promise<PaginatedResponse<ApiServices>> => {
        try {
            const response = await api.get<ServicesResponse>('/service-list', {
                params: { page, per_page: perPage, search }
            });
            if (response.data.success && response.data.list) {
                return response.data.list;
            } else {
                throw new Error(response.data.message || 'Failed to fetch service');
            }
        } catch (error) {
            console.error('Error fetching service:', error);
            throw new Error(error instanceof Error ? error.message : 'Failed to fetch service');
        }
    },
    deleteService: async (ids: number[]): Promise<any> => {
        try {
            const response = await api.put('/delete-services', { ids });
            return response.data;
        } catch (error) {
            console.error('Error deleting services:', error);
            throw new Error('Failed to delete services');
        }
    },
    updateServices: async (data: FormData): Promise<any> => {
        try {
            const response = await api.post(`/update-services`, data, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            return response.data;
        } catch (error) {
            console.error('Error updating services:', error);
            throw new Error('Failed to update services');
        }
    },
};
