import {
  FiberComponent,
  RxComponent,
  RxComponentTemplate,
  RxNode,
} from "./models";
import { Renderer } from "./renderers";
import {
  ContentProps,
  Attrs,
  createContent,
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

  initContext(): C {
    const { unsubscribes, provider, consumer } = this.fiber.node.context;
    if (provider) unsubscribes.push(provider.registerProvider(this.fiber));

    // todo
  }

  unregisterContexts() {
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

  public onMount(): void | (() => void) {}
  mount() {
    setTimeout(() => {
      const onUnmount = this.onMount();
      if (onUnmount) this.onUnmount = onUnmount;
    });
  }

  private onUnmount(): void | (() => void) {}
  public unmount = () => {
    if (this.onUnmount) this.onUnmount();
    this.unregisterContexts();
    console.log("unmount");
  };

  public onUpdate() {}
  private update(node: RxComponent) {
    const child = this.renderer.render(
      this.fiber,
      this.fiber.dom.parentNode as HTMLElement,
      this.fiber.content[0],
      this.render()
    )!;

    this.fiber.dom = child.dom;
    this.fiber.content = [child];
    this.fiber.node = node;

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
    const key = generateId();
    return (props: Props<P> = {} as P) =>
      createComponent({ constructor }, { props, key, context: { consumer } });
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
      { props, key, context: { consumer } }
    );
};

export const createComponent = <S = Attrs, P = Attrs, C = Attrs>(
  template: RxComponentTemplate<S, P, C>,
  options: { props: Props<P>; context: Context<S, P, C>; key: string }
): RxComponent => {
  const { props, context, key } = options;

  return {
    type: "component",
    key,
    props: { ...props, content: createContent(props) },
    context: { unsubscribes: [], ...context },
    template: { ...template },
  };
};

type Props<P> = P & ContentProps;
type Context<S, P, C> = RequiredKeys<
  RxComponent<S, P, C>["context"],
  "consumer"
>;
