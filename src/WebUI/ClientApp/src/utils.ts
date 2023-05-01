/**
 * this file wraps the import.meta access, to make it mockable ant the calling code testable
 */
export const getApiUrl = (): string => import.meta.env.VITE_API_URL;
