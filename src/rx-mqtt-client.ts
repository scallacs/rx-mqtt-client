import {
  Client,
  connect,
  IClientOptions,
  IClientPublishOptions,
  IClientSubscribeOptions,
  ISubscriptionGrant,
  Packet,
} from 'mqtt';
import { BehaviorSubject, Observable, Observer, of, Subject, throwError } from 'rxjs';
import { catchError, filter, first, map, share, timeout, take, tap } from 'rxjs/operators';

import { debug } from './debug';
import { mapTopicWildcards, topicFilter } from './operators';
import { TopicExplorer } from './topic-helper';

export const SINGLE_LEVEL_WILDCARD = '+';
export const MULTI_LEVEL_WILDCARD = '#';

/**
 * rxjs/mqtt client
 */
export class RxMqttClient {

  private _id: string;
  private _client?: Client;
  private _messages: Observable<RxMqttClient.RawMessage>;
  private _connectionState = new BehaviorSubject<RxMqttClient.ConnectionState>(RxMqttClient.ConnectionState.DISCONNECTED);
  private _connectionStateChange = new Subject<RxMqttClient.ConnectionStateEvent>();
  private _events: Subject<RxMqttClient.Event>;

  public get events() {
    return this._events.asObservable();
  };

  public get connectionState() {
    return this._connectionState.asObservable();
  }

  public get connectionStateValue(): RxMqttClient.ConnectionState {
    return this._connectionState.value;
  }

  get isConnected(): boolean {
    return this.connectionStateValue === RxMqttClient.ConnectionState.CONNECTED;
  }

  public get client() {
    return this._client;
  }

  public static fromClient(client: Client) {
    return new RxMqttClient(client);
  }

  constructor(client?: Client) {
    this._events = new Subject<RxMqttClient.Event>();
    this._messages = this._events
      .pipe(
        filter(msg => msg.type === RxMqttClient.EventType.message),
        map((msg: RxMqttClient.Event) => (msg as unknown as RxMqttClient.MessageEvent).message)
      );
    if (client) {
      let initalConnectionState: RxMqttClient.ConnectionState = RxMqttClient.ConnectionState.DISCONNECTED;
      if (client.connected) {
        initalConnectionState = RxMqttClient.ConnectionState.CONNECTED;
      }
      else if (client.disconnecting) {
        initalConnectionState = RxMqttClient.ConnectionState.DISCONNECTING;
      }
      else if (client.reconnecting) {
        initalConnectionState = RxMqttClient.ConnectionState.CONNECTING;
      }
      this._connectionState = new BehaviorSubject(initalConnectionState);
      this.setupClient(client);
    }
    this._id = `MqttClient-${Math.floor(Math.random() * 100000)}`;
  }

  public connect(url: string, clientOptions: IClientOptions = {}, connectOptions: { timeout?: number } = {}): Observable<void> {
    if (this._client && this._client.connected) {
      return throwError(RxMqttClient.Errors.alreadyConnected());
    }
    this._setConnectionState(RxMqttClient.ConnectionState.CONNECTING);
    this.setupClient(connect(url, clientOptions));
    return this._waitForConnectionState(
      RxMqttClient.ConnectionState.CONNECTED,
      connectOptions.timeout || 10000
    )
      .pipe(
        catchError(err => {
          if (err === "timeout") {
            if (this._client) {
              // ending client connection ? 
              this._client.end();
            }
          }
          throw err;
        })
      )
  }
  private setupClient(client: Client) {
    this._client = client;
    this.initEvents();
  }

  public disconnect(options: { timeout?: number } = {}): Observable<void> {
    if (this._client) {
      this._setConnectionState(RxMqttClient.ConnectionState.DISCONNECTING);
      this._client.end(true, {}, () => {
        debug(this._id, 'ended !');
        this._setConnectionState(RxMqttClient.ConnectionState.DISCONNECTED);
      });
      this._client = undefined;
      return this._waitForConnectionState(
        RxMqttClient.ConnectionState.DISCONNECTED,
        options.timeout || 10000
      )
        .pipe(
          catchError(err => {
            if (err === "tiemout") {
              return of(undefined);
            }
            throw err;
          })
        )
    }
    else {
      return of(undefined);
    }
  }

  public subscribe(topic: string | string[], options: IClientSubscribeOptions = {
    qos: 1
  }): Observable<ISubscriptionGrant[]> {
    return new Observable((emitter: Observer<ISubscriptionGrant[]>) => {
      if (!this._client){
        throw RxMqttClient.Errors.internalError('Client is not defined');
      }
      debug(this._id, 'subscribing to topics ', topic);
      this._client
        .subscribe(topic, options, (error: Error, granted: ISubscriptionGrant[]) => {
          if (error) {
            debug(this._id, 'Subcription to topic error ', error);
            emitter.error(error);
          }
          else {
            debug(this._id, 'Subcription to topic granted ', granted);
            emitter.next(granted);
            emitter.complete();
          }
        });
    })
      .pipe(
        share()
      );
  }

  public unsubscribe(topic: string | string[], opts?: Object): Observable<Packet | undefined> {
    return new Observable((emitter: Observer<Packet | undefined>) => {
      this._client!
        .unsubscribe(topic, opts, (error?: Error, packet?: Packet) => {
          if (error) {
            emitter.error(error);
          }
          else {
            emitter.next(packet);
            emitter.complete();
          }
        });
    })
      .pipe(
        share()
      );
  }

  public publish(topic: string, message: string | Buffer, options: IClientPublishOptions = { qos: 0 }): Observable<void> {
    return new Observable((emitter: Observer<void>) => {
        debug(this._id, `publishing on topic "${topic}"`);
        // if (typeof message !== "string" && !(message instanceof Buffer)){
        //   message = JSON.stringify(message);
        // }
        this._client!.publish(
          topic,
          message,
          options,
          (error?: Error, packet?: Packet) => {
            debug(this._id, `publish on topic "${topic}" done!`);
            if (error) {
              emitter.error(error);
            }
            else {
              emitter.next();
              emitter.complete();
            }
          }
        )
      })
      .pipe(
        share()
      )
  }

  /**
   * Create an observable stream that emits top
   * @param topic 
   */
  public stream(topic: string): Observable<RxMqttClient.Message> {
    return this
      .messages
      .pipe(
        topicFilter(topic),
        mapTopicWildcards(topic)
      )
  }

  public get messages(): Observable<RxMqttClient.RawMessage> {
    return this._messages;
  }

  private initEvents(): void {
    if (!this._client) {
      throw RxMqttClient.Errors.internalError(`_client has not been instantiated yet`);
    }
    this._client.on('connect', () => {
      debug(this._id, 'received connect event!');
      this._setConnectionState(RxMqttClient.ConnectionState.CONNECTED);
      this._events.next({
        type: RxMqttClient.EventType.connect
      });
    });

    this._client.on('message', (topic: string, payload: Buffer, packet: Packet) => {
      this._events.next({
        type: RxMqttClient.EventType.message,
        message: {
          topicString: topic,
          payload: payload,
          packet: packet
        }
      });

    });

    this._client.on('offline', () => {
      this._events.next({
        type: RxMqttClient.EventType.offline
      });
      if (this._client) {
        this._client.end();
      }
    });

    this._client.on('close', () => {
      debug(this._id, 'close event');
      this._events.next({
        type: RxMqttClient.EventType.close
      });
      this._setConnectionState(RxMqttClient.ConnectionState.DISCONNECTED);
      if (this._client) {
        this._client.end();
      }
    });

    this._client.on('error', (error: Error) => {
      debug(this._id, 'error event', error);
      this._events.next({
        type: RxMqttClient.EventType.error,
        error: RxMqttClient.Errors.unknownError(error)
      });
    });

  }

  private _setConnectionState(state: RxMqttClient.ConnectionState) {
    if (this._connectionState.value !== state) {
      debug(this._id, 'New connection state: ', state, 'previous state: ', this._connectionState.value);
      this._connectionState.next(state);
      this._connectionStateChange.next({
        newState: state,
        oldState: this._connectionState.value
      })
    }
  }

  private _waitForConnectionState(connectionState: RxMqttClient.ConnectionState, timeoutMs: number = 10000): Observable<void> {
    return this._connectionStateChange
      .pipe(
        first(event => event.newState === connectionState),
        timeout(timeoutMs),
        // todo add custom error
        map(_ => undefined)
      );
  }
}

export namespace RxMqttClient {

  export enum ErrorCode {
    AlreadyConnected = "AlreadyConnected",
    InternalError = "InternalError",
    Unknown = "Unknown"
  }

  export class Errors extends Error {

    public constructor(public code: ErrorCode, msg: string, public cause?: Error) {
      super(msg);
    }

    public static unknownError(error: Error): Error {
      return new Errors(
        ErrorCode.Unknown,
        `Unknown error: ${error.message}`,
        error
      );
    }
    public static alreadyConnected(): Error {
      return new Errors(
        ErrorCode.AlreadyConnected,
        `Mqtt client is already connected. Disconnect first.`
      );
    }

    public static internalError(msg: string): Error {
      return new Errors(
        ErrorCode.InternalError,
        `Internal error: ${msg}`
      );
    }
  }

  export interface ConnectionStateEvent {
    oldState: ConnectionState,
    newState: ConnectionState
  }

  export enum ConnectionState {
    CONNECTED = "CONNECTED",
    DISCONNECTED = "DISCONNECTED",
    CONNECTING = "CONNECTING",
    DISCONNECTING = "DISCONNECTING"
  }

  export type Event = MessageEvent | ConnectEvent | OfflineEvent | CloseEvent | ErrorEvent;

  export interface MessageEvent {
    type: EventType.message,
    message: RawMessage
  }

  export interface ConnectEvent {
    type: EventType.connect,
  }

  export interface OfflineEvent {
    type: EventType.offline,
  }

  export interface CloseEvent {
    type: EventType.close,
  }

  export interface ErrorEvent {
    type: EventType.error,
    error: Error
  }

  export enum EventType {
    error = 'error',
    close = 'close',
    offline = 'offline',
    message = 'message',
    connect = 'connect'
  }

  export interface RawMessage {
    topicString: string,
    payload: Buffer,
    packet: Packet
  }

  export interface Message extends RawMessage {
    topic: TopicExplorer
  }
}