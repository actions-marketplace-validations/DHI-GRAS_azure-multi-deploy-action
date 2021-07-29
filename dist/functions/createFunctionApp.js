"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const child_process_promise_1 = require("child-process-promise");
exports.default = (pkg) => {
    try {
        if (!pkg.storageAccount) {
            throw Error(`${pkg.id} needs to specify storageAccount`);
        }
        void child_process_promise_1.exec(`az functionapp create --resource-group ${pkg.resourceGroup} --name ${pkg.id} --storage-account ${pkg.storageAccount} --runtime node --consumption-plan-location northeurope --functions-version 3 --disable-app-insights true`)
            .then(({ stdout }) => {
            const newAccountData = JSON.parse(stdout);
            console.log(`Created function app: ${pkg.id}: ${newAccountData.defaultHostName}`);
        })
            .catch((err) => {
            throw Error(err);
        });
    }
    catch (err) {
        throw Error(err);
    }
};