class AIGM_UX_Kit {

    static openPopupWindow(url, width, height) {
        const dualScreenLeft = (window.screenLeft !== undefined) ? window.screenLeft : window.screenX;
        const dualScreenTop = (window.screenTop !== undefined) ? window.screenTop : window.screenY;
        const winWidth = window.innerWidth ? window.innerWidth : document.documentElement.clientWidth ? document.documentElement.clientWidth : screen.width;
        const winHeight = window.innerHeight ? window.innerHeight : document.documentElement.clientHeight ? document.documentElement.clientHeight : screen.height;
        const systemZoom = winWidth / window.screen.availWidth;
        const left = (winWidth - width) / 2 / systemZoom + dualScreenLeft;
        const top = (winHeight - height) / 2 / systemZoom + dualScreenTop;
        return window.open(url, "_window", `scrollbars=yes,width=${width / systemZoom},height=${height / systemZoom},top=${top},left=${left}`);
    }

    static generateRandomNumber(from, to) {
        return Math.floor(Math.random() * (to - from + 1)) + from;
    }

    static createSlickSlider(element, options) {
        options.responsive = [];
        options.breakpoints ??= [];
        
        options.breakpoints.forEach(breakpoint => {
            options.responsive.push({
                breakpoint: (breakpoint.width + 1),
                settings: {
                    slidesToShow: breakpoint.show,
                    slidesToScroll: 1,
                    centerMode: false
                }
            });
        });

        element.querySelectorAll(`[data-animate]`).forEach(x => { x.removeAttribute("data-animate"); });
        jQuery(element).slick(options);
        window.checkVisibleAnimations();
        return element;
    }

    static log(...msg) {
        console.log(`\x1b[36m[AIGM UX Kit]\x1b[0m`, ...msg);
    }

    static stripHTML(text) {
        const element = AIGM_UX_Kit.createElement({ tagName: "div", textContent: `${text}` });
        const html = element.innerHTML;
        element.remove();
        return html.replace(/\"/g, "&#34;").replace(/\'/g, "&#39;").replace(/\`/g, "&#96;").replace(/\`/g, "&#96;");
    }

    static createElement(options) {
        let element = document.createElement(options.tagName);
        if(options.attributes) { options.attributes.forEach(attr => { element.setAttribute(attr.name, attr.value); }); }
        if(options.classes) { options.classes.forEach(cssClass => { element.classList.add(cssClass); }); }
        if(options.innerHTML) { element.innerHTML = options.innerHTML; }
        if(options.textContent) { element.textContent = options.textContent; }
        return element;
    }

}

class TabsAIGM {

    static debug(...message) {
        if(false) {
            console.log("[TabsAIGM]", ...message);
        }
    }

    static setup() {
        document.querySelectorAll("div[data-tab-menu]").forEach(groupMenu => {
            let stringOptions = (groupMenu.getAttribute("data-tab-menu") || "").split(" ");
            
            let options = {};
            options.groupName = stringOptions.shift() || "";
            options.isPrivate = stringOptions.includes("private");
            options.tabMenuControls = groupMenu.querySelectorAll(`[data-tab]:not([href])`);
            options.contentBlocks = document.querySelectorAll(`div[data-tab-group^="${options.groupName}"]`);

            //Add special variables to the actual elements to store their group name and content block name.
            Array.from(options.tabMenuControls).map(i => {
                i.__ctm_isPrivate = options.isPrivate; 
                i.__ctm_groupName = options.groupName; 
                i.__ctm_contentBlockName = i.getAttribute("data-tab"); 
                i.__ctm_callbacks = []; 
            });
            Array.from(options.contentBlocks).map(i => { 
                i.__ctm_groupName = options.groupName; 
                i.__ctm_contentBlockName = (i.getAttribute("data-tab-group") || "").split(" ")[1] || ""; 
            });
            if(!options.tabMenuControls[0]) { return; }
            options.tabMenuControls[0].__ctm_isFirst = true;
            
            if(options.groupName === "") {
                TabsAIGM.debug("There is a tab menu control block without a group name.", groupMenu, options);
                return;
            }

            let hasFoundFirst = false;

            if(!options.isPrivate && location.hash !== "") {
                let hash = location.hash.substring(1);
                TabsAIGM.debug("Hash detected in URL:", hash);
                TabsAIGM.debug("Searching for \"" + hash + "\" in this group \"" + options.groupName + "\"...");

                options.tabMenuControls.forEach(control => {
                    if(control.__ctm_contentBlockName === hash) {
                        TabsAIGM.debug("selecting tab:", control.__ctm_groupName, control.__ctm_contentBlockName);
                        setTimeout(() => {
                            TabsAIGM.activateTab(control.__ctm_groupName, control.__ctm_contentBlockName);
                            if(control.hasAttribute("data-hash-scroll")) {
                                window.scrollToElement(groupMenu, window.aigm_template.scroll_offset + 32);
                            }
                        }, 10);
                        hasFoundFirst = true;
                    }
                });
            }

            TabsAIGM.debug("Has found first:", hasFoundFirst);
            if(!hasFoundFirst) {
                //TabsAIGM.activateTab(options.tabMenuControls[0].__ctm_groupName, options.tabMenuControls[0].__ctm_contentBlockName);
            }

            options.tabMenuControls.forEach(control => {
                control.addEventListener("click", () => {
                    TabsAIGM.activateTab(control.__ctm_groupName, control.__ctm_contentBlockName);
                });
            });

            TabsAIGM.debug("Created new group with the following options:", options);

            if(groupMenu.classList.contains("scroller")) {
                const arrowLeft = groupMenu.querySelector(`[data-arrow="left"]`);
                const arrowRight = groupMenu.querySelector(`[data-arrow="right"]`);
                const inner = groupMenu.querySelector(`.tabs`);

                const checkArrows = () => {
                    const scrollWidth = inner.scrollWidth;
                    const clientWidth = inner.clientWidth;
                    const scrollLeft = inner.scrollLeft;

                    if(scrollWidth > clientWidth) {
                        arrowLeft.classList.remove("hidden");
                        arrowRight.classList.remove("hidden");
                    } else {
                        arrowLeft.classList.add("hidden");
                        arrowRight.classList.add("hidden");
                    }
                };

                checkArrows();
                setInterval(checkArrows, 1000);
                window.addEventListener("resize", checkArrows);

                arrowLeft.addEventListener("click", () => { inner.scroll({ left: inner.scrollLeft - 250, top: 0, behavior: "smooth" }); checkArrows(); });
                arrowRight.addEventListener("click", () => { inner.scroll({ left: inner.scrollLeft + 250, top: 0, behavior: "smooth" }); checkArrows(); });
            }
        });
    }

    static activateTab(groupName, blockName) {
        let hasSelectedValidTab = false;
        let groupTabControls = Array.from(document.querySelectorAll(`div[data-tab-menu^="${groupName}"] [data-tab]`));
        let groupContentBlocks = document.querySelectorAll(`div[data-tab-group^="${groupName}"]`);

        groupTabControls.forEach(control => {
            control.classList.remove("active");
            if(control.__ctm_groupName === groupName && control.__ctm_contentBlockName === blockName) {
                hasSelectedValidTab = true;
                control.classList.add("active");

                if(control.closest(`[data-tab-menu]`).classList.contains("scroller")) {
                    control.scrollIntoView({ behavior: 'instant', block: 'nearest', inline: 'nearest' });
                }
                
                //All the callbacks when this tab is selected.
                control.__ctm_callbacks.forEach(callback => { callback(); });

                if(!control.__ctm_isPrivate) {
                    history.replaceState(undefined, undefined, location.href.replace(/#.*$/, "") + "#" + control.__ctm_contentBlockName);
                }

                if(!control.__ctm_isPrivate && control.__ctm_isFirst) {
                    history.replaceState(undefined, undefined, location.href.split("#", 2)[0]);
                }
            }
        });

        groupContentBlocks.forEach(block => {
            block.classList.remove("shown");
            if(block.__ctm_groupName === groupName && block.__ctm_contentBlockName === blockName) {
                block.classList.add("shown");
            }
        });

        //Select the first tab on page load if no tab is defined in window hash.
        if(!hasSelectedValidTab && groupTabControls.length > 0) {
            TabsAIGM.activateTab(groupName, groupTabControls[0].__ctm_contentBlockName);
        }

        if(window.checkVisibleAnimations) { window.checkVisibleAnimations(); }
        if(window.firstScrollCallbacks) { window.firstScrollCallbacks.check(); }
        if(window.checkForAJAXScrolls) { window.checkForAJAXScrolls(); }

        //For sliders to update (Slick Slider).
        window.dispatchEvent(new Event("resize"));
        document.querySelectorAll(`[data-slider].slick-initialized`).forEach(slider => {
            if(slider.slick && slider.slick.refresh) {
                slider.slick.refresh();
            }
        });
    }

    static onTabSelect(group, name, callback) {
        const control = document.querySelector(`div[data-tab-menu^="${group}"] [data-tab="${name}"]`);
        const _func = () => { callback({ element: control, group: group, name: name }); };
        control.__ctm_callbacks.push(_func);
        TabsAIGM.debug("(tab select event) selected " + group + " > " + name);
        if(window.checkVisibleAnimations) { window.checkVisibleAnimations(); }
    }

    static isTabActive(groupName, blockName) {
        const tab = document.querySelector(`div[data-tab-menu^="${groupName}"] [data-tab="${blockName}"]`);
        return tab && tab.classList.contains("active");
    }

}

const htmlLoadedEvent = () => {
    //Scroll to top button.
    const scrollTop = document.querySelector(`.aigm-ux .to-top`);
    if(scrollTop) {
        function checkScrollPosition() {
            if(window.scrollY > (window.innerHeight ? window.innerHeight : 1080)) {
                if(!scrollTop.classList.contains("shown")) {
                    scrollTop.classList.add("shown");
                }
            } else {
                if(scrollTop.classList.contains("shown")) {
                    scrollTop.classList.remove("shown");
                }
            }
        }

        checkScrollPosition();
        ["resize", "scroll"].forEach(e => window.addEventListener(e, checkScrollPosition));

        scrollTop.addEventListener("click", () => {
            window.scroll({ top: 0, left: 0, behavior: "smooth" });
        });
    }

    //FAQ boxes.
    const faqs = document.querySelectorAll(`.faq-boxes > div`);
    faqs.forEach(faq => {
        faq.querySelector(`.top`).addEventListener("click", () => {
            faq.classList.toggle("shown");
            if(window.checkVisibleAnimations) { window.checkVisibleAnimations(); }
        });
    });

    //Auto focus inputs.
    document.querySelectorAll(`:is(input, textarea)[data-auto-focus]`).forEach(input => {
        input.selectionStart = input.selectionEnd = input.value.length;
        input.focus();
    });

    //Remove all html attributes for given elements.
    document.querySelectorAll(`[data-safe-html]`).forEach(element => {
        const div = document.createElement("div");
        div.innerHTML = element.textContent;
        div.querySelectorAll(`*`).forEach(x => {
            for(let i = 0; i < x.attributes.length; i++) {
                if(element.hasAttribute("data-hyperlinks-allowed") && x.tagName.toLowerCase() === "a" && x.attributes[i].name === "href") {
                    continue;
                }
                x.removeAttribute(x.attributes[i].name);
            }
            if(x.tagName.toLowerCase() === "a") {
                x.classList.add("mainlink");
                x.setAttribute("target", "_blank");
                x.rel += "noopener";
            }
        });
        element.innerHTML = div.innerHTML;
        element.classList.add("safe");
    });

    //Fallback support for WebP images.
    (() => {
        var img = new Image();
        img.onerror = function() {
            AIGM_UX_Kit.log(`Enabling fallback WebP support for images.`);
            document.querySelectorAll(`img[data-src-original]`).forEach(element => {
                element.src = element.getAttribute("data-src-original");
            });
        };
        img.src = "data:image/webp;base64,UklGRh4AAABXRUJQVlA4TBEAAAAvAAAAAAfQ//73v/+BiOh/AAA=";
    })();
};

if(document.readyState !== 'loading') {
    htmlLoadedEvent();
} else {
    document.addEventListener('DOMContentLoaded', htmlLoadedEvent);
}

window.addEventListener("load", () => {
    AIGM_UX_Kit.log(`Running AIGM UX Kit (${window.aigm_ux_kit_version}) on ${window.aigm_ux_kit_site_name}.`);
    AIGM_UX_Kit.log(`Project: https://github.com/AIGlobalMedia/AIGM-UX-Kit`);

    //Tab menus.
    TabsAIGM.setup();

    //Page load indicator (finish).
    const topPageLoader = document.querySelector("div[data-page-load-indicator]");
    if(topPageLoader) {
        topPageLoader.classList.add("loaded");
        setTimeout(() => { topPageLoader.remove(); }, 2000);
    }

    if("tippy" in window) {
        window.refreshTooltips = () => {
            document.querySelectorAll(`[title]`).forEach(element => {
                if(element._tippy) { return; }

                let text = element.getAttribute("title").trim();
                if(text.length < 1) { return; }
                element._title_original = text;
                if(text.length > 80) { text = text.substring(0, 80 - 3).trim() + "..."; }

                const t = tippy(element, {
                    accessibility: true,
                    content: text,
                    duration: 0,
                    followCursor: false,
                    arrow: (window.aigm_template.use_tooltip_arrows || false),
                    offset: (window.aigm_template.use_tooltip_arrows ? [0, 16] : [0, 0]),
                    boundary: "window",
                    onShow: (instance) => { tippy.hideAll({ duration: 0, exclude: instance }); },
                    placement: (element.getAttribute("data-tooltip-placement") || "top"),
                    sticky: true
                });
                element.setAttribute("data-old-title", element.getAttribute("title"));
                element.removeAttribute("title");

                if(element.hasAttribute("data-tooltip-closer")) {
                    element.addEventListener("click", () => {
                        t.hide();
                    });
                }
            });
        }
        window.refreshTooltips();
    }

    //Search bars that lead to search page (/?s={term}).
    if(true) {
        const searchbars = document.querySelectorAll(`input[data-search-bar]`);
        searchbars.forEach(searchbar => {
            const search = () => {
                const term = searchbar.value.trim();
                if(term.length < 1) { return; }
                window.location.href = `/?s=${encodeURIComponent(term)}`;
            };

            searchbar.addEventListener("keyup", event => {
                if(event.keyCode == 13) { search(); }
            });

            const parent = searchbar.parentElement;
            if(parent.hasAttribute("data-click-focus")) {
                parent.addEventListener("click", () => {
                    searchbar.focus();
                });
            }

            const button = parent.querySelector("button");
            if(button) {
                button.addEventListener("click", search);
            }
        });
    }

    //Fire scroll animations each time slick sliders update.
    document.querySelectorAll(`[data-slider]`).forEach(slider => {
        if(slider.slick) {
            slider.setAttribute("data-animate-off", "");
            const x = () => {
                if(window.checkVisibleAnimations) { window.checkVisibleAnimations(); }
            };
            slider.slick.$slider.on("setPosition", x);
            slider.slick.$slider.on("swipe", x);
            slider.slick.$slider.on("edge", x);
            slider.slick.$slider.on("beforeChange", x);
            slider.slick.$slider.on("afterChange", x);
            slider.slick.$slider.on("init", x);
            slider.slick.$slider.on("reInit", x);
            
            slider.querySelectorAll(`[aria-hidden]`).forEach(elm => { elm.removeAttribute("aria-hidden"); });
            slider.querySelectorAll(`img[loading]`).forEach(elm => { elm.removeAttribute("loading"); });
            slider.querySelectorAll(`[data-animate]`).forEach(elm => { elm.removeAttribute("data-animate"); });
        }
    });

    //Lazy load videos (custom approach).
    const lazyLoadVids = () => {
        const lazyLoadSpeed = 200;

        function buildVideoElement(parent, force = false) {
            if(!parent.parentNode || parent.parentNode === document.documentElement) { return; }
            if(!force && !window.isElementVisible(parent.parentNode)) { return; }
            parent.outerHTML = `<video ${(parent.getAttribute("data-attributes") || "")} src="${parent.getAttribute("data-lazy-video")}" loading="lazy" class="${parent.getAttribute("data-classes") || ""}"></video>`;
        }

        function lazyLoadVideos() {
            let currentVideoNumber = 0;
            document.querySelectorAll(`[data-lazy-video]`).forEach(lazy => {
                currentVideoNumber++;
                setTimeout(() => {
                    buildVideoElement(lazy);
                }, (currentVideoNumber * lazyLoadSpeed) - lazyLoadSpeed);
            });
        }

        window.addEventListener('scroll', lazyLoadVideos);
        setInterval(lazyLoadVideos, 1000);
        lazyLoadVideos();

        document.querySelectorAll(`[data-lazy-video][data-quick-load]`).forEach(lazy => {
            buildVideoElement(lazy, true);
        });
    };
    if(window.requestIdleCallback) {
        window.requestIdleCallback(lazyLoadVids);
    } else {
        lazyLoadVids();
    }

    //Blog post content styling
    if(
        (window.top !== window) &&  
        (window.top.location.href && window.top.location.href.includes("/wp-admin/"))
    ) { 
        //Not allowed to format/change post contents (e.g. for when you're editing in Elementor).
    } else {
        //Make all hyperlinks use the "mainlink" css class.
        document.querySelectorAll(`[data-post-content] a`).forEach(a => {
            const hasImages = Array.from(a.querySelectorAll("*")).filter(v => { return v.nodeName.toLowerCase() === "img"; }).length > 0;
            if(!hasImages) { a.classList.add("mainlink"); }

            if(!a.closest("[data-post-content]").hasAttribute("data-post-content-static")) {
                a.setAttribute("target", "_blank");
                a.rel += "noopener";
            }
        });

        //Remove the last element's margin bottom to fix bottom gap.
        window.checkPostContents = () => {
            document.querySelectorAll(`[data-post-content]`).forEach(content => {
                if(content.__aigmHasRanCheck) { return; }
                content.__aigmHasRanCheck = true;
    
                const allElements = Array.from(content.querySelectorAll(`*`)).reverse();
                let hasRemoved = false;
                allElements.forEach(element => {
                    if(["p"].includes(element.tagName.toLowerCase()) && element.clientHeight <= 0) {
                        //element.remove();
                        //return;
                    }
    
                    if(hasRemoved) { return; }
                    const mb = getComputedStyle(element).marginBottom;
                    if(mb === "0" || mb === "0px" || mb === "0rem" || mb === "0em") { } else {
                        hasRemoved = true;
                        element.style.setProperty("margin-bottom", "0", "important");
                    }
                });
            });
        };
        window.checkPostContents();
    }

    //Load JS files which depend on this AIGM UX Kit.
    window.dispatchEvent(new Event("aigm_ux_kit_loaded"));
});

//Scroll to section.
window.scrollToSection = (id, offset = 0) => {
    const section = document.querySelector("section." + id);
    window.scrollToElement(section, offset);
};

//Scroll to element.
window.scrollToElement = (element, offset = 0) => {
    const elementY = element.getBoundingClientRect().top - document.body.getBoundingClientRect().top;
    window.scroll({ top: (elementY - offset), behavior: "smooth" });
};

window.aigm_template = window.aigm_template || {};
window.aigm_template.scroll_offset ??= 0;

//Page load indicator (start).
if(true) {
    const topPageLoader = document.querySelector("div[data-page-load-indicator]");
    if(topPageLoader) { topPageLoader.classList.add("loading"); }
}

//Get position of element from top of page.
window.getElementPositionFromTop = (element) => {
    const boundingBox = element.getBoundingClientRect();
    return boundingBox.top + window.scrollY;
};

if(window === window.top) {
    if('virtualKeyboard' in navigator) {
        navigator.virtualKeyboard.overlaysContent = true;
    }
}

window.appendHTML = (element, html) => {
    element.insertAdjacentHTML("beforeend", html);
};

window.createIframeOverlay = (title, url) => {
    const getBox = () => { return document.querySelector(`.aigm-iframe-overlay-box`); }
    
    let html = `
        <svg class="loading" width="64px" height="64px" viewBox="0 0 66 66" xmlns="http://www.w3.org/2000/svg"><g><animateTransform attributeName="transform" type="rotate" values="0 33 33;270 33 33" begin="0s" dur="1.4s" fill="freeze" repeatCount="indefinite"></animateTransform><circle fill="none" stroke-width="6" stroke-linecap="round" stroke="#2CACE3" cx="33" cy="33" r="30" stroke-dasharray="187" stroke-dashoffset="610"><animateTransform attributeName="transform" type="rotate" values="0 33 33;135 33 33;450 33 33" begin="0s" dur="1.4s" fill="freeze" repeatCount="indefinite"></animateTransform><animate attributeName="stroke-dashoffset" values="187;46.75;187" begin="0s" dur="1.4s" fill="freeze" repeatCount="indefinite"></animate></circle></g></svg>
        <iframe src="${url}" class="hidden" aria-label="${title}">
            <p>Your browser does not support iframes. Please visit "${url}".</p>
        </iframe>
    `;

    const isHTML = url.startsWith("<");
    if(isHTML) { html = `<div class="custom-html">${url}</div>`; }
    
    window.closeIframeOverlay();
    document.querySelector(`html`).classList.add("overflow--hidden");

    document.querySelector(`body`).insertAdjacentHTML("beforeend", `
        <div class="aigm-iframe-overlay-box ${isHTML ? "is-custom-html" : "is-iframe"}">
            <div class="overlay"></div>
            <div class="middle-box">
                <div class="title-bar">
                    <p>${title}</p>
                    <div class="close-button-global" title="Close" data-tooltip-closer data-tooltip-placement="left">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="10.97 12.02 23.93 24.65"><line x1="1" y1="-1" x2="32.0105" y2="-1" transform="matrix(0.707107 -0.707107 0.691431 0.722442 11.9514 36.3812)" stroke="#fff" stroke-width="2" stroke-linecap="round"></line><line x1="1" y1="-1" x2="32.013" y2="-1" transform="matrix(-0.683922 -0.729872 0.714373 -0.699434 35.0542 35.7059)" stroke="#fff" stroke-width="2" stroke-linecap="round"></line></svg>
                    </div>
                </div>
                <div class="scrolling-content">
                    ${html}
                </div>
            </div>
        </div>
    `);

    const showIframe = setTimeout(() => {
        if(getBox()) {
            if(getBox().querySelector(`.scrolling-content svg.loading`)) { getBox().querySelector(`.scrolling-content svg.loading`).remove(); }
            if(getBox().querySelector(`.scrolling-content iframe`)) { getBox().querySelector(`.scrolling-content iframe`).classList.remove("hidden"); }
        }
    }, isHTML ? 0 : 1000);

    getBox().querySelector(`.close-button-global`).addEventListener("click", () => {
        getBox().remove();
        document.querySelector(`html`).classList.remove("overflow--hidden");
        clearTimeout(showIframe);
    });
    if(window.refreshTooltips) { window.refreshTooltips(); }
};

window.closeIframeOverlay = () => {
    const getBox = () => { return document.querySelector(`.aigm-iframe-overlay-box`); }
    if(getBox()) {
        getBox().querySelector(`.close-button-global`).click();
    }
};