import React, { useState } from 'react';
import { Box, TextField, Button, Select, MenuItem, FormControl, InputLabel } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';

function SearchBar({ onSearch }) {
  const [query, setQuery] = useState('');
  const [source, setSource] = useState('all');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query, source);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', gap: 2, my: 3 }}>
      <TextField
        fullWidth
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search for experts (e.g., 'geospatial AI expert')"
        variant="outlined"
      />
      
      <FormControl sx={{ minWidth: 120 }}>
        <InputLabel>Source</InputLabel>
        <Select
          value={source}
          onChange={(e) => setSource(e.target.value)}
          label="Source"
        >
          <MenuItem value="all">All</MenuItem>
          <MenuItem value="linkedin">LinkedIn</MenuItem>
          <MenuItem value="scholar">Scholar</MenuItem>
        </Select>
      </FormControl>
      
      <Button
        type="submit"
        variant="contained"
        startIcon={<SearchIcon />}
        sx={{ minWidth: 120 }}
      >
        Search
      </Button>
    </Box>
  );
}

export default SearchBar;
