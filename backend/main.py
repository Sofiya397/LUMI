from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import init_db

app = FastAPI(title="LUMI API", description="Backend для платформи догляду за шкірою LUMI")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

init_db()


@app.get("/")
def read_root():
    return {"message": "Welcome to LUMI API!"}


if __name__ == '__main__':
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
