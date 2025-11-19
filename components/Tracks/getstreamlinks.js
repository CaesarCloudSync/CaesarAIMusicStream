import axios from "axios";
import TrackPlayer, {
    AppKilledPlaybackBehavior,
    Capability,
    RepeatMode,
    Event,
  } from 'react-native-track-player';
import { Alert } from "react-native";
import ytdl from "react-native-ytdl";
import AsyncStorage from "@react-native-async-storage/async-storage";
export const addTrack = async (streaming_link,album_track) =>{
    //files = files.filter((file) =>{return(file.mime === "audio/mpeg" && !file.name.includes(".trashed"))})
    //const CaesarAIMusicLogo = require('../../assets/CaesarAILogo.png')
    const track = [{album_id:album_track.album_id,album_name:album_track.album_name,thumbnail:album_track.thumbnail,isActive:true,id:album_track.id,url:streaming_link,title:album_track.name,artist:album_track.artist,artwork:album_track.thumbnail}]
    //console.log(alltracks)
    
    await TrackPlayer.reset()
    await TrackPlayer.seekTo(0)
    await TrackPlayer.add(track);
    //await TrackPlayer.setRepeatMode(RepeatMode.Queue);
    await TrackPlayer.play()
}
export const getyoutubelink  = async (album_track,download=false,init_index=0) =>{
    let response;
    let searchquery;
    try{
        if (album_track.artist && album_track.name){
            searchquery = `${album_track.name.replace("&","and").replace("#","")} by ${album_track.artist.replace("¥$","Kanye West")}`//hoodie szn a boogie wit da hoodie album 20 tracks
            console.log("searchquery",searchquery)
            response = await axios.get(`https://caesaraiyoutube-qqbn26mgpa-uc.a.run.app/searchfeed?query=${searchquery}&amount=50`)
            console.log("response",response.data)
            let videos = response.data.result
            console.log("videos",videos)
            let video_link = download === true ? videos[init_index].link :videos[init_index].link //videos[1].link
            let title = videos[init_index].title
            return [video_link,title]

    }
}
    catch(error){
        console.log("error in getyoutubelink",error)
        Alert.alert(`${searchquery} Error fetching stream link in GetYoutubeLink.`,response.data.error)
        return [undefined,undefined]
    }
}
export const getaudiolink = async (album_track,init_index=0) =>{
    let response;
    try{
    const [video_link,title] = await getyoutubelink(album_track,download=false,init_index);
    const proxy = await AsyncStorage.getItem("PROXY");
    const proxy_status = await AsyncStorage.getItem("PROXY_STATUS");
    const proxy_string = proxy_status ? `&proxy=${proxy}` : "";
    console.log("video_link",`https://music.caesaraihub.org/getaudio?url=${video_link}${proxy_string}`)
    response = await axios.get(`https://music.caesaraihub.org/getaudio?url=${video_link}${proxy_string}`)
    let songurl = response.data.streaming_url
    return [songurl,title]
    }
    catch(error){
        console.log("error in getaudiolink",error)
        Alert.alert("Error fetching audio link in GetStreamingLink.",response.data.error)
        return [undefined,undefined]
    }
}
export const getstreaminglink =async (album_track) =>{
    let [streaming_link,title] = await getaudiolink(album_track)
    let start_index = 1;
    while (streaming_link === undefined){
        if (start_index === 3){
            break
        }
        [streaming_link,title] = await getaudiolink(album_track,init_index=start_index);
        start_index += 1
    }
    
    return [streaming_link,title]
}
export  const getaudio = async (album_track,setCurrentTrack) =>{
        let [streaming_link,title] = await getstreaminglink(album_track)
        //console.log(streaming_link)
       
                        
        await addTrack(streaming_link,album_track)
        setCurrentTrack(album_track.name)


}
