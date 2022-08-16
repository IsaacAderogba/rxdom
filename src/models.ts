import { Component } from "./components";
import { ContextProvider } from "./context";
import { Attrs } from "./utils";

interface RxBase {
  props: Attrs & { content: RxNode[] };
}

export interface RxComponent<S = any, P = any, C = any> extends RxBase {
  type: "component";
  context: Record<keyof C, ContextProvider>;
  template: RxComponentTemplate<S, P, C>;
}

export type RxComponentTemplate<S, P, C> = {
  constructor: { new (props: P, context: C): Component<S, P, C> };
  render?: (props: P, context: C) => RxNode;
  provider?: ContextProvider;
};
export interface RxFragment extends RxBase {
  type: keyof HTMLElementTagNameMap | "text";
}

export interface RxElement extends RxBase {
  type: "element";
  template: {
    onUpdate?: (props: { fiber: FiberElement; dom: DOMElement }) => DOMElement;
    dom: DOMElement;
  };
}

export type RxNode = RxFragment | RxComponent | RxElement;

export type DOMElement = HTMLElement | Text;

interface FiberBase {
  dom: DOMElement;
  node: RxNode;
  parent?: FiberInstance;
  content: FiberInstance[];
}

export interface FiberComponent extends FiberBase {
  component: Component;
}
export interface FiberFragment extends FiberBase {}
export interface FiberElement extends FiberBase {}

export type FiberInstance = FiberComponent | FiberFragment | FiberElement;
