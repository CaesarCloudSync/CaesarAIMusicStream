import { useEffect, useState } from "react";
import { Modal } from "./modal"
import { TouchableOpacity } from "react-native";
import { Button } from "react-native-elements";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Text,FlatList } from "react-native";
import PlaylistCard from "../PlaylistsScreen/PlaylistCard";
import { useNavigate } from "react-router-native";
import AntDesign from "react-native-vector-icons/AntDesign"
import { TextInput,View } from "react-native";
import Entypo from "react-native-vector-icons/Entypo";
export default function PlaylistModal({isModalVisible,setIsModalVisible,trackforplaylist}){
    const [playlists,setPlaylists] = useState([]);
    const [userInput,setUserInput] = useState("");
    const navigate = useNavigate()
    const handleModal = () => setIsModalVisible(() => !isModalVisible);
    const [playlistchanged,setPlaylistChanged] = useState(false)
    const getplaylist = async () =>{
        let keys = await AsyncStorage.getAllKeys()
        const items = await AsyncStorage.multiGet(keys.filter((key) =>{return(key.includes("playlist:"))}))
        const playlistitems = items.map((item) =>{return(JSON.parse(item[1]))})
        //console.log("playlist",playlistitems)
        setPlaylists(playlistitems)
    }

    useEffect(() =>{
        getplaylist()
    },[playlistchanged])
    const createplaylist = async () =>{
        trackforplaylist["playlist_local"] = "true"
        trackforplaylist["playlist_name"] = trackforplaylist.name
        await AsyncStorage.setItem(`playlist:${trackforplaylist.name}`,JSON.stringify({"playlist_name":trackforplaylist.name,"playlist_thumbnail":trackforplaylist.thumbnail,"playlist_size":1}))
        await AsyncStorage.setItem(`playlist-track:${trackforplaylist.name}-${trackforplaylist.name}`,JSON.stringify(trackforplaylist))
        await AsyncStorage.setItem(`playlist-track-order:${trackforplaylist.name}-${trackforplaylist.name}`,JSON.stringify({"name":trackforplaylist.name,"order":0}))
        navigate("/playlists")

    }

    const filterData = (item,index) =>{


        // {"playlist_name": "Jam", "playlist_size": 1, "playlist_thumbnail": "https://i.scdn.co/image/ab67616d0000b2733b9f8b18cc685e1502128aa8"} 
        if (userInput === ""){
            return(<PlaylistCard key={index} playlist={item} index={index} playlistchanged={playlistchanged} setPlaylistChanged={setPlaylistChanged} trackforplaylist={trackforplaylist} handleModal={handleModal} />)
        }
       
        if (item.playlist_name.toLowerCase().includes(userInput.toLowerCase())){
            return(
                <PlaylistCard key={index} playlist={item} index={index} playlistchanged={playlistchanged} setPlaylistChanged={setPlaylistChanged} trackforplaylist={trackforplaylist} handleModal={handleModal} />
            )
        } 

    }


 
    return(
        <Modal isVisible={isModalVisible}>
        <Modal.Container>

            <Modal.Body>
                <View style={{flexDirection:"row",margin:10}}>
                <AntDesign style={{position:"relative",top:18}} name="filter"/>
                <TextInput style={{width:"93%"}} placeholder="Enter Here" onChangeText={(text) =>{setUserInput(text)}}/>
                <TouchableOpacity onPress={() =>{handleModal()}} style={{top:10}} >
                    <Entypo name="cross" size={20}></Entypo>
                </TouchableOpacity>
                </View>
                <TouchableOpacity onPress={() =>{createplaylist()}} style={{height:60,justifyContent:"center",borderWidth:1,borderColor:"white",borderRadius:5,padding:5}}>
                <   Text style={{"color":"white"}}>+ New Playlist</Text>
                </TouchableOpacity>

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