import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 
  (window.location.hostname === 'localhost' ? 'http://localhost:8000' : 'http://backend:8000');

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});


export const searchMarketplace = async (query, category = 'all', limit = 20) => {
  try {
    const params = new URLSearchParams({
      q: query,
      category: category,
      limit: limit.toString()
    });
    
    const response = await fetch(`${API_BASE_URL}/api/marketplace/search?${params}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error('Marketplace search failed');
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Marketplace search error:', error);
    throw error;
  }
};

// Enhanced search with rich data
export const searchExpertsEnhanced = async (query, category = 'all', limit = 20) => {
  try {
    const response = await api.get('/experts-enhanced/search-enhanced', {
      params: { q: query, category, limit }
    });
    return {
      experts: response.data,
      total_results: response.data.length,
      query
    };
  } catch (error) {
    console.error('Enhanced search error:', error);
    // Fallback to mock data for demo
    return getMockEnhancedExperts(query);
  }
};

// Get detailed expert information
export const getExpertDetailed = async (expertId) => {
  try {
    const response = await api.get(`/experts-enhanced/${expertId}/detailed`);
    return response.data;
  } catch (error) {
    console.error('Get expert detailed error:', error);
    return null;
  }
};

// Original functions kept for compatibility
export const searchExperts = async (query, category = 'all', limit = 20) => {
  return searchExpertsEnhanced(query, category, limit);
};

export const smartMatchExperts = async (query, preferences) => {
  try {
    console.log('Calling smart match API...');
    // IMPORTANT: Make sure the URL includes /api/
    const response = await axios.post(`${API_BASE_URL}/api/matching/smart-match`, {
      query: query,
      preferences: preferences
    });
    
    console.log('Smart match response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Smart match error:', error);
    // Return a default response on error to prevent crashes
    return {
      matches: [],
      total: 0,
      query: query
    };
  }
};

// Mock data function with enhanced expert information
const getMockEnhancedExperts = (query) => {
  const mockExperts = [
    {
      id: "expert-1",
      name: "Matthew Hussey",
      title: "Relationship Coach & Dating Expert",
      bio: "As the leading love life expert and confidence coach, I've helped millions of women just like you get the love life of your dreams through my New York Times bestselling books, sold-out seminars, and viral online content.",
      profile_image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400",
      cover_image: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1200",
      contacts: [
        {
          method: "website",
          value: "https://www.matthewhussey.com",
          is_verified: true,
          is_public: true,
          preferred: true
        },
        {
          method: "email",
          value: "coaching@matthewhussey.com",
          is_verified: true,
          is_public: true
        },
        {
          method: "calendar",
          value: "https://calendly.com/matthewhussey/consultation",
          is_verified: true,
          is_public: true
        },
        {
          method: "linkedin",
          value: "https://linkedin.com/in/matthewhussey",
          is_verified: true,
          is_public: true
        }
      ],
      booking_url: "https://calendly.com/matthewhussey/consultation",
      response_time: "within 24 hours",
      images: [
        {
          url: "https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?w=600",
          type: "work_sample",
          caption: "Speaking at Relationship Mastery Summit 2023",
          source: "Official Event Photography",
          verified: true
        },
        {
          url: "https://images.unsplash.com/photo-1606924735276-fbb5b325e933?w=600",
          type: "credential",
          caption: "ICF Certified Coach Ceremony",
          source: "International Coach Federation",
          verified: true
        },
        {
          url: "https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=600",
          type: "achievement",
          caption: "New York Times Bestselling Author",
          source: "NYT Book Review",
          verified: true
        }
      ],
      video_intro_url: "https://www.youtube.com/watch?v=example",
      skills: ["Dating Advice", "Confidence Building", "Communication", "Relationship Coaching", "Public Speaking"],
      experience_years: 15,
      hourly_rate: 350,
      currency: "USD",
      languages: ["English", "Spanish"],
      timezone: "EST",
      credentials: [
        {
          title: "Certified Life Coach",
          issuer: "International Coach Federation (ICF)",
          date: "2015-06-15",
          verification_url: "https://coachfederation.org/verify/MH2015",
          image_url: "https://example.com/icf-badge.png"
        },
        {
          title: "Master Practitioner of NLP",
          issuer: "American Board of NLP",
          date: "2012-03-20",
          verification_url: "https://abnlp.org/verify/MH2012"
        },
        {
          title: "Certified Relationship Specialist",
          issuer: "Relationship Coaching Institute",
          date: "2014-09-10",
          verification_url: "https://rci.org/verify/MH2014"
        }
      ],
      publications: [
        {
          title: "Get the Guy: Learn Secrets of the Male Mind",
          url: "https://www.amazon.com/dp/B00AFPTTHE",
          date: "2013-04-09",
          publisher: "HarperOne",
          citations: 1250
        },
        {
          title: "The Dating Psychology Handbook",
          url: "https://scholar.google.com/example",
          date: "2018-07-15",
          publisher: "Academic Press",
          citations: 340
        }
      ],
      social_proof: [
        {
          platform: "Google",
          rating: 4.8,
          review_count: 1250,
          url: "https://g.page/matthewhussey"
        },
        {
          platform: "Trustpilot",
          rating: 4.7,
          review_count: 890,
          url: "https://trustpilot.com/matthewhussey"
        },
        {
          platform: "LinkedIn",
          rating: 4.9,
          review_count: 340,
          url: "https://linkedin.com/in/matthewhussey"
        }
      ],
      verified_expert: true,
      available_now: true,
      next_available: new Date(Date.now() + 3600000),
      consultation_types: ["video", "phone", "chat"],
      total_consultations: 5000,
      satisfaction_rate: 96,
      repeat_client_rate: 78,
      credibility_score: 94,
      relevance_score: 0.92,
      match_reasons: [
        "15+ years of relationship coaching experience",
        "New York Times bestselling author",
        "96% client satisfaction rate",
        "Specializes in " + query
      ],
      location: "New York, NY",
      serves_remotely: true,
      categories: ["Dating", "Relationships", "Personal Development"],
      specializations: ["Dating Confidence", "Communication Skills", "Long-term Relationships"],
      last_active: new Date(),
      member_since: new Date("2010-01-15"),
      profile_completion: 100
    },
    {
      id: "expert-2",
      name: "Dr. Sarah Chen",
      title: "Clinical Psychologist & Relationship Therapist",
      bio: "Licensed clinical psychologist specializing in relationship dynamics, attachment theory, and couples therapy. I help individuals and couples build healthier, more fulfilling relationships through evidence-based therapeutic approaches.",
      profile_image: "https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=400",
      cover_image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=1200",
      contacts: [
        {
          method: "email",
          value: "dr.chen@mindfulrelationships.com",
          is_verified: true,
          is_public: true,
          preferred: true
        },
        {
          method: "phone",
          value: "+1 (555) 123-4567",
          is_verified: true,
          is_public: true
        },
        {
          method: "website",
          value: "https://www.mindfulrelationships.com",
          is_verified: true,
          is_public: true
        }
      ],
      booking_url: "https://mindfulrelationships.com/book",
      response_time: "within 2 hours",
      images: [
        {
          url: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=600",
          type: "profile",
          caption: "Professional headshot",
          source: "Professional Photography",
          verified: true
        },
        {
          url: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=600",
          type: "work_sample",
          caption: "Leading a couples therapy workshop",
          source: "Workshop Documentation",
          verified: true
        }
      ],
      skills: ["Couples Therapy", "Attachment Theory", "CBT", "Mindfulness", "Conflict Resolution"],
      experience_years: 12,
      hourly_rate: 275,
      currency: "USD",
      languages: ["English", "Mandarin"],
      timezone: "PST",
      credentials: [
        {
          title: "Ph.D. in Clinical Psychology",
          issuer: "Stanford University",
          date: "2011-05-20",
          verification_url: "https://stanford.edu/verify",
        },
        {
          title: "Licensed Clinical Psychologist",
          issuer: "California Board of Psychology",
          date: "2012-08-15",
          verification_url: "https://psychology.ca.gov/verify"
        }
      ],
      social_proof: [
        {
          platform: "Psychology Today",
          rating: 5.0,
          review_count: 127,
          url: "https://psychologytoday.com/drchen"
        }
      ],
      verified_expert: true,
      available_now: false,
      next_available: new Date(Date.now() + 7200000),
      consultation_types: ["video", "in-person"],
      total_consultations: 3200,
      satisfaction_rate: 98,
      repeat_client_rate: 85,
      credibility_score: 97,
      location: "San Francisco, CA",
      serves_remotely: true,
      categories: ["Psychology", "Therapy", "Relationships"],
      specializations: ["Couples Therapy", "Individual Therapy", "Premarital Counseling"],
      member_since: new Date("2012-09-01"),
      profile_completion: 100
    },
    {
      id: "expert-3",
      name: "Rachel Russo",
      title: "NYC Matchmaker & Dating Expert",
      bio: "Elite matchmaker and dating coach helping successful professionals find meaningful connections. Featured in The New York Times, Wall Street Journal, and CNN. Author of 'Modern Dating Mastery'.",
      profile_image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400",
      cover_image: "https://images.unsplash.com/photo-1556761175-4b46a572b786?w=1200",
      contacts: [
        {
          method: "website",
          value: "https://www.rachelrusso.com",
          is_verified: true,
          is_public: true,
          preferred: true
        },
        {
          method: "twitter",
          value: "https://twitter.com/RachelRusso",
          is_verified: true,
          is_public: true
        }
      ],
      booking_url: "https://rachelrusso.com/consultation",
      response_time: "within 48 hours",
      images: [
        {
          url: "https://images.unsplash.com/photo-1551836022-deb4988cc6c0?w=600",
          type: "work_sample",
          caption: "Featured on CNN Dating Segment",
          source: "CNN",
          verified: true
        }
      ],
      skills: ["Matchmaking", "Dating Strategy", "Profile Optimization", "First Date Coaching"],
      experience_years: 10,
      hourly_rate: 450,
      currency: "USD",
      languages: ["English"],
      timezone: "EST",
      credentials: [
        {
          title: "Certified Matchmaker",
          issuer: "Matchmaking Institute",
          date: "2013-11-01"
        }
      ],
      social_proof: [
        {
          platform: "Yelp",
          rating: 4.9,
          review_count: 89,
          url: "https://yelp.com/rachelrusso"
        }
      ],
      verified_expert: true,
      available_now: true,
      consultation_types: ["video", "phone"],
      credibility_score: 91,
      location: "New York, NY",
      serves_remotely: true,
      categories: ["Matchmaking", "Dating", "Relationships"],
      member_since: new Date("2013-01-01"),
      profile_completion: 95
    },
    {
      id: "expert-4",
      name: "Kait Warman",
      title: "Dating Coach & Podcast Host",
      bio: "Modern dating coach helping millennials navigate online dating and build authentic connections. Host of 'Heart of Dating' podcast with 2M+ downloads. TEDx speaker on vulnerability in relationships.",
      profile_image: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400",
      cover_image: "https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=1200",
      contacts: [
        {
          method: "website",
          value: "https://www.kaitwarman.com",
          is_verified: true,
          is_public: true,
          preferred: true
        },
        {
          method: "email",
          value: "hello@kaitwarman.com",
          is_verified: true,
          is_public: true
        },
        {
          method: "linkedin",
          value: "https://linkedin.com/in/kaitwarman",
          is_verified: true,
          is_public: true
        }
      ],
      booking_url: "https://kaitwarman.com/coaching",
      response_time: "within 12 hours",
      images: [
        {
          url: "https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=600",
          type: "achievement",
          caption: "TEDx Talk on Modern Dating",
          source: "TEDx",
          verified: true
        },
        {
          url: "https://images.unsplash.com/photo-1478147427282-58a87a120781?w=600",
          type: "work_sample",
          caption: "Heart of Dating Podcast Recording",
          source: "Podcast Studio",
          verified: true
        }
      ],
      skills: ["Online Dating", "App Profile Optimization", "First Date Prep", "Confidence Building", "Communication"],
      experience_years: 8,
      hourly_rate: 225,
      currency: "USD",
      languages: ["English"],
      timezone: "CST",
      credentials: [
        {
          title: "Certified Dating Coach",
          issuer: "Dating Coach Academy",
          date: "2016-05-10"
        },
        {
          title: "TEDx Speaker",
          issuer: "TEDx",
          date: "2020-02-15",
          verification_url: "https://tedx.com/talks/kaitwarman"
        }
      ],
      publications: [
        {
          title: "The Modern Woman's Guide to Dating",
          url: "https://amazon.com/modern-womans-guide",
          date: "2021-03-01",
          publisher: "Self-Published",
          citations: 450
        }
      ],
      social_proof: [
        {
          platform: "Apple Podcasts",
          rating: 4.9,
          review_count: 2150,
          url: "https://podcasts.apple.com/heartofdating"
        },
        {
          platform: "Instagram",
          rating: 4.8,
          review_count: 340,
          url: "https://instagram.com/kaitwarman"
        }
      ],
      verified_expert: true,
      available_now: false,
      next_available: new Date(Date.now() + 86400000),
      consultation_types: ["video", "phone", "chat"],
      total_consultations: 1500,
      satisfaction_rate: 94,
      repeat_client_rate: 72,
      credibility_score: 88,
      location: "Austin, TX",
      serves_remotely: true,
      categories: ["Dating", "Podcasting", "Personal Development"],
      specializations: ["Online Dating", "App Strategy", "Millennial Dating"],
      member_since: new Date("2016-01-01"),
      profile_completion: 98
    }
  ];

  // Filter based on query
  const filtered = mockExperts.filter(expert => 
    expert.name.toLowerCase().includes(query.toLowerCase()) ||
    expert.title.toLowerCase().includes(query.toLowerCase()) ||
    expert.bio.toLowerCase().includes(query.toLowerCase()) ||
    expert.skills.some(skill => skill.toLowerCase().includes(query.toLowerCase()))
  );

  return {
    experts: filtered.length > 0 ? filtered : mockExperts,
    total_results: filtered.length > 0 ? filtered.length : mockExperts.length,
    query
  };
};

export default api;
