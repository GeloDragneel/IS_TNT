import api from './api';

// Interfaces

export interface ApiPurchaseOrder {
    id: number;
    po_number?: string;
    po_date?: string;
    supplier_code?: string;
    suppliername_en?: string;
    suppliername_cn?: string;
    postatus_en?: string;
    postatus_cn?: string;
    supplier_id?: number;
    currency?: string;
    ex_rate?: number;
    po_amount?: number;
    base_currency?: number;
    deposit?: number;
    base_deposit?: number;
    procurement_by_id?: number;
    details?: any[]; // ✅ Replace with specific type if you have one
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

export interface PurchaseOrderListResponse {
    success: boolean;
    message: string;
    list: PaginatedResponse<ApiPurchaseOrder>;
}
// API Service

export interface DetailsExpanded {
  id: number;
  supplier_id: number;
  supplier_code: string;
  product_code: string;
  product_title_en: string;
  product_title_cn: string;
  suppliername_en: string;
  suppliername_cn: string;
  supplier_address_en: string;
  supplier_address_cn: string;
  indexInt: number;
  deposit_pv: string;
  invoice_pv: string;
  receive_date: string;
  receive_qty: number;
  procurement_by_id: number;
  ship_to: string;
  po_number: string;
  po_date: string;
  account_code: string;
  account_name_en: string;
  account_name_cn: string;
  ex_rate: number;
  amount: number;
  base_amount: number;
  postatus_id: number;
  currency: string;
  delivery_method_id: number;
  payment_terms_id: number;
  shipping_terms_id: number;
  delivery_date: string;
  due_date: string;
  pv_date: string;
  po_amount: number;
  base_currency: number;
  is_deleted: number;
  bank: string;
  deposit: number;
  base_deposit: number;
  bank_charges: number;
  base_bank_charges: number;
  PVJVDeposit: number;
  current_credit: number;
  item_cost: number;
  retail_price: number;
  qty: number;
  price: number;
  total: number;
  pv_number: number;
  total_amount: number;
  release_date?: string | null;
  po_dateline?: string | null;
  product: {
    product_code: string;
    product_title_en: string;
    product_title_cn: string;
    [key: string]: any; // Add this if the product has more fields you're not typing yet
  };
  details: {
    [key: string]: any; // Add this if the product has more fields you're not typing yet
  };
}
export interface DetailsRow {
  id: number;
  indexInt: number;
  product_code: string;
  po_number: string;
  product_title_en: string;
  product_title_cn: string;
  po_dateline: string;
  release_date: string;
  age_type: string;
  delete_type: string;
  pv_date: string;
  qty: number;
  total_amount: number;
  orig_qty: number;
  price: number;
  total: number;
  deposit: number;
  is_deleted: number;
  product_id: number;
  receive_qty: number;
  retail_price: number;
  pv_number: string;
  item_cost: number;
  ex_rate: number;
}
export type FilterParams = {
  search?: string;
  date_from?: Date | null;  // Allow null here
  date_to?: Date | null;  // Allow null here
  category_dates?: string;
  supplier_codes?: string[];
  postatus?: string[];
};
export const purchaseOrderService = {
    getAllPurchaseOrer: async (
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
    ): Promise<PaginatedResponse<ApiPurchaseOrder>> => {
        try {
            const response = await api.get<PurchaseOrderListResponse>('/purchase-order-list', {
                params: { page, per_page: perPage, ...filters, }
            });
            if (response.data.success && response.data.list) {
                return response.data.list;
            } else {
                throw new Error(response.data.message || 'Failed to fetch purchase-order-list');
            }``
        } catch (error) {
            console.error('Error fetching purchase-order-list:', error);
            throw new Error(error instanceof Error ? error.message : 'Failed to fetch purchase-order-list');
        }
    },
    getPurchaseOrderInfo: async (id: number): Promise<any> => {
        try {
            const response = await api.get(`/purchase-order-info/${id}`);
            if (response.data.success && response.data.list) {
                return response.data.list;
            } else {
                throw new Error(response.data.message || 'Failed to fetch purchase order info');
            }
        } catch (error) {
            console.error('Error fetching purchase order info:', error);
            throw new Error(error instanceof Error ? error.message : 'Failed to fetch purchase order info');
        }
    },
    voidPurchaseOrder: async (PONumber: string ): Promise<any> => {
        try {
            const response = await api.put(`/void-po/${PONumber}`);
            return response.data;
        } catch (error) {
            console.error('Error voidPurchaseOrder:', error);
            throw new Error('Failed to voidPurchaseOrder');
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
    createPVDeposit: async (data: FormData, type:string): Promise<any> => {
        try {
            data.append('type', type);
            const response = await api.post(`/create-pv-deposit`, data, {
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
    ): Promise<PaginatedResponse<ApiPurchaseOrder>> => {
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

    getPOProductInfo: async (productCode: string): Promise<any> => {
        try {
            const response = await api.get(`/get-po-products-info/${productCode}`);
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
    cancelPurchaseOrder: async (poNumber : string, type: string): Promise<any> => {
        try {
            const response = await api.put('/cancel-purchase-order', { poNumber, type });
            return response.data;
        } catch (error) {
            console.error('Error cancel purchase-order:', error);
            throw new Error('Failed to cancel purchase-order');
        }
    },
    updatePurchaseOrder: async (id: number, data: FormData): Promise<any> => {
        try {
            const response = await api.post(`/update-purchase-order/${id}`, data, {
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
};
