import os
import hashlib
import json
from typing import List, Union
from dotenv import load_dotenv

load_dotenv()

# Try to import sentence_transformers, fallback to simple embeddings
try:
    from sentence_transformers import SentenceTransformer
    SENTENCE_TRANSFORMERS_AVAILABLE = True
    print("✅ SentenceTransformers available")
except ImportError:
    SENTENCE_TRANSFORMERS_AVAILABLE = False
    print("⚠️ SentenceTransformers not available, using fallback embeddings")

EMBEDDING_MODEL = "all-MiniLM-L6-v2"
MODEL_CACHE_DIR = os.getenv("MODEL_CACHE_DIR", "./models")

class SimpleEmbeddingGenerator:
    """Fallback embedding generator using simple text features"""
    
    def __init__(self):
        print("🔧 Using simple text-based embeddings (fallback)")
    
    def _text_to_vector(self, text: str, dim: int = 384) -> List[float]:
        """Convert text to a simple feature vector"""
        if not text:
            return [0.0] * dim
            
        # Normalize text
        text = text.lower().strip()
        
        # Simple features
        features = []
        
        # Length features
        features.append(len(text) / 1000.0)  # Text length
        features.append(len(text.split()) / 100.0)  # Word count
        
        # Character frequency features (first 26 for a-z)
        char_counts = [0] * 26
        for char in text:
            if 'a' <= char <= 'z':
                char_counts[ord(char) - ord('a')] += 1
        
        # Normalize character counts
        total_chars = sum(char_counts) or 1
        char_freqs = [count / total_chars for count in char_counts]
        features.extend(char_freqs)
        
        # Hash-based features for remaining dimensions
        text_hash = hashlib.md5(text.encode()).hexdigest()
        for i in range(dim - len(features)):
            hash_val = int(text_hash[i % len(text_hash)], 16) / 15.0
            features.append(hash_val)
        
        return features[:dim]
    
    def generate_embedding(self, text: str) -> List[float]:
        return self._text_to_vector(text)
    
    def generate_embeddings(self, texts: List[str]) -> List[List[float]]:
        return [self._text_to_vector(text) for text in texts]

class EmbeddingGenerator:
    def __init__(self):
        if SENTENCE_TRANSFORMERS_AVAILABLE:
            try:
                os.makedirs(MODEL_CACHE_DIR, exist_ok=True)
                self.model = SentenceTransformer(
                    EMBEDDING_MODEL,
                    cache_folder=MODEL_CACHE_DIR
                )
                self.use_transformers = True
                print(f"✅ SentenceTransformer loaded: {EMBEDDING_MODEL}")
            except Exception as e:
                print(f"⚠️ Failed to load SentenceTransformer: {e}")
                self.model = SimpleEmbeddingGenerator()
                self.use_transformers = False
        else:
            self.model = SimpleEmbeddingGenerator()
            self.use_transformers = False
    
    def generate_embedding(self, text: str) -> List[float]:
        if self.use_transformers:
            return self.model.encode(text).tolist()
        else:
            return self.model.generate_embedding(text)
    
    def generate_embeddings(self, texts: List[str]) -> List[List[float]]:
        if self.use_transformers:
            return self.model.encode(texts).tolist()
        else:
            return self.model.generate_embeddings(texts)

embedding_generator = EmbeddingGenerator()
