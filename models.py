from pydantic import BaseModel, Field
from typing import List, Optional

# Model to manage sections (e.g., Experience, Projects, Research Work) and their display order
class PortfolioSection(BaseModel):
    id: Optional[str] = Field(default=None, alias="_id")
    section_id: str     # e.g., "research-work", "experience"
    title: str          # e.g., "Research Work & Publications"
    order: int = 0      # Precedence ordering (e.g., 1, 2, 3...)

# Model for individual item cards belonging to any section
class PortfolioItem(BaseModel):
    id: Optional[str] = Field(default=None, alias="_id")
    section_id: str     # Links item to a section_id
    title: str          # Item heading
    subtitle: Optional[str] = ""
    meta_tags: List[str] = []
    skills: List[str] = []
    description: str
    image_url: Optional[str] = ""
    order: int = 0

# Model for Core Skills on the Home page
class SkillItem(BaseModel):
    id: Optional[str] = Field(default=None, alias="_id")
    name: str
    category: Optional[str] = "core"

# Model for contact messages
class ContactMessage(BaseModel):
    id: Optional[str] = Field(default=None, alias="_id")
    name: str
    email: str
    message: str
    created_at: Optional[str] = None