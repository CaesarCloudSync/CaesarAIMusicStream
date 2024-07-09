import React, { useEffect, useState } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  ActivityIndicator,
  View,
  Text,
  Image
} from 'react-native';
import { FlatList } from 'react-native';
import TrackProgress from '../TrackProgress/TrackProgress';
import ShowCurrentTrack from '../ShowCurrentTrack/ShowCurrentTrack';
import { useNetInfo } from '@react-native-community/netinfo';
import ShowQueue from '../ShowQueue/showqueue';
import NavigationFooter from '../NavigationFooter/NavigationFooter';
import DownloadedPlaylistCard from './DownloadedPlaylistCard';
import AllDownloadedPlaylistCard from './AllDownloadedPlaylistCard';
export default function Downloads({seek, setSeek}) { 
  const netInfo = useNetInfo();


  const [downloadedplaylistchanged,setDownloadedPlaylistChanged] = useState(false);


  
  return (
    <SafeAreaView style={{flex:1,backgroundColor:"#141212"}}>
            <View  style={{flex:0.13,backgroundColor:"green",flexDirection:"row",backgroundColor:"#141212"}}>
                <View style={{flex:1,margin:10}}>
                <Text style={{fontSize:20}}>CaesarAIMusicStream</Text>
                
                </View>
                <View style={{flex:0.13,margin:10}}>
                <Image style={{borderRadius:5,width:44,height:39}} source={require('../../assets/CaesarAILogo.png')} />
                </View>

            </View>
            <View style={{flex:0.05}}>
              <AllDownloadedPlaylistCard  />
            </View>
            {/*
                        <FlatList 

            data={downloadedplaylists}
            style={{flex:1,backgroundColor:"#141212"}}
            renderItem={({item,index}) => <DownloadedPlaylistCard  key={index} downloadedplaylist={item} index={index} downloadedplaylistchanged={downloadedplaylistchanged} setDownloadedPlaylistChanged={setDownloadedPlaylistChanged}/>}
            /> */}

            <View style={{flex:1}}></View>
            <ShowCurrentTrack searchscreen={true}/>
            <ShowQueue/>
            <TrackProgress seek={seek} setSeek={setSeek}/>
            <NavigationFooter currentpage={"downloads"}/>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      padding: 20,
      backgroundColor: '#112'
    },
  });