import api from './api';

// Interface matching your Laravel API response

export interface GenreOption {
    value: number;
    en: string;
    cn: string;
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
    new_qty?: number;
    genres?: GenreOption[]; // ✅ include genres array
    [key: string]: any; // Allow for additional fields from your API
}
export interface DetailsRow {
    id: number;
    customer_code: string;
    account_name_en: string;
    account_name_cn: string;
    customer_name_en: string;
    customer_name_cn: string;
    shipping_stat_en: string;
    shipping_stat_cn: string;
    so_number: string;
    invoice_no: string;
    warehouse: string;
    product_code: string;
    product_title_en: string;
    product_title_cn: string;
    warehouse_from: string;
    warehouse_to: string;
    qty: number;
    is_account: number;
    received_qty: number;
    rem_qty: number;
    inventory_id: number;
    physical_qty: number;
}
export interface PaginatedResponse<T> {
    current_page: number;
    data: T[];
    last_page: number;
    per_page: number;
    total: number;
    [key: string]: any; // For extra pagination fields if needed
}

export interface Detail {
    id: number;
    product_id: number;
    product_code: string;
    product_title_en: string;
    product_title_cn: string;
    preorder_start_date: string;
    preorder_end_date: string;
    item_cost: number;
    retail_price: number;
    preorder_price: number;
    deposit: number;
    currency: string;
    thumbnail: string;
}

export interface SingleProductResponse {
    success: boolean;
    message: string;
    product: ApiProduct;
}
export interface SingleProductTagResponse {
    success: boolean;
    message: string;
    product: Detail[];
}

export interface ProductListResponse {
    success: boolean;
    message: string;
    product: PaginatedResponse<ApiProduct>;
}

export interface OptionType {
    value: string | number;
    value2: string | number;
    en: string;
    cn: string;
}

export interface ProductImage {
    id: number;
    type: 'thumbnail' | 'display' | 'banner' | 'slide';
    path: string;
    rank: string;
}
export interface Profitability {
    id: number;
    product_status: string;
    customer_code: string;
    currency: string;
    customer_name: string;
    invoice_no: string;
    product_code: string;
    qty: number;
    item_cost: number;
    total_cost: number;
    price: number;
    total_price: number;
    profit: number;
}

export interface ProductProfitability {
    success: boolean;
    message: string;
    list: PaginatedResponse<Profitability>;
}

export interface ProductImagesResponse {
    success: boolean;
    message: string;
    data: ProductImage[];
}
export interface CustomerGroup {
    id: number;
    customer_group_en: string;
    customer_group_cn: string;
    currency: string;
    brevo_list_id: number;
    created_at: string;
    updated_at: string;
}

export interface ProductPricing {
    id: number;
    product_id: number;
    customer_group_id: number;
    type: string;
    currency: string;
    pcs_or_crtn: number;
    deposit: number;
    price_a: number;
    price_b: number;
    price_c: number;
    retail_price: number;
    preorder_price: number;
    profit_prcnt_a: number;
    profit_prcnt_b: number;
    profit_prcnt_c: number;
    price_a_pcs_crtn: number;
    price_b_pcs_crtn: number;
    price_c_pcs_crtn: number;
    price_b_to_pcs_crtn: number;
    price_c_to_pcs_crtn: number;
    created_at: string;
    updated_at: string;
    customer_group: CustomerGroup;
}

export interface BasicResponse {
    success: boolean;
    message: string;
    data: ProductPricing[];
}

interface ProductTypeResponse {
    success: boolean;
    message: string;
    list: OptionType[];
}

// Product service to fetch from your Laravel API
export const productService = {
    // Get all products from your Laravel endpoint
    getAllProducts: async (page = 1, perPage = 10, search = ''): Promise<PaginatedResponse<ApiProduct>> => {
        try {
            const response = await api.get<ProductListResponse>('/product-list', {
                params: { page, per_page: perPage, search }
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
    getAllProductsImport: async (page = 1, perPage = 10, search = ''): Promise<PaginatedResponse<ApiProduct>> => {
        try {
            const response = await api.get<ProductListResponse>('/product-import-list', {
                params: { page, per_page: perPage, search }
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
    getAllProductsBySort: async (page = 1, perPage = 10, search = '', sortId: number[] = []): Promise<PaginatedResponse<ApiProduct>> => {
        try {
            const response = await api.get<ProductListResponse>('/product-list-sort', {
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
    getAllProductsByCode: async (page = 1, perPage = 10, search = ''): Promise<PaginatedResponse<ApiProduct>> => {
        try {
            const response = await api.get<ProductListResponse>('/product-list-byCode', {
                params: { page, per_page: perPage, search }
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

    getArchiveProducts: async (page = 1, perPage = 10, search = ''): Promise<PaginatedResponse<ApiProduct>> => {
        try {
            const response = await api.get<ProductListResponse>('/product-archive', {
                params: { page, per_page: perPage, search }
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
    getProductTagList: async (page = 1, perPage = 10, search = ''): Promise<PaginatedResponse<ApiProduct>> => {
        try {
            const response = await api.get<ProductListResponse>('/product-tagging', {
                params: { page, per_page: perPage, search }
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
    deleteProducts: async (ids: number[], type: string): Promise<void> => {
        try {
            await api.put('/delete-product', { ids, type });
        } catch (error) {
            console.error('Error deleting products:', error);
            throw new Error('Failed to delete products');
        }
    },
    deleteProductsTagMaster: async (ids: number[], type: string): Promise<void> => {
        try {
            await api.put('/delete-product-tag-master', { ids, type });
        } catch (error) {
            console.error('Error deleting products:', error);
            throw new Error('Failed to delete products tag');
        }
    },
    deleteProductsTagDetail: async (ids: number[], type: string): Promise<void> => {
        try {
            await api.put('/delete-product-tag-detail', { ids, type });
        } catch (error) {
            console.error('Error deleting products:', error);
            throw new Error('Failed to delete products tag detail');
        }
    },
    getProductInfo: async (id: number): Promise<ApiProduct> => {
        try {
            const response = await api.get<SingleProductResponse>(`/product-info/${id}`);
            if (response.data.success && response.data.product) {
                return response.data.product;
            } else {
                throw new Error(response.data.message || 'Failed to fetch product');
            }
        } catch (error) {
            console.error('Error fetching products:', error);
            if (error instanceof Error) {
                throw new Error(`Failed to fetch products: ${error.message}`);
            }
            throw new Error('Failed to fetch products');
        }
    },
    getAllProductTypes: async (): Promise<OptionType[]> => {
        try {
            const response = await api.get<ProductTypeResponse>('/producttypes-list');
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
            const response = await api.get<ProductTypeResponse>('/manufacturer-list');
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
            const response = await api.get<ProductTypeResponse>('/series-list');
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
            const response = await api.get<ProductTypeResponse>('/brand-list');
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
            const response = await api.get<ProductTypeResponse>('/genre-list');
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
            const response = await api.get<ProductTypeResponse>('/supplier-list');
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
            const response = await api.get<ProductTypeResponse>('/customergroup-list');
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
            const response = await api.get<ProductTypeResponse>('/currency-list');
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
            const response = await api.get<ProductTypeResponse>('/warehouse-list');
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
    getProductImages: async (id: number): Promise<ProductImage[]> => {
        try {
            const response = await api.get<ProductImagesResponse>(`/product-images/${id}`);
            if (response.data.success && response.data.data) {
                return response.data.data;
            } else {
                throw new Error(response.data.message || 'Failed to fetch product images');
            }
        } catch (error) {
            console.error('Error fetching product images:', error);
            if (error instanceof Error) {
                throw new Error(`Failed to fetch product images: ${error.message}`);
            }
            throw new Error('Failed to fetch product images');
        }
    },
    getProductImagesTag: async (id: number): Promise<ProductImage[]> => {
        try {
            const response = await api.get<ProductImagesResponse>(`/product-images-tag/${id}`);
            if (response.data.success && response.data.data) {
                return response.data.data;
            } else {
                throw new Error(response.data.message || 'Failed to fetch product images');
            }
        } catch (error) {
            console.error('Error fetching product images:', error);
            if (error instanceof Error) {
                throw new Error(`Failed to fetch product images: ${error.message}`);
            }
            throw new Error('Failed to fetch product images');
        }
    },
    getWholesalePricing: async (id: number): Promise<ProductPricing[]> => {
        try {
            const response = await api.get<BasicResponse>(`/product-wholesale-prices/${id}`);
            if (response.data.success && response.data.data) {
                return response.data.data;
            } else {
                throw new Error(response.data.message || 'Failed to fetch wholesale pricing');
            }
        } catch (error) {
            console.error('Error fetching wholesale pricing:', error);
            if (error instanceof Error) {
                throw new Error(`Failed to fetch wholesale pricing: ${error.message}`);
            }
            throw new Error('Failed to fetch wholesale pricing');
        }
    },
    getPrductPricingById: async (id: number): Promise<ProductPricing[]> => {
        try {
            const response = await api.get<BasicResponse>(`/product-prices-byid/${id}`);
            if (response.data.success && response.data.data) {
                return response.data.data;
            } else {
                throw new Error(response.data.message || 'Failed to fetch wholesale pricing');
            }
        } catch (error) {
            console.error('Error fetching wholesale pricing:', error);
            if (error instanceof Error) {
                throw new Error(`Failed to fetch wholesale pricing: ${error.message}`);
            }
            throw new Error('Failed to fetch wholesale pricing');
        }
    },
    getPrductPricingByGroupId: async (id: number): Promise<ProductPricing[]> => {
        try {
            const response = await api.get<BasicResponse>(`/product-prices-bygroupid/${id}`);
            if (response.data.success && response.data.data) {
                return response.data.data;
            } else {
                throw new Error(response.data.message || 'Failed to fetch wholesale pricing');
            }
        } catch (error) {
            console.error('Error fetching wholesale pricing:', error);
            if (error instanceof Error) {
                throw new Error(`Failed to fetch wholesale pricing: ${error.message}`);
            }
            throw new Error('Failed to fetch wholesale pricing');
        }
    },
    getRetailPricing: async (id: number): Promise<ProductPricing[]> => {
        try {
            const response = await api.get<BasicResponse>(`/product-retail-prices/${id}`);
            if (response.data.success && response.data.data) {
                return response.data.data;
            } else {
                throw new Error(response.data.message || 'Failed to fetch wholesale pricing');
            }
        } catch (error) {
            console.error('Error fetching wholesale pricing:', error);
            if (error instanceof Error) {
                throw new Error(`Failed to fetch wholesale pricing: ${error.message}`);
            }
            throw new Error('Failed to fetch wholesale pricing');
        }
    },
    getExchangeRate: async (from: string, to: string, date: string): Promise<number> => {
        try {
            const response = await api.get(`/exchange-rate/${from}/${to}/${date}`);
            if (response.data.success) {
                return response.data.rate;
            } else {
                throw new Error('Failed to fetch exchange rate');
            }
        } catch (error) {
            console.error('Error fetching exchange rate:', error);
            throw new Error('Failed to fetch exchange rate');
        }
    },
    updateProduct: async (id: number, data: FormData): Promise<any> => {
        try {
            const response = await api.post(`/update-product/${id}`, data, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            return response.data;
        } catch (error) {
            console.error('Error updating product:', error);
            throw new Error('Failed to update product');
        }
    },
    updateProductTag: async (id: number, data: FormData): Promise<any> => {
        try {
            const response = await api.post(`/update-product-tag/${id}`, data, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            return response.data;
        } catch (error) {
            console.error('Error updating product:', error);
            throw new Error('Failed to update product');
        }
    },

    insertNewProductTag: async (id: number, data: FormData): Promise<any> => {
        try {
            const response = await api.post(`/insert-product-new-tag/${id}`, data, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            return response.data;
        } catch (error) {
            console.error('Error updating product:', error);
            throw new Error('Failed to update product');
        }
    },
    insertProductTag: async (id: number[], data: FormData): Promise<any> => {
        try {
            const response = await api.post(`/insert-product-tag/${id}`, data, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            return response.data;
        } catch (error) {
            console.error('Error updating product:', error);
            throw new Error('Failed to update product');
        }
    },
    updateTntWholesale: async (id: number, newValue: number, type: string): Promise<any> => {
        try {
            const response = await api.post(`/update-tnt-wholesale/${id}`, {newValue,type});
            return response.data;
        } catch (error) {
            console.error('Error updating product:', error);
            throw new Error('Failed to update product');
        }
    },
    upsertPricing: async (data: any): Promise<any> => {
        try {
            const response = await api.post('/upsert-pricing', data);
            return response.data;
        } catch (error) {
            console.error('Error upserting pricing:', error);
            throw new Error('Failed to upsert pricing');
        }
    },
    updateProductImageRank: async (updates: { id: number | undefined; rank: number }[]): Promise<any> => {
        try {
            const response = await api.post('/update-product-image-rank', { updates });
            return response.data;
        } catch (error) {
            console.error('Error updating image rank:', error);
            throw new Error('Failed to update image rank');
        }
    },
    getProductExist: async (productCode: string): Promise<any> => {
        try {
            const response = await api.get(`/product-count/${productCode}`);

            // assuming your Laravel backend returns just the count (a number)
            if (typeof response.data === 'number') {
                return response.data;
            }

            throw new Error('Invalid product count response');

        } catch (error) {
            console.error('Error fetching product count:', error);
            throw new Error('Failed to fetch product count');
        }
    },
    getProductExistTag: async (productCode: string): Promise<any> => {
        try {
            const response = await api.get(`/product-count-tag/${productCode}`);

            // assuming your Laravel backend returns just the count (a number)
            if (typeof response.data === 'number') {
                return response.data;
            }

            throw new Error('Invalid product tag count response');

        } catch (error) {
            console.error('Error fetching product count:', error);
            throw new Error('Failed to fetch product count');
        }
    },
    getCurrentDateExRate: async (currency: string, baseCurrency: string): Promise<number> => {
        try {
            const response = await api.get(`/current-exrate/${currency}/${baseCurrency}`);
            if (response.data) {
                return response.data;
            } else {
                throw new Error('Failed to fetch current rate');
            }
        } catch (error) {
            console.error('Error fetching current rate:', error);
            throw new Error('Failed to fetch current rate');
        }
    },
    getOperator: async (conversionKey: string): Promise<'Divide' | 'Multiply'> => {
        try {
            const response = await api.get(`/operator/${conversionKey}`);
            if (response) {
                return response.data;
            } else {
                throw new Error('Failed to fetch operator');
            }
        } catch (error) {
            console.error('Error fetching operator:', error);
            throw new Error('Failed to fetch operator');
        }
    },
    deletePricing: async (id: number): Promise<void> => {
        try {
            await api.put(`/delete-price/${id}`);
        } catch (error) {
            console.error('Error deleting pricing:', error);
            throw new Error('Failed to delete pricing');
        }
    },
    getProfitabilityByOrders: async (productId: number,page = 1): Promise<{ data: Profitability[]; pagination: PaginatedResponse<Profitability> }> => {
        try {
            const response = await api.get(`/product-profit-order/${productId}`, {
                params: { page }
            });

            if (response.data.success) {
                return {
                    data: response.data.data,
                    pagination: response.data.pagination
                };
            } else {
                throw new Error(response.data.message || 'Failed to fetch getProfitabilityByOrders');
            }
        } catch (error) {
            console.error('Error fetching getProfitabilityByOrders:', error);
            if (error instanceof Error) {
                throw new Error(`Failed to fetch getProfitabilityByOrders: ${error.message}`);
            }
            throw new Error('Failed to fetch getProfitabilityByOrders');
        }
    },
    getProfitabilityByInvoice: async (
        productId: number,
        page = 1
    ): Promise<{ data: Profitability[]; pagination: PaginatedResponse<Profitability> }> => {
        try {
            const response = await api.get(`/product-profit-invoice/${productId}`, {
                params: { page }
            });
            if (response.data.success && response.data) {
                return {
                    data: response.data.data,
                    pagination: response.data.pagination
                };
            } else {
                throw new Error(response.data.message || 'Failed to fetch getProfitabilityByInvoice');
            }
        } catch (error) {
            console.error('Error fetching getProfitabilityByInvoice:', error);
            if (error instanceof Error) {
                throw new Error(`Failed to fetch getProfitabilityByInvoice: ${error.message}`);
            }
            throw new Error('Failed to fetch pgetProfitabilityByInvoice');
        }
    },
    deleteDropdown: async (id: number, type: string): Promise<void> => {
        try {
            await api.put('/delete-dropdown', { id, type });
        } catch (error) {
            console.error('Error deleting dropdown:', error);
            throw new Error('Failed to delete dropdown');
        }
    },
    updateDropdown: async (id: number | string | null, data: FormData): Promise<any> => {
        try {
            const response = await api.post(`/update-dropdowns/${id ?? 0}`, data, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            console.log(response);  // Log the response data to see if it's coming through
            return response.data;
        } catch (error) {
            console.error('Error updating product:', error);
            throw new Error('Failed to update product');
        }
    },
    getManufacturerIdBySeries: async (seriesId: number): Promise<number> => {
        try {
            // Make an API call to the server to fetch the manufacturer ID for a given series ID
            const response = await api.get(`/get-manufacturer-id/${seriesId}`);

            if (response.data && response.data.manufacturer_id) {
                return response.data.manufacturer_id;
            } else {
                throw new Error(`No manufacturer ID found for series ID ${seriesId}`);
            }
        } catch (error) {
            console.error('Error fetching manufacturer ID for series:', error);
            throw new Error('Failed to fetch manufacturer ID');
        }
    },
    getTaggingDetails: async (id: number): Promise<Detail[]> => { 
        try {
            const response = await api.get<SingleProductTagResponse>(`/product-tagging-list/${id}`);
            if (response.data.success && response.data.product) {
                return response.data.product;  // ✅ now returns Detail[]
            } else {
                throw new Error(response.data.message || 'Failed to fetch product');
            }
        } catch (error) {
            console.error('Error fetching products:', error);
            if (error instanceof Error) {
                throw new Error(`Failed to fetch products: ${error.message}`);
            }
            throw new Error('Failed to fetch products');
        }
    },
    getProductTagPopup: async (page = 1, perPage = 10, search = ''): Promise<PaginatedResponse<ApiProduct>> => {
        try {
            const response = await api.get<ProductListResponse>('/product-tag-popup', {
                params: { page, per_page: perPage, search }
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
    getInventoryTracking: async (productCode: string,warehouseCode:string, language : string): Promise<any> => { 
        try {
            const response = await api.get(`/get-inventory-tracking/${productCode}/${warehouseCode}/${language}`);
            return response.data;
          
        } catch (error) {
            console.error('Error fetching list:', error);
            if (error instanceof Error) {
                throw new Error(`Failed to fetch list: ${error.message}`);
            }
            throw new Error('Failed to fetch list');
        }
    },
    getInternalTransfer: async (page = 1, perPage = 10, search = '', type : string): Promise<PaginatedResponse<ApiProduct>> => {
        try {
            const response = await api.get(`/get-internal-transfer/${type}`, {
                params: { page, per_page: perPage, search }
            });

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
    getInternalInventory: async (page = 1, perPage = 10, search = '', sortId: number[] = []): Promise<PaginatedResponse<ApiProduct>> => {
        try {
            const response = await api.get('/get-internal-inventory', {
                params: { page, per_page: perPage, search, sortId: sortId.length ? sortId.join(',') : [] }
            });

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
    deleteTransfer: async (details: any[]): Promise<void> => {
        try {
            await api.put('/delete-transfer', { details });
        } catch (error) {
            console.error('Error deleting transfer:', error);
            throw new Error('Failed to delete transfer');
        }
    },
    deleteStockTake: async (ids: number[]): Promise<void> => {
        try {
            await api.put('/delete-stock-take', { ids });
        } catch (error) {
            console.error('Error deleting stock-take:', error);
            throw new Error('Failed to delete stock-take');
        }
    },
    saveNewTransfer: async (details: any[],no:string,ext:string): Promise<void> => {
        try {
            await api.put(`/save-transfer`, { details, no : no, ext : ext });
        } catch (error) {
            console.error('Error save transfer:', error);
            throw new Error('Failed to save transfer');
        }
    },
    confirmTransfer: async (details: any[]): Promise<void> => {
        try {
            await api.put(`/confirm-transfer`, { details });
        } catch (error) {
            console.error('Error confirm transfer:', error);
            throw new Error('Failed to confirm transfer');
        }
    },
    getStockTakeList: async (page = 1, perPage = 10, search = ''): Promise<PaginatedResponse<ApiProduct>> => {
        try {
            const response = await api.get(`/get-stock-take`, {
                params: { page, per_page: perPage, search }
            });

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
    getStockInventory: async (page = 1, perPage = 10, search = '', sortId: number[] = []): Promise<PaginatedResponse<ApiProduct>> => {
        try {
            const response = await api.get('/get-stock-inventory', {
                params: { page, per_page: perPage, search, sortId: sortId.length ? sortId.join(',') : [] }
            });

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
    saveStockTake: async (details: any[],id:number): Promise<void> => {
        try {
            await api.put(`/save-stock-take`, { details, id : id });
        } catch (error) {
            console.error('Error save stock-take:', error);
            throw new Error('Failed to save stock-take');
        }
    },
    publishProductImports: async (details: any[]): Promise<any> => {
        try {
            const response = await api.put(`/publish-product-imports`, { details });
            return response.data;
        } catch (error) {
            console.error('Error save publish-product-imports:', error);
            throw new Error('Failed to save publish-product-imports');
        }
    },
};