from sentence_transformers import SentenceTransformer
import os
from dotenv import load_dotenv

load_dotenv()

EMBEDDING_MODEL = "all-MiniLM-L6-v2"
MODEL_CACHE_DIR = os.getenv("MODEL_CACHE_DIR", "./models")

class EmbeddingGenerator:
    def __init__(self):
        os.makedirs(MODEL_CACHE_DIR, exist_ok=True)
        self.model = SentenceTransformer(
            EMBEDDING_MODEL,
            cache_folder=MODEL_CACHE_DIR
        )
    
    def generate_embedding(self, text: str):
        return self.model.encode(text).tolist()
    
    def generate_embeddings(self, texts: list):
        return self.model.encode(texts).tolist()

embedding_generator = EmbeddingGenerator()
