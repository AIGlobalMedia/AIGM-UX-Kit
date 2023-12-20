(() => {
    window.checkVisibleAnimations = () => {
        document.querySelectorAll(`[data-animate-pops]`).forEach(container => {
            let pop = 0;
            container.querySelectorAll(`:scope > [data-animate]:not([data-animate-ready], [data-animate-popper])`).forEach(animation => {
                animation.setAttribute("data-animate-popper", "");
                animation.style.animationDelay = `${pop}s`;
                pop += 0.175;
            });

            container.querySelectorAll(`:scope > [data-animate][data-animate-popper]:not([data-animate-ready])`).forEach(animation => {
                if(window.isElementVisible(container)) { animation.setAttribute("data-animate-ready", ""); }
            });
        });

        document.querySelectorAll(`[data-animate]:not([data-animate-ready], [data-animate-popper])`).forEach(animation => {
            if(window.isElementVisible(animation)) { animation.setAttribute("data-animate-ready", ""); }
        });
    };

    window.isElementVisible = (element) => {
        if(!element || 1 !== element.nodeType) { return false; }
        if(!element.getBoundingClientRect) { return true; }
        const html = document.documentElement;
        const rect = element.getBoundingClientRect();
        return (rect.bottom >= 0 && rect.right >= 0 && rect.left <= html.clientWidth && rect.top <= html.clientHeight) && (element.offsetWidth > 0 && element.offsetHeight > 0);
    };

    function x() {
        if(window.checkVisibleAnimations) { window.checkVisibleAnimations(); }
    }
    document.addEventListener("DOMContentLoaded", x);
    window.addEventListener("load", x);
    window.addEventListener("scroll", x, { passive: true });
    window.addEventListener("resize", x);
    document.querySelectorAll(`img`).forEach(img => { img.addEventListener("load", x); });
    x();

    /**
     * Legacy Browser Support
     * This disables all scroll animations for AIGM UX Kit.
    **/
    function isModernBrowser() {
        try {
            document.querySelectorAll(':scope body, :scope > body, :is(body), :not(html)');
        } catch(f) {
            return false;
        }
        return !!(document.documentElement.classList && document.documentElement.getBoundingClientRect() && ("CSS" in window) && ("IntersectionObserver" in window) && CSS.supports && CSS.supports("--x", 0) && CSS.supports("display", "flex") && CSS.supports("display", "flex"));
    }

    document.addEventListener("DOMContentLoaded", () => {
        if(!isModernBrowser()) {
            document.body.setAttribute("data-animate-off", "");
            window.isElementVisible = window.checkVisibleAnimations = () => { return true; };
        }
    });
})();