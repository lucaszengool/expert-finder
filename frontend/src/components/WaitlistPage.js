import React, { useState } from 'react';
import { useAuth, useClerk } from '@clerk/clerk-react';
import { motion } from 'framer-motion';
import { Sparkles, ArrowRight, Check } from 'lucide-react';

const WaitlistPage = () => {
  const { isSignedIn, user } = useAuth();
  const clerk = useClerk();
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async () => {
  if (!email || !email.includes('@')) return;
  
  setIsSubmitting(true);

  try {
    if (!isSignedIn) {
      // Redirect to sign up
      await clerk.redirectToSignUp({
        redirectUrl: window.location.origin, // This will redirect back to main app after signup
        emailAddress: email,
      });
    } else {
      // User is already signed in, just set them as submitted
      setIsSubmitted(true);
      // The webhook will handle updating their metadata
    }
  } catch (error) {
    console.error('Error joining waitlist:', error);
  } finally {
    setIsSubmitting(false);
  }
};

  if (isSubmitted || (isSignedIn && user?.publicMetadata?.waitlistStatus)) {
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
          <h2 className="text-2xl font-medium text-white mb-2">You're on the list</h2>
          <p className="text-gray-400 text-sm">
            We'll notify you when we launch
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
            Connect with verified experts. Launching soon.
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

        {/* Footer text */}
        <p className="text-center text-xs text-gray-500 mt-8">
          No spam. Unsubscribe anytime.
        </p>
      </motion.div>
    </div>
  );
};

export default WaitlistPage;