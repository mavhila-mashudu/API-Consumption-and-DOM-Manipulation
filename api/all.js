export default async function handler(req, res) {
    try {
        const response = await fetch(
            "https://api.restcountries.com/countries/v5",
            {
                headers: {
                    Authorization: `Bearer ${process.env.RESTCOUNTRIES_API_KEY}`
                }
            }
        );

        const data = await response.json();

        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({
            error: "Failed to fetch countries"
        });
    }
}