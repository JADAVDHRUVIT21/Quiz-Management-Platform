from fastapi import FastAPI

from app.api.v1.endpoints.auth import router as auth_router
from app.api.v1.endpoints.quiz import router as quiz_router
from app.api.v1.endpoints.question import router as question_router
from app.api.v1.endpoints.quiz_attempt import router as quiz_attempt_router
from app.api.v1.endpoints.answer import router as answer_router
from app.api.v1.endpoints.result import router as result_router
from app.api.v1.endpoints.user import router as user_router

from app.api.certificate import router as certificate_router


app = FastAPI(
    title="Quiz Management Platform API",
    version="1.0.0"
)


app.include_router(
    auth_router,
    prefix="/api/v1"
)

app.include_router(
    quiz_router,
    prefix="/api/v1"
)

app.include_router(
    question_router,
    prefix="/api/v1"
)

app.include_router(
    quiz_attempt_router,
    prefix="/api/v1"
)

app.include_router(
    answer_router,
    prefix="/api/v1"
)

app.include_router(
    result_router,
    prefix="/api/v1"
)

app.include_router(
    user_router,
    prefix="/api/v1"
)

app.include_router(
    certificate_router,
    prefix="/api/v1"
)


@app.get("/")
def root():
    return {
        "message": "Quiz Management Platform API is running 🚀"
    }