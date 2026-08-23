import os
import secrets
import base64
import httpx
from fastapi import FastAPI, UploadFile, File, Form, Body, HTTPException, Depends, Cookie, Response, status
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, RedirectResponse
from typing import List, Optional, Dict, Any
from database import db
from bson import ObjectId
import re

app = FastAPI(title="Portfolio Backend", version="1.0")

# --- IMGBB API CONFIGURATION (For Portfolio Images) ---
IMGBB_API_KEY = "3047152fd7c4a86855437e5a8daa9424"  # ImgBB API key

# Mount static folders for assets
app.mount("/css", StaticFiles(directory="frontend/css"), name="css")
app.mount("/javascript", StaticFiles(directory="frontend/javascript"), name="javascript")

# --- ADMIN AUTHENTICATION CONFIG & SESSION STORE ---
ADMIN_USERNAME = os.getenv("ADMIN_USERNAME", "admin")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "securepassword123")

# In-memory store for active admin session tokens
active_sessions = set()

async def verify_admin(admin_session: Optional[str] = Cookie(None)):
    """Dependency to verify active admin session cookie"""
    if not admin_session or admin_session not in active_sessions:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
    return True


# --- AUTHENTICATION API ROUTES ---
@app.get("/admin.html")
async def read_admin_html(admin_session: Optional[str] = Cookie(None)):
    """Fallback route for /admin.html so it redirects to login or serves admin panel"""
    if not admin_session or admin_session not in active_sessions:
        return RedirectResponse(url="/login", status_code=303)
    return FileResponse(os.path.join("frontend", "admin.html"))

@app.post("/api/admin/login")
async def admin_login(response: Response, username: str = Form(...), password: str = Form(...)):
    """Authenticate admin and set a secure session cookie"""
    if username == ADMIN_USERNAME and password == ADMIN_PASSWORD:
        token = secrets.token_hex(32)
        active_sessions.add(token)
        response.set_cookie(key="admin_session", value=token, httponly=True, samesite="lax")
        return {"status": "success", "message": "Logged in successfully"}
    raise HTTPException(status_code=401, detail="Invalid username or password")

@app.post("/api/admin/logout")
async def admin_logout(response: Response, admin_session: Optional[str] = Cookie(None)):
    """Clear admin session cookie and remove from active store"""
    if admin_session in active_sessions:
        active_sessions.remove(admin_session)
    response.delete_cookie(key="admin_session")
    return {"status": "success", "message": "Logged out successfully"}


# --- PUBLIC & PAGE-BASED API ROUTES ---

@app.get("/api/pages/{page_name}/sections")
async def get_page_sections(page_name: str):
    """Fetch sections belonging to a specific page sorted by precedence order"""
    sections = []
    cursor = db.sections.find({"page_name": page_name}).sort("order", 1)
    async for document in cursor:
        document["_id"] = str(document["_id"])
        sections.append(document)
    return sections

@app.get("/api/sections")
async def get_sections():
    """Fetch all portfolio sections sorted by precedence order"""
    sections = []
    cursor = db.sections.find({}).sort("order", 1)
    async for document in cursor:
        document["_id"] = str(document["_id"])
        sections.append(document)
    return sections

@app.get("/api/items/{section_id}")
async def get_items_by_section(section_id: str):
    """Fetch items belonging to the exact section ID or mapped category without duplication"""
    items: List[Any] = []
    seen_ids = set()

    # 1. Try exact section_id match first
    cursor = db.portfolio_items.find({"section_id": section_id}).sort("order", 1)
    async for document in cursor:
        doc_id = str(document["_id"])
        if doc_id not in seen_ids:
            seen_ids.add(doc_id)
            document["_id"] = doc_id
            items.append(document)

    # 2. If no exact match, fetch items matching the category keyword via regex
    if not items:
        category_keyword = section_id.lower()
        if any(k in category_keyword for k in ["project", "work", "projects"]):
            search_regex = re.compile("project|work|projects", re.IGNORECASE)
        elif any(k in category_keyword for k in ["experienc", "intern", "job"]):
            search_regex = re.compile("experienc|intern|job", re.IGNORECASE)
        elif any(k in category_keyword for k in ["communit", "leader", "club"]):
            search_regex = re.compile("communit|leader|club", re.IGNORECASE)
        elif any(k in category_keyword for k in ["research", "publication"]):
            search_regex = re.compile("research|publication", re.IGNORECASE)
        else:
            search_regex = re.compile(section_id, re.IGNORECASE)

        cursor = db.portfolio_items.find({"section_id": {"$regex": search_regex}}).sort("order", 1)
        async for document in cursor:
            doc_id = str(document["_id"])
            if doc_id not in seen_ids:
                seen_ids.add(doc_id)
                document["_id"] = doc_id
                items.append(document)
            
    return items

@app.get("/api/skills")
async def get_skills():
    """Fetch core skills for the homepage"""
    skills = []
    cursor = db.skills.find({})
    async for document in cursor:
        document["_id"] = str(document["_id"])
        skills.append(document)
    return skills

@app.post("/api/contact")
async def submit_contact(name: str = Form(...), email: str = Form(...), message: str = Form(...)):
    """Handle contact messages"""
    message_doc = {
        "name": name,
        "email": email,
        "message": message,
    }
    result = await db.contacts.insert_one(message_doc)
    return {"status": "success", "message_id": str(result.inserted_id)}


# --- CV DOWNLOAD ENDPOINT (Google Drive Direct Redirect) ---
@app.get("/api/cv/download")
async def download_cv():
    """Redirect user directly to your Google Drive CV file"""
    direct_drive_url = "https://drive.google.com/uc?export=download&id=1OvfRpTyYb64CprCjxGbr7Y19Ma10kErw"
    return RedirectResponse(direct_drive_url)


# --- ADMIN CRUD & PORTFOLIO ITEM UPLOAD API ROUTES ---
@app.post("/api/admin/sections")
async def save_section(section_data: dict = Body(...), auth: bool = Depends(verify_admin)):
    """Add or update a portfolio section with automatic precedence shifting"""
    page_name = section_data.get("page_name")
    section_id = section_data.get("section_id")
    new_order = int(section_data.get("order", 1))

    await db.sections.update_many(
        {"page_name": page_name, "order": {"$gte": new_order}, "section_id": {"$ne": section_id}},
        {"$inc": {"order": 1}}
    )

    await db.sections.update_one(
        {"section_id": section_id},
        {"$set": section_data},
        upsert=True
    )
    return {"status": "success", "message": f"Section '{section_id}' saved successfully with order {new_order}."}

@app.delete("/api/admin/sections/{section_id}")
async def delete_section(section_id: str, auth: bool = Depends(verify_admin)):
    """Delete a section and its items"""
    await db.sections.delete_one({"section_id": section_id})
    await db.portfolio_items.delete_many({"section_id": section_id})
    return {"status": "success", "message": f"Section '{section_id}' deleted."}

@app.post("/api/admin/items")
async def save_portfolio_item(
    item_id: Optional[str] = Form(None),
    section_id: str = Form(...),
    title: str = Form(...),
    subtitle: Optional[str] = Form(""),
    meta_tags: str = Form(""),
    skills: str = Form(""),
    description: str = Form(...),
    order: int = Form(0),
    remove_image: Optional[str] = Form(None),  # <--- MOVED ABOVE IMAGE TO PREVENT PARSING DROPOFF
    image: Optional[UploadFile] = File(None),
    auth: bool = Depends(verify_admin)
):
    print(f"DEBUG ---> remove_image received: {remove_image}")
    
    """Create or update a portfolio item, uploading images to ImgBB or removing them"""
    image_url = None
    if image and image.filename:
        try:
            image_content = await image.read()
            base64_image = base64.b64encode(image_content).decode("utf-8")
            
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    "https://api.imgbb.com/1/upload",
                    data={
                        "key": IMGBB_API_KEY,
                        "image": base64_image,
                    }
                )
                
                result_json = response.json()
                if response.status_code == 200 and result_json.get("success"):
                    image_url = result_json["data"]["url"]
                else:
                    raise HTTPException(status_code=500, detail="Failed to upload image to ImgBB.")
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Image upload failed: {str(e)}")

    meta_list = [tag.strip() for tag in meta_tags.split(",") if tag.strip()]
    skills_list = [skill.strip() for skill in skills.split(",") if skill.strip()]

    item_doc = {
        "section_id": section_id,
        "title": title,
        "subtitle": subtitle,
        "meta_tags": meta_list,
        "skills": skills_list,
        "description": description,
        "order": order
    }

    if item_id:
        update_ops = {"$set": item_doc}
        
        if image_url:
            update_ops["$set"]["image_url"] = image_url
        elif remove_image == "true":
            update_ops["$unset"] = {"image_url": ""}

        await db.portfolio_items.update_many(
            {"section_id": section_id, "order": {"$gte": order}, "_id": {"$ne": ObjectId(item_id)}},
            {"$inc": {"order": 1}}
        )
        await db.portfolio_items.update_one({"_id": ObjectId(item_id)}, update_ops)
        return {"status": "success", "message": "Item updated successfully"}
    else:
        if image_url:
            item_doc["image_url"] = image_url
            
        await db.portfolio_items.update_many(
            {"section_id": section_id, "order": {"$gte": order}},
            {"$inc": {"order": 1}}
        )
        result = await db.portfolio_items.insert_one(item_doc)
        return {"status": "success", "message": "Item created successfully", "id": str(result.inserted_id)}

@app.delete("/api/admin/items/{item_id}")
async def delete_portfolio_item(item_id: str, auth: bool = Depends(verify_admin)):
    """Delete a portfolio item by its ID"""
    await db.portfolio_items.delete_one({"_id": ObjectId(item_id)})
    return {"status": "success", "message": "Item deleted successfully"}

@app.post("/api/admin/skills")
async def save_skill(skill_data: dict = Body(...), auth: bool = Depends(verify_admin)):
    """Add or update a skill"""
    skill_id = skill_data.get("skill_id")
    name = skill_data.get("name")
    
    if skill_id:
        await db.skills.update_one({"_id": ObjectId(skill_id)}, {"$set": {"name": name}})
        return {"status": "success", "message": "Skill updated"}
    else:
        result = await db.skills.insert_one({"name": name})
        return {"status": "success", "message": "Skill added", "id": str(result.inserted_id)}

@app.delete("/api/admin/skills/{skill_id}")
async def delete_skill(skill_id: str, auth: bool = Depends(verify_admin)):
    """Delete a skill by ID"""
    await db.skills.delete_one({"_id": ObjectId(skill_id)})
    return {"status": "success", "message": "Skill deleted"}


# --- PAGE ROUTING (CLEAN URLS & AUTHENTICATED ADMIN) ---

@app.get("/")
async def read_index():
    return FileResponse(os.path.join("frontend", "index.html"))

@app.get("/experience")
async def read_experience():
    return FileResponse(os.path.join("frontend", "experience.html"))

@app.get("/projects")
async def read_projects():
    return FileResponse(os.path.join("frontend", "projects.html"))

@app.get("/community")
async def read_community():
    return FileResponse(os.path.join("frontend", "community.html"))

@app.get("/research")
async def read_research():
    return FileResponse(os.path.join("frontend", "research.html"))

@app.get("/lets-talk")
async def read_lets_talk():
    return FileResponse(os.path.join("frontend", "lets-talk.html"))

@app.get("/login")
async def read_login():
    return FileResponse(os.path.join("frontend", "login.html"))

@app.get("/admin")
async def read_admin(admin_session: Optional[str] = Cookie(None)):
    """Protect admin page view—redirects to /login if unauthenticated"""
    if not admin_session or admin_session not in active_sessions:
        return RedirectResponse(url="/login", status_code=303)
    return FileResponse(os.path.join("frontend", "admin.html"))

@app.get("/api/health")
async def health_check():
    try:
        await db.command("ping")
        return {"status": "healthy", "database": "connected to MongoDB Atlas"}
    except Exception as e:
        return {"status": "unhealthy", "error": str(e)}