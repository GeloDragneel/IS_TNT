import api from './api';

// Interfaces

export interface ApiSupplierInvoice {
    id: number;
    index_id: number;
    po_number?: string;
    po_date?: string;
    supplier_code?: string;
    suppliername_en?: string;
    suppliername_cn?: string;
    supplier_address_en?: string;
    supplier_address_cn?: string;
    ap_number?: string;
    ap_date?: string;
    supplier_id?: number;
    currency?: string;
    ex_rate?: number;
    tax?: number;
    base_tax?: number;
    sub_total?: number;
    base_sub_total?: number;
    total?: number;
    base_total?: number;
    payment?: number;
    balance?: number;
    deposit?: number;
    base_deposit?: number;
    po_ex_rate?: number;
    grn_ex_rate?: number;
    po_adv_pay?: number;
    grn_base_total?: number;
    credit_used?: number;
    base_credit_used?: number;
    current_credit?: number;
    base_current_credit?: number;
    total_deduction?: number;
    base_total_deduction?: number;
    bank: number;
    due_date?: string;
    delivery_date?: string;
    remarks?: string;
    grn_date?: string;
    details?: any[];
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
export interface ApiProduct {
    id: number;
    po_number: string;
    product_id: number;
    supplier_id: number;
    price: number;
    currency: string;
    qty: number;
    total: number;
    received_date: string;
    grn_ex_rate: number;
    grn_base_total: number;
    product_code: string;
    product_title_en: string;
    product_title_cn: string;
    [key: string]: any; // Allow for additional fields from your API
}
export interface PurchaseOrderListResponse {
    success: boolean;
    message: string;
    list: PaginatedResponse<ApiSupplierInvoice>;
}

export interface ProductListResponse {
    success: boolean;
    message: string;
    product: PaginatedResponse<ApiProduct>;
}

export interface DetailsExpanded {
  id: number;
  ap_number: string;
  ap_date: string;
  po_number: string;
  product_id: number;
  supplier_id: number;
  currency: string;
  ex_rate: number;
  qty: number;
  receive_qty: number;
  price: number;
  total: number;
  deposit: number;
  base_deposit: number;
  po_ex_rate: number;
  grn_ex_rate: number;
  po_adv_pay: number;
  grn_base_total: number;
  po_detail_id: number;
  product_type: number;
  product_code: string;
  product_title_en: string;
  product_title_cn: string;
  release_date?: string | null;
  po_dateline?: string | null;
  received_date?: string | null;
  is_deleted?: number;
  indexInt: number;
  base_total: number;
  age_type: string;
}
export interface DetailsRow {
  id: number;
  ap_number: string;
  ap_date: string;
  po_number: string;
  product_id: number;
  service_id: number;
  supplier_id: number;
  currency: string;
  ex_rate: number;
  qty: number;
  receive_qty: number;
  price: number;
  total: number;
  deposit: number;
  base_deposit: number;
  po_ex_rate: number;
  grn_ex_rate: number;
  po_adv_pay: number;
  grn_base_total: number;
  po_detail_id: number;
  product_type: number;
  product_code: string;
  product_title_en: string;
  product_title_cn: string;
  release_date?: string | null;
  po_dateline?: string | null;
  received_date?: string;
  is_deleted?: number;
  indexInt: number;
  age_type: string;
  deposit_pv: string;
}
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
export interface PreorderListResponse {
    success: boolean;
    message: string;
    list: PaginatedResponse<ApiPreorder>;
}
export type FilterParams = {
  search?: string;
  date_from?: Date | null;  // Allow null here
  date_to?: Date | null;  // Allow null here
  category_dates?: string;
  supplier_codes?: string[];
  postatus?: string[];
};
export const supplierInvoiceService = {
    getAllSupplierInvoices: async (
    page = 1,
    perPage = 10,
    filters: {
        search?: string;
        supplier_codes?: string[];
        postatus?: string[];
        category_dates?: string;
        date_from?: Date | null;
        date_to?: Date | null;
    } = {}
    ): Promise<PaginatedResponse<ApiSupplierInvoice>> => {
        try {
            const response = await api.get<PurchaseOrderListResponse>('/supplier-invoice-list', {
                params: { page, per_page: perPage, ...filters, }
            });
            if (response.data.success && response.data.list) {
                return response.data.list;
            } else {
                throw new Error(response.data.message || 'Failed to fetch supplier-invoice-list');
            }``
        } catch (error) {
            console.error('Error fetching supplier-invoice-list:', error);
            throw new Error(error instanceof Error ? error.message : 'Failed to fetch supplier-invoice-list');
        }
    },
    getSupplierInvoiceInfo: async (id: number): Promise<any> => {
        try {
            const response = await api.get(`/supplier-invoice-info/${id}`);
            if (response.data.success && response.data.list) {
                return response.data.list;
            } else {
                throw new Error(response.data.message || 'Failed to fetch supplier-invoice-info');
            }
        } catch (error) {
            console.error('Error fetching supplier-invoice-info:', error);
            throw new Error(error instanceof Error ? error.message : 'Failed to fetch supplier-invoice-info');
        }
    },
    voidSupplierInvoice: async (apInvoiceIdArr: number[] ): Promise<any> => {
        try {
            const response = await api.put(`/void-supplier-invoice/${apInvoiceIdArr}`);
            return response.data;
        } catch (error) {
            console.error('Error voidSupplierInvoice:', error);
            throw new Error('Failed to voidSupplierInvoice');
        }
    },
    getSupplierCredit: async (supplierId :number): Promise<any> => {
        try {
            const response = await api.get(`/get-supplier-credit/${supplierId}`);
            if (response.data.success && response.data.list) {
                return response.data.list;
            } else {
                throw new Error(response.data.message || 'Failed to fetch get-supplier-credit');
            }
        } catch (error) {
            console.error('Error fetching get-supplier-credit:', error);
            throw new Error(error instanceof Error ? error.message : 'Failed to fetch get-supplier-credit');
        }
    },
    createPVInvoice: async (data: FormData, type:string): Promise<any> => {
        try {
            data.append('type', type);
            const response = await api.post(`/create-pv-invoice`, data, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            return response.data;
        } catch (error) {
            console.error('Error createPaymentVoucher:', error);
            throw new Error('Failed to createPaymentVoucher');
        }
    },
    getAllDepositPaid: async (
    page = 1,
    perPage = 10,
    filters: {
        search?: string;
        sort_by?: string;
        date_to?: Date | null;
    } = {}
    ): Promise<PaginatedResponse<ApiSupplierInvoice>> => {
        try {
            const response = await api.get<PurchaseOrderListResponse>('/deposit-paid', {
                params: { page, per_page: perPage, ...filters, }
            });
            if (response.data.success && response.data.list) {
                return response.data.list;
            } else {
                throw new Error(response.data.message || 'Failed to fetch deposit-paid');
            }``
        } catch (error) {
            console.error('Error fetching deposit-paid:', error);
            throw new Error(error instanceof Error ? error.message : 'Failed to fetch deposit-paid');
        }
    },

    getSuppInvProductInfo: async (productCode: string,supplierId : number): Promise<any> => {
        try {
            const response = await api.get(`/get-suppInvoice-products-info/${productCode}/${supplierId}`);
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
    getPOSupplierInfo: async (supplierCode: string): Promise<any> => {
        try {
            const response = await api.get(`/get-po-supplier-info/${supplierCode}`);
            if (response.data.success && response.data) {
                return response.data;
            } else {
                throw new Error(response.data.message || 'Failed to fetch supplier info');
            }
        } catch (error) {
            console.error('Error fetching supplier info:', error);
            throw new Error(error instanceof Error ? error.message : 'Failed to fetch supplier info');
        }
    },
    getPOProducts: async (page = 1, perPage = 10, search = ''): Promise<any> => {
        try {
            const response = await api.get('/po-product-list', {
                params: { page, per_page: perPage, search }
            });
            if (response.data.success && response.data.product) {
                return response.data.product;
            } else {
                throw new Error(response.data.message || 'Failed to fetch po-product-list');
            }
        } catch (error) {
            console.error('Error fetching po-product-list:', error);
            if (error instanceof Error) {
                throw new Error(`Failed to fetch po-product-list: ${error.message}`);
            }
            throw new Error('Failed to fetch po-product-list');
        }
    },
    getCountGRN: async (poId: number): Promise<any> => {
        try {
            const response = await api.get(`/count-grn/${poId}`);
            return response.data;
          
        } catch (error) {
            console.error('Error fetching count-grn:', error);
            throw new Error(error instanceof Error ? error.message : 'Failed to fetch count-grn');
        }
    },
    cancelSupplierInvoice: async (poNumber : string, type: string): Promise<any> => {
        try {
            const response = await api.put('/cancel-purchase-order', { poNumber, type });
            return response.data;
        } catch (error) {
            console.error('Error cancel purchase-order:', error);
            throw new Error('Failed to cancel purchase-order');
        }
    },
    updateSupplierInvoice: async (id: number, data: FormData): Promise<any> => {
        try {
            const response = await api.post(`/update-supplier-invoice/${id}`, data, {
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

    getPODepositList: async (po_number: string): Promise<any> => {
        try {
            const response = await api.get(`/get-po-deposit-info/${po_number}`);
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
    getDepositPV: async (ref_data: string, product_id : number): Promise<any> => {
        try {
            const response = await api.get(`/get-deposit-pv/${ref_data}/${product_id}`);
            return response.data;
        } catch (error) {
            console.error('Error fetching get-deposit-pv:', error);
            throw new Error(error instanceof Error ? error.message : 'Failed to fetch get-deposit-pv');
        }
    },
    getAllProductsBySuppInv: async (page = 1, perPage = 10, search = '', sortId: number[] = [],supplierId:number): Promise<PaginatedResponse<ApiProduct>> => {
        try {
            const response = await api.get<ProductListResponse>(`/product-list-suppInvoice/${supplierId}`, {
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
    getProductsBySupplierId: async (supplierId: number): Promise<any> => {
        try {
            const response = await api.get(`/supplier-invoice-products/${supplierId}`);
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

    getPaidItemNotReceived: async (page = 1,perPage = 10,search = "" ): Promise<PaginatedResponse<ApiSupplierInvoice>> => {
        try {
            const response = await api.get<PurchaseOrderListResponse>('/paid-item-not-received', {
                params: { page, per_page: perPage, search }
            });
            if (response.data.success && response.data.list) {
                return response.data.list;
            } else {
                throw new Error(response.data.message || 'Failed to fetch paid-item-not-received');
            }``
        } catch (error) {
            console.error('Error fetching paid-item-not-received:', error);
            throw new Error(error instanceof Error ? error.message : 'Failed to fetch paid-item-not-received');
        }
    },

    getUnpaidItemReceived: async (page = 1,perPage = 10,search = "" ): Promise<PaginatedResponse<ApiSupplierInvoice>> => {
        try {
            const response = await api.get<PurchaseOrderListResponse>('/unpaid-item-received', {
                params: { page, per_page: perPage, search }
            });
            if (response.data.success && response.data.list) {
                return response.data.list;
            } else {
                throw new Error(response.data.message || 'Failed to fetch unpaid-item-received');
            }``
        } catch (error) {
            console.error('Error fetching unpaid-item-received:', error);
            throw new Error(error instanceof Error ? error.message : 'Failed to fetch unpaid-item-received');
        }
    },

    getAllPreorder: async (page = 1,perPage = 10,filters: {search?: string;productIds?: number[];} = {}): Promise<PaginatedResponse<ApiPreorder>> => {
        try {
            const response = await api.get<PreorderListResponse>('/preorder-list-byProducts', {
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
};
