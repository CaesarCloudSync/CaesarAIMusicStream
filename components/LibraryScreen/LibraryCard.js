import { TouchableHighlight,Text,View,Image,TouchableOpacity } from "react-native"
import { useNavigate } from "react-router-native";
import Entypo from "react-native-vector-icons/Entypo"
import AsyncStorage from "@react-native-async-storage/async-storage";
export default function LibraryCard({album,index,setLibraryChanged,librarychanged}){
    console.log(album)
    const navigate = useNavigate();
    const getalbumtracks = async (route) =>{
        navigate(route, { state: album});

    }
    const removefromlibrary = async () =>{
        //console.log( await AsyncStorage.multiGet(keys.filter((key) =>{return(key.includes("library:"))})))
        await AsyncStorage.removeItem(`library:${album[0].album_name}|${album[0].artist}`)
        if (librarychanged === false){
            setLibraryChanged(true)
        }
        else{
            setLibraryChanged(false)
        }

    }
    return(
        <TouchableHighlight onPress={() =>{getalbumtracks("/tracks")}} key={index}style={{backgroundColor:"#141212",height:50,borderRadius: 5,borderWidth: 3,flexBasis:"47%",margin:5,borderColor:"#141212"}}>
        <View   style={{backgroundColor:"#141212",flexDirection:"row",justifyContent:"center",alignItems:"center",flex:3}}>
            <View style={{flex:2.0 }}>
                <Image style={{width: '100%', height: '100%'}} source={{uri:album[0].thumbnail}}></Image>
            </View>
            <View style={{padding:10}}>
            </View>
            <Text style={{color:"white",flex:10}}>
                {album[0].album_name} | {album[0].artist}
            </Text>
            <TouchableOpacity onPress={() =>{removefromlibrary()}} style={{flex:4,width:"100%",height:"100%",justifyContent:"center",alignItems:"center"}}>
                <Entypo  name="squared-cross" style={{fontSize:25,color:"white"}}/>

                    
                </TouchableOpacity>


            





        </View>
        
    </TouchableHighlight>
    )
}