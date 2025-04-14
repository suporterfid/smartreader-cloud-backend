import React, { useState, useEffect } from 'react';
import { provisioningService } from '../services/provisioning-api';

function DeviceOnboarding() {
  const [currentStep, setCurrentStep] = useState(1);
  const [claimToken, setClaimToken] = useState('');
  const [deviceSerial, setDeviceSerial] = useState('');
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [device, setDevice] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  // Get available templates
  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const templatesData = await provisioningService.getTemplates();
        setTemplates(templatesData);
        
        // Auto-select the default template if available
        const defaultTemplate = templatesData.find(t => t.isDefault);
        if (defaultTemplate) {
          setSelectedTemplate(defaultTemplate._id);
        }
      } catch (error) {
        console.error('Failed to fetch templates:', error);
        setError('Failed to load provisioning templates. Please try again.');
      }
    };
    
    fetchTemplates();
  }, []);

  const handleDeviceClaim = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      const claimedDevice = await provisioningService.claimDevice(deviceSerial, claimToken);
      setDevice(claimedDevice);
      setSuccess('Device claimed successfully!');
      setCurrentStep(2);
    } catch (error) {
      console.error('Error claiming device:', error);
      setError('Failed to claim device. Please check the serial number and claim token.');
    } finally {
      setLoading(false);
    }
  };

  const handleTemplateApplication = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      const updatedDevice = await provisioningService.applyTemplate(device._id, selectedTemplate);
      setDevice(updatedDevice);
      setSuccess('Provisioning template applied successfully!');
      setCurrentStep(3);
    } catch (error) {
      console.error('Error applying template:', error);
      setError('Failed to apply provisioning template.');
    } finally {
      setLoading(false);
    }
  };

  const handleCertificateGeneration = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      const certificate = await provisioningService.generateCertificate(device._id);
      setSuccess('Device certificate generated successfully!');
      setCurrentStep(4);
    } catch (error) {
      console.error('Error generating certificate:', error);
      setError('Failed to generate device certificate.');
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteProvisioning = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      const provisionedDevice = await provisioningService.completeProvisioning(device._id);
      setDevice(provisionedDevice);
      setSuccess('Device provisioning completed successfully!');
      setCurrentStep(5);
    } catch (error) {
      console.error('Error completing provisioning:', error);
      setError('Failed to complete device provisioning.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Device Onboarding</h1>
          <p className="mt-2 text-sm text-gray-700">
            Follow these steps to onboard and provision your device
          </p>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="relative">
        <div className="relative flex justify-between">
          {/* Step 1: Claim Device */}
          <div className="w-10 h-10 flex items-center justify-center rounded-full bg-primary-600 text-white font-medium">1</div>
          
          {/* Step divider */}
          <div className={`absolute top-5 left-10 right-10 h-0.5 ${currentStep > 1 ? 'bg-primary-600' : 'bg-gray-200'}`}></div>
          
          {/* Step 2: Select Template */}
          <div className={`w-10 h-10 flex items-center justify-center rounded-full ${
            currentStep >= 2 ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-600'
          } font-medium`}>2</div>
          
          {/* Step divider */}
          <div className={`absolute top-5 left-1/4 right-1/2 h-0.5 ${currentStep > 2 ? 'bg-primary-600' : 'bg-gray-200'}`}></div>
          
          {/* Step 3: Generate Certificate */}
          <div className={`w-10 h-10 flex items-center justify-center rounded-full ${
            currentStep >= 3 ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-600'
          } font-medium`}>3</div>
          
          {/* Step divider */}
          <div className={`absolute top-5 left-1/2 right-1/4 h-0.5 ${currentStep > 3 ? 'bg-primary-600' : 'bg-gray-200'}`}></div>
          
          {/* Step 4: Complete Provisioning */}
          <div className={`w-10 h-10 flex items-center justify-center rounded-full ${
            currentStep >= 4 ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-600'
          } font-medium`}>4</div>
          
          {/* Step divider */}
          <div className={`absolute top-5 left-3/4 right-10 h-0.5 ${currentStep > 4 ? 'bg-primary-600' : 'bg-gray-200'}`}></div>
          
          {/* Step 5: Finished */}
          <div className={`w-10 h-10 flex items-center justify-center rounded-full ${
            currentStep >= 5 ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-600'
          } font-medium`}>5</div>
        </div>
        
        <div className="flex justify-between mt-2 text-xs">
          <span className="w-10 text-center">Claim</span>
          <span className="w-10 text-center">Template</span>
          <span className="w-10 text-center">Certificate</span>
          <span className="w-10 text-center">Complete</span>
          <span className="w-10 text-center">Finished</span>
        </div>
      </div>

      {/* Error/Success Messages */}
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

      {success && (
        <div className="bg-green-50 border-l-4 border-green-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-green-700">{success}</p>
            </div>
          </div>
        </div>
      )}

      {/* Step 1: Claim Device */}
      {currentStep === 1 && (
        <div className="card">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Step 1: Claim Device</h2>
          <form onSubmit={handleDeviceClaim} className="space-y-4">
            <div>
              <label htmlFor="deviceSerial" className="block text-sm font-medium text-gray-700">
                Device Serial Number
              </label>
              <input
                type="text"
                id="deviceSerial"
                className="input-field mt-1"
                value={deviceSerial}
                onChange={(e) => setDeviceSerial(e.target.value)}
                required
              />
              <p className="mt-1 text-xs text-gray-500">
                Enter the device serial number printed on the device or packaging
              </p>
            </div>
            
            <div>
              <label htmlFor="claimToken" className="block text-sm font-medium text-gray-700">
                Claim Token
              </label>
              <input
                type="text"
                id="claimToken"
                className="input-field mt-1"
                value={claimToken}
                onChange={(e) => setClaimToken(e.target.value)}
                required
              />
              <p className="mt-1 text-xs text-gray-500">
                Enter the claim token received when the device first connected
              </p>
            </div>
            
            <div className="flex justify-end">
              <button
                type="submit"
                className="btn-primary"
                disabled={loading}
              >
                {loading ? 'Claiming...' : 'Claim Device'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Step 2: Select Provisioning Template */}
      {currentStep === 2 && (
        <div className="card">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Step 2: Select Provisioning Template</h2>
          <form onSubmit={handleTemplateApplication} className="space-y-4">
            <div>
              <label htmlFor="template" className="block text-sm font-medium text-gray-700">
                Provisioning Template
              </label>
              <select
                id="template"
                className="input-field mt-1"
                value={selectedTemplate}
                onChange={(e) => setSelectedTemplate(e.target.value)}
                required
              >
                <option value="">Select a template</option>
                {templates.map(template => (
                  <option key={template._id} value={template._id}>
                    {template.name} {template.isDefault ? '(Default)' : ''}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-gray-500">
                Choose the provisioning template that defines how the device will connect
              </p>
            </div>
            
            {/* Display selected template details */}
            {selectedTemplate && (
              <div className="mt-4 p-4 bg-gray-50 rounded-md">
                <h3 className="text-sm font-medium text-gray-700">Template Details</h3>
                <div className="mt-2 text-sm text-gray-600">
                  {templates
                    .filter(t => t._id === selectedTemplate)
                    .map(t => (
                      <div key={t._id} className="space-y-2">
                        <p><span className="font-semibold">Description:</span> {t.description}</p>
                        <p><span className="font-semibold">MQTT Host:</span> {t.mqttConfig.host}</p>
                        <p><span className="font-semibold">MQTT Port:</span> {t.mqttConfig.port}</p>
                        <p><span className="font-semibold">TLS Enabled:</span> {t.mqttConfig.useTLS ? 'Yes' : 'No'}</p>
                        {t.mqttConfig.topicPermissions && t.mqttConfig.topicPermissions.length > 0 && (
                          <div>
                            <p className="font-semibold">Topic Permissions:</p>
                            <ul className="list-disc pl-5">
                              {t.mqttConfig.topicPermissions.map((perm, idx) => (
                                <li key={idx}>
                                  {perm.topic} - {perm.permission}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              </div>
            )}
            
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setCurrentStep(1)}
              >
                Back
              </button>
              <button
                type="submit"
                className="btn-primary"
                disabled={loading || !selectedTemplate}
              >
                {loading ? 'Applying...' : 'Apply Template'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Step 3: Generate Certificate */}
      {currentStep === 3 && (
        <div className="card">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Step 3: Generate Device Certificate</h2>
          <div className="space-y-4">
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-yellow-700">
                    This will generate a secure certificate for your device to authenticate with MQTT.
                    The certificate will be stored securely.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="p-4 bg-gray-50 rounded-md">
              <h3 className="text-sm font-medium text-gray-700">Device Information</h3>
              <div className="mt-2 text-sm text-gray-600">
                <p><span className="font-semibold">Device Serial:</span> {device?.deviceSerial}</p>
                <p><span className="font-semibold">Name:</span> {device?.name}</p>
                <p>
                  <span className="font-semibold">Status:</span> 
                  <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                    {device?.provisioningStatus}
                  </span>
                </p>
              </div>
            </div>
            
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setCurrentStep(2)}
              >
                Back
              </button>
              <button
                type="button"
                className="btn-primary"
                onClick={handleCertificateGeneration}
                disabled={loading}
              >
                {loading ? 'Generating...' : 'Generate Certificate'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Step 4: Complete Provisioning */}
      {currentStep === 4 && (
        <div className="card">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Step 4: Complete Provisioning</h2>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Your device is almost ready! Complete the provisioning process to make the device fully operational.
            </p>
            
            <div className="p-4 bg-green-50 rounded-md">
              <h3 className="text-sm font-medium text-green-700">Provisioning Summary</h3>
              <ul className="mt-2 text-sm text-green-600 space-y-1">
                <li className="flex items-center">
                  <svg className="h-5 w-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  Device claimed successfully
                </li>
                <li className="flex items-center">
                  <svg className="h-5 w-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  Provisioning template applied
                </li>
                <li className="flex items-center">
                  <svg className="h-5 w-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  Device certificate generated
                </li>
              </ul>
            </div>
            
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setCurrentStep(3)}
              >
                Back
              </button>
              <button
                type="button"
                className="btn-primary"
                onClick={handleCompleteProvisioning}
                disabled={loading}
              >
                {loading ? 'Completing...' : 'Complete Provisioning'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Step 5: Finished */}
      {currentStep === 5 && (
        <div className="card">
          <div className="text-center py-6">
            <svg className="h-16 w-16 text-green-500 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h2 className="mt-4 text-lg font-medium text-gray-900">Device Onboarding Complete!</h2>
            <p className="mt-2 text-sm text-gray-600">
              Your device is now fully provisioned and ready to use.
            </p>
            <div className="mt-6">
              <p className="text-sm text-gray-700 font-semibold">Device Details:</p>
              <p className="text-sm text-gray-600">Serial: {device?.deviceSerial}</p>
              <p className="text-sm text-gray-600">Status: {device?.provisioningStatus}</p>
            </div>
            <div className="mt-6">
              <button
                type="button"
                className="btn-primary"
                onClick={() => {
                  // Redirect to devices page or reset form for another device
                  setCurrentStep(1);
                  setDeviceSerial('');
                  setClaimToken('');
                  setDevice(null);
                  setSuccess(null);
                }}
              >
                Onboard Another Device
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DeviceOnboarding;