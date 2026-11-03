require("dotenv").config({ override: true });

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const app = express();
app.use(cors());
app.use(express.json());

const key = (process.env.GEMINI_API_KEY || "").trim();
console.log("Key loaded:", key.length > 0, "| length:", key.length);

// ---------- MongoDB ----------
mongoose
    .connect(process.env.MONGODB_URI)
    .then(() => console.log("MongoDB connected"))
    .catch((err) => console.log("MongoDB connection failed:", err.message));

const chatSchema = new mongoose.Schema(
    {
        sessionId: { type: String, required: true, unique: true },
        messages: [
            {
                role: String,
                text: String,
                template: String,
                createdAt: { type: Date, default: Date.now },
            },
        ],
    },
    { timestamps: true }
);
const Chat = mongoose.model("Chat", chatSchema);

const dbReady = () => mongoose.connection.readyState === 1;
const validId = (s) => typeof s === "string" && /^[A-Za-z0-9_-]{8,100}$/.test(s);

async function saveExchange(sessionId, template, userText, aiText) {
    if (!validId(sessionId) || !dbReady()) return;
    try {
        await Chat.findOneAndUpdate(
            { sessionId },
            {
                $push: {
                    messages: {
                        $each: [
                            { role: "user", text: userText, template },
                            { role: "assistant", text: aiText, template },
                        ],
                    },
                },
            },
            { upsert: true }
        );
    } catch (e) {
        console.log("DB save failed:", e.message);
    }
}

// ---------- Gemini settings ----------
const BASE = "https://generativelanguage.googleapis.com/v1beta/models";
const MODELS = [
    "gemini-3.6-flash",
    "gemini-3.7-flash",
    "gemini-3.5-flash-lite",
    "gemini-3.1-flash-lite",
    "gemini-3.5-flash",
    "gemini-3.8-flash",
];
const MAX_LENGTH = 2000;

// ---------- Prompt templates ----------
const TEMPLATES = {
    mentor:
        "You are a friendly, encouraging mentor for students learning software development and AI. " +
        "Explain simply, give one short example, and end with a next step or a follow-up question. " +
        "Keep answers under 200 words unless the user asks for more.",
    code:
        "You are a code explainer. When the user gives code or a programming concept, explain what it does " +
        "step by step in plain language, point out common mistakes, and show a small corrected example if useful. " +
        "Use markdown code blocks.",
    summarizer:
        "You are a summarizer. Summarize the user's text in 3 to 5 bullet points, then add a one-line takeaway. " +
        "Do not add information that is not in the text.",
    quiz:
        "You are a quiz maker. Create 3 multiple-choice questions (options A to D) about the topic the user gives. " +
        "After the questions, list the correct answers with a one-line explanation each.",
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ---------- Open a Gemini stream (retry + fallback model) ----------
async function openStream(contents, system) {
    let lastError;

    for (const model of MODELS) {
        for (let attempt = 1; attempt <= 3; attempt++) {
            const r = await fetch(`${BASE}/${model}:streamGenerateContent?alt=sse`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-goog-api-key": key,
                },
                body: JSON.stringify({
                    systemInstruction: { parts: [{ text: system }] },
                    contents,
                }),
            });

            console.log("Model:", model, "| Status:", r.status);

            if (r.ok) return r;

            let msg = "Request failed";
            try {
                const d = await r.json();
                msg = d?.error?.message || msg;
            } catch {}

            const err = new Error(msg);
            err.status = r.status;
            lastError = err;

            if (r.status === 404 || r.status === 429) break; // next model
            if (r.status !== 503) throw err;
            await sleep(attempt * 1000);
        }
    }
    throw lastError;
}

app.get("/", (req, res) => {
    res.send("AI Chatbot Backend is running!");
});

// ---------- Chat history routes ----------
app.get("/api/history/:sessionId", async (req, res) => {
    const { sessionId } = req.params;
    if (!validId(sessionId)) return res.status(400).json({ error: "Invalid session id." });
    if (!dbReady()) return res.json({ messages: [] });

    try {
        const chat = await Chat.findOne({ sessionId }).lean();
        res.json({ messages: chat?.messages || [] });
    } catch (e) {
        console.log("DB read failed:", e.message);
        res.json({ messages: [] });
    }
});

app.delete("/api/history/:sessionId", async (req, res) => {
    const { sessionId } = req.params;
    if (!validId(sessionId)) return res.status(400).json({ error: "Invalid session id." });

    try {
        if (dbReady()) await Chat.deleteOne({ sessionId });
        res.json({ ok: true });
    } catch (e) {
        console.log("DB delete failed:", e.message);
        res.status(500).json({ error: "Could not clear the chat." });
    }
});

// ---------- Chat route ----------
app.post("/api/chat", async (req, res) => {
    try {
        const { message, template, history, sessionId } = req.body;

        // ---------- Validation ----------
        if (!message || typeof message !== "string" || !message.trim()) {
            return res.status(400).json({ error: "Please type a message first." });
        }
        if (message.length > MAX_LENGTH) {
            return res
                .status(400)
                .json({ error: `Message is too long. Keep it under ${MAX_LENGTH} characters.` });
        }

        const system = TEMPLATES[template] || TEMPLATES.mentor;

        const past = Array.isArray(history) ? history.slice(-10) : [];
        const contents = [
            ...past
                .filter((h) => h && typeof h.text === "string" && h.text.trim())
                .map((h) => ({
                    role: h.role === "user" ? "user" : "model",
                    parts: [{ text: h.text }],
                })),
            { role: "user", parts: [{ text: message }] },
        ];

        const upstream = await openStream(contents, system);

        // ---------- Stream to the browser ----------
        res.setHeader("Content-Type", "text/event-stream");
        res.setHeader("Cache-Control", "no-cache");
        res.setHeader("Connection", "keep-alive");
        res.flushHeaders();

        const reader = upstream.body.getReader();
        res.on("close", () => reader.cancel().catch(() => {}));

        const decoder = new TextDecoder();
        let buffer = "";
        let fullReply = "";

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop();

            for (const raw of lines) {
                const line = raw.trim();
                if (!line.startsWith("data:")) continue;

                try {
                    const data = JSON.parse(line.slice(5).trim());
                    const parts = data?.candidates?.[0]?.content?.parts || [];
                    const text = parts
                        .filter((p) => !p.thought)
                        .map((p) => p.text || "")
                        .join("");
                    if (text) {
                        fullReply += text;
                        res.write(`data: ${JSON.stringify({ text })}\n\n`);
                    }
                } catch {}
            }
        }

        res.write("data: [DONE]\n\n");
        res.end();

        // save to MongoDB after the reply is finished (never breaks the chat)
        if (fullReply) await saveExchange(sessionId, template, message, fullReply);
    } catch (error) {
        console.log("Status:", error.status, "| Message:", error.message);

        const friendly = {
            400: "Something is wrong with the request or the API key.",
            401: "The API key is not valid. Check the backend .env file.",
            403: "The API key does not have permission for this model.",
            429: "Too many requests right now. Please wait a moment and try again.",
            503: "The AI is busy right now. Please try again in a bit.",
        };
        const text = friendly[error.status] || "Something went wrong. Please try again.";

        if (res.headersSent) {
            res.write(`data: ${JSON.stringify({ error: text })}\n\n`);
            return res.end();
        }
        res.status(error.status || 500).json({ error: text });
    }
});

app.listen(5000, () => {
    console.log("Server running at http://localhost:5000");
});