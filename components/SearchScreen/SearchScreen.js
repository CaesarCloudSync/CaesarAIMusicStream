import { View,Text, ScrollView, FlatList,} from "react-native";

import NavigationFooter from "../NavigationFooter/NavigationFooter";
export default function Search(){

    return(
        <View style={{flex:1}}>
            {/*Header */}
            <View  style={{flex:0.15,backgroundColor:"green"}}>

            </View>
            {/*Main Scroll Body*/}
            <ScrollView style={{flex:1,backgroundColor:"yellow"}}>
            <Text style={{
    fontSize: 42,color:"black"
  }}>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
          eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad
          minim veniam, quis nostrud exercitation ullamco laboris nisi ut
          aliquip ex ea commodo consequat. Duis aute irure dolor in
          reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla
          pariatur. Excepteur sint occaecat cupidatat non proident, sunt in
          culpa qui officia deserunt mollit anim id est laborum.
        </Text>

            </ScrollView>
            {/*Song Progress Tracker */}
            <View style={{flex:0.10,backgroundColor:"red"}}>

            </View>

            {/*Navigation Footer*/}
            <NavigationFooter currentpage={"search"}/>


 
        </View>
    )
}