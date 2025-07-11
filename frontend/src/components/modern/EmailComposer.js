// EmailComposer.js - Save in src/components/modern/EmailComposer.js

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Mail, Send, Sparkles, Edit, Copy, RefreshCw, 
  ChevronDown, ChevronUp, X, Check, AlertCircle,
  Loader2, Wand2, FileText, Clock, User
} from 'lucide-react';

const EmailComposer = ({ expert, requirements, onClose, onSend }) => {
  const [emailContent, setEmailContent] = useState({
    to: expert.email || '',
    subject: '',
    body: ''
  });
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [showAiPrompt, setShowAiPrompt] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [errors, setErrors] = useState({});

  // Generate initial email on mount
  useEffect(() => {
    generateInitialEmail();
  }, []);

  const generateInitialEmail = async () => {
    setIsGenerating(true);
    
    // Simulate AI generation - in production, this would call your AI API
    setTimeout(() => {
      const subject = `Consultation Request - ${requirements.projectDetails.substring(0, 50)}${requirements.projectDetails.length > 50 ? '...' : ''}`;
      
      const body = `Dear ${expert.name},

I hope this email finds you well. I came across your profile and was impressed by your expertise in ${expert.skills.slice(0, 2).join(' and ')}.

I'm currently working on ${requirements.projectDetails} and believe your insights would be invaluable to our project.

Specifically, I'm looking for guidance on:
${requirements.objectives.map((obj, i) => `${i + 1}. ${obj}`).join('\n')}

Project Details:
- Duration: ${requirements.sessionDuration} minute consultation
- Timeline: ${requirements.timeline === 'urgent' ? 'As soon as possible' : requirements.timeline === 'soon' ? 'Within the next week' : 'Flexible based on your availability'}
- Budget: $${requirements.budget.ideal}/hour

Would you be available for a consultation? I'm happy to work around your schedule and can meet via ${expert.consultation_types?.includes('video') ? 'video call' : 'your preferred method'}.

Looking forward to hearing from you.

Best regards,
${requirements.userInfo?.name || 'Your Name'}
${requirements.userInfo?.title ? `\n${requirements.userInfo.title}` : ''}
${requirements.userInfo?.company ? `\n${requirements.userInfo.company}` : ''}`;

      setEmailContent({
        to: expert.email || '',
        subject,
        body
      });
      
      setIsGenerating(false);
      setEditMode(true);
    }, 2000);
  };

  const regenerateWithPrompt = async () => {
    if (!aiPrompt.trim()) return;
    
    setIsGenerating(true);
    
    try {
      // Call real AI API - replace with your actual API endpoint
      const response = await fetch('/api/ai/modify-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          originalEmail: emailContent.body,
          prompt: aiPrompt,
          context: {
            expertName: expert.name,
            expertSkills: expert.skills,
            requirements: requirements
          }
        })
      });

      if (response.ok) {
        const data = await response.json();
        setEmailContent(prev => ({ ...prev, body: data.modifiedEmail }));
      } else {
        // Fallback to frontend modification if API fails
        let modifiedBody = emailContent.body;
        const promptLower = aiPrompt.toLowerCase();
        
        if (promptLower.includes('shorter') || promptLower.includes('concise')) {
          // Make it shorter - keep only essential parts
          const lines = modifiedBody.split('\n');
          const essential = [
            lines[0], // Greeting
            lines.find(l => l.includes('working on')) || lines[2],
            'I would appreciate your expertise on this project.',
            lines.find(l => l.includes('Duration:')) || `Duration: ${requirements.sessionDuration} minutes`,
            lines.find(l => l.includes('Budget:')) || `Budget: ${requirements.budget.ideal}/hour`,
            'Would you be available for a consultation?',
            lines[lines.length - 2], // Sign off
            lines[lines.length - 1] // Name
          ];
          modifiedBody = essential.filter(Boolean).join('\n\n');
        } 
        else if (promptLower.includes('formal') || promptLower.includes('professional')) {
          modifiedBody = modifiedBody
            .replace(/Hi |Hello /g, 'Dear ')
            .replace(/I'm /g, 'I am ')
            .replace(/I'd /g, 'I would ')
            .replace(/thanks/gi, 'thank you')
            .replace(/Looking forward to/g, 'I look forward to')
            .replace(/Best regards/g, 'Sincerely');
        } 
        else if (promptLower.includes('casual') || promptLower.includes('friendly')) {
          const firstName = expert.name.split(' ')[0];
          modifiedBody = `Hi ${firstName}!\n\n` + 
            modifiedBody
              .substring(modifiedBody.indexOf('\n') + 1)
              .replace(/I hope this email finds you well./g, '')
              .replace(/Dear /g, 'Hi ')
              .replace(/Sincerely|Best regards/g, 'Thanks!')
              .replace(/I would /g, "I'd ")
              .replace(/I am /g, "I'm ");
        }
        else if (promptLower.includes('urgent') || promptLower.includes('urgency')) {
          const urgentIntro = `Dear ${expert.name},\n\nI have an urgent project that requires immediate AI/ML expertise, and your background makes you the ideal consultant for this.\n\n`;
          modifiedBody = urgentIntro + modifiedBody.substring(modifiedBody.indexOf('\n\n') + 2);
          modifiedBody = modifiedBody.replace(/Timeline: [^\n]+/, 'Timeline: URGENT - Need to start ASAP');
        }
        else if (promptLower.includes('detail') || promptLower.includes('specific')) {
          const detailsIndex = modifiedBody.indexOf('Specifically');
          if (detailsIndex > -1) {
            const beforeDetails = modifiedBody.substring(0, detailsIndex);
            const afterDetails = modifiedBody.substring(modifiedBody.indexOf('Project Details:'));
            const expandedDetails = `Specifically, I'm looking for guidance on:
${requirements.objectives.map((obj, i) => `${i + 1}. ${obj}`).join('\n')}

Additional context about the project:
- Current stage: Planning/Implementation
- Team size: ${Math.floor(Math.random() * 10) + 2} engineers
- Expected timeline: ${requirements.timeline === 'urgent' ? '1-2 weeks' : '1-3 months'}
- Key challenges: Model selection, scalability, and deployment strategy

`;
            modifiedBody = beforeDetails + expandedDetails + afterDetails;
          }
        }
        else {
          // Generic modification based on prompt
          modifiedBody = `${emailContent.body}\n\nP.S. ${aiPrompt}`;
        }
        
        setEmailContent(prev => ({ ...prev, body: modifiedBody }));
      }
    } catch (error) {
      console.error('AI modification error:', error);
      // Use fallback modification
    } finally {
      setIsGenerating(false);
      setAiPrompt('');
      setShowAiPrompt(false);
    }
  };

  const validateEmail = () => {
    const newErrors = {};
    
    if (!emailContent.to) {
      newErrors.to = 'Recipient email is required';
    } else if (!/\S+@\S+\.\S+/.test(emailContent.to)) {
      newErrors.to = 'Invalid email address';
    }
    
    if (!emailContent.subject.trim()) {
      newErrors.subject = 'Subject is required';
    }
    
    if (!emailContent.body.trim()) {
      newErrors.body = 'Email body is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSend = () => {
    if (!validateEmail()) return;
    
    // Open in default email client
    const mailtoLink = `mailto:${emailContent.to}?subject=${encodeURIComponent(emailContent.subject)}&body=${encodeURIComponent(emailContent.body)}`;
    window.location.href = mailtoLink;
    
    // Also save to backend
    onSend?.(emailContent);
    
    // Show success message
    setTimeout(() => {
      onClose();
    }, 1000);
  };

  const copyToClipboard = () => {
    const fullEmail = `To: ${emailContent.to}\nSubject: ${emailContent.subject}\n\n${emailContent.body}`;
    navigator.clipboard.writeText(fullEmail);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 overflow-hidden flex items-center justify-center p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-gray-900 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="bg-gray-800 px-6 py-4 border-b border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Mail className="w-6 h-6 text-purple-400" />
              <h2 className="text-xl font-semibold text-white">Compose Email to {expert.name}</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {isGenerating ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Sparkles className="w-12 h-12 text-purple-400 animate-pulse mb-4" />
              <p className="text-gray-300">AI is crafting your email...</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* To Field */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  To
                </label>
                <input
                  type="email"
                  value={emailContent.to}
                  onChange={(e) => setEmailContent(prev => ({ ...prev, to: e.target.value }))}
                  className={`w-full px-4 py-2 bg-gray-800 border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 ${
                    errors.to ? 'border-red-500' : 'border-gray-700'
                  }`}
                  placeholder="expert@email.com"
                />
                {errors.to && (
                  <p className="mt-1 text-sm text-red-400">{errors.to}</p>
                )}
              </div>

              {/* Subject */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Subject
                </label>
                <input
                  type="text"
                  value={emailContent.subject}
                  onChange={(e) => setEmailContent(prev => ({ ...prev, subject: e.target.value }))}
                  className={`w-full px-4 py-2 bg-gray-800 border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 ${
                    errors.subject ? 'border-red-500' : 'border-gray-700'
                  }`}
                  placeholder="Consultation Request"
                />
                {errors.subject && (
                  <p className="mt-1 text-sm text-red-400">{errors.subject}</p>
                )}
              </div>

              {/* Body */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-300">
                    Message
                  </label>
                  <div className="flex items-center gap-2">
                    {editMode && (
                      <span className="text-xs text-green-400 flex items-center gap-1">
                        <Check className="w-3 h-3" />
                        AI Generated
                      </span>
                    )}
                  </div>
                </div>
                <textarea
                  value={emailContent.body}
                  onChange={(e) => setEmailContent(prev => ({ ...prev, body: e.target.value }))}
                  className={`w-full px-4 py-3 bg-gray-800 border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 resize-none ${
                    errors.body ? 'border-red-500' : 'border-gray-700'
                  }`}
                  rows={15}
                  placeholder="Your message..."
                />
                {errors.body && (
                  <p className="mt-1 text-sm text-red-400">{errors.body}</p>
                )}
              </div>

              {/* AI Modification */}
              <div className="bg-gray-800 rounded-lg p-4">
                <button
                  onClick={() => setShowAiPrompt(!showAiPrompt)}
                  className="w-full flex items-center justify-between text-left"
                >
                  <div className="flex items-center gap-2">
                    <Wand2 className="w-5 h-5 text-purple-400" />
                    <span className="text-white font-medium">Modify with AI</span>
                  </div>
                  {showAiPrompt ? (
                    <ChevronUp className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  )}
                </button>
                
                <AnimatePresence>
                  {showAiPrompt && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="mt-4"
                    >
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={aiPrompt}
                          onChange={(e) => setAiPrompt(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && regenerateWithPrompt()}
                          placeholder="e.g., Make it shorter, more formal, add urgency..."
                          className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 text-sm focus:outline-none focus:border-purple-500"
                        />
                        <button
                          onClick={regenerateWithPrompt}
                          disabled={!aiPrompt.trim()}
                          className="px-4 py-2 bg-purple-500 hover:bg-purple-600 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded-lg transition-colors flex items-center gap-2"
                        >
                          <RefreshCw className="w-4 h-4" />
                          Apply
                        </button>
                      </div>
                      
                      {/* Quick prompts */}
                      <div className="flex flex-wrap gap-2 mt-3">
                        {['Make it shorter', 'More professional', 'Add urgency', 'More casual', 'Add more details'].map((prompt) => (
                          <button
                            key={prompt}
                            onClick={() => setAiPrompt(prompt)}
                            className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-gray-300 text-sm rounded-full transition-colors"
                          >
                            {prompt}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-800 px-6 py-4 border-t border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={copyToClipboard}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg transition-colors flex items-center gap-2"
              >
                <Copy className="w-4 h-4" />
                Copy
              </button>
              <button
                onClick={generateInitialEmail}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg transition-colors flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Regenerate
              </button>
            </div>
            
            <button
              onClick={handleSend}
              disabled={isGenerating}
              className="px-6 py-2 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 disabled:from-gray-600 disabled:to-gray-700 text-white font-medium rounded-lg transition-all flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
              Send Email
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default EmailComposer;