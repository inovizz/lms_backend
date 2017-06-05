# lms_backend_nodeJS

Go to lms/contracts folder and run following command to generate latest LMS.json file and copy it
into the lms_backend folder to run server.js

```
solc LMS.sol --combined-json abi,asm,ast,bin,bin-runtime,clone-bin,devdoc,interface,opcodes,srcmap,srcmap-runtime,userdoc > LMS.json
```

Once LMS.json is copied, run following commands -

```
$ npm  install
$ babel-node server.js
```
