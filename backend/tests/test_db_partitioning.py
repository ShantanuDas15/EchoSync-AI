import pytest
from unittest.mock import patch, MagicMock
from app.db.base import UsageLog, TelemetryMetric
from app.celery_app.tasks import create_next_month_partitions_task
from datetime import datetime
from sqlalchemy import PrimaryKeyConstraint

def test_models_have_partitioning_configured():
    # Check UsageLog
    usage_args = UsageLog.__table_args__
    has_partitioning = False
    has_composite_pk = False
    
    for arg in usage_args:
        if isinstance(arg, dict) and arg.get('postgresql_partition_by') == 'RANGE (created_at)':
            has_partitioning = True
        if isinstance(arg, PrimaryKeyConstraint):
            if set(arg.columns.keys()) == {'id', 'created_at'}:
                has_composite_pk = True
                
    assert has_partitioning, "UsageLog is missing postgresql_partition_by"
    assert has_composite_pk, "UsageLog is missing composite PrimaryKey (id, created_at)"

    # Check TelemetryMetric
    telemetry_args = TelemetryMetric.__table_args__
    t_has_partitioning = False
    t_has_composite_pk = False
    
    for arg in telemetry_args:
        if isinstance(arg, dict) and arg.get('postgresql_partition_by') == 'RANGE (created_at)':
            t_has_partitioning = True
        if isinstance(arg, PrimaryKeyConstraint):
            if set(arg.columns.keys()) == {'id', 'created_at'}:
                t_has_composite_pk = True
                
    assert t_has_partitioning, "TelemetryMetric is missing postgresql_partition_by"
    assert t_has_composite_pk, "TelemetryMetric is missing composite PrimaryKey (id, created_at)"

@patch('app.db.session.SessionLocal')
def test_create_next_month_partitions_task(mock_session_local):
    # Calculate expected dates dynamically based on current UTC time
    now = datetime.utcnow()
    if now.month == 12:
        next_month = 1
        next_year = now.year + 1
    else:
        next_month = now.month + 1
        next_year = now.year
        
    expected_suffix = f"{next_year}_{next_month:02d}"
    
    # Mock session
    mock_db = MagicMock()
    mock_db.bind.dialect.name = "postgresql"
    mock_session_local.return_value = mock_db
    
    # Run task
    result = create_next_month_partitions_task()
    
    assert result["status"] == "success"
    assert result["partition_suffix"] == expected_suffix
    
    # Verify execute was called with correct partition queries
    assert mock_db.execute.call_count == 2
    
    query_1 = mock_db.execute.call_args_list[0][0][0].text
    query_2 = mock_db.execute.call_args_list[1][0][0].text
    
    assert f"CREATE TABLE IF NOT EXISTS usage_logs_{expected_suffix} PARTITION OF usage_logs" in query_1
    assert f"CREATE TABLE IF NOT EXISTS telemetry_metrics_{expected_suffix} PARTITION OF telemetry_metrics" in query_2
    
    mock_db.commit.assert_called_once()
    mock_db.close.assert_called_once()
    
@patch('app.db.session.SessionLocal')
def test_create_next_month_partitions_task_skips_sqlite(mock_session_local):
    # Mock session with sqlite
    mock_db = MagicMock()
    mock_db.bind.dialect.name = "sqlite"
    mock_session_local.return_value = mock_db
    
    result = create_next_month_partitions_task()
    
    assert result["status"] == "success"
    # Execute should NOT be called
    mock_db.execute.assert_not_called()
    mock_db.commit.assert_not_called()
    mock_db.close.assert_called_once()
