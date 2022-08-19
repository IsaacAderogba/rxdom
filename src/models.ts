import { Component } from "./components";
import { ContextProvider, ContextUnsubscribe } from "./context";
import { Attrs, ValueOf } from "./utils";

interface RxBase {
  props: Attrs & { content: RxNode[] };
}

export interface RxComponent<S = any, P = any, C = any> extends RxBase {
  type: "component";
  context: {
    provider?: ContextProvider;
    consumer: Record<keyof C, ContextProvider<ValueOf<C>>>;
    unsubscribes: ContextUnsubscribe[];
  };
  template: RxComponentTemplate<S, P, C>;
}

export type RxComponentTemplate<S, P, C> = {
  constructor: { new (props: P, context: C): Component<S, P, C> };
  render?: (props: P, context: C) => RxNode;
};
export interface RxFragment extends RxBase {
  type: keyof HTMLElementTagNameMap | "text";
}

export interface RxElement extends RxBase {
  type: "element";
  template: {
    onUpdate?: (props: { fiber: FiberInstance; dom: DOMElement }) => DOMElement;
    dom: DOMElement;
  };
}

export type RxNode = RxFragment | RxComponent | RxElement;

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

export interface FiberElement extends FiberBase {
  node: RxElement;
}

export type FiberInstance = FiberComponent | FiberFragment | FiberElement;
