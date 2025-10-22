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

// Product service to fetch from your Laravel API
export const dropdownService = {
    getAllProductTypes: async (): Promise<OptionType[]> => {
        try {
            const response = await api.get<DropdownResponse>('/producttypes-list');
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

    getAllManufacturers: async (): Promise<OptionType[]> => {
        try {
            const response = await api.get<DropdownResponse>('/manufacturer-list');
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

    getAllSeries: async (): Promise<OptionType[]> => {
        try {
            const response = await api.get<DropdownResponse>('/series-list');
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

    getAllBrands: async (): Promise<OptionType[]> => {
        try {
            const response = await api.get<DropdownResponse>('/brand-list');
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

    getAllGenres: async (): Promise<OptionType[]> => {
        try {
            const response = await api.get<DropdownResponse>('/genre-list');
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

    getAllSuppliers: async (): Promise<OptionType[]> => {
        try {
            const response = await api.get<DropdownResponse>('/supplier-list');
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

    getAllCustomerGroup: async (): Promise<OptionType[]> => {
        try {
            const response = await api.get<DropdownResponse>('/customergroup-list');
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

    getAllCurrencies: async (): Promise<OptionType[]> => {
        try {
            const response = await api.get<DropdownResponse>('/currency-list');
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

    getAllWarehouse: async (): Promise<OptionType[]> => {
        try {
            const response = await api.get<DropdownResponse>('/warehouse-list');
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

    getAllCustomertype: async (): Promise<OptionType[]> => {
        try {
            const response = await api.get<DropdownResponse>('/customer-type-list');
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

    getAllCountries: async (): Promise<OptionType[]> => {
        try {
            const response = await api.get<DropdownResponse>('/country-list');
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
    getAllStates: async (): Promise<OptionType[]> => {
        try {
            const response = await api.get<DropdownResponse>('/state-list');
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
    getAllSource: async (): Promise<OptionType[]> => {
        try {
            const response = await api.get<DropdownResponse>('/source-list');
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
    getAllSalesPerson: async (): Promise<OptionType[]> => {
        try {
            const response = await api.get<DropdownResponse>('/sales-person-list');
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
    getAllCourier: async (): Promise<OptionType[]> => {
        try {
            const response = await api.get<DropdownResponse>('/courier-list');
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

    getAllTaxGroup: async (): Promise<OptionType[]> => {
        try {
            const response = await api.get<DropdownResponse>('/tax-group-list');
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

    getAllShippingTerms: async (): Promise<OptionType[]> => {
        try {
            const response = await api.get<DropdownResponse>('/shipping-terms-list');
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

    getAllBanks: async (): Promise<OptionType[]> => {
        try {
            const response = await api.get<DropdownResponse>('/bank-list');
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

    getAllCustomer: async (): Promise<OptionType[]> => {
        try {
            const response = await api.get<DropdownResponse>('/customer-all');
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

    getAllPOStatus: async (): Promise<OptionType[]> => {
        try {
            const response = await api.get<DropdownResponse>('/get-postatus');
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
    getAllGRNStatus: async (): Promise<OptionType[]> => {
        try {
            const response = await api.get<DropdownResponse>('/grn-status');
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

    getAllInvoiceType: async (): Promise<OptionType[]> => {
        try {
            const response = await api.get<DropdownResponse>('/get-invoice-type');
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

    getAllShippingStat: async (): Promise<OptionType[]> => {
        try {
            const response = await api.get<DropdownResponse>('/get-shipping-stat');
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

    getAllStoreLocation: async (): Promise<OptionType[]> => {
        try {
            const response = await api.get<DropdownResponse>('/get-store-location');
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

    getAllInvoiceStatus: async (): Promise<OptionType[]> => {
        try {
            const response = await api.get<DropdownResponse>('/invoice-status');
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

    getAllProduct: async (): Promise<OptionType[]> => {
        try {
            const response = await api.get<DropdownResponse>('/product-all');
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

    getAllPaymentTerms: async (): Promise<OptionType[]> => {
        try {
            const response = await api.get<DropdownResponse>('/payment-terms-list');
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

    getAllExpenses: async (): Promise<OptionType[]> => {
        try {
            const response = await api.get<DropdownResponse>('/expenses-list');
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

    getCurrentExchangeRate: async (): Promise<any> => {
        try {
            const response = await api.get('/supplier-list');
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
    getAllPaymentType: async (): Promise<OptionType[]> => {
        try {
            const response = await api.get<DropdownResponse>('/payment-type-list');
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
};
