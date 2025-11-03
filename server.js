const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Pipeline Success - Rohit</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: hidden;
            position: relative;
        }

        .particle {
            position: absolute;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 50%;
            animation: float 20s infinite;
        }

        @keyframes float {
            0%, 100% {
                transform: translateY(0) translateX(0) scale(1);
                opacity: 0.3;
            }
            25% {
                transform: translateY(-100px) translateX(50px) scale(1.2);
                opacity: 0.6;
            }
            50% {
                transform: translateY(-200px) translateX(-50px) scale(0.8);
                opacity: 0.4;
            }
            75% {
                transform: translateY(-100px) translateX(-100px) scale(1.1);
                opacity: 0.5;
            }
        }

        .container {
            position: relative;
            z-index: 10;
            max-width: 600px;
            width: 90%;
            padding: 60px 50px;
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(20px);
            border-radius: 30px;
            border: 1px solid rgba(255, 255, 255, 0.2);
            box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37);
            animation: slideIn 0.8s ease-out;
        }

        @keyframes slideIn {
            from {
                opacity: 0;
                transform: translateY(30px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        .checkmark {
            width: 80px;
            height: 80px;
            margin: 0 auto 30px;
            position: relative;
            animation: scaleIn 0.6s ease-out 0.3s both;
        }

        @keyframes scaleIn {
            from {
                transform: scale(0);
            }
            to {
                transform: scale(1);
            }
        }

        .checkmark-circle {
            stroke-dasharray: 166;
            stroke-dashoffset: 166;
            stroke-width: 3;
            stroke: #4ade80;
            fill: none;
            animation: stroke 0.6s cubic-bezier(0.65, 0, 0.45, 1) forwards;
        }

        .checkmark-check {
            transform-origin: 50% 50%;
            stroke-dasharray: 48;
            stroke-dashoffset: 48;
            stroke: #4ade80;
            stroke-width: 3;
            fill: none;
            animation: stroke 0.3s cubic-bezier(0.65, 0, 0.45, 1) 0.6s forwards;
        }

        @keyframes stroke {
            100% {
                stroke-dashoffset: 0;
            }
        }

        h1 {
            color: white;
            font-size: 2.5rem;
            font-weight: 700;
            text-align: center;
            margin-bottom: 15px;
            text-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
            animation: fadeInUp 0.8s ease-out 0.4s both;
        }

        .subtitle {
            color: rgba(255, 255, 255, 0.9);
            font-size: 1.3rem;
            text-align: center;
            margin-bottom: 40px;
            animation: fadeInUp 0.8s ease-out 0.5s both;
        }

        @keyframes fadeInUp {
            from {
                opacity: 0;
                transform: translateY(20px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        .info-grid {
            display: grid;
            gap: 20px;
            margin-top: 40px;
        }

        .info-card {
            background: rgba(255, 255, 255, 0.15);
            backdrop-filter: blur(10px);
            border-radius: 15px;
            padding: 20px;
            border: 1px solid rgba(255, 255, 255, 0.2);
            transition: all 0.3s ease;
            animation: fadeInUp 0.8s ease-out both;
        }

        .info-card:nth-child(1) { animation-delay: 0.6s; }
        .info-card:nth-child(2) { animation-delay: 0.7s; }
        .info-card:nth-child(3) { animation-delay: 0.8s; }

        .info-card:hover {
            transform: translateY(-5px);
            background: rgba(255, 255, 255, 0.2);
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
        }

        .info-label {
            color: rgba(255, 255, 255, 0.7);
            font-size: 0.9rem;
            margin-bottom: 8px;
            text-transform: uppercase;
            letter-spacing: 1px;
            font-weight: 600;
        }

        .info-value {
            color: white;
            font-size: 1.1rem;
            font-weight: 500;
            word-break: break-all;
        }

        .pulse {
            width: 12px;
            height: 12px;
            background: #4ade80;
            border-radius: 50%;
            display: inline-block;
            margin-right: 8px;
            animation: pulse 2s infinite;
        }

        @keyframes pulse {
            0%, 100% {
                opacity: 1;
                transform: scale(1);
            }
            50% {
                opacity: 0.5;
                transform: scale(1.2);
            }
        }

        .status-badge {
            display: inline-flex;
            align-items: center;
            background: rgba(74, 222, 128, 0.2);
            color: #4ade80;
            padding: 8px 16px;
            border-radius: 20px;
            font-weight: 600;
            border: 1px solid rgba(74, 222, 128, 0.3);
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="checkmark">
            <svg viewBox="0 0 52 52">
                <circle class="checkmark-circle" cx="26" cy="26" r="25" fill="none"/>
                <path class="checkmark-check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/>
            </svg>
        </div>

        <h1>Hello from Rohit! 👋</h1>
        <p class="subtitle">
            <span class="status-badge">
                <span class="pulse"></span>
                Pipeline Succeeded
            </span>
        </p>

        <div class="info-grid">
            <div class="info-card">
                <div class="info-label">Version</div>
                <div class="info-value">1.0.0</div>
            </div>

            <div class="info-card">
                <div class="info-label">Timestamp</div>
                <div class="info-value">${new Date().toISOString()}</div>
            </div>

            <div class="info-card">
                <div class="info-label">Server Status</div>
                <div class="info-value">Running on Port ${PORT}</div>
            </div>
        </div>
    </div>

    <script>
        // Create animated background particles
        function createParticles() {
            const particleCount = 15;
            for (let i = 0; i < particleCount; i++) {
                const particle = document.createElement('div');
                particle.className = 'particle';
                const size = Math.random() * 100 + 50;
                particle.style.width = size + 'px';
                particle.style.height = size + 'px';
                particle.style.left = Math.random() * 100 + '%';
                particle.style.top = Math.random() * 100 + '%';
                particle.style.animationDelay = Math.random() * 20 + 's';
                particle.style.animationDuration = (Math.random() * 10 + 15) + 's';
                document.body.appendChild(particle);
            }
        }
        createParticles();
    </script>
</body>
</html>
  `);
});

app.get('/health', (req, res) => {
  res.json({ status: 'healthy' });
});

const server = app.listen(PORT, () => {
  console.log(Server running on port ${PORT});
});

module.exports = server;
