// 通信服务导出
export { 
  messageBusFunction, 
  type Message, 
  type MessageBusInput, 
  type MessageBusOutput 
} from './message-bus';

export { 
  eventEmitterFunction, 
  type Event, 
  type EventListener, 
  type EventEmitterInput, 
  type EventEmitterOutput 
} from './event-emitter';

export { 
  pubSubFunction, 
  type PubSubMessage, 
  type Subscriber, 
  type PubSubInput, 
  type PubSubOutput 
} from './pub-sub';

// 通信服务函数列表
import { messageBusFunction } from './message-bus';
import { eventEmitterFunction } from './event-emitter';
import { pubSubFunction } from './pub-sub';

export const communicationFunctions = [
  messageBusFunction,
  eventEmitterFunction,
  pubSubFunction,
];
