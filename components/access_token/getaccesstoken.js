export const get_access_token = async () =>{
    // https://api.spotify.com/v1/browse/new-releases
    const body = {
        "grant_type":"client_credentials",
        "client_id": "ca6fecf0a3d94887846407a558fd2282",
        "client_secret":"1e721eca1a254a3a96c999f9b71d65f5"
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