import { useState } from "react";
import { View,TouchableOpacity } from "react-native";
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import AsyncStorage from "@react-native-async-storage/async-storage";
import QueueModal from "./QueueModal";
export default function ShowQueue(){
    const [queue,setQueue] = useState([]);
    const [isModalVisible, setModalVisible] = useState(false);
    const toggleModal = () => {
        setModalVisible(!isModalVisible);
      };
    const getQueue = async () =>{
        const queue = await AsyncStorage.getItem("queue");
        //console.log(queue)
        if (queue){
          let queue_json = JSON.parse(queue)
          setQueue(queue_json)
        }
        else{
          setQueue([])
        }
  
      }
      const openqueue = async ()=>{
        await getQueue()
        toggleModal();
      }
  
    return(
        <View>
            <TouchableOpacity onPress={() =>{openqueue()}} style={{alignSelf:"flex-end",marginRight:10}}>
              <MaterialIcons name={"queue-music"} size={18}></MaterialIcons>
            </TouchableOpacity>
            <QueueModal queue={queue} isModalVisible={isModalVisible} toggleModal={toggleModal} setModalVisible={setModalVisible} setQueue={setQueue}></QueueModal>
        </View>
    )
}