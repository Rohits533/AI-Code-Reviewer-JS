import os
import ast
import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import google.generativeai as genai

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

class CodeRequest(BaseModel):
    code: str

def get_gemini_review(code: str):
    """Calls Gemini API for AI code review."""
    api_key = os.environ.get("GOOGLE_API_KEY")
    if not api_key:
        return "AI review not available (GOOGLE_API_KEY missing)"
    try:
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel("gemini-2.5-flash")
        
        prompt = f"""You are a senior code reviewer. Review the Python code for bugs, security issues, and improvements. Be concise and specific.

Analyze this Python code:
```python
{code}
```"""
        response = model.generate_content(prompt)
        return response.text
    except Exception as e:
        return f"Gemini API error: {str(e)}"

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
    
    # --- AI Review (Gemini) ---
    ai_review = get_gemini_review(code)
    
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
