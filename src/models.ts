import { Component } from "./components";
import { Object } from "./utils";

export interface RxComponent {
  type: "component";
  props: Object & { content: RxNode[] };
  component: { new (props: any): Component };
}

export interface RxFragment {
  type: keyof HTMLElementTagNameMap | "text";
  props: Object & { content: RxNode[] };
}

export interface RxElement {
  type: "element";
  props: Object & { content: RxNode[] };
  element?: (props: { fiber: FiberElement; dom: DOMElement }) => DOMElement;
  dom: DOMElement;
}

export type RxNode =  RxFragment | RxComponent | RxElement;

export type DOMElement = HTMLElement | Text;

export type FiberComponent = {
  dom: DOMElement;
  node: RxNode;
  content: FiberInstance[];
  component: Component;
};

export type FiberFragment = {
  dom: DOMElement;
  node: RxNode;
  content: FiberInstance[];
};

export type FiberElement = {
  dom: DOMElement;
  node: RxNode;
  content: FiberInstance[];
};

export type FiberInstance = FiberComponent | FiberFragment | FiberElement;
