var LOCAL_STORAGE = {};

var _prefix = 'pay-at-table.v0.';

var _tokenAddressKey = _prefix + 'token-address';
var _tokenRate = _prefix + 'token-rate';
var _storeAccountKey = _prefix + 'store-account';
var _userAccountKey = _prefix + 'user-account';
var _salesStoreDB = _prefix + 'store-db.sales';

LOCAL_STORAGE.getTokenAddress = function() {
    return localStorage.getItem(_tokenAddressKey);
};
LOCAL_STORAGE.setTokenAddress = function(_tokenAddress) {
    localStorage.setItem(_tokenAddressKey, _tokenAddress);
};

LOCAL_STORAGE.getTokenRate = function() {
    return parseFloat(localStorage.getItem(_tokenRate));
};
LOCAL_STORAGE.setTokenRate = function(_tokenAddress) {
    localStorage.setItem(_tokenRate, _tokenAddress);
};

LOCAL_STORAGE.getStoreAccount = function() {
    var serialized = localStorage.getItem(_storeAccountKey);
    return serialized ? ethClient.Account.deserialize(serialized) : null;
};
LOCAL_STORAGE.setStoreAccount = function(_account) {
    localStorage.setItem(_storeAccountKey, _account.serialize());
};

LOCAL_STORAGE.getUserAccounts = function() {
    var serialized = localStorage.getItem(_userAccountKey);
    if (!serialized) {
        return null;
    }
    var serialAccounts = JSON.parse(serialized);
    var accounts = [];
    for (var i = 0; i < serialAccounts.length; i++) {
        accounts.push(ethClient.Account.deserialize(serialAccounts[i]));
    }
    return accounts;
};
LOCAL_STORAGE.setUserAccounts = function(_accounts) {
    var serialAccounts = [];
    for (var i = 0; i < _accounts.length; i++) {
        serialAccounts.push(_accounts[i].serialize());
    }
    localStorage.setItem(_userAccountKey, JSON.stringify(serialAccounts));
};

LOCAL_STORAGE.getSalesSlipsFromStoreDB = function () {
    var a = JSON.parse(localStorage.getItem(_salesStoreDB));
    return a ? a: [];
};
LOCAL_STORAGE.setSalesSlipsToStoreDB = function (_jsonValue) {
    localStorage.setItem(_salesStoreDB, JSON.stringify(_jsonValue));
};
