require("dotenv").config({ override: true });

fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent", {
    method: "POST",
    headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": process.env.GEMINI_API_KEY.trim(),
    },
    body: JSON.stringify({ contents: [{ parts: [{ text: "hello" }] }] }),
})
    .then((r) => r.text())
    .then(console.log);