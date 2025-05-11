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
        const response = await fetch(`https://waterapi.ewg.org/zip_contaminant.php?zip=${zipcode}&key=abf422a7-a33f-856d-a1f1-bfa2d9b9a658`);

        console.log(`Status: ${response.status}`);

        const contentType = response.headers.get('content-type');
        console.log(`Content-Type: ${contentType}`);

        const text = await response.text();
        console.log('Raw response text (first 500 chars):\n', text.slice(0, 500));

        if (!response.ok) {
            throw new Error(`API request failed with status ${response.status}`);
        }

        let data;
        try {
            data = JSON.parse(text);
        } catch (err) {
            throw new Error("JSON parsing failed. Response was:\n" + text.slice(0, 500));
        }

        if (!data.ContaminantList) {
            throw new Error("ContaminantList not found in response.");
        }

        const checkAcid = [
            'Haloacetic', 'Bromochloroacetic', 'trihalomethanes', 'Dichloroacetic', 'Trichloroacetic',
            'Bromodichloromethane', 'Arsenic', 'Cadmium', 'Chromium (hexavalent)', 'Mercury (inorganic)',
            'Nitrate and nitrite', '1,4-Dioxane', 'Uranium'
        ];

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
    alert('zip_code: ');
    const resData = await fetchWaterReport(zipcode);
    if (resData) {
        await senderWaterReport(resData, name, email, zipcode, res);
    } else {
        res.status(200).setHeader('Content-Type', 'application/json').json({ message: 'Something is Wrong with this zip code please recheck!' });
    }
});

// Start the server
app.listen(3000, () => {
    console.log('Server running on http://localhost:3000');
});
