$(document).ready(function() {
    prepareAccount(
        function() {
            $('#main-area').css('display', 'block');
            var users = LOCAL_STORAGE.getUserAccounts();
            for (var i = 0; i < users.length; i++) {
                $('#users').append($('<option>').val(i).text(demoMsg('common.content.payer') + '-' + (i + 1)));
            }
        }
    );
});

var enter = function() {
    $('#enter-area').css('display', 'none');
    $('#slip-id').html(moment().format('YYYYMMDD-HHmmss'));
    $('#total').html('0');
    refreshQr("0");
    $('#slip-area').css('display', 'block');
};

var addOrder = function(obj) {

    var row = $(obj).closest('div[name="row"]');

    var countStr = row.find('input[name="count"]').val();
    if (!/^[-]?([1-9]\d*|0)$/.test(countStr)) {
        DEMO_UTIL.okDialog(
            demoMsg('purchase-payment.dialog.err-not-number.title'),
            demoMsg('purchase-payment.dialog.err-not-number.msg')
        );
        return;
    }

    var total = new BigNumber($('#total').html());
    var count = new BigNumber(row.find('input[name="count"]').val());
    var price = new BigNumber(row.find('div[name="price"]').html());
    total = total.add(count.times(price));
    if (total < 0) {
        DEMO_UTIL.okDialog(
            demoMsg('purchase-payment.dialog.err-minus-total.title'),
            demoMsg('purchase-payment.dialog.err-minus-total.msg')
        );
        return;
    }
    $('#total').html(total.toString(10));

    refreshQr(total);
    reflectToDB(total);
};

var refreshQr = function (total) {
    var tokenAddress = LOCAL_STORAGE.getTokenAddress();
    var storeAccount = LOCAL_STORAGE.getStoreAccount();
    var tokenRate = LOCAL_STORAGE.getTokenRate();

    var qrContent = {
        slipId : $('#slip-id').html(),
        store : storeAccount.getAddress(),
        token : tokenAddress,
        amount : new BigNumber(total).div(tokenRate).round().toString(10),
        rate : tokenRate
    };
    var qrValue = JSON.stringify(qrContent);

    $("#button").prop("disabled", true);

    $('#qrcode').empty();
    $('#qrcode').qrcode(qrValue);
    $('#qrcode-content').val(qrValue);
    $('#qrcode-content-view').html(JSON.stringify(qrContent, null, '    '));
    $('#qr-area').css('display', 'block');
};

var reflectToDB = function (total) {
    var qrValue = $('#qrcode-content').val();
    var qr = JSON.parse(qrValue);

    var slips = LOCAL_STORAGE.getSalesSlipsFromStoreDB();
    var slip;
    for (var i = 0; i < slips.length; i++) {
        if (slips[i].slipId == qr.slipId) {
            slip = slips[i];
            break;
        }
    }
    if (slip) {
        slip.total = total;
        slip.rate = LOCAL_STORAGE.getTokenRate();
    } else {
        slips.push({slipId:qr.slipId, total:total, rate:LOCAL_STORAGE.getTokenRate()});
    }
    LOCAL_STORAGE.setSalesSlipsToStoreDB(slips);
};

var openPayment = function () {

    var dialogContent = $('#user-terminal-area div:first').clone(true);

    var qrValue = $('#qrcode-content').val();
    var qr = JSON.parse(qrValue);

    dialogContent.find('div[name="token-unit-price"]').html(qr.rate.toFixed(1));
    dialogContent.find('div[name="account-amount"]').html(qr.amount);

    var account = LOCAL_STORAGE.getUserAccounts()[$('#users').val()];
    var contract = ETH_UTIL.getContract(account);
    contract.call('', 'ProxyController', 'getReceipt', [PAY_AT_TABLE, qr.store, qr.slipId], PROXY_CONTROLLER_ABI, function(err, res) {
        if (err) {
            console.error(err);
            return;
        }
        console.log(res);

        var addr = res[0];
        var paidAmount = res[1];
        var billingAmount = new BigNumber(qr.amount).minus(paidAmount);
        dialogContent.find('div[name="paid"]').html(res[1].toString(10));
        dialogContent.find('div[name="billing-amount"]').html(billingAmount.toString(10));

        if (paidAmount.gt(0)) {
            var payersArea = dialogContent.find('div[name="payers-area"]');
            setPayers(account, qr.store, qr.slipId, payersArea)
        }

        contract.call('', 'ProxyController', 'getBalance', [qr.token, account.getAddress()], PROXY_CONTROLLER_ABI, function(err, res) {
            if (err) {
                console.error(err);
                return;
            }
            console.log(res);
            dialogContent.find('div[name="retained-balance"]').html(res[0].toString(10));

            if (billingAmount.gt(0)) {
                dialogContent.find('button[name="pay"]').prop('disabled', false);
            }

            $("#dialog").html(dialogContent);
            $("#dialog").dialog({
                modal: true,
                title: demoMsg('common.caption.smart-phone') + ' ( ' + demoMsg('common.content.payer') + '-' + (parseInt($('#users').val()) + 1) + ' )',
                width: 600,
                open: function (event, ui) {
                    $(".ui-dialog-titlebar-close").hide();
                },
                buttons: {}
            });
        });
    });
};

var pay = function (obj) {

    closeDialog();
    if (DEMO_UTIL.isLoading()) return;
    if (!DEMO_UTIL.startLoad()) return;

    var qrValue = $('#qrcode-content').val();
    var qr = JSON.parse(qrValue);

    var retainedBalance = $(obj).closest('div[name="dialog-area"]').find('div[name="retained-balance"]').html();
    if (retainedBalance == '***') {
        alert('Unknown retained balance');
    }
    if (new BigNumber(retainedBalance).lt(new BigNumber(qr.amount))) {
        DEMO_UTIL.stopLoad();
        DEMO_UTIL.okDialog(
            demoMsg('purchase-payment.dialog.err-retained-balance.title'),
            demoMsg('purchase-payment.dialog.err-retained-balance.msg')
        );
        return;
    }


    var account = LOCAL_STORAGE.getUserAccounts()[$('#users').val()];
    var contract = ETH_UTIL.getContract(account);
    var nonce, sign;
    contract.call('', 'ProxyController', 'getPayAtTableNonce', [PAY_AT_TABLE, account.getAddress()], PROXY_CONTROLLER_ABI, function(err, res) {
        if (err) {
            console.error(err);
            return;
        }
        console.log(res);
        nonce = res[0].toString(10);
        account.sign('', ethClient.utils.hashBySolidityType(['address', 'bytes32', 'address', 'bytes32', 'address', 'uint', 'uint'], [PAY_AT_TABLE, 'payWithSign', qr.store, qr.slipId, qr.token, qr.amount, nonce]), function(err, res) {
            if (err) {
                console.error(err);
                return;
            }
            console.log(res);
            sign = res;
            contract.sendTransaction('', 'ProxyController', 'pay', [PAY_AT_TABLE, qr.store, qr.slipId, qr.token, qr.amount, nonce, sign], PROXY_CONTROLLER_ABI, function(err, res) {
                DEMO_UTIL.stopLoad();
                if (err) {
                    console.error(err);
                    DEMO_UTIL.okDialog(
                        demoMsg('purchase-payment.dialog.err-fail-to-pay.title'),
                        demoMsg('purchase-payment.dialog.err-fail-to-pay.msg')
                    );
                    return;
                }
                console.log(res);
                DEMO_UTIL.okDialog(
                    demoMsg('purchase-payment.dialog.complete.title'),
                    demoMsg('purchase-payment.dialog.complete.msg')
                );
                return;
            });
        });
    });
};

var openCheck = function () {

    var dialogContent = $('#cashier-terminal-area div:first').clone(true);

    var qrValue = $('#qrcode-content').val();
    var qr = JSON.parse(qrValue);

    dialogContent.find('div[name="token-unit-price"]').html(qr.rate.toFixed(1));
    dialogContent.find('div[name="account-amount"]').html(qr.amount);

    var account = LOCAL_STORAGE.getUserAccounts()[$('#users').val()];
    var contract = ETH_UTIL.getContract(account);
    contract.call('', 'ProxyController', 'getReceipt', [PAY_AT_TABLE, qr.store, qr.slipId], PROXY_CONTROLLER_ABI, function(err, res) {
        if (err) {
            console.error(err);
            return;
        }
        console.log(res);

        var addr = res[0];
        var paidAmount = res[1];
        var billingAmount = new BigNumber(qr.amount).minus(paidAmount);
        dialogContent.find('div[name="paid"]').html(res[1].toString(10));
        dialogContent.find('div[name="paid-cash"]').html(res[1].times(qr.rate).toString(10));
        dialogContent.find('div[name="payment-balance"]').html(billingAmount.toString(10));

        if (paidAmount.gt(0)) {
            dialogContent.find('button[name="refund"]').prop('disabled', false);
            var payersArea = dialogContent.find('div[name="payers-area"]');
            setPayers(account, qr.store, qr.slipId, payersArea)
        }

        $("#dialog").html(dialogContent);
        $("#dialog").dialog({
            modal: true,
            title: demoMsg('common.caption.register-terminal'),
            width: 600,
            open: function (event, ui) {
                $(".ui-dialog-titlebar-close").hide();
            },
            buttons: {}
        });
    });
};

var refund = function () {

    closeDialog();
    if (DEMO_UTIL.isLoading()) return;
    if (!DEMO_UTIL.startLoad()) return;

    var qrValue = $('#qrcode-content').val();
    var qr = JSON.parse(qrValue);


    var account = LOCAL_STORAGE.getStoreAccount();
    var contract = ETH_UTIL.getContract(account);

    approve(qr.token, account, qr.amount, function() {
        refundRetry(0, qr, account, function() {
            DEMO_UTIL.stopLoad();
            DEMO_UTIL.okDialog(
                demoMsg('purchase-payment.dialog.refund-complete.title'),
                demoMsg('purchase-payment.dialog.refund-complete.msg')
            );
        });
    });
};

var approve = function(tokenAddr, account, amount, callback) {

    var contract = ETH_UTIL.getContract(account);
    var nonce, sign;
    contract.call('', 'ProxyController', 'getNonce', [tokenAddr, account.getAddress()], PROXY_CONTROLLER_ABI, function(err, res) {
        if (err) {
            console.error(err);
            return;
        }
        console.log(res);
        nonce = res[0].toString(10);
        account.sign('', ethClient.utils.hashBySolidityType(['address', 'bytes32', 'address', 'uint', 'uint'], [tokenAddr, 'approveWithSign', PAY_AT_TABLE, amount, nonce]), function(err, res) {
            if (err) {
                console.error(err);
                return;
            }
            console.log(res);
            sign = res;
            contract.sendTransaction('', 'ProxyController', 'approve', [tokenAddr, PAY_AT_TABLE, amount, nonce, sign], PROXY_CONTROLLER_ABI, function(err, res) {
                if (err) {
                    console.error(err);
                    return;
                }
                callback();
            });
        });
    });
};

var refundRetry = function(retryCount, qr, account, callback) {

    var contract = ETH_UTIL.getContract(account);
    var nonce;
    contract.call('', 'ProxyController', 'getPayAtTableNonce', [PAY_AT_TABLE, account.getAddress()], PROXY_CONTROLLER_ABI, function(err, res) {
        if (err) {
            console.error(err);
            return;
        }
        console.log(res);
        nonce = res[0].toString(10);

        var sign;
        account.sign('', ethClient.utils.hashBySolidityType(['address', 'bytes32', 'bytes32', 'uint'], [PAY_AT_TABLE, 'refundWithSign', qr.slipId, nonce]), function(err, res) {
            if (err) {
                console.error(err);
                return;
            }
            console.log(res);
            sign = res;
            contract.sendTransaction('', 'ProxyController', 'refund', [PAY_AT_TABLE, qr.slipId, nonce, sign], PROXY_CONTROLLER_ABI, function(err, res) {
                if (err) {
                    if (retryCount < MAX_RETRY_COUNT) {
                        retryCount++;
                        console.error(err + ':retry' + retryCount);
                        setTimeout(function() {refundRetry(retryCount, qr, account, callback)}, RETRY_WAITING_TIME);
                        return;
                    }
                    console.error(err);
                    alert('failed to refund transaction');
                    return;
                }
                console.log(res);
                callback();
            });
        });
    });
};

var setPayers = function (account, storeAddress, slipId, payersArea) {
    payersArea.css('display', 'block');
    var contract = ETH_UTIL.getContract(account);
    contract.call('', 'ProxyController', 'getPayers', [PAY_AT_TABLE, storeAddress, slipId], PROXY_CONTROLLER_ABI, function(err, res) {
        if (err) {
            console.error(err);
            return;
        }
        var payers = payersArea.find('div[name="payers"]');
        payers.empty();
        res[0].forEach(function(addr, index){
            var row = $('#payer-template div:first').clone(true);
            row.find('div[name="address"]').html(addr);
            setPayerAmount(account, storeAddress, slipId, addr, row);
            payers.append(row);
        });
    });
};

var setPayerAmount = function (account, storeAddress, slipId, payer, row) {
    var contract = ETH_UTIL.getContract(account);
    contract.call('', 'ProxyController', 'getPaidAmount', [PAY_AT_TABLE, storeAddress, slipId, payer], PROXY_CONTROLLER_ABI, function(err, res) {
        if (err) {
            console.error(err);
            return;
        }
        row.find('div[name="amount"]').html(res.toString(10));
    });
};

var closeDialog = function () {
    $("#dialog").dialog('close');
};
