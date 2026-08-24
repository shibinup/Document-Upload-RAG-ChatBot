import { useEffect, useRef, useState } from "react";

export default function DocumentChat() {
  const [file, setFile] = useState(null);
  const [question, setQuestion] = useState("");

  const [messages, setMessages] = useState([
    {
      id: 1,
      role: "bot",
      text: "Hello! 👋 Upload a document and ask me anything about it.",
    },
  ]);

  const [isLoading, setIsLoading] = useState(false);

  const messagesEndRef = useRef(null);

  // Auto scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages, isLoading]);

  // ================================
  // FILE UPLOAD
  // ================================
const handleFileChange = async (e) => {
  const selectedFile = e.target.files[0];

  if (!selectedFile) return;

  setFile(selectedFile);

  // Create FormData
  const formData = new FormData();

  // IMPORTANT:
  // "file" must match FastAPI parameter name
  formData.append("file", selectedFile);

  try {
    const response = await fetch("http://127.0.0.1:8000/upload/", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      console.log("!res.ok called")
      throw new Error("Upload failed");
    }
    console.log("api called ")

    const data = await response.json();

    console.log("Backend response:", data);

    setMessages((prev) => [
      ...prev,
      {
        id: Date.now(),
        role: "system",
        text: `📄 ${data.filename} uploaded successfully.`,
      },
    ]);

  } catch (error) {

    console.error(error);

    setMessages((prev) => [
      ...prev,
      {
        id: Date.now(),
        role: "system",
        text: "❌ File upload failed.",
      },
    ]);

  }
};
  // ================================
  // SEND MESSAGE
  // ================================
  const handleSend = async () => {
    if (!question.trim() || isLoading) return;

    const userQuestion = question.trim();

    // Add user message
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now(),
        role: "user",
        text: userQuestion,
      },
    ]);

    // Clear input
    //setQuestion("");

    // Show loading
    setIsLoading(true);

    try {
      if(!file){

         setMessages((prev) => [
      ...prev,
      {
        id: Date.now() + 1,
        role: "bot",
        text: "please upload the document and try again",
      },
    ]);
    setQuestion("")
      return;

      }
      const response = await fetch("http://127.0.0.1:8000/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query: question }),
    });
      console.log("api called from frontedn")
      if (!response.ok) {
        console.log("!res.ok cald ")
      throw new Error(`Server error: ${response.status}`);
    }
  
     const data = await response.json();
     console.log("data is", data)

     setMessages((prev) => [
      ...prev,
      {
        id: Date.now() + 1,
        role: "bot",
        text: data.reply, // Assumes your API returns { reply: "..." }
      },
    ]);

    } catch (error) {

       console.log("Failed to fetch response:", error);
    
    // Optional: Show an error message to the user in the chat UI
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now() + 1,
        role: "bot",
        text: "Sorry, I am having trouble connecting to the server. Please try again.",
      },
    ]);
      
    } finally {
    // Turn off loading indicator whether the call succeeded or failed
    setIsLoading(false);
  }
};
  

  // ================================
  // ENTER KEY
  // ================================
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="h-screen bg-gray-100 flex flex-col">

      {/* ================= HEADER ================= */}

      <header className="h-16 bg-white border-b flex items-center px-6 shrink-0">

        <div className="flex items-center gap-3">

          <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white">
            📚
          </div>

          <div>
            <h1 className="font-semibold text-gray-800">
              Document Q&A
            </h1>

            <p className="text-xs text-gray-400">
              Ask questions about your document
            </p>
          </div>

        </div>

      </header>


      {/* ================= CHAT AREA ================= */}

      <main className="flex-1 overflow-y-auto px-4 py-6">

        <div className="max-w-3xl mx-auto">

          {/* Messages */}

          <div className="space-y-5">

            {messages.map((message) => (

              <div
                key={message.id}
                className={`flex ${
                  message.role === "user"
                    ? "justify-end"
                    : message.role === "system"
                    ? "justify-center"
                    : "justify-start"
                }`}
              >

                {/* ================= BOT MESSAGE ================= */}

                {message.role === "bot" && (

                  <div className="flex items-start gap-3 max-w-[80%]">

                    <div className="w-8 h-8 shrink-0 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm">
                      AI
                    </div>

                    <div className="bg-white border rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">

                      <p className="text-gray-800 whitespace-pre-wrap">
                        {message.text}
                      </p>

                    </div>

                  </div>

                )}


                {/* ================= USER MESSAGE ================= */}

                {message.role === "user" && (

                  <div className="max-w-[80%]">

                    <div className="bg-blue-600 text-white rounded-2xl rounded-tr-sm px-4 py-3 shadow-sm">

                      <p className="whitespace-pre-wrap">
                        {message.text}
                      </p>

                    </div>

                  </div>

                )}


                {/* ================= SYSTEM MESSAGE ================= */}

                {message.role === "system" && (

                  <div className="bg-gray-200 text-gray-600 text-sm px-4 py-2 rounded-full">

                    {message.text}

                  </div>

                )}

              </div>

            ))}


            {/* ================= TYPING INDICATOR ================= */}

            {isLoading && (

              <div className="flex justify-start">

                <div className="flex items-start gap-3">

                  <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm">
                    AI
                  </div>

                  <div className="bg-white border rounded-2xl rounded-tl-sm px-5 py-4">

                    <div className="flex gap-1">

                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>

                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:150ms]"></span>

                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:300ms]"></span>

                    </div>

                  </div>

                </div>

              </div>

            )}

            <div ref={messagesEndRef} />

          </div>

        </div>

      </main>


      {/* ================= INPUT AREA ================= */}

      <div className="bg-white border-t px-4 py-4 shrink-0">

        <div className="max-w-3xl mx-auto">


          {/* ================= UPLOADED FILE ================= */}

          {file && (

            <div className="mb-3 flex items-center justify-between bg-gray-100 border px-4 py-3 rounded-xl">

              <div className="flex items-center gap-3 min-w-0">

                <div className="text-xl">
                  📄
                </div>

                <div className="min-w-0">

                  <p className="text-sm font-medium text-gray-700 truncate">
                    {file.name}
                  </p>

                  <p className="text-xs text-gray-400">
                    {(file.size / 1024).toFixed(1)} KB
                  </p>

                </div>

              </div>


              <button
                onClick={() => setFile(null)}
                className="text-gray-400 hover:text-red-500 text-lg"
              >
                ✕
              </button>

            </div>

          )}


          {/* ================= CHAT INPUT ================= */}

          <div className="flex items-end gap-2 border rounded-2xl bg-gray-50 p-2 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500">

            {/* File Upload */}

            <label
              htmlFor="file-upload"
              className="p-2 cursor-pointer text-gray-500 hover:text-blue-600 hover:bg-gray-200 rounded-lg transition"
            >
              📎
            </label>

            <input
              id="file-upload"
              type="file"
              accept=".pdf,.txt,.doc,.docx"
              onChange={handleFileChange}
              className="hidden"
            />


            {/* Textarea */}

            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                file
                  ? "Ask something about your document..."
                  : "Upload a document and ask a question..."
              }
              rows={1}
              className="flex-1 resize-none bg-transparent outline-none px-2 py-2 text-gray-800 placeholder-gray-400 max-h-32"
            />


            {/* Send Button */}

            <button
              onClick={handleSend}
              disabled={!question.trim() || isLoading}
              className="w-10 h-10 flex items-center justify-center bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white rounded-xl transition"
            >
              ➤
            </button>

          </div>


          <p className="text-xs text-center text-gray-400 mt-2">
            Enter to send • Shift + Enter for new line
          </p>

        </div>

      </div>

    </div>
  );
}