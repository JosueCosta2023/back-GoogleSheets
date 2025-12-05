const express = require('express');
const { google } = require('googleapis');
const cors = require('cors');
const app = express();
const port = 3001;
require("dotenv").config();
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
const path = require('path');

const credentials = {
type: process.env.TYPE,
project_id: process.env.PROJECT_ID,
private_key_id: process.env.PRIVATE_KEY_ID,
private_key: process.env.PRIVATE_KEY.replace(/\\n/g, '\n'),
client_email: process.env.CLIENT_EMAIL,
client_id: process.env.CLIENT_ID,
auth_uri: process.env.AUTH_URL,
token_uri: process.env.TOKEN_URL,
auth_provider_x509_cert_url: process.env.AUTH_PROVIDER_X509_CERT_URL,
client_x509_cert_url: process.env.CLIENT_X509_CERT_URL,
universe_domain: process.env.UNIVERSE_DOMAIN
}

app.use(express.json())

// Adicionar suporte para requisições preflight (OPTIONS)
app.options('*', (req, res) => {
    res.header('Access-Control-Allow-Origin', 'https://back-google-sheets-git-main-josues-projects-be67fa8d.vercel.app');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.sendStatus(200);
});

// Atualizar configuração de CORS para incluir a origem do Swagger UI
const allowedOrigins = [
    'http://localhost:3000', // Swagger UI local
    'https://back-google-sheets-git-main-josues-projects-be67fa8d.vercel.app', // Swagger UI em produção
    'https://editor.swagger.io' // Swagger Editor
];

app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error(`Origem não permitida: ${origin}`));
        }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true // Permitir envio de cookies e headers de autenticação
}));

// Adicionar logs detalhados para depuração de CORS
app.use((req, res, next) => {
    console.log(`Requisição recebida: ${req.method} ${req.url}`);
    console.log(`Origem: ${req.headers.origin}`);
    console.log(`Headers:`, req.headers);
    next();
});

async function getAuthSheets() {
    try {
        const auth = new google.auth.GoogleAuth({
            credentials: credentials,
            scopes : "https://www.googleapis.com/auth/spreadsheets"
        })

        const client = await auth.getClient();

        // conectando ao sheets

        const googleSheets = google.sheets({
            version: "v4",
            auth: client
        })

        const spreadsheetId = "1DHNdk3-0g6o-IxDVF_GRnYITbNhyGhLhVjHoY22n6Rs"

        return {
            auth,
            client,
            googleSheets,
            spreadsheetId
        }
        
    } catch (error) {
        console.log("Falhar ao realizar autheticação")
    }
}
// Middleware para parsing de JSON
app.use(express.json());

app.get("/metadata", async (req, res) => {
    try {
        const {googleSheets, auth, spreadsheetId} = await getAuthSheets();

        const metadata = await googleSheets.spreadsheets.get({
            auth,
            spreadsheetId
        })

        res.send(metadata.data)
        
    } catch (error) {
        console.log("Falha ao buscar metadados da planilha");
        res.send({message: "Falha so buscar metadados da planilha", error: error})
    }
})

app.get("/getRows", async (req, res) => {
    try {
     const {googleSheets, auth, spreadsheetId} = await getAuthSheets();

     const getRouws = await googleSheets.spreadsheets.values.get({
        auth,
        spreadsheetId,
        range: "bancoDeDados",
        valueRenderOption: "UNFORMATTED_VALUE",
        dateTimeRenderOption: "FORMATTED_STRING"
     })

     res.send(getRouws.data.values)

        
    } catch (error) {
        console.log("Falha ao buscar dados da planilha.")
        res.send({message: "Falha ao buscar dados da planilha.", error: error})
    }
})


app.post("/addRow", async (req, res) => {
    try {
        const {googleSheets, auth, spreadsheetId} = await getAuthSheets();

        const {values} = req.body

        const row = await googleSheets.spreadsheets.values.append({
            auth, 
            spreadsheetId,
            range: "bancoDeDados",
            valueInputOption: "USER_ENTERED",
            resource: {
                values: values,
            }
        })

        
    } catch (error) {
        console.log("Falha ao realizar novo pedido.")
        res.send({message: "Falhar ao realizar novo pedido", error: error})
    }
})

app.post("/updateValues", async (req, res)=> {
    try {
        const {googleSheets, auth, spreadsheetId} = await getAuthSheets();

        const {values} =  req.body

        const updateValue = await googleSheets.spreadsheets.values.update({
            spreadsheetId,
            range: "bancoDeDados",
            valueInputOption: "USER_ENTERED",
            resource: {
                values: values
            }

        })

        res.send(updateValue.data)
        
    } catch (error) {
        console.log("Falhar ao atualizar pedido.")
        res.send({message: "Falha ao atualizar pedido", error: error})
    }
})

// Ajustando lógica para alternar entre URL local e produção
const isProduction = process.env.NODE_ENV === 'production';
const baseUrl = isProduction ? process.env.BASE_URL : `http://localhost:${process.env.PORT || 3001}`;

console.log(`Ambiente: ${isProduction ? 'Produção' : 'Local'}`);
console.log(`URL configurada no Swagger: ${baseUrl}`);

// Configuração do Swagger
const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Google Sheets API',
            version: '1.0.0',
            description: 'API para integração com Google Sheets',
        },
        servers: [
            {
                url: baseUrl,
                description: isProduction ? 'Servidor de produção' : 'Servidor local'
            }
        ]
    },
    apis: ['./index.js'], // Caminho para os comentários das rotas
};

const swaggerDocs = swaggerJsdoc(swaggerOptions);

// Middleware para servir arquivos estáticos do Swagger
app.use('/swagger-ui', express.static(path.join(__dirname, 'node_modules/swagger-ui-dist')));

// Configuração da rota /api-docs
app.use('/api-docs', (req, res, next) => {
    console.log(`Acessando /api-docs no ambiente: ${process.env.NODE_ENV || 'development'}`);
    next();
}, swaggerUi.serve, swaggerUi.setup(swaggerDocs, { explorer: true }));

/**
 * @swagger
 * /metadata:
 *   get:
 *     summary: Retorna os metadados da planilha
 *     responses:
 *       200:
 *         description: Metadados retornados com sucesso
 *       500:
 *         description: Falha ao buscar metadados
 */

/**
 * @swagger
 * /getRows:
 *   get:
 *     summary: Retorna as linhas da planilha
 *     responses:
 *       200:
 *         description: Linhas retornadas com sucesso
 *       500:
 *         description: Falha ao buscar dados da planilha
 */


// Inicialização do servidor
app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
  console.log(`Documentação rodando em http://localhost:${port}/api-docs`);
});