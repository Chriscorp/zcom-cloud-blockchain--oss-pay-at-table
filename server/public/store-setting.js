$(document).ready(function() {

    prepareAccount(
        function() {
            $('#main-area').css('display', 'block');
            $('#token-address').val(LOCAL_STORAGE.getTokenAddress());
            $('#symbol').val(DEMO_TOKEN_SYMBOL);
            $('#token-name').val(DEMO_TOKEN_NAME);
            var tokenRate = LOCAL_STORAGE.getTokenRate();
            if (tokenRate) {
                $('#token-unit-price').val(tokenRate.toFixed(1));
            }
        }
    );
});

var setTokenRate = function() {

    if (DEMO_UTIL.isLoading()) return;
    if (!DEMO_UTIL.startLoad()) return;

    var tokenRate = $('#token-unit-price').val().trim();

    // validate(very simple for DEMO)
    if (!tokenRate) {
        DEMO_UTIL.okDialog(
            demoMsg('common.dialog.err-required.title'),
            demoMsg('common.dialog.err-required.msg')
        );
        return DEMO_UTIL.stopLoad();
    }
    var rate = parseFloat(tokenRate).toFixed(1);
    if (rate < 0.1 || 100.0 < rate) {
        DEMO_UTIL.okDialog(
            demoMsg('store-setting.dialog.err-invalid-value.title'),
            demoMsg('store-setting.dialog.err-invalid-value.msg')
        );
        return DEMO_UTIL.stopLoad();
    }

    $('#token-unit-price').val(rate);
    LOCAL_STORAGE.setTokenRate(rate);
    DEMO_UTIL.okDialog(
        demoMsg('store-setting.dialog.complete.title'),
        demoMsg('store-setting.dialog.complete.msg')
    );
    return DEMO_UTIL.stopLoad();
};
