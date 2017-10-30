const DEMO_TOKEN_SYMBOL = 'PAT';
const DEMO_TOKEN_NAME = 'Pay@Table DEMO Token';
const DEMO_TOKEN_AMOUNT = 1000000;
const MAX_RETRY_COUNT = 3;
const RETRY_WAITING_TIME = 5000;

var prepareAccount = function(callback) {

    var tokenAddress = LOCAL_STORAGE.getTokenAddress();
    var storeAccount = LOCAL_STORAGE.getStoreAccount();
    var userAccounts = LOCAL_STORAGE.getUserAccounts();
    if (!tokenAddress || !storeAccount || !userAccounts || userAccounts.length != 2) {

        DEMO_UTIL.confirmDialog(
            demoMsg('common.dialog.err-no-setup.title'),
            demoMsg('common.dialog.err-no-setup.msg'),
            function() {

                DEMO_UTIL.startLoad();
                $(this).dialog("close");


                var userAccount0;
                var userAccount1;
                var storeAccount;
                registerAccount(userAccount0, function(userAccount0) {
                    registerAccount(userAccount1, function(userAccount1) {
                        var userAccounts = [userAccount0, userAccount1];
                        LOCAL_STORAGE.setUserAccounts(userAccounts);
                        registerAccount(storeAccount, function(storeAccount) {
                            LOCAL_STORAGE.setStoreAccount(storeAccount);
                            LOCAL_STORAGE.setSalesSlipsToStoreDB([]);
                            createToken(userAccount0, (2 * DEMO_TOKEN_AMOUNT), function (tokenAddress) {
                                sendToken(0, tokenAddress, userAccount0, userAccount1, DEMO_TOKEN_AMOUNT, function(nonceOfUA0) {
                                    addAllowToken(0, tokenAddress, storeAccount, function(nonceOfStore) {
                                        approve(nonceOfUA0, tokenAddress, userAccount0, DEMO_TOKEN_AMOUNT, function() {
                                            approve(0, tokenAddress, userAccount1, DEMO_TOKEN_AMOUNT, function() {
                                                LOCAL_STORAGE.setTokenAddress(tokenAddress);
                                                LOCAL_STORAGE.setTokenRate(1);
                                                DEMO_UTIL.stopLoad();
                                                callback();
                                            });
                                        });
                                    });
                                });
                            });
                        });
                    });
                });
            },
            function() {
                window.location.href = './index.html';
            }
        );
        return;
    }
    callback();
};

var createToken = function (account, amount, callback) {

    var contract = ETH_UTIL.getContract(account);
    contract.sendTransaction('', 'Demo', 'createToken', [DEMO_TOKEN_SYMBOL, DEMO_TOKEN_NAME, amount], DEMO_ABI, function(err, res) {
        if (err) {
            console.error(err);
            alert(err);
            return;
        }

        console.log(res);
        var getTokenContractAddress = function(txHash, getTokenCallback) {
            contract.getTransactionReceipt(txHash, function(err, res) {
                if (err) getTokenCallback(err);
                else if (res) callback('0x' + res.logs[0].data.substr(-40));
                else setTimeout(function() { getTokenContractAddress(txHash, getTokenCallback); }, RETRY_WAITING_TIME);
            });
        };
        getTokenContractAddress(res, function(err, tokenAddr) {
            if (err) console.error(err);
            else alert(tokenAddr);
        });
    });
};

var sendToken = function (nonce, tokenAddr, account, toAccount, amount, callback) {
    sendTokenRetry(0, nonce, tokenAddr, account, toAccount, amount, callback);
};

var sendTokenRetry = function (retryCount, nonce, tokenAddr, account, toAccount, amount, callback) {
    var contract = ETH_UTIL.getContract(account);
    var sign;
    account.sign('', ethClient.utils.hashBySolidityType(['address', 'bytes32', 'address', 'uint', 'uint'], [tokenAddr, 'transferWithSign', toAccount.getAddress(), amount, nonce]), function(err, res) {
        if (err) {
            console.error(err);
            return;
        }
        sign = res;
        contract.sendTransaction('', 'ProxyController', 'transfer', [tokenAddr, toAccount.getAddress(), amount, nonce, sign], PROXY_CONTROLLER_ABI, function(err, res) {
            if (err) {
                if (retryCount < MAX_RETRY_COUNT) {
                    retryCount++;
                    console.error(err + ':retry' + retryCount);
                    setTimeout(function() {sendTokenRetry(retryCount, nonce, tokenAddr, account, toAccount, amount, callback);}, RETRY_WAITING_TIME);
                    return ;
                }
                console.error(err);
                alert('failed to send token transaction');
                return;
            }
            callback(++nonce);
        });
    });
};

var addAllowToken = function (nonce, tokenAddr, account, callback) {
    addAllowTokenRetry(0, nonce, tokenAddr, account, callback);
};

var addAllowTokenRetry = function (retryCount, nonce, tokenAddr, account, callback) {

    var contract = ETH_UTIL.getContract(account);
    var sign;
    var contract = ETH_UTIL.getContract(account);
    account.sign('', ethClient.utils.hashBySolidityType(['address', 'bytes32', 'address', 'uint'], [PAY_AT_TABLE, 'addAllowTokenWithSign', tokenAddr, nonce]), function(err, res) {
        if (err) {
            console.error(err);
            return;
        }
        console.log(res);
        sign = res;
        contract.sendTransaction('', 'ProxyController', 'addAllowToken', [PAY_AT_TABLE, tokenAddr, nonce, sign], PROXY_CONTROLLER_ABI, function(err, res) {
            if (err) {
                if (retryCount < MAX_RETRY_COUNT) {
                    retryCount++;
                    console.error(err + ':retry' + retryCount);
                    setTimeout(function() {addAllowTokenRetry(retryCount, nonce, tokenAddr, account, callback);}, RETRY_WAITING_TIME);
                    return ;
                }
                console.error(err);
                alert('failed to allow token transaction');
                return;
            }
            console.log(res);
            callback(++nonce);
        });
    });
};


var approve = function(nonce, tokenAddr, account, amount, callback) {
    approveRetry(0, nonce, tokenAddr, account, amount, callback);
}
var approveRetry = function(retryCount, nonce, tokenAddr, account, amount, callback) {

    var contract = ETH_UTIL.getContract(account);
    var sign;
    account.sign('', ethClient.utils.hashBySolidityType(['address', 'bytes32', 'address', 'uint', 'uint'], [tokenAddr, 'approveWithSign', PAY_AT_TABLE, amount, nonce]), function(err, res) {
        if (err) {
            console.error(err);
            return;
        }
        console.log(res);
        sign = res;
        contract.sendTransaction('', 'ProxyController', 'approve', [tokenAddr, PAY_AT_TABLE, amount, nonce, sign], PROXY_CONTROLLER_ABI, function(err, res) {
            if (err) {
                if (retryCount < MAX_RETRY_COUNT) {
                    retryCount++;
                    console.error(err + ':retry' + retryCount);
                    setTimeout(function() {approveRetry(retryCount, nonce, tokenAddr, account, amount, callback);}, RETRY_WAITING_TIME);
                    return;
                }
                console.error(err);
                alert('failed to approve transaction');
                return;
            }
            callback();
        });
    });
};


var registerAccount = function(account, callback) {
    if (account) {
        callback(account);
        return;
    }
    ETH_UTIL.generateNewAccount(function(_newAccount) {
        callback(_newAccount);
    });
};
