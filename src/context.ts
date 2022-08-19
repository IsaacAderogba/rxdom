import { Component, createComponent } from "./components";
import { div } from "./fragments";
import { FiberComponent, RxComponent } from "./models";
import { ContentProps, Attrs } from "./utils";

type Provider = FiberComponent;
type Consumer = FiberComponent;
type Callback = (fiber: FiberComponent) => void;
export type ContextUnsubscribe = () => void;

export class ContextProvider<V extends Attrs = Attrs> {
  private providerConsumers: Map<Provider, Map<Consumer, Callback>> = new Map();

  registerProvider(provider: Provider): ContextUnsubscribe {
    this.providerConsumers.set(provider, new Map());
    return () => this.unregisterProvider(provider);
  }

  private unregisterProvider(provider: Provider) {
    this.providerConsumers.delete(provider);
  }

  registerConsumer(
    provider: Provider,
    consumer: Consumer,
    cb: Callback
  ): ContextUnsubscribe {
    this.providerConsumers.get(provider)!.set(consumer, cb);
    return () => this.unregisterConsumer(provider, consumer);
  }

  private unregisterConsumer(provider: Provider, consumer: Consumer) {
    this.providerConsumers.get(provider)!.delete(consumer);
  }

  Context(props: ContentProps & V): RxComponent {
    return createComponent(
      { constructor: Component, render: props => div(props) },
      { props, context: { provider: this, consumer: {} } }
    );
  }
}

export const createProvider = <P extends Attrs>() => new ContextProvider<P>();
