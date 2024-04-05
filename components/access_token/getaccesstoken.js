export const get_access_token = async () =>{
    // https://api.spotify.com/v1/browse/new-releases
    const body = {
        "grant_type":"client_credentials",
        "client_id": "ee68fd6ea6bb4173b1280b4e10413505",
        "client_secret":"5fca46453288405c97b6cbd69916a63d"
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