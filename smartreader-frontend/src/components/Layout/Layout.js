import React from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
import MainContent from './MainContent';

function Layout({ children }) {
  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      
      <div className="flex h-[calc(100vh-4rem)]">
        <Sidebar />
        
        <div className="flex flex-col w-0 flex-1 overflow-hidden">
          <MainContent>
            {children}
          </MainContent>
        </div>
      </div>
    </div>
  );
}

export default Layout;
