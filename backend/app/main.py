from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.api.v1 import problems as user_problems, submissions as user_submissions, users as user_routes
from app.admin.v1 import problems as admin_problems, submissions as admin_submissions, users as admin_users, system as admin_system

app = FastAPI(
    title=settings.APP_NAME,
    version="1.0.0",
    docs_url="/api/docs" if settings.DEBUG else None,
    redoc_url="/api/redoc" if settings.DEBUG else None,
    openapi_url="/api/openapi.json" if settings.DEBUG else None,
)

# CORS Middleware: Only wide-open in DEBUG mode (dev only)
# In production, Caddy handles all routing on same origin — CORS is not needed
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if settings.DEBUG else ["http://localhost:8080", "http://127.0.0.1:8080"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["Authorization", "Content-Type"],
)

# User API Routes (/api/v1/...)
app.include_router(user_problems.router, prefix="/api/v1")
app.include_router(user_submissions.router, prefix="/api/v1")
app.include_router(user_routes.router, prefix="/api/v1")

# Admin API Routes (/admin/v1/...)
app.include_router(admin_problems.router, prefix="/admin/v1")
app.include_router(admin_submissions.router, prefix="/admin/v1")
app.include_router(admin_users.router, prefix="/admin/v1")
app.include_router(admin_system.router, prefix="/admin/v1")

@app.get("/api/health")
def health_check():
    return {"status": "ok", "app": settings.APP_NAME}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host=settings.HOST, port=settings.PORT, reload=settings.DEBUG)
