/**
 * 
 * @authors cchen
 * @date    2017-04-07 
 * @version 4.0
 */

(function(factory) {
    if ( !window.jQuery ) {
        alert('jQuery is required.');
    }

    jQuery(function() {
        factory.call( null, jQuery );
    }); 
})(function( $ ){
	function uploader(options){
		var defaults = {
			inputFile: '#filePicker',   //触发上传的div  id
			use_base64: true,            //是否以bsae64上传
			auto: false,                 //是否开启自动上传
			dnd: false,				     //false or 容器 
			uploadUrl: '',              //上传的链接
			multiple: false,            //多张上传  false的情况下会自动将上一个队列文件删除
			isCrop: false,               //是否剪裁
			fileNumLimit: 30,           //上传文件数量的最大限制
			fileSizeLimit: 7*1024*1024, //上传文件的最大文件大小
			cropW: 200,                 //剪裁框宽度
			cropH: 200,					//剪裁框高度
			submitBtn: '',              //上传按钮
			onclipFinish: function(src){  //完成剪裁后执行函数
				
			},
			onFileQueued: function(src,file){},
			onStartUpload: function(){},
			onUploadFinished: function(){},
			onUploadSuccess: function(res){},
			onUploadError: function(){}
		};
		this.opt = $.extend(defaults,options);
		this.uploadObj = null;
		this.Uploader = WebUploader.Uploader;
		this.queuedFile = this.opt.multiple? [] : null;
		this.flag = 0;
		this.init();
	}
	uploader.prototype={
		init: function(){
			var _this = this;
		    if ( !_this.Uploader.support() ) {
		        alert( 'Web Uploader 不支持您的浏览器！');
		        throw new Error( 'WebUploader does not support the browser you are using.' );
		    }
		    if(!navigator.userAgent.match(/AppleWebKit.*Mobile.*/)){
		    	_this.opt.mode = 'pc';
		    }
		    else{
		    	_this.opt.mode = 'mobile';
		    }
		    if(_this.opt.isCrop){
			    _this.clip_id = Math.random().toString().replace('.', '');
		    	_this.clip_id = 'clipArea'+_this.clip_id;
			    var htmlStr = '<div class="cropper-wraper webuploader-element-invisible" id="'+_this.clip_id+'"><div class="clip-btn">剪裁</div></div>';
			    $('body').append(htmlStr);
		    }
			_this.uploadSetup();
		},
		uploadSetup: function(){
			var _this = this;
			var file;
			var compress_cfg = false;
			var mime_cfg = 'image/gif,image/jpg,image/jpeg,image/bmp,image/png';
			var dnd_cfg = undefined;
			var disableGlobalDnd = false; 
			// 当不处于剪裁模式时开启压缩
            if(_this.opt.isCrop==false){
            	compress_cfg = {
				    quality: 80,
				    allowMagnify: false,
				    crop: false,
				    preserveHeaders: true,
				    noCompressIfLarger: false,
				    compressSize: 0
                };
            }
            if(_this.opt.mode == 'mobile'){
            	mime_cfg = 'image/*';
            }
            if(_this.opt.dnd){
            	dnd_cfg = _this.opt.dnd;
            	disableGlobalDnd = true;
            }
			_this.uploadObj = new _this.Uploader({
				dnd: dnd_cfg,
				disableGlobalDnd: disableGlobalDnd,
				auto: _this.opt.auto,
                pick: {
                    id: _this.opt.inputFile,
                    multiple: _this.opt.multiple
                },
                accept: {
                	title: 'Images',
				    extensions: 'gif,jpg,jpeg,bmp,png',
				    mimeTypes: mime_cfg
                },
                thumb: {
                	quality: 70,
                    allowMagnify: false,
                    crop: false,
                    type: ''
                },
                chunked: false,
                compress: compress_cfg,
                fileSingleSizeLimit: _this.opt.fileSizeLimit,
                server: _this.opt.uploadUrl,
                swf: 'Uploader.swf',
                duplicate: 1,
                fileNumLimit: _this.opt.fileNumLimit,
                onError: function(handler) {
                	switch(handler){
                		case 'Q_EXCEED_NUM_LIMIT':
                			alert('上传文件过于频繁，请刷新后再试');
                			break;
                		case 'F_EXCEED_SIZE':
                			alert('该文件过大！无法上传');
                			break;
                		case 'Q_TYPE_DENIED':
                			alert('请上传gif,jpg,jpeg,bmp,png文件');
                			break;
                	}
                }
            });
            
            // 剪裁模式下首次绑定photoClip
            if(_this.flag == 0&&_this.opt.isCrop){
            	_this.flag = 1;
            	setTimeout(function(){
					$("#"+_this.clip_id).photoClip({
						width: _this.opt.cropW,
						height: _this.opt.cropH,
						file: _this.opt.inputFile+' input',
						ok: '#'+_this.clip_id+' .clip-btn',
						loadStart: function() {},
						loadComplete: function() {},
						clipFinish: function(src){
							_this.opt.onclipFinish(src);
							$('#'+_this.clip_id).addClass('webuploader-element-invisible');
						}
					});

            	},500);
            }
            _this.uploadObj.on('fileQueued', function( _file ) {
	            if(!_this.opt.multiple && _this.queuedFile){
	            	_this.uploadObj.removeFile(_this.queuedFile,true);
	            }
                if((_this.opt.use_base64 && _this.opt.isCrop)||(!_this.opt.use_base64 && !_this.opt.auto && _this.opt.isCrop)){
                	//使用base64上传且裁剪 或  不使用base64不自动上传且裁剪
                	$('#'+_this.clip_id).removeClass('webuploader-element-invisible');
	            	_this.uploadObj.makeThumb( _file, function( error, src ) {
	            		if(error){}
	            		if(_this.flag == 1 && $('.photo-clip-rotateLayer img').get(0)){
	            			$('.photo-clip-rotateLayer img').attr('src',src);
	            		}
	                },1,1);
                }
                else if((_this.opt.use_base64 && !_this.opt.isCrop)||(!_this.opt.use_base64 && _this.opt.auto)||(!_this.opt.use_base64 && !_this.opt.auto && !_this.opt.isCrop)){
                	_this.uploadObj.makeThumb( _file, function( error, src ) {
                		if(error){}
        				_this.opt.onFileQueued(src,_file);
	                },1,1);
                }
                if(_this.opt.multiple){
                	_this.queuedFile.push(_file.id);
                }
                else{
                	_this.queuedFile = _file.id;
                }
            });
            _this.uploadObj.on('startUpload',function(){
            	_this.opt.onStartUpload();
            });
            _this.uploadObj.on('uploadFinished',function(){
            	$(_this.opt.submitBtn).removeAttr('data-disabled');
            	_this.opt.onUploadFinished();
            });
            _this.uploadObj.on('uploadSuccess',function(_file,res){
		        _this.opt.onUploadSuccess(res);
            });
            _this.uploadObj.on('uploadError',function(_file,reason){
		        _this.opt.onUploadError();
            });
            if(!_this.opt.use_base64){
	            $(_this.opt.submitBtn).click(function(event) {
	            	var _self = $(this);
	            	var initFiles = _this.uploadObj.getFiles('inited');
	            	if(initFiles.length == 0){
	            		alert('请先上传文件');
	            		return false;
	            	}
	            	if(!_self.attr('data-disabled')){
	            		_self.attr('data-disabled','true');
	            		_this.uploadObj.upload();
	            	}
	            });
            }
		},
		removeFile: function(index){
			var _this = this;
			var file = _this.queuedFile[index];
			_this.uploadObj.removeFile(file,true);
			_this.queuedFile.splice(index, 1);
		}
     
	};
	window['uploader'] = function(options){
		return new uploader(options);
	};

});