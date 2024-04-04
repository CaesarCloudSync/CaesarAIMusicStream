import React, { useState,useEffect } from "react";
import { Button, FlatList, StatusBar, StyleSheet, Text, View } from "react-native";
import Modal from "react-native-modal";
import { FavouritePlaylists } from "../HomeScreen/FavouriteRenders";

export default function BottomModal({songs,toggleModal,isModalVisible,setModalVisible,access_token}) {
  //console.log(currentTrack)
  //console.log(nextqueue)
  //console.log(songs)
  
  function QueuedItem({item,index}){
    const [removed,setRemoved] = useState(false)
    return(
      <View style={{display:"flex",flexDirection:"row",marginBottom:8}}>
        
        <Text >{item.name}</Text>

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
            <Text style={styles.text}>CaesarAIMusic Search</Text>
            <FavouritePlaylists access_token={access_token} favouritecards={true} playlists={songs}/>


          </View>
        </View>
      </Modal>
    </View>
  );
}



const styles = StyleSheet.create({
  flexView: {
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
    marginTop: 10,
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