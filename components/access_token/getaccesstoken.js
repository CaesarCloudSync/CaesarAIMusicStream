export const get_access_token = async () =>{
    // https://api.spotify.com/v1/browse/new-releases
    const body = {
        "grant_type":"client_credentials",
        "client_id": "2148de389e8d4828999b6980ef96357f",
        "client_secret":"a0c3351d0d6b434583c5bd653166004e"
    }
    const formBody = Object.keys(body).map(key =>      encodeURIComponent(key) + '=' + encodeURIComponent(body[key])).join('&');
    const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers:{
            'Content-Type': 'application/x-www-form-urlencoded'
        },    
        body: formBody
    });
    const result = await response.json()
    return result.access_token
}