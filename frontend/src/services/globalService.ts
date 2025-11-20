import api from './api';

// Interface matching your Laravel API response
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
export interface PaginatedResponse<T> {
    current_page: number;
    data: T[];
    last_page: number;
    per_page: number;
    total: number;
    [key: string]: any;
}
export interface ApiLogs {
    id: number;
    module?: string;
    table?: string;
    action?: string;
    description?: string;
    username?: string;
    created_at?: string;
    filename?: string;
    size?: string;
    size_human?: string;
    last_modified?: string;
    [key: string]: any;
}
export interface ApiSerialNo {
    id: number;
    serial_no?: string;
    batch_no?: number;
    no_of_time_verified?: number;
    [key: string]: any;
}
export interface LogsResponse {
    success: boolean;
    message: string;
    list: PaginatedResponse<ApiLogs>;
}
export interface SerialNoResponse {
    success: boolean;
    message: string;
    list: PaginatedResponse<ApiSerialNo>;
}
// Product service to fetch from your Laravel API
export const globalService = {
    getAllDropdowns: async (): Promise<OptionType[]> => {
        try {
            const response = await api.get<DropdownResponse>('/all-dropdowns');
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

    getAllLogs: async (page = 1, perPage = 10, search = ''): Promise<PaginatedResponse<ApiLogs>> => {
        try {
            const response = await api.get<LogsResponse>('/get-logs', {
                params: { page, per_page: perPage, search }
            });
            if (response.data.success && response.data.list) {
                return response.data.list;
            } else {
                throw new Error(response.data.message || 'Failed to fetch logs');
            }
        } catch (error) {
            console.error('Error fetching logs:', error);
            throw new Error(error instanceof Error ? error.message : 'Failed to fetch logs');
        }
    },
    getAllBackups: async (page = 1, perPage = 10, search = ''): Promise<PaginatedResponse<ApiLogs>> => {
        try {
            const response = await api.get<LogsResponse>('/get-backups', {
                params: { page, per_page: perPage, search }
            });
            if (response.data.success && response.data.list) {
                return response.data.list;
            } else {
                throw new Error(response.data.message || 'Failed to fetch logs');
            }
        } catch (error) {
            console.error('Error fetching logs:', error);
            throw new Error(error instanceof Error ? error.message : 'Failed to fetch logs');
        }
    },
    restoreDatabase: async (data: FormData): Promise<any> => {
        try {
            const response = await api.post(`/restore-database`, data, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            return response.data;
        } catch (error) {
            console.error('Error cancel preorder restoreDatabase:', error);
            throw new Error('Failed to cancel preorder restoreDatabase');
        }
    },
    backupDatabase: async (): Promise<any> => {
        try {
            const response = await api.post(`/backup-database`);
            return response.data;
        } catch (error) {
            console.error('Error cancel preorder backupDatabase:', error);
            throw new Error('Failed to cancel preorder backupDatabase');
        }
    },
    deleteDatabase: async (filenames: string[]): Promise<any> => {
        try {
            const response = await api.put('/delete-database', { filenames });
            return response.data;
        } catch (error) {
            console.error('Error deleting db:', error);
            throw new Error('Failed to delete db');
        }
    },
    downloadDatabase: async (filename: string): Promise<any> => {
        try {
            const response = await api.post(`/download-database`,
                { filename: filename },
                { responseType: 'blob' } // Add responseType here
            );
            return response; // Return full response, not just response.data
        } catch (error) {
            console.error('Error downloading database:', error);
            throw new Error('Failed to download database');
        }
    },
    getSerialNo: async (page = 1, perPage = 10, search = ''): Promise<PaginatedResponse<ApiSerialNo>> => {
        try {
            const response = await api.get<SerialNoResponse>('/get-serial-no', {
                params: { page, per_page: perPage, search }
            });
            if (response.data.success && response.data.list) {
                return response.data.list;
            } else {
                throw new Error(response.data.message || 'Failed to fetch serial');
            }
        } catch (error) {
            console.error('Error fetching serial:', error);
            throw new Error(error instanceof Error ? error.message : 'Failed to fetch serial');
        }
    },
    AIReportQuery: async (query: string): Promise<any> => {
        try {
            const response = await api.post('/ai-report-query', { query });
            return response.data;
        } catch (error) {
            console.error('Error AI Report Query:', error);
            throw error;
        }
    },
};
