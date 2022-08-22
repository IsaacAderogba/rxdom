import {
  FiberComponent,
  FiberInstance,
  RxComponent,
  RxComponentTemplate,
  RxNode,
} from "./models";
import { Renderer } from "./renderers";
import {
  NodeProps,
  Attrs,
  createNodeProps,
  RequiredKeys,
  generateId,
  Unsubscribe,
  omit,
  isShallowEqual,
} from "./utils";

export type ComponentConfig = {
  renderer: Renderer;
  fiber: FiberComponent;
};

export class Component<
  S extends Attrs = Attrs,
  P extends Attrs = Attrs,
  C extends Attrs = Attrs
> {
  private unsubscribes: Unsubscribe[] = [];
  private renderer: Renderer;
  private template: RxComponentTemplate<S, P, C>;

  protected fiber: FiberComponent;
  protected state: Readonly<S>;
  protected props: Readonly<P>;
  protected context: Readonly<C>;

  constructor({ renderer, fiber }: ComponentConfig) {
    this.renderer = renderer;
    this.template = fiber.node.template;

    this.fiber = fiber;
    this.state = {} as S;
    this.props = fiber.node.props as P;
    this.context = this.initContext();
  }

  private initContext(): C {
    // register provider
    const { provider, consumer } = this.fiber.node.context;
    if (provider) this.unsubscribes.push(provider.registerProvider(this.fiber));

    // register consumers
    const consumers = new Map(
      Object.entries(consumer).map(([key, { contextProvider, selector }]) => {
        return [contextProvider, { key, selector }];
      })
    );
    const context: Attrs = {};

    const findAndRegister = (fiber?: FiberInstance): void => {
      if (!fiber) return;

      if ("component" in fiber && fiber.node.context.provider) {
        const contextProvider = fiber.node.context.provider;

        const match = consumers.get(contextProvider);
        if (match) {
          const { key, selector } = match;
          consumers.delete(contextProvider);

          this.unsubscribes.push(
            contextProvider.registerConsumer(fiber, (state) =>
              this.setContext((prev) => ({ ...prev, [key]: selector(state) }))
            )
          );

          context[key] = selector(contextProvider.accessValue(fiber));
        }
      }

      return findAndRegister(fiber.parent);
    };
    findAndRegister(this.fiber.parent);

    return context as C;
  }

  private removeContext() {
    this.unsubscribes.forEach((unsub) => unsub());
  }

  setContext(update: C | ((c: C) => C)) {
    // @ts-ignore
    const newCtx = typeof update === "function" ? update(this.context) : update;
    const isEqual = Object.entries(newCtx).every(([key, newSlice]) =>
      isShallowEqual(this.context[key], newSlice)
    );
    if (isEqual) return;

    this.context = newCtx;
    this.update(this.fiber.node);
  }

  setState(update: S | ((s: S) => S)) {
    // @ts-ignore
    const newState = typeof update === "function" ? update(this.state) : update;
    if (isShallowEqual(this.state, newState)) return;
    this.state = newState;
    this.update(this.fiber.node);
  }

  setProps(node: RxComponent) {
    const newProps = node.props as P;
    if (isShallowEqual(this.props, newProps)) return;
    this.props = newProps;
    this.update(node);
  }

  protected onMount(): void | (() => void) {}
  public mount() {
    setTimeout(() => {
      const onUnmount = this.onMount();
      if (onUnmount) this.onUnmount = onUnmount;
    });
  }

  private onUnmount(): void | (() => void) {}
  public unmount() {
    if (this.onUnmount) this.onUnmount();
    this.removeContext();
  }

  protected onUpdate() {}
  private update(node: RxComponent) {
    this.fiber.node = node;
    const child = this.renderer.render(
      this.fiber,
      this.fiber.dom.parentNode as HTMLElement,
      this.fiber.content[0],
      this.render()
    )!;

    this.fiber.dom = child.dom;
    this.fiber.content = [child];

    setTimeout(() => this.onUpdate());
  }

  public render(): RxNode {
    if (!this.template.render) throw new Error("Todo - render expected");
    return this.template.render({
      props: this.props,
      context: this.context,
      fiber: this.fiber,
    });
  }

  static compose = <S extends Attrs, P extends Attrs, C extends Attrs>(
    constructor: RxComponentTemplate<S, P, C>["constructor"],
    consumer: Context<S, P, C>["consumer"] = {} as C
  ) => {
    return (props: Props<P> & { key: string }) =>
      createComponent({ constructor }, { props, context: { consumer } });
  };
}

export const composeFunction = <
  P extends Attrs = Attrs,
  C extends Attrs = Attrs
>(
  render: Required<RxComponentTemplate<{}, P, C>>["render"],
  consumer: Context<{}, P, C>["consumer"] = {} as C
) => {
  const key = generateId();
  return (props: Props<P> = {} as P) =>
    createComponent(
      { render, constructor: Component },
      { props: { key, ...props }, context: { consumer } }
    );
};

export class ContextProvider {
  providerConsumers: Map<FiberComponent, Set<Callback>> = new Map();

  registerProvider(fiber: FiberComponent): Unsubscribe {
    if (!this.providerConsumers.has(fiber)) {
      this.providerConsumers.set(fiber, new Set());
    }
    return () => this.unregisterProvider(fiber);
  }

  private unregisterProvider(fiber: FiberComponent) {
    this.providerConsumers.delete(fiber);
  }

  registerConsumer(fiber: FiberComponent, cb: Callback): Unsubscribe {
    this.providerConsumers.get(fiber)!.add(cb);
    return () => this.unregisterConsumer(fiber, cb);
  }

  private unregisterConsumer(fiber: FiberComponent, cb: Callback) {
    this.providerConsumers.get(fiber)!.delete(cb);
  }

  accessValue(fiber: FiberComponent) {
    return omit(fiber.node.props, ["key", "content"]);
  }
}

export const composeContext = <
  P extends Attrs = Attrs,
  C extends Attrs = Attrs
>(
  render: Required<RxComponentTemplate<{}, P, C>>["render"],
  consumer: Context<{}, P, C>["consumer"] = {} as C
) => {
  const key = generateId();
  const contextProvider = new ContextProvider();

  const emitContext = (fiber: FiberComponent) => {
    const provider = fiber.node.context.provider;
    if (!provider) return;

    const consumers = provider.providerConsumers.get(fiber);
    if (!consumers) return;

    const value = provider.accessValue(fiber);
    for (const consumer of consumers) {
      consumer(value);
    }
  };

  const provider = (props: Props<P> = {} as P) =>
    createComponent(
      {
        constructor: Component,
        render: (args) => {
          emitContext(args.fiber);
          return render(args);
        },
      },
      {
        props: { key, ...props },
        context: { provider: contextProvider, consumer },
      }
    );

  const selector = <T = P>(
    selector: (state: P) => T = (s) => s as T
  ): ContextSelector => ({
    contextProvider,
    selector,
  });

  return [provider, selector] as const;
};

export const createComponent = <S = Attrs, P = Attrs, C = Attrs>(
  template: RxComponentTemplate<S, P, C>,
  options: { props: Props<P>; context: Context<S, P, C> }
): RxComponent => {
  const { props, context } = options;

  return {
    type: "component",
    props: createNodeProps(props),
    context,
    template: { ...template },
  };
};

export type ContextSelector = {
  contextProvider: ContextProvider;
  selector: (s: any) => any;
};

type Callback = (attrs: Attrs) => void;
type Props<P> = P & NodeProps;
type Context<S, P, C> = RequiredKeys<
  RxComponent<S, P, C>["context"],
  "consumer"
>;
