// EnhancedExpertCard.js - Save this in src/components/modern/EnhancedExpertCard.js

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Star, MapPin, Clock, DollarSign, Calendar, 
  CheckCircle, Award, Briefcase, MessageCircle,
  Video, Phone, Mail, Globe, Linkedin, Twitter,
  TrendingUp, Users, BookOpen, Shield, Zap,
  ChevronRight, ExternalLink, Sparkles
} from 'lucide-react';

const EnhancedExpertCard = ({ expert, onClick, onEmailClick }) => {
  const [imageError, setImageError] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // Calculate match percentage from relevance score
  const matchPercentage = expert.relevance_score 
    ? Math.round(expert.relevance_score * 100) 
    : Math.round(Math.random() * 30 + 70);

  // Get rating display
  const rating = typeof expert.rating === 'number' ? expert.rating : parseFloat(expert.rating) || parseFloat((Math.random() * 1 + 4).toFixed(1));
  const totalReviews = expert.total_reviews || expert.social_proof?.[0]?.review_count || Math.floor(Math.random() * 500);

  // Get availability status
  const getAvailabilityStatus = () => {
    if (expert.available_now) return { text: 'Available Now', color: 'text-green-400', bgColor: 'bg-green-400/10' };
    if (expert.next_available) {
      const hoursUntil = Math.round((new Date(expert.next_available) - new Date()) / (1000 * 60 * 60));
      if (hoursUntil < 24) return { text: `Available in ${hoursUntil}h`, color: 'text-yellow-400', bgColor: 'bg-yellow-400/10' };
    }
    return { text: 'Check Availability', color: 'text-gray-400', bgColor: 'bg-gray-400/10' };
  };

  const availability = getAvailabilityStatus();

  // Get primary contact method
  const primaryContact = expert.contacts?.find(c => c.preferred) || expert.contacts?.[0];

  const handleEmailClick = (e) => {
    e.stopPropagation();
    if (onEmailClick) {
      onEmailClick(expert);
    } else {
      // Fallback to mailto if no onEmailClick handler
      const subject = encodeURIComponent(`Consultation Request - AI/ML Expertise`);
      const body = encodeURIComponent(`Dear ${expert.name},\n\nI came across your profile and would like to discuss a potential consultation regarding AI/ML implementation.\n\nBest regards,`);
      window.location.href = `mailto:${expert.email}?subject=${subject}&body=${body}`;
    }
  };

  return (
    <motion.div
      className="bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-gray-800 hover:border-gray-700 transition-all duration-300 overflow-hidden group"
      whileHover={{ y: -4 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
    >
      {/* Match Score Badge */}
      {expert.match_score && (
        <div className="absolute top-4 right-4 z-10">
          <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-black text-sm font-bold px-3 py-1.5 rounded-full flex items-center gap-1 shadow-lg">
            <Sparkles className="w-4 h-4" />
            {expert.match_score}% Match
          </div>
        </div>
      )}

      {/* Header Section */}
      <div className="relative">
        {/* Cover Image or Gradient */}
        <div className="h-32 bg-gradient-to-br from-gray-800 via-gray-900 to-black relative overflow-hidden">
          {expert.cover_image && (
            <img 
              src={expert.cover_image} 
              alt="" 
              className="w-full h-full object-cover opacity-40"
              onError={(e) => e.target.style.display = 'none'}
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-transparent" />
        </div>

        {/* Profile Section */}
        <div className="px-6 -mt-12 relative">
          <div className="flex items-end gap-4">
            {/* Profile Image */}
            <div className="relative">
              <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-green-400 to-emerald-600 p-0.5">
                <div className="w-full h-full rounded-2xl bg-gray-900 flex items-center justify-center text-2xl font-bold text-white overflow-hidden">
                  {expert.profile_image && !imageError ? (
                    <img 
                      src={expert.profile_image} 
                      alt={expert.name}
                      className="w-full h-full object-cover"
                      onError={() => setImageError(true)}
                    />
                  ) : (
                    <span>{expert.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'EX'}</span>
                  )}
                </div>
              </div>
              {expert.verified_expert && (
                <div className="absolute -bottom-1 -right-1 bg-blue-500 rounded-full p-1">
                  <CheckCircle className="w-4 h-4 text-white" />
                </div>
              )}
            </div>

            {/* Quick Stats */}
            <div className="flex-1 mb-3">
              <div className="flex items-center gap-4 text-sm">
                <div className={`px-3 py-1 rounded-full ${availability.bgColor} ${availability.color} font-medium`}>
                  {availability.text}
                </div>
                {expert.response_time && (
                  <div className="flex items-center gap-1 text-gray-400">
                    <Clock className="w-4 h-4" />
                    <span className="text-xs">Responds {expert.response_time}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Name and Title */}
          <div className="mt-4">
            <h3 className="text-xl font-bold text-white group-hover:text-green-400 transition-colors">
              {expert.name || 'Expert Professional'}
            </h3>
            <p className="text-gray-400 text-sm mt-1">{expert.title || 'Specialist'}</p>
          </div>

          {/* Rating and Location */}
          <div className="flex items-center gap-4 mt-3 text-sm">
            <div className="flex items-center gap-1">
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <Star 
                    key={i} 
                    className={`w-4 h-4 ${i < Math.floor(rating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600'}`} 
                  />
                ))}
              </div>
              <span className="text-white font-medium ml-1">{typeof rating === 'number' ? rating.toFixed(1) : rating}</span>
              <span className="text-gray-500">({totalReviews})</span>
            </div>
            {expert.location && (
              <div className="flex items-center gap-1 text-gray-400">
                <MapPin className="w-4 h-4" />
                <span>{expert.location}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="px-6 py-4">
        {/* Bio */}
        {expert.bio && (
          <p className="text-gray-300 text-sm line-clamp-2 mb-4">
            {expert.bio}
          </p>
        )}

        {/* Skills */}
        {expert.skills && expert.skills.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {expert.skills.slice(0, 4).map((skill, idx) => (
              <span 
                key={idx}
                className="px-3 py-1 bg-gray-800 text-gray-300 text-xs rounded-full"
              >
                {skill}
              </span>
            ))}
            {expert.skills.length > 4 && (
              <span className="px-3 py-1 bg-gray-800 text-gray-400 text-xs rounded-full">
                +{expert.skills.length - 4} more
              </span>
            )}
          </div>
        )}

        {/* Key Stats */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="text-center p-3 bg-gray-800/50 rounded-lg">
            <div className="text-green-400 font-bold text-lg">
              {expert.years_of_experience || expert.experience_years || '5+'}
            </div>
            <div className="text-gray-500 text-xs">Years Exp.</div>
          </div>
          <div className="text-center p-3 bg-gray-800/50 rounded-lg">
            <div className="text-green-400 font-bold text-lg">
              ${expert.hourly_rate || '250'}
            </div>
            <div className="text-gray-500 text-xs">Per Hour</div>
          </div>
          <div className="text-center p-3 bg-gray-800/50 rounded-lg">
            <div className="text-green-400 font-bold text-lg">
              {expert.satisfaction_rate || '95'}%
            </div>
            <div className="text-gray-500 text-xs">Satisfaction</div>
          </div>
        </div>

        {/* Match Reasons */}
        {expert.match_reasons && expert.match_reasons.length > 0 && (
          <div className="mb-4 p-3 bg-green-500/10 rounded-lg border border-green-500/20">
            <div className="text-xs text-green-400 font-medium mb-2 flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              Why this expert?
            </div>
            <div className="space-y-1">
              {expert.match_reasons.slice(0, 2).map((reason, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <CheckCircle className="w-3 h-3 text-green-400 mt-0.5 flex-shrink-0" />
                  <span className="text-xs text-gray-300">{reason}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Contact Options */}
        <div className="flex items-center gap-2 mb-4">
          {expert.consultation_types?.includes('video') && (
            <div className="p-2 bg-gray-800 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700 transition-colors cursor-pointer">
              <Video className="w-4 h-4" />
            </div>
          )}
          {expert.consultation_types?.includes('phone') && (
            <div className="p-2 bg-gray-800 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700 transition-colors cursor-pointer">
              <Phone className="w-4 h-4" />
            </div>
          )}
          {expert.consultation_types?.includes('chat') && (
            <div className="p-2 bg-gray-800 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700 transition-colors cursor-pointer">
              <MessageCircle className="w-4 h-4" />
            </div>
          )}
          <div className="flex-1" />
          {primaryContact?.method === 'website' && (
            <a 
              href={primaryContact.value} 
              target="_blank" 
              rel="noopener noreferrer"
              className="p-2 bg-gray-800 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              <Globe className="w-4 h-4" />
            </a>
          )}
        </div>

        {/* Action Buttons */}
        <div className="space-y-2">
          <button
            onClick={() => onClick(expert)}
            className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-black font-medium py-3 px-4 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 group"
          >
            <span>View Full Profile</span>
            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
          
          {/* Direct Email Button */}
          {expert.email && (
            <button
              onClick={handleEmailClick}
              className="w-full bg-gray-800 hover:bg-gray-700 text-white font-medium py-2.5 px-4 rounded-xl transition-all duration-300 flex items-center justify-center gap-2"
            >
              <Mail className="w-4 h-4" />
              <span>Send Email</span>
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default EnhancedExpertCard;