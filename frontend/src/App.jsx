import React, { useState } from 'react';
import RepoAnalyzer from './components/RepoAnalyzer';
import ChatInterface from './components/ChatInterface';
import Navbar from './components/Navbar';

function App() {
  const [repoData, setRepoData] = useState(null);
  const [repoUrl, setRepoUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const analyzeRepo = async (url) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('https://harivs.pythonanywhere.com/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ repo_url: url }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to analyze repository');
      }
      
      setRepoData(data.data);
      setRepoUrl(url);
    } catch (err) {
      setError(err.message);
      console.error('Error analyzing repository:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <Navbar />
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <RepoAnalyzer 
          onAnalyze={analyzeRepo} 
          isLoading={isLoading} 
          error={error}
        />
        
        {repoData && (
          <div className="mt-8 space-y-8">
            <RepoSummary data={repoData} />
            <ChatInterface repoUrl={repoUrl} />
          </div>
        )}
      </div>
    </div>
  );
}

function RepoSummary({ data }) {
  return (
    <div className="bg-white shadow-lg rounded-xl overflow-hidden border border-gray-100">
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4">
        <h2 className="text-2xl font-bold text-white">Repository Summary</h2>
        <p className="text-blue-100 text-sm">Analysis results and key information</p>
      </div>
      
      <div className="p-6">
        <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: markdownToHtml(data.summary) }} />
        
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-3 text-gray-800 flex items-center">
            <CodeIcon className="w-5 h-5 mr-2 text-blue-500" />
            Languages
          </h3>
          <div className="flex flex-wrap gap-2">
            {Object.entries(data.languages).map(([lang, count]) => (
              <LanguageBadge key={lang} language={lang} count={count} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function LanguageBadge({ language, count }) {
  // Map languages to colors
  const colorMap = {
    JavaScript: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    Python: 'bg-blue-100 text-blue-800 border-blue-200',
    Java: 'bg-red-100 text-red-800 border-red-200',
    TypeScript: 'bg-blue-100 text-blue-800 border-blue-200',
    Ruby: 'bg-red-100 text-red-800 border-red-200',
    PHP: 'bg-purple-100 text-purple-800 border-purple-200',
    CSS: 'bg-pink-100 text-pink-800 border-pink-200',
    HTML: 'bg-orange-100 text-orange-800 border-orange-200',
    // Default for other languages
    default: 'bg-gray-100 text-gray-800 border-gray-200'
  };
  
  const color = colorMap[language] || colorMap.default;
  
  return (
    <span className={`px-3 py-1 rounded-full text-sm font-medium border ${color} flex items-center`}>
      {language}
      <span className="ml-1 bg-white bg-opacity-30 px-1.5 py-0.5 rounded-full text-xs">
        {count}
      </span>
    </span>
  );
}

function CodeIcon({ className }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path fillRule="evenodd" d="M14.447 3.027a.75.75 0 01.527.92l-4.5 16.5a.75.75 0 01-1.448-.394l4.5-16.5a.75.75 0 01.921-.526zM16.72 6.22a.75.75 0 011.06 0l5.25 5.25a.75.75 0 010 1.06l-5.25 5.25a.75.75 0 11-1.06-1.06L21.44 12l-4.72-4.72a.75.75 0 010-1.06zm-9.44 0a.75.75 0 010 1.06L2.56 12l4.72 4.72a.75.75 0 11-1.06 1.06L.97 12.53a.75.75 0 010-1.06l5.25-5.25a.75.75 0 011.06 0z" clipRule="evenodd" />
    </svg>
  );
}

function markdownToHtml(markdown) {
  if (!markdown) return '';
  
  return markdown
    .replace(/^### (.*$)/gm, '<h3 class="text-xl font-bold mt-6 mb-2 text-gray-800">$1</h3>')
    .replace(/^## (.*$)/gm, '<h2 class="text-2xl font-bold mt-8 mb-3 text-gray-800">$1</h2>')
    .replace(/^# (.*$)/gm, '<h1 class="text-3xl font-bold mt-10 mb-4 text-gray-800">$1</h1>')
    .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold">$1</strong>')
    .replace(/\*(.*?)\*/g, '<em class="italic">$1</em>')
    .replace(/`(.*?)`/g, '<code class="bg-gray-100 px-1.5 py-0.5 rounded text-sm font-mono text-pink-600">$1</code>')
    .replace(/```([^`]+)```/g, '<pre class="bg-gray-800 text-gray-100 p-4 rounded-lg overflow-x-auto my-4 font-mono text-sm"><code>$1</code></pre>')
    .replace(/\n/g, '<br />');
}

export default App;