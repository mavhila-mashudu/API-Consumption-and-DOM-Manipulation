const countryInput = document.getElementById('country-input');
const searchBtn = document.getElementById('search-btn');
const countryInfo = document.getElementById('country-info');
const borderingCountries = document.getElementById('bordering-countries');
const errorMessage = document.getElementById('error-message');
const spinner = document.getElementById('loading-spinner');

spinner.classList.add('hidden');

async function searchCountry(countryName) {
    countryInfo.innerHTML = '';
    borderingCountries.innerHTML = '';
    errorMessage.textContent = '';
    spinner.classList.remove('hidden');

    try {
        const response = await fetch(`https://restcountries.com/v3.1/name/${countryName}?fullText=true`);
        

        if (!response.ok) throw new Error('Country not found');

        const [country] = await response.json();

        // 1. Update main country info
        countryInfo.innerHTML = `
            <h2>${country.name.common}</h2>
            <p><strong>Capital:</strong> ${country.capital ? country.capital[0] : 'N/A'}</p>
            <p><strong>Population:</strong> ${country.population.toLocaleString()}</p>
            <p><strong>Region:</strong> ${country.region}</p>
            <img src="${country.flags.svg}" alt="${country.name.common} flag">
        `;

        // 2. Handle Borders
        if (country.borders && country.borders.length > 0) {
            borderingCountries.innerHTML = '<h3>Bordering Countries:</h3>';
            
            const borderCodes = country.borders.join(',');
            const borderRes = await fetch(`https://restcountries.com/v3.1/alpha?codes=${borderCodes}`);
            const borderData = await borderRes.json();

            borderData.forEach(border => {
                const div = document.createElement('div');
                div.innerHTML = `
                    <p>${border.name.common}</p>
                    <img src="${border.flags.svg}" width="50" alt="${border.name.common}">
                `;
                borderingCountries.appendChild(div);
            });
        } else {
            borderingCountries.innerHTML = '<p>No bordering countries (Island nation).</p>';
        }

    } catch (error) {
        errorMessage.textContent = `Error: ${error.message}`;
    } finally {
        spinner.classList.add('hidden');
    }
}

searchBtn.addEventListener('click', () => {
    const name = countryInput.value.trim();
    if (name) searchCountry(name);
});

countryInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        const name = countryInput.value.trim();
        if (name) searchCountry(name);
    }
});