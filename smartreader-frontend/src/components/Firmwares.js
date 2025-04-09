import React, { useEffect, useState } from 'react';
import { firmwareService } from '../services/firmware-api';
import { deviceService } from '../services/api';

function Firmwares() {
  const [firmwares, setFirmwares] = useState([]);
  const [categories, setCategories] = useState([]);
  const [devices, setDevices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedFirmware, setSelectedFirmware] = useState(null);
  const [selectedDevices, setSelectedDevices] = useState([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isCategoryFormOpen, setIsCategoryFormOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  
  // Form states
  const [firmwareForm, setFirmwareForm] = useState({
    fileName: '',
    version: '',
    description: '',
    compatibleDeviceTypes: [],
    categories: [],
    file: null
  });
  
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    description: ''
  });
  
  const [upgradeOptions, setUpgradeOptions] = useState({
    timeoutInMinutes: 4,
    maxRetries: 3
  });

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [firmwaresData, categoriesData, devicesData] = await Promise.all([
          firmwareService.getFirmwares(),
          firmwareService.getCategories(),
          deviceService.getDevices()
        ]);
        
        setFirmwares(firmwaresData);
        setCategories(categoriesData);
        setDevices(devicesData);
        setError(null);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to fetch data. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const refreshData = async () => {
    setIsLoading(true);
    try {
      const [firmwaresData, categoriesData] = await Promise.all([
        firmwareService.getFirmwares(),
        firmwareService.getCategories()
      ]);
      
      setFirmwares(firmwaresData);
      setCategories(categoriesData);
      setError(null);
    } catch (err) {
      console.error('Error refreshing data:', err);
      setError('Failed to refresh data. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  // Form handlers
  const handleFirmwareFormChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'file') {
      setFirmwareForm({
        ...firmwareForm,
        file: e.target.files[0]
      });
    } else if (name === 'compatibleDeviceTypes' || name === 'categories') {
      // Handle multi-select fields
      const options = Array.from(e.target.selectedOptions).map(option => option.value);
      setFirmwareForm({
        ...firmwareForm,
        [name]: options
      });
    } else {
      setFirmwareForm({
        ...firmwareForm,
        [name]: value
      });
    }
  };

  const handleCategoryFormChange = (e) => {
    const { name, value } = e.target;
    setCategoryForm({
      ...categoryForm,
      [name]: value
    });
  };

  // Submit handlers
  const handleSubmitFirmware = async (e) => {
    e.preventDefault();
    
    if (!firmwareForm.file) {
      alert('Please select a firmware file to upload');
      return;
    }
    
    setIsLoading(true);
    
    try {
      const formData = new FormData();
      formData.append('file', firmwareForm.file);
      formData.append('fileName', firmwareForm.fileName);
      formData.append('version', firmwareForm.version);
      formData.append('description', firmwareForm.description || '');
      
      // Convert arrays to JSON strings for proper transmission
      formData.append('compatibleDeviceTypes', JSON.stringify(firmwareForm.compatibleDeviceTypes));
      formData.append('categories', JSON.stringify(firmwareForm.categories));
      
      await firmwareService.createFirmware(formData);
      
      // Reset form and refresh data
      setFirmwareForm({
        fileName: '',
        version: '',
        description: '',
        compatibleDeviceTypes: [],
        categories: [],
        file: null
      });
      
      setIsFormOpen(false);
      await refreshData();
    } catch (err) {
      console.error('Error creating firmware:', err);
      setError('Failed to create firmware. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitCategory = async (e) => {
    e.preventDefault();
    
    if (!categoryForm.name) {
      alert('Please enter a category name');
      return;
    }
    
    setIsLoading(true);
    
    try {
      await firmwareService.createCategory(categoryForm);
      
      // Reset form and refresh data
      setCategoryForm({
        name: '',
        description: ''
      });
      
      setIsCategoryFormOpen(false);
      await refreshData();
    } catch (err) {
      console.error('Error creating category:', err);
      setError('Failed to create category. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Delete handlers
  const handleDeleteFirmware = async (id) => {
    if (!window.confirm('Are you sure you want to delete this firmware?')) {
      return;
    }
    
    setIsLoading(true);
    
    try {
      await firmwareService.deleteFirmware(id);
      await refreshData();
    } catch (err) {
      console.error('Error deleting firmware:', err);
      setError('Failed to delete firmware. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteCategory = async (id) => {
    if (!window.confirm('Are you sure you want to delete this category?')) {
      return;
    }
    
    setIsLoading(true);
    
    try {
      await firmwareService.deleteCategory(id);
      await refreshData();
    } catch (err) {
      console.error('Error deleting category:', err);
      setError('Failed to delete category. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Download handler
  const handleDownloadFirmware = (id) => {
    firmwareService.downloadFirmware(id);
  };

  // Device selection handler
  const handleDeviceSelection = (deviceId) => {
    setSelectedDevices(prev => {
      if (prev.includes(deviceId)) {
        return prev.filter(id => id !== deviceId);
      } else {
        return [...prev, deviceId];
      }
    });
  };

  // Assign firmware to devices
  const handleAssignFirmware = async () => {
    if (!selectedFirmware || selectedDevices.length === 0) {
      alert('Please select a firmware and at least one device');
      return;
    }
    
    setIsLoading(true);
    
    try {
      const result = await firmwareService.assignFirmwareToDevices(
        selectedFirmware._id, 
        selectedDevices
      );
      
      alert(`Successfully assigned firmware to ${result.updatedDevices} devices`);
      setIsAssignModalOpen(false);
      setSelectedDevices([]);
    } catch (err) {
      console.error('Error assigning firmware:', err);
      setError('Failed to assign firmware. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Send upgrade command to devices
  const handleUpgradeDevices = async () => {
    if (!selectedFirmware || selectedDevices.length === 0) {
      alert('Please select a firmware and at least one device');
      return;
    }
    
    setIsLoading(true);
    
    try {
      const result = await firmwareService.sendUpgradeCommand(
        selectedFirmware._id,
        selectedDevices,
        upgradeOptions
      );
      
      const successCount = result.results.filter(r => r.status === 'command_sent').length;
      alert(`Successfully sent upgrade command to ${successCount} devices`);
      setIsUpgradeModalOpen(false);
      setSelectedDevices([]);
    } catch (err) {
      console.error('Error sending upgrade command:', err);
      setError('Failed to send upgrade command. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Helper to find category name by ID
  const getCategoryNames = (categoryIds) => {
    if (!categoryIds || !Array.isArray(categoryIds)) return 'None';
    
    return categoryIds.map(catId => {
      const category = categories.find(c => c._id === catId);
      return category ? category.name : 'Unknown';
    }).join(', ') || 'None';
  };

  // Format date helper
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Firmware Management</h1>
          <p className="mt-2 text-sm text-gray-700">
            Manage firmware versions and assign them to devices
          </p>
        </div>
        <div className="mt-4 sm:mt-0 space-x-3">
          <button 
            onClick={() => setIsFormOpen(true)} 
            className="btn-primary"
          >
            Upload Firmware
          </button>
          <button 
            onClick={() => setIsCategoryFormOpen(true)} 
            className="btn-secondary"
          >
            Add Category
          </button>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Loading indicator */}
      {isLoading && (
        <div className="flex justify-center items-center py-4">
          <svg className="animate-spin h-5 w-5 text-primary-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
      )}

      {/* Categories Section */}
      <div className="card">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Firmware Categories</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Firmware Count
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {categories.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500">
                    No categories found. Create a category to get started.
                  </td>
                </tr>
              ) : (
                categories.map(category => (
                  <tr key={category._id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {category.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {category.description || 'No description'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {firmwares.filter(f => f.categories && f.categories.some(c => c._id === category._id)).length}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleDeleteCategory(category._id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Firmware List */}
      <div className="card">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Firmware Files</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  File Name
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Version
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Upload Date
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Categories
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Size
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {firmwares.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500">
                    No firmware files found. Upload a firmware file to get started.
                  </td>
                </tr>
              ) : (
                firmwares.map(firmware => (
                  <tr key={firmware._id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {firmware.fileName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {firmware.version}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(firmware.uploadDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {getCategoryNames(firmware.categories)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {firmware.fileSize ? `${Math.round(firmware.fileSize / 1024)} KB` : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="space-x-4">
                        <button
                          onClick={() => {
                            setSelectedFirmware(firmware);
                            setIsAssignModalOpen(true);
                          }}
                          className="text-primary-600 hover:text-primary-900"
                        >
                          Assign
                        </button>
                        <button
                          onClick={() => {
                            setSelectedFirmware(firmware);
                            setIsUpgradeModalOpen(true);
                          }}
                          className="text-green-600 hover:text-green-900"
                        >
                          Upgrade
                        </button>
                        <button
                          onClick={() => handleDownloadFirmware(firmware._id)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Download
                        </button>
                        <button
                          onClick={() => handleDeleteFirmware(firmware._id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Upload Firmware Form Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Upload Firmware</h3>
            <form onSubmit={handleSubmitFirmware} className="space-y-4">
              <div>
                <label htmlFor="fileName" className="block text-sm font-medium text-gray-700">
                  File Name
                </label>
                <input
                  type="text"
                  id="fileName"
                  name="fileName"
                  value={firmwareForm.fileName}
                  onChange={handleFirmwareFormChange}
                  className="input-field mt-1"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="version" className="block text-sm font-medium text-gray-700">
                  Version
                </label>
                <input
                  type="text"
                  id="version"
                  name="version"
                  value={firmwareForm.version}
                  onChange={handleFirmwareFormChange}
                  className="input-field mt-1"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={firmwareForm.description}
                  onChange={handleFirmwareFormChange}
                  className="input-field mt-1"
                  rows="3"
                />
              </div>
              
              <div>
                <label htmlFor="compatibleDeviceTypes" className="block text-sm font-medium text-gray-700">
                  Compatible Device Types
                </label>
                <select
                  id="compatibleDeviceTypes"
                  name="compatibleDeviceTypes"
                  multiple
                  value={firmwareForm.compatibleDeviceTypes}
                  onChange={handleFirmwareFormChange}
                  className="input-field mt-1"
                >
                  {Array.from(new Set(devices.map(device => device.type))).map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-gray-500">
                  Hold Ctrl (or Cmd on Mac) to select multiple types
                </p>
              </div>
              
              <div>
                <label htmlFor="categories" className="block text-sm font-medium text-gray-700">
                  Categories
                </label>
                <select
                  id="categories"
                  name="categories"
                  multiple
                  value={firmwareForm.categories}
                  onChange={handleFirmwareFormChange}
                  className="input-field mt-1"
                >
                  {categories.map(category => (
                    <option key={category._id} value={category._id}>{category.name}</option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-gray-500">
                  Hold Ctrl (or Cmd on Mac) to select multiple categories
                </p>
              </div>
              
              <div>
                <label htmlFor="file" className="block text-sm font-medium text-gray-700">
                  Firmware File
                </label>
                <input
                  type="file"
                  id="file"
                  name="file"
                  onChange={handleFirmwareFormChange}
                  className="input-field mt-1"
                  required
                />
              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={isLoading}
                >
                  {isLoading ? 'Uploading...' : 'Upload Firmware'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Category Form Modal */}
      {isCategoryFormOpen && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Add Category</h3>
            <form onSubmit={handleSubmitCategory} className="space-y-4">
              <div>
                <label htmlFor="categoryName" className="block text-sm font-medium text-gray-700">
                  Category Name
                </label>
                <input
                  type="text"
                  id="categoryName"
                  name="name"
                  value={categoryForm.name}
                  onChange={handleCategoryFormChange}
                  className="input-field mt-1"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="categoryDescription" className="block text-sm font-medium text-gray-700">
                  Description
                </label>
                <textarea
                  id="categoryDescription"
                  name="description"
                  value={categoryForm.description}
                  onChange={handleCategoryFormChange}
                  className="input-field mt-1"
                  rows="3"
                />
              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsCategoryFormOpen(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={isLoading}
                >
                  {isLoading ? 'Adding...' : 'Add Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Firmware Modal */}
      {isAssignModalOpen && selectedFirmware && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Assign Firmware: {selectedFirmware.fileName} (v{selectedFirmware.version})
            </h3>
            
            <div className="mb-4">
              <p className="text-sm text-gray-700">
                Select the devices to assign this firmware version to:
              </p>
            </div>
            
            <div className="max-h-80 overflow-y-auto border border-gray-200 rounded-md mb-4">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <input
                        type="checkbox"
                        onChange={() => {
                          if (selectedDevices.length === devices.length) {
                            setSelectedDevices([]);
                          } else {
                            setSelectedDevices(devices.map(d => d._id));
                          }
                        }}
                        checked={selectedDevices.length === devices.length && devices.length > 0}
                        className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                      />
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Device Name
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Serial
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Current Firmware
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {devices.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500">
                        No devices found.
                      </td>
                    </tr>
                  ) : (
                    devices.map(device => (
                      <tr 
                        key={device._id}
                        className={selectedDevices.includes(device._id) ? 'bg-primary-50' : ''}  
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <input
                            type="checkbox"
                            onChange={() => handleDeviceSelection(device._id)}
                            checked={selectedDevices.includes(device._id)}
                            className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {device.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {device.deviceSerial}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {device.type}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {device.firmwareVersion || 'None'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            
            <div className="flex items-center text-sm text-gray-700 mb-4">
              <span className="font-medium">{selectedDevices.length}</span>
              <span className="ml-1">devices selected</span>
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => {
                  setIsAssignModalOpen(false);
                  setSelectedDevices([]);
                }}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAssignFirmware}
                className="btn-primary"
                disabled={isLoading || selectedDevices.length === 0}
              >
                {isLoading ? 'Assigning...' : 'Assign Firmware'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upgrade Firmware Modal */}
      {isUpgradeModalOpen && selectedFirmware && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Upgrade Devices to: {selectedFirmware.fileName} (v{selectedFirmware.version})
            </h3>
            
            <div className="mb-4">
              <p className="text-sm text-gray-700">
                This will send a firmware upgrade command to the selected devices.
              </p>
              <p className="text-sm text-gray-700 mt-1">
                <strong>Warning:</strong> The devices will be temporarily unavailable during the upgrade process.
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label htmlFor="timeoutInMinutes" className="block text-sm font-medium text-gray-700">
                  Timeout (minutes)
                </label>
                <input
                  type="number"
                  id="timeoutInMinutes"
                  value={upgradeOptions.timeoutInMinutes}
                  onChange={(e) => setUpgradeOptions({
                    ...upgradeOptions,
                    timeoutInMinutes: parseInt(e.target.value) || 4
                  })}
                  min="1"
                  max="60"
                  className="input-field mt-1"
                />
              </div>
              
              <div>
                <label htmlFor="maxRetries" className="block text-sm font-medium text-gray-700">
                  Max Retries
                </label>
                <input
                  type="number"
                  id="maxRetries"
                  value={upgradeOptions.maxRetries}
                  onChange={(e) => setUpgradeOptions({
                    ...upgradeOptions,
                    maxRetries: parseInt(e.target.value) || 3
                  })}
                  min="0"
                  max="10"
                  className="input-field mt-1"
                />
              </div>
            </div>
            
            <div className="max-h-80 overflow-y-auto border border-gray-200 rounded-md mb-4">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <input
                        type="checkbox"
                        onChange={() => {
                          if (selectedDevices.length === devices.length) {
                            setSelectedDevices([]);
                          } else {
                            setSelectedDevices(devices.map(d => d._id));
                          }
                        }}
                        checked={selectedDevices.length === devices.length && devices.length > 0}
                        className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                      />
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Device Name
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Serial
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Current Firmware
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {devices.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500">
                        No devices found.
                      </td>
                    </tr>
                  ) : (
                    devices.map(device => (
                      <tr 
                        key={device._id}
                        className={selectedDevices.includes(device._id) ? 'bg-primary-50' : ''}  
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <input
                            type="checkbox"
                            onChange={() => handleDeviceSelection(device._id)}
                            checked={selectedDevices.includes(device._id)}
                            className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {device.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {device.deviceSerial}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {device.type}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {device.firmwareVersion || 'None'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            
            <div className="flex items-center text-sm text-gray-700 mb-4">
              <span className="font-medium">{selectedDevices.length}</span>
              <span className="ml-1">devices selected</span>
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => {
                  setIsUpgradeModalOpen(false);
                  setSelectedDevices([]);
                }}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleUpgradeDevices}
                className="btn-primary"
                disabled={isLoading || selectedDevices.length === 0}
              >
                {isLoading ? 'Sending...' : 'Send Upgrade Command'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Firmwares;