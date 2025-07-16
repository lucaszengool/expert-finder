// 1. UPDATED WebsitePreview.js with free thum.io service
// File: /frontend/src/components/modern/WebsitePreview.js

import React, { useState } from 'react';
import { ExternalLink, Globe, Loader2 } from 'lucide-react';

const WebsitePreview = ({ websites, expert }) => {
  const [selectedWebsite, setSelectedWebsite] = useState(0);
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  // Get all available websites
  const allWebsites = React.useMemo(() => {
    const sites = [];
    
    // Add main website
    if (expert.website || expert.url || expert.profile_url) {
      const mainUrl = expert.website || expert.url || expert.profile_url;
      // Skip if it's not a real website URL
      if (mainUrl && !mainUrl.includes('example.com') && mainUrl.startsWith('http')) {
        sites.push({
          url: mainUrl,
          title: 'Personal Website',
          icon: '🌐'
        });
      }
    }
    
    // Add LinkedIn
    if (expert.linkedin || expert.linkedin_url) {
      const linkedinUrl = expert.linkedin || expert.linkedin_url;
      if (linkedinUrl && linkedinUrl.includes('linkedin.com')) {
        sites.push({
          url: linkedinUrl,
          title: 'LinkedIn Profile',
          icon: '💼'
        });
      }
    }
    
    // Add GitHub
    if (expert.github || expert.github_url) {
      const githubUrl = expert.github || expert.github_url;
      if (githubUrl && githubUrl.includes('github.com')) {
        sites.push({
          url: githubUrl,
          title: 'GitHub Profile',
          icon: '💻'
        });
      }
    }
    
    // Add Twitter
    if (expert.twitter) {
      sites.push({
        url: expert.twitter.includes('twitter.com') ? expert.twitter : `https://twitter.com/${expert.twitter}`,
        title: 'Twitter Profile',
        icon: '🐦'
      });
    }
    
    // Add any additional websites
    if (websites && Array.isArray(websites)) {
      websites.forEach(site => {
        if (site.url && !sites.some(s => s.url === site.url)) {
          sites.push({
            url: site.url,
            title: site.title || 'Website',
            icon: '🔗'
          });
        }
      });
    }
    
    return sites;
  }, [websites, expert]);

  if (allWebsites.length === 0) {
    return (
      <div className="bg-gray-800/50 rounded-lg p-6 text-center">
        <Globe className="w-8 h-8 text-gray-600 mx-auto mb-2" />
        <p className="text-sm text-gray-500">No website available</p>
      </div>
    );
  }

  const currentWebsite = allWebsites[selectedWebsite];
  
  // Generate preview image URL using free thum.io service
  const getPreviewImageUrl = (url) => {
    // Clean the URL
    const cleanUrl = url.replace(/^https?:\/\//, '');
    
    // Use thum.io free service
    // Options: width/600/crop/400 means 600px wide, cropped to 400px height
    return `https://image.thum.io/get/width/600/crop/400/noanimate/${cleanUrl}`;
  };

  return (
    <div className="space-y-3">
      {/* Website Selector */}
      {allWebsites.length > 1 && (
        <div className="flex gap-2 flex-wrap">
          {allWebsites.map((site, idx) => (
            <button
              key={idx}
              onClick={() => {
                setSelectedWebsite(idx);
                setImageLoading(true);
                setImageError(false);
              }}
              className={`px-3 py-1.5 text-xs rounded-full transition-all ${
                selectedWebsite === idx
                  ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                  : 'bg-gray-800 text-gray-400 hover:text-white border border-gray-700'
              }`}
            >
              <span className="mr-1">{site.icon}</span>
              {site.title}
            </button>
          ))}
        </div>
      )}

      {/* Website Preview */}
      <div className="relative bg-gray-800/50 rounded-lg overflow-hidden group">
        <div className="aspect-[3/2] relative">
          {imageLoading && !imageError && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-900/50">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            </div>
          )}
          
          {!imageError ? (
            <img
              src={getPreviewImageUrl(currentWebsite.url)}
              alt={`${currentWebsite.title} preview`}
              className="w-full h-full object-cover object-top"
              onLoad={() => setImageLoading(false)}
              onError={() => {
                setImageError(true);
                setImageLoading(false);
              }}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
              <div className="text-center">
                <Globe className="w-12 h-12 text-gray-600 mx-auto mb-2" />
                <p className="text-sm text-gray-500">Preview unavailable</p>
                <p className="text-xs text-gray-600 mt-1">Click below to visit</p>
              </div>
            </div>
          )}
          
          {/* Overlay on hover */}
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <a
              href={currentWebsite.url}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-green-500 hover:bg-green-600 text-black rounded-lg font-medium flex items-center gap-2 transform scale-95 group-hover:scale-100 transition-transform"
            >
              Visit {currentWebsite.title}
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>
        
        {/* URL Bar */}
        <div className="px-3 py-2 bg-gray-900/50 border-t border-gray-700 flex items-center gap-2">
          <Globe className="w-4 h-4 text-gray-500" />
          <span className="text-xs text-gray-400 truncate flex-1">{currentWebsite.url}</span>
          <a
            href={currentWebsite.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-green-400 hover:text-green-300"
          >
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </div>
  );
};

export default WebsitePreview;