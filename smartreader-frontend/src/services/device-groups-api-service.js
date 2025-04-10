import api from './api';

export const deviceGroupsService = {
  // Group operations
  getGroups: async () => {
    const response = await api.get('/device-groups');
    return response.data;
  },

  getGroupById: async (id) => {
    const response = await api.get(`/device-groups/${id}`);
    return response.data;
  },

  createGroup: async (groupData) => {
    const response = await api.post('/device-groups', groupData);
    return response.data;
  },

  updateGroup: async (id, groupData) => {
    const response = await api.put(`/device-groups/${id}`, groupData);
    return response.data;
  },

  deleteGroup: async (id) => {
    const response = await api.delete(`/device-groups/${id}`);
    return response.data;
  },

  // Device management in groups
  addDevicesToGroup: async (groupId, deviceIds) => {
    const response = await api.post(`/device-groups/${groupId}/devices/add`, { deviceIds });
    return response.data;
  },

  removeDevicesFromGroup: async (groupId, deviceIds) => {
    const response = await api.post(`/device-groups/${groupId}/devices/remove`, { deviceIds });
    return response.data;
  },

  // Group commands
  sendCommandToGroup: async (groupId, commandData) => {
    const response = await api.post(`/device-groups/${groupId}/command`, commandData);
    return response.data;
  },

  getGroupCommandHistory: async (groupId, filters = {}) => {
    const queryParams = new URLSearchParams();
    
    if (filters.type) queryParams.append('type', filters.type);
    if (filters.status) queryParams.append('status', filters.status);
    if (filters.from) queryParams.append('from', filters.from);
    if (filters.to) queryParams.append('to', filters.to);
    
    const queryString = queryParams.toString();
    const url = `/device-groups/${groupId}/commands${queryString ? `?${queryString}` : ''}`;
    
    const response = await api.get(url);
    return response.data;
  },

  getGroupCommandDetails: async (groupCommandId) => {
    const response = await api.get(`/device-groups/commands/${groupCommandId}`);
    return response.data;
  },

  // Common command types
  sendStartCommandToGroup: async (groupId, options = {}) => {
    return deviceGroupsService.sendCommandToGroup(groupId, {
      type: 'control',
      command: 'start',
      payload: options.payload || {}
    });
  },

  sendStopCommandToGroup: async (groupId) => {
    return deviceGroupsService.sendCommandToGroup(groupId, {
      type: 'control',
      command: 'stop',
      payload: {}
    });
  },

  sendModeCommandToGroup: async (groupId, modeConfig) => {
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

    return deviceGroupsService.sendCommandToGroup(groupId, {
      type: 'control',
      command: 'mode',
      payload: fullModeConfig
    });
  },

  sendRebootCommandToGroup: async (groupId) => {
    return deviceGroupsService.sendCommandToGroup(groupId, {
      type: 'control',
      command: 'reboot',
      payload: {}
    });
  }
};

export default deviceGroupsService;
