"""Add enhanced outreach tables for multi-channel campaigns

Revision ID: 002
Revises: 001
Create Date: 2024-01-01 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '002'
down_revision = '001'
branch_labels = None
depends_on = None

def upgrade():
    # Create enum types (only if they don't exist)
    op.execute("""
        DO $$ BEGIN
            CREATE TYPE channel_enum AS ENUM ('email', 'instagram', 'whatsapp', 'twitter', 'linkedin', 'sms', 'telegram');
        EXCEPTION
            WHEN duplicate_object THEN null;
        END $$;
    """)
    op.execute("""
        DO $$ BEGIN
            CREATE TYPE message_status_enum AS ENUM ('pending', 'queued', 'sent', 'delivered', 'read', 'replied', 'failed', 'bounced');
        EXCEPTION
            WHEN duplicate_object THEN null;
        END $$;
    """)
    op.execute("""
        DO $$ BEGIN
            CREATE TYPE campaign_goal_enum AS ENUM ('sales', 'lead_generation', 'partnership', 'recruitment', 'networking', 'customer_success', 'market_research', 'custom');
        EXCEPTION
            WHEN duplicate_object THEN null;
        END $$;
    """)
    op.execute("""
        DO $$ BEGIN
            CREATE TYPE conversation_stage_enum AS ENUM ('initial_contact', 'qualification', 'discovery', 'proposal', 'negotiation', 'closing', 'follow_up');
        EXCEPTION
            WHEN duplicate_object THEN null;
        END $$;
    """)
    
    # Create conversation_flows table
    op.create_table('conversation_flows',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('goal', sa.Enum('sales', 'lead_generation', 'partnership', 'recruitment', 'networking', 'customer_success', 'market_research', 'custom', name='campaign_goal_enum'), nullable=False),
        sa.Column('stages', sa.JSON(), nullable=True),
        sa.Column('response_handlers', sa.JSON(), nullable=True),
        sa.Column('escalation_rules', sa.JSON(), nullable=True),
        sa.Column('success_criteria', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create outreach_campaigns table
    op.create_table('outreach_campaigns',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('user_id', sa.String(), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('goal', sa.Enum('sales', 'lead_generation', 'partnership', 'recruitment', 'networking', 'customer_success', 'market_research', 'custom', name='campaign_goal_enum'), nullable=False),
        sa.Column('channels', sa.JSON(), nullable=False),
        sa.Column('conversation_flow_id', sa.String(), nullable=True),
        sa.Column('search_criteria', sa.JSON(), nullable=True),
        sa.Column('targeting_rules', sa.JSON(), nullable=True),
        sa.Column('personalization_config', sa.JSON(), nullable=True),
        sa.Column('scheduling_config', sa.JSON(), nullable=True),
        sa.Column('ai_config', sa.JSON(), nullable=True),
        sa.Column('budget', sa.Float(), nullable=True),
        sa.Column('daily_budget', sa.Float(), nullable=True),
        sa.Column('start_date', sa.DateTime(), nullable=True),
        sa.Column('end_date', sa.DateTime(), nullable=True),
        sa.Column('status', sa.String(), nullable=True),
        sa.Column('metrics', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['conversation_flow_id'], ['conversation_flows.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_outreach_campaigns_user_id'), 'outreach_campaigns', ['user_id'], unique=False)
    
    # Create outreach_targets table
    op.create_table('outreach_targets',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('campaign_id', sa.String(), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('company', sa.String(), nullable=True),
        sa.Column('title', sa.String(), nullable=True),
        sa.Column('location', sa.String(), nullable=True),
        sa.Column('timezone', sa.String(), nullable=True),
        sa.Column('channels', sa.JSON(), nullable=True),
        sa.Column('profile_data', sa.JSON(), nullable=True),
        sa.Column('conversation_stage', sa.Enum('initial_contact', 'qualification', 'discovery', 'proposal', 'negotiation', 'closing', 'follow_up', name='conversation_stage_enum'), nullable=True),
        sa.Column('lead_score', sa.Float(), nullable=True),
        sa.Column('tags', sa.JSON(), nullable=True),
        sa.Column('custom_fields', sa.JSON(), nullable=True),
        sa.Column('do_not_contact', sa.Boolean(), nullable=True),
        sa.Column('last_contacted_at', sa.DateTime(), nullable=True),
        sa.Column('next_followup_at', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['campaign_id'], ['outreach_campaigns.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create ai_agents table
    op.create_table('ai_agents',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('campaign_id', sa.String(), nullable=False),
        sa.Column('personality', sa.String(), nullable=True),
        sa.Column('tone', sa.String(), nullable=True),
        sa.Column('objectives', sa.JSON(), nullable=True),
        sa.Column('knowledge_base', sa.JSON(), nullable=True),
        sa.Column('response_templates', sa.JSON(), nullable=True),
        sa.Column('objection_handlers', sa.JSON(), nullable=True),
        sa.Column('escalation_triggers', sa.JSON(), nullable=True),
        sa.Column('max_messages_per_conversation', sa.Integer(), nullable=True),
        sa.Column('response_time_range', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['campaign_id'], ['outreach_campaigns.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create conversations table
    op.create_table('conversations',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('target_id', sa.String(), nullable=False),
        sa.Column('channel', sa.Enum('email', 'instagram', 'whatsapp', 'twitter', 'linkedin', 'sms', 'telegram', name='channel_enum'), nullable=False),
        sa.Column('stage', sa.Enum('initial_contact', 'qualification', 'discovery', 'proposal', 'negotiation', 'closing', 'follow_up', name='conversation_stage_enum'), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=True),
        sa.Column('ai_agent_id', sa.String(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['ai_agent_id'], ['ai_agents.id'], ),
        sa.ForeignKeyConstraint(['target_id'], ['outreach_targets.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create outreach_messages table
    op.create_table('outreach_messages',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('campaign_id', sa.String(), nullable=False),
        sa.Column('target_id', sa.String(), nullable=False),
        sa.Column('conversation_id', sa.String(), nullable=True),
        sa.Column('channel', sa.Enum('email', 'instagram', 'whatsapp', 'twitter', 'linkedin', 'sms', 'telegram', name='channel_enum'), nullable=False),
        sa.Column('status', sa.Enum('pending', 'queued', 'sent', 'delivered', 'read', 'replied', 'failed', 'bounced', name='message_status_enum'), nullable=True),
        sa.Column('subject', sa.String(), nullable=True),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('media_urls', sa.JSON(), nullable=True),
        sa.Column('scheduled_at', sa.DateTime(), nullable=True),
        sa.Column('sent_at', sa.DateTime(), nullable=True),
        sa.Column('delivered_at', sa.DateTime(), nullable=True),
        sa.Column('read_at', sa.DateTime(), nullable=True),
        sa.Column('replied_at', sa.DateTime(), nullable=True),
        sa.Column('reply_content', sa.Text(), nullable=True),
        sa.Column('thread_id', sa.String(), nullable=True),
        sa.Column('metadata', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['campaign_id'], ['outreach_campaigns.id'], ),
        sa.ForeignKeyConstraint(['conversation_id'], ['conversations.id'], ),
        sa.ForeignKeyConstraint(['target_id'], ['outreach_targets.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create campaign_analytics table
    op.create_table('campaign_analytics',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('campaign_id', sa.String(), nullable=False),
        sa.Column('total_targets', sa.Integer(), nullable=True),
        sa.Column('messages_sent', sa.JSON(), nullable=True),
        sa.Column('delivery_rate', sa.JSON(), nullable=True),
        sa.Column('open_rate', sa.JSON(), nullable=True),
        sa.Column('response_rate', sa.JSON(), nullable=True),
        sa.Column('positive_response_rate', sa.Float(), nullable=True),
        sa.Column('conversion_rate', sa.Float(), nullable=True),
        sa.Column('avg_messages_to_conversion', sa.Float(), nullable=True),
        sa.Column('roi', sa.Float(), nullable=True),
        sa.Column('top_performing_messages', sa.JSON(), nullable=True),
        sa.Column('response_sentiment', sa.JSON(), nullable=True),
        sa.Column('by_channel_performance', sa.JSON(), nullable=True),
        sa.Column('by_time_performance', sa.JSON(), nullable=True),
        sa.Column('last_updated', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['campaign_id'], ['outreach_campaigns.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('campaign_id')
    )
    
    # Create message_templates table
    op.create_table('message_templates',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('user_id', sa.String(), nullable=True),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('category', sa.String(), nullable=True),
        sa.Column('channel', sa.Enum('email', 'instagram', 'whatsapp', 'twitter', 'linkedin', 'sms', 'telegram', name='channel_enum'), nullable=False),
        sa.Column('goal', sa.Enum('sales', 'lead_generation', 'partnership', 'recruitment', 'networking', 'customer_success', 'market_research', 'custom', name='campaign_goal_enum'), nullable=True),
        sa.Column('stage', sa.Enum('initial_contact', 'qualification', 'discovery', 'proposal', 'negotiation', 'closing', 'follow_up', name='conversation_stage_enum'), nullable=True),
        sa.Column('subject', sa.String(), nullable=True),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('variables', sa.JSON(), nullable=True),
        sa.Column('media_urls', sa.JSON(), nullable=True),
        sa.Column('performance_metrics', sa.JSON(), nullable=True),
        sa.Column('tags', sa.JSON(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_message_templates_user_id'), 'message_templates', ['user_id'], unique=False)
    
    # Create channel_credentials table
    op.create_table('channel_credentials',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('user_id', sa.String(), nullable=False),
        sa.Column('channel', sa.Enum('email', 'instagram', 'whatsapp', 'twitter', 'linkedin', 'sms', 'telegram', name='channel_enum'), nullable=False),
        sa.Column('credentials', sa.JSON(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=True),
        sa.Column('rate_limit', sa.Integer(), nullable=True),
        sa.Column('daily_limit', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_channel_credentials_user_id'), 'channel_credentials', ['user_id'], unique=False)
    
    # Create webhook_configs table
    op.create_table('webhook_configs',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('user_id', sa.String(), nullable=False),
        sa.Column('campaign_id', sa.String(), nullable=True),
        sa.Column('channel', sa.Enum('email', 'instagram', 'whatsapp', 'twitter', 'linkedin', 'sms', 'telegram', name='channel_enum'), nullable=True),
        sa.Column('event_types', sa.JSON(), nullable=False),
        sa.Column('url', sa.String(), nullable=False),
        sa.Column('headers', sa.JSON(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=True),
        sa.Column('retry_policy', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['campaign_id'], ['outreach_campaigns.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_webhook_configs_user_id'), 'webhook_configs', ['user_id'], unique=False)
    
    # Create auto_responses table
    op.create_table('auto_responses',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('campaign_id', sa.String(), nullable=False),
        sa.Column('trigger_type', sa.String(), nullable=False),
        sa.Column('trigger_keywords', sa.JSON(), nullable=True),
        sa.Column('response_template', sa.Text(), nullable=False),
        sa.Column('channel_specific_templates', sa.JSON(), nullable=True),
        sa.Column('actions', sa.JSON(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['campaign_id'], ['outreach_campaigns.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create ab_tests table
    op.create_table('ab_tests',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('campaign_id', sa.String(), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('hypothesis', sa.Text(), nullable=True),
        sa.Column('variants', sa.JSON(), nullable=True),
        sa.Column('status', sa.String(), nullable=True),
        sa.Column('winner', sa.String(), nullable=True),
        sa.Column('confidence_level', sa.Float(), nullable=True),
        sa.Column('start_date', sa.DateTime(), nullable=False),
        sa.Column('end_date', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['campaign_id'], ['outreach_campaigns.id'], ),
        sa.PrimaryKeyConstraint('id')
    )

def downgrade():
    # Drop tables in reverse order
    op.drop_table('ab_tests')
    op.drop_table('auto_responses')
    op.drop_table('webhook_configs')
    op.drop_table('channel_credentials')
    op.drop_table('message_templates')
    op.drop_table('campaign_analytics')
    op.drop_table('outreach_messages')
    op.drop_table('conversations')
    op.drop_table('ai_agents')
    op.drop_table('outreach_targets')
    op.drop_table('outreach_campaigns')
    op.drop_table('conversation_flows')
    
    # Drop enum types
    op.execute('DROP TYPE IF EXISTS conversation_stage_enum')
    op.execute('DROP TYPE IF EXISTS campaign_goal_enum')
    op.execute('DROP TYPE IF EXISTS message_status_enum')
    op.execute('DROP TYPE IF EXISTS channel_enum')