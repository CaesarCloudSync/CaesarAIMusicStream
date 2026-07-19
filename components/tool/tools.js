export const convertToValidFilename = (string) =>{
    return (string.replace(/[\/|\\:*?"#<>]/g, " "));
}

export const fetchAllPlaylistItems = async (initialTracksObj, headers) => {
    let items = initialTracksObj?.items || [];
    let nextUrl = initialTracksObj?.next;
    while (nextUrl) {
        try {
            const resp = await fetch(nextUrl, { headers });
            const data = await resp.json();
            if (data && data.items && data.items.length > 0) {
                items = items.concat(data.items);
            }
            nextUrl = data ? data.next : null;
        } catch (e) {
            console.error("Error fetching next page of playlist tracks:", e);
            break;
        }
    }
    return items;
};