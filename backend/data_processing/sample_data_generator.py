import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.models.expert import Expert
from app.services.expert_service import expert_service
import uuid

def generate_sample_data():
    """Generate sample expert data for testing"""
    
    sample_experts = [
        Expert(
            id=str(uuid.uuid4()),
            name="Dr. Jane Smith",
            title="Senior AI Researcher",
            organization="Tech University",
            location="San Francisco, CA",
            bio="Leading researcher in machine learning and natural language processing",
            skills=["Machine Learning", "NLP", "Deep Learning", "Python", "TensorFlow"],
            experience_years=15,
            education_level="PhD",
            citations=2500,
            linkedin_url="https://linkedin.com/in/janesmith",
            source="linkedin"
        ),
        Expert(
            id=str(uuid.uuid4()),
            name="Prof. John Doe",
            title="Professor of Computer Science",
            organization="Stanford University",
            location="Palo Alto, CA",
            bio="Expert in distributed systems and cloud computing",
            skills=["Distributed Systems", "Cloud Computing", "Kubernetes", "Go", "System Design"],
            experience_years=20,
            education_level="PhD",
            citations=5000,
            scholar_url="https://scholar.google.com/citations?user=johndoe",
            source="scholar"
        ),
        Expert(
            id=str(uuid.uuid4()),
            name="Sarah Johnson",
            title="Data Science Lead",
            organization="Big Tech Corp",
            location="Seattle, WA",
            bio="Specializing in big data analytics and predictive modeling",
            skills=["Data Science", "Big Data", "Spark", "Python", "Machine Learning"],
            experience_years=10,
            education_level="Masters",
            citations=500,
            linkedin_url="https://linkedin.com/in/sarahjohnson",
            source="linkedin"
        ),
        Expert(
            id=str(uuid.uuid4()),
            name="Dr. Michael Chen",
            title="AI Ethics Researcher",
            organization="MIT",
            location="Cambridge, MA",
            bio="Focusing on ethical AI and responsible machine learning",
            skills=["AI Ethics", "Machine Learning", "Philosophy", "Python", "Research"],
            experience_years=8,
            education_level="PhD",
            citations=1200,
            scholar_url="https://scholar.google.com/citations?user=michaelchen",
            source="scholar"
        ),
        Expert(
            id=str(uuid.uuid4()),
            name="Emily Rodriguez",
            title="Geospatial AI Engineer",
            organization="Geospatial Tech Inc",
            location="Austin, TX",
            bio="Expert in geospatial analysis and AI applications in mapping",
            skills=["Geospatial Analysis", "AI", "GIS", "Python", "Remote Sensing"],
            experience_years=12,
            education_level="Masters",
            citations=800,
            linkedin_url="https://linkedin.com/in/emilyrodriguez",
            source="linkedin"
        )
    ]
    
    for expert in sample_experts:
        try:
            expert_service.add_expert(expert, source=expert.source)
            print(f"Added expert: {expert.name}")
        except Exception as e:
            print(f"Error adding expert {expert.name}: {e}")

if __name__ == "__main__":
    generate_sample_data()
    print("Sample data generation complete!")
