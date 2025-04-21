import React, { useState, useRef, useEffect } from 'react';

function ChatInterface({ repoUrl }) {
  const [messages, setMessages] = useState([
    { 
      id: 1, 
      role: 'system', 
      content: 'Hi! I can answer questions about this GitHub repository. What would you like to know?' 
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!inputValue.trim()) return;
    
    const userMessage = {
      id: messages.length + 1,
      role: 'user',
      content: inputValue
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);
    
    try {
      const response = await fetch('https://harivs.pythonanywhere.com/api/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          repo_url: repoUrl,
          question: userMessage.content
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to get an answer');
      }
      
      const botMessage = {
        id: messages.length + 2,
        role: 'system',
        content: data.answer
      };
      
      setMessages(prev => [...prev, botMessage]);
    } catch (err) {
      console.error('Error querying the AI:', err);
      
      const errorMessage = {
        id: messages.length + 2,
        role: 'system',
        content: `Error: ${err.message}. Please try again.`,
        isError: true
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white shadow-lg rounded-xl overflow-hidden border border-gray-100 flex flex-col h-96 md:h-120">
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4">
        <h2 className="text-xl font-bold text-white flex items-center">
          <ChatIcon className="w-5 h-5 mr-2" />
          Chat with Repository
        </h2>
        <p className="text-blue-100 text-sm">Ask questions about the repository code, structure, or functionality</p>
      </div>
      
      <div 
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50"
      >
        {messages.map(message => (
          <ChatMessage key={message.id} message={message} />
        ))}
        
        {isLoading && <TypingIndicator />}
        
        <div ref={messagesEndRef} />
      </div>
      
      <div className="p-4 border-t border-gray-200 bg-white">
        <form onSubmit={handleSubmit} className="flex space-x-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Ask a question about this repository..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 focus:outline-none"
            disabled={isLoading}
            required
          />
          <button
            type="submit"
            disabled={isLoading}
            className={`px-4 py-2 text-white font-medium rounded-lg shadow-sm flex items-center
              ${isLoading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'} 
              transition-colors duration-200`}
          >
            {isLoading ? (
              <span className="flex items-center">
                <LoadingDots />
              </span>
            ) : (
              <>
                <SendIcon className="w-4 h-4 mr-1" />
                Send
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

function ChatMessage({ message }) {
  const isUser = message.role === 'user';
  
  return (
    <div 
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} animate-fadeIn`}
    >
      <div 
        className={`max-w-3/4 md:max-w-2/3 rounded-2xl px-4 py-3 shadow-sm
          ${isUser 
            ? 'bg-blue-600 text-white rounded-br-none' 
            : message.isError 
              ? 'bg-red-50 text-red-800 border border-red-100 rounded-bl-none'
              : 'bg-white text-gray-800 border border-gray-100 rounded-bl-none'}`}
      >
        <div 
          className="prose prose-sm max-w-none" 
          dangerouslySetInnerHTML={{ __html: markdownToHtml(message.content) }} 
        />
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex justify-start">
      <div className="bg-white border border-gray-100 rounded-2xl rounded-bl-none px-4 py-3 shadow-sm">
        <div className="flex items-center space-x-1">
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '600ms' }}></div>
        </div>
      </div>
    </div>
  );
}

function LoadingDots() {
  return (
    <div className="flex items-center justify-center space-x-1">
      <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>
      <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" style={{ animationDelay: '300ms' }}></div>
      <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" style={{ animationDelay: '600ms' }}></div>
    </div>
  );
}

function ChatIcon({ className }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path fillRule="evenodd" d="M4.848 2.771A49.144 49.144 0 0112 2.25c2.43 0 4.817.178 7.152.52 1.978.292 3.348 2.024 3.348 3.97v6.02c0 1.946-1.37 3.678-3.348 3.97-1.94.284-3.554.535-5.152.535-1.59 0-3.213-.25-5.152-.535-1.978-.292-3.348-2.024-3.348-3.97V6.741c0-1.946 1.37-3.68 3.348-3.97z" clipRule="evenodd" />
      <path d="M9.148 8.971a.75.75 0 01.06 1.06l-1.22 1.219h7.024a.75.75 0 010 1.5H8.018l1.19 1.19a.75.75 0 11-1.06 1.06L6.39 13.243a.75.75 0 010-1.061l1.758-1.758a.75.75 0 011 .06z" />
    </svg>
  );
}

function SendIcon({ className }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
    </svg>
  );
}

function markdownToHtml(markdown) {
  if (!markdown) return '';
  
  return markdown
    .replace(/^### (.*$)/gm, '<h3 class="text-lg font-bold mt-4 mb-2">$1</h3>')
    .replace(/^## (.*$)/gm, '<h2 class="text-xl font-bold mt-5 mb-2">$1</h2>')
    .replace(/^# (.*$)/gm, '<h1 class="text-2xl font-bold mt-6 mb-3">$1</h1>')
    .replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold">$1</strong>')
    .replace(/\*(.*?)\*/g, '<em class="italic">$1</em>')
    .replace(/`(.*?)`/g, '<code class="bg-gray-100 px-1.5 py-0.5 rounded text-sm font-mono text-pink-600">$1</code>')
    .replace(/```([^`]+)```/g, '<pre class="bg-gray-800 text-gray-100 p-3 rounded-lg overflow-x-auto my-3 font-mono text-sm"><code>$1</code></pre>')
    .replace(/\n/g, '<br />');
}

export default ChatInterface;