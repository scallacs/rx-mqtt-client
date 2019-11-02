import { startBroker } from "./broker";

startBroker()
    .then((server) => console.info('Broker listening...'))
    .catch(err => console.error('Broker error', err));
