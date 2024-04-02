import { View,Text,Image } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

import { Link } from "react-router-native";
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
export default function NavigationFooter({currentpage}){
    return(
        <View style={{flex:0.13,backgroundColor:"blue"}}>
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
                 <Link underlayColor={"transparent"} to="/search" style={{backgroundColor:"transparent"}}>
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
            <Link underlayColor={"transparent"} to="/library">
                <View>
                    <MaterialIcons name="library-music" style={{fontSize:30,color:currentpage=== "library" ? "white" :""}}></MaterialIcons>
                    
                        <Text style={{fontSize:10,color:currentpage=== "library" ? "white" :""}}>
                            Library
                        </Text>
                

                </View>
            </Link>
        </View>
        <View style={{flex:1,justifyContent:"center",alignItems:"center"}}>
            <View>
                <MaterialCommunityIcons name="playlist-play" style={{fontSize:30}}></MaterialCommunityIcons>
                <Link to="/que">
                    <Text style={{fontSize:10}}>
                        Queue
                    </Text>
                </Link>

            </View>
        </View>


            
            

        </View>

    </View>
    )
}