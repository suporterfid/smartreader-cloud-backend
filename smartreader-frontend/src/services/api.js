// smartreader-frontend/src/services/api.js
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

  getDevicesByStatus: async (status) => {
    const response = await api.get(`/devices/status${status ? `?status=${status}` : ''}`);
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

  patch: async (endpoint, data) => {
    const response = await api.patch(endpoint, data);
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
    // Ensure all required properties are included
    const fullModeConfig = {
      type: 'INVENTORY',
      antennas: [1, 2],
      antennaZone: 'CABINET',
      antennaZoneState: 'enabled',
      transmitPower: 17.25,
      groupIntervalInMs: 500,
      rfMode: 'MaxThroughput',
      searchMode: 'single-target',
      session: '1',
      tagPopulation: 32,
      filter: {
        value: '',
        match: 'prefix',
        operation: 'include',
        status: 'disabled'
      },
      filterIncludeEpcHeaderList: {
        value: '',
        status: 'disabled'
      },
      rssiFilter: {
        threshold: -72
      },
      ...modeConfig
    };

    // Ensure nested objects are properly merged
    if (modeConfig.filter) {
      fullModeConfig.filter = {
        ...fullModeConfig.filter,
        ...modeConfig.filter
      };
    }

    if (modeConfig.filterIncludeEpcHeaderList) {
      fullModeConfig.filterIncludeEpcHeaderList = {
        ...fullModeConfig.filterIncludeEpcHeaderList,
        ...modeConfig.filterIncludeEpcHeaderList
      };
    }

    if (modeConfig.rssiFilter) {
      fullModeConfig.rssiFilter = {
        ...fullModeConfig.rssiFilter,
        ...modeConfig.rssiFilter
      };
    }

    const response = await api.post(`/devices/${deviceSerial}/control`, {
      command: 'mode',
      payload: fullModeConfig
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

  updateCommunicationTimeout: async (deviceSerial, timeout) => {
    const response = await api.patch(`/devices/${deviceSerial}/timeout`, {
      timeout
    });
    return response.data;
  }
};

export default api;
