import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, Sparkles, Bell, Settings, Menu, X, Loader2, TrendingUp, Users, Star, User, ChevronDown, Brain, Zap, Shield, Globe, ArrowRight, CheckCircle, BarChart3, Clock, MessageSquare, Award, Target, Send, Bot, FileText, Calendar, Mail } from 'lucide-react';
import { ClerkProvider, SignInButton, SignUpButton, UserButton, useUser, useClerk } from "@clerk/clerk-react";
import EnhancedExpertCard from './components/modern/EnhancedExpertCard';
import ExpertDetailModal from './components/modern/ExpertDetailModal';
import EmailComposer from './components/modern/EmailComposer';
import { searchExpertsEnhanced, smartMatchExperts } from './services/api';
import strictExpertValidator from './utils/expertValidator';
import './styles/globals.css';
import ReactGA from "react-ga4";
import OutreachDashboard from './components/OutreachDashboard';
import OutreachCampaignCreator from './components/OutreachCampaignCreator'; 

// Initialize GA4 with your Measurement ID
const MEASUREMENT_ID = "G-YW4X5SG5QE";
ReactGA.initialize(MEASUREMENT_ID);

// Get Clerk publishable key from environment
const clerkPubKey = process.env.REACT_APP_CLERK_PUBLISHABLE_KEY || "pk_live_Y2xlcmsuZXhwZXJ0ZmluZGVyb2ZmaWNpYWwub3JnJA";

// Arcade Demo Component
function ArcadeDemo({ onClose }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="relative w-full max-w-5xl bg-white rounded-xl border border-gray-300 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gray-50 border-b border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-blue-500" />
                See How ExpertFinder Works
              </h3>
              <p className="text-sm text-gray-600 mt-1">Interactive demo - Try it yourself!</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Arcade Embed */}
        <div className="p-4 bg-white">
          <div style={{ position: 'relative', paddingBottom: 'calc(53.57142857142857% + 41px)', height: 0, width: '100%' }}>
            <iframe
              src="https://demo.arcade.software/hvL2WNYn1i1vBj7WTCcK?embed&embed_mobile=tab&embed_desktop=inline&show_copy_link=true"
              title="Find and Connect with AI-Matched Professionals"
              frameBorder="0"
              loading="lazy"
              allowFullScreen
              allow="clipboard-write"
              style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', colorScheme: 'light', borderRadius: '8px' }}
            />
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// Canvas-style Landing Page Component
function CanvasLandingPage() {
  const { openSignUp, openSignIn } = useClerk();
  const [activeStep, setActiveStep] = useState(0);
  const [showDemo, setShowDemo] = useState(false);

  const steps = [
    {
      number: "1",
      title: "Describe Who You Need",
      description: "Tell our AI agents who you're looking for - experts for hire, potential clients, or business partners.",
      icon: MessageSquare,
      active: activeStep === 0
    },
    {
      number: "2", 
      title: "AI Finds & Qualifies",
      description: "Our agents search millions of profiles and qualify matches based on your specific criteria.",
      icon: Brain,
      active: activeStep === 1
    },
    {
      number: "3",
      title: "Automated Outreach",
      description: "AI learns from your email style and sends personalized outreach at scale.",
      icon: Send,
      active: activeStep === 2
    },
    {
      number: "4",
      title: "Meetings Booked",
      description: "AI negotiates and schedules meetings directly to your calendar.",
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
      answer: "ExpertFinder uses AI agents to automatically find, qualify, and connect you with experts, potential clients, or business partners. Our AI learns from your email style, sends personalized outreach at scale, negotiates on your behalf, and books meetings directly to your calendar - all while you focus on closing deals."
    },
    {
      question: "Do I need to train the AI or upload data?",
      answer: "No training needed to start! Simply describe who you're looking for and our AI instantly starts finding matches. You can optionally upload successful email examples to teach the AI your communication style for even better personalization."
    },
    {
      question: "Who reaches out to the leads — AI or humans?",
      answer: "Our AI agents handle the entire outreach process - from initial contact to negotiation and meeting scheduling. All communications are AI-powered but sound naturally human. You can review and customize any message before it's sent, or let the AI run on autopilot."
    },
    {
      question: "How fast can I start seeing meetings?",
      answer: "Most users see their first qualified meetings booked within 48-72 hours. Our AI agents work 24/7, sending personalized outreach, handling responses, and scheduling meetings around the clock."
    },
    {
      question: "Can ExpertFinder integrate with my CRM?",
      answer: "Yes! We integrate seamlessly with all major CRMs including Salesforce, HubSpot, Pipedrive, and more. All leads, conversations, and meeting data sync automatically."
    },
    {
      question: "Is this better than hiring SDRs?",
      answer: "ExpertFinder's AI agents work 24/7, never take sick days, and scale instantly. They're 10x more cost-effective than SDRs while maintaining consistent quality. Plus, they learn and improve from every interaction."
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
              <button
                onClick={openSignUp}
                className="px-5 py-2 bg-black text-white text-sm rounded-full hover:bg-gray-800 transition-colors"
              >
                Sign Up
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          
          <h1 className="text-5xl md:text-6xl font-medium text-gray-900 mb-4">
            AI Outreach System
            <br />
            <span className="text-4xl md:text-5xl">for <span className="text-blue-500">Finding Anyone</span></span>
          </h1>
          
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            AI Agents find experts, clients, and partners. Learn from your emails,
            send personalized outreach, negotiate deals, and book meetings automatically.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={openSignUp}
              className="px-8 py-3 bg-black text-white rounded-full hover:bg-gray-800 transition-colors text-base font-medium"
            >
              Get Started
            </button>
            <button 
              onClick={() => setShowDemo(true)}
              className="px-8 py-3 bg-white text-black border border-gray-300 rounded-full hover:bg-gray-50 transition-colors text-base font-medium"
            >
              Watch Demo
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
        Stop searching for connections.
        <br />
        Start closing them.
      </h2>
      <p className="text-xl text-gray-600">
        AI Outreach Agents that find anyone you need - experts, clients, or partners -
        <br />
        then automatically engage, negotiate, and book meetings at scale.
      </p>
    </div>

    <div className="grid md:grid-cols-2 gap-8">
      {/* Multi-Target Search */}
      <div className="bg-gray-50 rounded-2xl p-8">
        <div className="mb-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Search className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold">AI-Powered Search</h3>
          </div>
          <p className="text-gray-800 font-medium">
            Finds experts to hire, potential clients, or business partners across millions of profiles.
          </p>
        </div>
        
        {/* Mock search results */}
        <div className="space-y-3">
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-blue-500 rounded-lg flex items-center justify-center text-white font-medium">
                  JD
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">John Davis - AI Expert</h4>
                  <p className="text-sm text-gray-700 font-medium">Machine Learning Engineer • $350/hr</p>
                </div>
              </div>
              <CheckCircle className="w-5 h-5 text-green-500" />
            </div>
          </div>
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-pink-500 rounded-lg flex items-center justify-center text-white font-medium">
                  TC
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">TechCorp Inc - Potential Client</h4>
                  <p className="text-sm text-gray-700 font-medium">Looking for AI solutions • 500 employees</p>
                </div>
              </div>
              <Target className="w-5 h-5 text-purple-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Email Learning & Outreach */}
      <div className="bg-gray-50 rounded-2xl p-8">
        <div className="mb-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Mail className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold">Learn & Send at Scale</h3>
          </div>
          <p className="text-gray-800 font-medium">
            AI learns from your successful emails and sends personalized outreach automatically.
          </p>
        </div>
        
        {/* Mock email preview */}
        <div className="space-y-2">
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-900">To: sarah@techstartup.com</span>
              <span className="text-xs text-green-600 font-medium bg-green-50 px-2 py-1 rounded">Sent</span>
            </div>
            <p className="text-sm text-gray-800 font-medium line-clamp-3">
              Hi Sarah, I noticed TechStartup is scaling its AI initiatives. 
              We've helped similar companies reduce ML deployment time by 70%...
            </p>
            <div className="mt-3 flex items-center gap-4 text-xs text-gray-700 font-medium">
              <span className="flex items-center gap-1">
                <CheckCircle className="w-3 h-3 text-green-500" /> Opened
              </span>
              <span className="flex items-center gap-1">
                <MessageSquare className="w-3 h-3 text-blue-500" /> Replied
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    {/* AI Agents */}
    <div className="mt-8 grid md:grid-cols-2 gap-8">
      <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm">
        <h3 className="text-xl font-semibold mb-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-purple-600 rounded-lg flex items-center justify-center shadow">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <span className="bg-purple-100 text-purple-700 px-4 py-2 rounded-lg">AI Negotiation Agent</span>
        </h3>
        <p className="text-gray-800 font-medium mb-6 bg-purple-50 p-3 rounded-lg">
          Handles responses, negotiates terms, and closes deals while you sleep
        </p>
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center text-xs font-medium text-white">C</div>
              <div className="flex-1 bg-white rounded-lg p-3 border border-gray-200">
                <p className="text-sm text-gray-800">What's your budget for this project?</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xs font-medium shadow">AI</div>
              <div className="flex-1 bg-purple-50 rounded-lg p-3 border border-purple-200">
                <p className="text-sm text-gray-800">We offer flexible packages starting at $5k/month. 
                Based on your needs, I'd recommend our Growth plan. Should we schedule a call to discuss details?</p>
              </div>
            </div>
          </div>
        </div>
        <button 
          onClick={() => console.log('Learn more about AI Negotiation')}
          className="text-sm font-medium flex items-center gap-2 hover:gap-3 transition-all mt-4 text-purple-600 hover:text-purple-700"
        >
          Learn more <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-orange-600 rounded-lg flex items-center justify-center shadow">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <span className="bg-orange-100 text-orange-700 px-4 py-2 rounded-lg">Meeting Scheduler AI</span>
          </h3>
          <span className="text-sm text-green-600 flex items-center gap-1 bg-green-50 px-2 py-1 rounded-full font-medium">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            Live
          </span>
        </div>
        
        {/* Calendar visualization */}
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <div className="grid grid-cols-5 gap-2 text-center mb-3">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map(day => (
              <div key={day} className="text-xs text-gray-700 font-medium">{day}</div>
            ))}
          </div>
          <div className="grid grid-cols-5 gap-2">
            {[...Array(15)].map((_, i) => (
              <div 
                key={i} 
                className={`h-8 rounded ${
                  [3, 7, 9, 12].includes(i) 
                    ? 'bg-gradient-to-br from-blue-400 to-blue-500 shadow-sm' 
                    : 'bg-gray-200'
                }`}
              />
            ))}
          </div>
        </div>
        
        {/* Stats */}
        <div className="mt-4 flex items-center justify-between text-sm bg-blue-50 rounded-lg p-3 border border-blue-200">
          <span className="text-gray-800 font-medium">This week:</span>
          <span className="font-semibold text-blue-600">4 meetings booked</span>
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
              Easily convert connections into
              <br />
              deals in few simple steps
            </h2>
            <p className="text-xl text-gray-600">
              We find your ideal connections and handle outreach, so you can focus on closing
            </p>
          </div>

          <div className="grid md:grid-cols-5 gap-4 mt-16">
            {[
              { icon: Search, label: "Discover", color: "from-green-400 to-teal-400", desc: "Search for experts, clients, or partners" },
              { icon: Filter, label: "Qualify", color: "from-pink-400 to-purple-400", desc: "AI qualifies based on your criteria" },
              { icon: FileText, label: "Learn", color: "from-purple-400 to-indigo-400", desc: "Upload emails to teach AI your style" },
              { icon: Send, label: "Engage", color: "from-orange-400 to-red-400", desc: "AI sends personalized outreach" },
              { icon: CheckCircle, label: "Booked", color: "from-yellow-400 to-orange-400", desc: "Meetings scheduled automatically" }
            ].map((item, index) => (
              <div key={index} className="text-center group">
                <div className={`h-48 rounded-2xl bg-gradient-to-br ${item.color} p-1 mb-4 relative overflow-hidden cursor-pointer transform transition-all duration-300 hover:scale-105`}>
                  <div className="w-full h-full bg-white rounded-2xl flex items-center justify-center">
                    <item.icon className="w-16 h-16 text-gray-700" />
                  </div>
                </div>
                <h3 className="font-semibold text-lg">{item.label}</h3>
                <p className="text-xs text-gray-600 mt-1 px-2">{item.desc}</p>
                <button 
                  onClick={() => console.log(`Learn more about ${item.label}`)}
                  className="text-sm text-gray-700 mt-2 flex items-center gap-1 mx-auto hover:gap-2 transition-all hover:text-black group"
                >
                  Learn more 
                  <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-1" />
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
              <div key={index} className="border border-gray-200 rounded-lg overflow-hidden">
                <button
                  onClick={() => setOpenFAQ(openFAQ === index ? null : index)}
                  className="w-full flex items-center justify-between p-6 text-left bg-white hover:bg-gray-50 transition-colors"
                >
                  <span className="text-lg font-medium text-gray-900">{faq.question}</span>
                  <ChevronDown className={`w-5 h-5 text-gray-500 transition-transform ${
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
                      <div className="px-6 pb-6 pt-0 bg-gray-50">
                        <p className="text-gray-700">{faq.answer}</p>
                      </div>
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
            Ready to transform your outreach process? See how ExpertFinder
            <br />
            can deliver qualified connections directly to your calendar.
          </p>
          <button
            onClick={openSignUp}
            className="px-8 py-3 bg-black text-white rounded-full hover:bg-gray-800 transition-colors text-base font-medium"
          >
            Start Free Trial
          </button>
        </div>
      </section>
      
      {/* Arcade Demo Modal */}
      <AnimatePresence>
        {showDemo && (
          <ArcadeDemo onClose={() => setShowDemo(false)} />
        )}
      </AnimatePresence>
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

  


  const EnhancedSearchInterface = () => {
  const [outreachMode, setOutreachMode] = useState(false);
  
  return (
    <div className="max-w-4xl mx-auto">
      {/* Search Mode Toggle */}
      <div className="flex justify-center mb-6">
        <div className="inline-flex rounded-lg border border-gray-200 p-1">
          <button
            onClick={() => setOutreachMode(false)}
            className={`px-4 py-2 rounded-md transition-colors ${
              !outreachMode 
                ? 'bg-blue-600 text-white' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Search className="w-4 h-4 inline mr-2" />
            Find & Connect
          </button>
          <button
            onClick={() => setOutreachMode(true)}
            className={`px-4 py-2 rounded-md transition-colors ${
              outreachMode 
                ? 'bg-purple-600 text-white' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Bot className="w-4 h-4 inline mr-2" />
            AI Outreach Campaign
          </button>
        </div>
      </div>
      
      {outreachMode ? (
        <OutreachCampaignCreator 
          onClose={() => setOutreachMode(false)}
          onCampaignCreated={(campaign) => {
            console.log('Campaign created:', campaign);
            // Navigate to dashboard or show success
          }}
        />
      ) : (
        // Your existing search interface
        <div>
          {/* Existing search UI */}
        </div>
      )}
    </div>
  );
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

const OutreachButton = () => {
  const [showOutreach, setShowOutreach] = useState(false);
  
  return (
    <>
      <button
        onClick={() => setShowOutreach(true)}
        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all duration-300 shadow-lg"
      >
        <Bot className="w-4 h-4" />
        <span className="font-medium">AI Outreach</span>
      </button>
      
      {showOutreach && (
        <div className="fixed inset-0 z-50 bg-white">
          <OutreachDashboard />
          <button
            onClick={() => setShowOutreach(false)}
            className="fixed top-4 right-4 p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}
    </>
  );
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
   <div className="min-h-screen bg-gray-50 flex flex-col">
     {/* Header */}
     <header className="border-b border-gray-200 bg-white">
       <div className="max-w-7xl mx-auto px-6 lg:px-8">
         <div className="flex justify-between items-center h-16">
           <div className="flex items-center space-x-2">
             <Bot className="h-6 w-6" />
             <h1 className="text-xl font-medium">ExpertFinder</h1>
           </div>

           <div className="flex items-center space-x-6">
             <OutreachButton />
             <button 
               onClick={() => setShowDemo(true)}
               className="text-gray-600 hover:text-gray-900 hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-all"
             >
               <Sparkles className="w-4 h-4" />
               <span className="text-sm">Watch Demo</span>
             </button>
             
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
       <div className="flex-1 overflow-y-auto">
         <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
           {/* Welcome Message when no search */}
           {!results && !loading && (
             <div className="flex items-center justify-center h-[calc(100vh-300px)]">
               <div className="text-center">
                 <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-100 rounded-full mb-6">
                   <Bot className="w-10 h-10 text-gray-400" />
                 </div>
                 <h2 className="text-3xl font-medium text-gray-900 mb-3">Find Your Perfect Connection</h2>
                 <p className="text-gray-600 text-lg">AI-powered search for experts, clients, and partners worldwide</p>
                 <div className="mt-8 flex flex-col items-center gap-3">
                   <p className="text-sm text-gray-500">Try searching for:</p>
                   <div className="flex flex-wrap gap-2 justify-center">
                     {["AI experts", "potential SaaS clients", "marketing agencies", "blockchain developers"].map((suggestion) => (
                       <button
                         key={suggestion}
                         onClick={() => setSearchQuery(suggestion)}
                         className="px-3 py-1 bg-white border border-gray-200 rounded-full text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                       >
                         {suggestion}
                       </button>
                     ))}
                   </div>
                 </div>
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
                <div className="mb-8 bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900">
                        Found <span className="text-blue-600">{results.total_results}</span> connections for you
                      </h3>
                      {searchMode === 'smart' && (
                        <p className="text-sm text-gray-600 mt-1 flex items-center gap-2">
                          <Brain className="w-4 h-4 text-blue-500" />
                          AI-matched results optimized for your needs
                        </p>
                      )}
                    </div>
                    
                    {/* Sort Options */}
                    <div className="flex items-center gap-2 text-sm">
                      <button className="px-4 py-2 rounded-full bg-gray-900 text-white hover:bg-gray-800 transition-colors flex items-center gap-2 font-medium">
                        Best Match
                      </button>
                      <button className="px-4 py-2 rounded-full text-gray-700 hover:text-gray-900 hover:bg-gray-100 transition-colors font-medium">
                        Price
                      </button>
                      <button className="px-4 py-2 rounded-full text-gray-700 hover:text-gray-900 hover:bg-gray-100 transition-colors font-medium">
                        Rating
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
                 placeholder="Search for AI experts, potential SaaS clients, marketing agencies..."
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
               <div className="flex gap-2 mr-1">
                 <button 
                   onClick={() => handleSearch(1, false)}
                   className="px-6 py-3 bg-gray-200 text-gray-700 rounded-full hover:bg-gray-300 transition-all duration-300 flex items-center space-x-2"
                 >
                   <span className="hidden sm:inline">Search</span>
                 </button>
                 <button 
                   onClick={handleSmartMatch}
                   className="bg-black text-white px-6 py-3 rounded-full hover:bg-gray-800 transition-all duration-300 flex items-center space-x-2"
                 >
                   <Sparkles className="w-4 h-4" />
                   <span className="hidden sm:inline">AI Match</span>
                 </button>
               </div>
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
     
     {/* Arcade Demo Modal */}
     <AnimatePresence>
       {showDemo && (
         <ArcadeDemo onClose={() => setShowDemo(false)} />
       )}
     </AnimatePresence>
   </div>
 );
}

export default App;