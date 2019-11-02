
export const debug = createDebug();

function createDebug(){
    try {
        const debugFactory = require("debug");
        return debugFactory('rx-mqtt-client');
    }
    catch (err){
        return (...args: any[]) => console.log(args);
    };
}