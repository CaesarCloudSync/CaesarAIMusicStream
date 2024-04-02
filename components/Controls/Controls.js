import { getaudio } from "../Tracks/getstreamlinks";
function Controls({setSeek,album_tracks,currentTrack,setCurrentTrack}) {
    

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
    
    async function handleSkip(album_tracks){
        
    
      const idx = album_tracks.findIndex(({ name }) => name === currentTrack);
      if (idx+1 > album_tracks.length){
          getaudio(album_tracks[0],setCurrentTrack)
      }
      else{
          getaudio(album_tracks[idx+1],setCurrentTrack)
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
            onPress={() => {handleSkip(album_tracks)}}/>
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