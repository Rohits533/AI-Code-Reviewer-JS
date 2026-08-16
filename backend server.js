const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
const PORT = 5002;

app.use(cors());
app.use(express.json());

app.post('/analyze', async (req, res) => {
    const { code } = req.body;

    if (!code) {
        return res.status(400).json({ error: 'No code provided' });
    }

    try {
        const response = await axios.post('http://localhost:5001/analyze', { code });
        res.json(response.data);
    } catch (error) {
        console.error('Error calling Python service:', error.message);
        res.status(500).json({ error: 'Failed to analyze code' });
    }
});

app.listen(PORT, () => {
    console.log(`✅ Backend running on http://localhost:${PORT}`);
});
