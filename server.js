const express = require("express");
const app = express();
const PORT = process.env.PORT || 3000;

// Serve classy raw-finish HTML
app.get("/", (req, res) => {
    res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <title>RS Rohit</title>
        <meta charset="UTF-8" />
        <style>
            /* Global Styles */
            body {
                margin: 0;
                height: 100vh;
                display: flex;
                justify-content: center;
                align-items: center;
                font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
                background-color: #f5f5f5;
                color: #333;
            }

            /* Card Styles */
            .card {
                background: #fff;
                border: 1px solid #ddd;
                padding: 50px 70px;
                border-radius: 12px;
                box-shadow: 0 10px 30px rgba(0,0,0,0.1);
                text-align: center;
                max-width: 500px;
            }

            h1 {
                font-size: 2.5rem;
                margin-bottom: 10px;
                font-weight: 600;
                letter-spacing: 0.5px;
            }

            h2 {
                font-weight: 400;
                font-size: 1.2rem;
                color: #666;
                margin-bottom: 20px;
            }

            p {
                font-size: 1rem;
                line-height: 1.6;
                color: #555;
            }

            .footer {
                margin-top: 25px;
                font-size: 0.85rem;
                color: #999;
            }

            /* Subtle fade-in */
            @keyframes fadeIn {
                from { opacity: 0; transform: translateY(15px); }
                to { opacity: 1; transform: translateY(0); }
            }

            .card {
                animation: fadeIn 1s ease-in-out;
            }
        </style>
    </head>
    <body>
        <div class="card">
            <h1>RS Rohit from iot b</h1>
            <h2>Minimal & Classy Web Presence</h2>
            <p>
                A refined, raw-finish design that’s clean, professional, and timeless.  
                Perfect for modern cloud apps and portfolios.
            </p>
            <div class="footer">Powered by Simplicity • Elegance • Code</div>
        </div>
    </body>
    </html>
    `);
});

// Health Check
app.get("/health", (req, res) => {
    res.json({ status: "healthy", message: "Classy raw app running successfully" });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
