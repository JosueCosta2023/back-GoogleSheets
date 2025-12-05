const allowedOrigins = [
    'http://localhost:3001', // Swagger UI local
    process.env.BASE_URL,   // URL de produção
    'https://editor.swagger.io', // Swagger Editor
    'https://back-google-sheets-git-main-josues-projects-be67fa8d.vercel.app' // Swagger UI em produção
];

const corsMiddleware = (req, res, next) => {
    const origin = req.headers.origin;

    if (!origin || allowedOrigins.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin || '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        res.setHeader('Access-Control-Allow-Credentials', 'true');
        next();
    } else {
        res.status(403).send(`Origem não permitida: ${origin}`);
    }
};

module.exports = corsMiddleware;