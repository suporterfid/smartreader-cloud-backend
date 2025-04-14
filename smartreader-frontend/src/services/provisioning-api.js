// smartreader-frontend/src/services/provisioning-api.js
import api from './api';

export const provisioningService = {
  // Provisioning templates
  getTemplates: async () => {
    const response = await api.get('/provisioning/templates');
    return response.data;
  },

  getTemplateById: async (id) => {
    const response = await api.get(`/provisioning/templates/${id}`);
    return response.data;
  },

  createTemplate: async (templateData) => {
    const response = await api.post('/provisioning/templates', templateData);
    return response.data;
  },

  updateTemplate: async (id, templateData) => {
    const response = await api.put(`/provisioning/templates/${id}`, templateData);
    return response.data;
  },

  deleteTemplate: async (id) => {
    const response = await api.delete(`/provisioning/templates/${id}`);
    return response.data;
  },

  // Device provisioning
  getUnclaimedDevices: async () => {
    const response = await api.get('/provisioning/unclaimed-devices');
    return response.data;
  },

  getDevicesByStatus: async () => {
    const response = await api.get('/provisioning/devices-by-status');
    return response.data;
  },

  claimDevice: async (deviceSerial, claimToken) => {
    const response = await api.post('/provisioning/claim', {
      deviceSerial,
      claimToken
    });
    return response.data;
  },

  applyTemplate: async (deviceId, templateId) => {
    const response = await api.post(`/provisioning/device/${deviceId}/apply-template`, {
      templateId
    });
    return response.data;
  },

  completeProvisioning: async (deviceId) => {
    const response = await api.post(`/provisioning/device/${deviceId}/complete`);
    return response.data;
  },

  revokeDevice: async (deviceId) => {
    const response = await api.post(`/provisioning/device/${deviceId}/revoke`);
    return response.data;
  },

  // Certificate operations
  generateCertificate: async (deviceId) => {
    const response = await api.post(`/provisioning/device/${deviceId}/generate-certificate`);
    return response.data;
  },

  getCACertificate: async () => {
    const response = await api.get('/provisioning/ca-certificate');
    return response.data;
  },

  getDeviceCertificates: async (deviceSerial) => {
    const response = await api.get(`/certificates/device/${deviceSerial}`);
    return response.data;
  },

  renewCertificate: async (deviceSerial) => {
    const response = await api.post(`/certificates/device/${deviceSerial}/renew`);
    return response.data;
  }
};

export default provisioningService;
