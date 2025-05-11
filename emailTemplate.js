const nodemailer = require('nodemailer');
const dotenv = require('dotenv');
dotenv.config();
const PDFDocument = require('pdfkit');
const fs = require('fs');

// Ensure environment variables are set
if (!process.env.KLAVIYO_PRIVATE_API_KEY || !process.env.KLAVIYO_PUBLIC_API_KEY || !process.env.SMTP_HOST || !process.env.SMTP_PORT || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    throw new Error('Missing required environment variables. Check your .env file.');
}

// Your Klaviyo API keys
const klaviyoPrivateApiKey = process.env.KLAVIYO_PRIVATE_API_KEY;
const klaviyoPublicApiKey = process.env.KLAVIYO_PUBLIC_API_KEY;

// Klaviyo Event Tracking Function
const trackEmailEvent = async (email, Name, code) => {
    const payload = {
        token: klaviyoPublicApiKey, // Use your Public API key (Site ID)
        event: 'Water Report Sent',
        customer_properties: {
            $email: email, // Save the customer's email
            $first_name: Name, // Save the customer's name
            $zip: code // Save the customer's ZIP code
        },
        properties: {
            report_type: 'Water Quality',
            zip_code: code
        }
    };

    try {
        const response = await fetch('https://a.klaviyo.com/api/track', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (data !== 1) {
            throw new Error(`Event tracking failed. Response: ${data}`);
        }
    } catch (error) {
        console.error('Error sending event to Klaviyo:', error);
    }
};

const senderWaterReport = async (data, Name, email, code, res) => {
    try {
        // Email sending
        // Nodemailer transporter
        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT,
            secure: false, // true for 465, false for other ports
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            }
        });

        // PDF generation using pdfkit
        const doc = new PDFDocument({ size: 'A4', layout: 'landscape' });

        // Create a write stream to save PDF in memory
        const pdfBuffer = [];
        doc.on('data', chunk => pdfBuffer.push(chunk));
        doc.on('end', async () => {
            const pdfData = Buffer.concat(pdfBuffer);

            // Email HTML content (same as before)
            let htmlContent = `...`;  // Your HTML content remains the same.

            // Create the PDF content
            doc.fontSize(16).text('Water Report', { align: 'center' });
            doc.text(`Water Quality Report for ${Name} (Zip Code: ${code})`, { align: 'center' });
            
            // Loop over contaminants to add to the PDF
            data.forEach(contaminant => {
                doc.text(`Contaminant: ${contaminant.ContaminantName}`);
                doc.text(`EWG Health Guidelines: ${contaminant.ContaminantHGValue ? (contaminant.ContaminantHGValue * 1000).toFixed(3) + " ppb" : "N/A"}`);
                doc.text(`Utility Value: ${contaminant.ContaminantValue ? (contaminant.ContaminantValue * 1000).toFixed(2) + " ppb" : "N/A"}`);
                doc.text(`Exceeds Limit By: ${contaminant.ContaminantHGValue > 0 ? (contaminant.ContaminantValue / contaminant.ContaminantHGValue).toFixed(1) + "x" : "N/A"}`);
                doc.moveDown();
            });

            // Finalize the PDF file
            doc.end();

            // Send the email with the PDF attachment
            let mailOptions = {
                from: process.env.SMTP_USER,
                to: email,
                subject: `Hi ${Name}, Your Water Quality Report for Zip Code: ${code}`,
                html: htmlContent,
                attachments: [
                    {
                        filename: 'Water_Report.pdf',
                        content: pdfData,
                        contentType: 'application/pdf'
                    },
                ]
            };

            transporter.sendMail(mailOptions, async (error, info) => {
                if (error) {
                    return res.status(500).setHeader('Content-Type', 'application/json').json({ message: 'Email not sent!' });
                }

                // Track the email event in Klaviyo
                await trackEmailEvent(email, Name, code);

                return res.status(200).setHeader('Content-Type', 'application/json').json({ message: 'Check Your Email To See The Water Report!' });
            });
        });

    } catch (error) {
        console.log(error.message);
        return res.status(500).setHeader('Content-Type', 'application/json').json({ message: 'Error in email Serve' });
    }
};

module.exports = { senderWaterReport };
