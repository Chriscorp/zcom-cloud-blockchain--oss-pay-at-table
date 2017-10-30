[Pay At Table](https://guide.blockchain.z.com/docs/oss/pay-at-table/) - GMO Blockchain Open Source
==================================================

License
--------------------------------------
License is [here](./LICENSE.txt).

Apart from forbidding the use of this software for criminal activity, this license is similar to the [MIT License](https://opensource.org/licenses/mit-license.php).

GMO Blockchain Open Source Common License document is [here](https://guide.blockchain.z.com/docs/oss/license/).

DEMO
--------------------------------------
You can check the operation of this sample project on this page.

http://oss.blockchain.z.com/pay-at-table/

Explanation
--------------------------------------
- #### GMO Blockchain Open Source
    http://guide.blockchain.z.com/docs/oss/

- #### Pay At Table
    http://guide.blockchain.z.com/docs/oss/pay-at-table/

Usage Guides
--------------------------------------

### Create Z.com Cloud Blockchain environment
see [Setup Development Environment](https://guide.blockchain.z.com/docs/init/setup/)

### Install application
```bash
git clone --recursive https://github.com/zcom-cloud-blockchain/oss-pay-at-table.git
cd oss-pay-at-table/server
npm install
```

### Deploy contracts
```bash
cd oss-pay-at-table/provider
truffle migrate
```

### Set up for Z.com Cloud Blockchain
See [Basic Configuration](https://guide.blockchain.z.com/docs/dapp/setup/)

- ##### Set CNS address on admin console
  1. Open a file 'provider/build/contracts/ContractNameService.json'

  2. Use 'networks.(network-id).address' to register as CNS address on admin console

See [Contract Creation Process](https://guide.blockchain.z.com/docs/dapp/contract/)
- ##### Set Contract ABIs on admin console
  1. Open following files
    ```bash
    'provider/build/contracts/ProxyController_v1.json'
    'provider/build/contracts/Demo_v1.json'
    ```
  2. Use 'networks.(network-id).address' and 'abi' values to register as Contract Addresses and ABIs on admin console

### Configure for client
Create server/public/js/config.json based on server/public/js/config_template.json. Edit "CNS" and "PAY_AT_TABLE" which you deployed.

### Start application
```bash
cd oss-pay-at-table
node server/app.js
```
