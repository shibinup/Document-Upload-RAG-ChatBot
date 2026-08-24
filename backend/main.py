from fastapi import FastAPI, File, UploadFile,HTTPException,Request
from pypdf import PdfReader
from fastapi.middleware.cors import CORSMiddleware
import io
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from dotenv import load_dotenv
from langchain_huggingface import HuggingFaceEmbeddings,HuggingFaceEndpoint, ChatHuggingFace
from langchain_chroma import Chroma
from langchain_ollama import ChatOllama
from langchain_core.messages import AIMessage, HumanMessage, SystemMessage
import os

app = FastAPI()
load_dotenv()
origins = [
    "http://localhost.tiangolo.com",
    "https://localhost.tiangolo.com",
    "http://localhost",
    "http://localhost:5173",
]


app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.state.vectorstore= None
@app.get("/")
def read_root():
    return {"Hello": "World"}


@app.get("/items/{item_id}")
def read_item(item_id: int, q: str | None = None):
    return {"item_id": item_id, "q": q}


@app.post("/upload/")
async def upload_document(file: UploadFile):
    print("upload api called successfuly in server ")


    if not file.filename.endswith(".pdf"):
        print("not a pdf called ")
        raise HTTPException(
            status_code=400, 
            detail="Invalid file format. Please upload a PDF file."
        )
    
    try:
        # Read the file contents into memory
        contents = await file.read()
        
        # Pass the bytes buffer directly to PdfReader
        pdf_stream = io.BytesIO(contents)
        reader = PdfReader(pdf_stream)
        
        # Extract basic metadata
        num_pages = len(reader.pages)
        metadata = reader.metadata
        
        # Extract text from all pages
        full_text = ""
        for page_num, page in enumerate(reader.pages):
            text = page.extract_text()
            if text:
                full_text += f"--- Page {page_num + 1} ---\n{text}\n"

        text_splitter = RecursiveCharacterTextSplitter(
        # Set a really small chunk size, just to show.
        chunk_size=500,
        chunk_overlap=20,
        length_function=len,
        is_separator_regex=False,
        )
        persist_directory="./chroma_db"
        # embedding the chunks 
        texts = text_splitter.create_documents([full_text])
        print("length of texts",len(texts))
        embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")
        # stoing vectoe database
        vector_store = Chroma.from_documents(
        documents=texts,
        embedding=embeddings,
        persist_directory=persist_directory
        )
        app.state.vectorstore = vector_store
        print("embedding and storing finsihed")
        
        return {
            "filename": file.filename,
            "total_pages": num_pages,
            "metadata": {k: str(v) for k, v in metadata.items()} if metadata else {},
            "extracted_text": full_text
        }
        
        
    except Exception as e:
        print("exception called in upload ")
        print("excption is ",e)
        raise HTTPException(
            status_code=500, 
            detail=f"An error occurred while processing the PDF: {str(e)}"
        )
    finally:
        # Ensure the uploaded file stream is closed
        await file.close()



@app.post("/chat")
async def chat(request: Request):
   print("chat called ")
   body= await request.json()
   print(body)
   query=body.get("query")
   try:
        print("query is ", query)
        vector_store = app.state.vectorstore
        # query embedding and retriving relevant chunk
        relevant_chunks = vector_store.similarity_search(query, k=2)
        
        for i, chunk in enumerate(relevant_chunks):
            
            print(f"--- Chunk {i+1} ---")
            print(chunk) #print(chunk.page_content)
            print("\n")
        # joining all chunks
        context="\n".join(doc.page_content for doc in relevant_chunks)
        #llm integration (here used ollama)
        llm = HuggingFaceEndpoint(
        repo_id="deepseek-ai/DeepSeek-R1-0528",
        task="text-generation",
        max_new_tokens=512,
        temperature=0.7,
        provider="auto",
        huggingfacehub_api_token=os.getenv("HF_TOKEN")
    )

        chat_model = ChatHuggingFace(llm=llm)
        messages=[
            SystemMessage(content=f"You are a Rag chat bot assistant,You are a helpful assistant. Use ONLY the provided Context to answer the Question. If the answer cannot be found in the Context, say (sorry not provide in the uploaded document) Do not make things up ,Do not include an introduction or conclusion and elaboration ,and give direct answer"),
            HumanMessage(content=f"contexts are {context} and question is {query}")
        ]
        response = chat_model.invoke(messages)
        print(response.content)
        return{
            "reply":response.content,
            "success":True
        }
   except  Exception as e:
        print("exception called in chat ")
        print("excption is ",e)
        raise HTTPException(
                status_code=500, 
                detail=f"some thing  went wrong in the server"
                )
