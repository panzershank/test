const yandexRegions = require("../constants/yandex-regions")
const googleRegions = require("../constants/google-regions")

const isLatin = (text) => /[a-zA-Z]/.test(text);

const findCountry = async (request, response) => {
    try {
        const name = request.query.name;
        const system = request.query.system;
        if (!name) {
            return response.status(400).send('Необходимо указать название региона');
        }
        if (!system) {
            return response.status(400).send('Необходимо указать поисковую систему');
        }

        const regions = system.toLowerCase() === 'yandex' ? yandexRegions : googleRegions;

        const filteredCities = regions.filter(region => {
                const value = isLatin(name) ? region.region.toLowerCase() : region.name.toLowerCase()
                return value.toLowerCase().includes(name.toLowerCase())
            }
        );

        const exactMatches = filteredCities.filter(region => {
			const value = isLatin(name) ? region.region.toLowerCase() : region.name.toLowerCase()
			return   value.toLowerCase().startsWith(name.toLowerCase())
            }
        );

        const sortedSuggestions = exactMatches.length > 0 ? exactMatches : filteredCities;

        response.status(200).json({
            success: true,
            data: sortedSuggestions.sort((a, b) => isLatin(name) ? a.region.localeCompare(b.region) : a.name.localeCompare(b.name))
                .slice(0,10)
        });
    } catch (error) {
        response.status(500).send(error.message);
    }

}

module.exports = findCountry
