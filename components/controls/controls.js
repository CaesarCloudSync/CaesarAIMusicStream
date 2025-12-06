import { getstreaminglink } from "../Tracks/getstreamlinks"
import TrackPlayer  from "react-native-track-player"
import AsyncStorage from "@react-native-async-storage/async-storage"
import RNFS from "react-native-fs";
import { get_access_token } from "../access_token/getaccesstoken";
import { convertToValidFilename } from "../tool/tools";
import { sendmusicconnect } from "../mqttclient/mqttclient";
import { VolumeManager } from 'react-native-volume-manager';
import { MUSICSDCARDPATH } from "../constants/constants";
import { searchsongsrecommend } from "../Tracks/getrecommendations";
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
export const prefetchsong = async (nextsong) =>{
    const [streaming_link,title] = await getstreaminglink(nextsong)
    nextsong["streaming_link"] = streaming_link
    await AsyncStorage.setItem("current-prefetched-nextsong",JSON.stringify(nextsong))

}
export const skipToTrack = async (nextsong,player_ind)=>{
    let queue = await TrackPlayer.getQueue();
    let next_exists_queue = queue.filter((track) =>{return (track.id === nextsong.id)})
    if (next_exists_queue.length === 0){
        const track_downloaded = await AsyncStorage.getItem(`downloaded-track:${nextsong.artist}-${nextsong.album_name}-${nextsong.name}`)
        //console.log(`file://${MUSICSDCARDPATH}/${convertToValidFilename(`${nextsong.artist}-${nextsong.album_name}-${nextsong.name}`)}.mp3`,`file://${RNFS.DocumentDirectoryPath}/${convertToValidFilename(`${nextsong.artist}-${nextsong.album_name}-${nextsong.name}`)}.mp3`,`file://${RNFS.ExternalStorageDirectoryPath}/${convertToValidFilename(`${nextsong.artist}-${nextsong.album_name}-${nextsong.name}`)}.mp3`)
        let [streaming_link,title] = !track_downloaded  ? await get_prefetched_song(nextsong) :  [`file://${MUSICSDCARDPATH}/${convertToValidFilename(`${nextsong.artist}-${nextsong.album_name}-${nextsong.name}`)}.mp3`,undefined]
        console.log("skippedtrrack",streaming_link)
        let thumbnail = !track_downloaded  ? nextsong.ytcustom ? nextsong.thumbnail :await get_thumbnail(nextsong.album_id) :  `file://${RNFS.DocumentDirectoryPath}/${convertToValidFilename(`${nextsong.artist}-${nextsong.album_name}-${nextsong.name}`)}.jpg`
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
    // Thumbnail Doesn't take into accoun ytcustom
    let music_connected =  await AsyncStorage.getItem("music_connected")
    if (music_connected){

    if (streaming_link.includes("file://")){
        let [music_connected_link ,title]= await getstreaminglink(nextsong)
        nextsong.url = music_connected_link
    }
    else{
        nextsong.url = streaming_link
    }

    if (thumbnail.includes("file://")){
        if (!nextsong.ytcustom){
            let music_connected_thumbnail = await get_thumbnail(nextsong.album_id);
            nextsong.thumbnail = music_connected_thumbnail
        }
        else{
            nextsong.thumbnail = ""
        }
    }
    else{
        nextsong.thumbnail = thumbnail   
    }
    nextsong.volume = (await VolumeManager.getVolume()).volume
    await AsyncStorage.setItem("music_connect_next_track",JSON.stringify(nextsong))
    await sendmusicconnect()
    
    }
    
    const queue_current_track = await AsyncStorage.getItem(`queue-current-track-${nextsong.artist}-${nextsong.album_name}-${nextsong.name}`);
    if (queue_current_track){
        await AsyncStorage.setItem("current-track",JSON.stringify(nextsong));
        await AsyncStorage.setItem("current-tracks",queue_current_track);
    }

    }
    else{
        var elementPos = queue.findIndex(track => track.id == nextsong.id && track.url !== "dummy")
        
        await TrackPlayer.skip(elementPos)
        
        let music_connected =  await AsyncStorage.getItem("music_connected")
        if (music_connected){
        let streaming_link = queue[elementPos].url
        let thumbnail = queue[elementPos].thumbnail

        if (streaming_link.includes("file://")){
            let [music_connected_link ,title]= await getstreaminglink(nextsong)
            nextsong.url = music_connected_link
        }
        else{
            nextsong.url = streaming_link
        }

        if (thumbnail.includes("file://")){
            let music_connected_thumbnail = await get_thumbnail(nextsong.album_id);
            nextsong.thumbnail = music_connected_thumbnail
        }
        else{
            nextsong.thumbnail = thumbnail   
        }
        nextsong.volume = (await VolumeManager.getVolume()).volume
        await AsyncStorage.setItem("music_connect_next_track",JSON.stringify(nextsong))
        await sendmusicconnect()
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
    let nextsongqueue = queue_json[0]

    await skipToTrack(nextsongqueue,player_ind)

    
    queue_json.shift()
    if (queue_json.length !== 0){
    await AsyncStorage.setItem("queue",JSON.stringify(queue_json))
    }
    else{
        await AsyncStorage.removeItem("queue")
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
export const play_recommended_next_song = async (nextsong,player_ind) =>{
    await skipToTrack(nextsong,player_ind)

    

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
    await AsyncStorage.setItem("current-tracks",JSON.stringify(album_tracks_recommend))
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
    // TODO Clean up functions - Chase Shakurs new song caused youtubesearch to go zero which caused album_tracks[index].link = undefined
    //await AsyncStorage.removeItem("current-tracks")

    //await AsyncStorage.removeItem("track_after_queue")
    //await AsyncStorage.removeItem("queue")

    const [next_ind_in_album,num_of_tracks,currentTrackIndexInaAlbum,player_ind,album_tracks] = await get_next_ind_in_album()
    
    // next_ind null 23 22
    const newqueue = await get_new_queue()
    if (newqueue){
        await play_next_queued_song(newqueue,player_ind)

    }
    else{
        //console.log("no queue")
       

        const track_after_queue = await get_track_after_queue()
        console.log("next_ind",track_after_queue,next_ind_in_album,num_of_tracks,currentTrackIndexInaAlbum)
        const nextsong = await get_next_song(track_after_queue,album_tracks,next_ind_in_album)
        console.log("nextsong_main",nextsong)
        if (nextsong === undefined){
            await play_next_song_after_queue(album_tracks,next_ind_in_album,player_ind)
        }
        else{
            console.log("nextsonghiuwu",nextsong)
            await play_next_song(nextsong,player_ind,track_after_queue)
            console.log("played next song")

        }
        const recommend_mode = await get_recommend_mode()
        if (recommend_mode){
            console.log("recommend_mode active")
          await changerecommendyt()
        }
        


    }
    console.log(newqueue)
    //await TrackPlayer.setRepeatMode(RepeatMode.Off);

    //await TrackPlayer.reset();






}
export const autoplayprevioussong = async () =>{
    const stored_album_tracks = await AsyncStorage.getItem("current-tracks")
    const album_tracks = JSON.parse(stored_album_tracks)
    let num_of_tracks = album_tracks.length
    let currentTrackInd = await  TrackPlayer.getActiveTrackIndex()
    //console.log("current",currentTrackInd)
    let currentTrack = await TrackPlayer.getTrack(currentTrackInd)
    //console.log(currentTrack.index,currentTrack.title,currentTrackInd)

    let player_ind = (currentTrack.index+ 1) >= num_of_tracks ? 0 : currentTrack.index+ 1 // This adds songs to player regardless of order in album. It just makes sure not to exceed the num of songs in album. The index of song would then be found in player then added to end or skipped to.
    const currentTrackIndexInaAlbum = album_tracks.findIndex(track => track.id == currentTrack.id)
    let next_ind_in_album = (currentTrackIndexInaAlbum -1) <= 0 ? 0 : currentTrackIndexInaAlbum -1 
    let nextsong = album_tracks[next_ind_in_album]
    //console.log("next",currentTrackIndexInaAlbum)
    await skipToTrack(nextsong,player_ind)
   





}