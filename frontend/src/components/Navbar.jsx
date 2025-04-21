import React from 'react';

function Navbar() {
  return (
    <nav className="bg-gradient-to-r from-blue-600 to-purple-600 shadow-md">
      <div className="container mx-auto px-4 py-3 max-w-5xl">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="p-1.5 bg-white bg-opacity-20 rounded-lg">
              <CodeIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">GitHub Repo Analyzer</h1>
              <p className="text-blue-100 text-xs">Analyze and chat with your repositories</p>
            </div>
          </div>
          
          <div className="flex items-center">
            <span className="text-sm px-3 py-1.5 bg-white bg-opacity-10 rounded-lg text-white flex items-center">
              <AiIcon className="w-4 h-4 mr-1.5" />
              Powered by Gemini AI
            </span>
          </div>
        </div>
      </div>
    </nav>
  );
}

function CodeIcon({ className }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path fillRule="evenodd" d="M14.447 3.027a.75.75 0 01.527.92l-4.5 16.5a.75.75 0 01-1.448-.394l4.5-16.5a.75.75 0 01.921-.526zM16.72 6.22a.75.75 0 011.06 0l5.25 5.25a.75.75 0 010 1.06l-5.25 5.25a.75.75 0 11-1.06-1.06L21.44 12l-4.72-4.72a.75.75 0 010-1.06zm-9.44 0a.75.75 0 010 1.06L2.56 12l4.72 4.72a.75.75 0 11-1.06 1.06L.97 12.53a.75.75 0 010-1.06l5.25-5.25a.75.75 0 011.06 0z" clipRule="evenodd" />
    </svg>
  );
}

function AiIcon({ className }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" />
    </svg>
  );
}

export default Navbar;