document.getElementById('analyzeBtn').addEventListener('click', async () => {
    const code = document.getElementById('codeInput').value;
    const output = document.getElementById('output');
    const issueCount = document.getElementById('issueCount');

    if (!code.trim()) {
        output.innerHTML = `
            <div class="placeholder">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Please paste some code to analyze.</p>
            </div>
        `;
        return;
    }

    // Show loading state
    output.innerHTML = `
        <div class="placeholder">
            <i class="fas fa-spinner fa-spin"></i>
            <p>Analyzing code...</p>
        </div>
    `;
    issueCount.textContent = '...';

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
            // Update issue count
            const ast = data.ast_report || data;
            const totalIssues = ast.issues_count || 0;
            issueCount.textContent = `${totalIssues} issues`;

            // Format AST results
            let resultText = '📊 STATIC ANALYSIS (AST)\n';
            resultText += '------------------------\n';
            resultText += `Unused Variables: ${(ast.unused_variables || []).join(', ') || 'None'}\n`;
            resultText += `Unused Imports: ${(ast.unused_imports || []).join(', ') || 'None'}\n`;
            resultText += `Total Issues: ${totalIssues}\n\n`;

            // Format AI review
            if (data.ai_review) {
                resultText += '🧠 AI REVIEW (Gemini)\n';
                resultText += '------------------------\n';
                resultText += data.ai_review;
            } else {
                resultText += '🧠 AI REVIEW (Gemini)\n';
                resultText += '------------------------\n';
                resultText += 'No AI review available.';
            }

            output.textContent = resultText;

        } else {
            output.innerHTML = `
                <div class="placeholder" style="color: #f87171;">
                    <i class="fas fa-circle-exclamation"></i>
                    <p>Error: ${data.error || 'Something went wrong'}</p>
                </div>
            `;
        }
    } catch (error) {
        output.innerHTML = `
            <div class="placeholder" style="color: #f87171;">
                <i class="fas fa-wifi"></i>
                <p>Network error: ${error.message}</p>
            </div>
        `;
    }
});
