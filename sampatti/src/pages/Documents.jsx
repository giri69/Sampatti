// src/pages/Documents.jsx
import { useState, useEffect, useRef } from 'react';
import { 
  FileText, Upload, Search, Filter, Plus, Eye, Edit, Trash2, 
  ChevronDown, ChevronUp, Tag, Calendar, Lock, Unlock
} from 'lucide-react';
import { 
  getDocuments, uploadDocument, deleteDocument, 
  updateDocument, updateDocumentNomineeAccess 
} from '../utils/api';

// Import common components
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import LoadingState from '../components/common/LoadingState';
import ErrorState from '../components/common/ErrorState';
import Input from '../components/common/Input';

// Document Type Badge component
const DocumentTypeBadge = ({ type }) => {
  const colors = {
    'Certificate': 'bg-blue-500/20 text-blue-400',
    'Statement': 'bg-green-500/20 text-green-400',
    'KYC': 'bg-purple-500/20 text-purple-400',
    'Will': 'bg-red-500/20 text-red-400',
    'Insurance': 'bg-yellow-500/20 text-yellow-400',
    'Agreement': 'bg-indigo-500/20 text-indigo-400',
    'Receipt': 'bg-teal-500/20 text-teal-400',
    'Other': 'bg-gray-500/20 text-gray-400'
  };

  return (
    <span className={`px-2 py-1 text-xs rounded-full ${colors[type] || colors.Other}`}>
      {type}
    </span>
  );
};

// Empty State component when no documents
const EmptyState = ({ onUpload }) => (
  <Card className="p-8 text-center">
    <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
      <FileText size={28} className="text-blue-400" />
    </div>
    <h2 className="text-2xl font-bold text-white mb-3">No Documents Found</h2>
    <p className="text-gray-400 mb-6 max-w-md mx-auto">
      You haven't uploaded any documents yet. Upload important investment documents to keep them secure and accessible.
    </p>
    <Button
      icon={<Upload size={18} />}
      onClick={onUpload}
    >
      Upload Your First Document
    </Button>
  </Card>
);

// Document Upload Modal
const UploadModal = ({ isOpen, onClose, onUpload }) => {
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState('');
  const [documentType, setDocumentType] = useState('Statement');
  const [description, setDescription] = useState('');
  const [assetId, setAssetId] = useState('');
  const [isEncrypted, setIsEncrypted] = useState(true);
  const [accessibleToNominees, setAccessibleToNominees] = useState(false);
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);
  
  // Document types from backend
  const documentTypes = [
    'Certificate', 'Statement', 'KYC', 'Will', 'Insurance',
    'Agreement', 'Receipt', 'Other'
  ];
  
  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setFile(null);
      setTitle('');
      setDocumentType('Statement');
      setDescription('');
      setAssetId('');
      setIsEncrypted(true);
      setAccessibleToNominees(false);
      setTags([]);
      setTagInput('');
      setError('');
    }
  }, [isOpen]);
  
  // Handle file selection
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      // Auto-fill title with filename (without extension)
      const filename = selectedFile.name.replace(/\.[^/.]+$/, "");
      if (!title) setTitle(filename);
    }
  };
  
  // Handle tag input
  const handleTagKeyDown = (e) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      addTag();
    }
  };
  
  // Add a tag
  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };
  
  // Remove a tag
  const removeTag = (tagToRemove) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!file) {
      setError('Please select a file to upload');
      return;
    }
    
    if (!title.trim()) {
      setError('Please enter a title for the document');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', title);
      formData.append('document_type', documentType);
      formData.append('description', description);
      
      // Optional fields
      if (assetId) formData.append('asset_id', assetId);
      formData.append('is_encrypted', isEncrypted);
      formData.append('accessible_to_nominees', accessibleToNominees);
      
      // Add tags if any
      if (tags.length > 0) {
        formData.append('tags', tags.join(','));
      }
      
      // Upload document
      await onUpload(formData);
      
      // Close modal on success
      onClose();
    } catch (err) {
      console.error('Document upload error:', err);
      setError(err.message || 'Failed to upload document. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-lg w-full max-w-xl border border-gray-700 max-h-[90vh] overflow-auto">
        <div className="p-4 border-b border-gray-700 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-white">Upload Document</h3>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white"
            disabled={isLoading}
          >
            &times;
          </button>
        </div>
        
        {error && (
          <div className="px-6 pt-5">
            <ErrorState message={error} />
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* File Upload */}
          <div className="mb-4">
            <div 
              className="border-2 border-dashed border-gray-600 rounded-lg p-6 text-center cursor-pointer hover:border-blue-500 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              {file ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-center">
                    <FileText size={40} className="text-blue-400" />
                  </div>
                  <div className="text-white font-medium">{file.name}</div>
                  <div className="text-gray-400 text-sm">
                    {file.type} - {(file.size / 1024 / 1024).toFixed(2)} MB
                  </div>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={(e) => {
                      e.stopPropagation();
                      setFile(null);
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                  >
                    Change File
                  </Button>
                </div>
              ) : (
                <>
                  <Upload size={40} className="text-gray-400 mx-auto mb-2" />
                  <p className="text-white mb-1">Drag and drop or click to upload</p>
                  <p className="text-gray-500 text-sm">PDF, Word, Excel, and image files supported (Max: 10MB)</p>
                </>
              )}
              <input 
                type="file" 
                className="hidden" 
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                disabled={isLoading}
              />
            </div>
          </div>
          
          {/* Document Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Document Title"
              name="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter document title"
              required
              disabled={isLoading}
            />
            
            <div>
              <label className="block text-sm font-medium mb-2 text-white">
                Document Type <span className="text-red-400">*</span>
              </label>
              <select
                value={documentType}
                onChange={(e) => setDocumentType(e.target.value)}
                className="block w-full px-3 py-3 border border-white/10 bg-white/5 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-white"
                disabled={isLoading}
                required
              >
                {documentTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
          </div>
          
          <Input
            label="Description"
            name="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add a brief description of this document"
            disabled={isLoading}
          />
          
          {/* Tags */}
          <div>
            <label className="block text-sm font-medium mb-2 text-white">
              Tags
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {tags.map(tag => (
                <div 
                  key={tag} 
                  className="flex items-center bg-blue-500/20 text-blue-400 px-3 py-1 rounded-full text-sm"
                >
                  {tag}
                  <button 
                    type="button" 
                    onClick={() => removeTag(tag)}
                    className="ml-2 rounded-full hover:bg-blue-500/40 p-1"
                    disabled={isLoading}
                  >
                    &times;
                  </button>
                </div>
              ))}
            </div>
            <div className="flex">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleTagKeyDown}
                className="flex-grow px-3 py-2 border border-white/10 bg-white/5 rounded-l-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-white placeholder-gray-400"
                placeholder="Add tags (e.g., Tax, Important)"
                disabled={isLoading}
              />
              <Button
                type="button"
                onClick={addTag}
                className="rounded-l-none"
                disabled={isLoading || !tagInput.trim()}
              >
                <Plus size={18} />
              </Button>
            </div>
          </div>
          
          {/* Security Settings */}
          <div className="space-y-3 mt-4 pt-3 border-t border-gray-700">
            <h4 className="text-white font-medium">Security & Access Settings</h4>
            
            <div className="flex items-center justify-between">
              <div>
                <label htmlFor="isEncrypted" className="text-gray-300">
                  Encrypt Document
                </label>
                <p className="text-gray-500 text-xs">
                  Enable end-to-end encryption for this document
                </p>
              </div>
              <label className="inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  id="isEncrypted"
                  checked={isEncrypted} 
                  onChange={() => setIsEncrypted(!isEncrypted)}
                  className="sr-only peer"
                  disabled={isLoading}
                />
                <div className="relative w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-400 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <label htmlFor="accessibleToNominees" className="text-gray-300">
                  Nominee Access
                </label>
                <p className="text-gray-500 text-xs">
                  Allow nominees to access this document
                </p>
              </div>
              <label className="inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  id="accessibleToNominees"
                  checked={accessibleToNominees} 
                  onChange={() => setAccessibleToNominees(!accessibleToNominees)}
                  className="sr-only peer"
                  disabled={isLoading}
                />
                <div className="relative w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-400 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
          
          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-700 mt-5">
            <Button
              variant="secondary"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              isLoading={isLoading}
            >
              Upload Document
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Document Detail Modal
const DocumentDetailModal = ({ document, isOpen, onClose, onDelete, onEdit }) => {
  if (!isOpen || !document) return null;
  
  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    else return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };
  
  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };
  
  return (
    <div className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-lg w-full max-w-xl border border-gray-700 max-h-[90vh] overflow-auto">
        <div className="p-4 border-b border-gray-700 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-white flex items-center">
            <FileText size={20} className="mr-2 text-blue-400" />
            Document Details
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            &times;
          </button>
        </div>
        
        <div className="p-6">
          <div className="mb-6 flex items-center justify-between">
            <DocumentTypeBadge type={document.document_type} />
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="secondary"
                icon={<Edit size={16} />}
                onClick={() => {
                  onClose();
                  onEdit(document);
                }}
              >
                Edit
              </Button>
              <Button
                size="sm"
                variant="danger"
                icon={<Trash2 size={16} />}
                onClick={() => {
                  if (window.confirm('Are you sure you want to delete this document? This action cannot be undone.')) {
                    onDelete(document.id);
                    onClose();
                  }
                }}
              >
                Delete
              </Button>
            </div>
          </div>
          
          <h2 className="text-xl font-bold text-white mb-4">{document.title}</h2>
          
          {document.description && (
            <p className="text-gray-300 mb-6">{document.description}</p>
          )}
          
          <div className="space-y-4">
            <div className="p-4 bg-gray-700/30 rounded-lg">
              <div className="flex items-center mb-2">
                <FileText size={18} className="text-blue-400 mr-2" />
                <h4 className="text-white font-medium">File Information</h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2 mt-3">
                <div>
                  <p className="text-gray-400 text-sm">Filename</p>
                  <p className="text-white">{document.filename}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">File Size</p>
                  <p className="text-white">{formatFileSize(document.file_size)}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Upload Date</p>
                  <p className="text-white">{formatDate(document.upload_date)}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">File Type</p>
                  <p className="text-white">{document.mime_type}</p>
                </div>
              </div>
            </div>
            
            <div className="p-4 bg-gray-700/30 rounded-lg">
              <div className="flex items-center mb-2">
                {document.is_encrypted ? (
                  <Lock size={18} className="text-green-400 mr-2" />
                ) : (
                  <Unlock size={18} className="text-yellow-400 mr-2" />
                )}
                <h4 className="text-white font-medium">Security & Access</h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2 mt-3">
                <div>
                  <p className="text-gray-400 text-sm">Encryption</p>
                  <p className={document.is_encrypted ? "text-green-400" : "text-yellow-400"}>
                    {document.is_encrypted ? "Encrypted" : "Not Encrypted"}
                  </p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Nominee Access</p>
                  <p className={document.accessible_to_nominees ? "text-green-400" : "text-gray-400"}>
                    {document.accessible_to_nominees ? "Allowed" : "Not Allowed"}
                  </p>
                </div>
              </div>
            </div>
            
            {document.tags && document.tags.length > 0 && (
              <div className="p-4 bg-gray-700/30 rounded-lg">
                <div className="flex items-center mb-2">
                  <Tag size={18} className="text-blue-400 mr-2" />
                  <h4 className="text-white font-medium">Tags</h4>
                </div>
                <div className="flex flex-wrap gap-2 mt-3">
                  {document.tags.map(tag => (
                    <span key={tag} className="bg-blue-500/20 text-blue-400 px-3 py-1 rounded-full text-sm">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          <div className="mt-6 pt-4 border-t border-gray-700 flex justify-between">
            <Button
              as="a"
              href={`/api/v1/documents/${document.id}/download`}
              target="_blank"
              rel="noopener noreferrer"
              variant="primary"
              icon={<Eye size={18} />}
            >
              View Document
            </Button>
            <Button
              variant="secondary"
              onClick={onClose}
            >
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Main Documents component
const Documents = () => {
  const [documents, setDocuments] = useState([]);
  const [filteredDocuments, setFilteredDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('All');
  const [showFilters, setShowFilters] = useState(false);
  const [sortConfig, setSortConfig] = useState({ key: 'upload_date', direction: 'desc' });
  
  // Modals state
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  
  // Load documents on component mount
  useEffect(() => {
    const loadDocuments = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const data = await getDocuments();
        setDocuments(data);
        setFilteredDocuments(data);
      } catch (err) {
        console.error('Error loading documents:', err);
        setError('Failed to load documents. Please try again.');
        setDocuments([]);
        setFilteredDocuments([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadDocuments();
  }, []);
  
  // Filter and sort documents when filters change
  useEffect(() => {
    let result = [...documents];
    
    // Apply type filter
    if (filterType !== 'All') {
      result = result.filter(doc => doc.document_type === filterType);
    }
    
    // Apply search filter
    if (searchTerm) {
      const lowercasedTerm = searchTerm.toLowerCase();
      result = result.filter(doc => 
        doc.title.toLowerCase().includes(lowercasedTerm) ||
        doc.filename.toLowerCase().includes(lowercasedTerm) ||
        doc.description?.toLowerCase().includes(lowercasedTerm) ||
        doc.tags?.some(tag => tag.toLowerCase().includes(lowercasedTerm))
      );
    }
    
    // Apply sorting
    result = [...result].sort((a, b) => {
      let aValue = a[sortConfig.key];
      let bValue = b[sortConfig.key];
      
      // Handle date fields specially
      if (sortConfig.key === 'upload_date') {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      }
      
      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
    
    setFilteredDocuments(result);
  }, [documents, searchTerm, filterType, sortConfig]);
  
  // Extract unique document types
  const documentTypes = ['All', ...new Set(documents.map(doc => doc.document_type))];
  
  // Request sort
  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };
  
  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return '';
    
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  
  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    else return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };
  
  // Handle document upload
  const handleUploadDocument = async (formData) => {
    try {
      const newDocument = await uploadDocument(formData);
      setDocuments(prevDocuments => [newDocument, ...prevDocuments]);
      return newDocument;
    } catch (error) {
      console.error('Error uploading document:', error);
      throw error;
    }
  };
  
  // Handle document deletion
  const handleDeleteDocument = async (documentId) => {
    try {
      await deleteDocument(documentId);
      setDocuments(prevDocuments => 
        prevDocuments.filter(doc => doc.id !== documentId)
      );
    } catch (error) {
      console.error('Error deleting document:', error);
      setError('Failed to delete document. Please try again.');
    }
  };
  
  // Handle view document details
  const handleViewDocument = (document) => {
    setSelectedDocument(document);
    setDetailModalOpen(true);
  };
  
  // Handle edit document
  const handleEditDocument = (document) => {
    // In a real app, this would open an edit modal
    alert('Edit functionality would go here');
  };
  
  if (isLoading) {
    return <LoadingState message="Loading documents..." />;
  }
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-1 text-white">Documents</h1>
          <p className="text-gray-400">Manage and organize all your investment-related documents</p>
        </div>
        
        <Button
          icon={<Upload size={18} />}
          onClick={() => setUploadModalOpen(true)}
          className="mt-4 md:mt-0"
        >
          Upload Document
        </Button>
      </div>
      
      {/* Error message if any */}
      {error && <ErrorState message={error} onRetry={() => window.location.reload()} />}
      
      {/* Filters and search */}
      <Card>
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-grow">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={18} className="text-gray-500" />
            </div>
            <input
              type="text"
              placeholder="Search documents..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
            />
          </div>
          
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center bg-gray-700 hover:bg-gray-600 text-white py-2 px-4 rounded-lg transition-colors"
          >
            <Filter size={18} className="mr-2" />
            Filters
            {showFilters ? <ChevronUp size={16} className="ml-2" /> : <ChevronDown size={16} className="ml-2" />}
          </button>
        </div>
        
        {/* Expanded Filters */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-700">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Document Type</label>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="w-full rounded-lg bg-gray-700 border border-gray-600 px-3 py-2 text-white"
                >
                  {documentTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm text-gray-400 mb-1">Sort By</label>
                <select
                  value={`${sortConfig.key}-${sortConfig.direction}`}
                  onChange={(e) => {
                    const [key, direction] = e.target.value.split('-');
                    setSortConfig({ key, direction });
                  }}
                  className="w-full rounded-lg bg-gray-700 border border-gray-600 px-3 py-2 text-white"
                >
                  <option value="upload_date-desc">Date (Newest First)</option>
                  <option value="upload_date-asc">Date (Oldest First)</option>
                  <option value="title-asc">Title (A-Z)</option>
                  <option value="title-desc">Title (Z-A)</option>
                  <option value="file_size-desc">Size (Largest First)</option>
                  <option value="file_size-asc">Size (Smallest First)</option>
                </select>
              </div>
              
              <div className="flex items-end">
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setFilterType('All');
                    setSortConfig({ key: 'upload_date', direction: 'desc' });
                  }}
                  className="px-4 py-2 text-blue-400 hover:text-blue-300"
                >
                  Reset Filters
                </button>
              </div>
            </div>
          </div>
        )}
      </Card>
      
      {/* Main Content */}
      {filteredDocuments.length === 0 ? (
        documents.length === 0 ? (
          <EmptyState onUpload={() => setUploadModalOpen(true)} />
        ) : (
          <Card className="p-8 text-center">
            <div className="w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-3">
              <Search size={24} className="text-gray-500" />
            </div>
            <h3 className="text-xl font-medium text-white mb-2">No matching documents</h3>
            <p className="text-gray-400 mb-6">
              Try changing your search or filter criteria
            </p>
            <Button
              variant="secondary"
              onClick={() => {
                setSearchTerm('');
                setFilterType('All');
              }}
            >
              Reset Filters
            </Button>
          </Card>
        )
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDocuments.map(document => (
            <Card 
              key={document.id}
              className="hover:border-blue-500/50 transition-colors cursor-pointer"
              onClick={() => handleViewDocument(document)}
            >
              <div className="flex items-start justify-between mb-3">
                <DocumentTypeBadge type={document.document_type} />
                
                <div className="flex items-center">
                  {document.is_encrypted && (
                    <Lock size={16} className="text-green-400 mr-1" title="Encrypted" />
                  )}
                  {document.accessible_to_nominees && (
                    <Users size={16} className="text-blue-400" title="Nominee Access Allowed" />
                  )}
                </div>
              </div>
              
              <h3 className="text-lg font-semibold text-white mb-2 line-clamp-1">{document.title}</h3>
              
              {document.description && (
                <p className="text-gray-400 text-sm mb-3 line-clamp-2">{document.description}</p>
              )}
              
              <div className="flex items-center justify-between text-sm text-gray-500 mt-4">
                <div className="flex items-center">
                  <Calendar size={14} className="mr-1" />
                  {formatDate(document.upload_date)}
                </div>
                <div>{formatFileSize(document.file_size)}</div>
              </div>
              
              {document.tags && document.tags.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-700 flex flex-wrap gap-1">
                  {document.tags.slice(0, 3).map(tag => (
                    <span key={tag} className="text-xs bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded-full">
                      {tag}
                    </span>
                  ))}
                  {document.tags.length > 3 && (
                    <span className="text-xs bg-gray-600 text-gray-300 px-2 py-0.5 rounded-full">
                      +{document.tags.length - 3}
                    </span>
                  )}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
      
      {/* Upload Modal */}
      <UploadModal 
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        onUpload={handleUploadDocument}
      />
      
      {/* Document Detail Modal */}
      <DocumentDetailModal
        document={selectedDocument}
        isOpen={detailModalOpen}
        onClose={() => {
          setDetailModalOpen(false);
          setSelectedDocument(null);
        }}
        onDelete={handleDeleteDocument}
        onEdit={handleEditDocument}
      />
    </div>
  );
};

export default Documents;