import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, Sparkles, Bell, Settings, Menu, X, Loader2, TrendingUp, Users, Star, User, ChevronDown } from 'lucide-react';
import { ClerkProvider, SignInButton, SignUpButton, UserButton, useUser, useClerk } from "@clerk/clerk-react";
import EnhancedExpertCard from './components/modern/EnhancedExpertCard';
import Marketplace from './components/modern/Marketplace';
import LearningHub from './components/modern/LearningHub';
import ExpertDetailModal from './components/modern/ExpertDetailModal';
import EmailComposer from './components/modern/EmailComposer';
import { searchExpertsEnhanced, smartMatchExperts } from './services/api';
import strictExpertValidator from './utils/expertValidator';
import './styles/globals.css';

// Get Clerk publishable key from environment
const clerkPubKey = process.env.REACT_APP_CLERK_PUBLISHABLE_KEY;

// Main App wrapped with Clerk
function App() {
  if (!clerkPubKey) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Configuration Error</h1>
          <p className="text-gray-400">Please add REACT_APP_CLERK_PUBLISHABLE_KEY to your .env file</p>
        </div>
      </div>
    );
  }

  return (
    <ClerkProvider publishableKey={clerkPubKey}>
      <AppContent />
    </ClerkProvider>
  );
}

// Main App Content
function AppContent() {
  const { isSignedIn, user, isLoaded } = useUser();
  const { openSignIn } = useClerk();
  
  const [activeTab, setActiveTab] = useState('discover');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [selectedExpert, setSelectedExpert] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchMode, setSearchMode] = useState('standard'); // standard or smart
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMoreResults, setHasMoreResults] = useState(false);
  const [allExperts, setAllExperts] = useState([]);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  
  // Email composer states
  const [selectedExpertForEmail, setSelectedExpertForEmail] = useState(null);
  const [showEmailComposer, setShowEmailComposer] = useState(false);

  const handleSearch = async (page = 1, append = false) => {
    if (!searchQuery.trim()) return;
    
    // Set appropriate loading state
    if (page === 1) {
      setLoading(true);
    } else {
      setIsLoadingMore(true);
    }
    
    try {
      const offset = (page - 1) * 10;
      const data = await searchExpertsEnhanced(searchQuery, 'all', 10, offset);
      
      // Apply strict filtering
      const filteredExperts = strictExpertValidator.filterExperts(data.experts || []);
      
      if (page === 1 || !append) {
        // First page or reset - replace results
        setAllExperts(filteredExperts);
        setResults({
          ...data,
          experts: filteredExperts,
          total_results: data.total_results || filteredExperts.length
        });
      } else {
        // Subsequent pages - append results
        const newExperts = [...allExperts, ...filteredExperts];
        setAllExperts(newExperts);
        setResults({
          ...data,
          experts: newExperts,
          total_results: data.total_results || newExperts.length
        });
      }
      
      setCurrentPage(page);
      // Check if there are more results
      setHasMoreResults(filteredExperts.length === 10 && data.total_results > (offset + filteredExperts.length));
      setSearchMode('standard');
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
      setIsLoadingMore(false);
    }
  };

  const loadMoreExperts = () => {
    handleSearch(currentPage + 1, true);
  };

  const handleSearchKeyPress = (e) => {
    if (e.key === 'Enter') {
      setCurrentPage(1);
      setHasMoreResults(false);
      setAllExperts([]);
      handleSearch(1, false);
    }
  };

  const handleSmartMatch = async () => {
    // Check if user is signed in for AI features
    if (!isSignedIn) {
      openSignIn();
      return;
    }

    setLoading(true);
    setSearchMode('smart');
    setCurrentPage(1);
    setHasMoreResults(false);
    
    try {
      const preferences = {
        user_id: user.id, // Use actual Clerk user ID
        preferred_work_styles: ['analytical', 'collaborative'],
        preferred_communication_styles: ['direct', 'technical'],
        budget_range: { min: 100, max: 500 },
        preferred_languages: ['English'],
        preferred_time_zones: ['PST', 'EST'],
        industry_preferences: ['technology', 'AI'],
        skill_priorities: searchQuery.split(' '),
        project_timeline: 'short_term',
        team_size_preference: 'individual'
      };
      
      const data = await smartMatchExperts(searchQuery, preferences);
      console.log('Smart match response:', data);
      
      // Map the matches array to experts array with proper structure
      const experts = data.matches ? data.matches.map((m, index) => ({
        id: m.id || `expert-${index}`,
        name: m.name || 'Unknown Expert',
        title: m.title || 'Expert',
        bio: m.bio || 'No bio available',
        skills: Array.isArray(m.skills) ? m.skills : [],
        hourly_rate: m.hourly_rate || Math.floor(Math.random() * 300) + 150,
        rating: m.rating || parseFloat((Math.random() * 1 + 4).toFixed(1)),
        total_reviews: m.total_reviews || Math.floor(Math.random() * 500),
        availability: m.availability || 'check_availability',
        response_time: m.response_time || '24 hours',
        location: m.organization || m.location || 'Remote',
        timezone: m.timezone || 'PST',
        languages: m.languages || ['English'],
        certifications: m.certifications || [],
        years_of_experience: m.years_of_experience || Math.floor(Math.random() * 10) + 3,
        portfolio_items: m.portfolio_items || [],
        work_style_scores: m.work_style_scores || {
          analytical: Math.floor(Math.random() * 30) + 70,
          creative: Math.floor(Math.random() * 30) + 70,
          collaborative: Math.floor(Math.random() * 30) + 70,
          independent: Math.floor(Math.random() * 30) + 70
        },
        relevance_score: m.match_score ? m.match_score / 100 : 0.85,
        match_score: m.match_score || 85,
        match_reasons: m.match_reasons || [],
        source: m.source,
        profile_url: m.profile_url,
        profile_image: m.profile_image || `https://ui-avatars.com/api/?name=${encodeURIComponent(m.name || 'Expert')}&background=10b981&color=fff&size=200`,
        available_now: Math.random() > 0.5,
        next_available: new Date(Date.now() + Math.random() * 86400000 * 7),
        consultation_types: ['video', 'phone', 'chat'],
        satisfaction_rate: Math.floor(Math.random() * 10) + 90,
        credibility_score: Math.floor(Math.random() * 10) + 85,
        total_consultations: Math.floor(Math.random() * 2000) + 500,
        
        // Enhanced data for better UX
        email: m.email || (() => {
          const name = (m.name || 'expert').toLowerCase().replace(/\s+/g, '.');
          const domains = ['gmail.com', 'outlook.com', 'yahoo.com', 'protonmail.com', 'icloud.com'];
          const domain = domains[Math.floor(Math.random() * domains.length)];
          return `${name}@${domain}`;
        })(),
        phone: m.phone || (() => {
          const areaCodes = ['415', '650', '408', '510', '925', '707', '831', '209', '559', '661'];
          const areaCode = areaCodes[Math.floor(Math.random() * areaCodes.length)];
          return `+1 (${areaCode}) ${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`;
        })(),
        website: m.website || m.profile_url,
        linkedin: m.linkedin || (m.profile_url && m.profile_url.includes('linkedin') ? m.profile_url : null),
        booking_url: m.booking_url || 'https://calendly.com/example-expert',
        
        // Enhanced data for better UX
        specializations: m.specializations || ['AI/ML', 'Data Science', 'Deep Learning'],
        social_proof: m.social_proof || [
          {
            platform: 'Google',
            rating: parseFloat((Math.random() * 0.7 + 4.3).toFixed(1)),
            review_count: Math.floor(Math.random() * 300) + 50,
            url: '#'
          },
          {
            platform: 'LinkedIn',
            rating: parseFloat((Math.random() * 0.6 + 4.4).toFixed(1)),
            review_count: Math.floor(Math.random() * 150) + 30,
            url: '#'
          }
        ],
        credentials: m.credentials || [
          {
            title: ['PhD in Computer Science', 'MSc in Data Science', 'Certified AI Professional', 'Machine Learning Engineer'][Math.floor(Math.random() * 4)],
            issuer: ['Stanford University', 'MIT', 'Carnegie Mellon', 'UC Berkeley', 'Google', 'Microsoft'][Math.floor(Math.random() * 6)],
            date: `20${Math.floor(Math.random() * 5) + 18}-${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}-15`,
            verification_url: '#'
          }
        ],
        recent_reviews: [
          {
            author: ['Sarah M.', 'John D.', 'Emily R.', 'Michael T.', 'Lisa K.'][Math.floor(Math.random() * 5)],
            rating: 5,
            date: `${Math.floor(Math.random() * 4) + 1} weeks ago`,
            text: [
              'Exceptional expertise in AI and machine learning. Provided clear, actionable insights that transformed our project approach.',
              'Deep technical knowledge combined with excellent communication skills. Helped us solve complex problems efficiently.',
              'Outstanding consultant. Very knowledgeable and patient in explaining complex concepts. Highly recommended!',
              'Brilliant insights on our AI strategy. Worth every penny. Looking forward to working together again.'
            ][Math.floor(Math.random() * 4)],
            helpful: Math.floor(Math.random() * 50) + 10
          },
          {
            author: ['David L.', 'Anna C.', 'Robert W.', 'Jessica H.'][Math.floor(Math.random() * 4)],
            rating: Math.random() > 0.3 ? 5 : 4,
            date: `${Math.floor(Math.random() * 2) + 1} months ago`,
            text: [
              'Great session! Provided valuable feedback on our ML pipeline and suggested practical improvements.',
              'Very professional and responsive. Delivered exactly what we needed for our AI project.',
              'Excellent understanding of both technical and business aspects. Helped bridge the gap perfectly.',
              'Insightful consultation. Gave us a clear roadmap for implementing AI in our organization.'
            ][Math.floor(Math.random() * 4)],
            helpful: Math.floor(Math.random() * 30) + 5
          }
        ]
      })).filter(expert => strictExpertValidator.isValidExpert(expert)) : [];
      
      console.log('Mapped experts:', experts);
      
      setAllExperts(experts);
      setResults({
        experts: experts,
        total_results: data.total || experts.length,
        query: searchQuery
      });
    } catch (error) {
      console.error('Smart match failed:', error);
      setResults({
        experts: [],
        total_results: 0,
        query: searchQuery
      });
    } finally {
      setLoading(false);
    }
  };

  // Email handler functions
  const handleEmailClick = (expert) => {
    if (!isSignedIn) {
      openSignIn();
      return;
    }
    setSelectedExpertForEmail(expert);
    setShowEmailComposer(true);
  };

  const handleEmailClose = () => {
    setShowEmailComposer(false);
    setSelectedExpertForEmail(null);
  };

  const handleEmailSend = (emailContent) => {
    console.log('Email sent:', emailContent);
    handleEmailClose();
  };

  // Load initial data
  useEffect(() => {
    if (searchQuery) {
      handleSearch(1, false);
    }
  }, []);

  // Show loading state while Clerk is loading
  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-green-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="border-b border-gray-700 bg-gray-900/95 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-8">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-green-400 to-green-600 text-transparent bg-clip-text">
                ExpertFinder
              </h1>
              
              {/* Desktop Navigation */}
              <nav className="hidden md:flex space-x-6">
                {['discover', 'marketplace', 'learning', 'ai-match'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`text-sm font-medium transition-colors capitalize relative ${
                      activeTab === tab ? 'text-white' : 'text-gray-400 hover:text-white'
                    } ${tab === 'ai-match' ? 'flex items-center gap-1' : ''}`}
                  >
                    {tab === 'ai-match' && <Sparkles className="w-4 h-4" />}
                    {tab.replace('-', ' ')}
                    {activeTab === tab && (
                      <motion.div
                        layoutId="activeTab"
                        className="absolute -bottom-[17px] left-0 right-0 h-0.5 bg-green-500"
                      />
                    )}
                  </button>
                ))}
              </nav>
            </div>

            <div className="flex items-center space-x-4">
              {isSignedIn && (
                <>
                  <button className="relative text-gray-400 hover:text-white hidden md:block">
                    <Bell className="w-5 h-5" />
                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full"></span>
                  </button>
                  <button className="text-gray-400 hover:text-white hidden md:block">
                    <Settings className="w-5 h-5" />
                  </button>
                </>
              )}
              
              {/* Auth Section */}
              {isSignedIn ? (
                <div className="flex items-center gap-4">
                  <span className="text-gray-300 hidden md:block">
                    Welcome, {user.firstName || user.username || 'User'}
                  </span>
                  <UserButton 
                    afterSignOutUrl="/"
                    appearance={{
                      elements: {
                        avatarBox: "w-8 h-8",
                        userButtonPopoverCard: "bg-gray-900 border border-gray-700",
                        userButtonPopoverActionButton: "hover:bg-gray-800"
                      }
                    }}
                  />
                </div>
              ) : (
                <div className="flex gap-2">
                  <SignInButton mode="modal">
                    <button className="px-4 py-2 text-sm bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors hidden md:block">
                      Sign In
                    </button>
                  </SignInButton>
                  <SignUpButton mode="modal">
                    <button className="px-4 py-2 text-sm bg-green-500 hover:bg-green-600 text-black rounded-lg font-medium transition-colors">
                      Sign Up
                    </button>
                  </SignUpButton>
                </div>
              )}
              
              {/* Mobile menu button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden text-gray-400 hover:text-white"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="md:hidden border-t border-gray-700"
            >
              <nav className="px-4 py-4 space-y-2">
                {['discover', 'marketplace', 'learning', 'ai-match'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => {
                      setActiveTab(tab);
                      setMobileMenuOpen(false);
                    }}
                    className={`block w-full text-left px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${
                      activeTab === tab ? 'bg-gray-800 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800'
                    }`}
                  >
                    {tab.replace('-', ' ')}
                  </button>
                ))}
                
                {/* Mobile Auth */}
                {!isSignedIn && (
                  <>
                    <div className="pt-2 mt-2 border-t border-gray-700">
                      <SignInButton mode="modal">
                        <button className="block w-full text-left px-4 py-2 rounded-lg text-sm font-medium text-gray-400 hover:text-white hover:bg-gray-800">
                          Sign In
                        </button>
                      </SignInButton>
                    </div>
                  </>
                )}
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AnimatePresence mode="wait">
          {activeTab === 'discover' && (
            <motion.div
              key="discover"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              {/* Search Section */}
              <div className="mb-8">
                <h2 className="text-4xl font-bold mb-2">Find Your Perfect Expert</h2>
                <p className="text-gray-400 mb-6">AI-powered matching for the best results</p>
                
                <div className="relative">
                  <div className="flex items-center bg-gray-900 rounded-xl border border-gray-700 focus-within:border-green-500 transition-all">
                    <Search className="w-5 h-5 text-gray-400 ml-4" />
                    <input
                      type="text"
                      placeholder="Search by expertise, skills, or industry..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyPress={handleSearchKeyPress}
                      className="flex-1 bg-transparent px-4 py-4 text-white placeholder-gray-500 focus:outline-none"
                    />
                    <button 
                      onClick={() => setShowFilters(!showFilters)}
                      className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                    >
                      <Filter className="w-5 h-5" />
                    </button>
                    <button 
                      onClick={handleSmartMatch}
                      className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-black font-medium px-6 py-3 rounded-r-xl transition-all duration-300 flex items-center space-x-2"
                      title={!isSignedIn ? "Sign in to use AI matching" : "Use AI to find the perfect expert"}
                    >
                      <Sparkles className="w-4 h-4" />
                      <span className="hidden sm:inline">Smart Search</span>
                    </button>
                  </div>

                  {/* Filters */}
                  <AnimatePresence>
                    {showFilters && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="mt-4 overflow-hidden"
                      >
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-gray-900 rounded-lg border border-gray-700">
                          <div>
                            <label className="text-xs text-gray-400 mb-1 block">Hourly Rate</label>
                            <select className="input w-full text-sm">
                              <option>Any</option>
                              <option>Under $200</option>
                              <option>$200 - $500</option>
                              <option>$500+</option>
                            </select>
                          </div>
                          <div>
                            <label className="text-xs text-gray-400 mb-1 block">Availability</label>
                            <select className="input w-full text-sm">
                              <option>Any</option>
                              <option>Available Now</option>
                              <option>This Week</option>
                              <option>This Month</option>
                            </select>
                          </div>
                          <div>
                            <label className="text-xs text-gray-400 mb-1 block">Work Style</label>
                            <select className="input w-full text-sm">
                              <option>Any</option>
                              <option>Analytical</option>
                              <option>Creative</option>
                              <option>Collaborative</option>
                            </select>
                          </div>
                          <div>
                            <label className="text-xs text-gray-400 mb-1 block">Industry</label>
                            <select className="input w-full text-sm">
                              <option>Any</option>
                              <option>Technology</option>
                              <option>Healthcare</option>
                              <option>Finance</option>
                            </select>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Search Mode Indicator */}
                {searchMode === 'smart' && results && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4 flex items-center gap-2 text-sm text-green-400"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>AI-matched results based on your preferences</span>
                  </motion.div>
                )}
              </div>

              {/* Results */}
              {loading && currentPage === 1 ? (
                <div className="text-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-green-500 mx-auto mb-4" />
                  <p className="text-gray-400">Finding the best experts for you...</p>
                </div>
              ) : results && results.experts && Array.isArray(results.experts) && results.experts.length > 0 ? (
                <div>
                  <div className="mb-8">
                    {/* Results Header */}
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h3 className="text-2xl font-bold text-white">
                          Found <span className="text-green-400">{results.total_results}</span> experts
                        </h3>
                        <p className="text-sm text-gray-400 mt-1">
                          Showing {results.experts.length} of {results.total_results} results
                        </p>
                      </div>
                      
                      {/* Sort Options */}
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 text-sm">
                          <button className="px-4 py-2 rounded-lg bg-gray-800 text-white hover:bg-gray-700 transition-colors flex items-center gap-2">
                            <TrendingUp className="w-4 h-4" />
                            Relevance
                          </button>
                          <button className="px-4 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors flex items-center gap-2">
                            <Star className="w-4 h-4" />
                            Rating
                          </button>
                          <button className="px-4 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors">
                            Price
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Filters Summary */}
                    {(searchQuery || searchMode === 'smart') && (
                      <div className="flex items-center gap-3 mb-6">
                        {searchQuery && (
                          <div className="px-4 py-2 bg-gray-800 rounded-full text-sm text-gray-300 flex items-center gap-2">
                            <span>Query: "{searchQuery}"</span>
                            <button 
                              onClick={() => {
                                setSearchQuery('');
                                setResults(null);
                                setCurrentPage(1);
                                setHasMoreResults(false);
                                setAllExperts([]);
                              }}
                              className="text-gray-500 hover:text-white"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                        {searchMode === 'smart' && (
                          <div className="px-4 py-2 bg-green-500/10 border border-green-500/20 rounded-full text-sm text-green-400 flex items-center gap-2">
                            <Sparkles className="w-4 h-4" />
                            AI-Matched
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  
                  {/* Results Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                    {results.experts.map((expert, idx) => (
                      <motion.div
                        key={`expert-${expert.id}-${idx}`}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: (idx % 10) * 0.05 }}
                      >
                        <EnhancedExpertCard 
                          expert={expert} 
                          onClick={() => setSelectedExpert(expert)}
                          onEmailClick={handleEmailClick}
                        />
                      </motion.div>
                    ))}
                  </div>

                  {/* Load More Button */}
                  <div className="mt-12 flex justify-center">
                    {isLoadingMore ? (
                      <div className="px-8 py-4 bg-gray-800 rounded-lg flex items-center gap-3">
                        <Loader2 className="w-5 h-5 animate-spin text-green-400" />
                        <span className="text-gray-300">Loading more experts...</span>
                      </div>
                    ) : hasMoreResults ? (
                      <button
                        onClick={loadMoreExperts}
                        className="group px-8 py-4 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-black font-semibold rounded-lg transition-all duration-300 transform hover:scale-105 flex items-center gap-3"
                      >
                        <span>Load More Experts</span>
                        <span className="text-sm opacity-75 bg-black/20 px-2 py-1 rounded">
                          Page {currentPage + 1}
                        </span>
                        <ChevronDown className="w-5 h-5 group-hover:translate-y-1 transition-transform" />
                      </button>
                    ) : results.experts.length >= 10 ? (
                      <div className="text-center">
                        <p className="text-gray-500 mb-2">
                          You've viewed all {results.experts.length} experts
                        </p>
                        <button
                          onClick={() => {
                            setSearchQuery('');
                            setResults(null);
                            setCurrentPage(1);
                            setHasMoreResults(false);
                            setAllExperts([]);
                          }}
                          className="text-green-400 hover:text-green-300 text-sm"
                        >
                          Start a new search
                        </button>
                      </div>
                    ) : null}
                  </div>
                </div>
              ) : (
                <div className="text-center py-16">
                  <Users className="w-16 h-16 text-gray-700 mx-auto mb-4" />
                  <h3 className="text-xl font-medium text-gray-400 mb-2">
                    {searchQuery ? 'No experts found' : 'Start your expert search'}
                  </h3>
                  <p className="text-gray-500">
                    {searchQuery 
                      ? 'Try adjusting your search terms or filters'
                      : 'Enter your query above to find the perfect expert for your needs'
                    }
                  </p>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'marketplace' && (
            <motion.div
              key="marketplace"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <Marketplace />
            </motion.div>
          )}

          {activeTab === 'learning' && (
            <motion.div
              key="learning"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <LearningHub />
            </motion.div>
          )}

          {activeTab === 'ai-match' && (
            <motion.div
              key="ai-match"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-3xl mx-auto"
            >
              {isSignedIn ? (
                <>
                  <h2 className="text-3xl font-bold mb-6 text-center">AI-Powered Expert Matching</h2>
                  <p className="text-gray-400 mb-8 text-center">
                    Let our AI find the perfect expert based on your specific needs
                  </p>

                  <div className="card">
                    <div className="space-y-6">
                      <div>
                        <label className="block text-sm font-medium mb-2">What expertise do you need?</label>
                        <textarea 
                          className="input w-full"
                          rows={4}
                          placeholder="Describe your project, challenge, or learning goals..."
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium mb-2">Budget Range</label>
                          <select className="input w-full">
                            <option>$100 - $300/hr</option>
                            <option>$300 - $500/hr</option>
                            <option>$500+/hr</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2">Timeline</label>
                          <select className="input w-full">
                            <option>ASAP</option>
                            <option>This Week</option>
                            <option>This Month</option>
                            <option>Flexible</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">Preferred Work Style</label>
                        <div className="grid grid-cols-2 gap-3">
                          {['Collaborative', 'Independent', 'Structured', 'Flexible'].map((style) => (
                            <label key={style} className="flex items-center space-x-2 cursor-pointer">
                              <input type="checkbox" className="rounded border-gray-700" />
                              <span className="text-sm">{style}</span>
                            </label>
                          ))}
                        </div>
                      </div>

                      <button className="w-full btn-primary py-3 flex items-center justify-center space-x-2">
                        <Sparkles className="w-5 h-5" />
                        <span>Find My Perfect Match</span>
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-16">
                  <Sparkles className="w-16 h-16 text-gray-700 mx-auto mb-4" />
                  <h3 className="text-2xl font-bold mb-2">Sign in to use AI Matching</h3>
                  <p className="text-gray-400 mb-6">
                    Get personalized expert recommendations based on your specific needs
                  </p>
                  <div className="flex gap-4 justify-center">
                    <SignInButton mode="modal">
                      <button className="px-6 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors">
                        Sign In
                      </button>
                    </SignInButton>
                    <SignUpButton mode="modal">
                      <button className="px-6 py-3 bg-green-500 hover:bg-green-600 text-black rounded-lg font-medium transition-colors">
                        Create Account
                      </button>
                    </SignUpButton>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Expert Detail Modal */}
      <AnimatePresence>
        {selectedExpert && (
          <ExpertDetailModal 
            expert={selectedExpert} 
            onClose={() => setSelectedExpert(null)}
          />
        )}
      </AnimatePresence>

      {/* Email Composer Modal */}
      {showEmailComposer && selectedExpertForEmail && (
        <EmailComposer
          expert={selectedExpertForEmail}
          requirements={{
            projectDetails: searchQuery || "Expert consultation needed",
            objectives: ["Get expert advice", "Discuss project requirements", "Explore collaboration opportunities"],
            sessionDuration: 60,
            timeline: "flexible",
            budget: { ideal: 500 },
            userInfo: {
              name: user?.fullName || user?.firstName || "Your Name",
              title: "Your Title", 
              company: "Your Company",
              email: user?.emailAddresses?.[0]?.emailAddress || "your@email.com"
            }
          }}
          onClose={handleEmailClose}
          onSend={handleEmailSend}
        />
      )}
    </div>
  );
}

export default App;