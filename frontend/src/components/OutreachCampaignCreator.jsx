import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, Target, Mail, Bot, Sparkles, Send, Users, 
  Building2, ShoppingBag, Briefcase, ChevronRight,
  Upload, FileText, Zap
} from 'lucide-react';
import { outreachService } from '../services/outreachApi';

const OutreachCampaignCreator = ({ onClose, onCampaignCreated }) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [targetType, setTargetType] = useState('all');
  const [searchResults, setSearchResults] = useState(null);
  const [selectedTargets, setSelectedTargets] = useState([]);
  const [campaignName, setCampaignName] = useState('');
  const [emailExamples, setEmailExamples] = useState([]);
  const [learnedTemplate, setLearnedTemplate] = useState(null);

  const targetTypes = [
    { value: 'all', label: 'All Types', icon: Users },
    { value: 'expert', label: 'Experts', icon: Briefcase },
    { value: 'agency', label: 'Agencies', icon: Building2 },
    { value: 'client', label: 'Potential Clients', icon: Target },
    { value: 'shop', label: 'Local Businesses', icon: ShoppingBag }
  ];

  const handleSearch = async () => {
    setLoading(true);
    try {
      const results = await outreachService.searchTargets(searchQuery, targetType);
      setSearchResults(results);
      setSelectedTargets(results.targets.map(t => t.id));
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEmailUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const examples = JSON.parse(e.target.result);
          setEmailExamples(examples);
        } catch (error) {
          // Handle plain text format
          const lines = e.target.result.split('\n\n');
          const examples = lines.map(text => ({
            subject: text.split('\n')[0],
            body: text.split('\n').slice(1).join('\n'),
            outcome: 'successful'
          }));
          setEmailExamples(examples);
        }
      };
      reader.readAsText(file);
    }
  };

  const handleLearnFromExamples = async () => {
    if (emailExamples.length === 0) return;
    
    setLoading(true);
    try {
      const template = await outreachService.learnFromEmails(emailExamples);
      setLearnedTemplate(template);
    } catch (error) {
      console.error('Learning failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCampaign = async () => {
    setLoading(true);
    try {
      const campaign = await outreachService.createCampaign(
        {
          name: campaignName,
          description: `Outreach to ${searchQuery}`,
          template_id: learnedTemplate?.id,
          personalization_level: 'high',
          daily_limit: 50
        },
        {
          search_query: searchQuery,
          target_type: targetType,
          limit: selectedTargets.length
        }
      );
      
      onCampaignCreated(campaign);
      onClose();
    } catch (error) {
      console.error('Campaign creation failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="relative w-full max-w-4xl bg-white rounded-xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
          <h2 className="text-2xl font-bold flex items-center gap-3">
            <Bot className="w-8 h-8" />
            AI Outreach Campaign Creator
          </h2>
          <p className="mt-2 text-blue-100">
            Step {step} of 4: {
              step === 1 ? 'Search for Targets' :
              step === 2 ? 'Select Targets' :
              step === 3 ? 'Train AI on Your Style' :
              'Review & Launch'
            }
          </p>
        </div>

        {/* Content */}
        <div className="p-6">
          <AnimatePresence mode="wait">
            {/* Step 1: Search */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <h3 className="text-lg font-semibold mb-4">Who are you looking for?</h3>
                
                <div className="space-y-4">
                  <input
                    type="text"
                    placeholder="e.g., AI experts in San Francisco, SaaS companies needing AI, marketing agencies..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  
                  <div>
                    <label className="text-sm text-gray-600 mb-2 block">Target Type</label>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                      {targetTypes.map((type) => (
                        <button
                          key={type.value}
                          onClick={() => setTargetType(type.value)}
                          className={`p-3 rounded-lg border-2 transition-all ${
                            targetType === type.value
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <type.icon className={`w-5 h-5 mx-auto mb-1 ${
                            targetType === type.value ? 'text-blue-600' : 'text-gray-400'
                          }`} />
                          <span className="text-xs">{type.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <button
                    onClick={handleSearch}
                    disabled={!searchQuery || loading}
                    className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 transition-colors flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>Loading...</>
                    ) : (
                      <>
                        <Search className="w-5 h-5" />
                        Search for Targets
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            )}

            {/* Step 2: Select Targets */}
            {step === 2 && searchResults && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <h3 className="text-lg font-semibold mb-4">
                  Found {searchResults.targets.length} targets
                </h3>
                
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {searchResults.targets.map((target) => (
                    <div
                      key={target.id}
                      className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex-1">
                        <h4 className="font-medium">{target.name}</h4>
                        <p className="text-sm text-gray-600">
                          {target.title || target.type} • {target.company || target.location}
                        </p>
                        {target.email && (
                          <p className="text-xs text-gray-500">{target.email}</p>
                        )}
                      </div>
                      <input
                        type="checkbox"
                        checked={selectedTargets.includes(target.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedTargets([...selectedTargets, target.id]);
                          } else {
                            setSelectedTargets(selectedTargets.filter(id => id !== target.id));
                          }
                        }}
                        className="w-5 h-5 text-blue-600"
                      />
                    </div>
                  ))}
                </div>
                
                <div className="mt-4 flex justify-between">
                  <button
                    onClick={() => setStep(1)}
                    className="px-6 py-2 text-gray-600 hover:text-gray-900"
                  >
                    Back
                  </button>
                  <button
                    onClick={() => setStep(3)}
                    disabled={selectedTargets.length === 0}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 transition-colors flex items-center gap-2"
                  >
                    Continue
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* Step 3: Email Learning */}
            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <h3 className="text-lg font-semibold mb-4">Train AI on Your Email Style</h3>
                
                <div className="space-y-4">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                    <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-4">
                      Upload examples of successful emails to teach the AI your style
                    </p>
                    <input
                      type="file"
                      accept=".txt,.json"
                      onChange={handleEmailUpload}
                      className="hidden"
                      id="email-upload"
                    />
                    <label
                      htmlFor="email-upload"
                      className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 cursor-pointer inline-block"
                    >
                      Choose File
                    </label>
                  </div>
                  
                  {emailExamples.length > 0 && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <p className="text-green-800 flex items-center gap-2">
                        <FileText className="w-5 h-5" />
                        Loaded {emailExamples.length} email examples
                      </p>
                      <button
                        onClick={handleLearnFromExamples}
                        disabled={loading}
                        className="mt-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 transition-colors flex items-center gap-2"
                      >
                        {loading ? 'Learning...' : (
                          <>
                            <Sparkles className="w-4 h-4" />
                            Learn Patterns
                          </>
                        )}
                      </button>
                    </div>
                  )}
                  
                  {learnedTemplate && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <p className="text-blue-800 font-medium">AI Learning Complete!</p>
                      <p className="text-sm text-blue-600 mt-1">
                        Template created: {learnedTemplate.name}
                      </p>
                    </div>
                  )}
                  
                  <div className="mt-4 flex justify-between">
                    <button
                      onClick={() => setStep(2)}
                      className="px-6 py-2 text-gray-600 hover:text-gray-900"
                    >
                      Back
                    </button>
                    <button
                      onClick={() => setStep(4)}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                    >
                      Continue
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 4: Review & Launch */}
            {step === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <h3 className="text-lg font-semibold mb-4">Review & Launch Campaign</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-gray-600">Campaign Name</label>
                    <input
                      type="text"
                      placeholder="e.g., Q1 2024 AI Expert Outreach"
                      value={campaignName}
                      onChange={(e) => setCampaignName(e.target.value)}
                      className="w-full mt-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Search Query:</span>
                      <span className="font-medium">{searchQuery}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Target Type:</span>
                      <span className="font-medium">{targetTypes.find(t => t.value === targetType)?.label}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Selected Targets:</span>
                      <span className="font-medium">{selectedTargets.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">AI Template:</span>
                      <span className="font-medium">{learnedTemplate ? 'Custom Learned' : 'Default'}</span>
                    </div>
                  </div>
                  
                  <div className="mt-6 flex justify-between">
                    <button
                      onClick={() => setStep(3)}
                      className="px-6 py-2 text-gray-600 hover:text-gray-900"
                    >
                      Back
                    </button>
                    <button
                      onClick={handleCreateCampaign}
                      disabled={!campaignName || loading}
                      className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-400 transition-all flex items-center gap-2"
                    >
                      {loading ? 'Creating...' : (
                        <>
                          <Zap className="w-5 h-5" />
                          Launch Campaign
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default OutreachCampaignCreator;