const convertTaskToRow = (task, queryId) => {
    if (!task.snippets) {
        return [];
    }

    const snippets = Object.entries(task.snippets);

    const result = snippets.map((snippet)=> {
        const urlWithoutProtocol = snippet[0].split('//')[1];
        const host = urlWithoutProtocol.slice(0, urlWithoutProtocol.indexOf('/'));

        const snippetData = Array.isArray(snippet[1]) ? snippet[1][0]
            : Object.values(snippet[1])[0];

        return {
            searchingQuery: queryId.toString(),
            host: host,
            url: snippet[0],
            scale: "-",
            rating: "-",
            header: snippetData.title || "-",
            description: snippetData.snippet || "-",
            tonality: 'neutral',
        };
    });

    return result;
};

module.exports = convertTaskToRow;
