require("dotenv").config({ override: true });

fetch("https://generativelanguage.googleapis.com/v1beta/models", {
    headers: { "x-goog-api-key": process.env.GEMINI_API_KEY.trim() },
})
    .then((r) => r.json())
    .then((d) => {
        if (d.error) return console.log("Error:", d.error.message);
        d.models
            .filter((m) => m.supportedGenerationMethods?.includes("generateContent"))
            .forEach((m) => console.log(m.name));
    });