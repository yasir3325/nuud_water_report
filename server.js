const express = require('express');
const dotenv = require('dotenv');
const path = require('path');
const { senderWaterReport } = require('./emailTemplate');

dotenv.config();

const app = express();

// Serve static files (HTML, CSS, JavaScript) from 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

app.use(express.json());
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

const fetchWaterReport = async (zipcode) => {
    try {
        const response = await fetch(`https://waterapi.ewg.org/zip_contaminant.php?zip=${zipcode}&key=abf422a7-a33f-856d-a1f1-bfa2d9b9a658`, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/90.0.4430.212 Safari/537.36',
                'Accept': 'application/json'
            }
        });

        const text = await response.text();

        if (!response.ok) {
            throw new Error(`API request failed with status ${response.status}`);
        }

        const data = JSON.parse(text);

        const checkAcid = [/* your list */];

        const matchedData = data.ContaminantList.filter(item =>
            checkAcid.some(acid => item.ContaminantName.includes(acid))
        );

        return matchedData;
    } catch (error) {
        console.error('Error fetching water report:', error.message);
        return null;
    }
};




// Route to handle form submission and send email
// testing
app.post('/send-email', async (req, res) => {
    const { name, email, zipcode } = req.body;

    const resData = await fetchWaterReport(zipcode);

    if (resData) {
        try {
            await senderWaterReport(resData, name, email, zipcode, res);

            // If senderWaterReport doesn't end the response, send a success JSON
            if (!res.headersSent) {
                res.status(200).json({ message: 'Email sent successfully' });
            }
        } catch (err) {
            console.error('Email sending error:', err);
            res.status(500).json({ error: 'Failed to send email' });
        }
    } else {
        res.status(400).json({ error: 'Invalid zip code or failed to fetch data' });
    }
});

// Start the server
app.listen(3000, () => {
    console.log('Server running on http://localhost:3000');
});
