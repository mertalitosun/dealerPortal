document.addEventListener('DOMContentLoaded', function() {
    const navLinks = document.querySelectorAll(".sidebar .nav-link");
    navLinks.forEach(link => link.classList.remove("active"));
    navLinks.forEach(navLink => {
        navLink.addEventListener("click", () => {
            navLinks.forEach(link => link.classList.remove("active"));

            navLink.classList.add("active");
        });
    });

    const currentPage = window.location.pathname.split('/').pop();
    navLinks.forEach(navLink => {
        const href = navLink.getAttribute('href');
        if (href && href.includes(currentPage)) {
            navLink.classList.add("active");
        }
       if(currentPage == ""){
        navLink.classList.remove("active");
       }
    });
});
