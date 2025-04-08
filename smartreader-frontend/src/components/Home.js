import React, { useEffect, useState } from 'react';
import { deviceService } from '../services/api';

function Home() {
  const [deviceStats, setDeviceStats] = useState({
    total: 0,
    online: 0,
    offline: 0,
    unknown: 0
  });
  
  const [recentEvents, setRecentEvents] = useState([
    { id: 1, device: 'Device A', event: 'Status Update', time: '5 min ago', status: 'success' },
    { id: 2, device: 'Device B', event: 'Configuration Change', time: '10 min ago', status: 'warning' },
    { id: 3, device: 'Device C', event: 'Error Detected', time: '15 min ago', status: 'error' },
  ]);

  useEffect(() => {
    const fetchDeviceStats = async () => {
      try {
        const devices = await deviceService.getDevices();
        
        const stats = {
          total: devices.length,
          online: devices.filter(d => d.communicationStatus === 'online').length,
          offline: devices.filter(d => d.communicationStatus === 'offline').length,
          unknown: devices.filter(d => !d.communicationStatus || d.communicationStatus === 'unknown').length
        };
        
        setDeviceStats(stats);
      } catch (error) {
        console.error('Error fetching device stats:', error);
      }
    };
    
    fetchDeviceStats();
    
    // Refresh stats every 30 seconds
    const intervalId = setInterval(fetchDeviceStats, 30000);
    
    return () => clearInterval(intervalId);
  }, []);

  const stats = [
    { 
      name: 'Total Devices', 
      value: deviceStats.total.toString(), 
      change: '+0', 
      changeType: 'neutral' 
    },
    { 
      name: 'Online Devices', 
      value: deviceStats.online.toString(), 
      change: '+0', 
      changeType: 'increase' 
    },
    { 
      name: 'Offline Devices', 
      value: deviceStats.offline.toString(), 
      change: '+0', 
      changeType: 'decrease' 
    },
    { 
      name: 'Status Unknown', 
      value: deviceStats.unknown.toString(), 
      change: '0', 
      changeType: 'neutral' 
    },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
          <p className="mt-2 text-sm text-gray-700">
            Welcome to the SmartReader Cloud Dashboard. Here's what's happening with your devices.
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <button className="btn-primary">
            Add New Device
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.name} className="card">
            <dt className="text-sm font-medium text-gray-500 truncate">{stat.name}</dt>
            <dd className="mt-1 flex items-baseline justify-between md:block lg:flex">
              <div className="flex items-baseline text-2xl font-semibold text-primary-600">
                {stat.value}
              </div>
              <div className={`inline-flex items-baseline px-2.5 py-0.5 rounded-full text-sm font-medium ${
                stat.changeType === 'increase' ? 'bg-green-100 text-green-800' : 
                stat.changeType === 'decrease' ? 'bg-red-100 text-red-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {stat.change}
              </div>
            </dd>
          </div>
        ))}
      </div>

      {/* Device Status Summary */}
      <div className="card">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Device Status Summary</h2>
        
        <div className="relative">
          <div className="overflow-hidden h-4 mb-4 text-xs flex rounded bg-gray-200">
            {deviceStats.online > 0 && (
              <div 
                style={{ width: `${(deviceStats.online / deviceStats.total) * 100}%` }} 
                className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-green-500"
              >
                {deviceStats.online}
              </div>
            )}
            {deviceStats.offline > 0 && (
              <div 
                style={{ width: `${(deviceStats.offline / deviceStats.total) * 100}%` }} 
                className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-red-500"
              >
                {deviceStats.offline}
              </div>
            )}
            {deviceStats.unknown > 0 && (
              <div 
                style={{ width: `${(deviceStats.unknown / deviceStats.total) * 100}%` }} 
                className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-gray-500"
              >
                {deviceStats.unknown}
              </div>
            )}
          </div>
        </div>
        
        <div className="flex justify-between text-sm text-gray-600">
          <div className="flex items-center">
            <div className="h-3 w-3 rounded-full bg-green-500 mr-2"></div>
            <span>Online: {deviceStats.online}</span>
          </div>
          <div className="flex items-center">
            <div className="h-3 w-3 rounded-full bg-red-500 mr-2"></div>
            <span>Offline: {deviceStats.offline}</span>
          </div>
          <div className="flex items-center">
            <div className="h-3 w-3 rounded-full bg-gray-500 mr-2"></div>
            <span>Unknown: {deviceStats.unknown}</span>
          </div>
        </div>
      </div>

      {/* Recent Events */}
      <div className="card">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Recent Events</h2>
        <div className="flow-root">
          <ul className="-my-5 divide-y divide-gray-200">
            {recentEvents.map((event) => (
              <li key={event.id} className="py-4">
                <div className="flex items-center space-x-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {event.device}
                    </p>
                    <p className="text-sm text-gray-500 truncate">{event.event}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`status-badge ${
                      event.status === 'success' ? 'status-badge-online' :
                      event.status === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                      'status-badge-offline'
                    }`}>
                      {event.status}
                    </span>
                    <span className="text-sm text-gray-500">{event.time}</span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
        <div className="mt-6">
          <button className="btn-secondary w-full">
            View All Events
          </button>
        </div>
      </div>
      
      {/* Communication Status Information */}
      <div className="card">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Communication Status Information</h2>
        <div className="prose prose-sm text-gray-700">
          <p>
            Device communication status is determined based on the last communication time and the configured timeout for each device.
          </p>
          <ul className="mt-2 space-y-1">
            <li className="flex items-center">
              <div className="h-3 w-3 rounded-full bg-green-500 mr-2"></div>
              <span><strong>Online:</strong> Device has communicated within its timeout period</span>
            </li>
            <li className="flex items-center">
              <div className="h-3 w-3 rounded-full bg-red-500 mr-2"></div>
              <span><strong>Offline:</strong> Device hasn't communicated for longer than its timeout period</span>
            </li>
            <li className="flex items-center">
              <div className="h-3 w-3 rounded-full bg-gray-500 mr-2"></div>
              <span><strong>Unknown:</strong> Device has never communicated or status cannot be determined</span>
            </li>
          </ul>
          <p className="mt-4">
            Each device can have a custom communication timeout setting. The default timeout is 5 minutes (300 seconds).
          </p>
        </div>
      </div>
    </div>
  );
}

export default Home;