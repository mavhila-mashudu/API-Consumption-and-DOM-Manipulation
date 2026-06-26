# Country Explorer

Country Explorer is a responsive web application that allows users to search for countries, view detailed geopolitical data, and explore bordering nations. 

This project utilizes a serverless backend architecture to decouple client-side rendering from third-party API communication, ensuring API keys remain secure and out of the browser.

## Features

* **Granular Data Search:** Query specific countries to dynamically render critical data points, including population, subregion, capitals, spoken languages, and national currencies.
* **Relational Border Mapping:** Automatically computes and displays interactive links to all neighboring countries sharing a land border with the selected nation.
* **Global Directory:** A centralized, cached view to browse the complete global directory of nations.
* **Resilient UI/UX:** Built with CSS glassmorphism styling, loading states, and comprehensive error handling for empty queries or network failures.

## Architecture & Security

To ensure maintainability and adhere to security best practices, this project utilizes a Serverless Backend Architecture hosted on Vercel.

* **Secure Credential Management:** The REST Countries v5 API requires authentication. The API key is securely stored as a Server Environment Variable (`RESTCOUNTRIES_API_KEY`) within Vercel, completely isolated from the frontend.
* **Separation of Concerns:** The codebase strictly separates UI logic from data-fetching logic. The frontend (`script.js`) handles DOM manipulation, while the backend handles data retrieval.
* **Serverless API Routing:** Frontend fetches are routed to custom internal endpoints (`/api/country` and `/api/all`). Node.js serverless functions process these requests, append the secure `Authorization: Bearer` headers, and negotiate with the external REST Countries API.
