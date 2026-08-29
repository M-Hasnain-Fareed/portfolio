document.addEventListener("DOMContentLoaded", () => {
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
        const interactiveElements = document.querySelectorAll(".project-card, .detail-card-row, .skill-pill, .tag, a, button");
        interactiveElements.forEach((el) => {
            el.addEventListener("mouseenter", () => {
                document.body.classList.add("hovering");
            });
            el.addEventListener("mouseleave", () => {
                document.body.classList.remove("hovering");
            });
        });
    }
    
    setupGlobalHoverEffects();

    // --- GLASS TILT & GREEN SPOTLIGHT EFFECT HANDLER ---
    function setupGlassTiltEffects() {
        if (!hasMouse) return;
        const cards = document.querySelectorAll(".project-card, .glass-tile");
        
        cards.forEach(card => {
            card.classList.add("glass-tile");

            card.addEventListener("mousemove", (e) => {
                window.requestAnimationFrame(() => {
                    const rect = card.getBoundingClientRect();
                    const x = e.clientX - rect.left;
                    const y = e.clientY - rect.top;

                    card.style.setProperty('--mouse-x', `${x}px`);
                    card.style.setProperty('--mouse-y', `${y}px`);

                    const centerX = rect.width / 2;
                    const centerY = rect.height / 2;
                    const rotateX = -((y - centerY) / centerY) * 6;
                    const rotateY = ((x - centerX) / centerX) * 6;

                    card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
                });
            });

            card.addEventListener("mouseleave", () => {
                card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
            });
        });
    }

    setupGlassTiltEffects();

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
    else if (path.includes("lets-talk")) pageName = "lets-talk";

    const container = document.getElementById("dynamic-container") || document.querySelector("main");

    if (pageName === "lets-talk") {
        setupGlobalHoverEffects();
        setupGlassTiltEffects();
        return;
    }
    
    function renderDualMarqueeSkills(skillsList) {
        if (!skillsList || skillsList.length === 0) return "";
        
        const mid = Math.ceil(skillsList.length / 2);
        const upperSkills = skillsList.slice(0, mid);
        const lowerSkills = skillsList.slice(mid);

        const generatePillsHtml = (arr) => {
            let pillsStr = "";
            arr.forEach(skill => {
                const skillName = typeof skill === "object" ? skill.name : skill;
                pillsStr += `<span class="skill-pill">${skillName}</span>`;
            });
            return pillsStr + pillsStr;
        };

        return `
            <div class="skills-marquee-wrapper">
                <div class="marquee-track marquee-ltr">
                    ${generatePillsHtml(upperSkills)}
                </div>
                <div class="marquee-track marquee-rtl">
                    ${generatePillsHtml(lowerSkills)}
                </div>
            </div>
        `;
    }

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

    function renderUniversalDetailItems(items) {
        if (items.length === 0) return `<p style="color: var(--text-muted); margin-top: 1rem;">No items added yet.</p>`;
        let html = `<div class="grid-container detail-split-layout">`;
        items.forEach(item => {
            html += `<div class="detail-card-row" data-id="${item._id}"><div class="detail-card-content">`;
            html += `<div class="detail-heading-wrapper"><span class="bullet"></span><h3 class="detail-title">${item.title}</h3></div>`;
            
            if (item.subtitle) {
                html += `<h4 style="color: var(--accent-color); font-size: 1.05rem; font-weight: 500; margin-bottom: 0.75rem;">${item.subtitle}</h4>`;
            }
            
            html += `<p>${item.description}</p>`;
            
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

    // --- STAGGERED SEQUENTIAL LIVE STREAMING ARCHITECTURE ---
    async function loadPageProgressively() {
        if (!container) return;

        // Since the hero is now hardcoded in HTML, just initialize the typewriter effect
        if (pageName === "home") {
            
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

            const dynamicContainerHeader = document.getElementById("dynamic-portfolio-sections");
            if(dynamicContainerHeader) {
                const headerDiv = document.createElement("div");
                headerDiv.style.marginBottom = "4rem";
                headerDiv.innerHTML = `
                    <h1 style="font-size: clamp(2.5rem, 5vw, 4rem); font-weight: 700; letter-spacing: -1.5px; margin-bottom: 0.75rem;">${pageTitle}.</h1>
                    <p style="color: var(--text-muted); font-size: 1.15rem; max-width: 700px;">${pageSubtitle}</p>
                `;
                container.insertBefore(headerDiv, dynamicContainerHeader);
            }
        }

        const dynamicContainer = document.getElementById("dynamic-portfolio-sections");
        if (!dynamicContainer) return;

        try {
            const res = await fetch(`/api/pages/${pageName}/sections`);
            let sections = await res.json();
            sections.sort((a, b) => (a.order || 0) - (b.order || 0));

            if (sections.length === 0 && pageName !== "home") {
                dynamicContainer.innerHTML = `<div style="padding: 4rem; text-align: center; color: var(--text-muted);"><h2>No sections configured yet for this page.</h2></div>`;
                return;
            }

            // Create placeholder slots instantly in correct sorted order
            sections.forEach(sec => {
                const placeholder = document.createElement("div");
                placeholder.id = `section-slot-${sec.section_id}`;
                placeholder.style.opacity = "0";
                placeholder.style.transform = "translateY(20px)";
                placeholder.style.transition = "opacity 0.6s ease, transform 0.6s ease";
                dynamicContainer.appendChild(placeholder);
            });

            // Sequential loop with a micro-delay to bypass Render proxy batching and stream sections smoothly one by one
            for (const sec of sections) {
                const slot = document.getElementById(`section-slot-${sec.section_id}`);
                if (!slot) continue;

                try {
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

                    let sectionHtml = "";
                    if (pageName === "home") {
                        sectionHtml = `<section id="${sec.section_id}" class="portfolio-section"><div class="section-header"><span class="bullet"></span><h2>${sec.title}</h2></div>`;
                        if (sec.is_skills) {
                            const skillsRes = await fetch("/api/skills");
                            const skills = await skillsRes.json();
                            const skillNames = skills.length > 0 ? skills.map(s => s.name) : ["Python", "FastAPI", "Flutter", "Docker", "MongoDB Atlas"];
                            sectionHtml += renderDualMarqueeSkills(skillNames);
                            sectionHtml += `</section>`;
                        } else {
                            sectionHtml += renderHomeGridItems(items, sec);
                            sectionHtml += `</section>`;
                        }
                    } else {
                        sectionHtml = `<section id="${sec.section_id}" class="portfolio-section">`;
                        sectionHtml += renderUniversalDetailItems(items);
                        sectionHtml += `</section>`;
                    }

                    // Render and fade in this specific section immediately
                    slot.innerHTML = sectionHtml;
                    slot.style.opacity = "1";
                    slot.style.transform = "translateY(0)";

                    if (pageName === "home") setupGlassTiltEffects();
                    setupGlobalHoverEffects();
                    initAutoSliders();

                    // Tiny pause prevents Render's proxy from clumping responses, creating a smooth cascade
                    await new Promise(resolve => setTimeout(resolve, 150));

                } catch (secErr) {
                    console.error(`Failed to load section ${sec.section_id}:`, secErr);
                }
            }

            if (window.location.hash) {
                setTimeout(() => {
                    const targetEl = document.querySelector(window.location.hash);
                    if (targetEl) targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }, 400);
            }

        } catch (err) {
            console.error("Error loading dynamic portfolio data:", err);
        }
    }



    // --- AUTO SLIDERS BOUND TO SCROLL VIEW (INTERSECTION OBSERVER) ---
    function initAutoSliders() {
        const sliders = document.querySelectorAll(".grid-container:not(.detail-split-layout)");
        
        const sliderObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                const slider = entry.target;
                if (entry.isIntersecting) {
                    startSlider(slider);
                } else {
                    stopSlider(slider);
                }
            });
        }, { threshold: 0.2 });

        sliders.forEach(slider => {
            sliderObserver.observe(slider);

            slider.addEventListener("mouseenter", () => stopSlider(slider));
            slider.addEventListener("mouseleave", () => {
                const rect = slider.getBoundingClientRect();
                const isVisible = (rect.top < window.innerHeight && rect.bottom >= 0);
                if (isVisible) startSlider(slider);
            });
        });

        function startSlider(slider) {
            if (slider.dataset.intervalId) return;
            
            const id = setInterval(() => {
                const card = slider.querySelector(".project-card");
                if (!card) return;
                const cardWidth = card.offsetWidth + 32; 
                
                if (slider.scrollLeft + slider.clientWidth >= slider.scrollWidth - 10) {
                    slider.scrollTo({ left: 0, behavior: 'smooth' });
                } else {
                    slider.scrollBy({ left: cardWidth, behavior: 'smooth' });
                }
            }, 2500); 
            
            slider.dataset.intervalId = id;
        }

        function stopSlider(slider) {
            if (slider.dataset.intervalId) {
                clearInterval(slider.dataset.intervalId);
                slider.dataset.intervalId = "";
            }
        }
    }

    // FIRE EVERYTHING!
    loadPageProgressively();
});