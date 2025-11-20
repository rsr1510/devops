const express = require("express");

const app = express();
const PORT = process.env.PORT || 3000;

// Serve modern sleek inline-CSS HTML
app.get("/", (req, res) => {
    res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <title>Raghav's App</title>
        <meta charset="UTF-8" />
        <style>
            body {
                margin: 0;
                height: 100vh;
                background: #000;
                font-family: 'Segoe UI', Arial, sans-serif;
                display: flex;
                justify-content: center;
                align-items: center;
                color: #fff;
                overflow: hidden;
            }

            .card {
                background: rgba(255,255,255,0.05);
                border: 1px solid rgba(255,255,255,0.1);
                padding: 40px 60px;
                border-radius: 16px;
                backdrop-filter: blur(12px);
                box-shadow: 0 0 25px rgba(0, 140, 255, 0.2);
                text-align: center;
                animation: fadeIn 1.2s ease-in-out;
            }

            h1 {
                font-size: 2.8rem;
                margin-bottom: 10px;
                color: #0abaff;
                letter-spacing: 1px;
            }

            h2 {
                font-weight: 300;
                font-size: 1.3rem;
                color: #ddd;
                margin-bottom: 25px;
            }

            p {
                color: #aaa;
                font-size: 1rem;
                line-height: 1.6rem;
            }

            @keyframes fadeIn {
                from { opacity: 0; transform: translateY(20px); }
                to   { opacity: 1; transform: translateY(0); }
            }

            .glow {
                text-shadow: 0 0 8px #0abaff, 0 0 25px #0abaff;
            }

            .footer {
                margin-top: 25px;
                font-size: 0.9rem;
                color: #666;
            }
        </style>
    </head>

    <body>
        <div class="card">
            <h1 class="glow">Welcome to Raghav's Cloud App</h1>
            <h2> CI/CD Deployment Successful</h2>
            <p>
                Your application is now live on AWS.<br>
                Delivered through a modern, sleek, production-grade pipeline.
            </p>
            <div class="footer">Powered by AWS • Jenkins • Docker • ECR • ECS</div>
        </div>
    </body>
    </html>
    `);
});

// Health Check
app.get("/health", (req, res) => {
    res.json({ status: "healthy", message: "Modern app running successfully" });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
