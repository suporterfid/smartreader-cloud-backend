import api from './api';

export const firmwareService = {
  // Firmware operations
  getFirmwares: async () => {
    const response = await api.get('/firmwares');
    return response.data;
  },

  getFirmwareById: async (id) => {
    const response = await api.get(`/firmwares/${id}`);
    return response.data;
  },

  createFirmware: async (formData) => {
    const response = await api.post('/firmwares', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  updateFirmware: async (id, formData) => {
    const response = await api.put(`/firmwares/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  deleteFirmware: async (id) => {
    const response = await api.delete(`/firmwares/${id}`);
    return response.data;
  },

  downloadFirmware: async (id) => {
    // Use window.open for direct download
    window.open(`${api.defaults.baseURL}/firmwares/${id}/download`, '_blank');
  },

  assignFirmwareToDevices: async (firmwareId, deviceIds) => {
    const response = await api.post(`/firmwares/${firmwareId}/assign`, { deviceIds });
    return response.data;
  },

  sendUpgradeCommand: async (firmwareId, deviceIds, options = {}) => {
    const response = await api.post(`/firmwares/${firmwareId}/upgrade`, {
      deviceIds,
      ...options
    });
    return response.data;
  },

  // Firmware category operations
  getCategories: async () => {
    const response = await api.get('/firmware-categories');
    return response.data;
  },

  getCategoryById: async (id) => {
    const response = await api.get(`/firmware-categories/${id}`);
    return response.data;
  },

  createCategory: async (categoryData) => {
    const response = await api.post('/firmware-categories', categoryData);
    return response.data;
  },

  updateCategory: async (id, categoryData) => {
    const response = await api.put(`/firmware-categories/${id}`, categoryData);
    return response.data;
  },

  deleteCategory: async (id) => {
    const response = await api.delete(`/firmware-categories/${id}`);
    return response.data;
  },

  getFirmwareByCategory: async (categoryId) => {
    const response = await api.get(`/firmware-categories/${categoryId}/firmware`);
    return response.data;
  }
};

export default firmwareService;
