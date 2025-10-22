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
export type FilterParams = {
    search?: string;
    date_from?: Date | null;
    date_to?: Date | null;
    category_dates?: string;
    customer_codes?: string[];
};
export interface ApiReports {
    id: number;
    currency: string;
    transaction_date: string;
    pay_to: string;
    ex_rate: number;
    debit: number;
    credit: number;
    amount: number;
    base_amount: number;
    customer_id: number;
    sub_total_on_cost: number;
    ref_data: string;
    customer_code: string;
    account_name_en: string;
    account_name_cn: string;
    jv_no: string;
    [key: string]: any;
}
export interface DetailsExpanded {
    id: number;
    account_code: string;
    currency: string;
    amount: number;
    debit: number;
    credit: number;
    ex_rate: number;
    base_amount: number;
    account_name_en: string;
    account_name_cn: string;
    transaction_date: string;
    product_title_en: string;
    product_title_cn: string;
    reference: string;
    product_code: string;
}
export interface AllocationResponse {
    success: boolean;
    message: string;
    list: PaginatedResponse<ApiReports>;
}
// Product service to fetch from your Laravel API
export const reportsService = {
    getTransactionList: async (page = 1, perPage = 10, search = ''): Promise<PaginatedResponse<ApiReports>> => {
        try {
            const response = await api.get<AllocationResponse>('/get-transaction-list', {
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
    getJournalEntries: async (
        page = 1,
        perPage = 10,
        filters: {
            search?: string;
            customer_codes?: string[];
            category_dates?: string;
            date_from?: Date | null;
            date_to?: Date | null;
        } = {}
    ): Promise<PaginatedResponse<ApiReports>> => {
        try {
            const response = await api.get<AllocationResponse>('/get-journal-entries-list', {
                params: { page, per_page: perPage, ...filters, }
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
    getCustomerDepositList: async (page = 1, perPage = 10, search = ''): Promise<PaginatedResponse<ApiReports>> => {
        try {
            const response = await api.get<AllocationResponse>('/get-customer-deposit-list', {
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
    getCustomerDepositDetails: async (customerId: number): Promise<any> => {
        try {
            const response = await api.get(`/get-customer-deposit-details/${customerId}`);
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
    getProfitAndLoss: async (date_from: string, date_to : string, currency : string): Promise<any> => {
        try {
            const response = await api.get(`/get-profit-and-loss/${date_from}/${date_to}/${currency}`);
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
    getSalesReveue: async (
        page = 1,
        perPage = 10,
        filters: {
            search?: string;
            date_from?: Date | null;
            date_to?: Date | null;
        } = {}
    ): Promise<PaginatedResponse<ApiReports>> => {
        try {
            const response = await api.get<AllocationResponse>('/get-sales-revenue-list', {
                params: { page, per_page: perPage, ...filters, }
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
    getOtherIncome: async (
        page = 1,
        perPage = 10,
        filters: {
            search?: string;
            date_from?: Date | null;
            date_to?: Date | null;
        } = {}
    ): Promise<PaginatedResponse<ApiReports>> => {
        try {
            const response = await api.get<AllocationResponse>('/get-other-income-list', {
                params: { page, per_page: perPage, ...filters, }
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
    getTrialBalance: async (date_from: string, date_to : string): Promise<any> => {
        try {
            const response = await api.get(`/get-trial-balance/${date_from}/${date_to}`);
            return response.data;
        } catch (error) {
            console.error('Error fetching list:', error);
            throw new Error(error instanceof Error ? error.message : 'Failed to fetch list');
        }
    },
};
