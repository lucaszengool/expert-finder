// Updated WebsitePreview.js with better preview handling
import React, { useState, useEffect } from 'react';
import { ExternalLink, Globe, Loader2, Linkedin, Github, Twitter, User, Briefcase, Building } from 'lucide-react';

const WebsitePreview = ({ websites, expert }) => {
  const [selectedWebsite, setSelectedWebsite] = useState(0);
  const [previewData, setPreviewData] = useState(null);
  const [loading, setLoading] = useState(false);

  // Get all available websites
  const allWebsites = React.useMemo(() => {
    const sites = [];
    
    // Add main website
    if (expert.website || expert.url || expert.profile_url) {
      const mainUrl = expert.website || expert.url || expert.profile_url;
      if (mainUrl && !mainUrl.includes('example.com') && mainUrl.startsWith('http')) {
        sites.push({
          url: mainUrl,
          title: 'Personal Website',
          icon: '🌐',
          type: 'website'
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
          icon: '💼',
          type: 'linkedin'
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
          icon: '💻',
          type: 'github'
        });
      }
    }
    
    // Add Twitter
    if (expert.twitter) {
      sites.push({
        url: expert.twitter.includes('twitter.com') ? expert.twitter : `https://twitter.com/${expert.twitter}`,
        title: 'Twitter Profile',
        icon: '🐦',
        type: 'twitter'
      });
    }
    
    return sites;
  }, [websites, expert]);

  // Fetch preview data when website changes
  useEffect(() => {
    if (allWebsites.length > 0) {
      fetchPreviewData(allWebsites[selectedWebsite]);
    }
  }, [selectedWebsite, allWebsites]);

  const fetchPreviewData = async (website) => {
    setLoading(true);
    
    // For LinkedIn profiles, use the expert data we already have
    if (website.type === 'linkedin') {
      setPreviewData({
        type: 'linkedin',
        title: expert.name || 'LinkedIn Profile',
        description: expert.title || expert.bio || 'Professional Profile',
        image: expert.profile_image || expert.avatar_url,
        company: expert.organization || expert.company,
        location: expert.location,
        skills: expert.skills || []
      });
      setLoading(false);
      return;
    }
    
    // For GitHub profiles
    if (website.type === 'github') {
      const username = website.url.split('github.com/')[1]?.split('/')[0];
      if (username) {
        try {
          // Use your backend to fetch GitHub data
          const response = await fetch(`/api/github/profile/${username}`);
          if (response.ok) {
            const data = await response.json();
            setPreviewData({
              type: 'github',
              title: data.name || username,
              description: data.bio || 'GitHub Developer',
              image: data.avatar_url,
              repos: data.public_repos,
              followers: data.followers,
              location: data.location
            });
          }
        } catch (error) {
          console.error('Error fetching GitHub data:', error);
        }
      }
      setLoading(false);
      return;
    }
    
    // For other websites, try to use screenshot service
    setPreviewData({
      type: 'website',
      screenshotUrl: getScreenshotUrl(website.url)
    });
    setLoading(false);
  };

  const getScreenshotUrl = (url) => {
    const cleanUrl = url.replace(/^https?:\/\//, '');
    
    // Use multiple services as fallbacks
    const services = [
      `https://image.thum.io/get/width/600/crop/400/noanimate/${cleanUrl}`,
      `https://api.screenshotone.com/take?url=${encodeURIComponent(url)}&viewport_width=1200&viewport_height=800&device_scale_factor=1&format=jpg&image_quality=80&block_ads=true&block_cookie_banners=true&block_trackers=true&delay=5`,
      `https://api.apiflash.com/v1/urltoimage?access_key=YOUR_KEY&url=${encodeURIComponent(url)}&width=600&height=400&format=png&fresh=true`
    ];
    
    return services[0]; // Use first service, or implement fallback logic
  };

  if (allWebsites.length === 0) {
    return (
      <div className="bg-gray-800/50 rounded-lg p-6 text-center">
        <Globe className="w-8 h-8 text-gray-600 mx-auto mb-2" />
        <p className="text-sm text-gray-500">No website available</p>
      </div>
    );
  }

  const currentWebsite = allWebsites[selectedWebsite];

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
        {loading ? (
          <div className="aspect-[3/2] flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        ) : (
          <>
            {/* LinkedIn Preview */}
            {previewData?.type === 'linkedin' && (
              <div className="p-6 bg-gradient-to-br from-blue-900/20 to-blue-800/20">
                <div className="flex items-start gap-4">
                  <div className="w-20 h-20 rounded-full bg-gray-700 overflow-hidden flex-shrink-0">
                    {previewData.image ? (
                      <img src={previewData.image} alt={previewData.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <User className="w-10 h-10 text-gray-500" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                      {previewData.title}
                      <Linkedin className="w-4 h-4 text-blue-500" />
                    </h3>
                    <p className="text-sm text-gray-300 mt-1">{previewData.description}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                      {previewData.company && (
                        <span className="flex items-center gap-1">
                          <Building className="w-3 h-3" />
                          {previewData.company}
                        </span>
                      )}
                      {previewData.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {previewData.location}
                        </span>
                      )}
                    </div>
                    {previewData.skills?.length > 0 && (
                      <div className="flex gap-2 mt-3 flex-wrap">
                        {previewData.skills.slice(0, 3).map((skill, idx) => (
                          <span key={idx} className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded">
                            {skill}
                          </span>
                        ))}
                        {previewData.skills.length > 3 && (
                          <span className="px-2 py-1 text-gray-500 text-xs">
                            +{previewData.skills.length - 3} more
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* GitHub Preview */}
            {previewData?.type === 'github' && (
              <div className="p-6 bg-gradient-to-br from-gray-900 to-gray-800">
                <div className="flex items-start gap-4">
                  <div className="w-20 h-20 rounded-full bg-gray-700 overflow-hidden flex-shrink-0">
                    {previewData.image ? (
                      <img src={previewData.image} alt={previewData.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Github className="w-10 h-10 text-gray-500" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                      {previewData.title}
                      <Github className="w-4 h-4 text-gray-400" />
                    </h3>
                    <p className="text-sm text-gray-300 mt-1">{previewData.description}</p>
                    <div className="flex items-center gap-4 mt-3 text-xs text-gray-400">
                      {previewData.repos !== undefined && (
                        <span>{previewData.repos} repositories</span>
                      )}
                      {previewData.followers !== undefined && (
                        <span>{previewData.followers} followers</span>
                      )}
                      {previewData.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {previewData.location}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Generic Website Preview */}
            {previewData?.type === 'website' && (
              <div className="aspect-[3/2] relative">
                <img
                  src={previewData.screenshotUrl}
                  alt={`${currentWebsite.title} preview`}
                  className="w-full h-full object-cover object-top"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
                <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 hidden items-center justify-center">
                  <div className="text-center">
                    <Globe className="w-12 h-12 text-gray-600 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">Preview unavailable</p>
                    <p className="text-xs text-gray-600 mt-1">Click below to visit</p>
                  </div>
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
          </>
        )}
        
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