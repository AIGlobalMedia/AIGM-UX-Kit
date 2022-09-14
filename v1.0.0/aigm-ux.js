document.addEventListener("DOMContentLoaded", () => {
    const mobileItems = document.querySelector(`.aigm-ux nav .items`);
    const mobileBurger = document.querySelector(`.aigm-ux nav .burger`);
    mobileBurger.addEventListener("click", () => { mobileItems.classList.toggle("mobile-shown"); });
});
