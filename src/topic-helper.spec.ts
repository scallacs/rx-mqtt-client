import { TopicExplorer, topicMatch } from "./topic-helper";
import { expect } from "chai";

/**
 * RxMqttClient test
 */
describe("TopicExplorer test", () => {

  it("TopicExplorer is instantiable", () => {
    expect(new TopicExplorer([], '')).to.be.instanceOf(TopicExplorer)
  })


  describe("topic level", function () {
    let topic = TopicExplorer.fromString(
      'level0/level1/level2',
    )

    before(function () {

    })

    it("get level with index 0 should return value 'level0'", async function () {
      expect(topic.level(0)).to.be.eq('level0');
    });

    it("get single level wildcard with index 0 should return value 'level1'", async function () {
      expect(topic.wildcard(0, 'level0/+/level2')).to.be.eq('level1');
    });

    it("get single level wildcard with invalid index shoud throw", async function () {
      expect(() => topic.wildcard(10, 'level0/+/level2')).to.throw('Wildcard with index ');
    });
    it("toString() should returns the topic", async function () {
      expect(topic.toString()).to.be.eql('level0/level1/level2')
    });

    // it("get multi level wildcard with index 0 should return value 'level1/level2'", async function () {
    //   expect(topic.wildcard(0, 'level0/#')).to.be.eq('level1/level2');
    // });

    it("get level with index that does not exist should return undefined", async function () {
      expect(topic.level(993)).to.be.eq(undefined);
    });

    it("get levels array", async function () {
      expect(topic.levels.length).to.be.eq(3);
    });
  });

  describe('topicMatch', function () {

    it("should return true when single level wildcard ", async function () {
      expect(topicMatch('level0/level1/level2', 'level0/+/level2')).to.be.true;
    });
    it("should return true when multi level wildcard ", async function () {
      expect(topicMatch('level0/level1/level2', 'level0/#')).to.be.true;
      expect(topicMatch('level0/level1/level2', '#/level2')).to.be.true;
      expect(topicMatch('level0/level1/level2', 'level1/#')).to.be.false;
      expect(topicMatch('level0/level1/level2', 'level0/#')).to.be.true;
    });
    it("should return true when exact match", async function () {
      expect(topicMatch('level0/level1/level2', 'level0/level1/level2')).to.be.true;
    });
    it("should return false when not match", async function () {
      expect(topicMatch('level0/level1/level2', 'level0/level2/level2')).to.be.false;
      expect(topicMatch('level0/level1/level2', 'level0/level2')).to.be.false;
      expect(topicMatch('level0/level1/level2', '')).to.be.false;
    });
  })
})
