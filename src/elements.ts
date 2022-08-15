import { DOMElement, RxElement } from "./models";

export const createElement = (props: ElementProps): RxElement => ({
  onUpdate: props.onUpdate,
  dom: props.dom,
  type: "element",
  props: { content: [] },
});

type ElementProps = {
  dom: DOMElement;
  onUpdate?: RxElement["onUpdate"];
};
