import api from './api';

type ExportReportParams = {
    format: string;
    name: string;
    ids: number[]; // array of IDs
};

export const printingService = {
    exportReport: async (params: ExportReportParams): Promise<any> => {
        try {
            // Serialize ids array as CSV string before sending
            const payload = {
                ...params,
                ids: params.ids.join(','), // or JSON.stringify(params.ids)
            };
            const response = await api.post('/export-report', payload);
            if (response.data.success && response.data.list) {
                return response.data.list;
            } else {
                throw new Error(response.data.message || 'Failed to fetch export-report');
            }
        } catch (error) {
         console.error('Error fetching export-report:', error);
            throw new Error(error instanceof Error ? error.message : 'Failed to fetch export-report');
        }
    },
};
