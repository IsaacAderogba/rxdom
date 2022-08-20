import { Component, createComponent } from "./components";
import { context } from "./fragments";
import { FiberComponent, RxComponent } from "./models";
import { NodeProps, Attrs, generateId, omit } from "./utils";

type Provider = FiberComponent;
type Consumer = FiberComponent;
type Callback = (fiber: FiberComponent) => void;
export type ContextUnsubscribe = () => void;

export class ContextProvider<V extends Attrs = Attrs> {
  private key = generateId();
  private providerConsumers: Map<Provider, Map<Consumer, Callback>> = new Map();

  registerProvider(provider: Provider): ContextUnsubscribe {
    if (!this.providerConsumers.has(provider)) {
      this.providerConsumers.set(provider, new Map());
    }
    console.log("registerProvider", this.providerConsumers);
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
    console.log("registerConsumer", this.providerConsumers);
    return () => this.unregisterConsumer(provider, consumer);
  }

  private unregisterConsumer(provider: Provider, consumer: Consumer) {
    this.providerConsumers.get(provider)!.delete(consumer);
  }

  getValue(provider: Provider) {
    return omit(provider.node.props, ["key", "content"]);
  }

  Context(props: NodeProps & V): RxComponent {
    return createComponent(
      { constructor: Component, render: props => context(props) },
      {
        props: { key: this.key, ...props },
        context: { provider: this, consumer: {} },
      }
    );
  }
}

export const createProvider = <P extends Attrs>() => new ContextProvider<P>();
