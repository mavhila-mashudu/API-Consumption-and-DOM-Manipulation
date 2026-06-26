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
// SAFE EXTRACTION HELPERS (Handles both v3 and v5 APIs)
// --------------------------------------------------------

function getCountryName(country) {
    return country.name?.common || country.names?.common || "Unknown Name";
}

function getCountryFlag(country) {
    if (typeof country.flags === 'string') return country.flags;
    if (typeof country.flag === 'string') return country.flag;
    return country.flag?.svg || country.flag?.image || country.flags?.svg || country.flags?.png || country.assets?.flag || "";
}

async function fetchJson(url, fallbackMessage) {
    const response = await fetch(url);
    if (!response.ok) throw new Error(fallbackMessage);
    return response.json();
}

// Centralized cache fetcher: we hit the backend once and reuse the data
async function getAllCountriesData() {
    if (allCountriesCache.length) return allCountriesCache;
    
    const responsePayload = await fetchJson("/api/all", "Unable to load countries right now.");
    
    //  DEBUG LOG 1: See exactly what the /api/all endpoint returns
    console.log(" DEBUG [getAllCountriesData]: Raw API Response ->", responsePayload);

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
    let capArray = [];
    if (Array.isArray(country.capitals)) {
        capArray = country.capitals.map(c => typeof c === 'object' ? (c.name || "") : c);
    } else if (Array.isArray(country.capital)) {
        capArray = country.capital.map(c => typeof c === 'object' ? (c.name || "") : c);
    } else if (typeof country.capital === 'string') {
        capArray = [country.capital];
    }
    const capital = formatList(capArray.filter(Boolean));

    let langArray = [];
    if (Array.isArray(country.languages)) {
        langArray = country.languages.map(l => typeof l === 'object' ? (l.name || "") : l);
    } else if (country.languages && typeof country.languages === 'object') {
        langArray = Object.values(country.languages).map(l => typeof l === 'object' ? (l.name || l) : l);
    }
    const languages = formatList(langArray.filter(Boolean));

    let currArray = [];
    if (Array.isArray(country.currencies)) {
        currArray = country.currencies.map(c => typeof c === 'object' ? (c.name || "") : c);
    } else if (country.currencies && typeof country.currencies === 'object') {
        currArray = Object.values(country.currencies).map(c => typeof c === 'object' ? (c.name || c) : c);
    }
    const currencies = formatList(currArray.filter(Boolean));

    const locationLabel = country.subregion || country.region || "its part of the world";
    const countryName = getCountryName(country);
    const flagUrl = getCountryFlag(country);
    
    const countryCode = country.codes?.alpha_3 || country.cca3 || "N/A";

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
            const code = c.codes?.alpha_3 || c.cca3;
            return borderCodes.includes(code);
        });

        //  DEBUG LOG 2: A clean table view of the bordering countries array!
        console.log(" DEBUG [renderBorderCountries]: Bordering Countries Array ->");
        console.table(borderData);

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

        //  DEBUG LOG 3: See exactly what the /api/country endpoint returns
        console.log(` DEBUG [searchCountry - ${trimmedName}]: Raw API Response ->`, responsePayload);

        const countries = responsePayload?.data?.objects || responsePayload?.data || responsePayload;

        if (!Array.isArray(countries)) {
            throw new Error("API did not return a valid list of countries.");
        }

        const normalizedName = trimmedName.toLowerCase();
        const selectedCountry = countries.find((country) => {
            const commonName = country.name?.common || country.names?.common || "";
            const officialName = country.name?.official || country.names?.official || "";
            
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