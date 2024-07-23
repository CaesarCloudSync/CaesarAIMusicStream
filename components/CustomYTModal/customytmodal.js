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
import { Image } from "react-native";
import axios from "axios";
export default function CustomYTModal({isModalVisible,setIsModalVisible}){
    const [playlists,setPlaylists] = useState([]);
    const [userInput,setUserInput] = useState("");
    const navigate = useNavigate();
    const handleModal = () => setIsModalVisible(() => !isModalVisible);

    const getcustomyt = async () =>{
      
        if (userInput.includes("https")){
            let ytlink = userInput.replace("m.","")
            const response = await axios.get(`https://caesaraimusicstreamyt-qqbn26mgpa-nw.a.run.app/getytaudio?url=${ytlink}`)
            let result = response.data
            console.log(result)
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