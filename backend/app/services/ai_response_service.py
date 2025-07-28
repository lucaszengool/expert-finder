# AI Response Handler Service
import asyncio
from typing import Dict, Any, List, Optional, Tuple
from datetime import datetime, timedelta
import json
import re
from sqlalchemy.orm import Session
from sqlalchemy import and_
import openai
from langchain.chat_models import ChatOpenAI
from langchain.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain.schema import HumanMessage, AIMessage, SystemMessage
from langchain.memory import ConversationBufferWindowMemory
import nltk
from nltk.sentiment import SentimentIntensityAnalyzer
import spacy

from ..models.outreach_db_models import (
    OutreachCampaign as DBCampaign,
    OutreachTarget as DBTarget,
    OutreachMessage as DBMessage,
    Conversation as DBConversation,
    AIAgent as DBAIAgent,
    ConversationFlow as DBConversationFlow,
    AutoResponse as DBAutoResponse,
    MessageStatusEnum, ConversationStageEnum, ChannelEnum
)
from ..models.outreach_enhanced import ResponseType, ConversationStage

# Initialize NLP tools
try:
    nltk.download('vader_lexicon', quiet=True)
    sia = SentimentIntensityAnalyzer()
    nlp = spacy.load("en_core_web_sm")
except:
    print("Warning: NLP tools not fully initialized")

class AIResponseService:
    def __init__(self):
        self.llm = ChatOpenAI(temperature=0.7, model="gpt-4")
        self.memories = {}  # conversation_id -> memory
        
    async def create_agent(self, db: Session, agent_config: Dict[str, Any]) -> DBAIAgent:
        """Create an AI agent for a campaign"""
        agent = DBAIAgent(
            campaign_id=agent_config["campaign_id"],
            personality=agent_config.get("personality", "professional"),
            tone=agent_config.get("tone", "friendly"),
            objectives=agent_config.get("objectives", []),
            knowledge_base=agent_config.get("knowledge_base", {}),
            response_templates=agent_config.get("response_templates", {}),
            objection_handlers=agent_config.get("objection_handlers", {}),
            escalation_triggers=agent_config.get("escalation_triggers", []),
            max_messages_per_conversation=agent_config.get("max_messages_per_conversation", 10),
            response_time_range=agent_config.get("response_time_range", {"min": 300, "max": 1800})
        )
        
        db.add(agent)
        db.commit()
        db.refresh(agent)
        
        return agent
    
    async def configure_agent(
        self, db: Session, config: Dict[str, Any], user_id: str
    ) -> Dict[str, Any]:
        """Configure or update AI agent"""
        # Verify campaign ownership
        campaign = db.query(DBCampaign).filter(
            and_(
                DBCampaign.id == config["campaign_id"],
                DBCampaign.user_id == user_id
            )
        ).first()
        
        if not campaign:
            raise ValueError("Campaign not found")
        
        # Check if agent exists
        agent = db.query(DBAIAgent).filter(
            DBAIAgent.campaign_id == config["campaign_id"]
        ).first()
        
        if agent:
            # Update existing
            for key, value in config.items():
                if hasattr(agent, key) and key != "campaign_id":
                    setattr(agent, key, value)
        else:
            # Create new
            agent = await self.create_agent(db, config)
        
        db.commit()
        
        return {
            "agent_id": agent.id,
            "campaign_id": agent.campaign_id,
            "configured": True
        }
    
    async def process_incoming_message(
        self, campaign_id: str, target_id: str, message_data: Dict[str, Any]
    ):
        """Process incoming message and generate response"""
        db = Session()
        try:
            # Get or create conversation
            conversation = await self._get_or_create_conversation(
                db, target_id, message_data["channel"]
            )
            
            # Store incoming message
            incoming_msg = DBMessage(
                campaign_id=campaign_id,
                target_id=target_id,
                conversation_id=conversation.id,
                channel=ChannelEnum[message_data["channel"]],
                content=message_data["content"],
                status=MessageStatusEnum.REPLIED,
                replied_at=datetime.utcnow(),
                reply_content=message_data["content"]
            )
            db.add(incoming_msg)
            db.commit()
            
            # Analyze message
            analysis = await self._analyze_message(message_data["content"])
            
            # Check for auto-responses
            auto_response = await self._check_auto_responses(
                db, campaign_id, analysis
            )
            
            if auto_response:
                # Use auto-response
                response_content = auto_response["content"]
                actions = auto_response["actions"]
            else:
                # Generate AI response
                agent = db.query(DBAIAgent).filter(
                    DBAIAgent.campaign_id == campaign_id
                ).first()
                
                if not agent:
                    return  # No AI agent configured
                
                response_content = await self._generate_ai_response(
                    db, conversation, agent, message_data["content"], analysis
                )
                actions = []
            
            # Apply response delay
            delay = await self._calculate_response_delay(agent)
            await asyncio.sleep(delay)
            
            # Send response
            response_msg = DBMessage(
                campaign_id=campaign_id,
                target_id=target_id,
                conversation_id=conversation.id,
                channel=ChannelEnum[message_data["channel"]],
                content=response_content,
                status=MessageStatusEnum.QUEUED
            )
            db.add(response_msg)
            
            # Update conversation stage
            new_stage = await self._determine_conversation_stage(
                db, conversation, analysis
            )
            conversation.stage = new_stage
            
            # Update target
            target = db.query(DBTarget).filter(DBTarget.id == target_id).first()
            if target:
                target.last_contacted_at = datetime.utcnow()
                target.conversation_stage = new_stage
                
                # Update lead score
                target.lead_score = await self._calculate_lead_score(
                    db, target, conversation, analysis
                )
            
            # Execute actions
            for action in actions:
                await self._execute_action(db, action, target, conversation)
            
            db.commit()
            
            # Queue message for sending
            # This would trigger the outreach service to send the message
            
        except Exception as e:
            print(f"Error processing message: {e}")
            db.rollback()
        finally:
            db.close()
    
    async def _analyze_message(self, content: str) -> Dict[str, Any]:
        """Analyze incoming message for intent, sentiment, entities"""
        analysis = {
            "content": content,
            "sentiment": None,
            "intent": None,
            "entities": [],
            "keywords": [],
            "response_type": ResponseType.POSITIVE
        }
        
        # Sentiment analysis
        try:
            sentiment_scores = sia.polarity_scores(content)
            analysis["sentiment"] = {
                "compound": sentiment_scores["compound"],
                "positive": sentiment_scores["pos"],
                "negative": sentiment_scores["neg"],
                "neutral": sentiment_scores["neu"]
            }
            
            # Determine response type based on sentiment and keywords
            if sentiment_scores["compound"] < -0.5:
                analysis["response_type"] = ResponseType.NEGATIVE
            elif sentiment_scores["compound"] > 0.5:
                analysis["response_type"] = ResponseType.POSITIVE
        except:
            pass
        
        # Intent detection
        content_lower = content.lower()
        
        if any(word in content_lower for word in ["unsubscribe", "stop", "remove me", "opt out"]):
            analysis["intent"] = "unsubscribe"
            analysis["response_type"] = ResponseType.UNSUBSCRIBE
        elif any(word in content_lower for word in ["meeting", "call", "schedule", "calendar", "book"]):
            analysis["intent"] = "schedule_meeting"
            analysis["response_type"] = ResponseType.SCHEDULE_MEETING
        elif any(word in content_lower for word in ["price", "cost", "how much", "pricing", "quote"]):
            analysis["intent"] = "pricing_inquiry"
            analysis["response_type"] = ResponseType.REQUEST_INFO
        elif "?" in content:
            analysis["intent"] = "question"
            analysis["response_type"] = ResponseType.QUESTION
        
        # Entity extraction
        try:
            doc = nlp(content)
            for ent in doc.ents:
                analysis["entities"].append({
                    "text": ent.text,
                    "type": ent.label_
                })
            
            # Extract keywords (nouns and proper nouns)
            analysis["keywords"] = [
                token.text for token in doc
                if token.pos_ in ["NOUN", "PROPN"] and not token.is_stop
            ]
        except:
            pass
        
        return analysis
    
    async def _generate_ai_response(
        self, db: Session, conversation: DBConversation,
        agent: DBAIAgent, user_message: str, analysis: Dict[str, Any]
    ) -> str:
        """Generate AI response based on context and configuration"""
        # Get conversation history
        messages = db.query(DBMessage).filter(
            DBMessage.conversation_id == conversation.id
        ).order_by(DBMessage.created_at).limit(10).all()
        
        # Build conversation memory
        memory_key = conversation.id
        if memory_key not in self.memories:
            self.memories[memory_key] = ConversationBufferWindowMemory(
                k=10, return_messages=True
            )
        
        memory = self.memories[memory_key]
        
        # Get target info for context
        target = db.query(DBTarget).filter(DBTarget.id == conversation.target_id).first()
        
        # Build system prompt
        system_prompt = f"""
        You are an AI assistant with the following characteristics:
        - Personality: {agent.personality}
        - Tone: {agent.tone}
        - Objectives: {', '.join(agent.objectives)}
        
        You are having a conversation with {target.name}, who is a {target.title} at {target.company}.
        Current conversation stage: {conversation.stage.value}
        
        Context about the prospect:
        {json.dumps(target.profile_data, indent=2)}
        
        Campaign knowledge base:
        {json.dumps(agent.knowledge_base, indent=2)}
        
        Guidelines:
        1. Stay focused on the objectives
        2. Be concise and valuable
        3. Use the specified tone consistently
        4. Move the conversation forward based on the current stage
        5. If asked about pricing or specific details not in the knowledge base, 
           suggest scheduling a call with a human representative
        """
        
        # Check for specific response templates
        response_type = analysis["response_type"].value
        if response_type in agent.response_templates:
            templates = agent.response_templates[response_type]
            if templates:
                # Use template but personalize it
                template = templates[0]  # Could randomize
                prompt = f"""
                Use this template as a guide for your response:
                {template}
                
                Personalize it based on the conversation context and the user's message: "{user_message}"
                """
            else:
                prompt = f"Respond appropriately to: {user_message}"
        else:
            prompt = f"Respond appropriately to: {user_message}"
        
        # Handle objections
        if analysis["intent"] == "objection":
            for objection, handler in agent.objection_handlers.items():
                if objection.lower() in user_message.lower():
                    prompt += f"\n\nAddress this objection using this approach: {handler}"
        
        # Generate response
        messages = [
            SystemMessage(content=system_prompt),
            HumanMessage(content=prompt)
        ]
        
        response = await self.llm.apredict_messages(messages)
        
        # Save to memory
        memory.save_context(
            {"input": user_message},
            {"output": response.content}
        )
        
        return response.content
    
    async def _check_auto_responses(
        self, db: Session, campaign_id: str, analysis: Dict[str, Any]
    ) -> Optional[Dict[str, Any]]:
        """Check if any auto-response rules match"""
        auto_responses = db.query(DBAutoResponse).filter(
            and_(
                DBAutoResponse.campaign_id == campaign_id,
                DBAutoResponse.is_active == True
            )
        ).all()
        
        for auto_resp in auto_responses:
            # Check trigger type
            if auto_resp.trigger_type != analysis["response_type"].value:
                continue
            
            # Check keywords
            if auto_resp.trigger_keywords:
                content_lower = analysis["content"].lower()
                if not any(kw.lower() in content_lower for kw in auto_resp.trigger_keywords):
                    continue
            
            # Match found
            return {
                "content": auto_resp.response_template,
                "actions": auto_resp.actions
            }
        
        return None
    
    async def _calculate_response_delay(self, agent: Optional[DBAIAgent]) -> int:
        """Calculate realistic response delay"""
        if not agent:
            return 5  # Default 5 seconds
        
        import random
        min_delay = agent.response_time_range.get("min", 300)
        max_delay = agent.response_time_range.get("max", 1800)
        
        # Add some randomness to make it more human-like
        delay = random.randint(min_delay, max_delay)
        
        # Adjust based on time of day (respond faster during business hours)
        current_hour = datetime.utcnow().hour
        if 9 <= current_hour <= 17:  # Business hours UTC
            delay = int(delay * 0.5)
        elif current_hour < 7 or current_hour > 22:  # Night time
            delay = int(delay * 2)
        
        return delay
    
    async def _determine_conversation_stage(
        self, db: Session, conversation: DBConversation, analysis: Dict[str, Any]
    ) -> ConversationStageEnum:
        """Determine new conversation stage based on analysis"""
        current_stage = conversation.stage
        
        # Stage progression logic
        if analysis["intent"] == "unsubscribe":
            return ConversationStageEnum.FOLLOW_UP
        
        if analysis["intent"] == "schedule_meeting":
            if current_stage in [ConversationStageEnum.INITIAL_CONTACT, ConversationStageEnum.QUALIFICATION]:
                return ConversationStageEnum.DISCOVERY
            elif current_stage == ConversationStageEnum.DISCOVERY:
                return ConversationStageEnum.PROPOSAL
        
        if analysis["response_type"] == ResponseType.POSITIVE:
            # Progress to next stage
            stage_progression = {
                ConversationStageEnum.INITIAL_CONTACT: ConversationStageEnum.QUALIFICATION,
                ConversationStageEnum.QUALIFICATION: ConversationStageEnum.DISCOVERY,
                ConversationStageEnum.DISCOVERY: ConversationStageEnum.PROPOSAL,
                ConversationStageEnum.PROPOSAL: ConversationStageEnum.NEGOTIATION,
                ConversationStageEnum.NEGOTIATION: ConversationStageEnum.CLOSING
            }
            return stage_progression.get(current_stage, current_stage)
        
        return current_stage
    
    async def _calculate_lead_score(
        self, db: Session, target: DBTarget,
        conversation: DBConversation, analysis: Dict[str, Any]
    ) -> float:
        """Calculate lead score based on engagement and behavior"""
        score = target.lead_score
        
        # Positive indicators
        if analysis["response_type"] == ResponseType.POSITIVE:
            score += 10
        if analysis["intent"] == "schedule_meeting":
            score += 20
        if analysis["intent"] == "pricing_inquiry":
            score += 15
        
        # Engagement frequency
        recent_messages = db.query(DBMessage).filter(
            and_(
                DBMessage.target_id == target.id,
                DBMessage.created_at >= datetime.utcnow() - timedelta(days=7)
            )
        ).count()
        
        if recent_messages > 5:
            score += 10
        
        # Stage progression
        stage_scores = {
            ConversationStageEnum.QUALIFICATION: 10,
            ConversationStageEnum.DISCOVERY: 20,
            ConversationStageEnum.PROPOSAL: 30,
            ConversationStageEnum.NEGOTIATION: 40,
            ConversationStageEnum.CLOSING: 50
        }
        score += stage_scores.get(conversation.stage, 0)
        
        # Negative indicators
        if analysis["response_type"] == ResponseType.NEGATIVE:
            score -= 20
        if analysis["intent"] == "unsubscribe":
            score = 0
        
        # Cap at 100
        return min(max(score, 0), 100)
    
    async def _execute_action(
        self, db: Session, action: Dict[str, Any],
        target: DBTarget, conversation: DBConversation
    ):
        """Execute automated actions"""
        action_type = action.get("type")
        
        if action_type == "update_crm":
            # Update CRM fields
            fields = action.get("fields", {})
            for key, value in fields.items():
                if hasattr(target, key):
                    setattr(target, key, value)
        
        elif action_type == "add_tag":
            # Add tag to target
            tag = action.get("tag")
            if tag and tag not in target.tags:
                target.tags.append(tag)
        
        elif action_type == "notify_team":
            # Send notification (would integrate with notification service)
            pass
        
        elif action_type == "schedule_followup":
            # Schedule follow-up
            days = action.get("days", 3)
            target.next_followup_at = datetime.utcnow() + timedelta(days=days)
        
        elif action_type == "escalate":
            # Mark for human intervention
            conversation.ai_agent_id = None  # Remove AI agent
            target.tags.append("needs_human_review")
    
    async def _get_or_create_conversation(
        self, db: Session, target_id: str, channel: str
    ) -> DBConversation:
        """Get or create conversation for target and channel"""
        conversation = db.query(DBConversation).filter(
            and_(
                DBConversation.target_id == target_id,
                DBConversation.channel == ChannelEnum[channel],
                DBConversation.is_active == True
            )
        ).first()
        
        if not conversation:
            # Get campaign ID from target
            target = db.query(DBTarget).filter(DBTarget.id == target_id).first()
            if not target:
                raise ValueError("Target not found")
            
            # Get AI agent for campaign
            agent = db.query(DBAIAgent).filter(
                DBAIAgent.campaign_id == target.campaign_id
            ).first()
            
            conversation = DBConversation(
                target_id=target_id,
                channel=ChannelEnum[channel],
                stage=ConversationStageEnum.INITIAL_CONTACT,
                is_active=True,
                ai_agent_id=agent.id if agent else None
            )
            db.add(conversation)
            db.commit()
            db.refresh(conversation)
        
        return conversation