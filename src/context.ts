import { Component, createComponent } from "./components";
import { context } from "./fragments";
import { FiberComponent, RxComponent } from "./models";
import { NodeProps, Attrs, generateId, omit, Unsubscribe } from "./utils";

type Provider = FiberComponent;
type Consumer = FiberComponent;
type Callback = (attrs: Attrs) => void;

export class ContextProvider<V extends Attrs = Attrs> {
  private key = generateId();
  providerConsumers: Map<Provider, Map<Consumer, Callback>> = new Map();

  registerProvider(provider: Provider): Unsubscribe {
    if (!this.providerConsumers.has(provider)) {
      this.providerConsumers.set(provider, new Map());
    }
    return () => this.unregisterProvider(provider);
  }

  private unregisterProvider(provider: Provider) {
    this.providerConsumers.delete(provider);
  }

  registerConsumer(
    provider: Provider,
    consumer: Consumer,
    cb: Callback
  ): Unsubscribe {
    this.providerConsumers.get(provider)!.set(consumer, cb);
    return () => this.unregisterConsumer(provider, consumer);
  }

  private unregisterConsumer(provider: Provider, consumer: Consumer) {
    console.log("unregister", this.providerConsumers.get(provider)?.get(consumer))
    this.providerConsumers.get(provider)!.delete(consumer);
  }

  getValue(provider: Provider) {
    return omit(provider.node.props, ["key", "content"]);
  }

  Context(props: NodeProps & V): RxComponent {
    return createComponent(
      { constructor: ContextComponent },
      {
        props: { key: this.key, ...props },
        context: { provider: this, consumer: {} },
      }
    );
  }
}

export class ContextComponent extends Component {
  emitValues() {
    const provider = this.fiber.node.context.provider;
    if (!provider) return;

    const consumers = provider.providerConsumers.get(this.fiber);
    if (!consumers) return;

    const value = provider.getValue(this.fiber);
    for (const [_, callback] of consumers) {
      callback(value);
    }
  }

  render() {
    this.emitValues();
    return context(this.props);
  }
}

export const createProvider = <P extends Attrs>() => new ContextProvider<P>();
