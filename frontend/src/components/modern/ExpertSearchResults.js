// src/components/modern/ExpertSearchResults.js
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import EnhancedExpertCard from './EnhancedExpertCard';
import EmailComposer from './EmailComposer';

const ExpertSearchResults = ({ experts, requirements, onExpertClick }) => {
  const [selectedExpertForEmail, setSelectedExpertForEmail] = useState(null);
  const [showEmailComposer, setShowEmailComposer] = useState(false);

  const handleExpertClick = (expert) => {
    // Call the parent's onExpertClick to show the detail modal
    if (onExpertClick) {
      onExpertClick(expert);
    }
  };

  const handleEmailClick = (expert) => {
    setSelectedExpertForEmail(expert);
    setShowEmailComposer(true);
  };

  const handleEmailClose = () => {
    setShowEmailComposer(false);
    setSelectedExpertForEmail(null);
  };

  const handleEmailSend = (emailContent) => {
    console.log('Email sent:', emailContent);
    // You can save this to your backend or analytics
    // Maybe show a success toast
  };

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {experts.map((expert, idx) => (
          <motion.div
            key={`expert-${expert.id}-${idx}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
          >
            <EnhancedExpertCard
              expert={expert}
              onClick={() => handleExpertClick(expert)}
              onEmailClick={handleEmailClick}
            />
          </motion.div>
        ))}
      </div>

      {/* Email Composer Modal */}
      {showEmailComposer && selectedExpertForEmail && (
        <EmailComposer
          expert={selectedExpertForEmail}
          requirements={requirements || {
            projectDetails: "AI/ML implementation project",
            objectives: ["Model selection", "Implementation strategy", "Best practices"],
            sessionDuration: 60,
            timeline: "flexible",
            budget: { ideal: 500 },
            userInfo: {
              name: "Your Name",
              title: "Your Title",
              company: "Your Company"
            }
          }}
          onClose={handleEmailClose}
          onSend={handleEmailSend}
        />
      )}
    </>
  );
};

export default ExpertSearchResults;