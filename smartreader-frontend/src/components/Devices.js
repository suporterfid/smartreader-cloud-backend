import React, { useEffect, useState } from 'react';
import { deviceService } from '../services/api';

function Devices() {
  const [devices, setDevices] = useState([]);
  const [newDevice, setNewDevice] = useState({ 
    name: '', 
    serial: '', 
    location: '', 
    status: '',
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

  const fetchDevices = async () => {
    try {
      const data = await deviceService.getDevices();
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
        serial: '', 
        location: '', 
        status: '',
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

  const handleDeviceSelection = (deviceSerial) => {
    setSelectedDevices(prev => {
      if (prev.includes(deviceSerial)) {
        return prev.filter(serial => serial !== deviceSerial);
      }
      return [...prev, deviceSerial];
    });
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
          const device = devices.find(d => d.serial === deviceSerial);
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

  useEffect(() => {
    fetchDevices();
  }, []);

  const filteredDevices = devices.filter(device => 
    device.name.toLowerCase().includes(filterText.toLowerCase()) ||
    device.serial.toLowerCase().includes(filterText.toLowerCase()) ||
    device.location.toLowerCase().includes(filterText.toLowerCase())
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
      <div className="flex items-center space-x-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Filter devices..."
            className="input-field w-full"
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
          />
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
              <label htmlFor="serial" className="block text-sm font-medium text-gray-700">
                Serial Number
              </label>
              <input
                type="text"
                id="serial"
                className="input-field mt-1"
                placeholder="Enter serial number"
                value={newDevice.serial}
                onChange={(e) => setNewDevice({ ...newDevice, serial: e.target.value })}
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

      {/* Devices Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filteredDevices.map((device) => (
          <div key={device.id} className={`card ${selectedDevices.includes(device.serial) ? 'ring-2 ring-blue-500' : ''}`}>
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={selectedDevices.includes(device.serial)}
                    onChange={() => handleDeviceSelection(device.serial)}
                    className="h-4 w-4 text-blue-600 rounded border-gray-300"
                  />
                  <h3 className="text-lg font-medium text-gray-900">{device.name}</h3>
                </div>
                <p className="mt-1 text-sm text-gray-500">Serial: {device.serial}</p>
              </div>
              <span className={`status-badge ${
                device.status === 'online' ? 'status-badge-online' :
                device.status === 'offline' ? 'status-badge-offline' :
                'bg-yellow-100 text-yellow-800'
              }`}>
                {device.status}
              </span>
            </div>
            <div className="mt-4">
              <p className="text-sm text-gray-500">
                <span className="font-medium">Location:</span> {device.location}
              </p>
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => deleteDevice(device.id)}
                className="text-red-600 hover:text-red-800 text-sm font-medium"
              >
                Delete
              </button>
              <div className="space-x-3">
                <button
                  onClick={() => sendStartCommand(device.serial, device.modeConfig)}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  Start
                </button>
                <button
                  onClick={() => sendStopCommand(device.serial)}
                  className="text-red-600 hover:text-red-800 text-sm font-medium"
                >
                  Stop
                </button>
                <button
                  onClick={() => sendModeCommand(device.serial, device.modeConfig)}
                  className="text-green-600 hover:text-green-800 text-sm font-medium"
                >
                  Update Mode
                </button>
                <button
                  onClick={() => sendRebootCommand(device.serial)}
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
