import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, Sparkles, Bell, Settings, Menu, X, Loader2, TrendingUp, Users, Star, User, ChevronDown, Brain, Zap, Shield, Globe, ArrowRight, CheckCircle, BarChart3, Clock, MessageSquare, Award } from 'lucide-react';
import { ClerkProvider, SignInButton, SignUpButton, UserButton, useUser, useClerk } from "@clerk/clerk-react";

// Placeholder components - replace with your actual imports
const EnhancedExpertCard = ({ expert, onClick, onEmailClick }) => (
  <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 cursor-pointer hover:border-green-500 transition-all" onClick={() => onClick(expert)}>
    <h3 className="text-lg font-semibold mb-2">{expert.name}</h3>
    <p className="text-gray-400 text-sm mb-4">{expert.title}</p>
    <div className="flex justify-between items-center">
      <span className="text-green-400">${expert.hourly_rate}/hr</span>
      <button 
        onClick={(e) => {
          e.stopPropagation();
          onEmailClick(expert);
        }}
        className="text-sm bg-green-500 text-black px-3 py-1 rounded hover:bg-green-600"
      >
        Contact
      </button>
    </div>
  </div>
);

const ExpertDetailModal = ({ expert, onClose }) => (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={onClose}>
    <div className="bg-gray-900 rounded-lg p-6 max-w-2xl w-full" onClick={e => e.stopPropagation()}>
      <h2 className="text-2xl font-bold mb-4">{expert.name}</h2>
      <p className="text-gray-400">{expert.bio}</p>
      <button onClick={onClose} className="mt-4 bg-gray-800 px-4 py-2 rounded hover:bg-gray-700">Close</button>
    </div>
  </div>
);

const EmailComposer = ({ expert, requirements, onClose, onSend }) => (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
    <div className="bg-gray-900 rounded-lg p-6 max-w-xl w-full">
      <h2 className="text-xl font-bold mb-4">Contact {expert.name}</h2>
      <textarea 
        className="w-full h-32 bg-gray-800 rounded p-3 text-white"
        placeholder="Write your message..."
      />
      <div className="flex gap-2 mt-4">
        <button onClick={() => onSend("Email sent!")} className="bg-green-500 text-black px-4 py-2 rounded hover:bg-green-600">Send</button>
        <button onClick={onClose} className="bg-gray-800 px-4 py-2 rounded hover:bg-gray-700">Cancel</button>
      </div>
    </div>
  </div>
);

// Mock API functions
const searchExpertsEnhanced = async (query) => {
  await new Promise(resolve => setTimeout(resolve, 1000));
  return {
    experts: Array(10).fill(null).map((_, i) => ({
      id: i,
      name: `Expert ${i + 1}`,
      title: "AI Specialist",
      bio: "Expert in artificial intelligence and machine learning",
      hourly_rate: 200 + i * 50,
      rating: 4.5,
      skills: ["AI", "ML", "Python"]
    })),
    total_results: 10
  };
};

const smartMatchExperts = async (query, preferences) => {
  await new Promise(resolve => setTimeout(resolve, 1500));
  return {
    matches: Array(6).fill(null).map((_, i) => ({
      id: `smart-${i}`,
      name: `AI Expert ${i + 1}`,
      title: "Senior AI Consultant",
      bio: "Specialized in enterprise AI solutions",
      hourly_rate: 300 + i * 100,
      rating: 4.8,
      skills: ["Deep Learning", "NLP", "Computer Vision"],
      match_score: 95 - i * 5
    }))
  };
};

// Get Clerk publishable key from environment
const clerkPubKey = process.env.REACT_APP_CLERK_PUBLISHABLE_KEY || "pk_live_Y2xlcmsuZXhwZXJ0ZmluZGVyb2ZmaWNpYWwub3JnJA";

// Landing Page Component
function LandingPage() {
  const { openSignUp } = useClerk();
  const [hoveredFeature, setHoveredFeature] = useState(null);

  const features = [
    {
      icon: Brain,
      title: "AI-Powered Matching",
      description: "Our advanced AI analyzes your requirements to find the perfect expert match",
      color: "from-purple-500 to-pink-500"
    },
    {
      icon: Globe,
      title: "Global Expert Network",
      description: "Access to over 10,000+ verified experts across 150+ countries",
      color: "from-blue-500 to-cyan-500"
    },
    {
      icon: Shield,
      title: "Verified Professionals",
      description: "All experts are thoroughly vetted with verified credentials and reviews",
      color: "from-green-500 to-emerald-500"
    },
    {
      icon: Zap,
      title: "Instant Connection",
      description: "Connect with experts in real-time through chat, video, or scheduled calls",
      color: "from-yellow-500 to-orange-500"
    }
  ];

  const stats = [
    { value: "10K+", label: "Expert Network" },
    { value: "98%", label: "Satisfaction Rate" },
    { value: "24/7", label: "Availability" },
    { value: "150+", label: "Countries" }
  ];

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 bg-gradient-to-br from-gray-900 via-black to-gray-900">
        <div className="absolute inset-0">
          {[...Array(50)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-green-400 rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                opacity: [0, 1, 0],
                scale: [0, 1.5, 0],
              }}
              transition={{
                duration: 3 + Math.random() * 2,
                repeat: Infinity,
                delay: Math.random() * 5,
              }}
            />
          ))}
        </div>
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-gray-800 bg-gray-900/50 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-green-400 to-green-600 text-transparent bg-clip-text">
              ExpertFinder
            </h1>
            <div className="flex gap-3">
              <SignInButton mode="modal">
                <button className="px-4 py-2 text-sm bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors">
                  Sign In
                </button>
              </SignInButton>
              <SignUpButton mode="modal">
                <button className="px-4 py-2 text-sm bg-green-500 hover:bg-green-600 text-black rounded-lg font-medium transition-colors">
                  Get Started
                </button>
              </SignUpButton>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 pt-20 pb-32 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 bg-green-500/10 border border-green-500/30 rounded-full px-4 py-2 mb-6">
              <Sparkles className="w-4 h-4 text-green-400" />
              <span className="text-sm text-green-400">AI-Powered Expert Matching</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-white via-green-100 to-green-400 text-transparent bg-clip-text">
              Find Your Perfect Expert
              <br />
              <span className="text-3xl md:text-5xl">In Seconds, Not Hours</span>
            </h1>
            
            <p className="text-xl text-gray-400 mb-8 max-w-3xl mx-auto">
              Connect with verified professionals worldwide. Our AI matches you with the right expert based on your specific needs, budget, and preferences.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <SignUpButton mode="modal">
                <button className="group px-8 py-4 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-black font-semibold rounded-lg transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-2">
                  <span>Start Free Trial</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
              </SignUpButton>
              <button className="px-8 py-4 bg-gray-800 hover:bg-gray-700 text-white font-medium rounded-lg transition-all duration-300 border border-gray-700">
                Watch Demo
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
              {stats.map((stat, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + index * 0.1 }}
                  className="text-center"
                >
                  <div className="text-3xl md:text-4xl font-bold text-green-400 mb-1">{stat.value}</div>
                  <div className="text-sm text-gray-400">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="relative z-10 py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold mb-4">Why Choose ExpertFinder?</h2>
            <p className="text-xl text-gray-400">Advanced features that set us apart</p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + index * 0.1 }}
                onHoverStart={() => setHoveredFeature(index)}
                onHoverEnd={() => setHoveredFeature(null)}
                className="relative group"
              >
                <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 h-full transition-all duration-300 hover:border-gray-700 hover:bg-gray-900/80">
                  <div className={`w-12 h-12 rounded-lg bg-gradient-to-r ${feature.color} p-0.5 mb-4`}>
                    <div className="w-full h-full bg-gray-900 rounded-lg flex items-center justify-center">
                      <feature.icon className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                  <p className="text-gray-400">{feature.description}</p>
                  
                  {hoveredFeature === index && (
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-green-500/10 to-transparent rounded-xl pointer-events-none"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    />
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="relative z-10 py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">How It Works</h2>
            <p className="text-xl text-gray-400">Get matched with experts in 3 simple steps</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "1",
                title: "Describe Your Needs",
                description: "Tell us what expertise you're looking for and your project requirements",
                icon: MessageSquare
              },
              {
                step: "2",
                title: "AI Matches You",
                description: "Our AI analyzes thousands of experts to find your perfect matches",
                icon: Brain
              },
              {
                step: "3",
                title: "Connect & Collaborate",
                description: "Review profiles, chat with experts, and start your project",
                icon: Users
              }
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.7 + index * 0.2 }}
                className="relative"
              >
                <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
                  <div className="flex items-center mb-4">
                    <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-black font-bold mr-4">
                      {item.step}
                    </div>
                    <item.icon className="w-6 h-6 text-green-400" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                  <p className="text-gray-400">{item.description}</p>
                </div>
                {index < 2 && (
                  <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2">
                    <ArrowRight className="w-8 h-8 text-gray-700" />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Expert Categories */}
      <section className="relative z-10 py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Expert Categories</h2>
            <p className="text-xl text-gray-400">Find specialists in any field</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              "AI & Machine Learning",
              "Software Development",
              "Data Science",
              "Cybersecurity",
              "Cloud Architecture",
              "Blockchain",
              "UX/UI Design",
              "Digital Marketing"
            ].map((category, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1 + index * 0.05 }}
                whileHover={{ scale: 1.05 }}
                className="bg-gradient-to-r from-gray-800 to-gray-900 border border-gray-700 rounded-lg p-4 text-center cursor-pointer hover:border-green-500 transition-all"
              >
                <span className="text-sm font-medium">{category}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2 }}
            className="bg-gradient-to-r from-green-500/10 to-green-600/10 border border-green-500/30 rounded-2xl p-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to Find Your Expert?
            </h2>
            <p className="text-xl text-gray-400 mb-8">
              Join thousands of professionals who've found their perfect match
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <SignUpButton mode="modal">
                <button className="group px-8 py-4 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-black font-semibold rounded-lg transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-2">
                  <span>Start Free Trial</span>
                  <Sparkles className="w-5 h-5" />
                </button>
              </SignUpButton>
            </div>
            <p className="text-sm text-gray-500 mt-6">
              No credit card required • Unlimited searches • Cancel anytime
            </p>
          </motion.div>
        </div>
      </section>
    </div>
  );
}

// Main App wrapped with Clerk
function App() {
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
  const [searchMode, setSearchMode] = useState('standard');
  
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

  const handleSearch = async (page = 1, append = false) => {
    if (!searchQuery.trim()) return;
    
    // Set appropriate loading state
    if (page === 1) {
      setLoading(true);
    } else {
      setIsLoadingMore(true);
    }
    
    try {
      const data = await searchExpertsEnhanced(searchQuery);
      
      if (page === 1 || !append) {
        setAllExperts(data.experts);
        setResults(data);
      } else {
        const newExperts = [...allExperts, ...data.experts];
        setAllExperts(newExperts);
        setResults({
          ...data,
          experts: newExperts,
          total_results: newExperts.length
        });
      }
      
      setCurrentPage(page);
      setHasMoreResults(data.experts.length === 10);
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
    setLoading(true);
    setSearchMode('smart');
    setCurrentPage(1);
    setHasMoreResults(false);
    
    try {
      const preferences = {
        user_id: user?.id,
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
      
      const experts = data.matches || [];
      setAllExperts(experts);
      setResults({
        experts: experts,
        total_results: experts.length,
        enhanced_query: data.enhanced_query
      });
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

  // Show landing page if not signed in
  if (!isSignedIn) {
    return <LandingPage />;
  }

  // Main app for signed-in users
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
              <button className="relative text-gray-400 hover:text-white hidden md:block">
                <Bell className="w-5 h-5" />
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full"></span>
              </button>
              <button className="text-gray-400 hover:text-white hidden md:block">
                <Settings className="w-5 h-5" />
              </button>
              
              {/* User Section */}
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

      {/* Main Content Area */}
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

        {/* Search Bar at Bottom */}
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
                  className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-black font-medium px-6 py-3 rounded-r-xl transition-all duration-300 flex items-center space-x-2"
                >
                  <Sparkles className="w-4 h-4" />
                  <span className="hidden sm:inline">AI Search</span>
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