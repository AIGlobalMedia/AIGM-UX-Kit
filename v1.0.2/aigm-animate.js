(() => {
    window.checkVisibleAnimations = () => {
        document.querySelectorAll(`[data-animate-pops]`).forEach(container => {
            let pop = 0;
            container.querySelectorAll(`:scope > [data-animate]:not([data-animate-ready], [data-animate-popper])`).forEach(animation => {
                animation.setAttribute("data-animate-popper", "");
                animation.style.animationDelay = `${pop}s`;
                pop += 0.2;
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
        const html = document.documentElement;
        const rect = element.getBoundingClientRect();
        return (rect.bottom >= 0 && rect.right >= 0 && rect.left <= html.clientWidth && rect.top <= html.clientHeight) && (element.offsetWidth > 0 && element.offsetHeight > 0);
    };

    function x() { window.checkVisibleAnimations(); }
    document.addEventListener("DOMContentLoaded", x);
    window.addEventListener("load", x);
    window.addEventListener("scroll", x);
    window.addEventListener("resize", x);
    x();
})();