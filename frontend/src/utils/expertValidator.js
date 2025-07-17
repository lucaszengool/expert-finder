// expertValidator.js - Add to src/utils/expertValidator.js

export const strictExpertValidator = {
  // Check if URL is a valid personal profile
  isValidProfileUrl(url) {
    if (!url) return false;
    
    // Valid LinkedIn personal profile pattern - updated to handle international URLs
    const linkedInProfilePattern = /^https?:\/\/([a-zA-Z]{2}\.)?linkedin\.com\/in\/[a-zA-Z0-9\-]+\/?$/;
    
    // Invalid patterns - reject immediately
    const invalidPatterns = [
      '/pulse/',
      '/posts/', 
      '/activity/',
      '/article/',
      '/blog/',
      '/news/',
      '/events/',
      '/jobs/',
      '/learning/',
      '/courses/',
      '/showcase/',
      '/company/',
      '/school/',
      '/groups/',
      '/feed/',
      '/detail/',
      'medium.com',
      'substack.com',
      'youtube.com/watch',
      'facebook.com/posts'
    ];
    
    // Check for invalid patterns
    const urlLower = url.toLowerCase();
    if (invalidPatterns.some(pattern => urlLower.includes(pattern))) {
      return false;
    }
    
    // Check if it's a valid LinkedIn profile
    if (urlLower.includes('linkedin.com')) {
      // Handle international LinkedIn URLs like sg.linkedin.com, uk.linkedin.com, etc.
      const linkedInMatch = url.match(/^https?:\/\/([a-zA-Z]{2}\.)?linkedin\.com\/in\/([a-zA-Z0-9\-]+)(\/[a-zA-Z]{2})?\/?$/);
      if (linkedInMatch) {
        return true;
      }
      
      // Also check the original pattern for standard URLs
      return linkedInProfilePattern.test(url);
    }
    
    // Allow other personal websites
    return true;
  },

  // Add this method to clean up LinkedIn URLs
  cleanLinkedInUrl(url) {
    if (!url) return url;
    
    // Remove language suffix from LinkedIn URLs (e.g., /en, /fr)
    const cleanedUrl = url.replace(/\/in\/([a-zA-Z0-9\-]+)\/[a-zA-Z]{2}\/?$/, '/in/$1/');
    
    return cleanedUrl;
  },

  // Update the hasProfessionalIndicators to be less strict
  hasProfessionalIndicators(expert) {
  const indicators = [
    expert.title && expert.title.length > 0 && expert.title !== "View profile",
    expert.skills && expert.skills.length > 0,
    expert.bio && expert.bio.length > 20,
    expert.organization || expert.company,
    expert.profile_url || expert.linkedin_url,
    expert.email,
    expert.publications > 0,
    expert.citations > 0
  ];
  
  // Require at least 2 indicators instead of 3 for more flexibility
  return indicators.filter(Boolean).length >= 2;
},

  // Rest of your validator methods remain the same...
  filterExperts(experts) {
    if (!Array.isArray(experts)) return [];
    
    return experts.filter(expert => {
      try {
        // Basic structure validation
        if (!expert || typeof expert !== 'object') {
          console.log('Invalid expert: Not an object');
          return false;
        }
        
        // Name validation
        if (!expert.name || typeof expert.name !== 'string' || expert.name.trim().length < 2) {
          console.log('Invalid expert: Invalid name', expert.name);
          return false;
        }
        
        // Check if name is actually an article title or company name
        const nameBlacklist = [
          'how to', 'guide', 'tips', 'ways to', 'best practices',
          'framework', 'platform', 'solutions', 'services', 'consulting',
          'agency', 'studio', 'labs', 'partners', 'associates'
        ];
        
        const lowerName = expert.name.toLowerCase();
        if (nameBlacklist.some(keyword => lowerName.includes(keyword))) {
          console.log('Invalid expert: Blacklisted name pattern', expert.name);
          return false;
        }
        
        // Profile URL validation - use the updated method
        if (expert.profile_url && !this.isValidProfileUrl(expert.profile_url)) {
          console.log('Invalid expert: Invalid profile URL', expert.profile_url);
          return false;
        }
        
        // LinkedIn URL validation
        if (expert.linkedin_url && !this.isValidProfileUrl(expert.linkedin_url)) {
          console.log('Invalid expert: Invalid LinkedIn URL', expert.linkedin_url);
          return false;
        }
        
        // Title validation
        const invalidTitles = [
          'course', 'tutorial', 'workshop', 'masterclass', 'bootcamp',
          'certification', 'training', 'program', 'curriculum'
        ];
        
        if (expert.title) {
          const lowerTitle = expert.title.toLowerCase();
          if (invalidTitles.some(keyword => lowerTitle.includes(keyword))) {
            console.log('Invalid expert: Invalid title pattern', expert.title);
            return false;
          }
        }
        
        // Check for professional indicators - use the updated method
        if (!this.hasProfessionalIndicators(expert)) {
          console.log('Invalid expert: No professional indicators', expert);
          return false;
        }
        
        return true;
      } catch (error) {
        console.error('Error validating expert:', error, expert);
        return false;
      }
    });
  }
};

export default strictExpertValidator;