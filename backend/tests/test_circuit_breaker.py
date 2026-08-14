import pytest
import time
from app.core.circuit_breaker import DatabaseCircuitBreaker, CircuitBreakerState

def test_circuit_breaker_transitions():
    # Configure with small windows for fast testing
    cb = DatabaseCircuitBreaker(failure_threshold=3, recovery_timeout=0.1, failure_time_window=1)
    
    assert cb.state == CircuitBreakerState.CLOSED
    assert cb.can_execute() == True
    
    # 1st failure
    cb.record_failure()
    assert cb.state == CircuitBreakerState.CLOSED
    
    # 2nd failure
    cb.record_failure()
    assert cb.state == CircuitBreakerState.CLOSED
    
    # 3rd failure - trips the breaker
    cb.record_failure()
    assert cb.state == CircuitBreakerState.OPEN
    assert cb.can_execute() == False
    
    # Wait for recovery timeout
    time.sleep(0.15)
    
    # First execution after timeout should return True (probe)
    assert cb.can_execute() == True
    assert cb.state == CircuitBreakerState.HALF_OPEN
    
    # If the probe fails, it goes back to OPEN
    cb.record_failure()
    assert cb.state == CircuitBreakerState.OPEN
    
    # Wait again
    time.sleep(0.15)
    assert cb.can_execute() == True
    assert cb.state == CircuitBreakerState.HALF_OPEN
    
    # If probe succeeds, it goes back to CLOSED
    cb.record_success()
    assert cb.state == CircuitBreakerState.CLOSED
    assert cb.can_execute() == True
