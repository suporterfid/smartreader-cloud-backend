import React from 'react';

function Home() {
  const stats = [
    { name: 'Total Devices', value: '12', change: '+2', changeType: 'increase' },
    { name: 'Active Devices', value: '8', change: '+1', changeType: 'increase' },
    { name: 'Total Events', value: '1,429', change: '+123', changeType: 'increase' },
    { name: 'System Uptime', value: '99.9%', change: '0.1%', changeType: 'decrease' },
  ];

  const recentEvents = [
    { id: 1, device: 'Device A', event: 'Status Update', time: '5 min ago', status: 'success' },
    { id: 2, device: 'Device B', event: 'Configuration Change', time: '10 min ago', status: 'warning' },
    { id: 3, device: 'Device C', event: 'Error Detected', time: '15 min ago', status: 'error' },
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
                stat.changeType === 'increase' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {stat.change}
              </div>
            </dd>
          </div>
        ))}
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
    </div>
  );
}

export default Home;
