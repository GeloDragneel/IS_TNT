
import api from '../services/api';

export interface DropdownData {
    value: number | string;
    value2: number | string;
    en: string;
    cn: string;
    code?: string;
}
export interface OptionType {
    value: string;
    value2: string;
    label: string;
    en: string;
    cn: string;
    code?: string;
}

export interface CustomOptionProps {
    data: any;
    innerRef: React.Ref<any>;
    innerProps: any;
    type: 'ProductType' | 'Brand' | 'Manufacturer' | 'Series' | 'Genre';
}
export interface FormDataDropdown {
    value: number | string | null;
    value2: number | string | null;
    en: string;
    cn: string;
    type: string;
}
export interface ImageItem {
    file?: File;
    type: 'thumbnail' | 'display' | 'banner' | 'slide';
    id: string;
    index?: number;
    isNew: boolean;
    isDeleted: boolean;
    apiId?: number;
    path?: string;
    rank: number;
}

export const getImageUrl = (image: ImageItem | null): string => {
    if (!image) {
        return 'https://tnt2.simplify.cool/images/no-image-min.jpg';
    }
    if (image.isNew && image.file) {
        return URL.createObjectURL(image.file);
    } else if (image.path) {
        // The backend provides a relative URL like "/storage/products/..."
        // We need to prepend the backend's base URL.
        return import.meta.env.VITE_BASE_URL + image.path;
    }
    return 'https://tnt2.simplify.cool/images/no-image-min.jpg';
};

export const selectStyles = {
    control: (provided: any) => ({
        ...provided,
        backgroundColor: '#2b2e31',
        borderColor: '#ffffff1a',
        color: 'white',
        minHeight: '38px',
        '&:hover': {
            borderColor: '#06B6D4'
        }
    }),
    menu: (provided: any) => ({
        ...provided,
        backgroundColor: '#2b2e31',
        border: '1px solid #ffffff1a'
    }),
    option: (provided: any, state: any) => ({
        ...provided,
        backgroundColor: state.isFocused ? '#06B6D4' : '#2b2e31',
        color: 'white',
        '&:hover': {
            backgroundColor: '#06B6D4'
        }
    }),
    multiValue: (provided: any) => ({
        ...provided,
        backgroundColor: '#3B82F6'
    }),
    multiValueLabel: (provided: any) => ({
        ...provided,
        color: 'white'
    }),
    multiValueRemove: (provided: any) => ({
        ...provided,
        color: 'white',
        '&:hover': {
            backgroundColor: '#EF4444',
            color: 'white'
        }
    }),
    singleValue: (provided: any) => ({
        ...provided,
        color: 'white'
    }),
    input: (provided: any) => ({
        ...provided,
        color: 'white'
    }),
    placeholder: (provided: any) => ({
        ...provided,
        color: '#9CA3AF'
    })
};

export const parseDate = (dateString: string | Date | null | undefined): Date | null => {
    if (!dateString) return null;
    if (dateString instanceof Date) return dateString;
    
    try {
        const parsed = new Date(dateString);
        return isNaN(parsed.getTime()) ? null : parsed;
    } catch {
        return null;
    }
};

export const baseCurrency = () => {
    return 'RMB'
};

// Handle Status Specification
export const statusMap: Record<string, { en: string; cn: string; color: string }> = {
    1: { en: 'Active', cn: '有货', color: 'bg-emerald-600 bg-opacity-20 text-emerald-400' },
    0: { en: 'In-Active', cn: '已售完', color: 'bg-red-600 bg-opacity-20 text-red-400' },
};
export const productStatusLocalized = (status: number, lang: 'en' | 'cn' = 'en') => {
    return statusMap[status][lang] || status || '-';
};

export const getStatusColor = (status: number) => {
    return statusMap[status].color || 'bg-cyan-600 bg-opacity-20 text-cyan-400';
};
export const getProfitColor = (profit: number) => {
    if (profit > 0) return '#009688';
    if (profit < 0) return 'red';
    return 'white';
};

// Helper functions for data conversion
export const convertToSingleOption = (id: number | number[] | undefined, options: OptionType[]): OptionType | null => {
    if (!id) return null;
    const singleId = Array.isArray(id) ? id[0] : id;
    return options.find(opt => opt.value === singleId.toString()) || null;
};
export const convertToMultipleOptions = (items: any[] | undefined, options: OptionType[]): OptionType[] => {
    if (!items || !Array.isArray(items)) return [];
    // Handle both array of objects with value property and array of numbers
    const ids = items.map(item => {
        if (typeof item === 'object' && item.value !== undefined) {
            return item.value;
        }
        return item;
    });
    return options.filter(opt => ids.includes(parseInt(opt.value)));
};
export const formatMoney = (amount: number | undefined) => {
    if (amount === undefined || amount === null) return '-';
    return amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

export const formatExrate = (amount: number | undefined) => {
    if (amount === undefined || amount === null) return '-';
    return amount.toLocaleString(undefined, { minimumFractionDigits: 4, maximumFractionDigits: 4 });
};

export const formatDateTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'long',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true, // Enables AM/PM
    });
};
export const formatDate = (dateString: string | null | undefined, lang: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);

    if (lang === 'cn') {
        const month = date.toLocaleString('en-US', { month: 'short' });
        const day = date.getDate();
        const year = date.getFullYear();
        const monthMap: { [key: string]: string } = {
            Jan: '1月', Feb: '2月', Mar: '3月', Apr: '4月', May: '5月', Jun: '6月',
            Jul: '7月', Aug: '8月', Sep: '9月', Oct: '10月', Nov: '11月', Dec: '12月'
        };
        return `${monthMap[month]}${day}日${year}`;
    }

    const month = date.toLocaleString('en-US', { month: 'short' });
    const day = date.getDate();
    const year = date.getFullYear();
    return `${month} ${day} ${year}`;
};


export function isValidOption(value: any): value is OptionType {
    // Check that the value is an object with the expected properties of OptionType
    return value && typeof value === 'object' && 'value' in value && 'label' in value;
}
export function isValidOptionMult(value: any): value is OptionType {
  // Check if the object contains 'value' and 'label' (or any other fields you expect)
  return value && typeof value === 'object' && 'value' in value && 'label' in value;
}
export function getProfitPercentage(totalProfit : number, totalPurchase : number) {
    const TotalProfit = totalProfit;
    const TotalPurchase = totalPurchase;

    if (isNaN(TotalProfit) || isNaN(TotalPurchase) || TotalPurchase === 0) {
        return '0%'; // To avoid division by zero or invalid input
    }
    const returnPrcnt = Math.floor((TotalProfit / TotalPurchase) * 100) + '%';
    return returnPrcnt;
}

export async function fetchExchangeRate(currency: string, baseCurrency: string): Promise<number> {
    if (!currency || currency === baseCurrency) return 1;
    try {
        const response = await api.get(`/get-current-exrate`, {
            params: { currency, basecurrency: baseCurrency },
        });
        return response.data?.ex_rate ?? 0;
    } catch (error) {
        console.error('Error fetching exchange rate:', error);
        return 0;
    }
}
export async function fetchOperator(conversionKey: string): Promise<"Divide" | "Multiply"> {
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
}