import React, { useEffect, useState } from 'react';
import { deviceService } from '../services/api';

function Devices() {
  const [devices, setDevices] = useState([]);
  const [newDevice, setNewDevice] = useState({ 
    name: '', 
    deviceSerial: '', 
    location: '', 
    status: '',
    communicationTimeout: 300, // Default to 5 minutes (300 seconds)
    modeConfig: {
      type: 'INVENTORY',
      antennas: [1, 2],
      antennaZone: 'CABINET',
      transmitPower: 17.25
    }
  });
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedDevices, setSelectedDevices] = useState([]);
  const [filterText, setFilterText] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [editingDevice, setEditingDevice] = useState(null);
  const [isEditFormOpen, setIsEditFormOpen] = useState(false);
  const [isTimeoutModalOpen, setIsTimeoutModalOpen] = useState(false);
  const [timeoutDevice, setTimeoutDevice] = useState(null);
  const [timeoutValue, setTimeoutValue] = useState(300);

  const fetchDevices = async () => {
    try {
      let data;
      if (statusFilter) {
        data = await deviceService.getDevicesByStatus(statusFilter);
      } else {
        data = await deviceService.getDevices();
      }
      setDevices(data);
    } catch (error) {
      console.error('Error fetching devices:', error);
    }
  };

  const addDevice = async (e) => {
    e.preventDefault();
    try {
      const response = await deviceService.post('/devices', newDevice);
      setDevices([...devices, response.data]);
      setNewDevice({ 
        name: '', 
        deviceSerial: '', 
        location: '', 
        status: '',
        communicationTimeout: 300, // Default to 5 minutes (300 seconds)
        modeConfig: {
          type: 'INVENTORY',
          antennas: [1, 2],
          antennaZone: 'CABINET',
          transmitPower: 17.25
        }
      });
      setIsFormOpen(false);
    } catch (error) {
      console.error('Error adding device:', error);
    }
  };

  const deleteDevice = async (id) => {
    try {
      await deviceService.delete(`/devices/${id}`);
      setDevices(devices.filter(device => device.id !== id));
    } catch (error) {
      console.error('Error deleting device:', error);
    }
  };

  const handleEditDevice = (device) => {
    setEditingDevice({
      ...device,
      id: device._id, // Ensure the id is properly set from _id
      modeConfig: {
        ...device.modeConfig,
        antennas: Array.isArray(device.modeConfig.antennas) 
          ? device.modeConfig.antennas 
          : [device.modeConfig.antennas]
      }
    });
    setIsEditFormOpen(true);
  };

  const updateDevice = async (e) => {
    e.preventDefault();
    try {
      // Use the _id if it exists, otherwise fall back to id
      const deviceId = editingDevice._id || editingDevice.id;
      if (!deviceId) {
        console.error('No device ID found for update');
        return;
      }
      
      const response = await deviceService.put(`/devices/${deviceId}`, editingDevice);
      setDevices(devices.map(device => 
        device._id === deviceId ? response.data : device
      ));
      setIsEditFormOpen(false);
      setEditingDevice(null);
    } catch (error) {
      console.error('Error updating device:', error);
    }
  };

  const handleDeviceSelection = (deviceSerial) => {
    setSelectedDevices(prev => {
      if (prev.includes(deviceSerial)) {
        return prev.filter(serial => serial !== deviceSerial);
      }
      return [...prev, deviceSerial];
    });
  };

  const openTimeoutModal = (device) => {
    setTimeoutDevice(device);
    setTimeoutValue(device.communicationTimeout || 300);
    setIsTimeoutModalOpen(true);
  };

  const updateCommunicationTimeout = async () => {
    if (!timeoutDevice) return;
    
    try {
      await deviceService.updateCommunicationTimeout(timeoutDevice.deviceSerial, timeoutValue);
      // Update the device in the local state
      setDevices(devices.map(device => 
        device.deviceSerial === timeoutDevice.deviceSerial 
          ? { ...device, communicationTimeout: timeoutValue } 
          : device
      ));
      setIsTimeoutModalOpen(false);
      setTimeoutDevice(null);
    } catch (error) {
      console.error('Error updating communication timeout:', error);
    }
  };

  const sendStartCommand = async (deviceSerial, modeConfig) => {
    try {
      // First send mode command
      await deviceService.sendModeCommand(deviceSerial, modeConfig);
      // Then send start command
      const response = await deviceService.sendStartCommand(deviceSerial);
      console.log(`Start command sent to device ${deviceSerial}:`, response);
      fetchDevices();
    } catch (error) {
      console.error('Error sending start command:', error);
    }
  };

  const sendStopCommand = async (deviceSerial) => {
    try {
      const response = await deviceService.sendStopCommand(deviceSerial);
      console.log(`Stop command sent to device ${deviceSerial}:`, response);
      fetchDevices();
    } catch (error) {
      console.error('Error sending stop command:', error);
    }
  };

  const sendModeCommand = async (deviceSerial, modeConfig) => {
    try {
      const response = await deviceService.sendModeCommand(deviceSerial, modeConfig);
      console.log(`Mode command sent to device ${deviceSerial}:`, response);
      fetchDevices();
    } catch (error) {
      console.error('Error sending mode command:', error);
    }
  };

  const sendRebootCommand = async (deviceSerial) => {
    try {
      const response = await deviceService.sendRebootCommand(deviceSerial);
      console.log(`Reboot command sent to device ${deviceSerial}:`, response);
      fetchDevices();
    } catch (error) {
      console.error('Error sending reboot command:', error);
    }
  };

  const sendCommandToSelected = async (command) => {
    try {
      if (command === 'start') {
        await Promise.all(selectedDevices.map(deviceSerial => {
          const device = devices.find(d => d.deviceSerial === deviceSerial);
          return sendStartCommand(deviceSerial, device.modeConfig);
        }));
      } else if (command === 'stop') {
        await Promise.all(selectedDevices.map(deviceSerial => sendStopCommand(deviceSerial)));
      } else if (command === 'reboot') {
        await Promise.all(selectedDevices.map(deviceSerial => sendRebootCommand(deviceSerial)));
      }
      setSelectedDevices([]); // Clear selection after sending commands
    } catch (error) {
      console.error(`Error sending ${command} commands:`, error);
    }
  };
  
  const formatTimeAgo = (dateString) => {
    if (!dateString) return 'Never';
    
    const date = new Date(dateString);
    const now = new Date();
    const secondsAgo = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (secondsAgo < 60) return `${secondsAgo} seconds ago`;
    if (secondsAgo < 3600) return `${Math.floor(secondsAgo / 60)} minutes ago`;
    if (secondsAgo < 86400) return `${Math.floor(secondsAgo / 3600)} hours ago`;
    return `${Math.floor(secondsAgo / 86400)} days ago`;
  };
  
  const getStatusClass = (device) => {
    if (!device) return 'bg-gray-100 text-gray-800';
    
    if (!device.communicationStatus || device.communicationStatus === 'unknown') {
      return 'bg-gray-100 text-gray-800';
    }
    
    if (device.communicationStatus === 'offline') {
      return 'bg-red-100 text-red-800';
    }
    
    return 'bg-green-100 text-green-800';
  };

  useEffect(() => {
    fetchDevices();
    
    // Refresh the device list every 30 seconds to update status
    const intervalId = setInterval(fetchDevices, 30000);
    
    return () => clearInterval(intervalId);
  }, [statusFilter]);

  const filteredDevices = devices.filter(device => 
    device.name?.toLowerCase().includes(filterText.toLowerCase()) ||
    device.deviceSerial?.toLowerCase().includes(filterText.toLowerCase()) ||
    device.location?.toLowerCase().includes(filterText.toLowerCase())
  );
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Devices</h1>
          <p className="mt-2 text-sm text-gray-700">
            Manage and monitor your connected devices
          </p>
        </div>
        <div className="mt-4 sm:mt-0 space-x-3">
          <button 
            onClick={() => setIsFormOpen(true)} 
            className="btn-primary"
          >
            Add Device
          </button>
          {selectedDevices.length > 0 && (
            <div className="space-x-3">
              <button
                onClick={() => sendCommandToSelected('start')}
                className="btn-secondary"
              >
                Start Selected ({selectedDevices.length})
              </button>
              <button
                onClick={() => sendCommandToSelected('stop')}
                className="btn-secondary"
              >
                Stop Selected ({selectedDevices.length})
              </button>
              <button
                onClick={() => sendCommandToSelected('reboot')}
                className="btn-secondary"
              >
                Reboot Selected ({selectedDevices.length})
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row items-center gap-4">
        <div className="flex-1 w-full">
          <input
            type="text"
            placeholder="Filter devices..."
            className="input-field w-full"
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
          />
        </div>
        <div className="w-full sm:w-auto">
          <select 
            className="input-field w-full"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="online">Online</option>
            <option value="offline">Offline</option>
            <option value="unknown">Unknown</option>
          </select>
        </div>
      </div>

      {/* Add Device Form */}
      {isFormOpen && (
        <div className="card">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Add New Device</h2>
          <form onSubmit={addDevice} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Device Name
              </label>
              <input
                type="text"
                id="name"
                className="input-field mt-1"
                placeholder="Enter device name"
                value={newDevice.name}
                onChange={(e) => setNewDevice({ ...newDevice, name: e.target.value })}
                required
              />
            </div>
            <div>
              <label htmlFor="deviceSerial" className="block text-sm font-medium text-gray-700">
                Serial Number
              </label>
              <input
                type="text"
                id="deviceSerial"
                className="input-field mt-1"
                placeholder="Enter serial number"
                value={newDevice.deviceSerial}
                onChange={(e) => setNewDevice({ ...newDevice, deviceSerial: e.target.value })}
                required
              />
            </div>
            <div>
              <label htmlFor="location" className="block text-sm font-medium text-gray-700">
                Location
              </label>
              <input
                type="text"
                id="location"
                className="input-field mt-1"
                placeholder="Enter device location"
                value={newDevice.location}
                onChange={(e) => setNewDevice({ ...newDevice, location: e.target.value })}
                required
              />
            </div>
            <div>
              <label htmlFor="communicationTimeout" className="block text-sm font-medium text-gray-700">
                Communication Timeout (seconds)
              </label>
              <input
                type="number"
                id="communicationTimeout"
                className="input-field mt-1"
                placeholder="Enter timeout in seconds"
                value={newDevice.communicationTimeout}
                onChange={(e) => setNewDevice({ 
                  ...newDevice, 
                  communicationTimeout: parseInt(e.target.value) || 300
                })}
                min="1"
                required
              />
              <p className="mt-1 text-xs text-gray-500">
                Time after which the device will be considered offline if no communication is received.
              </p>
            </div>
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                Status
              </label>
              <select
                id="status"
                className="input-field mt-1"
                value={newDevice.status}
                onChange={(e) => setNewDevice({ ...newDevice, status: e.target.value })}
                required
              >
                <option value="">Select status</option>
                <option value="online">Online</option>
                <option value="offline">Offline</option>
                <option value="maintenance">Maintenance</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Mode Configuration</label>
              <div className="space-y-2 mt-1">
                <div>
                  <label className="text-xs text-gray-500">Type</label>
                  <input
                    type="text"
                    className="input-field mt-1"
                    value={newDevice.modeConfig.type}
                    onChange={(e) => setNewDevice({
                      ...newDevice,
                      modeConfig: { ...newDevice.modeConfig, type: e.target.value }
                    })}
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500">Antennas (comma-separated)</label>
                  <input
                    type="text"
                    className="input-field mt-1"
                    value={newDevice.modeConfig.antennas.join(',')}
                    onChange={(e) => setNewDevice({
                      ...newDevice,
                      modeConfig: {
                        ...newDevice.modeConfig,
                        antennas: e.target.value.split(',').map(Number).filter(n => !isNaN(n))
                      }
                    })}
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500">Antenna Zone</label>
                  <input
                    type="text"
                    className="input-field mt-1"
                    value={newDevice.modeConfig.antennaZone}
                    onChange={(e) => setNewDevice({
                      ...newDevice,
                      modeConfig: { ...newDevice.modeConfig, antennaZone: e.target.value }
                    })}
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500">Transmit Power</label>
                  <input
                    type="number"
                    step="0.25"
                    className="input-field mt-1"
                    value={newDevice.modeConfig.transmitPower}
                    onChange={(e) => setNewDevice({
                      ...newDevice,
                      modeConfig: { ...newDevice.modeConfig, transmitPower: parseFloat(e.target.value) }
                    })}
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end space-x-3">
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
              >
                Add Device
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Edit Device Form */}
      {isEditFormOpen && editingDevice && (
        <div className="card">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Edit Device</h2>
          <form onSubmit={updateDevice} className="space-y-4">
            <div>
              <label htmlFor="edit-name" className="block text-sm font-medium text-gray-700">
                Device Name
              </label>
              <input
                type="text"
                id="edit-name"
                className="input-field mt-1"
                placeholder="Enter device name"
                value={editingDevice.name}
                onChange={(e) => setEditingDevice({ ...editingDevice, name: e.target.value })}
                required
              />
            </div>
            <div>
              <label htmlFor="edit-serial" className="block text-sm font-medium text-gray-700">
                Serial Number
              </label>
              <input
                type="text"
                id="edit-serial"
                className="input-field mt-1"
                placeholder="Enter serial number"
                value={editingDevice.deviceSerial}
                onChange={(e) => setEditingDevice({ ...editingDevice, deviceSerial: e.target.value })}
                required
                disabled
              />
            </div>
            <div>
              <label htmlFor="edit-location" className="block text-sm font-medium text-gray-700">
                Location
              </label>
              <input
                type="text"
                id="edit-location"
                className="input-field mt-1"
                placeholder="Enter device location"
                value={editingDevice.location}
                onChange={(e) => setEditingDevice({ ...editingDevice, location: e.target.value })}
                required
              />
            </div>
            <div>
              <label htmlFor="edit-timeout" className="block text-sm font-medium text-gray-700">
                Communication Timeout (seconds)
              </label>
              <input
                type="number"
                id="edit-timeout"
                className="input-field mt-1"
                placeholder="Enter timeout in seconds"
                value={editingDevice.communicationTimeout || 300}
                onChange={(e) => setEditingDevice({ 
                  ...editingDevice, 
                  communicationTimeout: parseInt(e.target.value) || 300
                })}
                min="1"
                required
              />
              <p className="mt-1 text-xs text-gray-500">
                Time after which the device will be considered offline if no communication is received.
              </p>
            </div>
            <div>
              <label htmlFor="edit-status" className="block text-sm font-medium text-gray-700">
                Status
              </label>
              <select
                id="edit-status"
                className="input-field mt-1"
                value={editingDevice.status}
                onChange={(e) => setEditingDevice({ ...editingDevice, status: e.target.value })}
                required
              >
                <option value="">Select status</option>
                <option value="online">Online</option>
                <option value="offline">Offline</option>
                <option value="maintenance">Maintenance</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Mode Configuration</label>
              <div className="space-y-2 mt-1">
                <div>
                  <label className="text-xs text-gray-500">Type</label>
                  <input
                    type="text"
                    className="input-field mt-1"
                    value={editingDevice.modeConfig.type}
                    onChange={(e) => setEditingDevice({
                      ...editingDevice,
                      modeConfig: { ...editingDevice.modeConfig, type: e.target.value }
                    })}
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500">Antennas (comma-separated)</label>
                  <input
                    type="text"
                    className="input-field mt-1"
                    value={editingDevice.modeConfig.antennas.join(',')}
                    onChange={(e) => setEditingDevice({
                      ...editingDevice,
                      modeConfig: {
                        ...editingDevice.modeConfig,
                        antennas: e.target.value.split(',').map(Number).filter(n => !isNaN(n))
                      }
                    })}
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500">Antenna Zone</label>
                  <input
                    type="text"
                    className="input-field mt-1"
                    value={editingDevice.modeConfig.antennaZone}
                    onChange={(e) => setEditingDevice({
                      ...editingDevice,
                      modeConfig: { ...editingDevice.modeConfig, antennaZone: e.target.value }
                    })}
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500">Transmit Power</label>
                  <input
                    type="number"
                    step="0.25"
                    className="input-field mt-1"
                    value={editingDevice.modeConfig.transmitPower}
                    onChange={(e) => setEditingDevice({
                      ...editingDevice,
                      modeConfig: { ...editingDevice.modeConfig, transmitPower: parseFloat(e.target.value) }
                    })}
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => {
                  setIsEditFormOpen(false);
                  setEditingDevice(null);
                }}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary"
              >
                Save Changes
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Communication Timeout Modal */}
      {isTimeoutModalOpen && timeoutDevice && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Update Communication Timeout</h3>
            <p className="text-sm text-gray-500 mb-4">
              Set the time (in seconds) after which the device will be considered offline if no communication is received.
            </p>
            <div className="mb-4">
              <label htmlFor="timeout-value" className="block text-sm font-medium text-gray-700 mb-1">
                Timeout (seconds)
              </label>
              <input
                type="number"
                id="timeout-value"
                className="input-field w-full"
                value={timeoutValue}
                onChange={(e) => setTimeoutValue(parseInt(e.target.value) || 300)}
                min="1"
              />
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setIsTimeoutModalOpen(false);
                  setTimeoutDevice(null);
                }}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={updateCommunicationTimeout}
                className="btn-primary"
              >
                Update
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Devices Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filteredDevices.map((device) => (
          <div 
            key={device._id || device.id} 
            className={`card ${selectedDevices.includes(device.deviceSerial) ? 'ring-2 ring-blue-500' : ''}`}
          >
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={selectedDevices.includes(device.deviceSerial)}
                    onChange={() => handleDeviceSelection(device.deviceSerial)}
                    className="h-4 w-4 text-blue-600 rounded border-gray-300"
                  />
                  <h3 className="text-lg font-medium text-gray-900">{device.name}</h3>
                </div>
                <p className="mt-1 text-sm text-gray-500">Serial: {device.deviceSerial}</p>
              </div>
              <span className={`status-badge ${getStatusClass(device)}`}>
                {device.communicationStatus || 'Unknown'}
              </span>
            </div>
            <div className="mt-4 space-y-2">
              <p className="text-sm text-gray-500">
                <span className="font-medium">Location:</span> {device.location}
              </p>
              <p className="text-sm text-gray-500">
                <span className="font-medium">Last Communication:</span> {formatTimeAgo(device.lastSeen)}
              </p>
              <p className="text-sm text-gray-500">
                <span className="font-medium">Timeout:</span> {device.communicationTimeout || 300} seconds
                <button 
                  onClick={() => openTimeoutModal(device)}
                  className="ml-2 text-xs text-blue-600 hover:text-blue-800"
                >
                  Edit
                </button>
              </p>
            </div>
            <div className="mt-6 flex justify-between">
              <button
                onClick={() => handleEditDevice(device)}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                Edit
              </button>
              <div className="space-x-3">
                <button
                  onClick={() => deleteDevice(device._id || device.id)}
                  className="text-red-600 hover:text-red-800 text-sm font-medium"
                >
                  Delete
                </button>
                <button
                  onClick={() => sendStartCommand(device.deviceSerial, device.modeConfig)}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  Start
                </button>
                <button
                  onClick={() => sendStopCommand(device.deviceSerial)}
                  className="text-red-600 hover:text-red-800 text-sm font-medium"
                >
                  Stop
                </button>
                <button
                  onClick={() => sendModeCommand(device.deviceSerial, device.modeConfig)}
                  className="text-green-600 hover:text-green-800 text-sm font-medium"
                >
                  Update Mode
                </button>
                <button
                  onClick={() => sendRebootCommand(device.deviceSerial)}
                  className="text-yellow-600 hover:text-yellow-800 text-sm font-medium"
                >
                  Reboot
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Devices;