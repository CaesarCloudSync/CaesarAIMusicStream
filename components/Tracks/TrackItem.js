import { View,Text,Image,TouchableOpacity, Alert } from "react-native";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons"
import AntDesign from "react-native-vector-icons/AntDesign"
import { getaudio } from "./getstreamlinks";
import { useState } from "react";
import { getTableNames } from "../SQLDB/SQLDB";
import Entypo from "react-native-vector-icons/Entypo"
import { connectToDatabase } from "../SQLDB/SQLDB";
import { getyoutubelink } from "./getstreamlinks";
import addSong from "./DownloadSong";
import TrackPlayer from "react-native-track-player";
import AsyncStorage from "@react-native-async-storage/async-storage";
export default function TrackItem({album_track,setCurrentTrack,index}){
    const [songIsAvailable,setSongIsAvailable] = useState(true);
    const storeasunavailable = async () =>{
        if (songIsAvailable === true){
            setSongIsAvailable(false)
            const db = await connectToDatabase()
            //const tablenames = await getTableNames(db)
            console.log(db)
            
        }
        else{
            setSongIsAvailable(true)
        }
    }
    const downloadsong = async () =>{
        const youtube_link = await getyoutubelink(album_track,download=true);
        await addSong(youtube_link)

    }
    const playnowsong = async () =>{
        let cached_tracks =  await AsyncStorage.getItem(album_track.album_name)

        const queue = await TrackPlayer.getQueue();
        if (queue.length !== 0){
            if (queue[0].album_name === album_track.album_name){
                
                await TrackPlayer.skip(index)
                await TrackPlayer.play()

            }
            else{
                // If it is cached and 
                if (cached_tracks){
                    await TrackPlayer.reset();

                    await TrackPlayer.add(JSON.parse(cached_tracks));
                    await TrackPlayer.skip(index)
                    await TrackPlayer.play()
                }
                else{
                    await TrackPlayer.reset();
                    await TrackPlayer.skip(index)
                    await TrackPlayer.play()
                }

            }
        }
        else{
            if (cached_tracks){
                await TrackPlayer.reset();

                await TrackPlayer.add(JSON.parse(cached_tracks));
                await TrackPlayer.skip(index)
                await TrackPlayer.play()
            }
            else{
                await TrackPlayer.reset();
                await TrackPlayer.skip(index)
                await TrackPlayer.play()
            }
        }
    }


        
    return(
        <View style={{flex:1}}>
            <View style={{flex:1,flexDirection:"row",margin:10,alignItems:"center"}}>
                <TouchableOpacity onPress={() =>{playnowsong()}} style={{flex:1,flexDirection:"row",alignItems:"center"}}>
                <Image style={{width: 60, height: 60}} source={{uri:album_track.thumbnail}}></Image>

                <View style={{padding:6}}>

                </View>
                <View style={{flex:1}}>
                <Text style={{color:"white"}}>{album_track.name}</Text>
                <Text style={{color:"grey"}}>{album_track.artist}</Text>
                </View>
                </TouchableOpacity>



                <TouchableOpacity onPress={()=>{downloadsong()}}style={{flex:0.1,width:"100%",height:"100%",justifyContent:"center",alignItems:"center"}}>
                <MaterialCommunityIcons name="download-circle-outline" style={{fontSize:25,color:"white"}}/>

                    
                </TouchableOpacity>
                
            </View>

        </View>
    )
    
}