document.getElementById("newsletter")?.addEventListener("submit", (e) => {
    e.preventDefault();
    const email = e.target.querySelector("input").value;
    alert(`Subscribed with ${email}`);
});

document.getElementById("quick-login-form")?.addEventListener("submit", (e) => {
    e.preventDefault();
    const email = document.getElementById("quick-login-email").value;
    if (email) {
        alert(`Logging in with ${email}...`);
        window.location.href = "/Dashboard/Dashboard.html";
    }
});