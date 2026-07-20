from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ..ai.graph import run_assistant
from ..database import get_db
from ..models import User
from ..schemas import ChatIn
from ..security import current_user

router = APIRouter(prefix="/api/ai", tags=["AI assistant"])

@router.post("/chat")
def chat(data: ChatIn, db: Session = Depends(get_db), user: User = Depends(current_user)):
    return run_assistant(data.message, user.role, db)

