import { useEffect, useState } from "react";
import { Modal } from "../PlaylistModal/modal";
import { TouchableOpacity } from "react-native";
import { Button } from "react-native-elements";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Text,FlatList } from "react-native";
import PlaylistCard from "../PlaylistsScreen/PlaylistCard";
import { useNavigate } from "react-router-native";
import AntDesign from "react-native-vector-icons/AntDesign"
import { TextInput,View } from "react-native";
import Entypo from "react-native-vector-icons/Entypo";
import RNFS from "react-native-fs";
import { Image } from "react-native";
import { convertToValidFilename } from "../tool/tools";
import { get_access_token } from "../access_token/getaccesstoken";
import MaterialDesignIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import InAppBrowser from 'react-native-inappbrowser-reborn';
export default function AddSpotifyPlaylistModal({isModalVisible,setIsModalVisible,playlistchanged,setPlaylistChanged}) {
    const [playlists,setPlaylists] = useState([]);
    const [userInput,setUserInput] = useState("");
    const navigate = useNavigate()
    const handleModal = () => setIsModalVisible(() => !isModalVisible);
    const storeonlineplaylist = async (album_tracks) =>{
        //console.log("playlist",album_tracks)
        if ("playlist_thumbnail" in album_tracks[0]){   
            console.log("playlistname")
            const promisestore = album_tracks.map(async (playlist_track) =>{
            playlist_track["playlist_local"] = "true"
            await AsyncStorage.setItem(`playlist-track:${playlist_track.playlist_name}-${playlist_track.name}`,JSON.stringify(playlist_track))
            })
            await Promise.all(promisestore)
    
            let keys = await AsyncStorage.getAllKeys()
            const items = await AsyncStorage.multiGet(keys.filter((key) =>{return(key.includes(`playlist-track:${album_tracks[0].playlist_name}`))}))
            const playlist_tracks = items.map((item) =>{return(JSON.parse(item[1]))})
            let num_of_tracks = playlist_tracks.length
            const thumbnail_filePath = RNFS.DocumentDirectoryPath + `/${convertToValidFilename(album_tracks[0].playlist_name)}.jpg`;
            await RNFS.downloadFile({
              fromUrl:album_tracks[0].playlist_thumbnail,
              toFile: thumbnail_filePath,
              background: true, // Enable downloading in the background (iOS only)
              discretionary: true, // Allow the OS to control the timing and speed (iOS only)
          
            })
            await AsyncStorage.setItem(`playlist:${album_tracks[0].playlist_name}`,JSON.stringify({"playlist_name":album_tracks[0].playlist_name,"playlist_thumbnail":`file://${thumbnail_filePath}`,"playlist_size":num_of_tracks}))
            const promiseorder = album_tracks.map(async (playlist_track,ind) =>{
                await AsyncStorage.setItem(`playlist-track-order:${playlist_track.playlist_name}-${playlist_track.name}`,JSON.stringify({"name":playlist_track.name,"order":ind}))
            })
            await Promise.all(promiseorder)
            setIsModalVisible(false)
            console.log("playlist stored")
            if (playlistchanged === false){
                setPlaylistChanged(true)
            }
            else{
                setPlaylistChanged(false)
            }
            
        }
    }
        async function openLink() {
            try {
              const isAvailable = await InAppBrowser.isAvailable()
              const url = 'https://open.spotify.com/'
              if (isAvailable) {
                InAppBrowser.open(url, {
                  // iOS Properties
                  dismissButtonStyle: 'cancel',
                  preferredBarTintColor: 'gray',
                  preferredControlTintColor: 'white',
                  // Android Properties
                  showTitle: true,
                  toolbarColor: '#6200EE',
                  secondaryToolbarColor: 'black',
                  enableUrlBarHiding: true,
                  enableDefaultShare: true,
                  forceCloseOnRedirection: true,
                }).then((result) => {
                     //setShowCustomYTInput(true);
                  //Alert.alert(JSON.stringify(result))
                })
              } else Linking.openURL(url)
            } catch (error) {
              Alert.alert(error.message)
            }
          }
      
    
    const storespotifyplaylist = async () =>{
        try{
        const match = userInput.match(/playlist\/([a-zA-Z0-9]+)/);

        if (match) {
        const playlist_id = match[1];
     
        const access_token = await get_access_token()
        const headers = {Authorization: `Bearer ${access_token}`}
        const resp = await fetch(`https://api.spotify.com/v1/playlists/${playlist_id }`, {headers: headers})
        const feedresult = await resp.json()
        const playlist_thumbnail = feedresult.images.length > 0 ? feedresult.images[0].url : feedresult.tracks.items[0].track.album.images[0].url;
        const playlist_name = `${feedresult.name} - ${feedresult.owner.display_name}`;
        let album_tracks = feedresult.tracks.items.map((trackitem) =>{let track = trackitem.track;return({"playlist_thumbnail":playlist_thumbnail,"playlist_id":feedresult.id,"playlist_name":playlist_name,"album_id":track.album.id,"album_name":track.album.name,"name":track.name,"id":track.id,"artist":track.artists[0].name,"artist_id":track.artists[0].id,"thumbnail":track.album.images[0].url,"track_number":track.track_number,"duration_ms":track.duration_ms})})
        storeonlineplaylist(album_tracks)
        }
        else {
            alert("Invalid Spotify Playlist URL: " + userInput)
            // TODO: Next do it to be able to import a youtube playlist.
        }
    }
    catch (error) {
        console.error("Error fetching Spotify playlist:", error);
        alert("Error fetching Spotify playlist. Please check the URL and try again.",error);
    }

    }

 
    return(
        <Modal isVisible={isModalVisible}>
        <Modal.Container>

            <Modal.Body>
                <View style={{flexDirection:"row",margin:10,height:50}}>
                <View style={{width:"93%"}}></View>
                <TouchableOpacity onPress={() =>{handleModal()}} style={{top:10}} >
                    <Entypo name="cross" size={20}></Entypo>
                </TouchableOpacity>
                </View>
               
             
                <TextInput style={{height:60,justifyContent:"center",borderWidth:1,borderColor:"white",borderRadius:5,padding:5,alignItems:"center",padding:10}} placeholder="Spotify Playlist URL:" onChangeText={(text) =>{setUserInput(text)}} onSubmitEditing={storespotifyplaylist}/>
                  <Text style={{color:"white",fontSize:10,marginLeft:10}}>Add Playlist owned by a Spotify user.</Text>
                  <TouchableOpacity style={{alignSelf:"flex-end",marginTop:30}} onPress={()=>{openLink()}}><MaterialDesignIcons name="web" size={20} /></TouchableOpacity>

            <FlatList 

            data={playlists}
            style={{flex:1,backgroundColor:"#141212"}}
            renderItem={({item,index}) =>filterData(item,index)}
            />
            </Modal.Body>

        </Modal.Container>
</Modal>
    )
}