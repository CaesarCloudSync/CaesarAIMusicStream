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
import RNFS from "react-native-fs";
import { convertToValidFilename } from "../tool/tools";
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
        trackforplaylist[0]["playlist_local"] = "true"
        trackforplaylist[0]["playlist_name"] = trackforplaylist[0].name
        const thumbnail_filePath = RNFS.DocumentDirectoryPath + `/${convertToValidFilename(trackforplaylist[0].name)}.jpg`;
        await RNFS.downloadFile({
          fromUrl:trackforplaylist[0].thumbnail,
          toFile: thumbnail_filePath,
          background: true, // Enable downloading in the background (iOS only)
          discretionary: true, // Allow the OS to control the timing and speed (iOS only)
      
        })
        await AsyncStorage.setItem(`playlist:${trackforplaylist[0].name}`,JSON.stringify({"playlist_name":trackforplaylist[0].name,"playlist_thumbnail":`file://${thumbnail_filePath}`,"playlist_size":trackforplaylist.length}))
        const promises = trackforplaylist.map(async (track,index) => {
            await AsyncStorage.setItem(`playlist-track:${trackforplaylist[0].name}-${track.name}`,JSON.stringify(track))
            await AsyncStorage.setItem(`playlist-track-order:${trackforplaylist[0].name}-${track.name}`,JSON.stringify({"name":track.name,"order":index}))
        })
        await Promise.all(promises)
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
    const test = async () =>{
        const playlist = await AsyncStorage.getItem(`playlist:SOMETHING ABOUT`)
        console.log("playlist",playlist)
    }
    useEffect(() =>{
        test();
    },[])

 
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