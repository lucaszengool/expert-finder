// ExpertDetailModal.js - Save this in src/components/modern/ExpertDetailModal.js

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Star, MapPin, Clock, DollarSign, Calendar, 
  CheckCircle, Award, Briefcase, MessageCircle,
  Video, Phone, Mail, Globe, Linkedin, Twitter,
  BookOpen, Users, TrendingUp, Shield, ExternalLink,
  ChevronRight, Share2, Heart, Download, Bot
} from 'lucide-react';
import AIAgentChat from './AIAgentChat';
import AIEmailAgent from './AIEmailAgent';
import EmailComposer from './EmailComposer';

const ExpertDetailModal = ({ expert, onClose }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [imageError, setImageError] = useState(false);
  const [showAIAgent, setShowAIAgent] = useState(false);
  const [showEmailAgent, setShowEmailAgent] = useState(false);
  const [showEmailComposer, setShowEmailComposer] = useState(false);

  if (!expert) return null;

  const rating = expert.rating || 4.5;
  const totalReviews = expert.total_reviews || expert.social_proof?.[0]?.review_count || 0;

  const getAvailabilityStatus = () => {
    if (expert.available_now) return { text: 'Available Now', color: 'text-green-400', bgColor: 'bg-green-400/10' };
    if (expert.next_available) {
      const hoursUntil = Math.round((new Date(expert.next_available) - new Date()) / (1000 * 60 * 60));
      if (hoursUntil < 24) return { text: `Available in ${hoursUntil}h`, color: 'text-yellow-400', bgColor: 'bg-yellow-400/10' };
    }
    return { text: 'Check Availability', color: 'text-gray-400', bgColor: 'bg-gray-400/10' };
  };

  const availability = getAvailabilityStatus();

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 overflow-y-auto"
        onClick={onClose}
      >
        <div className="min-h-screen flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-gray-900 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header with Cover */}
            <div className="relative">
              <div className="h-48 bg-gradient-to-br from-green-600 to-emerald-700 relative">
                {expert.cover_image && (
                  <img 
                    src={expert.cover_image} 
                    alt="" 
                    className="w-full h-full object-cover opacity-50"
                  />
                )}
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Profile Section */}
              <div className="px-8 -mt-16 relative">
                <div className="flex items-end gap-6">
                  <div className="relative">
                    <div className="w-32 h-32 rounded-2xl bg-gradient-to-br from-green-400 to-emerald-600 p-0.5">
                      <div className="w-full h-full rounded-2xl bg-gray-900 flex items-center justify-center text-3xl font-bold text-white overflow-hidden">
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
                      <div className="absolute -bottom-2 -right-2 bg-blue-500 rounded-full p-2">
                        <CheckCircle className="w-6 h-6 text-white" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 pb-4">
                    <h2 className="text-3xl font-bold text-white mb-1">{expert.name}</h2>
                    <p className="text-xl text-gray-300 mb-3">{expert.title}</p>
                    
                    <div className="flex items-center gap-6 text-sm">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-300">{expert.location || 'Remote'}</span>
                      </div>
                      <div className={`px-3 py-1 rounded-full ${availability.bgColor} ${availability.color} font-medium`}>
                        {availability.text}
                      </div>
                      {expert.response_time && (
                        <div className="flex items-center gap-1 text-gray-400">
                          <Clock className="w-4 h-4" />
                          <span>Responds {expert.response_time}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 pb-4">
                    <button className="p-3 bg-gray-800 hover:bg-gray-700 rounded-lg text-gray-300 transition-colors">
                      <Share2 className="w-5 h-5" />
                    </button>
                    <button className="p-3 bg-gray-800 hover:bg-gray-700 rounded-lg text-gray-300 transition-colors">
                      <Heart className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="px-8 mt-6 border-b border-gray-800">
              <div className="flex gap-8">
                {['overview', 'experience', 'reviews', 'contact'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`pb-4 capitalize font-medium transition-colors relative ${
                      activeTab === tab ? 'text-green-400' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    {tab}
                    {activeTab === tab && (
                      <motion.div
                        layoutId="activeTab"
                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-green-400"
                      />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Content */}
            <div className="px-8 py-6">
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {/* Stats Grid */}
                  <div className="grid grid-cols-4 gap-4">
                    <div className="bg-gray-800/50 rounded-xl p-4 text-center">
                      <div className="text-2xl font-bold text-green-400">
                        {expert.years_of_experience || expert.experience_years || '5+'}
                      </div>
                      <div className="text-sm text-gray-400 mt-1">Years Experience</div>
                    </div>
                    <div className="bg-gray-800/50 rounded-xl p-4 text-center">
                      <div className="text-2xl font-bold text-green-400">
                        ${expert.hourly_rate || '250'}
                      </div>
                      <div className="text-sm text-gray-400 mt-1">Per Hour</div>
                    </div>
                    <div className="bg-gray-800/50 rounded-xl p-4 text-center">
                      <div className="text-2xl font-bold text-green-400">
                        {expert.total_consultations || '1000+'}
                      </div>
                      <div className="text-sm text-gray-400 mt-1">Consultations</div>
                    </div>
                    <div className="bg-gray-800/50 rounded-xl p-4 text-center">
                      <div className="text-2xl font-bold text-green-400">
                        {expert.satisfaction_rate || '95'}%
                      </div>
                      <div className="text-sm text-gray-400 mt-1">Satisfaction</div>
                    </div>
                  </div>

                  {/* Bio */}
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-3">About</h3>
                    <p className="text-gray-300 leading-relaxed">
                      {expert.bio || 'Experienced professional dedicated to helping clients achieve their goals.'}
                    </p>
                  </div>

                  {/* Skills */}
                  {expert.skills && expert.skills.length > 0 && (
                    <div>
                      <h3 className="text-xl font-semibold text-white mb-3">Expertise</h3>
                      <div className="flex flex-wrap gap-2">
                        {expert.skills.map((skill, idx) => (
                          <span 
                            key={idx}
                            className="px-4 py-2 bg-gray-800 text-gray-300 rounded-lg"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Match Reasons */}
                  {expert.match_reasons && expert.match_reasons.length > 0 && (
                    <div className="p-4 bg-green-500/10 rounded-xl border border-green-500/20">
                      <h4 className="text-sm font-medium text-green-400 mb-3 flex items-center gap-2">
                        <Shield className="w-4 h-4" />
                        Why We Matched You
                      </h4>
                      <ul className="space-y-2">
                        {expert.match_reasons.map((reason, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                            <span className="text-sm text-gray-300">{reason}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'experience' && (
                <div className="space-y-6">
                  {/* Credentials */}
                  {expert.credentials && expert.credentials.length > 0 && (
                    <div>
                      <h3 className="text-xl font-semibold text-white mb-4">Credentials</h3>
                      <div className="space-y-3">
                        {expert.credentials.map((cred, idx) => (
                          <div key={idx} className="flex items-start gap-4 p-4 bg-gray-800/50 rounded-lg">
                            <Award className="w-6 h-6 text-green-400 flex-shrink-0 mt-1" />
                            <div className="flex-1">
                              <h4 className="font-medium text-white">{cred.title}</h4>
                              <p className="text-sm text-gray-400">{cred.issuer}</p>
                              <p className="text-xs text-gray-500 mt-1">{cred.date}</p>
                            </div>
                            {cred.verification_url && (
                              <a 
                                href={cred.verification_url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-green-400 hover:text-green-300"
                              >
                                <ExternalLink className="w-4 h-4" />
                              </a>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Work Style */}
                  {expert.work_style_scores && (
                    <div>
                      <h3 className="text-xl font-semibold text-white mb-4">Work Style</h3>
                      <div className="space-y-3">
                        {Object.entries(expert.work_style_scores).map(([style, score]) => (
                          <div key={style}>
                            <div className="flex justify-between mb-1">
                              <span className="text-sm text-gray-300 capitalize">{style}</span>
                              <span className="text-sm text-gray-400">{score}%</span>
                            </div>
                            <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${score}%` }}
                                transition={{ duration: 1, delay: 0.2 }}
                                className="h-full bg-gradient-to-r from-green-500 to-emerald-500"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'reviews' && (
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <div className="flex items-center gap-3">
                        <div className="text-4xl font-bold text-white">{typeof rating === 'number' ? rating.toFixed(1) : rating}</div>
                        <div>
                          <div className="flex items-center gap-1">
                            {[...Array(5)].map((_, i) => (
                              <Star 
                                key={i} 
                                className={`w-5 h-5 ${i < Math.floor(rating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600'}`} 
                              />
                            ))}
                          </div>
                          <p className="text-sm text-gray-400 mt-1">{totalReviews} reviews</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Rating Breakdown */}
                  <div className="mb-8">
                    <h4 className="text-lg font-semibold text-white mb-4">Rating Breakdown</h4>
                    <div className="space-y-2">
                      {[5, 4, 3, 2, 1].map((stars) => {
                        const percentage = stars === 5 ? 60 : stars === 4 ? 25 : stars === 3 ? 10 : stars === 2 ? 3 : 2;
                        return (
                          <div key={stars} className="flex items-center gap-3">
                            <div className="flex items-center gap-1 w-20">
                              <span className="text-sm text-gray-400">{stars}</span>
                              <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                            </div>
                            <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-yellow-400 transition-all duration-500"
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                            <span className="text-sm text-gray-400 w-12 text-right">{percentage}%</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Social Proof */}
                  {expert.social_proof && expert.social_proof.length > 0 && (
                    <div className="mb-8">
                      <h4 className="text-lg font-semibold text-white mb-4">Verified Reviews From</h4>
                      <div className="grid grid-cols-3 gap-4">
                        {expert.social_proof.map((proof, idx) => (
                          <a
                            key={idx}
                            href={proof.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-4 bg-gray-800/50 rounded-lg hover:bg-gray-800 transition-colors"
                          >
                            <div className="text-sm text-gray-400 mb-1">{proof.platform}</div>
                            <div className="flex items-center gap-2">
                              <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                              <span className="font-medium text-white">{proof.rating}</span>
                              <span className="text-sm text-gray-500">({proof.review_count})</span>
                            </div>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Sample Reviews */}
                  <div>
                    <h4 className="text-lg font-semibold text-white mb-4">Recent Reviews</h4>
                    <div className="space-y-4">
                      {/* Use actual reviews from expert data or defaults */}
                      {(expert.recent_reviews || [
                        {
                          author: "Sarah M.",
                          rating: 5,
                          date: "2 weeks ago",
                          text: "Excellent expertise in AI and machine learning. Very knowledgeable and provided actionable insights for our project.",
                          helpful: 12,
                          verified: true
                        },
                        {
                          author: "John D.",
                          rating: 5,
                          date: "1 month ago",
                          text: "Great communication skills and deep technical knowledge. Helped us solve complex problems efficiently.",
                          helpful: 8,
                          verified: true
                        },
                        {
                          author: "Emily R.",
                          rating: 4,
                          date: "2 months ago",
                          text: "Very professional and responsive. Good value for the expertise provided.",
                          helpful: 5,
                          verified: true
                        }
                      ]).map((review, idx) => (
                        <div key={idx} className="p-4 bg-gray-800/50 rounded-lg">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-white">{review.author}</span>
                                {review.verified && (
                                  <span className="text-xs px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded-full">
                                    Verified
                                  </span>
                                )}
                                <span className="text-sm text-gray-500">{review.date}</span>
                              </div>
                              <div className="flex items-center gap-1 mt-1">
                                {[...Array(5)].map((_, i) => (
                                  <Star 
                                    key={i} 
                                    className={`w-3 h-3 ${i < review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600'}`} 
                                  />
                                ))}
                              </div>
                            </div>
                          </div>
                          <p className="text-gray-300 text-sm mb-3">{review.text}</p>
                          <div className="flex items-center gap-4 text-sm">
                            <button className="text-gray-400 hover:text-green-400 transition-colors">
                              Helpful ({review.helpful})
                            </button>
                            <button className="text-gray-400 hover:text-white transition-colors">
                              Report
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Load More */}
                    <button className="w-full mt-4 py-2 text-green-400 hover:text-green-300 transition-colors text-sm">
                      Load more reviews
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'contact' && (
                <div className="space-y-6">
                  {/* Contact Information */}
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-4">Contact Information</h3>
                    <div className="space-y-3">
                      {/* Email */}
                      {expert.email || expert.contacts?.find(c => c.method === 'email') ? (
                        <a
                          href={`mailto:${expert.email || expert.contacts.find(c => c.method === 'email')?.value}`}
                          className="flex items-center gap-3 p-4 bg-gray-800/50 rounded-lg hover:bg-gray-800 transition-colors"
                        >
                          <Mail className="w-5 h-5 text-green-400" />
                          <div className="text-left">
                            <div className="text-sm text-gray-400">Email</div>
                            <div className="text-white">{expert.email || expert.contacts.find(c => c.method === 'email')?.value || 'contact@expert.com'}</div>
                          </div>
                        </a>
                      ) : null}

                      {/* Phone */}
                      {expert.phone || expert.contacts?.find(c => c.method === 'phone') ? (
                        <a
                          href={`tel:${expert.phone || expert.contacts.find(c => c.method === 'phone')?.value}`}
                          className="flex items-center gap-3 p-4 bg-gray-800/50 rounded-lg hover:bg-gray-800 transition-colors"
                        >
                          <Phone className="w-5 h-5 text-green-400" />
                          <div className="text-left">
                            <div className="text-sm text-gray-400">Phone</div>
                            <div className="text-white">{expert.phone || expert.contacts.find(c => c.method === 'phone')?.value || '+1 (555) 123-4567'}</div>
                          </div>
                        </a>
                      ) : null}

                      {/* Website */}
                      {expert.website || expert.profile_url || expert.contacts?.find(c => c.method === 'website') ? (
                        <a
                          href={expert.website || expert.profile_url || expert.contacts.find(c => c.method === 'website')?.value}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 p-4 bg-gray-800/50 rounded-lg hover:bg-gray-800 transition-colors"
                        >
                          <Globe className="w-5 h-5 text-green-400" />
                          <div className="text-left flex-1">
                            <div className="text-sm text-gray-400">Website</div>
                            <div className="text-white truncate">{expert.website || expert.profile_url || expert.contacts.find(c => c.method === 'website')?.value || 'View Profile'}</div>
                          </div>
                          <ExternalLink className="w-4 h-4 text-gray-400" />
                        </a>
                      ) : null}

                      {/* LinkedIn */}
                      {expert.linkedin || expert.contacts?.find(c => c.method === 'linkedin') ? (
                        <a
                          href={expert.linkedin || expert.contacts.find(c => c.method === 'linkedin')?.value}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 p-4 bg-gray-800/50 rounded-lg hover:bg-gray-800 transition-colors"
                        >
                          <Linkedin className="w-5 h-5 text-green-400" />
                          <div className="text-left flex-1">
                            <div className="text-sm text-gray-400">LinkedIn</div>
                            <div className="text-white">View LinkedIn Profile</div>
                          </div>
                          <ExternalLink className="w-4 h-4 text-gray-400" />
                        </a>
                      ) : null}
                    </div>
                  </div>

                  {/* Booking Section */}
                  <div className="mt-6">
                    <div className="p-4 bg-gray-800/50 rounded-lg mb-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-gray-400">Consultation Rate</span>
                        <span className="text-2xl font-bold text-white">${expert.hourly_rate}/hr</span>
                      </div>
                      <div className="text-sm text-gray-500">
                        Minimum booking: 30 minutes
                      </div>
                    </div>

                    {/* Booking Button */}
                    <button 
                      onClick={() => {
                        if (expert.booking_url) {
                          window.open(expert.booking_url, '_blank');
                        } else if (expert.calendly_url) {
                          window.open(expert.calendly_url, '_blank');
                        }
                      }}
                      className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-black font-bold py-4 px-6 rounded-xl transition-all duration-300 flex items-center justify-center gap-2"
                    >
                      <Calendar className="w-5 h-5" />
                      Book Consultation
                    </button>

                    {/* Direct Email Button */}
                    <button 
                      onClick={() => setShowEmailComposer(true)}
                      className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold py-4 px-6 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 mt-3"
                    >
                      <Mail className="w-5 h-5" />
                      Send Email with AI Assistance
                    </button>

                    {/* AI Agent Button */}
                    <button 
                      onClick={() => setShowEmailAgent(true)}
                      className="w-full bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white font-bold py-4 px-6 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 mt-3"
                    >
                      <Bot className="w-5 h-5" />
                      Let AI Agent Handle Full Negotiation
                    </button>

                    {/* Response Time Notice */}
                    {expert.response_time && (
                      <p className="text-center text-sm text-gray-400 mt-3">
                        Typically responds {expert.response_time}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* AI Agent Chat Modal */}
      {showAIAgent && (
        <AIAgentChat 
          expert={expert} 
          onClose={() => setShowAIAgent(false)}
        />
      )}
      
      {/* AI Email Agent Modal */}
      {showEmailAgent && (
        <AIEmailAgent 
          expert={expert} 
          onClose={() => setShowEmailAgent(false)}
        />
      )}
      
      {/* Email Composer Modal */}
      {showEmailComposer && (
        <EmailComposer 
          expert={expert}
          requirements={{
            projectDetails: "I need consultation on AI/ML implementation",
            objectives: ["Technical architecture review", "Best practices guidance", "Implementation roadmap"],
            sessionDuration: "60",
            timeline: "flexible",
            budget: { ideal: expert.hourly_rate || 250 },
            userInfo: {
              name: "Your Name",
              title: "Your Title",
              company: "Your Company"
            }
          }}
          onClose={() => setShowEmailComposer(false)}
          onSend={(emailData) => {
            console.log('Email sent:', emailData);
            // Save to backend or track analytics
          }}
        />
      )}
    </AnimatePresence>
  );
};

export default ExpertDetailModal;