export const get_access_token = async () =>{
    // https://api.spotify.com/v1/browse/new-releases
    const body = {
        "grant_type":"client_credentials",
        "client_id": "90cba90c8eb341ebbe2a44bc519674df",
        "client_secret":"56f90e918f974432ab355020ea7ce179"
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