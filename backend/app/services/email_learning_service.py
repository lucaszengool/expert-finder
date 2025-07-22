# backend/app/services/email_learning_service.py
import openai
import re
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from app.models.outreach import EmailExample, EmailTemplate, EmailCategory
from app.models.db_models import EmailExampleDB, EmailTemplateDB
import json
from datetime import datetime
import numpy as np
from sentence_transformers import SentenceTransformer

class EmailLearningService:
    """Service for learning from email examples and generating templates"""
    
    def __init__(self):
        self.openai_client = openai.Client()
        self.embedding_model = SentenceTransformer('all-MiniLM-L6-v2')
        
    async def learn_from_examples(
        self, 
        examples: List[EmailExample],
        db: Session
    ) -> EmailTemplate:
        """Learn patterns from email examples and create a template"""
        
        # Extract patterns from successful examples
        successful_examples = [ex for ex in examples if ex.success]
        
        if not successful_examples:
            raise ValueError("Need at least one successful example to learn from")
        
        # Analyze patterns using AI
        patterns = await self._extract_patterns(successful_examples)
        
        # Generate template
        template_content = await self._generate_template(patterns, successful_examples)
        
        # Create embeddings for similarity matching
        embeddings = self._create_embeddings(successful_examples)
        
        # Store template
        template_db = EmailTemplateDB(
            name=f"Learned Template - {datetime.now().strftime('%Y%m%d_%H%M%S')}",
            category=successful_examples[0].category,
            template_content=template_content,
            learned_patterns=patterns,
            success_rate=0.0,
            usage_count=0
        )
        
        db.add(template_db)
        
        # Store examples
        for example in examples:
            features = await self._extract_features(example)
            example_db = EmailExampleDB(
                category=example.category,
                subject=example.subject,
                content=example.content,
                success=example.success,
                metadata=example.metadata,
                extracted_features=features
            )
            db.add(example_db)
        
        db.commit()
        db.refresh(template_db)
        
        return EmailTemplate.from_orm(template_db)
    
    async def _extract_patterns(self, examples: List[EmailExample]) -> Dict[str, Any]:
        """Extract common patterns from successful emails"""
        
        # Prepare examples for analysis
        examples_text = "\n\n---\n\n".join([
            f"Subject: {ex.subject}\nContent: {ex.content}"
            for ex in examples
        ])
        
        prompt = f"""Analyze these successful email examples and extract common patterns:

{examples_text}

Extract and return as JSON:
1. Common opening patterns
2. Value proposition patterns
3. Call-to-action patterns
4. Tone and style characteristics
5. Personalization elements used
6. Subject line patterns
7. Key phrases that appear frequently
8. Structure/flow of the emails
"""
        
        response = self.openai_client.chat.completions.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": "You are an expert at analyzing email patterns."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.3
        )
        
        patterns = json.loads(response.choices[0].message.content)
        return patterns
    
    async def _generate_template(
        self, 
        patterns: Dict[str, Any], 
        examples: List[EmailExample]
    ) -> str:
        """Generate a template based on extracted patterns"""
        
        prompt = f"""Based on these patterns extracted from successful emails:

{json.dumps(patterns, indent=2)}

Create a flexible email template that incorporates these patterns.
Use placeholders like {{recipient_name}}, {{company_name}}, {{value_proposition}}, etc.

The template should:
1. Follow the successful structure identified
2. Include the winning phrases and patterns
3. Be easily personalizable
4. Maintain the effective tone and style
"""
        
        response = self.openai_client.chat.completions.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": "You are an expert email copywriter."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.5
        )
        
        return response.choices[0].message.content
    
    async def _extract_features(self, example: EmailExample) -> Dict[str, Any]:
        """Extract features from a single email example"""
        
        features = {
            "word_count": len(example.content.split()),
            "sentence_count": len(example.content.split('.')),
            "question_count": example.content.count('?'),
            "personalization_count": len(re.findall(r'\{[^}]+\}', example.content)),
            "cta_present": any(phrase in example.content.lower() for phrase in [
                'schedule a call', 'book a meeting', 'let\'s chat', 'reply to this email'
            ]),
            "urgency_words": sum(1 for word in ['limited', 'exclusive', 'now', 'today'] 
                               if word in example.content.lower()),
            "subject_length": len(example.subject.split()),
            "has_social_proof": any(phrase in example.content.lower() for phrase in [
                'clients include', 'worked with', 'testimonial', 'case study'
            ])
        }
        
        return features
    
    def _create_embeddings(self, examples: List[EmailExample]) -> List[List[float]]:
        """Create embeddings for email examples"""
        texts = [f"{ex.subject} {ex.content}" for ex in examples]
        embeddings = self.embedding_model.encode(texts)
        return embeddings.tolist()
    
    async def personalize_email(
        self,
        template: EmailTemplate,
        target_info: Dict[str, Any],
        campaign_context: Dict[str, Any]
    ) -> str:
        """Personalize an email template for a specific target"""
        
        # Extract personalization data
        personalization_data = {
            "recipient_name": target_info.get("name", "there"),
            "company_name": target_info.get("company", "your company"),
            "role": target_info.get("title", ""),
            "location": target_info.get("location", ""),
            "skills": ", ".join(target_info.get("skills", [])[:3]),
            "mutual_connection": self._find_mutual_connection(target_info),
            "recent_achievement": await self._find_recent_achievement(target_info),
            "pain_point": self._identify_pain_point(target_info, campaign_context),
            "value_proposition": campaign_context.get("value_proposition", ""),
            "sender_name": campaign_context.get("sender_name", ""),
            "sender_title": campaign_context.get("sender_title", ""),
            "company": campaign_context.get("company", "")
        }
        
        # Use AI to generate personalized version
        prompt = f"""Personalize this email template for the recipient:

Template:
{template.template_content}

Recipient Information:
{json.dumps(target_info, indent=2)}

Personalization Data:
{json.dumps(personalization_data, indent=2)}

Campaign Context:
{json.dumps(campaign_context, indent=2)}

Generate a personalized email that:
1. Sounds natural and human
2. References specific details about the recipient
3. Clearly communicates the value proposition
4. Has a clear call-to-action
5. Maintains the successful patterns from the template
"""
        
        response = self.openai_client.chat.completions.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": "You are an expert at personalizing outreach emails."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7
        )
        
        return response.choices[0].message.content
    
    def _find_mutual_connection(self, target_info: Dict[str, Any]) -> Optional[str]:
        """Find potential mutual connections"""
        # This would integrate with LinkedIn API or your network data
        # For now, returning None
        return None
    
    async def _find_recent_achievement(self, target_info: Dict[str, Any]) -> Optional[str]:
        """Find recent achievements or news about the target"""
        # This would search recent news, social media, etc.
        # For now, returning a placeholder
        if target_info.get("linkedin_url"):
            return "your recent post about AI innovation"
        return None
    
    def _identify_pain_point(
        self, 
        target_info: Dict[str, Any], 
        campaign_context: Dict[str, Any]
    ) -> str:
        """Identify likely pain points based on target profile"""
        role = target_info.get("title", "").lower()
        company_size = target_info.get("company_size", "")
        
        pain_points = {
            "cto": "scaling technical infrastructure efficiently",
            "ceo": "driving growth while managing resources",
            "marketing": "generating qualified leads cost-effectively",
            "sales": "shortening sales cycles and improving conversion",
            "hr": "attracting and retaining top talent"
        }
        
        for key, pain_point in pain_points.items():
            if key in role:
                return pain_point
        
        return "achieving your business goals more efficiently"
    
    async def analyze_email_performance(
        self,
        email_id: str,
        response: Optional[str],
        outcome: str,
        db: Session
    ) -> None:
        """Analyze email performance and update template success rates"""
        
        # Get the email and its template
        email = db.query(OutreachEmailDB).filter_by(id=email_id).first()
        if not email or not email.template_id:
            return
        
        template = db.query(EmailTemplateDB).filter_by(id=email.template_id).first()
        if not template:
            return
        
        # Update template metrics
        template.usage_count += 1
        
        if outcome == "positive_response":
            # Calculate new success rate
            current_successes = template.success_rate * (template.usage_count - 1)
            template.success_rate = (current_successes + 1) / template.usage_count
        else:
            # Decrease success rate
            current_successes = template.success_rate * (template.usage_count - 1)
            template.success_rate = current_successes / template.usage_count
        
        # If we have a response, learn from it
        if response:
            await self._learn_from_response(email.content, response, outcome, db)
        
        db.commit()
    
    async def _learn_from_response(
        self,
        sent_email: str,
        response: str,
        outcome: str,
        db: Session
    ) -> None:
        """Learn from email responses to improve future emails"""
        
        prompt = f"""Analyze this email exchange:

Sent Email:
{sent_email}

Response:
{response}

Outcome: {outcome}

What can we learn from this exchange to improve future emails?
Provide insights on:
1. What worked well
2. What didn't work
3. Suggested improvements
4. Response sentiment and key objections
"""
        
        response = self.openai_client.chat.completions.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": "You are an expert at analyzing email effectiveness."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.3
        )
        
        insights = response.choices[0].message.content
        
        # Store insights for future reference
        # This could be stored in a separate insights table
        # or added to the template's learned_patterns
        pass

# Singleton instance
email_learning_service = EmailLearningService()