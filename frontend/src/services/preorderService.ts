import api from './api';

// Interfaces

export interface ApiPreorder {
    id: number;
    order_date?: string;
    order_id?: string;
    customer_code: string;
    account_name_en: string;
    account_name_cn: string;
    product_code: string;
    product_title_en: string;
    product_title_cn: string;
    sales_person_name: string;
    source_en: string;
    source_cn: string;
    currency: string;
    customer_type: string;
    e_total_sales_currency: string;
    e_profit_currency: string;
    e_cost_total_currency: string;
    product_thumbnail : string,
    qty: number;
    total: number;
    price: number;
    e_total_sales: number;
    e_profit: number;
    e_cost_total: number;
    deposit: number;
    order_status: number;
    [key: string]: any;
}
export interface PaginatedResponse<T> {
    current_page: number;
    data: T[];
    last_page: number;
    per_page: number;
    total: number;
    [key: string]: any;
}

export interface PreorderListResponse {
    success: boolean;
    message: string;
    list: PaginatedResponse<ApiPreorder>;
}
export interface ApiPreorderFooter {
    total_sales: number;
    total_cost: number;
    total_profit: number;
    total_profit_percentage: number;
}
interface SelectedOrder {
    customer_code: string;
    customer_id: number;
    company: string;
    account_name_en: string;
    customer_type: string;
    current_credit: number;
    total: number;
    total_item_deposit: number;
    total_base_item_deposit: number;
    totalPaidDeposit: number;
    currency: string;
    list: Array<{
        id: number;
        order_id: string;
        order_date: string;
        product_code: string;
        product_title_en: string;
        product_title_cn: string;
        qty: number;
        price: number;
        total: number;
        item_deposit: number;
        base_item_deposit: number;
        currency: string;
        customer_id: number;
        customer_name: string;
    }>;
    rvs: Array<{
        id: number;
        order_id: number;
        product_code: string;
        date: string;
        no: string;
        particulars: string;
        qty: number;
        orig_qty: number;
        amount: number;
        currency: string;
        ftype: string;
        jvrv_cap: string;
        solo: string;
    }>;
    crDetails: Array<{
        account_code: string;
        account_name_en: string;
        account_name_cn: string;
        ref_data: string;
        orig_currency: string;
        currency: string;
        is_converted: number;
        orig_qty: number;
        amount: number;
        default_amount: number;
  }>;
}
// API Service

export const preorderService = {
    getAllPreorder: async (
    page = 1,
    perPage = 10,
    filters: {
        search?: string;
        customer_codes?: string[];
        customer_groups?: string[];
        product_codes?: string[];
        category_dates?: string;
        date_from?: Date | null;
        date_to?: Date | null;
    } = {}
    ): Promise<PaginatedResponse<ApiPreorder>> => {
        try {
            const response = await api.get<PreorderListResponse>('/preorder-list', {
                params: { page, per_page: perPage, ...filters, }
            });
            if (response.data.success && response.data.list) {
                return response.data.list;
            } else {
                throw new Error(response.data.message || 'Failed to fetch preorder-list');
            }``
        } catch (error) {
            console.error('Error fetching preorder-list:', error);
            throw new Error(error instanceof Error ? error.message : 'Failed to fetch preorder-list');
        }
    },
    getPreorderInfo: async (id: number): Promise<any> => {
        try {
            const response = await api.get<PreorderListResponse>(`/preorder-info/${id}`);
            if (response.data.success && response.data.list) {
                return response.data.list;
            } else {
                throw new Error(response.data.message || 'Failed to fetch preorder');
            }
        } catch (error) {
            console.error('Error fetching preorder:', error);
            throw new Error(error instanceof Error ? error.message : 'Failed to fetch preorder');
        }
    },
    getWholesalePricingByProduct: async (productId: number,groupId : number, currency : string, qty : number): Promise<any> => {
        try {
            const response = await api.get(`/wholesale-price-byProduct/${productId}/${groupId}/${currency}/${qty}`);
            if (response.data.success) {
                return response.data.data.price;
            } else {
                throw new Error(response.data.message || 'Failed to fetch wholesale price');
            }
        } catch (error) {
            console.error('Error fetching preorder:', error);
            throw new Error(error instanceof Error ? error.message : 'Failed to fetch wholesale price');
        }
    },
    getRetailPricingByProduct: async (productId: number, currency: string): Promise<any> => {
        try {
            const response = await api.get(`/retail-price-byProduct/${productId}/${currency}`);
            
            if (response.data !== null && response.data !== undefined) {
                return response.data;
            } else {
                throw new Error('No pricing data returned');
            }
        } catch (error) {
            console.error('Error fetching retail price:', error);
            throw new Error(error instanceof Error ? error.message : 'Failed to fetch retail price');
        }
    },
    updatePreorder: async (id: number, data: FormData): Promise<any> => {
        try {
            const response = await api.post(`/update-preorder/${id}`, data, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            return response.data;
        } catch (error) {
            console.error('Error updating preorder:', error);
            throw new Error('Failed to update preorder');
        }
    },
    updateVoucher: async (id: number, data: FormData): Promise<any> => {
        try {
            const response = await api.post(`/update-voucher/${id}`, data, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            return response.data;
        } catch (error) {
            console.error('Error updating voucher:', error);
            throw new Error('Failed to update voucher');
        }
    },
    getSelectedOrders: async (ids: number[] , lang : string): Promise<SelectedOrder> => {
        try {
            const response = await api.get('/get-selected-orders', { params: { ids , lang : lang } });
            return response.data; // Ensure you're returning the correct data
        } catch (error) {
            console.error('Error get-selected-orders:', error);
            throw new Error('Failed to get-selected-orders');
        }
    },
    confirmOrder: async (data: FormData): Promise<any> => {
        try {
            const response = await api.post(`/confirm-order`, data, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            return response.data;
        } catch (error) {
            console.error('Error confirmOrder:', error);
            throw new Error('Failed to confirmOrder');
        }
    },
    deletePreorder: async (ids: number[]): Promise<void> => {
        try {
            await api.put('/delete-preorder', { ids });
        } catch (error) {
            console.error('Error deleting preorder:', error);
            throw new Error('Failed to delete preorder');
        }
    },
    deleteVoucher: async (ids: number[]): Promise<void> => {
        try {
            await api.put('/delete-voucher', { ids });
        } catch (error) {
            console.error('Error deleting voucher:', error);
            throw new Error('Failed to delete voucher');
        }
    },
    cancelOrder: async (ids: number[], type: string, isCancel:string, creditAmount: number): Promise<any> => {
        try {
            const response = await api.put('/cancel-preorder', { ids, type,isCancel,creditAmount });
            return response.data;
        } catch (error) {
            console.error('Error cancel preorder:', error);
            throw new Error('Failed to cancel preorder');
        }
    },
    createSalesOrder: async (ids: number[]): Promise<any> => {
        try {
            const response = await api.put('/create-preorder-so', { ids });
            return response.data;
        } catch (error) {
            console.error('Error cancel preorder createSalesOrder:', error);
            throw new Error('Failed to cancel preorder createSalesOrder');
        }
    },

    getAllUnsoldOrder: async (page = 1, perPage = 10, search = ''): Promise<any> => {
        try {
            const response = await api.get('/unsold-order', {
                params: { page, per_page: perPage, search }
            });
            if (response.data.success && response.data.list) {
                return response.data.list;
            } else {
                throw new Error(response.data.message || 'Failed to fetch unsold-order');
            }
        } catch (error) {
            console.error('Error fetching unsold-order:', error);
            throw new Error(error instanceof Error ? error.message : 'Failed to fetch unsold-order');
        }
    },
    holdOnHold: async (productId: number, hold_qty: number): Promise<any> => {
        try {
            const response = await api.post(`/hold-on-hold/${productId}`, {hold_qty});
            return response.data;
        } catch (error) {
            console.error('Error updating hold-on-hold:', error);
            throw new Error('Failed to update hold-on-hold');
        }
    },
    getAllPerformance: async (page = 1, perPage = 10, search = '',type = 'Orders1'): Promise<any> => {
        try {
            const response = await api.get('/sales-performance', {
                params: { page, per_page: perPage, search, type : type }
            });
            if (response.data.success && response.data.list) {
                return response.data.list;
            } else {
                throw new Error(response.data.message || 'Failed to fetch sales-performance');
            }
        } catch (error) {
            console.error('Error fetching sales-performance:', error);
            throw new Error(error instanceof Error ? error.message : 'Failed to fetch sales-performance');
        }
    },
    getPerformanceDetails: async (idToUse: number, type: string): Promise<any> => {
        try {
            const response = await api.get(`/performance-details/${idToUse}/${type}`);
            if (response.data.success && response.data.list) {
                return response.data.list;
            } else {
                throw new Error(response.data.message || 'Failed to fetch performance details');
            }
        } catch (error) {
            console.error('Error fetching performance details:', error);
            throw new Error(error instanceof Error ? error.message : 'Failed to fetch performance details');
        }
    },
    getAllClosingStatus: async (page = 1, perPage = 10, product_code = ''): Promise<any> => {
        try {
            const response = await api.get('/get-closing-status', {
                params: { page, per_page: perPage, product_code}
            });
            if (response.data.success && response.data.list) {
                return response.data.list;
            } else {
                throw new Error(response.data.message || 'Failed to fetch get-closing-status');
            }
        } catch (error) {
            console.error('Error fetching get-closing-status:', error);
            throw new Error(error instanceof Error ? error.message : 'Failed to fetch get-closing-status');
        }
    },
    getAllVoucherList: async (page = 1, perPage = 10, product_code = ''): Promise<any> => {
        try {
            const response = await api.get('/order-voucher', {
                params: { page, per_page: perPage, product_code}
            });
            if (response.data.success && response.data.list) {
                return response.data.list;
            } else {
                throw new Error(response.data.message || 'Failed to fetch order-voucher');
            }
        } catch (error) {
            console.error('Error fetching order-voucher:', error);
            throw new Error(error instanceof Error ? error.message : 'Failed to fetch order-voucher');
        }
    },
    getAllVoucherByCode: async (page = 1, perPage = 10, search = '', customerCode = ''): Promise<any> => {
        try {
            const response = await api.get('/order-voucher-bycode', {
                params: { page, per_page: perPage, search, customerCode}
            });
            if (response.data.success && response.data.list) {
                return response.data.list;
            } else {
                throw new Error(response.data.message || 'Failed to fetch order-voucher-bycode');
            }
        } catch (error) {
            console.error('Error fetching order-voucher-bycode:', error);
            throw new Error(error instanceof Error ? error.message : 'Failed to fetch order-voucher-bycode');
        }
    },

};
