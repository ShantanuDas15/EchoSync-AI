import time
from enum import Enum
import logging

logger = logging.getLogger(__name__)

class CircuitBreakerState(Enum):
    CLOSED = "CLOSED"
    OPEN = "OPEN"
    HALF_OPEN = "HALF_OPEN"

class DatabaseCircuitBreaker:
    def __init__(self, failure_threshold: int = 5, recovery_timeout: int = 15, failure_time_window: int = 30):
        self.failure_threshold = failure_threshold
        self.recovery_timeout = recovery_timeout
        self.failure_time_window = failure_time_window
        
        self.state = CircuitBreakerState.CLOSED
        self.failures = 0
        self.last_failure_time = 0.0
        self.first_failure_time = 0.0
        
    def record_failure(self):
        current_time = time.time()
        
        if self.state == CircuitBreakerState.HALF_OPEN:
            self.state = CircuitBreakerState.OPEN
            self.last_failure_time = current_time
            logger.error("Circuit breaker: Probe failed, transitioning to OPEN")
            return
            
        if self.failures == 0 or (current_time - self.first_failure_time) > self.failure_time_window:
            self.failures = 1
            self.first_failure_time = current_time
        else:
            self.failures += 1
            
        self.last_failure_time = current_time
        
        if self.failures >= self.failure_threshold and self.state == CircuitBreakerState.CLOSED:
            self.state = CircuitBreakerState.OPEN
            logger.error("Circuit breaker tripped! Transitioning to OPEN state.")

    def record_success(self):
        if self.state == CircuitBreakerState.HALF_OPEN:
            logger.info("Circuit breaker: Probe succeeded, transitioning to CLOSED")
            self.state = CircuitBreakerState.CLOSED
        
        self.failures = 0
        self.first_failure_time = 0.0

    def can_execute(self) -> bool:
        if self.state == CircuitBreakerState.CLOSED:
            return True
            
        if self.state == CircuitBreakerState.OPEN:
            if (time.time() - self.last_failure_time) >= self.recovery_timeout:
                self.state = CircuitBreakerState.HALF_OPEN
                logger.info("Circuit breaker: Recovery timeout reached, transitioning to HALF_OPEN")
                return True
            return False
            
        # If HALF_OPEN, we only let one probe through (this is simple logic, assumes single thread/asyncio loop)
        return False

# Global instance for the worker
db_circuit_breaker = DatabaseCircuitBreaker()
