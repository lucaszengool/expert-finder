import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, Sparkles, Bell, Settings, Menu, X, Loader2, TrendingUp, Users, Star, User, ChevronDown, Brain, Zap, Shield, Globe, ArrowRight, CheckCircle, BarChart3, Clock, MessageSquare, Award, Target, Send, Bot, FileText, Calendar } from 'lucide-react';
import { ClerkProvider, SignInButton, SignUpButton, UserButton, useUser, useClerk } from "@clerk/clerk-react";
import EnhancedExpertCard from './components/modern/EnhancedExpertCard';
import ExpertDetailModal from './components/modern/ExpertDetailModal';
import EmailComposer from './components/modern/EmailComposer';
import { searchExpertsEnhanced, smartMatchExperts } from './services/api';
import strictExpertValidator from './utils/expertValidator';
import './styles/globals.css';
import ReactGA from "react-ga4";

// Initialize GA4 with your Measurement ID
const MEASUREMENT_ID = "G-YW4X5SG5QE";
ReactGA.initialize(MEASUREMENT_ID);

// Get Clerk publishable key from environment
const clerkPubKey = process.env.REACT_APP_CLERK_PUBLISHABLE_KEY || "pk_live_Y2xlcmsuZXhwZXJ0ZmluZGVyb2ZmaWNpYWwub3JnJA";

// Canvas-style Landing Page Component
function CanvasLandingPage() {
  const { openSignUp, openSignIn } = useClerk();
  const [activeStep, setActiveStep] = useState(0);

  const steps = [
    {
      number: "1",
      title: "Discover",
      description: "AI agents scan millions of professionals, businesses, and potential partners worldwide.",
      icon: Search,
      active: activeStep === 0
    },
    {
      number: "2", 
      title: "Qualify",
      description: "Smart AI filters and qualifies matches based on your specific criteria and goals.",
      icon: Target,
      active: activeStep === 1
    },
    {
      number: "3",
      title: "Engage",
      description: "Automated personalized outreach and negotiation to build valuable connections.",
      icon: Send,
      active: activeStep === 2
    },
    {
      number: "4",
      title: "Booked",
      description: "You get meetings with ideal matches while AI handles all the heavy lifting.",
      icon: Calendar,
      active: activeStep === 3
    }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % 4);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const faqs = [
    {
      question: "What does ExpertFinder actually do?",
      answer: "ExpertFinder uses AI to find and connect you with experts, potential clients, or business partners. Our AI agents search, qualify, and engage with prospects automatically, booking meetings directly to your calendar."
    },
    {
      question: "Do I need to train the AI or upload data?",
      answer: "No training needed! Simply describe who you're looking for and our AI instantly starts finding matches. You can optionally upload email examples to personalize outreach style."
    },
    {
      question: "Who reaches out to the leads — AI or humans?",
      answer: "Our AI handles initial outreach and qualification, but all communications are personalized and human-like. You can review and customize any message before it's sent."
    },
    {
      question: "How fast can I start seeing meetings?",
      answer: "Most users see their first qualified meetings within 48-72 hours of starting a campaign. The AI works 24/7 to find and engage with your ideal connections."
    },
    {
      question: "Can ExpertFinder integrate with my CRM?",
      answer: "Yes! We integrate with all major CRMs including Salesforce, HubSpot, and Pipedrive. Your leads and conversations sync automatically."
    },
    {
      question: "Is this better than hiring SDRs?",
      answer: "ExpertFinder works 24/7, never takes sick days, and scales instantly. It's 10x more cost-effective than SDRs while maintaining consistent quality and personalization."
    }
  ];

  const [openFAQ, setOpenFAQ] = useState(null);

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <Bot className="h-6 w-6" />
              <h1 className="text-xl font-medium">ExpertFinder</h1>
            </div>
            
            <nav className="hidden md:flex items-center space-x-8">
              <a href="#" className="text-gray-700 hover:text-gray-900 text-sm">Home</a>
              <a href="#" className="text-gray-700 hover:text-gray-900 text-sm">Careers</a>
              <button
                onClick={openSignIn}
                className="px-5 py-2 bg-black text-white text-sm rounded-full hover:bg-gray-800 transition-colors"
              >
                Talk to sales
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-orange-100 text-orange-700 text-xs font-medium px-3 py-1 rounded-full mb-6">
            <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
            Backed by Y Combinator
          </div>
          
          <h1 className="text-5xl md:text-6xl font-medium text-gray-900 mb-4">
            AI Operating System
            <br />
            <span className="text-4xl md:text-5xl">for <span className="text-blue-500">B2B Sales</span></span>
          </h1>
          
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            AI Research Agents Find & Enrich Warm Leads. Actual humans
            book you demos, perfecting every cold call and email.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={openSignUp}
              className="px-8 py-3 bg-black text-white rounded-full hover:bg-gray-800 transition-colors text-base font-medium"
            >
              Get Started
            </button>
            <button className="px-8 py-3 bg-white text-black border border-gray-300 rounded-full hover:bg-gray-50 transition-colors text-base font-medium">
              Book a Demo
            </button>
          </div>
        </div>
      </section>

      {/* Process Steps */}
      <section className="py-16 px-6 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            {steps.map((step, index) => (
              <motion.div
                key={index}
                className={`text-center transition-all duration-500 ${
                  step.active ? 'scale-105' : 'scale-100 opacity-70'
                }`}
              >
                <div className={`inline-flex flex-col items-center ${
                  index < steps.length - 1 ? 'relative' : ''
                }`}>
                  {/* Connection line */}
                  {index < steps.length - 1 && (
                    <div className="hidden md:block absolute left-1/2 top-8 w-full h-0.5 bg-gray-300">
                      <motion.div
                        className="h-full bg-green-500"
                        initial={{ width: "0%" }}
                        animate={{ width: activeStep > index ? "100%" : "0%" }}
                        transition={{ duration: 1 }}
                      />
                    </div>
                  )}
                  
                  {/* Step circle */}
                  <div className={`relative z-10 w-16 h-16 rounded-full flex items-center justify-center mb-4 transition-all ${
                    step.active ? 'bg-black text-white' : 'bg-gray-100 text-gray-400'
                  }`}>
                    <step.icon className="w-8 h-8" />
                  </div>
                  
                  <h3 className="text-sm font-medium text-gray-900 mb-1">Step {step.number}</h3>
                  <h4 className="text-lg font-semibold mb-2">{step.title}</h4>
                  <p className="text-sm text-gray-600 max-w-xs">{step.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-medium text-gray-900 mb-4">
              Stop searching for leads.
              <br />
              Start closing them.
            </h2>
            <p className="text-xl text-gray-600">
              AI Sales Research Agents that crawl every corner of the
              <br />
              web to find, qualify, and enrich local business data at scale.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Local Business Search */}
            <div className="bg-gray-50 rounded-2xl p-8">
              <div className="mb-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Search className="w-6 h-6 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-semibold">Local Businesses Search</h3>
                </div>
                <p className="text-gray-600">
                  Finds qualified businesses that match your live buying signals.
                </p>
              </div>
              
              {/* Mock search results */}
              <div className="space-y-3">
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <FileText className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-medium">Bright Smile Digital</h4>
                        <p className="text-sm text-gray-500">Growing practice • 12 employees</p>
                      </div>
                    </div>
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  </div>
                </div>
                <div className="bg-white rounded-lg p-4 border border-gray-200 opacity-60">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-100 rounded-lg"></div>
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-32"></div>
                      <div className="h-3 bg-gray-100 rounded w-24"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Enrich Decision Makers */}
            <div className="bg-gray-50 rounded-2xl p-8">
              <div className="mb-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <Users className="w-6 h-6 text-green-600" />
                  </div>
                  <h3 className="text-xl font-semibold">Enrich Decision Makers</h3>
                </div>
                <p className="text-gray-600">
                  Leverages 15+ public and proprietary data sources to enrich decision makers.
                </p>
              </div>
              
              {/* Mock enriched contacts */}
              <div className="space-y-2">
                {[
                  { name: "Dr. Sarah Johnson", title: "Owner", initials: "SJ" },
                  { name: "Dr. Alex Lee", title: "Partner", initials: "AL" },
                  { name: "Dr. Emily Chen", title: "Pediatric Dentist", initials: "EC" }
                ].map((person, index) => (
                  <div key={index} className="flex items-center gap-3 bg-white rounded-lg p-3 border border-gray-200">
                    <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-sm font-medium">
                      {person.initials}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">{person.name}</h4>
                      <p className="text-xs text-gray-500">{person.title}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* AI Qualification Agent */}
          <div className="mt-8 grid md:grid-cols-2 gap-8">
            <div className="bg-gray-50 rounded-2xl p-8">
              <h3 className="text-xl font-semibold mb-4">AI Qualification Agent</h3>
              <p className="text-gray-600 mb-6">
                24/7 autonomous agents that qualify and prioritize your ICP
              </p>
              <button className="text-sm font-medium flex items-center gap-2 hover:gap-3 transition-all">
                Learn more <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-gray-50 rounded-2xl p-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold">Agentic Qualification Score</h3>
                <span className="text-sm text-green-600 flex items-center gap-1">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  Live • 5 results found
                </span>
              </div>
              
              {/* Score visualization */}
              <div className="flex items-center justify-center mb-6">
                <div className="relative w-32 h-32">
                  <svg className="w-32 h-32 transform -rotate-90">
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      stroke="#e5e7eb"
                      strokeWidth="12"
                      fill="none"
                    />
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      stroke="#06b6d4"
                      strokeWidth="12"
                      fill="none"
                      strokeDasharray={`${2 * Math.PI * 56}`}
                      strokeDashoffset={`${2 * Math.PI * 56 * (1 - 0.93)}`}
                      className="transition-all duration-1000"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl font-bold">93</span>
                    <span className="text-xs text-gray-500">Score</span>
                  </div>
                </div>
              </div>
              
              {/* Results */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Bright Smile</span>
                  <span className="text-cyan-600">85</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Acme Inc</span>
                  <span className="text-cyan-600">70</span>
                </div>
                <button className="text-xs text-gray-500 mt-2">+4 more ∨</button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works - Canvas style */}
      <section className="py-20 px-6 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-4">
            <p className="text-sm text-gray-500 mb-2">How it works</p>
            <h2 className="text-4xl font-medium text-gray-900 mb-4">
              Easily convert deals from
              <br />
              data in few simple steps
            </h2>
            <p className="text-xl text-gray-600">
              We find warm leads and book qualified meetings, so you can focus on closing
            </p>
          </div>

          <div className="grid md:grid-cols-5 gap-4 mt-16">
            {[
              { icon: Search, label: "Discover", color: "from-green-400 to-teal-400" },
              { icon: Filter, label: "Qualify", color: "from-pink-400 to-purple-400" },
              { icon: FileText, label: "Enrich", color: "from-purple-400 to-indigo-400" },
              { icon: MessageSquare, label: "Engage", color: "from-orange-400 to-red-400" },
              { icon: CheckCircle, label: "Booked", color: "from-yellow-400 to-orange-400" }
            ].map((item, index) => (
              <div key={index} className="text-center">
                <div className={`h-48 rounded-2xl bg-gradient-to-br ${item.color} opacity-20 mb-4 relative overflow-hidden`}>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <item.icon className="w-12 h-12 text-gray-700 opacity-50" />
                  </div>
                </div>
                <h3 className="font-semibold">{item.label}</h3>
                <button className="text-sm text-gray-600 mt-2 flex items-center gap-1 mx-auto hover:gap-2 transition-all">
                  Learn more <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQs */}
      <section className="py-20 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-sm text-gray-500 mb-2">FAQs</p>
            <h2 className="text-4xl font-medium text-gray-900 mb-4">
              Frequently asked questions
            </h2>
            <p className="text-xl text-gray-600">
              Everything you need to know about our platform
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div key={index} className="border-b border-gray-200 pb-4">
                <button
                  onClick={() => setOpenFAQ(openFAQ === index ? null : index)}
                  className="w-full flex items-center justify-between py-4 text-left hover:text-gray-600 transition-colors"
                >
                  <span className="text-lg font-medium">{faq.question}</span>
                  <ChevronDown className={`w-5 h-5 transition-transform ${
                    openFAQ === index ? 'rotate-180' : ''
                  }`} />
                </button>
                <AnimatePresence>
                  {openFAQ === index && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <p className="text-gray-600 pb-4">{faq.answer}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 bg-gray-50">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-sm text-gray-500 mb-2">Take Action</p>
          <h2 className="text-5xl font-medium text-gray-900 mb-6">
            Get Started Today
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Ready to transform your sales process? Book a demo and see
            <br />
            how ExpertFinder can deliver qualified leads to your calendar.
          </p>
          <button
            onClick={openSignIn}
            className="px-8 py-3 bg-black text-white rounded-full hover:bg-gray-800 transition-colors text-base font-medium"
          >
            Talk to sales
          </button>
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
  const [showDemo, setShowDemo] = useState(false);
  
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
  
  useEffect(() => {
    ReactGA.send({ hitType: "pageview", page: window.location.pathname });
  }, []);

  // Show demo on first visit for signed-in users
  useEffect(() => {
    if (isSignedIn) {
      const hasSeenDemo = localStorage.getItem('hasSeenDemo');
      if (!hasSeenDemo) {
        setTimeout(() => {
          setShowDemo(true);
          localStorage.setItem('hasSeenDemo', 'true');
        }, 1000);
      }
    }
  }, [isSignedIn]);

  // Helper function to track events
  const trackEvent = (category, action, label) => {
    ReactGA.event({
      category: category,
      action: action,
      label: label,
    });
  };

  // Scroll to bottom when new results are added
  useEffect(() => {
    if (results?.experts?.length > 0) {
      resultsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [results]);

  const handleSearch = async (page = 1, append = false) => {
    if (!searchQuery.trim()) return;

    trackEvent("Search", "Standard Search", searchQuery);
    
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
    trackEvent("Search", "AI Search", searchQuery);
    setLoading(true);
    setSearchMode('smart');
    setCurrentPage(1);
    setHasMoreResults(false);
    
    try {
      const preferences = {
        user_id: user?.id || 'guest',
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

      const isValidExpert = (expert) => {
          const name = expert?.name?.toLowerCase() || '';
          const title = expert?.title?.toLowerCase() || '';
          const invalidKeywords = [
            'linkedin learning', 
            'coursera', 
            'framework', 
            'platform', 
            'udemy', 
            'edx',
            'online training',
            'skill building',
            'how to kick off'
          ];
          
          return !invalidKeywords.some(keyword => name.includes(keyword) || title.includes(keyword));
        };
      
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
     })).filter(expert => isValidExpert(expert)) : []; 
     
     console.log('Mapped experts:', experts);
     
     setAllExperts(experts);

     // Use it to filter
     const validExperts = experts.filter(expert => isValidExpert(expert));
   
     setResults({
       experts: validExperts,
       total_results: validExperts.length,
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
     <div className="min-h-screen bg-white flex items-center justify-center">
       <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
     </div>
   );
 }

 // Show landing page if not signed in
 if (!isSignedIn) {
   return <CanvasLandingPage />;
 }

 // Main app - Canvas style for signed-in users
 return (
   <div className="min-h-screen bg-white flex flex-col">
     {/* Header */}
     <header className="border-b border-gray-200 bg-white">
       <div className="max-w-7xl mx-auto px-6 lg:px-8">
         <div className="flex justify-between items-center h-16">
           <div className="flex items-center space-x-2">
             <Bot className="h-6 w-6" />
             <h1 className="text-xl font-medium">ExpertFinder</h1>
           </div>

           <div className="flex items-center space-x-6">
             <button className="text-gray-600 hover:text-gray-900 hidden md:block">
               <Bell className="w-5 h-5" />
             </button>
             <button className="text-gray-600 hover:text-gray-900 hidden md:block">
               <Settings className="w-5 h-5" />
             </button>
             
             {/* User Section */}
             <div className="flex items-center gap-4">
               <span className="text-gray-700 hidden md:block text-sm">
                 {user.firstName || user.username || 'User'}
               </span>
               <UserButton 
                 afterSignOutUrl="/"
                 appearance={{
                   elements: {
                     avatarBox: "w-8 h-8",
                     userButtonPopoverCard: "bg-white border border-gray-200",
                     userButtonPopoverActionButton: "hover:bg-gray-50"
                   }
                 }}
               />
             </div>
             
             {/* Mobile menu button */}
             <button
               onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
               className="md:hidden text-gray-600 hover:text-gray-900"
             >
               {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
             </button>
           </div>
         </div>
       </div>
     </header>

     {/* Main Content Area */}
     <main className="flex-1 flex flex-col">
       {/* Results Area */}
       <div className="flex-1 overflow-y-auto bg-gray-50">
         <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
           {/* Welcome Message when no search */}
           {!results && !loading && (
             <div className="flex items-center justify-center h-[calc(100vh-300px)]">
               <div className="text-center">
                 <Bot className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                 <h2 className="text-3xl font-medium text-gray-900 mb-2">Find Your Perfect Connection</h2>
                 <p className="text-gray-600">AI-powered matching for experts, clients, and partners</p>
               </div>
             </div>
           )}

           {/* Loading State */}
           {loading && currentPage === 1 && (
             <div className="flex items-center justify-center h-[calc(100vh-300px)]">
               <div className="text-center">
                 <Loader2 className="w-8 h-8 animate-spin text-gray-400 mx-auto mb-4" />
                 <p className="text-gray-600">Finding the best matches for you...</p>
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
                     <h3 className="text-2xl font-medium text-gray-900">
                       Found <span className="text-blue-500">{results.total_results}</span> connections
                     </h3>
                     {searchMode === 'smart' && (
                       <p className="text-sm text-gray-600 mt-1 flex items-center gap-2">
                         <Sparkles className="w-4 h-4" />
                         AI-matched results based on your criteria
                       </p>
                     )}
                   </div>
                   
                   {/* Sort Options */}
                   <div className="flex items-center gap-2 text-sm">
                     <button className="px-4 py-2 rounded-full bg-gray-900 text-white hover:bg-gray-800 transition-colors flex items-center gap-2">
                       <TrendingUp className="w-4 h-4" />
                       Relevance
                     </button>
                     <button className="px-4 py-2 rounded-full text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors flex items-center gap-2">
                       <Star className="w-4 h-4" />
                       Rating
                     </button>
                     <button className="px-4 py-2 rounded-full text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors">
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
                       onClick={() => {
                         trackEvent("Expert", "View Profile", expert.name);
                         setSelectedExpert(expert);
                       }}
                       onEmailClick={(expert) => {
                         trackEvent("Expert", "Email Click", expert.name);
                         handleEmailClick(expert);
                       }}
                     />
                   </motion.div>
                 ))}
               </div>

               {/* Load More Button */}
               <div className="mt-12 flex justify-center">
                 {isLoadingMore ? (
                   <div className="px-8 py-3 bg-gray-100 rounded-full flex items-center gap-3">
                     <Loader2 className="w-5 h-5 animate-spin text-gray-600" />
                     <span className="text-gray-700">Loading more results...</span>
                   </div>
                 ) : hasMoreResults ? (
                   <button
                     onClick={loadMoreExperts}
                     className="group px-8 py-3 bg-black text-white rounded-full hover:bg-gray-800 transition-all duration-300 flex items-center gap-3"
                   >
                     <span>Load More Results</span>
                     <span className="text-sm opacity-75 bg-white/20 px-2 py-1 rounded">
                       Page {currentPage + 1}
                     </span>
                     <ChevronDown className="w-5 h-5 group-hover:translate-y-1 transition-transform" />
                   </button>
                 ) : results.experts.length >= 10 ? (
                   <div className="text-center">
                     <p className="text-gray-600 mb-2">
                       You've viewed all {results.experts.length} connections
                     </p>
                     <button
                       onClick={() => {
                         setSearchQuery('');
                         setResults(null);
                         setCurrentPage(1);
                         setHasMoreResults(false);
                         setAllExperts([]);
                       }}
                       className="text-blue-600 hover:text-blue-700 text-sm"
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
                 <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                 <h3 className="text-xl font-medium text-gray-700 mb-2">
                   No connections found
                 </h3>
                 <p className="text-gray-600">
                   Try adjusting your search terms or filters
                 </p>
               </div>
             </div>
           )}
         </div>
       </div>

       {/* Search Bar at Bottom */}
       <div className="border-t border-gray-200 bg-white">
         <div className="max-w-4xl mx-auto px-6 py-4">
           <div className="relative">
             <div className="flex items-center bg-gray-50 rounded-full border border-gray-200 focus-within:border-gray-400 transition-all">
               <Search className="w-5 h-5 text-gray-400 ml-6" />
               <input
                 type="text"
                 placeholder="Search for experts to hire, potential clients, or business partners..."
                 value={searchQuery}
                 onChange={(e) => setSearchQuery(e.target.value)}
                 onKeyPress={handleSearchKeyPress}
                 className="flex-1 bg-transparent px-4 py-4 text-gray-900 placeholder-gray-500 focus:outline-none"
               />
               <button 
                 onClick={() => setShowFilters(!showFilters)}
                 className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
               >
                 <Filter className="w-5 h-5" />
               </button>
               <button 
                 onClick={handleSmartMatch}
                 className="bg-black text-white px-6 py-3 rounded-full hover:bg-gray-800 transition-all duration-300 flex items-center space-x-2 mr-1"
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
                   <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-white rounded-lg border border-gray-200 shadow-lg">
                     <div>
                       <label className="text-xs text-gray-500 mb-1 block">Budget/Rate</label>
                       <select className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900">
                         <option>Any</option>
                         <option>Under $200/hr</option>
                         <option>$200 - $500/hr</option>
                         <option>$500+/hr</option>
                       </select>
                     </div>
                     <div>
                       <label className="text-xs text-gray-500 mb-1 block">Availability</label>
                       <select className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900">
                         <option>Any</option>
                         <option>Available Now</option>
                         <option>This Week</option>
                         <option>This Month</option>
                       </select>
                     </div>
                     <div>
                       <label className="text-xs text-gray-500 mb-1 block">Connection Type</label>
                       <select className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900">
                         <option>Any</option>
                         <option>Experts for Hire</option>
                         <option>Potential Clients</option>
                         <option>Business Partners</option>
                       </select>
                     </div>
                     <div>
                       <label className="text-xs text-gray-500 mb-1 block">Industry</label>
                       <select className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900">
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
           projectDetails: searchQuery || "Professional connection request",
           objectives: ["Discuss potential collaboration", "Explore partnership opportunities", "Schedule initial meeting"],
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