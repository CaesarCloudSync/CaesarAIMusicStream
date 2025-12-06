import axios from "axios";

export async function getrecommendations(current_track){
    
    if (current_track){
        const artist = current_track.artist;
        const track_name = current_track.title;
        // Simple recommendation logic based on artist and track name
        const song_query = `${track_name} by ${artist}`;
        const reponse = await axios.get(`https://caesaraimusicrecommend-662756251108.us-central1.run.app/api/v1/get_recommendations?song_query=${encodeURIComponent(song_query)}`);
        let results = reponse.data.music;
        return results;
    }
    else{
        return null
    }
}