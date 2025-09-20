import React, { useState, useEffect } from 'react';
import ChatBubble from '../components/ChatBubble';
import InputField from '../components/InputField';
import StatusIndicator from '../components/StatusIndicator';

const API_BASE_URL = 'http://localhost:8000';

const Sidepanel = () => {
  const [selectedText, setSelectedText] = useState('');
  const [processedText, setProcessedText] = useState('');
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [apiStatus, setApiStatus] = useState('connecting');
  const [currentFunction, setCurrentFunction] = useState('');
  const [tooltipsEnabled, setTooltipsEnabled] = useState(true);

  console.log('Sidepanel component loaded');

  useEffect(() => {
    checkAPIHealth();
    
    // Listen for messages from content script
    const handleMessage = (request, sender, sendResponse) => {
      if (request.action === 'textSelected') {
        setSelectedText(request.text);
        setProcessedText('');
        setMessages([]);
        console.log('Text selected in sidepanel:', request.text);
      }
    };

    chrome.runtime.onMessage.addListener(handleMessage);
    
    return () => {
      chrome.runtime.onMessage.removeListener(handleMessage);
    };
  }, []);

  const checkAPIHealth = async () => {
    try {
      setApiStatus('connecting');
      const response = await fetch(`${API_BASE_URL}/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        // Add timeout
        signal: AbortSignal.timeout(5000)
      });
      if (response.ok) {
        setApiStatus('connected');
        console.log('API connected successfully');
      } else {
        setApiStatus('error');
        console.log('API responded with error:', response.status);
      }
    } catch (error) {
      setApiStatus('error');
      console.log('API connection failed:', error.message);
    }
  };

  const processText = async (functionType) => {
    if (!selectedText.trim()) {
      setProcessedText('No text selected. Please select Tamil text on the page.');
      return;
    }

    const operation = getOperationFromFunction(functionType);
    if (!operation) return;

    setIsLoading(true);
    setCurrentFunction(functionType);

    // Add user message
    const userMessage = {
      id: Date.now(),
      message: selectedText,
      isUser: true,
      timestamp: new Date().toLocaleTimeString()
    };
    setMessages(prev => [...prev, userMessage]);

    try {
      const response = await fetch(`${API_BASE_URL}/process-text`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: selectedText,
          operation: operation
        })
      });

      if (response.ok) {
        const data = await response.json();
        setProcessedText(data.corrected_text);
        
        // Add AI response
        const aiMessage = {
          id: Date.now() + 1,
          message: data.corrected_text,
          isUser: false,
          timestamp: new Date().toLocaleTimeString()
        };
        setMessages(prev => [...prev, aiMessage]);
      } else {
        throw new Error('API request failed');
      }
    } catch (error) {
      setProcessedText('Error: Could not connect to API');
      const errorMessage = {
        id: Date.now() + 1,
        message: 'Error: Could not connect to API',
        isUser: false,
        timestamp: new Date().toLocaleTimeString()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const getOperationFromFunction = (functionType) => {
    const operations = {
      'grammar': 'live_grammar',
      'spelling': 'live_spelling'
    };
    return operations[functionType];
  };

  const copyResult = async () => {
    if (!processedText) return;
    
    try {
      await navigator.clipboard.writeText(processedText);
      // You could add a toast notification here
    } catch (error) {
      console.error('Failed to copy text:', error);
    }
  };

  const applyToPage = async () => {
    if (!processedText) return;

    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        function: (text) => {
          const activeElement = document.activeElement;
          if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA')) {
            activeElement.value = text;
            activeElement.dispatchEvent(new Event('input', { bubbles: true }));
          }
        },
        args: [processedText]
      });
    } catch (error) {
      console.error('Error applying text:', error);
    }
  };

  const toggleTooltips = async () => {
    const newState = !tooltipsEnabled;
    setTooltipsEnabled(newState);
    
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        function: (enabled) => {
          if (window.tooltipSystem) {
            window.tooltipSystem.setEnabled(enabled);
          }
        },
        args: [newState]
      });
    } catch (error) {
      console.error('Error toggling tooltips:', error);
    }
  };

  const handleSendMessage = async (text) => {
    if (!text.trim()) return;

    const userMessage = {
      id: Date.now(),
      message: text,
      isUser: true,
      timestamp: new Date().toLocaleTimeString()
    };
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/process-text`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: text,
          operation: 'live_grammar'
        })
      });

      if (response.ok) {
        const data = await response.json();
        const aiMessage = {
          id: Date.now() + 1,
          message: data.corrected_text,
          isUser: false,
          timestamp: new Date().toLocaleTimeString()
        };
        setMessages(prev => [...prev, aiMessage]);
      } else {
        throw new Error('API request failed');
      }
    } catch (error) {
      const errorMessage = {
        id: Date.now() + 1,
        message: 'Error: Could not connect to API',
        isUser: false,
        timestamp: new Date().toLocaleTimeString()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full h-screen bg-dark-bg flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        <h1 className="text-xl font-bold text-white">தமிழ் AI உதவியாளர்</h1>
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-400">Tooltips:</span>
            <button
              onClick={toggleTooltips}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                tooltipsEnabled ? 'bg-glow-green' : 'bg-gray-600'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  tooltipsEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
          <StatusIndicator status={apiStatus} />
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col">
        {/* Selected Text Section */}
        {selectedText && (
          <div className="p-4 border-b border-gray-700">
            <h3 className="text-sm font-semibold text-gray-400 mb-2">Selected Text:</h3>
            <div className="glow-card">
              <p className="text-white text-sm leading-relaxed">{selectedText}</p>
            </div>
            
            <div className="flex space-x-2 mt-3">
              <button
                onClick={() => processText('grammar')}
                disabled={isLoading}
                className="glow-button text-sm px-3 py-1 disabled:opacity-50"
              >
                Grammar Check
              </button>
              <button
                onClick={() => processText('spelling')}
                disabled={isLoading}
                className="glow-button text-sm px-3 py-1 disabled:opacity-50"
              >
                Spelling Check
              </button>
            </div>
          </div>
        )}

        {/* Chat Section */}
        <div className="flex-1 flex flex-col">
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {messages.length === 0 && !selectedText && (
              <div className="text-center text-gray-400 mt-8">
                <p>Select Tamil text on the page to get started</p>
              </div>
            )}
            
            {messages.map(message => (
              <ChatBubble
                key={message.id}
                message={message.message}
                isUser={message.isUser}
                timestamp={message.timestamp}
              />
            ))}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="chat-bubble-ai">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input Section */}
          <div className="p-4 border-t border-gray-700">
            <InputField
              placeholder="What is on your mind?"
              onSend={handleSendMessage}
              isLoading={isLoading}
            />
          </div>
        </div>

        {/* Action Buttons */}
        {processedText && (
          <div className="p-4 border-t border-gray-700">
            <div className="flex space-x-2">
              <button
                onClick={copyResult}
                className="flex-1 glow-button text-sm py-2"
              >
                Copy Result
              </button>
              <button
                onClick={applyToPage}
                className="flex-1 glow-button text-sm py-2"
              >
                Apply to Page
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidepanel;
