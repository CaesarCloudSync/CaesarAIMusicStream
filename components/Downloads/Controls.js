import TrackPlayer from "react-native-track-player";
import { usePlaybackState ,State} from "react-native-track-player";
import { View } from "react-native";
import Icon from 'react-native-vector-icons/FontAwesome';
export default function Controls(props) {
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
      flexWrap: 'wrap', alignItems: 'center',justifyContent:"center",marginLeft:60,backgroundColor:"#141212"}}>
        <Icon.Button
          name="arrow-left"
          size={18}
          backgroundColor="transparent"
          onPress={() => {TrackPlayer.skipToPrevious();setSeek(0)}}/>
        <Icon.Button
          name={playerState == State.Playing ? 'pause' : 'play'}
          size={18}
          backgroundColor="transparent"
          onPress={handlePlayPress}/>
        <Icon.Button
          name="arrow-right"
          size={18}
          backgroundColor="transparent"
          onPress={() => {handleSkip(props.nextqueue)}}/>
        <Icon.Button
          name="random"
          size={18}
          backgroundColor="transparent"
          onPress={onShuffle}/>
    </View>
  );
}