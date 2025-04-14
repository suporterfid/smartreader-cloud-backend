import React, { useState, useEffect } from 'react';
import { provisioningService } from '../services/provisioning-api';

function ProvisioningTemplates() {
  const [templates, setTemplates] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    mqttConfig: {
      host: '',
      port: 8883,
      useTLS: true,
      topicPermissions: []
    },
    parameters: {},
    isDefault: false
  });
  
  // Topic permission form
  const [topicPermission, setTopicPermission] = useState({
    topic: '',
    permission: 'subscribe'
  });
  
  // Parameter form
  const [parameter, setParameter] = useState({
    key: '',
    value: ''
  });

  // Fetch templates
  useEffect(() => {
    const fetchTemplates = async () => {
      setIsLoading(true);
      try {
        const data = await provisioningService.getTemplates();
        setTemplates(data);
        setError(null);
      } catch (error) {
        console.error('Error fetching templates:', error);
        setError('Failed to load templates. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchTemplates();
  }, []);

  const handleAddTopicPermission = () => {
    if (!topicPermission.topic) return;
    
    setFormData({
      ...formData,
      mqttConfig: {
        ...formData.mqttConfig,
        topicPermissions: [
          ...formData.mqttConfig.topicPermissions,
          { ...topicPermission }
        ]
      }
    });
    
    // Reset topic permission form
    setTopicPermission({
      topic: '',
      permission: 'subscribe'
    });
  };

  const handleRemoveTopicPermission = (index) => {
    const newTopicPermissions = [...formData.mqttConfig.topicPermissions];
    newTopicPermissions.splice(index, 1);
    
    setFormData({
      ...formData,
      mqttConfig: {
        ...formData.mqttConfig,
        topicPermissions: newTopicPermissions
      }
    });
  };

  const handleAddParameter = () => {
    if (!parameter.key) return;
    
    setFormData({
      ...formData,
      parameters: {
        ...formData.parameters,
        [parameter.key]: parameter.value
      }
    });
    
    // Reset parameter form
    setParameter({
      key: '',
      value: ''
    });
  };

  const handleRemoveParameter = (key) => {
    const newParameters = { ...formData.parameters };
    delete newParameters[key];
    
    setFormData({
      ...formData,
      parameters: newParameters
    });
  };

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.startsWith('mqttConfig.')) {
      const mqttField = name.replace('mqttConfig.', '');
      
      setFormData({
        ...formData,
        mqttConfig: {
          ...formData.mqttConfig,
          [mqttField]: type === 'checkbox' ? checked : value
        }
      });
    } else {
      setFormData({
        ...formData,
        [name]: type === 'checkbox' ? checked : value
      });
    }
  };

  const handleTopicPermissionChange = (e) => {
    const { name, value } = e.target;
    
    setTopicPermission({
      ...topicPermission,
      [name]: value
    });
  };

  const handleParameterChange = (e) => {
    const { name, value } = e.target;
    
    setParameter({
      ...parameter,
      [name]: value
    });
  };

  const handleCreateTemplate = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const result = isEditMode
        ? await provisioningService.updateTemplate(selectedTemplate._id, formData)
        : await provisioningService.createTemplate(formData);
      
      setTemplates(
        isEditMode
          ? templates.map(t => (t._id === result._id ? result : t))
          : [...templates, result]
      );
      
      setIsFormOpen(false);
      setIsEditMode(false);
      setSelectedTemplate(null);
      resetForm();
    } catch (error) {
      console.error('Error saving template:', error);
      setError('Failed to save template. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditTemplate = (template) => {
    setSelectedTemplate(template);
    setFormData({
      name: template.name,
      description: template.description,
      mqttConfig: {
        host: template.mqttConfig.host,
        port: template.mqttConfig.port,
        useTLS: template.mqttConfig.useTLS,
        topicPermissions: template.mqttConfig.topicPermissions || []
      },
      parameters: template.parameters || {},
      isDefault: template.isDefault || false
    });
    setIsEditMode(true);
    setIsFormOpen(true);
  };

  const handleDeleteTemplate = async (templateId) => {
    if (!window.confirm('Are you sure you want to delete this template?')) return;
    
    setIsLoading(true);
    
    try {
      await provisioningService.deleteTemplate(templateId);
      setTemplates(templates.filter(t => t._id !== templateId));
    } catch (error) {
      console.error('Error deleting template:', error);
      setError('Failed to delete template. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      mqttConfig: {
        host: '',
        port: 8883,
        useTLS: true,
        topicPermissions: []
      },
      parameters: {},
      isDefault: false
    });
  };

  return (
    <div className="space-y-6">
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Provisioning Templates</h1>
          <p className="mt-2 text-sm text-gray-700">
            Manage templates for device provisioning and configuration
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <button 
            onClick={() => {
              resetForm();
              setIsEditMode(false);
              setIsFormOpen(true);
            }} 
            className="btn-primary"
          >
            Create Template
          </button>
        </div>
      </div>

      {/* Error Message */}
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

      {/* Loading State */}
      {isLoading && (
        <div className="flex justify-center items-center py-4">
          <svg className="animate-spin h-5 w-5 text-primary-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
      )}

      {/* Template Form */}
      {isFormOpen && (
        <div className="card">
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            {isEditMode ? 'Edit Template' : 'Create New Template'}
          </h2>
          <form onSubmit={handleCreateTemplate} className="space-y-6">
            {/* Basic Info */}
            <div className="space-y-4">
              <h3 className="text-md font-medium text-gray-700">Basic Information</h3>
              
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Template Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  className="input-field mt-1"
                  value={formData.name}
                  onChange={handleFormChange}
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
                  rows="3"
                  className="input-field mt-1"
                  value={formData.description}
                  onChange={handleFormChange}
                  required
                ></textarea>
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isDefault"
                  name="isDefault"
                  checked={formData.isDefault}
                  onChange={handleFormChange}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label htmlFor="isDefault" className="ml-2 block text-sm text-gray-700">
                  Set as default template
                </label>
              </div>
            </div>
            
            {/* MQTT Configuration */}
            <div className="space-y-4">
              <h3 className="text-md font-medium text-gray-700">MQTT Configuration</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="mqttHost" className="block text-sm font-medium text-gray-700">
                    MQTT Host
                  </label>
                  <input
                    type="text"
                    id="mqttHost"
                    name="mqttConfig.host"
                    className="input-field mt-1"
                    value={formData.mqttConfig.host}
                    onChange={handleFormChange}
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="mqttPort" className="block text-sm font-medium text-gray-700">
                    MQTT Port
                  </label>
                  <input
                    type="number"
                    id="mqttPort"
                    name="mqttConfig.port"
                    className="input-field mt-1"
                    value={formData.mqttConfig.port}
                    onChange={handleFormChange}
                    required
                  />
                </div>
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="useTLS"
                  name="mqttConfig.useTLS"
                  checked={formData.mqttConfig.useTLS}
                  onChange={handleFormChange}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label htmlFor="useTLS" className="ml-2 block text-sm text-gray-700">
                  Use TLS/SSL
                </label>
              </div>
              
              {/* Topic Permissions */}
              <div>
                <h4 className="text-sm font-medium text-gray-700">Topic Permissions</h4>
                
                <div className="mt-2 flex items-end space-x-2">
                  <div className="flex-1">
                    <label htmlFor="topic" className="block text-xs text-gray-500">
                      Topic Pattern
                    </label>
                    <input
                      type="text"
                      id="topic"
                      name="topic"
                      className="input-field mt-1"
                      value={topicPermission.topic}
                      onChange={handleTopicPermissionChange}
                      placeholder="e.g., device/+/data"
                    />
                  </div>
                  
                  <div className="w-40">
                    <label htmlFor="permission" className="block text-xs text-gray-500">
                      Permission
                    </label>
                    <select
                      id="permission"
                      name="permission"
                      className="input-field mt-1"
                      value={topicPermission.permission}
                      onChange={handleTopicPermissionChange}
                    >
                      <option value="subscribe">Subscribe</option>
                      <option value="publish">Publish</option>
                      <option value="both">Both</option>
                    </select>
                  </div>
                  
                  <button
                    type="button"
                    onClick={handleAddTopicPermission}
                    className="bg-primary-600 hover:bg-primary-700 text-white py-2 px-3 rounded-md text-sm"
                  >
                    Add
                  </button>
                </div>
                
                {/* List of Topic Permissions */}
                {formData.mqttConfig.topicPermissions.length > 0 && (
                  <div className="mt-4 bg-gray-50 p-3 rounded-md">
                    <h5 className="text-xs font-medium text-gray-700 mb-2">Added Permissions</h5>
                    <ul className="space-y-2">
                      {formData.mqttConfig.topicPermissions.map((perm, index) => (
                        <li key={index} className="flex justify-between items-center text-sm">
                          <span>
                            <span className="font-medium">{perm.topic}</span>
                            <span className="ml-2 text-xs text-gray-500">({perm.permission})</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveTopicPermission(index)}
                            className="text-red-600 hover:text-red-800 text-sm"
                          >
                            Remove
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
            
            {/* Additional Parameters */}
            <div className="space-y-4">
              <h3 className="text-md font-medium text-gray-700">Additional Parameters</h3>
              
              <div className="flex items-end space-x-2">
                <div className="flex-1">
                  <label htmlFor="paramKey" className="block text-xs text-gray-500">
                    Parameter Key
                  </label>
                  <input
                    type="text"
                    id="paramKey"
                    name="key"
                    className="input-field mt-1"
                    value={parameter.key}
                    onChange={handleParameterChange}
                    placeholder="e.g., telemetryInterval"
                  />
                </div>
                
                <div className="flex-1">
                  <label htmlFor="paramValue" className="block text-xs text-gray-500">
                    Parameter Value
                  </label>
                  <input
                    type="text"
                    id="paramValue"
                    name="value"
                    className="input-field mt-1"
                    value={parameter.value}
                    onChange={handleParameterChange}
                    placeholder="e.g., 60"
                  />
                </div>
                
                <button
                  type="button"
                  onClick={handleAddParameter}
                  className="bg-primary-600 hover:bg-primary-700 text-white py-2 px-3 rounded-md text-sm"
                >
                  Add
                </button>
              </div>
              
              {/* List of Parameters */}
              {Object.keys(formData.parameters).length > 0 && (
                <div className="mt-4 bg-gray-50 p-3 rounded-md">
                  <h5 className="text-xs font-medium text-gray-700 mb-2">Added Parameters</h5>
                  <ul className="space-y-2">
                    {Object.entries(formData.parameters).map(([key, value]) => (
                      <li key={key} className="flex justify-between items-center text-sm">
                        <span>
                          <span className="font-medium">{key}</span>
                          <span className="ml-2 text-xs text-gray-500">({value})</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveParameter(key)}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          Remove
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            
            {/* Form Actions */}
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={() => {
                  setIsFormOpen(false);
                  setIsEditMode(false);
                  setSelectedTemplate(null);
                }}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary"
                disabled={isLoading}
              >
                {isLoading ? 'Saving...' : isEditMode ? 'Update Template' : 'Create Template'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Templates List */}
      <div className="card">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Available Templates</h2>
        
        {templates.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">
            No templates found. Create your first template to get started.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Template Name
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    MQTT Host
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Topics
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Default
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {templates.map((template) => (
                  <tr key={template._id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{template.name}</div>
                      <div className="text-sm text-gray-500">{template.description}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {template.mqttConfig.host}:{template.mqttConfig.port}
                      </div>
                      <div className="text-sm text-gray-500">
                        {template.mqttConfig.useTLS ? 'TLS Enabled' : 'TLS Disabled'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-500">
                        {template.mqttConfig.topicPermissions &&
                          template.mqttConfig.topicPermissions.length > 0 ? (
                          <span>
                            {template.mqttConfig.topicPermissions.length} topic patterns
                          </span>
                        ) : (
                          'No topics defined'
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {template.isDefault ? (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          Default
                        </span>
                      ) : (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                          No
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleEditTemplate(template)}
                        className="text-primary-600 hover:text-primary-900"
                      >
                        Edit
                      </button>
                      <span className="text-gray-300 mx-2">|</span>
                      <button
                        onClick={() => handleDeleteTemplate(template._id)}
                        className="text-red-600 hover:text-red-900"
                        disabled={template.isDefault}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default ProvisioningTemplates;