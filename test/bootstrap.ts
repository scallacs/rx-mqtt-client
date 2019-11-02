import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';

console.log('Edit file ./test/bootstrap.ts for bootstraping tests');
declare var global : any;
chai.use(chaiAsPromised);

global.expect = chai.expect;