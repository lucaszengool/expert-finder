"""add marketplace and expert dna tables

Revision ID: 001
Revises: 
Create Date: 2025-01-01 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '001'
down_revision = None
branch_labels = None
depends_on = None

def upgrade():
    # Create marketplace_offerings table
    op.create_table(
        'marketplace_offerings',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('expert_id', sa.String(), nullable=False),
        sa.Column('title', sa.String(), nullable=False),
        sa.Column('description', sa.Text()),
        sa.Column('type', sa.String()),
        sa.Column('duration_minutes', sa.Integer()),
        sa.Column('price', sa.Float()),
        sa.Column('currency', sa.String(), server_default='USD'),
        sa.Column('max_participants', sa.Integer(), server_default='1'),
        sa.Column('skills_covered', postgresql.JSON()),
        sa.Column('availability', postgresql.JSON()),
        sa.Column('rating', sa.Float()),
        sa.Column('total_sessions', sa.Integer(), server_default='0'),
        sa.Column('is_active', sa.Boolean(), server_default='true'),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create bookings table
    op.create_table(
        'bookings',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('offering_id', sa.String(), nullable=False),
        sa.Column('client_id', sa.String(), nullable=False),
        sa.Column('expert_id', sa.String(), nullable=False),
        sa.Column('scheduled_at', sa.DateTime(), nullable=False),
        sa.Column('duration_minutes', sa.Integer()),
        sa.Column('status', sa.String(), server_default='pending'),
        sa.Column('payment_status', sa.String(), server_default='pending'),
        sa.Column('payment_amount', sa.Float()),
        sa.Column('payment_intent_id', sa.String()),
        sa.Column('notes', sa.Text()),
        sa.Column('meeting_link', sa.String()),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create expert_dna_profiles table
    op.create_table(
        'expert_dna_profiles',
        sa.Column('expert_id', sa.String(), nullable=False),
        sa.Column('work_style', sa.String()),
        sa.Column('communication_style', sa.String()),
        sa.Column('approach', sa.String()),
        sa.Column('personality_traits', postgresql.JSON()),
        sa.Column('industry_focus', postgresql.JSON()),
        sa.Column('client_preferences', postgresql.JSON()),
        sa.Column('preferred_project_size', sa.String()),
        sa.Column('time_zone', sa.String()),
        sa.Column('languages', postgresql.JSON()),
        sa.Column('tools_used', postgresql.JSON()),
        sa.Column('certifications', postgresql.JSON()),
        sa.Column('teaching_style', sa.String()),
        sa.Column('availability_preference', sa.String()),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('expert_id')
    )
    
    # Create reviews table
    op.create_table(
        'reviews',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('booking_id', sa.String(), nullable=False),
        sa.Column('client_id', sa.String(), nullable=False),
        sa.Column('expert_id', sa.String(), nullable=False),
        sa.Column('rating', sa.Float(), nullable=False),
        sa.Column('comment', sa.Text()),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create indexes
    op.create_index('idx_offerings_expert', 'marketplace_offerings', ['expert_id'])
    op.create_index('idx_bookings_client', 'bookings', ['client_id'])
    op.create_index('idx_bookings_expert', 'bookings', ['expert_id'])
    op.create_index('idx_reviews_expert', 'reviews', ['expert_id'])

def downgrade():
    op.drop_index('idx_reviews_expert')
    op.drop_index('idx_bookings_expert')
    op.drop_index('idx_bookings_client')
    op.drop_index('idx_offerings_expert')
    
    op.drop_table('reviews')
    op.drop_table('expert_dna_profiles')
    op.drop_table('bookings')
    op.drop_table('marketplace_offerings')
