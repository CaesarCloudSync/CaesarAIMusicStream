/* @flow */
import React, { Component, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from 'react-native';

import { Input, Button} from '@rneui/base';
import AsyncStorage from '@react-native-async-storage/async-storage';
import init from 'react_native_mqtt';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useProgress } from 'react-native-track-player';
import debounce from "lodash.debounce";
import TrackPlayer from 'react-native-track-player';

import { useIsMount } from './useIsMount';

init({
  size: 10000,
  storageBackend: AsyncStorage,
  defaultExpires: 1000 * 3600 * 24,
  enableCache: true,
  sync : {}
});

// 创建客户端实例
const options = {
  host: 'broker.emqx.io',
  port: 8083,
  path: '/testTopic',
  id: 'id_' + parseInt(Math.random()*100000)
};
client = new Paho.MQTT.Client(options.host, options.port, options.path);
export default function MusicConnectMQTT (){

  const isMount = useIsMount();
  const [status,setStatus] = useState(client.isConnected() === false ? "" :"connected");
  const [subscribedTopic,setSubscribedTopic] = useState("");
  const [message,setMessage] = useState("");
  const [messageList,setMessageList] = useState("");
  const [topic,setTopic] = useState('caesaraimusicstreamconnect/current-track');
  const { position, duration } = useProgress(200);


  
  client.onConnectionLost = onConnectionLost;
  client.onMessageArrived = onMessageArrived;
  
  // 连接成功
  async function onConnect (){

    setStatus("connected")
    console.log('onConnectHello');
    sendMessage()
    await AsyncStorage.setItem("music_connected","true")

    //sendMessage()

    //this.subscribeTopic()
  }
  // 连接失败
  function onFailure (err) {
    console.log('Connect failed!');
    console.log(err);
    setStatus("failed")
  }
  // 连接 MQTT 服务器
  function connect () {
    setStatus(
      'isFetching' 

    );
    try{
    client.connect({
      onSuccess:onConnect,
      useSSL: false,
      timeout: 3,
      onFailure: onFailure
    });
  } catch(err){
    console.log(err)
    if (err.toString().includes("Invalid state already connected")){
      setStatus("connected")
    }

  }
    
  }
  // 连接丢失
  function onConnectionLost (responseObject){
    if (responseObject.errorCode !== 0) {
      console.log('onConnectionLost:' + responseObject.errorMessage);
    }
  }
  // 收到消息
  function onMessageArrived(message ) {
    console.log('onMessageArrived:' + message.payloadString);
    let newmessageList = messageList;
    newmessageList.unshift(message.payloadString);
    setMessage( newmessageList)
    // this.MessageListRef.scrollToEnd({animated: false});
  }
  function onChangeTopic (text){
    setTopic(text)
  }
  // 主题订阅
  function subscribeTopic (){
    setSubscribedTopic(
      { subscribedTopic: subscribedTopic },
      () => {
        client.subscribe(subscribedTopic, { qos: 0 });
      }
    );
  }
  // 取消订阅
  function unSubscribeTopic () {
    client.unsubscribe(subscribedTopic);
    setSubscribedTopic("")
  }
  function onChangeMessage(text) {
    setMessage(text)
  }
  // 消息发布
  async function sendMessage (){
    let currentTrackInd = await  TrackPlayer.getCurrentTrack()
    let currentTrack = await TrackPlayer.getTrack(currentTrackInd)
    var messagesend = new Paho.MQTT.Message(JSON.stringify(currentTrack));
    messagesend.destinationName = topic;
    client.send(messagesend);
  }
  const removemusicconnect = async () =>{
    await AsyncStorage.removeItem("music_connected")
  }
  const checkmusicconnect = async () =>{
    let  music_connected = await AsyncStorage.getItem("music_connected")
    if (status === "" , music_connected === "true"){
      
      if (isMount) {
        console.log('First Render');
        if (music_connected === "true"){
          setStatus("connected")
        }
      } else {
        try{
          //console.log("second render")
          if (!client.isConnected()){
            
            connect()
          }
          else{
            setStatus("connected")
          }
        }
        catch{

        }
      }
    }
  }
  useEffect(() =>{
    checkmusicconnect()
  },[status])





    return (
      <View style={{justifyContent:"center",alignItems:"center"}}>

        {
          status === 'connected' ?
            <View>
            <TouchableOpacity  onPress={() => {
                  try{
                    client.disconnect();
                  }
                  catch{

                  }
                  setStatus("");setSubscribedTopic("");
                  removemusicconnect()
                 
      
                }}>
            <MaterialIcons color={"green"} size={20} name='devices'></MaterialIcons>
            </TouchableOpacity>

            </View>
          :
          <TouchableOpacity  onPress={connect}>
             <MaterialIcons size={20} name='devices'></MaterialIcons>
            </TouchableOpacity>


        }

      </View>
    );
  }

//         {this.state.status === "connected" && <Button onPress={() =>{this.sendMessage()}} title={"publish"}></Button>}

