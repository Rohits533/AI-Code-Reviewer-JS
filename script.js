document.getElementById('analyzeBtn').addEventListener('click', async () => {
    const code = document.getElementById('codeInput').value;
    const output = document.getElementById('output');

    if (!code.trim()) {
        output.textContent = '⚠️ Please paste some code to analyze.';
        return;
    }

    output.textContent = '⏳ Analyzing code...';

    try {
        // ---> THIS IS THE FIX <---
        const response = await fetch('https://ai-code-reviewer-backend.onrender.com/analyze', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ code })
        });

        const data = await response.json();

        if (response.ok) {
            output.textContent = JSON.stringify(data, null, 2);
        } else {
            output.textContent = `❌ Error: ${data.error || 'Something went wrong'}`;
        }
    } catch (error) {
        output.textContent = `❌ Network error: ${error.message}`;
    }
});
