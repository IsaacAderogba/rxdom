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
    const { unsubscribes, provider, consumer } = this.fiber.node.context;
    if (provider) unsubscribes.push(provider.registerProvider(this.fiber));

    // register consumers
    const consumers = new Map(Object.entries(consumer).map(([k, v]) => [v, k]));
    const context: Attrs = {};

    const findAndRegister = (fiber?: FiberInstance): void => {
      if (!fiber) return;

      if ("component" in fiber && fiber.node.context.provider) {
        const contextProvider = fiber.node.context.provider;
        const key = consumers.get(contextProvider);

        if (key) {
          consumers.delete(contextProvider);
          unsubscribes.push(
            contextProvider.registerConsumer(fiber, this.fiber, () => {
              console.log("callback", this);
            })
          );

          context[key] = contextProvider.getValue(fiber);
        }
      }

      return findAndRegister(fiber.parent);
    };
    findAndRegister(this.fiber.parent);
    console.log("added", this.fiber, this.fiber.node.context.unsubscribes);

    return context as C;
  }

  private removeContext() {
    console.log("removing", this.fiber.node.context.unsubscribes);
    this.fiber.node.context.unsubscribes.forEach(unsub => unsub());
  }

  setState(state: S | ((s: S) => S)) {
    // @ts-ignore
    this.state = typeof state === "function" ? state(this.state) : state;
    this.update(this.fiber.node);
  }

  setProps(node: RxComponent) {
    this.props = node.props as P;
    return this.update(node);
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
    const child = this.renderer.render(
      this.fiber,
      this.fiber.dom.parentNode as HTMLElement,
      this.fiber.content[0],
      this.render()
    )!;

    this.fiber.dom = child.dom;
    this.fiber.content = [child];
    this.fiber.node = node.context;

    setTimeout(() => this.onUpdate());
    return this.fiber;
  }

  public render(): RxNode {
    if (!this.template.render) throw new Error("Todo - render expected");
    return this.template.render(this.props, this.context);
  }

  static FC = <S extends Attrs, P extends Attrs, C extends Attrs>(
    constructor: RxComponentTemplate<S, P, C>["constructor"],
    consumer: Context<S, P, C>["consumer"] = {} as C
  ) => {
    return (props: Props<P> & { key: string }) =>
      createComponent({ constructor }, { props, context: { consumer } });
  };
}

export const FC = <P extends Attrs = Attrs, C extends Attrs = Attrs>(
  render: RxComponentTemplate<{}, P, C>["render"],
  consumer: Context<{}, P, C>["consumer"] = {} as C
) => {
  const key = generateId();
  return (props: Props<P> = {} as P) =>
    createComponent(
      { render, constructor: Component },
      { props: { key, ...props }, context: { consumer } }
    );
};

export const createComponent = <S = Attrs, P = Attrs, C = Attrs>(
  template: RxComponentTemplate<S, P, C>,
  options: { props: Props<P>; context: Context<S, P, C> }
): RxComponent => {
  const { props, context } = options;

  return {
    type: "component",
    props: createNodeProps(props),
    context: { unsubscribes: [], ...context },
    template: { ...template },
  };
};

type Props<P> = P & NodeProps;
type Context<S, P, C> = RequiredKeys<
  RxComponent<S, P, C>["context"],
  "consumer"
>;
