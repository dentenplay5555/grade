import json
import redis
from app.config import settings
from app.schemas.submission import SubmissionQueuePayload

class QueueService:
    def __init__(self):
        self.client = redis.Redis(
            host=settings.REDIS_HOST,
            port=settings.REDIS_PORT,
            db=settings.REDIS_DB,
            password=settings.REDIS_PASSWORD or None,
            decode_responses=True
        )

    def enqueue_submission(self, payload: SubmissionQueuePayload) -> bool:
        """
        Pushes a submission payload to the Redis submission queue.
        """
        data = payload.model_dump_json()
        self.client.rpush(settings.REDIS_QUEUE_NAME, data)
        return True

    def get_queue_length(self) -> int:
        """
        Returns the current number of pending submissions in queue.
        """
        return self.client.llen(settings.REDIS_QUEUE_NAME)

    def get_active_user_job_count(self, user_id: str) -> int:
        """
        Inspects running/queued jobs for a specific user to enforce concurrency limits.
        """
        # Count user jobs in Redis if tracked via a set or key
        return int(self.client.get(f"active_jobs:{user_id}") or 0)

queue_service = QueueService()
