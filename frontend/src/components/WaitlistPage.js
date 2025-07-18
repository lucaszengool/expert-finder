import React, { useState } from 'react';
import { useAuth, useClerk } from '@clerk/clerk-react';
import { motion } from 'framer-motion';
import { Sparkles, ArrowRight, Check } from 'lucide-react';

const WaitlistPage = () => {
  const { isSignedIn } = useAuth();
  const clerk = useClerk();
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!email || !email.includes('@')) return;
    
    setIsSubmitting(true);
    setError('');

    try {
      // Join the Clerk waitlist
      const response = await clerk.client.waitlist.join({
        emailAddress: email
      });

      if (response) {
        setIsSubmitted(true);
      }
    } catch (error) {
      console.error('Error joining waitlist:', error);
      if (error.errors && error.errors[0]) {
        setError(error.errors[0].message);
      } else {
        setError('Failed to join waitlist. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-emerald-500/20">
            <Check className="w-8 h-8 text-emerald-400" />
          </div>
          <h2 className="text-2xl font-medium text-white mb-2">You're on the list!</h2>
          <p className="text-gray-400 text-sm mb-1">
            We've sent a confirmation email to
          </p>
          <p className="text-emerald-400 font-medium">{email}</p>
          <p className="text-gray-500 text-xs mt-4">
            We'll notify you when we're ready to launch
          </p>
        </motion.div>
      </div>
    );
  }

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
        <div className="flex justify-center mb-12">
          <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center border border-emerald-500/20">
            <Sparkles className="w-8 h-8 text-emerald-400" />
          </div>
        </div>

        {/* Heading */}
        <div className="text-center mb-10">
          <h1 className="text-3xl font-medium text-white mb-3">
            Expert Finder
          </h1>
          <p className="text-gray-400">
            You've used your free AI searches. Join the waitlist for unlimited access.
          </p>
        </div>

        {/* Email Input */}
        <div className="space-y-4">
          <div className="relative">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
              placeholder="Enter your email"
              className="w-full px-5 py-4 bg-gray-900/50 border border-gray-800 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500/50 transition-colors backdrop-blur-sm"
            />
          </div>

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !email || !email.includes('@')}
            className="w-full py-4 bg-emerald-500 text-gray-950 font-medium rounded-xl hover:bg-emerald-400 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 group"
          >
            {isSubmitting ? (
              <div className="w-5 h-5 border-2 border-gray-950 border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                Join Waitlist
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </>
            )}
          </button>
        </div>

        {/* Benefits */}
        <div className="mt-8 space-y-3">
          <div className="flex items-start gap-3">
            <Check className="w-4 h-4 text-emerald-400 mt-0.5" />
            <p className="text-sm text-gray-400">Unlimited AI-powered searches</p>
          </div>
          <div className="flex items-start gap-3">
            <Check className="w-4 h-4 text-emerald-400 mt-0.5" />
            <p className="text-sm text-gray-400">Direct messaging with experts</p>
          </div>
          <div className="flex items-start gap-3">
            <Check className="w-4 h-4 text-emerald-400 mt-0.5" />
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