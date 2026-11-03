// import { useState, useRef, useEffect } from "react";
// import ReactMarkdown from "react-markdown";
// import "./App.css";

// const API = "http://localhost:5000";

// const TEMPLATES = [
//   { id: "mentor", label: "Mentor" },
//   { id: "code", label: "Code Explainer" },
//   { id: "summarizer", label: "Summarizer" },
//   { id: "quiz", label: "Quiz Maker" },
// ];

// // one id per browser, so each browser sees only its own chat
// function getSessionId() {
//   try {
//     let id = localStorage.getItem("chatSessionId");
//     if (!id) {
//       id = crypto.randomUUID();
//       localStorage.setItem("chatSessionId", id);
//     }
//     return id;
//   } catch {
//     return crypto.randomUUID();
//   }
// }

// function App() {
//   const [message, setMessage] = useState("");
//   const [messages, setMessages] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [template, setTemplate] = useState("mentor");
//   const [inputError, setInputError] = useState("");
//   const [sessionId] = useState(getSessionId);
//   const bottomRef = useRef(null);

//   useEffect(() => {
//     bottomRef.current?.scrollIntoView({ behavior: "smooth" });
//   }, [messages]);

//   // load the saved chat when the page opens
//   useEffect(() => {
//     fetch(`${API}/api/history/${sessionId}`)
//       .then((r) => r.json())
//       .then((d) => {
//         if (Array.isArray(d.messages) && d.messages.length) {
//           setMessages(d.messages.map((m) => ({ role: m.role, text: m.text })));
//         }
//       })
//       .catch(() => { });
//   }, [sessionId]);

//   // update the last (assistant) message
//   function setLast(text, extra = {}) {
//     setMessages((prev) => {
//       const copy = [...prev];
//       copy[copy.length - 1] = { ...copy[copy.length - 1], text, ...extra };
//       return copy;
//     });
//   }

//   async function clearChat() {
//     if (loading) return;
//     try {
//       await fetch(`${API}/api/history/${sessionId}`, { method: "DELETE" });
//     } catch { }
//     setMessages([]);
//     setInputError("");
//   }

//   async function sendMessage(e) {
//     e.preventDefault();
//     if (loading) return;

//     const text = message.trim();
//     if (!text) {
//       setInputError("Please type a message first.");
//       return;
//     }

//     setInputError("");

//     const history = messages
//       .filter((m) => !m.isError && m.text)
//       .map((m) => ({ role: m.role, text: m.text }));

//     setMessages((prev) => [
//       ...prev,
//       { role: "user", text },
//       { role: "assistant", text: "" },
//     ]);
//     setMessage("");
//     setLoading(true);

//     try {
//       const response = await fetch(`${API}/api/chat`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ message: text, template, history, sessionId }),
//       });

//       if (!response.ok) {
//         const data = await response.json().catch(() => ({}));
//         throw new Error(data.error || "Request failed.");
//       }

//       const reader = response.body.getReader();
//       const decoder = new TextDecoder();
//       let buffer = "";
//       let full = "";

//       while (true) {
//         const { done, value } = await reader.read();
//         if (done) break;

//         buffer += decoder.decode(value, { stream: true });
//         const events = buffer.split("\n\n");
//         buffer = events.pop();

//         for (const evt of events) {
//           const line = evt.trim();
//           if (!line.startsWith("data:")) continue;

//           const payload = line.slice(5).trim();
//           if (payload === "[DONE]") continue;

//           const parsed = JSON.parse(payload);
//           if (parsed.error) throw new Error(parsed.error);

//           full += parsed.text;
//           setLast(full);
//         }
//       }

//       if (!full) {
//         setLast("I could not generate a reply. Try rephrasing your message.", {
//           isError: true,
//         });
//       }
//     } catch (error) {
//       const msg =
//         error.message === "Failed to fetch"
//           ? "Cannot reach the server. Make sure the backend is running."
//           : error.message;
//       setLast(msg, { isError: true });
//     } finally {
//       setLoading(false);
//     }
//   }

//   return (
//     <div className="app">
//       <header className="topbar">
//         <h2>AI Chat</h2>
//         <span>Powered by Gemini</span>
//       </header>

//       <main className="chat">
//         {messages.length === 0 && (
//           <div className="welcome">
//             <h1>Hey! What’s on your mind?</h1>
//             <p>Pick a mode below, ask something, and let's figure it out together.</p>
//           </div>
//         )}

//         {messages.map((item, index) => (
//           <div
//             className={`message ${item.role} ${item.isError ? "error" : ""}`}
//             key={index}
//           >
//             <strong>{item.role === "user" ? "You" : "AI"}</strong>

//             {item.role === "user" ? (
//               <p>{item.text}</p>
//             ) : item.text ? (
//               <ReactMarkdown>{item.text}</ReactMarkdown>
//             ) : (
//               <p>Thinking...</p>
//             )}
//           </div>
//         ))}

//         <div ref={bottomRef} />
//       </main>

//       <div className="toolbar">
//         <label htmlFor="template">Mode:</label>
//         <select
//           id="template"
//           value={template}
//           onChange={(e) => setTemplate(e.target.value)}
//           disabled={loading}
//         >
//           {TEMPLATES.map((t) => (
//             <option key={t.id} value={t.id}>
//               {t.label}
//             </option>
//           ))}
//         </select>

//         {messages.length > 0 && (
//           <button
//             type="button"
//             className="clear-btn"
//             onClick={clearChat}
//             disabled={loading}
//           >
//             Clear chat
//           </button>
//         )}
//       </div>

//       {inputError && <div className="input-error">{inputError}</div>}

//       <form className="input-area" onSubmit={sendMessage}>
//         <input
//           value={message}
//           onChange={(e) => {
//             setMessage(e.target.value);
//             if (inputError) setInputError("");
//           }}
//           placeholder="Message your AI..."
//           aria-label="Your message"
//           disabled={loading}
//         />

//         <button type="submit" disabled={loading}>
//           Send
//         </button>
//       </form>

//       <footer>AI can make mistakes. Verify important information.</footer>
//     </div>
//   );
// }

// export default App;

import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import "./App.css";

const API = "http://localhost:5000";
const MAX_LENGTH = 2000;

const MODES = [
  {
    id: "mentor",
    label: "Mentor",
    icon: "🧑‍🏫",
    hint: "Friendly guidance with a simple example and a next step.",
    placeholder: "Ask anything you want to learn...",
    suggestions: [
      "Explain what an API is",
      "How do I start learning React?",
      "What is the difference between let and const?",
      "Give me a 30-day plan to learn JavaScript",
    ],
  },
  {
    id: "code",
    label: "Code Explainer",
    icon: "💻",
    hint: "Paste code or a concept and get a step-by-step explanation.",
    placeholder: "Paste some code or a programming concept...",
    suggestions: [
      "const nums = [1, 2, 3].filter((n) => n > 1);",
      "Explain async/await with an example",
      "arr.reduce((a, b) => a + b, 0)",
      "Why is 0.1 + 0.2 not equal to 0.3 in JavaScript?",
    ],
  },
  {
    id: "summarizer",
    label: "Summarizer",
    icon: "📝",
    hint: "Paste a text and get bullet points with a one-line takeaway.",
    placeholder: "Paste the text you want summarized...",
    suggestions: [
      "Photosynthesis is the process by which plants convert light energy into chemical energy. Using sunlight, water and carbon dioxide, they make glucose and release oxygen. It mainly happens in the chloroplasts and is the base of most food chains.",
      "The internet is a global network of computers that communicate using shared rules called protocols. It allows people to send messages, browse websites and stream videos in seconds, no matter where they are in the world.",
    ],
  },
  {
    id: "quiz",
    label: "Quiz Maker",
    icon: "🎯",
    hint: "Type a topic and get a 3-question quiz with answers.",
    placeholder: "Type a topic, like JavaScript...",
    suggestions: ["JavaScript", "Photosynthesis", "World War II", "React hooks"],
  },
];

// one id per browser, so each browser sees only its own chat
function getSessionId() {
  try {
    let id = localStorage.getItem("chatSessionId");
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem("chatSessionId", id);
    }
    return id;
  } catch {
    return crypto.randomUUID();
  }
}

function getTheme() {
  try {
    return localStorage.getItem("chatTheme") || "dark";
  } catch {
    return "dark";
  }
}

async function copyText(text, setFlag) {
  try {
    await navigator.clipboard.writeText(text);
    setFlag(true);
    setTimeout(() => setFlag(false), 1500);
  } catch {}
}

// get plain text out of React children (for the code copy button)
function nodeText(node) {
  if (typeof node === "string") return node;
  if (Array.isArray(node)) return node.map(nodeText).join("");
  if (node?.props?.children) return nodeText(node.props.children);
  return "";
}

function PreBlock({ children }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="codeblock">
      <button
        type="button"
        className="code-copy"
        onClick={() => copyText(nodeText(children), setCopied)}
      >
        {copied ? "Copied ✓" : "Copy"}
      </button>
      <pre>{children}</pre>
    </div>
  );
}

const mdComponents = { pre: PreBlock };

function SendIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 19V5" />
      <path d="M5 12l7-7 7 7" />
    </svg>
  );
}

function StopIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
      <rect x="6" y="6" width="12" height="12" rx="2" />
    </svg>
  );
}

function Message({ item, streaming }) {
  const [copied, setCopied] = useState(false);
  const isUser = item.role === "user";
  const typing = !isUser && !item.text && streaming;

  return (
    <div className={`row ${isUser ? "user" : "ai"}`}>
      <div className={`avatar ${isUser ? "user" : "ai"}`}>{isUser ? "Y" : "✦"}</div>

      <div className={`bubble ${item.isError ? "error" : ""} ${item.note ? "note" : ""}`}>
        {isUser ? (
          <p>{item.text}</p>
        ) : typing ? (
          <div className="typing" aria-label="AI is thinking">
            <span />
            <span />
            <span />
          </div>
        ) : (
          <>
            <ReactMarkdown components={mdComponents}>{item.text}</ReactMarkdown>
            {streaming && <span className="caret" />}
          </>
        )}

        {!isUser && item.text && !streaming && !item.isError && !item.note && (
          <button
            type="button"
            className="copy-msg"
            onClick={() => copyText(item.text, setCopied)}
          >
            {copied ? "Copied ✓" : "Copy"}
          </button>
        )}
      </div>
    </div>
  );
}

function App() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [template, setTemplate] = useState("mentor");
  const [inputError, setInputError] = useState("");
  const [theme, setTheme] = useState(getTheme);
  const [showDown, setShowDown] = useState(false);
  const [sessionId] = useState(getSessionId);

  const chatRef = useRef(null);
  const inputRef = useRef(null);
  const abortRef = useRef(null);
  const stick = useRef(true);

  const mode = MODES.find((m) => m.id === template) || MODES[0];

  // theme
  useEffect(() => {
    try {
      localStorage.setItem("chatTheme", theme);
    } catch {}
  }, [theme]);

  // auto-scroll (only if the user is near the bottom)
  useEffect(() => {
    const el = chatRef.current;
    if (el && stick.current) {
      el.scrollTo({ top: el.scrollHeight, behavior: loading ? "auto" : "smooth" });
    }
  }, [messages, loading]);

  // auto-resize textarea
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 160) + "px";
  }, [message]);

  // load the saved chat when the page opens
  useEffect(() => {
    fetch(`${API}/api/history/${sessionId}`)
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d.messages) && d.messages.length) {
          setMessages(d.messages.map((m) => ({ role: m.role, text: m.text })));
        }
      })
      .catch(() => {});
  }, [sessionId]);

  function onScroll() {
    const el = chatRef.current;
    if (!el) return;
    const near = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
    stick.current = near;
    setShowDown(!near);
  }

  function scrollDown() {
    const el = chatRef.current;
    stick.current = true;
    el?.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }

  // update the last (assistant) message
  function setLast(text, extra = {}) {
    setMessages((prev) => {
      const copy = [...prev];
      copy[copy.length - 1] = { ...copy[copy.length - 1], text, ...extra };
      return copy;
    });
  }

  async function clearChat() {
    if (loading) return;
    try {
      await fetch(`${API}/api/history/${sessionId}`, { method: "DELETE" });
    } catch {}
    setMessages([]);
    setInputError("");
  }

  function useSuggestion(text) {
    setMessage(text);
    setInputError("");
    inputRef.current?.focus();
  }

  async function sendMessage(e) {
    if (e) e.preventDefault();
    if (loading) return;

    const text = message.trim();
    if (!text) {
      setInputError("Please type a message first.");
      return;
    }

    setInputError("");
    stick.current = true;

    const history = messages
      .filter((m) => !m.isError && !m.note && m.text)
      .map((m) => ({ role: m.role, text: m.text }));

    setMessages((prev) => [
      ...prev,
      { role: "user", text },
      { role: "assistant", text: "" },
    ]);
    setMessage("");
    setLoading(true);

    const controller = new AbortController();
    abortRef.current = controller;
    let full = "";

    try {
      const response = await fetch(`${API}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, template, history, sessionId }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Request failed.");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split("\n\n");
        buffer = events.pop();

        for (const evt of events) {
          const line = evt.trim();
          if (!line.startsWith("data:")) continue;

          const payload = line.slice(5).trim();
          if (payload === "[DONE]") continue;

          const parsed = JSON.parse(payload);
          if (parsed.error) throw new Error(parsed.error);

          full += parsed.text;
          setLast(full);
        }
      }

      if (!full) {
        setLast("I could not generate a reply. Try rephrasing your message.", {
          isError: true,
        });
      }
    } catch (error) {
      if (error.name === "AbortError") {
        if (!full) setLast("Generation stopped.", { note: true });
      } else {
        const msg =
          error.message === "Failed to fetch"
            ? "Cannot reach the server. Make sure the backend is running."
            : error.message;
        setLast(msg, { isError: true });
      }
    } finally {
      setLoading(false);
      abortRef.current = null;
    }
  }

  function onKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      sendMessage();
    }
  }

  return (
    <div className="app" data-theme={theme}>
      <div className="bg" aria-hidden="true">
        <span className="orb o1" />
        <span className="orb o2" />
        <span className="orb o3" />
      </div>

      <header className="topbar">
        <div className="brand">
          <div className="logo">✦</div>
          <h2>AI Chat</h2>
        </div>

        <div className="top-right">
          <span className="pill">
            <i className="live-dot" /> Powered by Gemini
          </span>
          <button
            type="button"
            className="icon-btn"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            aria-label="Toggle theme"
            title="Toggle theme"
          >
            {theme === "dark" ? "☀️" : "🌙"}
          </button>
        </div>
      </header>

      <nav className="modes" aria-label="Chat mode">
        {MODES.map((m) => (
          <button
            key={m.id}
            type="button"
            className={`mode-tab ${template === m.id ? "active" : ""}`}
            onClick={() => setTemplate(m.id)}
            disabled={loading}
          >
            <span>{m.icon}</span> {m.label}
          </button>
        ))}
        {messages.length > 0 && (
          <button type="button" className="clear-btn" onClick={clearChat} disabled={loading}>
            Clear chat
          </button>
        )}
      </nav>
      <p className="mode-hint">{mode.hint}</p>

      <div className="chat-wrap">
        <main className="chat" ref={chatRef} onScroll={onScroll}>
          <div className="chat-inner">
            {messages.length === 0 && (
              <div className="welcome">
                <h1>Hey! What’s on your mind?</h1>
                <p>Pick a mode above, or start with one of these.</p>

                <div className="suggestions">
                  {mode.suggestions.map((s) => (
                    <button
                      key={s}
                      type="button"
                      className="suggestion"
                      onClick={() => useSuggestion(s)}
                    >
                      {s.length > 110 ? s.slice(0, 110) + "…" : s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((item, index) => (
              <Message
                key={index}
                item={item}
                streaming={
                  loading && index === messages.length - 1 && item.role === "assistant"
                }
              />
            ))}
          </div>
        </main>

        {showDown && (
          <button type="button" className="scroll-down" onClick={scrollDown} aria-label="Scroll to bottom">
            ↓ Latest
          </button>
        )}
      </div>

      {inputError && (
        <div className="input-error" role="alert">
          {inputError}
        </div>
      )}

      <form className="composer" onSubmit={sendMessage}>
        <textarea
          ref={inputRef}
          rows={1}
          value={message}
          onChange={(e) => {
            setMessage(e.target.value);
            if (inputError) setInputError("");
          }}
          onKeyDown={onKeyDown}
          placeholder={mode.placeholder}
          aria-label="Your message"
          disabled={loading}
        />

        {loading ? (
          <button
            type="button"
            className="send-btn stop"
            onClick={() => abortRef.current?.abort()}
            aria-label="Stop generating"
            title="Stop generating"
          >
            <StopIcon />
          </button>
        ) : (
          <button type="submit" className="send-btn" aria-label="Send message" title="Send">
            <SendIcon />
          </button>
        )}
      </form>

      <div className="composer-meta">
        <span>Enter to send · Shift + Enter for a new line</span>
        <span className={message.length > MAX_LENGTH ? "over" : ""}>
          {message.length}/{MAX_LENGTH}
        </span>
      </div>

      <footer>AI can make mistakes. Verify important information.</footer>
    </div>
  );
}

export default App;