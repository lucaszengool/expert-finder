import React from 'react';
import { motion } from 'framer-motion';
import { Star, Shield, Award, Clock, Users, BarChart3, ChevronRight, MapPin } from 'lucide-react';

const ExpertCard = ({ expert, onClick }) => {
  const getSourceColor = (source) => {
    const colors = {
      linkedin: 'text-blue',
      scholar: 'text-purple',
      github: 'text-gray-400',
      ai: 'text-green',
      mock: 'text-yellow'
    };
    return colors[source] || 'text-gray-400';
  };

  return (
    <motion.div
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.98 }}
      className="card hover:border-gray-600 transition-all cursor-pointer hover-glow"
      onClick={onClick}
    >
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-start space-x-4">
          <div className="w-12 h-12 bg-gradient-to-br from-green to-green-dark rounded-full flex items-center justify-center font-bold text-lg text-black">
            {expert.name.split(' ').map(n => n[0]).join('')}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-lg">{expert.name}</h3>
              {expert.verified && <Shield className="w-4 h-4 text-green" />}
              {expert.topExpert && <Award className="w-4 h-4 text-yellow" />}
            </div>
            <p className="text-sm text-gray-400">{expert.title}</p>
            <p className="text-xs text-gray-500">{expert.organization || expert.company}</p>
          </div>
        </div>
        
        <div className="text-right">
          {expert.rating && (
            <div className="flex items-center gap-1 mb-1">
              <Star className="w-4 h-4 text-yellow fill-current" />
              <span className="font-medium">{expert.rating}</span>
              {expert.reviews && (
                <span className="text-xs text-gray-500">({expert.reviews})</span>
              )}
            </div>
          )}
          {expert.hourlyRate && (
            <p className="text-sm font-medium text-green">${expert.hourlyRate}/hr</p>
          )}
        </div>
      </div>

      {expert.location && (
        <div className="flex items-center gap-1 text-sm text-gray-400 mb-3">
          <MapPin className="w-3 h-3" />
          <span>{expert.location}</span>
        </div>
      )}

      {expert.bio && (
        <p className="text-sm text-gray-300 mb-4 line-clamp-2">{expert.bio}</p>
      )}

      {expert.skills && expert.skills.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {expert.skills.slice(0, 3).map((skill, idx) => (
            <span key={idx} className="px-2 py-1 bg-black border border-gray-700 rounded-full text-xs">
              {skill}
            </span>
          ))}
          {expert.skills.length > 3 && (
            <span className="px-2 py-1 text-xs text-gray-500">
              +{expert.skills.length - 3} more
            </span>
          )}
        </div>
      )}

      {expert.dnaProfile && (
        <div className="bg-black rounded-lg p-3 mb-4 border border-gray-700">
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div>
              <span className="text-gray-500">Style:</span>
              <p className="text-white">{expert.dnaProfile.workStyle}</p>
            </div>
            <div>
              <span className="text-gray-500">Comm:</span>
              <p className="text-white">{expert.dnaProfile.communication}</p>
            </div>
            <div>
              <span className="text-gray-500">Method:</span>
              <p className="text-white">{expert.dnaProfile.approach}</p>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-4">
          {expert.responseTime && (
            <div className="flex items-center gap-1 text-gray-400">
              <Clock className="w-3 h-3" />
              <span>{expert.responseTime}</span>
            </div>
          )}
          {expert.consultations && (
            <div className="flex items-center gap-1 text-gray-400">
              <Users className="w-3 h-3" />
              <span>{expert.consultations} sessions</span>
            </div>
          )}
          {expert.successRate && (
            <div className="flex items-center gap-1 text-gray-400">
              <BarChart3 className="w-3 h-3" />
              <span>{expert.successRate}% success</span>
            </div>
          )}
        </div>
        <span className={`text-xs font-medium ${getSourceColor(expert.source)}`}>
          {expert.source}
        </span>
      </div>

      {expert.availability === "Available now" && (
        <div className="mt-4 bg-green/10 border border-green/20 rounded-lg p-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green rounded-full animate-pulse" />
            <span className="text-xs text-green">Available for immediate consultation</span>
          </div>
          <button 
            className="text-xs bg-green text-black px-3 py-1 rounded font-medium hover:bg-green-dark transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              // Handle booking
            }}
          >
            Book Now
          </button>
        </div>
      )}
    </motion.div>
  );
};

export default ExpertCard;
