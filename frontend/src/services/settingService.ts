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
export interface ApiSettings {
    id: number;
    loc_tag: string;
    en: string;
    cn: string;
    courier_en: string;
    courier_cn: string;
    alias: string;
    shipping_stat_en: string;
    shipping_stat_cn: string;
    warehouse_en: string;
    warehouse_cn: string;
    country_en: string;
    country_cn: string;
    updated_at: string;
    created_at: string;
    tax_value: string;
    tax: string;
    payment_terms_en: string;
    payment_terms_cn: string;
    description_en: string;
    description_cn: string;
    terms: string;
    store_name_en: string;
    store_name_cn: string;
    address_en: string;
    address_cn: string;
    root_name: string;
    label_en: string;
    label_cn: string;
    country_code: number;
    children_count: number;
    set_as_default: number;
    is_deleted: number;
    details: ApiSettings[]; // 👈 this is what was missing
    [key: string]: any;
}
export interface LogsResponse {
    success: boolean;
    message: string;
    list: PaginatedResponse<ApiSettings>;
}
export interface OptionType {
    value: string | number;
    value2: string | number;
    en: string;
    cn: string;
}
interface DropdownResponse {
    success: boolean;
    message: string;
    list: OptionType[];
}
// Product service to fetch from your Laravel API
export const settingService = {
    getAllLanguages: async (page = 1, perPage = 10, search = ''): Promise<PaginatedResponse<ApiSettings>> => {
        try {
            const response = await api.get<LogsResponse>('/get-languages', {
                params: { page, per_page: perPage, search }
            });
            if (response.data.success && response.data.list) {
                return response.data.list;
            } else {
                throw new Error(response.data.message || 'Failed to fetch languages');
            }
        } catch (error) {
            console.error('Error fetching languages:', error);
            throw new Error(error instanceof Error ? error.message : 'Failed to fetch languages');
        }
    },

    getAllCourier: async (page = 1, perPage = 10, search = ''): Promise<PaginatedResponse<ApiSettings>> => {
        try {
            const response = await api.get<LogsResponse>('/get-couriers', {
                params: { page, per_page: perPage, search }
            });
            if (response.data.success && response.data.list) {
                return response.data.list;
            } else {
                throw new Error(response.data.message || 'Failed to fetch couriers');
            }
        } catch (error) {
            console.error('Error fetching couriers:', error);
            throw new Error(error instanceof Error ? error.message : 'Failed to fetch couriers');
        }
    },

    getAllShippingStatus: async (page = 1, perPage = 10, search = ''): Promise<PaginatedResponse<ApiSettings>> => {
        try {
            const response = await api.get<LogsResponse>('/get-shipping-status', {
                params: { page, per_page: perPage, search }
            });
            if (response.data.success && response.data.list) {
                return response.data.list;
            } else {
                throw new Error(response.data.message || 'Failed to fetch shipping');
            }
        } catch (error) {
            console.error('Error fetching logs:', error);
            throw new Error(error instanceof Error ? error.message : 'Failed to fetch shipping');
        }
    },
    getWarehouseList: async (page = 1, perPage = 10, search = ''): Promise<PaginatedResponse<ApiSettings>> => {
        try {
            const response = await api.get<LogsResponse>('/get-warehouse-list', {
                params: { page, per_page: perPage, search }
            });
            if (response.data.success && response.data.list) {
                return response.data.list;
            } else {
                throw new Error(response.data.message || 'Failed to fetch warehouse');
            }
        } catch (error) {
            console.error('Error fetching logs:', error);
            throw new Error(error instanceof Error ? error.message : 'Failed to fetch warehouse');
        }
    },
    getShippingTermList: async (page = 1, perPage = 10, search = ''): Promise<PaginatedResponse<ApiSettings>> => {
        try {
            const response = await api.get<LogsResponse>('/get-shipping-terms', {
                params: { page, per_page: perPage, search }
            });
            if (response.data.success && response.data.list) {
                return response.data.list;
            } else {
                throw new Error(response.data.message || 'Failed to fetch shipping');
            }
        } catch (error) {
            console.error('Error fetching logs:', error);
            throw new Error(error instanceof Error ? error.message : 'Failed to fetch shipping');
        }
    },
    getTaxGroupList: async (page = 1, perPage = 10, search = ''): Promise<PaginatedResponse<ApiSettings>> => {
        try {
            const response = await api.get<LogsResponse>('/get-tax-group', {
                params: { page, per_page: perPage, search }
            });
            if (response.data.success && response.data.list) {
                return response.data.list;
            } else {
                throw new Error(response.data.message || 'Failed to fetch shiget-tax-grouppping');
            }
        } catch (error) {
            console.error('Error fetching logs:', error);
            throw new Error(error instanceof Error ? error.message : 'Failed to fetch get-tax-group');
        }
    },
    getPaymentTerms: async (page = 1, perPage = 10, search = ''): Promise<PaginatedResponse<ApiSettings>> => {
        try {
            const response = await api.get<LogsResponse>('/get-payment-terms', {
                params: { page, per_page: perPage, search }
            });
            if (response.data.success && response.data.list) {
                return response.data.list;
            } else {
                throw new Error(response.data.message || 'Failed to fetch get-payment-terms');
            }
        } catch (error) {
            console.error('Error fetching logs:', error);
            throw new Error(error instanceof Error ? error.message : 'Failed to fetch get-payment-terms');
        }
    },

    getSourceList: async (page = 1, perPage = 10, search = ''): Promise<PaginatedResponse<ApiSettings>> => {
        try {
            const response = await api.get<LogsResponse>('/get-source-list', {
                params: { page, per_page: perPage, search }
            });
            if (response.data.success && response.data.list) {
                return response.data.list;
            } else {
                throw new Error(response.data.message || 'Failed to fetch get-source-list');
            }
        } catch (error) {
            console.error('Error fetching logs:', error);
            throw new Error(error instanceof Error ? error.message : 'Failed to fetch get-source-list');
        }
    },
    getStoreLocationList: async (page = 1, perPage = 10, search = ''): Promise<PaginatedResponse<ApiSettings>> => {
        try {
            const response = await api.get<LogsResponse>('/get-store-location-list', {
                params: { page, per_page: perPage, search }
            });
            if (response.data.success && response.data.list) {
                return response.data.list;
            } else {
                throw new Error(response.data.message || 'Failed to fetch get-store-location-list');
            }
        } catch (error) {
            console.error('Error fetching logs:', error);
            throw new Error(error instanceof Error ? error.message : 'Failed to fetch get-store-location-list');
        }
    },
    getCurrencyList: async (page = 1, perPage = 10, search = ''): Promise<PaginatedResponse<ApiSettings>> => {
        try {
            const response = await api.get<LogsResponse>('/get-currency-list', {
                params: { page, per_page: perPage, search }
            });
            if (response.data.success && response.data.list) {
                return response.data.list;
            } else {
                throw new Error(response.data.message || 'Failed to fetch get-currency-list');
            }
        } catch (error) {
            console.error('Error fetching logs:', error);
            throw new Error(error instanceof Error ? error.message : 'Failed to fetch get-currency-list');
        }
    },
    getISSettings: async (page = 1, perPage = 10, search = ''): Promise<PaginatedResponse<ApiSettings>> => {
        try {
            const response = await api.get<LogsResponse>('/get-issetings-list', {
                params: { page, per_page: perPage, search }
            });
            if (response.data.success && response.data.list) {
                return response.data.list;
            } else {
                throw new Error(response.data.message || 'Failed to fetch get-issetings-list');
            }
        } catch (error) {
            console.error('Error fetching logs:', error);
            throw new Error(error instanceof Error ? error.message : 'Failed to fetch get-issetings-list');
        }
    },
    getEMPDepartment: async (page = 1, perPage = 10, search = ''): Promise<PaginatedResponse<ApiSettings>> => {
        try {
            const response = await api.get<LogsResponse>('/get-emp-department', {
                params: { page, per_page: perPage, search }
            });
            if (response.data.success && response.data.list) {
                return response.data.list;
            } else {
                throw new Error(response.data.message || 'Failed to fetch get-emp-department');
            }
        } catch (error) {
            console.error('Error fetching logs:', error);
            throw new Error(error instanceof Error ? error.message : 'Failed to fetch get-emp-department');
        }
    },
    getAccessRights: async (page = 1, perPage = 10, search = ''): Promise<PaginatedResponse<ApiSettings>> => {
        try {
            const response = await api.get<LogsResponse>('/get-login-list', {
                params: { page, per_page: perPage, search }
            });
            if (response.data.success && response.data.list) {
                return response.data.list;
            } else {
                throw new Error(response.data.message || 'Failed to fetch get-login-list');
            }
        } catch (error) {
            console.error('Error fetching logs:', error);
            throw new Error(error instanceof Error ? error.message : 'Failed to fetch get-login-list');
        }
    },
    deleteSettings: async (ids: number[],module:string): Promise<any> => {
        try {
            const response = await api.put(`/delete-settings/${module}`, { ids });
            return response.data;
        } catch (error) {
            console.error('Error deleting settings:', error);
            throw new Error('Failed to delete settings');
        }
    },
    updateSettings: async (data: FormData, module :string): Promise<any> => {
        try {
            const response = await api.post(`/update-settings/${module}`, data, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            return response.data;
        } catch (error) {
            console.error('Error updating settings:', error);
            throw new Error('Failed to update settings');
        }
    },
    setAsDefaultSettings: async (tableId: number, module :string): Promise<any> => {
        try {
            const response = await api.post(`/set-as-default-settings/${tableId}/${module}`);
            return response.data;
        } catch (error) {
            console.error('Error set-as-default-settings:', error);
            throw new Error('Failed to set-as-default-settings');
        }
    },
    getAllEmployeeList: async (): Promise<OptionType[]> => {
        try {
            const response = await api.get<DropdownResponse>('/get-employee-list');
            if (response.data.success && response.data.list) {
                return response.data.list;
            } else {
                throw new Error(response.data.message || 'Failed to fetch list');
            }
        } catch (error) {
            console.error('Error fetching list:', error);
            if (error instanceof Error) {
                throw new Error(`Failed to fetch list: ${error.message}`);
            }
            throw new Error('Failed to fetch list');
        }
    },

    getAllMenuData: async (): Promise<any> => {
        try {
            const response = await api.get('/get-menu-data');
            if (response.data.success && response.data.list) {
                return response.data.list;
            } else {
                throw new Error(response.data.message || 'Failed to fetch list');
            }
        } catch (error) {
            console.error('Error fetching list:', error);
            if (error instanceof Error) {
                throw new Error(`Failed to fetch list: ${error.message}`);
            }
            throw new Error('Failed to fetch list');
        }
    },
    updateAccessRights: async (data: FormData): Promise<any> => {
        try {
            const response = await api.post(`/update-access-rights`, data, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            return response.data;
        } catch (error) {
            console.error('Error updating settings:', error);
            throw new Error('Failed to update settings');
        }
    },
};
