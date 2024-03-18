const fs = require('fs').promises;
const express = require('express');
const dotenv = require('dotenv');
dotenv.config();

const nodemailer = require('nodemailer');
const { checkMail } = require('./lib/checkmail');
const { v4: uuidv4 } = require('uuid');
const { google } = require('googleapis');
const { errorMonitor } = require('nodemailer/lib/xoauth2');

const app = express();
const port = 7001;

// Server ON
app.listen(port, () => {
    console.log(`server runs on http://localhost:${port}`);
})

// Middlewares
app.use(express.static('public'));
app.use(express.json());

// POST Body Daten einlesen (x-www-form-urlencoded)
app.use(express.urlencoded({ extended: false }));

// Google API vars. & AccessToken Generator
const CLIENT_ID = process.env.CLIENT_ID; // env var
const CLIENT_SECRET = process.env.CLIENT_SECRET; // env var
const REDIRECT_URL = 'https://developers.google.com/oauthplayground';
const REFRESH_TOKEN = process.env.REFRESH_TOKEN; // env var

const accessTokenGen = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URL);
accessTokenGen.setCredentials({ refresh_token: REFRESH_TOKEN });

// Erstellung neue userID
const userID = uuidv4();

// Nodemailer
const sendEmail = async function (email) {
    try {
        const accessToken = await accessTokenGen.getAccessToken();
        const transport = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                type: 'OAuth2',
                user: 'pixogram.eu@gmail.com',
                clientId: CLIENT_ID,
                clientSecret: CLIENT_SECRET,
                refreshToken: REFRESH_TOKEN,
                accessToken: accessToken
            }
        })

        const emailData = {
            from: 'Admin <pixogram.eu@gmail.com>',
            to: email,
            subject: 'Anmeldebestätigung - Test',
            text: 'Glückwunsch! Du hast den Newsletter erfolgreich abonniert.',
        };

        const result = await transport.sendMail(emailData);
        return result;
    }
    catch (error) {
        return error;
    }
}

// Speichern in CSV-Datei
const saveCSV = async function (userID, email) {
    try {
        const csvData = await fs.readFile('data/data.csv', 'utf8');

        const newCSV = `${userID};${email}\n`;

        await fs.appendFile('data/data.csv', newCSV);

        console.log('CSV-Datei wurde erfolgreich gespeichert');
    } catch (error) {
        console.error('Fehler beim Speichern in CSV:', error);
    }
}

// Speichern in JSON-Datei
const saveJSON = async function (userID, email) {
    try {
        let jsonData = JSON.parse(await fs.readFile('data/data.json'));
        let newJSON = {
            id: userID,
            email: email
        };
        jsonData.push(newJSON);
        await fs.writeFile('data/data.json', JSON.stringify(jsonData, null, "\t"));
        console.log('JSON-Datei wurde erfolgreich gespeichert');
    } catch (error) {
        console.error('Fehler beim Speichern in JSON:', error);
    }
}

// POST Handler für Email
app.post('/newsletter', (req, res) => {
    console.log(req.body);

    const email = req.body.email;

    checkMail(email)
        .then(() => {
            console.log('Email wurde überprüft');
            res.end('{"check": true}');
            return sendEmail(email);
        })
        .then((result) => {
            console.log('Email wurde erfolgreich gesendet', result);
            saveCSV(userID, email);
            saveJSON(userID, email);
        })
        .catch(() => {
            console.log('Email ist ungültig!');
            res.end('{"check": false }');
        });
})

// GET Handler für Bestätigung-Seite
app.get('/bestaetigung', (req, res) => {
    res.sendFile(__dirname + '/public/bestaetigung.html');
})