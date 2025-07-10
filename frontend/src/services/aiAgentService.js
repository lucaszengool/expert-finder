// aiAgentService.js - Save in src/services/aiAgentService.js

import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://expert-finder.up.railway.app';

// AI Email Agent API endpoints
export const aiAgentService = {
  // Generate email using AI
  generateEmail: async (params) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/ai-agent/generate-email`, {
        expertInfo: params.expert,
        userRequirements: params.requirements,
        context: params.context,
        tone: params.tone,
        type: params.type // initial, response, follow-up
      });
      
      return response.data;
    } catch (error) {
      console.error('Email generation error:', error);
      throw error;
    }
  },

  // Analyze incoming email
  analyzeEmail: async (email, context) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/ai-agent/analyze-email`, {
        email: email,
        context: context,
        expertInfo: context.expert,
        negotiationHistory: context.history
      });
      
      return response.data;
    } catch (error) {
      console.error('Email analysis error:', error);
      throw error;
    }
  },

  // Send email via backend
  sendEmail: async (emailData) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/ai-agent/send-email`, {
        to: emailData.to,
        cc: emailData.cc,
        subject: emailData.subject,
        body: emailData.body,
        threadId: emailData.threadId,
        metadata: emailData.metadata
      });
      
      return response.data;
    } catch (error) {
      console.error('Email sending error:', error);
      throw error;
    }
  },

  // Create new negotiation session
  createSession: async (sessionData) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/ai-agent/sessions`, {
        expertId: sessionData.expertId,
        userId: sessionData.userId,
        requirements: sessionData.requirements,
        agentConfig: sessionData.agentConfig
      });
      
      return response.data;
    } catch (error) {
      console.error('Session creation error:', error);
      throw error;
    }
  },

  // Get session status
  getSession: async (sessionId) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/ai-agent/sessions/${sessionId}`);
      return response.data;
    } catch (error) {
      console.error('Session fetch error:', error);
      throw error;
    }
  },

  // Update session
  updateSession: async (sessionId, updates) => {
    try {
      const response = await axios.patch(`${API_BASE_URL}/api/ai-agent/sessions/${sessionId}`, updates);
      return response.data;
    } catch (error) {
      console.error('Session update error:', error);
      throw error;
    }
  },

  // Get email thread
  getEmailThread: async (sessionId) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/ai-agent/sessions/${sessionId}/emails`);
      return response.data;
    } catch (error) {
      console.error('Email thread fetch error:', error);
      throw error;
    }
  },

  // Subscribe to email updates (WebSocket)
  subscribeToUpdates: (sessionId, callbacks) => {
    const ws = new WebSocket(`${API_BASE_URL.replace('http', 'ws')}/ws/ai-agent/${sessionId}`);
    
    ws.onopen = () => {
      console.log('Connected to AI agent updates');
      callbacks.onConnect?.();
    };
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      switch (data.type) {
        case 'email_received':
          callbacks.onEmailReceived?.(data.email);
          break;
        case 'email_sent':
          callbacks.onEmailSent?.(data.email);
          break;
        case 'status_update':
          callbacks.onStatusUpdate?.(data.status);
          break;
        case 'intervention_required':
          callbacks.onInterventionRequired?.(data.reason);
          break;
        default:
          callbacks.onMessage?.(data);
      }
    };
    
    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      callbacks.onError?.(error);
    };
    
    ws.onclose = () => {
      callbacks.onDisconnect?.();
    };
    
    return {
      send: (data) => ws.send(JSON.stringify(data)),
      close: () => ws.close()
    };
  }
};

// Email templates for common scenarios
export const emailTemplates = {
  initial: {
    consultation: `
Subject: Consultation Request - {PROJECT_BRIEF}

Dear {EXPERT_NAME},

I hope this email finds you well. I came across your profile and was impressed by your expertise in {EXPERT_SKILLS}.

{PROJECT_DESCRIPTION}

I'm looking for a {DURATION}-minute consultation to discuss:
{OBJECTIVES}

Timeline: {TIMELINE}
Budget: {BUDGET}

Would you be available for a brief discussion? I'm happy to work around your schedule.

Looking forward to your response.

Best regards,
{SIGNATURE}
    `,
    
    collaboration: `
Subject: Potential Collaboration Opportunity

Hi {EXPERT_NAME},

I'm reaching out because I believe there's a great opportunity for us to work together.

{PROJECT_DESCRIPTION}

Your background in {EXPERT_SKILLS} aligns perfectly with what we're looking for.

Would you be interested in discussing this further?

Best,
{SIGNATURE}
    `
  },
  
  response: {
    acceptTerms: `
Thank you for your quick response! Your terms work well for me.

{CONFIRMATION_DETAILS}

Shall we proceed with scheduling?

Best regards,
{SIGNATURE}
    `,
    
    negotiate: `
Thank you for getting back to me. I appreciate your interest in the project.

{NEGOTIATION_POINTS}

Would you be open to discussing these points?

Looking forward to finding a mutually beneficial arrangement.

Best,
{SIGNATURE}
    `,
    
    clarify: `
Thank you for your response. I'd be happy to provide more details:

{CLARIFICATION_DETAILS}

Please let me know if you need any additional information.

Best regards,
{SIGNATURE}
    `
  }
};

// Utility functions for email processing
export const emailUtils = {
  // Extract key information from email
  extractKeyInfo: (emailContent) => {
    const patterns = {
      price: /\$(\d+(?:,\d{3})*(?:\.\d{2})?)/g,
      availability: /(monday|tuesday|wednesday|thursday|friday|saturday|sunday|tomorrow|today|next week)/gi,
      duration: /(\d+)\s*(hours?|minutes?|mins?)/gi,
      questions: /\?/g
    };
    
    const extracted = {
      prices: [],
      dates: [],
      durations: [],
      hasQuestions: false
    };
    
    // Extract prices
    let match;
    while ((match = patterns.price.exec(emailContent)) !== null) {
      extracted.prices.push(parseFloat(match[1].replace(/,/g, '')));
    }
    
    // Extract availability
    while ((match = patterns.availability.exec(emailContent)) !== null) {
      extracted.dates.push(match[0]);
    }
    
    // Extract durations
    while ((match = patterns.duration.exec(emailContent)) !== null) {
      extracted.durations.push({
        value: parseInt(match[1]),
        unit: match[2]
      });
    }
    
    // Check for questions
    extracted.hasQuestions = patterns.questions.test(emailContent);
    
    return extracted;
  },
  
  // Calculate match score based on requirements
  calculateMatchScore: (requirements, proposedTerms) => {
    let score = 50; // Base score
    
    // Price match
    if (proposedTerms.price) {
      if (proposedTerms.price <= requirements.budget.ideal) {
        score += 20;
      } else if (proposedTerms.price <= requirements.budget.max) {
        score += 10;
      } else {
        score -= 10;
      }
    }
    
    // Availability match
    if (proposedTerms.availability) {
      if (requirements.timeline === 'urgent' && proposedTerms.availableSoon) {
        score += 15;
      } else if (requirements.timeline === 'flexible') {
        score += 10;
      }
    }
    
    // Duration match
    if (proposedTerms.duration === requirements.sessionDuration) {
      score += 15;
    }
    
    return Math.max(0, Math.min(100, score));
  },
  
  // Generate email subject
  generateSubject: (type, context) => {
    const subjects = {
      initial: `Consultation Request - ${context.projectBrief}`,
      followUp: `Re: Consultation Request - ${context.projectBrief}`,
      acceptance: `Confirmed - ${context.projectBrief} Consultation`,
      negotiation: `Re: Terms Discussion - ${context.projectBrief}`
    };
    
    return subjects[type] || `Re: ${context.projectBrief}`;
  }
};

export default aiAgentService;