from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .config import get_settings
from .database import Base, engine
from .api import auth, catalog, orders, admin, ai

settings = get_settings()

@asynccontextmanager
async def lifespan(_: FastAPI):
    Base.metadata.create_all(engine)
    yield

app = FastAPI(title=settings.app_name, version="0.1.0", description="Manual-payment commerce API", lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins=[settings.frontend_url], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])
for router in (auth.router, catalog.router, orders.router, admin.router, ai.router): app.include_router(router)

@app.get("/health", tags=["system"])
def health(): return {"status": "healthy", "service": "smartcommerce-api"}
