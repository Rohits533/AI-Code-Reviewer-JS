from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import ast
import uvicorn
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
    try:
        tree = ast.parse(code)
    except SyntaxError as e:
        return {"error": f"Syntax Error: {e}"}

    report = {
        "unused_variables": [],
        "unused_imports": [],
        "issues_count": 0,
    }

    # --- Unused Variables ---
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

    # --- Unused Imports ---
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
    return report

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=5001)
