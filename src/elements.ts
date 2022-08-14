import { DOMElement, RxElement } from "./models";

export const createElement = (props: ElementProps): RxElement => ({
  element: props.updater,
  dom: props.dom,
  type: "element",
  props: { content: [] },
});

type ElementProps = {
  dom: DOMElement;
  updater?: RxElement["element"];
};
