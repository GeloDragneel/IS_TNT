import api from './api';

// Interfaces

export interface GroupsOption {
    value: number;
    en: string;
    cn: string;
}
export interface ApiSupplier {
    id: number;
    supplier_code?: string;
    old_supplier_code?: string;
    suppliername_en?: string;
    suppliername_cn?: string;
    contact_person_en?: string;
    contact_person_cn?: string;
    contact_number?: string;
    currency?: number;
    shipping_terms_id?: number;
    payment_terms_id?: number;
    delivery_method_id?: number;
    email?: string;
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

export interface SupplierListResponse {
    success: boolean;
    message: string;
    list: PaginatedResponse<ApiSupplier>;
}
export interface SingleSupplierResponse {
    success: boolean;
    message: string;
    list: ApiSupplier;
}

export interface DetailsExpanded {
    id: number;
    orders_id: number;
    table_id: number;
    deposit: number;
    qty: number;
    price: number;
    total : number;
    item_deposit : number;
    base_item_deposit : number;
    amount : number;
    ex_rate : number;
    ref_data: string;
    currency: string;
    product_code: string;
    account_code: string;
    particulars: string;
    pv_date : string,
    product_title_en: string;
    product_title_cn: string;
    transaction_date: string;
    description_en: string;
    description_cn: string;
    invoice_no: string;
    po_number: string;
    ap_date: string;
    payment_order: number;
    profitability: number;
    amount_paid: number;
    base_amount: number;
    invoice_deposit: number;
}
export interface ApiSupplierFooter {
    total_sales: number;
    total_cost: number;
    total_profit: number;
    total_profit_percentage: number;
}

// API Service

export const supplierService = {
    getAllSupplier: async (page = 1, perPage = 10, search = ''): Promise<PaginatedResponse<ApiSupplier>> => {
        try {
            const response = await api.get<SupplierListResponse>('/get-supplier-list', {
                params: { page, per_page: perPage, search }
            });
            if (response.data.success && response.data.list) {
                return response.data.list;
            } else {
                throw new Error(response.data.message || 'Failed to fetch supplier');
            }
        } catch (error) {
            console.error('Error fetching supplier:', error);
            throw new Error(error instanceof Error ? error.message : 'Failed to fetch supplier');
        }
    },
    getSupplierInfo: async (id: number): Promise<any> => {
        try {
            const response = await api.get<SupplierListResponse>(`/supplier-info/${id}`);
            if (response.data.success && response.data.list) {
                return response.data.list;
            } else {
                throw new Error(response.data.message || 'Failed to fetch supplier');
            }
        } catch (error) {
            console.error('Error fetching supplier:', error);
            throw new Error(error instanceof Error ? error.message : 'Failed to fetch supplier');
        }
    },
    deleteSuppliers: async (ids: number[], type: string): Promise<void> => {
        try {
            await api.put('/delete-supplier', { ids, type });
        } catch (error) {
            console.error('Error deleting supplier:', error);
            throw new Error('Failed to delete supplier');
        }
    },
    getSupplierExists: async (supplierCode: string): Promise<any> => {
        try {
            const response = await api.get(`/supplier-count/${supplierCode}`);

            // assuming your Laravel backend returns just the count (a number)
            if (typeof response.data === 'number') {
                return response.data;
            }

            throw new Error('Invalid supplier count response');

        } catch (error) {
            console.error('Error fetching product count:', error);
            throw new Error('Failed to fetch supplier count');
        }
    },
    updateSupplier: async (id: number, data: FormData): Promise<any> => {
        try {
            const response = await api.post(`/update-supplier/${id}`, data, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            return response.data;
        } catch (error) {
            console.error('Error updating supplier:', error);
            throw new Error('Failed to update supplier');
        }
    },
    getSupplierInvoices: async (supplierId:number,page = 1, perPage = 10, search = ''): Promise<any> => {
        try {
            const response = await api.get(`/supplier-invoices/${supplierId}`, {
                params: { page, per_page: perPage, search }
            });

            if (response.data.success && response.data.list) {
                return response.data.list;
            } else {
                throw new Error(response.data.message || 'Failed to fetch invoices');
            }
        } catch (error) {
            console.error('Error fetching invoices:', error);
            if (error instanceof Error) {
                throw new Error(`Failed to fetch invoices: ${error.message}`);
            }
            throw new Error('Failed to fetch invoices');
        }
    },
    getSupplierInvoicesDetails: async (apInvoiceNo:string,page = 1, perPage = 10, search = ''): Promise<any> => {
        try {
            const response = await api.get(`/supplier-invoices-details/${apInvoiceNo}`, {
                params: { page, per_page: perPage, search }
            });

            if (response.data.success && response.data.list) {
                return response.data.list;
            } else {
                throw new Error(response.data.message || 'Failed to fetch invoices');
            }
        } catch (error) {
            console.error('Error fetching invoices:', error);
            if (error instanceof Error) {
                throw new Error(`Failed to fetch invoices: ${error.message}`);
            }
            throw new Error('Failed to fetch invoices');
        }
    },

    getSupplierPrepaid: async (supplierId:number,page = 1, perPage = 10, search = ''): Promise<any> => {
        try {
            const response = await api.get(`/supplier-deposit/${supplierId}`, {
                params: { page, per_page: perPage, search }
            });

            if (response.data.success && response.data.list) {
                return response.data.list;
            } else {
                throw new Error(response.data.message || 'Failed to fetch deposit');
            }
        } catch (error) {
            console.error('Error fetching deposit:', error);
            if (error instanceof Error) {
                throw new Error(`Failed to fetch deposit: ${error.message}`);
            }
            throw new Error('Failed to fetch deposit');
        }
    },

    getSupplierPrepaidDetails: async (refData:string,page = 1, perPage = 10, search = ''): Promise<any> => {
        try {
            const response = await api.get(`/supplier-deposit-details/${refData}`, {
                params: { page, per_page: perPage, search }
            });

            if (response.data.success && response.data.list) {
                return response.data.list;
            } else {
                throw new Error(response.data.message || 'Failed to fetch getSupplierPrepaidDetails');
            }
        } catch (error) {
            console.error('Error fetching getSupplierPrepaidDetails:', error);
            if (error instanceof Error) {
                throw new Error(`Failed to fetch getSupplierPrepaidDetails: ${error.message}`);
            }
            throw new Error('Failed to fetch getSupplierPrepaidDetails');
        }
    },

    getSupplierProfitability: async (supplierId:number,page = 1, perPage = 10, search = ''): Promise<any> => {
        try {
            const response = await api.get(`/supplier-profitability/${supplierId}`, {
                params: { page, per_page: perPage, search }
            });

            if (response.data.success && response.data.list) {
                return response.data.list;
            } else {
                throw new Error(response.data.message || 'Failed to fetch profitability');
            }
        } catch (error) {
            console.error('Error fetching profitability:', error);
            if (error instanceof Error) {
                throw new Error(`Failed to fetch profitability: ${error.message}`);
            }
            throw new Error('Failed to fetch profitability');
        }
    },
    getSupplierReceiveItems: async (supplierId:number,page = 1, perPage = 10, search = ''): Promise<any> => {
        try {
            const response = await api.get(`/supplier-received-items/${supplierId}`, {
                params: { page, per_page: perPage, search }
            });

            if (response.data.success && response.data.list) {
                return response.data.list;
            } else {
                throw new Error(response.data.message || 'Failed to fetch received-items');
            }
        } catch (error) {
            console.error('Error fetching received-items:', error);
            if (error instanceof Error) {
                throw new Error(`Failed to fetch received-items: ${error.message}`);
            }
            throw new Error('Failed to fetch received-items');
        }
    },
    getSupplierItemsOnPO: async (supplierId:number,page = 1, perPage = 10, search = ''): Promise<any> => {
        try {
            const response = await api.get(`/supplier-items-on-po/${supplierId}`, {
                params: { page, per_page: perPage, search }
            });

            if (response.data.success && response.data.list) {
                return response.data.list;
            } else {
                throw new Error(response.data.message || 'Failed to fetch supplier-items-on-po');
            }
        } catch (error) {
            console.error('Error fetching supplier-items-on-po:', error);
            if (error instanceof Error) {
                throw new Error(`Failed to fetch supplier-items-on-po: ${error.message}`);
            }
            throw new Error('Failed to fetch supplier-items-on-po');
        }
    },

    getSupplierItemsOnPODtails: async (refData:string,page = 1, perPage = 10, search = ''): Promise<any> => {
        try {
            const response = await api.get(`/supplier-items-on-po-details/${refData}`, {
                params: { page, per_page: perPage, search }
            });

            if (response.data.success && response.data.list) {
                return response.data.list;
            } else {
                throw new Error(response.data.message || 'Failed to fetch invoices');
            }
        } catch (error) {
            console.error('Error fetching invoices:', error);
            if (error instanceof Error) {
                throw new Error(`Failed to fetch invoices: ${error.message}`);
            }
            throw new Error('Failed to fetch invoices');
        }
    },

    getSupplierTransInfo: async (supplierId:number,page = 1, perPage = 10, search = ''): Promise<any> => {
        try {
            const response = await api.get(`/supplier-trans-info/${supplierId}`, {
                params: { page, per_page: perPage, search }
            });

            if (response.data.success && response.data.list) {
                return response.data.list;
            } else {
                throw new Error(response.data.message || 'Failed to fetch supplier-trans-info');
            }
        } catch (error) {
            console.error('Error fetching supplier-trans-info:', error);
            if (error instanceof Error) {
                throw new Error(`Failed to fetch supplier-trans-info: ${error.message}`);
            }
            throw new Error('Failed to fetch supplier-trans-info');
        }
    },

    getSupplierAccountsPayable: async (supplierId:number,page = 1, perPage = 10, search = ''): Promise<any> => {
        try {
            const response = await api.get(`/supplier-accounts-payable/${supplierId}`, {
                params: { page, per_page: perPage, search }
            });

            if (response.data.success && response.data.list) {
                return response.data.list;
            } else {
                throw new Error(response.data.message || 'Failed to fetch supplier-accounts-payable');
            }
        } catch (error) {
            console.error('Error fetching supplier-accounts-payable:', error);
            if (error instanceof Error) {
                throw new Error(`Failed to fetch supplier-accounts-payable: ${error.message}`);
            }
            throw new Error('Failed to fetch supplier-accounts-payable');
        }
    },
    getSupplierPayableDtails: async (refData:string,page = 1, perPage = 10, search = ''): Promise<any> => {
        try {
            const response = await api.get(`/supplier-accounts-payable-details/${refData}`, {
                params: { page, per_page: perPage, search }
            });

            if (response.data.success && response.data.list) {
                return response.data.list;
            } else {
                throw new Error(response.data.message || 'Failed to fetch invoices');
            }
        } catch (error) {
            console.error('Error fetching invoices:', error);
            if (error instanceof Error) {
                throw new Error(`Failed to fetch invoices: ${error.message}`);
            }
            throw new Error('Failed to fetch invoices');
        }
    },
    getSupplierCredit: async (supplierId:number,page = 1, perPage = 10, search = ''): Promise<any> => {
        try {
            const response = await api.get(`/supplier-credit/${supplierId}`, {
                params: { page, per_page: perPage, search }
            });

            if (response.data.success && response.data.list) {
                return response.data.list;
            } else {
                throw new Error(response.data.message || 'Failed to fetch supplier-credit');
            }
        } catch (error) {
            console.error('Error fetching supplier-credit:', error);
            if (error instanceof Error) {
                throw new Error(`Failed to fetch supplier-credit: ${error.message}`);
            }
            throw new Error('Failed to fetch supplier-credit');
        }
    },

    getCreditDetails: async (refNumber: string, type : string): Promise<any> => {
        try {
            const response = await api.get(`/supplier-credit-details/${refNumber}/${type}`);
            if (response.data.success && response.data.list) {
                return response.data.list;
            } else {
                throw new Error(response.data.message || 'Failed to fetch credit details');
            }
        } catch (error) {
            console.error('Error fetching credit details:', error);
            throw new Error(error instanceof Error ? error.message : 'Failed to fetch credit details');
        }
    },
};
