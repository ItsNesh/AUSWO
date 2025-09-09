function toggleDropdown() {
    const menu = document.getElementById("dropdownMenu");
    menu.style.display = (menu.style.display === "block") ? "none" : "block";
}

function uploadProfilePic(event) {
    const file = event.target.files[0];
    if(file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const img = document.getElementById("profileImage");
            img.src = e.target.result;
            img.style.display = "block";
            document.getElementById("picText").style.display = "none";
        };
        reader.readAsDataURL(file);
    }
}

function editProfile() {
    const content = document.getElementById("main-content");
    const name = document.getElementById("userName").innerText;
    const email = document.getElementById("userEmail").innerText;
    content.innerHTML = `
        <h2>Edit Profile</h2>
        <label>Name: <input type="text" id="editName" value="${name}"></input></label><br><br>
        <label>Email: <input type="email" id="editEmail" value="${email}"></input></label><br><br>
        <button class="button" onclick="saveProfile()">Save</button>
    `;
}

function saveProfile() {
    const newName = document.getElementById("editName").value;
    const newEmail = document.getElementById("editEmail").value;

    document.getElementById("userName").innerText = newName;
    document.getElementById("userEmail").innerText = newEmail;

    const content = document.getElementById("main-content");
    content.innerHTML = `
        <h2>Profile Updated</h2>
        <p>Your changes have been saved.</p>
    `;
}

document.addEventListener("DOMContentLoaded", () => {
    const result = localStorage.getItem("pointsResult");
    if(result) {
        document.getElementById("points-display").textContent = "Points Result: " + result;
    }
});