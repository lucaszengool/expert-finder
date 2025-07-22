"""add_outreach_and_negotiation_tables

Revision ID: xxx
Revises: 
Create Date: 2024-01-01

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

def upgrade():
    # Email templates learned from examples
    op.create_table(
        'email_templates',
        sa.Column('id', sa.String(), primary_key=True),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('category', sa.String()),  # cold_outreach, follow_up, negotiation, meeting_request
        sa.Column('template_content', sa.Text()),
        sa.Column('learned_patterns', sa.JSON()),  # Extracted patterns from examples
        sa.Column('success_rate', sa.Float(), default=0.0),
        sa.Column('usage_count', sa.Integer(), default=0),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.func.now(), onupdate=sa.func.now())
    )
    
    # Outreach campaigns
    op.create_table(
        'outreach_campaigns',
        sa.Column('id', sa.String(), primary_key=True),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('description', sa.Text()),
        sa.Column('search_query', sa.String()),  # Original search query
        sa.Column('target_type', sa.String()),  # experts, agencies, clients, shops
        sa.Column('goals', sa.JSON()),  # Campaign goals
        sa.Column('requirements', sa.JSON()),
        sa.Column('budget', sa.JSON()),  # min, max, currency
        sa.Column('template_id', sa.String()),
        sa.Column('status', sa.String(), default='draft'),  # draft, active, paused, completed
        sa.Column('created_by', sa.String()),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.func.now(), onupdate=sa.func.now())
    )
    
    # Outreach targets (recipients)
    op.create_table(
        'outreach_targets',
        sa.Column('id', sa.String(), primary_key=True),
        sa.Column('campaign_id', sa.String(), sa.ForeignKey('outreach_campaigns.id')),
        sa.Column('target_id', sa.String()),  # Could be expert_id or external contact
        sa.Column('name', sa.String()),
        sa.Column('email', sa.String()),
        sa.Column('company', sa.String()),
        sa.Column('linkedin_url', sa.String()),
        sa.Column('website', sa.String()),
        sa.Column('additional_info', sa.JSON()),
        sa.Column('status', sa.String(), default='pending'),  # pending, contacted, responded, negotiating, closed_won, closed_lost
        sa.Column('score', sa.Float()),  # Relevance score
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now())
    )
    
    # Email threads
    op.create_table(
        'email_threads',
        sa.Column('id', sa.String(), primary_key=True),
        sa.Column('campaign_id', sa.String(), sa.ForeignKey('outreach_campaigns.id')),
        sa.Column('target_id', sa.String(), sa.ForeignKey('outreach_targets.id')),
        sa.Column('subject', sa.String()),
        sa.Column('status', sa.String(), default='active'),  # active, closed, archived
        sa.Column('last_email_at', sa.DateTime()),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now())
    )
    
    # Individual emails
    op.create_table(
        'outreach_emails',
        sa.Column('id', sa.String(), primary_key=True),
        sa.Column('thread_id', sa.String(), sa.ForeignKey('email_threads.id')),
        sa.Column('campaign_id', sa.String(), sa.ForeignKey('outreach_campaigns.id')),
        sa.Column('target_id', sa.String(), sa.ForeignKey('outreach_targets.id')),
        sa.Column('direction', sa.String()),  # sent, received
        sa.Column('subject', sa.String()),
        sa.Column('content', sa.Text()),
        sa.Column('personalization_data', sa.JSON()),  # Data used for personalization
        sa.Column('sent_at', sa.DateTime()),
        sa.Column('opened_at', sa.DateTime()),
        sa.Column('clicked_at', sa.DateTime()),
        sa.Column('replied_at', sa.DateTime()),
        sa.Column('email_type', sa.String()),  # initial, follow_up, negotiation
        sa.Column('ai_generated', sa.Boolean(), default=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now())
    )
    
    # Negotiation states
    op.create_table(
        'negotiations',
        sa.Column('id', sa.String(), primary_key=True),
        sa.Column('thread_id', sa.String(), sa.ForeignKey('email_threads.id')),
        sa.Column('campaign_id', sa.String(), sa.ForeignKey('outreach_campaigns.id')),
        sa.Column('target_id', sa.String(), sa.ForeignKey('outreach_targets.id')),
        sa.Column('current_state', sa.String()),  # initial_contact, interest_shown, negotiating_terms, final_offer, closed
        sa.Column('negotiation_history', sa.JSON()),  # Track offers/counteroffers
        sa.Column('current_offer', sa.JSON()),
        sa.Column('target_response', sa.JSON()),
        sa.Column('next_action', sa.String()),
        sa.Column('ai_strategy', sa.Text()),  # Current negotiation strategy
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.func.now(), onupdate=sa.func.now())
    )
    
    # Scheduled meetings
    op.create_table(
        'scheduled_meetings',
        sa.Column('id', sa.String(), primary_key=True),
        sa.Column('campaign_id', sa.String(), sa.ForeignKey('outreach_campaigns.id')),
        sa.Column('target_id', sa.String(), sa.ForeignKey('outreach_targets.id')),
        sa.Column('thread_id', sa.String(), sa.ForeignKey('email_threads.id')),
        sa.Column('meeting_type', sa.String()),  # intro_call, demo, negotiation, closing
        sa.Column('scheduled_at', sa.DateTime()),
        sa.Column('duration_minutes', sa.Integer()),
        sa.Column('meeting_link', sa.String()),
        sa.Column('agenda', sa.Text()),
        sa.Column('notes', sa.Text()),
        sa.Column('status', sa.String(), default='scheduled'),  # scheduled, completed, cancelled, rescheduled
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now())
    )
    
    # Learning examples
    op.create_table(
        'email_examples',
        sa.Column('id', sa.String(), primary_key=True),
        sa.Column('category', sa.String()),  # Type of email
        sa.Column('subject', sa.String()),
        sa.Column('content', sa.Text()),
        sa.Column('success', sa.Boolean()),  # Was it successful?
        sa.Column('metadata', sa.JSON()),  # Additional context
        sa.Column('extracted_features', sa.JSON()),  # AI-extracted patterns
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now())
    )
    
    # Create indexes
    op.create_index('idx_campaigns_status', 'outreach_campaigns', ['status'])
    op.create_index('idx_targets_campaign', 'outreach_targets', ['campaign_id'])
    op.create_index('idx_targets_status', 'outreach_targets', ['status'])
    op.create_index('idx_emails_thread', 'outreach_emails', ['thread_id'])
    op.create_index('idx_negotiations_state', 'negotiations', ['current_state'])
    op.create_index('idx_meetings_scheduled', 'scheduled_meetings', ['scheduled_at'])

def downgrade():
    op.drop_index('idx_meetings_scheduled')
    op.drop_index('idx_negotiations_state')
    op.drop_index('idx_emails_thread')
    op.drop_index('idx_targets_status')
    op.drop_index('idx_targets_campaign')
    op.drop_index('idx_campaigns_status')
    
    op.drop_table('email_examples')
    op.drop_table('scheduled_meetings')
    op.drop_table('negotiations')
    op.drop_table('outreach_emails')
    op.drop_table('email_threads')
    op.drop_table('outreach_targets')
    op.drop_table('outreach_campaigns')
    op.drop_table('email_templates')