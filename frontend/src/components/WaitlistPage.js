import React from 'react';
import { Waitlist } from '@clerk/clerk-react';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';

const WaitlistPage = () => {
  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      {/* Subtle gradient orb */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/5 rounded-full blur-3xl"></div>
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 w-full max-w-md"
      >
        {/* Logo/Icon */}
        <div className="flex justify-center mb-8">
          <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center border border-emerald-500/20">
            <Sparkles className="w-8 h-8 text-emerald-400" />
          </div>
        </div>

        {/* Heading */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-medium text-white mb-3">
            Expert Finder
          </h1>
          <p className="text-gray-400">
            You've used your 3 free AI searches. Join the waitlist for unlimited access.
          </p>
        </div>

        {/* Clerk Waitlist Component with custom styling */}
        <div className="clerk-waitlist-wrapper">
          <Waitlist
            appearance={{
              elements: {
                rootBox: "w-full",
                card: "bg-transparent shadow-none p-0",
                headerTitle: "hidden",
                headerSubtitle: "hidden",
                formFieldInput: "w-full px-5 py-4 bg-gray-900/50 border border-gray-800 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500/50 transition-colors backdrop-blur-sm",
                formButtonPrimary: "w-full py-4 bg-emerald-500 text-gray-950 font-medium rounded-xl hover:bg-emerald-400 transition-all duration-200",
                formFieldLabel: "hidden",
                footer: "hidden",
                alert: "bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg p-3 mb-4",
                alertText: "text-sm"
              },
              layout: {
                socialButtonsPlacement: "bottom",
                showOptionalFields: false
              }
            }}
          />
        </div>

        {/* Benefits */}
        <div className="mt-8 space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-4 h-4 rounded-full bg-emerald-500/20 flex items-center justify-center mt-0.5">
              <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
            </div>
            <p className="text-sm text-gray-400">Unlimited AI-powered searches</p>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-4 h-4 rounded-full bg-emerald-500/20 flex items-center justify-center mt-0.5">
              <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
            </div>
            <p className="text-sm text-gray-400">Direct messaging with experts</p>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-4 h-4 rounded-full bg-emerald-500/20 flex items-center justify-center mt-0.5">
              <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
            </div>
            <p className="text-sm text-gray-400">Priority support</p>
          </div>
        </div>

        {/* Footer text */}
        <p className="text-center text-xs text-gray-500 mt-8">
          No spam. Unsubscribe anytime.
        </p>
      </motion.div>
    </div>
  );
};

export default WaitlistPage;