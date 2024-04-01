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
import * as MIcon from 'react-native-vector-icons/MaterialIcons';
import { setupPlayer, addTracks } from '../trackPlayerServices';
import Footer from './footer';
export default function Playlist(props) {
    const [queue, setQueue] = useState([]);
    const [currentTrack, setCurrentTrack] = useState(0);
    const [isPlayerReady, setIsPlayerReady] = useState(false);
    const [isplayingqueue,setISPlayingQueue] = useState(true);
    const addToQueue = async (title,index) =>{
      //console.log(index)
      props.nextqueue.unshift({title:title,index:index})
      //nextqueue.push()
    } 
    
  
    async function loadPlaylist() {
      const queue = await TrackPlayer.getQueue();
      setQueue(queue);
      setIsPlayerReady(false)
    }
  
    useEffect(() => {
      loadPlaylist();
    }, [isPlayerReady]);
  
    useTrackPlayerEvents([Event.PlaybackTrackChanged], async (event) => {
      //LOG  {"nextTrack": 1, "position": 248.849, "track": 0, "type": "playback-track-changed"}
      console.log(event)
      console.log(props.nextqueue)
      console.log(props.seek)
      if(event.state == State.nextTrack || event.state === undefined) {
        if (props.nextqueue.length > 0){
 
          if (props.seek){
            let lastTrack = props.nextqueue.pop().index
            let currentTrack = await TrackPlayer.getCurrentTrack()
            let duration = await TrackPlayer.getDuration()
            props.setSeek(0)
            TrackPlayer.skip(lastTrack,currentTrack);
            TrackPlayer.seekTo(0)
            setCurrentTrack(currentTrack)
            setISPlayingQueue(true)
          }
          else{
            console.log("hi")
            if (isplayingqueue === true){
            props.setSeek(0)
            let lastTrack = props.nextqueue.pop().index
            setCurrentTrack(lastTrack)
            TrackPlayer.skip(lastTrack,currentTrack);
            TrackPlayer.seekTo(0)
            setISPlayingQueue(false)
          }
          else{
            setISPlayingQueue(true)
          }
            //TrackPlayer.getCurrentTrack().then((index) => setCurrentTrack(index));
          }

          }
        else{
          props.setSeek(0)
          TrackPlayer.getCurrentTrack().then((index) => setCurrentTrack(index));
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
            setCurrentTrack(currentTrack)
            TrackPlayer.play()
          

          }
        else{
          props.setSeek(0)
          TrackPlayer.getCurrentTrack().then((index) => setCurrentTrack(index));
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
                ...{backgroundColor: isCurrent ? '#666' : 'transparent'}}}>
            {title}
            </Text>
            <MIcon.Button 
                name={"queue-music"}
                size={18}
                backgroundColor="transparent"
                onPress={()=>{addToQueue(title,index)}}
            ></MIcon.Button>
          </View>
        </TouchableOpacity>
      );
    }
  
    async function handleShuffle() {
      let queue = await TrackPlayer.getQueue();
      await TrackPlayer.reset();
      queue.sort(() => Math.random() - 0.5);
      await TrackPlayer.add(queue);
  
      loadPlaylist()
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
      <View style={{flex:1}}>
        <Controls nextqueue={props.nextqueue} setSeek={props.setSeek} onShuffle={handleShuffle}/>
        <View style={styles.playlist}>
          <Button title='Change Songs' onPress={setupReset}></Button>
          <FlatList
            data={queue}
            renderItem={({item, index}) => <PlaylistItem
                                              index={index}
                                              title={item.title}
                                              isCurrent={currentTrack == index }/>
            }
          />
        </View>
        <Footer nextqueue={props.nextqueue} currentTrack={currentTrack} isPlayerReady={isPlayerReady} ></Footer>
        
      </View>
    );
  }

  function Controls(props) {
    const onShuffle  = props.onShuffle
    const setSeek = props.setSeek

    const playerState = usePlaybackState();
  
    async function handlePlayPress() {
      setSeek(0)
      if(await TrackPlayer.getState() == State.Playing) {
        TrackPlayer.pause();
      }
      else {
        TrackPlayer.play();
      }
    }
    
    async function handleSkip(nextqueue){
      if (nextqueue.length != 0){
        
        let lastTrack = nextqueue.pop().index
        let currentTrack = await TrackPlayer.getCurrentTrack()
        setSeek(0)
        TrackPlayer.skip(lastTrack,currentTrack);
        TrackPlayer.seekTo(0)
        

      }
      else{
        TrackPlayer.skipToNext();setSeek(0)
      }

      

    }
    return(
      <View style={{flexDirection: 'row',
        flexWrap: 'wrap', alignItems: 'center',justifyContent:"center"}}>
          <Icon.Button
            name="arrow-left"
            size={28}
            backgroundColor="transparent"
            onPress={() => {TrackPlayer.skipToPrevious();setSeek(0)}}/>
          <Icon.Button
            name={playerState == State.Playing ? 'pause' : 'play'}
            size={28}
            backgroundColor="transparent"
            onPress={handlePlayPress}/>
          <Icon.Button
            name="arrow-right"
            size={28}
            backgroundColor="transparent"
            onPress={() => {handleSkip(props.nextqueue)}}/>
          <Icon.Button
            name="random"
            size={28}
            backgroundColor="transparent"
            onPress={onShuffle}/>
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
        borderRadius: 4
      },
      playlist: {
        flex:1,
        marginTop: 40,
        marginBottom: 40
      }
})