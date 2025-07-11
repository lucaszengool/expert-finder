# app/services/ai_service.py
import os
from typing import Dict, Optional
import logging

logger = logging.getLogger(__name__)

class AIService:
    def __init__(self):
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            logger.warning("OpenAI API key not found. AI features will be limited.")
            self.client = None
        else:
            try:
                # For OpenAI 1.35.0
                import openai
                openai.api_key = api_key
                # Store the module reference for new style
                self.openai = openai
                # For compatibility with new client style
                try:
                    from openai import OpenAI
                    # Don't pass proxies parameter
                    self.client = OpenAI(
                        api_key=api_key,
                        # Remove any proxy-related parameters
                    )
                except Exception as e:
                    logger.warning(f"New client style failed, using legacy mode: {str(e)}")
                    self.client = None
            except Exception as e:
                logger.error(f"Failed to initialize OpenAI: {str(e)}")
                self.client = None
                self.openai = None
        
    async def modify_email(
        self, 
        original_email: str, 
        prompt: str, 
        context: Optional[Dict] = None
    ) -> str:
        """
        Modify an email using OpenAI GPT based on user prompt
        """
        if not self.client and not self.openai:
            logger.warning("OpenAI not initialized. Using fallback modification.")
            return self._fallback_modify(original_email, prompt)
            
        try:
            # Build the system prompt
            system_prompt = """You are an expert email writer. Modify the given email based on the user's instructions.
            Maintain the core message while applying the requested changes.
            Keep the modified email professional and appropriate.
            
            Common modifications:
            - "make it shorter" or "concise": Keep only essential information, reduce to 5-7 lines
            - "more formal" or "professional": Use formal language, proper salutations
            - "more casual" or "friendly": Use conversational tone, informal greetings
            - "add urgency": Emphasize time sensitivity, use ASAP/urgent language
            - "more detailed": Add context, expand on key points
            """
            
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
            
            # Try new client style first
            if self.client:
                try:
                    response = self.client.chat.completions.create(
                        model="gpt-3.5-turbo",
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
                    logger.warning(f"New client style failed: {str(e)}, trying legacy mode")
            
            # Fallback to legacy OpenAI style for v1.35.0
            if self.openai:
                try:
                    import openai
                    response = openai.ChatCompletion.create(
                        model="gpt-3.5-turbo",
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
                    logger.error(f"Legacy OpenAI call failed: {str(e)}")
            
            # If both fail, use fallback
            return self._fallback_modify(original_email, prompt)
            
        except Exception as e:
            logger.error(f"Error modifying email with AI: {str(e)}")
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
                "Hey ": "Dear ",
                " gonna ": " going to ",
                " wanna ": " want to ",
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
                "Thank you": "Thanks",
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
        
        elif "detail" in prompt_lower or "specific" in prompt_lower:
            # Add more details
            lines = original_email.split('\n')
            detail_addition = "\n\nAdditional Details:\n- Budget flexibility for the right expert\n- Open to both short-term consultation and long-term engagement\n- Can provide detailed project documentation upon request\n"
            
            # Find where to insert details (before the closing)
            for i in range(len(lines)-1, -1, -1):
                if any(closing in lines[i] for closing in ['regards', 'Sincerely', 'Best', 'Thanks']):
                    lines.insert(i, detail_addition)
                    break
            
            return '\n'.join(lines)
        
        else:
            # Generic modification - add a note about the request
            return original_email + f"\n\nP.S. {prompt}"

# Create singleton instance with error handling
def create_ai_service():
    try:
        return AIService()
    except Exception as e:
        logger.error(f"Failed to create AIService: {str(e)}")
        # Return a dummy service that only uses fallback
        class DummyAIService:
            def __init__(self):
                self.client = None
                self.openai = None
                
            async def modify_email(self, original_email: str, prompt: str, context: Optional[Dict] = None) -> str:
                return AIService()._fallback_modify(self, original_email, prompt)
        
        return DummyAIService()

ai_service = create_ai_service()