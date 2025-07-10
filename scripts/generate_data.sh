#!/bin/bash

echo "Generating sample data..."

cd backend
source venv/bin/activate
python data_processing/sample_data_generator.py

echo "Sample data generation complete!"
