import { View,Text, ScrollView, FlatList,Image,TextInput} from "react-native";
import { useState,useEffect} from "react";
import TrackProgress from "../TrackProgress/TrackProgress";
import NavigationFooter from "../NavigationFooter/NavigationFooter";
import { get_access_token } from "../access_token/getaccesstoken";
import { FavouritePlaylists } from "../HomeScreen/FavouriteRenders";
import AntDesign from "react-native-vector-icons/AntDesign"
import axios from "axios";
import BottomModal from "./bottomModal";
import * as MIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useNetInfo} from "@react-native-community/netinfo";
import ShowCurrentTrack from "../ShowCurrentTrack/ShowCurrentTrack";
export default function Search({seek, setSeek}){
    const netInfo = useNetInfo()
    const [text, onChangeText] = useState("")
    const [access_token,setAccessToken] = useState("");
    const [initialfeed,setInitialFeed] = useState([]);
    const [songs,setSongs] = useState([]);
    const [isModalVisible, setModalVisible] = useState(false);
    const toggleModal = () => {
        setModalVisible(!isModalVisible);
      };
    
    const getinitialrnb = async () =>{
        const access_token = await get_access_token();
        const headers = {Authorization: `Bearer ${access_token}`}
        const resp = await fetch('https://api.spotify.com/v1/recommendations?limit=50&seed_genres=r-n-b&seed_artists=2h93pZq0e7k5yf4dywlkpM,31W5EY0aAly4Qieq6OFu6I,2jku7tDXc6XoB6MO2hFuqg', {headers: headers})
        const feedresult = await resp.json()

        const result = feedresult.tracks.map((album) =>{return({"id":album.album.id,"name":album.album.name,"images":[{"url":album.album.images[0].url}],"artists":[{"name":album.album.artists[0].name}],"total_tracks":album.album.total_tracks,"release_date":album.album.release_date,"album_type":album.album.album_type})})
  
        setAccessToken(access_token)
        setInitialFeed(result)
        
        //console.log(feedresult)

    }
    const searchsongs = async () =>{
        const headers = {Authorization: `Bearer ${access_token}`}
        //console.log(text)
        const resp = await fetch(`https://api.spotify.com/v1/search?q=${text}&limit=20&type=artist,album,track`, {headers: headers})
        const feedresult = await resp.json()
        const result = feedresult.albums.items.map((album) =>{return({"id":album.id,"name":album.name,"images":[{"url":album.images[0].url}],"artists":[{"name":album.artists[0].name}],"total_tracks":album.total_tracks,"release_date":album.release_date,"album_type":album.album_type})})
        setSongs(result)
        toggleModal()
    }
    useEffect(() =>{
        if (netInfo.isInternetReachable === true){
            getinitialrnb()
        }


    },[netInfo])
    if (netInfo.isInternetReachable){
    return(
        <View style={{flex:1,backgroundColor:"#141212"}}>
            {/*Header */}
            <View  style={{flex:0.18,backgroundColor:"green",flexDirection:"row",backgroundColor:"#141212"}}>
                <View style={{flex:1, margin: 12,padding: 10,}}>

                <TextInput
                onSubmitEditing={() =>{searchsongs()}}
                placeholder="What song would you like to listen to?"
                placeholderTextColor={'black'}
                style={ {
                    height: 40,
                   
                    borderWidth: 1,
                    
                    backgroundColor:"white",
                    color:"black"
                  }}
                onChangeText={onChangeText}
                value={text}
            />
                
                </View>
                <View style={{flex:0.13,margin:1,marginTop:22,marginRight:10}}>
                <Image style={{width:44,height:39}} source={require('../../assets/CaesarAILogo.png')} />
                </View>

            </View>
            {/*Main Scroll Body*/}
            <ScrollView style={{flex:1,backgroundColor:"#141212"}}>
            {initialfeed.length > 0 && access_token !== ""  && <FavouritePlaylists access_token={access_token} favouritecards={true} playlists={initialfeed}/>}

            </ScrollView>
            <ShowCurrentTrack searchscreen={true}/>
            {/*Song Progress Tracker */}
            <View style={{flex:0.08,backgroundColor:"#141212",justifyContent:"center",alignItems:"center"}}>
                <TrackProgress seek={seek} setSeek={setSeek}/>

            </View>
                  
            {/*Navigation Footer*/}
            <NavigationFooter currentpage={"search"}/>
            <BottomModal access_token={access_token} songs={songs} isModalVisible={isModalVisible} toggleModal={toggleModal} setModalVisible={setModalVisible} ></BottomModal>
          


 
        </View>
    )}
    else{
        return(
            <View style={{flex:1}}>
                {/*Header */}
                <View  style={{flex:0.08,backgroundColor:"green",flexDirection:"row",backgroundColor:"#141212"}}>
                    <View style={{flex:1,margin:10}}>
                    <Text style={{fontSize:20}}>CaesarAIMusicStream</Text>
                    
                    </View>
                    <View style={{flex:0.13,margin:10}}>
                    <Image style={{width:44,height:39}} source={require('../../assets/CaesarAILogo.png')} />
                    </View>

                </View>
                {/* No Internet Main Body */}
                <View style={{flex:1,backgroundColor:"#141212",justifyContent:"center",alignItems:"center"}}>
                    <Text style={{fontSize:30}}>No Internet Connection</Text>
                    <Text>
                    Play your Downloads
                    </Text>
                </View>

                {/*Song Progress Tracker */}
                
                <View style={{flex:0.08,backgroundColor:"#141212",justifyContent:"center",alignItems:"center"}}>
                    <TrackProgress seek={seek} setSeek={setSeek}/>

                </View>

                {/*Navigation Footer*/}
                <NavigationFooter currentpage={"search"}/>

            </View>
        )
        
    }
}