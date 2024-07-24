import { useEffect, useState } from "react";
import { Modal } from "./modal"
import { Alert, TouchableOpacity } from "react-native";
import { Button } from "react-native-elements";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Text,FlatList } from "react-native";
import PlaylistCard from "../PlaylistsScreen/PlaylistCard";
import { useNavigate } from "react-router-native";
import AntDesign from "react-native-vector-icons/AntDesign"
import { TextInput,View } from "react-native";
import Entypo from "react-native-vector-icons/Entypo";
import { Image } from "react-native";
import axios from "axios";
export default function CustomYTModal({playlist_details,setPlaylistDetails,isModalVisible,setIsModalVisible,setPlaylistChanged,playlistchanged}){
    const [playlists,setPlaylists] = useState([]);
    const [userInput,setUserInput] = useState("");
    const navigate = useNavigate();
    const handleModal = () => setIsModalVisible(() => !isModalVisible);
    // {"album_id": "2ygz2yoIAR5S9WWIxnvkAL", "album_name": "STARFACE", "artist": "Lava La Rue", "artist_id": "271bbpX3pdCi56ZJA1jQ43", "duration_ms": 195857, "id": "13pVWYP4Bg03zb7VHiC1Us", "name": "Manifestation Manifesto", "playlist_local": "true", "playlist_name": "BUSSDOWN", "thumbnail": "https://i.scdn.co/image/ab67616d00001e022e975b1e2113c800d86e02fd", "track_number": 3}
    const addtracktoplaylist = async (trackforplaylist) =>{

     
        await AsyncStorage.setItem(`playlist-track:${playlist_details.playlist_name}-${trackforplaylist.name}`,JSON.stringify(trackforplaylist))
        let keys = await AsyncStorage.getAllKeys()
        const items = await AsyncStorage.multiGet(keys.filter((key) =>{return(key.includes(`playlist-track:${playlist_details.playlist_name}`))}))
        const playlist_tracks = items.map((item) =>{return(JSON.parse(item[1]))})
        const num_of_tracks = playlist_tracks.length
        await AsyncStorage.setItem(`playlist:${playlist_details.playlist_name}`,JSON.stringify({"playlist_name":playlist_details.playlist_name,"playlist_thumbnail":playlist_details.playlist_thumbnail,"playlist_size":num_of_tracks}))
        await AsyncStorage.setItem(`playlist-track-order:${playlist_details.playlist_name}-${trackforplaylist.name}`,JSON.stringify({"name":trackforplaylist.name,"order":num_of_tracks -1}))
        setPlaylistDetails({...playlist_details,"playlist_size":num_of_tracks})
        handleModal()
        if (playlistchanged === false){
            setPlaylistChanged(true)
        }
        else{
            setPlaylistChanged(false)
        }
       
        //navigate("/playlists")

    
}

    const getcustomyt = async () =>{
      
        if (userInput.includes("https")){
            let ytlink = userInput.replace("m.","")
            const response = await axios.get(`https://caesaraimusicstreamyt-qqbn26mgpa-nw.a.run.app/getytaudio?url=${ytlink}`)
            let result = response.data
          
            if ("error" in result){
                Alert.alert(result.error)
            }
            else{
                let trackforplaylist = {"album_id": result.ytid, "album_name":result.album_name, "artist": result.artist, "artist_id": result.artist_id, "duration_ms": result.duration_ms, "id": result.ytid, "name": result.title, "playlist_local": "true", "playlist_name": playlist_details.playlist_name, "thumbnail": result.thumbnail, "track_number": 1,"ytcustom":"true"}
                console.log(trackforplaylist)
                await addtracktoplaylist(trackforplaylist)
            }
        }
        
    }

    return(
        <Modal isVisible={isModalVisible}>
        <Modal.Container>
        <TouchableOpacity onPress={() =>{handleModal()}} style={{top:10,right:15,alignItems:"flex-end"}} >
                    <Entypo name="cross" size={20}></Entypo>
                </TouchableOpacity>

            <Modal.Body>
                
                <View style={{flexDirection:"row",width:300,gap:20}}>
                 
                <Image style={{borderRadius:5,width:44,height:39}} source={require('../../assets/CaesarAILogo.png')} />
                <TextInput onSubmitEditing={() =>{getcustomyt()}} onChangeText={(text) =>{setUserInput(text)}} style={{borderRadius:5,bottom:5,borderWidth:1,borderColor:"white",width:"100%",left:5}} placeholder="Enter YT Link:"></TextInput>
                </View>
                

            </Modal.Body>

        </Modal.Container>
</Modal>
    )
}