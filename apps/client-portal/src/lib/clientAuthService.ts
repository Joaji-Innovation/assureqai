/**
 * Client-side authentication service
 * For storing and managing auth tokens on the client
 */

interface User {
  _id?: string;
  id?: string;
  username: string;
  fullName?: string;
  email?: string;
  role: string;
}

/**
 * Store authentication token and user data in localStorage
 * @param token - JWT token from login response
 * @param user - User object from login response
 */
export const clientStoreToken = (token: string, user?: User) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('authToken', token);
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    }
  }
};

/**
 * Get the stored authentication token
 * @returns The JWT token or null if not found
 */
export const getToken = (): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('authToken');
  }
  return null;
};

/**
 * Get the stored user data
 * @returns The user object or null if not found
 */
export const getUser = (): User | null => {
  if (typeof window !== 'undefined') {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch {
        return null;
      }
    }
  }
  return null;
};

/**
 * Clear authentication data from localStorage
 */
export const clearToken = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
  }
};

/**
 * Check if user is authenticated
 * @returns true if a token exists
 */
export const isAuthenticated = (): boolean => {
  return !!getToken();
};
