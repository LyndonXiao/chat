var uploader = Qiniu.uploader({
  runtimes: 'html5,flash,html4',    //上传模式,依次退化
  browse_button: 'uploadBtn',       //上传选择的点选按钮，**必需**
  uptoken_url: '/upload_token?token=' + Cookie.get('user_token'),            //Ajax请求upToken的Url，**强烈建议设置**（服务端提供）
  domain: 'http://ozrb73xol.bkt.clouddn.com/',   //bucket 域名，下载资源时用到，**必需**
  get_new_uptoken: true,  //设置上传文件的时候是否每次都重新获取新的token
  container: '',           //上传区域DOM ID，默认是browser_button的父元素，
  max_file_size: '100mb',           //最大文件体积限制
  flash_swf_url: 'js/plupload/Moxie.swf',  //引入flash,相对路径
  max_retries: 3,                   //上传失败最大重试次数
  dragdrop: false,                   //开启可拖曳上传
  drop_element: '',        //拖曳上传区域元素的ID，拖曳文件或文件夹后可触发上传
  chunk_size: '4mb',                //分块上传时，每片的体积
  auto_start: true,                 //选择文件后自动上传，若关闭需要自己绑定事件触发上传
  multi_selection: false,
  init: {
      'FilesAdded': function (up, files) {
          plupload.each(files, function (file) {
              // 文件添加进队列后,处理相关的事情

          });
      },
      'BeforeUpload': function (up, file) {
          /* 每个文件上传前,处理相关的事情*/ 
        },
      'UploadProgress': (up, file) => {
          // 每个文件上传时,处理相关的事情
          this.setState({
              isUp: true,
              percent: up.total.percent //进度
          })
      },
      'FileUploaded': (up, file, info) => {
          this.setState({
              isUp: false
          })
          // console.log('上传成功', up, file, info);
          var domain = up.getOption('domain');
          var res = JSON.parse(info);
          var sourceLink = domain + res.key; //获取到的链接
          // post
      },
      'Error': function (up, err, errTip) {
          /*上传出错时,处理相关的事情*/ 
        },
      'UploadComplete': function (e) {
          //队列文件处理完毕后,处理相关的事情
          // console.log('队列完成', e)
      },
      'Key': (up, file) => {
          //文件名
          var key = file.name;
          return key
      }
  }
});


<script type="text/javascript" src="http://cdn.muyucloud.com/qiniu.js"></script>
<script type="text/javascript" src="http://cdn.muyucloud.com/plupload/js/moxie.js"></script>
<script type="text/javascript" src="http://cdn.muyucloud.com/plupload/js/plupload.full.min.js"></script>
<script type="text/javascript" src="http://cdn.muyucloud.com/plupload/js/i18n/zh_CN.js"></script>