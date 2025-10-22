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
};
