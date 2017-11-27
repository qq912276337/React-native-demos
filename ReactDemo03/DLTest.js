/**
 * Created by sml2 on 2017/11/23.
 */
import React, { Component } from "react";
import { View, Text, FlatList, TouchableOpacity } from "react-native";
import moment from 'moment';

const kDayFormatter = "YYYY-MM-DD";

class DLTest extends Component {
    constructor(props) {
        super(props);

        this.state = {
            
        };
    }
    
    render(){
        return(
            <View>
                <TouchableOpacity onPress={()=>{
                    this._click1();
                }}>
                    <Text>点击上传今天的日志</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={()=>{
                    this._click2();
                }}>
                    <Text>点击上传第一个日志文件</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={()=>{
                    this._click3();
                }}>
                    <Text>点击上传指定日期（2017-11-22）的日志</Text>
                </TouchableOpacity>

            </View>
        );
    }

    _click1(){
        dlconsole.log(this.state);
        var dateString = moment().format(kDayFormatter);
        dlconsole.uploadLogFileForDate(dateString,(error,result)=>{
            if(error){
                alert(error.message);
            } else {
                alert(result);
            }
        })
    }

    _click2(){
        dlconsole.log(this.state);

        dlconsole.allLogFileMessages((error,result)=>{
            if (error){
                alert(error.message);
            } else {
                dlconsole.uploadLogFileWithMessage(result[0],(error,result2)=>{
                    if (error){
                        alert('error:'+error.message);

                    } else {
                        alert('result:'+result2)
                    }
                });
            }
        })
    }

    _click3(){
        dlconsole.log(this.state);
        var dateString = '2017-11-22';

        dlconsole.uploadLogFileForDate(dateString,(error,result)=>{
            if(error){
                alert(error.message);
            } else {
                alert(result);
            }
        })
    }
}

export default DLTest;