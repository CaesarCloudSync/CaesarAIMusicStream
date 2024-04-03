import React, { useState,useEffect } from "react";
import { Button, FlatList, StatusBar, StyleSheet, Text, View } from "react-native";
import Modal from "react-native-modal";
import TrackPlayer, {
    useTrackPlayerEvents,
    usePlaybackState,
    Event,
    State
  } from 'react-native-track-player';


export default function BottomModal({ nextqueue,currentTrack,isPlayerReady ,toggleModal,isModalVisible,setModalVisible}) {
  //console.log(currentTrack)
  //console.log(nextqueue)
  
  function QueuedItem({item,index}){
    const [removed,setRemoved] = useState(false)
    return(
      <View style={{display:"flex",flexDirection:"row",marginBottom:8}}>
        
        <Text style={{color:removed === false ? "white" : "black"}} onPress={() =>{nextqueue.splice(index,1);setRemoved(true)}}>{item.title}</Text>

      </View>
    )
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
            <View style={styles.barIcon} />
            <Text style={styles.text}>CaesarAIMusic Queue</Text>
            <FlatList
            data={nextqueue.slice().reverse()}
            renderItem={({item, index}) => 
            <QueuedItem item={item} index={index}/>
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
    alignItems: "center",
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
    fontSize: 24,
    marginTop: 100,
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