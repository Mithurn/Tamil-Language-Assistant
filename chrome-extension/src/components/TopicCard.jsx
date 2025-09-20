import React from 'react';

const TopicCard = ({ icon, title, description, onClick, isSelected = false }) => {
  return (
    <div 
      className={`glow-card cursor-pointer transition-all duration-300 hover:scale-105 ${
        isSelected ? 'ring-2 ring-glow-green' : ''
      }`}
      onClick={onClick}
    >
      <div className="flex items-start space-x-3">
        <div className="text-2xl">{icon}</div>
        <div className="flex-1">
          <h3 className="font-semibold text-white mb-1">{title}</h3>
          <p className="text-sm text-gray-400 leading-relaxed">{description}</p>
        </div>
      </div>
    </div>
  );
};

export default TopicCard;

