import { FiberComponent, RxComponent, RxNode } from "./models";
import { Renderer } from "./renderers";
import { ContentProps, createContent } from "./utils";

export abstract class Component<P = unknown, S = unknown> {
  protected props!: Readonly<P>;
  protected state!: Readonly<S>;
  protected fiber!: FiberComponent;

  private renderer!: Renderer;

  constructor(props: P) {
    this.props = props;
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
    const child = this.renderer.reconcile(
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
    <P, S>(component: { new (props: P): Component<P, S> }) =>
    (props: ComponentProps<P> = {} as P): RxComponent => {
      const content = createContent(props);
      return { type: "component", component, props: { ...props, content } };
    };
}

export const FC =
  <P>(component: (props: ComponentProps<P>) => RxNode) =>
  (props: ComponentProps<P> = {} as P) =>
    component(props);

type ComponentProps<P> = P & ContentProps;
