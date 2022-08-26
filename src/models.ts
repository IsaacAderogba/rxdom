import {
  Component,
  ComponentSpec,
  ContextProvider,
  ContextSelector,
} from "./components";
import { Any, Attrs, NodeProps } from "./utils";

interface RxBase {
  props: Attrs & { content?: RxNode[]; key: string };
}

export interface RxComponent<S = Any, P = Any, C = Any> extends RxBase {
  type: "component";
  context: {
    provider?: ContextProvider;
    consumer: TypedConsumer<C>;
  };
  template: RxComponentTemplate<S, P, C>;
}

type TypedConsumer<C> = {
  [P in keyof C]: ContextSelector<C[P]>;
};

export type RxComponentTemplate<S, P, C> = {
  constructor: {
    new (spec: ComponentSpec): Component<S, P, C>;
  };
  render?: (args: {
    props: NodeProps<P>;
    context: C;
    fiber: FiberComponent;
  }) => RxNode;
};

export interface RxFragment extends RxBase {
  type: keyof HTMLElementTagNameMap | "text" | "element";
}

export type RxNode = RxComponent | RxFragment;

export type DOMElement = HTMLElement | Text;

interface FiberBase {
  dom: DOMElement;
  parent?: FiberInstance;
  content: FiberInstance[];
}

export interface FiberComponent extends FiberBase {
  component: Component;
  node: RxComponent;
}

export interface FiberFragment extends FiberBase {
  node: RxFragment;
}

export type FiberInstance = FiberComponent | FiberFragment;
