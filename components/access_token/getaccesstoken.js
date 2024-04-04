export const get_access_token = async () =>{
    // https://api.spotify.com/v1/browse/new-releases
    const body = {
        "grant_type":"client_credentials",
        "client_id": "4c278f01163940e18b48f853ccfefadf",
        "client_secret":"a6227bccdad44817bdef307ececd025f"
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