import React, { useState, useEffect } from 'react';
import { Search, Send, Users, Mail, Calendar, TrendingUp, Upload, Bot, Target } from 'lucide-react';

const OutreachDashboard = () => {
  const [activeTab, setActiveTab] = useState('search');
  const [searchQuery, setSearchQuery] = useState('');
  const [targetType, setTargetType] = useState('all');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedTargets, setSelectedTargets] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [emailTemplates, setEmailTemplates] = useState([]);
  const [showLearnModal, setShowLearnModal] = useState(false);
  const [loading, setLoading] = useState(false);

  // Campaign creation state
  const [campaignForm, setCampaignForm] = useState({
    name: '',
    description: '',
    goals: {
      primary_goal: 'schedule_meeting',
      success_metrics: {},
      desired_outcome: ''
    },
    budget: {
      min_amount: null,
      max_amount: null,
      currency: 'USD'
    },
    template_id: null
  });

  // Search for targets
  const handleSearch = async () => {
    setLoading(true);
    try {
      // Simulated API call
      const mockResults = [
        {
          id: 'target_1',
          name: 'John Smith',
          type: targetType,
          company: 'Tech Innovations Inc',
          email: 'john@techinnovations.com',
          location: 'San Francisco, CA',
          match_score: 92,
          engagement_suggestions: ['Discuss AI implementation', 'Share case studies']
        },
        {
          id: 'target_2',
          name: 'Sarah Johnson',
          type: targetType,
          company: 'Digital Marketing Agency',
          email: 'sarah@digitalagency.com',
          location: 'New York, NY',
          match_score: 87,
          engagement_suggestions: ['Offer partnership opportunities', 'Schedule demo']
        },
        {
          id: 'target_3',
          name: 'Michael Chen',
          type: targetType,
          company: 'StartupHub',
          email: 'michael@startuphub.com',
          location: 'Austin, TX',
          match_score: 85,
          engagement_suggestions: ['Share growth strategies', 'Discuss scaling challenges']
        }
      ];
      
      setSearchResults(mockResults);
    } catch (error) {
      console.error('Search failed:', error);
    }
    setLoading(false);
  };

  // Toggle target selection
  const toggleTargetSelection = (targetId) => {
    setSelectedTargets(prev => 
      prev.includes(targetId) 
        ? prev.filter(id => id !== targetId)
        : [...prev, targetId]
    );
  };

  // Create campaign with selected targets
  const createCampaign = async () => {
    if (!campaignForm.name || selectedTargets.length === 0) {
      alert('Please provide campaign name and select at least one target');
      return;
    }

    setLoading(true);
    try {
      // Simulated API call
      const newCampaign = {
        id: `campaign_${Date.now()}`,
        ...campaignForm,
        target_count: selectedTargets.length,
        status: 'draft',
        created_at: new Date().toISOString()
      };
      
      setCampaigns([...campaigns, newCampaign]);
      setActiveTab('campaigns');
      
      // Reset form
      setCampaignForm({
        name: '',
        description: '',
        goals: { primary_goal: 'schedule_meeting', success_metrics: {}, desired_outcome: '' },
        budget: { min_amount: null, max_amount: null, currency: 'USD' },
        template_id: null
      });
      setSelectedTargets([]);
      setSearchResults([]);
    } catch (error) {
      console.error('Campaign creation failed:', error);
    }
    setLoading(false);
  };

  // Email Learning Modal Component
  const EmailLearningModal = () => {
    const [emailExamples, setEmailExamples] = useState([{ subject: '', content: '', success: true }]);
    
    const addExample = () => {
      setEmailExamples([...emailExamples, { subject: '', content: '', success: true }]);
    };
    
    const updateExample = (index, field, value) => {
      const updated = [...emailExamples];
      updated[index][field] = value;
      setEmailExamples(updated);
    };
    
    const learnFromExamples = async () => {
      setLoading(true);
      try {
        // Simulated API call
        const newTemplate = {
          id: `template_${Date.now()}`,
          name: 'Learned Template',
          category: 'cold_outreach',
          success_rate: 0.0,
          usage_count: 0
        };
        
        setEmailTemplates([...emailTemplates, newTemplate]);
        setShowLearnModal(false);
      } catch (error) {
        console.error('Learning failed:', error);
      }
      setLoading(false);
    };
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <h2 className="text-2xl font-bold mb-4">Teach AI Your Email Style</h2>
          
          <p className="text-gray-600 mb-6">
            Provide examples of successful emails you've sent. The AI will learn your style and create personalized templates.
          </p>
          
          {emailExamples.map((example, index) => (
            <div key={index} className="mb-6 p-4 border rounded-lg">
              <h3 className="font-semibold mb-2">Example {index + 1}</h3>
              
              <input
                type="text"
                placeholder="Email Subject"
                value={example.subject}
                onChange={(e) => updateExample(index, 'subject', e.target.value)}
                className="w-full p-2 border rounded mb-2"
              />
              
              <textarea
                placeholder="Email Content"
                value={example.content}
                onChange={(e) => updateExample(index, 'content', e.target.value)}
                className="w-full p-2 border rounded h-32 mb-2"
              />
              
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={example.success}
                  onChange={(e) => updateExample(index, 'success', e.target.checked)}
                  className="mr-2"
                />
                This email was successful
              </label>
            </div>
          ))}
          
          <button
            onClick={addExample}
            className="mb-4 px-4 py-2 text-blue-600 border border-blue-600 rounded hover:bg-blue-50"
          >
            + Add Another Example
          </button>
          
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setShowLearnModal(false)}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
            >
              Cancel
            </button>
            <button
              onClick={learnFromExamples}
              disabled={loading || emailExamples.some(ex => !ex.subject || !ex.content)}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Learning...' : 'Learn from Examples'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Campaign Analytics Component
  const CampaignAnalytics = ({ campaign }) => {
    const analytics = {
      emails_sent: 45,
      open_rate: 68.5,
      response_rate: 24.3,
      meeting_scheduled_rate: 12.5,
      closed_won_rate: 5.2
    };
    
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Campaign Performance</h3>
        
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{analytics.emails_sent}</div>
            <div className="text-sm text-gray-600">Emails Sent</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{analytics.open_rate}%</div>
            <div className="text-sm text-gray-600">Open Rate</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{analytics.response_rate}%</div>
            <div className="text-sm text-gray-600">Response Rate</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">{analytics.meeting_scheduled_rate}%</div>
            <div className="text-sm text-gray-600">Meetings</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-700">{analytics.closed_won_rate}%</div>
            <div className="text-sm text-gray-600">Closed Won</div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Bot className="h-8 w-8 text-blue-600 mr-3" />
              <h1 className="text-xl font-semibold">AI Outreach & Negotiation Platform</h1>
            </div>
            
            <button
              onClick={() => setShowLearnModal(true)}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Upload className="h-4 w-4 mr-2" />
              Teach AI Your Style
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {[
              { id: 'search', label: 'Search Targets', icon: Search },
              { id: 'campaigns', label: 'Campaigns', icon: Target },
              { id: 'emails', label: 'Email Activity', icon: Mail },
              { id: 'meetings', label: 'Meetings', icon: Calendar },
              { id: 'analytics', label: 'Analytics', icon: TrendingUp }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="h-5 w-5 mr-2" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Tab */}
        {activeTab === 'search' && (
          <div className="space-y-6">
            {/* Search Form */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Find Your Targets</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-2">
                  <input
                    type="text"
                    placeholder="Search for experts, agencies, clients, shops..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <select
                  value={targetType}
                  onChange={(e) => setTargetType(e.target.value)}
                  className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Types</option>
                  <option value="experts">Experts</option>
                  <option value="agencies">Agencies</option>
                  <option value="clients">Potential Clients</option>
                  <option value="shops">Local Shops</option>
                  <option value="influencers">Influencers</option>
                </select>
                
                <button
                  onClick={handleSearch}
                  disabled={loading || !searchQuery}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Searching...' : 'Search'}
                </button>
              </div>
            </div>

            {/* Search Results */}
            {searchResults.length > 0 && (
              <div className="bg-white rounded-lg shadow">
                <div className="p-6 border-b">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">
                      Found {searchResults.length} Targets
                    </h3>
                    
                    {selectedTargets.length > 0 && (
                      <div className="flex items-center gap-4">
                        <span className="text-sm text-gray-600">
                          {selectedTargets.length} selected
                        </span>
                        <button
                          onClick={() => setActiveTab('campaign-create')}
                          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                        >
                          Create Campaign
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="divide-y">
                  {searchResults.map(target => (
                    <div key={target.id} className="p-6 hover:bg-gray-50">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start">
                          <input
                            type="checkbox"
                            checked={selectedTargets.includes(target.id)}
                            onChange={() => toggleTargetSelection(target.id)}
                            className="mt-1 mr-4"
                          />
                          
                          <div>
                            <h4 className="font-semibold">{target.name}</h4>
                            <p className="text-sm text-gray-600">{target.company}</p>
                            <p className="text-sm text-gray-500">{target.email}</p>
                            <p className="text-sm text-gray-500">{target.location}</p>
                            
                            <div className="mt-2">
                              <span className="text-xs font-medium text-blue-600">
                                Match Score: {target.match_score}%
                              </span>
                            </div>
                            
                            <div className="mt-2">
                              <p className="text-xs text-gray-600">Engagement suggestions:</p>
                              <ul className="text-xs text-gray-500 mt-1">
                                {target.engagement_suggestions.map((suggestion, idx) => (
                                  <li key={idx}>• {suggestion}</li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </div>
                        
                        <button className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200">
                          Send Email
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Campaign Creation */}
        {activeTab === 'campaign-create' && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-6">Create Outreach Campaign</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Campaign Name
                </label>
                <input
                  type="text"
                  value={campaignForm.name}
                  onChange={(e) => setCampaignForm({...campaignForm, name: e.target.value})}
                  className="w-full px-4 py-2 border rounded-lg"
                  placeholder="e.g., Q1 Partnership Outreach"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Primary Goal
                </label>
                <select
                  value={campaignForm.goals.primary_goal}
                  onChange={(e) => setCampaignForm({
                    ...campaignForm,
                    goals: {...campaignForm.goals, primary_goal: e.target.value}
                  })}
                  className="w-full px-4 py-2 border rounded-lg"
                >
                  <option value="schedule_meeting">Schedule Meeting</option>
                  <option value="close_deal">Close Deal</option>
                  <option value="get_response">Get Response</option>
                  <option value="build_relationship">Build Relationship</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Budget Range (Optional)
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="number"
                    placeholder="Min Amount"
                    value={campaignForm.budget.min_amount || ''}
                    onChange={(e) => setCampaignForm({
                      ...campaignForm,
                      budget: {...campaignForm.budget, min_amount: e.target.value}
                    })}
                    className="px-4 py-2 border rounded-lg"
                  />
                  <input
                    type="number"
                    placeholder="Max Amount"
                    value={campaignForm.budget.max_amount || ''}
                    onChange={(e) => setCampaignForm({
                      ...campaignForm,
                      budget: {...campaignForm.budget, max_amount: e.target.value}
                    })}
                    className="px-4 py-2 border rounded-lg"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Template
                </label>
                <select
                  value={campaignForm.template_id || ''}
                  onChange={(e) => setCampaignForm({...campaignForm, template_id: e.target.value})}
                  className="w-full px-4 py-2 border rounded-lg"
                >
                  <option value="">AI Generated (No Template)</option>
                  {emailTemplates.map(template => (
                    <option key={template.id} value={template.id}>
                      {template.name} (Success Rate: {template.success_rate}%)
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="pt-4 flex justify-end gap-4">
                <button
                  onClick={() => setActiveTab('search')}
                  className="px-6 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={createCampaign}
                  disabled={loading}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Creating...' : 'Create Campaign'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Campaigns List */}
        {activeTab === 'campaigns' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b">
                <h2 className="text-lg font-semibold">Active Campaigns</h2>
              </div>
              
              <div className="divide-y">
                {campaigns.length === 0 ? (
                  <div className="p-6 text-center text-gray-500">
                    No campaigns yet. Search for targets and create your first campaign!
                  </div>
                ) : (
                  campaigns.map(campaign => (
                    <div key={campaign.id} className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="font-semibold">{campaign.name}</h3>
                          <p className="text-sm text-gray-600">
                            {campaign.target_count} targets • Created {new Date(campaign.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <span className={`px-3 py-1 text-xs rounded-full ${
                            campaign.status === 'active' 
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}>
                            {campaign.status}
                          </span>
                          
                          <button className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700">
                            Send Bulk Emails
                          </button>
                        </div>
                      </div>
                      
                      <CampaignAnalytics campaign={campaign} />
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* Other tabs would be implemented similarly */}
        {activeTab === 'emails' && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Email Activity</h2>
            <p className="text-gray-600">Email threads and conversations will appear here...</p>
          </div>
        )}

        {activeTab === 'meetings' && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Scheduled Meetings</h2>
            <p className="text-gray-600">Your scheduled meetings and calendar will appear here...</p>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Overall Analytics</h2>
            <p className="text-gray-600">Comprehensive analytics dashboard coming soon...</p>
          </div>
        )}
      </div>

      {/* Email Learning Modal */}
      {showLearnModal && <EmailLearningModal />}
    </div>
  );
};

export default OutreachDashboard;