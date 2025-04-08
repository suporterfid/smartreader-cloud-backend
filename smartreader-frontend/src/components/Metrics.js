import React, { useEffect, useState } from 'react';
import { Bar, Line, Pie } from 'react-chartjs-2';
import axios from 'axios';
import { deviceService } from '../services/api';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

function Metrics() {
  const [metrics, setMetrics] = useState([]);
  const [timeRange, setTimeRange] = useState('24h');
  const [deviceStats, setDeviceStats] = useState({
    total: 0,
    online: 0,
    offline: 0,
    unknown: 0
  });
  const [offlineDevices, setOfflineDevices] = useState([]);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const response = await axios.get(`/api/metrics?range=${timeRange}`);
        setMetrics(response.data);
      } catch (error) {
        console.error('Error fetching metrics:', error);
      }
    };
    
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
        
        // Get list of offline devices
        const offline = devices.filter(d => d.communicationStatus === 'offline');
        setOfflineDevices(offline);
      } catch (error) {
        console.error('Error fetching device stats:', error);
      }
    };

    fetchMetrics();
    fetchDeviceStats();
    
    // Refresh data every 30 seconds
    const intervalId = setInterval(() => {
      fetchMetrics();
      fetchDeviceStats();
    }, 30000);
    
    return () => clearInterval(intervalId);
  }, [timeRange]);

  const summaryStats = [
    { name: 'Average Response Time', value: '235ms', change: '-12ms', changeType: 'decrease' },
    { name: 'Success Rate', value: '99.8%', change: '+0.2%', changeType: 'increase' },
    { name: 'Total Requests', value: '45.2k', change: '+2.3k', changeType: 'increase' },
    { name: 'Error Rate', value: '0.2%', change: '-0.1%', changeType: 'decrease' },
  ];

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
      },
      x: {
        grid: {
          display: false,
        },
      },
    },
  };
  
  const pieChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
      },
    },
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">System Metrics</h1>
          <p className="mt-2 text-sm text-gray-700">
            Monitor your system's performance and health
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="input-field"
          >
            <option value="1h">Last Hour</option>
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
          </select>
        </div>
      </div>

      {/* Device Communication Status Chart */}
      <div className="card">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Device Communication Status</h3>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="h-64">
            <Pie
              data={{
                labels: ['Online', 'Offline', 'Unknown'],
                datasets: [
                  {
                    label: 'Devices',
                    data: [deviceStats.online, deviceStats.offline, deviceStats.unknown],
                    backgroundColor: [
                      'rgba(52, 211, 153, 0.8)',  // Green for online
                      'rgba(239, 68, 68, 0.8)',   // Red for offline
                      'rgba(156, 163, 175, 0.8)', // Gray for unknown
                    ],
                    borderColor: [
                      'rgb(52, 211, 153)',
                      'rgb(239, 68, 68)',
                      'rgb(156, 163, 175)',
                    ],
                    borderWidth: 1,
                  },
                ],
              }}
              options={pieChartOptions}
            />
          </div>
          <div>
            <h4 className="font-medium text-gray-700 mb-2">Communication Status Summary</h4>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Online Devices</span>
                  <span className="font-medium text-gray-900">{deviceStats.online}</span>
                </div>
                <div className="mt-1 w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full" 
                    style={{ width: `${deviceStats.total ? (deviceStats.online / deviceStats.total) * 100 : 0}%` }}
                  ></div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Offline Devices</span>
                  <span className="font-medium text-gray-900">{deviceStats.offline}</span>
                </div>
                <div className="mt-1 w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-red-500 h-2 rounded-full" 
                    style={{ width: `${deviceStats.total ? (deviceStats.offline / deviceStats.total) * 100 : 0}%` }}
                  ></div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Unknown Status</span>
                  <span className="font-medium text-gray-900">{deviceStats.unknown}</span>
                </div>
                <div className="mt-1 w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-gray-500 h-2 rounded-full" 
                    style={{ width: `${deviceStats.total ? (deviceStats.unknown / deviceStats.total) * 100 : 0}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Offline Devices List */}
      {offlineDevices.length > 0 && (
        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Offline Devices</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Device Name
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Serial
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Seen
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Timeout
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {offlineDevices.map((device) => (
                  <tr key={device._id || device.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {device.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {device.deviceSerial}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatTimeAgo(device.lastSeen)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {device.communicationTimeout || 300} seconds
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {summaryStats.map((stat) => (
          <div key={stat.name} className="card">
            <dt className="text-sm font-medium text-gray-500 truncate">{stat.name}</dt>
            <dd className="mt-1 flex items-baseline justify-between md:block lg:flex">
              <div className="flex items-baseline text-2xl font-semibold text-primary-600">
                {stat.value}
              </div>
              <div className={`inline-flex items-baseline px-2.5 py-0.5 rounded-full text-sm font-medium ${
                stat.changeType === 'increase' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {stat.change}
              </div>
            </dd>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Response Time Chart */}
        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Response Time</h3>
          <div className="h-80">
            <Line
              data={{
                labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                datasets: [
                  {
                    label: 'Average Response Time (ms)',
                    data: [220, 235, 240, 230, 225, 235, 235],
                    borderColor: 'rgb(14, 165, 233)',
                    backgroundColor: 'rgba(14, 165, 233, 0.5)',
                    tension: 0.4,
                  },
                ],
              }}
              options={chartOptions}
            />
          </div>
        </div>

        {/* Request Volume Chart */}
        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Request Volume</h3>
          <div className="h-80">
            <Bar
              data={{
                labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                datasets: [
                  {
                    label: 'Total Requests',
                    data: [6500, 5900, 6800, 7200, 6800, 5500, 5800],
                    backgroundColor: 'rgba(14, 165, 233, 0.5)',
                    borderColor: 'rgb(14, 165, 233)',
                    borderWidth: 1,
                  },
                ],
              }}
              options={chartOptions}
            />
          </div>
        </div>
      </div>

      {/* System Health Indicators */}
      <div className="card">
        <h3 className="text-lg font-medium text-gray-900 mb-4">System Health</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
            <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center rounded-full bg-green-100">
              <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">API Status</p>
              <p className="text-sm text-gray-500">All systems operational</p>
            </div>
          </div>

          <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
            <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center rounded-full bg-green-100">
              <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Database</p>
              <p className="text-sm text-gray-500">Connected</p>
            </div>
          </div>

          <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
            <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center rounded-full bg-green-100">
              <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Memory Usage</p>
              <p className="text-sm text-gray-500">32% of 16GB</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Metrics;