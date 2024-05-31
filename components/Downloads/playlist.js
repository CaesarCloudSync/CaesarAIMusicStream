import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  Button,
} from 'react-native';
import TrackPlayer, {
  useTrackPlayerEvents,
  usePlaybackState,
  Event,
  State
} from 'react-native-track-player';
import Icon from 'react-native-vector-icons/FontAwesome';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { setupPlayer, addTracks } from '../../trackPlayerServices';
import Footer from './footer';
export default function Playlist(props) {
    const [queue, setQueue] = useState([]);
    
    const [isPlayerReady, setIsPlayerReady] = useState(false);
    const [isplayingqueue,setISPlayingQueue] = useState(true);
    const addToQueue = async (title,index) =>{
      //console.log(index)
      props.nextqueue.unshift({title:title,index:index})
      //nextqueue.push()
    } 
    
  
    async function loadPlaylist() {
      const queue = await TrackPlayer.getQueue();
      //console.log(queue)
      setQueue(queue);
      setIsPlayerReady(false)
    }
  
    useEffect(() => {
      loadPlaylist();
    }, [isPlayerReady]);
  
    useTrackPlayerEvents([Event.PlaybackTrackChanged], async (event) => {
      //LOG  {"nextTrack": 1, "position": 248.849, "track": 0, "type": "playback-track-changed"}
      //console.log(event)
      //console.log(props.nextqueue)
      //console.log(props.seek)
      if(event.state == State.nextTrack || event.state === undefined) {
        if (props.nextqueue.length > 0){
 
          if (props.seek){
            let lastTrack = props.nextqueue.pop().index
            let currentTrack = await TrackPlayer.getCurrentTrack()
            let duration = await TrackPlayer.getDuration()
            props.setSeek(0)
            TrackPlayer.skip(lastTrack,currentTrack);
            TrackPlayer.seekTo(0)
            props.setCurrentTrack(currentTrack)
            setISPlayingQueue(true)
          }
          else{
            console.log("hi")
            if (isplayingqueue === true){
            props.setSeek(0)
            let lastTrack = props.nextqueue.pop().index
            props.setCurrentTrack(lastTrack)
            TrackPlayer.skip(lastTrack,props.currentTrack);
            TrackPlayer.seekTo(0)
            setISPlayingQueue(false)
          }
          else{
            setISPlayingQueue(true)
          }
            //TrackPlayer.getCurrentTrack().then((index) => props.setCurrentTrack(index));
          }

          }
        else{
          props.setSeek(0)
          TrackPlayer.getCurrentTrack().then((index) => props.setCurrentTrack(index));
      }
      
      }
    });
    useTrackPlayerEvents([Event.RemoteNext], async (event) => {
      if(event.state == State.nextTrack || event.state === undefined) {
        if (props.nextqueue.length > 0){
 
            let lastTrack = props.nextqueue.pop().index
            let currentTrack = await TrackPlayer.getCurrentTrack()
            let duration = await TrackPlayer.getDuration()
            //console.log(props.seek,duration)   
            props.setSeek(0)
            TrackPlayer.skip(lastTrack,currentTrack);
            
            TrackPlayer.seekTo(0)
            props.setCurrentTrack(currentTrack)
            TrackPlayer.play()
          

          }
        else{
          props.setSeek(0)
          TrackPlayer.getCurrentTrack().then((index) => props.setCurrentTrack(index));
      }
      
      }

    });
  
    function PlaylistItem({index, title, isCurrent}) {
  
      function handleItemPress() {
        TrackPlayer.skip(index);
      }
  
      return (
        <TouchableOpacity onPress={handleItemPress}>
          <View style={{display:"flex",flexDirection:"row"}}>
            <Text 
              style={{...styles.playlistItem,flex:1,
                ...{backgroundColor: isCurrent ? '#666' : "#141212"}}}>
            {title}
            </Text>
            <TouchableOpacity style={{backgroundColor:"#141212",padding:10}} onPress={()=>{addToQueue(title,index)}}> 
            <MaterialIcons
                name={"queue-music"}
                size={18}
     
                
                
            ></MaterialIcons>
            </TouchableOpacity>

          </View>
        </TouchableOpacity>
      );
    }
  

    async function setupReset() {
      let isSetup = await setupPlayer();
      props.setNextQueue([])
      await TrackPlayer.reset()
      //const queue = await TrackPlayer.getQueue();
      await addTracks();
      setIsPlayerReady(isSetup);
    }


  
    return(
      <View style={{flex:1.2}}>
        <TouchableOpacity style={{flex:0.10,justifyContent:"center",alignItems:"center",backgroundColor:"#764e2e",borderTopLeftRadius:5,borderTopRightRadius:5,borderBottomLeftRadius:2,borderBottomRightRadius:2}} onPress={setupReset}><Text >Change Songs</Text>
        </TouchableOpacity>
        <View style={styles.playlist}>  
          <FlatList
            data={queue}
          renderItem={({item, index}) =>  <PlaylistItem
                                                index={index}
                                                title={item.title}
                                                isCurrent={props.currentTrack == index }/>
                                          
            }
          />
        </View>
        
        
      </View>
    );
  }

const styles = StyleSheet.create({
    playlistItem: {
        fontSize: 16,
        paddingTop: 4,
        paddingBottom: 4,
        paddingLeft: 8,
        paddingRight: 8,
     
      },
      playlist: {
        flex:1,
        
      }
})