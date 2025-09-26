document.querySelector("#loginForm").addEventListener("submit", async (e) => {
    e.preventDefault();
  
    const username = document.querySelector("#username").value.trim();
    const password = document.querySelector("#password").value.trim();
    if (!username || !password) return;
  
    try {
      const res = await fetch("/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
  
      const result = await res.json();
  
      if (result.success) {
        alert(result.message);
        window.location.href = `/?username=${encodeURIComponent(username)}`;

      } else {
        alert("Login failed: " + (result.error || "unknown error"));
      }
    } catch (err) {
      console.error(err);
      alert("Login failed: " + err.message);
    }
  });
  