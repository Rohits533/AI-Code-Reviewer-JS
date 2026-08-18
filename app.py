from fastapi import FastAPI
from pydantic import BaseModel
import ast
import uvicorn
import os
import requests
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

class CodeRequest(BaseModel):
    code: str

@app.post("/analyze")
async def analyze_code(request: CodeRequest):
    code = request.code

    # --- AST Analysis ---
    try:
        tree = ast.parse(code)
    except SyntaxError as e:
        return {"error": f"Syntax Error: {e}"}

    report = {
        "unused_variables": [],
        "unused_imports": [],
        "issues_count": 0,
    }

    assigned = set()
    used = set()
    for node in ast.walk(tree):
        if isinstance(node, ast.Assign):
            for target in node.targets:
                if isinstance(target, ast.Name):
                    assigned.add(target.id)
        elif isinstance(node, ast.Name):
            if isinstance(node.ctx, ast.Load):
                used.add(node.id)
    unused_vars = assigned - used
    report["unused_variables"] = list(unused_vars)

    imported = set()
    used_names = set()
    for node in ast.walk(tree):
        if isinstance(node, ast.Import):
            for alias in node.names:
                imported.add(alias.name)
        elif isinstance(node, ast.ImportFrom):
            for alias in node.names:
                imported.add(alias.name)
        elif isinstance(node, ast.Name):
            if isinstance(node.ctx, ast.Load):
                used_names.add(node.id)
    unused_imports = imported - used_names
    report["unused_imports"] = list(unused_imports)

    report["issues_count"] = len(report["unused_variables"]) + len(report["unused_imports"])

    # --- Groq AI Review ---
    ai_review = "AI review not available (API key missing)"
    groq_api_key = os.environ.get("GROQ_API_KEY")

    if groq_api_key:
        try:
            groq_response = requests.post(
                "https://api.groq.com/openai/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {groq_api_key}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": "mixtral-8x7b-32768",  # ✅ WORKING FREE MODEL
                    "messages": [
                        {
                            "role": "system",
                            "content": "You are a senior code reviewer. Review the Python code for bugs, security issues, and improvements. Be concise and specific."
                        },
                        {
                            "role": "user",
                            "content": f"Analyze this Python code:\n\n{code}"
                        }
                    ],
                    "temperature": 0.2
                }
            )
            if groq_response.status_code == 200:
                ai_review = groq_response.json()["choices"][0]["message"]["content"]
            else:
                ai_review = f"Groq API error: {groq_response.status_code} - {groq_response.text}"
        except Exception as e:
            ai_review = f"Groq API error: {str(e)}"

    # --- Combined Response ---
    return {
        "ast_report": report,
        "ai_review": ai_review
    }

@app.get("/")
async def root():
    return {"message": "AI Code Reviewer API is running. Use POST /analyze to review code."}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=5001)
