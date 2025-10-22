import api from './api';

// Interfaces

export interface ApiReceiveGoods {
    id: number;
    grn_no: string;
    grn_date: string;
    supplier_code: string;
    suppliername_en: string;
    suppliername_cn: string;
    grn_status_en: string;
    grn_status_cn: string;
    supplier_id: number;
    currency: string;
    ex_rate: number;
    total: number;
    base_total: number;
    company_id: number;
    grn_status_id: number;
    shipper_id: number;
    details?: any[];
    countOrders:number;
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

export interface GRNListResponse {
    success: boolean;
    message: string;
    list: PaginatedResponse<ApiReceiveGoods>;
}
// API Service
export interface DetailsRow {
    id: number;
    grn_no: string;
    po_number: string;
    po_id: number;
    product_id: number;
    supplier_id: number;
    qty: number;
    orig_qty: number;
    price: number;
    total: number;
    base_total: number;
    currency: string;
    ex_rate: number;
    item_cost: number;
    cartons: number;
    lcm: number;
    bcm: number;
    vweight: number;
    cbm: number;
    nw: number;
    cnt_weight: number;
    net_weight: number;
    hcm: number;
    received_qty: number;
    item_weight: number;
    pcs_per_carton: number;
    invoice_deposit: number;
    allocation: number;
    imported: number;
    warehouse: string;
    ap_invoice_no: string;
    advance_payment: number;
    base_advance_payment: number;
    product_code: string;
    product_title_en: string;
    product_title_cn: string;
    is_deleted: number;
    indexInt: number;
    age_type: string;
    product: {
        product_code: string;
        product_title_en: string;
        product_title_cn: string;
        [key: string]: any; // Add this if the product has more fields you're not typing yet
    };
}
export interface DetailGetOrders {
    id: number;
    grn_id: number;
    po_id: number;
    product_id: number;
    product_code: string;
    product_title_en: string;
    product_title_cn: string;
    customer_code: string;
    account_name_en: string;
    account_name_cn: string;
    orderQty: number;
    grnQty: number;
    qty: number;
    new_qty: number;
    remaining_qty: number;
    allocated_qty: number;
}
export interface ApiProduct {
    id: number;
    name?: string;
    retail_price?: number;
    preorder_price?: number;
    deposit?: number;
    item_cost?: number;
    status?: string;
    qty?: number;
    toy_n_toys?: boolean;
    wholesale?: boolean;
    created_at?: string;
    updated_at?: string;
    [key: string]: any; // Allow for additional fields from your API
}
export interface ApiAllocations {
    id: number;
    currency?: string;
    qty?: number;
    price?: number;
    total?: number;
    product_code?: string;
    product_title_en?: string;
    product_title_cn?: string;
    customer_code?: string;
    account_name_en?: string;
    account_name_cn?: string;
    shipping_stat_en?: string;
    shipping_stat_cn?: string;
    [key: string]: any; // Allow for additional fields from your API
}
export type FilterParams = {
    search?: string;
    date_from?: Date | null;
    date_to?: Date | null;
    category_dates?: string;
    supplier_codes?: string[];
};
export interface ProductListResponse {
    success: boolean;
    message: string;
    product: PaginatedResponse<ApiProduct>;
}
export const receiveGoodService = {
    getAllGRNList: async (
    page = 1,
    perPage = 10,
    filters: {
        search?: string;
        supplier_codes?: string[];
        category_dates?: string;
        date_from?: Date | null;
        date_to?: Date | null;
    } = {}
    ): Promise<PaginatedResponse<ApiReceiveGoods>> => {
        try {
            const response = await api.get<GRNListResponse>('/receive-goods-list', {
                params: { page, per_page: perPage, ...filters, }
            });
            if (response.data.success && response.data.list) {
                return response.data.list;
            } else {
                throw new Error(response.data.message || 'Failed to fetch receive-goods-list');
            }
        } catch (error) {
            console.error('Error fetching receive-goods-list:', error);
            throw new Error(error instanceof Error ? error.message : 'Failed to fetch receive-goods-list');
        }
    },
    deleteGRN: async (ids: number[]): Promise<any> => {
        try {
            const response = await api.put('/delete-receive-goods', { ids });
            return response.data;
        } catch (error) {
            console.error('Error deleting grn:', error);
            throw new Error('Failed to delete grn');
        }
    },
    getGRNInfo: async (id: number): Promise<any> => {
        try {
            const response = await api.get(`/grn-info/${id}`);
            if (response.data.success && response.data.list) {
                return response.data.list;
            } else {
                throw new Error(response.data.message || 'Failed to fetch grn-info');
            }
        } catch (error) {
            console.error('Error fetching grn-info:', error);
            throw new Error(error instanceof Error ? error.message : 'Failed to fetch grn-info');
        }
    },

    getGRNProductInfo: async (productCode: string): Promise<any> => {
        try {
            const response = await api.get(`/get-grn-products-info/${productCode}`);
            if (response.data.success && response.data) {
                return response.data;
            } else {
                throw new Error(response.data.message || 'Failed to fetch product info');
            }
        } catch (error) {
            console.error('Error fetching product info:', error);
            throw new Error(error instanceof Error ? error.message : 'Failed to fetch product info');
        }
    },
    getAllGRNProducts: async (page = 1, perPage = 10, search = '', sortId: number[] = []): Promise<PaginatedResponse<ApiProduct>> => {
        try {
            const response = await api.get<ProductListResponse>('/grn-product-list', {
                params: { page, per_page: perPage, search, sortId: sortId.length ? sortId.join(',') : [] }
            });

            if (response.data.success && response.data.product) {
                return response.data.product;
            } else {
                throw new Error(response.data.message || 'Failed to fetch products');
            }
        } catch (error) {
            console.error('Error fetching products:', error);
            if (error instanceof Error) {
                throw new Error(`Failed to fetch products: ${error.message}`);
            }
            throw new Error('Failed to fetch products');
        }
    },
    updateReceiveGoods: async (id: number, data: FormData): Promise<any> => {
        try {
            const response = await api.post(`/update-receive-goods/${id}`, data, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            return response.data;
        } catch (error) {
            console.error('Error updating receive-goods:', error);
            throw new Error('Failed to update receive-goods');
        }
    },

    getGRNAllocations: async (page = 1, perPage = 10, search = '', grnNo: string): Promise<PaginatedResponse<ApiProduct>> => {
        try {
            const response = await api.get('/grn-allocation-list/' + grnNo, {
                params: { page, per_page: perPage, search}
            });

            if (response.data.success && response.data.list) {
                return response.data.list;
            } else {
                throw new Error(response.data.message || 'Failed to fetch products');
            }
        } catch (error) {
            console.error('Error fetching products:', error);
            if (error instanceof Error) {
                throw new Error(`Failed to fetch products: ${error.message}`);
            }
            throw new Error('Failed to fetch products');
        }
    },
    getOrders: async (data: FormData): Promise<any> => {
        try {
            const response = await api.post(`/get-orders`, data, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            return response.data;
        } catch (error) {
            console.error('Error cancel preorder getOrders:', error);
            throw new Error('Failed to cancel preorder getOrders');
        }
    },
    allocatedOrders: async (data: FormData): Promise<any> => {
        try {
            const response = await api.post(`/allocated-orders`, data, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            return response.data;
        } catch (error) {
            console.error('Error cancel preorder getOrders:', error);
            throw new Error('Failed to cancel preorder getOrders');
        }
    },
};
