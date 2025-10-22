// src/utils/statusUtils.ts

export const statusMap: Record<string, { en: string; cn: string; color: string }> = {
  'pre-order':        { en: 'Pre-order',        cn: '预订',     color: 'bg-amber-600 bg-opacity-20 text-amber-400' },
  'coming soon':      { en: 'Coming Soon',      cn: '未出货',   color: 'bg-yellow-500 bg-opacity-20 text-yellow-300' },
  'partial received': { en: 'Partial Received', cn: '部份已到', color: 'bg-yellow-500 bg-opacity-20 text-yellow-300' },
  'in-stock':         { en: 'In-Stock',         cn: '有货',     color: 'bg-emerald-600 bg-opacity-20 text-emerald-400' },
  'sold out':         { en: 'Sold Out',         cn: '已售完',   color: 'bg-red-600 bg-opacity-20 text-red-400' },
  'on hold':          { en: 'On Hold',          cn: '已售完',   color: 'bg-gray-500 bg-opacity-20 text-gray-300' },
  'no order':         { en: 'No Order',         cn: '无订单',   color: 'bg-cyan-600 bg-opacity-20 text-cyan-300' },
  'scheduled':        { en: 'Scheduled',        cn: '准备中',   color: 'bg-cyan-600 bg-opacity-20 text-cyan-300' },
};

export const productStatusLocalized = (
  status?: string,
  lang: 'en' | 'cn' = 'en'
): string => {
  const key = status?.toLowerCase() ?? '';
  return statusMap[key]?.[lang] || status || '-';
};

export const getStatusColor = (status?: string): string => {
  const key = status?.toLowerCase() ?? '';
  return statusMap[key]?.color || '';
};
