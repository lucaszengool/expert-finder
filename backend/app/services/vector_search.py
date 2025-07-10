"""Vector search service using ChromaDB"""
import os
import chromadb
from chromadb.config import Settings

class VectorSearchService:
    def __init__(self):
        self.client = None
        self.linkedin_collection = None
        self.scholar_collection = None
        self._initialized = False
    
    def init_collections(self):
        """Initialize ChromaDB collections"""
        if self._initialized:
            return
        
        try:
            # Initialize ChromaDB client with telemetry disabled
            self.client = chromadb.PersistentClient(
                path="./chroma_db",
                settings=Settings(anonymized_telemetry=False)
            )
            
            # Get or create collections
            try:
                self.linkedin_collection = self.client.get_collection("linkedin_experts")
                print("linkedin_experts collection already exists")
            except:
                self.linkedin_collection = self.client.create_collection("linkedin_experts")
                print("Created linkedin_experts collection")
            
            try:
                self.scholar_collection = self.client.get_collection("scholar_experts")
                print("scholar_experts collection already exists")
            except:
                self.scholar_collection = self.client.create_collection("scholar_experts")
                print("Created scholar_experts collection")
            
            self._initialized = True
            
        except Exception as e:
            print(f"Warning: Could not initialize ChromaDB: {e}")
            # Continue without vector search in testing mode
            if os.getenv("TESTING") == "true":
                self._initialized = True
            else:
                raise

# Global instance
vector_search_service = VectorSearchService()
