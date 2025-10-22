import api from './api';

export interface PaginatedResponse<T> {
    current_page: number;
    data: T[];
    last_page: number;
    per_page: number;
    total: number;
    [key: string]: any;
}
export interface ApiMassMailer {
    id: number;
    campaign_id?: string;
    date?: string;
    email_address: string;
    template_name: string;
    template_html: string;
    template_html2: string;
    sender_name: string;
    sender_email: string;
    reply_to: string;
    api_template_id: number;
    status: number;
    email_count?: number;
    set_as_default?: number;
    created_at?: string;
    updated_at?: string;
    [key: string]: any;
}
export interface DetailsRow {
    id: number;
    customer_id: number;
    customer_code: string;
    account_name_en: string;
    account_name_cn: string;
    email_address: string;
    set_as_default: number;
    customer_groups: string;
}
export interface InventoryResponse {
    success: boolean;
    message: string;
    list: PaginatedResponse<ApiMassMailer>;
}
// Product service to fetch from your Laravel API
export const massMailerService = {
    getMassMailer: async (page = 1, perPage = 10, search = ''): Promise<PaginatedResponse<ApiMassMailer>> => {
        try {
            const response = await api.get<InventoryResponse>('/mass-mailer-list', {
                params: { page, per_page: perPage, search }
            });
            if (response.data.success && response.data.list) {
                return response.data.list;
            } else {
                throw new Error(response.data.message || 'Failed to fetch mass-mailer-list');
            }
        } catch (error) {
            console.error('Error fetching mass-mailer-list:', error);
            throw new Error(error instanceof Error ? error.message : 'Failed to fetch mass-mailer-list');
        }
    },
    getSettings: async (page = 1, perPage = 10, search = ''): Promise<PaginatedResponse<ApiMassMailer>> => {
        try {
            const response = await api.get<InventoryResponse>('/email-settings', {
                params: { page, per_page: perPage, search }
            });
            if (response.data.success && response.data.list) {
                return response.data.list;
            } else {
                throw new Error(response.data.message || 'Failed to fetch list');
            }
        } catch (error) {
            console.error('Error fetching list:', error);
            throw new Error(error instanceof Error ? error.message : 'Failed to fetch list');
        }
    },
    getTags: async (page = 1, perPage = 10, search = ''): Promise<PaginatedResponse<ApiMassMailer>> => {
        try {
            const response = await api.get<InventoryResponse>('/email-tags', {
                params: { page, per_page: perPage, search }
            });
            if (response.data.success && response.data.list) {
                return response.data.list;
            } else {
                throw new Error(response.data.message || 'Failed to fetch list');
            }
        } catch (error) {
            console.error('Error fetching list:', error);
            throw new Error(error instanceof Error ? error.message : 'Failed to fetch list');
        }
    },
    getTemplates: async (page = 1, perPage = 10, search = ''): Promise<PaginatedResponse<ApiMassMailer>> => {
        try {
            const response = await api.get<InventoryResponse>('/email-templates', {
                params: { page, per_page: perPage, search }
            });
            if (response.data.success && response.data.list) {
                return response.data.list;
            } else {
                throw new Error(response.data.message || 'Failed to fetch list');
            }
        } catch (error) {
            console.error('Error fetching list:', error);
            throw new Error(error instanceof Error ? error.message : 'Failed to fetch list');
        }
    },
    getCustomerByGroup: async (ids: number[]): Promise<any> => {
        try {
            const response = await api.get('/get-customer-by-groups', {
                params: { ids },
            });
            if (response.data.success && response.data.list) {
                return response.data.list;
            } else {
                throw new Error(response.data.message || 'Failed to fetch customer');
            }
        } catch (error) {
            console.error('Error fetching customer:', error);
            throw new Error(
                error instanceof Error ? error.message : 'Failed to fetch customer'
            );
        }
    },
    getAllTemplates: async (status:number): Promise<any> => {
        try {
            const response = await api.get(`/get-templates/${status}`);
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
    getGetAllImages: async (search:string): Promise<any> => {
        try {
            const response = await api.get(`/get-product-images/${search}`);
            if (response.data.success && response.data) {
                return response.data;
            } else {
                throw new Error(response.data.message || 'Failed to fetch get-product-images');
            }
        } catch (error) {
            console.error('Error fetching get-product-images:', error);
            throw new Error(error instanceof Error ? error.message : 'Failed to fetch get-product-images');
        }
    },

    saveMassMailerTemplate: async (templateData: any, id : number, saveType:string): Promise<any> => {
        try {
            const response = await api.post(`/save-email-template/${id}/${saveType}`, templateData); // or your actual route

            if (response.data?.success) {
                return response.data;
            } else {
                throw new Error(response.data.message || "Failed to save template");
            }

        } catch (error) {
            console.error("Error saving mass mailer template:", error);
            throw new Error(error instanceof Error ? error.message : "Server error while saving template");
        }
    },
    getMassMailerTemplate: async (templateId:number): Promise<any> => {
        try {
            const response = await api.get(`/get-template-json/${templateId}`);
            return response.data;
        } catch (error) {
            console.error('Error fetching get-template-json:', error);
            throw new Error(error instanceof Error ? error.message : 'Failed to fetch get-template-json');
        }
    },
    sendMassMailer: async (data: FormData): Promise<any> => {
        try {
            const response = await api.post(`/send-mass-mailer`, data, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            return response.data;
        } catch (error) {
            console.error('Error updating send-mass-mailer:', error);
            throw new Error('Failed to update send-mass-mailer');
        }
    },

    updateSettings: async (data: FormData): Promise<any> => {
        try {
            const response = await api.post(`/update-mass-settings`, data, {
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
    updateTags: async (data: FormData): Promise<any> => {
        try {
            const response = await api.post(`/update-mass-tags`, data, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            return response.data;
        } catch (error) {
            console.error('Error updating tags:', error);
            throw new Error('Failed to update tags');
        }
    },
    deleteSettings: async (ids: number[]): Promise<any> => {
        try {
            const response = await api.put('/delete-mass-settings', { ids });
            return response.data;
        } catch (error) {
            console.error('Error deleting settings:', error);
            throw new Error('Failed to delete settings');
        }
    },
    deleteTags: async (ids: number[]): Promise<any> => {
        try {
            const response = await api.put('/delete-mass-tags', { ids });
            return response.data;
        } catch (error) {
            console.error('Error deleting tags:', error);
            throw new Error('Failed to delete tags');
        }
    },
    deleteMassMailer: async (ids: number[]): Promise<any> => {
        try {
            const response = await api.put('/delete-mass-mailer', { ids });
            return response.data;
        } catch (error) {
            console.error('Error deleting tags:', error);
            throw new Error('Failed to delete tags');
        }
    },
    deleteTemplates: async (ids: number[]): Promise<any> => {
        try {
            const response = await api.put('/delete-mass-templates', { ids });
            return response.data;
        } catch (error) {
            console.error('Error deleting templates:', error);
            throw new Error('Failed to delete templates');
        }
    },
    getCampaignList: async (): Promise<any> => {
        try {
            const response = await api.get('/get-campaign-list');
            return response.data.data;
        } catch (error) {
            console.error('Error fetching campaign-list:', error);
            throw new Error(error instanceof Error ? error.message : 'Failed to fetch campaign-list');
        }
    },
    getContactList: async (page = 1, perPage = 10, search = ''): Promise<PaginatedResponse<ApiMassMailer>> => {
        try {
            const response = await api.get<InventoryResponse>('/mass-mailer-list', {
                params: { page, per_page: perPage, search }
            });
            if (response.data.success && response.data.list) {
                return response.data.list;
            } else {
                throw new Error(response.data.message || 'Failed to fetch mass-mailer-list');
            }
        } catch (error) {
            console.error('Error fetching mass-mailer-list:', error);
            throw new Error(error instanceof Error ? error.message : 'Failed to fetch mass-mailer-list');
        }
    },

};
