const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 5002;

app.use(cors());
app.use(express.json());

app.post('/analyze', async (req, res) => {
    const { code } = req.body;

    if (!code) {
        return res.status(400).json({ error: 'No code provided' });
    }

    try {
        // 1. Call Python service for AST analysis
        const astResponse = await axios.post('https://ai-code-reviewer-js.onrender.com/analyze', { code });
        const astReport = astResponse.data;

        // 2. Call Groq API for AI review
        let aiReview = 'AI review not available (API key missing)';
        
        if (process.env.GROQ_API_KEY) {
            try {
                const groqResponse = await axios.post(
                    'https://api.groq.com/openai/v1/chat/completions',
                    {
                        model: 'llama3-8b-8192',
                        messages: [
                            {
                                role: 'system',
                                content: 'You are a senior code reviewer. Review the Python code for bugs, security issues, and improvements. Be concise and specific.'
                            },
                            {
                                role: 'user',
                                content: `Analyze this Python code:\n\n${code}`
                            }
                        ],
                        temperature: 0.2
                    },
                    {
                        headers: {
                            'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
                            'Content-Type': 'application/json'
                        }
                    }
                );
                aiReview = groqResponse.data.choices[0].message.content;
            } catch (groqError) {
                console.error('Groq API error:', groqError.message);
                aiReview = 'AI review failed: ' + groqError.message;
            }
        }

        res.json({
            ast_report: astReport,
            ai_review: aiReview
        });

    } catch (error) {
        console.error('Error:', error.message);
        res.status(500).json({ error: 'Failed to analyze code' });
    }
});

app.listen(PORT, () => {
    console.log(`✅ Backend running on http://localhost:${PORT}`);
});
