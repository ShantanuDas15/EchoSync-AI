import os
import pytest
from unittest.mock import patch, MagicMock, mock_open
import subprocess

from scripts.deploy_migrations import run_migrations

@patch('scripts.deploy_migrations.sqlalchemy.create_engine')
@patch('scripts.deploy_migrations.command')
@patch('scripts.deploy_migrations.glob.glob')
@patch('builtins.open', new_callable=mock_open, read_data="SELECT 1;")
def test_run_migrations_postgres(mock_file, mock_glob, mock_command, mock_create_engine):
    # Setup mocks
    mock_engine = MagicMock()
    mock_engine.dialect.name = "postgresql"
    mock_conn = MagicMock()
    mock_engine.connect.return_value.__enter__.return_value = mock_conn
    mock_create_engine.return_value = mock_engine
    
    mock_glob.return_value = ["supabase/migrations/0001_init.sql"]
    
    os.environ["CI_VALIDATE_MIGRATIONS"] = "true"
    os.environ["ALEMBIC_INI_PATH"] = "dummy.ini"
    
    result = run_migrations(db_url="postgresql://test:test@localhost/test", lock_id=123)
    
    assert result is True
    
    # Check lock acquired and released
    assert mock_conn.execute.call_count >= 3
    calls = mock_conn.execute.call_args_list
    assert "pg_advisory_lock(123)" in calls[0][0][0].text
    
    # Check alembic commands
    assert mock_command.downgrade.call_count == 1
    mock_command.downgrade.assert_called_with(mock_command.downgrade.call_args[0][0], "-1")
    
    assert mock_command.upgrade.call_count == 2
    mock_command.upgrade.assert_called_with(mock_command.upgrade.call_args[0][0], "head")
    
    # Check sql execution
    assert "SELECT 1;" in calls[1][0][0].text
    mock_conn.commit.assert_called()
    
    # Check lock released
    assert "pg_advisory_unlock(123)" in calls[-1][0][0].text
    
    del os.environ["CI_VALIDATE_MIGRATIONS"]
    del os.environ["ALEMBIC_INI_PATH"]

@patch('scripts.deploy_migrations.sqlalchemy.create_engine')
@patch('scripts.deploy_migrations.command')
def test_run_migrations_sqlite(mock_command, mock_create_engine):
    # Setup mocks
    mock_engine = MagicMock()
    mock_engine.dialect.name = "sqlite"
    mock_conn = MagicMock()
    mock_engine.connect.return_value.__enter__.return_value = mock_conn
    mock_create_engine.return_value = mock_engine
    
    result = run_migrations(db_url="sqlite:///:memory:")
    
    assert result is True
    
    # Check lock was NOT acquired since it's sqlite
    mock_conn.execute.assert_not_called()
    
    assert mock_command.upgrade.call_count == 1
    mock_command.upgrade.assert_called_with(mock_command.upgrade.call_args[0][0], "head")

def test_deploy_migrations_shell_script():
    # Execute the shell script with a mocked python3 command to ensure syntax is correct
    script_path = os.path.join(os.path.dirname(__file__), '..', 'scripts', 'deploy_migrations.sh')
    
    env = os.environ.copy()
    # Create a dummy python3 script to intercept the call
    dummy_python_dir = "/tmp/dummy_bin"
    os.makedirs(dummy_python_dir, exist_ok=True)
    with open(f"{dummy_python_dir}/python3", "w") as f:
        f.write("#!/bin/bash\nexit 0\n")
    os.chmod(f"{dummy_python_dir}/python3", 0o755)
    
    env["PATH"] = f"{dummy_python_dir}:{env['PATH']}"
    
    process = subprocess.run(
        ["bash", script_path], 
        env=env, 
        capture_output=True, 
        text=True
    )
    
    assert process.returncode == 0
    assert "Pipeline Completed Successfully" in process.stdout
