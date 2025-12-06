import React, { useState,useEffect } from "react";
import { Button, FlatList, StatusBar, StyleSheet, Text, View } from "react-native";
import Modal from "react-native-modal";
import TrackPlayer, {
    useTrackPlayerEvents,
    usePlaybackState,
    Event,
    State
  } from 'react-native-track-player';
import { TouchableOpacity,Image} from "react-native";
import { autoplaynextsong } from "../controls/controls";
import { getstreaminglink } from "../Tracks/getstreamlinks";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { skipToTrack } from "../controls/controls";
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { getrecommendations } from "../Tracks/getrecommendations";
import Entypo from 'react-native-vector-icons/Entypo';
import { SectionList } from "react-native";
import { get_access_token } from "../access_token/getaccesstoken";
import { prefetchsong } from "../controls/controls";
export default function QueueModal({ queue,toggleModal,isModalVisible,setModalVisible,setQueue}) {console.log("queue in QueueModal",queue)

  const [queuepositionsrc,setQueuePositionSrc] = useState("");
  const [current_recommendations, setCurrentRecommendations] = useState([]);
  const [sections, setSections] = useState([
  { title: "Queue", data: queue },
  {title:"Shuffling From", data: current_recommendations}
]);
    const searchsongs = async (song_query) =>{
      const access_token = await get_access_token();
        const headers = {Authorization: `Bearer ${access_token}`}
        //console.log(text)
        const resp = await fetch(`https://api.spotify.com/v1/search?q=${song_query}&limit=50&type=track`, {headers: headers})
        const feedresult = await resp.json()

        const track = feedresult.tracks.items[0]
        //console.log("track in searchsongs",track)
        const result_track = {"id":track.id,"album_id":track.album.id,"name":track.name,thumbnail:track.album.images[0].url,"artist":track.album.artists[0].name,artist_id: track.artists[0].id,duration_ms: track.duration_ms,album_name: track.album.name,track_numer: track.track_number}
        const resp2 = await fetch(`https://api.spotify.com/v1/albums/${result_track.album_id}/tracks`, {headers: headers})
        const tracksresult = await resp2.json()
        const  tracks = tracksresult.items.map((item) => ({
          id: item.id,
          name: item.name,
          artist: item.artists[0].name,
          artist_id: item.artists[0].id,
          duration_ms: item.duration_ms,
          thumbnail: result_track.thumbnail,
          album_id: result_track.album_id,
          track_number: item.track_number,
          album_name: result_track.album_name,
        }));
        //console.log("tracks in searchsongs",tracks)
        return  [result_track,tracks]
        //setSongs(result)
        //console.log(artists)
        //setTracks(tracks)
  
        //toggleModal()
    }
    const playnextqueue = async (nextsong) =>{
        const stored_album_tracks = await AsyncStorage.getItem("current-tracks")
        console.log("current_traCKSSS",stored_album_tracks)
        const album_tracks = JSON.parse(stored_album_tracks)
        //console.log(album_tracks[0])
        let num_of_tracks = album_tracks.length
        //console.log(num_of_tracks)
        let currentTrackInd = await  TrackPlayer.getActiveTrackIndex()
        //console.log("current",currentTrackInd)
        let currentTrack = await TrackPlayer.getTrack(currentTrackInd)
        //console.log(currentTrack.index,currentTrack)
        let player_ind = (currentTrack.index+ 1) >= num_of_tracks ? 0 : currentTrack.index+ 1 


        await skipToTrack(nextsong,player_ind)


       // let final_queue_json = player_queue.filter(obj => nextsong.name !== obj.title);
        let frontend_queue = queue.filter(obj => nextsong.name !== obj.name);
        if (frontend_queue.length !== 0){
            await AsyncStorage.setItem("queue",JSON.stringify(frontend_queue))
            setQueue(frontend_queue)
        }
        else{
            await AsyncStorage.removeItem("queue")
            setQueue([])
        }
        
    }
    const playnextrecommend = async (nextsongyt) =>{
      console.log("nextspngyt",nextsongyt)
      const song_query = `${nextsongyt.title} by ${nextsongyt.artists[0].name}`
      const [nextsong_recommend,album_tracks_recommend] = await searchsongs(song_query);
      console.log("nextsong from recommend",nextsong_recommend)
      await AsyncStorage.setItem("current-tracks",JSON.stringify(album_tracks_recommend))
      await AsyncStorage.removeItem("current-prefetched-nextsong")
      const track_downloaded = await AsyncStorage.getItem(`downloaded-track:${nextsong_recommend.artist}-${nextsong_recommend.album_name}-${nextsong_recommend.name}`)
      // TODO: Make the Youtube text to spotiy search accurate to get song then play. The auto play.
      /*
            if (!track_downloaded){
      await prefetchsong(nextsong_recommend)
      } 
     await TrackPlayer.reset();
      const stored_album_tracks = await AsyncStorage.getItem("current-tracks")
      console.log("current_traCKSSS",stored_album_tracks)
      const album_tracks = JSON.parse(stored_album_tracks)
      //console.log(album_tracks[0])
      let num_of_tracks = album_tracks.length
      //console.log(num_of_tracks)
      let currentTrackInd = await  TrackPlayer.getActiveTrackIndex()
      //console.log("current",currentTrackInd)
      let currentTrack = await TrackPlayer.getTrack(currentTrackInd)
      //console.log(currentTrack.index,currentTrack)
      let player_ind = (currentTrack.index+ 1) >= num_of_tracks ? 0 : currentTrack.index+ 1 


      await skipToTrack(nextsong_recommend,player_ind) */

            




       // let final_queue_json = player_queue.filter(obj => nextsong.name !== obj.title);
       //await removefromrecommend(nextsongyt)
        
    }
    const removefromqueue = async (song) =>{
        let frontend_queue = queue.filter(obj => song.name !== obj.name);
        if (frontend_queue.length !== 0){
            await AsyncStorage.setItem("queue",JSON.stringify(frontend_queue))
            setQueue(frontend_queue)
        }
        else{
            await AsyncStorage.removeItem("queue")
            setQueue([])
        }
        
    }
    const swapElements = (arr, pos1, pos2) => {
      const temp = arr[pos1];
    
      arr[pos1] = arr[pos2];
    
      arr[pos2] = temp;
    
      return arr;
    };
  const handlequeuechange = async (index) =>{

    if (queuepositionsrc === "" ){
      setQueuePositionSrc(index);
    } 
    else{
      if (queuepositionsrc !== index){
        console.log("src",queuepositionsrc,"dest:",index)
        const reordered_queue = swapElements(queue,queuepositionsrc,index);
        await AsyncStorage.setItem("queue",JSON.stringify(reordered_queue))
        setQueuePositionSrc("");
      }
      else{
        setQueuePositionSrc("");
      }

    }


  }
  const recommendshufflemode = async () =>{
    const current_track = await TrackPlayer.getActiveTrack();
    const recommendations = await getrecommendations(current_track)
    if (recommendations){
      await AsyncStorage.setItem("current-recommendations",JSON.stringify(recommendations))
      //console.log("recommendations",recommendations)
      setCurrentRecommendations(recommendations)
      setSections(prev =>
      prev.map(section =>
        section.title === "Shuffling From"
          ? { ...section, data: recommendations} // update only this section
          : section
      )
    );
   
    }

  }
      const removefromrecommend = async (song) =>{
        let frontend_recommendations = current_recommendations.filter(obj => song.title !== obj.title);
        if (frontend_recommendations.length !== 0){
            await AsyncStorage.setItem("current-recommendations",JSON.stringify(frontend_recommendations))
            setCurrentRecommendations(frontend_recommendations)
        }
        else{
            await AsyncStorage.removeItem("current-recommendations")
            setCurrentRecommendations([])
        }
        
    }
  useEffect(() =>{
      setSections(prev =>
      prev.map(section =>
        section.title === "Queue"
          ? { ...section, data: queue} // update only this section
          : section
      )
    );
    setSections(prev =>
      prev.map(section =>
        section.title === "Shuffling From"
          ? { ...section, data: current_recommendations} // update only this section
          : section
      )
    );
  },[queue,current_recommendations])
  return (
    <View style={styles.flexView}>
      <StatusBar />

      <Modal
        onBackdropPress={() => setModalVisible(false)}
        onBackButtonPress={() => setModalVisible(false)}
        isVisible={isModalVisible}
        swipeDirection="down"
        onSwipeComplete={toggleModal}
        animationIn="bounceInUp"
        animationOut="bounceOutDown"
        animationInTiming={900}
        animationOutTiming={500}
        backdropTransitionInTiming={1000}
        backdropTransitionOutTiming={500}
        style={styles.modal}
      >
        <View style={styles.modalContent}>
          <View style={styles.center}>
            <View style={[styles.barIcon,{alignSelf:"center"}]} />
            <TouchableOpacity onPress={() =>{recommendshufflemode()}} style={{alignSelf:"flex-end"}}>
              <MaterialIcons style={{marginTop:10}} name="shuffle-on" size={25} color="white"/>
            </TouchableOpacity>
                  <SectionList
        sections={sections}
        keyExtractor={(item, index) => item + index}
        renderItem={({item,index,section:{title}}) => {
          if (title === "Queue"){
            return (
                  <View style={{flex:1,flexDirection:"row",alignItems:"center"}}>
              <TouchableOpacity style={{flexDirection:"row",width:325}} onLongPress={() =>{removefromqueue(item)}} onPress={() =>{playnextqueue(item)}} >
              <Image style={{borderRadius:5,width: 60, height: 60}} source={{uri:item.thumbnail}}></Image>

              <View style={{padding:6}}>

              </View>
              <View style={{top:13}}>
                  <Text style={{color:"white"}}>{item.name}</Text>
                  <Text style={{color:"grey"}}>{item.artist}</Text>
              </View>
              </TouchableOpacity>

            <TouchableOpacity onPress={() =>{handlequeuechange(index)}} style={{marginLeft:30}}>
              <Entypo size={19} name="dots-three-vertical" color={queuepositionsrc === index ? "green" :"white"}></Entypo>
            </TouchableOpacity>
        

            </View> 
              )}
          else if (title === "Shuffling From"){
            console.log("item in Shuffling From",item)
            return(
            <View style={{flex:1,flexDirection:"row",alignItems:"center"}}>
              <TouchableOpacity style={{flexDirection:"row",width:325}} onLongPress={() =>{removefromrecommend(item)}} onPress={() =>{playnextrecommend(item)}} >
              <Image style={{borderRadius:5,width: 60, height: 60}} source={{uri:item.thumbnail[0].url}}></Image>

              <View style={{padding:6}}>

              </View>
              <View style={{top:13}}>
                  <Text style={{color:"white"}}>{item.title}</Text>
                  <Text style={{color:"grey"}}>{item.artists[0].name}</Text>
              </View>
              </TouchableOpacity>

            <TouchableOpacity onPress={() =>{handlerecommendchange(index)}} style={{marginLeft:30}}>
              <Entypo size={19} name="dots-three-vertical" color={queuepositionsrc === index ? "green" :"white"}></Entypo>
            </TouchableOpacity>
        

            </View> 
            )
          }
              }
        }
        renderSectionHeader={({section: {title}}) => {
          if (title === "Shuffling From"){
            return (
              <View style={{marginTop:20}}>
                      <View style={{flexDirection:"row"}}>

                      <Entypo style={{marginTop:10}} name="shuffle" size={15}>

          </Entypo>
          <Text style={{top:8,left:5,fontSize:14}}>
            Shufflling from:
          </Text>


      
          </View>
          </View>

            )
          }
        }}
      />


          
          </View>

        </View>
      </Modal>
    </View>
  );
}
/*
*/
/*          <View style={{marginTop:20}}>
                      <View style={{flexDirection:"row"}}>

                      <Entypo style={{marginTop:10}} name="shuffle" size={15}>

          </Entypo>
          <Text style={{top:8,left:5,fontSize:14}}>
            Shufflling from:
          </Text>


      
          </View>
          </View> */

const styles = StyleSheet.create({
  flexView: {
    flex: 1,
    backgroundColor: "white",
  },
  modal: {
    justifyContent: "flex-end",
    margin: 0,
  },
  modalContent: {
    backgroundColor: "#161616",
    paddingTop: 12,
    paddingHorizontal: 12,
    borderTopRightRadius: 20,
    borderTopLeftRadius: 20,
    minHeight: 400,
    paddingBottom: 20,
  },
  center: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "center",
  },
  barIcon: {
    width: 60,
    height: 5,
    backgroundColor: "#bbb",
    borderRadius: 3,
  },
  text: {
    color: "#bbb",
    fontSize: 22,
    marginTop: 20,
  },
  btnContainer: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    height: 500,
  },
});

/*
            */