'use strict';

define(function (require, exports, module) {
    var editor = ace.edit("code");
    var id = window.location.pathname.substring( 1 );
    var tool = require( './tool' );
    var cashe = tool.cashe();

    function initView () {
        var html = '<div id="preview">'
            +'<iframe name="result"></iframe>'
            +'<div id="editor-drag-cover"></div>'
            +'</div>'
            +'<div id="scroll"><span></span></div>';
        $( 'body' ).append( html );
        //Drag
        drag( $( '#scroll' ).get(0), $( '#code' ).get(0), $( '#preview' ).get(0), $( '#editor-drag-cover' ).get(0) );

        var w = document.body.clientWidth;
        $( '#code' ).width( w / 2 );

        var l = $( '#code' ).width();
        var sw = $( '#scroll' ).width();
        var scw = $( '#scroll span' ).width();
        $( '#preview' ).css( 'left', l + scw + 'px' );
        $( '#scroll' ).css( 'left', l - sw / 2 + 'px' );

        resetIframe();
    }
    function resetIframe(){
        var preview = document.getElementById( 'preview' );
        preview.removeChild( preview.getElementsByTagName( 'iframe' )[0] );
        var iframe = document.createElement( 'iframe' );
        iframe.setAttribute( 'name', 'result' );
        preview.appendChild( iframe );

        var codeText = editor.getValue();
        var content = window.frames[ 'result' ].document;
        content.open();
        content.write( codeText );
        content.close();
    }
    function drag( oScroll, oCode, oPreView, editorDragCover ){
        oScroll.onmousedown = function( ev ){
            var oEvent = ev || event;
            var disX = oEvent.clientX - oScroll.offsetLeft;
            var sw = oScroll.offsetWidth;
            editorDragCover.style.display = 'block';
            document.onmousemove = function( ev ){
                var oEvent = ev || event;
                var l = oEvent.clientX - disX;
                oCode.style.width = l + 'px';
                oPreView.style.left = l + 1 + 'px';
                oScroll.style.left = l - sw / 2 + 'px';
                editor.resize();
            };
            document.onmouseup = function(){
                document.onmousemove = null;
                document.onmouseup = null;
                editorDragCover.style.display = 'none';
            };
            return false;
        };
    }

    exports.togglePreview = function(){
        var preview = $( '#preview' ).get( 0 );
        var scroll = $( '#scroll' ).get( 0 );
        if( preview && scroll ){
            $( '#preview' ).remove();
            $( '#scroll' ).remove();
            $( '#code' ).width( '100%' );
        }else{
            initView();
        }
        editor.resize();
    }

    exports.sendCode = function(){
        window.frames[ 'result' ] && resetIframe();
        window.localStorage.removeItem( id );
        var codeText = editor.getValue();
        $.post( '/createCode', { id : id, codeText : codeText } ).success(function( result ){
            if( result.status === -1 ) toastr.error( '保存失败' );
            if (result.status === 0 || result.status === 1) toastr.success( '保存成功' );
            if (result.status === 0 || result.status === 2) cashe.rm('history');
            if (result.status === 2) window.location.pathname = result.data._id;
        });
    };

    function getDemos (callback) {
        var history = cashe.get('history');
        if( history ){
            callback(history);
        }else{
            $.post('/getDemosByUserID').success(function (list) {
                cashe.set('history', list);
                callback(list);
            });
        }
    }

    function appendChildDemos (list) {
        var ul = document.createElement('ul');
        var pathname = window.location.pathname.substring(1);
        for( var i = 0; i < list.length; i++ ){
            var classActive = ( list[i]._id === pathname ? 'on' : '' );
            var str = '<li><a href="/'+ list[i]._id +'" class="'+ classActive +'">'+ list[i]._id +'</a></li>';
            $( ul ).append( str );
        }
        $( '#menu' ).append( ul );
    }

    exports.toggleMenu = function(){
        var menu = $( '#menu' ).get( 0 );
        var menuShow = function(){
            var tag = '<div id="menu" class="fadeinleft"><h1>历史记录</h1></div>';
            $( 'body' ).append( tag );
            getDemos( appendChildDemos );
        };
        var menuHide = function(){
            $('#menu').get(0).className = 'fadeoutleft';
            setTimeout(function(){
                $( '#menu' ).remove();
            },700);
        };
        if( menu ){
            menuHide();
        }else{
            menuShow();
        }
    };


    exports.resetIframe = resetIframe;
    exports.editor = editor;
    exports.id = id;
    exports.initView = initView;
});