import { View,Text,Image, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

import { Link } from "react-router-native";
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import TrackPlayer from 'react-native-track-player';
import InAppBrowser from 'react-native-inappbrowser-reborn';
export default function NavigationFooter({currentpage,setShowCustomYTInput}){

    async function openLink() {
        try {
          const isAvailable = await InAppBrowser.isAvailable()
          const url = 'https://youtube.com'
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
                setShowCustomYTInput(true);
              //Alert.alert(JSON.stringify(result))
            })
          } else Linking.openURL(url)
        } catch (error) {
          Alert.alert(error.message)
        }
      }
  

    return(
        <View style={{flex:0.13,backgroundColor:"#141212"}}>
        <View style={{flexDirection:"row",justifyContent:"center",alignItems:"center",flex:1}}>
        <View style={{flex:1,justifyContent:"center",alignItems:"center"}}>
            <Link underlayColor={"transparent"} to="/">
                <View>
                    
                    <Icon name="home" style={{fontSize:30,color:currentpage=== "home" ? "white" :""}}></Icon>
                
                        <Text style={{fontSize:10,color:currentpage=== "home" ? "white" :""}}>
                            Home
                        </Text>
                    

                </View>
            </Link>
        </View>
        <View style={{flex:1,justifyContent:"center",alignItems:"center"}}>
            <View>
                
                {currentpage === "search" ?
                <View>
                    <Image source={require('./search-filled.png')} style={{width: 35, height: 35}} />
                    <Text style={{fontSize:10}}>
                        Search
                    </Text>
                </View>:
                 <Link  underlayColor={"transparent"} to="/search" style={{backgroundColor:"transparent"}}>
                    <View>
                
                        <Icon name="search" style={{fontSize:30}}></Icon>
                    
        
                    
                    <Text style={{fontSize:10}}>
                            Search
                        </Text>
                    </View>
                </Link>
                }


            </View>
        </View>
        <View style={{flex:1,justifyContent:"center",alignItems:"center"}}>
            <Link   underlayColor={"transparent"} >
                <TouchableOpacity onLongPress={() =>{if (setShowCustomYTInput){openLink()}}}>
              
                    <Image style={{borderRadius:5,width:44,height:39}} source={require('../../assets/CaesarAILogo.png')} />
                    
     
                </TouchableOpacity>
            </Link>
        </View>
        <View style={{flex:1,justifyContent:"center",alignItems:"center"}}>
            <Link  underlayColor={"transparent"} to="/library">
                <View>
                    <MaterialIcons name="my-library-books" style={{fontSize:30,color:currentpage=== "library" ? "white" :""}}></MaterialIcons>
                    
                        <Text style={{fontSize:10,color:currentpage=== "library" ? "white" :""}}>
                            Library
                        </Text>
                

                </View>
            </Link>
        </View>
        <View style={{flex:1,justifyContent:"center",alignItems:"center"}}>
            <Link  underlayColor={"transparent"} to="/playlists">
                <View>
                    <MaterialIcons name="library-music" style={{fontSize:30,color:currentpage=== "playlists" ? "white" :""}}></MaterialIcons>
                    
                        <Text style={{fontSize:10,color:currentpage=== "playlists" ? "white" :""}}>
                            Playlists
                        </Text>
                

                </View>
            </Link>
        </View>
        






            
            

        </View>

    </View>
    )
}