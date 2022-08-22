import {
  Component,
  ComponentConfig,
  ContextProvider,
  ContextSelector,
} from "./components";
import { Attrs, NodeProps } from "./utils";

interface RxBase {
  props: Attrs & { content?: RxNode[]; key: string };
}

export interface RxComponent<S = any, P = any, C = any> extends RxBase {
  type: "component";
  context: {
    provider?: ContextProvider;
    consumer: Record<keyof C, ContextSelector>;
  };
  template: RxComponentTemplate<S, P, C>;
}

export type RxComponentTemplate<S, P, C> = {
  constructor: {
    new (config: ComponentConfig): Component<S, P, C>;
  };
  render?: (args: {
    props: NodeProps & P;
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
