// src/utils/emergencyUtils.js

/**
 * Formats currency in Indian Rupee format
 * @param {number} amount - The amount to format
 * @returns {string} - Formatted currency string
 */
export const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount || 0);
  };
  
  /**
   * Formats date in localized format
   * @param {string} dateString - ISO date string
   * @returns {string} - Formatted date
   */
  export const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (e) {
      return 'N/A';
    }
  };
  
  /**
   * Gets appropriate document icon based on MIME type
   * @param {string} mimeType - The MIME type
   * @returns {string} - Emoji icon
   */
  export const getDocumentIcon = (mimeType) => {
    if (!mimeType) return '📄';
    if (mimeType.includes('pdf')) return '📄';
    if (mimeType.includes('image')) return '🖼️';
    if (mimeType.includes('text')) return '📝';
    if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return '📊';
    return '📎';
  };
  
  /**
   * Formats file size in human-readable format
   * @param {number} bytes - Size in bytes
   * @returns {string} - Formatted size
   */
  export const formatFileSize = (bytes) => {
    if (!bytes) return '';
    if (bytes < 1024) return bytes + ' bytes';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };
  
  /**
   * Gets color classes based on nominee access level
   * @param {string} accessLevel - The access level (Full, Limited, DocumentsOnly)
   * @returns {string} - CSS classes
   */
  export const getAccessLevelClasses = (accessLevel) => {
    switch (accessLevel) {
      case 'Full':
        return 'bg-green-500/20 text-green-400';
      case 'Limited':
        return 'bg-blue-500/20 text-blue-400';
      case 'DocumentsOnly':
        return 'bg-yellow-500/20 text-yellow-400';
      default:
        return 'bg-gray-500/20 text-gray-400';
    }
  };
  
  /**
   * Gets human-readable description of nominee access level
   * @param {string} accessLevel - The access level
   * @returns {string} - Description
   */
  export const getAccessLevelDescription = (accessLevel) => {
    switch (accessLevel) {
      case 'Full':
        return 'Full access to all assets and documents';
      case 'Limited':
        return 'Limited access to basic investment details and documents';
      case 'DocumentsOnly':
        return 'Access to shared documents only';
      default:
        return 'Unknown access level';
    }
  };
  
  /**
   * Checks if emergency access is active
   * @returns {boolean} - True if emergency access token exists
   */
  export const hasEmergencyAccess = () => {
    return !!localStorage.getItem('emergencyAccessToken');
  };
  
  /**
   * Clears emergency access session
   */
  export const clearEmergencyAccess = () => {
    localStorage.removeItem('emergencyAccessToken');
  };
  
  export default {
    formatCurrency,
    formatDate,
    getDocumentIcon,
    formatFileSize,
    getAccessLevelClasses,
    getAccessLevelDescription,
    hasEmergencyAccess,
    clearEmergencyAccess
  };