import { View,Text, ScrollView, FlatList,Image} from "react-native";

import NavigationFooter from "../NavigationFooter/NavigationFooter";
import { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import TrackProgress from "../TrackProgress/TrackProgress";
import ShowCurrentTrack from "../ShowCurrentTrack/ShowCurrentTrack";
import { get_access_token } from "../access_token/getaccesstoken";

import { TouchableHighlight } from "react-native";
import LibraryCard from "./LibraryCard";
import { TextInput } from "react-native-gesture-handler";
import AntDesign from "react-native-vector-icons/AntDesign"
import ShowQueue from "../ShowQueue/showqueue";
export default function LibraryScreen(){
    const [userInput,setUserInput] = useState("");
    const [libraryalbums,setLibraryItems] = useState([]);
    const [librarychanged,setLibraryChanged] = useState(false)
    const [access_token,setAccessToken] = useState("");
    const getlibrary = async () =>{
        const access_token = await get_access_token()
        setAccessToken(access_token)
        let keys = await AsyncStorage.getAllKeys()
        const items = await AsyncStorage.multiGet(keys.filter((key) =>{return(key.includes("library:"))}))
        setLibraryItems(items)
    }

    useEffect(() =>{
        getlibrary()
    },[librarychanged])
    const filterData = (item,index) =>{
        let album = JSON.parse(item[1])
        if (userInput === ""){
            return(<LibraryCard key={index} album={album} index={index} librarychanged={librarychanged} setLibraryChanged={setLibraryChanged} />)
        }
       
        if (album[0].album_name.toLowerCase().includes(userInput.toLowerCase())  || album[0].artist.toLowerCase().includes(userInput.toLowerCase()) ){
            return(
                <LibraryCard key={index} album={album} index={index} librarychanged={librarychanged} setLibraryChanged={setLibraryChanged} />
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
                    <Image style={{borderRadius:5,width:44,height:39}} source={require('../../assets/CaesarAILogo.png')} />
                    </View>

            </View>
            <View style={{flexDirection:"row",margin:10}}>
            <AntDesign style={{position:"relative",top:18}} name="filter"/>
            <TextInput style={{width:"100%"}} placeholder="Enter Here" onChangeText={(text) =>{setUserInput(text)}}/>
            </View>
            {/*Main Scroll Body*/}
  
            {libraryalbums.length > 0 && access_token !== ""  && 
            

            <FlatList 

            data={libraryalbums}
            style={{flex:1,backgroundColor:"#141212"}}
            renderItem={({item,index}) =>filterData(item,index)}
            />
    }
      

            {libraryalbums.length > 0 && access_token !== ""  && <ShowCurrentTrack searchscreen={true}/>}
            {libraryalbums.length > 0 && access_token !== "" && <ShowQueue/>}
            {libraryalbums.length > 0 && access_token !== ""  &&  <TrackProgress/>}
            {/*Navigation Footer*/}
            {libraryalbums.length === 0 && <View style={{flex:1}}></View>} 
           <NavigationFooter currentpage={"library"}/>


 
        </View>
    )
}