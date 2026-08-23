document.addEventListener("DOMContentLoaded", () => {
    const pageSelector = document.getElementById("page-selector");
    const workspace = document.getElementById("workspace");
    const sectionsContainer = document.getElementById("page-sections-container");
    const sectionForm = document.getElementById("section-form");
    const itemForm = document.getElementById("item-form");
    const sectionSelect = document.getElementById("item-section-id");
    const itemCreationSection = document.getElementById("item-creation-section");
    const homePageOptions = document.getElementById("home-page-options");

    const sectionsHeading = document.getElementById("sections-heading");
    const newSectionHeading = document.getElementById("new-section-heading");
    const itemsHeading = document.getElementById("items-heading");

    // Skills input toggle elements
    const secIsSkillsSelect = document.getElementById("sec-is-skills");
    const sectionSkillsInputWrapper = document.getElementById("section-skills-input-wrapper");
    const secMappedPageSelect = document.getElementById("sec-mapped-page");

    if (secIsSkillsSelect) {
        secIsSkillsSelect.addEventListener("change", () => {
            if (secIsSkillsSelect.value === "true") {
                sectionSkillsInputWrapper.style.display = "block";
                secMappedPageSelect.value = "";
                secMappedPageSelect.disabled = true;
            } else {
                sectionSkillsInputWrapper.style.display = "none";
                secMappedPageSelect.disabled = false;
            }
        });
    }

    // Modal Elements
    const editModal = document.getElementById("edit-modal");
    const closeModalBtn = document.getElementById("close-modal");
    const editModalForm = document.getElementById("edit-modal-form");
    const editItemFieldsWrapper = document.getElementById("edit-item-fields-wrapper");
    const editHomeOptions = document.getElementById("edit-home-options");
    const editSkillsWrapper = document.getElementById("edit-skills-wrapper");

    // =========================================================================
    // BULLETPROOF EVENT DELEGATION: Catches the click no matter when/where it renders
    // =========================================================================
    document.addEventListener("click", (e) => {
        if (e.target && (e.target.id === "clear-item-image" || e.target.id === "clear-edit-item-image")) {
            e.preventDefault();
            if (confirm("Are you sure you want to remove this image?")) {
                const fileInput = document.getElementById("edit-item-image");
                const flagInput = document.getElementById("remove-image-flag");
                
                if (fileInput) fileInput.value = "";
                if (flagInput) {
                    flagInput.value = "true";
                    console.log("Remove image flag explicitly set to true");
                }
                alert("Image marked for removal. Click 'Save Changes' to apply.");
            }
        }
    });
    // =========================================================================

    async function loadPageData() {
        const selectedPage = pageSelector.value;
        if (!selectedPage) {
            workspace.style.display = "none";
            return;
        }

        workspace.style.display = "block";

        if (selectedPage === "home") {
            sectionsHeading.textContent = "2. Manage Home Page Sections";
            newSectionHeading.textContent = "+ Add New Home Section";
            itemsHeading.textContent = "3. Add Content Item";
            homePageOptions.style.display = "block";
            itemCreationSection.style.display = "none";
        } else {
            const pageNameFormatted = selectedPage.charAt(0).toUpperCase() + selectedPage.slice(1);
            sectionsHeading.textContent = `2. Manage Sections on ${pageNameFormatted} Page`;
            newSectionHeading.textContent = `+ Add New Section to ${pageNameFormatted}`;
            itemsHeading.textContent = `3. Add Content Item to ${pageNameFormatted}`;
            homePageOptions.style.display = "none";
            itemCreationSection.style.display = "block";
        }

        try {
            const res = await fetch(`/api/pages/${selectedPage}/sections`);
            const sections = await res.json();

            sectionsContainer.innerHTML = "";
            sectionSelect.innerHTML = '<option value="" disabled selected>Select Target Section...</option>';

            if (sections.length === 0) {
                sectionsContainer.innerHTML = `<p style="color: var(--text-muted);">No sections found for '${selectedPage}' page. Add one below!</p>`;
                return;
            }

            for (const sec of sections) {
                const opt = document.createElement("option");
                opt.value = sec.section_id;
                opt.textContent = `${sec.title} (${sec.section_id})`;
                sectionSelect.appendChild(opt);

                const card = document.createElement("div");
                card.style.cssText = "display: flex; justify-content: space-between; align-items: center; background: rgba(255,255,255,0.03); border: 1px solid var(--border-color); padding: 1rem; border-radius: 8px;";
                
                let detailsText = `Precedence Order: ${sec.order}`;
                if (selectedPage === "home") {
                    if (sec.is_skills) detailsText += ` | Type: Skills Section`;
                    if (sec.mapped_page) detailsText += ` | Mapped Page: ${sec.mapped_page}`;
                }

                card.innerHTML = `
                    <div>
                        <strong>${sec.title}</strong> <span style="color: var(--text-muted); font-size: 0.85rem;">[ID: ${sec.section_id}]</span>
                        <div style="font-size: 0.85rem; color: var(--accent-color);">${detailsText}</div>
                    </div>
                    <div style="display: flex; gap: 0.75rem;">
                        <button type="button" onclick="openEditModal('${sec.section_id}', '${selectedPage}')" style="background:none; border:1px solid var(--border-color); color:#fff; padding:0.4rem 0.8rem; border-radius:6px; cursor:pointer;">Edit</button>
                        <button type="button" onclick="deleteSection('${sec.section_id}')" style="background:rgba(255,0,0,0.1); border:1px solid rgba(255,0,0,0.3); color:#ff6b6b; padding:0.4rem 0.8rem; border-radius:6px; cursor:pointer;">Delete</button>
                    </div>
                `;
                sectionsContainer.appendChild(card);
            }
        } catch (err) {
            sectionsContainer.textContent = "Error loading sections.";
        }
    }

    pageSelector.addEventListener("change", loadPageData);

    sectionForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const isSkills = document.getElementById("sec-is-skills").value === "true";
        
        const data = {
            page_name: pageSelector.value,
            section_id: document.getElementById("sec-id").value.trim(),
            title: document.getElementById("sec-title").value.trim(),
            order: parseInt(document.getElementById("sec-order").value) || 1,
            is_skills: isSkills,
            mapped_page: document.getElementById("sec-mapped-page").value
        };

        const res = await fetch("/api/admin/sections", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data)
        });

        if (res.ok) {
            if (isSkills) {
                const skillsRaw = document.getElementById("sec-skills-list").value;
                const skillsArray = skillsRaw.split(",").map(s => s.trim()).filter(Boolean);
                
                for (const skillName of skillsArray) {
                    await fetch("/api/admin/skills", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ name: skillName })
                    });
                }
            }

            alert("Section created successfully!");
            sectionForm.reset();
            sectionSkillsInputWrapper.style.display = "none";
            secMappedPageSelect.disabled = false;
            loadPageData();
        } else {
            alert("Failed to save section.");
        }
    });

    itemForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const formData = new FormData();
        
        formData.append("section_id", sectionSelect.value);
        formData.append("title", document.getElementById("item-title").value);
        formData.append("subtitle", document.getElementById("item-subtitle").value);
        formData.append("meta_tags", document.getElementById("item-meta").value);
        formData.append("skills", document.getElementById("item-skills").value);
        formData.append("description", document.getElementById("item-desc").value);
        formData.append("order", document.getElementById("item-order").value);

        const imageFile = document.getElementById("item-image").files[0];
        if (imageFile) {
            formData.append("image", imageFile);
        }

        const res = await fetch("/api/admin/items", {
            method: "POST",
            body: formData
        });

        if (res.ok) {
            alert("Portfolio item saved successfully!");
            itemForm.reset();
        } else {
            alert("Failed to save item.");
        }
    });

    // Open Edit Modal Logic
    window.openEditModal = async (sectionId, pageName) => {
        try {
            const pageSecRes = await fetch(`/api/pages/${pageName}/sections`);
            const pageSections = await pageSecRes.json();
            const sec = pageSections.find(s => s.section_id === sectionId);
            if (!sec) return alert("Section not found.");

            document.getElementById("edit-section-id").value = sec.section_id;
            document.getElementById("edit-page-name").value = pageName;
            document.getElementById("edit-sec-title").value = sec.title;
            document.getElementById("edit-sec-order").value = sec.order;
            document.getElementById("remove-image-flag").value = "false";
            document.getElementById("edit-item-image").value = "";

            if (pageName === "home") {
                editHomeOptions.style.display = "flex";
                document.getElementById("edit-sec-is-skills").value = sec.is_skills ? "true" : "false";
                document.getElementById("edit-sec-mapped-page").value = sec.mapped_page || "";

                if (sec.is_skills) {
                    editSkillsWrapper.style.display = "flex";
                    editItemFieldsWrapper.style.display = "none";
                    loadModalSkills();
                } else {
                    editSkillsWrapper.style.display = "none";
                    editItemFieldsWrapper.style.display = "none";
                }
            } else {
                editHomeOptions.style.display = "none";
                editSkillsWrapper.style.display = "none";
                editItemFieldsWrapper.style.display = "flex";

                const itemsRes = await fetch(`/api/items/${sectionId}`);
                const items = await itemsRes.json();

                if (items.length > 0) {
                    const item = items[0];
                    document.getElementById("edit-item-id").value = item._id;
                    document.getElementById("edit-item-title").value = item.title || "";
                    document.getElementById("edit-item-subtitle").value = item.subtitle || "";
                    document.getElementById("edit-item-meta").value = (item.meta_tags || []).join(", ");
                    document.getElementById("edit-item-skills").value = (item.skills || []).join(", ");
                    document.getElementById("edit-item-desc").value = item.description || "";
                } else {
                    document.getElementById("edit-item-id").value = "";
                    document.getElementById("edit-item-title").value = "";
                    document.getElementById("edit-item-subtitle").value = "";
                    document.getElementById("edit-item-meta").value = "";
                    document.getElementById("edit-item-skills").value = "";
                    document.getElementById("edit-item-desc").value = "";
                }
            }

            editModal.classList.add("active");
        } catch (err) {
            console.error("Error opening edit modal:", err);
        }
    };

    async function loadModalSkills() {
        const container = document.getElementById("skills-list-container");
        container.innerHTML = "Loading skills...";
        const res = await fetch("/api/skills");
        const skills = await res.json();
        
        container.innerHTML = "";
        skills.forEach(skill => {
            const row = document.createElement("div");
            row.style.cssText = "display: flex; justify-content: space-between; align-items: center; background: rgba(255,255,255,0.02); padding: 0.5rem; border-radius: 6px; border: 1px solid var(--border-color);";
            row.innerHTML = `
                <span style="color: #fff; font-size: 0.9rem;">${skill.name}</span>
                <button type="button" onclick="removeModalSkill('${skill._id}')" style="background: rgba(255,0,0,0.1); color: #ff6b6b; border: none; padding: 0.2rem 0.5rem; border-radius: 4px; cursor: pointer; font-size: 0.8rem;">Delete</button>
            `;
            container.appendChild(row);
        });
    }

    window.removeModalSkill = async (skillId) => {
        await fetch(`/api/admin/skills/${skillId}`, { method: "DELETE" });
        loadModalSkills();
    };

    document.getElementById("add-skill-btn").addEventListener("click", async () => {
        const input = document.getElementById("new-skill-input");
        const name = input.value.trim();
        if (!name) return;

        await fetch("/api/admin/skills", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name })
        });
        input.value = "";
        loadModalSkills();
    });

    closeModalBtn.addEventListener("click", () => editModal.classList.remove("active"));
    editModal.addEventListener("click", (e) => {
        if (e.target === editModal) editModal.classList.remove("active");
    });

    editModalForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const pageName = document.getElementById("edit-page-name").value;
        const sectionId = document.getElementById("edit-section-id").value;

        const sectionData = {
            page_name: pageName,
            section_id: sectionId,
            title: document.getElementById("edit-sec-title").value.trim(),
            order: parseInt(document.getElementById("edit-sec-order").value) || 1
        };

        if (pageName === "home") {
            sectionData.is_skills = document.getElementById("edit-sec-is-skills").value === "true";
            sectionData.mapped_page = document.getElementById("edit-sec-mapped-page").value;
        }

        const secRes = await fetch("/api/admin/sections", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(sectionData)
        });

        if (!secRes.ok) {
            alert("Failed to update section.");
            return;
        }

        if (pageName !== "home" && document.getElementById("edit-item-title").value.trim()) {
            const formData = new FormData();
            const itemId = document.getElementById("edit-item-id").value;
            if (itemId) formData.append("item_id", itemId);

            formData.append("section_id", sectionId);
            formData.append("title", document.getElementById("edit-item-title").value);
            formData.append("subtitle", document.getElementById("edit-item-subtitle").value);
            formData.append("meta_tags", document.getElementById("edit-item-meta").value);
            formData.append("skills", document.getElementById("edit-item-skills").value);
            formData.append("description", document.getElementById("edit-item-desc").value);
            formData.append("order", document.getElementById("edit-sec-order").value);

            const imageFile = document.getElementById("edit-item-image").files[0];
            if (imageFile) {
                formData.append("image", imageFile);
            }

            // Ensures remove flag gets sent properly to main.py
            const removeFlagEl = document.getElementById("remove-image-flag");
            if (removeFlagEl && removeFlagEl.value === "true") {
                formData.append("remove_image", "true");
            }

            await fetch("/api/admin/items", { method: "POST", body: formData });
        }

        alert("Changes saved successfully!");
        editModal.classList.remove("active");
        loadPageData();
    });

    window.deleteSection = async (sectionId) => {
        if (!confirm(`Delete section '${sectionId}' and all its content?`)) return;
        const res = await fetch(`/api/admin/sections/${sectionId}`, { method: "DELETE" });
        if (res.ok) loadPageData();
    };
});