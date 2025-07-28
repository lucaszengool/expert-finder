# Lightweight AI Service for Railway deployment
import openai
from typing import Dict, Any, List, Optional
from datetime import datetime
import json
import re
import asyncio

class AIServiceLite:
    """Lightweight AI service using only OpenAI API"""
    
    def __init__(self):
        self.client = openai.AsyncOpenAI()
    
    async def generate_content(self, prompt: str, context: Dict[str, Any] = None) -> Dict[str, str]:
        """Generate content using OpenAI API"""
        try:
            messages = [
                {"role": "system", "content": "You are a professional outreach assistant."},
                {"role": "user", "content": prompt}
            ]
            
            if context:
                context_str = json.dumps(context, indent=2)
                messages.insert(1, {
                    "role": "system", 
                    "content": f"Context: {context_str}"
                })
            
            response = await self.client.chat.completions.create(
                model="gpt-4",
                messages=messages,
                max_tokens=500,
                temperature=0.7
            )
            
            content = response.choices[0].message.content
            
            # Simple parsing for email content
            lines = content.split('\n')
            subject = ""
            body = content
            
            for line in lines:
                if line.startswith("Subject:") or line.startswith("SUBJECT:"):
                    subject = line.split(":", 1)[1].strip()
                    body = content.replace(line, "").strip()
                    break
            
            return {
                "content": body,
                "subject": subject or "Personalized Message"
            }
            
        except Exception as e:
            print(f"AI generation error: {e}")
            return {
                "content": "Hello! I'd like to connect with you.",
                "subject": "Connection Request"
            }
    
    async def analyze_sentiment(self, text: str) -> Dict[str, Any]:
        """Simple sentiment analysis using OpenAI"""
        try:
            response = await self.client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {
                        "role": "system",
                        "content": "Analyze the sentiment of the following message. Respond with only: positive, negative, or neutral."
                    },
                    {"role": "user", "content": text}
                ],
                max_tokens=10,
                temperature=0
            )
            
            sentiment = response.choices[0].message.content.lower().strip()
            
            return {
                "sentiment": sentiment,
                "confidence": 0.8,  # Placeholder confidence
                "compound": 0.5 if sentiment == "positive" else -0.5 if sentiment == "negative" else 0.0
            }
            
        except Exception as e:
            print(f"Sentiment analysis error: {e}")
            return {
                "sentiment": "neutral",
                "confidence": 0.5,
                "compound": 0.0
            }
    
    async def extract_entities(self, text: str) -> List[Dict[str, str]]:
        """Simple entity extraction"""
        entities = []
        
        # Simple regex patterns for common entities
        email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
        phone_pattern = r'\b\d{3}[-.]?\d{3}[-.]?\d{4}\b'
        url_pattern = r'http[s]?://(?:[a-zA-Z]|[0-9]|[$-_@.&+]|[!*\\(\\),]|(?:%[0-9a-fA-F][0-9a-fA-F]))+'
        
        # Find emails
        emails = re.findall(email_pattern, text)
        for email in emails:
            entities.append({"text": email, "type": "EMAIL"})
        
        # Find phone numbers
        phones = re.findall(phone_pattern, text)
        for phone in phones:
            entities.append({"text": phone, "type": "PHONE"})
        
        # Find URLs
        urls = re.findall(url_pattern, text)
        for url in urls:
            entities.append({"text": url, "type": "URL"})
        
        return entities
    
    async def classify_response_type(self, text: str) -> str:
        """Classify response type"""
        text_lower = text.lower()
        
        # Simple keyword-based classification
        if any(word in text_lower for word in ["interested", "yes", "great", "love", "awesome", "perfect"]):
            return "positive"
        elif any(word in text_lower for word in ["not interested", "no", "busy", "remove", "unsubscribe"]):
            return "negative"
        elif any(word in text_lower for word in ["when", "how", "what", "where", "why", "?"]):
            return "question"
        elif any(word in text_lower for word in ["price", "cost", "expensive", "budget", "$"]):
            return "pricing_inquiry"
        elif any(word in text_lower for word in ["meeting", "call", "schedule", "calendar", "time"]):
            return "schedule_meeting"
        else:
            return "neutral"
    
    async def generate_response(
        self, 
        original_message: str,
        context: Dict[str, Any],
        response_type: str = "neutral"
    ) -> str:
        """Generate an appropriate response based on context"""
        try:
            prompt = f"""
            You received this message: "{original_message}"
            
            Context: {json.dumps(context, indent=2)}
            Response type: {response_type}
            
            Generate a professional, helpful response that:
            1. Acknowledges their message
            2. Provides value
            3. Moves the conversation forward
            4. Matches their tone and energy level
            
            Keep it concise and personal.
            """
            
            response = await self.client.chat.completions.create(
                model="gpt-4",
                messages=[
                    {"role": "system", "content": "You are a professional outreach specialist."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=300,
                temperature=0.7
            )
            
            return response.choices[0].message.content
            
        except Exception as e:
            print(f"Response generation error: {e}")
            return "Thank you for your message! I'll get back to you soon."