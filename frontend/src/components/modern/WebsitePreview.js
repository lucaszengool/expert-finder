// WebsitePreview.js - Save in src/components/modern/WebsitePreview.js
import React, { useState, useRef } from 'react';
import { ChevronLeft, ChevronRight, ExternalLink, Globe, Loader2 } from 'lucide-react';

const WebsitePreview = ({ websites, expertName }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loadingStates, setLoadingStates] = useState({});
  const scrollRef = useRef(null);

  // Generate preview URLs for websites
  const getPreviewData = (website) => {
    const url = website.url || website;
    const domain = new URL(url).hostname;
    
    // Use website screenshot service
    const screenshotUrl = `https://api.microlink.io/?url=${encodeURIComponent(url)}&screenshot=true&meta=false&embed=screenshot.url`;
    
    // Fallback preview image based on domain
    const fallbackImages = {
      'linkedin.com': 'https://images.unsplash.com/photo-1611944212129-29977ae1398c?w=800&h=600&fit=crop',
      'github.com': 'https://images.unsplash.com/photo-1618401471353-b98afee0b2eb?w=800&h=600&fit=crop',
      'medium.com': 'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=800&h=600&fit=crop',
      'twitter.com': 'https://images.unsplash.com/photo-1611605698335-8b1569810432?w=800&h=600&fit=crop',
    };

    const getFallback = () => {
      for (const [key, value] of Object.entries(fallbackImages)) {
        if (domain.includes(key)) return value;
      }
      return 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=600&fit=crop';
    };

    return {
      url,
      domain,
      screenshotUrl,
      fallbackImage: getFallback(),
      title: website.type || domain
    };
  };

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : websites.length - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev < websites.length - 1 ? prev + 1 : 0));
  };

  const handleWebsiteClick = (url) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  if (!websites || websites.length === 0) return null;

  const previewData = websites.map(getPreviewData);

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <Globe className="w-4 h-4" />
          <span>Websites & Links</span>
        </div>
        {websites.length > 1 && (
          <div className="flex items-center gap-1">
            <button
              onClick={handlePrevious}
              className="p-1 hover:bg-gray-800 rounded transition-colors"
            >
              <ChevronLeft className="w-4 h-4 text-gray-400" />
            </button>
            <span className="text-xs text-gray-500 px-2">
              {currentIndex + 1} / {websites.length}
            </span>
            <button
              onClick={handleNext}
              className="p-1 hover:bg-gray-800 rounded transition-colors"
            >
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </button>
          </div>
        )}
      </div>

      <div className="relative group">
        {/* Website Preview Carousel */}
        <div className="overflow-hidden rounded-lg bg-gray-800">
          <div 
            className="flex transition-transform duration-300 ease-in-out"
            style={{ transform: `translateX(-${currentIndex * 100}%)` }}
          >
            {previewData.map((preview, idx) => (
              <div
                key={idx}
                className="w-full flex-shrink-0 cursor-pointer relative"
                onClick={() => handleWebsiteClick(preview.url)}
              >
                {/* Loading state */}
                {loadingStates[preview.url] && (
                  <div className="absolute inset-0 bg-gray-900 flex items-center justify-center z-10">
                    <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
                  </div>
                )}
                
                {/* Website screenshot/preview */}
                <div className="relative h-40 bg-gray-900">
                  <img
                    src={preview.fallbackImage}
                    alt={preview.title}
                    className="w-full h-full object-cover object-top"
                    onLoad={() => setLoadingStates(prev => ({ ...prev, [preview.url]: false }))}
                    onError={(e) => {
                      e.target.src = preview.fallbackImage;
                      setLoadingStates(prev => ({ ...prev, [preview.url]: false }));
                    }}
                  />
                  
                  {/* Overlay with website info */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-gray-400">{preview.title}</p>
                        <p className="text-sm text-white font-medium truncate">
                          {preview.domain}
                        </p>
                      </div>
                      <ExternalLink className="w-4 h-4 text-gray-400" />
                    </div>
                  </div>
                </div>

                {/* Hover effect */}
                <div className="absolute inset-0 bg-green-500/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <div className="bg-green-500 text-black px-4 py-2 rounded-lg flex items-center gap-2">
                    <span className="text-sm font-medium">Visit Website</span>
                    <ExternalLink className="w-4 h-4" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Thumbnail navigation */}
        {websites.length > 1 && (
          <div className="flex gap-2 mt-2 justify-center">
            {websites.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`w-2 h-2 rounded-full transition-all ${
                  idx === currentIndex 
                    ? 'bg-green-500 w-6' 
                    : 'bg-gray-600 hover:bg-gray-500'
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default WebsitePreview;