import React from 'react';
import { Box, Typography } from '@mui/material';
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import ExpertCard from './ExpertCard';
import 'react-tabs/style/react-tabs.css';

function ExpertResults({ results }) {
  const linkedinExperts = results.experts.filter(e => e.source === 'linkedin');
  const scholarExperts = results.experts.filter(e => e.source === 'scholar');

  return (
    <Box sx={{ mt: 3 }}>
      <Typography variant="h5" gutterBottom>
        Found {results.total_results} experts
      </Typography>
      
      <Tabs>
        <TabList>
          <Tab>All ({results.experts.length})</Tab>
          <Tab>LinkedIn ({linkedinExperts.length})</Tab>
          <Tab>Scholar ({scholarExperts.length})</Tab>
        </TabList>

        <TabPanel>
          <Box sx={{ display: 'grid', gap: 2, mt: 2 }}>
            {results.experts.map((expert) => (
              <ExpertCard key={expert.id} expert={expert} />
            ))}
          </Box>
        </TabPanel>

        <TabPanel>
          <Box sx={{ display: 'grid', gap: 2, mt: 2 }}>
            {linkedinExperts.map((expert) => (
              <ExpertCard key={expert.id} expert={expert} />
            ))}
          </Box>
        </TabPanel>

        <TabPanel>
          <Box sx={{ display: 'grid', gap: 2, mt: 2 }}>
            {scholarExperts.map((expert) => (
              <ExpertCard key={expert.id} expert={expert} />
            ))}
          </Box>
        </TabPanel>
      </Tabs>
    </Box>
  );
}

export default ExpertResults;
