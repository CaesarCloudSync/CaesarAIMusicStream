import { View,Text,Image,TouchableOpacity, Alert } from "react-native";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import axios from "axios";
import TrackPlayer, {
    AppKilledPlaybackBehavior,
    Capability,
    RepeatMode,
    Event,
  } from 'react-native-track-player';
export default function TrackItem({album_track,trackqueue}){
    const addTrack = async (streaming_link) =>{
        //files = files.filter((file) =>{return(file.mime === "audio/mpeg" && !file.name.includes(".trashed"))})
        //const CaesarAIMusicLogo = require('./assets/CaesarAILogo.png')
        const track = {isActive:true,id:album_track.name,url:streaming_link,title:album_track.name,artist:album_track.artist,artwork:album_track.thumbnail}
        //console.log(alltracks)
    
     await TrackPlayer.reset()
      await TrackPlayer.add(track);
      await TrackPlayer.setRepeatMode(RepeatMode.Queue);
      await TrackPlayer.play()
    }
    const getaudio = async () =>{
        let searchquery = `${album_track.name} by ${album_track.artist}`//hoodie szn a boogie wit da hoodie album 20 tracks
        const response = await axios.get(`https://caesaraiyoutube-qqbn26mgpa-uc.a.run.app/searchfeed?query=${searchquery}&amount=50`)
        let videos = response.data.result
        let video_link = videos[1].link
        const responseaudio = await axios.get(`https://caesaraiyoutube-qqbn26mgpa-uc.a.run.app/getaudiowatch?url=${video_link}`)
        console.log(responseaudio.data)
        if (responseaudio.data.title === "Video Not Available.mp3"){
            Alert.alert("Backend Error")
        }
        else{
            let streaming_link = responseaudio.data.media
            console.log(streaming_link)
            await addTrack(streaming_link)
    }
        
        //trackqueue.enqueue()
        

    }
    return(
        <View style={{flex:1}}>
            <View style={{flex:1,flexDirection:"row",margin:10,alignItems:"center"}}>
                <TouchableOpacity onPress={() =>{getaudio()}} style={{flex:1,flexDirection:"row",alignItems:"center"}}>
                <Image style={{width: 60, height: 60}} source={{uri:album_track.thumbnail}}></Image>

                <View style={{padding:6}}>

                </View>
                <View style={{flex:1}}>
                <Text style={{color:"white"}}>{album_track.name}</Text>
                <Text style={{color:"grey"}}>{album_track.artist}</Text>
                </View>
                </TouchableOpacity>
                <View style={{flex:0.2,width:"100%",height:"100%",justifyContent:"center",alignItems:"center"}}>
                <MaterialIcons name="my-library-add" style={{fontSize:25,color:"white"}}/>

                </View>
                <View style={{flex:0.2,width:"100%",height:"100%",justifyContent:"center",alignItems:"center"}}>
                <MaterialIcons name="my-library-add" style={{fontSize:25,color:"white"}}/>

                    
                </View>
                
            </View>

        </View>
    )
    
}