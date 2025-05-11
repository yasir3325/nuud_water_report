const nodemailer = require('nodemailer');
const dotenv = require('dotenv');
dotenv.config();
const puppeteer = require('puppeteer');
const path = require('path');
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

        // Read and encode the logo image to base64
        //const logoPath = 'https://i.imgur.com/4Kh3Igu.png'
        //const logoBase64 = fs.readFileSync(logoPath, { encoding: 'base64' });

        // Email sending
        // Nodemailer transporter
        alert("entered");
        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT,
            secure: false, // true for 465, false for other ports
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            }
        });
alert(transporter.host);
        // HTML email content with placeholders for dynamic data
        let htmlContent = `
        <!DOCTYPE html>
            <html lang="en">

<head>
    <meta http-equiv="Content-Type" content="text/html charset=UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Water Report</title>
    <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;700&display=swap" rel="stylesheet">
</head>

<body style="margin:0; padding:0; background-color:#ffff; font-family:Arial, sans-serif;">

    <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" border="0"
                    style="background-color:#ffffff; margin:0 auto;">

                    <!-- Header -->
                    <tr>
                        <td align="center">
                            <img src="https://i.imgur.com/MGjHMi2.png"
                                alt="Model with NUUD" width="100%" style="display:block;">
                        </td>
                    </tr>

                    <tr>
                        <td align="center">
                            <img src="https://i.imgur.com/ErO3oXN.png"
                                alt="Model with NUUD" width="100%" style="display:block;">
                        </td>
                    </tr>

                    <tr>
                        <td align="center" bgcolor="#e5ded3"
                            style="padding: 20px;
                            font-weight: bold;
                            font-size: 33px;
                            font-family: IvyPresto Headline;
                            border-bottom: 1px dashed #6f4e37;
                            background: #ffffff;
                            font-weight: 300;">
                            Here’s whats in your shower water currently:
                        </td>
                    </tr>
        
                    <!-- Dynamic Product Block -->
                    <tr>
                        <td align="center">
                        <!-- Filtration Section -->
                        <table width="600" cellpadding="0" cellspacing="0" border="0"
                            style="width: 100%; border-collapse: collapse; background-color: #ffffff; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #333;">
                     
                            <thead>
                                <tr style="background-color: #ffffff;">
                                <th style="padding: 12px; border: 1px solid #dcd0c6; border-left: 0;border-top: 0;font-family: IvyPresto Headline;font-size: 24px; font-weight: 300;">Featured Contaminant</th>
                                <th style="padding: 12px; border: 1px solid #dcd0c6; border-top: 0; font-family: IvyPresto Headline;font-size: 24px; font-weight: 300;">EWG Health Guidelines<br>(safe level maximum)</th>
                                <th style="padding: 12px; border: 1px solid #dcd0c6; border-top: 0; font-family: IvyPresto Headline;font-size: 24px; font-weight: 300;">Utility<br>(actual levels present)</th>
                                <th style="padding: 12px; border-bottom: 1px solid #dcd0c6; font-family: IvyPresto Headline;font-size: 24px; font-weight: 300;">Exceeds Recommended Limit By</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${data && data.map((contaminant) => {
            return `
                                        <tr style="background-color:#ffffff; border-radius: 6px; height: 85px;">
                                            <td
                                                style="padding: 12px; border: 1px solid #dcd0c6; border-left: 0; font-family: Inter Tight; font-size: 24px; font-weight: 400; text-align: center;">
                                                ${contaminant.ContaminantName}</td>
                                            <td
                                                style="padding: 12px; border: 1px solid #dcd0c6; font-family: Inter Tight; font-size: 24px; font-weight: 400; text-align: center;">
                                                ${contaminant.ContaminantHGValue ? (contaminant.ContaminantHGValue * 1000).toFixed(3) + " ppb" : "N/A"}</td>
                                            <td
                                                style="padding: 12px; border: 1px solid #dcd0c6; font-family: Inter Tight; font-size: 24px; font-weight: 400; text-align: center;">
                                                ${contaminant.ContaminantValue ? (contaminant.ContaminantValue * 1000).toFixed(2) + " ppb" : "N/A"}</td>
                                            <td
                                                style="padding: 12px; border-bottom: 1px solid #dcd0c6; font-family: Inter Tight; font-size: 24px; font-weight: 400; text-align: center;">
                                                ${contaminant.ContaminantHGValue > 0
                    ? (contaminant.ContaminantValue / contaminant.ContaminantHGValue).toFixed(1) + "x"
                    : "N/A"}</td>
                                        </tr>
                                        `;
        }).join('')}
                            </tbody>    
                        </table>
                        </td>
                    </tr>

                    <tr>
                        <td align="center">
                            <img src="https://i.imgur.com/wCpq9X9.png"
                                alt="Model with NUUD" width="100%" style="display:block;">
                        </td>
                    </tr>

                    <tr>
                        <td align="center">
                            <img src="https://i.imgur.com/uLD24xZ.png"
                                alt="Model with NUUD" width="100%" style="display:block;">
                        </td>
                    </tr>


                    <!-- Footer -->
                    <tr>
                    <td align="center">
                    <table width="100%" cellpadding="0" cellspacing="0" border="0" align="center" style="background-color: #ffffff;">
                        <tr>
                        <td align="center">
                            <table width="100%" cellpadding="0" cellspacing="0" border="0">
                            <!-- HEADER -->
                            <tr>
                                <td align="center" style="padding: 30px 20px;">
                                <h2 style="margin:0;font-size:22px;color:#000000;">Give your daily routine the foundation it deserves</h2>
                                <table cellpadding="0" cellspacing="0" border="0" style="margin-top:20px;">
                                    <tr>
                                    <td align="center" bgcolor="#c89b7b" style="border-radius:30px;">
                                        <a href="https://livenuud.com/pages/try-before-you-buy" style="display:inline-block;padding:15px 30px;color:#ffffff;text-decoration:none;font-weight:bold;border-radius:30px;">TRY NUUD FREE FOR 7 DAYS</a>
                                    </td>
                                    </tr>
                                </table>
                                </td>
                            </tr>

                            <!-- BODY CONTENT -->
                            <tr>
                                <td align="center" bgcolor="#c89b7b" style="padding: 40px 20px;">
                                <img src="https://i.imgur.com/n43t2TA.png" alt="NUUD" style="margin-bottom: 20px; display:block;" width=150>
                                <p style="color: #ffffff; font-size:24px; margin:20px 0;font-family: 
                    IvyPresto Headline">A Better You Starts With Better Water</p>

                                <!-- SOCIAL ICONS -->
                                <table cellpadding="0" cellspacing="0" border="0" align="center" style="margin:20px 0;">
                                    <tr>
                                    <td align="center">
                                        <a href="https://www.facebook.com/livenuud"><img src="https://cdn.shopify.com/s/files/1/0732/1537/7700/files/1000064113.png?v=1746818353" alt="Facebook" width="30" style="margin:0 5px;"></a>
                                        <a href="https://www.instagram.com/livenuud/"><img src="https://cdn.shopify.com/s/files/1/0732/1537/7700/files/1000064112.png?v=1746818353" alt="Instagram" width="30" style="margin:0 5px;"></a>
                                        <a href="https://www.tiktok.com/@livenuud"><img src="https://cdn.shopify.com/s/files/1/0732/1537/7700/files/1000064114.png?v=1746818353" alt="TikTok" width="30" style="margin:0 5px;"></a>
                                    </td>
                                    </tr>
                                </table>

                                <!-- LINKS -->
                                <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-top:30px;">
                                    <tr>
                                    <td align="center" style="padding:18px 0; border-bottom: 1px dashed #ffff; border-top: 1px dashed #ffff">
                                        <a href="https://livenuud.com/products/nuud-filtered-showerhead-1?variant=50506319855908" style="color:#ffffff; text-decoration:none; font-size:24px; font-weight:bold; font-family:
                    IvyPresto Headline">Our Showerheads</a>
                                    </td>
                                    </tr>
                                    <tr>
                                    <td align="center" style="padding:18px 0; border-bottom: 1px dashed #ffff">
                                        <a href="https://livenuud.com/pages/about-us" style="color:#ffffff; text-decoration:none; font-size:24px; font-weight:bold; font-family:
                    IvyPresto Headline">About Us</a>
                                    </td>
                                    </tr>
                                    <tr>
                                    <td align="center" style="padding:18px 0;border-bottom: 1px dashed #ffff">
                                        <a href="https://livenuud.com/pages/contact-us" style="color:#ffffff; text-decoration:none; font-size:24px; font-weight:bold; font-family:
                    IvyPresto Headline">Contact Us</a>
                                    </td>
                                    </tr>
                                </table>

                                <!-- FOOTER -->
                                <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-top:20px;">
                                    <tr>
                                    <td align="center" style="font-size:12px; color:#dddddd; padding-top:20px;">
                                        <p style="margin:5px 0;">No longer want to receive these emails? 
                                        <a href="#" style="color:#ffffff;text-decoration:underline;">Unsubscribe</a> or 
                                        <a href="#" style="color:#ffffff;text-decoration:underline;">Manage Preferences</a>
                                        </p>
                                        <p style="margin:5px 0;"><a href="https://livenuud.com/products/nuud-filtered-showerhead-1?variant=50506319855908" style="color:#ffffff;text-decoration:underline;">Shop Now</a></p>
                                    </td>
                                    </tr>
                                </table>

                                </td>
                            </tr>

                            </table>
                        </td>
                        </tr>
                    </table>
                    </td>
                    </tr>

                </table>
            </td>
        </tr>
    </table>

</body>

</html>
            `;
        // Replace the logo URL in PDF HTML content with the base64 version
        let pdfHtmlContent = htmlContent;

        //generate pdf with puppeteer
        const browser = await puppeteer.launch({
            headless: false,
        });
        const page = await browser.newPage();
        await page.setContent(pdfHtmlContent);
        const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true, landscape: true, });
        await browser.close();

        let mailOptions = {
            from: process.env.SMTP_USER,
            to: email,
            subject: `Hi ${Name}, Your Water Quality Report for Zip Code: ${code}`,
            html: htmlContent,
            attachments: [
                {
                    filename: 'Water_Report.pdf',
                    content: pdfBuffer,
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
    } catch (error) {
        console.log(error.message);
        return res.status(500).setHeader('Content-Type', 'application/json').json({ message: 'Error in email Serve' });
    }
}

module.exports = { senderWaterReport };