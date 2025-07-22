import openai
import os
from typing import List, Dict, Any
import json
from sqlalchemy.orm import Session
from app.models.outreach import EmailExample, EmailTemplate
from app.models.db_models import EmailTemplateDB
import re

class EmailLearningService:
    def __init__(self):
        # Get API key from environment
        api_key = os.getenv("OPENAI_API_KEY")
        
        # Initialize OpenAI client properly
        if api_key:
            # For newer versions of openai library (1.0+)
            try:
                from openai import OpenAI
                self.openai_client = OpenAI(api_key=api_key)
            except Exception as e:
                # Fallback for older versions
                openai.api_key = api_key
                self.openai_client = None
        else:
            print("Warning: OPENAI_API_KEY not found in environment variables")
            self.openai_client = None
    
    async def learn_from_examples(
        self,
        examples: List[EmailExample],
        db: Session
    ) -> EmailTemplate:
        """Learn patterns from email examples and create a template"""
        
        # Analyze examples with GPT-4
        analysis_prompt = self._build_analysis_prompt(examples)
        
        response = self.openai_client.chat.completions.create(
            model="gpt-4",
            messages=[
                {
                    "role": "system",
                    "content": "You are an expert at analyzing successful email patterns and creating reusable templates."
                },
                {
                    "role": "user",
                    "content": analysis_prompt
                }
            ],
            temperature=0.3
        )
        
        # Parse the response
        analysis = json.loads(response.choices[0].message.content)
        
        # Create template
        template_data = {
            "name": f"Learned Template - {analysis['category']}",
            "category": analysis['category'],
            "subject_pattern": analysis['subject_pattern'],
            "body_pattern": analysis['body_pattern'],
            "variables": analysis['variables'],
            "tone": analysis['tone'],
            "learned_from_count": len(examples)
        }
        
        # Save to database
        db_template = EmailTemplateDB(**template_data)
        db.add(db_template)
        db.commit()
        db.refresh(db_template)
        
        return EmailTemplate(
            id=db_template.id,
            **template_data
        )
    
    def _build_analysis_prompt(self, examples: List[EmailExample]) -> str:
        """Build prompt for analyzing email examples"""
        prompt = "Analyze these successful email examples and extract patterns:\n\n"
        
        for idx, example in enumerate(examples):
            prompt += f"Example {idx + 1}:\n"
            prompt += f"Subject: {example.subject}\n"
            prompt += f"Body: {example.body}\n"
            if example.outcome:
                prompt += f"Outcome: {example.outcome}\n"
            prompt += "\n"
        
        prompt += """
        Please analyze and return a JSON object with:
        1. "category": The type of email (cold_outreach, follow_up, negotiation, etc.)
        2. "subject_pattern": A template for subject lines with {{variables}}
        3. "body_pattern": A template for email body with {{variables}}
        4. "variables": List of variable names used in the patterns
        5. "tone": The overall tone (professional, friendly, casual, etc.)
        6. "key_elements": List of key persuasive elements found
        
        Use {{variable_name}} format for placeholders in patterns.
        """
        
        return prompt
    
    async def personalize_email(
        self,
        template: EmailTemplate,
        target: Dict[str, Any],
        context: Dict[str, Any]
    ) -> Dict[str, str]:
        """Personalize email template for a specific target"""
        
        # Build personalization prompt
        prompt = f"""
        Personalize this email template for the target:
        
        Template Subject: {template.subject_pattern}
        Template Body: {template.body_pattern}
        
        Target Information:
        - Name: {target.get('name')}
        - Title: {target.get('title')}
        - Company: {target.get('company')}
        - Type: {target.get('type')}
        - Additional Info: {json.dumps(target.get('data', {}))}
        
        Context:
        {json.dumps(context)}
        
        Generate a personalized subject and body. Return as JSON with "subject" and "body" keys.
        Make it sound natural and engaging, not templated.
        """
        
        response = self.openai_client.chat.completions.create(
            model="gpt-4",
            messages=[
                {
                    "role": "system",
                    "content": "You are an expert at personalizing outreach emails to get responses."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            temperature=0.7
        )
        
        return json.loads(response.choices[0].message.content)

# Create singleton instance
email_learning_service = EmailLearningService()