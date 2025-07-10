import React from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Video, Zap, ChevronRight, Star, Users, Clock } from 'lucide-react';

const LearningHub = () => {
  const features = [
    {
      icon: BookOpen,
      title: 'Knowledge Base',
      description: 'Access captured insights from thousands of expert consultations',
      color: 'text-green',
      bgColor: 'bg-green/10',
      link: '/knowledge-base'
    },
    {
      icon: Video,
      title: 'Live Q&A Sessions',
      description: 'Join live sessions with industry experts every week',
      color: 'text-blue',
      bgColor: 'bg-blue/10',
      link: '/live-sessions'
    },
    {
      icon: Zap,
      title: 'Micro-Courses',
      description: 'Quick, actionable lessons from top experts in every field',
      color: 'text-purple',
      bgColor: 'bg-purple/10',
      link: '/courses'
    }
  ];

  const popularCourses = [
    {
      id: 1,
      title: 'Introduction to Deep Learning',
      instructor: 'Dr. Sarah Chen',
      type: 'Course',
      duration: '6 weeks',
      enrolled: 1234,
      rating: 4.9
    },
    {
      id: 2,
      title: 'Scaling Your Startup',
      instructor: 'Michael Rodriguez',
      type: 'Masterclass',
      duration: '3 hours',
      enrolled: 856,
      rating: 4.8
    },
    {
      id: 3,
      title: 'DeFi Fundamentals',
      instructor: 'Dr. Emily Watson',
      type: 'Workshop',
      duration: '2 days',
      enrolled: 432,
      rating: 4.7
    }
  ];

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-3xl font-bold mb-2">Learning Hub</h2>
        <p className="text-gray-400">Expert insights, micro-courses, and knowledge base</p>
      </div>

      {/* Feature Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        {features.map((feature, idx) => (
          <motion.div
            key={idx}
            whileHover={{ y: -4 }}
            className="card hover:border-gray-600 transition-all cursor-pointer"
          >
            <div className={`w-12 h-12 ${feature.bgColor} rounded-lg flex items-center justify-center mb-4`}>
              <feature.icon className={`w-6 h-6 ${feature.color}`} />
            </div>
            <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
            <p className="text-sm text-gray-400 mb-4">{feature.description}</p>
            <button className={`${feature.color} text-sm font-medium flex items-center gap-1 hover:gap-2 transition-all`}>
              <span>Explore</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </motion.div>
        ))}
      </div>

      {/* Popular Courses */}
      <div>
        <h3 className="text-xl font-semibold mb-4">Popular Courses</h3>
        <div className="space-y-4">
          {popularCourses.map((course) => (
            <motion.div
              key={course.id}
              whileHover={{ x: 4 }}
              className="bg-gray-900 rounded-lg border border-gray-700 p-4 flex items-center justify-between hover:border-gray-600 transition-all cursor-pointer"
            >
              <div>
                <h4 className="font-medium mb-1">{course.title}</h4>
                <p className="text-sm text-gray-400">
                  by {course.instructor} • {course.duration}
                </p>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-1 mb-1">
                  <Star className="w-4 h-4 text-yellow fill-current" />
                  <span className="text-sm font-medium">{course.rating}</span>
                </div>
                <p className="text-xs text-gray-500 flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  {course.enrolled} enrolled
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Call to Action */}
      <div className="mt-12 bg-gradient-to-r from-green/20 to-blue/20 rounded-xl p-8 text-center">
        <h3 className="text-2xl font-bold mb-4">Ready to Start Learning?</h3>
        <p className="text-gray-300 mb-6">
          Join thousands of professionals upgrading their skills with expert-led content
        </p>
        <button className="btn-primary">
          Browse All Courses
        </button>
      </div>
    </div>
  );
};

export default LearningHub;
