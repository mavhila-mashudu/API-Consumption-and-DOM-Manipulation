export default async function handler(req, res) {
    try {
        const apiKey = process.env.RESTCOUNTRIES_API_KEY;
        const headers = { Authorization: `Bearer ${apiKey}` };

        // using Promise.all to fetch all 3 pages simultaneously so it stays fast!
        const [page1, page2, page3] = await Promise.all([
            fetch("https://api.restcountries.com/countries/v5?limit=100&offset=0", { headers }),
            fetch("https://api.restcountries.com/countries/v5?limit=100&offset=100", { headers }),
            fetch("https://api.restcountries.com/countries/v5?limit=100&offset=200", { headers })
        ]);

        const data1 = await page1.json();
        const data2 = await page2.json();
        const data3 = await page3.json();

        // Stitch all the pages together into one master array
        const allCountries = [
            ...(data1.data?.objects || []),
            ...(data2.data?.objects || []),
            ...(data3.data?.objects || [])
        ];

        // Send the complete 254-country list back to script.js
        res.status(200).json({ data: { objects: allCountries } });
    } catch (error) {
        res.status(500).json({
            error: "Failed to fetch all countries"
        });
    }
}