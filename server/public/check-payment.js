$(document).ready(function() {
    prepareAccount(
        function() {
            refreshPage();
            $('#main-area').css('display', 'block');
        }
    );

});

var refreshPage = function() {

    refreshBalance();

    $('#slip-list').empty().append($('#slip-row-title-template div:first').clone(true));
    var salesSlips = LOCAL_STORAGE.getSalesSlipsFromStoreDB();
    for(var i = 0; i < salesSlips.length; i++) {
        addRow(salesSlips[i]);
    }

    if (salesSlips.length > 0) {
        $('#reset-button').css('display', 'block');
    }
};

var addRow = function(slip) {

    var row = $('#slip-row-template div:first').clone(true);
    row.attr('id', slip.slipId);
    row.find('a[name="slip-id"]').html(slip.slipId);
    row.find('div[name="total"]').html(slip.total);
    addPaymentValue(row, slip);
    $('#slip-list').append(row);
};

var addPaymentValue = function(row, slip) {
    var account = LOCAL_STORAGE.getStoreAccount();
    var contract = ETH_UTIL.getContract(account);

    contract.call('', 'ProxyController', 'getReceipt', [PAY_AT_TABLE, account.getAddress(), slip.slipId], PROXY_CONTROLLER_ABI, function(err, res) {
        if (err) {
            console.error(err);
            return;
        }
        console.log(res);

        var addr = res[0];
        var amount = res[1];

        if (amount == 0) {
            row.find('div[name="token-address"]').html('-');
            row.find('div[name="symbol"]').html('-');
            row.find('div[name="token-unit-price"]').html('-');
            row.find('div[name="token-amount"]').html('-');
            row.find('div[name="token-to-cash"]').html('-');
            row.find('div[name="cash-amount"]').html(slip.total);
            return;
        } else {
            row.find('div[name="token-address"]').html(addr.substring(0, 8) + '...').attr('title', addr);
            row.find('div[name="symbol"]').html(DEMO_TOKEN_SYMBOL); // fixed value is for demo
            row.find('div[name="token-unit-price"]').html(slip.rate.toFixed(1));
            row.find('div[name="token-amount"]').html(amount.toString(10));
            row.find('div[name="token-to-cash"]').html(amount.times(slip.rate).toString(10));
            row.find('div[name="cash-amount"]').html(new BigNumber(slip.total).minus(new BigNumber(amount).times(slip.rate)).toString(10));
        }
    });
};

var resetDB = function(slip) {
    LOCAL_STORAGE.setSalesSlipsToStoreDB([]);
    location.href = "./check-payment.html";
};

var refreshBalance = function () {
    refreshBalanceRetry(new BigNumber(-1), new BigNumber(-1), 0);
};
var refreshBalanceRetry = function (current, expected, retryCount) {

    $('#store-balance').removeClass("strong");
    $('#store-balance').html('Loading...');

    var account = LOCAL_STORAGE.getStoreAccount();
    var contract = ETH_UTIL.getContract(account);
    contract.call('', 'ProxyController', 'getBalance', [LOCAL_STORAGE.getTokenAddress(), account.getAddress()], PROXY_CONTROLLER_ABI, function(err, res) {
        if (err) {
            console.error(err);
            return;
        }
        console.log(res);
        if (current.equals(-1) || expected.equals(-1) || res[0].equals(expected) || retryCount >= MAX_RETRY_COUNT) {
            $('#store-balance').html(res[0].toString(10));
            $('#store-balance').addClass("strong");
        } else {
            retryCount++;
            setTimeout(function() {refreshBalanceRetry(current, expected, retryCount);}, RETRY_WAITING_TIME);
        }
    });
};

var openCheck = function (obj) {

    var targetRow = $(obj).closest('div[name="customer-row"]');
    var slipId = $(obj).html();

    var dialogContent = $('#cashier-terminal-area div:first').clone(true);

    var account = LOCAL_STORAGE.getStoreAccount();
    var contract = ETH_UTIL.getContract(account);
    contract.call('', 'ProxyController', 'getReceipt', [PAY_AT_TABLE, account.getAddress(), slipId], PROXY_CONTROLLER_ABI, function(err, res) {
        if (err) {
            console.error(err);
            return;
        }
        console.log(res);

        var addr = res[0];
        var paidAmount = res[1];

        var payersArea = dialogContent.find('div[name="payers-area"]');
        if (paidAmount.gt(0)) {
            setPayers(account, account.getAddress(), slipId, payersArea);
            dialogContent.find('button[name="refund"]').prop('disabled', false).click(function(){
                refund(slipId, addr, paidAmount);
            });
        } else {
            var payers = payersArea.find('div[name="payers"]');
            payers.empty();
            var row = $('#payer-template div:first').clone(true);
            row.find('div[name="address"]').html('----');
            row.find('div[name="amount"]').html('0');
            payers.append(row);

        }

        $("#dialog").html(dialogContent);
        $("#dialog").dialog({
            modal: true,
            title: demoMsg('check-payment.content.payment-detail'),
            width: 600,
            open: function (event, ui) {
                $(".ui-dialog-titlebar-close").hide();
            },
            buttons: {}
        });
    });
};

var refund = function (slipId, token, amount) {

    closeDialog();
    if (DEMO_UTIL.isLoading()) return;
    if (!DEMO_UTIL.startLoad()) return;

    var account = LOCAL_STORAGE.getStoreAccount();
    var contract = ETH_UTIL.getContract(account);

    approve(token, account, amount, function() {
        refundRetry(0, slipId, account, function() {
            var current = new BigNumber($('#store-balance').html());
            refreshBalanceRetry(current, current.minus(amount), 0);
            var row = $('#' + slipId);
            row.find('div[name="token-address"]').html('-');
            row.find('div[name="symbol"]').html('-');
            row.find('div[name="token-unit-price"]').html('-');
            row.find('div[name="token-amount"]').html('-');
            row.find('div[name="token-to-cash"]').html('-');
            row.find('div[name="cash-amount"]').html(row.find('div[name="total"]').html());
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

var refundRetry = function(retryCount, slipId, account, callback) {

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
        account.sign('', ethClient.utils.hashBySolidityType(['address', 'bytes32', 'bytes32', 'uint'], [PAY_AT_TABLE, 'refundWithSign', slipId, nonce]), function(err, res) {
            if (err) {
                console.error(err);
                return;
            }
            console.log(res);
            sign = res;
            contract.sendTransaction('', 'ProxyController', 'refund', [PAY_AT_TABLE, slipId, nonce, sign], PROXY_CONTROLLER_ABI, function(err, res) {
                if (err) {
                    if (retryCount < MAX_RETRY_COUNT) {
                        retryCount++;
                        console.error(err + ':retry' + retryCount);
                        setTimeout(function() {refundRetry(retryCount, slipId, account, callback);}, RETRY_WAITING_TIME);
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
