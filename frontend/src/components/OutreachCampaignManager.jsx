import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send, Users, MessageSquare, Instagram, Twitter, Mail, Phone,
  BarChart3, Target, Zap, Bot, Calendar, Settings, Play, Pause,
  Plus, Filter, Download, Globe, Shield, ChevronRight, CheckCircle,
  AlertCircle, Clock, TrendingUp, Brain, Sparkles, Link, Edit,
  Trash2, Copy, Eye, ArrowUpRight, Activity
} from 'lucide-react';
import { searchExpertsEnhanced } from '../services/api';
import { createCampaign, getCampaigns, sendMessages, getCampaignAnalytics } from '../services/outreachApi';

// Channel icons mapping
const channelIcons = {
  email: Mail,
  instagram: Instagram,
  twitter: Twitter,
  whatsapp: Phone,
  linkedin: Globe
};

// Campaign status colors
const statusColors = {
  draft: 'bg-gray-100 text-gray-800',
  active: 'bg-green-100 text-green-800',
  paused: 'bg-yellow-100 text-yellow-800',
  completed: 'bg-blue-100 text-blue-800'
};

export default function OutreachCampaignManager() {
  const [campaigns, setCampaigns] = useState([]);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(false);
  const [analytics, setAnalytics] = useState(null);

  useEffect(() => {
    loadCampaigns();
  }, []);

  const loadCampaigns = async () => {
    try {
      const data = await getCampaigns();
      setCampaigns(data);
    } catch (error) {
      console.error('Error loading campaigns:', error);
    }
  };

  const loadCampaignAnalytics = async (campaignId) => {
    try {
      const data = await getCampaignAnalytics(campaignId);
      setAnalytics(data);
    } catch (error) {
      console.error('Error loading analytics:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <Target className="w-8 h-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">AI Outreach Hub</h1>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              New Campaign
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Campaign Grid */}
        {!selectedCampaign && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {campaigns.map((campaign) => (
              <CampaignCard
                key={campaign.id}
                campaign={campaign}
                onClick={() => {
                  setSelectedCampaign(campaign);
                  loadCampaignAnalytics(campaign.id);
                }}
              />
            ))}
            
            {/* Create New Campaign Card */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowCreateModal(true)}
              className="bg-white rounded-xl border-2 border-dashed border-gray-300 p-6 cursor-pointer hover:border-blue-500 transition-colors min-h-[280px] flex flex-col items-center justify-center"
            >
              <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4">
                <Plus className="w-8 h-8 text-blue-600" />
              </div>
              <p className="text-gray-600 font-medium">Create New Campaign</p>
              <p className="text-sm text-gray-500 mt-2 text-center">
                Launch multi-channel outreach with AI automation
              </p>
            </motion.div>
          </div>
        )}

        {/* Campaign Details View */}
        {selectedCampaign && (
          <CampaignDetailsView
            campaign={selectedCampaign}
            analytics={analytics}
            onBack={() => {
              setSelectedCampaign(null);
              setAnalytics(null);
            }}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
          />
        )}
      </div>

      {/* Create Campaign Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <CreateCampaignModal
            onClose={() => setShowCreateModal(false)}
            onSuccess={(newCampaign) => {
              setCampaigns([newCampaign, ...campaigns]);
              setShowCreateModal(false);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// Campaign Card Component
function CampaignCard({ campaign, onClick }) {
  const getStatusIcon = () => {
    switch (campaign.status) {
      case 'active': return <Play className="w-4 h-4" />;
      case 'paused': return <Pause className="w-4 h-4" />;
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 cursor-pointer hover:shadow-md transition-all"
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-semibold text-gray-900">{campaign.name}</h3>
          <p className="text-sm text-gray-500 mt-1">{campaign.description}</p>
        </div>
        <span className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${statusColors[campaign.status]}`}>
          {getStatusIcon()}
          {campaign.status}
        </span>
      </div>

      {/* Channels */}
      <div className="flex items-center gap-2 mb-4">
        {campaign.channels.map(channel => {
          const Icon = channelIcons[channel];
          return (
            <div key={channel} className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
              <Icon className="w-4 h-4 text-gray-600" />
            </div>
          );
        })}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div>
          <p className="text-sm text-gray-500">Targets</p>
          <p className="text-lg font-semibold text-gray-900">{campaign.metrics?.total_targets || 0}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Sent</p>
          <p className="text-lg font-semibold text-gray-900">{campaign.metrics?.messages_sent || 0}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Replies</p>
          <p className="text-lg font-semibold text-green-600">{campaign.metrics?.replies || 0}</p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mt-4">
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all"
            style={{ width: `${(campaign.metrics?.messages_sent / campaign.metrics?.total_targets * 100) || 0}%` }}
          />
        </div>
      </div>
    </motion.div>
  );
}

// Campaign Details View Component
function CampaignDetailsView({ campaign, analytics, onBack, activeTab, setActiveTab }) {
  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'targets', label: 'Targets', icon: Users },
    { id: 'messages', label: 'Messages', icon: MessageSquare },
    { id: 'ai-agent', label: 'AI Agent', icon: Bot },
    { id: 'analytics', label: 'Analytics', icon: Activity },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  return (
    <div>
      {/* Back Button */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
      >
        <ChevronRight className="w-5 h-5 rotate-180" />
        Back to campaigns
      </button>

      {/* Campaign Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{campaign.name}</h2>
            <p className="text-gray-600 mt-2">{campaign.description}</p>
            <div className="flex items-center gap-4 mt-4">
              <span className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${statusColors[campaign.status]}`}>
                {campaign.status}
              </span>
              <div className="flex items-center gap-2">
                {campaign.channels.map(channel => {
                  const Icon = channelIcons[channel];
                  return <Icon key={channel} className="w-5 h-5 text-gray-600" />;
                })}
              </div>
            </div>
          </div>
          
          {/* Campaign Actions */}
          <div className="flex items-center gap-2">
            {campaign.status === 'draft' && (
              <button className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                <Play className="w-5 h-5" />
                Launch
              </button>
            )}
            {campaign.status === 'active' && (
              <button className="flex items-center gap-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700">
                <Pause className="w-5 h-5" />
                Pause
              </button>
            )}
            <button className="p-2 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100">
              <Edit className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'overview' && <OverviewTab campaign={campaign} analytics={analytics} />}
          {activeTab === 'targets' && <TargetsTab campaign={campaign} />}
          {activeTab === 'messages' && <MessagesTab campaign={campaign} />}
          {activeTab === 'ai-agent' && <AIAgentTab campaign={campaign} />}
          {activeTab === 'analytics' && <AnalyticsTab campaign={campaign} analytics={analytics} />}
          {activeTab === 'settings' && <SettingsTab campaign={campaign} />}
        </div>
      </div>
    </div>
  );
}

// Overview Tab Component
function OverviewTab({ campaign, analytics }) {
  const stats = [
    {
      label: 'Total Targets',
      value: analytics?.total_targets || 0,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      label: 'Messages Sent',
      value: analytics?.total_sent || 0,
      icon: Send,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      label: 'Open Rate',
      value: `${(analytics?.overall_open_rate * 100 || 0).toFixed(1)}%`,
      icon: Eye,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      label: 'Response Rate',
      value: `${(analytics?.overall_response_rate * 100 || 0).toFixed(1)}%`,
      icon: MessageSquare,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    }
  ];

  return (
    <div>
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => (
          <div key={index} className="bg-gray-50 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 ${stat.bgColor} rounded-lg flex items-center justify-center`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-sm text-gray-600">{stat.label}</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Channel Performance */}
      <div className="bg-gray-50 rounded-xl p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Channel Performance</h3>
        <div className="space-y-4">
          {Object.entries(analytics?.by_channel || {}).map(([channel, data]) => {
            const Icon = channelIcons[channel];
            return (
              <div key={channel} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
                    <Icon className="w-5 h-5 text-gray-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 capitalize">{channel}</p>
                    <p className="text-sm text-gray-500">{data.sent} sent</p>
                  </div>
                </div>
                <div className="flex items-center gap-6 text-sm">
                  <div>
                    <p className="text-gray-500">Open Rate</p>
                    <p className="font-medium text-gray-900">{(data.open_rate * 100).toFixed(1)}%</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Reply Rate</p>
                    <p className="font-medium text-green-600">{(data.response_rate * 100).toFixed(1)}%</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// Create Campaign Modal Component
function CreateCampaignModal({ onClose, onSuccess }) {
  const [step, setStep] = useState(1);
  const [campaignData, setCampaignData] = useState({
    name: '',
    description: '',
    goal: 'lead_generation',
    channels: ['email'],
    searchQuery: '',
    aiPersonality: 'professional',
    dailyLimit: 50
  });

  const goals = [
    { id: 'sales', label: 'Sales', description: 'Close deals and generate revenue' },
    { id: 'lead_generation', label: 'Lead Generation', description: 'Find and qualify prospects' },
    { id: 'partnership', label: 'Partnership', description: 'Build strategic relationships' },
    { id: 'recruitment', label: 'Recruitment', description: 'Find and hire talent' },
    { id: 'networking', label: 'Networking', description: 'Expand professional network' }
  ];

  const handleCreate = async () => {
    try {
      const newCampaign = await createCampaign({
        ...campaignData,
        status: 'draft',
        search_criteria: {
          query: campaignData.searchQuery,
          limit: 100
        },
        ai_config: {
          personality: campaignData.aiPersonality,
          tone: 'friendly',
          objectives: ['Engage prospects', 'Qualify leads', 'Schedule meetings']
        }
      });
      onSuccess(newCampaign);
    } catch (error) {
      console.error('Error creating campaign:', error);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Create New Campaign</h2>
          <p className="text-gray-600 mt-2">Launch AI-powered multi-channel outreach</p>
        </div>

        {/* Modal Content */}
        <div className="p-6">
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Campaign Name
                </label>
                <input
                  type="text"
                  value={campaignData.name}
                  onChange={(e) => setCampaignData({ ...campaignData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Q4 Sales Outreach"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={campaignData.description}
                  onChange={(e) => setCampaignData({ ...campaignData, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="Describe your campaign objectives..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Campaign Goal
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {goals.map((goal) => (
                    <div
                      key={goal.id}
                      onClick={() => setCampaignData({ ...campaignData, goal: goal.id })}
                      className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        campaignData.goal === goal.id
                          ? 'border-blue-600 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <p className="font-medium text-gray-900">{goal.label}</p>
                      <p className="text-sm text-gray-600 mt-1">{goal.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Outreach Channels
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {Object.entries(channelIcons).map(([channel, Icon]) => (
                    <div
                      key={channel}
                      onClick={() => {
                        const channels = campaignData.channels.includes(channel)
                          ? campaignData.channels.filter(c => c !== channel)
                          : [...campaignData.channels, channel];
                        setCampaignData({ ...campaignData, channels });
                      }}
                      className={`p-4 rounded-lg border-2 cursor-pointer transition-all flex flex-col items-center gap-2 ${
                        campaignData.channels.includes(channel)
                          ? 'border-blue-600 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <Icon className="w-6 h-6 text-gray-600" />
                      <p className="text-sm font-medium text-gray-900 capitalize">{channel}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Target Search Query
                </label>
                <input
                  type="text"
                  value={campaignData.searchQuery}
                  onChange={(e) => setCampaignData({ ...campaignData, searchQuery: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., SaaS founders in San Francisco"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  AI Agent Personality
                </label>
                <select
                  value={campaignData.aiPersonality}
                  onChange={(e) => setCampaignData({ ...campaignData, aiPersonality: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="professional">Professional</option>
                  <option value="friendly">Friendly</option>
                  <option value="casual">Casual</option>
                  <option value="formal">Formal</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-6 border-t border-gray-200 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-900"
          >
            Cancel
          </button>
          <div className="flex items-center gap-3">
            {step > 1 && (
              <button
                onClick={() => setStep(step - 1)}
                className="px-4 py-2 text-gray-600 hover:text-gray-900"
              >
                Back
              </button>
            )}
            {step < 2 ? (
              <button
                onClick={() => setStep(step + 1)}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Next
              </button>
            ) : (
              <button
                onClick={handleCreate}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Create Campaign
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// Additional tab components would go here (TargetsTab, MessagesTab, etc.)