var DEMO_UTIL = {};

var _closeDialog = function () {
    $(this).dialog("close");
};

DEMO_UTIL.errorDialog = function (title, err) {
    $("#dialog").html('<pre>' + JSON.stringify(err) + '</pre>');
    var err = (err) ? err : _closeDialog;
    $("#dialog").dialog({
        modal: true,
        title: title,
        width: 600,
        open: function (event, ui) {
            $(".ui-dialog-titlebar-close").hide();
        },
        buttons: {
            "OK": function () {
                window.location.href = './index.html';
            }
        }
    });
};

DEMO_UTIL.okDialog = function (title, comment, ok) {
    $("#dialog").html('<pre>' + comment + '</pre>');
    var ok = (ok) ? ok : _closeDialog;
    $("#dialog").dialog({
        modal: true,
        title: title,
        width: 600,
        open: function (event, ui) {
            $(".ui-dialog-titlebar-close").hide();
        },
        buttons: {
            "OK": ok
        }
    });
};

DEMO_UTIL.confirmDialog = function (title, comment, ok, ng) {
    $("#dialog").html('<pre>' + comment + '</pre>');
    var ok = (ok) ? ok : _closeDialog;
    var ng = (ng) ? ng : _closeDialog;
    $("#dialog").dialog({
        modal: true,
        title: title,
        width: 600,
        open: function (event, ui) {
            $(".ui-dialog-titlebar-close").hide();
        },
        buttons: {
            "OK": ok,
            "Cancel": ng
        }
    });
};

DEMO_UTIL.createRandomId = function (len) {
    var c = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let id = '';
    for (let i = 0; i < len; i++) {
        id += c[Math.floor(Math.random() * c.length)];
    }
    return id;
};


DEMO_UTIL.inputDialog = function (title, defaultValue, ok) {
    $("#dialog").html('<input style="width: 100%; text-align: right;" class="form-control" id="dialog-input" maxlength="18">');
    $("#dialog-input").focus();
    $("#dialog-input").val(defaultValue);
    $("#dialog").dialog({
        modal: true,
        title: title,
        width: 400,
        open: function (event, ui) {
            $(".ui-dialog-titlebar-close").hide();
        },
        buttons: {
            "OK": ok,
            "Cancel": _closeDialog
        }
    });
};

var _loading = false;
DEMO_UTIL.startLoad = function(){
    if (_loading) return false;
    _loading = true;

    $('#loader-bg').height($(window).height()).css('display','block');
    $('#loader').css('display','block');
    return true;
};
DEMO_UTIL.stopLoad = function(){
    if (!_loading) return false;
    _loading = false;
    $('#loader-bg').css('display','none');
    $('#loader').css('display','none');
    return true;
};
DEMO_UTIL.isLoading = function(){
    return _loading;
};
