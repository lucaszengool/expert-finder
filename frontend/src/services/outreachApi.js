import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://expert-finder.up.railway.app';

// Create axios instance for outreach API
const outreachApi = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Add interceptors for debugging
outreachApi.interceptors.request.use(
  (config) => {
    console.log(`Outreach API: ${config.method.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('Outreach request error:', error);
    return Promise.reject(error);
  }
);

outreachApi.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('Outreach response error:', error);
    return Promise.reject(error);
  }
);

// Enhanced outreach service with multi-channel support
export const outreachService = {
  // Search for any type of target
  async searchTargets(query, targetType = 'all', filters = {}) {
    try {
      const response = await outreachApi.post('/api/outreach/search-targets', {
        query,
        target_type: targetType,
        ...filters
      });
      return response.data;
    } catch (error) {
      console.error('Target search error:', error);
      throw error;
    }
  },

  // Create outreach campaign
  async createCampaign(campaignData, searchParams) {
    try {
      const response = await outreachApi.post('/api/outreach/v2/campaigns', {
        ...campaignData,
        search_criteria: searchParams,
        id: null,
        user_id: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
      return response.data;
    } catch (error) {
      console.error('Campaign creation error:', error);
      throw error;
    }
  },

  // Get campaign list
  async getCampaigns(filters = {}) {
    try {
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      if (filters.goal) params.append('goal', filters.goal);
      if (filters.channel) params.append('channel', filters.channel);
      
      const response = await outreachApi.get(`/api/outreach/v2/campaigns?${params}`);
      return response.data;
    } catch (error) {
      console.error('Get campaigns error:', error);
      return [];
    }
  },

  // Get campaign details
  async getCampaignDetails(campaignId) {
    try {
      const response = await outreachApi.get(`/api/outreach/v2/campaigns/${campaignId}`);
      return response.data;
    } catch (error) {
      console.error('Get campaign details error:', error);
      throw error;
    }
  },

  // Update campaign status
  async updateCampaignStatus(campaignId, status) {
    try {
      const response = await outreachApi.put(`/api/outreach/v2/campaigns/${campaignId}/status`, {
        status
      });
      return response.data;
    } catch (error) {
      console.error('Update campaign status error:', error);
      throw error;
    }
  },

  // Discover targets
  async discoverTargets(campaignId, searchCriteria, limit = 100) {
    try {
      const response = await outreachApi.post(
        `/api/outreach/v2/campaigns/${campaignId}/targets/discover?limit=${limit}`,
        searchCriteria
      );
      return response.data;
    } catch (error) {
      console.error('Target discovery error:', error);
      throw error;
    }
  },

  // Get campaign targets
  async getCampaignTargets(campaignId, filters = {}) {
    try {
      const params = new URLSearchParams();
      if (filters.stage) params.append('stage', filters.stage);
      if (filters.channel) params.append('channel', filters.channel);
      if (filters.offset) params.append('offset', filters.offset);
      if (filters.limit) params.append('limit', filters.limit);
      
      const response = await outreachApi.get(
        `/api/outreach/v2/campaigns/${campaignId}/targets?${params}`
      );
      return response.data;
    } catch (error) {
      console.error('Get targets error:', error);
      return { targets: [], total: 0 };
    }
  },

  // Send messages
  async sendMessages(campaignId, messageConfig) {
    try {
      const response = await outreachApi.post(
        `/api/outreach/v2/campaigns/${campaignId}/messages/send`,
        messageConfig
      );
      return response.data;
    } catch (error) {
      console.error('Send messages error:', error);
      throw error;
    }
  },

  // Get campaign messages
  async getCampaignMessages(campaignId, filters = {}) {
    try {
      const params = new URLSearchParams();
      if (filters.target_id) params.append('target_id', filters.target_id);
      if (filters.channel) params.append('channel', filters.channel);
      if (filters.status) params.append('status', filters.status);
      if (filters.offset) params.append('offset', filters.offset);
      if (filters.limit) params.append('limit', filters.limit);
      
      const response = await outreachApi.get(
        `/api/outreach/v2/campaigns/${campaignId}/messages?${params}`
      );
      return response.data;
    } catch (error) {
      console.error('Get messages error:', error);
      return { messages: [], total: 0 };
    }
  },

  // Configure AI agent
  async configureAIAgent(campaignId, agentConfig) {
    try {
      const response = await outreachApi.post(
        `/api/outreach/v2/campaigns/${campaignId}/ai-agent/configure`,
        agentConfig
      );
      return response.data;
    } catch (error) {
      console.error('Configure AI agent error:', error);
      throw error;
    }
  },

  // Get campaign analytics
  async getCampaignAnalytics(campaignId, dateRange = {}) {
    try {
      const params = new URLSearchParams();
      if (dateRange.from) params.append('date_from', dateRange.from);
      if (dateRange.to) params.append('date_to', dateRange.to);
      
      const response = await outreachApi.get(
        `/api/outreach/v2/campaigns/${campaignId}/analytics?${params}`
      );
      return response.data;
    } catch (error) {
      console.error('Get analytics error:', error);
      return null;
    }
  },

  // Connect channel
  async connectChannel(channel, credentials) {
    try {
      const response = await outreachApi.post(`/api/outreach/v2/channels/${channel}/connect`, credentials);
      return response.data;
    } catch (error) {
      console.error('Connect channel error:', error);
      throw error;
    }
  },

  // Get connected channels
  async getConnectedChannels() {
    try {
      const response = await outreachApi.get('/api/outreach/v2/channels');
      return response.data;
    } catch (error) {
      console.error('Get connected channels error:', error);
      return [];
    }
  },

  // Get templates
  async getTemplates(filters = {}) {
    try {
      const params = new URLSearchParams();
      if (filters.channel) params.append('channel', filters.channel);
      if (filters.goal) params.append('goal', filters.goal);
      if (filters.stage) params.append('stage', filters.stage);
      
      const response = await outreachApi.get(`/api/outreach/v2/templates?${params}`);
      return response.data;
    } catch (error) {
      console.error('Get templates error:', error);
      return [];
    }
  },

  // Create template
  async createTemplate(templateData) {
    try {
      const response = await outreachApi.post('/api/outreach/v2/templates', templateData);
      return response.data;
    } catch (error) {
      console.error('Create template error:', error);
      throw error;
    }
  },

  // Learn from email examples (legacy support)
  async learnFromEmails(emailExamples) {
    try {
      const response = await outreachApi.post('/api/outreach/email-templates/learn', emailExamples);
      return response.data;
    } catch (error) {
      console.error('Email learning error:', error);
      throw error;
    }
  }
};

// Export individual functions for easier imports
export const {
  searchTargets,
  createCampaign,
  getCampaigns,
  getCampaignDetails,
  updateCampaignStatus,
  discoverTargets,
  getCampaignTargets,
  sendMessages,
  getCampaignMessages,
  configureAIAgent,
  getCampaignAnalytics,
  connectChannel,
  getConnectedChannels,
  getTemplates,
  createTemplate
} = outreachService;