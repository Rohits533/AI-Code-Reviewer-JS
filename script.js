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
        // Check if both fields exist
        const ast = data.ast_report || { unused_variables: [], unused_imports: [], issues_count: 0 };
        const ai = data.ai_review || 'No AI review available.';

        let resultText = '📊 STATIC ANALYSIS (AST)\n';
        resultText += '------------------------\n';
        resultText += `Unused Variables: ${ast.unused_variables.join(', ') || 'None'}\n`;
        resultText += `Unused Imports: ${ast.unused_imports.join(', ') || 'None'}\n`;
        resultText += `Total Issues: ${ast.issues_count}\n\n`;

        resultText += '🤖 AI REVIEW (Groq)\n';
        resultText += '------------------------\n';
        resultText += ai;

        output.textContent = resultText;
    } else {
        output.textContent = `❌ Error: ${data.error || 'Something went wrong'}`;
    }
} catch (error) {
    output.textContent = `❌ Network error: ${error.message}`;
}
