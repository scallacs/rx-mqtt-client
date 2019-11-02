import { expect } from 'chai';

import { topicMatch } from './topic-helper';

/**
 * RxMqttClient test
 */
describe("operators test", () => {

    describe('topicMatchPattern', function(){

        it('exact match should return true', function(){
            expect(
                topicMatch('/level1/level2/level3', '/level1/level2/level3')
            ).to.be.true;
        })
        
        it('invalid match should return false', function(){
            expect(
                topicMatch('/level1/other/level3', '/level1/level2/level3')
            ).to.be.false;
        })

        it('single level wildcard match should return true', function(){
            expect(
                topicMatch('/level1/level2/level3', '/level1/+/level3')
            ).to.be.true;
        })

        it('multi level wildcard match should return true', function(){
            expect(
                topicMatch('/level1/level2/level3', '/level1/#')
            ).to.be.true;
        })
        
        
        // it('regex match should return true', function(){
        //     expect(
        //         topicMatchPattern('/level1/+/level3', /^.*$/)
        //     ).to.be.true;
        // })
    });
})
