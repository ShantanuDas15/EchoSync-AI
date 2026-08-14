"""initial_schema

Revision ID: 0001
Revises: 
Create Date: 2026-08-14 20:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '0001'
down_revision = None
branch_labels = None
depends_on = None

def upgrade() -> None:
    conn = op.get_bind()
    is_pg = conn.dialect.name == "postgresql"

    if is_pg:
        op.execute('CREATE EXTENSION IF NOT EXISTS vector')
        op.execute('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"')

        user_tier_enum = postgresql.ENUM('free', 'pro', 'enterprise', name='user_tier_enum')
        user_tier_enum.create(op.get_bind(), checkfirst=True)
        gender_enum = postgresql.ENUM('male', 'female', 'non_binary', 'unspecified', name='gender_enum')
        gender_enum.create(op.get_bind(), checkfirst=True)
        visibility_enum = postgresql.ENUM('private', 'shared', 'public', 'system_preset', name='visibility_enum')
        visibility_enum.create(op.get_bind(), checkfirst=True)
        job_status_enum = postgresql.ENUM('queued', 'processing', 'streaming', 'completed', 'failed', 'cancelled', name='job_status_enum')
        job_status_enum.create(op.get_bind(), checkfirst=True)
        api_key_status_enum = postgresql.ENUM('active', 'revoked', 'expired', name='api_key_status_enum')
        api_key_status_enum.create(op.get_bind(), checkfirst=True)

    op.create_table('users',
        sa.Column('id', sa.UUID(), server_default=sa.text('gen_random_uuid()' if is_pg else '(lower(hex(randomblob(16))))'), nullable=False),
        sa.Column('sub', sa.String(length=255), nullable=False),
        sa.Column('email', sa.String(length=255), nullable=True),
        sa.Column('full_name', sa.String(length=255), nullable=True),
        sa.Column('tier', sa.String(length=32), server_default='free', nullable=False),
        sa.Column('api_quota_monthly', sa.Integer(), server_default='50000', nullable=False),
        sa.Column('is_active', sa.Boolean(), server_default='1', nullable=False),
        sa.Column('metadata', sa.JSON() if not is_pg else postgresql.JSONB(astext_type=sa.Text()), server_default='{}', nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('email'),
        sa.UniqueConstraint('sub')
    )

    op.create_table('audio_assets',
        sa.Column('id', sa.UUID(), server_default=sa.text('gen_random_uuid()' if is_pg else '(lower(hex(randomblob(16))))'), nullable=False),
        sa.Column('user_id', sa.UUID(), nullable=True),
        sa.Column('storage_bucket', sa.String(length=128), server_default='echosync-audio-vault', nullable=False),
        sa.Column('r2_object_key', sa.String(length=512), nullable=False),
        sa.Column('file_name', sa.String(length=255), nullable=False),
        sa.Column('content_hash', sa.String(length=64), nullable=False),
        sa.Column('mime_type', sa.String(length=64), server_default='audio/wav', nullable=False),
        sa.Column('file_size_bytes', sa.BigInteger(), nullable=False),
        sa.Column('duration_seconds', sa.Numeric(precision=8, scale=3), nullable=False),
        sa.Column('sample_rate', sa.Integer(), server_default='22050', nullable=False),
        sa.Column('channels', sa.SmallInteger(), server_default='1', nullable=False),
        sa.Column('bit_depth', sa.SmallInteger(), server_default='16', nullable=False),
        sa.Column('is_reference_sample', sa.Boolean(), server_default='0', nullable=False),
        sa.Column('metadata', sa.JSON() if not is_pg else postgresql.JSONB(astext_type=sa.Text()), server_default='{}', nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('r2_object_key')
    )

    op.create_table('speaker_profiles',
        sa.Column('id', sa.UUID(), server_default=sa.text('gen_random_uuid()' if is_pg else '(lower(hex(randomblob(16))))'), nullable=False),
        sa.Column('user_id', sa.UUID(), nullable=True),
        sa.Column('speaker_name', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('gender', sa.String(length=32), server_default='unspecified', nullable=False),
        sa.Column('language_code', sa.String(length=10), server_default='en-US', nullable=False),
        sa.Column('embedding', sa.Text(), nullable=False), 
        sa.Column('reference_audio_id', sa.UUID(), nullable=True),
        sa.Column('reference_audio_url', sa.Text(), nullable=True),
        sa.Column('visibility', sa.String(length=32), server_default='private', nullable=False),
        sa.Column('is_active', sa.Boolean(), server_default='1', nullable=False),
        sa.Column('metadata', sa.JSON() if not is_pg else postgresql.JSONB(astext_type=sa.Text()), server_default='{}', nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['reference_audio_id'], ['audio_assets.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )

    op.create_table('api_keys',
        sa.Column('id', sa.UUID(), server_default=sa.text('gen_random_uuid()' if is_pg else '(lower(hex(randomblob(16))))'), nullable=False),
        sa.Column('user_id', sa.UUID(), nullable=False),
        sa.Column('key_name', sa.String(length=128), nullable=False),
        sa.Column('key_prefix', sa.String(length=16), nullable=False),
        sa.Column('key_hash', sa.String(length=128), nullable=False),
        sa.Column('scopes', sa.JSON() if not is_pg else postgresql.JSONB(astext_type=sa.Text()), server_default='[]', nullable=False),
        sa.Column('rate_limit_per_minute', sa.Integer(), server_default='60', nullable=False),
        sa.Column('status', sa.String(length=32), server_default='active', nullable=False),
        sa.Column('last_used_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('expires_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('key_hash')
    )

    op.create_table('synthesis_jobs',
        sa.Column('id', sa.UUID(), server_default=sa.text('gen_random_uuid()' if is_pg else '(lower(hex(randomblob(16))))'), nullable=False),
        sa.Column('task_id', sa.String(length=128), nullable=False),
        sa.Column('user_id', sa.UUID(), nullable=True),
        sa.Column('speaker_profile_id', sa.UUID(), nullable=True),
        sa.Column('prompt_text', sa.Text(), nullable=False),
        sa.Column('phoneme_sequence', sa.Text(), nullable=True),
        sa.Column('speed_modifier', sa.Numeric(precision=3, scale=2), server_default='1.00', nullable=False),
        sa.Column('pitch_modifier', sa.Numeric(precision=3, scale=2), server_default='1.00', nullable=False),
        sa.Column('energy_modifier', sa.Numeric(precision=3, scale=2), server_default='1.00', nullable=False),
        sa.Column('acoustic_model', sa.String(length=64), server_default='fastspeech2_fp16', nullable=False),
        sa.Column('vocoder_model', sa.String(length=64), server_default='hifigan_fp16', nullable=False),
        sa.Column('status', sa.String(length=32), server_default='queued', nullable=False),
        sa.Column('output_audio_id', sa.UUID(), nullable=True),
        sa.Column('real_time_factor', sa.Numeric(precision=6, scale=4), nullable=True),
        sa.Column('ttfb_ms', sa.Integer(), nullable=True),
        sa.Column('worker_id', sa.String(length=128), nullable=True),
        sa.Column('execution_engine', sa.String(length=64), server_default='hf_cpu_onnx', nullable=False),
        sa.Column('error_detail', sa.JSON() if not is_pg else postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('queued_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.Column('started_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('completed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.ForeignKeyConstraint(['output_audio_id'], ['audio_assets.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['speaker_profile_id'], ['speaker_profiles.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('task_id')
    )

    op.create_table('usage_logs',
        sa.Column('id', sa.UUID(), server_default=sa.text('gen_random_uuid()' if is_pg else '(lower(hex(randomblob(16))))'), nullable=False),
        sa.Column('user_id', sa.UUID(), nullable=False),
        sa.Column('api_key_id', sa.UUID(), nullable=True),
        sa.Column('synthesis_job_id', sa.UUID(), nullable=True),
        sa.Column('characters_count', sa.Integer(), server_default='0', nullable=False),
        sa.Column('audio_duration_seconds', sa.Numeric(precision=8, scale=3), server_default='0.000', nullable=False),
        sa.Column('compute_ms', sa.Integer(), server_default='0', nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.ForeignKeyConstraint(['api_key_id'], ['api_keys.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['synthesis_job_id'], ['synthesis_jobs.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )

    op.create_table('telemetry_metrics',
        sa.Column('id', sa.UUID(), server_default=sa.text('gen_random_uuid()' if is_pg else '(lower(hex(randomblob(16))))'), nullable=False),
        sa.Column('job_id', sa.String(length=128), nullable=True),
        sa.Column('metric_name', sa.String(length=128), nullable=False),
        sa.Column('metric_value', sa.Float(), nullable=False),
        sa.Column('labels', sa.JSON() if not is_pg else postgresql.JSONB(astext_type=sa.Text()), server_default='{}', nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )


def downgrade() -> None:
    op.drop_table('telemetry_metrics')
    op.drop_table('usage_logs')
    op.drop_table('synthesis_jobs')
    op.drop_table('api_keys')
    op.drop_table('speaker_profiles')
    op.drop_table('audio_assets')
    op.drop_table('users')
    
    conn = op.get_bind()
    is_pg = conn.dialect.name == "postgresql"
    if is_pg:
        postgresql.ENUM(name='api_key_status_enum').drop(op.get_bind(), checkfirst=True)
        postgresql.ENUM(name='job_status_enum').drop(op.get_bind(), checkfirst=True)
        postgresql.ENUM(name='visibility_enum').drop(op.get_bind(), checkfirst=True)
        postgresql.ENUM(name='gender_enum').drop(op.get_bind(), checkfirst=True)
        postgresql.ENUM(name='user_tier_enum').drop(op.get_bind(), checkfirst=True)
