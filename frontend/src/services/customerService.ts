import api from './api';

// Interfaces

export interface GroupsOption {
    value: number;
    en: string;
    cn: string;
}

export interface ApiCustomer {
    id: number;
    customer_code?: string;
    account_name_en?: string;
    account_name_cn?: string;
    company_en?: string;
    company_cn?: string;
    // customer_type: string;
    email_address?: string;
    status?: number;
    is_subscribe?: number;
    sales_person_name?: string;
    country_en?: string;
    country_cn?: string;
    language?: string;
    created_at?: string;
    updated_at?: string;
    groups?: GroupsOption[];
    [key: string]: any;
}

export interface ApiCustomerOrder {
    id: number;
    order_date: string;
    product_code: string;
    product_title_en: string;
    product_title_cn: string;
    price: number;
    qty: number;
    sub_total: number;
    currency : string;
    e_profit : number;
    e_total_sales: number;
    e_cost_total: number;
    item_deposit: number;
    base_total:number,
    total_deposit:number,
    created_at: string;
    updated_at: string;
    [key: string]: any; // Allow for additional fields from your API
}

export interface ApiCustomerInvoices {
    id: number;
    invoice_date: string;
    invoice_no: string;
    currency: string;
    invoice_status_en: string;
    invoice_status_cn: string;
    total_deposit: number;
    total: number;
    ex_rate: number;
    base_total: number;
    total_to_pay: number;
    base_total_to_pay: number;
    sub_total: number;
    base_sub_total: number;
    created_at: string;
    updated_at: string;
    [key: string]: any; // Allow for additional fields from your API
}
export interface ApiCustomerProfitability {
    id: number;
    invoice_date: string;
    invoice_no: string;
    currency: string;
    invoice_status_en: string;
    invoice_status_cn: string;
    total_deposit: number;
    total: number;
    ex_rate: number;
    base_total: number;
    total_to_pay: number;
    base_total_to_pay: number;
    sub_total: number;
    base_sub_total: number;
    created_at: string;
    updated_at: string;
    [key: string]: any; // Allow for additional fields from your API
}

export interface ApiCustomerSalesOrder {
    id: number;
    so_date: string;
    so_number: string;
    currency: string;
    invoice_status_en: string;
    invoice_status_cn: string;
    total_deposit: number;
    total: number;
    ex_rate: number;
    base_total: number;
    total_to_pay: number;
    base_total_to_pay: number;
    created_at: string;
    updated_at: string;
    [key: string]: any; // Allow for additional fields from your API
}

export interface ApiCustomerDeposit {
    id: number;
    rv_date: string;
    rv_number: string;
    bank: string;
    type: string;
    amount_paid: number;
    base_amount_paid: number;
    ex_rate: number;
    currency: string;
    status_en: string;
    status_cn: string;
    bank_name_en: string;
    bank_name_cn: string;
    source: string;
    [key: string]: any; // Allow for additional fields from your API
}
export interface ApiCustomerCredit {
    id: number;
    currency: string;
    ex_rate: number;
    debit: number;
    credit: number;
    base_debit: number;
    base_credit: number;
    running_balance: number;
    transaction_date: string;
    ref_data: string;
    type: string;
    table_id: string;
    particulars: string;
    created_at: string;
    updated_at: string;
    [key: string]: any; // Allow for additional fields from your API
}
export interface ApiCustomerRefund {
    id: number;
    currency: string;
    total_amount: number;
    pv_date: string;
    ref_data: string;
    bank: string;
    created_at: string;
    updated_at: string;
    [key: string]: any; // Allow for additional fields from your API
}

export interface PaginatedResponse<T> {
    current_page: number;
    data: T[];
    last_page: number;
    per_page: number;
    total: number;
    [key: string]: any;
}

export interface CustomerListResponse {
    success: boolean;
    message: string;
    list: PaginatedResponse<ApiCustomer>;
}

export interface CustomerOrderResponse {
    success: boolean;
    message: string;
    list: PaginatedResponse<ApiCustomerOrder>;
}
export interface CustomerInvoiceResponse {
    success: boolean;
    message: string;
    list: PaginatedResponse<ApiCustomerInvoices>;
}
export interface CustomerProfitabilityResponse {
    success: boolean;
    message: string;
    list: PaginatedResponse<ApiCustomerProfitability>;
}
export interface CustomerSalesOrderResponse {
    success: boolean;
    message: string;
    list: PaginatedResponse<ApiCustomerSalesOrder>;
}
export interface CustomerDepositResponse {
    success: boolean;
    message: string;
    list: PaginatedResponse<ApiCustomerDeposit>;
}
export interface CustomerCreditResponse {
    success: boolean;
    message: string;
    list: PaginatedResponse<ApiCustomerCredit>;
}
export interface CustomerRefundResponse {
    success: boolean;
    message: string;
    list: PaginatedResponse<ApiCustomerRefund>;
}
export interface SingleProductResponse {
    success: boolean;
    message: string;
    list: ApiCustomer;
}

export interface CustomerEmail {
    id: number;
    indexInt: number;
    is_deleted : number,
    customer_id: number;
    email_address: string;
    set_as_default: boolean;
}

export interface CustomerGroup {
    id: number;
    indexInt: number;
    is_deleted : number,
    customer_id: number;
    customer_group_id: number | null;
    set_as_default: boolean;
}

export interface CustomerEmailResponse {
    success: boolean;
    message: string;
    data: CustomerEmail[];
}

export interface CustomerGroupResponse {
    success: boolean;
    message: string;
    data: CustomerGroup[];
}

// API Service

export const customerService = {
    getAllCustomer: async (page = 1, perPage = 10, search = ''): Promise<PaginatedResponse<ApiCustomer>> => {
        try {
            const response = await api.get<CustomerListResponse>('/customer-list', {
                params: { page, per_page: perPage, search }
            });
            if (response.data.success && response.data.list) {
                return response.data.list;
            } else {
                throw new Error(response.data.message || 'Failed to fetch customers');
            }
        } catch (error) {
            console.error('Error fetching customers:', error);
            throw new Error(error instanceof Error ? error.message : 'Failed to fetch customers');
        }
    },
    getAllCustomerEmails: async (page = 1, perPage = 10, search = ''): Promise<PaginatedResponse<ApiCustomer>> => {
        try {
            const response = await api.get<CustomerListResponse>('/customer-list-emails', {
                params: { page, per_page: perPage, search }
            });
            if (response.data.success && response.data.list) {
                return response.data.list;
            } else {
                throw new Error(response.data.message || 'Failed to fetch customers');
            }
        } catch (error) {
            console.error('Error fetching customers:', error);
            throw new Error(error instanceof Error ? error.message : 'Failed to fetch customers');
        }
    },
    getAllCustomerByCode: async (page = 1, perPage = 10, search = ''): Promise<PaginatedResponse<ApiCustomer>> => {
        try {
            const response = await api.get<CustomerListResponse>('/customer-list-byCode', {
                params: { page, per_page: perPage, search }
            });
            if (response.data.success && response.data.list) {
                return response.data.list;
            } else {
                throw new Error(response.data.message || 'Failed to fetch customers');
            }
        } catch (error) {
            console.error('Error fetching customers:', error);
            throw new Error(error instanceof Error ? error.message : 'Failed to fetch customers');
        }
    },
    deleteCustomers: async (ids: number[], type: string): Promise<void> => {
        try {
            await api.put('/delete-customer', { ids, type });
        } catch (error) {
            console.error('Error deleting customer:', error);
            throw new Error('Failed to delete customer');
        }
    },

    getCustomerInfo: async (id: number): Promise<ApiCustomer> => {
        try {
            const response = await api.get<SingleProductResponse>(`/customer-info/${id}`);
            if (response.data.success && response.data.list) {
                return response.data.list;
            } else {
                throw new Error(response.data.message || 'Failed to fetch customer');
            }
        } catch (error) {
            console.error('Error fetching customer:', error);
            throw new Error(error instanceof Error ? error.message : 'Failed to fetch customer');
        }
    },

    getCustomerEmails: async (id: number): Promise<CustomerEmail[]> => {
        try {
            const response = await api.get<CustomerEmailResponse>(`/customer-emails/${id}`);
            if (response.data.success && response.data.data) {
                return response.data.data;
            } else {
                throw new Error(response.data.message || 'Failed to fetch customer emails');
            }
        } catch (error) {
            console.error('Error fetching customer emails:', error);
            throw new Error(error instanceof Error ? error.message : 'Failed to fetch customer emails');
        }
    },

    getCustomerGroup: async (id: number): Promise<CustomerGroup[]> => {
        try {
            const response = await api.get<CustomerGroupResponse>(`/customer-groups/${id}`);
            if (response.data.success && response.data.data) {
                return response.data.data;
            } else {
                throw new Error(response.data.message || 'Failed to fetch customer groups');
            }
        } catch (error) {
            console.error('Error fetching customer groups:', error);
            throw new Error(error instanceof Error ? error.message : 'Failed to fetch customer groups');
        }
    },
    getCustomerOrder: async (customerId:number,page = 1, perPage = 10, search = ''): Promise<PaginatedResponse<ApiCustomerOrder>> => {
        try {
            const response = await api.get<CustomerOrderResponse>(`/customer-orders/${customerId}`, {
                params: { page, per_page: perPage, search }
            });

            if (response.data.success && response.data.list) {
                return response.data.list;
            } else {
                throw new Error(response.data.message || 'Failed to fetch order');
            }
        } catch (error) {
            console.error('Error fetching order:', error);
            if (error instanceof Error) {
                throw new Error(`Failed to fetch order: ${error.message}`);
            }
            throw new Error('Failed to fetch order');
        }
    },
    getCustomerInvoices: async (customerId:number,page = 1, perPage = 10, search = ''): Promise<PaginatedResponse<ApiCustomerInvoices>> => {
        try {
            const response = await api.get<CustomerInvoiceResponse>(`/customer-invoices/${customerId}`, {
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
    getCustomerSalesOrder: async (customerId:number,page = 1, perPage = 10, search = ''): Promise<PaginatedResponse<ApiCustomerSalesOrder>> => {
        try {
            const response = await api.get<CustomerSalesOrderResponse>(`/customer-sales-order/${customerId}`, {
                params: { page, per_page: perPage, search }
            });

            if (response.data.success && response.data.list) {
                return response.data.list;
            } else {
                throw new Error(response.data.message || 'Failed to fetch sales order');
            }
        } catch (error) {
            console.error('Error fetching sales order:', error);
            if (error instanceof Error) {
                throw new Error(`Failed to fetch sales order: ${error.message}`);
            }
            throw new Error('Failed to fetch sales order');
        }
    },
    getCustomerDeposit: async (customerId:number,page = 1, perPage = 10, search = ''): Promise<PaginatedResponse<ApiCustomerDeposit>> => {
        try {
            const response = await api.get<CustomerDepositResponse>(`/customer-deposit/${customerId}`, {
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
    getCustomerProfitability: async (customerId:number,page = 1, perPage = 10, search = ''): Promise<PaginatedResponse<ApiCustomerProfitability>> => {
        try {
            const response = await api.get<CustomerProfitabilityResponse>(`/customer-profitability/${customerId}`, {
                params: { page, per_page: perPage, search }
            });

            if (response.data.success && response.data.list) {
                return response.data.list;
            } else {
                throw new Error(response.data.message || 'Failed to fetch order-history');
            }
        } catch (error) {
            console.error('Error fetching order-history:', error);
            if (error instanceof Error) {
                throw new Error(`Failed to fetch order-history: ${error.message}`);
            }
            throw new Error('Failed to fetch order-history');
        }
    },
    getCustomerOrderHistory: async (customerId:number,page = 1, perPage = 10, search = ''): Promise<PaginatedResponse<ApiCustomerInvoices>> => {
        try {
            const response = await api.get<CustomerInvoiceResponse>(`/customer-order-history/${customerId}`, {
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
    getCustomerCredit: async (customerId:number,page = 1, perPage = 10, search = ''): Promise<PaginatedResponse<ApiCustomerCredit>> => {
        try {
            const response = await api.get<CustomerCreditResponse>(`/customer-credit/${customerId}`, {
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
    updateCustomer: async (id: number, data: FormData): Promise<any> => {
        try {
            const response = await api.post(`/update-customer/${id}`, data, {
                headers: {
                'Content-Type': 'multipart/form-data',
                },
            });
            return response.data;
        } catch (error) {
            console.error('Error updating customer:', error);
            throw new Error('Failed to update customer');
        }
    },
    getCustomerRefund: async (customerId:number,page = 1, perPage = 10, search = ''): Promise<PaginatedResponse<ApiCustomerRefund>> => {
        try {
            const response = await api.get<CustomerRefundResponse>(`/customer-refund/${customerId}`, {
                params: { page, per_page: perPage, search }
            });

            if (response.data.success && response.data.list) {
                return response.data.list;
            } else {
                throw new Error(response.data.message || 'Failed to fetch refund');
            }
        } catch (error) {
            console.error('Error fetching refund:', error);
            if (error instanceof Error) {
                throw new Error(`Failed to fetch refund: ${error.message}`);
            }
            throw new Error('Failed to fetch refund');
        }
    },
    getCustomerExists: async (customerCode: string): Promise<any> => {
        try {
            const response = await api.get(`/customer-count/${customerCode}`);

            // assuming your Laravel backend returns just the count (a number)
            if (typeof response.data === 'number') {
                return response.data;
            }

            throw new Error('Invalid customer count response');

        } catch (error) {
            console.error('Error fetching product count:', error);
            throw new Error('Failed to fetch customer count');
        }
    },
    getCustomerOrderDetails: async (orderId: number): Promise<any> => {
        try {
            const response = await api.get(`/customer-orders-details/${orderId}`);
            if (response.data.success && response.data.list) {
                return response.data.list;
            } else {
                throw new Error(response.data.message || 'Failed to fetch order details');
            }
        } catch (error) {
            console.error('Error fetching order details:', error);
            throw new Error(error instanceof Error ? error.message : 'Failed to fetch order details');
        }
    },
    getCustomerInvoiceDetails: async (invoiceNo: string): Promise<any> => {
        try {
            const response = await api.get(`/customer-invoice-details/${invoiceNo}`);
            if (response.data.success && response.data.list) {
                return response.data.list;
            } else {
                throw new Error(response.data.message || 'Failed to fetch invoice details');
            }
        } catch (error) {
            console.error('Error fetching invoice details:', error);
            throw new Error(error instanceof Error ? error.message : 'Failed to fetch invoice details');
        }
    },
    getCustomerSODetails: async (SONumber: string): Promise<any> => {
        try {
            const response = await api.get(`/customer-so-details/${SONumber}`);
            if (response.data.success && response.data.list) {
                return response.data.list;
            } else {
                throw new Error(response.data.message || 'Failed to fetch so details');
            }
        } catch (error) {
            console.error('Error fetching so details:', error);
            throw new Error(error instanceof Error ? error.message : 'Failed to fetch so details');
        }
    },
    getDepositDetails: async (refData: string, type : string): Promise<any> => {
        try {
            const response = await api.get(`/customer-deposit-details/${refData}/${type}`);
            if (response.data.success && response.data.list) {
                return response.data.list;
            } else {
                throw new Error(response.data.message || 'Failed to fetch so details');
            }
        } catch (error) {
            console.error('Error fetching so details:', error);
            throw new Error(error instanceof Error ? error.message : 'Failed to fetch deposit details');
        }
    },

    getCreditDetails: async (refNumber: string, type : string): Promise<any> => {
        try {
            const response = await api.get(`/customer-credit-details/${refNumber}/${type}`);
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


    getAllDropdownData: async (tableName: string, id : string): Promise<any> => {
        try {
            const response = await api.get(`/customer-dropdowns/${tableName}/${id}`);
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
