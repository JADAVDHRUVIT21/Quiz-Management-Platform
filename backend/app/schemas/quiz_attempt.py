from pydantic import BaseModel, ConfigDict, Field

# CREATE ATTEMPT

class QuizAttemptCreate(BaseModel):
    quiz_id: int


# ATTEMPT RESPONSE

class QuizAttemptResponse(BaseModel):
    id: int
    user_id: int
    quiz_id: int
    score: int

    model_config = ConfigDict(
        from_attributes=True
    )


# QUESTION REVIEW

class QuizQuestionReview(BaseModel):
    question_id: int
    question_number: int
    question_text: str

    option_a: str | None = None
    option_b: str | None = None
    option_c: str | None = None
    option_d: str | None = None

    selected_answer: str | None = None
    correct_answer: str | None = None

    marks: int

    is_correct: bool
    is_unanswered: bool


# REVIEW QUESTION RESPONSE

class QuizReviewQuestionResponse(BaseModel):
    question_id: int
    question_number: int
    question_text: str

    option_a: str | None = None
    option_b: str | None = None
    option_c: str | None = None
    option_d: str | None = None

    selected_answer: str | None = None
    correct_answer: str | None = None

    marks: int

    status: str


# RESULT RESPONSE

class QuizResultResponse(BaseModel):
    attempt_id: int
    quiz_id: int
    quiz_title: str

    score: int
    total_marks: int

    correct_answers: int
    incorrect_answers: int
    unanswered: int
    total_questions: int

    percentage: float
    result: str

    questions: list[QuizQuestionReview] = Field(
        default_factory=list
    )



# REVIEW RESPONSE

class QuizReviewResponse(BaseModel):
    attempt_id: int
    quiz_id: int
    quiz_title: str

    questions: list[QuizReviewQuestionResponse] = Field(
        default_factory=list
    )