import React from 'react';
import { Link } from 'react-router-dom';

function Header() {
  return (
    <header className="bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center">
            <Link to="/" className="flex items-center">
              <span className="text-2xl font-bold text-primary-600">SmartReader</span>
            </Link>
          </div>
          
          <nav className="hidden md:flex space-x-8">
            <Link to="/" className="text-secondary-600 hover:text-secondary-900 px-3 py-2 rounded-md text-sm font-medium">
              Home
            </Link>
            <Link to="/devices" className="text-secondary-600 hover:text-secondary-900 px-3 py-2 rounded-md text-sm font-medium">
              Devices
            </Link>
            <Link to="/device-groups" className="text-secondary-600 hover:text-secondary-900 px-3 py-2 rounded-md text-sm font-medium">
              Device Groups
            </Link>
            <Link to="/metrics" className="text-secondary-600 hover:text-secondary-900 px-3 py-2 rounded-md text-sm font-medium">
              Metrics
            </Link>
            <Link to="/firmwares" className="text-secondary-600 hover:text-secondary-900 px-3 py-2 rounded-md text-sm font-medium">
              Firmware
            </Link>
          </nav>

          <div className="flex items-center">
            <div className="ml-4 flex items-center md:ml-6">
              <button className="bg-primary-100 p-1 rounded-full text-primary-600 hover:text-primary-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
                <span className="sr-only">View notifications</span>
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </button>

              <div className="ml-3">
                <button className="max-w-xs bg-primary-600 rounded-full flex items-center text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
                  <span className="sr-only">Open user menu</span>
                  <div className="h-8 w-8 rounded-full bg-primary-700 flex items-center justify-center">
                    <span className="text-white font-medium">U</span>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;
