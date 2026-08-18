document.getElementById('analyzeBtn').addEventListener('click', async () => {
    const code = document.getElementById('codeInput').value;
    const output = document.getElementById('output');

    if (!code.trim()) {
        output.textContent = '⚠️ Please paste some code to analyze.';
        return;
    }

    output.textContent = '⏳ Analyzing code...';

    try {
        const response = await fetch('https://ai-code-reviewer-js.onrender.com/analyze', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ code })
        });

        const data = await response.json();

        // Log the response to see what we're getting
        console.log('Backend response:', data);

        if (response.ok) {
            let resultText = '📊 STATIC ANALYSIS (AST)\n';
            resultText += '------------------------\n';
            
            // Handle both possible response structures
            const ast = data.ast_report || data;
            resultText += `Unused Variables: ${(ast.unused_variables || []).join(', ') || 'None'}\n`;
            resultText += `Unused Imports: ${(ast.unused_imports || []).join(', ') || 'None'}\n`;
            resultText += `Total Issues: ${ast.issues_count || 0}\n\n`;

            if (data.ai_review) {
                resultText += '🤖 AI REVIEW (Groq)\n';
                resultText += '------------------------\n';
                resultText += data.ai_review;
            }

            output.textContent = resultText;
        } else {
            output.textContent = `❌ Error: ${data.error || JSON.stringify(data)}`;
        }
    } catch (error) {
        output.textContent = `❌ Network error: ${error.message}`;
    }
});
