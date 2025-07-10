// AIEmailAgent.js - Save in src/components/modern/AIEmailAgent.js

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Mail, Send, Bot, User, Clock, CheckCircle, AlertCircle,
  Settings, Play, Pause, Eye, EyeOff, Edit, Save, X,
  Sparkles, Brain, Zap, Coffee, Target, TrendingUp,
  FileText, Copy, RefreshCw, ChevronDown, ChevronUp,
  Shield, Bell, MessageSquare, Inbox, Archive
} from 'lucide-react';

const AIEmailAgent = ({ expert, onClose }) => {
  const [stage, setStage] = useState('setup'); // setup, active, paused, review
  const [agentConfig, setAgentConfig] = useState({
    // User Requirements
    projectDetails: '',
    objectives: [],
    timeline: 'flexible', // urgent, soon, flexible
    budget: {
      min: expert.hourly_rate * 0.8,
      max: expert.hourly_rate * 1.2,
      ideal: expert.hourly_rate
    },
    sessionDuration: '60',
    preferredDates: [],
    
    // Agent Behavior
    tone: 'professional', // professional, friendly, direct
    negotiationStyle: 'balanced', // assertive, balanced, accommodating
    responseSpeed: 'normal', // immediate, normal, delayed
    
    // Email Settings
    userEmail: '',
    ccEmails: [],
    emailSignature: '',
    
    // AI Instructions
    customInstructions: '',
    mustInclude: [],
    avoidTopics: [],
    
    // Automation Rules
    autoRespond: true,
    requireApproval: ['price_negotiation', 'commitment', 'scheduling'],
    escalationThreshold: 3, // rounds before human intervention
    
    // Monitoring
    notifyOn: ['expert_response', 'significant_progress', 'intervention_needed'],
    summaryFrequency: 'daily' // immediate, daily, weekly
  });

  const [emailThread, setEmailThread] = useState([]);
  const [agentStatus, setAgentStatus] = useState('idle');
  const [metrics, setMetrics] = useState({
    emailsSent: 0,
    emailsReceived: 0,
    currentRound: 0,
    matchScore: 0,
    estimatedProgress: 0
  });

  const [draftEmail, setDraftEmail] = useState('');
  const [showDraftPreview, setShowDraftPreview] = useState(false);

  // Generate initial email using AI
  const generateInitialEmail = async () => {
    setAgentStatus('generating');
    
    // Simulate AI generation (in production, this would call your AI API)
    const prompt = `
      Write a professional email to ${expert.name} (${expert.title}) requesting a consultation.
      
      Context:
      - Project: ${agentConfig.projectDetails}
      - Timeline: ${agentConfig.timeline}
      - Budget: $${agentConfig.budget.ideal}/hour
      - Duration: ${agentConfig.sessionDuration} minutes
      - Tone: ${agentConfig.tone}
      
      Additional instructions: ${agentConfig.customInstructions}
      
      Make it concise, compelling, and action-oriented.
    `;
    
    // Simulated AI response
    setTimeout(() => {
      const generatedEmail = `Subject: Consultation Request - ${agentConfig.projectDetails.substring(0, 50)}...

Dear ${expert.name},

I hope this email finds you well. I came across your profile and was impressed by your expertise in ${expert.skills[0]}.

I'm working on ${agentConfig.projectDetails} and believe your insights would be invaluable. I'm looking for a ${agentConfig.sessionDuration}-minute consultation to discuss:

${agentConfig.objectives.map((obj, i) => `${i + 1}. ${obj}`).join('\n')}

Timeline: ${agentConfig.timeline === 'urgent' ? 'As soon as possible' : agentConfig.timeline === 'soon' ? 'Within the next week' : 'Flexible, based on your availability'}

I understand your standard rate is $${expert.hourly_rate}/hour, and I'm prepared to work within a budget of $${agentConfig.budget.ideal}/hour for this consultation.

Would you be available for a brief discussion? I'm happy to work around your schedule.

Looking forward to your response.

Best regards,
${agentConfig.emailSignature || 'Your AI Assistant'}`;

      setDraftEmail(generatedEmail);
      setShowDraftPreview(true);
      setAgentStatus('ready');
    }, 2000);
  };

  // Send email
  const sendEmail = async (emailContent, isAutomated = false) => {
    const newEmail = {
      id: Date.now(),
      type: 'sent',
      content: emailContent,
      timestamp: new Date(),
      isAutomated,
      status: 'sent',
      metadata: {
        round: metrics.currentRound + 1,
        matchScore: metrics.matchScore
      }
    };
    
    setEmailThread(prev => [...prev, newEmail]);
    setMetrics(prev => ({
      ...prev,
      emailsSent: prev.emailsSent + 1,
      currentRound: prev.currentRound + 1
    }));
    
    // Simulate email sending to backend
    // In production, this would actually send the email
    console.log('Sending email:', emailContent);
    
    // Simulate expert response after delay
    if (isAutomated) {
      simulateExpertResponse();
    }
  };

  // Simulate receiving expert response
  const simulateExpertResponse = () => {
    setTimeout(() => {
      const responses = [
        {
          content: `Thank you for reaching out. I'd be happy to discuss your project. My current availability is next Tuesday or Thursday afternoon. My standard rate is $${expert.hourly_rate}/hour. Would either of those times work for you?`,
          sentiment: 'positive'
        },
        {
          content: `I appreciate your interest. Could you provide more details about the specific challenges you're facing? This will help me better understand how I can assist you.`,
          sentiment: 'neutral'
        },
        {
          content: `Thanks for your email. I'm currently fully booked for the next two weeks. However, I could offer a slot on ${new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toLocaleDateString()}. Would that work?`,
          sentiment: 'neutral'
        }
      ];
      
      const response = responses[Math.floor(Math.random() * responses.length)];
      
      const expertEmail = {
        id: Date.now(),
        type: 'received',
        content: response.content,
        timestamp: new Date(),
        from: expert.name,
        sentiment: response.sentiment,
        metadata: {
          requiresResponse: true,
          topics: ['availability', 'pricing', 'details']
        }
      };
      
      setEmailThread(prev => [...prev, expertEmail]);
      setMetrics(prev => ({
        ...prev,
        emailsReceived: prev.emailsReceived + 1,
        matchScore: response.sentiment === 'positive' ? 75 : 50
      }));
      
      // Trigger AI analysis and response
      if (agentConfig.autoRespond && metrics.currentRound < agentConfig.escalationThreshold) {
        analyzeAndRespond(expertEmail);
      } else {
        // Notify user for intervention
        setAgentStatus('intervention_needed');
      }
    }, 5000 + Math.random() * 5000);
  };

  // AI analyzes email and generates response
  const analyzeAndRespond = async (expertEmail) => {
    setAgentStatus('analyzing');
    
    // Simulate AI analysis
    setTimeout(() => {
      const analysis = {
        sentiment: expertEmail.sentiment,
        keyTopics: expertEmail.metadata.topics,
        suggestedAction: 'respond_with_availability',
        confidenceScore: 0.85
      };
      
      // Generate AI response based on analysis
      generateAIResponse(expertEmail, analysis);
    }, 2000);
  };

  // Generate AI response to expert
  const generateAIResponse = async (expertEmail, analysis) => {
    setAgentStatus('generating');
    
    setTimeout(() => {
      let responseContent = '';
      
      if (analysis.keyTopics.includes('availability')) {
        responseContent = `Thank you for the quick response! ${expertEmail.content.includes('Tuesday') ? 'Tuesday afternoon works perfectly for me.' : 'I\'m flexible with timing and can adjust to your schedule.'}

Regarding the consultation format, would a video call work best for you? I'm happy to use your preferred platform.

To make our session as productive as possible, I'll prepare:
- Specific questions about ${agentConfig.projectDetails}
- Relevant background information
- Clear objectives for our discussion

Looking forward to our conversation!`;
      } else if (analysis.keyTopics.includes('details')) {
        responseContent = `Of course! Here are more specific details about my project:

${agentConfig.projectDetails}

Key areas where I need your expertise:
${agentConfig.objectives.map((obj, i) => `- ${obj}`).join('\n')}

I believe your experience with ${expert.skills[0]} would be particularly valuable for this project.

Would you like me to send over any additional documentation before our call?`;
      }
      
      // Check if approval needed
      const needsApproval = agentConfig.requireApproval.some(topic => 
        analysis.keyTopics.includes(topic)
      );
      
      if (needsApproval) {
        setDraftEmail(responseContent);
        setShowDraftPreview(true);
        setAgentStatus('pending_approval');
      } else {
        sendEmail(responseContent, true);
        setAgentStatus('active');
      }
    }, 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 overflow-hidden">
      <div className="h-full flex">
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col bg-gray-900">
          {/* Header */}
          <div className="bg-gray-800 border-b border-gray-700 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Mail className="w-8 h-8 text-purple-400" />
                  <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full ${
                    agentStatus === 'active' ? 'bg-green-400 animate-pulse' : 
                    agentStatus === 'analyzing' || agentStatus === 'generating' ? 'bg-yellow-400 animate-pulse' :
                    agentStatus === 'intervention_needed' ? 'bg-red-400' : 'bg-gray-400'
                  }`} />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white">AI Email Agent</h2>
                  <p className="text-sm text-gray-400">
                    Negotiating with {expert.name} • Round {metrics.currentRound}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                {/* Status Badge */}
                <div className={`px-3 py-1 rounded-full text-sm flex items-center gap-2 ${
                  agentStatus === 'active' ? 'bg-green-500/20 text-green-400' :
                  agentStatus === 'analyzing' ? 'bg-yellow-500/20 text-yellow-400' :
                  agentStatus === 'generating' ? 'bg-purple-500/20 text-purple-400' :
                  agentStatus === 'intervention_needed' ? 'bg-red-500/20 text-red-400' :
                  'bg-gray-700 text-gray-400'
                }`}>
                  {agentStatus === 'analyzing' && <Brain className="w-4 h-4 animate-pulse" />}
                  {agentStatus === 'generating' && <Sparkles className="w-4 h-4 animate-pulse" />}
                  {agentStatus.replace('_', ' ').charAt(0).toUpperCase() + agentStatus.slice(1).replace('_', ' ')}
                </div>
                
                <button
                  onClick={onClose}
                  className="p-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="bg-gray-800/50 px-6 py-3 border-b border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">Negotiation Progress</span>
              <span className="text-sm text-white">{metrics.estimatedProgress}%</span>
            </div>
            <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-purple-500 to-purple-600"
                initial={{ width: 0 }}
                animate={{ width: `${metrics.estimatedProgress}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto">
            {stage === 'setup' ? (
              <SetupWizard 
                config={agentConfig}
                setConfig={setAgentConfig}
                expert={expert}
                onStart={() => {
                  setStage('active');
                  generateInitialEmail();
                }}
              />
            ) : (
              <EmailThread 
                thread={emailThread}
                expert={expert}
                agentStatus={agentStatus}
              />
            )}
          </div>

          {/* Draft Preview */}
          <AnimatePresence>
            {showDraftPreview && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="border-t border-gray-700 bg-gray-800"
              >
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                      <Edit className="w-5 h-5" />
                      Review AI Draft
                    </h3>
                    <button
                      onClick={() => setShowDraftPreview(false)}
                      className="text-gray-400 hover:text-white"
                    >
                      <ChevronDown className="w-5 h-5" />
                    </button>
                  </div>
                  
                  <div className="bg-gray-900 rounded-lg p-4 mb-4">
                    <textarea
                      value={draftEmail}
                      onChange={(e) => setDraftEmail(e.target.value)}
                      className="w-full bg-transparent text-white resize-none focus:outline-none"
                      rows={10}
                    />
                  </div>
                  
                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        sendEmail(draftEmail, true);
                        setShowDraftPreview(false);
                        setAgentStatus('active');
                      }}
                      className="flex-1 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-medium py-2 px-4 rounded-lg transition-all flex items-center justify-center gap-2"
                    >
                      <Send className="w-4 h-4" />
                      Send Email
                    </button>
                    <button
                      onClick={() => generateInitialEmail()}
                      className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg transition-colors flex items-center gap-2"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Regenerate
                    </button>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(draftEmail);
                      }}
                      className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg transition-colors"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Settings Sidebar */}
        <div className="w-96 bg-gray-800 border-l border-gray-700 overflow-y-auto">
          <AgentSettings 
            config={agentConfig}
            setConfig={setAgentConfig}
            metrics={metrics}
            stage={stage}
          />
        </div>
      </div>
    </div>
  );
};

// Setup Wizard Component
const SetupWizard = ({ config, setConfig, expert, onStart }) => {
  const [currentStep, setCurrentStep] = useState(0);
  
  const steps = [
    { title: 'Project Details', icon: FileText },
    { title: 'Requirements', icon: Target },
    { title: 'Agent Settings', icon: Settings },
    { title: 'Review & Launch', icon: Sparkles }
  ];

  return (
    <div className="max-w-3xl mx-auto p-8">
      {/* Progress Steps */}
      <div className="flex items-center justify-center mb-8">
        {steps.map((step, index) => (
          <React.Fragment key={index}>
            <div className={`flex items-center ${index <= currentStep ? 'text-purple-400' : 'text-gray-600'}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                index < currentStep ? 'bg-purple-500 border-purple-500' :
                index === currentStep ? 'border-purple-500' : 'border-gray-600'
              }`}>
                {index < currentStep ? (
                  <CheckCircle className="w-5 h-5 text-white" />
                ) : (
                  <step.icon className="w-5 h-5" />
                )}
              </div>
              <span className="ml-2 text-sm font-medium hidden sm:inline">{step.title}</span>
            </div>
            {index < steps.length - 1 && (
              <div className={`w-12 sm:w-24 h-0.5 mx-2 ${
                index < currentStep ? 'bg-purple-500' : 'bg-gray-600'
              }`} />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Step Content */}
      <AnimatePresence mode="wait">
        {currentStep === 0 && (
          <motion.div
            key="step0"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div>
              <h3 className="text-2xl font-bold text-white mb-2">Tell me about your project</h3>
              <p className="text-gray-400">This helps the AI agent communicate effectively with {expert.name}</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Project Description
              </label>
              <textarea
                value={config.projectDetails}
                onChange={(e) => setConfig(prev => ({ ...prev, projectDetails: e.target.value }))}
                placeholder="Describe your project, challenges, and what you hope to achieve..."
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
                rows={6}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Key Objectives (one per line)
              </label>
              <textarea
                value={config.objectives.join('\n')}
                onChange={(e) => setConfig(prev => ({ 
                  ...prev, 
                  objectives: e.target.value.split('\n').filter(o => o.trim())
                }))}
                placeholder="• Get advice on technical architecture\n• Review best practices\n• Discuss implementation strategy"
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
                rows={4}
              />
            </div>
          </motion.div>
        )}

        {currentStep === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div>
              <h3 className="text-2xl font-bold text-white mb-2">Set your requirements</h3>
              <p className="text-gray-400">Define your budget, timeline, and preferences</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Session Duration
                </label>
                <select
                  value={config.sessionDuration}
                  onChange={(e) => setConfig(prev => ({ ...prev, sessionDuration: e.target.value }))}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
                >
                  <option value="30">30 minutes</option>
                  <option value="60">1 hour</option>
                  <option value="90">1.5 hours</option>
                  <option value="120">2 hours</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Timeline
                </label>
                <select
                  value={config.timeline}
                  onChange={(e) => setConfig(prev => ({ ...prev, timeline: e.target.value }))}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
                >
                  <option value="urgent">Urgent (ASAP)</option>
                  <option value="soon">Soon (This week)</option>
                  <option value="flexible">Flexible</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Budget Range (per hour)
              </label>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-gray-500">Minimum</label>
                  <input
                    type="number"
                    value={config.budget.min}
                    onChange={(e) => setConfig(prev => ({
                      ...prev,
                      budget: { ...prev.budget, min: parseInt(e.target.value) }
                    }))}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500">Ideal</label>
                  <input
                    type="number"
                    value={config.budget.ideal}
                    onChange={(e) => setConfig(prev => ({
                      ...prev,
                      budget: { ...prev.budget, ideal: parseInt(e.target.value) }
                    }))}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500">Maximum</label>
                  <input
                    type="number"
                    value={config.budget.max}
                    onChange={(e) => setConfig(prev => ({
                      ...prev,
                      budget: { ...prev.budget, max: parseInt(e.target.value) }
                    }))}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Expert's rate: ${expert.hourly_rate}/hour
              </p>
            </div>
          </motion.div>
        )}

        {currentStep === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div>
              <h3 className="text-2xl font-bold text-white mb-2">Configure AI agent behavior</h3>
              <p className="text-gray-400">Customize how your AI agent communicates and negotiates</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Communication Tone
                </label>
                <select
                  value={config.tone}
                  onChange={(e) => setConfig(prev => ({ ...prev, tone: e.target.value }))}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
                >
                  <option value="professional">Professional</option>
                  <option value="friendly">Friendly</option>
                  <option value="direct">Direct</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Negotiation Style
                </label>
                <select
                  value={config.negotiationStyle}
                  onChange={(e) => setConfig(prev => ({ ...prev, negotiationStyle: e.target.value }))}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
                >
                  <option value="assertive">Assertive</option>
                  <option value="balanced">Balanced</option>
                  <option value="accommodating">Accommodating</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Your Email (for CC)
              </label>
              <input
                type="email"
                value={config.userEmail}
                onChange={(e) => setConfig(prev => ({ ...prev, userEmail: e.target.value }))}
                placeholder="your.email@example.com"
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                When to request your approval
              </label>
              <div className="space-y-2">
                {[
                  { key: 'price_negotiation', label: 'Price negotiations' },
                  { key: 'commitment', label: 'Making commitments' },
                  { key: 'scheduling', label: 'Scheduling meetings' },
                  { key: 'scope_change', label: 'Scope changes' }
                ].map(({ key, label }) => (
                  <label key={key} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.requireApproval.includes(key)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setConfig(prev => ({
                            ...prev,
                            requireApproval: [...prev.requireApproval, key]
                          }));
                        } else {
                          setConfig(prev => ({
                            ...prev,
                            requireApproval: prev.requireApproval.filter(item => item !== key)
                          }));
                        }
                      }}
                      className="rounded border-gray-600 text-purple-500 focus:ring-purple-500"
                    />
                    <span className="text-sm text-gray-300">{label}</span>
                  </label>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {currentStep === 3 && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div>
              <h3 className="text-2xl font-bold text-white mb-2">Review and launch</h3>
              <p className="text-gray-400">Confirm your settings before activating the AI agent</p>
            </div>

            <div className="bg-gray-800 rounded-lg p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-400">Expert:</span>
                  <p className="text-white font-medium">{expert.name}</p>
                </div>
                <div>
                  <span className="text-gray-400">Duration:</span>
                  <p className="text-white font-medium">{config.sessionDuration} minutes</p>
                </div>
                <div>
                  <span className="text-gray-400">Budget:</span>
                  <p className="text-white font-medium">${config.budget.ideal}/hour</p>
                </div>
                <div>
                  <span className="text-gray-400">Timeline:</span>
                  <p className="text-white font-medium capitalize">{config.timeline}</p>
                </div>
                <div>
                  <span className="text-gray-400">Tone:</span>
                  <p className="text-white font-medium capitalize">{config.tone}</p>
                </div>
                <div>
                  <span className="text-gray-400">Style:</span>
                  <p className="text-white font-medium capitalize">{config.negotiationStyle}</p>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-700">
                <span className="text-gray-400 text-sm">Project:</span>
                <p className="text-white text-sm mt-1">{config.projectDetails}</p>
              </div>

              <div className="pt-4 border-t border-gray-700">
                <span className="text-gray-400 text-sm">Objectives:</span>
                <ul className="mt-1 space-y-1">
                  {config.objectives.map((obj, i) => (
                    <li key={i} className="text-white text-sm flex items-start gap-2">
                      <span className="text-purple-400">•</span>
                      {obj}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="text-purple-300 font-medium mb-1">AI Agent Protection</p>
                  <p className="text-gray-400">
                    Your AI agent will automatically negotiate on your behalf while requiring approval for important decisions.
                    All emails are monitored and you'll be notified of significant developments.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex justify-between mt-8">
        <button
          onClick={() => setCurrentStep(prev => Math.max(0, prev - 1))}
          disabled={currentStep === 0}
          className={`px-6 py-2 rounded-lg transition-colors ${
            currentStep === 0
              ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
              : 'bg-gray-700 hover:bg-gray-600 text-white'
          }`}
        >
          Previous
        </button>

        {currentStep < steps.length - 1 ? (
          <button
            onClick={() => setCurrentStep(prev => prev + 1)}
            disabled={
              (currentStep === 0 && !config.projectDetails) ||
              (currentStep === 1 && config.objectives.length === 0)
            }
            className="px-6 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        ) : (
          <button
            onClick={onStart}
            className="px-6 py-2 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-medium rounded-lg transition-all flex items-center gap-2"
          >
            <Bot className="w-5 h-5" />
            Launch AI Agent
          </button>
        )}
      </div>
    </div>
  );
};

// Email Thread Component
const EmailThread = ({ thread, expert, agentStatus }) => {
  return (
    <div className="p-6 space-y-4">
      {thread.length === 0 ? (
        <div className="text-center py-12">
          <Inbox className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400">No emails yet. The AI agent will start the conversation shortly.</p>
        </div>
      ) : (
        thread.map((email) => (
          <motion.div
            key={email.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`${
              email.type === 'sent' ? 'ml-auto max-w-2xl' : 'mr-auto max-w-2xl'
            }`}
          >
            <div className={`rounded-lg ${
              email.type === 'sent' 
                ? 'bg-purple-500/20 border border-purple-500/30' 
                : 'bg-gray-800 border border-gray-700'
            }`}>
              <div className="px-4 py-3 border-b border-gray-700/50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {email.type === 'sent' ? (
                    <>
                      <Bot className="w-5 h-5 text-purple-400" />
                      <span className="text-sm font-medium text-purple-300">AI Agent</span>
                    </>
                  ) : (
                    <>
                      <User className="w-5 h-5 text-blue-400" />
                      <span className="text-sm font-medium text-blue-300">{expert.name}</span>
                    </>
                  )}
                  {email.isAutomated && (
                    <span className="text-xs px-2 py-0.5 bg-purple-500/20 text-purple-300 rounded-full">
                      Automated
                    </span>
                  )}
                </div>
                <span className="text-xs text-gray-500">
                  {new Date(email.timestamp).toLocaleString()}
                </span>
              </div>
              <div className="p-4">
                <pre className="whitespace-pre-wrap text-sm text-gray-200 font-sans">
                  {email.content}
                </pre>
              </div>
              {email.metadata && (
                <div className="px-4 py-2 border-t border-gray-700/50 flex items-center gap-4 text-xs">
                  {email.metadata.sentiment && (
                    <span className={`flex items-center gap-1 ${
                      email.metadata.sentiment === 'positive' ? 'text-green-400' :
                      email.metadata.sentiment === 'negative' ? 'text-red-400' :
                      'text-yellow-400'
                    }`}>
                      <TrendingUp className="w-3 h-3" />
                      {email.metadata.sentiment}
                    </span>
                  )}
                  {email.metadata.round && (
                    <span className="text-gray-500">
                      Round {email.metadata.round}
                    </span>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        ))
      )}
      
      {agentStatus === 'analyzing' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center justify-center gap-3 text-gray-400 py-4"
        >
          <Brain className="w-5 h-5 animate-pulse" />
          <span className="text-sm">AI agent is analyzing the response...</span>
        </motion.div>
      )}
      
      {agentStatus === 'generating' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center justify-center gap-3 text-purple-400 py-4"
        >
          <Sparkles className="w-5 h-5 animate-pulse" />
          <span className="text-sm">Generating AI response...</span>
        </motion.div>
      )}
    </div>
  );
};

// Settings Component
const AgentSettings = ({ config, setConfig, metrics, stage }) => {
  return (
    <div className="p-6 space-y-6">
      {/* Metrics */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-4">Performance Metrics</h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gray-700/50 rounded-lg p-3">
            <div className="text-2xl font-bold text-white">{metrics.emailsSent}</div>
            <div className="text-xs text-gray-400">Emails Sent</div>
          </div>
          <div className="bg-gray-700/50 rounded-lg p-3">
            <div className="text-2xl font-bold text-white">{metrics.emailsReceived}</div>
            <div className="text-xs text-gray-400">Responses</div>
          </div>
          <div className="bg-gray-700/50 rounded-lg p-3">
            <div className="text-2xl font-bold text-white">{metrics.currentRound}</div>
            <div className="text-xs text-gray-400">Rounds</div>
          </div>
          <div className="bg-gray-700/50 rounded-lg p-3">
            <div className="text-2xl font-bold text-purple-400">{metrics.matchScore}%</div>
            <div className="text-xs text-gray-400">Match Score</div>
          </div>
        </div>
      </div>

      {/* Active Settings */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-4">Active Configuration</h3>
        <div className="space-y-3 text-sm">
          <div>
            <label className="text-gray-400">Auto-respond</label>
            <div className="mt-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.autoRespond}
                  onChange={(e) => setConfig(prev => ({ ...prev, autoRespond: e.target.checked }))}
                  className="rounded border-gray-600 text-purple-500"
                  disabled={stage === 'active'}
                />
                <span className="text-gray-300">
                  {config.autoRespond ? 'Enabled' : 'Disabled'}
                </span>
              </label>
            </div>
          </div>

          <div>
            <label className="text-gray-400">Escalation after</label>
            <div className="flex items-center gap-2 mt-1">
              <input
                type="number"
                value={config.escalationThreshold}
                onChange={(e) => setConfig(prev => ({ 
                  ...prev, 
                  escalationThreshold: parseInt(e.target.value) 
                }))}
                className="w-20 px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm"
                disabled={stage === 'active'}
              />
              <span className="text-gray-300">rounds</span>
            </div>
          </div>

          <div>
            <label className="text-gray-400">Response speed</label>
            <select
              value={config.responseSpeed}
              onChange={(e) => setConfig(prev => ({ ...prev, responseSpeed: e.target.value }))}
              className="w-full mt-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm"
              disabled={stage === 'active'}
            >
              <option value="immediate">Immediate</option>
              <option value="normal">Normal (2-5 min)</option>
              <option value="delayed">Delayed (10-30 min)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Notification Settings */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-4">Notifications</h3>
        <div className="space-y-2">
          {[
            { key: 'expert_response', label: 'Expert responds', icon: Mail },
            { key: 'significant_progress', label: 'Significant progress', icon: TrendingUp },
            { key: 'intervention_needed', label: 'Intervention needed', icon: AlertCircle }
          ].map(({ key, label, icon: Icon }) => (
            <label key={key} className="flex items-center gap-3 cursor-pointer p-2 hover:bg-gray-700/50 rounded">
              <input
                type="checkbox"
                checked={config.notifyOn.includes(key)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setConfig(prev => ({
                      ...prev,
                      notifyOn: [...prev.notifyOn, key]
                    }));
                  } else {
                    setConfig(prev => ({
                      ...prev,
                      notifyOn: prev.notifyOn.filter(n => n !== key)
                    }));
                  }
                }}
                className="rounded border-gray-600 text-purple-500"
              />
              <Icon className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-300">{label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      {stage === 'active' && (
        <div className="space-y-2">
          <button className="w-full py-2 px-4 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 rounded-lg transition-colors flex items-center justify-center gap-2">
            <Pause className="w-4 h-4" />
            Pause Agent
          </button>
          <button className="w-full py-2 px-4 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg transition-colors flex items-center justify-center gap-2">
            <Archive className="w-4 h-4" />
            Export Thread
          </button>
        </div>
      )}
    </div>
  );
};

export default AIEmailAgent;