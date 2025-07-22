import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart3, TrendingUp, Users, Mail, MessageSquare,
  Calendar, DollarSign, Clock, CheckCircle, AlertCircle,
  Play, Pause, Settings, Plus
} from 'lucide-react';
import { outreachService } from '../services/outreachApi';
import OutreachCampaignCreator from './OutreachCampaignCreator';

const OutreachDashboard = () => {
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
    }
  };

  const handleCampaignCreated = (campaign) => {
    setCampaigns([campaign, ...campaigns]);
    setSelectedCampaign(campaign);
  };

  const statusColors = {
    draft: 'bg-gray-100 text-gray-700',
    active: 'bg-green-100 text-green-700',
    paused: 'bg-yellow-100 text-yellow-700',
    completed: 'bg-blue-100 text-blue-700'
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">AI Outreach Dashboard</h1>
            <button
              onClick={() => setShowCreator(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              New Campaign
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="grid grid-cols-12 gap-6">
          {/* Campaign List */}
          <div className="col-span-3">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-4 border-b border-gray-200">
                <h2 className="font-semibold text-gray-900">Campaigns</h2>
              </div>
              <div className="divide-y divide-gray-200">
                {campaigns.map((campaign) => (
                  <button
                    key={campaign.id}
                    onClick={() => setSelectedCampaign(campaign)}
                    className={`w-full p-4 text-left hover:bg-gray-50 transition-colors ${
                      selectedCampaign?.id === campaign.id ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium text-gray-900">{campaign.name}</h3>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        statusColors[campaign.status]
                      }`}>
                        {campaign.status}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600">
                      {campaign.total_targets} targets • {campaign.emails_sent} sent
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="col-span-9">
            {selectedCampaign && analytics && (
              <>
                {/* Analytics Cards */}
                <div className="grid grid-cols-4 gap-4 mb-6">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white p-6 rounded-lg shadow-sm border border-gray-200"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <Mail className="w-8 h-8 text-blue-500" />
                      <span className="text-sm text-gray-500">Sent</span>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{analytics.emails_sent}</p>
                    <p className="text-sm text-gray-600">emails</p>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-white p-6 rounded-lg shadow-sm border border-gray-200"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <TrendingUp className="w-8 h-8 text-green-500" />
                      <span className="text-sm text-gray-500">Open Rate</span>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{analytics.open_rate.toFixed(1)}%</p>
                    <p className="text-sm text-gray-600">opened</p>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-white p-6 rounded-lg shadow-sm border border-gray-200"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <MessageSquare className="w-8 h-8 text-purple-500" />
                      <span className="text-sm text-gray-500">Response Rate</span>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{analytics.response_rate.toFixed(1)}%</p>
                    <p className="text-sm text-gray-600">replied</p>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-white p-6 rounded-lg shadow-sm border border-gray-200"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <Calendar className="w-8 h-8 text-orange-500" />
                      <span className="text-sm text-gray-500">Meetings</span>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{analytics.meeting_scheduled_rate.toFixed(1)}%</p>
                    <p className="text-sm text-gray-600">scheduled</p>
                  </motion.div>
                </div>

                {/* Campaign Actions */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold mb-4">Campaign Actions</h3>
                  <div className="flex gap-4">
                    <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2">
                      <Play className="w-4 h-4" />
                      Start Sending
                    </button>
                    <button className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors flex items-center gap-2">
                      <Pause className="w-4 h-4" />
                      Pause Campaign
                    </button>
                    <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2">
                      <Settings className="w-4 h-4" />
                      Settings
                    </button>
                  </div>
                </div>
              </>
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