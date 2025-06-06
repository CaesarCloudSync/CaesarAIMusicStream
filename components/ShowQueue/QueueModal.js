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
import Entypo from "react-native-vector-icons/Entypo"
export default function QueueModal({ queue,toggleModal,isModalVisible,setModalVisible,setQueue}) {
  const [queuepositionsrc,setQueuePositionSrc] = useState("");
    const playnextqueue = async (nextsong) =>{
        const stored_album_tracks = await AsyncStorage.getItem("current-tracks")
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
            <FlatList
            style={{padding:15}}
            data={queue}
            ItemSeparatorComponent={() => (
                <View style={{  height: 10 }} />
              )}
            renderItem={({item, index}) => {
                return(

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
                )
            }

            }
          />


          </View>
        </View>
      </Modal>
    </View>
  );
}



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