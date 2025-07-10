// AIAgentChat.js - Save in src/components/modern/AIAgentChat.js

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bot, User, Send, Settings, Play, Pause, StopCircle,
  CheckCircle, AlertCircle, Clock, DollarSign, Calendar,
  MessageSquare, Sparkles, Edit, Save, X, ChevronDown,
  Info, Bell, Zap, Target, Brain, Coffee
} from 'lucide-react';

const AIAgentChat = ({ expert, onClose }) => {
  const [stage, setStage] = useState('setup'); // setup, chatting, paused, completed
  const [requirements, setRequirements] = useState({
    timeSlots: [],
    duration: '60',
    budget: {
      min: expert.hourly_rate * 0.8,
      max: expert.hourly_rate * 1.2,
      preferred: expert.hourly_rate
    },
    projectDetails: '',
    urgency: 'flexible', // urgent, soon, flexible
    mustHaves: [],
    niceToHaves: [],
    dealBreakers: [],
    communicationStyle: 'professional' // professional, casual, direct
  });
  
  const [agentSettings, setAgentSettings] = useState({
    negotiationStyle: 'balanced', // aggressive, balanced, passive
    autoApproveThreshold: 90, // % match to auto-approve
    notifyOn: ['priceChange', 'timeChange', 'majorProgress'],
    maxRounds: 10,
    patience: 'medium' // high, medium, low
  });

  const [chatHistory, setChatHistory] = useState([]);
  const [agentStatus, setAgentStatus] = useState('idle');
  const [matchScore, setMatchScore] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const chatEndRef = useRef(null);

  // Mock negotiation progress
  const [negotiationState, setNegotiationState] = useState({
    priceAgreed: false,
    timeAgreed: false,
    termsAgreed: false,
    currentOffer: null,
    rounds: 0
  });

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatHistory]);

  const startAgent = () => {
    setStage('chatting');
    setAgentStatus('active');
    
    // Initial agent message
    const initialMessage = {
      id: Date.now(),
      sender: 'agent',
      type: 'status',
      content: `I'll start negotiating with ${expert.name} based on your requirements. I'll keep you updated on important developments.`,
      timestamp: new Date(),
      metadata: { icon: 'start' }
    };
    
    setChatHistory([initialMessage]);
    
    // Simulate first outreach
    setTimeout(() => {
      const outreachMessage = {
        id: Date.now() + 1,
        sender: 'agent',
        type: 'outgoing',
        content: `Hello ${expert.name}, I'm reaching out on behalf of my client who is interested in your ${expert.skills[0]} expertise. They have a project that requires approximately ${requirements.duration} minutes of consultation. Would you be available to discuss this opportunity?`,
        timestamp: new Date()
      };
      setChatHistory(prev => [...prev, outreachMessage]);
      
      // Simulate expert response
      simulateExpertResponse();
    }, 2000);
  };

  const simulateExpertResponse = () => {
    setTimeout(() => {
      const responses = [
        {
          content: `Thank you for reaching out! I'd be happy to discuss this project. My current rate is $${expert.hourly_rate}/hour. When were you thinking of scheduling this consultation?`,
          negotiable: true
        },
        {
          content: `I'm interested! I have availability this week. Could you tell me more about the specific requirements?`,
          negotiable: true
        },
        {
          content: `I appreciate your interest. My schedule is quite full, but I might be able to accommodate. What's your timeline?`,
          negotiable: false
        }
      ];
      
      const response = responses[Math.floor(Math.random() * responses.length)];
      
      const expertMessage = {
        id: Date.now() + 2,
        sender: 'expert',
        type: 'incoming',
        content: response.content,
        timestamp: new Date(),
        metadata: { negotiable: response.negotiable }
      };
      
      setChatHistory(prev => [...prev, expertMessage]);
      
      // Agent analyzes and responds
      analyzeAndRespond(expertMessage);
    }, 3000 + Math.random() * 2000);
  };

  const analyzeAndRespond = (expertMessage) => {
    // Simulate agent thinking
    setTimeout(() => {
      const thinkingMessage = {
        id: Date.now() + 3,
        sender: 'agent',
        type: 'thinking',
        content: 'Analyzing response and preparing negotiation strategy...',
        timestamp: new Date()
      };
      
      setChatHistory(prev => [...prev, thinkingMessage]);
      
      // Update negotiation state
      const newScore = calculateMatchScore(expertMessage);
      setMatchScore(newScore);
      
      // Check if we need user intervention
      if (newScore < 70 || negotiationState.rounds > 5) {
        notifyUser('attention', 'Negotiation requires your input', 'high');
        setStage('paused');
        setAgentStatus('waiting');
        return;
      }
      
      // Continue negotiation
      setTimeout(() => {
        const agentResponse = generateAgentResponse(expertMessage);
        setChatHistory(prev => [...prev.slice(0, -1), agentResponse]);
        
        setNegotiationState(prev => ({ ...prev, rounds: prev.rounds + 1 }));
        
        // Continue conversation
        if (negotiationState.rounds < agentSettings.maxRounds) {
          simulateExpertResponse();
        }
      }, 2000);
    }, 1000);
  };

  const calculateMatchScore = (message) => {
    // Simplified scoring logic
    let score = 50;
    
    if (message.content.includes(requirements.budget.preferred.toString())) {
      score += 20;
    }
    if (message.content.includes('available')) {
      score += 15;
    }
    if (message.metadata?.negotiable) {
      score += 15;
    }
    
    return Math.min(score, 100);
  };

  const generateAgentResponse = (expertMessage) => {
    const responses = [
      `That sounds great! My client's budget is around $${requirements.budget.preferred} per hour. They're looking for a ${requirements.duration}-minute session. Would ${generateTimeSlot()} work for you?`,
      `Thank you for the quick response. Regarding the timeline, my client is ${requirements.urgency === 'urgent' ? 'looking to schedule as soon as possible' : 'flexible with scheduling'}. Could we discuss a package rate for ${requirements.duration} minutes?`,
      `I appreciate your availability. My client specifically needs help with ${requirements.projectDetails || 'their project'}. Given the scope, would you consider $${requirements.budget.preferred} for the session?`
    ];
    
    return {
      id: Date.now() + 4,
      sender: 'agent',
      type: 'outgoing',
      content: responses[Math.floor(Math.random() * responses.length)],
      timestamp: new Date(),
      metadata: { strategy: agentSettings.negotiationStyle }
    };
  };

  const generateTimeSlot = () => {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    const times = ['morning', 'afternoon', 'evening'];
    return `${days[Math.floor(Math.random() * days.length)]} ${times[Math.floor(Math.random() * times.length)]}`;
  };

  const notifyUser = (type, message, priority = 'medium') => {
    const notification = {
      id: Date.now(),
      type,
      message,
      priority,
      timestamp: new Date()
    };
    
    setNotifications(prev => [...prev, notification]);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== notification.id));
    }, 5000);
  };

  const pauseAgent = () => {
    setAgentStatus('paused');
    setStage('paused');
    
    const pauseMessage = {
      id: Date.now(),
      sender: 'agent',
      type: 'status',
      content: 'I\'ve paused the negotiation. Feel free to review the conversation and adjust settings before continuing.',
      timestamp: new Date(),
      metadata: { icon: 'pause' }
    };
    
    setChatHistory(prev => [...prev, pauseMessage]);
  };

  const resumeAgent = () => {
    setAgentStatus('active');
    setStage('chatting');
    
    const resumeMessage = {
      id: Date.now(),
      sender: 'agent',
      type: 'status',
      content: 'Resuming negotiation with updated parameters...',
      timestamp: new Date(),
      metadata: { icon: 'play' }
    };
    
    setChatHistory(prev => [...prev, resumeMessage]);
    simulateExpertResponse();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 overflow-hidden">
      <div className="h-full flex">
        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col bg-gray-900">
          {/* Header */}
          <div className="bg-gray-800 border-b border-gray-700 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Bot className="w-8 h-8 text-green-400" />
                  <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full ${
                    agentStatus === 'active' ? 'bg-green-400 animate-pulse' : 
                    agentStatus === 'paused' ? 'bg-yellow-400' : 'bg-gray-400'
                  }`} />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white">AI Negotiation Agent</h2>
                  <p className="text-sm text-gray-400">
                    Negotiating with {expert.name} • Round {negotiationState.rounds}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                {/* Match Score */}
                <div className="flex items-center gap-2 px-3 py-1 bg-gray-700 rounded-full">
                  <Target className="w-4 h-4 text-green-400" />
                  <span className="text-sm text-white">{matchScore}% Match</span>
                </div>
                
                {/* Controls */}
                {stage === 'chatting' && (
                  <button
                    onClick={pauseAgent}
                    className="p-2 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 rounded-lg transition-colors"
                  >
                    <Pause className="w-5 h-5" />
                  </button>
                )}
                {stage === 'paused' && (
                  <button
                    onClick={resumeAgent}
                    className="p-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-lg transition-colors"
                  >
                    <Play className="w-5 h-5" />
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="p-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Notifications */}
          <AnimatePresence>
            {notifications.length > 0 && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="border-b border-gray-700"
              >
                {notifications.map(notif => (
                  <div
                    key={notif.id}
                    className={`px-6 py-3 flex items-center gap-3 ${
                      notif.priority === 'high' ? 'bg-red-500/10' : 
                      notif.priority === 'medium' ? 'bg-yellow-500/10' : 'bg-blue-500/10'
                    }`}
                  >
                    <Bell className={`w-4 h-4 ${
                      notif.priority === 'high' ? 'text-red-400' : 
                      notif.priority === 'medium' ? 'text-yellow-400' : 'text-blue-400'
                    }`} />
                    <span className="text-sm text-white flex-1">{notif.message}</span>
                    <button
                      onClick={() => setNotifications(prev => prev.filter(n => n.id !== notif.id))}
                      className="text-gray-400 hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {stage === 'setup' ? (
              <SetupForm 
                requirements={requirements}
                setRequirements={setRequirements}
                agentSettings={agentSettings}
                setAgentSettings={setAgentSettings}
                expert={expert}
                onStart={startAgent}
              />
            ) : (
              <>
                {chatHistory.map((message) => (
                  <ChatMessage key={message.id} message={message} expert={expert} />
                ))}
                <div ref={chatEndRef} />
              </>
            )}
          </div>

          {/* Quick Actions */}
          {stage === 'paused' && (
            <div className="border-t border-gray-700 p-4">
              <div className="flex items-center gap-3">
                <button className="flex-1 py-2 px-4 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-lg transition-colors flex items-center justify-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  Accept Current Terms
                </button>
                <button className="flex-1 py-2 px-4 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 rounded-lg transition-colors flex items-center justify-center gap-2">
                  <Edit className="w-4 h-4" />
                  Modify Requirements
                </button>
                <button className="flex-1 py-2 px-4 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg transition-colors flex items-center justify-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  Take Over Chat
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Settings Sidebar */}
        <div className="w-96 bg-gray-800 border-l border-gray-700 overflow-y-auto">
          <SettingsSidebar 
            requirements={requirements}
            setRequirements={setRequirements}
            agentSettings={agentSettings}
            setAgentSettings={setAgentSettings}
            negotiationState={negotiationState}
            stage={stage}
          />
        </div>
      </div>
    </div>
  );
};

// Setup Form Component
const SetupForm = ({ requirements, setRequirements, agentSettings, setAgentSettings, expert, onStart }) => {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-green-500/20 rounded-full mb-4">
          <Brain className="w-8 h-8 text-green-400" />
        </div>
        <h3 className="text-2xl font-bold text-white mb-2">Configure Your AI Agent</h3>
        <p className="text-gray-400">
          I'll negotiate with {expert.name} on your behalf. Let me know your requirements and I'll work to get you the best deal.
        </p>
      </div>

      <div className="space-y-6">
        {/* Project Details */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Project Description
          </label>
          <textarea
            value={requirements.projectDetails}
            onChange={(e) => setRequirements(prev => ({ ...prev, projectDetails: e.target.value }))}
            placeholder="Describe what you need help with..."
            className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-green-500"
            rows={3}
          />
        </div>

        {/* Duration and Budget */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Session Duration
            </label>
            <select
              value={requirements.duration}
              onChange={(e) => setRequirements(prev => ({ ...prev, duration: e.target.value }))}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-green-500"
            >
              <option value="30">30 minutes</option>
              <option value="60">1 hour</option>
              <option value="90">1.5 hours</option>
              <option value="120">2 hours</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Budget Range (per hour)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={requirements.budget.min}
                onChange={(e) => setRequirements(prev => ({
                  ...prev,
                  budget: { ...prev.budget, min: parseInt(e.target.value) }
                }))}
                className="flex-1 px-3 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-green-500"
                placeholder="Min"
              />
              <span className="text-gray-400">-</span>
              <input
                type="number"
                value={requirements.budget.max}
                onChange={(e) => setRequirements(prev => ({
                  ...prev,
                  budget: { ...prev.budget, max: parseInt(e.target.value) }
                }))}
                className="flex-1 px-3 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-green-500"
                placeholder="Max"
              />
            </div>
          </div>
        </div>

        {/* Urgency */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Timeline Urgency
          </label>
          <div className="grid grid-cols-3 gap-3">
            {['urgent', 'soon', 'flexible'].map((urgency) => (
              <button
                key={urgency}
                onClick={() => setRequirements(prev => ({ ...prev, urgency }))}
                className={`py-2 px-4 rounded-lg border transition-all ${
                  requirements.urgency === urgency
                    ? 'bg-green-500/20 border-green-500 text-green-400'
                    : 'bg-gray-700 border-gray-600 text-gray-300 hover:border-gray-500'
                }`}
              >
                {urgency === 'urgent' && <Zap className="w-4 h-4 inline mr-1" />}
                {urgency === 'soon' && <Clock className="w-4 h-4 inline mr-1" />}
                {urgency === 'flexible' && <Coffee className="w-4 h-4 inline mr-1" />}
                {urgency.charAt(0).toUpperCase() + urgency.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Negotiation Style */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Negotiation Style
          </label>
          <div className="grid grid-cols-3 gap-3">
            {['aggressive', 'balanced', 'passive'].map((style) => (
              <button
                key={style}
                onClick={() => setAgentSettings(prev => ({ ...prev, negotiationStyle: style }))}
                className={`py-2 px-4 rounded-lg border transition-all ${
                  agentSettings.negotiationStyle === style
                    ? 'bg-green-500/20 border-green-500 text-green-400'
                    : 'bg-gray-700 border-gray-600 text-gray-300 hover:border-gray-500'
                }`}
              >
                {style.charAt(0).toUpperCase() + style.slice(1)}
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {agentSettings.negotiationStyle === 'aggressive' && 'Push hard for the best deal'}
            {agentSettings.negotiationStyle === 'balanced' && 'Find a fair middle ground'}
            {agentSettings.negotiationStyle === 'passive' && 'Accept reasonable offers quickly'}
          </p>
        </div>

        {/* Start Button */}
        <button
          onClick={onStart}
          className="w-full py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-black font-bold rounded-lg transition-all duration-300 flex items-center justify-center gap-2"
        >
          <Sparkles className="w-5 h-5" />
          Start AI Negotiation
        </button>
      </div>
    </div>
  );
};

// Chat Message Component
const ChatMessage = ({ message, expert }) => {
  const getMessageStyle = () => {
    switch (message.type) {
      case 'outgoing':
        return 'ml-auto bg-green-500/20 border-green-500/30';
      case 'incoming':
        return 'mr-auto bg-gray-700 border-gray-600';
      case 'status':
        return 'mx-auto bg-blue-500/10 border-blue-500/20 text-center';
      case 'thinking':
        return 'mx-auto bg-yellow-500/10 border-yellow-500/20 text-center';
      default:
        return 'bg-gray-700';
    }
  };

  const getIcon = () => {
    if (message.sender === 'agent') {
      if (message.type === 'thinking') return <Brain className="w-5 h-5 text-yellow-400 animate-pulse" />;
      if (message.metadata?.icon === 'start') return <Play className="w-5 h-5 text-green-400" />;
      if (message.metadata?.icon === 'pause') return <Pause className="w-5 h-5 text-yellow-400" />;
      return <Bot className="w-5 h-5 text-green-400" />;
    }
    if (message.sender === 'expert') {
      return <User className="w-5 h-5 text-blue-400" />;
    }
    return null;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`max-w-lg px-4 py-3 rounded-lg border ${getMessageStyle()}`}
    >
      <div className="flex items-start gap-3">
        {getIcon()}
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-medium text-gray-400">
              {message.sender === 'agent' ? 'AI Agent' : 
               message.sender === 'expert' ? expert.name : 'System'}
            </span>
            <span className="text-xs text-gray-500">
              {new Date(message.timestamp).toLocaleTimeString()}
            </span>
          </div>
          <p className="text-sm text-gray-200">{message.content}</p>
        </div>
      </div>
    </motion.div>
  );
};

// Settings Sidebar Component
const SettingsSidebar = ({ requirements, setRequirements, agentSettings, setAgentSettings, negotiationState, stage }) => {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-white mb-4">Negotiation Progress</h3>
        
        {/* Progress Items */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-300">Price Agreement</span>
            </div>
            <div className={`w-2 h-2 rounded-full ${
              negotiationState.priceAgreed ? 'bg-green-400' : 'bg-gray-600'
            }`} />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-300">Schedule Agreement</span>
            </div>
            <div className={`w-2 h-2 rounded-full ${
              negotiationState.timeAgreed ? 'bg-green-400' : 'bg-gray-600'
            }`} />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-300">Terms Agreement</span>
            </div>
            <div className={`w-2 h-2 rounded-full ${
              negotiationState.termsAgreed ? 'bg-green-400' : 'bg-gray-600'
            }`} />
          </div>
        </div>
      </div>

      {/* Current Requirements */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-4">Current Requirements</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-400">Duration:</span>
            <span className="text-white">{requirements.duration} minutes</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Budget:</span>
            <span className="text-white">${requirements.budget.min} - ${requirements.budget.max}/hr</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Urgency:</span>
            <span className="text-white capitalize">{requirements.urgency}</span>
          </div>
        </div>
      </div>

      {/* Agent Settings */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-4">Agent Settings</h3>
        <div className="space-y-3">
          <div>
            <label className="text-sm text-gray-400">Auto-approve threshold</label>
            <div className="flex items-center gap-2 mt-1">
              <input
                type="range"
                min="50"
                max="100"
                value={agentSettings.autoApproveThreshold}
                onChange={(e) => setAgentSettings(prev => ({
                  ...prev,
                  autoApproveThreshold: parseInt(e.target.value)
                }))}
                className="flex-1"
                disabled={stage === 'chatting'}
              />
              <span className="text-sm text-white w-12 text-right">
                {agentSettings.autoApproveThreshold}%
              </span>
            </div>
          </div>
          
          <div>
            <label className="text-sm text-gray-400">Max negotiation rounds</label>
            <input
              type="number"
              value={agentSettings.maxRounds}
              onChange={(e) => setAgentSettings(prev => ({
                ...prev,
                maxRounds: parseInt(e.target.value)
              }))}
              className="w-full mt-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm"
              disabled={stage === 'chatting'}
            />
          </div>
        </div>
      </div>

      {/* Notifications Settings */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-4">Notify me when</h3>
        <div className="space-y-2">
          {[
            { key: 'priceChange', label: 'Price changes significantly' },
            { key: 'timeChange', label: 'Schedule changes' },
            { key: 'majorProgress', label: 'Major progress is made' },
            { key: 'expertQuestion', label: 'Expert asks a question' }
          ].map(({ key, label }) => (
            <label key={key} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={agentSettings.notifyOn.includes(key)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setAgentSettings(prev => ({
                      ...prev,
                      notifyOn: [...prev.notifyOn, key]
                    }));
                  } else {
                    setAgentSettings(prev => ({
                      ...prev,
                      notifyOn: prev.notifyOn.filter(n => n !== key)
                    }));
                  }
                }}
                className="rounded border-gray-600 text-green-500 focus:ring-green-500"
                disabled={stage === 'chatting'}
              />
              <span className="text-sm text-gray-300">{label}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AIAgentChat;