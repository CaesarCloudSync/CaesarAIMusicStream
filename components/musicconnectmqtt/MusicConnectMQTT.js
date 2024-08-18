/* @flow */
import React, { Component } from 'react';
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
init({
  size: 10000,
  storageBackend: AsyncStorage,
  defaultExpires: 1000 * 3600 * 24,
  enableCache: true,
  sync : {}
});
const options = {
  host: 'broker.emqx.io',
  port: 8083,
  path: '/testTopic',
  id: 'id_' + parseInt(Math.random()*100000)
};
// 创建客户端实例
client = new Paho.MQTT.Client(options.host, options.port, options.path);

class MusicConnectMQTT extends Component {
  constructor(props){
    super(props)
    console.log(props.progress)
       
    this.state={
      topic: 'caesaraimusicstreamconnect/current-track',
      subscribedTopic: '',
      message: JSON.stringify(props.message),
      messageList: [],
      status: ''
    };
    client.onConnectionLost = this.onConnectionLost;
    client.onMessageArrived = this.onMessageArrived;
  }
  
  // 连接成功
  onConnect = () => {
    console.log('onConnect');
    this.setState({ status: 'connected' });
    //this.subscribeTopic()
  }
  // 连接失败
  onFailure = (err) => {
    console.log('Connect failed!');
    console.log(err);
    this.setState({ status: 'failed' });
  }
  // 连接 MQTT 服务器
  connect = () => {
    this.setState(
      { status: 'isFetching' },
      () => {
        client.connect({
          onSuccess: this.onConnect,
          useSSL: false,
          timeout: 3,
          onFailure: this.onFailure
        });
        
      }
    );
  }
  // 连接丢失
  onConnectionLost=(responseObject)=>{
    if (responseObject.errorCode !== 0) {
      console.log('onConnectionLost:' + responseObject.errorMessage);
    }
  }
  // 收到消息
  onMessageArrived = (message )=> {
    console.log('onMessageArrived:' + message.payloadString);
    newmessageList = this.state.messageList;
    newmessageList.unshift(message.payloadString);
    this.setState({ messageList: newmessageList });
    // this.MessageListRef.scrollToEnd({animated: false});
  }
  onChangeTopic = (text) => {
    this.setState({ topic: text });
  }
  // 主题订阅
  subscribeTopic = () => {
    this.setState(
      { subscribedTopic: this.state.subscribedTopic },
      () => {
        client.subscribe(this.state.subscribedTopic, { qos: 0 });
      }
    );
  }
  // 取消订阅
  unSubscribeTopic = () => {
    client.unsubscribe(this.state.subscribedTopic);
    this.setState({ subscribedTopic: '' });
  }
  onChangeMessage = (text) => {
    this.setState({ message: text });
  }
  // 消息发布
  sendMessage = () =>{
    var message = new Paho.MQTT.Message(this.state.message);
    message.destinationName = this.state.topic;
    client.send(message);
  }
  componentDidMount() {
    this.interval = setInterval(() => 
    {
        if (this.state.status === "connected"){
            this.sendMessage()
        }
    }
    
    , 1000);
  }
  componentWillUnmount() {
    clearInterval(this.interval);
  }
  render() {
    const { status, messageList } = this.state;
    return (
      <View style={{justifyContent:"center",alignItems:"center"}}>

        {
          this.state.status === 'connected' ?
            <View>
            <TouchableOpacity  onPress={() => {
                  client.disconnect();
                  this.setState({ status: '', subscribedTopic: '' });
      
                }}>
            <MaterialIcons color={"green"} size={20} name='devices'></MaterialIcons>
            </TouchableOpacity>

            </View>
          :
          <TouchableOpacity  onPress={this.connect}>
             <MaterialIcons size={20} name='devices'></MaterialIcons>
            </TouchableOpacity>


        }

      </View>
    );
  }
}
//         {this.state.status === "connected" && <Button onPress={() =>{this.sendMessage()}} title={"publish"}></Button>}

export default MusicConnectMQTT;