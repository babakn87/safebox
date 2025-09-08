const funcs = require("./index.js");

const args = process.argv.slice(2);
const funcName = args[0];
const params = args.slice(1);

async function main() {
    if (!funcs[funcName]) {
        console.log("Invalid function. Valid functions : ", Object.keys(funcs).join(", "));
        return;
    }

    try {
        const result = await funcs[funcName](...params);
        if (result !== undefined) {
            console.log("Result:", result);
        }
    } catch (err) {
        console.error("Error while executing the function : ", err);
    }
}

main();
