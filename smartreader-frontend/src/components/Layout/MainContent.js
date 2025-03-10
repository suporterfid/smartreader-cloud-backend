import React from 'react';

function MainContent({ children }) {
  return (
    <main className="flex-1 relative z-0 overflow-y-auto focus:outline-none">
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          {/* Content area */}
          <div className="min-h-[calc(100vh-4rem)]">
            {children}
          </div>
        </div>
      </div>
    </main>
  );
}

export default MainContent;
