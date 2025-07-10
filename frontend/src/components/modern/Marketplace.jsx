import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, Users, DollarSign, Filter, Search } from 'lucide-react';
import { searchMarketplace } from '../../services/api';

const MarketplaceOffering = ({ offering, onBook }) => {
  const typeColors = {
    workshop: 'bg-blue/10 text-blue',
    consultation: 'bg-green/10 text-green',
    course: 'bg-purple/10 text-purple',
    mentorship: 'bg-yellow/10 text-yellow',
  };

  return (
    <motion.div
      whileHover={{ y: -4 }}
      className="card hover:border-gray-600 transition-all"
    >
      <div className="flex justify-between items-start mb-4">
        <span className={`px-2 py-1 text-xs font-medium rounded ${typeColors[offering.type] || 'bg-gray-800 text-gray-400'}`}>
          {offering.type}
        </span>
        <span className="text-2xl font-bold">${offering.price}</span>
      </div>

      <h3 className="text-lg font-semibold mb-2">{offering.title}</h3>
      <p className="text-sm text-gray-400 mb-2">by {offering.expertName}</p>
      <p className="text-xs text-gray-500 mb-4">{offering.description}</p>

      <div className="space-y-2 mb-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500 flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Duration
          </span>
          <span>{offering.duration}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500 flex items-center gap-2">
            <Users className="w-4 h-4" />
            Format
          </span>
          <span>{offering.participants}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500 flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Next Available
          </span>
          <span className="text-green">{offering.nextAvailable}</span>
        </div>
      </div>

      <button 
        onClick={() => onBook(offering)}
        className="w-full btn-secondary"
      >
        View Details
      </button>
    </motion.div>
  );
};

const Marketplace = () => {
  const [offerings, setOfferings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    type: '',
    maxPrice: '',
    skill: ''
  });

  useEffect(() => {
    fetchOfferings();
  }, [filters]);

  const fetchOfferings = async () => {
    setLoading(true);
    try {
      const data = await searchMarketplace(filters);
      setOfferings(data);
    } catch (error) {
      console.error('Failed to fetch offerings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBook = (offering) => {
    // Handle booking logic
    console.log('Booking:', offering);
  };

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-3xl font-bold mb-2">Expert Marketplace</h2>
        <p className="text-gray-400">Book workshops, consultations, and specialized services</p>
      </div>

      {/* Filters */}
      <div className="mb-6 flex gap-4">
        <select 
          className="input"
          value={filters.type}
          onChange={(e) => setFilters({...filters, type: e.target.value})}
        >
          <option value="">All Types</option>
          <option value="consultation">Consultation</option>
          <option value="workshop">Workshop</option>
          <option value="course">Course</option>
          <option value="mentorship">Mentorship</option>
        </select>

        <input
          type="number"
          placeholder="Max Price"
          className="input"
          value={filters.maxPrice}
          onChange={(e) => setFilters({...filters, maxPrice: e.target.value})}
        />

        <input
          type="text"
          placeholder="Skill or Topic"
          className="input flex-1"
          value={filters.skill}
          onChange={(e) => setFilters({...filters, skill: e.target.value})}
        />
      </div>

      {/* Offerings Grid */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {offerings.map((offering) => (
            <MarketplaceOffering 
              key={offering.id} 
              offering={offering}
              onBook={handleBook}
            />
          ))}
        </div>
      )}

      {!loading && offerings.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          No offerings found matching your criteria
        </div>
      )}
    </div>
  );
};

export default Marketplace;
