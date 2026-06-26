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

const countryFields = [
    "name",
    "capital",
    "population",
    "region",
    "subregion",
    "languages",
    "currencies",
    "flags",
    "borders",
    "cca3"
].join(",");

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

function renderCountryDetails(country) {
    const capital = formatList(country.capital);
    const languages = formatList(country.languages ? Object.values(country.languages) : []);
    const currencies = formatList(
        country.currencies ? Object.values(country.currencies).map((currency) => currency.name) : []
    );
    const locationLabel = country.subregion || country.region || "its part of the world";
    
    // Safely handles both v3 (name.common) and v5 (names.common) API structures
    const countryName = country.name?.common || country.names?.common || "Unknown Name";

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
                        <span class="stat-value">${country.cca3 || "N/A"}</span>
                    </div>
                </div>
            </div>
            <div class="country-visual">
                <img class="country-flag" src="${country.flags?.svg || ""}" alt="${countryName} flag">
            </div>
        </div>
    `;
}

function createCountryButton(country, className) {
    const button = document.createElement("button");
    const name = country.name?.common || country.names?.common || "Unknown";
    
    button.type = "button";
    button.className = className;
    button.innerHTML = `
        <img src="${country.flags?.svg || ""}" alt="${name} flag">
        <strong>${name}</strong>
        <span>${country.region || "Region unavailable"}</span>
        <span>Population: ${formatPopulation(country.population)}</span>
    `;
    button.addEventListener("click", () => {
        countryInput.value = name;
        searchCountry(name);
    });
    return button;
}

async function fetchJson(url, fallbackMessage) {
    const response = await fetch(url);

    if (!response.ok) {
        throw new Error(fallbackMessage);
    }

    return response.json();
}

async function renderBorderCountries(borderCodes = []) {
    borderingCountries.innerHTML = "";
    borderPanel.classList.remove("hidden");

    if (!borderCodes.length) {
        borderingCountries.innerHTML = '<div class="empty-block">No bordering countries to display for this country.</div>';
        return;
    }

    try {
        // Note: This still hits v3.1 directly. Once you create an /api/borders backend file, update this URL to match!
        const borderData = await fetchJson(
            `https://restcountries.com/v3.1/alpha?codes=${borderCodes.join(",")}&fields=name,flags,region,population`,
            "Unable to fetch bordering countries."
        );

        borderData
            .sort((first, second) => first.name.common.localeCompare(second.name.common))
            .forEach((borderCountry) => {
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

        // Extract the array, checking multiple possible locations for the v5 API structure
        const countries = responsePayload?.data?.objects || responsePayload?.data || responsePayload;

        if (!Array.isArray(countries)) {
            throw new Error("API did not return a valid list of countries.");
        }

        const normalizedName = trimmedName.toLowerCase();
        const selectedCountry = countries.find((country) => {
            const commonName = country.name?.common || country.names?.common;
            const officialName = country.name?.official || country.names?.official;
            
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
        if (!allCountriesCache.length) {
            const responsePayload = await fetchJson(
                "/api/all",
                "Unable to load countries right now."
            );
            
            // Extract the array, checking multiple possible locations for the v5 API structure
            const countries = responsePayload?.data?.objects || responsePayload?.data || responsePayload;

            if (!Array.isArray(countries)) {
                throw new Error("API did not return a valid list of countries.");
            }

            console.log("API RESPONSE:", countries);

            // Sort safely by checking for both v3 and v5 name formats
            allCountriesCache = countries.sort((first, second) => {
                const firstName = first.name?.common || first.names?.common || "";
                const secondName = second.name?.common || second.names?.common || "";
                return firstName.localeCompare(secondName);
            });
        }

        renderAllCountries(allCountriesCache);
        allCountriesSection.classList.remove("hidden");
        toggleAllBtn.textContent = "Hide All Countries";
    } catch (error) {
        showError(`Error: ${error.message}`);
    } finally {
        setLoading(false);
    }
}

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