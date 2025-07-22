# backend/app/services/outreach_automation_service.py
import asyncio
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
import openai
from sqlalchemy.orm import Session
import uuid
import re
from app.models.outreach import (
    OutreachCampaign, OutreachTarget, OutreachEmail,
    EmailThread, Negotiation, ScheduledMeeting,
    NegotiationState, TargetStatus, EmailCategory
)
from app.models.db_models import (
    OutreachCampaignDB, OutreachTargetDB, OutreachEmailDB,
    EmailThreadDB, NegotiationDB, ScheduledMeetingDB
)
from app.services.email_learning_service import email_learning_service
from app.services.email_service import email_service
import json

class OutreachAutomationService:
    """Service for automated outreach and negotiation"""
    
    def __init__(self):
        self.openai_client = openai.Client()
        self.email_service = email_service
        
    async def create_campaign(
        self,
        campaign_data: Dict[str, Any],
        targets: List[Dict[str, Any]],
        db: Session
    ) -> OutreachCampaign:
        """Create a new outreach campaign"""
        
        # Create campaign
        campaign_db = OutreachCampaignDB(
            id=str(uuid.uuid4()),
            name=campaign_data['name'],
            description=campaign_data.get('description'),
            search_query=campaign_data['search_query'],
            target_type=campaign_data['target_type'],
            goals=campaign_data['goals'],
            requirements=campaign_data.get('requirements', {}),
            budget=campaign_data.get('budget'),
            template_id=campaign_data.get('template_id'),
            status='draft',
            created_by=campaign_data['created_by']
        )
        db.add(campaign_db)
        
        # Add targets
        for target in targets:
            target_db = OutreachTargetDB(
                id=str(uuid.uuid4()),
                campaign_id=campaign_db.id,
                target_id=target.get('id'),
                name=target['name'],
                email=target.get('email') or target.get('potential_emails', [None])[0],
                company=target.get('company'),
                linkedin_url=target.get('linkedin_url') or target.get('profile_url'),
                website=target.get('website'),
                additional_info=target,
                status='pending',
                score=target.get('match_score', 0)
            )
            db.add(target_db)
        
        db.commit()
        db.refresh(campaign_db)
        
        return OutreachCampaign.from_orm(campaign_db)
    
    async def send_bulk_outreach(
        self,
        campaign_id: str,
        target_ids: List[str],
        template_id: Optional[str],
        personalization_level: str,
        delay_between_emails: int,
        db: Session
    ) -> Dict[str, Any]:
        """Send personalized emails to multiple targets"""
        
        campaign = db.query(OutreachCampaignDB).filter_by(id=campaign_id).first()
        if not campaign:
            raise ValueError("Campaign not found")
        
        # Get template
        template = None
        if template_id:
            template = db.query(EmailTemplateDB).filter_by(id=template_id).first()
        
        # Update campaign status
        campaign.status = 'active'
        db.commit()
        
        results = {
            "sent": 0,
            "failed": 0,
            "emails": []
        }
        
        for target_id in target_ids:
            try:
                # Send email to target
                email_result = await self._send_outreach_email(
                    campaign_id,
                    target_id,
                    template,
                    personalization_level,
                    db
                )
                
                results["sent"] += 1
                results["emails"].append(email_result)
                
                # Delay between emails to avoid rate limiting
                if delay_between_emails > 0:
                    await asyncio.sleep(delay_between_emails)
                    
            except Exception as e:
                results["failed"] += 1
                print(f"Failed to send email to target {target_id}: {e}")
        
        return results
    
    async def _send_outreach_email(
        self,
        campaign_id: str,
        target_id: str,
        template,
        personalization_level: str,
        db: Session
    ) -> Dict[str, Any]:
        """Send a personalized email to a single target"""
        
        # Get campaign and target
        campaign = db.query(OutreachCampaignDB).filter_by(id=campaign_id).first()
        target = db.query(OutreachTargetDB).filter_by(
            id=target_id,
            campaign_id=campaign_id
        ).first()
        
        if not target or not target.email:
            raise ValueError("Target not found or no email available")
        
        # Create or get thread
        thread = db.query(EmailThreadDB).filter_by(
            campaign_id=campaign_id,
            target_id=target_id
        ).first()
        
        if not thread:
            thread = EmailThreadDB(
                id=str(uuid.uuid4()),
                campaign_id=campaign_id,
                target_id=target_id,
                subject=await self._generate_subject(campaign, target),
                status='active',
                last_email_at=datetime.utcnow()
            )
            db.add(thread)
            db.commit()
        
        # Generate personalized email
        if template and personalization_level != "low":
            email_content = await email_learning_service.personalize_email(
                template,
                target.additional_info,
                {
                    "campaign_name": campaign.name,
                    "goals": campaign.goals,
                    "requirements": campaign.requirements,
                    "value_proposition": campaign.goals.get('value_proposition', ''),
                    "sender_name": "Your Name",  # Should come from user profile
                    "sender_title": "Your Title",
                    "company": "Your Company"
                }
            )
        else:
            # Generate email without template
            email_content = await self._generate_email_content(
                campaign,
                target,
                personalization_level
            )
        
        # Create email record
        email_db = OutreachEmailDB(
            id=str(uuid.uuid4()),
            thread_id=thread.id,
            campaign_id=campaign_id,
            target_id=target_id,
            direction='sent',
            subject=thread.subject,
            content=email_content,
            personalization_data={
                "level": personalization_level,
                "target_info": target.additional_info
            },
            sent_at=datetime.utcnow(),
            email_type='cold_outreach',
            ai_generated=True
        )
        db.add(email_db)
        
        # Update target status
        target.status = 'contacted'
        
        # Send actual email
        try:
            await self.email_service.send_email(
                to_email=target.email,
                subject=thread.subject,
                content=email_content,
                campaign_id=campaign_id,
                email_id=email_db.id
            )
        except Exception as e:
            print(f"Failed to send email: {e}")
            # Continue to save the record even if sending fails
        
        db.commit()
        
        return {
            "email_id": email_db.id,
            "target_id": target_id,
            "target_name": target.name,
            "subject": thread.subject,
            "sent_at": email_db.sent_at.isoformat()
        }
    
    async def _generate_subject(
        self,
        campaign: OutreachCampaignDB,
        target: OutreachTargetDB
    ) -> str:
        """Generate an engaging subject line"""
        
        prompt = f"""Generate an engaging email subject line for this outreach:

Campaign: {campaign.name}
Target: {target.name} at {target.company or 'their company'}
Target Type: {campaign.target_type}
Goal: {campaign.goals.get('primary_goal')}

Create a subject line that:
1. Is personalized and attention-grabbing
2. Under 50 characters
3. Creates curiosity or offers value
4. Avoids spam triggers

Return only the subject line, no quotes or explanation."""
        
        response = self.openai_client.chat.completions.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": "You are an expert at writing email subject lines."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.8
        )
        
        return response.choices[0].message.content.strip()
    
    async def _generate_email_content(
        self,
        campaign: OutreachCampaignDB,
        target: OutreachTargetDB,
        personalization_level: str
    ) -> str:
        """Generate personalized email content"""
        
        # Build context based on personalization level
        if personalization_level == "high":
            context = f"""
Target Information:
- Name: {target.name}
- Company: {target.company}
- Role/Title: {target.additional_info.get('title', 'N/A')}
- Industry: {target.additional_info.get('industry', 'N/A')}
- Recent Activity: {target.additional_info.get('recent_achievement', 'N/A')}
- Pain Points: {', '.join(target.additional_info.get('pain_points', []))}
"""
        elif personalization_level == "medium":
            context = f"""
Target Information:
- Name: {target.name}
- Company: {target.company}
- Industry: {target.additional_info.get('industry', 'N/A')}
"""
        else:
            context = f"Target Name: {target.name}"
        
        prompt = f"""Write a personalized outreach email:

Campaign Details:
- Name: {campaign.name}
- Goal: {campaign.goals.get('primary_goal')}
- Value Proposition: {campaign.goals.get('desired_outcome')}
- Requirements: {json.dumps(campaign.requirements, indent=2)}

{context}

Write an email that:
1. Opens with a personalized, attention-grabbing line
2. Quickly establishes relevance and value
3. Addresses potential pain points
4. Makes a clear, low-commitment ask
5. Is concise (under 150 words)
6. Sounds human and conversational
7. Includes a clear call-to-action

Do not include subject line or signature."""
        
        response = self.openai_client.chat.completions.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": "You are an expert at writing compelling outreach emails."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7
        )
        
        return response.choices[0].message.content
    
    async def process_email_response(
        self,
        email_id: str,
        response_content: str,
        db: Session
    ) -> Dict[str, Any]:
        """Process an email response and determine next action"""
        
        # Get the original email and context
        original_email = db.query(OutreachEmailDB).filter_by(id=email_id).first()
        if not original_email:
            raise ValueError("Email not found")
        
        thread = db.query(EmailThreadDB).filter_by(id=original_email.thread_id).first()
        campaign = db.query(OutreachCampaignDB).filter_by(id=original_email.campaign_id).first()
        target = db.query(OutreachTargetDB).filter_by(id=original_email.target_id).first()
        
        # Save the response
        response_email = OutreachEmailDB(
            id=str(uuid.uuid4()),
            thread_id=thread.id,
            campaign_id=campaign.id,
            target_id=target.id,
            direction='received',
            subject=f"Re: {thread.subject}",
            content=response_content,
            sent_at=datetime.utcnow(),
            email_type='response',
            ai_generated=False
        )
        db.add(response_email)
        
        # Analyze the response
        analysis = await self._analyze_response(
            response_content,
            original_email.content,
            campaign.goals
        )
        
        # Update target status based on analysis
        if analysis['sentiment'] == 'positive':
            if analysis['intent'] == 'interested':
                target.status = 'responded'
            elif analysis['intent'] == 'ready_to_meet':
                target.status = 'meeting_scheduled'
            elif analysis['intent'] == 'negotiating':
                target.status = 'negotiating'
        elif analysis['sentiment'] == 'negative':
            if analysis['intent'] == 'not_interested':
                target.status = 'closed_lost'
        
        # Update email tracking
        original_email.replied_at = datetime.utcnow()
        thread.last_email_at = datetime.utcnow()
        
        # Determine next action
        next_action = await self._determine_next_action(analysis, campaign, target)
        
        # If negotiation started, create negotiation record
        if next_action['action'] == 'start_negotiation':
            negotiation = NegotiationDB(
                id=str(uuid.uuid4()),
                thread_id=thread.id,
                campaign_id=campaign.id,
                target_id=target.id,
                current_state='interest_shown',
                negotiation_history=[],
                ai_strategy=next_action.get('strategy')
            )
            db.add(negotiation)
        
        db.commit()
        
        # Execute next action if automated
        if next_action.get('automated', False):
            await self._execute_next_action(next_action, thread, campaign, target, db)
        
        return {
            "analysis": analysis,
            "next_action": next_action,
            "target_status": target.status
        }
    
    async def _analyze_response(
        self,
        response: str,
        original_email: str,
        campaign_goals: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Analyze email response using AI"""
        
        prompt = f"""Analyze this email response:

Original Email:
{original_email}

Response:
{response}

Campaign Goal: {campaign_goals.get('primary_goal')}

Analyze and return as JSON:
{{
    "sentiment": "positive/neutral/negative",
    "intent": "interested/not_interested/need_more_info/ready_to_meet/negotiating/other",
    "key_points": ["point1", "point2"],
    "questions_asked": ["question1", "question2"],
    "objections": ["objection1", "objection2"],
    "next_step_suggested": "what they suggested as next step",
    "urgency_level": "high/medium/low",
    "decision_maker": true/false,
    "budget_mentioned": true/false,
    "timeline_mentioned": "timeline if mentioned"
}}"""
        
        response = self.openai_client.chat.completions.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": "You are an expert at analyzing business email responses."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.3,
            response_format={"type": "json_object"}
        )
        
        return json.loads(response.choices[0].message.content)
    
    async def _determine_next_action(
        self,
        analysis: Dict[str, Any],
        campaign: OutreachCampaignDB,
        target: OutreachTargetDB
    ) -> Dict[str, Any]:
        """Determine the next action based on response analysis"""
        
        # Decision tree based on analysis
        if analysis['sentiment'] == 'positive':
            if analysis['intent'] == 'ready_to_meet':
                return {
                    "action": "schedule_meeting",
                    "automated": True,
                    "message": "Send calendar link",
                    "urgency": "high"
                }
            elif analysis['intent'] == 'interested':
                if analysis.get('questions_asked'):
                    return {
                        "action": "answer_questions",
                        "automated": True,
                        "questions": analysis['questions_asked'],
                        "urgency": "high"
                    }
                else:
                    return {
                        "action": "send_more_info",
                        "automated": True,
                        "urgency": "medium"
                    }
            elif analysis['intent'] == 'negotiating':
                return {
                    "action": "start_negotiation",
                    "automated": True,
                    "strategy": "collaborative",
                    "urgency": "high"
                }
        
        elif analysis['sentiment'] == 'neutral':
            if analysis['intent'] == 'need_more_info':
                return {
                    "action": "provide_information",
                    "automated": True,
                    "urgency": "medium"
                }
            else:
                return {
                    "action": "gentle_follow_up",
                    "automated": False,
                    "wait_days": 3,
                    "urgency": "low"
                }
        
        else:  # negative
            if analysis.get('objections'):
                return {
                    "action": "address_objections",
                    "automated": True,
                    "objections": analysis['objections'],
                    "urgency": "high"
                }
            else:
                return {
                    "action": "close_lost",
                    "automated": False,
                    "reason": "Not interested",
                    "urgency": "none"
                }
    
    async def _execute_next_action(
        self,
        next_action: Dict[str, Any],
        thread: EmailThreadDB,
        campaign: OutreachCampaignDB,
        target: OutreachTargetDB,
        db: Session
    ) -> None:
        """Execute the determined next action"""
        
        action_handlers = {
            "schedule_meeting": self._handle_schedule_meeting,
            "answer_questions": self._handle_answer_questions,
            "send_more_info": self._handle_send_more_info,
            "start_negotiation": self._handle_start_negotiation,
            "provide_information": self._handle_provide_information,
            "address_objections": self._handle_address_objections
        }
        
        handler = action_handlers.get(next_action['action'])
        if handler:
            await handler(next_action, thread, campaign, target, db)
    
    async def _handle_schedule_meeting(
        self,
        action: Dict[str, Any],
        thread: EmailThreadDB,
        campaign: OutreachCampaignDB,
        target: OutreachTargetDB,
        db: Session
    ) -> None:
        """Handle scheduling a meeting"""
        
        # Generate meeting scheduling email
        email_content = await self._generate_meeting_email(campaign, target)
        
        # Create email record
        email_db = OutreachEmailDB(
            id=str(uuid.uuid4()),
            thread_id=thread.id,
            campaign_id=campaign.id,
            target_id=target.id,
            direction='sent',
            subject=f"Re: {thread.subject}",
            content=email_content,
            sent_at=datetime.utcnow(),
            email_type='meeting_request',
            ai_generated=True
        )
        db.add(email_db)
        
        # Send email
        await self.email_service.send_email(
            to_email=target.email,
            subject=email_db.subject,
            content=email_content,
            campaign_id=campaign.id,
            email_id=email_db.id
        )
        
        db.commit()
    
    async def _generate_meeting_email(
        self,
        campaign: OutreachCampaignDB,
        target: OutreachTargetDB
    ) -> str:
        """Generate meeting scheduling email"""
        
        prompt = f"""Write a brief email to schedule a meeting:

Recipient: {target.name}
Context: They've expressed interest in {campaign.name}

Include:
1. Thank them for their interest
2. Suggest 2-3 specific time slots
3. Offer a calendar link (use [CALENDAR_LINK])
4. Keep it brief and friendly
5. Mention it will be a 30-minute call

Do not include subject or signature."""
        
        response = self.openai_client.chat.completions.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": "You are writing a meeting scheduling email."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.6
        )
        
        return response.choices[0].message.content
    
    async def handle_negotiation(
        self,
        negotiation_id: str,
        response: str,
        db: Session
    ) -> Dict[str, Any]:
        """Handle negotiation responses and generate counter-offers"""
        
        negotiation = db.query(NegotiationDB).filter_by(id=negotiation_id).first()
        if not negotiation:
            raise ValueError("Negotiation not found")
        
        # Analyze the negotiation response
        analysis = await self._analyze_negotiation_response(
            response,
            negotiation.current_offer,
            negotiation.negotiation_history
        )
        
        # Update negotiation state
        negotiation.target_response = analysis
        negotiation.current_state = self._determine_negotiation_state(analysis)
        
        # Generate strategy and next offer
        strategy = await self._generate_negotiation_strategy(
            negotiation,
            analysis
        )
        
        negotiation.ai_strategy = strategy['approach']
        negotiation.next_action = strategy['next_action']
        
        # If we should make a counter-offer
        if strategy['next_action'] == 'counter_offer':
            counter_offer = await self._generate_counter_offer(
                negotiation,
                analysis,
                strategy
            )
            
            # Add to negotiation history
            negotiation.negotiation_history.append({
                "offer": counter_offer,
                "proposed_by": "us",
                "timestamp": datetime.utcnow().isoformat()
            })
            
            negotiation.current_offer = counter_offer
        
        db.commit()
        
        return {
            "negotiation_state": negotiation.current_state,
            "strategy": strategy,
            "next_action": strategy['next_action'],
            "counter_offer": negotiation.current_offer if strategy['next_action'] == 'counter_offer' else None
        }
    
    async def _analyze_negotiation_response(
        self,
        response: str,
        current_offer: Dict[str, Any],
        history: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Analyze negotiation response"""
        
        prompt = f"""Analyze this negotiation response:

Current Offer: {json.dumps(current_offer, indent=2)}
Negotiation History: {json.dumps(history[-3:], indent=2) if history else 'None'}

Response:
{response}

Analyze and return as JSON:
{{
    "stance": "accepting/rejecting/counter_offering/considering",
    "key_concerns": ["concern1", "concern2"],
    "flexibility_areas": ["area1", "area2"],
    "deal_breakers": ["breaker1", "breaker2"],
    "emotional_tone": "collaborative/competitive/frustrated/eager",
    "urgency": "high/medium/low",
    "their_offer": {{"amount": null, "terms": {{}}}},
    "likelihood_to_close": "percentage as number 0-100"
}}"""
        
        response = self.openai_client.chat.completions.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": "You are an expert negotiation analyst."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.3,
            response_format={"type": "json_object"}
        )
        
        return json.loads(response.choices[0].message.content)
    
    def _determine_negotiation_state(self, analysis: Dict[str, Any]) -> str:
        """Determine current negotiation state"""
        
        if analysis['stance'] == 'accepting':
            return 'closed'
        elif analysis['stance'] == 'rejecting' and analysis['likelihood_to_close'] < 20:
            return 'closed'
        elif analysis['stance'] == 'counter_offering':
            return 'negotiating_terms'
        elif analysis['likelihood_to_close'] > 80:
            return 'final_offer'
        else:
            return 'negotiating_terms'
    
    async def _generate_negotiation_strategy(
        self,
        negotiation: NegotiationDB,
        analysis: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Generate negotiation strategy"""
        
        campaign = negotiation.campaign
        
        prompt = f"""Generate a negotiation strategy:

Campaign Goals: {json.dumps(campaign.goals, indent=2)}
Budget Range: {json.dumps(campaign.budget, indent=2)}
Their Analysis: {json.dumps(analysis, indent=2)}
Negotiation History: {len(negotiation.negotiation_history)} rounds

Generate strategy as JSON:
{{
    "approach": "collaborative/competitive/accommodating",
    "next_action": "counter_offer/accept/walk_away/seek_clarification",
    "concession_areas": ["area1", "area2"],
    "hold_firm_areas": ["area1", "area2"],
    "tactics": ["tactic1", "tactic2"],
    "reasoning": "explanation of strategy"
}}"""
        
        response = self.openai_client.chat.completions.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": "You are an expert negotiation strategist."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.5,
            response_format={"type": "json_object"}
        )
        
        return json.loads(response.choices[0].message.content)
    
    async def _generate_counter_offer(
        self,
        negotiation: NegotiationDB,
        analysis: Dict[str, Any],
        strategy: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Generate a counter offer"""
        
        campaign = negotiation.campaign
        
        prompt = f"""Generate a counter offer:

Our Budget: {json.dumps(campaign.budget, indent=2)}
Their Concerns: {analysis['key_concerns']}
Their Flexibility: {analysis['flexibility_areas']}
Our Strategy: {strategy['approach']}
Concession Areas: {strategy['concession_areas']}

Create a counter offer that:
1. Addresses their key concerns
2. Stays within our acceptable range
3. Follows our negotiation strategy
4. Moves toward closing the deal

Return as JSON with structure matching our budget format."""
        
        response = self.openai_client.chat.completions.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": "You are crafting a strategic counter offer."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.6,
            response_format={"type": "json_object"}
        )
        
        return json.loads(response.choices[0].message.content)
    
    async def schedule_meeting_from_email(
        self,
        thread_id: str,
        meeting_details: Dict[str, Any],
        db: Session
    ) -> ScheduledMeeting:
        """Schedule a meeting from email thread"""
        
        thread = db.query(EmailThreadDB).filter_by(id=thread_id).first()
        if not thread:
            raise ValueError("Thread not found")
        
        # Create meeting record
        meeting = ScheduledMeetingDB(
            id=str(uuid.uuid4()),
            campaign_id=thread.campaign_id,
            target_id=thread.target_id,
            thread_id=thread_id,
            meeting_type=meeting_details.get('type', 'intro_call'),
            scheduled_at=meeting_details['scheduled_at'],
            duration_minutes=meeting_details.get('duration', 30),
            meeting_link=meeting_details.get('link'),
            agenda=meeting_details.get('agenda'),
            status='scheduled'
        )
        db.add(meeting)
        
        # Update target status
        target = db.query(OutreachTargetDB).filter_by(id=thread.target_id).first()
        target.status = 'meeting_scheduled'
        
        db.commit()
        db.refresh(meeting)
        
        # Send confirmation email
        await self._send_meeting_confirmation(meeting, thread, db)
        
        return ScheduledMeeting.from_orm(meeting)
    
    async def _send_meeting_confirmation(
        self,
        meeting: ScheduledMeetingDB,
        thread: EmailThreadDB,
        db: Session
    ) -> None:
        """Send meeting confirmation email"""
        
        target = db.query(OutreachTargetDB).filter_by(id=meeting.target_id).first()
        
        confirmation_content = f"""Great! I've confirmed our meeting:

Date & Time: {meeting.scheduled_at.strftime('%B %d at %I:%M %p')}
Duration: {meeting.duration_minutes} minutes
Meeting Link: {meeting.meeting_link or 'Will send separately'}

Agenda:
{meeting.agenda or 'Discussion about how we can help achieve your goals'}

Looking forward to speaking with you!

Best regards"""
        
        email_db = OutreachEmailDB(
            id=str(uuid.uuid4()),
            thread_id=thread.id,
            campaign_id=meeting.campaign_id,
            target_id=meeting.target_id,
            direction='sent',
            subject=f"Confirmed: Meeting on {meeting.scheduled_at.strftime('%B %d')}",
            content=confirmation_content,
            sent_at=datetime.utcnow(),
            email_type='meeting_confirmation',
            ai_generated=True
        )
        db.add(email_db)
        
        await self.email_service.send_email(
            to_email=target.email,
            subject=email_db.subject,
            content=confirmation_content,
            campaign_id=meeting.campaign_id,
            email_id=email_db.id
        )
        
        db.commit()
    
    async def generate_follow_up_sequence(
        self,
        campaign_id: str,
        target_id: str,
        db: Session
    ) -> List[Dict[str, Any]]:
        """Generate a follow-up sequence for non-responsive targets"""
        
        campaign = db.query(OutreachCampaignDB).filter_by(id=campaign_id).first()
        target = db.query(OutreachTargetDB).filter_by(id=target_id).first()
        
        # Get email history
        emails = db.query(OutreachEmailDB).filter_by(
            campaign_id=campaign_id,
            target_id=target_id,
            direction='sent'
        ).order_by(OutreachEmailDB.sent_at).all()
        
        # Generate follow-up sequence
        follow_ups = []
        
        # Follow-up 1: 3 days after initial email
        follow_ups.append({
            "delay_days": 3,
            "type": "gentle_reminder",
            "subject_prefix": "Re: ",
            "tone": "friendly",
            "length": "very_short"
        })
        
        # Follow-up 2: 7 days after initial email
        follow_ups.append({
            "delay_days": 7,
            "type": "value_add",
            "subject_prefix": "Quick thought on ",
            "tone": "helpful",
            "length": "short",
            "include": "relevant_insight"
        })
        
        # Follow-up 3: 14 days after initial email
        follow_ups.append({
            "delay_days": 14,
            "type": "break_up",
            "subject_prefix": "Should I close your file?",
            "tone": "understanding",
            "length": "short"
        })
        
        return follow_ups

# Singleton instance
outreach_automation_service = OutreachAutomationService()