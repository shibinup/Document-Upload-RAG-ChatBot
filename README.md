📄 PDF RAG Chatbot

A Retrieval-Augmented Generation (RAG) chatbot that allows users to upload PDF documents and ask questions about their content.

The application processes the uploaded PDF, splits it into smaller chunks, generates vector embeddings using a Hugging Face embedding model, stores those embeddings in ChromaDB, and uses a Hugging Face chat model through LangChain to generate answers based on the retrieved document content.

🚀 Features
📤 Upload PDF documents
📑 Extract text from PDF files
✂️ Split documents into smaller chunks
🧠 Generate embeddings using Hugging Face
🗄️ Store embeddings in ChromaDB
🔍 Perform semantic similarity search
💬 Ask questions about uploaded documents
🤖 Generate answers using a Hugging Face chat model
⚡ FastAPI backend
🔗 LangChain integration
🔐 Environment variable support for API keys
🏗️ Architecture

🛠️ Tech Stack
Technology	Purpose
Python	Backend programming language
FastAPI	REST API backend
LangChain	RAG application framework
Hugging Face	Embedding and chat models
ChromaDB	Vector database
PyPDF	PDF text extraction
RecursiveCharacterTextSplitter	Document chunking
Uvicorn	FastAPI development server
python-dotenv	Environment variable management



🔄 How RAG Works in This Project

The project follows a standard RAG pipeline.

1. Upload PDF

The user uploads a PDF through the FastAPI API.

PDF
 ↓
FastAPI Upload API
2. Extract Text

The PDF is loaded and its text is extracted.

PDF
 ↓
PyPDF / PDF Loader
 ↓
Document Text
3. Split Text

Large documents are divided into smaller chunks.

For example:

Original Document
        ↓
Chunk 1
Chunk 2
Chunk 3
Chunk 4
...

This makes retrieval more effective.

4. Generate Embeddings

Each document chunk is converted into a numerical vector using a Hugging Face embedding model.

"FastAPI is a Python framework"
              ↓
        Embedding Model
              ↓
       [0.12, -0.45, ...]
5. Store in ChromaDB

The embeddings are stored inside ChromaDB.

Document Chunk
      +
Embedding
      ↓
   ChromaDB
6. User Asks a Question

For example:

"What is FastAPI?"

The question is also converted into an embedding.

7. Retrieve Relevant Documents

ChromaDB performs a similarity search and finds the most relevant chunks.

User Question
      ↓
Question Embedding
      ↓
ChromaDB
      ↓
Relevant Chunks
8. Generate Answer

The retrieved chunks are passed as context to the Hugging Face chat model.

Question
   +
Retrieved Context
   ↓
Hugging Face Chat Model
   ↓
Final Answer

This is the main idea behind Retrieval-Augmented Generation.
