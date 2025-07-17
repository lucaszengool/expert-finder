import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, Sparkles, Bell, Settings, Menu, X, Loader2, TrendingUp, Users, Star, User, ChevronDown } from 'lucide-react';
import { ClerkProvider, SignInButton, SignUpButton, UserButton, useUser, useClerk } from "@clerk/clerk-react";
import EnhancedExpertCard from './components/modern/EnhancedExpertCard';
import ExpertDetailModal from './components/modern/ExpertDetailModal';
import EmailComposer from './components/modern/EmailComposer';
import { searchExpertsEnhanced, smartMatchExperts } from './services/api';
import strictExpertValidator from './utils/expertValidator';
import './styles/globals.css';
import WaitlistPage from './components/WaitlistPage';

// Get Clerk publishable key from environment
const clerkPubKey = process.env.REACT_APP_CLERK_PUBLISHABLE_KEY || "pk_test_aG9uZXN0LXB1bWEtMjUuY2xlcmsuYWNjb3VudHMuZGV2JA";

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
  
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [selectedExpert, setSelectedExpert] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchMode, setSearchMode] = useState('standard'); // standard or smart
  
  // Track AI search attempts for non-authenticated users
  const [aiSearchAttempts, setAiSearchAttempts] = useState(() => {
    // Get from localStorage to persist across page refreshes
    const saved = localStorage.getItem('aiSearchAttempts');
    return saved ? parseInt(saved) : 0;
  });
  const [showWaitlist, setShowWaitlist] = useState(false);
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMoreResults, setHasMoreResults] = useState(false);
  const [allExperts, setAllExperts] = useState([]);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  
  // Email composer states
  const [selectedExpertForEmail, setSelectedExpertForEmail] = useState(null);
  const [showEmailComposer, setShowEmailComposer] = useState(false);

  // Ref for scrolling
  const resultsEndRef = useRef(null);

  // Scroll to bottom when new results are added
  useEffect(() => {
    if (results?.experts?.length > 0) {
      resultsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [results]);

  // Save AI search attempts to localStorage
  useEffect(() => {
    localStorage.setItem('aiSearchAttempts', aiSearchAttempts.toString());
  }, [aiSearchAttempts]);

  // Reset AI search attempts for signed-in users
  useEffect(() => {
    if (isSignedIn) {
      setAiSearchAttempts(0);
      localStorage.removeItem('aiSearchAttempts');
    }
  }, [isSignedIn]);

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
    // Check if user is signed in
    if (!isSignedIn) {
      // Check if they've already used their free AI search
      if (aiSearchAttempts >= 1) {
        // Show waitlist page for non-authenticated users after 1 attempt
        setShowWaitlist(true);
        return;
      }
      
      // Increment attempts for non-authenticated users
      setAiSearchAttempts(prev => prev + 1);
    }

    setLoading(true);
    setSearchMode('smart');
    setCurrentPage(1);
    setHasMoreResults(false);
    
    try {
      const preferences = {
        user_id: user?.id || 'guest', // Use guest for non-authenticated users
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
      const validExperts = strictExpertValidator.filterExperts(experts);
    
    setResults({
      experts: validExperts,
      total_results: validExperts.length,
      enhanced_query: data.enhanced_query
    });
    
    // Show a notice for non-authenticated users that this is their free trial
    if (!isSignedIn && aiSearchAttempts === 1) {
      setTimeout(() => {
        const notice = document.createElement('div');
        notice.className = 'fixed bottom-4 right-4 bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 px-6 py-4 rounded-lg max-w-sm z-50';
        notice.innerHTML = `
          <p class="text-sm font-medium mb-1">Free AI Search Used</p>
          <p class="text-xs opacity-90">Sign up to get unlimited AI-powered searches</p>
        `;
        document.body.appendChild(notice);
        
        setTimeout(() => {
          notice.style.transition = 'opacity 0.5s';
          notice.style.opacity = '0';
          setTimeout(() => notice.remove(), 500);
        }, 5000);
      }, 1000);
    }
    
  } catch (error) {
    console.error('Smart match failed:', error);
    setResults({
      experts: [],
      total_results: 0,
      error: 'Failed to find matches'
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

  // Show loading state while Clerk is loading
  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-green-500" />
      </div>
    );
  }

  // Show waitlist page if triggered
  if (showWaitlist && !isSignedIn) {
    return <WaitlistPage />;
  }

  // Main app - now accessible to everyone
  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14">
            <div className="flex items-center space-x-8">
              <h1 className="text-xl font-bold bg-gradient-to-r from-green-400 to-green-600 text-transparent bg-clip-text">
                ExpertFinder
              </h1>
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
                  <span className="text-gray-300 hidden md:block text-sm">
                    {user.firstName || user.username || 'User'}
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
      </header>

      {/* Main Content Area - ChatGPT Style */}
      <main className="flex-1 flex flex-col relative">
        {/* Results Area */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Welcome Message when no search */}
            {!results && !loading && (
              <div className="flex items-center justify-center h-[calc(100vh-300px)]">
                <div className="text-center">
                  <Sparkles className="w-16 h-16 text-gray-700 mx-auto mb-4" />
                  <h2 className="text-3xl font-bold mb-2">Find Your Perfect Expert</h2>
                  <p className="text-gray-400">AI-powered matching for the best results</p>
                  {!isSignedIn && (
                    <p className="text-sm text-gray-500 mt-4">
                      Try our AI Search free • No signup required for your first search
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Loading State */}
            {loading && currentPage === 1 && (
              <div className="flex items-center justify-center h-[calc(100vh-300px)]">
                <div className="text-center">
                  <Loader2 className="w-8 h-8 animate-spin text-green-500 mx-auto mb-4" />
                  <p className="text-gray-400">Finding the best experts for you...</p>
                </div>
              </div>
            )}

            {/* Results */}
            {results && results.experts && Array.isArray(results.experts) && results.experts.length > 0 && (
              <div>
                {/* Results Header */}
                <div className="mb-8">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-2xl font-bold text-white">
                        Found <span className="text-green-400">{results.total_results}</span> experts
                      </h3>
                      {searchMode === 'smart' && (
                        <p className="text-sm text-gray-400 mt-1 flex items-center gap-2">
                          <Sparkles className="w-4 h-4" />
                          AI-matched results based on your preferences
                        </p>
                      )}
                    </div>
                    
                    {/* Sort Options */}
                    <div className="flex items-center gap-2 text-sm">
                      <button className="px-3 py-1.5 rounded-lg bg-gray-800 text-white hover:bg-gray-700 transition-colors flex items-center gap-2">
                        <TrendingUp className="w-4 h-4" />
                        Relevance
                      </button>
                      <button className="px-3 py-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors flex items-center gap-2">
                        <Star className="w-4 h-4" />
                        Rating
                      </button>
                      <button className="px-3 py-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors">
                        Price
                      </button>
                    </div>
                  </div>
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

                <div ref={resultsEndRef} />
              </div>
            )}

            {/* No Results */}
            {results && results.experts && results.experts.length === 0 && (
              <div className="flex items-center justify-center h-[calc(100vh-300px)]">
                <div className="text-center">
                  <Users className="w-16 h-16 text-gray-700 mx-auto mb-4" />
                  <h3 className="text-xl font-medium text-gray-400 mb-2">
                    No experts found
                  </h3>
                  <p className="text-gray-500">
                    Try adjusting your search terms or filters
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Search Bar at Bottom - ChatGPT Style */}
        <div className="border-t border-gray-800 bg-gray-900/50 backdrop-blur-md">
          <div className="max-w-4xl mx-auto px-4 py-4">
            <div className="relative">
              <div className="flex items-center bg-gray-800 rounded-xl border border-gray-700 focus-within:border-green-500 transition-all">
                <Search className="w-5 h-5 text-gray-400 ml-4" />
                <input
                  type="text"
                  placeholder="Search for experts by skills, industry, or expertise..."
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
                  className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-black font-medium px-6 py-3 rounded-r-xl transition-all duration-300 flex items-center space-x-2 relative"
                  title={!isSignedIn && aiSearchAttempts >= 1 ? "Sign up for unlimited AI searches" : "Use AI to find the perfect expert"}
                >
                  <Sparkles className="w-4 h-4" />
                  <span className="hidden sm:inline">AI Search</span>
                  {!isSignedIn && aiSearchAttempts === 0 && (
                    <span className="absolute -top-2 -right-2 bg-yellow-500 text-black text-xs px-2 py-0.5 rounded-full font-bold">
                      FREE
                    </span>
                  )}
                </button>
              </div>

              {/* Filters */}
              <AnimatePresence>
                {showFilters && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="absolute bottom-full mb-2 left-0 right-0 overflow-hidden"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-gray-800 rounded-lg border border-gray-700 shadow-xl">
                      <div>
                        <label className="text-xs text-gray-400 mb-1 block">Hourly Rate</label>
                        <select className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white">
                          <option>Any</option>
                          <option>Under $200</option>
                          <option>$200 - $500</option>
                          <option>$500+</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-xs text-gray-400 mb-1 block">Availability</label>
                        <select className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white">
                          <option>Any</option>
                          <option>Available Now</option>
                          <option>This Week</option>
                          <option>This Month</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-xs text-gray-400 mb-1 block">Work Style</label>
                        <select className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white">
                          <option>Any</option>
                          <option>Analytical</option>
                          <option>Creative</option>
                          <option>Collaborative</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-xs text-gray-400 mb-1 block">Industry</label>
                        <select className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white">
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
          </div>
        </div>
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