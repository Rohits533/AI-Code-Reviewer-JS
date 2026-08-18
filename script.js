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

        if (response.ok) {
            // Format results nicely
            let resultText = '📊 STATIC ANALYSIS (AST)\n';
            resultText += '------------------------\n';
            resultText += `Unused Variables: ${data.ast_report.unused_variables.join(', ') || 'None'}\n`;
            resultText += `Unused Imports: ${data.ast_report.unused_imports.join(', ') || 'None'}\n`;
            resultText += `Total Issues: ${data.ast_report.issues_count}\n\n`;

            resultText += '🤖 AI REVIEW (Groq)\n';
            resultText += '------------------------\n';
            resultText += data.ai_review;

            output.textContent = resultText;
        } else {
            output.textContent = `❌ Error: ${data.error || 'Something went wrong'}`;
        }
    } catch (error) {
        output.textContent = `❌ Network error: ${error.message}`;
    }
});
