import asyncio
import logging
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
import redis.asyncio as redis
from app.core.config import settings

router = APIRouter()
logger = logging.getLogger(__name__)

# EOF Packet definition (0x00FF framing as specified in the plan)
EOF_PACKET = b"\x00\xFF"

@router.websocket("/ws/v1/stream/{task_id}")
async def websocket_stream_audio(websocket: WebSocket, task_id: str):
    await websocket.accept()
    logger.info(f"WebSocket client connected for task: {task_id}")
    
    redis_client = redis.from_url(settings.REDIS_URL, decode_responses=False)
    pubsub = redis_client.pubsub()
    channel_name = f"audio_stream_{task_id}"
    
    await pubsub.subscribe(channel_name)
    
    try:
        while True:
            try:
                message = await asyncio.wait_for(pubsub.get_message(ignore_subscribe_messages=True), timeout=1.0)
                if message and message["type"] == "message":
                    data = message["data"]
                    await websocket.send_bytes(data)
                    if data == EOF_PACKET:
                        logger.info(f"EOF packet sent for task: {task_id}. Closing connection.")
                        break
            except asyncio.TimeoutError:
                continue
    except WebSocketDisconnect:
        logger.info(f"WebSocket client disconnected for task: {task_id}")
    except Exception as e:
        logger.error(f"WebSocket error for task {task_id}: {e}")
    finally:
        await pubsub.unsubscribe(channel_name)
        await pubsub.close()
        await redis_client.aclose()
        try:
            await websocket.close()
        except RuntimeError:
            pass # Already closed
