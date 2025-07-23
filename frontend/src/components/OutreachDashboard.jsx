import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart3, TrendingUp, Users, Mail, MessageSquare,
  Calendar, DollarSign, Clock, CheckCircle, AlertCircle,
  Play, Pause, Settings, Plus, Bot, Target, Send,
  FileText, Sparkles, X
} from 'lucide-react';
import { outreachService } from '../services/outreachApi';
import OutreachCampaignCreator from './OutreachCampaignCreator';

const OutreachDashboard = ({ onClose }) => {
  const [campaigns, setCampaigns] = useState([]);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [showCreator, setShowCreator] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCampaigns();
  }, []);

  useEffect(() => {
    if (selectedCampaign) {
      loadAnalytics(selectedCampaign.id);
    }
  }, [selectedCampaign]);

  const loadCampaigns = async () => {
    try {
      const data = await outreachService.getCampaigns();
      setCampaigns(data);
      if (data.length > 0 && !selectedCampaign) {
        setSelectedCampaign(data[0]);
      }
    } catch (error) {
      console.error('Failed to load campaigns:', error);
      // Set mock data for demo
      const mockCampaigns = [
        {
          id: '1',
          name: 'AI Experts Outreach Q1 2024',
          status: 'active',
          total_targets: 150,
          emails_sent: 89,
          emails_opened: 67,
          emails_replied: 23,
          target_type: 'expert',
          created_at: new Date().toISOString()
        },
        {
          id: '2',
          name: 'SaaS Client Acquisition',
          status: 'draft',
          total_targets: 200,
          emails_sent: 0,
          emails_opened: 0,
          emails_replied: 0,
          target_type: 'client',
          created_at: new Date().toISOString()
        }
      ];
      setCampaigns(mockCampaigns);
      setSelectedCampaign(mockCampaigns[0]);
    } finally {
      setLoading(false);
    }
  };

  const loadAnalytics = async (campaignId) => {
    try {
      const data = await outreachService.getCampaignAnalytics(campaignId);
      setAnalytics(data);
    } catch (error) {
      console.error('Failed to load analytics:', error);
      // Set mock analytics for demo
      setAnalytics({
        campaign_id: campaignId,
        total_targets: 150,
        emails_sent: 89,
        open_rate: 75.3,
        response_rate: 25.8,
        meeting_scheduled_rate: 12.4,
        closed_won_rate: 3.2,
        average_deal_size: 5000
      });
    }
  };

  const handleCampaignCreated = (campaign) => {
    setCampaigns([campaign, ...campaigns]);
    setSelectedCampaign(campaign);
    setShowCreator(false);
  };

  const statusColors = {
    draft: 'bg-gray-100 text-gray-700',
    active: 'bg-green-100 text-green-700',
    paused: 'bg-yellow-100 text-yellow-700',
    completed: 'bg-blue-100 text-blue-700'
  };

  const statusIcons = {
    draft: FileText,
    active: Play,
    paused: Pause,
    completed: CheckCircle
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Bot className="w-6 h-6 text-purple-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">AI Outreach Dashboard</h1>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowCreator(true)}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2 shadow-sm"
              >
                <Plus className="w-4 h-4" />
                New Campaign
              </button>
              {onClose && (
                <button
                  onClick={onClose}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="grid grid-cols-12 gap-6">
          {/* Campaign List */}
          <div className="col-span-12 lg:col-span-3">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-4 border-b border-gray-200">
                <h2 className="font-semibold text-gray-900">Campaigns</h2>
              </div>
              <div className="divide-y divide-gray-200 max-h-[600px] overflow-y-auto">
                {loading ? (
                  <div className="p-8 text-center text-gray-500">
                    Loading campaigns...
                  </div>
                ) : campaigns.length === 0 ? (
                  <div className="p-8 text-center">
                    <Bot className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 mb-4">No campaigns yet</p>
                    <button
                      onClick={() => setShowCreator(true)}
                      className="text-purple-600 hover:text-purple-700 text-sm font-medium"
                    >
                      Create your first campaign
                    </button>
                  </div>
                ) : (
                  campaigns.map((campaign) => {
                    const StatusIcon = statusIcons[campaign.status] || FileText;
                    return (
                      <button
                        key={campaign.id}
                        onClick={() => setSelectedCampaign(campaign)}
                        className={`w-full p-4 text-left hover:bg-gray-50 transition-colors ${
                          selectedCampaign?.id === campaign.id ? 'bg-purple-50 border-l-4 border-purple-600' : ''
                        }`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <h3 className="font-medium text-gray-900 line-clamp-1">
                              {campaign.name}
                            </h3>
                            <div className="flex items-center gap-2 mt-1">
                              <StatusIcon className="w-3 h-3" />
                              <span className={`text-xs px-2 py-0.5 rounded-full ${
                                statusColors[campaign.status]
                              }`}>
                                {campaign.status}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="text-sm text-gray-600">
                          <div className="flex items-center justify-between">
                            <span>{campaign.total_targets} targets</span>
                            <span className="text-green-600 font-medium">
                              {campaign.emails_sent} sent
                            </span>
                          </div>
                          {campaign.emails_replied > 0 && (
                            <div className="mt-1 text-xs text-purple-600">
                              {campaign.emails_replied} replies
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="col-span-12 lg:col-span-9">
            {selectedCampaign && analytics ? (
              <>
                {/* Campaign Header */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">
                        {selectedCampaign.name}
                      </h2>
                      <p className="text-sm text-gray-500 mt-1">
                        Created {new Date(selectedCampaign.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-3 py-1.5 rounded-full text-sm font-medium ${
                        statusColors[selectedCampaign.status]
                      }`}>
                        {selectedCampaign.status.charAt(0).toUpperCase() + selectedCampaign.status.slice(1)}
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-3">
                    {selectedCampaign.status === 'draft' && (
                      <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 shadow-sm">
                        <Play className="w-4 h-4" />
                        Start Campaign
                      </button>
                    )}
                    {selectedCampaign.status === 'active' && (
                      <button className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors flex items-center gap-2 shadow-sm">
                        <Pause className="w-4 h-4" />
                        Pause Campaign
                      </button>
                    )}
                    {selectedCampaign.status === 'paused' && (
                      <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 shadow-sm">
                        <Play className="w-4 h-4" />
                        Resume Campaign
                      </button>
                    )}
                    <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2">
                      <Settings className="w-4 h-4" />
                      Settings
                    </button>
                  </div>
                </div>

                {/* Analytics Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white p-6 rounded-xl shadow-sm border border-gray-200"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Mail className="w-6 h-6 text-blue-600" />
                      </div>
                      <span className="text-sm text-gray-500">Sent</span>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{analytics.emails_sent}</p>
                    <p className="text-sm text-gray-600 mt-1">emails sent</p>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-white p-6 rounded-xl shadow-sm border border-gray-200"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <TrendingUp className="w-6 h-6 text-green-600" />
                      </div>
                      <span className="text-sm text-gray-500">Open Rate</span>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{analytics.open_rate.toFixed(1)}%</p>
                    <p className="text-sm text-gray-600 mt-1">emails opened</p>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-white p-6 rounded-xl shadow-sm border border-gray-200"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <MessageSquare className="w-6 h-6 text-purple-600" />
                      </div>
                      <span className="text-sm text-gray-500">Response Rate</span>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{analytics.response_rate.toFixed(1)}%</p>
                    <p className="text-sm text-gray-600 mt-1">got replies</p>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-white p-6 rounded-xl shadow-sm border border-gray-200"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="p-2 bg-orange-100 rounded-lg">
                        <Calendar className="w-6 h-6 text-orange-600" />
                      </div>
                      <span className="text-sm text-gray-500">Meetings</span>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{analytics.meeting_scheduled_rate.toFixed(1)}%</p>
                    <p className="text-sm text-gray-600 mt-1">meetings booked</p>
                  </motion.div>
                </div>

                {/* Additional Stats */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold mb-4">Campaign Performance</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Total Targets</span>
                      <span className="font-medium text-gray-900">{analytics.total_targets}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Emails Sent</span>
                      <span className="font-medium text-gray-900">{analytics.emails_sent}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Average Deal Size</span>
                      <span className="font-medium text-gray-900">
                        ${analytics.average_deal_size.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Conversion Rate</span>
                      <span className="font-medium text-green-600">
                        {analytics.closed_won_rate.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                <Bot className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {campaigns.length === 0 ? 'Create Your First Campaign' : 'Select a Campaign'}
                </h3>
                <p className="text-gray-500 mb-6">
                  {campaigns.length === 0 
                    ? "Start by creating an AI-powered outreach campaign to find and connect with your ideal targets."
                    : "Choose a campaign from the list to view its performance and manage settings."
                  }
                </p>
                {campaigns.length === 0 && (
                  <button
                    onClick={() => setShowCreator(true)}
                    className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors inline-flex items-center gap-2"
                  >
                    <Plus className="w-5 h-5" />
                    Create Campaign
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Campaign Creator Modal */}
      {showCreator && (
        <OutreachCampaignCreator
          onClose={() => setShowCreator(false)}
          onCampaignCreated={handleCampaignCreated}
        />
      )}
    </div>
  );
};

export default OutreachDashboard;