document.addEventListener("DOMContentLoaded", async () => {
    const hasMouse = window.matchMedia("(pointer: fine)").matches;
    let cursor = document.querySelector(".custom-cursor");

    if (hasMouse) {
        if (!cursor) {
            cursor = document.createElement("div");
            cursor.classList.add("custom-cursor");
            document.body.appendChild(cursor);
        }

        document.addEventListener("mousemove", (e) => {
            cursor.style.left = `${e.pageX}px`;
            cursor.style.top = `${e.pageY}px`;
        });
    }

    function setupGlobalHoverEffects() {
        if (!hasMouse) return;
        const interactiveElements = document.querySelectorAll(".project-card, .detail-card-row, .skill-pill, .tag");
        interactiveElements.forEach((el) => {
            el.addEventListener("mouseenter", () => {
                document.body.classList.add("hovering");
                if(cursor) cursor.textContent = "View";
            });
            el.addEventListener("mouseleave", () => {
                document.body.classList.remove("hovering");
                if(cursor) cursor.textContent = "";
            });
        });
    }

    setupGlobalHoverEffects();

    const hamburger = document.getElementById("hamburger-toggle");
    const mobileMenu = document.getElementById("mobile-menu");
    const mobLinks = document.querySelectorAll(".mob-link");

    if (hamburger && mobileMenu) {
        hamburger.addEventListener("click", () => {
            hamburger.classList.toggle("active");
            mobileMenu.classList.toggle("active");
        });

        mobLinks.forEach(link => {
            link.addEventListener("click", () => {
                hamburger.classList.remove("active");
                mobileMenu.classList.remove("active");
            });
        });
    }

    let pageName = "home";
    const path = window.location.pathname;
    if (path.includes("experience")) pageName = "experience";
    else if (path.includes("projects")) pageName = "projects";
    else if (path.includes("community")) pageName = "community";
    else if (path.includes("research")) pageName = "research";

    const container = document.getElementById("dynamic-container") || document.querySelector("main");
    
    function renderSingleLineSkills(skillsList) {
        if (!skillsList || skillsList.length === 0) return "";
        let html = `<div style="display: flex; flex-wrap: wrap; gap: 0.75rem; margin-top: 1rem;">`;
        skillsList.forEach(skill => {
            const skillName = typeof skill === "object" ? skill.name : skill;
            html += `<span class="skill-pill">${skillName}</span>`;
        });
        html += `</div>`;
        return html;
    }

    // --- STANDARD HOME PAGE GRID CARD RENDERER ---
    function renderHomeGridItems(items, sec) {
        if (items.length === 0) return `<p style="color: var(--text-muted); margin-top: 1rem;">No items added yet.</p>`;
        let html = `<div class="grid-container">`;
        items.forEach(item => {
            let clickAction = "";
            if (sec.mapped_page) {
                const targetSecId = item.section_id || sec.mapped_page;
                clickAction = `onclick="window.location.href='/${sec.mapped_page}#${targetSecId}'" style="cursor: pointer;"`;
            }
            html += `<div class="project-card" data-id="${item._id}" ${clickAction}>`;
            if (item.meta_tags && item.meta_tags.length > 0) {
                html += `<div class="card-meta">`;
                item.meta_tags.forEach(tag => html += `<span class="tag">${tag}</span>`);
                html += `</div>`;
            }
            html += `<h3>${item.title}</h3>`;
            if (item.subtitle) html += `<h4 style="color: var(--accent-color); font-size: 0.95rem; font-weight: 500; margin-bottom: 0.5rem;">${item.subtitle}</h4>`;
            html += `<p>${item.description}</p>`;
            if (item.image_url) {
                html += `<div style="margin-top: 1rem;"><img src="${item.image_url}" alt="${item.title}" class="card-img-element"></div>`;
            } else {
                html += `<div style="margin-top: 1rem;" class="card-image-placeholder">[ Image Placeholder ]</div>`;
            }
            if (item.skills && item.skills.length > 0) {
                html += `<div style="display: flex; gap: 0.5rem; flex-wrap: wrap; margin-top: 1rem;">`;
                item.skills.forEach(skill => html += `<span style="font-size: 0.8rem; background: rgba(0, 255, 150, 0.08); border: 1px solid rgba(0, 255, 150, 0.2); color: #00ff96; padding: 0.2rem 0.6rem; border-radius: 4px;">${skill}</span>`);
                html += `</div>`;
            }
            html += `</div>`;
        });
        html += `</div>`;
        return html;
    }

    // --- UNIVERSAL DETAIL PAGE RENDERER ---
    function renderUniversalDetailItems(items) {
        if (items.length === 0) return `<p style="color: var(--text-muted); margin-top: 1rem;">No items added yet.</p>`;
        let html = `<div class="grid-container detail-split-layout">`;
        items.forEach(item => {
            html += `<div class="detail-card-row" data-id="${item._id}"><div class="detail-card-content">`;
            
            // 1. Title with red bullet point
            html += `<div class="detail-heading-wrapper"><span class="bullet"></span><h3 class="detail-title">${item.title}</h3></div>`;
            
            // 2. Subtitle / Location in Red
            if (item.subtitle) {
                html += `<h4 style="color: var(--accent-color); font-size: 1.05rem; font-weight: 500; margin-bottom: 0.75rem;">${item.subtitle}</h4>`;
            }
            
            // 3. Description (Always rendered right after subtitle)
            html += `<p>${item.description}</p>`;
            
            // 4. Green Skill Pills at the bottom (handles both meta_tags and skills fields seamlessly)
            const tagsToDisplay = (item.skills && item.skills.length > 0) ? item.skills : item.meta_tags;
            if (tagsToDisplay && tagsToDisplay.length > 0) {
                html += `<div style="display: flex; gap: 0.5rem; flex-wrap: wrap; margin-top: 1rem;">`;
                tagsToDisplay.forEach(tag => {
                    html += `<span style="font-size: 0.8rem; background: rgba(0, 255, 150, 0.08); border: 1px solid rgba(0, 255, 150, 0.2); color: #00ff96; padding: 0.3rem 0.7rem; border-radius: 4px;">${tag}</span>`;
                });
                html += `</div>`;
            }
            
            html += `</div><div class="detail-card-media">`;
            html += item.image_url ? `<img src="${item.image_url}" alt="${item.title}" class="card-img-element">` : `<div class="card-image-placeholder">[ Image Placeholder ]</div>`;
            html += `</div></div>`;
        });
        html += `</div>`;
        return html;
    }

    async function renderDynamicContent() {
        if (!container) return;

        try {
            const res = await fetch(`/api/pages/${pageName}/sections`);
            let sections = await res.json();
            sections.sort((a, b) => (a.order || 0) - (b.order || 0));

            if (sections.length === 0) {
                if (pageName === "home") {
                    renderDefaultHomeSkeleton();
                } else {
                    container.innerHTML = `<div style="padding: 4rem; text-align: center; color: var(--text-muted);"><h2>No sections configured yet for this page.</h2><p>Use the admin panel to add sections and items.</p></div>`;
                }
                return;
            }

            let htmlOutput = "";

            if (pageName === "home") {
                htmlOutput += `
                    <section class="hero">
                        <h1 class="hero-title">AI/ML & n8n<br><span id="typewriter" class="typed-text"></span></h1>
                        <p class="hero-subtitle">BS Artificial Intelligence student at UMT Lahore focused on machine learning, data analytics, and AI-driven automation workflows.</p>
                        <div class="action-buttons">
                            <a href="/api/cv/download" id="download-cv-btn" class="btn-primary">Download CV</a>
                            <a href="/lets-talk" class="btn-secondary">Let's Talk →</a>
                        </div>
                    </section>
                `;
            } else {
                let pageTitle = "Experience";
                let pageSubtitle = "Professional internships, leadership roles, and military recommendations.";

                if (pageName === "projects") {
                    pageTitle = "Featured Projects";
                    pageSubtitle = "Deep learning models, automated data pipelines, and full-stack software prototypes.";
                } else if (pageName === "community") {
                    pageTitle = "Community Work";
                    pageSubtitle = "Leadership, event management, and volunteer contributions.";
                } else if (pageName === "research") {
                    pageTitle = "Research & Publications";
                    pageSubtitle = "Academic studies, technical reports, and scientific papers.";
                }

                htmlOutput += `
                    <div style="margin-bottom: 4rem;">
                        <h1 style="font-size: clamp(2.5rem, 5vw, 4rem); font-weight: 700; letter-spacing: -1.5px; margin-bottom: 0.75rem;">${pageTitle}.</h1>
                        <p style="color: var(--text-muted); font-size: 1.15rem; max-width: 700px;">${pageSubtitle}</p>
                    </div>
                `;
            }

            for (const sec of sections) {
                let items = [];
                if (pageName === "home" && sec.mapped_page) {
                    const mappedSecRes = await fetch(`/api/pages/${sec.mapped_page}/sections`);
                    const mappedSections = await mappedSecRes.json();
                    for (const mSec of mappedSections) {
                        const itemRes = await fetch(`/api/items/${mSec.section_id}`);
                        const mItems = await itemRes.json();
                        items.push(...mItems);
                    }
                } else {
                    const itemsRes = await fetch(`/api/items/${sec.section_id}`);
                    items = await itemsRes.json();
                }
                items.sort((a, b) => (a.order || 0) - (b.order || 0));

                if (pageName === "home") {
                    htmlOutput += `
                        <section id="${sec.section_id}" class="portfolio-section">
                            <div class="section-header"><span class="bullet"></span><h2>${sec.title}</h2></div>
                    `;
                    if (sec.is_skills) {
                        const skillsRes = await fetch("/api/skills");
                        const skills = await skillsRes.json();
                        const skillNames = skills.length > 0 ? skills.map(s => s.name) : ["Python", "FastAPI", "Flutter", "TensorFlow & Keras", "n8n Automation", "Docker", "MongoDB Atlas", "SQL & Databases", "Groq & X.AI APIs", "Git & GitHub"];
                        htmlOutput += renderSingleLineSkills(skillNames);
                        htmlOutput += `</section>`;
                        continue;
                    }
                    htmlOutput += renderHomeGridItems(items, sec);
                } else {
                    htmlOutput += `<section id="${sec.section_id}" class="portfolio-section">`;
                    htmlOutput += renderUniversalDetailItems(items);
                }

                htmlOutput += `</section>`;
            }

            container.innerHTML = htmlOutput;

            if (pageName === "home") {
                initTypewriter();
            }
            setupGlobalHoverEffects();
            setupScrollAnimations();
            initAutoSliders();

            if (window.location.hash) {
                setTimeout(() => {
                    const targetEl = document.querySelector(window.location.hash);
                    if (targetEl) {
                        targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                }, 400);
            }

        } catch (err) {
            console.error("Error loading dynamic portfolio data:", err);
        }
    }

    function renderDefaultHomeSkeleton() {
        container.innerHTML = `
            <section class="hero">
                <h1 class="hero-title">AI/ML & n8n<br><span id="typewriter" class="typed-text"></span></h1>
                <p class="hero-subtitle">BS Artificial Intelligence student at UMT Lahore focused on machine learning, data analytics, and AI-driven automation workflows.</p>
                <div class="action-buttons">
                    <a href="/api/cv/download" id="download-cv-btn" class="btn-primary">Download CV</a>
                    <a href="/lets-talk" class="btn-secondary">Let's Talk →</a>
                </div>
            </section>
            <div style="padding: 3rem; text-align: center; color: var(--text-muted);">
                <p>No dynamic sections created for Home page yet. Head over to <a href="/admin" style="color: var(--accent-color);">/admin</a> to add sections and items!</p>
            </div>
        `;
        initTypewriter();
    }

    function initTypewriter() {
        const words = ["Developer.", "Engineer.", "Automator."];
        let i = 0;
        let timer;
        const element = document.getElementById("typewriter");
        if (!element) return;

        function typing() {
            let word = words[i].split("");
            let loopTyping = function() {
                if (word.length > 0) {
                    element.textContent += word.shift();
                } else {
                    setTimeout(deleting, 2000);
                    return;
                }
                timer = setTimeout(loopTyping, 120);
            };
            loopTyping();
        }

        function deleting() {
            let word = words[i].split("");
            let loopDeleting = function() {
                if (word.length > 0) {
                    word.pop();
                    element.textContent = word.join("");
                } else {
                    i = (i + 1) % words.length;
                    setTimeout(typing, 500);
                    return;
                }
                timer = setTimeout(loopDeleting, 80);
            };
            loopDeleting();
        }

        typing();
    }

    function setupScrollAnimations() {
        const observer = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = "1";
                    entry.target.style.transform = "translateY(0)";
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1 });

        document.querySelectorAll(".portfolio-section, .detail-card-row, .project-card").forEach((section) => {
            section.style.opacity = "0";
            section.style.transform = "translateY(30px)";
            section.style.transition = "opacity 0.8s ease, transform 0.8s ease";
            observer.observe(section);
        });
    }

    function initAutoSliders() {
        const sliders = document.querySelectorAll(".grid-container:not(.detail-split-layout)");
        sliders.forEach(slider => {
            let interval = setInterval(() => {
                const card = slider.querySelector(".project-card");
                if (!card) return;
                const cardWidth = card.offsetWidth + 32;
                if (slider.scrollLeft + slider.clientWidth >= slider.scrollWidth - 10) {
                    slider.scrollTo({ left: 0, behavior: 'smooth' });
                } else {
                    slider.scrollBy({ left: cardWidth, behavior: 'smooth' });
                }
            }, 2000);

            slider.addEventListener("mouseenter", () => clearInterval(interval));
            slider.addEventListener("mouseleave", () => {
                interval = setInterval(() => {
                    const card = slider.querySelector(".project-card");
                    if (!card) return;
                    const cardWidth = card.offsetWidth + 32;
                    if (slider.scrollLeft + slider.clientWidth >= slider.scrollWidth - 10) {
                        slider.scrollTo({ left: 0, behavior: 'smooth' });
                    } else {
                        slider.scrollBy({ left: cardWidth, behavior: 'smooth' });
                    }
                }, 2000);
            });
        });
    }

    await renderDynamicContent();
});