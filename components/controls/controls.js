import { getstreaminglink } from "../Tracks/getstreamlinks"

let loadingTrackId = null;
const loadingListeners = new Set();

export const getLoadingTrackId = () => loadingTrackId;

export const setLoadingTrackId = (trackId) => {
    loadingTrackId = trackId;
    loadingListeners.forEach(listener => listener(trackId));
};

export const subscribeToLoadingTrack = (listener) => {
    loadingListeners.add(listener);
    // Call listener immediately with the current state
    listener(loadingTrackId);
    return () => {
        loadingListeners.delete(listener);
    };
};
import TrackPlayer  from "react-native-track-player"
import AsyncStorage from "@react-native-async-storage/async-storage"
import RNFS from "react-native-fs";
import { get_access_token } from "../access_token/getaccesstoken";
import { convertToValidFilename } from "../tool/tools";
import { sendmusicconnect } from "../mqttclient/mqttclient";
import { VolumeManager } from 'react-native-volume-manager';
import { MUSICSDCARDPATH } from "../constants/constants";
import { searchsongsrecommend } from "../Tracks/getrecommendations";
import { getsongrecommendation, remove_recommend_next_played } from "../../trackPlayerServices";
const get_thumbnail = async (album_id) =>{
    const access_token = await get_access_token();
    const headers = {Authorization: `Bearer ${access_token}`}
    const resp = await fetch(`https://api.spotify.com/v1/albums/${album_id}`, {headers: headers})
    const feedresult = await resp.json()
    let album_thumbnail_after = feedresult.images[0].url
    return album_thumbnail_after

}
const get_prefetched_song = async (nextsong) =>{
    const current_prefetched = await AsyncStorage.getItem("current-prefetched-nextsong")
    if (current_prefetched){
        const current_prefetched_nextsong = JSON.parse(current_prefetched)
        let nextsong_key = `${nextsong.artist}-${nextsong.album_name}-${nextsong.name}`
        let prefetchedsong_key = `${current_prefetched_nextsong.artist}-${current_prefetched_nextsong.album_name}-${current_prefetched_nextsong.name}`
        console.log("prefetched-keys",prefetchedsong_key)
        console.log("nextsong_key",nextsong_key)
        if (nextsong_key === prefetchedsong_key){
            console.log("current_prefectehd",current_prefetched_nextsong)
            await AsyncStorage.removeItem("current-prefetched-nextsong")
            return [current_prefetched_nextsong.streaming_link,current_prefetched_nextsong.name]
        }
        else{
            console.warn("Prefetch not cleaned correctly")
            return await getstreaminglink(nextsong)
    
        }
        
    }
    else{
        return await getstreaminglink(nextsong)
    }

}
// Returns true only when the track has a real file on disk (not a skipped placeholder)
export const is_real_download = async (nextsong) => {
    if (!nextsong) return false;
    const raw = await AsyncStorage.getItem(`downloaded-track:${nextsong.artist}-${nextsong.album_name}-${nextsong.name}`);
    if (!raw) return false;
    try { return JSON.parse(raw)?.skipped !== true; } catch { return false; }
};

// Returns true when the track is an age-restricted placeholder (skipped)
export const is_track_restricted = async (track) => {
    if (!track) return false;
    const raw = await AsyncStorage.getItem(`downloaded-track:${track.artist}-${track.album_name}-${track.name}`);
    if (!raw) return false;
    try {
        return JSON.parse(raw)?.skipped === true;
    } catch {
        return false;
    }
};


export const prefetchsong = async (nextsong) =>{
    const [streaming_link,title] = await getstreaminglink(nextsong)
    if (!streaming_link) {
        console.log("Prefetch failed: restricted track. Marking as restricted:", nextsong.name);
        await AsyncStorage.setItem(`downloaded-track:${nextsong.artist}-${nextsong.album_name}-${nextsong.name}`, JSON.stringify({ skipped: true }));
    }
    nextsong["streaming_link"] = streaming_link
    await AsyncStorage.setItem("current-prefetched-nextsong",JSON.stringify(nextsong))
}

export const skipToTrack = async (nextsong,player_ind)=>{
    if (loadingTrackId !== null) {
        console.log("skipToTrack ignored: another song is currently loading.");
        return;
    }
    setLoadingTrackId(nextsong.id);
    try {
        let queue = await TrackPlayer.getQueue();
        let next_exists_queue = queue.filter((track) =>{return (track.id === nextsong.id)})
        if (next_exists_queue.length === 0){
            const track_downloaded = await AsyncStorage.getItem(`downloaded-track:${nextsong.artist}-${nextsong.album_name}-${nextsong.name}`)
            // Check if it's a skipped placeholder (age-restricted) — has the key but no real file
            const track_downloaded_data = track_downloaded ? JSON.parse(track_downloaded) : null;
            const is_skipped = track_downloaded_data?.skipped === true;
            
            if (is_skipped) {
                console.log("Skipped/restricted track, auto-advancing directly without backend fetch:", nextsong.name);
                setLoadingTrackId(null);
                await autoplaynextsong();
                return;
            }
            
            const use_local = track_downloaded !== null;
            let [streaming_link,title] = !use_local ? await get_prefetched_song(nextsong) : [`file://${MUSICSDCARDPATH}/${convertToValidFilename(`${nextsong.artist}-${nextsong.album_name}-${nextsong.name}`)}.mp3`,undefined]
            // If track still can't get a stream, auto-skip to next song
            if (!use_local && !streaming_link) {
                console.log("Unavailable track, marking as restricted and auto-advancing:", nextsong.name);
                await AsyncStorage.setItem(`downloaded-track:${nextsong.artist}-${nextsong.album_name}-${nextsong.name}`, JSON.stringify({ skipped: true }));
                setLoadingTrackId(null);
                await autoplaynextsong();
                return;
            }
            console.log("skippedtrrack",streaming_link)
            let thumbnail = !use_local ? nextsong.ytcustom ? nextsong.thumbnail : await get_thumbnail(nextsong.album_id) : `file://${RNFS.DocumentDirectoryPath}/${convertToValidFilename(`${nextsong.artist}-${nextsong.album_name}-${nextsong.name}`)}.jpg`
            const streaming_type = streaming_link.includes(".m3u8") ? "hls" : "default"
            if ("playlist_thumbnail" in nextsong && !("playlist_local" in nextsong)){
                await TrackPlayer.add([{playlist_thumbnail:nextsong.playlist_thumbnail,playlist_id:nextsong.playlist_id,playlist_name:nextsong.playlist_name,index:player_ind,album_id:nextsong.album_id,album:nextsong.album_name,album_name:nextsong.album_name,thumbnail:thumbnail,isActive:true,id:nextsong.id,url:streaming_link,title:nextsong.name,artist_id:nextsong.artist_id,artist:nextsong.artist,artwork:thumbnail,duration:nextsong.duration_ms / 1000,mediastatus:"online",type:streaming_type}]);
                await TrackPlayer.add([{playlist_thumbnail:nextsong.playlist_thumbnail,playlist_id:nextsong.playlist_id,playlist_name:nextsong.playlist_name,index:player_ind,album_id:nextsong.album_id,album:nextsong.album_name,album_name:nextsong.album_name,thumbnail:thumbnail,isActive:true,id:nextsong.id + "dummy",url:"dummy",title:nextsong.name,artist_id:nextsong.artist_id,artist:nextsong.artist,artwork:thumbnail,duration:nextsong.duration_ms / 1000,mediastatus:"online",type:streaming_type}]);
                await TrackPlayer.skip(queue.length)
                let music_connected =  await AsyncStorage.getItem("music_connected")
                if (!music_connected){
                await TrackPlayer.setVolume(1)
                //TrackPlayer.setRate(1)
                await TrackPlayer.play()
                }
            }
            else if ("playlist_local" in nextsong){
                await TrackPlayer.add([{playlist_local:nextsong.playlist_local,playlist_name:nextsong.playlist_name,index:player_ind,album_id:nextsong.album_id,album:nextsong.album_name,album_name:nextsong.album_name,thumbnail:thumbnail,isActive:true,id:nextsong.id,url:streaming_link,title:nextsong.name,artist_id:nextsong.artist_id,artist:nextsong.artist,artwork:thumbnail,duration:nextsong.duration_ms / 1000,mediastatus:"online",type:streaming_type}]);
                await TrackPlayer.add([{playlist_local:nextsong.playlist_local,playlist_name:nextsong.playlist_name,index:player_ind,album_id:nextsong.album_id,album:nextsong.album_name,album_name:nextsong.album_name,thumbnail:thumbnail,isActive:true,id:nextsong.id + "dummy",url:"dummy",title:nextsong.name,artist_id:nextsong.artist_id,artist:nextsong.artist,artwork:thumbnail,duration:nextsong.duration_ms / 1000,mediastatus:"online",type:streaming_type}]);
                await TrackPlayer.skip(queue.length)
                let music_connected =  await AsyncStorage.getItem("music_connected")
                if (!music_connected){
                await TrackPlayer.setVolume(1)
                //TrackPlayer.setRate(1)mp3
                await TrackPlayer.play()
                }

            }
            else{
                console.log("nextsong",nextsong)
            
            await TrackPlayer.add([{index:player_ind,album_id:nextsong.album_id,album:nextsong.album_name,album_name:nextsong.album_name,thumbnail:thumbnail,isActive:true,id:nextsong.id,url:streaming_link,title:nextsong.name,artist_id:nextsong.artist_id,artist:nextsong.artist,artwork:thumbnail,duration:nextsong.duration_ms / 1000,mediastatus:"online",type:streaming_type}]);
            await TrackPlayer.add([{index:player_ind,album_id:nextsong.album_id,album:nextsong.album_name,album_name:nextsong.album_name,thumbnail:thumbnail,isActive:true,id:nextsong.id + "dummy",url:"dummy",title:nextsong.name,artist_id:nextsong.artist_id,artist:nextsong.artist,artwork:thumbnail,duration:nextsong.duration_ms / 1000,mediastatus:"online",type:streaming_type}]);
            await TrackPlayer.skip(queue.length)
            let music_connected =  await AsyncStorage.getItem("music_connected")
            if (!music_connected){
            await TrackPlayer.setVolume(1)
            //TrackPlayer.setRate(1)
            await TrackPlayer.play()
            }
        }
        // music_connected broadcast — only send a remote URL.
        // If the track is a real local download, keep playing locally and do NOT
        // re-fetch from the backend; just broadcast the streaming URL for the
        // remote receiver separately.
        let music_connected = await AsyncStorage.getItem("music_connected")
        if (music_connected){
            // Only hit the backend if the local file is NOT being used
            const send_url = use_local
                ? (await getstreaminglink(nextsong))[0]   // remote gets stream; local device keeps file
                : streaming_link;
            const send_thumbnail = use_local && !nextsong.ytcustom
                ? await get_thumbnail(nextsong.album_id)
                : thumbnail;
            nextsong.url = send_url;
            nextsong.thumbnail = send_thumbnail || "";
            nextsong.volume = (await VolumeManager.getVolume()).volume;
            await AsyncStorage.setItem("music_connect_next_track", JSON.stringify(nextsong));
            await sendmusicconnect();
        }
        
        const queue_current_track = await AsyncStorage.getItem(`queue-current-track-${nextsong.artist}-${nextsong.album_name}-${nextsong.name}`);
        if (queue_current_track){
            await AsyncStorage.setItem("current-track",JSON.stringify(nextsong));
            await AsyncStorage.setItem("current-tracks",queue_current_track);
        }
        const recommend_current_track = await AsyncStorage.getItem(`current-recommend-sp`);
        console.log("recommend_current_track",recommend_current_track)
        if (recommend_current_track){
            await AsyncStorage.setItem("current-track",JSON.stringify(nextsong));
            await AsyncStorage.setItem("current-tracks",recommend_current_track);
        }

        }
        else{
            var elementPos = queue.findIndex(track => track.id == nextsong.id && track.url !== "dummy")
            
            await TrackPlayer.skip(elementPos)
            
            let music_connected = await AsyncStorage.getItem("music_connected")
            if (music_connected){
                const already_local = queue[elementPos].url.startsWith("file://");
                // Don't re-fetch from backend if it's already a real local file
                const send_url = already_local
                    ? (await getstreaminglink(nextsong))[0]
                    : queue[elementPos].url;
                const send_thumbnail = queue[elementPos].thumbnail.startsWith("file://") && !nextsong.ytcustom
                    ? await get_thumbnail(nextsong.album_id)
                    : queue[elementPos].thumbnail;
                nextsong.url = send_url;
                nextsong.thumbnail = send_thumbnail || "";
                nextsong.volume = (await VolumeManager.getVolume()).volume;
                await AsyncStorage.setItem("music_connect_next_track", JSON.stringify(nextsong));
                await sendmusicconnect();
            }
            else{
                await TrackPlayer.setVolume(1)
                //TrackPlayer.setRate(1)
                await TrackPlayer.play()
            }
            const queue_current_track = await AsyncStorage.getItem(`queue-current-track-${nextsong.artist}-${nextsong.album_name}-${nextsong.name}`);
            if (queue_current_track){
                await AsyncStorage.setItem("current-track",JSON.stringify(nextsong));
                await AsyncStorage.setItem("current-tracks",queue_current_track);
            }
         
            const recommend_current_track = await AsyncStorage.getItem(`current-recommend-sp`);
            console.log("recommend_current_track",recommend_current_track)
            if (recommend_current_track){
                await AsyncStorage.setItem("current-track",JSON.stringify(nextsong));
                await AsyncStorage.setItem("current-tracks",recommend_current_track);
            }
         

        }
    } catch (err) {
        console.error("Error in skipToTrack:", err);
    } finally {
        setLoadingTrackId(null);
    }
}

export const get_next_ind_in_album =  async () =>{

    const stored_album_tracks = await AsyncStorage.getItem("current-tracks")
    const album_tracks = JSON.parse(stored_album_tracks)
    //console.log(album_tracks[0])
    let num_of_tracks = album_tracks.length -1
    //console.log(num_of_tracks)
    let currentTrackInd = await  TrackPlayer.getActiveTrackIndex()
    //console.log("current",currentTrackInd)
    let currentTrack = await TrackPlayer.getTrack(currentTrackInd)
    //console.log(currentTrack.index,currentTrack)
    let player_ind = (currentTrack.index+ 1) >= num_of_tracks ? 0 : currentTrack.index+ 1 // This adds songs to player regardless of order in album. It just makes sure not to exceed the num of songs in album. The index of song would then be found in player then added to end or skipped to.
    //console.log("next",player_ind,num_of_tracks,album_tracks)
    const currentTrackIndexInaAlbum = album_tracks.findIndex(track => track.id == currentTrack.id)
    
    let next_ind_in_album = (currentTrackIndexInaAlbum +1) >= num_of_tracks ? 0 : currentTrackIndexInaAlbum +1 
    return [next_ind_in_album,num_of_tracks,currentTrackIndexInaAlbum,player_ind,album_tracks]
}
export const get_next_song = async (track_after_queue,album_tracks,next_ind_in_album) =>{
    console.log("track_after_queue",track_after_queue)
    console.log("next_ind_in_album",next_ind_in_album)
    const nextsong = track_after_queue  ? album_tracks[parseInt(track_after_queue)]:album_tracks[next_ind_in_album]
    return nextsong
}
export const play_next_queued_song = async (newqueue,player_ind) =>{
    let queue_json = JSON.parse(newqueue)
    let nextsongqueue = null;

    while (queue_json.length > 0) {
        let current_candidate = queue_json[0];
        const is_restricted = await is_track_restricted(current_candidate);
        if (is_restricted) {
            console.log("Queue song is restricted, skipping without accessing:", current_candidate.name);
            queue_json.shift();
        } else {
            nextsongqueue = current_candidate;
            break;
        }
    }

    if (nextsongqueue) {
        queue_json.shift();
        if (queue_json.length !== 0){
            await AsyncStorage.setItem("queue",JSON.stringify(queue_json))
        } else {
            await AsyncStorage.removeItem("queue")
        }
        await skipToTrack(nextsongqueue,player_ind)
    } else {
        await AsyncStorage.removeItem("queue");
        await autoplaynextsong();
    }
}
export const play_next_song_after_queue = async (album_tracks,next_ind_in_album,player_ind) =>{
    await AsyncStorage.removeItem("track_after_queue")
    
    await skipToTrack(album_tracks[next_ind_in_album],player_ind)
}
export const play_next_song = async (nextsong,player_ind,track_after_queue) =>{
    console.log("playsongmiu",nextsong)
    await skipToTrack(nextsong,player_ind)
    console.log("played next song3")
    if (track_after_queue){
        await AsyncStorage.removeItem("track_after_queue")
    }
}
export const get_new_queue = async () =>{
    const stored_queue = await AsyncStorage.getItem("queue")
    return stored_queue
}
export const get_track_after_queue = async () =>{
    const stored_track_after_queue = await AsyncStorage.getItem("track_after_queue")
    return stored_track_after_queue
}
export const get_recommended_songs = async () =>{
    const stored_recommended_songs = await AsyncStorage.getItem("current-recommendations")
    return stored_recommended_songs
}
export const play_recommended_next_song = async (player_ind) =>{
    let nextsongsrecommend = null;
    let found = false;

    while (!found) {
        const current_prefetched = await AsyncStorage.getItem("current-prefetched-nextsong")
        if (current_prefetched){
            console.log("prefecthed_recommend")
            nextsongsrecommend = JSON.parse(current_prefetched)
            await AsyncStorage.removeItem("current-prefetched-nextsong")
        }
        else{
            console.log("fetching_recomemnd")
            nextsongsrecommend = await getsongrecommendation()
        }

        if (!nextsongsrecommend) {
            break;
        }

        const is_restricted = await is_track_restricted(nextsongsrecommend);
        if (is_restricted) {
            console.log("Recommended song is restricted, skipping without accessing:", nextsongsrecommend.name);
            const recommended_songs = await get_recommended_songs();
            await remove_recommend_next_played(recommended_songs);
            nextsongsrecommend = null;
        } else {
            found = true;
        }
    }

    if (nextsongsrecommend) {
        await skipToTrack(nextsongsrecommend,player_ind)
        const recommended_songs = await get_recommended_songs();
        await remove_recommend_next_played(recommended_songs)
    } else {
        await autoplaynextsong();
    }
}
export const get_recommend_mode = async () =>{
    const recommend_mode = await AsyncStorage.getItem("recommendation-mode")
    return recommend_mode
}
export const get_next_song_in_recommend_queue = async (recommended_songs ) =>{
    const recommend_json = JSON.parse(recommended_songs)
    const nextsongrecommend = recommend_json[0]
    return nextsongrecommend

}
export const store_current_recommended_yt_to_spotify = async (album_tracks_recommend) =>{
    await AsyncStorage.setItem("current-recommend-sp",JSON.stringify(album_tracks_recommend))
}
export const changerecommendyt = async () =>{
    const current_recommendations= await  AsyncStorage.getItem("current-recommendations")
    const recommend_json = JSON.parse(current_recommendations)
    recommend_json.shift()
    if (recommend_json.length !== 0){
    await AsyncStorage.setItem("current-recommendations",JSON.stringify(recommend_json))
    }
    else{
        await AsyncStorage.removeItem("current-recommendations")
    }

}
export const find_recommended_song = async (title,artist,recommended_songs) =>{
    const recommended_songs_json = JSON.parse(recommended_songs)
    
    
    const recommend_song = recommended_songs_json.find((song) => song.title === title && song.artists[0].name === artist)
    console.log("recommend_song",recommend_song)
    return recommend_song
}
export const autoplaynextsong = async () =>{
    if (loadingTrackId !== null) {
        console.log("Ignore autoplaynextsong: already loading");
        return;
    }

    const [next_ind_in_album,num_of_tracks,currentTrackIndexInaAlbum,player_ind,album_tracks] = await get_next_ind_in_album()
    
    const newqueue = await get_new_queue()
    const recommend_mode = await get_recommend_mode();
    if (newqueue){
        await play_next_queued_song(newqueue,player_ind)
    }
    else if (recommend_mode && !newqueue){
        await play_recommended_next_song(player_ind)
    }
    else{
        const track_after_queue = await get_track_after_queue()
        let initial_next_ind = track_after_queue ? parseInt(track_after_queue) : next_ind_in_album;

        let target_ind = initial_next_ind;
        let found_unrestricted = false;
        let loop_count = 0;

        while (!found_unrestricted && loop_count < album_tracks.length) {
            let candidate_song = album_tracks[target_ind];
            const is_restricted = await is_track_restricted(candidate_song);
            if (is_restricted) {
                console.log("Album song is restricted, skipping without accessing:", candidate_song.name);
                target_ind = (target_ind + 1) % album_tracks.length;
                loop_count++;
            } else {
                found_unrestricted = true;
            }
        }

        if (found_unrestricted) {
            const nextsong = album_tracks[target_ind];
            let currentTrackInd = await TrackPlayer.getActiveTrackIndex()
            let currentTrack = await TrackPlayer.getTrack(currentTrackInd)
            let new_player_ind = (currentTrack.index + 1) >= (album_tracks.length - 1) ? 0 : currentTrack.index + 1

            console.log("nextsonghiuwu",nextsong)
            await play_next_song(nextsong,new_player_ind,track_after_queue)
            console.log("played next song")
        } else {
            console.log("All album tracks are restricted, stopping playback.");
            await TrackPlayer.stop();
        }
    }
    console.log(newqueue)
}
export const autoplayprevioussong = async () =>{
    if (loadingTrackId !== null) {
        console.log("Ignore autoplayprevioussong: already loading");
        return;
    }
    const stored_album_tracks = await AsyncStorage.getItem("current-tracks")
    const album_tracks = JSON.parse(stored_album_tracks)
    let num_of_tracks = album_tracks.length
    let currentTrackInd = await  TrackPlayer.getActiveTrackIndex()
    let currentTrack = await TrackPlayer.getTrack(currentTrackInd)

    let player_ind = (currentTrack.index+ 1) >= num_of_tracks ? 0 : currentTrack.index+ 1
    const currentTrackIndexInaAlbum = album_tracks.findIndex(track => track.id == currentTrack.id)

    let target_ind = (currentTrackIndexInaAlbum - 1 + album_tracks.length) % album_tracks.length;
    let found_unrestricted = false;
    let loop_count = 0;

    while (!found_unrestricted && loop_count < album_tracks.length) {
        let candidate_song = album_tracks[target_ind];
        const is_restricted = await is_track_restricted(candidate_song);
        if (is_restricted) {
            console.log("Previous album song is restricted, skipping backwards:", candidate_song.name);
            target_ind = (target_ind - 1 + album_tracks.length) % album_tracks.length;
            loop_count++;
        } else {
            found_unrestricted = true;
        }
    }

    if (found_unrestricted) {
        let nextsong = album_tracks[target_ind]
        await skipToTrack(nextsong,player_ind)
    } else {
        console.log("All album tracks are restricted, stopping playback.");
        await TrackPlayer.stop();
    }
}