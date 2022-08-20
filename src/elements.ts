import { RxElement } from "./models";
import { generateId, RequiredKeys } from "./utils";

export const createElement = (
  template: RequiredKeys<RxElement["template"], "dom">
): RxElement => ({
  type: "element",
  key: generateId(),
  props: { content: [] },
  template: { onUpdate: () => template.dom, ...template },
});
