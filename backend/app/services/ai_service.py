# app/services/ai_service.py
import os
from typing import Dict, Optional
import openai
from openai import OpenAI
import logging

logger = logging.getLogger(__name__)

class AIService:
    def __init__(self):
        self.client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        
    async def modify_email(
        self, 
        original_email: str, 
        prompt: str, 
        context: Optional[Dict] = None
    ) -> str:
        """
        Modify an email using OpenAI GPT based on user prompt
        """
        try:
            # Build the system prompt
            system_prompt = """You are an expert email writer. Modify the given email based on the user's instructions.
            Maintain the core message while applying the requested changes.
            Keep the modified email professional and appropriate."""
            
            # Build the user prompt with context
            user_message = f"""
            Original Email:
            {original_email}
            
            Modification Request: {prompt}
            """
            
            if context:
                user_message += f"\n\nContext:\n"
                if 'expertName' in context:
                    user_message += f"- Recipient: {context['expertName']}\n"
                if 'expertSkills' in context:
                    user_message += f"- Expert Skills: {', '.join(context['expertSkills'])}\n"
            
            # Call OpenAI API
            response = self.client.chat.completions.create(
                model="gpt-4-turbo-preview",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_message}
                ],
                temperature=0.7,
                max_tokens=1000
            )
            
            modified_email = response.choices[0].message.content.strip()
            return modified_email
            
        except Exception as e:
            logger.error(f"Error modifying email with AI: {str(e)}")
            # Fallback to simple modifications
            return self._fallback_modify(original_email, prompt)
    
    def _fallback_modify(self, original_email: str, prompt: str) -> str:
        """
        Fallback email modification without AI
        """
        prompt_lower = prompt.lower()
        
        if "shorter" in prompt_lower or "concise" in prompt_lower:
            # Make it shorter - keep only essential parts
            lines = original_email.split('\n')
            essential_indices = [0, 1]  # Greeting and first line
            
            # Find key lines
            for i, line in enumerate(lines):
                if any(keyword in line.lower() for keyword in ['duration:', 'budget:', 'available', 'timeline:']):
                    essential_indices.append(i)
            
            # Add closing
            if len(lines) > 2:
                essential_indices.extend([len(lines)-2, len(lines)-1])
            
            essential_indices = sorted(set(essential_indices))
            shortened = []
            for i in essential_indices:
                if i < len(lines):
                    shortened.append(lines[i])
            
            return '\n'.join(shortened)
        
        elif "formal" in prompt_lower or "professional" in prompt_lower:
            formal_replacements = {
                "Hi ": "Dear ",
                "Hello ": "Dear ",
                "I'm ": "I am ",
                "I'd ": "I would ",
                "I'll ": "I will ",
                "thanks": "thank you",
                "Thanks": "Thank you",
                "Best,": "Sincerely,",
                "Cheers,": "Best regards,",
            }
            
            modified = original_email
            for informal, formal in formal_replacements.items():
                modified = modified.replace(informal, formal)
            return modified
        
        elif "casual" in prompt_lower or "friendly" in prompt_lower:
            casual_replacements = {
                "Dear ": "Hi ",
                "I am ": "I'm ",
                "I would ": "I'd ",
                "I will ": "I'll ",
                "Sincerely,": "Thanks!",
                "Best regards,": "Cheers,",
            }
            
            modified = original_email
            for formal, casual in casual_replacements.items():
                modified = modified.replace(formal, casual)
            return modified
        
        elif "urgent" in prompt_lower:
            lines = original_email.split('\n')
            # Add urgency to the beginning
            urgent_intro = "URGENT: Time-sensitive consultation request\n\n"
            
            # Modify timeline mentions
            modified_lines = []
            for line in lines:
                if "timeline" in line.lower():
                    modified_lines.append("Timeline: URGENT - Need to start ASAP")
                elif "flexible" in line.lower():
                    modified_lines.append(line.replace("Flexible", "As soon as possible"))
                else:
                    modified_lines.append(line)
            
            return urgent_intro + '\n'.join(modified_lines)
        
        else:
            # Generic modification - add a note about the request
            return original_email + f"\n\nP.S. {prompt}"

# Singleton instance
ai_service = AIService()