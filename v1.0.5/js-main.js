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
        options.responsive = window.aigm_template.mobile_slick_breakpoint;

        element.querySelectorAll(`[data-animate]`).forEach(x => { x.removeAttribute("data-animate"); });
        jQuery(element).slick(options);
        window.checkVisibleAnimations();
        return element;
    }

    static log(...msg) {
        console.log(`\x1b[36m[AIGM UX Kit]\x1b[0m`, ...msg);
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

//Exclude certain pages e.g. "Advertise With Us"...
if(location.pathname.toLowerCase() !== "/advertise-with-us/") {

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
                        boundary: "window",
                        onShow: (instance) => { tippy.hideAll({ duration: 0, exclude: instance }); },
                        placement: (element.getAttribute("data-tooltip-placement") || "top")
                    });
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
        if(window.parent === window) {
            //Make all hyperlinks use the "mainlink" css class.
            document.querySelectorAll(`[data-post-content] a`).forEach(a => {
                const hasImages = Array.from(a.querySelectorAll("*")).filter(v => { return v.nodeName.toLowerCase() === "img"; }).length > 0;
                if(!hasImages) { a.classList.add("mainlink"); }
                a.setAttribute("target", "_blank");
                a.rel += "noopener";
            });

            //Remove the last element's margin bottom to fix bottom gap.
            document.querySelectorAll(`[data-post-content]`).forEach(content => {
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

    window.aigm_template = {};
    window.aigm_template.mobile_screen_width = 960;
    window.aigm_template.mobile_slick_breakpoint = [
        {
            breakpoint: window.aigm_template.mobile_screen_width,
            settings: {
                slidesToShow: 1,
                slidesToScroll: 1
            }
        }
    ];
    window.aigm_template.scroll_offset = 0;

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

}

if('virtualKeyboard' in navigator) {
    navigator.virtualKeyboard.overlaysContent = true;
}