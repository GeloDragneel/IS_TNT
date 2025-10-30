import api from './api';

// Product service to fetch from your Laravel API
export const dashboardService = {
    getDashboardExRates: async (): Promise<any> => {
        try {
            const response = await api.get('/dashboard-exrates');
            return response.data;
        } catch (error) {
            console.error('Error fetching list:', error);
            throw new Error(error instanceof Error ? error.message : 'Failed to fetch list');
        }
    },
    getDashboardShipments: async (): Promise<any> => {
        try {
            const response = await api.get('/dashboard-shipments');
            return response.data;
        } catch (error) {
            console.error('Error fetching list:', error);
            throw new Error(error instanceof Error ? error.message : 'Failed to fetch list');
        }
    },
    getDashboardPreorderClosing: async (): Promise<any> => {
        try {
            const response = await api.get('/dashboard-preorder-closing');
            return response.data;
        } catch (error) {
            console.error('Error fetching list:', error);
            throw new Error(error instanceof Error ? error.message : 'Failed to fetch list');
        }
    },
    getDashboardNewOrders: async (): Promise<any> => {
        try {
            const response = await api.get('/dashboard-new-orders');
            return response.data;
        } catch (error) {
            console.error('Error fetching list:', error);
            throw new Error(error instanceof Error ? error.message : 'Failed to fetch list');
        }
    },
    getDashboardItemsAndInventory: async (m:number, y:number): Promise<any> => {
        try {
            const response = await api.get(`/dashboard-items-and-inventory/${m}/${y}`);
            return response.data;
        } catch (error) {
            console.error('Error fetching list:', error);
            throw new Error(error instanceof Error ? error.message : 'Failed to fetch list');
        }
    },
    getDashboardSupplier: async (m:number, y:number): Promise<any> => {
        try {
            const response = await api.get(`/dashboard-supplier/${m}/${y}`);
            return response.data;
        } catch (error) {
            console.error('Error fetching list:', error);
            throw new Error(error instanceof Error ? error.message : 'Failed to fetch list');
        }
    },

    getDashboardCustomer: async (m:number, y:number): Promise<any> => {
        try {
            const response = await api.get(`/dashboard-customer/${m}/${y}`);
            return response.data;
        } catch (error) {
            console.error('Error fetching list:', error);
            throw new Error(error instanceof Error ? error.message : 'Failed to fetch list');
        }
    },
    getDashboardLogistics: async (m:number, y:number): Promise<any> => {
        try {
            const response = await api.get(`/dashboard-logistics/${m}/${y}`);
            return response.data;
        } catch (error) {
            console.error('Error fetching list:', error);
            throw new Error(error instanceof Error ? error.message : 'Failed to fetch list');
        }
    },
    getDashboardAllocation: async (m:number, y:number): Promise<any> => {
        try {
            const response = await api.get(`/dashboard-allocation/${m}/${y}`);
            return response.data;
        } catch (error) {
            console.error('Error fetching list:', error);
            throw new Error(error instanceof Error ? error.message : 'Failed to fetch list');
        }
    },
    getDashboardShipout: async (m:number, y:number): Promise<any> => {
        try {
            const response = await api.get(`/dashboard-shipout/${m}/${y}`);
            return response.data;
        } catch (error) {
            console.error('Error fetching list:', error);
            throw new Error(error instanceof Error ? error.message : 'Failed to fetch list');
        }
    },
    getDashboardAccounts: async (m:number, y:number): Promise<any> => {
        try {
            const response = await api.get(`/dashboard-accounts/${m}/${y}`);
            return response.data;
        } catch (error) {
            console.error('Error fetching list:', error);
            throw new Error(error instanceof Error ? error.message : 'Failed to fetch list');
        }
    },
    getDashboardSales: async (m:number, y:number): Promise<any> => {
        try {
            const response = await api.get(`/dashboard-sales/${m}/${y}`);
            return response.data;
        } catch (error) {
            console.error('Error fetching list:', error);
            throw new Error(error instanceof Error ? error.message : 'Failed to fetch list');
        }
    },
    getDashboardPO: async (m:number, y:number): Promise<any> => {
        try {
            const response = await api.get(`/dashboard-po/${m}/${y}`);
            return response.data;
        } catch (error) {
            console.error('Error fetching list:', error);
            throw new Error(error instanceof Error ? error.message : 'Failed to fetch list');
        }
    },
};
