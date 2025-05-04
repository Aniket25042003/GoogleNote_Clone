// api/server.js
// Import necessary libraries
require('dotenv').config({ path: '../.env' });
const express = require('express');
const cors = require('cors');
const path = require('path');
const fetch = require('node-fetch'); // Import fetch from node-fetch

const app = express();

// Enable CORS
app.use(cors());

// Middleware to parse JSON bodies
app.use(express.json());

// Serve static files from the "public" directory (for frontend)
app.use(express.static(path.join(__dirname, '../public')));

// Handle /api/nebius POST request
app.post('/api/nebius', async (req, res) => {
    const { type, input } = req.body;

    const headers = {
        "Authorization": `Bearer ${process.env.NEBIUS_API_KEY}`,
        "Content-Type": "application/json"
    };

    let endpoint = "";
    let payload = {};

    switch (type) {
        case "summarize":
            endpoint = "https://api.studio.nebius.ai/v1/chat/completions"; // Updated endpoint
            payload = {
                model: "meta-llama/Llama-3.2-1B-Instruct",
                messages: [
                    { role: "system", content: "Summarize the following text." },
                    { role: "user", content: input }
                ]
            };
            break;
        case "tags":
            endpoint = "https://api.studio.nebius.ai/v1/chat/completions"; // Updated endpoint
            payload = {
                model: "meta-llama/Llama-3.2-1B-Instruct",
                messages: [
                    { role: "system", content: "Suggest 3-5 relevant tags (comma-separated) for this note." },
                    { role: "user", content: input }
                ]
            };
            break;
        case "reminder":
            endpoint = "https://api.studio.nebius.ai/v1/chat/completions"; // Updated endpoint
            payload = {
                model: "meta-llama/Llama-3.2-1B-Instruct",
                messages: [
                    { role: "system", content: "Extract a reminder date and description in JSON from this text. If none, return null." },
                    { role: "user", content: input }
                ]
            };
            break;
        case "image":
            endpoint = "https://api.studio.nebius.ai/v1/images/generations"; // Correct endpoint
            payload = {
                model: "black-forest-labs/flux-schnell",
                prompt: input, // Just a plain string
                response_format: "b64_json",
                extra_body: {
                    response_extension: "png",
                    width: 1024,
                    height: 1024,
                    num_inference_steps: 28,
                    negative_prompt: "",
                    seed: -1
                }
            };
            break;
        default:
            return res.status(400).json({ error: "Unknown operation" });
    }

    try {
        console.log("Sending request to:", endpoint);
        console.log("With payload:", JSON.stringify(payload, null, 2));

        const apiRes = await fetch(endpoint, {
            method: "POST",
            headers,
            body: JSON.stringify(payload)
        });

        const text = await apiRes.text(); // Get the raw response as text
        console.log("Raw response from Nebius API:", text); // Log the raw response

        if (!apiRes.ok) {
            // If the response is not OK, log the status and return an error
            console.error(`API error: ${apiRes.status} ${apiRes.statusText}`);
            return res.status(apiRes.status).json({ error: text });
        }

        const data = JSON.parse(text); // Parse the text as JSON
        res.status(200).json(data);
    } catch (error) {
        console.error("Error fetching from Nebius API:", error);
        res.status(500).json({ error: "Error processing request" });
    }
});

// Start the server
const PORT = process.env.PORT || 5500;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});