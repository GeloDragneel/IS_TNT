// utils/fetchWithCache.ts
export const fetchWithCache = async <T>(cacheKey: string,fetchFn: () => Promise<T>): Promise<T | null> => {
  try {
    const cachedRaw = localStorage.getItem(cacheKey);
    if (cachedRaw) {
      return JSON.parse(cachedRaw);
    }

    const data = await fetchFn();

    if (Array.isArray(data) || typeof data === 'object') {
      localStorage.setItem(cacheKey, JSON.stringify(data));
    }

    return data;
  } catch (error) {
    console.error(`Failed to fetch or cache "${cacheKey}":`, error);
    return null;
  }
};
