/**
 * Authentication utility functions for API requests
 */

/**
 * Get authentication headers for API requests
 * @returns Object containing Content-Type and Authorization headers
 */
export const getAuthHeaders = () => {
  const token = localStorage.getItem('authToken');
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
};