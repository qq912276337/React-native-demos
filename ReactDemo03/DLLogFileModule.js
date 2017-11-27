/**
 * Created by sml2 on 2017/11/21.
 */
import React, { Component } from "react";
import RNFS from 'react-native-fs';
import { Platform } from 'react-native';
import moment from 'moment';
import { zip, unzip, unzipAssets, subscribe } from 'react-native-zip-archive'

const PlatformPath = (Platform.OS === 'ios') ? RNFS.MainBundlePath : RNFS.DocumentDirectoryPath;
const kLog = '.log';
const kZip = '.zip';
const kDayFormatter = "YYYY-MM-DD";
const kDayDetailFormatter = "YYYY-MM-DD HH:mm:ss";

if(typeof DLLogFileMessageType == "undefined"){
    var DLLogFileMessageType = {};
    DLLogFileMessageType.log = kLog;
    DLLogFileMessageType.zip = kZip;
}

class DLLogFileMessage{
    // 构造
    constructor(props) {
        this.type = DLLogFileMessageType.log;

        this.fullPath = null;

        this.fileName = null;

    }

    zipFilePath(completeHandler){
        if (this.type == DLLogFileMessageType.log){
            var zipFilePath = this.fullPath.replace(DLLogFileMessageType.log,DLLogFileMessageType.zip);
            zip(this.fullPath,zipFilePath)
                .then((path)=>{
                    if(completeHandler){
                        completeHandler(null,path);
                    }
                })
                .catch((err)=>{
                    if(completeHandler){
                        completeHandler(err,null);
                    }
                })
        } else {
            // this.fullPath即是压缩文件路径
            if(completeHandler){
                completeHandler(null,this.fullPath);
            }
        }
    }
}

export default class DLLogFileModule {
    // 构造
    constructor(options = {}) {
        this.maxCount = options.maxCount || 7;
        this.directoryPath = options.directoryName ? (PlatformPath + '/' + options.directoryName + '/') : PlatformPath + '/DLLog/';
        this.logMode = options.logMode || 2;
        this.autoUploadEnable = options.autoUploadEnable || false;
        this.uploadFilehandler = options.uploadFilehandler || null;
        this.uploadFileCompleteHandler = options.uploadFileCompleteHandler || null;
    }
    
    
    start(){
        var date = moment().format(kDayFormatter);
        var fileName = date.toString() + kLog;
        var fullPath = this.fullPath(fileName);
        this.currentDateFileName = fileName;

        RNFS.mkdir(this.directoryPath)
            .then((result)=>{
                this._willCreateLogFileAtPath(fullPath);
                this._addDiffTimer();
            })
            .catch((err)=>{
                alert('mkdir dl_error: ' + err.message);
            })

    }
    /* 打印方法 */
    log(arg){
        var datetime = moment().format(kDayDetailFormatter) + ' ';
        switch(this.logMode) {
            case 0:
                console.log(arg);
                break;
            case 1:
                this._appendToFile(this.fullPath(this.currentDateFileName),datetime + JSON.stringify(arg)+'\n');
                break;
            default:
                console.log(arg);
                this._appendToFile(this.fullPath(this.currentDateFileName),datetime + JSON.stringify(arg)+'\n');
        }
    }
    /*
     * completeHandler (err,result)=>{}
     * */
    allLogFileMessages(completeHandler){
        this._allFiles((results)=>{
            var messages = [];
            for(var i = 0;i < results.length;i++){
                var fileMessage = new DLLogFileMessage();
                fileMessage.type = (results[i].indexOf(DLLogFileMessageType.log) >= 0) ? DLLogFileMessageType.log : DLLogFileMessageType.zip;
                fileMessage.fullPath = this.fullPath(results[i]);
                fileMessage.fileName = results[i];
                messages.push(fileMessage);
            }

            if(completeHandler) {
                completeHandler(null,messages);
            }
        },(error)=>{
            if(completeHandler) {
                completeHandler(error,null);
            }
        });
    }

    /* 上传日志文件message
     * message DLLogFileMessage
     * completeHandler (error,result)
     * */
    uploadLogFileWithMessage(message,completeHandler) {
        if (this.uploadFilehandler){
            message.zipFilePath((err,path)=>{
                if(!path){
                    if(completeHandler){
                        completeHandler(err,null);
                    }
                } else {
                    this.uploadFilehandler(path,false,(isSuccess)=>{
                        if (message.type == DLLogFileMessageType.log){
                            this._deleteFile(path);
                        }

                        if(completeHandler){
                            completeHandler(null,isSuccess)
                        }
                    })
                }
            })
        }
    }
    
    /* 根据日期字符串上传日志文件
     * dateName 形如 '2017-11-22'
     * completeHandler (error,result)
     * */
    uploadLogFileForDate(dateName,completeHandler){
        var fileName = dateName;
        var type = null;
        if(this.currentDateFileName.indexOf(fileName) >= 0) {
            fileName += (DLLogFileMessageType.log);
            type = (DLLogFileMessageType.log);
        } else {
            fileName += (DLLogFileMessageType.zip);
            type = (DLLogFileMessageType.zip);
        }

        this._allFiles((results)=>{
            var filePath = null;
            for(var i = 0;i < results.length;i++){
                if(results[i] == fileName) {
                    filePath = this.fullPath(fileName);
                    break;
                }
            }

            if(!filePath) {
                errorObj = new Error('dl_error: uploadLogFileForDate fileName not find');
                if(completeHandler) {
                    completeHandler(errorObj,null);
                }
            } else {
                var fileMessage = new DLLogFileMessage();
                fileMessage.type = type;
                fileMessage.fullPath = this.fullPath(fileName);
                this.uploadLogFileWithMessage(fileMessage,completeHandler);
            }

        },(err)=>{
            if(completeHandler) {
                completeHandler(err,null);
            }
        });
    }

    /* 添加差额定时器 */
    _addDiffTimer(){
        var nowTime = moment();

        var start = moment().add(1, 'days').format(kDayFormatter);
        var zeroTime = moment(start, kDayFormatter).valueOf();
        this.timer = setTimeout(()=>{
            this._diffTimerAction();
        },(zeroTime - nowTime))
    }

    /* 差额定时器触发事件 */
    _diffTimerAction(){
        var nowTime = moment();
        this.currentDateFileName = (nowTime.format(kDayFormatter) + kLog);
        var fileFullPath = this.fullPath(this.currentDateFileName);
        this._willCreateLogFileAtPath(fileFullPath);

        this.timer = null;
    }

    /* 将要创建日志文件 path:日志文件全路径 */
    _willCreateLogFileAtPath(path){
        // 以追加文本的方式创建日志文件
        this._appendToFile(path,moment().format(kDayDetailFormatter) + ' app launch init async\n');
        // 限制数量
        this._limitCountOfLogFiles((error,results)=>{
            // 数量大于0 && 开启自动上传
            if(!error && results.length > 0 && this.autoUploadEnable==true){
                for(var i = 0;i<results.length;i++){
                    if(results[i].indexOf(kLog) == -1)continue;
                    var zipfileName = results[i].split('.')[0] + kZip;
                    var zipFilePath = this.fullPath(zipfileName);
                    var logFilePath = this.fullPath(results[i]);

                    this._uploaLoadUnarchiveFile(logFilePath,zipFilePath,(error,result)=>{
                        if (error){
                            this.log('_uploadUnarchiveFileInLogFiles _uploaLoadUnarchiveFile dl_error:'+error.message);
                        }
                    });
                }
            }
        });
    }

    /* 上传未压缩的日志文件 */
    _uploaLoadUnarchiveFile(logFilePath,zipFilePath,completeHandler){
        zip(logFilePath,zipFilePath)
            .then((path)=>{
                if(this.uploadFilehandler){
                    this.uploadFilehandler(path,true,(ok)=>{
                        if(ok){
                            this._deleteFile(logFilePath);
                        } else {
                            this._deleteFile(zipFilePath);
                        }
                        if(completeHandler){
                            completeHandler(null,ok)
                        }
                    });
                }
            })
            .catch((error)=>{
                // alert('_uploadUnarchiveFileInLogFiles zip error:'+error.message);
                if(completeHandler){
                    completeHandler(error,null);
                }
            });
    }

    /* 限制日志文件数量 */
    _limitCountOfLogFiles(completeHandler){
        this._allFiles((result)=>{
            var files = [];
            var currentDateFileName = moment().format(kDayFormatter);
            for (var i = 0;i < result.length;i++) {
                var fileName = result[i];
                if(fileName.indexOf(currentDateFileName) != -1) continue;

                if(fileName.indexOf(kLog) >=0 || fileName.indexOf(kZip) >=0){
                    files.push(fileName);
                }
            }
            while (files.length >= this.maxCount){
                var deletePath = files[0];
                this._deleteFile(this.fullPath(deletePath));
                files.splice(0,1);
            }
            if(completeHandler){
                completeHandler(null,files);
            }

        },(err)=>{
            if(completeHandler){
                completeHandler(err,null);
            }
        });
    }

    /* 追加新的文本 path:文件全路径 content:内容 */
    _appendToFile(path,content) {
        return RNFS.appendFile(path, content, 'utf8')
            .then((success) => {

            })
            .catch((err) => {
                alert(err.message);
            });
    }

    /* 删除文件 */
    _deleteFile(filePath,completeHandler) {
        return RNFS.unlink(filePath)
            .then(() => {
                if(completeHandler){
                    completeHandler(null,true);
                }
            })
            .catch((err) => {
                if(completeHandler){
                    completeHandler(err,false);
                }
            });
    }

    /* 所有日志文件的路径 */
    _allFiles(resolve,reject){
        RNFS.readdir(this.directoryPath)
            .then((result)=>{
                if(resolve){
                    resolve(result);
                }
            })
            .catch((err)=>{
                if (reject){
                    reject(err);
                }
            })
    }

    fullPath(fileName){
        return this.directoryPath + fileName;
    }
    
}


export  {DLLogFileMessage,DLLogFileModule};

