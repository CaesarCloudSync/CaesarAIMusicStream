import { getstreaminglink } from "../Tracks/getstreamlinks"
import TrackPlayer  from "react-native-track-player"
import AsyncStorage from "@react-native-async-storage/async-storage"
export const skipToTrack = async (nextsong,player_ind)=>{
    let queue = await TrackPlayer.getQueue();
    let next_exists_queue = queue.filter((track) =>{return (track.id === nextsong.id)})
  
    if (next_exists_queue.length === 0){
        let streaming_link = await getstreaminglink(nextsong)
        if ("playlist_name" in nextsong){
            await TrackPlayer.add([{playlist_thumbnail:nextsong.playlist_thumbnail,playlist_id:nextsong.playlist_id,playlist_name:nextsong.playlist_name,index:player_ind,album_id:nextsong.album_id,album:nextsong.album_name,album_name:nextsong.album_name,thumbnail:nextsong.thumbnail,isActive:true,id:nextsong.id,url:streaming_link,title:nextsong.name,artist_id:nextsong.artist_id,artist:nextsong.artist,artwork:nextsong.thumbnail,duration:nextsong.duration_ms / 1000,mediastatus:"online"}]);
            await TrackPlayer.add([{playlist_thumbnail:nextsong.playlist_thumbnail,playlist_id:nextsong.playlist_id,playlist_name:nextsong.playlist_name,index:player_ind,album_id:nextsong.album_id,album:nextsong.album_name,album_name:nextsong.album_name,thumbnail:nextsong.thumbnail,isActive:true,id:nextsong.id + "dummy",url:"dummy",title:nextsong.name,artist_id:nextsong.artist_id,artist:nextsong.artist,artwork:nextsong.thumbnail,duration:nextsong.duration_ms / 1000,mediastatus:"online"}]);
            await TrackPlayer.skip(queue.length)
            await TrackPlayer.play()
        }else{

        
        await TrackPlayer.add([{index:player_ind,album_id:nextsong.album_id,album:nextsong.album_name,album_name:nextsong.album_name,thumbnail:nextsong.thumbnail,isActive:true,id:nextsong.id,url:streaming_link,title:nextsong.name,artist_id:nextsong.artist_id,artist:nextsong.artist,artwork:nextsong.thumbnail,duration:nextsong.duration_ms / 1000,mediastatus:"online"}]);
        await TrackPlayer.add([{index:player_ind,album_id:nextsong.album_id,album:nextsong.album_name,album_name:nextsong.album_name,thumbnail:nextsong.thumbnail,isActive:true,id:nextsong.id + "dummy",url:"dummy",title:nextsong.name,artist_id:nextsong.artist_id,artist:nextsong.artist,artwork:nextsong.thumbnail,duration:nextsong.duration_ms / 1000,mediastatus:"online"}]);
        await TrackPlayer.skip(queue.length)
        await TrackPlayer.play()
    }

    }
    else{
        var elementPos = queue.findIndex(track => track.id == nextsong.id && track.url !== "dummy")
        await TrackPlayer.skip(elementPos)
        await TrackPlayer.play()
     

    }
}
export const autoplaynextsong = async () =>{

    const stored_album_tracks = await AsyncStorage.getItem("current-tracks")
    const album_tracks = JSON.parse(stored_album_tracks)
    //console.log(album_tracks[0])
    let num_of_tracks = album_tracks.length
    //console.log(num_of_tracks)
    let currentTrackInd = await  TrackPlayer.getCurrentTrack()
    //console.log("current",currentTrackInd)
    let currentTrack = await TrackPlayer.getTrack(currentTrackInd)
    //console.log(currentTrack.index,currentTrack)
    let player_ind = (currentTrack.index+ 1) >= num_of_tracks ? 0 : currentTrack.index+ 1 // This adds songs to player regardless of order in album. It just makes sure not to exceed the num of songs in album. The index of song would then be found in player then added to end or skipped to.
    //console.log("next",player_ind,num_of_tracks,)
    const currentTrackIndexInaAlbum = album_tracks.findIndex(track => track.id == currentTrack.id)
    let next_ind_in_album = (currentTrackIndexInaAlbum +1) >= num_of_tracks ? 0 : currentTrackIndexInaAlbum +1 
    let nextsong = album_tracks[next_ind_in_album]
    
    const newqueue = await AsyncStorage.getItem("queue")
    if (newqueue){
        let queue_json = JSON.parse(newqueue)
        let nextsongqueue = queue_json[0]
        console.log("ho")
         console.log(queue_json)

        await skipToTrack(nextsongqueue,player_ind)

       
        queue_json.shift()
        if (queue_json.length !== 0){
        await AsyncStorage.setItem("queue",JSON.stringify(queue_json))
        }
        else{
            await AsyncStorage.removeItem("queue")
        }

    }
    else{
        await skipToTrack(nextsong,player_ind)
    }
    console.log(newqueue)
    //await TrackPlayer.setRepeatMode(RepeatMode.Off);

    //await TrackPlayer.reset();






}
export const autoplayprevioussong = async () =>{
    const stored_album_tracks = await AsyncStorage.getItem("current-tracks")
    const album_tracks = JSON.parse(stored_album_tracks)
    let num_of_tracks = album_tracks.length
    let currentTrackInd = await  TrackPlayer.getCurrentTrack()
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