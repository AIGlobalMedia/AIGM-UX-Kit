document.addEventListener("DOMContentLoaded", () => {
    const mobileItems = document.querySelector(`.aigm-ux nav .items`);
    const mobileBurger = document.querySelector(`.aigm-ux nav .burger`);
    mobileBurger.addEventListener("click", () => { mobileItems.classList.toggle("mobile-shown"); });
    const mobileCloseX = document.querySelector(`.aigm-ux nav .close-x`);
    mobileCloseX.addEventListener("click", () => { mobileItems.classList.toggle("mobile-shown"); });

    const scrollTop = document.querySelector(`.aigm-ux .to-top`);
    if(scrollTop) {
        setInterval(() => {
            if(window.scrollY > (window.innerHeight ? window.innerHeight : 1080)) {
                scrollTop.classList.add("shown");
            } else {
                scrollTop.classList.remove("shown");
            }
        }, 100);
        scrollTop.addEventListener("click", () => {
            window.scroll({ top: 0, left: 0, behavior: "smooth" });
        });
    }

    const headerNav = document.querySelector(`.aigm-ux nav`);
    const getHeaderHeight = () => {
        const hCurrent = document.querySelector(`html`).style.getPropertyValue("--header-height");
        const hNew = `${headerNav.clientHeight}px`;
        if(hNew !== hCurrent) { document.querySelector(`html`).style.setProperty("--header-height", hNew); }
    };
    getHeaderHeight();
    setInterval(getHeaderHeight, 100);

    //On mobile, make the top-level anchor tags (links) require double-press to confirm, in-case they want to open the sub-menu list.
    mobileItems.querySelectorAll(`:scope > div`).forEach(topD => {
        const sub = topD.querySelector(`.sub`);
        if(sub) {
            topD.querySelectorAll(`:scope > a`).forEach(topA => {
                topA.addEventListener("click", (event) => {
                    if(mobileItems.classList.contains("mobile-shown")) {
                        const hasClickedBefore = (topA.__hasClickedBefore === true);

                        if(hasClickedBefore) {
                            //Go to link
                            console.log("going to link");
                        } else {
                            event.preventDefault();
                            event.stopPropagation();
                            console.log("showing sub menu");
                            topA.__hasClickedBefore = true;
                        }
                    }
                });
            });
        }
    });

    window.addEventListener("click", () => {
        mobileItems.querySelectorAll(`:scope > div > a`).forEach(topA => {
            topA.__hasClickedBefore = false;
        });
    });

    //FAQ boxes.
    const faqs = document.querySelectorAll(`.faq-boxes > div`);
    faqs.forEach(faq => {
        faq.querySelector(`.top`).addEventListener("click", () => {
            const isOpen = faq.classList.contains("shown");
            faqs.forEach(other => { other.classList.remove("shown"); });
            if(!isOpen) { faq.classList.add("shown"); }
            window.checkVisibleAnimations();
        });
    });

    //Search bars that lead to search page (/?s={term}).
    if(true) {
        const searchbars = document.querySelectorAll(`input[data-search-bar]`);
        searchbars.forEach(searchbar => {
            const parent = searchbar.parentElement;
            if(parent.hasAttribute("data-click-focus")) {
                parent.addEventListener("click", () => {
                    searchbar.focus();
                });
            }

            const button = parent.querySelector("button");

            const search = () => {
                const term = searchbar.value.trim();
                if(term.length < 1) { return; }
                window.location.href = `/?s=${encodeURIComponent(term)}`;
            };

            searchbar.addEventListener("keypress", event => {
                if(event.key === "Enter") { search(); }
            });
            button.addEventListener("click", search);
        });
    }

    //Auto focus inputs.
    document.querySelectorAll(`:is(input, textarea)[data-auto-focus]`).forEach(input => {
        input.selectionStart = input.selectionEnd = input.value.length;
        input.focus();
    });

    //Tab menus.
    if(true) {
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
                    //options.tabMenuControls = Array.from(groupMenu.children).filter(i => { return !i.hasAttribute("href") && i.tagName.toLowerCase() === "a"; });
                    options.tabMenuControls = groupMenu.querySelectorAll(`a[data-tab]:not([href])`);
                    options.contentBlocks = document.querySelectorAll(`div[data-tab-group^="${options.groupName}"]`);
        
                    //Add two special variables to the actual elements to store their group name and content block name.
                    Array.from(options.tabMenuControls).map(i => { i.__ctm_isPrivate = options.isPrivate; i.__ctm_groupName = options.groupName; i.__ctm_contentBlockName = i.getAttribute("data-tab"); i.__ctm_callbacks = []; });
                    Array.from(options.contentBlocks).map(i => { i.__ctm_groupName = options.groupName; i.__ctm_contentBlockName = (i.getAttribute("data-tab-group") || "").split(" ")[1] || ""; });
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
                                setTimeout(() => { TabsAIGM.activateTab(control.__ctm_groupName, control.__ctm_contentBlockName); }, 10);
                                hasFoundFirst = true;
                            }
                        });
                    }
        
                    TabsAIGM.debug("Has found first:", hasFoundFirst);
                    if(!hasFoundFirst) {
                        TabsAIGM.activateTab(options.tabMenuControls[0].__ctm_groupName, options.tabMenuControls[0].__ctm_contentBlockName);
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

                        arrowLeft.addEventListener("click", () => { inner.scroll({ left: inner.scrollLeft - 250, top: 0, behavior: "smooth" }); });
                        arrowRight.addEventListener("click", () => { inner.scroll({ left: inner.scrollLeft + 250, top: 0, behavior: "smooth" }); });
                    }
                });
            }
        
            static activateTab(groupName, blockName) {
                let hasSelectedValidTab = false;
                let groupTabControls = Array.from(document.querySelectorAll(`div[data-tab-menu^="${groupName}"] a[data-tab]`));
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
                const control = document.querySelector(`div[data-tab-menu^="${group}"] a[data-tab="${name}"]`);
                const _func = () => { callback({ element: control, group: group, name: name }); };
                control.__ctm_callbacks.push(_func);
                TabsAIGM.debug("(tab select event) selected " + group + " > " + name);
                if(window.checkVisibleAnimations) { window.checkVisibleAnimations(); }
            }
        
            static isTabActive(groupName, blockName) {
                const tab = document.querySelector(`div[data-tab-menu^="${groupName}"] a[data-tab="${blockName}"]`);
                return tab && tab.classList.contains("active");
            }
        
        }

        TabsAIGM.setup();
    }

    //Fire scroll animations each time slick sliders update.
    document.querySelectorAll(`[data-slider]`).forEach(slider => {
        if(slider.slick) {
            slider.setAttribute("data-animate-off", "");
            const x = () => { window.checkVisibleAnimations(); };
            slider.slick.$slider.on("setPosition", x);
            slider.slick.$slider.on("swipe", x);
            slider.slick.$slider.on("edge", x);
            slider.slick.$slider.on("beforeChange", x);
            slider.slick.$slider.on("afterChange", x);
            slider.slick.$slider.on("init", x);
            slider.slick.$slider.on("reInit", x);
            
            slider.querySelectorAll(`img[loading]`).forEach(lazy => { lazy.removeAttribute("loading"); });
        }
    });
});

window.addEventListener("load", () => {
    //Page load indicator.
    const topPageLoader = document.querySelector("div[data-page-load-indicator]");
    if(topPageLoader) {
        topPageLoader.classList.add("loaded");
        setTimeout(() => { topPageLoader.remove(); }, 2000);
    }
});

//Scroll to section.
window.scrollToSection = (id) => {
    const section = document.querySelector("section." + id);
    const sectionY = section.getBoundingClientRect().top - document.body.getBoundingClientRect().top;
    window.scroll({ top: sectionY, behavior: "smooth" });
};

class AigmUX {

    static openPopupWindow(url, width, height) {
        const dualScreenLeft = window.screenLeft !== undefined ? window.screenLeft : window.screenX;
        const dualScreenTop = window.screenTop !== undefined ? window.screenTop : window.screenY;
        const winWidth = window.innerWidth ? window.innerWidth : document.documentElement.clientWidth ? document.documentElement.clientWidth : screen.width;
        const winHeight = window.innerHeight ? window.innerHeight : document.documentElement.clientHeight ? document.documentElement.clientHeight : screen.height;
        const systemZoom = winWidth / window.screen.availWidth;
        const left = (winWidth - width) / 2 / systemZoom + dualScreenLeft;
        const top = (winHeight - height) / 2 / systemZoom + dualScreenTop;
        window.open(url, "_window", `scrollbars=yes,width=${width / systemZoom},height=${height / systemZoom},top=${top},left=${left}`);
    }

}

window.aigm_template = {};
window.aigm_template.mobile_screen_width = 960;
window.aigm_template.mobile_slick_breakpoint = [
    { breakpoint: window.aigm_template.mobile_screen_width, settings: { slidesToShow: 1 } }
];

//Page load indicator.
if(true) {
    const topPageLoader = document.querySelector("div[data-page-load-indicator]");
    if(topPageLoader) { topPageLoader.classList.add("loading"); }
}