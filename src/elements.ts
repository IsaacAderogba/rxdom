import { RxElement } from "./models";
import { createNodeProps, RequiredKeys } from "./utils";

export const createElement = (
  template: RequiredKeys<RxElement["template"], "dom">
): RxElement => ({
  type: "element",
  props: createNodeProps({}),
  template: { onUpdate: () => template.dom, ...template },
});
