const countryInput = document.getElementById("country-input");
const searchBtn = document.getElementById("search-btn");
const toggleAllBtn = document.getElementById("toggle-all-btn");
const countryInfo = document.getElementById("country-info");
const borderPanel = document.getElementById("border-panel");
const borderingCountries = document.getElementById("bordering-countries");
const allCountriesSection = document.getElementById("all-countries-section");
const allCountriesGrid = document.getElementById("all-countries-grid");
const errorMessage = document.getElementById("error-message");
const spinner = document.getElementById("loading-spinner");

let allCountriesCache = [];

function setLoading(isLoading) {
    spinner.classList.toggle("hidden", !isLoading);
    searchBtn.disabled = isLoading;
    toggleAllBtn.disabled = isLoading;
}

function showError(message = "") {
    errorMessage.textContent = message;
    errorMessage.classList.toggle("hidden", !message);
}

function setEmptyState(message) {
    countryInfo.className = "country-card empty-state";
    countryInfo.innerHTML = `<p>${message}</p>`;
}

function formatPopulation(population) {
    return population ? population.toLocaleString() : "N/A";
}

function formatList(values) {
    return values && values.length ? values.join(", ") : "N/A";
}

// --------------------------------------------------------
// SAFE EXTRACTION HELPERS (Tailored for v5 JSON structure)
// --------------------------------------------------------

function getCountryName(country) {
    // Looks exactly where your JSON showed us: names.common
    return country.names?.common || country.name?.common || "Unknown Name";
}

function getCountryFlag(country) {
    // Looks exactly where your JSON showed us: flag.url_svg
    return country.flag?.url_svg || country.flag?.url_png || country.flags?.svg || "";
}

function getCountryCode(country) {
    // Looks exactly where your JSON showed us: codes.alpha_3
    return country.codes?.alpha_3 || country.cca3 || "";
}

// Helper to safely extract names from arrays of objects (like v5 languages/currencies)
function extractNames(arr) {
    if (!Array.isArray(arr)) {
        if (typeof arr === 'object' && arr !== null) {
            return Object.values(arr).map(item => typeof item === 'object' ? item.name : item);
        }
        return [];
    }
    return arr.map(item => typeof item === 'object' ? item.name : item).filter(Boolean);
}

async function fetchJson(url, fallbackMessage) {
    const response = await fetch(url);
    if (!response.ok) throw new Error(fallbackMessage);
    return response.json();
}

// Centralized cache fetcher
async function getAllCountriesData() {
    if (allCountriesCache.length) return allCountriesCache;
    
    const responsePayload = await fetchJson("/api/all", "Unable to load countries right now.");
    const countries = responsePayload?.data?.objects || responsePayload?.data || responsePayload;

    if (!Array.isArray(countries)) {
        throw new Error("API did not return a valid list of countries.");
    }

    allCountriesCache = countries.sort((first, second) => {
        const firstName = getCountryName(first);
        const secondName = getCountryName(second);
        return firstName.localeCompare(secondName);
    });

    return allCountriesCache;
}

// --------------------------------------------------------
// RENDERING FUNCTIONS
// --------------------------------------------------------

function renderCountryDetails(country) {
    const capital = formatList(extractNames(country.capitals || country.capital));
    const languages = formatList(extractNames(country.languages));
    const currencies = formatList(extractNames(country.currencies));

    const locationLabel = country.subregion || country.region || "its part of the world";
    const countryName = getCountryName(country);
    const flagUrl = getCountryFlag(country);
    const countryCode = getCountryCode(country) || "N/A";

    countryInfo.className = "country-card";
    countryInfo.innerHTML = `
        <div class="country-layout">
            <div class="country-copy">
                <span class="country-chip">${country.region || "Unknown Region"}</span>
                <h2>${countryName}</h2>
                <p class="country-summary">
                    ${countryName} is located in ${locationLabel}, with ${formatPopulation(country.population)} people and a capital city of ${capital}.
                </p>
                <div class="stat-grid">
                    <div class="stat-card">
                        <span class="stat-label">Capital</span>
                        <span class="stat-value">${capital}</span>
                    </div>
                    <div class="stat-card">
                        <span class="stat-label">Population</span>
                        <span class="stat-value">${formatPopulation(country.population)}</span>
                    </div>
                    <div class="stat-card">
                        <span class="stat-label">Subregion</span>
                        <span class="stat-value">${country.subregion || "N/A"}</span>
                    </div>
                    <div class="stat-card">
                        <span class="stat-label">Languages</span>
                        <span class="stat-value">${languages}</span>
                    </div>
                    <div class="stat-card">
                        <span class="stat-label">Currencies</span>
                        <span class="stat-value">${currencies}</span>
                    </div>
                    <div class="stat-card">
                        <span class="stat-label">Country Code</span>
                        <span class="stat-value">${countryCode}</span>
                    </div>
                </div>
            </div>
            <div class="country-visual">
                <img class="country-flag" src="${flagUrl}" alt="${countryName} flag">
            </div>
        </div>
    `;
}

function createCountryButton(country, className) {
    const button = document.createElement("button");
    const name = getCountryName(country);
    const flagUrl = getCountryFlag(country);
    
    button.type = "button";
    button.className = className;
    button.innerHTML = `
        <img src="${flagUrl}" alt="${name} flag">
        <strong>${name}</strong>
        <span>${country.region || "Region unavailable"}</span>
        <span>Population: ${formatPopulation(country.population)}</span>
    `;
    button.addEventListener("click", () => {
        countryInput.value = name;
        searchCountry(name);
        window.scrollTo({ top: 0, behavior: 'smooth' }); // Bonus: Scrolls up when clicked!
    });
    return button;
}

// --------------------------------------------------------
// CORE LOGIC FUNCTIONS
// --------------------------------------------------------

async function renderBorderCountries(borderCodes = []) {
    borderingCountries.innerHTML = "";
    borderPanel.classList.remove("hidden");

    if (!borderCodes.length) {
        borderingCountries.innerHTML = '<div class="empty-block">No bordering countries to display for this country.</div>';
        return;
    }

    try {
        const allCountries = await getAllCountriesData();

        const borderData = allCountries.filter(c => {
            const code = getCountryCode(c);
            return borderCodes.includes(code);
        });

        if (!borderData.length) {
            borderingCountries.innerHTML = '<div class="empty-block">No specific border details found.</div>';
            return;
        }

        borderData.forEach((borderCountry) => {
            borderingCountries.appendChild(createCountryButton(borderCountry, "country-link"));
        });
    } catch (error) {
        borderingCountries.innerHTML = '<div class="empty-block">Bordering countries could not be loaded right now.</div>';
        showError(`Error: ${error.message}`);
    }
}

async function searchCountry(countryName) {
    const trimmedName = countryName.trim();

    if (!trimmedName) {
        showError("Enter a country name to begin.");
        return;
    }

    showError("");
    setLoading(true);

    try {
        const responsePayload = await fetchJson(
            `/api/country?name=${encodeURIComponent(trimmedName)}`,
            "Country not found."
        );

        const countries = responsePayload?.data?.objects || responsePayload?.data || responsePayload;

        if (!Array.isArray(countries)) {
            throw new Error("API did not return a valid list of countries.");
        }

        const normalizedName = trimmedName.toLowerCase();
        const selectedCountry = countries.find((country) => {
            const commonName = country.names?.common || country.name?.common || "";
            const officialName = country.names?.official || country.name?.official || "";
            
            return [commonName, officialName]
                .filter(Boolean)
                .some((n) => n.toLowerCase() === normalizedName);
        }) || countries[0];

        renderCountryDetails(selectedCountry);
        await renderBorderCountries(selectedCountry.borders || []);
    } catch (error) {
        setEmptyState("Search for a country to see its details here.");
        borderPanel.classList.add("hidden");
        borderingCountries.innerHTML = "";
        showError(`Error: ${error.message}`);
    } finally {
        setLoading(false);
    }
}

function renderAllCountries(countries) {
    allCountriesGrid.innerHTML = "";
    countries.forEach((country) => {
        allCountriesGrid.appendChild(createCountryButton(country, "country-tile"));
    });
}

async function toggleAllCountries() {
    const isHidden = allCountriesSection.classList.contains("hidden");

    if (!isHidden) {
        allCountriesSection.classList.add("hidden");
        toggleAllBtn.textContent = "Show All Countries";
        return;
    }

    showError("");
    setLoading(true);

    try {
        const countries = await getAllCountriesData();
        renderAllCountries(countries);
        allCountriesSection.classList.remove("hidden");
        toggleAllBtn.textContent = "Hide All Countries";
    } catch (error) {
        showError(`Error: ${error.message}`);
    } finally {
        setLoading(false);
    }
}

// --------------------------------------------------------
// EVENT LISTENERS
// --------------------------------------------------------

searchBtn.addEventListener("click", () => {
    searchCountry(countryInput.value);
});

toggleAllBtn.addEventListener("click", () => {
    toggleAllCountries();
});

countryInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
        searchCountry(countryInput.value);
    }
});