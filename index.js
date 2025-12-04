const express = require('express');
const { google } = require('googleapis');
const app = express();
const port = 3001;
require("dotenv").config();

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


// Inicialização do servidor
app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});