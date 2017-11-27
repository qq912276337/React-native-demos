/**
 * Created by sml2 on 2017/11/22.
 */

import {DLLogFileMessage,DLLogFileModule} from './DLLogFileModule';

var dlconsole = new DLLogFileModule({
    /* 日志文件最大数量 默认=7*/
    maxCount:7,
    
    /* 日志模式：0表示只打印控制台，1表示只写到文件 2表示控制台和文件(默认）*/
    logMode:2,
    
    /* 目录文件夹名称 */
    directoryName:'DLLog',
    
    /* 是否自动上传 默认为false*/
    autoUploadEnable:true,
    
    /* 文件上传操作 回调参数(filePath,isAuto,uploadFileCompleteHandler)
    *  param filePath string 压缩文件路径
    *  param isAuto bool 是否属于自动上传
    *  param 如果上传成功需要调用 uploadFileCompleteHandler(true) 反之 需要调用 uploadFileCompleteHandler(false)
    * */
    uploadFilehandler:(filePath,isAuto,uploadFileCompleteHandler)=>{
        // 延迟处理 模拟网络请求
        setTimeout(()=>{
            uploadFileCompleteHandler(true);
        },1);
    },

})

global.dlconsole = dlconsole;
