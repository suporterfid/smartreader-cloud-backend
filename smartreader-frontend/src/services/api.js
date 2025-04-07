import axios from 'axios';

const API_KEY = 'EXAMPLE_API_KEY'; //process.env.REACT_APP_API_KEY || 'EXAMPLE_API_KEY';
const BASE_URL = 'http://localhost:3000/api';// process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': API_KEY
  }
});

export const deviceService = {
  getDevices: async () => {
    const response = await api.get('/devices');
    return response.data;
  },

  getDeviceById: async (id) => {
    const response = await api.get(`/devices/${id}`);
    return response.data;
  },

  post: async (endpoint, data) => {
    const response = await api.post(endpoint, data);
    return response;
  },

  put: async (endpoint, data) => {
    const response = await api.put(endpoint, data);
    return response;
  },

  delete: async (endpoint) => {
    const response = await api.delete(endpoint);
    return response;
  },

  sendStartCommand: async (deviceSerial) => {
    const response = await api.post(`/devices/${deviceSerial}/control`, {
      command: 'start',
      payload: {}
    });
    return response.data;
  },

  sendStopCommand: async (deviceSerial) => {
    const response = await api.post(`/devices/${deviceSerial}/control`, {
      command: 'stop',
      payload: {}
    });
    return response.data;
  },

  sendModeCommand: async (deviceSerial, modeConfig) => {
    const response = await api.post(`/devices/${deviceSerial}/control`, {
      command: 'mode',
      payload: {
        type: modeConfig.type,
        antennas: modeConfig.antennas,
        antennaZone: modeConfig.antennaZone,
        transmitPower: modeConfig.transmitPower
      }
    });
    return response.data;
  },

  sendRebootCommand: async (deviceSerial) => {
    const response = await api.post(`/devices/${deviceSerial}/control`, {
      command: 'reboot',
      payload: {}
    });
    return response.data;
  },
};

export default api;