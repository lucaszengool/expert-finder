// EnhancedExpertCard.js - Save this in src/components/modern/EnhancedExpertCard.js

import React, { useState } from 'react';
import WebsitePreview from './WebsitePreview';
import { motion } from 'framer-motion';
import { 
  Star, MapPin, Clock, DollarSign, Calendar, 
  CheckCircle, Award, Briefcase, MessageCircle,
  Video, Phone, Mail, Globe, Linkedin, Twitter,
  TrendingUp, Users, BookOpen, Shield, Zap,
  ChevronRight, ExternalLink, Sparkles,
  Building, GraduationCap, Camera
} from 'lucide-react';
import WebsitePreview from './WebsitePreview';

const EnhancedExpertCard = ({ expert, onClick, onEmailClick }) => {
  const [imageError, setImageError] = useState(false);
  const [coverImageError, setCoverImageError] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // Validate if this is a real expert (not a course/company/article)
  const isValidExpert = () => {
    const name = expert.name?.toLowerCase() || '';
    const title = expert.title?.toLowerCase() || '';
    const invalidKeywords = [
      'linkedin learning', 
      'coursera', 
      'framework', 
      'platform', 
      'udemy', 
      'edx',
      'online training',
      'skill building',
      'how to kick off' // Article title pattern
    ];
    
    // Check if it's an article title
    const isArticleTitle = title.includes('how to') || title.includes('kick off') || title.includes('establish');
    if (isArticleTitle) {
      // Fix the title if it's from an article
      expert.title = expert.originalTitle || 'Healthcare AI Expert';
    }
    
    return !invalidKeywords.some(keyword => name.includes(keyword) || title.includes(keyword));
  };

  if (!isValidExpert()) {
    return null; // Don't render invalid entries
  }

  // Ensure valid phone and email formats
  const formatPhone = (phone) => {
    if (!phone) return null;
    // Check if it's a valid phone format
    const phoneRegex = /^\+?[\d\s\-\(\)]+$/;
    return phoneRegex.test(phone) ? phone : null;
  };

  const formatEmail = (email) => {
    if (!email) return null;
    // Check if it's a valid email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) ? email : null;
  };

  const validEmail = formatEmail(expert.email);
  const validPhone = formatPhone(expert.phone);

  // Calculate match percentage from relevance score
  const matchPercentage = expert.relevance_score 
    ? Math.round(expert.relevance_score * 100) 
    : expert.match_score || Math.round(Math.random() * 30 + 70);

  // Get rating display
  const rating = typeof expert.rating === 'number' ? expert.rating : parseFloat(expert.rating) || 4.5;
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

  // Profile image with better fallback
  const profileImageUrl = expert.profile_image && !imageError 
    ? expert.profile_image 
    : `https://ui-avatars.com/api/?name=${encodeURIComponent(expert.name || 'Expert')}&background=10b981&color=fff&size=400&font-size=0.4`;

  // Cover image with fallback based on expertise
  const getCoverImage = () => {
    if (expert.cover_image && !coverImageError) return expert.cover_image;
    
    // Fallback based on skills
    const skills = expert.skills?.join(' ').toLowerCase() || '';
    if (skills.includes('ai') || skills.includes('machine learning')) {
      return "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=1200&h=400&fit=crop";
    } else if (skills.includes('data')) {
      return "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&h=400&fit=crop";
    } else if (skills.includes('cloud')) {
      return "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&h=400&fit=crop";
    }
    return "https://images.unsplash.com/photo-1517077304055-6e89abbf09b0?w=1200&h=400&fit=crop";
  };

  // Prepare website data for preview
  const getWebsiteData = () => {
    const websites = [];
    
    // Add LinkedIn profile
    if (expert.linkedin_url || expert.profile_url?.includes('linkedin.com/in/')) {
      websites.push({
        url: expert.linkedin_url || expert.profile_url,
        type: 'LinkedIn Profile'
      });
    }
    
    // Add personal website
    if (expert.website) {
      websites.push({
        url: expert.website,
        type: 'Personal Website'
      });
    }
    
    // Add websites from contacts
    if (expert.contacts) {
      expert.contacts.forEach(contact => {
        if (contact.method === 'website' && contact.value) {
          websites.push({
            url: contact.value,
            type: 'Website'
          });
        }
      });
    }
    
    // Add any additional websites
    if (expert.websites) {
      expert.websites.forEach(site => {
        if (typeof site === 'string') {
          websites.push({ url: site, type: 'Website' });
        } else {
          websites.push(site);
        }
      });
    }
    
    // Remove duplicates
    const uniqueWebsites = websites.filter((site, index, self) =>
      index === self.findIndex((s) => s.url === site.url)
    );
    
    return uniqueWebsites;
  };

  const websiteData = getWebsiteData();

  // Work samples component - removed since we're using WebsitePreview instead

  // Credentials display
  const CredentialBadges = () => {
    if (!expert.credentials || expert.credentials.length === 0) return null;
    
    return (
      <div className="mb-3 space-y-1">
        {expert.credentials.slice(0, 2).map((cred, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <GraduationCap className="w-3 h-3 text-blue-400 flex-shrink-0" />
            <span className="text-xs text-gray-300 truncate">
              {cred.title} • {cred.issuer}
            </span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <motion.div
      className="bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-gray-800 hover:border-gray-700 transition-all duration-300 overflow-hidden group"
      whileHover={{ y: -4 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
    >
      {/* Match Score Badge */}
      {matchPercentage > 0 && (
        <div className="absolute top-4 right-4 z-10">
          <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-black text-sm font-bold px-3 py-1.5 rounded-full flex items-center gap-1 shadow-lg">
            <Sparkles className="w-4 h-4" />
            {matchPercentage}% Match
          </div>
        </div>
      )}

      {/* Header Section */}
      <div className="relative">
        {/* Enhanced Cover Image */}
        <div className="h-32 bg-gradient-to-br from-gray-800 via-gray-900 to-black relative overflow-hidden">
          <img 
            src={getCoverImage()} 
            alt="" 
            className="w-full h-full object-cover opacity-60 transition-opacity group-hover:opacity-70"
            onError={() => setCoverImageError(true)}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-transparent" />
        </div>

        {/* Profile Section */}
        <div className="px-6 -mt-12 relative">
          <div className="flex items-end gap-4">
            {/* Profile Image */}
            <div className="relative">
              <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-green-400 to-emerald-600 p-0.5">
                <div className="w-full h-full rounded-2xl bg-gray-900 flex items-center justify-center text-2xl font-bold text-white overflow-hidden">
                  <img 
                    src={profileImageUrl}
                    alt={expert.name}
                    className="w-full h-full object-cover"
                    onError={() => setImageError(true)}
                  />
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
              <span className="text-white font-medium ml-1">{rating.toFixed(1)}</span>
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
        {/* Credentials */}
        <CredentialBadges />

        {/* Bio */}
        {expert.bio && (
          <p className="text-gray-300 text-sm line-clamp-2 mb-4">
            {expert.bio}
          </p>
        )}

        {/* Website Preview Section */}
        {websiteData.length > 0 && (
          <WebsitePreview websites={websiteData} expertName={expert.name} />
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
          {validPhone && expert.consultation_types?.includes('phone') && (
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
          {expert.linkedin_url || primaryContact?.method === 'linkedin' && (
            <a 
              href={expert.linkedin_url || primaryContact?.value} 
              target="_blank" 
              rel="noopener noreferrer"
              className="p-2 bg-gray-800 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              <Linkedin className="w-4 h-4" />
            </a>
          )}
        </div>

        {/* Action Buttons */}
        <div className="space-y-2">
          <div className="mt-6">
          <WebsitePreview 
            websites={websiteData} 
            expert={expert}
          />
        </div>
          <button
            onClick={() => onClick(expert)}
            className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-black font-medium py-3 px-4 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 group"
          >
            <span>View Full Profile</span>
            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
          
          {/* Email Button - Only show if valid email exists */}
          {validEmail && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (onEmailClick) {
                  onEmailClick(expert);
                } else {
                  // Fallback to mailto
                  const subject = encodeURIComponent(`Consultation Request - ${expert.skills?.[0] || 'Expertise'}`);
                  const body = encodeURIComponent(`Dear ${expert.name},\n\nI came across your profile and would like to discuss a potential consultation.\n\nBest regards,`);
                  window.location.href = `mailto:${validEmail}?subject=${subject}&body=${body}`;
                }
              }}
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