import React from 'react';

const ChatBubble = ({ message, isUser, timestamp, avatar }) => {
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`flex items-end space-x-2 ${isUser ? 'flex-row-reverse space-x-reverse' : ''}`}>
        {!isUser && (
          <div className="w-8 h-8 bg-gradient-to-r from-glow-blue to-glow-green rounded-full flex items-center justify-center animate-pulse-slow">
            <span className="text-white text-sm font-bold">த</span>
          </div>
        )}
        {isUser && avatar && (
          <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
            <span className="text-white text-sm">👤</span>
          </div>
        )}
        <div className={`${isUser ? 'chat-bubble-user' : 'chat-bubble-ai'}`}>
          <p className="text-sm leading-relaxed">{message}</p>
          {timestamp && (
            <p className="text-xs opacity-70 mt-1">{timestamp}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatBubble;

