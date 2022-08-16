import { RxElement } from "./models";

export const createElement = (template: RxElement["template"]): RxElement => ({
  type: "element",
  props: { content: [] },
  template,
});
