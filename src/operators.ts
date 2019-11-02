import { filter, map } from "rxjs/operators";
import { RxMqttClient } from "./rx-mqtt-client";
import { TopicExplorer, topicMatch } from "./topic-helper";

export function topicFilter(pattern: string) {
    return filter((value: RxMqttClient.RawMessage) => {
        return topicMatch(value.topicString, pattern);
    });
}

export function mapTopicWildcards(topicPattern: string) {
    return map((value: RxMqttClient.RawMessage): RxMqttClient.Message => {
        return {
            ...value,
            topic: TopicExplorer.fromString(
                value.topicString,
                topicPattern
            )
        }
    });
}