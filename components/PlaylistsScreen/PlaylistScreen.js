import { View,Text, ScrollView, FlatList,Image} from "react-native";

import NavigationFooter from "../NavigationFooter/NavigationFooter";
import { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import TrackProgress from "../TrackProgress/TrackProgress";
import ShowCurrentTrack from "../ShowCurrentTrack/ShowCurrentTrack";
import { get_access_token } from "../access_token/getaccesstoken";

import { TouchableHighlight } from "react-native";
import PlaylistCard from "./PlaylistCard";
import { TextInput } from "react-native-gesture-handler";
import AntDesign from "react-native-vector-icons/AntDesign"
import ShowQueue from "../ShowQueue/showqueue";
export default function PlaylistScreen({seek, setSeek}){
    const [userInput,setUserInput] = useState("");
    const [playlistalbums,setPlaylistItems] = useState([]);
    const [playlistchanged,setPlaylistChanged] = useState(false)
    const [access_token,setAccessToken] = useState("");
    const getplaylist = async () =>{
        const access_token = await get_access_token()
        setAccessToken(access_token)
        let keys = await AsyncStorage.getAllKeys()
        const items = await AsyncStorage.multiGet(keys.filter((key) =>{return(key.includes("playlist:"))}))
        const playlistitems = items.map((item) =>{return(JSON.parse(item[1]))})
        setPlaylistItems(playlistitems)
    }

    useEffect(() =>{
        getplaylist()
    },[playlistchanged])
    const filterData = (item,index) =>{
        console.log(item,"hi")
        // {"playlist_name": "Jam", "playlist_size": 1, "playlist_thumbnail": "https://i.scdn.co/image/ab67616d0000b2733b9f8b18cc685e1502128aa8"} 
        if (userInput === ""){
            return(<PlaylistCard key={index} playlist={item} index={index} playlistchanged={playlistchanged} setPlaylistChanged={setPlaylistChanged} />)
        }
       
        if (item.playlist_name.toLowerCase().includes(userInput.toLowerCase())){
            return(
                <PlaylistCard key={index} playlist={item} index={index} playlistchanged={playlistchanged} setPlaylistChanged={setPlaylistChanged} />
            )
        } 

    }
    return(
        <View style={{flex:1,backgroundColor:"#141212"}}>
            {/*Header */}
            <View  style={{flex:0.08,backgroundColor:"green",flexDirection:"row",backgroundColor:"#141212"}}>
                    <View style={{flex:1,margin:10}}>
                    <Text style={{fontSize:20}}>CaesarAIMusicStream</Text>
                    
                    </View>
                    <View style={{flex:0.13,margin:10}}>
                    <Image style={{width:44,height:39}} source={require('../../assets/CaesarAILogo.png')} />
                    </View>

            </View>
            <View style={{flexDirection:"row",margin:10}}>
            <AntDesign style={{position:"relative",top:18}} name="filter"/>
            <TextInput style={{width:"100%"}} placeholder="Enter Here" onChangeText={(text) =>{setUserInput(text)}}/>
            </View>
            {/*Main Scroll Body*/}
  
            {playlistalbums.length > 0 && access_token !== ""  && 
            

            <FlatList 

            data={playlistalbums}
            style={{flex:1,backgroundColor:"#141212"}}
            renderItem={({item,index}) =>filterData(item,index)}
            />
    }
      

            {playlistalbums.length > 0 && access_token !== ""  && <ShowCurrentTrack searchscreen={true}/>}
            {playlistalbums.length > 0 && access_token !== "" && <ShowQueue/>}
            {playlistalbums.length > 0 && access_token !== ""  &&  <TrackProgress seek={seek} setSeek={setSeek}/>}
            {/*Navigation Footer*/}
            {playlistalbums.length === 0 && <View style={{flex:1}}></View>} 
           <NavigationFooter currentpage={"playlists"}/>


 
        </View>
    )
}