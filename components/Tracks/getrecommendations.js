import axios from "axios";
import { get_access_token } from "../access_token/getaccesstoken";
export async function getrecommendations(current_track,max_songs=10){
    
    if (current_track){
        const artist = current_track.artist;
        const track_name = current_track.title;
        // Simple recommendation logic based on artist and track name
        const song_query = `${track_name} by ${artist}`;
        const reponse = await axios.get(`https://caesaraimusicrecommend-662756251108.us-central1.run.app/api/v1/get_recommendations?song_query=${encodeURIComponent(song_query)}&max_songs=${max_songs}`);
        let results = reponse.data.music;
        return results;
    }
    else{
        return null
    }
}
export const getrecommendation = async (current_track) =>{
    if (current_track){
        const artist = current_track.artist;
        const track_name = current_track.title;
        // Simple recommendation logic based on artist and track name
        const song_query = `${track_name} by ${artist}`;
        const reponse = await axios.get(`https://caesaraimusicrecommend-662756251108.us-central1.run.app/api/v1/get_recommendation?song_query=${encodeURIComponent(song_query)}`);
        let results = reponse.data.music[0];
        return results;
    }
    else{
        return null
    }

}
export const searchsongsrecommend = async (song_name, artist_name) =>{
         try{
      const query = `track:"${song_name}" artist:"${artist_name}"`;
      console.log("query in searchsongs",query)
      const url = `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=1`;

      const access_token = await get_access_token();
        const headers = {Authorization: `Bearer ${access_token}`}
        //console.log(text)
        const resp = await fetch(url, {headers: headers})
        const feedresult = await resp.json()
        //console.log("feedresult in searchsongs",feedresult)
        const track = feedresult.tracks.items[0]
        //console.log("track in searchsongs",track)
        const result_track = {"id":track.id,"album_id":track.album.id,"name":track.name,thumbnail:track.album.images[0].url,"artist":track.album.artists[0].name,artist_id: track.artists[0].id,duration_ms: track.duration_ms,album_name: track.album.name,track_number: track.track_number}
        const resp2 = await fetch(`https://api.spotify.com/v1/albums/${result_track.album_id}/tracks`, {headers: headers})
        const tracksresult = await resp2.json()
   
        const  tracks = tracksresult.items.map((item) => ({
          id: item.id,
          name: item.name,
          artist: item.artists[0].name,
          artist_id: item.artists[0].id,
          duration_ms: item.duration_ms,
          thumbnail: result_track.thumbnail,
          album_id: result_track.album_id,
          track_number: item.track_number,
          album_name: result_track.album_name,
        }));
        //console.log("tracks in searchsongs",tracks)
        return  [result_track,tracks]
        //setSongs(result)
        //console.log(artists)
        //setTracks(tracks)
  
        //toggleModal()
        }
        catch{
            console.warn("The songs query string is probably not read correcly by searchsongsrecommend /search. Likely Odd characteers. ")
        }
    }