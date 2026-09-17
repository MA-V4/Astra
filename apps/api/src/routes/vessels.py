from fastapi import APIRouter

router = APIRouter()

@router.get("/vessels")
async def get_vessels():
    """Phase 2: AISStream integration for live ship tracking."""
    return []
