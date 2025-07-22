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
      const response = await outreachApi.post('/api/outreach/campaigns', {
        ...campaignData,
        ...searchParams
      });
      return response.data;
    } catch (error) {
      console.error('Campaign creation error:', error);
      throw error;
    }
  },

  // Learn from email examples
  async learnFromEmails(emailExamples) {
    try {
      const response = await outreachApi.post('/api/outreach/email-templates/learn', emailExamples);
      return response.data;
    } catch (error) {
      console.error('Email learning error:', error);
      throw error;
    }
  },

  // Get email templates
  async getTemplates(category = null) {
    try {
      const params = category ? { category } : {};
      const response = await outreachApi.get('/api/outreach/email-templates', { params });
      return response.data;
    } catch (error) {
      console.error('Get templates error:', error);
      throw error;
    }
  },

  // Get campaign list
  async getCampaigns(status = null) {
    try {
      const params = status ? { status } : {};
      const response = await outreachApi.get('/api/outreach/campaigns', { params });
      return response.data;
    } catch (error) {
      console.error('Get campaigns error:', error);
      throw error;
    }
  },

  // Get campaign details
  async getCampaignDetails(campaignId) {
    try {
      const response = await outreachApi.get(`/api/outreach/campaigns/${campaignId}`);
      return response.data;
    } catch (error) {
      console.error('Get campaign details error:', error);
      throw error;
    }
  },

  // Get campaign targets
  async getCampaignTargets(campaignId, status = null) {
    try {
      const params = status ? { status } : {};
      const response = await outreachApi.get(`/api/outreach/campaigns/${campaignId}/targets`, { params });
      return response.data;
    } catch (error) {
      console.error('Get targets error:', error);
      throw error;
    }
  },

  // Send bulk outreach
  async sendBulkOutreach(campaignId, targetIds, options = {}) {
    try {
      const response = await outreachApi.post(`/api/outreach/campaigns/${campaignId}/send-bulk`, {
        target_ids: targetIds,
        template_id: options.templateId,
        personalization_level: options.personalizationLevel || 'high',
        delay_between_emails: options.delaySeconds || 2
      });
      return response.data;
    } catch (error) {
      console.error('Send bulk outreach error:', error);
      throw error;
    }
  },

  // Send single outreach
  async sendSingleOutreach(campaignId, targetId, options = {}) {
    try {
      const response = await outreachApi.post(
        `/api/outreach/campaigns/${campaignId}/targets/${targetId}/send`,
        {
          template_id: options.templateId,
          personalization_level: options.personalizationLevel || 'high'
        }
      );
      return response.data;
    } catch (error) {
      console.error('Send single outreach error:', error);
      throw error;
    }
  },

  // Get campaign analytics
  async getCampaignAnalytics(campaignId) {
    try {
      const response = await outreachApi.get(`/api/outreach/campaigns/${campaignId}/analytics`);
      return response.data;
    } catch (error) {
      console.error('Get analytics error:', error);
      throw error;
    }
  },

  // Process email response
  async processEmailResponse(emailId, responseContent) {
    try {
      const response = await outreachApi.post(`/api/outreach/emails/${emailId}/response`, {
        response_content: responseContent
      });
      return response.data;
    } catch (error) {
      console.error('Process response error:', error);
      throw error;
    }
  },

  // Get follow-up suggestions
  async getFollowUpSuggestions(campaignId, targetId) {
    try {
      const response = await outreachApi.get(
        `/api/outreach/follow-up-suggestions/${campaignId}/${targetId}`
      );
      return response.data;
    } catch (error) {
      console.error('Get follow-up suggestions error:', error);
      throw error;
    }
  }
};