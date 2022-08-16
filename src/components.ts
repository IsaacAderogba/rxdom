import { Context } from "./context";
import {
  FiberComponent,
  RxComponent,
  RxComponentTemplate,
  RxNode,
} from "./models";
import { Renderer } from "./renderers";
import { ContentProps, Attrs, createContent } from "./utils";

export class Component<
  S extends Attrs = Attrs,
  P extends Attrs = Attrs,
  C extends Attrs = Attrs
> {
  protected state: Readonly<S>;
  protected props: Readonly<P>;
  protected context: Readonly<C>;

  private template!: RxComponentTemplate<S, P, C>;
  private renderer!: Renderer;
  protected fiber!: FiberComponent;

  constructor(props: P = {} as P, context: C = {} as C) {
    this.state = {} as S;
    this.props = props;
    this.context = context;
  }

  init(renderer: Renderer, template: RxComponentTemplate<S, P, C>) {
    this.renderer = renderer;
    this.template = template;
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
  mount(fiber: FiberComponent) {
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

  public render(): RxNode {
    if (!this.template.composer) throw new Error("Todo - composer expected");
    return this.template.composer(this.props, this.context);
  }

  static FC =
    <S extends Attrs, P extends Attrs, C extends Attrs>(
      constructor: RxComponentTemplate<S, P, C>["constructor"],
      context: ComponentContext<C> = {} as C
    ) =>
    (props: ComponentProps<P> = {} as P): RxComponent => {
      return {
        type: "component",
        props: { ...props, content: createContent(props) },
        context,
        template: { constructor },
      };
    };
}

export const FC =
  <P extends Attrs = Attrs, C extends Attrs = Attrs>(
    composer: RxComponentTemplate<{}, P, C>["composer"],
    context: ComponentContext<C> = {} as C
  ) =>
  (props: ComponentProps<P> = {} as P): RxComponent => {
    return {
      type: "component",
      props: { ...props, content: createContent(props) },
      context,
      template: { constructor: Component, composer },
    };
  };

type ComponentProps<P> = P & ContentProps;
type ComponentContext<C> = Record<keyof C, Context>;
