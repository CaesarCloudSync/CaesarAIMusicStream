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
        const errorMessage = response && response.data && response.data.error ? response.data.error : error.message;
        console.warn(`${searchquery} Error fetching stream link in GetYoutubeLink:`, errorMessage)
        return [undefined,undefined]
    }
}
export const getaudiolink = async (album_track,init_index=0) =>{
    let response;
    try{
    //const [video_link,title] = await getyoutubelink(album_track,download=false,init_index);
    //const proxy = await AsyncStorage.getItem("PROXY");
    //const proxy_status = await AsyncStorage.getItem("PROXY_STATUS");
    //const proxy_string = proxy_status ? `&proxy=${proxy}` : "";
    let searchquery = `${album_track.name.replace("&","and").replaceAll("$","S").replace("#","")} by ${album_track.artist.replace("¥$","Kanye West").replaceAll("$","S")}`//hoodie szn a boogie wit da hoodie album 20 tracks
    console.log("video_link",`https://music.caesaraihub.org/api/v2/getaudio?query=${searchquery}`) // ${proxy_string}
    response = await axios.get(`https://music.caesaraihub.org/api/v2/getaudio?query=${searchquery}`, { timeout: 10000 }) // ${proxy_string}
    let songurl = response.data.streaming_url
    let title = response.data.title
    if (!songurl) {
        // Successful API call but no streaming url returned
        const isRestricted = response.data && response.data.error && (
            response.data.error.toLowerCase().includes("restricted") ||
            response.data.error.toLowerCase().includes("copyright") ||
            response.data.error.toLowerCase().includes("unavailable") ||
            response.data.error.toLowerCase().includes("block") ||
            response.data.error.toLowerCase().includes("sign in") ||
            response.data.error.toLowerCase().includes("age")
        );
        return [undefined, undefined, !isRestricted];
    }
    return [songurl,title,false]
    }
    catch(error){
        console.log("error in getaudiolink",error)
        let isTransient = true;
        if (error.response) {
            const status = error.response.status;
            // 4xx errors other than 408 (timeout) and 429 (rate limit) are permanent
            if (status >= 400 && status < 500 && status !== 408 && status !== 429) {
                isTransient = false;
            }
        } else if (error.request) {
            // Network error / timeout (request made but no response)
            isTransient = true;
        } else {
            isTransient = true;
        }
        const errorMessage = response && response.data && response.data.error ? response.data.error : error.message;
        console.warn("Error fetching audio link in GetStreamingLink:", errorMessage)
        return [undefined,undefined,isTransient]
    }
}
export const getstreaminglink =async (album_track) =>{
    let [streaming_link,title,isTransient] = await getaudiolink(album_track)
    let start_index = 1;
    while (streaming_link === undefined && isTransient){
        if (start_index === 3){
            break
        }
        console.log(`Transient error. Waiting ${start_index}s before retry...`);
        await new Promise(resolve => setTimeout(resolve, 1000 * start_index));
        [streaming_link,title,isTransient] = await getaudiolink(album_track,init_index=start_index);
        start_index += 1
    }
    
    return [streaming_link,title,isTransient]
}
export  const getaudio = async (album_track,setCurrentTrack) =>{
        let [streaming_link,title] = await getstreaminglink(album_track)
        //console.log(streaming_link)
       
                        
        await addTrack(streaming_link,album_track)
        setCurrentTrack(album_track.name)


}
