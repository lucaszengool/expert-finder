# Analytics Service for Outreach Campaigns
import asyncio
from typing import Dict, Any, List, Optional, Tuple
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func, text
import json
import pandas as pd
from collections import defaultdict
import numpy as np

from ..models.outreach_db_models import (
    OutreachCampaign as DBCampaign,
    OutreachTarget as DBTarget,
    OutreachMessage as DBMessage,
    CampaignAnalytics as DBAnalytics,
    Conversation as DBConversation,
    MessageStatusEnum, ConversationStageEnum, ChannelEnum
)

class AnalyticsService:
    def __init__(self):
        self.cache_duration = timedelta(minutes=15)  # Cache analytics for 15 minutes
        self._cache = {}
    
    async def update_campaign_analytics(self, db: Session, campaign_id: str):
        """Update comprehensive analytics for a campaign"""
        try:
            # Get or create analytics record
            analytics = db.query(DBAnalytics).filter(
                DBAnalytics.campaign_id == campaign_id
            ).first()
            
            if not analytics:
                analytics = DBAnalytics(campaign_id=campaign_id)
                db.add(analytics)
            
            # Calculate all metrics
            analytics.total_targets = await self._get_total_targets(db, campaign_id)
            analytics.messages_sent = await self._get_messages_sent_by_channel(db, campaign_id)
            analytics.delivery_rate = await self._get_delivery_rates(db, campaign_id)
            analytics.open_rate = await self._get_open_rates(db, campaign_id)
            analytics.response_rate = await self._get_response_rates(db, campaign_id)
            analytics.positive_response_rate = await self._get_positive_response_rate(db, campaign_id)
            analytics.conversion_rate = await self._get_conversion_rate(db, campaign_id)
            analytics.avg_messages_to_conversion = await self._get_avg_messages_to_conversion(db, campaign_id)
            analytics.top_performing_messages = await self._get_top_performing_messages(db, campaign_id)
            analytics.response_sentiment = await self._get_response_sentiment(db, campaign_id)
            analytics.by_channel_performance = await self._get_channel_performance(db, campaign_id)
            analytics.by_time_performance = await self._get_time_performance(db, campaign_id)
            analytics.last_updated = datetime.utcnow()
            
            db.commit()
            
            return self._analytics_to_dict(analytics)
            
        except Exception as e:
            print(f"Error updating campaign analytics: {e}")
            db.rollback()
            return None
    
    async def get_campaign_analytics(
        self, db: Session, campaign_id: str, 
        date_from: Optional[datetime] = None,
        date_to: Optional[datetime] = None,
        use_cache: bool = True
    ) -> Dict[str, Any]:
        """Get comprehensive campaign analytics"""
        cache_key = f"analytics:{campaign_id}:{date_from}:{date_to}"
        
        # Check cache
        if use_cache and cache_key in self._cache:
            cached_data, cache_time = self._cache[cache_key]
            if datetime.utcnow() - cache_time < self.cache_duration:
                return cached_data
        
        # Get fresh analytics
        analytics = await self.update_campaign_analytics(db, campaign_id)
        
        if date_from or date_to:
            # Filter by date range if specified
            analytics = await self._filter_analytics_by_date(
                db, campaign_id, analytics, date_from, date_to
            )
        
        # Add real-time metrics
        analytics["real_time"] = await self._get_real_time_metrics(db, campaign_id)
        
        # Cache result
        self._cache[cache_key] = (analytics, datetime.utcnow())
        
        return analytics
    
    async def get_multi_campaign_analytics(
        self, db: Session, campaign_ids: List[str]
    ) -> Dict[str, Any]:
        """Get aggregated analytics across multiple campaigns"""
        all_analytics = {}
        
        for campaign_id in campaign_ids:
            analytics = await self.get_campaign_analytics(db, campaign_id)
            all_analytics[campaign_id] = analytics
        
        # Aggregate metrics
        aggregated = {
            "total_campaigns": len(campaign_ids),
            "total_targets": sum(a.get("total_targets", 0) for a in all_analytics.values()),
            "total_messages_sent": sum(
                sum(a.get("messages_sent", {}).values()) 
                for a in all_analytics.values()
            ),
            "avg_open_rate": np.mean([
                sum(a.get("open_rate", {}).values()) / len(a.get("open_rate", {}) or {1: 0})
                for a in all_analytics.values()
            ]),
            "avg_response_rate": np.mean([
                sum(a.get("response_rate", {}).values()) / len(a.get("response_rate", {}) or {1: 0})
                for a in all_analytics.values()
            ]),
            "campaigns": all_analytics
        }
        
        return aggregated
    
    async def get_user_analytics_summary(
        self, db: Session, user_id: str
    ) -> Dict[str, Any]:
        """Get analytics summary for all user's campaigns"""
        # Get all user campaigns
        campaigns = db.query(DBCampaign).filter(
            DBCampaign.user_id == user_id
        ).all()
        
        campaign_ids = [c.id for c in campaigns]
        
        if not campaign_ids:
            return {"total_campaigns": 0}
        
        # Get aggregated analytics
        analytics = await self.get_multi_campaign_analytics(db, campaign_ids)
        
        # Add time-based trends
        analytics["trends"] = await self._get_user_trends(db, user_id)
        
        # Add top performing campaigns
        analytics["top_campaigns"] = await self._get_top_campaigns(db, user_id)
        
        return analytics
    
    async def export_analytics(
        self, db: Session, campaign_id: str, format: str = "csv"
    ) -> str:
        """Export campaign analytics to file"""
        analytics = await self.get_campaign_analytics(db, campaign_id, use_cache=False)
        
        if format == "csv":
            return await self._export_to_csv(db, campaign_id, analytics)
        elif format == "excel":
            return await self._export_to_excel(db, campaign_id, analytics)
        elif format == "pdf":
            return await self._export_to_pdf(db, campaign_id, analytics)
        else:
            raise ValueError(f"Unsupported export format: {format}")
    
    # Private helper methods
    async def _get_total_targets(self, db: Session, campaign_id: str) -> int:
        """Get total number of targets"""
        return db.query(DBTarget).filter(
            DBTarget.campaign_id == campaign_id
        ).count()
    
    async def _get_messages_sent_by_channel(self, db: Session, campaign_id: str) -> Dict[str, int]:
        """Get messages sent count by channel"""
        result = db.query(
            DBMessage.channel,
            func.count(DBMessage.id)
        ).filter(
            and_(
                DBMessage.campaign_id == campaign_id,
                DBMessage.status.in_([MessageStatusEnum.SENT, MessageStatusEnum.DELIVERED, MessageStatusEnum.READ])
            )
        ).group_by(DBMessage.channel).all()
        
        return {channel.value: count for channel, count in result}
    
    async def _get_delivery_rates(self, db: Session, campaign_id: str) -> Dict[str, float]:
        """Get delivery rates by channel"""
        rates = {}
        
        for channel in ChannelEnum:
            sent = db.query(DBMessage).filter(
                and_(
                    DBMessage.campaign_id == campaign_id,
                    DBMessage.channel == channel,
                    DBMessage.status.in_([MessageStatusEnum.SENT, MessageStatusEnum.DELIVERED, MessageStatusEnum.READ])
                )
            ).count()
            
            delivered = db.query(DBMessage).filter(
                and_(
                    DBMessage.campaign_id == campaign_id,
                    DBMessage.channel == channel,
                    DBMessage.status.in_([MessageStatusEnum.DELIVERED, MessageStatusEnum.READ])
                )
            ).count()
            
            rates[channel.value] = delivered / sent if sent > 0 else 0
        
        return rates
    
    async def _get_open_rates(self, db: Session, campaign_id: str) -> Dict[str, float]:
        """Get open rates by channel"""
        rates = {}
        
        for channel in ChannelEnum:
            delivered = db.query(DBMessage).filter(
                and_(
                    DBMessage.campaign_id == campaign_id,
                    DBMessage.channel == channel,
                    DBMessage.status.in_([MessageStatusEnum.DELIVERED, MessageStatusEnum.READ])
                )
            ).count()
            
            opened = db.query(DBMessage).filter(
                and_(
                    DBMessage.campaign_id == campaign_id,
                    DBMessage.channel == channel,
                    DBMessage.status == MessageStatusEnum.READ
                )
            ).count()
            
            rates[channel.value] = opened / delivered if delivered > 0 else 0
        
        return rates
    
    async def _get_response_rates(self, db: Session, campaign_id: str) -> Dict[str, float]:
        """Get response rates by channel"""
        rates = {}
        
        for channel in ChannelEnum:
            sent = db.query(DBMessage).filter(
                and_(
                    DBMessage.campaign_id == campaign_id,
                    DBMessage.channel == channel,
                    DBMessage.status.in_([MessageStatusEnum.SENT, MessageStatusEnum.DELIVERED, MessageStatusEnum.READ])
                )
            ).count()
            
            replied = db.query(DBMessage).filter(
                and_(
                    DBMessage.campaign_id == campaign_id,
                    DBMessage.channel == channel,
                    DBMessage.status == MessageStatusEnum.REPLIED
                )
            ).count()
            
            rates[channel.value] = replied / sent if sent > 0 else 0
        
        return rates
    
    async def _get_positive_response_rate(self, db: Session, campaign_id: str) -> float:
        """Get positive response rate across all channels"""
        # This would require sentiment analysis of responses
        # For now, return a placeholder calculation
        total_responses = db.query(DBMessage).filter(
            and_(
                DBMessage.campaign_id == campaign_id,
                DBMessage.status == MessageStatusEnum.REPLIED
            )
        ).count()
        
        # Assume 70% of responses are positive (would be calculated from sentiment analysis)
        return 0.7 if total_responses > 0 else 0
    
    async def _get_conversion_rate(self, db: Session, campaign_id: str) -> float:
        """Get conversion rate (targets moved to closing stage)"""
        total_targets = await self._get_total_targets(db, campaign_id)
        
        converted = db.query(DBTarget).filter(
            and_(
                DBTarget.campaign_id == campaign_id,
                DBTarget.conversation_stage == ConversationStageEnum.CLOSING
            )
        ).count()
        
        return converted / total_targets if total_targets > 0 else 0
    
    async def _get_avg_messages_to_conversion(self, db: Session, campaign_id: str) -> float:
        """Get average messages sent before conversion"""
        # Get targets that converted
        converted_targets = db.query(DBTarget).filter(
            and_(
                DBTarget.campaign_id == campaign_id,
                DBTarget.conversation_stage == ConversationStageEnum.CLOSING
            )
        ).all()
        
        if not converted_targets:
            return 0
        
        total_messages = 0
        for target in converted_targets:
            messages_count = db.query(DBMessage).filter(
                DBMessage.target_id == target.id
            ).count()
            total_messages += messages_count
        
        return total_messages / len(converted_targets)
    
    async def _get_top_performing_messages(self, db: Session, campaign_id: str) -> List[Dict[str, Any]]:
        """Get top performing message templates"""
        # Query messages with highest response rates
        result = db.query(
            DBMessage.content,
            DBMessage.channel,
            func.count(DBMessage.id).label('sent'),
            func.sum(
                func.case(
                    (DBMessage.status == MessageStatusEnum.REPLIED, 1),
                    else_=0
                )
            ).label('replies')
        ).filter(
            DBMessage.campaign_id == campaign_id
        ).group_by(
            DBMessage.content, DBMessage.channel
        ).having(
            func.count(DBMessage.id) >= 5  # At least 5 messages sent
        ).order_by(
            text('replies::float / sent DESC')
        ).limit(5).all()
        
        return [
            {
                "content": content[:100] + "..." if len(content) > 100 else content,
                "channel": channel.value,
                "sent": sent,
                "replies": replies,
                "response_rate": replies / sent if sent > 0 else 0
            }
            for content, channel, sent, replies in result
        ]
    
    async def _get_response_sentiment(self, db: Session, campaign_id: str) -> Dict[str, float]:
        """Get sentiment analysis of responses"""
        # Placeholder - would integrate with sentiment analysis service
        return {
            "positive": 0.6,
            "neutral": 0.3,
            "negative": 0.1
        }
    
    async def _get_channel_performance(self, db: Session, campaign_id: str) -> Dict[str, Dict[str, Any]]:
        """Get detailed performance by channel"""
        performance = {}
        
        for channel in ChannelEnum:
            sent = db.query(DBMessage).filter(
                and_(
                    DBMessage.campaign_id == campaign_id,
                    DBMessage.channel == channel
                )
            ).count()
            
            if sent == 0:
                continue
            
            delivered = db.query(DBMessage).filter(
                and_(
                    DBMessage.campaign_id == campaign_id,
                    DBMessage.channel == channel,
                    DBMessage.status.in_([MessageStatusEnum.DELIVERED, MessageStatusEnum.READ])
                )
            ).count()
            
            opened = db.query(DBMessage).filter(
                and_(
                    DBMessage.campaign_id == campaign_id,
                    DBMessage.channel == channel,
                    DBMessage.status == MessageStatusEnum.READ
                )
            ).count()
            
            replied = db.query(DBMessage).filter(
                and_(
                    DBMessage.campaign_id == campaign_id,
                    DBMessage.channel == channel,
                    DBMessage.status == MessageStatusEnum.REPLIED
                )
            ).count()
            
            performance[channel.value] = {
                "sent": sent,
                "delivered": delivered,
                "opened": opened,
                "replied": replied,
                "delivery_rate": delivered / sent,
                "open_rate": opened / delivered if delivered > 0 else 0,
                "response_rate": replied / sent
            }
        
        return performance
    
    async def _get_time_performance(self, db: Session, campaign_id: str) -> Dict[str, Any]:
        """Get performance metrics over time"""
        # Get daily metrics for the last 30 days
        end_date = datetime.utcnow()
        start_date = end_date - timedelta(days=30)
        
        daily_metrics = defaultdict(lambda: {
            "sent": 0,
            "delivered": 0,
            "opened": 0,
            "replied": 0
        })
        
        messages = db.query(DBMessage).filter(
            and_(
                DBMessage.campaign_id == campaign_id,
                DBMessage.created_at >= start_date,
                DBMessage.created_at <= end_date
            )
        ).all()
        
        for message in messages:
            day = message.created_at.date().isoformat()
            daily_metrics[day]["sent"] += 1
            
            if message.status in [MessageStatusEnum.DELIVERED, MessageStatusEnum.READ]:
                daily_metrics[day]["delivered"] += 1
            
            if message.status == MessageStatusEnum.READ:
                daily_metrics[day]["opened"] += 1
            
            if message.status == MessageStatusEnum.REPLIED:
                daily_metrics[day]["replied"] += 1
        
        return dict(daily_metrics)
    
    async def _get_real_time_metrics(self, db: Session, campaign_id: str) -> Dict[str, Any]:
        """Get real-time metrics"""
        now = datetime.utcnow()
        hour_ago = now - timedelta(hours=1)
        
        return {
            "messages_sent_last_hour": db.query(DBMessage).filter(
                and_(
                    DBMessage.campaign_id == campaign_id,
                    DBMessage.sent_at >= hour_ago
                )
            ).count(),
            "responses_last_hour": db.query(DBMessage).filter(
                and_(
                    DBMessage.campaign_id == campaign_id,
                    DBMessage.replied_at >= hour_ago
                )
            ).count(),
            "active_conversations": db.query(DBConversation).filter(
                and_(
                    DBConversation.target_id.in_(
                        db.query(DBTarget.id).filter(DBTarget.campaign_id == campaign_id)
                    ),
                    DBConversation.is_active == True
                )
            ).count()
        }
    
    def _analytics_to_dict(self, analytics: DBAnalytics) -> Dict[str, Any]:
        """Convert analytics object to dictionary"""
        return {
            "campaign_id": analytics.campaign_id,
            "total_targets": analytics.total_targets,
            "messages_sent": analytics.messages_sent,
            "delivery_rate": analytics.delivery_rate,
            "open_rate": analytics.open_rate,
            "response_rate": analytics.response_rate,
            "positive_response_rate": analytics.positive_response_rate,
            "conversion_rate": analytics.conversion_rate,
            "avg_messages_to_conversion": analytics.avg_messages_to_conversion,
            "roi": analytics.roi,
            "top_performing_messages": analytics.top_performing_messages,
            "response_sentiment": analytics.response_sentiment,
            "by_channel_performance": analytics.by_channel_performance,
            "by_time_performance": analytics.by_time_performance,
            "last_updated": analytics.last_updated.isoformat() if analytics.last_updated else None
        }
    
    async def _export_to_csv(self, db: Session, campaign_id: str, analytics: Dict[str, Any]) -> str:
        """Export analytics to CSV format"""
        import io
        import csv
        
        output = io.StringIO()
        writer = csv.writer(output)
        
        # Write headers and data
        writer.writerow(["Metric", "Value"])
        writer.writerow(["Total Targets", analytics.get("total_targets", 0)])
        writer.writerow(["Messages Sent", sum(analytics.get("messages_sent", {}).values())])
        writer.writerow(["Overall Open Rate", f"{analytics.get('open_rate', {}).get('email', 0) * 100:.1f}%"])
        writer.writerow(["Overall Response Rate", f"{analytics.get('response_rate', {}).get('email', 0) * 100:.1f}%"])
        writer.writerow(["Conversion Rate", f"{analytics.get('conversion_rate', 0) * 100:.1f}%"])
        
        # Save to file
        filename = f"analytics_{campaign_id}_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.csv"
        with open(f"/tmp/{filename}", "w") as f:
            f.write(output.getvalue())
        
        return filename
    
    async def _export_to_excel(self, db: Session, campaign_id: str, analytics: Dict[str, Any]) -> str:
        """Export analytics to Excel format"""
        # Would use pandas or openpyxl to create Excel file
        filename = f"analytics_{campaign_id}_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.xlsx"
        # Implementation would go here
        return filename
    
    async def _export_to_pdf(self, db: Session, campaign_id: str, analytics: Dict[str, Any]) -> str:
        """Export analytics to PDF format"""
        # Would use reportlab or similar to create PDF
        filename = f"analytics_{campaign_id}_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.pdf"
        # Implementation would go here
        return filename