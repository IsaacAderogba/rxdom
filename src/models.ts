import { Component } from "./components";
import { Object } from "./utils";

interface RxBase {
  props: Object & { content: RxNode[] };
}

export interface RxComponent extends RxBase {
  type: "component";
  component: { new (props: any): Component };
}

export interface RxFragment extends RxBase {
  type: keyof HTMLElementTagNameMap | "text";
}

export interface RxElement extends RxBase {
  type: "element";
  onUpdate?: (props: { fiber: FiberElement; dom: DOMElement }) => DOMElement;
  dom: DOMElement;
}

export type RxNode = RxFragment | RxComponent | RxElement;

export type DOMElement = HTMLElement | Text;

interface FiberBase {
  dom: DOMElement;
  node: RxNode;
  content: FiberInstance[];
}

export interface FiberComponent extends FiberBase {
  component: Component;
}
export interface FiberFragment extends FiberBase {}
export interface FiberElement extends FiberBase {}

export type FiberInstance = FiberComponent | FiberFragment | FiberElement;
