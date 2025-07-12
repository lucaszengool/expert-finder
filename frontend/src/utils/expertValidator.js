// expertValidator.js - Add to src/utils/expertValidator.js

export const strictExpertValidator = {
  // Check if URL is a valid personal profile
  isValidProfileUrl(url) {
    if (!url) return false;
    
    // Valid LinkedIn personal profile pattern
    const linkedInProfilePattern = /^https?:\/\/(www\.)?linkedin\.com\/in\/[a-zA-Z0-9\-]+\/?$/;
    
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
      return linkedInProfilePattern.test(url);
    }
    
    // Allow other personal websites
    return true;
  },

  // Validate if expert data represents a real person
  isValidExpert(expert) {
    // Check name
    const name = expert.name || '';
    const nameParts = name.split(' ').filter(part => part.length > 0);
    
    // Must have at least first and last name
    if (nameParts.length < 2) {
      console.log('Invalid expert: No proper name', name);
      return false;
    }
    
    // Check for organization names
    const orgKeywords = [
      'linkedin learning',
      'coursera',
      'udemy',
      'udacity',
      'edx',
      'skillshare',
      'masterclass',
      'training',
      'courses',
      'platform',
      'framework',
      'foundation',
      'institute',
      'academy'
    ];
    
    const nameLower = name.toLowerCase();
    if (orgKeywords.some(keyword => nameLower.includes(keyword))) {
      console.log('Invalid expert: Organization name detected', name);
      return false;
    }
    
    // Check title
    const title = (expert.title || '').toLowerCase();
    const invalidTitlePatterns = [
      'how to',
      'guide to',
      'learn',
      'course',
      'training',
      'workshop',
      'seminar',
      'webinar',
      'tutorial',
      'online training',
      'skill building'
    ];
    
    if (invalidTitlePatterns.some(pattern => title.includes(pattern))) {
      console.log('Invalid expert: Invalid title pattern', title);
      return false;
    }
    
    // Check if profile URL is valid
    const profileUrl = expert.profile_url || expert.linkedin_url || '';
    if (profileUrl && !this.isValidProfileUrl(profileUrl)) {
      console.log('Invalid expert: Invalid profile URL', profileUrl);
      return false;
    }
    
    // Must have professional indicators
    const professionalIndicators = [
      'founder', 'ceo', 'cto', 'coo', 'cfo',
      'engineer', 'developer', 'architect',
      'scientist', 'researcher', 'professor',
      'director', 'manager', 'head of',
      'consultant', 'advisor', 'expert',
      'specialist', 'analyst', 'designer',
      'physician', 'doctor', 'phd', 'md'
    ];
    
    const hasProfessionalTitle = professionalIndicators.some(indicator => 
      title.includes(indicator) || (expert.bio || '').toLowerCase().includes(indicator)
    );
    
    if (!hasProfessionalTitle && !expert.verified_expert) {
      console.log('Invalid expert: No professional indicators', expert);
      return false;
    }
    
    return true;
  },

  // Clean and validate expert data
  cleanExpertData(expert) {
    // Fix article titles that slipped through
    if (expert.title && expert.title.toLowerCase().includes('how to')) {
      // Extract real title from bio or use default
      const bioMatch = (expert.bio || '').match(/(?:is a|as a|^)(.*?)(?:\.|,|$)/i);
      expert.title = bioMatch ? bioMatch[1].trim() : 'AI/ML Expert';
    }
    
    // Ensure profile URL is valid
    if (expert.profile_url && !this.isValidProfileUrl(expert.profile_url)) {
      // Try to extract valid profile from URL
      const profileMatch = expert.profile_url.match(/linkedin\.com\/in\/([a-zA-Z0-9\-]+)/);
      if (profileMatch) {
        expert.profile_url = `https://www.linkedin.com/in/${profileMatch[1]}/`;
        expert.linkedin_url = expert.profile_url;
      } else {
        // Remove invalid profile URL
        delete expert.profile_url;
      }
    }
    
    return expert;
  },

  // Filter array of experts
  filterExperts(experts) {
    return experts
      .filter(expert => this.isValidExpert(expert))
      .map(expert => this.cleanExpertData(expert));
  }
};

export default strictExpertValidator;