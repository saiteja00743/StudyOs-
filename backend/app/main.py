from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import chat, pdf

app = FastAPI(
    title="StudyOS AI API",
    description="FastAPI Backend for StudyOS AI Platform — AI Tutor, Notes, PDF Intelligence & Quiz",
    version="1.0.0"
)

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(chat.router)
app.include_router(pdf.router)

@app.get("/")
@app.get("/health")
@app.get("/api/health")
def health_check():
    return {"status": "online", "service": "StudyOS AI Backend", "version": "1.0.0"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
