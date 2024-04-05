import { View,Text, ScrollView, FlatList,Image} from "react-native";

import NavigationFooter from "../NavigationFooter/NavigationFooter";
import { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import TrackProgress from "../TrackProgress/TrackProgress";
import ShowCurrentTrack from "../ShowCurrentTrack/ShowCurrentTrack";
import { get_access_token } from "../access_token/getaccesstoken";

import { TouchableHighlight } from "react-native";
import LibraryCard from "./LibraryCard";
export default function LibraryScreen(){
    const [libraryalbums,setLibraryItems] = useState([]);
    const [librarychanged,setLibraryChanged] = useState(false)
    const [access_token,setAccessToken] = useState("");
    const getlibrary = async () =>{
        const access_token = await get_access_token()
        setAccessToken(access_token)
        let keys = await AsyncStorage.getAllKeys()
        const items = await AsyncStorage.multiGet(keys.filter((key) =>{return(key.includes("library:"))}))
        setLibraryItems(items)
        //console.log(items)
    }

    useEffect(() =>{
        getlibrary()
    },[librarychanged])
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
            {/*Main Scroll Body*/}
            <ScrollView style={{flex:1,backgroundColor:"#141212"}}>
            {libraryalbums.length > 0 && access_token !== ""  && 
            
            libraryalbums.map((albumitems,index) =>{ 
                let album = JSON.parse(albumitems[1])
                return(
                    <LibraryCard key={index} album={album} index={index} librarychanged={librarychanged} setLibraryChanged={setLibraryChanged} />
                )
            })
            
            }

            </ScrollView>

            <ShowCurrentTrack searchscreen={true}/>
            <TrackProgress/>
            {/*Navigation Footer*/}
            <NavigationFooter currentpage={"library"}/>


 
        </View>
    )
}