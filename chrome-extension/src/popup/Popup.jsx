import React, { useState, useEffect } from 'react';
import ChatBubble from '../components/ChatBubble';
import InputField from '../components/InputField';
import StatusIndicator from '../components/StatusIndicator';
import TopicCard from '../components/TopicCard';

const API_BASE_URL = 'http://localhost:8000';

const Popup = () => {
  const [currentView, setCurrentView] = useState('topics'); // 'topics', 'chat', 'listening'
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [apiStatus, setApiStatus] = useState('connecting');
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [isListening, setIsListening] = useState(false);

  console.log('Popup component loaded');

  const topics = [
    {
      id: 'grammar',
      icon: '📚',
      title: 'Grammar & Spelling',
      description: 'Check Tamil grammar and spelling errors'
    },
    {
      id: 'tanglish',
      icon: '🔄',
      title: 'Tanglish Converter',
      description: 'Convert English letters to Tamil script'
    },
    {
      id: 'formality',
      icon: '🎭',
      title: 'Formality Shift',
      description: 'Convert between casual and formal Tamil'
    }
  ];

  useEffect(() => {
    checkAPIHealth();
  }, []);

  const checkAPIHealth = async () => {
    try {
      setApiStatus('connecting');
      const response = await fetch(`${API_BASE_URL}/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
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

  const handleTopicSelect = (topic) => {
    setSelectedTopic(topic);
    setCurrentView('chat');
    // Add a welcome message
    setMessages([{
      id: Date.now(),
      message: `Hi! I'm your Tamil AI assistant. I can help you with ${topic.title.toLowerCase()}. What would you like me to help you with?`,
      isUser: false,
      timestamp: new Date().toLocaleTimeString()
    }]);
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
      const operation = getOperationFromTopic(selectedTopic.id);
      const response = await fetch(`${API_BASE_URL}/process-text`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: text,
          operation: operation
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
        message: 'Sorry, I encountered an error. Please try again.',
        isUser: false,
        timestamp: new Date().toLocaleTimeString()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const getOperationFromTopic = (topicId) => {
    const operations = {
      'grammar': 'live_grammar',
      'tanglish': 'tanglish_convert',
      'formality': 'formality_shift'
    };
    return operations[topicId] || 'live_grammar';
  };

  const handleVoiceInput = () => {
    setIsListening(true);
    setCurrentView('listening');
    // Simulate voice input (in real implementation, you'd use Web Speech API)
    setTimeout(() => {
      setIsListening(false);
      setCurrentView('chat');
      handleSendMessage("Hey Tamil AI, can you help me with Tamil grammar?");
    }, 2000);
  };

  const renderTopicsView = () => (
    <div className="p-4 space-y-4">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-white mb-2">தமிழ் AI</h1>
        <p className="text-gray-400">What do you want to chat about today?</p>
      </div>
      
      <div className="space-y-3">
        {topics.map(topic => (
          <TopicCard
            key={topic.id}
            icon={topic.icon}
            title={topic.title}
            description={topic.description}
            onClick={() => handleTopicSelect(topic)}
          />
        ))}
      </div>
    </div>
  );

  const renderListeningView = () => (
    <div className="p-4 text-center space-y-6">
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-white">Listening</h2>
        <div className="w-24 h-24 mx-auto bg-gradient-to-r from-glow-blue to-glow-green rounded-2xl flex items-center justify-center animate-glow">
          <span className="text-3xl">🎤</span>
        </div>
        <p className="text-gray-400">Speak now...</p>
      </div>
    </div>
  );

  const renderChatView = () => (
    <div className="flex flex-col h-96">
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setCurrentView('topics')}
            className="text-gray-400 hover:text-white transition-colors"
          >
            ←
          </button>
          <h2 className="text-lg font-semibold text-white">NEW CHAT</h2>
        </div>
        <StatusIndicator status={apiStatus} />
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
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
      
      <div className="p-4 border-t border-gray-700">
        <InputField
          placeholder="What is on your mind?"
          onSend={handleSendMessage}
          onVoiceInput={handleVoiceInput}
          isLoading={isLoading}
        />
      </div>
    </div>
  );

  return (
    <div className="w-80 h-96 bg-dark-bg">
      {currentView === 'topics' && renderTopicsView()}
      {currentView === 'listening' && renderListeningView()}
      {currentView === 'chat' && renderChatView()}
    </div>
  );
};

export default Popup;
