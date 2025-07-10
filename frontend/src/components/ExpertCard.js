import React from 'react';
import { Card, CardContent, Typography, Box, Chip, LinearProgress, Button } from '@mui/material';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import SchoolIcon from '@mui/icons-material/School';

function ExpertCard({ expert }) {
  const credibilityColor = (score) => {
    if (score >= 80) return 'success';
    if (score >= 60) return 'warning';
    return 'error';
  };

  return (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
          <Box>
            <Typography variant="h6" component="h3">
              {expert.name}
            </Typography>
            <Typography color="text.secondary" gutterBottom>
              {expert.title} {expert.organization && `at ${expert.organization}`}
            </Typography>
            
            {expert.location && (
              <Typography variant="body2" color="text.secondary">
                📍 {expert.location}
              </Typography>
            )}
            
            {expert.bio && (
              <Typography variant="body2" sx={{ mt: 1 }}>
                {expert.bio}
              </Typography>
            )}
            
            <Box sx={{ mt: 1 }}>
              {expert.skills.map((skill, index) => (
                <Chip
                  key={index}
                  label={skill}
                  size="small"
                  sx={{ mr: 0.5, mb: 0.5 }}
                />
              ))}
            </Box>
          </Box>
          
          <Box sx={{ minWidth: 150, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Credibility Score
            </Typography>
            <Typography variant="h4" color={`${credibilityColor(expert.credibility_score)}.main`}>
              {Math.round(expert.credibility_score || 0)}%
            </Typography>
            <LinearProgress
              variant="determinate"
              value={expert.credibility_score || 0}
              color={credibilityColor(expert.credibility_score)}
              sx={{ mt: 1 }}
            />
          </Box>
        </Box>
        
        <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
          {expert.linkedin_url && (
            <Button
              size="small"
              startIcon={<LinkedInIcon />}
              href={expert.linkedin_url}
              target="_blank"
            >
              LinkedIn
            </Button>
          )}
          {expert.scholar_url && (
            <Button
              size="small"
              startIcon={<SchoolIcon />}
              href={expert.scholar_url}
              target="_blank"
            >
              Scholar
            </Button>
          )}
        </Box>
        
        <Box sx={{ mt: 1, display: 'flex', gap: 2 }}>
          {expert.experience_years && (
            <Typography variant="caption" color="text.secondary">
              {expert.experience_years} years experience
            </Typography>
          )}
          {expert.education_level && (
            <Typography variant="caption" color="text.secondary">
              {expert.education_level}
            </Typography>
          )}
          {expert.citations && (
            <Typography variant="caption" color="text.secondary">
              {expert.citations} citations
            </Typography>
          )}
        </Box>
      </CardContent>
    </Card>
  );
}

export default ExpertCard;
