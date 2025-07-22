from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers
revision = 'add_outreach_tables'
down_revision = 'previous_revision'
branch_labels = None
depends_on = None

def upgrade():
    # Create email_templates table
    op.create_table('email_templates',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('category', sa.String(), nullable=True),
        sa.Column('subject_pattern', sa.Text(), nullable=True),
        sa.Column('body_pattern', sa.Text(), nullable=True),
        sa.Column('variables', sa.JSON(), nullable=True),
        sa.Column('tone', sa.String(), nullable=True),
        sa.Column('success_rate', sa.Float(), nullable=True),
        sa.Column('learned_from_count', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.text('now()'), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create outreach_campaigns table
    op.create_table('outreach_campaigns',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('status', sa.String(), nullable=True),
        sa.Column('target_type', sa.String(), nullable=True),
        sa.Column('search_query', sa.Text(), nullable=True),
        sa.Column('template_id', sa.String(), nullable=True),
        sa.Column('personalization_level', sa.String(), nullable=True),
        sa.Column('total_targets', sa.Integer(), nullable=True),
        sa.Column('emails_sent', sa.Integer(), nullable=True),
        sa.Column('emails_opened', sa.Integer(), nullable=True),
        sa.Column('emails_replied', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['template_id'], ['email_templates.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create outreach_targets table
    op.create_table('outreach_targets',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('campaign_id', sa.String(), nullable=True),
        sa.Column('target_type', sa.String(), nullable=True),
        sa.Column('name', sa.String(), nullable=True),
        sa.Column('email', sa.String(), nullable=True),
        sa.Column('title', sa.String(), nullable=True),
        sa.Column('company', sa.String(), nullable=True),
        sa.Column('location', sa.String(), nullable=True),
        sa.Column('profile_url', sa.String(), nullable=True),
        sa.Column('data', sa.JSON(), nullable=True),
        sa.Column('status', sa.String(), nullable=True),
        sa.Column('personalized_subject', sa.Text(), nullable=True),
        sa.Column('personalized_body', sa.Text(), nullable=True),
        sa.Column('sent_at', sa.DateTime(), nullable=True),
        sa.Column('opened_at', sa.DateTime(), nullable=True),
        sa.Column('replied_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['campaign_id'], ['outreach_campaigns.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create outreach_emails table
    op.create_table('outreach_emails',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('campaign_id', sa.String(), nullable=True),
        sa.Column('target_id', sa.String(), nullable=True),
        sa.Column('direction', sa.String(), nullable=True),
        sa.Column('subject', sa.Text(), nullable=True),
        sa.Column('body', sa.Text(), nullable=True),
        sa.Column('sent_at', sa.DateTime(), nullable=True),
        sa.Column('opened_at', sa.DateTime(), nullable=True),
        sa.Column('replied_at', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['campaign_id'], ['outreach_campaigns.id'], ),
        sa.ForeignKeyConstraint(['target_id'], ['outreach_targets.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create indexes
    op.create_index('idx_campaigns_status', 'outreach_campaigns', ['status'])
    op.create_index('idx_targets_campaign', 'outreach_targets', ['campaign_id'])
    op.create_index('idx_targets_status', 'outreach_targets', ['status'])
    op.create_index('idx_emails_campaign', 'outreach_emails', ['campaign_id'])
    op.create_index('idx_emails_target', 'outreach_emails', ['target_id'])

def downgrade():
    # Drop indexes
    op.drop_index('idx_emails_target')
    op.drop_index('idx_emails_campaign')
    op.drop_index('idx_targets_status')
    op.drop_index('idx_targets_campaign')
    op.drop_index('idx_campaigns_status')
    
    # Drop tables
    op.drop_table('outreach_emails')
    op.drop_table('outreach_targets')
    op.drop_table('outreach_campaigns')
    op.drop_table('email_templates')