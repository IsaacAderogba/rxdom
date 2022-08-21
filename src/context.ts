import { FiberComponent } from "./models";
import { Attrs, omit, Unsubscribe } from "./utils";

type Provider = FiberComponent;
type Consumer = FiberComponent;
type Callback = (attrs: Attrs) => void;

export class ContextProvider {
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
    this.providerConsumers.get(provider)!.delete(consumer);
  }

  getValue(provider: Provider) {
    return omit(provider.node.props, ["key", "content"]);
  }
}
