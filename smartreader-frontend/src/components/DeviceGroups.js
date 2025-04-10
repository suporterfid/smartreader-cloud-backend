import React, { useEffect, useState } from 'react';
import { deviceGroupsService } from '../services/device-groups-api';
import { deviceService } from '../services/api';

function DeviceGroups() {
  const [groups, setGroups] = useState([]);
  const [devices, setDevices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Form states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [groupForm, setGroupForm] = useState({
    name: '',
    description: '',
    deviceIds: [],
    tags: []
  });
  
  // Command form states
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [isCommandFormOpen, setIsCommandFormOpen] = useState(false);
  const [commandForm, setCommandForm] = useState({
    type: 'control',
    command: 'start',
    payload: {}
  });
  
  // Command history states
  const [isCommandHistoryOpen, setIsCommandHistoryOpen] = useState(false);
  const [commandHistory, setCommandHistory] = useState([]);
  const [historyFilters, setHistoryFilters] = useState({
    type: '',
    status: '',
    from: '',
    to: ''
  });
  
  // Command details states
  const [selectedCommand, setSelectedCommand] = useState(null);
  const [isCommandDetailsOpen, setIsCommandDetailsOpen] = useState(false);
  const [commandDetails, setCommandDetails] = useState(null);

  // Manage devices states
  const [isManageDevicesOpen, setIsManageDevicesOpen] = useState(false);
  const [deviceSelections, setDeviceSelections] = useState({});

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [groupsData, devicesData] = await Promise.all([
          deviceGroupsService.getGroups(),
          deviceService.getDevices()
        ]);
        
        setGroups(groupsData);
        setDevices(devicesData);
        
        // Initialize device selections
        const selections = {};
        devicesData.forEach(device => {
          selections[device._id] = false;
        });
        setDeviceSelections(selections);
        
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
      const [groupsData, devicesData] = await Promise.all([
        deviceGroupsService.getGroups(),
        deviceService.getDevices()
      ]);
      
      setGroups(groupsData);
      setDevices(devicesData);
      setError(null);
    } catch (err) {
      console.error('Error refreshing data:', err);
      setError('Failed to refresh data. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  // Form handlers
  const handleGroupFormChange = (e) => {
    const { name, value } = e.target;
    setGroupForm({
      ...groupForm,
      [name]: value
    });
  };

  const handleCommandFormChange = (e) => {
    const { name, value } = e.target;
    setCommandForm({
      ...commandForm,
      [name]: value
    });
  };

  const handleHistoryFilterChange = (e) => {
    const { name, value } = e.target;
    setHistoryFilters({
      ...historyFilters,
      [name]: value
    });
  };

  const handleDeviceSelectionChange = (deviceId) => {
    setDeviceSelections({
      ...deviceSelections,
      [deviceId]: !deviceSelections[deviceId]
    });
  };

  const toggleSelectAllDevices = () => {
    const allSelected = Object.values(deviceSelections).every(v => v);
    const newSelections = {};
    
    devices.forEach(device => {
      newSelections[device._id] = !allSelected;
    });
    
    setDeviceSelections(newSelections);
  };

  // Submit handlers
  const handleSubmitGroup = async (e) => {
    e.preventDefault();
    
    if (!groupForm.name) {
      alert('Please enter a group name');
      return;
    }
    
    setIsLoading(true);
    
    try {
      const selectedDeviceIds = groupForm.deviceIds.length > 0 
        ? groupForm.deviceIds 
        : Object.entries(deviceSelections)
            .filter(([_, selected]) => selected)
            .map(([deviceId]) => deviceId);

      // Prepare tags array from comma-separated string
      const tags = typeof groupForm.tags === 'string'
        ? groupForm.tags.split(',').map(tag => tag.trim())
        : groupForm.tags;
      
      await deviceGroupsService.createGroup({
        ...groupForm,
        deviceIds: selectedDeviceIds,
        tags
      });
      
      // Reset form and refresh data
      setGroupForm({
        name: '',
        description: '',
        deviceIds: [],
        tags: []
      });
      
      setIsFormOpen(false);
      await refreshData();
    } catch (err) {
      console.error('Error creating group:', err);
      setError('Failed to create group. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendCommand = async (e) => {
    e.preventDefault();
    
    if (!selectedGroup) {
      alert('Please select a group');
      return;
    }
    
    setIsLoading(true);
    
    try {
      let payload = commandForm.payload;
      
      // Special handling for payload based on command type
      if (commandForm.command === 'mode') {
        try {
          payload = typeof commandForm.payload === 'string'
            ? JSON.parse(commandForm.payload)
            : commandForm.payload;
        } catch (err) {
          console.error('Error parsing JSON payload:', err);
          alert('Invalid JSON payload format');
          setIsLoading(false);
          return;
        }
      }
      
      const response = await deviceGroupsService.sendCommandToGroup(selectedGroup._id, {
        type: commandForm.type,
        command: commandForm.command,
        payload
      });
      
      alert(`Command sent to ${response.successCount} devices in the group`);
      
      // Reset form and close modal
      setCommandForm({
        type: 'control',
        command: 'start',
        payload: {}
      });
      
      setIsCommandFormOpen(false);
      await refreshData();
    } catch (err) {
      console.error('Error sending command:', err);
      setError('Failed to send command. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFetchCommandHistory = async () => {
    if (!selectedGroup) {
      alert('Please select a group');
      return;
    }
    
    setIsLoading(true);
    
    try {
      const history = await deviceGroupsService.getGroupCommandHistory(
        selectedGroup._id, 
        historyFilters
      );
      
      setCommandHistory(history);
      setIsCommandHistoryOpen(true);
    } catch (err) {
      console.error('Error fetching command history:', err);
      setError('Failed to fetch command history. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewCommandDetails = async (groupCommandId) => {
    setIsLoading(true);
    
    try {
      const details = await deviceGroupsService.getGroupCommandDetails(groupCommandId);
      setCommandDetails(details);
      setIsCommandDetailsOpen(true);
    } catch (err) {
      console.error('Error fetching command details:', err);
      setError('Failed to fetch command details. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleManageDevices = async () => {
    if (!selectedGroup) {
      alert('Please select a group');
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Pre-select devices that are already in the group
      const newSelections = { ...deviceSelections };
      
      if (selectedGroup.devices && selectedGroup.devices.length > 0) {
        const groupDeviceIds = selectedGroup.devices.map(d => d._id);
        
        devices.forEach(device => {
          newSelections[device._id] = groupDeviceIds.includes(device._id);
        });
      }
      
      setDeviceSelections(newSelections);
      setIsManageDevicesOpen(true);
    } catch (err) {
      console.error('Error managing devices:', err);
      setError('Failed to manage devices. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateGroupDevices = async () => {
    if (!selectedGroup) {
      alert('Please select a group');
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Get selected device IDs
      const selectedDeviceIds = Object.entries(deviceSelections)
        .filter(([_, selected]) => selected)
        .map(([deviceId]) => deviceId);
      
      // Get current group device IDs
      const currentDeviceIds = selectedGroup.devices 
        ? selectedGroup.devices.map(d => d._id) 
        : [];
      
      // Calculate devices to add and remove
      const devicesToAdd = selectedDeviceIds.filter(id => !currentDeviceIds.includes(id));
      const devicesToRemove = currentDeviceIds.filter(id => !selectedDeviceIds.includes(id));
      
      // Update group devices
      if (devicesToAdd.length > 0) {
        await deviceGroupsService.addDevicesToGroup(selectedGroup._id, devicesToAdd);
      }
      
      if (devicesToRemove.length > 0) {
        await deviceGroupsService.removeDevicesFromGroup(selectedGroup._id, devicesToRemove);
      }
      
      alert(`Group devices updated successfully`);
      setIsManageDevicesOpen(false);
      await refreshData();
    } catch (err) {
      console.error('Error updating group devices:', err);
      setError('Failed to update group devices. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteGroup = async (id) => {
    if (!window.confirm('Are you sure you want to delete this group?')) {
      return;
    }
    
    setIsLoading(true);
    
    try {
      await deviceGroupsService.deleteGroup(id);
      await refreshData();
    } catch (err) {
      console.error('Error deleting group:', err);
      setError('Failed to delete group. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendQuickCommand = async (groupId, commandType) => {
    setIsLoading(true);
    
    try {
      let response;
      
      switch (commandType) {
        case 'start':
          response = await deviceGroupsService.sendStartCommandToGroup(groupId);
          break;
        case 'stop':
          response = await deviceGroupsService.sendStopCommandToGroup(groupId);
          break;
        case 'reboot':
          response = await deviceGroupsService.sendRebootCommandToGroup(groupId);
          break;
        default:
          throw new Error(`Unknown command type: ${commandType}`);
      }
      
      alert(`${commandType} command sent to ${response.successCount} devices in the group`);
      await refreshData();
    } catch (err) {
      console.error(`Error sending ${commandType} command:`, err);
      setError(`Failed to send ${commandType} command. Please try again.`);
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function for formatting dates
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  // Get device names for display
  const getDeviceNamesInGroup = (group) => {
    if (!group.devices || group.devices.length === 0) return 'No devices';
    
    return group.devices.map(device => device.name).join(', ');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Device Groups</h1>
          <p className="mt-2 text-sm text-gray-700">
            Manage device groups and send commands to multiple devices at once
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <button 
            onClick={() => setIsFormOpen(true)} 
            className="btn-primary"
          >
            Create Group
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

      {/* Groups List */}
      <div className="card">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Available Groups</h2>
        {groups.length === 0 ? (
          <p className="text-sm text-gray-500">No device groups found. Create a group to get started.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Devices
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tags
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {groups.map((group) => (
                  <tr key={group._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {group.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {group.description || 'No description'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {group.devices ? `${group.devices.length} devices` : '0 devices'}
                      <button 
                        onClick={() => {
                          setSelectedGroup(group);
                          handleManageDevices();
                        }}
                        className="ml-2 text-xs text-blue-600 hover:text-blue-800"
                      >
                        Manage
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {group.tags && group.tags.length > 0 
                        ? group.tags.join(', ')
                        : 'No tags'
                      }
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-3">
                        <button
                          onClick={() => {
                            setSelectedGroup(group);
                            setIsCommandFormOpen(true);
                          }}
                          className="text-primary-600 hover:text-primary-900"
                        >
                          Send Command
                        </button>
                        <button
                          onClick={() => {
                            setSelectedGroup(group);
                            handleFetchCommandHistory();
                          }}
                          className="text-green-600 hover:text-green-900"
                        >
                          History
                        </button>
                        <button
                          onClick={() => handleDeleteGroup(group._id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      </div>
                      <div className="flex justify-end space-x-2 mt-2">
                        <button
                          onClick={() => handleSendQuickCommand(group._id, 'start')}
                          className="text-sm text-blue-600 hover:text-blue-900"
                        >
                          Start
                        </button>
                        <span className="text-gray-300">|</span>
                        <button
                          onClick={() => handleSendQuickCommand(group._id, 'stop')}
                          className="text-sm text-blue-600 hover:text-blue-900"
                        >
                          Stop
                        </button>
                        <span className="text-gray-300">|</span>
                        <button
                          onClick={() => handleSendQuickCommand(group._id, 'reboot')}
                          className="text-sm text-blue-600 hover:text-blue-900"
                        >
                          Reboot
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Group Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Create Device Group</h3>
            <form onSubmit={handleSubmitGroup} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Group Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={groupForm.name}
                  onChange={handleGroupFormChange}
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
                  value={groupForm.description}
                  onChange={handleGroupFormChange}
                  className="input-field mt-1"
                  rows="3"
                />
              </div>
              
              <div>
                <label htmlFor="tags" className="block text-sm font-medium text-gray-700">
                  Tags (comma-separated)
                </label>
                <input
                  type="text"
                  id="tags"
                  name="tags"
                  value={groupForm.tags}
                  onChange={handleGroupFormChange}
                  className="input-field mt-1"
                  placeholder="production, floor1, ..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Devices
                </label>
                <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-lg">
                  <div className="sticky top-0 bg-gray-50 border-b border-gray-200 px-4 py-2">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        onChange={toggleSelectAllDevices}
                        checked={Object.values(deviceSelections).every(v => v) && Object.keys(deviceSelections).length > 0}
                        className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                      />
                      <span className="ml-2 text-sm font-medium text-gray-500">Select All</span>
                    </div>
                  </div>
                  <div className="divide-y divide-gray-200">
                    {devices.map((device) => (
                      <div key={device._id} className="px-4 py-2 flex items-center hover:bg-gray-50">
                        <input
                          type="checkbox"
                          onChange={() => handleDeviceSelectionChange(device._id)}
                          checked={deviceSelections[device._id] || false}
                          className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">{device.name}</span>
                        <span className="ml-2 text-xs text-gray-500">({device.deviceSerial})</span>
                      </div>
                    ))}
                  </div>
                </div>
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
                  {isLoading ? 'Creating...' : 'Create Group'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Send Command Modal */}
      {isCommandFormOpen && selectedGroup && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Send Command to Group: {selectedGroup.name}
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              This command will be sent to all {selectedGroup.devices ? selectedGroup.devices.length : 0} devices in this group.
            </p>
            <form onSubmit={handleSendCommand} className="space-y-4">
              <div>
                <label htmlFor="type" className="block text-sm font-medium text-gray-700">
                  Command Type
                </label>
                <select
                  id="type"
                  name="type"
                  value={commandForm.type}
                  onChange={handleCommandFormChange}
                  className="input-field mt-1"
                >
                  <option value="control">Control</option>
                  <option value="management">Management</option>
                </select>
              </div>
              
              <div>
                <label htmlFor="command" className="block text-sm font-medium text-gray-700">
                  Command
                </label>
                <select
                  id="command"
                  name="command"
                  value={commandForm.command}
                  onChange={handleCommandFormChange}
                  className="input-field mt-1"
                >
                  <option value="start">Start</option>
                  <option value="stop">Stop</option>
                  <option value="reboot">Reboot</option>
                  <option value="mode">Mode Configuration</option>
                  <option value="custom">Custom Command</option>
                </select>
              </div>
              
              {commandForm.command === 'mode' && (
                <div>
                  <label htmlFor="payload" className="block text-sm font-medium text-gray-700">
                    Mode Configuration (JSON)
                  </label>
                  <textarea
                    id="payload"
                    name="payload"
                    value={typeof commandForm.payload === 'string' 
                      ? commandForm.payload 
                      : JSON.stringify(commandForm.payload, null, 2)}
                    onChange={e => setCommandForm({
                      ...commandForm,
                      payload: e.target.value
                    })}
                    className="input-field mt-1 font-mono"
                    rows="10"
                    placeholder='{"type": "INVENTORY", "antennas": [1, 2], ...}'
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Enter JSON configuration for the mode command
                  </p>
                </div>
              )}
              
              {commandForm.command === 'custom' && (
                <div>
                  <label htmlFor="customCommand" className="block text-sm font-medium text-gray-700">
                    Custom Command Name
                  </label>
                  <input
                    type="text"
                    id="customCommand"
                    value={commandForm.customCommand || ''}
                    onChange={e => setCommandForm({
                      ...commandForm,
                      command: e.target.value
                    })}
                    className="input-field mt-1"
                    placeholder="Enter custom command name"
                  />
                  
                  <label htmlFor="payload" className="block text-sm font-medium text-gray-700 mt-3">
                    Payload (JSON)
                  </label>
                  <textarea
                    id="payload"
                    name="payload"
                    value={typeof commandForm.payload === 'string'
                      ? commandForm.payload
                      : JSON.stringify(commandForm.payload, null, 2)}
                    onChange={e => setCommandForm({
                      ...commandForm,
                      payload: e.target.value
                    })}
                    className="input-field mt-1 font-mono"
                    rows="5"
                    placeholder='{}'
                  />
                </div>
              )}
              
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsCommandFormOpen(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={isLoading}
                >
                  {isLoading ? 'Sending...' : 'Send Command'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Command History Modal */}
      {isCommandHistoryOpen && selectedGroup && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-6xl w-full">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Command History: {selectedGroup.name}
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              <div>
                <label htmlFor="type" className="block text-sm font-medium text-gray-700">
                  Command Type
                </label>
                <select
                  id="type"
                  name="type"
                  value={historyFilters.type}
                  onChange={handleHistoryFilterChange}
                  className="input-field mt-1"
                >
                  <option value="">All Types</option>
                  <option value="control">Control</option>
                  <option value="management">Management</option>
                </select>
              </div>
              
              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                  Status
                </label>
                <select
                  id="status"
                  name="status"
                  value={historyFilters.status}
                  onChange={handleHistoryFilterChange}
                  className="input-field mt-1"
                >
                  <option value="">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="processing">Processing</option>
                  <option value="success">Success</option>
                  <option value="error">Error</option>
                  <option value="timed-out">Timed Out</option>
                </select>
              </div>
              
              <div>
                <label htmlFor="from" className="block text-sm font-medium text-gray-700">
                  From Date
                </label>
                <input
                  type="datetime-local"
                  id="from"
                  name="from"
                  value={historyFilters.from}
                  onChange={handleHistoryFilterChange}
                  className="input-field mt-1"
                />
              </div>
              
              <div>
                <label htmlFor="to" className="block text-sm font-medium text-gray-700">
                  To Date
                </label>
                <input
                  type="datetime-local"
                  id="to"
                  name="to"
                  value={historyFilters.to}
                  onChange={handleHistoryFilterChange}
                  className="input-field mt-1"
                />
              </div>
            </div>
            
            <div className="flex justify-end mb-4">
              <button
                onClick={handleFetchCommandHistory}
                className="btn-primary"
                disabled={isLoading}
              >
                {isLoading ? 'Loading...' : 'Apply Filters'}
              </button>
            </div>
            
            <div className="max-h-96 overflow-y-auto">
              {commandHistory.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">No command history found</p>
              ) : (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Command
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Devices
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {commandHistory.map((command) => (
                      <tr key={command.groupCommandId} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {command.command || 'Unknown'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {command.type || 'Unknown'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(command.sentAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {command.devices ? command.devices.length : 0} devices
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-col">
                            <div className="flex items-center space-x-1">
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                Success: {command.statuses.completed || 0}
                              </span>
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                                Pending: {command.statuses.pending || 0}
                              </span>
                            </div>
                            <div className="flex items-center space-x-1 mt-1">
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                                Failed: {command.statuses.failed || 0}
                              </span>
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                                Timeout: {command.statuses['timed-out'] || 0}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => handleViewCommandDetails(command.groupCommandId)}
                            className="text-primary-600 hover:text-primary-900"
                          >
                            View Details
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            
            <div className="flex justify-end mt-4">
              <button
                onClick={() => setIsCommandHistoryOpen(false)}
                className="btn-secondary"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Command Details Modal */}
      {isCommandDetailsOpen && commandDetails && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-6xl w-full">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Command Details: {commandDetails.command}
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-sm text-gray-700">
                  <span className="font-medium">Group Command ID:</span> {commandDetails.groupCommandId}
                </p>
                <p className="text-sm text-gray-700 mt-1">
                  <span className="font-medium">Type:</span> {commandDetails.type}
                </p>
                <p className="text-sm text-gray-700 mt-1">
                  <span className="font-medium">Sent At:</span> {formatDate(commandDetails.sentAt)}
                </p>
              </div>
              
              <div>
                <p className="text-sm text-gray-700">
                  <span className="font-medium">Status Summary:</span>
                </p>
                <div className="flex flex-wrap gap-2 mt-1">
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                    Total: {commandDetails.statusSummary.total || 0}
                  </span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                    Pending: {commandDetails.statusSummary.pending || 0}
                  </span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                    Processing: {commandDetails.statusSummary.processing || 0}
                  </span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                    Success: {commandDetails.statusSummary.success || 0}
                  </span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                    Error: {commandDetails.statusSummary.error || 0}
                  </span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                    Timeout: {commandDetails.statusSummary['timed-out'] || 0}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="mb-4">
              <p className="text-sm font-medium text-gray-700 mb-1">Command Payload:</p>
              <div className="bg-gray-50 p-3 rounded-md">
                <pre className="text-xs text-gray-700 font-mono overflow-x-auto">
                  {JSON.stringify(commandDetails.payload, null, 2)}
                </pre>
              </div>
            </div>
            
            <div className="max-h-96 overflow-y-auto">
              <p className="text-sm font-medium text-gray-700 mb-2">Device Command Details:</p>
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Device Serial
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Command ID
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created At
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Executed At
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {commandDetails.commands.map((cmd) => (
                    <tr key={cmd.commandId} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {cmd.deviceSerial}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {cmd.commandId}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          cmd.status === 'success' ? 'bg-green-100 text-green-800' :
                          cmd.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          cmd.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                          cmd.status === 'error' ? 'bg-red-100 text-red-800' :
                          cmd.status === 'timed-out' ? 'bg-gray-100 text-gray-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {cmd.status || 'unknown'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(cmd.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {cmd.executedAt ? formatDate(cmd.executedAt) : 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="flex justify-end mt-4">
              <button
                onClick={() => setIsCommandDetailsOpen(false)}
                className="btn-secondary"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manage Devices Modal */}
      {isManageDevicesOpen && selectedGroup && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Manage Devices in Group: {selectedGroup.name}
            </h3>
            
            <div className="mb-4">
              <div className="sticky top-0 bg-gray-50 border-b border-gray-200 px-4 py-2 rounded-t-lg">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    onChange={toggleSelectAllDevices}
                    checked={Object.values(deviceSelections).every(v => v) && Object.keys(deviceSelections).length > 0}
                    className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                  />
                  <span className="ml-2 text-sm font-medium text-gray-500">Select All</span>
                </div>
              </div>
              <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-b-lg">
                <div className="divide-y divide-gray-200">
                  {devices.map((device) => (
                    <div key={device._id} className="px-4 py-2 flex items-center hover:bg-gray-50">
                      <input
                        type="checkbox"
                        onChange={() => handleDeviceSelectionChange(device._id)}
                        checked={deviceSelections[device._id] || false}
                        className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">{device.name}</span>
                      <span className="ml-2 text-xs text-gray-500">({device.deviceSerial})</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={() => setIsManageDevicesOpen(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateGroupDevices}
                className="btn-primary"
                disabled={isLoading}
              >
                {isLoading ? 'Updating...' : 'Update Devices'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DeviceGroups;medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-