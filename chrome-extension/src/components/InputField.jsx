import React, { useState } from 'react';

const InputField = ({ placeholder, onSend, onVoiceInput, isLoading, className = "" }) => {
  const [text, setText] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (text.trim() && onSend) {
      onSend(text.trim());
      setText('');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={`flex items-center space-x-2 ${className}`}>
      <div className="flex-1 relative">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={placeholder}
          className="input-field w-full pr-12"
          disabled={isLoading}
        />
        <button
          type="button"
          onClick={() => onVoiceInput && onVoiceInput()}
          className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 text-gray-400 hover:text-glow-green transition-colors"
        >
          🎤
        </button>
      </div>
      <button
        type="submit"
        disabled={!text.trim() || isLoading}
        className="glow-button px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? '⏳' : '↑'}
      </button>
    </form>
  );
};

export default InputField;

