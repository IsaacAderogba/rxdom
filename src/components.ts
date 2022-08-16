import { Context } from "./context";
import { FiberComponent, RxComponent, RxNode } from "./models";
import { Renderer } from "./renderers";
import { ContentProps, Attrs, createContent } from "./utils";

export abstract class Component<
  S extends Attrs = Attrs,
  P extends Attrs = Attrs,
  C extends Attrs = Attrs
> {
  protected state!: Readonly<S>;
  protected props!: Readonly<P>;
  protected context!: Readonly<C>;

  protected fiber!: FiberComponent;
  private renderer!: Renderer;

  constructor(props: P, context: C) {
    this.props = props;
  }

  initTemplate() {}

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
  mount(renderer: Renderer, fiber: FiberComponent) {
    this.renderer = renderer;
    this.fiber = fiber;
    setTimeout(() => {
      const onUnmount = this.onMount();
      if (onUnmount) this.onUnmount = onUnmount;
    });
  }

  private onUnmount(): void | (() => void) {}
  public unmount = () => {
    if (this.onUnmount) this.onUnmount();
  };

  public onUpdate() {}
  private update(node: RxNode) {
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

  public abstract render(): RxNode;

  static FC =
    <S extends Attrs, P extends Attrs, C extends Attrs>(
      constructor: RxComponent<S, P, C>["template"]["constructor"]
    ) =>
    (
      props: ComponentProps<P> = {} as P,
      context: ComponentContext<C> = {} as C
    ): RxComponent => {
      const content = createContent(props);

      return {
        type: "component",
        props: { ...props, content },
        context,
        template: { constructor },
      };
    };
}

export const FC =
  <P extends Attrs = Attrs>(component: (props: ComponentProps<P>) => RxNode) =>
  (props: ComponentProps<P> = {} as P) =>
    component(props);

type ComponentProps<P> = P & ContentProps;
type ComponentContext<C> = Record<keyof C, Context>;
