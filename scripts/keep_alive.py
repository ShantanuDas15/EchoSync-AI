import time
import httpx
import logging
import asyncio

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("keep_alive")

# Target the healthz endpoint to keep the Render free tier instance awake
RENDER_URL = "http://localhost:8000/api/v1/healthz" # Replace with actual Render URL in production
INTERVAL_MINUTES = 14

async def ping_server():
    while True:
        try:
            logger.info(f"Pinging {RENDER_URL} to prevent cold start...")
            async with httpx.AsyncClient() as client:
                response = await client.get(RENDER_URL, timeout=10.0)
                logger.info(f"Ping successful: {response.status_code}")
        except Exception as e:
            logger.error(f"Ping failed: {e}")
            
        # Sleep for 14 minutes
        await asyncio.sleep(INTERVAL_MINUTES * 60)

if __name__ == "__main__":
    logger.info("Starting Keep-Alive Daemon...")
    asyncio.run(ping_server())
