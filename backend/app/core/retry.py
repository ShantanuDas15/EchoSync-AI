import logging
from tenacity import retry, wait_exponential, stop_after_attempt, retry_if_exception_type
from sqlalchemy.exc import OperationalError, InterfaceError

logger = logging.getLogger(__name__)

def log_retry(retry_state):
    logger.warning(
        f"Database connection error encountered. Retrying in {retry_state.next_action.sleep}s... "
        f"(Attempt {retry_state.attempt_number})"
    )

with_db_retry = retry(
    retry=retry_if_exception_type((OperationalError, InterfaceError)),
    wait=wait_exponential(multiplier=1, min=1, max=10),
    stop=stop_after_attempt(5),
    before_sleep=log_retry,
    reraise=True
)
